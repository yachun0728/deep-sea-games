  /* ---------- lobby navigation and category filters ---------- */
  var lobbyScroll=0,lastView='';
  // Category buttons appear twice (sidebar and tab row); both stay in sync and combine with the name search.
  var lobbyCategory='all';
  function lobbyApply(){
    var q=($('lobby-search').value||'').trim().toLowerCase(),count=0;
    document.querySelectorAll('.lobby-grid .game-card').forEach(function(card){var show=!card.hasAttribute('data-game-hidden')&&(lobbyCategory==='all'||card.dataset.gameCategory===lobbyCategory)&&(!q||(card.textContent+' '+(card.getAttribute('aria-label')||'')).toLowerCase().indexOf(q)>=0);card.hidden=!show;if(show)count++;});
    $('lobby-count').textContent=count+' 款遊戲';
    // The first shown card is drawn wide, like the featured tile in the games grid.
    var first=document.querySelector('.lobby-grid .game-card:not([hidden])');document.querySelectorAll('.lobby-grid .game-card.is-wide').forEach(function(c){if(c!==first)c.classList.remove('is-wide');});if(first)first.classList.add('is-wide');
  }
  document.querySelectorAll('[data-lobby-filter]').forEach(function(button){button.addEventListener('click',function(){
    lobbyCategory=button.dataset.lobbyFilter;
    document.querySelectorAll('[data-lobby-filter]').forEach(function(item){item.setAttribute('aria-pressed',item.dataset.lobbyFilter===lobbyCategory?'true':'false');});
    lobbyApply();
  });});
  // The search box lives in the shared header; typing on a game page returns to the lobby first.
  // Cmd/Ctrl+K focuses the lobby search box.
  document.addEventListener('keydown',function(e){if((e.metaKey||e.ctrlKey)&&(e.key==='k'||e.key==='K')){e.preventDefault();if(location.hash.slice(1)!=='lobby')location.hash='lobby';setTimeout(function(){$('lobby-search').focus();},0);}});
  $('lobby-search').addEventListener('input',function(){if(location.hash.slice(1)!=='lobby'&&location.hash!=='')location.hash='lobby';lobbyApply();});
  // Counts and filter buttons follow the games that are actually shown (catalog "hidden" games are skipped).
  (function(){
    var cards=[].slice.call(document.querySelectorAll('.lobby-grid .game-card:not([data-game-hidden])')),total=cards.length;
    $('lobby-count').textContent=total+' 款遊戲';
    document.querySelectorAll('[data-lobby-filter]').forEach(function(b){
      var k=b.dataset.lobbyFilter,n=k==='all'?total:cards.filter(function(c){return c.dataset.gameCategory===k;}).length,s=b.querySelector('span');
      if(s)s.textContent=n;b.hidden=n===0;
    });
  })();
  lobbyApply();
  $('lobby-explore').addEventListener('click',function(){if($('lobby-games').scrollIntoView)$('lobby-games').scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'start'});});

  /* ---------- tabs ---------- */
  var VIEWS = { outpost: '深海前哨 <span>Deep Sea Outpost</span>', 'book-sort': '貓咪疊書舖 <span>Cat Book Stack</span>', 'market-desk': '收盤之前 <span>Closing Call</span>', academy: '百萬大學堂 <span>Millionaire Academy</span>', wardrobe: '我的造型 <span>My Wardrobe</span>', frontier: '荒島遠征 <span>Frontier Islands</span>', 'ocean-link': '深海連連看 <span>Ocean Link</span>', blaster: '深海火線 <span>Reef Blaster</span>', lobby: 'TICATICA GAMES', crash: '壓潰深度 <span>Crush Depth</span>', mines: '踩地雷 <span>Minesweeper</span>', plinko: '落珠 <span>Pearl Drop</span>', merge: '養珠 <span>Pearl Merge</span>', dice: '測深 <span>Sonar Dice</span>', limbo: '探底 <span>Deep Probe</span>', hilo: '漲退 <span>High Tide</span>', keno: '挖金礦 <span>Gold Digger</span>', wheel: '羅盤 <span>Compass</span>', tower: '浮升 <span>Ascent</span>', crossing: '橫渡 <span>Reef Run</span>', dream: '時序修復 <span>Dream Repair Shop</span>', runner: '閃避跑酷 <span>Dodge Run</span>', elevator: '插隊大師 <span>Queue Cutter</span>', sneak: '偷偷下班 <span>Sneak Out</span>', fishing: '深海釣手 <span>Fishing</span>', campaign: '宣傳車 <span>Campaign Truck</span>', boba: '插珍奶 <span>Boba Straw</span>', cat: '屋頂貓貓 <span>Rooftop Cat</span>', bird: '便便鳥大戰狼群 <span>Poop Bird vs Wolves</span>', frog: '青蛙吃蟲 <span>Frog Snack</span>', pudding: '布丁突圍 <span>Pudding Dash</span>', 'clock-out': '下班保衛戰 <span>Clock Out</span>', nap: '偷睡大師 <span>Nap Master</span>', breakout: '打磚塊 <span>Breakout</span>', 'last-hair': '尊嚴保衛戰 <span>The Last Hair</span>', mosquito: '血壓上升 <span>Midnight Mosquito</span>', reaper: '死神打工 <span>Reaper Shift</span>', skybuilder: '蓋樓大師 <span>Sky Builder</span>', dive: '一口氣探險 <span>One Breath Dive</span>', mrt: '捷運搶位 <span>MRT Seat Grab</span>', pancake: '泡麵煎餅翻面 <span>Noodle Pancake</span>', 'rocket-chair': '社畜要下班 <span>Roar Through the Ceiling</span>', carp: '鯉魚躍龍門 <span>Carp Leap</span>', rider: '外送員大戰惡犬 <span>Rider vs Dogs</span>', boss: '胖老闆追人 <span>Chubby Boss</span>', thief: '偷水果的貓 <span>Fruit Thief Cat</span>', baby: '寶寶逃洗澡 <span>Baby Bath Escape</span>', peek: '別看 <span>Don’t Peek</span>', 'pet-walk': '小灰出門 <span>Pet Walkies</span>', 'office-shoot': '拒絕加班 <span>No Overtime!</span>', 'eat-smaller': '數字吞噬 <span>Number Gulp</span>', 'mirror-twins': '鏡像雙子 <span>Mirror Twins</span>', 'shadow-relay': '影子接力 <span>Shadow Relay</span>', 'one-line-defense': '一筆畫守城 <span>One-Line Defense</span>', mermaid: '人魚接龍 <span>Mermaid Spider</span>', tetris: '俄羅斯方塊 <span>Block Drop</span>', 'on-pitch': '不准跑調 <span>Stay On Pitch</span>', 'quack-pond': '呱呱池塘 <span>Quack Pond</span>', banquet: '最後的晚餐 <span>The Last Banquet</span>' };
  /* ---------- collapsible lobby sidebar (per-browser preference only) ---------- */
  (function(){
    var KEY='ticatica-sidebar-collapsed',button=$('side-toggle'),collapsed=false;
    function apply(){var label=collapsed?'{{t:navigation.msg.001}}':'{{t:navigation.msg.002}}';$('site-shell').classList.toggle('side-collapsed',collapsed);button.setAttribute('aria-expanded',collapsed?'false':'true');button.setAttribute('aria-label',label);button.title=label;}
    try{collapsed=localStorage.getItem(KEY)==='1';}catch(e){}
    apply();
    button.addEventListener('click',function(){collapsed=!collapsed;apply();try{localStorage.setItem(KEY,collapsed?'1':'0');}catch(e){}});
  })();
  /* ---------- lobby extras: show all, random pick ---------- */
  $('lobby-show-all').addEventListener('click',function(){$('lobby-search').value='';var all=document.querySelector('[data-lobby-filter="all"]');if(all)all.click();});
  $('side-random').addEventListener('click',function(){var cards=[].slice.call(document.querySelectorAll('.lobby-grid .game-card:not([data-game-hidden])'));if(cards.length)location.hash=cards[Math.floor(Math.random()*cards.length)].getAttribute('href');});
  Object.keys(VIEWS).forEach(function(id) {
    if (['lobby', 'wardrobe', 'blaster', 'book-sort', 'outpost', 'academy'].includes(id)) return;
    var exit = document.createElement('a');
    exit.className = 'game-exit-link';
    exit.href = '#lobby';
    exit.textContent = '{{t:navigation.msg.003}}';
    var target = id === 'ocean-link' ? $('ol-toolbar-actions') :
      id === 'frontier' ? $('ft-main').querySelector('.ft-top') : $('view-' + id);
    target.prepend(exit);
  });

  function route() {
    var v = location.hash.slice(1);
    // Hidden games keep their code but cannot be opened by link; show the lobby and correct the address.
    // A hidden game can still be opened for testing with ?preview=<id>#<id>; the lobby keeps it hidden.
    var previewing = false; try { previewing = new URLSearchParams(location.search).get('preview') === v; } catch (e) {}
    if (VIEWS[v] && !previewing && document.querySelector('.game-card[data-game-hidden][href="#' + v + '"]')) { try { history.replaceState(null, '', '#lobby'); } catch (e) {} v = 'lobby'; }
    var member = v === 'member';
    if (!member && !VIEWS[v]) v = 'lobby';
    $('site-shell').classList.toggle('is-game', !member && v !== 'lobby' && v !== 'wardrobe');
    if(lastView==='lobby'&&v!=='lobby')lobbyScroll=window.scrollY||0;
    $('site-shell').classList.toggle('is-lobby',v==='lobby');$('site-shell').classList.toggle('is-member',member);$('view-member').hidden=!member;memberRoute(member);if(v!==lastView)boardRoute(v==='lobby');
    Object.keys(VIEWS).forEach(function (k) {
      $('view-' + k).hidden = k !== v;
      if (k === v) $('tab-' + k).setAttribute('aria-current', 'page'); else $('tab-' + k).removeAttribute('aria-current');
    });
    oceanLinkRoute(v==='ocean-link');
    frontierRoute(v==='frontier');
    outpostRoute(v==='outpost');
    marketDeskRoute(v==='market-desk');
    academyRoute(v==='academy');
    bobaRoute(v==='boba');diveRoute(v==='dive');mrtRoute(v==='mrt');pancakeRoute(v==='pancake');rocketRoute(v==='rocket-chair');esRoute(v==='eat-smaller');mtRoute(v==='mirror-twins');srRoute(v==='shadow-relay');olRoute(v==='one-line-defense');ttRoute(v==='tetris');opRoute(v==='on-pitch');qpRoute(v==='quack-pond');
    DR.last=performance.now();EQ.last=performance.now();
    // The member centre is not a game: analytics treats it like the lobby so no game_view is recorded.
    AN.view(member?'lobby':v);
    var heading = member ? '{{t:navigation.msg.004}}' : VIEWS[v];
    $('game-name').innerHTML = heading;
    document.title=member?'{{t:navigation.msg.005}}':v==='lobby'?'TiCATiCA GAMES':VIEWS[v].replace(/<[^>]*>/g,'').trim();
    if(lastView&&lastView!==v){$('game-name').focus({preventScroll:true});if(window.scrollTo)window.scrollTo({top:v==='lobby'?lobbyScroll:0,behavior:'instant'});}
    lastView=v;
    $('picker-current').textContent=heading.replace(/<[^>]*>/g,'').trim();
    $('game-picker').open=false;
    if (v === 'crash') resize();
    if (v === 'plinko') pkResize();
  }
  document.querySelectorAll('.game-picker .tabs a').forEach(function(link){link.addEventListener('click',function(){$('game-picker').open=false;});});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&$('game-picker').open){$('game-picker').open=false;$('game-picker').querySelector('summary').focus();}});
  window.addEventListener('hashchange', function() {
    if (location.hash.slice(1) !== lastView) route();
  });
  if (window.ResizeObserver) new ResizeObserver(resize).observe(sea); else window.addEventListener('resize', resize);

