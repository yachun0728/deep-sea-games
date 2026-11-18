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
const W=400,H=560;
var analytics=null,earned=0,paid={},STEPS_PER_SEG=20;

/* ====================== DATA ====================== */
const T=s=>{const i=s.indexOf('|');return{zh:s.slice(0,i),en:s.slice(i+1)};};
const ITEMS=[
  {id:'itm_can',  n:T('罐頭|Can'),  ab:T('罐|Ca'),s:1},
  {id:'itm_wood', n:T('木材|Wood'), ab:T('木|Wo'),s:1},
  {id:'itm_stone',n:T('石頭|Stone'),ab:T('石|St'),s:1},
  {id:'itm_scrap',n:T('廢鐵|Scrap'),ab:T('鐵|Sc'),s:1},
  {id:'itm_cloth',n:T('布料|Cloth'),ab:T('布|Cl'),s:1},
  {id:'itm_fish', n:T('魚乾|Fish'), ab:T('魚|Fi'),s:1},
  {id:'itm_rope', n:T('繩索|Rope'), ab:T('繩|Ro'),s:3},
  {id:'itm_battery',n:T('電池|Battery'),ab:T('電|Ba'),s:3},
  {id:'itm_ore',  n:T('礦石|Ore'),  ab:T('礦|Or'),s:3},
  {id:'itm_ai_word',n:T('AI 字詞碎片|AI word shard'),ab:T('字|AI'),s:10}
];
const ITEM={};ITEMS.forEach((o,i)=>{o.idx=i;ITEM[o.id]=o;});
const IN=id=>ITEM[id].n;
const GEN_NO_CAN=['itm_wood','itm_stone','itm_scrap','itm_cloth','itm_fish'];
const MATS=['itm_wood','itm_stone','itm_scrap','itm_cloth'];
const UNCOMMON=['itm_rope','itm_battery','itm_ore'];

