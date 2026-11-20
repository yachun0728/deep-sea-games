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

// ====== 多語系：每個字串寫成「中文|English」，語言跟隨大廳切換 ======
let lang='zh';
function syncLang(){lang=(window.deepSeaI18n&&window.deepSeaI18n.getLanguage()==='en')?'en':'zh';}
syncLang();
const ZH=s=>s.slice(0,s.indexOf('|')),EN=s=>s.slice(s.indexOf('|')+1);
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

// ====== 武器進化線 ======
const WEAPONS=[
 {name:'{{tb:office-shoot.say.001}}',en:'BALLPOINT PEN',color:'#4d8dff',rate:4,dmg:1,spd:720,type:'bullet',size:3.5,look:'ink',armor:'#5b6573',trim:'#d64545'},
 {name:'{{tb:office-shoot.say.002}}',en:'STAPLER',color:'#d9dee6',rate:10,dmg:1,spd:820,type:'bullet',size:3,jitter:.06,look:'staple',armor:'#3d4a63',trim:'#4dabf7'},
 {name:'{{tb:office-shoot.say.003}}',en:'SHREDDER',color:'#ffffff',rate:2.4,dmg:1.6,spd:680,type:'spread',pellets:5,spread:.34,size:3.5,armor:'#4a3b2f',trim:'#ffa94d'},
 {name:'{{tb:office-shoot.say.004}}',en:'LASER POINTER',color:'#ff3b3b',rate:7,dmg:4.3,spd:1150,type:'laser',pierce:3,armor:'#1f2937',trim:'#ff3b3b'},
 {name:'{{tb:office-shoot.say.005}}',en:'COFFEE ROCKET',color:'#c8874a',rate:2.3,dmg:20,spd:260,type:'rocket',aoe:58,armor:'#6b3e26',trim:'#e0a96d'},
 {name:'{{tb:office-shoot.say.006}}',en:'PRINTER',color:'#bcd4ff',rate:4.5,dmg:15,spd:540,type:'orb',size:9,pierce:6,armor:'#2b3a67',trim:'#e8f0ff'},
 {name:'{{tb:office-shoot.say.007}}',en:'SEEN-ZONE CANNON',color:'#7dff9a',rate:2.6,dmg:46,type:'rail',width:18,armor:'#a8841f',trim:'#fff3a8'},
];
const WDPS=[4,10,15,30,46,67,120];
const GUN_LEN=[18,30,28,34,42,42,48];
const MODS=[
 {id:'rate',label:'{{tb:office-shoot.say.008}}',icon:'☕',w:3,col:'#ffd43b'},
 {id:'dmg',label:'{{tb:office-shoot.say.009}}',icon:'💰',w:3,col:'#7dff9a'},
 {id:'barrel',label:'{{tb:office-shoot.say.010}}',icon:'🤚',w:1.3,col:'#4dabf7'},
];
const ETYPES={
 grunt:{r:15,ttk:.5,spd:52,col:'#5cd65c',dark:'#1f5e22',score:10},
 runner:{r:13,ttk:.25,spd:95,col:'#ffd43b',dark:'#8a6408',score:12},
 tank:{r:25,ttk:2.2,spd:27,col:'#9c6ade',dark:'#4a2a91',score:40},
 charger:{r:15,ttk:.7,spd:32,col:'#ff6b6b',dark:'#8e1515',score:25,dash:true},
 shield:{r:16,ttk:.6,spd:40,col:'#6fa8dc',dark:'#1f4e79',score:30},
 armor:{r:18,ttk:1,spd:34,col:'#8d99a6',dark:'#39424d',score:35},
 splitter:{r:17,ttk:.6,spd:46,col:'#f783ac',dark:'#a61e4d',score:25},
 mini:{r:10,ttk:.15,spd:88,col:'#faa2c1',dark:'#a61e4d',score:5},
 healer:{r:15,ttk:.8,spd:38,col:'#b2f2bb',dark:'#2b8a3e',score:35},
 larva:{r:11,ttk:.25,spd:70,col:'#e8c547',dark:'#7a5c00',score:5},
};

// ====== Boss ======
const SHAPES={round:{w:130,h:105,r:45},square:{w:130,h:100,r:16},tall:{w:112,h:125,r:30}};
const BOSS_DEFS=[
 {name:'{{tb:office-shoot.say.011}}',mech:['split'],hint:'{{tb:office-shoot.say.012}}',look:'human',col:'#3d4a63',tie:'#d64545',hair:'comb',glasses:true,shape:'square'},
 {name:'{{tb:office-shoot.say.013}}',mech:['shield'],hint:'{{tb:office-shoot.say.014}}',look:'human',col:'#2f2f3a',tie:'#ffb347',hair:'part',headset:true,shape:'square'},
 {name:'{{tb:office-shoot.say.015}}',mech:['hive'],hint:'{{tb:office-shoot.say.016}}',look:'human',col:'#8a3b6b',tie:'#ffd43b',hair:'bun',glasses:true,shape:'tall'},
 {name:'{{tb:office-shoot.say.017}}',mech:['weak'],hint:'{{tb:office-shoot.say.018}}',look:'human',col:'#4a4f57',tie:'#9fb3c8',hair:'bald',shape:'square'},
 {name:'{{tb:office-shoot.say.019}}',mech:['absorb'],hint:'{{tb:office-shoot.say.020}}',look:'human',col:'#6b4fa0',tie:'#ff6b6b',hair:'spiky',glasses:true,shape:'round'},
 {name:'{{tb:office-shoot.say.021}}',mech:['regen'],hint:'{{tb:office-shoot.say.022}}',look:'folder',col:'#3fae6a',shape:'tall'},
 {name:'{{tb:office-shoot.say.023}}',mech:['mirror'],hint:'{{tb:office-shoot.say.024}}',look:'human',col:'#2b7a8a',tie:'#5ad1e6',hair:'part',shape:'round'},
 {name:'{{tb:office-shoot.say.025}}',mech:['meteor'],hint:'{{tb:office-shoot.say.026}}',look:'human',col:'#8a5a3a',tie:'#ffd43b',hair:'spiky',shape:'square'},
 {name:'{{tb:office-shoot.say.027}}',mech:['teleport'],hint:'{{tb:office-shoot.say.028}}',look:'human',col:'#1a1a1a',tie:'#ffd43b',hair:'bald',crown:true,glasses:true,shape:'round'},
 {name:'{{tb:office-shoot.say.029}}',mech:['missile'],hint:'{{tb:office-shoot.say.030}}',look:'robot',col:'#c0c8d0',shape:'square'},
];
const MECH_POOL=['split','shield','hive','weak','absorb','regen','mirror','meteor','teleport','missile'];
const MECH_NAME={split:'{{tb:office-shoot.say.031}}',shield:'{{tb:office-shoot.say.032}}',hive:'{{tb:office-shoot.say.033}}',weak:'KPI|KPI-Obsessed',absorb:'{{tb:office-shoot.say.034}}',regen:'{{tb:office-shoot.say.035}}',mirror:'{{tb:office-shoot.say.036}}',meteor:'{{tb:office-shoot.say.037}}',teleport:'{{tb:office-shoot.say.038}}',missile:'{{tb:office-shoot.say.039}}'};
const MECH_HINT={split:'{{tb:office-shoot.say.040}}',shield:'{{tb:office-shoot.say.041}}',hive:'{{tb:office-shoot.say.042}}',weak:'{{tb:office-shoot.say.043}}',absorb:'{{tb:office-shoot.say.044}}',regen:'{{tb:office-shoot.say.045}}',mirror:'{{tb:office-shoot.say.046}}',meteor:'{{tb:office-shoot.say.047}}',teleport:'{{tb:office-shoot.say.048}}',missile:'{{tb:office-shoot.say.049}}'};
const NOUNS=['{{tb:office-shoot.say.050}}','{{tb:office-shoot.say.051}}','{{tb:office-shoot.say.052}}','{{tb:office-shoot.say.053}}','{{tb:office-shoot.say.054}}','{{tb:office-shoot.say.055}}','{{tb:office-shoot.say.056}}','{{tb:office-shoot.say.057}}'];
function bossDefFor(s){
  if(s<=BOSS_DEFS.length)return BOSS_DEFS[s-1];
  const R=seeded(s*7919+13),n=s>=16?3:2,pool=MECH_POOL.slice(),mech=[];
  while(mech.length<n&&pool.length){
    const m=pool.splice(Math.floor(R()*pool.length),1)[0];
    if((m==='split'&&mech.includes('mirror'))||(m==='mirror'&&mech.includes('split')))continue;
    mech.push(m);
  }
  const hue=Math.floor(R()*360),pick=a=>a[Math.floor(R()*a.length)],ni=Math.floor(R()*NOUNS.length);
  const NAME_FMT='{{tb:office-shoot.say.058}}',fill=(s,o)=>s.replace(/\{(\w+)\}/g,(m,k)=>o[k]);
  const name=fill(ZH(NAME_FMT),{a:mech.map(m=>ZH(MECH_NAME[m])).join('・'),b:ZH(NOUNS[ni])})+'|'+fill(EN(NAME_FMT),{a:mech.map(m=>EN(MECH_NAME[m])).join(', '),b:EN(NOUNS[ni])});
  return {name,mech,hint:mech.map(m=>ZH(MECH_HINT[m])).join(' ＋ ')+'|'+mech.map(m=>EN(MECH_HINT[m])).join(' + '),look:R()<.15?'robot':'human',col:hsl2hex(hue,40,32),tie:hsl2hex((hue+150)%360,75,60),
    hair:pick(['comb','part','spiky','bun','bald']),glasses:R()<.5,headset:R()<.3,crown:s>=15,shape:pick(['round','square','tall'])};
}
// ====== 狀態 ======
let state='menu',phase='waves',stage=1,stageT=0,phaseT=0,score=0,best=0,t=0,overT=0,kills=0;
let p,bullets,enemies,crates,bosses,hazards,parts,texts,beams,rings,shake=0,banner=null,flash=0,danger=0,bossTotal=1,curBoss=null;
let spawnT,crateT,sinceWeapon,modsTaken,eliteT=8,shotSfxT=0,quipT=0,critT=0,overTitle='',overQuip='';
const QUIPS=['{{tb:office-shoot.say.059}}','{{tb:office-shoot.say.060}}','{{tb:office-shoot.say.061}}','{{tb:office-shoot.say.062}}','{{tb:office-shoot.say.063}}','{{tb:office-shoot.say.064}}','{{tb:office-shoot.say.065}}','{{tb:office-shoot.say.066}}','{{tb:office-shoot.say.067}}','{{tb:office-shoot.say.068}}'];
const MISS=['{{tb:office-shoot.say.069}}','{{tb:office-shoot.say.070}}','{{tb:office-shoot.say.071}}','{{tb:office-shoot.say.072}}','{{tb:office-shoot.say.073}}'];
const OVER_T=['{{tb:office-shoot.say.074}}','{{tb:office-shoot.say.075}}','{{tb:office-shoot.say.076}}','{{tb:office-shoot.say.077}}'];
const OVER_Q=['{{tb:office-shoot.say.078}}','{{tb:office-shoot.say.079}}','{{tb:office-shoot.say.080}}','{{tb:office-shoot.say.081}}'];
try{best=+localStorage.getItem(BEST_KEY)||0}catch(e){}

function reset(){
  p={x:MID*1.5,tx:MID*1.5,tier:0,rateMul:1,dmgMul:1,barrels:1,cd:0,recoil:0,stun:0,dpsSlow:4,wlv:0};
  bullets=[];enemies=[];crates=[];bosses=[];hazards=[];parts=[];texts=[];beams=[];rings=[];
  shake=0;banner=null;flash=0;danger=0;curBoss=null;
  stage=1;stageT=0;phase='waves';phaseT=0;score=0;kills=0;
  spawnT=1.2;crateT=.8;sinceWeapon=9;modsTaken=0;eliteT=8;
}
reset();

