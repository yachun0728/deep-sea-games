  /* Navigation uses separate DOM controls; game pointer listeners are untouched. */
  (function(){
    function scrollPad(){
      var pad=document.createElement('div');pad.className='mobile-scroll-pad';pad.textContent='{{t:mobile-navigation.msg.001}}';pad.setAttribute('role','note');return pad;
    }
    document.querySelectorAll('.view .console').forEach(function(console){
      var side=console.querySelector('.side');if(side)console.insertBefore(scrollPad(),side);
    });
    document.querySelectorAll('.view iframe').forEach(function(frame){
      var stage=frame.parentElement;
      if(stage&&!stage.closest('.console')&&stage.parentNode)stage.parentNode.insertBefore(scrollPad(),stage.nextSibling);
    });
    function jump(destination){
      var view=document.querySelector('.view:not([hidden])');
      if(!view||view.id==='view-lobby')return;
      var target;
      if(view.id==='view-mines'){
        target=view.querySelector(destination==='game'?'.mines-stage':'.mines-actions')||view;
      }else{
        target=destination==='game'
          ?view.querySelector('canvas,iframe,.mg')||view
          :view.querySelector('.side .go:not([hidden])')||view.querySelector('.side,.boba-platform-bar,.panel')||view;
      }
      if(typeof target.scrollIntoView!=='function')return;
      var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({behavior:reduced?'auto':'smooth',block:destination==='game'?'start':'center'});
    }
    document.getElementById('mobile-game').addEventListener('click',function(){jump('game');});
    document.getElementById('mobile-controls').addEventListener('click',function(){jump('controls');});
  })();
