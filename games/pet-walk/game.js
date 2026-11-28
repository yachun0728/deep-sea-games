  /* ---------- Pet Walkies: one-input auto-walk; fixed BONUS +1 per finished 20-step segment (max 3 per trip) ---------- */
  var petBusy=false,petStake=0,petSay=function(){};
  (function(){
'use strict';
/* ====================== CONFIG ====================== */
const CONFIG={
  stepsPerTrip:60, terrainSteps:20, gapMin:3, gapMax:6, firstGap:2,
  holdInterval:0.24, stepAnim:0.15, rareChance:0.08,
  eventLock:0.45, eventAuto:8.0,
  wheelPrep:0.35, wheelSpeed:640, wheelAuto:6, wheelStop:1.3, wheelPause:0.25, wheelShow:0.85, wheelAgain:0.4,
  againMax:2, rainbowSpins:3, rainbowMult:1.6, newEntryBonus:5,
  diaryLock:0.45, memoryShow:2.5, goodMin:27, okMin:18, itemMax:99
};
const W=400,H=844;
var analytics=null,earned=0,paid={},STEPS_PER_SEG=20;

/* ====================== DATA ====================== */
const T=s=>{const i=s.indexOf('|');return{zh:s.slice(0,i),en:s.slice(i+1)};};
const ITEMS=[
  {id:'itm_can',  n:T('{{tb:pet-walk.say.001}}'),  ab:T('{{tb:pet-walk.say.002}}'),s:1},
  {id:'itm_wood', n:T('{{tb:pet-walk.say.003}}'), ab:T('{{tb:pet-walk.say.004}}'),s:1},
  {id:'itm_stone',n:T('{{tb:pet-walk.say.005}}'),ab:T('{{tb:pet-walk.say.006}}'),s:1},
  {id:'itm_scrap',n:T('{{tb:pet-walk.say.007}}'),ab:T('{{tb:pet-walk.say.008}}'),s:1},
  {id:'itm_cloth',n:T('{{tb:pet-walk.say.009}}'),ab:T('{{tb:pet-walk.say.010}}'),s:1},
  {id:'itm_fish', n:T('{{tb:pet-walk.say.011}}'), ab:T('{{tb:pet-walk.say.012}}'),s:1},
  {id:'itm_rope', n:T('{{tb:pet-walk.say.013}}'), ab:T('{{tb:pet-walk.say.014}}'),s:3},
  {id:'itm_battery',n:T('{{tb:pet-walk.say.015}}'),ab:T('{{tb:pet-walk.say.016}}'),s:3},
  {id:'itm_ore',  n:T('{{tb:pet-walk.say.017}}'),  ab:T('{{tb:pet-walk.say.018}}'),s:3},
  {id:'itm_ai_word',n:T('{{tb:pet-walk.say.019}}'),ab:T('{{tb:pet-walk.say.020}}'),s:10}
];
const ITEM={};ITEMS.forEach((o,i)=>{o.idx=i;ITEM[o.id]=o;});
const IN=id=>ITEM[id].n;
const GEN_NO_CAN=['itm_wood','itm_stone','itm_scrap','itm_cloth','itm_fish'];
const MATS=['itm_wood','itm_stone','itm_scrap','itm_cloth'];
const UNCOMMON=['itm_rope','itm_battery','itm_ore'];

const TERR=['plains','water','mountain'];
const TERR_NAME={plains:T('{{tb:pet-walk.say.021}}'),water:T('{{tb:pet-walk.say.022}}'),mountain:T('{{tb:pet-walk.say.023}}')};
const TERR_STYLE={
  plains:{sky:'#3a424a',gnd:'#59616a',sil:'#2f353c'},
  water:{sky:'#34434d',gnd:'#46606f',sil:'#2a3640'},
  mountain:{sky:'#3d3a44',gnd:'#5d5964',sil:'#2e2b34'}
};
const POOLS={
  plains:{E01:22,E02:18,E03:12,E04:12,E05:8,E11:14,E12:14},
  water:{E01:22,E02:8,E06:16,E07:16,E08:12,E11:13,E12:13},
  mountain:{E01:22,E02:12,E09:18,E10:18,E11:15,E12:15}
};
const EVT={
 E01:{n:T('{{tb:pet-walk.say.024}}'),d:[T('{{tb:pet-walk.say.025}}')],q:[T('{{tb:pet-walk.say.026}}')],
  rd:T('{{tb:pet-walk.say.027}}'),rq:T('{{tb:pet-walk.say.028}}'),
  dia:T('{{tb:pet-walk.say.029}}'),mem:T('{{tb:pet-walk.say.030}}')},
 E02:{n:T('{{tb:pet-walk.say.031}}'),d:[T('{{tb:pet-walk.say.032}}')],q:[T('{{tb:pet-walk.say.033}}')],
  rd:T('{{tb:pet-walk.say.034}}'),rq:T('{{tb:pet-walk.say.035}}'),
  dia:T('{{tb:pet-walk.say.036}}'),mem:T('{{tb:pet-walk.say.037}}')},
 E03:{n:T('{{tb:pet-walk.say.038}}'),d:[T('{{tb:pet-walk.say.039}}')],q:[T('{{tb:pet-walk.say.040}}')],
  rd:T('{{tb:pet-walk.say.041}}'),rq:T('{{tb:pet-walk.say.042}}'),
  dia:T('{{tb:pet-walk.say.043}}'),mem:T('{{tb:pet-walk.say.044}}')},
 E04:{n:T('{{tb:pet-walk.say.045}}'),d:[T('{{tb:pet-walk.say.046}}')],q:[T('{{tb:pet-walk.say.047}}'),T('{{tb:pet-walk.say.048}}')],
  rd:T('{{tb:pet-walk.say.049}}'),rq:T('{{tb:pet-walk.say.050}}'),
  dia:T('{{tb:pet-walk.say.051}}'),mem:T('{{tb:pet-walk.say.052}}')},
 E05:{n:T('{{tb:pet-walk.say.053}}'),d:[T('{{tb:pet-walk.say.054}}')],q:[T('{{tb:pet-walk.say.055}}')],
  rd:T('{{tb:pet-walk.say.056}}'),rq:T('{{tb:pet-walk.say.057}}'),
  dia:T('{{tb:pet-walk.say.058}}'),mem:T('{{tb:pet-walk.say.059}}')},
 E06:{n:T('{{tb:pet-walk.say.060}}'),d:[T('{{tb:pet-walk.say.061}}')],q:[T('{{tb:pet-walk.say.062}}'),T('{{tb:pet-walk.say.063}}')],
  rd:T('{{tb:pet-walk.say.064}}'),rq:T('{{tb:pet-walk.say.065}}'),
  dia:T('{{tb:pet-walk.say.066}}'),mem:T('{{tb:pet-walk.say.067}}')},
 E07:{n:T('{{tb:pet-walk.say.068}}'),d:[T('{{tb:pet-walk.say.069}}')],q:[T('{{tb:pet-walk.say.070}}')],
  rd:T('{{tb:pet-walk.say.071}}'),rq:T('{{tb:pet-walk.say.072}}'),
  dia:T('{{tb:pet-walk.say.073}}'),mem:T('{{tb:pet-walk.say.074}}')},
 E08:{n:T('{{tb:pet-walk.say.075}}'),d:[T('{{tb:pet-walk.say.076}}')],q:[T('{{tb:pet-walk.say.077}}')],
  rd:T('{{tb:pet-walk.say.078}}'),rq:T('{{tb:pet-walk.say.079}}'),
  dia:T('{{tb:pet-walk.say.080}}'),mem:T('{{tb:pet-walk.say.081}}')},
 E09:{n:T('{{tb:pet-walk.say.082}}'),d:[T('{{tb:pet-walk.say.083}}')],q:[T('{{tb:pet-walk.say.084}}')],
  rd:T('{{tb:pet-walk.say.085}}'),rq:T('{{tb:pet-walk.say.086}}'),
  dia:T('{{tb:pet-walk.say.087}}'),mem:T('{{tb:pet-walk.say.088}}')},
 E10:{n:T('{{tb:pet-walk.say.089}}'),d:[T('{{tb:pet-walk.say.090}}')],q:[T('{{tb:pet-walk.say.091}}')],
  rd:T('{{tb:pet-walk.say.092}}'),rq:T('{{tb:pet-walk.say.093}}'),
  dia:T('{{tb:pet-walk.say.094}}'),mem:T('{{tb:pet-walk.say.095}}')},
 E11:{n:T('{{tb:pet-walk.say.096}}'),d:[T('{{tb:pet-walk.say.097}}'),T('{{tb:pet-walk.say.098}}'),T('{{tb:pet-walk.say.099}}')],
  q:[T('{{tb:pet-walk.say.100}}'),T('{{tb:pet-walk.say.101}}'),T('{{tb:pet-walk.say.102}}')],
  rd:T('{{tb:pet-walk.say.103}}'),rq:T('{{tb:pet-walk.say.104}}'),
  dia:T('{{tb:pet-walk.say.105}}'),mem:T('{{tb:pet-walk.say.106}}')},
 E12:{n:T('{{tb:pet-walk.say.107}}'),d:[T('{{tb:pet-walk.say.108}}'),T('{{tb:pet-walk.say.109}}')],
  q:[T('{{tb:pet-walk.say.110}}'),T('{{tb:pet-walk.say.111}}')],
  rd:T('{{tb:pet-walk.say.112}}'),rq:T('{{tb:pet-walk.say.113}}'),
  dia:T('{{tb:pet-walk.say.114}}'),mem:T('{{tb:pet-walk.say.115}}')}
};
const EVENT_IDS=Object.keys(EVT);

const CELLS=[
  {w:20,lab:T('{{tb:pet-walk.say.116}}'),col:'#59616a'},
  {w:25,lab:T('{{tb:pet-walk.say.117}}'),col:'#6b747d'},
  {w:10,lab:T('{{tb:pet-walk.say.118}}'),col:'#59616a'},
  {w:12,lab:T('{{tb:pet-walk.say.119}}'),col:'#6b747d'},
  {w:10,lab:T('{{tb:pet-walk.say.120}}'),col:'#59616a'},
  {w:15,lab:T('{{tb:pet-walk.say.121}}'),col:'#6b747d'},
  {w:6, lab:T('{{tb:pet-walk.say.122}}'),col:'#59616a'},
  {w:2, lab:T('{{tb:pet-walk.say.123}}'),col:'#f2a93b'}
];
const BOOST_CELLS=[0,1,2,3,7];
const QUIPS=[T('{{tb:pet-walk.say.124}}'),T('{{tb:pet-walk.say.125}}'),T('{{tb:pet-walk.say.126}}')];
const DIARY1=[T('{{tb:pet-walk.say.127}}'),T('{{tb:pet-walk.say.128}}'),T('{{tb:pet-walk.say.129}}')];
const DIARY3=[T('{{tb:pet-walk.say.130}}'),T('{{tb:pet-walk.say.131}}'),T('{{tb:pet-walk.say.132}}')];
const TX={
  title:T('{{tb:pet-walk.say.133}}'),
  sub:T('{{tb:pet-walk.say.134}}'),
  start:T('{{tb:pet-walk.say.135}}'),again2:T('{{tb:pet-walk.say.136}}'),
  best:T('{{tb:pet-walk.say.137}}'),score:T('{{tb:pet-walk.say.138}}'),
  dex:T('{{tb:pet-walk.say.139}}'),back:T('{{tb:pet-walk.say.140}}'),save:T('{{tb:pet-walk.say.141}}'),
  diaryTitle:T('{{tb:pet-walk.say.142}}'),loot:T('{{tb:pet-walk.say.143}}'),newEntries:T('{{tb:pet-walk.say.144}}'),
  total:T('{{tb:pet-walk.say.145}}'),newBest:T('NEW BEST!|NEW BEST!'),newTag:T('{{tb:pet-walk.say.146}}'),rare:T('{{tb:pet-walk.say.147}}'),
  tapStop:T('{{tb:pet-walk.say.148}}'),perfect:T('{{tb:pet-walk.say.149}}'),
  spinAgain:T('{{tb:pet-walk.say.150}}'),ahead:T('{{tb:pet-walk.say.151}}'),
  got:T('{{tb:pet-walk.say.152}}'),lost:T('{{tb:pet-walk.say.153}}'),shark:T('{{tb:pet-walk.say.154}}'),
  gave:T('{{tb:pet-walk.say.155}}'),nothing:T('{{tb:pet-walk.say.156}}'),
  finale:T('{{tb:pet-walk.say.157}}'),
  charm:T('{{tb:pet-walk.say.158}}'),
  rainbow:T('{{tb:pet-walk.say.159}}'),
  hint:T('{{tb:pet-walk.say.160}}'),
  tapCont:T('{{tb:pet-walk.say.161}}'),
  unknown:T('？？？|???'),dexTitle:T('{{tb:pet-walk.say.162}}'),
  dexTip:T('{{tb:pet-walk.say.163}}'),
  footer:T('{{tb:pet-walk.say.164}}'),
  homeSign:T('{{tb:pet-walk.say.165}}')
};

/* ====================== RNG ====================== */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
let seed=Date.now()>>>0;
try{const m=/[?&]seed=(-?\d+)/.exec(location.search);if(m)seed=parseInt(m[1],10)>>>0;}catch(e){}
let rng=mulberry32(seed);
const crng=mulberry32((seed^0x9e3779b9)>>>0);
const rint=(a,b)=>a+Math.floor(rng()*(b-a+1));
const pick=arr=>arr[Math.floor(rng()*arr.length)];
function pickW(ws){let s=0;for(const w of ws)s+=w;let r=rng()*s;for(let i=0;i<ws.length;i++){r-=ws[i];if(r<0&&ws[i]>0)return i;}for(let i=ws.length-1;i>=0;i--)if(ws[i]>0)return i;return 0;}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

/* ====================== SAVE ====================== */
function defaultSave(){return{best:0,trips:0,inv:{},dexEvents:{},dexItems:{},lastEvent:null,version:3};}
const SAVE_KEY='deep-sea-pet-walk-save';
function loadSave(){
  try{
    const o=JSON.parse(localStorage.getItem(SAVE_KEY));
    if(o&&typeof o==='object'&&o.version===3){
      const s=Object.assign(defaultSave(),o);
      if(typeof s.inv!=='object'||!s.inv)s.inv={};
      if(typeof s.dexEvents!=='object'||!s.dexEvents)s.dexEvents={};
      if(typeof s.dexItems!=='object'||!s.dexItems)s.dexItems={};
      s.best=Math.max(0,Math.floor(+s.best)||0);s.trips=Math.max(0,Math.floor(+s.trips)||0);
      return s;
    }
  }catch(e){}
  return defaultSave();
}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(G.save));}catch(e){}}

