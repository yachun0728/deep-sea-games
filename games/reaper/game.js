  /* ---------- Reaper Shift: endless shifts; milestone bonuses are credited to the shared wallet when reached ---------- */
  var RP=Object.assign(reaperRules.create(),{active:false,phase:'ready',stake:0,analytics:null,fx:[],pops:[],sw:0,belt:0,flash:0,message:'',shake:0,last:0,best:0,focused:true,earned:0});
  var reaperRank=timedLeaderboard('reaper','rp',reaperRules.inputCount,rpUI), reaperRandom=Math.random;
  var RP_PER=10;
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
    $('rp-next').textContent=nx[0]+' 位 · +'+nx[1];$('rp-amount').disabled=RP.active;
    $('rp-go').textContent=RP.phase==='run'?'{{t:reaper.msg.001}}':'{{t:reaper.msg.002}}';$('rp-go').disabled=reaperRank.busy()||RP.phase==='run'&&RP.cd>0;
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
    if(RP.phase!=='run'){rpStart();return;}
    rpSync(performance.now());if(RP.phase!=='run'||RP.cd>0)return;
    reaperRank.record(0);RP.sw=.18;
    reaperRules.input(RP,0,event=>rpEvent(event,true));
    rpUI();
  }
  function rpGhost(x,y,d,a,ha){
    var g=reaperCtx;g.globalAlpha=a;g.fillStyle='#dfe9ff';g.beginPath();g.arc(x,y-10,16,Math.PI,0);g.lineTo(x+16,y+14);g.lineTo(x+8,y+8);g.lineTo(x,y+14);g.lineTo(x-8,y+8);g.lineTo(x-16,y+14);g.closePath();g.fill();g.fillStyle='#1b1630';g.beginPath();g.arc(x-6,y-12,3,0,Math.PI*2);g.arc(x+6,y-12,3,0,Math.PI*2);g.fill();
    if(d&&ha>0){g.globalAlpha=a*ha;g.strokeStyle='#6cc58f';g.lineWidth=3;g.beginPath();g.ellipse(x,y-34,12,4,0,0,Math.PI*2);g.stroke();}g.globalAlpha=1;
  }
  function rpDraw(){
    var g=reaperCtx,W=400,H=560,ZX=200,ZW=RP.zone,BY=340;
    g.save();g.translate(RP.shake>0?(Math.random()-.5)*12:0,0);g.fillStyle='#1b1630';g.fillRect(-20,0,W+40,H);g.fillStyle='#3a3550';g.fillRect(-20,BY-40,W+40,80);g.strokeStyle='#4b4566';g.lineWidth=3;
    for(var k=-1;k<11;k++){var x=((RP.belt+k*40)%440)-20;g.beginPath();g.moveTo(x,BY-40);g.lineTo(x,BY+40);g.stroke();}
    g.fillStyle='rgba(242,193,78,.14)';g.fillRect(ZX-ZW,BY-44,ZW*2,88);g.strokeStyle='#f2c14e';g.lineWidth=2;g.setLineDash([6,5]);g.strokeRect(ZX-ZW,BY-44,ZW*2,88);g.setLineDash([]);
    RP.ghosts.forEach(function(o){var lv=rpLevel(),fade=lv<4?1:Math.max(0,Math.min(1,(ZX-(lv<7?35:90)-o.x)/80));rpGhost(o.x,BY-12,o.d,o.m?.35:1,fade);});
    RP.fx.forEach(function(f){rpGhost(f.x,f.y,false,Math.max(0,1-f.t/.6),0);});
    var hx=ZX+10,hy=240;g.fillStyle='#0e0a1a';g.beginPath();g.moveTo(ZX-34,hy+60);g.lineTo(ZX,hy-20);g.lineTo(ZX+34,hy+60);g.closePath();g.fill();g.beginPath();g.arc(ZX,hy-26,17,0,Math.PI*2);g.fill();g.fillStyle=RP.cd>0?'#7a6aa8':'#f2c14e';g.beginPath();g.arc(ZX-6,hy-26,3,0,Math.PI*2);g.arc(ZX+6,hy-26,3,0,Math.PI*2);g.fill();
    var swing=RP.sw>0?1-RP.sw/.18:0,a=RP.sw>0?1.2-swing*1.6:1.2,ex=hx+Math.sin(a)*85,ey=hy+Math.cos(a)*85;g.strokeStyle='#8b7a5a';g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(hx,hy);g.lineTo(ex,ey);g.stroke();g.strokeStyle='#cfd6e6';g.lineWidth=6;g.beginPath();g.moveTo(ex-Math.cos(a)*8,ey+Math.sin(a)*8);g.lineTo(ex+Math.cos(a)*30,ey-Math.sin(a)*30);g.stroke();g.lineCap='butt';g.restore();
    g.fillStyle='#e4f2f3';g.font='600 20px system-ui';g.textAlign='left';g.fillText('第 '+rpLevel()+' 班',16,32);g.textAlign='right';g.fillStyle='#a8a0c2';g.font='16px system-ui';g.fillText('已處理 '+RP.good+' 位',W-16,32);
    for(var i=0;i<3;i++){g.beginPath();g.arc(24+i*26,58,8,0,Math.PI*2);if(i<RP.lives){g.fillStyle='#ff6f61';g.fill();}else{g.strokeStyle='#73596c';g.lineWidth=2;g.stroke();}}
    g.fillStyle='#f2c14e';g.textAlign='right';g.fillText('已接走 '+RP.total+' 位 · 本局 +'+RP.earned+' 點',W-16,60);
    if(RP.flash>0&&RP.phase==='run'){g.fillStyle='#ff8a80';g.textAlign='center';g.font='600 17px system-ui';g.fillText(RP.message,W/2,132,W-30);}
    g.textAlign='center';g.fillStyle='#a8a0c2';g.font='13px system-ui';g.fillText('{{t:reaper.msg.010}}',W/2,458);g.fillText(RP.cd>0?'{{t:reaper.msg.011}}':'{{t:reaper.msg.012}}',W/2,486);
    RP.pops.forEach(function(p){g.globalAlpha=Math.max(0,1-p.age/2.2);var py=210-(reduceMotion?0:Math.min(1,p.age*3)*22);g.textAlign='center';g.fillStyle='#f2c14e';g.font='700 38px system-ui';g.fillText('+'+p.b+' 點',W/2,py);g.fillStyle='#e4f2f3';g.font='600 17px system-ui';g.fillText('處理 '+p.n+' 位里程碑',W/2,py+28);g.globalAlpha=1;});
    if(RP.phase!=='run'){
      g.fillStyle='rgba(14,10,26,.88)';g.fillRect(24,135,352,225);g.textAlign='center';g.fillStyle=RP.phase==='over'?'#ff8a80':'#e4f2f3';g.font='600 28px system-ui';g.fillText(RP.phase==='ready'?'{{t:reaper.msg.013}}':'{{t:reaper.msg.014}}',W/2,186,W-40);
      g.font='15px system-ui';g.fillStyle='#b4acc9';g.fillText(RP.phase==='ready'?'{{t:reaper.msg.015}}':'處理了 '+RP.good+' 位靈魂 · 接走 '+RP.total+' 位',W/2,225,W-40);
      g.fillStyle='#6cc58f';g.fillText('{{t:reaper.msg.016}}',W/2,261);g.fillStyle=RP.phase==='over'&&RP.earned>0?'#f2c14e':'#f2c14e';g.font='600 17px system-ui';g.fillText(RP.phase==='ready'?'{{t:reaper.msg.017}}':RP.earned>0?'{{t:reaper.msg.018}}'+RP.earned+' 點':'{{t:reaper.msg.019}}',W/2,312);
    }
  }
  $('rp-go').addEventListener('click',rpAct);
  reaperCanvas.addEventListener('pointerdown',function(e){if(RP.phase!=='run')return;e.preventDefault();reaperCanvas.focus();rpAct();});
  document.addEventListener('keydown',function(e){if($('view-reaper').hidden||document.hidden||RP.phase!=='run'||e.code!=='Space'||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;if(['INPUT','BUTTON','A','SUMMARY'].indexOf(e.target.tagName)>=0)return;e.preventDefault();rpAct();});
  window.addEventListener('blur',function(){RP.focused=false;RP.last=performance.now();});window.addEventListener('focus',function(){RP.focused=true;RP.last=performance.now();});
  document.addEventListener('visibilitychange',function(){RP.last=performance.now();});window.addEventListener('hashchange',function(){RP.last=performance.now();});
  function rpLoop(now){rpSync(now);if(!$('view-reaper').hidden&&!document.hidden){rpUI();rpDraw();}requestAnimationFrame(rpLoop);}
  rpUI();rpDraw();requestAnimationFrame(rpLoop);

