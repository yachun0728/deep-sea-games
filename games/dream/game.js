  /* ---------- Dream Repair: timing challenge, shared wallet ---------- */
  var DR = {active:false, phase:'ready', stage:1, wins:0, stake:0, angle:0, target:1, width:1.5, speed:1.6, last:0, direction:1, elapsed:0, reversals:0, reverseLimit:0, reverseAt:0, warning:0};
  var drCanvas=$('dr-canvas'), drCtx=drCanvas.getContext('2d');
  var runnerBusy=false;
  function drSay(text, cls){$('dr-msg').textContent=text;$('dr-msg').className='msg'+(cls?' '+cls:'');}
  var drDifficulty=dreamRules.difficulty, drDistance=dreamRules.distance;
  var dreamRound=null, dreamPending=null, dreamStarting=false, dreamSending=false;
  var dreamTicks=0, dreamCarry=0, dreamRandom=Math.random;
  function dreamStatus(text,retry){
    var status=$('dr-rank-status');
    status.hidden=!text;status.textContent=text;
    $('dr-rank-retry').hidden=!retry;
  }
  function drUI(){
    $('dr-stage').textContent='第 '+DR.stage+' 關';
    $('dr-amount').disabled=DR.active;
    $('dr-go').textContent=DR.phase==='spinning'?'{{t:dream.msg.001}}':DR.phase==='passed'?'{{t:dream.msg.002}}':DR.phase==='lost'?'{{t:dream.msg.003}}':'{{t:dream.msg.004}}';
    $('dr-go').disabled=dreamStarting||!!dreamPending;
    $('dr-go').dataset.mode=DR.phase==='spinning'?'surface':'start';
    drDraw();
  }
  function drDraw(){
    var g=drCtx, cx=260,cy=228,r=156;
    g.clearRect(0,0,520,480);var bg=g.createRadialGradient(cx,cy,20,cx,cy,310);bg.addColorStop(0,C.sea);bg.addColorStop(1,C.abyss);g.fillStyle=bg;g.fillRect(0,0,520,480);
    g.strokeStyle=C.line;g.lineWidth=2;g.beginPath();g.arc(cx,cy,r+26,0,Math.PI*2);g.stroke();
    for(var i=0;i<60;i++){var a=i*Math.PI/30;g.strokeStyle=i%5?C.line:C.muted;g.lineWidth=i%5?1:2;g.beginPath();g.moveTo(cx+Math.sin(a)*(r+9),cy-Math.cos(a)*(r+9));g.lineTo(cx+Math.sin(a)*(r+(i%5?15:22)),cy-Math.cos(a)*(r+(i%5?15:22)));g.stroke();}
    g.strokeStyle=C['panel-2'];g.lineWidth=22;g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.stroke();
    g.strokeStyle=DR.phase==='lost'?C.crush:C.glow;g.lineCap='round';g.beginPath();g.arc(cx,cy,r,DR.target-DR.width/2-Math.PI/2,DR.target+DR.width/2-Math.PI/2);g.stroke();g.lineCap='butt';
    g.save();g.translate(cx,cy);g.rotate(DR.angle);g.strokeStyle=DR.phase==='lost'?C.crush:C.lamp;g.lineWidth=5;g.beginPath();g.moveTo(0,22);g.lineTo(0,-r+7);g.stroke();g.fillStyle=DR.warning>0?(Math.floor(DR.warning*12)%2?C.crush:C.fg):C.lamp;g.beginPath();g.arc(0,0,DR.warning>0?13:9,0,Math.PI*2);g.fill();g.restore();
    g.textAlign='center';g.font='600 15px system-ui';g.fillStyle=C.muted;g.fillText('{{t:dream.msg.005}}',cx,32);
    g.font='600 22px system-ui';g.fillStyle=C.fg;g.fillText(DR.phase==='passed'?'{{t:dream.msg.006}}':DR.phase==='lost'?'{{t:dream.msg.007}}':DR.phase==='spinning'?(DR.warning>0?'{{t:dream.msg.008}}':'{{t:dream.msg.009}}'):'{{t:dream.msg.010}}',cx,444);
    g.font='14px system-ui';g.fillStyle=C.muted;g.fillText('第 '+DR.stage+' 關 · 目標寬度 '+Math.round(DR.width*180/Math.PI)+'°',cx,398);
  }
  function drRound(){
    AN.resume(DR.analytics,{stage:DR.stage});DR.phase='spinning';
    dreamRandom=dreamRound?dreamRules.seeded(dreamRound.state.seed):Math.random;
    dreamTicks=0;dreamCarry=0;
    Object.assign(DR,dreamRules.start(DR.stage,dreamRandom));
    DR.last=performance.now();
    drSay(DR.reverseLimit?'{{t:dream.msg.011}}':'{{t:dream.msg.012}}');drUI();
  }
  function drPlaying(){return DR.phase==='spinning'&&!$('view-dream').hidden&&!document.hidden&&(!document.hasFocus||document.hasFocus());}
  function drAdvance(now){
    var elapsed=drPlaying()?Math.min(100,Math.max(0,now-DR.last)):0;
    DR.last=now;
    function advance(dt){
      var notice=dreamRules.advance(DR,dt,dreamRandom);
      if(notice==='reverse')drSay('{{t:dream.msg.013}}');
      if(notice==='warning')drSay('{{t:dream.msg.014}}');
    }
    if(dreamRound){
      dreamCarry+=elapsed;
      while(dreamCarry>=dreamRules.STEP_MS){
        dreamCarry-=dreamRules.STEP_MS;
        advance(dreamRules.STEP_MS/1000);
        if(++dreamTicks>dreamRules.MAX_TICKS){
          dreamRound=null;
          dreamStatus('{{t:dream.msg.015}}');
          break;
        }
      }
      return;
    }
    var remaining=elapsed/1000;
    while(remaining>0){
      var dt=Math.min(remaining,.01);remaining-=dt;
      advance(dt);
    }
  }
  async function sendDreamStop(){
    if(!dreamPending||dreamSending)return;
    dreamSending=true;
    dreamStatus('{{t:dream.msg.016}}');
    drUI();
    try{
      var api=await import('./frontend/services/api.mjs');
      var next=await api.moveBoardRound(dreamRound.token,dreamPending,AbortSignal.timeout(10000));
      if(next.revision===dreamPending.revision||next.state.completed!==DR.wins||next.state.lost!==(DR.phase==='lost')){
        dreamRound=null;
        dreamStatus('{{t:dream.msg.017}}');
      }else{
        Object.assign(dreamRound,next);
        dreamStatus('{{t:dream.msg.018}}');
      }
      dreamPending=null;
    }catch(error){
      if(error.retryable===false){dreamPending=null;dreamRound=null}
      dreamStatus('{{t:dream.msg.017}}',!!dreamPending);
    }finally{
      dreamSending=false;
      drUI();
    }
  }
  function beginDream(amount, ranked){
    dreamRound=ranked;
    DR.analytics=AN.start('dream',amount);DR.stake=amount;DR.stage=1;DR.wins=0;DR.active=true;save();renderAll();drRound();
  }
  async function startDream(amount){
    if(typeof location==='undefined'||location.protocol==='file:'){beginDream(amount,null);return}
    dreamStarting=true;
    dreamStatus('{{t:dream.msg.019}}');
    drUI();
    var ranked=null;
    try{
      var api=await import('./frontend/services/api.mjs');
      ranked=await api.startBoardRound('dream',AbortSignal.timeout(4000));
    }catch{}
    dreamStarting=false;
    if($('view-dream').hidden){dreamStatus('');drUI();return}
    dreamStatus(ranked?'{{t:dream.msg.020}}':'{{t:dream.msg.015}}');
    beginDream(amount,ranked);
  }
  function drAction(){
    if(dreamStarting||dreamPending)return;
    if($('view-dream').hidden||document.hidden||document.hasFocus&&!document.hasFocus())return;
    if(DR.phase==='spinning'){
      drAdvance(performance.now());
      if(dreamRules.hit(DR)){DR.wins++;DR.phase='passed';DR.warning=0;AN.progress(DR.analytics,{stage:DR.stage,score:DR.wins,reversals:DR.reversals},true);drSay('第 '+DR.stage+' 關修復成功！準備好就挑戰下一關。','win');}
      else{DR.phase='lost';DR.active=false;DR.warning=0;AN.end(DR.analytics,0,'loss',{stage:DR.stage,score:DR.wins});drSay('錯過目標區，本局完成 '+DR.wins+' 關。再挑戰一次吧！','lose');}
      if(dreamRound){
        dreamPending={gameId:'dream',id:dreamRound.id,revision:dreamRound.revision,action:dreamTicks};
        sendDreamStop();
      }
      drUI();return;
    }
    if(DR.phase==='passed'){DR.stage++;drRound();return;}
    var amount=ENTRY_FEE;
    if(amount>S.balance){drSay(LOW_MSG,'lose');return;}
    startDream(amount);
  }
  $('dr-rank-retry').addEventListener('click',sendDreamStop);
  $('dr-go').addEventListener('click',drAction);
  drCanvas.addEventListener('pointerdown',function(e){if(DR.phase==='spinning'){e.preventDefault();drAction();}});
  document.addEventListener('keydown',function(e){if($('view-dream').hidden||e.code!=='Space'||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;var tag=(e.target.tagName||'').toLowerCase();if(['input','button','a','summary'].indexOf(tag)>=0)return;e.preventDefault();if(DR.phase==='spinning')drAction();});
  window.addEventListener('blur',function(){DR.last=performance.now();});
  window.addEventListener('focus',function(){DR.last=performance.now();});
  document.addEventListener('visibilitychange',function(){DR.last=performance.now();});
  function drLoop(now){drAdvance(now);if(!$('view-dream').hidden&&!document.hidden)drDraw();requestAnimationFrame(drLoop);}
  drUI();requestAnimationFrame(drLoop);

