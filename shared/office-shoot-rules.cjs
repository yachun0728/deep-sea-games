// No Overtime simulation, extracted from the shipped game. Browser and Worker run
// the same numbers, collision rules, seeded randomness and terminal condition.
const officeShootRules=(()=>{
const rulesVersion=1,TARGET_SCALE=10,KEY_LEFT_DOWN=4501,KEY_LEFT_UP=4502,KEY_RIGHT_DOWN=4503,KEY_RIGHT_UP=4504,CLEAR=4505;
const inputCount=4506;
function createGame(random=Math.random,callbacks={}){
const W=450,H=800,MID=W/2,TOP=56,PY=H-112,LINE=H-150,STAGE_LEN=35;
const rand=(a,b)=>a+random()*(b-a),clamp=(v,a,b)=>v<a?a:v>b?b:v;
const ZH=s=>callbacks.ZH?callbacks.ZH(s):s,EN=s=>callbacks.EN?callbacks.EN(s):s;
const L=s=>callbacks.L?callbacks.L(s):s;
const LF=(s,o)=>L(s).replace(/\{(\w+)\}/g,(m,k)=>o[k]);
const pickL=a=>L(a[Math.floor(random()*a.length)]);
const wName=w=>L(w.name),bName=d=>L(d.name),bHint=d=>L(d.hint),mLabel=m=>L(m.label);
const UNITS=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];
function fmt(n){n=Math.max(0,Math.ceil(n));if(n<1000)return ''+n;const i=Math.min(UNITS.length-1,Math.floor(Math.log10(n)/3)),v=n/Math.pow(1000,i);return(v<10?v.toFixed(1):Math.floor(v))+UNITS[i];}
function seeded(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hsl2hex(h,s,l){s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));return '#'+[f(0),f(8),f(4)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');}
function wpick(list){let tw=0;for(const x of list)tw+=x[1];let r=random()*tw;for(const x of list){r-=x[1];if(r<=0)return x[0];}return list[0][0];}
// ====== 武器進化線 ======
const WEAPONS=[
 {name:'office-shoot.say.001',en:'BALLPOINT PEN',color:'#4d8dff',rate:4,dmg:1,spd:720,type:'bullet',size:3.5,look:'ink',armor:'#5b6573',trim:'#d64545'},
 {name:'office-shoot.say.002',en:'STAPLER',color:'#d9dee6',rate:10,dmg:1,spd:820,type:'bullet',size:3,jitter:.06,look:'staple',armor:'#3d4a63',trim:'#4dabf7'},
 {name:'office-shoot.say.003',en:'SHREDDER',color:'#ffffff',rate:2.4,dmg:1.6,spd:680,type:'spread',pellets:5,spread:.34,size:3.5,armor:'#4a3b2f',trim:'#ffa94d'},
 {name:'office-shoot.say.004',en:'LASER POINTER',color:'#ff3b3b',rate:7,dmg:4.3,spd:1150,type:'laser',pierce:3,armor:'#1f2937',trim:'#ff3b3b'},
 {name:'office-shoot.say.005',en:'COFFEE ROCKET',color:'#c8874a',rate:2.3,dmg:20,spd:260,type:'rocket',aoe:58,armor:'#6b3e26',trim:'#e0a96d'},
 {name:'office-shoot.say.006',en:'PRINTER',color:'#bcd4ff',rate:4.5,dmg:15,spd:540,type:'orb',size:9,pierce:6,armor:'#2b3a67',trim:'#e8f0ff'},
 {name:'office-shoot.say.007',en:'SEEN-ZONE CANNON',color:'#7dff9a',rate:2.6,dmg:46,type:'rail',width:18,armor:'#a8841f',trim:'#fff3a8'},
];
const WDPS=[4,10,15,30,46,67,120];
const GUN_LEN=[18,30,28,34,42,42,48];
const MODS=[
 {id:'rate',label:'office-shoot.say.008',icon:'☕',w:3,col:'#ffd43b'},
 {id:'dmg',label:'office-shoot.say.009',icon:'💰',w:3,col:'#7dff9a'},
 {id:'barrel',label:'office-shoot.say.010',icon:'🤚',w:1.3,col:'#4dabf7'},
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
 {name:'office-shoot.say.011',mech:['split'],hint:'office-shoot.say.012',look:'human',col:'#3d4a63',tie:'#d64545',hair:'comb',glasses:true,shape:'square'},
 {name:'office-shoot.say.013',mech:['shield'],hint:'office-shoot.say.014',look:'human',col:'#2f2f3a',tie:'#ffb347',hair:'part',headset:true,shape:'square'},
 {name:'office-shoot.say.015',mech:['hive'],hint:'office-shoot.say.016',look:'human',col:'#8a3b6b',tie:'#ffd43b',hair:'bun',glasses:true,shape:'tall'},
 {name:'office-shoot.say.017',mech:['weak'],hint:'office-shoot.say.018',look:'human',col:'#4a4f57',tie:'#9fb3c8',hair:'bald',shape:'square'},
 {name:'office-shoot.say.019',mech:['absorb'],hint:'office-shoot.say.020',look:'human',col:'#6b4fa0',tie:'#ff6b6b',hair:'spiky',glasses:true,shape:'round'},
 {name:'office-shoot.say.021',mech:['regen'],hint:'office-shoot.say.022',look:'folder',col:'#3fae6a',shape:'tall'},
 {name:'office-shoot.say.023',mech:['mirror'],hint:'office-shoot.say.024',look:'human',col:'#2b7a8a',tie:'#5ad1e6',hair:'part',shape:'round'},
 {name:'office-shoot.say.025',mech:['meteor'],hint:'office-shoot.say.026',look:'human',col:'#8a5a3a',tie:'#ffd43b',hair:'spiky',shape:'square'},
 {name:'office-shoot.say.027',mech:['teleport'],hint:'office-shoot.say.028',look:'human',col:'#1a1a1a',tie:'#ffd43b',hair:'bald',crown:true,glasses:true,shape:'round'},
 {name:'office-shoot.say.029',mech:['missile'],hint:'office-shoot.say.030',look:'robot',col:'#c0c8d0',shape:'square'},
];
const MECH_POOL=['split','shield','hive','weak','absorb','regen','mirror','meteor','teleport','missile'];
const MECH_NAME={split:'office-shoot.say.031',shield:'office-shoot.say.032',hive:'office-shoot.say.033',weak:'KPI|KPI-Obsessed',absorb:'office-shoot.say.034',regen:'office-shoot.say.035',mirror:'office-shoot.say.036',meteor:'office-shoot.say.037',teleport:'office-shoot.say.038',missile:'office-shoot.say.039'};
const MECH_HINT={split:'office-shoot.say.040',shield:'office-shoot.say.041',hive:'office-shoot.say.042',weak:'office-shoot.say.043',absorb:'office-shoot.say.044',regen:'office-shoot.say.045',mirror:'office-shoot.say.046',meteor:'office-shoot.say.047',teleport:'office-shoot.say.048',missile:'office-shoot.say.049'};
const NOUNS=['office-shoot.say.050','office-shoot.say.051','office-shoot.say.052','office-shoot.say.053','office-shoot.say.054','office-shoot.say.055','office-shoot.say.056','office-shoot.say.057'];
function bossDefFor(s){
  if(s<=BOSS_DEFS.length)return BOSS_DEFS[s-1];
  const R=seeded(s*7919+13),n=s>=16?3:2,pool=MECH_POOL.slice(),mech=[];
  while(mech.length<n&&pool.length){
    const m=pool.splice(Math.floor(R()*pool.length),1)[0];
    if((m==='split'&&mech.includes('mirror'))||(m==='mirror'&&mech.includes('split')))continue;
    mech.push(m);
  }
  const hue=Math.floor(R()*360),pick=a=>a[Math.floor(R()*a.length)],ni=Math.floor(R()*NOUNS.length);
  const NAME_FMT='office-shoot.say.058',fill=(s,o)=>s.replace(/\{(\w+)\}/g,(m,k)=>o[k]);
  const name=fill(ZH(NAME_FMT),{a:mech.map(m=>ZH(MECH_NAME[m])).join('・'),b:ZH(NOUNS[ni])})+'|'+fill(EN(NAME_FMT),{a:mech.map(m=>EN(MECH_NAME[m])).join(', '),b:EN(NOUNS[ni])});
  return {name,mech,hint:mech.map(m=>ZH(MECH_HINT[m])).join(' ＋ ')+'|'+mech.map(m=>EN(MECH_HINT[m])).join(' + '),look:R()<.15?'robot':'human',col:hsl2hex(hue,40,32),tie:hsl2hex((hue+150)%360,75,60),
    hair:pick(['comb','part','spiky','bun','bald']),glasses:R()<.5,headset:R()<.3,crown:s>=15,shape:pick(['round','square','tall'])};
}
// ====== 狀態 ======
let state='menu',phase='waves',stage=1,stageT=0,phaseT=0,score=0,best=0,t=0,overT=0,kills=0;
let p,bullets,enemies,crates,bosses,hazards,parts,texts,beams,rings,shake=0,banner=null,flash=0,danger=0,bossTotal=1,curBoss=null;
let spawnT,crateT,sinceWeapon,modsTaken,eliteT=8,shotSfxT=0,quipT=0,critT=0,overTitle='',overQuip='';
const QUIPS=['office-shoot.say.059','office-shoot.say.060','office-shoot.say.061','office-shoot.say.062','office-shoot.say.063','office-shoot.say.064','office-shoot.say.065','office-shoot.say.066','office-shoot.say.067','office-shoot.say.068'];
const MISS=['office-shoot.say.069','office-shoot.say.070','office-shoot.say.071','office-shoot.say.072','office-shoot.say.073'];
const OVER_T=['office-shoot.say.074','office-shoot.say.075','office-shoot.say.076','office-shoot.say.077'];
const OVER_Q=['office-shoot.say.078','office-shoot.say.079','office-shoot.say.080','office-shoot.say.081'];

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


const keys={left:false,right:false};let lang=callbacks.language?.()||'zh';
function tone(...args){callbacks.tone?.(...args);}
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
  if(M.has('mirror')){const real=random()<.5?0:1;for(let i=0;i<2;i++)bosses.push(makeBoss(def,.7,i?W-58:MID+58,hp,spd,i!==real));}
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
    if(t.fake){if(random()<.3)spark(src.x||t.x,t.y+t.h/2,'#9aa4b5',2,90,2);return;}
    if(t.shieldOn>0){if(random()<.3)spark(src.x||t.x,t.y+t.h/2,'#ffb347',2,120,2);return;}
    if(t.M.has('weak')){const wh=weakHit(t,src);d*=wh?1.5:.15;if(wh&&random()<.4)spark(src.x||t.x,t.y+t.h/2,'#ff3030',3,160,2.5);}
    if(t.absorbOn>0){t.hp=Math.min(t.max,t.hp+d*.5);t.hit=.07;if(random()<.2)spark(t.x+rand(-30,30),t.y,'#7dff9a',2,80,2.5);return;}
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
    if(Math.abs(t.x-x)<halfW(t)+hw&&t.y-halfH(t)<PY&&t.y+halfH(t)>0){damage(t,dmg,src);if(random()<.5)spark(x,t.y+halfH(t),w.color,3,180);}
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
  if(quipT<=0&&random()<.07){quipT=1.4;floatText(e.x,e.y-14,pickL(QUIPS),'#ffe8a3',13);}
  if(e.type==='splitter')for(let i=0;i<3;i++)spawnEnemy('mini',e.x+(i-1)*20,e.y+rand(-6,6),true);
  if(e.elite){
    if(random()<.5){p.rateMul*=1.06;floatText(e.x,e.y-10,L('office-shoot.say.082'),'#ffd43b',15);}
    else{p.dmgMul*=1.08;floatText(e.x,e.y-10,L('office-shoot.say.083'),'#7dff9a',15);}
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
  floatText(b.x,b.y-b.h/2-12,b.gen===0?L('office-shoot.say.084'):L('office-shoot.say.085'),'#ff4d4d',20);shake=Math.max(shake,8);
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
  floatText(p.x,PY-70,L('office-shoot.say.086'),'#ffd43b',17);
  phase='clear';phaseT=0;
  callbacks.dayCleared?.(stage);
  banner={text:LF('office-shoot.say.087',{n:stage}),sub:LF('office-shoot.say.088',{b:bName(b.def)}),col:'#ffe066',t:0,dur:2.4};
  tone(523,.15,'square',.04,1,.25);tone(659,.15,'square',.04,1,.4);tone(784,.3,'square',.04,1,.55);
}
function breakCrate(c){
  c.broken=true;
  spark(c.x,c.y,'#8fe3ff',22,260,3);
  rings.push({x:c.x,y:c.y,r:10,max:110,life:.35,mx:.35,col:'#8fe3ff'});
  if(c.refine){
    p.wlv=c.refine;p.dmgMul*=1.3;const w=WEAPONS[p.tier];
    banner={text:wName(w)+' +'+p.wlv+'!',sub:L('office-shoot.say.089'),col:'#ffd43b',t:0,dur:2.2};
    rings.push({x:p.x,y:PY,r:10,max:180,life:.6,mx:.6,col:'#ffd43b'});spark(p.x,PY,'#ffd43b',50,340,3.5);
    flash=.6;shake=Math.max(shake,8);[659,784,988,1319].forEach((f,i)=>tone(f,.16,'square',.045,1,i*.08));
  }else if(c.weapon!=null){
    p.tier=c.weapon;const w=WEAPONS[p.tier];
    banner={text:LF('office-shoot.say.090',{w:wName(w)}),sub:(lang==='en'?'':w.en+'  ·  ')+LF('office-shoot.say.091',{a:p.tier+1,b:WEAPONS.length}),col:w.color,t:0,dur:2.2};
    rings.push({x:p.x,y:PY,r:10,max:160,life:.6,mx:.6,col:w.color});
    spark(p.x,PY,w.color,40,320,3.5);
    flash=.6;shake=Math.max(shake,8);
    [523,659,784,1047].forEach((f,i)=>tone(f,.16,'square',.045,1,i*.08));
  }else applyMod(c.mod,c.x,c.y);
}
function stunPlayer(){
  p.stun=1;flash=Math.max(flash,.3);shake=Math.max(shake,6);
  floatText(p.x,PY-50,L('office-shoot.say.092'),'#ff6b6b',20);tone(140,.3,'square',.05,.5);
}
function throwRock(b){
  let tx,ty;
  const cs=crates.filter(c=>c.y>b.y+30&&c.y<LINE-120);
  if(cs.length&&random()<.65){const c=cs[Math.floor(random()*cs.length)];tx=c.x+rand(-30,30);ty=c.y+c.spd*1.2;}
  else{tx=random()<.6?p.x:rand(20,W-20);ty=PY;}
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
  floatText(b.x,b.y+b.h/2+14,L('office-shoot.say.093'),'#e599f7',17);
  for(let i=0;i<4;i++)spawnEnemy(pickType(),rand(MID+30,W-30),b.y+b.h/2+rand(0,40));
  tone(900,.3,'sine',.05,.3);
}
function gameOver(x,y){
  if(state!=='play')return;
  state='over';overT=0;
  spark(x,y,'#ff4d4d',50,380,4);spark(p.x,PY,'#fff',30,300,3);
  rings.push({x,y,r:10,max:260,life:.7,mx:.7,col:'#ff4d4d'});
  shake=18;flash=.7;
  callbacks.end?.(score);
  overTitle=Math.floor(random()*4);overQuip=Math.floor(random()*4);
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
  lang=callbacks.language?.()||'zh';
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
      if(random()<Math.min(.4,.12+.03*(stage-1))){
        const x=rand(MID+40,W-40),n=Math.min(6,3+Math.floor(stage/3)),tp=random()<.5?'runner':'grunt';
        for(let i=0;i<n;i++)spawnEnemy(tp,x+rand(-30,30),-15-i*28,true);
      }else spawnEnemy(pickType());
    }
    if(stageT>=STAGE_LEN){phase='warn';phaseT=0;
      const d=bossDefFor(stage);
      banner={text:L('office-shoot.say.094'),sub:bName(d),hint:bHint(d),col:'#ff4d4d',t:0,dur:2.6};
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
    if(b.rocket){b.vy-=700*dt;if(random()<.7)parts.push({x:b.x+rand(-2,2),y:b.y+8,vx:rand(-20,20),vy:rand(40,90),life:.35,max:.35,col:'#e8e0d0',size:2.5});}
    b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(b.y<-30||b.x<-20||b.x>W+20||b.life<=0){b.dead=true;continue;}
    for(const tg of targets){
      if(tg.dead||tg.broken||tg.gone)continue;
      if(b.hits&&b.hits.has(tg))continue;
      if(hitTest(tg,b.x,b.y,b.r)){
        if(b.rocket){explode(b.x,b.y,b.aoe,b.dmg,b.col);b.dead=true;break;}
        if(tg.shieldHits>0&&!b.laser&&!b.orb){
          tg.shieldHits--;tg.hit=.05;b.dead=true;spark(b.x,b.y,'#9fd3ff',2,120,2);
          if(tg.shieldHits===0){floatText(tg.x,tg.y-24,L('office-shoot.say.095'),'#ffc9c9',13);spark(tg.x,tg.y+tg.r,'#9fd3ff',12,200,2.5);}
          break;
        }
        let dd=b.dmg;if(random()<.06){dd*=2;if(critT<=0){critT=.35;floatText(b.x+rand(-8,8),b.y-12,L('office-shoot.say.096'),'#ff922b',15);}}
        damage(tg,dd,b);
        if(random()<.5)spark(b.x,b.y,tg.kind==='crate'?'#8fe3ff':b.col,2,120,2);
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
    if(e.d.dash&&e.y>e.dashY){sp*=6.5;if(!e.dashing){e.dashing=true;floatText(e.x,e.y-20,L('office-shoot.say.097'),'#ff4d4d',18);}}
    e.y+=sp*dt;e.wob+=dt*7;e.hit-=dt;
    if(e.type==='healer'){
      e.healT-=dt;
      if(e.healT<=0){e.healT=2;let n=0;
        for(const o of enemies)if(o!==e&&!o.dead&&o.hp<o.max&&Math.hypot(o.x-e.x,o.y-e.y)<100){o.hp=Math.min(o.max,o.hp+o.max*.2);n++;spark(o.x,o.y,'#7dff9a',4,80,2.5);}
        rings.push({x:e.x,y:e.y,r:8,max:100,life:.5,mx:.5,col:'#7dff9a'});
        if(n)floatText(e.x,e.y-22,L('office-shoot.say.098'),'#ff8cc6',13);}
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
        c.gone=true;h.dead=true;floatText(c.x,c.y,L('office-shoot.say.099'),'#ff9a6b',15);
        spark(c.x,c.y,'#c49a6c',25,260,3.5);spark(c.x,c.y,'#8fe3ff',12,200,2.5);shake=Math.max(shake,5);tone(120,.25,'sawtooth',.05,.5);break;}}
    }else if(random()<.8)parts.push({x:h.x-h.vx*.04,y:h.y-h.vy*.04,vx:rand(-20,20),vy:rand(-20,20),life:.3,max:.3,col:'#ffb36b',size:2.5});
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
        if(b.absorbT<=1.1&&!b.absWarned){b.absWarned=true;floatText(b.x,b.y+b.h/2+16,L('office-shoot.say.100'),'#ff4d4d',16);tone(660,.1,'square',.04,1);tone(660,.1,'square',.04,1,.2);}
        if(b.absorbT<=0){b.absorbOn=2.5;b.absorbT=7;b.absWarned=false;}}
    }
    if(M.has('regen')&&b.idle>1.5&&b.hp<b.max&&!b.fake){b.hp=Math.min(b.max,b.hp+b.max*.07*dt);if(random()<.3)parts.push({x:b.x+rand(-b.w/2,b.w/2),y:b.y+rand(-b.h/2,b.h/2),vx:0,vy:-40,life:.6,max:.6,col:'#7dff9a',size:3});}
    if(M.has('weak'))b.weakX=Math.sin(b.t*1.6)*b.w*.34;
    if(M.has('hive')){b.hiveT-=dt;if(b.hiveT<=0){b.hiveT=Math.max(.7,1.2-stage*.02);spawnEnemy('larva',b.x+rand(-b.w/3,b.w/3),b.y+b.h/2,true);}}
    if(M.has('meteor')){b.meteorT-=dt;if(b.meteorT<=0){b.meteorT=2.2;throwRock(b);}}
    if(M.has('missile')){b.missileT-=dt;if(b.missileT<=0){b.missileT=Math.max(1.1,1.8-stage*.03);fireMissile(b);}}
    if(M.has('teleport')&&!b.fake&&b.tpNext>.1&&b.hp<=b.max*b.tpNext){b.tpNext-=.2;teleportBoss(b);}
    if(M.has('mirror')&&!b.fake){b.swapT-=dt;if(b.swapT<=0){b.swapT=6;const o=alive.find(k=>k!==b);
      if(o){const hx=b.hx;b.hx=o.hx;o.hx=hx;for(const k of [b,o]){spark(k.x,k.y,'#5ad1e6',20,220,3);k.x=k.hx;}floatText(MID*1.5,b.y-b.h/2-14,L('office-shoot.say.101'),'#5ad1e6',16);}}}
    b.y+=sp*dt;
    if(b.y+b.h/2>=LINE){gameOver(b.x,LINE);return;}
  }
}

