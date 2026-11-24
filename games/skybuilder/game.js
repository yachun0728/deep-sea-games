  /* ---------- Sky Builder: crane-stacking tower; fixed skill milestones award bonus points immediately ---------- */
  var sbBusy=false,sbStake=0,sbSay=function(){};
  (function(){
const c=$('sb-canvas'),g=c.getContext('2d'),W=400,H=560,DPR=2,BASE=480,BW=92,BH=62,PX=200;
// Sprites cut from design/01-03 + 07 (see design/README.md). Map is [x,y,w,h] in the 2x atlas; draw size = w/2 x h/2.
const A={"jib":[0,0,550,231],"Perfect":[552,0,308,191],"hook":[862,0,87,166],"cabin":[0,233,149,164],"logo":[151,233,620,160],"Great":[773,233,240,146],"Good":[0,399,215,142],"bDrop2":[217,399,138,136],"bDrop":[357,399,130,132],"Poor":[489,399,201,131],"Fail":[692,399,199,130],"roof":[0,543,247,129],"f0":[249,543,216,124],"f1":[467,543,216,124],"f2":[685,543,216,124],"f3":[0,674,216,124],"f4":[218,674,216,124],"f5":[436,674,216,124],"f6":[654,674,216,124],"f7":[0,800,216,124],"Average":[218,800,231,122],"cbase":[451,800,198,92],"pFloor":[651,800,245,85],"tFrame":[0,926,274,84],"found":[276,926,346,74],"mast":[624,926,88,71],"pCrown":[714,926,228,69],"trolley":[0,1012,98,64],"tFill":[100,1012,192,40],"cable":[294,1012,232,20]};
const SPR=new Image();SPR.src='games/skybuilder/art/sprites.webp';const SKY=new Image();SKY.src='games/skybuilder/art/sky.webp';const GND=new Image();GND.src='games/skybuilder/art/ground.webp';
const ok=i=>i.complete&&i.naturalWidth>0;
// Draw sprite k with its top-left at (x,y); w defaults to the atlas size, h keeps the aspect ratio.
function spr(k,x,y,w,h){const a=A[k];if(!a||!ok(SPR))return;w=w||a[2]/2;h=h||w*a[3]/a[2];g.drawImage(SPR,a[0],a[1],a[2],a[3],x,y,w,h)}
const FW=108,MX=368,FT=['f1','f2','f0','f3','f7','f5','f6'];
const MILESTONES=[10,20,30],BONUS=5;
let best=0;try{best=+localStorage.getItem('deep-sea-skybuilder-best')||0}catch(e){}
let analytics=null,paid=0,awarded=new Set();

const rnd=(a,b)=>a+Math.random()*(b-a),cl=(x,a,b)=>Math.max(a,Math.min(b,x));
let st='ready',tower=skybuilderRules.create(),t=0,pops=[],parts=[],rec=false,last=0;
const floors=()=>skybuilderRules.score(tower);
const hook=()=>skybuilderRules.hook(tower);
const skyRank=timedLeaderboard('skybuilder','sb',skybuilderRules.inputCount,ui);
function burst(x,y,col,n){for(let i=0;i<n;i++)parts.push({x,y,vx:rnd(-160,160),vy:rnd(-260,-40),l:1,c:col,r:rnd(2,5)})}
function say(text,kind){$('sb-msg').textContent=text;$('sb-msg').className='msg'+(kind?' '+kind:'')}
sbSay=say;
function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
function ui(){
 const n=floors(),live=st==='run',next=MILESTONES.find(x=>!awarded.has(x));
 setText('sb-floors',n+' 層');setText('sb-score',String(tower.sc));setText('sb-best',best+' 層');setText('sb-pay',fmt(paid)+' 點');
 setText('sb-next',next?next+' 層 · +'+BONUS+' 點':'{{t:skybuilder.msg.001}}');
 $('sb-amount').disabled=sbBusy;$('sb-go').disabled=live||skyRank.busy();setText('sb-go',live?'{{t:skybuilder.msg.002}}':st==='over'?'{{t:skybuilder.msg.003}}':'{{t:skybuilder.msg.004}}');
 document.querySelectorAll('[data-sb-tier]').forEach(el=>el.setAttribute('aria-current',awarded.has(Number(el.dataset.sbTier))?'step':'false'));
}
function end(){
 if(st!=='run')return;
 st='over';const n=floors();rec=n>best;
 if(rec){best=n;try{localStorage.setItem('deep-sea-skybuilder-best',best)}catch(e){}}
 AN.end(analytics,paid,'loss',{score:tower.sc,floors:n,total_bonus_points:paid});sbBusy=false;renderAll();
 const why=tower.msg==='collapse'?'{{t:skybuilder.msg.005}}':'{{t:skybuilder.msg.006}}';
 say(why+'，本局 '+n+' 層、'+tower.sc+' 分。BONUS 共 '+paid+' 點已入帳。',paid?'win':'');
 skyRank.finish(n);
 ui();
}
function awardBonus(){
 if(st!=='run')return;
 const n=floors();
 for(const milestone of MILESTONES){
  if(n<milestone||awarded.has(milestone))continue;
  awarded.add(milestone);paid+=BONUS;S.balance+=BONUS;save();renderAll();
  AN.progress(analytics,{step:n,score:tower.sc,floors:n,milestone,bonus_points:BONUS,total_bonus_points:paid});
  pops.push({s:'BONUS +'+BONUS,x:W/2,y:210,t:0,c:'#ffd23f'});
  say('達成 '+milestone+' 層！BONUS +'+BONUS+' 點已入帳。','win');
 }
}
function update(dt){
 t+=dt;
 parts.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=700*dt;p.l-=dt*1.6});parts=parts.filter(p=>p.l>0);
 pops.forEach(p=>p.t+=dt);pops=pops.filter(p=>p.t<1);
 const event=skybuilderRules.advance(tower,dt,null,st==='run');
 if(event){
  const {x,y,result}=event;
  pops.push({s:result,x,y:y-40,t:0});
  if(result==='Fail'){
   burst(x,y,'#ffffff',10);
  }else{
   if(result==='Perfect'){
    burst(x,y,'#ffd23f',22);
    if(tower.combo>1)pops.push({s:'x'+tower.combo,x:cl(x-128,72,W-72),y:y+8,t:0,c:'#ffd23f'});
   }else burst(x,y,'#e9e2d0',8);
   if(tower.ph==='collapse'){
    burst(PX,BASE+tower.cam,'#d9c9a3',26);
   }else awardBonus();
  }
 }
 if(tower.dead&&st==='run')end();
}
// Floor sprite: the art is drawn 108 wide (BW 92 + the overhang the rules still accept) so a visible miss is a real miss.
function floor(lx,y,i){spr(i===0?'f4':FT[(i-1)%FT.length],lx-FW/2,y,FW,BH)}
function roof(lx,y){spr('roof',lx-62,y-58,124)}
// Phone full screen: the canvas grows to the screen's height. Play stays in its 400x560 box (shifted down by OY);
// the sky above holds the HUD and the ground below leaves room for the start and share buttons.
let VH=H,OY=0;const MOBILE=matchMedia('(max-width:880px),(pointer:coarse) and (max-width:1100px)');
function fit(){const p=c.parentElement;let vh=H;if(MOBILE.matches&&p&&p.clientWidth>0&&p.clientHeight>0)vh=Math.max(H,Math.round(W*p.clientHeight/p.clientWidth));if(vh!==VH||c.width!==W*DPR){VH=vh;c.width=W*DPR;c.height=Math.round(VH*DPR)}OY=VH>H?Math.min(140,Math.round((VH-H)*.45)):0}
function scene(){
 const sk=g.createLinearGradient(0,0,0,VH);sk.addColorStop(0,'#2f8fe8');sk.addColorStop(1,'#8fd3ff');g.fillStyle=sk;g.fillRect(0,0,W,VH);
 // One sky image (no tiling seams): scaled to cover the screen with a little spare height that scrolls in as the tower rises
 if(ok(SKY)){const hs=Math.max(VH*1.12,SKY.naturalHeight*W/SKY.naturalWidth),ws=hs*SKY.naturalWidth/SKY.naturalHeight,sp=hs-VH;g.drawImage(SKY,(W-ws)/2,-sp+Math.min(sp,tower.cam*.06),ws,hs)}
 const gy=OY+BASE+tower.cam;
 if(gy-350<VH&&ok(GND)){const h=GND.naturalHeight*W/GND.naturalWidth;g.drawImage(GND,0,gy-350,W,h);const by=gy-350+h-1;if(by<VH){const d=g.createLinearGradient(0,by,0,VH);d.addColorStop(0,'#dc8547');d.addColorStop(1,'#c46f38');g.fillStyle=d;g.fillRect(0,by,W,VH-by)}}
}
// Crane: jib and cab fixed at the top, mast tiled down to the ground, trolley above the pivot (PX,60), cable to the claw.
function crane(h,holding){
 if(!ok(SPR))return;
 const gy=BASE+tower.cam,mt=87,mb=Math.min(gy-40,VH-OY);
 for(let y=mt;y<mb;y+=35.5)spr('mast',MX-22,y,44,35.5);
 if(gy-46<VH-OY)spr('cbase',MX-49.5,gy-46,99);
 spr('jib',MX-205.5,-28.5,275);
 spr('cabin',MX-34,74,72);
 spr('trolley',PX-24.5,24,49);
 const hy=h.y+14-83;
 g.strokeStyle='#4a4f5a';g.lineWidth=4;g.lineCap='round';g.beginPath();g.moveTo(PX,52);g.lineTo(h.x,hy+4);g.stroke();
 g.strokeStyle='#a9b0bb';g.lineWidth=1.6;g.beginPath();g.moveTo(PX,52);g.lineTo(h.x,hy+4);g.stroke();
 if(holding)floor(h.x,h.y+10,tower.blocks.length);
 spr('hook',h.x-21.75,hy,43.5);
}
function pill(x,y,w,h){g.fillStyle='rgba(16,40,90,.25)';g.beginPath();g.roundRect?g.roundRect(x,y+3,w,h,h/2):g.rect(x,y+3,w,h);g.fill();g.fillStyle='#fff';g.beginPath();g.roundRect?g.roundRect(x,y,w,h,h/2):g.rect(x,y,w,h);g.fill()}
function num(s,x,y,sz,col,al,mw){g.font='900 '+sz+'px "Noto Sans TC",system-ui,sans-serif';g.textAlign=al||'center';g.textBaseline='middle';g.lineJoin='round';g.lineWidth=Math.max(3,sz/5);g.strokeStyle='#123a7a';g.strokeText(s,x,y,mw||W);g.fillStyle=col||'#fff';g.fillText(s,x,y,mw||W);g.textBaseline='alphabetic'}
// Stability meter: the marker moves from green to red as the tower leans toward the 45 degree collapse point.
function meter(x,y,w){const h=w*84/274;spr('tFrame',x,y,w,h);const ix=x+w*.08,iw=w*.84,iy=y+h*.3,ih=h*.4;spr('tFill',ix,iy,iw,ih);
 const v=cl(Math.abs(tower.td)/45,0,1),mx=ix+iw*v;g.fillStyle='#fff';g.strokeStyle='#123a7a';g.lineWidth=2;g.beginPath();g.roundRect?g.roundRect(mx-4,y+h*.16,8,h*.68,3):g.rect(mx-4,y+h*.16,8,h*.68);g.fill();g.stroke()}
