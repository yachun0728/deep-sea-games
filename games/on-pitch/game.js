  /* ---------- 不准跑調 Stay On Pitch：麥克風音高判定；免費入場，沒有 BONUS；分數與星數只是成績，不換點數 ---------- */
  function opRoute(active){ if(window.deepSeaOnPitch)window.deepSeaOnPitch.route(active); }
(function(){
/*CORE_START*/
// ===== 核心：偵測器與遊戲邏輯（不碰 DOM，可在 Node 測試）=====
const NOTE_KEYS = 'CDEFGAB';
const SEMI = [0,2,4,5,7,9,11];
const SOLF = ['Do','Re','Mi','Fa','Sol','La','Si'];
const NOTE_HZ = SEMI.map(s => 440*Math.pow(2,(60+s-69)/12));
const PC_NAMES = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const mod = (a,n) => ((a%n)+n)%n;
function hzToMidi(f){ return 69+12*Math.log2(f/440); }
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

// YIN 音高偵測。buf: Float32Array 時域資料；回傳 {hz, clarity} 或 null
function detectPitch(buf, sr){
  const N = buf.length;
  let sum = 0;
  for (let i=0;i<N;i++) sum += buf[i]*buf[i];
  const rms = Math.sqrt(sum/N);
  if (rms < 0.008) return null;
  const tauMin = Math.max(2, Math.floor(sr/1200));
  const tauMax = Math.min(Math.floor(sr/70), (N>>1)-1);
  const W = N - tauMax;
  const d = new Float32Array(tauMax+1);
  for (let tau=1; tau<=tauMax; tau++){
    let s = 0;
    for (let j=0;j<W;j++){ const x = buf[j]-buf[j+tau]; s += x*x; }
    d[tau] = s;
  }
  const cm = new Float32Array(tauMax+1);
  cm[0] = 1;
  let run = 0;
  for (let tau=1; tau<=tauMax; tau++){
    run += d[tau];
    cm[tau] = run > 0 ? d[tau]*tau/run : 1;
  }
  const thr = 0.15;
  let tauE = -1;
  for (let tau=tauMin; tau<=tauMax; tau++){
    if (cm[tau] < thr){
      while (tau+1<=tauMax && cm[tau+1] < cm[tau]) tau++;
      tauE = tau; break;
    }
  }
  if (tauE < 0) return null;
  let t = tauE;
  if (t>1 && t<tauMax){
    const a=cm[t-1], b=cm[t], c=cm[t+1];
    const den = a - 2*b + c;
    if (den !== 0) t = t + (a - c)/(2*den);
  }
  return { hz: sr/t, clarity: 1 - cm[tauE] };
}

function seq(str){ return str.split('').map(c => NOTE_KEYS.indexOf(c)); }
function randSeq(rng, pool, n){
  const out = []; let last = -1;
  while (out.length < n){
    const p = pool[Math.floor(rng()*pool.length)];
    if (p === last) continue;
    out.push(p); last = p;
  }
  return out;
}

function makeLevels(){
  const CUE_FULL = { height:true,  label:'always', color:'always', tone:'target', toneOff:-1.5 };
  const CUE_W3   = { height:false, label:'always', color:'always', tone:'target', toneOff:-1.5 };
  const CUE_W4   = { height:false, label:'none',   color:'flash',  tone:'target', toneOff:-1.5, flashOff:-1.5 };
  const worlds = [
    { name:'認識七階',   tol:45, hold:0.20, win:1.4, gap:2.6, cues:CUE_FULL },
    { name:'唱旋律',     tol:40, hold:0.25, win:1.2, gap:2.2, cues:CUE_FULL },
    { name:'看不見階梯', tol:40, hold:0.25, win:1.1, gap:2.0, cues:CUE_W3 },
    { name:'只靠耳朵',   tol:35, hold:0.25, win:1.0, gap:2.0, cues:CUE_W4 },
    { name:'絕對音準',   tol:30, hold:0.25, win:1.0, gap:2.4, cues:null }
  ];
  const W5 = [
    { height:false, label:'flash', color:'always', tone:null, flashOff:-1.5 },
    { height:false, label:'none',  color:'flash',  tone:null, flashOff:-1.5 },
    { height:false, label:'flash', color:'none',   tone:'distractor', toneOff:-2.0, flashOff:-1.3 },
    { height:false, label:'flash', color:'none',   tone:null, flashOff:-2.0 }
  ];
  const names = [
    ['C、G 兩階','C E G','音階上行','Boss：音階上下行'],
    ['小星星','瑪莉有隻小綿羊','歡樂頌','Boss：Jingle Bells'],
    ['隨機 C E G','隨機五音','隨機七音','Boss：小星星（看不見）'],
    ['隨機 C E G','隨機五音','隨機七音','Boss：連續 12 音不重複'],
    ['音名閃現','顏色閃現','干擾音','Boss：只給音名']
  ];
  const lv = [];
  for (let w=0; w<5; w++){
    for (let l=0; l<4; l++){
      const seed = w*10+l+1, rng = mulberry32(seed*7919);
      let notes;
      if (w===0) notes = [seq('CGCGGCGC'), seq('CEGECGEGCE'), seq('CDEFGAB'), seq('CDEFGABBAGFEDCGC')][l];
      else if (w===1) notes = [seq('CCGGAAGFFEEDDC'), seq('EDCDEEEDDDEGG'), seq('EEFGGFEDCCDEEDD'), seq('EEEEEEEGCDEFFFFFEE')][l];
      else if (w===2 || w===3){
        if (w===2 && l===3) notes = seq('CCGGAAGFFEEDDC');
        else if (w===3 && l===3) notes = randSeq(rng,[0,1,2,3,4,5,6],12);
        else notes = randSeq(rng, [[0,2,4],[0,1,2,4,5],[0,1,2,3,4,5,6]][l], 8+l*2);
      } else notes = randSeq(rng,[0,1,2,3,4,5,6],10);
      const cues = worlds[w].cues || W5[l];
      lv.push({ id:(w+1)+'-'+(l+1), w:w, l:l, worldName:worlds[w].name, title:names[w][l],
        notes:notes, tol:worlds[w].tol, hold:worlds[w].hold, win:worlds[w].win, gap:worlds[w].gap,
        cues:cues, seed:seed, rowLabels: w<3 });
    }
  }
  return lv;
}
function endlessLevel(){
  return { id:'∞', w:4, l:0, worldName:'無盡', title:'無盡', notes:[], tol:30, hold:0.25, win:1.0, gap:2.4,
    cues:{ height:false, label:'flash', color:'none', tone:null, flashOff:-1.5 }, seed:99, rowLabels:false, endless:true };
}

function createGame(level, opts){
  opts = opts || {};
  const strict = opts.octave === 'strict';
  const rng = mulberry32((level.seed||1)*131);
  const g = { level:level, strict:strict, t:0, lives:3, score:0, combo:0, maxCombo:0, walls:[], events:[],
    flash:null, state:'play', stars:0, passes:0, tol:level.tol,
    stats:{perfect:0,good:0,ok:0,fail:0}, view:{voice:false,p:null,cents:null,nearest:null,centsNear:0} };
  const buf = [];
  function addWall(note, arrive){
    const w = { note:note, arrive:arrive, passed:false, judged:false, run:0, sum:0, grade:null,
      toneDone:false, flashDone:false, distract:null };
    if (level.cues.tone === 'distractor'){
      let d; do { d = Math.floor(rng()*7); } while (d === note);
      w.distract = d;
    }
    g.walls.push(w);
  }
  let lastNote = -1;
  function addEndless(){
    let n; do { n = Math.floor(rng()*7); } while (n === lastNote);
    lastNote = n;
    const last = g.walls.length ? g.walls[g.walls.length-1].arrive + level.gap : 3.5;
    addWall(n, last);
  }
  if (level.endless){ for (let i=0;i<4;i++) addEndless(); }
  else level.notes.forEach((n,i) => addWall(n, 3.5 + i*level.gap));

  g.step = function(dt, hz){
    if (g.state !== 'play') return;
    g.t += dt;
    const c = level.cues;
    if (hz) buf.push({ t:g.t, m:hzToMidi(hz) });
    while (buf.length && buf[0].t < g.t - 0.12) buf.shift();
    let m = null;
    if (buf.length){
      const arr = buf.map(x => x.m).sort((a,b)=>a-b);
      m = arr[arr.length>>1];
    }
    const active = g.walls.find(w => !w.judged && g.t >= w.arrive && g.t <= w.arrive + level.win);
    const tw = active || g.walls.find(w => !w.judged);
    const v = g.view;
    if (m !== null){
      const pr = m - 60;
      let p;
      if (strict) p = pr;
      else { const tc = tw ? SEMI[tw.note] : 5.5; p = tc + (mod(pr - tc + 6, 12) - 6); }
      v.voice = true; v.p = p;
      const rn = Math.round(pr);
      v.nearest = mod(rn,12); v.centsNear = (pr - rn)*100;
    } else { v.voice = false; v.p = null; v.cents = null; v.nearest = null; }
    // 提示事件
    g.walls.forEach(w => {
      if (!w.judged){
        if (c.tone && !w.toneDone && g.t >= w.arrive + c.toneOff){
          w.toneDone = true;
          g.events.push({ type:'tone', note: c.tone==='distractor' ? w.distract : w.note });
        }
        if (c.flashOff !== undefined && !w.flashDone && g.t >= w.arrive + c.flashOff){
          w.flashDone = true;
          g.flash = { note:w.note, t0:g.t, dur:0.5 };
        }
      }
    });
    // 判定
    if (active){
      let d = null;
      if (m !== null){
        d = (m - 60 - SEMI[active.note]) * 100;
        if (!strict) d = mod(d + 600, 1200) - 600;
      }
      v.cents = d;
      if (d !== null && Math.abs(d) <= g.tol){
        active.run += dt; active.sum += Math.abs(d)*dt;
        if (!active.passed && active.run >= level.hold){
          active.passed = true;
          const avg = active.sum / active.run;
          let grade = 'ok', pts = 40;
          if (avg <= 10){ grade = 'perfect'; pts = 100; }
          else if (avg <= 25){ grade = 'good'; pts = 70; }
          const mult = (1 + Math.min(0.5, 0.1*Math.floor(g.combo/5))) * (strict ? 1.5 : 1);
          g.score += Math.round(pts*mult);
          g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo);
          g.stats[grade]++; g.passes++;
          active.grade = grade;
          g.events.push({ type:'pass', grade:grade });
          if (level.endless) g.tol = Math.max(15, 30 - 5*Math.floor(g.passes/10));
        }
      } else { active.run = 0; active.sum = 0; }
    }
    g.walls.forEach(w => {
      if (!w.judged && g.t > w.arrive + level.win){
        w.judged = true;
        if (!w.passed){
          g.lives--; g.combo = 0; g.stats.fail++;
          g.events.push({ type:'fail' });
        }
      }
    });
    if (level.endless){
      while (g.walls.filter(w => !w.judged).length < 4) addEndless();
    }
    if (g.lives <= 0){ g.state = 'over'; return; }
    if (!level.endless){
      const last = g.walls[g.walls.length-1];
      if (g.walls.every(w => w.judged) && g.t > last.arrive + level.win + 0.4){
        g.state = 'clear';
        g.stars = g.stats.fail === 0 ? 3 : (g.stats.fail <= 2 ? 2 : 1);
      }
    }
  };
  return g;
}
/*CORE_END*/const W = 400, H = 720;
const FONT = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif';
const EN = () => !!(window.deepSeaI18n && window.deepSeaI18n.getLanguage && window.deepSeaI18n.getLanguage() === 'en');
const T = (zh, en) => EN() ? en : zh;
const TITLE_EN = { 'C、G 兩階':'C and G','C E G':'C E G','音階上行':'Scale up','Boss：音階上下行':'Boss: scale up and down','小星星':'Twinkle Twinkle','瑪莉有隻小綿羊':'Mary Had a Little Lamb','歡樂頌':'Ode to Joy','Boss：Jingle Bells':'Boss: Jingle Bells','隨機 C E G':'Random C E G','隨機五音':'Random 5 notes','隨機七音':'Random 7 notes','Boss：小星星（看不見）':'Boss: Twinkle (hidden)','Boss：連續 12 音不重複':'Boss: 12 notes, no repeats','音名閃現':'Name flash','顏色閃現':'Color flash','干擾音':'Distractor','Boss：只給音名':'Boss: name only','無盡':'Endless' };
const LT = lv => EN() ? (TITLE_EN[lv.title] || lv.title) : lv.title;
const THEME = {
  noteColors: ['#e0554f','#f08a3c','#f2c94c','#7bc96f','#3fb6b0','#4a82d8','#9a6bd6'],
  noteShapes: ['circle','triangle','square','diamond','hex','star','cross'],
  amber: '#f0a830', amberHi:'#ffd27a', grey:'#8d99a6',
  txt:'#eaf0f6', dim:'#8d99a6'
};
const STEP_H = 64, BASE_Y = 518, CHAR_X = 96, SPEED = 200;
const rowY = i => BASE_Y - STEP_H*i - STEP_H/2;

const cv = $('op-canvas');
const cx = cv.getContext('2d');
let ratio = 1;
(function sizeCanvas(){ const dpr = Math.min(window.devicePixelRatio||1, 2); cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr); ratio = dpr; })();

