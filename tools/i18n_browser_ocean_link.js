(async function () {
  const results = [], errors = [];
  const el = id => document.getElementById(id);
  const wait = () => new Promise(resolve => setTimeout(resolve, 80));
  const assert = (ok, message) => { if (!ok) throw new Error(message); results.push(message); };
  const click = id => el(id).click();
  function clearStage() {
    const grid = el('ol-board');
    while (grid.querySelector('.ol-tile')) {
      click('ol-hint');
      const pair = grid.querySelectorAll('.ol-hint');
      if (pair.length !== 2) throw new Error('Hint missing or incomplete');
      pair[0].click(); pair[1].click(); pair[1].click();
    }
  }
  const balance = () => Number(el('balance').textContent.replace(/,/g, ''));
  const events = [];
  const analytics = window.deepSeaAnalytics;
  for (const name of ['start', 'progress', 'resume', 'end']) {
    const original = analytics[name];
    analytics[name] = (...args) => { events.push({name, args}); return original(...args); };
  }
  window.addEventListener('error', event => errors.push(event.message));
  const nativeMatchMedia = window.matchMedia.bind(window);
  window.matchMedia = query => query === '(prefers-reduced-motion: reduce)' ? {matches: true} : nativeMatchMedia(query);
  try {
    await wait();
    if (new URLSearchParams(location.search).get('probe') === 'low') {
      assert(document.title.includes('深海連連看') && !el('view-ocean-link').hidden, 'Direct Chinese hash opens Ocean Link');
      el('ol-stage').requestFullscreen = undefined;
      click('ol-full');
      assert(balance() === 0 && !el('ol-playfield').hidden && el('ol-stage').classList.contains('ol-expanded') &&
        events.length === 1 && events[0].args[1] === 0, 'Zero points can start immediately in fullscreen without paying');
    } else {
      assert(location.hash === '#ocean-link' && !el('view-ocean-link').hidden &&
        document.title === 'Ocean Link', 'Direct English hash opens Ocean Link');

      for (const script of document.querySelectorAll('script:not([src])')) {
        if (script.type === 'application/json') JSON.parse(script.textContent);
        else new Function(script.textContent);
      }
      assert(true, 'Executable scripts parse as JavaScript and data scripts parse as JSON');

      const source = await fetch('games/ocean-link/board.js').then(response => response.text());
      const engine = new Function(source + '\nreturn oceanLinkBoard;')();
      const small = engine(4, 4);
      const cell = (x, y) => y * 6 + x;
      const sample = Array(36).fill(0);
      sample[cell(1, 1)] = sample[cell(4, 1)] = 1;
      sample[cell(2, 1)] = sample[cell(3, 1)] = -1;
      sample[cell(1, 2)] = sample[cell(4, 2)] = -1;
      assert(small.linkPath(sample, cell(1, 1), cell(4, 1)).some(([, y]) => y === 0), 'Two turns can pass around the outer edge');
      sample[cell(1, 0)] = -1;
      assert(!small.linkPath(sample, cell(1, 1), cell(4, 1)), 'A route requiring more than two turns is rejected');
      const dead = Array(36).fill(0);
      for (let y = 1; y <= 4; y++) {
        for (let x = 1; x <= 4; x++) dead[cell(x, y)] = -1;
      }
      dead[cell(2, 2)] = dead[cell(3, 3)] = 1;
      dead[cell(3, 2)] = dead[cell(2, 3)] = 2;
      assert(!small.findPair(dead), 'Blocked checkerboard is recognized as a deadlock');

      for (const [rows, cols] of [[14, 18], [16, 26]]) {
        const {levels, deal, slide, reefBoard, linkPath} = engine(rows, cols);
        for (const [, direction, reefs] of levels) {
          for (let trial = 0; trial < 12; trial++) {
            const layout = reefBoard(reefs);
            const capacity = (rows * cols - 4 * reefs) / 2;
            // Exercise full opening deals as well as partial reshuffles.
            const count = trial === 0 ? capacity : 1 + Math.floor(Math.random() * capacity);
            const symbols = Array.from({length: count}, (_, index) => 1 + index % 64);
            const {board, moves} = deal(layout, symbols, direction);
            const tileIds = board.filter(value => value > 0).sort((a, b) => a - b).join();
            if (tileIds !== symbols.concat(symbols).sort((a, b) => a - b).join()) throw new Error('Reshuffle changed the tile multiset');
            for (const [a, b] of moves) {
              if (board[a] !== board[b] || !linkPath(board, a, b)) throw new Error('Unsolvable deal');
              board[a] = board[b] = 0;
              slide(board, direction);
            }
            if (board.some((value, index) => value !== layout[index])) throw new Error('Incomplete solution or reef moved');
          }
        }
      }
      assert(true, '240 full and partial deals preserve symbols and reefs and replay to empty');

      const stage = el('ol-stage'), grid = el('ol-board');
      const realNow = Date.now.bind(Date);
      let clockOffset = 0;
      Date.now = () => realNow() + clockOffset;
      const seconds = () => Number(el('ol-time').dateTime.slice(2, -1));
      // Drive the same fallback used when iPhone Safari cannot fullscreen an element.
      stage.requestFullscreen = () => Promise.reject(new Error('Unavailable in this browser'));
      const initial = balance();
      assert(el('ol-mode').value === 'standard' && el('ol-mode').options[0].textContent === 'Easy · 6 × 8',
        'Easy mode is localized and Standard remains the default');
      for (const [mode, rows, cols] of [['easy', 6, 8], ['standard', 14, 18], ['challenge', 16, 26]]) {
        el('ol-mode').value = mode;
        const before = balance();
        click('ol-full');
        await wait();
        assert(stage.classList.contains('ol-expanded') && !el('ol-playfield').hidden && el('ol-go').hidden &&
          el('ol-full').parentElement.id === 'ol-toolbar-actions', mode + ' one tap starts the game in fullscreen');
        assert(balance() === before && el('ol-left').textContent === String(rows * cols / 2), mode + ' starts once with the requested dimensions');
        assert(Number(getComputedStyle(grid).gridTemplateColumns.split(' ').length) === cols + 2, mode + ' renders both outer side lanes');
        assert(!el('reset'), 'No point reset control during ' + mode);
        assert(seconds() === 0, mode + ' new expedition begins at zero');
        clockOffset += 3000;
        window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true}));
        assert(seconds() >= 3, mode + ' clock continues in fullscreen');
        assert(stage.classList.contains('ol-expanded') && el('ol-full').getAttribute('aria-pressed') === 'true', mode + ' enters fixed viewport fallback');
        const box = grid.getBoundingClientRect();
        assert(getComputedStyle(el('ol-rule').parentElement).display === 'none' &&
          el('ol-clock').getBoundingClientRect().width > 0, mode + ' focused view enlarges only the board and leaves the clock visible');
        assert(box.right <= innerWidth && box.left >= 0 && box.height <= innerHeight, mode + ' board fits fullscreen viewport');
        window.deepSeaI18n.setLanguage('zh-Hant');
        await wait();
        assert(document.title.includes('深海連連看') && el('ol-go').textContent === '下一關', 'In-game language switch restores Chinese');
        window.deepSeaI18n.setLanguage('en');
        await wait();
        assert(el('ol-go').textContent === 'Next stage' && balance() === before, 'Switch back to English preserves the active round');
        for (let level = 1; level <= 10; level++) {
          if (level === 2) {
            const beforeWait = seconds();
            clockOffset += 2000;
            window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true}));
            assert(seconds() === beforeWait, mode + ' clock pauses while waiting for next stage');
            click('ol-go');
            assert(seconds() === beforeWait && el('ol-result').hidden, mode + ' next stage resumes from the paused time');
            clockOffset += 2000;
            window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true}));
            assert(seconds() >= beforeWait + 2, mode + ' clock resumes during active play');
          } else if (level > 1) click('ol-go');
          const target = before + 5 * [3, 6, 10].filter(stage => stage < level).length;
          assert(balance() === target, mode + ' stage ' + level + ' begins at the expected balance');
          if (mode === 'easy') {
            const kinds = new Set(Array.from(grid.querySelectorAll('.ol-tile'), tile => tile.textContent));
            assert(kinds.size === (level <= 3 ? 6 : level <= 6 ? 8 : 12) &&
              !grid.querySelector('.ol-reef') && el('ol-left').textContent === '24',
              'Easy stage ' + level + ' has 24 pairs, fewer kinds and no reefs');
          }
          clearStage();
          assert(!el('ol-result').hidden && el('ol-playfield').hidden &&
            el('ol-result-level').textContent === String(level) &&
            el('ol-result-time').dateTime === el('ol-time').dateTime &&
            el('ol-result-actions').contains(el('ol-go')) &&
            el('ol-result-reward').hidden === ![3, 6, 10].includes(level), mode + ' shows the frozen result for stage ' + level);
          if (level === 1) {
            await wait();
            assert(el('ol-result-title').textContent === 'Congratulations! Stage cleared!', mode + ' shows a localized congratulations screen');
            if (mode === 'easy') {
              const resultBox = el('ol-result').getBoundingClientRect();
              assert(stage.classList.contains('ol-expanded') && resultBox.width >= 200 && resultBox.right <= innerWidth &&
                resultBox.bottom <= innerHeight, 'Fullscreen congratulations keeps its result and Next stage visible');
            }
          }
          assert(balance() === target + ([3, 6, 10].includes(level) ? 5 : 0), mode + ' stage ' + level + ' clears and settles exactly once');
        }
        await wait();
        const stopped = seconds();
        clockOffset += 5000;
        window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true}));
        assert(seconds() === stopped, mode + ' clock stops after ending');
        assert(el('ol-result-title').textContent === 'Congratulations! Expedition complete!' &&
          el('ol-result-time').textContent === el('ol-time').textContent, mode + ' displays localized final result and total time');
        assert(JSON.parse(localStorage.getItem('deep-sea-ocean-link-best-v1'))[mode] === 10, mode + ' saves its record');
        click('ol-full');
        assert(el('ol-full').parentElement.id === 'ol-board-actions' && !el('ol-result').hidden,
          mode + ' leaving fullscreen after a win retains results without another end event');
      }
      assert(balance() === initial + 45 && Number(localStorage.getItem('crush-depth-balance')) === balance(), 'All three rounds persist their exact net points');
      const starts = events.filter(event => event.name === 'start');
      assert(starts.length === 3 && starts.every(event => event.args[1] === 0), 'One free analytics start per expedition');
      assert(events.filter(event => event.name === 'resume').length === 27, 'One analytics resume per next stage');
      const progress = events.filter(event => event.name === 'progress');
      assert(progress.length === 30 && progress.filter(event => event.args[2]).length === 27 &&
        progress.filter(event => event.args[1].bonus_points === 5).length === 9, 'Progress and reward events match stage boundaries');
      const ends = events.filter(event => event.name === 'end');
      assert(ends.map(event => event.args[3].mode).join() === 'easy,standard,challenge', 'Tracking keeps each difficulty distinct');
      assert(ends.length === 3 && ends.every(event => event.args[1] === 15 && event.args[2] === 'win'), 'One win event with 15 points per expedition');

      click('ol-full');
      await wait();
      window.dispatchEvent(new PageTransitionEvent('pagehide', {persisted: true}));
      window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true}));
      assert(!el('ol-playfield').hidden && events.filter(event => event.name === 'end').length === 3, 'BFCache transition keeps active expedition');
      document.querySelector('.brand-home').click();
      await wait();
      assert(location.hash === '#lobby' && !document.body.classList.contains('ol-expanded'), 'Home link ends round and exits fallback');
      assert(events.filter(event => event.name === 'end').at(-1).args[2] === 'abandoned', 'Route abandonment ends analytics once');
      const card = document.querySelector('a.game-card[href="#ocean-link"]');
      document.querySelector('[data-lobby-filter="retro"]').click();
      assert(!card.hidden && card.dataset.gameCategory === 'retro', 'Ocean Link appears in the Free classics filter');
      card.click();
      await wait();
      assert(!el('view-ocean-link').hidden, 'Lobby card opens the game');
      const beforeAbandon = balance();
      click('ol-full');
      await wait();
      for (let level = 1; level <= 3; level++) {
        if (level > 1) click('ol-go');
        clearStage();
      }
      click('ol-full');
      const abandon = events.filter(event => event.name === 'end');
      const stopped = seconds();
      clockOffset += 5000;
      window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true}));
      assert(abandon.length === 5 && abandon.at(-1).args[1] === 5 && abandon.at(-1).args[2] === 'abandoned' &&
        balance() === beforeAbandon + 5 && el('ol-result').hidden && !stage.classList.contains('ol-expanded') &&
        seconds() === stopped, 'Exiting fullscreen between stages ends once, stops the clock and retains the earned reward');
      click('ol-full');
      await wait();
      document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
      assert(el('ol-playfield').hidden && !stage.classList.contains('ol-expanded') &&
        events.filter(event => event.name === 'end').length === 6, 'Escape leaves fullscreen and ends the active round once');
      click('ol-full');
      await wait();
      window.dispatchEvent(new PageTransitionEvent('pagehide', {persisted: false}));
      window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: false}));
      assert(el('ol-playfield').hidden && events.filter(event => event.name === 'end').length === 7,
        'Non-BFCache pagehide still ends the active round once');
    }
    assert(!errors.length, 'No browser runtime errors: ' + errors.join(', '));
    assert(document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      'Game layout has no horizontal overflow before the test report');
    document.body.dataset.testStatus = 'PASS';
  } catch (error) {
    results.push(error.stack);
    document.body.dataset.testStatus = 'FAIL';
  }
  const log = document.createElement('pre');
  log.id = 'test-results';
  log.dataset.i18nIgnore = '';
  log.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%;overflow:hidden';
  log.textContent = JSON.stringify(results);
  document.body.appendChild(log);
})();
