  /* ---------- Frontier Islands ---------- */
  var frontierBusy=false,frontierRoute;
  (function(){
    'use strict';
    {{include:games/frontier/world.js}}
    {{include:games/frontier/draw.js}}
    var canvas=$('ft-canvas'),ctx=canvas.getContext('2d'),world=null;
    var paid=false,cleared=0,paused=true,round=null,visible=false,last=0,saveAt=0,uiAt=0,pendingLevel=0;
    var keys={},stick={x:0,y:0,id:null},dash=false,walkTarget=null,viewCamera=null;
    var zones=['翠葉群島','斷崖海岸','荊棘森林','寒霜高地','熔火遺跡'];
    var labels={camp:'營地',mill:'木材廠',forge:'鐵匠鋪',bridge:'橋樑',tower:'箭塔',beacon:'燈塔',barracks:'戰士小屋',house:'工人小屋',market:'市集',quarry:'採石場',depot:'前線分倉'};
    /* Every requirement for lighting the beacon, in the order a player should tackle them. */
    function stageSteps(w){
      if(w.cfg.war){var eb=w.enemyBase,barracks=w.buildings.find(function(b){return b.kind==='barracks';}),trained=frontierAttackers(w).length+(barracks&&barracks.queue||0);
        var towersBuilt=w.buildings.filter(function(b){return b.kind==='tower'&&b.built&&b.hp>0;}).length,towersNeeded=w.cfg.towers;
        return [[towersBuilt>=towersNeeded,'建造箭塔守護大本營 '+towersBuilt+'/'+towersNeeded],[frontierBuilt(w,'bridge'),'建造橋樑'],[frontierBuilt(w,'barracks'),'過橋建造戰士營'],[frontierAttackers(w).length>=3||eb.hp<=0,'走到戰士營自動訓練戰士 '+Math.min(trained,frontierFighterCap(w))+'/'+frontierFighterCap(w)+'（至少 3 名）'],[eb.hp<=0,'戰士摧毀對手大本營 '+Math.max(0,Math.ceil(eb.hp/eb.maxHp*100))+'%']];}
      var c=w.cfg,m=c.mission,steps=[],camps=(w.camps||[]).filter(function(k){return k.hp>0;}).length,need=Math.ceil(c.enemies*(m==='build'?.65:1));
      if(m==='rescue')steps.push([w.rescued>=2,'救出被困工人 '+Math.min(2,w.rescued)+'/2']);
      else if(m==='defend')steps.push([frontierGoal(w),'守住據點 '+Math.min(w.wave,c.waves)+'/'+c.waves]);
      else if(m==='elite')steps.push([frontierGoal(w),'擊敗精英守衛']);
      else if(m==='boss')steps.push([frontierGoal(w),'擊敗區域首領']);
      else steps.push([frontierGoal(w),(m==='hunt'?'消滅守衛 ':'擊退敵人 ')+Math.min(w.kills,need)+'/'+need]);
      ['house','market','mill'].concat(c.chapter>0?['depot']:[]).forEach(function(k){steps.push([frontierBuilt(w,k),'建造'+labels[k]]);});
      if((w.camps||[]).length)steps.push([camps===0,'摧毀敵營 剩 '+camps]);
      steps.push([w.siege.wave>=c.assaultWaves&&!w.enemies.some(function(e){return e.assault&&e.hp>0;}),'擋下敵襲 '+Math.min(w.siege.wave,c.assaultWaves)+'/'+c.assaultWaves]);
      steps.push([frontierBuilt(w,'beacon'),'點亮燈塔（走到東側燈塔投入材料）']);
      return steps;
    }
    function warTip(w){return w.cfg.war?'\n\n提示：箭塔會守護大本營，但也會被怪攻擊，受損後靠近用木材修復。主角不能攻擊對手大本營，只有戰士可以。':'';}
    var cardsShown='';
    function renderCards(w){
      var offer=world&&world.offer,box=$('ft-cards');
      if(!offer){if(!box.hidden)box.hidden=true;cardsShown='';return;}
      var key=offer.join(',')+':'+world.level;
      if(cardsShown!==key){
        cardsShown=key;release();
        for(var i=0;i<3;i++){var card=FRONTIER_CARDS.find(function(c){return c.id===offer[i];}),btn=$('ft-card-'+i);btn.hidden=!card;if(!card)continue;var lv=world.tech[card.key]|0;set('ft-card-'+i+'-name',card.name);set('ft-card-'+i+'-lv','Lv.'+lv+' → Lv.'+(lv+1));set('ft-card-'+i+'-desc',card.desc);}
      }
      if(box.hidden)box.hidden=false;
    }
    function stageList(steps){return steps.map(function(t){return (t[0]?'✓ ':'○ ')+t[1];}).join('\n');}
    var missions={build:'建立據點，清除守衛，點亮燈塔。',rescue:'救出兩位工人，再點亮燈塔。',hunt:'擊敗所有守衛，再點亮燈塔。',defend:'建造箭塔，抵擋所有波次，再點亮燈塔。',elite:'擊敗精英守衛，再點亮燈塔。',boss:'擊敗區域首領，再點亮燈塔。'};
    function set(id,text){var e=$(id);if(window.deepSeaI18n.sourceText(e)!==String(text))e.textContent=text;}
    function safeNumbers(v){if(typeof v==='number')return Number.isFinite(v)&&Math.abs(v)<1e7;if(Array.isArray(v))return v.length<400&&v.every(safeNumbers);if(v&&typeof v==='object')return Object.values(v).every(safeNumbers);return true;}
    function validShape(v,s){if(typeof v!==typeof s||v===null)return false;if(Array.isArray(s))return Array.isArray(v)&&v.length>=s.length&&(!s.length||v.every(function(x){return validShape(x,s[0]);}));if(typeof s==='object')return Object.keys(s).every(function(k){return validShape(v[k],s[k]);});return true;}
    function loadFrontier(){
      try{
        var data=JSON.parse(localStorage.getItem('deep-sea-frontier-v1')||'null');if(!data||data.version!==1)return;
        paid=data.paid===true;cleared=Number.isInteger(data.cleared)?Math.max(0,Math.min(50,data.cleared)):0;var w=data.world;
        if(w&&Number.isInteger(w.level)&&w.level>=1&&w.level<=Math.min(50,cleared+1)&&safeNumbers(w)){
          var sample=frontierWorld(w.level),legacyKeys=['version','level','time','phase','p','bag','bank','nodes','enemies','shots','effects','kills','rescued','hold','wave','waveAt','heal','worker','threat','buildings','cages','tech'];
          var shape={};legacyKeys.forEach(function(k){shape[k]=sample[k];});shape.nodes=[];shape.enemies=[];shape.shots=[];shape.effects=[];shape.buildings=[];shape.tech={tool:0,blade:0,pack:0};
          var valid=validShape(w,shape)&&w.nodes.length>=62&&w.nodes.length<=400&&w.buildings.length>=6&&w.buildings.length<=18&&w.cages.length===2&&w.enemies.length<=100&&w.enemies.every(function(e){return validShape(e,sample.enemies[0]);})&&w.shots.every(function(s){return ['x','y','vx','vy','t'].every(function(k){return typeof s[k]==='number';});})&&['play','clear','dead'].includes(w.phase)&&['tool','blade','pack'].every(function(k){return Number.isInteger(w.tech[k])&&w.tech[k]>=0&&w.tech[k]<=8;})&&w.nodes.every(function(n){return validShape(n,sample.nodes[0])&&['wood','stone'].includes(n.kind)&&n.left>=0&&n.left<=6;})&&w.buildings.every(function(b,i){return sample.buildings[i]&&b.kind===sample.buildings[i].kind&&validShape(b,{kind:'',x:0,y:0,built:false,wood:0,stone:0});});
          if(valid&&(!w.siege||validShape(w.siege,{wave:0,next:0}))&&(!w.fighters||Array.isArray(w.fighters)&&w.fighters.length<=40&&w.fighters.every(function(a){return validShape(a,{x:0,y:0,hp:0,max:0,attack:0});}))&&(!w.supplies||Array.isArray(w.supplies)&&w.supplies.length<=200&&w.supplies.every(function(d){return validShape(d,{x:0,y:0,kind:'',amount:0,wait:0})&&['wood','stone'].includes(d.kind)&&d.amount>0;}))&&(!w.workers||Array.isArray(w.workers)&&w.workers.length<=6&&w.workers.every(function(a){return validShape(a,{x:0,y:0,wood:0,stone:0,target:0,t:0,mode:''});}))&&(!w.drops||Array.isArray(w.drops)&&w.drops.length<=100&&w.drops.every(function(d){return validShape(d,{x:0,y:0,amount:0});}))&&(!w.camps||Array.isArray(w.camps)&&w.camps.length<=3&&w.camps.every(function(c){return validShape(c,{x:0,y:0,hp:0,maxHp:0,cool:0});})))world=frontierMigrate(w);
        }
        if(paid&&!world){var keep=w&&w.tech&&['tool','blade','pack'].every(function(k){return Number.isInteger(w.tech[k])&&w.tech[k]>=0&&w.tech[k]<=8;})?{tool:w.tech.tool,blade:w.tech.blade,pack:w.tech.pack}:undefined,gold=w&&Number.isFinite(w.coins)?Math.max(0,Math.min(1e6,Math.floor(w.coins))):0,lvl=w&&Number.isInteger(w.level)&&w.level>=1&&w.level<=Math.min(50,cleared+1)?w.level:Math.min(50,cleared+1);world=frontierWorld(lvl,keep,gold);set('ft-storage','存檔內容不完整，已保留遠征資格與通關紀錄，重建當關。');}
      }catch(e){set('ft-storage','無法讀取存檔；請確認瀏覽器允許本機儲存。');}
    }
    function persist(){if(!paid||!world)return true;try{localStorage.setItem('deep-sea-frontier-v1',JSON.stringify({version:1,paid:true,cleared:cleared,world:world}));set('ft-storage','進度已儲存');return true;}catch(e){set('ft-storage','無法儲存進度，請勿關閉此頁。');return false;}}
    function params(){return {stage:world.level,step:world.kills,chapter:world.cfg.chapter+1,mission:world.cfg.mission};}
    function release(){keys={};stick.x=stick.y=0;stick.id=null;dash=false;walkTarget=null;$('ft-knob').style.transform='';}
    function endRound(result){if(round){AN.end(round,0,result,params());round=null;}}
    function pause(){if(!world||paused||world.phase!=='play')return;paused=true;frontierBusy=!!round;release();AN.progress(round,params(),true);persist();update();}
    function start(){
      if(!visible||document.hidden||!paused&&world&&world.phase==='play')return;
      autoScreen();if(!paid)loadFrontier();
      var fresh=false;
      if(!paid){
        world=frontierWorld(1);paid=true;persist();
        round=AN.start('frontier',0,params());fresh=true;
      }else if(!world)world=frontierWorld(Math.min(50,cleared+1));
      else if(world.phase==='dead')world=frontierWorld(world.level,Object.assign({},world.tech),world.coins);
      else if(world.phase==='clear')world=frontierWorld(world.level===50?1:world.level+1,Object.assign({},world.tech),world.coins);
      if(!fresh){if(round)AN.resume(round,params());else round=AN.start('frontier',0,params());}
      paused=false;frontierBusy=true;release();last=performance.now();persist();update();canvas.focus({preventScroll:true});syncViewport();
    }
    function selectLevel(n){if(!paid||n>Math.min(50,cleared+1))return;pause();pendingLevel=n;set('ft-select-label','前往關卡 '+n+'？');$('ft-select').hidden=false;}
    function updateMap(){Array.from($('ft-map').children).forEach(function(b,i){b.disabled=!paid||i+1>Math.min(50,cleared+1);var cl=(i+1<=cleared?'ft-done ':'')+(world&&world.level===i+1?'ft-current':'');if(b.className!==cl)b.className=cl;var current=world&&world.level===i+1?'step':'false';if(b.getAttribute('aria-current')!==current)b.setAttribute('aria-current',current);});}
    function update(){
      var w=world||preview,overlay=$('ft-overlay');var cost=frontierRecruitCost(w),barracks=w.buildings.find(function(b){return b.kind==='barracks';});set('ft-recruit','訓練戰士 · 🪵 '+cost.wood+' ◆ '+cost.stone+' · '+frontierAttackers(w).length+'/'+frontierFighterCap(w));$('ft-recruit').disabled=!world||paused||!barracks||!barracks.built||barracks.hp<=0||!frontierNear(w.p,barracks,110);set('ft-army','戰士 '+frontierAttackers(w).length+' · 守衛 '+(w.fighters.length-frontierAttackers(w).length)+' · 訓練中 '+(barracks&&barracks.queue||0));set('ft-journal-stock','倉庫 🪵 '+w.bank.wood+' · ◆ '+w.bank.stone+' · 工人 '+w.workers.length);set('ft-zone',zones[w.cfg.chapter]);set('ft-level',w.level+' / 50');set('ft-health','♥ '+Math.ceil(w.p.hp));set('ft-base-health','大本營 '+Math.ceil(w.buildings[0].hp)+'/'+w.buildings[0].maxHp);set('ft-assault','第 '+Math.min(w.siege.wave,w.cfg.assaultWaves)+'/'+w.cfg.assaultWaves+' 波 · 下一波 '+Math.ceil(w.siege.next)+'s');
      var steps=stageSteps(w),doneCount=steps.filter(function(t){return t[0];}).length,nextStep=steps.find(function(t){return !t[0];}),objective=frontierBuilt(w,'beacon')?'島嶼已開拓，可繼續採集或前往下一島。':(nextStep?'本關 '+doneCount+'/'+steps.length+' · 下一步：'+nextStep[1]:'本關任務完成');
      set('ft-objective',objective);set('ft-bag','背包 '+(w.bag.wood+w.bag.stone)+'/'+frontierCapacity(w)+' · 🪵 '+w.bag.wood+' · ◆ '+w.bag.stone);set('ft-stock','倉庫 '+'🪵 '+w.bank.wood+' · ◆ '+w.bank.stone);set('ft-record',cleared+' / 50');set('ft-building-effects',(frontierBuilt(w,'mill')?'木材廠：伐木 +1、工具上限 8、伐木工 +1。':'木材廠：建造後強化伐木，解鎖工具上限。')+' '+(frontierBuilt(w,'quarry')?'採石場：採石 +1、背包 +12、背包上限 8、採石工 +1。':'採石場：建造後增加背包容量與採石工。')+' '+(frontierBuilt(w,'forge')?'鐵匠鋪：攻擊 +9、武器上限 8、解除寒霜減速。':'鐵匠鋪：建造後強化攻擊，解鎖武器上限。'));set('ft-coins','金幣 '+w.coins+'/'+frontierPickCost(w));renderCards(w);set('ft-workers','工人 '+w.workers.length);set('ft-hauling','搬運中 '+w.workers.reduce(function(n,a){return n+a.wood+a.stone;},0)+' · 地面資源 '+w.supplies.reduce(function(n,d){return n+d.amount;},0));set('ft-checklist',stageList(steps));
      set('ft-warning',w.siege.next<12?'敵襲倒數 '+Math.ceil(w.siege.next)+'s':'靠近資源採集，靠近地基建造');
      $('ft-next').hidden=!world||!frontierBuilt(w,'beacon');$('ft-next').disabled=paused;set('ft-full',document.fullscreenElement||$('ft-main').classList.contains('ft-immersive')?'退出全螢幕':'全螢幕');
      var market=w.buildings.find(function(b){return b.kind==='market';}),atMarket=market&&market.built&&market.hp>0&&frontierNear(w.p,market,100);
      ['wood','stone'].forEach(function(k){$('ft-sell-'+k).disabled=!world||paused||!atMarket||w.bank[k]<Number($('ft-sale-count').value||10);});
      set('ft-dash',w.p.dash>0?'衝刺 '+w.p.dash.toFixed(1):'衝刺');$('ft-dash').disabled=paused||w.p.dash>0;$('ft-pause').disabled=!world||w.phase!=='play';set('ft-pause',paused?'繼續':'暫停');
      ['tool','blade','pack'].forEach(function(k,i){var n=w.tech[k],limit=frontierUpgradeLimit(w,k),cost=frontierUpgradeCost(w,k);set('ft-'+k,['採集工具','戰鬥武器','背包容量'][i]+' Lv.'+n+'/'+limit+(n>=limit?' · MAX':' · 金幣 '+cost));$('ft-'+k).disabled=!world||paused||!frontierNear(w.p,w.buildings[0],100)||n>=limit;});
      overlay.hidden=!!world&&!paused&&w.phase==='play';
      if(!overlay.hidden){
        var title='荒島遠征',message='五大區域，五十場考驗。建立據點，穿越危險地帶。\n\n本關任務\n'+stageList(steps)+warTip(w),button='免費開始遠征';
        if(world){if(w.phase==='dead'){title=w.failure==='base'?'大本營失守':'遠征失敗';message='科技升級保留。調整建造順序，利用預告閃避攻擊。\n\n本關任務\n'+stageList(steps)+warTip(w);button='免費重試當關';}else if(w.phase==='clear'){title=w.level===50?'五十關全破！':w.cfg.war?'對手大本營已摧毀':'燈塔已點亮';message='科技已保存，下一關將建立新的據點。';button=w.level===50?'重遊群島 · 免費':'下一關 · 免費';}else{title='遠征已暫停';message='進度已保留，準備好再繼續。\n\n本關任務\n'+stageList(steps)+warTip(w);button='繼續遠征 · 免費';}}
        set('ft-title',title);if(!transientMessage)set('ft-message',message);set('ft-go',button);
      }updateMap();
    }
    var transientMessage=false;
    function finishStage(){if(world.phase==='clear'){cleared=Math.max(cleared,world.level);AN.progress(round,params(),true);endRound('complete');}else endRound('loss');paused=true;frontierBusy=false;release();persist();update();}
    function frame(now){if(visible){if(world&&!paused&&world.phase==='play'){
      var x=stick.x+(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),y=stick.y+(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
      if(x||y)walkTarget=null;
      if(walkTarget&&!x&&!y){var destination=frontierWaypoint(world.p,walkTarget);var distance=Math.hypot(destination.x-world.p.x,destination.y-world.p.y);if(distance>8){x=(destination.x-world.p.x)/distance;y=(destination.y-world.p.y)/distance;}else if(destination===walkTarget)walkTarget=null;}
      frontierStep(world,{x:x,y:y,dash:dash},Math.min(.05,(now-last)/1000));dash=false;if(world.phase!=='play')finishStage();else if(now-saveAt>5000){persist();saveAt=now;}
    }if(now-uiAt>180){update();uiAt=now;}paint();}last=now;requestAnimationFrame(frame);}
    $('ft-go').addEventListener('click',function(){transientMessage=false;start();if(!world)transientMessage=true;});$('ft-pause').addEventListener('click',function(){if(paused)start();else pause();});
    ['tool','blade','pack'].forEach(function(k){$('ft-'+k).addEventListener('click',function(){if(world&&!paused){var ok=frontierUpgrade(world,k);set('ft-upgrade',ok?'升級完成':'材料不足，或需要回到營地。');if(ok){AN.progress(round,params(),false);persist();}update();}});});
    $('ft-select-yes').addEventListener('click',function(){if(!pendingLevel)return;endRound('restart');world=frontierWorld(pendingLevel,world?Object.assign({},world.tech):undefined,world?world.coins:0);pendingLevel=0;$('ft-select').hidden=true;paused=true;frontierBusy=false;persist();update();});$('ft-select-no').addEventListener('click',function(){pendingLevel=0;$('ft-select').hidden=true;});
    for(var n=1;n<=50;n++){var b=document.createElement('button');b.type='button';b.textContent=n;b.dataset.level=n;b.addEventListener('click',function(){selectLevel(Number(this.dataset.level));});$('ft-map').appendChild(b);}
    document.addEventListener('keydown',function(e){var k=e.key.toLowerCase();if(!visible||paused||(e.target.closest&&e.target.closest('input,select,textarea,button'))||!['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))return;e.preventDefault();keys[k]=true;if(k===' '&&!e.repeat)dash=true;AN.interact();});document.addEventListener('keyup',function(e){delete keys[e.key.toLowerCase()];});
    var pad=$('ft-stick');function moveStick(e){if(e.pointerId!==stick.id)return;var r=pad.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,len=Math.max(32,Math.hypot(x,y));stick.x=x/len;stick.y=y/len;$('ft-knob').style.transform='translate('+(stick.x*32)+'px,'+(stick.y*32)+'px)';AN.interact();}
    pad.addEventListener('pointerdown',function(e){if(paused||stick.id!==null)return;stick.id=e.pointerId;pad.setPointerCapture(e.pointerId);moveStick(e);e.preventDefault();});pad.addEventListener('pointermove',moveStick);['pointerup','pointercancel','lostpointercapture'].forEach(function(type){pad.addEventListener(type,function(e){if(stick.id===e.pointerId){stick.id=null;stick.x=stick.y=0;$('ft-knob').style.transform='';}});});
    $('ft-dash').addEventListener('pointerdown',function(e){e.preventDefault();if(!paused){dash=true;AN.interact();}});
    function isHandheld(){return !!(window.matchMedia&&(window.matchMedia('(max-width: 600px)').matches||window.matchMedia('(pointer: coarse)').matches&&window.matchMedia('(max-width: 1100px)').matches));}
    function autoScreen(){if(isHandheld())enterScreen();}
    function screenClass(active){if(document.documentElement){if(active)document.documentElement.classList.add('frontier-immersive');else document.documentElement.classList.remove('frontier-immersive');}}
    function syncViewport(){
      var main=$('ft-main'),vv=window.visualViewport;
      if(main.style.setProperty){main.style.setProperty('--ft-visible-height',(vv?vv.height:window.innerHeight)+'px');main.style.setProperty('--ft-visible-top',(vv?vv.offsetTop:0)+'px');}
      if(window.innerHeight&&window.innerWidth>window.innerHeight&&window.innerHeight<=500)main.classList.add('ft-short');else main.classList.remove('ft-short');
    }
    function enterScreen(){
      var main=$('ft-main');screenClass(true);syncViewport();if(document.fullscreenElement||main.classList.contains('ft-immersive')){return;}
      function fallback(){main.classList.add('ft-immersive');syncViewport();}
      if(main.requestFullscreen){try{var result=main.requestFullscreen();if(result&&result.then)result.then(syncViewport,fallback);}catch(e){fallback();}}
      else fallback();
    }
    function exitScreen(){if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(function(){});$('ft-main').classList.remove('ft-immersive');screenClass(false);}
    if(window.visualViewport){window.visualViewport.addEventListener('resize',syncViewport);window.visualViewport.addEventListener('scroll',syncViewport);}
    window.addEventListener('resize',syncViewport);window.addEventListener('orientationchange',syncViewport);
    document.addEventListener('fullscreenchange',function(){if(!document.fullscreenElement&&!$('ft-main').classList.contains('ft-immersive')){screenClass(false);}syncViewport();});
    $('ft-full').addEventListener('click',function(){if(document.fullscreenElement||$('ft-main').classList.contains('ft-immersive'))exitScreen();else enterScreen();});
    $('ft-stage').addEventListener('click',function(e){if(e.target!==canvas&&!(e.target.closest&&e.target.closest('#ft-overlay')))return;if(e.target.closest&&e.target.closest('button,summary,details,a'))return;if(paused){start();}});
    canvas.addEventListener('pointerdown',function(e){if(paused)return;var r=canvas.getBoundingClientRect();if(viewCamera)walkTarget={x:(e.clientX-r.left)/viewCamera.scale+viewCamera.left,y:(e.clientY-r.top)/viewCamera.scale+viewCamera.top};if(walkTarget&&walkTarget.x>552&&walkTarget.x<678){walkTarget.x=walkTarget.x<615?530:700;}AN.interact();});
    function showShop(open){$('ft-shop').hidden=!open;$('ft-shop-toggle').setAttribute('aria-expanded',String(open));if(open)$('ft-main').classList.add('ft-shop-open');else $('ft-main').classList.remove('ft-shop-open');release();if(!open)canvas.focus({preventScroll:true});}
    $('ft-journal').addEventListener('click',function(){var open=$('ft-task-details').hidden;$('ft-task-details').hidden=!open;this.setAttribute('aria-expanded',String(open));release();});
    $('ft-shop-toggle').addEventListener('click',function(){showShop($('ft-shop').hidden);});
    $('ft-shop-close').addEventListener('click',function(){showShop(false);});
    ['wood','stone'].forEach(function(k){$('ft-sell-'+k).addEventListener('click',function(){if(!world||paused)return;var sold=frontierSell(world,k,Number($('ft-sale-count').value||10));set('ft-upgrade',sold?'交易完成':'需要市集、倉庫材料與靠近市集');if(sold)persist();update();});});
    for(var ci=0;ci<3;ci++)(function(n){$('ft-card-'+n).addEventListener('click',function(){if(world&&frontierChoose(world,n)){persist();update();$('ft-canvas').focus({preventScroll:true});}});})(ci);
    $('ft-recruit').addEventListener('click',function(){if(world&&!paused){var recruited=frontierRecruit(world);set('ft-upgrade',recruited?'戰士訓練中':'需要戰士小屋、足夠材料與空位');if(recruited)persist();update();}});
    $('ft-next').addEventListener('click',function(){if(world&&!paused&&frontierLeave(world))finishStage();});
    $('ft-home').addEventListener('click',function(){if(world&&!paused){walkTarget={x:180,y:450};AN.interact();}});
    document.addEventListener('visibilitychange',function(){if(document.hidden)pause();});window.addEventListener('blur',pause);window.addEventListener('pagehide',function(e){pause();if(!e.persisted)endRound('abandoned');},{capture:true});
    frontierRoute=function(active){if(!active){pause();exitScreen();}visible=active;if(active){update();paint();}};
    var preview=frontierWorld(1);loadFrontier();update();requestAnimationFrame(frame);
  })();
