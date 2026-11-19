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
  const nodeHandlers={};
  const node=id=>{if(!nodes.has(id))nodes.set(id,{id,textContent:'',hidden:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},offsetWidth:0,width:0,height:0,getContext:mkCtx,addEventListener(type,f){nodeHandlers[id+':'+type]=f;},setAttribute(){},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:300,height:600})});return nodes.get(id);};
  const docHandlers={},winHandlers={};let rafCb=null;
  const document={body:{classList:{toggle(){},add(){},remove(){}}},getElementById:node,querySelectorAll:()=>[],documentElement:{lang:'',style:{}},title:'',hidden:false,addEventListener:(t,f)=>{docHandlers[t]=f;}};
  const parentWin={deepSeaI18n:{getLanguage:()=> 'en'},addEventListener(){},
    deepSeaTetris:{rules,start:()=>{calls.push('start');return true;},finish:(w,d)=>calls.push(['finish',d]),pause:()=>calls.push('pause'),resume:()=>calls.push('resume'),touch:()=>{}}};
  const win={parent:parentWin,__TETRIS_TEST__:true,matchMedia:()=>({matches:true}),addEventListener:(t,f)=>{winHandlers[t]=f;}};
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

  // ---------- 手機手勢 ----------
  win.setTetrisPlatformActive(true);
  const st=()=>win.__tetris();
  const ptr=(type,x,y,id=1)=>{const f=nodeHandlers['board:'+type];if(f)f({type,pointerId:id,clientX:x,clientY:y,preventDefault(){}});else throw new Error('no handler '+type);};
  const freshRound=()=>{win.setTetrisPlatformActive(true);if(!['play'].includes('play'))return;};
  // a clean round: go through Enter if the previous one is over/paused
  if(node('overlay').hidden===false){key('Enter');}
  eq(st().ctl,'gesture','gestures are the default on touch devices');
  let s0=st();
  // drag right by ~2.4 cells (step is 0.85 cell = 25.5 px) -> exactly 2 columns
  t+=1000;ptr('pointerdown',100,300);t+=50;ptr('pointermove',130,302);ptr('pointermove',161,303);t+=50;ptr('pointerup',161,303);
  eq(st().x-s0.x,2,'dragging right moves the piece 2 columns');eq(st().rot,s0.rot,'a drag does not rotate');
  // drag left by ~1.2 cells -> 1 column
  s0=st();t+=1000;ptr('pointerdown',200,300);t+=60;ptr('pointermove',176,300);ptr('pointermove',170,300);t+=60;ptr('pointerup',170,300);
  eq(st().x-s0.x,-1,'dragging left moves the piece 1 column');
  // tap rotates (O never changes)
  s0=st();t+=1000;ptr('pointerdown',150,300);t+=80;ptr('pointerup',150,300);
  eq(st().rot,s0.type==='O'?s0.rot:(s0.rot+1)%4,'a tap rotates clockwise');
  // slow drag down: soft drop, +1 point per row, no hard drop
  s0=st();t+=1000;ptr('pointerdown',150,100);t+=200;ptr('pointermove',150,127);ptr('pointermove',150,153);ptr('pointermove',150,179);ptr('pointermove',150,179);frame(16);frame(100);frame(100);frame(100);const y1=st().y;ptr('pointerup',150,179);
  ok(st().score>s0.score,'holding the finger lower soft-drops and scores');ok(st().y>s0.y,'the piece moved down');eq(st().type,s0.type,'slow drag does not lock the piece');
  const yAfter=st().y;frame(16);frame(40);ok(st().y-yAfter<=1,'releasing the finger stops the fast fall');
  // flick up holds
  s0=st();t+=1000;ptr('pointerdown',150,400);t+=60;ptr('pointermove',150,350);ptr('pointermove',150,300);t+=60;ptr('pointerup',150,300);
  eq(st().hold,s0.type,'a quick upward flick holds the piece');
  // flick down hard-drops (score jumps by 2 per row dropped, a new piece spawns)
  const sc0=Number(String(node('score').textContent).replace(/,/g,''));
  t+=1000;ptr('pointerdown',150,100);t+=40;ptr('pointermove',150,160);ptr('pointermove',150,220);t+=40;ptr('pointerup',150,220);
  ok(Number(String(node('score').textContent).replace(/,/g,''))>sc0+10,'a quick downward flick hard-drops');
  // buttons mode turns the board gestures off
  nodeHandlers['modeBtn:click']();eq(st().ctl,'buttons','mode switch works');
  s0=st();t+=1000;ptr('pointerdown',100,300);ptr('pointermove',200,300);ptr('pointerup',200,300);
  eq(st().x,s0.x,'board gestures are ignored in button mode');
  eq(store['tetris-ctl'],'buttons','the choice is remembered');
  nodeHandlers['modeBtn:click']();eq(st().ctl,'gesture','switch back to gestures');
  // pause button
  const before=calls.filter(c=>c==='pause').length;nodeHandlers['pauseBtn:click']();ok(calls.filter(c=>c==='pause').length>before,'the pause button pauses and reports it');
}
console.log('PASS: '+checks+' tetris checks');
