let game = null;
let levelComplete = false;
let currentLevel = 1;

function createGame(canvas, level) {
    if (game) game.running = false;
    currentLevel = level || 1;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    canvas.width = 960; canvas.height = 576; levelComplete = false;
    game = { canvas, ctx, input: createInput(), currentLevel, map: currentLevel === 2 ? createLevelTwoMap() : createMap(), player: null, guards: [], camera: null, smokeParticles: [], lastTime: 0, running: true, caught: false, level3: false, hudBanner: null, proximityPrompt: null };
    game.setObjective = text => { document.getElementById("objective").textContent = text; };
    game.showBanner = (text, timer, onComplete, type) => { game.hudBanner = { text, timer: timer || 3, onComplete: onComplete || null, type: type || "info" }; };
    game.triggerSmoke = (x, y) => { for (let i=0;i<90;i++) { const a=Math.random()*Math.PI*2; game.smokeParticles.push({x,y,vx:Math.cos(a)*(45+Math.random()*160),vy:Math.sin(a)*(45+Math.random()*160),life:0,maxLife:3,radius:16+Math.random()*26}); } };
    game.onBombCollected = () => { game.setObjective("OBJECTIVE: USE THE SMOKE BOMB"); game.showBanner("SMOKE BOMB SECURED", 2, null, "success"); };
    game.onSmokeUsed = () => { game.setObjective("OBJECTIVE: FIND THE PRISON KEY"); game.showBanner("SMOKE DEPLOYED — GUARDS DISABLED", 3, null, "warning"); };
    game.onKeyCollected = () => { game.setObjective("OBJECTIVE: REACH THE EXIT GATE"); game.showBanner("KEY ACQUIRED", 2, null, "success"); };
    game.onGateOpened = () => { game.setObjective("LEVEL COMPLETE"); game.showBanner("EXIT UNLOCKED", 2, null, "success"); };
    game.updateLevelTwoPlayer = updateLevelTwoPlayer;
    const ready = () => { setupWorld(); requestAnimationFrame(gameLoop); };
    currentLevel === 2 && game.map.ready ? game.map.ready.then(ready) : ready();
}

function setupWorld() {
    game.player = createPlayer(game);
    if (game.currentLevel === 1) { game.guards=[createGuard(game,500,200),createGuard(game,1400,600),createGuard(game,2300,500)]; game.setObjective("OBJECTIVE: FIND THE SMOKE BOMB"); document.getElementById("inventory").hidden=true; }
    else { const e=game.map.finalExit[0]||{x:2230,y:1000}; game.guards=[createGuard(game,e.x-60,e.y+30),createGuard(game,e.x+85,e.y+30)]; game.guards.forEach(g=>{g.speed=0;g.directionX=-1;g.directionY=0;g.directionTimer=999999;}); game.setObjective("OBJECTIVE: FIND THE SECURITY PASS"); document.getElementById("inventory").hidden=false; updateChemicalHud(); game.showBanner("FIND THE SECURITY PASS",3,null,"objective"); }
    game.camera=createCamera(game); game.camera.update(game.player);
}