const game={keys,WEAPONS,WDPS,GUN_LEN,MODS,ETYPES,SHAPES,BOSS_DEFS,QUIPS,MISS,OVER_T,OVER_Q,fmt,seeded,hsl2hex,wpick,bossDefFor,reset,prog,expDPS,dps,effRate,grow,power,tone,spawnEnemy,pickType,spawnInterval,spawnCrate,makeBoss,spawnBoss,allTargets,hitTest,weakPos,weakHit,damage,addBullet,fire,railShot,explode,applyMod,killEnemy,splitBoss,killBoss,breakCrate,stunPlayer,throwRock,fireMissile,teleportBoss,gameOver,spark,floatText,updateFx,update,updateBosses};
Object.defineProperties(game,{
state:{enumerable:true,get:()=>state,set:v=>{state=v}},
phase:{enumerable:true,get:()=>phase,set:v=>{phase=v}},
stage:{enumerable:true,get:()=>stage,set:v=>{stage=v}},
stageT:{enumerable:true,get:()=>stageT,set:v=>{stageT=v}},
phaseT:{enumerable:true,get:()=>phaseT,set:v=>{phaseT=v}},
score:{enumerable:true,get:()=>score,set:v=>{score=v}},
t:{enumerable:true,get:()=>t,set:v=>{t=v}},
overT:{enumerable:true,get:()=>overT,set:v=>{overT=v}},
kills:{enumerable:true,get:()=>kills,set:v=>{kills=v}},
p:{enumerable:true,get:()=>p,set:v=>{p=v}},
bullets:{enumerable:true,get:()=>bullets,set:v=>{bullets=v}},
enemies:{enumerable:true,get:()=>enemies,set:v=>{enemies=v}},
crates:{enumerable:true,get:()=>crates,set:v=>{crates=v}},
bosses:{enumerable:true,get:()=>bosses,set:v=>{bosses=v}},
hazards:{enumerable:true,get:()=>hazards,set:v=>{hazards=v}},
parts:{enumerable:true,get:()=>parts,set:v=>{parts=v}},
texts:{enumerable:true,get:()=>texts,set:v=>{texts=v}},
beams:{enumerable:true,get:()=>beams,set:v=>{beams=v}},
rings:{enumerable:true,get:()=>rings,set:v=>{rings=v}},
shake:{enumerable:true,get:()=>shake,set:v=>{shake=v}},
banner:{enumerable:true,get:()=>banner,set:v=>{banner=v}},
flash:{enumerable:true,get:()=>flash,set:v=>{flash=v}},
danger:{enumerable:true,get:()=>danger,set:v=>{danger=v}},
bossTotal:{enumerable:true,get:()=>bossTotal,set:v=>{bossTotal=v}},
curBoss:{enumerable:true,get:()=>curBoss,set:v=>{curBoss=v}},
spawnT:{enumerable:true,get:()=>spawnT,set:v=>{spawnT=v}},
crateT:{enumerable:true,get:()=>crateT,set:v=>{crateT=v}},
sinceWeapon:{enumerable:true,get:()=>sinceWeapon,set:v=>{sinceWeapon=v}},
modsTaken:{enumerable:true,get:()=>modsTaken,set:v=>{modsTaken=v}},
eliteT:{enumerable:true,get:()=>eliteT,set:v=>{eliteT=v}},
shotSfxT:{enumerable:true,get:()=>shotSfxT,set:v=>{shotSfxT=v}},
quipT:{enumerable:true,get:()=>quipT,set:v=>{quipT=v}},
critT:{enumerable:true,get:()=>critT,set:v=>{critT=v}},
overTitle:{enumerable:true,get:()=>overTitle,set:v=>{overTitle=v}},
overQuip:{enumerable:true,get:()=>overQuip,set:v=>{overQuip=v}},
dead:{enumerable:true,get:()=>state==='over'}
});
return game;
}
function create(random){const game=createGame(random);game.state='play';return game;}
function input(game,code){
 if(game.dead||!Number.isInteger(code)||code<0||code>=inputCount)return false;
 if(code<=4500)game.p.tx=code/TARGET_SCALE;
 else if(code===KEY_LEFT_DOWN)game.keys.left=true;
 else if(code===KEY_LEFT_UP)game.keys.left=false;
 else if(code===KEY_RIGHT_DOWN)game.keys.right=true;
 else if(code===KEY_RIGHT_UP)game.keys.right=false;
 else game.keys.left=game.keys.right=false;
 return true;
}
return {rulesVersion,inputCount,TARGET_SCALE,KEY_LEFT_DOWN,KEY_LEFT_UP,KEY_RIGHT_DOWN,KEY_RIGHT_UP,CLEAR,
 createGame,create,input,advance:(game,dt)=>game.update(dt),score:game=>game.score};
})();
if(typeof module!=='undefined')module.exports=officeShootRules;
