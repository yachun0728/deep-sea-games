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

