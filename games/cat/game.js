  /* ---------- Rooftop Cat: endless rooftop run; milestone bonuses are credited to the shared wallet when reached ---------- */
  var catBusy=false,catStake=0,catSay=function(){};
  (function(){
const c=$('ct-canvas'),g=c.getContext('2d'),W=400,H=560,CX=110,OL='#1f3a40';
// All art is drawn in code in a flat travel-poster style (see games/cat/design/README.md); no image files.
// Draw at the screen's pixel density so the art stays sharp on phones; all drawing below stays in 400×560 units.
const DPR=Math.min(2,Math.max(1,window.devicePixelRatio||1));c.width=W*DPR;c.height=H*DPR;
// Visual-only effects (dust, sparkles, speed lines). They never touch catRules, scoring or the wallet.
let fx=[],wasOn=true,jumped=false,taught=false,cityT=-9;
function puff(x,y,n,col,up){if(reduceMotion)n=Math.min(n,2);for(let i=0;i<n;i++)fx.push({x:x+(Math.random()-.5)*20,y:y-Math.random()*4,vx:(Math.random()-.5)*90-(up?0:60),vy:-Math.random()*(up?160:60),r:3+Math.random()*4,t:0,life:.45+Math.random()*.25,col:col,star:up})}
// Milestones are deliberately far apart. Distances were calibrated by simulating noisy players (see GAME_RULES.md):
// ~35% of average players reach 150 m, ~7% reach 300 m (break-even: 3+7 = 10), and 1,000 m is for the best players only.
const MILESTONES=[[150,3],[300,7],[500,15],[750,30],[1000,60]],ENDLESS_FROM=1000,ENDLESS_STEP=250,ENDLESS_BONUS=40,LADDER=[150,300,500,750,1000,1250];
const bonusAt=m=>{for(const t of MILESTONES)if(t[0]===m)return t[1];return m>ENDLESS_FROM&&(m-ENDLESS_FROM)%ENDLESS_STEP===0?ENDLESS_BONUS:0};
const nextMilestone=s=>{for(const t of MILESTONES)if(t[0]>s)return t;return [ENDLESS_FROM+(Math.floor((s-ENDLESS_FROM)/ENDLESS_STEP)+1)*ENDLESS_STEP,ENDLESS_BONUS]};
let best=0;try{best=+localStorage.getItem('deep-sea-cat-best')||0}catch(e){}
let analytics=null,earned=0,awarded=0,pops=[];
const O=(f,w)=>{g.fillStyle=f;g.fill();g.lineWidth=w||4;g.strokeStyle=OL;g.lineJoin='round';g.stroke()};
const C=(x,y,r,f,w)=>{g.beginPath();g.arc(x,y,r,0,7);O(f,w||3)};
const F=(x,y,r,f)=>{g.fillStyle=f;g.beginPath();g.arc(x,y,r,0,7);g.fill()};
// Chunky 3D title text: dark extrusion, thick outline, then a light-to-colour gradient face.
const FONT='"Lilita One","Nunito","Noto Sans TC",system-ui,sans-serif';
try{document.fonts&&['40px "Lilita One"','900 40px "Nunito"'].forEach(f=>document.fonts.load(f).catch(()=>{}))}catch(e){}
const mix=(h,t)=>{const n=parseInt(h.slice(1),16),c=[n>>16,n>>8&255,n&255].map(v=>Math.round(v+(255-v)*t));return 'rgb('+c+')'};
const dark=h=>{const n=parseInt(h.slice(1),16);return 'rgb('+[n>>16,n>>8&255,n&255].map(v=>Math.round(v*.72))+')'};
function tx(s,x,y,sz,col){g.font='900 '+sz+'px '+FONT;g.textAlign='center';g.lineJoin='round';const mw=W-30,lw=Math.max(3,sz/4.2),ex=sz<20?1:Math.max(2,Math.round(sz*.08));
g.strokeStyle=OL;g.lineWidth=lw;for(let i=ex;i>=0;i--)g.strokeText(s,x,y+i,mw);
const gr=g.createLinearGradient(0,y-sz*.75,0,y+sz*.1);gr.addColorStop(0,mix(col,.65));gr.addColorStop(.5,col);gr.addColorStop(1,dark(col));
g.fillStyle=gr;g.fillText(s,x,y,mw)}
let st='ready',catRandom=Math.random,cat=catRules.create(),tt=0,shake=0,rec=false,last=0;
const catRank=timedLeaderboard('cat','ct',catRules.inputCount,ui);
const score=()=>catRules.score(cat);
function say(text,kind){$('ct-msg').textContent=text;$('ct-msg').className='msg'+(kind?' '+kind:'')}
catSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function award(m,b){
 earned+=b;S.balance+=b;save();renderAll();
 AN.progress(analytics,{step:m,score:m,bonus_points:b});
 pops.push({m:m,b:b,age:0});if(pops.length>3)pops.shift();
 say('到達 '+m+' 公尺！獎勵 +'+b+' 點已入帳，本局累計 +'+earned+' 點。','win');
}
function ui(){
 const s=score(),nx=nextMilestone(s),live=st==='run';
 setText('ct-score',s+' m');setText('ct-best',best+' m');setText('ct-next',nx[0]+' m · +'+nx[1]);
 $('ct-amount').disabled=catBusy;$('ct-go').disabled=live||catRank.busy();setText('ct-go',live?'{{t:cat.msg.001}}':st==='over'?'{{t:cat.msg.002}}':'{{t:cat.msg.003}}');
 let tier=0;LADDER.forEach(m=>{if(s>=m)tier=m});
 document.querySelectorAll('[data-ct-tier]').forEach(el=>el.setAttribute('aria-current',st!=='ready'&&tier>0&&Number(el.dataset.ctTier)===tier?'step':'false'));
}
function die(){
 if(st!=='run')return;
 st='over';cat.hold=false;paused=false;if(panel==='pause')panel=null;sfx('fall');shake=reduceMotion?0:.35;const s=score();rec=s>best;
 if(rec){best=s;try{localStorage.setItem('deep-sea-cat-best',best)}catch(e){}}
 AN.end(analytics,earned,earned>0?'complete':'loss',{score:s});catBusy=false;save();renderAll();
 if(!earned)say('跑了 '+s+' 公尺，這一局沒有獎勵。','lose');
 else say('跑了 '+s+' 公尺，本局共入帳 '+fmt(earned)+' 點。','win');
 catRank.finish(s);
 ui();
}
function update(dt){
 tt+=dt;if(shake>0)shake-=dt;
 pops.forEach(p=>{p.age+=dt});pops=pops.filter(p=>p.age<2.2);
 fx.forEach(p=>{p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.star?260:90)*dt});fx=fx.filter(p=>p.t<p.life);
 if(st!=='run'){cat.sq*=.86;return}
 catRules.advance(cat,dt,catRandom);
 if(cat.on&&!wasOn){puff(CX,cat.cy,6,'#f7efd9');K.landT=tt;sfx('land')}
 if(!cat.on&&wasOn&&cat.vy<0){puff(CX-6,cat.cy,4,'#f7efd9');K.jumpT=tt;sfx('jump');if(!jumped){jumped=true;if(!taught)firstJumpT=tt;taught=true}}
 wasOn=cat.on;
 const reached=score();
 while(awarded<reached){awarded++;const b=bonusAt(awarded);if(b){award(awarded,b);sfx('coin');puff(CX+10,cat.cy-40,14,'#e8b45a',true)}}
 if(cat.dead)die();
}
// The calico cat: a slim, natural cat drawn in code on a procedural rig, in a flat illustration style: no
// outlines, soft silhouettes, white coat with organic dark-brown and caramel-tabby patches. Motion: a rotary gallop whose spine gathers and stretches,
// a lagging tail that balances, push-off and landing poses, ears that flatten with speed, a head that looks
// up on take-off and down toward the landing, and a sit-and-wash idle. Visual only: catRules owns position.
const KC={w:'#fbf9f4',ws:'#e8e2d8',o:'#bb7d4b',st:'#7d5236',b:'#4f3a2e',pink:'#eeb0ab',iris:'#a8c46a',pupil:'#2b2420',bell:'#f0c04f',collar:'#5f9ea0',eyeL:'#4a3a32',mouth:'#b39486'};
const K={p:0,lastD:0,lastT:0,tail:null,jumpT:-9,landT:-9};
const TAU=Math.PI*2;
function chain(x,y,angs,lens){const pts=[[x,y]];for(let i=0;i<angs.length;i++){const q=pts[i];pts.push([q[0]+Math.sin(angs[i])*lens[i],q[1]+Math.cos(angs[i])*lens[i]])}return pts}
// Tapered limb with a same-tone outline and an oval paw; all outlines first, then all fills, so joints merge.
function limb(pts,w0,w1,col){g.lineCap='round';g.lineJoin='round';const e=pts[pts.length-1],n=pts.length-1;g.strokeStyle=col;
 for(let i=0;i<n;i++){g.lineWidth=w0+(w1-w0)*i/Math.max(1,n-1);g.beginPath();g.moveTo(pts[i][0],pts[i][1]);g.lineTo(pts[i+1][0],pts[i+1][1]);g.stroke()}
 g.beginPath();g.ellipse(e[0]+1.3,e[1]-.6,3.8,2.5,0,0,TAU);g.fillStyle=col;g.fill()}
function shape(paths,col){g.fillStyle=col;paths.forEach(f=>{g.beginPath();f();g.fill()})}
const el=(x,y,rx,ry,r)=>()=>g.ellipse(x,y,rx,ry,r||0,0,TAU);
// Patches are clipped to the coat. A patch is a list of circles, so its edge is organic rather than an oval;
// caramel patches get tabby stripes.
function blobPath(p){const n=p.length;g.moveTo((p[n-1][0]+p[0][0])/2,(p[n-1][1]+p[0][1])/2);for(let i=0;i<n;i++){const a=p[i],b=p[(i+1)%n];g.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2)}g.closePath()}
function patch(clipPaths,list){g.save();g.beginPath();clipPaths.forEach(f=>f());g.clip();list.forEach(([col,pts,stripes])=>{g.fillStyle=col;g.beginPath();blobPath(pts);g.fill();
 if(stripes){g.save();g.beginPath();blobPath(pts);g.clip();g.strokeStyle=KC.st;g.lineWidth=1.2;g.lineCap='round';g.beginPath();stripes.forEach(s=>{g.moveTo(s[0],s[1]);g.quadraticCurveTo(s[2],s[3],s[4],s[5])});g.stroke();g.restore()}});g.restore()}