// ====== 難度曲線 ======
function prog(){return phase==='waves'?Math.min(1,stageT/STAGE_LEN):1;}
// 「正常玩家」在這個時間點預期有多少火力
function expDPS(){
  const pr=prog(),tf=Math.min(6,(stage-1)+pr*.7),i=Math.floor(tf),f=tf-i;
  const w=i>=6?WDPS[6]:WDPS[i]*Math.pow(WDPS[i+1]/WDPS[i],f);
  const x=(stage-1)+pr;
  const K=x<1?1+.8*x:Math.min(6,1.8+2*(x-1));
  return w*Math.pow(1.5,x)*K*Math.pow(1.3,Math.max(0,stage-7));
}
function dps(){const w=WEAPONS[p.tier];return w.dmg*p.dmgMul*w.rate*p.rateMul*p.barrels*(w.pellets?w.pellets*.55:1);}
// 敵人血量基準：預期火力，但若玩家遠超預期，敵人也會跟上一部分
const RATE_CAP={bullet:30,spread:12,laser:24,rocket:10,orb:14,rail:7};
function effRate(w){return Math.min(w.rate*p.rateMul,RATE_CAP[w.type]);} // 射速超過上限的部分轉成傷害
function grow(){return 1+.1*(stage-1);} // 敵人相對你的強度，每天慢慢提高
function power(){return Math.max(expDPS(),.75*p.dpsSlow);}

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

// ====== 生成 ======
function spawnEnemy(type,x,y,noElite){
  const d=ETYPES[type];
  const elite=!noElite&&stage>=2&&eliteT<=0&&!['mini','larva','tank','armor'].includes(type);
  if(elite)eliteT=rand(12,18);
  const r=d.r*(elite?1.3:1);
  const hp=Math.max(1,power()*grow()*d.ttk*(elite?3:1));
  const e={kind:'enemy',type,d,r,elite,
    x:x!=null?clamp(x,MID+14+r,W-10-r):rand(MID+16+r,W-10-r),
    y:y!=null?y:-r-5,hp,max:hp,spd:d.spd*Math.min(1.5,1+.03*(stage-1))*(elite?.9:1),
    hit:0,acc:0,accT:0,wob:rand(0,6.28),dashY:rand(170,340),dashing:false};
  if(type==='shield')e.shieldHits=e.shieldMax=8+2*stage;
  if(type==='armor')e.armor=power()*.03;
  if(type==='healer')e.healT=1.5;
  enemies.push(e);
  return e;
}
function pickType(){
  const s=stage,pr=stageT/STAGE_LEN,w=[['grunt',5],['runner',3]];
  if(s>=2||pr>.4)w.push(['tank',1.2]);
  if(s>=2)w.push(['charger',1.2],['shield',1.5]);
  if(s>=3)w.push(['armor',1.3],['splitter',1.3]);
  if(s>=4)w.push(['healer',.8]);
  return wpick(w);
}
function spawnInterval(){
  let b=Math.max(.24,.95*Math.pow(.9,stage-1));
  b*=1-.3*Math.min(1,stageT/STAGE_LEN);
  if(stageT%11>8)b*=4; // 喘息時段
  return b*rand(.75,1.25);
}
function spawnCrate(){
  let c;const pw=dps();
  const maxed=p.tier>=WEAPONS.length-1;
  if(sinceWeapon>=(maxed?24:16)&&!crates.some(k=>k.weapon!=null)&&(maxed||p.tier<stage)){
    if(maxed)c={weapon:p.tier,refine:p.wlv+1,shield:Math.max(25,pw*3.5),w:172,h:80}; // 滿階後：精煉箱
    else c={weapon:p.tier+1,shield:Math.max(25,pw*3),w:172,h:80};
    sinceWeapon=0;
  }else{
    const m=wpick(MODS.filter(m=>m.id!=='barrel'||p.barrels<4).map(m=>[m,m.w]));
    // 成本＝你自己全火力打幾秒；領先時稍微變貴，但最多 4 秒，後期也拿得到
    const ahead=Math.max(1,pw/expDPS()),sec=2.2*Math.min(1.8,Math.pow(ahead,.3));
    let sh=Math.max(8,pw*sec);if(m.id==='barrel')sh*=1.6;
    c={mod:m,shield:sh*rand(.9,1.1),w:150,h:62};
  }
  Object.assign(c,{kind:'crate',x:MID/2,y:-46,max:c.shield,spd:40,hit:0,acc:0,accT:0,broken:false});
  crates.push(c);
}
function makeBoss(def,scale,hx,hp,spd,fake){
  const sh=SHAPES[def.shape];
  return {kind:'boss',def,M:new Set(def.mech),scale,w:sh.w*scale,h:sh.h*scale,x:hx,hx,y:-sh.h*scale/2-10,hp,max:hp,spd,fake,gen:0,
    t:rand(0,5),hit:0,acc:0,accT:0,dead:false,shieldT:4,shieldOn:0,absorbT:6,absorbOn:0,absWarned:false,idle:0,
    hiveT:1.5,meteorT:2,missileT:2.5,swapT:6,tpNext:.8,weakX:0};
}
function spawnBoss(){
  const def=bossDefFor(stage),M=new Set(def.mech);
  let f=1;
  if(M.has('split'))f*=.6;if(M.has('weak'))f*=.55;if(M.has('absorb'))f*=.85;if(M.has('shield'))f*=.85;
  if(M.has('hive'))f*=.8;if(M.has('teleport'))f*=.85;if(M.has('regen'))f*=.9;if(M.has('meteor'))f*=.9;if(M.has('missile'))f*=.9;
  const hp=power()*grow()*22*f;
  const spd=Math.min(22,13+.6*stage)*(M.has('hive')?.6:1)*(M.has('teleport')?1.5:1);
  bosses=[];bossTotal=hp;curBoss=def;
  if(M.has('mirror')){const real=Math.random()<.5?0:1;for(let i=0;i<2;i++)bosses.push(makeBoss(def,.7,i?W-58:MID+58,hp,spd,i!==real));}
  else bosses.push(makeBoss(def,1,MID*1.5,hp,spd,false));
  tone(80,.6,'sawtooth',.08,.5);
}

