  /* ---------- 寶寶逃洗澡: endless runner adapted from a standalone page; fixed score milestones award bonus points immediately ---------- */
  var babyBusy=false,babyStake=0,babySay=function(){};
  (function(){
const c=$('baby-canvas'),g=c.getContext('2d'),W=400,H=560,OL='#2b2d42',G={};
const MILESTONES=[200, 500, 900],BONUS=5,KEY='deep-sea-baby-best',SKEY='deep-sea-baby-skin',UNIT=' m';
let analytics=null,paid=0,awarded=new Set(),bpop=[];
const rnd=(a,b)=>a+Math.random()*(b-a),cl=(x,a,b)=>Math.max(a,Math.min(b,x));
const O=(f,w)=>{g.fillStyle=f;g.fill();g.lineWidth=w||3;g.strokeStyle=OL;g.lineJoin='round';g.stroke()};
const C=(x,y,r,f,w)=>{g.beginPath();g.arc(x,y,r,0,7);O(f,w)};
const E=(x,y,rx,ry,f,w)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);O(f,w)};
const F=(x,y,r,f)=>{g.fillStyle=f;g.beginPath();g.arc(x,y,r,0,7);g.fill()};
const RR=(x,y,w,h,r,f,lw)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();O(f,lw)};
const P=(a,f,w)=>{g.beginPath();a.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();O(f,w)};
const L2=(x1,y1,x2,y2,w,col)=>{g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.strokeStyle=col||OL;g.lineWidth=w||3;g.lineCap='round';g.stroke()};
function acc(a,x,y,s){
if(!a)return;g.save();g.translate(x,y);g.scale(s,s);
if(a===1){g.beginPath();g.arc(0,0,13,Math.PI,0);O('#e63946',3);RR(0,-3,20,5,2,'#e63946',2.5)}
else if(a===2)P([[-13,0],[-14,-16],[-7,-8],[0,-20],[7,-8],[14,-16],[13,0]],'#ffd23f',3);
else if(a===3){P([[-11,0],[0,-30],[11,0]],'#ff5d8f',3);C(0,-31,4,'#fff',2.5)}
else E(0,-8,13,4,'#ffe27a',3);
g.restore()}
G.I={title:"{{t:baby.msg.001}}",s1:"{{t:baby.msg.002}}",s2:"{{t:baby.msg.003}}",caught:"{{t:baby.msg.004}}"};
G.skins=[{need:0,n:'{{t:baby.msg.009}}',c:['#a0c4ff','#ffd6a5'],a:0},{need:200,n:'{{t:baby.msg.010}}',c:['#ffc8dd','#ffafcc'],a:1},{need:500,n:'{{t:baby.msg.011}}',c:['#b7e4c7','#74c69d'],a:3},{need:1000,n:'{{t:baby.msg.012}}',c:['#ffd23f','#ff9f1c'],a:2}];
const GY=440,PXL=170;
let dist,gap,py,on,crawl,obs,stun;
let model=babyRules.create(),heldBy,runTime=0;
const rank=timedLeaderboard('baby','baby',babyRules.inputCount,ui);
function syncModel(){const snapshot=model.snapshot();({dist,gap,py,on,crawl,obs,stun}=snapshot);const next=snapshot.shake;if(next)shake=next;}
function control(code){if(!babyRules.input(model,code))return;rank.record(code);syncModel();}
G.reset=()=>{model=babyRules.create();runTime=0;syncModel();};
G.score=()=>model.score();
G.down=p=>{
 const inside=p.x>=303&&p.x<=377&&p.y>=475&&p.y<=535;
 if(inside){
  if(heldBy!==undefined)return;
  heldBy=p.id;control(1);
 }else control(0);
};
G.up=p=>{if(p.id===heldBy){control(3);heldBy=undefined;}};
G.update=dt=>{runTime+=dt;babyRules.advance(model,dt);syncModel();if(model.dead)die(model.dead);};
const mobileStage=matchMedia('(max-width:880px),(pointer:coarse) and (max-width:1100px)');
let viewport={scale:1,x:0,y:0,left:0,top:0,width:W,height:H};
function fitStage(){
  const r=c.getBoundingClientRect();
  if(!r.width||!r.height)return;
  const scale=Math.min(r.width/W,r.height/H);
  const x=(r.width-W*scale)/2,y=r.height-H*scale;
  const density=Math.min(devicePixelRatio||1,2);
  const width=Math.round(r.width*density),height=Math.round(r.height*density);
  if(c.width!==width||c.height!==height){c.width=width;c.height=height;}
  viewport={scale,x,y,left:-x/scale,top:-y/scale,width:r.width/scale,height:r.height/scale};
  g.setTransform(scale*c.width/r.width,0,0,scale*c.height/r.height,
    x*c.width/r.width,y*c.height/r.height);
}
function overlayShift(){return mobileStage.matches?cl(viewport.top,-74,0):0;}

