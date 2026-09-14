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

  createGame(canvas, currentLevel);
});

function showLevelTwoBriefing() {
  const briefing = document.getElementById("briefing");
  const box = briefing.querySelector(".briefing-box");
  box.innerHTML = `
    <div class="briefing-label">CLASSIFIED // LEVEL 02</div>
    <h1>MISSION BRIEFING</h1><div class="briefing-line"></div>
    <h2>THE CONTROL BLOCK</h2>
    <p>You escaped the first section of the prison, but the facility is still locked down.<br><br>The main exit is heavily guarded.<br><br>Find the security pass, enter the restricted area, collect the four chemical bottles, disable the guards protecting the final exit, and escape.</p>
    <h2>CONTROLS</h2><div class="controls"><div><span>W A S D</span><label>MOVE</label></div><div><span>ARROW KEYS</span><label>MOVE</label></div><div><span>E</span><label>INTERACT / PICK UP</label></div><div><span>Q</span><label>USE SPECIAL ITEM</label></div></div>
    <h2>OBJECTIVES</h2><ol><li>Find the security pass</li><li>Enter the security area</li><li>Collect 4 chemical bottles</li><li>Reach the final exit</li><li>Disable the final guards</li><li>Escape</li></ol>
    <button id="beginMissionBtn">BEGIN MISSION</button>`;
  briefing.classList.add("show");
  document.getElementById("beginMissionBtn").addEventListener("click", function () {
    briefing.classList.remove("show");
    document.getElementById("game").classList.add("show");
    createGame(document.getElementById("canvas"), 2);
  });
}