// ====== 戰鬥 ======
function allTargets(){
  const a=[];
  for(const e of enemies)if(!e.dead)a.push(e);
  for(const c of crates)if(!c.broken&&!c.gone)a.push(c);
  for(const b of bosses)if(!b.dead)a.push(b);
  for(const h of hazards)if(!h.dead)a.push(h);
  return a;
}
const isCircle=t=>t.kind==='enemy'||t.kind==='hazard';
const halfW=t=>isCircle(t)?t.r:t.w/2;
const halfH=t=>isCircle(t)?t.r:t.h/2;
function hitTest(t,x,y,r){
  if(isCircle(t)){const dx=t.x-x,dy=t.y-y,R=t.r+r+(t.r<16?8:4);return dx*dx+dy*dy<R*R;}
  return Math.abs(t.x-x)<t.w/2+r&&Math.abs(t.y-y)<t.h/2+r;
}
function weakPos(b){return{x:b.x+b.weakX,y:b.y+b.h/2-12*b.scale,r:18*b.scale};}
function weakHit(b,src){
  const w=weakPos(b);
  if(src.rail)return Math.abs(src.x-w.x)<w.r+src.w/2;
  if(src.aoe)return Math.hypot(src.x-w.x,src.y-w.y)<w.r+src.R;
  return Math.hypot(src.x-w.x,src.y-w.y)<w.r+(src.r||3)+4;
}
function damage(t,d,src){
  if(t.dead||t.broken||t.gone)return;
  if(t.kind==='boss'){
    if(t.fake){if(Math.random()<.3)spark(src.x||t.x,t.y+t.h/2,'#9aa4b5',2,90,2);return;}
    if(t.shieldOn>0){if(Math.random()<.3)spark(src.x||t.x,t.y+t.h/2,'#ffb347',2,120,2);return;}
    if(t.M.has('weak')){const wh=weakHit(t,src);d*=wh?1.5:.15;if(wh&&Math.random()<.4)spark(src.x||t.x,t.y+t.h/2,'#ff3030',3,160,2.5);}
    if(t.absorbOn>0){t.hp=Math.min(t.max,t.hp+d*.5);t.hit=.07;if(Math.random()<.2)spark(t.x+rand(-30,30),t.y,'#7dff9a',2,80,2.5);return;}
    t.idle=0;
  }
  if(t.armor)d=Math.max(d*.15,d-t.armor);
  t.hit=.07;t.acc+=d;
  if(t.kind==='crate'){t.shield-=d;if(t.shield<=0)breakCrate(t);}
  else if(t.kind==='hazard'){t.hp-=d;if(t.hp<=0){t.dead=true;spark(t.x,t.y,t.type==='rock'?'#c49a6c':'#ff9a3c',12,200,3);score+=15*stage;tone(300,.08,'square',.03,.5);}}
  else{
    t.hp-=d;
    if(t.kind==='boss'){
      if(t.hp<=0)killBoss(t);
      else if(t.M.has('split')&&t.gen<2&&t.hp<t.max*.5)splitBoss(t);
    }else if(t.hp<=0)killEnemy(t);
  }
}
function addBullet(x,y,a,spd,dmg,o){
  bullets.push(Object.assign({x,y,vx:Math.sin(a)*spd,vy:-Math.cos(a)*spd,dmg,pierce:1,hits:null,life:3,r:3},o));
}
function fire(){
  const w=WEAPONS[p.tier],dmg=w.dmg*p.dmgMul*(w.rate*p.rateMul/effRate(w)),n=p.barrels,gy=PY-12-GUN_LEN[p.tier];
  p.recoil=4;
  for(let i=0;i<n;i++){
    const bx=p.x+(i-(n-1)/2)*15;
    switch(w.type){
      case 'bullet':addBullet(bx,gy,w.jitter?rand(-w.jitter,w.jitter):0,w.spd,dmg,{r:w.size,col:w.color,look:w.look});break;
      case 'spread':for(let k=0;k<w.pellets;k++){const a=-w.spread/2+w.spread*k/(w.pellets-1)+rand(-.03,.03);addBullet(bx,gy,a,w.spd*rand(.92,1.05),dmg,{r:w.size,col:w.color,life:.95,look:'shred'});}break;
      case 'laser':addBullet(bx,gy,0,w.spd,dmg,{r:3,col:w.color,pierce:w.pierce,laser:true});break;
      case 'rocket':addBullet(bx,gy,rand(-.04,.04),w.spd,dmg,{r:5,col:w.color,rocket:true,aoe:w.aoe});break;
      case 'orb':addBullet(bx,gy,0,w.spd,dmg,{r:w.size,col:w.color,pierce:w.pierce,orb:true});break;
      case 'rail':railShot(bx,dmg,w);break;
    }
  }
  if(shotSfxT<=0){shotSfxT=.08;if(w.type==='rail')tone(1200,.12,'sine',.03,.4);else tone(rand(650,850),.05,'sine',.03,.45);}
}
function railShot(x,dmg,w){
  const bw=w.width+1.5*Math.min(p.wlv,6),hw=bw/2,src={rail:true,x,w:bw};
  for(const t of allTargets()){
    if(Math.abs(t.x-x)<halfW(t)+hw&&t.y-halfH(t)<PY&&t.y+halfH(t)>0){damage(t,dmg,src);if(Math.random()<.5)spark(x,t.y+halfH(t),w.color,3,180);}
  }
  beams.push({x,w:bw,life:.16,max:.16,col:p.wlv>=5?hsl2hex((t*120)%360,90,70):w.color});
}
function explode(x,y,R,d,col){
  const src={aoe:true,x,y,R};
  for(const t of allTargets()){
    const dx=Math.max(0,Math.abs(t.x-x)-halfW(t)),dy=Math.max(0,Math.abs(t.y-y)-halfH(t));
    if(dx*dx+dy*dy<R*R)damage(t,d,src);
  }
  rings.push({x,y,r:6,max:R,life:.3,mx:.3,col});
  spark(x,y,col,10,260,3);spark(x,y,'#ffd27a',6,160,2.5);
  shake=Math.max(shake,2.5);
  tone(110,.18,'sawtooth',.03,.4);
}
function applyMod(m,x,y,prefix){
  modsTaken++;
  if(m.id==='rate')p.rateMul*=1.15;
  else if(m.id==='dmg')p.dmgMul*=1.2;
  else p.barrels=Math.min(4,p.barrels+1);
  floatText(x,y,(prefix||'')+m.icon+' '+mLabel(m),m.col,prefix?16:20);
  spark(p.x,PY,m.col,14,200,2.5);
  tone(880,.14,'sine',.06,1.5);
}
function killEnemy(e){
  e.dead=true;kills++;score+=e.d.score*stage*(e.elite?5:1);
  spark(e.x,e.y,e.d.col,12,220,3);spark(e.x,e.y,'#fff',4,120,2);
  if(e.type==='tank'){tone(95,.28,'sawtooth',.05,.55);tone(70,.2,'square',.03,.7,.05);}else tone(rand(500,700),.1,'sine',.03,2.2);
  if(quipT<=0&&Math.random()<.07){quipT=1.4;floatText(e.x,e.y-14,pickL(QUIPS),'#ffe8a3',13);}
  if(e.type==='splitter')for(let i=0;i<3;i++)spawnEnemy('mini',e.x+(i-1)*20,e.y+rand(-6,6),true);
  if(e.elite){
    if(Math.random()<.5){p.rateMul*=1.06;floatText(e.x,e.y-10,L('{{tb:office-shoot.say.082}}'),'#ffd43b',15);}
    else{p.dmgMul*=1.08;floatText(e.x,e.y-10,L('{{tb:office-shoot.say.083}}'),'#7dff9a',15);}
    tone(880,.1,'sine',.05,1.5);
    rings.push({x:e.x,y:e.y,r:8,max:70,life:.4,mx:.4,col:'#ffd43b'});
  }
}
function splitBoss(b){
  b.dead=true;const sc=b.scale*.72,hp=b.hp*.6;
  for(const k of [-1,1]){
    const nw=SHAPES[b.def.shape].w*sc;
    const c=makeBoss(b.def,sc,clamp(b.hx+k*b.w*.32,MID+nw/2+4,W-nw/2-4),hp,b.spd*1.1,false);
    c.y=b.y;c.gen=b.gen+1;c.t=b.t+k;bosses.push(c);
  }
  spark(b.x,b.y,b.def.col,30,300,4);rings.push({x:b.x,y:b.y,r:10,max:140,life:.45,mx:.45,col:b.def.col});
  floatText(b.x,b.y-b.h/2-12,b.gen===0?L('{{tb:office-shoot.say.084}}'):L('{{tb:office-shoot.say.085}}'),'#ff4d4d',20);shake=Math.max(shake,8);
  tone(160,.3,'sawtooth',.06,.5);
}
function killBoss(b){
  b.dead=true;
  for(let i=0;i<3;i++)spark(b.x+rand(-40,40),b.y+rand(-30,30),i%2?b.def.col:'#ffe066',16,300,3.5);
  rings.push({x:b.x,y:b.y,r:10,max:160*b.scale,life:.5,mx:.5,col:b.def.col});
  shake=Math.max(shake,8);tone(90,.4,'sawtooth',.06,.4);
  if(bosses.some(o=>!o.dead&&!o.fake))return;
  // 全部擊敗
  for(const o of bosses)if(!o.dead){o.dead=true;spark(o.x,o.y,'#9aa4b5',30,260,3);}
  rings.push({x:b.x,y:b.y,r:10,max:240,life:.7,mx:.7,col:b.def.col});
  shake=16;flash=.8;score+=500*stage;
  for(const e of enemies)if(!e.dead)killEnemy(e);
  for(const h of hazards)h.dead=true;
  p.dmgMul*=1.3;
  floatText(p.x,PY-70,L('{{tb:office-shoot.say.086}}'),'#ffd43b',17);
  phase='clear';phaseT=0;
  dayCleared(stage);
  banner={text:LF('{{tb:office-shoot.say.087}}',{n:stage}),sub:LF('{{tb:office-shoot.say.088}}',{b:bName(b.def)}),col:'#ffe066',t:0,dur:2.4};
  tone(523,.15,'square',.04,1,.25);tone(659,.15,'square',.04,1,.4);tone(784,.3,'square',.04,1,.55);
}
function breakCrate(c){
  c.broken=true;
  spark(c.x,c.y,'#8fe3ff',22,260,3);
  rings.push({x:c.x,y:c.y,r:10,max:110,life:.35,mx:.35,col:'#8fe3ff'});
  if(c.refine){
    p.wlv=c.refine;p.dmgMul*=1.3;const w=WEAPONS[p.tier];
    banner={text:wName(w)+' +'+p.wlv+'!',sub:L('{{tb:office-shoot.say.089}}'),col:'#ffd43b',t:0,dur:2.2};
    rings.push({x:p.x,y:PY,r:10,max:180,life:.6,mx:.6,col:'#ffd43b'});spark(p.x,PY,'#ffd43b',50,340,3.5);
    flash=.6;shake=Math.max(shake,8);[659,784,988,1319].forEach((f,i)=>tone(f,.16,'square',.045,1,i*.08));
  }else if(c.weapon!=null){
    p.tier=c.weapon;const w=WEAPONS[p.tier];
    banner={text:LF('{{tb:office-shoot.say.090}}',{w:wName(w)}),sub:(lang==='en'?'':w.en+'  ·  ')+LF('{{tb:office-shoot.say.091}}',{a:p.tier+1,b:WEAPONS.length}),col:w.color,t:0,dur:2.2};
    rings.push({x:p.x,y:PY,r:10,max:160,life:.6,mx:.6,col:w.color});
    spark(p.x,PY,w.color,40,320,3.5);
    flash=.6;shake=Math.max(shake,8);
    [523,659,784,1047].forEach((f,i)=>tone(f,.16,'square',.045,1,i*.08));
  }else applyMod(c.mod,c.x,c.y);
}
function stunPlayer(){
  p.stun=1;flash=Math.max(flash,.3);shake=Math.max(shake,6);
  floatText(p.x,PY-50,L('{{tb:office-shoot.say.092}}'),'#ff6b6b',20);tone(140,.3,'square',.05,.5);
}
function throwRock(b){
  let tx,ty;
  const cs=crates.filter(c=>c.y>b.y+30&&c.y<LINE-120);
  if(cs.length&&Math.random()<.65){const c=cs[Math.floor(Math.random()*cs.length)];tx=c.x+rand(-30,30);ty=c.y+c.spd*1.2;}
  else{tx=Math.random()<.6?p.x:rand(20,W-20);ty=PY;}
  const T=Math.max(.8,(ty-b.y)/230),hp=power()*.35;
  hazards.push({kind:'hazard',type:'rock',x:b.x,y:b.y,vx:(tx-b.x)/T,vy:(ty-b.y)/T,r:14,hp,max:hp,hit:0,acc:0,accT:0,rot:rand(0,6)});
}
function fireMissile(b){
  const sx=b.x,sy=b.y+b.h/2,dx=p.x-sx,dy=PY-sy,L=Math.hypot(dx,dy)||1,sp=210,hp=power()*.12;
  hazards.push({kind:'hazard',type:'missile',x:sx,y:sy,vx:dx/L*sp,vy:dy/L*sp,r:9,hp,max:hp,hit:0,acc:0,accT:0});
  tone(500,.12,'sawtooth',.025,.6);
}
function teleportBoss(b){
  spark(b.x,b.y,'#c77dff',30,260,3);rings.push({x:b.x,y:b.y,r:10,max:120,life:.4,mx:.4,col:'#c77dff'});
  b.y=70;
  rings.push({x:b.x,y:b.y,r:120,max:10,life:.4,mx:.4,col:'#c77dff'});
  floatText(b.x,b.y+b.h/2+14,L('{{tb:office-shoot.say.093}}'),'#e599f7',17);
  for(let i=0;i<4;i++)spawnEnemy(pickType(),rand(MID+30,W-30),b.y+b.h/2+rand(0,40));
  tone(900,.3,'sine',.05,.3);
}
function gameOver(x,y){
  if(state!=='play')return;
  state='over';overT=0;
  spark(x,y,'#ff4d4d',50,380,4);spark(p.x,PY,'#fff',30,300,3);
  rings.push({x,y,r:10,max:260,life:.7,mx:.7,col:'#ff4d4d'});
  shake=18;flash=.7;
  if(score>best){best=score;try{localStorage.setItem(BEST_KEY,''+best)}catch(e){}}
  settle();
  overTitle=Math.floor(Math.random()*4);overQuip=Math.floor(Math.random()*4);
  [392,370,349].forEach((f,i)=>tone(f,.32,'sawtooth',.05,1,i*.35));tone(330,.9,'sawtooth',.05,.9,1.05);
}

// ====== 特效 ======
function spark(x,y,col,n,spd,size){
  if(parts.length>700)return;
  for(let i=0;i<n;i++){const a=rand(0,6.283),s=rand(.2,1)*(spd||150);
    parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.25,.55),max:.55,col,size:(size||2)*rand(.6,1.2)});}
}
function floatText(x,y,text,col,size){texts.push({x,y,text,col,size:size||14,life:1.1,max:1.1,vy:-50});}

