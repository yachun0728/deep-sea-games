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
