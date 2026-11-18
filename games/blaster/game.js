  /* ---------- Reef Blaster: free horizontal movement, automatic fire, monsters in five columns, persistent levels ---------- */
  var BL={active:false,phase:'ready',stage:1,cleared:0,stake:0,spent:0,retries:0,earned:0,attemptEarned:0,rewarded:0,analytics:null,lives:3,weapon:1,form:'pulse',picks:[],sinceCard:0,keys:{l:false,r:false},ink:[],bossSpawned:false,target:200,x:200,kills:0,stageKills:0,wave:0,waves:18,clock:0,scroll:0,nextWave:.9,shot:0,enemies:[],bullets:[],fx:[],last:0,focused:document.hasFocus?document.hasFocus():true,flash:0,best:0,serial:0,tracked:false};
  var blCanvas=$('bl-canvas'),blCtx=blCanvas.getContext('2d');
  try{var blSaved=Number(localStorage.getItem('deep-sea-blaster-best'));if(Number.isFinite(blSaved))BL.best=Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,Math.floor(blSaved)));}catch(_){}
  function blSay(text,kind){$('bl-msg').textContent=text;$('bl-msg').className='msg'+(kind?' '+kind:'');}
  function blRetryFee(){return 0;}
  function blPay(){return BL.earned;}
  // Weapon forms are chosen from three cards between stages; firepower level (BL.weapon) only scales damage and fire rate.
  var BL_GUNS=[
    {kind:'pulse',name:'脈衝彈',color:'#9bfff0',pellets:1,scale:1.2,speed:660,pierce:1,radius:0,desc:'均衡的單發彈'},
    {kind:'twin',name:'雙管速射',color:'#74baff',pellets:2,scale:1,speed:740,pierce:1,radius:0,desc:'兩發並進，射速快'},
    {kind:'rail',name:'穿透光槍',color:'#9dff86',pellets:2,scale:1.35,speed:1050,pierce:3,radius:0,desc:'子彈可穿透 3 隻'},
    {kind:'rocket',name:'追蹤火箭',color:'#ff8f75',pellets:2,scale:2.2,speed:600,pierce:1,radius:78,desc:'自動追蹤，範圍爆炸'},
    {kind:'plasma',name:'電漿砲',color:'#e6a3ff',pellets:3,scale:1.6,speed:720,pierce:2,radius:58,desc:'三發穿透，範圍傷害'},
    {kind:'frost',name:'寒流彈',color:'#bdefff',pellets:2,scale:.9,speed:720,pierce:1,radius:0,desc:'命中後減速 2 秒'},
    {kind:'chain',name:'電鏈彈',color:'#fff27a',pellets:1,scale:1.3,speed:800,pierce:1,radius:0,desc:'命中後電擊附近 2 隻'}
  ];
  function blWeapon(){
    var gun=BL_GUNS[0];BL_GUNS.forEach(function(g){if(g.kind===BL.form)gun=g;});
    return Object.assign({},gun,{damage:1+Math.ceil(BL.weapon/3),interval:gun.kind==='rocket'?.34:Math.max(.11,.27-BL.weapon*.005)});
  }
  function blBossStage(stage){return stage%5===0;}
  function blStageConfig(stage){var waves=Math.min(180,54+12*(stage-1));return {waves:blBossStage(stage)?Math.ceil(waves*.6):waves,interval:Math.max(.7,1.3-(stage-1)*.05),speed:stage<=10?150+stage*14:290+12*Math.log2(stage-9)};}
  function blHealth(){return BL.stage<=10?3+Math.ceil(.8*BL.stage):11+3*(BL.stage-10);}
  function blPace(){return 1+.35*Math.min(1,BL.wave/BL.waves);}
  function blVisible(){return !$('view-blaster').hidden&&!document.hidden&&BL.focused;}
  function blTracking(){var engaged=BL.active&&BL.phase==='run'&&blVisible();if(engaged===BL.tracked)return;BL.tracked=engaged;if(engaged)AN.resume(BL.analytics,{stage:BL.stage});else if(BL.active)AN.progress(BL.analytics,{stage:BL.stage,score:BL.kills},true);}
  function blUI(){
    var w=blWeapon();$('bl-stage').textContent='第 '+BL.stage+' 關';$('bl-lives').textContent=BL.lives+' / 3';$('bl-wave').textContent=BL.wave+' / '+BL.waves;
    $('bl-weapon').textContent=w.name+' Lv.'+BL.weapon;$('bl-power').textContent=Math.round(w.damage*w.scale*100)/100+' 傷害 × '+w.pellets+' 發';
    $('bl-evolution').textContent=BL.phase==='pick'?'選一張強化卡，戰鬥會接著繼續':blBossStage(BL.stage)?'第 '+BL.stage+' 關：關底有王':'戰鬥中每隔一段時間三選一強化';$('bl-weapon').style.color=w.color;$('bl-speed').textContent=(blStageConfig(BL.stage).speed*blPace()/96).toFixed(2)+'×';$('bl-kills').textContent=BL.kills+' 隻';$('bl-best').textContent=BL.best+' 關';
    $('bl-reward-status').textContent=BL.cleared+' / '+((Math.floor(BL.cleared/10)+1)*10)+' 關';$('bl-pay').textContent=BL.earned+' 點';$('bl-amount').disabled=BL.active;
    $('bl-go').hidden=BL.phase==='lost'||BL.phase==='pick';$('bl-go').disabled=BL.phase==='run';$('bl-picks').hidden=BL.phase!=='pick';for(var pi=0;pi<3;pi++){var card=BL.picks[pi],pb=$('bl-pick-'+pi);pb.hidden=!card;if(card){var label=blCardText(card);if(pb.textContent!==label)pb.textContent=label;pb.disabled=BL.phase!=='pick';}}$('bl-go').textContent=BL.phase==='cleared'?'帶著武器，挑戰下一關':'免費開始出擊';$('bl-go').dataset.mode='bet';
    $('bl-cash').disabled=BL.phase!=='cleared';$('bl-cash').textContent=BL.phase==='cleared'?'結束這輪（已獲 '+BL.earned+' 點）':'過關後可選擇收隊';
    $('bl-retry').hidden=BL.phase!=='lost';$('bl-retry').disabled=BL.phase!=='lost'||S.balance<blRetryFee();$('bl-retry').textContent='免費重玩第 '+BL.stage+' 關';
    $('bl-retry-info').hidden=BL.phase!=='lost';$('bl-retry-info').textContent='保留 Lv.'+BL.weapon+' 武器，恢復 3 心，從第 '+BL.stage+' 關第一波重來。';
    $('bl-left').disabled=$('bl-right').disabled=BL.phase!=='run';
  }
  function blRound(){
    BL.phase='run';BL.stageKills=0;BL.wave=0;BL.waves=blStageConfig(BL.stage).waves;BL.clock=0;BL.scroll=0;BL.nextWave=.6;BL.shot=0;BL.enemies=[];BL.bullets=[];BL.fx=[];BL.ink=[];BL.bossSpawned=false;BL.target=200;BL.x=200;BL.keys.l=BL.keys.r=false;BL.flash=0;BL.last=performance.now();
    blTracking();blSay(blBossStage(BL.stage)?'第 '+BL.stage+' 關：打完怪潮後，深海巨獸會現身。':'第 '+BL.stage+' 關：自動射擊中。左右移動對準怪物，閃開水雷與墨彈。');blUI();blCanvas.focus();
  }
  function blCardText(card){
    if(card.type==='repair')return '修補船體 · 恢復 1 心';
    var gun=BL_GUNS.filter(function(g){return g.kind===card.kind;})[0];
    return gun.name+' · '+gun.desc;
  }
  // Weapon choice cards: the fight pauses every BL_CARD_EVERY waves (counted across stages) and resumes after the pick.
  // Cards only swap the weapon form (or heal); firepower level grows by +1 per cleared stage and +1 per boss.
  var BL_CARD_EVERY=36;
  function blOfferPicks(){
    var pool=BL_GUNS.filter(function(g){return g.kind!==BL.form;}).sort(function(){return Math.random()-.5;}).slice(0,3).map(function(g){return {type:'weapon',kind:g.kind};});
    if(BL.lives<3&&pool.length)pool[pool.length-1]={type:'repair'};
    BL.picks=pool;BL.phase='pick';BL.sinceCard=0;BL.tracked=false;
    blSay('暫停選擇：從三張強化卡中選一張，戰鬥會接著繼續。','win');blUI();
  }
  function blChoose(index){
    if(BL.phase!=='pick'||!BL.picks[index])return;
    var card=BL.picks[index];BL.picks=[];
    if(card.type==='repair')BL.lives=Math.min(3,BL.lives+1);else BL.form=card.kind;
    BL.phase='run';BL.last=performance.now();blTracking();blSay('強化完成，繼續出擊！');blUI();blCanvas.focus();
  }
  function blStart(){
    if(BL.phase==='run'||BL.phase==='lost'||BL.phase==='pick')return;
    if(BL.active&&BL.phase==='cleared'){BL.stage++;blRound();return;}
    var stake=ENTRY_FEE;
    if(stake>S.balance){blSay(LOW_MSG,'lose');return;}
    BL.stake=stake;BL.spent=stake;BL.retries=0;BL.earned=0;BL.attemptEarned=0;BL.rewarded=0;BL.stage=1;BL.cleared=0;BL.lives=3;BL.weapon=1;BL.form='pulse';BL.picks=[];BL.sinceCard=0;BL.kills=0;BL.active=true;BL.tracked=false;BL.serial=0;
    BL.analytics=AN.start('blaster',stake);save();renderAll();blRound();
  }
  function blRetry(){
    if(BL.active||BL.phase!=='lost')return;
    var cost=blRetryFee();
    if(S.balance<cost){blSay('餘額不足，重玩第 '+BL.stage+' 關需要 '+cost+' 點。','lose');return;}
    BL.stake=cost;BL.spent+=cost;BL.retries++;BL.attemptEarned=0;BL.lives=3;BL.active=true;BL.tracked=false;
    BL.analytics=AN.start('blaster',cost,{stage:BL.stage,entry_kind:'stage_retry',retry_count:BL.retries});save();renderAll();blRound();
  }
  function blCash(){
    if(!BL.active||BL.phase!=='cleared')return;
    BL.active=false;BL.phase='cashed';BL.tracked=false;
    AN.end(BL.analytics,BL.attemptEarned,'cashout',{stage:BL.cleared,score:BL.kills,multiplier:BL.stake?BL.attemptEarned/BL.stake:0,weapon_level:BL.weapon});
    blSay('已結束這輪，累計獎勵 '+BL.earned+' 點已入帳。重玩與續關皆免費。');blUI();
  }
  function blHurt(){
    if(BL.phase!=='run')return;BL.lives--;BL.flash=.3;
    if(BL.lives<=0){BL.active=false;BL.phase='lost';BL.tracked=false;AN.end(BL.analytics,BL.attemptEarned,'loss',{stage:BL.stage,score:BL.kills,weapon_level:BL.weapon});blSay('防線失守！已獲得的 '+BL.earned+' 點獎勵保留。可免費重玩目前第 '+BL.stage+' 關，保留武器並恢復 3 心。','lose');}
    else blSay('怪物突破防線，扣 1 心！剩 '+BL.lives+' 心，快找武器箱提升火力。','lose');blUI();
  }
  function blClear(){
    if(BL.phase!=='run')return;BL.cleared=BL.stage;BL.phase='cleared';BL.bullets=[];BL.weapon=Math.min(Number.MAX_SAFE_INTEGER,BL.weapon+1);
    var milestones=Math.floor(BL.cleared/10),bonus=Math.max(0,milestones-BL.rewarded);
    if(bonus){BL.rewarded=milestones;BL.earned+=bonus;BL.attemptEarned+=bonus;S.balance+=bonus;save();renderAll();}
    BL.tracked=false;AN.progress(BL.analytics,{stage:BL.stage,score:BL.kills,bonus_points:bonus,total_bonus_points:BL.earned,weapon_form:BL.form,boss:blBossStage(BL.stage)},true);
    if(BL.cleared>BL.best){BL.best=BL.cleared;try{localStorage.setItem('deep-sea-blaster-best',String(BL.best));}catch(_){}}
    blSay((blBossStage(BL.stage)?'擊敗深海巨獸！':'')+'第 '+BL.stage+' 關完成！'+(bonus?'獲得 '+bonus+' 點，已直接入帳。':'')+'可帶著 Lv.'+BL.weapon+' 火力與 '+BL.lives+' 心挑戰第 '+(BL.stage+1)+' 關，開始前可三選一強化。','win');blUI();
  }
  var BL_MOBS={
    octo:{name:'泡泡章魚',color:'#b8a4f4',health:1,speed:1},
    crab:{name:'裝甲螃蟹',color:'#f4a66d',health:1.7,speed:.82},
    ray:{name:'衝刺魟魚',color:'#65e1cb',health:.65,speed:1.48},
    eel:{name:'橫移電鰻',color:'#ffe076',health:.9,speed:1.08},
    turtle:{name:'護盾海龜',color:'#79bfff',health:1,speed:.86},
    jelly:{name:'分裂水母',color:'#ff9cce',health:1.15,speed:.9},
    mini:{name:'小水母',color:'#ffc5e4',health:.25,speed:1.18},
    mine:{name:'水雷',color:'#ff6b6b',health:.45,speed:1.1},
    rock:{name:'礁石',color:'#8f9aa8',health:2.2,speed:.62},
    squid:{name:'噴墨烏賊',color:'#d78bff',health:1.1,speed:.72},
    boss:{name:'深海巨獸',color:'#ff7a6b',health:1,speed:0}
  };
  // Threat cost and first stage for each spawnable type; a wave spends a growing budget across up to four of five columns.
  var BL_SLOTS=[56,128,200,272,344];
  var BL_COST={octo:1,crab:1.4,ray:1,eel:1.3,turtle:1.6,jelly:1.5,mine:1.1,rock:1.2,squid:1.6};
  var BL_UNLOCK={octo:1,ray:2,crab:2,mine:3,eel:3,turtle:4,rock:5,jelly:6,squid:7};
  function blEnemy(lane,y,type,hp){
    var spec=BL_MOBS[type],health=Math.ceil(hp*spec.health);
    return {type:type,lane:lane,x:BL_SLOTS[lane],y:y,hp:health,max:health,speed:blStageConfig(BL.stage).speed*spec.speed,shield:type==='turtle'?Math.ceil(hp*.75):0,shieldMax:type==='turtle'?Math.ceil(hp*.75):0,hit:0,id:++BL.serial,age:0,shiftAt:1.5,telegraph:0,targetLane:null,slow:0,hold:0,cd:1};
  }
  function blWavePlan(wave){
    var stage=BL.stage,pool=Object.keys(BL_UNLOCK).filter(function(t){return stage>=BL_UNLOCK[t];});
    var lanes=[0,1,2,3,4].sort(function(){return Math.random()-.5;});
    var intro=pool.filter(function(t){return BL_UNLOCK[t]===stage&&stage>1;});
    if(intro.length&&wave===3)return [{lane:lanes[0],type:intro[0],dy:0}];
    // Intensity ramps with total progress T (stages plus position inside the stage): a quiet start with the starter gun, then denser waves.
    var T=(stage-1)+(BL.waves?wave/BL.waves:0),mean=Math.min(3.6,1+.55*T),n=Math.floor(mean)+(Math.random()<mean-Math.floor(mean)?1:0);
    if(Math.random()<.2)n+=Math.random()<.5?-1:1;
    var maxPer=Math.max(1,Math.min(5,n)),budget=1.4*maxPer+.5,plan=[];
    for(var i=0;i<maxPer;i++){
      var options=pool.filter(function(t){return BL_COST[t]<=budget+1e-9&&!(t==='rock'&&plan.some(function(q){return q.type==='rock';}));});
      if(!options.length)break;
      var type=options[Math.floor(Math.random()*options.length)];
      plan.push({lane:lanes[i],type:type,dy:-70*i});budget-=BL_COST[type];
    }
    if(!plan.length)plan.push({lane:lanes[0],type:'octo',dy:0});
    return plan;
  }
  function blSpawn(){
    BL.wave++;var hp=blHealth(),config=blStageConfig(BL.stage),plan=blWavePlan(BL.wave),scale=Math.max(.6,1-.1*(plan.length-1));
    plan.forEach(function(q){BL.enemies.push(blEnemy(q.lane,-32+q.dy,q.type,Math.max(1,Math.round(hp*scale))));});
    BL.nextWave=config.interval*(1-.16*BL.wave/BL.waves);
    BL.sinceCard++;
    if(BL.sinceCard>=BL_CARD_EVERY&&BL.wave<BL.waves){blOfferPicks();return;}
    blUI();
  }
  function blBossSpawn(){
    var boss=blEnemy(1,150,'boss',blHealth()*28);boss.x=200;boss.warn=[];boss.warnT=0;boss.cd=2.2;BL.enemies.push(boss);BL.bossSpawned=true;
    blSay('深海巨獸現身！留意紅色警示區域，墨浪會沿區域衝下來。','lose');blUI();
  }
  function blAdvanceBoss(e,step){
    e.age+=step;e.hit=Math.max(0,e.hit-step);e.y=150;e.x=200+Math.sin(e.age*.55)*105;
    var rage=e.hp/e.max<.5;
    if(e.warn.length){
      e.warnT-=step;
      if(e.warnT<=0){e.warn.forEach(function(l){BL.ink.push({x:BL_SLOTS[l],y:e.y+50,vy:500,r:34,beam:true});});e.warn=[];e.cd=rage?(BL.stage<10?2.4:1.9):(BL.stage<10?3.2:2.6);}
    }else{
      e.cd-=step;
      if(e.cd<=0){
        var lanes=[0,1,2,3,4].sort(function(){return Math.random()-.5;}).slice(0,rage||BL.stage>=10?2:1);e.warn=lanes;e.warnT=.9;
        if(rage&&BL.enemies.length<7){var l=Math.floor(Math.random()*5);BL.enemies.push(blEnemy(l,-32,'mine',Math.max(1,Math.round(blHealth()*.7))));}
      }
    }
  }
  function blAdvanceEnemy(e,step){
    if(e.type==='boss'){blAdvanceBoss(e,step);return;}
    var slow=1;if(e.slow>0){e.slow-=step;slow=.55;}
    e.hit=Math.max(0,e.hit-step);e.age=(e.age||0)+step;
    if(e.type==='squid'&&e.y>=150&&e.hold<4){
      e.hold+=step;e.cd-=step;
      if(e.cd<=0){BL.ink.push({x:BL.x,y:e.y+22,vy:300,r:13,beam:false});e.cd=1.7;}
      return;
    }
    e.y+=e.speed*blPace()*step*slow;
    if(e.type!=='eel')return;
    if(e.targetLane!==null){e.telegraph-=step;if(e.telegraph<=0){e.x+=(BL_SLOTS[e.targetLane]-e.x)*Math.min(1,step*9);if(Math.abs(e.x-BL_SLOTS[e.targetLane])<1){e.x=BL_SLOTS[e.targetLane];e.lane=e.targetLane;e.targetLane=null;e.shiftAt=e.age+2.2;}}}
    else if(e.y>65&&e.y<365&&e.age>=e.shiftAt){var near=[e.lane-2,e.lane-1,e.lane+1,e.lane+2].filter(function(q){return q>=0&&q<=4;});e.targetLane=near[e.id%near.length];e.telegraph=.65;}
  }
  function blDamage(e,damage){
    if(e.hp<=0)return;
    if(e.shield>0){var blocked=Math.min(e.shield,damage);e.shield-=blocked;damage-=blocked;if(e.shield===0)blEffect(e.x,e.y,'#79bfff',14);}
    e.hp-=damage;e.hit=.09;
    if(e.hp>0)return;
    if(e.type==='rock'){blEffect(e.x,e.y,'#b8c2cf',12);return;}
    if(e.type==='boss'){BL.kills+=10;BL.stageKills+=10;BL.weapon=Math.min(Number.MAX_SAFE_INTEGER,BL.weapon+1);BL.ink=[];blEffect(e.x,e.y,'#ff7a6b',40);return;}
    BL.kills++;BL.stageKills++;blEffect(e.x,e.y,(BL_MOBS[e.type]||BL_MOBS.octo).color,9);
    if(e.type==='mine'){
      var blast=Math.max(2,Math.ceil(blHealth()*.6));
      BL.fx.push({x:e.x,y:e.y,vx:0,vy:0,t:.32,color:'#ff6b6b',ring:90});
      BL.enemies.slice().forEach(function(o){if(o.id!==e.id&&o.hp>0&&o.type!=='boss'&&Math.hypot(o.x-e.x,o.y-e.y)<90)blDamage(o,blast);});
      if(e.y>400&&Math.hypot(e.x-BL.x,e.y-532)<110)blHurt();
    }
    if(e.type==='jelly'){
      var hp=blHealth(),y=Math.min(e.y,390);
      BL.enemies.push(blEnemy(Math.max(0,e.lane-1),y-22,'mini',hp));BL.enemies.push(blEnemy(Math.min(4,e.lane+1),y-65,'mini',hp));
    }
  }
  function blSegmentHit(ax,ay,bx,by,e,radius){
    var dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,((e.x-ax)*dx+(e.y-ay)*dy)/length)):0;
    return Math.hypot(ax+dx*t-e.x,ay+dy*t-e.y)<radius;
  }
  function blClampX(x){return Math.max(28,Math.min(372,x));}
  // Free movement: drag/tap sets the target x, arrow/A-D keys and the on-screen buttons slide it while held.
  function blMove(direction){
    if(BL.phase!=='run'||!blVisible())return;blSync(performance.now());if(BL.phase!=='run')return;
    BL.target=blClampX(BL.target+direction*80);blTracking();
  }
  function blAim(x){if(BL.phase==='run')BL.target=blClampX(x);}
  function blBurst(){
    var w=blWeapon();for(var i=0;i<w.pellets;i++){
      var offset=i-(w.pellets-1)/2,spread=w.kind==='plasma'?offset*60:0;
      BL.bullets.push({x:BL.x+offset*13,y:508,damage:w.damage*w.scale,vx:spread,speed:w.speed,kind:w.kind,color:w.color,pierce:w.pierce,radius:w.radius,hits:[]});
    }BL.shot=w.interval;
  }
  function blAdvanceBullet(b,step){
    var ax=b.x,ay=b.y;
    if(b.kind==='rocket'){
      var target=null;BL.enemies.forEach(function(e){if(e.hp>0&&e.y<b.y+12&&(!target||Math.hypot(e.x-b.x,e.y-b.y)<Math.hypot(target.x-b.x,target.y-b.y)))target=e;});
      if(target)b.x+=Math.max(-210*step,Math.min(210*step,target.x-b.x));
    }else b.x+=(b.vx||0)*step;
    b.y-=b.speed*step;
    // Resolve nearest along this projectile's path, preserving one hit per enemy for piercing shots.
    var targets=BL.enemies.filter(function(e){return e.hp>0&&b.hits.indexOf(e.id)<0&&blSegmentHit(ax,ay,b.x,b.y,e,22+(b.kind==='plasma'?7:0));}).sort(function(a,c){return Math.hypot(a.x-ax,a.y-ay)-Math.hypot(c.x-ax,c.y-ay);});
    for(var j=0;j<targets.length&&b.pierce>0;j++){
      var enemy=targets[j];if(enemy.hp<=0)continue;b.hits.push(enemy.id);blDamage(enemy,b.damage);b.pierce--;
      if(b.kind==='frost'&&enemy.type!=='boss')enemy.slow=2;
      if(b.kind==='chain'){BL.enemies.filter(function(o){return o.id!==enemy.id&&o.hp>0&&Math.hypot(o.x-enemy.x,o.y-enemy.y)<140;}).sort(function(a,c){return Math.hypot(a.x-enemy.x,a.y-enemy.y)-Math.hypot(c.x-enemy.x,c.y-enemy.y);}).slice(0,2).forEach(function(o){blDamage(o,b.damage*.6);BL.fx.push({x:o.x,y:o.y,vx:0,vy:0,t:.2,color:b.color,ring:18});});}
      if(b.radius>0){
        var splash=BL.enemies.slice();splash.forEach(function(e){if(e.id!==enemy.id&&e.hp>0&&Math.hypot(e.x-enemy.x,e.y-enemy.y)<b.radius)blDamage(e,b.damage*.55);});
        BL.fx.push({x:enemy.x,y:enemy.y,vx:0,vy:0,t:.32,color:b.color,ring:b.radius});
      }
    }
    BL.ink=BL.ink.filter(function(i){return i.beam||!blSegmentHit(ax,ay,b.x,b.y,i,i.r+8);});
    if(b.pierce<=0)b.y=-1000;
  }
  function blEffect(x,y,color,count){for(var i=0;i<(reduceMotion?0:count);i++)BL.fx.push({x:x,y:y,vx:(Math.random()-.5)*130,vy:(Math.random()-.5)*130,t:.45,color:color});}
  function blStep(dt){
    while(dt>1e-8&&BL.phase==='run'){
      var step=Math.min(dt,.016);dt-=step;
      BL.clock+=step;BL.scroll+=blStageConfig(BL.stage).speed*blPace()*step;BL.flash=Math.max(0,BL.flash-step);var dir=(BL.keys.r?1:0)-(BL.keys.l?1:0);if(dir)BL.target=blClampX(BL.target+dir*430*step);BL.x+=Math.max(-720*step,Math.min(720*step,BL.target-BL.x));
      BL.shot-=step;if(BL.shot<=0)blBurst();BL.nextWave-=step;if(BL.wave<BL.waves&&BL.nextWave<=0)blSpawn();
      BL.enemies.forEach(function(e){blAdvanceEnemy(e,step);});
      BL.bullets.forEach(function(b){blAdvanceBullet(b,step);});
      BL.bullets=BL.bullets.filter(function(b){return b.y>-40&&b.x>-40&&b.x<440;});BL.enemies=BL.enemies.filter(function(e){return e.hp>0;});
      for(var k=BL.enemies.length-1;k>=0;k--){
        var e=BL.enemies[k];if(e.type==='boss')continue;
        var touch=Math.abs(e.x-BL.x)<34&&Math.abs(e.y-532)<34;
        if(e.type==='rock'){if(e.y>585){BL.enemies.splice(k,1);}else if(touch){BL.enemies.splice(k,1);blHurt();if(BL.phase!=='run')return;}continue;}
        if(e.y>585||touch){BL.enemies.splice(k,1);blHurt();if(BL.phase!=='run')return;}
      }
      for(var q=BL.ink.length-1;q>=0;q--){
        var ink=BL.ink[q];ink.y+=ink.vy*step;
        if(Math.abs(ink.x-BL.x)<(ink.beam?40:30)&&Math.abs(ink.y-532)<(ink.beam?40:30)){BL.ink.splice(q,1);blHurt();if(BL.phase!=='run')return;}
        else if(ink.y>640)BL.ink.splice(q,1);
      }
      if(BL.wave<BL.waves&&!BL.enemies.length&&BL.nextWave>.35)BL.nextWave=.35;
      BL.fx.forEach(function(f){f.x+=f.vx*step;f.y+=f.vy*step;f.t-=step;});BL.fx=BL.fx.filter(function(f){return f.t>0;});
      if(BL.wave===BL.waves&&!BL.enemies.length){
        if(blBossStage(BL.stage)&&!BL.bossSpawned)blBossSpawn();
        else blClear();
      }
    }
  }
  function blSync(now){
    blTracking();var dt=BL.last?Math.max(0,Math.min(.06,(now-BL.last)/1000)):0;BL.last=now;
    if(BL.phase==='run'&&blVisible())blStep(dt);
  }
  function blRoundRect(x,y,w,h,r,color){blCtx.fillStyle=color;blCtx.beginPath();blCtx.roundRect(x,y,w,h,r);blCtx.fill();}
  function blDrawBoss(e){
    var g=blCtx,x=e.x,y=e.y,t=BL.clock,c='#ff7a6b';
    e.warn.forEach(function(l){g.fillStyle='rgba(255,70,60,'+(.18+.12*Math.sin(t*20))+')';g.fillRect(BL_SLOTS[l]-36,y+40,72,600);g.fillStyle='#ff8f85';g.font='bold 22px system-ui';g.textAlign='center';g.fillText('!',BL_SLOTS[l],y+90);});
    g.save();g.translate(x,y);g.strokeStyle=c;g.lineWidth=9;g.lineCap='round';for(var i=0;i<6;i++){g.beginPath();g.moveTo(-60+i*24,20);g.quadraticCurveTo(-70+i*24+Math.sin(t*3+i)*10,60,-62+i*24+Math.sin(t*4+i)*14,84);g.stroke();}
    g.fillStyle=c;g.beginPath();g.ellipse(0,0,78,56,0,0,7);g.fill();g.fillStyle='#8d3a3a';g.beginPath();g.ellipse(0,-30,48,16,0,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.ellipse(-26,-2,13,15,0,0,7);g.ellipse(26,-2,13,15,0,0,7);g.fill();g.fillStyle='#2a0f14';g.beginPath();g.arc(-24+Math.sin(t)*4,0,6,0,7);g.arc(28+Math.sin(t)*4,0,6,0,7);g.fill();if(e.hit>0){g.globalAlpha=.3;g.fillStyle='#fff';g.beginPath();g.ellipse(0,0,78,56,0,0,7);g.fill();g.globalAlpha=1;}g.restore();
    blRoundRect(30,62,340,10,5,'#3a1a22');blRoundRect(30,62,340*Math.max(0,e.hp/e.max),10,5,'#ff7a6b');g.textAlign='center';g.fillStyle='#ffe4e0';g.font='bold 12px system-ui';g.fillText('深海巨獸 '+Math.max(0,Math.ceil(e.hp))+' HP',200,92);
  }
  function blDrawMonster(e){
    if(e.type==='boss'){blDrawBoss(e);return;}
    var g=blCtx,x=e.x,y=e.y,t=BL.clock,spec=BL_MOBS[e.type]||BL_MOBS.octo,c=e.hit>0?'#fff':spec.color;
    if(e.type==='eel'&&e.targetLane!==null){
      var target=BL_SLOTS[e.targetLane];g.strokeStyle='rgba(255,224,118,.65)';g.lineWidth=2;g.setLineDash([5,5]);g.beginPath();g.moveTo(x,y);g.lineTo(target,y+40);g.stroke();g.setLineDash([]);g.fillStyle='#ffe076';g.font='bold 20px system-ui';g.textAlign='center';g.fillText(target<x?'←':'→',target,y+30);
    }
    g.save();g.translate(x,y);g.scale(.8,.8);if(!reduceMotion)g.rotate(Math.sin(t*4+e.id)*.06);
    g.fillStyle=c;g.strokeStyle=c;g.lineWidth=7;g.lineCap='round';
    if(e.type==='crab'){
      [-1,1].forEach(function(d){g.beginPath();g.moveTo(d*20,4);g.lineTo(d*37,-7);g.lineTo(d*39,-19);g.stroke();g.beginPath();g.arc(d*39,-23,9,0,Math.PI*1.6);g.fill();for(var i=0;i<2;i++){g.beginPath();g.moveTo(d*18,12+i*6);g.lineTo(d*33,22+i*7);g.stroke();}});
      blRoundRect(-27,-21,54,47,12,c);blRoundRect(-26,-22,52,12,5,'#94695f');
    }else if(e.type==='ray'){
      g.beginPath();g.moveTo(0,-30);g.quadraticCurveTo(13,-2,43,14);g.lineTo(15,20);g.lineTo(0,11);g.lineTo(-15,20);g.lineTo(-43,14);g.quadraticCurveTo(-13,-2,0,-30);g.fill();g.lineWidth=4;g.beginPath();g.moveTo(0,12);g.quadraticCurveTo(15,30,0,44);g.stroke();
    }else if(e.type==='eel'){
      g.lineWidth=16;g.beginPath();g.moveTo(0,-24);g.bezierCurveTo(-32,-8,30,8,0,24);g.stroke();g.beginPath();g.ellipse(0,-19,18,14,0,0,7);g.fill();g.strokeStyle='#b08c25';g.lineWidth=3;g.beginPath();g.moveTo(-4,-4);g.lineTo(7,1);g.lineTo(-7,8);g.lineTo(5,15);g.stroke();
    }else if(e.type==='mine'){
      g.lineWidth=5;for(var i=0;i<8;i++){var a=i*Math.PI/4;g.beginPath();g.moveTo(Math.cos(a)*18,Math.sin(a)*18);g.lineTo(Math.cos(a)*29,Math.sin(a)*29);g.stroke();}
      g.fillStyle=e.hit>0?'#fff':'#3a2f3f';g.beginPath();g.arc(0,0,20,0,7);g.fill();g.fillStyle=Math.sin(t*10+e.id)>0?'#ff5a4d':'#7a2a2a';g.beginPath();g.arc(0,0,7,0,7);g.fill();
    }else if(e.type==='rock'){
      g.fillStyle=c;g.beginPath();g.moveTo(-30,16);g.lineTo(-24,-14);g.lineTo(-6,-28);g.lineTo(18,-22);g.lineTo(32,-2);g.lineTo(26,22);g.lineTo(-8,26);g.closePath();g.fill();g.strokeStyle='#59636f';g.lineWidth=3;g.beginPath();g.moveTo(-6,-28);g.lineTo(0,-6);g.lineTo(-12,14);g.moveTo(0,-6);g.lineTo(18,10);g.stroke();
    }else if(e.type==='squid'){
      g.beginPath();g.moveTo(0,-30);g.quadraticCurveTo(28,-8,16,8);g.lineTo(-16,8);g.quadraticCurveTo(-28,-8,0,-30);g.fill();g.lineWidth=5;for(var i=0;i<4;i++){g.beginPath();g.moveTo(-12+i*8,8);g.quadraticCurveTo(-14+i*9,22,-12+i*8+Math.sin(t*5+i)*4,30);g.stroke();}
      if(e.y>=150&&e.hold<4&&e.cd<.5){g.strokeStyle='rgba(255,120,120,.55)';g.lineWidth=2;g.setLineDash([4,6]);g.beginPath();g.moveTo(BL.x-x,30);g.lineTo(BL.x-x,400);g.stroke();g.setLineDash([]);}
    }else if(e.type==='turtle'){
      [-1,1].forEach(function(d){g.beginPath();g.ellipse(d*25,12,12,8,d*.4,0,7);g.fill();});g.beginPath();g.ellipse(0,-22,14,16,0,0,7);g.fill();g.fillStyle=e.hit>0?'#fff':'#3e698e';g.beginPath();g.ellipse(0,7,26,29,0,0,7);g.fill();g.strokeStyle='#a9d4ed';g.lineWidth=2;g.beginPath();g.moveTo(0,-15);g.lineTo(15,-4);g.lineTo(15,15);g.lineTo(0,27);g.lineTo(-15,15);g.lineTo(-15,-4);g.closePath();g.stroke();
    }else{
      var small=e.type==='mini',jelly=e.type==='jelly'||small,size=small?16:25;
      g.lineWidth=small?4:7;for(var i=0;i<3;i++){g.beginPath();g.moveTo(-size*.65+i*size*.65,9);g.quadraticCurveTo(-size+i*size*.7,32,-size*.6+i*size*.65+Math.sin(t*5+i)*4,small?24:32);g.stroke();}
      g.beginPath();g.ellipse(0,0,size,jelly?size*.75:size,0,0,7);g.fill();if(jelly){g.fillStyle='#ffe6f4';g.beginPath();g.arc(-6,-6,4,0,7);g.fill();}
    }
    var ey=e.type==='turtle'?-26:e.type==='eel'?-22:-4,eyeSize=e.type==='mini'?4:6;
    if(e.type!=='mine'&&e.type!=='rock'){g.fillStyle='#fff';g.beginPath();g.ellipse(-8,ey,eyeSize,eyeSize+2,0,0,7);g.ellipse(8,ey,eyeSize,eyeSize+2,0,0,7);g.fill();g.fillStyle='#182c40';g.beginPath();g.arc(-7,ey+1,2.5,0,7);g.arc(9,ey+1,2.5,0,7);g.fill();}g.restore();
    if(e.slow>0){g.strokeStyle='#bdefff';g.lineWidth=2;g.beginPath();g.arc(x,y,28,0,7);g.stroke();}
    if(e.shield>0){g.strokeStyle='#79bfff';g.lineWidth=3;g.beginPath();g.ellipse(x,y,27,34,0,0,7);g.stroke();blRoundRect(x-22,y-49,44*e.shield/e.shieldMax,4,2,'#79bfff');}
    blRoundRect(x-22,y-40,44,5,2,'#183a49');blRoundRect(x-22,y-40,44*Math.max(0,e.hp/e.max),5,2,spec.color);g.font='bold 10px system-ui';g.textAlign='center';g.fillStyle='#e4f2f3';g.fillText(Math.max(0,Math.ceil(e.hp))+' HP',x,y-45);
  }
  function blDrawBullet(b){
    var g=blCtx,x=b.x,y=b.y;g.fillStyle=b.color;g.strokeStyle=b.color;
    if(b.kind==='pulse'){g.beginPath();g.ellipse(x,y,4,8,0,0,7);g.fill();}
    else if(b.kind==='twin'){blRoundRect(x-3,y-12,6,24,3,b.color);blRoundRect(x-1,y-9,2,13,1,'#e7f5ff');}
    else if(b.kind==='frost'){g.beginPath();g.moveTo(x,y-11);g.lineTo(x+6,y);g.lineTo(x,y+11);g.lineTo(x-6,y);g.closePath();g.fill();}
    else if(b.kind==='chain'){g.lineWidth=3;g.beginPath();g.moveTo(x,y+12);g.lineTo(x+5,y+4);g.lineTo(x-4,y-2);g.lineTo(x+4,y-12);g.stroke();}
    else if(b.kind==='rail'){g.globalAlpha=.2;blRoundRect(x-7,y-30,14,62,7,b.color);g.globalAlpha=1;blRoundRect(x-2,y-30,4,45,2,'#e4ffd9');}
    else if(b.kind==='rocket'){g.beginPath();g.moveTo(x,y-12);g.lineTo(x+5,y-3);g.lineTo(x+5,y+8);g.lineTo(x-5,y+8);g.lineTo(x-5,y-3);g.closePath();g.fill();g.fillStyle='#ffcf68';g.beginPath();g.moveTo(x-3,y+9);g.lineTo(x,y+19);g.lineTo(x+3,y+9);g.fill();}
    else {g.globalAlpha=.2;g.beginPath();g.arc(x,y,14,0,7);g.fill();g.globalAlpha=1;g.beginPath();g.arc(x,y,8,0,7);g.fill();g.fillStyle='#fff2ff';g.beginPath();g.arc(x-2,y-2,3,0,7);g.fill();}
  }
  function blDrawInk(i){
    var g=blCtx;
    if(i.beam){var grad=g.createLinearGradient(0,i.y-70,0,i.y+30);grad.addColorStop(0,'rgba(255,90,80,0)');grad.addColorStop(1,'rgba(255,90,80,.9)');g.fillStyle=grad;g.fillRect(i.x-26,i.y-70,52,100);return;}
    g.fillStyle='#b35cff';g.beginPath();g.ellipse(i.x,i.y,9,13,0,0,7);g.fill();g.fillStyle='#e6c4ff';g.beginPath();g.arc(i.x-2,i.y-4,3,0,7);g.fill();
  }
  function blDrawPlayer(){
    var g=blCtx,px=BL.x,py=532,gun=blWeapon(),c=gun.color;
    g.fillStyle='rgba(98,230,210,.12)';g.beginPath();g.ellipse(px,py+28,35,11,0,0,7);g.fill();g.fillStyle=c;g.beginPath();g.moveTo(px,py-27);g.lineTo(px+29,py+18);g.lineTo(px+17,py+25);g.lineTo(px,py+17);g.lineTo(px-17,py+25);g.lineTo(px-29,py+18);g.closePath();g.fill();
    blRoundRect(px-9,py-13,18,23,8,'#163e50');g.fillStyle='#ecffff';g.beginPath();g.arc(px,py-6,5,0,7);g.fill();
    if(gun.kind==='pulse')blRoundRect(px-4,py-35,8,24,4,c);
    if(gun.kind==='twin')[-1,1].forEach(function(d){blRoundRect(px+d*14-5,py-35,10,29,4,c);});
    if(gun.kind==='frost')[-1,1].forEach(function(d){blRoundRect(px+d*14-4,py-33,8,26,4,c);blRoundRect(px+d*14-8,py-20,16,5,2,'#6aa9c4');});
    if(gun.kind==='chain'){blRoundRect(px-4,py-38,8,28,4,c);g.strokeStyle=c;g.lineWidth=3;g.beginPath();g.arc(px,py-30,9,0,7);g.stroke();}
    if(gun.kind==='rail'){blRoundRect(px-11,py-48,7,38,2,c);blRoundRect(px+4,py-48,7,38,2,c);blRoundRect(px-14,py-30,28,7,2,'#406f58');}
    if(gun.kind==='rocket')[-1,1].forEach(function(d){blRoundRect(px+d*24-8,py-23,16,35,5,'#734b4c');blRoundRect(px+d*24-6,py-31,12,20,4,c);g.fillStyle='#ffcf68';g.beginPath();g.arc(px+d*24,py-24,3,0,7);g.fill();});
    if(gun.kind==='plasma'){g.strokeStyle=c;g.lineWidth=3;g.beginPath();g.ellipse(px,py-29,24,12,0,0,7);g.stroke();g.fillStyle=c;g.beginPath();g.arc(px,py-29,11,0,7);g.fill();g.fillStyle='#fff2ff';g.beginPath();g.arc(px-3,py-32,4,0,7);g.fill();[-1,1].forEach(function(d){blRoundRect(px+d*27-4,py-17,8,31,3,c);});}
    if(BL.phase==='run'&&!reduceMotion){g.fillStyle=c;g.beginPath();g.moveTo(px-7,py+22);g.lineTo(px,py+36+Math.sin(BL.clock*35)*5);g.lineTo(px+7,py+22);g.fill();}
  }
  function blPickCard(card){var gun=card.type==='weapon'?BL_GUNS.filter(function(x){return x.kind===card.kind;})[0]:null;return {title:gun?gun.name:'修補船體',desc:gun?gun.desc:'恢復 1 心',color:gun?gun.color:'#ff958c'};}
  function blDrawPicks(){
    var g=blCtx;g.fillStyle='rgba(4,18,29,.9)';g.fillRect(0,0,400,600);g.textAlign='center';g.fillStyle='#62e6d2';g.font='bold 26px system-ui';g.fillText('選擇強化',200,120);g.fillStyle='#e4f2f3';g.font='14px system-ui';g.fillText('戰鬥暫停，三選一',200,150);
    BL.picks.forEach(function(card,i){var info=blPickCard(card),x=22+i*120;blRoundRect(x,190,116,300,14,'#113041');blRoundRect(x,190,116,8,4,info.color);g.fillStyle=info.color;g.font='bold 16px system-ui';g.fillText(info.title,x+58,250,100);g.fillStyle='#e4f2f3';g.font='12px system-ui';g.fillText(info.desc,x+58,290,100);g.fillStyle='#ffdc87';g.fillText('火力 Lv.'+BL.weapon,x+58,330,100);g.fillStyle='#9fc1ca';g.fillText('按 '+(i+1),x+58,470,100);});
    g.fillStyle='#9fc1ca';g.font='13px system-ui';g.fillText('點選卡片，或按數字鍵 1 / 2 / 3',200,540);
  }
  function blDraw(){
    var g=blCtx,w=400,h=600;g.clearRect(0,0,w,h);g.fillStyle='#061c2c';g.fillRect(0,0,w,h);
    var glow=g.createLinearGradient(0,0,0,h);glow.addColorStop(0,'#133b50');glow.addColorStop(1,'#071d2d');g.fillStyle=glow;g.fillRect(20,0,360,h);
    g.fillStyle='rgba(98,230,210,.05)';g.fillRect(BL.x-1.5,0,3,h);
    g.strokeStyle='#265061';g.lineWidth=1;g.setLineDash([8,15]);[92,164,236,308].forEach(function(x){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();});g.setLineDash([]);
    g.strokeStyle='rgba(98,230,210,.09)';for(var i=0;i<9;i++){var y=(i*80+(reduceMotion?0:BL.scroll*.65))%680-40;g.beginPath();g.moveTo(22,y);g.lineTo(378,y);g.stroke();}
    g.fillStyle='rgba(98,230,210,.22)';for(var i=0;i<12;i++){g.beginPath();g.arc(9+(i%2)*382,((i*71-BL.scroll*.15)%640+640)%640,2+i%3,0,7);g.fill();}
    BL.bullets.forEach(blDrawBullet);BL.enemies.forEach(blDrawMonster);BL.ink.forEach(blDrawInk);blDrawPlayer();
    BL.fx.forEach(function(f){g.globalAlpha=Math.max(0,f.t/.45);g.fillStyle=f.color;if(f.ring){g.strokeStyle=f.color;g.lineWidth=2;g.beginPath();g.arc(f.x,f.y,f.ring*(reduceMotion?.8:1-f.t/.36),0,7);g.stroke();}else g.fillRect(f.x-2,f.y-2,4,4);});g.globalAlpha=1;
    g.fillStyle='rgba(4,18,29,.9)';g.fillRect(0,0,400,54);g.font='bold 14px system-ui';g.fillStyle='#e4f2f3';g.textAlign='left';g.fillText('第 '+BL.stage+' 關 · '+BL.wave+'/'+BL.waves+' 波',16,23);g.fillStyle='#ffb638';g.fillText(blWeapon().name+' Lv.'+BL.weapon,16,44);g.textAlign='right';g.fillStyle='#ff958c';g.fillText('♥'.repeat(Math.max(0,BL.lives))+'♡'.repeat(3-Math.max(0,BL.lives)),384,25);g.fillStyle='#9fc1ca';g.font='12px system-ui';g.fillText((blStageConfig(BL.stage).speed*blPace()/96).toFixed(2)+'× 航速',384,44);
    if(BL.flash>0){g.fillStyle='rgba(255,111,97,'+(BL.flash*.6)+')';g.fillRect(0,0,w,h);}
    if(BL.phase==='pick')blDrawPicks();
    else if(BL.phase!=='run'||!blVisible()){
      g.fillStyle='rgba(4,18,29,.82)';g.fillRect(0,0,w,h);blRoundRect(28,180,344,222,18,'#113041');g.strokeStyle='#326475';g.lineWidth=1;g.strokeRect(40,194,320,194);
      g.textAlign='center';g.fillStyle=BL.phase==='lost'?'#ff958c':'#62e6d2';g.font='bold 28px system-ui';g.fillText(BL.phase==='ready'?'深海火線':BL.phase==='cleared'?'防線守住了！':BL.phase==='cashed'?'出擊完成':BL.phase==='lost'?'防線失守':'已暫停',200,236);
      g.fillStyle='#e4f2f3';g.font='15px system-ui';g.fillText(BL.phase==='ready'?'自由移動，自動開火。':BL.phase==='cleared'?'下一站：第 '+(BL.stage+1)+' 關':BL.phase==='cashed'?'本輪已獲得 '+BL.earned+' 點':BL.phase==='lost'?'已獲 '+BL.earned+' 點保留，可免費重玩本關':'回到遊戲後繼續',200,276);
      g.fillStyle='#ffdc87';g.fillText(BL.phase==='ready'?'每關開始前，三選一強化':blWeapon().name+' · 擊破 '+BL.kills+' 隻',200,310);
      g.fillStyle='#9fc1ca';g.font='13px system-ui';g.fillText(BL.phase==='ready'?'到操作區免費開始':'使用操作面板選擇下一步',200,352);
    }
    g.textAlign='center';g.fillStyle='#8db0b9';g.font='11px system-ui';g.fillText('← 按住拖曳或左右移動 →',200,585);
  }
  $('bl-go').addEventListener('click',blStart);$('bl-retry').addEventListener('click',blRetry);$('bl-cash').addEventListener('click',blCash);
  function blHold(button,side){
    function down(e){if(BL.phase!=='run')return;if(e&&e.preventDefault)e.preventDefault();BL.keys[side]=true;}
    function up(){BL.keys[side]=false;}
    button.addEventListener('pointerdown',down);button.addEventListener('pointerup',up);button.addEventListener('pointerleave',up);button.addEventListener('pointercancel',up);
    button.addEventListener('click',function(e){if(!e||!e.detail)blMove(side==='l'?-1:1);});
  }
  blHold($('bl-left'),'l');blHold($('bl-right'),'r');
  function blPointerX(e){var bounds=blCanvas.getBoundingClientRect();return (e.clientX-bounds.left)/bounds.width*400;}
  blCanvas.addEventListener('pointerdown',function(e){
    var bounds=blCanvas.getBoundingClientRect();
    if(BL.phase==='pick'){e.preventDefault();var cx=(e.clientX-bounds.left)/bounds.width*400,cy=bounds.height?(e.clientY-bounds.top)/bounds.height*600:300,index=Math.floor((cx-22)/120);if(cy>=190&&cy<=490&&index>=0&&index<3&&cx-22-index*120<=116)blChoose(index);return;}
    if(BL.phase!=='run')return;e.preventDefault();blCanvas.focus();BL.dragging=true;try{blCanvas.setPointerCapture(e.pointerId);}catch(_){}blAim(blPointerX(e));});
  blCanvas.addEventListener('pointermove',function(e){if(BL.dragging&&BL.phase==='run')blAim(blPointerX(e));});
  ['pointerup','pointercancel'].forEach(function(name){blCanvas.addEventListener(name,function(){BL.dragging=false;});});
  [0,1,2].forEach(function(i){$('bl-pick-'+i).addEventListener('click',function(){blChoose(i);});});
  document.addEventListener('keydown',function(e){
    if(!blVisible()||(BL.phase!=='run'&&BL.phase!=='pick')||e.ctrlKey||e.metaKey||e.altKey)return;
    if(['INPUT','BUTTON','A','SUMMARY','TEXTAREA','SELECT'].indexOf(e.target.tagName)>=0||e.target.isContentEditable)return;
    var key=e.key.toLowerCase();
    if(BL.phase==='pick'){if(!e.repeat&&['1','2','3'].indexOf(key)>=0){e.preventDefault();blChoose(Number(key)-1);}return;}
    if(key==='arrowleft'||key==='a'){e.preventDefault();BL.keys.l=true;}else if(key==='arrowright'||key==='d'){e.preventDefault();BL.keys.r=true;}
  });
  document.addEventListener('keyup',function(e){var key=e.key.toLowerCase();if(key==='arrowleft'||key==='a')BL.keys.l=false;if(key==='arrowright'||key==='d')BL.keys.r=false;});
  function blSuspend(){BL.last=performance.now();BL.keys.l=BL.keys.r=false;BL.dragging=false;blTracking();}
  window.addEventListener('blur',function(){BL.focused=false;blSuspend();});window.addEventListener('focus',function(){BL.focused=true;blSuspend();});
  document.addEventListener('visibilitychange',blSuspend);window.addEventListener('hashchange',blSuspend);
  window.addEventListener('pagehide',function(e){if(!e.persisted&&BL.active){AN.end(BL.analytics,BL.attemptEarned,'abandoned',{stage:BL.stage,score:BL.kills,weapon_level:BL.weapon});BL.active=false;BL.tracked=false;}},true);
  function blLoop(now){blSync(now);if(!$('view-blaster').hidden){blUI();blDraw();}requestAnimationFrame(blLoop);}
  blUI();blDraw();requestAnimationFrame(blLoop);
