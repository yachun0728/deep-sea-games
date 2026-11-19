// 俄羅斯方塊行為測試：父頁橋接（免費、單次開始／結算、暫停、離頁）與子頁遊戲流程。無需 npm 套件。
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
import rules from '../shared/block-drop-rules.js';
const root=new URL('../',import.meta.url);let checks=0;const ok=(c,m)=>{assert.ok(c,m);checks++;};const eq=(a,b,m)=>{assert.equal(a,b,m);checks++;};

// ---------- 父頁橋接 ----------
{
  const els=new Map(),events=[],handlers={};
  const el=id=>{if(!els.has(id))els.set(id,{textContent:'',hidden:false,disabled:false,className:'',contentWindow:{},focus(){},addEventListener(t,f){handlers[id+':'+t]=f;}});return els.get(id);};
  const win={deepSeaI18n:{text:s=>s,getLanguage:()=> 'zh-Hant'},listeners:{},addEventListener(t,f){(this.listeners[t]=this.listeners[t]||[]).push(f);}};
  const S={balance:0};
  const ctx={$:el,window:win,localStorage:{getItem:k=>k==='tetris-best'?'1200':null},S,ENTRY_FEE:0,LOW_MSG:'low',fmt:n=>String(n),save(){},renderAll(){},
    AN:{interact(){},start:(...a)=>{events.push(['start',...a]);return 'r1';},end:(...a)=>events.push(['end',...a]),progress:(...a)=>events.push(['progress',...a]),resume:(...a)=>events.push(['resume',...a])}};
  vm.createContext(ctx);vm.runInContext(['shared/timed-replay.cjs','js/timed-leaderboard.js','shared/block-drop-rules.js','games/tetris/game.js'].map(file=>fs.readFileSync(new URL(file,root),'utf8')).join('\n'),ctx);
  const api=win.deepSeaTetris,frame=el('tt-frame').contentWindow;
  ok(api,'bridge available');
  eq(el('tt-best').textContent,'1200','best score read from the original localStorage key');
  ok(!api.start({}),'foreign window rejected');
  ok(api.start(frame),'start accepted');
  eq(S.balance,0,'free: no points charged');
  api.start(frame);eq(events.filter(e=>e[0]==='start').length,1,'duplicate start cannot open a second round');
  ok(el('tt-go').disabled,'start button disabled during a round');
  api.pause(frame);ok(events.some(e=>e[0]==='progress'&&e[2].phase==='pause'&&e[3]===true),'pause tracked');
  api.resume(frame);ok(events.some(e=>e[0]==='resume'),'resume tracked');
  api.finish(frame,{score:4300,lines:12,level:2});
  const ends=events.filter(e=>e[0]==='end');eq(ends.length,1,'one settlement');eq(ends[0][2],0,'payout is 0: score never converts to points');eq(ends[0][3],'complete');eq(ends[0][4].score,4300);eq(S.balance,0,'balance unchanged after the round');
  api.finish(frame,{score:9,lines:0,level:1});eq(events.filter(e=>e[0]==='end').length,1,'second finish is ignored');
  eq(el('tt-score').textContent,'4300');eq(String(el('tt-lines').textContent),'12');eq(el('tt-best').textContent,'4300','best shows the higher of saved and current');
  ok(!el('tt-go').disabled,'button re-enabled after the round');
  // page leave while playing -> abandoned, once
  api.start(frame);win.listeners.pagehide[0]({persisted:false});
  const e2=events.filter(e=>e[0]==='end');eq(e2.length,2);eq(e2[1][3],'abandoned');
  api.finish(frame,{score:1,lines:0,level:1});eq(events.filter(e=>e[0]==='end').length,2,'no double settlement after leaving');
}

// ---------- 子頁遊戲 ----------
{
  const calls=[],store={};
  const mkCtx=()=>new Proxy({},{get:(t,k)=>k in t?t[k]:(()=>{}),set:(t,k,v)=>{t[k]=v;return true;}});
  const nodes=new Map();
  const node=id=>{if(!nodes.has(id))nodes.set(id,{id,textContent:'',hidden:false,style:{},dataset:{},classList:{add(){},remove(){}},offsetWidth:0,width:0,height:0,getContext:mkCtx,addEventListener(){},setAttribute(){}});return nodes.get(id);};
  const docHandlers={},winHandlers={};let rafCb=null;
  const document={getElementById:node,querySelectorAll:()=>[],documentElement:{lang:'',style:{}},title:'',hidden:false,addEventListener:(t,f)=>{docHandlers[t]=f;}};
  const parentWin={deepSeaI18n:{getLanguage:()=> 'en'},addEventListener(){},
    deepSeaTetris:{rules,start:()=>{calls.push('start');return true;},finish:(w,d)=>calls.push(['finish',d]),pause:()=>calls.push('pause'),resume:()=>calls.push('resume'),touch:()=>{}}};
  const win={parent:parentWin,addEventListener:(t,f)=>{winHandlers[t]=f;}};
  const sandbox={window:win,document,getComputedStyle:()=>({getPropertyValue:()=> ''}),localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},
    performance:{now:()=>t},requestAnimationFrame:f=>{rafCb=f;return 1;},Math,Array,Object,String,Number,parseInt,Date,console};
  let t=0;
  const html=fs.readFileSync(new URL('games/tetris/original.html',root),'utf8');
  const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
  vm.createContext(sandbox);sandbox.window.window=win;
  vm.runInContext(script,sandbox);
  ok(win.startTetrisPlatformRound&&win.setTetrisPlatformActive,'platform entry points exist');
  eq(document.documentElement.lang,'en','English follows the parent language');
  eq(node('ovTitle').textContent,'Ready?','overlay translated');
  const key=code=>docHandlers.keydown({code,preventDefault(){},repeat:false});
  const frame=ms=>{t+=ms;const f=rafCb;f(t);};
  ok(win.startTetrisPlatformRound(),'round starts through the parent button');eq(calls.filter(c=>c==='start').length,1,'host.start called once');
  frame(16);
  // pause / resume are reported
  key('KeyP');ok(calls.includes('pause'),'pause reported');eq(node('ovTitle').textContent,'Paused');
  key('KeyP');ok(calls.includes('resume'),'resume reported');
  // hard-drop until the stack tops out
  let n=0;while(!calls.some(c=>Array.isArray(c))&&n<400){key('Space');frame(16);frame(300);n++;}
  const fin=calls.filter(c=>Array.isArray(c));eq(fin.length,1,'host.finish called exactly once');
  ok(fin[0][1].score>0,'hard drops scored');ok(fin[0][1].level>=1);
  eq(node('ovTitle').textContent,'Game over');
  ok(Number(store['tetris-best'])>0,'best score saved under the original key');
  key('Space');eq(calls.filter(c=>Array.isArray(c)).length,1,'input after game over does not report again');
  // restarting through Enter asks the parent again
  key('Enter');eq(calls.filter(c=>c==='start').length,2,'second round asks the host once more');
  // hidden platform view pauses the round
  win.setTetrisPlatformActive(false);ok(calls.filter(c=>c==='pause').length>=2,'leaving the view pauses');
}
console.log('PASS: '+checks+' tetris checks');
