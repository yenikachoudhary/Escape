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
        bomb: { x: 496 * 3, y: 370 * 3, collected: false },
        key: { x: 769 * 3, y: 240 * 3, collected: false },
        gate: { x: 1024 * 3, y: 415 * 3, width: 90, height: 48, open: false }
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
            if (!wallLayer) return;
            for (let y = 0; y < map.rows; y++) {
                for (let x = 0; x < map.columns; x++) {
                    const index = y * map.columns + x;
                    map.collision[y][x] = wallLayer.data[index] > 0? 1 : 0;
                }
            }
            console.log("MAP: Collision loaded");
        });

    map.draw = function (ctx) {
        ctx.fillStyle = "#241c2b";
        ctx.fillRect(0, 0, map.width, map.height);

        if (map.loaded) {
            ctx.drawImage(map.image, 0, 0, map.width, map.height);
        }

        if (!map.bomb.collected) {
            ctx.fillStyle = "#ff8c00";
            ctx.beginPath();
            ctx.arc(map.bomb.x + 24, map.bomb.y + 24, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 12px monospace";
            ctx.fillText("E", map.bomb.x + 20, map.bomb.y + 28);
        }

        if (!map.key.collected) {
            const keyX = map.key.x + 24;
            const keyY = map.key.y + 24;

            ctx.strokeStyle = "#ffd700";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(keyX, keyY, 9, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = "#ffd700";
            ctx.fillRect(keyX + 7, keyY - 3, 22, 6);
            ctx.fillRect(keyX + 20, keyY + 3, 5, 7);
            ctx.fillRect(keyX + 26, keyY + 3, 5, 7);

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 12px monospace";
            ctx.fillText("KEY", keyX - 12, keyY + 30);
        }

        if (!map.gate.open) {
            ctx.fillStyle = "#111111";
            ctx.fillRect(map.gate.x, map.gate.y, map.gate.width, map.gate.height);
            ctx.strokeStyle = "#ff3b3b";
            ctx.lineWidth = 5;
            ctx.strokeRect(map.gate.x, map.gate.y, map.gate.width, map.gate.height);
            ctx.fillStyle = "#ff3b3b";
            ctx.font = "bold 12px monospace";
            ctx.fillText("LOCKED", map.gate.x + 18, map.gate.y + 29);
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