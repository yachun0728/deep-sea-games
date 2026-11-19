
  /* ---------- member centre (local only: reads existing best-record keys, writes nothing) ---------- */
  var MEMBER_RECORDS = [['mines','deep-sea-mines-best'],['breakout','deep-sea-breakout-best'],['merge','pearl-merge-best'],['runner','chayne'],['elevator','deep-sea-queue-best'],['sneak','sneak'],['fishing','deep-sea-fishing-best'],['campaign','deep-sea-campaign-best'],['cat','deep-sea-cat-best'],['bird','deep-sea-bird-best'],['frog','deep-sea-frog-best'],['pudding','deep-sea-pudding-best'],['clock-out','deep-sea-clock-out-best'],['peek','deep-sea-peek-best'],['mosquito','deep-sea-mosquito-best'],['last-hair','deep-sea-last-hair-best'],['banquet','deep-sea-banquet-best'],['office-shoot','deep-sea-office-shoot-best'],['nap','deep-sea-nap-best'],['reaper','reaper'],['blaster','deep-sea-blaster-best'],['skybuilder','deep-sea-skybuilder-best'],['carp','deep-sea-carp-best'],['rider','deep-sea-rider-best'],['boss','deep-sea-boss-best'],['thief','deep-sea-thief-best'],['baby','deep-sea-baby-best'],['boba','straw_game_best'],['dive','diveBestScore'],['mrt','mrtBestTier']];
  var memberTimer = 0;
  function memberGameName(id) { return (VIEWS[id] || id).replace(/<span>[\s\S]*<\/span>/, '').replace(/<[^>]*>/g, '').trim(); }
  function memberSync() {
    $('member-balance').textContent = fmt(S.balance);
    var hint = $('regen-hint'); if (hint) $('member-regen').textContent = hint.textContent;
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
  // Lobby leaderboard: only this device's records exist (no server), shown as the guest player's bests.
  // Placeholder live leaderboard (no server yet): random sample rows, a new one slides in every few seconds.
  var BOARD_PLAYERS = ['NeonCat', 'PixelRunner', 'BlueFin', 'LuckyDuck', 'BaldEagle', 'TowerKid', 'HopHop', 'NightOwl', 'Mochi88', 'RetroFox', 'Kiwi_07', 'StarDust', 'Ducky', 'Tofu', 'Zed'];
  var BOARD_GAMES = [['rocket-chair', 5], ['office-shoot', 12], ['mermaid', 3000], ['banquet', 12], ['last-hair', 500], ['skybuilder', 40], ['frog', 120], ['peek', 100], ['nap', 900], ['blaster', 30], ['clock-out', 2400], ['pudding', 1800]];
  var boardTimer = 0;
  function boardPick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function boardRow() {
    var g = boardPick(BOARD_GAMES), tr = document.createElement('tr'), player = document.createElement('td'), game = document.createElement('td'), link = document.createElement('a'), name = document.createElement('span'), best = document.createElement('td');
    player.textContent = boardPick(BOARD_PLAYERS); player.className = 'board-player'; player.setAttribute('data-i18n-ignore', '');
    link.href = '#' + g[0]; name.textContent = memberGameName(g[0]); link.appendChild(memberIcon(g[0])); link.appendChild(name); game.appendChild(link);
    best.textContent = Math.max(1, Math.round(g[1] * (0.3 + Math.random() * 0.7))).toLocaleString('zh-TW'); best.className = 'board-best';
    tr.appendChild(player); tr.appendChild(game); tr.appendChild(best); return tr;
  }
  function boardTick() {
    if (document.hidden || $('view-lobby').hidden) return;
    var body = $('board-rows'), tr = boardRow();
    tr.className = 'is-new'; body.insertBefore(tr, body.firstChild);
    while (body.children.length > 8) body.removeChild(body.lastChild);
  }
  function boardRender() {
    var body = $('board-rows');
    if (!body.children.length) for (var i = 0; i < 8; i++) body.appendChild(boardRow());
    $('board-empty').hidden = true;
    if (!boardTimer) boardTimer = setInterval(boardTick, 1500);
  }
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
