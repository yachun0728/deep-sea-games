import onPitchRules from '../../../shared/on-pitch-rules.cjs';
import breakoutRules from '../../../shared/breakout-rules.cjs';
import quackPondRules from '../../../shared/quack-pond-rules.cjs';
import mirrorTwinsRules from '../../../shared/mirror-twins-rules.cjs';
import blasterRules from '../../../shared/blaster-rules.cjs';
import mermaidRules from '../../../shared/mermaid-rules.cjs';
import lasthairRules from '../../../shared/last-hair-rules.cjs';
import mosquitoRules from '../../../shared/mosquito-rules.cjs';
import campaignRules from '../../../shared/campaign-rules.cjs';
import babyRules from '../../../shared/baby-rules.cjs';
import thiefRules from '../../../shared/thief-rules.cjs';
import bossRules from '../../../shared/boss-rules.cjs';
import riderRules from '../../../shared/rider-rules.cjs';
import napRules from '../../../shared/nap-rules.cjs';
import bookSortRules from '../../../shared/book-sort-rules.cjs';
import { verifiesBookSortScore } from './book-sort-scores.mjs';
import carpRules from '../../../shared/carp-rules.cjs';
import frontierRules from '../../../shared/frontier-rules.cjs';
import rocketChairRules from '../../../shared/rocket-chair-rules.js';
import elevatorRules from '../../../shared/elevator-rules.cjs';
import fishingRules from '../../../shared/fishing-rules.cjs';
import birdRules from '../../../shared/bird-rules.cjs';
import blockDropRules from '../../../shared/block-drop-rules.js';
import reaperRules from '../../../shared/reaper-rules.cjs';
import sneakRules from '../../../shared/sneak-rules.cjs';
import skybuilderRules from '../../../shared/skybuilder-rules.cjs';
import marketDeskRules from '../../../shared/market-desk-rules.cjs';
import academyRules from '../../../shared/academy-rules.cjs';
import timedReplay from '../../../shared/timed-replay.cjs';
import catRules from '../../../shared/cat-rules.cjs';
import runnerRules from '../../../shared/runner-rules.cjs';
import dreamRules from '../../../shared/dream-rules.cjs';
import oceanLink from '../../../games/ocean-link/board.js';
import mergeRules from '../../../shared/merge-rules.cjs';
import bobaRules from '../../../shared/boba-rules.cjs';

import outpostRules from '../../../shared/outpost-rules.cjs';

