  /* ---------- 胖老闆追人: endless runner adapted from a standalone page; fixed score milestones award bonus points immediately ---------- */
  var bossBusy=false,bossStake=0,bossSay=function(){};
  (function(){
const c=$('boss-canvas'),g=c.getContext('2d'),W=400,H=560,OL='#2b2d42',G={};
const MILESTONES=[200, 500, 900],BONUS=5,KEY='deep-sea-boss-best',SKEY='deep-sea-boss-skin',UNIT=' m';
let analytics=null,paid=0,awarded=new Set(),bpop=[];
const rnd=(a,b)=>a+Math.random()*(b-a),cl=(x,a,b)=>Math.max(a,Math.min(b,x));
const O=(f,w)=>{g.fillStyle=f;g.fill();g.lineWidth=w||3;g.strokeStyle=OL;g.lineJoin='round';g.stroke()};
const C=(x,y,r,f,w)=>{g.beginPath();g.arc(x,y,r,0,7);O(f,w)};
const E=(x,y,rx,ry,f,w)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);O(f,w)};
const F=(x,y,r,f)=>{g.fillStyle=f;g.beginPath();g.arc(x,y,r,0,7);g.fill()};
const RR=(x,y,w,h,r,f,lw)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();O(f,lw)};
const P=(a,f,w)=>{g.beginPath();a.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();O(f,w)};
const L2=(x1,y1,x2,y2,w,col)=>{g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.strokeStyle=col||OL;g.lineWidth=w||3;g.lineCap='round';g.stroke()};
function tx(s,x,y,sz,col,al){g.font='800 '+sz+'px "Noto Sans TC",system-ui,sans-serif';g.textAlign=al||'center';g.lineJoin='round';g.lineWidth=Math.min(3,sz/8);g.strokeStyle=OL;g.strokeText(s,x,y,W-30);g.fillStyle=col;g.fillText(s,x,y,W-30)}
function acc(a,x,y,s){
if(!a)return;g.save();g.translate(x,y);g.scale(s,s);
if(a===1){g.beginPath();g.arc(0,0,13,Math.PI,0);O('#e63946',3);RR(0,-3,20,5,2,'#e63946',2.5)}
else if(a===2)P([[-13,0],[-14,-16],[-7,-8],[0,-20],[7,-8],[14,-16],[13,0]],'#ffd23f',3);
else if(a===3){P([[-11,0],[0,-30],[11,0]],'#ff5d8f',3);C(0,-31,4,'#fff',2.5)}
else E(0,-8,13,4,'#ffe27a',3);
g.restore()}
G.I={bs:n=>'最高 '+n,tap:'',title:"{{t:boss.msg.001}}",s1:"{{t:boss.msg.002}}",s2:"{{t:boss.msg.003}}",caught:"{{t:boss.msg.004}}",fat:n=>'老闆吃了 '+n+' 個甜甜圈',sh:['{{t:boss.msg.005}}','{{t:boss.msg.006}}','{{t:boss.msg.007}}']};
G.skins=[{need:0,n:'{{t:boss.msg.008}}',c:['#4cc9f0','#1d3557'],a:0},{need:200,n:'{{t:boss.msg.009}}',c:['#ffb703','#fb8500'],a:1},{need:500,n:'{{t:boss.msg.010}}',c:['#e63946','#9d0208'],a:4},{need:1000,n:'{{t:boss.msg.011}}',c:['#ffd23f','#e76f51'],a:2}];
const GY=440,PXL=170;
let dist,v,gap,fat,py,vy,on,slide,sid,obs,nextAt,stun,fx;
let model=bossRules.create(),heldBy,runTime=0;
const rank=timedLeaderboard('boss','boss',5,ui);
function syncModel(){({dist,v,gap,fat,py,vy,on,slide,sid,obs,nextAt,stun,fx}=model.snapshot());const next=model.snapshot().shake;if(next)shake=next;}
function control(code){if(!bossRules.input(model,code))return;rank.record(code);syncModel();}
G.reset=()=>{model=bossRules.create();runTime=0;syncModel();};
G.score=()=>model.score();
G.extra=()=>T('fat')(fat);
G.down=p=>{
 const code=Math.hypot(p.x-340,p.y-505)<50?2:0;
 control(code);heldBy=p.id;
};
G.up=p=>{if(p.id===heldBy){control(3);heldBy=undefined;}};
G.update=dt=>{runTime+=dt;bossRules.advance(model,dt);syncModel();if(model.dead)die(model.dead);};
const office = new Image();
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

