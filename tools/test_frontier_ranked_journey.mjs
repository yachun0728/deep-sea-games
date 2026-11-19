import assert from 'node:assert/strict';
import fs from 'node:fs';
import rules from '../shared/frontier-rules.cjs';
const seed=Number(process.argv[3]??42);
const state=rules.create(seed);
let direction=-1;
const proof=[],chunks=[];
let tick=0;
function input(code){if(!rules.input(state,code))throw Error('input '+code);proof.push(tick*rules.INPUTS+code);}
function move(target){
 const p=state.world.p;
 if((p.x<552&&target.x>678)||(p.x>678&&target.x<552)||(p.x>=552&&p.x<=678)){
  target=Math.abs(p.y-450)>12?{x:p.x,y:450}:{x:target.x>615?710:525,y:450};
 }
 const dx=target.x-p.x,dy=target.y-p.y,d=Math.max(1,Math.hypot(dx,dy));
 const x=Math.round(dx/d*10),y=Math.round(dy/d*10);
 const code=((x+10)*21+y+10)*2;
 if(code!==direction){input(code);direction=code;}
}
for(let total=0;total<60000;total++){
 const w=state.world;
 if(w.phase==='dead'){assert.fail('Expedition lost before its first verified island');}
 if(w.phase==='clear'){input(886);chunks.push([tick,...proof]);break;}
 if(w.offer)input(882);
 const needed=w.buildings.filter(b=>!b.built&&['house','mill','quarry','warehouse','tower','bridge','barracks'].includes(b.kind));
 let goal=needed[0],wood=goal?.wood||10,stone=goal?.stone||10;
 if(!goal){goal=w.buildings.find(b=>b.kind==='barracks');}
 const lack=w.bag.wood+w.bank.wood<Math.min(wood,24+w.tech.pack*12)?'wood':w.bag.stone+w.bank.stone<Math.min(stone,24+w.tech.pack*12)?'stone':null;
 if(lack){
  const nodes=w.nodes.filter(n=>n.kind===lack&&n.x<530&&n.left>0);
  nodes.sort((a,b)=>Math.hypot(a.x-w.p.x,a.y-w.p.y)-Math.hypot(b.x-w.p.x,b.y-w.p.y));
  move(nodes[0]||w.nodes.find(n=>n.kind===lack));
 }else if(goal)move(goal);
 rules.advance(state);tick++;

 if(tick===200){chunks.push([tick,...proof]);proof.length=0;tick=0;}
}

assert.equal(state.completed,1);
const verified=rules.create(seed);
for(const chunk of chunks){assert.ok(rules.accepts(chunk));assert.ok(rules.apply(verified,chunk));}
assert.deepEqual(verified,state);
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(chunks));
console.log('PASS: first island cleared from default world through real gathering, building and army inputs; all 23 chunks replay identically');
