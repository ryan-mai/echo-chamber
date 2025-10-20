function setWorld(worldState) {
    let signal = 100;
    let gameOver = false;

    // const DIALOGUE = {
    //     apologize: {
    //         best: ["I'm sorry...I know I'm in the wrong."],
    //         good: ["I messed up :("],
    //         neutral: ["Can we talk about this later?"],
    //         bad: ["Bro, your doing too much"],
    //         noop: ["..."]
    //     },
    //     deflect: {
    //         best: ["Mom, it was all a confusion"],
    //         good: ["It was a misunderstanding."],
    //         neutral: ["Really why now?"],
    //         bad: ["It's all the teacher's fault!!!"],
    //         noop: ["..."]
    //     },
    //     joke: {
    //         best: ["Mom! I'll be aware that being honest is also graded"],
    //         good: ["Bad joke, good lesson."],
    //         neutral: ["I was going to make a joke..."],
    //         bad: ["Mom, the cheat sheet was open source ;)"],
    //         noop: ["[Insert meme]"]
    //     },
    //     stall: {
    //         best: ["I'm on the subway. I'll call you when I get home"],
    //         good: ["Wait, my teacher is not online right now!"],
    //         neutral: ["Can we talk later?"],
    //         bad: ["You are embarassing me in front of my friends bruh..."],
    //         noop: ["..."]
    //     }
    // };

    // const MOM_REPLIES = {
    //     best: ["Ok. I am expecting the best of you!"],
    //     good: ["I better hear good things when you get come"],
    //     neutral: ["We'll talk later."],
    //     bad: ["Unacceptable."],
    //     noop: ["Are you avoiding me?"]
    // };

    // function clamp(value, low = 0, high = 1) { return Math.max(low, Math.min(high, value))}
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
        pos(300, 100),
        scale(1.5),
        opacity(0),
        color(200, 0, 0),
        fixed()
    ]);

    const wave = signalWave(signalContainer, {width: 500, height: 50, segments: 48, segmentHeight: 6});

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

    const timerBox = add([
        rect(140, 40, { radius: 8 }),
        pos(center().x, 20),
        anchor("top"),
        color(0, 0, 0),
        opacity(0.65),
        fixed(),
        area(),
    ]);
    const timerText = timerBox.add([
        text('01:00', { font: 'sf' }),
        anchor('center'),
        color(255, 255, 255),
        pos(0, 20),
    ]);

    const SURVIVE_TIME = 60;
    let timeLeft = SURVIVE_TIME;
    timerText.text = fmtTime(timeLeft);

    function fmtTime(t) {
        const s = Math.max(0, Math.ceil(t));
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }

    function startCounter() {
        if (countdownInterval) return;
        countdownInterval = setInterval(() => {
            if (gameOver) {
                clearInterval(countdownInterval);
                countdownInterval = null;
                return;
            }
            if (signal <= 0) {
                clearInterval(countdownInterval);
                countdownInterval = null;
                debug.log('YOU FAILED HUMANITY! THEY NEED WIFI TO CODE FOR SIEGE BRUH')
                gameOver = true;
            }
            signal = Math.max(0, signal - 5);
        }, 2000);

        if (!gameOver) spawnNoteAtLane();
    }
    const startInterval = setInterval(() => {
        startText.timeLeft--;
        if (startText.timeLeft === 0) {
            startText.text = 'SEND 0s & 1s!';
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

    // const chatboxContainer = add([
    //     sprite('phone'),
    //     area(),
    //     scale(1.5),
    //     pos(720 - 150, 50),
    //     opacity(1),
    //     fixed()
    // ]);

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
        pos(475, 720 - 200),
        scale(1.5),
        'left']);
    const rightHand = add([
        sprite('g-right'),
        area({
            shape: new Rect(vec2(0, 0), 30, 55),
            offset: vec2(15, 5),
        }),
        body({isStatic: true}),
        pos(745, 720 - 200),
        scale(1.5),
        'right']);
    const upHand = add([
        sprite('g-up'),
        area({
            shape: new Rect(vec2(0, 0), 30, 55),
            offset: vec2(15, 5),
        }),
        body({isStatic: true}),
        pos(655, 720 - 200),
        scale(1.5),
        'up']);
    const downHand = add([
        sprite('g-down'),
        area({
            shape: new Rect(vec2(0, 0), 30, 55),
            offset: vec2(15, 5),
        }),
        body({isStatic: true}),
        pos(565, 720 - 200),
        scale(1.5),
        'down']);
    const leftRGB = add([
        sprite('rgb-left'),
        body({isStatic: true}),
        pos(475, 720 - 206),
        scale(1.5),
        opacity(0),
        'rgb-left']);
    const rightRGB = add([
        sprite('rgb-right'),
        body({isStatic: true}),
        pos(745, 720 - 209),
        scale(1.5),
        opacity(0),
        'rgb-right']);
    const upRGB = add([
        sprite('rgb-up'),
        body({isStatic: true}),
        pos(655, 720 - 210),
        scale(1.5),
        opacity(0),
        'rgb-up']);
    const downRGB = add([
        sprite('rgb-down'),
        body({isStatic: true}),
        pos(565, 720 - 209),
        scale(1.5),
        opacity(0),
        'rgb-down']);

    const options = ['left','down','up','right'];
    const xOptionPos = [475,565,655,745]
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
    async function startSong(song) {
        if (!song) return;

        audio = new Audio(song.file);
        await audio.play();
        songStartTime = performance.now() / 1000;
        debug.log("What did I miss???")

        currentSong = song;

    }

    function spawnNoteAtLane(hitTime = null) {
        if (gameOver || !isStart) return;
        const index = getRandomInt(0, options.length);
        const arrowType = options[index];
        const xPos = xOptionPos[index];
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
        wait(rand(spawnInterval * 0.9, spawnInterval * 1.1), () => {
            if (!gameOver) spawnNoteAtLane();
        });
    }

    onUpdate(() => {
        initialTime += dt();
        if (isStart && !gameOver) {
            timeLeft -= dt();
            timerText.text = fmtTime(timeLeft);
            if (timeLeft <= 0) {
                gameOver = true;
                timerText.text = "00:00";
                debug.log("YOU FIXED A BUG IN THE MATRIX!?!")
            }
        }
        leftRGB.opacity = rightRGB.opacity = upRGB.opacity = downRGB.opacity = 0;
        if (activeDir === 'left') leftRGB.opacity = 1;
        else if (activeDir === 'right') rightRGB.opacity = 1;
        else if (activeDir === 'up') upRGB.opacity = 1;
        else if (activeDir === 'down') downRGB.opacity = 1;
    });

    let dirTime = 0
    const THRESHOLDS = {
        perfect: 0.03,
        great: 0.05,
        good: 0.2,
        bad: 0.3,
        miss: 0.5,
    }


    onUpdate('signal', (note) => {
        if (gameOver || !isStart) return;
        note.pos.y += note.speed * dt();

        const targetY = 720 - 200;
        if (note.pos.y > targetY + 30) {
            // recordLastHits('miss');
            signal = Math.max(0, signal - 2);
            destroy(note);
        }
    });
    
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

            // let judge = 'miss';
            // if (diff <= THRESHOLDS.perfect) judge = 'perfect';
            // else if (diff <= THRESHOLDS.great) judge = 'great';
            // else if (diff <= THRESHOLDS.good) judge = 'good';
            // else if (diff <= THRESHOLDS.bad) judge = 'bad';
            // recordLastHits(judge);

            if (diff <= THRESHOLDS.perfect && signal <= 97) {
                signal += 3,
                debug.log('Perfect!');
            } else if (diff <= THRESHOLDS.great && signal <= 98) signal += 2;
            else if (diff <= THRESHOLDS.good && signal <= 99) signal += 1;
            else signal -= 5;

            destroy(note);
        });
    }
    // debug.inspect = true;

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
    // let selectedChoice = null;


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

    // onUpdate(() => setCursor("default"));

    // function addButton(
    //     p = vec2(200, 100),
    //     label = '???',
    //     f = () => debug.log("6767"),
    // ) {
    //     const btn = chatboxContainer.add([
    //         rect(40, 40, {radius: 4}),
    //         pos(p),
    //         area(),
    //         scale(1),
    //         anchor("center"),
    //         outline(0),
    //         color(255, 255, 255),
    //     ]);

    //     btn.add([
    //         text(label, {
    //             font: 'sf',
    //             size: 18
    //         }),
    //         anchor("center"),
    //         color(0, 0, 0),
    //     ]);


    //     btn.onHoverUpdate(() => {
    //         const t = time() * 10;
    //         btn.color = hsl2rgb((t / 10) % 1, 0.6, 0.7);
    //         btn.scale = vec2(1.05);
    //         setCursor("pointer");
    //     });

    //     btn.onHoverEnd(() => {
    //         btn.scale = vec2(1);
    //         btn.color = rgb();
    //     });

    //     btn.onClick(() => {
    //         if (!isStart) return;
    //         f();
    //     });

    //     return btn;
    // }

    // const buttonPos = [
    //     vec2(345, 100),
    //     vec2(345 + 45, 100),
    //     vec2(345, 100 + 45),
    //     vec2(345 + 45, 100 + 45)
    // ]
    // let topicOrder = ['apologize', 'deflect', 'joke', 'stall'];
    // let topicButtons = [];
    // const topicMap = {
    //     '1': 'apologize',
    //     '2': 'deflect',
    //     '3': 'joke',
    //     '4': 'stall',
    // }

    // function shuffle(arr) {
    //     for (let i = arr.length - 1; i > 0; i--) {
    //         const j = Math.floor(rand(0, i + 1));
    //         const temp = arr[i];
    //         arr[i] = arr[j];
    //         arr[j] = temp;
    //     }
    //     return arr;
    // }
    // function randomizeButtons() {
    //     for (const button of topicButtons) {
    //         try { destroy(button); }
    //         catch(err) { debug.log(err); }
    //     }
    //     topicButtons = [];
    //     topicOrder = shuffle(topicOrder.slice());
    //     const keyOrder = ['1', '2', '3', '4'];
    //     for (let i = 0; i < topicOrder.length; i++) {
    //         const topic = topicOrder[i];
    //         topicMap[keyOrder[i]] = topic;

    //         const btn = addButton(buttonPos[i], '???', () => {
    //             if (!isStart || isSending) return;
    //             sendMsg(topic);
    //         });
    //         topicButtons.push(btn);
    //     }
    // }
    // randomizeButtons();
    // function norm01(n, low = 0, high = 100) {return clamp((n - low) / (high - low), 0, 1);}

    // const lastHits = [];
    // const scoreValues = {
    //     perfect: 1.0,
    //     great: 0.7,
    //     good: 0.4,
    //     bad: 0.2,
    //     miss: 0.0
    // }

    // function recordLastHits(value) {
    //     lastHits.push(value)
    //     if (lastHits.length > 3) lastHits.shift();
    // }

    // function perfectThree() {
    //     return lastHits.length === 3 && lastHits.every(val => val === 'perfect');
    // }

    // function averageHits() {
    //     if (lastHits.length === 0) return 0;
    //     const sum = lastHits.reduce((s, j) => s + (scoreValues[j] ?? 0), 0);
    //     return sum / lastHits.length;
    // }   

    // function weighted(weights) {
    //     let prob = rand(0, 1);
    //     for (const [key, value] of Object.entries(weights)) {
    //         if (prob <= value) return key;
    //         prob -= value;
    //     }

    //     const keys = Object.keys(weights);
    //     return keys[keys.length - 1];
    // }

    // function bestOdds() {
    //     if (perfectThree()) {
    //         return (signal < 30) ? 0.4 : 0.9;
    //     }
    //     const signalFactor = 0.45 * norm01(signal);
    //     const hitFactor = 0.45 * averageHits();
    //     return clamp(signalFactor + hitFactor, 0, 0.9);
    // }

    // function chooseResponse() {
    //     const probBest = bestOdds();
    //     const probAvg = averageHits();
    //     const signalNormal = norm01(signal);

    //     const probGood = 0.25 * probAvg + 0.05;
    //     const probNeutral = 0.18;
    //     const probNoop = 0.05 + 0.15 * (1 - signalNormal);

    //     let remainder = 1 - (probBest + probGood + probNeutral + probNoop);
    //     const probBad = clamp(remainder, 0.05, 1);

    //     const sum = probBest + probGood + probNeutral + probNoop + probBad;
    //     const weights = {
    //         best: probBest / sum,
    //         good: probGood / sum,
    //         neutral: probNeutral / sum,
    //         noop: probNoop / sum,
    //         bad: probBad / sum,
    //     }
    //     return weighted(weights);
    // }

    // let susValue = 0;
    // function addSuspicion(val) {
    //     susValue = clamp(susValue + val, 0, 100);
    // }

    // function delaySend() {
    //     const time = norm01(signal);
    //     return lerp(0.25, 2.5, 1 - time) + rand(0, 0.35);
    // }

    // let nextMsgY = 220;
    // function placeRightY() {
    //     const y = nextMsgY;
    //     nextMsgY += 74;
    //     return y;
    // }

    // function placeLeft() {
    //     const y = nextMsgY;
    //     nextMsgY += 74;
    //     return y;
    // }

    // let leftMsgX = 30;
    // function setLeftMsgX(x) { leftMsgX = x; }

    // let messageFrames = [];
    // function resetMessages() {
    //     for (const f of messageFrames) {
    //         try { destroy(f); } catch {}
    //     }
    //     messageFrames = [];
    //     nextMsgY = 220;
    // }
    // function ensureMessageCapacity() {
    //     if (messageFrames.length >= 4) resetMessages();
    // }    

    // function addLeft(msg = '...') {
    //     ensureMessageCapacity();

    //     const y = placeLeft();
    //     const frame = chatboxContainer.add([
    //         sprite('bubble-left-100'),
    //         scale(0.65),
    //         pos(leftMsgX, y),
    //         fixed()
    //     ]);

    //     const message = frame.add([
    //         text(msg, {
    //             align: 'left',
    //             font: 'sf'
    //         }),
    //         anchor('center'),
    //         scale(0.65),
    //         pos(0, 0),
    //     ]);

    //     wait(0, () => {
    //         const spr = frame.sprite;
    //         const w = (spr?.width ?? spr?.frameWidth ?? 300) * (frame.scale?.x ?? 0.65);
    //         const h = (spr?.height ?? spr?.frameHeight ?? 100) * (frame.scale?.y ?? 0.65);
    //         message.pos = vec2(w / 2, h / 2);
    //     });

    //     messageFrames.push(frame);
    //     return {frame, message};
    // }

    // function addRight(msg) {
    //     ensureMessageCapacity();

    //     const y = placeRightY();
    //     const frame = chatboxContainer.add([
    //         sprite('bubble-right-100'),
    //         scale(0.65),
    //         pos(30, y),
    //         fixed()
    //     ]);

    //     messageFrames.push(frame);

    //     wait(0, () => {
    //         const spr = frame.sprite;
    //         const w = (spr?.width ?? spr?.frameWidth ?? 300) * (frame.scale?.x ?? 0.65);
    //         const h = (spr?.height ?? spr?.frameHeight ?? 100) * (frame.scale?.y ?? 0.65);
    //         const message = frame.add([
    //             text(msg, {
    //                 font: 'sf',
    //                 align: 'left'
    //             }),
    //             anchor('center'),
    //             scale(0.65),
    //             pos(w / 2, h / 2),
    //         ]);
    //     });
    // }

    // addRight("Child, you better explain yourself!");
    // startResponseTimer();

    // function chooseOption(arr) {
    //     return arr[Math.floor(rand(0, arr.length))];
    // }

    // function chooseDialogue(topic, category) {
    //     const options = DIALOGUE[topic]?.[category];
    //     if (options && options.length > 0) return chooseOption(options);
    //     const fallbackOpt = Object.values(DIALOGUE[topic] ?? {}).flat();
    //     return fallbackOpt.length ? chooseOption(fallbackOpt) : '(...)';
    // }

    // function chooseMomReply(category) {
    //     const options = MOM_REPLIES[category] ?? MOM_REPLIES.neutral;
    //     return chooseOption(options);
    // }

    // let isSending = false;

    // function sendMsg(topic) {
    //     if (isSending) return;
    //     isSending = true;

    //     markUserResponded();

    //     const category = chooseResponse();
    //     const playerMsg = chooseDialogue(topic, category);

    //     const sending = addLeft('typing...');
    //     const delay = delaySend();

    //     addSuspicion(delay * 4.67);
        
    //     wait(delay, () => {
    //         sending.message.text = playerMsg;

    //         if (category === 'best') signal = clamp(signal + 3, 0, 100);
    //         else if (category === 'good') signal = clamp(signal + 1, 0, 100);
    //         else if (category === 'bad') signal = clamp(signal - 2, 0, 100);
    //         else if (category === 'noop') signal = clamp(signal - 1, 0, 100);
        
    //         wait(rand(0.25, 0.7), () => {
    //             const reply = chooseMomReply(category);
    //             addRight(reply);

    //             startResponseTimer(5000);

    //             if (category === 'bad') addSuspicion(10);
    //             else if (category === 'noop') addSuspicion(6);
    //             else if (category === 'best') addSuspicion(-5);

    //             isSending = false;
    //             randomizeButtons();
    //         });
    //     });
    // }
    // for (const key of Object.keys(topicMap)) {
    //     debug.log(key)
    //     onKeyDown(key, () => {
    //         if (!isStart || isSending) return;
    //         sendMsg(topicMap[key])
    //     });
    // }

}