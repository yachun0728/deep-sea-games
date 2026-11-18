  var lastSavedBalance = START_BALANCE;
  function save() {
    lastSavedBalance = S.balance;
    try { localStorage.setItem(STORE, String(S.balance)); } catch (e) {}
  }
  function load() {
    try {
      var v = parseInt(localStorage.getItem(STORE), 10); if (isFinite(v) && v >= 0) S.balance = v;
    } catch (e) {}
    lastSavedBalance = S.balance;
  }
  // Legacy regeneration keys remain readable; no passive or offline points after free-play migration.
  function regenTick(now) { return false; }
  function regenUI() { var el=document.getElementById('regen-hint'); if(el)el.textContent='免費遊玩，點數可兌換外觀'; }
  function regenStart() { regenUI(); }
