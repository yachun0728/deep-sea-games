  /* ---------- The Last Banquet: turn-based bluffing duel against the host; fixed BONUS per act survived and for the win ---------- */
  var bqBusy=false,bqStake=0,bqSay=function(){};
  (function(){
'use strict';
var HP_MAX=5,DR_MAX=5,HAND_MAX=4,HEAL_CAP=2,OT_SECONDS=180,LOG_KEEP=60,LOG_SHOW=10;
var BONUS={a1:1,a2:2,a3:3,win:2};      // fixed points, each paid once per round, never taken back
var ACTS=[null,
 {name:'第一幕：試探',poison:2,nectar:1,truth:1,draw:2},
 {name:'第二幕：博弈',poison:3,nectar:2,truth:1,draw:3},
 {name:'第三幕：死鬥',poison:4,nectar:2,truth:2,draw:4},
 {name:'延長賽：猝死',poison:3,nectar:0,truth:2,draw:2}];
var SHORT=['','第一幕','第二幕','第三幕','延長賽'];
var TNAME={poison:'劇毒',poison2:'雙倍劇毒',nectar:'瓊漿',pnectar:'毒瓊漿',truth:'真言水',water:'清水',safe:'無毒',danger:'有毒'};
var TICON={poison:'☠',poison2:'☠☠',nectar:'✚',pnectar:'☠✚',truth:'◉',water:'○',safe:'✓',danger:'!'};
var ITEMS={
 needle:{name:'銀針',cup:1,desc:'選一杯，查看酒種。'},
 scent:{name:'聞香',cup:1,desc:'選一杯，數它和下一杯的危險酒。'},
 sober:{name:'醒酒藥',desc:'回 1 血、酒醉 −2，之後本回合不能再用道具。'},
 liquor:{name:'烈酒摻雜',desc:'下一杯：劇毒固定 2 點、瓊漿加倍。'},
 change:{name:'偷天換日',cup:1,desc:'劇毒→瓊漿→真言水→劇毒。'},
 decree:{name:'勸酒令',desc:'對方下次行動必須自己喝。'},
 cheers:{name:'乾杯！',cup:1,desc:'你和對方各喝一次同一杯。'},
 spin:{name:'轉盤',desc:'全部酒杯重新洗牌，情報作廢。'},
 powder:{name:'濃縮毒粉',cup:1,desc:'劇毒傷害 +1；瓊漿變毒瓊漿。'},
 ice:{name:'稀釋冰塊',cup:1,desc:'雙倍劇毒−1；劇毒變清水；毒瓊漿變瓊漿。'}};
var IKEYS=Object.keys(ITEMS);
var SAY={p:'你',d:'莊家'};
var E=null,analytics=null,wins=0,quitArm=0,ADV=false,MUTED=false;
try{wins=+localStorage.getItem('deep-sea-banquet-best')||0;ADV=localStorage.getItem('deep-sea-banquet-adv')==='1';MUTED=localStorage.getItem('deep-sea-banquet-mute')==='1'}catch(e){}
var opp=function(s){return s==='p'?'d':'p'};
var rnd=function(){return Math.random()};
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function pick(a){return a[Math.floor(rnd()*a.length)]}
function fresh(){
 E={phase:'ready',act:0,hp:{p:HP_MAX,d:HP_MAX},dr:{p:0,d:0},heals:{p:0,d:0},cups:[],hand:{p:[],d:[]},turn:'p',extra:false,
  skip:{p:false,d:false},liquor:false,decree:{p:false,d:false},used:{},lock:false,known:{p:{},d:{}},notes:{p:[],d:[]},seen:{p:false,d:false},
  pending:null,sel:0,comp:{poison:0,nectar:0,truth:0},out:{poison:0,nectar:0,truth:0,water:0},claims:{p:0,d:0},lies:{p:0,d:0},publicScan:0,
  log:[],result:null,ot:OT_SECONDS,aiT:1,paid:{},earned:0,v:0,fx:[],fxT:0};
}
fresh();
function log(t){E.log.push(t);if(E.log.length>LOG_KEEP)E.log.shift();E.v++}
var cupOf=function(id){for(var i=0;i<E.cups.length;i++)if(E.cups[i].id===id)return E.cups[i];return null};
var dangerous=function(t){return t==='poison'||t==='poison2'||t==='pnectar'};
var baseKind=function(t){return t==='poison2'?'poison':t==='pnectar'?'nectar':t};

/* ---------- table, knowledge, items ---------- */
function forget(id){
 ['p','d'].forEach(function(s){delete E.known[s][id];E.notes[s]=E.notes[s].filter(function(n){return n.ids.indexOf(id)<0})});
}
function wipeInfo(){E.known={p:{},d:{}};E.notes={p:[],d:[]};E.publicScan=0}
function reshuffle(){shuffle(E.cups);wipeInfo();E.sel=0}
function rotateTable(){if(E.cups.length>1)E.cups.push(E.cups.shift())}
function deal(n){
 var a=ACTS[n],types=[];
 for(var i=0;i<a.poison;i++)types.push('poison');for(i=0;i<a.nectar;i++)types.push('nectar');for(i=0;i<a.truth;i++)types.push('truth');
 shuffle(types);E.cups=types.map(function(t,k){return{id:k+1,t:t}});
 E.act=n;E.comp={poison:a.poison,nectar:a.nectar,truth:a.truth};E.out={poison:0,nectar:0,truth:0,water:0};
 E.heals={p:0,d:0};wipeInfo();E.seen={p:false,d:false};E.sel=0;
 ['p','d'].forEach(function(s){for(var k=0;k<a.draw&&E.hand[s].length<HAND_MAX;k++)E.hand[s].push(pick(IKEYS))});
 log(a.name+'開始。桌上還有 '+E.cups.length+' 杯酒，雙方各抽道具。');
}
function putKnown(side,id,t,maybe){E.known[side][id]={t:t,maybe:!!maybe}}
function drunkMid(side){return E.dr[side]>=3&&E.dr[side]<=4}

function targetOk(key,cup){
 if(key==='change')return cup.t==='poison'||cup.t==='nectar'||cup.t==='truth';
 if(key==='powder')return cup.t==='poison'||cup.t==='nectar';
 if(key==='ice')return cup.t==='poison'||cup.t==='poison2'||cup.t==='pnectar';
 return true;
}
function canUse(side,key){
 if(E.phase!=='play'||E.turn!==side||E.pending)return '現在不能使用道具。';
 if(E.hand[side].indexOf(key)<0)return '沒有這件道具。';
 if(E.lock)return '用過醒酒藥後，本回合不能再用道具。';
 if(E.used[key])return '同名道具每回合只能用一次。';
 if(key==='decree'&&E.decree[opp(side)])return '對方已經被勸酒令指定了。';
 if(key==='cheers'&&E.decree[side])return '被勸酒令指定，只能自己喝。';
 if(key==='scent'&&!E.cups.length)return '桌上沒有酒杯。';
 return '';
}
function takeItem(side,key){var i=E.hand[side].indexOf(key);if(i>=0)E.hand[side].splice(i,1);E.used[key]=1;SFX.item()}
function useItem(side,key,cupId){
 var why=canUse(side,key);if(why)return{ok:false,msg:why};
 var def=ITEMS[key],cup=def.cup?cupOf(cupId):null;
 if(def.cup&&!cup)return{ok:false,msg:'請先點選一杯酒，再使用“'+def.name+'”。'};
 if(cup&&!targetOk(key,cup))return{ok:false,msg:'“'+def.name+'”不能用在這種酒上，道具沒有消耗。'};
 var who=SAY[side],o=opp(side),i,t;
 takeItem(side,key);
 switch(key){
  case 'needle':{
   var shown=cup.t,maybe=drunkMid(side);
   if(maybe&&rnd()<.5){var pool=['poison','nectar','truth'].filter(function(x){return x!==cup.t});shown=pick(pool)}
   putKnown(side,cup.id,shown,maybe);if(side==='p')E.publicScan++;
   log(who+'使用銀針，查看了 #'+cup.id+'。');
   return{ok:true,msg:side==='p'?'銀針顯示 #'+cup.id+' 是“'+TNAME[shown]+'”'+(maybe?'（酒醉中，可能是幻覺）':'')+'。':''};}
  case 'scent':{
   var i0=E.cups.indexOf(cup),nx=E.cups[(i0+1)%E.cups.length],ids=nx&&nx!==cup?[cup.id,nx.id]:[cup.id];
   var real=ids.reduce(function(n,id){return n+(dangerous(cupOf(id).t)?1:0)},0),n=real,maybe2=drunkMid(side);
   if(maybe2&&rnd()<.5){var alts=[0,1,2].filter(function(x){return x!==real});n=pick(alts)}
   E.notes[side].push({ids:ids,n:n,maybe:maybe2});if(side==='p')E.publicScan++;
   if(!maybe2&&n===0)ids.forEach(function(id){if(!E.known[side][id]||!E.known[side][id].t||E.known[side][id].t==='danger')putKnown(side,id,'safe',false)});
   if(!maybe2&&n===ids.length)ids.forEach(function(id){if(!E.known[side][id]||E.known[side][id].t==='safe')putKnown(side,id,'danger',false)});
   log(who+'使用聞香，嗅了 '+ids.map(function(x){return '#'+x}).join(', ')+'。');
   return{ok:true,msg:''};}
  case 'sober':
   E.hp[side]=Math.min(HP_MAX,E.hp[side]+1);E.dr[side]=Math.max(0,E.dr[side]-2);E.lock=true;
   log(who+'喝下醒酒藥：回復 1 點生命，酒醉 −2。');return{ok:true,msg:''};
  case 'liquor':E.liquor=true;log(who+'使用烈酒摻雜：下一杯的效果加強。');return{ok:true,msg:''};
  case 'decree':E.decree[o]=true;log(who+'使用勸酒令。下次行動被迫自己喝，對象：'+SAY[o]+'。');return{ok:true,msg:''};
  case 'spin':reshuffle();log(who+'轉動轉盤：所有酒杯重新洗牌，已知情報作廢。');return{ok:true,msg:''};
  case 'change':{
   var from=cup.t,to=from==='poison'?'nectar':from==='nectar'?'truth':'poison',had=E.known[side][cup.id];
   cup.t=to;forget(cup.id);if(had&&had.t&&!had.maybe)putKnown(side,cup.id,to,false);
   log(who+'對 #'+cup.id+' 使用偷天換日。');return{ok:true,msg:''};}
  case 'powder':
   cup.t=cup.t==='poison'?'poison2':'pnectar';forget(cup.id);log(who+'對 #'+cup.id+' 撒下濃縮毒粉。');return{ok:true,msg:''};
  case 'ice':
   cup.t=cup.t==='poison2'?'poison':cup.t==='poison'?'water':'nectar';forget(cup.id);log(who+'對 #'+cup.id+' 丟入稀釋冰塊。');return{ok:true,msg:''};
  case 'cheers':{
   var big=E.liquor;E.liquor=false;
   log(who+'發動乾杯！：雙方各喝一次 #'+cup.id+'。');
   removeCup(cup);
   var r1=drinkEffect(side,cup,{src:side,big:big}),r2=drinkEffect(o,cup,{src:o,big:big});
   if(checkEnd())return{ok:true,msg:'',ends:true};
   finish(r1.extra?side:o,!!r1.extra);return{ok:true,msg:'',ends:true};}
 }
 return{ok:false,msg:''};
}

/* ---------- drinking ---------- */
function removeCup(cup){
 var i=E.cups.indexOf(cup);if(i>=0)E.cups.splice(i,1);
 forget(cup.id);E.out[baseKind(cup.t)]++;
 if(E.sel===cup.id)E.sel=0;
}
function hurt(side,n){E.hp[side]=Math.max(0,E.hp[side]-n)}
function heal(side,n,o){
 if(o.noHeal)return 0;if(E.heals[side]>=HEAL_CAP)return 0;
 E.heals[side]++;var before=E.hp[side];E.hp[side]=Math.min(HP_MAX,before+n);return E.hp[side]-before;
}
// Resolves one drink. The cup must already be off the table. src is whoever's drunkenness makes poison hit harder.
function drinkEffect(side,cup,o){
 var t=cup.t,other=opp(side),bonus=drunkMid(o.src||side)?1:0,extra=false,who=SAY[side],text=who+'喝下 #'+cup.id+'：'+TNAME[t]+'。';
 E.fx.push({k:'reveal',s:side,t:t});E.fxT=Math.min(1.4,(E.fxT||0)+.9);
 if(t==='poison'||t==='poison2'){var dmg=(o.big||t==='poison2')?2:1;dmg+=bonus;hurt(side,dmg);E.fx.push({k:'hit',s:side,n:dmg});text+=' '+who+'失去 '+dmg+' 點生命。'}
 else if(t==='nectar'||t==='pnectar'){
  var h=heal(side,o.big?2:1,o);if(h>0)E.fx.push({k:'heal',s:side,n:h});text+=h>0?' '+who+'回復 '+h+' 點生命。':(o.noHeal?' 沒有回血。':' 回血次數已達本幕上限。');
  if(t==='pnectar'){var d2=o.big?2:1;hurt(other,d2);E.fx.push({k:'hit',s:other,n:d2});text+=' '+SAY[other]+'失去 '+d2+' 點生命。'}
  if(!o.noExtra){extra=true;text+=' '+who+'可以再行動一次。'}
 }else if(t==='truth'){
  if(E.hand[side].length){E.seen[side]=true;text+=' 公開手牌：'+who+'。'}
  else if(E.cups.length){var c=pick(E.cups);putKnown(other,c.id,c.t,false);text+=' 隨機公開了桌上 #'+c.id+'。'}
 }
 E.dr[side]=Math.min(DR_MAX,E.dr[side]+1);
 if(bonus&&(t==='poison'||t==='poison2'))text+=' 酒醉讓劇毒更痛。';
 log(text);
 return{extra:extra,type:t};
}
function resolveFaints(){
 ['p','d'].forEach(function(s){
  if(E.dr[s]>=DR_MAX&&E.hp[s]>0){
   E.dr[s]=0;E.hp[s]=Math.min(HP_MAX,E.hp[s]+1);E.skip[s]=true;reshuffle();E.fx.push({k:'faint',s:s});E.fxT=Math.min(1.8,(E.fxT||0)+.8);
   log(SAY[s]+'醉倒翻桌：酒醉歸零、回復 1 點生命、跳過下一次行動，酒杯重新洗牌。');
  }});
}

/* ---------- cup actions ---------- */
function selfDrink(side,id){
 var cup=cupOf(id);if(E.phase!=='play'||E.turn!==side||E.pending||!cup)return false;
 var big=E.liquor;E.liquor=false;E.decree[side]=false;
 log(SAY[side]+'選擇自己喝 #'+cup.id+'。');removeCup(cup);
 var r=drinkEffect(side,cup,{src:side,big:big});
 if(checkEnd())return true;finish(r.extra?side:opp(side),r.extra);return true;
}
function toast(side,id){
 var cup=cupOf(id);if(E.phase!=='play'||E.turn!==side||E.pending||!cup||E.decree[side])return false;
 var v=opp(side),big=E.liquor;E.liquor=false;
 log(SAY[side]+'把 #'+cup.id+' 直接敬給'+SAY[v]+'。');removeCup(cup);
 var r=drinkEffect(v,cup,{src:side,big:big});
 if(checkEnd())return true;finish(r.extra?v:side,r.extra);return true;
}
function claim(side,id){
 var cup=cupOf(id);if(E.phase!=='play'||E.turn!==side||E.pending||!cup||E.decree[side])return false;
 var big=E.liquor;E.liquor=false;E.claims[side]++;
 E.pending={from:side,to:opp(side),id:cup.id,big:big};E.aiT=.7;
 log(SAY[side]+'把 #'+cup.id+' 蓋上銀蓋，宣稱是瓊漿，敬給'+SAY[opp(side)]+'。');
 return true;
}
function respond(believe){
 var pd=E.pending;if(!pd||E.phase!=='play')return false;
 var cup=cupOf(pd.id),a=pd.from,b=pd.to,truthful=cup.t==='nectar';E.pending=null;
 if(!truthful)E.lies[a]++;
 removeCup(cup);var next,extra=false;
 if(believe){
  log(SAY[b]+'選擇相信，喝下 #'+cup.id+'。');
  if(truthful){E.dr.p=Math.max(0,E.dr.p-1);E.dr.d=Math.max(0,E.dr.d-1);log('那杯真的是瓊漿：雙方酒醉各 −1。')}
  var r=drinkEffect(b,cup,{src:a,big:pd.big});
  if(!truthful&&E.hp[b]>0){E.dr[a]=Math.min(DR_MAX,E.dr[a]+1);log(SAY[a]+'說謊被揭穿，酒醉額外 +1。')}
  extra=!!r.extra;next=extra?b:a;
 }else if(!truthful){
  log(SAY[b]+'質疑成功！#'+cup.id+' 不是瓊漿，'+SAY[a]+'被迫自己喝下。');
  drinkEffect(a,cup,{src:a,big:pd.big,noExtra:true});
  if(E.hp[a]>0){E.dr[a]=Math.min(DR_MAX,E.dr[a]+1);log(SAY[a]+'說謊被揭穿，酒醉額外 +1。')}
  next=b;
 }else{
  log(SAY[b]+'質疑失敗，#'+cup.id+' 真的是瓊漿。'+SAY[b]+'被迫喝下，不回血、沒有額外行動。');
  drinkEffect(b,cup,{src:a,noHeal:true,noExtra:true});
  if(E.hand[b].length){var di=Math.floor(rnd()*E.hand[b].length),gone=E.hand[b].splice(di,1)[0];log(SAY[b]+'隨機棄掉一件道具：'+ITEMS[gone].name+'。')}
  next=a;
 }
 rotateTable();if(E.cups.length>1)log('圓桌旋轉了一個位置。');
 if(checkEnd())return true;finish(next,extra);return true;
}

/* ---------- turn flow, acts, ending ---------- */
function beginTurn(side,keep){
 if(!keep){E.used={};E.lock=false}
 if(E.skip[side]){E.skip[side]=false;log(SAY[side]+'醉得跳過這次行動。');var o=opp(side);E.turn=o;E.extra=false;return beginTurn(o,false)}
 E.turn=side;E.sel=0;E.aiT=.6+rnd()*.5;E.v++;
}
function finish(next,extra){
 if(E.phase!=='play')return;
 resolveFaints();
 if(E.cups.length===0){endAct();if(E.phase!=='play')return}
 E.extra=!!extra;beginTurn(next,!!extra);
}
function pay(key,label){
 if(E.paid[key])return;E.paid[key]=1;var n=BONUS[key];E.earned+=n;S.balance+=n;save();renderAll();
 if(analytics)AN.progress(analytics,{stage:E.act,step:E.act,score:E.hp.p,bonus_points:n,total_bonus_points:E.earned});
 log('BONUS +'+n+' 點已入帳：'+label+'。');say('BONUS +'+n+' 點已入帳：'+label+'。','win');
}
function endAct(){
 var n=E.act;
 if(n<=3)pay('a'+n,n===1?'撐過第一幕':n===2?'撐過第二幕':'撐過第三幕');
 E.dr.p=Math.max(0,E.dr.p-1);E.dr.d=Math.max(0,E.dr.d-1);E.liquor=false;
 if(n<3){log('酒杯喝完了，雙方酒醉各 −1。');deal(n+1);return}
 if(n===3){
  if(E.hp.p!==E.hp.d){endGame(E.hp.p>E.hp.d?'p':'d','life');return}
  log('第三幕結束，生命相同！進入 3 分鐘延長賽。');E.ot=OT_SECONDS;deal(4);return}
 log('延長賽換下一輪酒杯。');deal(4);
}
function checkEnd(){
 if(E.phase!=='play')return true;
 var a=E.hp.p<=0,b=E.hp.d<=0;
 if(a||b){endGame(a&&b?'draw':a?'d':'p','hp');return true}
 return false;
}
function endGame(w,why){
 if(E.phase==='over')return;
 E.phase='over';E.pending=null;E.result={w:w,why:why};
 if(w==='p'){pay('win','贏得這場晚宴');wins++;try{localStorage.setItem('deep-sea-banquet-best',wins)}catch(e){}}
 log(w==='p'?'你贏了這場晚宴！':w==='d'?'莊家贏了這場晚宴。':'生命相同，平手。');
 var res=E.earned>0?'complete':'loss';
 if(analytics){AN.end(analytics,E.earned,res,{score:E.hp.p,step:E.act,stage:E.act});analytics=null}
 bqBusy=false;save();renderAll();
 var head=w==='p'?'你贏了！':w==='d'?(why==='quit'?'你放棄了這一局。':'莊家贏了。'):'平手。';
 say(head+(E.earned>0?'本局共入帳 '+fmt(E.earned)+' 點。':'這一局沒有點數。'),E.earned>0||w==='p'?'win':'lose');
}

/* ---------- host AI: only public information, its own scans and what the player has revealed ---------- */
function aiEstimate(){
 var K=E.known.d,pool={poison:Math.max(0,E.comp.poison-E.out.poison),nectar:Math.max(0,E.comp.nectar-E.out.nectar),truth:Math.max(0,E.comp.truth-E.out.truth)};
 var unk=E.cups.filter(function(c){var k=K[c.id];return!k||!k.t||k.t==='safe'||k.t==='danger'||k.maybe});
 E.cups.forEach(function(c){var k=K[c.id];if(k&&k.t&&!k.maybe&&pool[baseKind(k.t)]>0&&k.t!=='safe'&&k.t!=='danger')pool[baseKind(k.t)]--});
 var n=Math.max(1,unk.length);
 return{poison:Math.min(1,pool.poison/n),nectar:Math.min(1,pool.nectar/n)};
}
function aiView(c){
 var k=E.known.d[c.id],est=aiEstimate();
 if(k&&k.t&&!k.maybe){
  if(k.t==='poison'||k.t==='poison2')return{kind:'poison',p:1};
  if(k.t==='pnectar')return{kind:'pnectar',p:0};
  if(k.t==='nectar')return{kind:'nectar',p:0};
  if(k.t==='safe')return{kind:'safe',p:0,n:Math.min(.4,est.nectar)};
  if(k.t==='danger')return{kind:'danger',p:.95};
  return{kind:k.t,p:0};
 }
 if(k&&k.t&&k.maybe){var bad=(k.t==='poison'||k.t==='poison2'||k.t==='danger');return{kind:'guess',p:bad?.7*1+.3*est.poison:.3*est.poison,n:k.t==='nectar'?.6:0}}
 return{kind:'unk',p:est.poison,n:est.nectar};
}
function aiPickUnknown(list){return list.length?pick(list):null}
function aiPlan(){
 var cups=E.cups,views=cups.map(function(c){return{c:c,v:aiView(c)}}),forced=E.decree.d,hp=E.hp.d;
 var nect=views.filter(function(x){return x.v.kind==='nectar'||x.v.kind==='pnectar'});
 if(nect.length){nect.sort(function(a,b){return(b.v.kind==='pnectar')-(a.v.kind==='pnectar')});return{kind:'self',cup:nect[0].c,why:'nectar'}}
 var pois=views.filter(function(x){return x.v.kind==='poison'||x.v.kind==='danger'});
 var safe=views.filter(function(x){return x.v.p<=.05&&x.v.kind!=='nectar'});
 var lowHp=hp<=2;
 if(forced){
  var best=views.slice().sort(function(a,b){return a.v.p-b.v.p})[0];return{kind:'self',cup:best.c,why:'forced'}
 }
 if(pois.length){
  var c=pick(pois).c;
  if(rnd()<(lowHp?.2:.4)&&E.cups.length>1)return{kind:'claim',cup:c,why:'bluff'};
  return{kind:'toast',cup:c,why:'poison'};
 }
 if(safe.length&&rnd()<.6){
  var s=pick(safe).c;return rnd()<.5?{kind:'toast',cup:s,why:'safe'}:{kind:'self',cup:s,why:'safe'};
 }
 var unk=views.filter(function(x){return x.v.kind==='unk'||x.v.kind==='guess'}),cand=unk.length?unk:views,v=pick(cand),p=v.v.p;
 if(p>=.5){return rnd()<.35&&cups.length>1?{kind:'claim',cup:v.c,why:'bluff'}:{kind:'toast',cup:v.c,why:'risky'}}
 if(p>=.3){if(lowHp)return rnd()<.5?{kind:'claim',cup:v.c,why:'bluff'}:{kind:'toast',cup:v.c,why:'risky'};return rnd()<.5?{kind:'self',cup:v.c,why:'gamble'}:{kind:'toast',cup:v.c,why:'gamble'}}
 return rnd()<.8?{kind:'self',cup:v.c,why:'safe'}:{kind:'claim',cup:v.c,why:'bluff'};
}
function aiHas(key){return E.hand.d.indexOf(key)>=0&&!canUse('d',key)}
function aiUse(key,id){return useItem('d',key,id).ok}
function aiItemStep(){
 var d=E.dr.d,hp=E.hp.d,plan=null,unknown=E.cups.filter(function(c){return!E.known.d[c.id]});
 if(aiHas('sober')&&d>=3||aiHas('sober')&&hp<=2&&d>=2){if(aiUse('sober'))return true}
 if(aiHas('needle')&&unknown.length&&rnd()<.4+(hp<=2?.3:0)+(d>=2?.1:0)){if(aiUse('needle',pick(unknown).id))return true}
 if(aiHas('scent')&&unknown.length>1&&rnd()<.3){if(aiUse('scent',pick(unknown).id))return true}
 if(aiHas('decree')&&!E.decree.p&&rnd()<.5){if(aiUse('decree'))return true}
 if(aiHas('spin')&&E.publicScan>0&&rnd()<.5){if(aiUse('spin'))return true}
 plan=aiPlan();E.aiPlan=plan;
 if(plan.why==='forced'&&aiHas('ice')){var kp=E.cups.filter(function(c){var k=E.known.d[c.id];return k&&!k.maybe&&(k.t==='poison'||k.t==='poison2'||k.t==='pnectar')});if(kp.length){if(aiUse('ice',kp[0].id))return true}}
 if(plan.why==='forced'&&aiHas('change')){var kq=E.cups.filter(function(c){var k=E.known.d[c.id];return k&&!k.maybe&&k.t==='poison'});if(kq.length){if(aiUse('change',kq[0].id))return true}}
 if(plan.kind==='toast'&&plan.why==='poison'){
  var k1=E.known.d[plan.cup.id];
  if(aiHas('powder')&&k1&&k1.t==='poison'&&!k1.maybe&&rnd()<.7){if(aiUse('powder',plan.cup.id)){E.known.d[plan.cup.id]={t:'poison2',maybe:false};return true}}
  if(aiHas('liquor')&&rnd()<.6){if(aiUse('liquor'))return true}
 }
 if(plan.kind==='self'&&plan.why==='nectar'){
  var k2=E.known.d[plan.cup.id];
  if(aiHas('powder')&&k2&&k2.t==='nectar'&&!k2.maybe&&rnd()<.6){if(aiUse('powder',plan.cup.id)){E.known.d[plan.cup.id]={t:'pnectar',maybe:false};return true}}
 }
 return false;
}
function aiRespond(){
 var pd=E.pending,c=cupOf(pd.id),k=E.known.d[c.id],est=aiEstimate(),rate;
 if(k&&k.t&&!k.maybe&&k.t!=='safe'&&k.t!=='danger')rate=k.t==='nectar'?.08:.95;
 else if(k&&k.maybe&&k.t==='nectar')rate=.3;
 else if(k&&k.t==='safe')rate=.3;
 else if(k&&k.t==='danger')rate=.9;
 else{
  rate=.4+.2*(1-Math.min(1,est.nectar*1.4));
  var cl=E.claims.p,lr=cl>1?E.lies.p/cl:.5;rate+=.2*(lr-.5);
  if(E.seen.p&&E.hand.p.indexOf('powder')>=0)rate+=.1;
  if(est.nectar<=0)rate=Math.max(rate,.85);
  rate=Math.max(.3,Math.min(.8,rate));
 }
 if(E.hp.d<=1&&!(k&&k.t==='nectar'))rate=Math.min(.85,rate+.1);
 respond(rnd()>=rate);
}
function aiStep(){
 if(E.phase!=='play')return;
 if(E.pending){if(E.pending.to==='d')aiRespond();return}
 if(E.turn!=='d')return;
 if(aiItemStep())return;
 var plan=E.aiPlan||aiPlan();E.aiPlan=null;
 if(!cupOf(plan.cup.id))plan=aiPlan();
 if(plan.kind==='claim'&&!ADV)plan={kind:aiView(plan.cup).p>=.5?'toast':'self',cup:plan.cup};
 if(E.decree.d)plan={kind:'self',cup:plan.cup};
 if(plan.kind==='self')selfDrink('d',plan.cup.id);
 else if(plan.kind==='claim'&&E.cups.length>=1)claim('d',plan.cup.id);
 else toast('d',plan.cup.id);
}

/* ---------- time ---------- */
function tick(dt){
 if(E.phase!=='play')return;
 if(E.act===4){
  E.ot-=dt;
  if(E.ot<=0){E.ot=0;log('延長賽時間到！比較生命。');endGame(E.hp.p>E.hp.d?'p':E.hp.p<E.hp.d?'d':'draw','time');return}
 }
 if(E.fxT>0){E.fxT-=dt;if(E.fxT>0)return}
 if(E.pending?E.pending.to==='d':E.turn==='d'){E.aiT-=dt;if(E.aiT<=0){E.aiT=.55+rnd()*.45;aiStep()}}
}

/* ---------- sound: tiny synthesized effects, no files; silent when muted or unsupported ---------- */
var AC=null;
function ac(){
 if(MUTED)return null;
 if(!AC){var C=window.AudioContext||window.webkitAudioContext;if(!C)return null;try{AC=new C()}catch(e){return null}}
 try{if(AC.state==='suspended')AC.resume()}catch(e){}
 return AC;
}
function tone(f0,f1,dur,type,vol,delay){
 var c=ac();if(!c)return;
 try{var t=c.currentTime+(delay||0),o=c.createOscillator(),g=c.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol||.12,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+.05)}catch(e){}
}
function noise(dur,vol,delay){
 var c=ac();if(!c)return;
 try{var t=c.currentTime+(delay||0),n=Math.floor(c.sampleRate*dur),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);
  for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  var src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();src.buffer=b;f.type='lowpass';f.frequency.value=900;g.gain.value=vol||.2;
  src.connect(f);f.connect(g);g.connect(c.destination);src.start(t)}catch(e){}
}
var SFX={
 start:function(){tone(110,70,.5,'sawtooth',.1);tone(55,40,.8,'sine',.14)},
 pick:function(){tone(520,430,.07,'square',.05)},
 lift:function(){tone(180,360,.45,'sine',.07)},
 poison:function(){noise(.35,.3);tone(150,38,.45,'sawtooth',.16)},
 nectar:function(){tone(440,660,.14,'triangle',.12);tone(660,990,.3,'triangle',.12,.13)},
 truth:function(){tone(880,1320,.5,'sine',.07);tone(660,990,.5,'sine',.06,.1)},
 water:function(){tone(300,200,.22,'sine',.09)},
 faint:function(){tone(420,50,.9,'sawtooth',.12);noise(.5,.18,.15)},
 item:function(){tone(300,700,.12,'square',.05);tone(700,300,.1,'square',.04,.1)},
 beat:function(){tone(70,45,.14,'sine',.2);tone(60,40,.16,'sine',.16,.2)},
 win:function(){[392,494,587,784].forEach(function(f,i){tone(f,f,.28,'triangle',.11,i*.14)})},
 lose:function(){[300,250,200,130].forEach(function(f,i){tone(f,f*.9,.4,'sawtooth',.09,i*.2)})},
 turn:function(){tone(260,330,.12,'triangle',.07)}
};
function setCls(el,name,on){var c=(' '+el.className+' ');var has=c.indexOf(' '+name+' ')>=0;if(on&&!has)el.className=(el.className+' '+name).trim();else if(!on&&has)el.className=c.replace(' '+name+' ',' ').trim()}
function restart(el,name,ms){setCls(el,name,false);void el.offsetWidth;setCls(el,name,true);if(ms)setTimeout(function(){setCls(el,name,false)},ms)}

