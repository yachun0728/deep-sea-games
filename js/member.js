
  /* ---------- member centre (local only: reads existing best-record keys, writes nothing) ---------- */
  var MEMBER_RECORDS = [['mines','deep-sea-mines-best'],['breakout','deep-sea-breakout-best'],['merge','pearl-merge-best'],['runner','chayne'],['elevator','deep-sea-queue-best'],['sneak','sneak'],['fishing','deep-sea-fishing-best'],['campaign','deep-sea-campaign-best'],['cat','deep-sea-cat-best'],['bird','deep-sea-bird-best'],['frog','deep-sea-frog-best'],['pudding','deep-sea-pudding-best'],['clock-out','deep-sea-clock-out-best'],['peek','deep-sea-peek-best'],['mosquito','deep-sea-mosquito-best'],['last-hair','deep-sea-last-hair-best'],['banquet','deep-sea-banquet-best'],['office-shoot','deep-sea-office-shoot-best'],['nap','deep-sea-nap-best'],['reaper','reaper'],['blaster','deep-sea-blaster-best'],['skybuilder','deep-sea-skybuilder-best'],['carp','deep-sea-carp-best'],['rider','deep-sea-rider-best'],['boss','deep-sea-boss-best'],['thief','deep-sea-thief-best'],['baby','deep-sea-baby-best'],['boba','straw_game_best'],['dive','diveBestScore'],['mrt','mrtBestTier']];
  var memberTimer = 0;
  function memberGameName(id) { return (VIEWS[id] || id).replace(/<span>[\s\S]*<\/span>/, '').replace(/<[^>]*>/g, '').trim(); }
  function memberSync() {
    $('member-balance').textContent = fmt(S.balance);
  }
  function memberRecords() {
    var rows = [];
    MEMBER_RECORDS.forEach(function (r) {
      if (!document.querySelector('.lobby-grid .game-card[href="#' + r[0] + '"]:not([data-game-hidden])')) return;
      var n; try { n = Number(localStorage.getItem(r[1])); } catch (e) { n = 0; }
      if (isFinite(n) && n > 0) rows.push([r[0], Math.round(n * 10) / 10]);
    });
    return rows;
  }
  function memberIcon(id) {
    var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    icon.setAttribute('viewBox', '0 0 96 96'); icon.setAttribute('aria-hidden', 'true'); use.setAttribute('href', '#icon-' + id); icon.appendChild(use); return icon;
  }
  var boardRequest = null;
  var boardGame = $('board-game');
  var boardRetry = $('board-retry');

  function boardRow(gameId, entry) {
    var row = document.createElement('tr');
    var player = row.insertCell(), game = row.insertCell(), best = row.insertCell();
    player.className = 'board-player';
    if (entry.displayName) {
      player.setAttribute('data-i18n-ignore', '');
      player.textContent = entry.displayName;
    } else {
      player.textContent = '訪客';
    }

    var link = document.createElement('a'), name = document.createElement('span');
    link.href = '#' + gameId;
    name.textContent = memberGameName(gameId);
    link.append(memberIcon(gameId), name);
    game.appendChild(link);
    best.className = 'board-best';
    best.textContent = entry.score.toLocaleString('zh-TW');
    return row;
  }

  function boardStatus(message, retry) {
    var status = $('board-status');
    status.textContent = message;
    status.hidden = !message;
    boardRetry.hidden = !retry;
  }

  async function boardLoad() {
    if (boardRequest) boardRequest.abort();
    var request = new AbortController();
    boardRequest = request;
    var gameId = boardGame.value;
    var body = $('board-rows');
    body.replaceChildren();
    boardStatus('載入排行榜中…');
    var timeout = setTimeout(function () { request.abort(); }, 10000);
    try {
      var module = await import('./frontend/services/api.mjs');
      var result = await module.createApiClient(module.arcadeApiOrigin()).leaderboard(gameId, request.signal);
      if (boardRequest !== request) return;
      if (result.gameId !== gameId || !Array.isArray(result.entries)) throw new Error('invalid_leaderboard');

      var rows = result.entries.map(function (entry) { return boardRow(gameId, entry); });
      body.replaceChildren(...rows);
      boardStatus(rows.length ? '' : '這款遊戲尚無排行榜紀錄。');
    } catch (error) {
      if (boardRequest === request) boardStatus('目前無法載入排行榜。', true);
    } finally {
      clearTimeout(timeout);
      if (boardRequest === request) boardRequest = null;
    }
  }

  function boardRoute(on) {
    if (!on) {
      if (boardRequest) boardRequest.abort();
      boardRequest = null;
      return;
    }
    if (!boardGame.options.length) {
      document.querySelectorAll('.lobby-grid .game-card:not([data-game-hidden])').forEach(function (card) {
        var gameId = card.hash.slice(1);
        if (Object.hasOwn(VIEWS, gameId)) boardGame.add(new Option(memberGameName(gameId), gameId));
      });
      if (Array.from(boardGame.options).some(function (option) { return option.value === 'frog'; })) {
        boardGame.value = 'frog';
      }
    }
    if (boardGame.value) boardLoad();
    else boardStatus('這款遊戲尚無排行榜紀錄。');
  }

  boardGame.addEventListener('change', boardLoad);
  boardRetry.addEventListener('click', boardLoad);

  function memberRender() {
    memberSync();
    var list = $('member-records'), rows = memberRecords();
    list.textContent = '';
    rows.forEach(function (r) {
      var li = document.createElement('li'), a = document.createElement('a'), name = document.createElement('span'), value = document.createElement('strong'), icon = memberIcon(r[0]);
      a.href = '#' + r[0]; name.textContent = memberGameName(r[0]); value.textContent = r[1].toLocaleString('zh-TW');
      a.appendChild(icon); a.appendChild(name); a.appendChild(value); li.appendChild(a); list.appendChild(li);
    });
    $('member-empty').hidden = rows.length > 0;
    $('member-played').textContent = rows.length;
    $('member-total').textContent = document.querySelectorAll('.lobby-grid .game-card:not([data-game-hidden])').length;
  }
  function memberRoute(on) {
    clearInterval(memberTimer); memberTimer = 0;
    if (on) { memberRender(); memberTimer = setInterval(memberSync, 1000); }
  }
  /* ---------- header account menu: points, regen hint, shortcuts ---------- */
  (function () {
    var button = $('account-toggle'), menu = $('account-menu'), timer = 0;
    function sync() {
      $('account-balance').textContent = fmt(S.balance);
    }
    function setOpen(open) {
      menu.hidden = !open; button.setAttribute('aria-expanded', open ? 'true' : 'false');
      clearInterval(timer); timer = 0;
      if (open) { sync(); timer = setInterval(sync, 1000); }
    }
    button.addEventListener('click', function (e) { e.stopPropagation(); setOpen(menu.hidden); });
    document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target) && !button.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setOpen(false); button.focus(); } });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    window.addEventListener('hashchange', function () { setOpen(false); });
    $('account-board').addEventListener('click', function () {
      setTimeout(function () { var board = document.querySelector('.lobby-board'); if (board && board.scrollIntoView) board.scrollIntoView({ block: 'start' }); }, 60);
    });
  })();
