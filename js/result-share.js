  /* ---------- Result sharing: one share button per game view, filled in when a round ends ----------
     Games on timedLeaderboard report their score (and later the verified round) through
     resultShare.offer/verify. Every other game is picked up from AN.end via deepSeaRoundEnd,
     using the score parameter named in shared/share-games.mjs. */
  var resultShare = (function(){
    var IGNORED = ['abandoned', 'restart', 'cancelled'];
    var rankGames = {}, states = {}, sdk = null;
    function loadSdk(){
      if (!sdk) sdk = import('./frontend/services/share.mjs').catch(function(){ sdk = null; return null; });
      return sdk;
    }
    // Copy the largest canvas in the view (or a same-origin game iframe) before overlays are drawn.
    function capture(gameId){
      var view = $('view-' + gameId);
      if (!view) return null;
      var list = [].slice.call(view.querySelectorAll('canvas'));
      [].forEach.call(view.querySelectorAll('iframe'), function(frame){
        try { list = list.concat([].slice.call(frame.contentDocument.querySelectorAll('canvas'))); } catch (e) {}
      });
      var best = null;
      list.forEach(function(c){ if (c.width >= 120 && c.height >= 120 && (!best || c.width * c.height > best.width * best.height)) best = c; });
      if (!best) return null;
      var copy = document.createElement('canvas');
      copy.width = best.width; copy.height = best.height;
      try { copy.getContext('2d').drawImage(best, 0, 0); } catch (e) { return null; }
      return blank(copy) ? null : copy;
    }
    // A near-uniform frame (empty layer, not yet drawn) or an unexportable canvas makes a poor
    // card picture; the card then shows the game's cover or icon instead.
    function blank(canvas){
      try {
        var probe = document.createElement('canvas'); probe.width = probe.height = 24;
        var g = probe.getContext('2d'); g.drawImage(canvas, 0, 0, 24, 24);
        var d = g.getImageData(0, 0, 24, 24).data, n = d.length / 4, sum = 0, sq = 0;
        for (var i = 0; i < d.length; i += 4) { var y = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; sum += y; sq += y * y; }
        var mean = sum / n;
        return Math.sqrt(Math.max(0, sq / n - mean * mean)) < 10;
      } catch (e) { return true; }
    }
    // Same spot as the leaderboard status: after the retry button, else after the game message.
    function button(gameId){
      var state = states[gameId];
      if (state.button) return state.button;
      var view = $('view-' + gameId);
      if (!view) return null;
      var own = $(gameId + '-share');
      if (own && !own.classList.contains('share-result')) return null; // game keeps its own share button
      var b = view.querySelector('.share-result');
      if (!b) {
        b = document.createElement('button');
        b.type = 'button'; b.className = 'share-result'; b.hidden = true;
        b.innerHTML = '<i class="fa-solid fa-share-nodes" aria-hidden="true"></i><span>{{t:result-share.msg.001}}</span>';
        var anchor = view.querySelector('[id$="-rank-retry"]') || view.querySelector('.side .msg, [id$="-msg"], .msg');
        if (anchor) anchor.insertAdjacentElement('afterend', b);
        else {
          var panel = view.querySelector('.side .panel'), rules = view.querySelector('details.rules');
          if (panel) panel.appendChild(b); else if (rules) rules.insertAdjacentElement('beforebegin', b); else view.appendChild(b);
        }
      }
      b.addEventListener('click', function(){ open(gameId); });
      state.button = b;
      return b;
    }
    function stateOf(gameId){ return states[gameId] || (states[gameId] = {offer: null, link: null, busy: false, button: null}); }
    function render(gameId){
      var state = stateOf(gameId), b = button(gameId);
      if (!b) return;
      var offer = state.offer;
      b.hidden = !offer;
      b.disabled = !!(offer && offer.pending) || state.busy;
      b.querySelector('span').textContent = offer && offer.pending ? '{{t:result-share.msg.003}}' : offer && offer.score != null ? '{{t:result-share.msg.001}}' : '{{t:result-share.msg.002}}';
    }
    function clear(gameId){
      var state = stateOf(gameId);
      state.offer = null; state.link = null; state.seq = (state.seq || 0) + 1;
      if (state.button || $('view-' + gameId)) render(gameId);
    }
    // score: integer or null; pending: a leaderboard verification is in flight.
    function offer(gameId, score, pending, snapshot){
      var state = stateOf(gameId);
      state.offeredAt = Date.now();
      state.offer = {score: Number.isSafeInteger(score) && score >= 0 ? score : null, pending: !!pending, snapshot: snapshot || capture(gameId)};
      state.link = null;
      return loadSdk().then(function(m){ if (m && m.canShareGame(gameId)) render(gameId); });
    }
    // round: {roundId, token} when the Worker accepted the score; null when it did not.
    function verify(gameId, score, round){
      var state = stateOf(gameId);
      if (!state.offer) return;
      state.offer.pending = false;
      state.offer.score = Number.isSafeInteger(score) && score >= 0 ? score : state.offer.score;
      state.offer.round = round || null;
      state.link = null;
      render(gameId);
    }
    async function open(gameId){
      var state = stateOf(gameId), target = state.offer;
      if (!target || target.pending || state.busy) return;
      state.busy = true; render(gameId);
      try {
        var m = await loadSdk();
        if (!m || !m.canShareGame(gameId)) return;
        var link = state.link;
        if (!link) {
          link = target.round
            ? await m.createShareLink({gameId: gameId, roundId: target.round.roundId, token: target.round.token}, AbortSignal.timeout(8000)).catch(function(){ return m.inviteLink(gameId, target.score); })
            : m.inviteLink(gameId, target.score);
          if (state.offer === target) state.link = link;
        }
        await m.presentResult(gameId, link, {snapshot: target.snapshot});
      } finally {
        state.busy = false; render(gameId);
      }
    }
    window.deepSeaRoundStart = function(gameId){ if (!rankGames[gameId]) clear(gameId); };
    window.deepSeaRoundEnd = function(gameId, result, params){
      if (IGNORED.indexOf(result) >= 0) return;
      var state = stateOf(gameId), seq = state.seq = (state.seq || 0) + 1, snapshot = capture(gameId);
      loadSdk().then(function(m){
        if (!m || !m.canShareGame(gameId) || state.seq !== seq) return;
        // Leaderboard games report their own score next to AN.end (before or after it); use
        // the AN.end parameters only for rounds the leaderboard skipped (e.g. Outpost stages 2-30).
        if (rankGames[gameId] && Date.now() - (state.offeredAt || 0) < 2000) return;
        var value = Math.round(Number(params[m.SHARE_GAMES[gameId].param]));
        offer(gameId, Number.isFinite(value) ? value : null, false, snapshot);
      });
    };
    return {
      ranked: function(gameId){ rankGames[gameId] = true; },
      clear: clear, offer: offer, verify: verify, open: open, capture: capture,
    };
  })();
