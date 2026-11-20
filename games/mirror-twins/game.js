  /* ---------- Mirror Twins（鏡像雙子）: srcdoc 子頁；免費入場，本局每關第一次通過 BONUS +2 點，最多 10 點 ---------- */
  var MIRR={active:false,stake:0,earned:0,paid:{},cleared:0,analytics:null,loaded:false,msg:null},MIRR_LEVELS=10,MIRR_BONUS=2,MIRR_CAP=10;
  function mtL(s,p){var i=window.deepSeaI18n,en=!!(i&&i.getLanguage()==='en'),k=s.indexOf('|'),t=k<0?(en?i.text(s):s):(en?s.slice(k+1):s.slice(0,k));return p?t.replace(/\{(\w+)\}/g,function(_,n){return p[n]!=null?p[n]:'';}):t;}
  function mtSay(text,kind,params){MIRR.msg={text:text,kind:kind||'',params:params};var el=$('mt-msg');el.textContent=mtL(text,params);el.className='msg'+(kind?' '+kind:'');}
  function mtStored(){try{var u=JSON.parse(localStorage.getItem('mirrorTwins.unlocked'));u=Math.floor(Number(u)||1);return Math.max(0,Math.min(MIRR_LEVELS,u-1));}catch(_){return 0;}}
  function mtCleared(){try{var b=JSON.parse(localStorage.getItem('mirrorTwins.stars'))||{};return Object.keys(b).filter(function(k){return Number(b[k])>0;}).length;}catch(_){return mtStored();}}
  function mtUI(){
    $('mt-cleared').textContent=MIRR.cleared;$('mt-pay').textContent=MIRR.earned+' / '+MIRR_CAP;$('mt-best').textContent=Math.min(MIRR_LEVELS,mtCleared())+' / '+MIRR_LEVELS;
    $('mt-go').disabled=MIRR.active;$('mt-go').textContent=MIRR.active?'{{t:mirror-twins.msg.001}}':'{{t:mirror-twins.msg.002}}';$('mt-end').hidden=!MIRR.active;
  }
  function mtValid(source){return source===$('mt-frame').contentWindow;}
  window.deepSeaMirrorTwins={
    start:function(source){
      if(!mtValid(source)||$('view-mirror-twins').hidden||MIRR.active)return 0;
      if(ENTRY_FEE>S.balance){mtSay(LOW_MSG,'lose');return 0;}
      if(AN.interact)AN.interact();
      MIRR.active=true;MIRR.stake=ENTRY_FEE;MIRR.earned=0;MIRR.paid={};MIRR.cleared=0;MIRR.analytics=AN.start('mirror-twins',ENTRY_FEE);
      save();renderAll();mtUI();
      mtSay('{{tb:mirror-twins.say.003}}','',{fee:ENTRY_FEE});
      return true;
    },
    clear:function(source,level){
      if(!mtValid(source)||!MIRR.active)return 0;
      level=Math.floor(Number(level));if(!(level>=0&&level<MIRR_LEVELS))return 0;
      var got=0,repeat=!!MIRR.paid[level];MIRR.cleared++;
      if(!repeat&&MIRR.earned<MIRR_CAP){got=Math.min(MIRR_BONUS,MIRR_CAP-MIRR.earned);MIRR.paid[level]=true;MIRR.earned+=got;S.balance+=got;save();renderAll();}
      AN.progress(MIRR.analytics,{stage:level+1,step:MIRR.cleared,bonus_points:got,total_bonus_points:MIRR.earned});
      if(got)mtSay('{{tb:mirror-twins.say.004}}','win',{n:level+1,p:got,e:MIRR.earned});
      else if(repeat)mtSay('{{tb:mirror-twins.say.005}}','',{n:level+1});
      else mtSay('{{tb:mirror-twins.say.006}}','',{n:level+1});
      mtUI();return got;
    },
    pause:function(source){if(mtValid(source)&&MIRR.active)AN.progress(MIRR.analytics,{phase:'pause'},true);},
    resume:function(source){if(mtValid(source)&&MIRR.active)AN.resume(MIRR.analytics);},
    touch:function(source){if(mtValid(source)&&AN.interact)AN.interact();}
  };
  function mtFinish(){
    if(!MIRR.active)return;
    MIRR.active=false;MIRR.stake=0;AN.end(MIRR.analytics,MIRR.earned,'complete',{step:MIRR.cleared});MIRR.analytics=null;
    var w=$('mt-frame').contentWindow;if(w&&w.endMirrorPlatformRound)w.endMirrorPlatformRound();
    mtSay('{{tb:mirror-twins.say.007}}','',{c:MIRR.cleared,e:MIRR.earned});mtUI();
  }
  // 先於共用離頁處理結束，讓 abandoned 帶上已入帳的 BONUS
  window.addEventListener('pagehide',function(e){if(!e.persisted&&MIRR.active&&MIRR.analytics){AN.end(MIRR.analytics,MIRR.earned,'abandoned',{step:MIRR.cleared});MIRR.analytics=null;MIRR.active=false;MIRR.stake=0;}},true);
  function mtRoute(active){
    var frame=$('mt-frame');
    if(active&&!MIRR.loaded){MIRR.loaded=true;frame.onload=function(){if(frame.contentWindow&&frame.contentWindow.setMirrorPlatformActive)frame.contentWindow.setMirrorPlatformActive(!$('view-mirror-twins').hidden);};frame.srcdoc=JSON.parse($('mirror-twins-source').textContent);}
    if(frame.contentWindow&&frame.contentWindow.setMirrorPlatformActive)frame.contentWindow.setMirrorPlatformActive(active);
    if(active)mtUI();
  }
  $('mt-go').addEventListener('click',function(){
    var w=$('mt-frame').contentWindow;
    if(MIRR.active)return;
    if(!w||!w.startMirrorPlatformRound){mtSay('{{t:mirror-twins.msg.008}}','lose');return;}
    if(w.startMirrorPlatformRound())$('mt-frame').focus();
  });
  $('mt-end').addEventListener('click',mtFinish);
  window.addEventListener('arcade-languagechange',function(){if(MIRR.msg)mtSay(MIRR.msg.text,MIRR.msg.kind,MIRR.msg.params);});
  mtSay('{{tb:mirror-twins.say.009}}');
  mtUI();

