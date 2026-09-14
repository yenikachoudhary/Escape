let game = null;
let levelComplete = false;

function createGame(canvas) {
    console.log("GAME: Starting initialization");
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    game = {
        canvas: canvas,
        ctx: ctx,
        input: createInput(),
        map: null,
        player: null,
        guards: [],
        camera: null,
        smokeParticles: [],
        lastTime: 0,
        running: true,
        caught: false
    };

    game.triggerSmoke = function (x, y) {
        const particleCount = 45;
        const colors = [
            "rgba(240, 245, 250, {A})",
            "rgba(215, 225, 235, {A})",
            "rgba(180, 195, 210, {A})",
            "rgba(150, 165, 180, {A})",
            "rgba(120, 135, 150, {A})"
        ];

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 25 + Math.random() * 85;
            const initialRadius = 8 + Math.random() * 8;
            const targetRadius = 20 + Math.random() * 18;
            const maxLife = 2.5 + Math.random() * 1.5;

            game.smokeParticles.push({
                x: x + (Math.random() - 0.5) * 16,
                y: y + (Math.random() - 0.5) * 16,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                driftX: (Math.random() - 0.5) * 15,
                driftY: -5 - Math.random() * 12,
                initialRadius: initialRadius,
                targetRadius: targetRadius,
                currentRadius: initialRadius,
                life: 0,
                maxLife: maxLife,
                baseAlpha: 0.65 + Math.random() * 0.25,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
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

    if (game.smokeParticles && game.smokeParticles.length > 0) {
        for (let i = game.smokeParticles.length - 1; i >= 0; i--) {
            const p = game.smokeParticles[i];
            p.life += delta;
            if (p.life >= p.maxLife) {
                game.smokeParticles.splice(i, 1);
                continue;
            }
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.vx *= Math.pow(0.82, delta * 60);
            p.vy *= Math.pow(0.82, delta * 60);
            p.x += p.driftX * delta;
            p.y += p.driftY * delta;
            const progress = p.life / p.maxLife;
            p.currentRadius = p.initialRadius + (p.targetRadius - p.initialRadius) * Math.sin(progress * Math.PI * 0.5);
        }
    }

    game.camera.update(game.player);

    if (game.map.gate.open) {
        levelComplete = true;
        console.log("GAME: LEVEL COMPLETE");
    }
}

function drawGame() {
    const ctx = game.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
    ctx.save();
    ctx.translate(-game.camera.x, -game.camera.y);

    game.map.draw(ctx);

    if (game.smokeParticles && game.smokeParticles.length > 0) {
        ctx.save();
        for (let i = 0; i < game.smokeParticles.length; i++) {
            const p = game.smokeParticles[i];
            const progress = p.life / p.maxLife;
            const alpha = p.baseAlpha * Math.max(0, 1 - progress);
            ctx.fillStyle = p.color.replace("{A}", alpha.toFixed(3));
            ctx.beginPath();
            ctx.arc(Math.round(p.x), Math.round(p.y), Math.round(p.currentRadius), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

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

    if (game.smokeParticles) {
        game.smokeParticles = [];
    }

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