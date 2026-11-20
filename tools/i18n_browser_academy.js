(async function () {
  const results = [];
  const get = id => document.getElementById(id);
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const i18n = window.deepSeaI18n;
  const view = get('view-academy');
  const phone = matchMedia('(max-width:880px)').matches;
  function assert(ok, message) {
    if (!ok) throw new Error(message);
    results.push(message);
  }
  window.addEventListener('error', event => results.push('Page error: ' + event.message));
  const hook = () => window.__academyTest;
  const snap = () => hook().snapshot();
  const balance = () => get('balance').textContent;
  const visible = el => !el.hidden && el.getBoundingClientRect().height > 0;
  async function until(check, label) {
    for (let i = 0; i < 60 && !check(); i++) await wait(50);
    if (!check()) throw new Error('Timed out: ' + label);
  }
  async function answer(correct) {
    const state = snap().state;
    const right = hook().rules.answerOf(state.question);
    const pick = correct ? right : (right + 1) % 4;
    get('ac-options').querySelector(`[data-opt="${pick}"]`).click();
    await until(() => !get('ac-next').hidden, 'answer reveal');
  }
  async function begin() {
    get('ac-go').click();
    await until(() => snap().phase === 'select', 'start');
  }
  function noOverlap() {
    const hud = view.querySelector('.ac-hud').getBoundingClientRect();
    const exit = get('ac-exit').getBoundingClientRect();
    const bottom = view.querySelector('.ac-bottom').getBoundingClientRect();
    return exit.width >= 44 && exit.height >= 44 && hud.bottom <= view.querySelector('.ac-main').getBoundingClientRect().top + 1 &&
      bottom.bottom <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth;
  }
  try {
    await until(() => hook(), 'test hook');
    assert(!view.hidden && get('ac-go').textContent === 'Take the stage' && view.lang === 'en', 'English direct hash opens Millionaire Academy');
    assert(!/[㐀-鿿]/.test(view.textContent.replace(/繁中|简中/g, '')), 'English intro has no untranslated Chinese');
    assert(!!document.querySelector('.game-card[href="#academy"] .game-card-bonus'), 'Lobby card is marked BONUS');
    i18n.setLanguage('zh-Hant');
    assert(get('ac-go').textContent === '登台開始挑戰' && view.lang === 'zh-Hant', 'Site language switch gives Traditional Chinese');
    get('ac-lang').click();
    assert(get('ac-lang').textContent === 'EN' && get('ac-go').textContent === 'Take the stage', 'In-game language button cycles to English');
    get('ac-lang').click();
    assert(get('ac-lang').textContent === '简中' && get('ac-go').textContent === '登台开始挑战' && view.lang === 'zh-Hans', 'In-game language button offers Simplified Chinese');
    get('ac-lang').click();
    assert(get('ac-lang').textContent === '繁中', 'Language cycle returns to Traditional Chinese');
    i18n.setLanguage('en');

    const events = [];
    const analytics = window.deepSeaAnalytics;
    for (const name of ['start', 'progress', 'end']) {
      const original = analytics[name];
      analytics[name] = function (...args) { events.push([name, ...args]); return original.apply(this, args); };
    }
    const before = Number(balance().replace(/[^\d]/g, ''));
    const wallet = () => Number(balance().replace(/[^\d]/g, ''));

    // Run 1: clear stage 1, use lifelines at stage 2, lose it.
    if (phone) assert(getComputedStyle(view).position === 'fixed' && noOverlap(), 'Phone intro fills the screen without overlap');
    get('ac-go').click();
    get('ac-go').click();
    await until(() => snap().phase === 'select', 'start run');
    assert(events.filter(e => e[0] === 'start').length === 1, 'Double-tapping start opens exactly one round');
    assert(get('ac-domains').children.length === 6, 'Domain picker shows five subjects and the random box');
    assert(get('ac-ladder').children.length === 10 && !get('ac-walk-btn').offsetParent, 'Ladder has ten rungs; ending the run is unavailable before any credits');
    if (phone) assert(noOverlap(), 'Phone domain picker keeps HUD and controls clear');
    get('ac-domains').children[0].click();
    await until(() => snap().phase === 'ask', 'first question');
    assert(visible(get('ac-question')) && get('ac-options').querySelectorAll('.ac-opt').length === 4, 'Question and four options are shown');
    if (phone) {
      const rects = [...get('ac-options').querySelectorAll('.ac-opt')].map(b => b.getBoundingClientRect());
      assert(noOverlap() && rects.every((r, i) => r.height >= 44 && r.right <= innerWidth && (!i || r.top >= rects[i - 1].bottom)),
        'Phone options are 44px+ tall, stacked and inside the viewport');
    }
    const right0 = hook().rules.answerOf(snap().state.question);
    const optionButton = i => get('ac-options').querySelector(`[data-opt="${i}"]`);
    optionButton(right0).click();
    optionButton((right0 + 1) % 4).click();
    await until(() => !get('ac-next').hidden, 'first reveal');
    assert(snap().state.answered === 1, 'Tapping several options records a single answer');
    assert(snap().state.correct === 1 && snap().bonusEarned === 1, 'Clearing a stage pays the fixed +1 BONUS once');
    assert(wallet() >= before + 1, 'Wallet reflects the BONUS point');
    assert(get('ac-feedback').textContent.includes('BONUS'), 'Feedback shows the BONUS and explanation: ' + get('ac-feedback').textContent);
    get('ac-next').click();
    assert(snap().phase === 'select' && !get('ac-walk-btn').hidden, 'After a correct answer the picker offers ending the run');
    if (phone) assert(noOverlap(), 'Phone result and picker keep controls reachable');

    get('ac-domains').children[5].click(); // random box
    await until(() => snap().phase === 'ask', 'second question');
    const questionBefore = get('ac-question').textContent;
    get('ac-fifty').click();
    assert(get('ac-options').querySelectorAll('.is-gone').length === 2 && get('ac-fifty').disabled, '50:50 removes two options and can only be used once');
    get('ac-hint-btn').click();
    assert(!get('ac-hint').hidden && get('ac-hint-btn').disabled, 'Expert hint appears and is single use');
    get('ac-swap').click();
    assert(get('ac-question').textContent !== questionBefore && get('ac-options').querySelectorAll('.is-gone').length === 0 && get('ac-swap').disabled, 'Swap loads a fresh question and clears eliminated options');
    // Language change mid-question keeps the same question
    const qid = snap().state.question;
    get('ac-lang').click(); get('ac-lang').click(); // en -> zh-Hant? cycle: en->cn->tw
    assert(snap().state.question === qid && snap().phase === 'ask' && /[㐀-鿿]/.test(get('ac-question').textContent), 'Switching language mid-question keeps the same question and round');
    i18n.setLanguage('en');
    assert(snap().state.question === qid && !/[㐀-鿿]/.test(get('ac-question').textContent), 'Language returns to English with the question intact');
    await answer(false);
    assert(get('ac-feedback').dataset.result === 'wrong' && get('ac-options').querySelector('.is-correct') && get('ac-options').querySelector('.is-wrong'), 'Wrong answer shows the right and wrong options');
    get('ac-next').click();
    assert(snap().phase === 'over' && get('ac-final').textContent === '0' && snap().bonusEarned === 1, 'Losing before the safe line ends with 0 credits and keeps the earned BONUS');
    assert(get('ac-rank-status').textContent.length > 0, 'Result shows a leaderboard status');
    if (phone) assert(noOverlap(), 'Phone result screen keeps controls reachable');
    const afterRun = wallet();
    const ends = events.filter(e => e[0] === 'end');
    assert(ends.length === 1 && ends[0][3] === 'complete' && ends[0][2] === 1, 'Run ends once with the BONUS as payout');
    assert(afterRun === before + 1, 'Exactly one BONUS point was added to the wallet');

    // Run 2: clear stage 1, then end the run voluntarily; leaving mid-round abandons it.
    await begin();
    get('ac-domains').children[1].click();
    await until(() => snap().phase === 'ask', 'run 2 question');
    await answer(true);
    get('ac-next').click();
    get('ac-walk-btn').click();
    assert(!get('ac-walk').hidden, 'Ending the run asks for confirmation');
    get('ac-walk-no').click();
    assert(get('ac-walk').hidden && snap().phase === 'select', 'Continuing keeps the run going');
    get('ac-walk-btn').click();
    get('ac-walk-yes').click();
    assert(snap().phase === 'over' && get('ac-final').textContent === '2,000' && snap().bonusEarned === 1, 'Ending the run settles the current credits and no extra BONUS');
    assert(wallet() === afterRun + 1, 'Second run pays only its own single BONUS point');
    await begin();
    get('ac-domains').children[2].click();
    await until(() => snap().phase === 'ask', 'run 3 question');
    location.hash = 'lobby';
    await until(() => snap().phase === 'intro', 'leave abandons');
    assert(events.filter(e => e[0] === 'end').slice(-1)[0][3] === 'abandoned' && wallet() === afterRun + 1, 'Leaving mid-question abandons the round without charging or paying');
    location.hash = 'academy';
    await wait(100);
    get('ac-rank-btn').click();
    assert(!get('ac-rank').hidden, 'Leaderboard sheet opens from the intro screen');
    await until(() => get('ac-rank-empty').textContent !== '' || get('ac-rank-list').children.length, 'leaderboard result');
    get('ac-rank-close').click();
    assert(get('ac-rank').hidden, 'Leaderboard sheet closes');
    assert(!/[㐀-鿿]/.test(view.textContent.replace(/繁中|简中/g, '')), 'English view stays free of untranslated Chinese after play');
  } catch (error) {
    document.body.dataset.testStatus = 'FAIL';
    results.push(error.stack);
  }
  if (!document.body.dataset.testStatus) document.body.dataset.testStatus = 'PASS';
  const output = document.createElement('pre');
  output.id = 'test-results';
  output.setAttribute('data-i18n-ignore', '');
  output.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%';
  output.textContent = JSON.stringify(results);
  document.body.appendChild(output);
})();
