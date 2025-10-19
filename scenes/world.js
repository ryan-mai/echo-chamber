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

        let lastSignal = -1;
        function retargetSignal() {
            const n = clamp01(signal / 100);
            const tAmp = MAX_AMP * easings.easeOutSine(n);
            const tCycles = lerp01(0.5, 6, easings.easeInCubic(n));
            const tSpeed = lerp01(0.0, 10, easings.easeInOutSine(n));

            tween(amp, tAmp, 0.45, (v) => (amp = v), easings.easeOutSine);
            tween(cycles, tCycles, 0.45, (v) => (cycles = v), easings.easeOutSine);
            tween(phaseSpeed, tSpeed, 0.45, (v) => (phaseSpeed = v), easings.easeOutSine);
        }

        retargetSignal();
        lastSignal = signal;

        onUpdate(() => {
            if (signal !== lastSignal) {
                retargetSignal();
                lastSignal = signal;
            }
            
            phase += dt() * phaseSpeed;

            for (let i = 0; i < SEGMENTS; i++) {
                const theta = (i / SEGMENTS) * Math.PI * 2 * cycles + phase;
                const yOff = Math.sin(theta) * amp;
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


    const counter = add([
        rect(100, 100, { radius: 8 }),
        pos(center().x, center().y - 300),
        color(10, 10, 10),
        area(),
        anchor("center"),
        layer('ui'),
        fixed()
    ]);

    const count = counter.add([
        text('60'),
        area(),
        anchor('center'),
        { timeLeft: 61 },
        layer('ui'),
        fixed()
    ]);

    const startCount = add([
        rect(100, 100),
        pos(center().x, center().y),
        area(),
        opacity(0),
        anchor("center"),
        fixed()
    ]);

    const startText = startCount.add([
        text('3'),
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
        }, 5000);
    }
    const startInterval = setInterval(() => {
        startText.timeLeft--;
        if (startText.timeLeft === 0) {
            startText.text = 'GO TEXT!';
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
        rect(650, 550, { radius: 8 }),
        area(),
        pos(720 - 125, 100),
        color(0, 0, 0),
        layer('ui'),
        opacity(0),
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
        scale(1),
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
    if (isStart) {
    async function startSong(song) {
        if (!song) return;

        // audio = new Audio(song.file);
        // await audio.play();
        songStartTime = performance.now() / 1000;
        debug.log("What did I miss???")

        currentSong = song;
        const spawnY = 720 - 600;
        const targetY = 720 - 200;
        const travelTime = Math.abs(targetY - spawnY) / fallSpeed;

        for (const note of song.notes) {
            const hitTime = beatsToSecond(note.beat, song.bpm, song.offset);
            const spawnTime = hitTime - travelTime;
            scheduleNote(note, spawnTime);
        }
    }

    function scheduleNote(note, spawnTime) {
        const delay = Math.max(0, (spawnTime - getSongTime()) * 1000);
        setTimeout(() => {
            spawnNoteAtLane(note.direction, note.lane, beatsToSecond(note.beat, currentSong.bpm, currentSong.offset))
        }, delay);
    }

    function getSongTime() {
        return (performance.now()/ 1000) - songStartTime;
    }

    function spawnNoteAtLane(dir = 'up', lane, hitTime = null) {
        const arrowType = dir || 'up';
        const xPos = xOptionPos[lane] || xOptionPos[2];
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

        // spawnInterval = Math.max(MIN_SPAWN_INTERVAL, spawnInterval - 0.02);
        // fallSpeed = Math.min(SPEED_GROWTH_CAP, fallSpeed + SPEED_GROWTH_STEP * 0.02);
        // wait(rand(spawnInterval * 0.9, spawnInterval * 1.1), spawnNoteAtLane);
    }

    // wait(spawnInterval, spawnNoteAtLane);
    
    onUpdate('signal', (arrow) => {
        arrow.move(0, arrow.speed);
        if (arrow.pos.y > 720) {
            destroy(arrow)
        }
    });

    onUpdate(() => {
        if (!currentSong) return;
        const time = getSongTime();
        const currentBeat = time / (60 / currentSong.bpm);
        if (Math.floor(currentBeat !== lastBeat)) {
            // debug.log(`Beat: ${Math.floor(currentBeat)}`);
            lastBeat = Math.floor(currentBeat);
        }
    })
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
        perfect: 0.08,
        great: 0.15,
        good: 0.25,
        bad: 0.3,
        miss: 0.5,
    }

    for (const dir of options) {
        onCollideUpdate('signal', dir, (signal, hand) => {
            dirTime += dt();
            if (activeDir === dir && signal.type === dir) {
                let diff;
                if (signal.hitTime != null) {
                    diff = Math.abs(getSongTime() - signal.hitTime);
                } else if (signal.spawnTime != null) {
                    const spawnY = 720 - 600;
                    const targetY = hand.pos.y;
                    const estimatedTime = Math.abs(targetY - spawnY) / signal.speed;
                    diff = Math.abs((signal.spawnTime + estimatedTime) - initialTime);
                } else {
                    diff = Math.abs(signal.pos.y - hand.pos.y) / signal.speed;
                }

                if (diff <= THRESHOLDS.perfect) {
                    debug.log(`Perfect! - ${diff.toFixed(2)}s`);
                } else if (diff <= THRESHOLDS.great) {
                    debug.log('Great', diff.toFixed(3));
                } else if (diff <= THRESHOLDS.good) {
                    debug.log('Good', diff.toFixed(3));
                } else if (diff <= THRESHOLDS.miss) {
                    debug.log('Late/Early', diff.toFixed(3));
                } else {
                    debug.log('Miss', diff.toFixed(3));
                }

                destroy(signal);
            }
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
}