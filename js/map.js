function createMap() {
    const map = {
        tileSize: 48,
        columns: 70,
        rows: 40,
        width: 70 * 48,
        height: 40 * 48,
        image: new Image(),
        loaded: false,
        collision: [],
        bomb: { x: 496 * 3, y: (370 - 16) * 3, width: 48, height: 48, collected: false },
        key: { x: 769 * 3, y: (240 - 16) * 3, width: 48, height: 48, collected: false },
        gate: { x: 1024.5 * 3, y: (415.125 - 16) * 3, width: 32.5 * 3, height: 48, open: false }
    };

    for (let y = 0; y < map.rows; y++) {
        map.collision[y] = [];
        for (let x = 0; x < map.columns; x++) {
            map.collision[y][x] = 0;
        }
    }

    map.image.onload = function () {
        map.loaded = true;
        console.log("MAP: PNG loaded");
    };
    map.image.src = "assets/map1.png";

    fetch("assets/map1.tmj")
       .then(response => response.json())
       .then(data => {
            const wallLayer = data.layers.find(layer => layer.name === "walls");
            if (wallLayer) {
                for (let y = 0; y < map.rows; y++) {
                    for (let x = 0; x < map.columns; x++) {
                        const index = y * map.columns + x;
                        map.collision[y][x] = wallLayer.data[index] > 0 ? 1 : 0;
                    }
                }
                console.log("MAP: Collision loaded");
            }

            const entityLayer = data.layers.find(layer => layer.name === "entities" || layer.type === "objectgroup");
            if (entityLayer && entityLayer.objects) {
                const scale = 3;
                let gateLeft = null;
                let gateRight = null;

                entityLayer.objects.forEach(obj => {
                    const objY = (obj.gid ? (obj.y - obj.height) : obj.y) * scale;
                    const objX = obj.x * scale;
                    const objW = obj.width * scale;
                    const objH = obj.height * scale;

                    if (obj.name === "bomb" || obj.id === 1) {
                        map.bomb.x = objX;
                        map.bomb.y = objY;
                        map.bomb.width = objW;
                        map.bomb.height = objH;
                    } else if (obj.name === "key" || obj.id === 5) {
                        map.key.x = objX;
                        map.key.y = objY;
                        map.key.width = objW;
                        map.key.height = objH;
                    } else if (obj.name === "gate_l" || obj.id === 7) {
                        gateLeft = { x: objX, y: objY, width: objW, height: objH };
                    } else if (obj.name === "gate_r" || obj.id === 6) {
                        gateRight = { x: objX, y: objY, width: objW, height: objH };
                    }
                });

                if (gateLeft && gateRight) {
                    map.gate.x = Math.min(gateLeft.x, gateRight.x);
                    map.gate.y = Math.min(gateLeft.y, gateRight.y);
                    const rightEdge = Math.max(gateLeft.x + gateLeft.width, gateRight.x + gateRight.width);
                    map.gate.width = rightEdge - map.gate.x;
                    map.gate.height = Math.max(gateLeft.height, gateRight.height);
                }
                console.log("MAP: Tiled entities loaded successfully", { bomb: map.bomb, key: map.key, gate: map.gate });
            }
        });

    map.draw = function (ctx) {
        ctx.fillStyle = "#241c2b";
        ctx.fillRect(0, 0, map.width, map.height);

        if (map.loaded) {
            ctx.drawImage(map.image, 0, 0, map.width, map.height);
        }

        // Draw smoke bomb if not collected
        if (!map.bomb.collected) {
            const bx = map.bomb.x;
            const by = map.bomb.y;

            // Soft shadow under canister
            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            ctx.beginPath();
            ctx.ellipse(bx + 24, by + 40, 14, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Canister body (dark charcoal)
            ctx.fillStyle = "#242a34";
            ctx.fillRect(bx + 14, by + 14, 20, 24);

            // Specular metallic highlight
            ctx.fillStyle = "#4a5568";
            ctx.fillRect(bx + 16, by + 14, 4, 24);

            // High-visibility hazard orange warning band
            ctx.fillStyle = "#ff6a00";
            ctx.fillRect(bx + 14, by + 22, 20, 8);

            // Hazard stripe markers
            ctx.fillStyle = "#111111";
            ctx.fillRect(bx + 17, by + 24, 3, 4);
            ctx.fillRect(bx + 23, by + 24, 3, 4);
            ctx.fillRect(bx + 29, by + 24, 3, 4);

            // Top valve / cap
            ctx.fillStyle = "#15191e";
            ctx.fillRect(bx + 19, by + 9, 10, 5);

            // Ring pull / safety lever
            ctx.strokeStyle = "#cbd5e1";
            ctx.lineWidth = 2;
            ctx.strokeRect(bx + 26, by + 7, 5, 7);

            // Label badge above
            ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
            ctx.fillRect(bx + 8, by - 4, 32, 11);
            ctx.strokeStyle = "#ff6a00";
            ctx.lineWidth = 1;
            ctx.strokeRect(bx + 8, by - 4, 32, 11);
            ctx.fillStyle = "#ff8c00";
            ctx.font = "bold 8px monospace";
            ctx.textAlign = "center";
            ctx.fillText("SMOKE", bx + 24, by + 4);
            ctx.textAlign = "left";
        }

        // Draw key if not collected
        if (!map.key.collected) {
            const kx = map.key.x;
            const ky = map.key.y;
            const keyCenterX = kx + 24;
            const keyCenterY = ky + 24;

            // Soft shadow under key
            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            ctx.beginPath();
            ctx.ellipse(keyCenterX, keyCenterY + 14, 16, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Golden Key Ring Head
            ctx.strokeStyle = "#ffd700";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(keyCenterX - 8, keyCenterY, 8, 0, Math.PI * 2);
            ctx.stroke();

            // Golden Key Shaft
            ctx.fillStyle = "#ffd700";
            ctx.fillRect(keyCenterX, keyCenterY - 3, 20, 6);

            // Golden Key Teeth
            ctx.fillRect(keyCenterX + 10, keyCenterY + 3, 4, 7);
            ctx.fillRect(keyCenterX + 16, keyCenterY + 3, 4, 7);

            // Metallic shine / glint
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(keyCenterX - 11, keyCenterY - 4, 3, 3);
            ctx.fillRect(keyCenterX + 2, keyCenterY - 2, 8, 2);

            // Label badge above
            ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
            ctx.fillRect(keyCenterX - 16, ky - 4, 32, 11);
            ctx.strokeStyle = "#ffd700";
            ctx.lineWidth = 1;
            ctx.strokeRect(keyCenterX - 16, ky - 4, 32, 11);
            ctx.fillStyle = "#ffd700";
            ctx.font = "bold 8px monospace";
            ctx.textAlign = "center";
            ctx.fillText("KEY", keyCenterX, ky + 4);
            ctx.textAlign = "left";
        }

        // Draw locked gate if not open
        if (!map.gate.open) {
            const gx = map.gate.x;
            const gy = map.gate.y;
            const gw = map.gate.width;
            const gh = map.gate.height;
            const gCenterX = gx + gw / 2;
            const gCenterY = gy + gh / 2;

            // Dark doorway recess
            ctx.fillStyle = "#0a0b0e";
            ctx.fillRect(gx, gy, gw, gh);

            // Heavy iron vertical bars
            const barSpacing = 14;
            const barCount = Math.floor(gw / barSpacing);
            for (let i = 1; i <= barCount; i++) {
                const barX = gx + i * (gw / (barCount + 1)) - 2;
                ctx.fillStyle = "#333842";
                ctx.fillRect(barX, gy, 5, gh);
                ctx.fillStyle = "#64748b";
                ctx.fillRect(barX + 1, gy, 2, gh);
            }

            // Top and bottom crossbars
            ctx.fillStyle = "#1e2229";
            ctx.fillRect(gx, gy + 8, gw, 6);
            ctx.fillRect(gx, gy + gh - 14, gw, 6);
            ctx.fillStyle = "#475569";
            ctx.fillRect(gx, gy + 8, gw, 1);
            ctx.fillRect(gx, gy + gh - 14, gw, 1);

            // Red padlock in center
            ctx.fillStyle = "#b91c1c";
            ctx.fillRect(gCenterX - 14, gCenterY - 8, 28, 18);
            ctx.strokeStyle = "#94a3b8";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(gCenterX, gCenterY - 8, 8, Math.PI, 0);
            ctx.stroke();

            // Padlock keyhole & label
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 9px monospace";
            ctx.textAlign = "center";
            ctx.fillText("LOCKED", gCenterX, gCenterY + 4);
            ctx.textAlign = "left";
        }
    };

    map.isWall = function (column, row) {
        if (column < 0 || row < 0 || column >= map.columns || row >= map.rows) {
            return true;
        }
        return map.collision[row][column] === 1;
    };

    map.gridToCenter = function (column, row) {
        return {
            x: column * map.tileSize + map.tileSize / 2,
            y: row * map.tileSize + map.tileSize / 2
        };
    };

    return map;
}

function createLevelTwoMap() {
    const map = {
        tileSize: 48, columns: 50, rows: 30, width: 2400, height: 1440,
        image: new Image(), loaded: false, collision: [],
        playerStart: { x: 1079, y: 175 },
        securityPass: { x: 191, y: 864, width: 48, height: 48, collected: false },
        chemicals: [], securityGates: [], finalExit: [], terminal: null,
        securityOpen: false, exitOpen: false
    };
    for (let y = 0; y < map.rows; y++) map.collision[y] = Array(map.columns).fill(0);
    map.image.onload = function () { map.loaded = true; };
    map.image.src = "assets/map2.png";
    map.entity = function (obj) {
        const scale = 3;
        return { x: obj.x * scale, y: (obj.gid ? obj.y - obj.height : obj.y) * scale, width: (obj.width || 16) * scale, height: (obj.height || 16) * scale };
    };
    map.setCollisionRect = function (rect, value) {
        const left = Math.max(0, Math.floor(rect.x / map.tileSize));
        const right = Math.min(map.columns - 1, Math.floor((rect.x + rect.width - 1) / map.tileSize));
        const top = Math.max(0, Math.floor(rect.y / map.tileSize));
        const bottom = Math.min(map.rows - 1, Math.floor((rect.y + rect.height - 1) / map.tileSize));
        for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) map.collision[y][x] = value ? 1 : 0;
    };
    map.ready = fetch("assets/map2.tmj").then(function (response) { return response.json(); }).then(function (data) {
        map.columns = data.width; map.rows = data.height; map.tileSize = data.tilewidth * 3;
        map.width = map.columns * map.tileSize; map.height = map.rows * map.tileSize;
        const walls = data.layers.find(function (layer) { return layer.name === "walls"; });
        if (walls) for (let y = 0; y < map.rows; y++) for (let x = 0; x < map.columns; x++) map.collision[y][x] = walls.data[y * map.columns + x] > 0 ? 1 : 0;
        const entities = data.layers.find(function (layer) { return layer.name === "entities" || layer.type === "objectgroup"; });
        if (!entities || !entities.objects) return;
        entities.objects.forEach(function (obj) {
            const entity = map.entity(obj);
            if (obj.name === "player_start") map.playerStart = { x: obj.x * 3, y: obj.y * 3 };
            else if (obj.name === "security_pass" || obj.name === "access_key") map.securityPass = Object.assign(entity, { collected: false });
            else if (/^chemical_0[1-4]$/.test(obj.name) || /^bottle_[1-4]$/.test(obj.name)) map.chemicals.push(Object.assign(entity, { collected: false }));
            else if (obj.name === "security_exit_u" || obj.name === "security_exit_l" || obj.name === "security_gate_u" || obj.name === "security_gate_l") map.securityGates.push(entity);
            else if (obj.name === "exit_r" || obj.name === "exit_l" || obj.name === "exit_gate_r" || obj.name === "exit_gate_l") map.finalExit.push(entity);
            else if (obj.name === "control_terminal") map.terminal = entity;
        });
    });
    map.isWall = function (column, row) { return column < 0 || row < 0 || column >= map.columns || row >= map.rows || map.collision[row][column] === 1; };
    map.gridToCenter = function (column, row) { return { x: column * map.tileSize + map.tileSize / 2, y: row * map.tileSize + map.tileSize / 2 }; };
    map.drawMarker = function (ctx, entity, color, label) {
        const x = entity.x + entity.width / 2, y = entity.y + entity.height / 2;
        ctx.fillStyle = "rgba(0,0,0,.65)"; ctx.fillRect(x - 25, y - 31, 50, 14);
        ctx.strokeStyle = color; ctx.strokeRect(x - 25, y - 31, 50, 14);
        ctx.fillStyle = color; ctx.font = "bold 8px monospace"; ctx.textAlign = "center"; ctx.fillText(label, x, y - 21); ctx.textAlign = "left";
    };
    map.draw = function (ctx) {
        ctx.fillStyle = "#10151d"; ctx.fillRect(0, 0, map.width, map.height);
        if (map.loaded) ctx.drawImage(map.image, 0, 0, map.width, map.height);
        if (!map.securityPass.collected) { map.drawMarker(ctx, map.securityPass, "#59d8ff", "PASS"); ctx.fillStyle = "#59d8ff"; ctx.fillRect(map.securityPass.x + 18, map.securityPass.y + 18, 12, 18); }
        map.chemicals.forEach(function (chemical) { if (!chemical.collected) { map.drawMarker(ctx, chemical, "#d68cff", "CHEM"); ctx.fillStyle = "#d68cff"; ctx.fillRect(chemical.x + 18, chemical.y + 15, 12, 22); } });
        if (!map.securityOpen) map.securityGates.forEach(function (gate) { ctx.fillStyle = "rgba(220,45,45,.82)"; ctx.fillRect(gate.x, gate.y, gate.width, gate.height); });
        if (!map.exitOpen) map.finalExit.forEach(function (gate) { ctx.fillStyle = "rgba(220,45,45,.82)"; ctx.fillRect(gate.x, gate.y, gate.width, gate.height); });
    };
    return map;
}