// Body around a flexible spine from pelvis Pv to chest Ch; arch > 0 rounds the back (gathered).
function bodyPath(Pv,Ch,arch){return ()=>{const mx=(Pv[0]+Ch[0])/2,my=(Pv[1]+Ch[1])/2;
 g.moveTo(Pv[0]-9.5,Pv[1]);g.bezierCurveTo(Pv[0]-10.5,Pv[1]-11,mx-7,my-10.5-arch,mx,my-10.5-arch);
 g.bezierCurveTo(mx+7,my-10.5-arch,Ch[0]-3,Ch[1]-12.5,Ch[0]+4,Ch[1]-10.5);g.bezierCurveTo(Ch[0]+12.5,Ch[1]-6.5,Ch[0]+12.5,Ch[1]+7,Ch[0]+3,Ch[1]+9.5);
 g.bezierCurveTo(mx+4,my+8.5-arch*.5,mx-4,my+7.5-arch*.5,Pv[0]+3,Pv[1]+8.5);g.bezierCurveTo(Pv[0]-5,Pv[1]+9.5,Pv[0]-9.5,Pv[1]+6.5,Pv[0]-9.5,Pv[1]);g.closePath()}}
// Tail: angles relax toward a target with a lag that grows toward the tip (a cheap balancing spring).
function tailUpdate(dt,base,curl,wave,amp){const n=9;if(!K.tail)K.tail=Array(n).fill(base);
 for(let i=0;i<n;i++){const tgt=base+curl*i+Math.sin(wave-i*.6)*amp,k=1-Math.exp(-dt*(16-i*1.3));K.tail[i]+=(tgt-K.tail[i])*k}}
function drawTail(x,y){const pts=chain(x,y,K.tail,Array(9).fill(3.5)),wid=i=>4.3-i*.2,L=[],R=[];
 for(let i=0;i<pts.length;i++){const a=pts[Math.min(i+1,pts.length-1)],b=pts[Math.max(i-1,0)],dx=a[0]-b[0],dy=a[1]-b[1],n=Math.hypot(dx,dy)||1,w=wid(i);L.push([pts[i][0]-dy/n*w,pts[i][1]+dx/n*w]);R.push([pts[i][0]+dy/n*w,pts[i][1]-dx/n*w])}
 const e=pts[pts.length-1],path=()=>{g.moveTo(L[0][0],L[0][1]);L.forEach(p=>g.lineTo(p[0],p[1]));g.arc(e[0],e[1],wid(pts.length-1),0,TAU);for(let i=R.length-1;i>=0;i--)g.lineTo(R[i][0],R[i][1]);g.closePath()};
 shape([path],KC.o);g.save();g.beginPath();path();g.clip();g.strokeStyle=KC.st;g.lineWidth=1.6;
 for(let i=1;i<8;i+=1.5){const k=Math.floor(i),p=pts[k],q=pts[k+1],dx=q[0]-p[0],dy=q[1]-p[1],n=Math.hypot(dx,dy)||1;g.beginPath();g.moveTo(p[0]-dy/n*6,p[1]+dx/n*6);g.lineTo(p[0]+dy/n*6,p[1]-dx/n*6);g.stroke()}
 g.fillStyle=KC.b;[8,9].forEach(i=>{g.beginPath();g.arc(pts[i][0],pts[i][1],4.4,0,TAU);g.fill()});g.restore()}
// ----- Head, neck and coat as ONE piece -----
// The body, the neck bridge, the near thigh, the head and the near ear are all filled in the same white first,
// so they read as a single silhouette; the coat patches are then painted across that whole silhouette (clipped
// to each piece in turn), so a patch flows from head to neck to back instead of stopping at a shape's edge.
// Only very light grey lines separate overlapping legs, as in flat cat illustrations.
const HS=1.24,SEP='#e6dfd3';
// Head pose H = {x, y, t (tilt)}. hp() maps head-local points into the current space.
function hp(H,x,y){const c=Math.cos(H.t),s=Math.sin(H.t);x*=HS;y*=HS;return [H.x+x*c-y*s,H.y+x*s+y*c]}
function inHead(H,f){return ()=>{g.save();g.translate(H.x,H.y);g.rotate(H.t);g.scale(HS,HS);f();g.restore()}}
// Profile head (facing right, skull centre 0,0): round crown, forehead easing into a short nose, small round
// muzzle and chin, full cheek running back into the nape.
// Head and both ears as ONE outline (like a flat cat illustration): the line runs up the back of the head into
// the far ear, dips between the ears, rises into the near ear and comes down the forehead to a flat little face.
// The skull is about as tall as it is long, so the head reads round. a < 0 lays both ear tips back.
function headShape(a){const k=a||0,bx=k*5,by=-k*2.2;return ()=>{
 g.moveTo(3,6.2);g.bezierCurveTo(-1,6.8,-5.2,6.3,-6.8,4.4);g.bezierCurveTo(-8.2,2.6,-8.6,-.6,-7.8,-3.4);
 g.bezierCurveTo(-7.3,-5.6,-6.4,-6.8,-5.4,-7.4);g.quadraticCurveTo(-4.8+bx*.5,-9.2+by*.5,-3.9+bx,-10.4+by);g.quadraticCurveTo(-3.2+bx,-11.1+by,-2.6+bx,-10.3+by);g.quadraticCurveTo(-1.8,-8.8,-.8,-8.5);
 g.quadraticCurveTo(.2+bx*.5,-10.6+by*.5,1.7+bx,-12.3+by);g.quadraticCurveTo(2.6+bx,-13.1+by,3.4+bx,-12.1+by);g.quadraticCurveTo(5.4,-9.6,6.4,-7.2);
 g.bezierCurveTo(8.2,-5,9.2,-2.6,9.3,-.6);g.bezierCurveTo(9.5,1.6,8.5,3,7.2,3.3);g.bezierCurveTo(6.9,5.2,5,6.3,3,6.2);g.closePath()}}
function earInner(a){const k=a||0,bx=k*5,by=-k*2.2;g.moveTo(.6,-8.6);g.quadraticCurveTo(1.2+bx*.6,-10.4+by*.6,2.1+bx*.9,-11.3+by*.9);g.quadraticCurveTo(3.3,-10,4.1,-8.3);g.closePath()}
// Neck bridge: from the nape down to the top of the shoulders, and from the chin down to the chest front.
function neckBridge(Ch,H){const n1=hp(H,-7.4,-.8),n2=hp(H,1.6,5.8),s1=[Ch[0]-7,Ch[1]-8.4],s2=[Ch[0]+9,Ch[1]-.6];
 return ()=>{g.moveTo(n1[0],n1[1]);g.quadraticCurveTo((n1[0]+s1[0])/2-1.5,(n1[1]+s1[1])/2+.5,s1[0],s1[1]);g.lineTo(Ch[0],Ch[1]+2);g.lineTo(s2[0],s2[1]);
  g.quadraticCurveTo((s2[0]+n2[0])/2+2.2,(s2[1]+n2[1])/2,n2[0],n2[1]);g.lineTo(hp(H,0,0)[0],hp(H,0,0)[1]);g.closePath()}}
// Head patches in head-local space: dark brown over the back of the skull and nape, caramel tabby from the
// near ear across the brow to just past the eye. Drawn inside inHead().
function headCoat(){
 const dark=[[-8,-12.6],[-2.2,-11.6],[-1.6,-8],[-4.4,-5.8],[-7.6,-4.4],[-9.2,-7.6]],car=[[-1.6,-9],[1.4,-15],[5.4,-11.6],[8.4,-5.4],[7.8,-1.8],[4.6,-.6],[1.6,-3.2],[-.8,-6]];
 g.fillStyle=KC.b;g.beginPath();blobPath(dark);g.fill();
 g.fillStyle=KC.o;g.beginPath();blobPath(car);g.fill();
 g.save();g.beginPath();blobPath(car);g.clip();
 g.strokeStyle=KC.st;g.lineWidth=.9;g.lineCap='round';g.beginPath();[[1.6,-8,2,-6.2,1.6,-4.4],[3.6,-8.4,4,-6.6,3.6,-4.8],[5.6,-7.6,5.8,-6.4,5.6,-5.2]].forEach(s=>{g.moveTo(s[0],s[1]);g.quadraticCurveTo(s[2],s[3],s[4],s[5])});g.stroke();g.restore()}
// Face details in head-local space.
function face(eyes,mouth){
 const ex=4.9,ey=-2.3,ep=()=>{g.moveTo(ex-2.2,ey+.2);g.bezierCurveTo(ex-1.5,ey-2.3,ex+1.6,ey-2.4,ex+2.3,ey-.6);g.bezierCurveTo(ex+1.5,ey+1.7,ex-1.2,ey+1.9,ex-2.2,ey+.2);g.closePath()};
 if(eyes==='closed'){g.strokeStyle=KC.eyeL;g.lineWidth=.8;g.lineCap='round';g.beginPath();g.moveTo(ex-2.1,ey+.1);g.quadraticCurveTo(ex,ey+1.5,ex+2.2,ey-.3);g.stroke()}
 else{g.beginPath();ep();g.fillStyle=KC.iris;g.fill();g.save();g.beginPath();ep();g.clip();g.fillStyle=KC.pupil;g.beginPath();g.ellipse(ex+.55,ey-.3,.8,1.9,.08,0,TAU);g.fill();g.restore();
  g.fillStyle='#fff';g.beginPath();g.arc(ex+1.15,ey-1,.48,0,TAU);g.fill();g.strokeStyle='rgba(79,58,46,.7)';g.lineWidth=.55;g.beginPath();ep();g.stroke()}
 g.fillStyle=KC.pink;g.beginPath();g.moveTo(8.4,-.9);g.quadraticCurveTo(9.5,-1.1,9.5,-.2);g.quadraticCurveTo(9.2,.5,8.8,.5);g.closePath();g.fill();
 g.strokeStyle=KC.mouth;g.lineWidth=.65;g.lineCap='round';g.beginPath();
 if(mouth==='open'){g.moveTo(8.9,1.3);g.quadraticCurveTo(8.2,3.3,7,2.4);g.stroke()}else{g.moveTo(9,.6);g.lineTo(8.9,1.4);g.quadraticCurveTo(8.3,2.2,7.5,2)}g.stroke();
 g.globalAlpha=.3;g.fillStyle=KC.pink;g.beginPath();g.ellipse(4.8,1.6,1.5,.9,0,0,TAU);g.fill();g.globalAlpha=1;
 g.strokeStyle='rgba(110,92,82,.3)';g.lineWidth=.38;g.beginPath();g.moveTo(8,1);g.lineTo(12,.2);g.moveTo(8,1.6);g.lineTo(11.8,2.1);g.stroke()}
// Draw a set of white silhouette pieces, then the coat patches across all of them.
function coat(pieces,paintWorld,H){
 g.fillStyle=KC.w;pieces.forEach(f=>{g.beginPath();f();g.fill()});
 pieces.forEach(f=>{g.save();g.beginPath();f();g.clip();paintWorld();if(H){g.save();g.translate(H.x,H.y);g.rotate(H.t);g.scale(HS,HS);headCoat();g.restore()}g.restore()})}
