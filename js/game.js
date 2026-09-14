let game = null;
let levelComplete = false;
let currentLevel = 1;

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
        caught: false,
        showingLevel2: false,
        objectiveText: "OBJECTIVE: FIND THE SMOKE BOMB",
        hudBanner: { text: "OBJECTIVE: FIND THE SMOKE BOMB", timer: 4.5, type: "objective", onComplete: null },
        proximityPrompt: null
    };

    game.setObjective = function (text) {
        game.objectiveText = text;
        const objEl = document.getElementById("objective");
        if (objEl) {
            objEl.textContent = text;
        }
    };

    game.showBanner = function (text, duration, onComplete, type) {
        game.hudBanner = {
            text: text,
            timer: duration || 3.0,
            type: type || "info",
            onComplete: onComplete || null
        };
    };

    game.onBombCollected = function () {
        game.proximityPrompt = null;
        game.setObjective("OBJECTIVE: USE THE SMOKE BOMB");
        game.showBanner("SMOKE BOMB SECURED", 2.0, function () {
            game.showBanner("PRESS Q TO RELEASE THE SMOKE", 4.0, null, "action");
        }, "success");
    };

    game.onSmokeUsed = function () {
        game.proximityPrompt = null;
        game.showBanner("SMOKE DEPLOYED — GUARDS DISABLED FOR 10 SECONDS", 4.0, function () {
            game.setObjective("OBJECTIVE: FIND THE PRISON KEY");
        }, "warning");
    };

    game.onKeyCollected = function () {
        game.proximityPrompt = null;
        game.setObjective("OBJECTIVE: REACH THE EXIT GATE");
        game.showBanner("KEY ACQUIRED", 2.5, null, "success");
    };

    game.onGateOpened = function () {
        game.proximityPrompt = null;
        game.setObjective("LEVEL COMPLETE");
        game.showBanner("EXIT UNLOCKED", 2.0, null, "success");
    };

    game.triggerSmoke = function (x, y) {
        const particleCount = 140;
        const colors = [
            "rgba(245, 248, 252, {A})",
            "rgba(225, 232, 240, {A})",
            "rgba(195, 205, 218, {A})",
            "rgba(165, 178, 192, {A})",
            "rgba(135, 148, 162, {A})",
            "rgba(105, 118, 132, {A})"
        ];

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const layer = Math.random();
            let speed, initialRadius, targetRadius, baseAlpha, maxLife;

            if (layer < 0.25) {
                // Dense central core lingering around the player
                speed = 15 + Math.random() * 55;
                initialRadius = 18 + Math.random() * 12;
                targetRadius = 45 + Math.random() * 25;
                baseAlpha = 0.55 + Math.random() * 0.20;
                maxLife = 5.0 + Math.random() * 1.5;
            } else if (layer < 0.70) {
                // Mid billowing clouds spreading across the area
                speed = 70 + Math.random() * 110;
                initialRadius = 14 + Math.random() * 10;
                targetRadius = 55 + Math.random() * 30;
                baseAlpha = 0.40 + Math.random() * 0.18;
                maxLife = 4.2 + Math.random() * 1.8;
            } else {
                // High-velocity outer perimeter burst
                speed = 180 + Math.random() * 110;
                initialRadius = 10 + Math.random() * 8;
                targetRadius = 40 + Math.random() * 30;
                baseAlpha = 0.30 + Math.random() * 0.15;
                maxLife = 3.5 + Math.random() * 1.5;
            }

            game.smokeParticles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                driftX: (Math.random() - 0.5) * 18,
                driftY: -6 - Math.random() * 14,
                initialRadius: initialRadius,
                targetRadius: targetRadius,
                currentRadius: initialRadius,
                life: 0,
                maxLife: maxLife,
                baseAlpha: baseAlpha,
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
    game.setObjective("OBJECTIVE: FIND THE SMOKE BOMB");

    console.log("GAME: Map:", game.map.width, "x", game.map.height);
    requestAnimationFrame(gameLoop);
}