function updateLevelTwoPlayer(player) {
    const map=game.map, near=e=>Math.hypot(player.centerX-e.x-e.width/2,player.centerY-e.y-e.height/2);
    if (!player.hasPass&&!map.securityPass.collected&&near(map.securityPass)<58&&game.input.isDown("e")) { player.hasPass=true;map.securityPass.collected=true;map.securityOpen=true;map.securityGates.forEach(g=>map.setCollisionRect(g,false));game.setObjective("OBJECTIVE: ENTER THE SECURITY AREA");game.showBanner("SECURITY PASS ACQUIRED",2,null,"success"); }
    map.chemicals.forEach(c=>{if(!c.collected&&near(c)<58&&game.input.isDown("e")){c.collected=true;player.chemicals=(player.chemicals||0)+1;updateChemicalHud();game.showBanner("CHEMICAL COLLECTED",1.5,null,"success");if(player.chemicals===4){game.setObjective("OBJECTIVE: REACH THE FINAL EXIT");game.showBanner("ALL CHEMICALS SECURED",2.5,null,"success");}}});
    const gateNear=map.securityGates.some(g=>near(g)<85), exitNear=map.finalExit.some(e=>near(e)<125);
    if(gateNear&&!player.hasPass)game.proximityPrompt={text:"SECURITY PASS REQUIRED",type:"warning"}; else if(gateNear)game.proximityPrompt={text:"SECURITY ACCESS GRANTED",type:"success"};
    if(exitNear&&player.chemicals===4&&!map.exitOpen){game.proximityPrompt={text:"PRESS Q TO USE THE CHEMICALS",type:"action"};if(game.input.isDown("q")){map.exitOpen=true;map.finalExit.forEach(e=>map.setCollisionRect(e,false));game.guards.forEach(g=>{g.permanentlyDisabled=true;g.stunned=true;});game.setObjective("OBJECTIVE: REACH THE EXIT");game.showBanner("EXIT CLEAR",3,null,"success");game.triggerSmoke(player.centerX,player.centerY);}}
    if(map.exitOpen&&map.finalExit.some(e=>near(e)<58))levelComplete=true;
    if(map.terminal&&near(map.terminal)<50&&game.input.isDown("e"))game.showBanner("CONTROL TERMINAL: EXIT ROUTE CONFIRMED",2,null,"info");
}
function updateChemicalHud(){document.getElementById("inventory").textContent="CHEMICALS: "+(game.player.chemicals||0)+" / 4";}
function gameLoop(t){if(!game||!game.running)return;if(!game.lastTime)game.lastTime=t;const d=Math.min((t-game.lastTime)/1000,.05);game.lastTime=t;updateGame(d);drawGame();requestAnimationFrame(gameLoop);}
function updateGame(d){if(game.caught||levelComplete||game.level3)return;game.proximityPrompt=null;game.player.update(d);game.guards.forEach(g=>{g.update(d);if(!g.stunned&&g.canSeePlayer()){game.caught=true;g.caughtPlayer=true;}});if(game.currentLevel===1)levelOnePrompts();game.smokeParticles=game.smokeParticles.filter(p=>{p.life+=d;p.x+=p.vx*d;p.y+=p.vy*d;p.vx*=.93;p.vy*=.93;return p.life<p.maxLife;});if(game.hudBanner&&game.hudBanner.timer>0){game.hudBanner.timer-=d;if(game.hudBanner.timer<=0&&game.hudBanner.onComplete)game.hudBanner.onComplete();}game.camera.update(game.player);if(game.currentLevel===1&&game.map.gate.open)levelComplete=true;}
function levelOnePrompts(){const p=game.player;if(!p.hasSmoke&&!game.map.bomb.collected&&Math.hypot(p.centerX-game.map.bomb.x-24,p.centerY-game.map.bomb.y-24)<65)game.proximityPrompt={text:"PRESS E TO PICK UP SMOKE BOMB",type:"action"};else if(!p.hasKey&&!game.map.key.collected&&Math.hypot(p.centerX-game.map.key.x-24,p.centerY-game.map.key.y-24)<65)game.proximityPrompt={text:"PRESS E TO PICK UP KEY",type:"action"};}
function drawGame(){const c=game.ctx;c.clearRect(0,0,960,576);c.save();c.translate(-game.camera.x,-game.camera.y);game.map.draw(c);game.smokeParticles.forEach(p=>{c.fillStyle="rgba(190,235,210,"+(1-p.life/p.maxLife)*.35+")";c.beginPath();c.arc(p.x,p.y,p.radius,0,Math.PI*2);c.fill();});game.guards.forEach(g=>g.draw(c));game.player.draw(c);c.restore();if(!game.caught&&!levelComplete&&!game.level3)drawBanner();if(game.caught)overlay("CAUGHT","THE GUARD SPOTTED YOU","TRY AGAIN","#ff3b3b");if(levelComplete)overlay("LEVEL COMPLETE",game.currentLevel===1?"YOU ESCAPED THE PRISON":"THE CONTROL BLOCK IS CLEAR","NEXT LEVEL","#39ff14");if(game.level3){c.fillStyle="rgba(6,8,12,.96)";c.fillRect(0,0,960,576);c.fillStyle="#ff6a00";c.font="bold 18px monospace";c.textAlign="center";c.fillText("LEVEL 03",480,230);c.fillStyle="#fff";c.font="bold 34px monospace";c.fillText("THE COMPANION",480,280);c.fillStyle="#39ff14";c.font="bold 20px monospace";c.fillText("COMING NEXT",480,325);c.textAlign="left";}}
function drawBanner(){const m=game.proximityPrompt||(game.hudBanner&&game.hudBanner.timer>0?game.hudBanner:null);if(!m)return;const c=game.ctx,x=210,y=514,col=m.type==="warning"?"#ff3b3b":m.type==="action"?"#ff9900":"#39ff14";c.fillStyle="rgba(10,13,18,.9)";c.fillRect(x,y,540,44);c.strokeStyle=col;c.strokeRect(x,y,540,44);c.fillStyle=col;c.fillRect(x,y,4,44);c.fillStyle="#fff";c.font="bold 13px monospace";c.textAlign="center";c.fillText(m.text,480,541);c.textAlign="left";}
function overlay(a,b,button,color){const c=game.ctx;c.fillStyle="rgba(0,0,0,.82)";c.fillRect(0,0,960,576);c.fillStyle=color;c.font="bold 52px monospace";c.textAlign="center";c.fillText(a,480,243);c.fillStyle="#fff";c.font="bold 18px monospace";c.fillText(b,480,288);c.fillStyle="#39ff14";c.fillRect(350,323,220,55);c.fillStyle="#111";c.font="bold 18px monospace";c.fillText(button,480,358);c.textAlign="left";}
window.addEventListener("click",e=>{if(!game)return;const r=game.canvas.getBoundingClientRect(),x=(e.clientX-r.left)*960/r.width,y=(e.clientY-r.top)*576/r.height;if(x<350||x>570||y<323||y>378)return;if(game.caught)restartGame();else if(levelComplete&&game.currentLevel===1){game.running=false;currentLevel=2;showLevelTwoBriefing();}else if(levelComplete&&game.currentLevel===2){levelComplete=false;game.level3=true;}});
function restartGame(){createGame(document.getElementById("canvas"),game.currentLevel);}
