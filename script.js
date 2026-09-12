function startGame() {
  var btn = document.getElementById('startBtn');
  var status = document.getElementById('status');
  var hero = document.getElementById('hero');
  var game = document.getElementById('game');

  btn.disabled = true;
  btn.style.opacity = "0.5";

  status.innerText = "INITIALIZING CORE DATA ENGINE...";
  status.style.color = "#ff5e00";

  setTimeout(function() {
    status.innerText = "LEVEL 1: USE SMOKE BOMB TO PUT GUARDS TO SLEEP & STEAL THE PRISON KEYS!";
    status.style.color = "#39ff14";

    setTimeout(function() {
      hero.classList.add('hide');
      game.classList.add('show');

      if (typeof initGame === 'function') {
        initGame();
      }
    }, 1500);

  }, 1200);
}