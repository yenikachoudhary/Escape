function createPlayer(game) {
    const start = game.map.gridToCenter(3, 3);
    const player = { x: start.x - 15, y: start.y - 15, width: 30, height: 30, speed: 180, hasSmoke: false, hasKey: false };

    player.update = function (delta) {
        let dx = 0;
        let dy = 0;
        if (game.input.isDown("w") || game.input.isDown("arrowup")) dy -= 1;
        if (game.input.isDown("s") || game.input.isDown("arrowdown")) dy += 1;
        if (game.input.isDown("a") || game.input.isDown("arrowleft")) dx -= 1;
        if (game.input.isDown("d") || game.input.isDown("arrowright")) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }
        const moveX = dx * player.speed * delta;
        const moveY = dy * player.speed * delta;

        if (!player.collides(player.x + moveX, player.y)) player.x += moveX;
        if (!player.collides(player.x, player.y + moveY)) player.y += moveY;

        if (!player.hasSmoke && !game.map.bomb.collected) {
            const distance = Math.hypot(player.centerX - (game.map.bomb.x + 24), player.centerY - (game.map.bomb.y + 24));
            if (distance < 45 && game.input.isDown("e")) {
                player.hasSmoke = true;
                game.map.bomb.collected = true;
                console.log("ITEM: Smoke bomb collected");
            }
        }
        if (!player.hasKey && !game.map.key.collected) {
            const distance = Math.hypot(player.centerX - (game.map.key.x + 24), player.centerY - (game.map.key.y + 24));
            if (distance < 45 && game.input.isDown("e")) {
                player.hasKey = true;
                game.map.key.collected = true;
                console.log("ITEM: Key collected");
            }
        }
        if (player.hasSmoke && game.input.isDown("q")) {
            game.guards.forEach(function (guard) { guard.stun(); });
            player.hasSmoke = false;
            console.log("SMOKE: ALL GUARDS STUNNED");
        }
        if (player.hasKey && !game.map.gate.open) {
            const gateCenterX = game.map.gate.x + game.map.gate.width / 2;
            const gateCenterY = game.map.gate.y + game.map.gate.height / 2;
            const distance = Math.hypot(player.centerX - gateCenterX, player.centerY - gateCenterY);
            if (distance < 70) {
                game.map.gate.open = true;
                console.log("GATE: Gate opened");
            }
        }
    };

    player.collides = function (x, y) {
        const left = Math.floor(x / game.map.tileSize);
        const right = Math.floor((x + player.width - 1) / game.map.tileSize);
        const top = Math.floor(y / game.map.tileSize);
        const bottom = Math.floor((y + player.height - 1) / game.map.tileSize);
        return (game.map.isWall(left, top) || game.map.isWall(right, top) || game.map.isWall(left, bottom) || game.map.isWall(right, bottom));
    };

    player.draw = function (ctx) {
        ctx.fillStyle = "rgba(0,0,0,0.5"; ctx.fillRect(player.x + 4, player.y + 5, player.width, player.height);
        ctx.fillStyle = "#39ff14"; ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.fillStyle = "#111"; ctx.fillRect(player.x + 5, player.y + 6, 20, 7);
    };

    Object.defineProperty(player, "centerX", { get: function () { return player.x + player.width / 2; } });
    Object.defineProperty(player, "centerY", { get: function () { return player.y + player.height / 2; } });

    return player;
}