function bg(){
  const {left,top,width}=viewport;
  g.fillStyle='#29434a';
  g.fillRect(left-12,top-12,width+24,H-top+24);
  if(office.naturalWidth){
    const height=H-top;
    const tile=height*office.naturalWidth/office.naturalHeight;
    const offset=dist*.24%tile;
    for(let x=left-offset-tile;x<left+width+12;x+=tile){
      g.drawImage(office,x,top-12,tile+.5,height+12);
    }
  }
  g.fillStyle='#75685f';
  g.fillRect(left-12,GY,width+24,3);
  const shade=g.createLinearGradient(0,GY,0,H);
  shade.addColorStop(0,'#716861');
  shade.addColorStop(1,'#353b3d');
  g.fillStyle=shade;
  g.fillRect(left-12,GY+3,width+24,H-GY+12);
  for(let x=left-dist%65;x<left+width+65;x+=65){
    L2(x,GY+4,x-30,H,1,'#605a56');
  }
}
const officeProps=new Image();
officeProps.src='games/boss/art/office-props.webp';
function drawOfficeProp(index,x,y,w,h){
  if(!officeProps.naturalWidth)return false;
  const cell=128;
  g.drawImage(officeProps,index*cell,0,cell,cell,x,y,w,h);
  return true;
}
function drawObs(o){
  const x=o.x;
  if(o.t==='t'||o.t==='b'){
    const width=o.t==='t'?34:26;
    g.fillStyle='rgba(38,28,22,.29)';
    g.beginPath();g.ellipse(x+width/2,GY+1,width*.56,2.5,0,0,Math.PI*2);g.fill();
  }
  if(o.t==='t'){
    if(drawOfficeProp(0,x,GY-38,34,38))return;
    RR(x,GY-37,34,37,3,'#c99b6b',2);
    L2(x+2,GY-24,x+32,GY-24,2,'#97603e');
    RR(x+10,GY-19,14,9,2,'#f1dfbd',1);
  }else if(o.t==='b'){
    if(drawOfficeProp(1,x,GY-52,26,52))return;
    RR(x,GY-51,26,51,3,'#687877',2);
    RR(x+4,GY-47,18,18,2,'#b8c3b8',1.5);
    L2(x+8,GY-42,x+18,GY-42,2,'#415658');
  }else if(o.t==='h'){
    L2(x+3,GY-153,x+3,GY-116,1.5,'#a88c70');
    L2(x+87,GY-153,x+87,GY-116,1.5,'#a88c70');
    F(x+3,GY-153,2.2,'#d5af7e');F(x+87,GY-153,2.2,'#d5af7e');
    if(drawOfficeProp(2,x,GY-120,90,80))return;
    P([[x,GY-120],[x+24,GY-112],[x+64,GY-112],[x+90,GY-120],
      [x+90,GY-48],[x+64,GY-40],[x+24,GY-40],[x,GY-48]],'#e8c79f',2);
    L2(x+3,GY-55,x+23,GY-49,4,'#b44f42');
    L2(x+24,GY-48,x+64,GY-48,4,'#b44f42');
    L2(x+65,GY-49,x+87,GY-55,4,'#b44f42');
  }else if(o.t==='d'){
    if(drawOfficeProp(3,x-12,GY-112,24,24))return;
    C(x,GY-100,12,'#d88e48',2);
    F(x,GY-102,10,'#f18ba3');
    C(x,GY-102,3.5,'#735443',1.5);
    F(x-6,GY-106,1.5,'#ffe4a8');
    F(x+6,GY-101,1.5,'#fff3e3');
  }else{
    const cup=g.createLinearGradient(x-9,0,x+9,0);
    cup.addColorStop(0,'#8b624d');cup.addColorStop(.55,'#d4aa7b');cup.addColorStop(1,'#a77957');
    g.fillStyle=cup;
    g.beginPath();g.moveTo(x-9,GY-27);g.lineTo(x+9,GY-27);
    g.lineTo(x+6,GY-9);g.quadraticCurveTo(x,GY-6,x-6,GY-9);g.closePath();g.fill();
    g.fillStyle='#493d36';g.beginPath();g.roundRect(x-10,GY-29,20,5,2);g.fill();
    g.fillStyle='#edce9c';g.fillRect(x-6,GY-21,12,5);
  }
}
office.src='games/boss/art/office.webp';
const bossTorso=new Image();
bossTorso.src='games/boss/art/boss-run.webp';
const employeeTorsos=G.skins.map((_,index)=>{
  const image=new Image();
  image.src='games/boss/art/employee-run'+(index?'-'+index:'')+'.webp';
  return image;
});

