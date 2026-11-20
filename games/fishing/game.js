  /* ---------- Fishing: endless catch; milestone bonuses are credited to the shared wallet when reached ---------- */
  var FI={active:false,phase:'ready',landed:0,stake:0,earned:0,pops:[],number:1,distance:20,start:20,tension:45,slack:0,mode:'calm',timer:3,hold:false,last:0,clock:0,best:0};
  // Milestones count landed fish; calibrated with a controller-bot simulation (see GAME_RULES.md).
var FI_MILESTONES=[[10,3],[12,7],[14,15],[17,30]],FI_ENDLESS_FROM=17,FI_ENDLESS_STEP=3,FI_ENDLESS_BONUS=40;
function fiBonusAt(n){for(var i=0;i<FI_MILESTONES.length;i++)if(FI_MILESTONES[i][0]===n)return FI_MILESTONES[i][1];return n>FI_ENDLESS_FROM&&(n-FI_ENDLESS_FROM)%FI_ENDLESS_STEP===0?FI_ENDLESS_BONUS:0;}
function fiNextMilestone(n){for(var i=0;i<FI_MILESTONES.length;i++)if(FI_MILESTONES[i][0]>n)return FI_MILESTONES[i];return [FI_ENDLESS_FROM+(Math.floor((n-FI_ENDLESS_FROM)/FI_ENDLESS_STEP)+1)*FI_ENDLESS_STEP,FI_ENDLESS_BONUS];}
function fiFishName(n){return n<=10?FI_NAMES[n-1]:'深海魚王 · 第 '+(n-9)+' 代';}
  var FI_NAMES=['{{t:fishing.msg.001}}','{{t:fishing.msg.002}}','{{t:fishing.msg.003}}','{{t:fishing.msg.004}}','{{t:fishing.msg.005}}','{{t:fishing.msg.006}}','{{t:fishing.msg.007}}','{{t:fishing.msg.008}}','{{t:fishing.msg.009}}','{{t:fishing.msg.010}}'];
  var fishingCanvas=$('fi-canvas'),fishingCtx=fishingCanvas.getContext('2d'),fishingPointers=new Set(),fishingKeys=new Set();
  try{var fb=Number(localStorage.getItem('deep-sea-fishing-best'));if(Number.isFinite(fb))FI.best=Math.max(0,Math.floor(fb));}catch(e){}
  function fiText(id,value){var el=$(id);if(el.textContent!==value)el.textContent=value;}
  function fiSay(text,kind){fiText('fi-msg',text);$('fi-msg').className='msg'+(kind?' '+kind:'');}
  var fiRank=timedLeaderboard('fishing','fi',fishingRules.inputCount,fiUI);
  function fiHold(hold){var action=hold?0:1;if(fishingRules.input(FI,action))fiRank.record(action);}
  function fiRelease(){fishingPointers.clear();fishingKeys.clear();fiHold(false);}
  function fiRemember(){if(FI.landed>FI.best){FI.best=FI.landed;try{localStorage.setItem('deep-sea-fishing-best',String(FI.best));}catch(e){}}}
  function fiUI(){
    var nx=fiNextMilestone(FI.landed);
    fiText('fi-number','第 '+FI.number+' 條');fiText('fi-distance',Math.max(0,FI.distance).toFixed(1)+' m');fiText('fi-best',FI.best+' 條');fiText('fi-next','釣到 '+nx[0]+' 條 · +'+nx[1]);
    $('fi-amount').disabled=FI.active;
    $('fi-go').disabled=FI.phase==='fishing'||fiRank.busy();fiText('fi-go',FI.phase==='fishing'?'{{t:fishing.msg.011}}':'{{t:fishing.msg.012}}');
    $('fi-hold').disabled=FI.phase!=='fishing';fiText('fi-hold',FI.hold?'{{t:fishing.msg.013}}':'{{t:fishing.msg.014}}');
    var tension=Math.max(0,Math.min(100,FI.tension));$('fi-tension-fill').style.width=tension+'%';
    var danger=tension>=88||tension<=8,warn=tension>75||tension<20;
    $('fi-tension-fill').style.background=danger?'var(--crush)':warn?'var(--lamp)':'var(--glow)';
    $('fi-tension').setAttribute('aria-valuenow',String(Math.round(tension)));fiText('fi-tension-value',Math.round(tension)+' / 100');
    fiText('fi-slack',FI.phase==='fishing'&&tension<=8?'{{t:fishing.msg.015}}':FI.phase==='fishing'&&tension>=88?'{{t:fishing.msg.016}}':'{{t:fishing.msg.017}}');
    var text=FI.phase==='lost'?'{{t:fishing.msg.018}}':FI.phase==='ready'?'{{t:fishing.msg.019}}':FI.mode==='struggle'?'{{t:fishing.msg.020}}':FI.mode==='warn'?'{{t:fishing.msg.021}}':FI.mode==='tired'?'{{t:fishing.msg.022}}':'{{t:fishing.msg.023}}';
    fiText('fi-signal',text);$('fi-signal').dataset.state=FI.mode;
    fiText('fi-name',fiFishName(FI.number));
  }
  function fiRound(first){
    AN.resume(FI.analytics,{stage:FI.number});FI.phase='fishing';FI.last=performance.now();fiRelease();
    if(first)fiSay('第 '+FI.number+' 條 '+fiFishName(FI.number)+' 上鉤了！按住收線，掙扎時放開；線太鬆也可能脫鉤。沒有終點，魚會一條接一條。');fiUI();fishingCanvas.focus();
  }
  function fiStart(){
    if(FI.phase==='fishing'||fiRank.busy())return;
    var stake=ENTRY_FEE;
    if(stake>S.balance){fiSay(LOW_MSG,'lose');return;}
    fiRank.start(function(random){
      FI.analytics=AN.start('fishing',stake);FI.stake=stake;FI.landed=0;FI.earned=0;FI.pops=[];FI.active=true;
      save();renderAll();
      fishingRules.create(random||Math.random,function(event){
        if(event==='land')fiLand();
        else if(event==='next')fiRound(false);
        else fiLose(event==='break'?'{{t:fishing.msg.024}}':'{{t:fishing.msg.025}}');
      },FI);
      fiRound(true);
    },fiUI);
  }
  function fiLose(reason){if(FI.phase!=='fishing')return;AN.end(FI.analytics,FI.earned,FI.earned>0?'complete':'loss',{stage:FI.number,landed_fish:FI.landed});FI.active=false;FI.phase='lost';fiRelease();fiRank.finish(FI.landed);fiSay(reason+' 本局釣到 '+FI.landed+' 條，'+(FI.earned>0?'共入帳 '+fmt(FI.earned)+' 點。':'{{t:fishing.msg.026}}'),FI.earned>0?'win':'lose');fiUI();}
  function fiAward(n,b){FI.earned+=b;S.balance+=b;save();renderAll();AN.progress(FI.analytics,{stage:n,landed_fish:n,bonus_points:b});FI.pops.push({n:n,b:b,age:0});if(FI.pops.length>3)FI.pops.shift();fiSay('釣到第 '+n+' 條！獎勵 +'+b+' 點已入帳，本局累計 +'+FI.earned+' 點。','win');}
  function fiLand(){
    if(FI.phase!=='fishing')return;
    var name=fiFishName(FI.number);AN.progress(FI.analytics,{stage:FI.number,landed_fish:FI.landed},true);fiRemember();
    var b=fiBonusAt(FI.landed);if(b)fiAward(FI.landed,b);else fiSay('釣到 '+name+'{{t:fishing.msg.027}}','win');
    FI.flash=1;
  }
  function fiSync(now){var dt=Math.max(0,(now-FI.last)/1000);FI.last=now;if(FI.phase==='fishing'&&!$('view-fishing').hidden&&!document.hidden)fiRank.update(dt*1000,()=>FI.phase==='fishing',step=>fishingRules.advance(FI,step));}
  function fiDraw(){
    var g=fishingCtx,W=520,H=560,t=FI.clock,water=198;
    g.clearRect(0,0,W,H);var sky=g.createLinearGradient(0,0,0,water);sky.addColorStop(0,'#0c2230');sky.addColorStop(1,'#1c5361');g.fillStyle=sky;g.fillRect(0,0,W,water);
    g.fillStyle='#d7e9dc';g.beginPath();g.arc(428,68,24,0,Math.PI*2);g.fill();g.fillStyle='#164353';g.beginPath();g.arc(439,61,22,0,Math.PI*2);g.fill();
    var sea=g.createLinearGradient(0,water,0,H);sea.addColorStop(0,'#12506a');sea.addColorStop(1,'#051620');g.fillStyle=sea;g.fillRect(0,water,W,H-water);
    for(var i=0;i<4;i++){g.strokeStyle=i===0?'#62e6d2':'rgba(141,176,185,.16)';g.lineWidth=i===0?2:1;g.beginPath();for(var x=0;x<=W;x+=8){var y=water+i*17+Math.sin(x/28+t*2+i)*4;if(x===0)g.moveTo(x,y);else g.lineTo(x,y);}g.stroke();}
    g.fillStyle='#173e46';g.beginPath();g.moveTo(0,170);g.lineTo(88,180);g.lineTo(128,230);g.lineTo(0,249);g.closePath();g.fill();
    g.fillStyle='#8d7254';g.fillRect(15,170,145,13);g.fillStyle='#4c433a';g.fillRect(30,183,9,67);g.fillRect(133,183,9,42);
    var ax=98,ay=146;g.strokeStyle='#ffb638';g.lineWidth=6;g.lineCap='round';g.beginPath();g.moveTo(ax-9,ay+10);g.lineTo(ax-14,169);g.moveTo(ax+5,ay+10);g.lineTo(ax+10,169);g.stroke();g.fillStyle='#ffb638';g.fillRect(ax-12,ay-26,24,36);g.fillStyle='#f5d0a9';g.beginPath();g.arc(ax,ay-39,12,0,Math.PI*2);g.fill();g.fillStyle='#62e6d2';g.fillRect(ax-15,ay-51,30,7);g.fillRect(ax-10,ay-57,21,8);
    var progress=Math.max(0,Math.min(1,1-FI.distance/FI.start));
    var fishX=410-progress*222,fishY=350-progress*103+Math.sin(t*3)*9;
    var bend=FI.tension/100*34,tipX=228-bend,tipY=69+bend;
    g.strokeStyle='#d6bd8e';g.lineWidth=4;g.beginPath();g.moveTo(110,132);g.quadraticCurveTo(176,45+Math.max(0,bend-10),tipX,tipY);g.stroke();
    g.strokeStyle=FI.tension>=88?'#ff6f61':FI.tension<=8?'#8db0b9':'#e4f2f3';g.lineWidth=1.5;g.beginPath();g.moveTo(tipX,tipY);if(FI.tension<20)g.quadraticCurveTo(fishX-70,fishY+60,fishX,fishY);else g.lineTo(fishX,fishY);g.stroke();g.lineCap='butt';
    for(var b=0;b<8;b++){var bx=(b*71+40)%500,by=H-((t*18+b*51)%300);g.strokeStyle='rgba(141,176,185,.23)';g.lineWidth=1;g.beginPath();g.arc(bx,by,2+b%3,0,Math.PI*2);g.stroke();}
    var scale=.65+Math.min(FI.number,12)*.06,colors=['#ffb638','#79c9db','#c8cf8a','#dc94b7','#83c6aa'];
        g.save();g.translate(fishX,fishY);g.scale(scale,scale);g.rotate(FI.mode==='struggle'?Math.sin(t*19)*.24:Math.sin(t*2)*.05);
    g.fillStyle=colors[(FI.number-1)%colors.length];g.beginPath();g.moveTo(32,0);g.lineTo(59,-24);g.lineTo(55,22);g.closePath();g.fill();g.beginPath();g.ellipse(0,0,40,25,0,0,Math.PI*2);g.fill();g.fillStyle='rgba(255,255,255,.26)';g.beginPath();g.ellipse(-3,9,24,11,0,0,Math.PI*2);g.fill();g.fillStyle='#e4f2f3';g.beginPath();g.arc(-22,-5,9,0,Math.PI*2);g.fill();g.fillStyle='#051620';g.beginPath();g.arc(-25,-5,4,0,Math.PI*2);g.fill();g.strokeStyle='#0c2230';g.lineWidth=2;g.beginPath();g.arc(-34,8,5,-.5,1);g.stroke();g.restore();
    if(FI.mode==='struggle'||FI.mode==='warn'){g.strokeStyle=FI.mode==='struggle'?'#ffb638':'#8db0b9';g.lineWidth=2;for(var s=0;s<5;s++){var a=s*.9+t*3;g.beginPath();g.moveTo(fishX+Math.cos(a)*57,fishY+Math.sin(a)*32);g.lineTo(fishX+Math.cos(a)*70,fishY+Math.sin(a)*43);g.stroke();}}
    g.textAlign='left';g.fillStyle='#e4f2f3';g.font='600 21px system-ui';g.fillText('{{t:fishing.msg.028}}',20,32);g.textAlign='right';g.fillStyle='#8db0b9';g.font='14px system-ui';g.fillText('第 '+FI.number+' 條 · 本局 +'+FI.earned+' 點',W-20,31);
    g.textAlign='center';g.fillStyle='#8db0b9';g.font='13px system-ui';g.fillText('{{t:fishing.msg.029}}',W/2,H-20);
    FI.pops.forEach(function(p){g.globalAlpha=Math.max(0,1-p.age/2.2);var py=130-(reduceMotion?0:Math.min(1,p.age*3)*22);g.textAlign='center';g.fillStyle='#62e6d2';g.font='700 38px system-ui';g.fillText('+'+p.b+' 點',W/2,py);g.fillStyle='#e4f2f3';g.font='600 17px system-ui';g.fillText('釣到 '+p.n+' 條里程碑',W/2,py+28);g.globalAlpha=1;});
    if(FI.phase==='lost'||FI.phase==='ready'){
      g.fillStyle='rgba(5,22,32,.88)';g.fillRect(48,389,424,103);g.fillStyle=FI.phase==='lost'?'#ff6f61':'#62e6d2';g.font='600 25px system-ui';g.fillText(FI.phase==='ready'?'{{t:fishing.msg.030}}':'{{t:fishing.msg.031}}',W/2,430);g.fillStyle='#e4f2f3';g.font='15px system-ui';g.fillText(FI.phase==='ready'?'{{t:fishing.msg.032}}':'本局釣到 '+FI.landed+' 條'+(FI.earned>0?' · 入帳 +'+FI.earned+' 點':''),W/2,465);
    }
  }
  function fiPress(e){if(e.button!==undefined&&e.button!==0)return;if(FI.phase!=='fishing'||$('view-fishing').hidden||document.hidden)return;e.preventDefault();fiSync(performance.now());if(FI.phase!=='fishing')return;fishingCanvas.focus();fishingPointers.add(e.pointerId);fiHold(true);try{e.currentTarget.setPointerCapture(e.pointerId);}catch(_){}fiUI();}
  function fiLift(e){fiSync(performance.now());fishingPointers.delete(e.pointerId);fiHold(fishingPointers.size>0||fishingKeys.size>0);}
  [fishingCanvas,$('fi-hold')].forEach(function(el){el.addEventListener('pointerdown',fiPress);['pointerup','pointercancel','lostpointercapture'].forEach(function(type){el.addEventListener(type,fiLift);});});
  $('fi-go').addEventListener('click',fiStart);
  addEventListener('keydown',function(e){if($('view-fishing').hidden||document.hidden||FI.phase!=='fishing'||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;if(['INPUT','BUTTON','A','SUMMARY'].indexOf(e.target.tagName)>=0)return;if(e.code==='Space'){e.preventDefault();fiSync(performance.now());if(FI.phase==='fishing'){fishingKeys.add(e.code);fiHold(true);}}});
  addEventListener('keyup',function(e){if(e.code!=='Space')return;if(!$('view-fishing').hidden)e.preventDefault();fiSync(performance.now());fishingKeys.delete(e.code);fiHold(fishingPointers.size>0||fishingKeys.size>0);});
  addEventListener('blur',function(){fiRelease();FI.last=performance.now();});
  document.addEventListener('visibilitychange',function(){fiRelease();FI.last=performance.now();});
  window.addEventListener('hashchange',function(){fiRelease();FI.last=performance.now();});
  function fiLoop(now){fiSync(now);FI.pops.forEach(function(p){p.age+=.016;});FI.pops=FI.pops.filter(function(p){return p.age<2.2;});if(!$('view-fishing').hidden&&!document.hidden){fiUI();fiDraw();}requestAnimationFrame(fiLoop);}
  fiUI();fiDraw();requestAnimationFrame(fiLoop);