// 存檔
const SAVE_KEY = 'on-pitch-v1';
let prefs = { stars:{}, input:'mic', octave:'any' };
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)||'null'); if (s) prefs = Object.assign(prefs, s); } catch(e){}
function persist(){ try { localStorage.setItem(SAVE_KEY, JSON.stringify(prefs)); } catch(e){} }

const LEVELS = makeLevels();
const OP = { active:false, starting:false, resuming:false, analytics:null, sel:0, score:0, msg:null };
let scene = 'menu';          // menu | play | pause | result
let game = null, level = null;
let msg = '', msgUntil = 0;
function toast(t){ msg = t; msgUntil = performance.now() + 3500; }

// ---- 音訊 ----
let actx = null, muteUntil = 0;
function ensureCtx(){
  if (!actx){ const AC = window.AudioContext || window.webkitAudioContext; actx = new AC(); }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function playTone(note){
  const c = ensureCtx(), now = c.currentTime;
  const o = c.createOscillator(), g = c.createGain();
  o.type = 'triangle'; o.frequency.value = NOTE_HZ[note];
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.25, now+0.03);
  g.gain.setValueAtTime(0.25, now+0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, now+0.4);
  o.connect(g); g.connect(c.destination);
  o.start(now); o.stop(now+0.42);
  muteUntil = performance.now() + 400 + 150;   // 播音時暫停偵測，避免麥克風收回喇叭聲
}
function playTick(kind){
  const c = ensureCtx(), now = c.currentTime;
  const len = Math.floor(c.sampleRate*(kind==='fail'?0.2:0.07));
  const b = c.createBuffer(1,len,c.sampleRate), d = b.getChannelData(0);
  for (let i=0;i<len;i++) d[i] = (Math.random()*2-1)*(1-i/len);
  const s = c.createBufferSource(); s.buffer = b;
  const f = c.createBiquadFilter(); f.type = kind==='fail' ? 'lowpass' : 'highpass';
  f.frequency.value = kind==='fail' ? 500 : 3500;
  const g = c.createGain(); g.gain.value = 0.15;
  s.connect(f); f.connect(g); g.connect(c.destination); s.start(now);
  muteUntil = Math.max(muteUntil, performance.now() + 250);
}

