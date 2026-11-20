const onPitchRules = (() => {

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

const levels = makeLevels();
function create() {
  return {
    game:null, pitch:null,
    get dead(){return !!this.game && this.game.state!=='play';},
  };
}
function input(state, code) {
  if (!Number.isInteger(code) || code < 0 || code >= 2100000 || state.dead) return false;
  if (!state.game) {
    const selected = code - 2010000, index = Math.floor(selected/2);
    if (selected<0 || index>levels.length) return false;
    state.game=createGame(index===levels.length?endlessLevel():levels[index],{octave:selected%2?'strict':'any'});
    return true;
  }
  if (code>2000000) return false;
  state.pitch=code ? code/1000 : null;
  return true;
}
return {NOTE_KEYS,SEMI,SOLF,NOTE_HZ,PC_NAMES,mod,hzToMidi,mulberry32,detectPitch,seq,randSeq,makeLevels,endlessLevel,createGame, create,input,inputCount:2100000,
  advance:(state,dt)=>state.game?.step(dt,state.pitch),
  score:state=>state.game.score};
})();
if(typeof module!=='undefined')module.exports=onPitchRules;
