let game = null;
let levelComplete = false;
let currentLevel = 1;

function createGame(canvas, level) {
    if (game) game.running = false;

    currentLevel = level || 1;
    levelComplete = false;

    canvas.width = 960;
    canvas.height = 576;

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    game = {
        canvas: canvas,
        ctx: ctx,
        input: createInput(),
        currentLevel: currentLevel,
        map: currentLevel === 2? createLevelTwoMap() : createMap(),
        player: null,
        guards: [],
        camera: null,
        smokeParticles: [],
        lastTime: 0,
        running: true,
        caught: false,
        level3: false,
        hudBanner: null,
        proximityPrompt: null
    };

    setLevelIndicator(currentLevel);

    game.setObjective = function (text) {
        document.getElementById("objective").textContent = text;
    };

    game.showBanner = function (text, timer, type, detail) {
        game.hudBanner = { text: text, detail: detail || "", timer: timer || 3, type: type || "info" };
    };

    game.triggerSmoke = function (x, y) {
        for (let i = 0; i < 90; i++) {
            const angle = Math.random() * Math.PI * 2;
            game.smokeParticles.push({
                x: x, y: y,
                vx: Math.cos(angle) * (45 + Math.random() * 160),
                vy: Math.sin(angle) * (45 + Math.random() * 160),
                life: 0, maxLife: 3,
                radius: 16 + Math.random() * 26
            });
        }
    };

    game.onBombCollected = function () {
        game.setObjective("OBJECTIVE: USE THE SMOKE BOMB");
        game.showBanner("SMOKE BOMB SECURED", 2, "success");
    };

    game.onSmokeUsed = function () {
        game.setObjective("OBJECTIVE: FIND THE PRISON KEY");
        game.showBanner("SMOKE DEPLOYED", 3, "warning", "GUARDS DISABLED");
    };

    game.onKeyCollected = function () {
        game.setObjective("OBJECTIVE: REACH THE EXIT GATE");
        game.showBanner("KEY ACQUIRED", 2, "success");
    };

    game.onGateOpened = function () {
        game.setObjective("LEVEL COMPLETE");
        game.showBanner("EXIT UNLOCKED", 2, "success");
    };

    game.updateLevelTwoPlayer = updateLevelTwoPlayer;

    const ready = function () {
        setupWorld();
        requestAnimationFrame(gameLoop);
    };

    if (currentLevel === 2 && game.map.ready) game.map.ready.then(ready);
    else ready();
}

function setLevelIndicator(level) {
    document.getElementById("levelIndicator").textContent = "LEVEL " + String(level).padStart(2, "0");
}

function setupWorld() {
    game.player = createPlayer(game);

    if (game.currentLevel === 1) {
        game.guards = [
            createGuard(game, 500, 200),
            createGuard(game, 1400, 600),
            createGuard(game, 2300, 500)
        ];
        game.setObjective("OBJECTIVE: FIND THE SMOKE BOMB");
        document.getElementById("inventory").hidden = true;
    } else {
        const exit = game.map.finalExit[0] || { x: 2230, y: 1000 };
        game.guards = [
            createGuard(game, exit.x - 60, exit.y + 30),
            createGuard(game, exit.x + 85, exit.y + 30)
        ];

        game.guards.forEach(function (guard) {
            guard.speed = 0;
            guard.directionX = -1;
            guard.directionY = 0;
            guard.directionTimer = Infinity;
        });

        game.setObjective("OBJECTIVE: FIND THE SECURITY PASS");
        document.getElementById("inventory").hidden = false;
        updateChemicalHud();
        game.showBanner("OBJECTIVE: FIND THE SECURITY PASS", 3, "objective");
    }

    game.camera = createCamera(game);
    game.camera.update(game.player);
}

