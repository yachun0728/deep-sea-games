import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code=fs.readFileSync(new URL('../games/cat-match/audio.js',import.meta.url),'utf8')+';const sound=createCatMatchSound($,()=>paused,()=>ended,k=>k);';
function fixture({stored=null,unsupported=false}={}){
 const listeners={},windows={},timers=new Map(),store=new Map(stored?[['deep-sea-cat-match-audio-v1',JSON.stringify(stored)]]:[]),buttons=new Map();let made=0,notes=0,oscillators=[];
 const param=()=>({value:0,setValueAtTime(v){this.value=v},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 class AudioContext{constructor(){made++;this.currentTime=0;this.state='suspended';this.destination={};this.gains=[];this.resumes=0;this.suspends=0}createGain(){let g={gain:param(),connect(){},disconnect(){}};this.gains.push(g);return g}createOscillator(){notes++;let o={frequency:param(),connect(){},disconnect(){},start(){},stop(){}};oscillators.push(o);return o}resume(){this.resumes++;this.state='running';return Promise.resolve()}suspend(){this.suspends++;this.state='suspended';return Promise.resolve()}}
 let context;
 class Capture extends AudioContext{constructor(){super();context=this}}
 const sandbox={console,Set,Math,JSON,localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},document:{hidden:false,addEventListener:(name,fn)=>listeners[name]=fn},window:{addEventListener:(name,fn)=>windows[name]=fn,...unsupported?{}:{AudioContext:Capture}},setInterval:fn=>{const id=Symbol();timers.set(id,fn);return id},clearInterval:id=>timers.delete(id),$:id=>buttons.get(id)||buttons.set(id,{setAttribute(k,v){this[k]=v}}).get(id),paused:false,ended:false};
 vm.createContext(sandbox);vm.runInContext(code,sandbox);
 return {sandbox,run:c=>vm.runInContext(c,sandbox),buttons,listeners,windows,timers,store,get made(){return made},get notes(){return notes},get context(){return context},oscillators};
}
const f=fixture();assert.equal(f.made,0,'No audio before gesture');f.listeners.pointerdown();await Promise.resolve();assert.equal(f.made,1);assert.equal(f.timers.size,1);assert.ok(f.notes>0);
for(let n=0;n<4;n++)f.listeners.pointerdown();await Promise.resolve();assert.equal(f.made,1);assert.equal(f.timers.size,1,'Single context and scheduler');
f.run('paused=true;sound.sync()');assert.equal(f.timers.size,0);assert.equal(f.context.gains[0].gain.value,0);
f.run('paused=false;sound.sync()');assert.equal(f.timers.size,1);
f.buttons.get('musicToggle').onclick();assert.equal(f.timers.size,0);assert.equal(f.context.gains[0].gain.value,0);let count=f.notes;f.run("sound.play('clear')");assert.ok(f.notes>count,'Effects remain on with music off');
f.buttons.get('soundToggle').onclick();count=f.notes;f.run("sound.play('clear')");assert.equal(f.notes,count);assert.equal(f.context.gains[1].gain.value,0);
assert.deepEqual(JSON.parse(f.store.get('deep-sea-cat-match-audio-v1')),{music:false,effects:false});
f.buttons.get('musicToggle').onclick();assert.equal(f.timers.size,1);
f.sandbox.document.hidden=true;f.listeners.visibilitychange();await Promise.resolve();assert.equal(f.context.state,'suspended');assert.equal(f.context.gains[0].gain.value,0);assert.equal(f.context.gains[1].gain.value,0);assert.equal(f.timers.size,0);
f.sandbox.document.hidden=false;f.listeners.pointerdown();await Promise.resolve();assert.equal(f.context.state,'running');assert.equal(f.timers.size,1);
f.windows.pagehide();assert.equal(f.timers.size,0);assert.equal(f.context.state,'suspended');
for(const o of f.oscillators)o.onended?.();
const muted=fixture({stored:{music:false,effects:false}});muted.listeners.pointerdown();assert.equal(muted.timers.size,0);assert.equal(muted.notes,0);
const unsupported=fixture({unsupported:true});unsupported.listeners.pointerdown();assert.equal(unsupported.buttons.get('musicToggle').disabled,true);
console.log('PASS: gesture unlock, single scheduler, independent controls, preferences, pause/resume, hidden/pagehide mute, node cleanup, unsupported fallback.');