// ---- 麥克風 ----
const Mic = {
  ready:false, stream:null, an:null, buf:null, last:null, lastT:0,
  async start(){
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error(T('此瀏覽器不支援麥克風（需要 https 或 localhost）', 'This browser has no microphone support (needs https or localhost)'));
    const c = ensureCtx();
    this.stream = await navigator.mediaDevices.getUserMedia({ audio:{ echoCancellation:false, noiseSuppression:false, autoGainControl:false } });
    const src = c.createMediaStreamSource(this.stream);
    this.an = c.createAnalyser(); this.an.fftSize = 2048;
    src.connect(this.an);                       // 不接到 destination，避免回授
    this.buf = new Float32Array(2048);
    this.ready = true;
  },
  stop(){ if (this.stream) this.stream.getTracks().forEach(t => t.stop()); this.stream = null; this.ready = false; },
  read(now){
    if (!this.ready) return null;
    if (now - this.lastT < 24) return this.last;     // 約 40 次／秒，省電
    this.lastT = now;
    this.an.getFloatTimeDomainData(this.buf);
    const r = detectPitch(this.buf, actx.sampleRate);
    this.last = (r && r.clarity >= 0.8) ? r.hz : null;
    return this.last;
  }
};

// ---- 螢幕鍵盤（練習模式／麥克風失效的退路）----
const keysDown = {};     // 索引 -> true
const ptrKey = {};       // pointerId -> 索引
function keyHz(){
  let idx = -1;
  for (let i=0;i<7;i++) if (keysDown[i]) idx = i;
  return idx >= 0 ? NOTE_HZ[idx] : null;
}
window.addEventListener('keydown', e => {
  if (!opShown() || scene !== 'play' || e.ctrlKey || e.metaKey || e.altKey) return;
  const i = NOTE_KEYS.toLowerCase().indexOf(e.key.toLowerCase());
  const n = parseInt(e.key,10);
  if (e.key.length===1 && i >= 0) keysDown[i] = true;
  else if (n >= 1 && n <= 7) keysDown[n-1] = true;
});
window.addEventListener('keyup', e => {
  if (!opShown()) return;
  const i = NOTE_KEYS.toLowerCase().indexOf(e.key.toLowerCase());
  const n = parseInt(e.key,10);
  if (e.key.length===1 && i >= 0) keysDown[i] = false;
  else if (n >= 1 && n <= 7) keysDown[n-1] = false;
});

function getHz(now){
  if (prefs.input === 'key') return keyHz();
  return Mic.read(now);
}

// ---- 流程 ----
let fx = { hurt:0, happy:0, popups:[] };
let heroS = 2.5;
async function ensureMic(){
  if (prefs.input === 'mic' && !Mic.ready){
    try { await Mic.start(); }
    catch(e){
      toast(T('麥克風無法使用，已改用螢幕琴鍵。', 'Microphone unavailable. Switched to on-screen keys.'));
      prefs.input = 'key'; persist(); opUI();
    }
  }
}
async function startLevel(lv){
  if (OP.active || OP.starting) return;
  if (ENTRY_FEE > S.balance){ opSay(LOW_MSG, 'lose'); return; }
  OP.starting = true; opUI();
  ensureCtx();
  await ensureMic();
  OP.starting = false;
  if (!opShown()){ Mic.stop(); opUI(); return; }
  level = lv; OP.sel = Math.max(0, LEVELS.indexOf(lv)); if (lv.endless) OP.sel = LEVELS.length;
  game = createGame(lv, { octave: prefs.octave });
  fx = { hurt:0, happy:0, popups:[] };
  heroS = 2.5; scene = 'play';
  OP.active = true; OP.score = 0;
  if (AN.interact) AN.interact();
  OP.analytics = AN.start('on-pitch', ENTRY_FEE, { stage: lv.w + 1, step: 0 });
  opSay('第 {id} 關開始：唱出缺口的音。|Level {id}: sing the note in the gap.', '', { id: lv.id });
  opUI();
}
function endRound(result, extra){
  if (!OP.active) return;
  const a = OP.analytics; OP.active = false; OP.analytics = null;
  AN.end(a, 0, result, extra);
  opUI();
}
function pauseRound(){
  if (scene !== 'play') return;
  scene = 'pause'; Object.keys(keysDown).forEach(k => keysDown[k] = false);
  if (prefs.input === 'mic') Mic.stop();
  if (OP.analytics) AN.progress(OP.analytics, { phase:'pause' }, true);
  opUI();
}
async function resumeRound(){
  if (scene !== 'pause' || OP.resuming) return;
  OP.resuming = true;
  await ensureMic();
  OP.resuming = false;
  if (scene !== 'pause' || !opShown()) return;
  scene = 'play'; muteUntil = performance.now() + 300;
  if (OP.analytics) AN.resume(OP.analytics);
  opUI();
}
function leaveToMenu(){
  if (OP.active) endRound('abandoned', { score: game ? game.score : 0 });
  scene = 'menu'; opUI();
}
document.addEventListener('visibilitychange', () => { if (document.hidden){ pauseRound(); if (scene !== 'play') Mic.stop(); } });

// ---- 輸入 ----
let buttons = [];
function toLogical(e){
  const r = cv.getBoundingClientRect();
  return { x:(e.clientX - r.left)/r.width*W, y:(e.clientY - r.top)/r.height*H };
}
cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  const p = toLogical(e);
  ensureCtx();
  if (scene === 'play' && prefs.input === 'key'){
    for (let i=0;i<7;i++){
      const kx = 20 + i*52;
      if (p.x>=kx && p.x<=kx+48 && p.y>=566 && p.y<=700){ keysDown[i] = true; ptrKey[e.pointerId] = i; try{cv.setPointerCapture(e.pointerId);}catch(_){ } return; }
    }
  }
  for (let i=buttons.length-1;i>=0;i--){
    const b = buttons[i];
    if (p.x>=b.x && p.x<=b.x+b.w && p.y>=b.y && p.y<=b.y+b.h){ b.fn(); return; }
  }
  if (scene === 'pause') resumeRound();
});
function releasePtr(e){
  if (e.pointerId in ptrKey){ keysDown[ptrKey[e.pointerId]] = false; delete ptrKey[e.pointerId]; }
}
cv.addEventListener('pointerup', releasePtr);
cv.addEventListener('pointercancel', releasePtr);