function updateLevelTwoPlayer(player) {
    const map = game.map;
    const near = function (entity) {
        return Math.hypot(player.centerX - entity.x - entity.width / 2, player.centerY - entity.y - entity.height / 2);
    };

    const nearbyGate = map.securityGates.some(function (gate) { return near(gate) < 85; });
    const nearbyChemical = map.chemicals.find(function (chemical) { return!chemical.collected && near(chemical) < 58; });
    const nearbyGuard = game.guards.some(function (guard) { return Math.hypot(player.centerX - guard.x - guard.width / 2, player.centerY - guard.y - guard.height / 2) < 150; });
    const nearbyExit = map.finalExit.some(function (exit) { return near(exit) < 85; });

    if (map.securityPass &&!player.hasPass &&!map.securityPass.collected && near(map.securityPass) < 58) {
        game.proximityPrompt = { text: "PRESS E TO PICK UP SECURITY PASS", type: "action" };
        if (game.input.consume("e")) {
            player.hasPass = true;
            map.securityPass.collected = true;
            game.setObjective("OBJECTIVE: ENTER THE SECURITY AREA");
            game.showBanner("SECURITY PASS ACQUIRED", 2, "success");
        }
        return;
    }

    if (nearbyGate &&!map.securityOpen) {
        if (!player.hasPass) {
            game.proximityPrompt = { text: "SECURITY PASS REQUIRED", type: "warning" };
        } else {
            game.proximityPrompt = { text: "PRESS E TO OPEN SECURITY DOOR", type: "action" };
            if (game.input.consume("e")) {
                map.securityOpen = true;
                map.securityGates.forEach(function (gate) { map.setCollisionRect(gate, false); });
                game.setObjective("OBJECTIVE: COLLECT 4 CHEMICAL BOTTLES");
                game.showBanner("SECURITY ACCESS GRANTED", 2, "success");
            }
        }
        return;
    }

    if (nearbyChemical) {
        game.proximityPrompt = { text: "PRESS E TO COLLECT CHEMICAL", type: "action" };
        if (game.input.consume("e")) {
            nearbyChemical.collected = true;
            player.chemicals += 1;
            updateChemicalHud();
            game.showBanner("CHEMICAL COLLECTED", 1.5, "success");
            if (player.chemicals === map.chemicals.length) {
                game.setObjective("OBJECTIVE: REACH THE FINAL GUARDS");
                game.showBanner("ALL CHEMICALS SECURED", 2.5, "success");
            }
        }
        return;
    }

    if (nearbyGuard && player.chemicals === map.chemicals.length &&!map.exitOpen) {
        game.proximityPrompt = { text: "PRESS Q TO USE CHEMICALS", detail: "DISABLE THE GUARDS", type: "action" };
        if (game.input.consume("q")) {
            map.exitOpen = true;
            map.finalExit.forEach(function (exit) { map.setCollisionRect(exit, false); });
            game.guards.forEach(function (guard) {
                guard.permanentlyDisabled = true;
                guard.stunned = true;
            });
            game.setObjective("OBJECTIVE: REACH THE EXIT");
            game.showBanner("CHEMICAL EFFECT ACTIVATED", 3, "success", "GUARDS DISABLED · EXIT CLEAR");
            game.triggerSmoke(player.centerX, player.centerY);
        }
        return;
    }

    if (map.exitOpen && nearbyExit) {
        game.proximityPrompt = { text: "PRESS E TO ESCAPE", type: "action" };
        if (game.input.consume("e")) levelComplete = true;
    }
}

function updateChemicalHud() {
    document.getElementById("inventory").textContent = "CHEMICALS: " + game.player.chemicals + " / 4";
}

function gameLoop(time) {
    if (!game ||!game.running) return;
    if (!game.lastTime) game.lastTime = time;

    const delta = Math.min((time - game.lastTime) / 1000, 0.05);
    game.lastTime = time;

    updateGame(delta);
    drawGame();
    requestAnimationFrame(gameLoop);
}

function updateGame(delta) {
    if (game.caught || levelComplete || game.level3) return;

    game.proximityPrompt = null;
    game.player.update(delta);

    game.guards.forEach(function (guard) {
        guard.update(delta);
        if (!guard.stunned && guard.canSeePlayer()) {
            game.caught = true;
            guard.caughtPlayer = true;
        }
    });

    if (game.currentLevel === 1) levelOnePrompts();

    game.smokeParticles = game.smokeParticles.filter(function (particle) {
        particle.life += delta;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.vx *= 0.93;
        particle.vy *= 0.93;
        return particle.life < particle.maxLife;
    });

    if (game.hudBanner && game.hudBanner.timer > 0) game.hudBanner.timer -= delta;

    game.camera.update(game.player);

    if (game.currentLevel === 1 && game.map.gate.open) levelComplete = true;
}

function levelOnePrompts() {
    const player = game.player;
    const nearBomb = Math.hypot(player.centerX - game.map.bomb.x - 24, player.centerY - game.map.bomb.y - 24) < 65;
    const nearKey = Math.hypot(player.centerX - game.map.key.x - 24, player.centerY - game.map.key.y - 24) < 65;
    const gateX = game.map.gate.x + game.map.gate.width / 2;
    const gateY = game.map.gate.y + game.map.gate.height / 2;
    const nearGate = Math.hypot(player.centerX - gateX, player.centerY - gateY) < 75;

    if (!player.hasSmoke &&!game.map.bomb.collected && nearBomb) {
        game.proximityPrompt = { text: "PRESS E TO PICK UP SMOKE BOMB", type: "action" };
    } else if (!player.hasKey &&!game.map.key.collected && nearKey) {
        game.proximityPrompt = { text: "PRESS E TO PICK UP KEY", type: "action" };
    } else if (player.hasKey &&!game.map.gate.open && nearGate) {
        game.proximityPrompt = { text: "PRESS E TO OPEN EXIT GATE", type: "action" };
    }
}

