function createInput() {
    const keys = {};

    window.addEventListener("keydown", function (event) {
        keys[event.key.toLowerCase()] = true;
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
        }
    };
}