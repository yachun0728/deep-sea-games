  /* ---------- Elevator Queue: endless queues; milestone bonuses are credited to the shared wallet when reached ---------- */
  var EQ={active:false,phase:'ready',stage:1,passed:0,total:0,earned:0,pops:[],stake:0,people:[],moving:0,last:0,show:0,best:0};
// Every cleared queue leads straight to a longer, faster one. Milestones count total people passed
// and were calibrated with a state-machine simulation (see GAME_RULES.md).
var EQ_MILESTONES=[[40,3],[55,7],[70,15],[90,30]],EQ_ENDLESS_FROM=90,EQ_ENDLESS_STEP=20,EQ_ENDLESS_BONUS=40;
function eqBonusAt(n){for(var i=0;i<EQ_MILESTONES.length;i++)if(EQ_MILESTONES[i][0]===n)return EQ_MILESTONES[i][1];return n>EQ_ENDLESS_FROM&&(n-EQ_ENDLESS_FROM)%EQ_ENDLESS_STEP===0?EQ_ENDLESS_BONUS:0;}
function eqNext(n){for(var i=0;i<EQ_MILESTONES.length;i++)if(EQ_MILESTONES[i][0]>n)return EQ_MILESTONES[i];return [EQ_ENDLESS_FROM+(Math.floor((n-EQ_ENDLESS_FROM)/EQ_ENDLESS_STEP)+1)*EQ_ENDLESS_STEP,EQ_ENDLESS_BONUS];}
  var eqCanvas=$('eq-canvas'),eqCtx=eqCanvas.getContext('2d');
  try{var qb=Number(localStorage.getItem('deep-sea-queue-best'));if(Number.isFinite(qb))EQ.best=Math.max(0,Math.floor(qb));}catch(e){}
  var eqRank=timedLeaderboard('elevator','eq',elevatorRules.inputCount,eqUI);
  function eqCount(){return elevatorRules.count(EQ);}
  function eqTotal(){return EQ.total;}
  function eqRound(){AN.resume(EQ.analytics,{stage:EQ.stage,step:0});EQ.last=performance.now();}
  function eqSay(text,kind){$('eq-msg').textContent=text;$('eq-msg').className='msg'+(kind?' '+kind:'');}
  function eqRemember(){if(eqTotal()>EQ.best){EQ.best=eqTotal();try{localStorage.setItem('deep-sea-queue-best',String(EQ.best));}catch(e){}}}
  function eqUI(){
    var nx=eqNext(EQ.total);
    $('eq-progress').textContent=EQ.passed+' / '+eqCount();$('eq-remaining').textContent=(eqCount()-EQ.passed)+' 人';
    $('eq-best').textContent=EQ.best+' 人';$('eq-stage').textContent='第 '+EQ.stage+' 隊';$('eq-total').textContent=eqTotal()+' 人';$('eq-next').textContent=nx[0]+' 人 · +'+nx[1];$('eq-amount').disabled=EQ.active;
    $('eq-go').textContent=EQ.active?(EQ.phase==='moving'?'正在插隊…':'往前插一位'):'開始排隊';$('eq-go').disabled=EQ.phase==='moving'||eqRank.busy();
    $('eq-go').dataset.mode=EQ.active?'surface':'bet';
    var ahead=EQ.people.slice(EQ.passed),look=ahead.filter(p=>p.state==='look').length,warn=ahead.filter(p=>p.state==='warn').length;
    var watchText=!EQ.active?(EQ.phase==='ready'?'尚未開始':'本局已結束'):look?'回頭注視 '+look+' 人':warn?'警示 '+warn+' 人 · 可能隨時轉頭':'前方乘客都背對你';
    if($('eq-watch').textContent!==watchText)$('eq-watch').textContent=watchText;
    $('eq-watch').dataset.state=look?'look':warn?'warn':'safe';
    document.querySelectorAll('[data-eq-step]').forEach(function(b){b.setAttribute('aria-current',Number(b.dataset.eqStep)===EQ.passed?'step':'false');});
  }
  function eqLose(onInput){if(!EQ.active)return;AN.end(EQ.analytics,EQ.earned,EQ.earned>0?'complete':'loss',{stage:EQ.stage,step:EQ.passed});EQ.active=false;EQ.phase='caught';EQ.moving=0;eqRank.finish(EQ.total,onInput);eqRemember();eqSay('被發現插隊！本局共插過 '+EQ.total+' 人，'+(EQ.earned>0?'入帳 '+fmt(EQ.earned)+' 點。':'這一局沒有獎勵。'),EQ.earned>0?'win':'lose');eqUI();}
  function eqAward(n,b){EQ.earned+=b;S.balance+=b;save();renderAll();AN.progress(EQ.analytics,{stage:EQ.stage,step:n,bonus_points:b});EQ.pops.push({n:n,b:b,age:0});if(EQ.pops.length>3)EQ.pops.shift();eqSay('累計插過 '+n+' 人！獎勵 +'+b+' 點已入帳，本局累計 +'+EQ.earned+' 點。','win');}
  function eqEvent(event){
    if(event==='caught'){eqLose(false);return;}
    if(event==='next'){
      eqRound();
      eqSay('到隊首了！第 '+EQ.stage+' 隊：前方 '+eqCount()+' 人，乘客轉頭更頻繁。','win');
      eqUI();
      return;
    }
    AN.progress(EQ.analytics,{stage:EQ.stage,step:EQ.passed},EQ.passed===eqCount());
    eqRemember();
    var bonus=eqBonusAt(EQ.total);
    if(bonus)eqAward(EQ.total,bonus);else eqSay('已插過 '+EQ.total+' 人。觀察乘客，再插下一位。','win');
  }
  function eqSync(now){var dt=Math.max(0,now-EQ.last);EQ.last=now;if(EQ.active&&!$('view-elevator').hidden&&!document.hidden)eqRank.update(dt,()=>EQ.active,step=>elevatorRules.advance(EQ,step));}
  function eqAction(){
    if(eqRank.busy())return;
    var wasActive=EQ.active;eqSync(performance.now());
    if(wasActive&&!EQ.active)return;
    if(!EQ.active){
      var stake=ENTRY_FEE;
      if(stake>S.balance){eqSay(LOW_MSG,'lose');return;}
      eqRank.start(function(random){
        EQ.analytics=AN.start('elevator',stake);EQ.stake=stake;EQ.stage=1;EQ.total=0;EQ.earned=0;EQ.pops=[];EQ.active=true;
        elevatorRules.create(random||Math.random,eqEvent,EQ);eqRound();
        save();renderAll();eqSay('先觀察乘客，再點一下往前插一位。沒有終點，隊伍越來越長、乘客越來越常轉頭，被發現才結束。');eqUI();
      },eqUI);
      return;
    }
    if(!elevatorRules.input(EQ,0))return;
    eqRank.record(0);
    if(EQ.dead){eqLose(true);return;}
    eqSay('正在移動，這段時間被乘客回頭看見也會失敗。');eqUI();
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
    g.textAlign='right';g.font='600 17px system-ui';g.fillStyle='#a5b4cb';g.fillText('第 '+EQ.stage+' 隊 · '+EQ.passed+' / '+count+' · 本局 +'+EQ.earned+' 點',W-24,38);
    g.fillStyle='#1d2036';g.fillRect(24,55,W-48,7);g.fillStyle='#f2c14e';g.fillRect(24,55,(W-48)*EQ.passed/count,7);
    var ahead=people.slice(EQ.passed),look=ahead.some(function(p){return p.state==='look';}),warn=ahead.some(function(p){return p.state==='warn';});
    g.textAlign='center';g.font='19px system-ui';g.fillStyle='#e4e8f1';g.fillText('前面還有 '+(eqCount()-EQ.passed)+' 位乘客',W/2,105);
    g.font='600 17px system-ui';g.fillStyle=look?'#ff8a80':warn?'#ffcf66':'#a2e4c2';
    g.fillText(!EQ.active?'觀察表情，偷偷向前一步':look?'有人回頭了，先別動！':warn?'出現「？」了，小心隨時回頭':'大家都背對你，找機會往前插',W/2,141);
    g.fillStyle='#a5b4cb';g.font='13px system-ui';g.fillText('點一下插過一人 · 白色箭頭是你',W/2,517);
    EQ.pops.forEach(function(p){g.globalAlpha=Math.max(0,1-p.age/2.2);var py=200-(reduceMotion?0:Math.min(1,p.age*3)*22);g.textAlign='center';g.fillStyle='#f2c14e';g.font='700 38px system-ui';g.fillText('+'+p.b+' 點',W/2,py);g.fillStyle='#e9edf6';g.font='600 17px system-ui';g.fillText('累計插過 '+p.n+' 人里程碑',W/2,py+28);g.globalAlpha=1;});
    if(EQ.phase==='caught'){
      g.fillStyle='rgba(24,28,48,.93)';g.fillRect(50,180,420,100);g.fillStyle='#ff8a80';g.font='600 25px system-ui';g.fillText('「喂，排隊去！」',W/2,219);
      g.font='16px system-ui';g.fillStyle='#e9edf6';g.fillText('被發現了 · 累計插過 '+eqTotal()+' 人'+(EQ.earned>0?' · 入帳 +'+fmt(EQ.earned)+' 點':''),W/2,254);
    }
  }
  $('eq-go').addEventListener('click',eqAction);
  eqCanvas.addEventListener('pointerdown',function(e){if(!EQ.active)return;e.preventDefault();eqAction();});
  document.addEventListener('keydown',function(e){if($('view-elevator').hidden||document.hidden||e.code!=='Space'||e.repeat||e.ctrlKey||e.altKey||e.metaKey)return;if(['INPUT','BUTTON','A','SUMMARY'].indexOf(e.target.tagName)>=0)return;e.preventDefault();if(EQ.active)eqAction();});
  document.addEventListener('visibilitychange',function(){EQ.last=performance.now();});
  function eqLoop(now){eqSync(now);EQ.pops.forEach(function(p){p.age+=.016;});EQ.pops=EQ.pops.filter(function(p){return p.age<2.2;});if(!$('view-elevator').hidden&&!document.hidden){eqUI();eqDraw();}requestAnimationFrame(eqLoop);}
  eqUI();eqDraw();requestAnimationFrame(eqLoop);