const LIFETIME_MS = 2 * 60 * 60 * 1000;
const MAX_REVISIONS = 16384;
const ID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
const newSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
function timedBoard(engine, rulesVersion) {
  return {
    create: () => ({seed: newSeed(), issuedAt: Date.now(), score: null, rulesVersion}),
    accepts: action => timedReplay.accepts(action, engine.inputCount),
    apply: (state, action) => {
      if (state.rulesVersion !== rulesVersion) return false;
      if ((action[0] - 1) * timedReplay.STEP_MS > Date.now() - state.issuedAt) return false;
      state.score = timedReplay.verify(engine, state.seed, action);
      return state.score !== null;
    },
    score: state => state.score,
    visible: ({seed, score}) => ({seed, score}),
  };
}
const blasterV1 = timedBoard({...blasterRules, create: rng => blasterRules.create(rng, 1)}, 1);
const blasterV2 = timedBoard(blasterRules, blasterRules.rulesVersion);
const bossV1 = timedBoard({...bossRules, create: rng => bossRules.create(rng, 1)});
const bossV2 = timedBoard(bossRules, bossRules.rulesVersion);
const babyV1 = timedBoard({...babyRules, create: rng => babyRules.create(rng, 1)});
const babyV2 = timedBoard(babyRules, babyRules.rulesVersion);
const sneakBoards = new Map([
  [undefined, timedBoard({...sneakRules, create: rng => sneakRules.create(rng, 1)})],
  ...[2, 3, 4, sneakRules.rulesVersion].map(version => [
    version, timedBoard({...sneakRules, create: rng => sneakRules.create(rng, version)}, version),
  ]),
]);
function puzzleBoard(rules) {
  return {
    create: () => ({ lastCleared: null }),
    accepts: action => Array.isArray(action) && action.length <= 4097
      && action.every(value => Number.isSafeInteger(value)),
    apply: (state, action) => {
      if (!rules.verify(action)) return false;
      state.lastCleared = action[0];
      return true;
    },
    score: () => null,
    visible: state => state,
  };
}
const boards = new Map([
  ['on-pitch', timedBoard(onPitchRules)],
  ['breakout', timedBoard(breakoutRules)],
  ['quack-pond', puzzleBoard(quackPondRules)],
  ['mirror-twins', puzzleBoard(mirrorTwinsRules)],
  ['outpost', timedBoard(outpostRules, 1)],
  ['blaster', {
    ...blasterV1,
    create: version => (version === blasterRules.rulesVersion ? blasterV2 : blasterV1).create(),
    apply: (state, action) => (state.rulesVersion === blasterRules.rulesVersion ? blasterV2 : blasterV1).apply(state, action),
  }],
  ['mermaid', timedBoard(mermaidRules)],
  ['last-hair', timedBoard(lasthairRules)],
  ['mosquito', timedBoard(mosquitoRules)],
  ['campaign', timedBoard(campaignRules)],
  ['baby', {
    ...babyV1,
    rulesVersion: babyRules.rulesVersion,
    create: version => (version === babyRules.rulesVersion ? babyV2 : babyV1).create(),
    apply: (state, action) => (state.rulesVersion === babyRules.rulesVersion ? babyV2 : babyV1).apply(state, action),
  }],
  ['thief', timedBoard(thiefRules)],
  ['boss', {
    ...bossV1,
    rulesVersion: bossRules.rulesVersion,
    create: version => (version === bossRules.rulesVersion ? bossV2 : bossV1).create(),
    apply: (state, action) => (state.rulesVersion === bossRules.rulesVersion ? bossV2 : bossV1).apply(state, action),
  }],
  ['rider', timedBoard(riderRules)],
  ['nap', timedBoard(napRules)],
  ['carp', timedBoard(carpRules)],
  ['book-sort', {
    create: stage => ({ stage, issuedAt: Date.now(), score: null }),
    accepts: action => Array.isArray(action) && action.length > 0 && action.length <= 4096,
    apply: (state, action) => {
      if (bookSortRules.rankedBookMinimumMs(action) > Date.now() - state.issuedAt
        || !verifiesBookSortScore(state.stage, action)) return false;
      state.score = state.stage;
      return true;
    },
    score: state => state.score,
    visible: ({stage, score}) => ({stage, score}),
  }],
 ['frontier',{
  create:()=>({...frontierRules.create(newSeed()),issuedAt:Date.now()}),
  accepts:frontierRules.accepts,
  apply:(state,action)=>{
   if((state.elapsed+action[0]) * 50 > Date.now()-state.issuedAt+100)return false;
   return frontierRules.apply(state,action);
  },
  score:state=>state.dead?state.completed:null,
  checkpoint:state=>state.completed>0?state.completed:null,
  visible:state=>state,
 }],

 ['rocket-chair',timedBoard(rocketChairRules)],
  ['market-desk', {
    create: () => ({seed: newSeed(), score: null}),
    accepts: marketDeskRules.accepts,
    apply: (state, actions) => {
      const order = marketDeskRules.deck(timedReplay.seeded(state.seed));
      state.score = marketDeskRules.replay(order, actions);
      return state.score !== null;
    },
    score: state => state.score,
    visible: ({seed, score}) => ({seed, score}),
  }],
  ['academy', {
    create: () => ({seed: newSeed(), score: null}),
    accepts: academyRules.accepts,
    apply: (state, actions) => {
      state.score = academyRules.replay(timedReplay.seeded(state.seed), actions);
      return state.score !== null;
    },
    score: state => state.score,
    visible: ({seed, score}) => ({seed, score}),
  }],
  ['elevator', timedBoard(elevatorRules)],
  ['boba', timedBoard(bobaRules)],
  ['fishing', timedBoard(fishingRules)],
  ['cat', timedBoard(catRules)],
  ['bird', timedBoard(birdRules)],
  ['tetris', timedBoard(blockDropRules)],
  ['reaper', timedBoard(reaperRules)],
  ['sneak', {
    ...sneakBoards.get(undefined),
    rulesVersion: sneakRules.rulesVersion,
    supportedVersions: [2, 3, 4, sneakRules.rulesVersion],
    create: version => sneakBoards.get(version).create(),
    apply: (state, action) => sneakBoards.get(state.rulesVersion)?.apply(state, action) ?? false,
  }],
  ['skybuilder', timedBoard(skybuilderRules)],
  ['merge', {
    // The client plays the whole game locally from this seed and sends every swipe once, at game over.
    create: () => {
      const seed = newSeed();
      return { ...mergeRules.create(timedReplay.seeded(seed)), seed };
    },
    accepts: action => Array.isArray(action) && action.length >= 1 && action.length <= 8000 &&
      action.every(move => Number.isInteger(move) && move >= 0 && move < mergeRules.directions.length),
    apply: (state, action) => {
      const rng = timedReplay.seeded(state.seed), replay = mergeRules.create(rng);
      for (const move of action) if (!mergeRules.move(replay, mergeRules.directions[move], rng)) return false;
      if (!replay.over) return false;
      Object.assign(state, replay);
      return true;
    },
    score: state => state.over ? state.score : null,
    visible: state => state,
  }],
  ['dream', {
    create: () => ({stage: 1, completed: 0, seed: newSeed(), issuedAt: Date.now(), lost: false}),
    accepts: action => Number.isInteger(action) && action >= 0 && action <= dreamRules.MAX_TICKS,
    apply: (state, ticks) => {
      if (ticks * dreamRules.STEP_MS > Date.now() - state.issuedAt) return false;
      state.lost = !dreamRules.adjudicate(state.stage, state.seed, ticks);
      if (!state.lost) {
        state.completed = state.stage++;
        state.seed = newSeed();
        state.issuedAt = Date.now();
      }
      return true;
    },
    score: state => state.lost ? state.completed : null,
    checkpoint: state => !state.lost ? state.completed : null,
    visible: state => ({stage: state.stage, completed: state.completed, seed: state.seed, lost: state.lost}),
  }],
  ['runner', {
    rulesVersion: runnerRules.rulesVersion,
    create: rulesVersion => ({seed: newSeed(), issuedAt: Date.now(), distance: null, rulesVersion}),
    accepts: runnerRules.accepts,
    apply: (state, action) => {
      if (action[0] * runnerRules.STEP_MS > Date.now() - state.issuedAt) return false;
      state.distance = runnerRules.replay(state.seed, action, state.rulesVersion ?? 1);
      return state.distance !== null;
    },
    score: state => state.distance,
    visible: ({seed, distance, rulesVersion}) => ({seed, distance, rulesVersion}),
  }],
  ['ocean-link', {
    create: () => ({level: 1, completed: 0, seed: newSeed()}),
    accepts: action => Array.isArray(action) && action.length === 24 &&
      action.every(pair => Number.isInteger(pair) && pair >= 0 && pair < 6400),
    apply: (state, action) => {
      if (!oceanLink.verifyOceanLinkLevel(state.level, state.seed, action)) return false;
      state.completed = state.level;
      if (state.level < 10) {
        state.level++;
        state.seed = newSeed();
      }
      return true;
    },
    score: state => state.completed === 10 ? state.completed : null,
    checkpoint: state => state.completed < 10 ? state.completed : null,
    visible: state => state,
  }],
]);

