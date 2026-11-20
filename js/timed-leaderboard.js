  function timedLeaderboard(gameId, prefix, inputCount, refresh, onSaved) {
    let round, pending, starting = false, sending = false;
    let tick = 0, carry = 0, actions = [];
    function status(message, retry = false) {
      const label = $(prefix + '-rank-status');
      label.hidden = !message;
      label.textContent = message;
      $(prefix + '-rank-retry').hidden = !retry;
    }
    function begin(rank, callback) {
      round = rank;
      tick = 0; carry = 0; actions = [];
      callback(rank ? timedReplay.seeded(rank.state.seed) : null);
    }
    async function start(callback, cancel, settings) {
      if (starting || sending) return;
      pending = null;
      if (typeof location === 'undefined' || location.protocol === 'file:') {
        begin(null, callback);
        return;
      }
      starting = true;
      status('正在準備訪客排行…');
      refresh();
      let rank = null;
      try {
        const api = await import('./frontend/services/api.mjs');
        rank = await api.startBoardRound(gameId, AbortSignal.timeout(4000), settings);
      } catch {}
      starting = false;
      if ($('view-' + gameId).hidden) { status(''); refresh(); cancel?.(); return; }
      status(rank ? '本局將列入訪客排行。' : '這一局可在本機遊玩。');
      begin(rank, callback);
    }
    function fallBack() {
      round = null;
      status('這一局可在本機遊玩。');
    }
    function record(input) {
      if (!round) return;
      if (actions.length >= timedReplay.MAX_INPUTS) { fallBack(); return; }
      actions.push(tick * inputCount + input);
    }
    function update(ms, active, step) {
      if (!round || !active()) { step(ms / 1000); return; }
      carry += ms;
      while (carry >= timedReplay.STEP_MS && active()) {
        carry -= timedReplay.STEP_MS;
        tick++;
        step(timedReplay.STEP_MS / 1000);
        if (tick >= timedReplay.MAX_TICKS && active()) { fallBack(); return; }
      }
    }
    async function send() {
      if (!pending || sending) return;
      sending = true;
      status('正在驗證排行榜成績…');
      refresh();
      try {
        const api = await import('./frontend/services/api.mjs');
        const next = await api.moveBoardRound(round.token, pending.move, AbortSignal.timeout(10000));
        const saved = next.state.score === pending.score;
        status(saved ? '成績已送到排行榜。' : '排行榜成績未能送出。');
        if (saved) onSaved?.();
        pending = null;
      } catch (error) {
        if (error.retryable === false) pending = null;
        status('排行榜成績未能送出。', !!pending);
      } finally {
        sending = false;
        refresh();
      }
    }
    function finish(score, endedOnInput = false) {
      if (!round) return;
      pending = {score, move: {id: round.id, gameId, revision: round.revision, action: [tick + Number(endedOnInput), ...actions]}};
      send();
    }
    $(prefix + '-rank-retry').addEventListener('click', send);
    return { start, record, update, finish, busy: () => starting || sending };
  }