function headFront(H,earA,eyes,mouth){g.save();g.translate(H.x,H.y);g.rotate(H.t);g.scale(HS,HS);
 g.beginPath();earInner(earA);g.fillStyle=KC.pink;g.fill();face(eyes,mouth);g.restore()}
function farEar(){}
function collar(Ch,H){const b=hp(H,2.6,6),c=hp(H,-1.6,5.6);g.strokeStyle=KC.collar;g.lineWidth=1.1;g.lineCap='round';g.beginPath();g.moveTo(c[0],c[1]+.6);g.quadraticCurveTo((b[0]+c[0])/2,(b[1]+c[1])/2+1.6,b[0],b[1]+.8);g.stroke();g.beginPath();g.arc(b[0]+.2,b[1]+2.4,1.35,0,TAU);g.fillStyle=KC.bell;g.fill()}
// A near limb in white with a faint separating contour, so it reads in front of the body without an outline.
function nearLimb(pts,w0,w1){g.save();g.translate(-.45,0);limb(pts,w0+.4,w1+.4,SEP);g.restore();limb(pts,w0,w1,KC.w)}
// One full pose. All angles: 0 = straight down, positive = forward.
function catBody(o){
 const Pv=o.Pv,Ch=o.Ch,hip=[Pv[0]-1,Pv[1]+2],sh=[Ch[0]+2,Ch[1]+3],H={x:o.hx,y:o.hy,t:o.tilt};
 const front=(a,b,c)=>chain(sh[0],sh[1],[a,a-b,a-b+c],[9.2,8.6,2.4]),hind=(a,b)=>chain(hip[0],hip[1],[a+.45,a-.75-b*.6,a+.2+b*.35],[9,9,6]);
 limb(hind(o.h2,o.hb2),5.4,3.6,KC.ws);limb(front(o.f2,o.fb2,o.fc2||0),4.8,3.7,KC.ws);
 drawTail(Pv[0]-7,Pv[1]-3);farEar(H,o.earA);
 const bp=bodyPath(Pv,Ch,o.arch),hl=hind(o.h1,o.hb1),ta=o.h1+.45,tc=[hl[0][0]+Math.sin(ta)*4,hl[0][1]+Math.cos(ta)*4],th=el(tc[0],tc[1],7.4,8.8,-ta);
 const mx=(Pv[0]+Ch[0])/2,my=(Pv[1]+Ch[1])/2,A_=o.arch;
 coat([bp,neckBridge(Ch,H),th,inHead(H,headShape(o.earA))],()=>{
  g.fillStyle=KC.ws;g.beginPath();blobPath([[mx-16,my+8],[mx,my+6.6],[mx+14,my+8],[mx,my+12]]);g.fill();
  g.fillStyle=KC.b;g.beginPath();blobPath([[mx-14,my-12-A_],[mx-2,my-15-A_],[mx+9,my-13-A_],[mx+12,my-8-A_],[mx+4,my-4-A_*.6],[mx-5,my-5-A_*.6],[mx-13,my-6-A_*.8]]);g.fill();
  const hipP=[[Pv[0]-10,Pv[1]-7],[Pv[0]-3,Pv[1]-12.5],[Pv[0]+5,Pv[1]-10],[Pv[0]+6,Pv[1]-3],[tc[0]+2.5,tc[1]+2],[tc[0]-3,tc[1]+1.5],[Pv[0]-9,Pv[1]]];
  g.fillStyle=KC.o;g.beginPath();blobPath(hipP);g.fill();g.save();g.beginPath();blobPath(hipP);g.clip();g.strokeStyle=KC.st;g.lineWidth=.9;g.lineCap='round';g.beginPath();
  for(let k=-1;k<=2;k++){const x=Pv[0]+k*3.6;g.moveTo(x-1.5,Pv[1]-12);g.quadraticCurveTo(x+1.6,Pv[1]-6,x,Pv[1])}g.stroke();g.restore();
 },H);
 // Faint contour along the front of the near thigh.
 collar(Ch,H);headFront(H,o.earA,o.eyes,o.mouth);
 nearLimb(hl.slice(1),4.6,3.6);nearLimb(front(o.f1,o.fb1,o.fc1||0),5,3.8)}
// Rotary gallop at phase p (0..1): +1 gathered (legs under, back rounded), -1 stretched (flight).
function gallop(p,v){const f=Math.cos(TAU*p),L=17-4*f,fl=Math.max(0,-Math.sin(TAU*(p-.3)));
 const y=-21.8-2.2*fl,Pv=[-L/2,y+1.2*f],Ch=[L/2,y-.6*f];
 const fa=o=>Math.sin(TAU*(p-.2-o))*.95,fb=o=>Math.max(0,Math.cos(TAU*(p-.2-o)))*1.4,ha=o=>Math.sin(TAU*(p+.3-o))*.85,hb=o=>Math.max(0,Math.cos(TAU*(p+.3-o)))*1.3;
 const ear=-Math.min(.55,Math.max(0,(v-190)/320))-.12;
 return {Pv,Ch,arch:4.5*f,f1:fa(0),fb1:fb(0),f2:fa(.09),fb2:fb(.09),fc1:fb(0)*.6,fc2:fb(.09)*.6,h1:ha(0),hb1:hb(0),h2:ha(.08),hb2:hb(.08),hx:Ch[0]+9,hy:-32.5+.7*f,tilt:0,earA:ear,eyes:'open',mouth:'smile'}}
function catPose(){
 const dt=Math.min(.05,Math.max(0,tt-K.lastT));K.lastT=tt;
 const dd=cat.dist-K.lastD;K.lastD=cat.dist;if(dd>0&&dd<60)K.p=(K.p+dd/(62+cat.v*.12))%1;
 if(st==='over'){tailUpdate(dt,-1.62,.02,tt*1.5,.04);return {flop:1}}
 if(st==='ready'){// Sitting; every few seconds it washes its face with a front paw.
  const c=tt%5.5,lick=c>3.6&&c<5.2,lp=lick?Math.sin(Math.min(1,(c-3.6)/.25)*Math.PI/2)*Math.min(1,(5.2-c)/.25):0;
  tailUpdate(dt,1.42,.1,tt*1.3,.05);return {sit:1,lp,lick,blink:(tt%3.7)<.12}}
 const tj=tt-K.jumpT,tl=tt-K.landT;
 if(!cat.on){
  if(cat.vy<0){// Push-off then stretched flight, head up, tail trailing low.
   const k=Math.min(1,tj/.14),o=gallop(.45,cat.v);
   o.Pv=[-12,-24];o.Ch=[11,-26];o.arch=-2;o.f1=.4+.7*k;o.fb1=.9-.6*k;o.f2=.2+.8*k;o.fb2=1-.6*k;o.h1=-1.25;o.hb1=.1;o.h2=-1.1;o.hb2=.2;
   o.hx=21;o.hy=-35;o.tilt=-.22;o.earA=-.05;o.mouth='open';tailUpdate(dt,-1.55,-.05,tt*6,.06);o.pitch=-.12;return o}
  // Falling: front legs reach for the roof, hind legs tuck, head looks down, tail rises for balance.
  const o=gallop(.05,cat.v);o.Pv=[-10,-23];o.Ch=[10,-23];o.arch=2;o.f1=.55;o.fb1=.15;o.f2=.35;o.fb2=.25;o.h1=.55;o.hb1=1.1;o.h2=.7;o.hb2=1.2;
  o.hx=19.5;o.hy=-31.5;o.tilt=.2;o.earA=-.1;o.mouth='smile';tailUpdate(dt,-2.75,.12,tt*6,.08);o.pitch=.1;return o}
 if(tl<.22){// Landing: front paws plant first, the body compresses, then the gallop resumes.
  const k=tl/.22,o=gallop(0,cat.v),sq=Math.sin(k*Math.PI);o.Pv=[-9+2*sq,-21+3*sq];o.Ch=[9.5,-21+2*sq];o.arch=3+3*sq;o.f1=.05;o.fb1=0;o.f2=-.05;o.fb2=0;o.h1=.9;o.hb1=1.2;o.h2=.8;o.hb2=1.1;o.hx=19;o.hy=-30+2*sq;o.tilt=.1*sq;
  tailUpdate(dt,-2.2,.07,tt*6,.06);return o}
 const o=gallop(K.p,cat.v);tailUpdate(dt,-2.15+.22*Math.cos(TAU*K.p),.075,TAU*K.p,.08);return o}
function kitty(o){
 if(o.flop)return catFlop();if(o.sit)return catSit(o);
 g.save();if(o.pitch)g.rotate(o.pitch);catBody(o);g.restore()}
function catSit(o){
 const bob=o.lick?Math.sin(tt*14)*.6*o.lp:0,H={x:9+o.lp*.5,y:-32+o.lp*1.6+bob,t:o.lp*.28},earA=-.05+(o.lick?0:Math.max(0,Math.sin(tt*.9)-.95)*-3);
 const bp=()=>{g.moveTo(-13,0);g.bezierCurveTo(-18,-12,-12,-25,-1,-28.5);g.bezierCurveTo(7,-31,12,-26,12,-19);g.bezierCurveTo(12,-11,10,-5,9.5,0);g.closePath()},hz=el(-8.5,-9,10.2,9.2,-.2);
 // Tail wrapped around the front paws.
 const tp=()=>{g.moveTo(-14,-2);g.bezierCurveTo(-18,2,0,2.6,14+Math.sin(tt*1.3)*1.5,-1.2);g.lineTo(14+Math.sin(tt*1.3)*1.5,-3.6);g.bezierCurveTo(0,-1.2,-12,-2.6,-14,-5.6);g.closePath()};
 limb(chain(6.5,-19,[0,0],[9.5,9]),4.8,3.8,KC.ws);farEar(H,earA);
 coat([bp,hz,neckBridge([6,-26],H),inHead(H,headShape(earA))],()=>{
  g.fillStyle=KC.b;g.beginPath();blobPath([[-16,-12],[-11,-25],[-3,-30],[1,-23],[-4,-15],[-11,-8]]);g.fill();
  const hz2=[[-20,-12],[-9,-17.5],[-1.5,-11],[-3,1.5],[-13,2.5],[-20,-2]];g.fillStyle=KC.o;g.beginPath();blobPath(hz2);g.fill();
  g.save();g.beginPath();blobPath(hz2);g.clip();g.strokeStyle=KC.st;g.lineWidth=1.1;g.lineCap='round';g.beginPath();[-14,-10,-6].forEach(x=>{g.moveTo(x-1,-15);g.quadraticCurveTo(x+2,-9,x,-1)});g.stroke();g.restore();
 },H);
 g.fillStyle=KC.o;g.beginPath();tp();g.fill();g.save();g.beginPath();tp();g.clip();g.strokeStyle=KC.st;g.lineWidth=1.3;g.beginPath();[-8,-2,4,10].forEach(x=>{g.moveTo(x,-6);g.lineTo(x+1.5,2)});g.stroke();g.fillStyle=KC.b;g.beginPath();g.arc(15,-2.5,3.2,0,TAU);g.fill();g.restore();
 collar([6,-26],H);
 // Near front leg: straight, or lifted to the mouth while washing.
 const a1=o.lp*2.25,a2=o.lp*3.55;nearLimb(chain(8.5,-19.5,[a1,a2],[9.6,9]),5,3.9);
 headFront(H,earA,o.blink||o.lick&&o.lp>.6?'closed':'open',o.lick&&o.lp>.6?'open':'smile')}
