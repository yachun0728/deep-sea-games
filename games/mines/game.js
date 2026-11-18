  /* ---------- Mines: classic puzzle ---------- */
  var N = 25;
  var M_PRESETS = {low:[5,3],medium:[8,10],high:[10,20]};
  var M = { active: false, over: false, mines: 3, layout: [], open: [], flags: [], picks: 0, flagMode: false, ready: false, best: 0, level: 1, size: 5, checkpoint: false, bestLevel: 0 };
  var elBoard = $('board'), elMGo = $('mines-go'), elMMsg = $('mines-msg'), tiles = [];
  function mSay(text, cls) { elMMsg.textContent = text; elMMsg.className = 'msg' + (cls ? ' ' + cls : ''); }
  // Shared wallet refresh is also used by the other games.
  function syncBalance() { elBal.textContent = fmt(S.balance); save(); renderGo(); }
  function mineNeighbors(i) {
    var result = [];
    for (var j = 0; j < N; j++) if (j !== i && Math.abs(Math.floor(j / M.size) - Math.floor(i / M.size)) <= 1 && Math.abs(j % M.size - i % M.size) <= 1) result.push(j);
    return result;
  }
  function mineNumber(i) { return mineNeighbors(i).filter(function (j) { return M.layout[j]; }).length; }
  function buildBoard() {
    try { var best = Number(localStorage.getItem('deep-sea-mines-best')); M.best = Number.isSafeInteger(best) && best >= 0 && best <= 22 ? best : 0; M.bestLevel = Number(localStorage.getItem('deep-sea-mines-level-best')) || 0; } catch (e) {}
    elBoard.innerHTML = ''; tiles = [];
    elBoard.style.gridTemplateColumns = 'repeat(' + M.size + ', minmax(44px, 1fr))';
    elBoard.style.minWidth = (M.size * 49) + 'px';
    elBoard.setAttribute('aria-label', M.size + ' 乘 ' + M.size + ' 排雷棋盤');
    for (var i = 0; i < N; i++) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'tile';
      b.addEventListener('click', pick.bind(null, i));
      b.addEventListener('contextmenu', (function (n) { return function (e) { e.preventDefault(); mineFlag(n); }; })(i));
      elBoard.appendChild(b); tiles.push(b);
    }
  }
  function renderMines() {
    tiles.forEach(function (b, i) {
      var shown = M.open[i] || M.over, number = shown && !M.layout[i] ? mineNumber(i) : 0;
      var mineArt = '<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#243342" stroke-width="5" stroke-linecap="round"><path d="M32 6v52M6 32h52M14 14l36 36M14 50l36-36"/></g><circle cx="32" cy="32" r="19" fill="#243342"/><circle cx="26" cy="25" r="6" fill="#8ba4af"/><circle cx="39" cy="39" r="3" fill="#121f2b"/></svg>';
      var flagArt = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M30 10v42" stroke="#293b46" stroke-width="5" stroke-linecap="round"/><path d="M29 10 51 18 29 29Z" fill="#ed654d" stroke="#a93428" stroke-width="2" stroke-linejoin="round"/><path d="m20 52 10-7 13 7Z" fill="#344d48"/><path d="M16 55h34" stroke="#344d48" stroke-width="4" stroke-linecap="round"/></svg>';
      var text = shown ? (M.layout[i] ? mineArt : number ? String(number) : '') : M.flags[i] ? flagArt : '';
      b.className = 'tile' + (shown ? (M.layout[i] ? ' mine' : ' revealed number-' + number) : M.flags[i] ? ' flagged' : ' covered');
      b.innerHTML = text; b.disabled = !M.active || M.checkpoint || (!!M.open[i] && !number);
      b.setAttribute('aria-label', '第 ' + (Math.floor(i / M.size) + 1) + ' 列第 ' + (i % M.size + 1) + ' 格，' + (shown ? M.layout[i] ? '地雷' : '周圍 ' + number + ' 顆雷' : M.flags[i] ? '已插旗' : '未翻開'));
    });
    $('mines-left').textContent = (N - M.mines - M.picks) + ' 格';
    $('mines-flags').textContent = M.flags.filter(Boolean).length + ' / ' + M.mines;
    $('mines-best').textContent = (N - M.mines) + ' 格';
    ['mines-difficulty','mines-size','mines-bombs'].forEach(function(id){$(id).disabled=M.active;});
    $('mines-flag').disabled = !M.active || M.checkpoint;
    $('mines-flag').setAttribute('aria-pressed', String(M.flagMode));
    $('mines-flag').textContent = M.flagMode ? '⚑ 插旗模式（點此改翻格）' : '翻格模式（點此改插旗）';
    $('mines-level').textContent = M.size + '×' + M.size + ' · ' + M.mines + ' 雷';
    elMGo.disabled = M.active; elMGo.dataset.mode = M.active ? 'playing' : 'start';
    elMGo.innerHTML = M.active ? '找出全部安全格' : (M.over ? '再玩一局' : '開始踩地雷') + '<small>不限次數</small>';
  }
  function mineStage() {
    N = M.size * M.size;
    M.over = false; M.layout = []; M.open = []; M.flags = []; M.picks = 0; M.ready = false; M.flagMode = false; M.checkpoint = false;
    {
      var pool = []; for (var n = 0; n < N; n++) pool.push(n);
      for (var j = pool.length - 1; j > 0; j--) { var r = Math.floor(Math.random() * (j + 1)), tmp = pool[j]; pool[j] = pool[r]; pool[r] = tmp; }
      pool.slice(0, M.mines).forEach(function (n) { M.layout[n] = true; }); M.ready = true;
    }
    buildBoard(); renderMines();
    mSay('棋盤：' + M.size + '×' + M.size + '，' + M.mines + ' 顆雷，第一格也可能踩雷。');
  }
  function startMines() {
    if (M.active) return;
    var mode=$('mines-difficulty').value, spec=M_PRESETS[mode];
    var size=spec?spec[0]:Number($('mines-size').value), bombs=spec?spec[1]:Number($('mines-bombs').value);
    if(!Number.isInteger(size)||size<2||size>10||!Number.isInteger(bombs)||bombs<1||bombs>size*size-1){mSay('請輸入 2～10 的棋盤邊長，地雷數須為 1～N×N−1 的整數。','lose');return;}
    M.size=size;M.mines=bombs;
    M.level = 1; M.active = true; M.over = false; M.layout = []; M.open = []; M.flags = []; M.picks = 0; M.ready = false; M.flagMode = false;
    M.analytics = AN.start('mines', 0);
    mineStage();
  }
  function mineFinish(won) {
    if (!M.active || M.checkpoint) return;
    M.over = true;
    M.active = false; M.checkpoint = false;
    AN.end(M.analytics, 0, won ? 'complete' : 'loss', {step:M.picks,board_size:M.size,mine_count:M.mines});
    mSay(won ? '排雷成功！可以再玩一局，或選擇其他難度。' : '踩到地雷！調整難度或再試一次吧。',won?'win':'lose');
  }

  function mineFlag(i) {
    if (!M.active || M.checkpoint || M.open[i] || i < 0 || i >= N) return;
    if (!M.flags[i] && M.flags.filter(Boolean).length >= M.mines) { mSay('旗子數不能超過 ' + M.mines + ' 面。'); return; }
    M.flags[i] = !M.flags[i]; renderMines();
  }
  function pick(i) {
    if (!M.active || M.checkpoint || i < 0 || i >= N) return;
    var queue;
    if (M.open[i]) {
      var number = mineNumber(i), neighbors = mineNeighbors(i);
      if (!number || neighbors.filter(function (n) { return !!M.flags[n]; }).length !== number) return;
      queue = neighbors.filter(function (n) { return !M.open[n] && !M.flags[n]; });
      if (!queue.length) return;
      var bomb = queue.find(function (n) { return M.layout[n]; });
      if (bomb !== undefined) { M.open[bomb] = true; mineFinish(false); renderMines(); return; }
    } else {
      if (M.flagMode) { mineFlag(i); return; }
      if (M.flags[i]) return;
      if (M.layout[i]) { M.open[i] = true; mineFinish(false); renderMines(); return; }
      queue = [i];
    }
    while (queue.length) {
      var cell = queue.pop();
      if (M.open[cell] || M.flags[cell] || M.layout[cell]) continue;
      M.open[cell] = true; M.picks++;
      if (!mineNumber(cell)) queue = queue.concat(mineNeighbors(cell));
    }
    if (M.size === 5 && M.mines === 3 && M.picks > M.best) { M.best = M.picks; try { localStorage.setItem('deep-sea-mines-best', String(M.best)); } catch (e) {} }
    if (M.picks === N - M.mines) mineFinish(true);
    else { AN.progress(M.analytics, {stage: M.level, step: M.picks, score: M.picks}); mSay('已找到 ' + M.picks + ' 格安全區；根據數字判斷，再翻下一格。'); }
    renderMines();
  }
  elMGo.addEventListener('click', startMines);
  $('mines-flag').addEventListener('click', function () { if (!M.active) return; M.flagMode = !M.flagMode; renderMines(); });

  function mineSettings(){
    var mode=$('mines-difficulty').value,spec=M_PRESETS[mode];
    $('mines-custom').hidden=!!spec;
    if(spec){$('mines-size').value=spec[0];$('mines-bombs').value=spec[1];}
    var size=Number($('mines-size').value),max=Number.isInteger(size)&&size>=2&&size<=10?size*size-1:99;
    $('mines-bombs').max=max;$('mines-bomb-limit').textContent='地雷數：1～'+max+'（N×N−1）';
  }
  $('mines-difficulty').addEventListener('change',function(){if(!M.active)mineSettings();});
  $('mines-size').addEventListener('input',function(){if(!M.active)mineSettings();});
  mineSettings();
