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
    const g = G;
    if (g) {
      const before = best();
      g.newBest = g.cleared ? (!before.cleared || (g.early || 0) > before.early) : (!before.cleared && (g.broken || 0) > before.floors);
      saveBest({ floors: g.broken || 0, early: g.cleared ? g.early || 0 : 0, cleared: g.cleared ? 1 : 0 });
    }
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

  /* ---------- result screen (layout from the approved mockup) ---------- */
  // Background, hero, burst, banner, brush and icons are text-free images (result/*.webp);
  // the headline, title, stats, best and buttons are live text. "Yell again" and "Menu" sit at the bottom.
  const res = document.createElement('div'); res.id = 'cg-res';
  $('r-head').insertAdjacentElement('afterend', res);
  const homeBtn = $('btn-home'); homeBtn.className = 'btn sec'; homeBtn.textContent = 'Menu';
  if ($('r-bar')) $('r-bar').appendChild(homeBtn);
  function renderResult(g) {
    const b = best(), win = !!g.cleared;
    const headline = win ? ((g.early || 0) > 0 ? `You left<b>${g.early} min</b>early!` : 'Out at<b>6:00</b>on the dot!') : 'Overtime<b>again...</b>';
    const bestLine = b.cleared ? `Best: ${b.early} min early` : `Best: ${b.floors} of ${FLOORS} ceilings`;
    $('s-result').classList.toggle('win', win); $('s-result').classList.toggle('fail', !win);
    res.className = win ? 'win' : 'fail';
    res.innerHTML =
      `<div class="head"><p>${headline}</p></div>` +
      `<div class="hero" role="img" aria-label="${win ? 'Celebrating on the rocket chair' : 'Exhausted in the office chair'}"></div>` +
      `<div class="rank"><span>${rankOf(g)}</span></div>` +
      `<div class="stats">` +
      `<div class="stat"><img src="result/icon-clock.webp" alt=""><div><b>${win ? g.early || 0 : 0}</b><span>min early</span></div></div>` +
      `<div class="stat"><img src="result/icon-ceiling.webp" alt=""><div><b>${g.broken || 0}/${FLOORS}</b><span>ceilings</span></div></div>` +
      `<div class="stat"><img src="result/icon-dash.webp" alt=""><div><b>${g.bursts || 0}</b><span>dashes</span></div></div></div>` +
      `<div class="best"><span>${bestLine}${g.newBest ? '<span class="new">NEW BEST!</span>' : ''}</span></div>`;
  }
  const _showResultSlip = showResult; showResult = function () { const g = G; const r = _showResultSlip.apply(this, arguments); if (g) renderResult(g); $('toast').classList.remove('show'); return r; };

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
  (function watch() { const p = appState === 'play'; pb.classList.toggle('hidden', !p); app.classList.toggle('cg-playing', p); requestAnimationFrame(watch); })();

  const box = $('s-pause');
  const mk = (id, cls, text) => { const b = document.createElement('button'); b.id = id; b.type = 'button'; b.className = 'btn ' + cls; b.textContent = text; box.appendChild(b); return b; };
  $('btn-resume').textContent = 'Resume';
  const restartBtn = mk('cg-restart', 'sec', 'Restart');
  const menuBtn = mk('cg-menu', 'sec', 'Back to Menu');
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
  // "Sound" switches everything off; "Music" only the title music and the in-game office ambience.
  let userMuted = false, platformMuted = false, adMuted = false, musicOff = false;
  // Sound and Music live in one dropdown under the speaker button, top right on every screen.
  const audioMenu = document.createElement('div'); audioMenu.id = 'cg-audio-menu'; audioMenu.className = 'hidden';
  audioMenu.innerHTML = '<button type="button" id="cg-sound"></button><button type="button" id="cg-music"></button>';
  app.appendChild(audioMenu);
  const soundBtn = $('cg-sound'), musicBtn = $('cg-music');
  const closeAudioMenu = () => audioMenu.classList.add('hidden');
  document.addEventListener('pointerdown', (e) => { if (!audioMenu.contains(e.target) && !$('mute').contains(e.target)) closeAudioMenu(); }, true);
  const syncMute = () => { muted = userMuted || platformMuted || adMuted; $('mute').classList.toggle('muted', userMuted || platformMuted);
    try { if (master) master.gain.value = muted ? 0 : (inputMode === 'touch' ? 0.5 : 0.28); } catch (e) {}
    if (window.Music) Music.mute(muted || musicOff); };
  function renderSound() {
    soundBtn.innerHTML = 'Sound <b>' + (userMuted ? 'Off' : 'On') + '</b>'; soundBtn.classList.toggle('off', userMuted);
    musicBtn.innerHTML = 'Music <b>' + (musicOff ? 'Off' : 'On') + '</b>'; musicBtn.classList.toggle('off', musicOff);
    musicBtn.disabled = userMuted;   // everything is already silent
  }
  const toggleSound = () => { userMuted = !userMuted; lsSet(MUTE_KEY, userMuted ? '1' : '0'); syncMute(); renderSound(); ensureAudio(); };
  const toggleMusic = () => { musicOff = !musicOff; CG.store.setJSON('roar_settings', { music: !musicOff }); syncMute(); renderSound(); };
  $('mute').onclick = (e) => { e.stopPropagation(); ensureAudio(); audioMenu.classList.toggle('hidden'); renderSound(); };
  soundBtn.onclick = toggleSound; musicBtn.onclick = toggleMusic;

  /* ---------- recorded sound effects (Kenney, CC0) replace the synthesized ones; synth stays as fallback ---------- */
  const SFX_FILES = ['bonk', 'crash', 'burst', 'grab', 'paper', 'timeup', 'tick', 'click', 'clear'];
  const sfxRaw = {}, sfx = {};
  SFX_FILES.forEach(n => { sfxRaw[n] = fetch('audio/sfx/' + n + '.m4a').then(r => r.ok ? r.arrayBuffer() : null).catch(() => null); });
  let sfxDecoding = null;
  function decodeSfx() {
    if (sfxDecoding || !actx) return;
    sfxDecoding = Promise.all(SFX_FILES.map(n => sfxRaw[n].then(ab => ab && actx.decodeAudioData(ab.slice(0))).then(b => { if (b) sfx[n] = b; }).catch(() => {})))
      .then(() => { if (sfx.tick && window.Music) Music.setSample('tick', sfx.tick); });
  }
  function sample(n, vol, dur) {
    const b = sfx[n]; if (!b || !actx || !master) return false;
    if (muted) return true;
    const s = actx.createBufferSource(), g = actx.createGain(), t = actx.currentTime;
    s.buffer = b; g.gain.value = vol; s.connect(g); g.connect(master); s.start(t);
    if (dur && dur < b.duration) { g.gain.setValueAtTime(vol, t + dur - 0.2); g.gain.linearRampToValueAtTime(0, t + dur); s.stop(t + dur + 0.02); }
    return true;
  }
  const synth = Object.assign({}, Snd);
  const useSample = (key, n, vol, dur) => { Snd[key] = function () { if (!sample(n, vol, dur)) return synth[key].apply(Snd, arguments); }; };
  useSample('bonk', 'bonk', 1.0); useSample('crash', 'crash', 1.0); useSample('burst', 'burst', 0.8, 0.9);
  useSample('grab', 'grab', 0.9); useSample('paper', 'paper', 0.9); useSample('ding', 'timeup', 1.0);
  useSample('win', 'clear', 0.9); useSample('click', 'click', 0.8);

  /* ---------- music and office ambience follow the game state ---------- */
  let musicReady = false;
  function audioUnlock() {          // browsers only allow audio after the first click / key
    ensureAudio(); if (!actx || musicReady || !window.Music) return;
    Music.init(actx); musicReady = true; syncMute(); decodeSfx();
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, audioUnlock, { capture: true }));
  function syncMusic() {
    if (!musicReady) return;
    const s = appState, gameTrack = Music.track === 'game';
    // while the microphone listens: quieter ambience and no voices, so the speakers don't fly the chair
    const mic = inputMode === 'voice' && s === 'play', level = mic ? 0.35 : 0.6;
    if (level !== lastLevel) { lastLevel = level; Music.setVolume(level); Music.setVoices(!mic); }
    if (s === 'play') {
      if (gameTrack && Music.state === 'paused') Music.resume(); else if (!gameTrack || Music.state !== 'playing') Music.play('game');
      if (G) { Music.setIntensity(G.floor); Music.setUrgent(G.meetingTotal - G.elapsed <= 10); }
    } else if (s === 'paused' || s === 'revive' || s === 'ad' || s === 'micfail') { if (gameTrack && Music.state === 'playing') Music.pause(); }
    else if (s === 'failcs' || s === 'clearcs') { if (gameTrack) Music.stop(); }
    else if (s === 'title' || s === 'result') { if (Music.track !== 'title') Music.play('title'); }
  }
  let lastLevel = -1;
  (function musicLoop() { try { syncMusic(); } catch (e) {} requestAnimationFrame(musicLoop); })();
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
    userMuted = lsGet(MUTE_KEY) === '1'; musicOff = CG.store.getJSON('roar_settings', { music: true }).music === false;
    syncMute(); renderSound(); Calib.load(); renderWallet();
    if (!C) return;
    sdk = C;
    try { sdk.game.loadingStop(); } catch (e) {}
    try { applyMute(sdk.game.settings); sdk.game.addSettingsChangeListener(applyMute); } catch (e) {}
    flush();   // a round may already be running
  });
  renderSound();
})();
