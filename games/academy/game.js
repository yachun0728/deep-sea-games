  var academyRoute;
  (function () {
    {{include:games/academy/i18n.js}}
    const rules = academyRules;
    const view = $('view-academy');
    const prefsKey = 'deep-sea-academy-prefs-v1';
    const bestKey = 'deep-sea-academy-best';
    const LANGS = ['tw', 'en', 'cn'];
    const LANG_ATTR = { tw: 'zh-Hant', en: 'en', cn: 'zh-Hans' };
    const TIME_LIMIT = 30;
    const STAGES = rules.LADDER.length;

    // ---- 偏好 ----
    let prefs = { lang: null, timer: true, sound: true };
    try {
      const saved = JSON.parse(localStorage.getItem(prefsKey) || 'null');
      if (saved && typeof saved === 'object') {
        if (LANGS.includes(saved.lang)) prefs.lang = saved.lang;
        if (typeof saved.timer === 'boolean') prefs.timer = saved.timer;
        if (typeof saved.sound === 'boolean') prefs.sound = saved.sound;
      }
    } catch (_) {}
    function siteLang() { return window.deepSeaI18n && window.deepSeaI18n.getLanguage() === 'en' ? 'en' : 'tw'; }
    // 簡中只能在遊戲內選；站台語言是繁中或英文時，只有曾選過簡中才維持簡中。
    let lang = prefs.lang === 'cn' && siteLang() === 'tw' ? 'cn' : siteLang();
    function savePrefs() { try { localStorage.setItem(prefsKey, JSON.stringify(prefs)); } catch (_) {} }
    let best = 0;
    try {
      const saved = Number(localStorage.getItem(bestKey));
      if (Number.isInteger(saved) && saved >= 0) best = saved;
    } catch (_) {}

    function t(key, ...values) {
      const text = T[lang][key] ?? T.tw[key];
      return typeof text === 'string' ? text.replace(/\{(\d+)\}/g, (_, i) => values[i]) : text;
    }
    const fmt = n => n.toLocaleString('en-US');
    const questionOf = id => academyBank[lang][id - 1];

    // ---- 狀態 ----
    let state = null, actions = [], phase = 'intro', analytics = null;
    let paidStages = {}, bonusEarned = 0;
    let eliminated = [], hintShown = false, locked = -1, revealed = null, revealTimer = null;
    let deadline = 0, remaining = TIME_LIMIT * 1000, tickTimer = null, paused = false;
    let rankRound = null, nextRankRound = null, preparingRank = null, submission = null, starting = false;
    let leaderboardRequest = 0;

    // ---- 音效 ----
    let audioCtx = null;
    function tone(freq, type, duration, delay, gain) {
      if (!prefs.sound) return;
      try {
        audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime + (delay || 0), osc = audioCtx.createOscillator(), amp = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        amp.gain.setValueAtTime(gain || 0.12, now);
        amp.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(amp);
        amp.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + duration);
      } catch (_) {}
    }
    const sfx = {
      click: () => tone(680, 'sine', 0.08, 0, 0.07),
      lock: () => { tone(330, 'triangle', 0.25, 0, 0.13); tone(440, 'triangle', 0.4, 0.15, 0.13); },
      right: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 'triangle', 0.35, i * 0.08, 0.14)),
      wrong: () => { tone(196, 'sawtooth', 0.4, 0, 0.14); tone(146.83, 'sawtooth', 0.7, 0.25, 0.16); },
      life: () => [587.33, 880, 1174.66].forEach((f, i) => tone(f, 'sine', 0.25, i * 0.06, 0.1)),
      win: () => [[523.25, 0, 0.15], [523.25, 0.16, 0.15], [523.25, 0.32, 0.15], [659.25, 0.5, 0.4], [587.33, 0.92, 0.2], [659.25, 1.15, 0.2], [783.99, 1.4, 0.8]]
        .forEach(([f, d, l]) => tone(f, 'triangle', l, d, 0.18))
    };

    // ---- 排行榜 ----
    function prepareRankedRound() {
      if (preparingRank || nextRankRound || location.protocol === 'file:') return preparingRank;
      preparingRank = import('./frontend/services/api.mjs')
        .then(api => api.startBoardRound('academy', AbortSignal.timeout(4000)))
        .then(ticket => { nextRankRound = ticket; })
        .catch(() => {})
        .finally(() => { preparingRank = null; });
      return preparingRank;
    }
    function renderRankStatus() {
      const el = $('ac-rank-status');
      el.textContent = submission ? t(submission.message) : '';
      $('ac-retry').hidden = !(submission && submission.retry);
    }
    async function sendRankedRound(entry) {
      if (!entry || entry.sending || entry.done) return;
      entry.sending = true;
      entry.retry = false;
      entry.message = 'rsSending';
      if (entry === submission) renderRankStatus();
      try {
        const api = await import('./frontend/services/api.mjs');
        const response = await api.moveBoardRound(entry.ticket.token, entry.move, AbortSignal.timeout(10000));
        entry.done = true;
        entry.message = response.state.score === entry.score ? 'rsDone' : 'rsFail';
      } catch (error) {
        entry.retry = error.retryable !== false;
        entry.done = !entry.retry;
        entry.message = 'rsFail';
      } finally {
        entry.sending = false;
        if (entry === submission) renderRankStatus();
      }
    }
    function submitRankedRound() {
      if (!rankRound) { submission = { message: 'rsLocal', done: true }; renderRankStatus(); return; }
      if (state.cleared <= 0) { submission = { message: 'rsZero', done: true }; renderRankStatus(); return; }
      submission = {
        ticket: rankRound,
        move: { id: rankRound.id, gameId: 'academy', revision: rankRound.revision, action: actions.slice() },
        score: state.cleared
      };
      sendRankedRound(submission);
    }
    async function loadRankings() {
      const request = ++leaderboardRequest;
      const list = $('ac-rank-list'), status = $('ac-rank-empty');
      list.replaceChildren();
      status.textContent = t('rankLoading');
      try {
        const api = await import('./frontend/services/api.mjs');
        const result = await api.createApiClient(api.arcadeApiOrigin()).leaderboard('academy', AbortSignal.timeout(5000));
        if (request !== leaderboardRequest) return;
        list.replaceChildren(...result.entries.map(entry => {
          const item = document.createElement('li');
          const name = document.createElement('span');
          name.textContent = entry.displayName || t('guest');
          const amount = document.createElement('strong');
          amount.textContent = t('boardStage', entry.score);
          item.append(name, amount);
          return item;
        }));
        status.textContent = result.entries.length ? '' : t('rankEmpty');
      } catch {
        if (request === leaderboardRequest) status.textContent = t('rankFail');
      }
    }
    function openRank() {
      $('ac-rank').hidden = false;
      $('ac-rank-close').focus();
      loadRankings();
    }
    function closeRank() { $('ac-rank').hidden = true; leaderboardRequest++; $('ac-rank-btn').focus(); }

    // ---- 計時 ----
    function stopTimer() { clearInterval(tickTimer); tickTimer = null; }
    function paintTimer() {
      const secs = Math.max(0, Math.ceil(remaining / 1000));
      const ring = $('ac-ring');
      $('ac-time').textContent = prefs.timer ? String(secs) : '∞';
      ring.style.strokeDashoffset = prefs.timer ? String(125.6 - (remaining / (TIME_LIMIT * 1000)) * 125.6) : '0';
      ring.style.stroke = !prefs.timer ? '#38bdf8' : secs <= 8 ? '#ef4444' : '#fbbf24';
    }
    function startTimer(fresh) {
      stopTimer();
      if (fresh) remaining = TIME_LIMIT * 1000;
      paintTimer();
      if (!prefs.timer) return;
      deadline = Date.now() + remaining;
      tickTimer = setInterval(() => {
        remaining = deadline - Date.now();
        paintTimer();
        if (remaining <= 8000 && remaining > 0 && Math.ceil(remaining / 1000) !== Math.ceil((remaining + 1000) / 1000)) tone(880, 'sine', 0.05, 0, 0.04);
        if (remaining <= 0) { stopTimer(); timeUp(); }
      }, 250);
    }
    function pauseTimer() {
      if (!tickTimer) return;
      remaining = Math.max(0, deadline - Date.now());
      stopTimer();
      paused = true;
    }
    function resumeTimer() {
      if (!paused) return;
      paused = false;
      if (phase === 'ask' && locked < 0 && !revealed) startTimer(false);
    }

    // ---- 畫面 ----
    function params() { return { stage: state ? state.stage : 1, step: state ? state.answered : 0, score: state ? state.credits : 0 }; }
    function setText(id, text) { $(id).textContent = text; }
    function renderStatic() {
      view.lang = LANG_ATTR[lang];
      view.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
      view.querySelectorAll('[data-t-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.tAria)); });
      $('ac-lang').textContent = LANG_LABEL[lang];
      $('ac-lang').setAttribute('aria-label', 'Language: ' + LANG_LABEL[lang]);
      $('ac-timer-toggle').textContent = t(prefs.timer ? 'timerOn' : 'timerOff');
      $('ac-timer-toggle').setAttribute('aria-pressed', String(prefs.timer));
      $('ac-sound').textContent = t(prefs.sound ? 'soundOn' : 'soundOff');
      $('ac-sound').setAttribute('aria-pressed', String(prefs.sound));
      $('ac-fifty').textContent = t('fifty'); $('ac-fifty').title = t('fiftyTip');
      $('ac-hint-btn').textContent = t('hint'); $('ac-hint-btn').title = t('hintTip');
      $('ac-swap').textContent = t('swap'); $('ac-swap').title = t('swapTip');
      setText('ac-best', fmt(best));
      setText('ac-walk-title', t('walkTitle'));
      setText('ac-walk-no', t('walkNo')); setText('ac-walk-yes', t('walkYes'));
      setText('ac-rank-title', t('rankTitle')); setText('ac-rank-note', t('rankNote')); setText('ac-rank-close', t('close'));
      setText('ac-rank-btn', t('rankBtn')); setText('ac-walk-btn', t('walk')); setText('ac-retry', t('rsRetry'));
    }
    function renderLadder() {
      const items = rules.LADDER.map((amount, i) => {
        const level = i + 1;
        const li = document.createElement('li');
        const cleared = state ? (state.over ? level <= state.cleared : level < state.stage) : false;
        li.className = 'ac-rung' + (state && !state.over && level === state.stage ? ' is-current' : '') +
          (cleared ? ' is-done' : '') + (level === rules.SAFE_STAGE ? ' is-safe' : '');
        li.textContent = String(level);
        li.title = fmt(amount) + ' ' + t('unit');
        return li;
      });
      $('ac-ladder').replaceChildren(...items);
    }
    function renderDomains() {
      const cards = rules.DOMAINS.map((id, index) => {
        const left = rules.pool(state, index).length;
        const [name, desc, icon] = t('domains')[id];
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ac-domain';
        b.disabled = left === 0;
        b.dataset.domain = String(index);
        b.innerHTML = '<span class="ac-domain-icon" aria-hidden="true"></span><span class="ac-domain-copy"><b></b><small></small></span><em></em>';
        b.querySelector('.ac-domain-icon').textContent = icon;
        b.querySelector('b').textContent = name;
        b.querySelector('small').textContent = desc;
        b.querySelector('em').textContent = t('left', left);
        return b;
      });
      const total = rules.ANSWERS.length - state.used.size;
      const [name, desc, icon] = t('domains').random;
      const r = document.createElement('button');
      r.type = 'button';
      r.className = 'ac-domain is-random';
      r.dataset.domain = String(rules.ACT.RANDOM);
      r.innerHTML = '<span class="ac-domain-icon" aria-hidden="true"></span><span class="ac-domain-copy"><b></b><small></small></span><em></em>';
      r.querySelector('.ac-domain-icon').textContent = icon;
      r.querySelector('b').textContent = name;
      r.querySelector('small').textContent = desc;
      r.querySelector('em').textContent = t('all', total);
      $('ac-domains').replaceChildren(...cards, r);
    }
    function renderQuestion() {
      const [q, opts, exp] = questionOf(state.question);
      const [domName, , domIcon] = t('domains')[rules.domainOf(state.question)];
      setText('ac-domain-tag', domIcon + ' ' + domName);
      setText('ac-question', q);
      $('ac-options').querySelectorAll('.ac-opt').forEach((btn, i) => {
        btn.querySelector('span').textContent = opts[i];
        btn.classList.toggle('is-gone', eliminated.includes(i));
        btn.classList.toggle('is-locked', locked === i);
        btn.classList.toggle('is-correct', !!revealed && revealed.answer === i);
        btn.classList.toggle('is-wrong', !!revealed && revealed.chosen === i && revealed.chosen !== revealed.answer);
        btn.disabled = locked >= 0 || !!revealed || eliminated.includes(i);
      });
      const hint = $('ac-hint');
      hint.hidden = !hintShown;
      if (hintShown) hint.textContent = t('hintText', exp, opts[rules.answerOf(state.question)].length);
      const fb = $('ac-feedback');
      fb.hidden = !revealed;
      if (revealed) {
        fb.dataset.result = revealed.correct ? 'right' : 'wrong';
        setText('ac-fb-status', revealed.timeout ? t('timeout') :
          revealed.correct ? (revealed.champion ? t('champ') : t('rightUp', fmt(state.credits))) : t('wrong'));
        setText('ac-fb-exp', t('explain', exp) + (revealed.bonus ? ' ' + t('bonusGot', revealed.bonus) : ''));
      }
    }
    function render() {
      renderStatic();
      renderLadder();
      const app = $('ac-app');
      app.dataset.phase = phase;
      const asking = phase === 'ask', selecting = phase === 'select', over = phase === 'over', intro = phase === 'intro';
      $('ac-intro').hidden = !intro;
      $('ac-select').hidden = !selecting;
      $('ac-ask').hidden = !asking;
      $('ac-over').hidden = !over;
      $('ac-timer').hidden = !asking;
      $('ac-lifelines').hidden = !asking || !!revealed;
      $('ac-options').hidden = !asking;
      setText('ac-stage', intro ? t('stageIntro') : t('stage', state.stage, STAGES));
      setText('ac-credits', fmt(state ? state.credits : 0));
      const go = $('ac-go');
      go.hidden = !(intro || over);
      go.disabled = starting;
      go.textContent = starting ? t('preparing') : t(intro ? 'start' : 'again');
      $('ac-rank-btn').hidden = !(intro || over);
      const reviewing = asking && !!revealed;
      $('ac-next').hidden = !reviewing;
      if (reviewing) $('ac-next').textContent = revealed.final ? t('claim') : t('nextStage', state.stage);
      $('ac-walk-btn').hidden = !(selecting && state.credits > 0);
      $('ac-actions').hidden = asking && !reviewing;
      if (selecting) { setText('ac-pick-title', t('pickTitle', state.stage)); renderDomains(); }
      if (asking) {
        renderQuestion();
        ['fifty', 'hint', 'swap'].forEach(key => {
          const btn = key === 'hint' ? $('ac-hint-btn') : $(key === 'fifty' ? 'ac-fifty' : 'ac-swap');
          btn.disabled = !state.lifelines[key] || locked >= 0;
        });
      }
      if (over) renderOver();
      renderRankStatus();
    }
    function renderOver() {
      const credits = state.credits;
      const rankIndex = credits >= 1000000 ? 4 : credits >= 250000 ? 3 : credits >= rules.SAFE_CREDITS ? 2 : credits > 0 ? 1 : 0;
      setText('ac-rank-badge', t('rankPrefix', t('rankNames')[rankIndex]));
      $('ac-over-icon').textContent = ['🎤', '✨', '🏅', '🎓', '👑'][rankIndex];
      const reason = state.reason;
      let title, sub;
      if (reason === 'champion') { title = t('champTitle'); sub = t('champSub'); }
      else if (reason === 'walk') { title = t('walkTitle2'); sub = t('walkSub'); }
      else if (credits > 0) { title = t('safeTitle'); sub = reason === 'timeout' ? t('timeoutSub') : t('safeSub'); }
      else { title = t('failTitle'); sub = reason === 'timeout' ? t('timeoutSub') : t('failSub'); }
      setText('ac-over-title', title);
      setText('ac-over-sub', sub);
      setText('ac-final', fmt(credits));
      setText('ac-stat-stages', t('stagesVal', state.cleared, STAGES));
      setText('ac-stat-acc', (state.answered ? Math.round(state.correct / state.answered * 100) : 0) + '%');
      setText('ac-stat-life', t('lifeVal', 3 - Object.values(state.lifelines).filter(Boolean).length));
      setText('ac-stat-bonus', t('bonusVal', bonusEarned));
    }

    // ---- 流程 ----
    function pay(n, stage) {
      if (n <= 0 || paidStages[stage]) return 0;
      paidStages[stage] = true;
      bonusEarned += n;
      S.balance += n;
      save();
      renderAll();
      AN.progress(analytics, { stage, step: state.answered, score: state.credits, bonus_points: n }, false);
      return n;
    }
    async function start() {
      if (starting || (phase !== 'intro' && phase !== 'over') || view.hidden) return;
      starting = true;
      sfx.click();
      render();
      await prepareRankedRound();
      starting = false;
      if (view.hidden) { render(); return; }
      rankRound = nextRankRound;
      nextRankRound = null;
      prepareRankedRound();
      state = rules.create(rankRound ? timedReplay.seeded(rankRound.state.seed) : Math.random);
      actions = [];
      submission = null;
      paidStages = {};
      bonusEarned = 0;
      eliminated = []; hintShown = false; locked = -1; revealed = null;
      phase = 'select';
      analytics = AN.start('academy', 0, params());
      render();
      view.scrollTop = 0;
    }
    function act(code) {
      if (!rules.step(state, code)) return false;
      actions.push(code);
      return true;
    }
    function pickDomain(index) {
      if (phase !== 'select' || view.hidden) return;
      sfx.click();
      if (!act(index)) return;
      eliminated = []; hintShown = false; locked = -1; revealed = null;
      phase = 'ask';
      render();
      $('ac-question').focus({ preventScroll: true });
      startTimer(true);
    }
    function useLife(key) {
      if (phase !== 'ask' || locked >= 0 || revealed || !state.lifelines[key]) return;
      const code = key === 'fifty' ? rules.ACT.FIFTY : key === 'hint' ? rules.ACT.HINT : rules.ACT.SWAP;
      if (!act(code)) return;
      sfx.life();
      if (key === 'fifty') {
        const answer = rules.answerOf(state.question);
        eliminated = [0, 1, 2, 3].filter(i => i !== answer).sort(() => Math.random() - 0.5).slice(0, 2);
      } else if (key === 'hint') {
        hintShown = true;
      } else {
        eliminated = []; hintShown = false;
        startTimer(true);
      }
      render();
    }
    function choose(index) {
      if (phase !== 'ask' || locked >= 0 || revealed || view.hidden) return;
      stopTimer();
      locked = index;
      sfx.lock();
      render();
      revealTimer = setTimeout(() => settle(index, false), 1100);
    }
    function timeUp() {
      if (phase !== 'ask' || locked >= 0 || revealed) return;
      locked = -1;
      settle(-1, true);
    }
    function settle(index, timeout) {
      revealTimer = null;
      if (phase !== 'ask' || view.hidden) return;
      const stage = state.stage, answer = rules.answerOf(state.question);
      const before = state.correct;
      if (!act(timeout ? rules.ACT.TIMEOUT : rules.ACT.ANSWER + index)) return;
      const correct = state.correct > before;
      locked = -1;
      revealed = { chosen: index, answer, correct, timeout, final: state.over, champion: correct && state.over, bonus: 0 };
      if (correct) revealed.bonus = pay(rules.BONUS_PER_STAGE, stage);
      if (correct) (state.over ? sfx.win : sfx.right)(); else sfx.wrong();
      AN.progress(analytics, params(), false);
      render();
      $('ac-next').focus({ preventScroll: true });
    }
    function next() {
      if (phase !== 'ask' || !revealed) return;
      sfx.click();
      if (state.over) { finish(); return; }
      revealed = null; locked = -1; eliminated = []; hintShown = false;
      phase = 'select';
      render();
    }
    function finish() {
      stopTimer();
      phase = 'over';
      revealed = null;
      if (state.credits > best) {
        best = state.credits;
        try { localStorage.setItem(bestKey, String(best)); } catch (_) {}
      }
      AN.end(analytics, bonusEarned, state.cleared > 0 ? 'complete' : 'loss', params());
      analytics = null;
      submitRankedRound();
      render();
      $('ac-over-title').focus({ preventScroll: true });
    }
    function openWalk() {
      if (phase !== 'select' || state.credits <= 0) return;
      sfx.click();
      setText('ac-walk-text', t('walkText', fmt(state.credits)));
      $('ac-walk').hidden = false;
      $('ac-walk-no').focus();
    }
    function closeWalk() { $('ac-walk').hidden = true; }
    function confirmWalk() {
      closeWalk();
      if (phase !== 'select' || !act(rules.ACT.WALK)) return;
      sfx.right();
      finish();
    }
    function setLang(next) {
      lang = next;
      render();
    }
    function abandon() {
      clearTimeout(revealTimer);
      revealTimer = null;
      stopTimer();
      paused = false;
      if (analytics) { AN.end(analytics, bonusEarned, 'abandoned', params()); analytics = null; }
      $('ac-walk').hidden = true;
      $('ac-rank').hidden = true;
      leaderboardRequest++;
      phase = 'intro';
      state = null; actions = []; locked = -1; revealed = null; eliminated = []; hintShown = false;
      submission = null;
      render();
    }

    academyRoute = function (active) {
      if (active) {
        prepareRankedRound();
        render();
        return;
      }
      if (phase === 'ask' || phase === 'select') abandon();
      else if (phase === 'over') { phase = 'intro'; state = null; render(); }
    };

    // ---- 事件 ----
    $('ac-go').addEventListener('click', start);
    $('ac-next').addEventListener('click', next);
    $('ac-walk-btn').addEventListener('click', openWalk);
    $('ac-walk-no').addEventListener('click', () => { sfx.click(); closeWalk(); });
    $('ac-walk-yes').addEventListener('click', confirmWalk);
    $('ac-rank-btn').addEventListener('click', openRank);
    $('ac-rank-close').addEventListener('click', closeRank);
    $('ac-retry').addEventListener('click', () => sendRankedRound(submission));
    $('ac-lang').addEventListener('click', () => {
      prefs.lang = LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length];
      savePrefs();
      setLang(prefs.lang);
    });
    $('ac-timer-toggle').addEventListener('click', () => {
      prefs.timer = !prefs.timer;
      savePrefs();
      sfx.click();
      if (phase === 'ask' && locked < 0 && !revealed) startTimer(false);
      render();
    });
    $('ac-sound').addEventListener('click', () => {
      prefs.sound = !prefs.sound;
      savePrefs();
      sfx.click();
      render();
    });
    $('ac-domains').addEventListener('click', event => {
      const btn = event.target.closest('[data-domain]');
      if (btn && !btn.disabled) pickDomain(Number(btn.dataset.domain));
    });
    $('ac-options').addEventListener('click', event => {
      const btn = event.target.closest('[data-opt]');
      if (btn && !btn.disabled) choose(Number(btn.dataset.opt));
    });
    $('ac-lifelines').addEventListener('click', event => {
      const btn = event.target.closest('[data-life]');
      if (btn && !btn.disabled) useLife(btn.dataset.life);
    });
    document.addEventListener('keydown', event => {
      if (view.hidden) return;
      if (event.key === 'Escape') {
        if (!$('ac-rank').hidden) closeRank();
        else if (!$('ac-walk').hidden) closeWalk();
        return;
      }
      if (phase === 'ask' && !event.metaKey && !event.ctrlKey && !event.altKey && !event.repeat &&
          $('ac-walk').hidden && $('ac-rank').hidden) {
        const i = 'abcd'.indexOf(event.key.toLowerCase());
        if (i >= 0 && event.key.length === 1) { event.preventDefault(); choose(i); }
      }
    });
    document.addEventListener('visibilitychange', () => { document.hidden ? pauseTimer() : resumeTimer(); });
    window.addEventListener('blur', pauseTimer);
    window.addEventListener('focus', () => { if (!document.hidden) resumeTimer(); });
    window.addEventListener('pagehide', () => {
      if (analytics && (phase === 'ask' || phase === 'select')) AN.end(analytics, bonusEarned, 'abandoned', params()), analytics = null;
    });
    // 站台語言切換時同步遊戲語言（簡中只能在遊戲內選）
    window.addEventListener('arcade-languagechange', () => {
      lang = siteLang();
      prefs.lang = lang;
      savePrefs();
      render();
    });
    render();
  })();