function asset(name){
  const image=new Image();
  image.src='games/baby/art/'+name+'.webp';
  return image;
}
const hall=asset('hall'),momCycle=asset('mom-v2'),babyCycle=asset('baby'),poses=asset('poses');
function hallLayer(scroll,top,bottom,height,width){
  scroll%=width*2;
  const section=Math.floor(scroll/width);
  g.save();g.beginPath();g.rect(viewport.left-12,top,viewport.width+24,bottom-top);g.clip();
  for(let i=-1;i<=Math.ceil(viewport.width/width)+1;i++){
    const flip=(section+i)%2!==0;
    g.save();g.translate(viewport.left+(section+i)*width-scroll+(flip?width:0),viewport.top);
    if(flip)g.scale(-1,1);
    g.drawImage(hall,0,0,width+.5,height);
    g.restore();
  }
  g.restore();
}
function bg(){
  const {left,top,width}=viewport;
  g.fillStyle='#c4aec9';g.fillRect(left-12,top-12,width+24,H-top+24);
  g.fillStyle='#e7cbaa';g.fillRect(left-12,GY,width+24,H-GY+12);
  if(!hall.naturalWidth)return;
  const floorRatio=.83,wallRatio=.7;
  const height=(GY-top)/floorRatio;
  const tile=height*hall.naturalWidth/hall.naturalHeight;
  const seam=top+height*wallRatio;
  hallLayer(180+dist*.23,top,seam,height,tile);
  // The floor shares the same source image while scrolling faster beneath the runners.
  g.save();g.beginPath();g.rect(left-12,seam,width+24,H-seam+12);g.clip();
  const scroll=(180+dist*.66)%(2*tile);
  const section=Math.floor(scroll/tile);
  for(let i=-1;i<=Math.ceil(width/tile)+1;i++){
    const flip=(section+i)%2!==0;
    g.save();g.translate(left+(section+i)*tile-scroll+(flip?tile:0),seam);
    if(flip)g.scale(-1,1);
    g.drawImage(hall,0,hall.naturalHeight*wallRatio,hall.naturalWidth,hall.naturalHeight*(1-wallRatio),0,0,tile+.5,H-seam+12);
    g.restore();
  }
  g.restore();
}
function drawPose(index,x,y,w,h){
  if(!poses.naturalWidth)return false;
  const size=128;
  g.drawImage(poses,index*size,0,size,size,x,y,w,h);
  return true;
}
function drawObs(o){
  const x=o.x;
  if(o.t==='l'){
    if(!drawPose(2,x,GY-30,30,30))RR(x,GY-30,30,30,5,'#f0ab80',1);
  }else if(o.t==='c'){
    if(!drawPose(3,x,GY-28,42,28))RR(x,GY-28,42,28,6,'#89a9a0',1);
  }else if(o.t==='s'){
    const drawn=drawPose(4,x,GY-100,80,66);
    if(!drawn)RR(x,GY-100,80,66,8,'#bf9d77',1);
    const legShade=g.createLinearGradient(0,GY-39,0,GY);
    legShade.addColorStop(0,'#bd936d');legShade.addColorStop(1,'#91684e');
    g.fillStyle=legShade;
    g.beginPath();g.roundRect(x+3,GY-39,8,39,3);g.roundRect(x+69,GY-39,8,39,3);g.fill();
  }
}
function shadow(x,size){
  g.fillStyle='rgba(86,56,77,.19)';
  g.beginPath();g.ellipse(x,GY+1,size*.24,size*.045,0,0,Math.PI*2);g.fill();
}
function drawRun(image,frame,x,y,size){
  if(!image.naturalWidth)return;
  const cell=192;
  g.drawImage(image,frame*cell,0,cell,cell,x-size/2,y-size*174/cell,size,size);
}
function mom(){
  const far=55,near=PXL-43;
  const x=near+(far-near)*cl(gap/220,0,1);
  shadow(x,154);
  drawRun(momCycle,(Math.floor(runTime/.09)+2)%8,x,GY,154);
}
function baby(){
  if(stun>0&&Math.floor(tt*20)%2)return;
  const k=SK();
  shadow(PXL,91);
  if(!on){
    if(!drawPose(0,PXL-20,py-68,46,68))drawRun(babyCycle,3,PXL,py,91);
  }else if(crawl){
    if(!drawPose(1,PXL-19,py-30,38,30))drawRun(babyCycle,2,PXL,py,91);
  }else drawRun(babyCycle,Math.floor(runTime/.064)%8,PXL,py,91);
  if(k.a)acc(k.a,PXL+(crawl&&on?15:2),py-(crawl&&on?18:69),.52);
}
G.draw=()=>{
  const ox=shake>0?(Math.random()-.5)*8:0;
  g.save();g.translate(ox,0);
  bg();obs.forEach(drawObs);mom();baby();g.restore();
  if(st==='run'){
    g.fillStyle=crawl?'#d6b493':'#f1dbbf';
    g.beginPath();g.roundRect(304,477,72,56,15);g.fill();
    clayText('{{t:baby.msg.027}}',340,512,20);
  }
};
let st='ready',rec=false,unl=[],last=0,shake=0,skin=0,best=0,tt=0;
const SK=()=>G.skins[skin],CHY=381,V=$('view-baby');
const T=k=>G.I[k];
const ST=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
best=+ST(KEY)||0;skin=+ST(SKEY)||0;if(!G.skins[skin]||best<G.skins[skin].need)skin=0;
function pick(i){skin=i;try{localStorage.setItem(SKEY,i)}catch(e){}}
function release(){if(st==='run')control(4);heldBy=undefined;}
function say(text,kind){$('baby-msg').textContent=text;$('baby-msg').className='msg'+(kind?' '+kind:'')}
babySay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const next=MILESTONES.find(x=>!awarded.has(x)),live=st==='run';
 setText('baby-score',G.score()+UNIT);setText('baby-best',best+UNIT);setText('baby-pay',fmt(paid)+' 點');
 setText('baby-next',next?fmt(next)+UNIT+' · +'+BONUS+' 點':'{{t:baby.msg.013}}');
 $('baby-gap').value=cl(1-gap/150,0,1);
 $('baby-amount').disabled=babyBusy;$('baby-go').disabled=live||rank.busy();setText('baby-go',live?'{{t:baby.msg.014}}':st==='over'?'{{t:baby.msg.015}}':'{{t:baby.msg.016}}');
 document.querySelectorAll('[data-baby-tier]').forEach(el=>el.setAttribute('aria-current',awarded.has(Number(el.getAttribute('data-baby-tier')))?'step':'false'));
}
function awardBonus(){
 const s=G.score();
 for(const m of MILESTONES){
  if(s<m||awarded.has(m))continue;
  awarded.add(m);paid+=BONUS;S.balance+=BONUS;save();renderAll();
  AN.progress(analytics,{step:s,score:s,milestone:m,bonus_points:BONUS,total_bonus_points:paid});
  bpop.push({age:0,m:m});if(bpop.length>3)bpop.shift();
  say(bonusText(m),'win');
 }
}
function die(m){
 if(st!=='run')return;
 st='over';G.msg=m;shake=reduceMotion?0:.35;release();
 const s=G.score();rank.finish(s);rec=s>best;unl=G.skins.filter(k=>k.need>best&&k.need<=s);
 if(rec){best=s;try{localStorage.setItem(KEY,best)}catch(e){}}
 if(unl.length)pick(G.skins.indexOf(unl[unl.length-1]));
 AN.end(analytics,paid,paid>0?'complete':'loss',{score:s,total_bonus_points:paid});babyBusy=false;renderAll();
 say(localText('{{t:baby.msg.030}}').replace('{distance}',fmt(s)+UNIT)+' '+(paid?bonusTotal():'{{t:baby.msg.017}}'),paid?'win':'lose');
 ui();
}
function start(){
 if(st==='run'||rank.busy())return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return}
 rank.start(random=>{
 analytics=AN.start('baby',amount);babyStake=amount;babyBusy=true;save();renderAll();
 model=babyRules.create(random||Math.random);runTime=0;syncModel();heldBy=undefined;paid=0;awarded=new Set();bpop=[];rec=false;unl=[];shake=0;st='run';last=performance.now();say('{{t:baby.msg.018}}');ui();c.focus();
 },ui,{rulesVersion:babyRules.rulesVersion});
}
function panel(x,y,w,h,color){
  g.fillStyle=color;g.beginPath();g.roundRect(x,y,w,h,15);g.fill();
}
function clayText(text,x,y,size,color='#674c42'){
  g.font='700 '+size+'px "Noto Sans TC",system-ui,sans-serif';
  g.textAlign='center';g.fillStyle=color;g.fillText(text,x,y,265);
}
function overlay(){
  g.save();
  g.fillStyle='rgba(80,44,68,.22)';
  g.fillRect(viewport.left,viewport.top,viewport.width,viewport.height);
  g.translate(0,overlayShift());
  if(st==='ready'){
    panel(51,149,298,166,'#f4dec6');
    clayText(T('title'),W/2,194,29);
    clayText(T('s1'),W/2,243,16);
    clayText(T('s2'),W/2,271,16);
    clayText('{{t:baby.msg.031}}',W/2,296,13,'#865569');
  }else{
    const cardHeight=103+(rec?20:0)+(paid?20:0);
    const cardTop=CHY-64-cardHeight;
    panel(63,cardTop,274,cardHeight,'#f4dec6');
    clayText(T('caught'),W/2,cardTop+34,19);
    clayText(G.score()+' m',W/2,cardTop+80,36);
    if(rec)clayText('{{t:baby.msg.020}}',W/2,cardTop+104,14,'#924d63');
    if(paid)clayText(bonusTotal(),W/2,cardTop+cardHeight-17,13,'#924d63');
    if(unl.length)clayText('{{t:baby.msg.021}}'+unl.map(k=>k.n).join('、'),W/2,CHY-39,13,'#56394c');
  }
  const n=G.skins.length;
  G.skins.forEach((k,i)=>{
    const x=W/2+(i-(n-1)/2)*72,locked=best<k.need;
    panel(x-25,CHY-24,50,48,i===skin?'#f5d297':locked?'#d7c8c2':k.c[0]);
    if(locked)clayText(k.need,x,CHY+5,14);
    else if(k.a)acc(k.a,x,CHY+9,.72);
    else if(babyCycle.naturalWidth)g.drawImage(babyCycle,58,5,86,85,x-17,CHY-17,34,34);
  });
  panel(124,CHY+32,152,26,'#f4dec6');
  clayText(SK().n,W/2,CHY+50,14);
  g.restore();
}
function localText(text){return window.deepSeaI18n?.text(text)??text;}
function bonusText(distance){
  return localText('{{t:baby.msg.028}}').replace('{distance}',fmt(distance)+UNIT).replace('{points}',BONUS);
}
function bonusTotal(){
  return localText('{{t:baby.msg.029}}').replace('{points}',paid);
}
function bonusDraw(){
  if(st!=='run')return;
  bpop.forEach(p=>{
    const y=Math.max(viewport.top+97,135)-Math.min(1,p.age*3)*10;
    g.globalAlpha=Math.max(0,1-p.age/1.8);
    panel(69,y-23,262,37,'#f4dec6');
    clayText(bonusText(p.m),W/2,y+1,15,'#844f68');
    g.globalAlpha=1;
  });
}
const pos=e=>{const r=c.getBoundingClientRect();return{x:(e.clientX-r.left-viewport.x)/viewport.scale,y:(e.clientY-r.top-viewport.y)/viewport.scale,id:e.pointerId}};
c.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 const p=pos(e);
 if(st!=='run'){
  const n=G.skins.length;
  if(Math.abs(p.y-CHY-overlayShift())<32){for(let i=0;i<n;i++)if(Math.abs(p.x-(W/2+(i-(n-1)/2)*72))<32){if(best>=G.skins[i].need)pick(i);return}}
  say(st==='over'?'{{t:baby.msg.025}}':'{{t:baby.msg.026}}');return}
 e.preventDefault();c.focus();try{c.setPointerCapture(e.pointerId)}catch(_){}
 G.down(p)});