export async function readBoardCommand(request, isMove) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  try {
    const decoder = new TextDecoder();
    let text = '', bytes = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 48 * 1024) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    const command = JSON.parse(text + decoder.decode());
    const game = boards.get(command?.gameId);
    if (!game) return null;
    const bookSortStart = !isMove && command.gameId === 'book-sort';
    const rulesVersion = command.gameId === 'blaster' ? blasterRules.rulesVersion : game.rulesVersion;
    const versionedStart = !isMove && rulesVersion !== undefined && Object.hasOwn(command, 'rulesVersion');
    if (Object.keys(command).length !== (isMove ? 4 : bookSortStart || versionedStart ? 2 : 1)) return null;
    if (versionedStart && !((game.supportedVersions ?? [rulesVersion]).includes(command.rulesVersion))) return null;
    if (bookSortStart && (!Number.isSafeInteger(command.stage) || command.stage < 1)) return null;
    if (isMove && (typeof command.id !== 'string' || !ID.test(command.id) ||
        !Number.isInteger(command.revision) || command.revision < 0 ||
        command.revision > MAX_REVISIONS || !game.accepts(command.action))) return null;
    return command;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

export async function startRankedBoard(db, playerId, gameId, stage, rulesVersion) {
  const id = crypto.randomUUID(), game = boards.get(gameId);
  let state;
  if(gameId==='frontier'){
    const previous=await db.prepare('SELECT id,revision,state,started_at FROM ranked_boards WHERE player_id=? AND game_id=? AND score IS NULL ORDER BY started_at DESC LIMIT 1').bind(playerId,gameId).first();
    if(previous){
      state=JSON.parse(previous.state);
      if(Date.now()-previous.started_at<LIFETIME_MS)return {id:previous.id,revision:previous.revision,state:game.visible(state)};
      // A renewed transport round carries only the previously verified simulation.
      state.elapsed=0;
      state.issuedAt=Date.now();
    }
  }
  state ??= game.create(gameId === 'blaster' || game.rulesVersion !== undefined ? rulesVersion : stage);
  await db.prepare(
    'INSERT INTO ranked_boards (id, player_id, game_id, started_at, state) VALUES (?, ?, ?, ?, ?)',
  ).bind(id, playerId, gameId, Date.now(), JSON.stringify(state)).run();
  return { id, revision: 0, state: game.visible(state) };
}