const TERR=['plains','water','mountain'];
const TERR_NAME={plains:T('平原|Plains'),water:T('水域|Waters'),mountain:T('山地|Mountains')};
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
 E01:{n:T('幸運轉盤|Lucky Wheel'),d:[T('路邊有個破舊的轉盤，小灰一腳踩了上去。|A beat-up wheel by the road. Gray steps right onto it.')],q:[T('命運在轉，我在看。|Fate is spinning. I\'m watching.')],
  rd:T('轉盤上貼著一張「維修中」的紙條，小灰把紙條撕掉才開始轉。|A "Out of order" note is taped to the wheel. Gray tears it off before spinning.'),rq:T('規則是用來被撕的。|Rules are made to be torn.'),
  dia:T('今天我轉了一次轉盤，結果我很滿意。|I spun the wheel today and I\'m pleased with the result.'),mem:T('上次那個轉盤，我還在想。|I\'m still thinking about that wheel.')},
 E02:{n:T('廢墟木箱|Ruined Crate'),d:[T('木箱半埋在雜物裡，小灰湊過去聞了三下。|A crate half-buried in junk. Gray sniffs it three times.')],q:[T('這個我聞過了，安全。|I sniffed it. It\'s safe.')],
  rd:T('木箱打開，裡面跳出一隻戴著小帽子的鴿子，牠把帽子留下就飛走了。|The crate opens and a pigeon in a tiny hat pops out, leaves the hat, and flies off.'),rq:T('牠留下一頂帽子，我沒問。|It left a tiny hat. I didn\'t ask.'),
  dia:T('今天聞了一個木箱，確認安全。|I sniffed a crate today and confirmed it was safe.'),mem:T('上次那個木箱，我還記得味道。|I still remember how that crate smelled.')},
 E03:{n:T('卡住的鐵櫃|Stuck Locker'),d:[T('鐵櫃的門卡死了，小灰退後三步，準備衝撞或撬開！|The locker door is jammed. Gray prepares to ram or pry it open!')],q:[T('專業的。|Professional.')],
  rd:T('鐵櫃打開後，裡面是另一個鐵櫃，小灰又撞了一次。|The locker opens to reveal another locker. Gray headbutts again.'),rq:T('俄羅斯娃娃。|Nesting dolls.'),
  dia:T('今天打開了一個鐵櫃，沒有人看到。|I forced a locker open today. Nobody saw.'),mem:T('上次那個鐵櫃，我的頭還有點痛。|My head still hurts from that locker.')},
 E04:{n:T('三隻野狗|Three Stray Dogs'),d:[T('三隻野狗圍了上來，眼神直勾勾盯著小灰的背包。|Three stray dogs close in, staring straight at Gray\'s pack.')],q:[T('牠們只是餓了，我也是。|They were just hungry. So am I.'),T('連野狗都嫌我們窮。|Even the dogs think we\'re broke.')],
  rd:T('野狗排成一列向小灰敬禮，然後離開。|The dogs line up, salute Gray, and walk away.'),rq:T('牠們把我們當成長官了。|They think we\'re management.'),
  dia:T('今天遇到三隻野狗，我們互相理解。|I met three stray dogs today. We understood each other.'),mem:T('上次那三隻野狗，我還記得牠們的眼神。|I still remember the way those dogs looked at me.')},
 E05:{n:T('機械師與扳手|The Mechanic and Wrench'),d:[T('機械師拍拍小灰的天線，她的 AI「扳手」繞著小灰轉了兩圈。|A mechanic pats Gray\'s antenna while her AI, Wrench, circles Gray twice.')],q:[T('她說我這型號很久沒見了。|She said they don\'t make my model anymore.')],
  rd:T('扳手偷偷把小灰的天線染成粉紅色，說這樣訊號比較好。|Wrench quietly dyes Gray\'s antenna pink for "better reception."'),rq:T('她說這叫保養。|She said that\'s called maintenance.'),
  dia:T('今天機械師說我是古董。|The mechanic called me an antique today.'),mem:T('上次扳手說我是古董，我還記得。|Wrench called me an antique. I haven\'t forgotten.')},
 E06:{n:T('河鯊探頭|Shark Pop-up'),d:[T('河鯊從水裡探出頭來，張大嘴巴！|A river shark pops out of the water, jaws wide open!')],q:[T('那是我們的魚！|That was OUR fish!'),T('那是天線，不是零食。|That\'s an antenna, not a snack.')],
  rd:T('河鯊吐出來的不是魚，是一隻破皮鞋。|The shark spits out not a fish, but an old boot.'),rq:T('這不是等價交換。|That\'s not an even trade.'),
  dia:T('今天跟河鯊交手了一番。我記得。|I had a run-in with the river shark today. I remember.'),mem:T('上次那隻河鯊，我還記得。|I haven\'t forgotten that river shark.')},
 E07:{n:T('漂流箱|Drift Box'),d:[T('一個神秘箱子漂到岸邊，小灰把它拖上岸。|A mysterious box drifts to shore. Gray drags it up.')],q:[T('它自己漂來的，不是我偷的。|It floated here on its own. I didn\'t steal it.')],
  rd:T('漂流箱裡傳出有節奏的敲門聲。|Rhythmic knocking comes from inside the drift box.'),rq:T('裡面有人，我們假裝沒聽到。|Someone\'s inside. Let\'s pretend we didn\'t hear.'),
  dia:T('今天撿到一個漂流箱，我發誓不是偷的。|I found a drift box today. I swear I didn\'t steal it.'),mem:T('上次那個漂流箱，真的不是我偷的。|That drift box last time? Really not stolen.')},
 E08:{n:T('老漁夫與浮標|The Old Fisher and Buoy'),d:[T('老漁夫朝小灰揮手，他的 AI「浮標」一直盯著小灰看。|The old fisher waves. His AI, Buoy, won\'t stop staring at Gray.')],q:[T('浮標又在看我了。|Buoy\'s staring at me again.')],
  rd:T('浮標和小灰互瞪了 3 秒，誰也不眨眼。|Buoy and Gray stare at each other for 3 seconds. Neither blinks.'),rq:T('我沒輸，我只是沒贏。|I didn\'t lose. I just didn\'t win.'),
  dia:T('今天浮標一直盯著我看。|Buoy kept staring at me today.'),mem:T('上次浮標盯著我看，今天不要再來了。|Buoy stared at me last time. Not again today.')},
 E09:{n:T('偽裝的岩殼蟹|The Disguised Crab'),d:[T('小灰對著一顆石頭自言自語，石頭突然開口了。|Gray is muttering to a rock when the rock suddenly answers.')],q:[T('這顆石頭比我會聊天。|This rock is a better talker than me.')],
  rd:T('岩殼蟹偽裝成一顆很小的石頭，還是被小灰發現了。|The crab disguises itself as a tiny pebble. Gray finds it anyway.'),rq:T('牠偽裝成小石頭，還是被我發現了。|It disguised itself as a pebble. I still found it.'),
  dia:T('今天我跟一顆石頭聊了很久，牠比我會聊。|I talked to a rock for a long time today. It\'s a better talker than me.'),mem:T('上次那顆石頭，還是比我會聊。|That rock from last time is still a better talker than me.')},
 E10:{n:T('小落石|Tiny Rockfall'),d:[T('山壁掉下一顆小石頭，正朝小灰的頭頂飛來！|A small rock falls from the cliff straight toward Gray\'s head!')],q:[T('沒事。我是故意的。|I\'m fine. I meant to do that.')],
  rd:T('落下的小石頭在地上排成一個笑臉。|The fallen pebbles arrange themselves into a smiley face.'),rq:T('山在嘲笑我。|The mountain is laughing at me.'),
  dia:T('今天有一顆石頭砸到我。我是故意的。|A rock hit my head today. I meant to do that.'),mem:T('上次那顆落石，我的頭還記得。|My head still remembers that rock.')},
 E11:{n:T('小灰的怪癖|Gray\'s Quirk'),d:[T('小灰停在路燈前說起話來。|Gray stops to talk to a streetlight.'),T('小灰追著自己的天線轉圈。|Gray chases its own antenna in circles.'),T('小灰邊走邊睡，撞上了牆。|Gray falls asleep walking and bumps into a wall.')],
  q:[T('路燈，我有話要對你說。|Streetlight, I have something to tell you.'),T('它又在我後面了。|It\'s behind me again.'),T('我沒睡。我在閉著眼睛思考。|I wasn\'t sleeping. I was thinking with my eyes closed.')],
  rd:T('小灰同時做了三件怪事：對路燈說話、追天線、邊走邊睡。|Gray does all three weird things at once: talks to a streetlight, chases its antenna, sleepwalks.'),rq:T('今天的我很忙。|Busy day for me.'),
  dia:T('今天我做了一件奇怪的事，請不要問。|I did something strange today. Please don\'t ask.'),mem:T('上次那件怪事，請當作沒看到。|That weird thing last time — please pretend you didn\'t see it.')},
 E12:{n:T('雨和彩虹|Rain and Rainbow'),d:[T('下雨了，小灰頂著一片葉子當傘。雨停之後，天邊出現一道彩虹。|It rains. Gray holds a leaf overhead as an umbrella. After the rain, a rainbow appears.'),T('暴風雨來了，小灰的天線被吹歪了。雨停之後，天邊出現一道彩虹。|A storm hits and bends Gray\'s antenna. After the storm, a rainbow appears.')],
  q:[T('我不怕。我只是有點濕。|I\'m not scared. Just slightly damp.'),T('看，運氣來了。|Look. Luck is coming.')],
  rd:T('彩虹上站著一隻鴿子。|A pigeon is standing on the rainbow.'),rq:T('我不想知道。|I don\'t want to know.'),
  dia:T('今天下雨，後來有彩虹，好運應該要來了。|It rained today, then a rainbow came. Luck should be on the way.'),mem:T('上次那場雨後有彩虹，今天也會有吧。|There was a rainbow after the rain last time. Maybe again today.')}
};
const EVENT_IDS=Object.keys(EVT);