function startNextLevel() {
    console.log("GAME: Transitioning to Level 02");
    currentLevel = 2;
    if (game) {
        game.showingLevel2 = true;
    }
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
    if (game.caught || levelComplete || game.showingLevel2) {
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

    // Update smoke particles
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
            p.vx *= Math.pow(0.86, delta * 60);
            p.vy *= Math.pow(0.86, delta * 60);
            p.x += p.driftX * delta;
            p.y += p.driftY * delta;
            const progress = p.life / p.maxLife;
            p.currentRadius = p.initialRadius + (p.targetRadius - p.initialRadius) * Math.sin(progress * Math.PI * 0.5);
        }
    }

    // Update HUD banner timer
    if (game.hudBanner && game.hudBanner.timer > 0) {
        game.hudBanner.timer -= delta;
        if (game.hudBanner.timer <= 0 && typeof game.hudBanner.onComplete === "function") {
            const callback = game.hudBanner.onComplete;
            game.hudBanner.onComplete = null;
            callback();
        }
    }

    // Contextual proximity checks
    game.proximityPrompt = null;
    if (!game.player.hasSmoke && !game.map.bomb.collected) {
        const distBomb = Math.hypot(game.player.centerX - (game.map.bomb.x + 24), game.player.centerY - (game.map.bomb.y + 24));
        if (distBomb < 65) {
            game.proximityPrompt = { text: "PRESS E TO PICK UP SMOKE BOMB", type: "action" };
        }
    } else if (!game.player.hasKey && !game.map.key.collected) {
        const distKey = Math.hypot(game.player.centerX - (game.map.key.x + 24), game.player.centerY - (game.map.key.y + 24));
        if (distKey < 65) {
            game.proximityPrompt = { text: "PRESS E TO PICK UP KEY", type: "action" };
        }
    }

    if (!game.map.gate.open) {
        const gateCenterX = game.map.gate.x + game.map.gate.width / 2;
        const gateCenterY = game.map.gate.y + game.map.gate.height / 2;
        const distGate = Math.hypot(game.player.centerX - gateCenterX, game.player.centerY - gateCenterY);
        if (distGate < 90) {
            if (!game.player.hasKey) {
                game.proximityPrompt = { text: "THE GATE IS LOCKED — FIND THE KEY", type: "warning" };
            } else {
                game.proximityPrompt = { text: "EXIT UNLOCKED", type: "success" };
            }
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

    // Draw world smoke particles
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

    // Render contextual bottom HUD banner (if game in progress)
    if (!game.caught && !levelComplete && !game.showingLevel2) {
        const activeMessage = game.proximityPrompt || (game.hudBanner && game.hudBanner.timer > 0 ? game.hudBanner : null);
        if (activeMessage) {
            const bannerW = Math.min(540, game.canvas.width - 60);
            const bannerH = 44;
            const bannerX = (game.canvas.width - bannerW) / 2;
            const bannerY = game.canvas.height - 62;

            ctx.save();
            ctx.fillStyle = "rgba(10, 13, 18, 0.90)";
            ctx.fillRect(bannerX, bannerY, bannerW, bannerH);

            let borderColor = "#39ff14";
            if (activeMessage.type === "warning") borderColor = "#ff3b3b";
            else if (activeMessage.type === "action") borderColor = "#ff9900";

            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);

            // Left highlight indicator
            ctx.fillStyle = borderColor;
            ctx.fillRect(bannerX, bannerY, 4, bannerH);

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 13px monospace";
            ctx.textAlign = "center";
            ctx.fillText(activeMessage.text, game.canvas.width / 2, bannerY + 27);
            ctx.restore();
        }
    }

    // Caught screen
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

    // Level Complete screen
    if (levelComplete && !game.showingLevel2) {
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
        ctx.fillText("NEXT LEVEL", game.canvas.width / 2, game.canvas.height / 2 + 70);
        ctx.textAlign = "left";
    }

    // Level 02 Transition Placeholder Screen
    if (game.showingLevel2) {
        ctx.fillStyle = "rgba(6, 8, 12, 0.94)";
        ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);

        ctx.fillStyle = "#ff6a00";
        ctx.font = "bold 15px monospace";
        ctx.textAlign = "center";
        ctx.fillText("FACILITY SECTOR 2", game.canvas.width / 2, game.canvas.height / 2 - 95);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 32px monospace";
        ctx.fillText("LEVEL 02 — THE CONTROL BLOCK", game.canvas.width / 2, game.canvas.height / 2 - 50);

        ctx.fillStyle = "#39ff14";
        ctx.font = "bold 20px monospace";
        ctx.fillText("COMING NEXT", game.canvas.width / 2, game.canvas.height / 2 - 12);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "14px monospace";
        ctx.fillText("The main exit is sealed. Reach the security control block to disable lockdown.", game.canvas.width / 2, game.canvas.height / 2 + 25);

        // Replay Level 1 Button
        ctx.fillStyle = "#39ff14";
        ctx.fillRect(game.canvas.width / 2 - 110, game.canvas.height / 2 + 65, 220, 50);

        ctx.fillStyle = "#0a0c10";
        ctx.font = "bold 16px monospace";
        ctx.fillText("REPLAY LEVEL 01", game.canvas.width / 2, game.canvas.height / 2 + 96);
        ctx.textAlign = "left";
    }
}

window.addEventListener("click", function (event) {
    if (!game) {
        return;
    }

    const rect = game.canvas.getBoundingClientRect();
    const scaleX = game.canvas.width / rect.width;
    const scaleY = game.canvas.height / rect.height;
    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;

    if (game.caught) {
        const buttonX = game.canvas.width / 2 - 100;
        const buttonY = game.canvas.height / 2 + 35;
        const buttonWidth = 200;
        const buttonHeight = 55;

        if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth && mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
            restartGame();
        }
        return;
    }

    if (levelComplete && !game.showingLevel2) {
        const buttonX = game.canvas.width / 2 - 110;
        const buttonY = game.canvas.height / 2 + 35;
        const buttonWidth = 220;
        const buttonHeight = 55;

        if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth && mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
            startNextLevel();
        }
        return;
    }

    if (game.showingLevel2) {
        const replayX = game.canvas.width / 2 - 110;
        const replayY = game.canvas.height / 2 + 65;
        const replayW = 220;
        const replayH = 50;

        if (mouseX >= replayX && mouseX <= replayX + replayW && mouseY >= replayY && mouseY <= replayY + replayH) {
            game.showingLevel2 = false;
            restartGame();
        }
    }
});

function restartGame() {
    console.log("GAME: Restarting level");

    levelComplete = false;
    currentLevel = 1;
    game.caught = false;
    game.running = true;
    game.showingLevel2 = false;
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
    game.setObjective("OBJECTIVE: FIND THE SMOKE BOMB");
    game.showBanner("OBJECTIVE: FIND THE SMOKE BOMB", 4.0, null, "objective");
    game.lastTime = 0;

    console.log("GAME: Level restarted");
}