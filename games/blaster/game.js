  /* ---------- Reef Blaster: three lanes, automatic fire, persistent weapon upgrades ---------- */
  var BL={active:false,phase:'ready',stage:1,cleared:0,stake:0,spent:0,retries:0,earned:0,attemptEarned:0,rewarded:0,analytics:null,lives:3,weapon:1,lane:1,x:200,kills:0,stageKills:0,wave:0,waves:24,clock:0,scroll:0,nextWave:.9,shot:0,enemies:[],bullets:[],pickups:[],fx:[],last:0,focused:document.hasFocus?document.hasFocus():true,flash:0,best:0,serial:0,tracked:false};
  var blCanvas=$('bl-canvas'),blCtx=blCanvas.getContext('2d');
  try{var blSaved=Number(localStorage.getItem('deep-sea-blaster-best'));if(Number.isFinite(blSaved))BL.best=Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,Math.floor(blSaved)));}catch(_){}
  function blSay(text,kind){$('bl-msg').textContent=text;$('bl-msg').className='msg'+(kind?' '+kind:'');}
  function blRetryFee(){return Math.min(5,Math.ceil(BL.stage/2));}
  function blPay(){return BL.earned;}
  var BL_GUNS=[
    {level:1,name:'脈衝彈',kind:'pulse',color:'#9bfff0',pellets:1,scale:1,speed:660,pierce:1,radius:0},
    {level:4,name:'雙管速射',kind:'twin',color:'#74baff',pellets:2,scale:1,speed:740,pierce:1,radius:0},
    {level:8,name:'扇形散彈',kind:'spread',color:'#ffcf68',pellets:3,scale:1,speed:700,pierce:1,radius:0},
    {level:13,name:'穿透光槍',kind:'rail',color:'#9dff86',pellets:2,scale:1.35,speed:1050,pierce:3,radius:0},
    {level:18,name:'追蹤火箭',kind:'rocket',color:'#ff8f75',pellets:2,scale:2.4,speed:450,pierce:1,radius:78},
    {level:24,name:'電漿砲',kind:'plasma',color:'#e6a3ff',pellets:3,scale:1.8,speed:650,pierce:2,radius:58}
  ];
  function blWeapon(){
    var gun=BL_GUNS[0];BL_GUNS.forEach(function(g){if(BL.weapon>=g.level)gun=g;});
    return Object.assign({},gun,{damage:Math.ceil(BL.weapon/3),interval:gun.kind==='rocket'?.38:Math.max(.11,.27-BL.weapon*.005)});
  }
  function blStageConfig(stage){return {waves:Math.min(96,24+6*(stage-1)),interval:Math.max(.78,1.85-(stage-1)*.10),speed:stage<=10?84+stage*12:204+10*Math.log2(stage-9)};}
  function blHealth(){return 3+Math.ceil(1.25*(BL.stage<=10?BL.stage*BL.stage:100+18*(BL.stage-10)));}
  function blPace(){return 1+.28*Math.min(1,BL.wave/BL.waves);}
  function blNextGun(){return BL_GUNS.find(function(g){return g.level>BL.weapon;});}
  function blVisible(){return !$('view-blaster').hidden&&!document.hidden&&BL.focused;}
  function blTracking(){var engaged=BL.active&&BL.phase==='run'&&blVisible();if(engaged===BL.tracked)return;BL.tracked=engaged;if(engaged)AN.resume(BL.analytics,{stage:BL.stage});else if(BL.active)AN.progress(BL.analytics,{stage:BL.stage,score:BL.kills},true);}
  function blUI(){
    var w=blWeapon();$('bl-stage').textContent='第 '+BL.stage+' 關';$('bl-lives').textContent=BL.lives+' / 3';$('bl-wave').textContent=BL.wave+' / '+BL.waves;
    $('bl-weapon').textContent=w.name+' Lv.'+BL.weapon;$('bl-power').textContent=Math.round(w.damage*w.scale*100)/100+' 傷害 × '+w.pellets+' 發';
    var next=blNextGun();$('bl-evolution').textContent=next?'Lv.'+next.level+' 進化 → '+next.name:'電漿砲 · 火力可繼續升級';$('bl-weapon').style.color=w.color;$('bl-speed').textContent=(blStageConfig(BL.stage).speed*blPace()/96).toFixed(2)+'×';$('bl-kills').textContent=BL.kills+' 隻';$('bl-best').textContent=BL.best+' 關';
    $('bl-reward-status').textContent=BL.cleared+' / '+((Math.floor(BL.cleared/10)+1)*10)+' 關';$('bl-pay').textContent=BL.earned+' 點';$('bl-amount').disabled=BL.active;
    $('bl-go').hidden=BL.phase==='lost';$('bl-go').disabled=BL.phase==='run';$('bl-go').textContent=BL.phase==='cleared'?'帶著武器，挑戰下一關':'扣點開始出擊';$('bl-go').dataset.mode='bet';
    $('bl-cash').disabled=BL.phase!=='cleared';$('bl-cash').textContent=BL.phase==='cleared'?'結束這輪（已獲 '+BL.earned+' 點）':'過關後可選擇收隊';
    $('bl-retry').hidden=BL.phase!=='lost';$('bl-retry').disabled=BL.phase!=='lost'||S.balance<blRetryFee();$('bl-retry').textContent='重玩第 '+BL.stage+' 關（扣 '+blRetryFee()+' 點）';
    $('bl-retry-info').hidden=BL.phase!=='lost';$('bl-retry-info').textContent='保留 Lv.'+BL.weapon+' 武器，恢復 3 心，從第 '+BL.stage+' 關第一波重來。'+(S.balance<blRetryFee()?'目前餘額不足，可等待回點。':'');
    $('bl-left').disabled=$('bl-right').disabled=BL.phase!=='run';
  }
  function blRound(){
    BL.phase='run';BL.stageKills=0;BL.wave=0;BL.waves=blStageConfig(BL.stage).waves;BL.clock=0;BL.scroll=0;BL.nextWave=.9;BL.shot=0;BL.enemies=[];BL.bullets=[];BL.pickups=[];BL.fx=[];BL.lane=1;BL.x=200;BL.flash=0;BL.last=performance.now();
    blTracking();blSay('第 '+BL.stage+' 關：自動射擊中。左右換道瞄準怪物，撿彩色武器箱強化火力。');blUI();blCanvas.focus();
  }
  function blStart(){
    if(BL.phase==='run'||BL.phase==='lost')return;
    if(BL.active&&BL.phase==='cleared'){BL.stage++;blRound();return;}
    var stake=ENTRY_FEE;
    if(stake>S.balance){blSay(LOW_MSG,'lose');return;}
    BL.stake=stake;BL.spent=stake;BL.retries=0;BL.earned=0;BL.attemptEarned=0;BL.rewarded=0;BL.stage=1;BL.cleared=0;BL.lives=3;BL.weapon=1;BL.kills=0;BL.active=true;BL.tracked=false;BL.serial=0;
    BL.analytics=AN.start('blaster',stake);S.balance-=stake;save();renderAll();blRound();
  }
  function blRetry(){
    if(BL.active||BL.phase!=='lost')return;
    var cost=blRetryFee();
    if(S.balance<cost){blSay('餘額不足，重玩第 '+BL.stage+' 關需要 '+cost+' 點；可等待平台自動回點。','lose');return;}
    BL.stake=cost;BL.spent+=cost;BL.retries++;BL.attemptEarned=0;BL.lives=3;BL.active=true;BL.tracked=false;
    BL.analytics=AN.start('blaster',cost,{stage:BL.stage,entry_kind:'stage_retry',retry_count:BL.retries});S.balance-=cost;save();renderAll();blRound();
  }
  function blCash(){
    if(!BL.active||BL.phase!=='cleared')return;
    BL.active=false;BL.phase='cashed';BL.tracked=false;
    AN.end(BL.analytics,BL.attemptEarned,'cashout',{stage:BL.cleared,score:BL.kills,multiplier:BL.stake?BL.attemptEarned/BL.stake:0,weapon_level:BL.weapon});
    blSay('已結束這輪，累計獎勵 '+BL.earned+' 點已入帳，不會再次發放。入場與重玩共花費 '+BL.spent+' 點。');blUI();
  }
  function blHurt(){
    if(BL.phase!=='run')return;BL.lives--;BL.flash=.3;
    if(BL.lives<=0){BL.active=false;BL.phase='lost';BL.tracked=false;AN.end(BL.analytics,BL.attemptEarned,'loss',{stage:BL.stage,score:BL.kills,weapon_level:BL.weapon});blSay('防線失守！已獲得的 '+BL.earned+' 點獎勵保留。可扣 '+blRetryFee()+' 點重玩目前第 '+BL.stage+' 關，保留武器並恢復 3 心。','lose');}
    else blSay('怪物突破防線，扣 1 心！剩 '+BL.lives+' 心，快找武器箱提升火力。','lose');blUI();
  }
  function blClear(){
    if(BL.phase!=='run')return;BL.cleared=BL.stage;BL.phase='cleared';BL.bullets=[];
    var milestones=Math.floor(BL.cleared/10),bonus=Math.max(0,milestones-BL.rewarded);
    if(bonus){BL.rewarded=milestones;BL.earned+=bonus;BL.attemptEarned+=bonus;S.balance+=bonus;save();renderAll();}
    BL.tracked=false;AN.progress(BL.analytics,{stage:BL.stage,score:BL.kills,bonus_points:bonus,total_bonus_points:BL.earned},true);
    if(BL.cleared>BL.best){BL.best=BL.cleared;try{localStorage.setItem('deep-sea-blaster-best',String(BL.best));}catch(_){}}
    blSay('第 '+BL.stage+' 關完成！'+(bonus?'獲得 '+bonus+' 點，已直接入帳。':'')+'可帶著 Lv.'+BL.weapon+' 武器與 '+BL.lives+' 心挑戰第 '+(BL.stage+1)+' 關。','win');blUI();
  }
  var BL_MOBS={
    octo:{name:'泡泡章魚',color:'#b8a4f4',health:1,speed:1},
    crab:{name:'裝甲螃蟹',color:'#f4a66d',health:1.7,speed:.82},
    ray:{name:'衝刺魟魚',color:'#65e1cb',health:.65,speed:1.48},
    eel:{name:'換道電鰻',color:'#ffe076',health:.9,speed:1.08},
    turtle:{name:'護盾海龜',color:'#79bfff',health:1,speed:.86},
    jelly:{name:'分裂水母',color:'#ff9cce',health:1.15,speed:.9},
    mini:{name:'小水母',color:'#ffc5e4',health:.25,speed:1.18}
  };
  function blEnemy(lane,y,type,hp){
    var spec=BL_MOBS[type],health=Math.ceil(hp*spec.health);
    return {type:type,lane:lane,x:80+lane*120,y:y,hp:health,max:health,speed:blStageConfig(BL.stage).speed*spec.speed,shield:type==='turtle'?Math.ceil(hp*.75):0,shieldMax:type==='turtle'?Math.ceil(hp*.75):0,hit:0,id:++BL.serial,age:0,shiftAt:1.5,telegraph:0,targetLane:null};
  }
  function blMobType(wave){
    if(BL.stage>=4&&wave%7===0)return 'turtle';
    if(BL.stage>=5&&wave%5===0)return 'jelly';
    if(wave%4===0)return 'crab';
    if(BL.stage>=3&&wave%3===0)return 'eel';
    if(BL.stage>=2&&wave%2===0)return 'ray';
    return 'octo';
  }
  function blSpawn(){
    BL.wave++;var lane=Math.floor(Math.random()*3),hp=blHealth(),config=blStageConfig(BL.stage);
    BL.enemies.push(blEnemy(lane,-32,blMobType(BL.wave),hp));
    if(BL.stage>=3&&BL.wave%4===2)BL.enemies.push(blEnemy((lane+1+Math.floor(Math.random()*2))%3,-145,BL.stage>=6?'ray':'octo',hp));
    if(BL.wave%5===1){var pickLane=(lane+1+Math.floor(Math.random()*2))%3;BL.pickups.push({lane:pickLane,x:80+pickLane*120,y:-105,speed:config.speed,boost:1});}
    BL.nextWave=config.interval*(1-.16*BL.wave/BL.waves);blUI();
  }
  function blAdvanceEnemy(e,step){
    e.y+=e.speed*blPace()*step;e.hit=Math.max(0,e.hit-step);e.age=(e.age||0)+step;
    if(e.type!=='eel')return;
    if(e.targetLane!==null){e.telegraph-=step;if(e.telegraph<=0){e.x+=(80+e.targetLane*120-e.x)*Math.min(1,step*9);if(Math.abs(e.x-(80+e.targetLane*120))<1){e.x=80+e.targetLane*120;e.lane=e.targetLane;e.targetLane=null;e.shiftAt=e.age+2.2;}}}
    else if(e.y>65&&e.y<365&&e.age>=e.shiftAt){e.targetLane=e.lane===0?1:e.lane===2?1:e.id%2?0:2;e.telegraph=.65;}
  }
  function blDamage(e,damage){
    if(e.hp<=0)return;
    if(e.shield>0){var blocked=Math.min(e.shield,damage);e.shield-=blocked;damage-=blocked;if(e.shield===0)blEffect(e.x,e.y,'#79bfff',14);}
    e.hp-=damage;e.hit=.09;
    if(e.hp>0)return;
    BL.kills++;BL.stageKills++;blEffect(e.x,e.y,(BL_MOBS[e.type]||BL_MOBS.octo).color,9);
    if(e.type==='jelly'){
      var hp=blHealth(),y=Math.min(e.y,390);
      BL.enemies.push(blEnemy(Math.max(0,e.lane-1),y-22,'mini',hp));BL.enemies.push(blEnemy(Math.min(2,e.lane+1),y-65,'mini',hp));
    }
  }
  function blSegmentHit(ax,ay,bx,by,e,radius){
    var dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,((e.x-ax)*dx+(e.y-ay)*dy)/length)):0;
    return Math.hypot(ax+dx*t-e.x,ay+dy*t-e.y)<radius;
  }
  function blMove(direction){
    if(BL.phase!=='run'||!blVisible())return;blSync(performance.now());if(BL.phase!=='run')return;
    BL.lane=Math.max(0,Math.min(2,BL.lane+direction));blTracking();
  }
  function blBurst(){
    var w=blWeapon();for(var i=0;i<w.pellets;i++){
      var offset=i-(w.pellets-1)/2,spread=w.kind==='spread'?offset*175:w.kind==='plasma'?offset*60:0;
      BL.bullets.push({x:BL.x+offset*13,y:508,damage:w.damage*w.scale,vx:spread,speed:w.speed,kind:w.kind,color:w.color,pierce:w.pierce,radius:w.radius,hits:[]});
    }BL.shot=w.interval;
  }
  function blAdvanceBullet(b,step){
    var ax=b.x,ay=b.y;
    if(b.kind==='rocket'){
      var target=null;BL.enemies.forEach(function(e){if(e.hp>0&&e.y<b.y+12&&(!target||Math.hypot(e.x-b.x,e.y-b.y)<Math.hypot(target.x-b.x,target.y-b.y)))target=e;});
      if(target)b.x+=Math.max(-210*step,Math.min(210*step,target.x-b.x));
    }else b.x+=(b.vx||0)*step;
    b.y-=b.speed*step;
    // Resolve nearest along this projectile's path, preserving one hit per enemy for piercing shots.
    var targets=BL.enemies.filter(function(e){return e.hp>0&&b.hits.indexOf(e.id)<0&&blSegmentHit(ax,ay,b.x,b.y,e,27+(b.kind==='plasma'?7:0));}).sort(function(a,c){return Math.hypot(a.x-ax,a.y-ay)-Math.hypot(c.x-ax,c.y-ay);});
    for(var j=0;j<targets.length&&b.pierce>0;j++){
      var enemy=targets[j];if(enemy.hp<=0)continue;b.hits.push(enemy.id);blDamage(enemy,b.damage);b.pierce--;
      if(b.radius>0){
        var splash=BL.enemies.slice();splash.forEach(function(e){if(e.id!==enemy.id&&e.hp>0&&Math.hypot(e.x-enemy.x,e.y-enemy.y)<b.radius)blDamage(e,b.damage*.55);});
        BL.fx.push({x:enemy.x,y:enemy.y,vx:0,vy:0,t:.32,color:b.color,ring:b.radius});
      }
    }
    if(b.pierce<=0)b.y=-1000;
  }
  function blEffect(x,y,color,count){for(var i=0;i<(reduceMotion?0:count);i++)BL.fx.push({x:x,y:y,vx:(Math.random()-.5)*130,vy:(Math.random()-.5)*130,t:.45,color:color});}
  function blStep(dt){
    while(dt>1e-8&&BL.phase==='run'){
      var step=Math.min(dt,.016);dt-=step;BL.clock+=step;BL.scroll+=blStageConfig(BL.stage).speed*blPace()*step;BL.flash=Math.max(0,BL.flash-step);BL.x+=(80+BL.lane*120-BL.x)*Math.min(1,step*22);
      BL.shot-=step;if(BL.shot<=0)blBurst();BL.nextWave-=step;if(BL.wave<BL.waves&&BL.nextWave<=0)blSpawn();
      BL.enemies.forEach(function(e){blAdvanceEnemy(e,step);});BL.pickups.forEach(function(p){p.y+=p.speed*blPace()*step;});
      BL.bullets.forEach(function(b){blAdvanceBullet(b,step);});
      BL.bullets=BL.bullets.filter(function(b){return b.y>-40&&b.x>-40&&b.x<440;});BL.enemies=BL.enemies.filter(function(e){return e.hp>0;});
      for(var k=BL.enemies.length-1;k>=0;k--){var e=BL.enemies[k];if(e.y>585||(Math.abs(e.x-BL.x)<38&&Math.abs(e.y-532)<37)){BL.enemies.splice(k,1);blHurt();if(BL.phase!=='run')return;}}
      for(var k=BL.pickups.length-1;k>=0;k--){var p=BL.pickups[k];if(Math.abs(p.x-BL.x)<40&&Math.abs(p.y-532)<39){BL.weapon=Math.min(Number.MAX_SAFE_INTEGER,BL.weapon+p.boost);BL.pickups.splice(k,1);blEffect(p.x,p.y,'#ffb638',12);blSay(blWeapon().name+' Lv.'+BL.weapon+'！武器與彈種升級，繼續守住防線。','win');blUI();}else if(p.y>620)BL.pickups.splice(k,1);}
      BL.fx.forEach(function(f){f.x+=f.vx*step;f.y+=f.vy*step;f.t-=step;});BL.fx=BL.fx.filter(function(f){return f.t>0;});
      if(BL.wave===BL.waves&&!BL.enemies.length&&!BL.pickups.length)blClear();
    }
  }
  function blSync(now){
    blTracking();var dt=BL.last?Math.max(0,Math.min(.06,(now-BL.last)/1000)):0;BL.last=now;
    if(BL.phase==='run'&&blVisible())blStep(dt);
  }
  function blRoundRect(x,y,w,h,r,color){blCtx.fillStyle=color;blCtx.beginPath();blCtx.roundRect(x,y,w,h,r);blCtx.fill();}
  function blDrawMonster(e){
    var g=blCtx,x=e.x,y=e.y,t=BL.clock,spec=BL_MOBS[e.type]||BL_MOBS.octo,c=e.hit>0?'#fff':spec.color;
    if(e.type==='eel'&&e.targetLane!==null){
      var target=80+e.targetLane*120;g.strokeStyle='rgba(255,224,118,.65)';g.lineWidth=2;g.setLineDash([5,5]);g.beginPath();g.moveTo(x,y);g.lineTo(target,y+40);g.stroke();g.setLineDash([]);g.fillStyle='#ffe076';g.font='bold 20px system-ui';g.textAlign='center';g.fillText(target<x?'←':'→',target,y+30);
    }
    g.save();g.translate(x,y);if(!reduceMotion)g.rotate(Math.sin(t*4+e.id)*.06);
    g.fillStyle=c;g.strokeStyle=c;g.lineWidth=7;g.lineCap='round';
    if(e.type==='crab'){
      [-1,1].forEach(function(d){g.beginPath();g.moveTo(d*20,4);g.lineTo(d*37,-7);g.lineTo(d*39,-19);g.stroke();g.beginPath();g.arc(d*39,-23,9,0,Math.PI*1.6);g.fill();for(var i=0;i<2;i++){g.beginPath();g.moveTo(d*18,12+i*6);g.lineTo(d*33,22+i*7);g.stroke();}});
      blRoundRect(-27,-21,54,47,12,c);blRoundRect(-26,-22,52,12,5,'#94695f');
    }else if(e.type==='ray'){
      g.beginPath();g.moveTo(0,-30);g.quadraticCurveTo(13,-2,43,14);g.lineTo(15,20);g.lineTo(0,11);g.lineTo(-15,20);g.lineTo(-43,14);g.quadraticCurveTo(-13,-2,0,-30);g.fill();g.lineWidth=4;g.beginPath();g.moveTo(0,12);g.quadraticCurveTo(15,30,0,44);g.stroke();
    }else if(e.type==='eel'){
      g.lineWidth=16;g.beginPath();g.moveTo(0,-24);g.bezierCurveTo(-32,-8,30,8,0,24);g.stroke();g.beginPath();g.ellipse(0,-19,18,14,0,0,7);g.fill();g.strokeStyle='#b08c25';g.lineWidth=3;g.beginPath();g.moveTo(-4,-4);g.lineTo(7,1);g.lineTo(-7,8);g.lineTo(5,15);g.stroke();
    }else if(e.type==='turtle'){
      [-1,1].forEach(function(d){g.beginPath();g.ellipse(d*25,12,12,8,d*.4,0,7);g.fill();});g.beginPath();g.ellipse(0,-22,14,16,0,0,7);g.fill();g.fillStyle=e.hit>0?'#fff':'#3e698e';g.beginPath();g.ellipse(0,7,26,29,0,0,7);g.fill();g.strokeStyle='#a9d4ed';g.lineWidth=2;g.beginPath();g.moveTo(0,-15);g.lineTo(15,-4);g.lineTo(15,15);g.lineTo(0,27);g.lineTo(-15,15);g.lineTo(-15,-4);g.closePath();g.stroke();
    }else{
      var small=e.type==='mini',jelly=e.type==='jelly'||small,size=small?16:25;
      g.lineWidth=small?4:7;for(var i=0;i<3;i++){g.beginPath();g.moveTo(-size*.65+i*size*.65,9);g.quadraticCurveTo(-size+i*size*.7,32,-size*.6+i*size*.65+Math.sin(t*5+i)*4,small?24:32);g.stroke();}
      g.beginPath();g.ellipse(0,0,size,jelly?size*.75:size,0,0,7);g.fill();if(jelly){g.fillStyle='#ffe6f4';g.beginPath();g.arc(-6,-6,4,0,7);g.fill();}
    }
    var ey=e.type==='turtle'?-26:e.type==='eel'?-22:-4,eyeSize=e.type==='mini'?4:6;
    g.fillStyle='#fff';g.beginPath();g.ellipse(-8,ey,eyeSize,eyeSize+2,0,0,7);g.ellipse(8,ey,eyeSize,eyeSize+2,0,0,7);g.fill();g.fillStyle='#182c40';g.beginPath();g.arc(-7,ey+1,2.5,0,7);g.arc(9,ey+1,2.5,0,7);g.fill();g.restore();
    if(e.shield>0){g.strokeStyle='#79bfff';g.lineWidth=3;g.beginPath();g.ellipse(x,y,34,42,0,0,7);g.stroke();blRoundRect(x-27,y-60,54*e.shield/e.shieldMax,4,2,'#79bfff');}
    blRoundRect(x-27,y-49,54,6,3,'#183a49');blRoundRect(x-27,y-49,54*Math.max(0,e.hp/e.max),6,3,spec.color);g.font='bold 11px system-ui';g.textAlign='center';g.fillStyle='#e4f2f3';g.fillText(Math.max(0,Math.ceil(e.hp))+' HP',x,y-66);
  }
  function blDrawBullet(b){
    var g=blCtx,x=b.x,y=b.y;g.fillStyle=b.color;g.strokeStyle=b.color;
    if(b.kind==='pulse'){g.beginPath();g.ellipse(x,y,4,8,0,0,7);g.fill();}
    else if(b.kind==='twin'){blRoundRect(x-3,y-12,6,24,3,b.color);blRoundRect(x-1,y-9,2,13,1,'#e7f5ff');}
    else if(b.kind==='spread'){g.beginPath();g.moveTo(x,y-11);g.lineTo(x+5,y+6);g.lineTo(x,y+2);g.lineTo(x-5,y+6);g.closePath();g.fill();}
    else if(b.kind==='rail'){g.globalAlpha=.2;blRoundRect(x-7,y-30,14,62,7,b.color);g.globalAlpha=1;blRoundRect(x-2,y-30,4,45,2,'#e4ffd9');}
    else if(b.kind==='rocket'){g.beginPath();g.moveTo(x,y-12);g.lineTo(x+5,y-3);g.lineTo(x+5,y+8);g.lineTo(x-5,y+8);g.lineTo(x-5,y-3);g.closePath();g.fill();g.fillStyle='#ffcf68';g.beginPath();g.moveTo(x-3,y+9);g.lineTo(x,y+19);g.lineTo(x+3,y+9);g.fill();}
    else {g.globalAlpha=.2;g.beginPath();g.arc(x,y,14,0,7);g.fill();g.globalAlpha=1;g.beginPath();g.arc(x,y,8,0,7);g.fill();g.fillStyle='#fff2ff';g.beginPath();g.arc(x-2,y-2,3,0,7);g.fill();}
  }
  function blDrawPickup(p){
    var g=blCtx,gun=BL_GUNS[0];BL_GUNS.forEach(function(w){if(Math.min(Number.MAX_SAFE_INTEGER,BL.weapon+p.boost)>=w.level)gun=w;});
    g.save();g.translate(p.x,p.y);if(!reduceMotion)g.rotate(Math.sin(BL.clock*3)*.07);g.fillStyle='rgba(255,182,56,.12)';g.beginPath();g.arc(0,0,36,0,7);g.fill();blRoundRect(-22,-22,44,44,10,gun.color);blRoundRect(-17,-17,34,34,7,'#23394a');
    g.fillStyle=gun.color;g.beginPath();g.moveTo(3,-14);g.lineTo(-9,3);g.lineTo(-1,3);g.lineTo(-4,15);g.lineTo(11,-4);g.lineTo(3,-4);g.closePath();g.fill();g.fillStyle='#fff0c3';g.font='bold 11px system-ui';g.textAlign='center';g.fillText('火力 +'+p.boost,0,37);g.font='10px system-ui';g.fillText(gun.name,0,50);g.restore();
  }
  function blDrawPlayer(){
    var g=blCtx,px=BL.x,py=532,gun=blWeapon(),c=gun.color;
    g.fillStyle='rgba(98,230,210,.12)';g.beginPath();g.ellipse(px,py+28,35,11,0,0,7);g.fill();g.fillStyle=c;g.beginPath();g.moveTo(px,py-27);g.lineTo(px+29,py+18);g.lineTo(px+17,py+25);g.lineTo(px,py+17);g.lineTo(px-17,py+25);g.lineTo(px-29,py+18);g.closePath();g.fill();
    blRoundRect(px-9,py-13,18,23,8,'#163e50');g.fillStyle='#ecffff';g.beginPath();g.arc(px,py-6,5,0,7);g.fill();
    if(gun.kind==='pulse')blRoundRect(px-4,py-35,8,24,4,c);
    if(gun.kind==='twin')[-1,1].forEach(function(d){blRoundRect(px+d*14-5,py-35,10,29,4,c);});
    if(gun.kind==='spread')[-1,0,1].forEach(function(d){g.save();g.translate(px+d*13,py-16);g.rotate(d*.24);blRoundRect(-5,-22,10,26,3,c);g.restore();});
    if(gun.kind==='rail'){blRoundRect(px-11,py-48,7,38,2,c);blRoundRect(px+4,py-48,7,38,2,c);blRoundRect(px-14,py-30,28,7,2,'#406f58');}
    if(gun.kind==='rocket')[-1,1].forEach(function(d){blRoundRect(px+d*24-8,py-23,16,35,5,'#734b4c');blRoundRect(px+d*24-6,py-31,12,20,4,c);g.fillStyle='#ffcf68';g.beginPath();g.arc(px+d*24,py-24,3,0,7);g.fill();});
    if(gun.kind==='plasma'){g.strokeStyle=c;g.lineWidth=3;g.beginPath();g.ellipse(px,py-29,24,12,0,0,7);g.stroke();g.fillStyle=c;g.beginPath();g.arc(px,py-29,11,0,7);g.fill();g.fillStyle='#fff2ff';g.beginPath();g.arc(px-3,py-32,4,0,7);g.fill();[-1,1].forEach(function(d){blRoundRect(px+d*27-4,py-17,8,31,3,c);});}
    if(BL.phase==='run'&&!reduceMotion){g.fillStyle=c;g.beginPath();g.moveTo(px-7,py+22);g.lineTo(px,py+36+Math.sin(BL.clock*35)*5);g.lineTo(px+7,py+22);g.fill();}
  }
  function blDraw(){
    var g=blCtx,w=400,h=600;g.clearRect(0,0,w,h);g.fillStyle='#061c2c';g.fillRect(0,0,w,h);
    var glow=g.createLinearGradient(0,0,0,h);glow.addColorStop(0,'#133b50');glow.addColorStop(1,'#071d2d');g.fillStyle=glow;g.fillRect(20,0,360,h);
    for(var i=0;i<3;i++){g.fillStyle=i===BL.lane?'rgba(98,230,210,.06)':'rgba(255,255,255,.015)';g.fillRect(22+i*120,0,116,h);}
    g.strokeStyle='#265061';g.lineWidth=1;g.setLineDash([8,15]);[140,260].forEach(function(x){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();});g.setLineDash([]);
    g.strokeStyle='rgba(98,230,210,.09)';for(var i=0;i<9;i++){var y=(i*80+(reduceMotion?0:BL.scroll*.65))%680-40;g.beginPath();g.moveTo(22,y);g.lineTo(378,y);g.stroke();}
    g.fillStyle='rgba(98,230,210,.22)';for(var i=0;i<12;i++){g.beginPath();g.arc(9+(i%2)*382,((i*71-BL.scroll*.15)%640+640)%640,2+i%3,0,7);g.fill();}
    BL.bullets.forEach(blDrawBullet);BL.enemies.forEach(blDrawMonster);BL.pickups.forEach(blDrawPickup);blDrawPlayer();
    BL.fx.forEach(function(f){g.globalAlpha=Math.max(0,f.t/.45);g.fillStyle=f.color;if(f.ring){g.strokeStyle=f.color;g.lineWidth=2;g.beginPath();g.arc(f.x,f.y,f.ring*(reduceMotion?.8:1-f.t/.36),0,7);g.stroke();}else g.fillRect(f.x-2,f.y-2,4,4);});g.globalAlpha=1;
    g.fillStyle='rgba(4,18,29,.9)';g.fillRect(0,0,400,54);g.font='bold 14px system-ui';g.fillStyle='#e4f2f3';g.textAlign='left';g.fillText('第 '+BL.stage+' 關 · '+BL.wave+'/'+BL.waves+' 波',16,23);g.fillStyle='#ffb638';g.fillText(blWeapon().name+' Lv.'+BL.weapon,16,44);g.textAlign='right';g.fillStyle='#ff958c';g.fillText('♥'.repeat(Math.max(0,BL.lives))+'♡'.repeat(3-Math.max(0,BL.lives)),384,25);g.fillStyle='#9fc1ca';g.font='12px system-ui';g.fillText((blStageConfig(BL.stage).speed*blPace()/96).toFixed(2)+'× 航速',384,44);
    if(BL.flash>0){g.fillStyle='rgba(255,111,97,'+(BL.flash*.6)+')';g.fillRect(0,0,w,h);}
    if(BL.phase!=='run'||!blVisible()){
      g.fillStyle='rgba(4,18,29,.82)';g.fillRect(0,0,w,h);blRoundRect(28,180,344,222,18,'#113041');g.strokeStyle='#326475';g.lineWidth=1;g.strokeRect(40,194,320,194);
      g.textAlign='center';g.fillStyle=BL.phase==='lost'?'#ff958c':'#62e6d2';g.font='bold 28px system-ui';g.fillText(BL.phase==='ready'?'深海火線':BL.phase==='cleared'?'防線守住了！':BL.phase==='cashed'?'出擊完成':BL.phase==='lost'?'防線失守':'已暫停',200,236);
      g.fillStyle='#e4f2f3';g.font='15px system-ui';g.fillText(BL.phase==='ready'?'三條航道，自動開火。':BL.phase==='cleared'?'下一站：第 '+(BL.stage+1)+' 關':BL.phase==='cashed'?'本輪已獲得 '+BL.earned+' 點':BL.phase==='lost'?'已獲 '+BL.earned+' 點保留，可付費重玩本關':'回到遊戲後繼續',200,276);
      g.fillStyle='#ffdc87';g.fillText(BL.phase==='ready'?'散彈 · 穿透光槍 · 追蹤火箭 · 電漿砲':blWeapon().name+' · 擊破 '+BL.kills+' 隻',200,310);
      g.fillStyle='#9fc1ca';g.font='13px system-ui';g.fillText(BL.phase==='ready'?'使用下方或右側按鈕扣點開始':'使用操作面板選擇下一步',200,352);
    }
    g.textAlign='center';g.fillStyle='#8db0b9';g.font='11px system-ui';g.fillText('← 點左半邊換道　｜　點右半邊換道 →',200,585);
  }
  $('bl-go').addEventListener('click',blStart);$('bl-retry').addEventListener('click',blRetry);$('bl-cash').addEventListener('click',blCash);
  $('bl-left').addEventListener('click',function(){blMove(-1);});$('bl-right').addEventListener('click',function(){blMove(1);});
  blCanvas.addEventListener('pointerdown',function(e){if(BL.phase!=='run')return;e.preventDefault();blCanvas.focus();var bounds=blCanvas.getBoundingClientRect();blMove(e.clientX-bounds.left<bounds.width/2?-1:1);});
  document.addEventListener('keydown',function(e){if(!blVisible()||BL.phase!=='run'||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;if(['INPUT','BUTTON','A','SUMMARY','TEXTAREA','SELECT'].indexOf(e.target.tagName)>=0||e.target.isContentEditable)return;var key=e.key.toLowerCase();if(['arrowleft','a','arrowright','d'].indexOf(key)<0)return;e.preventDefault();blMove(key==='arrowleft'||key==='a'?-1:1);});
  function blSuspend(){BL.last=performance.now();blTracking();}
  window.addEventListener('blur',function(){BL.focused=false;blSuspend();});window.addEventListener('focus',function(){BL.focused=true;blSuspend();});
  document.addEventListener('visibilitychange',blSuspend);window.addEventListener('hashchange',blSuspend);
  window.addEventListener('pagehide',function(e){if(!e.persisted&&BL.active){AN.end(BL.analytics,BL.attemptEarned,'abandoned',{stage:BL.stage,score:BL.kills,weapon_level:BL.weapon});BL.active=false;BL.tracked=false;}},true);
  function blLoop(now){blSync(now);if(!$('view-blaster').hidden){blUI();blDraw();}requestAnimationFrame(blLoop);}
  blUI();blDraw();requestAnimationFrame(blLoop);
