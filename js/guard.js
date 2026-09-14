function createGuard(game, x, y) {
    const guard = {
        x: x - 15,
        y: y - 15,
        width: 30,
        height: 30,
        speed: 55,
        directionX: 1,
        directionY: 0,
        directionTimer: 0,
        visionRange: 280,
        visionAngle: Math.PI / 2,
        stunned: false,
        stunTimer: 0,
        caughtPlayer: false
    };

    guard.chooseDirection = function () {
        const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];
        const direction = directions[Math.floor(Math.random() * directions.length)];
        guard.directionX = direction.x;
        guard.directionY = direction.y;
        guard.directionTimer = 1.5 + Math.random() * 2.5;
    };

    guard.update = function (delta) {
        if (guard.stunned) {
            guard.stunTimer -= delta;
            if (guard.stunTimer <= 0) {
                guard.stunned = false;
                guard.stunTimer = 0;
                guard.chooseDirection();
            }
            return;
        }

        if (guard.caughtPlayer) {
            return;
        }

        guard.directionTimer -= delta;
        if (guard.directionTimer <= 0) {
            guard.chooseDirection();
        }

        const moveX = guard.directionX * guard.speed * delta;
        const moveY = guard.directionY * guard.speed * delta;
        const nextX = guard.x + moveX;
        const nextY = guard.y + moveY;
        let blocked = false;

        if (!guard.collides(nextX, guard.y)) {
            guard.x = nextX;
        } else {
            blocked = true;
        }

        if (!guard.collides(guard.x, nextY)) {
            guard.y = nextY;
        } else {
            blocked = true;
        }

        if (blocked) {
            guard.chooseDirection();
        }
    };

    guard.collides = function (x, y) {
        const left = Math.floor(x / game.map.tileSize);
        const right = Math.floor((x + guard.width - 1) / game.map.tileSize);
        const top = Math.floor(y / game.map.tileSize);
        const bottom = Math.floor((y + guard.height - 1) / game.map.tileSize);
        return (
            game.map.isWall(left, top) ||
            game.map.isWall(right, top) ||
            game.map.isWall(left, bottom) ||
            game.map.isWall(right, bottom)
        );
    };

    guard.canSeePlayer = function () {
        if (guard.stunned) {
            return false;
        }

        const player = game.player;
        const guardCenterX = guard.x + guard.width / 2;
        const guardCenterY = guard.y + guard.height / 2;
        const dx = player.centerX - guardCenterX;
        const dy = player.centerY - guardCenterY;
        const distance = Math.hypot(dx, dy);

        if (distance > guard.visionRange) {
            return false;
        }

        if (distance === 0) {
            return true;
        }

        const playerX = dx / distance;
        const playerY = dy / distance;
        const dot = guard.directionX * playerX + guard.directionY * playerY;
        const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

        if (angle > guard.visionAngle / 2) {
            return false;
        }

        const steps = Math.ceil(distance / 12);
        for (let i = 1; i < steps; i++) {
            const progress = i / steps;
            const checkX = guardCenterX + dx * progress;
            const checkY = guardCenterY + dy * progress;
            const column = Math.floor(checkX / game.map.tileSize);
            const row = Math.floor(checkY / game.map.tileSize);
            if (game.map.isWall(column, row)) {
                return false;
            }
        }

        return true;
    };

    guard.stun = function () {
        guard.stunned = true;
        guard.stunTimer = 10;
    };

    guard.draw = function (ctx) {
        const centerX = guard.x + guard.width / 2;
        const centerY = guard.y + guard.height / 2;

        if (!guard.stunned) {
            ctx.save();
            ctx.fillStyle = "rgba(255, 60, 60, 0.12)";
            ctx.beginPath();
            const facingAngle = Math.atan2(guard.directionY, guard.directionX);
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, guard.visionRange, facingAngle - guard.visionAngle / 2, facingAngle + guard.visionAngle / 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(guard.x + 4, guard.y + 5, guard.width, guard.height);

        ctx.fillStyle = "#ff3b3b";
        ctx.fillRect(guard.x, guard.y, guard.width, guard.height);

        ctx.fillStyle = "#111";
        ctx.fillRect(guard.x + 5, guard.y + 6, 20, 7);

        if (guard.stunned) {
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 20px monospace";
            ctx.textAlign = "center";
            ctx.fillText("ZZZ", centerX, guard.y - 10);
            ctx.textAlign = "left";
        }
    };

    guard.chooseDirection();
    return guard;
}