export async function moveRankedBoard(db, playerId, { gameId, id, revision, action }) {
  const game = boards.get(gameId);
  const select = db.prepare(
    'SELECT started_at, revision, last_action, state, score FROM ranked_boards WHERE id = ? AND player_id = ? AND game_id = ?',
  ).bind(id, playerId, gameId);
  const prior = await select.first();
  if (!prior) return { error: 'round_not_found', status: 404 };

  const actionKey = typeof action === 'string' ? action : JSON.stringify(action);
  const isRetry = row => row?.revision === revision + 1 && row.last_action === actionKey;
  const response = row => ({ id, revision: row.revision, state: game.visible(JSON.parse(row.state)) });
  if (isRetry(prior)) return response(prior);
  if (prior.revision !== revision || prior.score !== null) return { error: 'stale_move', status: 409 };
  if (revision >= MAX_REVISIONS || Date.now() - prior.started_at > LIFETIME_MS) {
    return { error: 'round_expired', status: 410 };
  }

  const state = JSON.parse(prior.state);
  if (!game.apply(state, action)) return response(prior);

  const saved = await db.prepare(
    'UPDATE ranked_boards SET state = ?, revision = revision + 1, last_action = ?, score = ?, checkpoint_score = ? WHERE id = ? AND player_id = ? AND game_id = ? AND revision = ? AND score IS NULL RETURNING revision, state',
  ).bind(JSON.stringify(state), actionKey, game.score(state), game.checkpoint?.(state) ?? null, id, playerId, gameId, revision).first();
  if (saved) return response(saved);
  const current = await select.first();
  return isRetry(current) ? response(current) : { error: 'stale_move', status: 409 };
}