const CELLS=[
  {w:20,lab:T('罐頭×1|Can×1'),col:'#59616a'},
  {w:25,lab:T('材料×3|Mats×3'),col:'#6b747d'},
  {w:10,lab:T('電池×1|Battery'),col:'#59616a'},
  {w:12,lab:T('魚×2|Fish×2'),col:'#6b747d'},
  {w:10,lab:T('再轉|Again'),col:'#59616a'},
  {w:15,lab:T('空格|Empty'),col:'#6b747d'},
  {w:6, lab:T('有事發生|Event!'),col:'#59616a'},
  {w:2, lab:T('AI碎片|AI shard'),col:'#f2a93b'}
];
const BOOST_CELLS=[0,1,2,3,7];
const QUIPS=[T('這格是裝飾。|This slot is decorative.'),T('這格是來湊數的。|This slot is here to fill space.'),T('恭喜，你得到了空氣。|Congratulations. You won air.')];
const DIARY1=[T('今天又出門了，天氣普通。|Went out again today. Weather: average.'),T('今天走了六十步，有點累。|Sixty steps today. A little tired.'),T('今天出門，主人一直催我往前走。|Today my human kept urging me forward.')];
const DIARY3=[T('總之，今天很值得。|All in all, a good day.'),T('總之，今天還行。|All in all, an okay day.'),T('總之，今天沒什麼收穫，但我不怪你。|All in all, a quiet day. But I don\'t blame you.')];
const TX={
  title:T('小灰出門|Pet Walkies'),
  sub:T('點一下走一步，按住連續走|Tap to step. Hold to keep walking.'),
  start:T('按「出門」出發|Press "Go for a walk" to start'),again2:T('再走一趟：按「出門」|Walk again: press "Go for a walk"'),
  best:T('最高分 {n}|Best {n}'),score:T('分數 {n}|Score {n}'),
  dex:T('圖鑑|Collection'),back:T('返回|Back'),save:T('存成圖片|Save image'),
  diaryTitle:T('今天的日記|Today\'s diary'),loot:T('物資分 {n}|Loot {n}'),newEntries:T('新圖鑑 +5 × {k}|New entries +5 × {k}'),
  total:T('總分 {n}|Total {n}'),newBest:T('NEW BEST!|NEW BEST!'),newTag:T('新圖鑑！|New entry!'),rare:T('★ 稀有|★ Rare'),
  tapStop:T('按一下停止（抓準時機！）|Tap to stop (Time it!)'),perfect:T('★ 完美時機！好運加成！|★ PERFECT TIMING! Luck Up!'),
  spinAgain:T('再轉一次！|Spin again!'),ahead:T('前方有事發生|Something\'s ahead'),
  got:T('獲得 {x}|Got {x}'),lost:T('失去 {x}|Lost {x}'),shark:T('河鯊冒出來還你 魚 ×1！|The shark popped up & returned Fish ×1!'),
  gave:T('給了 罐頭 ×1，換到一次轉盤|Gave Can ×1 for a spin'),nothing:T('什麼都沒有|Nothing'),
  finale:T('到家門口了，門前有一個幸運轉盤。最後轉一次，再進門！|Almost home. A lucky wheel by the door: one last spin before going in!'),
  charm:T('3 個 AI 字詞碎片化成好運，前 3 次轉盤運氣變好|3 AI word shards became luck: your first 3 spins are luckier'),
  rainbow:T('彩虹！接下來 3 次轉盤運氣變好|Rainbow! Your next 3 spins are luckier'),
  hint:T('點一下走一步，按住連續疾走|Tap to step. Hold to sprint!'),
  tapCont:T('點任意處繼續|Tap anywhere to continue'),
  unknown:T('？？？|???'),dexTitle:T('圖鑑 {n}/{m}|Collection {n}/{m}'),
  dexTip:T('點擊已解鎖事件可回味劇情|Tap unlocked events to read story'),
  footer:T('小灰出門 · Pet Walkies|Pet Walkies'),
  homeSign:T('到家了！|HOME!')
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
        {id:'ram', label:T('用頭撞開|Headbutt'), enabled:true, def:true},
        {id:'pry', label:T('繩索撬開 (需繩索×1)|Pry open (Rope×1)'), enabled:invOf('itm_rope')>0}
      ];
      break;
    case'E04':
      // 二選一：餵罐頭換轉盤 vs 一起吠
      ev.phase='choice';
      ev.choices=[
        {id:'feed', label:T('分罐頭×1 (換轉盤)|Give Can×1 (Wheel)'), enabled:invOf('itm_can')>0},
        {id:'bark', label:T('跟著一起吠！|Bark back!') , enabled:true, def:true}
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
        {id:'open', label:T('小心打開 (轉盤)|Open carefully (Wheel)'), enabled:true, def:true},
        {id:'kick', label:T('用力踹開 (直接拿材料)|Kick it open (Mats)'), enabled:true}
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
        ev.lines.push(L(T('野狗被氣勢嚇跑，留下了東西！|Dogs ran off & left loot!')));
        ev.lines.push(gainLine(g));
      }else{
        ev.variant=1;
        ev.lines.push(L(T('野狗跟著一起吠了三聲就走了。|The dogs barked back and left.')));
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
  title:{dex:[130,470,140,40]},
  event:{c0:[36,184,156,36],c1:[208,184,156,36]},
  diary:{dex:[90,470,100,44],save:[210,470,100,44]},
  dex:{back:[140,518,120,34],modalClose:[140,268,120,36]}
};
const hit=(r,p)=>p.x>=r[0]&&p.x<=r[0]+r[2]&&p.y>=r[1]&&p.y<=r[1]+r[3];

