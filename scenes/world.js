function setWorld(worldState) {
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

    const keyDirMap = {
        up: 'up', w: 'up',
        down: 'down', s: 'down',
        left: 'left', a: 'left',
        right: 'right', d: 'right',
    }

    let activeDir = null;


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

    async function startSong(song) {
        if (!song) return;

        audio = new Audio(song.file);
        await audio.play();
        songStartTime = performance.now() / 1000;
        debug.log("What did I miss???")
        const spawnY = 720 - 600;
        const targetY = 720 - 200;
        const travelTime = Math.abs(targetY - spawnY) / fallSpeed;

        for (const note of song.notes) {
            const hitTime = beatsToSecond(note.beat, song.bpm, song.offset);
            const spawnPos = Math.max(0, hitTime - travelTime);
            const delay = Math.max(0, spawnPos * 1000);

            setTimeout(() => {
                spawnNoteAtLane(note.direction, note.lane, hitTime);
            }, delay);
        }
    }

    function spawnNoteAtLane(dir = 'up', lane, hitTime = null) {
        const arrowType = dir || 'up';
        const xPos = xOptionPos[lane] || xOptionPos[2];
        debug.log(dir, lane);
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
                    diff = Math.abs(initialTime - signal.hitTime);
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
}