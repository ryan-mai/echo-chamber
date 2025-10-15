function loadAssets() {
    loadSpriteAtlas("./assets/arrows.webp", {
        'g-left': { x: 0, y: 0, width: 60, height: 64 },
        'g-down': { x: 57, y: 0, width: 60, height: 64 },
        'g-up': { x: 115, y: 0, width: 60, height: 64 },
        'g-right': { x: 175, y: 0, width: 60, height: 64 },
        'rgb-left': { x: 0, y: 65, width: 60, height: 64},
        'rgb-right': { x: 175, y: 65, width: 60, height: 64},
        'rgb-down': { x: 57, y: 65, width: 60, height: 64},
        'rgb-up': { x: 115, y: 65, width: 60, height: 64},
    });
}