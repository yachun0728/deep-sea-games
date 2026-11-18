
  /* ---------- Roar Through the Ceiling (rocket-chair): isolated iframe page (games/rocket-chair/original.html), fee-only shared wallet ---------- */
  var ROCKET={active:false,fee:ENTRY_FEE,analytics:null,loaded:false,extra:0};
  var ROCKET_FREE_KEY='deep-sea-free-until'; // 看完示範廣告後的免免費截止時間（毫秒）
  function rocketFreeLeft(){try{var t=Number(localStorage.getItem(ROCKET_FREE_KEY));return isFinite(t)?Math.max(0,t-Date.now()):0;}catch(e){return 0;}}
  function rocketUI(text){if(text)$('rocket-chair-msg').textContent=text;}
  function rocketValid(source){return source===$('rocket-chair-frame').contentWindow;}
  window.deepSeaRocket={
    balance:function(){return S.balance;},
    start:function(source){
      if(!rocketValid(source)||$('view-rocket-chair').hidden||ROCKET.active)return false;
      var free=true,fee=0;
      if(S.balance<fee){rocketUI(LOW_MSG);return false;}
      if(AN.interact)AN.interact();
      ROCKET.active=true;ROCKET.extra=0;
      ROCKET.analytics=AN.start('rocket-chair',fee,free?{entry_kind:'free_pass'}:undefined);

      rocketUI('可用點數購買咖啡補給。');return true;
    },
    spend:function(source,n){
      n=Math.floor(Number(n)||0);
      if(!rocketValid(source)||!ROCKET.active||n<0)return false;

      AN.progress(ROCKET.analytics,{phase:'free_coffee',extra_points:0});
      rocketUI('已補充咖啡。');return true;
    },
    finish:function(source,data){
      if(!rocketValid(source)||!ROCKET.active)return;ROCKET.active=false;
      var early=Math.max(0,Math.min(600,Math.floor(Number(data&&data.early)||0)));
      AN.end(ROCKET.analytics,0,'complete',{score:early,cleared:data&&data.cleared?1:0,extra_spent_points:ROCKET.extra});
      rocketUI(data&&data.cleared?'提早 '+early+' 分鐘下班，可再玩。':'這局加班了，可再玩。');
    },
    touch:function(source){if(rocketValid(source)&&AN.interact)AN.interact();}
  };
  function rocketRoute(active){
    var frame=$('rocket-chair-frame');
    if(active&&!ROCKET.loaded){ROCKET.loaded=true;frame.src='games/rocket-chair/original.html';}
    if(frame.contentWindow&&frame.contentWindow.setRocketPlatformActive)frame.contentWindow.setRocketPlatformActive(active);
  }
