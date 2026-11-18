// Simulation stays in the game's closure; the model never touches points or tracking.
function frontierPlan(level){
 var c=Math.floor((level-1)/10),n=(level-1)%10;
 return {level:level,chapter:c,mission:n===9?'boss':['build','rescue','hunt','defend','elite','rescue','defend','hunt','elite'][n],wood:24+c*6+n*2,stone:14+c*4+n,enemies:4+c*2+Math.floor(n/2),hp:36+c*13+n*3,damage:9+c*3+Math.floor(n/3),windup:Math.max(.62,1.18-c*.09-n*.015),waves:2+c,hold:24+c*6,night:150-c*12};
}
function frontierWorld(level,tech){
 var cfg=frontierPlan(level),seed=level*1973;
 function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
 var flip=level%2?-1:1,offset=(level%3-1)*35;
 var w={version:1,level:level,cfg:cfg,tech:tech||{tool:0,blade:0,pack:0},time:0,phase:'play',p:{x:180,y:450,hp:100,inv:0,attack:0,dash:0,dx:1,dy:0},bag:{wood:0,stone:0},bank:{wood:0,stone:0},nodes:[],enemies:[],shots:[],effects:[],kills:0,rescued:0,hold:0,wave:0,waveAt:0,heal:35,worker:0,threat:0,
 buildings:[{kind:'camp',x:180,y:450,built:true,wood:0,stone:0},{kind:'mill',x:320,y:450+flip*230,built:false,wood:cfg.wood,stone:0},{kind:'forge',x:330,y:450-flip*230,built:false,wood:12,stone:cfg.stone},{kind:'bridge',x:590,y:450,built:false,wood:cfg.wood+10,stone:cfg.stone},{kind:'tower',x:860,y:450+offset,built:false,wood:cfg.wood,stone:cfg.stone+6,cd:0},{kind:'beacon',x:1090,y:450-offset,built:false,wood:cfg.wood,stone:cfg.stone}],cages:[{x:880,y:180,open:false},{x:1020,y:700,open:false}]};
 for(var i=0;i<62;i++){
  var x=70+rand()*1050,y=80+rand()*740;
  if(x>530&&x<700||w.buildings.concat(w.cages).some(function(b){return Math.hypot(b.x-x,b.y-y)<85;})){i--;continue;}
  w.nodes.push({x:x,y:y,kind:i%3===0?'stone':'wood',left:6,cool:0,respawn:0});
 }
 // Guaranteed accessible supplies; regeneration prevents a finite-resource softlock.
 w.nodes[0]={x:100,y:320,kind:'stone',left:6,cool:0,respawn:0};w.nodes[1]={x:260,y:340,kind:'wood',left:6,cool:0,respawn:0};
 for(i=0;i<cfg.enemies;i++)frontierSpawn(w,750+rand()*370,100+rand()*700,i);
 if(cfg.mission==='boss'||cfg.mission==='elite')frontierSpawn(w,1040,450,99);
 return w;
}
function frontierSpawn(w,x,y,i){var boss=i===99,type=boss?'boss':i%4===2&&w.level>3?'ranged':i%4===1&&w.level>1?'charger':'melee',hp=w.cfg.hp*(boss?(w.cfg.mission==='boss'?7:3):1);w.enemies.push({x:x,y:y,type:type,hp:hp,max:hp,state:'walk',t:0,cool:.5+i%3,tx:x,ty:y,hit:false,counted:false,wave:false,radius:boss?27:17});}
function frontierNear(a,b,r){return Math.hypot(a.x-b.x,a.y-b.y)<r;}
function frontierBuilt(w,k){return w.buildings.some(function(b){return b.kind===k&&b.built;});}
function frontierUpgrade(w,k){if(!['tool','blade','pack'].includes(k)||w.phase!=='play'||!frontierNear(w.p,w.buildings[0],100))return false;var n=w.tech[k],cost=20+n*22;if(n>=8||w.bank.wood<cost||w.bank.stone<Math.floor(cost*.65))return false;w.bank.wood-=cost;w.bank.stone-=Math.floor(cost*.65);w.tech[k]++;return true;}
function frontierDamage(w,n){if(w.p.inv>0||w.phase!=='play')return;w.p.hp=Math.max(0,w.p.hp-n);w.p.inv=.6;if(w.p.hp===0)w.phase='dead';}
function frontierGoal(w){var m=w.cfg.mission,boss=w.enemies.some(function(e){return e.type==='boss'&&e.hp>0;});return m==='rescue'?w.rescued===2:m==='defend'?w.wave>=w.cfg.waves&&w.hold>=w.cfg.hold&&!w.enemies.some(function(e){return e.wave&&e.hp>0;}):m==='boss'||m==='elite'?!boss:m==='hunt'?w.kills>=w.cfg.enemies:w.kills>=Math.ceil(w.cfg.enemies*.65);}
function frontierStep(w,input,dt){
 if(w.phase!=='play')return;dt=Math.min(.05,Math.max(0,dt));w.time+=dt;
 var p=w.p,c=w.cfg,bridge=frontierBuilt(w,'bridge'),speed=145,move=Math.hypot(input.x,input.y);
 p.inv=Math.max(0,p.inv-dt);p.dash=Math.max(0,p.dash-dt);p.attack-=dt;
 if(move){p.dx=input.x/move;p.dy=input.y/move;}
 if(input.dash&&p.dash===0&&move){p.dash=2.2;p.inv=.3;w.effects.push({x:p.x,y:p.y,t:.25,kind:'dash'});}
 if(p.dash>1.98)speed=440;
 // Ice requires shorter movements; forge provides cleats. Other regions preserve movement speed.
 if(c.chapter===3&&!frontierBuilt(w,'forge'))speed*=.84;
 var nx=Math.max(40,Math.min(1160,p.x+p.dx*(move?speed:0)*dt)),ny=Math.max(45,Math.min(855,p.y+p.dy*(move?speed:0)*dt));
 if(nx>552&&nx<678&&(!bridge||ny<385||ny>515))nx=p.x;p.x=nx;p.y=ny;
 if(frontierNear(p,w.buildings[0],67)){
  ['wood','stone'].forEach(function(k){w.bank[k]+=w.bag[k];w.bag[k]=0;});var h=Math.max(0,Math.min(w.heal,dt*7,100-p.hp));w.heal-=h;p.hp+=h;
 }
 var cap=24+w.tech.pack*9;
 w.nodes.forEach(function(n){if(n.left===0){n.respawn-=dt;if(n.respawn<=0)n.left=6;return;}n.cool-=dt;if(n.cool<=0&&w.bag.wood+w.bag.stone<cap&&frontierNear(n,p,53)){var gain=Math.min(n.left,1+Math.floor(w.tech.tool/2),cap-w.bag.wood-w.bag.stone);n.left-=gain;w.bag[n.kind]+=gain;n.cool=.5/(1+w.tech.tool*.16);n.respawn=14;w.effects.push({x:n.x,y:n.y,t:.3,kind:n.kind});}});
 w.buildings.forEach(function(b){
  if(b.built||!frontierNear(b,p,68)||b.kind==='beacon'&&(!bridge||!frontierGoal(w))||b.kind==='tower'&&!bridge)return;
  b.charge=(b.charge||0)+dt;if(b.charge<.07)return;b.charge=0;
  ['wood','stone'].forEach(function(k){if(b[k]>0){if(w.bag[k]>0){w.bag[k]--;b[k]--;}else if(w.bank[k]>0){w.bank[k]--;b[k]--;}}});
  if(b.wood+b.stone===0){b.built=true;w.effects.push({x:b.x,y:b.y,t:1,kind:'build'});}
 });
 if(frontierBuilt(w,'mill')){w.worker+=dt;if(w.worker>=3){w.worker=0;w.bank.wood+=2;w.bank.stone+=1;}}
 if(c.mission==='rescue')w.cages.forEach(function(a){if(!a.open&&bridge&&frontierNear(p,a,46)&&!w.enemies.some(function(e){return e.hp>0&&frontierNear(a,e,130);})){a.open=true;w.rescued++;}});
 var tower=w.buildings[4];if(tower.built){tower.cd-=dt;var target=w.enemies.find(function(e){return e.hp>0&&frontierNear(e,tower,235);});if(target&&tower.cd<=0){target.hp-=22+w.tech.blade*3;tower.cd=.8;w.effects.push({x:target.x,y:target.y,t:.2,kind:'hit'});}}
 if(bridge&&c.mission==='defend'&&tower.built){w.hold+=dt;w.waveAt-=dt;if(w.waveAt<=0&&w.wave<c.waves){w.wave++;w.waveAt=12;for(var i=0;i<2+c.chapter;i++){frontierSpawn(w,1100,100+i*125,i+w.wave);w.enemies[w.enemies.length-1].wave=true;}}}
 if(w.time>c.night)w.threat=Math.min(4,(w.time-c.night)/70);
 var nearest=w.enemies.filter(function(e){return e.hp>0&&frontierNear(e,p,e.radius+62);}).sort(function(a,b){return Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y);})[0];
 if(nearest&&p.attack<=0){nearest.hp-=16+w.tech.blade*5+(frontierBuilt(w,'forge')?9:0);p.attack=.58;w.effects.push({x:nearest.x,y:nearest.y,t:.22,kind:'hit'});}
 w.enemies.forEach(function(e){
  if(e.hp<=0){if(!e.counted){e.counted=true;w.kills++;w.bank.stone+=3;}return;}
  e.cool-=dt;var dist=Math.hypot(e.x-p.x,e.y-p.y),range=e.type==='ranged'?245:e.type==='charger'?165:e.type==='boss'?140:65;
  if(e.state==='warn'){
   e.t-=dt;if(e.t<=0){e.state='strike';e.t=e.type==='charger'?.32:.2;e.hit=false;if(e.type==='ranged'){var d=Math.max(1,Math.hypot(e.tx-e.x,e.ty-e.y));w.shots.push({x:e.x,y:e.y,vx:(e.tx-e.x)/d*230,vy:(e.ty-e.y)/d*230,t:3});}}
  }else if(e.state==='strike'){
   e.t-=dt;if(e.type==='charger'){var dl=Math.max(1,Math.hypot(e.tx-e.x,e.ty-e.y));e.x+=(e.tx-e.x)/dl*420*dt;e.y+=(e.ty-e.y)/dl*420*dt;if(frontierNear(e,p,36)&&!e.hit){frontierDamage(w,c.damage+4);e.hit=true;}}
   else if(e.type!=='ranged'&&!e.hit&&Math.hypot(p.x-e.tx,p.y-e.ty)<(e.type==='boss'?90:48)){frontierDamage(w,c.damage*(e.type==='boss'?1.7:1));e.hit=true;}
   if(e.t<=0){e.state='walk';e.cool=e.type==='boss'?.9:1.15;}
  }else if(dist<range&&e.cool<=0&&(bridge||p.x>678)){e.state='warn';e.t=c.windup;e.tx=p.x;e.ty=p.y;}
  else if(dist<360&&(bridge||p.x>678)){var s=(e.type==='boss'?52:58)+c.chapter*8+w.threat*7;if(dist>(e.type==='ranged'?170:45)){e.x+=(p.x-e.x)/dist*s*dt;e.y+=(p.y-e.y)/dist*s*dt;}}
  e.x=Math.max(695,Math.min(1160,e.x));e.y=Math.max(50,Math.min(850,e.y));
 });
 w.shots=w.shots.filter(function(s){s.t-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;if(frontierNear(s,p,22)){frontierDamage(w,c.damage);s.t=0;}return s.t>0;});
 if(c.chapter>=2&&p.x>690){var cycle=w.time%9,hx=800+Math.floor(w.time/9)%3*120,hy=240+Math.floor(w.time/9)%2*360;if(cycle>7.2&&Math.hypot(p.x-hx,p.y-hy)<70)frontierDamage(w,10+c.chapter*2);}
 w.effects=w.effects.filter(function(e){e.t-=dt;return e.t>0;});if(w.phase==='play'&&frontierBuilt(w,'beacon'))w.phase='clear';
}
