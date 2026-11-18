// Simulation stays in the game's closure; the model never touches points or tracking.
var frontierClassic=false; // tests can switch the first region back to the beacon rules
function frontierPlan(level){
 var c=Math.floor((level-1)/10),n=(level-1)%10;
 return {level:level,chapter:c,mission:!frontierClassic?'war':n===9?'boss':['build','rescue','hunt','defend','elite','rescue','defend','hunt','elite'][n],wood:24+c*6+n*2,stone:14+c*4+n,enemies:4+c*2+Math.floor(n/2),hp:36+c*13+n*3,damage:9+c*3+Math.floor(n/3),windup:Math.max(.62,1.18-c*.09-n*.015),waves:2+c,hold:24+c*6,night:150-c*12,width:1200+c*300,height:900+c*150,trees:160+c*45,requiredCamps:c>=2?c-1:0,assaultWaves:3+c+Math.floor(n/4),waveGap:Math.max(18,32-c*3-Math.floor(n/3)),war:!frontierClassic,enemyHp:3000+level*400,enemyDamage:4+Math.round(level*.35),fighterCap:12+c*4,towers:2+c,guards:2+c*2};
}
var FRONTIER_CARDS=[
 {id:'tool',name:'採集工具',desc:'採集更快、一次拿更多',key:'tool',max:8},
 {id:'blade',name:'戰鬥武器',desc:'主角、戰士與箭塔的攻擊更強',key:'blade',max:8},
 {id:'pack',name:'背包容量',desc:'背包容量增加',key:'pack',max:8}
];
function frontierTech(t){t=t||{};function n(v){v=Number(v)|0;return Math.max(0,Math.min(8,v));}return {tool:n(t.tool),blade:n(t.blade),pack:n(t.pack),heart:n(t.heart),boots:n(t.boots),warrior:n(t.warrior),towerup:n(t.towerup)};}
function frontierMaxHp(w){return 100+(w.tech.heart||0)*20;}
function frontierFighterHp(w){return 100+w.cfg.chapter*20+(w.tech.warrior||0)*15;}
// Gold fills a meter; each full meter offers three random upgrade cards (replaces the old shop).
function frontierPickCost(w){var picks=0;for(var k in w.tech)picks+=w.tech[k]|0;return 30+picks*36;}
function frontierDraw(w){
 var pool=FRONTIER_CARDS.filter(function(c){return (w.tech[c.key]|0)<c.max;}),out=[];
 while(out.length<3&&pool.length){var i=Math.floor(Math.random()*pool.length);out.push(pool.splice(i,1)[0].id);}
 return out;
}
function frontierChoose(w,index){
 if(!w.offer||!Number.isInteger(index)||index<0||index>=w.offer.length)return false;
 var card=FRONTIER_CARDS.find(function(c){return c.id===w.offer[index];});if(!card)return false;
 w.tech[card.key]=(w.tech[card.key]|0)+1;if(card.key==='heart')w.p.hp=Math.min(frontierMaxHp(w),w.p.hp+20);
 w.offer=null;return true;
}
function frontierWorld(level,tech,coins){
 var cfg=frontierPlan(level),seed=level*1973;
 function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
 var flip=level%2?-1:1,offset=(level%3-1)*35;
 var w={version:1,level:level,cfg:cfg,tech:frontierTech(tech),offer:null,coins:Math.max(0,Number(coins)||0),siege:{wave:0,next:cfg.war?100:40},fighters:[],failure:"",workers:[],supplies:[],drops:[],raids:0,raidAt:75,depotReady:false,settled:false,time:0,phase:'play',p:{x:180,y:450,hp:100,inv:0,attack:0,dash:0,dx:1,dy:0},bag:{wood:0,stone:0},bank:{wood:0,stone:0},nodes:[],enemies:[],shots:[],effects:[],kills:0,rescued:0,hold:0,wave:0,waveAt:0,heal:35,worker:0,threat:0,
 buildings:[{kind:'camp',x:180,y:450,built:true,wood:0,stone:0},{kind:'mill',x:320,y:450+flip*230,built:false,wood:cfg.wood,stone:0},{kind:'forge',x:330,y:450-flip*230,built:false,wood:12,stone:cfg.stone},{kind:'bridge',x:590,y:450,built:false,wood:cfg.wood+10,stone:cfg.stone},{kind:'tower',x:860,y:450+offset,built:false,wood:cfg.wood,stone:cfg.stone+6,cd:0},{kind:'beacon',x:1090,y:450-offset,built:false,wood:cfg.wood,stone:cfg.stone}],cages:[{x:880,y:180,open:false},{x:1020,y:700,open:false}]};
 w.buildings.push(
 {kind:'house',x:185,y:620,built:false,wood:16,stone:4,hp:140,maxHp:140},
 {kind:'market',x:370,y:470,built:false,wood:12,stone:6,hp:140,maxHp:140},
 {kind:'quarry',x:430,y:700,built:false,wood:18,stone:12,hp:140,maxHp:140});
 if(cfg.chapter>0)w.buildings.push({kind:'depot',x:cfg.width-380,y:cfg.height-270,built:false,wood:30+cfg.chapter*6,stone:20+cfg.chapter*4,hp:180,maxHp:180});
 if(cfg.war)w.buildings.push({kind:'barracks',x:cfg.width-430,y:250,built:false,wood:30,stone:20,hp:220,maxHp:220,queue:0,train:0});
 if(level>=11&&!cfg.war)w.buildings.push({kind:'barracks',x:450,y:180,built:false,wood:30+cfg.chapter*5,stone:20+cfg.chapter*3,hp:220,maxHp:220,queue:0,train:0});
 w.buildings[0].hp=w.buildings[0].maxHp=360+cfg.chapter*80;
 w.buildings[5].x=cfg.width-110;w.buildings[5].y=cfg.height/2;
 if(cfg.war){w.buildings.splice(5,1);var spots=[[300,375],[300,525],[360,285],[360,615],[250,245],[250,655]];w.buildings[4].x=spots[0][0];w.buildings[4].y=spots[0][1];w.buildings[4].wood=12+level*2;w.buildings[4].stone=6+level;
  for(var ti=1;ti<cfg.towers;ti++)w.buildings.push({kind:'tower',x:spots[ti][0],y:spots[ti][1],built:false,wood:12+level*2,stone:6+level,hp:180,maxHp:180,cd:0});
  w.enemyBase={x:cfg.width-110,y:cfg.height/2,hp:cfg.enemyHp,maxHp:cfg.enemyHp,cool:3};
  for(var gi=0;gi<cfg.guards;gi++)w.fighters.push({x:240+gi%4*26,y:500+Math.floor(gi/4)*30,hp:100+cfg.chapter*20,max:100+cfg.chapter*20,attack:0,role:'guard'});}
 w.cages[1].x=cfg.width-180;w.cages[1].y=cfg.height-170;
 w.buildings.forEach(function(b){b.hp=b.hp||180;b.maxHp=b.maxHp||180;b.repair=0;});
 w.camps=[];
 for(var k=0;k<cfg.requiredCamps;k++)w.camps.push({x:1050+k*250,y:k%2?cfg.height-160:170,hp:120+cfg.chapter*60,maxHp:120+cfg.chapter*60,cool:12});
 for(var i=0;i<cfg.trees;i++){
  var x=70+rand()*(cfg.width-140),y=80+rand()*(cfg.height-160);
  if(x>530&&x<700||w.buildings.concat(w.cages).some(function(b){return Math.hypot(b.x-x,b.y-y)<85;})||w.enemyBase&&Math.hypot(w.enemyBase.x-x,w.enemyBase.y-y)<170){i--;continue;}
  w.nodes.push({x:x,y:y,kind:i%3===0?'stone':'wood',left:6,cool:0,respawn:0});
 }
 // Guaranteed accessible supplies; regeneration prevents a finite-resource softlock.
 w.nodes[0]={x:100,y:320,kind:'stone',left:6,cool:0,respawn:0};w.nodes[1]={x:260,y:340,kind:'wood',left:6,cool:0,respawn:0};
 for(i=0;i<cfg.enemies;i++)frontierSpawn(w,750+rand()*(cfg.width-820),100+rand()*(cfg.height-200),i);
 if(cfg.mission==='boss'||cfg.mission==='elite')frontierSpawn(w,cfg.width-180,cfg.height/2,99);
 return w;
}
function frontierSpawn(w,x,y,i){var boss=i===99,type=boss?'boss':i%4===2&&w.level>3?'ranged':i%4===1&&w.level>1?'charger':'melee',hp=w.cfg.hp*(boss?(w.cfg.mission==='boss'?7:3):1);w.enemies.push({x:x,y:y,type:type,hp:hp,max:hp,state:'walk',t:0,cool:.5+i%3,tx:x,ty:y,hit:false,counted:false,wave:false,radius:boss?27:17});}
function frontierNear(a,b,r){return Math.hypot(a.x-b.x,a.y-b.y)<r;}
function frontierBuilt(w,k){return w.buildings.some(function(b){return b.kind===k&&b.built&&b.hp!==0;});}
function frontierCapacity(w){return 24+w.tech.pack*9+(frontierBuilt(w,'quarry')?12:0);}
function frontierUpgradeLimit(w,k){return frontierBuilt(w,k==='tool'?'mill':k==='blade'?'forge':'quarry')?8:2;}
function frontierUpgradeCost(w,k){return 25+w.tech[k]*30;}
function frontierUpgrade(w,k){
 if(!['tool','blade','pack'].includes(k)||w.phase!=='play'||!frontierNear(w.p,w.buildings[0],105))return false;
 var cost=frontierUpgradeCost(w,k);if(w.tech[k]>=frontierUpgradeLimit(w,k)||w.coins<cost)return false;
 w.coins-=cost;w.tech[k]++;return true;
}
function frontierSell(w,k,count){
 if(!['wood','stone'].includes(k)||!Number.isInteger(count)||count<1||count>1000||w.phase!=='play')return false;
 var market=w.buildings.find(function(b){return b.kind==='market';});if(!market||!market.built||market.hp<=0||!frontierNear(w.p,market,100)||w.bank[k]<count)return false;
 w.bank[k]-=count;w.coins+=count*(k==='wood'?2:3);return true;
}
function frontierReady(w){if(w.cfg.war)return !!w.enemyBase&&w.enemyBase.hp<=0;return w.siege.wave>=w.cfg.assaultWaves&&!w.enemies.some(function(e){return e.assault&&e.hp>0;})&&frontierGoal(w)&&frontierBuilt(w,'house')&&frontierBuilt(w,'market')&&frontierBuilt(w,'mill')&&(w.cfg.chapter===0||frontierBuilt(w,'depot'))&&(!w.camps||w.camps.every(function(c){return c.hp<=0;}));}
function frontierLeave(w){if(w.phase!=='play'||w.buildings[0].hp<=0||!frontierBuilt(w,'beacon'))return false;w.phase='clear';return true;}
function frontierMigrate(w){
 // Additive migration: keep coordinates, inventory, equipment and progress of version-1 worlds.
 var sample=frontierWorld(w.level,w.tech,w.coins),old=!Array.isArray(w.workers);w.tech=frontierTech(w.tech);if(w.offer===undefined)w.offer=null;
 w.cfg=frontierPlan(w.level);w.coins=Math.max(0,Number(w.coins)||0);w.workers=w.workers||[];w.supplies=w.supplies||[];w.drops=w.drops||[];w.camps=w.camps||sample.camps;
 w.raidAt=Number.isFinite(w.raidAt)?w.raidAt:w.time+75;w.raids=w.raids||0;w.settled=!!w.settled;
 if(w.cfg.war){
  var wantTowers=sample.buildings.filter(function(b){return b.kind==='tower';}),haveTowers=w.buildings.filter(function(b){return b.kind==='tower';});
  for(var ti=haveTowers.length;ti<wantTowers.length;ti++)w.buildings.push(wantTowers[ti]);
  haveTowers.forEach(function(b,ti){if(wantTowers[ti]){b.x=wantTowers[ti].x;b.y=wantTowers[ti].y;}});
  var hut=w.buildings.find(function(b){return b.kind==='barracks';}),eastHut=sample.buildings.find(function(b){return b.kind==='barracks';});
  if(hut&&eastHut&&hut.x<678)w.buildings[w.buildings.indexOf(hut)]=eastHut;
  if(!w.fighters.some(function(a){return a.role==='guard';}))sample.fighters.filter(function(a){return a.role==='guard';}).forEach(function(a){w.fighters.push(a);});
 }
 if(w.cfg.war&&!w.enemyBase){w.enemyBase=sample.enemyBase;w.buildings=w.buildings.filter(function(b){return b.kind!=='beacon';});var tw=w.buildings.find(function(b){return b.kind==='tower';}),st=sample.buildings.find(function(b){return b.kind==='tower';});if(tw&&st){tw.x=st.x;tw.y=st.y;}}
 sample.buildings.forEach(function(b){if(!w.buildings.some(function(a){return a.kind===b.kind;}))w.buildings.push(b);});
 w.buildings.forEach(function(b){b.maxHp=b.maxHp||180;b.hp=Number.isFinite(b.hp)?b.hp:b.maxHp;b.repair=0;});
 if(old)sample.nodes.forEach(function(n){if(w.nodes.length<w.cfg.trees&& !w.nodes.some(function(a){return Math.hypot(a.x-n.x,a.y-n.y)<24;}))w.nodes.push(n);});
 if(!w.siege){var camp=w.buildings[0],ratio=camp.maxHp?camp.hp/camp.maxHp:1;camp.maxHp=360+w.cfg.chapter*80;camp.hp=Math.max(0,Math.round(camp.maxHp*ratio));w.siege={wave:0,next:40};}w.fighters=w.fighters||[];w.failure=w.failure||'';w.effects=[];return w;
}
function frontierCollect(w){
 var room=frontierCapacity(w)-w.bag.wood-w.bag.stone,wood=0,stone=0;
 function take(a,k){var amount=Math.min(room,a[k]);if(amount<=0)return;a[k]-=amount;w.bag[k]+=amount;room-=amount;if(k==='wood')wood+=amount;else stone+=amount;}
 w.supplies.forEach(function(d){if(room<=0||!frontierNear(w.p,d,58))return;var amount=Math.min(room,d.amount);d.amount-=amount;w.bag[d.kind]+=amount;room-=amount;if(d.kind==='wood')wood+=amount;else stone+=amount;});
 w.supplies=w.supplies.filter(function(d){return d.amount>0;});
 // Carried worker cargo remains collectible too; the same inventory is debited before any delivery.
 w.workers.forEach(function(a){if(room>0&&frontierNear(w.p,a,42)){take(a,'wood');take(a,'stone');}});
 if(wood+stone)w.effects.push({x:w.p.x,y:w.p.y-20,t:1.2,kind:'pickup',wood:wood,stone:stone});
 return wood+stone;
}
function frontierWorkers(w,dt){
 w.supplies.forEach(function(d){d.wait=Math.max(0,d.wait-dt);});
 var house=w.buildings.find(function(b){return b.kind==='house';}),roles=[];if(house&&house.built&&house.hp>0){roles=['wood','wood'];if(frontierBuilt(w,'mill'))roles.push('wood');if(frontierBuilt(w,'quarry'))roles.push('stone');for(var ri=0;ri<w.rescued;ri++)roles.push(ri%2?'stone':'wood');}var count=roles.length;
 while(w.workers.length<count)w.workers.push({x:180,y:600,wood:0,stone:0,target:-1,t:0,mode:'wood'});
 w.workers.forEach(function(a,i){
  if(i>=count)return;a.mode=roles[i];a.t-=dt;
  var depots=w.buildings.filter(function(b){return b.built&&b.hp>0&&(b.kind==='camp'||b.kind==='depot');});
  var home=depots.slice().sort(function(b,c){return Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(a.x-c.x,a.y-c.y);})[0];
  if(!home)return;
  if(a.wood+a.stone>=5){
   if(frontierNear(a,home,30)){w.bank.wood+=a.wood;w.bank.stone+=a.stone;w.effects.push({x:home.x,y:home.y-25,t:1.2,kind:'delivery',wood:a.wood,stone:a.stone});a.wood=a.stone=0;a.target=-1;return;}
   frontierWorkerMove(a,home,dt);return;
  }
  var pile=w.supplies.find(function(d){return d.kind===a.mode&&frontierNear(a,d,55);});
  if(pile){if(pile.wait>0)return;var picked=Math.min(5-a.wood-a.stone,pile.amount);a[pile.kind]+=picked;pile.amount-=picked;w.supplies=w.supplies.filter(function(d){return d.amount>0;});if(a.wood+a.stone>=5)return;}
  var node=w.nodes[a.target];
  if(!node||node.left<=0||node.kind!==a.mode){
   var best=Infinity;a.target=-1;w.nodes.forEach(function(n,j){if(n.left<=0||n.kind!==a.mode||n.x>530&&!frontierBuilt(w,'bridge'))return;var d=Math.hypot(a.x-n.x,a.y-n.y);if(d<best){best=d;a.target=j;}});node=w.nodes[a.target];
  }
  if(!node)return;
  if(!frontierNear(a,node,30)){frontierWorkerMove(a,node,dt);return;}
  if(a.t<=0){var gain=Math.min(node.left,1+Math.floor(w.tech.tool/3)+(frontierBuilt(w,node.kind==='wood'?'mill':'quarry')?1:0),5-a.wood-a.stone);node.left-=gain;node.respawn=14;w.supplies.push({x:node.x+12,y:node.y+10,kind:node.kind,amount:gain,wait:.65});a.t=frontierBuilt(w,'mill')?.65:1.1;w.effects.push({x:node.x,y:node.y,t:.3,kind:node.kind,gain:gain,empty:node.left===0});}
 });
}
function frontierWaypoint(a,target){
 var crossing=(a.x<552&&target.x>678)||(a.x>678&&target.x<552)||(a.x>=552&&a.x<=678);
 if(crossing){if(Math.abs(a.y-450)>12)return {x:a.x,y:450};return {x:target.x>615?710:525,y:450};}return target;
}
function frontierWorkerMove(a,target,dt){
 var waypoint=frontierWaypoint(a,target),x=waypoint.x,y=waypoint.y;
 var dist=Math.hypot(x-a.x,y-a.y);if(dist>1){a.x+=(x-a.x)/dist*Math.min(dist,120*dt);a.y+=(y-a.y)/dist*Math.min(dist,120*dt);}
}
function frontierAttackers(w){return w.fighters.filter(function(a){return a.role!=='guard';});}
function frontierFighterCap(w){return w.cfg.war?w.cfg.fighterCap:4+w.cfg.chapter;}
function frontierRecruitCost(w){return {wood:18+w.cfg.chapter*2,stone:10+w.cfg.chapter};}
function frontierRecruit(w){
 var b=w.buildings.find(function(b){return b.kind==='barracks';}),cost=frontierRecruitCost(w),cap=frontierFighterCap(w);
 if(w.phase!=='play'||!b||!b.built||b.hp<=0||!frontierNear(w.p,b,110)||frontierAttackers(w).length+(b.queue||0)>=cap||w.bank.wood+w.bag.wood<cost.wood||w.bank.stone+w.bag.stone<cost.stone)return false;
 ['wood','stone'].forEach(function(k){var need=cost[k],fromBank=Math.min(need,w.bank[k]);w.bank[k]-=fromBank;w.bag[k]-=need-fromBank;});b.queue=(b.queue||0)+1;return true;
}
function frontierSiege(w,dt){
 w.siege.next-=dt;
 if(w.siege.next<=0&&w.enemies.filter(function(e){return e.hp>0;}).length<65){
  w.siege.wave++;w.siege.next=w.siege.wave>=w.cfg.assaultWaves?w.cfg.waveGap+10:w.cfg.waveGap;
  var count=Math.min(18,3+w.cfg.chapter*2+w.siege.wave);
  for(var i=0;i<count;i++){var side=(i+w.siege.wave)%3,x=side===0?65:side===1?400:frontierBuilt(w,'bridge')?w.cfg.width-75:470,y=side===1?65:80+(i*83+w.siege.wave*41)%(w.cfg.height-160);frontierSpawn(w,x,y,i+w.siege.wave);var enemy=w.enemies[w.enemies.length-1];enemy.raider=true;enemy.assault=true;enemy.wave=true;}
 }
 var barracks=w.buildings.find(function(b){return b.kind==='barracks';});
 if(barracks&&barracks.built&&barracks.hp>0&&barracks.queue>0){barracks.train=(barracks.train||0)+dt;if(barracks.train>=3){barracks.train=0;barracks.queue--;w.fighters.push({x:barracks.x,y:barracks.y,hp:100+w.cfg.chapter*20,max:frontierFighterHp(w),attack:0});}}
 var camp=w.buildings[0],eb=w.cfg.war?w.enemyBase:null;
 // Missing guards are replaced one by one while the hero stands at the barracks (like training).
 var hutNear=w.buildings.find(function(b){return b.kind==='barracks';});
 if(w.cfg.war&&w.cfg.guards>0&&hutNear&&hutNear.built&&hutNear.hp>0&&frontierNear(w.p,hutNear,110)&&w.fighters.filter(function(a){return a.role==='guard'&&a.hp>0;}).length<w.cfg.guards){w.guardTimer=(w.guardTimer||0)+dt;if(w.guardTimer>=3){w.guardTimer=0;w.fighters.push({x:hutNear.x,y:hutNear.y,hp:frontierFighterHp(w),max:frontierFighterHp(w),attack:0,role:'guard'});}}
 if(eb&&eb.hp>0){eb.cool-=dt;var victim=w.fighters.filter(function(a){return a.hp>0&&frontierNear(a,eb,150);}).sort(function(a,b){return Math.hypot(a.x-eb.x,a.y-eb.y)-Math.hypot(b.x-eb.x,b.y-eb.y);})[0];
  if(victim&&eb.cool<=0){victim.hp=Math.max(0,victim.hp-w.cfg.enemyDamage);eb.cool=2.2;w.effects.push({x:victim.x,y:victim.y,t:.22,kind:'hit'});}}
 w.fighters.forEach(function(a,i){if(a.hp<=0)return;a.attack-=dt;
  if(a.role==='guard'){
   var foe=w.enemies.filter(function(e){return e.hp>0&&(frontierNear(e,camp,330)||frontierNear(e,a,150));}).sort(function(b,c){return Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(a.x-c.x,a.y-c.y);})[0];
   if(foe){if(frontierNear(a,foe,46)){if(a.attack<=0){foe.hp-=14+w.tech.blade*3+(frontierBuilt(w,'forge')?6:0);a.attack=.8;w.effects.push({x:foe.x,y:foe.y,t:.22,kind:'hit'});}}else frontierWorkerMove(a,foe,dt);return;}
   var post={x:camp.x+60+Math.cos(i*2.4)*70,y:camp.y+Math.sin(i*2.4)*70};if(!frontierNear(a,post,15))frontierWorkerMove(a,post,dt);return;
  }
  if(eb){
   var mob=w.enemies.filter(function(e){return e.hp>0&&frontierNear(e,a,150);}).sort(function(b,c){return Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(a.x-c.x,a.y-c.y);})[0];
   if(mob){if(frontierNear(a,mob,46)){if(a.attack<=0){mob.hp-=14+w.tech.blade*3+(frontierBuilt(w,'forge')?6:0);a.attack=.8;w.effects.push({x:mob.x,y:mob.y,t:.22,kind:'hit'});}}else frontierWorkerMove(a,mob,dt);return;}
   if(eb.hp>0){var spot={x:eb.x-62+Math.cos(i*2.1)*18,y:eb.y+Math.sin(i*2.1)*52};
    if(frontierNear(a,eb,92)){if(a.attack<=0){eb.hp=Math.max(0,eb.hp-(5+w.tech.blade*1.5+(frontierBuilt(w,'forge')?2:0)));a.attack=1.8;w.effects.push({x:eb.x-20+(i%3)*20,y:eb.y-30,t:.22,kind:'hit'});}}
    else frontierWorkerMove(a,spot,dt);return;}
   return;
  }
  var target=w.enemies.filter(function(e){return e.hp>0&&(frontierNear(e,camp,330)||frontierNear(e,a,150));}).sort(function(b,c){return Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(a.x-c.x,a.y-c.y);})[0];
  if(target){if(frontierNear(a,target,46)){if(a.attack<=0){target.hp-=14+w.tech.blade*3+(frontierBuilt(w,'forge')?6:0);a.attack=.8;w.effects.push({x:target.x,y:target.y,t:.22,kind:'hit'});}}else frontierWorkerMove(a,target,dt);}
  else{var guard={x:camp.x+Math.cos(i*2.4)*85,y:camp.y+Math.sin(i*2.4)*85};if(!frontierNear(a,guard,15))frontierWorkerMove(a,guard,dt);}
 });w.fighters=w.fighters.filter(function(a){return a.hp>0;});
}
function frontierBaseHit(w,damage){var base=w.buildings[0];base.hp=Math.max(0,base.hp-damage);w.effects.push({x:base.x,y:base.y,t:.3,kind:'hit'});if(base.hp===0){w.failure='base';w.phase='dead';}}
function frontierDamage(w,n){if(w.p.inv>0||w.phase!=='play')return;w.p.hp=Math.max(0,w.p.hp-n);w.p.inv=.6;if(w.p.hp===0)w.phase='dead';}
function frontierGoal(w){if(w.cfg.war)return !!w.enemyBase&&w.enemyBase.hp<=0;var m=w.cfg.mission,boss=w.enemies.some(function(e){return e.type==='boss'&&e.hp>0;});return m==='rescue'?w.rescued===2:m==='defend'?w.wave>=w.cfg.waves&&w.hold>=w.cfg.hold&&!w.enemies.some(function(e){return e.wave&&e.hp>0;}):m==='boss'||m==='elite'?!boss:m==='hunt'?w.kills>=w.cfg.enemies:w.kills>=Math.ceil(w.cfg.enemies*.65);}
function frontierStep(w,input,dt){
 if(w.phase!=='play'||w.offer)return;if(w.buildings[0].hp<=0){w.failure='base';w.phase='dead';return;}dt=Math.min(.05,Math.max(0,dt));w.time+=dt;
 var p=w.p,c=w.cfg,bridge=frontierBuilt(w,'bridge'),speed=145,move=Math.hypot(input.x,input.y);
 p.inv=Math.max(0,p.inv-dt);p.dash=Math.max(0,p.dash-dt);p.attack-=dt;
 if(move){p.dx=input.x/move;p.dy=input.y/move;}
 if(input.dash&&p.dash===0&&move){p.dash=2.2;p.inv=.3;w.effects.push({x:p.x,y:p.y,t:.25,kind:'dash'});}
 if(p.dash>1.98)speed=440;
 // Ice requires shorter movements; forge provides cleats. Other regions preserve movement speed.
 speed*=1+(w.tech.boots||0)*.06;
 if(c.chapter===3&&!frontierBuilt(w,'forge'))speed*=.84;
 var nx=Math.max(40,Math.min(c.width-40,p.x+p.dx*(move?speed:0)*dt)),ny=Math.max(45,Math.min(c.height-45,p.y+p.dy*(move?speed:0)*dt));
 if(nx>552&&nx<678&&(!bridge||ny<385||ny>515))nx=p.x;p.x=nx;p.y=ny;
 if(w.buildings.some(function(b){return b.built&&b.hp>0&&(b.kind==='camp'||b.kind==='depot')&&frontierNear(p,b,67);})){
  if(w.bag.wood+w.bag.stone)w.effects.push({x:p.x,y:p.y-25,t:1.2,kind:'delivery',wood:w.bag.wood,stone:w.bag.stone});['wood','stone'].forEach(function(k){w.bank[k]+=w.bag[k];w.bag[k]=0;});var h=Math.max(0,Math.min(w.heal,dt*7,frontierMaxHp(w)-p.hp));w.heal-=h;p.hp+=h;
 }
 var cap=frontierCapacity(w);
 w.nodes.forEach(function(n){if(n.left===0){n.respawn-=dt;if(n.respawn<=0)n.left=6;return;}n.cool-=dt;if(n.cool<=0&&w.bag.wood+w.bag.stone<cap&&frontierNear(n,p,53)){var gain=Math.min(n.left,1+Math.floor(w.tech.tool/2)+(frontierBuilt(w,n.kind==='wood'?'mill':'quarry')?1:0),cap-w.bag.wood-w.bag.stone);n.left-=gain;w.bag[n.kind]+=gain;n.cool=.5/(1+w.tech.tool*.16);n.respawn=14;w.effects.push({x:n.x,y:n.y,t:.3,kind:n.kind,gain:gain,empty:n.left===0,px:p.x,py:p.y});}});
 w.buildings.forEach(function(b){
  if(b.built||!frontierNear(b,p,68)||b.kind==='beacon'&&(!bridge||!frontierReady(w))||b.kind==='tower'&&!bridge&&!c.war)return;
  b.charge=(b.charge||0)+dt;if(b.charge<.07)return;b.charge=0;
  ['wood','stone'].forEach(function(k){if(b[k]>0){if(w.bag[k]>0){w.bag[k]--;b[k]--;}else if(w.bank[k]>0){w.bank[k]--;b[k]--;}}});
  if(b.wood+b.stone===0){b.built=true;w.effects.push({x:b.x,y:b.y,t:1,kind:'build'});}
 });
 w.buildings.forEach(function(b){if(!b.built||b.hp>=b.maxHp||!frontierNear(p,b,68)||w.bank.wood+w.bag.wood<1)return;b.repair=(b.repair||0)+dt;if(b.repair>=.25){b.repair=0;if(w.bag.wood>0)w.bag.wood--;else w.bank.wood--;b.hp=Math.min(b.maxHp,b.hp+8);}});
 frontierCollect(w);frontierWorkers(w,dt);frontierCollect(w);frontierSiege(w,dt);
 if(c.war){var hut=w.buildings.find(function(b){return b.kind==='barracks';});if(hut&&hut.built&&hut.hp>0&&frontierNear(p,hut,110)){hut.auto=(hut.auto||0)+dt;if(hut.auto>=.8){hut.auto=0;frontierRecruit(w);}}}
 w.camps.forEach(function(a){if(a.hp<=0)return;a.cool-=dt;if(frontierNear(p,a,78)&&p.attack<=0){a.hp-=16+w.tech.blade*5;p.attack=.58;w.effects.push({x:a.x,y:a.y,t:.22,kind:'hit'});if(a.hp<=0)w.drops.push({x:a.x,y:a.y,amount:25+w.cfg.chapter*8});}
  if(a.cool<=0&&w.enemies.filter(function(e){return e.hp>0;}).length<35){a.cool=28;frontierSpawn(w,a.x,a.y,w.raids++);w.enemies[w.enemies.length-1].raider=true;}
 });
 if(c.mission==='rescue')w.cages.forEach(function(a){if(!a.open&&bridge&&frontierNear(p,a,46)&&!w.enemies.some(function(e){return e.hp>0&&frontierNear(a,e,130);})){a.open=true;w.rescued++;}});
 var tower=w.buildings[4];(c.war?w.buildings.filter(function(b){return b.kind==='tower';}):[tower]).forEach(function(t){if(t.built&&t.hp>0){t.cd=(t.cd||0)-dt;var target=w.enemies.find(function(e){return e.hp>0&&frontierNear(e,t,235);});if(target&&t.cd<=0){target.hp-=22+w.tech.blade*3+(w.tech.towerup||0)*6;t.cd=.8;w.effects.push({x:target.x,y:target.y,t:.2,kind:'hit'});}}});
 if(c.mission==='defend'&&tower.built){w.hold+=dt;w.wave=Math.min(w.siege.wave,c.waves);}
 if(w.time>c.night)w.threat=Math.min(4,(w.time-c.night)/70);
 var nearest=w.enemies.filter(function(e){return e.hp>0&&frontierNear(e,p,e.radius+62);}).sort(function(a,b){return Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y);})[0];
 if(nearest&&p.attack<=0){nearest.hp-=16+w.tech.blade*5+(frontierBuilt(w,'forge')?9:0);p.attack=.58;w.effects.push({x:nearest.x,y:nearest.y,t:.22,kind:'hit'});}
 w.enemies.forEach(function(e){
  if(e.hp<=0){if(!e.counted){e.counted=true;w.kills++;w.drops.push({x:e.x,y:e.y,amount:e.type==='boss'?35+c.chapter*12:4+c.chapter*2});}return;}
  if(e.raider&&!frontierNear(e,p,95)){
   e.cool-=dt;var fighter=w.fighters.find(function(a){return a.hp>0&&frontierNear(e,a,65);});
   if(fighter){if(e.cool<=0){fighter.hp=Math.max(0,fighter.hp-c.damage);e.cool=1.3;}return;}
   var base=w.buildings[0],gt=c.war?w.buildings.filter(function(b){return b.kind==='tower'&&b.built&&b.hp>0;}).sort(function(a,b){return Math.hypot(e.x-a.x,e.y-a.y)-Math.hypot(e.x-b.x,e.y-b.y);})[0]:null;
   if(gt&&Math.hypot(e.x-gt.x,e.y-gt.y)<Math.hypot(e.x-base.x,e.y-base.y)+70){
    if(frontierNear(e,gt,58)){if(e.baseWarn>0){e.baseWarn-=dt;if(e.baseWarn<=0){gt.hp=Math.max(0,gt.hp-c.damage);w.effects.push({x:gt.x,y:gt.y,t:.3,kind:'hit'});e.cool=1.3;}}else if(e.cool<=0)e.baseWarn=c.windup;}
    else frontierWorkerMove(e,gt,dt*.65);return;}
   if(frontierNear(e,base,53)){if(e.baseWarn>0){e.baseWarn-=dt;if(e.baseWarn<=0){frontierBaseHit(w,c.damage);e.cool=1.3;}}else if(e.cool<=0)e.baseWarn=c.windup;}
   else frontierWorkerMove(e,base,dt*.65);return;
  }
  e.cool-=dt;var dist=Math.hypot(e.x-p.x,e.y-p.y),range=e.type==='ranged'?245:e.type==='charger'?165:e.type==='boss'?140:65;
  if(e.state==='warn'){
   e.t-=dt;if(e.t<=0){e.state='strike';e.t=e.type==='charger'?.32:.2;e.hit=false;if(e.type==='ranged'){var d=Math.max(1,Math.hypot(e.tx-e.x,e.ty-e.y));w.shots.push({x:e.x,y:e.y,vx:(e.tx-e.x)/d*230,vy:(e.ty-e.y)/d*230,t:3});}}
  }else if(e.state==='strike'){
   e.t-=dt;if(e.type==='charger'){var dl=Math.max(1,Math.hypot(e.tx-e.x,e.ty-e.y));e.x+=(e.tx-e.x)/dl*420*dt;e.y+=(e.ty-e.y)/dl*420*dt;if(frontierNear(e,p,36)&&!e.hit){frontierDamage(w,c.damage+4);e.hit=true;}}
   else if(e.type!=='ranged'&&!e.hit&&Math.hypot(p.x-e.tx,p.y-e.ty)<(e.type==='boss'?90:48)){frontierDamage(w,c.damage*(e.type==='boss'?1.7:1));e.hit=true;}
   if(e.t<=0){e.state='walk';e.cool=e.type==='boss'?.9:1.15;}
  }else if(dist<range&&e.cool<=0&&(bridge||p.x>678)){e.state='warn';e.t=c.windup;e.tx=p.x;e.ty=p.y;}
  else if(dist<360&&(bridge||p.x>678)){var s=(e.type==='boss'?52:58)+c.chapter*8+w.threat*7;if(dist>(e.type==='ranged'?170:45)){e.x+=(p.x-e.x)/dist*s*dt;e.y+=(p.y-e.y)/dist*s*dt;}}
  e.x=Math.max(e.raider?40:695,Math.min(c.width-40,e.x));e.y=Math.max(50,Math.min(c.height-50,e.y));
 });
 if(c.war&&!w.offer&&w.coins>=frontierPickCost(w)){var drawn=frontierDraw(w);if(drawn.length){w.coins-=frontierPickCost(w);w.offer=drawn;}}
 if(c.war&&w.enemyBase&&w.enemyBase.hp<=0&&w.phase==='play'){w.phase='clear';w.effects.push({x:w.enemyBase.x,y:w.enemyBase.y,t:1,kind:'build'});}
 w.shots=w.shots.filter(function(s){s.t-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;if(frontierNear(s,p,22)){frontierDamage(w,c.damage);s.t=0;}return s.t>0;});
 if(c.chapter>=2&&p.x>690){var cycle=w.time%9,hx=800+Math.floor(w.time/9)%3*120,hy=240+Math.floor(w.time/9)%2*360;if(cycle>7.2&&Math.hypot(p.x-hx,p.y-hy)<70)frontierDamage(w,10+c.chapter*2);}
 w.effects=w.effects.filter(function(e){e.t-=dt;return e.t>0;});w.enemies=w.enemies.filter(function(e){return e.hp>0||!e.counted;});w.drops=w.drops.filter(function(d){if(frontierNear(p,d,65)){w.coins+=d.amount;return false;}return true;});if(w.drops.length>90){var extra=w.drops.splice(90);extra.forEach(function(d){w.drops[0].amount+=d.amount;});}if(w.effects.length>70)w.effects.splice(0,w.effects.length-70);
}
