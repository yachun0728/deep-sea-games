  /* ---------- Shadow Relay（影子接力）: srcdoc 子頁；免費入場，本局每關第一次通過 BONUS +2 點，最多 10 點 ---------- */
  var SHAD={active:false,stake:0,earned:0,paid:{},cleared:0,analytics:null,loaded:false,msg:null},SHAD_LEVELS=8,SHAD_BONUS=2,SHAD_CAP=10;
  function srL(s,p){var i=window.deepSeaI18n,en=!!(i&&i.getLanguage()==='en'),k=s.indexOf('|'),t=k<0?(en?i.text(s):s):(en?s.slice(k+1):s.slice(0,k));return p?t.replace(/\{(\w+)\}/g,function(_,n){return p[n]!=null?p[n]:'';}):t;}
  function srSay(text,kind,params){SHAD.msg={text:text,kind:kind||'',params:params};var el=$('sr-msg');el.textContent=srL(text,params);el.className='msg'+(kind?' '+kind:'');}
  function srStored(){try{var u=JSON.parse(localStorage.getItem('shadowRelay.unlocked'));u=Math.floor(Number(u)||1);return Math.max(0,Math.min(SHAD_LEVELS,u-1));}catch(_){return 0;}}
  function srCleared(){try{var b=JSON.parse(localStorage.getItem('shadowRelay.bests'))||{};return Object.keys(b).filter(function(k){return isFinite(Number(b[k]));}).length;}catch(_){return srStored();}}
  function srUI(){
    $('sr-cleared').textContent=SHAD.cleared;$('sr-pay').textContent=SHAD.earned+' / '+SHAD_CAP;$('sr-best').textContent=Math.min(SHAD_LEVELS,srCleared())+' / '+SHAD_LEVELS;
    $('sr-go').disabled=SHAD.active;$('sr-go').textContent=SHAD.active?'{{t:shadow-relay.msg.001}}':'{{t:shadow-relay.msg.002}}';$('sr-end').hidden=!SHAD.active;
  }
  function srValid(source){return source===$('sr-frame').contentWindow;}
  window.deepSeaShadowRelay={
    start:function(source){
      if(!srValid(source)||$('view-shadow-relay').hidden||SHAD.active)return 0;
      if(ENTRY_FEE>S.balance){srSay(LOW_MSG,'lose');return 0;}
      if(AN.interact)AN.interact();
      SHAD.active=true;SHAD.stake=ENTRY_FEE;SHAD.earned=0;SHAD.paid={};SHAD.cleared=0;SHAD.analytics=AN.start('shadow-relay',ENTRY_FEE);
      save();renderAll();srUI();
      srSay('{{tb:shadow-relay.say.003}}','',{fee:ENTRY_FEE});
      return true;
    },
    clear:function(source,level){
      if(!srValid(source)||!SHAD.active)return 0;
      level=Math.floor(Number(level));if(!(level>=0&&level<SHAD_LEVELS))return 0;
      var got=0,repeat=!!SHAD.paid[level];SHAD.cleared++;
      if(!repeat&&SHAD.earned<SHAD_CAP){got=Math.min(SHAD_BONUS,SHAD_CAP-SHAD.earned);SHAD.paid[level]=true;SHAD.earned+=got;S.balance+=got;save();renderAll();}
      AN.progress(SHAD.analytics,{stage:level+1,step:SHAD.cleared,bonus_points:got,total_bonus_points:SHAD.earned});
      if(got)srSay('{{tb:shadow-relay.say.004}}','win',{n:level+1,p:got,e:SHAD.earned});
      else if(repeat)srSay('{{tb:shadow-relay.say.005}}','',{n:level+1});
      else srSay('{{tb:shadow-relay.say.006}}','',{n:level+1});
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
    srSay('{{tb:shadow-relay.say.007}}','',{c:SHAD.cleared,e:SHAD.earned});srUI();
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
    if(!w||!w.startShadowPlatformRound){srSay('{{t:shadow-relay.msg.008}}','lose');return;}
    if(w.startShadowPlatformRound())$('sr-frame').focus();
  });
  $('sr-end').addEventListener('click',srFinish);
  window.addEventListener('arcade-languagechange',function(){if(SHAD.msg)srSay(SHAD.msg.text,SHAD.msg.kind,SHAD.msg.params);});
  srSay('{{tb:shadow-relay.say.009}}');
  srUI();