/* ---------- interface ---------- */
var $v=$('view-banquet'),cupEls={},lastLogV=-1,lastLogLen=-1;
var CUP_SVG='<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M9 6h22l-2.5 12c-.9 4.6-4 7.5-8.5 7.5s-7.6-2.9-8.5-7.5z" fill="currentColor" stroke="#1b1b2f" stroke-width="2" stroke-linejoin="round"/><path d="M20 25.5V34M12.5 34h15" stroke="#1b1b2f" stroke-width="3" stroke-linecap="round"/></svg>';
var shown=function(){return!$v.hidden&&!document.hidden};
function say(t,kind){var m=$('bq-msg');m.textContent=t;m.className='msg'+(kind?' '+kind:'')}
bqSay=say;
function put(el,text){if(el.__bq!==text){el.__bq=text;el.textContent=text}}
function putAttr(el,name,text){var key='__a'+name;if(el[key]!==text){el[key]=text;el.setAttribute(name,text)}}
function hearts(n){var s='';for(var i=0;i<HP_MAX;i++)s+=i<n?'♥':'♡';return s}
function mmss(sec){var s=Math.max(0,Math.ceil(sec));return Math.floor(s/60)+':'+('0'+s%60).slice(-2)}
function kLabel(side,c){
 var k=E.known[side][c.id];if(!k||!k.t)return'';
 return TICON[k.t]+' '+TNAME[k.t]+(k.maybe?'?':'');
}
function renderCups(){
 var n=E.cups.length,live=E.phase==='play',mine=live&&E.turn==='p'&&!E.pending,seen={};
 E.cups.forEach(function(c,i){
  var el=cupEls[c.id];seen[c.id]=1;
  if(!el){el=document.createElement('button');el.type='button';el.className='bq-cup';el.dataset.id=c.id;el.innerHTML=CUP_SVG+'<span class="bq-num"></span><span class="bq-tag"></span>';
   el.addEventListener('click',function(){pickCup(+el.dataset.id)});$('bq-table').appendChild(el);cupEls[c.id]=el}
  var ang=-Math.PI/2+i*2*Math.PI/Math.max(1,n),x=50+39*Math.cos(ang),y=50+39*Math.sin(ang);
  el.style.left=x+'%';el.style.top=y+'%';
  var k=E.known.p[c.id],label=kLabel('p',c),cls='bq-cup'+(E.sel===c.id?' is-sel':'')+(k&&k.t?' is-known t-'+k.t:'')+(E.pending&&E.pending.id===c.id?' is-claim':'');
  if(el.className!==cls)el.className=cls;
  put(el.children[1],String(c.id));put(el.children[2],label);
  putAttr(el,'aria-pressed',E.sel===c.id?'true':'false');
  putAttr(el,'aria-label','酒杯 #'+c.id+(label?'，你知道的情報：'+label:'，內容未知')+(E.pending&&E.pending.id===c.id?'，銀蓋宣稱是瓊漿':''));
  el.disabled=!mine;
 });
 Object.keys(cupEls).forEach(function(id){if(!seen[id]){cupEls[id].remove();delete cupEls[id]}});
}
function renderHand(){
 var box=$('bq-hand'),mine=E.phase==='play'&&E.turn==='p'&&!E.pending,list=E.hand.p,sig=list.join(',')+'|'+mine+'|'+E.lock+'|'+Object.keys(E.used).join(',')+'|'+E.decree.d+'|'+E.cups.length+'|'+E.sel;
 if(box.__sig===sig)return;box.__sig=sig;box.textContent='';
 if(!list.length){var p=document.createElement('p');p.className='bq-empty';p.textContent='沒有道具';box.appendChild(p);return}
 list.forEach(function(key){
  var def=ITEMS[key],why=mine?canUse('p',key):'現在不是你的回合。',b=document.createElement('button');
  b.type='button';b.className='bq-item'+(why?' is-off':'')+(def.cup&&!E.sel&&!why?' needs-cup':'');b.setAttribute('aria-disabled',why?'true':'false');
  var nm=document.createElement('b');nm.textContent=def.name;var ds=document.createElement('small');ds.textContent=def.desc+(def.cup?'（需先選杯）':'');
  b.appendChild(nm);b.appendChild(ds);
  b.addEventListener('click',function(){playerItem(key)});box.appendChild(b);
 });
}
function renderDealerHand(){
 var t=$('bq-dhand-t'),box=$('bq-dhand'),n=E.hand.d.length,seenNow=E.seen.d,sig=n+'|'+seenNow+'|'+(seenNow?E.hand.d.join(','):'');
 put(t,seenNow?'莊家的道具（已公開）':'莊家的道具（'+n+' 件，內容未知）');
 if(box.__sig===sig)return;box.__sig=sig;box.textContent='';
 if(!n){var p=document.createElement('p');p.className='bq-empty';p.textContent='沒有道具';box.appendChild(p);return}
 E.hand.d.forEach(function(key){var s=document.createElement('span');s.className='bq-back'+(seenNow?' is-open':'');s.textContent=seenNow?ITEMS[key].name:'?';box.appendChild(s)});
}
function renderLog(){
 if(lastLogV===E.v&&lastLogLen===E.log.length)return;lastLogV=E.v;lastLogLen=E.log.length;
 var ol=$('bq-log');ol.textContent='';
 E.log.slice(-LOG_SHOW).reverse().forEach(function(t){var li=document.createElement('li');li.textContent=t;ol.appendChild(li)});
}
function renderNotes(){
 var box=$('bq-notes'),lines=[];
 E.notes.p.forEach(function(n){lines.push('聞香：'+n.ids.map(function(x){return '#'+x}).join(', ')+' 共有 '+n.n+' 杯危險酒'+(n.maybe?'（可能是幻覺）':'')+'。')});
 if(E.seen.p&&E.phase==='play')lines.push('你的手牌已被莊家看見。');
 var sig=lines.join('|');if(box.__sig===sig)return;box.__sig=sig;box.textContent='';
 lines.forEach(function(t){var p=document.createElement('p');p.textContent=t;box.appendChild(p)});
}
function renderChips(){
 var box=$('bq-chips'),live=E.phase==='play',list=[];
 if(live||E.phase==='over')['poison','nectar','truth'].forEach(function(t){
  var left=Math.max(0,E.comp[t]-E.out[t]);if(E.comp[t])list.push({t:t,left:left,all:E.comp[t]});
 });
 var sig=list.map(function(x){return x.t+x.left+'/'+x.all}).join('|');if(box.__sig===sig)return;box.__sig=sig;box.textContent='';
 list.forEach(function(x){var c=document.createElement('span');c.className='bq-chip t-'+x.t+(x.left?'':' is-gone');c.textContent=TICON[x.t]+' '+TNAME[x.t]+' ×'+x.left;box.appendChild(c)});
}
var fxPlayed=0,overPlayed=false,hbT=0,lastTurnKey='';
function floatNum(side,text,cls){
 var host=$('bq-side-'+side),n=document.createElement('span');n.className='bq-float '+cls;n.textContent=text;host.appendChild(n);setTimeout(function(){n.remove()},1300);
}
function playFx(){
 var list=E.fx;if(!list||!list.length)return;E.fx=[];
 var rv=$('bq-reveal'),st=$('bq-stage'),dl=$('bq-dealerbox'),fl=$('bq-flash');
 list.forEach(function(f){
  if(f.k==='reveal'){
   rv.textContent=TICON[f.t]+' '+TNAME[f.t];rv.className='bq-reveal t-'+f.t;restart(rv,'is-on',1500);
   SFX.lift();setTimeout(function(){f.t==='poison'||f.t==='poison2'?SFX.poison():f.t==='nectar'||f.t==='pnectar'?SFX.nectar():f.t==='truth'?SFX.truth():SFX.water()},380);
  }else if(f.k==='hit'){
   floatNum(f.s,'−'+f.n,'is-hit');restart(st,'is-shake',500);restart(fl,'is-red',600);if(f.s==='d')restart(dl,'is-hurt',600);
  }else if(f.k==='heal'){
   floatNum(f.s,'+'+f.n,'is-heal');restart(fl,'is-green',700);
  }else if(f.k==='faint'){
   restart(st,'is-flip',1000);SFX.faint();
  }
 });
}
function render(){
 var live=E.phase==='play',over=E.phase==='over';
 playFx();
 put($('bq-act'),!E.act?'晚宴尚未開始':E.act===4?ACTS[4].name+' '+mmss(E.ot):ACTS[E.act].name);
 ['p','d'].forEach(function(s){
  put($('bq-hp-'+s),hearts(E.hp[s]));put($('bq-hp-'+s+'-t'),'生命 '+E.hp[s]+'/'+HP_MAX);
  put($('bq-dr-'+s),'酒醉 '+E.dr[s]+'/'+DR_MAX+(E.dr[s]>=3?'（醉意上頭）':''));
  put($('bq-items-'+s),'道具 '+E.hand[s].length);
  var box=$('bq-side-'+s),cls='bq-side bq-side-'+s+(live&&E.turn===s?' is-turn':'')+(E.dr[s]>=3?' is-drunk':'');if(box.className!==cls)box.className=cls;
 });
 var oc=E.out;
 renderChips();
 put($('bq-comp'),live||over?'本幕原配：劇毒 '+E.comp.poison+'、瓊漿 '+E.comp.nectar+'、真言水 '+E.comp.truth+' · 桌上還有 '+E.cups.length+' 杯酒 · 已喝出：劇毒 '+oc.poison+'、瓊漿 '+oc.nectar+'、真言水 '+oc.truth+(oc.water?'、清水 '+oc.water:''):'每幕開始時公開各種酒的杯數。');
 put($('bq-center-1'),!E.act?'晚宴尚未開始':over?(E.result.w==='p'?'你贏了':E.result.w==='d'?'莊家贏了':'平手'):'桌上還有 '+E.cups.length+' 杯酒');
 put($('bq-center-2'),over?'到右側再來一場':live?(E.turn==='p'?'輪到你':'輪到莊家'):'按右側開始');
 renderCups();renderHand();renderDealerHand();renderLog();renderNotes();
 var mine=live&&E.turn==='p'&&!E.pending,sel=E.sel?cupOf(E.sel):null,pend=live&&E.pending&&E.pending.to==='p';
 var turn=$('bq-turn');
 put(turn,!live?(over?'這一場結束了。':'按右側「扣點開始晚宴」'):pend?'莊家蓋上了銀蓋，等你決定。':E.turn==='d'?'莊家思考中…':E.decree.p?'你被勸酒令指定：這次只能自己喝。':sel?'已選 #'+sel.id+'：決定怎麼處理這杯酒。':'先點選一杯酒，再決定怎麼處理它。');
 $('bq-act-row').hidden=!mine;
 var forced=E.decree.p;
 $('bq-self').disabled=!sel||E.fxT>0;$('bq-toast').disabled=!sel||forced||E.fxT>0;$('bq-silver').disabled=!sel||forced||E.fxT>0;$('bq-silver').hidden=!ADV;
 $('bq-adv').disabled=bqBusy;put($('bq-adv'),ADV?'進階模式：銀蓋吹牛（開）':'進階模式：銀蓋吹牛（關）');putAttr($('bq-adv'),'aria-pressed',ADV?'true':'false');
 put($('bq-mute'),MUTED?'音效：關':'音效：開');putAttr($('bq-mute'),'aria-pressed',MUTED?'true':'false');
 var dl=$('bq-dealerbox'),dcls='bq-dealer-box'+(live&&(E.turn==='d'||(E.pending&&E.pending.to==='d'))?' is-think':'')+(over&&E.result.w==='p'?' is-dead':'')+(dl.className.indexOf('is-hurt')>=0?' is-hurt':'');
 if(dl.className!==dcls)dl.className=dcls;
 var tk=$('bq-ticker'),last=E.log.length?E.log[E.log.length-1]:'';if(tk.__v!==E.v){tk.__v=E.v;tk.textContent=last;restart(tk,'is-in',0)}
 setCls($('bq-stage'),'is-low',live&&E.hp.p<=1);setCls($('bq-stage'),'is-mine',mine&&!(E.fxT>0));
 if(over&&!overPlayed){overPlayed=true;E.result.w==='p'?SFX.win():SFX.lose()}
 if(!over)overPlayed=false;
 var pr=$('bq-prompt');pr.hidden=!pend;
 if(pend)put($('bq-prompt-t'),'莊家宣稱 #'+E.pending.id+' 是瓊漿。你要相信並喝下，還是質疑？');
 var go=$('bq-go');go.disabled=bqBusy;put(go,bqBusy?'晚宴進行中':over?'扣點再辦一場':'扣點開始晚宴');
 $('bq-quit').hidden=!bqBusy;put($('bq-quit'),quitArm>0?'再按一次確認放棄':'放棄本局（不退點）');
 put($('bq-stage-t'),!E.act?'未開始':SHORT[E.act]);
 put($('bq-bonus'),E.earned+' 點');put($('bq-best'),wins+' 場');
}
function pickCup(id){
 if(E.phase!=='play'||E.turn!=='p'||E.pending||!cupOf(id))return;
 E.sel=E.sel===id?0:id;E.v++;if(E.sel)SFX.pick();render();
}
function playerItem(key){
 if(E.phase!=='play'||E.fxT>0)return;
 var r=useItem('p',key,E.sel);
 if(!r.ok){say(r.msg,'lose');render();return}
 if(r.msg)say(r.msg,'win');
 if(!cupOf(E.sel))E.sel=0;render();
}
function playerAct(kind){
 if(E.phase!=='play'||E.turn!=='p'||E.pending||E.fxT>0)return;
 if(kind==='claim'&&!ADV)return;
 if(!E.sel){say('請先點選一杯酒。','lose');return}
 var id=E.sel;E.sel=0;
 if(kind==='self')selfDrink('p',id);else if(kind==='toast')toast('p',id);else claim('p',id);
 render();
}
function playerRespond(believe){if(E.fxT>0)return;if(E.pending&&E.pending.to==='p')respond(believe);render()}
function start(){
 if(bqBusy)return;
 var amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return}
 analytics=AN.start('banquet',amount);bqStake=amount;bqBusy=true;S.balance-=amount;save();renderAll();
 fresh();E.phase='play';quitArm=0;log('晚宴開始。你先行動。');deal(1);beginTurn('p',false);
 say(ADV?'晚宴開始！先點選一杯酒，再決定自己喝、敬給莊家，或蓋上銀蓋騙他。':'晚宴開始！先點選一杯酒，再決定自己喝或敬給莊家。');SFX.start();render();$('bq-stage').focus({preventScroll:true});
}
function quit(){
 if(!bqBusy)return;
 if(quitArm<=0){quitArm=4;render();return}
 quitArm=0;log('你放棄了這一局。');endGame('d','quit');render();
}
$('bq-go').addEventListener('click',start);
$('bq-quit').addEventListener('click',quit);
$('bq-adv').addEventListener('click',function(){if(bqBusy)return;ADV=!ADV;try{localStorage.setItem('deep-sea-banquet-adv',ADV?'1':'0')}catch(e){}render()});
$('bq-mute').addEventListener('click',function(){MUTED=!MUTED;try{localStorage.setItem('deep-sea-banquet-mute',MUTED?'1':'0')}catch(e){}if(!MUTED)SFX.pick();render()});
$('bq-self').addEventListener('click',function(){playerAct('self')});
$('bq-toast').addEventListener('click',function(){playerAct('toast')});
$('bq-silver').addEventListener('click',function(){playerAct('claim')});
$('bq-believe').addEventListener('click',function(){playerRespond(true)});
$('bq-doubt').addEventListener('click',function(){playerRespond(false)});
addEventListener('keydown',function(e){
 if(!shown()||E.phase!=='play'||e.metaKey||e.altKey||e.ctrlKey)return;
 if(['INPUT','BUTTON','A','SUMMARY','TEXTAREA'].indexOf(e.target.tagName)>=0)return;
 if(/^[1-8]$/.test(e.key)&&cupOf(+e.key)){e.preventDefault();pickCup(+e.key)}
});
var last=0;
function loop(t){
 var dt=Math.min(.1,Math.max(0,(t-last)/1000)||0);last=t;
 if(shown()){if(quitArm>0){quitArm-=dt;if(quitArm<=0){quitArm=0}}tick(dt);render();if(E.phase==='play'&&E.hp.p<=1){hbT-=dt;if(hbT<=0){hbT=1.1;SFX.beat()}}}
 requestAnimationFrame(loop);
}
addEventListener('blur',function(){last=performance.now()});
document.addEventListener('visibilitychange',function(){last=performance.now()});
window.addEventListener('hashchange',function(){last=performance.now()});
render();requestAnimationFrame(loop);
  })();
