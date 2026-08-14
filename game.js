const API = "/api";
const dino = document.getElementById("dino");
const cactus = document.getElementById("cactus");
const game = document.getElementById("game");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const runsEl = document.getElementById("runs");
const message = document.getElementById("message");
const startBtn = document.getElementById("startBtn");
const playerName = document.getElementById("playerName");
const jumpBtn = document.getElementById("jumpBtn");
const restartBtn = document.getElementById("restartBtn");
const soundBtn = document.getElementById("soundBtn");
const refreshBtn = document.getElementById("refreshBtn");
const historyEl = document.getElementById("scoreHistory");
const summary = document.getElementById("summary");
const statusEl = document.getElementById("status");

let running=false, score=0, highScore=0, runs=0;
let cactusX=0, speed=6, lastTime=0, animationId=null;
let name="Anonymous";
let soundOn=localStorage.getItem("dinoSound") !== "off";
let audio=null;

function audioInit(){if(!audio) audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==="suspended")audio.resume()}
function beep(type){
  if(!soundOn)return;
  audioInit();
  const s={jump:[520,760,.11,"square"],score:[740,980,.08,"sine"],crash:[130,55,.28,"sawtooth"],start:[420,680,.14,"sine"],record:[900,1400,.18,"triangle"]}[type];
  const o=audio.createOscillator(),g=audio.createGain();
  o.type=s[3];o.frequency.setValueAtTime(s[0],audio.currentTime);o.frequency.exponentialRampToValueAtTime(s[1],audio.currentTime+s[2]);
  g.gain.setValueAtTime(.0001,audio.currentTime);g.gain.exponentialRampToValueAtTime(.12,audio.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+s[2]);
  o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+s[2]+.02);
}
function soundText(){soundBtn.textContent=soundOn?"🔊 Sound ON":"🔇 Sound OFF"}
soundText();

async function api(path,options={}){
  const r=await fetch(API+path,options);
  if(!r.ok)throw new Error(await r.text());
  return r.json();
}

async function loadStats(){
  try{
    const d=await api("/stats");
    highScore=d.highScore;runs=d.totalGames;
    highScoreEl.textContent=highScore;runsEl.textContent=runs;
    render(d.recentScores||[]);
    statusEl.textContent="";
  }catch(e){
    statusEl.textContent="Database connection problem. Make sure the server is running.";
    console.error(e);
  }
}

function render(scores){
  if(!scores.length){summary.textContent="No games yet — be the first!";historyEl.innerHTML="";return}
  summary.textContent=`${scores.length} recent score(s) • Highest: ${scores[0].score}`;
  historyEl.innerHTML=scores.map((x,i)=>`<li>${i===0?"🏆 ":""}<strong>${escapeHtml(x.player)}</strong> — ${x.score} points <small>(${new Date(x.createdAt).toLocaleString()})</small></li>`).join("");
}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

function startGame(){
  name=(playerName.value.trim()||"Anonymous").slice(0,30);
  audioInit();beep("start");running=true;score=0;speed=6;
  cactusX=game.clientWidth+50+Math.random()*120;scoreEl.textContent=0;
  message.style.display="none";lastTime=performance.now();
  cancelAnimationFrame(animationId);animationId=requestAnimationFrame(loop);
}
function jump(){
  if(!running||dino.classList.contains("jump"))return;
  beep("jump");dino.classList.add("jump");setTimeout(()=>dino.classList.remove("jump"),620);
}
function loop(t){
  if(!running)return;
  const dt=Math.min((t-lastTime)/16.67,2);lastTime=t;
  const old=Math.floor(score);score+=.08*dt;const now=Math.floor(score);scoreEl.textContent=now;
  if(now>old&&now>0&&now%100===0)beep("score");
  speed=Math.min(13,6+score/75);cactusX-=speed*dt;
  if(cactusX<-75)cactusX=game.clientWidth+30+Math.random()*190;
  cactus.style.left=cactusX+"px";
  const a=dino.getBoundingClientRect(),b=cactus.getBoundingClientRect();
  if(a.left+13<b.right-10&&a.right-13>b.left+10&&a.top+10<b.bottom-8&&a.bottom-8>b.top+8){gameOver();return}
  animationId=requestAnimationFrame(loop);
}
async function gameOver(){
  running=false;cancelAnimationFrame(animationId);
  const finalScore=Math.floor(score);
  try{
    const d=await api("/scores",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({player:name,score:finalScore})});
    const record=finalScore>highScore;highScore=d.highScore;runs=d.totalGames;
    highScoreEl.textContent=highScore;runsEl.textContent=runs;render(d.recentScores||[]);
    beep(record?"record":"crash");
    message.innerHTML=`<div class="panel"><div class="big">${record?"🏆":"💥"}</div><h2>${record?"NEW GLOBAL HIGH SCORE!":"Game Over!"}</h2><p><strong>${escapeHtml(name)}</strong>, your score is <strong>${finalScore}</strong></p><p>Global highest: <strong>${highScore}</strong></p><button id="again" class="primary">🚀 Play Again</button></div>`;
    message.style.display="flex";document.getElementById("again").onclick=startGame;
  }catch(e){
    beep("crash");message.innerHTML=`<div class="panel"><div class="big">⚠️</div><h2>Score Not Saved</h2><p>Game ended at <strong>${finalScore}</strong>, but the database could not be reached.</p><button id="again" class="primary">Try Again</button></div>`;message.style.display="flex";document.getElementById("again").onclick=startGame;console.error(e);
  }
}
startBtn.onclick=startGame;restartBtn.onclick=startGame;jumpBtn.onclick=jump;refreshBtn.onclick=loadStats;
soundBtn.onclick=()=>{soundOn=!soundOn;localStorage.setItem("dinoSound",soundOn?"on":"off");soundText();if(soundOn)beep("start")};
document.addEventListener("keydown",e=>{if(e.code==="Space"||e.code==="ArrowUp"){e.preventDefault();running?jump():startGame()}});
game.addEventListener("pointerdown",e=>{if(e.target.tagName!=="BUTTON"&&e.target.tagName!=="INPUT"){running?jump():startGame()}});
loadStats();
