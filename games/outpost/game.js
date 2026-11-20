  const outpostRoute = (() => {
    const id = 'outpost', bestKey = 'deep-sea-outpost-best-v1', rules = outpostRules;
    const board = $('outpost-board'), start = $('outpost-start'), message = $('outpost-message');
    const tools = Array.from(document.querySelectorAll('#view-outpost [data-device]'));
    const directions = Array.from(document.querySelectorAll('#view-outpost [data-direction]'));
    const names = ['{{t:outpost.msg.001}}', '{{t:outpost.msg.002}}', '{{t:outpost.msg.003}}', '{{t:outpost.msg.004}}'];
    const stagePicker = $('outpost-stage'), next = $('outpost-next');
    const stageKey = 'deep-sea-outpost-unlocked-v1';
    let unlocked = 1;
    try {
      const saved = Number(localStorage.getItem(stageKey));
      if (Number.isInteger(saved) && saved > 1 && saved <= rules.stageCount) unlocked = saved;
    } catch {}
    const guideKey = 'deep-sea-outpost-guide-v1', cannonCell = rules.COLS + 1, gateCell = rules.COLS - 1;
    const prompts = {
      intro: '{{t:outpost.msg.005}}',
      cannonTool: '{{t:outpost.msg.006}}',
      cannonPad: '{{t:outpost.msg.007}}',
      gateTool: '{{t:outpost.msg.008}}',
      gatePad: '{{t:outpost.msg.009}}',
      waiting: '{{t:outpost.msg.010}}',
      pulse: '{{t:outpost.msg.011}}',
    };
    let guide = 'intro';
    try { if (localStorage.getItem(guideKey) === '1') guide = ''; } catch {}
    const cells = [], layers = [], markers = new Map(), written = new WeakMap();
    let state = rules.create(), phase = 'ready', selected = 0, direction = 1;
    let best = 0, round, frameId, last, carry = 0;
    let feedback = '{{t:outpost.msg.012}}';
    try { best = Math.max(0, Number(localStorage.getItem(bestKey)) || 0); } catch {}
    const rank = timedLeaderboard(id, id, rules.inputCount, render);
    const active = () => phase === 'playing';
    const ticking = () => active() && (!guide || guide === 'waiting');
    const screenX = x => 4 + 92 * x / rules.LENGTH;

    function endGuide() {
      guide = '';
      try { localStorage.setItem(guideKey, '1'); } catch {}
    }

    $('outpost-guide-skip').addEventListener('click', () => {
      endGuide();
      render();
    });

    for (let lane = 0; lane < rules.LANES; lane++) {
      const row = document.createElement('div');
      row.className = 'outpost-lane';
      for (let col = 0; col < rules.COLS; col++) {
        const cell = lane * rules.COLS + col;
        const button = document.createElement('button');
        button.type = 'button';
        // Center the build pads on the same coordinates as the simulation.
        button.style.gridColumn = col + 1;
        const symbol = document.createElement('span');
        symbol.className = 'outpost-pad-symbol';
        symbol.setAttribute('aria-hidden', 'true');
        button.append(symbol);
        button.addEventListener('click', () => operate(cell));
        cells.push(button);
        row.append(button);
      }
      const layer = document.createElement('div');
      layer.className = 'outpost-enemies';
      layer.setAttribute('aria-hidden', 'true');
      layers.push(layer);
      row.append(layer);
      board.append(row);
    }

    function write(element, value) {
      const text = String(value);
      if (written.get(element) === text) return;
      written.set(element, text);
      element.textContent = text;
    }

    function attack(type, lane, from, to) {
      const effect = document.createElement('span');
      effect.className = 'outpost-attack';
      effect.dataset.type = type;
      effect.style.left = Math.min(screenX(from), screenX(to)) + '%';
      effect.style.width = Math.abs(screenX(from) - screenX(to)) + '%';
      effect.classList.toggle('outpost-attack-left', to < from);
      layers[lane].append(effect);
      effect.addEventListener('animationend', () => effect.remove(), {once: true});
    }

    function render() {
      const ranked = state.stage === 1;
      stagePicker.disabled = phase === 'playing' || phase === 'paused' || rank.busy();
      for (const option of stagePicker.options) option.disabled = Number(option.value) > unlocked;
      next.hidden = !state.won || state.stage >= rules.stageCount;
      next.disabled = rank.busy();
      $('outpost-rank').hidden = !ranked;
      $('outpost-best-stat').hidden = !ranked;
      write($('outpost-stage-mode'), ranked ? '{{t:outpost.msg.013}}' : '{{t:outpost.msg.014}}');
      $('outpost-guide').hidden = !guide || !ranked;
      if (guide) write($('outpost-guide-text'), prompts[guide]);
      $('outpost-current').hidden = guide !== 'pulse' || !active();
      message.hidden = !!guide && active();
      const guidedCell = {cannonPad: cannonCell, gatePad: gateCell, pulse: gateCell}[guide];
      const guidedTool = {cannonTool: 0, gateTool: 3}[guide];
      const seconds = Math.ceil((rules.END - state.tick) / 100);
      write($('outpost-time'), [Math.floor(seconds / 60), seconds % 60].map(n => String(n).padStart(2, '0')).join(':'));
      write($('outpost-wave'), rules.wave(state));
      write($('outpost-energy'), state.energy);
      write($('outpost-hull'), state.hull + '/5');
      write($('outpost-best'), best);
      write($('outpost-score'), rules.score(state));
      write(message, feedback);
      write(start, {ready: '{{t:outpost.msg.015}}', playing: '{{t:outpost.msg.016}}', paused: '{{t:outpost.msg.017}}', ended: '{{t:outpost.msg.018}}'}[phase]);
      start.disabled = rank.busy();
      $('outpost-direction').hidden = selected !== 3 || !active();
      tools.forEach((button, i) => {
        button.disabled = !active() || (!!guide && i !== guidedTool);
        button.dataset.guide = active() && i === guidedTool;
        button.setAttribute('aria-pressed', String(i === selected));
      });
      tools[3].dataset.gateDirection = direction < 0 ? 'up' : 'down';
      directions.forEach(button => {
        button.disabled = !!guide;
        button.setAttribute('aria-pressed', String(Number(button.dataset.direction) === direction));
      });
      cells.forEach((button, cell) => {
        const device = state.devices[cell], gate = device?.type === 3;
        const left = gate ? Math.max(0, Math.ceil((device.ready - state.tick) / 100)) : 0;
        button.disabled = !active() || (!!guide && cell !== guidedCell);
        button.dataset.guide = active() && cell === guidedCell;
        button.dataset.built = !!device;
        button.dataset.deviceType = device?.type ?? '';
        button.dataset.upgraded = !!device?.upgraded;
        button.dataset.upgradeReady = state.stage > 1 && rules.wave(state) >= 2 &&
          (device?.type === 0 || device?.type === 2) && !device.upgraded && state.energy >= rules.upgradeCost;
        button.dataset.ready = gate && !left && rules.gateTargets(state, cell).length > 0;
        write(button.firstElementChild, gate ? (device.direction < 0 ? '↑' : '↓') + (left || '') : device ? '' : '+');
        const name = names[device?.type] || '{{t:outpost.msg.019}}';
        const label = device?.upgraded ? name + ' · ' + '{{t:outpost.msg.020}}' : button.dataset.upgradeReady === 'true' ?
          name + ' · ' + '{{t:outpost.msg.021}}' : name;
        const location = String(Math.floor(cell / rules.COLS) + 1) + ' · ' + (cell % rules.COLS + 1);
        if (button.dataset.label !== label) {
          button.dataset.label = label;
          button.setAttribute('aria-label', location + ' · ' + label);
        }
      });
      const remaining = new Set(markers.keys());
      for (const enemy of state.enemies) {
        let marker = markers.get(enemy.id);
        if (!marker) {
          marker = document.createElement('span');
          marker.className = 'outpost-enemy';
          marker.dataset.type = enemy.type;
          marker.append(document.createElement('i'));
          markers.set(enemy.id, marker);
        }
        const targetLayer = layers[enemy.lane];
        if (marker.parentElement !== targetLayer) {
          const priorLayer = marker.parentElement;
          targetLayer.append(marker);
          if (priorLayer) {
            const offset = priorLayer.getBoundingClientRect().bottom - targetLayer.getBoundingClientRect().bottom;
            const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
            marker.animate([
              {transform: `translate(-50%, ${reducedMotion ? 0 : offset}px)`, filter: 'drop-shadow(0 0 5px #d7fff4)'},
              {transform: 'translate(-50%, 0)', filter: 'drop-shadow(0 0 3px #49bda7)', offset: .7},
              {transform: 'translate(-50%, 0)'},
            ], {duration: reducedMotion ? 160 : 430, easing: 'ease-out'});
          }
        }
        marker.style.left = screenX(enemy.x) + '%';
        marker.dataset.marked = enemy.marked > state.tick;
        marker.dataset.diverted = enemy.diverted;
        marker.firstChild.style.width = (100 * enemy.hp / (enemy.maxHp || rules.health[enemy.type])) + '%';
        remaining.delete(enemy.id);
      }
      for (const key of remaining) {
        markers.get(key).remove();
        markers.delete(key);
      }
    }

    function operate(cell) {
      if (!active()) return;
      const device = state.devices[cell];
      if (state.stage > 1 && rules.wave(state) >= 2 && (device?.type === 0 || device?.type === 2)) {
        feedback = rules.upgrade(state, cell) ? '{{t:outpost.msg.022}}' :
          device.upgraded ? '{{t:outpost.msg.023}}' : '{{t:outpost.msg.024}}';
        render();
        return;
      }
      const action = device?.type === 3 ? 5 : selected === 3 && direction === 1 ? 4 : selected;
      const code = cell * 6 + action;
      if (!rules.input(state, code)) {
        feedback = device?.type === 3 ? '{{t:outpost.msg.025}}' :
          device ? '{{t:outpost.msg.026}}' : state.energy < rules.costs[selected] ? '{{t:outpost.msg.027}}' : '{{t:outpost.msg.028}}';
      } else {
        if (state.stage === 1) rank.record(code);
        feedback = action === 5 ? '{{t:outpost.msg.029}}' : '{{t:outpost.msg.030}}';
        if (guide === 'cannonPad') guide = 'gateTool';
        else if (guide === 'gatePad') guide = 'waiting';
        else if (guide === 'pulse') {
          endGuide();
          feedback = '{{t:outpost.msg.031}}';
        }
      }
      render();
    }

    function tracking() {
      return {stage: state.stage, step: rules.wave(state), score: rules.score(state)};
    }

    function finish() {
      phase = 'ended';
      feedback = state.won ? '{{t:outpost.msg.032}}' : '{{t:outpost.msg.033}}';
      const score = rules.score(state);
      if (state.won && state.stage === rules.stageCount) feedback = '{{t:outpost.msg.034}}';
      if (state.won && state.stage === unlocked && unlocked < rules.stageCount) {
        unlocked++;
        try { localStorage.setItem(stageKey, String(unlocked)); } catch {}
      }
      if (state.stage === 1 && score > best) {
        best = score;
        try { localStorage.setItem(bestKey, String(best)); } catch {}
      }
      AN.end(round, 0, state.won ? 'complete' : 'loss', tracking());
      round = null;
      if (state.stage === 1) rank.finish(score);
    }

    function animate(now) {
      const elapsed = last === undefined ? 0 : Math.min(now - last, 100);
      last = now;
      if (ticking()) carry += elapsed;
      const previous = rules.wave(state);
      while (carry >= timedReplay.STEP_MS && ticking()) {
        carry -= timedReplay.STEP_MS;
        const step = () => {
          rules.advanceWithEffects(state, attack);
          if (guide === 'waiting' && rules.gateTargets(state, gateCell).length) guide = 'pulse';
          if (state.dead) finish();
        };
        if (state.stage === 1) rank.update(timedReplay.STEP_MS, ticking, step);
        else step();
      }
      if (active() && rules.wave(state) !== previous) {
        if (state.stage > 1 && rules.wave(state) === 2) feedback = '{{t:outpost.msg.035}}';
        AN.progress(round, tracking());
      }
      render();
      if (active()) frameId = requestAnimationFrame(animate);
    }

    function play(resuming) {
      phase = 'playing';
      feedback = '{{t:outpost.msg.036}}';
      if (resuming) AN.resume(round, tracking());
      else round = AN.start(id, 0, tracking());
      last = undefined;
      frameId = requestAnimationFrame(animate);
      render();
    }

    function pause() {
      if (!active()) return;
      cancelAnimationFrame(frameId);
      phase = 'paused';
      feedback = '{{t:outpost.msg.037}}';
      AN.progress(round, tracking(), true);
      render();
    }

    start.addEventListener('click', () => {
      if ($('view-outpost').hidden || rank.busy()) return;
      if (active()) { pause(); return; }
      if (phase === 'paused') { play(true); return; }
      const begin = () => {
        state = rules.createStage(state.stage);
        carry = 0;
        selected = 0;
        direction = 1;
        if (state.stage === 1 && guide === 'intro') guide = 'cannonTool';
        play(false);
        if (document.hidden || !document.hasFocus()) pause();
      };
      if (state.stage === 1) rank.start(begin);
      else begin();
    });

    function chooseStage(stage) {
      if (stagePicker.disabled || !Number.isInteger(stage) || stage < 1 || stage > unlocked) return;
      if (stage !== 1 && guide) endGuide();
      state = rules.createStage(stage);
      phase = 'ready';
      selected = 0;
      stagePicker.value = String(stage);
      feedback = stage === 1 ? '{{t:outpost.msg.012}}' : '{{t:outpost.msg.038}}';
      render();
    }

    stagePicker.addEventListener('change', () => chooseStage(Number(stagePicker.value)));
    next.addEventListener('click', () => chooseStage(state.stage + 1));
    tools.forEach(button => button.addEventListener('click', () => {
      selected = Number(button.dataset.device);
      if (guide === 'cannonTool') guide = 'cannonPad';
      else if (guide === 'gateTool') guide = 'gatePad';
      render();
    }));
    directions.forEach(button => button.addEventListener('click', () => {
      direction = Number(button.dataset.direction);
      render();
    }));
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
    window.addEventListener('blur', pause);
    window.addEventListener('pagehide', pause);
    window.addEventListener('arcade-languagechange', render);
    render();
    return shown => { if (!shown) pause(); };
  })();