/* ====================== STATE ====================== */
const G={
  mode:'TITLE',save:loadSave(),lang:'zh',trip:null,ev:null,wheel:null,bubble:null,
  step:null,scrollPx:0,hold:false,holdT:0,time:0,dexReturn:'TITLE',diary:null,diaryLock:0,
  flights:[],bump:{},rainbow:0,flash:0,bounce:0,shock:0,dizzy:0,stars:[],terrFlash:0,pinkAnt:0,
  hintSteps:0,dexSelected:null,shake:0,combo:0,floatTexts:[]
};
syncLang();
const L=o=>o[G.lang];
function syncLang(){G.lang=(window.deepSeaI18n&&window.deepSeaI18n.getLanguage()==='en')?'en':'zh';}
const tf=(o,p)=>L(o).replace(/\{(\w+)\}/g,(m,k)=>p[k]);
const terrNow=()=>G.trip?TERR[Math.min(2,Math.floor(G.trip.steps/CONFIG.terrainSteps))]:'plains';
const invOf=id=>G.save.inv[id]||0;

function addFloatText(text,x,y,col){
  G.floatTexts.push({text,x,y,col:col||'#f2a93b',t:0});
}

/* ====================== TRIP ====================== */
function startTrip(){
  const t={
    steps:0,loot:0,newCount:0,terr:shuffle(TERR),countdown:0,events:[],evIdx:0,
    prev:null,noWheelNext:false,next7:false,sharkReturnSteps:0
  };
  t.countdown=G.save.trips===0?CONFIG.firstGap:rint(CONFIG.gapMin,CONFIG.gapMax);
  G.trip=t;G.mode='WALK';G.ev=null;G.wheel=null;G.step=null;G.hold=false;G.holdT=0;
  G.bubble=null;G.flights=[];G.hintSteps=0;G.pinkAnt=0;G.combo=0;G.floatTexts=[];
  if(invOf('itm_ai_word')>=3){ // 物資用途：3 個 AI 字詞碎片換下一趟前 3 次轉盤的好運（不給點數）
    G.save.inv.itm_ai_word-=3;G.rainbow=CONFIG.rainbowSpins;persist();
    addFloatText(L(TX.charm),200,150,'#4fd1c5');
  }
  if(G.save.lastEvent&&EVT[G.save.lastEvent]){
    G.bubble={key:'mem',evId:G.save.lastEvent,life:CONFIG.memoryShow};
  }
}
function terrAt(){return G.trip.terr[Math.min(2,Math.floor(G.trip.steps/CONFIG.terrainSteps))];}
function doStep(){
  if(G.mode!=='WALK'||G.step)return;
  G.step={t:0};G.holdT=0;
}
function completeStep(){
  const t=G.trip;G.step=null;t.steps++;t.countdown--;
  if(G.hold)G.combo++;else G.combo=0;
  if(t.steps%STEPS_PER_SEG===0)segmentDone(t.steps/STEPS_PER_SEG,t);

  if(t.steps%CONFIG.terrainSteps===0&&t.steps<CONFIG.stepsPerTrip){
    G.terrFlash=0.6;
    addFloatText(L(TERR_NAME[terrAt()]),200,180,'#fff');
  }
  G.hintSteps++;

  // 河鯊路上還魚演出（不再塞進下一個事件）
  if(t.sharkReturnSteps>0){
    t.sharkReturnSteps--;
    if(t.sharkReturnSteps===0){
      if(rng()<0.65){
        const g={};addItem('itm_fish',1,null,g);spawnFlights(g);
        G.bubble={key:'quip',text:L(TX.shark),life:2.6};
        addFloatText('+1 '+L(IN('itm_fish')),130,310,'#4fd1c5');
      }
    }
  }

  if(t.countdown<=0&&t.steps<CONFIG.stepsPerTrip){triggerEvent();return;}
  if(t.steps>=CONFIG.stepsPerTrip){
    // 終點：到家門口再轉一次轉盤（只給物資，不給點數），之後才寫日記
    if(!t.finale){t.finale=true;G.force='E01';G.forceRare=false;triggerEvent();return;}
    endTrip();
  }
}

