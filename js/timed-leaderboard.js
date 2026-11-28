  function timedLeaderboard(gameId, prefix, inputCount, refresh, onSaved, options = {}) {
    let round, pending, starting = false, sending = false;
    let tick = 0, carry = 0, actions = [];
    // Result sharing: the score is offered when the round ends and upgraded once verified.
    // Optional so this file still runs alone (unit tests load it without the share module).
    const share = typeof resultShare === 'undefined' ? null : resultShare;
    share?.ranked(gameId);
    function capture() {
      const source = options.canvas && $(options.canvas);
      if (!source) return share?.capture(gameId) ?? null;
      const copy = document.createElement('canvas');
      copy.width = source.width; copy.height = source.height;
      try { copy.getContext('2d').drawImage(source, 0, 0); } catch { return null; }
      return copy;
    }
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
      share?.clear(gameId);
      if (typeof location === 'undefined' || location.protocol === 'file:') {
        begin(null, callback);
        return;
      }
      starting = true;
      status('{{t:timed-leaderboard.msg.001}}');
      refresh();
      let rank = null;
      try {
        const api = await import('./frontend/services/api.mjs');
        rank = await api.startBoardRound(gameId, AbortSignal.timeout(4000), settings);
      } catch {}
      starting = false;
      if ($('view-' + gameId).hidden) { status(''); refresh(); cancel?.(); return; }
      status(rank ? '{{t:timed-leaderboard.msg.002}}' : '{{t:timed-leaderboard.msg.003}}');
      begin(rank, callback);
    }
    function fallBack() {
      round = null;
      status('{{t:timed-leaderboard.msg.003}}');
    }
    function record(input) {
      if (!round) return;
      if (actions.length >= Math.min(timedReplay.MAX_INPUTS, options.maxInputs ?? timedReplay.MAX_INPUTS)) { fallBack(); return; }
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
      const score = pending.score;
      sending = true;
      status('{{t:timed-leaderboard.msg.004}}');
      refresh();
      try {
        const api = await import('./frontend/services/api.mjs');
        const next = await api.moveBoardRound(pending.token, pending.move, AbortSignal.timeout(10000));
        const saved = next.state.score === pending.score;
        status(saved ? '{{t:timed-leaderboard.msg.005}}' : '{{t:timed-leaderboard.msg.006}}');
        share?.verify(gameId, score, saved ? {roundId: pending.move.id, token: pending.token} : null);
        if (saved) onSaved?.();
        pending = null;
      } catch (error) {
        if (error.retryable === false) pending = null;
        status('{{t:timed-leaderboard.msg.006}}', !!pending);
        // Share as an unverified result for now; a successful retry upgrades the link.
        share?.verify(gameId, score, null);
      } finally {
        sending = false;
        refresh();
      }
    }
    function finish(score, endedOnInput = false) {
      const snapshot = share && capture();
      if (!round) { share?.offer(gameId, score, false, snapshot); return; }
      share?.offer(gameId, score, true, snapshot);
      pending = {score, token: round.token, move: {id: round.id, gameId, revision: round.revision, action: [tick + Number(endedOnInput), ...actions]}};
      send();
    }
    $(prefix + '-rank-retry').addEventListener('click', send);
    return { start, record, update, finish, busy: () => starting || sending };
  }
