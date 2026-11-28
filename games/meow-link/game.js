  /* ---------- Meow Link ---------- */
  let meowLinkBusy = false;
  const meowLinkRoute = (function () {
    let rows = 14, cols = 18, stride = cols + 2;
{{include:games/meow-link/tiles.js}}{{include:shared/meow-link-rules.cjs}}
    let rules = meowLinkBoard(rows, cols);
    const {levels} = rules;
    const stage = $('ml-stage'), playfield = $('ml-playfield'), grid = $('ml-board');
    const go = $('ml-go'), mode = $('ml-mode'), hint = $('ml-hint');
    const full = $('ml-full'), trace = $('ml-trace'), line = trace.querySelector('polyline');
    const clock = $('ml-clock'), clockValue = $('ml-time');
    const resultPanel = $('ml-result'), resultTitle = $('ml-result-title');
    const edge = 0.3;
    const dimensions = {easy: [6, 8], standard: [14, 18], challenge: [16, 26]};
    const easyRule = [levels[0][0], null, 0];
    const bonuses = new Map([[3, 5], [6, 5], [10, 5]]);
    const bestKey = 'deep-sea-meow-link-best-v1';
    let level = 1, remaining = 0, paid = 0, board = [], selected = -1;
    let ranked = null, rankedLevel = null, rankStarting = false, rankSending = false, rankPending = null;
    let rankActions = [];
    let awarded = new Set();
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
      stage.classList.remove('ml-showing-result');
      hint.before(go);
      clock.hidden = false;
    }

    function showResult(reward, finished) {
      playfield.hidden = true;
      clock.hidden = true;
      resultTitle.textContent = finished ? '{{t:meow-link.msg.001}}' : '{{t:meow-link.msg.002}}';
      $('ml-result-level').textContent = level;
      $('ml-result-time').textContent = clockValue.textContent;
      $('ml-result-time').dateTime = clockValue.dateTime;
      $('ml-result-reward').hidden = !reward;
      $('ml-result-actions').appendChild(go);
      resultPanel.hidden = false;
      go.hidden = false;
      stage.classList.add('ml-showing-result');
      resultTitle.focus();
    }

    function say(message) { $('ml-msg').textContent = message; }

    function sizeBoard() {
      if (playfield.hidden || $('view-meow-link').hidden) return;
      const view = window.visualViewport;
      const height = view ? view.height : window.innerHeight;
      const style = getComputedStyle(stage);
      const usableWidth = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const landscape = matchMedia('(orientation: landscape) and (max-height: 540px)').matches;
      const focused = stage.classList.contains('ml-board-focus');
      const toolbar = stage.querySelector('.ml-toolbar');
      const paddingHeight = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const gap = parseFloat(style.gap);
      const side = focused && matchMedia('(orientation: landscape)').matches;
      transposed = focused && matchMedia('(orientation: portrait) and (max-width: 600px)').matches;
      const displayCols = transposed ? rows : cols;
      const displayRows = transposed ? cols : rows;
      grid.classList.toggle('ml-transposed', transposed);
      grid.style.setProperty('--ml-cols', displayCols);
      grid.style.setProperty('--ml-rows', displayRows);
      trace.setAttribute('viewBox', '0 0 ' + (displayCols + 2 * edge) + ' ' + (displayRows + 2 * edge));
      drawTrace();
      const width = usableWidth - (side ? 96 + gap : !focused && landscape ? 147 : 0);
      const availableHeight = height - paddingHeight - (side ? 2 : toolbar.offsetHeight + gap + 2);
      const tall = focused ? availableHeight / (displayRows + 2 * edge)
        : landscape ? (height - 30) / (rows + 2 * edge) : mode.value === 'easy' ? 64 : 38;
      stage.style.setProperty('--ml-cell', Math.max(1, Math.min(width / (displayCols + 2 * edge), tall)) + 'px');
    }

    function paint(focus) {
      const fragment = document.createDocumentFragment();
      board.forEach((value, cell) => {
        const node = document.createElement(value > 0 ? 'button' : 'span');
        if (value > 0) {
          const [glyph, name] = tiles[value - 1];
          node.type = 'button';
          node.dataset.cell = cell;
          node.className = 'ml-tile';
          const image = document.createElement('img');
          image.src = 'games/meow-link/art/' + glyph;
          image.alt = ''; image.draggable = false;
          image.decoding = 'async';
          node.appendChild(image);
          node.setAttribute('aria-label', name);
          node.setAttribute('aria-pressed', String(cell === selected));
        } else if (value < 0) {
          node.className = 'ml-reef';
          node.title = '{{t:meow-link.msg.003}}';
        } else node.setAttribute('aria-hidden', 'true');
        fragment.appendChild(node);
      });
      grid.replaceChildren(fragment);
      $('ml-left').textContent = remaining;
      if (focus) (grid.querySelector('button') || go).focus({preventScroll: true});
    }

    function bestStages() {
      try { return JSON.parse(localStorage.getItem(bestKey)) || {}; }
      catch (_) { return {}; }
    }

    function showRecord() {
      $('ml-best').textContent = Math.min(levels.length, Math.max(0, Number(bestStages()[mode.value]) || 0));
    }

    function updateButtons() {
      mode.disabled = meowLinkBusy || rankStarting;
      go.disabled = !!rankPending;
      go.hidden = !between && resultPanel.hidden;
      hint.disabled = !meowLinkBusy || between;
      $('ml-count').hidden = !meowLinkBusy;
      $('ml-bonus').textContent = paid;
      const expanded = full.getAttribute('aria-pressed') === 'true';
      stage.classList.toggle('ml-board-focus', meowLinkBusy && expanded);
      if (!expanded) full.textContent = '{{t:meow-link.msg.004}}';
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
      const rule = mode.value === 'easy' ? easyRule : levels[level - 1];
      const labels = {
        '毛線障礙': '{{t:meow-link.msg.003}}',
        '毛線障礙與左移': '{{t:meow-link.rule.1}}',
        '毛線障礙與下移': '{{t:meow-link.rule.2}}'
      };
      return [labels[rule[0]] || rule[0], rule[1], rule[2]];
    }

    function dealLevel() {
      const [rule, direction, reefs] = stageRule();
      const layout = rules.reefBoard(reefs);
      remaining = (rows * cols - reefs * 4) / 2;
      const poolSize = {easy: 12, standard: 24, challenge: 36}[mode.value];
      const symbols = rules.shuffle(Array.from({length: poolSize}, (_, i) => i + 1));
      const bag = Array.from({length: remaining}, (_, index) => symbols[index % symbols.length]);
      rankActions = [];
      rankedLevel = ranked ? meowLinkRankedLevel(level, ranked.state.seed) : null;
      ({board, moves} = rankedLevel || rules.deal(layout, bag, direction));
      selected = -1;
      between = false;
      hideResult();
      clearTrace();
      $('ml-rule').textContent = rule;
      $('ml-level').textContent = level;
      $('ml-left').textContent = remaining;
      grid.style.setProperty('--ml-edge-ratio', edge);
      playfield.hidden = false;
      updateButtons();
      sizeBoard();
      paint(true);
      say('{{t:meow-link.msg.005}}');
    }

    function params(extra = {}) {
      return {stage: level, step: level - Number(remaining > 0), mode: mode.value,
        total_bonus_points: paid, ...extra};
    }

    function rankStatus(message, retry = false) {
      const status = $('ml-rank-status');
      status.hidden = !message;
      status.textContent = message;
      $('ml-rank-retry').hidden = !retry;
    }

    async function submitLevel() {
      if (rankSending || !rankPending) return;
      rankSending = true;
      rankStatus('{{t:meow-link.msg.006}}');
      const submission = rankPending;
      try {
        const api = await import('./frontend/services/api.mjs');
        const next = await api.moveBoardRound(submission.token, submission.move, AbortSignal.timeout(10000));
        if (next.revision === submission.move.revision) {
          ranked = null;
          rankStatus('{{t:meow-link.msg.007}}');
        } else {
          Object.assign(ranked, next);
          rankStatus('{{t:meow-link.msg.008}}');
        }
        rankPending = null;
      } catch (error) {
        if (error.retryable === false) {
          ranked = null;
          rankPending = null;
        }
        rankStatus('{{t:meow-link.msg.007}}', !!rankPending);
      } finally {
        rankSending = false;
        updateButtons();
      }
    }

    async function start() {
      if ($('view-meow-link').hidden || rankStarting || rankPending) return;
      if (meowLinkBusy) {
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
        rankStatus('{{t:meow-link.msg.009}}');
        updateButtons();
        try {
          const api = await import('./frontend/services/api.mjs');
          ranked = await api.startBoardRound('meow-link', AbortSignal.timeout(4000));
        } catch {}
        rankStarting = false;
        if ($('view-meow-link').hidden || full.getAttribute('aria-pressed') === 'false') {
          ranked = null;
          rankStatus('');
          updateButtons();
          return;
        }
        rankStatus(ranked ? '{{t:meow-link.msg.010}}' : '{{t:meow-link.msg.011}}');
      }
      [rows, cols] = dimensions[mode.value];
      rules = meowLinkBoard(rows, cols);
      stride = cols + 2;
      level = 1;
      paid = 0;
      awarded = new Set();
      go.textContent = '{{t:meow-link.msg.012}}';
      meowLinkBusy = true;
      elapsedMs = 0;
      dealLevel();
      resumeClock();
      round = AN.start('meow-link', 0, params());
    }

    function end(result) {
      if (!meowLinkBusy) return;
      meowLinkBusy = false;
      pauseClock();
      hideResult();
      AN.end(round, paid, result, params());
      round = null;
      between = false;
      clearTrace();
      playfield.hidden = true;
      grid.replaceChildren();
      go.textContent = '{{t:meow-link.msg.013}}';
      $('ml-rule').textContent = '{{t:meow-link.msg.014}}';
      updateButtons();
      say(result === 'win' ? '{{t:meow-link.msg.015}}' : '{{t:meow-link.msg.016}}');
      if (!$('view-meow-link').hidden && result !== 'win') full.focus({preventScroll: true});
    }

    function completeLevel() {
      if (!meowLinkBusy || between || remaining !== 0) return;
      pauseClock();
      if (ranked) {
        rankPending = {
          token: ranked.token,
          move: {gameId: 'meow-link', id: ranked.id, revision: ranked.revision, action: rankActions},
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
      const reward = awarded.has(level) ? 0 : bonuses.get(level) || 0;
      awarded.add(level);
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
      say(reward ? '{{t:meow-link.msg.017}}' : '{{t:meow-link.msg.018}}');
      showResult(reward, false);
    }

    function recover() {
      ({board, moves} = rankedLevel ? rankedLevel.recover(board) : rules.recover(board, stageRule()[1]));
    }

    function pick(event) {
      const tile = event.target.closest('button[data-cell]');
      if (!tile || !meowLinkBusy || between || locked || $('view-meow-link').hidden) return;
      const cell = Number(tile.dataset.cell), previous = selected;
      if (previous === cell || previous < 0 || board[previous] !== board[cell]) {
        if (previous >= 0) grid.children[previous].setAttribute('aria-pressed', 'false');
        selected = previous === cell ? -1 : cell;
        tile.setAttribute('aria-pressed', String(selected === cell));
        if (!tile.classList.contains('ml-hint')) clearHint();
        return;
      }
      const path = rules.linkPath(board, previous, cell);
      if (!path) {
        clearHint();
        say('{{t:meow-link.msg.019}}');
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
        if (!meowLinkBusy) return;
        if (ranked) rankActions.push(previous * 80 + cell);
        board[previous] = board[cell] = 0;
        selected = -1;
        remaining--;
        rules.slide(board, stageRule()[1]);
        let message = '{{t:meow-link.msg.020}}';
        if (remaining && !moves.length && !rules.findPair(board)) {
          recover();
          message = '{{t:meow-link.msg.021}}';
        }
        paint(keyboard && remaining > 0);
        if (remaining) say(message);
        else completeLevel();
      }
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) matchTiles();
      else traceTimer = setTimeout(matchTiles, 105);
    }

    function clearHint() {
      grid.querySelectorAll('.ml-hint').forEach(node => node.classList.remove('ml-hint'));
    }

    function showHint() {
      if (hint.disabled || locked || $('view-meow-link').hidden) return;
      const pair = moves[0] || rules.findPair(board);
      if (!pair) return;
      if (selected >= 0) grid.children[selected].setAttribute('aria-pressed', 'false');
      selected = -1;
      clearHint();
      pair.forEach(cell => grid.children[cell].classList.add('ml-hint'));
      say('{{t:meow-link.msg.022}}');
    }

    function setExpanded(expanded) {
      stage.classList.toggle('ml-expanded', expanded);
      document.body.classList.toggle('ml-expanded', expanded);
      syncFull();
    }

    function syncFull() {
      const native = document.fullscreenElement === stage;
      stage.classList.toggle('ml-native-full', native);
      const expanded = native || stage.classList.contains('ml-expanded');
      const leaving = !expanded && full.getAttribute('aria-pressed') === 'true';
      full.setAttribute('aria-pressed', String(expanded));
      if (expanded) full.textContent = '{{t:meow-link.msg.023}}';
      const boardActions = $('ml-board-actions');
      const controls = expanded ? $('ml-toolbar-actions') : boardActions;
      const restoreFocus = document.activeElement === full;
      if (full.parentElement !== controls) controls.appendChild(full);
      boardActions.hidden = expanded;
      if (restoreFocus) full.focus({preventScroll: true});
      if (leaving) end('abandoned');
      updateButtons();
      sizeBoard();
    }

    async function toggleFull() {
      setExpanded(!stage.classList.contains('ml-expanded'));
    }

    mode.addEventListener('change', showRecord);
    go.addEventListener('click', () => {
      if (!meowLinkBusy && full.getAttribute('aria-pressed') === 'false') full.click();
      else start();
    });
    hint.addEventListener('click', showHint);
    $('ml-rank-retry').addEventListener('click', submitLevel);
    grid.addEventListener('click', pick);
    full.addEventListener('click', () => {
      const starting = !meowLinkBusy && full.getAttribute('aria-pressed') === 'false';
      toggleFull();
      if (starting) start();
    });
    document.addEventListener('fullscreenchange', syncFull);
    window.addEventListener('resize', sizeBoard);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', sizeBoard);
    if (window.ResizeObserver) {
      const observer = new ResizeObserver(sizeBoard);
      observer.observe(stage);
      observer.observe(stage.querySelector('.ml-toolbar'));
    }
    document.addEventListener('visibilitychange', () => { if (meowLinkBusy && !document.hidden) updateClock(); });
    window.addEventListener('pageshow', () => { if (meowLinkBusy) updateClock(); });
    window.addEventListener('pagehide', event => { if (!event.persisted) end('abandoned'); }, {capture: true});

    return function routeMeowLink(active) {
      if (active) { sizeBoard(); showRecord(); }
      else {
        end('abandoned');
        if (stage.classList.contains('ml-expanded')) setExpanded(false);
        if (document.fullscreenElement === stage) document.exitFullscreen().catch(() => {});
      }
    };
  })();
