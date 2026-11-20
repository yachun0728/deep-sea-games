  /* ---------- Boba Straw: original isolated screen, fee-only shared wallet ---------- */
  var BOBA={active:false,fee:ENTRY_FEE,analytics:null,loaded:false};
  function bobaUI(text){$('boba-finish').disabled=!BOBA.active;if(text)$('boba-msg').textContent=text;}
  function bobaValid(source){return source===$('boba-frame').contentWindow;}
  window.deepSeaBoba={
    start:function(source){
      if(!bobaValid(source)||$('view-boba').hidden||BOBA.active)return false;
      if(S.balance<BOBA.fee){bobaUI(LOW_MSG);return false;}
      if(AN.interact)AN.interact();BOBA.active=true;BOBA.analytics=AN.start('boba',BOBA.fee);save();renderAll();bobaUI('{{t:boba.msg.001}}');return true;
    },
    finish:function(source,data){
      if(!bobaValid(source)||!BOBA.active)return;BOBA.active=false;
      var cups=Math.max(0,Math.min(1000000,Math.floor(Number(data.cups)||0)));
      AN.end(BOBA.analytics,0,'complete',{score:cups});bobaUI('本局完成 '+cups+' 杯。可再玩，遊玩獎勵依平台規則累積。');
    },
    progress:function(source,cups){if(bobaValid(source)&&BOBA.active)AN.progress(BOBA.analytics,{step:Math.max(0,Math.floor(Number(cups)||0))});},
    pause:function(source){if(bobaValid(source)&&BOBA.active)AN.progress(BOBA.analytics,{phase:'revive'},true);},
    resume:function(source){if(bobaValid(source)&&BOBA.active)AN.resume(BOBA.analytics);},
    touch:function(source){if(bobaValid(source)&&AN.interact)AN.interact();}
  };
  function bobaRoute(active){
    var frame=$('boba-frame');
    if(active&&!BOBA.loaded){BOBA.loaded=true;frame.onload=function(){if(frame.contentWindow&&frame.contentWindow.setBobaPlatformActive)frame.contentWindow.setBobaPlatformActive(!$('view-boba').hidden);};frame.srcdoc=JSON.parse($('boba-source').textContent);}
    if(frame.contentWindow&&frame.contentWindow.setBobaPlatformActive)frame.contentWindow.setBobaPlatformActive(active);
  }
  $('boba-finish').addEventListener('click',function(){var frame=$('boba-frame');if(BOBA.active&&frame.contentWindow&&frame.contentWindow.finishBobaPlatformRound)frame.contentWindow.finishBobaPlatformRound();});

