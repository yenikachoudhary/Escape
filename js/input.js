function createInput() {
    const keys = {};
    const pressed = {};

    window.addEventListener("keydown", function (event) {
        const key = event.key.toLowerCase();
        if (!keys[key]) pressed[key] = true;
        keys[key] = true;
        if (event.key.startsWith("Arrow")) {
            event.preventDefault();
        }
    });

    window.addEventListener("keyup", function (event) {
        keys[event.key.toLowerCase()] = false;
    });

    return {
        isDown: function (key) {
            return keys[key.toLowerCase()] === true;
        },
        consume: function (key) {
            const normalizedKey = key.toLowerCase();
            if (!pressed[normalizedKey]) return false;
            pressed[normalizedKey] = false;
            return true;
        }
    };
}
