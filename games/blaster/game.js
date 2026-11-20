  /* ---------- Reef Blaster: endless voyage, automatic fire, and verified guest distance ---------- */
  var BL=blasterRules.state();
  BL.phase='ready';BL.focused=document.hasFocus?document.hasFocus():true;
  var blRandom=Math.random,blPendingAim=null,blLastAim=-1,blLastKeys=0;
  var blModel=blasterRules.bind(BL,function(){return blRandom();},blEvent,reduceMotion);
  var {BL_FLEET_MAX,BL_GATE_HALF,BL_SPAWN_Y,BL_GUNS,BL_MOBS,BL_SLOTS}=blasterRules;
  var {blWeapon,blStageConfig,blHealth,blPace,blAdvanceDistance,blOfferPicks,blChoose,blHurt,blChangeFleet,blEnemy,blWavePlan,blSpawn,blSpawnGates,blSpawnSwarm,blBossSpawn,blAdvanceBoss,blAdvanceEnemy,blDamage,blSegmentHit,blFleetWidth,blFleet,blFleetTouch,blClampX,blClampY,blReleaseDirections,blAim,blAdvanceFleet,blBurst,blGateContains,blAdvanceBullet,blEffect,blStep}=blModel;
  var blRank=timedLeaderboard('blaster','bl',blasterRules.inputCount,blUI,function(){
    window.dispatchEvent(new CustomEvent('deep-sea-score-saved',{detail:{gameId:'blaster'}}));
  });
  var blCanvas=$('bl-canvas'),blCtx=blCanvas.getContext('2d');
  var BL_ART_PATH='games/blaster/assets/';
  var blCanyon=blLoadArt('reef-canyon.jpg'),blAtlas=blLoadArt('reef-sprites.png');
  // Tight source rectangles in the 512px atlas.
  var BL_SPRITES={ship:[12,25,233,193],octo:[279,30,209,195],crab:[12,293,230,163],ray:[267,285,234,196]};
  function blLoadArt(filename){
    var image=new Image();
    image.src=BL_ART_PATH+filename;
    return image;
  }
  function blDrawSprite(kind,width){
    var rect=BL_SPRITES[kind];
    if(!rect||!blAtlas.naturalWidth)return false;
    var height=width*rect[3]/rect[2];
    blCtx.drawImage(blAtlas,rect[0],rect[1],rect[2],rect[3],-width/2,-height/2,width,height);
    return true;
  }
  try{var blSaved=Number(localStorage.getItem('deep-sea-blaster-distance-best'));if(Number.isFinite(blSaved))BL.best=Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,Math.floor(blSaved)));}catch(_){}
  function blSay(text,kind){$('bl-msg').textContent=text;$('bl-msg').className='bl-accessible msg'+(kind?' '+kind:'');}
  function blPay(){return BL.earned;}
  function blMeters(value){return Math.floor(value).toLocaleString('en-US')+' m';}
  function blSaveBest(){
    if(Math.floor(BL.distance)<=BL.best)return;
    BL.best=Math.floor(BL.distance);
    try{localStorage.setItem('deep-sea-blaster-distance-best',String(BL.best));}catch(_){}
  }
  function blVisible(){return !$('view-blaster').hidden&&!document.hidden&&BL.focused;}
  function blTracking(){var engaged=BL.active&&BL.phase==='run'&&blVisible();if(engaged===BL.tracked)return;BL.tracked=engaged;if(engaged)AN.resume(BL.analytics,{stage:BL.stage});else if(BL.active)AN.progress(BL.analytics,{stage:BL.stage,score:BL.kills},true);}
  function blUI(){
    $('bl-lives').textContent=BL.lives+' / '+BL_FLEET_MAX;
    var launch=$('bl-go');
    launch.hidden=BL.phase!=='ready'&&BL.phase!=='lost';
    launch.disabled=blRank.busy();
    launch.textContent=BL.phase==='lost'?'{{t:blaster.msg.001}}':'{{t:blaster.msg.002}}';
    $('bl-playfield').classList.toggle('bl-immersive',BL.phase!=='ready');
    $('bl-leaderboard').hidden=BL.phase==='run'||BL.phase==='pick';
  }
  function blFinish(result){
    if(!BL.active)return;
    blSaveBest();BL.active=false;BL.tracked=false;
    AN.end(BL.analytics,BL.earned,result,{stage:BL.stage,score:BL.kills,distance_m:Math.floor(BL.distance),weapon_level:BL.weapon});
  }
  function blExit(){
    blFinish('abandoned');blSuspend();BL.phase='ready';blUI();
    window.location.hash='lobby';
  }
  function blRound(){
    var board=$('bl-rank-panel');
    if(board)board.open=false;
    BL.phase='run';BL.wave=0;BL.clock=0;BL.scroll=0;BL.nextWave=.10;BL.shot=0;BL.enemies=[];BL.bullets=[];BL.fx=[];BL.ink=[];BL.gates=[];
    BL.target=BL.x=200;BL.targetY=BL.y=BL_SPAWN_Y;BL.dragging=null;blReleaseDirections();BL.flash=0;BL.last=performance.now();
    blTracking();blSay('{{t:blaster.msg.003}}');blUI();blCanvas.focus();
  }
  // Weapon choice cards: the fight pauses every BL_CARD_EVERY waves and resumes after the pick.
  // Cards only swap the weapon form (or heal); firepower level grows by +1 every 1,000 m and per boss.
  function blStart(){
    if(BL.active||blRank.busy())return;
    var stake=ENTRY_FEE;
    if(stake>S.balance){blSay(LOW_MSG,'lose');return;}
    blRank.start(function(random){
      var focused=BL.focused,best=BL.best;
      Object.assign(BL,blasterRules.state());BL.focused=focused;BL.best=best;BL.active=true;
      blRandom=random||Math.random;blPendingAim=null;blLastAim=-1;blLastKeys=0;
      BL.analytics=AN.start('blaster',stake);save();renderAll();blRound();
    }, undefined, {rulesVersion:blasterRules.rulesVersion});
  }
  function blEvent(type,bonus){
    var params={stage:BL.stage,score:BL.kills,distance_m:Math.floor(BL.distance)};
    if(type==='depth')AN.progress(BL.analytics,params);
    else if(type==='bonus'){
      S.balance+=bonus;save();renderAll();
      AN.progress(BL.analytics,Object.assign(params,{bonus_points:bonus,total_bonus_points:BL.earned,weapon_form:BL.form}));
    }else if(type==='pick'){
      blTracking();blSay('{{t:blaster.msg.004}}','win');
    }else if(type==='chosen'){
      BL.last=performance.now();blTracking();blSay('{{t:blaster.msg.005}}');blCanvas.focus();
    }else if(type==='lost'){
      blFinish('loss');blRank.finish(Math.floor(BL.distance));
      blSay('{{t:blaster.msg.006}}','lose');
    }else if(type==='hurt')blSay('編隊受損！剩 '+BL.lives+' 艘潛艇。','lose');
    else if(type==='recruit')blSay('補員完成！編隊現有 '+BL.lives+' 艘潛艇。','win');
    else if(type==='boss')blSay('{{t:blaster.msg.007}}','lose');
    blUI();
  }
  function blInput(code){
    if(blModel.input(code))blRank.record(code);
  }
  function blSync(now){
    blTracking();var dt=BL.last?Math.max(0,Math.min(.06,(now-BL.last)/1000)):0;BL.last=now;
    if(BL.phase!=='run'||!blVisible())return;
    if(blPendingAim!==null&&blPendingAim!==blLastAim){
      blInput(blPendingAim);blLastAim=blPendingAim;
    }
    blPendingAim=null;
    var keys=Number(BL.keys.l)+2*Number(BL.keys.r)+4*Number(BL.keys.u)+8*Number(BL.keys.d);
    if(keys!==blLastKeys){blInput(3+keys);blLastKeys=keys;blLastAim=-1;}
    blRank.update(dt*1000,function(){return BL.phase==='run';},blStep);
  }
  function blRoundRect(x,y,w,h,r,color){blCtx.fillStyle=color;blCtx.beginPath();blCtx.roundRect(x,y,w,h,r);blCtx.fill();}
  function blDrawBoss(e){
    var g=blCtx,x=e.x,y=e.y,t=BL.clock,c='#ff7a6b';
    e.warn.forEach(function(l){g.fillStyle='rgba(255,70,60,'+(.18+.12*Math.sin(t*20))+')';g.fillRect(BL_SLOTS[l]-36,y+40,72,600);g.fillStyle='#ff8f85';g.font='bold 22px system-ui';g.textAlign='center';g.fillText('!',BL_SLOTS[l],y+90);});
    g.save();g.translate(x,y);g.strokeStyle=c;g.lineWidth=9;g.lineCap='round';for(var i=0;i<6;i++){g.beginPath();g.moveTo(-60+i*24,20);g.quadraticCurveTo(-70+i*24+Math.sin(t*3+i)*10,60,-62+i*24+Math.sin(t*4+i)*14,84);g.stroke();}
    g.fillStyle=c;g.beginPath();g.ellipse(0,0,78,56,0,0,7);g.fill();g.fillStyle='#8d3a3a';g.beginPath();g.ellipse(0,-30,48,16,0,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.ellipse(-26,-2,13,15,0,0,7);g.ellipse(26,-2,13,15,0,0,7);g.fill();g.fillStyle='#2a0f14';g.beginPath();g.arc(-24+Math.sin(t)*4,0,6,0,7);g.arc(28+Math.sin(t)*4,0,6,0,7);g.fill();if(e.hit>0){g.globalAlpha=.3;g.fillStyle='#fff';g.beginPath();g.ellipse(0,0,78,56,0,0,7);g.fill();g.globalAlpha=1;}g.restore();
    blRoundRect(30,62,340,10,5,'#3a1a22');blRoundRect(30,62,340*Math.max(0,e.hp/e.max),10,5,'#ff7a6b');g.textAlign='center';g.fillStyle='#ffe4e0';g.font='bold 12px system-ui';g.fillText('深海巨獸 '+Math.max(0,Math.ceil(e.hp))+' HP',200,92);
  }
  function blDrawMonster(e){
    if(e.type==='reef'){
      var g=blCtx,x=e.x,y=e.y;
      blRoundRect(x-50,y-22,100,44,9,'#3d566d');
      g.strokeStyle='#ffc66b';g.lineWidth=2;g.beginPath();g.roundRect(x-50,y-22,100,44,9);g.stroke();
      g.fillStyle='#99bbc6';g.beginPath();g.moveTo(x-38,y-13);g.lineTo(x-7,y-18);g.lineTo(x+9,y-4);g.lineTo(x-21,y+1);g.closePath();g.fill();
      g.fillStyle='#ffdaa2';g.font='bold 18px system-ui';g.textAlign='center';g.fillText('×',x+29,y+8);
      return;
    }
    if(e.type==='boss'){blDrawBoss(e);return;}
    var g=blCtx,x=e.x,y=e.y,t=BL.clock,spec=BL_MOBS[e.type]||BL_MOBS.octo,c=e.hit>0?'#fff':spec.color;
    if(e.type==='eel'&&e.targetLane!==null){
      var target=BL_SLOTS[e.targetLane];g.strokeStyle='rgba(255,224,118,.65)';g.lineWidth=2;g.setLineDash([5,5]);g.beginPath();g.moveTo(x,y);g.lineTo(target,y+40);g.stroke();g.setLineDash([]);g.fillStyle='#ffe076';g.font='bold 20px system-ui';g.textAlign='center';g.fillText(target<x?'←':'→',target,y+30);
    }
    var swarm=e.swarmOffset!==undefined;
    g.save();g.translate(x,y);
    if(!reduceMotion)g.rotate(Math.sin(t*4+e.id)*.06);
    if(e.type==='ray')g.rotate(Math.PI);
    if(blDrawSprite(e.type,swarm?17:e.type==='octo'?29:40)){
      g.restore();
      if(e.slow>0||e.hit>0){
        g.strokeStyle=e.slow>0?'#bdefff':'#f8edff';g.lineWidth=1;
        g.beginPath();g.arc(x,y,swarm?9:20,0,7);g.stroke();
      }
      if(e.type==='octo')return;
    }else{
      if(e.type==='ray')g.rotate(-Math.PI);
      var size=swarm?.25:e.type==='rock'||e.type==='mine'?.8:.48;
      g.scale(size,size);
      g.fillStyle=c;g.strokeStyle=c;g.lineWidth=7;g.lineCap='round';
      if(e.type==='crab'){
        [-1,1].forEach(function(d){g.beginPath();g.moveTo(d*20,4);g.lineTo(d*37,-7);g.lineTo(d*39,-19);g.stroke();g.beginPath();g.arc(d*39,-23,9,0,Math.PI*1.6);g.fill();for(var i=0;i<2;i++){g.beginPath();g.moveTo(d*18,12+i*6);g.lineTo(d*33,22+i*7);g.stroke();}});
        blRoundRect(-27,-21,54,47,12,c);blRoundRect(-26,-22,52,12,5,'#94695f');
      }else if(e.type==='ray'){
        g.beginPath();g.moveTo(0,-30);g.quadraticCurveTo(13,-2,43,14);g.lineTo(15,20);g.lineTo(0,11);g.lineTo(-15,20);g.lineTo(-43,14);g.quadraticCurveTo(-13,-2,0,-30);g.fill();g.lineWidth=4;g.beginPath();g.moveTo(0,12);g.quadraticCurveTo(15,30,0,44);g.stroke();
      }else if(e.type==='eel'){
        g.lineWidth=16;g.beginPath();g.moveTo(0,-24);g.bezierCurveTo(-32,-8,30,8,0,24);g.stroke();g.beginPath();g.ellipse(0,-19,18,14,0,0,7);g.fill();g.strokeStyle='#b08c25';g.lineWidth=3;g.beginPath();g.moveTo(-4,-4);g.lineTo(7,1);g.lineTo(-7,8);g.lineTo(5,15);g.stroke();
      }else if(e.type==='mine'){
        g.strokeStyle='#d57962';g.lineWidth=6;
        for(var i=0;i<8;i++){
          var a=i*Math.PI/4;
          g.beginPath();g.moveTo(Math.cos(a)*17,Math.sin(a)*17);g.lineTo(Math.cos(a)*27,Math.sin(a)*27);g.stroke();
        }
        g.fillStyle=e.hit>0?'#fff':'#592c46';g.beginPath();g.arc(0,0,20,0,7);g.fill();
        g.strokeStyle='#ffab87';g.lineWidth=2;g.stroke();
        g.fillStyle=reduceMotion||Math.sin(t*10+e.id)>0?'#ffcfad':'#ff756a';
        g.beginPath();g.arc(0,0,7,0,7);g.fill();
      }else if(e.type==='rock'){
        g.fillStyle=e.hit>0?'#fff':'#456880';g.beginPath();g.moveTo(-30,16);g.lineTo(-24,-14);g.lineTo(-6,-28);g.lineTo(18,-22);g.lineTo(32,-2);g.lineTo(26,22);g.lineTo(-8,26);g.closePath();g.fill();
        g.strokeStyle='#b8d2dc';g.lineWidth=2;g.stroke();
        g.fillStyle='#7b9eb0';g.beginPath();g.moveTo(-24,-14);g.lineTo(-6,-28);g.lineTo(18,-22);g.lineTo(4,-4);g.lineTo(-13,1);g.closePath();g.fill();
        g.strokeStyle='#222f48';g.lineWidth=3;g.beginPath();g.moveTo(-6,-28);g.lineTo(4,-4);g.lineTo(-12,14);g.moveTo(4,-4);g.lineTo(23,8);g.stroke();
      }else if(e.type==='squid'){
        g.beginPath();g.moveTo(0,-30);g.quadraticCurveTo(28,-8,16,8);g.lineTo(-16,8);g.quadraticCurveTo(-28,-8,0,-30);g.fill();g.lineWidth=5;for(var i=0;i<4;i++){g.beginPath();g.moveTo(-12+i*8,8);g.quadraticCurveTo(-14+i*9,22,-12+i*8+Math.sin(t*5+i)*4,30);g.stroke();}
        if(e.y>=150&&e.hold<4&&e.cd<.5){g.strokeStyle='rgba(255,120,120,.55)';g.lineWidth=2;g.setLineDash([4,6]);g.beginPath();g.moveTo(BL.x-x,30);g.lineTo(BL.x-x,400);g.stroke();g.setLineDash([]);}
      }else if(e.type==='turtle'){
        [-1,1].forEach(function(d){g.beginPath();g.ellipse(d*25,12,12,8,d*.4,0,7);g.fill();});g.beginPath();g.ellipse(0,-22,14,16,0,0,7);g.fill();g.fillStyle=e.hit>0?'#fff':'#3e698e';g.beginPath();g.ellipse(0,7,26,29,0,0,7);g.fill();g.strokeStyle='#a9d4ed';g.lineWidth=2;g.beginPath();g.moveTo(0,-15);g.lineTo(15,-4);g.lineTo(15,15);g.lineTo(0,27);g.lineTo(-15,15);g.lineTo(-15,-4);g.closePath();g.stroke();
      }else{
        var small=e.type==='mini',jelly=e.type==='jelly'||small,size=small?16:25;
        g.lineWidth=small?4:7;for(var i=0;i<3;i++){g.beginPath();g.moveTo(-size*.65+i*size*.65,9);g.quadraticCurveTo(-size+i*size*.7,32,-size*.6+i*size*.65+Math.sin(t*5+i)*4,small?24:32);g.stroke();}
        g.beginPath();g.ellipse(0,0,size,jelly?size*.75:size,0,0,7);g.fill();if(jelly){g.fillStyle='#ffe6f4';g.beginPath();g.arc(-6,-6,4,0,7);g.fill();}
      }
      var ey=e.type==='turtle'?-26:e.type==='eel'?-22:-4,eyeSize=e.type==='mini'?4:6;
      if(e.type!=='mine'&&e.type!=='rock'){g.fillStyle='#fff';g.beginPath();g.ellipse(-8,ey,eyeSize,eyeSize+2,0,0,7);g.ellipse(8,ey,eyeSize,eyeSize+2,0,0,7);g.fill();g.fillStyle='#182c40';g.beginPath();g.arc(-7,ey+1,2.5,0,7);g.arc(9,ey+1,2.5,0,7);g.fill();}g.restore();
    }
    if(e.type==='octo')return;
    if(e.slow>0){g.strokeStyle='#bdefff';g.lineWidth=2;g.beginPath();g.arc(x,y,28,0,7);g.stroke();}
    if(e.shield>0){g.strokeStyle='#79bfff';g.lineWidth=3;g.beginPath();g.ellipse(x,y,27,34,0,0,7);g.stroke();blRoundRect(x-22,y-49,44*e.shield/e.shieldMax,4,2,'#79bfff');}
    blRoundRect(x-22,y-40,44,5,2,'#183a49');blRoundRect(x-22,y-40,44*Math.max(0,e.hp/e.max),5,2,spec.color);g.font='bold 10px system-ui';g.textAlign='center';g.fillStyle='#e4f2f3';g.fillText(Math.max(0,Math.ceil(e.hp))+' HP',x,y-45);
  }
  function blDrawBullet(b){
    var g=blCtx,x=b.x,y=b.y;g.fillStyle=b.color;g.strokeStyle=b.color;
    if(b.kind==='pulse'){g.beginPath();g.ellipse(x,y,4,8,0,0,7);g.fill();}
    else if(b.kind==='twin'){blRoundRect(x-3,y-12,6,24,3,b.color);blRoundRect(x-1,y-9,2,13,1,'#e7f5ff');}
    else if(b.kind==='frost'){g.beginPath();g.moveTo(x,y-11);g.lineTo(x+6,y);g.lineTo(x,y+11);g.lineTo(x-6,y);g.closePath();g.fill();}
    else if(b.kind==='chain'){g.lineWidth=3;g.beginPath();g.moveTo(x,y+12);g.lineTo(x+5,y+4);g.lineTo(x-4,y-2);g.lineTo(x+4,y-12);g.stroke();}
    else if(b.kind==='rail'){g.globalAlpha=.2;blRoundRect(x-7,y-30,14,62,7,b.color);g.globalAlpha=1;blRoundRect(x-2,y-30,4,45,2,'#e4ffd9');}
    else if(b.kind==='rocket'){g.beginPath();g.moveTo(x,y-12);g.lineTo(x+5,y-3);g.lineTo(x+5,y+8);g.lineTo(x-5,y+8);g.lineTo(x-5,y-3);g.closePath();g.fill();g.fillStyle='#ffcf68';g.beginPath();g.moveTo(x-3,y+9);g.lineTo(x,y+19);g.lineTo(x+3,y+9);g.fill();}
    else {g.globalAlpha=.2;g.beginPath();g.arc(x,y,14,0,7);g.fill();g.globalAlpha=1;g.beginPath();g.arc(x,y,8,0,7);g.fill();g.fillStyle='#fff2ff';g.beginPath();g.arc(x-2,y-2,3,0,7);g.fill();}
  }
  function blDrawInk(i){
    var g=blCtx;
    if(i.beam){var grad=g.createLinearGradient(0,i.y-70,0,i.y+30);grad.addColorStop(0,'rgba(255,90,80,0)');grad.addColorStop(1,'rgba(255,90,80,.9)');g.fillStyle=grad;g.fillRect(i.x-26,i.y-70,52,100);return;}
    g.fillStyle='#b35cff';g.beginPath();g.ellipse(i.x,i.y,9,13,0,0,7);g.fill();g.fillStyle='#e6c4ff';g.beginPath();g.arc(i.x-2,i.y-4,3,0,7);g.fill();
  }
  function blDrawPlayer(){
    var g=blCtx,gun=blWeapon(),bank=reduceMotion?0:Math.max(-.12,Math.min(.12,(BL.target-BL.x)*.004));
    blFleet().forEach(function(ship){
      g.save();g.translate(ship.x,ship.y);g.rotate(bank+ship.side*.055);
      var size=ship.lead?.25:.195;
      g.scale(size,size);
      blDrawShip(g,gun);g.restore();
    });
  }
  function blDrawShip(g,gun){
    var px=0,py=0,c=gun.color;
    if(!blDrawSprite('ship',72)){
      g.fillStyle='rgba(98,230,210,.12)';g.beginPath();g.ellipse(px,py+28,35,11,0,0,7);g.fill();g.fillStyle=c;g.beginPath();g.moveTo(px,py-27);g.lineTo(px+29,py+18);g.lineTo(px+17,py+25);g.lineTo(px,py+17);g.lineTo(px-17,py+25);g.lineTo(px-29,py+18);g.closePath();g.fill();
      blRoundRect(px-9,py-13,18,23,8,'#163e50');g.fillStyle='#ecffff';g.beginPath();g.arc(px,py-6,5,0,7);g.fill();
    }
    if(gun.kind==='pulse')blRoundRect(px-4,py-35,8,24,4,c);
    if(gun.kind==='twin')[-1,1].forEach(function(d){blRoundRect(px+d*14-5,py-35,10,29,4,c);});
    if(gun.kind==='frost')[-1,1].forEach(function(d){blRoundRect(px+d*14-4,py-33,8,26,4,c);blRoundRect(px+d*14-8,py-20,16,5,2,'#6aa9c4');});
    if(gun.kind==='chain'){blRoundRect(px-4,py-38,8,28,4,c);g.strokeStyle=c;g.lineWidth=3;g.beginPath();g.arc(px,py-30,9,0,7);g.stroke();}
    if(gun.kind==='rail'){blRoundRect(px-11,py-48,7,38,2,c);blRoundRect(px+4,py-48,7,38,2,c);blRoundRect(px-14,py-30,28,7,2,'#406f58');}
    if(gun.kind==='rocket')[-1,1].forEach(function(d){blRoundRect(px+d*24-8,py-23,16,35,5,'#734b4c');blRoundRect(px+d*24-6,py-31,12,20,4,c);g.fillStyle='#ffcf68';g.beginPath();g.arc(px+d*24,py-24,3,0,7);g.fill();});
    if(gun.kind==='plasma'){g.strokeStyle=c;g.lineWidth=3;g.beginPath();g.ellipse(px,py-29,24,12,0,0,7);g.stroke();g.fillStyle=c;g.beginPath();g.arc(px,py-29,11,0,7);g.fill();g.fillStyle='#fff2ff';g.beginPath();g.arc(px-3,py-32,4,0,7);g.fill();[-1,1].forEach(function(d){blRoundRect(px+d*27-4,py-17,8,31,3,c);});}
    if(BL.phase==='run'&&!reduceMotion){
      var wake=8+Math.sin(BL.clock*24)*2;
      g.fillStyle='rgba(114,232,255,.36)';
      g.beginPath();g.ellipse(-13,35,4,wake,0,0,7);g.ellipse(13,35,4,wake,0,0,7);g.fill();
      g.fillStyle='#c4fbff';
      g.beginPath();g.arc(-13,30,2.5,0,7);g.arc(13,30,2.5,0,7);g.fill();
    }
  }
  function blPickCard(card){var gun=card.type==='weapon'?BL_GUNS.filter(function(x){return x.kind===card.kind;})[0]:null;return {title:gun?gun.name:'{{t:blaster.msg.008}}',desc:gun?gun.desc:'{{t:blaster.msg.009}}',color:gun?gun.color:'#ff958c'};}
  function blDrawPicks(){
    var g=blCtx;g.fillStyle='rgba(4,18,29,.9)';g.fillRect(0,0,400,600);g.textAlign='center';g.fillStyle='#62e6d2';g.font='bold 26px system-ui';g.fillText('{{t:blaster.msg.010}}',200,120);g.fillStyle='#e4f2f3';g.font='14px system-ui';g.fillText('{{t:blaster.msg.011}}',200,150);
    BL.picks.forEach(function(card,i){var info=blPickCard(card),x=22+i*120;blRoundRect(x,190,116,300,14,'#113041');blRoundRect(x,190,116,8,4,info.color);g.fillStyle=info.color;g.font='bold 16px system-ui';g.fillText(info.title,x+58,250,100);g.fillStyle='#e4f2f3';g.font='12px system-ui';g.fillText(info.desc,x+58,290,100);g.fillStyle='#ffdc87';g.fillText('{{t:blaster.msg.012}}'+BL.weapon,x+58,330,100);g.fillStyle='#9fc1ca';g.fillText('按 '+(i+1),x+58,470,100);});
    g.fillStyle='#9fc1ca';g.font='13px system-ui';g.fillText('{{t:blaster.msg.013}}',200,540);
  }
  function blDraw(){
    var g=blCtx,w=400,h=600;g.clearRect(0,0,w,h);g.fillStyle='#061c2c';g.fillRect(0,0,w,h);
    if(blCanyon.naturalWidth)g.drawImage(blCanyon,0,0,w,h);
    else {
      var glow=g.createLinearGradient(0,0,0,h);
      glow.addColorStop(0,'#133b50');glow.addColorStop(1,'#071d2d');
      g.fillStyle=glow;g.fillRect(0,0,w,h);
    }
    var light=g.createLinearGradient(0,54,0,330);
    light.addColorStop(0,'rgba(84,225,255,.12)');light.addColorStop(1,'rgba(84,225,255,0)');
    g.fillStyle=light;g.beginPath();g.moveTo(145,54);g.lineTo(220,54);g.lineTo(318,330);g.lineTo(90,330);g.closePath();g.fill();
    g.fillStyle='rgba(152,231,239,.18)';
    for(var i=0;i<14;i++){
      var y=(i*83+(reduceMotion?0:BL.scroll*.32))%h;
      g.beginPath();g.arc(49+(i*73)%303,y,1+i%2*.5,0,7);g.fill();
    }
    BL.gates.forEach(function(gate){
      var positive=gate.value>0,half=gate.half||BL_GATE_HALF,locked=gate.armor>0;
      var label=(positive?'+':'−')+Math.abs(gate.value);
      var edge=locked?'#ffcc78':positive?'#76ffe2':'#ff929d';
      var glass=g.createLinearGradient(0,gate.y-13,0,gate.y+13);
      glass.addColorStop(0,locked?'#5e3d2a':positive?'#153c48':'#4c263b');
      glass.addColorStop(1,locked?'#925f2f':positive?'#126d69':'#883d53');
      var left=gate.x-half+1,width=half*2-2;
      blRoundRect(left,gate.y-13,width,26,7,glass);
      g.strokeStyle=edge;g.lineWidth=1;
      g.beginPath();g.roundRect(left+.5,gate.y-12.5,width-1,25,7);g.stroke();
      if(locked){
        g.fillStyle='#ffcc78';
        g.fillRect(gate.x-half+4,gate.y-12,4,24);
        g.fillRect(gate.x+half-8,gate.y-12,4,24);
        g.fillStyle='#302c35';
        for(var stripe=-8;stripe<=8;stripe+=8){
          g.fillRect(gate.x-half+4,gate.y+stripe,4,3);
          g.fillRect(gate.x+half-8,gate.y+stripe,4,3);
        }
      }
      g.fillStyle='#ffffff';g.font='bold 17px system-ui';g.textAlign='center';
      g.fillText(locked?'◆ '+gate.armor+' → '+label:label,gate.x,gate.y+6,half*2-8);
      if(locked)blRoundRect(gate.x-half+4,gate.y+9,(half*2-8)*gate.armor/gate.maxArmor,3,1,'#ffca70');
    });
    BL.bullets.forEach(blDrawBullet);BL.enemies.forEach(blDrawMonster);BL.ink.forEach(blDrawInk);blDrawPlayer();
    BL.fx.forEach(function(f){g.globalAlpha=Math.max(0,f.t/.45);g.fillStyle=f.color;if(f.ring){g.strokeStyle=f.color;g.lineWidth=2;g.beginPath();g.arc(f.x,f.y,f.ring*(reduceMotion?.8:1-f.t/.36),0,7);g.stroke();}else g.fillRect(f.x-2,f.y-2,4,4);});g.globalAlpha=1;
    g.fillStyle='rgba(4,18,29,.9)';g.fillRect(0,0,400,54);g.font='bold 14px system-ui';g.fillStyle='#e4f2f3';g.textAlign='left';g.fillText(blMeters(BL.phase==='ready'?0:BL.distance),62,23);g.fillStyle='#ffb638';g.fillText(blWeapon().name+' Lv.'+BL.weapon,62,44);g.textAlign='right';g.fillStyle='#ff958c';g.fillText('{{t:blaster.msg.014}}'+BL.lives+' / '+BL_FLEET_MAX,384,25);g.fillStyle='#9fc1ca';g.font='12px system-ui';g.fillText((blStageConfig(BL.stage).speed*blPace()/10).toFixed(1)+' m/s',384,44);
    if(BL.flash>0){g.fillStyle='rgba(255,111,97,'+(BL.flash*.6)+')';g.fillRect(0,0,w,h);}
    if(BL.phase==='pick')blDrawPicks();
    else if(BL.phase!=='run'||!blVisible()){
      g.fillStyle='rgba(4,18,29,.82)';g.fillRect(0,0,w,h);blRoundRect(28,180,344,222,18,'#113041');g.strokeStyle='#326475';g.lineWidth=1;g.strokeRect(40,194,320,194);
      g.textAlign='center';g.fillStyle=BL.phase==='lost'?'#ff958c':'#62e6d2';g.font='bold 28px system-ui';g.fillText(BL.phase==='ready'?'{{t:blaster.msg.015}}':BL.phase==='lost'?'{{t:blaster.msg.016}}':'{{t:blaster.msg.017}}',200,236);
      g.fillStyle='#e4f2f3';g.font='15px system-ui';g.fillText(BL.phase==='ready'?'{{t:blaster.msg.018}}':BL.phase==='lost'?blMeters(BL.distance):'{{t:blaster.msg.019}}',200,276);
      g.fillStyle='#ffdc87';g.fillText('最佳距離 '+blMeters(BL.best),200,310);
    }
  }
  $('bl-go').addEventListener('click',blStart);
  $('bl-exit').addEventListener('click',blExit);
  function blPointerPosition(e){
    var bounds=blCanvas.getBoundingClientRect();
    var scale=Math.min(bounds.width/400,bounds.height/600);
    return {
      x:(e.clientX-bounds.left-(bounds.width-400*scale)/2)/scale,
      y:(e.clientY-bounds.top-(bounds.height-600*scale)/2)/scale
    };
  }
  blCanvas.addEventListener('pointerdown',function(e){
    if(BL.phase!=='run'&&BL.phase!=='pick')return;
    e.preventDefault();
    var pos=blPointerPosition(e);
    if(BL.phase==='pick'){
      var index=Math.floor((pos.x-22)/120);
      if(pos.y>=190&&pos.y<=490&&index>=0&&index<3&&pos.x-22-index*120<=116)blInput(index);
      return;
    }
    if(BL.dragging!==null)return;
    blCanvas.focus();BL.dragging=e.pointerId;
    try{blCanvas.setPointerCapture(e.pointerId);}catch(_){}
    blPendingAim=blasterRules.aimCode(pos.x,pos.y);
  });
  blCanvas.addEventListener('pointermove',function(e){
    if(BL.dragging!==e.pointerId||BL.phase!=='run')return;
    var pos=blPointerPosition(e);blPendingAim=blasterRules.aimCode(pos.x,pos.y);
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(function(name){
    blCanvas.addEventListener(name,function(e){if(BL.dragging===e.pointerId)BL.dragging=null;});
  });
  var BL_DIRECTIONS={arrowleft:'l',a:'l',arrowright:'r',d:'r',arrowup:'u',w:'u',arrowdown:'d',s:'d'};
  document.addEventListener('keydown',function(e){
    if(!blVisible()||e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.key==='Escape'){e.preventDefault();blExit();return;}
    if(BL.phase!=='run'&&BL.phase!=='pick')return;
    if(['INPUT','BUTTON','A','SUMMARY','TEXTAREA','SELECT'].indexOf(e.target.tagName)>=0||e.target.isContentEditable)return;
    var key=e.key.toLowerCase();
    if(BL.phase==='pick'){if(!e.repeat&&['1','2','3'].indexOf(key)>=0){e.preventDefault();blInput(Number(key)-1);}return;}
    var side=BL_DIRECTIONS[key];
    if(side){e.preventDefault();BL.keys[side]=true;}
  });
  document.addEventListener('keyup',function(e){
    var side=BL_DIRECTIONS[e.key.toLowerCase()];
    if(side)BL.keys[side]=false;
  });
  function blSuspend(){BL.last=performance.now();blReleaseDirections();BL.dragging=null;blPendingAim=null;if(BL.active)blSaveBest();blTracking();}
  window.addEventListener('blur',function(){BL.focused=false;blSuspend();});window.addEventListener('focus',function(){BL.focused=true;blSuspend();});
  document.addEventListener('visibilitychange',blSuspend);window.addEventListener('hashchange',blSuspend);
  window.addEventListener('pagehide',function(e){if(!e.persisted)blFinish('abandoned');},true);
  function blLoop(now){blSync(now);if(!$('view-blaster').hidden)blDraw();requestAnimationFrame(blLoop);}
  blUI();blDraw();requestAnimationFrame(blLoop);
