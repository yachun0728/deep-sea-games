/* CrazyGames build only: SDK loader and save storage.
 * Saves go to the CrazyGames SDK Data module (guests and logged-in players alike).
 * Until the SDK is ready, or when it cannot load (local test, ad blocker), values live in memory only:
 * the game keeps working, it just does not remember anything after a reload. localStorage is never used. */
(function () {
  var memory = Object.create(null), sdk = null, readyResolve;
  // Only these keys are worth saving; everything else the site version writes (analytics, wallet) stays in memory.
  var SAVED = { rocket_chair_calib: 1, rocket_chair_muted: 1, roar_best: 1, roar_settings: 1 };
  var LIMIT = 1024 * 1024;   // the Data module allows 1 MB in total

  function size() {
    var n = 0; for (var k in SAVED) { var v = memory[k]; if (v != null) n += k.length + String(v).length; } return n;
  }
  var store = {
    get: function (k) { return k in memory ? memory[k] : null; },
    set: function (k, v) {
      v = String(v); var old = memory[k]; memory[k] = v;
      if (!SAVED[k]) return;
      if (size() > LIMIT) { memory[k] = old; return; }
      if (sdk) { try { sdk.data.setItem(k, v); } catch (e) {} }
    },
    remove: function (k) { delete memory[k]; if (sdk && SAVED[k]) { try { sdk.data.removeItem(k); } catch (e) {} } },
    getJSON: function (k, fallback) { try { var v = JSON.parse(store.get(k)); return v == null ? fallback : v; } catch (e) { return fallback; } },
    setJSON: function (k, v) { store.set(k, JSON.stringify(v)); },
  };

  var ready = new Promise(function (r) { readyResolve = r; }), done = false;
  function finish(s) {
    if (s && !sdk) {
      sdk = s;
      for (var k in SAVED) {
        try {
          // On time: saved data wins. Late (after the timeout let the game start): keep what was played meanwhile.
          if (done && memory[k] != null) s.data.setItem(k, memory[k]);
          else { var v = s.data.getItem(k); if (v != null) memory[k] = String(v); }
        } catch (e) {}
      }
    }
    if (!done) { done = true; readyResolve(sdk); }
  }
  var tag = document.createElement('script');
  tag.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
  tag.onload = function () {
    var C = window.CrazyGames && window.CrazyGames.SDK;
    if (!C) { finish(null); return; }
    Promise.resolve(C.init()).then(function () { finish(C); }, function () { finish(null); });
  };
  tag.onerror = function () { finish(null); };
  setTimeout(function () { finish(sdk); }, 10000);   // never let a stuck SDK block the game
  document.head.appendChild(tag);

  window.CG = { store: store, ready: ready, get sdk() { return sdk; } };
})();
