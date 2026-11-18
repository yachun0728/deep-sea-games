  /* ---------- Daily free gold exploration ---------- */
  var KE_N = 36, KE_DIGS = 5, KE_DAILY_KEY = 'deep-sea-gold-daily-v1';
  var KE = {active:false, over:false, layout:[], open:[], digs:0, score:0, best:0, earned:0, day:'', daily:null};
  var elKGo=$('ke-go'), elKMsg=$('ke-msg'), elKBoard=$('ke-board'), kcells=[];
  var KE_ORES=[{name:'石頭',reward:0,score:0,color:'#a1a8ae'},{name:'銅礦',reward:2,score:10,color:'#e99a64'},{name:'金礦',reward:3,score:30,color:'#ffd368'},{name:'鑽石',reward:5,score:60,color:'#86eee9'}];
  function kSay(text,cls){elKMsg.textContent=text;elKMsg.className='msg'+(cls?' '+cls:'');}
  function keDay(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
  function keRead(){
    var day=keDay(),d=JSON.parse(localStorage.getItem(KE_DAILY_KEY)||'null');
    if(!d||d.day!==day)return {day:day,plays:0,earned:0,round:null};
    if(!Number.isInteger(d.plays)||d.plays<0||d.plays>3||!Number.isInteger(d.earned)||d.earned<0||d.earned>30)throw new Error('daily record');
    if(d.round){var r=d.round;if(!Array.isArray(r.layout)||r.layout.length!==36||r.layout.some(function(n){return !Number.isInteger(n)||n<0||n>3;})||!Array.isArray(r.open)||r.open.length!==36||r.open.some(function(v){return typeof v!=='boolean';})||r.open.filter(Boolean).length>5)throw new Error('round record');}
    return d;
  }
  function keStore(d){localStorage.setItem(KE_DAILY_KEY,JSON.stringify(d));}
  function keLocked(fn){
    function run(){try{fn();}catch(e){kSay('無法讀寫每日紀錄，請確認瀏覽器允許本機儲存後再試。','lose');}}
    if(navigator.locks&&navigator.locks.request)return navigator.locks.request(KE_DAILY_KEY,run);
    run();
  }
  function keArt(kind){
    var ore=KE_ORES[kind];
    if(kind===3)return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m9 24 13-13h20l13 13-23 30Z" fill="#72dcd9" stroke="#194d62" stroke-width="3"/><path d="M9 24h46M22 11l10 43 10-43M22 11l10 13 10-13" fill="none" stroke="#d9ffff" stroke-width="2"/></svg>';
    return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m8 43 8-25 22-8 19 19-6 24-29 3Z" fill="#62676b" stroke="#343d42" stroke-width="3"/><path d="m16 18 17 15 24-4M33 33l-11 23" fill="none" stroke="#90989a" stroke-width="3"/>'+(kind?'<path d="m18 26 10-8 10 6-5 12-12 2Zm18 15 9-7 7 8-7 8Z" fill="'+ore.color+'" stroke="#fff1bf" stroke-width="1.5"/>':'')+'</svg>';
  }
  function keBuild(){
    try{KE.best=Number(localStorage.getItem('deep-sea-gold-best'))||0;}catch(e){}
    for(var i=0;i<KE_N;i++){var b=document.createElement('button');b.type='button';b.className='kcell';b.addEventListener('click',keDig.bind(null,i));elKBoard.appendChild(b);kcells.push(b);}
    keLocked(function(){keSync(keRead());keUI();});
  }
  function keSync(d){
    if(KE.active&&KE.day!==d.day){AN.end(KE.analytics,KE.earned,'complete',{step:KE.digs,score:KE.score});KE.active=false;}
    if(KE.day!==d.day){KE.layout=[];KE.open=[];KE.digs=0;KE.score=0;}
    KE.day=d.day;KE.daily=d;
    if(d.round){
      if(!KE.active){KE.analytics=AN.start('keno',0);KE.earned=0;}
      KE.layout=d.round.layout;KE.open=d.round.open;KE.digs=KE.open.filter(Boolean).length;
      KE.score=KE.open.reduce(function(s,v,i){return s+(v?KE_ORES[KE.layout[i]].score:0);},0);KE.active=true;
    }else if(KE.active){AN.end(KE.analytics,KE.earned,'complete',{step:KE.digs,score:KE.score});KE.active=false;}
  }
  function keUI(){
    kcells.forEach(function(b,i){var shown=!!KE.open[i],ore=KE_ORES[KE.layout[i]||0];b.className='kcell '+(shown?'ore-'+KE.layout[i]:'soil');b.innerHTML=shown?keArt(KE.layout[i]):'<span class="ore-crack" aria-hidden="true"></span>';b.disabled=!KE.active||shown;b.setAttribute('aria-label','礦區第 '+(i+1)+' 格，'+(shown?ore.name:'尚未挖掘'));});
    $('ke-left').textContent=(5-KE.digs)+' / 5';$('ke-score').textContent=KE.score;$('ke-best').textContent=KE.best;
    $('ke-free').textContent=KE.daily?(3-KE.daily.plays)+' / 3':'—';$('ke-earned').textContent=KE.daily?KE.daily.earned+' / 30 點':'—';
    elKGo.disabled=KE.active||!KE.daily||KE.daily.plays>=3||KE.daily.earned>=30;elKGo.dataset.mode=KE.active?'playing':'start';
    elKGo.innerHTML=KE.active?'選一格挖掘吧':KE.daily&&(KE.daily.plays>=3||KE.daily.earned>=30)?'今日補給已完成<small>台灣時間午夜再來</small>':'免費挖金礦<small>免費 · 每次可挖 5 格</small>';
    var cta=$('gold-daily-cta');if(cta)cta.textContent=KE.active?'繼續本次挖掘 ↗':KE.daily&&(KE.daily.plays>=3||KE.daily.earned>=30)?'查看今日補給':'免費挖一次 ↗';
    var badge=$('gold-free-badge');if(badge)badge.textContent=KE.active?'挖':KE.daily&&(KE.daily.plays>=3||KE.daily.earned>=30)?'✓':KE.daily?String(3-KE.daily.plays):'3';
    var link=$('gold-float');if(link)link.setAttribute('aria-label',KE.active?'每日挖礦：繼續本次挖掘':KE.daily?'每日免費挖礦：剩餘'+(3-KE.daily.plays)+'次，今日已獲得'+KE.daily.earned+'點':'每日免費挖礦');
    var card=$('gold-daily-status');if(card)card.textContent=KE.daily?'今日剩 '+(3-KE.daily.plays)+' 次 · 已獲 '+KE.daily.earned+'/30 點':'每天免費 3 次 · 最多獲得 30 點';
  }
  function kePlay(){keLocked(function(){var d=keRead();keSync(d);if(KE.active)return;if(d.plays>=3||d.earned>=30){keUI();return;}
    var layout=Array.from({length:36},function(_,i){return i<18?0:i<28?1:i<34?2:3;});
    for(var i=35;i>0;i--){var r=Math.floor(Math.random()*(i+1)),t=layout[i];layout[i]=layout[r];layout[r]=t;}
    d.plays++;d.round={layout:layout,open:Array(36).fill(false)};keStore(d);KE.over=false;KE.earned=0;keSync(d);kSay('免費出發！每次挖 5 格，礦物點數立即加入共用餘額。');keUI();
  });}
  function keDig(i){keLocked(function(){var d=keRead();keSync(d);if(!KE.active||i<0||i>=36||KE.open[i]){keUI();return;}
    var ore=KE_ORES[KE.layout[i]],bonus=Math.min(ore.reward,30-d.earned);
    d.round.open[i]=true;d.earned+=bonus;KE.digs=d.round.open.filter(Boolean).length;KE.score+=ore.score;KE.open=d.round.open;
    var done=KE.digs===5||d.earned===30;if(done)d.round=null;
    // Save consumed dig before crediting, so refresh cannot award it twice.
    keStore(d);var stored=Number(localStorage.getItem(STORE));if(Number.isFinite(stored)&&stored>=0&&localStorage.getItem(STORE)!==null)S.balance=stored;
    S.balance+=bonus;KE.earned+=bonus;syncBalance();KE.daily=d;
    if(KE.score>KE.best){KE.best=KE.score;try{localStorage.setItem('deep-sea-gold-best',String(KE.best));}catch(e){}}
    AN.progress(KE.analytics,{step:KE.digs,score:KE.score,bonus_points:bonus,total_bonus_points:KE.earned});
    if(done){KE.active=false;KE.over=true;AN.end(KE.analytics,KE.earned,'complete',{step:KE.digs,score:KE.score});}
    kSay('挖到'+ore.name+'，獲得 '+bonus+' 點！'+(done?'本次補給完成。':'還可挖 '+(5-KE.digs)+' 格。'),bonus?'win':'');keUI();
  });}
  elKGo.addEventListener('click',kePlay);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)keLocked(function(){keSync(keRead());keUI();});});
  window.addEventListener('storage',function(e){if(e.key===KE_DAILY_KEY)keLocked(function(){keSync(keRead());keUI();});});
  // Finish before shared pagehide analytics so already credited rewards are reported.
  window.addEventListener('pagehide',function(e){if(!e.persisted&&KE.active)AN.end(KE.analytics,KE.earned,'abandoned',{step:KE.digs,score:KE.score});},true);

  setInterval(function(){if(KE.day && keDay()!==KE.day)keLocked(function(){keSync(keRead());keUI();});},30000);
