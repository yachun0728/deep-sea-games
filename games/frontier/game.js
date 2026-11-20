  /* ---------- Frontier Islands ---------- */
  var frontierBusy=false,frontierRoute;
  (function(){
    'use strict';
    {{include:games/frontier/world.js}}
    {{include:shared/frontier-rules.cjs}}
    {{include:games/frontier/draw.js}}
    var canvas=$('ft-canvas'),ctx=canvas.getContext('2d'),world=null;
    var paid=false,cleared=0,paused=true,round=null,visible=false,last=0,saveAt=0,uiAt=0,pendingLevel=0;
    var keys={},stick={x:0,y:0,id:null},dash=false,walkTarget=null,viewCamera=null;
    var zones=['{{t:frontier.msg.001}}','{{t:frontier.msg.002}}','{{t:frontier.msg.003}}','{{t:frontier.msg.004}}','{{t:frontier.msg.005}}'];
    var labels={camp:'{{t:frontier.msg.006}}',guardhouse:'{{t:frontier.msg.007}}',warehouse:'{{t:frontier.msg.008}}',mill:'{{t:frontier.msg.009}}',forge:'{{t:frontier.msg.010}}',bridge:'{{t:frontier.msg.011}}',tower:'{{t:frontier.msg.012}}',beacon:'{{t:frontier.msg.013}}',barracks:'{{t:frontier.msg.014}}',house:'{{t:frontier.msg.015}}',market:'{{t:frontier.msg.016}}',quarry:'{{t:frontier.msg.017}}',depot:'{{t:frontier.msg.018}}'};
    /* Every requirement for lighting the beacon, in the order a player should tackle them. */
    function stageSteps(w){
      if(w.cfg.war){var eb=w.enemyBase,barracks=w.buildings.find(function(b){return b.kind==='barracks';}),trained=frontierAttackers(w).length+(barracks&&barracks.queue||0);
        var towersBuilt=w.buildings.filter(function(b){return b.kind==='tower'&&b.built&&b.hp>0;}).length,towersNeeded=w.cfg.towers;
        return [[towersBuilt>=towersNeeded,'建造箭塔守護大本營 '+towersBuilt+'/'+towersNeeded],[frontierBuilt(w,'bridge'),'{{t:frontier.msg.019}}'],[frontierBuilt(w,'barracks'),'{{t:frontier.msg.020}}'],[frontierAttackers(w).length>=3||eb.hp<=0,'走到戰士營自動訓練戰士 '+Math.min(trained,frontierFighterCap(w))+'/'+frontierFighterCap(w)+'{{t:frontier.msg.021}}'],[eb.hp<=0,'戰士摧毀對手大本營 '+Math.max(0,Math.ceil(eb.hp/eb.maxHp*100))+'%']];}
      var c=w.cfg,m=c.mission,steps=[],camps=(w.camps||[]).filter(function(k){return k.hp>0;}).length,need=Math.ceil(c.enemies*(m==='build'?.65:1));
      if(m==='rescue')steps.push([w.rescued>=2,'救出被困工人 '+Math.min(2,w.rescued)+'/2']);
      else if(m==='defend')steps.push([frontierGoal(w),'守住據點 '+Math.min(w.wave,c.waves)+'/'+c.waves]);
      else if(m==='elite')steps.push([frontierGoal(w),'{{t:frontier.msg.022}}']);
      else if(m==='boss')steps.push([frontierGoal(w),'{{t:frontier.msg.023}}']);
      else steps.push([frontierGoal(w),(m==='hunt'?'消滅守衛 ':'擊退敵人 ')+Math.min(w.kills,need)+'/'+need]);
      ['house','market','mill'].concat(c.chapter>0?['depot']:[]).forEach(function(k){steps.push([frontierBuilt(w,k),'{{t:frontier.msg.024}}'+labels[k]]);});
      if((w.camps||[]).length)steps.push([camps===0,'摧毀敵營 剩 '+camps]);
      steps.push([w.siege.wave>=c.assaultWaves&&!w.enemies.some(function(e){return e.assault&&e.hp>0;}),'擋下敵襲 '+Math.min(w.siege.wave,c.assaultWaves)+'/'+c.assaultWaves]);
      steps.push([frontierBuilt(w,'beacon'),'{{t:frontier.msg.025}}']);
      return steps;
    }
    function warTip(w){return w.cfg.war?'\n\n提示：箭塔會守護大本營，但也會被怪攻擊，受損後靠近用木材修復。主角不能攻擊對手大本營，只有戰士可以。守備營在大本營旁訓練守衛，橋東的戰士營訓練進攻戰士，站在戰士營、守備營或工人小屋旁可花資源升級，最高到滿級；敵人偶爾會來攻擊戰士營，最多把它打回最低級。木材廠、採石場、倉庫蓋好後會增加背包容量。工人小屋的村民會自動砍樹採石，把資源丟在地上，走過去就能撿起來。':'';}

    var ranking=null,rankStarting=false,rankSending=false,rankActions=[],rankTicks=0,rankCarry=0,rankDirection=-1,rankPending=null,localJourney=null;
    function rankStatus(message,retry){set('ft-rank-status',message);$('ft-rank-retry').hidden=!retry;}
    function recordRank(code){if(ranking)rankActions.push(rankTicks*frontierRules.INPUTS+code);}
    async function uploadRank(){
      if(!ranking||rankSending)return;
      if(!rankPending){
        if(!rankTicks&&!rankActions.length)return;
        rankPending={id:ranking.id,gameId:'frontier',revision:ranking.revision,action:[rankTicks,...rankActions]};
      }
      rankSending=true;
      var resume=!paused;paused=true;rankStatus('{{t:frontier.msg.026}}');
      try{
        var api=await import('./frontend/services/api.mjs');
        var next=await api.moveBoardRound(ranking.token,rankPending,AbortSignal.timeout(15000));
        if(next.revision!==ranking.revision+1)throw new Error('invalid_replay');
        ranking.revision=next.revision;ranking.serverState=next.state;
        rankActions=[];rankTicks=0;rankPending=null;
        rankStatus(next.state.completed?'{{t:frontier.msg.027}}':'{{t:frontier.msg.028}}');
        if(resume&&visible&&!document.hidden&&world.phase==='play')paused=false;
      }catch(error){rankStatus('{{t:frontier.msg.029}}',true);}
      finally{rankSending=false;last=performance.now();update();}
    }
    async function startRanked(){
      if(rankStarting||rankSending||rankPending)return;
      if(ranking){if(paused)start();return;}
      pause();endRound('abandoned');rankStarting=true;rankStatus('{{t:frontier.msg.030}}');
      try{
        var api=await import('./frontend/services/api.mjs');
        var next=await api.startBoardRound('frontier',AbortSignal.timeout(10000));
        if(!localJourney)localJourney={world:world,paid:paid,cleared:cleared};
        ranking=next;ranking.serverState=next.state;ranking.sim=next.state;
        world=next.state.world;cleared=next.state.completed;paid=true;
        rankActions=[];rankTicks=0;rankPending=null;rankDirection=-1;rankCarry=0;
        round=AN.start('frontier',0,params());paused=false;frontierBusy=true;
        release();last=performance.now();rankStatus('{{t:frontier.msg.028}}');update();
      }catch(error){rankStatus('{{t:frontier.msg.029}}',true);}
      finally{rankStarting=false;}
    }
    $('ft-ranked').addEventListener('click',startRanked);
    $('ft-rank-retry').addEventListener('click',function(){if(ranking)uploadRank();else startRanked();});
    $('ft-local').addEventListener('click',async function(){
      pause();if(rankPending){await uploadRank();if(rankPending)return;}endRound('abandoned');
      if(localJourney){world=localJourney.world;paid=localJourney.paid;cleared=localJourney.cleared;localJourney=null;}
      ranking=null;paused=true;rankStatus('');update();
    });
    var noticeTimer=0;
    function showNotice(text){var box=$('ft-notice');set('ft-notice',text);box.hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(function(){box.hidden=true;},10000);}
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
    var missions={build:'{{t:frontier.msg.031}}',rescue:'{{t:frontier.msg.032}}',hunt:'{{t:frontier.msg.033}}',defend:'{{t:frontier.msg.034}}',elite:'{{t:frontier.msg.035}}',boss:'{{t:frontier.msg.036}}'};
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
        if(paid&&!world){var keep=w&&w.tech&&['tool','blade','pack'].every(function(k){return Number.isInteger(w.tech[k])&&w.tech[k]>=0&&w.tech[k]<=8;})?{tool:w.tech.tool,blade:w.tech.blade,pack:w.tech.pack}:undefined,gold=w&&Number.isFinite(w.coins)?Math.max(0,Math.min(1e6,Math.floor(w.coins))):0,lvl=w&&Number.isInteger(w.level)&&w.level>=1&&w.level<=Math.min(50,cleared+1)?w.level:Math.min(50,cleared+1);world=frontierWorld(lvl,keep,gold);set('ft-storage','{{t:frontier.msg.037}}');}
      }catch(e){set('ft-storage','{{t:frontier.msg.038}}');}
    }
    function persist(){if(ranking)return true;if(!paid||!world)return true;try{localStorage.setItem('deep-sea-frontier-v1',JSON.stringify({version:1,paid:true,cleared:cleared,world:world}));set('ft-storage','{{t:frontier.msg.039}}');return true;}catch(e){set('ft-storage','{{t:frontier.msg.040}}');return false;}}
    function params(){return {stage:world.level,step:world.kills,chapter:world.cfg.chapter+1,mission:world.cfg.mission};}
    function release(){keys={};stick.x=stick.y=0;stick.id=null;dash=false;walkTarget=null;$('ft-knob').style.transform='';}
    function endRound(result){if(round){AN.end(round,0,result,params());round=null;}}
    function pause(){if(!world||paused||world.phase!=='play')return;paused=true;frontierBusy=!!round;release();AN.progress(round,params(),true);persist();update();}
    function start(){
      if(rankStarting||rankSending||rankPending)return;
      if(ranking&&world.phase==='clear'){world=ranking.serverState.world;ranking.sim=ranking.serverState;cleared=ranking.sim.completed;rankDirection=-1;rankCarry=0;}
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
      if(world.level>10&&(world.level-1)%10===0&&world.time<1)showNotice('{{t:frontier.msg.041}}'+world.cfg.houseMax+'{{t:frontier.msg.042}}');
      paused=false;frontierBusy=true;release();last=performance.now();persist();update();canvas.focus({preventScroll:true});syncViewport();
    }
    function selectLevel(n){if(ranking){rankStatus('{{t:frontier.msg.043}}');return;}if(!paid||n>Math.min(50,cleared+1))return;pause();pendingLevel=n;set('ft-select-label','前往關卡 '+n+'？');$('ft-select').hidden=false;}
    function updateMap(){Array.from($('ft-map').children).forEach(function(b,i){b.disabled=!paid||i+1>Math.min(50,cleared+1);var cl=(i+1<=cleared?'ft-done ':'')+(world&&world.level===i+1?'ft-current':'');if(b.className!==cl)b.className=cl;var current=world&&world.level===i+1?'step':'false';if(b.getAttribute('aria-current')!==current)b.setAttribute('aria-current',current);});}
    function update(){
      var w=world||preview,overlay=$('ft-overlay');var cost=frontierRecruitCost(w),barracks=w.buildings.find(function(b){return b.kind==='barracks';});set('ft-recruit','訓練戰士 · 🪵 '+cost.wood+' ◆ '+cost.stone+' · '+frontierAttackers(w).length+'/'+frontierFighterCap(w));$('ft-recruit').disabled=!world||paused||!barracks||!barracks.built||barracks.hp<=0||!frontierNear(w.p,barracks,110);set('ft-troops','戰士 '+frontierAttackers(w).length+'/'+frontierFighterCap(w)+((barracks&&barracks.queue)?' +1':'')+' · 守衛 '+(w.fighters.length-frontierAttackers(w).length)+'/'+(w.cfg.guards||0));var upKinds=['barracks','guardhouse','house'],upB=world&&!paused?upKinds.map(function(k){return w.buildings.find(function(b){return b.kind===k;});}).find(function(b){return b&&b.built&&b.hp>0&&frontierNear(w.p,b,110);}):null;
      $('ft-hut-up').hidden=!upB;if(upB){var lv=upB.level||1,uc=frontierHutCost(w,upB.kind);$('ft-hut-up').dataset.kind=upB.kind;var capLv=upB.kind==='house'?w.cfg.houseMax:5,locked=lv>=capLv&&lv<5;set('ft-hut-up',lv>=5?labels[upB.kind]+' Lv.5 · MAX':locked?labels[upB.kind]+' Lv.'+lv+' · 第 '+(Math.floor((w.level-1)/10)+1)*10+1+' 關起可再升級':'{{t:frontier.msg.044}}'+labels[upB.kind]+' Lv.'+lv+' → Lv.'+(lv+1)+' · 🪵 '+uc.wood+' ◆ '+uc.stone);$('ft-hut-up').disabled=lv>=capLv||w.bag.wood+w.bank.wood<uc.wood||w.bag.stone+w.bank.stone<uc.stone;}
      set('ft-army','戰士 '+frontierAttackers(w).length+' · 守衛 '+(w.fighters.length-frontierAttackers(w).length)+' · 訓練中 '+(barracks&&barracks.queue||0));set('ft-journal-stock','倉庫 🪵 '+w.bank.wood+' · ◆ '+w.bank.stone+' · 工人 '+w.workers.length);set('ft-zone',zones[w.cfg.chapter]);set('ft-level',w.level+' / 50');set('ft-health','♥ '+Math.ceil(w.p.hp));set('ft-base-health','大本營 '+Math.ceil(w.buildings[0].hp)+'/'+w.buildings[0].maxHp);set('ft-assault','第 '+Math.min(w.siege.wave,w.cfg.assaultWaves)+'/'+w.cfg.assaultWaves+' 波 · 下一波 '+Math.ceil(w.siege.next)+'s');
      var steps=stageSteps(w),doneCount=steps.filter(function(t){return t[0];}).length,nextStep=steps.find(function(t){return !t[0];}),objective=frontierBuilt(w,'beacon')?'{{t:frontier.msg.045}}':(nextStep?'本關 '+doneCount+'/'+steps.length+' · 下一步：'+nextStep[1]:'{{t:frontier.msg.046}}');
      set('ft-objective',objective);set('ft-bag','背包 🪵 '+w.bag.wood+'/'+frontierCapacity(w,'wood')+' · ◆ '+w.bag.stone+'/'+frontierCapacity(w,'stone'));set('ft-stock','倉庫 🪵 '+w.bank.wood+' · ◆ '+w.bank.stone);set('ft-record',cleared+' / 50');set('ft-building-effects',(frontierBuilt(w,'mill')?'{{t:frontier.msg.047}}':'{{t:frontier.msg.048}}')+' '+(frontierBuilt(w,'quarry')?'{{t:frontier.msg.049}}':'{{t:frontier.msg.050}}')+' '+(frontierBuilt(w,'forge')?'{{t:frontier.msg.051}}':'{{t:frontier.msg.052}}'));set('ft-coins','金幣 '+w.coins+'/'+frontierPickCost(w));renderCards(w);set('ft-workers','工人 '+w.workers.length);set('ft-hauling','搬運中 '+w.workers.reduce(function(n,a){return n+a.wood+a.stone;},0)+' · 地面資源 '+w.supplies.reduce(function(n,d){return n+d.amount;},0));set('ft-checklist',stageList(steps));
      set('ft-warning',w.siege.next<12?'敵襲倒數 '+Math.ceil(w.siege.next)+'s':'{{t:frontier.msg.053}}');
      $('ft-next').hidden=!world||!frontierBuilt(w,'beacon');$('ft-next').disabled=paused;set('ft-full',document.fullscreenElement||$('ft-main').classList.contains('ft-immersive')?'{{t:frontier.msg.054}}':'{{t:frontier.msg.055}}');
      var market=w.buildings.find(function(b){return b.kind==='market';}),atMarket=market&&market.built&&market.hp>0&&frontierNear(w.p,market,100);
      ['wood','stone'].forEach(function(k){$('ft-sell-'+k).disabled=!world||paused||!atMarket||w.bank[k]<Number($('ft-sale-count').value||10);});
      set('ft-dash',w.p.dash>0?'衝刺 '+w.p.dash.toFixed(1):'{{t:frontier.msg.056}}');$('ft-dash').disabled=paused||w.p.dash>0;$('ft-pause').disabled=!world||w.phase!=='play';set('ft-pause',paused?'{{t:frontier.msg.057}}':'{{t:frontier.msg.058}}');
      ['tool','blade','pack'].forEach(function(k,i){var n=w.tech[k],limit=frontierUpgradeLimit(w,k),cost=frontierUpgradeCost(w,k);set('ft-'+k,['{{t:frontier.msg.059}}','{{t:frontier.msg.060}}','{{t:frontier.msg.061}}'][i]+' Lv.'+n+'/'+limit+(n>=limit?' · MAX':' · 金幣 '+cost));$('ft-'+k).disabled=!world||paused||!frontierNear(w.p,w.buildings[0],100)||n>=limit;});
      overlay.hidden=!!world&&!paused&&w.phase==='play';
      if(!overlay.hidden){
        var title='{{t:frontier.msg.062}}',message='五大區域，五十場考驗。建立據點，穿越危險地帶。\n\n本關任務\n'+stageList(steps)+warTip(w),button='{{t:frontier.msg.063}}';
        if(world){if(w.phase==='dead'){title=w.failure==='base'?'{{t:frontier.msg.064}}':'{{t:frontier.msg.065}}';message='科技升級保留。調整建造順序，利用預告閃避攻擊。\n\n本關任務\n'+stageList(steps)+warTip(w);button='{{t:frontier.msg.066}}';}else if(w.phase==='clear'){title=w.level===50?'{{t:frontier.msg.067}}':w.cfg.war?'{{t:frontier.msg.068}}':'{{t:frontier.msg.069}}';message='{{t:frontier.msg.070}}'+(w.level%10===0&&w.level<50?'\n下一關起，工人小屋可以再升一級！':'');button=w.level===50?'{{t:frontier.msg.071}}':'{{t:frontier.msg.072}}';}else{title='{{t:frontier.msg.073}}';message='{{t:frontier.msg.074}}';button='{{t:frontier.msg.075}}';}}
        set('ft-title',title);if(!transientMessage)set('ft-message',message);set('ft-go',button);
      }updateMap();
    }
    var transientMessage=false;
    function finishStage(){if(world.phase==='clear'){if(ranking)recordRank(886);cleared=Math.max(cleared,world.level);AN.progress(round,params(),true);endRound('complete');}else endRound('loss');paused=true;frontierBusy=false;release();persist();update();if(ranking)uploadRank();}
    function frame(now){if(visible){if(world&&!paused&&world.phase==='play'){
      var x=stick.x+(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),y=stick.y+(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
      if(x||y)walkTarget=null;
      if(walkTarget&&!x&&!y){var destination=frontierWaypoint(world.p,walkTarget);var distance=Math.hypot(destination.x-world.p.x,destination.y-world.p.y);if(distance>8){x=(destination.x-world.p.x)/distance;y=(destination.y-world.p.y)/distance;}else if(destination===walkTarget)walkTarget=null;}
      if(ranking){
        var qx=Math.round(Math.max(-1,Math.min(1,x))*10),qy=Math.round(Math.max(-1,Math.min(1,y))*10),code=((qx+10)*21+qy+10)*2+Number(dash);
        if(code!==rankDirection||dash){recordRank(code);frontierRules.input(ranking.sim,code);rankDirection=code;}
        rankCarry+=Math.min(.05,Math.max(0,(now-last)/1000));
        while(rankCarry>=.05&&world.phase==='play'){
          rankCarry-=.05;frontierRules.advance(ranking.sim);rankTicks++;
          if(rankTicks>=2400||rankActions.length>=3000){uploadRank();break;}
        }
      }else frontierStep(world,{x:x,y:y,dash:dash},Math.min(.05,(now-last)/1000));dash=false;if(world.phase!=='play')finishStage();else if(now-saveAt>5000){persist();saveAt=now;}
    }if(now-uiAt>180){update();uiAt=now;}paint();}last=now;requestAnimationFrame(frame);}
    $('ft-go').addEventListener('click',function(){transientMessage=false;start();if(!world)transientMessage=true;});$('ft-pause').addEventListener('click',function(){if(paused)start();else pause();});
    ['tool','blade','pack'].forEach(function(k){$('ft-'+k).addEventListener('click',function(){if(world&&!paused){var ok=frontierUpgrade(world,k);set('ft-upgrade',ok?'{{t:frontier.msg.076}}':'{{t:frontier.msg.077}}');if(ok){recordRank(887+['tool','blade','pack'].indexOf(k));AN.progress(round,params(),false);persist();}update();}});});
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
    ['wood','stone'].forEach(function(k){$('ft-sell-'+k).addEventListener('click',function(){if(!world||paused)return;var sold=frontierSell(world,k,Number($('ft-sale-count').value||10));set('ft-upgrade',sold?'{{t:frontier.msg.078}}':'{{t:frontier.msg.079}}');if(sold){recordRank(893+(k==='stone'?100:0)+Math.max(1,Math.min(100,Number($('ft-sale-count').value||10)))-1);persist();}update();});});
    for(var ci=0;ci<3;ci++)(function(n){$('ft-card-'+n).addEventListener('click',function(){if(world&&(!ranking||!paused&&!rankPending&&!rankSending)&&frontierChoose(world,n)){recordRank(882+n);persist();update();$('ft-canvas').focus({preventScroll:true});}});})(ci);
    $('ft-hut-up').addEventListener('click',function(){if(world&&!paused&&frontierUpgradeHut(world,this.dataset.kind)){recordRank(890+['house','guardhouse','barracks'].indexOf(this.dataset.kind));persist();update();}});
    $('ft-recruit').addEventListener('click',function(){if(world&&!paused){var recruited=frontierRecruit(world);set('ft-upgrade',recruited?'{{t:frontier.msg.080}}':'{{t:frontier.msg.081}}');if(recruited){recordRank(885);persist();}update();}});
    $('ft-next').addEventListener('click',function(){if(world&&!paused&&frontierLeave(world)){finishStage();}});
    $('ft-home').addEventListener('click',function(){if(world&&!paused){walkTarget={x:180,y:450};AN.interact();}});
    document.addEventListener('visibilitychange',function(){if(document.hidden)pause();});window.addEventListener('blur',pause);window.addEventListener('pagehide',function(e){pause();if(!e.persisted)endRound('abandoned');},{capture:true});
    frontierRoute=function(active){if(!active){pause();exitScreen();}visible=active;if(active){update();paint();}};
    var preview=frontierWorld(1);loadFrontier();update();requestAnimationFrame(frame);
  })();
