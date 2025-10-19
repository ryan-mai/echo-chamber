function setWorld(worldState) {
    let signal = 100;


    function signalWave(container, opts = {}) {
        const width = opts.width ?? 500;
        const height = opts.height ?? 50;
        const SEGMENTS = opts.segments ?? 80;
        const segWidth = width / SEGMENTS;
        const segHeight = opts.segmentHeight ?? 6;
        const baseY = (height / 2);
        const segs = [];

        const clamp01 = (n) => Math.max(0, Math.min(1, n));
        const lerp01 = (a, b, t) => a + (b - a) * t;
        let phase = 0;
        let amp = 0;
        let cycles = 0.5;
        let phaseSpeed = 0;

        const MAX_AMP = (height / 2) - segHeight;

        for (let i = 0; i < SEGMENTS; i++) {
            const seg = container.add([
                rect(segWidth - 1, segHeight, {radius: 0}),
                pos(i * segWidth, baseY - segHeight / 2),
                color(0, 200, 0),
                anchor('left'),
                fixed()
            ]);
            segs.push(seg);
        }

        const jitter = Array(SEGMENTS).fill(0);
        let noiseTime = 0;
        const SLOW_NOISE_MAG = 10;
        const SPIKE_MAX_MAG = MAX_AMP * 2.0;
        const MIN_SPIKE_GAP = 0.05;
        const MAX_SPIKE_GAP = 1.0;
        const MIN_SPIKE_WIDTH = 2;
        const MAX_SPIKE_WIDTH = 6;

        function addSpike(centerIndx, width, strength) {
            const half = Math.floor(width / 2);
            for (let i = centerIndx - half; i <= centerIndx + half; i++ ) {
                if (i < 0 || i >= SEGMENTS) continue;

                const w = 1 - (Math.abs(i - centerIndx) / (half || 1));
                const target = strength * w;

                tween(jitter[i], target, 0.08, (v) => (jitter[i] = v), easings.easeOutCirc);
                wait(0.1, () => {
                    tween(jitter[i], 0, 0.25, (v) => (jitter[i] = v), easings.easeInQuad);
                });
            }
        }

        function nextSpike() {
            wait(rand(MIN_SPIKE_GAP, MAX_SPIKE_GAP), () => {
                const center = Math.floor(rand(1, SEGMENTS - 1));
                const width = Math.floor(rand(MIN_SPIKE_WIDTH, MAX_SPIKE_WIDTH + 1));
                const strength = rand(-SPIKE_MAX_MAG, SPIKE_MAX_MAG);
                addSpike(center, width, strength);
                nextSpike();
            });
        }
        let lastSignal = -1;
        function retargetSignal() {
            const n = clamp01(signal / 100);
            const tAmp = MAX_AMP * easings.easeOutSine(n);
            const tCycles = lerp01(0.5, 6, easings.easeInCubic(n));
            const tSpeed = lerp01(5.0, 10, easings.easeInOutSine(n));

            tween(amp, tAmp, 0.45, (v) => (amp = v), easings.easeOutSine);
            tween(cycles, tCycles, 0.45, (v) => (cycles = v), easings.easeOutSine);
            tween(phaseSpeed, tSpeed, 0.45, (v) => (phaseSpeed = v), easings.easeOutSine);
        }

        retargetSignal();
        lastSignal = signal;

        nextSpike();

        onUpdate(() => {
            if (signal !== lastSignal) {
                retargetSignal();
                lastSignal = signal;
            }
            
            phase += dt() * phaseSpeed;
            noiseTime += dt();

            for (let i = 0; i < SEGMENTS; i++) {
                const theta = (i / SEGMENTS) * Math.PI * 2 * cycles + phase;
                const base = Math.sin(theta) * amp;

                const slowJitter = Math.sin(i * 0.55 + noiseTime * 0.8) * (SLOW_NOISE_MAG * 0.7) + Math.sin(i * 1.25 + noiseTime * 0.35 + 1.7) * (SLOW_NOISE_MAG * 0.3);
                const spike = jitter[i];

                let yOff = base + slowJitter + spike;
                yOff = Math.max(-MAX_AMP, Math.min(MAX_AMP, yOff));
                segs[i].pos.y = baseY + yOff - segHeight / 2;
                segs[i].opacity = 1;
            }
        });

        return {segs};
    }

    const signalContainer = add([
        rect(500, 50, { radius: 8 }),
        area(),
        pos(40, 100),
        opacity(0),
        color(200, 0, 0),
        fixed()
    ]);

    const wave = signalWave(signalContainer, {width: 500, height: 50, segments: 48, segmentHeight: 6});

    function dropSignal() {
        const MAX_WIDTH = 500;
        const startPercent = (signalBar.width / MAX_WIDTH) * 100;
        tween(startPercent, signal, 1, (val) => {
            signalBar.width = (MAX_WIDTH * val) / 100;
        }, easings.easeOutSine);
    }


    const startCount = add([
        rect(100, 100),
        pos(center().x, center().y),
        area(),
        opacity(0),
        anchor("center"),
        fixed()
    ]);

    const startText = startCount.add([
        text('3', {
            font: 'sf'
        }),
        scale(3),
        color(255, 65, 65),
        area(),
        anchor('center'),
        { timeLeft: 4 },
        fixed()
    ]);
    let isStart = false;

    let countdownInterval = null;
    
    function startCounter() {
        if (countdownInterval) return;
        countdownInterval = setInterval(() => {
            if (signal === 0) {
                clearInterval(countdownInterval);
                countdownInterval = null;
                gameOver = true
                return
            }
            signal -= 5;
            debug.log(signal);
            // dropSignal();
        }, 2000);
    }
    const startInterval = setInterval(() => {
        startText.timeLeft--;
        if (startText.timeLeft === 0) {
            startText.text = 'MESSAGE HER!';
        } else if (startText.timeLeft < 0) {
            isStart = true;
            clearInterval(startInterval);
            destroy(startCount);
            startCounter();
            return;
        } else {
            startText.text = String(startText.timeLeft);
        }
    }, 1000);

    const chatboxContainer = add([
        sprite('phone'),
        area(),
        scale(1.5),
        pos(720 - 150, 50),
        opacity(1),
        fixed()
    ]);

    function getResolvedSize(ent) {
        const spr = ent.sprite;
        const sprW = spr?.width ?? spr?.frameWidth ?? null;
        const sprH = spr?.height ?? spr?.frameHeight ?? null;
        const sc = (typeof ent.scale === 'number') ? { x: ent.scale, y: ent.scale } : (ent.scale ?? { x: 1, y: 1 });
        const scaleX = sc.x ?? 1;
        const scaleY = sc.y ?? sc.x ?? 1;
        const w = (sprW != null) ? sprW * scaleX : (ent.width ?? 0);
        const h = (sprH != null) ? sprH * scaleY : (ent.height ?? 0);
        return { w, h };
    }

    const rightFrame = chatboxContainer.add([
        sprite("bubble-right-100"),
        scale(0.65),
        pos(30, 150),
        fixed()
    ]);

    const rightText = rightFrame.add([
        text('Child, you better explain yourself!', {
            font: 'sf',
            align: "left",
        }),
        anchor("center"),
        scale(0.65),
        pos(0, 0),
    ]);

    // const optFrame = chatboxContainer.add([
    //     sprite('options'),
    //     scale(1),
    //     pos(15, chatboxContainer.pos.y + 150),
    //     fixed(),
    // ])

    wait(0, () => {
        const { w, h } = getResolvedSize(rightFrame);
        rightText.pos = vec2(w / 2, h / 2);
    });

    function messageMom() {
        if (!selectedChoice) return;

        let frame = chatboxContainer.add([
            rect(498, 65, { radius: 8 }),
            color(0, 180, 0),
            pos(190, 100),
            layer('ui'),
            fixed()
        ]);
        let message = frame.add([
            text('...', {
                align: "left",
            }),
            anchor("center"),
            scale(0.8),
            pos(498 / 2, 65 / 2),  
        ]);
        if (selectedChoice === 1) {
            message.text = 'Ok I will when I get home...'
        } else if (selectedChoice === 2) {
            message.text = 'Mom, you\'re being overdramatic!'
        } else {
            message.text = 'What do you mean?';
        }
    }

    let initialTime = 0;
    let songJSON = null;
    fetch('/songs.json')
        .then((res) => {
            if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
            return res.json();
        })
        .then((data) => {
            songJSON = data;
            // debug.log(`Songs loaded: ${JSON.stringify(songJSON[0], null, 2)}`);
            startSong(songJSON[0])
        })
        .catch((err) => {
            debug.log(`Failed to load: ${err}`);
        })
    const leftHand = add([
        sprite('g-left'),
        area({
            shape: new Rect(vec2(0, 0), 30, 55),
            offset: vec2(15, 5),
        }),
        body({isStatic: true}),
        pos(175, 720 - 200),
        scale(1.5),
        'left']);
    const rightHand = add([
        sprite('g-right'),
        area({
            shape: new Rect(vec2(0, 0), 30, 55),
            offset: vec2(15, 5),
        }),
        body({isStatic: true}),
        pos(445, 720 - 200),
        scale(1.5),
        'right']);
    const upHand = add([
        sprite('g-up'),
        area({
            shape: new Rect(vec2(0, 0), 30, 55),
            offset: vec2(15, 5),
        }),
        body({isStatic: true}),
        pos(355, 720 - 200),
        scale(1.5),
        'up']);
    const downHand = add([
        sprite('g-down'),
        area({
            shape: new Rect(vec2(0, 0), 30, 55),
            offset: vec2(15, 5),
        }),
        body({isStatic: true}),
        pos(265, 720 - 200),
        scale(1.5),
        'down']);
    const leftRGB = add([
        sprite('rgb-left'),
        body({isStatic: true}),
        pos(175, 720 - 206),
        scale(1.5),
        opacity(0),
        'rgb-left']);
    const rightRGB = add([
        sprite('rgb-right'),
        body({isStatic: true}),
        pos(445, 720 - 209),
        scale(1.5),
        opacity(0),
        'rgb-right']);
    const upRGB = add([
        sprite('rgb-up'),
        body({isStatic: true}),
        pos(355, 720 - 210),
        scale(1.5),
        opacity(0),
        'rgb-up']);
    const downRGB = add([
        sprite('rgb-down'),
        body({isStatic: true}),
        pos(265, 720 - 209),
        scale(1.5),
        opacity(0),
        'rgb-down']);

    const options = ['left','down','up','right'];
    const xOptionPos = [175,265,355,445]
    let spawnInterval = 1.4;
    const MIN_SPAWN_INTERVAL = 0.45;
    const SPEED_GROWTH_CAP = 400;
    const SPEED_GROWTH_STEP = 40;
    let fallSpeed = 220;

    function beatsToSecond(beat, bpm, offset) {
        return beat * (60.0 / bpm) + offset;
    }
    
    function getRandomInt(min = 0, max) {
        const minCeil = Math.ceil(min);
        const maxFloor = Math.floor(max)
        return Math.floor(Math.random() * (maxFloor - minCeil) + minCeil);
    }

    let audio = null
    let songStartTime = null;
    let currentSong = null;
    let lastBeat = -1;
    // async function startSong(song) {
    //     if (!song) return;

    //     // audio = new Audio(song.file);
    //     // await audio.play();
    //     songStartTime = performance.now() / 1000;
    //     debug.log("What did I miss???")

    //     currentSong = song;
    //     const spawnY = 720 - 600;
    //     const targetY = 720 - 200;
    //     const travelTime = Math.abs(targetY - spawnY) / fallSpeed;

    //     for (const note of song.notes) {
    //         const hitTime = beatsToSecond(note.beat, song.bpm, song.offset);
    //         const spawnTime = hitTime - travelTime;
    //         scheduleNote(note, spawnTime);
    //     }
    // }

    // function scheduleNote(note, spawnTime) {
    //     const delay = Math.max(0, (spawnTime - getSongTime()) * 1000);
    //     setTimeout(() => {
    //         spawnNoteAtLane(note.direction, note.lane, beatsToSecond(note.beat, currentSong.bpm, currentSong.offset))
    //     }, delay);
    // }

    // function getSongTime() {
    //     return (performance.now()/ 1000) - songStartTime;
    // }


    function spawnNoteAtLane(hitTime = null) {
        const index = getRandomInt(0, options.length);
        const arrowType = options[index];
        const xPos = xOptionPos[index];
        // debug.log(dir, lane);
        const arrow = add([
            sprite(`rgb-${arrowType}`),
            area({
                shape: new Rect(vec2(0, 0), 30, 55),
                offset: vec2(15, 5),
            }),
            pos(xPos, 720 - 600),
            scale(1.5),
            {   speed: fallSpeed,
                type: arrowType,
                spawnTime: initialTime,
                hitTime: hitTime,
             },
            'signal',
        ]);

        spawnInterval = Math.max(MIN_SPAWN_INTERVAL, spawnInterval - 0.02);
        fallSpeed = Math.min(SPEED_GROWTH_CAP, fallSpeed + SPEED_GROWTH_STEP * 0.02);
        wait(rand(spawnInterval * 0.9, spawnInterval * 1.1), spawnNoteAtLane);
    }

    wait(spawnInterval, spawnNoteAtLane);
    
    onUpdate('signal', (arrow) => {
        arrow.move(0, arrow.speed);
        if (arrow.pos.y > 720) {
            destroy(arrow)
        }
    });

    // onUpdate(() => {
    //     if (!currentSong) return;
    //     const time = getSongTime();
    //     const currentBeat = time / (60 / currentSong.bpm);
    //     if (Math.floor(currentBeat !== lastBeat)) {
    //         // debug.log(`Beat: ${Math.floor(currentBeat)}`);
    //         lastBeat = Math.floor(currentBeat);
    //     }
    // })
    onUpdate(() => {
        initialTime += dt();
        leftRGB.opacity = rightRGB.opacity = upRGB.opacity = downRGB.opacity = 0;
        if (activeDir === 'left') leftRGB.opacity = 1;
        else if (activeDir === 'right') rightRGB.opacity = 1;
        else if (activeDir === 'up') upRGB.opacity = 1;
        else if (activeDir === 'down') downRGB.opacity = 1;
    });

    let dirTime = 0
    const THRESHOLDS = {
        perfect: 0.025,
        great: 0.045,
        good: 0.2,
        bad: 0.3,
        miss: 0.5,
    }

    for (const dir of options) {
        onCollideUpdate('signal', dir, (note, hand) => {
            const currentTime = (songStartTime != null && currentSong)
                ? ((performance.now() / 1000) - songStartTime)
                : initialTime;
            
            if (activeDir !== dir || note.type !== dir) return

            const SPAWN_Y = 720 - 600;
            const TARGET_Y= hand.pos.y;
            let expectedTime;

            if (typeof note.hitTime === 'number') {
                expectedTime = note.hitTime;
            } else if (typeof note.spawnTime === 'number') {
                const travelTime = Math.abs(TARGET_Y - SPAWN_Y) / note.speed;
                expectedTime = note.spawnTime + travelTime;
            } else {
                const travelTime = Math.abs(TARGET_Y - note.pos.y) / note.speed;
                expectedTime = currentTime + travelTime;
            }

            const diff = Math.abs(currentTime - expectedTime);

            
            if (diff <= THRESHOLDS.perfect && signal <= 97) signal += 3;
            else if (diff <= THRESHOLDS.great && signal <= 98) signal += 2;
            else if (diff <= THRESHOLDS.good && signal <= 99) signal += 1;
            else signal--;

            destroy(note);
        });
    }
    debug.inspect = true;

    const keyDirMap = {
        up: 'up', w: 'up',
        down: 'down', s: 'down',
        left: 'left', a: 'left',
        right: 'right', d: 'right',
    }

    const messageMap = {
        1: 1,
        2: 2,
        3: 3,
    }

    let activeDir = null;
    let selectedChoice = null;

    for (const key of Object.keys(keyDirMap)) {
        onKeyDown(key, () => {
            if (activeDir) return;
            activeDir = keyDirMap[key];
        });
        onKeyRelease(key, () => {
            if (keyDirMap[key] === activeDir) {
                activeDir = null;
            }
        });
    }

    onUpdate(() => setCursor("default"));

    function addButton(
        p = vec2(200, 100),
        f = () => debug.log("hello"),
    ) {
        const btn = chatboxContainer.add([
            rect(247, 40, {radius: 4}),
            pos(p),
            area(),
            scale(1),
            anchor("center"),
            outline(0),
            color(255, 255, 255),
        ]);

        btn.add([
            anchor("center"),
            color(0, 0, 0),
        ]);


        btn.onHoverUpdate(() => {
            const t = time() * 10;
            btn.color = hsl2rgb((t / 10) % 1, 0.6, 0.7);
            btn.scale = vec2(1.05);
            setCursor("pointer");
        });

        btn.onHoverEnd(() => {
            btn.scale = vec2(1);
            btn.color = rgb();
        });

        btn.onClick(f);

        return btn;
    }

    addButton(vec2(172, 278 - 46), () => selectedChoice = 0);
    addButton(vec2(172, 278), () => selectedChoice = 1);
    addButton(vec2(172, 278 + 45), () => selectedChoice = 2);
    addButton(vec2(172, 278 + 45 * 2), () => selectedChoice = 3);
    // addButton(vec2(200, 200), () => selectedChoice = 1);

    for (const key of Object.keys(messageMap)) {
        debug.log(key)
        onKeyDown(key, () => {
            if (selectedChoice) return;
            selectedChoice = messageMap[key];
            messageMom();
        });
        onKeyRelease(key, () => {
            if (messageMap[key] === selectedChoice) {
                selectedChoice = null;
            }
        });
    }

}