// Game over: lying flat, legs splayed, eyes shut, stars circling.
function catFlop(){
 const o={Pv:[-9.5,-8.5],Ch:[10,-8.5],arch:-1,f1:1.5,fb1:.05,f2:1.4,fb2:.1,h1:-1.45,hb1:.05,h2:-1.35,hb2:.1,hx:19.5,hy:-9.5,tilt:.35,earA:-.5,eyes:'closed',mouth:'open'};
 catBody(o);for(let i=0;i<3;i++){const a=tt*3+i*2.09;star(30+Math.cos(a)*13,-30+Math.sin(a)*4,3.6,'#f0c04f')}}
// ===== City art: flat retro travel-poster style (teal sky, cream clouds, teal hills, amber and teal blocks) =====
// The run is a world tour of rooftops; Taipei is the first city. Each city is one theme object (palette plus
// landmark drawers); everything is drawn in code and the static layers are painted once into offscreen canvases
// that tile seamlessly, then scrolled with parallax. Visual only: no effect on catRules, rewards or tracking.
const seeded=s=>()=>(s=(s*16807)%2147483647)/2147483647;
function layer(w,h,fn){const cv=document.createElement('canvas');cv.width=Math.round(w*DPR);cv.height=Math.round(h*DPR);const x=cv.getContext('2d');x.setTransform(DPR,0,0,DPR,0,0);fn(x,w,h);return cv}
const CITY={name:'TAIPEI',sub:'TAIWAN',
 sky:['#4fb3b8','#8fd0c4','#f1e4c0'],cloud:'#f7efd9',cloudS:'#d3e5d6',
 hills:['#86c0b7','#5fa39f','#3f8a88'],trees:['#2f6a46','#3f7d4f','#5a9b5c'],
 far:['#e3a24f','#cf8a3e','#4a9aa1','#efdcb5','#3f8f97','#d9824f'],
 tower:{lit:'#4aa9b0',mid:'#2f8a95',dark:'#226b75',gold:'#e8b45a'}};
// In-world shop signs (tea drinks, noodle shop, shaved ice, pharmacy, tofu pudding, snacks). They are scenery
// like a texture and stay in Chinese in every language, so they are built from code points on purpose:
// the site's UI-text localizer (and its coverage test) must not treat them as interface strings.
const SIGNS=[[0x8336,0x98f2],[0x9eb5,0x9928],[0x5228,0x51b0],[0x85e5,0x5c40],[0x8c46,0x82b1],[0x5c0f,0x5403]].map(c=>String.fromCharCode(...c));
const SIGNC=[['#c9473f','#f7efd9'],['#e8b45a','#1f3a40'],['#2f8a95','#f7efd9'],['#3f7d4f','#f7efd9'],['#d9824f','#f7efd9']];
const fillP=(x,p,col)=>{x.beginPath();x.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)x.lineTo(p[i],p[i+1]);x.closePath();x.fillStyle=col;x.fill()};
// Hills: three flat bands with a lighter ridge line, like screen-printed layers.
function drawHills(x,w,h){
 const ridge=(base,amp,ph,col)=>{x.beginPath();x.moveTo(0,h);for(let i=0;i<=w;i+=4){const t=i/w*Math.PI*2;x.lineTo(i,base-amp*(.55*Math.sin(t*2+ph)+.3*Math.sin(t*5+ph*2)+.15*Math.sin(t*11+ph*3)))}x.lineTo(w,h);x.closePath();x.fillStyle=col;x.fill();
  x.strokeStyle='rgba(247,239,217,.35)';x.lineWidth=1.5;x.stroke()};
 ridge(60,34,.6,CITY.hills[0]);ridge(95,28,2.1,CITY.hills[1]);ridge(130,22,4.0,CITY.hills[2])}
// Poster cumulus: stacked lobes in cream with a flat shadow band underneath.
function drawCloud(x,w,h){
 const lobes=[[40,60,26],[72,44,32],[110,52,28],[140,62,22],[88,66,30],[58,70,22],[124,70,20]];
 x.fillStyle=CITY.cloudS;lobes.forEach(l=>{x.beginPath();x.arc(l[0],l[1]+6,l[2],0,7);x.fill()});
 x.fillStyle=CITY.cloud;lobes.forEach(l=>{x.beginPath();x.arc(l[0],l[1],l[2],0,7);x.fill()});
 x.fillStyle=CITY.cloudS;x.fillRect(10,78,160,20)}
// Taipei's landmark tower in poster style: lit and shadow faces, eight flared sections, gold ruyi discs, spire.
function drawTower(x,w,h){
 const c=w/2,T=CITY.tower,base=h,secH=24,n=8,bw=30,top=base-70-n*secH;
 fillP(x,[c-26,base,c-16,base-70,c,base-70,c,base],T.lit);fillP(x,[c,base,c,base-70,c+16,base-70,c+26,base],T.dark);
 x.fillStyle=T.gold;x.beginPath();x.arc(c-8,base-58,5,0,7);x.fill();x.beginPath();x.arc(c+8,base-58,5,0,7);x.fill();
 for(let i=0;i<n;i++){const yb=base-70-i*secH,yt=yb-secH;
  fillP(x,[c-bw/2+2,yb,c-bw/2-3,yt,c,yt,c,yb],T.lit);fillP(x,[c,yb,c,yt,c+bw/2+3,yt,c+bw/2-2,yb],T.mid);
  x.fillStyle='rgba(247,239,217,.55)';for(let k=0;k<4;k++)x.fillRect(c-bw/2+1,yb-5-k*5,bw-2,1.2);
  x.fillStyle=T.dark;x.fillRect(c+bw/2-6,yt,3,secH)}
 fillP(x,[c-10,top,c-8,top-16,c,top-16,c,top],T.lit);fillP(x,[c,top,c,top-16,c+8,top-16,c+10,top],T.mid);
 fillP(x,[c-6,top-16,c-5,top-28,c,top-28,c,top-16],T.lit);fillP(x,[c,top-16,c,top-28,c+5,top-28,c+6,top-16],T.mid);
 x.strokeStyle=T.dark;x.lineWidth=2;x.beginPath();x.moveTo(c,top-28);x.lineTo(c,top-70);x.stroke()}
// Far city: dense amber/teal blocks with slit windows, a lattice dome and a red palace on a hill.
function drawFar(x,w,h){
 const R=seeded(97),list=[];for(let bx=0;bx<w;){const bw=18+R()*34,bh=26+R()*90;list.push([bx,bw,bh,R()]);bx+=bw}
 const one=(bx,bw,bh,r)=>{const top=h-bh,col=CITY.far[Math.floor(r*CITY.far.length)];x.fillStyle=col;x.fillRect(bx,top,bw,bh);
  x.fillStyle='rgba(31,58,64,.22)';x.fillRect(bx+bw*.7,top,bw*.3,bh);
  x.fillStyle='rgba(247,239,217,.45)';for(let wy=top+5;wy<h;wy+=7)for(let wx=bx+3;wx<bx+bw*.68-2;wx+=5)x.fillRect(wx,wy,2,4)};
 list.forEach(b=>{one(...b);if(b[0]+b[1]>w)one(b[0]-w,b[1],b[2],b[3])});
 // Lattice dome (a stadium shape, generic).
 const dx=420,dy=h-20;x.fillStyle='#e8dcc0';x.beginPath();x.ellipse(dx,dy,70,26,0,Math.PI,0);x.fill();x.strokeStyle='rgba(63,143,151,.6)';x.lineWidth=1;
 for(let i=-60;i<=60;i+=10){x.beginPath();x.moveTo(dx+i,dy);x.quadraticCurveTo(dx+i*.6,dy-28,dx,dy-26);x.stroke()}for(let k=1;k<4;k++){x.beginPath();x.ellipse(dx,dy,70-k*14,26-k*6,0,Math.PI,0);x.stroke()}
 // Red palace on a green knoll: stacked red walls with gold-trimmed teal-green roofs (a generic classical hotel).
 const px=820,py=h-30;fillP(x,[px-80,h,px-40,py-10,px+60,py-14,px+100,h],CITY.trees[1]);
 for(let i=0;i<3;i++){const ww=86-i*22,yy=py-14-i*16;x.fillStyle='#c9473f';x.fillRect(px-ww/2+10,yy-12,ww,12);fillP(x,[px-ww/2+2,yy-12,px+ww/2+18,yy-12,px+ww/2+10,yy-19,px-ww/2+10,yy-19],'#2f8a6a');x.fillStyle=CITY.tower.gold;x.fillRect(px-ww/2+4,yy-13,ww+12,1.5)}
 x.fillStyle='rgba(143,208,196,.35)';x.fillRect(0,0,w,h)}
