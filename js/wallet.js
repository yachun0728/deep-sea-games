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
  // Legacy regeneration keys remain readable; no passive or offline points after free-play migration.
  function regenTick(now) { return false; }
  function regenUI() { var el=document.getElementById('regen-hint'); if(el)el.textContent='免費遊玩，點數可兌換外觀'; }
  function regenStart() { regenUI(); }
