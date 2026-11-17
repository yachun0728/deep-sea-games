  /* ---------- Fishing: land fish to grow the shared-wallet return ---------- */
  var FI={active:false,phase:'ready',landed:0,stake:0,number:1,distance:20,start:20,tension:45,slack:0,mode:'calm',timer:3,hold:false,last:0,clock:0,best:0};
  var FI_MULT=[0,.6,1.1,1.7,2.5,3.6,5,6.8,9.2,12.5,17];
  var FI_NAMES=['小丑魚','藍雀鯛','小河豚','彩虹魚','海鱸','鮪魚','鬼頭刀','旗魚','巨型石斑','深海魚王'];
  var fishingCanvas=$('fi-canvas'),fishingCtx=fishingCanvas.getContext('2d'),fishingPointers=new Set(),fishingKeys=new Set();
  try{var fb=Number(localStorage.getItem('deep-sea-fishing-best'));if(Number.isFinite(fb))FI.best=Math.min(10,Math.max(0,fb));}catch(e){}
  function fiText(id,value){var el=$(id);if(el.textContent!==value)el.textContent=value;}
  function fiSay(text,kind){fiText('fi-msg',text);$('fi-msg').className='msg'+(kind?' '+kind:'');}
  function fiRand(a,b){return a+Math.random()*(b-a);}
  function fiPay(){return Math.floor(FI.stake*FI_MULT[FI.landed]);}
  function fiRelease(){fishingPointers.clear();fishingKeys.clear();FI.hold=false;}
  function fiRemember(){if(FI.landed>FI.best){FI.best=FI.landed;try{localStorage.setItem('deep-sea-fishing-best',String(FI.best));}catch(e){}}}
  function fiUI(){
    var payable=FI.phase==='lost'?0:fiPay(),net=payable-FI.stake;
    fiText('fi-number',FI.number+' / 10');fiText('fi-distance',Math.max(0,FI.distance).toFixed(1)+' m');fiText('fi-best',FI.best+' 條');
    fiText('fi-mult',fx(FI_MULT[FI.landed])+'×');fiText('fi-pay',fmt(payable)+' 點');fiText('fi-net',FI.stake?(net>0?'+':'')+fmt(net)+' 點':'—');
    $('fi-net').style.color=net>0?'var(--glow)':net<0?'var(--crush)':'var(--muted)';$('fi-amount').disabled=FI.active;
    $('fi-go').disabled=FI.phase==='fishing';fiText('fi-go',FI.phase==='fishing'?'拉鋸中 · 按住收線':FI.phase==='landed'?'挑戰下一條 · 不再扣點':'扣點下竿');
    $('fi-hold').disabled=FI.phase!=='fishing';fiText('fi-hold',FI.hold?'收線中 · 放開卸力':'按住收線 · 放開卸力');
    $('fi-cash').disabled=FI.phase!=='landed';fiText('fi-cash',FI.phase==='landed'?'收手領回 '+fmt(fiPay())+' 點':'魚上岸後可領回');
    var tension=Math.max(0,Math.min(100,FI.tension));$('fi-tension-fill').style.width=tension+'%';
    var danger=tension>=88||tension<=8,warn=tension>75||tension<20;
    $('fi-tension-fill').style.background=danger?'var(--crush)':warn?'var(--lamp)':'var(--glow)';
    $('fi-tension').setAttribute('aria-valuenow',String(Math.round(tension)));fiText('fi-tension-value',Math.round(tension)+' / 100');
    fiText('fi-slack',FI.phase==='fishing'&&tension<=8?'快脫鉤了！立即收線':FI.phase==='fishing'&&tension>=88?'魚線快斷了！放開卸力':'張力 20～75 較穩定');
    var text=FI.phase==='landed'?'成功上岸！領回或挑戰下一條':FI.phase==='lost'?'本局結束':FI.phase==='cashed'?'本局已領回':FI.phase==='ready'?'下竿後，觀察魚的動作':FI.mode==='struggle'?'猛力掙扎 · 放開卸力':FI.mode==='warn'?'水花變大 · 準備掙扎':FI.mode==='tired'?'魚累了 · 趁機收線':'平穩游動 · 可以收線';
    fiText('fi-signal',text);$('fi-signal').dataset.state=FI.mode;
    fiText('fi-name',FI_NAMES[FI.number-1]);
    document.querySelectorAll('[data-fi-count]').forEach(function(el){el.setAttribute('aria-current',Number(el.dataset.fiCount)===FI.landed?'step':'false');});
  }
  function fiRound(){
    FI.number=FI.landed+1;AN.resume(FI.analytics,{stage:FI.number});FI.distance=18+FI.number*2;FI.start=FI.distance;FI.tension=45;FI.slack=0;FI.mode='calm';FI.timer=fiRand(2.1,3.2);FI.phase='fishing';FI.last=performance.now();fiRelease();
    fiSay('第 '+FI.number+' 條 '+FI_NAMES[FI.number-1]+' 上鉤了！按住收線，掙扎時放開；線太鬆也可能脫鉤。');fiUI();fishingCanvas.focus();
  }
  function fiStart(){
    if(FI.phase==='fishing')return;
    if(FI.phase==='landed'){fiRound();return;}
    var stake=Number($('fi-amount').value);
    if(!Number.isSafeInteger(stake)||stake<MIN_BET){fiSay('請輸入至少 '+MIN_BET+' 點的整數入場點數。','lose');return;}
    if(stake>S.balance){fiSay('餘額不足，請降低入場點數。','lose');return;}
    FI.analytics=AN.start('fishing',stake);FI.stake=stake;FI.landed=0;FI.active=true;S.balance-=stake;save();renderAll();fiRound();
  }
  function fiLose(reason){if(FI.phase!=='fishing')return;AN.end(FI.analytics,0,'loss',{stage:FI.number,landed_fish:FI.landed});FI.active=false;FI.phase='lost';fiRelease();fiSay(reason+' 本局失去 '+fmt(FI.stake)+' 點下注與全部未領回金額。','lose');fiUI();}
  function fiCash(){
    if(!FI.active||FI.phase!=='landed')return;
    var pay=fiPay(),net=pay-FI.stake;AN.end(FI.analytics,pay,'cashout',{stage:FI.number,landed_fish:FI.landed,multiplier:FI_MULT[FI.landed]});FI.active=false;FI.phase='cashed';fiRelease();S.balance+=pay;save();renderAll();
    fiSay((FI.landed===10?'十條全部釣上岸！':'已收手。')+'領回 '+fmt(pay)+' 點，本局'+(net>=0?'淨賺 ':'淨損 ')+fmt(Math.abs(net))+' 點。',net>=0?'win':'');fiUI();
  }
  function fiLand(){
    if(FI.phase!=='fishing')return;
    FI.distance=0;FI.landed++;AN.progress(FI.analytics,{stage:FI.number,landed_fish:FI.landed,multiplier:FI_MULT[FI.landed]},true);FI.phase='landed';fiRelease();fiRemember();
    fiSay('釣到 '+FI_NAMES[FI.number-1]+'！倍率升到 '+fx(FI_MULT[FI.landed])+'×，可領回 '+fmt(fiPay())+' 點，或挑戰下一條。','win');
    if(FI.landed===10)fiCash();else fiUI();
  }
  function fiNextMode(){
    if(FI.mode==='calm'){FI.mode=Math.random()<.18?'tired':'warn';FI.timer=FI.mode==='tired'?fiRand(1.4,2):Math.max(.28,.65-FI.number*.035);}
    else if(FI.mode==='warn'){FI.mode='struggle';FI.timer=fiRand(.85,1.4)+FI.number*.045;}
    else if(FI.mode==='struggle'){FI.mode='tired';FI.timer=fiRand(1.2,2.1);}
    else{FI.mode='calm';FI.timer=fiRand(1.8,3.1)-FI.number*.07;}
  }
  function fiStep(dt){
    // Small time slices preserve line-break and slack detection on delayed frames.
    while(dt>1e-8&&FI.phase==='fishing'){
      var step=Math.min(dt,.02,Math.max(0,FI.timer));
      if(step<=1e-8){fiNextMode();continue;}
      var hard=FI.number,rate,drift;
      if(FI.hold){rate=FI.mode==='struggle'?34+hard*2:FI.mode==='warn'?13+hard*.5:FI.mode==='tired'?4+hard*.15:9+hard*.6;
        drift=FI.mode==='struggle'?.5+hard*.05:FI.mode==='warn'?-1.2:FI.mode==='tired'?-3.1:-(2.2-hard*.025);
      }else{rate=FI.mode==='struggle'?-8:FI.mode==='tired'?-13:-11;drift=FI.mode==='struggle'?1.45+hard*.07:FI.mode==='tired'?.45:.75+hard*.06;}
      FI.tension=Math.max(0,FI.tension+rate*step);FI.distance=Math.max(0,Math.min(FI.start*1.8,FI.distance+drift*step));FI.clock+=step;FI.timer-=step;dt-=step;
      FI.slack=FI.tension<=8?FI.slack+step:0;
      if(FI.tension>=100-1e-8){FI.tension=100;fiLose('魚線斷了！');return;}
      if(FI.slack>=1.2-1e-8){fiLose('魚線太鬆，魚脫鉤了！');return;}
      if(FI.distance<=1e-8){fiLand();return;}
      if(FI.timer<=1e-8)fiNextMode();
    }
  }
  function fiSync(now){var dt=Math.max(0,(now-FI.last)/1000);FI.last=now;if(!$('view-fishing').hidden&&!document.hidden)fiStep(dt);}
  function fiDraw(){
    var g=fishingCtx,W=520,H=560,t=FI.clock,water=198;
    g.clearRect(0,0,W,H);var sky=g.createLinearGradient(0,0,0,water);sky.addColorStop(0,'#0c2230');sky.addColorStop(1,'#1c5361');g.fillStyle=sky;g.fillRect(0,0,W,water);
    g.fillStyle='#d7e9dc';g.beginPath();g.arc(428,68,24,0,Math.PI*2);g.fill();g.fillStyle='#164353';g.beginPath();g.arc(439,61,22,0,Math.PI*2);g.fill();
    var sea=g.createLinearGradient(0,water,0,H);sea.addColorStop(0,'#12506a');sea.addColorStop(1,'#051620');g.fillStyle=sea;g.fillRect(0,water,W,H-water);
    for(var i=0;i<4;i++){g.strokeStyle=i===0?'#62e6d2':'rgba(141,176,185,.16)';g.lineWidth=i===0?2:1;g.beginPath();for(var x=0;x<=W;x+=8){var y=water+i*17+Math.sin(x/28+t*2+i)*4;if(x===0)g.moveTo(x,y);else g.lineTo(x,y);}g.stroke();}
    g.fillStyle='#173e46';g.beginPath();g.moveTo(0,170);g.lineTo(88,180);g.lineTo(128,230);g.lineTo(0,249);g.closePath();g.fill();
    g.fillStyle='#8d7254';g.fillRect(15,170,145,13);g.fillStyle='#4c433a';g.fillRect(30,183,9,67);g.fillRect(133,183,9,42);
    var ax=98,ay=146;g.strokeStyle='#ffb638';g.lineWidth=6;g.lineCap='round';g.beginPath();g.moveTo(ax-9,ay+10);g.lineTo(ax-14,169);g.moveTo(ax+5,ay+10);g.lineTo(ax+10,169);g.stroke();g.fillStyle='#ffb638';g.fillRect(ax-12,ay-26,24,36);g.fillStyle='#f5d0a9';g.beginPath();g.arc(ax,ay-39,12,0,Math.PI*2);g.fill();g.fillStyle='#62e6d2';g.fillRect(ax-15,ay-51,30,7);g.fillRect(ax-10,ay-57,21,8);
    var progress=FI.phase==='landed'||FI.phase==='cashed'?1:Math.max(0,Math.min(1,1-FI.distance/FI.start));
    var fishX=410-progress*222,fishY=350-progress*103+Math.sin(t*3)*9;
    var bend=FI.tension/100*34,tipX=228-bend,tipY=69+bend;
    g.strokeStyle='#d6bd8e';g.lineWidth=4;g.beginPath();g.moveTo(110,132);g.quadraticCurveTo(176,45+Math.max(0,bend-10),tipX,tipY);g.stroke();
    g.strokeStyle=FI.tension>=88?'#ff6f61':FI.tension<=8?'#8db0b9':'#e4f2f3';g.lineWidth=1.5;g.beginPath();g.moveTo(tipX,tipY);if(FI.tension<20)g.quadraticCurveTo(fishX-70,fishY+60,fishX,fishY);else g.lineTo(fishX,fishY);g.stroke();g.lineCap='butt';
    for(var b=0;b<8;b++){var bx=(b*71+40)%500,by=H-((t*18+b*51)%300);g.strokeStyle='rgba(141,176,185,.23)';g.lineWidth=1;g.beginPath();g.arc(bx,by,2+b%3,0,Math.PI*2);g.stroke();}
    var scale=.65+FI.number*.06,colors=['#ffb638','#79c9db','#c8cf8a','#dc94b7','#83c6aa'];
    if(FI.phase==='landed'||FI.phase==='cashed'){fishX=243;fishY=260;}
    g.save();g.translate(fishX,fishY);g.scale(scale,scale);g.rotate(FI.mode==='struggle'?Math.sin(t*19)*.24:Math.sin(t*2)*.05);
    g.fillStyle=colors[(FI.number-1)%colors.length];g.beginPath();g.moveTo(32,0);g.lineTo(59,-24);g.lineTo(55,22);g.closePath();g.fill();g.beginPath();g.ellipse(0,0,40,25,0,0,Math.PI*2);g.fill();g.fillStyle='rgba(255,255,255,.26)';g.beginPath();g.ellipse(-3,9,24,11,0,0,Math.PI*2);g.fill();g.fillStyle='#e4f2f3';g.beginPath();g.arc(-22,-5,9,0,Math.PI*2);g.fill();g.fillStyle='#051620';g.beginPath();g.arc(-25,-5,4,0,Math.PI*2);g.fill();g.strokeStyle='#0c2230';g.lineWidth=2;g.beginPath();g.arc(-34,8,5,-.5,1);g.stroke();g.restore();
    if(FI.mode==='struggle'||FI.mode==='warn'){g.strokeStyle=FI.mode==='struggle'?'#ffb638':'#8db0b9';g.lineWidth=2;for(var s=0;s<5;s++){var a=s*.9+t*3;g.beginPath();g.moveTo(fishX+Math.cos(a)*57,fishY+Math.sin(a)*32);g.lineTo(fishX+Math.cos(a)*70,fishY+Math.sin(a)*43);g.stroke();}}
    g.textAlign='left';g.fillStyle='#e4f2f3';g.font='600 21px system-ui';g.fillText('深海釣手',20,32);g.textAlign='right';g.fillStyle='#8db0b9';g.font='14px system-ui';g.fillText('第 '+FI.number+' / 10 條',W-20,31);
    g.textAlign='center';g.fillStyle='#8db0b9';g.font='13px system-ui';g.fillText('按住收線 · 放開卸力 · 上岸才增加倍率',W/2,H-20);
    if(FI.phase==='landed'||FI.phase==='cashed'||FI.phase==='lost'||FI.phase==='ready'){
      g.fillStyle='rgba(5,22,32,.88)';g.fillRect(48,389,424,103);g.fillStyle=FI.phase==='lost'?'#ff6f61':'#62e6d2';g.font='600 25px system-ui';g.fillText(FI.phase==='ready'?'準備釣一條大魚？':FI.phase==='lost'?'魚逃走了！':FI.phase==='cashed'?'已領回 '+fmt(fiPay())+' 點':'成功釣上岸！',W/2,430);g.fillStyle='#e4f2f3';g.font='15px system-ui';g.fillText(FI.phase==='ready'?'先扣點下竿，再按住畫面開始收線':FI.phase==='landed'?'領回 '+fmt(fiPay())+' 點，或挑戰下一條':FI.phase==='lost'?'本局下注與未領回獎勵已失去':'本局釣到 '+FI.landed+' 條魚',W/2,465);
    }
  }
  function fiPress(e){if(e.button!==undefined&&e.button!==0)return;if(FI.phase!=='fishing'||$('view-fishing').hidden||document.hidden)return;e.preventDefault();fiSync(performance.now());if(FI.phase!=='fishing')return;fishingCanvas.focus();fishingPointers.add(e.pointerId);FI.hold=true;try{e.currentTarget.setPointerCapture(e.pointerId);}catch(_){}fiUI();}
  function fiLift(e){fiSync(performance.now());fishingPointers.delete(e.pointerId);FI.hold=fishingPointers.size>0||fishingKeys.size>0;}
  [fishingCanvas,$('fi-hold')].forEach(function(el){el.addEventListener('pointerdown',fiPress);['pointerup','pointercancel','lostpointercapture'].forEach(function(type){el.addEventListener(type,fiLift);});});
  $('fi-go').addEventListener('click',fiStart);$('fi-cash').addEventListener('click',fiCash);
  addEventListener('keydown',function(e){if($('view-fishing').hidden||document.hidden||FI.phase!=='fishing'||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;if(['INPUT','BUTTON','A','SUMMARY'].indexOf(e.target.tagName)>=0)return;if(e.code==='Space'){e.preventDefault();fiSync(performance.now());if(FI.phase==='fishing'){fishingKeys.add(e.code);FI.hold=true;}}});
  addEventListener('keyup',function(e){if(e.code!=='Space')return;if(!$('view-fishing').hidden)e.preventDefault();fiSync(performance.now());fishingKeys.delete(e.code);FI.hold=fishingPointers.size>0||fishingKeys.size>0;});
  addEventListener('blur',function(){fiRelease();FI.last=performance.now();});
  document.addEventListener('visibilitychange',function(){fiRelease();FI.last=performance.now();});
  window.addEventListener('hashchange',function(){fiRelease();FI.last=performance.now();});
  function fiLoop(now){fiSync(now);if(!$('view-fishing').hidden&&!document.hidden){fiUI();fiDraw();}requestAnimationFrame(fiLoop);}
  fiUI();fiDraw();requestAnimationFrame(fiLoop);


