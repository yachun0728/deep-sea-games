  /* ---------- Reaper Shift: endless shifts; milestone bonuses are credited to the shared wallet when reached ---------- */
  var RP=Object.assign(reaperRules.create(),{active:false,phase:'ready',stake:0,analytics:null,fx:[],pops:[],sw:0,belt:0,flash:0,message:'',shake:0,last:0,best:0,focused:true,earned:0});
  var reaperRank=timedLeaderboard('reaper','rp',reaperRules.inputCount,rpUI), reaperRandom=Math.random;
  var RP_PER=10,RP_SWING_TIME=.28;
  var RP_MILESTONES=[[120,3],[150,7],[200,15],[260,30]],RP_ENDLESS_FROM=260,RP_ENDLESS_STEP=50,RP_ENDLESS_BONUS=40;
  function rpBonusAt(n){for(var i=0;i<RP_MILESTONES.length;i++)if(RP_MILESTONES[i][0]===n)return RP_MILESTONES[i][1];return n>RP_ENDLESS_FROM&&(n-RP_ENDLESS_FROM)%RP_ENDLESS_STEP===0?RP_ENDLESS_BONUS:0;}
  function rpNext(n){for(var i=0;i<RP_MILESTONES.length;i++)if(RP_MILESTONES[i][0]>n)return RP_MILESTONES[i];return [RP_ENDLESS_FROM+(Math.floor((n-RP_ENDLESS_FROM)/RP_ENDLESS_STEP)+1)*RP_ENDLESS_STEP,RP_ENDLESS_BONUS];}
  function rpLevel(){return reaperRules.level(RP);}
  var reaperCanvas=$('rp-canvas'),reaperCtx=reaperCanvas.getContext('2d');
  try{var rb=Number(localStorage.getItem('reaper'));if(Number.isFinite(rb))RP.best=Math.max(0,Math.floor(rb));}catch(_){}
  function rpSay(text,kind){$('rp-msg').textContent=text;$('rp-msg').className='msg'+(kind?' '+kind:'');}
  function rpRemember(){if(RP.total>RP.best){RP.best=RP.total;try{localStorage.setItem('reaper',String(RP.best));}catch(_){}}}
  function rpUI(){
    var L=rpLevel(),nx=rpNext(RP.good);
    $('rp-level').textContent='第 '+L+' 班';$('rp-progress').textContent=(RP.good%RP_PER)+' / '+RP_PER;$('rp-lives').textContent=RP.lives+' / 3';$('rp-score').textContent=RP.total+' 位';$('rp-best').textContent=RP.best+' 位';
    $('rp-banner-best').textContent=RP.best;
    $('rp-next').textContent=nx[0]+' 位 · +'+nx[1];$('rp-amount').disabled=RP.active;
    $('rp-action-label').textContent=!rpArt.ready?(rpArt.failed?'{{t:reaper.skin.retry}}':'{{t:reaper.skin.loading}}'):RP.phase==='run'?'{{t:reaper.skin.swing}}':'{{t:reaper.msg.002}}';$('rp-go').disabled=(!rpArt.ready&&!rpArt.failed)||reaperRank.busy()||RP.phase==='run'&&RP.cd>0;
    $('rp-go').setAttribute('aria-label',!rpArt.ready?(rpArt.failed?'{{t:reaper.skin.retry}}':'{{t:reaper.skin.loading}}'):RP.phase==='run'?'{{t:reaper.msg.001}}':'{{t:reaper.msg.002}}');
    $('rp-go').dataset.mode=RP.phase==='run'?'surface':'bet';
    $('rp-difficulty').textContent=L<4?'{{t:reaper.msg.003}}':L<7?'{{t:reaper.msg.004}}':'{{t:reaper.msg.005}}';
  }
  function rpStart(){
    if(RP.phase==='run')return;
    var stake=ENTRY_FEE;
    if(stake>S.balance){rpSay(LOW_MSG,'lose');return;}
    reaperRank.start(random=>{
      reaperRandom=random||Math.random;
      Object.assign(RP,reaperRules.create(),{stake,fx:[],pops:[],sw:0,flash:0,shake:0,earned:0,active:true});
      RP.analytics=AN.start('reaper',stake);save();renderAll();
      RP.phase='run';RP.last=performance.now();rpSay('{{t:reaper.msg.006}}');rpUI();reaperCanvas.focus();
    });
  }
  function rpAward(n,b){
    RP.earned+=b;S.balance+=b;save();renderAll();
    AN.progress(RP.analytics,{step:n,score:RP.total,lives:RP.lives,bonus_points:b});
    RP.pops.push({n:n,b:b,age:0});if(RP.pops.length>3)RP.pops.shift();
    rpSay('處理了 '+n+' 位靈魂！獎勵 +'+b+' 點已入帳，本局累計 +'+RP.earned+' 點。','win');
  }
  function rpEvent(event, endedOnInput){
    if(event.kind==='capture'||event.kind==='pass'){
      if(event.kind==='capture'){RP.fx.push({x:event.x,y:328,t:0});rpRemember();}
      var bonus=rpBonusAt(event.good);if(bonus)rpAward(event.good,bonus);
      return;
    }
    var message=event.kind==='permit'?'{{t:reaper.msg.007}}':'{{t:reaper.msg.008}}';
    RP.flash=1.1;RP.message=message;RP.shake=reduceMotion?0:.35;
    if(RP.dead){
      RP.active=false;RP.phase='over';rpRemember();
      AN.end(RP.analytics,RP.earned,RP.earned>0?'complete':'loss',{step:RP.good,score:RP.total});save();renderAll();
      rpSay(message+' 三顆心用完，處理了 '+RP.good+' 位靈魂，'+(RP.earned>0?'本局共入帳 '+fmt(RP.earned)+' 點。':'{{t:reaper.msg.009}}'),RP.earned>0?'win':'lose');
      reaperRank.finish(RP.total,endedOnInput);
    }else rpSay(message+' 剩餘 '+RP.lives+' 顆心。','lose');
    rpUI();
  }
  function rpStep(dt){
    while(dt>1e-8&&RP.phase==='run'){
      var step=Math.min(dt,.02);dt-=step;
      RP.sw=Math.max(0,RP.sw-step);RP.flash=Math.max(0,RP.flash-step);RP.shake=Math.max(0,RP.shake-step);RP.belt+=RP.speed*step;
      RP.fx.forEach(function(f){f.t+=step;f.y-=140*step;});RP.fx=RP.fx.filter(function(f){return f.t<.6;});
      RP.pops.forEach(function(p){p.age+=step;});RP.pops=RP.pops.filter(function(p){return p.age<2.2;});
      reaperRules.advance(RP,step,reaperRandom,event=>rpEvent(event,false));
    }
  }
  function rpSync(now){
    var ms=Math.max(0,now-RP.last);RP.last=now;
    if(!$('view-reaper').hidden&&!document.hidden&&RP.focused)reaperRank.update(ms,()=>RP.phase==='run',rpStep);
  }
  function rpAct(){
    if(!rpArt.ready){if(rpArt.failed)rpLoadArt();return;}
    if(RP.phase!=='run'){rpStart();return;}
    rpSync(performance.now());if(RP.phase!=='run'||RP.cd>0)return;
    reaperRank.record(0);RP.sw=RP_SWING_TIME;
    reaperRules.input(RP,0,event=>rpEvent(event,true));
    rpUI();
  }
  /* Approved C artwork: original composition is 400 × 523, never stretched.
     All coordinates below are presentation only; replay/rule coordinates stay 400 × 560. */
  var rpArt={ready:false,failed:false,loading:false,images:{},attempt:0};
  function rpLoadArt(){
    if(rpArt.loading)return;
    rpArt.loading=true;rpArt.failed=false;rpArt.ready=false;
    var attempt=++rpArt.attempt;
    var files={background:'background-v1',body:'components/reaper_body',scythe:'components/reaper_scythe',ghost:'components/reaper_ghost',permit:'components/reaper_permit',hand:'motion-v3/hand/hand_resting'};
    Promise.all(Object.keys(files).map(function(key){return new Promise(function(resolve,reject){
      var im=new Image(),timer=setTimeout(function(){reject(new Error('art timeout'));},15000);
      im.onload=function(){clearTimeout(timer);resolve([key,im]);};
      im.onerror=function(){clearTimeout(timer);reject(new Error('art unavailable'));};
      im.src='games/reaper/art/'+files[key]+'.webp';
    });})).then(function(items){
      if(attempt!==rpArt.attempt)return;
      items.forEach(function(item){rpArt.images[item[0]]=item[1];});
      rpPrepareLayers();rpArt.ready=true;rpArt.loading=false;rpUI();rpDraw();
    }).catch(function(){if(attempt!==rpArt.attempt)return;rpArt.failed=true;rpArt.loading=false;rpUI();rpDraw();});
  }
  function rpPrepareLayers(){
    // Mechanical masks retain the approved painted glove/weapon pixels; no character is redrawn.
    var weapon=document.createElement('canvas');weapon.width=weapon.height=512;weapon.id='rp-weapon-art';
    var w=weapon.getContext('2d');w.beginPath();w.rect(90,30,370,300);
    [[195,310],[254,310],[303,342],[303,438],[278,457],[267,510],[224,510],[202,452],[180,444],[174,417],[176,365],[191,343]].forEach(function(p,i){if(i)w.lineTo(p[0],p[1]);else w.moveTo(p[0],p[1]);});
    w.closePath();w.clip();w.drawImage(rpArt.images.scythe,0,0);rpArt.images.weapon=weapon;
    var texture=document.createElement('canvas');texture.width=texture.height=24;
    texture.getContext('2d').drawImage(rpArt.images.body,346,433,24,24,0,0,24,24);
    rpArt.ink=reaperCtx.createPattern(texture,'repeat');
  }
  function rpSwingPose(remaining){
    var idle={x:252.6,y:220.3,angle:0};if(remaining<=0)return idle;
    var t=Math.max(0,Math.min(1,1-remaining/RP_SWING_TIME)),u;
    function blend(a,b,v){return a+(b-a)*v;}
    if(t<.2){u=t/.2;return {x:blend(idle.x,255,u),y:blend(idle.y,212,u),angle:-.18*u};}
    if(t<.6){u=(t-.2)/.4;u=1-Math.pow(1-u,2);return {x:blend(255,245,u),y:blend(212,235,u),angle:blend(-.18,3,u)};}
    u=(t-.6)/.4;u=u*u*(3-2*u);return {x:blend(245,idle.x,u),y:blend(235,idle.y,u),angle:3*(1-u)};
  }
  function rpPlaqueText(text,x,y,width){
    var g=reaperCtx;g.save();g.textAlign='left';g.textBaseline='alphabetic';
    var m=g.measureText(text),left=m.actualBoundingBoxLeft||0,right=m.actualBoundingBoxRight||m.width;
    var inkWidth=left+right,scale=inkWidth>width?width/inkWidth:1;
    g.translate(x,y);g.scale(scale,1);
    g.fillText(text,(left-right)/2,((m.actualBoundingBoxAscent||12)-(m.actualBoundingBoxDescent||0))/2);g.restore();
  }
  function rpHeart(x,y,filled){
    var g=reaperCtx;g.save();g.translate(x,y);g.beginPath();g.moveTo(0,9);
    g.bezierCurveTo(-2,7,-10,1,-10,-4);g.bezierCurveTo(-10,-11,-2,-11,0,-5);
    g.bezierCurveTo(2,-11,10,-11,10,-4);g.bezierCurveTo(10,1,2,7,0,9);g.closePath();
    g.lineWidth=1.7;g.fillStyle='#201d18';g.strokeStyle=filled?'#201d18':'#aa9674';if(filled)g.fill();else g.stroke();g.restore();
  }
  function rpImage(key,sx,sy,sw,sh,x,y,w,h){reaperCtx.drawImage(rpArt.images[key],sx,sy,sw,sh,x,y,w,h);}
  function rpSoul(x,feet,permit,alpha,halo){
    var g=reaperCtx;g.save();g.globalAlpha=alpha;
    // Conveyor passengers keep the approved pose; only the belt carries them.
    rpImage('ghost',109,111,294,389,x-29,feet-77,58,77);
    if(permit&&halo>0){
      g.globalAlpha=alpha*halo;
      rpImage('permit',143,207,227,92,x-25,feet-95,50,20);
      rpImage('permit',178,347,154,153,x-7,feet-50,19,19);
    }
    g.restore();
  }
  function rpDraw(){
    var g=reaperCtx,W=400,H=523;
    var dpr=Math.min(2,window.devicePixelRatio||1),scale=Math.max(1,reaperCanvas.getBoundingClientRect().width/W)*dpr;
    var bw=Math.round(W*scale),bh=Math.round(H*scale);
    if(reaperCanvas.width!==bw||reaperCanvas.height!==bh){reaperCanvas.width=bw;reaperCanvas.height=bh;}
    g.setTransform(reaperCanvas.width/W,0,0,reaperCanvas.height/H,0,0);
    g.clearRect(0,0,W,H);
    if(!rpArt.ready){
      g.fillStyle='#f4dfb8';g.fillRect(0,0,W,H);g.fillStyle='#201d18';g.textAlign='center';g.font='700 18px system-ui';
      g.fillText(rpArt.failed?'{{t:reaper.skin.failed}}':'{{t:reaper.skin.loading}}',200,260,360);return;
    }
    g.drawImage(rpArt.images.background,0,0,W,H);
    var motion=reduceMotion?0:Math.sin(RP.belt/38)*.8,bodyY=140+motion;
    var pose=rpSwingPose(RP.sw);
    // The worker stands BEHIND the belt. The textured rubber-hose arm stays on that shoulder.
    g.save();g.strokeStyle=rpArt.ink;g.lineWidth=17;g.lineCap='round';g.lineJoin='round';
    g.beginPath();g.moveTo(220,bodyY+120);g.bezierCurveTo(243,bodyY+147,274,pose.y+32,pose.x,pose.y);g.stroke();g.restore();
    rpImage('body',81,0,350,500,109,bodyY,123,176);
    var bg=rpArt.images.background;
    // Restore the whole station, not just the bottom lip: no torso may occupy the gold opening.
    g.drawImage(bg,0,bg.height*292/H,bg.width,bg.height*59/H,0,292,W,59);
    if(RP.phase==='run'&&!reduceMotion){
      var deck=RP.belt%153;for(var section=-1;section<4;section++)rpImage('background',0,800,420,72,section*153+deck,292,153,26.3);
      rpImage('background',420,794,260,163,153,290,95,59.5);
    }
    // Only the approved resting glove reaches over the desk edge.
    rpImage('hand',19,130,474,330,142,bodyY+143,50,34.81);
    // Show the original sample queue in standby; live souls use unchanged simulation x positions.
    var souls=RP.phase==='ready'?[{x:24,d:false},{x:85,d:false},{x:290,d:true},{x:385,d:false}]:RP.ghosts;
    souls.forEach(function(o){var lv=rpLevel(),fade=lv<4?1:Math.max(0,Math.min(1,(200-(lv<7?35:90)-o.x)/80));rpSoul(o.x,307,o.d,o.m?.35:1,fade);});
    RP.fx.forEach(function(f){
      var sink=Math.max(0,Math.min(1,(f.t-.08)/.28));
      g.save();g.translate(f.x+(200-f.x)*sink,307+27*sink);g.scale(1-.72*sink,1-.72*sink);
      rpSoul(0,0,false,Math.max(0,1-sink),0);g.restore();
    });
    // The actual curved blade crosses DOWN through the ghost at (200, 269), then recovers.
    g.save();g.translate(pose.x,pose.y);g.rotate(pose.angle);
    rpImage('weapon',76,48,360,452,-44.6,-93.3,101,127);g.restore();
    // The tray front hides anything entering the box, including the capture effect.
    g.drawImage(bg,0,bg.height*318/H,bg.width,bg.height*33/H,0,318,W,33);
    // The tray remains painted gold; these fine boundary marks reflect the real shrinking hit zone.
    if(RP.phase==='run'){
      g.strokeStyle='#f3c04c';g.lineWidth=2;
      [200-RP.zone,200+RP.zone].forEach(function(x){g.beginPath();g.moveTo(x,286);g.lineTo(x,312);g.stroke();});
    }
    g.fillStyle='#211e19';g.textBaseline='middle';g.textAlign='center';
    g.font='900 17px Grandstander, system-ui';
    rpPlaqueText('{{t:reaper.skin.shift}} '+rpLevel(),220,25,78);
    rpPlaqueText('{{t:reaper.skin.score}} '+RP.total,334,25,96);
    for(var i=0;i<3;i++)rpHeart(92+i*25,25,i<RP.lives);
    // Reuse the painted ghost and permit in the bottom-left instruction card.
    rpImage('ghost',109,111,294,389,15,382,28,37);
    rpImage('ghost',109,111,294,389,15,434,28,37);
    rpImage('permit',143,207,227,92,14,424,30,12);
    g.font='900 15px Grandstander, system-ui';g.fillStyle='#201d18';g.textAlign='left';
    g.fillText('{{t:reaper.skin.collect}}',50,396,70);g.fillText('{{t:reaper.skin.pass}}',50,450,70);
    if(rpLevel()>=4&&RP.phase==='run'){g.textAlign='center';g.font='700 10.5px system-ui';g.strokeStyle='#f7e7c9';g.lineWidth=4;var memoryHint=rpLevel()<7?'{{t:reaper.msg.004}}':'{{t:reaper.msg.005}}';g.strokeText(memoryHint,200,510,360);g.fillText(memoryHint,200,510,360);}
    if(RP.flash>0&&RP.phase==='run'){
      g.fillStyle='#f7e7c9';g.fillRect(12,68,376,29);g.fillStyle='#201d18';g.textAlign='center';g.font='700 12px system-ui';g.fillText(RP.message,200,83,360);
    }
    RP.pops.forEach(function(p){g.save();g.globalAlpha=Math.max(0,1-p.age/2.2);g.textAlign='center';g.fillStyle='#201d18';g.font='900 30px Grandstander, system-ui';g.fillText('+'+p.b+' 點',200,113-(reduceMotion?0:Math.min(1,p.age*3)*12),330);g.restore();});
    if(RP.phase==='over'){
      g.fillStyle='#f7e7c9';g.strokeStyle='#201d18';g.lineWidth=3;g.beginPath();g.roundRect(45,102,310,60,12);g.fill();g.stroke();
      g.textAlign='center';g.fillStyle='#201d18';g.font='900 20px system-ui';g.fillText('{{t:reaper.msg.014}}',200,121,282);
      g.font='700 13px system-ui';g.fillText('處理了 '+RP.good+' 位靈魂 · 接走 '+RP.total+' 位',200,146,282);
    }
    g.textBaseline='alphabetic';
  }
  var rpSurface=$('view-reaper').querySelector('.console');
  ['selectstart','dragstart','dblclick','contextmenu','gesturestart','gesturechange','gestureend'].forEach(function(type){
    rpSurface.addEventListener(type,function(e){if(!$('view-reaper').hidden)e.preventDefault();},{passive:false});
  });
  rpSurface.addEventListener('wheel',function(e){if(!$('view-reaper').hidden&&e.ctrlKey)e.preventDefault();},{passive:false});
  ['touchstart','touchmove'].forEach(function(type){
    rpSurface.addEventListener(type,function(e){if(!$('view-reaper').hidden&&e.touches.length>1)e.preventDefault();},{passive:false});
  });
  $('rp-go').addEventListener('click',rpAct);
  reaperCanvas.addEventListener('pointerdown',function(e){if(RP.phase!=='run'||e.pointerType==='touch'&&e.isPrimary===false)return;e.preventDefault();reaperCanvas.focus();rpAct();});
  document.addEventListener('keydown',function(e){if($('view-reaper').hidden||document.hidden||RP.phase!=='run'||e.code!=='Space'||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;if(['INPUT','BUTTON','A','SUMMARY'].indexOf(e.target.tagName)>=0)return;e.preventDefault();rpAct();});
  window.addEventListener('blur',function(){RP.focused=false;RP.last=performance.now();});window.addEventListener('focus',function(){RP.focused=true;RP.last=performance.now();});
  document.addEventListener('visibilitychange',function(){RP.last=performance.now();});window.addEventListener('hashchange',function(){RP.last=performance.now();});
  function rpLoop(now){rpSync(now);if(!$('view-reaper').hidden&&!document.hidden){if(!rpArt.ready&&!rpArt.loading&&!rpArt.failed)rpLoadArt();rpUI();rpDraw();}requestAnimationFrame(rpLoop);}
  rpUI();rpDraw();requestAnimationFrame(rpLoop);

