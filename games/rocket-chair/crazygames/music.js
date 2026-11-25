/* Roar Through the Ceiling! music and office ambience.
 * Original, synthesized live with the Web Audio API by this file (no audio files, no samples, no third-party music).
 *
 * Music.init(audioContext?, destination?)  create the bus (reuses the game's AudioContext when given)
 * Music.play('title')                     lo-fi groove for the title and result screens ("After Hours")
 * Music.play('game')                      in-game: no music, an office soundscape plus the meeting clock ticking
 * Music.stop() / pause() / resume()       pause keeps the position; resume continues from it
 * Music.setVolume(0..1) / mute(bool)      level and on/off (the game applies its global mute through these)
 * Music.setIntensity(0..4)                in-game: current floor (each floor has its own background sounds)
 * Music.setUrgent(bool)                   in-game: last seconds of the meeting (faster, higher ticking + heartbeat)
 *
 * Everything is scheduled step by step on the audio clock, so loops have no gap. */
(function (global) {
  'use strict';
  const NAMES = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  function hz(n) {
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(n); if (!m) return 0;
    return 440 * Math.pow(2, (NAMES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12) / 12);
  }

  let ctx = null, out = null, bus = null, tone = null, noise = null, wow = null;
  let track = null, name = '', timer = 0, step = 0, nextTime = 0, state = 'stopped';
  let intensity = 0, urgent = false, volume = 0.6, muted = false;
  const live = new Set();          // one-shot sources, stopped on pause/stop
  const layers = new Map();        // looping background layers (room tone, wind...), keyed by name

  function init(audioContext, destination) {
    if (ctx) return Music;
    ctx = audioContext || new (global.AudioContext || global.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 14; comp.ratio.value = 2.5; comp.attack.value = 0.01; comp.release.value = 0.25;
    tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 20000; tone.Q.value = 0.5;   // "tape" warmth for the title
    out = ctx.createGain(); out.gain.value = muted ? 0 : volume;
    bus = ctx.createGain();
    bus.connect(tone); tone.connect(comp); comp.connect(out); out.connect(destination || ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // slow pitch wobble shared by the keys, like a slightly worn tape
    wow = ctx.createGain(); wow.gain.value = 7;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.35; lfo.connect(wow); lfo.start();
    return Music;
  }
  const keep = (src) => { live.add(src); src.onended = () => live.delete(src); return src; };

  /* ---------- sound sources ---------- */
  function env(g, t, v, a, d, s, end, r) {
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a);
    g.gain.setTargetAtTime(v * s, t + a, d / 3); g.gain.setValueAtTime(v * s, end); g.gain.linearRampToValueAtTime(0, end + r);
  }
  // electric piano: sine carrier, FM bell on the attack, gentle tremolo, low-passed
  function keys(freq, t, dur, vol) {
    const end = t + dur, r = 0.5;
    const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    car.type = 'sine'; car.frequency.value = freq; mod.type = 'sine'; mod.frequency.value = freq;
    mg.gain.setValueAtTime(freq * 1.6, t); mg.gain.exponentialRampToValueAtTime(freq * 0.12, t + 0.6);
    mod.connect(mg); mg.connect(car.frequency); wow.connect(car.detune);
    f.type = 'lowpass'; f.frequency.value = 2600;
    env(g, t, vol, 0.006, 1.2, 0.45, end, r);
    car.connect(f); f.connect(g); g.connect(bus);
    for (const o of [car, mod]) { o.start(t); o.stop(end + r + 0.05); keep(o); }
  }
  function sub(freq, t, dur, vol) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = 'sine'; o.frequency.value = freq; o2.type = 'triangle'; o2.frequency.value = freq;
    const g2 = ctx.createGain(); g2.gain.value = 0.35; o2.connect(g2); g2.connect(f);
    f.type = 'lowpass'; f.frequency.value = 320;
    env(g, t, vol, 0.015, 0.25, 0.7, t + dur, 0.12);
    o.connect(f); f.connect(g); g.connect(bus);
    for (const x of [o, o2]) { x.start(t); x.stop(t + dur + 0.2); keep(x); }
  }
  function blip(freq, t, dur, vol, type) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    env(g, t, vol, 0.003, dur, 0.6, t + dur, 0.02);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.05); keep(o);
  }
  function hiss(t, o) {   // filtered noise burst
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noise; f.type = o.type || 'bandpass'; f.frequency.value = o.freq; f.Q.value = o.q || 0.8;
    if (o.sweepTo) f.frequency.exponentialRampToValueAtTime(o.sweepTo, t + o.decay);
    if (o.a) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(o.vol, t + o.a); g.gain.setTargetAtTime(0.0001, t + o.a, o.decay / 4); }
    else { g.gain.setValueAtTime(o.vol, t); g.gain.exponentialRampToValueAtTime(0.0005, t + o.decay); }
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(t, Math.random() * 1.5); src.stop(t + (o.a || 0) + o.decay + 0.05); keep(src);
  }
  function kick(t, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = 'sine'; o.frequency.setValueAtTime(105, t); o.frequency.exponentialRampToValueAtTime(44, t + 0.11);
    f.type = 'lowpass'; f.frequency.value = 900;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.4);
    o.connect(f); f.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.42); keep(o);
  }
  const snare = (t, vol) => { hiss(t, { freq: 1500, q: 0.6, vol: vol, decay: 0.22 }); hiss(t, { type: 'lowpass', freq: 600, vol: vol * 0.5, decay: 0.08 }); };
  const hat = (t, vol) => hiss(t, { type: 'highpass', freq: 6500, vol: vol, decay: 0.035 });
  // looping layer (room tone, wind, projector fan); fades in/out
  function layer(key, on, make) {
    const cur = layers.get(key), t = ctx.currentTime;
    if (on && !cur) {
      const nodes = make(); nodes.g.gain.setValueAtTime(0, t); nodes.g.gain.linearRampToValueAtTime(nodes.level, t + 1.2);
      layers.set(key, nodes);
    } else if (!on && cur) {
      cur.g.gain.cancelScheduledValues(t); cur.g.gain.setValueAtTime(cur.g.gain.value, t); cur.g.gain.linearRampToValueAtTime(0, t + 0.6);
      for (const s of cur.src) { try { s.stop(t + 0.7); } catch (e) {} }
      layers.delete(key);
    }
  }
  function noiseLoop(filterType, freq, q, level, lfoRate, lfoDepth) {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), src2 = [src];
    src.buffer = noise; src.loop = true; f.type = filterType; f.frequency.value = freq; f.Q.value = q;
    if (lfoRate) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = lfoRate; lg.gain.value = lfoDepth; l.connect(lg); lg.connect(f.frequency); l.start(); src2.push(l); }
    src.connect(f); f.connect(g); g.connect(bus); src.start();
    return { src: src2, g, level };
  }

  /* ---------- "After Hours": lo-fi groove for the title and result screens ---------- */
  // 80 BPM, swung sixteenths, jazzy 7th/9th chords on electric piano, sub bass, dusty kit, vinyl crackle. No lead melody.
  const VOICINGS = {
    Fmaj9: ['F1', ['A3', 'C4', 'E4', 'G4']], Em7: ['E2', ['G3', 'B3', 'D4', 'F#4']], Dm9: ['D2', ['F3', 'A3', 'C4', 'E4']],
    Cmaj9: ['C2', ['E3', 'G3', 'B3', 'D4']], G13: ['G1', ['F3', 'B3', 'E4']], Am9: ['A1', ['G3', 'B3', 'C4', 'E4']],
  };
  const TITLE = {
    bpm: () => 80, stepsPerBar: 16, swing: 0.6, bars: 16,
    chords: ['Fmaj9', 'Em7', 'Dm9', 'Cmaj9', 'Fmaj9', 'Em7', 'Dm9', 'G13', 'Fmaj9', 'Em7', 'Am9', 'Dm9', 'Fmaj9', 'Em7', 'Dm9', 'G13'],
    start() { tone.frequency.setTargetAtTime(3800, ctx.currentTime, 0.1);
      layer('crackle', true, () => noiseLoop('bandpass', 2400, 0.4, 0.012)); },
    end() { layer('crackle', false); },
    play(bar, s, t, sd) {
      const [root, chord] = VOICINGS[this.chords[bar]], v = 0.06;
      // keys: long chord on 1, a pushed re-hit on the "and" of 2, a short stab before the next bar
      if (s === 0) chord.forEach((n, i) => keys(hz(n), t + i * 0.012, sd * 6, v));
      if (s === 6) chord.forEach((n, i) => keys(hz(n), t + i * 0.01, sd * 3.5, v * 0.7));
      if (s === 14 && bar % 2) chord.slice(1).forEach((n, i) => keys(hz(n), t + i * 0.01, sd * 1.2, v * 0.5));
      // bass: root on 1, syncopated on the "a" of 2
      if (s === 0) sub(hz(root) * 2, t, sd * 5, 0.32);
      if (s === 10) sub(hz(root) * 2, t, sd * 3, 0.24);
      // drums (bar 16 drops out for a breath before the loop)
      if (bar !== 15) {
        if (s === 0 || s === 7 || (s === 10 && bar % 4 !== 3)) kick(t, s === 7 ? 0.45 : 0.6);
        if (s === 4 || s === 12) snare(t, 0.13);
        if (s % 2 === 0) hat(t, s % 4 ? 0.022 : 0.034);
        else if (Math.random() < 0.25) hat(t, 0.012);
      } else if (s === 12) snare(t, 0.08);
      // vinyl pops
      if (Math.random() < 0.05) hiss(t + Math.random() * sd, { type: 'highpass', freq: 3000, vol: 0.03 + Math.random() * 0.03, decay: 0.006 });
    },
  };

  /* ---------- in-game: office soundscape + meeting clock ---------- */
  // No music while playing (the microphone would pick it up): quiet room tone, per-floor background sounds,
  // and a clock that ticks once a second, twice a second with a heartbeat when the meeting is about to end.
  const GAME = {
    bpm: () => 60, stepsPerBar: 8, bars: 4,   // one step = half a second
    gain: 2.6,                                // the soundscape is written quiet; this sets its overall level
    start() { tone.frequency.setTargetAtTime(20000, ctx.currentTime, 0.1);
      layer('room', true, () => noiseLoop('lowpass', 380, 0.5, 0.05)); this.floor(); },
    end() { for (const k of [...layers.keys()]) layer(k, false); },
    floor() {
      const f = intensity;
      layer('fan', f === 2, () => noiseLoop('bandpass', 220, 1.2, 0.05, 0.25, 40));     // 3F: projector fan
      layer('wind', f === 4, () => noiseLoop('lowpass', 700, 0.7, 0.09, 0.13, 380));    // 5F: wind below the roof
    },
    play(bar, s, t, sd) {
      // clock: tick (high) and tock (low) every second, every half second when urgent
      if (s % 2 === 0 || urgent) {
        const hi = (s / (urgent ? 1 : 2)) % 2 === 0;
        blip(urgent ? (hi ? 1900 : 1500) : (hi ? 1450 : 1100), t, 0.025, urgent ? 0.09 : 0.05, 'triangle');
        hiss(t, { type: 'highpass', freq: 5000, vol: urgent ? 0.05 : 0.03, decay: 0.012 });
      }
      if (urgent && s % 2 === 0) { kick(t, 0.2); kick(t + 0.16, 0.12); }    // heartbeat
      const r = Math.random, f = intensity;
      // keyboard typing (every floor but the roof)
      if (f < 4 && r() < 0.18) for (let i = 0, n = 3 + (r() * 7 | 0); i < n; i++) hiss(t + i * (0.06 + r() * 0.07), { freq: 2500 + r() * 1500, q: 2, vol: 0.02 + r() * 0.015, decay: 0.02 });
      if (f === 0 && r() < 0.025) {          // 1F Sales: a phone rings twice, somewhere across the floor
        for (const k of [0, 0.5]) { blip(440, t + k, 0.35, 0.018); blip(480, t + k, 0.35, 0.018); }
      }
      if (f === 1 && r() < 0.03) hiss(t, { type: 'bandpass', freq: 900, q: 3, vol: 0.04, a: 0.1, decay: 1.4, sweepTo: 1400 });   // 2F Finance: printer
      if (f === 1 && r() < 0.04) { blip(2100, t, 0.04, 0.02, 'square'); blip(2100, t + 0.1, 0.04, 0.02, 'square'); }           // calculator
      if (f === 3 && r() < 0.02) for (const k of [0, 0.3, 0.6]) blip(1760, t + k, 0.12, 0.025);                                  // 4F: microwave done
      if (f === 3 && r() < 0.03) for (let i = 0; i < 6; i++) hiss(t + i * 0.09 + r() * 0.04, { type: 'lowpass', freq: 500 + r() * 300, vol: 0.04, decay: 0.05 }); // coffee machine
      if (f === 4 && r() < 0.05) hiss(t, { type: 'highpass', freq: 3500, vol: 0.03, a: 0.3, decay: 1.5 });                      // 5F: sprinkler spray
    },
  };
  const TRACKS = { title: TITLE, game: GAME };

  /* ---------- scheduler ---------- */
  function stepDur() { return 60 / track.bpm() / (track.stepsPerBar / 4); }
  function tick() {
    const ahead = ctx.currentTime + 0.15;
    while (nextTime < ahead) {
      const total = track.bars * track.stepsPerBar, bar = Math.floor(step / track.stepsPerBar), s = step % track.stepsPerBar, sd = stepDur();
      const swingDelay = track.swing && s % 2 ? (track.swing - 0.5) * 2 * sd : 0;
      track.play(bar, s, nextTime + swingDelay, sd);
      nextTime += sd; step = (step + 1) % total;
    }
  }
  function silence(reset) {
    clearInterval(timer); timer = 0;
    const t = ctx.currentTime;
    bus.gain.cancelScheduledValues(t); bus.gain.setValueAtTime(bus.gain.value, t); bus.gain.linearRampToValueAtTime(0, t + 0.08);
    for (const s of live) { try { s.stop(t + 0.1); } catch (e) {} }
    live.clear();
    if (track && track.end) track.end();
    if (reset) step = 0;
  }
  function run() {
    const t = ctx.currentTime;
    bus.gain.cancelScheduledValues(t); bus.gain.setValueAtTime(0, t); bus.gain.linearRampToValueAtTime(track.gain || 1, t + 0.2);
    if (track.start) track.start();
    nextTime = t + 0.12; tick(); timer = setInterval(tick, 25);
  }

  const Music = {
    init,
    play(n) {
      if (!ctx) init(); if (!TRACKS[n]) return;
      if (name === n && state === 'playing') return;
      if (state !== 'stopped') silence(true);
      track = TRACKS[n]; name = n; step = 0; state = 'playing'; run();
    },
    stop() { if (ctx && state !== 'stopped') silence(true); state = 'stopped'; name = ''; },
    pause() { if (state === 'playing') { silence(false); state = 'paused'; } },
    resume() { if (state === 'paused') { state = 'playing'; run(); } },
    setVolume(v) { volume = Math.max(0, Math.min(1, v)); if (out) out.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.05); },
    mute(m) { muted = !!m; if (out) out.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.05); },
    setIntensity(n) { n = Math.max(0, Math.min(4, n | 0)); if (n === intensity) return; intensity = n; if (name === 'game' && state === 'playing') GAME.floor(); },
    setUrgent(u) { urgent = !!u; },
    get track() { return name; }, get state() { return state; }, get intensity() { return intensity; }, get urgent() { return urgent; },
  };
  global.Music = Music;
})(window);