// Mid city: taller apartment blocks in the foreground palette, flat-shaded, with grilles, tanks, sheds and a temple roof.
function drawMid(x,w,h){
 const R=seeded(31),list=[];for(let bx=0;bx<w;){const bw=46+R()*60,bh=80+R()*120;list.push([bx,bw,bh,R(),R(),R()]);bx+=bw+(R()<.3?8:0)}
 const one=(bx,bw,bh,r1,r2,r3)=>{const top=h-bh,P=BLD[Math.floor(r1*BLD.length)],sd=bw*.18;
  x.fillStyle=P.wall;x.fillRect(bx,top,bw-sd,bh);x.fillStyle=P.side;x.fillRect(bx+bw-sd,top,sd,bh);
  x.fillStyle=P.trim;for(let fy=top+18;fy<h;fy+=20)x.fillRect(bx,fy,bw-sd,2);
  for(let fy=top+5;fy<h;fy+=20)for(let wx=bx+5;wx<bx+bw-sd-9;wx+=13){x.fillStyle=(Math.floor(wx+fy)%7===0)?P.winL:P.win;x.fillRect(wx,fy,8,11);x.fillStyle=P.trim;for(let gx=wx+2;gx<wx+8;gx+=2.5)x.fillRect(gx,fy,.8,11)}
  if(r2<.38){const tx2=bx+bw*(.2+r3*.4);x.fillStyle='#c9473f';x.fillRect(tx2+1,top-5,2,5);x.fillRect(tx2+10,top-5,2,5);x.fillStyle='#dfe4e2';x.fillRect(tx2,top-17,13,12);x.fillStyle='#b5bfbd';x.fillRect(tx2+8,top-17,5,12)}
  else if(r2<.68){x.fillStyle=r3<.5?'#3f8f97':'#5a9b5c';x.fillRect(bx+3,top-11,bw*.45,11);fillP(x,[bx+1,top-11,bx+bw*.45+5,top-11,bx+bw*.45+3,top-15,bx+3,top-15],P.trim)}
  if(r3>.7&&bh>110){const sc=SIGNC[Math.floor(r1*SIGNC.length)];x.fillStyle=sc[0];x.fillRect(bx+bw-sd-10,top+12,8,40)}};
 list.forEach(b=>{one(...b);if(b[0]+b[1]>w)one(b[0]-w,b[1],b[2],b[3],b[4],b[5])});
 // A temple roof with swallowtail ridges between the blocks.
 const tx3=600,ty=h-70;x.fillStyle='#c9473f';x.fillRect(tx3-40,ty,80,70);x.fillStyle=CITY.tower.gold;x.fillRect(tx3-40,ty+10,80,3);
 fillP(x,[tx3-62,ty+2,tx3+62,ty+2,tx3+44,ty-14,tx3-44,ty-14],'#d9824f');x.strokeStyle='#c9473f';x.lineWidth=3;x.beginPath();x.moveTo(tx3-50,ty-14);x.quadraticCurveTo(tx3-58,ty-22,tx3-66,ty-26);x.moveTo(tx3+50,ty-14);x.quadraticCurveTo(tx3+58,ty-22,tx3+66,ty-26);x.moveTo(tx3-44,ty-14);x.lineTo(tx3+44,ty-14);x.stroke();
 x.fillStyle='rgba(241,228,192,.12)';x.fillRect(0,0,w,h)}
// Tree canopy far below the rooftops (seen through the gaps), like the green hill in a city poster.
function drawCanopy(x,w,h){const R=seeded(5);for(let k=0;k<3;k++){x.fillStyle=CITY.trees[k===2?0:k===1?1:2];for(let i=-20;i<w+20;i+=18){const r=14+R()*12,yy=18+k*16+R()*8;x.beginPath();x.arc(i,yy,r,0,7);x.fill();if(i+r>w){x.beginPath();x.arc(i-w,yy,r,0,7);x.fill()}if(i-r<0){x.beginPath();x.arc(i+w,yy,r,0,7);x.fill()}}}x.fillStyle=CITY.trees[0];x.fillRect(0,48,w,h)}
// Paper grain so the flat colours read as a printed poster.
let GRAIN=null;
function grain(){if(!GRAIN){const t=document.createElement('canvas');t.width=t.height=96;const x=t.getContext('2d'),R=seeded(11);for(let i=0;i<900;i++){x.fillStyle=R()<.5?'rgba(255,255,255,.07)':'rgba(31,58,64,.07)';x.fillRect(R()*96,R()*96,1,1)}GRAIN=g.createPattern(t,'repeat')}return GRAIN}
let BG=null;
function bgLayers(){if(!BG)BG={hills:layer(900,170,drawHills),cloud:layer(180,100,drawCloud),tower:layer(80,330,drawTower),far:layer(1000,130,drawFar),mid:layer(1200,220,drawMid),canopy:layer(600,120,drawCanopy)};return BG}
function scroll(cv,w,h,y,speed){const off=((cat.dist*speed)%w+w)%w;for(let x=-off;x<W+20;x+=w)g.drawImage(cv,x-.5,y,w+1,h)}
function pigeon(x,y,s){const f=reduceMotion?.4:Math.sin(tt*12+x)*.6;g.strokeStyle=KC.line;g.lineWidth=1.8*s;g.lineCap='round';g.beginPath();g.moveTo(x-7*s,y-5*s*f);g.quadraticCurveTo(x-3*s,y-2*s,x,y);g.quadraticCurveTo(x+3*s,y-2*s,x+7*s,y-5*s*f);g.stroke()}
function backdrop(){
const L=bgLayers();
const sky=g.createLinearGradient(0,0,0,430);sky.addColorStop(0,CITY.sky[0]);sky.addColorStop(.55,CITY.sky[1]);sky.addColorStop(1,CITY.sky[2]);
g.fillStyle=sky;g.fillRect(-20,0,W+40,H);
// Long flat cloud streaks and big cumulus, drifting slowly.
g.fillStyle='rgba(247,239,217,.55)';for(let i=0;i<3;i++){const x=((i*260-cat.dist*.015-tt*3)%900+900)%900-250;g.beginPath();g.ellipse(x+110,150+i*42,120,6,0,0,7);g.fill()}
for(let i=0;i<3;i++){const x=((i*330+60-cat.dist*.03-tt*5)%990+990)%990-200;g.drawImage(L.cloud,x,170+((i*47)%60),180*(i%2?.8:1),100*(i%2?.8:1))}
for(let i=0;i<3;i++){const bx=W+40-((cat.dist*.3+tt*26+i*90)%1300);if(bx>-30&&bx<W+30)pigeon(bx,130+i*14+Math.sin(tt*2+i)*5,1-i*.15)}
scroll(L.hills,900,170,250,.02);
const tw=((260-cat.dist*.035)%1800+1800)%1800-120;if(tw>-90&&tw<W+20)g.drawImage(L.tower,tw,100,80,330);
scroll(L.far,1000,130,300,.07);
scroll(L.mid,1200,220,240,.2);
// Treetops far below, then shade so the gaps still read as a long drop.
scroll(L.canopy,600,120,478,.55);
const deep=g.createLinearGradient(0,470,0,H);deep.addColorStop(0,'rgba(20,50,45,0)');deep.addColorStop(1,'rgba(20,50,45,.55)');g.fillStyle=deep;g.fillRect(-20,470,W+40,H-470)}
// ===== Rooftops: Taipei apartment blocks as flat-shaded 3D blocks seen slightly from above =====
// Front wall, a top face receding toward a vanishing point at the screen centre, the side face toward the camera,
// iron window grilles, AC units, vertical shop signs, rooftop sheds and water tanks. Shapes keep a thin dark
// edge; colour comes from two or three flat tones per surface, like the screen-printed background.
// Purely visual: the walkable height is still r.y from catRules (the cat runs on the top face behind the ledge).
const VX=W*.5,DEP=28;
const dxAt=x=>Math.max(-36,Math.min(36,(VX-x)*.16));
const ROD='#4d6b6c';
// Flat fill only: the city is drawn without outlines, like the screen-printed background (lw is ignored).
function poly(p,fill){g.beginPath();g.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)g.lineTo(p[i],p[i+1]);g.closePath();g.fillStyle=fill;g.fill()}
const BLD=[
 {wall:'#e9a956',shade:'#d0903f',side:'#a9692c',trim:'#f6e2b8',top:'#e3cfa2',topB:'#c9b282',win:'#2f6f78',winL:'#f6d38a'},
 {wall:'#3e8f98',shade:'#33808a',side:'#245d66',trim:'#d9efe6',top:'#a8cdc5',topB:'#8cb4ab',win:'#1f4d55',winL:'#f2c46a'},
 {wall:'#efdcb5',shade:'#dfc898',side:'#b89d6c',trim:'#fff6e0',top:'#ea7a44',topB:'#c95f2f',win:'#3f8f97',winL:'#f2c46a'},
 {wall:'#d9824f',shade:'#c4703f',side:'#97522c',trim:'#f6dcc0',top:'#dcc0a0',topB:'#c2a483',win:'#2f6f78',winL:'#f6d38a'},
 {wall:'#f2b9a0',shade:'#e3a184',side:'#bb7a5f',trim:'#fff0e6',top:'#e8703a',topB:'#c65a2a',win:'#245d66',winL:'#f2c46a'}];
// Small flat-shaded box standing on a roof at bottom-left (x,yb).
function box(x,yb,w,h,dep,f,t,s){const dx=dxAt(x+w/2)*dep/DEP,top=yb-h;
 if(dx>0)poly([x+w,yb,x+w+dx,yb-dep,x+w+dx,top-dep,x+w,top],s,1.5);else poly([x,yb,x+dx,yb-dep,x+dx,top-dep,x,top],s,1.5);
 poly([x,yb,x+w,yb,x+w,top,x,top],f,1.5);poly([x,top,x+w,top,x+w+dx,top-dep,x+dx,top-dep],t,1.5)}
function acUnit(x,yb,w,seed){const h=w*.62;box(x,yb,w,h,w*.28,'#e6e2d6','#f7f3e8','#bdb7a6');
 const cx=x+w*.36,cy=yb-h/2,r=h*.36,a=(reduceMotion?0:tt*12)+seed;g.beginPath();g.arc(cx,cy,r,0,7);g.fillStyle='#4f6b6f';g.fill();
 g.strokeStyle='#e6e2d6';g.lineWidth=1.8;g.beginPath();for(let i=0;i<3;i++){const b=a+i*2.09;g.moveTo(cx,cy);g.lineTo(cx+Math.cos(b)*r*.8,cy+Math.sin(b)*r*.8)}g.stroke();
 g.fillStyle='#bdb7a6';for(let i=0;i<4;i++)g.fillRect(x+w*.68,yb-h*.8+i*h*.18,w*.24,1.5)}
