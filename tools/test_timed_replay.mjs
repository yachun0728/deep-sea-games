import elevator from '../shared/elevator-rules.cjs';
import fishing from '../shared/fishing-rules.cjs';
import assert from 'node:assert/strict';
import replay from '../shared/timed-replay.cjs';
import bird from '../shared/bird-rules.cjs';
import blockDrop from '../shared/block-drop-rules.js';
import cat from '../shared/cat-rules.cjs';
import skybuilder from '../shared/skybuilder-rules.cjs';
import reaper from '../shared/reaper-rules.cjs';
import sneak from '../shared/sneak-rules.cjs';

function simulate(engine, seed, inputs) {
  const random = replay.seeded(seed);
  const state = engine.create(random);
  const actions = [];
  for (let tick = 0; tick < 4000; tick++) {
    for (const action of inputs.get(tick) ?? []) {
      assert.ok(engine.input(state, action));
      actions.push(tick * engine.inputCount + action);
      if (state.dead) return {state, proof: [tick + 1, ...actions]};
    }
    engine.advance(state, replay.STEP_MS / 1000, random);
    if (state.dead) return {state, proof: [tick + 1, ...actions]};
  }
  throw new Error('Round did not finish');
}

for (const [engine, inputs] of [
  [elevator, new Map([[0, [0]], [43, [0]], [300, [0]]])],
  [fishing, new Map([[0, [0]], [120, [1]]])],
  [bird, new Map([[12, [2]], [45, [0]], [60, [1]]])],
  [blockDrop, new Map(Array.from({length:32}, (_, i) => [i * 25, [blockDrop.pressCode('hard')]]))],
  [cat, new Map([[12, [0]], [25, [1]]])],
  [skybuilder, new Map([[0, [0]], [94, [0]]])],
  [sneak, new Map([[0, [0]]])],
  [reaper, new Map([[225, [0]]])],
]) {
  const {state, proof} = simulate(engine, 42, inputs);
  assert.ok(replay.accepts(proof, engine.inputCount));
  assert.equal(replay.verify(engine, 42, proof), engine.score(state));
  assert.equal(replay.verify(engine, 42, [proof[0] - 1, ...proof.slice(1)]), null);
  assert.equal(replay.verify(engine, 42, [proof[0] + 1, ...proof.slice(1)]), null);
}
assert.equal(replay.accepts([2, 3, 0], 2), false);
assert.equal(replay.accepts([2, 4], 2), false);
assert.equal(replay.verify(skybuilder, 42, [100, 0, 0]), null);
assert.equal(replay.verify(sneak, 42, [100, 1]), null);
// Old and new Sneak proofs use distinct route lengths and encounter rules.
const oldSneak = {...sneak, create: random => sneak.create(random, 1)};
function sneakJourney(engine, lastStage, stopForVisitors, maxTicks = 250000) {
  const seed = 42, random = replay.seeded(seed), state = engine.create(random);
  const actions = [], visitorsPerStage = new Map();
  for (let tick = 0; tick < maxTicks; tick++) {
    const avoidVisitor = (stopForVisitors || state.lv < lastStage) &&
      (engine.visitorApproaching(state) || engine.visitorWatching(state));
    const patrol = engine.guard(state);
    const hold = (engine.inHallway(state)||state.ph==='away'||!!engine.bossWalk(state)) && !avoidVisitor && !patrol?.near;
    if (hold !== state.hold) {
      const input = hold ? 0 : 1;
      assert.ok(engine.input(state,input));
      actions.push(tick*engine.inputCount+input);
    }
    engine.advance(state,.01,random);
    if (state.visitor) visitorsPerStage.set(state.lv,state.visitorIndex);
    if (state.dead) return {state, proof:[tick+1,...actions], visitorsPerStage};
    if (stopForVisitors && state.lv > lastStage) return {state, visitorsPerStage};
  }
  assert.fail('Sneak journey never reached its terminal condition');
}
const newRoute=sneakJourney(sneak,4,false);
assert.equal(newRoute.state.caughtBy,'visitor');
assert.equal(newRoute.state.score,3);
assert.equal(newRoute.visitorsPerStage.get(2),1);
assert.equal(newRoute.visitorsPerStage.get(3),2);
assert.equal(replay.verify(sneak,42,newRoute.proof),3);
assert.equal(replay.verify(oldSneak,42,newRoute.proof),null);
const endless=sneakJourney(sneak,15,true);
assert.equal(endless.state.lv,16);
assert.equal(endless.visitorsPerStage.get(4),3);
assert.equal(endless.visitorsPerStage.get(12),3);
assert.equal(endless.visitorsPerStage.get(13),4);
assert.equal(sneak.travelTime({...endless.state,lv:13})-sneak.travelTime({...endless.state,lv:12}),1);
const hallway=sneak.create(()=>.5,sneak.rulesVersion,8);
const initialBossTime=hallway.pt;
sneak.input(hallway,0);
assert.equal(sneak.advance(hallway,2,()=>.5),undefined);
assert.equal(hallway.entry,128);
assert.equal(hallway.pr,0);
assert.equal(hallway.pt,initialBossTime);
assert.equal(sneak.guard(hallway),null);
assert.ok(sneak.routeProgress(hallway)>0);
sneak.advance(hallway,3,()=>.5);
assert.equal(sneak.inHallway(hallway),false);
assert.ok(hallway.pr>0 && hallway.pt<initialBossTime);
assert.equal(sneak.entryDistance({...hallway,lv:9})-sneak.entryDistance(hallway),18);
const tutorial=sneak.create(()=>.5);
assert.equal(sneak.entryDistance(tutorial),0);
assert.equal(sneak.fullTravelTime(tutorial),6);
assert.equal(sneak.bossWalk(tutorial),null);
const returning=sneak.create(()=>.5,sneak.rulesVersion,3);
returning.entry=sneak.entryDistance(returning);
assert.equal(returning.ph,'return');
sneak.advance(returning, .5, ()=>.5);
assert.ok(sneak.bossWalk(returning).progress>0);
sneak.advance(returning, 1.4, ()=>.5);
assert.equal(returning.ph,'warn');
assert.equal(returning.fk,false);
const leaving=sneak.create(()=>.5,sneak.rulesVersion,5);
Object.assign(leaving,{entry:sneak.entryDistance(leaving),ph:'look',pt:.01,bossLooks:1});
sneak.advance(leaving,.02,()=>.5);
assert.equal(sneak.bossWalk(leaving).leaving,true);
const coverStage=sneak.create(()=>.5,sneak.rulesVersion,5);
assert.ok(sneak.stageLayout(coverStage).cover.length);
assert.equal(sneak.guard(coverStage),null);
Object.assign(coverStage,{entry:sneak.entryDistance(coverStage),pr:35,hold:true,ph:'look',grace:0});
assert.equal(sneak.advance(coverStage,.01,()=>.5),undefined);
coverStage.pr=50;
assert.equal(sneak.advance(coverStage,.01,()=>.5),'caught');
assert.equal(coverStage.caughtBy,'boss');
const guardStage=sneak.create(()=>.5,sneak.rulesVersion,8);
guardStage.entry=sneak.entryDistance(guardStage);
guardStage.clock=2;
guardStage.pr=sneak.guard(guardStage).x+5;
assert.equal(sneak.guard(guardStage).watching,true);
assert.equal(sneak.advance(guardStage,.01,()=>.5),undefined);
sneak.input(guardStage,0);
assert.equal(sneak.advance(guardStage,.01,()=>.5),'caught');
assert.equal(guardStage.caughtBy,'guard');
const layouts=[12,13,14,15].map(lv=>sneak.stageLayout({...guardStage,lv}));
assert.equal(new Set(layouts).size,3);
assert.deepEqual(layouts[0],layouts[3]);
const oldRoute=sneakJourney(oldSneak,12,true);
assert.equal(oldRoute.visitorsPerStage.size,0);
assert.equal(oldSneak.travelTime(oldRoute.state),24);
const instantEnd = {
  inputCount: 1,
  create: () => ({dead:false}),
  input: state => {state.dead = true; return true;},
  advance: () => assert.fail('terminal input cannot advance simulation'),
  score: () => 10,
};
assert.equal(replay.verify(instantEnd, 42, [1,0]), 10);
assert.equal(replay.verify(instantEnd, 42, [1,0,0]), null);
console.log('PASS: eight shared timed rule engines, terminal ticks, input ordering and invalid transitions');
