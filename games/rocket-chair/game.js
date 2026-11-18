
  /* ---------- Roar Through the Ceiling (rocket-chair): isolated iframe page (games/rocket-chair/original.html), fee-only shared wallet ---------- */
  var ROCKET={active:false,fee:ENTRY_FEE,analytics:null,loaded:false,extra:0};
  var ROCKET_FREE_KEY='deep-sea-free-until'; // 看完示範廣告後的免扣點截止時間（毫秒）
  function rocketFreeLeft(){try{var t=Number(localStorage.getItem(ROCKET_FREE_KEY));return isFinite(t)?Math.max(0,t-Date.now()):0;}catch(e){return 0;}}
  function rocketUI(text){if(text)$('rocket-chair-msg').textContent=text;}
  function rocketValid(source){return source===$('rocket-chair-frame').contentWindow;}
  window.deepSeaRocket={
    balance:function(){return S.balance;},
    start:function(source){
      if(!rocketValid(source)||$('view-rocket-chair').hidden)return false;
      if(ROCKET.active)AN.end(ROCKET.analytics,0,'abandoned',{extra_spent_points:ROCKET.extra});
      ROCKET.active=false;
      var free=rocketFreeLeft()>0,fee=free?0:ROCKET.fee;
      if(S.balance<fee){rocketUI(LOW_MSG);return false;}
      if(AN.interact)AN.interact();
      ROCKET.active=true;ROCKET.extra=0;
      ROCKET.analytics=AN.start('rocket-chair',fee,free?{entry_kind:'free_pass'}:undefined);
      if(fee){S.balance-=fee;save();renderAll();}
      rocketUI(free?'看廣告的免扣點時間內，本局不扣點。':'已扣 '+fee+' 點。提早下班的分鐘數不換點數。');return true;
    },
    spend:function(source,n){
      n=Math.floor(Number(n)||0);
      if(!rocketValid(source)||!ROCKET.active||n<=0||S.balance<n)return false;
      S.balance-=n;ROCKET.extra+=n;save();renderAll();
      AN.progress(ROCKET.analytics,{phase:'buy_coffee',extra_points:n});
      rocketUI('已扣 '+n+' 點買特濃咖啡。');return true;
    },
    finish:function(source,data){
      if(!rocketValid(source)||!ROCKET.active)return;ROCKET.active=false;
      var early=Math.max(0,Math.min(600,Math.floor(Number(data&&data.early)||0)));
      AN.end(ROCKET.analytics,0,'complete',{score:early,cleared:data&&data.cleared?1:0,extra_spent_points:ROCKET.extra});
      rocketUI(data&&data.cleared?'提早 '+early+' 分鐘下班，沒有點數獎勵。再玩一次會重新扣 '+ROCKET.fee+' 點。':'這局加班了，沒有點數獎勵。再玩一次會重新扣 '+ROCKET.fee+' 點。');
    },
    touch:function(source){if(rocketValid(source)&&AN.interact)AN.interact();}
  };
  function rocketRoute(active){
    var frame=$('rocket-chair-frame');
    if(active&&!ROCKET.loaded){ROCKET.loaded=true;frame.src='games/rocket-chair/original.html';}
    if(frame.contentWindow&&frame.contentWindow.setRocketPlatformActive)frame.contentWindow.setRocketPlatformActive(active);
  }
