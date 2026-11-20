  /* ---------- Sneak Out: retro office comic, endless levels with milestone bonuses credited when reached ---------- */
  var sneakBusy=false,sneakStake=0;
  (function(){
const c=$('sk-canvas'),g=c.getContext('2d'),W=400;
const sneakConsole=c.closest('.sneak-console');
// Milestones count completed levels; calibrated with a reaction-time simulation (see GAME_RULES.md).
const MILESTONES=[[9,3],[11,7],[13,15],[16,30]],ENDLESS_FROM=16,ENDLESS_STEP=3,ENDLESS_BONUS=40;
function bonusAt(n){for(const m of MILESTONES)if(m[0]===n)return m[1];return n>ENDLESS_FROM&&(n-ENDLESS_FROM)%ENDLESS_STEP===0?ENDLESS_BONUS:0}
function nextMilestone(n){for(const m of MILESTONES)if(m[0]>n)return m;return [ENDLESS_FROM+(Math.floor((n-ENDLESS_FROM)/ENDLESS_STEP)+1)*ENDLESS_STEP,ENDLESS_BONUS]}
const lvCap=()=>sneakRules.levelCap(sneaking);
let best=0;try{const n=Number(localStorage.getItem('sneak'));if(Number.isFinite(n))best=Math.max(0,Math.floor(n))}catch(e){}
const texts={title:'{{t:sneak.msg.001}}',tap:'{{t:sneak.msg.002}}',caught:'{{t:sneak.msg.003}}',reach:n=>'離大門只差 '+n+'%',done:n=>'本局通過 '+n+' 關',rec:'{{t:sneak.msg.004}}',ok:'{{t:sneak.msg.006}}'};const T=k=>texts[k];
const quotes=['{{t:sneak.msg.007}}','{{t:sneak.msg.008}}','{{t:sneak.msg.009}}'];
let sneakAnalytics=null;
let prevBest=0,earned=0,pops=[],st='ready',sneaking=sneakRules.create(),flash=0,shake=0,last=0,rec=false,qi=0;
let mouseHold=false,keyHold=false,sneakRandom=Math.random;
const sneakRank=timedLeaderboard('sneak','sk',sneakRules.inputCount,ui);
function saySneak(text,kind=''){$('sk-msg').textContent=text;$('sk-msg').className='msg'+(kind?' '+kind:'')}
function remember(){if(sneaking.score>best){best=sneaking.score;try{localStorage.setItem('sneak',best)}catch(e){}}}
function setHold(value){
 if(st==='run'&&sneakRules.input(sneaking,value?0:1))sneakRank.record(value?0:1);
}
function release(){mouseHold=false;keyHold=false;setHold(false)}
function ui(){
 sneakConsole.dataset.phase=st;
 sneakConsole.style.setProperty('--sk-progress',Math.min(1,sneaking.pr/100));
 const nx=nextMilestone(sneaking.score);
 $('sk-stage').textContent=sneaking.lv;$('sk-progress').textContent=Math.floor(sneaking.pr)+'%';$('sk-best').textContent=best;$('sk-next').textContent='完成 '+nx[0]+' 關 · +'+nx[1];
 $('sk-amount').disabled=sneakBusy;
 $('sk-go').disabled=st==='run'||sneakRank.busy();$('sk-go').textContent=st==='run'?'{{t:sneak.msg.010}}':'{{t:sneak.msg.011}}';$('sk-hold').disabled=st!=='run';
 var signal=st!=='run'?(st==='dead'?'{{t:sneak.msg.012}}':'{{t:sneak.msg.013}}'):sneaking.ph==='look'?'{{t:sneak.msg.014}}':sneaking.ph==='warn'?'{{t:sneak.msg.015}}':'{{t:sneak.msg.016}}';
 if($('sk-signal').textContent!==signal)$('sk-signal').textContent=signal;$('sk-signal').dataset.state=sneaking.ph;
 $('sk-difficulty').textContent='需移動約 '+(6+(lvCap()-1)*2)+' 秒 · '+(sneaking.lv>=4?'{{t:sneak.msg.017}}':'{{t:sneak.msg.018}}');
}
function die(){
 if(st!=='run')return;
 AN.end(sneakAnalytics,earned,earned>0?'complete':'loss',{stage:sneaking.lv,progress_percent:Math.floor(sneaking.pr)});
 st='dead';sneakBusy=false;release();rec=sneaking.score>0&&sneaking.score>=best&&sneaking.score>prevBest;
 shake=reduceMotion?0:.4;qi=Math.floor(Math.random()*quotes.length);
 saySneak('被老闆發現！共通過 '+sneaking.score+' 關，'+(earned>0?'本局入帳 '+fmt(earned)+' 點。':'{{t:sneak.msg.019}}'),earned>0?'win':'lose');
 sneakRank.finish(sneaking.score);
 ui();
}
function award(n,b){earned+=b;S.balance+=b;save();renderAll();AN.progress(sneakAnalytics,{stage:n,bonus_points:b});pops.push({n:n,b:b,age:0});if(pops.length>3)pops.shift();saySneak('完成 '+n+' 關！獎勵 +'+b+' 點已入帳，本局累計 +'+earned+' 點。','win')}
function nextStage(done){
 remember();AN.progress(sneakAnalytics,{stage:done},true);
 const bonus=bonusAt(sneaking.score);
 if(bonus)award(sneaking.score,bonus);
 else saySneak('第 '+done+' 關溜走了！下一關馬上開始。','win');
 flash=.8;shake=0;release();
 AN.resume(sneakAnalytics,{stage:sneaking.lv});
 ui();c.focus();
}
function update(dt){
 if(st!=='run')return;
 const event=sneakRules.advance(sneaking,dt,sneakRandom);
 if(event==='caught')die();
 else if(event)nextStage(event);
}
function sync(now){
 const ms=Math.max(0,now-last);last=now;
 if(!$('view-sneak').hidden&&!document.hidden)sneakRank.update(ms,()=>st==='run',update);
}
function start(){
 if(st==='run')return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){saySneak(LOW_MSG,'lose');return;}
 sneakRank.start(random=>{
  sneakRandom=random||Math.random;sneaking=sneakRules.create(sneakRandom);
  sneakAnalytics=AN.start('sneak',amount);sneakStake=amount;sneakBusy=true;save();renderAll();
  rec=false;earned=0;pops=[];prevBest=best;flash=0;shake=0;release();
  AN.resume(sneakAnalytics,{stage:sneaking.lv});
  saySneak('{{t:sneak.msg.020}}');
  st='run';last=performance.now();ui();c.focus();
 });
}
const art={};
for(const name of ['rainy-office','step-a','step-b','work','away','warn','look']){
 const image=new Image();
 image.src='games/sneak/art/'+name+'.webp';
 art[name]=image;
}
function sprite(name,x,y,height){
 const image=art[name];
 if(!image.naturalWidth)return;
 const width=height*image.naturalWidth/image.naturalHeight;
 g.drawImage(image,x-width/2,y-height,width,height);
}
function draw(){
 const cssWidth=c.clientWidth||W,cssHeight=c.clientHeight||600;
 const height=cssHeight*W/cssWidth;
 const scale=Math.min(2,window.devicePixelRatio||1);
 const pixelsWide=Math.round(cssWidth*scale),pixelsHigh=Math.round(cssHeight*scale);
 if(c.width!==pixelsWide)c.width=pixelsWide;
 if(c.height!==pixelsHigh)c.height=pixelsHigh;
 g.setTransform(pixelsWide/W,0,0,pixelsHigh/height,0,0);
 g.fillStyle='#0c1e2e';
 g.fillRect(0,0,W,height);

 const roomHeight=Math.min(570,height*.67);
 const roomTop=Math.max(112,height*.72-roomHeight*.82);
 const deskY=roomTop+roomHeight*.644, floorY=roomTop+roomHeight*.82;
 const warning=sneaking.ph==='warn', looking=sneaking.ph==='look';
 const room=art['rainy-office'];
 const bossX=W*.709;
 const playerX=32+sneaking.pr/100*340;
 const walking=st==='run'&&sneaking.hold;
 const step=reduceMotion||Math.floor(sneaking.walk/2)%2===0?'step-a':'step-b';

 g.save();
 if(shake>0)g.translate((Math.random()-.5)*8,0);
 if(room.naturalWidth)g.drawImage(room,0,roomTop,W,roomHeight);
 else{
  g.fillStyle='#233a51';g.fillRect(0,roomTop,W,roomHeight*.77);
  g.fillStyle='#a46e3c';g.fillRect(235,deskY,110,floorY-deskY);
  g.fillStyle='#edbc65';g.fillRect(358,deskY-65,34,floorY-deskY+65);
 }
 sprite(sneaking.ph,bossX,deskY,roomHeight*.15);
 g.fillStyle='#0b1425a0';
 g.beginPath();g.ellipse(playerX,floorY-1,19,4,0,0,Math.PI*2);g.fill();
 sprite(walking?step:'work',playerX,floorY,roomHeight*(walking?.21:.225));

 if(warning||looking){
  const markY=deskY-roomHeight*.165;
  g.textAlign='center';g.textBaseline='middle';
  g.font='italic 900 38px system-ui,sans-serif';
  g.lineWidth=6;g.strokeStyle='#101521';
  g.fillStyle=warning?'#ffbd55':'#ff7462';
  g.strokeText(looking?'!!':'!',bossX+39,markY);
  g.fillText(looking?'!!':'!',bossX+39,markY);
 }
 g.restore();

 if(st==='run'){
  g.textAlign='center';g.textBaseline='middle';
  if(flash>0){
   g.fillStyle='#081521ed';g.fillRect(90,roomTop+18,220,38);
   g.fillStyle='#ffedc5';g.font='800 20px system-ui,sans-serif';
   g.fillText(T('ok'),W/2,roomTop+37,204);
  }
  pops.forEach((p,index)=>{
   g.globalAlpha=Math.max(0,1-p.age/2.2);
   const y=floorY+24+index*24-(reduceMotion?0:Math.min(1,p.age*3)*16);
   g.fillStyle='#091725';g.fillRect(78,y-11,244,22);
   g.fillStyle='#ffbe55';g.font='800 16px system-ui,sans-serif';
   g.fillText('{{t:sneak.msg.021}}'+p.b,W/2,y,224);
  });
  g.globalAlpha=1;
  return;
 }

 g.fillStyle='#090e19a8';g.fillRect(0,0,W,height);
 const center=height*.43;
 g.save();
 g.translate(W/2,center);
 g.rotate(reduceMotion?0:-.035);
 g.fillStyle='#ffedc5';g.strokeStyle='#121a24';g.lineWidth=4;
 g.fillRect(-162,-45,324,st==='ready'?94:134);
 g.strokeRect(-162,-45,324,st==='ready'?94:134);
 g.textAlign='center';g.textBaseline='middle';
 g.font='900 30px system-ui,sans-serif';g.fillStyle=st==='ready'?'#101b27':'#942d25';
 g.fillText(st==='ready'?T('title'):T('caught'),0,-15,295);
 g.font='700 15px system-ui,sans-serif';g.fillStyle='#1a2431';
 if(st==='ready')g.fillText(T('tap'),0,19,290);
 else{
  g.fillText(quotes[qi],0,14,290);
  g.fillText(T('reach')(100-Math.floor(sneaking.pr)),0,37,290);
  g.fillText(T('done')(sneaking.score)+(earned>0?' · +'+earned:''),0,60,290);
  if(rec)g.fillText(T('rec'),0,78,290);
 }
 g.restore();
}

$('sk-go').addEventListener('click',start);
function press(e){if(e.button!==undefined&&e.button!==0)return;if(st!=='run'||$('view-sneak').hidden||document.hidden)return;e.preventDefault();sync(performance.now());if(st!=='run')return;c.focus();mouseHold=true;setHold(true);try{e.currentTarget.setPointerCapture(e.pointerId)}catch(_){}ui()}
function lift(){sync(performance.now());mouseHold=false;setHold(keyHold)}
[c,$('sk-hold')].forEach(el=>{el.addEventListener('pointerdown',press);['pointerup','pointercancel','lostpointercapture'].forEach(type=>el.addEventListener(type,lift))});
addEventListener('keydown',e=>{if($('view-sneak').hidden||document.hidden||st!=='run'||e.repeat||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;if([' ','ArrowRight','d'].includes(e.key)){e.preventDefault();sync(performance.now());if(st==='run'){keyHold=true;setHold(true);}}});
addEventListener('keyup',e=>{if([' ','ArrowRight','d'].includes(e.key)){if(!$('view-sneak').hidden)e.preventDefault();sync(performance.now());keyHold=false;setHold(mouseHold)}});
addEventListener('blur',()=>{release();last=performance.now()});
document.addEventListener('visibilitychange',()=>{release();last=performance.now()});
window.addEventListener('hashchange',()=>{release();last=performance.now()});
function loop(t){sync(t);if(!$('view-sneak').hidden&&!document.hidden){if(shake>0)shake=Math.max(0,shake-.016);if(flash>0)flash=Math.max(0,flash-.016);pops.forEach(p=>p.age+=.016);pops=pops.filter(p=>p.age<2.2);ui();draw();}requestAnimationFrame(loop)}
ui();draw();requestAnimationFrame(loop);
  })();

