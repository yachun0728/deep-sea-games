  /* ---------- One-Line Defense（一筆畫守城）: srcdoc 子頁；免費入場，每撐過 30 秒 BONUS +2 點，最多 10 點 ---------- */
  var ONEL={active:false,stake:0,earned:0,marks:{},score:0,time:0,analytics:null,loaded:false,msg:null},ONEL_BONUS=2,ONEL_MARKS=5,ONEL_EVERY=30;
  function olL(s,p){var i=window.deepSeaI18n,en=!!(i&&i.getLanguage()==='en'),k=s.indexOf('|'),t=k<0?(en?i.text(s):s):(en?s.slice(k+1):s.slice(0,k));return p?t.replace(/\{(\w+)\}/g,function(_,n){return p[n]!=null?p[n]:'';}):t;}
  function olSay(text,kind,params){ONEL.msg={text:text,kind:kind||'',params:params};var el=$('od-msg');el.textContent=olL(text,params);el.className='msg'+(kind?' '+kind:'');}
  function olBest(){try{return Math.max(0,Math.floor(Number(JSON.parse(localStorage.getItem('oneLine.best')))||0));}catch(_){return 0;}}
  function olUI(){
    $('od-score').textContent=fmt(ONEL.score);$('od-pay').textContent=ONEL.earned+' / '+ONEL_BONUS*ONEL_MARKS;$('od-best').textContent=fmt(olBest());
    $('od-go').disabled=ONEL.active;$('od-go').textContent=ONEL.active?'{{t:one-line-defense.msg.001}}':'{{t:one-line-defense.msg.002}}';
  }
  function olValid(source){return source===$('od-frame').contentWindow;}
  window.deepSeaOneLine={
    start:function(source){
      if(!olValid(source)||$('view-one-line-defense').hidden||ONEL.active)return 0;
      if(ENTRY_FEE>S.balance){olSay(LOW_MSG,'lose');return 0;}
      if(AN.interact)AN.interact();
      ONEL.active=true;ONEL.stake=ENTRY_FEE;ONEL.earned=0;ONEL.marks={};ONEL.score=0;ONEL.time=0;ONEL.analytics=AN.start('one-line-defense',ENTRY_FEE);
      save();renderAll();olUI();
      olSay('{{tb:one-line-defense.say.003}}','',{fee:ENTRY_FEE});
      return true;
    },
    bonus:function(source,mark){
      if(!olValid(source)||!ONEL.active)return 0;
      mark=Math.floor(Number(mark));if(!(mark>=1&&mark<=ONEL_MARKS)||ONEL.marks[mark])return 0;
      ONEL.marks[mark]=true;ONEL.earned+=ONEL_BONUS;S.balance+=ONEL_BONUS;save();renderAll();
      AN.progress(ONEL.analytics,{stage:mark,step:mark*ONEL_EVERY,bonus_points:ONEL_BONUS,total_bonus_points:ONEL.earned});
      olSay('{{tb:one-line-defense.say.004}}','win',{s:mark*ONEL_EVERY,p:ONEL_BONUS,e:ONEL.earned});
      olUI();return ONEL_BONUS;
    },
    finish:function(source,data){
      if(!olValid(source)||!ONEL.active)return 0;
      var score=Math.max(0,Math.floor(Number(data&&data.score)||0)),time=Math.max(0,Math.floor(Number(data&&data.time)||0)),combo=Math.max(0,Math.floor(Number(data&&data.combo)||0));
      ONEL.active=false;ONEL.stake=0;ONEL.score=score;ONEL.time=time;
      AN.end(ONEL.analytics,ONEL.earned,ONEL.earned>0?'complete':'loss',{score:score,step:time,combo:combo});ONEL.analytics=null;
      olSay('{{tb:one-line-defense.say.005}}',ONEL.earned>0?'win':'lose',{sc:fmt(score),t:time,e:ONEL.earned});
      olUI();return 0;
    },
    pause:function(source){if(olValid(source)&&ONEL.active)AN.progress(ONEL.analytics,{phase:'pause'},true);},
    resume:function(source){if(olValid(source)&&ONEL.active)AN.resume(ONEL.analytics);},
    touch:function(source){if(olValid(source)&&AN.interact)AN.interact();}
  };
  // 先於共用離頁處理結束，讓 abandoned 帶上已入帳的 BONUS
  window.addEventListener('pagehide',function(e){if(!e.persisted&&ONEL.active&&ONEL.analytics){AN.end(ONEL.analytics,ONEL.earned,'abandoned',{score:ONEL.score});ONEL.analytics=null;ONEL.active=false;ONEL.stake=0;}},true);
  function olRoute(active){
    var frame=$('od-frame');
    if(active&&!ONEL.loaded){ONEL.loaded=true;frame.onload=function(){if(frame.contentWindow&&frame.contentWindow.setOneLinePlatformActive)frame.contentWindow.setOneLinePlatformActive(!$('view-one-line-defense').hidden);};frame.srcdoc=JSON.parse($('one-line-defense-source').textContent);}
    if(frame.contentWindow&&frame.contentWindow.setOneLinePlatformActive)frame.contentWindow.setOneLinePlatformActive(active);
    if(active)olUI();
  }
  $('od-go').addEventListener('click',function(){
    var w=$('od-frame').contentWindow;
    if(ONEL.active)return;
    if(!w||!w.startOneLinePlatformRound){olSay('{{t:one-line-defense.msg.006}}','lose');return;}
    if(w.startOneLinePlatformRound())$('od-frame').focus();
  });
  window.addEventListener('arcade-languagechange',function(){if(ONEL.msg)olSay(ONEL.msg.text,ONEL.msg.kind,ONEL.msg.params);});
  olSay('{{tb:one-line-defense.say.007}}');
  olUI();