function hud(){
 if(OY>0){
  // One row next to the back button: floor panel, crown (score) panel and stability meter share the width at one height, each keeping its aspect ratio
  const L=60,R=W-10,GAP=6,rf=245/85,rc=228/69,rm=274/84,h=(R-L-GAP*2)/(rf+rc+rm),y=12;
  const wf=h*rf,wc=h*rc,wm=h*rm,xc=L+wf+GAP,xm=xc+wc+GAP;
  spr('pFloor',L,y,wf,h);num(String(floors()),L+wf*.63,y+h*.56,Math.round(h*.56),'#fff','center',wf*.6);
  spr('pCrown',xc,y,wc,h);num(String(tower.sc),xc+wc*.64,y+h*.52,Math.round(h*.56),'#fff','center',wc*.6);
  meter(xm,y,wm);
  num('最佳 '+best+' 層 · BONUS +'+paid,R,y+h+14,12,'#ffe27a','right',R-L);
 }else meter(W-162,H-54,150);
}
function wrapLines(t,font,mw){t=window.deepSeaI18n?deepSeaI18n.text(String(t)):String(t);g.font=font;const parts=/\s/.test(t)?t.split(/(\s+)/):[...t],out=[];let cur='';parts.forEach(p=>{const nx=cur+p;if(cur.trim()&&g.measureText(nx).width>mw&&!/^\s+$/.test(p)&&!/^[，。！？、：；）」』]$/.test(p)){out.push(cur.trim());cur=p.trimStart()}else cur=nx});if(cur.trim())out.push(cur.trim());return out}
// White card with ~12% side padding; text wraps to the card width and the card grows with it.
function block(items,top){const X=36,CW=W-72,PX2=40,PY=20,TW=CW-PX2*2,rows=[];
 items.forEach(it=>wrapLines(it[0],'900 '+it[1]+'px "Noto Sans TC",system-ui,sans-serif',TW).forEach(l=>rows.push([l,it[1],it[2]])));
 const lh=r=>Math.round(r[1]*1.4),tot=rows.reduce((a,r)=>a+lh(r),0)+PY*2;
 g.fillStyle='rgba(16,40,90,.22)';g.beginPath();g.roundRect?g.roundRect(X+2,top+6,CW,tot,22):g.rect(X+2,top+6,CW,tot);g.fill();
 g.fillStyle='#fff';g.beginPath();g.roundRect?g.roundRect(X,top,CW,tot,22):g.rect(X,top,CW,tot);g.fill();
 let y=top+PY;rows.forEach(r=>{const h=lh(r);g.font='900 '+r[1]+'px "Noto Sans TC",system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle=r[2];g.fillText(r[0],W/2,y+h/2,TW);g.textBaseline='alphabetic';y+=h});return top+tot}
function draw(){
 fit();g.setTransform(DPR,0,0,DPR,0,0);
 scene();
 g.save();g.translate(0,OY);
 const gy=BASE+tower.cam;
 g.save();g.translate(PX,gy);g.rotate(tower.td*Math.PI/180);
 const b0=tower.blocks[0];spr('found',b0.lx-86.5,-14,173);
 tower.blocks.forEach((bk,i)=>floor(bk.lx,-(i+1)*BH,i));
 const tp=tower.blocks[tower.blocks.length-1];roof(tp.lx,-tower.blocks.length*BH);
 g.restore();
 if(tower.fall){g.save();g.translate(tower.fall.x,tower.fall.y+BH/2);g.rotate(tower.fall.rot);floor(0,-BH/2,tower.fall.i);g.restore()}
 crane(hook(),tower.ph==='swing'||st!=='run');
 if(tower.drop)floor(tower.drop.x,tower.drop.y,tower.drop.sp);
 parts.forEach(p=>{g.globalAlpha=Math.max(0,p.l);g.fillStyle=p.c;g.beginPath();g.arc(p.x,p.y,p.r,0,7);g.fill()});g.globalAlpha=1;
 // Rating stickers pop in (scale up, no shaking) and fade out while drifting up
 pops.forEach(p=>{const al=p.t<.7?1:Math.max(0,1-(p.t-.7)/.3),k=Math.min(1,.6+p.t*4);g.globalAlpha=al;
  if(A[p.s]){const a=A[p.s],w=(p.s==='Perfect'?136:112)*k,h=w*a[3]/a[2],x=cl(p.x-128,w/2+4,W-w/2-4);spr(p.s,x-w/2,p.y-h/2-p.t*30,w,h)}
  else num(p.s,cl(p.x+(p.side||0),60,W-60),p.y-p.t*40,p.c?22:26,p.c||'#fff');g.globalAlpha=1});
 g.restore();
 hud();
 if(st!=='run'){
  g.fillStyle='rgba(16,40,90,.35)';g.fillRect(0,0,W,VH);
  g.save();g.translate(0,OY);
  if(st==='ready'){const lw=320,lh=lw*160/620;if(ok(SPR))spr('logo',W/2-lw/2,108,lw,lh);else num('{{t:skybuilder.msg.007}}',W/2,108+lh/2,34,'#ffd23f');
   const b=block([['{{t:skybuilder.msg.016}}',16,'#123a7a'],['{{t:skybuilder.msg.017}}',15,'#2f6fd0']],108+lh+14);
   num('{{t:skybuilder.msg.008}}',W/2,b+34,20,'#ffe27a','center',W-60)}
  else{num(tower.msg==='collapse'?'{{t:skybuilder.msg.009}}':'{{t:skybuilder.msg.010}}',W/2,150,30,'#ff8a7a','center',W-40);
   const it=[[floors()+' 層',40,'#123a7a'],['分數 '+tower.sc,17,'#3a5a8a'],['BONUS 已入帳 '+fmt(paid)+' 點',17,paid>0?'#e08a00':'#3a5a8a']];if(rec)it.push(['{{t:skybuilder.msg.011}}',17,'#e5486e']);
   const b=block(it,180);num('{{t:skybuilder.msg.012}}',W/2,b+34,19,'#ffe27a','center',W-60)}
  g.restore()}
}
function start(){
 if(st==='run')return;
 const amount=ENTRY_FEE;
 if(amount>S.balance){say(LOW_MSG,'lose');return;}
 skyRank.start(ranked=>{
  const phase=tower.phs;tower=skybuilderRules.create();
  if(!ranked)tower.phs=phase;
  analytics=AN.start('skybuilder',amount);sbStake=amount;sbBusy=true;save();renderAll();
  pops=[];parts=[];paid=0;awarded.clear();rec=false;st='run';last=performance.now();
  say('{{t:skybuilder.msg.013}}');ui();c.focus();
 });
}
function act(){
 if(st!=='run'||$('view-skybuilder').hidden||document.hidden)return false;
 if(!skybuilderRules.input(tower))return false;
 skyRank.record(0);return true;
}
$('sb-go').addEventListener('click',start);
c.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;if(st==='run'){e.preventDefault();c.focus();act()}else say(st==='over'?'{{t:skybuilder.msg.014}}':'{{t:skybuilder.msg.015}}')});
c.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{if($('view-skybuilder').hidden||document.hidden||st!=='run'||e.metaKey||e.altKey||e.ctrlKey)return;if(['INPUT','BUTTON','A','SUMMARY'].includes(e.target.tagName))return;if(e.key===' '||e.key==='ArrowDown'){e.preventDefault();if(!e.repeat)act()}});
addEventListener('blur',()=>{last=performance.now()});
document.addEventListener('visibilitychange',()=>{last=performance.now()});
window.addEventListener('pagehide',e=>{if(!e.persisted&&st==='run'){AN.end(analytics,paid,'abandoned',{score:tower.sc,floors:floors(),total_bonus_points:paid});analytics=null;st='over';sbBusy=false;}},{capture:true});
window.addEventListener('hashchange',()=>{last=performance.now()});
function loop(ts){
 const ms=Math.min(50,Math.max(0,ts-last)||0);last=ts;
 if(!$('view-skybuilder').hidden&&!document.hidden){skyRank.update(ms,()=>st==='run',update);ui();draw()}
 requestAnimationFrame(loop);
}
ui();draw();requestAnimationFrame(loop);
  })();