function prop(kind,x,yb,seed){
 if(kind==='ac'){acUnit(x,yb,34,seed);return}
 if(kind==='tank'){// Stainless water tank with a domed lid on a red steel stand.
  g.fillStyle='#c9473f';g.fillRect(x+3,yb-12,3,12);g.fillRect(x+26,yb-12,3,12);g.fillRect(x+1,yb-13,30,3);
  poly([x,yb-12,x+32,yb-12,x+32,yb-46,x,yb-46],'#dfe4e2',1.5);g.fillStyle='#b9c3c1';g.fillRect(x+20,yb-46,12,34);g.fillStyle='#f7f9f8';g.fillRect(x+6,yb-46,4,34);
  g.beginPath();g.moveTo(x,yb-46);g.quadraticCurveTo(x+16,yb-60,x+32,yb-46);g.closePath();g.fillStyle='#eef1f0';g.fill();
  g.fillStyle='rgba(31,58,64,.18)';[-36,-26,-18].forEach(d=>g.fillRect(x+1,yb+d,30,1.5));return}
 if(kind==='antenna'){g.strokeStyle=ROD;g.lineWidth=2.2;g.lineCap='round';g.beginPath();g.moveTo(x,yb);g.lineTo(x,yb-50);[-38,-46].forEach((h,i)=>{g.moveTo(x-12+i*3,yb+h);g.lineTo(x+12-i*3,yb+h)});g.stroke();return}
 if(kind==='dish'){g.strokeStyle=ROD;g.lineWidth=2.2;g.beginPath();g.moveTo(x,yb);g.lineTo(x+4,yb-14);g.stroke();
  g.save();g.translate(x+6,yb-22);g.rotate(-.5);g.beginPath();g.ellipse(0,0,13,8,0,0,7);g.fillStyle='#f7f3e8';g.fill();g.beginPath();g.ellipse(-2,0,8,4.5,0,0,7);g.fillStyle='#d8d2c2';g.fill();g.restore();return}
 if(kind==='plants'){// Potted plants in a brick planter, a common rooftop garden.
  poly([x,yb,x+36,yb,x+34,yb-12,x+2,yb-12],'#c4703f',1.5);g.fillStyle='#97522c';g.fillRect(x+2,yb-12,32,3);
  [[7,-18,7,2],[16,-22,8,1],[26,-17,7,2],[12,-14,5,0],[22,-13,5,1]].forEach(l=>{g.beginPath();g.arc(x+l[0],yb+l[1],l[2],0,7);g.fillStyle=CITY.trees[l[3]];g.fill()});return}
 if(kind==='laundry'){// Laundry pole with clothes drying.
  g.strokeStyle=ROD;g.lineWidth=2;g.beginPath();g.moveTo(x,yb);g.lineTo(x,yb-34);g.moveTo(x+44,yb);g.lineTo(x+44,yb-34);g.moveTo(x,yb-32);g.lineTo(x+44,yb-32);g.stroke();
  const sw=reduceMotion?0:Math.sin(tt*3+seed)*2;[['#e8b45a',4,12],['#f7efd9',17,16],['#3f8f97',32,10]].forEach(c=>{poly([x+c[1],yb-32,x+c[1]+c[2],yb-32,x+c[1]+c[2]+sw,yb-16,x+c[1]+sw,yb-16],c[0],1.2)});return}
 if(kind==='pipe'){poly([x,yb,x+12,yb,x+12,yb-24,x,yb-24],'#d8d2c2',1.5);poly([x-3,yb-24,x+15,yb-24,x+15,yb-30,x-3,yb-30],'#b5ae9c',1.5)}}
const PROPS=['tank','ac','plants','antenna','laundry','tank','dish','plants','pipe'];
// Rooftop add-on shed (頂樓加蓋): corrugated metal walls and a sloped sheet roof, toward the back of the roof.
function shed(x,yb,w,h,col){const dep=DEP*.5,dx=dxAt(x+w/2)*.5;
 if(dx>0)poly([x+w,yb,x+w+dx,yb-dep,x+w+dx,yb-h-dep,x+w,yb-h],col[1],1.5);else poly([x,yb,x+dx,yb-dep,x+dx,yb-h-dep,x,yb-h],col[1],1.5);
 poly([x,yb,x+w,yb,x+w,yb-h,x,yb-h],col[0],1.5);
 g.fillStyle='rgba(247,239,217,.3)';for(let i=x+4;i<x+w-2;i+=6)g.fillRect(i,yb-h+2,1.5,h-3);
 poly([x+w*.62,yb,x+w*.84,yb,x+w*.84,yb-h*.72,x+w*.62,yb-h*.72],'#f7efd9',1.2);
 poly([x-4,yb-h,x+w+4,yb-h,x+w+4+dx,yb-h-dep-4,x-4+dx,yb-h-dep-4],col[2],1.5)}
const SHEDC=[['#3f8f97','#2f6f78','#8fd0c4'],['#5a9b5c','#3f7d4f','#a8d29a'],['#e3a24f','#b9782f','#f6d38a']];
function sideFace(xe,de,y0,P){const B=H+30;poly([xe,y0,xe+de,y0-DEP,xe+de,B,xe,B],P.side,1.5);
 g.save();g.beginPath();g.moveTo(xe,y0);g.lineTo(xe+de,y0-DEP);g.lineTo(xe+de,B);g.lineTo(xe,B);g.closePath();g.clip();
 for(let fy=y0+36;fy<H;fy+=78){if(Math.abs(de)>10){const wx0=xe+de*.25,wx1=xe+de*.75;g.fillStyle='rgba(31,58,64,.45)';g.beginPath();g.moveTo(wx0,fy-DEP*.25);g.lineTo(wx1,fy-DEP*.75);g.lineTo(wx1,fy-DEP*.75+38);g.lineTo(wx0,fy-DEP*.25+38);g.closePath();g.fill()}
  g.fillStyle='rgba(247,239,217,.22)';g.beginPath();g.moveTo(xe,fy+44);g.lineTo(xe+de,fy+44-DEP);g.lineTo(xe+de,fy+49-DEP);g.lineTo(xe,fy+49);g.closePath();g.fill()}
 g.restore()}
// Window with an iron grille (鐵窗) sticking out from the wall.
function grilleWindow(wx,wy,P,lit,ac){
 g.fillStyle=lit?P.winL:P.win;g.fillRect(wx,wy,28,36);g.fillStyle='rgba(247,239,217,.25)';g.fillRect(wx,wy,28,8);
 g.fillStyle='rgba(31,58,64,.22)';g.fillRect(wx-6,wy+42,40,4);
 g.fillStyle=P.trim;g.fillRect(wx-6,wy-5,40,3);g.fillRect(wx-6,wy+38,40,3);for(let i=wx-5;i<wx+34;i+=5)g.fillRect(i,wy-2,1.6,40);g.fillRect(wx-6,wy+16,40,1.6);
 poly([wx-8,wy-5,wx+36,wy-5,wx+33,wy-10,wx-5,wy-10],P.trim,1.2);
 if(ac)acUnit(wx-2,wy+64,30,wx)}
// Vertical shop sign hanging off the wall, with a little thickness.
function vSign(x,y,i){const c=SIGNC[i%SIGNC.length],s=SIGNS[i%SIGNS.length],h=26*s.length+10;
 poly([x+22,y,x+27,y-4,x+27,y+h-4,x+22,y+h],dark(c[0]),1.5);poly([x,y,x+22,y,x+22,y+h,x,y+h],c[0],1.5);
 g.strokeStyle='rgba(247,239,217,.7)';g.lineWidth=1.5;g.strokeRect(x+3,y+3,16,h-6);
 g.fillStyle=c[1];g.font='900 17px '+FONT;g.textAlign='center';for(let k=0;k<s.length;k++)g.fillText(s[k],x+11,y+25+k*26)}
function roof(r){
 const P=BLD[r.id%BLD.length],x0=r.x,x1=r.x+r.w,y0=r.y+8,d0=dxAt(x0),d1=dxAt(x1),B=H+30;
 if(d1>1)sideFace(x1,d1,y0,P);
 if(d0<-1)sideFace(x0,d0,y0,P);
 // Front wall: flat tone with a lit left band and a shaded right band (light from the upper left).
 poly([x0,y0,x1,y0,x1,B,x0,B],P.wall,1.5);
 g.fillStyle=P.shade;g.fillRect(x1-Math.min(26,r.w*.14),y0,Math.min(26,r.w*.14)-.8,B-y0);
 g.fillStyle='rgba(247,239,217,.18)';g.fillRect(x0+.8,y0,10,B-y0);
 g.fillStyle='rgba(31,58,64,.22)';g.fillRect(x0+1,y0+5,r.w-2,8);
 for(let fy=y0+36+50;fy<H;fy+=78){g.fillStyle='rgba(31,58,64,.18)';g.fillRect(x0+1,fy+5,r.w-2,4);g.fillStyle=P.trim;g.fillRect(x0-2,fy,r.w+4,5)}
 const sign=r.id%3===0&&r.w>150;
 for(let wi=0,wx=x0+(sign?44:22);wx<x1-38;wi++,wx+=54)for(let wj=0,wy=y0+40;wy<H;wj++,wy+=78)
  grilleWindow(wx,wy,P,(r.id*7+wi*3+wj)%5===0,(r.id+wi*2+wj)%4===1);
 if(sign)vSign(x0+10,y0+28,r.id);
 // Top face and the parapet along its back edge.
 poly([x0,y0,x1,y0,x1+d1,y0-DEP,x0+d0,y0-DEP],P.top,1.5);
 poly([x0+d0,y0-DEP,x1+d1,y0-DEP,x1+d1*.8,y0-DEP*.8,x0+d0*.8,y0-DEP*.8],P.topB);
 poly([x0+d0,y0-DEP,x1+d1,y0-DEP,x1+d1,y0-DEP-6,x0+d0,y0-DEP-6],P.trim,1.5);
 const yb=y0-DEP*.55;let n=r.w>230?2:r.w>140?1:0;
 if(r.id%3===1&&r.w>170){const sw=Math.min(110,r.w*.45),sx=x1-sw-14;shed(sx+dxAt(sx)*.45,yb-2,sw,34,SHEDC[r.id%SHEDC.length]);n=Math.min(n,1)}
 for(let i=0;i<n;i++){const k=PROPS[(r.id*3+i*5)%PROPS.length],px=x0+r.w*(i?.72:.22)+((r.id*13)%20)-10;prop(k,px+dxAt(px)*.45,yb,r.id)}
 // Front coping ledge, sunlit on top: the cat runs just behind it.
 poly([x0-4,y0-3,x1+4,y0-3,x1+4,y0+6,x0-4,y0+6],P.trim,1.5);
 g.fillStyle='rgba(255,246,224,.9)';g.fillRect(x0-3,y0-2.5,r.w+6,2)}