/* ====================== ITEMS ====================== */
function addItem(id,n,ev,gains){
  const t=G.trip,it=ITEM[id];
  G.save.inv[id]=Math.min(CONFIG.itemMax,invOf(id)+n);
  t.loot+=it.s*n;if(ev)ev.loot+=it.s*n;
  gains[id]=(gains[id]||0)+n;
  if(!G.save.dexItems[id]){G.save.dexItems[id]=true;t.newCount++;}
  if(it.s>=10){G.flash=0.35;G.bounce=0.45;G.shake=0.3;}
}
function gainLine(g){
  const parts=Object.keys(g).map(id=>L(IN(id))+' ×'+g[id]);
  return tf(TX.got,{x:parts.join(G.lang==='zh'?'、':', ')});
}
function spawnFlights(g){
  for(const id of Object.keys(g))G.flights.push({id,t:0});
}

/* ====================== EVENTS ====================== */
function chooseEvent(){
  const t=G.trip,first=G.save.trips===0;
  if(G.force){const f=G.force;G.force=null;return f;}
  if(first&&t.evIdx===0)return'E02';
  if(first&&t.evIdx===1)return'E01';
  const pool=Object.assign({},POOLS[terrAt()]);
  let p=pool;
  if(t.prev&&p[t.prev]!==undefined){const c=Object.assign({},p);delete c[t.prev];if(Object.keys(c).length)p=c;}
  if(t.noWheelNext){const c=Object.assign({},p);delete c.E01;delete c.E07;if(Object.keys(c).length)p=c;}
  const ids=Object.keys(p);
  return ids[pickW(ids.map(i=>p[i]))];
}

function triggerEvent(){
  const t=G.trip,id=chooseEvent();
  const rare=G.forceRare!==undefined?G.forceRare:rng()<CONFIG.rareChance;G.forceRare=undefined;
  t.noWheelNext=false;
  const ev={id,rare,t:0,lines:[],gains:{},variant:0,wheel:false,phase:'card',loot:0,isNew:false,storm:false,stage:0,choices:null};
  if(t.finale)ev.finale=true;
  G.ev=ev;G.mode='EVENT';G.hold=false;G.step=null;
  const de=G.save.dexEvents[id]||(G.save.dexEvents[id]={n:0,r:0});
  const k=rare?'r':'n';
  if(!de[k]){ev.isNew=true;t.newCount++;}
  de[k]=(de[k]||0)+1;

  const g=ev.gains;
  switch(id){
    case'E01':ev.wheel=true;break;
    case'E02':
      addItem('itm_can',1,ev,g);addItem(pick(GEN_NO_CAN),1,ev,g);
      ev.lines.push(gainLine(g));
      break;
    case'E03':
      // 二選一：用頭撞 vs 用繩索撬開
      ev.phase='choice';
      ev.choices=[
        {id:'ram', label:T('{{tb:pet-walk.say.166}}'), enabled:true, def:true},
        {id:'pry', label:T('{{tb:pet-walk.say.167}}'), enabled:invOf('itm_rope')>0}
      ];
      break;
    case'E04':
      // 二選一：餵罐頭換轉盤 vs 一起吠
      ev.phase='choice';
      ev.choices=[
        {id:'feed', label:T('{{tb:pet-walk.say.168}}'), enabled:invOf('itm_can')>0},
        {id:'bark', label:T('{{tb:pet-walk.say.169}}') , enabled:true, def:true}
      ];
      break;
    case'E05':
      addItem('itm_battery',1,ev,g);
      ev.lines.push(gainLine(g));
      if(rare)G.pinkAnt=999; // 持續整趟出門！
      break;
    case'E06':
      G.shock=0.6;G.shake=0.25;
      if(invOf('itm_fish')>0){
        G.save.inv.itm_fish=invOf('itm_fish')-1;t.sharkReturnSteps=rint(3,5);
        ev.lines.push(tf(TX.lost,{x:L(IN('itm_fish'))+' ×1'}));
      }else{
        ev.variant=1;ev.lines.push(L(TX.nothing));
      }
      break;
    case'E07':
      // 二選一：小心打開(轉盤) vs 用力踹開(直接拿材料)
      ev.phase='choice';
      ev.choices=[
        {id:'open', label:T('{{tb:pet-walk.say.170}}'), enabled:true, def:true},
        {id:'kick', label:T('{{tb:pet-walk.say.171}}'), enabled:true}
      ];
      break;
    case'E08':
      if(rng()<0.5)addItem('itm_fish',2,ev,g);else addItem('itm_rope',1,ev,g);
      ev.lines.push(gainLine(g));
      break;
    case'E09':addItem('itm_ore',2,ev,g);ev.lines.push(gainLine(g));break;
    case'E10':
      addItem('itm_stone',2,ev,g);
      G.dizzy=0.7;G.shake=0.25;ev.lines.push(gainLine(g));
      break;
    case'E11':ev.variant=rint(0,2);ev.lines.push(L(TX.nothing));break;
    case'E12':ev.storm=rng()<0.3;G.rainbow=CONFIG.rainbowSpins;ev.lines.push(L(TX.rainbow));break;
  }
  if(ev.phase==='card'){
    if(ev.lines.length===0&&!ev.wheel)ev.lines.push(L(TX.nothing));
    spawnFlights(g);
  }
  setQuote(ev);
}

