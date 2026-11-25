import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../games/top-doggo/play.html',import.meta.url),'utf8');
const timers=new Set(),nodes=[];let timerId=0;
const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
function node(){const n={gain:param(),frequency:param(),connect(){},disconnect(){this.disconnected=true},start(){},stop(){this.stopped=true}};nodes.push(n);return n;}
class Context{constructor(){this.sampleRate=1000;this.currentTime=0;this.state='suspended';this.destination={}}createGain(){return node()}createOscillator(){return node()}createBufferSource(){return node()}createBiquadFilter(){return node()}createBuffer(c,n){return {getChannelData:()=>new Float32Array(n)}}resume(){this.state='running';return Promise.resolve()}suspend(){this.state='suspended';return Promise.resolve()}}
const ctx={window:{AudioContext:Context},document:{hidden:false},Math,Set,setInterval(){const id=++timerId;timers.add(id);return id},clearInterval(id){timers.delete(id)}};
vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  const AudioSys ='),source.indexOf("  document.addEventListener('visibilitychange',()=>{if(document.hidden)AudioSys"))+';this.audio=AudioSys;',ctx);
const audio=ctx.audio;assert.equal(audio.ctx,null,'no autoplay/context before interaction');
audio.setScene('menu');assert.equal(timers.size,1);assert(audio.musicVoices.size>0,'menu generates original notes');const before=nodes.length;audio.play('shoot');assert.equal(nodes.length,before,'menu blocks combat SFX');
let hits=0;const oldPercussion=audio.percussion.bind(audio);audio.percussion=(...args)=>{hits++;oldPercussion(...args)};
const menuBus=audio.musicBus,menuVoices=[...audio.musicVoices];for(const voice of menuVoices)voice.stop=()=>{throw Error('already stopped')};audio.setScene('game');assert(menuBus.disconnected,'old menu output disconnected synchronously');assert(menuVoices.every(v=>v.disconnected),'all menu voices disconnected even when stop throws');assert.notEqual(audio.musicBus,menuBus);assert.equal(timers.size,1);assert(hits>0,'existing gameplay beat remains');assert.equal(audio.scene,'game');
audio.setScene('menu');assert.equal(timers.size,1,'switch replaces timer');for(let i=0;i<12;i++){audio.setScene('game');audio.setScene('menu')}assert.equal(timers.size,1,'switches never stack loops');
audio.muted=true;audio.sync();assert.equal(timers.size,0);assert.equal(audio.musicVoices.size,0);
audio.muted=false;audio.sync();assert.equal(timers.size,1);audio.musicEnabled=false;audio.sync();assert.equal(timers.size,0);
audio.musicEnabled=true;audio.setScene('menu');ctx.document.hidden=true;audio.setActive(false);assert.equal(timers.size,0);assert.equal(audio.ctx.state,'suspended');ctx.document.hidden=false;audio.setScene('menu');assert.equal(timers.size,1);audio.setActive(false);assert.equal(timers.size,0);
console.log('PASS: original menu music, gameplay track switch, mute/music-off, no duplicate loops, background/exit cleanup (mock Web Audio)');
