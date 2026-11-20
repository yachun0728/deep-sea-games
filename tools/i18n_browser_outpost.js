(async function () {
  const results = [];
  const get = id => document.getElementById(id);
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const assert = (value, message) => {
    if (!value) throw new Error(message);
    results.push(message);
  };
  const until = async predicate => {
    for (let i = 0; i < 100; i++) {
      if (predicate()) return;
      await wait(25);
    }
    throw new Error('Timed out waiting for Outpost');
  };
  try {
    const view = get('view-outpost'), start = get('outpost-start');
    const cells = [...view.querySelectorAll('.outpost-lane button')];
    const board = get('outpost-board');
    const boardWidth = () => board.getBoundingClientRect().width;
    const i18n = window.deepSeaI18n;
    const probe = new URLSearchParams(location.search).get('probe');
    const text = id => get(id).textContent;
    assert(!view.hidden && cells.length === 15, 'Direct hash opens the three-lane board');
    if (probe === 'saved') {
      assert(start.textContent === 'Start defense' && get('outpost-guide').hidden,
        'Reload remembers English and the completed tutorial');
      assert(!get('outpost-stage').options[2].disabled, 'Reload restores the unlocked stages');
      localStorage.removeItem('deep-sea-outpost-guide-v1');
    } else if (probe === 'chinese') {
      assert(start.textContent === '開始防守' && !get('outpost-guide').hidden, 'Chinese direct hash shows the tutorial');
      get('outpost-guide-skip').click();
      assert(get('outpost-guide').hidden && localStorage.getItem('deep-sea-outpost-guide-v1') === '1',
        'Skip is available before playing and its choice is saved');
    } else {
      assert(start.textContent === 'Start defense' && document.title === 'Deep Sea Outpost',
        'English title and start control');
      assert(cells.every(button => button.getBoundingClientRect().width >= 44), 'All build pads are at least 44 CSS pixels wide');
      assert(view.scrollWidth <= view.clientWidth, 'The active game does not overflow horizontally');
      const gameIds = [...document.querySelectorAll('.game-picker .tabs a[id^="tab-"]')]
        .map(tab => tab.hash.slice(1)).filter(id => id !== 'lobby' && id !== 'wardrobe');
      assert(gameIds.every(id => {
        const game = get('view-' + id);
        return game?.querySelector('a[href="#lobby"], #bl-exit') && !game.querySelector('.game-view-controls button');
      }), 'Every game has a lobby exit and the shared fullscreen button is gone');
      const initialWidth = boardWidth();
      const exit = view.querySelector('.game-exit-link');
      assert(getComputedStyle(document.querySelector('.game-toolbar')).display === 'none' &&
          !view.querySelector('.game-view-controls') &&
          exit.getBoundingClientRect().height >= 44 && !/[\u3400-\u9fff]/.test(exit.textContent),
        'Outpost shows only a compact translated exit with a touch-sized hit area');
      const guide = get('outpost-guide');
      const tools = view.querySelector('.outpost-tools');
      assert(guide.getBoundingClientRect().bottom <= board.getBoundingClientRect().top,
        'Tutorial instruction is above the board');
      assert(tools.getBoundingClientRect().top - board.getBoundingClientRect().bottom <= 8,
        'Equipment palette is directly beneath the board');
      assert(getComputedStyle(document.documentElement).scrollbarGutter === 'stable',
        'The normal game view reserves scrollbar space');
      const fetch = window.fetch;
      window.fetch = function (url, ...rest) {
        if (new URL(url, location.href).port === '8787') return Promise.reject(new TypeError('Test offline'));
        return fetch.call(this, url, ...rest);
      };
      document.hasFocus = () => true;
      let clock = 0, nextFrame;
      window.__outpostClock = {
        request(callback) { nextFrame = callback; return ++clock; },
        cancel() { nextFrame = null; },
        advance(frames) {
          for (let i = 0; i < frames && nextFrame; i++) {
            const callback = nextFrame;
            nextFrame = null;
            callback(clock * 100);
          }
        },
      };
      const events = [];
      const analytics = window.deepSeaAnalytics;
      for (const event of ['start', 'progress', 'resume', 'end']) {
        const original = analytics[event];
        analytics[event] = function (...args) {
          events.push([event, ...args]);
          return original.apply(this, args);
        };
      }
      start.click();
      start.click();
      await until(() => start.textContent === 'Pause defense');
      assert(text('outpost-rank-status') === 'This round can be played locally.', 'Offline leaderboard falls back to a playable round');
      const device = n => view.querySelector('[data-device="' + n + '"]');
      assert(device(0).dataset.guide === 'true' && cells[6].disabled, 'Tutorial highlights the cannon selector first');
      window.__outpostClock.advance(41);
      assert(text('outpost-time') === '03:00', 'Tutorial holds the clock during deployment');
      device(0).click();
      assert(cells[6].dataset.guide === 'true' && cells[0].disabled, 'Only the guided cannon pad is enabled');
      cells[6].click();
      device(3).click();
      assert(cells[4].dataset.guide === 'true', 'Tutorial highlights the top right gate pad');
      assert(boardWidth() === initialWidth, 'Showing the gate direction controls keeps the board width');
      cells[4].click();
      window.__outpostClock.advance(100);
      await until(() => text('outpost-guide-text').startsWith('Tap the lit gate'));
      assert(cells[4].dataset.ready === 'true' && cells[4].dataset.guide === 'true', 'Tutorial waits for the gate to be usable');
      assert(!get('outpost-current').hidden, 'Tutorial previews the direction of the current');
      const gateTime = text('outpost-time');
      window.__outpostClock.advance(25);
      assert(text('outpost-time') === gateTime, 'The first enemy waits at the gate until the player taps');
      i18n.setLanguage('zh-Hant');
      assert(text('outpost-guide-text').startsWith('現在點上路亮起的閘門'), 'Live Chinese switch keeps the tutorial step');
      i18n.setLanguage('en');
      cells[4].click();
      await until(() => text('outpost-message').startsWith('Enemies diverted!'));
      const enemy = view.querySelector('.outpost-enemy[data-diverted="true"]');
      assert(get('outpost-guide').hidden && cells[4].textContent.startsWith('↓8') &&
          enemy?.getAnimations().length > 0, 'First pulse animates the lane change and ends the tutorial');
      window.__outpostClock.advance(30);
      assert(view.querySelector('.outpost-attack[data-type="0"]'), 'The cannon draws a visible attack effect');
      assert(getComputedStyle(cells[6]).backgroundImage.includes('cannon.png') &&
          getComputedStyle(enemy).backgroundImage.includes('coral-fish.png'),
        'Placed cannon and live enemy show their sprites');
      view.querySelector('[data-direction="-1"]').click();
      cells[14].click();
      assert(cells[14].textContent === '↑' && cells[4].textContent.startsWith('↓') &&
          getComputedStyle(view.querySelector('[data-device="3"] b'), '::after').content.includes('↑'),
        'The gate card previews up and placed gates retain their own direction');
      const assets = ['cannon', 'sonar', 'coil', 'gate', 'coral-fish', 'needlefish', 'armored-crab'];
      await Promise.all(assets.map(name => {
        const image = new Image();
        image.src = './games/outpost/assets/' + name + '.png';
        return image.decode();
      }));
      assert(true, 'All seven transparent PNG assets load');
      assert(boardWidth() === initialWidth && view.scrollWidth <= view.clientWidth,
        'Diverting, firing and closing the tutorial preserve the board width');
      i18n.setLanguage('en');
      window.dispatchEvent(new Event('blur'));
      await until(() => start.textContent === 'Resume defense');
      const pausedTime = text('outpost-time');
      window.__outpostClock.advance(20);
      assert(text('outpost-time') === pausedTime, 'Window blur pauses the game clock');
      start.click();
      window.__outpostClock.advance(2);
      view.querySelector('a[href="#lobby"]').click();
      await until(() => view.hidden);
      const card = document.querySelector('.game-card[href="#outpost"]');
      assert(card.querySelector('h3').textContent === 'Deep Sea Outpost', 'The lobby card appears in English');
      card.click();
      await until(() => !view.hidden && start.textContent === 'Resume defense');
      assert(events.filter(([event]) => event === 'start').length === 1, 'Returning from the lobby preserves the round');
      assert(!view.classList.contains('game-view-expanded'), 'The lobby card opens Outpost without fullscreen');
      start.click();
      window.__outpostClock.advance(1801);
      await until(() => start.textContent === 'Defend again');
      const ends = events.filter(([event]) => event === 'end');
      assert(ends.length === 1 && ends[0][3] === 'loss' && text('outpost-message') === 'Station overrun.',
        'The defeat screen is translated and settles only once');
      assert(events.filter(([event]) => event === 'resume').length === 2, 'Each manual resume is tracked once');
      assert(!/[\u3400-\u9fff]/.test(view.innerText), 'Visible Outpost controls and results are translated');

      const picker = get('outpost-stage'), next = get('outpost-next');
      assert(picker.options[1].disabled && picker.options[2].disabled, 'A loss leaves later stages locked');
      const plan = [36, 28, 87, 43, 32, 62, 12, 72, 50, 7];
      const costs = [40,25,35,30];
      async function defend(stage) {
        start.click();
        await until(() => start.textContent === 'Pause defense');
        let i = 0;
        for (let frame = 0; frame <= 1810 && picker.disabled; frame++) {
          const energy = Number(text('outpost-energy'));
          if (i < plan.length) {
            const code = plan[i], cell = Math.floor(code / 6), action = code % 6, type = Math.min(action, 3);
            if (energy >= costs[type]) {
              device(type).click();
              if (type === 3) view.querySelector('[data-direction="' + (action === 3 ? -1 : 1) + '"]').click();
              cells[cell].click();
              i++;
            }
          }
          for (const gate of [4,14]) if (cells[gate].dataset.ready === 'true') cells[gate].click();
          if (stage > 1 && frame % 10 === 0) {
            for (const cell of [6,8,5,1,11]) {
              if (cells[cell].dataset.upgradeReady === 'true') cells[cell].click();
            }
          }
          window.__outpostClock.advance(1);
        }
        await until(() => start.textContent === 'Defend again');
        assert(Number(text('outpost-hull').split('/')[0]) > 0 && text('outpost-time') === '00:00',
          'Stage ' + stage + ' can be cleared with normal tower, gate and upgrade controls');
      }
      await defend(1);
      assert(!picker.options[1].disabled && picker.options[2].disabled && !next.hidden,
        'Stage 1 clear unlocks stage 2 and offers Next stage');
      next.click();
      assert(picker.value === '2' && text('outpost-energy') === '125' && get('outpost-rank').hidden,
        'Stage 2 starts fresh with its own energy and local progress');
      await defend(2);
      assert(cells.some(cell => cell.dataset.upgraded === 'true') && !picker.options[2].disabled,
        'Stage 2 supplies upgrades and unlocks stage 3');
      next.click();
      await defend(3);
      assert(picker.options.length === 30 && picker.options[29].textContent === 'Stage 30 · Deep Sea Watch',
        'The stage picker lists all 30 translated stages');
      assert(!next.hidden && !picker.options[3].disabled && picker.options[4].disabled &&
          localStorage.getItem('deep-sea-outpost-unlocked-v1') === '4',
        'Stage 3 clear unlocks stage 4 and offers Next stage');
    }
  } catch (error) {
    results.push(error.stack);
    document.body.dataset.testStatus = 'FAIL';
  }
  const report = document.createElement('script');
  report.type = 'application/json';
  report.id = 'test-results';
  report.textContent = JSON.stringify(results);
  document.body.append(report);
  document.body.dataset.testStatus ||= 'PASS';
})();