// ================= 繪圖工具 =================
function shape(kind, x, y, r){
  cx.beginPath();
  if (kind==='circle') cx.arc(x,y,r,0,Math.PI*2);
  else if (kind==='square') cx.rect(x-r*0.85,y-r*0.85,r*1.7,r*1.7);
  else if (kind==='triangle'){ cx.moveTo(x,y-r); cx.lineTo(x+r,y+r*0.85); cx.lineTo(x-r,y+r*0.85); cx.closePath(); }
  else if (kind==='diamond'){ cx.moveTo(x,y-r); cx.lineTo(x+r,y); cx.lineTo(x,y+r); cx.lineTo(x-r,y); cx.closePath(); }
  else if (kind==='hex'){ for(let i=0;i<6;i++){ const a=Math.PI/3*i; cx.lineTo(x+r*Math.cos(a),y+r*Math.sin(a)); } cx.closePath(); }
  else if (kind==='star'){ for(let i=0;i<10;i++){ const a=-Math.PI/2+Math.PI/5*i, rr=i%2?r*0.45:r; cx.lineTo(x+rr*Math.cos(a),y+rr*Math.sin(a)); } cx.closePath(); }
  else if (kind==='cross'){ const t=r*0.35; cx.moveTo(x-t,y-r); cx.lineTo(x+t,y-r); cx.lineTo(x+t,y-t); cx.lineTo(x+r,y-t); cx.lineTo(x+r,y+t); cx.lineTo(x+t,y+t); cx.lineTo(x+t,y+r); cx.lineTo(x-t,y+r); cx.lineTo(x-t,y+t); cx.lineTo(x-r,y+t); cx.lineTo(x-r,y-t); cx.lineTo(x-t,y-t); cx.closePath(); }
  cx.fill();
}
function heart(x, y, s){
  cx.beginPath();
  cx.moveTo(x, y+s*0.9);
  cx.bezierCurveTo(x-s*1.7, y-s*0.1, x-s*0.8, y-s*1.25, x, y-s*0.45);
  cx.bezierCurveTo(x+s*0.8, y-s*1.25, x+s*1.7, y-s*0.1, x, y+s*0.9);
  cx.fill();
}
// 文字：opt.shadow 發光陰影、opt.stroke 描邊
function text(t, x, y, size, color, align, weight, opt){
  opt = opt || {};
  cx.font = size + 'px ' + FONT;
  cx.textAlign = align || 'center'; cx.textBaseline = 'middle';
  cx.save();
  if (opt.shadow){ cx.shadowColor = opt.shadow; cx.shadowBlur = opt.blur || 10; cx.shadowOffsetY = opt.dy || 0; }
  if (opt.stroke){ cx.lineJoin = 'round'; cx.lineWidth = opt.sw || 4; cx.strokeStyle = opt.stroke; cx.strokeText(t, x, y); }
  cx.fillStyle = color || THEME.txt;
  cx.fillText(t, x, y);
  cx.restore();
}
function rrect(x,y,w,h,r){
  cx.beginPath(); cx.moveTo(x+r,y); cx.arcTo(x+w,y,x+w,y+h,r); cx.arcTo(x+w,y+h,x,y+h,r); cx.arcTo(x,y+h,x,y,r); cx.arcTo(x,y,x+w,y,r); cx.closePath();
}
// 面板：漸層底、陰影、細邊框、頂部高光
function panel(x, y, w, h, r, o){
  o = o || {};
  cx.save();
  if (o.shadow){ cx.shadowColor = 'rgba(0,0,0,0.5)'; cx.shadowBlur = o.shadow; cx.shadowOffsetY = 4; }
  const g = cx.createLinearGradient(0, y, 0, y+h);
  g.addColorStop(0, o.c1 || '#26343f'); g.addColorStop(1, o.c2 || '#18222b');
  cx.fillStyle = g; rrect(x,y,w,h,r); cx.fill();
  cx.restore();
  cx.save(); rrect(x,y,w,h,r); cx.clip();
  const hg = cx.createLinearGradient(0,y,0,y+Math.min(h,18));
  hg.addColorStop(0,'rgba(255,255,255,0.10)'); hg.addColorStop(1,'rgba(255,255,255,0)');
  cx.fillStyle = hg; cx.fillRect(x,y,w,Math.min(h,18));
  cx.restore();
  cx.strokeStyle = o.stroke || 'rgba(255,255,255,0.10)'; cx.lineWidth = o.sw || 1.2;
  rrect(x+0.6,y+0.6,w-1.2,h-1.2,r); cx.stroke();
}
function button(x,y,w,h,label,fn,opt){
  opt = opt || {};
  const r = opt.r || 12;
  if (opt.active) panel(x,y,w,h,r,{ c1:'#ffd27a', c2:'#e8981c', stroke:'rgba(255,255,255,0.5)', shadow:8 });
  else panel(x,y,w,h,r,{ c1: opt.c1||'#2b3a47', c2: opt.c2||'#1c2731', stroke: opt.stroke, sw: opt.stroke?2:1.2, shadow:6 });
  text(label, x+w/2, y+h/2+1, opt.size||16, opt.active ? '#2a1a00' : (opt.color||THEME.txt));
  buttons.push({x:x,y:y,w:w,h:h,fn:fn});
}
function noteName(i){ return NOTE_KEYS[i]; }
function stars(cx0, cy0, n, total, r, gap){
  for (let k=0;k<total;k++){
    const on = k < n;
    cx.save();
    if (on){ cx.shadowColor = THEME.amber; cx.shadowBlur = 8; }
    cx.fillStyle = on ? THEME.amberHi : '#34414d';
    shape('star', cx0 + (k-(total-1)/2)*gap, cy0, r);
    cx.restore();
  }
}

// ================= 背景（深海：光束＋氣泡）=================
const bubbles = [];
for (let i=0;i<22;i++) bubbles.push({ x:Math.random()*W, y:Math.random()*H, r:1.5+Math.random()*4, v:8+Math.random()*18, ph:Math.random()*6 });
let gdt = 0.016;
function drawBackground(){
  const g = cx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#13202c'); g.addColorStop(0.55,'#0d151d'); g.addColorStop(1,'#080c11');
  cx.fillStyle = g; cx.fillRect(0,0,W,H);
  // 光束
  [[60,90],[190,70],[300,110]].forEach((r,i) => {
    const gr = cx.createLinearGradient(0,0,0,H*0.75);
    gr.addColorStop(0,'rgba(120,190,220,0.07)'); gr.addColorStop(1,'rgba(120,190,220,0)');
    cx.fillStyle = gr; cx.beginPath();
    cx.moveTo(r[0],0); cx.lineTo(r[0]+r[1],0); cx.lineTo(r[0]+r[1]-120,H*0.75); cx.lineTo(r[0]-150,H*0.75); cx.closePath(); cx.fill();
  });
  // 氣泡
  const tt = performance.now()/1000;
  bubbles.forEach(b => {
    b.y -= b.v*gdt; if (b.y < -10){ b.y = H+10; b.x = Math.random()*W; }
    const x = b.x + Math.sin(tt*0.8 + b.ph)*6;
    cx.strokeStyle = 'rgba(170,215,235,0.16)'; cx.lineWidth = 1;
    cx.beginPath(); cx.arc(x,b.y,b.r,0,Math.PI*2); cx.stroke();
    cx.fillStyle = 'rgba(170,215,235,0.05)'; cx.fill();
  });
}

