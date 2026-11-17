  /* ---------- Reef Blaster: three lanes, automatic fire, persistent weapon upgrades ---------- */
  var BL={active:false,phase:'ready',stage:1,cleared:0,stake:0,analytics:null,lives:3,weapon:1,lane:1,x:200,kills:0,stageKills:0,wave:0,waves:12,clock:0,nextWave:.9,shot:0,enemies:[],bullets:[],pickups:[],fx:[],last:0,focused:document.hasFocus?document.hasFocus():true,flash:0,best:0,serial:0,tracked:false};
  var BL_MULT=[0,.6,1.05,1.65,2.5,3.6,5.2,7.2,10,14,20];
  var blCanvas=$('bl-canvas'),blCtx=blCanvas.getContext('2d');
  try{var blSaved=Number(localStorage.getItem('deep-sea-blaster-best'));if(Number.isFinite(blSaved))BL.best=Math.max(0,Math.min(10,Math.floor(blSaved)));}catch(_){}
  function blSay(text,kind){$('bl-msg').textContent=text;$('bl-msg').className='msg'+(kind?' '+kind:'');}
  function blPay(){return Math.floor(BL.stake*Math.round(BL_MULT[BL.cleared]*100)/100);}
  function blWeapon(){return {damage:Math.ceil(BL.weapon/3),pellets:BL.weapon>=10?3:BL.weapon>=4?2:1,interval:Math.max(.11,.27-BL.weapon*.005)};}
  function blVisible(){return !$('view-blaster').hidden&&!document.hidden&&BL.focused;}
  function blTracking(){var engaged=BL.active&&BL.phase==='run'&&blVisible();if(engaged===BL.tracked)return;BL.tracked=engaged;if(engaged)AN.resume(BL.analytics,{stage:BL.stage});else if(BL.active)AN.progress(BL.analytics,{stage:BL.stage,score:BL.kills},true);}
  function blUI(){
    var w=blWeapon();$('bl-stage').textContent=BL.stage+' / 10';$('bl-lives').textContent=BL.lives+' / 3';$('bl-wave').textContent=BL.wave+' / '+BL.waves;
    $('bl-weapon').textContent='Lv.'+BL.weapon;$('bl-power').textContent=w.damage+' 傷害 × '+w.pellets+' 發';$('bl-kills').textContent=BL.kills+' 隻';$('bl-best').textContent=BL.best+' 關';
    $('bl-mult').textContent=fx(BL_MULT[BL.cleared])+'×';$('bl-pay').textContent=(BL.phase==='lost'?0:blPay())+' 點';$('bl-amount').disabled=BL.active;
    $('bl-go').disabled=BL.phase==='run';$('bl-go').textContent=BL.phase==='cleared'?'帶著武器，挑戰下一關':'扣點開始出擊';$('bl-go').dataset.mode='bet';
    $('bl-cash').disabled=BL.phase!=='cleared';$('bl-cash').textContent=BL.phase==='cleared'?'領回 '+blPay()+' 點':'過關後可領回';
    $('bl-left').disabled=$('bl-right').disabled=BL.phase!=='run';
  }
  function blRound(){
    BL.phase='run';BL.stageKills=0;BL.wave=0;BL.waves=12+2*(BL.stage-1);BL.clock=0;BL.nextWave=.9;BL.shot=0;BL.enemies=[];BL.bullets=[];BL.pickups=[];BL.fx=[];BL.lane=1;BL.x=200;BL.flash=0;BL.last=performance.now();
    blTracking();blSay('第 '+BL.stage+' 關：自動射擊中。左右換道瞄準怪物，撿亮黃色武器箱強化火力。');blUI();blCanvas.focus();
  }
  function blStart(){
    if(BL.phase==='run')return;
    if(BL.active&&BL.phase==='cleared'){BL.stage++;blRound();return;}
    var stake=Number($('bl-amount').value);
    if(!Number.isSafeInteger(stake)||stake<MIN_BET){blSay('請輸入至少 '+MIN_BET+' 點的整數入場點數。','lose');return;}
    if(stake>S.balance){blSay('餘額不足，請降低入場點數。','lose');return;}
    BL.stake=stake;BL.stage=1;BL.cleared=0;BL.lives=3;BL.weapon=1;BL.kills=0;BL.active=true;BL.tracked=false;BL.serial=0;
    BL.analytics=AN.start('blaster',stake);S.balance-=stake;save();renderAll();blRound();
  }
  function blCash(){
    if(!BL.active||BL.phase!=='cleared')return;
    var pay=blPay();BL.active=false;BL.phase='cashed';BL.tracked=false;S.balance+=pay;save();renderAll();
    AN.end(BL.analytics,pay,'cashout',{stage:BL.cleared,score:BL.kills,multiplier:BL_MULT[BL.cleared],weapon_level:BL.weapon});
    blSay((BL.cleared===10?'十關全破！':'已收隊。')+'領回 '+pay+' 點，本局淨'+(pay>=BL.stake?'賺 ':'損 ')+Math.abs(pay-BL.stake)+' 點。',pay>=BL.stake?'win':'');blUI();
  }
  function blHurt(){
    if(BL.phase!=='run')return;BL.lives--;BL.flash=.3;
    if(BL.lives<=0){BL.active=false;BL.phase='lost';BL.tracked=false;AN.end(BL.analytics,0,'loss',{stage:BL.stage,score:BL.kills,weapon_level:BL.weapon});blSay('防線失守！三顆心用完，本局投入與未領回金額歸零。','lose');}
    else blSay('怪物突破防線，扣 1 心！剩 '+BL.lives+' 心，快找武器箱提升火力。','lose');blUI();
  }
  function blClear(){
    if(BL.phase!=='run')return;BL.cleared=BL.stage;BL.phase='cleared';BL.bullets=[];blTracking();
    if(BL.cleared>BL.best){BL.best=BL.cleared;try{localStorage.setItem('deep-sea-blaster-best',String(BL.best));}catch(_){}}
    blSay('第 '+BL.stage+' 關完成！可領回 '+blPay()+' 點，或帶著 Lv.'+BL.weapon+' 武器與 '+BL.lives+' 心繼續。','win');
    if(BL.cleared===10)blCash();else blUI();
  }
  function blSpawn(){
    BL.wave++;var lane=Math.floor(Math.random()*3),armored=BL.wave%4===0,hp=3+Math.ceil(BL.stage*BL.stage*1.25),speed=82+BL.stage*6;
    function enemy(l,y,tank){var health=Math.ceil(hp*(tank?1.7:1));BL.enemies.push({lane:l,x:80+l*120,y:y,hp:health,max:health,speed:speed*(tank?.82:1),tank:tank,hit:0,id:++BL.serial});}
    enemy(lane,-32,armored);
    if(BL.stage>=3&&BL.wave%4===2)enemy((lane+1+Math.floor(Math.random()*2))%3,-125,false);
    if(BL.wave%3===1){var pickLane=(lane+1+Math.floor(Math.random()*2))%3;BL.pickups.push({lane:pickLane,x:80+pickLane*120,y:-105,speed:speed,boost:BL.wave%6===4?2:1});}
    BL.nextWave=Math.max(1.18,1.85-(BL.stage-1)*.07);blUI();
  }
  function blMove(direction){
    if(BL.phase!=='run'||!blVisible())return;blSync(performance.now());if(BL.phase!=='run')return;
    BL.lane=Math.max(0,Math.min(2,BL.lane+direction));blTracking();
  }
  function blBurst(){
    var w=blWeapon();for(var i=0;i<w.pellets;i++)BL.bullets.push({x:BL.x+(i-(w.pellets-1)/2)*13,y:508,damage:w.damage});BL.shot=w.interval;
  }
  function blEffect(x,y,color,count){for(var i=0;i<(reduceMotion?0:count);i++)BL.fx.push({x:x,y:y,vx:(Math.random()-.5)*130,vy:(Math.random()-.5)*130,t:.45,color:color});}
  function blStep(dt){
    while(dt>1e-8&&BL.phase==='run'){
      var step=Math.min(dt,.016);dt-=step;BL.clock+=step;BL.flash=Math.max(0,BL.flash-step);BL.x+=(80+BL.lane*120-BL.x)*Math.min(1,step*22);
      BL.shot-=step;if(BL.shot<=0)blBurst();BL.nextWave-=step;if(BL.wave<BL.waves&&BL.nextWave<=0)blSpawn();
      BL.enemies.forEach(function(e){e.y+=e.speed*step;e.hit=Math.max(0,e.hit-step);});BL.pickups.forEach(function(p){p.y+=p.speed*step;});
      BL.bullets.forEach(function(b){var old=b.y;b.y-=660*step;for(var j=0;j<BL.enemies.length;j++){var e=BL.enemies[j];if(e.hp>0&&Math.abs(b.x-e.x)<30&&e.y+27>=b.y&&e.y-27<=old){e.hp-=b.damage;e.hit=.09;b.y=-1000;if(e.hp<=0){BL.kills++;BL.stageKills++;blEffect(e.x,e.y,e.tank?'#ffb638':'#62e6d2',9);}break;}}});
      BL.bullets=BL.bullets.filter(function(b){return b.y>-40;});BL.enemies=BL.enemies.filter(function(e){return e.hp>0;});
      for(var k=BL.enemies.length-1;k>=0;k--){var e=BL.enemies[k];if(e.y>585||(Math.abs(e.x-BL.x)<38&&Math.abs(e.y-532)<37)){BL.enemies.splice(k,1);blHurt();if(BL.phase!=='run')return;}}
      for(var k=BL.pickups.length-1;k>=0;k--){var p=BL.pickups[k];if(Math.abs(p.x-BL.x)<40&&Math.abs(p.y-532)<39){BL.weapon=Math.min(30,BL.weapon+p.boost);BL.pickups.splice(k,1);blEffect(p.x,p.y,'#ffb638',12);blSay('火力升級 Lv.'+BL.weapon+'！'+blWeapon().damage+' 傷害 × '+blWeapon().pellets+' 發，自動連射。','win');blUI();}else if(p.y>620)BL.pickups.splice(k,1);}
      BL.fx.forEach(function(f){f.x+=f.vx*step;f.y+=f.vy*step;f.t-=step;});BL.fx=BL.fx.filter(function(f){return f.t>0;});
      if(BL.wave===BL.waves&&!BL.enemies.length&&!BL.pickups.length)blClear();
    }
  }
  function blSync(now){
    blTracking();var dt=BL.last?Math.max(0,Math.min(.06,(now-BL.last)/1000)):0;BL.last=now;
    if(BL.phase==='run'&&blVisible())blStep(dt);
  }
  function blRoundRect(x,y,w,h,r,color){blCtx.fillStyle=color;blCtx.beginPath();blCtx.roundRect(x,y,w,h,r);blCtx.fill();}
  function blDrawMonster(e){
    var g=blCtx,x=e.x,y=e.y,t=BL.clock,c=e.hit>0?'#fff':e.tank?'#f4a66d':'#b8a4f4';g.save();g.translate(x,y);if(!reduceMotion)g.rotate(Math.sin(t*4+e.id)*.06);
    g.strokeStyle=e.tank?'#f4a66d':'#b8a4f4';g.lineWidth=9;g.lineCap='round';for(var i=0;i<3;i++){g.beginPath();g.moveTo(-17+i*17,12);g.quadraticCurveTo(-23+i*17,34,-14+i*17+Math.sin(t*5+i)*4,30);g.stroke();}
    g.fillStyle=c;g.beginPath();g.ellipse(0,0,e.tank?29:25,e.tank?29:25,0,0,7);g.fill();
    if(e.tank){blRoundRect(-27,-24,54,13,5,'#94695f');g.fillStyle='#ffe0a4';g.beginPath();g.moveTo(-10,-24);g.lineTo(0,-38);g.lineTo(10,-24);g.fill();}
    g.fillStyle='#fff';g.beginPath();g.ellipse(-9,-4,7,9,0,0,7);g.ellipse(9,-4,7,9,0,0,7);g.fill();g.fillStyle='#182c40';g.beginPath();g.arc(-8,-2,3,0,7);g.arc(10,-2,3,0,7);g.fill();g.strokeStyle='#564064';g.lineWidth=2;g.beginPath();g.arc(0,9,5,0,Math.PI);g.stroke();g.restore();
    blRoundRect(x-27,y-49,54,6,3,'#183a49');blRoundRect(x-27,y-49,54*Math.max(0,e.hp/e.max),6,3,e.tank?'#ffb638':'#b8a4f4');g.font='bold 11px system-ui';g.textAlign='center';g.fillStyle='#e4f2f3';g.fillText(Math.max(0,e.hp)+' HP',x,y-55);
  }
  function blDraw(){
    var g=blCtx,w=400,h=600;g.clearRect(0,0,w,h);g.fillStyle='#061c2c';g.fillRect(0,0,w,h);
    var glow=g.createLinearGradient(0,0,0,h);glow.addColorStop(0,'#133b50');glow.addColorStop(1,'#071d2d');g.fillStyle=glow;g.fillRect(20,0,360,h);
    for(var i=0;i<3;i++){g.fillStyle=i===BL.lane?'rgba(98,230,210,.06)':'rgba(255,255,255,.015)';g.fillRect(22+i*120,0,116,h);}
    g.strokeStyle='#265061';g.lineWidth=1;g.setLineDash([8,15]);[140,260].forEach(function(x){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();});g.setLineDash([]);
    g.strokeStyle='rgba(98,230,210,.09)';for(var i=0;i<9;i++){var y=(i*80+(reduceMotion?0:BL.clock*60))%680-40;g.beginPath();g.moveTo(22,y);g.lineTo(378,y);g.stroke();}
    g.fillStyle='rgba(98,230,210,.22)';for(var i=0;i<12;i++){g.beginPath();g.arc(9+(i%2)*382,((i*71-BL.clock*13)%640+640)%640,2+i%3,0,7);g.fill();}
    BL.bullets.forEach(function(b){blRoundRect(b.x-3,b.y-10,6,19,3,BL.weapon>=10?'#ffe7a3':'#9bfff0');});
    BL.enemies.forEach(blDrawMonster);
    BL.pickups.forEach(function(p){var y=p.y;g.save();g.translate(p.x,y);if(!reduceMotion)g.rotate(Math.sin(BL.clock*3)*.07);g.fillStyle='rgba(255,182,56,.12)';g.beginPath();g.arc(0,0,36,0,7);g.fill();blRoundRect(-22,-22,44,44,10,'#ffb638');blRoundRect(-17,-17,34,34,7,'#694d24');g.fillStyle='#ffe4a2';g.beginPath();g.moveTo(3,-14);g.lineTo(-9,3);g.lineTo(-1,3);g.lineTo(-4,15);g.lineTo(11,-4);g.lineTo(3,-4);g.closePath();g.fill();g.fillStyle='#fff0c3';g.font='bold 11px system-ui';g.textAlign='center';g.fillText('火力 +'+p.boost,0,38);g.restore();});
    // The player stays at the bottom; twin / triple barrels match the actual projectile count.
    var px=BL.x,py=532;g.fillStyle='rgba(98,230,210,.12)';g.beginPath();g.ellipse(px,py+28,35,11,0,0,7);g.fill();g.fillStyle='#62e6d2';g.beginPath();g.moveTo(px,py-27);g.lineTo(px+29,py+18);g.lineTo(px+17,py+25);g.lineTo(px,py+17);g.lineTo(px-17,py+25);g.lineTo(px-29,py+18);g.closePath();g.fill();
    blRoundRect(px-9,py-13,18,23,8,'#163e50');g.fillStyle='#c9fff2';g.beginPath();g.arc(px,py-6,5,0,7);g.fill();var gun=blWeapon();for(var i=0;i<gun.pellets;i++)blRoundRect(px+(i-(gun.pellets-1)/2)*13-3,py-31,6,17,3,'#ffdc87');
    if(BL.phase==='run'&&!reduceMotion){g.fillStyle='#ffb638';g.beginPath();g.moveTo(px-7,py+22);g.lineTo(px,py+36+Math.sin(BL.clock*35)*5);g.lineTo(px+7,py+22);g.fill();}
    BL.fx.forEach(function(f){g.globalAlpha=Math.max(0,f.t/.45);g.fillStyle=f.color;g.fillRect(f.x-2,f.y-2,4,4);});g.globalAlpha=1;
    g.fillStyle='rgba(4,18,29,.9)';g.fillRect(0,0,400,54);g.font='bold 14px system-ui';g.fillStyle='#e4f2f3';g.textAlign='left';g.fillText('第 '+BL.stage+' 關 · '+BL.wave+'/'+BL.waves+' 波',16,23);g.fillStyle='#ffb638';g.fillText('火力 Lv.'+BL.weapon,16,44);g.textAlign='right';g.fillStyle='#ff958c';g.fillText('♥'.repeat(Math.max(0,BL.lives))+'♡'.repeat(3-Math.max(0,BL.lives)),384,25);g.fillStyle='#9fc1ca';g.font='12px system-ui';g.fillText('擊破 '+BL.kills,384,44);
    if(BL.flash>0){g.fillStyle='rgba(255,111,97,'+(BL.flash*.6)+')';g.fillRect(0,0,w,h);}
    if(BL.phase!=='run'||!blVisible()){
      g.fillStyle='rgba(4,18,29,.82)';g.fillRect(0,0,w,h);blRoundRect(28,180,344,222,18,'#113041');g.strokeStyle='#326475';g.lineWidth=1;g.strokeRect(40,194,320,194);
      g.textAlign='center';g.fillStyle=BL.phase==='lost'?'#ff958c':'#62e6d2';g.font='bold 28px system-ui';g.fillText(BL.phase==='ready'?'深海火線':BL.phase==='cleared'?'防線守住了！':BL.phase==='cashed'?'出擊完成':BL.phase==='lost'?'防線失守':'已暫停',200,236);
      g.fillStyle='#e4f2f3';g.font='15px system-ui';g.fillText(BL.phase==='ready'?'三條航道，自動開火。':BL.phase==='cleared'?'領回 '+blPay()+' 點，或繼續下一關':BL.phase==='cashed'?'已領回 '+blPay()+' 點':BL.phase==='lost'?'三顆心用完，本局返還 0 點':'回到遊戲後繼續',200,276);
      g.fillStyle='#ffdc87';g.fillText(BL.phase==='ready'?'撿武器 → 傷害提升 → 雙發 → 三發':'武器 Lv.'+BL.weapon+' · 擊破 '+BL.kills+' 隻',200,310);
      g.fillStyle='#9fc1ca';g.font='13px system-ui';g.fillText(BL.phase==='ready'?'使用下方或右側按鈕扣點開始':'使用操作面板選擇下一步',200,352);
    }
    g.textAlign='center';g.fillStyle='#8db0b9';g.font='11px system-ui';g.fillText('← 點左半邊換道　｜　點右半邊換道 →',200,585);
  }
  $('bl-go').addEventListener('click',blStart);$('bl-cash').addEventListener('click',blCash);
  $('bl-left').addEventListener('click',function(){blMove(-1);});$('bl-right').addEventListener('click',function(){blMove(1);});
  blCanvas.addEventListener('pointerdown',function(e){if(BL.phase!=='run')return;e.preventDefault();blCanvas.focus();var bounds=blCanvas.getBoundingClientRect();blMove(e.clientX-bounds.left<bounds.width/2?-1:1);});
  document.addEventListener('keydown',function(e){if(!blVisible()||BL.phase!=='run'||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;if(['INPUT','BUTTON','A','SUMMARY','TEXTAREA','SELECT'].indexOf(e.target.tagName)>=0||e.target.isContentEditable)return;var key=e.key.toLowerCase();if(['arrowleft','a','arrowright','d'].indexOf(key)<0)return;e.preventDefault();blMove(key==='arrowleft'||key==='a'?-1:1);});
  function blSuspend(){BL.last=performance.now();blTracking();}
  window.addEventListener('blur',function(){BL.focused=false;blSuspend();});window.addEventListener('focus',function(){BL.focused=true;blSuspend();});
  document.addEventListener('visibilitychange',blSuspend);window.addEventListener('hashchange',blSuspend);
  function blLoop(now){blSync(now);if(!$('view-blaster').hidden){blUI();blDraw();}requestAnimationFrame(blLoop);}
  blUI();blDraw();requestAnimationFrame(blLoop);