// ====== 更新 ======
function updateFx(dt){
  for(const q of parts){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.94;q.vy*=.94;q.life-=dt;}
  parts=parts.filter(q=>q.life>0);
  for(const q of texts){q.y+=q.vy*dt;q.vy*=.95;q.life-=dt;}
  texts=texts.filter(q=>q.life>0);
  for(const q of beams)q.life-=dt;beams=beams.filter(q=>q.life>0);
  for(const q of rings){q.life-=dt;q.r+=(q.max-q.r)*Math.min(1,dt*12);}
  rings=rings.filter(q=>q.life>0);
  shake=Math.max(0,shake-dt*30);flash=Math.max(0,flash-dt*2);
  if(banner){banner.t+=dt;if(banner.t>banner.dur)banner=null;}
  if(state==='over')overT+=dt;
}
function update(dt){
  t+=dt;updateFx(dt);
  if(state!=='play')return;
  stageT+=dt;phaseT+=dt;sinceWeapon+=dt;shotSfxT-=dt;eliteT-=dt;quipT-=dt;critT-=dt;
  // 移動
  const kd=(keys.left?-1:0)+(keys.right?1:0);
  if(kd)p.tx+=kd*480*dt;
  p.tx=clamp(p.tx,22,W-22);
  const step=1100*dt;p.x+=clamp(p.tx-p.x,-step,step);
  // 射擊
  const w=WEAPONS[p.tier];
  if(p.stun>0){p.stun-=dt;p.cd=Math.max(p.cd,0);}
  else{p.cd-=dt;const iv=1/effRate(w);while(p.cd<=0){fire();p.cd+=iv;}}
  p.recoil=Math.max(0,p.recoil-dt*30);
  {const d=dps();if(d>p.dpsSlow)p.dpsSlow+=(d-p.dpsSlow)*Math.min(1,dt/20);}
  // 關卡流程
  if(phase==='waves'){
    spawnT-=dt;
    if(spawnT<=0){
      spawnT=spawnInterval();
      if(Math.random()<Math.min(.4,.12+.03*(stage-1))){
        const x=rand(MID+40,W-40),n=Math.min(6,3+Math.floor(stage/3)),tp=Math.random()<.5?'runner':'grunt';
        for(let i=0;i<n;i++)spawnEnemy(tp,x+rand(-30,30),-15-i*28,true);
      }else spawnEnemy(pickType());
    }
    if(stageT>=STAGE_LEN){phase='warn';phaseT=0;
      const d=bossDefFor(stage);
      banner={text:L('{{tb:office-shoot.say.094}}'),sub:bName(d),hint:bHint(d),col:'#ff4d4d',t:0,dur:2.6};
      tone(392,.22,'square',.05,1);tone(415,.22,'square',.05,1,.25);tone(370,.5,'square',.05,.97,.5);}
  }else if(phase==='warn'){
    if(phaseT>=2.4){spawnBoss();phase='boss';phaseT=0;}
  }else if(phase==='boss'){
    updateBosses(dt);
  }else if(phase==='clear'){
    if(phaseT>=2.6){stage++;stageT=0;phase='waves';phaseT=0;spawnT=1;bosses=[];curBoss=null;}
  }
  if(state!=='play')return;
  crateT-=dt;if(crateT<=0){crateT=6;spawnCrate();}
  // 子彈
  const targets=allTargets();
  for(const b of bullets){
    b.life-=dt;
    if(b.rocket){b.vy-=700*dt;if(Math.random()<.7)parts.push({x:b.x+rand(-2,2),y:b.y+8,vx:rand(-20,20),vy:rand(40,90),life:.35,max:.35,col:'#e8e0d0',size:2.5});}
    b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(b.y<-30||b.x<-20||b.x>W+20||b.life<=0){b.dead=true;continue;}
    for(const tg of targets){
      if(tg.dead||tg.broken||tg.gone)continue;
      if(b.hits&&b.hits.has(tg))continue;
      if(hitTest(tg,b.x,b.y,b.r)){
        if(b.rocket){explode(b.x,b.y,b.aoe,b.dmg,b.col);b.dead=true;break;}
        if(tg.shieldHits>0&&!b.laser&&!b.orb){
          tg.shieldHits--;tg.hit=.05;b.dead=true;spark(b.x,b.y,'#9fd3ff',2,120,2);
          if(tg.shieldHits===0){floatText(tg.x,tg.y-24,L('{{tb:office-shoot.say.095}}'),'#ffc9c9',13);spark(tg.x,tg.y+tg.r,'#9fd3ff',12,200,2.5);}
          break;
        }
        let dd=b.dmg;if(Math.random()<.06){dd*=2;if(critT<=0){critT=.35;floatText(b.x+rand(-8,8),b.y-12,L('{{tb:office-shoot.say.096}}'),'#ff922b',15);}}
        damage(tg,dd,b);
        if(Math.random()<.5)spark(b.x,b.y,tg.kind==='crate'?'#8fe3ff':b.col,2,120,2);
        b.pierce--;if(b.pierce<=0){b.dead=true;break;}
        (b.hits||(b.hits=new Set())).add(tg);
      }
    }
  }
  bullets=bullets.filter(b=>!b.dead);
  // 敵人
  danger=0;
  for(const e of enemies){
    if(e.dead)continue;
    let sp=e.spd;
    if(e.d.dash&&e.y>e.dashY){sp*=6.5;if(!e.dashing){e.dashing=true;floatText(e.x,e.y-20,L('{{tb:office-shoot.say.097}}'),'#ff4d4d',18);}}
    e.y+=sp*dt;e.wob+=dt*7;e.hit-=dt;
    if(e.type==='healer'){
      e.healT-=dt;
      if(e.healT<=0){e.healT=2;let n=0;
        for(const o of enemies)if(o!==e&&!o.dead&&o.hp<o.max&&Math.hypot(o.x-e.x,o.y-e.y)<100){o.hp=Math.min(o.max,o.hp+o.max*.2);n++;spark(o.x,o.y,'#7dff9a',4,80,2.5);}
        rings.push({x:e.x,y:e.y,r:8,max:100,life:.5,mx:.5,col:'#7dff9a'});
        if(n)floatText(e.x,e.y-22,L('{{tb:office-shoot.say.098}}'),'#ff8cc6',13);}
    }
    danger=Math.max(danger,(e.y+e.r-(LINE-190))/190);
    if(e.y+e.r>=LINE){gameOver(e.x,LINE);break;}
  }
  enemies=enemies.filter(e=>!e.dead);
  // 投射物（隕石 / 飛彈）
  for(const h of hazards){
    if(h.dead)continue;
    h.x+=h.vx*dt;h.y+=h.vy*dt;h.hit-=dt;
    if(h.type==='rock'){h.rot+=dt*4;
      for(const c of crates){if(!c.broken&&!c.gone&&Math.abs(c.x-h.x)<c.w/2+h.r&&Math.abs(c.y-h.y)<c.h/2+h.r){
        c.gone=true;h.dead=true;floatText(c.x,c.y,L('{{tb:office-shoot.say.099}}'),'#ff9a6b',15);
        spark(c.x,c.y,'#c49a6c',25,260,3.5);spark(c.x,c.y,'#8fe3ff',12,200,2.5);shake=Math.max(shake,5);tone(120,.25,'sawtooth',.05,.5);break;}}
    }else if(Math.random()<.8)parts.push({x:h.x-h.vx*.04,y:h.y-h.vy*.04,vx:rand(-20,20),vy:rand(-20,20),life:.3,max:.3,col:'#ffb36b',size:2.5});
    if(!h.dead&&h.y>=PY-8){
      h.dead=true;
      spark(h.x,PY,h.type==='rock'?'#c49a6c':'#ff9a3c',16,240,3);rings.push({x:h.x,y:PY,r:6,max:40,life:.3,mx:.3,col:'#ff9a3c'});
      if(Math.abs(h.x-p.x)<28)stunPlayer();
    }
    if(h.x<-30||h.x>W+30)h.dead=true;
  }
  hazards=hazards.filter(h=>!h.dead);
  // 道具
  for(const c of crates){
    c.y+=c.spd*dt;c.hit-=dt;
    if(c.y-c.h/2>LINE&&!c.gone){c.gone=true;floatText(c.x,LINE-10,pickL(MISS),'#a9b3c6',14);}
  }
  crates=crates.filter(c=>!c.broken&&!c.gone);
  bosses=bosses.filter(b=>!b.dead||phase!=='boss');
  // 傷害數字
  for(const tg of targets){
    if(tg.kind==='crate'){tg.acc=0;continue;}
    tg.accT-=dt;
    if(tg.acc>0&&tg.accT<=0){floatText(tg.x+rand(-10,10),tg.y-halfH(tg)-6,fmt(tg.acc),tg.armor||(tg.kind==='boss'&&tg.M.has('weak'))?'#c5ccd6':'#fff',tg.kind==='boss'?16:12);tg.acc=0;tg.accT=.15;}
  }
  for(const b of bosses)if(!b.dead)danger=Math.max(danger,(b.y+b.h/2-(LINE-220))/220);
  danger=clamp(danger,0,1);
}
function updateBosses(dt){
  const alive=bosses.filter(b=>!b.dead),multi=alive.length>1;
  for(const b of alive){
    b.t+=dt;b.hit-=dt;b.idle+=dt;
    const sp=b.y<60?70:b.spd;
    b.x=clamp(b.hx+Math.sin(b.t*.9)*(multi?8:40),MID+b.w/2+4,W-b.w/2-4);
    const M=b.M;
    if(M.has('shield')){if(b.shieldOn>0)b.shieldOn-=dt;else{b.shieldT-=dt;if(b.shieldT<=0){b.shieldOn=3;b.shieldT=6;tone(200,.3,'sawtooth',.04,1.5);}}}
    if(M.has('absorb')){
      if(b.absorbOn>0)b.absorbOn-=dt;
      else{b.absorbT-=dt;
        if(b.absorbT<=1.1&&!b.absWarned){b.absWarned=true;floatText(b.x,b.y+b.h/2+16,L('{{tb:office-shoot.say.100}}'),'#ff4d4d',16);tone(660,.1,'square',.04,1);tone(660,.1,'square',.04,1,.2);}
        if(b.absorbT<=0){b.absorbOn=2.5;b.absorbT=7;b.absWarned=false;}}
    }
    if(M.has('regen')&&b.idle>1.5&&b.hp<b.max&&!b.fake){b.hp=Math.min(b.max,b.hp+b.max*.07*dt);if(Math.random()<.3)parts.push({x:b.x+rand(-b.w/2,b.w/2),y:b.y+rand(-b.h/2,b.h/2),vx:0,vy:-40,life:.6,max:.6,col:'#7dff9a',size:3});}
    if(M.has('weak'))b.weakX=Math.sin(b.t*1.6)*b.w*.34;
    if(M.has('hive')){b.hiveT-=dt;if(b.hiveT<=0){b.hiveT=Math.max(.7,1.2-stage*.02);spawnEnemy('larva',b.x+rand(-b.w/3,b.w/3),b.y+b.h/2,true);}}
    if(M.has('meteor')){b.meteorT-=dt;if(b.meteorT<=0){b.meteorT=2.2;throwRock(b);}}
    if(M.has('missile')){b.missileT-=dt;if(b.missileT<=0){b.missileT=Math.max(1.1,1.8-stage*.03);fireMissile(b);}}
    if(M.has('teleport')&&!b.fake&&b.tpNext>.1&&b.hp<=b.max*b.tpNext){b.tpNext-=.2;teleportBoss(b);}
    if(M.has('mirror')&&!b.fake){b.swapT-=dt;if(b.swapT<=0){b.swapT=6;const o=alive.find(k=>k!==b);
      if(o){const hx=b.hx;b.hx=o.hx;o.hx=hx;for(const k of [b,o]){spark(k.x,k.y,'#5ad1e6',20,220,3);k.x=k.hx;}floatText(MID*1.5,b.y-b.h/2-14,L('{{tb:office-shoot.say.101}}'),'#5ad1e6',16);}}}
    b.y+=sp*dt;
    if(b.y+b.h/2>=LINE){gameOver(b.x,LINE);return;}
  }
}

