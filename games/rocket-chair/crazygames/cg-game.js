/* ===== CrazyGames build: runs after the game script. Free to play, no analytics, SDK v3. ===== */
(function () {
  track = function () {};                                   // no analytics on CrazyGames
  Wallet.isFree = () => true; Wallet.canStart = () => true; Wallet.spend = () => true; Wallet.tick = () => false; Wallet.bal = 1e9;
  ['btn-coffee', 'coffee-note', 'btn-share', 'btn-copy', 'btn-low-ad', 'debug'].forEach(id => { const e = $(id); if (e) e.classList.add('hidden'); });
  const adBtn = $('btn-ad'); adBtn.classList.add('hidden');
  let sdk = null, playing = false;

  /* ---------- saved progress (CrazyGames Data module through CG.store) ---------- */
  const best = () => CG.store.getJSON('roar_best', { early: 0, cleared: false, floors: 0 });
  const saveBest = (patch) => { const b = best(); let changed = false;
    for (const k in patch) if (patch[k] > b[k]) { b[k] = patch[k]; changed = true; }
    if (changed) CG.store.setJSON('roar_best', b); };
  const bestText = () => { const b = best(); return b.cleared ? `Best: ${b.early} min early` : b.floors ? `Best: ${b.floors} of ${FLOORS} ceilings` : ''; };
  renderWallet = function () { const el = $('t-wallet'); if (el) el.textContent = bestText(); };
  const _rocketEvent = rocketEvent; rocketEvent = function (type) {
    const r = _rocketEvent.apply(this, arguments);
    if (type === 'ceilingParticles' && G) saveBest({ floors: G.broken || 0 });   // saved as soon as a floor is broken
    return r; };
  const _showResultSave = showResult; showResult = function () {
    const g = G; if (g) saveBest({ floors: g.broken || 0, early: g.cleared ? g.early || 0 : 0, cleared: g.cleared ? 1 : 0 });
    if (g && g.mode !== 'touch') Calib.save();
    return _showResultSave.apply(this, arguments); };

  /* ---------- SDK gameplay start / stop around the real play state ---------- */
  // The SDK rejects start/stop calls less than 1 s apart, so quick pause/resume only sends the final state.
  let want = false, lastCall = 0, timer = 0;
  function flush() {
    timer = 0; if (!sdk || want === playing) return;
    const wait = lastCall + 1050 - Date.now();
    if (wait > 0) { timer = setTimeout(flush, wait); return; }
    playing = want; lastCall = Date.now();
    try { if (playing) sdk.game.gameplayStart(); else sdk.game.gameplayStop(); } catch (e) {}
  }
  const start = () => { want = true; if (!timer) flush(); };
  const stop = () => { want = false; if (!timer) flush(); };
  const _startGame = startGame; startGame = function () { const r = _startGame.apply(this, arguments); start(); return r; };
  const _resumePlay = resumePlay; resumePlay = function () { const r = _resumePlay.apply(this, arguments); start(); return r; };
  const _pauseGame = pauseGame; pauseGame = function () { stop(); return _pauseGame.apply(this, arguments); };
  const _timeUp = timeUp; timeUp = function () { stop(); return _timeUp.apply(this, arguments); };
  const _levelClear = levelClear; levelClear = function () { stop(); return _levelClear.apply(this, arguments); };
  const _showResult = showResult; showResult = function () { stop(); return _showResult.apply(this, arguments); };
  const _goTitle = goTitle; goTitle = function () { stop(); return _goTitle.apply(this, arguments); };

  /* ---------- one click to play: yelling only; hold-to-fly appears only when the mic can't be used ---------- */
  const NO_MIC = IS_MOBILE ? 'Mic not available — hold the screen to fly' : 'Mic not available — hold SPACE or the mouse to fly';
  function play() {                       // runs inside a click or key handler, so the browser may ask for the mic
    if (rocketStarting) return;
    ensureAudio(); Snd.click();
    inputMode = 'voice'; scene = null;
    Mic.start().then((res) => {
      if (res === 'granted') { learnReset(); startGame(); }
      else { Mic.stop(); inputMode = 'touch'; startGame(); toast(NO_MIC, 4.5); }
    });
  }
  $('btn-start').onclick = play;
  $('btn-retry').onclick = play;
  // The mic stopped working (denied, unplugged, silent): keep playing with hold-to-fly instead of a dead-end screen.
  micFail = function () {
    Mic.stop(); toast(NO_MIC, 4.5);
    if (G && !G.done) { G.mode = 'touch'; G.quiet = false; inputMode = 'touch'; G.pausedByMic = false; ensureAudio(); if (appState !== 'play') resumePlay(); }
  };

  /* ---------- automatic mic calibration while playing (no calibration screen) ---------- */
  // Noise floor: follows quiet moments quickly, rises slowly and only on near-silent input, never during a yell.
  // Full thrust: the loudest yell heard so far (a saved value starts a bit lower so the next session can re-learn it).
  function learnReset() {
    if (Calib.has) Calib.max = Math.max(Calib.max * 0.8, Calib.ambient * 3);
    else { Calib.ambient = 0.01; Calib.max = 0.06; }
  }
  const _read = Mic.read.bind(Mic);
  Mic.read = function () {
    const r = _read();
    if (appState === 'play' && inputMode === 'voice' && r > 1e-6) {
      const a = Calib.ambient;
      if (r < a) Calib.ambient = a * 0.8 + r * 0.2;
      else if (r < a * 2.5) Calib.ambient = a + (r - a) * 0.01;
      if (r > Calib.max) Calib.max = r;
      Calib.max = Math.max(Calib.max, Calib.ambient * 3);
    }
    return r;
  };

  /* ---------- pause button, pause menu, P key, auto pause ---------- */
  const app = $('app');
  const pb = document.createElement('button');
  pb.id = 'cg-pause'; pb.type = 'button'; pb.className = 'hidden'; pb.setAttribute('aria-label', 'Pause (P)');
  pb.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  app.appendChild(pb);
  const pauseNow = () => { if (appState === 'play') pauseGame('Paused', 'The boss is still in the meeting.'); };
  pb.onclick = pauseNow;
  (function watch() { pb.classList.toggle('hidden', appState !== 'play'); requestAnimationFrame(watch); })();

  const box = $('s-pause');
  const mk = (id, cls, text) => { const b = document.createElement('button'); b.id = id; b.type = 'button'; b.className = 'btn ' + cls; b.textContent = text; box.appendChild(b); return b; };
  $('btn-resume').textContent = 'Resume';
  const restartBtn = mk('cg-restart', 'sec', 'Restart');
  const menuBtn = mk('cg-menu', 'sec', 'Back to Menu');
  const soundBtn = mk('cg-sound', 'ghost', '');
  restartBtn.onclick = () => { stop(); Mic.stop(); G = null; play(); };
  menuBtn.onclick = () => goTitle();
  const _pauseScreen = pauseGame; pauseGame = function () { const r = _pauseScreen.apply(this, arguments); $('btn-resume').textContent = 'Resume'; renderSound(); return r; };

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'KeyP' || e.repeat) return;
    if (appState === 'play') pauseNow();
    else if (appState === 'paused') onResumeClick();
  });
  window.addEventListener('blur', () => { if (appState === 'play') pauseGame(); });

  /* ---------- sound: player choice (saved) OR the CrazyGames page OR an ad mutes it ---------- */
  let userMuted = false, platformMuted = false, adMuted = false;
  const syncMute = () => { muted = userMuted || platformMuted || adMuted; $('mute').classList.toggle('muted', userMuted || platformMuted);
    try { if (master) master.gain.value = muted ? 0 : (inputMode === 'touch' ? 0.5 : 0.28); } catch (e) {} };
  function renderSound() { soundBtn.textContent = userMuted ? 'Sound: Off' : 'Sound: On'; }
  const toggleSound = () => { userMuted = !userMuted; lsSet(MUTE_KEY, userMuted ? '1' : '0'); syncMute(); renderSound(); ensureAudio(); };
  $('mute').onclick = toggleSound; soundBtn.onclick = toggleSound;
  const applyMute = (s) => { if (s && typeof s.muteAudio === 'boolean') { platformMuted = s.muteAudio; syncMute(); } };

  /* ---------- rewarded ad replaces the site's demo ad: once per round, the meeting runs longer ---------- */
  const _renderRevive = renderRevive; renderRevive = function () { _renderRevive.apply(this, arguments); adBtn.classList.toggle('hidden', !sdk || G.adUsed >= CONFIG.adContinuePerGame); };
  adBtn.onclick = () => {
    if (!sdk || !G || G.adUsed >= CONFIG.adContinuePerGame) return;
    let done = false;
    sdk.ad.requestAd('rewarded', {
      adStarted: () => { adMuted = true; syncMute(); },
      adFinished: () => { adMuted = false; syncMute(); if (done) return; done = true;
        rocketControl(124); reviveContinue();
        $('pause-title').textContent = `Meeting extended by ${CONFIG.adExtendSeconds} seconds!`;
        $('pause-desc').textContent = 'The boss started talking again. Keep going!'; },
      adError: () => { adMuted = false; syncMute(); toast('No ad available right now'); adBtn.classList.add('hidden'); },
    });
  };

  CG.ready.then((C) => {
    // saved settings arrive with the SDK: apply them (the game read empty defaults at startup)
    userMuted = lsGet(MUTE_KEY) === '1'; syncMute(); renderSound(); Calib.load(); renderWallet();
    if (!C) return;
    sdk = C;
    try { sdk.game.loadingStop(); } catch (e) {}
    try { applyMute(sdk.game.settings); sdk.game.addSettingsChangeListener(applyMute); } catch (e) {}
    flush();   // a round may already be running
  });
  renderSound();
})();