function resolveChoice(idx){
  const ev=G.ev,t=G.trip;
  if(!ev||ev.phase!=='choice'||!ev.choices)return;
  const ch=ev.choices[idx];
  if(!ch||!ch.enabled)return;
  const g=ev.gains;
  ev.phase='card';ev.t=0.3;

  if(ev.id==='E03'){
    if(ch.id==='ram'){
      G.shake=0.2;G.dizzy=0.4;
      addItem(pick(UNCOMMON),1,ev,g);
      ev.lines.push(gainLine(g));
    }else if(ch.id==='pry'){
      if(invOf('itm_rope')>0)G.save.inv.itm_rope--;
      addItem(pick(UNCOMMON),1,ev,g);
      if(rng()<0.35)addItem('itm_ai_word',1,ev,g);
      else addItem('itm_ore',1,ev,g);
      ev.lines.push(gainLine(g));
    }
  }else if(ev.id==='E04'){
    if(ch.id==='feed'){
      G.save.inv.itm_can=invOf('itm_can')-1;
      ev.wheel=true;
      ev.lines.push(L(TX.gave));
    }else if(ch.id==='bark'){
      G.shake=0.2;
      if(rng()<0.55){
        addItem(pick(MATS),2,ev,g);
        ev.lines.push(L(T('{{tb:pet-walk.say.172}}')));
        ev.lines.push(gainLine(g));
      }else{
        ev.variant=1;
        ev.lines.push(L(T('{{tb:pet-walk.say.173}}')));
      }
    }
  }else if(ev.id==='E07'){
    if(ch.id==='open'){
      ev.wheel=true;
    }else if(ch.id==='kick'){
      G.shake=0.25;
      addItem(pick(MATS),2,ev,g);
      if(rng()<0.5)addItem('itm_scrap',1,ev,g);
      ev.lines.push(gainLine(g));
    }
  }
  spawnFlights(g);
}

function evDesc(ev){const e=EVT[ev.id];if(ev.finale)return L(TX.finale);if(ev.rare)return L(e.rd);if(ev.id==='E11')return L(e.d[ev.variant]);if(ev.id==='E12')return L(e.d[ev.storm?1:0]);return L(e.d[0]);}
function evQuoteObj(ev){const e=EVT[ev.id];if(ev.rare)return e.rq;if(ev.id==='E11')return e.q[ev.variant];if(ev.id==='E04'||ev.id==='E06')return e.q[ev.variant];if(ev.id==='E12')return e.q[ev.stage];return e.q[0];}
function setQuote(ev){G.bubble={key:'ev',text:null,evRef:ev,life:99};}
function dismissEvent(){
  const ev=G.ev;if(!ev||G.mode!=='EVENT'||ev.t<CONFIG.eventLock)return;
  if(ev.phase==='choice'){ // 二選一：空白鍵或閒置逾時＝選預設（免費）選項，避免鍵盤玩家卡死
    const di=ev.choices.findIndex(c=>c.def&&c.enabled);resolveChoice(di>=0?di:ev.choices.findIndex(c=>c.enabled));return;
  }
  if(ev.phase==='card'&&ev.wheel){startWheel();return;}
  endEvent();
}
function endEvent(){
  const t=G.trip,ev=G.ev;
  t.events.push({id:ev.id,loot:ev.loot});
  t.prev=ev.id;t.evIdx++;
  t.countdown=t.next7?1:rint(CONFIG.gapMin,CONFIG.gapMax);
  t.noWheelNext=t.next7;t.next7=false;
  G.ev=null;G.mode='WALK';G.bubble=null;G.hold=false;G.holdT=0;
  persist();
  if(t.steps>=CONFIG.stepsPerTrip)endTrip();
}

/* ====================== WHEEL ====================== */
function startWheel(){
  G.mode='WHEEL';G.bubble=null;G.hold=false;
  G.wheel={phase:'prep',t:0,R:crng()*360,again:0,boosted:G.rainbow>0,perfect:false,cell:-1,from:0,delta:0,msg:'',spin:0,gains:{},quip:null};
}
function drawCellIdx(w){
  const ws=CELLS.map((c,i)=>{
    let x=c.w;
    if((w.boosted||w.perfect)&&BOOST_CELLS.indexOf(i)>=0)x*=CONFIG.rainbowMult;
    if(w.perfect&&i===7)x*=2.0; // 完美時機AI碎片機率倍增
    if(i===4&&w.again>=CONFIG.againMax)x=0;
    return x;
  });
  return pickW(ws);
}
function stopWheel(){
  const w=G.wheel;if(!w||w.phase!=='spin')return;
  // 判斷是否抓到「完美時機」（指針閃爍綠區：每0.9秒出現一次0.25秒黃金窗口）
  const cycle=w.t%0.9;
  if(cycle>=0.55&&cycle<=0.82){
    w.perfect=true;
    G.flash=0.25;G.shake=0.15;
  }
  const i=drawCellIdx(w);w.cell=i;
  const off=(rng()*26)-13;
  const target=-(45*i+22.5+off);
  const mod=(a,b)=>((a%b)+b)%b;
  w.from=w.R;w.delta=720+mod(target-w.R,360);
  w.phase='stop';w.t=0;
}
function applyWheelCell(w){
  const ev=G.ev,i=w.cell,g={};
  switch(i){
    case 0:addItem('itm_can',1,ev,g);break;
    case 1:addItem(pick(MATS),3,ev,g);break;
    case 2:addItem('itm_battery',1,ev,g);break;
    case 3:addItem('itm_fish',2,ev,g);break;
    case 5:w.quip=pick(QUIPS);break;
    case 6:G.trip.next7=true;break;
    case 7:addItem('itm_ai_word',1,ev,g);
      for(let k=0;k<12;k++){const a=k/12*Math.PI*2;G.stars.push({a,t:0});}
      break;
  }
  w.gains=g;
  let line;
  if(i===5)line=L(TX.nothing);else if(i===6)line=L(TX.ahead);else line=gainLine(g);
  w.msg=line;
  if(w.boosted)G.rainbow=Math.max(0,G.rainbow-1);
}
function finishWheel(){
  const w=G.wheel,ev=G.ev;
  ev.lines.push(w.msg);
  ev.phase='result';ev.t=0;
  if(w.cell===5&&w.quip)G.bubble={key:'quip',text:L(w.quip),life:2.5};
  else G.bubble={key:'ev',evRef:ev,life:99};
  spawnFlights(w.gains);
  G.mode='EVENT';G.wheel=null;
}
function updateWheel(dt){
  const w=G.wheel;w.t+=dt;
  if(w.phase==='prep'){if(w.t>=CONFIG.wheelPrep){w.phase='spin';w.t=0;}}
  else if(w.phase==='spin'){w.R=(w.R+CONFIG.wheelSpeed*dt)%360;if(w.t>=CONFIG.wheelAuto)stopWheel();}
  else if(w.phase==='stop'){
    const p=Math.min(1,w.t/CONFIG.wheelStop),e=1-Math.pow(1-p,3);
    w.R=w.from+w.delta*e;
    if(p>=1){w.R=w.from+w.delta;w.phase='pause';w.t=0;}
  }else if(w.phase==='pause'){
    if(w.t>=CONFIG.wheelPause){
      if(w.cell===4){w.phase='again';w.t=0;w.again++;w.perfect=false;}
      else{applyWheelCell(w);w.phase='show';w.t=0;}
    }
  }else if(w.phase==='again'){
    if(w.t>=CONFIG.wheelAgain){w.phase='spin';w.t=0;w.cell=-1;}
  }else if(w.phase==='show'){
    if(w.t>=CONFIG.wheelShow)finishWheel();
  }
}

