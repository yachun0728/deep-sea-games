(async function () {
  const checks = [];
  const assert = (ok, text) => {
    if (!ok) throw new Error(text);
    checks.push(text);
  };
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const byId = id => document.getElementById(id);
  const view = byId('view-merge');
  const board = byId('mg');
  const go = byId('mg-go');
  const exit = byId('mg-exit');
  const notice = byId('mg-milestone');
  const {state, localStart} = window.__mergeTest;
  const bounds = element => element.getBoundingClientRect();
  const fits = element => {
    const rect = bounds(element);
    return rect.width > 0 && rect.height > 0 && rect.top >= 0 &&
      rect.left >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight;
  };
  const fixture = values => { state.grid = [...values, ...Array(16 - values.length).fill(0)]; };
  const press = code => document.body.dispatchEvent(new KeyboardEvent('keydown', {code, bubbles: true}));
  const i18n = window.deepSeaI18n;
  try {
    await wait(80);
    assert(!view.hidden && go.textContent === 'Start a round', 'Direct English hash opens the start screen');
    assert(fits(board) && fits(go) && fits(exit), 'Start board, action and exit fit the viewport');
    assert(bounds(go).height >= 44 && bounds(exit).height >= 44, 'Start and exit hit areas are at least 44px');
    if (innerWidth < 880) {
      const area = bounds(view.querySelector('.mg-console'));
      assert(area.width === innerWidth && area.height === innerHeight, 'Mobile playfield fills the viewport');
    }
    const balance = byId('balance').textContent;
    localStart();
    fixture([1024, 1024]);
    press('ArrowLeft');
    await wait(60);
    assert(state.active && byId('mg-max').textContent === '2048', '2048 stays in the active round');
    assert(notice.textContent === 'You reached 2048!', '2048 notice includes its value in English');
    assert(fits(board) && bounds(notice).bottom <= bounds(board).top, 'Notice sits clear of the board');
    i18n.setLanguage('zh-Hant');
    assert(notice.textContent === '養出 2048 珍珠！', 'Active milestone translates without restarting');
    const score = state.score;
    const priorGrid = state.grid.join(',');
    press('ArrowRight');
    assert(state.grid.join(',') !== priorGrid && state.score >= score && state.active, 'A subsequent move works while the notice is visible');
    i18n.setLanguage('en');
    fixture([2048, 2048]);
    press('ArrowLeft');
    assert(state.active && notice.textContent === 'You reached 4096!', '4096 replaces the previous notice');
    fixture([4096, 4096]);
    press('ArrowLeft');
    assert(state.active && notice.textContent === 'You reached 8192!', 'Higher milestones use the same feedback');
    await wait(1120);
    assert(!notice.textContent && state.active, 'Notice disappears after one second and the round continues');

    state.grid = [0,4,2,4, 2,4,2,4, 4,2,4,2, 2,4,2,4];
    const random = Math.random;
    Math.random = () => 0;
    try { press('ArrowLeft'); } finally { Math.random = random; }
    assert(state.over && !state.active && fits(board) && fits(go) && fits(exit), 'Finished board, restart and exit fit');
    assert(byId('mg-msg').textContent.includes('Largest pearl 4'), 'English result names the largest pearl');
    i18n.setLanguage('zh-Hant');
    assert(byId('mg-msg').textContent.includes('最大珍珠 4'), 'Finished result re-localizes');
    assert(byId('balance').textContent === balance, 'Milestones and finishing never change wallet balance');
    exit.click();
    await wait(60);
    assert(view.hidden && location.hash === '#lobby', 'Exit returns to the lobby');
    document.body.dataset.testStatus = 'PASS';
  } catch (error) {
    checks.push(error.stack);
    document.body.dataset.testStatus = 'FAIL';
  }
  const result = document.createElement('script');
  result.type = 'application/json';
  result.id = 'test-results';
  result.textContent = JSON.stringify(checks);
  document.body.append(result);
})();
