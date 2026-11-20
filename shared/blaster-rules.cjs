const blasterRules = (() => {
  var BL_FLEET_MAX=35,BL_GATE_CAP=35,BL_GATE_HALF=33,BL_SPAWN_Y=532,BL_MILESTONE=10000,BL_DEPTH_STEP=1000;
  var BL_GUNS=[
    {kind:'pulse',name:'脈衝彈',color:'#9bfff0',pellets:1,scale:1.2,speed:660,pierce:1,radius:0,desc:'均衡的單發彈'},
    {kind:'twin',name:'雙管速射',color:'#74baff',pellets:2,scale:1,speed:740,pierce:1,radius:0,desc:'兩發並進，射速快'},
    {kind:'rail',name:'穿透光槍',color:'#9dff86',pellets:2,scale:1.35,speed:1050,pierce:3,radius:0,desc:'子彈可穿透 3 隻'},
    {kind:'rocket',name:'追蹤火箭',color:'#ff8f75',pellets:2,scale:2.2,speed:600,pierce:1,radius:78,desc:'自動追蹤，範圍爆炸'},
    {kind:'plasma',name:'電漿砲',color:'#e6a3ff',pellets:3,scale:1.6,speed:720,pierce:2,radius:58,desc:'三發穿透，範圍傷害'},
    {kind:'frost',name:'寒流彈',color:'#bdefff',pellets:2,scale:.9,speed:720,pierce:1,radius:0,desc:'命中後減速 2 秒'},
    {kind:'chain',name:'電鏈彈',color:'#fff27a',pellets:1,scale:1.3,speed:800,pierce:1,radius:0,desc:'命中後電擊附近 2 隻'}
  ];
  var BL_CARD_EVERY=36;
  var BL_MOBS={
    octo:{name:'泡泡章魚',color:'#b8a4f4',health:1,speed:1},
    crab:{name:'裝甲螃蟹',color:'#f4a66d',health:1.7,speed:.82},
    ray:{name:'衝刺魟魚',color:'#65e1cb',health:.65,speed:1.48},
    eel:{name:'橫移電鰻',color:'#ffe076',health:.9,speed:1.08},
    turtle:{name:'護盾海龜',color:'#79bfff',health:1,speed:.86},
    jelly:{name:'分裂水母',color:'#ff9cce',health:1.15,speed:.9},
    mini:{name:'小水母',color:'#ffc5e4',health:.25,speed:1.18},
    mine:{name:'水雷',color:'#ff6b6b',health:.45,speed:1.1},
    rock:{name:'礁石',color:'#8f9aa8',health:2.2,speed:.62},
    squid:{name:'噴墨烏賊',color:'#d78bff',health:1.1,speed:.72},
    reef:{name:'硬礁',color:'#77a0b8',health:1,speed:.76},
    boss:{name:'深海巨獸',color:'#ff7a6b',health:1,speed:0}
  };
  var BL_SLOTS=[56,128,200,272,344];
  var BL_COST={octo:1,crab:1.4,ray:1,eel:1.3,turtle:1.6,jelly:1.5,mine:1.1,rock:1.2,squid:1.6};
  var BL_UNLOCK={octo:1,ray:2,crab:2,mine:3,eel:3,turtle:4,rock:5,jelly:6,squid:7};
  // Commands 0–2 pick a card. The next 16 encode held directions; the rest encode a point.
  const AIM_BASE=19, AIM_ROWS=151, inputCount=AIM_BASE+101*AIM_ROWS;
  function state(){return {active:false,phase:'run',stage:1,distance:0,nextHazard:1500,nextBoss:5000,earned:0,rewarded:0,analytics:null,lives:3,weapon:1,form:'pulse',picks:[],sinceCard:0,keys:{l:false,r:false,u:false,d:false},dragging:null,ink:[],gates:[],target:200,x:200,targetY:BL_SPAWN_Y,y:BL_SPAWN_Y,kills:0,wave:0,clock:0,scroll:0,nextWave:.10,shot:0,enemies:[],bullets:[],fx:[],last:0,focused:true,flash:0,best:0,serial:0,tracked:false};}
  function aimCode(x,y){
    const column=Math.max(0,Math.min(100,Math.round(x/4)));
    const row=Math.max(0,Math.min(150,Math.round(y/4)));
    return AIM_BASE+column*AIM_ROWS+row;
  }
  function bind(BL,random,notify=()=>{},reduceMotion=true){
    function blShuffle(items){
      for(let i=items.length-1;i>0;i--){
        const j=Math.floor(random()*(i+1));
        [items[i],items[j]]=[items[j],items[i]];
      }
      return items;
    }
    function blWeapon(){
      var gun=BL_GUNS[0];BL_GUNS.forEach(function(g){if(g.kind===BL.form)gun=g;});
      return Object.assign({},gun,{damage:1+Math.ceil(BL.weapon/3),interval:gun.kind==='rocket'?.34:Math.max(.11,.27-BL.weapon*.005)});
    }
    function blStageConfig(stage){return {interval:Math.max(.50,.84-(stage-1)*.035),speed:stage<=10?150+stage*14:290+12*Math.log2(stage-9)};}
    function blHealth(){return BL.stage<=10?3+Math.ceil(.8*BL.stage):11+3*(BL.stage-10);}
    function blPace(){return 1+.35*Math.min(1,BL.distance/BL_DEPTH_STEP);}
    function blAdvanceDistance(pixels){
      BL.distance+=pixels/10;
      var depth=1+Math.floor(BL.distance/BL_DEPTH_STEP);
      if(depth>BL.stage){
        BL.weapon+=depth-BL.stage;BL.stage=depth;
        notify('depth');
      }
      var milestones=Math.floor(BL.distance/BL_MILESTONE),bonus=milestones-BL.rewarded;
      if(bonus>0){
        BL.rewarded=milestones;BL.earned+=bonus;notify('bonus',bonus);
      }
      if(BL.distance>=BL.nextHazard){
        var index=Math.floor((BL.nextHazard-1500)/350);
        var rock=blEnemy(index%2===0?0:4,-30,'reef',1);
        rock.x=index%2===0?73:327;BL.enemies.push(rock);
        BL.nextHazard+=350;
      }
      if(BL.distance>=BL.nextBoss&&!BL.enemies.some(function(e){return e.type==='boss';})){
        BL.nextBoss+=5000;blBossSpawn();
      }
    }
    function blOfferPicks(){
      var pool=blShuffle(BL_GUNS.filter(function(g){return g.kind!==BL.form;})).slice(0,3).map(function(g){return {type:'weapon',kind:g.kind};});
      if(BL.lives<3&&pool.length)pool[pool.length-1]={type:'repair'};
      BL.picks=pool;BL.phase='pick';BL.sinceCard=0;notify('pick');
    }
    function blChoose(index){
      if(BL.phase!=='pick'||!BL.picks[index])return;
      var card=BL.picks[index];BL.picks=[];
      if(card.type==='repair')BL.lives=Math.min(3,BL.lives+1);else BL.form=card.kind;
      BL.phase='run';notify('chosen');return true;
    }
    function blHurt(){
      if(BL.phase!=='run'||BL.flash>0)return;
      BL.flash=.3;
      blChangeFleet(-1);
    }
    function blChangeFleet(delta){
      if(BL.phase!=='run')return;
      BL.lives=Math.max(0,Math.min(BL_FLEET_MAX,BL.lives+delta));
      BL.x=blClampX(BL.x);BL.target=blClampX(BL.target);
      BL.y=blClampY(BL.y);BL.targetY=blClampY(BL.targetY);
      if(BL.lives<=0){BL.phase='lost';notify('lost');}
      else notify(delta<0?'hurt':'recruit');
    }
    function blEnemy(lane,y,type,hp){
      var spec=BL_MOBS[type],health=Math.ceil(hp*spec.health);
      return {type:type,lane:lane,x:BL_SLOTS[lane],y:y,hp:health,max:health,speed:blStageConfig(BL.stage).speed*spec.speed,shield:type==='turtle'?Math.ceil(hp*.75):0,shieldMax:type==='turtle'?Math.ceil(hp*.75):0,hit:0,id:++BL.serial,age:0,shiftAt:1.5,telegraph:0,targetLane:null,slow:0,hold:0,cd:1};
    }
    function blWavePlan(){
      var stage=BL.stage,pool=Object.keys(BL_UNLOCK).filter(function(t){return stage>=BL_UNLOCK[t];});
      var lanes=blShuffle([0,1,2,3,4]);
      // Intensity ramps with total progress T (stages plus position inside the stage): a quiet start with the starter gun, then denser waves.
      var T=(stage-1)+(BL.distance%BL_DEPTH_STEP)/BL_DEPTH_STEP,mean=Math.min(3.6,1+.55*T),n=Math.floor(mean)+(random()<mean-Math.floor(mean)?1:0);
      if(random()<.2)n+=random()<.5?-1:1;
      var maxPer=Math.max(1,Math.min(5,n)),budget=1.4*maxPer+.5,plan=[];
      for(var i=0;i<maxPer;i++){
        var options=pool.filter(function(t){return BL_COST[t]<=budget+1e-9&&!(t==='rock'&&plan.some(function(q){return q.type==='rock';}));});
        if(!options.length)break;
        var type=options[Math.floor(random()*options.length)];
        plan.push({lane:lanes[i],type:type,dy:-70*i});budget-=BL_COST[type];
      }
      if(!plan.length)plan.push({lane:lanes[0],type:'octo',dy:0});
      return plan;
    }
    function blSpawn(){
      BL.wave++;var hp=blHealth(),config=blStageConfig(BL.stage),plan=blWavePlan(),scale=Math.max(.6,1-.1*(plan.length-1));
      if(BL.wave%5===1){
        blSpawnGates(Math.floor(BL.wave/5));
      }
      plan.forEach(function(q){BL.enemies.push(blEnemy(q.lane,54+q.dy,q.type,Math.max(1,Math.round(hp*scale))));});
      blSpawnSwarm(hp);
      BL.nextWave=config.interval*(1-.16*Math.min(1,BL.distance/BL_DEPTH_STEP));
      BL.sinceCard++;
      if(BL.sinceCard>=BL_CARD_EVERY){blOfferPicks();return;}
    }
    function blSpawnGates(pair){
      var left=pair%2===0;
      if(!pair&&BL.stage===1){
        BL.gates.push({x:120,y:168,value:2,cap:4,group:pair},{x:280,y:168,value:-6,group:pair});
        return;
      }
      var penalty={x:left?266:134,y:-25,value:-[11,15,19,24][pair%4],half:134,group:pair};
      var armor=9+4*BL.lives;
      BL.gates.push(
        {x:left?66:334,y:-25,value:[1,2,3,2][pair%4],half:66,cap:5,group:pair,armor:armor,maxArmor:armor,fallback:penalty},
        penalty
      );
    }
    function blSpawnSwarm(hp){
      var count=Math.min(16,4+Math.floor(BL.wave/6)+BL.stage-1);
      var center=BL.wave===1?200:[200,110,290][BL.wave%3],columns=4;
      for(var i=0;i<count;i++){
        var offset=(i%columns-1.5)*22;
        var enemy=blEnemy(2,54-Math.floor(i/columns)*24-i%2*10,'octo',Math.max(1,Math.ceil(hp*.4)));
        enemy.x=center+offset;
        enemy.swarmOffset=offset;
        enemy.speed*=1.12+(i%columns)*.06;
        BL.enemies.push(enemy);
      }
    }
    function blBossSpawn(){
      var boss=blEnemy(1,150,'boss',blHealth()*28);boss.x=200;boss.warn=[];boss.warnT=0;boss.cd=2.2;BL.enemies.push(boss);
      notify('boss');
    }
    function blAdvanceBoss(e,step){
      e.age+=step;e.hit=Math.max(0,e.hit-step);
      if(e.age>=24){e.warn=[];e.y-=220*step;if(e.y< -100)e.hp=0;return;}
      e.y=150;e.x=200+Math.sin(e.age*.55)*105;
      var rage=e.hp/e.max<.5;
      if(e.warn.length){
        e.warnT-=step;
        if(e.warnT<=0){e.warn.forEach(function(l){BL.ink.push({x:BL_SLOTS[l],y:e.y+50,vy:500,r:34,beam:true});});e.warn=[];e.cd=rage?(BL.stage<10?2.4:1.9):(BL.stage<10?3.2:2.6);}
      }else{
        e.cd-=step;
        if(e.cd<=0){
          var lanes=blShuffle([0,1,2,3,4]).slice(0,rage||BL.stage>=10?2:1);e.warn=lanes;e.warnT=.9;
          if(rage&&BL.enemies.length<7){var l=Math.floor(random()*5);BL.enemies.push(blEnemy(l,-32,'mine',Math.max(1,Math.round(blHealth()*.7))));}
        }
      }
    }
    function blAdvanceEnemy(e,step){
      if(e.type==='boss'){blAdvanceBoss(e,step);return;}
      var slow=1;if(e.slow>0){e.slow-=step;slow=.55;}
      e.hit=Math.max(0,e.hit-step);e.age=(e.age||0)+step;
      if(e.type==='squid'&&e.y>=150&&e.hold<4){
        e.hold+=step;e.cd-=step;
        if(e.cd<=0){BL.ink.push({x:BL.x,y:e.y+22,vy:300,r:13,beam:false});e.cd=1.7;}
        return;
      }
      var swimmer=e.type!=='rock'&&e.type!=='mine'&&e.type!=='reef';
      e.y+=e.speed*blPace()*step*slow*(swimmer?1.14:1);
      if(e.type!=='eel'){
        // Stop steering before contact so a late sidestep can still beat the dive.
        if(swimmer&&e.y>145&&e.y<Math.min(445,BL.y-65)){
          var turn=(e.swarmOffset!==undefined?240:185)*slow*step;
          var aim=Math.max(9,Math.min(391,BL.x+(e.swarmOffset||0)));
          e.x+=Math.max(-turn,Math.min(turn,aim-e.x));
        }
        return;
      }
      if(e.targetLane!==null){e.telegraph-=step;if(e.telegraph<=0){e.x+=(BL_SLOTS[e.targetLane]-e.x)*Math.min(1,step*9);if(Math.abs(e.x-BL_SLOTS[e.targetLane])<1){e.x=BL_SLOTS[e.targetLane];e.lane=e.targetLane;e.targetLane=null;e.shiftAt=e.age+2.2;}}}
      else if(e.y>65&&e.y<365&&e.age>=e.shiftAt){var near=[e.lane-2,e.lane-1,e.lane+1,e.lane+2].filter(function(q){return q>=0&&q<=4;});e.targetLane=near[e.id%near.length];e.telegraph=.65;}
    }
    function blDamage(e,damage){
      if(e.hp<=0||e.type==='reef')return;
      if(e.shield>0){var blocked=Math.min(e.shield,damage);e.shield-=blocked;damage-=blocked;if(e.shield===0)blEffect(e.x,e.y,'#79bfff',14);}
      e.hp-=damage;e.hit=.09;
      if(e.hp>0)return;
      if(e.type==='rock'){blEffect(e.x,e.y,'#b8c2cf',12);return;}
      if(e.type==='boss'){BL.kills+=10;BL.weapon=Math.min(Number.MAX_SAFE_INTEGER,BL.weapon+1);BL.ink=[];blEffect(e.x,e.y,'#ff7a6b',40);return;}
      BL.kills++;blEffect(e.x,e.y,(BL_MOBS[e.type]||BL_MOBS.octo).color,9);
      if(e.type==='mine'){
        var blast=Math.max(2,Math.ceil(blHealth()*.6));
        BL.fx.push({x:e.x,y:e.y,vx:0,vy:0,t:.32,color:'#ff6b6b',ring:90});
        BL.enemies.slice().forEach(function(o){if(o.id!==e.id&&o.hp>0&&o.type!=='boss'&&Math.hypot(o.x-e.x,o.y-e.y)<90)blDamage(o,blast);});
        if(blFleetTouch(e.x,e.y,90,90,true))blHurt();
      }
      if(e.type==='jelly'){
        var hp=blHealth(),y=Math.min(e.y,390);
        BL.enemies.push(blEnemy(Math.max(0,e.lane-1),y-22,'mini',hp));BL.enemies.push(blEnemy(Math.min(4,e.lane+1),y-65,'mini',hp));
      }
    }
    function blSegmentHit(ax,ay,bx,by,e,radius){
      var dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,((e.x-ax)*dx+(e.y-ay)*dy)/length)):0;
      return Math.hypot(ax+dx*t-e.x,ay+dy*t-e.y)<radius;
    }
    function blFleetWidth(){return Math.min(7,BL.lives);}
    function blFleet(){
      var ships=[],width=blFleetWidth();
      for(var i=0;i<BL.lives;i++){
        var row=Math.floor(i/width),count=Math.min(width,BL.lives-row*width);
        var offset=i%width-(count-1)/2;
        var stagger=row%2===0?0:row%4===1?2:-2;
        var sweep=Math.abs(offset)*4+(offset===0?0:(i*3)%5);
        ships.push({x:BL.x+offset*12+stagger,y:BL.y+row*11+sweep,lead:row===0&&offset===0,side:Math.sign(offset)});
      }
      return ships;
    }
    function blFleetTouch(x,y,rx,ry,radial){
      return blFleet().some(function(ship){
        var dx=ship.x-x,dy=ship.y-y;
        return radial?dx*dx+dy*dy<rx*rx:Math.abs(dx)<rx&&Math.abs(dy)<ry;
      });
    }
    function blClampX(x){
      var margin=Math.max(28,blFleetWidth()*6+5);
      return Math.max(margin,Math.min(400-margin,x));
    }
    function blClampY(y){
      var rows=Math.ceil(BL.lives/7);
      var rear=Math.max(0,rows-1)*11+(blFleetWidth()-1)*2.5+4;
      return Math.max(105,Math.min(565-Math.max(0,rear),y));
    }
    function blReleaseDirections(){
      BL.keys.l=BL.keys.r=BL.keys.u=BL.keys.d=false;
    }
    function blAim(x,y){
      BL.target=blClampX(x);BL.targetY=blClampY(y);
    }
    function blAdvanceFleet(step){
      var dx=Number(BL.keys.r)-Number(BL.keys.l),dy=Number(BL.keys.d)-Number(BL.keys.u);
      var scale=430*step/(Math.hypot(dx,dy)||1);
      blAim(BL.target+dx*scale,BL.targetY+dy*scale);
      var mx=BL.target-BL.x,my=BL.targetY-BL.y;
      var travel=Math.min(1,720*step/(Math.hypot(mx,my)||1));
      BL.x=blClampX(BL.x+mx*travel);BL.y=blClampY(BL.y+my*travel);
    }
    function blBurst(){
      var w=blWeapon();
      blFleet().forEach(function(ship){
        for(var i=0;i<w.pellets;i++){
          var offset=i-(w.pellets-1)/2,spread=w.kind==='plasma'?offset*60:0;
          BL.bullets.push({x:ship.x+offset*5,y:ship.y-8,damage:w.damage*w.scale,vx:spread,speed:w.speed,kind:w.kind,color:w.color,pierce:w.pierce,radius:w.radius,hits:[]});
        }
      });
      BL.shot=w.interval;
    }
    function blGateContains(gate,x){
      var half=gate.half||BL_GATE_HALF;
      return x>=gate.x-half&&x<gate.x+half;
    }
    function blAdvanceBullet(b,step){
      if(b.pierce<=0)return;
      var ax=b.x,ay=b.y;
      if(b.kind==='rocket'){
        var target=null;BL.enemies.forEach(function(e){if(e.hp>0&&e.y<b.y+12&&(!target||Math.hypot(e.x-b.x,e.y-b.y)<Math.hypot(target.x-b.x,target.y-b.y)))target=e;});
        if(target)b.x+=Math.max(-210*step,Math.min(210*step,target.x-b.x));
      }else b.x+=(b.vx||0)*step;
      b.y-=b.speed*step;
      var impacts=[];
      var dx=b.x-ax,dy=b.y-ay,length=dx*dx+dy*dy;
      BL.enemies.forEach(function(enemy){
        if(enemy.hp<=0||b.hits.indexOf(enemy.id)>=0||!length)return;
        var reef=enemy.type==='reef',verticalScale=reef?2.2:1;
        var ex=enemy.x-ax,ey=(enemy.y-ay)*verticalScale,rayY=dy*verticalScale;
        var radius=reef?48:(enemy.swarmOffset!==undefined?9:22)+(b.kind==='plasma'?7:0);
        var dot=ex*dx+ey*rayY,span=dx*dx+rayY*rayY;
        var discriminant=dot*dot-span*(ex*ex+ey*ey-radius*radius);
        if(discriminant<0)return;
        var root=Math.sqrt(discriminant),entry=(dot-root)/span;
        if(entry<=1&&(dot+root)>=0)impacts.push({enemy:enemy,time:Math.max(0,entry)});
      });
      BL.gates.forEach(function(gate){
        if(ay<=gate.y||b.y>gate.y)return;
        var time=(gate.y-ay)/dy;
        if(blGateContains(gate,ax+dx*time))impacts.push({gate:gate,time:time});
      });
      impacts.sort(function(a,c){return a.time-c.time;});
      for(var j=0;j<impacts.length&&b.pierce>0&&BL.phase==='run';j++){
        var impact=impacts[j],enemy=impact.enemy;
        if(impact.gate){
          var gate=impact.gate;
          if(gate.armor>0){
            gate.armor--;
            b.pierce=0;
          }else if(gate.value<0){
            gate.value=Math.max(-BL_GATE_CAP,gate.value-1);
          }else{
            gate.hits=(gate.hits||0)+1;
            if(gate.hits%5===0)gate.value=Math.min(gate.cap,gate.value+1);
          }
          continue;
        }
        if(enemy.hp<=0)continue;
        if(enemy.type==='reef'){b.pierce=0;break;}
        b.hits.push(enemy.id);blDamage(enemy,b.damage);b.pierce--;
        if(b.kind==='frost'&&enemy.type!=='boss')enemy.slow=2;
        if(b.kind==='chain'){BL.enemies.filter(function(o){return o.id!==enemy.id&&o.hp>0&&Math.hypot(o.x-enemy.x,o.y-enemy.y)<140;}).sort(function(a,c){return Math.hypot(a.x-enemy.x,a.y-enemy.y)-Math.hypot(c.x-enemy.x,c.y-enemy.y);}).slice(0,2).forEach(function(o){blDamage(o,b.damage*.6);BL.fx.push({x:o.x,y:o.y,vx:0,vy:0,t:.2,color:b.color,ring:18});});}
        if(b.radius>0){
          var splash=BL.enemies.slice();splash.forEach(function(e){if(e.id!==enemy.id&&e.hp>0&&Math.hypot(e.x-enemy.x,e.y-enemy.y)<b.radius)blDamage(e,b.damage*.55);});
          BL.fx.push({x:enemy.x,y:enemy.y,vx:0,vy:0,t:.32,color:b.color,ring:b.radius});
        }
      }
      BL.ink=BL.ink.filter(function(i){return i.beam||!blSegmentHit(ax,ay,b.x,b.y,i,i.r+8);});
      if(b.pierce<=0)b.y=-1000;
    }
    function blEffect(x,y,color,count){for(var i=0;i<(reduceMotion?0:count);i++)BL.fx.push({x:x,y:y,vx:(Math.random()-.5)*130,vy:(Math.random()-.5)*130,t:.45,color:color});}
    function blStep(dt){
      while(dt>1e-8&&BL.phase==='run'){
        var step=Math.min(dt,.016);dt-=step;
        BL.clock+=step;var travel=blStageConfig(BL.stage).speed*blPace()*step;BL.scroll+=travel;blAdvanceDistance(travel);BL.flash=Math.max(0,BL.flash-step);var previousFleetX=BL.x,previousFleetY=BL.y;blAdvanceFleet(step);
        BL.shot-=step;if(BL.shot<=0)blBurst();BL.nextWave-=step;if(BL.nextWave<=0)blSpawn();
        if(BL.phase!=='run')return;
        BL.enemies.forEach(function(e){blAdvanceEnemy(e,step);});
        BL.bullets.forEach(function(b){if(BL.phase==='run')blAdvanceBullet(b,step);});
        if(BL.phase!=='run')return;
        BL.gates.forEach(function(gate){gate.y+=140*step;});
        var crossing=BL.gates.find(function(gate){
          var before=previousFleetY-(gate.y-140*step),after=BL.y-gate.y;
          if(before<=0||after>0)return false;
          var crossingX=previousFleetX+(BL.x-previousFleetX)*before/(before-after);
          return blGateContains(gate,crossingX);
        });
        if(crossing){
          BL.gates=BL.gates.filter(function(gate){
            return gate!==crossing&&(crossing.group===undefined||gate.group!==crossing.group);
          });
          blChangeFleet(crossing.armor>0?crossing.fallback.value:crossing.value);
          if(BL.phase!=='run')return;
        }
        BL.gates=BL.gates.filter(function(gate){return gate.y<=620;});
        BL.bullets=BL.bullets.filter(function(b){return b.y>-40&&b.x>-40&&b.x<440;});BL.enemies=BL.enemies.filter(function(e){return e.hp>0;});
        for(var k=BL.enemies.length-1;k>=0;k--){
          var e=BL.enemies[k];if(e.type==='boss')continue;
          if(e.y>620){BL.enemies.splice(k,1);continue;}
          if(e.type==='reef'){
            if(!e.collided&&blFleetTouch(e.x,e.y,52,25)){
              e.collided=true;blHurt();if(BL.phase!=='run')return;
            }
            continue;
          }
          var radius=e.swarmOffset!==undefined?11:24;
          if(blFleetTouch(e.x,e.y,radius+1,radius)){
            BL.enemies.splice(k,1);blHurt();if(BL.phase!=='run')return;
          }
        }
        for(var q=BL.ink.length-1;q>=0;q--){
          var ink=BL.ink[q];ink.y+=ink.vy*step;
          if(blFleetTouch(ink.x,ink.y,ink.beam?32:16,ink.beam?36:18)){BL.ink.splice(q,1);blHurt();if(BL.phase!=='run')return;}
          else if(ink.y>640)BL.ink.splice(q,1);
        }
        if(!BL.enemies.length)BL.nextWave=Math.min(BL.nextWave,.10);
        BL.fx.forEach(function(f){f.x+=f.vx*step;f.y+=f.vy*step;f.t-=step;});BL.fx=BL.fx.filter(function(f){return f.t>0;});

      }
    }
    function input(code){
      if(!Number.isInteger(code)||code<0||code>=inputCount)return false;
      if(code<3)return !!blChoose(code);
      if(BL.phase!=='run')return false;
      if(code<AIM_BASE){
        const mask=code-3;
        BL.keys.l=!!(mask&1);BL.keys.r=!!(mask&2);BL.keys.u=!!(mask&4);BL.keys.d=!!(mask&8);
      }else{
        const aim=code-AIM_BASE;
        blAim(Math.floor(aim/AIM_ROWS)*4,(aim%AIM_ROWS)*4);
      }
      return true;
    }
    return {BL,input,blWeapon,blStageConfig,blHealth,blPace,blAdvanceDistance,blOfferPicks,blChoose,blHurt,blChangeFleet,blEnemy,blWavePlan,blSpawn,blSpawnGates,blSpawnSwarm,blBossSpawn,blAdvanceBoss,blAdvanceEnemy,blDamage,blSegmentHit,blFleetWidth,blFleet,blFleetTouch,blClampX,blClampY,blReleaseDirections,blAim,blAdvanceFleet,blBurst,blGateContains,blAdvanceBullet,blEffect,blStep};
  }
  return {
    state,bind,aimCode,inputCount,BL_FLEET_MAX,BL_GATE_HALF,BL_SPAWN_Y,BL_GUNS,BL_MOBS,BL_SLOTS,
    create:random=>bind(state(),random),
    input:(model,code)=>model.input(code),
    advance:(model,step)=>{model.blStep(step);model.dead=model.BL.phase==='lost';},
    score:model=>Math.floor(model.BL.distance)
  };
})();
if (typeof module !== 'undefined') module.exports = blasterRules;