/* ====================== DIARY ====================== */
function endTrip(){
  const t=G.trip;
  const total=t.loot+CONFIG.newEntryBonus*t.newCount;
  const newBest=total>G.save.best;
  if(newBest)G.save.best=total;
  G.save.trips++;
  let best=null,bl=-1;
  for(const e of t.events){if(e.loot>=bl){bl=e.loot;best=e;}}
  if(best)G.save.lastEvent=best.id;
  const s1=rint(0,2);
  const s3=t.loot>=CONFIG.goodMin?0:(t.loot>=CONFIG.okMin?1:2);
  G.diary={s1,ev:best?best.id:null,s3,loot:t.loot,k:t.newCount,total,newBest};
  G.mode='DIARY';G.diaryLock=CONFIG.diaryLock;G.ev=null;G.wheel=null;G.bubble=null;G.hold=false;
  persist();
  finishTrip(total);
}
function diaryLines(d){
  const a=[L(DIARY1[d.s1])];
  if(d.ev)a.push(L(EVT[d.ev].dia));
  a.push(L(DIARY3[d.s3]));
  return a;
}

/* ====================== INPUT ====================== */
const BTN={
  title:{dex:[100,770,200,68]},
  event:{c0:[16,772,176,68],c1:[208,772,176,68]},
  diary:{dex:[28,750,164,68],save:[208,750,164,68]},
  dex:{back:[100,770,200,68],modalClose:[100,521,200,68]}
};
const hit=(r,p)=>p.x>=r[0]&&p.x<=r[0]+r[2]&&p.y>=r[1]&&p.y<=r[1]+r[3];

function press(p){
  if(!feltReady()){if(feltErrors.size){feltStarted=false;feltErrors.clear();feltAttempt++;loadFelt();}return;}
  switch(G.mode){
    case'TITLE':
      if(p&&hit(BTN.title.dex,p)){G.dexReturn='TITLE';G.dexSelected=null;G.mode='DEX';}
      return;
    case'WALK':
      if(G.bubble&&G.bubble.key==='mem')G.bubble.life=Math.min(G.bubble.life,0.25);
      G.hold=true;G.holdT=0;doStep();return;
    case'EVENT':
      if(G.ev&&G.ev.phase==='choice'&&p){
        if(hit(BTN.event.c0,p)){resolveChoice(0);return;}
        if(hit(BTN.event.c1,p)){resolveChoice(1);return;}
        return;
      }
      dismissEvent();return;
    case'WHEEL':stopWheel();return;
    case'DIARY':
      if(G.diaryLock>0||!p)return;
      if(hit(BTN.diary.dex,p)){G.dexReturn='DIARY';G.dexSelected=null;G.mode='DEX';return;}
      if(hit(BTN.diary.save,p)){saveImage();return;}
      return;
    case'DEX':
      if(!p){if(G.dexSelected)G.dexSelected=null;else G.mode=G.dexReturn;return;}
      if(G.dexSelected){G.dexSelected=null;return;}
      if(hit(BTN.dex.back,p)){G.mode=G.dexReturn;return;}
      EVENT_IDS.forEach((id,i)=>{
        const y=204+i*35;
        if(p.x>=20&&p.x<=380&&p.y>=y&&p.y<=y+35){
          const de=G.save.dexEvents[id]||{};
          if(de.n>0||de.r>0)G.dexSelected=id;
        }
      });
      return;
  }
}
function release(){G.hold=false;G.combo=0;}
const cv=$('pw-canvas');
const mainCtx=cv.getContext('2d');
let ctx=mainCtx;
const DPR=Math.min(2,window.devicePixelRatio||1);
cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);
function toLogical(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
function pwShown(){return !$v.hidden&&!document.hidden;}
cv.addEventListener('pointerdown',e=>{if(!pwShown())return;if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();try{cv.focus();}catch(x){}press(toLogical(e));});
window.addEventListener('pointerup',release);
window.addEventListener('pointercancel',release);
window.addEventListener('keydown',e=>{
  if(!pwShown()||e.metaKey||e.altKey||e.ctrlKey)return;
  if(['INPUT','BUTTON','A','SUMMARY'].indexOf(e.target.tagName)>=0)return;
  if(e.code==='Space'||e.key===' '){e.preventDefault();if(!e.repeat)press(null);}
});
window.addEventListener('keyup',e=>{if(e.code==='Space'||e.key===' ')release();});
window.addEventListener('blur',()=>{G.hold=false;});
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('touchstart',e=>e.preventDefault(),{passive:false});
cv.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});

/* ====================== UPDATE ====================== */
function update(dt){
  G.time+=dt;
  if(G.terrFlash>0)G.terrFlash-=dt;
  if(G.flash>0)G.flash-=dt;
  if(G.bounce>0)G.bounce-=dt;
  if(G.shock>0)G.shock-=dt;
  if(G.dizzy>0)G.dizzy-=dt;
  if(G.shake>0)G.shake-=dt;
  if(G.pinkAnt>0)G.pinkAnt-=dt;
  for(const k in G.bump)if(G.bump[k]>0)G.bump[k]-=dt;
  for(const f of G.flights){f.t+=dt;if(f.t>=0.45&&!f.done){f.done=true;G.bump[f.id]=0.25;}}
  G.flights=G.flights.filter(f=>f.t<0.45);
  for(const ft of G.floatTexts)ft.t+=dt;
  G.floatTexts=G.floatTexts.filter(ft=>ft.t<1.1);
  for(const s of G.stars)s.t+=dt;
  G.stars=G.stars.filter(s=>s.t<0.6);
  if(G.bubble&&G.bubble.key!=='ev'){G.bubble.life-=dt;if(G.bubble.life<=0)G.bubble=null;}

  switch(G.mode){
    case'WALK':
      if(G.hold)G.holdT+=dt;
      if(G.step){G.step.t+=dt;if(G.step.t>=CONFIG.stepAnim)completeStep();}
      else if(G.hold&&G.holdT>=CONFIG.holdInterval)doStep();
      break;
    case'EVENT':
      {const ev=G.ev;ev.t+=dt;
       if(ev.id==='E12'&&!ev.rare&&ev.t>=1.6)ev.stage=1;
       if(ev.t>=CONFIG.eventAuto)dismissEvent();}
      break;
    case'WHEEL':if(G.wheel)updateWheel(dt);break;
    case'DIARY':if(G.diaryLock>0)G.diaryLock-=dt;break;
  }
}