// Printed-poster finish over the whole scene: paper grain plus a soft light from the upper left.
function grade(){g.save();g.fillStyle=grain();g.fillRect(-20,0,W+40,H);g.globalCompositeOperation='soft-light';const gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,'rgba(255,228,170,.4)');gr.addColorStop(1,'rgba(31,90,96,.3)');g.fillStyle=gr;g.fillRect(-20,0,W+40,H);g.restore()}
// Roof top height at screen x, or null over a gap.
function roofAt(x){for(const r of cat.roofs)if(x>=r.x-8&&x<=r.x+r.w+8)return r.y;return null}
// Flag on the rooftops at a distance in metres: the next reward (paw coin) and the personal best (gold star). No text, so it reads in every language.
function marker(m,kind){
const x=CX+m*60-cat.dist;if(x<-20||x>W+30)return;const y=roofAt(x);if(y===null)return;
g.strokeStyle=OL;g.lineWidth=3;g.beginPath();g.moveTo(x,y-6);g.lineTo(x,y-58);g.stroke();
const wave=reduceMotion?0:Math.sin(tt*6+m)*3;
g.beginPath();g.moveTo(x,y-58);g.quadraticCurveTo(x+18,y-62+wave,x+34,y-54+wave);g.lineTo(x+34,y-36+wave);g.quadraticCurveTo(x+18,y-42+wave,x,y-38);g.closePath();O(kind==='best'?'#e8b45a':'#c9473f',3);
if(kind==='best')star(x+17,y-47+wave,6,'#fff6c7');else paw(x+17,y-47+wave,5,'#fff1c1')}
function star(x,y,r,col){g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}g.closePath();g.fillStyle=col;g.fill()}
function paw(x,y,r,col){g.fillStyle=col;g.beginPath();g.ellipse(x,y+r*.5,r*.9,r*.7,0,0,7);g.fill();[[-1,-.6],[-.35,-1.15],[.35,-1.15],[1,-.6]].forEach(p=>{g.beginPath();g.arc(x+p[0]*r,y+p[1]*r,r*.32,0,7);g.fill()})}
// One-touch hint for a new player: a pulsing tap ring under the screen centre until the first jump.
function tapHint(){
if(taught||st!=='run')return;
const p=reduceMotion?.5:(tt*1.4)%1,x=W/2,y=300;
g.globalAlpha=1-p;g.strokeStyle='#fff1c1';g.lineWidth=4;g.beginPath();g.arc(x,y,14+p*26,0,7);g.stroke();g.globalAlpha=1;
g.beginPath();g.arc(x,y,12,0,7);O('rgba(255,241,193,.9)',3);
// Pointing finger
g.save();g.translate(x+10,y+16);g.rotate(-.35);g.beginPath();g.roundRect?g.roundRect(-7,-24,14,30,7):g.rect(-7,-24,14,30);O('#fff1c1',3);g.beginPath();g.roundRect?g.roundRect(-13,0,26,24,9):g.rect(-13,0,26,24);O('#fff1c1',3);g.restore()}
function drawFx(){
for(const p of fx){const k=1-p.t/p.life;g.globalAlpha=Math.max(0,k);if(p.star)star(p.x,p.y,p.r+2,p.col);else{g.fillStyle=p.col;g.beginPath();g.arc(p.x,p.y,p.r*(1.4-k*.4),0,7);g.fill()}}g.globalAlpha=1;
// Speed lines once the run gets fast.
if(st==='run'&&!reduceMotion&&cat.v>280){const a=Math.min(.5,(cat.v-280)/240);g.strokeStyle='rgba(255,255,255,'+a+')';g.lineWidth=2;g.beginPath();for(let i=0;i<6;i++){const y=(i*97+((cat.dist*.7)|0))%320+110,x=W-((tt*900+i*173)%(W+120));g.moveTo(x,y);g.lineTo(x+40+i*6,y)}g.stroke()}}
// Sitting cat illustration (design/02-cat-sit-v1.png, user-provided), used while waiting to start. The file name
// carries a content hash; rename it when the art changes so a cached old file is never used.
const CAT_SIT=new Image();CAT_SIT.src='games/cat/art/cat-sit-5628d118.webp';
// Draw it with the head centred on x and the paws on y, h units tall, with a slow breathing scale.
function sitImg(x,y,h){if(!(CAT_SIT.complete&&CAT_SIT.naturalWidth))return false;const w=h*CAT_SIT.naturalWidth/CAT_SIT.naturalHeight,b=1+(reduceMotion?0:Math.sin(tt*2.2)*.012);
 g.drawImage(CAT_SIT,x-w*.72,y-h*b,w,h*b);return true}
// Action frames cut from design/花色貓咪動作精靈圖組.png (user-provided): 0-5 run cycle, 6 take-off, 7 mid-air
// stretch, 8 falling, 9 landing, 10 lying dizzy. [x, y, w, h] in the packed sheet; the name carries a content hash.
const RUN=new Image();RUN.src='games/cat/art/cat-run-afc876c4.webp';
const RF=[[0,0,307,209],[311,0,267,220],[582,0,267,221],[853,0,304,227],[1161,0,272,240],[1437,0,253,220],[1694,0,284,232],[0,244,336,227],[340,244,247,294],[591,244,280,188],[875,244,300,169]];
// Draw frame i with its paws on y = 0 and the body over x = 0 (the tail hangs off to the left).
function runFrame(i,k){if(!(RUN.complete&&RUN.naturalWidth))return false;const f=RF[i],w=f[2]*k,h=f[3]*k;g.drawImage(RUN,f[0],f[1],f[2],f[3],-w*.62,-h+1.5,w,h);return true}
// Cat for the current state: the sitting illustration while waiting, the action frames once running; the
// procedural rig (kitty()) is only a fallback while the images load. catPose() still advances the run phase.
function catSprite(){
 if(st==='ready'&&sitImg(0,1,50))return;
 const o=catPose();let i;
 if(st==='over')i=10;
 else if(!cat.on)i=cat.vy<0?(tt-K.jumpT<.12?6:7):8;
 else if(tt-K.landT<.16)i=9;
 else i=Math.floor(K.p*6)%6;
 if(!runFrame(i,.22))kitty(o)}
