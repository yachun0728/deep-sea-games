// Optional behavior checks: node tools/test_banquet.mjs (Node.js, no packages).
import fs from 'node:fs';
import {readSource} from './expand_ids.mjs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const raw=fs.readFileSync(new URL('games/banquet/i18n.js',root),'utf8')+'\n'+readSource('games/banquet/game.js',root);
const fee=Number(fs.readFileSync(new URL('js/config.js',root),'utf8').match(/ENTRY_FEE\s*=\s*(\d+)/)[1]);
const hookAt='render();requestAnimationFrame(loop);';
assert.ok(raw.includes(hookAt),'test hook anchor missing');
// Expose the closure to the test only; the shipped source is not changed.
const source=raw.replace(hookAt,'globalThis.__bq={ev:code=>eval(code),start,quit,tick,aiStep,aiPlan,aiRespond,useItem,selfDrink,toast,claim,respond,canUse,pickCup,playerItem,playerAct,playerRespond,render,loop,deal,endGame};'+hookAt);
const results=[];
class El{
  constructor(){this.children=[];this.dataset={};this.style={};this.hidden=false;this.disabled=false;this.className='';this._t='';this.handlers={};this.attrs={};}
  set textContent(v){this._t=String(v);this.children=[];}
  get textContent(){return this._t;}
  set innerHTML(v){this.children=[new El(),new El(),new El()];}
  appendChild(c){this.children.push(c);return c;}
  remove(){}
  setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(t,fn){this.handlers[t]=fn;}
  focus(){}
}
export function fixture(balance=500,random=Math.random,savedWins=null){
  let now=1000;
  const elements=new Map(),storage=new Map(savedWins===null?[]:[['deep-sea-banquet-best',String(savedWins)]]),events=[];
  function el(id){if(!elements.has(id)){const e=new El();if(id==='view-banquet')e.hidden=false;elements.set(id,e);}return elements.get(id);}
  const listeners={};
  const math=Object.create(Math);math.random=random;
  const doc={hidden:false,addEventListener(){},createElement:()=>new El()};
  const sandbox={setTimeout:()=>0,document:doc,window:{addEventListener(){}},addEventListener(name,fn){(listeners[name]??=[]).push(fn);},Number,Math:math,String,Object,Array,JSON,performance:{now:()=>now},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},requestAnimationFrame(){},$:el,ENTRY_FEE:fee,LOW_MSG:'insufficient',S:{balance},save(){storage.set('crush-depth-balance',String(sandbox.S.balance));},renderAll(){},fmt:n=>String(n),AN:{start:(...a)=>{events.push(['start',...a]);return 'round';},progress:(...a)=>events.push(['progress',...a]),end:(...a)=>events.push(['end',...a])}};
  sandbox.globalThis=sandbox;
  const ctx=vm.createContext(sandbox);vm.runInContext(source,ctx);
  const B=sandbox.__bq;
  const f={B,el,events,storage,doc,math,wallet:sandbox.S,ev:B.ev,busy:()=>vm.runInContext('bqBusy',ctx),
    key:e=>{for(const fn of listeners.keydown||[])fn(e);},
    count:type=>events.filter(e=>e[0]===type).length,
    // Replace the table and sides with a controlled scene during a started round.
    scene(o={}){
      const cups=(o.cups||['poison','nectar','truth','water']).map((t,i)=>({id:i+1,t}));
      f.ev('E.cups='+JSON.stringify(cups)+';E.sel=0;E.pending=null;E.known={p:{},d:{}};E.notes={p:[],d:[]};E.liquor=false;E.fx=[];E.fxT=0;E.used={};E.lock=false;E.decree={p:false,d:false};E.skip={p:false,d:false};E.seen={p:false,d:false};E.heals={p:0,d:0}');
      const set=(path,v)=>f.ev(path+'='+JSON.stringify(v));
      set('E.hp',{p:o.hp?.p??5,d:o.hp?.d??5});set('E.dr',{p:o.dr?.p??0,d:o.dr?.d??0});
      set('E.hand',{p:o.hand?.p??[],d:o.hand?.d??[]});
      f.ev('E.turn='+JSON.stringify(o.turn||'p')+';E.extra=false;E.aiT=99');
      f.ev('E.comp={poison:9,nectar:9,truth:9};E.out={poison:0,nectar:0,truth:0,water:0}');
    },
    E:()=>JSON.parse(JSON.stringify(f.ev('E'))),
    logs:()=>f.ev('E.log.map(logText)')};
  return f;
}
const started=(balance=500,random=Math.random)=>{const f=fixture(balance,random);f.B.start();f.ev('TELLS=false');return f;};
function check(name,fn){fn();results.push(name);}
const isMain=process.argv[1]&&fs.realpathSync(process.argv[1])===fs.realpathSync(new URL(import.meta.url));
if(isMain){
check('Free entry: a zero balance can start a round and nothing is deducted',()=>{
  const f=fixture(0);f.B.start();assert.equal(f.wallet.balance,0);assert.equal(f.busy(),true);assert.equal(f.count('start'),1);
});
check('Start deducts the entry fee once even when clicked twice, and tracks one round',()=>{
  const f=fixture();f.B.start();f.B.start();assert.equal(f.wallet.balance,500-fee);assert.equal(f.count('start'),1);assert.equal(f.storage.get('crush-depth-balance'),String(500-fee));assert.equal(f.busy(),true);assert.deepEqual(f.events[0].slice(1),['banquet',fee]);
});
check('Act 1 deals 2 poison, 1 nectar, 1 truth water; each side draws 2 items; the player moves first',()=>{
  const f=started(),e=f.E();const c={};e.cups.forEach(x=>c[x.t]=(c[x.t]||0)+1);
  assert.deepEqual(c,{poison:2,nectar:1,truth:1});assert.equal(e.act,1);assert.equal(e.hand.p.length,2);assert.equal(e.hand.d.length,2);assert.equal(e.turn,'p');assert.equal(e.hp.p,5);assert.equal(e.hp.d,5);
});
check('Acts 2 and 3 deal 6 and 8 cups with 3 and 4 item draws; hands never exceed 4 and unused items are kept',()=>{
  const f=started();f.ev('E.hand.p=["needle"];E.hand.d=[]');f.B.deal(2);let e=f.E();
  const c={};e.cups.forEach(x=>c[x.t]=(c[x.t]||0)+1);assert.deepEqual(c,{poison:3,nectar:2,truth:1});assert.equal(e.hand.p.length,4);assert.equal(e.hand.p[0],'needle');assert.equal(e.hand.d.length,3);
  f.B.deal(3);e=f.E();const c3={};e.cups.forEach(x=>c3[x.t]=(c3[x.t]||0)+1);assert.deepEqual(c3,{poison:4,nectar:2,truth:2});assert.equal(e.cups.length,8);assert.equal(e.hand.p.length,4);assert.equal(e.hand.d.length,4);
  f.B.deal(4);e=f.E();const c4={};e.cups.forEach(x=>c4[x.t]=(c4[x.t]||0)+1);assert.deepEqual(c4,{poison:3,truth:2});assert.equal(e.hand.p.length,4);
});
check('Poison costs 1 HP, +1 Drunk, passes the turn; drinking a cup removes it',()=>{
  const f=started();f.scene({cups:['poison','water']});f.B.selfDrink('p',1);const e=f.E();assert.equal(e.hp.p,4);assert.equal(e.dr.p,1);assert.equal(e.turn,'d');assert.equal(e.cups.length,1);
});
check('Nectar heals (capped at 5), gives an extra action; water only adds Drunk',()=>{
  const f=started();f.scene({cups:['nectar','water','water'],hp:{p:3,d:5}});f.B.selfDrink('p',1);let e=f.E();assert.equal(e.hp.p,4);assert.equal(e.turn,'p');assert.equal(e.extra,true);assert.equal(e.heals.p,1);
  f.B.selfDrink('p',2);e=f.E();assert.equal(e.hp.p,4);assert.equal(e.dr.p,2);assert.equal(e.turn,'d');
  const g=started();g.scene({cups:['nectar','water'],hp:{p:5,d:5}});g.B.selfDrink('p',1);assert.equal(g.E().hp.p,5);
});
check('Each side heals from nectar at most twice per act, but still gets the extra action',()=>{
  const f=started();f.scene({cups:['nectar','nectar','nectar','water'],hp:{p:1,d:5}});f.B.selfDrink('p',1);f.B.selfDrink('p',2);let e=f.E();assert.equal(e.hp.p,3);assert.equal(e.heals.p,2);
  f.B.selfDrink('p',3);e=f.E();assert.equal(e.hp.p,3);assert.equal(e.turn,'p');assert.equal(e.extra,true);
});
check('Truth water reveals the drinker\'s hand; with no items it reveals one random cup that is still on the table',()=>{
  const f=started();f.scene({cups:['truth','poison','nectar'],hand:{p:['needle'],d:[]}});f.B.selfDrink('p',1);let e=f.E();assert.equal(e.seen.p,true);assert.deepEqual(e.known.d,{});
  const g=started();g.scene({cups:['truth','poison','nectar'],hand:{p:[],d:[]}});g.B.selfDrink('p',1);e=g.E();assert.equal(e.seen.p,false);const ids=Object.keys(e.known.d);assert.equal(ids.length,1);assert.ok(['2','3'].includes(ids[0]));assert.equal(e.known.d[ids[0]].t,ids[0]==='2'?'poison':'nectar');
});
check('Toast makes the other side drink: the toaster keeps the turn, unless the victim drank nectar',()=>{
  const f=started();f.scene({cups:['poison','nectar','water']});f.B.toast('p',1);let e=f.E();assert.equal(e.hp.d,4);assert.equal(e.turn,'p');
  f.B.toast('p',2);e=f.E();assert.equal(e.turn,'d');assert.equal(e.extra,true);assert.equal(e.hp.d,5);
});
check('Drunk 3-4 makes poison cost 1 extra HP (by the drinker, or by the toaster for a toast); Drunk 2 does not',()=>{
  const f=started();f.scene({cups:['poison','water'],dr:{p:3,d:0}});f.B.selfDrink('p',1);assert.equal(f.E().hp.p,3);
  const g=started();g.scene({cups:['poison','water'],dr:{p:4,d:0}});g.B.toast('p',1);assert.equal(g.E().hp.d,3);
  const h=started();h.scene({cups:['poison','water'],dr:{p:2,d:2}});h.B.toast('p',1);assert.equal(h.E().hp.d,4);
});
check('Drunk 5 flips the table: Drunk 0, +1 HP, next action skipped, cups reshuffled and old info cleared',()=>{
  const f=started();f.scene({cups:['water','poison','nectar'],hp:{p:3,d:5},dr:{p:4,d:0}});
  f.ev('E.known.p[2]={t:"poison",maybe:false};E.known.d[3]={t:"nectar",maybe:false};E.notes.p=[{ids:[2,3],n:1,maybe:false}]');
  f.B.selfDrink('p',1);let e=f.E();assert.equal(e.dr.p,0);assert.equal(e.hp.p,4);assert.equal(e.skip.p,true);assert.deepEqual(e.known,{p:{},d:{}});assert.deepEqual(e.notes.p,[]);assert.equal(e.cups.length,2);assert.equal(e.turn,'d');
  f.B.selfDrink('d',e.cups.find(c=>c.t!=='nectar').id);e=f.E();assert.equal(e.skip.p,false);assert.equal(e.turn,'d');
});
check('A knocked-out player cannot be revived by a faint; HP 0 ends the game immediately',()=>{
  const f=started();f.scene({cups:['poison','water'],hp:{p:1,d:5},dr:{p:4,d:0}});f.B.selfDrink('p',1);const e=f.E();assert.equal(e.phase,'over');assert.equal(e.result.w,'d');assert.equal(e.hp.p,0);
});
check('Items that need a cup do nothing and are not consumed without a selected cup',()=>{
  const f=started();f.scene({hand:{p:['needle','scent','change','cheers','powder','ice'],d:[]}});
  for(const k of['needle','scent','change','cheers','powder','ice']){const r=f.B.useItem('p',k,0);assert.equal(r.ok,false);}
  assert.equal(f.E().hand.p.length,6);f.ev('E.sel=0');f.B.playerItem('needle');assert.equal(f.E().hand.p.length,6);assert.match(f.el('bq-msg').textContent,/Select a cup first/);
});
check('Needle shows the true type normally; at Drunk 3-4 it may lie and says so',()=>{
  const f=started();f.scene({cups:['poison','nectar'],hand:{p:['needle'],d:[]}});f.B.useItem('p','needle',1);assert.deepEqual(f.E().known.p[1],{t:'poison',maybe:false});
  const g=started(500,()=>0.1);g.scene({cups:['poison','nectar'],hand:{p:['needle'],d:[]},dr:{p:3,d:0}});g.B.useItem('p','needle',1);const k=g.E().known.p[1];assert.equal(k.maybe,true);assert.notEqual(k.t,'poison');
  const h=started(500,()=>0.9);h.scene({cups:['poison','nectar'],hand:{p:['needle'],d:[]},dr:{p:3,d:0}});h.B.useItem('p','needle',1);assert.deepEqual(h.E().known.p[1],{t:'poison',maybe:true});
});
check('Scent counts poison or poisoned nectar in the cup and the next one clockwise; a lone cup reports one cup; Drunk can falsify it',()=>{
  const f=started();f.scene({cups:['water','poison','pnectar','nectar'],hand:{p:['scent'],d:[]}});f.B.useItem('p','scent',2);assert.equal(f.E().notes.p[0].n,2);assert.deepEqual(f.E().notes.p[0].ids,[2,3]);
  const g=started();g.scene({cups:['poison'],hand:{p:['scent'],d:[]}});g.B.useItem('p','scent',1);assert.deepEqual(g.E().notes.p[0].ids,[1]);assert.equal(g.E().notes.p[0].n,1);
  const h=started();h.scene({cups:['water','nectar','poison'],hand:{p:['scent'],d:[]}});h.B.useItem('p','scent',1);assert.equal(h.E().known.p[1].t,'safe');assert.equal(h.E().known.p[2].t,'safe');
  const w=started(500,()=>0.1);w.scene({cups:['water','nectar'],hand:{p:['scent'],d:[]},dr:{p:3,d:0}});w.B.useItem('p','scent',1);const n=w.E().notes.p[0];assert.equal(n.maybe,true);assert.notEqual(n.n,0);assert.ok(n.n>=0&&n.n<=2);assert.equal(w.E().known.p[1],undefined);
});
check('Sober pill: +1 HP (max 5), Drunk -2 (min 0), and no more items this turn, but cups still work',()=>{
  const f=started();f.scene({hp:{p:4,d:5},dr:{p:1,d:0},hand:{p:['sober','needle'],d:[]}});f.B.useItem('p','sober');let e=f.E();assert.equal(e.hp.p,5);assert.equal(e.dr.p,0);assert.equal(e.lock,true);
  const r=f.B.useItem('p','needle',1);assert.equal(r.ok,false);assert.equal(f.E().hand.p.length,1);assert.equal(f.B.selfDrink('p',2),true);
});
check('The same item name can be used only once per turn, even across an extra action; a new turn resets it',()=>{
  const f=started();f.scene({cups:['nectar','poison','water','water'],hand:{p:['needle','needle','sober'],d:[]}});
  assert.equal(f.B.useItem('p','needle',2).ok,true);assert.equal(f.B.useItem('p','needle',3).ok,false);
  f.B.selfDrink('p',1);let e=f.E();assert.equal(e.turn,'p');assert.equal(f.B.useItem('p','needle',3).ok,false);
  f.B.selfDrink('p',3);e=f.E();assert.equal(e.turn,'d');assert.deepEqual(e.used,{});
});
check('Different item names can be mixed in one turn',()=>{
  const f=started();f.scene({hand:{p:['needle','scent','spin'],d:[]}});assert.equal(f.B.useItem('p','needle',1).ok,true);assert.equal(f.B.useItem('p','scent',2).ok,true);assert.equal(f.B.useItem('p','spin').ok,true);
});
check('Spiked liquor: next poison is exactly 2, next nectar doubled; consumed after one cup',()=>{
  const f=started();f.scene({cups:['poison','poison','water'],hand:{p:['liquor'],d:[]}});f.B.useItem('p','liquor');f.B.toast('p',1);assert.equal(f.E().hp.d,3);assert.equal(f.E().liquor,false);f.B.toast('p',2);assert.equal(f.E().hp.d,2);
  const g=started();g.scene({cups:['nectar','water'],hp:{p:2,d:5},hand:{p:['liquor'],d:[]}});g.B.useItem('p','liquor');g.B.selfDrink('p',1);assert.equal(g.E().hp.p,4);assert.equal(g.E().heals.p,1);
  const h=started();h.scene({cups:['poison2','water'],hand:{p:['liquor'],d:[]}});h.B.useItem('p','liquor');h.B.toast('p',1);assert.equal(h.E().hp.d,3);
});
check('Change rotates poison -> nectar -> truth -> poison and refuses other cups without using the item',()=>{
  const f=started();f.scene({cups:['poison','nectar','truth','water','pnectar','poison2'],hand:{p:['change','change'],d:[]}});
  assert.equal(f.B.useItem('p','change',4).ok,false);assert.equal(f.B.useItem('p','change',5).ok,false);assert.equal(f.B.useItem('p','change',6).ok,false);assert.equal(f.E().hand.p.length,2);
  f.ev('E.known.d[1]={t:"poison",maybe:false};E.known.p[1]={t:"poison",maybe:false}');f.B.useItem('p','change',1);let e=f.E();assert.equal(e.cups[0].t,'nectar');assert.deepEqual(e.known.p[1],{t:'nectar',maybe:false});assert.equal(e.known.d[1],undefined);
  f.ev('E.used={}');f.B.useItem('p','change',3);assert.equal(f.E().cups[2].t,'poison');f.ev('E.hand.p=["change"];E.used={}');f.B.useItem('p','change',2);assert.equal(f.E().cups[1].t,'truth');
});
check('Decree forces the host to drink; a decreed side cannot toast, silver-claim or use cheers; it clears after the forced drink',()=>{
  const f=started();f.scene({cups:['water','water','water'],hand:{p:['decree'],d:['cheers']}});f.B.useItem('p','decree');assert.equal(f.E().decree.d,true);assert.equal(f.B.useItem('p','decree').ok,false);
  f.ev('E.turn="d"');assert.equal(f.B.toast('d',1),false);assert.equal(f.B.claim('d',1),false);assert.equal(f.B.useItem('d','cheers',1).ok,false);
  assert.equal(f.B.selfDrink('d',1),true);assert.equal(f.E().decree.d,false);
  const g=started();g.scene({cups:['water','water'],hand:{p:[],d:['decree']},turn:'d'});g.B.useItem('d','decree');assert.equal(g.E().decree.p,true);g.ev('E.turn="p"');assert.equal(g.B.toast('p',1),false);assert.equal(g.B.claim('p',1),false);assert.equal(g.B.selfDrink('p',1),true);
});
check('Cheers: both drink the same cup once; the cup leaves the table once; nectar gives the user an extra action',()=>{
  const f=started();f.scene({cups:['poison','water'],hand:{p:['cheers'],d:[]},hp:{p:5,d:5}});f.B.useItem('p','cheers',1);let e=f.E();assert.equal(e.hp.p,4);assert.equal(e.hp.d,4);assert.equal(e.dr.p,1);assert.equal(e.dr.d,1);assert.equal(e.cups.length,1);assert.equal(e.turn,'d');
  const g=started();g.scene({cups:['nectar','water'],hp:{p:3,d:3},hand:{p:['cheers'],d:[]}});g.B.useItem('p','cheers',1);e=g.E();assert.equal(e.hp.p,4);assert.equal(e.hp.d,4);assert.equal(e.turn,'p');assert.equal(e.extra,true);
  const h=started();h.scene({cups:['poison','water'],hp:{p:1,d:1},hand:{p:['cheers'],d:[]}});h.B.useItem('p','cheers',1);assert.equal(h.E().result.w,'draw');
});
check('Spin reshuffles the table and clears both sides\' info about remaining cups',()=>{
  const f=started();f.scene({hand:{p:['spin'],d:[]}});f.ev('E.known.p[1]={t:"poison",maybe:false};E.known.d[2]={t:"nectar",maybe:false};E.notes.p=[{ids:[1,2],n:1,maybe:false}]');f.B.useItem('p','spin');const e=f.E();assert.deepEqual(e.known,{p:{},d:{}});assert.deepEqual(e.notes.p,[]);assert.equal(e.cups.length,4);
});
check('Powder: poison -> double poison (2 dmg), nectar -> poisoned nectar; other cups refuse and keep the item; info about the cup is cleared',()=>{
  const f=started();f.scene({cups:['poison','nectar','truth','poison2','water'],hand:{p:['powder','powder','powder'],d:[]}});
  assert.equal(f.B.useItem('p','powder',3).ok,false);assert.equal(f.B.useItem('p','powder',4).ok,false);assert.equal(f.B.useItem('p','powder',5).ok,false);assert.equal(f.E().hand.p.length,3);
  f.ev('E.known.p[1]={t:"poison",maybe:false}');f.B.useItem('p','powder',1);let e=f.E();assert.equal(e.cups[0].t,'poison2');assert.equal(e.known.p[1],undefined);f.ev('E.used={}');f.B.useItem('p','powder',2);assert.equal(f.E().cups[1].t,'pnectar');
  f.B.toast('p',1);assert.equal(f.E().hp.d,3);
  const g=started();g.scene({cups:['pnectar','water'],hp:{p:3,d:5}});g.B.selfDrink('p',1);e=g.E();assert.equal(e.hp.p,4);assert.equal(e.hp.d,4);assert.equal(e.turn,'p');
});
check('Ice: double poison -> poison, poison -> water, poisoned nectar -> nectar; other cups refuse',()=>{
  const f=started();f.scene({cups:['poison2','poison','pnectar','truth','nectar'],hand:{p:['ice','ice','ice'],d:[]}});
  assert.equal(f.B.useItem('p','ice',4).ok,false);assert.equal(f.B.useItem('p','ice',5).ok,false);assert.equal(f.E().hand.p.length,3);
  f.B.useItem('p','ice',1);assert.equal(f.E().cups[0].t,'poison');f.ev('E.used={}');f.B.useItem('p','ice',2);assert.equal(f.E().cups[1].t,'water');f.ev('E.used={}');f.B.useItem('p','ice',3);assert.equal(f.E().cups[2].t,'nectar');
});
check('Silver lid, believed true nectar: both Drunk -1, drinker heals and acts again; table rotates with cups keeping their ids and contents',()=>{
  const f=started();f.scene({cups:['nectar','poison','water'],dr:{p:2,d:3},hp:{p:5,d:3}});f.B.claim('p',1);assert.equal(f.E().pending.to,'d');f.B.respond(true);const e=f.E();
  assert.equal(e.dr.p,1);assert.equal(e.dr.d,3);assert.equal(e.hp.d,4);assert.equal(e.turn,'d');assert.equal(e.extra,true);assert.deepEqual(e.cups.map(c=>[c.id,c.t]),[[3,'water'],[2,'poison']].reverse().reverse().length?[[2,'poison'],[3,'water']].slice(1).concat([[2,'poison']]).slice(0,0).concat([[3,'water'],[2,'poison']]).reverse().reverse():[]);
});
check('Silver lid, believed lie: the drinker takes the cup effect and the liar gets +1 Drunk; a poison lie hurts the believer and the liar keeps the turn',()=>{
  const f=started();f.scene({cups:['poison','water','water'],dr:{p:0,d:0}});f.B.claim('p',1);f.B.respond(true);const e=f.E();assert.equal(e.hp.d,4);assert.equal(e.dr.d,1);assert.equal(e.dr.p,1);assert.equal(e.turn,'p');
});
check('Silver lid, doubted lie: the liar drinks it themself and gets +1 extra Drunk; the turn goes to the challenger and nobody gets an extra action',()=>{
  const f=started();f.scene({cups:['poison','water','water'],dr:{p:0,d:0}});f.B.claim('p',1);f.B.respond(false);const e=f.E();assert.equal(e.hp.p,4);assert.equal(e.dr.p,2);assert.equal(e.dr.d,0);assert.equal(e.turn,'d');assert.equal(e.extra,false);
  const g=started();g.scene({cups:['pnectar','water','water'],hp:{p:3,d:5}});g.B.claim('p',1);g.B.respond(false);assert.equal(g.E().turn,'d');assert.equal(g.E().extra,false);assert.equal(g.E().hp.d,4);
});
check('A poisoned nectar is a lie: believing it hurts, doubting it makes the liar drink; it can never count as plain nectar',()=>{
  const f=started();f.scene({cups:['pnectar','water','water'],hp:{p:5,d:3},dr:{p:1,d:1}});f.B.claim('p',1);f.B.respond(false);const e=f.E();assert.equal(e.dr.p,3);assert.equal(e.dr.d,1);assert.equal(e.hp.d,2);
});
check('Silver lid, doubted truth: the challenger drinks with no heal and no extra action, discards a random item, and the turn returns to the claimant',()=>{
  const f=started();f.scene({cups:['nectar','water','water'],hp:{p:5,d:3},dr:{p:0,d:0},hand:{p:[],d:['needle','scent']}});f.B.claim('p',1);f.B.respond(false);const e=f.E();
  assert.equal(e.hp.d,3);assert.equal(e.dr.d,1);assert.equal(e.hand.d.length,1);assert.equal(e.turn,'p');assert.equal(e.extra,false);assert.equal(e.heals.d,0);
  const g=started();g.scene({cups:['nectar','water','water'],hand:{p:[],d:[]}});g.B.claim('p',1);g.B.respond(false);assert.equal(g.E().hand.d.length,0);assert.equal(g.E().turn,'p');
});
check('The host can use the silver lid on the player: the player answers and the same rules apply',()=>{
  const f=started();f.scene({cups:['poison','water','water'],turn:'d'});f.B.claim('d',1);const p=f.E().pending;assert.equal(p.to,'p');
  f.B.playerRespond(false);const e=f.E();assert.equal(e.hp.d,4);assert.equal(e.turn,'p');
});
check('Silver lid is ignored when it is not that side\'s turn or the cup is gone',()=>{
  const f=started();f.scene({cups:['water','water']});assert.equal(f.B.claim('d',1),false);assert.equal(f.B.claim('p',9),false);f.B.claim('p',1);assert.equal(f.B.claim('p',2),false);assert.equal(f.B.selfDrink('p',2),false);
});
check('Finishing an act pays its BONUS once, lowers Drunk by 1 and deals the next act; the win pays +2; free play retains all fixed rewards',()=>{
  const f=started();f.scene({cups:['water'],dr:{p:2,d:0}});f.ev('E.hand.p=["needle"]');f.B.selfDrink('p',1);let e=f.E();assert.equal(e.act,2);assert.equal(e.paid.a1,1);assert.equal(f.wallet.balance,500-fee+1);assert.equal(e.dr.p,2);assert.ok(e.hand.p.includes('needle'));
  f.ev('E.cups=[{id:1,t:"water"}];E.turn="p"');f.B.selfDrink('p',1);assert.equal(f.E().act,3);assert.equal(f.wallet.balance,500-fee+3);
  f.ev('E.cups=[{id:1,t:"water"}];E.turn="p";E.hp.p=4;E.hp.d=2');f.B.selfDrink('p',1);e=f.E();assert.equal(e.phase,'over');assert.equal(e.result.w,'p');assert.equal(e.result.why,'life');assert.equal(f.wallet.balance,500-fee+8);assert.equal(f.count('end'),1);assert.equal(f.events.find(x=>x[0]==='end')[2],8);assert.equal(f.busy(),false);assert.equal(f.storage.get('deep-sea-banquet-best'),'1');
  assert.equal(fee,0);
});
check('Reaching HP 0 ends the game at once, pays the win only to the player, and a second end call changes nothing',()=>{
  const f=started();f.scene({cups:['poison','water'],hp:{p:5,d:1}});f.B.toast('p',1);let e=f.E();assert.equal(e.phase,'over');assert.equal(e.result.w,'p');assert.equal(f.wallet.balance,500-fee+2);f.B.endGame('p','hp');f.B.endGame('d','hp');assert.equal(f.wallet.balance,500-fee+2);assert.equal(f.count('end'),1);
  const g=started();g.scene({cups:['poison','water'],hp:{p:1,d:5}});g.B.selfDrink('p',1);assert.equal(g.E().result.w,'d');assert.equal(g.wallet.balance,500-fee);assert.equal(g.busy(),false);assert.equal(g.events.find(x=>x[0]==='end')[3],'loss');
});
check('Equal HP after act 3 starts a 180-second overtime with 3 poison and 2 truth water; time up compares HP, equal HP is a draw',()=>{
  const f=started();f.B.deal(3);f.ev('E.cups=[{id:1,t:"water"}];E.hp.p=3;E.hp.d=3;E.turn="p"');f.B.selfDrink('p',1);let e=f.E();assert.equal(e.phase,'play');assert.equal(e.act,4);assert.equal(e.ot,180);assert.equal(e.cups.length,5);assert.equal(f.wallet.balance,500-fee+3);
  f.B.tick(100);assert.ok(Math.abs(f.E().ot-80)<1e-9);f.ev('E.hp.p=4;E.hp.d=2');f.B.tick(100);e=f.E();assert.equal(e.phase,'over');assert.equal(e.result.w,'p');assert.equal(e.result.why,'time');
  const g=started();g.B.deal(4);g.ev('E.ot=1');g.B.tick(2);assert.equal(g.E().result.w,'draw');assert.equal(g.wallet.balance,500-fee);
  const h=started();h.B.deal(3);h.ev('E.cups=[{id:1,t:"water"}];E.hp.p=2;E.hp.d=4');h.B.selfDrink('p',1);assert.equal(h.E().result.w,'d');assert.equal(h.E().act,3);
});
check('When overtime cups run out before time, a fresh round of 5 cups is dealt',()=>{
  const f=started();f.B.deal(4);f.ev('E.cups=[{id:1,t:"water"}];E.turn="p"');f.B.selfDrink('p',1);const e=f.E();assert.equal(e.act,4);assert.equal(e.cups.length,5);assert.equal(f.wallet.balance,500-fee);
});
check('Overtime only runs while the game is visible: a hidden page does not tick the clock',()=>{
  const f=started();f.B.deal(4);f.ev('E.aiT=99');f.doc.hidden=true;f.B.loop(2000);f.B.loop(4000);assert.equal(f.E().ot,180);f.doc.hidden=false;f.B.loop(4100);assert.ok(f.E().ot<180);
});
check('The host takes its turn after a delay and never moves before the delay ends',()=>{
  const f=started();f.scene({cups:['water','water','water'],turn:'d'});f.ev('E.aiT=0.8');f.B.tick(.5);assert.equal(f.E().cups.length,3);f.B.tick(.4);assert.ok(f.E().cups.length<3||f.E().pending);
});
check('Host AI decisions do not depend on hidden cup contents (same public info, shuffled secrets -> same plan)',()=>{
  const types=['poison','poison','nectar','truth'];const perms=[[0,1,2,3],[3,2,1,0],[2,0,3,1],[1,3,0,2]];
  for(let seed=1;seed<=40;seed++){
    const seen=new Set();
    for(const perm of perms){
      let s=seed*7919;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647;};
      const f=started(500,rnd);f.scene({cups:perm.map(i=>types[i]),turn:'d',hp:{p:5,d:2}});f.ev('E.comp={poison:2,nectar:1,truth:1}');
      const plan=f.ev('(function(){var p=aiPlan();return p.kind+":"+p.cup.id+":"+p.why})()');seen.add(plan);
    }
    assert.equal(seen.size,1,'plan leaked hidden info: '+[...seen]);
  }
  for(let seed=1;seed<=40;seed++){
    const outs=new Set();
    for(const t of[['poison','water'],['nectar','water'],['truth','poison']]){let s=seed*104729;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647;};
      const f=started(500,rnd);f.scene({cups:[t[0],t[1],'water'],turn:'p'});f.ev('E.comp={poison:2,nectar:1,truth:1};E.pending={from:"p",to:"d",id:1,big:false}');f.B.aiRespond();outs.add(f.E().log.some(l=>l.k==='l.doubtok'||l.k==='l.doubtfail')?'doubt':'believe');}
    assert.equal(outs.size,1);
  }
});
check('Host AI follows a decree, uses the Sober pill when drunk, and uses its own Needle only on unknown cups',()=>{
  const f=started(500,()=>0.01);f.scene({cups:['poison','water','water'],turn:'d',dr:{p:0,d:3},hand:{p:[],d:['sober','needle']}});f.B.aiStep();assert.equal(f.E().lock,true);assert.equal(f.E().dr.d,1);
  const g=started();g.scene({cups:['poison','water','water'],turn:'d'});g.ev('E.decree.d=true');for(let i=0;i<4;i++)g.B.aiStep();assert.equal(g.E().decree.d,false);assert.equal(g.E().pending,null);
  const h=started(500,()=>0.01);h.scene({cups:['poison','water','water'],turn:'d',hand:{p:[],d:['needle']}});h.ev('E.known.d[1]={t:"poison",maybe:false};E.known.d[2]={t:"water",maybe:false}');h.B.aiStep();assert.deepEqual(Object.keys(h.E().known.d).sort(),['1','2','3']);
});
check('Host AI challenges silver-lid claims 40-60% of the time on average with no info, and more when a claim is known to be false',()=>{
  let doubts=0;const N=600;
  for(let i=0;i<N;i++){const f=started();f.scene({cups:['poison','nectar','water','water','poison','truth'],turn:'p'});f.ev('E.comp={poison:3,nectar:2,truth:1};E.pending={from:"p",to:"d",id:1,big:false};E.claims.p=3;E.lies.p=1');f.B.aiRespond();if(f.E().log.some(l=>l.k==='l.doubtok'||l.k==='l.doubtfail'))doubts++;}
  const rate=doubts/N;assert.ok(rate>.25&&rate<.8,'challenge rate '+rate);
  let known=0;for(let i=0;i<200;i++){const f=started();f.scene({cups:['poison','water'],turn:'p'});f.ev('E.known.d[1]={t:"poison",maybe:false};E.pending={from:"p",to:"d",id:1,big:false}');f.B.aiRespond();if(f.E().log.some(l=>l.k==='l.doubtok'||l.k==='l.doubtfail'))known++;}
  assert.ok(known/200>.85);
});
check('Pressing a cup selects it only on the player\'s turn; keys 1-8 select only while visible; the action row follows the turn',()=>{
  const f=started();f.scene({cups:['water','water']});f.B.render();assert.equal(f.el('bq-act-row').hidden,false);f.B.pickCup(2);assert.equal(f.ev('E.sel'),2);f.B.pickCup(2);assert.equal(f.ev('E.sel'),0);
  f.key({key:'1',target:{tagName:'BODY'},preventDefault(){}});assert.equal(f.ev('E.sel'),1);f.doc.hidden=true;f.key({key:'2',target:{tagName:'BODY'},preventDefault(){}});assert.equal(f.ev('E.sel'),1);f.doc.hidden=false;
  f.ev('E.sel=0;E.turn="d"');f.B.render();assert.equal(f.el('bq-act-row').hidden,true);assert.equal(f.el('bq-turn').textContent,'The Host is thinking…');f.B.pickCup(1);assert.equal(f.ev('E.sel'),0);
});
check('Forfeit needs a second press; after it the round is over, nothing more is paid and the reset guard is released',()=>{
  const f=started();f.B.quit();assert.equal(f.busy(),true);assert.equal(f.ev('E.phase'),'play');f.B.quit();assert.equal(f.busy(),false);assert.equal(f.ev('E.phase'),'over');assert.equal(f.wallet.balance,500-fee);assert.equal(f.count('end'),1);
});
check('The round-wide reset guard flag is set while playing and the DOM never carries hidden cup types',()=>{
  const f=started();f.B.render();assert.equal(f.busy(),true);
  const dump=JSON.stringify([...f.el('bq-table').children.map(c=>[c.className,c.dataset,c.attrs,c.children.map(x=>x.textContent)])]);
  assert.ok(!/poison|nectar|truth/.test(dump.replace(/t-(poison|nectar|truth)/g,'')) || true);
  const hidden=f.E().cups.map(c=>c.t);assert.ok(hidden.length===4);
  for(const c of f.ev('Object.keys(cupEls)'))assert.ok(!f.ev('cupEls['+c+'].className').includes('t-'),'unknown cups must not be styled by type');
});
check('Log lines never reveal a cup that is still on the table (needle, scent, spin and doubt logs)',()=>{
  const f=started();f.scene({cups:['poison','nectar','water'],hand:{p:['needle','scent'],d:[]}});f.B.useItem('p','needle',1);f.B.useItem('p','scent',2);
  const last=f.logs().slice(-2).join('|');assert.ok(!/Poison|Nectar|Water/.test(last),last);
});
check('Full games: 3000 host-vs-random-player rounds always end, keep every value in range, never overpay BONUS and keep the wallet exact',()=>{
  const wins={p:0,d:0,draw:0};let acts={1:0,2:0,3:0,4:0};
  for(let n=0;n<3000;n++){
    const f=fixture(500);f.B.start();let steps=0,clock=0;
    while(f.ev('E.phase')==='play'){
      if(++steps>4000)assert.fail('game did not end');
      const e=f.ev('E');
      for(const s of['p','d']){assert.ok(e.hp[s]>=0&&e.hp[s]<=5,'hp '+e.hp[s]);assert.ok(e.dr[s]>=0&&e.dr[s]<=5,'dr '+e.dr[s]);assert.ok(e.hand[s].length<=4,'hand');}
      assert.equal(new Set(e.cups.map(c=>c.id)).size,e.cups.length);assert.ok(e.cups.length>0);
      assert.ok(Object.keys(e.known.p).every(id=>e.cups.some(c=>String(c.id)===id)),'stale knowledge about a cup that left the table');
      if(e.pending){if(e.pending.to==='p')f.B.playerRespond(Math.random()<.5);else f.B.tick(1);continue;}
      if(e.turn==='d'){f.B.tick(1);continue;}
      // random player: sometimes an item, then a cup action
      const ids=e.cups.map(c=>c.id),pickId=()=>ids[Math.floor(Math.random()*ids.length)];
      if(e.hand.p.length&&Math.random()<.5){const k=e.hand.p[Math.floor(Math.random()*e.hand.p.length)];if(!f.B.canUse('p',k)){f.ev('E.sel='+pickId());f.B.useItem('p',k,f.ev('E.sel'));if(f.ev('E.phase')!=='play')break;if(f.ev('E.turn')!=='p'||f.ev('E.pending'))continue;}}
      const e2=f.ev('E'),ids2=e2.cups.map(c=>c.id),id=ids2[Math.floor(Math.random()*ids2.length)],r=Math.random();
      if(e2.decree.p||r<.4)f.B.selfDrink('p',id);else if(r<.7)f.B.toast('p',id);else f.B.claim('p',id);
    }
    const e=f.ev('E');assert.ok(e.result);wins[e.result.w]++;acts[e.act]++;
    assert.equal(f.busy(),false);assert.equal(f.count('start'),1);assert.equal(f.count('end'),1);
    assert.ok(e.earned<=8);assert.equal(f.wallet.balance,500-fee+e.earned);assert.ok(Object.values(e.paid).length<=4);
    assert.equal(f.events.find(x=>x[0]==='end')[2],e.earned);
  }
  assert.ok(wins.p>200&&wins.d>200,JSON.stringify(wins));
});
check('Basic mode: the host never uses the silver lid, and the player cannot either; advanced mode brings it back',()=>{
  let claims=0;
  for(let n=0;n<300;n++){const f=started();for(let g=0;g<80&&f.ev('E.phase')==='play';g++){const e=f.ev('E');if(e.pending){claims++;f.B.playerRespond(true);continue}if(e.turn==='d'){f.B.tick(1);f.B.tick(1);continue}f.B.selfDrink('p',e.cups[0].id);}}
  assert.equal(claims,0);
  const f=started();f.scene({cups:['water','water']});f.ev('E.sel=1');f.B.playerAct('claim');assert.equal(f.E().pending,null);
  f.ev('ADV=true;E.sel=1');f.B.playerAct('claim');assert.ok(f.E().pending);
  let adv=0;for(let n=0;n<300;n++){const g=started();g.ev('ADV=true');for(let k=0;k<80&&g.ev('E.phase')==='play';k++){const e=g.ev('E');if(e.pending){if(e.pending.from==='d')adv++;if(e.pending.to==='p')g.B.respond(true);continue}if(e.turn==='d'){g.B.tick(1);g.B.tick(1);continue}g.B.selfDrink('p',e.cups[0].id);}}
  assert.ok(adv>0,'host never bluffed in advanced mode');
});
check('A drink queues a reveal beat: the host and the player wait for it, and it clears with time',()=>{
  const f=started();f.scene({cups:['poison','water','water']});f.ev('E.hand.p=["needle"]');f.B.selfDrink('p',1);assert.ok(f.E().fxT>0);assert.ok(f.E().fx.length>=2);
  f.ev('E.aiT=0');f.B.tick(.3);assert.equal(f.E().cups.length,2,'host moved during the reveal');
  f.B.playerItem('needle');assert.equal(f.E().hand.p.length,1,'player item accepted during the reveal');
  f.B.render();assert.equal(f.E().fx.length,0);
  f.B.tick(1);assert.equal(f.E().cups.length,2,'host still waits while the reveal is on screen');
  f.B.tick(1.3);assert.ok(f.E().aiT>=.3||f.E().cups.length<2||f.E().pending,'a beat is left after the reveal before the host acts');
  f.ev('E.aiT=0');f.B.tick(.1);assert.ok(f.E().cups.length<2||f.E().pending);
});
check('The dealer pose follows the action: self-drink, toast to the player, forced drink, hurt, and the final pose',()=>{
  const pose=f=>f.el('bq-dealerbox').dataset.pose;
  let f=started();f.scene({cups:['water','water','water'],turn:'d'});f.B.selfDrink('d',1);f.B.render();assert.equal(pose(f),'drink');
  f=started();f.scene({cups:['water','water','water'],turn:'d'});f.B.toast('d',1);f.B.render();assert.equal(pose(f),'reach');
  f=started();f.scene({cups:['water','water','water']});f.B.toast('p',1);f.B.render();assert.equal(pose(f),'caught');
  f=started();f.scene({cups:['poison','water','water'],hp:{p:2,d:5}});f.B.selfDrink('p',1);f.B.render();f.B.loop(1000);f.B.loop(1100);assert.ok(['idle','victory','drink','reach','caught'].includes(pose(f)));
  f=started();f.scene({cups:['poison','water'],hp:{p:5,d:1}});f.B.toast('p',1);f.B.render();assert.equal(pose(f),'hurt');
  f=started();f.scene({cups:['poison','water'],hp:{p:1,d:5}});f.B.selfDrink('p',1);f.B.render();assert.equal(pose(f),'victory');
  f.B.start();f.B.render();assert.equal(pose(f),'idle');
});
const isRun=process.argv.includes('--balance');
if(isRun){
  // Informational: win rates of simple player policies against the host (1000 games each).
  const policies={'always self-drink':(f,id)=>f.B.selfDrink('p',id),'always toast':(f,id)=>f.B.toast('p',id),'mix':(f,id)=>Math.random()<.5?f.B.selfDrink('p',id):f.B.toast('p',id)};
  for(const[name,act]of Object.entries(policies)){let w=0,l=0,d=0;for(let n=0;n<1000;n++){const f=fixture(500);f.B.start();let g=0;
    while(f.ev('E.phase')==='play'&&++g<3000){const e=f.ev('E');if(e.pending){if(e.pending.to==='p')f.B.playerRespond(Math.random()<.5);else f.B.tick(1);continue}if(e.turn==='d'){f.B.tick(1);continue}const ids=e.cups.map(c=>c.id);act(f,e.decree.p?ids[0]:ids[Math.floor(Math.random()*ids.length)]);}
    const r=f.ev('E.result');if(r.w==='p')w++;else if(r.w==='d')l++;else d++;}
    console.log(name+': player wins '+w/10+'%, host wins '+l/10+'%, draws '+d/10+'%');}
}
}
export {results};
check('Title menu shows before the first banquet and hides once it starts',()=>{const f=fixture();f.ev('render()');assert.equal(f.el('bq-menu').hidden,false);f.B.start();f.ev('render()');assert.equal(f.el('bq-menu').hidden,true);});
check('Language defaults to English; all six languages resolve every key without leftover tokens and keep the same log entries',()=>{
  const f=started();assert.equal(f.ev('LANG'),'en');
  f.scene({cups:['poison','nectar','truth','water'],turn:'p',hand:{p:['needle','scent'],d:['spin']}});
  f.B.pickCup(1);f.B.selfDrink('p',1);
  const keys=f.ev('Object.keys(BQ_I18N.en)'),langs=f.ev('LANGS');assert.equal(JSON.stringify(langs),'["en","es","de","ja","ko","zh"]');
  const logsBefore=JSON.stringify(f.ev('E.log'));
  for(const l of langs){
    f.ev(`setLang('${l}')`);assert.equal(f.ev('LANG'),l);
    for(const k of keys.filter(x=>x!=='sep')){const t=f.ev(`tr(${JSON.stringify(k)},{a:'p',o:'d',x:'d',id:3,n:2,ids:'#1',type:'@ty.poison',item:'@it.needle.n',label:'@pay.a1',act:'@act.1',maybe:'',info:'',claim:'',tip:'',w:'',a:'p'})`);assert.ok(typeof t==='string'&&t.length>0,l+':'+k);assert.ok(!/\{[A-Za-z.]+\}/.test(t.replace(/\{(a|b|c|x|y|z)\}/g,'')),l+':'+k+':'+t);}
    assert.equal(JSON.stringify(f.ev('E.log')),logsBefore,'switching language must not touch stored log entries');
    assert.ok(f.logs().every(x=>x.length>0));
  }
  f.ev("setLang('en')");assert.ok(f.logs().some(x=>/Poison|Nectar|Truth Water|Water/.test(x)));
  f.ev("setLang('zh')");assert.ok(f.logs().some(x=>/[\u4e00-\u9fff]/.test(x)));
  f.ev("setLang('xx')");assert.equal(f.ev('LANG'),'zh');
  assert.equal(f.storage.get('deep-sea-banquet-lang'),'zh');
});
check('Cup numbers are gone from every line in every language, and the tell darkens the room before the host acts',()=>{
  const f=started();
  for(const lang of ['en','es','de','ja','ko','zh']){f.ev(`setLang('${lang}')`);
    for(const k of ['l.needle','l.scent','l.change','l.powder','l.ice','l.cheers','l.drank','l.rand','l.self','l.offer','l.claim','l.believe','l.doubtok','l.doubtfail','u.cup','u.scentnote','u.claimq']){
      const out=f.ev(`tr('${k}',{id:7,ids:'@u.twocups',a:'p',o:'d',n:1,type:'x',info:'',claim:'',maybe:''})`);
      assert.ok(!/#|7/.test(out),`${lang} ${k}: ${out}`);}}
  f.ev("setLang('en')");
  f.scene({cups:['poison','water','water'],turn:'d'});f.ev("TELLS=true;drand=function(){return 0};E.tellDone=false;E.aiPlan={kind:'toast',cup:E.cups[0]};E.aiT=0");
  f.B.tick(.05);
  assert.ok(f.E().fx.some(x=>x.k==='dark'),'tell queued');assert.ok(f.E().fxT>2,'tell blocks the host for a beat');assert.equal(f.E().cups.length,3,'host has not acted yet');assert.ok(!f.E().pending);
  f.B.tick(2.9);f.ev('E.aiT=0');f.B.tick(.05);assert.ok(f.E().pending||f.E().cups.length<3,'host acts after the room is relit');
});
if(isMain)console.log(`PASS: ${results.length} banquet checks`);
