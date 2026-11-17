  /* ---------- Keno: gold digging ---------- */
  var KE_N = 40, KE_DIGS = 5;
  var KE = { active: false, over: false, layout: [], open: [], digs: 0, score: 0, best: 0 };
  var elKGo = $('ke-go'), elKMsg = $('ke-msg'), elKBoard = $('ke-board'), kcells = [];
  var KE_ORES = [{name: '石頭', icon: '●', score: 0}, {name: '銅礦', icon: '◆', score: 10}, {name: '金礦', icon: '◆', score: 30}, {name: '寶石', icon: '✦', score: 60}];
  function kSay(text, cls) { elKMsg.textContent = text; elKMsg.className = 'msg' + (cls ? ' ' + cls : ''); }
  function keBuild() {
    try { var best = Number(localStorage.getItem('deep-sea-gold-best')); KE.best = Number.isSafeInteger(best) && best >= 0 && best <= 300 ? best : 0; } catch (e) {}
    for (var n = 0; n < KE_N; n++) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'kcell';
      b.addEventListener('click', keDig.bind(null, n)); elKBoard.appendChild(b); kcells.push(b);
    }
  }
  function keUI() {
    kcells.forEach(function (b, i) {
      var shown = !!KE.open[i], ore = KE_ORES[KE.layout[i] || 0];
      b.className = 'kcell' + (shown ? ' ore-' + KE.layout[i] : ' soil');
      b.textContent = shown ? ore.icon : '⛏'; b.disabled = !KE.active || shown;
      b.setAttribute('aria-label', '礦區第 ' + (i + 1) + ' 格，' + (shown ? ore.name + '，' + ore.score + ' 分' : '尚未挖掘'));
    });
    $('ke-left').textContent = (KE_DIGS - KE.digs) + ' / ' + KE_DIGS;
    $('ke-score').textContent = KE.score; $('ke-best').textContent = KE.best;
    elKGo.disabled = KE.active; elKGo.dataset.mode = KE.active ? 'playing' : 'start';
    elKGo.innerHTML = KE.active ? '選一格挖掘吧' : (KE.over ? '再挖一局' : '開始挖金礦') + '<small>入場 ' + ENTRY_FEE + ' 點 · 每局 5 次</small>';
  }
  function kePlay() {
    if (KE.active) return;
    if (S.balance < ENTRY_FEE) { kSay(LOW_MSG, 'lose'); return; }
    // Fixed contents: 20 stones, 10 copper, 8 gold and 2 gems; shuffled once per round.
    KE.layout = Array.from({length: KE_N}, function (_, i) { return i < 20 ? 0 : i < 30 ? 1 : i < 38 ? 2 : 3; });
    for (var i = KE_N - 1; i > 0; i--) { var r = Math.floor(Math.random() * (i + 1)), tmp = KE.layout[i]; KE.layout[i] = KE.layout[r]; KE.layout[r] = tmp; }
    S.balance -= ENTRY_FEE; KE.active = true; KE.over = false; KE.open = []; KE.digs = 0; KE.score = 0;
    KE.analytics = AN.start('keno', ENTRY_FEE);
    kSay('帶上十字鎬出發！點一格挖一格，共有 5 次機會。'); syncBalance(); keUI();
  }
  function keDig(i) {
    if (!KE.active || i < 0 || i >= KE_N || KE.open[i]) return;
    KE.open[i] = true; KE.digs++;
    var ore = KE_ORES[KE.layout[i]]; KE.score += ore.score;
    if (KE.score > KE.best) { KE.best = KE.score; try { localStorage.setItem('deep-sea-gold-best', String(KE.best)); } catch (e) {} }
    AN.progress(KE.analytics, {step: KE.digs, score: KE.score});
    if (KE.digs === KE_DIGS) {
      KE.active = false; KE.over = true;
      AN.end(KE.analytics, 0, 'complete', {step: KE.digs, score: KE.score});
      kSay('挖掘完成！最後挖到' + ore.name + '，本局共 ' + KE.score + ' 分。', 'win');
    } else kSay('挖到' + ore.name + '，增加 ' + ore.score + ' 分！還能挖 ' + (KE_DIGS - KE.digs) + ' 次。');
    keUI();
  }
  elKGo.addEventListener('click', kePlay);
