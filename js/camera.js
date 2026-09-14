function createCamera(game) {
    const camera = {x: 0, y: 0, width: game.canvas.width, height: game.canvas.height};


    camera.update = function (target) {
        camera.x = target.centerX - camera.width / 2;
        camera.y = target.centerY - camera.height / 2;


        const maxX = game.map.width - camera.width;
        const maxY = game.map.height - camera.height;

        camera.x = Math.max( 0, Math.min(camera.x, maxX));
        camera.y = Math.max( 0, Math.min(camera.y, maxY));
    };
    return camera;
}