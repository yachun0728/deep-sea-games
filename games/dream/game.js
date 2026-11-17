  /* ---------- Dream Repair: timing challenge, shared wallet ---------- */
  var DR = {active:false, phase:'ready', stage:1, wins:0, stake:0, angle:0, target:1, width:1.5, speed:2.1, last:0};
  var drCanvas=$('dr-canvas'), drCtx=drCanvas.getContext('2d');
  var runnerBusy=false;
  function drSay(text, cls){$('dr-msg').textContent=text;$('dr-msg').className='msg'+(cls?' '+cls:'');}
  function drMultiplier(){return Math.round(Math.pow(1.4,DR.wins)*100)/100;}
  function drUI(){
    $('dr-stage').textContent=DR.stage+' / 10';
    $('dr-mult').textContent=fx(drMultiplier())+'×';
    $('dr-pay').textContent=DR.active&&DR.wins?fmt(Math.floor(DR.stake*drMultiplier())):'—';
    $('dr-amount').disabled=DR.active;
    $('dr-go').textContent=DR.phase==='spinning'?'停針':DR.phase==='passed'?'挑戰下一關':'下注並開始';
    $('dr-go').dataset.mode=DR.phase==='spinning'?'surface':'bet';
    $('dr-cash').disabled=!(DR.active&&DR.phase==='passed');
    $('dr-cash').textContent=DR.active&&DR.wins?'領回 '+fmt(Math.floor(DR.stake*drMultiplier()))+' 點':'過關後可領回';
    drDraw();
  }
  function drDraw(){
    var g=drCtx, cx=260,cy=228,r=156;
    g.clearRect(0,0,520,480);var bg=g.createRadialGradient(cx,cy,20,cx,cy,310);bg.addColorStop(0,C.sea);bg.addColorStop(1,C.abyss);g.fillStyle=bg;g.fillRect(0,0,520,480);
    g.strokeStyle=C.line;g.lineWidth=2;g.beginPath();g.arc(cx,cy,r+26,0,Math.PI*2);g.stroke();
    for(var i=0;i<60;i++){var a=i*Math.PI/30;g.strokeStyle=i%5?C.line:C.muted;g.lineWidth=i%5?1:2;g.beginPath();g.moveTo(cx+Math.sin(a)*(r+9),cy-Math.cos(a)*(r+9));g.lineTo(cx+Math.sin(a)*(r+(i%5?15:22)),cy-Math.cos(a)*(r+(i%5?15:22)));g.stroke();}
    g.strokeStyle=C['panel-2'];g.lineWidth=22;g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.stroke();
    g.strokeStyle=DR.phase==='lost'?C.crush:C.glow;g.lineCap='round';g.beginPath();g.arc(cx,cy,r,DR.target-DR.width/2-Math.PI/2,DR.target+DR.width/2-Math.PI/2);g.stroke();g.lineCap='butt';
    g.save();g.translate(cx,cy);g.rotate(DR.angle);g.strokeStyle=DR.phase==='lost'?C.crush:C.lamp;g.lineWidth=5;g.beginPath();g.moveTo(0,22);g.lineTo(0,-r+7);g.stroke();g.fillStyle=C.lamp;g.beginPath();g.arc(0,0,9,0,Math.PI*2);g.fill();g.restore();
    g.textAlign='center';g.font='600 15px system-ui';g.fillStyle=C.muted;g.fillText('DREAM REPAIR / 時序修復',cx,32);
    g.font='600 22px system-ui';g.fillStyle=C.fg;g.fillText(DR.phase==='passed'?'修復成功 · 領回或繼續':DR.phase==='lost'?'錯過時窗 · 本局結束':DR.phase==='spinning'?'讓指針停在青綠色區域':'下注啟動時序修復',cx,444);
    g.font='14px system-ui';g.fillStyle=C.muted;g.fillText('第 '+DR.stage+' 關 · 目標寬度 '+Math.round(DR.width*180/Math.PI)+'°',cx,398);
  }
  function drRound(){AN.resume(DR.analytics,{stage:DR.stage});DR.phase='spinning';DR.width=Math.max(.36,1.5-(DR.stage-1)*.16);DR.speed=2.1+(DR.stage-1)*.38;DR.target=Math.random()*Math.PI*2;DR.angle=(DR.target+Math.PI)%(Math.PI*2);DR.last=performance.now();drSay('按停針或空白鍵，讓指針停在青綠色區域。');drUI();}
  function drAdvance(now){
    if(DR.phase==='spinning'&&!$('view-dream').hidden&&!document.hidden){DR.angle=(DR.angle+Math.max(0,now-DR.last)/1000*DR.speed)%(Math.PI*2);}
    DR.last=now;
  }
  function drAction(){
    if(DR.phase==='spinning'){
      drAdvance(performance.now());
      var delta=Math.abs(Math.atan2(Math.sin(DR.angle-DR.target),Math.cos(DR.angle-DR.target)));
      if(delta<=DR.width/2){DR.wins++;DR.phase='passed';AN.progress(DR.analytics,{stage:DR.stage,multiplier:drMultiplier()},true);drSay('第 '+DR.stage+' 關修復成功！可領回 '+fmt(Math.floor(DR.stake*drMultiplier()))+' 點，或冒險挑戰下一關。','win');if(DR.stage===10){drCash();return;}}
      else{DR.phase='lost';DR.active=false;AN.end(DR.analytics,0,'loss',{stage:DR.stage});drSay('指針沒有停在目標區，失去本局 '+fmt(DR.stake)+' 點下注。','lose');}
      drUI();return;
    }
    if(DR.phase==='passed'){DR.stage++;drRound();return;}
    var amount=ENTRY_FEE;
    if(amount>S.balance){drSay(LOW_MSG,'lose');return;}
    DR.analytics=AN.start('dream',amount);DR.stake=amount;DR.stage=1;DR.wins=0;DR.active=true;S.balance-=amount;save();renderAll();drRound();
  }
  function drCash(){
    if(!DR.active||DR.phase!=='passed')return;
    var pay=Math.floor(DR.stake*drMultiplier());AN.end(DR.analytics,pay,'cashout',{stage:DR.stage,multiplier:drMultiplier()});S.balance+=pay;DR.active=false;DR.phase='cashed';save();renderAll();drSay((DR.stage===10?'十關全部修復！':'已停止挑戰。')+'領回 '+fmt(pay)+' 點（本局淨利 '+fmt(pay-DR.stake)+' 點）。','win');drUI();
  }
  $('dr-go').addEventListener('click',drAction);$('dr-cash').addEventListener('click',drCash);
  drCanvas.addEventListener('pointerdown',function(e){if(DR.phase==='spinning'){e.preventDefault();drAction();}});
  document.addEventListener('keydown',function(e){if($('view-dream').hidden||e.code!=='Space'||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;var tag=(e.target.tagName||'').toLowerCase();if(['input','button','a','summary'].indexOf(tag)>=0)return;e.preventDefault();if(DR.phase==='spinning')drAction();});
  document.addEventListener('visibilitychange',function(){DR.last=performance.now();});
  function drLoop(now){drAdvance(now);if(!$('view-dream').hidden&&!document.hidden)drDraw();requestAnimationFrame(drLoop);}
  drUI();requestAnimationFrame(drLoop);

