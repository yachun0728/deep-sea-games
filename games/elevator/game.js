  /* ---------- Elevator Queue: stealth risk and shared wallet ---------- */
  var EQ={active:false,phase:'ready',stage:1,passed:0,stake:0,people:[],moving:0,last:0,show:0,best:0};
  var EQ_COUNTS=[10,12,14,16,18],EQ_END=[4.6,6.3,8.2,10.4,13];
  var EQ_MULT=[0,.4,.6,.85,1.05,1.3,1.65,2.1,2.7,3.5,4.6];
  var eqCanvas=$('eq-canvas'),eqCtx=eqCanvas.getContext('2d');
  try{var qb=Number(localStorage.getItem('deep-sea-queue-best'));if(Number.isFinite(qb))EQ.best=Math.min(70,Math.max(0,qb));}catch(e){}
  function eqRand(a,b){return a+Math.random()*(b-a);}
  function eqRest(i){return eqRand(3.5,7.5)-i*.12;}
  function eqCount(){return EQ_COUNTS[EQ.stage-1];}
  function eqTotal(){return EQ_COUNTS.slice(0,EQ.stage-1).reduce(function(a,n){return a+n;},0)+EQ.passed;}
  function eqMultAt(n){if(EQ.stage===1)return EQ_MULT[n];var start=EQ_END[EQ.stage-2],end=EQ_END[EQ.stage-1];return Math.round((start+(end-start)*n/eqCount())*100)/100;}
  function eqPay(){return Math.floor(EQ.stake*eqMultAt(EQ.passed));}
  function eqRound(){AN.resume(EQ.analytics,{stage:EQ.stage,step:0});EQ.passed=0;EQ.phase='waiting';EQ.moving=0;EQ.last=performance.now();EQ.people=Array.from({length:eqCount()},function(_,i){return {index:i,state:'safe',time:eqRand(1.2,6.5)};});}
  function eqSay(text,kind){$('eq-msg').textContent=text;$('eq-msg').className='msg'+(kind?' '+kind:'');}
  function eqRemember(){if(eqTotal()>EQ.best){EQ.best=eqTotal();try{localStorage.setItem('deep-sea-queue-best',String(EQ.best));}catch(e){}}}
  function eqUI(){
    var pay=EQ.active?eqPay():EQ.phase==='cashed'?eqPay():0,net=pay-EQ.stake;
    $('eq-progress').textContent=EQ.passed+' / '+eqCount();$('eq-remaining').textContent=(eqCount()-EQ.passed)+' 人';
    $('eq-best').textContent=EQ.best+' 人';$('eq-stage').textContent=EQ.stage+' / 5';$('eq-total').textContent=eqTotal()+' 人';$('eq-amount').disabled=EQ.active;
    $('eq-go').textContent=EQ.active?(EQ.phase==='moving'?'正在插隊…':EQ.phase==='cleared'?'挑戰下一關':'往前插一位'):'扣點開始排隊';$('eq-go').disabled=EQ.phase==='moving';
    $('eq-go').dataset.mode=EQ.active?'surface':'bet';$('eq-cash').disabled=!(EQ.active&&eqTotal()>0&&(EQ.phase==='waiting'||EQ.phase==='cleared'));
    $('eq-cash').textContent=EQ.active&&eqTotal()>0?'收手領回':'成功插隊後可收手';
    var ahead=EQ.people.slice(EQ.passed),look=ahead.filter(p=>p.state==='look').length,warn=ahead.filter(p=>p.state==='warn').length;
    var watchText=!EQ.active?(EQ.phase==='ready'?'尚未開始':'本局已結束'):look?'回頭注視 '+look+' 人':warn?'警示 '+warn+' 人 · 可能隨時轉頭':'前方乘客都背對你';
    if($('eq-watch').textContent!==watchText)$('eq-watch').textContent=watchText;
    $('eq-watch').dataset.state=look?'look':warn?'warn':'safe';
    document.querySelectorAll('[data-eq-step]').forEach(function(b){b.setAttribute('aria-current',Number(b.dataset.eqStep)===EQ.passed?'step':'false');});
  }
  function eqLose(){if(!EQ.active)return;AN.end(EQ.analytics,0,'loss',{stage:EQ.stage,step:EQ.passed});EQ.active=false;EQ.phase='caught';EQ.moving=0;eqRemember();eqSay('被發現插隊！本局失去 '+fmt(EQ.stake)+' 點，未領回的獎勵歸零。','lose');eqUI();}
  function eqCash(){
    eqSync(performance.now());
    if(!EQ.active||['waiting','cleared'].indexOf(EQ.phase)<0||eqTotal()<1)return;
    var pay=eqPay(),net=pay-EQ.stake;AN.end(EQ.analytics,pay,'cashout',{stage:EQ.stage,step:EQ.passed,multiplier:eqMultAt(EQ.passed)});EQ.active=false;EQ.phase='cashed';S.balance+=pay;save();renderAll();eqRemember();
    eqSay((EQ.stage===5&&EQ.passed===eqCount()?'五關全部完成！':'已收手。')+'領回 '+fmt(pay)+' 點。','win');eqUI();
  }
  // Process every gaze change and movement end in time order, even on a slow frame.
  function eqStep(dt){
    while(dt>1e-8&&EQ.active&&EQ.phase!=='cleared'){
      var ahead=EQ.people.slice(EQ.passed),slice=dt;
      ahead.forEach(function(p){slice=Math.min(slice,Math.max(0,p.time));});
      if(EQ.phase==='moving')slice=Math.min(slice,EQ.moving);
      ahead.forEach(function(p){p.time-=slice;});if(EQ.phase==='moving')EQ.moving-=slice;dt-=slice;
      ahead.forEach(function(p){if(p.time>1e-8)return;
        if(p.state==='safe'){p.state='warn';p.time=eqRand(.18,1.3);}
        else if(p.state==='warn'){if(Math.random()<.7){p.state='look';p.time=eqRand(.4,.8);}else{p.state='safe';p.time=eqRest(p.index);}}
        else{p.state='safe';p.time=eqRest(p.index);}
      });
      if(EQ.phase==='moving'&&ahead.some(function(p){return p.state==='look';})){eqLose();return;}
      if(EQ.phase==='moving'&&EQ.moving<=1e-8){EQ.passed++;AN.progress(EQ.analytics,{stage:EQ.stage,step:EQ.passed,multiplier:eqMultAt(EQ.passed)},EQ.passed===eqCount());EQ.phase='waiting';EQ.moving=0;eqRemember();eqSay('已插過 '+EQ.passed+' 人。可以收手，也可以觀察後再插一位。','win');if(EQ.passed===eqCount()){EQ.phase='cleared';if(EQ.stage===5)eqCash();else{eqSay('第 '+EQ.stage+' 關完成！可以領回，或挑戰 '+EQ_COUNTS[EQ.stage]+' 人的下一關。','win');eqUI();}return;}}
    }
  }
  function eqSync(now){var dt=Math.max(0,(now-EQ.last)/1000);EQ.last=now;if(EQ.active&&!$('view-elevator').hidden&&!document.hidden)eqStep(dt);}
  function eqAction(){
    var wasActive=EQ.active;eqSync(performance.now());
    if(wasActive&&!EQ.active)return;
    if(!EQ.active){
      var stake=ENTRY_FEE;
      if(stake>S.balance){eqSay(LOW_MSG,'lose');return;}
      EQ.analytics=AN.start('elevator',stake);EQ.stake=stake;EQ.stage=1;EQ.active=true;eqRound();
      S.balance-=stake;save();renderAll();eqSay('先觀察乘客，再點一下往前插一位。警示不會直接抓人，但可能隨時轉頭。');eqUI();return;
    }
    if(EQ.phase==='cleared'){EQ.stage++;eqRound();eqSay('第 '+EQ.stage+' 關：前方 '+eqCount()+' 人，累積的進度保留；繼續挑戰不再扣點。');eqUI();return;}
    if(EQ.phase!=='waiting')return;
    if(EQ.people.slice(EQ.passed).some(function(p){return p.state==='look';})){eqLose();return;}
    EQ.phase='moving';EQ.duration=.28+EQ.passed*.012;EQ.moving=EQ.duration;eqSay('正在移動，這段時間被乘客回頭看見也會失敗。');eqUI();
  }
  // Side-view characters and hopping motion adapted from the original Queue Cutter.
  function eqPerson(x,y,color,state,isPlayer,alpha){
    var g=eqCtx;g.save();g.globalAlpha=alpha;
    g.fillStyle='rgba(0,0,0,.16)';g.beginPath();g.ellipse(x,y+3,14,4,0,0,Math.PI*2);g.fill();
    g.strokeStyle=color;g.lineWidth=6;g.lineCap='round';g.beginPath();g.moveTo(x-6,y-20);g.lineTo(x-6,y);g.moveTo(x+6,y-20);g.lineTo(x+6,y);g.stroke();
    g.fillStyle=color;g.fillRect(x-14,y-58,28,40);
    var hy=y-74;g.fillStyle=state==='safe'?'#2b2118':'#f5d0a9';g.beginPath();g.arc(x,hy,14,0,Math.PI*2);g.fill();
    if(state==='warn'){
      g.fillStyle='#2b2118';g.beginPath();g.arc(x,hy,14,-Math.PI/2,Math.PI/2);g.fill();
      g.fillStyle='#ffcf66';g.font='700 27px system-ui';g.textAlign='center';g.fillText('?',x,hy-23);
    }
    if(state==='look'){
      g.fillStyle='#fff';g.beginPath();g.arc(x-9,hy-2,4,0,Math.PI*2);g.arc(x-1,hy-2,4,0,Math.PI*2);g.fill();
      g.fillStyle='#191a24';g.beginPath();g.arc(x-10,hy-2,2,0,Math.PI*2);g.arc(x-2,hy-2,2,0,Math.PI*2);g.fill();
      g.strokeStyle='#2b2118';g.lineWidth=2.5;g.beginPath();g.moveTo(x-14,hy-11);g.lineTo(x-6,hy-7);g.moveTo(x-1,hy-7);g.lineTo(x+5,hy-11);g.stroke();
      g.strokeStyle='#ff756f';g.lineWidth=2.5;g.beginPath();g.arc(x,hy,18,0,Math.PI*2);g.stroke();
    }
    if(isPlayer){g.fillStyle='#fff5d9';g.beginPath();g.moveTo(x-8,hy-34);g.lineTo(x+8,hy-34);g.lineTo(x,hy-22);g.closePath();g.fill();}
    g.restore();
  }
  function eqDraw(){
    var g=eqCtx,W=520,H=580,FY=420,SP=36,count=eqCount(),cols=count>10?Math.ceil(count/2):10;
    function spot(n){return count<=10||n<=cols?{x:70+n*SP,y:FY}:{x:70+(2*cols+1-n)*SP,y:FY-120};}
    var f=EQ.phase==='moving'?1-EQ.moving/EQ.duration:0;
    // Smooth camera motion keeps the player at the left as the queue slides past.
    var travel=0;
    g.clearRect(0,0,W,H);g.fillStyle='#2e3350';g.fillRect(0,0,W,FY);g.fillStyle='#1d2036';g.fillRect(0,FY,W,H-FY);
    g.strokeStyle='#414762';g.lineWidth=1;g.beginPath();g.moveTo(0,205);g.lineTo(W,205);g.stroke();
    g.fillStyle='#343b59';g.fillRect(28,225,70,68);g.strokeStyle='#586781';g.strokeRect(28,225,70,68);g.fillStyle='#8db0b9';g.font='11px system-ui';g.textAlign='center';g.fillText('請依序排隊',63,254);g.fillText('深海升降艙',63,275);
    g.strokeStyle='#2a2e4a';g.lineWidth=2;
    for(var k=-1;k<11;k++){var lx=k*60-(travel*SP)%60;g.beginPath();g.moveTo(lx,FY);g.lineTo(lx-40,H);g.stroke();}
    var end=spot(count+1),doorX=end.x,doorY=end.y;g.save();g.translate(0,doorY-FY);
    g.fillStyle='#4a5a7a';g.fillRect(doorX-29,FY-140,58,140);g.fillStyle='#202b42';g.fillRect(doorX-21,FY-119,42,119);
    g.fillStyle=EQ.passed===count?'#a2e4c2':'#ffcf66';g.fillRect(doorX-17,FY-132,34,8);
    if(EQ.passed<10){g.strokeStyle='#8297b0';g.lineWidth=2;g.beginPath();g.moveTo(doorX,FY-118);g.lineTo(doorX,FY);g.stroke();}
    g.fillStyle='#dce5ef';g.font='600 12px system-ui';g.textAlign='center';g.fillText('電梯',doorX,FY-151);g.restore();
    var palette=['#6b9ac4','#c47f6b','#7fb08a','#a78bfa','#d98aa8','#8aa2b8'];
    var people=EQ.people.length?EQ.people:Array.from({length:count},function(_,i){return {index:i,state:'safe'};});
    people.forEach(function(p,i){var point=spot(i+1),x=point.x,passed=i<EQ.passed;
      eqPerson(x,point.y,palette[i%palette.length],passed?'safe':p.state,false,passed?.28:1);
    });
    var hop=EQ.phase==='moving'?Math.sin(Math.PI*f)*18:0;
    var from=spot(EQ.passed),to=spot(EQ.passed+1),playerX=from.x+(to.x-from.x)*f,playerY=from.y+(to.y-from.y)*f;
    eqPerson(playerX,playerY-hop,'#f2c14e',EQ.phase==='caught'?'look':'safe',true,1);
    g.fillStyle='#f5df9f';g.font='600 13px system-ui';g.textAlign='center';g.fillText('你',playerX,playerY+30);
    g.textAlign='left';g.fillStyle='#e9edf6';g.font='600 23px system-ui';g.fillText('Queue Cutter',24,38);
    g.textAlign='right';g.font='600 17px system-ui';g.fillStyle='#a5b4cb';g.fillText('第 '+EQ.stage+' 關 · '+EQ.passed+' / '+count,W-24,38);
    g.fillStyle='#1d2036';g.fillRect(24,55,W-48,7);g.fillStyle='#f2c14e';g.fillRect(24,55,(W-48)*EQ.passed/count,7);
    var ahead=people.slice(EQ.passed),look=ahead.some(function(p){return p.state==='look';}),warn=ahead.some(function(p){return p.state==='warn';});
    g.textAlign='center';g.font='19px system-ui';g.fillStyle='#e4e8f1';g.fillText('前面還有 '+(eqCount()-EQ.passed)+' 位乘客',W/2,105);
    g.font='600 17px system-ui';g.fillStyle=look?'#ff8a80':warn?'#ffcf66':'#a2e4c2';
    g.fillText(!EQ.active?'觀察表情，偷偷向前一步':EQ.phase==='cleared'?'本關完成！收手或繼續下一關':look?'有人回頭了，先別動！':warn?'出現「？」了，小心隨時回頭':'大家都背對你，找機會往前插',W/2,141);
    g.fillStyle='#a5b4cb';g.font='13px system-ui';g.fillText('點一下插過一人 · 白色箭頭是你',W/2,517);
    if(EQ.phase==='cashed'||EQ.phase==='caught'||EQ.phase==='cleared'){
      g.fillStyle='rgba(24,28,48,.93)';g.fillRect(50,180,420,100);g.fillStyle=EQ.phase==='caught'?'#ff8a80':'#a2e4c2';g.font='600 25px system-ui';g.fillText(EQ.phase==='caught'?'「喂，排隊去！」':EQ.phase==='cleared'?'到隊首了！要繼續嗎？':EQ.stage===5&&EQ.passed===count?'五關全部完成！':'見好就收！',W/2,219);
      g.font='16px system-ui';g.fillStyle='#e9edf6';g.fillText(EQ.phase==='caught'?'被發現了，本局失去 '+fmt(EQ.stake)+' 點':(EQ.phase==='cleared'?'可領回或繼續 · ':'已領回 '+fmt(eqPay())+' 點 · ')+'累計插過 '+eqTotal()+' 人',W/2,254);
    }
  }
  $('eq-go').addEventListener('click',eqAction);$('eq-cash').addEventListener('click',eqCash);
  eqCanvas.addEventListener('pointerdown',function(e){if(!EQ.active)return;e.preventDefault();eqAction();});
  document.addEventListener('keydown',function(e){if($('view-elevator').hidden||document.hidden||e.code!=='Space'||e.repeat||e.ctrlKey||e.altKey||e.metaKey)return;if(['INPUT','BUTTON','A','SUMMARY'].indexOf(e.target.tagName)>=0)return;e.preventDefault();if(EQ.active)eqAction();});
  document.addEventListener('visibilitychange',function(){EQ.last=performance.now();});
  function eqLoop(now){eqSync(now);if(!$('view-elevator').hidden&&!document.hidden){eqUI();eqDraw();}requestAnimationFrame(eqLoop);}
  eqUI();eqDraw();requestAnimationFrame(eqLoop);

