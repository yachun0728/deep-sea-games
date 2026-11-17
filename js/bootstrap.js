  function start(data) {
    load();
    if (data && typeof data.balance === 'number') S.balance = data.balance;
    S.history = data && Array.isArray(data.history) ? data.history : Array.from({ length: 12 }, rollCrash);
    buildBoard(); renderMines(); pkSetup(); pkUI(); mgBuild(); mgRender(); dUI(); lUI(); hUI(); keTables(); keBuild(); [3, 11, 18, 26, 34].forEach(function (n) { KE.picked[n] = 1; }); keUI(); whSetup(); whUI(); twUI(); crUI(); route();
    resize(); seedSnow();
    startBetting(performance.now());
    requestAnimationFrame(frame);
  }
  var hot = window.claude && window.claude.hot;
  if (hot && hot.snapshot) hot.snapshot(function () { return { balance: S.balance + (S.bet && !S.bet.out && S.phase !== 'crashed' ? S.bet.amount : 0) + (M.active ? M.bet : 0) + P.balls.reduce(function (s, b) { return s + b.bet; }, 0) + D.pending + L.pending + (HL.active ? HL.bet : 0) + KE.pending + WL.pending + (TW.active ? TW.bet : 0) + (CR.active ? CR.bet : 0) + (DR.active ? DR.stake : 0) + (EQ.active ? EQ.stake : 0) + (sneakBusy ? sneakStake : 0) + (FI.active ? FI.stake : 0) + (CP.active ? CP.stake : 0) + (BOBA.active ? BOBA.fee : 0) + (catBusy ? catStake : 0) + (birdBusy ? birdStake : 0) + (RP.active ? RP.stake : 0), history: S.history }; });
  if (hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
})();
