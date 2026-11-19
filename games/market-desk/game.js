  var marketDeskRoute;
  (function () {
    {{include:games/market-desk/cases.js}}
    const bestKey = 'deep-sea-market-desk-best';
    const view = $('view-market-desk');
    const labels = ['刊登已核實資訊', '暫緩，等待佐證', '示警，提醒讀者'];
    const endings = [
      ['提早收工', '查證桌熄燈了。隔壁早餐店還在聊外星訂單，你決定先補個眠。'],
      ['台股查證王牌', '你的報告上了財經週刊封面。早餐店阿姨把刊登更正的那一期貼在菜單旁。'],
      ['可靠的市場編輯', '讀者把你的報告存在收藏夾。下次群組再傳明牌，他們會先來問你要來源。'],
      ['還在磨筆的菜鳥', '報告趕上截稿，但編輯貼了整排便條紙。字最多的一張只寫了兩個字：來源？'],
    ];
    let best = 0;
    try {
      const saved = Number(localStorage.getItem(bestKey));
      if (Number.isInteger(saved) && saved >= 0 && saved <= 100) best = saved;
    } catch (_) {}
    let deck = [], answers = [], score = 0, focus = 100, round = null;
    let phase = 'intro';
    let focusLoss = 0, settleTimer = null, outcome = '';
    const openingIndex = 1000;
    const openingTape = [937, 956, 944, 973, 991, 975, 984, 962, 979, 993, 981, 1008, 996, 1003, openingIndex];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let closes = [], market = openingIndex, marketMove = 0, streak = 0, soundEnabled = false, audio;
    const exchange = $('mk-exchange');
    const chart = $('mk-chart');
    const formatter = new Intl.NumberFormat('en-US');
    const character = $('mk-character');
    const portrait = $('mk-portrait');
    let portraitsPreloaded = false;
    const lifeStages = [
      { min: 1230, id: 'penthouse', title: '頂樓辦公室', story: '阿澤穿上白色訂製禮服，站在大理石桌前。整座台北都在腳下亮了起來。' },
      { min: 1090, id: 'rising', title: '辦公室升級', story: '皺襯衫已經送洗，阿澤今天在能看見夕陽的窗邊收盤。' },
      { min: 960, id: 'starter', title: '辭職第一天', story: '租來的小辦公桌，一杯咖啡，還有二十天證明自己。' },
      { min: 860, id: 'strained', title: '月底吃泡麵', story: '阿澤鬆開領帶。桌上的咖啡換成了泡麵，帳單還沒拆。' },
      { min: -Infinity, id: 'crisis', title: '快撐不下去', story: '辦公室退租了。阿澤用紙箱當桌子，筆電是房裡唯一的光。' }
    ];

    function lifeAt(index) {
      return lifeStages.find(function (life) { return index >= life.min; });
    }
    function portraitPath(stage) {
      return 'games/market-desk/art/' + stage.id + '.webp';
    }
    function paintCharacter() {
      const stage = lifeAt(closes.at(-1) ?? openingIndex);
      character.dataset.life = stage.id;
      const path = portraitPath(stage);
      if (portrait.getAttribute('src') !== path) portrait.src = path;
      const title = local(stage.title);
      const story = local(stage.story);
      if ($('mk-life-title').textContent !== title) $('mk-life-title').textContent = title;
      if ($('mk-life-story').textContent !== story) $('mk-life-story').textContent = story;
      const shift = character.dataset.shift;
      const badge = $('mk-life-shift');
      badge.hidden = !shift;
      if (shift) {
        badge.dataset.shift = shift;
        badge.textContent = local(shift === 'up' ? '處境升級：{0}' : '處境下滑：{0}', title);
      }
    }


    function playBell(correct) {
      if (!soundEnabled || !audio || audio.state !== 'running' || document.hidden) return;
      const notes = correct ? [660, 880, 1175] : [196, 138];
      notes.forEach(function (pitch, index) {
        const time = audio.currentTime + index * 0.075;
        const tone = audio.createOscillator();
        const volume = audio.createGain();
        tone.type = correct ? 'sine' : 'triangle';
        tone.frequency.value = pitch;
        volume.gain.setValueAtTime(0.001, time);
        volume.gain.exponentialRampToValueAtTime(0.066, time + 0.018);
        volume.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
        tone.connect(volume).connect(audio.destination);
        tone.start(time);
        tone.stop(time + 0.17);
      });
    }

    function signedPercent(value) {
      return (value > 0 ? '+' : value < 0 ? '−' : '') + Math.abs(value).toFixed(2) + '%';
    }
    function paintChart() {
      const graph = [...openingTape, ...closes].slice(-20);
      const ceiling = Math.ceil((Math.max(...graph) + 12) / 20) * 20;
      const floor = Math.floor((Math.min(...graph) - 12) / 20) * 20;
      const range = ceiling - floor;
      $('mk-axis').replaceChildren(...[ceiling, Math.round((ceiling + floor) / 2), floor].map(function (value) {
        const tick = document.createElement('span');
        tick.textContent = formatter.format(value);
        return tick;
      }));
      const percent = value => 100 * (value - floor) / range;
      chart.replaceChildren(...graph.slice(1).map(function (close, index) {
        const open = graph[index];
        const candle = document.createElement('span');
        candle.className = 'market-candle ' + (close >= open ? 'market-up' : 'market-down');
        candle.style.setProperty('--low', percent(Math.min(close, open) - 9) + '%');
        candle.style.setProperty('--wick', (100 * (Math.abs(close - open) + 18) / range) + '%');
        candle.style.setProperty('--body-low', percent(Math.min(close, open)) + '%');
        candle.style.setProperty('--body', (100 * Math.abs(close - open) / range) + '%');
        return candle;
      }));
      const close = closes.at(-1) ?? openingIndex;
      const previous = closes.at(-2) ?? openingIndex;
      const delta = close - previous;
      const sign = delta >= 0 ? '+' : '−';
      exchange.dataset.move = !delta ? '' : delta > 0 ? 'up' : 'down';
      $('mk-index').textContent = formatter.format(close);
      const change = signedPercent(100 * delta / previous);
      $('mk-change').textContent = !delta ? '—' : `${delta > 0 ? '▲' : '▼'} ${sign}${Math.abs(delta)} (${change})`;
      $('mk-result-move').textContent = change;
      $('mk-market-index').textContent = formatter.format(market);
      const marketLabel = $('mk-market-change');
      marketLabel.textContent = closes.length ? signedPercent(marketMove) : '—';
      marketLabel.dataset.move = !marketMove ? '' : marketMove > 0 ? 'up' : 'down';
    }


    function local(text, ...values) {
      return window.deepSeaI18n.text(text).replace(/\{(\d+)\}/g, function (_, index) { return values[index]; });
    }
    function params() {
      return { stage: 1, step: answers.length, score: score };
    }
    function render() {
      paintCharacter();
      const reviewing = phase === 'review';
      const settling = phase === 'settling';
      const finished = phase === 'finish';
      $('mk-intro').hidden = phase !== 'intro';
      $('mk-case').hidden = phase === 'intro' || finished;
      $('mk-finish').hidden = !finished;
      $('mk-actions').hidden = reviewing || settling;
      $('mk-settling').hidden = !settling;
      exchange.classList.toggle('market-matching', settling);
      $('mk-review').hidden = !reviewing;
      const day = Math.min(cases.length, answers.length + (reviewing || finished ? 0 : 1));
      $('mk-day').textContent = phase === 'intro' ? local('20 個交易日') :
        local('第 {0} / {1} 天', day, cases.length);
      $('mk-score').textContent = score;
      $('mk-focus').textContent = focus;
      $('mk-risk-meter').value = focus;
      $('mk-risk').classList.toggle('market-risk-low', focus <= 36);
      $('mk-risk-warning').hidden = focus === 0 || focus > 18;
      $('mk-best').textContent = best;
      $('mk-tape').setAttribute('aria-label', local('答對 {0} 題，共完成 {1} 天', score / 5, answers.length));
      Array.from($('mk-tape').children).forEach(function (bar, index) {
        bar.className = index >= answers.length ? '' : answers[index] ? 'market-pass' : 'market-miss';
      });
      if (phase === 'case' || reviewing) {
        const event = deck[day - 1];
        const [headline, clue, explanation, bestAction] = event;
        $('mk-headline').textContent = local(headline);
        $('mk-clue').textContent = local(clue);
        if (reviewing) {
          const correct = answers[day - 1];
          const action = local(labels[bestAction]);
          const verdict = {
            missed: '大盤急漲・阿澤少跟到',
            flat: '信心持平・刊登慢半拍',
            lost: '信心回落・查證失誤'
          };
          $('mk-verdict').textContent = focus === 0 ? local('警報・專注力耗盡') : correct ?
            (streak >= 2 ? local('信心連升・連對 {0} 天', streak) : local('信心上揚・判斷正確')) :
            local(verdict[outcome]);
          const change = $('mk-result-move').textContent;
          $('mk-market-recap').textContent = outcome === 'missed' ?
            local('阿澤信心小升 {0}，大盤卻漲了 {1}。', change, signedPercent(marketMove)) :
            local('阿澤信心 {0} ／ 虛構大盤 {1}', change, signedPercent(marketMove));
          $('mk-feedback').textContent = correct ?
            local('判斷正確。加 5 分。 {0}', local(explanation)) :
            outcome === 'missed' || outcome === 'flat' ?
              local('暫緩讓報導錯過時機，專注力扣 {0}。{1}', focusLoss, local(explanation)) :
              local('答錯，專注力扣 {0}。建議「{1}」。{2}', focusLoss, action, local(explanation));
          $('mk-next').textContent = focus === 0 || day === cases.length ?
            local('查看結局') : local('下一個交易日');
        }
      }
      if (finished) {
        const close = closes.at(-1);
        const lagged = focus > 0 && close >= openingIndex && close < market;
        const [title, epilogue] = lagged ?
          ['牛市裡的慢半拍', '阿澤的報告有起色。同業都在慶祝搬進新辦公室，他卻把慶功晚餐換成了便利商店便當。'] :
          endings[focus === 0 ? 0 : score >= 90 ? 1 : score >= 70 ? 2 : 3];
        $('mk-ending').textContent = local(title);
        $('mk-epilogue').textContent = local(epilogue);
        $('mk-result').textContent = local(
          '你完成了 {0} 天的查證，答對 {1} 題，報告分數 {2} / 100。',
          answers.length, score / 5, score);
        $('mk-final-market').textContent = local('累計表現：阿澤信心 {0} ／ 虛構大盤 {1}',
          signedPercent(100 * (close / openingIndex - 1)), signedPercent(100 * (market / openingIndex - 1)));
      }
    }
    function start() {
      if (round !== null || (phase !== 'intro' && phase !== 'finish') || view.hidden) return;
      deck = cases.slice();
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      answers = [];
      closes = [];
      market = openingIndex;
      marketMove = 0;
      streak = 0;
      paintChart();
      score = 0;
      focus = 100;
      phase = 'case';
      round = AN.start('market-desk', 0, params());
      render();
      $('mk-headline').focus();
    }
    function choose(action) {
      if (phase !== 'case' || view.hidden) return;
      phase = 'settling';
      render();
      if (reduceMotion.matches) {
        reveal(action);
      } else {
        $('mk-settling').focus({preventScroll: true});
        settleTimer = setTimeout(function () { reveal(action); }, 480);
      }
    }
    function reveal(action) {
      settleTimer = null;
      if (phase !== 'settling' || view.hidden) return;
      const [, , , bestAction, dailyMarketMove] = deck[answers.length];
      const correct = action === bestAction;
      const latePublish = bestAction === 0 && action === 1;
      marketMove = dailyMarketMove;
      market *= 1 + marketMove / 100;
      outcome = correct ? 'correct' : latePublish ? (marketMove > 0 ? 'missed' : 'flat') : 'lost';
      answers.push(correct);
      if (correct) score += 5;
      focusLoss = correct ? 0 : Math.min(18, focus);
      focus = Math.min(100, focus + (correct ? 4 : -focusLoss));
      streak = correct ? streak + 1 : 0;
      const previous = closes.at(-1) ?? openingIndex;
      // Today's fictional benchmark belongs to the case. Only A-Ze's confidence reacts to the choice.
      const delta = correct ? 24 + Math.min(streak - 1, 4) * 7 : latePublish ? (marketMove > 0 ? 8 : 0) : -47;
      closes.push(previous + delta);
      paintChart();
      if (lifeAt(previous).id !== lifeAt(closes.at(-1)).id) {
        character.dataset.shift = delta > 0 ? 'up' : 'down';
      }
      phase = 'review';
      exchange.classList.add('market-settled');
      $('mk-reveal').dataset.move = delta < 0 ? 'down' : correct ? 'up' : 'mixed';
      playBell(correct);
      AN.progress(round, params(), false);
      render();
      $('mk-next').focus({preventScroll: true});
    }
    function next() {
      if (phase !== 'review' || view.hidden) return;
      exchange.classList.remove('market-settled');
      delete character.dataset.shift;
      if (focus === 0 || answers.length === cases.length) {
        phase = 'finish';
        if (score > best) {
          best = score;
          try { localStorage.setItem(bestKey, String(best)); } catch (_) {}
        }
        AN.end(round, 0, focus === 0 ? 'lose' : 'win', params());
        round = null;
      } else {
        phase = 'case';
      }
      render();
      $(phase === 'finish' ? 'mk-ending' : 'mk-headline').focus();
    }

    marketDeskRoute = function (active) {
      if (active) {
        if (!portraitsPreloaded) {
          portraitsPreloaded = true;
          lifeStages.forEach(function (stage) {
            if (stage.id !== 'starter') new Image().src = portraitPath(stage);
          });
        }
        return;
      }
      if (round === null) return;
      clearTimeout(settleTimer);
      settleTimer = null;
      AN.end(round, 0, 'abandoned', params());
      round = null;
      phase = 'intro';
      exchange.classList.remove('market-settled');
      delete character.dataset.shift;
      answers = [];
      closes = [];
      market = openingIndex;
      marketMove = 0;
      streak = 0;
      paintChart();
      score = 0;
      focus = 100;
      render();
    };

    for (let i = 0; i < cases.length; i++) $('mk-tape').appendChild(document.createElement('span'));
    $('mk-go').addEventListener('click', start);
    $('mk-replay').addEventListener('click', start);
    $('mk-next').addEventListener('click', next);
    view.querySelectorAll('[data-market-action]').forEach(function (button) {
      button.addEventListener('click', function () { choose(Number(button.dataset.marketAction)); });
    });
    $('mk-sound').addEventListener('click', async function () {
      const button = this;
      button.disabled = true;
      try {
        if (!soundEnabled) {
          audio ??= new AudioContext();
          await audio.resume();
        }
        soundEnabled = !soundEnabled;
        button.setAttribute('aria-pressed', String(soundEnabled));
      } catch (_) {
        soundEnabled = false;
        button.setAttribute('aria-pressed', 'false');
      } finally {
        button.disabled = false;
      }
    });
    paintChart();
    window.addEventListener('arcade-languagechange', render);
    render();
  })();
