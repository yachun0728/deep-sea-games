// 萌獸破城隊 Critter Crashers（siege-architect）的過關驗證。
// 下方 SIM 與關卡資料逐字取自 games/siege-architect/original.html 的 <script id="sim"> 與 <script id="levels">；
// tools/test_puzzle_leaderboards.mjs 檢查兩邊一致。改動模擬或關卡時兩邊要一起改。
const siegeArchitectRules = (() => {
// ===== Critter Crashers deterministic simulation (shared by game + solver) =====
const SIM = (() => {
  const TICK = 0.05;          // seconds per tick
  const SLOT = 0.5;           // seconds per timeline slot
  const SLOTS = 20;           // 10 seconds of timeline
  const MAX_T = 45;
  const UNITS = {
    shield: { name: '盾兵', icon: '🛡️', cost: 3, hp: 14, speed: 1.5, siege: 1, count: 1, r: 0.32, color: '#4a7bd0' },
    scout:  { name: '斥候', icon: '💨', cost: 1, hp: 2,  speed: 4,   siege: 1, count: 1, r: 0.22, color: '#3fb58a' },
    rats:   { name: '鼠群', icon: '🐀', cost: 2, hp: 1,  speed: 2.5, siege: 0.5, count: 6, gap: 0.12, r: 0.14, color: '#a07850' },
    sapper: { name: '工兵', icon: '💣', cost: 4, hp: 5,  speed: 2.5, siege: 5, count: 1, r: 0.27, color: '#e0703a' },
    // taunt: every tower that has the peacock in range must shoot it (breaks sticky locks)
    peacock: { cost: 3, hp: 10, speed: 2.5, siege: 1, count: 1, r: 0.3, taunt: true },
    // burrow: underground (untargetable, unhittable, never 'enters' range) for the first N tiles of the path
    mole:   { cost: 3, hp: 6, speed: 2.5, siege: 2, count: 1, r: 0.26, burrow: 6 },
  };
  const TOWERS = {
    gun:    { name: '機槍塔', icon: '🔫', rule: 'closest', ruleText: '打最近的', ruleIcon: '👉', dmg: 1,  period: 0.4, range: 2.5, color: '#d9a400' },
    cannon: { name: '大砲塔', icon: '💥', rule: 'maxhp',   ruleText: '打血最多的・範圍爆炸', ruleIcon: '❤️', dmg: 5, period: 2.5, range: 3.5, splash: 1, color: '#d0453a' },
    sniper: { name: '狙擊塔', icon: '🎯', rule: 'first',   ruleText: '打最先進入射程的', ruleIcon: '🚩', dmg: 99, period: 3, range: 6, color: '#8a5cd0' },
  };

  function buildPath(pts) {
    const segs = []; let len = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      const l = Math.hypot(x2 - x1, y2 - y1);
      segs.push({ x1, y1, x2, y2, l, start: len }); len += l;
    }
    return { pts, segs, len };
  }
  function posAt(path, d) {
    if (d <= 0) return [path.pts[0][0], path.pts[0][1]];
    for (const s of path.segs) {
      if (d <= s.start + s.l) { const f = (d - s.start) / s.l; return [s.x1 + (s.x2 - s.x1) * f, s.y1 + (s.y2 - s.y1) * f]; }
    }
    const p = path.pts[path.pts.length - 1]; return [p[0], p[1]];
  }

  function cost(timeline) { return timeline.reduce((a, u) => a + (u ? UNITS[u].cost : 0), 0); }

  function create(level, timeline) {
    const path = buildPath(level.path);
    const units = []; let id = 0;
    timeline.forEach((type, slot) => {
      if (!type) return;
      const U = UNITS[type];
      for (let i = 0; i < U.count; i++) {
        units.push({ id: id++, type, slot, hp: U.hp, maxHp: U.hp, d: 0, x: 0, y: 0,
          spawnT: slot * SLOT + i * (U.gap || 0), state: 'wait', entered: {} });
      }
    });
    const towers = level.towers.map((t, i) => ({ i, type: t.type, x: t.x, y: t.y, cd: 0, target: null, kills: 0 }));
    return { level, path, units, towers, t: 0, tick: 0, gate: level.gate, gateMax: level.gate,
      events: [], shots: [], done: false, win: false };
  }

  function inRange(tw, u) { return Math.hypot(tw.x - u.x, tw.y - u.y) <= TOWERS[tw.type].range; }
  function underground(u) { const b = UNITS[u.type].burrow; return !!b && u.d < b; }

  function step(s) {
    if (s.done) return;
    s.shots = [];
    const t = s.t;
    // spawn + move
    for (const u of s.units) {
      if (u.state === 'wait' && u.spawnT <= t + 1e-9) { u.state = 'live'; [u.x, u.y] = posAt(s.path, 0); }
      else if (u.state === 'live') {
        u.d += UNITS[u.type].speed * TICK;
        if (u.d >= s.path.len) {
          u.state = 'arrived'; s.gate -= UNITS[u.type].siege;
          s.events.push({ kind: 'arrive', t, unit: u });
          if (s.gate <= 1e-9) { s.gate = 0; s.done = true; s.win = true; return; }
        } else [u.x, u.y] = posAt(s.path, u.d);
      }
    }
    // towers
    for (const tw of s.towers) {
      const T = TOWERS[tw.type];
      const live = s.units.filter(u => u.state === 'live' && !underground(u));
      for (const u of live) {
        const k = tw.i;
        if (inRange(tw, u)) { if (u.entered[k] === undefined) u.entered[k] = s.tick; }
        else delete u.entered[k];
      }
      tw.cd -= TICK;
      if (tw.target && (tw.target.state !== 'live' || !inRange(tw, tw.target))) tw.target = null;
      const taunts = live.filter(u => UNITS[u.type].taunt && inRange(tw, u));
      if (taunts.length) {
        taunts.sort((a, b) => (Math.hypot(tw.x - a.x, tw.y - a.y) - Math.hypot(tw.x - b.x, tw.y - b.y)) || a.id - b.id);
        if (!tw.target || !UNITS[tw.target.type].taunt) tw.target = taunts[0];
      } else if (!tw.target) {
        const cands = live.filter(u => inRange(tw, u));
        if (cands.length) {
          cands.sort((a, b) => {
            if (T.rule === 'closest') {
              const da = Math.hypot(tw.x - a.x, tw.y - a.y), db = Math.hypot(tw.x - b.x, tw.y - b.y);
              if (Math.abs(da - db) > 1e-6) return da - db;
            } else if (T.rule === 'maxhp') {
              if (a.hp !== b.hp) return b.hp - a.hp;
              if (Math.abs(a.d - b.d) > 1e-6) return b.d - a.d;
            } else if (T.rule === 'first') {
              if (a.entered[tw.i] !== b.entered[tw.i]) return a.entered[tw.i] - b.entered[tw.i];
            }
            return a.id - b.id;
          });
          tw.target = cands[0];
        }
      }
      if (tw.target && tw.cd <= 1e-9) {
        const tg = tw.target;
        const hits = T.splash ? live.filter(u => Math.hypot(u.x - tg.x, u.y - tg.y) <= T.splash) : [tg];
        s.shots.push({ tower: tw, x: tg.x, y: tg.y, splash: T.splash || 0 });
        for (const u of hits) {
          u.hp -= T.dmg;
          if (u.hp <= 0 && u.state === 'live') {
            u.state = 'dead'; tw.kills++;
            s.events.push({ kind: 'death', t, unit: u, tower: tw, x: u.x, y: u.y });
          }
        }
        tw.cd = T.period;
        if (tw.target.state !== 'live') tw.target = null;
      }
    }
    s.t = Math.round((s.t + TICK) * 1000) / 1000; s.tick++;
    const pending = s.units.some(u => u.state === 'wait' || u.state === 'live');
    if (!pending || s.t >= MAX_T) { s.done = true; s.win = false; }
  }

  function run(level, timeline) { const s = create(level, timeline); while (!s.done) step(s); return s; }

  return { TICK, SLOT, SLOTS, UNITS, TOWERS, buildPath, posAt, cost, create, step, run, underground };
})();
const PATHS = {
  bend:      [[0, 3.5], [7, 3.5], [7, 5.5], [16, 5.5]],
  ell:       [[0, 6.5], [9, 6.5], [9, 1.5], [16, 1.5]],
  ess:       [[0, 1.5], [5, 1.5], [5, 4.5], [11, 4.5], [11, 7.5], [16, 7.5]],
  zigzag:    [[0, 2.5], [5, 2.5], [5, 6.5], [10, 6.5], [10, 2.5], [16, 2.5]],
  zed:       [[0, 2.5], [10, 2.5], [10, 6.5], [16, 6.5]],
  stairs:    [[0, 1.5], [3, 1.5], [3, 3.5], [6, 3.5], [6, 5.5], [9, 5.5], [9, 7.5], [16, 7.5]],
  uturn:     [[0, 1.5], [11, 1.5], [11, 7.5], [2, 7.5]],
  arch:      [[0, 7], [4, 7], [4, 2], [12, 2], [12, 7], [16, 7]],
  spiral:    [[0, 1.5], [12, 1.5], [12, 7], [4, 7], [4, 4.5], [8.5, 4.5]],
  snake:     [[0, 1.5], [11, 1.5], [11, 4.5], [4, 4.5], [4, 7.5], [15, 7.5]],
  hook:      [[0, 4.5], [11, 4.5], [11, 1.5], [4.5, 1.5]],
  wave:      [[0, 7.5], [4, 7.5], [4, 3.5], [8, 3.5], [8, 6.5], [12, 6.5], [12, 2], [16, 2]],
  notch:     [[0, 2], [6, 2], [6, 6], [10, 6], [10, 2], [16, 2]],
  drop:      [[0, 1.5], [12, 1.5], [12, 7.5], [16, 7.5]],
  ladder:    [[0, 4.5], [3, 4.5], [3, 1.5], [8, 1.5], [8, 7.5], [13, 7.5], [13, 4.5], [16, 4.5]],
  steps:     [[0, 7.5], [5, 7.5], [5, 4.5], [11, 4.5], [11, 1.5], [16, 1.5]],
  comb:      [[0, 1.5], [3, 1.5], [3, 7], [7, 7], [7, 1.5], [11, 1.5], [11, 7], [15, 7]],
  loop:      [[0, 4.5], [6, 4.5], [6, 1.5], [14, 1.5], [14, 7.5], [8, 7.5]],
  maze:      [[0, 7.5], [13, 7.5], [13, 1.5], [4, 1.5], [4, 4.5], [10, 4.5]],
  finale:    [[0, 4.5], [4, 4.5], [4, 1.5], [12, 1.5], [12, 7.5], [16, 7.5]],
};
// level (1-based) at which each unit joins the squad
const UNLOCK = { shield: 1, sapper: 1, scout: 3, rats: 6, peacock: 11, mole: 12 };
const unitsFor = i => Object.keys(UNLOCK).filter(t => UNLOCK[t] <= i + 1);
const no = u => ({ kind: 'no', unit: u, test: tl => !tl.includes(u) });
const maxN = n => ({ kind: 'max', n, test: tl => tl.filter(Boolean).length <= n });
// [token] in hints is replaced with a drawn icon; target = win-rate band used by tools/tune.js
const LEVELS = [
  { name: { zh: '第一道防線', en: 'First Line' }, path: PATHS.bend, towers: [{ type: 'gun', x: 10.5, y: 4.5 }], gate: 5, budget: 8, par: 7, star3: maxN(2),
    target: [0.12, 0.25], allowMono: ['sapper', 'rats'],
    hint: { zh: '[gun] 機槍 [closest] <b>打最近的</b>。河狸工兵單獨衝會被打死，派誰擋在牠前面？', en: '[gun] Gun [closest] <b>hits the closest</b>. A lone beaver won\'t make it. Who goes first?' } },
  { name: { zh: '大砲愛胖子', en: 'Big Targets' }, path: PATHS.ell, towers: [{ type: 'cannon', x: 9.5, y: 7.5 }], gate: 5, budget: 8, par: 7, star3: maxN(2),
    target: [0.07, 0.15], allowMono: ['scout', 'rats'],
    hint: { zh: '[cannon] 大砲 [maxhp] <b>永遠先打血最多的</b>，爆炸會波及周圍 1 格。', en: '[cannon] Cannon [maxhp] <b>always hits the highest HP</b>, and the blast hits everything within 1 tile.' } },
  { name: { zh: '第一個進來的', en: 'First In' }, path: PATHS.ess, towers: [{ type: 'sniper', x: 12.5, y: 5.5 }], gate: 5, budget: 7, par: 6, star3: no('shield'),
    target: [0.08, 0.2], allowMono: ['scout', 'rats'],
    hint: { zh: '[sniper] 狙擊 [first] <b>一槍必殺</b>，但每槍要裝填 3 秒。誰該先進射程？', en: '[sniper] Sniper [first] <b>kills in one shot</b>, then reloads for 3 seconds. Who should enter first?' } },
  { name: { zh: '黏著的槍口', en: 'Sticky Aim' }, path: PATHS.zigzag, towers: [{ type: 'gun', x: 12.5, y: 1.5 }, { type: 'gun', x: 7, y: 2.5 }], gate: 6, budget: 10, par: 7, star3: maxN(3),
    target: [0.015, 0.04],
    hint: { zh: '塔一旦<b>鎖定</b>目標，就會一直打到它死掉或離開射程。', en: 'Once a tower <b>locks on</b>, it keeps firing until the target dies or leaves range.' } },
  { name: { zh: '不要擠在一起', en: 'Spread Out' }, path: PATHS.zed, towers: [{ type: 'cannon', x: 13.5, y: 5.5 }, { type: 'gun', x: 11.5, y: 2 }], gate: 6, budget: 11, par: 8, star3: maxN(3),
    target: [0.008, 0.025],
    hint: { zh: '[cannon] 大砲加 [gun] 機槍。<b>間距</b>就是生命。', en: '[cannon] Cannon plus [gun] gun. <b>Spacing</b> keeps you alive.' } },
  { name: { zh: '鼠海戰術', en: 'Rat Tide' }, path: PATHS.stairs, towers: [{ type: 'gun', x: 7.5, y: 6.5 }, { type: 'gun', x: 4, y: 1 }], gate: 4, budget: 8, par: 7, star3: no('shield'),
    target: [0.004, 0.015],
    hint: { zh: '[gun] 機槍一次只能打<b>一隻</b>老鼠。', en: '[gun] A gun can only shoot <b>one</b> rat at a time.' } },
  { name: { zh: '三秒空窗', en: 'Three Seconds' }, path: PATHS.uturn, towers: [{ type: 'sniper', x: 13, y: 4 }, { type: 'gun', x: 9.5, y: 3 }], gate: 6, budget: 11, par: 9, star3: no('rats'), allowMono: ['rats'],
    target: [0.004, 0.012],
    hint: { zh: '[sniper] 狙擊裝填的 <b>3 秒</b>，就是你的機會。', en: 'The [sniper] sniper\'s <b>3-second</b> reload is your window.' } },
  { name: { zh: '老鼠的剋星', en: 'Rat Trap' }, path: PATHS.arch, towers: [{ type: 'cannon', x: 10, y: 3 }, { type: 'gun', x: 5.5, y: 1 }], gate: 6, budget: 12, par: 9, star3: no('rats'),
    target: [0.003, 0.01],
    hint: { zh: '[cannon] 大砲的範圍爆炸，專治<b>擠成一團</b>的部隊。', en: 'The [cannon] cannon\'s blast punishes troops that <b>bunch up</b>.' } },
  { name: { zh: '兩種規則', en: 'Two Rules' }, path: PATHS.spiral, towers: [{ type: 'cannon', x: 8, y: 6 }, { type: 'gun', x: 13, y: 6.5 }], gate: 6, budget: 12, par: 10, star3: no('rats'),
    target: [0.001, 0.006],
    hint: { zh: '[cannon] 大砲找<b>胖子</b>、[gun] 機槍找<b>最近的</b>，讓它們打錯人。', en: '[cannon] Cannon hunts the <b>toughest</b>, [gun] gun hunts the <b>closest</b>. Make them pick the wrong target.' } },
  { name: { zh: '總攻擊', en: 'All-Out Assault' }, path: PATHS.snake, towers: [{ type: 'sniper', x: 8.5, y: 6 }, { type: 'cannon', x: 12, y: 2.5 }, { type: 'gun', x: 2.5, y: 6 }], gate: 6, budget: 16, par: 12, star3: no('shield'),
    target: [0.0003, 0.003],
    hint: { zh: '三種塔都在。先想清楚每座塔<b>會先打誰</b>。', en: 'All three towers. Work out <b>who each tower shoots first</b>.' } },
  { name: { zh: '孔雀開屏', en: 'Look At Me' }, path: PATHS.hook, towers: [{ type: 'gun', x: 11, y: 6 }, { type: 'gun', x: 12.5, y: 4 }, { type: 'cannon', x: 7.5, y: 5.5 }], gate: 6, budget: 12, par: 10, star3: maxN(3),
    target: [0.004, 0.02], needs: 'peacock',
    hint: { zh: '[peacock] 孔雀一開屏，射程內的塔<b>全都只能打牠</b>，連已經鎖定的目標都會放掉。', en: 'When the [peacock] peacock fans its tail, every tower in range <b>must shoot it</b>, even ones already locked on.' } },
  { name: { zh: '地底奇襲', en: 'Dig Under' }, path: PATHS.wave, towers: [{ type: 'gun', x: 1, y: 5.5, zone: [0, 6] }, { type: 'gun', x: 6, y: 7.5, zone: [0, 6] }, { type: 'cannon', x: 13.5, y: 6.5, zone: [10, 22] }], gate: 6, budget: 12, par: 10, star3: no('peacock'),
    target: [0.001, 0.008], needs: 'mole',
    hint: { zh: '[mole] 鼴鼠前 <b>6 格在地底</b>，塔看不到也打不到。路上的土堆標記就是牠鑽出來的地方。', en: 'The [mole] mole stays <b>underground for the first 6 tiles</b>: towers can\'t see or hit it. The dirt marker on the path is where it pops up.' } },
  { name: { zh: '掩護射擊', en: 'Cover Fire' }, path: PATHS.notch, towers: [{ type: 'sniper', x: 11.5, y: 5.5 }, { type: 'gun', x: 7, y: 1 }, { type: 'gun', x: 5, y: 6.5 }], gate: 6, budget: 13, par: 11, star3: maxN(4),
    target: [0.003, 0.015], needs: 'peacock',
    hint: { zh: '[sniper] 狙擊一槍就能帶走河狸。讓 [peacock] 孔雀<b>替隊友擋子彈</b>。', en: 'The [sniper] sniper one-shots a beaver. Let the [peacock] peacock <b>take the bullet</b> for the team.' } },
  { name: { zh: '地道戰', en: 'Tunnel Rush' }, path: PATHS.drop, towers: [{ type: 'gun', x: 2, y: 3, zone: [0, 5] }, { type: 'cannon', x: 5, y: 2.5, zone: [0, 5] }, { type: 'gun', x: 1, y: 3.5, zone: [0, 5] }], gate: 9, budget: 14, par: 13, star3: no('shield'),
    target: [0.003, 0.012], needs: 'mole',
    hint: { zh: '入口的 [gun] 機槍和 [cannon] 大砲守得很緊。[mole] 鼴鼠可以<b>從底下鑽過去</b>。', en: 'A [gun] gun and a [cannon] cannon guard the entrance. The [mole] mole can <b>dig right under them</b>.' } },
  { name: { zh: '雙砲夾擊', en: 'Crossfire' }, path: PATHS.ladder, towers: [{ type: 'cannon', x: 13, y: 3.5 }, { type: 'cannon', x: 9.5, y: 2.5 }, { type: 'gun', x: 2, y: 6 }], gate: 7, budget: 14, par: 12, star3: no('rats'),
    target: [0.002, 0.01],
    hint: { zh: '兩座 [cannon] 大砲都 [maxhp] <b>找血最多的</b>。誰最耐打，誰就是誘餌。', en: 'Both [cannon] cannons [maxhp] <b>hunt the toughest</b>. Whoever can take a beating is the bait.' } },
  { name: { zh: '雙狙擊', en: 'Twin Snipers' }, path: PATHS.steps, towers: [{ type: 'sniper', x: 7, y: 3.5 }, { type: 'sniper', x: 6, y: 7.5 }, { type: 'cannon', x: 1, y: 6.5 }, { type: 'gun', x: 10, y: 5.5 }], gate: 6, budget: 17, par: 14, star3: maxN(5),
    target: [0.002, 0.01],
    hint: { zh: '兩座 [sniper] 狙擊各自裝填 3 秒。<b>數好拍子</b>，趁兩邊都在裝填時衝。', en: 'Two [sniper] snipers, each with a 3-second reload. <b>Count the beats</b> and rush while both reload.' } },
  { name: { zh: '長征', en: 'The Long March' }, path: PATHS.comb, towers: [{ type: 'gun', x: 1, y: 6.5 }, { type: 'gun', x: 12.5, y: 2 }, { type: 'gun', x: 8, y: 6 }, { type: 'cannon', x: 15, y: 5 }], gate: 7, budget: 17, par: 16, star3: no('scout'),
    target: [0.001, 0.008],
    hint: { zh: '路很長，[gun] 機槍有<b>很多時間</b>開火。誰能撐到最後？', en: 'A long road gives the [gun] guns <b>plenty of time</b> to shoot. Who can last the distance?' } },
  { name: { zh: '地底突擊隊', en: 'Mole Brigade' }, path: PATHS.loop, towers: [{ type: 'gun', x: 1, y: 6 }, { type: 'gun', x: 7, y: 5 }, { type: 'gun', x: 3.5, y: 3.5 }, { type: 'cannon', x: 10, y: 5.5 }], gate: 7, budget: 15, par: 12, star3: no('peacock'),
    target: [0.001, 0.006], needs: 'mole',
    hint: { zh: '入口有三座 [gun] 機槍，[mole] 鼴鼠出土後還有 [cannon] 大砲等著。<b>出土的時間點</b>很重要。', en: 'Three [gun] guns hold the entrance, and a [cannon] cannon waits where the [mole] moles surface. <b>When they pop up</b> matters.' } },
  { name: { zh: '迷宮城', en: 'Maze Keep' }, path: PATHS.maze, towers: [{ type: 'sniper', x: 14, y: 4.5 }, { type: 'cannon', x: 11, y: 6.5 }, { type: 'gun', x: 1, y: 6 }], gate: 6, budget: 19, par: 16, star3: maxN(5),
    target: [0.0008, 0.005],
    hint: { zh: '城堡藏在迷宮中間，[sniper] 狙擊<b>看得到整條路</b>。', en: 'The keep hides in the middle of a maze, and the [sniper] sniper <b>sees the whole road</b>.' } },
  { name: { zh: '最終決戰', en: 'Final Siege' }, path: PATHS.finale, towers: [{ type: 'sniper', x: 11, y: 8 }, { type: 'cannon', x: 2, y: 3.5 }, { type: 'gun', x: 14, y: 1 }, { type: 'gun', x: 1.5, y: 6 }], gate: 8, budget: 22, par: 17, star3: no('rats'),
    target: [0.0005, 0.004],
    hint: { zh: '四座塔、六種夥伴。用上你學到的<b>所有規則</b>。', en: 'Four towers, six critters. Use <b>every rule</b> you have learned.' } },
];
// 排行榜送出的編排：每個時間格一個整數，0 = 空格，1～6 依 TYPES 的順序。
const TYPES = ['shield', 'sapper', 'scout', 'rats', 'peacock', 'mole'];
function verify([level, ...codes]) {
  if (!Number.isInteger(level) || level < 1 || level > LEVELS.length || codes.length !== SIM.SLOTS) return false;
  if (!codes.every(c => Number.isInteger(c) && c >= 0 && c <= TYPES.length)) return false;
  const timeline = codes.map(c => c ? TYPES[c - 1] : null);
  if (timeline.some(t => t && UNLOCK[t] > level)) return false;
  const L = LEVELS[level - 1], cost = SIM.cost(timeline);
  if (cost <= 0 || cost > L.budget) return false;
  return SIM.run(L, timeline).win;
}
return { SIM, LEVELS, UNLOCK, TYPES, verify };
})();
if (typeof module !== 'undefined') module.exports = siegeArchitectRules;
