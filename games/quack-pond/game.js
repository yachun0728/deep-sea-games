  /* ---------- Quack Pond（呱呱池塘）: srcdoc 子頁；免費入場，沒有 BONUS；關卡與星星只是成績，不換點數 ---------- */
  var QP={active:false,level:1,ducks:0,analytics:null,loaded:false,msg:null,total:200};
  function qpL(s,p){var i=window.deepSeaI18n,en=!!(i&&i.getLanguage()==='en'),k=s.indexOf('|'),t=k<0?(en?i.text(s):s):(en?s.slice(k+1):s.slice(0,k));return p?t.replace(/\{(\w+)\}/g,function(_,n){return p[n]!=null?p[n]:'';}):t;}
  function qpSay(text,kind,params){QP.msg={text:text,kind:kind||'',params:params};var el=$('qp-msg');el.textContent=qpL(text,params);el.className='msg'+(kind?' '+kind:'');}
  function qpStored(){try{var p=JSON.parse(localStorage.getItem('qp_progress'))||{},s=p.stars||{},k=Object.keys(s),n=0,t=0;k.forEach(function(x){var v=Math.max(0,Math.min(3,Math.floor(Number(s[x])||0)));if(v>0){n++;t+=v;}});return{cleared:n,stars:t};}catch(_){return{cleared:0,stars:0};}}
  function qpUI(){
    var st=qpStored();
    $('qp-level').textContent=QP.level+' / '+QP.total;$('qp-cleared').textContent=st.cleared+' / '+QP.total;$('qp-stars').textContent=st.stars+' / '+(QP.total*3);
  }
  function qpValid(source){return source===$('qp-frame').contentWindow;}
  window.deepSeaQuackPond={
    start:function(source,data){
      if(!qpValid(source)||$('view-quack-pond').hidden||QP.active)return 0;
      if(ENTRY_FEE>S.balance){qpSay(LOW_MSG,'lose');return 0;}
      if(AN.interact)AN.interact();
      QP.active=true;QP.level=Math.max(1,Math.min(QP.total,Math.floor(Number(data&&data.level)||1)));QP.ducks=0;QP.analytics=AN.start('quack-pond',ENTRY_FEE);
      save();renderAll();qpUI();
      qpSay('第 {lv} 關開始，每行、每列、每個顏色區域各放一隻鴨子。|Level {lv} started: one duck in every row, column and colour region.','',{lv:QP.level});
      return true;
    },
    progress:function(source,level,ducks){
      if(!qpValid(source)||!QP.active)return;
      QP.ducks=Math.max(0,Math.floor(Number(ducks)||0));
      AN.progress(QP.analytics,{stage:Math.max(1,Math.floor(Number(level)||QP.level)),step:QP.ducks});
    },
    finish:function(source,data){
      if(!qpValid(source)||!QP.active)return 0;
      var result=data&&data.result,level=Math.max(1,Math.min(QP.total,Math.floor(Number(data&&data.level)||QP.level))),stars=Math.max(0,Math.min(3,Math.floor(Number(data&&data.stars)||0)));
      QP.active=false;QP.level=level;
      if(result==='win'){
        AN.end(QP.analytics,0,'complete',{score:level,step:stars});
        qpSay('第 {lv} 關過關，拿到 {st} 顆星。|Level {lv} cleared with {st} star(s).','win',{lv:level,st:stars});
      }else if(result==='loss'){
        AN.end(QP.analytics,0,'loss',{score:level,step:QP.ducks});
        qpSay('第 {lv} 關失敗，愛心用完了。再想想哪一格才是對的。|Level {lv} failed: out of hearts. Think about which cell is really safe.','lose',{lv:level});
      }else{
        AN.end(QP.analytics,0,'abandoned',{score:level,step:QP.ducks});
      }
      QP.analytics=null;qpUI();return 0;
    },
    pause:function(source){if(qpValid(source)&&QP.active)AN.progress(QP.analytics,{phase:'pause'},true);},
    resume:function(source){if(qpValid(source)&&QP.active)AN.resume(QP.analytics);},
    touch:function(source){if(qpValid(source)&&AN.interact)AN.interact();}
  };
  // 先於共用離頁處理結束，讓 abandoned 帶上已有的進度
  window.addEventListener('pagehide',function(e){if(!e.persisted&&QP.active&&QP.analytics){AN.end(QP.analytics,0,'abandoned',{score:QP.level,step:QP.ducks});QP.analytics=null;QP.active=false;}},true);
  function qpRoute(active){
    var frame=$('qp-frame');
    if(active&&!QP.loaded){QP.loaded=true;frame.onload=function(){if(frame.contentWindow&&frame.contentWindow.setQuackPlatformActive)frame.contentWindow.setQuackPlatformActive(!$('view-quack-pond').hidden);};frame.srcdoc=JSON.parse($('quack-pond-source').textContent);}
    if(frame.contentWindow&&frame.contentWindow.setQuackPlatformActive)frame.contentWindow.setQuackPlatformActive(active);
    if(active)qpUI();
  }
  $('qp-go').addEventListener('click',function(){
    var w=$('qp-frame').contentWindow;
    if(!w||!w.startQuackPlatformRound){qpSay('遊戲畫面還在載入，請稍候再試。','lose');return;}
    if(w.startQuackPlatformRound())$('qp-frame').focus();
  });
  window.addEventListener('arcade-languagechange',function(){if(QP.msg)qpSay(QP.msg.text,QP.msg.kind,QP.msg.params);});
  qpSay('在左側選關或直接開始；點空格標 ✕，再點放鴨子。|Pick a level on the left or just start: tap a cell for ✕, tap again for a duck.');
  qpUI();
