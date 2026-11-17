  /* ---------- Dream Repair: timing challenge, shared wallet ---------- */
  var DR = {active:false, phase:'ready', stage:1, wins:0, stake:0, angle:0, target:1, width:1.5, speed:1.6, last:0, direction:1, elapsed:0, reversals:0, reverseLimit:0, reverseAt:0, warning:0};
  var drCanvas=$('dr-canvas'), drCtx=drCanvas.getContext('2d');
  var runnerBusy=false;
  function drSay(text, cls){$('dr-msg').textContent=text;$('dr-msg').className='msg'+(cls?' '+cls:'');}
  var DR_MIN_WIDTH=24*Math.PI/180, DR_MAX_SPEED=2.4, DR_WARNING=.5, DR_GUARD=.25;
  function drDistance(a,b){return Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));}
  function drDifficulty(stage){
    // Hold difficulty while introducing the first and second reversal.
    var n=stage-1-Math.min(3,Math.max(0,stage-11))-Math.min(3,Math.max(0,stage-21));
    return {width:Math.max(DR_MIN_WIDTH,(80-Math.min(n,4)*5-Math.max(0,Math.min(n-4,10))*2.5-Math.max(0,n-14))*Math.PI/180),speed:Math.min(DR_MAX_SPEED,1.6+n*.035)};
  }
  function drUI(){
    $('dr-stage').textContent='第 '+DR.stage+' 關';
    $('dr-amount').disabled=DR.active;
    $('dr-go').textContent=DR.phase==='spinning'?'停針':DR.phase==='passed'?'挑戰下一關':DR.phase==='lost'?'再挑戰一次':'開始修復';
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
    g.textAlign='center';g.font='600 15px system-ui';g.fillStyle=C.muted;g.fillText('DREAM REPAIR / 時序修復',cx,32);
    g.font='600 22px system-ui';g.fillStyle=C.fg;g.fillText(DR.phase==='passed'?'修復成功 · 挑戰下一關':DR.phase==='lost'?'錯過時窗 · 本局結束':DR.phase==='spinning'?(DR.warning>0?'注意！指針即將反轉':'讓指針停在青綠色區域'):'開始你的無限修復挑戰',cx,444);
    g.font='14px system-ui';g.fillStyle=C.muted;g.fillText('第 '+DR.stage+' 關 · 目標寬度 '+Math.round(DR.width*180/Math.PI)+'°',cx,398);
  }
  function drRound(){
    AN.resume(DR.analytics,{stage:DR.stage});DR.phase='spinning';
    var difficulty=drDifficulty(DR.stage);DR.width=difficulty.width;DR.speed=difficulty.speed;
    DR.target=Math.random()*Math.PI*2;DR.angle=(DR.target+Math.PI)%(Math.PI*2);
    DR.direction=1;DR.elapsed=0;DR.reversals=0;DR.reverseLimit=DR.stage>=21?2:DR.stage>=11?1:0;
    DR.reverseAt=1.5+Math.random();DR.warning=0;DR.last=performance.now();
    drSay(DR.reverseLimit?'留意中心燈與文字：反轉前會先提示，仍可隨時停針。':'按停針、點儀表或空白鍵，讓指針停在青綠色區域。');drUI();
  }
  function drPlaying(){return DR.phase==='spinning'&&!$('view-dream').hidden&&!document.hidden&&(!document.hasFocus||document.hasFocus());}
  function drAdvance(now){
    // Small simulation steps keep warning duration and target protection consistent across frame rates.
    var remaining=drPlaying()?Math.min(.1,Math.max(0,now-DR.last)/1000):0;DR.last=now;
    while(remaining>0){
      var dt=Math.min(remaining,.01);remaining-=dt;DR.elapsed+=dt;
      DR.angle=((DR.angle+DR.direction*DR.speed*dt)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
      var distance=drDistance(DR.angle,DR.target),safe=distance>DR.width/2+DR.speed*DR_GUARD;
      if(DR.warning>0){
        if(!safe){DR.warning=0;DR.reverseAt=DR.elapsed+.3;}
        else{DR.warning-=dt;if(DR.warning<=0){DR.warning=0;DR.direction*=-1;DR.reversals++;DR.reverseAt=DR.elapsed+1.5+Math.random();drSay('指針已反轉，抓準目標區停針。');}}
      }else if(DR.reversals<DR.reverseLimit&&DR.elapsed>=DR.reverseAt&&distance>DR.width/2+DR.speed*(DR_WARNING+DR_GUARD)){
        DR.warning=DR_WARNING;drSay('注意！中心燈閃爍，0.5 秒後指針反轉。');
      }
    }
  }
  function drAction(){
    if($('view-dream').hidden||document.hidden||document.hasFocus&&!document.hasFocus())return;
    if(DR.phase==='spinning'){
      drAdvance(performance.now());
      var delta=Math.abs(Math.atan2(Math.sin(DR.angle-DR.target),Math.cos(DR.angle-DR.target)));
      if(delta<=DR.width/2){DR.wins++;DR.phase='passed';DR.warning=0;AN.progress(DR.analytics,{stage:DR.stage,score:DR.wins,reversals:DR.reversals},true);drSay('第 '+DR.stage+' 關修復成功！準備好就挑戰下一關。','win');}
      else{DR.phase='lost';DR.active=false;DR.warning=0;AN.end(DR.analytics,0,'loss',{stage:DR.stage,score:DR.wins});drSay('錯過目標區，本局完成 '+DR.wins+' 關。再挑戰一次吧！','lose');}
      drUI();return;
    }
    if(DR.phase==='passed'){DR.stage++;drRound();return;}
    var amount=ENTRY_FEE;
    if(amount>S.balance){drSay(LOW_MSG,'lose');return;}
    DR.analytics=AN.start('dream',amount);DR.stake=amount;DR.stage=1;DR.wins=0;DR.active=true;S.balance-=amount;save();renderAll();drRound();
  }
  $('dr-go').addEventListener('click',drAction);
  drCanvas.addEventListener('pointerdown',function(e){if(DR.phase==='spinning'){e.preventDefault();drAction();}});
  document.addEventListener('keydown',function(e){if($('view-dream').hidden||e.code!=='Space'||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;var tag=(e.target.tagName||'').toLowerCase();if(['input','button','a','summary'].indexOf(tag)>=0)return;e.preventDefault();if(DR.phase==='spinning')drAction();});
  window.addEventListener('blur',function(){DR.last=performance.now();});
  window.addEventListener('focus',function(){DR.last=performance.now();});
  document.addEventListener('visibilitychange',function(){DR.last=performance.now();});
  function drLoop(now){drAdvance(now);if(!$('view-dream').hidden&&!document.hidden)drDraw();requestAnimationFrame(drLoop);}
  drUI();requestAnimationFrame(drLoop);

