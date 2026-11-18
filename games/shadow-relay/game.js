  /* ---------- Shadow Relay（影子接力）: srcdoc 子頁；免費入場，本局每關第一次通過 BONUS +2 點，最多 10 點 ---------- */
  var SHAD={active:false,stake:0,earned:0,paid:{},cleared:0,analytics:null,loaded:false,msg:null},SHAD_LEVELS=8,SHAD_BONUS=2,SHAD_CAP=10;
  function srL(s,p){var i=window.deepSeaI18n,en=!!(i&&i.getLanguage()==='en'),k=s.indexOf('|'),t=k<0?(en?i.text(s):s):(en?s.slice(k+1):s.slice(0,k));return p?t.replace(/\{(\w+)\}/g,function(_,n){return p[n]!=null?p[n]:'';}):t;}
  function srSay(text,kind,params){SHAD.msg={text:text,kind:kind||'',params:params};var el=$('sr-msg');el.textContent=srL(text,params);el.className='msg'+(kind?' '+kind:'');}
  function srStored(){try{var u=JSON.parse(localStorage.getItem('shadowRelay.unlocked'));u=Math.floor(Number(u)||1);return Math.max(0,Math.min(SHAD_LEVELS,u-1));}catch(_){return 0;}}
  function srCleared(){try{var b=JSON.parse(localStorage.getItem('shadowRelay.bests'))||{};return Object.keys(b).filter(function(k){return isFinite(Number(b[k]));}).length;}catch(_){return srStored();}}
  function srUI(){
    $('sr-cleared').textContent=SHAD.cleared;$('sr-pay').textContent=SHAD.earned+' / '+SHAD_CAP;$('sr-best').textContent=Math.min(SHAD_LEVELS,srCleared())+' / '+SHAD_LEVELS;
    $('sr-go').disabled=SHAD.active;$('sr-go').textContent=SHAD.active?'本局進行中 · 在左側選關':'免費開始一局';$('sr-end').hidden=!SHAD.active;
  }
  function srValid(source){return source===$('sr-frame').contentWindow;}
  window.deepSeaShadowRelay={
    start:function(source){
      if(!srValid(source)||$('view-shadow-relay').hidden||SHAD.active)return 0;
      if(ENTRY_FEE>S.balance){srSay(LOW_MSG,'lose');return 0;}
      if(AN.interact)AN.interact();
      SHAD.active=true;SHAD.stake=ENTRY_FEE;SHAD.earned=0;SHAD.paid={};SHAD.cleared=0;SHAD.analytics=AN.start('shadow-relay',ENTRY_FEE);
      save();renderAll();srUI();
      srSay('免費遊玩，本局開始。在左側選一關；每關第一次通過 BONUS +2 點，最多 10 點。|Free play, round started. Pick a stage on the left; each stage’s first clear gives a +2 pt BONUS, up to 10 pts.','',{fee:ENTRY_FEE});
      return true;
    },
    clear:function(source,level){
      if(!srValid(source)||!SHAD.active)return 0;
      level=Math.floor(Number(level));if(!(level>=0&&level<SHAD_LEVELS))return 0;
      var got=0,repeat=!!SHAD.paid[level];SHAD.cleared++;
      if(!repeat&&SHAD.earned<SHAD_CAP){got=Math.min(SHAD_BONUS,SHAD_CAP-SHAD.earned);SHAD.paid[level]=true;SHAD.earned+=got;S.balance+=got;save();renderAll();}
      AN.progress(SHAD.analytics,{stage:level+1,step:SHAD.cleared,bonus_points:got,total_bonus_points:SHAD.earned});
      if(got)srSay('第 {n} 關通過，BONUS +{p} 點已入帳（本局 {e} / 10）。|Stage {n} cleared: +{p} BONUS pts added ({e} / 10 this round).','win',{n:level+1,p:got,e:SHAD.earned});
      else if(repeat)srSay('第 {n} 關通過。這關本局已經領過 BONUS，換一關試試。|Stage {n} cleared. You already got this stage’s BONUS this round; try another stage.','',{n:level+1});
      else srSay('第 {n} 關通過。本局 BONUS 已達上限 10 點，可以繼續挑戰最佳時間。|Stage {n} cleared. This round’s BONUS is maxed at 10 pts; keep going for best times.','',{n:level+1});
      srUI();return got;
    },
    pause:function(source){if(srValid(source)&&SHAD.active)AN.progress(SHAD.analytics,{phase:'pause'},true);},
    resume:function(source){if(srValid(source)&&SHAD.active)AN.resume(SHAD.analytics);},
    touch:function(source){if(srValid(source)&&AN.interact)AN.interact();}
  };
  function srFinish(){
    if(!SHAD.active)return;
    SHAD.active=false;SHAD.stake=0;AN.end(SHAD.analytics,SHAD.earned,'complete',{step:SHAD.cleared});SHAD.analytics=null;
    var w=$('sr-frame').contentWindow;if(w&&w.endShadowPlatformRound)w.endShadowPlatformRound();
    srSay('本局結束：通過 {c} 次，BONUS 共 {e} 點。|Round over: {c} clears, {e} BONUS pts in total.','',{c:SHAD.cleared,e:SHAD.earned});srUI();
  }
  // 先於共用離頁處理結束，讓 abandoned 帶上已入帳的 BONUS
  window.addEventListener('pagehide',function(e){if(!e.persisted&&SHAD.active&&SHAD.analytics){AN.end(SHAD.analytics,SHAD.earned,'abandoned',{step:SHAD.cleared});SHAD.analytics=null;SHAD.active=false;SHAD.stake=0;}},true);
  function srRoute(active){
    var frame=$('sr-frame');
    if(active&&!SHAD.loaded){SHAD.loaded=true;frame.onload=function(){if(frame.contentWindow&&frame.contentWindow.setShadowPlatformActive)frame.contentWindow.setShadowPlatformActive(!$('view-shadow-relay').hidden);};frame.srcdoc=JSON.parse($('shadow-relay-source').textContent);}
    if(frame.contentWindow&&frame.contentWindow.setShadowPlatformActive)frame.contentWindow.setShadowPlatformActive(active);
    if(active)srUI();
  }
  $('sr-go').addEventListener('click',function(){
    var w=$('sr-frame').contentWindow;
    if(SHAD.active)return;
    if(!w||!w.startShadowPlatformRound){srSay('遊戲畫面還在載入，請稍候再試。','lose');return;}
    if(w.startShadowPlatformRound())$('sr-frame').focus();
  });
  $('sr-end').addEventListener('click',srFinish);
  window.addEventListener('arcade-languagechange',function(){if(SHAD.msg)srSay(SHAD.msg.text,SHAD.msg.kind,SHAD.msg.params);});
  srSay('每局免費。按「免費開始一局」或直接在左側點一關開始。|Each round costs a fixed 10 pts. Press “Pay & start a round” or just pick a stage on the left.');
  srUI();