const bossCycle=new Image();
bossCycle.src='games/boss/art/boss-cycle.webp';
const employeeCycles=G.skins.map((_,index)=>{
  const image=new Image();
  image.src='games/boss/art/employee-cycle'+(index?'-'+index:'')+'.webp';
  return image;
});
function drawCycle(image,frame,x,scale,heavy){
  if(!image.naturalWidth)return false;
  const cell=128,size=88*scale;
  g.fillStyle='rgba(39,34,30,.24)';
  g.beginPath();
  g.ellipse(x,GY+1,17*scale,3*scale,0,0,Math.PI*2);
  g.fill();
  g.drawImage(image,frame*cell,0,cell,cell,x-size/2,GY-size*113/cell,size,size);
  if(!heavy)acc(SK().a,x+9,GY-72,.73);
  return true;
}

// Shoe coordinates use the sole as their origin. The tail of the
// stance phase pivots over the toe before the foot leaves the floor.
function foot(phase){
  const stance=.44;
  if(phase<stance){
    const step=phase/stance;
    const push=cl((step-.68)/.32,0,1);
    const angle=.52*push*push;
    return [17-35*step,-9*Math.sin(angle),angle];
  }
  const swing=(phase-stance)/(1-stance);
  const travel=swing*swing*(3-2*swing);
  const lift=Math.sin(Math.PI*swing);
  return [-18+35*travel,-9*Math.sin(.52)*(1-swing)-14*lift,
    .52*(1-swing)-.48*lift];
}
function leg(hipX,hipY,[x,y,angle=0],color,shoe){
  const ankleX=x+4*Math.sin(angle);
  const ankleY=y-4*Math.cos(angle);
  const dx=ankleX-hipX,dy=ankleY-hipY;
  const length=Math.hypot(dx,dy);
  // In side view, the knee bends forward and the heel folds back.
  const bend=Math.sqrt(Math.max(0,17*17-length*length/4))/length;
  const kneeX=hipX+dx/2+dy*bend,kneeY=hipY+dy/2-dx*bend;
  g.beginPath();
  g.moveTo(hipX,hipY);
  g.lineTo(kneeX,kneeY);
  g.lineTo(ankleX,ankleY);
  g.lineJoin=g.lineCap='round';
  g.strokeStyle=OL;g.lineWidth=10;g.stroke();
  g.strokeStyle=color;g.lineWidth=7;g.stroke();
  g.save();
  g.translate(x,y);
  g.rotate(angle);
  RR(-5,-6,14,6,2,shoe,1.2);
  g.restore();
}
function runner(heavy,x,y,scale,phase,airborne,sliding){
  const k=SK(),defaultSkin=skin===0;
  const pants=heavy?'#584841':defaultSkin?'#e0c7a2':k.c[1];
  const farPants=heavy?'#433a39':defaultSkin?'#ac9479':k.c[1];
  const swing=Math.sin(phase*Math.PI*2);
  g.fillStyle=airborne?'rgba(39,34,30,.14)':'rgba(39,34,30,.24)';
  g.beginPath();
  g.ellipse(x,GY+1,(heavy?22:16)*scale,3*scale,0,0,Math.PI*2);
  g.fill();
  g.save();
  g.translate(x,y);
  g.scale(scale,scale);
  if(sliding){
    // Rotate around the torso and lower the whole pose within the slide hitbox.
    g.translate(-26,-17);
    g.rotate(1.43);
  }
  const hip=(sliding?-24:-29)+(airborne||sliding?0:1.3*Math.cos(phase*Math.PI*4));
  const back=sliding?[-5,-7]:airborne?[-12,-7]:foot((phase+.5)%1);
  const front=sliding?[9,-5]:airborne?[14,-12]:foot(phase);
  leg(heavy?-8:-3,hip,back,farPants,heavy?'#383438':'#bfb3a2');
  leg(heavy?7:2,hip,front,pants,heavy?'#403a3b':'#f2e4d1');
  const torso=heavy?bossTorso:employeeTorsos[skin];
  const height=heavy?49:44;
  const width=torso.naturalWidth*height/(torso.naturalHeight||1);
  g.translate(0,hip+2);
  if(!airborne&&!sliding)g.rotate(swing*(heavy?.055:.08));
  E(0,-1,heavy?19:8,heavy?5:4,pants,1.2);
  if(width) g.drawImage(torso,-width*(heavy?.46:.42),-height,width,height);
  if(!heavy)acc(k.a,9,-height,0.73);
  g.restore();
}
function boss(){
  const scale=Math.min(2.05,1.35+fat*.1);
  const farX=35*scale;
  const nearX=PXL-34*scale;
  const x=nearX+(farX-nearX)*cl(gap/220,0,1);
  const phase=(dist/148+.27)%1;
  const frame=(Math.floor(runTime/.09)+2)%8;
  if(!drawCycle(bossCycle,frame,x,scale,true))runner(true,x,GY,scale,phase,false,false);
}
function emp(){
  if(stun>0&&Math.floor(tt*20)%2)return;
  const frame=Math.floor(runTime/.075)%8;
  if(on&&!slide&&drawCycle(employeeCycles[skin],frame,PXL,1,false))return;
  runner(false,PXL,py,1,(dist/114)%1,!on,slide&&on);
}
G.draw=()=>{
const ox=shake>0?(Math.random()-.5)*10:0;g.save();g.translate(ox,0);
bg();obs.forEach(drawObs);boss();emp();g.restore();
fx.forEach(f=>{g.globalAlpha=1-f.t/.8;tx(f.s,f.x,f.y-f.t*50,26,'#ffd23f');g.globalAlpha=1});
if(!mobileStage.matches){
  tx(G.score()+' m',16,42,26,'#fff0d6','left');
  const gapFill=cl(1-gap/220,0,1);
  RR(16,57,W-32,8,4,'#59534b',1);
  if(gapFill>0)RR(16,57,Math.max(8,(W-32)*gapFill),8,4,'#e9aa63',1);
}
if(st==='run'){C(340,505,44,'rgba(32,48,53,.78)',3);L2(314,519,361,519,2,'#e7ceb3');L2(327,509,352,498,8,'#fff1d9');L2(327,509,318,511,4,'#fff1d9');L2(332,506,345,512,4,'#fff1d9');F(358,492,6,'#fff1d9')}};
let st='ready',rec=false,unl=[],last=0,shake=0,skin=0,best=0,tt=0;
const SK=()=>G.skins[skin],CHY=369,V=$('view-boss');
const T=k=>G.I[k];
const ST=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
best=+ST(KEY)||0;skin=+ST(SKEY)||0;if(!G.skins[skin]||best<G.skins[skin].need)skin=0;
function pick(i){skin=i;try{localStorage.setItem(SKEY,i)}catch(e){}}
function release(){if(st==='run')control(4);heldBy=undefined;}
function say(text,kind){$('boss-msg').textContent=text;$('boss-msg').className='msg'+(kind?' '+kind:'')}
bossSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const next=MILESTONES.find(x=>!awarded.has(x)),live=st==='run';
 $('boss-gap').value=cl(1-gap/220,0,1);
 setText('boss-score',G.score()+UNIT);setText('boss-best',best+UNIT);setText('boss-pay',fmt(paid)+' 點');
 setText('boss-next',next?fmt(next)+UNIT+' · +'+BONUS+' 點':'{{t:boss.msg.012}}');
 $('boss-amount').disabled=bossBusy;$('boss-go').disabled=live||rank.busy();setText('boss-go',live?'{{t:boss.msg.013}}':st==='over'?'{{t:boss.msg.014}}':'{{t:boss.msg.015}}');
 document.querySelectorAll('[data-boss-tier]').forEach(el=>el.setAttribute('aria-current',awarded.has(Number(el.getAttribute('data-boss-tier')))?'step':'false'));
}
function awardBonus(){
 const s=G.score();
 for(const m of MILESTONES){
  if(s<m||awarded.has(m))continue;
  awarded.add(m);paid+=BONUS;S.balance+=BONUS;save();renderAll();
  AN.progress(analytics,{step:s,score:s,milestone:m,bonus_points:BONUS,total_bonus_points:paid});
  bpop.push({age:0,m:m});if(bpop.length>3)bpop.shift();
  say('達成 '+fmt(m)+UNIT+'！BONUS +'+BONUS+' 點已入帳，本局累計 +'+paid+' 點。','win');
 }
}
function die(m){
 if(st!=='run')return;
 st='over';G.msg=m;shake=reduceMotion?0:.35;release();
 const s=G.score();rank.finish(s);rec=s>best;unl=G.skins.filter(k=>k.need>best&&k.need<=s);
 if(rec){best=s;try{localStorage.setItem(KEY,best)}catch(e){}}
 if(unl.length)pick(G.skins.indexOf(unl[unl.length-1]));
 AN.end(analytics,paid,paid>0?'complete':'loss',{score:s,total_bonus_points:paid});bossBusy=false;renderAll();
 say('被老闆抓住了，本局 '+fmt(s)+UNIT+'。'+(paid?'BONUS 共 '+paid+' 點已入帳。':'{{t:boss.msg.016}}'),paid?'win':'lose');
 ui();
}
function start(){
 if(st==='run'||rank.busy())return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return}
 rank.start(random=>{
 analytics=AN.start('boss',amount);bossStake=amount;bossBusy=true;save();renderAll();
 model=bossRules.create(random||Math.random);runTime=0;syncModel();heldBy=undefined;paid=0;awarded=new Set();bpop=[];rec=false;unl=[];shake=0;st='run';last=performance.now();say('{{t:boss.msg.017}}');ui();c.focus();
 },ui);
}
function paperText(text,x,y,size,color,weight=600,maxWidth=280){
  g.font=weight+' '+size+'px "Noto Sans TC","PingFang TC",system-ui,sans-serif';
  g.textAlign='center';
  g.fillStyle=color;
  g.fillText(text,x,y,maxWidth);
}
function paper(x,y,w,h,tint){
  g.fillStyle='rgba(39,27,21,.26)';
  g.beginPath();g.roundRect(x+2,y+4,w,h,7);g.fill();
  g.fillStyle=tint;
  g.beginPath();g.roundRect(x,y,w,h,7);g.fill();
}
function overlay(){
  g.save();
  g.fillStyle='rgba(40,32,27,.22)';
  g.fillRect(viewport.left,viewport.top,viewport.width,viewport.height);
  g.translate(0,overlayShift());
  paper(51,149,298,166,'#eee0c5');
  g.fillStyle='#aa7457';g.fillRect(77,211,246,1);
  if(st==='ready'){
    paperText(T('title'),W/2,194,27,'#49332b',750);
    paperText(T('s1'),W/2,246,16,'#594239');
    paperText(T('s2'),W/2,275,16,'#594239');
  }else{
    paperText(T(G.msg),W/2,194,20,'#594239');
    paperText(G.score()+' m',W/2,255,37,'#49332b',750);
    if(rec)paperText('{{t:boss.msg.019}}',W/2,284,14,'#8f4837',700);
    if(paid>0)paperText('{{t:boss.msg.021}}'+paid+' 點',W/2,304,13,'#8f4837');
    if(unl.length)paperText('{{t:boss.msg.020}}'+unl.map(k=>k.n).join('、'),W/2,334,14,'#fff3df',700);
  }
  const n=G.skins.length;
  G.skins.forEach((k,i)=>{
    const x=W/2+(i-(n-1)/2)*72,locked=best<k.need;
    paper(x-26,CHY-27,52,55,i===skin?'#eaca97':locked?'#c0b6a6':'#e7d9bf');
    g.fillStyle=i===skin?'#a16547':'#8a7d6b';
    g.fillRect(x-7,CHY-23,14,3);
    const portrait=employeeTorsos[i];
    if(!locked&&portrait.naturalWidth){
      const sw=portrait.naturalWidth*.43,sh=portrait.naturalHeight*.5;
      g.drawImage(portrait,portrait.naturalWidth*.38,0,sw,sh,x-14,CHY-15,28,31);
      if(k.a)acc(k.a,x,CHY-9,.42);
    }else paperText(k.need,x,CHY+9,15,'#534941',650,44);
  });
  paper(119,CHY+38,162,30,'#e8d6b9');
  paperText(SK().n,W/2,CHY+58,14,'#594239',650,150);
  g.restore();
}
function bonusDraw(){
  bpop.forEach(p=>{
    g.globalAlpha=Math.max(0,1-p.age/1.8);
    const y=166-Math.min(1,p.age*3)*16;
    paper(115,y-25,170,52,'#eee0c5');
    paperText('BONUS +'+BONUS+' 點',W/2,y-3,16,'#874f38',750);
    paperText(fmt(p.m)+UNIT+' 里程碑',W/2,y+16,13,'#594239');
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
  say(st==='over'?'{{t:boss.msg.024}}':'{{t:boss.msg.025}}');return}
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
$('boss-go').addEventListener('click',start);
function loop(ts){const dt=Math.min(.05,Math.max(0,(ts-last)/1000)||0);last=ts;
 if(!V.hidden&&!document.hidden){tt+=dt;if(shake>0)shake-=dt;bpop.forEach(p=>p.age+=dt);bpop=bpop.filter(p=>p.age<1.8);
  if(st==='run')rank.update(dt*1000,()=>st==='run',step=>{G.update(step);if(st==='run')awardBonus()})
  fitStage();G.draw();bonusDraw();if(st!=='run')overlay();ui()}
 requestAnimationFrame(loop)}
G.reset();ui();G.draw();overlay();requestAnimationFrame(loop);
  })();
