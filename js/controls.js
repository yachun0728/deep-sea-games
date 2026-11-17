  /* ---------- wiring ---------- */
  elGo.addEventListener('click', mainAction);
  document.addEventListener('keydown', function (e) {
    if (e.code !== 'Space' || e.repeat) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'summary' || tag === 'button' || tag === 'a' || $('view-crash').hidden) return;
    e.preventDefault();
    if (!elGo.disabled) mainAction();
  });
  elAmt.addEventListener('input', renderGo);
  document.querySelectorAll('[data-chip]').forEach(function (b) {
    b.addEventListener('click', function () {
      var a = readAmount() || MIN_BET, k = b.dataset.chip;
      a = k === 'half' ? a / 2 : k === 'double' ? a * 2 : S.balance;
      elAmt.value = Math.max(MIN_BET, Math.min(Math.floor(a), Math.max(MIN_BET, S.balance)));
      renderGo();
    });
  });
  document.querySelectorAll('[data-auto]').forEach(function (b) {
    b.addEventListener('click', function () { elAuto.value = Number(b.dataset.auto).toFixed(2); });
  });
  $('reset').addEventListener('click', function () {
    var note = function (t) { diveSay(t); mrtSay(t); blSay(t); rpSay(t); catSay(t); birdSay(t); frogSay(t); bobaUI(t); pancakeUI(t); fiSay(t); $('sk-msg').textContent=t; eqSay(t); drSay(t); $('rn-msg').textContent=t; say(t); mSay(t); pSay(t); gSay(t); dSay(t); lSay(t); hSay(t); kSay(t); wSay(t); tSay(t); rSay(t); };
    if ((S.bet && S.phase !== 'crashed' && !S.bet.out) || M.active || P.balls.length || D.pending || L.pending || HL.active || KE.pending || WL.pending || TW.active || CR.active || DR.active || runnerBusy || EQ.active || sneakBusy || FI.active || BOBA.active || catBusy || birdBusy || frogBusy || RP.active || BL.active || DIVE.active || MRT.active || PANCAKE.active) { note('這一注結束後才能重設點數。'); return; }
    AN.points(START_BALANCE-S.balance); S.balance = START_BALANCE; save(); note('點數已重設為 ' + fmt(START_BALANCE) + '。'); renderAll(); renderMines();
  });