/* ====================== FELT ART / DRAW HELPERS ====================== */
// All illustrated parts derive from design/approved-felt-v1.png. No geometric pet fallback.
const ART_ROOT='games/pet-walk/art/felt-v1/';
const feltArt={},feltErrors=new Set(),feltPanels=new Map();
const feltFiles=['scene','plains','mountain','puppet/neutral','puppet/happy','puppet/surprised','puppet/thigh','puppet/foot','puppet/portrait','ui/panel','ui/gold','ui/cream','ui/tile','ui/diary','ui/header',...['wheel','chest','locker','dog','scarecrow','shark','crate','fisher','cave','rocks','lamp'].map(n=>'props/'+n),...ITEMS.map(it=>'items/'+it.id.slice(4)),'items/rainbow','items/flowers'];
let feltStarted=false,feltAttempt=0;
function loadFelt(){
  if(feltStarted||typeof Image==='undefined')return;feltStarted=true;
  feltFiles.forEach(key=>{const im=new Image();feltArt[key]=im;im.onload=()=>feltErrors.delete(key);im.onerror=()=>feltErrors.add(key);im.src=ART_ROOT+key+'.webp'+(feltAttempt?'?retry='+feltAttempt:'');});
}
function feltReady(){return typeof Image==='undefined'||(feltStarted&&feltFiles.every(k=>feltArt[k]&&feltArt[k].complete&&feltArt[k].naturalWidth));}
function art(key,x,y,w,h,contain=false){
  const im=feltArt[key];if(!im||!im.complete||!im.naturalWidth)return;
  if(contain){const s=Math.min(w/im.naturalWidth,h/im.naturalHeight),nw=im.naturalWidth*s,nh=im.naturalHeight*s;x+=(w-nw)/2;y+=(h-nh)/2;w=nw;h=nh;}
  ctx.drawImage(im,x,y,w,h);
}
const INK='#503824',MUTED='#765f48',GOLD='#a96816';
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function circ(x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);}
function txt(s,x,y,font,color,align){ctx.font=font;ctx.fillStyle=color||INK;ctx.textAlign=align||'left';ctx.textBaseline='alphabetic';ctx.fillText(s,x,y);}
function wrap(text,maxW){const out=[];let cur='';const words=G.lang==='en'?String(text).split(' '):Array.from(String(text));for(const word of words){const next=cur+(G.lang==='en'&&cur?' ':'')+word;if(ctx.measureText(next).width>maxW&&cur){out.push(cur);cur=word;}else cur=next;}if(cur)out.push(cur);return out;}
function lines(s,x,y,width,font='14px sans-serif',color=INK,limit=3,leading=20,align='left'){ctx.font=font;const ls=wrap(s,width).slice(0,limit);ls.forEach((l,i)=>txt(l,x,y+i*leading,font,color,align));return ls.length*leading;}
function panel(x,y,w,h){
  const im=feltArt['ui/panel'];if(!im||!im.complete||!im.naturalWidth)return;
  const key=w+'x'+h;let surface=feltPanels.get(key);
  if(!surface){
    surface=document.createElement('canvas');surface.width=Math.ceil(w*DPR);surface.height=Math.ceil(h*DPR);
    const g=surface.getContext('2d');g.scale(DPR,DPR);
    // Tile the weave and seam runs instead of stretching fibers into long vertical streaks.
    const src=94,dst=Math.min(32,w/3,h/3),scale=dst/src;
    const sx=[0,src,im.naturalWidth-src,im.naturalWidth],sy=[0,src,im.naturalHeight-src,im.naturalHeight];
    const dx=[0,dst,w-dst,w],dy=[0,dst,h-dst,h];
    for(let row=0;row<3;row++)for(let col=0;col<3;col++){
      const tw=(sx[col+1]-sx[col])*scale,th=(sy[row+1]-sy[row])*scale;
      for(let yy=dy[row];yy<dy[row+1]-.01;yy+=th)for(let xx=dx[col];xx<dx[col+1]-.01;xx+=tw){
        const dw=Math.min(tw,dx[col+1]-xx),dh=Math.min(th,dy[row+1]-yy);
        g.drawImage(im,sx[col],sy[row],dw/scale,dh/scale,xx,yy,dw,dh);
      }
    }
    feltPanels.set(key,surface);
  }
  ctx.drawImage(surface,x,y,w,h);
}

function btn(r,label,col,bg){art(bg==='cream'?'ui/cream':'ui/gold',...r);ctx.font='bold 14px sans-serif';const ls=wrap(label,r[2]-28).slice(0,2);ls.forEach((l,i)=>txt(l,r[0]+r[2]/2,r[1]+r[3]/2+5-(ls.length-1)*7.5+i*15,'bold 14px sans-serif',INK,'center'));}
function chip(x,y,size,id,alpha,count){ctx.save();ctx.globalAlpha=alpha;art('ui/tile',x,y,size,size);art('items/'+id.slice(4),x+4,y+3,size-8,size-8,true);if(count!==undefined){ctx.shadowColor='#fff5df';ctx.shadowBlur=3;txt(String(count),x+size-3,y+size-3,'bold 11px sans-serif',INK,'right');}ctx.restore();}
function drawPet(x,y,r,o={}){
  const scale=r/40;ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  const moving=G.mode==='WALK'&&G.step;
  const phase=moving?(G.trip.steps+Math.min(1,G.step.t/CONFIG.stepAnim))*Math.PI:0;
  // Two-bone wool puppet: opposite hips swing, each knee flexes on its recovery step.
  for(const [dx,offset] of [[-25,Math.PI],[24,0]]){
    const a=moving?Math.sin(phase+offset)*.64:0;
    const bend=moving?Math.max(0,Math.cos(phase+offset))*.95:0;
    ctx.save();ctx.translate(dx,-23);ctx.rotate(a);
    art('puppet/thigh',-10,0,20,15);
    ctx.translate(0,8);ctx.rotate(-bend);art('puppet/foot',-11,0,28,18);ctx.restore();
  }
  const pose=o.xeyes||G.shock>0?'surprised':(G.mode==='DIARY'||G.bounce>0?'happy':'neutral');
  ctx.save();if(moving)ctx.rotate(Math.sin(phase)*.022);
  art('puppet/'+pose,-69,-182,138,166);ctx.restore();ctx.restore();
}
function eyeColor(){return '#e6ae34';}
function drawWorld(tn,scroll){
  const im=feltArt[tn==='water'?'scene':tn];
  if(!im||!im.complete||!im.naturalWidth)return;
  // Three bands of the approved miniature move at different speeds. The trail is horizontal.
  const bands=[[0,.633,0,480,.18],[.633,.078,480,62,1],[.711,.289,542,302,1.25]];
  for(const [sy,sh,y,h,speed] of bands){
    const sourceY=im.naturalHeight*sy,sourceH=im.naturalHeight*sh;
    const tileW=im.naturalWidth/sourceH*h,offset=(scroll*speed)%tileW;
    ctx.save();ctx.beginPath();ctx.rect(0,y,W,h);ctx.clip();
    for(let x=-offset;x<W;x+=tileW)ctx.drawImage(im,0,sourceY,im.naturalWidth,sourceH,x,y,tileW,h);
    ctx.restore();
  }
}

