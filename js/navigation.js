  /* ---------- lobby navigation and category filters ---------- */
  var lobbyScroll=0,lastView='';
  document.querySelectorAll('[data-lobby-filter]').forEach(function(button){button.addEventListener('click',function(){
    var category=button.dataset.lobbyFilter,count=0;
    document.querySelectorAll('.lobby-grid .game-card').forEach(function(card){var show=category==='all'||card.dataset.gameCategory===category;card.hidden=!show;if(show)count++;});
    document.querySelectorAll('[data-lobby-filter]').forEach(function(item){item.setAttribute('aria-pressed',item===button?'true':'false');});
    $('lobby-count').textContent=count+' 款遊戲';
  });});
  $('lobby-explore').addEventListener('click',function(){if($('lobby-games').scrollIntoView)$('lobby-games').scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'start'});});

  /* ---------- tabs ---------- */
  var VIEWS = { lobby: '深海遊戲廳 <span>Deep Sea Arcade</span>', crash: '壓潰深度 <span>Crush Depth</span>', mines: '水雷區 <span>Mine Field</span>', plinko: '落珠 <span>Pearl Drop</span>', merge: '養珠 <span>Pearl Merge</span>', dice: '測深 <span>Sonar Dice</span>', limbo: '探底 <span>Deep Probe</span>', hilo: '漲退 <span>High Tide</span>', keno: '撒網 <span>Cast Net</span>', wheel: '羅盤 <span>Compass</span>', tower: '浮升 <span>Ascent</span>', crossing: '橫渡 <span>Reef Run</span>', dream: '時序修復 <span>Dream Repair Shop</span>', runner: '閃避跑酷 <span>Dodge Run</span>', elevator: '插隊大師 <span>Queue Cutter</span>', sneak: '偷偷下班 <span>Sneak Out</span>', fishing: '深海釣手 <span>Fishing</span>', campaign: '宣傳車 <span>Campaign Truck</span>', boba: '插珍奶 <span>Boba Straw</span>', cat: '屋頂貓貓 <span>Rooftop Cat</span>', bird: '便便鳥大戰狼群 <span>Poop Bird vs Wolves</span>', reaper: '死神打工 <span>Reaper Shift</span>' };
  function route() {
    var v = location.hash.slice(1); if (!VIEWS[v]) v = 'lobby';
    if(lastView==='lobby'&&v!=='lobby')lobbyScroll=window.scrollY||0;
    $('site-shell').classList.toggle('is-lobby',v==='lobby');
    Object.keys(VIEWS).forEach(function (k) {
      $('view-' + k).hidden = k !== v;
      if (k === v) $('tab-' + k).setAttribute('aria-current', 'page'); else $('tab-' + k).removeAttribute('aria-current');
    });
    bobaRoute(v==='boba');
    DR.last=performance.now();EQ.last=performance.now();
    AN.view(v);
    $('game-name').innerHTML = VIEWS[v];
    document.title=VIEWS[v].replace(/<[^>]*>/g,'').trim();
    if(lastView&&lastView!==v){$('game-name').focus({preventScroll:true});if(window.scrollTo)window.scrollTo({top:v==='lobby'?lobbyScroll:0,behavior:'instant'});}
    lastView=v;
    $('picker-current').textContent=VIEWS[v].replace(/<[^>]*>/g,'').trim();
    $('game-picker').open=false;
    if (v === 'crash') resize();
    if (v === 'plinko') pkResize();
  }
  document.querySelectorAll('.game-picker .tabs a').forEach(function(link){link.addEventListener('click',function(){$('game-picker').open=false;});});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&$('game-picker').open){$('game-picker').open=false;$('game-picker').querySelector('summary').focus();}});
  window.addEventListener('hashchange', route);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(sea); else window.addEventListener('resize', resize);