function press(p){
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
        const y=52+i*22;
        if(p.x>=20&&p.x<=380&&p.y>=y&&p.y<=y+22){
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

/* ====================== DRAW HELPERS ====================== */
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function circ(x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);}
function txt(s,x,y,font,color,align){ctx.font=font;ctx.fillStyle=color;ctx.textAlign=align||'left';ctx.textBaseline='alphabetic';ctx.fillText(s,x,y);}
function wrap(text,maxW){
  const out=[];let cur='';
  if(G.lang==='en'){
    for(const w of text.split(' ')){const tr=cur?cur+' '+w:w;if(ctx.measureText(tr).width>maxW&&cur){out.push(cur);cur=w;}else cur=tr;}
  }else{
    for(const ch of text){if(ctx.measureText(cur+ch).width>maxW&&cur){out.push(cur);cur=ch;}else cur+=ch;}
  }
  if(cur)out.push(cur);return out;
}
function btn(r,label,col,bg){
  rr(r[0],r[1],r[2],r[3],8);ctx.fillStyle=bg||'#2b3138';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=col||'#f2a93b';ctx.stroke();
  txt(label,r[0]+r[2]/2,r[1]+r[3]/2+5,'bold 14px sans-serif','#fff','center');
}
function chip(x,y,size,id,alpha,count){
  ctx.save();ctx.globalAlpha=alpha;
  rr(x,y,size,size,6);ctx.fillStyle='#2b3138';ctx.fill();
  const it=ITEM[id],ab=L(it.ab);
  txt(ab,x+size/2,y+size/2+(size>20?6:4),'bold '+(size>20?(ab.length>1?'14':'18'):'11')+'px sans-serif',it.s>=10?'#f2a93b':(it.s>=3?'#4fd1c5':'#e8edf2'),'center');
  if(count!==undefined)txt(String(count),x+size-3,y+size-4,'11px sans-serif','#fff','right');
  ctx.restore();
}

/* ====================== PET ====================== */
function drawPet(x,y,r,o){
  o=o||{};const k=r/40;
  ctx.save();ctx.translate(x,y);ctx.scale(k,k);
  const sway=o.sway||0,bend=o.bend||0;

  // body
  circ(0,0,40);ctx.fillStyle='#8d99a6';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#2b3138';ctx.stroke();

  // antenna
  ctx.strokeStyle='#2b3138';ctx.lineWidth=3;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(8,-39);ctx.quadraticCurveTo(14+bend/2,-48,8+sway+bend,-56);ctx.stroke();
  circ(8+sway+bend,-57,4.5);ctx.fillStyle=o.ant||'#f2a93b';ctx.fill();

  // eyes
  const sc=o.eyeScale||1,col=o.flash?'#ffffff':(o.eye||'#ffc23d');
  const blink=(G.time%4)<0.12&&!o.noBlink;
  for(const dx of[-14,14]){
    ctx.save();ctx.translate(dx,-6);
    ctx.beginPath();ctx.ellipse(0,0,9*sc,(blink?2:12)*sc,0,0,Math.PI*2);ctx.fillStyle='#1b1b24';ctx.fill();
    if(o.xeyes){
      ctx.strokeStyle='#f2a93b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-6,-6);ctx.lineTo(6,6);ctx.moveTo(6,-6);ctx.lineTo(-6,6);ctx.stroke();
    }else if(!blink){circ(0,0,7*sc);ctx.fillStyle=col;ctx.fill();}
    ctx.restore();
  }
  // mouth
  ctx.strokeStyle='#2b3138';ctx.lineWidth=2.5;ctx.beginPath();
  if(o.mouthFlat){ctx.moveTo(-7,16);ctx.lineTo(7,16);}else{ctx.arc(0,8,8,Math.PI*0.15,Math.PI*0.85);}
  ctx.stroke();
  ctx.restore();
}
function eyeColor(){const s=G.trip?G.trip.steps:0;return s<=30?'#ffc23d':(s<=50?'#f2a93b':'#4fd1c5');}

/* ====================== WORLD ====================== */
const SIL={};
(function(){
  const g=mulberry32(777);const r=(a,b)=>a+g()*(b-a);
  SIL.plains=[];for(let i=0;i<5;i++)SIL.plains.push({x:i*80+r(0,16),w:r(40,70),h:r(60,140)});
  SIL.water=[];for(let i=0;i<4;i++)SIL.water.push({x:i*100+r(0,30),w:14,h:r(90,150)});
  SIL.mountain=[];for(let i=0;i<3;i++)SIL.mountain.push({x:i*133+r(-10,10),w:r(120,200),h:r(90,170)});
  SIL.decor={plains:[],mountain:[]};
  for(let i=0;i<8;i++)SIL.decor.plains.push({x:r(0,400),y:r(435,550),w:r(14,30)});
  for(let i=0;i<6;i++)SIL.decor.mountain.push({x:r(0,400),y:r(440,545),r:r(4,8)});
})();
function drawWorld(tn,scroll){
  const st=TERR_STYLE[tn];
  ctx.fillStyle=st.sky;ctx.fillRect(0,0,W,420);
  ctx.fillStyle=st.gnd;ctx.fillRect(0,420,W,140);
  ctx.fillStyle=st.sil;
  const so=(scroll*0.6)%400;
  for(const k of[0,1]){
    for(const s of SIL[tn]){
      const x=s.x-so+400*k;
      if(tn==='plains')ctx.fillRect(x,420-s.h,s.w,s.h);
      else if(tn==='water')ctx.fillRect(x,420-s.h,s.w,s.h);
      else{ctx.beginPath();ctx.moveTo(x,420);ctx.lineTo(x+s.w/2,420-s.h);ctx.lineTo(x+s.w,420);ctx.closePath();ctx.fill();}
    }
  }
  const go=scroll%400;
  if(tn==='plains'){ctx.strokeStyle='#4a525a';ctx.lineWidth=2;
    for(const d of SIL.decor.plains)for(const k of[0,1]){const x=d.x-go+400*k;ctx.beginPath();ctx.moveTo(x,d.y);ctx.lineTo(x+d.w,d.y);ctx.stroke();}}
  else if(tn==='mountain'){ctx.fillStyle='#4a4752';
    for(const d of SIL.decor.mountain)for(const k of[0,1]){circ(d.x-go+400*k,d.y,d.r);ctx.fill();}}
  else{ctx.strokeStyle='#6f8ea1';ctx.lineWidth=2;
    for(let i=0;i<3;i++){const y=450+i*30,ph=G.time*0.8+i;ctx.beginPath();
      for(let x=0;x<=400;x+=10){const yy=y+Math.sin(x/25+ph)*4;if(x===0)ctx.moveTo(x,yy);else ctx.lineTo(x,yy);}ctx.stroke();}}

  // 路標與終點小屋視覺
  if(G.trip){
    const rem=CONFIG.stepsPerTrip-G.trip.steps;
    if(rem<=6){
      const hx=130+rem*40-(G.step?(G.step.t/CONFIG.stepAnim)*40:0);
      ctx.fillStyle='#8d6e63';ctx.fillRect(hx,350,54,70);
      ctx.fillStyle='#d9534f';ctx.beginPath();ctx.moveTo(hx-6,350);ctx.lineTo(hx+27,322);ctx.lineTo(hx+60,350);ctx.closePath();ctx.fill();
      ctx.fillStyle='#f2a93b';ctx.fillRect(hx+18,382,18,38);
      txt(L(TX.homeSign),hx+27,314,'bold 12px sans-serif','#f2a93b','center');
    }
  }
}

/* ====================== PROPS ====================== */
function drawProp(ev){
  const id=ev.id,t=ev.t,rare=ev.rare;
  const px=292+(1-Math.min(1,t/0.35))*120,gy=420;
  ctx.save();ctx.lineWidth=2;
  switch(id){
    case'E01':{circ(px,gy-36,34);ctx.fillStyle='#6b747d';ctx.fill();ctx.strokeStyle='#1b1b24';ctx.stroke();
      ctx.strokeStyle='#f2a93b';for(let i=0;i<4;i++){const a=t*2+i*Math.PI/2;ctx.beginPath();ctx.moveTo(px,gy-36);ctx.lineTo(px+Math.cos(a)*30,gy-36+Math.sin(a)*30);ctx.stroke();}
      if(rare){ctx.fillStyle='#e8edf2';ctx.fillRect(px-14,gy-90,28,18);}break;}
    case'E02':{ctx.fillStyle='#a67c2c';ctx.fillRect(px-30,gy-44,60,44);ctx.strokeStyle='#5d4a1a';ctx.strokeRect(px-30,gy-44,60,44);
      if(rare){circ(px,gy-62-Math.abs(Math.sin(t*4))*8,10);ctx.fillStyle='#8d99a6';ctx.fill();ctx.fillStyle='#f2a93b';ctx.fillRect(px-6,gy-78-Math.abs(Math.sin(t*4))*8,12,6);}break;}
    case'E03':{ctx.fillStyle='#6b747d';ctx.fillRect(px-20,gy-80,40,80);ctx.strokeStyle='#1b1b24';ctx.strokeRect(px-20,gy-80,40,80);
      if(rare){ctx.fillStyle='#59616a';ctx.fillRect(px-12,gy-60,24,40);}break;}
    case'E04':{for(let i=0;i<3;i++){const x=px-34+i*34;circ(x,gy-16,14);ctx.fillStyle='#4a525a';ctx.fill();ctx.fillStyle='#1b1b24';circ(x-4,gy-18,2);ctx.fill();circ(x+4,gy-18,2);ctx.fill();}break;}
    case'E05':{ctx.fillStyle='#59616a';ctx.fillRect(px-14,gy-50,28,50);circ(px,gy-62,12);ctx.fillStyle='#8d99a6';ctx.fill();
      const a=t*5;circ(px+30+Math.cos(a)*18,gy-40+Math.sin(a)*10,6);ctx.fillStyle='#f2a93b';ctx.fill();break;}
    case'E06':{const up=Math.min(1,t/0.35)*34;ctx.fillStyle='#6f8ea1';ctx.beginPath();ctx.moveTo(px-22,gy+4);ctx.lineTo(px,gy+4-up-10);ctx.lineTo(px+22,gy+4);ctx.closePath();ctx.fill();
      if(up>20){ctx.fillStyle='#fff';ctx.fillRect(px-10,gy-up+8,20,6);}break;}
    case'E07':{const b=Math.sin(t*3)*3;ctx.fillStyle='#a67c2c';ctx.fillRect(px-26,gy-34+b,52,34);ctx.strokeStyle='#5d4a1a';ctx.strokeRect(px-26,gy-34+b,52,34);
      if(rare){ctx.fillStyle='#fff';txt('knock',px,gy-44+b,'bold 12px sans-serif','#fff','center');}break;}
    case'E08':{ctx.fillStyle='#59616a';ctx.fillRect(px-26,gy-50,22,50);circ(px-15,gy-62,11);ctx.fillStyle='#8d99a6';ctx.fill();
      circ(px+22,gy-30+Math.sin(t*2)*3,13);ctx.fillStyle='#f2a93b';ctx.fill();circ(px+22,gy-30+Math.sin(t*2)*3,5);ctx.fillStyle='#1b1b24';ctx.fill();break;}
    case'E09':{ctx.fillStyle='#4a4752';ctx.beginPath();ctx.ellipse(px,gy-16,rare?10:28,rare?7:18,0,0,Math.PI*2);ctx.fill();
      if(t>0.7){ctx.fillStyle='#f2a93b';circ(px-10,gy-30,4);ctx.fill();circ(px+10,gy-30,4);ctx.fill();}break;}
    case'E10':{const fall=Math.min(1,t/0.35);
      if(fall<1){circ(130,380-40-(1-fall)*280,12);ctx.fillStyle='#4a4752';ctx.fill();}
      else{ctx.fillStyle='#4a4752';
        if(rare){for(const[ox,oy]of[[-20,-30],[20,-30],[-24,-14],[-8,-6],[8,-6],[24,-14]]){circ(px+ox,gy+oy,5);ctx.fill();}}
        else{circ(px,gy-8,10);ctx.fill();}}break;}
    case'E11':{
      if(ev.variant===0||rare){ctx.fillStyle='#4a525a';ctx.fillRect(px-3,gy-100,6,100);circ(px,gy-104,10);ctx.fillStyle='#f2a93b';ctx.fill();}
      if(ev.variant===2||rare){txt('z Z z',px-34,gy-90+Math.sin(t*3)*4,'bold 18px sans-serif','#e8edf2','left');}
      break;}
    case'E12':{
      ctx.strokeStyle='rgba(180,210,230,0.6)';ctx.lineWidth=1.5;
      if(ev.stage===0){for(let i=0;i<24;i++){const x=(i*37+t*60)%400,y=((i*53+t*320)%420);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-4,y+12);ctx.stroke();}}
      if(ev.stage===0&&!ev.storm){ctx.fillStyle='#6fae4a';ctx.beginPath();ctx.ellipse(130,380-58,26,10,0,0,Math.PI*2);ctx.fill();}
      if(ev.stage===1){
        const cols=['#d9534f','#f2a93b','#e6d84a','#8bc34a','#4fd1c5','#6a8fd8'];
        for(let i=0;i<cols.length;i++){ctx.strokeStyle=cols[i];ctx.lineWidth=5;ctx.beginPath();ctx.arc(250,380,150-i*6,Math.PI,Math.PI*2);ctx.stroke();}
        if(rare){circ(250,222,8);ctx.fillStyle='#8d99a6';ctx.fill();}
      }
      break;}
  }
  ctx.restore();
}