// ================= 遊戲畫面 =================
function drawHero(x, y, mood, hold){
  const r = 26;
  cx.save();
  cx.fillStyle = 'rgba(0,0,0,0.3)'; cx.beginPath(); cx.ellipse(x+3,y+r+8,r*0.9,6,0,0,Math.PI*2); cx.fill();
  cx.restore();
  if (hold > 0){
    cx.save(); cx.shadowColor = THEME.amber; cx.shadowBlur = 12;
    cx.strokeStyle = THEME.amberHi; cx.lineWidth = 5; cx.lineCap = 'round';
    cx.beginPath(); cx.arc(x,y,r+9,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,hold)); cx.stroke(); cx.restore();
  }
  cx.strokeStyle = '#a9b4c0'; cx.lineWidth = 3; cx.lineCap = 'round';
  cx.beginPath(); cx.moveTo(x,y-r); cx.quadraticCurveTo(x+2,y-r-10,x+7,y-r-14); cx.stroke();
  cx.save(); cx.shadowColor = THEME.amber; cx.shadowBlur = 10;
  cx.fillStyle = THEME.amberHi; cx.beginPath(); cx.arc(x+7,y-r-16,4.5,0,7); cx.fill(); cx.restore();
  const body = cx.createRadialGradient(x-8,y-10,4,x,y,r+4);
  body.addColorStop(0, mood==='hurt' ? '#d79b96' : '#c3ccd6'); body.addColorStop(1, mood==='hurt' ? '#9a5a56' : '#6f7c8a');
  cx.fillStyle = body; cx.beginPath(); cx.arc(x,y,r,0,Math.PI*2); cx.fill();
  cx.fillStyle = '#0d141b'; cx.beginPath(); cx.arc(x-9,y-3,8.5,0,7); cx.arc(x+9,y-3,8.5,0,7); cx.fill();
  cx.save(); cx.shadowColor = THEME.amber; cx.shadowBlur = 8;
  cx.fillStyle = mood==='hurt' ? '#ff8a80' : THEME.amberHi;
  cx.beginPath(); cx.arc(x-9,y-3,4.5,0,7); cx.arc(x+9,y-3,4.5,0,7); cx.fill(); cx.restore();
  cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(x-10.5,y-5,1.4,0,7); cx.arc(x+7.5,y-5,1.4,0,7); cx.fill();
  cx.strokeStyle = '#0d141b'; cx.lineWidth = 2.5; cx.lineCap = 'round'; cx.beginPath();
  if (mood==='happy') cx.arc(x,y+6,7,0.1*Math.PI,0.9*Math.PI);
  else if (mood==='hurt') cx.arc(x,y+14,6,1.15*Math.PI,1.85*Math.PI);
  else { cx.moveTo(x-5,y+11); cx.lineTo(x+5,y+11); }
  cx.stroke();
}
function drawSteps(lv){
  for (let i=0;i<7;i++){
    const y = rowY(i) - STEP_H/2;
    const col = THEME.noteColors[i];
    const g = cx.createLinearGradient(0,0,W,0);
    g.addColorStop(0, col+'26'); g.addColorStop(0.5, 'rgba(255,255,255,0.03)'); g.addColorStop(1, 'rgba(255,255,255,0.015)');
    cx.fillStyle = g; cx.fillRect(0,y,W,STEP_H);
    cx.fillStyle = col+'88'; cx.fillRect(0,y,4,STEP_H);
    cx.fillStyle = 'rgba(255,255,255,0.06)'; cx.fillRect(0,y,W,1);
    if (lv.rowLabels){
      panel(10, rowY(i)-15, 56, 30, 15, { c1:'rgba(10,16,22,0.8)', c2:'rgba(10,16,22,0.8)', stroke: col+'aa' });
      cx.fillStyle = col; shape(THEME.noteShapes[i], 26, rowY(i), 7.5);
      text(noteName(i), 44, rowY(i)+1, 16, THEME.txt, 'left');
    }
  }
  cx.fillStyle = 'rgba(255,255,255,0.1)'; cx.fillRect(0,BASE_Y,W,1.5);
}
function drawWall(w, g, lv){
  const fx0 = CHAR_X + (w.arrive - g.t)*SPEED;
  const thick = lv.win*SPEED;
  if (fx0 > W+10 || fx0+thick < -10) return;
  const top = rowY(6) - STEP_H/2, bot = BASE_Y;
  const c = lv.cues;
  const c1 = w.passed ? '#3c8a60' : (w.judged ? '#8a4a47' : '#3c4b5a');
  const c2 = w.passed ? '#24573c' : (w.judged ? '#552c2a' : '#222d38');
  const gy = rowY(w.note) - STEP_H/2;
  const open = c.height || w.passed;
  function body(y0,y1){
    if (y1 <= y0) return;
    const gr = cx.createLinearGradient(fx0,0,fx0+thick,0);
    gr.addColorStop(0,c1); gr.addColorStop(1,c2);
    cx.fillStyle = gr; cx.fillRect(fx0,y0,thick,y1-y0);
    // 磚紋
    cx.strokeStyle = 'rgba(255,255,255,0.05)'; cx.lineWidth = 1;
    for (let yy=y0+16; yy<y1; yy+=32){ cx.beginPath(); cx.moveTo(fx0,yy); cx.lineTo(fx0+thick,yy); cx.stroke(); }
  }
  if (open){ body(top, gy); body(gy+STEP_H, bot); } else body(top, bot);
  // 前緣警示條
  cx.save(); cx.beginPath();
  if (open){ cx.rect(fx0,top,8,gy-top); cx.rect(fx0,gy+STEP_H,8,bot-(gy+STEP_H)); } else cx.rect(fx0,top,8,bot-top);
  cx.clip();
  cx.fillStyle = '#d99a2b'; cx.fillRect(fx0,top,8,bot-top);
  cx.strokeStyle = '#1a2128'; cx.lineWidth = 4;
  for (let yy=top-8; yy<bot+8; yy+=14){ cx.beginPath(); cx.moveTo(fx0-2,yy+10); cx.lineTo(fx0+10,yy-2); cx.stroke(); }
  cx.restore();
  // 缺口發光
  if (open){
    cx.save();
    cx.shadowColor = w.passed ? '#6fe0a0' : THEME.amber; cx.shadowBlur = w.judged && !w.passed ? 0 : 16;
    cx.strokeStyle = w.passed ? '#8af0b8' : THEME.amberHi; cx.lineWidth = 2.5;
    cx.strokeRect(fx0+1.5, gy+1.5, thick-3, STEP_H-3);
    cx.restore();
  }
  // 牆上標籤（膠囊）
  const showLabel = c.label==='always', showColor = c.color==='always';
  if ((showLabel || showColor) && !w.judged){
    const cxm = Math.min(Math.max(fx0+thick/2, 130), 340);
    const cym = c.height ? rowY(w.note) : (top+bot)/2;
    const pw = (showLabel && showColor) ? 128 : (showLabel ? 100 : 44);
    panel(cxm-pw/2, cym-17, pw, 34, 17, { c1:'rgba(8,12,17,0.88)', c2:'rgba(8,12,17,0.88)', stroke: THEME.noteColors[w.note]+'cc', sw:1.6 });
    if (showColor){ cx.fillStyle = THEME.noteColors[w.note]; shape(THEME.noteShapes[w.note], cxm-pw/2+20, cym, 10); }
    if (showLabel) text(noteName(w.note)+' '+SOLF[w.note], cxm+(showColor?10:0), cym+1, 18, '#fff');
  } else if (!open && !w.judged){
    text('?', Math.min(Math.max(fx0+thick/2, 130), 340), (top+bot)/2, 56, 'rgba(255,255,255,0.10)');
  }
}
function drawHUD(g, lv){
  panel(8, 8, W-16, 40, 14, { c1:'rgba(14,22,30,0.82)', c2:'rgba(10,16,22,0.82)', shadow:8 });
  for (let i=0;i<3;i++){
    cx.save();
    if (i < g.lives){ cx.shadowColor = '#ff6b6b'; cx.shadowBlur = 8; }
    cx.fillStyle = i < g.lives ? '#ff6b7a' : '#33404b';
    heart(30+i*26, 28, 9);
    cx.restore();
  }
  text(lv.id+'  '+LT(lv), W/2+4, 29, 13, '#c8d2dc');
  text(String(g.score), W-20, 29, 20, THEME.amberHi, 'right', 0, { shadow:'rgba(240,168,48,0.5)', blur:8 });
  if (g.combo >= 2){
    panel(W-100, 54, 92, 22, 11, { c1:'rgba(240,168,48,0.9)', c2:'rgba(214,132,20,0.9)', stroke:'rgba(255,255,255,0.4)' });
    text(T('連續 ×', 'Combo ×')+g.combo, W-54, 66, 12, '#2a1a00');
  }
  // 提示橫幅（閃現線索）
  const f = g.flash;
  if (f && g.t < f.t0 + f.dur){
    const c = lv.cues, k = Math.min(1, (g.t - f.t0)/0.12);
    const sc = 0.8 + 0.2*k;
    cx.save(); cx.translate(W/2, 112); cx.scale(sc, sc); cx.globalAlpha = Math.min(1, k*1.3);
    panel(-96, -34, 192, 68, 18, { c1:'rgba(10,16,22,0.92)', c2:'rgba(10,16,22,0.92)', stroke:THEME.amber, sw:2, shadow:18 });
    const showC = c.color==='flash' || c.color==='always', showL = c.label==='flash';
    if (showC){ cx.fillStyle = THEME.noteColors[f.note]; shape(THEME.noteShapes[f.note], showL?-52:0, 0, 20); }
    if (showL) text(noteName(f.note)+' '+SOLF[f.note], showC?14:0, 1, 26, '#fff');
    cx.restore();
  }
  if (g.t < 2.2) text(prefs.input==='mic' ? T('準備…對著麥克風唱出缺口的音', 'Ready… sing the note in the gap') : T('準備…按下缺口對應的琴鍵', 'Ready… press the key for the gap'), W/2, 160, 14, '#c8d2dc', 'center', 0, { stroke:'rgba(0,0,0,0.6)', sw:4 });
  // 即時音高讀數（膠囊）
  const v = g.view;
  if (v.voice){
    const c = Math.round(v.centsNear);
    const label = PC_NAMES[v.nearest]+'  '+(c>=0?'+':'')+c+'¢';
    const py = Math.max(88, Math.min(heroY()+52, 536));
    panel(CHAR_X-36, py-12, 72, 24, 12, { c1:'rgba(10,16,22,0.8)', c2:'rgba(10,16,22,0.8)', stroke:'rgba(255,255,255,0.15)' });
    text(label, CHAR_X, py+1, 12, Math.abs(c) <= 15 ? '#9be39b' : '#c8d2dc');
  }
}
function semiToStep(p){
  const A = [0,2,4,5,7,9,11,12];
  if (p <= 0) return p*0.5;
  if (p >= 12) return 7 + (p-12)*0.5;
  for (let i=0;i<7;i++) if (p <= A[i+1]) return i + (p-A[i])/(A[i+1]-A[i]);
  return 7;
}
let heroTarget = -0.5;
function heroY(){ return rowY(Math.max(-0.4, Math.min(6.3, heroS))); }

