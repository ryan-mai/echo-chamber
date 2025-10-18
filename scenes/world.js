function setWorld(worldState) {
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

    function getRandomInt(min = 0, max) {
        const minCeil = Math.ceil(min);
        const maxFloor = Math.floor(max)
        return Math.floor(Math.random() * (maxFloor - minCeil) + minCeil);
    }

    function spawnSignals() {
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
             },
            'signal',
        ]);

        spawnInterval = Math.max(MIN_SPAWN_INTERVAL, spawnInterval - 0.02);
        fallSpeed = Math.min(SPEED_GROWTH_CAP, fallSpeed + SPEED_GROWTH_STEP * 0.02);
        wait(rand(spawnInterval * 0.9, spawnInterval * 1.1), spawnSignals);
    }

    wait(spawnInterval, spawnSignals);

    onUpdate('signal', (arrow) => {
        arrow.move(0, arrow.speed);
        if (arrow.pos.y > 720) {
            destroy(arrow)
        }
    });

    onUpdate(() => {
        leftRGB.opacity = rightRGB.opacity = upRGB.opacity = downRGB.opacity = 0;
        if (activeDir === 'left') leftRGB.opacity = 1;
        else if (activeDir === 'right') rightRGB.opacity = 1;
        else if (activeDir === 'up') upRGB.opacity = 1;
        else if (activeDir === 'down') downRGB.opacity = 1;
    });

    let dirTime = 0
    const perfectTime = 0.72;
    const okTime = perfectTime - 20 || perfectTime + 20;
    const goodTime = perfectTime - 15 || perfectTime + 15;
    const greatTime = perfectTime - 10 || perfectTime + 10;

    for (const dir of options) {
        onCollideUpdate('signal', dir, (signal, hand) => {
            dirTime += dt();
            if (activeDir === dir && signal.type === dir) {
                let roundedTime = dirTime.toFixed(2);
                if (roundedTime === perfectTime){
                    debug.log('Perfect!', roundedTime);
                } else {
                    debug.log('Meh...', roundedTime);
                }
                destroy(signal);
                dirTime = 0;
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