function draw(){
const ox=shake>0?(Math.random()-.5)*12:0;
g.setTransform(DPR,0,0,DPR,0,0);
g.save();g.translate(ox,0);
backdrop();
for(const r of cat.roofs)roof(r);
if(st!=='ready'){const s0=score();if(best>s0)marker(best,'best');const nx0=nextMilestone(s0)[0];if(nx0!==best)marker(nx0,'next')}
// Soft contact shadow under the cat while it is over a roof.
const gy=roofAt(CX);if(gy!==null&&st!=='over'){const d=Math.max(0,gy-cat.cy),k=Math.max(.25,1-d/220);g.fillStyle='rgba(31,58,64,'+(.28*k)+')';g.beginPath();g.ellipse(CX+4,gy-2,30*k,6*k,0,0,7);g.fill()}
g.save();g.translate(CX,cat.cy);g.scale(1+cat.sq*.4,1-cat.sq*.4);catSprite();g.restore();
drawFx();
grade();
g.restore();
const s=score(),nx=nextMilestone(s);
tx(s+' m',W/2,76,40,'#fff1c1');
if(st==='run')tx('下一個獎勵 '+nx[0]+' m · +'+nx[1]+' 點',W/2,104,15,'#9bfff0');
tx('最佳 '+best+' m',W-118,30,16,'#ffd23f');
tx('{{t:cat.msg.004}}'+earned+' 點',70,30,16,earned>0?'#ffd23f':'#fff1c1');
pops.forEach(p=>{g.globalAlpha=Math.max(0,1-p.age/2.2);const y=175-(reduceMotion?0:Math.min(1,p.age*3)*22);tx('+'+p.b+' 點',W/2,y,38,'#ffd23f');tx(p.m+' 公尺里程碑',W/2,y+28,17,'#fff1c1');g.globalAlpha=1});
if(st!=='run'){
g.fillStyle='rgba(20,52,58,.5)';g.fillRect(0,0,W,H);
if(st==='ready'){if(!sitImg(W/2,220,132)){g.save();g.translate(W/2-14,214);g.scale(1.9,1.9);kitty(catPose());g.restore()}cityTitle(372,1);tx('{{t:cat.msg.005}}',W/2,258,36,'#ffd23f');tx('{{t:cat.msg.006}}',W/2,300,22,'#fff1c1')}
else{tx('{{t:cat.msg.007}}',W/2,205,34,'#ff5d8f');tx(s+' m',W/2,270,50,'#fff1c1');tx(earned>0?'{{t:cat.msg.008}}'+earned+' 點':'沒到 '+MILESTONES[0][0]+' 公尺，沒有獎勵',W/2,314,22,earned>0?'#ffd23f':'#fff1c1');if(rec)tx('{{t:cat.msg.009}}',W/2,348,20,'#ffd23f');tx('{{t:cat.msg.010}}',W/2,392,20,'#fff1c1')}}
if(st==="run"&&tt-cityT<2.6)cityTitle(200,Math.min(1,(2.6-(tt-cityT))/.8));
tapHint();holdHint();cornerButton();if(panel)drawPanel()}
// Poster-style city name: TAIPEI · TAIWAN. A proper noun, shown in Latin letters in every language.
function cityTitle(y,a){g.save();g.globalAlpha=a;g.textAlign='center';try{g.letterSpacing='4px'}catch(e){}
g.font='900 44px '+FONT;g.fillStyle='rgba(31,58,64,.55)';g.fillText(CITY.name,W/2+3,y+3);g.fillStyle='#bfe8dc';g.fillText(CITY.name,W/2,y);
try{g.letterSpacing='8px'}catch(e){}g.font='900 15px '+FONT;g.fillStyle='#e8b45a';g.fillText(CITY.sub,W/2,y+24);g.restore()}
// ===== Sound: everything is synthesized with Web Audio (no audio files, so nothing to license). Music plays
// during a run; effects for jump, landing, milestone and fall. Music and effects switch off separately (saved). =====
const MKEY='deep-sea-cat-music',XKEY='deep-sea-cat-sfx';
const LS=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
let musicOn=LS(MKEY)!=='0',sfxOn=LS(XKEY)!=='0',ac=null,master=null,musBus=null,sfxBus=null,noise=null,echo=null,nextT=0,stepI=0;
function audioInit(){
 if(!ac){try{ac=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return}
  master=ac.createGain();master.gain.value=.85;master.connect(ac.destination);
  musBus=ac.createGain();musBus.gain.value=musicOn?.5:0;musBus.connect(master);
  sfxBus=ac.createGain();sfxBus.gain.value=sfxOn?.9:0;sfxBus.connect(master);
  // A soft echo send for the melody.
  echo=ac.createDelay(1);echo.delayTime.value=.31;const fb=ac.createGain(),ef=ac.createBiquadFilter();fb.gain.value=.28;ef.type='lowpass';ef.frequency.value=2200;
  echo.connect(ef);ef.connect(fb);fb.connect(echo);ef.connect(musBus);
  noise=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
 if(ac.state==='suspended')ac.resume().catch(()=>{})}
function syncAudio(){if(musBus)musBus.gain.value=musicOn?.5:0;if(sfxBus)sfxBus.gain.value=sfxOn?.9:0;
 try{localStorage.setItem(MKEY,musicOn?'1':'0');localStorage.setItem(XKEY,sfxOn?'1':'0')}catch(e){}}
const mf=n=>440*Math.pow(2,(n-69)/12);
// One enveloped voice: wave, frequency (or [from, to] glide), start time, length, peak gain, bus, low-pass cutoff, echo send.
function tone(type,f,t0,len,gain,bus,cut,send){const o=ac.createOscillator(),gn=ac.createGain();o.type=type;
 if(Array.isArray(f)){o.frequency.setValueAtTime(f[0],t0);o.frequency.exponentialRampToValueAtTime(f[1],t0+len)}else o.frequency.value=f;
 gn.gain.setValueAtTime(0,t0);gn.gain.linearRampToValueAtTime(gain,t0+.012);gn.gain.exponentialRampToValueAtTime(.0001,t0+len);
 let node=o;if(cut){const fl=ac.createBiquadFilter();fl.type='lowpass';fl.frequency.value=cut;o.connect(fl);node=fl}
 node.connect(gn);gn.connect(bus);if(send)gn.connect(echo);o.start(t0);o.stop(t0+len+.05)}
function hiss(t0,len,gain,bus,type,f){const s=ac.createBufferSource(),fl=ac.createBiquadFilter(),gn=ac.createGain();s.buffer=noise;fl.type=type;fl.frequency.value=f;
 gn.gain.setValueAtTime(gain,t0);gn.gain.exponentialRampToValueAtTime(.0001,t0+len);s.connect(fl);fl.connect(gn);gn.connect(bus);s.start(t0,Math.random()*.5);s.stop(t0+len+.02)}
const SFX={
 jump:t=>tone('triangle',[380,820],t,.16,.16,sfxBus,3000),
 land:t=>{hiss(t,.09,.18,sfxBus,'lowpass',700);tone('sine',[150,70],t,.1,.18,sfxBus)},
 coin:t=>[72,76,79,84].forEach((n,i)=>tone('sine',mf(n+12),t+i*.07,.28,.12,sfxBus)),
 fall:t=>tone('triangle',[640,140],t,.6,.14,sfxBus,2400),
 tick:t=>tone('sine',1100,t,.05,.08,sfxBus)};
function sfx(k){if(!sfxOn)return;audioInit();if(ac&&ac.state==='running')SFX[k](ac.currentTime+.005)}
// A light city-pop / lo-fi loop at 96 BPM: Fmaj7 - Em7 - Dm7 - Cmaj7 electric-piano chords, round bass, soft
// drums and a pentatonic hook with echo. Notes are scheduled slightly ahead so the beat stays steady.
const BPM=96,STEP=60/BPM/4,CH=[[53,57,60,64],[52,55,59,62],[50,53,57,60],[48,52,55,59]],BASS=[41,40,38,36];
const MEL=[[[0,72,2],[3,69,1],[4,72,2],[8,74,3],[12,72,2]],[[0,71,3],[4,67,2],[8,69,4]],[[0,69,2],[2,72,2],[4,74,2],[8,76,3],[12,74,2]],[[0,72,4],[6,67,2],[8,69,6]]];
function music(){
 if(!musicOn||!ac||ac.state!=='running'||st!=='run'||paused){nextT=0;return}
 if(!nextT||nextT<ac.currentTime-.2){nextT=ac.currentTime+.05;stepI=0}
 while(nextT<ac.currentTime+.14){
  const bar=Math.floor(stepI/16)%4,s=stepI%16,t=nextT;
  if(s===0||s===10)CH[bar].forEach(n=>tone('triangle',mf(n),t,s?STEP*2.2:STEP*6,.045,musBus,1800));
  if(s===0||s===6||s===8||s===14)tone('sine',mf(BASS[bar]+(s===8?7:s===14?12:0)),t,STEP*1.8,.17,musBus);
  if(s%8===0)tone('sine',[130,48],t,.16,.22,musBus);
  if(s===4||s===12)hiss(t,.12,.07,musBus,'bandpass',1800);
  if(s%2===0)hiss(t,.035,s%4?.03:.018,musBus,'highpass',7000);
  MEL[bar].forEach(m=>{if(m[0]===s)tone('square',mf(m[1]),t,STEP*m[2]*.95,.035,musBus,2600,true)});
  nextT+=STEP;stepI++}}
// ===== Pause and settings: one card drawn on the canvas. During a run the corner button pauses play (the
// leaderboard clock does not advance while paused); before or after a run it opens the same card as settings.
// P also toggles pause; Escape is left alone (it exits full screen on CrazyGames). =====
let paused=false,panel=null,hits=[],holdAt=0,heldLong=false,firstJumpT=-9;
const BTN={x:W-26,y:30,r:17};
function openPanel(mode){panel=mode;if(mode==='pause'){paused=true;release()}sfx('tick')}
function closePanel(){panel=null;paused=false;last=performance.now();sfx('tick')}
function autoPause(){if(st==='run'&&!paused)openPanel('pause')}
function canvasPoint(e){const r=c.getBoundingClientRect();return [(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height]}
// Returns true when the tap was used by the button or the card (so it does not also jump).
function tapUI(p){
 if(panel){for(const h of hits)if(p[0]>=h.x&&p[0]<=h.x+h.w&&p[1]>=h.y&&p[1]<=h.y+h.h){h.fn();break}return true}
 if(Math.hypot(p[0]-BTN.x,p[1]-BTN.y)<BTN.r+8){openPanel(st==='run'?'pause':'settings');return true}
 return false}
function cornerButton(){
 g.beginPath();g.arc(BTN.x,BTN.y,BTN.r,0,7);g.fillStyle='rgba(31,58,64,.6)';g.fill();g.lineWidth=2;g.strokeStyle='rgba(247,239,217,.85)';g.stroke();
 g.fillStyle='#f7efd9';
 if(st==='run'){g.fillRect(BTN.x-6,BTN.y-7,4.5,14);g.fillRect(BTN.x+1.5,BTN.y-7,4.5,14);return}
 // Speaker: sound settings.
 g.beginPath();g.moveTo(BTN.x-9,BTN.y-3.5);g.lineTo(BTN.x-5,BTN.y-3.5);g.lineTo(BTN.x+1,BTN.y-8.5);g.lineTo(BTN.x+1,BTN.y+8.5);g.lineTo(BTN.x-5,BTN.y+3.5);g.lineTo(BTN.x-9,BTN.y+3.5);g.closePath();g.fill();
 g.strokeStyle='#f7efd9';g.lineWidth=1.8;g.lineCap='round';
 if(musicOn||sfxOn){g.beginPath();g.arc(BTN.x+2,BTN.y,5,-.8,.8);g.stroke();g.beginPath();g.arc(BTN.x+2,BTN.y,9,-.8,.8);g.stroke()}
 else{g.beginPath();g.moveTo(BTN.x+4,BTN.y-4);g.lineTo(BTN.x+11,BTN.y+4);g.moveTo(BTN.x+11,BTN.y-4);g.lineTo(BTN.x+4,BTN.y+4);g.stroke()}}
function pill(x,y,on){g.beginPath();g.roundRect?g.roundRect(x,y,58,30,15):g.rect(x,y,58,30);g.fillStyle=on?'#4f9e9c':'#a9b3b1';g.fill();
 g.beginPath();g.arc(on?x+43:x+15,y+15,11,0,7);g.fillStyle='#fffaf0';g.fill()}
function drawPanel(){
 hits=[];g.fillStyle='rgba(20,40,44,.6)';g.fillRect(0,0,W,H);
 g.beginPath();g.roundRect?g.roundRect(70,168,260,234,20):g.rect(70,168,260,234);g.fillStyle='#f7efd9';g.fill();g.lineWidth=3;g.strokeStyle='#1f3a40';g.stroke();
 tx(panel==='pause'?'{{t:cat.msg.014}}':'{{t:cat.msg.015}}',W/2,214,26,'#e8b45a');
 const row=(y,label,on,fn)=>{g.font='800 19px '+FONT;g.textAlign='left';g.fillStyle='#1f3a40';g.fillText(label,96,y+21,140);pill(250,y,on);hits.push({x:236,y:y-8,w:86,h:46,fn})};
 row(236,'{{t:cat.msg.016}}',musicOn,()=>{musicOn=!musicOn;audioInit();syncAudio();sfx('tick')});
 row(282,'{{t:cat.msg.017}}',sfxOn,()=>{sfxOn=!sfxOn;audioInit();syncAudio();sfx('tick')});
 g.beginPath();g.roundRect?g.roundRect(120,334,160,50,14):g.rect(120,334,160,50);g.fillStyle='#4f9e9c';g.fill();
 g.font='900 21px '+FONT;g.textAlign='center';g.fillStyle='#fffaf0';g.fillText(panel==='pause'?'{{t:cat.msg.018}}':'{{t:cat.msg.019}}',W/2,366,150);
 hits.push({x:112,y:326,w:176,h:66,fn:closePanel})}
// After the first jump, a short reminder that holding the tap makes a higher jump (until the player tries it).
function holdHint(){
 if(st!=='run'||heldLong||paused||tt-firstJumpT>6||tt<firstJumpT)return;
 const a=Math.min(1,(tt-firstJumpT)*2,(6-(tt-firstJumpT))*1.5),p=reduceMotion?.6:(tt*.9)%1,x=W/2,y=292;
 g.save();g.globalAlpha=a;g.beginPath();g.arc(x,y,13,0,7);g.fillStyle='rgba(31,58,64,.45)';g.fill();
 g.beginPath();g.arc(x,y,13,-Math.PI/2,-Math.PI/2+p*Math.PI*2);g.strokeStyle='#e8b45a';g.lineWidth=4;g.stroke();
 tx('{{t:cat.msg.020}}',x,y+36,17,'#fff1c1');g.restore()}
function start(){
 if(st==='run')return;
 audioInit();paused=false;panel=null;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return;}
 catRank.start(random=>{
  catRandom=random||Math.random;cat=catRules.create(catRandom);
  analytics=AN.start('cat',amount);catStake=amount;catBusy=true;save();renderAll();
  shake=0;earned=0;awarded=0;pops=[];fx=[];cityT=tt;wasOn=true;jumped=false;rec=false;st='run';last=performance.now();
  say('{{t:cat.msg.011}}');ui();c.focus();
 });
}
function down(){
 if(st!=='run'||paused||$('view-cat').hidden||document.hidden)return false;holdAt=tt;
 catRules.input(cat,0);catRank.record(0);return true;
}
function release(){if(st==='run'&&tt-holdAt>.24)heldLong=true;if(st==='run'&&catRules.input(cat,1))catRank.record(1)}
$('ct-go').addEventListener('click',start);
c.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;audioInit();if(tapUI(canvasPoint(e))){e.preventDefault();return}if(down()){e.preventDefault();c.focus()}else if(st!=='run')say(st==='over'?'{{t:cat.msg.012}}':'{{t:cat.msg.013}}')});
['pointerup','pointercancel'].forEach(n=>c.addEventListener(n,release));
c.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{if($('view-cat').hidden||document.hidden||st!=='run'||e.metaKey||e.altKey||e.ctrlKey)return;if(e.code==='KeyP'&&!e.repeat&&!['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName)){e.preventDefault();panel?closePanel():openPanel('pause');return}if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;if(e.key===' '||e.key==='ArrowUp'){e.preventDefault();if(!e.repeat)down()}});
addEventListener('keyup',e=>{if(e.key===' '||e.key==='ArrowUp')release()});
// Leaving the app, the tab or the game pauses the run.
addEventListener('blur',()=>{release();autoPause();last=performance.now()});
document.addEventListener('visibilitychange',()=>{release();if(document.hidden)autoPause();last=performance.now()});
window.addEventListener('hashchange',()=>{release();autoPause();last=performance.now()});
function loop(t){
 const ms=Math.min(50,Math.max(0,t-last)||0);last=t;
 if(!$('view-cat').hidden&&!document.hidden){if(!paused)catRank.update(ms,()=>st==='run',update);ui();music();draw()}
 requestAnimationFrame(loop);
}
ui();draw();requestAnimationFrame(loop);
  })();

