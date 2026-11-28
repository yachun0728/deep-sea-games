import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import T from '../shared/timed-replay.cjs';
const source=fs.readFileSync(new URL('../js/timed-leaderboard.js',import.meta.url),'utf8').replaceAll("await import('./frontend/services/api.mjs')",'API');
const elements=new Map();function $(id){if(!elements.has(id))elements.set(id,{hidden:false,addEventListener(t,f){this[t]=f;}});return elements.get(id);}
let sends=0,saved=0,proof;
const ctx=vm.createContext({$,timedReplay:T,location:{protocol:'https:'},AbortSignal,API:{async startBoardRound(){return {id:'round',token:'token',revision:0,state:{seed:42}};},async moveBoardRound(token,move){sends++;if(proof)assert.deepEqual(JSON.parse(JSON.stringify(move)),proof);else proof=JSON.parse(JSON.stringify(move));if(sends===1)throw new Error('network');return {state:{score:36}};}},});
vm.runInContext(source+';globalThis.board=timedLeaderboard("pudding","pd",4039,()=>{},()=>globalThis.saved(),{maxInputs:4000});',ctx);ctx.saved=()=>saved++;
await ctx.board.start(()=>{});ctx.board.record(123);ctx.board.update(20,()=>true,()=>{});ctx.board.finish(36);await new Promise(r=>setImmediate(r));assert.equal(sends,1);assert.equal($('pd-rank-retry').hidden,false);await $('pd-rank-retry').click();assert.equal(saved,1);assert.deepEqual(proof.action,[2,123]);assert.equal($('pd-rank-retry').hidden,true);
await ctx.board.start(()=>{});for(let i=0;i<4001;i++)ctx.board.record(i%4039);ctx.board.finish(36);await new Promise(r=>setImmediate(r));assert.equal(sends,2,'limit falls back without upload');console.log('PASS upload failure, immutable retry proof, saved callback and pudding input limit');