const PROP_NAMES=['wheel','chest','locker','dog','scarecrow','shark','crate','fisher','cave','rocks','lamp','rainbow'];
function drawProp(ev){const name=PROP_NAMES[Number(ev.id.slice(1))-1];const x=284+(1-Math.min(1,ev.t/.35))*110;const size=ev.id==='E03'?99:91;art((name==='rainbow'?'items/':'props/')+name,x-size/2,518-size,size,size,true);if(ev.rare){txt('✦',x,414,'bold 26px sans-serif',GOLD,'center');}}
function petOpts(extra){return Object.assign({eye:eyeColor(),xeyes:G.dizzy>0},extra||{});}
function petPose(){return{y:518,sway:0,bend:0};}
function drawBubble(){
  const b=G.bubble;if(!b)return;let text=b.key==='ev'?L(evQuoteObj(b.evRef)):b.key==='mem'?L(EVT[b.evId].mem):b.text;if(!text)return;
  ctx.save();if(b.key!=='ev')ctx.globalAlpha=Math.min(1,b.life/.25);panel(20,242,310,85);lines(text,62,277,226,'14px sans-serif',INK,2,19);ctx.restore();
}
function drawHUD(){
  const t=G.trip;if(!t)return;
  art('ui/header',12,24,376,104);
  txt(t.steps+' / '+CONFIG.stepsPerTrip,78,62,'bold 22px sans-serif',INK);
  txt(L(TERR_NAME[terrAt()]),365,59,'bold 14px sans-serif',MUTED,'right');
  ctx.strokeStyle='#8a6a45';ctx.lineWidth=2;ctx.setLineDash([3,5]);ctx.beginPath();ctx.moveTo(54,93);ctx.lineTo(350,93);ctx.stroke();ctx.setLineDash([]);
  for(let i=0;i<4;i++){const xx=54+i*98.6;circ(xx,93,6);ctx.fillStyle=t.steps>=i*20?'#c69232':'#f3dfbd';ctx.fill();ctx.strokeStyle='#946b32';ctx.stroke();}
  for(let i=0;i<3;i++)art('items/'+['can','wood','rope'][i],210+i*39,35,30,30,true);
  art('ui/header',8,155,384,50);
  ITEMS.forEach((it,i)=>chip(17+i*37,163,33,it.id,invOf(it.id)>0?1:.45,invOf(it.id)));
  txt(tf(TX.score,{n:t.loot+CONFIG.newEntryBonus*t.newCount}),382,144,'bold 13px sans-serif',INK,'right');
}
function drawFlights(){for(const f of G.flights){const p=Math.min(1,f.t/.45),i=ITEM[f.id].idx;chip(200+(17+i*37+16-200)*p-12,600+(180-600)*p-12,24,f.id,1);}}
function drawFloatTexts(){for(const ft of G.floatTexts){ctx.save();ctx.globalAlpha=Math.max(0,1-ft.t/1.1);panel(50,180-ft.t*20,300,45);txt(ft.text,200,208-ft.t*20,'bold 14px sans-serif',INK,'center');ctx.restore();}}
function drawCard(ev){
  panel(12,530,376,238);
  txt((ev.rare?'✦ ':'')+L(EVT[ev.id].n),54,580,'bold 19px sans-serif',INK);
  if(ev.isNew)txt(L(TX.newTag),344,561,'bold 10px sans-serif',GOLD,'right');
  lines(evDesc(ev),54,609,292,'13px sans-serif',INK,3,17);
  const name=PROP_NAMES[Number(ev.id.slice(1))-1];art((name==='rainbow'?'items/':'props/')+name,52,657,70,66,true);
  if(ev.phase==='choice'&&ev.choices){ev.choices.forEach((c,i)=>{ctx.save();ctx.globalAlpha=c.enabled?1:.4;btn(i?BTN.event.c1:BTN.event.c0,L(c.label),null,i?'cream':null);ctx.restore();});}
  else{let y=680;for(const text of ev.lines.slice(0,2))y+=lines(text,136,y,204,'bold 12px sans-serif',GOLD,2,15);}
}

function drawWheel(w){
  panel(16,178,368,365);
  const cx=200,cy=376,r=120;
  txt(w.phase==='show'?w.msg:L(TX.tapStop),200,219,'bold 17px sans-serif',INK,'center');
  if(w.perfect)txt(L(TX.perfect),200,242,'bold 13px sans-serif',GOLD,'center');
  ctx.save();circ(cx,cy,123);ctx.clip();ctx.translate(cx,cy);ctx.rotate(w.R*Math.PI/180);art('props/wheel',-127,-127,254,310);ctx.restore();
  const cols=['#c08e36','#829163','#e3c9a4','#8a9b9a','#ad8965','#a19388','#c9b69b','#e0ac35'];
  for(let i=0;i<8;i++){
    const a0=(w.R+45*i-90)*Math.PI/180,a1=a0+Math.PI/4,am=a0+Math.PI/8;
    ctx.save();ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,a0,a1);ctx.closePath();ctx.clip();ctx.globalAlpha=.6;ctx.fillStyle=cols[i];ctx.fillRect(cx-r,cy-r,r*2,r*2);ctx.restore();
    ctx.save();ctx.translate(cx+Math.cos(am)*78,cy+Math.sin(am)*78);ctx.rotate(am);lines(L(CELLS[i].lab),0,4,73,'bold 10px sans-serif',INK,2,12,'center');ctx.restore();
    ctx.strokeStyle='#f2dec0';ctx.lineWidth=2;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a0)*r,cy+Math.sin(a0)*r);ctx.stroke();ctx.setLineDash([]);
  }
  circ(cx,cy,13);ctx.fillStyle='#785339';ctx.fill();txt('▼',200,258,'bold 25px sans-serif',GOLD,'center');
  drawPet(336,697,23,{noBlink:true});
  if(w.quip&&w.phase==='show')lines(L(w.quip),200,574,330,'14px sans-serif',INK,2,20,'center');
}
function drawTitle(){
  drawWorld('plains',0);panel(24,135,352,138);txt('PET WALKIES',200,182,'bold 27px Georgia,serif',INK,'center');txt(L(TX.title),200,213,'bold 21px sans-serif',INK,'center');lines(L(TX.sub),200,242,300,'13px sans-serif',MUTED,1,18,'center');
  drawPet(146,520,46,{});art('props/chest',260,445,87,77,true);
  panel(40,556,320,108);txt(tf(TX.best,{n:G.save.best}),200,602,'bold 16px sans-serif',INK,'center');lines(L(TX.start),200,631,236,'13px sans-serif',MUTED,1,18,'center');
  btn(BTN.title.dex,L(TX.dex),null,'cream');
}
function diaryPageLayout(d){
  const width=292,height=104,gap=7;
  let size=14,rows=[];
  for(;size>=12;size--){
    ctx.font=size+'px sans-serif';rows=diaryLines(d).map(s=>wrap(s,width));
    if(rows.reduce((n,r)=>n+r.length*(size+3),0)+(rows.length-1)*gap<=height)break;
  }
  const used=rows.reduce((n,r)=>n+r.length*(size+3),0)+(rows.length-1)*gap;
  return{rows,size,leading:size+3,gap,x:54,y:455+(height-used)/2+size,width,height};
}
function drawDiary(){
  drawWorld('plains',0);panel(14,130,372,550);txt(L(TX.diaryTitle),200,178,'bold 24px sans-serif',INK,'center');
  // A scrapbook preview above; complete readable paragraphs below, clear of rings and clasp.
  art('ui/diary',30,209,340,233);
  art('plains',68,255,104,134);art('puppet/portrait',86,314,69,75,true);
  txt('60 / 60',262,279,'bold 22px sans-serif',INK,'center');
  for(let i=0;i<3;i++)art('items/'+['can','wood','rope'][i],216+i*28,307,25,29,true);
  art('items/flowers',235,359,42,43,true);
  const d=G.diary,page=diaryPageLayout(d);
  let y=page.y;for(const paragraph of page.rows){for(const line of paragraph){txt(line,page.x,y,page.size+'px sans-serif',INK);y+=page.leading;}y+=page.gap;}
  lines(tf(TX.loot,{n:d.loot})+(d.k>0?'  '+tf(TX.newEntries,{k:d.k}):''),200,574,292,'13px sans-serif',MUTED,1,18,'center');
  txt(tf(TX.total,{n:d.total}),200,607,'bold 25px sans-serif',GOLD,'center');
  txt(tf(TX.best,{n:G.save.best})+(d.newBest?' · '+L(TX.newBest):''),200,638,'13px sans-serif',INK,'center');
  ctx.save();ctx.globalAlpha=G.diaryLock>0?.4:1;btn(BTN.diary.dex,L(TX.dex),null,'cream');btn(BTN.diary.save,L(TX.save));ctx.restore();
}

