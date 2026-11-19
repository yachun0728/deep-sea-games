  /* ---------- Ocean Link ---------- */
  let oceanLinkBusy = false;
  const oceanLinkRoute = (function () {
    let rows = 14, cols = 18, stride = cols + 2;
{{include:games/ocean-link/tiles.js}}{{include:games/ocean-link/board.js}}
    let rules = oceanLinkBoard(rows, cols);
    const {levels} = rules;
    const stage = $('ol-stage'), playfield = $('ol-playfield'), grid = $('ol-board');
    const go = $('ol-go'), mode = $('ol-mode'), hint = $('ol-hint');
    const full = $('ol-full'), trace = $('ol-trace'), line = trace.querySelector('polyline');
    const clock = $('ol-clock'), clockValue = $('ol-time');
    const resultPanel = $('ol-result'), resultTitle = $('ol-result-title');
    const edge = 0.3;
    const dimensions = {easy: [6, 8], standard: [14, 18], challenge: [16, 26]};
    const easyRule = [levels[0][0], null, 0];
    const easyGlyphs = new Set(['🐙', '🦀', '🐢', '🐧', '⭐', '⚓', '🌈', '🍉', '🍓', '🍌', '🍄', '🦋']);
    const bonuses = new Map([[3, 5], [6, 5], [10, 5]]);
    const bestKey = 'deep-sea-ocean-link-best-v1';
    let level = 1, remaining = 0, paid = 0, board = [], selected = -1;
    let ranked = null, rankedLevel = null, rankStarting = false, rankSending = false, rankPending = null;
    let rankActions = [];
    let round = null, between = false, traceTimer = 0, locked = false, moves = [];

    let segmentStartedAt = null, elapsedMs = 0, clockTimer = 0;
    let transposed = false, activePath = null;

    function updateClock() {
      const runningMs = segmentStartedAt === null ? 0 : Math.max(0, Date.now() - segmentStartedAt);
      const elapsed = Math.floor((elapsedMs + runningMs) / 1000);
      const dateTime = 'PT' + elapsed + 'S';
      if (clockValue.dateTime === dateTime) return;
      const twoDigits = value => String(value).padStart(2, '0');
      clockValue.textContent = twoDigits(Math.floor(elapsed / 60)) + ':' + twoDigits(elapsed % 60);
      clockValue.dateTime = dateTime;
    }

    function resumeClock() {
      segmentStartedAt = Date.now();
      updateClock();
      clockTimer = setInterval(updateClock, 250);
    }

    function pauseClock() {
      if (segmentStartedAt === null) return;
      elapsedMs += Math.max(0, Date.now() - segmentStartedAt);
      segmentStartedAt = null;
      clearInterval(clockTimer);
      updateClock();
    }

    function hideResult() {
      resultPanel.hidden = true;
      stage.classList.remove('ol-showing-result');
      hint.before(go);
      clock.hidden = false;
    }

    function showResult(reward, finished) {
      playfield.hidden = true;
      clock.hidden = true;
      resultTitle.textContent = finished ? '恭喜完成遠征！' : '恭喜通關！';
      $('ol-result-level').textContent = level;
      $('ol-result-time').textContent = clockValue.textContent;
      $('ol-result-time').dateTime = clockValue.dateTime;
      $('ol-result-reward').hidden = !reward;
      $('ol-result-actions').appendChild(go);
      resultPanel.hidden = false;
      go.hidden = false;
      stage.classList.add('ol-showing-result');
      resultTitle.focus();
    }

    function say(message) { $('ol-msg').textContent = message; }

    function sizeBoard() {
      if (playfield.hidden || $('view-ocean-link').hidden) return;
      const view = window.visualViewport;
      const height = view ? view.height : window.innerHeight;
      const style = getComputedStyle(stage);
      const usableWidth = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const landscape = matchMedia('(orientation: landscape) and (max-height: 540px)').matches;
      const focused = stage.classList.contains('ol-board-focus');
      const toolbar = stage.querySelector('.ol-toolbar');
      const paddingHeight = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const gap = parseFloat(style.gap);
      const side = focused && matchMedia('(orientation: landscape)').matches;
      transposed = focused && matchMedia('(orientation: portrait) and (max-width: 600px)').matches;
      const displayCols = transposed ? rows : cols;
      const displayRows = transposed ? cols : rows;
      grid.classList.toggle('ol-transposed', transposed);
      grid.style.setProperty('--ol-cols', displayCols);
      grid.style.setProperty('--ol-rows', displayRows);
      trace.setAttribute('viewBox', '0 0 ' + (displayCols + 2 * edge) + ' ' + (displayRows + 2 * edge));
      drawTrace();
      const width = usableWidth - (side ? 96 + gap : !focused && landscape ? 147 : 0);
      const availableHeight = height - paddingHeight - (side ? 2 : toolbar.offsetHeight + gap + 2);
      const tall = focused ? availableHeight / (displayRows + 2 * edge)
        : landscape ? (height - 30) / (rows + 2 * edge) : mode.value === 'easy' ? 64 : 38;
      stage.style.setProperty('--ol-cell', Math.max(1, Math.min(width / (displayCols + 2 * edge), tall)) + 'px');
    }

    function paint(focus) {
      const fragment = document.createDocumentFragment();
      board.forEach((value, cell) => {
        const node = document.createElement(value > 0 ? 'button' : 'span');
        if (value > 0) {
          const [glyph, name] = tiles[value - 1];
          node.type = 'button';
          node.dataset.cell = cell;
          node.className = 'ol-tile';
          node.textContent = glyph;
          node.setAttribute('aria-label', name);
          node.setAttribute('aria-pressed', String(cell === selected));
        } else if (value < 0) {
          node.className = 'ol-reef';
          node.title = '礁石';
        } else node.setAttribute('aria-hidden', 'true');
        fragment.appendChild(node);
      });
      grid.replaceChildren(fragment);
      $('ol-left').textContent = remaining;
      if (focus) (grid.querySelector('button') || go).focus({preventScroll: true});
    }

    function bestStages() {
      try { return JSON.parse(localStorage.getItem(bestKey)) || {}; }
      catch (_) { return {}; }
    }

    function showRecord() {
      $('ol-best').textContent = Math.min(levels.length, Math.max(0, Number(bestStages()[mode.value]) || 0));
    }

    function updateButtons() {
      mode.disabled = oceanLinkBusy || rankStarting;
      go.disabled = !!rankPending;
      go.hidden = !between && resultPanel.hidden;
      hint.disabled = !oceanLinkBusy || between;
      $('ol-count').hidden = !oceanLinkBusy;
      $('ol-bonus').textContent = paid;
      const expanded = full.getAttribute('aria-pressed') === 'true';
      stage.classList.toggle('ol-board-focus', oceanLinkBusy && expanded);
      if (!expanded) full.textContent = '點一下全螢幕開始';
    }

    function drawTrace() {
      if (!activePath) return;
      const center = (index, count) => index === 0 ? edge / 2
        : index === count + 1 ? count + 1.5 * edge : index - .5 + edge;
      line.setAttribute('points', activePath.map(([x, y]) => {
        const horizontal = center(x, cols), vertical = center(y, rows);
        return transposed ? vertical + ',' + horizontal : horizontal + ',' + vertical;
      }).join(' '));
    }

    function clearTrace() {
      clearTimeout(traceTimer);
      activePath = null;
      line.removeAttribute('points');
      locked = false;
    }

    function stageRule() {
      return mode.value === 'easy' ? easyRule : levels[level - 1];
    }

    function dealLevel() {
      const [rule, direction, reefs] = stageRule();
      const layout = rules.reefBoard(reefs);
      remaining = (rows * cols - reefs * 4) / 2;
      const symbols = rules.shuffle(tiles.flatMap(([glyph], index) =>
        mode.value !== 'easy' || easyGlyphs.has(glyph) ? [index + 1] : []));
      if (mode.value === 'easy') symbols.length = level <= 3 ? 6 : level <= 6 ? 8 : 12;
      const bag = Array.from({length: remaining}, (_, index) => symbols[index % symbols.length]);
      rankActions = [];
      rankedLevel = ranked ? oceanLinkRankedLevel(level, ranked.state.seed) : null;
      ({board, moves} = rankedLevel || rules.deal(layout, bag, direction));
      selected = -1;
      between = false;
      hideResult();
      clearTrace();
      $('ol-rule').textContent = rule;
      $('ol-level').textContent = level;
      $('ol-left').textContent = remaining;
      grid.style.setProperty('--ol-edge-ratio', edge);
      playfield.hidden = false;
      updateButtons();
      sizeBoard();
      paint(true);
      say('選兩張相同的圖案。');
    }

    function params(extra = {}) {
      return {stage: level, step: level - Number(remaining > 0), mode: mode.value,
        total_bonus_points: paid, ...extra};
    }

    function rankStatus(message, retry = false) {
      const status = $('ol-rank-status');
      status.hidden = !message;
      status.textContent = message;
      $('ol-rank-retry').hidden = !retry;
    }

    async function submitLevel() {
      if (rankSending || !rankPending) return;
      rankSending = true;
      rankStatus('正在驗證排行榜成績…');
      const submission = rankPending;
      try {
        const api = await import('./frontend/services/api.mjs');
        const next = await api.moveBoardRound(submission.token, submission.move, AbortSignal.timeout(10000));
        if (next.revision === submission.move.revision) {
          ranked = null;
          rankStatus('排行榜成績未能送出。');
        } else {
          Object.assign(ranked, next);
          rankStatus('成績已送到排行榜。');
        }
        rankPending = null;
      } catch (error) {
        if (error.retryable === false) {
          ranked = null;
          rankPending = null;
        }
        rankStatus('排行榜成績未能送出。', !!rankPending);
      } finally {
        rankSending = false;
        updateButtons();
      }
    }

    async function start() {
      if ($('view-ocean-link').hidden || rankStarting || rankPending) return;
      if (oceanLinkBusy) {
        if (!between) return;
        level++;
        dealLevel();
        resumeClock();
        AN.resume(round, params());
        return;
      }
      ranked = null;
      rankStatus('');
      if (mode.value === 'easy' && location.protocol !== 'file:') {
        rankStarting = true;
        rankStatus('正在準備訪客排行…');
        updateButtons();
        try {
          const api = await import('./frontend/services/api.mjs');
          ranked = await api.startBoardRound('ocean-link', AbortSignal.timeout(4000));
        } catch {}
        rankStarting = false;
        if ($('view-ocean-link').hidden || full.getAttribute('aria-pressed') === 'false') {
          ranked = null;
          rankStatus('');
          updateButtons();
          return;
        }
        rankStatus(ranked ? '本局將列入訪客排行。' : '這一局可在本機遊玩。');
      }
      [rows, cols] = dimensions[mode.value];
      rules = oceanLinkBoard(rows, cols);
      stride = cols + 2;
      level = 1;
      paid = 0;
      go.textContent = '下一關';
      oceanLinkBusy = true;
      elapsedMs = 0;
      dealLevel();
      resumeClock();
      round = AN.start('ocean-link', 0, params());
    }

    function end(result) {
      if (!oceanLinkBusy) return;
      oceanLinkBusy = false;
      pauseClock();
      hideResult();
      AN.end(round, paid, result, params());
      round = null;
      between = false;
      clearTrace();
      playfield.hidden = true;
      grid.replaceChildren();
      go.textContent = '開始遠征';
      $('ol-rule').textContent = '深海連連看';
      updateButtons();
      say(result === 'win' ? '遠征完成！所有關卡已通過。' : '遠征已結束。');
      if (!$('view-ocean-link').hidden && result !== 'win') full.focus({preventScroll: true});
    }

    function completeLevel() {
      pauseClock();
      if (ranked) {
        rankPending = {
          token: ranked.token,
          move: {gameId: 'ocean-link', id: ranked.id, revision: ranked.revision, action: rankActions},
        };
        submitLevel();
      }
      try {
        const best = bestStages();
        if (!(best[mode.value] >= level)) {
          localStorage.setItem(bestKey, JSON.stringify({...best, [mode.value]: level}));
        }
      } catch (_) {}
      showRecord();
      const reward = bonuses.get(level) || 0;
      if (reward) {
        paid += reward;
        S.balance += reward;
        save();
        renderAll();
      }
      AN.progress(round, params({bonus_points: reward}), level < levels.length);
      if (level === levels.length) {
        end('win');
        showResult(reward, true);
        return;
      }
      between = true;
      updateButtons();
      say(reward ? '關卡完成！已獲得 5 點。' : '關卡完成！');
      showResult(reward, false);
    }

    function recover() {
      ({board, moves} = rankedLevel ? rankedLevel.recover(board) : rules.recover(board, stageRule()[1]));
    }

    function pick(event) {
      const tile = event.target.closest('button[data-cell]');
      if (!tile || !oceanLinkBusy || between || locked || $('view-ocean-link').hidden) return;
      const cell = Number(tile.dataset.cell), previous = selected;
      if (previous === cell || previous < 0 || board[previous] !== board[cell]) {
        if (previous >= 0) grid.children[previous].setAttribute('aria-pressed', 'false');
        selected = previous === cell ? -1 : cell;
        tile.setAttribute('aria-pressed', String(selected === cell));
        if (!tile.classList.contains('ol-hint')) clearHint();
        return;
      }
      const path = rules.linkPath(board, previous, cell);
      if (!path) {
        clearHint();
        say('這兩張圖案之間沒有可用路線。');
        return;
      }
      const followPlan = moves.length && moves[0].includes(previous) && moves[0].includes(cell);
      if (followPlan) moves.shift();
      else moves = [];
      activePath = path;
      drawTrace();
      locked = true;
      const keyboard = event.detail === 0;
      function matchTiles() {
        clearTrace();
        if (!oceanLinkBusy) return;
        if (ranked) rankActions.push(previous * 80 + cell);
        board[previous] = board[cell] = 0;
        selected = -1;
        remaining--;
        rules.slide(board, stageRule()[1]);
        let message = '配對成功。';
        if (remaining && !moves.length && !rules.findPair(board)) {
          recover();
          message = '沒有可配對的圖案，已自動洗牌。';
        }
        paint(keyboard && remaining > 0);
        if (remaining) say(message);
        else completeLevel();
      }
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) matchTiles();
      else traceTimer = setTimeout(matchTiles, 105);
    }

    function clearHint() {
      grid.querySelectorAll('.ol-hint').forEach(node => node.classList.remove('ol-hint'));
    }

    function showHint() {
      if (hint.disabled || locked || $('view-ocean-link').hidden) return;
      const pair = moves[0] || rules.findPair(board);
      if (!pair) return;
      if (selected >= 0) grid.children[selected].setAttribute('aria-pressed', 'false');
      selected = -1;
      clearHint();
      pair.forEach(cell => grid.children[cell].classList.add('ol-hint'));
      say('已標出一組可連線的圖案。');
    }

    function setExpanded(expanded) {
      stage.classList.toggle('ol-expanded', expanded);
      document.body.classList.toggle('ol-expanded', expanded);
      syncFull();
    }

    function syncFull() {
      const native = document.fullscreenElement === stage;
      stage.classList.toggle('ol-native-full', native);
      const expanded = native || stage.classList.contains('ol-expanded');
      const leaving = !expanded && full.getAttribute('aria-pressed') === 'true';
      full.setAttribute('aria-pressed', String(expanded));
      if (expanded) full.textContent = '離開全螢幕';
      const boardActions = $('ol-board-actions');
      const controls = expanded ? $('ol-toolbar-actions') : boardActions;
      const restoreFocus = document.activeElement === full;
      if (full.parentElement !== controls) controls.appendChild(full);
      boardActions.hidden = expanded;
      if (restoreFocus) full.focus({preventScroll: true});
      if (leaving) end('abandoned');
      updateButtons();
      sizeBoard();
    }

    async function toggleFull() {
      if (stage.classList.contains('ol-expanded')) { setExpanded(false); return; }
      if (document.fullscreenElement === stage) {
        await document.exitFullscreen().catch(() => {});
        return;
      }
      try {
        if (typeof stage.requestFullscreen === 'function') {
          await stage.requestFullscreen();
          if ($('view-ocean-link').hidden && document.fullscreenElement === stage) await document.exitFullscreen();
          return;
        }
      } catch (_) {}
      if (!$('view-ocean-link').hidden) setExpanded(true);
    }

    mode.addEventListener('change', showRecord);
    go.addEventListener('click', () => {
      if (!oceanLinkBusy && full.getAttribute('aria-pressed') === 'false') full.click();
      else start();
    });
    hint.addEventListener('click', showHint);
    $('ol-rank-retry').addEventListener('click', submitLevel);
    grid.addEventListener('click', pick);
    full.addEventListener('click', () => {
      const starting = !oceanLinkBusy && full.getAttribute('aria-pressed') === 'false';
      toggleFull();
      if (starting) start();
    });
    document.addEventListener('fullscreenchange', syncFull);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && stage.classList.contains('ol-expanded')) {
        setExpanded(false);
        full.focus({preventScroll: true});
      }
    });
    window.addEventListener('resize', sizeBoard);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', sizeBoard);
    if (window.ResizeObserver) {
      const observer = new ResizeObserver(sizeBoard);
      observer.observe(stage);
      observer.observe(stage.querySelector('.ol-toolbar'));
    }
    document.addEventListener('visibilitychange', () => { if (oceanLinkBusy && !document.hidden) updateClock(); });
    window.addEventListener('pageshow', () => { if (oceanLinkBusy) updateClock(); });
    window.addEventListener('pagehide', event => { if (!event.persisted) end('abandoned'); }, {capture: true});

    return function routeOceanLink(active) {
      if (active) { sizeBoard(); showRecord(); }
      else {
        end('abandoned');
        if (stage.classList.contains('ol-expanded')) setExpanded(false);
        if (document.fullscreenElement === stage) document.exitFullscreen().catch(() => {});
      }
    };
  })();