function drawGame() {
    const ctx = game.ctx;
    ctx.clearRect(0, 0, 960, 576);
    ctx.save();
    ctx.translate(-game.camera.x, -game.camera.y);

    game.map.draw(ctx);

    game.smokeParticles.forEach(function (particle) {
        ctx.fillStyle = "rgba(190,235,210," + (1 - particle.life / particle.maxLife) * 0.35 + ")";
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    game.guards.forEach(function (guard) { guard.draw(ctx); });
    game.player.draw(ctx);

    ctx.restore();

    if (!game.caught &&!levelComplete &&!game.level3) drawBanner();
    if (game.caught) overlay("CAUGHT", "THE GUARD SPOTTED YOU", "TRY AGAIN", "#ff3b3b");
    if (levelComplete) overlay("LEVEL COMPLETE", game.currentLevel === 1? "YOU ESCAPED THE PRISON" : "THE CONTROL BLOCK IS CLEAR", "NEXT LEVEL", "#39ff14");
    if (game.level3) drawLevelThree();
}

function drawBanner() {
    const message = game.proximityPrompt || (game.hudBanner && game.hudBanner.timer > 0? game.hudBanner : null);
    if (!message) return;

    const ctx = game.ctx;
    const color = message.type === "warning"? "#ff3b3b" : message.type === "action"? "#ff9900" : "#39ff14";
    const height = message.detail? 62 : 44;
    const y = 514 - (height - 44);

    ctx.fillStyle = "rgba(10,13,18,.9)";
    ctx.fillRect(210, y, 540, height);
    ctx.strokeStyle = color;
    ctx.strokeRect(210, y, 540, height);
    ctx.fillStyle = color;
    ctx.fillRect(210, y, 4, height);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText(message.text, 480, y + 27);

    if (message.detail) {
        ctx.fillStyle = color;
        ctx.font = "bold 11px monospace";
        ctx.fillText(message.detail, 480, y + 47);
    }

    ctx.textAlign = "left";
}

function overlay(title, subtitle, button, color) {
    const ctx = game.ctx;
    ctx.fillStyle = "rgba(0,0,0,.82)";
    ctx.fillRect(0, 0, 960, 576);

    ctx.fillStyle = color;
    ctx.font = "bold 52px monospace";
    ctx.textAlign = "center";
    ctx.fillText(title, 480, 243);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px monospace";
    ctx.fillText(subtitle, 480, 288);

    ctx.fillStyle = "#39ff14";
    ctx.fillRect(350, 323, 220, 55);

    ctx.fillStyle = "#111";
    ctx.fillText(button, 480, 358);
    ctx.textAlign = "left";
}

function drawLevelThree() {
    const ctx = game.ctx;
    ctx.fillStyle = "rgba(6,8,12,.96)";
    ctx.fillRect(0, 0, 960, 576);
    ctx.textAlign = "center";

    ctx.fillStyle = "#ff6a00";
    ctx.font = "bold 18px monospace";
    ctx.fillText("LEVEL 03", 480, 230);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 34px monospace";
    ctx.fillText("THE COMPANION", 480, 280);

    ctx.fillStyle = "#39ff14";
    ctx.font = "bold 20px monospace";
    ctx.fillText("COMING NEXT", 480, 325);
    ctx.textAlign = "left";
}

window.addEventListener("click", function (event) {
    if (!game) return;

    const bounds = game.canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * 960 / bounds.width;
    const y = (event.clientY - bounds.top) * 576 / bounds.height;

    if (x < 350 || x > 570 || y < 323 || y > 378) return;

    if (game.caught) restartGame();
    else if (levelComplete && game.currentLevel === 1) {
        game.running = false;
        currentLevel = 2;
        setLevelIndicator(2);
        showLevelTwoBriefing();
    }
    else if (levelComplete && game.currentLevel === 2) {
        levelComplete = false;
        game.level3 = true;
        setLevelIndicator(3);
    }
});

function restartGame() {
    createGame(document.getElementById("canvas"), game.currentLevel);
}