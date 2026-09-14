let game = null;
let levelComplete = false;

function createGame(canvas) {
    console.log("GAME: Starting initialization");
    const ctx = canvas.getContext("2d");

    game = {
        canvas: canvas,
        ctx: ctx,
        input: createInput(),
        map: null,
        player: null,
        guards: [],
        camera: null,
        lastTime: 0,
        running: true,
        caught: false
    };

    canvas.width = 960;
    canvas.height = 576;

    game.map = createMap();
    game.player = createPlayer(game);
    game.guards = [
        createGuard(game, 500, 200),
        createGuard(game, 1400, 600),
        createGuard(game, 2300, 500)
    ];

    game.camera = createCamera(game);
    game.camera.update(game.player);

    console.log("GAME: Map:", game.map.width, "x", game.map.height);
    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (!game || !game.running) {
        return;
    }

    if (game.lastTime === 0) {
        game.lastTime = timestamp;
    }

    let delta = (timestamp - game.lastTime) / 1000;
    game.lastTime = timestamp;
    delta = Math.min(delta, 0.05);

    updateGame(delta);
    drawGame();
    requestAnimationFrame(gameLoop);
}

function updateGame(delta) {
    if (game.caught || levelComplete) {
        return;
    }

    game.player.update(delta);

    game.guards.forEach(function (guard) {
        guard.update(delta);
    });

    game.guards.forEach(function (guard) {
        if (!guard.stunned && guard.canSeePlayer()) {
            game.caught = true;
            guard.caughtPlayer = true;
            console.log("GAME: Player caught");
        }
    });

    game.camera.update(game.player);

    if (game.map.gate.open) {
        levelComplete = true;
        console.log("GAME: LEVEL COMPLETE");
    }
}

function drawGame() {
    const ctx = game.ctx;
    ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
    ctx.save();
    ctx.translate(-game.camera.x, -game.camera.y);

    game.map.draw(ctx);
    game.guards.forEach(function (guard) { guard.draw(ctx); });
    game.player.draw(ctx);
    ctx.restore();

    if (game.caught) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
        ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);

        ctx.fillStyle = "#ff3b3b";
        ctx.font = "bold 56px monospace";
        ctx.textAlign = "center";
        ctx.fillText("CAUGHT", game.canvas.width / 2, game.canvas.height / 2 - 45);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px monospace";
        ctx.fillText("THE GUARD SPOTTED YOU", game.canvas.width / 2, game.canvas.height / 2);

        ctx.fillStyle = "#39ff14";
        ctx.fillRect(game.canvas.width / 2 - 100, game.canvas.height / 2 + 35, 200, 55);

        ctx.fillStyle = "#111111";
        ctx.font = "bold 18px monospace";
        ctx.fillText("TRY AGAIN", game.canvas.width / 2, game.canvas.height / 2 + 70);
        ctx.textAlign = "left";
    }

    if (levelComplete) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
        ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);

        ctx.fillStyle = "#39ff14";
        ctx.font = "bold 52px monospace";
        ctx.textAlign = "center";
        ctx.fillText("LEVEL COMPLETE", game.canvas.width / 2, game.canvas.height / 2 - 45);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px monospace";
        ctx.fillText("YOU ESCAPED THE PRISON", game.canvas.width / 2, game.canvas.height / 2);

        ctx.fillStyle = "#39ff14";
        ctx.fillRect(game.canvas.width / 2 - 110, game.canvas.height / 2 + 35, 220, 55);

        ctx.fillStyle = "#111111";
        ctx.font = "bold 18px monospace";
        ctx.fillText("MISSION COMPLETE", game.canvas.width / 2, game.canvas.height / 2 + 70);
        ctx.textAlign = "left";
    }
}

window.addEventListener("click", function (event) {
    if (!game || !game.caught) {
        return;
    }

    const rect = game.canvas.getBoundingClientRect();
    const scaleX = game.canvas.width / rect.width;
    const scaleY = game.canvas.height / rect.height;
    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;

    const buttonX = game.canvas.width / 2 - 100;
    const buttonY = game.canvas.height / 2 + 35;
    const buttonWidth = 200;
    const buttonHeight = 55;

    if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth && mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
        restartGame();
    }
});

function restartGame() {
    console.log("GAME: Restarting level");

    levelComplete = false;
    game.caught = false;
    game.running = true;
    game.map.gate.open = false;

    game.player = createPlayer(game);
    game.guards = [
        createGuard(game, 500, 200),
        createGuard(game, 1400, 600),
        createGuard(game, 2300, 500)
    ];

    game.map.bomb.collected = false;

    if (game.map.key) {
        game.map.key.collected = false;
    }

    game.camera.update(game.player);
    game.lastTime = 0;

    console.log("GAME: Level restarted");
}