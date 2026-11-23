  /* ---------- 萌獸破城隊 Critter Crashers：srcdoc 子頁；免費，沒有 BONUS；關卡與星星只是成績，不換點數 ---------- */
  // 一局 = 同一關裡的一段遊玩：子頁第一次編排或出擊時開始，攻破城門 complete、換關 cancelled、離頁 abandoned；失敗與撤退只記進度。
  var SA={active:false,level:1,attempts:0,analytics:null,loaded:false,msg:null,total:20};
  function saL(s,p){var i=window.deepSeaI18n,en=!!(i&&i.getLanguage()==='en'),k=s.indexOf('|'),t=k<0?(en?i.text(s):s):(en?s.slice(k+1):s.slice(0,k));return p?t.replace(/\{(\w+)\}/g,function(_,n){return p[n]!=null?p[n]:'';}):t;}
  function saSay(text,kind,params){SA.msg={text:text,kind:kind||'',params:params};var el=$('sa-msg');el.textContent=saL(text,params);el.className='msg'+(kind?' '+kind:'');}
  function saStored(){
    var cleared=0,stars=0,level=1;
    try{var s=JSON.parse(localStorage.getItem('siegeArch.stars'))||{};Object.keys(s).forEach(function(k){var v=Math.max(0,Math.min(3,Math.floor(Number(s[k])||0)));if(v>0){cleared++;stars+=v;}});}catch(_){}
    try{level=Math.max(1,Math.min(SA.total,Math.floor(Number(JSON.parse(localStorage.getItem('siegeArch.level')))||0)+1));}catch(_){}
    return{cleared:Math.min(cleared,SA.total),stars:Math.min(stars,SA.total*3),level:level};
  }
  function saUI(){
    var st=saStored(),level=SA.active?SA.level:st.level;
    $('sa-level').textContent=level+' / '+SA.total;$('sa-cleared').textContent=st.cleared+' / '+SA.total;$('sa-stars').textContent=st.stars+' / '+(SA.total*3);
  }
  function saValid(source){return source===$('sa-frame').contentWindow;}
  function saLevel(data){return Math.max(1,Math.min(SA.total,Math.floor(Number(data&&data.level)||SA.level)));}
  window.deepSeaSiege={
    start:function(source,data){
      if(!saValid(source)||$('view-siege-architect').hidden||SA.active)return false;
      if(ENTRY_FEE>S.balance){saSay(LOW_MSG,'lose');return false;}
      if(AN.interact)AN.interact();
      SA.active=true;SA.level=saLevel(data);SA.attempts=0;SA.analytics=AN.start('siege-architect',ENTRY_FEE);
      save();renderAll();saUI();
      saSay('{{tb:siege-architect.say.001}}','',{lv:SA.level});
      return true;
    },
    progress:function(source,data){
      if(!saValid(source)||!SA.active)return;
      SA.attempts=Math.max(0,Math.floor(Number(data&&data.attempts)||0));
      AN.progress(SA.analytics,{stage:SA.level,step:SA.attempts});
      saSay('{{tb:siege-architect.say.003}}','',{lv:SA.level,n:SA.attempts});
    },
    finish:function(source,data){
      if(!saValid(source)||!SA.active)return;
      var result=data&&data.result,level=saLevel(data),stars=Math.max(0,Math.min(3,Math.floor(Number(data&&data.stars)||0)));
      SA.attempts=Math.max(SA.attempts,Math.floor(Number(data&&data.attempts)||0));
      SA.active=false;SA.level=level;
      if(result==='win'){
        var plan=Array.isArray(data.plan)?data.plan.map(function(v){return Math.floor(Number(v)||0);}):[];
        AN.end(SA.analytics,0,'complete',{score:level,step:stars});
        saSay('{{tb:siege-architect.say.002}}','win',{lv:level,st:stars});
        import('./frontend/services/api.mjs').then(function(api){return api.submitPuzzleSolution('siege-architect',[level].concat(plan));})
          .catch(function(){saSay('{{tb:siege-architect.say.005}}','lose');});
      }else{
        AN.end(SA.analytics,0,'cancelled',{score:level,step:SA.attempts});
      }
      SA.analytics=null;saUI();
    },
    pause:function(source){if(saValid(source)&&SA.active)AN.progress(SA.analytics,{phase:'pause'},true);},
    resume:function(source){if(saValid(source)&&SA.active)AN.resume(SA.analytics);},
    touch:function(source){if(saValid(source)&&AN.interact)AN.interact();},
    level:function(source){if(saValid(source))saUI();}
  };
  // 先於共用離頁處理結束，讓 abandoned 帶上已有的進度
  window.addEventListener('pagehide',function(e){if(!e.persisted&&SA.active&&SA.analytics){AN.end(SA.analytics,0,'abandoned',{score:SA.level,step:SA.attempts});SA.analytics=null;SA.active=false;}},true);
  function saRoute(active){
    var frame=$('sa-frame');
    if(active&&!SA.loaded){SA.loaded=true;frame.onload=function(){if(frame.contentWindow&&frame.contentWindow.setSiegePlatformActive)frame.contentWindow.setSiegePlatformActive(!$('view-siege-architect').hidden);};frame.srcdoc=JSON.parse($('siege-architect-source').textContent);}
    if(frame.contentWindow&&frame.contentWindow.setSiegePlatformActive)frame.contentWindow.setSiegePlatformActive(active);
    if(active){saUI();if(!SA.active)saSay('{{tb:siege-architect.say.004}}');}
  }
  window.addEventListener('arcade-languagechange',function(){if(SA.msg)saSay(SA.msg.text,SA.msg.kind,SA.msg.params);});
  saSay('{{tb:siege-architect.say.004}}');
  saUI();
