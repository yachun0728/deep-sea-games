// Runs the real play.html script against a stub DOM: many full rounds, every language, to catch runtime errors in drawing and flow.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import R from '../shared/pedestrian-hell-rules.cjs';
import T from '../shared/timed-replay.cjs';
const script=readFileSync(new URL('../games/pedestrian-hell/play.html',import.meta.url),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const noop=new Proxy(function(){},{get:(_,k)=>k===Symbol.toPrimitive?()=>0:noop,apply:()=>noop,construct:()=>noop});
const ctx2d=new Proxy({},{get:(_,k)=>k==='measureText'?()=>({width:80}):noop,set:()=>true});
const nodes={};const node=()=>{const n={clientWidth:390,clientHeight:844,dataset:{},handlers:{},classList:{toggle(){},add(){},remove(){}},style:{},children:[],textContent:'',getContext:()=>ctx2d,addEventListener(t,f){this.handlers[t]=f},setAttribute(){},appendChild(c){this.children.push(c)},blur(){},showModal(){this.open=true},close(){this.open=false}};return n;};
const $=id=>nodes[id]??=node();
let language='zh-Hant',frame=null,settled=[],keys={};
const bridge={rules:R,language:()=>language,translate:(_,t)=>t,prepare:(_,ready)=>{ready(T.seeded(7+settled.length));return true},advance:(_,ms,active,step)=>{if(active())step(ms/1000)},record(){},finish:(_,score)=>settled.push(score),pause(){},resume(){},touch(){},exit(){},leaders:async()=>({entries:[{nickname:'a',score:3}]})};
const win={addEventListener:(t,f)=>keys[t]=f,devicePixelRatio:2,matchMedia:()=>({matches:false})};
const sandbox={parent:{deepSeaPed:bridge,innerWidth:390},window:win,matchMedia:win.matchMedia,document:{getElementById:$,createElement:node,addEventListener(){},documentElement:{},hidden:false},localStorage:{getItem:()=>null,setItem(){}},Image:class{constructor(){this.naturalWidth=100;this.naturalHeight=120}set src(v){queueMicrotask(()=>this.onload())}},requestAnimationFrame:f=>{frame=f;return 1},performance:{now:()=>clock},setTimeout:f=>{f();return 1},Math,JSON,Object,Number,String,Array,Error,Date,console,queueMicrotask,AbortSignal};
let clock=0;vm.createContext(sandbox);vm.runInContext(script,sandbox);
await new Promise(r=>setImmediate(r));
assert.equal($('go').disabled,false,'assets loaded');
const press=code=>keys.keydown({code,repeat:false,preventDefault(){}});
const tick=()=>{clock+=16;frame(clock)};
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
console.log(`PASS Just Want Boba view: ${rounds} rounds, ${frames} frames, 3 languages, pause/resume, hide/show, leaderboard dialog; no runtime errors`);