function drawKeys(){
  panel(8, 540, W-16, 170, 18, { c1:'rgba(14,22,30,0.85)', c2:'rgba(8,12,17,0.9)' });
  for (let i=0;i<7;i++){
    const kx = 20 + i*52, down = !!keysDown[i], oy = down ? 3 : 0;
    const col = THEME.noteColors[i];
    cx.fillStyle = 'rgba(0,0,0,0.45)'; rrect(kx,572+4,48,128,10); cx.fill();
    const g = cx.createLinearGradient(0,566+oy,0,694+oy);
    g.addColorStop(0, down ? '#ffffff' : lighten(col)); g.addColorStop(1, down ? '#e0e6ec' : col);
    cx.fillStyle = g; rrect(kx,566+oy,48,128,10); cx.fill();
    cx.strokeStyle = 'rgba(255,255,255,0.35)'; cx.lineWidth = 1.2; rrect(kx+0.6,566.6+oy,46.8,126.8,10); cx.stroke();
    cx.fillStyle = 'rgba(16,22,29,0.85)'; shape(THEME.noteShapes[i], kx+24, 612+oy, 8);
    text(noteName(i), kx+24, 650+oy, 22, '#10161d');
  }
  text(T('練習模式：按畫面琴鍵（或電腦鍵 C D E F G A B）', 'Practice: tap the keys (or press C D E F G A B)'), W/2, 553, 12, THEME.dim);
}
function lighten(hex){
  const n = parseInt(hex.slice(1),16);
  const r = Math.min(255,(n>>16)+55), g = Math.min(255,((n>>8)&255)+55), b = Math.min(255,(n&255)+55);
  return 'rgb('+r+','+g+','+b+')';
}
function drawPlay(dt){
  const g = game, lv = level;
  drawBackground(); drawSteps(lv);
  g.walls.forEach(w => drawWall(w, g, lv));
  if (g.view.voice) heroTarget = semiToStep(g.view.p);
  else heroTarget = -0.5;
  if (g.view.voice) heroS += (heroTarget - heroS)*Math.min(1, dt*14);
  else heroS = Math.max(heroTarget, heroS - dt*3);
  const active = g.walls.find(w => !w.judged && g.t >= w.arrive && g.t <= w.arrive + lv.win);
  const hold = active && !active.passed ? active.run/lv.hold : 0;
  const mood = fx.hurt>0 ? 'hurt' : (fx.happy>0 ? 'happy' : 'idle');
  drawHero(CHAR_X, heroY(), mood, hold);
  drawHUD(g, lv);
  if (scene === 'play') button(10, 54, 40, 24, '❚❚', pauseRound, { size:11, r:8 });
  fx.popups = fx.popups.filter(p => (p.life -= dt) > 0);
  fx.popups.forEach(p => {
    cx.globalAlpha = Math.min(1, p.life*2);
    text(p.t, CHAR_X+74, heroY() - (1-p.life)*40, 24, p.c, 'center', 0, { stroke:'rgba(0,0,0,0.65)', sw:5 });
    cx.globalAlpha = 1;
  });
  if (prefs.input === 'key') drawKeys();
  else {
    panel(8, 548, W-16, 56, 14, { c1:'rgba(14,22,30,0.7)', c2:'rgba(8,12,17,0.7)' });
    text(prefs.octave==='strict' ? T('嚴格第 4 八度', 'Strict: octave 4 only') : T('任何八度皆可', 'Any octave works'), W/2, 566, 13, '#c8d2dc');
    text(T('小聲、哼歌、吹口哨也可以', 'Humming or whistling works too'), W/2, 588, 12, THEME.dim);
  }
}
function drawPause(){
  cx.fillStyle = 'rgba(4,8,12,0.7)'; cx.fillRect(0,0,W,H);
  panel(50, 250, 300, 190, 22, { shadow:24 });
  text(T('暫停中', 'Paused'), W/2, 292, 30, THEME.amberHi, 'center', 0, { shadow:'rgba(240,168,48,0.5)' });
  text(prefs.input==='mic' ? T('點一下繼續（會重新開啟麥克風）', 'Tap to resume (microphone turns back on)') : T('點一下繼續', 'Tap to resume'), W/2, 332, 13, '#c8d2dc');
  button(110, 366, 180, 48, T('回選單', 'Back to menu'), leaveToMenu, { size:16 });
}
function gradeText(g){ return { perfect:T('完美','Perfect'), good:T('好','Good'), ok:T('過','OK') }[g]; }
function drawResult(){
  const g = game, win = g.state==='clear';
  drawBackground();
  panel(24, 90, W-48, 440, 26, { shadow:30, stroke: win ? 'rgba(123,201,111,0.5)' : 'rgba(255,138,128,0.4)', sw:2 });
  text(win ? T('過關！','Cleared!') : (level.endless ? T('無盡結束','Endless over') : T('失敗','Failed')), W/2, 148, 42, win ? '#9be39b' : '#ff8a80', 'center', 0, { shadow: win ? 'rgba(123,201,111,0.6)' : 'rgba(255,100,90,0.5)', blur:16 });
  text(level.id+'　'+LT(level), W/2, 198, 16, '#c8d2dc');
  if (win) stars(W/2, 256, g.stars, 3, 22, 54);
  panel(54, 296, W-108, 96, 16, { c1:'#1a2530', c2:'#121a22' });
  text(String(g.score), W/2, 330, 34, THEME.amberHi, 'center', 0, { shadow:'rgba(240,168,48,0.5)' });
  text(T('分數','Score'), W/2, 364, 12, THEME.dim);
  const rows = [[T('完美','Perfect'),g.stats.perfect,'#ffe27a'],[T('好','Good'),g.stats.good,'#9be39b'],[T('過','OK'),g.stats.ok,'#c8d2dc'],[T('失誤','Miss'),g.stats.fail,'#ff8a80']];
  rows.forEach((r,i) => {
    const x = 70 + i*87;
    text(String(r[1]), x, 428, 24, r[2]);
    text(r[0], x, 456, 12, THEME.dim);
  });
  text(T('最高連續 ','Best combo ')+g.maxCombo+(level.endless?T('　共通過 '+g.passes+' 面','　Walls passed '+g.passes):''), W/2, 494, 13, THEME.dim);
  button(40, 560, 150, 52, T('再玩一次','Retry'), () => startLevel(level.endless ? endlessLevel() : level), { size:17 });
  button(210, 560, 150, 52, T('回選單','Menu'), leaveToMenu, { size:17 });
  if (win && !level.endless){
    const idx = LEVELS.indexOf(level);
    if (idx < LEVELS.length-1) button(40, 628, 320, 54, T('下一關 ▶','Next level ▶'), () => startLevel(LEVELS[idx+1]), { size:18, active:true });
  }
}
function drawMenu(now){
  drawBackground();
  text(T('不准跑調', 'Stay On Pitch'), W/2, 40, EN() ? 34 : 38, THEME.amberHi, 'center', 0, { shadow:'rgba(240,168,48,0.55)', blur:18, stroke:'rgba(0,0,0,0.5)', sw:5 });
  for (let i=0;i<7;i++){
    const bx = W/2 - 7*9 + i*18, bh = 6 + i*2.4;
    cx.fillStyle = THEME.noteColors[i]; rrect(bx, 80-bh, 13, bh, 3); cx.fill();
  }
  text(T('用聲音爬七階　C D E F G A B', 'Climb seven steps with your voice'), W/2, 98, 12, THEME.dim);
  const names = EN() ? ['Meet the notes','Sing a tune','Hidden steps','Ears only','Perfect pitch'] : ['認識七階','唱旋律','看不見階梯','只靠耳朵','絕對音準'];
  const hints = EN() ? ['All cues','All cues','Labels only','Colors only','From memory'] : ['全提示','全提示','只剩標籤','只剩顏色','靠記憶'];
  const accent = [THEME.noteColors[3], THEME.noteColors[4], THEME.noteColors[5], THEME.noteColors[6], THEME.noteColors[0]];
  for (let w=0; w<5; w++){
    const y = 112 + w*62;
    panel(8, y, W-16, 56, 14, { shadow:6, c1:'#212e39', c2:'#161f28' });
    cx.fillStyle = accent[w]; rrect(8, y+8, 4, 40, 2); cx.fill();
    text(T('世界 ', 'World ')+(w+1), 22, y+19, 16, THEME.txt, 'left');
    text(names[w], 22, y+37, 11, '#c8d2dc', 'left');
    text(hints[w], 22, y+50, 9, THEME.dim, 'left');
    for (let l=0; l<4; l++){
      const lv = LEVELS[w*4+l], st = prefs.stars[lv.id]||0;
      const bx = 128 + l*66;
      button(bx, y+5, 60, 34, lv.id, () => startLevel(lv), { size:15, r:10, stroke: st ? 'rgba(240,168,48,0.8)' : null });
      stars(bx+30, y+48, st, 3, 4.5, 14);
    }
  }
  button(70, 426, 322, 40, T('無盡模式（世界 5 規則）', 'Endless (World 5 rules)'), () => startLevel(endlessLevel()), { size:15, c1:'#3a2a1a', c2:'#271b10', stroke:'rgba(240,168,48,0.6)' });
  if (Mic.ready){
    const hz = Mic.read(now);
    if (hz){
      const m = hzToMidi(hz) - 60, rn = Math.round(m), c = Math.round((m-rn)*100);
      text(T('偵測：','Heard: ')+PC_NAMES[mod(rn,12)]+'  '+(c>=0?'+':'')+c+'¢　（'+Math.round(hz)+' Hz）', W/2, 500, 16, THEME.amberHi, 'center', 0, { shadow:'rgba(240,168,48,0.4)' });
    } else text(T('偵測：（沒有穩定的聲音）','Heard: (no steady sound)'), W/2, 500, 14, THEME.dim);
  }
}

