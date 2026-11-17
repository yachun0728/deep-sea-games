  /* Navigation uses separate DOM controls; game pointer listeners are untouched. */
  (function(){
    function jump(destination){
      var view=document.querySelector('.view:not([hidden])');
      if(!view||view.id==='view-lobby')return;
      var target=destination==='game'
        ?view.querySelector('canvas,iframe,.mg')||view
        :view.querySelector('.side .go:not([hidden])')||view.querySelector('.side,.boba-platform-bar,.panel')||view;
      if(typeof target.scrollIntoView!=='function')return;
      var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({behavior:reduced?'auto':'smooth',block:destination==='game'?'start':'center'});
    }
    document.getElementById('mobile-game').addEventListener('click',function(){jump('game');});
    document.getElementById('mobile-controls').addEventListener('click',function(){jump('controls');});
  })();
