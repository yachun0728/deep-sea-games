(async function () {
  const results = [];
  const get = id => document.getElementById(id);
  const text = id => get(id).textContent;
  const wait = () => new Promise(resolve => setTimeout(resolve, 80));
  const i18n = window.deepSeaI18n;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  async function waitForClose() {
    for (let attempt = 0; get('mk-review').hidden && attempt < 16; attempt++) await wait();
    if (get('mk-review').hidden) throw new Error('The close did not reveal a result');
  }
  function assert(ok, message) {
    if (!ok) throw new Error(message);
    results.push(message);
  }
  try {
    await wait();
    const view = get('view-market-desk');
    if (new URLSearchParams(location.search).get('probe') === 'saved') {
      assert(!view.hidden && text('mk-go') === 'Start day one' && text('mk-best') === '100',
        'Reloaded direct hash restores the language and record');
    } else if (new URLSearchParams(location.search).get('probe') === 'chinese') {
      assert(!view.hidden && text('mk-go') === '開始第一天' && text('mk-best') === '100',
        'Chinese direct hash opens with the saved record');
    } else {
      const card = document.querySelector('.game-card[href="#market-desk"]');
      assert(!view.hidden && text('mk-go') === 'Start day one', 'English direct hash opens Closing Call');
      i18n.setLanguage('zh-Hant');
      assert(text('mk-go') === '開始第一天', 'Direct hash also displays Chinese');
      const rounds = [];
      const analytics = window.deepSeaAnalytics;
      for (const event of ['start', 'progress', 'end']) {
        const original = analytics[event];
        analytics[event] = function (...args) {
          rounds.push([event, ...args]);
          return original.apply(this, args);
        };
      }
      const balance = text('balance');
      const character = get('mk-character');
      const portrait = get('mk-portrait');
      function awaitPortrait() {
        if (portrait.complete && portrait.naturalWidth) return Promise.resolve();
        return Promise.race([portrait.decode(), new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Character art did not load')), 2000);
        })]);
      }
      await awaitPortrait();
      assert(character.dataset.life === 'starter' && portrait.src.endsWith('/starter.webp'),
        'A-Ze starts at his original desk with its own artwork');
      const buttons = [...view.querySelectorAll('[data-market-action]')];
      const actions = [1, 2, 0, 1, 1, 2, 0, 1, 0, 0, 1, 2, 2, 0, 1, 0, 0, 2, 0, 2];
      function start(id) {
        const random = Math.random;
        Math.random = () => 0.999999;
        try {
          get(id).click();
          get(id).click();
        } finally {
          Math.random = random;
        }
      }
      start('mk-go');
      assert(text('mk-headline') === '早餐店的外星訂單', 'Chinese case renders after start');
      i18n.setLanguage('en');
      assert(text('mk-headline') === 'An alien order with breakfast' && rounds.length === 1,
        'Live language switch preserves the original case and round');
      assert(text('mk-index') === '1,000' && get('mk-sound').getAttribute('aria-pressed') === 'false',
        'Market opens at 1,000 and sound is off by default');
      for (const [index, action] of actions.entries()) {
        buttons[action].click();
        buttons[action].click();
        if (index === 0 && !reducedMotion) {
          assert(!get('mk-settling').hidden && get('mk-review').hidden && text('mk-index') === '1,000',
            'Closing orders are shown before any result or price change');
          i18n.setLanguage('zh-Hant');
          assert(text('mk-settling') === '收盤撮合中', 'Switching language during the close preserves the pending answer');
          i18n.setLanguage('en');
        }
        if (index === 0 && reducedMotion) {
          assert(get('mk-settling').hidden && !get('mk-review').hidden, 'Reduced motion reveals immediately');
        }
        await waitForClose();
        assert(text('mk-feedback').startsWith('Correct.') && Number(text('mk-score')) === (index + 1) * 5,
          'Day ' + (index + 1) + ' grades once and displays an English explanation');
        if (index === 0) {
          assert(text('mk-index') === '1,024' && text('mk-change') === '▲ +24 (+2.40%)' &&
            get('mk-chart').lastElementChild.classList.contains('market-up') &&
            text('mk-verdict') === 'Confidence rises · Correct call', 'First correct call plots a red candle and surge verdict');
          i18n.setLanguage('zh-Hant');
          assert(text('mk-verdict') === '信心上揚・判斷正確' && text('mk-index') === '1,024',
            'The verdict translates without replaying the market move');
          i18n.setLanguage('en');
        } else if (index === 1) {
          assert(text('mk-verdict') === 'Confidence streak · 2 correct in a row' && text('mk-index') === '1,055',
            'Second correct call reveals a streak and larger rise');
        }
        if (index === 2) {
          await awaitPortrait();
          assert(character.dataset.life === 'rising' && text('mk-life-title') === 'Office upgrade' &&
            portrait.src.endsWith('/rising.webp') && character.dataset.shift === 'up' &&
            text('mk-life-shift') === 'Life upgrade: Office upgrade',
            'Three correct calls change the artwork and mark an upgrade');
          assert((getComputedStyle(character, '::after').animationName !== 'none') === !reducedMotion,
            'Scene transition respects the reduced-motion setting');
        } else if (index === 5) {
          await awaitPortrait();
          assert(character.dataset.life === 'penthouse' && text('mk-life-title') === 'Top-floor office' &&
            portrait.src.endsWith('/penthouse.webp') && character.dataset.shift === 'up',
            'The penthouse has its own portrait and upgrade transition');
          i18n.setLanguage('zh-Hant');
          assert(text('mk-life-title') === '頂樓辦公室' && character.dataset.life === 'penthouse',
            'Character scenes translate without resetting progress');
          i18n.setLanguage('en');
        }
        get('mk-next').click();
      }
      assert(text('mk-ending') === 'Closing Call Ace' && localStorage.getItem('deep-sea-market-desk-best') === '100',
        'Perfect report shows the top ending and saves the record');
      const finale = get('mk-finish');
      const replayButton = get('mk-replay');
      assert(finale.dataset.result === 'triumph' && get('mk-status').hidden && get('mk-layout').hidden &&
        text('mk-ending-status') === 'Day 20 · Final close' && text('mk-replay') === 'Next run' &&
        replayButton.getBoundingClientRect().bottom <= get('mk-ending').getBoundingClientRect().top,
        'A big finish replaces the game desk and puts Next run above the ending');
      assert(rounds.filter(event => event[0] === 'progress').length === 20 &&
        rounds.filter(event => event[0] === 'end').length === 1 && rounds.at(-1)[3] === 'win', 'A completed run tracks one end');
      i18n.setLanguage('zh-Hant');
      assert(text('mk-ending') === '台股查證王牌' && text('mk-replay') === '下一輪' && text('mk-result').includes('100 / 100'), 'Completed result translates to Chinese');
      i18n.setLanguage('en');
      start('mk-replay');
      assert(finale.hidden && text('mk-day') === 'Day 1 / 20' && text('mk-score') === '0' &&
        text('mk-index') === '1,000' && character.dataset.life === 'starter' && !character.dataset.shift,
        'Replay resets both the index and the character scene');
      for (const [index, answer] of actions.slice(0, 6).entries()) {
        buttons[answer === 0 ? 2 : (answer + 1) % buttons.length].click();
        await waitForClose();
        if (index === 0) {
          assert(text('mk-index') === '953' && text('mk-change') === '▼ −47 (−4.70%)' &&
            get('mk-chart').lastElementChild.classList.contains('market-down') &&
            text('mk-verdict') === 'Confidence slips · Wrong call', 'A wrong call plots a green candle and plunge verdict');
          await awaitPortrait();
          assert(character.dataset.life === 'strained' && portrait.src.endsWith('/strained.webp') &&
            character.dataset.shift === 'down' && text('mk-life-shift') === 'Setback: Instant noodles until payday',
            'A loss swaps in the worn-down character art and marks a setback');
        } else if (index === 2) {
          await awaitPortrait();
          assert(character.dataset.life === 'crisis' && text('mk-life-title') === 'Running on empty' &&
            portrait.src.endsWith('/crisis.webp') && character.dataset.shift === 'down',
            'Further losses load a distinct crisis illustration and mark a second setback');
        } else if (index === 4) {
          assert(!get('mk-risk-warning').hidden && get('mk-risk-meter').value === 10,
            'Near elimination, the focus meter displays a one-miss warning');
        } else if (index === 5) {
          assert(text('mk-verdict') === 'Alert · Focus depleted', 'The final miss shows a focus alert');
        }
        get('mk-next').click();
      }
      assert(text('mk-ending') === 'The Desk Goes Dark' && finale.dataset.result === 'exhausted' &&
        text('mk-ending-status') === 'Day 6 · Run ended early' && text('mk-focus') === '0' && rounds.at(-1)[3] === 'lose',
        'Six errors exhaust focus and end the run');
      if (reducedMotion) {
        start('mk-replay');
        const misses = new Map([[0, 0], [4, 0], [9, 1], [12, 0], [16, 1], [19, 0]]);
        for (const [index, correctAction] of actions.entries()) {
          buttons[misses.get(index) ?? correctAction].click();
          await waitForClose();
          if (index === 9) {
            assert(text('mk-result-move') === '0.00%' && text('mk-market-change') === '−2.70%' &&
              text('mk-verdict') === 'Confidence flat · Late to publish', 'Holding verified news can leave confidence flat');
          } else if (index === 16) {
            assert(text('mk-headline') === 'A bubble tea safety scare' && text('mk-result-move').startsWith('+') &&
              text('mk-market-change') === '+6.10%' && text('mk-verdict') === 'Market rally · A-Ze missed most of it' &&
              text('mk-feedback').startsWith('Holding the story missed the moment'),
              'Holding the verified recall misses most of a rally without a confidence loss');
            i18n.setLanguage('zh-Hant');
            assert(text('mk-verdict') === '大盤急漲・阿澤少跟到' && text('mk-market-recap').includes('+6.10%'),
              'The opportunity-cost outcome is translated');
            i18n.setLanguage('en');
          }
          get('mk-next').click();
        }
        assert(text('mk-ending') === 'Left behind in a bull market' &&
          text('mk-final-market').includes('Fictional market +43.59%') && text('mk-score') === '70',
          'The benchmark is independent of choices, and underperformance gets a distinct ending');
        const finalePaths = [
          {misses: [0, 1, 4, 7, 10, 13, 16], result: 'even', tag: 'Flat finish'},
          {misses: [0, 1, 4, 7, 10, 13, 16, 19], result: 'loss', tag: 'Finished down'},
          {misses: [0, 1, 2, 5], result: 'steady', tag: 'Steady finish'}
        ];
        for (const path of finalePaths) {
          start('mk-replay');
          for (const [index, action] of actions.entries()) {
            buttons[path.misses.includes(index) ? (action === 0 ? 2 : 0) : action].click();
            await waitForClose();
            get('mk-next').click();
          }
          assert(finale.dataset.result === path.result && text('mk-ending-tag') === path.tag &&
            text('mk-ending-status') === 'Day 20 · Final close', path.tag + ' receives a dedicated final scene');
        }
      }
      start('mk-replay');
      if (!reducedMotion) buttons[actions[0]].click();
      document.querySelector('.brand-home').click();
      await wait();
      const countAfterLeaving = rounds.length;
      if (!reducedMotion) {
        for (let attempt = 0; attempt < 7; attempt++) await wait();
      }
      assert(view.hidden && rounds.length === countAfterLeaving && rounds.at(-1)[3] === 'abandoned',
        'Leaving cancels any pending close and ends the round once');
      assert(card.getAttribute('aria-label').startsWith('Play Closing Call') &&
        !card.querySelector('.game-card-bonus'), 'Lobby card is translated and carries no bonus badge');
      assert(document.querySelector('.lobby-sidebar .side-logo img') &&
        document.querySelector('.lobby-grid > .game-card[href="#tetris"]') &&
        document.querySelector('.lobby-grid > .game-card[href="#mirror-twins"]'),
        'TICATICA sidebar and the current lobby games are present');
      assert(document.querySelector('.lobby-grid > .game-card') === card &&
        card.dataset.art === 'cover', 'TICATICA lists Closing Call first with its own cover');
      let nativeFullscreenCalls = 0;
      view.requestFullscreen = async function () { nativeFullscreenCalls++; };
      card.click();
      await wait();
      assert(!view.hidden && !get('mk-intro').hidden && text('mk-best') === '100' &&
        nativeFullscreenCalls === 0 && !view.classList.contains('game-view-expanded'),
        'Lobby card opens the game without triggering the fullscreen shell');
      assert(text('balance') === balance, 'Gameplay and route changes do not charge or pay points');
      assert(!/[\u3400-\u9fff]/.test(view.textContent), 'English view has no untranslated text');
      if (matchMedia('(max-width:880px)').matches) {
        assert(!view.querySelector('.game-view-controls') && !!view.querySelector('.game-exit-link'),
          'Phone shows a compact lobby exit');
        start('mk-go');
        const rects = buttons.map(button => button.getBoundingClientRect());
        const portraitViewport = matchMedia('(orientation: portrait)').matches;
        assert((portraitViewport ? innerWidth === 390 : innerWidth === 844) &&
          document.documentElement.scrollWidth <= innerWidth &&
          get('mk-life-title').getBoundingClientRect().bottom < get('mk-exchange').getBoundingClientRect().top &&
          get('mk-exchange').getBoundingClientRect().bottom <= get('mk-headline').getBoundingClientRect().top &&
          rects.every((rect, index) => rect.height >= 48 && rect.right <= innerWidth &&
            (!index || rect.top >= rects[index - 1].bottom)),
          'Phone keeps one column with vertically stacked touch targets across viewport orientations');
      }
    }
    document.body.dataset.testStatus = 'PASS';
  } catch (error) {
    document.body.dataset.testStatus = 'FAIL';
    results.push(error.stack);
  }
  const output = document.createElement('pre');
  output.id = 'test-results';
  output.setAttribute('data-i18n-ignore', '');
  output.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%';
  output.textContent = JSON.stringify(results);
  document.body.appendChild(output);
})();
