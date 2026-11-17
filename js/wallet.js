  var REGEN_KEY = 'deep-sea-regen-at', regenAt = Date.now(), lastSavedBalance = START_BALANCE;
  function save() {
    // A spend that takes the balance below the cap starts the regeneration clock at that moment.
    if (lastSavedBalance >= REGEN_CAP && S.balance < REGEN_CAP) regenAt = Date.now();
    lastSavedBalance = S.balance;
    try { localStorage.setItem(STORE, String(S.balance)); localStorage.setItem(REGEN_KEY, String(regenAt)); } catch (e) {}
  }
  function load() {
    try {
      var v = parseInt(localStorage.getItem(STORE), 10); if (isFinite(v) && v >= 0) S.balance = v;
      var t = Number(localStorage.getItem(REGEN_KEY)); if (isFinite(t) && t > 0) regenAt = t;
    } catch (e) {}
    lastSavedBalance = S.balance; regenTick(Date.now());
  }
  // +1 point per full minute while below the cap, by wall-clock time (it also counts while the page was closed).
  function regenTick(now) {
    if (S.balance >= REGEN_CAP) { regenAt = now; return false; }
    if (now < regenAt) regenAt = now;
    var mins = Math.floor((now - regenAt) / REGEN_MS);
    if (mins < 1) return false;
    S.balance += Math.min(mins, REGEN_CAP - S.balance);
    regenAt = S.balance >= REGEN_CAP ? now : regenAt + mins * REGEN_MS;
    save(); return true;
  }
  function regenUI() {
    var el = document.getElementById('regen-hint'); if (!el) return;
    var text = '低於 ' + REGEN_CAP + ' 點時，每分鐘回 1 點';
    if (S.balance < REGEN_CAP) {
      var s = Math.max(1, Math.min(60, Math.ceil((REGEN_MS - (Date.now() - regenAt)) / 1000)));
      text = '下一點 ' + Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60) + ' · 回到 ' + REGEN_CAP + ' 點為止';
    }
    if (el.textContent !== text) el.textContent = text;
  }
  function regenStart() {
    var step = function () { if (regenTick(Date.now())) renderAll(); regenUI(); };
    document.addEventListener('visibilitychange', function () { if (!document.hidden) step(); });
    setInterval(step, 1000); regenUI();
  }