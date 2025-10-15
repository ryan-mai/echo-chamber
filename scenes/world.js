function setWorld(worldState) {
    const leftHand = add([
        sprite('g-left'),
        area(),
        body({isStatic: true}),
        pos(475, 720 - 200),
        scale(1.5),
        'left']);
    const rightHand = add([
        sprite('g-right'),
        area(),
        body({isStatic: true}),
        pos(745, 720 - 200),
        scale(1.5),
        'right']);
    const upHand = add([
        sprite('g-up'),
        area(),
        body({isStatic: true}),
        pos(655, 720 - 200),
        scale(1.5),
        'up']);
    const downHand = add([
        sprite('g-down'),
        area(),
        body({isStatic: true}),
        pos(565, 720 - 200),
        scale(1.5),
        'down']);
    const leftRGB = add([
        sprite('rgb-left'),
        area(),
        body({isStatic: true}),
        pos(475, 720 - 206),
        scale(1.5),
        opacity(0),
        'rgb-left']);
    const rightRGB = add([
        sprite('rgb-right'),
        area(),
        body({isStatic: true}),
        pos(745, 720 - 206),
        scale(1.5),
        opacity(0),
        'rgb-right']);
    const upRGB = add([
        sprite('rgb-up'),
        area(),
        body({isStatic: true}),
        pos(655, 720 - 206),
        scale(1.5),
        opacity(0),
        'rgb-up']);
    const downRGB = add([
        sprite('rgb-down'),
        area(),
        body({isStatic: true}),
        pos(565, 720 - 206),
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

    onUpdate( () => {
        if (activeDir === 'left') {
            leftRGB.opacity = 1;
        } else if (activeDir === 'right') {
            rightRGB.opacity = 1;
        } else if (activeDir === 'up') {
            upRGB.opacity = 1;
        } else if (activeDir === 'down') {
            downRGB.opacity = 1;
        }
        else {
            leftRGB.opacity = 0;
            rightRGB.opacity = 0;
            upRGB.opacity = 0;
            downRGB.opacity = 0;
        }
    });

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