// ====== 繪製 ======
let bgL=null,bgR=null;
function hash(k){const x=Math.sin(k*127.1+311.7)*43758.5453;return x-Math.floor(x);}
function decor(kind,x,y,flip){
  ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);
  if(kind===0){ // 盆栽
    ctx.fillStyle='#8a5a3a';ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(8,0);ctx.lineTo(6,12);ctx.lineTo(-6,12);ctx.closePath();ctx.fill();
    ctx.fillStyle='#4cae6a';for(const [a,l] of [[-2.2,16],[-1.57,20],[-.9,16],[-1.9,12],[-1.2,13]]){ctx.beginPath();ctx.ellipse(Math.cos(a)*l*.5,Math.sin(a)*l*.5,4,l*.5,a+1.57,0,6.283);ctx.fill();}
  }else if(kind===1){ // 飲水機
    ctx.fillStyle='#dfe7ef';rr(-8,-6,16,24,3);ctx.fill();ctx.fillStyle='#74c0fc';rr(-6,-22,12,17,5);ctx.fill();
    ctx.fillStyle='#4dabf7';ctx.fillRect(-3,4,6,3);
  }else if(kind===2){ // 咖啡機
    ctx.fillStyle='#343a40';rr(-9,-10,18,24,3);ctx.fill();ctx.fillStyle='#868e96';ctx.fillRect(-6,-6,12,6);
    ctx.fillStyle='#fff';ctx.fillRect(-3,6,6,6);ctx.fillStyle='#8a5a3a';ctx.fillRect(-2,7,4,2);
  }else{ // 沙發
    ctx.fillStyle='#e8590c';rr(-10,-14,20,28,5);ctx.fill();ctx.fillStyle='#fd7e14';rr(-6,-10,12,20,3);ctx.fill();
  }
  ctx.restore();
}
function desk(x,y,k){
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle='#5c4a3d';ctx.fillRect(-16,-22,32,44);           // 桌面
  ctx.fillStyle='#2b2f36';ctx.fillRect(-12,-18,6,22);             // 螢幕（側面看）
  ctx.fillStyle=hash(k+3)<.5?'#4dabf7':'#69db7c';ctx.fillRect(-11,-16,4,18);
  ctx.fillStyle='#e9ecef';ctx.fillRect(0,-8,9,12);                // 文件
  ctx.fillStyle='#868e96';ctx.fillRect(1,-5,7,1);ctx.fillRect(1,-2,7,1);
  if(hash(k+7)<.5){ctx.fillStyle='#fff';circle(6,12,3.5);ctx.fill();}  // 馬克杯
  ctx.fillStyle='#343a40';circle(20,0,8);ctx.fill();               // 椅子
  ctx.restore();
}
function drawBG(){
  const s=t*45;
  // 左：茶水間（淺色地磚）
  ctx.fillStyle='#1c3b44';ctx.fillRect(0,0,MID,H);
  ctx.strokeStyle='rgba(255,255,255,.07)';ctx.lineWidth=2;
  const ts=56,oy=s%ts;
  for(let y=oy-ts;y<LINE;y+=ts){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(MID,y);ctx.stroke();}
  for(let x=ts/2;x<MID;x+=ts){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,LINE);ctx.stroke();}
  // 右：開放式辦公室（地毯斜紋）
  ctx.fillStyle='#2e2638';ctx.fillRect(MID,0,MID,H);
  ctx.save();ctx.beginPath();ctx.rect(MID,0,MID,LINE);ctx.clip();
  ctx.strokeStyle='rgba(255,255,255,.035)';ctx.lineWidth=6;
  const sp=28,od=s%sp;
  for(let k=-H;k<W;k+=sp){ctx.beginPath();ctx.moveTo(MID+k,od-sp);ctx.lineTo(MID+k+H,od-sp+H);ctx.stroke();}
  ctx.restore();
  // 兩側擺設（跟著地板一起捲動，淡淡的不搶戲）
  ctx.save();ctx.globalAlpha=.35;
  const gap=150,k0=Math.floor((s-LINE-60)/gap),k1=Math.floor((s+60)/gap);
  for(let k=k0;k<=k1;k++){
    const y=s-k*gap;if(y<-40||y>LINE+30)continue;
    decor(Math.floor(hash(k)*4),14,y+hash(k+1)*30,false);
    desk(W-10,y+40,k);
  }
  ctx.restore();
  // 中間分隔：腳踏墊式的黃黑警示線
  ctx.save();ctx.beginPath();ctx.rect(MID-4,0,8,LINE);ctx.clip();
  for(let y=(s%20)-20;y<LINE;y+=20){ctx.fillStyle='rgba(255,212,59,.35)';ctx.beginPath();ctx.moveTo(MID-4,y);ctx.lineTo(MID+4,y-8);ctx.lineTo(MID+4,y+2);ctx.lineTo(MID-4,y+10);ctx.closePath();ctx.fill();}
  ctx.restore();
  if(phase!=='boss'){
    ctx.font=`bold 13px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='rgba(140,230,220,.6)';ctx.fillText(L('{{tb:office-shoot.say.102}}'),MID/2,TOP+18);
    ctx.fillStyle='rgba(255,150,170,.6)';ctx.fillText(L('{{tb:office-shoot.say.103}}'),MID*1.5,TOP+18);
  }
  // 下班線以下：打卡區
  ctx.fillStyle='#14161c';ctx.fillRect(0,LINE,W,H-LINE);
  ctx.fillStyle='rgba(255,255,255,.04)';for(let x=0;x<W;x+=30)ctx.fillRect(x,LINE,15,H-LINE);
  ctx.strokeStyle='rgba(255,70,90,.8)';ctx.lineWidth=2;ctx.setLineDash([10,8]);ctx.lineDashOffset=-t*30;
  ctx.beginPath();ctx.moveTo(0,LINE);ctx.lineTo(W,LINE);ctx.stroke();ctx.setLineDash([]);
  ctx.font=`bold 10px ${FONT}`;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle='rgba(255,110,130,.85)';ctx.fillText(L('{{tb:office-shoot.say.104}}'),6,LINE+9);
}
function drawGun(gx,gy,tier,w,s){
  ctx.save();ctx.translate(gx,gy);if(s)ctx.scale(s,s);
  switch(tier){
    case 0: // 原子筆
      ctx.fillStyle='#e8ecf2';rr(-2.5,-18,5,18,2);ctx.fill();
      ctx.fillStyle='#2f6fe0';ctx.fillRect(-2.5,-6,5,6);ctx.fillRect(1.5,-15,2,8);
      ctx.fillStyle='#333';ctx.beginPath();ctx.moveTo(-2,-18);ctx.lineTo(2,-18);ctx.lineTo(0,-22);ctx.closePath();ctx.fill();break;
    case 1: // 釘書機
      ctx.fillStyle='#2b2f36';rr(-4.5,-28,9,28,3);ctx.fill();
      ctx.fillStyle='#d64545';rr(-3.5,-27,7,18,3);ctx.fill();
      ctx.fillStyle='#d9dee6';ctx.fillRect(-2,-30,4,3);break;
    case 2: // 碎紙機
      ctx.fillStyle='#5b6573';rr(-8,-20,16,20,3);ctx.fill();
      ctx.fillStyle='#1a1d22';ctx.fillRect(-6,-22,12,3);
      ctx.fillStyle='#fff';for(const x of [-5,-2,1,4])ctx.fillRect(x,-29+Math.sin(t*20+x)*1.5,1.6,7);
      ctx.fillStyle='#ffa94d';ctx.fillRect(-8,-8,16,2);break;
    case 3: // 雷射簡報筆
      ctx.fillStyle='#1f2329';rr(-3,-32,6,32,3);ctx.fill();
      ctx.fillStyle='#888';ctx.fillRect(-3,-12,6,2);
      ctx.fillStyle='rgba(255,40,40,.5)';circle(0,-34,5);ctx.fill();ctx.fillStyle='#fff';circle(0,-34,2);ctx.fill();break;
    case 4: // 咖啡火箭（保溫瓶發射器）
      ctx.fillStyle='#6b3e26';rr(-7,-36,14,36,4);ctx.fill();
      ctx.fillStyle='#e0a96d';ctx.fillRect(-7,-30,14,3);ctx.fillRect(-7,-10,14,3);
      ctx.fillStyle='#fff';ctx.fillRect(-6,-40,12,4);
      ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1.5;for(const x of [-3,3]){ctx.beginPath();ctx.moveTo(x,-42);ctx.quadraticCurveTo(x+3*Math.sin(t*6),-47,x,-52);ctx.stroke();}break;
    case 5: // 印表機
      ctx.fillStyle='#e8ecf2';rr(-10,-24,20,24,3);ctx.fill();
      ctx.fillStyle='#2b3a67';ctx.fillRect(-10,-16,20,4);
      ctx.fillStyle='#fff';ctx.fillRect(-7,-34+Math.sin(t*12)*2,14,12);
      ctx.fillStyle='#9aa4b5';for(const y of [-31,-28])ctx.fillRect(-5,y+Math.sin(t*12)*2,10,1);
      ctx.fillStyle='#7dff9a';circle(7,-6,1.5);ctx.fill();break;
    case 6: // 已讀不回砲（手機）
      ctx.fillStyle='#1a1a1a';rr(-8,-46,16,46,4);ctx.fill();
      ctx.fillStyle=hexA(w.color,.6+.4*Math.random());rr(-6,-43,12,36,2);ctx.fill();
      ctx.fillStyle='#1a1a1a';ctx.font=`bold 6px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(L('{{tb:office-shoot.say.105}}'),0,-26,11);
      ctx.fillStyle='#fff3a8';ctx.fillRect(-8,-4,16,2);break;
  }
  ctx.restore();
}
function drawPlayer(){
  const w=WEAPONS[p.tier],T=p.tier;
  ctx.save();ctx.translate(p.x,PY);
  if(T>=3){
    const pr=(50+5*Math.min(p.wlv,8))*(1+Math.sin(t*6)*.08);
    const g=ctx.createRadialGradient(0,0,6,0,0,pr);g.addColorStop(0,hexA(w.color,.42));g.addColorStop(1,hexA(w.color,0));
    ctx.fillStyle=g;circle(0,0,pr);ctx.fill();
  }
  if(T>=6){
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineWidth=3;
    const nw=5+Math.min(p.wlv,5);for(let i=0;i<nw;i++){ctx.strokeStyle=hexA(w.trim,Math.max(.06,.3-i*.025));
      for(const sd of [-1,1]){ctx.beginPath();ctx.moveTo(sd*16,2);ctx.lineTo(sd*(42+i*7),8-i*10+Math.sin(t*4+i)*3);ctx.stroke();}}
    ctx.restore();
  }
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(0,16,24,8,0,0,6.283);ctx.fill();
  // 飄逸的領帶（第 4 階起，從背後飛出來）
  if(T>=4){ctx.fillStyle=w.trim;ctx.beginPath();ctx.moveTo(-3,8);ctx.lineTo(3,8);ctx.lineTo(6+Math.sin(t*7)*4,34);ctx.lineTo(0+Math.sin(t*7+1)*4,40);ctx.lineTo(-6+Math.sin(t*7)*4,34);ctx.closePath();ctx.fill();}
  // 西裝肩膀
  ctx.fillStyle=w.armor;ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(0,3,20,12,0,0,6.283);ctx.fill();ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(0,14);ctx.stroke();
  // 識別證（第 2 階起）
  if(T>=2){ctx.fillStyle='#fff';rr(9,4,8,9,1.5);ctx.fill();ctx.fillStyle=w.trim;ctx.fillRect(9,4,8,3);}
  const n=p.barrels,gl=GUN_LEN[T];
  ctx.strokeStyle=w.armor;ctx.lineWidth=5;ctx.lineCap='round';
  for(let i=0;i<n;i++){const gx=(i-(n-1)/2)*15;
    ctx.beginPath();ctx.moveTo(gx<0?-14:gx>0?14:-12,-2);ctx.lineTo(gx-2,-12+p.recoil);ctx.stroke();
    if(gx===0){ctx.beginPath();ctx.moveTo(12,-2);ctx.lineTo(2,-12+p.recoil);ctx.stroke();}}
  // 白襯衫領口 + 頭（後腦勺）
  ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(-6,-2);ctx.lineTo(6,-2);ctx.lineTo(0,6);ctx.closePath();ctx.fill();
  ctx.fillStyle='#f1c9a5';circle(-10,5,3);ctx.fill();circle(10,5,3);ctx.fill();
  ctx.fillStyle='#2a1f1a';circle(0,5,10);ctx.fill();
  ctx.strokeStyle='#3d2e26';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(1,3,4,0,Math.PI*1.4);ctx.stroke();
  if(T>=5){ctx.fillStyle='#e03131';ctx.fillRect(-10,0,20,4);ctx.fillStyle='#fff';ctx.font=`bold 4px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(L('{{tb:office-shoot.say.106}}'),0,2.2,18);}
  if(T>=6){ctx.fillStyle='#ffd43b';ctx.beginPath();ctx.moveTo(-7,-4);ctx.lineTo(-7,-10);ctx.lineTo(-3,-6);ctx.lineTo(0,-11);ctx.lineTo(3,-6);ctx.lineTo(7,-10);ctx.lineTo(7,-4);ctx.closePath();ctx.fill();}
  for(let i=0;i<n;i++){
    const gx=(i-(n-1)/2)*15;drawGun(gx,-10+p.recoil,T,w);
    if(p.recoil>2&&p.stun<=0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=hexA(w.color,.7);circle(gx,-10-gl,3+p.recoil);ctx.fill();ctx.restore();}
  }
  if(p.stun>0){
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold 12px ${FONT}`;
    ctx.fillStyle='#fff';ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.strokeText(L('{{tb:office-shoot.say.107}}'),0,30);ctx.fillText(L('{{tb:office-shoot.say.107}}'),0,30);
    ctx.font=`14px ${FONT}`;for(let i=0;i<3;i++){const a=t*6+i*2.09;ctx.fillText('💫',Math.cos(a)*18,-2+Math.sin(a)*6);}
  }
  ctx.restore();
}
function eyes(r,y,sp,angry,col){
  for(const sd of [-1,1]){ctx.fillStyle='#fff';circle(sd*r*sp,y,r*.22);ctx.fill();ctx.fillStyle=col||'#111';circle(sd*r*sp,y+r*.07,r*.11);ctx.fill();
    if(angry){ctx.strokeStyle='#111';ctx.lineWidth=Math.max(1.5,r*.1);ctx.beginPath();ctx.moveTo(sd*r*(sp+.25),y-r*.32);ctx.lineTo(sd*r*(sp-.18),y-r*.2);ctx.stroke();}}
}
function txt(s,x,y,size,col,bold,maxW){ctx.font=`${bold===false?'':'bold '}${size}px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=col;if(maxW)ctx.fillText(s,x,y,maxW);else ctx.fillText(s,x,y);}
function drawEnemy(e){
  const d=e.d,r=e.r,fl=e.hit>0&&Math.floor(t*30)%2===0;
  ctx.save();ctx.translate(e.x,e.y+Math.sin(e.wob)*1.5);
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(0,r*.95,r*.9,r*.3,0,0,6.283);ctx.fill();
  if(e.elite){const g=ctx.createRadialGradient(0,0,r*.6,0,0,r*1.9);g.addColorStop(0,'rgba(255,212,59,.55)');g.addColorStop(1,'rgba(255,212,59,0)');ctx.fillStyle=g;circle(0,0,r*1.9);ctx.fill();}
  if(e.dashing){ctx.fillStyle='rgba(255,60,60,.25)';ctx.beginPath();ctx.moveTo(-r,0);ctx.lineTo(r,0);ctx.lineTo(0,-r*4);ctx.closePath();ctx.fill();}
  if(fl)ctx.scale(1.18,.82); // 被打到 Q 彈壓扁
  const ol=e.elite?'#ffd43b':'rgba(0,0,0,.55)';ctx.lineWidth=e.elite?3:2;ctx.strokeStyle=ol;
  switch(e.type){
    case 'grunt':{ // 便利貼
      ctx.rotate(Math.sin(e.wob*.5)*.12);
      ctx.fillStyle=fl?'#fff':'#ffe066';ctx.fillRect(-r,-r,2*r,2*r);ctx.strokeRect(-r,-r,2*r,2*r);
      ctx.fillStyle='#e6c13a';ctx.beginPath();ctx.moveTo(r,r*.45);ctx.lineTo(r,r);ctx.lineTo(r*.45,r);ctx.closePath();ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=1;for(const y of [-.55,-.35])ctx.beginPath(),ctx.moveTo(-r*.7,y*r),ctx.lineTo(r*.7,y*r),ctx.stroke();
      eyes(r,r*.05,.38,true);ctx.strokeStyle='#111';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,r*.62,r*.2,Math.PI*1.15,Math.PI*1.85);ctx.stroke();break;}
    case 'runner':{ // 「在嗎？」訊息
      ctx.strokeStyle='rgba(125,255,154,.5)';ctx.lineWidth=2;for(const x of [-6,0,6]){ctx.beginPath();ctx.moveTo(x,-r-3);ctx.lineTo(x,-r-12);ctx.stroke();}
      ctx.fillStyle=fl?'#fff':'#5fd17a';rr(-r*1.45,-r*.85,r*2.9,r*1.7,r*.7);ctx.fill();
      ctx.beginPath();ctx.moveTo(-r*.6,r*.7);ctx.lineTo(-r*1.1,r*1.25);ctx.lineTo(-r*.1,r*.8);ctx.closePath();ctx.fill();
      txt(L('{{tb:office-shoot.say.108}}'),0,1,r*(lang==='en'?.62:.82),'#123',true,r*2.6);break;}
    case 'tank':{ // 一疊報表
      for(let i=2;i>=0;i--){ctx.fillStyle=i?'#d9dee6':(fl?'#fff':'#f5f7fa');ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1.5;
        rr(-r+i*3,-r*.85-i*4,2*r,r*1.75,3);ctx.fill();ctx.stroke();}
      ctx.strokeStyle='rgba(0,0,0,.15)';ctx.lineWidth=1;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-r*.7,-r*.5+i*r*.18);ctx.lineTo(r*.3,-r*.5+i*r*.18);ctx.stroke();}
      ctx.fillStyle='#4dabf7';for(let i=0;i<4;i++)ctx.fillRect(r*.4+i*4,r*.1-i*5,3,i*5+6);
      txt(L('{{tb:office-shoot.say.109}}'),-r*.25,-r*.65,r*.36,'#d64545',true,r*1.2);
      eyes(r,r*.25,.36,true);ctx.fillStyle='#111';rr(-r*.25,r*.55,r*.5,r*.14,2);ctx.fill();break;}
    case 'charger':{ // 急件
      ctx.fillStyle=fl?'#fff':'#e03131';rr(-r*.7,-r*1.15,r*.8,r*.4,3);ctx.fill();rr(-r,-r*.9,2*r,r*1.8,4);ctx.fill();ctx.stroke();
      txt(L('{{tb:office-shoot.say.110}}'),0,-r*.25,r*(lang==='en'?.55:.95),'#fff',true,r*1.8);
      eyes(r,r*.5,.42,true);if(e.dashing){txt('!!',r*1.1,-r,r,'#ffd43b');}break;}
    case 'shield':{ // 郵件
      ctx.fillStyle=fl?'#fff':'#e8f0ff';rr(-r*1.1,-r*.8,r*2.2,r*1.6,3);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#9aa4b5';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-r*1.1,-r*.8);ctx.lineTo(0,r*.05);ctx.lineTo(r*1.1,-r*.8);ctx.stroke();
      eyes(r,r*.35,.42,true);break;}
    case 'armor':{ // KPI 檔案櫃
      ctx.fillStyle=fl?'#fff':'#8d99a6';rr(-r*.9,-r,r*1.8,r*2,3);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#39424d';ctx.lineWidth=1.5;for(const y of [-.33,.33]){ctx.beginPath();ctx.moveTo(-r*.9,y*r);ctx.lineTo(r*.9,y*r);ctx.stroke();}
      ctx.fillStyle='#39424d';for(const y of [-.66,0,.66])ctx.fillRect(-r*.2,y*r-1.5,r*.4,3);
      txt('KPI',0,-r*.66,r*.5,'#ff4040');eyes(r,r*.02,.4,true,'#ff2020');break;}
    case 'splitter': case 'mini':{ // 會議邀請 / 後續會議
      ctx.fillStyle=fl?'#fff':'#ffffff';rr(-r,-r*.85,2*r,r*1.85,3);ctx.fill();ctx.stroke();
      ctx.fillStyle='#e64980';ctx.fillRect(-r,-r*.85,2*r,r*.5);
      ctx.fillStyle='#555';for(const sd of [-1,1])ctx.fillRect(sd*r*.5-1.5,-r*1.05,3,r*.4);
      if(e.type==='splitter'){txt(L('{{tb:office-shoot.say.111}}'),0,-r*.6,r*.36,'#fff',true,r*1.8);eyes(r,r*.25,.4,true);}
      else txt('+1',0,r*.3,r*.9,'#e64980');
      break;}
    case 'healer':{ // 再改一版
      ctx.fillStyle=fl?'#fff':'#ffc9de';rr(-r,-r,2*r,2*r,4);ctx.fill();ctx.stroke();
      txt('↻ v2',0,-r*.45,r*.6,'#c2255c');
      eyes(r,r*.2,.38,false);ctx.strokeStyle='#111';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,r*.45,r*.22,.2,Math.PI-.2);ctx.stroke();break;}
    case 'larva':{ // 待辦事項
      ctx.strokeStyle='#7a5c00';ctx.lineWidth=2;for(const sd of [-1,1])for(const y of [-.3,.3]){ctx.beginPath();ctx.moveTo(sd*r*.8,y*r);ctx.lineTo(sd*r*1.3,y*r+Math.sin(e.wob*2+y*5)*3);ctx.stroke();}
      ctx.fillStyle=fl?'#fff':'#fff8db';ctx.strokeStyle='#7a5c00';rr(-r*.85,-r*.85,r*1.7,r*1.7,3);ctx.fill();ctx.stroke();
      txt(L('{{tb:office-shoot.say.112}}'),0,-r*.25,r*.55,'#7a5c00',true,r*1.5);eyes(r,r*.35,.35,false);break;}
  }
  if(e.elite){ctx.fillStyle='#ffd43b';rr(-r*1.2,-r-15,r*2.4,11,3);ctx.fill();txt(L('{{tb:office-shoot.say.113}}'),0,-r-9.5,8,'#5a3d00',true,r*2.3);}
  if(e.shieldHits>0){
    const k=e.shieldHits/e.shieldMax;
    ctx.fillStyle=`rgba(224,49,49,${.75+.25*k})`;rr(-r*1.1,r*.9,r*2.2,r*.75,3);ctx.fill();
    ctx.strokeStyle='#fff';ctx.lineWidth=1.5;rr(-r*1.1,r*.9,r*2.2,r*.75,3);ctx.stroke();
    txt(L('{{tb:office-shoot.say.114}}'),0,r*1.28,r*.5,'#fff',true,r*2.1);
    ctx.fillStyle='rgba(255,255,255,.7)';ctx.fillRect(-r*1.1,r*1.7,r*2.2*k,2);
  }
  ctx.restore();
  if(e.hp<e.max){const bw=r*2;ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(e.x-bw/2,e.y-r-9-(e.elite?12:0),bw,4);ctx.fillStyle=e.elite?'#ffd43b':'#ff5f5f';ctx.fillRect(e.x-bw/2,e.y-r-9-(e.elite?12:0),bw*Math.max(0,e.hp/e.max),4);}
}
function drawCrate(c,top){
  const isW=c.weapon!=null,ratio=Math.max(0,c.shield/c.max),w=c.w,h=c.h,iw=w-22,ih=h-20;
  ctx.save();ctx.translate(c.x,c.y);
  if(top){
    ctx.textBaseline='middle';ctx.lineWidth=4;ctx.strokeStyle='rgba(0,0,0,.85)';
    if(isW){
      const nw=WEAPONS[c.weapon];
      ctx.save();ctx.translate(-iw/2+12,4);ctx.rotate(Math.PI/2);drawGun(0,0,c.weapon,nw,.9);ctx.restore();
      ctx.textAlign='left';ctx.font=`bold 10px ${FONT}`;const tag=c.refine?LF('{{tb:office-shoot.say.115}}',{n:c.refine}):L('{{tb:office-shoot.say.116}}');ctx.strokeText(tag,-iw/2+62,-11,iw-66);ctx.fillStyle='#ffd54a';ctx.fillText(tag,-iw/2+62,-11,iw-66);
      ctx.font=`bold ${lang==='en'?14:18}px ${FONT}`;ctx.strokeText(wName(nw),-iw/2+62,9,iw-66);ctx.fillStyle=nw.color;ctx.fillText(wName(nw),-iw/2+62,9,iw-66);
    }else{
      const s=c.mod.icon+' '+mLabel(c.mod);ctx.textAlign='center';ctx.font=`bold 15px ${FONT}`;ctx.strokeText(s,0,2,iw-8);ctx.fillStyle=c.mod.col;ctx.fillText(s,0,2,iw-8);
    }
    const label='🛡 '+fmt(c.shield);ctx.font=`bold 15px ${FONT}`;
    const tw=ctx.measureText(label).width+18;
    ctx.fillStyle='rgba(8,18,36,.95)';ctx.strokeStyle='#8fe3ff';ctx.lineWidth=1.5;rr(-tw/2,-h/2-12,tw,22,11);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(label,0,-h/2-1);
    ctx.restore();return;
  }
  if(isW){
    const col=WEAPONS[c.weapon].color;
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.rotate(t*.6);
    for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);ctx.fillStyle=hexA(col,.08);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-14,-110);ctx.lineTo(14,-110);ctx.closePath();ctx.fill();}
    ctx.restore();
  }
  ctx.fillStyle=isW?'#2e2208':'#162030';ctx.strokeStyle=isW?'#ffd54a':c.mod.col;ctx.lineWidth=2;
  rr(-iw/2,-ih/2,iw,ih,8);ctx.fill();ctx.stroke();
  const pulse=.5+.5*Math.sin(t*5+c.y*.05);
  ctx.fillStyle=`rgba(90,190,255,${.08+.16*ratio+(c.hit>0?.25:0)})`;
  ctx.strokeStyle=`rgba(140,220,255,${.35+.5*pulse*ratio+(c.hit>0?.3:0)})`;ctx.lineWidth=2.5;
  rr(-w/2,-h/2,w,h,16);ctx.fill();ctx.stroke();
  ctx.save();rr(-w/2,-h/2,w,h,16);ctx.clip();ctx.strokeStyle=`rgba(180,235,255,${.12*ratio})`;ctx.lineWidth=1;
  for(let x=-w;x<w;x+=14){ctx.beginPath();ctx.moveTo(x,-h/2);ctx.lineTo(x+h,h/2);ctx.stroke();}ctx.restore();
  ctx.restore();
}
function drawBoss(b){
  const d=b.def,sh=SHAPES[d.shape],w=sh.w,h=sh.h,M=b.M,fl=b.hit>0&&!b.fake&&Math.floor(t*30)%3===0;
  ctx.save();ctx.translate(b.x,b.y);ctx.scale(b.scale,b.scale);
  if(b.fake)ctx.globalAlpha=.6+.3*Math.abs(Math.sin(t*6+b.hx));
  else{ctx.fillStyle='rgba(0,0,0,.45)';ctx.beginPath();ctx.ellipse(0,h/2+6,w*.58,13,0,0,6.283);ctx.fill();}
  if(b.absorbOn>0){ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<3;i++){const q=((t*60+i*30)%90)+30;ctx.strokeStyle=`rgba(200,80,255,${.5*(1-(q-30)/90)})`;ctx.lineWidth=3;circle(0,0,w*.5+90-q);ctx.stroke();}ctx.restore();}
  if(d.look==='robot'){
    ctx.strokeStyle='#5a6270';ctx.lineWidth=4;ctx.lineCap='round';
    for(const sd of [-1,1]){ctx.beginPath();ctx.moveTo(sd*w/2,0);ctx.lineTo(sd*(w/2+14),h*.2+Math.sin(b.t*5+sd)*5);ctx.stroke();ctx.fillStyle='#5a6270';circle(sd*(w/2+14),h*.2+Math.sin(b.t*5+sd)*5,7);ctx.fill();}
    ctx.fillStyle=fl?'#fff':d.col;ctx.strokeStyle='#3a4048';ctx.lineWidth=4;rr(-w/2,-h/2,w,h,14);ctx.fill();ctx.stroke();
    ctx.strokeStyle='#3a4048';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-h/2);ctx.lineTo(0,-h/2-20);ctx.stroke();ctx.fillStyle='#ff4040';circle(0,-h/2-22,4+Math.sin(t*8));ctx.fill();
    ctx.fillStyle='#1a1d22';rr(-w*.38,-h*.38,w*.76,h*.42,8);ctx.fill();
    ctx.fillStyle='#7dff9a';ctx.font=`bold 15px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(Math.floor(t*2)%2?L('{{tb:office-shoot.say.117}}'):L('{{tb:office-shoot.say.118}}'),0,-h*.17,w*.7);
    ctx.fillStyle='#c5ccd6';for(const [x,y] of [[-.42,-.42],[.42,-.42],[-.42,.42],[.42,.42]]){circle(x*w,y*h,3);ctx.fill();}
    ctx.fillStyle='#3a4048';rr(-w*.3,h*.14,w*.6,h*.2,4);ctx.fill();ctx.fillStyle='#ff4040';for(let i=0;i<5;i++)ctx.fillRect(-w*.26+i*w*.11,h*.19,w*.07,h*.1);
  }else if(d.look==='folder'){
    ctx.fillStyle=fl?'#fff':'#2f8a55';rr(-w/2,-h/2-14,w*.45,24,6);ctx.fill();
    ctx.fillStyle='#fff';for(let i=0;i<3;i++){ctx.save();ctx.rotate((i-1)*.12);ctx.fillRect(-w*.35+i*w*.2,-h/2-10-i*3,w*.3,30);ctx.restore();}
    ctx.fillStyle=fl?'#fff':d.col;ctx.strokeStyle='#1d4a2c';ctx.lineWidth=4;rr(-w/2,-h/2,w,h,12);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';rr(-w*.36,-h*.36,w*.72,22,4);ctx.fill();
    ctx.fillStyle='#1d4a2c';ctx.font=`bold 12px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(L('{{tb:office-shoot.say.119}}'),0,-h*.36+11,w*.68);
    faceFeatures(w,h,d,b,-h*.02);
    ctx.fillStyle='#1d4a2c';ctx.font=`bold 11px ${FONT}`;ctx.fillText(L('{{tb:office-shoot.say.120}}'),0,h*.36,w*.8);
  }else{
    // 手（拿著文件）
    for(const sd of [-1,1]){const y=h*.2+Math.sin(b.t*4+sd)*4;ctx.fillStyle=d.col;ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=3;circle(sd*(w/2+4),y,15);ctx.fill();ctx.stroke();ctx.fillStyle='#f1c9a5';circle(sd*(w/2+10),y+8,8);ctx.fill();}
    // 西裝身體
    ctx.fillStyle=fl?'#fff':d.col;ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=4;rr(-w/2,-h/2,w,h,sh.r);ctx.fill();ctx.stroke();
    // 臉
    const fy=-h/2+6,fh=h*.6;
    ctx.fillStyle=fl?'#fff':'#f1c9a5';rr(-w*.38,fy,w*.76,fh,Math.min(sh.r,30));ctx.fill();
    // 頭髮
    ctx.fillStyle='#2a1f1a';
    if(d.hair==='comb'){rr(-w*.38,fy-6,w*.76,16,8);ctx.fill();ctx.strokeStyle='#2a1f1a';ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-w*.3,fy+12+i*3);ctx.quadraticCurveTo(0,fy+4+i*3,w*.3,fy+14+i*3);ctx.stroke();}}
    else if(d.hair==='part'){rr(-w*.4,fy-8,w*.8,20,10);ctx.fill();ctx.fillStyle='#f1c9a5';ctx.fillRect(-w*.08,fy-8,3,14);}
    else if(d.hair==='spiky'){ctx.beginPath();ctx.moveTo(-w*.4,fy+10);for(let i=0;i<=7;i++)ctx.lineTo(-w*.4+i*w*.8/7,fy+(i%2?-14:8));ctx.lineTo(w*.4,fy+10);ctx.closePath();ctx.fill();}
    else if(d.hair==='bun'){circle(0,fy-14,14);ctx.fill();rr(-w*.4,fy-6,w*.8,16,8);ctx.fill();ctx.fillStyle='#ffd43b';ctx.fillRect(-12,fy-16,24,3);}
    else if(d.hair==='bald'){ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.ellipse(-w*.18,fy+8,10,4,-.3,0,6.283);ctx.fill();
      ctx.fillStyle='#2a1f1a';for(const sd of [-1,1])rr(sd*w*.38-(sd>0?6:0),fy+14,6,18,3),ctx.fill();}
    faceFeatures(w,h,d,b,fy+fh*.42);
    // 白襯衫 + 領帶
    ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(-w*.18,fy+fh);ctx.lineTo(w*.18,fy+fh);ctx.lineTo(0,h/2-4);ctx.closePath();ctx.fill();
    ctx.fillStyle=d.tie;ctx.beginPath();ctx.moveTo(-5,fy+fh);ctx.lineTo(5,fy+fh);ctx.lineTo(8,h/2-10);ctx.lineTo(0,h/2-2);ctx.lineTo(-8,h/2-10);ctx.closePath();ctx.fill();
    if(d.headset){ctx.strokeStyle='#222';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,fy+fh*.45,w*.42,Math.PI*1.1,Math.PI*1.9);ctx.stroke();ctx.fillStyle='#222';for(const sd of [-1,1])rr(sd*w*.42-5,fy+fh*.3,10,18,4),ctx.fill();
      ctx.beginPath();ctx.moveTo(-w*.4,fy+fh*.6);ctx.quadraticCurveTo(-w*.3,fy+fh*.95,-w*.1,fy+fh*.85);ctx.stroke();}
  }
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
    ctx.save();ctx.translate(h.x,h.y);
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
    if(h.vy>0&&tt<1.2){const tx=h.x+h.vx*tt;ctx.strokeStyle=`rgba(255,80,80,${.3+.3*Math.sin(t*20)})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(tx,PY+6,22,7,0,0,6.283);ctx.stroke();}
  }
}
function drawBullets(){
  for(const b of bullets){
    if(b.laser){ctx.strokeStyle=b.col;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x,b.y+28);ctx.stroke();
      ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x,b.y+24);ctx.stroke();}
    else if(b.rocket){ // 咖啡杯
      ctx.fillStyle='#8a5a3a';ctx.beginPath();ctx.moveTo(b.x-5,b.y-6);ctx.lineTo(b.x+5,b.y-6);ctx.lineTo(b.x+4,b.y+7);ctx.lineTo(b.x-4,b.y+7);ctx.closePath();ctx.fill();
      ctx.fillStyle='#fff';ctx.fillRect(b.x-6,b.y-9,12,3);ctx.fillStyle='#e0a96d';ctx.fillRect(b.x-5,b.y-1,10,3);}
    else if(b.orb){ // 揉爛的紙團
      ctx.fillStyle=hexA(b.col,.35);circle(b.x,b.y,b.r*1.8);ctx.fill();
      ctx.fillStyle='#f5f7fa';circle(b.x,b.y,b.r);ctx.fill();
      ctx.strokeStyle='#9aa4b5';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(b.x-b.r*.6,b.y-b.r*.2);ctx.lineTo(b.x,b.y+b.r*.3);ctx.lineTo(b.x+b.r*.5,b.y-b.r*.4);ctx.moveTo(b.x-b.r*.2,b.y-b.r*.7);ctx.lineTo(b.x+b.r*.1,b.y);ctx.stroke();}
    else if(b.look==='staple'){ctx.strokeStyle='#e8ecf2';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x-4,b.y+3);ctx.lineTo(b.x-4,b.y-2);ctx.lineTo(b.x+4,b.y-2);ctx.lineTo(b.x+4,b.y+3);ctx.stroke();}
    else if(b.look==='shred'){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vy,b.vx)+Math.PI/2);ctx.fillStyle='#fff';ctx.fillRect(-1.2,-5,2.4,10);ctx.restore();}
    else{ctx.fillStyle=b.col;ctx.beginPath();ctx.moveTo(b.x,b.y-b.r*1.6);ctx.quadraticCurveTo(b.x+b.r,b.y,b.x,b.y+b.r);ctx.quadraticCurveTo(b.x-b.r,b.y,b.x,b.y-b.r*1.6);ctx.fill();}
  }
}
function drawBeams(){
  for(const q of beams){const k=q.life/q.max,bw=q.w*k;
    ctx.fillStyle=hexA(q.col,.12*k);ctx.fillRect(q.x-bw,0,bw*2,PY-40);
    ctx.fillStyle=hexA(q.col,.45*k);ctx.fillRect(q.x-bw/2,0,bw,PY-40);
    ctx.fillStyle=`rgba(255,255,255,${k})`;ctx.fillRect(q.x-bw/6,0,bw/3,PY-40);
    if(q.tag==null)q.tag=rand(120,PY-120);
    ctx.globalAlpha=k;ctx.font=`bold 11px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.fillText(L('{{tb:office-shoot.say.131}}'),q.x+14,q.tag);ctx.globalAlpha=1;}
}
function drawParts(){
  for(const q of parts){const k=q.life/q.max;ctx.fillStyle=hexA(q.col,Math.min(1,k*1.5));ctx.fillRect(q.x-q.size/2,q.y-q.size/2,q.size,q.size);}
  for(const q of rings){const k=q.life/q.mx;ctx.strokeStyle=hexA(q.col,k*.8);ctx.lineWidth=3*k+1;circle(q.x,q.y,q.r);ctx.stroke();}
}
function drawTexts(){
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(const q of texts){const k=q.life/q.max;ctx.globalAlpha=Math.min(1,k*2);
    ctx.font=`bold ${q.size}px ${FONT}`;ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.8)';ctx.strokeText(q.text,q.x,q.y);ctx.fillStyle=q.col;ctx.fillText(q.text,q.x,q.y);}
  ctx.globalAlpha=1;
}
function drawVignette(){
  if(danger<=0||state!=='play')return;
  const a=danger*(.45+.15*Math.sin(t*12));
  const g=ctx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.75);g.addColorStop(0,'rgba(255,0,0,0)');g.addColorStop(1,`rgba(255,0,30,${a})`);
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}
function clockStr(){
  if(phase!=='waves')return L('{{tb:office-shoot.say.132}}');
  const m=Math.floor(9*60+8*60*Math.min(1,stageT/STAGE_LEN));
  return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
}
function drawHUD(){
  ctx.textBaseline='middle';
  ctx.fillStyle='rgba(5,8,15,.82)';ctx.fillRect(0,0,W,TOP);
  ctx.textAlign='left';ctx.fillStyle='#fff';ctx.font=`bold 19px ${FONT}`;const dayS=LF('{{tb:office-shoot.say.133}}',{n:stage});ctx.fillText(dayS,14,20);
  const tw=ctx.measureText(dayS).width;
  ctx.font=`bold 13px ${FONT}`;ctx.fillStyle=phase==='waves'?'#8fe3d8':'#ff6b6b';ctx.fillText('🕘 '+clockStr(),22+tw,21);
  const pr=phase==='waves'?Math.min(1,stageT/STAGE_LEN):1;
  ctx.fillStyle='#2a2f3a';rr(14,36,150,8,4);ctx.fill();
  ctx.fillStyle=phase==='waves'?'#8fe3d8':'#ff4d4d';rr(14,36,Math.max(8,150*pr),8,4);ctx.fill();
  ctx.font=`12px ${FONT}`;ctx.fillText('🏠',170,40);
  ctx.textAlign='right';ctx.fillStyle='#fff';ctx.font=`bold 20px ${FONT}`;ctx.fillText(score.toLocaleString(),W-52,20,150);
  ctx.fillStyle='#8a93a6';ctx.font=`10px ${FONT}`;ctx.fillText(L('{{tb:office-shoot.say.134}}'),W-52,40);
  ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font=`18px ${FONT}`;ctx.fillText(muted?'🔇':'🔊',W-22,28);
  const real=bosses.filter(b=>!b.dead&&!b.fake);
  if(phase==='boss'&&real.length&&curBoss){
    const y=TOP+6,hp=real.reduce((s,b)=>s+Math.max(0,b.hp),0),k=Math.min(1,hp/bossTotal);
    ctx.fillStyle='rgba(0,0,0,.7)';rr(10,y,W-20,38,6);ctx.fill();
    ctx.fillStyle=curBoss.tie||curBoss.col;rr(12,y+2,Math.max(0,(W-24)*k),18,5);ctx.fill();
    ctx.fillStyle='#fff';ctx.font=`bold 12px ${FONT}`;ctx.lineWidth=3;ctx.strokeStyle='#000';
    const s=`${bName(curBoss)}  ${fmt(hp)}`;ctx.strokeText(s,W/2,y+11,W-40);ctx.fillText(s,W/2,y+11,W-40);
    ctx.fillStyle='#ffd27a';ctx.font=`11px ${FONT}`;ctx.fillText('⚠ '+bHint(curBoss),W/2,y+29,W-36);
  }
  const by=H-62,w=WEAPONS[p.tier];
  ctx.fillStyle='rgba(5,8,15,.85)';ctx.fillRect(0,by,W,62);
  ctx.fillStyle=hexA(w.color,.6);ctx.fillRect(0,by,W,2);
  for(let i=0;i<WEAPONS.length;i++){ctx.fillStyle=i<=p.tier?WEAPONS[i].color:'#2a2f3a';rr(14+i*17,by+10,13,13,3);ctx.fill();}
  ctx.textAlign='left';ctx.fillStyle=w.color;ctx.font=`bold 19px ${FONT}`;ctx.fillText(wName(w)+(p.wlv?` +${p.wlv}`:''),14,by+42,200);
  if(lang!=='en'){const nw=ctx.measureText(wName(w)+(p.wlv?` +${p.wlv}`:'')).width;ctx.fillStyle='#8a93a6';ctx.font=`11px ${FONT}`;ctx.fillText(w.en,20+nw,by+44);}
  ctx.textAlign='right';ctx.fillStyle='#dde3ee';ctx.font=`bold 14px ${FONT}`;
  ctx.fillText(`☕×${fmtMul(p.rateMul)}  💰×${fmtMul(p.dmgMul)}  🤚×${p.barrels}`,W-14,by+18,250);
  ctx.fillStyle='#7dffa1';ctx.font=`bold 13px ${FONT}`;ctx.fillText(LF('{{tb:office-shoot.say.135}}',{n:fmt(dps())}),W-14,by+43);
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
  ctx.fillStyle='rgba(4,6,12,.72)';ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font=`900 46px ${FONT}`;ctx.lineWidth=8;ctx.strokeStyle='#000';ctx.strokeText(title,W/2,H*.22,W-24);
  ctx.fillStyle=titleCol;ctx.fillText(title,W/2,H*.22,W-24);
  let y=y0||H*.33;
  for(const l of lines){ctx.font=`${l.b?'bold ':''}${l.s||16}px ${FONT}`;ctx.fillStyle=l.c||'#dfe6f2';ctx.fillText(l.t,W/2,y,W-20);y+=l.gap||30;}
  if(cta){ctx.globalAlpha=.55+.45*Math.sin(t*4);ctx.font=`bold 20px ${FONT}`;ctx.fillStyle='#ffe066';ctx.fillText(cta,W/2,H*.8,W-20);ctx.globalAlpha=1;}
}
function render(){
  ctx.setTransform(cv.width/W,0,0,cv.height/H,0,0);
  ctx.save();
  if(shake>0)ctx.translate(rand(-shake,shake),rand(-shake,shake));
  drawBG();
  for(const c of crates)drawCrate(c);
  for(const e of enemies)drawEnemy(e);
  for(const b of bosses)if(!b.dead)drawBoss(b);
  drawHazards();
  ctx.globalCompositeOperation='lighter';drawBeams();drawParts();ctx.globalCompositeOperation='source-over';
  drawBullets();
  for(const c of crates)drawCrate(c,true);
  if(state!=='over'||overT<.15)drawPlayer();
  drawTexts();
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
const keys={left:false,right:false};
let paused=false,drag=null;
function osShown(){return !$v.hidden&&!document.hidden;}
function clearInput(){keys.left=keys.right=false;drag=null;}
function pauseNow(){if(state==='play'&&!paused){paused=true;clearInput();}last=null;}
addEventListener('keydown',e=>{
  if(!osShown()||e.metaKey||e.altKey||e.ctrlKey)return;
  if(['INPUT','BUTTON','A','SUMMARY','SELECT','TEXTAREA'].indexOf(e.target&&e.target.tagName)>=0)return;
  const k=e.key;
  if(k==='m'||k==='M'){muted=!muted;return;}
  if(state!=='play')return;
  if(k==='ArrowLeft'||k==='a'||k==='A'){keys.left=true;e.preventDefault();}
  else if(k==='ArrowRight'||k==='d'||k==='D'){keys.right=true;e.preventDefault();}
  else if(k===' '||k==='Enter'){e.preventDefault();if(paused){paused=false;last=null;}}
});
addEventListener('keyup',e=>{const k=e.key;
  if(k==='ArrowLeft'||k==='a'||k==='A')keys.left=false;
  if(k==='ArrowRight'||k==='d'||k==='D')keys.right=false;});
function toLocal(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
cv.addEventListener('pointerdown',e=>{
  if(!osShown())return;
  if(e.pointerType==='mouse'&&e.button!==0)return;
  e.preventDefault();initAudio();const pt=toLocal(e);
  if(pt.y<TOP&&pt.x>W-42){muted=!muted;return;}
  if(state!=='play'){say(state==='over'?'{{tb:office-shoot.say.155}}':'{{tb:office-shoot.say.156}}');return;}
  try{cv.focus();}catch(_){}
  if(paused){paused=false;last=null;return;}
  if(e.pointerType==='mouse'){p.tx=pt.x;}
  else{drag={off:p.x-pt.x};try{cv.setPointerCapture(e.pointerId);}catch(_){}}
});
cv.addEventListener('pointermove',e=>{
  if(state!=='play'||paused||!osShown())return;
  const pt=toLocal(e);
  if(e.pointerType==='mouse')p.tx=pt.x;
  else if(drag)p.tx=pt.x+drag.off;
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
  const b=$('os-go');b.disabled=live;
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
  if(otBusy)return;
  if(ENTRY_FEE>S.balance){say(LOW_MSG,'lose');return;}
  analytics=AN.start('office-shoot',ENTRY_FEE);otBusy=true;otStake=ENTRY_FEE;earned=0;paidDays={};
  save();renderAll();
  reset();clearInput();paused=false;state='play';last=null;initAudio();
  say('{{tb:office-shoot.say.165}}','',{d:BONUS_DAYS,n:BONUS_PER_DAY});
  ui();try{cv.focus();}catch(_){}
}
$('os-go').addEventListener('click',begin);
// 先於共用離頁處理結束，讓 abandoned 帶上已入帳的 BONUS
window.addEventListener('pagehide',e=>{if(!e.persisted&&otBusy&&analytics){AN.end(analytics,earned,'abandoned',{stage,score,step:kills,weapon_level:p.tier+1});analytics=null;otBusy=false;otStake=0;}},true);

// ====== 主迴圈（離開畫面或背景時暫停）======
let last=null;
function frame(now){
  if(osShown()){
    if(last===null)last=now;
    const dt=Math.min(.05,Math.max(0,(now-last)/1000)||0);last=now;
    syncLang();
    if(paused)updateFx(0);else update(dt);
    ui();render();
  }else last=null;
  requestAnimationFrame(frame);
}
ui();render();requestAnimationFrame(frame);
  })();
