  /* ---------- Block Drop（俄羅斯方塊）: srcdoc 子頁；免費入場，沒有 BONUS；分數與行數只是成績，不換點數 ---------- */
  var TET={active:false,score:0,lines:0,analytics:null,loaded:false,msg:null};
  var tetrisRank=timedLeaderboard('tetris','tt',blockDropRules.inputCount,ttUI);
  function ttL(s,p){var i=window.deepSeaI18n,en=!!(i&&i.getLanguage()==='en'),k=s.indexOf('|'),t=k<0?(en?i.text(s):s):(en?s.slice(k+1):s.slice(0,k));return p?t.replace(/\{(\w+)\}/g,function(_,n){return p[n]!=null?p[n]:'';}):t;}
  function ttSay(text,kind,params){TET.msg={text:text,kind:kind||'',params:params};var el=$('tt-msg');el.textContent=ttL(text,params);el.className='msg'+(kind?' '+kind:'');}
  function ttBest(){try{return Math.max(0,Math.floor(Number(localStorage.getItem('tetris-best'))||0));}catch(_){return 0;}}
  function ttUI(){
    $('tt-score').textContent=fmt(TET.score);$('tt-lines').textContent=TET.lines;$('tt-best').textContent=fmt(Math.max(ttBest(),TET.score));
    $('tt-go').disabled=TET.active||tetrisRank.busy();$('tt-go').textContent=TET.active?'{{t:tetris.msg.001}}':'{{t:tetris.msg.002}}';
  }
  function ttValid(source){return source===$('tt-frame').contentWindow;}
  window.deepSeaTetris={
    rules:blockDropRules,
    prepare:function(source,ready,cancel){
      if(!ttValid(source)||$('view-tetris').hidden||TET.active||tetrisRank.busy())return false;
      tetrisRank.start(ready,cancel);
      return true;
    },
    advance:function(source,dt,active,step){
      if(ttValid(source)&&TET.active)tetrisRank.update(dt,active,seconds=>step(seconds*1000));
    },
    record:function(source,code){
      if(ttValid(source)&&TET.active)tetrisRank.record(code);
    },
    start:function(source){
      if(!ttValid(source)||$('view-tetris').hidden||TET.active)return 0;
      if(ENTRY_FEE>S.balance){ttSay(LOW_MSG,'lose');return 0;}
      if(AN.interact)AN.interact();
      TET.active=true;TET.score=0;TET.lines=0;TET.analytics=AN.start('tetris',ENTRY_FEE);
      save();renderAll();ttUI();
      ttSay('{{tb:tetris.say.003}}');
      return true;
    },
    finish:function(source,data){
      if(!ttValid(source)||!TET.active)return 0;
      var score=Math.max(0,Math.floor(Number(data&&data.score)||0)),lines=Math.max(0,Math.floor(Number(data&&data.lines)||0)),level=Math.max(1,Math.floor(Number(data&&data.level)||1));
      TET.active=false;TET.score=score;TET.lines=lines;
      AN.end(TET.analytics,0,'complete',{score:score,step:lines,level:level});TET.analytics=null;
      ttSay('{{tb:tetris.say.004}}','',{sc:fmt(score),ln:lines,lv:level});
      tetrisRank.finish(score,data?.endedOnInput===true);ttUI();return 0;
    },
    pause:function(source){if(ttValid(source)&&TET.active)AN.progress(TET.analytics,{phase:'pause'},true);},
    resume:function(source){if(ttValid(source)&&TET.active)AN.resume(TET.analytics);},
    touch:function(source){if(ttValid(source)&&AN.interact)AN.interact();}
  };
  // 先於共用離頁處理結束，讓 abandoned 帶上已有的分數
  window.addEventListener('pagehide',function(e){if(!e.persisted&&TET.active&&TET.analytics){AN.end(TET.analytics,0,'abandoned',{score:TET.score});TET.analytics=null;TET.active=false;}},true);
  function ttRoute(active){
    var frame=$('tt-frame');
    if(active&&!TET.loaded){TET.loaded=true;frame.onload=function(){if(frame.contentWindow&&frame.contentWindow.setTetrisPlatformActive)frame.contentWindow.setTetrisPlatformActive(!$('view-tetris').hidden);};frame.srcdoc=JSON.parse($('tetris-source').textContent);}
    if(frame.contentWindow&&frame.contentWindow.setTetrisPlatformActive)frame.contentWindow.setTetrisPlatformActive(active);
    if(active)ttUI();
  }
  $('tt-go').addEventListener('click',function(){
    var w=$('tt-frame').contentWindow;
    if(TET.active)return;
    if(!w||!w.startTetrisPlatformRound){ttSay('{{t:tetris.msg.005}}','lose');return;}
    if(w.startTetrisPlatformRound())$('tt-frame').focus();
  });
  $('tt-exit').addEventListener('click',function(){window.location.hash='lobby';});
  window.addEventListener('arcade-languagechange',function(){if(TET.msg)ttSay(TET.msg.text,TET.msg.kind,TET.msg.params);});
  ttSay('{{tb:tetris.say.006}}');
  ttUI();
