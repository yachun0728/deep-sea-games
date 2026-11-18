  /* ---------- Noodle Pancake: isolated iframe page (games/pancake/original.html), fee-only shared wallet ---------- */
  var PANCAKE={active:false,fee:ENTRY_FEE,analytics:null,loaded:false,extra:0,free:false};
  var PANCAKE_FREE_KEY='deep-sea-free-until'; // 看完示範廣告後的免免費截止時間（毫秒），只有泡麵煎餅讀取
  function pancakeFreeLeft(){try{var t=Number(localStorage.getItem(PANCAKE_FREE_KEY));return isFinite(t)?Math.max(0,t-Date.now()):0;}catch(e){return 0;}}
  function pancakeUI(text){$('pancake-finish').disabled=!PANCAKE.active;if(text)$('pancake-msg').textContent=text;}
  function pancakeValid(source){return source===$('pancake-frame').contentWindow;}
  window.deepSeaPancake={
    balance:function(){return S.balance;},
    start:function(source){
      if(!pancakeValid(source)||$('view-pancake').hidden||PANCAKE.active)return false;
      var free=true,fee=0;
      if(S.balance<fee){pancakeUI(LOW_MSG);return false;}
      if(AN.interact)AN.interact();
      PANCAKE.active=true;PANCAKE.extra=0;PANCAKE.free=free;
      PANCAKE.analytics=AN.start('pancake',fee,free?{entry_kind:'free_pass'}:undefined);
      if(fee){save();renderAll();}
      pancakeUI('泡麵已補給。');return true;
    },
    spend:function(source,n){
      n=Math.floor(Number(n)||0);
      if(!pancakeValid(source)||!PANCAKE.active||n<0)return false;

      AN.progress(PANCAKE.analytics,{phase:'free_noodles',extra_points:0});
      pancakeUI('已補充泡麵。');return true;
    },
    finish:function(source,data){
      if(!pancakeValid(source)||!PANCAKE.active)return;PANCAKE.active=false;
      var served=Math.max(0,Math.min(1000,Math.floor(Number(data&&data.served)||0)));
      AN.end(PANCAKE.analytics,0,'complete',{score:served,cleared:data&&data.passed?1:0,extra_spent_points:PANCAKE.extra});
      pancakeUI('本局煎好 '+served+' 片，可再玩。');
    },
    progress:function(source,served){if(pancakeValid(source)&&PANCAKE.active)AN.progress(PANCAKE.analytics,{step:Math.max(0,Math.floor(Number(served)||0))});},
    pause:function(source){if(pancakeValid(source)&&PANCAKE.active)AN.progress(PANCAKE.analytics,{phase:'revive'},true);},
    resume:function(source){if(pancakeValid(source)&&PANCAKE.active)AN.resume(PANCAKE.analytics);},
    touch:function(source){if(pancakeValid(source)&&AN.interact)AN.interact();}
  };
  function pancakeRoute(active){
    var frame=$('pancake-frame');
    if(active&&!PANCAKE.loaded){PANCAKE.loaded=true;frame.onload=function(){if(frame.contentWindow&&frame.contentWindow.setPancakePlatformActive)frame.contentWindow.setPancakePlatformActive(!$('view-pancake').hidden);};frame.src='games/pancake/original.html';}
    if(frame.contentWindow&&frame.contentWindow.setPancakePlatformActive)frame.contentWindow.setPancakePlatformActive(active);
  }
  $('pancake-finish').addEventListener('click',function(){var frame=$('pancake-frame');if(PANCAKE.active&&frame.contentWindow&&frame.contentWindow.finishPancakePlatformRound)frame.contentWindow.finishPancakePlatformRound();});
