  /* ---------- MRT Seat Grab: original isolated screen; fixed entry fee, seat tier and best record only (no points returned) ---------- */
  var MRT={active:false,stake:0,tier:0,best:0,done:false,analytics:null,loaded:false,max:8};
  function mrtSay(text,kind){var el=$('mr-msg');el.textContent=text;el.className='msg'+(kind?' '+kind:'');}
  function mrtBest(){try{return Math.max(0,Math.min(MRT.max,Math.floor(Number(localStorage.getItem('mrtBestTier'))||0)));}catch(_){return 0;}}
  function mrtUI(){
    MRT.best=Math.max(MRT.best,mrtBest());
    $('mr-tier').textContent=MRT.tier+' / '+MRT.max+' 階';$('mr-best').textContent=MRT.best+' 階';
    $('mr-go').disabled=MRT.active;
    $('mr-go').textContent=MRT.active?'{{t:mrt.msg.001}}':MRT.done?'{{t:mrt.msg.002}}':'{{t:mrt.msg.003}}';
  }
  function mrtValid(source){return source===$('mr-frame').contentWindow;}
  window.deepSeaMrt={
    start:function(source){
      if(!mrtValid(source)||$('view-mrt').hidden||MRT.active)return 0;
      var amount=ENTRY_FEE;
      if(amount>S.balance){mrtSay(LOW_MSG,'lose');return 0;}
      if(AN.interact)AN.interact();
      MRT.active=true;MRT.stake=amount;MRT.tier=0;MRT.done=false;MRT.analytics=AN.start('mrt',amount);save();renderAll();mrtUI();
      mrtSay('{{t:mrt.msg.004}}');
      return true;
    },
    live:function(source,m,tier){
      if(!mrtValid(source)||!MRT.active)return;
      MRT.tier=Math.max(0,Math.min(MRT.max,Math.floor(Number(tier)||0)));mrtUI();
    },
    finish:function(source,data){
      if(!mrtValid(source)||!MRT.active)return null;
      var tier=Math.max(0,Math.min(MRT.max,Math.floor(Number(data&&data.tier)||0)));
      MRT.active=false;MRT.done=true;MRT.tier=tier;mrtUI();
      AN.end(MRT.analytics,0,tier>0?'complete':'loss',{score:tier});
      mrtSay(tier>0?'本局搶到第 '+tier+' 階。':'{{t:mrt.msg.005}}',tier>0?'win':'lose');
      return 0;
    },
    progress:function(source,round,tier){if(mrtValid(source)&&MRT.active)AN.progress(MRT.analytics,{stage:Math.max(1,Math.floor(Number(round)||1)),step:Math.max(0,Math.floor(Number(tier)||0))});},
    pause:function(source){if(mrtValid(source)&&MRT.active)AN.progress(MRT.analytics,{phase:'pause'},true);},
    resume:function(source){if(mrtValid(source)&&MRT.active)AN.resume(MRT.analytics);},
    touch:function(source){if(mrtValid(source)&&AN.interact)AN.interact();}
  };
  function mrtRoute(active){
    var frame=$('mr-frame');
    if(active&&!MRT.loaded){MRT.loaded=true;frame.onload=function(){if(frame.contentWindow&&frame.contentWindow.setMrtPlatformActive)frame.contentWindow.setMrtPlatformActive(!$('view-mrt').hidden);};frame.srcdoc=JSON.parse($('mrt-source').textContent);}
    if(frame.contentWindow&&frame.contentWindow.setMrtPlatformActive)frame.contentWindow.setMrtPlatformActive(active);
  }
  $('mr-go').addEventListener('click',function(){
    var w=$('mr-frame').contentWindow;
    if(MRT.active)return;
    if(!w||!w.startMrtPlatformRound){mrtSay('{{t:mrt.msg.006}}','lose');return;}
    w.startMrtPlatformRound();
  });
  mrtUI();

