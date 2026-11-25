/* Roar Through the Ceiling! background music.
 * Original music, synthesized live with the Web Audio API (no audio files, no third-party samples).
 *
 * Music.init(audioContext?, destination?)  create the music bus (reuses the game's AudioContext when given)
 * Music.play('title' | 'game')            start a track from its first bar (no-op if it is already playing)
 * Music.stop() / pause() / resume()       pause keeps the position; resume continues from it
 * Music.setVolume(0..1) / mute(bool)      music level and on/off (the game's global mute is applied by the caller)
 * Music.setIntensity(0..4)                game track only: one step per office floor (more layers, slightly faster)
 *
 * Each track is a 16-bar loop scheduled step by step on the audio clock, so the loop point has no gap. */
(function (global) {
  'use strict';
  const A4 = 440, NAMES = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  function hz(n) {
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(n); if (!m) return 0;
    const semi = NAMES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12;
    return A4 * Math.pow(2, semi / 12);
  }
  // chord name -> bass root (octave 2) and chord tones (octave 3/4)
  const CHORDS = {
    C: ['C2', ['C4', 'E4', 'G4']], Am: ['A1', ['A3', 'C4', 'E4']], Dm: ['D2', ['D4', 'F4', 'A4']], G: ['G1', ['G3', 'B3', 'D4']],
    G7: ['G1', ['G3', 'B3', 'F4']], F: ['F1', ['F3', 'A3', 'C4']], Em: ['E2', ['E3', 'G3', 'B3']], E: ['E2', ['E3', 'G#3', 'B3']],
  };
  const up = (n, oct) => n.replace(/-?\d$/, d => String(Number(d) + oct));

  let ctx = null, out = null, bus = null, noise = null;
  let track = null, name = '', timer = 0, step = 0, nextTime = 0, state = 'stopped', intensity = 0;
  let volume = 0.6, muted = false;
  const live = new Set();   // scheduled sources, stopped on pause/stop

  function init(audioContext, destination) {
    if (ctx) return Music;
    ctx = audioContext || new (global.AudioContext || global.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.2;
    out = ctx.createGain(); out.gain.value = muted ? 0 : volume;
    bus = ctx.createGain(); bus.gain.value = 1;
    bus.connect(comp); comp.connect(out); out.connect(destination || ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return Music;
  }
  function track_(src) { live.add(src); src.onended = () => live.delete(src); return src; }

  /* ---------- instruments ---------- */
  // A note: oscillators -> low-pass filter (with its own sweep) -> ADSR gain -> bus
  function voice(freq, t, dur, o) {
    const g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.Q.value = o.q || 0.7;
    const cut = o.cutoff || 2000;
    f.frequency.setValueAtTime(cut * (o.sweep || 1), t); f.frequency.exponentialRampToValueAtTime(cut, t + (o.sweepTime || 0.12));
    const a = o.a || 0.005, d = o.d || 0.1, s = o.s == null ? 0.6 : o.s, r = o.r || 0.08, v = o.vol || 0.1;
    const end = t + Math.max(dur, a + d);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a);
    g.gain.setTargetAtTime(v * s, t + a, d / 3);
    g.gain.setValueAtTime(v * s, end); g.gain.linearRampToValueAtTime(0, end + r);
    f.connect(g); g.connect(bus);
    for (const [type, mult, det, lvl] of o.osc) {
      const osc = ctx.createOscillator(), og = ctx.createGain();
      osc.type = type; osc.frequency.value = freq * mult; osc.detune.value = det || 0; og.gain.value = lvl == null ? 1 : lvl;
      if (o.vib) { const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.5; lg.gain.value = o.vib;
        lfo.connect(lg); lg.connect(osc.detune); lfo.start(t + 0.15); lfo.stop(end + r + 0.05); track_(lfo); }
      osc.connect(og); og.connect(f); osc.start(t); osc.stop(end + r + 0.05); track_(osc);
    }
  }
  function noiseHit(t, o) {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noise; f.type = o.type; f.frequency.value = o.freq; f.Q.value = o.q || 0.8;
    g.gain.setValueAtTime(o.vol, t); g.gain.exponentialRampToValueAtTime(0.0005, t + o.decay);
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(t, Math.random() * 0.5); src.stop(t + o.decay + 0.02); track_(src);
  }
  function kick(t, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.34);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.36); track_(o);
    noiseHit(t, { type: 'highpass', freq: 3000, vol: vol * 0.12, decay: 0.012 });
  }
  function snare(t, vol) {
    noiseHit(t, { type: 'bandpass', freq: 1900, q: 0.7, vol: vol, decay: 0.17 });
    voice(185, t, 0.03, { osc: [['triangle', 1]], vol: vol * 0.6, a: 0.001, d: 0.06, s: 0, r: 0.04, cutoff: 1200 });
  }
  const hat = (t, vol, open) => noiseHit(t, { type: 'highpass', freq: 7500, vol: vol, decay: open ? 0.22 : 0.04 });
  const crash = (t, vol) => noiseHit(t, { type: 'highpass', freq: 4200, q: 0.5, vol: vol, decay: 1.2 });

  /* ---------- track 1: title, "Nine-to-Five Shuffle" ---------- */
  // C major, 104 BPM, swung eighths. Bouncy marimba lead, oom-pah tuba bass, soft pad, brushed kit.
  const TITLE = {
    bpm: () => 104, stepsPerBar: 8, swing: 0.6, bars: 16,
    chords: ['C', 'Am', 'Dm', 'G7', 'C', 'Am', 'F', 'G', 'F', 'G', 'Em', 'Am', 'Dm', 'G', 'C', 'G7'],
    melody: [
      ['E5', null, 'G5', 'E5', 'C5', null, 'D5', 'E5'], ['C5', null, 'A4', null, 'E5', null, 'D5', 'C5'],
      ['D5', null, 'F5', 'D5', 'A4', null, 'C5', 'D5'], ['B4', null, 'D5', null, 'G5', 'F5', 'E5', 'D5'],
      ['E5', null, 'G5', 'E5', 'C6', null, 'B5', 'A5'], ['G5', null, 'E5', null, 'C5', null, 'D5', 'E5'],
      ['F5', 'A5', 'G5', 'F5', 'E5', null, 'D5', null], ['D5', null, 'B4', null, 'G4', null, null, null],
      ['A5', null, 'A5', 'G5', 'F5', null, 'C5', null], ['B4', null, 'D5', null, 'G5', null, 'F5', null],
      ['E5', null, 'G5', 'E5', 'B4', null, 'E5', null], ['C5', 'E5', 'A5', null, 'G5', null, 'E5', null],
      ['F5', null, 'E5', null, 'D5', null, 'A4', null], ['B4', 'C5', 'D5', null, 'F5', null, 'E5', 'D5'],
      ['C5', null, 'G4', null, 'E5', null, 'C5', null], ['D5', null, 'F5', null, 'B4', null, 'G4', null],
    ],
    play(bar, s, t, sd) {
      const [root, tones] = CHORDS[this.chords[bar]];
      const n = this.melody[bar][s];
      if (n) {   // marimba-like mallet + a soft reedy double an octave down for body
        voice(hz(n), t, sd * 0.5, { osc: [['sine', 1], ['triangle', 2, 0, 0.25], ['sine', 4, 0, 0.08]], vol: 0.2, a: 0.004, d: 0.22, s: 0.15, r: 0.12, cutoff: 3200, sweep: 1.6 });
        voice(hz(n) / 2, t, sd * 0.8, { osc: [['square', 1]], vol: 0.035, a: 0.02, d: 0.1, s: 0.7, r: 0.1, cutoff: 900, q: 1 });
      }
      // tuba: root on 1 and 3, fifth on 2 and 4, walk-up on the last eighth of every 4th bar
      const fifth = hz(root) * 1.5;
      if (s === 0 || s === 4) voice(hz(root), t, sd * 0.7, { osc: [['triangle', 1], ['square', 1, 0, 0.3]], vol: 0.26, a: 0.008, d: 0.12, s: 0.5, r: 0.06, cutoff: 520, sweep: 1.8 });
      if (s === 2 || s === 6) voice(fifth, t, sd * 0.55, { osc: [['triangle', 1], ['square', 1, 0, 0.3]], vol: 0.2, a: 0.008, d: 0.1, s: 0.4, r: 0.05, cutoff: 520, sweep: 1.8 });
      if (s === 7 && bar % 4 === 3) voice(fifth * 1.122, t, sd * 0.5, { osc: [['triangle', 1]], vol: 0.18, a: 0.006, d: 0.08, s: 0.4, r: 0.05, cutoff: 600 });
      // pad: soft chord for the whole bar
      if (s === 0) for (const c of tones) voice(hz(c), t, sd * 7.6, { osc: [['triangle', 1], ['sine', 2, 4, 0.2]], vol: 0.028, a: 0.35, d: 0.5, s: 0.8, r: 0.4, cutoff: 1400 });
      // brushed kit
      if (s === 0 || s === 4) kick(t, 0.55);
      if (s === 2 || s === 6) snare(t, 0.12);
      hat(t, s % 2 ? 0.035 : 0.05, false);
      if (bar === 15 && s === 7) snare(t, 0.08);
    },
  };

  /* ---------- track 2: in-game, "Overtime Escape" ---------- */
  // A minor, 138-150 BPM, straight sixteenths. Pulsing synth bass, saw lead, arpeggio and drums that build per floor.
  const GAME = {
    bpm: () => 138 + intensity * 3, stepsPerBar: 16, bars: 16,
    chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E', 'Dm', 'Am', 'F', 'E', 'Dm', 'Am', 'F', 'E'],
    lead: [   // eighth notes; '-' holds the previous note
      ['A4', '-', 'C5', 'E5', '-', 'D5', 'C5', 'B4'], ['A4', '-', '-', 'F4', 'A4', 'C5', '-', 'A4'],
      ['G4', '-', 'C5', 'E5', '-', 'G5', 'E5', 'C5'], ['D5', '-', '-', 'B4', '-', 'G4', 'A4', 'B4'],
      ['C5', '-', 'E5', 'A5', '-', 'G5', 'E5', 'C5'], ['F5', '-', 'E5', 'C5', '-', 'A4', 'C5', 'F5'],
      ['E5', '-', 'D5', 'B4', '-', 'G4', 'B4', 'D5'], ['G#5', '-', '-', 'E5', '-', 'B4', '-', '-'],
      ['F5', '-', 'E5', 'D5', '-', 'A4', 'D5', 'F5'], ['E5', '-', '-', 'C5', '-', 'A4', '-', 'C5'],
      ['A5', '-', 'G5', 'F5', '-', 'C5', 'F5', 'A5'], ['G#5', '-', '-', 'B5', '-', 'G#5', 'E5', '-'],
      ['D5', 'F5', 'A5', '-', 'G5', 'F5', 'E5', 'D5'], ['C5', 'E5', 'A5', '-', 'B5', 'A5', 'G5', 'E5'],
      ['F5', '-', 'A5', '-', 'C6', '-', 'A5', 'F5'], ['E5', '-', 'G#5', '-', 'B5', '-', 'D6', '-'],
    ],
    play(bar, s, t, sd) {
      const [root, tones] = CHORDS[this.chords[bar]], lvl = intensity;
      // lead on eighths, length = held slots
      if (s % 2 === 0) {
        const row = this.lead[bar], i = s / 2, n = row[i];
        if (n && n !== '-') {
          let len = 1; while (i + len < 8 && row[i + len] === '-') len++;
          const o = { osc: [['sawtooth', 1, -7], ['sawtooth', 1, 7], ['square', 0.5, 0, 0.3]], vol: 0.075, a: 0.01, d: 0.18, s: 0.55, r: 0.1, cutoff: 2300 + lvl * 300, sweep: 1.7, vib: len > 1 ? 12 : 0 };
          voice(hz(n), t, sd * 2 * len * 0.92, o);
          if (lvl >= 4) voice(hz(n) * 2, t, sd * 2 * len * 0.9, Object.assign({}, o, { vol: 0.03 }));
        }
      }
      // bass: driving eighths with octave jumps
      if (s % 2 === 0) {
        const pat = [0, 0, 12, 0, 0, 12, 0, 7], semi = pat[s / 2];
        voice(hz(root) * 2 * Math.pow(2, semi / 12), t, sd * 1.5, { osc: [['sawtooth', 1], ['square', 0.5, 0, 0.6]], vol: 0.17, a: 0.004, d: 0.09, s: 0.35, r: 0.04, cutoff: 650, sweep: 2.6, sweepTime: 0.08, q: 2 });
      }
      // arpeggio from floor 3
      if (lvl >= 2) {
        const n = tones[[0, 1, 2, 1][s % 4]];
        voice(hz(up(n, 1)), t, sd * 0.6, { osc: [['square', 1]], vol: 0.03, a: 0.002, d: 0.06, s: 0.2, r: 0.03, cutoff: 3200 });
      }
      // drums
      if (s % 4 === 0) kick(t, 0.75);
      if (s === 4 || s === 12) snare(t, 0.32);
      if (lvl >= 1 || s % 2 === 0) hat(t, s % 2 ? 0.035 : 0.06, false);
      if (lvl >= 3 && s % 4 === 2) hat(t, 0.05, true);
      if (lvl >= 4 && bar % 4 === 0 && s === 0) crash(t, 0.12);
      if (bar % 8 === 7 && s >= 12) snare(t, 0.12 + (s - 12) * 0.05);   // fill into the next phrase
    },
  };
  const TRACKS = { title: TITLE, game: GAME };

  /* ---------- scheduler ---------- */
  function stepDur() { return 60 / track.bpm() / (track.stepsPerBar / 4); }
  function tick() {
    const ahead = ctx.currentTime + 0.12;
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
    if (reset) step = 0;
  }
  function run() {
    const t = ctx.currentTime;
    bus.gain.cancelScheduledValues(t); bus.gain.setValueAtTime(0, t); bus.gain.linearRampToValueAtTime(1, t + 0.15);
    nextTime = t + 0.12; tick(); timer = setInterval(tick, 25);
  }

  const Music = {
    init,
    play(n) {
      if (!ctx) init(); if (!TRACKS[n]) return;
      if (name === n && state === 'playing') return;
      if (state !== 'stopped') silence(true);
      track = TRACKS[n]; name = n; step = 0; state = 'playing';
      run();
    },
    stop() { if (ctx && state !== 'stopped') silence(true); state = 'stopped'; name = ''; },
    pause() { if (state === 'playing') { silence(false); state = 'paused'; } },
    resume() { if (state === 'paused') { state = 'playing'; run(); } },
    setVolume(v) { volume = Math.max(0, Math.min(1, v)); if (out) out.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.05); },
    mute(m) { muted = !!m; if (out) out.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.05); },
    setIntensity(n) { intensity = Math.max(0, Math.min(4, n | 0)); },
    get track() { return name; }, get state() { return state; }, get intensity() { return intensity; },
  };
  global.Music = Music;
})(window);
