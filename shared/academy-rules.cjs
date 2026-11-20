// 百萬大學堂（academy）：前端與 Worker 共用的純規則。
// 「學分」只是本遊戲的成績，不是錢包點數；平台點數 BONUS 另以固定單位發放，見 BONUS_PER_STAGE。
const academyRules = (() => {
  const LADDER = [2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000];
  const SAFE_STAGE = 5;
  const SAFE_CREDITS = 32000;
  const DOMAINS = ['science', 'history', 'geography', 'sports_ent', 'daily_tech'];
  const PER_DOMAIN = 20;
  // 題號 1–100 的正確選項（0–3），每 20 題一個領域；題目文字見 games/academy/questions.js。
  const ANSWERS = '2003030221031121301023031133230110213303000311302100211232333011212200230221322202331302211133011220'
    .split('').map(Number);
  const BONUS_PER_STAGE = 1;
  // 操作碼：0–4 選領域、5 隨機盲盒；10 刪兩個錯誤選項、11 智囊提示、12 臨場換題；
  // 20–23 作答 A–D、24 超時；30 見好就收（本局結束，成績不變）。
  const ACT = { RANDOM: 5, FIFTY: 10, HINT: 11, SWAP: 12, ANSWER: 20, TIMEOUT: 24, WALK: 30 };
  const MAX_ACTIONS = 64;

  const domainOf = id => DOMAINS[Math.floor((id - 1) / PER_DOMAIN)];
  const answerOf = id => ANSWERS[id - 1];

  function create(random) {
    return {
      random, stage: 1, credits: 0, phase: 'select', question: 0, domain: -1,
      used: new Set(), lifelines: { fifty: true, hint: true, swap: true },
      answered: 0, correct: 0, over: false, reason: null, cleared: 0
    };
  }
  function pool(state, domain) {
    const out = [];
    for (let id = domain * PER_DOMAIN + 1; id <= (domain + 1) * PER_DOMAIN; id++) if (!state.used.has(id)) out.push(id);
    return out;
  }
  function anyPool(state) {
    const out = [];
    for (let id = 1; id <= ANSWERS.length; id++) if (!state.used.has(id)) out.push(id);
    return out;
  }
  function draw(state, ids) {
    const id = ids[Math.floor(state.random() * ids.length)];
    state.used.add(id);
    state.question = id;
    return id;
  }
  function finish(state, reason) {
    state.over = true;
    state.reason = reason;
    state.phase = 'over';
    state.cleared = reason === 'champion' ? LADDER.length : state.stage - 1;
  }
  // 套用一個操作；不合法回傳 false 且不改變狀態。
  function step(state, action) {
    if (state.over || !Number.isInteger(action)) return false;
    if (state.phase === 'select') {
      if (action === ACT.WALK) {
        if (state.credits <= 0) return false;
        finish(state, 'walk');
        return true;
      }
      if (action < 0 || action > ACT.RANDOM) return false;
      let domain = action;
      if (action === ACT.RANDOM) {
        const open = DOMAINS.map((_, i) => i).filter(i => pool(state, i).length);
        if (!open.length) return false;
        domain = open[Math.floor(state.random() * open.length)];
      } else if (!pool(state, domain).length) return false;
      state.domain = domain;
      draw(state, pool(state, domain));
      state.phase = 'ask';
      return true;
    }
    if (action === ACT.FIFTY || action === ACT.HINT) {
      const key = action === ACT.FIFTY ? 'fifty' : 'hint';
      if (!state.lifelines[key]) return false;
      state.lifelines[key] = false;
      return true;
    }
    if (action === ACT.SWAP) {
      if (!state.lifelines.swap) return false;
      state.lifelines.swap = false;
      const same = pool(state, state.domain);
      draw(state, same.length ? same : anyPool(state));
      return true;
    }
    const timeout = action === ACT.TIMEOUT;
    if (!timeout && (action < ACT.ANSWER || action > ACT.ANSWER + 3)) return false;
    state.answered++;
    if (!timeout && action - ACT.ANSWER === answerOf(state.question)) {
      state.correct++;
      state.credits = LADDER[state.stage - 1];
      if (state.stage === LADDER.length) finish(state, 'champion');
      else { state.stage++; state.phase = 'select'; state.question = 0; }
      return true;
    }
    state.credits = state.stage > SAFE_STAGE ? SAFE_CREDITS : 0;
    finish(state, timeout ? 'timeout' : 'wrong');
    return true;
  }
  function accepts(actions) {
    return Array.isArray(actions) && actions.length > 0 && actions.length <= MAX_ACTIONS &&
      actions.every(a => Number.isInteger(a) && a >= 0 && a <= ACT.WALK);
  }
  // 重播全部操作；必須恰好在最後一個操作結束本局，否則回傳 null。
  function replay(random, actions) {
    if (!accepts(actions)) return null;
    const state = create(random);
    for (let i = 0; i < actions.length; i++) {
      if (!step(state, actions[i])) return null;
      if (state.over) return i === actions.length - 1 ? state.credits : null;
    }
    return null;
  }
  return {
    LADDER, SAFE_STAGE, SAFE_CREDITS, DOMAINS, PER_DOMAIN, ANSWERS, BONUS_PER_STAGE, ACT, MAX_ACTIONS,
    domainOf, answerOf, create, pool, step, accepts, replay
  };
})();
if (typeof module !== 'undefined') module.exports = academyRules;
