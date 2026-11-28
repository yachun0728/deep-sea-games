  /* ---------- No Overtime!: auto-fire lane shooter; fixed BONUS +2 per boss day cleared on days 1-5 (max 10 per run) ---------- */
  var otBusy=false,otStake=0,otSay=function(){};
  (function(){
'use strict';
// ====== 基本設定 ======
const W=450,H=800,MID=W/2,TOP=56,PY=H-112,LINE=H-150,STAGE_LEN=35;
const FONT='"PingFang TC","Noto Sans TC","Microsoft JhengHei","Heiti TC",sans-serif';
// ====== 平台設定（BONUS 為固定里程碑獎勵，不依入場費計算）======
const BONUS_PER_DAY=2,BONUS_DAYS=5,BEST_KEY='deep-sea-office-shoot-best';
const cv=$('os-canvas'),ctx=cv.getContext('2d');
{const dpr=Math.min(window.devicePixelRatio||1,2);cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}

// Approved art direction 02: full painted office + native-alpha comic actors.
const COMIC_PATH='games/office-shoot/art/comic-v2/';
const comic={};let comicReady=false,comicFailed=false,comicStarted=false,walkClock=0,walkX=0;
const WORLD_TOP=210,VIEW_LINE=600,WORLD_SCALE=(VIEW_LINE-WORLD_TOP)/LINE;
// Presentation-only horizontal projection: retain the approved narrower supply lane.
// Simulation coordinates and all collision/spawn rules stay in the original 450x800 world.
const VIEW_MID=190,VIEW_ANCHOR=MID/2;
function drawX(x){return x<=VIEW_ANCHOR?x:x<=MID?VIEW_ANCHOR+(x-VIEW_ANCHOR)*(VIEW_MID-VIEW_ANCHOR)/(MID-VIEW_ANCHOR):VIEW_MID+(x-MID)*(W-VIEW_MID)/(W-MID);}
function worldX(x){return x<=VIEW_ANCHOR?x:x<=VIEW_MID?VIEW_ANCHOR+(x-VIEW_ANCHOR)*(MID-VIEW_ANCHOR)/(VIEW_MID-VIEW_ANCHOR):MID+(x-VIEW_MID)*(W-MID)/(W-VIEW_MID);}

const comicNames=['office','player','folder','paper','meeting','boss','crate','stapler','coffee','pen','shredder','printer','laser','walk','frame','footer'];
function loadComicArt(){
  if(comicStarted)return;comicStarted=true;
  if(typeof Image==='undefined'){comicReady=true;return;}
  let pending=comicNames.length+1;
  const loaded=()=>{if(--pending===0){comicReady=true;comicFailed=false;}};
  if(document.fonts&&document.fonts.load){
    Promise.all([document.fonts.load('900 22px "Office Comic TC"'),document.fonts.load('900 28px "Office Comic Latin"')]).then(loaded,()=>{comicFailed=true;});
  }else loaded();
  for(const name of comicNames){
    const im=new Image();comic[name]=im;
    im.onload=loaded;
    im.onerror=()=>{comicFailed=true;};
    im.src=COMIC_PATH+name+'.webp';
  }
}
if(typeof Image==='undefined')comicReady=true; // Behavior fixtures do not load raster assets.
const comicBounds={"paper": [1, 22, 256, 376], "meeting": [1, 103, 256, 376], "shredder": [1, 103, 256, 376], "coffee": [1, 171, 256, 376], "crate": [1, 119, 256, 376], "pen": [100, 16, 157, 376], "boss": [1, 191, 256, 376], "laser": [92, 16, 164, 376], "stapler": [26, 237, 256, 376], "folder": [1, 121, 256, 376], "printer": [1, 153, 256, 376], "player": [20, 16, 238, 376]};
function comicImage(name,x,y,w,h){
  const im=comic[name];if(!im||!im.complete||!im.naturalWidth)return;
  const b=comicBounds[name];
  if(!b){ctx.drawImage(im,x,y,w,h);return;}
  const sw=b[2]-b[0],sh=b[3]-b[1],k=Math.min(w/sw,h/sh);
  ctx.drawImage(im,b[0],b[1],sw,sh,x+(w-sw*k)/2,y+(h-sh*k)/2,sw*k,sh*k);
}
function comicBox(x,y,w,h,fill){
  ctx.fillStyle='#050709';ctx.fillRect(x+3,y+3,w,h);
  ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);ctx.strokeStyle='#f8f3df';ctx.lineWidth=1.5;ctx.strokeRect(x,y,w,h);
}
function comicText(text,x,y,size,color,max){
  ctx.font=`italic 900 ${size}px "Office Comic Latin",Impact,"Arial Black","Office Comic TC",${FONT}`;ctx.textBaseline='middle';ctx.fillStyle=color;
  ctx.fillText(text,x,y,max||W);
}
// ====== 多語系：每個字串寫成「中文|English」，語言跟隨大廳切換 ======
let lang='zh';
function syncLang(){lang=(window.deepSeaI18n&&window.deepSeaI18n.getLanguage()==='en')?'en':'zh';}
syncLang();
const ZH=s=>{s=RULE_TEXT[s]||s;return s.slice(0,s.indexOf('|'));},EN=s=>{s=RULE_TEXT[s]||s;return s.slice(s.indexOf('|')+1);};
const L=s=>lang==='en'?EN(s):ZH(s);
const LF=(s,o)=>L(s).replace(/\{(\w+)\}/g,(m,k)=>o[k]);
const pickL=a=>L(a[Math.floor(Math.random()*a.length)]);
const wName=w=>L(w.name),bName=d=>L(d.name),bHint=d=>L(d.hint),mLabel=m=>L(m.label);
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const UNITS=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];
function fmtMul(x){return x<10?x.toFixed(2):x<1000?x.toFixed(1):fmt(x);}
function fmt(n){n=Math.max(0,Math.ceil(n));if(n<1000)return ''+n;let i=Math.min(UNITS.length-1,Math.floor(Math.log10(n)/3));const v=n/Math.pow(1000,i);return (v<10?v.toFixed(1):Math.floor(v))+UNITS[i];}
function hexA(h,a){const n=parseInt(h.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;}
function rr(x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function circle(x,y,r){ctx.beginPath();ctx.arc(x,y,Math.max(0,r),0,Math.PI*2);}
function seeded(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hsl2hex(h,s,l){s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));return '#'+[f(0),f(8),f(4)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');}
function wpick(list){let tw=0;for(const x of list)tw+=x[1];let r=Math.random()*tw;for(const x of list){r-=x[1];if(r<=0)return x[0];}return list[0][0];}

const RULE_TEXT={
  "office-shoot.say.001": "{{tb:office-shoot.say.001}}",
  "office-shoot.say.002": "{{tb:office-shoot.say.002}}",
  "office-shoot.say.003": "{{tb:office-shoot.say.003}}",
  "office-shoot.say.004": "{{tb:office-shoot.say.004}}",
  "office-shoot.say.005": "{{tb:office-shoot.say.005}}",
  "office-shoot.say.006": "{{tb:office-shoot.say.006}}",
  "office-shoot.say.007": "{{tb:office-shoot.say.007}}",
  "office-shoot.say.008": "{{tb:office-shoot.say.008}}",
  "office-shoot.say.009": "{{tb:office-shoot.say.009}}",
  "office-shoot.say.010": "{{tb:office-shoot.say.010}}",
  "office-shoot.say.011": "{{tb:office-shoot.say.011}}",
  "office-shoot.say.012": "{{tb:office-shoot.say.012}}",
  "office-shoot.say.013": "{{tb:office-shoot.say.013}}",
  "office-shoot.say.014": "{{tb:office-shoot.say.014}}",
  "office-shoot.say.015": "{{tb:office-shoot.say.015}}",
  "office-shoot.say.016": "{{tb:office-shoot.say.016}}",
  "office-shoot.say.017": "{{tb:office-shoot.say.017}}",
  "office-shoot.say.018": "{{tb:office-shoot.say.018}}",
  "office-shoot.say.019": "{{tb:office-shoot.say.019}}",
  "office-shoot.say.020": "{{tb:office-shoot.say.020}}",
  "office-shoot.say.021": "{{tb:office-shoot.say.021}}",
  "office-shoot.say.022": "{{tb:office-shoot.say.022}}",
  "office-shoot.say.023": "{{tb:office-shoot.say.023}}",
  "office-shoot.say.024": "{{tb:office-shoot.say.024}}",
  "office-shoot.say.025": "{{tb:office-shoot.say.025}}",
  "office-shoot.say.026": "{{tb:office-shoot.say.026}}",
  "office-shoot.say.027": "{{tb:office-shoot.say.027}}",
  "office-shoot.say.028": "{{tb:office-shoot.say.028}}",
  "office-shoot.say.029": "{{tb:office-shoot.say.029}}",
  "office-shoot.say.030": "{{tb:office-shoot.say.030}}",
  "office-shoot.say.031": "{{tb:office-shoot.say.031}}",
  "office-shoot.say.032": "{{tb:office-shoot.say.032}}",
  "office-shoot.say.033": "{{tb:office-shoot.say.033}}",
  "office-shoot.say.034": "{{tb:office-shoot.say.034}}",
  "office-shoot.say.035": "{{tb:office-shoot.say.035}}",
  "office-shoot.say.036": "{{tb:office-shoot.say.036}}",
  "office-shoot.say.037": "{{tb:office-shoot.say.037}}",
  "office-shoot.say.038": "{{tb:office-shoot.say.038}}",
  "office-shoot.say.039": "{{tb:office-shoot.say.039}}",
  "office-shoot.say.040": "{{tb:office-shoot.say.040}}",
  "office-shoot.say.041": "{{tb:office-shoot.say.041}}",
  "office-shoot.say.042": "{{tb:office-shoot.say.042}}",
  "office-shoot.say.043": "{{tb:office-shoot.say.043}}",
  "office-shoot.say.044": "{{tb:office-shoot.say.044}}",
  "office-shoot.say.045": "{{tb:office-shoot.say.045}}",
  "office-shoot.say.046": "{{tb:office-shoot.say.046}}",
  "office-shoot.say.047": "{{tb:office-shoot.say.047}}",
  "office-shoot.say.048": "{{tb:office-shoot.say.048}}",
  "office-shoot.say.049": "{{tb:office-shoot.say.049}}",
  "office-shoot.say.050": "{{tb:office-shoot.say.050}}",
  "office-shoot.say.051": "{{tb:office-shoot.say.051}}",
  "office-shoot.say.052": "{{tb:office-shoot.say.052}}",
  "office-shoot.say.053": "{{tb:office-shoot.say.053}}",
  "office-shoot.say.054": "{{tb:office-shoot.say.054}}",
  "office-shoot.say.055": "{{tb:office-shoot.say.055}}",
  "office-shoot.say.056": "{{tb:office-shoot.say.056}}",
  "office-shoot.say.057": "{{tb:office-shoot.say.057}}",
  "office-shoot.say.058": "{{tb:office-shoot.say.058}}",
  "office-shoot.say.059": "{{tb:office-shoot.say.059}}",
  "office-shoot.say.060": "{{tb:office-shoot.say.060}}",
  "office-shoot.say.061": "{{tb:office-shoot.say.061}}",
  "office-shoot.say.062": "{{tb:office-shoot.say.062}}",
  "office-shoot.say.063": "{{tb:office-shoot.say.063}}",
  "office-shoot.say.064": "{{tb:office-shoot.say.064}}",
  "office-shoot.say.065": "{{tb:office-shoot.say.065}}",
  "office-shoot.say.066": "{{tb:office-shoot.say.066}}",
  "office-shoot.say.067": "{{tb:office-shoot.say.067}}",
  "office-shoot.say.068": "{{tb:office-shoot.say.068}}",
  "office-shoot.say.069": "{{tb:office-shoot.say.069}}",
  "office-shoot.say.070": "{{tb:office-shoot.say.070}}",
  "office-shoot.say.071": "{{tb:office-shoot.say.071}}",
  "office-shoot.say.072": "{{tb:office-shoot.say.072}}",
  "office-shoot.say.073": "{{tb:office-shoot.say.073}}",
  "office-shoot.say.074": "{{tb:office-shoot.say.074}}",
  "office-shoot.say.075": "{{tb:office-shoot.say.075}}",
  "office-shoot.say.076": "{{tb:office-shoot.say.076}}",
  "office-shoot.say.077": "{{tb:office-shoot.say.077}}",
  "office-shoot.say.078": "{{tb:office-shoot.say.078}}",
  "office-shoot.say.079": "{{tb:office-shoot.say.079}}",
  "office-shoot.say.080": "{{tb:office-shoot.say.080}}",
  "office-shoot.say.081": "{{tb:office-shoot.say.081}}",
  "office-shoot.say.082": "{{tb:office-shoot.say.082}}",
  "office-shoot.say.083": "{{tb:office-shoot.say.083}}",
  "office-shoot.say.084": "{{tb:office-shoot.say.084}}",
  "office-shoot.say.085": "{{tb:office-shoot.say.085}}",
  "office-shoot.say.086": "{{tb:office-shoot.say.086}}",
  "office-shoot.say.087": "{{tb:office-shoot.say.087}}",
  "office-shoot.say.088": "{{tb:office-shoot.say.088}}",
  "office-shoot.say.089": "{{tb:office-shoot.say.089}}",
  "office-shoot.say.090": "{{tb:office-shoot.say.090}}",
  "office-shoot.say.091": "{{tb:office-shoot.say.091}}",
  "office-shoot.say.092": "{{tb:office-shoot.say.092}}",
  "office-shoot.say.093": "{{tb:office-shoot.say.093}}",
  "office-shoot.say.094": "{{tb:office-shoot.say.094}}",
  "office-shoot.say.095": "{{tb:office-shoot.say.095}}",
  "office-shoot.say.096": "{{tb:office-shoot.say.096}}",
  "office-shoot.say.097": "{{tb:office-shoot.say.097}}",
  "office-shoot.say.098": "{{tb:office-shoot.say.098}}",
  "office-shoot.say.099": "{{tb:office-shoot.say.099}}",
  "office-shoot.say.100": "{{tb:office-shoot.say.100}}",
  "office-shoot.say.101": "{{tb:office-shoot.say.101}}"
};
let G,keys;
let state='menu',phase,stage,stageT,phaseT,score,t,overT,kills,p,bullets,enemies,crates,bosses,hazards,parts,texts,beams,rings,shake,banner,flash,danger,bossTotal,curBoss,spawnT,crateT,sinceWeapon,modsTaken,eliteT,shotSfxT,quipT,critT,overTitle,overQuip;
let WEAPONS,WDPS,GUN_LEN,MODS,ETYPES,SHAPES,BOSS_DEFS,QUIPS,MISS,OVER_T,OVER_Q;
let best=0;try{best=+localStorage.getItem(BEST_KEY)||0}catch(e){}
function syncSimulation(){({state,phase,stage,stageT,phaseT,score,t,overT,kills,p,bullets,enemies,crates,bosses,hazards,parts,texts,beams,rings,shake,banner,flash,danger,bossTotal,curBoss,spawnT,crateT,sinceWeapon,modsTaken,eliteT,shotSfxT,quipT,critT,overTitle,overQuip,WEAPONS,WDPS,GUN_LEN,MODS,ETYPES,SHAPES,BOSS_DEFS,QUIPS,MISS,OVER_T,OVER_Q,keys}=G);}
function reset(random){
 G=officeShootRules.createGame(random||Math.random,{L,ZH,EN,language:()=>lang,tone,
  dayCleared:day=>{syncSimulation();dayCleared(day);},
  end:()=>{syncSimulation();if(score>best){best=score;try{localStorage.setItem(BEST_KEY,''+best)}catch(e){}}settle();rank.finish(score);ui();}});
 syncSimulation();
}
function dps(){return G.dps();}
function floatText(...args){return G.floatText(...args);}
function updateFx(dt){G.updateFx(dt);syncSimulation();}
function update(dt){G.update(dt);syncSimulation();}
const rank=timedLeaderboard('office-shoot','os',officeShootRules.inputCount,ui,
 ()=>window.dispatchEvent(new CustomEvent('deep-sea-score-saved',{detail:{gameId:'office-shoot'}})),
 {canvas:'os-canvas',maxInputs:4000});
function input(code){if(state!=='play')return;officeShootRules.input(G,code);rank.record(code);}
function target(x){const code=Math.round(clamp(x,0,W)*officeShootRules.TARGET_SCALE);if(Math.round(p.tx*officeShootRules.TARGET_SCALE)!==code)input(code);}
reset();
// ====== 音效 ======
let actx=null,muted=false;
function initAudio(){if(actx)return;try{actx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){actx=null;}}
function tone(f,d,type,v,slide,delay){
  if(!actx||muted)return;
  try{
    const t0=actx.currentTime+(delay||0);
    const o=actx.createOscillator(),g=actx.createGain();
    o.type=type||'square';o.frequency.setValueAtTime(f,t0);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t0+d);
    g.gain.setValueAtTime(v||.05,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+d);
    o.connect(g);g.connect(actx.destination);o.start(t0);o.stop(t0+d+.02);
  }catch(e){}
}

// ====== 繪製 ======
function drawBG(){
  // Every frame uses the full approved scene, including both edges and carpet.
  const office=comic.office;
  if(office&&office.complete&&office.naturalWidth)ctx.drawImage(office,0,105,900,1495,0,104,W,H-104-52);
  const y=210,bot=VIEW_LINE-10;
  ctx.save();ctx.lineWidth=2.5;ctx.setLineDash([10,7]);
  for(const [col,x1,x2] of [['#00d8f6',58,174],['#ff3948',211,W-36]]){
    ctx.strokeStyle=col;
    for(const x of [x1,x2]){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,bot);ctx.stroke();}
  }
  ctx.setLineDash([]);ctx.restore();
  ctx.textAlign='center';
  comicBox(65,y-27,104,22,'#00d8f6');comicText(L('{{tb:office-shoot.comic.supply}}'),117,y-16,16,'#030709');
  comicBox(248,y-27,142,22,'#ff3948');comicText(L('{{tb:office-shoot.comic.work}}'),319,y-16,16,'#030709');
  ctx.save();ctx.beginPath();ctx.rect(0,VIEW_LINE-8,W,18);ctx.clip();ctx.fillStyle='#ff6031';ctx.fillRect(0,VIEW_LINE-8,W,18);
  ctx.strokeStyle='#101015';ctx.lineWidth=4;
  for(let x=-20;x<W+20;x+=14){ctx.beginPath();ctx.moveTo(x,VIEW_LINE+10);ctx.lineTo(x+12,VIEW_LINE-8);ctx.stroke();}
  ctx.fillStyle='#ff6031';ctx.fillRect(W/2-92,VIEW_LINE-8,184,18);ctx.restore();
  ctx.textAlign='center';comicText(L('{{tb:office-shoot.comic.line}}'),W/2,VIEW_LINE+1,13,'#050709',180);
}
function drawGun(gx,gy,tier,w,s){
  const name=['pen','stapler','shredder','laser','coffee','printer','laser'][tier];
  ctx.save();ctx.translate(gx,gy);if(s)ctx.scale(s,s);
  comicImage(name,-11,-GUN_LEN[tier]-10,22,GUN_LEN[tier]+12);ctx.restore();
}
function drawPlayer(){
  // Rear-view animation has alternating feet/knees, not whole-image bobbing.
  const moving=Math.abs(p.x-walkX)>.25;
  if(moving)walkClock+=Math.abs(p.x-walkX)/95;
  walkX=p.x;
  const sheet=comic.walk,idx=moving?Math.floor(walkClock*8)%6:0;
  ctx.save();ctx.translate(drawX(p.x),PY);
  const im=moving?sheet:comic.player;
  ctx.save();if(p.tier>0){ctx.beginPath();ctx.rect(-70,-104,140,180);ctx.clip();}
  if(im&&im.complete&&im.naturalWidth){
    if(moving){const sw=im.naturalWidth/6;ctx.drawImage(im,idx*sw,0,sw,im.naturalHeight,-52,-128,104,174);}
    else comicImage('player',-52,-128,104,174);
  }
  ctx.restore();
  // The approved ballpoint is baked into the first tier; upgraded tools replace its silhouette.
  if(p.tier>0)drawGun(18,-92+p.recoil,p.tier,WEAPONS[p.tier],1);
  for(let i=1;i<p.barrels;i++)drawGun((i-(p.barrels-1)/2)*15,-92+p.recoil,p.tier,WEAPONS[p.tier],.7);
  if(p.recoil>2&&p.stun<=0){
    ctx.fillStyle='#fff231';ctx.strokeStyle='#090909';ctx.lineWidth=1.5;
    ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?3:8;const x=18+Math.cos(a)*r,y=-128+Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();
  }
  if(p.stun>0){ctx.textAlign='center';comicText(L('{{tb:office-shoot.comic.stun}}'),0,-146,15,'#fff231',70);}
  ctx.restore();
}
function eyes(r,y,sp,angry,col){
  for(const sd of [-1,1]){ctx.fillStyle='#fff';circle(sd*r*sp,y,r*.22);ctx.fill();ctx.fillStyle=col||'#111';circle(sd*r*sp,y+r*.07,r*.11);ctx.fill();
    if(angry){ctx.strokeStyle='#111';ctx.lineWidth=Math.max(1.5,r*.1);ctx.beginPath();ctx.moveTo(sd*r*(sp+.25),y-r*.32);ctx.lineTo(sd*r*(sp-.18),y-r*.2);ctx.stroke();}}
}
function txt(s,x,y,size,col,bold,maxW){ctx.font=`${bold===false?'':'bold '}${size}px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=col;if(maxW)ctx.fillText(s,x,y,maxW);else ctx.fillText(s,x,y);}
function drawEnemy(e){
  const r=e.r,fl=e.hit>0;
  const name=['tank','armor','healer'].includes(e.type)?'paper':['splitter','mini','shield','runner'].includes(e.type)?'meeting':'folder';
  ctx.save();ctx.translate(drawX(e.x),e.y);ctx.scale(1,1/WORLD_SCALE);ctx.rotate(Math.sin(e.wob*.5)*.04);
  const size=r*4.3;comicImage(name,-size/2,-size/2,size,size);
  if(e.elite){ctx.strokeStyle='#ffed24';ctx.lineWidth=2;ctx.strokeRect(-size/2-2,-size/2-2,size+4,size+4);}
  ctx.textAlign='center';
  comicBox(-r-3,r+3,r*2+6,13,e.shieldHits>0?'#00cef5':'#d92335');
  comicText(e.shieldHits>0?'SH '+fmt(e.shieldHits):fmt(e.hp),0,r+10,9,'#fff');
  if(fl){ctx.save();ctx.translate(r+10,-r-5);ctx.rotate(-.16);comicBox(-15,-8,30,16,'#ffed24');comicText('PAK!',0,0,10,'#050709');ctx.restore();}
  ctx.restore();
}
function drawCrate(c,top){
  const isW=c.weapon!=null,w=Math.min(c.w-24,78),h=48;
  ctx.save();ctx.translate(drawX(c.x),c.y);ctx.scale(1,1/WORLD_SCALE);ctx.textAlign='center';
  if(!top){
    comicImage('crate',-w/2,-h/2,w,h);
    if(c.hit>0){ctx.strokeStyle='#fff232';ctx.lineWidth=2;ctx.strokeRect(-w/2,-h/2,w,h);}
  }else{
    comicBox(-w/2,h/2,w,17,'#060b0f');comicText(fmt(c.shield),0,h/2+9,12,'#fff');
    const label=isW?wName(WEAPONS[c.weapon]):mLabel(c.mod);
    comicBox(-Math.min(c.w/2-5,78),-h/2-20,Math.min(c.w-10,156),17,'#00cce9');
    comicText(label,0,-h/2-11,11,'#02080c',Math.min(c.w-18,146));
  }
  ctx.restore();
}
function drawBoss(b){
  const d=b.def,sh=SHAPES[d.shape],w=sh.w,h=sh.h,M=b.M,fl=b.hit>0&&!b.fake&&Math.floor(t*30)%3===0;
  ctx.save();ctx.translate(drawX(b.x),b.y);ctx.scale(b.scale,b.scale/WORLD_SCALE);
  if(b.fake)ctx.globalAlpha=.6+.3*Math.abs(Math.sin(t*6+b.hx));
  else{ctx.fillStyle='rgba(0,0,0,.45)';ctx.beginPath();ctx.ellipse(0,h/2+6,w*.58,13,0,0,6.283);ctx.fill();}
  if(b.absorbOn>0){ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<3;i++){const q=((t*60+i*30)%90)+30;ctx.strokeStyle=`rgba(200,80,255,${.5*(1-(q-30)/90)})`;ctx.lineWidth=3;circle(0,0,w*.5+90-q);ctx.stroke();}ctx.restore();}
  comicImage(d.look==='folder'?'folder':d.look==='robot'?'printer':'boss',-w*.62,-h*.64,w*1.24,h*1.28);
  if(M.has('hive')){const notes=['{{tb:office-shoot.say.121}}','{{tb:office-shoot.say.122}}','{{tb:office-shoot.say.123}}','{{tb:office-shoot.say.124}}'].map(L);for(let i=0;i<4;i++){const x=(i%2?.36:-.36)*w,y=(i<2?.08:.32)*h;ctx.save();ctx.translate(x,y);ctx.rotate((i-1.5)*.15);ctx.fillStyle='#ffe066';ctx.fillRect(-14,-10,28,20);ctx.fillStyle='#7a5c00';ctx.font=`bold 8px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(notes[i],0,0,26);ctx.restore();}}
  if(d.crown){ctx.fillStyle='#ffd43b';ctx.beginPath();ctx.moveTo(-26,-h/2+2);for(let i=0;i<5;i++)ctx.lineTo(-26+i*13,-h/2-(i%2?6:18));ctx.lineTo(26,-h/2+2);ctx.closePath();ctx.fill();}
  if(M.has('weak')){const wx=b.weakX/b.scale,wy=h/2-12,pr=18+Math.sin(t*10)*2;
    const g=ctx.createRadialGradient(wx,wy,0,wx,wy,pr*1.6);g.addColorStop(0,'#fff');g.addColorStop(.35,'#ff2a2a');g.addColorStop(1,'rgba(255,0,0,0)');
    ctx.fillStyle=g;circle(wx,wy,pr*1.6);ctx.fill();ctx.strokeStyle='#ffdddd';ctx.lineWidth=2;circle(wx,wy,pr);ctx.stroke();
    ctx.fillStyle='#fff';ctx.font=`bold 9px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(L('{{tb:office-shoot.say.125}}'),wx,wy,32);}
  if(M.has('shield')){
    if(b.shieldOn>0){const a=.35+.15*Math.sin(t*12);ctx.fillStyle=`rgba(255,120,30,${a})`;ctx.strokeStyle='#ffb347';ctx.lineWidth=4;
      ctx.beginPath();ctx.ellipse(0,0,w*.72,h*.72,0,0,6.283);ctx.fill();ctx.stroke();
      ctx.fillStyle='#e03131';rr(-52,h*.5,104,22,5);ctx.fill();ctx.fillStyle='#fff';ctx.font=`bold 13px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(L('{{tb:office-shoot.say.126}}'),0,h*.5+11,98);}
    else if(b.shieldT<.9&&Math.sin(t*30)>0){ctx.strokeStyle='#ffb347';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,w*.72,h*.72,0,0,6.283);ctx.stroke();}
  }
  if(b.absorbOn>0){bubble(w*.15,-h/2-30,L('{{tb:office-shoot.say.127}}'),'#c77dff');}
  if(M.has('regen')&&b.idle>1.5&&b.hp<b.max&&!b.fake){ctx.strokeStyle='rgba(125,255,154,.8)';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,w*.6,h*.6,0,0,6.283);ctx.stroke();bubble(0,-h/2-30,L('{{tb:office-shoot.say.128}}'),'#7dff9a');}
  ctx.restore();
}
function faceFeatures(w,h,d,b,ey){
  const red=b.absorbOn>0;
  for(const sd of [-1,1]){
    const ex=sd*w*.17;
    if(red){ctx.fillStyle='rgba(255,0,0,.35)';circle(ex,ey,14);ctx.fill();}
    ctx.fillStyle='#fff';circle(ex,ey,8);ctx.fill();ctx.fillStyle=red?'#ff0000':'#111';circle(ex,ey+2,4);ctx.fill();
    ctx.strokeStyle='#2a1f1a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(ex+sd*10,ey-14);ctx.lineTo(ex-sd*7,ey-9);ctx.stroke();
  }
  if(d.glasses){ctx.strokeStyle='#111';ctx.lineWidth=2.5;for(const sd of [-1,1])rr(sd*w*.17-12,ey-9,24,18,4),ctx.stroke();ctx.beginPath();ctx.moveTo(-w*.17+12,ey);ctx.lineTo(w*.17-12,ey);ctx.stroke();}
  const my=ey+h*.2;
  ctx.fillStyle='#5a1414';ctx.beginPath();ctx.ellipse(0,my,w*.13,6+Math.abs(Math.sin(b.t*5))*5,0,0,6.283);ctx.fill();
  ctx.fillStyle='#fff';ctx.fillRect(-w*.1,my-6,w*.2,3);
}
function bubble(x,y,s,col){
  ctx.font=`bold 13px ${FONT}`;const tw=ctx.measureText(s).width+16;
  ctx.fillStyle='#fff';ctx.strokeStyle=col;ctx.lineWidth=2.5;rr(x-tw/2,y-13,tw,26,10);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(x-6,y+12);ctx.lineTo(x,y+22);ctx.lineTo(x+6,y+12);ctx.closePath();ctx.fill();
  ctx.fillStyle='#222';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,x,y);
}
function drawHazards(){
  for(const h of hazards){
    ctx.save();ctx.translate(drawX(h.x),h.y);
    if(h.type==='rock'){ // 飛來的文件夾
      ctx.rotate(h.rot);ctx.fillStyle=h.hit>0?'#fff':'#e0a96d';ctx.strokeStyle='#6b3e26';ctx.lineWidth=2;
      rr(-h.r,-h.r*.75,h.r*2,h.r*1.5,3);ctx.fill();ctx.stroke();
      ctx.fillStyle='#fff';ctx.fillRect(-h.r*.7,-h.r*.95,h.r*1.2,h.r*.4);
      txt(L('{{tb:office-shoot.say.129}}'),0,h.r*.1,7,'#6b3e26',true,h.r*1.9);
    }else{ // 「進度？」訊息彈
      ctx.fillStyle='rgba(255,120,120,.35)';circle(-h.vx*.04,-h.vy*.04,8);ctx.fill();
      ctx.fillStyle=h.hit>0?'#fff':'#ff6b6b';rr(-17,-10,34,20,9);ctx.fill();
      ctx.beginPath();ctx.moveTo(-4,9);ctx.lineTo(0,16);ctx.lineTo(4,9);ctx.closePath();ctx.fill();
      txt(L('{{tb:office-shoot.say.130}}'),0,0,10,'#fff',true,30);
    }
    ctx.restore();
    const tt=(PY-h.y)/Math.max(1,h.vy);
    if(h.vy>0&&tt<1.2){const tx=drawX(h.x+h.vx*tt);ctx.strokeStyle=`rgba(255,80,80,${.3+.3*Math.sin(t*20)})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(tx,PY+6,22,7,0,0,6.283);ctx.stroke();}
  }
}
function drawBullets(){
  ctx.save();ctx.beginPath();ctx.rect(0,0,W,(PY-128-WORLD_TOP)/WORLD_SCALE);ctx.clip();
  for(const b of bullets){
    if(b.laser){ctx.strokeStyle=b.col;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(drawX(b.x),b.y);ctx.lineTo(drawX(b.x),b.y+28);ctx.stroke();
      ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(drawX(b.x),b.y);ctx.lineTo(drawX(b.x),b.y+24);ctx.stroke();}
    else if(b.rocket){ // 咖啡杯
      ctx.fillStyle='#8a5a3a';ctx.beginPath();ctx.moveTo(drawX(b.x)-5,b.y-6);ctx.lineTo(drawX(b.x)+5,b.y-6);ctx.lineTo(drawX(b.x)+4,b.y+7);ctx.lineTo(drawX(b.x)-4,b.y+7);ctx.closePath();ctx.fill();
      ctx.fillStyle='#fff';ctx.fillRect(drawX(b.x)-6,b.y-9,12,3);ctx.fillStyle='#e0a96d';ctx.fillRect(drawX(b.x)-5,b.y-1,10,3);}
    else if(b.orb){ // 揉爛的紙團
      ctx.fillStyle=hexA(b.col,.35);circle(drawX(b.x),b.y,b.r*1.8);ctx.fill();
      ctx.fillStyle='#f5f7fa';circle(drawX(b.x),b.y,b.r);ctx.fill();
      ctx.strokeStyle='#9aa4b5';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(drawX(b.x)-b.r*.6,b.y-b.r*.2);ctx.lineTo(drawX(b.x),b.y+b.r*.3);ctx.lineTo(drawX(b.x)+b.r*.5,b.y-b.r*.4);ctx.moveTo(drawX(b.x)-b.r*.2,b.y-b.r*.7);ctx.lineTo(drawX(b.x)+b.r*.1,b.y);ctx.stroke();}
    else if(b.look==='staple'){ctx.strokeStyle='#e8ecf2';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(drawX(b.x)-4,b.y+3);ctx.lineTo(drawX(b.x)-4,b.y-2);ctx.lineTo(drawX(b.x)+4,b.y-2);ctx.lineTo(drawX(b.x)+4,b.y+3);ctx.stroke();}
    else if(b.look==='shred'){ctx.save();ctx.translate(drawX(b.x),b.y);ctx.rotate(Math.atan2(b.vy,b.vx)+Math.PI/2);ctx.fillStyle='#fff';ctx.fillRect(-1.2,-5,2.4,10);ctx.restore();}
    else{ctx.fillStyle=b.col;ctx.beginPath();ctx.moveTo(drawX(b.x),b.y-b.r*1.6);ctx.quadraticCurveTo(drawX(b.x)+b.r,b.y,drawX(b.x),b.y+b.r);ctx.quadraticCurveTo(drawX(b.x)-b.r,b.y,drawX(b.x),b.y-b.r*1.6);ctx.fill();}
  }
  ctx.restore();
}
function drawBeams(){
  ctx.save();ctx.beginPath();ctx.rect(0,0,W,(PY-128-WORLD_TOP)/WORLD_SCALE);ctx.clip();
  for(const q of beams){const k=q.life/q.max,bw=q.w*k;
    ctx.fillStyle=hexA(q.col,.12*k);ctx.fillRect(drawX(q.x)-bw,0,bw*2,PY-40);
    ctx.fillStyle=hexA(q.col,.45*k);ctx.fillRect(drawX(q.x)-bw/2,0,bw,PY-40);
    ctx.fillStyle=`rgba(255,255,255,${k})`;ctx.fillRect(drawX(q.x)-bw/6,0,bw/3,PY-40);
    if(q.tag==null)q.tag=rand(120,PY-120);
    ctx.globalAlpha=k;ctx.font=`bold 11px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.fillText(L('{{tb:office-shoot.say.131}}'),drawX(q.x)+14,q.tag);ctx.globalAlpha=1;}
  ctx.restore();
}
function drawParts(){
  for(const q of parts){const k=q.life/q.max;ctx.fillStyle=hexA(q.col,Math.min(1,k*1.5));ctx.fillRect(drawX(q.x)-q.size/2,q.y-q.size/2,q.size,q.size);}
  for(const q of rings){const k=q.life/q.mx;ctx.strokeStyle=hexA(q.col,k*.8);ctx.lineWidth=3*k+1;circle(drawX(q.x),q.y,q.r);ctx.stroke();}
}
function drawTexts(){
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(const q of texts){const k=q.life/q.max;ctx.globalAlpha=Math.min(1,k*2);
    ctx.font=`bold ${q.size}px ${FONT}`;ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.8)';ctx.strokeText(q.text,drawX(q.x),q.y);ctx.fillStyle=q.col;ctx.fillText(q.text,drawX(q.x),q.y);}
  ctx.globalAlpha=1;
}
function drawVignette(){
  // Use the actual approved inked side rails; no synthetic clean rectangular frame.
  const im=comic.frame;if(!im||!im.complete||!im.naturalWidth)return;
  ctx.drawImage(im,932,5,8,1013,0,0,6,H);
  ctx.drawImage(im,1522,5,10,1013,W-7,0,7,H);
}
function clockStr(){
  if(phase!=='waves')return L('{{tb:office-shoot.say.132}}');
  const m=Math.floor(9*60+8*60*Math.min(1,stageT/STAGE_LEN));
  return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
}
function drawHUD(){
  const im=comic.frame;
  if(!im||!im.complete||!im.naturalWidth)return;
  // Native crops retain the approved brushwork, dividers, arrow, portrait and icons.
  ctx.drawImage(im,935,5,592,130,0,0,W,104);
  ctx.fillStyle='#020304';
  ctx.fillRect(190,12,91,32);ctx.fillRect(354,12,86,32);
  ctx.textAlign='center';
  if(stage!==1){ctx.fillRect(61,12,115,32);comicText('DAY '+stage,119,29,28,'#fff126',105);}
  comicText(clockStr(),235,29,28,'#fff7e7',86);
  ctx.textAlign='right';comicText(score.toLocaleString(),439,29,28,'#fff126',84);
  if(paused){ctx.fillStyle='#fff02b';ctx.fillRect(298,18,33,23);ctx.fillStyle='#050608';ctx.beginPath();ctx.moveTo(309,22);ctx.lineTo(309,37);ctx.lineTo(323,29);ctx.closePath();ctx.fill();}
  const real=bosses.filter(b=>!b.dead&&!b.fake);
  const k=phase==='boss'&&real.length?Math.max(0,real.reduce((sum,b)=>sum+b.hp,0)/bossTotal):Math.min(1,stageT/STAGE_LEN);
  ctx.fillStyle='#100b10';ctx.fillRect(119,73,286,14);
  if(k>0)ctx.drawImage(im,1100,97,330*Math.min(1,k),16,119,73,286*Math.min(1,k),14);
  // The user's 22:41 screenshot is the source of truth for the pen and arrows.
  // Preserve their actual pixel proportions instead of stretching the original board strip.
  const footer=comic.footer,stretch=(cv.clientHeight||H)/H/((cv.clientWidth||W)/W);
  const fh=W*85/592/stretch,by=H-fh;
  if(footer&&footer.complete&&footer.naturalWidth)ctx.drawImage(footer,108,61,592,85,0,by,W,fh);
  if(lang!=='en'){
    ctx.fillStyle='#020304';ctx.fillRect(148,by+fh*.12,226,fh*.64);
    ctx.save();ctx.translate(260,by+fh*.43);ctx.transform(1,0,-.16,1/stretch,0,0);
    ctx.font='900 24px "Office Comic TC",'+FONT;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#fff126';ctx.strokeStyle='#fff126';ctx.lineWidth=.45;
    const label=L('{{tb:office-shoot.comic.move}}');ctx.strokeText(label,0,0,218);ctx.fillText(label,0,0,218);ctx.restore();
  }

}
function drawBanner(){
  if(!banner)return;
  const k=banner.t/banner.dur,a=k<.12?k/.12:k>.8?(1-k)/.2:1,sc=k<.12?1.6-.6*(k/.12):1,hh=banner.hint?50:40;
  ctx.save();ctx.globalAlpha=a;ctx.translate(W/2,H*.38);
  ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(-W/2,-40,W,40+hh);
  ctx.fillStyle=hexA(banner.col,.8);ctx.fillRect(-W/2,-40,W,2);ctx.fillRect(-W/2,hh-2,W,2);
  ctx.textAlign='center';ctx.textBaseline='middle';
  if(banner.hint){ctx.font=`bold 14px ${FONT}`;ctx.fillStyle='#ffd27a';ctx.fillText(banner.hint,0,36,W-20);}
  ctx.scale(sc,sc);
  ctx.font=`900 32px ${FONT}`;ctx.lineWidth=6;ctx.strokeStyle='#000';ctx.strokeText(banner.text,0,-8,W-20);ctx.fillStyle=banner.col;ctx.fillText(banner.text,0,-8,W-20);
  ctx.font=`bold 14px ${FONT}`;ctx.fillStyle='#fff';ctx.fillText(banner.sub,0,18,W-20);
  ctx.restore();
}
function drawOverlay(title,titleCol,lines,cta,y0){
  const menu=state==='menu',ys=menu?H*.32:H*.27;
  ctx.textAlign='center';comicBox(20,ys-64,W-40,menu?286:390,'#080a0f');
  comicBox(28,ys-57,W-56,57,'#ffed26');
  comicText(menu?'NO OVERTIME!':title,W/2,ys-28,menu?33:27,'#080a0c',W-76);
  const selected=menu?[lines[2],lines[3],lines[4],lines[5],lines[6],lines[8]]:lines;
  let y=ys+25;
  for(const l of selected){if(!l)continue;comicText(l.t,W/2,y,Math.min(l.s||15,19),l.c||'#f8f3df',W-68);y+=menu?31:32;}
  if(cta){comicText(cta,W/2,ys+(menu?220:302),16,'#ffed26',W-64);}
}
function render(){
  ctx.setTransform(cv.width/W,0,0,cv.height/H,0,0);
  if(!comicReady){
    ctx.fillStyle='#07111d';ctx.fillRect(0,0,W,H);comicImage('office',0,0,W,H);
    comicBox(24,H*.4,W-48,100,'#05080c');ctx.textAlign='center';
    comicText(comicFailed?L('{{tb:office-shoot.comic.loadFailed}}'):L('{{tb:office-shoot.comic.loading}}'),W/2,H*.4+50,21,'#fff126',W-72);
    return;
  }
  ctx.save();
  if(shake>0)ctx.translate(rand(-shake,shake),rand(-shake,shake));
  drawBG();
  // Camera projection reserves the illustrated back wall without changing world positions,
  // speed, spawn timing, collision radii, weapon range or the clock-out threshold.
  ctx.save();ctx.beginPath();ctx.rect(0,WORLD_TOP-10,W,PY+40-WORLD_TOP);ctx.clip();
  ctx.translate(0,WORLD_TOP);ctx.scale(1,WORLD_SCALE);
  for(const c of crates)drawCrate(c);
  for(const e of enemies)drawEnemy(e);
  for(const b of bosses)if(!b.dead)drawBoss(b);
  drawHazards();
  ctx.globalCompositeOperation='lighter';drawBeams();drawParts();ctx.globalCompositeOperation='source-over';
  drawBullets();
  for(const c of crates)drawCrate(c,true);
  drawTexts();
  ctx.restore();
  if(state!=='over'||overT<.15)drawPlayer();
  ctx.restore();
  drawVignette();drawHUD();drawBanner();
  if(flash>0){ctx.fillStyle=`rgba(255,255,255,${flash*.5})`;ctx.fillRect(0,0,W,H);}
  if(state==='menu'){
    drawOverlay(L('{{tb:office-shoot.say.136}}'),'#ffe066',[
      {t:L('NO OVERTIME!|Leave work on time. At any cost.'),c:'#8a93a6',s:13,gap:36},
      {t:L('{{tb:office-shoot.say.137}}'),b:1,gap:28},
      {t:L('{{tb:office-shoot.say.138}}'),c:'#8fe3d8',gap:28},
      {t:L('{{tb:office-shoot.say.139}}'),c:'#ff9aa8',gap:28},
      {t:L('{{tb:office-shoot.say.140}}'),c:'#ffd43b',gap:28},
      {t:L('{{tb:office-shoot.say.141}}'),c:'#ffd43b',gap:30},
      {t:LF('{{tb:office-shoot.say.142}}',{d:BONUS_DAYS,n:BONUS_PER_DAY}),c:'#ffe066',b:1,gap:34},
      {t:L('{{tb:office-shoot.say.143}}')+WEAPONS.map(wName).join(' → '),s:11,c:'#a9b3c6',gap:28},
      {t:best?LF('{{tb:office-shoot.say.144}}',{n:best.toLocaleString()}):'',s:14,c:'#7dffa1'},
    ],L('{{tb:office-shoot.say.145}}'),H*.3);
  }else if(state==='over'&&overT>.6){
    drawOverlay(L(OVER_T[overTitle]),'#ff5f6d',[
      {t:LF('{{tb:office-shoot.say.146}}',{n:score.toLocaleString()}),b:1,s:26,gap:40},
      {t:LF('{{tb:office-shoot.say.147}}',{n:best.toLocaleString()}),c:'#7dffa1',gap:40},
      {t:LF('{{tb:office-shoot.say.148}}',{d:stage,k:kills})},
      {t:LF('{{tb:office-shoot.say.149}}',{w:wName(WEAPONS[p.tier]),a:p.tier+1,b:WEAPONS.length}),c:WEAPONS[p.tier].color},
      {t:curBoss&&phase==='boss'?LF('{{tb:office-shoot.say.150}}',{b:bName(curBoss)}):'',c:'#ff9aa8',gap:40},
      {t:LF('{{tb:office-shoot.say.151}}',{n:earned}),c:'#ffe066',b:1},
      {t:L(OVER_Q[overQuip]),c:'#a9b3c6',s:14},
    ],overT>1.1?L('{{tb:office-shoot.say.152}}'):'');
  }else if(state==='play'&&paused){
    drawOverlay(L('{{tb:office-shoot.say.153}}'),'#8fe3d8',[{t:L('{{tb:office-shoot.say.154}}'),b:1}],'');
  }
}
// ====== 輸入（只在本款畫面顯示時作用）======
let paused=false,drag=null;
function osShown(){return !$v.hidden&&!document.hidden;}
function clearInput(){if(state==='play')input(officeShootRules.CLEAR);keys.left=keys.right=false;drag=null;}
function pauseNow(){if(state==='play'&&!paused){paused=true;clearInput();}last=null;}
addEventListener('keydown',e=>{
  if(!osShown()||e.metaKey||e.altKey||e.ctrlKey)return;
  if(['INPUT','BUTTON','A','SUMMARY','SELECT','TEXTAREA'].indexOf(e.target&&e.target.tagName)>=0)return;
  const k=e.key;
  if(k==='m'||k==='M'){muted=!muted;return;}
  if(state!=='play')return;
  if(k==='ArrowLeft'||k==='a'||k==='A'){input(officeShootRules.KEY_LEFT_DOWN);e.preventDefault();}
  else if(k==='ArrowRight'||k==='d'||k==='D'){input(officeShootRules.KEY_RIGHT_DOWN);e.preventDefault();}
  else if(k===' '||k==='Enter'){e.preventDefault();if(paused){paused=false;last=null;}}
});
addEventListener('keyup',e=>{const k=e.key;
  if(k==='ArrowLeft'||k==='a'||k==='A')input(officeShootRules.KEY_LEFT_UP);
  if(k==='ArrowRight'||k==='d'||k==='D')input(officeShootRules.KEY_RIGHT_UP);});
function toLocal(e){const r=cv.getBoundingClientRect();const sx=(e.clientX-r.left)/r.width*W;return{x:worldX(sx),screenX:sx,y:(e.clientY-r.top)/r.height*H};}
cv.addEventListener('pointerdown',e=>{
  if(!osShown())return;
  if(e.pointerType==='mouse'&&e.button!==0)return;
  e.preventDefault();initAudio();const pt=toLocal(e);
  if(state!=='play'){say(state==='over'?'{{tb:office-shoot.say.155}}':'{{tb:office-shoot.say.156}}');return;}
  try{cv.focus();}catch(_){}
  if(paused){paused=false;last=null;return;}
  if(e.pointerType==='mouse'){target(pt.x);}
  else{drag={off:drawX(p.x)-pt.screenX};try{cv.setPointerCapture(e.pointerId);}catch(_){}}
});
cv.addEventListener('pointermove',e=>{
  if(state!=='play'||paused||!osShown())return;
  const pt=toLocal(e);
  if(e.pointerType==='mouse')target(pt.x);
  else if(drag)target(worldX(pt.screenX+drag.off));
});
const endDrag=()=>{drag=null;};
cv.addEventListener('pointerup',endDrag);cv.addEventListener('pointercancel',endDrag);cv.addEventListener('lostpointercapture',endDrag);
cv.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('blur',pauseNow);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseNow();else last=null;});
window.addEventListener('hashchange',pauseNow);

