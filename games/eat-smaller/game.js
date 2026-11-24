  /* ---------- Number Gulp（數字吞噬）: srcdoc 子頁；免費入場，本局每關第一次通過 BONUS +2 點，最多 10 點 ---------- */
  var EATS={active:false,stake:0,earned:0,paid:{},cleared:0,analytics:null,loaded:false,msg:null},EATS_LEVELS=12,EATS_BONUS=2,EATS_CAP=10;
  function esL(s,p){var i=window.deepSeaI18n,en=!!(i&&i.getLanguage()==='en'),k=s.indexOf('|'),t=k<0?(en?i.text(s):s):(en?s.slice(k+1):s.slice(0,k));return p?t.replace(/\{(\w+)\}/g,function(_,n){return p[n]!=null?p[n]:'';}):t;}
  function esSay(text,kind,params){EATS.msg={text:text,kind:kind||'',params:params};var el=$('es-msg');el.textContent=esL(text,params);el.className='msg'+(kind?' '+kind:'');}
  function esStored(){try{var u=JSON.parse(localStorage.getItem('eatSmaller.unlocked'));u=Math.floor(Number(u)||1);return Math.max(0,Math.min(EATS_LEVELS,u-1));}catch(_){return 0;}}
  function esCleared(){try{var b=JSON.parse(localStorage.getItem('eatSmaller.bests'))||{};return Object.keys(b).filter(function(k){return isFinite(Number(b[k]));}).length;}catch(_){return esStored();}}
  function esUI(){
    $('es-cleared').textContent=EATS.cleared;$('es-pay').textContent=EATS.earned+' / '+EATS_CAP;$('es-best').textContent=Math.min(EATS_LEVELS,esCleared())+' / '+EATS_LEVELS;
    $('es-go').disabled=EATS.active;$('es-go').textContent=EATS.active?'{{t:eat-smaller.msg.001}}':'{{t:eat-smaller.msg.002}}';$('es-end').hidden=!EATS.active;
  }
  function esValid(source){return source===$('es-frame').contentWindow;}
  window.deepSeaEatSmaller={
    start:function(source){
      if(!esValid(source)||$('view-eat-smaller').hidden||EATS.active)return 0;
      if(ENTRY_FEE>S.balance){esSay(LOW_MSG,'lose');return 0;}
      if(AN.interact)AN.interact();
      EATS.active=true;EATS.stake=ENTRY_FEE;EATS.earned=0;EATS.paid={};EATS.cleared=0;EATS.analytics=AN.start('eat-smaller',ENTRY_FEE);
      save();renderAll();esUI();
      esSay('{{tb:eat-smaller.say.003}}','',{fee:ENTRY_FEE});
      return true;
    },
    clear:function(source,level){
      if(!esValid(source)||!EATS.active)return 0;
      level=Math.floor(Number(level));if(!(level>=0&&level<EATS_LEVELS))return 0;
      var got=0,repeat=!!EATS.paid[level];EATS.cleared++;
      if(!repeat&&EATS.earned<EATS_CAP){got=Math.min(EATS_BONUS,EATS_CAP-EATS.earned);EATS.paid[level]=true;EATS.earned+=got;S.balance+=got;save();renderAll();}
      AN.progress(EATS.analytics,{stage:level+1,step:EATS.cleared,bonus_points:got,total_bonus_points:EATS.earned});
      if(got)esSay('{{tb:eat-smaller.say.004}}','win',{n:level+1,p:got,e:EATS.earned});
      else if(repeat)esSay('{{tb:eat-smaller.say.005}}','',{n:level+1});
      else esSay('{{tb:eat-smaller.say.006}}','',{n:level+1});
      esUI();return got;
    },
    pause:function(source){if(esValid(source)&&EATS.active)AN.progress(EATS.analytics,{phase:'pause'},true);},
    resume:function(source){if(esValid(source)&&EATS.active)AN.resume(EATS.analytics);},
    touch:function(source){if(esValid(source)&&AN.interact)AN.interact();}
  };
  function esFinish(){
    if(!EATS.active)return;
    EATS.active=false;EATS.stake=0;AN.end(EATS.analytics,EATS.earned,'complete',{step:EATS.cleared});EATS.analytics=null;
    var w=$('es-frame').contentWindow;if(w&&w.endEatPlatformRound)w.endEatPlatformRound();
    esSay('{{tb:eat-smaller.say.007}}','',{c:EATS.cleared,e:EATS.earned});esUI();
  }
  // 先於共用離頁處理結束，讓 abandoned 帶上已入帳的 BONUS
  window.addEventListener('pagehide',function(e){if(!e.persisted&&EATS.active&&EATS.analytics){AN.end(EATS.analytics,EATS.earned,'abandoned',{step:EATS.cleared});EATS.analytics=null;EATS.active=false;EATS.stake=0;}},true);
  function esRoute(active){
    var frame=$('es-frame');
    if(active&&!EATS.loaded){EATS.loaded=true;frame.onload=function(){if(frame.contentWindow&&frame.contentWindow.setEatPlatformActive)frame.contentWindow.setEatPlatformActive(!$('view-eat-smaller').hidden);};frame.srcdoc=JSON.parse($('eat-smaller-source').textContent);}
    if(frame.contentWindow&&frame.contentWindow.setEatPlatformActive)frame.contentWindow.setEatPlatformActive(active);
    if(active)esUI();
  }
  $('es-go').addEventListener('click',function(){
    var w=$('es-frame').contentWindow;
    if(EATS.active)return;
    if(!w||!w.startEatPlatformRound){esSay('{{t:eat-smaller.msg.008}}','lose');return;}
    if(w.startEatPlatformRound())$('es-frame').focus();
  });
  $('es-end').addEventListener('click',esFinish);
  window.addEventListener('arcade-languagechange',function(){if(EATS.msg)esSay(EATS.msg.text,EATS.msg.kind,EATS.msg.params);});
  esSay('{{tb:eat-smaller.say.009}}');
  esUI();

