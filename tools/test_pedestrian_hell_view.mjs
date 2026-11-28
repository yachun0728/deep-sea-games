// Runs the real play.html script against a stub DOM: many full rounds, every language, to catch runtime errors in drawing and flow.
import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import vm from 'node:vm';
import R from '../shared/pedestrian-hell-rules.cjs';
import T from '../shared/timed-replay.cjs';
const script=readFileSync(new URL('../games/pedestrian-hell/play.html',import.meta.url),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const noop=new Proxy(function(){},{get:(_,k)=>k===Symbol.toPrimitive?()=>0:noop,apply:()=>noop,construct:()=>noop});
// Real canvases throw on a negative radius and abort the rest of the frame, so the stub must too.
const radius=(...r)=>{for(const v of r)if(v<0)throw new RangeError('negative canvas radius: '+v);};
const guards={arc:(x,y,r)=>radius(r),ellipse:(x,y,a,b)=>radius(a,b),createRadialGradient:(x,y,a,u,v,b)=>{radius(a,b);return noop;},measureText:()=>({width:80})};
const ctx2d=new Proxy({},{get:(_,k)=>guards[k]??noop,set:()=>true});
const nodes={};const node=()=>{const n={clientWidth:390,clientHeight:844,dataset:{},handlers:{},classList:{toggle(){},add(){},remove(){}},style:{},children:[],textContent:'',getContext:()=>ctx2d,addEventListener(t,f){this.handlers[t]=f},setAttribute(){},appendChild(c){this.children.push(c)},blur(){},showModal(){this.open=true},close(){this.open=false}};return n;};
const $=id=>nodes[id]??=node();
let language='zh-Hant',frame=null,settled=[],keys={};
const bridge={rules:R,language:()=>language,translate:(_,t)=>t,prepare:(_,ready)=>{ready(T.seeded(7+settled.length));return true},advance:(_,ms,active,step)=>{if(active())step(ms/1000)},record(){},finish:(_,score)=>settled.push(score),pause(){},resume(){},touch(){},exit(){},leaders:async()=>({entries:[{nickname:'a',score:3}]})};
const win={addEventListener:(t,f)=>keys[t]=f,devicePixelRatio:2,matchMedia:()=>({matches:false})};
const requested=[];
const sandbox={parent:{deepSeaPed:bridge,innerWidth:390},window:win,matchMedia:win.matchMedia,document:{getElementById:$,createElement:node,addEventListener(){},documentElement:{},hidden:false},localStorage:{getItem:()=>null,setItem(){}},Image:class{constructor(){this.naturalWidth=100;this.naturalHeight=120}set src(v){requested.push(v);queueMicrotask(()=>this.onload?.())}},requestAnimationFrame:f=>{frame=f;return 1},performance:{now:()=>clock},setTimeout:f=>{f();return 1},Math,JSON,Object,Number,String,Array,Error,Date,console,queueMicrotask,AbortSignal};
const END='  frameId=requestAnimationFrame(loop);\n})();';
assert.ok(script.includes(END),'sweep hook anchor');
const swallowed=[];sandbox.console={log:console.log,error:e=>swallowed.push(String(e&&e.message||e))};
const hooked=script.replace(END,`  window.__sweep=function(){var n=0;
    for(var cup=1;cup<=10;cup++){S=R_.create(Math.random);rng=Math.random;S.cup=cup-1;S.cups=cup-1;
      if(cup===1){S.cup=1;S.cups=0;newStreet();}else{S.rest=.001;R_.advance(S,.002,rng);sync();newStreet();}
      for(var step=0;step<=GOAL*4;step++){var y=step/4,c=step%COLS;P.y=y;P.r=P.fr=Math.round(y);P.c=P.fc=c;P.x=c;P.k=1;S.cam=cam=y-2.6;S.side=step%7===0;viewX=camTarget();animate(.05);
        try{draw();}catch(e){throw new Error('cup '+cup+' row '+y+' col '+c+': '+e.message);}n++;}}
    return n;};\n`+END);
let clock=0;vm.createContext(sandbox);vm.runInContext(hooked,sandbox);
await new Promise(r=>setImmediate(r));
assert.equal($('go').disabled,false,'assets loaded');
const press=code=>keys.keydown({code,repeat:false,preventDefault(){}});
const tick=()=>{clock+=16;frame(clock)};
// finger controls: tap = one step, hold = keep walking, one swipe = one dodge (also while holding)
{
  const log=[],cv=$('cv').handlers,ev=(type,x,y=500)=>cv[type]({clientX:x,clientY:y,pointerId:1,preventDefault(){}});
  bridge.record=(_,code)=>log.push(code);
  const wait=ms=>{for(let t=0;t<ms;t+=16)tick();};
  const take=()=>log.splice(0).join('');
  const swipe=(from,dx,dy=0)=>{for(let i=1;i<=7;i++){tick();ev('pointermove',from+dx*i,500+dy*i);}};
  $('go').handlers.click();wait(200);take();
  ev('pointerdown',200);wait(60);ev('pointerup',200);wait(400);assert.equal(take(),'0','tap is one step');
  wait(500);assert.equal(take(),'','nothing moves without a finger');
  ev('pointerdown',200);swipe(200,-22);ev('pointerup',46);wait(400);assert.equal(take(),'2','one long swipe left is one dodge');
  ev('pointerdown',100);swipe(100,22);ev('pointerup',254);wait(400);assert.equal(take(),'3','one long swipe right is one dodge');
  ev('pointerdown',200);wait(700);const walked=take();assert.match(walked,/^0+$/,'holding walks forward: '+walked);
  swipe(200,-15);wait(60);assert.equal(take().replaceAll('0',''),'2','swipe while holding dodges once');
  wait(300);swipe(95,15);wait(60);assert.equal(take().replaceAll('0',''),'3','second swipe in the same hold');
  ev('pointerup',200);wait(300);take();wait(700);assert.equal(take(),'','releasing stops');
  /* the harness map is random, so make sure there is a step to undo: restart and take one tap forward first */
  win.setPedActive(false);win.setPedActive(true);$('go').handlers.click();wait(100);
  for(let n=0;n<3;n++){ev('pointerdown',200);wait(60);ev('pointerup',200);wait(400);if(take()==='0')break;}
  ev('pointerdown',200);swipe(200,0,15);wait(900);assert.equal(take(),'1','swipe down steps back once and does not walk on');
  ev('pointerup',200,605);wait(300);take();
  ev('pointerdown',200);wait(100);ev('pointercancel',200);wait(700);assert.equal(take(),'','cancelled touch does nothing');
  keys.keydown({code:'ArrowUp',repeat:false,preventDefault(){}});wait(300);keys.keydown({code:'ArrowUp',repeat:true,preventDefault(){}});wait(500);
  const typed=take();assert.match(typed,/^00+$/,'holding the forward key keeps walking: '+typed);
  keys.keyup({code:'ArrowUp'});wait(300);take();wait(500);assert.equal(take(),'','key release stops');
  // sidestep: the button records press and release, one finger can hold it while another walks, and Shift does the same
  const side=$('side').handlers;take();
  side.pointerdown({pointerId:9,preventDefault(){}});wait(60);assert.equal(take(),'4','button press starts sidestepping');
  ev('pointerdown',200);wait(900);assert.match(take(),/^0*$/,'walking while holding the button');
  ev('pointerup',200);wait(500);take();side.pointerup({pointerId:9});wait(60);assert.equal(take(),'5','release ends sidestepping');
  keys.keydown({code:'ShiftLeft',repeat:false,preventDefault(){}});wait(60);assert.equal(take(),'4','Shift starts');keys.keyup({code:'ShiftLeft'});wait(60);assert.equal(take(),'5','Shift ends');
  bridge.record=()=>{};
  console.log('PASS controls: tap, hold to walk, one dodge per swipe (also while holding), release, swipe back, key hold, sidestep button and Shift');
}
let rounds=0,frames=0;
for(const lang of ['zh-Hant','en','zh-Hans']){
  language=lang;win.setPedLanguage(lang);
  for(let i=0;i<8;i++){
    $('go').handlers.click();const before=settled.length;
    for(let k=0;k<6000&&settled.length===before;k++){
      if(k%14===0)press(['ArrowUp','ArrowUp','ArrowUp','ArrowRight','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'][(k/14+i)%8|0]);
      if(k===100){press('Space');tick();press('Space');if($('go').textContent)$('go').handlers.click();}
      if(k===101&&i===0){win.setPedActive(false);win.setPedActive(true);$('go').handlers.click();}
      tick();frames++;
    }
    for(let k=0;k<200;k++)tick();
    if(settled.length>before)rounds++;
  }
}
await $('leaders').handlers.click();
assert.ok(rounds>=12,'rounds reach an ending and settle once each: '+rounds);
assert.equal(settled.length,rounds,'no double settlement');
assert.deepEqual(requested.filter(v=>!existsSync(new URL('../games/pedestrian-hell/'+v,import.meta.url))),[],'every requested image exists');
/* art that exists but is never loaded is invisible in the game (drink animations are loaded on demand) */
{const asked=new Set(requested.map(v=>v.replace('art/','')));
 /* kept on disk only for pages still open on earlier releases */
 const legacy=new Set('a_tin box_green box_grey box_paint enclosure f_lamp f_vine hydrant mailbox noparksign shop telecom tree'.split(' ').map(n=>n+'.webp'));
 const unused=readdirSync(new URL('../games/pedestrian-hell/art/',import.meta.url)).filter(f=>f.endsWith('.webp')&&!f.startsWith('sip')&&!asked.has(f)&&!legacy.has(f));
 assert.deepEqual(unused,[],'every art file is loaded');}
const swept=win.__sweep();
assert.deepEqual(swallowed,[],'no drawing errors anywhere');
console.log(`PASS drawing sweep: ${swept} positions across 10 stages, no drawing errors`);
console.log(`PASS Just Want Boba view: ${rounds} rounds, ${frames} frames, 3 languages, pause/resume, hide/show, leaderboard dialog; no runtime errors`);
