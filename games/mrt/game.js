  /* ---------- MRT Seat Grab: original isolated screen; stake × ladder multiplier returns to the shared wallet ---------- */
  var MRT={active:false,stake:0,cents:0,tier:0,paid:null,analytics:null,loaded:false,max:15};
  function mrtSay(text,kind){var el=$('mr-msg');el.textContent=text;el.className='msg'+(kind?' '+kind:'');}
  function mrtUI(){
    var pay=MRT.active?Math.floor(MRT.stake*MRT.cents/100):(MRT.paid||0),shown=MRT.stake&&(MRT.active||MRT.paid!==null),net=pay-MRT.stake;
    $('mr-mult').textContent=fx(MRT.cents/100)+'×';$('mr-pay').textContent=fmt(pay)+' 點';
    $('mr-net').textContent=shown?(net>0?'+':'')+fmt(net)+' 點':'—';$('mr-net').style.color=!shown?'':net>0?'var(--glow)':net<0?'var(--crush)':'var(--muted)';
    $('mr-go').disabled=MRT.active;
    $('mr-go').textContent=MRT.active?'搭車中 · 在左側畫面操作':MRT.paid!==null?'扣點再搭一次':'扣點上車';
    document.querySelectorAll('[data-mr-tier]').forEach(function(el){el.setAttribute('aria-current',shown&&Number(el.dataset.mrTier)===MRT.tier?'step':'false');});
  }
  function mrtValid(source){return source===$('mr-frame').contentWindow;}
  window.deepSeaMrt={
    start:function(source){
      if(!mrtValid(source)||$('view-mrt').hidden||MRT.active)return 0;
      var amount=ENTRY_FEE;
      if(amount>S.balance){mrtSay(LOW_MSG,'lose');return 0;}
      if(AN.interact)AN.interact();
      MRT.active=true;MRT.stake=amount;MRT.cents=0;MRT.tier=0;MRT.paid=null;MRT.analytics=AN.start('mrt',amount);S.balance-=amount;save();renderAll();mrtUI();
      mrtSay('已扣 '+fmt(amount)+' 點。坐著時在左側畫面按「下車結算」依倍率領回；體力歸零就歸零。');
      return amount;
    },
    live:function(source,m,tier){
      if(!mrtValid(source)||!MRT.active)return;
      m=Number(m);MRT.cents=isFinite(m)?Math.max(0,Math.min(MRT.max*100,Math.round(m*100))):0;MRT.tier=Math.max(0,Math.floor(Number(tier)||0));mrtUI();
    },
    finish:function(source,data){
      if(!mrtValid(source)||!MRT.active)return null;
      var m=Number(data&&data.m),kind=String(data&&data.kind||''),tier=Math.max(0,Math.floor(Number(data&&data.tier)||0));
      var cents=isFinite(m)?Math.max(0,Math.min(MRT.max*100,Math.round(m*100))):0;
      var paid=Math.floor(MRT.stake*cents/100),net=paid-MRT.stake;
      MRT.active=false;MRT.cents=cents;MRT.tier=tier;MRT.paid=paid;S.balance+=paid;save();renderAll();mrtUI();
      AN.end(MRT.analytics,paid,paid<=0?'loss':kind==='cash'?'cashout':'complete',{score:tier,multiplier:cents/100});
      if(paid<=0)mrtSay(kind==='bust'?'體力歸零，倍率歸零，失去 '+fmt(MRT.stake)+' 點。':'沒有搶到座位，這一局沒有領回點數。','lose');
      else mrtSay('第 '+tier+' 階，倍率 '+fx(cents/100)+'×，領回 '+fmt(paid)+' 點，本局'+(net>=0?'淨賺 ':'淨損 ')+fmt(Math.abs(net))+' 點。',net>0?'win':'');
      return paid;
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
    if(!w||!w.startMrtPlatformRound){mrtSay('遊戲畫面還在載入，請稍候再試。','lose');return;}
    w.startMrtPlatformRound();
  });
  mrtUI();