['pointerup','pointercancel'].forEach(n=>c.addEventListener(n,e=>{if(st==='run'&&G.up)G.up({id:e.pointerId})}));
c.addEventListener('contextmenu',e=>e.preventDefault());
const KM={' ':[190,300],ArrowUp:[190,300],ArrowLeft:[40,300],ArrowRight:[360,300],ArrowDown:[350,505],x:[350,505]};
addEventListener('keydown',e=>{const m=KM[e.key];if(!m||V.hidden||document.hidden||st!=='run'||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;e.preventDefault();if(e.repeat)return;G.down({x:m[0],y:m[1],id:'k'+e.key})});
addEventListener('keyup',e=>{if(KM[e.key]&&st==='run'&&G.up&&!V.hidden)G.up({id:'k'+e.key})});
addEventListener('blur',()=>{release();last=performance.now()});
document.addEventListener('visibilitychange',()=>{release();last=performance.now()});
window.addEventListener('hashchange',()=>{release();last=performance.now()});
$('baby-go').addEventListener('click',start);
function loop(ts){const dt=Math.min(.05,Math.max(0,(ts-last)/1000)||0);last=ts;
 if(!V.hidden&&!document.hidden){tt+=dt;if(shake>0)shake-=dt;bpop.forEach(p=>p.age+=dt);bpop=bpop.filter(p=>p.age<1.8);
  if(st==='run')rank.update(dt*1000,()=>st==='run',step=>{G.update(step);if(st==='run')awardBonus()})
  fitStage();G.draw();bonusDraw();if(st!=='run')overlay();ui()}
 requestAnimationFrame(loop)}
G.reset();ui();G.draw();overlay();requestAnimationFrame(loop);
  })();