/* ====================== SCENES ====================== */
function petOpts(extra){
  const o={eye:eyeColor()};
  if(G.shock>0)o.eyeScale=1.4;
  if(G.dizzy>0)o.xeyes=true;
  if(G.flash>0)o.flash=true;
  return Object.assign(o,extra||{});
}
function petPose(){
  let y=380,sway=0,bend=0,p=0;
  if(G.step){p=Math.min(1,G.step.t/CONFIG.stepAnim);y-=Math.abs(Math.sin(Math.PI*p))*7;sway=Math.sin(p*Math.PI*2)*4;}
  if(G.bounce>0)y-=Math.sin(Math.PI*(1-G.bounce/0.45))*16;
  if(G.ev&&G.ev.id==='E12'&&G.ev.storm&&G.ev.stage===0)bend=-10;
  return{y,sway,bend};
}
function drawBubble(){
  const b=G.bubble;if(!b)return;
  let text=b.text;
  if(b.key==='ev'){text=L(evQuoteObj(b.evRef));}
  else if(b.key==='mem'){text=L(EVT[b.evId].mem);}
  if(!text)return;
  ctx.save();
  ctx.font='14px sans-serif';
  const lines=wrap(text,220).slice(0,2);
  let mw=0;for(const l of lines)mw=Math.max(mw,ctx.measureText(l).width);
  const bw=Math.min(240,mw+20),bh=lines.length*18+12;
  let a=1;if(b.key!=='ev'&&b.life<0.25)a=Math.max(0,b.life/0.25);
  ctx.globalAlpha=a;
  const bx=Math.max(8,Math.min(W-8-bw,130-bw/2)),by=316-bh;
  rr(bx,by,bw,bh,8);ctx.fillStyle='#fff';ctx.fill();
  ctx.beginPath();ctx.moveTo(118,316);ctx.lineTo(142,316);ctx.lineTo(130,332);ctx.closePath();ctx.fill();
  ctx.fillStyle='#1b1b24';ctx.textAlign='left';
  lines.forEach((l,i)=>ctx.fillText(l,bx+10,by+18+i*18));
  ctx.restore();
}
function drawHUD(){
  const t=G.trip;if(!t)return;
  const tn=terrAt();
  let a=1;if(G.terrFlash>0)a=(Math.floor(G.terrFlash*10)%2)?0.3:1;
  ctx.globalAlpha=a;txt(L(TERR_NAME[tn]),16,30,'bold 18px sans-serif','#fff','left');ctx.globalAlpha=1;


  ctx.fillStyle='#333';ctx.fillRect(16,42,368,10);
  ctx.fillStyle='#f2a93b';ctx.fillRect(16,42,368*Math.min(1,t.steps/CONFIG.stepsPerTrip),10);
  // 20/40步刻度線
  ctx.fillStyle='#1b1b24';ctx.fillRect(16+368/3,42,2,10);ctx.fillRect(16+368*2/3,42,2,10);

  txt(tf(TX.score,{n:t.loot+CONFIG.newEntryBonus*t.newCount}),384,30,'18px sans-serif','#fff','right');

  // 連走速度提示
  if(G.combo>=4&&G.mode==='WALK'){
    txt('⚡ x'+G.combo,384,72,'bold 13px sans-serif','#4fd1c5','right');
  }

  ITEMS.forEach((it,i)=>{
    const x=8+i*39,y=500,n=invOf(it.id);
    const bp=G.bump[it.id]>0?Math.sin(Math.PI*(1-G.bump[it.id]/0.25))*4:0;
    chip(x,y-bp,36,it.id,n>0?1:0.35,n);
  });
}
function drawFlights(){
  for(const f of G.flights){
    const p=Math.min(1,f.t/0.45),i=ITEM[f.id].idx;
    const tx=8+i*39+18,ty=518;
    const x=200+(tx-200)*p,y=200+(ty-200)*p;
    chip(x-12,y-12,24,f.id,1);
  }
}
function drawFloatTexts(){
  for(const ft of G.floatTexts){
    const a=Math.max(0,1-ft.t/1.1);
    ctx.save();ctx.globalAlpha=a;
    txt(ft.text,ft.x,ft.y-ft.t*28,'bold 15px sans-serif',ft.col,'center');
    ctx.restore();
  }
}
function drawCard(ev){
  const ease=1-Math.pow(1-Math.min(1,ev.t/0.25),3);
  const y=66-(1-ease)*240;
  ctx.save();ctx.translate(0,y-66);
  rr(20,66,360,168,12);ctx.fillStyle='#2b3138';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#f2a93b';ctx.stroke();
  const e=EVT[ev.id];
  txt((ev.rare?'★ ':'')+L(e.n),36,96,'bold 19px sans-serif',ev.rare?'#f2a93b':'#fff','left');
  if(ev.isNew)txt(L(TX.newTag),364,96,'13px sans-serif','#8bc34a','right');
  if(ev.rare)txt(L(TX.rare),364,ev.isNew?114:96,'12px sans-serif','#f2a93b','right');
  ctx.font='14px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='left';
  const dl=wrap(evDesc(ev),328).slice(0,3);
  dl.forEach((l,i)=>ctx.fillText(l,36,126+i*18));

  if(ev.phase==='choice'&&ev.choices){
    ev.choices.forEach((c,i)=>{
      const r=i===0?BTN.event.c0:BTN.event.c1;
      ctx.globalAlpha=c.enabled?1:0.35;
      btn(r,L(c.label),c.enabled?'#f2a93b':'#59616a','#1b1b24');
      ctx.globalAlpha=1;
    });
  }else{
    const n=ev.lines.length;
    if(n===1)txt(ev.lines[0],36,204,'bold 15px sans-serif','#f2a93b','left');
    else if(n>=2){const base=n===2?186:174;ev.lines.forEach((l,i)=>txt(l,36,base+i*18,'bold 14px sans-serif','#f2a93b','left'));}
    if(ev.t>=CONFIG.eventLock){
      txt(L(TX.tapCont),364,224,'11px sans-serif','#8d99a6','right');
    }
  }
  ctx.restore();
}
function drawWheel(w){
  const cx=200,cy=270,r=120;
  let alpha=w.phase==='prep'?Math.min(1,w.t/CONFIG.wheelPrep):1;
  ctx.save();ctx.globalAlpha=alpha;
  ctx.fillStyle='rgba(27,27,36,0.6)';ctx.fillRect(0,0,W,420);
  for(let i=0;i<8;i++){
    const a0=(w.R+45*i-90)*Math.PI/180,a1=a0+Math.PI/4;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,a0,a1);ctx.closePath();
    ctx.fillStyle=CELLS[i].col;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#1b1b24';ctx.stroke();
    if(w.phase==='show'&&w.cell===i){ctx.fillStyle='rgba(255,255,255,'+(0.25+0.25*Math.sin(w.t*16))+')';ctx.fill();}
    const am=a0+Math.PI/8;
    ctx.save();ctx.translate(cx+Math.cos(am)*80,cy+Math.sin(am)*80);ctx.rotate(am);
    txt(L(CELLS[i].lab),0,4,'bold 12px sans-serif',i===7?'#1b1b24':'#fff','center');ctx.restore();
  }
  circ(cx,cy,14);ctx.fillStyle='#2b3138';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#f2a93b';ctx.stroke();

  // 指針與「完美時機」黃金窗口光環
  const isSweet=w.phase==='spin'&&(w.t%0.9>=0.55&&w.t%0.9<=0.82);
  if(isSweet){
    circ(200,140,18);ctx.fillStyle='rgba(79,209,197,0.35)';ctx.fill();
  }
  ctx.fillStyle=isSweet?'#4fd1c5':'#f2a93b';
  ctx.beginPath();ctx.moveTo(188,128);ctx.lineTo(212,128);ctx.lineTo(200,152);ctx.closePath();ctx.fill();

  let hint='',show=true;
  if(w.phase==='spin'||w.phase==='prep'){hint=L(TX.tapStop);show=true;}
  else if(w.phase==='again')hint=L(TX.spinAgain);
  else if(w.phase==='show')hint=w.msg;
  if(show&&hint)txt(hint,200,96,'bold 17px sans-serif',w.phase==='show'?'#f2a93b':(isSweet?'#4fd1c5':'#fff'),'center');
  if(w.perfect&&w.phase!=='spin'){
    txt(L(TX.perfect),200,116,'bold 13px sans-serif','#4fd1c5','center');
  }

  for(const s of G.stars){const d=50*(s.t/0.6);ctx.globalAlpha=1-s.t/0.6;circ(cx+Math.cos(s.a)*d,cy+Math.sin(s.a)*d,5);ctx.fillStyle='#f2a93b';ctx.fill();}
  ctx.restore();
  drawPet(340,470,24,petOpts({eye:'#ffc23d',noBlink:false}));
  if(w.cell===5&&w.quip&&w.phase==='show')txt(L(w.quip),200,420,'14px sans-serif','#fff','center');
}
function drawTitle(){
  drawWorld('plains',G.time*20);
  ctx.fillStyle='rgba(27,27,36,0.62)';ctx.fillRect(0,0,W,H);
  txt(L(TX.title),200,78,'bold 38px sans-serif','#fff','center');
  txt(L(TX.sub),200,108,'14px sans-serif','#c9d1d9','center');
  drawPet(200,185+Math.sin(G.time*3)*2,42,{eye:'#ffc23d'});
  txt(tf(TX.best,{n:G.save.best}),200,262,'15px sans-serif','#c9d1d9','center');
  txt(L(TX.start),200,296,'bold 15px sans-serif','#f2a93b','center');
  btn(BTN.title.dex,L(TX.dex));
}
function drawDiary(){
  // The mobile start button floats over canvas y 325-450, so the text stays above it and the buttons below it.
  ctx.fillStyle='#1b1b24';ctx.fillRect(0,0,W,H);
  const d=G.diary;
  txt(L(TX.diaryTitle),200,40,'bold 22px sans-serif','#fff','center');
  drawPet(200,92,28,{eye:'#ffc23d'});
  ctx.font='15px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='left';
  let y=150;
  for(const line of diaryLines(d)){
    for(const l of wrap(line,336)){ctx.fillText(l,32,y);y+=22;}
  }
  y=Math.max(y+10,262);
  txt(tf(TX.loot,{n:d.loot})+(d.k>0?'   '+tf(TX.newEntries,{k:d.k}):''),200,y,'15px sans-serif','#c9d1d9','center');y+=28;
  txt(tf(TX.total,{n:d.total}),200,y,'bold 20px sans-serif','#f2a93b','center');y+=26;
  txt(tf(TX.best,{n:G.save.best})+(d.newBest?'  '+L(TX.newBest):''),200,y,'15px sans-serif','#fff','center');
  ctx.globalAlpha=G.diaryLock>0?0.4:1;
  btn(BTN.diary.dex,L(TX.dex));btn(BTN.diary.save,L(TX.save));
  ctx.globalAlpha=1;
  txt(L(TX.again2),200,536,'13px sans-serif','#8d99a6','center');
}
function drawDex(){
  // Rows stay above canvas y 325 and loot chips below y 450 so the mobile start button never covers them.
  ctx.fillStyle='#1b1b24';ctx.fillRect(0,0,W,H);
  let n=0;
  const maxTotal=EVENT_IDS.length*2+ITEMS.length;
  for(const id of EVENT_IDS){const de=G.save.dexEvents[id]||{};if(de.n)n++;if(de.r)n++;}
  for(const it of ITEMS)if(G.save.dexItems[it.id])n++;
  txt(tf(TX.dexTitle,{n,m:maxTotal}),200,26,'bold 20px sans-serif','#fff','center');
  txt(L(T('●＝普通　◆＝稀有|● normal   ◆ rare')),200,44,'12px sans-serif','#8d99a6','center');

  EVENT_IDS.forEach((id,i)=>{
    const de=G.save.dexEvents[id]||{},y=52+i*22;
    const seen=de.n>0||de.r>0;
    if(seen){
      rr(18,y,364,20,4);ctx.fillStyle='#232830';ctx.fill();
    }
    txt(seen?L(EVT[id].n):L(TX.unknown),26,y+15,'13px sans-serif',seen?'#fff':'#59616a','left');
    txt('●',290,y+15,'14px sans-serif',de.n>0?'#fff':'#3a424a','center');
    txt('◆',340,y+15,'14px sans-serif',de.r>0?'#f2a93b':'#3a424a','center');
  });

  ITEMS.forEach((it,i)=>{chip(8+i*39,458,36,it.id,G.save.dexItems[it.id]?1:0.3);});
  txt(L(TX.dexTip),200,510,'12px sans-serif','#4fd1c5','center');
  btn(BTN.dex.back,L(TX.back));

  // 點擊事件回味劇情彈窗
  if(G.dexSelected){
    const id=G.dexSelected,e=EVT[id],de=G.save.dexEvents[id]||{};
    ctx.fillStyle='rgba(15,15,20,0.85)';ctx.fillRect(0,0,W,H);
    rr(24,56,352,262,12);ctx.fillStyle='#2b3138';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#f2a93b';ctx.stroke();
    txt(L(e.n),200,90,'bold 19px sans-serif','#f2a93b','center');

    let cy=120;
    if(de.n>0){
      txt('● '+L(T('普通遭遇|Normal')),38,cy,'bold 13px sans-serif','#8bc34a','left');cy+=19;
      for(const l of wrap(L(e.d[0]),320)){txt(l,38,cy,'14px sans-serif','#fff','left');cy+=19;}
      cy+=8;
    }
    if(de.r>0){
      txt('◆ '+L(T('稀有遭遇|Rare')),38,cy,'bold 13px sans-serif','#f2a93b','left');cy+=19;
      for(const l of wrap(L(e.rd),320)){txt(l,38,cy,'14px sans-serif','#fff','left');cy+=19;}
    }
    btn(BTN.dex.modalClose,L(TX.back));
  }
}
function drawWalk(){
  const t=G.trip,tn=terrAt();
  let sp=t.steps*40;if(G.step)sp+=40*(1-Math.pow(1-Math.min(1,G.step.t/CONFIG.stepAnim),2));
  G.scrollPx=sp;
  drawWorld(tn,sp);
  const pp=petPose();
  const ev=G.ev;
  const small=G.mode==='WHEEL';
  if(!small){
    if(ev)drawProp(ev);
    const o=petOpts({sway:pp.sway,bend:pp.bend});
    if(G.pinkAnt>0)o.ant='#ff8fc7';
    if(ev&&ev.id==='E10'&&ev.t>0.35&&ev.t<0.9)o.xeyes=true;
    drawPet(130,pp.y,40,o);
    drawBubble();
  }
  if(G.mode==='WHEEL'&&G.wheel)drawWheel(G.wheel);
  if(ev&&G.mode==='EVENT')drawCard(ev);
  drawHUD();
  drawFlights();
  drawFloatTexts();
  if(G.mode==='WALK'&&G.save.trips===0&&G.hintSteps<3&&!(G.bubble&&G.bubble.key==='mem'))txt(L(TX.hint),200,456,'14px sans-serif','#a9b3bd','center');
}
function render(){
  const dprx=cv.width/W;
  ctx.setTransform(dprx,0,0,dprx,0,0);
  ctx.clearRect(0,0,W,H);

  // 畫面震動效果
  if(G.shake>0){
    const mag=G.shake*18;
    ctx.translate((Math.random()-0.5)*mag,(Math.random()-0.5)*mag);
  }

  ctx.lineCap='butt';
  switch(G.mode){
    case'TITLE':drawTitle();break;
    case'WALK':case'EVENT':case'WHEEL':drawWalk();break;
    case'DIARY':drawDiary();break;
    case'DEX':drawDex();break;
  }
}

