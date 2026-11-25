/* Roar Through the Ceiling! music and office ambience.
 * Title/result music: "Meditation 1" by Jason Shaw, audionautix.com, CC BY 4.0 (bundled MP3, see CREDITS.md).
 * In-game office soundscape: original, synthesized live with the Web Audio API by this file.
 *
 * Music.init(audioContext?, destination?)  create the bus (reuses the game's AudioContext when given)
 * Music.play('title')                     title and result screens: "Meditation 1" (looping MP3)
 * Music.play('game')                      in-game: no music, an office soundscape plus the meeting clock ticking
 * Music.stop() / pause() / resume()       pause keeps the position; resume continues from it
 * Music.setVolume(0..1) / mute(bool)      level and on/off (the game applies its global mute through these)
 * Music.setIntensity(0..4)                in-game: current floor (each floor has its own background sounds)
 * Music.setUrgent(bool)                   in-game: last seconds of the meeting (faster, higher ticking + heartbeat)
 * Music.setVoices(bool)                   in-game: muffled office voices on/off
 * Music.setSample('tick', AudioBuffer)    in-game: use a recorded clock tick instead of the synthesized one
 *
 * The soundscape is scheduled step by step on the audio clock, so it has no loop gap. */
(function (global) {
  'use strict';
  let ctx = null, out = null, bus = null, noise = null;
  let track = null, name = '', timer = 0, step = 0, nextTime = 0, state = 'stopped';
  let intensity = 0, urgent = false, voices = true, volume = 0.6, muted = false;
  const samples = {};              // decoded audio files handed in by the game (e.g. the clock tick)
  const live = new Set();          // one-shot sources, stopped on pause/stop
  const layers = new Map();        // looping background layers (room tone, wind...), keyed by name

  function init(audioContext, destination) {
    if (ctx) return Music;
    ctx = audioContext || new (global.AudioContext || global.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 14; comp.ratio.value = 2.5; comp.attack.value = 0.01; comp.release.value = 0.25;
    out = ctx.createGain(); out.gain.value = muted ? 0 : volume;
    bus = ctx.createGain();
    bus.connect(comp); comp.connect(out); out.connect(destination || ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return Music;
  }
  const keep = (src) => { live.add(src); src.onended = () => live.delete(src); return src; };
  function sampleAt(buf, t, vol, rate) {
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = buf; src.playbackRate.value = rate || 1; g.gain.value = vol;
    src.connect(g); g.connect(bus); src.start(t); keep(src);
  }

  /* ---------- sound sources ---------- */
  function env(g, t, v, a, d, s, end, r) {
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a);
    g.gain.setTargetAtTime(v * s, t + a, d / 3); g.gain.setValueAtTime(v * s, end); g.gain.linearRampToValueAtTime(0, end + r);
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

  /* ---------- title and result screens: "Meditation 1" by Jason Shaw (audionautix.com, CC BY 4.0) ---------- */
  // Streamed from the bundled MP3 through the music bus so volume, mute and pause apply; loops forever.
  const TITLE_URL = 'audio/meditation1.mp3', TITLE_LEVEL = 0.5;
  let song = null, songGain = null, songTimer = 0;
  const TITLE = {
    bpm: () => 60, stepsPerBar: 4, bars: 1, play() {},
    start() {
      if (!song) {
        song = new Audio(TITLE_URL); song.loop = true; song.preload = 'auto';
        songGain = ctx.createGain(); songGain.gain.value = 0;
        ctx.createMediaElementSource(song).connect(songGain); songGain.connect(out);
      }
      clearTimeout(songTimer);
      const t = ctx.currentTime;
      songGain.gain.cancelScheduledValues(t); songGain.gain.setValueAtTime(songGain.gain.value, t); songGain.gain.linearRampToValueAtTime(TITLE_LEVEL, t + 0.6);
      const p = song.play(); if (p && p.catch) p.catch(() => {});   // blocked until the first click: the caller retries then
    },
    end(reset) {
      if (!song) return;
      const t = ctx.currentTime;
      songGain.gain.cancelScheduledValues(t); songGain.gain.setValueAtTime(songGain.gain.value, t); songGain.gain.linearRampToValueAtTime(0, t + 0.25);
      clearTimeout(songTimer);
      songTimer = setTimeout(() => { song.pause(); if (reset) song.currentTime = 0; }, 280);
    },
  };

  /* ---------- muffled office voices, as if through a wall ---------- */
  // One phrase = a buzzy voice source whose pitch rises and falls like speech, shaped by two moving vowel
  // formants and a syllable-by-syllable volume envelope, then low-passed hard so no words can be made out.
  const VOWELS = [[730, 1090], [530, 1840], [270, 2290], [570, 840], [300, 870], [660, 1720], [440, 1020]];
  const SPEAKERS = [105, 122, 140, 195, 215, 240];   // base pitch (Hz): three lower and three higher voices
  function phrase(t, base, syllables, vol, laugh) {
    const r = Math.random, src = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    const f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(), g2 = ctx.createGain();
    src.type = 'sawtooth'; f1.type = f2.type = 'bandpass'; f1.Q.value = 6; f2.Q.value = 9; g2.gain.value = 0.5;
    lp.type = 'lowpass'; lp.frequency.value = 850; lp.Q.value = 0.3;
    src.connect(f1); src.connect(f2); f1.connect(g); f2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(bus);
    let x = t; g.gain.setValueAtTime(0, t);
    const rise = r() < 0.35;   // questions end higher
    for (let i = 0; i < syllables; i++) {
      const len = laugh ? 0.11 : 0.09 + r() * 0.16, [a, b] = VOWELS[r() * VOWELS.length | 0], last = i === syllables - 1;
      let p = base * (1 + (r() - 0.5) * 0.18) * (1 - i / syllables * 0.12);
      if (last && rise) p *= 1.25; if (laugh) p = base * (1.35 - i * 0.04);
      src.frequency.setTargetAtTime(p, x, 0.03);
      f1.frequency.setTargetAtTime(a, x, 0.02); f2.frequency.setTargetAtTime(b, x, 0.02);
      const peak = vol * (0.6 + r() * 0.4) * (i === 0 ? 1.1 : 1);
      g.gain.setTargetAtTime(peak, x, 0.012); g.gain.setTargetAtTime(peak * 0.25, x + len * 0.6, 0.02);
      x += len + (r() < 0.15 ? 0.08 : 0.015);
    }
    g.gain.setTargetAtTime(0, x, 0.03);
    src.frequency.setValueAtTime(base, t); src.start(t); src.stop(x + 0.3); keep(src);
    return x - t;
  }
  // a short back-and-forth between two people
  function chat(t, vol, laughs) {
    const r = Math.random, a = SPEAKERS[r() * 6 | 0];
    let b = SPEAKERS[r() * 6 | 0]; if (b === a) b = SPEAKERS[(SPEAKERS.indexOf(a) + 3) % 6];
    let x = t;
    for (let turn = 0, n = 2 + (r() * 3 | 0); turn < n; turn++) {
      x += phrase(x, turn % 2 ? b : a, 4 + (r() * 9 | 0), vol) + 0.25 + r() * 0.5;
      if (laughs && r() < 0.3) x += phrase(x, turn % 2 ? a : b, 4, vol * 0.8, true) + 0.2;
    }
  }

  /* ---------- in-game: office soundscape + meeting clock ---------- */
  // No music while playing (the microphone would pick it up): quiet room tone, per-floor background sounds,
  // and a clock that ticks once a second, twice a second with a heartbeat when the meeting is about to end.
  const GAME = {
    bpm: () => 60, stepsPerBar: 8, bars: 4,   // one step = half a second
    gain: 2.6,                                // the soundscape is written quiet; this sets its overall level
    start() {
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
        if (samples.tick) sampleAt(samples.tick, t, urgent ? 0.22 : 0.12, (hi ? 1.08 : 0.92) * (urgent ? 1.15 : 1));   // Kenney tick, tick-tock pitch
        else {
          blip(urgent ? (hi ? 1900 : 1500) : (hi ? 1450 : 1100), t, 0.025, urgent ? 0.09 : 0.05, 'triangle');
          hiss(t, { type: 'highpass', freq: 5000, vol: urgent ? 0.05 : 0.03, decay: 0.012 });
        }
      }
      if (urgent && s % 2 === 0) { kick(t, 0.2); kick(t + 0.16, 0.12); }    // heartbeat
      const r = Math.random, f = intensity;
      // people talking behind walls: busiest in the meeting room, chatty with laughs in the break room, none on the roof
      const talk = [0.07, 0.05, 0.12, 0.09, 0][f];
      if (voices && r() < talk) chat(t, f === 2 ? 0.05 : 0.04, f === 3);
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
    if (track && track.end) track.end(reset);
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
    setVoices(v) { voices = !!v; },                 // off while the microphone is listening
    setSample(k, buf) { samples[k] = buf; },
    get track() { return name; }, get state() { return state; }, get intensity() { return intensity; }, get urgent() { return urgent; },
  };
  global.Music = Music;
})(window);
