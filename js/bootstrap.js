  function start(data) {
    load(); regenStart(); window.deepSeaWardrobe.init();
    if (data && typeof data.balance === 'number') S.balance = data.balance;
    S.history = data && Array.isArray(data.history) ? data.history : Array.from({ length: 12 }, rollCrash);
    buildBoard(); renderMines(); pkSetup(); pkUI(); mgBuild(); mgRender(); dUI(); lUI(); hUI(); keBuild(); keUI(); whSetup(); whUI(); twUI(); crUI(); route();
    resize(); seedSnow();
    startBetting(performance.now());
    requestAnimationFrame(frame);
  }
  var hot = window.claude && window.claude.hot;
  if (hot && hot.snapshot) hot.snapshot(function () { return { balance: S.balance + (S.bet && !S.bet.out && S.phase !== 'crashed' ? S.bet.amount : 0) + P.balls.reduce(function (s, b) { return s + b.bet; }, 0) + D.pending + L.pending + (HL.active ? HL.bet : 0) + WL.pending + (TW.active ? TW.bet : 0) + (CR.active ? CR.bet : 0) + (EQ.active ? EQ.stake : 0) + (sneakBusy ? sneakStake : 0) + (FI.active ? FI.stake : 0) + (CP.active ? CP.stake : 0) + (BOBA.active ? BOBA.fee : 0) + (PANCAKE.active && !PANCAKE.free ? PANCAKE.fee : 0) + (catBusy ? catStake : 0) + (birdBusy ? birdStake : 0) + (frogBusy ? frogStake : 0) + (puddingBusy ? puddingStake : 0) + (clockBusy ? clockStake : 0) + (peekBusy ? peekStake : 0) + (napBusy ? napStake : 0) + (hairBusy ? hairStake : 0) + (mqBusy ? mqStake : 0) + (bqBusy ? bqStake : 0) + (petBusy ? petStake : 0) + (otBusy ? otStake : 0) + (mmBusy ? mmStake : 0) + (EATS.active ? EATS.stake : 0) + (MIRR.active ? MIRR.stake : 0) + (SHAD.active ? SHAD.stake : 0) + (ONEL.active ? ONEL.stake : 0) + (RP.active ? RP.stake : 0) + (BL.active ? BL.stake : 0) + (DIVE.active ? DIVE.stake : 0) + (MRT.active ? MRT.stake : 0) + (carpBusy ? carpStake : 0) + (riderBusy ? riderStake : 0) + (bossBusy ? bossStake : 0) + (thiefBusy ? thiefStake : 0) + (babyBusy ? babyStake : 0), history: S.history }; });
  if (hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
})();