/* ====================== SAVE IMAGE ====================== */
function saveImage(){
  try{
    const d=G.diary,c=document.createElement('canvas');c.width=400;c.height=400;
    const g=c.getContext('2d');
    ctx=g;
    g.fillStyle='#2b3138';g.fillRect(0,0,400,400);
    txt(L(TX.diaryTitle),200,44,'bold 22px sans-serif','#fff','center');
    drawPet(200,100,30,{eye:'#ffc23d',noBlink:true});
    g.font='15px sans-serif';g.fillStyle='#fff';g.textAlign='left';
    let y=165;
    for(const line of diaryLines(d)){for(const l of wrap(line,336)){g.fillText(l,32,y);y+=24;}}
    txt(tf(TX.total,{n:d.total}),200,Math.max(y+24,300),'bold 22px sans-serif','#f2a93b','center');
    txt(L(TX.footer),392,390,'11px sans-serif','#8d99a6','right');
    ctx=mainCtx;
    c.toBlob(b=>{
      if(!b)return;
      const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='pet-walkies-diary.png';
      document.body.appendChild(a);a.click();document.body.removeChild(a);
      setTimeout(()=>URL.revokeObjectURL(a.href),2000);
    },'image/png');
  }catch(e){ctx=mainCtx;}
}

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
  const b=$('pw-go');b.disabled=petBusy;
  setText('pw-go',petBusy?'散步中':'出門');
}
const SEG_MSG=['走完第 1 段，BONUS +1 點已入帳。','走完第 2 段，BONUS +1 點已入帳。','走完第 3 段，BONUS +1 點已入帳。'];
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
  say(earned===3?'平安到家！本趟 BONUS 共入帳 3 點。':'平安到家！','win');
  ui();
}
function begin(){
  if(petBusy)return;
  if(ENTRY_FEE>S.balance){say(LOW_MSG,'lose');return;}
  analytics=AN.start('pet-walk',ENTRY_FEE);petStake=ENTRY_FEE;petBusy=true;earned=0;paid={};
  save();renderAll();
  startTrip();
  say('出門囉！每走完 20 步，BONUS +1 點。');ui();
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