// ====== 平台：單次扣款、固定 BONUS、單次結算 ======
var $v=$('view-office-shoot'),analytics=null,earned=0,paidDays={};
// 訊息與數值欄位標記 data-i18n-ignore，每格依目前語言從「中文|English」輸出；按鈕沿用大廳翻譯層
let msg={text:'{{tb:office-shoot.say.157}}',kind:'',params:{d:BONUS_DAYS,n:BONUS_PER_DAY}};
function msgText(){const t=msg.text;if(t.indexOf('|')>=0)return LF(t,msg.params||{});return lang==='en'&&window.deepSeaI18n?window.deepSeaI18n.text(t):t;}
function say(text,kind,params){msg={text:String(text),kind:kind||'',params};renderMsg();}
function renderMsg(){const m=$('os-msg'),v=msgText(),c='msg'+(msg.kind?' '+msg.kind:'');if(m.textContent!==v)m.textContent=v;if(m.className!==c)m.className=c;}
otSay=function(t){syncLang();say(t);};
const domCache={};
function setText(id,v){if(domCache[id]!==v){domCache[id]=v;$(id).textContent=v;}}
function ui(){
  const live=state==='play',played=live||state==='over';
  setText('os-day',played?LF('{{tb:office-shoot.say.133}}',{n:stage}):'—');
  setText('os-score',played?score.toLocaleString():'—');
  setText('os-best',best.toLocaleString());
  setText('os-pay',earned+' / '+BONUS_PER_DAY*BONUS_DAYS);
  const b=$('os-go');b.disabled=live||!comicReady||rank.busy();
  if($v.dataset)$v.dataset.round=state;
  setText('os-pause',paused?'▶':'Ⅱ');
  setText('os-sound',muted?'♫ ×':'♫');
  $('os-sound').hidden=!(state==='play'&&paused);
  if(!comicReady){setText('os-go',comicFailed?L('{{tb:office-shoot.comic.loadFailed}}'):L('{{tb:office-shoot.comic.loading}}'));renderMsg();return;}
  setText('os-go',live?'{{t:office-shoot.msg.158}}':state==='over'?'{{t:office-shoot.msg.159}}':'{{t:office-shoot.msg.160}}');
  renderMsg();
}
// 擊敗第 1～BONUS_DAYS 天的大魔王：每天固定 +BONUS_PER_DAY 點，每天每局只發一次
function dayCleared(day){
  if(!otBusy||day>BONUS_DAYS||paidDays[day])return;
  paidDays[day]=true;earned+=BONUS_PER_DAY;S.balance+=BONUS_PER_DAY;save();renderAll();
  if(analytics)AN.progress(analytics,{stage:day,step:kills,score,bonus_points:BONUS_PER_DAY,total_bonus_points:earned});
  floatText(p.x,PY-96,LF('{{tb:office-shoot.say.161}}',{n:BONUS_PER_DAY}),'#ffe066',22);
  say('{{tb:office-shoot.say.162}}','win',{d:day,n:BONUS_PER_DAY});
}
function settle(){
  if(!otBusy)return;
  otBusy=false;otStake=0;clearInput();paused=false;
  if(analytics)AN.end(analytics,earned,earned>0?'complete':'loss',{stage,score,step:kills,weapon_level:p.tier+1});
  analytics=null;save();renderAll();
  if(earned)say('{{tb:office-shoot.say.163}}','win',{d:stage,n:earned});
  else say('{{tb:office-shoot.say.164}}','lose',{d:stage});
  ui();
}
function begin(){
  if(otBusy||rank.busy())return;
  if(!comicReady)return;
  if(ENTRY_FEE>S.balance){say(LOW_MSG,'lose');return;}
  rank.start(random=>{
  analytics=AN.start('office-shoot',ENTRY_FEE);otBusy=true;otStake=ENTRY_FEE;earned=0;paidDays={};
  save();renderAll();
  reset(random);clearInput();paused=false;state=G.state='play';last=null;initAudio();
  say('{{tb:office-shoot.say.165}}','',{d:BONUS_DAYS,n:BONUS_PER_DAY});
  ui();try{cv.focus();}catch(_){}
  },undefined,{rulesVersion:officeShootRules.rulesVersion});
  ui();
}
$('os-go').addEventListener('click',begin);
$('os-pause').addEventListener('click',()=>{if(state!=='play')return;if(paused){paused=false;last=null;}else pauseNow();});
$('os-sound').addEventListener('click',()=>{muted=!muted;});
// 先於共用離頁處理結束，讓 abandoned 帶上已入帳的 BONUS
window.addEventListener('pagehide',e=>{if(!e.persisted&&otBusy&&analytics){AN.end(analytics,earned,'abandoned',{stage,score,step:kills,weapon_level:p.tier+1});analytics=null;otBusy=false;otStake=0;}},true);

// ====== 主迴圈（離開畫面或背景時暫停）======
let last=null;
function frame(now){
  if(osShown()){
    loadComicArt();
    if(last===null)last=now;
    const dt=Math.min(.05,Math.max(0,(now-last)/1000)||0);last=now;
    syncLang();
    if(paused)updateFx(0);else rank.update(dt*1000,()=>state==='play'&&!paused,update);
    ui();render();
  }else last=null;
  requestAnimationFrame(frame);
}
ui();render();requestAnimationFrame(frame);
  })();
