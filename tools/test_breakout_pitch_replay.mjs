import assert from 'node:assert/strict';
import breakout from '../shared/breakout-rules.cjs';
import pitch from '../shared/on-pitch-rules.cjs';
import replay from '../shared/timed-replay.cjs';

const game=breakout.create(replay.seeded(42)), actions=[];
let tick=0;
while(!game.dead&&tick<replay.MAX_TICKS){
  if(game.snapshot().serving){assert(breakout.input(game,401));actions.push(tick*breakout.inputCount+401);}
  breakout.advance(game,.01);tick++;
}
assert(game.dead);
assert(breakout.score(game)>0);
assert.equal(replay.verify(breakout,42,[tick,...actions]),breakout.score(game));
assert.equal(replay.verify(breakout,42,[tick-1,...actions]),null);

const voice=pitch.create(),notes=[2010000];assert(pitch.input(voice,2010000));
let ticks=0,prior=0;
while(!voice.dead&&ticks<replay.MAX_TICKS){
  const wall=voice.game.walls.find(w=>!w.judged);
  const sample=wall?Math.round(pitch.NOTE_HZ[wall.note]*1000):0;
  if(sample!==prior){assert(pitch.input(voice,sample));notes.push(ticks*pitch.inputCount+sample);prior=sample;}
  pitch.advance(voice,.01);ticks++;
}
assert.equal(voice.game.state,'clear');
assert(pitch.score(voice)>0);
assert.equal(replay.verify(pitch,42,[ticks,...notes]),pitch.score(voice));
assert.equal(replay.verify(pitch,42,[ticks-1,...notes]),null);
console.log('PASS: Breakout natural loss and positive On Pitch clear, exact Worker replay');
