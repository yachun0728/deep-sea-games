  var marketDeskRoute;
  (function () {
    {{include:games/market-desk/cases.js}}
    const bestKey = 'deep-sea-market-desk-best';
    const view = $('view-market-desk');
    const labels = ['{{t:market-desk.msg.001}}', '{{t:market-desk.msg.002}}', '{{t:market-desk.msg.003}}'];
    const endings = {
      exhausted: ['{{t:market-desk.msg.004}}', '{{t:market-desk.msg.005}}', '{{t:market-desk.msg.006}}', 'crisis'],
      loss: ['{{t:market-desk.msg.007}}', '{{t:market-desk.msg.008}}', '{{t:market-desk.msg.009}}', 'strained'],
      even: ['{{t:market-desk.msg.010}}', '{{t:market-desk.msg.011}}', '{{t:market-desk.msg.012}}', 'starter'],
      lagged: ['{{t:market-desk.msg.013}}', '{{t:market-desk.msg.014}}', '{{t:market-desk.msg.015}}', 'starter'],
      triumph: ['{{t:market-desk.msg.016}}', '{{t:market-desk.msg.017}}', '{{t:market-desk.msg.018}}', 'penthouse'],
      steady: ['{{t:market-desk.msg.019}}', '{{t:market-desk.msg.020}}', '{{t:market-desk.msg.021}}', 'rising']
    };
    let best = 0;
    try {
      const saved = Number(localStorage.getItem(bestKey));
      if (Number.isInteger(saved) && saved >= 0 && saved <= 100) best = saved;
    } catch (_) {}
    let deck = [], answers = [], actions = [], score = 0, focus = 100, round = null;
    let phase = 'intro';
    let focusLoss = 0, settleTimer = null, outcome = '';
    const openingIndex = marketDeskRules.OPENING_INDEX;
    const openingTape = [937, 956, 944, 973, 991, 975, 984, 962, 979, 993, 981, 1008, 996, 1003, openingIndex];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let closes = [], market = openingIndex, marketMove = 0, streak = 0, soundEnabled = false, audio;
    const exchange = $('mk-exchange');
    const chart = $('mk-chart');
    const formatter = new Intl.NumberFormat('en-US');
    const rankDetails = $('mk-rank-board');
    let rankRound, nextRankRound, preparingRank, submission, rankStarting = false;
    let leaderboardRequest = 0;
    function money(amount) { return 'NT$' + formatter.format(amount); }
    function prepareRankedRound() {
      if (preparingRank || nextRankRound || location.protocol === 'file:') return preparingRank;
      preparingRank = import('./frontend/services/api.mjs')
        .then(api => api.startBoardRound('market-desk', AbortSignal.timeout(4000)))
        .then(ticket => { nextRankRound = ticket; })
        .catch(() => {})
        .finally(() => { preparingRank = null; });
      return preparingRank;
    }
    function renderRankStatus() {
      $('mk-rank-status').textContent = local(submission?.message ?? '{{t:market-desk.msg.022}}');
      $('mk-rank-retry').hidden = !submission?.retry;
    }
    async function sendRankedRound(entry) {
      if (!entry || entry.sending || entry.done) return;
      entry.sending = true;
      entry.retry = false;
      entry.message = '{{t:market-desk.msg.023}}';
      if (entry === submission) renderRankStatus();
      try {
        const api = await import('./frontend/services/api.mjs');
        const response = await api.moveBoardRound(entry.ticket.token, entry.move, AbortSignal.timeout(10000));
        entry.done = true;
        entry.message = response.state.score === entry.revenue ? '{{t:market-desk.msg.024}}' : '{{t:market-desk.msg.025}}';
        if (entry === submission && rankDetails.open) loadRankings();
      } catch (error) {
        entry.retry = error.retryable !== false;
        entry.done = !entry.retry;
        entry.message = '{{t:market-desk.msg.025}}';
      } finally {
        entry.sending = false;
        if (entry === submission) renderRankStatus();
      }
    }
    function submitRankedRound() {
      if (!rankRound) return;
      submission = {
        ticket: rankRound,
        move: {id: rankRound.id, gameId: 'market-desk', revision: rankRound.revision, action: actions.slice()},
        revenue: marketDeskRules.revenue(closes.at(-1))
      };
      sendRankedRound(submission);
    }
    async function loadRankings() {
      const request = ++leaderboardRequest;
      const status = $('mk-rank-board-status');
      const list = $('mk-rank-list');
      list.replaceChildren();
      status.textContent = '{{t:market-desk.msg.026}}';
      try {
        const api = await import('./frontend/services/api.mjs');
        const result = await api.createApiClient(api.arcadeApiOrigin()).leaderboard('market-desk', AbortSignal.timeout(5000));
        if (request !== leaderboardRequest) return;
        list.replaceChildren(...result.entries.map(entry => {
          const item = document.createElement('li');
          const name = document.createElement('span');
          name.textContent = entry.displayName || '{{t:market-desk.msg.027}}';
          if (entry.displayName) name.setAttribute('data-i18n-ignore', '');
          const amount = document.createElement('strong');
          amount.textContent = money(entry.score);
          item.append(name, amount);
          return item;
        }));
        status.textContent = result.entries.length ? '' : '{{t:market-desk.msg.028}}';
      } catch {
        if (request === leaderboardRequest) status.textContent = '{{t:market-desk.msg.029}}';
      }
    }
    const character = $('mk-character');
    const portrait = $('mk-portrait');
    let portraitsPreloaded = false;
    const lifeStages = [
      { min: 1230, id: 'penthouse', title: '{{t:market-desk.msg.030}}', story: '{{t:market-desk.msg.031}}' },
      { min: 1090, id: 'rising', title: '{{t:market-desk.msg.032}}', story: '{{t:market-desk.msg.033}}' },
      { min: 960, id: 'starter', title: '{{t:market-desk.msg.034}}', story: '{{t:market-desk.msg.035}}' },
      { min: 860, id: 'strained', title: '{{t:market-desk.msg.036}}', story: '{{t:market-desk.msg.037}}' },
      { min: -Infinity, id: 'crisis', title: '{{t:market-desk.msg.038}}', story: '{{t:market-desk.msg.039}}' }
    ];

    function lifeAt(index) {
      return lifeStages.find(function (life) { return index >= life.min; });
    }
    function portraitPath(id) {
      return 'games/market-desk/art/' + id + '.webp';
    }
    function paintCharacter() {
      const stage = lifeAt(closes.at(-1) ?? openingIndex);
      character.dataset.life = stage.id;
      const path = portraitPath(stage.id);
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
        badge.textContent = local(shift === 'up' ? '{{t:market-desk.msg.040}}' : '{{t:market-desk.msg.041}}', title);
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
      $('mk-status').hidden = finished;
      $('mk-layout').hidden = finished;
      $('mk-actions').hidden = reviewing || settling;
      $('mk-settling').hidden = !settling;
      exchange.classList.toggle('market-matching', settling);
      $('mk-review').hidden = !reviewing;
      const day = Math.min(cases.length, answers.length + (reviewing || finished ? 0 : 1));
      $('mk-day').textContent = phase === 'intro' ? local('{{t:market-desk.msg.042}}') :
        local('{{t:market-desk.msg.043}}', day, cases.length);
      $('mk-score').textContent = score;
      $('mk-focus').textContent = focus;
      $('mk-risk-meter').value = focus;
      $('mk-risk').classList.toggle('market-risk-low', focus <= 36);
      $('mk-risk-warning').hidden = focus === 0 || focus > 18;
      $('mk-best').textContent = best;
      $('mk-tape').setAttribute('aria-label', local('{{t:market-desk.msg.044}}', score / 5, answers.length));
      Array.from($('mk-tape').children).forEach(function (bar, index) {
        bar.className = index >= answers.length ? '' : answers[index] ? 'market-pass' : 'market-miss';
      });
      if (phase === 'case' || reviewing) {
        const caseId = deck[day - 1];
        const [headline, clue, explanation] = cases[caseId];
        const [bestAction] = marketDeskRules.cases[caseId];
        $('mk-headline').textContent = local(headline);
        $('mk-clue').textContent = local(clue);
        if (reviewing) {
          const correct = answers[day - 1];
          const action = local(labels[bestAction]);
          const verdict = {
            missed: '{{t:market-desk.msg.045}}',
            flat: '{{t:market-desk.msg.046}}',
            lost: '{{t:market-desk.msg.047}}'
          };
          $('mk-verdict').textContent = focus === 0 ? local('{{t:market-desk.msg.048}}') : correct ?
            (streak >= 2 ? local('{{t:market-desk.msg.049}}', streak) : local('{{t:market-desk.msg.050}}')) :
            local(verdict[outcome]);
          const change = $('mk-result-move').textContent;
          $('mk-market-recap').textContent = outcome === 'missed' ?
            local('{{t:market-desk.msg.051}}', change, signedPercent(marketMove)) :
            local('{{t:market-desk.msg.052}}', change, signedPercent(marketMove));
          $('mk-feedback').textContent = correct ?
            local('{{t:market-desk.msg.053}}', local(explanation)) :
            outcome === 'missed' || outcome === 'flat' ?
              local('{{t:market-desk.msg.054}}', focusLoss, local(explanation)) :
              local('{{t:market-desk.msg.055}}', focusLoss, action, local(explanation));
          $('mk-next').textContent = focus === 0 || day === cases.length ?
            local('{{t:market-desk.msg.056}}') : local('{{t:market-desk.msg.057}}');
        }
      }
      if (finished) renderFinale();
    }
    function renderFinale() {
      const close = closes.at(-1);
      const difference = close - openingIndex;
      const result = focus === 0 ? 'exhausted' :
        Math.abs(difference) <= 40 ? 'even' :
        difference < 0 ? 'loss' :
        close < market ? 'lagged' :
        close >= market + 100 ? 'triumph' : 'steady';
      const [tag, title, epilogue, art] = endings[result];
      $('mk-finish').dataset.result = result;
      $('mk-final-revenue').textContent = money(marketDeskRules.revenue(close));
      renderRankStatus();
      const image = $('mk-ending-art');
      const path = portraitPath(art);
      if (image.getAttribute('src') !== path) image.src = path;
      $('mk-ending-status').textContent = focus === 0 ?
        local('{{t:market-desk.msg.058}}', answers.length) : local('{{t:market-desk.msg.059}}');
      $('mk-ending-tag').textContent = local(tag);
      $('mk-ending').textContent = local(title);
      $('mk-epilogue').textContent = local(epilogue);
      $('mk-result').textContent = local(
        '{{t:market-desk.msg.060}}',
        answers.length, score / 5, score);
      $('mk-final-market').textContent = local('{{t:market-desk.msg.061}}',
        signedPercent(100 * difference / openingIndex), signedPercent(100 * (market / openingIndex - 1)));
    }
    async function start() {
      if (rankStarting || round !== null || (phase !== 'intro' && phase !== 'finish') || view.hidden) return;
      rankStarting = true;
      $('mk-go').disabled = true;
      $('mk-replay').disabled = true;
      await prepareRankedRound();
      rankStarting = false;
      $('mk-go').disabled = false;
      $('mk-replay').disabled = false;
      if (view.hidden) return;
      rankRound = nextRankRound;
      nextRankRound = null;
      prepareRankedRound();
      deck = marketDeskRules.deck(rankRound ? timedReplay.seeded(rankRound.state.seed) : Math.random);
      answers = [];
      actions = [];
      submission = null;
      rankDetails.open = false;
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
      const result = marketDeskRules.judge(deck[answers.length], action, focus, streak);
      const {correct, delta} = result;
      ({focus, streak, focusLoss, outcome, marketMove} = result);
      market *= 1 + marketMove / 100;
      answers.push(correct);
      actions.push(action);
      if (correct) score += 5;
      const previous = closes.at(-1) ?? openingIndex;
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
        submitRankedRound();
      } else {
        phase = 'case';
      }
      render();
      if (phase === 'finish') {
        $('mk-finish').scrollIntoView({block: 'start'});
        $('mk-ending').focus({preventScroll: true});
      } else {
        $('mk-headline').focus();
      }
    }

    marketDeskRoute = function (active) {
      if (active) {
        prepareRankedRound();
        if (!portraitsPreloaded) {
          portraitsPreloaded = true;
          lifeStages.forEach(function (stage) {
            if (stage.id !== 'starter') new Image().src = portraitPath(stage.id);
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
    $('mk-rank-retry').addEventListener('click', () => sendRankedRound(submission));
    rankDetails.addEventListener('toggle', () => { if (rankDetails.open) loadRankings(); });
    paintChart();
    window.addEventListener('arcade-languagechange', render);
    render();
  })();
