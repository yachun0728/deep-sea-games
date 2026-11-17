  /* ---------- One Breath Dive: original isolated screen; stake × final multiplier returns to the shared wallet ---------- */
  var DIVE={active:false,stake:0,cents:0,paid:null,analytics:null,loaded:false,max:100};
  function diveSay(text,kind){var el=$('dv-msg');el.textContent=text;el.className='msg'+(kind?' '+kind:'');}
  function diveUI(){
    var pay=DIVE.active?Math.floor(DIVE.stake*DIVE.cents/100):(DIVE.paid||0),shown=DIVE.stake&&(DIVE.active||DIVE.paid!==null),net=pay-DIVE.stake;
    $('dv-mult').textContent=fx(DIVE.cents/100)+'×';$('dv-pay').textContent=fmt(pay)+' 點';
    $('dv-net').textContent=shown?(net>0?'+':'')+fmt(net)+' 點':'—';$('dv-net').style.color=!shown?'':net>0?'var(--glow)':net<0?'var(--crush)':'var(--muted)';
    $('dv-go').disabled=DIVE.active;
    $('dv-go').textContent=DIVE.active?'下潛中 · 在左側畫面操作':DIVE.paid!==null?'扣點再潛一次':'扣點開始下潛';
  }
  function diveValid(source){return source===$('dv-frame').contentWindow;}
  window.deepSeaDive={
    start:function(source){
      if(!diveValid(source)||$('view-dive').hidden||DIVE.active)return 0;
      var amount=ENTRY_FEE;
      if(amount>S.balance){diveSay(LOW_MSG,'lose');return 0;}
      if(AN.interact)AN.interact();
      DIVE.active=true;DIVE.stake=amount;DIVE.cents=0;DIVE.paid=null;DIVE.analytics=AN.start('dive',amount);S.balance-=amount;save();renderAll();diveUI();
      diveSay('已扣 '+fmt(amount)+' 點。在左側畫面挑路線往下潛，上浮結算時依倍率領回；溺水歸零。');
      return amount;
    },
    live:function(source,m){
      if(!diveValid(source)||!DIVE.active)return;
      m=Number(m);DIVE.cents=isFinite(m)?Math.max(0,Math.min(DIVE.max*100,Math.round(m*100))):0;diveUI();
    },
    finish:function(source,data){
      if(!diveValid(source)||!DIVE.active)return null;
      var m=Number(data&&data.m),kind=String(data&&data.kind||''),depth=Math.max(0,Math.floor(Number(data&&data.depth)||0));
      var cents=isFinite(m)?Math.max(0,Math.min(DIVE.max*100,Math.round(m*100))):0;
      var paid=Math.floor(DIVE.stake*cents/100),net=paid-DIVE.stake;
      DIVE.active=false;DIVE.cents=cents;DIVE.paid=paid;S.balance+=paid;save();renderAll();diveUI();
      AN.end(DIVE.analytics,paid,paid<=0?'loss':kind==='up'?'cashout':'complete',{score:depth,multiplier:cents/100});
      if(paid<=0)diveSay(kind==='drown'?'氧氣耗盡，倍率歸零，失去 '+fmt(DIVE.stake)+' 點。':'倍率 0.00×，這一局沒有領回點數。','lose');
      else diveSay('倍率 '+fx(cents/100)+'×，領回 '+fmt(paid)+' 點，本局'+(net>=0?'淨賺 ':'淨損 ')+fmt(Math.abs(net))+' 點。',net>0?'win':'');
      return paid;
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