let last = performance.now(), lastTouch = 0;
function frame(){
  requestAnimationFrame(frame);
  const now = performance.now();
  if (!opShown()){ last = now; return; }
  const dt = Math.min(0.05, (now - last)/1000); last = now; gdt = dt;
  buttons = [];
  cx.setTransform(ratio,0,0,ratio,0,0);
  if (scene === 'play'){
    let hz = getHz(now);
    if (now < muteUntil) hz = null;
    if (hz && now - lastTouch > 1000){ lastTouch = now; if (AN.interact) AN.interact(); }
    game.step(dt, hz);
    OP.score = game.score;
    fx.hurt = Math.max(0, fx.hurt - dt); fx.happy = Math.max(0, fx.happy - dt);
    game.events.splice(0).forEach(ev => {
      if (ev.type==='tone') playTone(ev.note);
      else if (ev.type==='pass'){ playTick('pass'); fx.happy = 0.5; if (AN.interact) AN.interact(); fx.popups.push({ t:gradeText(ev.grade), c: ev.grade==='perfect'?'#ffe27a':(ev.grade==='good'?'#9be39b':'#c8d2dc'), life:0.8 }); }
      else if (ev.type==='fail'){ playTick('fail'); fx.hurt = 0.6; if (AN.interact) AN.interact(); fx.popups.push({ t:T('失誤','Miss'), c:'#ff8a80', life:0.8 }); if (navigator.vibrate) navigator.vibrate(60); }
    });
    drawPlay(dt);
    if (game.state !== 'play'){
      const win = game.state === 'clear', idx = LEVELS.indexOf(level);
      if (win && idx >= 0){ prefs.stars[level.id] = Math.max(prefs.stars[level.id]||0, game.stars); persist(); }
      OP.sel = win && idx >= 0 ? Math.min(idx + 1, LEVELS.length) : (idx >= 0 ? idx : LEVELS.length);
      scene = 'result';
      const st = game.stats;
      endRound('complete', { score: game.score, step: st.perfect + st.good + st.ok, level: idx + 1, cleared: win ? 1 : 0, stars: win ? game.stars : 0 });
      opSay(win ? '過關！得 {sc} 分、{st} 顆星。|Cleared! {sc} points, {st} stars.' : '這關失敗了：{sc} 分。再試一次，或換個關卡。|Level failed: {sc} points. Try again or pick another level.', win ? 'win' : 'lose', { sc: game.score, st: game.stars });
    }
  } else if (scene === 'pause'){
    drawPlay(0); drawPause();
  } else if (scene === 'result'){
    drawResult();
  } else {
    drawMenu(now);
  }
  if (now < msgUntil){
    panel(16, 640, 368, 58, 14, { c1:'rgba(10,16,22,0.95)', c2:'rgba(10,16,22,0.95)', stroke:'rgba(240,168,48,0.6)', shadow:14 });
    const lines = msg.match(/.{1,24}/g) || [msg];
    lines.slice(0,2).forEach((s,i) => text(s, W/2, 658+i*20, 13, '#fff'));
  }
}
requestAnimationFrame(frame);

