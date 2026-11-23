(()=>{
'use strict';
const R=catMatchRules,$=id=>document.getElementById(id),cv=$('board');let ctx=cv.getContext('2d');const main=ctx;
const sheet=new Image();sheet.src='assets/icon-sheet.webp';
const crops=[[10,4,250,220],[266,4,225,220],[493,4,241,220],[985,20,180,194],[1160,30,190,182],[1340,12,194,212]];
let G=null,visual=[],level=1,best=1,lang='zh-Hant',size=0,cell=0,busy=true,paused=false,ended=false,selected=-1,down=null,hintCells=[],clearing=new Set(),clearProgress=0,offsets=new Map(),epoch=0,actions=[],ticket=null,lastSay=null,dialog=null,rankState='local',rankScore=0,roundShown=null,visible=true,prefetch=null;
const KEY='deep-sea-cat-match-progress-v1';
try{let s=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('proto-cat-match-save-v1'));if(s&&Number.isSafeInteger(s.level)&&s.level>0&&s.level<=1000000){level=s.level;best=Math.max(level,Number.isSafeInteger(s.best)?s.best:level)}}catch{}
const host=()=>parent!==window?parent.deepSeaCatMatch:null;
function T(key,args={}){let dict=CAT_MATCH_TEXT[lang]||CAT_MATCH_TEXT['zh-Hant'],value=dict[key]??CAT_MATCH_TEXT.en[key]??key;let result=typeof value==='string'?value.replace(/\{(\w+)\}/g,(_,k)=>args[k]??''):value;return lang==='zh-Hans'?(Array.isArray(result)?result.map(v=>host()?.translate(window,v)||v):host()?.translate(window,result)||result):result}
const sound=createCatMatchSound($,()=>paused||!visible,()=>ended,T);
function say(key,args={}){lastSay={key,args};$('message').textContent=T(key,args)}
function setLanguage(value){lang=CAT_MATCH_TEXT[value]||value==='zh-Hans'?value:'zh-Hant';document.documentElement.lang=value;document.querySelectorAll('[data-t]').forEach(el=>el.textContent=T(el.dataset.t));document.querySelectorAll('[data-aria]').forEach(el=>el.setAttribute('aria-label',T(el.dataset.aria)));$('lang').textContent=lang==='en'?'ZH':'EN';if(G)hud();if(lastSay)say(lastSay.key,lastSay.args);if(dialog)paintDialog();sound.sync()}
function hud(){if(!G)return;$('level').textContent=level;$('moves').textContent=G.moves;$('remaining').textContent=Math.max(0,G.goal-G.collected);$('goalLabel').textContent=T('collect',{tile:T('tiles')[G.target]});$('score').textContent=T('points',{score:G.score,best});$('progress').value=Math.min(1,G.collected/G.goal);$('shape').textContent=T('shapes')[(level-1)%3];for(const [id,count] of [['hint',G.hints],['shuffle',G.shuffles]]){$(id+'Count').textContent=T('remaining',{n:count});$(id).disabled=busy||count===0||ended}let c=crops[G.target];$('targetIcon').style.backgroundSize=`${1536*44/c[2]}px ${1024*44/c[3]}px`;$('targetIcon').style.backgroundPosition=`-${c[0]*44/c[2]}px -${c[1]*44/c[3]}px`}
function resize(){let r=$('stage').getBoundingClientRect();size=Math.max(8,Math.min(r.width,r.height-12,464));cell=size/8;const dpr=Math.min(devicePixelRatio||1,2);cv.style.width=size+'px';cv.style.height=size+'px';cv.width=Math.round(size*dpr);cv.height=Math.round(size*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw()}
function round(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
// 效能：貓咪圖案與特殊徽章先畫進小的離屏畫布快取，動畫每一幀只做 drawImage，不再每幀裁切大圖與計算漸層／陰影。
let cache=null,cacheKey='';
function offscreen(px,paint){const c=document.createElement('canvas');c.width=c.height=px;const prev=ctx;ctx=c.getContext('2d');ctx.setTransform(px/cell,0,0,px/cell,0,0);paint();ctx=prev;return c}
function ensureCache(){const px=Math.max(1,Math.round(cell*Math.min(devicePixelRatio||1,2))),ready=sheet.complete&&sheet.naturalWidth>0,key=px+':'+ready;if(cacheKey===key)return;cacheKey=key;const pad=cell*.055;
 cache={tiles:[0,1,2,3,4,5,6].map(n=>offscreen(px,()=>{round(pad,pad,cell-pad*2,cell-pad*2,cell*.21);ctx.clip();if(ready&&n<6){const c=crops[n];ctx.drawImage(sheet,...c,pad,pad,cell-pad*2,cell-pad*2)}else{ctx.fillStyle=n===6?'#e18cba':'#f4c890';ctx.fillRect(0,0,cell,cell)}})),
  specials:Object.fromEntries(['rainbow','bomb','row','col'].map(k=>[k,offscreen(px,()=>drawSpecial({s:k},0,0,1))]))}}
function draw(){ensureCache();ctx.clearRect(0,0,size,size);const pad=cell*.055;for(let i=0;i<64;i++){if(!R.active(level,i))continue;let x=i%8*cell,y=(i>>3)*cell,t=visual[i];ctx.fillStyle='#d4b293';round(x+1,y+2,cell-2,cell-2,cell*.23);ctx.fill();if(!t)continue;let offset=offsets.get(t);if(offset){x+=offset.x*cell;y+=offset.y*cell}const fading=clearing.has(i),alpha=fading?1-clearProgress:1;ctx.globalAlpha=alpha;if(fading){const k=(cell-2*(pad+cell*clearProgress*.42))/(cell-2*pad),d=cell*k;ctx.drawImage(cache.tiles[t.t],x+(cell-d)/2,y+(cell-d)/2,d,d)}else ctx.drawImage(cache.tiles[t.t],x,y,cell,cell);if(t.s)ctx.drawImage(cache.specials[t.s],x,y,cell,cell);ctx.globalAlpha=1;if(selected===i||down?.i===i||hintCells.includes(i)){ctx.strokeStyle=selected===i?'#fff5af':'#aaffde';ctx.lineWidth=3;round(x+2,y+2,cell-4,cell-4,cell*.22);ctx.stroke()}}}
// 金邊、實心方向徽章：避免白線穿過圖案，被誤認為顯示錯誤。
function drawSpecial(t,x,y,alpha){
 ctx.save();ctx.translate(x,y);ctx.scale(cell/48,cell/48);ctx.globalAlpha=alpha;
 ctx.shadowColor='#ffdb73';ctx.shadowBlur=5;ctx.strokeStyle='#ffe8a0';ctx.lineWidth=2;
 round(2.5,2.5,43,43,10);ctx.stroke();ctx.shadowBlur=0;
 if(t.s==='rainbow'){
  let g=ctx.createLinearGradient(10,9,38,40);['#ff739a','#ffd566','#88dc99','#73cef4','#b58aef'].forEach((c,k)=>g.addColorStop(k/4,c));
  ctx.fillStyle=g;ctx.strokeStyle='#7e425f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(24,24,16,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.strokeStyle='#fff6df';ctx.lineWidth=1.4;for(let n=0;n<3;n++){ctx.beginPath();ctx.ellipse(24,24,6+n*4,15,.7,0,Math.PI*2);ctx.stroke()}
  ctx.fillStyle='#ffffffc9';ctx.beginPath();ctx.ellipse(18,14,5,2.5,-.6,0,Math.PI*2);ctx.fill();
 }else if(t.s==='bomb'){
  ctx.fillStyle='#f59242';ctx.strokeStyle='#853f31';ctx.lineWidth=1.4;ctx.beginPath();
  for(let n=0;n<16;n++){let a=n*Math.PI/8-Math.PI/2,r=n%2?7:10;let px=36+Math.cos(a)*r,py=35+Math.sin(a)*r;n?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#fff0b5';ctx.beginPath();ctx.arc(36,36,3.3,0,Math.PI*2);ctx.fill();for(let [px,py] of [[32.5,32],[36,30.5],[39.5,32]]){ctx.beginPath();ctx.arc(px,py,1.5,0,Math.PI*2);ctx.fill()}
 }else{
  const vertical=t.s==='col';ctx.fillStyle='#9c57ac';ctx.strokeStyle='#633658';ctx.lineWidth=1.2;
  if(vertical)round(34,6,11,36,5.5);else round(6,34,36,11,5.5);ctx.fill();ctx.stroke();
  // 兩端金色箭頭直接表達消除方向，中間保留小星光。
  ctx.fillStyle='#ffe79a';ctx.strokeStyle='#ffe79a';ctx.lineWidth=2;
  for(let sign of [-1,1]){let cx=vertical?39.5:24+sign*11,cy=vertical?24+sign*11:39.5;ctx.beginPath();if(vertical){ctx.moveTo(cx-3,cy-sign*1);ctx.lineTo(cx,cy+sign*3);ctx.lineTo(cx+3,cy-sign*1)}else{ctx.moveTo(cx-sign*1,cy-3);ctx.lineTo(cx+sign*3,cy);ctx.lineTo(cx-sign*1,cy+3)}ctx.stroke()}
  ctx.beginPath();ctx.arc(vertical?39.5:24,vertical?24:39.5,1.5,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
function animate(ms,frame){if(reduceMotion.matches||document.hidden||!visible){frame(1);draw();return Promise.resolve()}return new Promise(resolve=>{const t=performance.now();function step(now){const p=Math.min(1,(now-t)/ms);frame(p);draw();if(p<1&&!document.hidden&&visible)requestAnimationFrame(step);else{frame(1);draw();resolve()}}requestAnimationFrame(step)})}
async function slide(entries,ms){await animate(ms,p=>{let left=(1-p)**3;offsets=new Map(entries.map(([i,dx,dy])=>[visual[i],{x:dx*left,y:dy*left}]))});offsets.clear();draw()}
function rankUI(){ $('rankStatus').textContent=T(rankState,{score:rankScore});$('rankRetry').hidden=rankState!=='failed'}
function paintDialog(){if(!dialog)return;$('dialogTitle').textContent=T(dialog.title);$('dialogText').textContent=T(dialog.text,{...dialog.args,...(dialog.args.tileIndex!==undefined?{tile:T('tiles')[dialog.args.tileIndex]}:{})});$('primary').textContent=T(dialog.actionLabel);$('secondary').hidden=!dialog.cancel;rankUI()}
function show(title,text,actionLabel,action,args={},cancel=false){paused=true;dialog={title,text,actionLabel,action,args,cancel};$('rankList').hidden=true;paintDialog();$('overlay').hidden=false;sound.sync();host()?.pause(window)}
function resume(){paused=false;dialog=null;$('overlay').hidden=true;sound.sync();if(!ended)host()?.resume(window)}
async function start(){const request=++epoch;busy=true;ended=false;paused=false;dialog=null;G=null;visual=[];selected=-1;hintCells=[];clearing.clear();offsets.clear();actions=[];$('overlay').hidden=true;say('loading');resize();
 let pre=null;if(prefetch){const waiting=prefetch;prefetch=null;try{pre=await waiting}catch{}if(pre&&pre.level!==level)pre=null}
 let reply;try{reply=await host()?.prepare(window,level,pre)}catch{}
 if(request!==epoch)return;ticket=reply?.id||null;G=R.create(reply?.seed??crypto.getRandomValues(new Uint32Array(1))[0],level);visual=R.copy(G.board);busy=false;rankState=reply?.ranked?'rankReady':'local';rankScore=0;roundShown=request;hud();draw();say('ready');sound.sync();if(!visible)show('pause','rules','resume',resume)
}
async function submit(){const generation=roundShown;if(!ticket){rankState='local';rankUI();return}rankState='submitting';rankUI();let ok=false;try{ok=await host().finish(window,ticket,actions,G.score,G.won)}catch{}if(generation!==roundShown)return;rankState=ok?'submitted':'failed';rankScore=G.score;rankUI()}
async function swap(a,b){if(busy||paused||ended||!G?.board[a]||!G.board[b]||!R.adjacent(a,b))return;busy=true;down=null;hintCells=[];selected=-1;host()?.touch(window);sound.play('swap');let frames=[];const legal=R.act(G,a*64+b,frames),original=R.copy(visual);[visual[a],visual[b]]=[visual[b],visual[a]];await slide([[a,b%8-a%8,(b>>3)-(a>>3)],[b,a%8-b%8,(a>>3)-(b>>3)]],125);
 if(!legal){visual=original;await slide([[a,b%8-a%8,(b>>3)-(a>>3)],[b,a%8-b%8,(a>>3)-(b>>3)]],125);say('invalid');sound.play('invalid');busy=false;hud();return}
 actions.push(a*64+b);hud();for(const f of frames){if(f.shuffle){visual=R.copy(f.after);say('auto');draw();continue}visual=R.copy(f.before);clearing=new Set(f.removed);clearProgress=0;sound.play(f.special?'special':'clear',f.chain);say(f.chain>1?'chain':'clear',{n:f.chain});await animate(115,p=>clearProgress=p);clearing.clear();clearProgress=0;visual=R.copy(f.after);await slide(f.falling.map(({i,from})=>[i,0,from-(i>>3)]),190)}
 visual=R.copy(G.board);busy=false;ended=G.over;hud();draw();if(ended){prefetch=host()?.fetchTicket?.(window,G.won?level+1:level)||null;rankScore=G.score;host()?.trackEnd(window,ticket,G.score,G.won);if(G.won){best=Math.max(best,level+1);try{localStorage.setItem(KEY,JSON.stringify({level:Math.min(1000000,level+1),best}))}catch{}sound.play('win');show('win','winText','next',()=>{level=Math.min(1000000,level+1);start()},{n:G.collected,tileIndex:G.target,score:G.score})}else{sound.play('lose');show('lose','loseText','freeRetry',start,{n:Math.max(0,G.goal-G.collected),tileIndex:G.target})}submit()}
}
function pick(i){if(busy||paused||ended||!G?.board[i])return;if(i===selected)selected=-1;else if(selected>=0&&R.adjacent(selected,i)){swap(selected,i);return}else selected=i;hintCells=[];draw()}
function index(e){const r=cv.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)/cell),y=Math.floor((e.clientY-r.top)/cell);return x>=0&&x<8&&y>=0&&y<8?y*8+x:-1}
cv.onpointerdown=e=>{if(busy||paused||ended||down)return;const i=index(e);if(G?.board[i]){host()?.touch(window);down={i,x:e.clientX,y:e.clientY,id:e.pointerId};cv.setPointerCapture(e.pointerId);draw()}};
function swipe(e){if(!down||down.id!==e.pointerId)return false;const d=down,dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.max(Math.abs(dx),Math.abs(dy))<cell*.22)return false;down=null;const b=d.i+(Math.abs(dx)>Math.abs(dy)?dx>0?1:-1:dy>0?8:-8);if(G?.board[b]&&R.adjacent(d.i,b))swap(d.i,b);else draw();return true}
cv.onpointermove=swipe;cv.onpointerup=e=>{if(swipe(e)||!down||down.id!==e.pointerId)return;const i=down.i;down=null;pick(i)};cv.onpointercancel=cv.onlostpointercapture=()=>{down=null;draw()};
$('hint').onclick=()=>{if(busy||paused||ended||!G?.hints)return;hintCells=R.legal(G)[0]||[];if(!hintCells.length)return;R.act(G,R.HINT);actions.push(R.HINT);host()?.touch(window);sound.play('hint');say('hinted');hud();draw()};
$('shuffle').onclick=()=>{if(busy||paused||ended||!G?.shuffles)return;R.act(G,R.SHUFFLE);actions.push(R.SHUFFLE);visual=R.copy(G.board);selected=-1;hintCells=[];host()?.touch(window);sound.play('shuffle');say('shuffled');hud();draw()};
$('retry').onclick=()=>{if(!busy&&!paused&&!ended)show('restart','restartText','restartAction',start,{},true)};
$('pause').onclick=()=>{if(!busy&&!ended)show('pause','rules','resume',resume)};
$('primary').onclick=()=>{const action=dialog?.action;resume();action?.()};$('secondary').onclick=resume;$('rankRetry').onclick=submit;
$('rankOpen').onclick=async()=>{const generation=epoch;$('rankList').hidden=false;$('rankList').replaceChildren();$('rankStatus').textContent=T('rankLoading');try{const result=await host()?.leaders(window);if(generation!==epoch)return;if(!result)throw Error('offline');for(const item of result.entries){const li=document.createElement('li');li.textContent=(item.displayName||T('guest'))+' · '+item.score;$('rankList').append(li)}$('rankStatus').textContent=result.entries.length?'':T('rankEmpty')}catch{$('rankStatus').textContent=T('rankError')}};
$('exit').onclick=e=>{if(host()){e.preventDefault();host().exit(window)}};$('lang').onclick=()=>{if(host())host().language(window);else setLanguage(lang==='en'?'zh-Hant':'en')};
window.setCatMatchLanguage=setLanguage;window.setCatMatchActive=value=>{visible=!!value;if(!value){down=null;if(!paused&&!busy&&!ended)show('pause','rules','resume',resume);else paused=true;sound.sync();host()?.pause(window)}else{if(paused&&!ended&&!dialog)show('pause','rules','resume',resume);sound.sync()}};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!paused&&!busy&&!ended)show('pause','rules','resume',resume)});window.addEventListener('resize',resize);sheet.onload=draw;setLanguage(host()?.getLanguage(window)||'zh-Hant');start();
})();
