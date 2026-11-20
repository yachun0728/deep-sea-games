  var academyRoute;
  (function () {
    {{include:games/academy/questions.js}}
    const rules = academyRules;
    const view = $('view-academy');
    const prefsKey = 'deep-sea-academy-prefs-v1';
    const bestKey = 'deep-sea-academy-best';
    const LANGS = ['tw', 'en', 'cn'];
    const LANG_ATTR = { tw: 'zh-Hant', en: 'en', cn: 'zh-Hans' };
    const LANG_LABEL = { tw: '繁中', en: 'EN', cn: '简中' };
    const TIME_LIMIT = 30;
    const STAGES = rules.LADDER.length;

    // ---- 三語介面文字（題庫在 questions.js）----
    const T = {
      tw: {
        title: '百萬大學堂', tag: '十大關卡 · 五大領域 · 百科挑戰',
        lead: '一百道百科題，每關自選領域作答。學分逐關倍增，目標是第 10 關的 1,000,000 學分。學分只是本遊戲的成績，不是點數。',
        rule1h: '自選領域', rule1: '每關開始前任選五大領域之一或「隨機盲盒」，題目不重複。',
        rule2h: '第 5 關安全線', rule2: '通過第 5 關後，答錯也保留 32,000 學分；也可以隨時「結束挑戰」，以目前學分作為本局成績。',
        rule3h: '三個錦囊', rule3: '50:50、智囊提示、臨場換題，每局各限用一次。',
        rule4: '每首次通過一關 +1 點，每局最多 10 點，與學分多寡無關。',
        best: '最佳學分', credits: '學分', exit: '退出遊戲', settings: '設定',
        timerOn: '⏱ 計時：開', timerOff: '⏱ 計時：關', soundOn: '♪ 音效：開', soundOff: '♪ 音效：關',
        start: '登台開始挑戰', preparing: '準備排行榜…', again: '再來一局', rankBtn: '排行榜', home: '返回大廳',
        stage: '第 {0} / {1} 關', stageIntro: '準備登台',
        pickTitle: '請選擇第 {0} 關領域', pickNote: '系統會從該領域抽一道還沒出現過的題目。',
        left: '剩 {0} 題', all: '全庫 {0} 題',
        domains: {
          science: ['科學自然', '物理 · 化學 · 生物 · 天文', '🔬'], history: ['歷史人文', '中外歷史 · 文學藝術 · 哲學', '📜'],
          geography: ['地理百科', '世界地理 · 自然奇觀 · 風情', '🌏'], sports_ent: ['體育娛樂', '奧運體育 · 影視音樂 · 流行', '🎬'],
          daily_tech: ['生活常識', '健康飲食 · 科技數位 · 百科', '💡'], random: ['隨機盲盒領域', '由系統隨機指派任一領域', '🔀']
        },
        fifty: '50:50', hint: '智囊提示', swap: '臨場換題',
        fiftyTip: '刪除兩個錯誤選項', hintTip: '顯示智囊團線索', swapTip: '同領域換一道新題',
        hintText: '智囊團線索：{0}（提示：正確答案共 {1} 個字）',
        walk: '結束挑戰', walkTitle: '要結束挑戰嗎？', walkText: '你目前的成績是 {0} 學分。結束後本局馬上結算，已拿到的 BONUS 點數不變。',
        walkNo: '繼續闖關', walkYes: '結束並結算',
        right: '答對了！', rightUp: '答對了！學分升到 {0}。', wrong: '答錯了。', timeout: '時間到。',
        explain: '百科解析：{0}', nextStage: '前往第 {0} 關', claim: '查看最終結算', bonusGot: '+{0} 點 BONUS',
        champ: '全部通關！達成 1,000,000 學分！',
        rankNames: ['演播室新秀', '知識探索者', '博學智多星', '殿堂級百科宗師', '百萬大滿貫'],
        rankPrefix: '榮譽稱號：{0}',
        champTitle: '登頂巔峰！', champSub: '你連續攻克十道百科難關，登上了百萬大學堂的最高舞台。',
        walkTitle2: '審時度勢，漂亮收官！', walkSub: '你選擇在高處結束挑戰，成績已經鎖定。',
        safeTitle: '安全線保住了成績', safeSub: '幸好已通過第 5 關，保留 32,000 學分。',
        failTitle: '挑戰惜敗', failSub: '知識之路沒有終點，歡迎隨時再上台挑戰。',
        timeoutSub: '時間到了。下次試試先排除明顯錯誤的選項。',
        finalCredits: '最終學分', statStages: '通關進度', statAcc: '答題正確率', statLife: '使用錦囊', statBonus: '本局 BONUS',
        stagesVal: '{0} / {1} 關', lifeVal: '{0} / 3 個', bonusVal: '{0} 點',
        rankTitle: '訪客排行榜', rankNote: '依最終學分排序，同分先達成者在前。成績由伺服器重播驗證。', rankLoading: '載入排行榜中…',
        rankEmpty: '目前還沒有排行榜紀錄。', rankFail: '目前無法載入排行榜。', close: '關閉', guest: '訪客', unit: '學分',
        rsLocal: '這一局只在本機遊玩，排行榜暫時連不上。', rsSending: '正在驗證排行榜成績…', rsDone: '成績已送到排行榜。',
        rsFail: '排行榜成績未能送出。', rsRetry: '重新送出', rsZero: '沒有學分的局不會送上排行榜。',
        langName: '繁中'
      },
      en: {
        title: 'Millionaire Academy', tag: '10 stages · 5 subjects · trivia challenge',
        lead: 'One hundred trivia questions; pick your subject each stage. Credits double as you climb toward 1,000,000 at stage 10. Credits are only this game’s score, not points.',
        rule1h: 'Choose your subject', rule1: 'Before each stage pick one of five subjects or the random box. No question repeats.',
        rule2h: 'Safe line at stage 5', rule2: 'Once you clear stage 5, a wrong answer still keeps 32,000 credits. You can also end the run at any time and keep your current credits as your score.',
        rule3h: 'Three lifelines', rule3: '50:50, Expert hint and Swap question, each once per run.',
        rule4: '+1 point the first time you clear each stage, up to 10 per run, no matter how many credits you hold.',
        best: 'Best credits', credits: 'Credits', exit: 'Exit game', settings: 'Settings',
        timerOn: '⏱ Timer: on', timerOff: '⏱ Timer: off', soundOn: '♪ Sound: on', soundOff: '♪ Sound: off',
        start: 'Take the stage', preparing: 'Preparing leaderboard…', again: 'Play again', rankBtn: 'Leaderboard', home: 'Back to lobby',
        stage: 'Stage {0} / {1}', stageIntro: 'Ready',
        pickTitle: 'Pick a subject for stage {0}', pickNote: 'You get a question from that subject that has not appeared yet.',
        left: '{0} left', all: '{0} in the pool',
        domains: {
          science: ['Science & Nature', 'Physics · Chemistry · Biology · Astronomy', '🔬'], history: ['History & Culture', 'World history · Literature · Art · Philosophy', '📜'],
          geography: ['Geography', 'World geography · Natural wonders · Cultures', '🌏'], sports_ent: ['Sports & Entertainment', 'Olympics · Film · Music · Pop culture', '🎬'],
          daily_tech: ['Daily Life & Tech', 'Health · Food · Gadgets · General know-how', '💡'], random: ['Random box', 'The game picks any subject for you', '🔀']
        },
        fifty: '50:50', hint: 'Expert hint', swap: 'Swap',
        fiftyTip: 'Remove two wrong answers', hintTip: 'Show the expert’s clue', swapTip: 'New question, same subject',
        hintText: 'Expert clue: {0} (Hint: the correct answer is {1} characters long.)',
        walk: 'End run', walkTitle: 'End your run?', walkText: 'Your score is {0} credits. The run is settled right away, and any BONUS points you earned stay as they are.',
        walkNo: 'Keep going', walkYes: 'End and settle',
        right: 'Correct!', rightUp: 'Correct! Credits rise to {0}.', wrong: 'Wrong answer.', timeout: 'Time is up.',
        explain: 'Explanation: {0}', nextStage: 'Go to stage {0}', claim: 'See final result', bonusGot: '+{0} point BONUS',
        champ: 'All ten stages cleared! 1,000,000 credits!',
        rankNames: ['Studio rookie', 'Knowledge explorer', 'Quiz star', 'Hall-of-fame scholar', 'Grand champion'],
        rankPrefix: 'Title: {0}',
        champTitle: 'You reached the summit!', champSub: 'Ten trivia stages in a row. You topped the Academy stage.',
        walkTitle2: 'A well-timed finish!', walkSub: 'You ended the run on a high and your score is locked in.',
        safeTitle: 'The safe line held', safeSub: 'You had cleared stage 5, so 32,000 credits are kept.',
        failTitle: 'So close', failSub: 'There is no finish line for learning. Come back and try again any time.',
        timeoutSub: 'Time ran out. Next time, rule out the obvious wrong answers first.',
        finalCredits: 'Final credits', statStages: 'Stages cleared', statAcc: 'Accuracy', statLife: 'Lifelines used', statBonus: 'BONUS this run',
        stagesVal: '{0} / {1}', lifeVal: '{0} / 3', bonusVal: '{0} pt',
        rankTitle: 'Guest leaderboard', rankNote: 'Ranked by final credits; ties go to whoever got there first. Scores are replay-verified by the server.', rankLoading: 'Loading leaderboard…',
        rankEmpty: 'No leaderboard entries yet.', rankFail: 'The leaderboard can’t be loaded right now.', close: 'Close', guest: 'Guest', unit: 'credits',
        rsLocal: 'This run is local only; the leaderboard is unreachable.', rsSending: 'Verifying your leaderboard score…', rsDone: 'Score sent to the leaderboard.',
        rsFail: 'The leaderboard score could not be sent.', rsRetry: 'Send again', rsZero: 'Runs with zero credits are not sent to the leaderboard.',
        langName: 'EN'
      },
      cn: {
        title: '百万大学堂', tag: '十大关卡 · 五大领域 · 百科挑战',
        lead: '一百道百科题，每关自选领域作答。学分逐关翻倍，目标是第 10 关的 1,000,000 学分。学分只是本游戏的成绩，不是点数。',
        rule1h: '自选领域', rule1: '每关开始前任选五大领域之一或“随机盲盒”，题目不重复。',
        rule2h: '第 5 关安全线', rule2: '通过第 5 关后，答错也保留 32,000 学分；也可以随时“结束挑战”，以当前学分作为本局成绩。',
        rule3h: '三个锦囊', rule3: '50:50、智囊提示、临场换题，每局各限用一次。',
        rule4: '每首次通过一关 +1 点，每局最多 10 点，与学分多少无关。',
        best: '最佳学分', credits: '学分', exit: '退出游戏', settings: '设置',
        timerOn: '⏱ 计时：开', timerOff: '⏱ 计时：关', soundOn: '♪ 音效：开', soundOff: '♪ 音效：关',
        start: '登台开始挑战', preparing: '准备排行榜…', again: '再来一局', rankBtn: '排行榜', home: '返回大厅',
        stage: '第 {0} / {1} 关', stageIntro: '准备登台',
        pickTitle: '请选择第 {0} 关领域', pickNote: '系统会从该领域抽一道还没出现过的题目。',
        left: '剩 {0} 题', all: '全库 {0} 题',
        domains: {
          science: ['科学自然', '物理 · 化学 · 生物 · 天文', '🔬'], history: ['历史人文', '中外历史 · 文学艺术 · 哲学', '📜'],
          geography: ['地理百科', '世界地理 · 自然奇观 · 风情', '🌏'], sports_ent: ['体育娱乐', '奥运体育 · 影视音乐 · 流行', '🎬'],
          daily_tech: ['生活常识', '健康饮食 · 科技数码 · 百科', '💡'], random: ['随机盲盒领域', '由系统随机指派任一领域', '🔀']
        },
        fifty: '50:50', hint: '智囊提示', swap: '临场换题',
        fiftyTip: '删除两个错误选项', hintTip: '显示智囊团线索', swapTip: '同领域换一道新题',
        hintText: '智囊团线索：{0}（提示：正确答案共 {1} 个字）',
        walk: '结束挑战', walkTitle: '要结束挑战吗？', walkText: '你当前的成绩是 {0} 学分。结束后本局马上结算，已拿到的 BONUS 点数不变。',
        walkNo: '继续闯关', walkYes: '结束并结算',
        right: '答对了！', rightUp: '答对了！学分升到 {0}。', wrong: '答错了。', timeout: '时间到。',
        explain: '百科解析：{0}', nextStage: '前往第 {0} 关', claim: '查看最终结算', bonusGot: '+{0} 点 BONUS',
        champ: '全部通关！达成 1,000,000 学分！',
        rankNames: ['演播室新秀', '知识探索者', '博学智多星', '殿堂级百科宗师', '百万大满贯'],
        rankPrefix: '荣誉称号：{0}',
        champTitle: '登顶巅峰！', champSub: '你连续攻克十道百科难关，登上了百万大学堂的最高舞台。',
        walkTitle2: '审时度势，漂亮收官！', walkSub: '你选择在高处结束挑战，成绩已经锁定。',
        safeTitle: '安全线保住了成绩', safeSub: '幸好已通过第 5 关，保留 32,000 学分。',
        failTitle: '挑战惜败', failSub: '知识之路没有终点，欢迎随时再上台挑战。',
        timeoutSub: '时间到了。下次试试先排除明显错误的选项。',
        finalCredits: '最终学分', statStages: '通关进度', statAcc: '答题正确率', statLife: '使用锦囊', statBonus: '本局 BONUS',
        stagesVal: '{0} / {1} 关', lifeVal: '{0} / 3 个', bonusVal: '{0} 点',
        rankTitle: '访客排行榜', rankNote: '按最终学分排序，同分先达成者在前。成绩由服务器重放验证。', rankLoading: '加载排行榜中…',
        rankEmpty: '目前还没有排行榜记录。', rankFail: '目前无法加载排行榜。', close: '关闭', guest: '访客', unit: '学分',
        rsLocal: '这一局只在本机游玩，排行榜暂时连不上。', rsSending: '正在验证排行榜成绩…', rsDone: '成绩已送到排行榜。',
        rsFail: '排行榜成绩未能送出。', rsRetry: '重新送出', rsZero: '没有学分的局不会送上排行榜。',
        langName: '简中'
      }
    };

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
    let lang = prefs.lang || siteLang();
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
    let finishReason = null;
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
      if (state.credits <= 0) { submission = { message: 'rsZero', done: true }; renderRankStatus(); return; }
      submission = {
        ticket: rankRound,
        move: { id: rankRound.id, gameId: 'academy', revision: rankRound.revision, action: actions.slice() },
        score: state.credits
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
          amount.textContent = fmt(entry.score) + ' ' + t('unit');
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
      document.title = document.title; // 標題由站台路由管理
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
      setText('ac-stage', intro ? t('stageIntro') : over ? t('stage', Math.max(1, Math.min(STAGES, state.cleared + (state.reason === 'champion' ? 0 : 1))), STAGES) : t('stage', state.stage, STAGES));
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
      eliminated = []; hintShown = false; locked = -1; revealed = null; finishReason = null;
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
      finishReason = state.reason;
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
        if (!siteSyncedOnce) { siteSyncedOnce = true; }
        prepareRankedRound();
        render();
        return;
      }
      if (phase === 'ask' || phase === 'select') abandon();
      else if (phase === 'over') { phase = 'intro'; state = null; render(); }
    };
    let siteSyncedOnce = false;

    // ---- 事件 ----
    $('ac-go').addEventListener('click', start);
    $('ac-next').addEventListener('click', next);
    $('ac-walk-btn').addEventListener('click', openWalk);
    $('ac-walk-no').addEventListener('click', () => { sfx.click(); closeWalk(); });
    $('ac-walk-yes').addEventListener('click', confirmWalk);
    $('ac-rank-btn').addEventListener('click', openRank);
    $('ac-rank-close').addEventListener('click', closeRank);
    $('ac-retry').addEventListener('click', () => sendRankedRound(submission));
    $('ac-exit').addEventListener('click', () => { location.hash = 'lobby'; });
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