// ================= 平台接線 =================
function opShown(){ return !$('view-on-pitch').hidden && !document.hidden; }
function opSay(text, kind, params){
  OP.msg = { text:text, kind:kind||'', params:params };
  const el = $('op-msg'); el.textContent = opL(text, params); el.className = 'msg' + (kind ? ' ' + kind : '');
}
function opL(s, p){
  const i = window.deepSeaI18n, en = !!(i && i.getLanguage() === 'en'), k = s.indexOf('|');
  const t = k < 0 ? (en ? i.text(s) : s) : (en ? s.slice(k+1) : s.slice(0,k));
  return p ? t.replace(/\{(\w+)\}/g, (_, n) => p[n] != null ? p[n] : '') : t;
}
function opUI(){
  const total = Object.keys(prefs.stars).reduce((s, k) => s + (prefs.stars[k]||0), 0);
  const cur = OP.sel >= LEVELS.length ? '∞' : (LEVELS[OP.sel] || LEVELS[0]).id;
  $('op-level').textContent = cur; $('op-score').textContent = fmt(OP.score); $('op-stars').textContent = total + ' / ' + LEVELS.length * 3;
  const busy = OP.active || OP.starting;
  $('op-go').disabled = busy; $('op-go').textContent = busy ? '遊戲中 · 在畫面操作' : '開始遊戲';
  [['op-in-mic', prefs.input === 'mic'], ['op-in-key', prefs.input === 'key'], ['op-oct-any', prefs.octave === 'any'], ['op-oct-strict', prefs.octave === 'strict']].forEach(p => {
    const b = $(p[0]); b.setAttribute('aria-pressed', p[1] ? 'true' : 'false'); b.disabled = busy;
  });
  $('op-mic-test').disabled = busy || prefs.input !== 'mic';
  $('op-mic-test').textContent = Mic.ready ? '關閉麥克風' : '測試麥克風';
}
function onRoute(active){
  if (!active){ pauseRound(); Mic.stop(); if (scene === 'result') scene = 'menu'; }
  else { OP.resuming = false; }
  opUI();
}
$('op-go').addEventListener('click', () => {
  if (OP.active || OP.starting) return;
  startLevel(OP.sel >= LEVELS.length ? endlessLevel() : (LEVELS[OP.sel] || LEVELS[0]));
  $('op-canvas').focus();
});
[['op-in-mic','input','mic'],['op-in-key','input','key'],['op-oct-any','octave','any'],['op-oct-strict','octave','strict']].forEach(p => {
  $(p[0]).addEventListener('click', () => { if (OP.active) return; prefs[p[1]] = p[2]; if (p[1] === 'input' && p[2] === 'key') Mic.stop(); persist(); opUI(); });
});
$('op-mic-test').addEventListener('click', async () => {
  if (OP.active) return;
  if (Mic.ready){ Mic.stop(); opUI(); return; }
  try { ensureCtx(); await Mic.start(); }
  catch(e){ toast(T('麥克風無法使用：', 'Microphone unavailable: ') + (e.message||e.name)); }
  opUI();
});
// 先於共用離頁處理結束，讓 abandoned 帶上已有的分數
window.addEventListener('pagehide', e => { if (!e.persisted && OP.active && OP.analytics){ const a = OP.analytics; OP.analytics = null; OP.active = false; AN.end(a, 0, 'abandoned', { score: OP.score }); } }, true);
window.addEventListener('arcade-languagechange', () => { if (OP.msg) opSay(OP.msg.text, OP.msg.kind, OP.msg.params); });
window.deepSeaOnPitch = { route: onRoute, state: () => ({ scene, level, game, active: OP.active, sel: OP.sel, prefs }), core: { createGame:createGame, makeLevels:makeLevels, detectPitch:detectPitch } };
opSay('按「開始遊戲」或點畫面上的關卡開始。第一次會要求麥克風權限。|Press Start or tap a level. The first time asks for microphone access.');
opUI();

})();
