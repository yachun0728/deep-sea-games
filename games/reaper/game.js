  /* ---------- Reaper Shift: complete a batch, choose cashout or another shift ---------- */
  var RP={active:false,phase:'ready',level:1,cleared:0,stake:0,analytics:null,lives:3,total:0,resolved:0,count:8,spawned:0,lineup:[],ghosts:[],fx:[],gap:.6,speed:126,zone:28,cd:0,sw:0,belt:0,flash:0,message:'',shake:0,last:0,best:0,focused:true};
  var RP_MULT=[0,.7,1.15,1.8,2.7,4,5.8,8.2,11.5,16,22];
  var reaperCanvas=$('rp-canvas'),reaperCtx=reaperCanvas.getContext('2d');
  try{var rb=Number(localStorage.getItem('reaper'));if(Number.isFinite(rb))RP.best=Math.max(0,Math.floor(rb));}catch(_){}
  function rpRand(a,b){return a+Math.random()*(b-a);}
  function rpPay(){return Math.floor(RP.stake*Math.round(RP_MULT[RP.cleared]*100)/100);}
  function rpSay(text,kind){$('rp-msg').textContent=text;$('rp-msg').className='msg'+(kind?' '+kind:'');}
  function rpRemember(){if(RP.total>RP.best){RP.best=RP.total;try{localStorage.setItem('reaper',String(RP.best));}catch(_){}}}
  function rpUI(){
    $('rp-level').textContent=RP.level+' / 10';$('rp-progress').textContent=RP.resolved+' / '+RP.count;$('rp-lives').textContent=RP.lives+' / 3';$('rp-score').textContent=RP.total+' 位';$('rp-best').textContent=RP.best+' 位';
    $('rp-mult').textContent=fx(RP_MULT[RP.cleared])+'×';$('rp-pay').textContent=(RP.phase==='over'?0:rpPay())+' 點';$('rp-amount').disabled=RP.active;
    $('rp-go').textContent=RP.phase==='run'?'揮鐮接走':RP.phase==='cleared'?'挑戰下一班':'扣點開始值班';$('rp-go').disabled=RP.phase==='run'&&RP.cd>0;
    $('rp-go').dataset.mode=RP.phase==='run'?'surface':'bet';$('rp-cash').disabled=RP.phase!=='cleared';$('rp-cash').textContent=RP.phase==='cleared'?'領回 '+rpPay()+' 點':'完成本班後可領回';
    $('rp-difficulty').textContent=RP.level<4?'綠色通行證全程可見':RP.level<7?'通行證靠近金色區域時會淡去':'通行證會提早淡去，先記住誰該放行';
  }
  function rpRound(){
    RP.count=8+(RP.level-1)*2;RP.resolved=0;RP.spawned=0;RP.ghosts=[];RP.fx=[];RP.gap=.6;RP.cd=0;RP.sw=0;RP.flash=0;RP.shake=0;RP.speed=110+RP.level*16;RP.zone=Math.max(18,29-(RP.level-1)*1.2);
    var protectedCount=Math.max(1,Math.round(RP.count*(.18+RP.level*.012)));
    RP.lineup=Array.from({length:RP.count},function(_,i){return i<protectedCount;});
    for(var i=RP.count-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),tmp=RP.lineup[i];RP.lineup[i]=RP.lineup[j];RP.lineup[j]=tmp;}
    if(RP.level===1){var normal=RP.lineup.indexOf(false);RP.lineup[normal]=RP.lineup[0];RP.lineup[0]=false;}
    RP.phase='run';RP.last=performance.now();AN.resume(RP.analytics,{stage:RP.level});rpSay('第 '+RP.level+' 班：處理 '+RP.count+' 位靈魂。普通靈魂要接走，綠色通行證要放行。');rpUI();reaperCanvas.focus();
  }
  function rpStart(){
    if(RP.phase==='run')return;
    if(RP.phase==='cleared'){RP.level++;rpRound();return;}
    var stake=ENTRY_FEE;
    if(stake>S.balance){rpSay(LOW_MSG,'lose');return;}
    RP.stake=stake;RP.level=1;RP.cleared=0;RP.lives=3;RP.total=0;RP.active=true;RP.analytics=AN.start('reaper',stake);S.balance-=stake;save();renderAll();rpRound();
  }
  function rpCash(){
    if(!RP.active||RP.phase!=='cleared')return;
    var pay=rpPay(),net=pay-RP.stake;RP.active=false;RP.phase='cashed';AN.end(RP.analytics,pay,'cashout',{stage:RP.level,score:RP.total,multiplier:RP_MULT[RP.cleared]});S.balance+=pay;save();renderAll();rpSay((RP.cleared===10?'十班全部完成！':'已下班。')+'領回 '+pay+' 點，本局'+(net>=0?'淨賺 ':'淨損 ')+Math.abs(net)+' 點。',net>=0?'win':'');rpUI();
  }
  function rpStrike(message){
    if(RP.phase!=='run')return;RP.lives--;RP.flash=1.1;RP.message=message;RP.shake=reduceMotion?0:.35;
    if(RP.lives<=0){RP.active=false;RP.phase='over';rpRemember();AN.end(RP.analytics,0,'loss',{stage:RP.level,step:RP.resolved,score:RP.total});rpSay(message+' 三顆心用完，本局失去 '+RP.stake+' 點與未領回金額。','lose');}
    else rpSay(message+' 剩餘 '+RP.lives+' 顆心。','lose');rpUI();
  }
  function rpCheck(){
    if(RP.phase!=='run'||RP.resolved<RP.count)return;
    RP.cleared++;RP.phase='cleared';rpRemember();AN.progress(RP.analytics,{stage:RP.level,score:RP.total,lives:RP.lives,multiplier:RP_MULT[RP.cleared]},true);rpSay('第 '+RP.level+' 班處理完成！可領回 '+rpPay()+' 點，或帶著剩下 '+RP.lives+' 顆心繼續。','win');
    if(RP.cleared===10)rpCash();else rpUI();
  }
  function rpSpawn(){RP.ghosts.push({x:-30,d:RP.lineup[RP.spawned],m:false});RP.spawned++;RP.gap=Math.max(.56,rpRand(1.1,1.7)-(RP.level-1)*.065);}
  function rpStep(dt){
    while(dt>1e-8&&RP.phase==='run'){
      var step=Math.min(dt,.02);dt-=step;RP.cd=Math.max(0,RP.cd-step);RP.sw=Math.max(0,RP.sw-step);RP.flash=Math.max(0,RP.flash-step);RP.shake=Math.max(0,RP.shake-step);RP.belt+=RP.speed*step;
      RP.fx.forEach(function(f){f.t+=step;f.y-=140*step;});RP.fx=RP.fx.filter(function(f){return f.t<.6;});
      RP.gap-=step;if(RP.spawned<RP.count&&RP.gap<=0)rpSpawn();
      for(var i=0;i<RP.ghosts.length;i++){
        var ghost=RP.ghosts[i];ghost.x+=RP.speed*step;
        if(!ghost.m&&ghost.x>200+RP.zone+10){ghost.m=true;RP.resolved++;if(!ghost.d)rpStrike('漏接普通靈魂了！');if(RP.phase!=='run')return;}
      }
      RP.ghosts=RP.ghosts.filter(function(o){return o.x<440;});rpCheck();
    }
  }
  function rpSync(now){var dt=Math.max(0,(now-RP.last)/1000);RP.last=now;if(!$('view-reaper').hidden&&!document.hidden&&RP.focused)rpStep(dt);}
  function rpAct(){
    if(RP.phase!=='run'){rpStart();return;}
    rpSync(performance.now());if(RP.phase!=='run'||RP.cd>0)return;
    RP.cd=.35;RP.sw=.18;
    var candidate=null;RP.ghosts.forEach(function(o){if(!o.m&&Math.abs(o.x-200)<=RP.zone&&(!candidate||Math.abs(o.x-200)<Math.abs(candidate.x-200)))candidate=o;});
    if(candidate){candidate.m=true;RP.resolved++;RP.ghosts=RP.ghosts.filter(function(o){return o!==candidate;});if(candidate.d)rpStrike('接到帶通行證的靈魂，應該放行！');else{RP.total++;RP.fx.push({x:candidate.x,y:328,t:0});rpRemember();}rpCheck();}
    rpUI();
  }
  function rpGhost(x,y,d,a,ha){
    var g=reaperCtx;g.globalAlpha=a;g.fillStyle='#dfe9ff';g.beginPath();g.arc(x,y-10,16,Math.PI,0);g.lineTo(x+16,y+14);g.lineTo(x+8,y+8);g.lineTo(x,y+14);g.lineTo(x-8,y+8);g.lineTo(x-16,y+14);g.closePath();g.fill();g.fillStyle='#1b1630';g.beginPath();g.arc(x-6,y-12,3,0,Math.PI*2);g.arc(x+6,y-12,3,0,Math.PI*2);g.fill();
    if(d&&ha>0){g.globalAlpha=a*ha;g.strokeStyle='#6cc58f';g.lineWidth=3;g.beginPath();g.ellipse(x,y-34,12,4,0,0,Math.PI*2);g.stroke();}g.globalAlpha=1;
  }
  function rpDraw(){
    var g=reaperCtx,W=400,H=560,ZX=200,ZW=RP.zone,BY=340;
    g.save();g.translate(RP.shake>0?(Math.random()-.5)*12:0,0);g.fillStyle='#1b1630';g.fillRect(-20,0,W+40,H);g.fillStyle='#3a3550';g.fillRect(-20,BY-40,W+40,80);g.strokeStyle='#4b4566';g.lineWidth=3;
    for(var k=-1;k<11;k++){var x=((RP.belt+k*40)%440)-20;g.beginPath();g.moveTo(x,BY-40);g.lineTo(x,BY+40);g.stroke();}
    g.fillStyle='rgba(242,193,78,.14)';g.fillRect(ZX-ZW,BY-44,ZW*2,88);g.strokeStyle='#f2c14e';g.lineWidth=2;g.setLineDash([6,5]);g.strokeRect(ZX-ZW,BY-44,ZW*2,88);g.setLineDash([]);
    RP.ghosts.forEach(function(o){var fade=RP.level<4?1:Math.max(0,Math.min(1,(ZX-(RP.level<7?35:90)-o.x)/80));rpGhost(o.x,BY-12,o.d,o.m?.35:1,fade);});
    RP.fx.forEach(function(f){rpGhost(f.x,f.y,false,Math.max(0,1-f.t/.6),0);});
    var hx=ZX+10,hy=240;g.fillStyle='#0e0a1a';g.beginPath();g.moveTo(ZX-34,hy+60);g.lineTo(ZX,hy-20);g.lineTo(ZX+34,hy+60);g.closePath();g.fill();g.beginPath();g.arc(ZX,hy-26,17,0,Math.PI*2);g.fill();g.fillStyle=RP.cd>0?'#7a6aa8':'#f2c14e';g.beginPath();g.arc(ZX-6,hy-26,3,0,Math.PI*2);g.arc(ZX+6,hy-26,3,0,Math.PI*2);g.fill();
    var swing=RP.sw>0?1-RP.sw/.18:0,a=RP.sw>0?1.2-swing*1.6:1.2,ex=hx+Math.sin(a)*85,ey=hy+Math.cos(a)*85;g.strokeStyle='#8b7a5a';g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(hx,hy);g.lineTo(ex,ey);g.stroke();g.strokeStyle='#cfd6e6';g.lineWidth=6;g.beginPath();g.moveTo(ex-Math.cos(a)*8,ey+Math.sin(a)*8);g.lineTo(ex+Math.cos(a)*30,ey-Math.sin(a)*30);g.stroke();g.lineCap='butt';g.restore();
    g.fillStyle='#e4f2f3';g.font='600 20px system-ui';g.textAlign='left';g.fillText('第 '+RP.level+' / 10 班',16,32);g.textAlign='right';g.fillStyle='#a8a0c2';g.font='16px system-ui';g.fillText(RP.resolved+' / '+RP.count+' 位',W-16,32);
    for(var i=0;i<3;i++){g.beginPath();g.arc(24+i*26,58,8,0,Math.PI*2);if(i<RP.lives){g.fillStyle='#ff6f61';g.fill();}else{g.strokeStyle='#73596c';g.lineWidth=2;g.stroke();}}
    g.fillStyle='#f2c14e';g.textAlign='right';g.fillText('已接走 '+RP.total+' 位',W-16,60);
    if(RP.flash>0&&RP.phase==='run'){g.fillStyle='#ff8a80';g.textAlign='center';g.font='600 17px system-ui';g.fillText(RP.message,W/2,132,W-30);}
    g.textAlign='center';g.fillStyle='#a8a0c2';g.font='13px system-ui';g.fillText('普通靈魂：接走　綠色通行證：放行',W/2,458);g.fillText(RP.cd>0?'鐮刀恢復中…':'點畫面或按空白鍵揮鐮',W/2,486);
    if(RP.phase!=='run'){
      g.fillStyle='rgba(14,10,26,.88)';g.fillRect(24,135,352,225);g.textAlign='center';g.fillStyle=RP.phase==='over'?'#ff8a80':'#e4f2f3';g.font='600 28px system-ui';g.fillText(RP.phase==='ready'?'死神打工':RP.phase==='cleared'?'這班辛苦了！':RP.phase==='cashed'?'下班領回 '+rpPay()+' 點':'實習結束了！',W/2,186,W-40);
      g.font='15px system-ui';g.fillStyle='#b4acc9';g.fillText(RP.phase==='ready'?'冥界人手不足，你是新來的實習生':RP.phase==='cleared'?'領回點數，或帶著剩下的心繼續':RP.phase==='over'?'三顆心用完，本局未領回金額歸零':'累計接走 '+RP.total+' 位普通靈魂',W/2,225,W-40);
      g.fillStyle='#6cc58f';g.fillText('看見綠色光環，讓他通過就好',W/2,261);g.fillStyle='#f2c14e';g.font='600 17px system-ui';g.fillText(RP.phase==='ready'?'右側扣點開始值班':RP.phase==='cleared'?'本班完成 · '+RP_MULT[RP.cleared].toFixed(2)+'×':'右側可開始新一局',W/2,312);
    }
  }
  $('rp-go').addEventListener('click',rpAct);$('rp-cash').addEventListener('click',rpCash);
  reaperCanvas.addEventListener('pointerdown',function(e){if(RP.phase!=='run')return;e.preventDefault();reaperCanvas.focus();rpAct();});
  document.addEventListener('keydown',function(e){if($('view-reaper').hidden||document.hidden||RP.phase!=='run'||e.code!=='Space'||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;if(['INPUT','BUTTON','A','SUMMARY'].indexOf(e.target.tagName)>=0)return;e.preventDefault();rpAct();});
  window.addEventListener('blur',function(){RP.focused=false;RP.last=performance.now();});window.addEventListener('focus',function(){RP.focused=true;RP.last=performance.now();});
  document.addEventListener('visibilitychange',function(){RP.last=performance.now();});window.addEventListener('hashchange',function(){RP.last=performance.now();});
  function rpLoop(now){rpSync(now);if(!$('view-reaper').hidden&&!document.hidden){rpUI();rpDraw();}requestAnimationFrame(rpLoop);}
  rpUI();rpDraw();requestAnimationFrame(rpLoop);

