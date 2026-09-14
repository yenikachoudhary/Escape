function startGame() {

  const hero = document.getElementById("hero");
  const briefing = document.getElementById("briefing");
  const status = document.getElementById("status");
  const button = document.getElementById("startBtn");
  
  button.disabled = true;
  status.textContent = "INITIALIZING...";
  status.style.color = "#ff5e00";
  
  setTimeout(function () {
    status.textContent = "LEVEL 1: INFILTRATE THE PRISON";
    status.style.color = "#39ff14";
    setTimeout(function () {
      hero.classList.add("hide");
      briefing.classList.add("show");
    }, 1000);
  }, 1000);
}

document.getElementById("beginMissionBtn").addEventListener("click", function () {
  
  const briefing = document.getElementById("briefing");
  const gameScreen = document.getElementById("game");
  const canvas = document.getElementById("canvas");
  
  briefing.classList.remove("show");
  gameScreen.classList.add("show");
  
  createGame(canvas);
});