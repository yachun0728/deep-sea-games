
(function(w,d){
  'use strict';
  var ID='G-B5PKZSCCEQ';
  var local=/^(localhost|127\.0\.0\.1|\[::1\])$/.test(w.location.hostname)||w.location.protocol==='file:';
  var debug=new URLSearchParams(w.location.search).get('analytics_debug')==='1';
  w.dataLayer=w.dataLayer||[];
  w.gtag=w.gtag||function(){w.dataLayer.push(arguments);};
  // Local file previews queue no tracking requests; published HTTPS pages use one Google tag.
  if(!local){
    w.gtag('js',new Date());
    w.gtag('config',ID,{allow_google_signals:false,allow_ad_personalization_signals:false,debug_mode:debug});
    var tag=d.createElement('script');tag.async=true;tag.src='https://www.googletagmanager.com/gtag/js?id='+ID;d.head.appendChild(tag);
  }
  var names={blaster:'深海火線',crash:'壓潰深度',mines:'水雷區',plinko:'落珠',merge:'養珠',dice:'測深',limbo:'探底',hilo:'漲退',keno:'撒網',wheel:'羅盤',tower:'浮升',crossing:'橫渡',dream:'時序修復',runner:'閃避跑酷',elevator:'插隊大師',sneak:'偷偷下班',fishing:'深海釣手',boba:'插珍奶',campaign:'宣傳車',cat:'屋頂貓貓',bird:'便便鳥大戰狼群',reaper:'死神打工',dive:'一口氣探險',mrt:'捷運搶位',pancake:'泡麵煎餅翻面'};
  var rounds={},current='',seq=0,bucket=0,last=performance.now(),inputAt=last,visible=!d.hidden,focused=d.hasFocus?d.hasFocus():true,suspended=false;
  var tabToken=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
  function emit(event,game,params){
    if(local)return;
    try{var data=Object.assign({send_to:ID,game_id:game||'platform',game_name:names[game]||'遊戲平台',app_version:'analytics-v1'},params||{});w.gtag('event',event,data);}catch(_){}
  }
  function tick(now){
    var delta=Math.max(0,Math.min(now,inputAt+60000)-last);last=now;
    if(suspended||!visible||!focused||!current||delta<=0)return;
    var any=false;Object.keys(rounds).forEach(function(id){var r=rounds[id];if(r.game===current&&r.engaged){r.activeMs+=delta;any=true;}});
    if(any)bucket+=delta;
  }
  function flush(){if(bucket>0){emit('game_active_time',current,{active_seconds:Math.round(bucket)/1000});bucket=0;}}
  function start(game,stake,params){
    tick(performance.now());inputAt=performance.now();
    var id=tabToken+'-'+(++seq),p=params||{};
    rounds[id]={game:game,stake:stake,engaged:true,activeMs:0,started:performance.now(),stage:p.stage||1,step:p.step||0};
    emit('game_start',game,Object.assign({round_id:id,entry_points:stake,stage:1},p));return id;
  }
  function progress(id,params,pause){
    var r=rounds[id];if(!r)return;tick(performance.now());var p=params||{};
    if(p.stage!==undefined)r.stage=p.stage;if(p.step!==undefined)r.step=p.step;
    emit('game_progress',r.game,Object.assign({round_id:id,stage:r.stage,step:r.step,checkpoint:pause?1:0},p));
    if(pause){flush();r.engaged=false;}
  }
  function resume(id,params){var r=rounds[id];if(!r)return;tick(performance.now());inputAt=performance.now();r.engaged=true;var p=params||{};if(p.stage!==undefined)r.stage=p.stage;if(p.step!==undefined)r.step=p.step;emit('game_resume',r.game,Object.assign({round_id:id,stage:r.stage,step:r.step},p));}
  function end(id,payout,result,params){
    var r=rounds[id];if(!r)return;tick(performance.now());flush();delete rounds[id];
    emit('game_end',r.game,Object.assign({round_id:id,stage:r.stage,step:r.step,result:result,stake_points:r.stake,payout_points:payout,net_points:payout-r.stake,round_active_seconds:Math.round(r.activeMs)/1000,round_elapsed_seconds:Math.round(performance.now()-r.started)/1000},params||{}));
  }
  function view(game){if(game==='lobby'){tick(performance.now());flush();current='';emit('lobby_view','');return;}if(!names[game]||game===current)return;tick(performance.now());flush();current=game;emit('game_view',game);}
  function interaction(){tick(performance.now());inputAt=performance.now();focused=d.hasFocus?d.hasFocus():true;}
  ['pointerdown','keydown','touchstart'].forEach(function(type){d.addEventListener(type,interaction,{capture:true,passive:true});});
  d.addEventListener('visibilitychange',function(){tick(performance.now());flush();visible=!d.hidden;if(visible)inputAt=performance.now();});
  w.addEventListener('blur',function(){tick(performance.now());flush();focused=false;});
  w.addEventListener('focus',function(){tick(performance.now());focused=true;inputAt=performance.now();});
  w.addEventListener('pagehide',function(e){tick(performance.now());flush();suspended=true;if(!e.persisted)Object.keys(rounds).forEach(function(id){end(id,0,'abandoned');});});
  w.addEventListener('pageshow',function(){last=performance.now();suspended=false;visible=!d.hidden;focused=d.hasFocus?d.hasFocus():true;inputAt=last;});
  setInterval(function(){tick(performance.now());flush();},15000);
  w.deepSeaAnalytics={start:start,progress:progress,resume:resume,end:end,view:view,interact:interaction,points:function(amount){emit('points_reset',current,{granted_points:amount});}};
})(window,document);