function drawDex(){
  drawWorld('plains',0);panel(12,130,376,628);let n=0;const maxTotal=EVENT_IDS.length*2+ITEMS.length;
  for(const id of EVENT_IDS){const de=G.save.dexEvents[id]||{};if(de.n)n++;if(de.r)n++;}for(const it of ITEMS)if(G.save.dexItems[it.id])n++;
  txt(tf(TX.dexTitle,{n,m:maxTotal}),200,167,'bold 21px sans-serif',INK,'center');txt(L(T('{{tb:pet-walk.say.174}}')),200,188,'12px sans-serif',MUTED,'center');
  EVENT_IDS.forEach((id,i)=>{const de=G.save.dexEvents[id]||{},yy=204+i*35,seen=de.n>0||de.r>0;if(seen)art('ui/header',22,yy,354,33);const name=PROP_NAMES[i];art((name==='rainbow'?'items/':'props/')+name,31,yy+3,27,27,true);txt(seen?L(EVT[id].n):L(TX.unknown),68,yy+22,'13px sans-serif',seen?INK:'#8c806e');txt('●',298,yy+22,'14px sans-serif',de.n?'#607d4e':'#d2c2a8','center');txt('◆',348,yy+22,'14px sans-serif',de.r?GOLD:'#d2c2a8','center');});
  ITEMS.forEach((it,i)=>chip(17+i*37,654,33,it.id,G.save.dexItems[it.id]?1:.3));lines(L(TX.dexTip),200,715,324,'12px sans-serif',MUTED,2,17,'center');btn(BTN.dex.back,L(TX.back),null,'cream');
  if(G.dexSelected){const id=G.dexSelected,e=EVT[id],de=G.save.dexEvents[id]||{};ctx.fillStyle='rgba(56,42,29,.65)';ctx.fillRect(0,0,W,H);panel(20,226,360,363);txt(L(e.n),200,269,'bold 21px sans-serif',INK,'center');let y=304;if(de.n){y+=lines('● '+L(T('{{tb:pet-walk.say.175}}'))+' · '+L(e.d[0]),43,y,314,'14px sans-serif',INK,5,20)+24;}if(de.r)lines('◆ '+L(T('{{tb:pet-walk.say.176}}'))+' · '+L(e.rd),43,y,314,'14px sans-serif',GOLD,5,20);btn(BTN.dex.modalClose,L(TX.back),null,'cream');}
}
function drawWalk(){
  const t=G.trip;let sp=t.steps*40;if(G.step)sp+=40*Math.min(1,G.step.t/CONFIG.stepAnim);G.scrollPx=sp;drawWorld(terrAt(),sp);
  if(G.mode!=='WHEEL'){if(G.ev)drawProp(G.ev);drawPet(130,518,42,petOpts());drawBubble();}
  if(G.mode==='WHEEL'&&G.wheel)drawWheel(G.wheel);
  if(G.ev&&G.mode==='EVENT')drawCard(G.ev);drawHUD();drawFlights();drawFloatTexts();
  if(G.mode==='WALK'){panel(20,575,360,117);lines(L(TX.hint),200,610,310,'14px sans-serif',INK,2,20,'center');txt(t.steps+' / 60',200,664,'bold 23px sans-serif',INK,'center');}
  if(!(G.mode==='EVENT'&&G.ev.phase==='choice'))btn([76,778,248,54],G.mode==='WHEEL'?L(TX.tapStop):G.mode==='EVENT'?L(TX.tapCont):'➜');
}
function render(){
  ctx.setTransform(cv.width/W,0,0,cv.width/W,0,0);ctx.clearRect(0,0,W,H);
  if(typeof Image!=='undefined'){
    if(!document.getElementById('view-pet-walk').hidden)loadFelt();
    if(!feltReady()){ctx.fillStyle='#e8d9bc';ctx.fillRect(0,0,W,H);txt('PET WALKIES',200,365,'bold 29px Georgia',INK,'center');txt(feltErrors.size?L(T('{{tb:pet-walk.say.185}}')):L(T('{{tb:pet-walk.say.186}}')),200,407,'15px sans-serif',MUTED,'center');return;}
  }
  switch(G.mode){case'TITLE':drawTitle();break;case'WALK':case'EVENT':case'WHEEL':drawWalk();break;case'DIARY':drawDiary();break;case'DEX':drawDex();break;}
}
/* ====================== SAVE IMAGE ====================== */
function saveImage(){try{const c=document.createElement('canvas');c.width=W;c.height=H;ctx=c.getContext('2d');drawDiary();ctx=mainCtx;c.toBlob(b=>{if(!b)return;const a=document.createElement('a'),url=URL.createObjectURL(b);a.href=url;a.download='pet-walkies-diary.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);},'image/png');}catch(e){ctx=mainCtx;}}

/* ====================== PLATFORM ====================== */
var $v=$('view-pet-walk');
function say(t,kind){var m=$('pw-msg');m.textContent=t;m.className='msg'+(kind?' '+kind:'');}
petSay=say;
function setText(id,v){var e=$(id);if(e.textContent!==v)e.textContent=v;}
function ui(){
  const live=petBusy&&G.trip;
  setText('pw-steps',live?G.trip.steps+' / '+CONFIG.stepsPerTrip:'— / '+CONFIG.stepsPerTrip);
  setText('pw-score',live?(G.trip.loot+CONFIG.newEntryBonus*G.trip.newCount)+' 分':'—');
  setText('pw-best',G.save.best+' 分');
  const b=$('pw-go');b.disabled=petBusy||!feltReady();
  $('view-pet-walk').dataset.feltMode=G.mode.toLowerCase();
  setText('pw-go',petBusy?'{{t:pet-walk.msg.177}}':'{{t:pet-walk.msg.178}}');
}
const SEG_MSG=['{{t:pet-walk.msg.179}}','{{t:pet-walk.msg.180}}','{{t:pet-walk.msg.181}}'];
function segmentDone(seg,t){
  if(!petBusy||paid[seg])return;paid[seg]=true;
  earned+=1;S.balance+=1;save();renderAll();
  if(analytics)AN.progress(analytics,{stage:seg,step:t.steps,score:t.loot+CONFIG.newEntryBonus*t.newCount,bonus_points:1,total_bonus_points:earned});
  say(SEG_MSG[seg-1],'win');
}
function finishTrip(total){
  if(!petBusy)return;
  petBusy=false;petStake=0;
  if(analytics)AN.end(analytics,earned,earned>0?'complete':'loss',{score:total,step:CONFIG.stepsPerTrip,stage:3});
  analytics=null;
  save();renderAll();
  say(earned===3?'{{t:pet-walk.msg.182}}':'{{t:pet-walk.msg.183}}','win');
  ui();
}
function begin(){
  if(petBusy||!feltReady())return;
  if(ENTRY_FEE>S.balance){say(LOW_MSG,'lose');return;}
  analytics=AN.start('pet-walk',ENTRY_FEE);petStake=ENTRY_FEE;petBusy=true;earned=0;paid={};
  save();renderAll();
  startTrip();
  say('{{t:pet-walk.msg.184}}');ui();
  try{cv.focus();}catch(e){}
}
$('pw-go').addEventListener('click',begin);

/* ====================== LOOP ====================== */
var lastT=null;
function resetClock(){lastT=null;G.hold=false;}
addEventListener('blur',resetClock);
document.addEventListener('visibilitychange',resetClock);
window.addEventListener('hashchange',resetClock);
function frame(ts){
  if(lastT===null)lastT=ts;
  const dt=Math.min(0.05,Math.max(0,(ts-lastT)/1000)||0);lastT=ts;
  if(pwShown()){syncLang();update(dt);ui();render();}else lastT=null;
  requestAnimationFrame(frame);
}
G.mode='TITLE';ui();render();requestAnimationFrame(frame);

  })();
