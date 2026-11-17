  /* ---------- One Breath Dive: original isolated screen; fixed entry fee, score and best record only (no points returned) ---------- */
  var DIVE={active:false,stake:0,score:0,depth:0,best:0,done:false,analytics:null,loaded:false};
  function diveSay(text,kind){var el=$('dv-msg');el.textContent=text;el.className='msg'+(kind?' '+kind:'');}
  function diveBest(){try{return Math.max(0,Math.floor(Number(localStorage.getItem('diveBestScore'))||0));}catch(_){return 0;}}
  function diveUI(){
    DIVE.best=Math.max(DIVE.best,diveBest());
    $('dv-score').textContent=fmt(DIVE.score)+' 分';$('dv-depth').textContent=DIVE.depth*10+' m';$('dv-best').textContent=fmt(DIVE.best)+' 分';
    $('dv-go').disabled=DIVE.active;
    $('dv-go').textContent=DIVE.active?'下潛中 · 在左側畫面操作':DIVE.done?'扣點再潛一次':'扣點開始下潛';
  }
  function diveValid(source){return source===$('dv-frame').contentWindow;}
  window.deepSeaDive={
    start:function(source){
      if(!diveValid(source)||$('view-dive').hidden||DIVE.active)return 0;
      var amount=ENTRY_FEE;
      if(amount>S.balance){diveSay(LOW_MSG,'lose');return 0;}
      if(AN.interact)AN.interact();
      DIVE.active=true;DIVE.stake=amount;DIVE.score=0;DIVE.depth=0;DIVE.done=false;DIVE.analytics=AN.start('dive',amount);S.balance-=amount;save();renderAll();diveUI();
      diveSay('已扣 '+fmt(amount)+' 點。在左側畫面挑路線往下潛，珍珠與深度累積成分數；沒有點數返還，只記錄成績。');
      return amount;
    },
    live:function(source,score,depth){
      if(!diveValid(source)||!DIVE.active)return;
      score=Number(score);DIVE.score=isFinite(score)?Math.max(0,Math.floor(score)):0;depth=Number(depth);DIVE.depth=isFinite(depth)?Math.max(0,Math.floor(depth)):DIVE.depth;diveUI();
    },
    finish:function(source,data){
      if(!diveValid(source)||!DIVE.active)return null;
      var score=Math.max(0,Math.floor(Number(data&&data.score)||0)),kind=String(data&&data.kind||''),depth=Math.max(0,Math.floor(Number(data&&data.depth)||0));
      DIVE.active=false;DIVE.done=true;DIVE.score=score;DIVE.depth=depth;diveUI();
      AN.end(DIVE.analytics,0,kind==='drown'?'loss':'complete',{score:score,depth:depth});
      diveSay(kind==='drown'?'氧氣耗盡，這一趟分數歸零。':'本局 '+fmt(score)+' 分，最深 '+depth*10+' m。',kind==='drown'?'lose':'win');
      return 0;
    },
    progress:function(source,depth){
      if(!diveValid(source)||!DIVE.active)return;
      var d=Math.max(0,Math.floor(Number(depth)||0));
      AN.progress(DIVE.analytics,{stage:d>=30?4:d>=20?3:d>=10?2:1,step:d});
    },
    touch:function(source){if(diveValid(source)&&AN.interact)AN.interact();}
  };
  function diveRoute(active){
    var frame=$('dv-frame');
    if(active&&!DIVE.loaded){DIVE.loaded=true;frame.onload=function(){if(frame.contentWindow&&frame.contentWindow.setDivePlatformActive)frame.contentWindow.setDivePlatformActive(!$('view-dive').hidden);};frame.srcdoc=JSON.parse($('dive-source').textContent);}
    if(frame.contentWindow&&frame.contentWindow.setDivePlatformActive)frame.contentWindow.setDivePlatformActive(active);
  }
  $('dv-go').addEventListener('click',function(){
    var w=$('dv-frame').contentWindow;
    if(DIVE.active)return;
    if(!w||!w.startDivePlatformRound){diveSay('遊戲畫面還在載入，請稍候再試。','lose');return;}
    w.startDivePlatformRound();
  });
  diveUI();

