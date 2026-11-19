  /* ---------- Mines: classic puzzle ---------- */
  var N = 25;
  var M_PRESETS = {low:[5,3],medium:[8,10],high:[10,20]};
  var M = { active: false, over: false, mines: 3, layout: [], open: [], flags: [], picks: 0, ready: false, best: 0, level: 1, size: 5, checkpoint: false, bestLevel: 0 };
  var elBoard = $('board'), elMGo = $('mines-go'), elMMsg = $('mines-msg'), tiles = [];
  function mSay(text, cls) { elMMsg.textContent = text; elMMsg.className = 'msg' + (cls ? ' ' + cls : ''); }
  // Shared wallet refresh is also used by the other games.
  function syncBalance() { elBal.textContent = fmt(S.balance); save(); renderGo(); }
  var mineRound = null, minePending = null, mineSending = false, mineStarting = false;
  function mineNumber(i) { return mineRound ? Number(mineRound.visible[i]) : minesRules.number(M,i); }
  function mineRankStatus(text, retry) {
    var status = $('mines-rank-status');
    status.textContent = text;
    status.hidden = !text;
    $('mines-rank-retry').hidden = !retry;
  }
  var cancelMinePress = function(){};
  function bindMineTile(button, cell) {
    var timer=null, pointer=null, x=0, y=0, blocked=false, touch=false;
    function cancel(){if(timer!==null)clearTimeout(timer);timer=null;pointer=null;}
    button.addEventListener('pointerdown',function(e){
      cancelMinePress(); cancel(); blocked=false; touch=e.pointerType==='touch'||e.pointerType==='pen';
      if(!touch||e.button!==0||e.isPrimary===false||!M.active||M.open[cell]||minePending)return;
      pointer=e.pointerId;x=e.clientX;y=e.clientY;cancelMinePress=cancel;
      timer=setTimeout(function(){timer=null;blocked=true;mineFlag(cell);},500);
    });
    button.addEventListener('pointermove',function(e){if(pointer===e.pointerId&&Math.hypot(e.clientX-x,e.clientY-y)>10){blocked=true;cancel();}});
    button.addEventListener('pointerup',cancel);
    button.addEventListener('pointerleave',function(){if(pointer!==null){blocked=true;cancel();}});
    button.addEventListener('pointercancel',function(){blocked=true;cancel();});
    button.addEventListener('lostpointercapture',cancel);
    button.addEventListener('click',function(e){if(blocked){blocked=false;e.preventDefault();return;}pick(cell);});
    button.addEventListener('contextmenu',function(e){e.preventDefault();if(!touch){cancel();mineFlag(cell);}});
    button.addEventListener('keydown',function(e){if(e.key.toLowerCase()==='f'&&!e.repeat){e.preventDefault();mineFlag(cell);}});
  }
  window.addEventListener('blur',function(){cancelMinePress();});
  document.addEventListener('visibilitychange',function(){if(document.hidden)cancelMinePress();});
  function buildBoard() {
    cancelMinePress();
    try { var best = Number(localStorage.getItem('deep-sea-mines-best')); M.best = Number.isSafeInteger(best) && best >= 0 && best <= 22 ? best : 0; M.bestLevel = Number(localStorage.getItem('deep-sea-mines-level-best')) || 0; } catch (e) {}
    elBoard.innerHTML = ''; tiles = [];
    elBoard.style.gridTemplateColumns = 'repeat(' + M.size + ', minmax(44px, 1fr))';
    elBoard.style.minWidth = (M.size * 49) + 'px';
    elBoard.setAttribute('aria-label', M.size + ' 乘 ' + M.size + ' 排雷棋盤');
    for (var i = 0; i < N; i++) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'tile';
      bindMineTile(b, i);
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
      b.innerHTML = text; b.disabled = !M.active || M.checkpoint || !!minePending || (!!M.open[i] && !number);
      b.setAttribute('aria-label', '第 ' + (Math.floor(i / M.size) + 1) + ' 列第 ' + (i % M.size + 1) + ' 格，' + (shown ? M.layout[i] ? '地雷' : '周圍 ' + number + ' 顆雷' : M.flags[i] ? '已插旗' : '未翻開'));
    });
    $('mines-left').textContent = (N - M.mines - M.picks) + ' 格';
    $('mines-flags').textContent = M.flags.filter(Boolean).length + ' / ' + M.mines;
    $('mines-best').textContent = (N - M.mines) + ' 格';
    ['mines-difficulty','mines-size','mines-bombs'].forEach(function(id){$(id).disabled=M.active||mineStarting;});
    $('mines-level').textContent = M.size + '×' + M.size + ' · ' + M.mines + ' 雷';
    elMGo.disabled = M.active || mineStarting; elMGo.dataset.mode = M.active ? 'playing' : 'start';
    elMGo.innerHTML = M.active ? '找出全部安全格' : (M.over ? '再玩一局' : '開始踩地雷') + '<small>不限次數</small>';
  }
  function beginMines(size, bombs, round) {
    mineRound = round;
    N = size * size;
    Object.assign(M, round ? {size:size,mines:bombs,layout:[],open:[],flags:[],picks:0,result:null}
      : minesRules.create(size,bombs));
    M.active = true; M.over = false; M.level = 1; M.checkpoint = false;
    M.analytics = AN.start('mines', 0);
    buildBoard(); renderMines();
    mSay('棋盤：' + M.size + '×' + M.size + '，' + M.mines + ' 顆雷，第一格也可能踩雷。');
  }
  async function startMines() {
    if (M.active || mineStarting) return;
    var mode=$('mines-difficulty').value, spec=M_PRESETS[mode];
    var size=spec?spec[0]:Number($('mines-size').value), bombs=spec?spec[1]:Number($('mines-bombs').value);
    if(!Number.isInteger(size)||size<2||size>10||!Number.isInteger(bombs)||bombs<1||bombs>size*size-1){mSay('請輸入 2～10 的棋盤邊長，地雷數須為 1～N×N−1 的整數。','lose');return;}
    if (typeof location==='undefined' || location.protocol==='file' || size!==5 || bombs!==3) {
      mineRankStatus('');
      beginMines(size,bombs,null);
      return;
    }
    mineStarting = true;
    mineRankStatus('正在準備訪客排行…');
    renderMines();
    var round = null;
    try {
      var api = await import('./frontend/services/api.mjs');
      round = await api.startMinesRound(AbortSignal.timeout(4000));
    } catch {}
    mineStarting = false;
    if ($('view-mines').hidden) { mineRankStatus(''); renderMines(); return; }
    mineRankStatus(round ? '本局將列入訪客排行。' : '這一局可在本機遊玩。');
    beginMines(size,bombs,round);
  }
  function mineFinish(won) {
    if (!M.active || M.checkpoint) return;
    M.over = true;
    M.active = false; M.checkpoint = false;
    AN.end(M.analytics, 0, won ? 'complete' : 'loss', {step:M.picks,board_size:M.size,mine_count:M.mines});
    mSay(won ? '排雷成功！可以再玩一局，或選擇其他難度。' : '踩到地雷！調整難度或再試一次吧。',won?'win':'lose');
  }

  function mineUpdateProgress(previousPicks) {
    if (M.size === 5 && M.mines === 3 && M.picks > M.best) {
      M.best = M.picks;
      try { localStorage.setItem('deep-sea-mines-best', String(M.best)); } catch (e) {}
    }
    if (M.result) mineFinish(M.result === 'win');
    else if (M.picks !== previousPicks) {
      AN.progress(M.analytics, {stage: M.level, step: M.picks, score: M.picks});
      mSay('已找到 ' + M.picks + ' 格安全區；根據數字判斷，再翻下一格。');
    }
  }

  async function sendMineMove() {
    if (!minePending || mineSending) return;
    mineSending = true;
    mineRankStatus('正在驗證排雷操作…');
    renderMines();
    try {
      var api = await import('./frontend/services/api.mjs');
      var next = await api.moveMinesRound(mineRound.token, minePending, AbortSignal.timeout(8000));
      var previousPicks = M.picks;
      Object.assign(mineRound, next);
      M.picks = next.picks;
      M.result = next.result;
      M.layout = next.visible.map(cell => cell === 'mine');
      M.flags = next.visible.map(cell => cell === 'flag');
      M.open = next.visible.map(cell => Number.isInteger(cell) || cell === 'mine');
      minePending = null;
      if (next.flagLimit) mSay('旗子數不能超過 ' + M.mines + ' 面。');
      mineUpdateProgress(previousPicks);
      mineRankStatus(next.result ? '成績已送到排行榜。' : '本局將列入訪客排行。');
    } catch (error) {
      if (error.retryable === false) {
        minePending = null;
        M.active = false; M.over = false;
        AN.end(M.analytics, 0, 'abandoned', {step:M.picks,board_size:M.size,mine_count:M.mines});
        mineRankStatus('排行榜回合已中斷，請再開一局。');
      } else mineRankStatus('排雷操作未能送出。', true);
    } finally {
      mineSending = false;
      renderMines();
    }
  }

  function mineMove(action, cell) {
    if (!M.active || M.checkpoint || minePending) return;
    if (mineRound) {
      minePending = {id:mineRound.id,revision:mineRound.revision,action:action,cell:cell};
      sendMineMove();
      return;
    }
    var previousPicks = M.picks;
    var result = minesRules.move(M,action,cell);
    if (result === 'flag-limit') mSay('旗子數不能超過 ' + M.mines + ' 面。');
    else if (result) { mineUpdateProgress(previousPicks); renderMines(); }
  }

  function mineFlag(i) { mineMove('flag',i); }
  function pick(i) { mineMove('open',i); }
  $('mines-rank-retry').addEventListener('click',sendMineMove);
  elMGo.addEventListener('click', startMines);

  function mineSettings(){
    if(M.active||mineStarting)return;
    var mode=$('mines-difficulty').value,spec=M_PRESETS[mode];
    $('mines-custom').hidden=!!spec;
    if(spec){$('mines-size').value=spec[0];$('mines-bombs').value=spec[1];}
    var size=Number($('mines-size').value),max=Number.isInteger(size)&&size>=2&&size<=10?size*size-1:99;
    $('mines-bombs').max=max;$('mines-bomb-limit').textContent='地雷數：1～'+max+'（N×N−1）';
    var bombs=Number($('mines-bombs').value);
    if(Number.isInteger(size)&&size>=2&&size<=10&&Number.isInteger(bombs)&&bombs>=1&&bombs<size*size){
      mineRound=null;N=size*size;Object.assign(M,{size:size,mines:bombs,layout:[],open:[],flags:[],picks:0,over:false,result:null});
      buildBoard();renderMines();mSay('翻開全部 '+(N-bombs)+' 格安全區就過關。第一格也可能踩雷。');
    }
  }
  $('mines-difficulty').addEventListener('change',function(){if(!M.active)mineSettings();});
  $('mines-size').addEventListener('input',function(){if(!M.active)mineSettings();});
  $('mines-bombs').addEventListener('input',function(){if(!M.active)mineSettings();});
  mineSettings();
