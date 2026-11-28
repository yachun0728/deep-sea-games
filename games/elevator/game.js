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
    $('eq-go').textContent=EQ.active?(EQ.phase==='moving'?'{{t:elevator.msg.001}}':'{{t:elevator.msg.002}}'):'{{t:elevator.msg.003}}';$('eq-go').disabled=EQ.phase==='moving'||eqRank.busy();
    $('eq-go').dataset.mode=EQ.active?'surface':'bet';
    var ahead=EQ.people.slice(EQ.passed),look=ahead.filter(p=>p.state==='look').length,warn=ahead.filter(p=>p.state==='warn').length;
    var watchText=!EQ.active?(EQ.phase==='ready'?'{{t:elevator.msg.004}}':'{{t:elevator.msg.005}}'):look?'回頭注視 '+look+' 人':warn?'警示 '+warn+' 人 · 可能隨時轉頭':'{{t:elevator.msg.006}}';
    if($('eq-watch').textContent!==watchText)$('eq-watch').textContent=watchText;
    $('eq-watch').dataset.state=look?'look':warn?'warn':'safe';
    document.querySelectorAll('[data-eq-step]').forEach(function(b){b.setAttribute('aria-current',Number(b.dataset.eqStep)===EQ.passed?'step':'false');});
  }
  function eqLose(onInput){if(!EQ.active)return;AN.end(EQ.analytics,EQ.earned,EQ.earned>0?'complete':'loss',{stage:EQ.stage,step:EQ.passed});EQ.active=false;EQ.phase='caught';EQ.moving=0;eqRank.finish(EQ.total,onInput);eqRemember();eqSay('被發現插隊！本局共插過 '+EQ.total+' 人，'+(EQ.earned>0?'入帳 '+fmt(EQ.earned)+' 點。':'{{t:elevator.msg.007}}'),EQ.earned>0?'win':'lose');eqUI();}
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
        save();renderAll();eqSay('{{t:elevator.msg.008}}');eqUI();
      },eqUI);
      return;
    }
    if(!elevatorRules.input(EQ,0))return;
    eqRank.record(0);
    if(EQ.dead){eqLose(true);return;}
    eqSay('{{t:elevator.msg.009}}');eqUI();
  }
  // Presentation only: rules, replay inputs and settlement remain in elevatorRules.
  var eqArt={},eqArtSources={},eqArtLoaded=false,eqSceneScale=1;
  var eqCast=['man','woman','umbrella','tablet','reader','backpack','bottle','briefcase','ponytail','newspaper'];
  var eqFeet={"newspaper-look":0.9775,"backpack-safe":0.9775,"backpack-warn":0.9775,"umbrella-look":0.975,"backpack-look":0.9775,"umbrella-safe":0.975,"umbrella-warn":0.975,"newspaper-warn":0.975,"newspaper-safe":0.9775,"bottle-look":0.98,"ponytail-warn":0.975,"ponytail-safe":0.975,"ponytail-look":0.975,"bottle-warn":0.9775,"bottle-safe":0.98,"man-look":0.975,"woman-look":0.975,"briefcase-warn":0.9775,"briefcase-safe":0.9775,"reader-warn":0.9775,"reader-safe":0.9775,"reader-look":0.9775,"man-warn":0.9775,"man-safe":0.975,"woman-safe":0.975,"woman-warn":0.975,"briefcase-look":0.9775,"tablet-look":0.9775,"tablet-safe":0.9775,"tablet-warn":0.975,"walk-5":0.9775,"walk-4":0.9775,"walk-3":0.9775,"walk-2":0.9775,"walk-1":0.9775,"walk-6":0.9775};
  var eqCastHeight=[184,181,180,196,185,193,189,198,177,188];
  function eqLoadArt(key,path){var img=new Image();img.decoding='async';eqArtSources[key]='games/elevator/art/'+path;eqArt[key]=img;}
  eqLoadArt('lobby','lobby-v1.webp');
  eqCast.forEach(function(person){['safe','warn','look'].forEach(function(state){eqLoadArt(person+'-'+state,person+'-'+state+'.webp');});});
  for(var eqFrame=1;eqFrame<=6;eqFrame++)eqLoadArt('walk-'+eqFrame,'step/'+eqFrame+'.webp');
  function eqPerson(x,y,state,isPlayer,index,f){
    var g=eqCtx,moving=isPlayer&&EQ.phase==='moving';
    var castIndex=(index*7+(EQ.stage-1)*3)%eqCast.length,person=eqCast[castIndex];
    var key=isPlayer?'walk-6':person+'-'+state;
    var height=(isPlayer?190:eqCastHeight[castIndex])*eqSceneScale;
    g.save();g.fillStyle='rgba(84,49,25,.17)';g.beginPath();g.ellipse(x,y+1,(isPlayer?24:21)*eqSceneScale,3.5*eqSceneScale,0,0,Math.PI*2);g.fill();
    function paint(name,alpha){
      var img=eqArt[name];if(!img||!img.complete||!img.naturalWidth)return false;
      g.save();g.globalAlpha=alpha;
      // Feet remain on the shared baseline. No elastic scaling or whole-sprite bouncing.
      g.drawImage(img,x-height*.375,y-height*eqFeet[name],height*.75,height);g.restore();return true;
    }
    var ready=eqArt[key]&&eqArt[key].complete&&eqArt[key].naturalWidth;
    if(ready){
      if(moving&&!reduceMotion){
        // Six authored poses: prepare, lift, reach, plant, recover, stand.
        // No whole-body opacity tween: preserve a solid silhouette while stepping.
        paint('walk-'+Math.min(6,1+Math.floor(f*6)),1);
      }else paint(key,1);
    }else{
      g.fillStyle=isPlayer?'#e9aa38':index%2?'#b494b2':'#507b77';g.fillRect(x-13,y-85,26,55);
      g.fillStyle='#efc29a';g.beginPath();g.arc(x,y-103,17,0,Math.PI*2);g.fill();
      g.strokeStyle='#614d40';g.lineWidth=8;g.beginPath();g.moveTo(x-7,y-30);g.lineTo(x-8,y);g.moveTo(x+7,y-30);g.lineTo(x+8,y);g.stroke();
    }
    if(!isPlayer&&state!=='safe'){
      g.fillStyle=state==='look'?'#c64b35':'#b27816';g.strokeStyle='#fff3d7';g.lineWidth=3;
      g.beginPath();g.arc(x,y-height-17,13,0,Math.PI*2);g.fill();g.stroke();
      g.fillStyle='#fff8e7';g.font='bold 19px system-ui';g.textAlign='center';g.fillText(state==='look'?'!':'?',x,y-height-10);
    }
    if(isPlayer){g.fillStyle='#fff5d9';g.strokeStyle='#765036';g.lineWidth=2;g.beginPath();g.moveTo(x-7,y-height-15);g.lineTo(x+7,y-height-15);g.lineTo(x,y-height-7);g.closePath();g.fill();g.stroke();}
    g.restore();
  }
  function eqDraw(){
    if($('view-elevator').hidden)return;
    if(!eqArtLoaded){Object.keys(eqArtSources).forEach(function(key){eqArt[key].src=eqArtSources[key];});eqArtLoaded=true;}
    var rect=eqCanvas.getBoundingClientRect(),unit=Math.max(.1,Math.min(rect.width/390,rect.height/700));
    var W=rect.width/unit,H=rect.height/unit,compact=rect.width>rect.height&&rect.height<500;
    var pixelW=Math.round(W*2),pixelH=Math.round(H*2);
    if(eqCanvas.width!==pixelW||eqCanvas.height!==pixelH){eqCanvas.width=pixelW;eqCanvas.height=pixelH;}
    var g=eqCtx,count=eqCount(),f=EQ.phase==='moving'?1-EQ.moving/EQ.duration:0;
    var travel=EQ.passed+f,spacing=86;
    var camera=Math.max(0,Math.min(travel*spacing,Math.max(0,(count+1)*spacing-(W-58))));
    var playerX=58+travel*spacing-camera;
    var floorY=Math.min(H*.68,(rect.height-(compact?100:210))/unit-46);
    g.setTransform(2,0,0,2,0,0);g.clearRect(0,0,W,H);g.fillStyle='#f1d5ae';g.fillRect(0,0,W,H);
    var bg=eqArt.lobby;
    if(bg.complete&&bg.naturalWidth){
      // One background covers the entire viewport. Grounding follows its actual floor seam.
      var scale=Math.max(W/bg.naturalWidth,H/bg.naturalHeight,floorY/(bg.naturalHeight*.67),(H-floorY)/(bg.naturalHeight*.33)),bw=bg.naturalWidth*scale,bh=bg.naturalHeight*scale;
      var by=Math.max(H-bh,Math.min(0,floorY-bg.naturalHeight*.67*scale));
      g.drawImage(bg,(W-bw)/2,by,bw,bh);
      floorY=by+bg.naturalHeight*.67*scale;
    }
    var baseY=floorY+28;
    eqSceneScale=Math.min(1.22,Math.max(.18,(baseY-(compact?110:190)/unit)/198));
    var people=EQ.people.length?EQ.people:Array.from({length:count},function(_,i){return {index:i,state:'safe'};});
    // People already passed stay in the queue behind the player, never turn into ghosts.
    people.forEach(function(p,i){
      var slot=i+.65,x=58+slot*spacing-camera;
      if(x<-70||x>W+70)return;
      eqPerson(x,baseY,p.state,false,i,0);
    });
    eqPerson(playerX,baseY+18,'safe',true,0,f);
    // The HUD floats above the full-bleed scene; its screen size stays stable on desktop.
    var hudWidth=Math.min(W-32,358/unit),hudX=(W-hudWidth)/2,hudY=(compact?64:120)/unit;
    g.fillStyle='rgba(255,248,231,.94)';g.beginPath();g.roundRect(hudX,hudY,hudWidth,(compact?36:64)/unit,16/unit);g.fill();
    g.fillStyle='#65442f';g.font='bold '+(14/unit)+'px system-ui';g.textAlign='center';
    if(!compact)g.fillText(EQ.passed+' / '+count,W/2,hudY+23/unit);
    var dotStep=Math.min(24/unit,(hudWidth-32/unit)/count),start=W/2-(count-1)*dotStep/2;
    people.forEach(function(p,i){g.fillStyle=i<EQ.passed?'#bcb09b':p.state==='look'?'#c64b35':p.state==='warn'?'#bd851d':'#4c7770';g.beginPath();g.arc(start+i*dotStep,hudY+(compact?18:44)/unit,(count>20?3.8:5)/unit,0,Math.PI*2);g.fill();});
    if(EQ.phase==='caught'){
      var cw=Math.min(W-32,318/unit),cx=(W-cw)/2,cy=hudY+(compact?44:76)/unit;
      g.fillStyle='rgba(255,245,223,.97)';g.strokeStyle='#a4553c';g.lineWidth=2/unit;g.beginPath();g.roundRect(cx,cy,cw,90/unit,18/unit);g.fill();g.stroke();
      g.textAlign='center';g.fillStyle='#b44530';g.font='bold '+24/unit+'px system-ui';g.fillText('{{t:elevator.msg.019}}',W/2,cy+37/unit);
      g.fillStyle='#684c38';g.font=17/unit+'px system-ui';g.fillText('Queue Cutter · '+EQ.total,W/2,cy+67/unit);
    }
  }
  $('eq-go').addEventListener('click',eqAction);
  eqCanvas.addEventListener('pointerdown',function(e){if(!EQ.active)return;e.preventDefault();eqAction();});
  document.addEventListener('keydown',function(e){if($('view-elevator').hidden||document.hidden||e.code!=='Space'||e.repeat||e.ctrlKey||e.altKey||e.metaKey)return;if(['INPUT','BUTTON','A','SUMMARY'].indexOf(e.target.tagName)>=0)return;e.preventDefault();if(EQ.active)eqAction();});
  document.addEventListener('visibilitychange',function(){EQ.last=performance.now();});
  function eqLoop(now){eqSync(now);EQ.pops.forEach(function(p){p.age+=.016;});EQ.pops=EQ.pops.filter(function(p){return p.age<2.2;});if(!$('view-elevator').hidden&&!document.hidden){EQ.show=now/1000;eqUI();eqDraw();}requestAnimationFrame(eqLoop);}
  eqUI();eqDraw();requestAnimationFrame(eqLoop);

