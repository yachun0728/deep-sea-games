  var lastSavedBalance = START_BALANCE;
  function save() {
    lastSavedBalance = S.balance;
    try { localStorage.setItem(STORE, String(S.balance)); } catch (e) {}
  }
  // One-time reset (2026-11-18): everyone starts again from 0 points. The marker keeps it from running twice,
  // and the wardrobe collection (deep-sea-wardrobe-v1) is not touched.
  var ZERO_KEY = 'deep-sea-balance-zero-v1';
  function load() {
    try {
      if (localStorage.getItem(ZERO_KEY) !== '1') {
        S.balance = 0; localStorage.setItem(STORE, '0'); localStorage.setItem(ZERO_KEY, '1');
      } else {
        var v = parseInt(localStorage.getItem(STORE), 10); if (isFinite(v) && v >= 0) S.balance = v;
      }
    } catch (e) {}
    lastSavedBalance = S.balance;
  }
  // Legacy regeneration keys remain readable; no passive or offline points after free-play migration.
  function regenTick(now) { return false; }
  function regenUI() { var el=document.getElementById('regen-hint'); if(el)el.textContent='{{t:wallet.msg.001}}'; }
  function regenStart() { regenUI(); }
