  /* ---------- Campaign Truck: side-scrolling street; hold to mute past quiet zones; votes decide the return ---------- */
  var CP={active:false,phase:'ready',stake:0,dist:0,votes:200,miss:0,hold:false,last:0,clock:0,best:0,lots:[],idx:0,floats:[],pay:0,total:1,finishX:0,wheel:0};
  var CP_COUNT=60,CP_QUIET_COUNT=22,CP_START=200,CP_GAIN=200,CP_QUIET=100,CP_PENALTY=400,CP_MAX_MISS=5,CP_NOISE_LIMIT=.3;
  var CP_V0=150,CP_V1=380,CP_TRUCK=150,CP_GAP=26,CP_LEAD=430,CP_GROUND=330;   // px/s at start and finish; truck's screen x; ground line
  var CP_TIERS=[[9700,5],[9000,3.2],[8000,2.2],[7000,1.5],[6000,1],[5000,.5]];
  var CP_KINDS={'學校':{w:220,h:150,quiet:true},'醫院':{w:190,h:184,quiet:true},'豪宅':{w:210,h:150,quiet:true},'住宅':{w:170,h:158},'公寓':{w:160,h:178},'商店':{w:150,h:112},'市場':{w:200,h:104},'夜市':{w:200,h:122},'公園':{w:190,h:112},'廟口':{w:190,h:150}};
  var CP_FONT='"Noto Sans TC",system-ui,sans-serif';
  var campaignCanvas=$('cp-canvas'),campaignCtx=campaignCanvas.getContext('2d'),campaignPointers=new Set(),campaignKeys=new Set();
  try{var cpb=Number(localStorage.getItem('deep-sea-campaign-best'));if(Number.isFinite(cpb))CP.best=Math.max(0,cpb);}catch(e){}
  function cpText(id,value){var el=$(id);if(el.textContent!==value)el.textContent=value;}
  function cpSay(text,kind){cpText('cp-msg',text);$('cp-msg').className='msg'+(kind?' '+kind:'');}
  function cpMult(votes){for(var i=0;i<CP_TIERS.length;i++)if(votes>=CP_TIERS[i][0])return CP_TIERS[i][1];return 0;}
  function cpRelease(){campaignPointers.clear();campaignKeys.clear();CP.hold=false;}
  function cpSpeed(){return CP_V0+(CP_V1-CP_V0)*Math.max(0,Math.min(1,CP.dist/(CP.finishX-CP_TRUCK)));}
  // 60 buildings in a shuffled row: exactly 22 quiet ones, never three quiet in a row, and the first two are ordinary.
  function cpCity(){
    var quiet=['學校','醫院','豪宅'],normal=['住宅','商店','公寓','市場','公園','廟口','夜市'],names,ok=false,i,j,tries=0;
    while(!ok&&tries++<2000){
      names=[];for(i=0;i<CP_QUIET_COUNT;i++)names.push(quiet[i%3]);for(i=0;i<CP_COUNT-CP_QUIET_COUNT;i++)names.push(normal[i%7]);
      for(i=names.length-1;i>0;i--){j=Math.floor(Math.random()*(i+1));var tmp=names[i];names[i]=names[j];names[j]=tmp;}
      ok=!CP_KINDS[names[0]].quiet&&!CP_KINDS[names[1]].quiet;
      for(i=0;ok&&i<names.length-2;i++)if(CP_KINDS[names[i]].quiet&&CP_KINDS[names[i+1]].quiet&&CP_KINDS[names[i+2]].quiet)ok=false;
    }
    var x=CP_LEAD;
    CP.lots=names.map(function(name,n){var k=CP_KINDS[name],lot={name:name,quiet:!!k.quiet,w:k.w,h:k.h,x0:x,x1:x+k.w,seed:n,tot:0,noisy:0,flash:-9,good:true};x+=k.w+CP_GAP;return lot;});
    CP.finishX=x+150;CP.total=CP.finishX+300;
  }
  function cpFloat(lot,text,kind){CP.floats.push({x:(lot.x0+lot.x1)/2,y:CP_GROUND-lot.h-44,text:text,kind:kind,t:CP.clock});if(CP.floats.length>8)CP.floats.shift();}
  function cpRemember(){if(CP.votes>CP.best){CP.best=CP.votes;try{localStorage.setItem('deep-sea-campaign-best',String(CP.best));}catch(e){}}}
  function cpLose(){
    AN.end(CP.analytics,0,'loss',{step:CP.idx,votes:CP.votes,misses:CP.miss});
    CP.active=false;CP.phase='lost';CP.pay=0;cpRelease();
    cpSay('吵到安靜區 '+CP_MAX_MISS+' 次，被檢舉落選。本局失去 '+fmt(CP.stake)+' 點。','lose');cpUI();
  }
  function cpFinish(){
    var mult=cpMult(CP.votes),pay=Math.floor(CP.stake*mult);
    AN.end(CP.analytics,pay,pay>0?'complete':'loss',{step:CP_COUNT,votes:CP.votes,misses:CP.miss,multiplier:mult});
    CP.active=false;CP.phase='done';CP.pay=pay;cpRelease();cpRemember();S.balance+=pay;save();renderAll();
    if(!pay)cpSay('開票結果 '+fmt(CP.votes)+' 票，這一趟沒有點數。','lose');
    else cpSay('開票結果 '+fmt(CP.votes)+' 票，領回 '+fmt(pay)+' 點。','win');
    cpUI();
  }
  function cpSettle(lot){
    var frac=lot.tot>0?lot.noisy/lot.tot:0;lot.flash=CP.clock;
    if(lot.quiet){
      if(frac>CP_NOISE_LIMIT){
        CP.miss++;CP.votes=Math.max(0,CP.votes-CP_PENALTY);lot.good=false;cpFloat(lot,'吵到'+lot.name+' −'+CP_PENALTY,'bad');
        if(CP.miss>=CP_MAX_MISS){cpLose();return;}
      }else{CP.votes+=CP_QUIET;lot.good=true;cpFloat(lot,'安靜通過 +'+CP_QUIET,'good');}
    }else{
      var gain=Math.round(CP_GAIN*frac/10)*10;CP.votes+=gain;lot.good=gain>0;cpFloat(lot,gain>0?'+'+gain+' 票':'沒廣播到','gain'+(gain>0?'':' dim'));
    }
  }
  function cpStep(dt){
    // Small slices keep zone entry and exit accurate on delayed frames.
    while(dt>1e-8&&CP.phase==='run'){
      var step=Math.min(dt,.012),v=cpSpeed();
      CP.dist+=v*step;CP.clock+=step;CP.wheel+=v*step/12;dt-=step;
      var wx=CP.dist+CP_TRUCK;
      while(CP.idx<CP.lots.length&&wx>=CP.lots[CP.idx].x1){
        cpSettle(CP.lots[CP.idx]);if(CP.phase!=='run')return;
        CP.idx++;if(CP.idx%15===0&&CP.idx<CP_COUNT)AN.progress(CP.analytics,{step:CP.idx,votes:CP.votes,misses:CP.miss});
      }
      if(CP.idx<CP.lots.length){var lot=CP.lots[CP.idx];if(wx>=lot.x0){lot.tot+=step;if(!CP.hold)lot.noisy+=step;}}
      else if(wx>=CP.finishX){cpFinish();return;}
    }
  }
  function cpSignal(){
    if(CP.phase!=='run')return[CP.phase==='lost'?'look':'safe',CP.phase==='lost'?'被檢舉落選':CP.phase==='done'?'開票完成':'尚未出發'];
    var wx=CP.dist+CP_TRUCK,look=cpSpeed()*.6,cur=CP.lots[CP.idx],inQuiet=!!cur&&cur.quiet&&wx>=cur.x0,soon=false;
    for(var i=CP.idx;i<Math.min(CP.lots.length,CP.idx+2);i++){var lot=CP.lots[i];if(lot.quiet&&lot.x0>wx&&lot.x0-wx<look)soon=true;}
    if(inQuiet)return CP.hold?['safe','安靜區通過中 · 繼續按住']:['look','吵到了！快按住靜音'];
    if(soon)return CP.hold?['safe','前方安靜區 · 已經靜音']:['warn','前方安靜區 · 準備按住'];
    return CP.hold?['warn','靜音中 · 這裡放開才有票']:['safe','廣播拉票中'];
  }
  function cpUI(){
    var live=CP.phase==='run',sig=cpSignal();
    cpText('cp-votes',fmt(CP.votes));cpText('cp-miss',CP.miss+' / '+CP_MAX_MISS);cpText('cp-lap',Math.min(CP.idx,CP_COUNT)+' / '+CP_COUNT+' 棟');
    cpText('cp-best',fmt(CP.best));
    $('cp-miss').style.color=CP.miss>=3?'var(--crush)':'';
    cpText('cp-signal',sig[1]);$('cp-signal').dataset.state=sig[0];
    $('cp-amount').disabled=CP.active;$('cp-go').disabled=live;
    cpText('cp-go',live?'拉票中 · 安靜區按住靜音':CP.phase==='ready'?'扣點出發拉票':'扣點再跑一趟');
    $('cp-hold').disabled=!live;cpText('cp-hold',CP.hold?'靜音中 · 放開廣播':'按住靜音 · 放開廣播');
    var tier=0;if(CP.phase!=='lost')CP_TIERS.forEach(function(t){if(!tier&&CP.votes>=t[0])tier=t[0];});
    document.querySelectorAll('[data-cp-tier]').forEach(function(el){el.setAttribute('aria-current',(live||CP.phase==='done')&&Number(el.dataset.cpTier)===tier?'step':'false');});
  }
  function cpStart(){
    if(CP.phase==='run')return;
    var stake=ENTRY_FEE;
    if(stake>S.balance){cpSay(LOW_MSG,'lose');return;}
    CP.analytics=AN.start('campaign',stake);CP.stake=stake;CP.active=true;S.balance-=stake;save();renderAll();
    cpCity();CP.dist=0;CP.votes=CP_START;CP.miss=0;CP.idx=0;CP.floats=[];CP.pay=0;CP.phase='run';CP.last=performance.now();cpRelease();
    cpSay('出發！放開讓喇叭廣播，前方出現紅色的學校、醫院、豪宅時按住靜音。');cpUI();campaignCanvas.focus();
  }
  function cpSync(now){var dt=Math.max(0,(now-CP.last)/1000);CP.last=now;if(!$('view-campaign').hidden&&!document.hidden)cpStep(dt);}

  /* drawing helpers */
  function cpRR(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
  function cpBox(g,x,y,w,h,color){g.fillStyle=color;g.fillRect(x,y,w,h);}
  function cpWindows(g,x,y,cols,rows,cw,ch,gx,gy,seed,on,off){for(var r=0;r<rows;r++)for(var c=0;c<cols;c++){g.fillStyle=((seed*7+r*3+c*5)%4)?on:off;g.fillRect(x+c*(cw+gx),y+r*(ch+gy),cw,ch);}}
  function cpBuilding(g,lot,x,t){
    var G=CP_GROUND,w=lot.w,h=lot.h,top=G-h,cx=x+w/2,i,warm='#ffd98a',dark='#0f3040';
    switch(lot.name){
    case '住宅':
      cpBox(g,x+8,top,w-16,h,'#1d4a5c');cpBox(g,x+2,top-8,w-4,10,'#163a48');
      cpWindows(g,x+26,top+18,3,3,28,26,17,14,lot.seed,warm,dark);cpBox(g,cx-11,G-34,22,34,'#0c2a36');cpBox(g,cx-11,G-34,22,3,'#ffb638');break;
    case '公寓':
      cpBox(g,x+6,top,w-12,h,'#1a4152');cpBox(g,x+w-52,top-18,26,18,'#163a48');cpBox(g,x+2,top-5,w-4,7,'#163a48');
      cpWindows(g,x+25,top+16,3,4,26,22,16,14,lot.seed,warm,dark);
      for(i=0;i<4;i++)cpBox(g,x+20,top+40+i*36,w-40,3,'#0f3040');break;
    case '商店':
      cpBox(g,x+6,top,w-12,h,'#235566');cpBox(g,x+16,top+6,w-32,22,'#0c2a36');
      for(i=0;i<9;i++)cpBox(g,x+4+i*((w-8)/9),top+34,(w-8)/9+.5,18,i%2?'#e4f2f3':'#ffb638');
      g.globalAlpha=.9;cpBox(g,x+18,G-56,w-70,40,warm);g.globalAlpha=1;cpBox(g,x+w-42,G-58,24,58,'#0c2a36');
      cpBox(g,x+24,G-50,10,28,'#e8a64a');cpBox(g,x+40,G-44,12,22,'#c96a4b');break;
    case '市場':
      cpBox(g,x+6,G-44,w-12,44,'#1f4b5b');
      for(i=0;i<3;i++){var mx=x+8+i*((w-16)/3),mw=(w-16)/3;g.fillStyle=i%2?'#ffb638':'#62e6d2';g.beginPath();g.moveTo(mx,top+44);g.lineTo(mx+mw/2,top);g.lineTo(mx+mw,top+44);g.closePath();g.fill();cpBox(g,mx+mw/2-2,top+44,4,18,'#8d7254');}
      for(i=0;i<8;i++){g.fillStyle=['#ff6f61','#ffb638','#9ad17a'][i%3];g.beginPath();g.arc(x+26+i*((w-52)/7),G-50,7,0,7);g.fill();}break;
    case '夜市':
      cpBox(g,x+10,G-62,78,62,'#235566');cpBox(g,x+w-88,G-62,78,62,'#1f4b5b');
      for(i=0;i<6;i++){cpBox(g,x+6+i*14.3,G-80,14.5,18,i%2?'#e4f2f3':'#ff6f61');cpBox(g,x+w-92+i*14.3,G-80,14.5,18,i%2?'#e4f2f3':'#62e6d2');}
      g.globalAlpha=.85;cpBox(g,x+20,G-52,58,22,warm);cpBox(g,x+w-78,G-52,58,22,warm);g.globalAlpha=1;
      g.strokeStyle='#8db0b9';g.lineWidth=1.5;g.beginPath();g.moveTo(x+4,top);g.quadraticCurveTo(cx,top+26,x+w-4,top);g.stroke();
      for(i=1;i<8;i++){var u=i/8,lx=x+4+(w-8)*u,ly=top+26*4*u*(1-u)*.5+2;g.fillStyle=i%2?'#ffb638':'#ff6f61';g.beginPath();g.arc(lx,ly+7,6+(reduceMotion?0:Math.sin(t*3+i)*.6),0,7);g.fill();}break;
    case '公園':
      cpBox(g,x,G-8,w,8,'#1f5a4c');
      [[38,58,30],[98,82,36],[154,52,26]].forEach(function(tr){cpBox(g,x+tr[0]-4,G-tr[1],8,tr[1],'#6b5238');g.fillStyle='#1f6b5a';g.beginPath();g.arc(x+tr[0],G-tr[1],tr[2],0,7);g.fill();g.fillStyle='#2a8a70';g.beginPath();g.arc(x+tr[0]-tr[2]*.3,G-tr[1]-tr[2]*.3,tr[2]*.55,0,7);g.fill();});
      cpBox(g,x+56,G-22,34,4,'#8d7254');cpBox(g,x+58,G-18,3,10,'#8d7254');cpBox(g,x+85,G-18,3,10,'#8d7254');break;
    case '廟口':
      cpBox(g,x+10,G-12,w-20,12,'#8f8a80');cpBox(g,x+22,G-92,w-44,80,'#7a2f2a');
      for(i=0;i<4;i++)cpBox(g,x+28+i*((w-68)/3),G-92,12,80,'#b5483c');cpBox(g,cx-15,G-62,30,50,'#2a1512');
      [[0,G-92,w+8,22],[26,G-128,w-44,18]].forEach(function(r){var rx=x-4+r[0],ry=r[1],rw=r[2],rh=r[3];g.fillStyle='#ffb638';g.beginPath();g.moveTo(rx-8,ry-4);g.quadraticCurveTo(rx+6,ry-rh*.2,rx+18,ry-rh);g.lineTo(rx+rw-18,ry-rh);g.quadraticCurveTo(rx+rw-6,ry-rh*.2,rx+rw+8,ry-4);g.lineTo(rx+rw,ry+3);g.lineTo(rx,ry+3);g.closePath();g.fill();cpBox(g,rx+16,ry-rh-3,rw-32,4,'#d5912a');});
      cpBox(g,x+48,G-114,w-96,22,'#7a2f2a');g.fillStyle='#ff6f61';g.beginPath();g.arc(x+44,G-74,8,0,7);g.arc(x+w-44,G-74,8,0,7);g.fill();break;
    case '學校':
      cpBox(g,x+6,G-118,w-12,118,'#2b5872');cpBox(g,x+2,G-124,w-4,8,'#1f4257');
      cpBox(g,cx-38,top+22,76,h-22,'#356c85');g.fillStyle='#1f4257';g.beginPath();g.moveTo(cx-46,top+24);g.lineTo(cx,top-4);g.lineTo(cx+46,top+24);g.closePath();g.fill();
      g.fillStyle='#e9fbff';g.beginPath();g.arc(cx,top+52,15,0,7);g.fill();g.strokeStyle='#1f4257';g.lineWidth=2.5;g.beginPath();g.moveTo(cx,top+52);g.lineTo(cx,top+42);g.moveTo(cx,top+52);g.lineTo(cx+8,top+56);g.stroke();
      cpWindows(g,x+18,G-104,2,2,22,24,10,14,lot.seed,'#bfe6ee',dark);cpWindows(g,x+w-72,G-104,2,2,22,24,10,14,lot.seed+1,'#bfe6ee',dark);cpBox(g,cx-14,G-40,28,40,'#12303f');
      cpBox(g,x+14,top-22,3,52,'#cfe3e6');g.fillStyle='#ffb638';g.beginPath();g.moveTo(x+17,top-22);g.lineTo(x+42,top-15+(reduceMotion?0:Math.sin(t*5)*2));g.lineTo(x+17,top-7);g.closePath();g.fill();break;
    case '醫院':
      cpBox(g,x+8,top,w-16,h,'#9fc0c6');cpBox(g,x+8,top,22,h,'#86a9b0');cpBox(g,x+2,top-6,w-4,8,'#6f949c');
      cpWindows(g,x+42,top+58,4,3,22,20,10,12,lot.seed,'#e9fbff','#5d8c95');
      g.fillStyle='#f4ffff';g.beginPath();g.arc(cx+10,top+32,22,0,7);g.fill();cpBox(g,cx+4,top+16,12,32,'#ff6f61');cpBox(g,cx-6,top+26,32,12,'#ff6f61');
      cpBox(g,cx-30,G-44,80,6,'#ff6f61');cpBox(g,cx-16,G-38,52,38,'#3d6a74');cpBox(g,cx+9,G-38,2,38,'#9fc0c6');break;
    case '豪宅':
      cpBox(g,x+26,G-104,w-52,104,'#3d3760');g.fillStyle='#2a2547';g.beginPath();g.moveTo(x+12,G-102);g.lineTo(cx,top-4);g.lineTo(x+w-12,G-102);g.closePath();g.fill();cpBox(g,x+w-66,top+6,16,34,'#2a2547');
      g.fillStyle=warm;g.beginPath();g.arc(cx,top+34,10,0,7);g.fill();
      for(i=0;i<4;i++)cpBox(g,x+40+i*((w-92)/3),G-98,12,98,'#cfc8ee');
      cpWindows(g,x+58,G-84,2,1,22,30,w-160,0,lot.seed,warm,warm);g.fillStyle='#1c1836';g.beginPath();g.arc(cx,G-44,15,Math.PI,0);g.fill();cpBox(g,cx-15,G-44,30,44,'#1c1836');
      g.strokeStyle='#a89fe0';g.lineWidth=2;for(i=0;i<=14;i++){var fx0=x+4+i*((w-8)/14);if(Math.abs(fx0-cx)<22)continue;g.beginPath();g.moveTo(fx0,G-28);g.lineTo(fx0,G);g.stroke();}
      g.beginPath();g.moveTo(x+4,G-22);g.lineTo(cx-22,G-22);g.moveTo(cx+22,G-22);g.lineTo(x+w-4,G-22);g.stroke();break;
    }
    var age=t-lot.flash;
    if(age>=0&&age<.55){g.globalAlpha=.4*(1-age/.55);cpBox(g,x,top-10,w,h+10,lot.good?'#62e6d2':'#ff6f61');g.globalAlpha=1;}
    // name plate; quiet buildings get a coral "keep quiet" sign
    g.textAlign='center';g.textBaseline='middle';
    if(lot.quiet){
      var near=CP.phase==='run'&&lot.x0-(CP.dist+CP_TRUCK)<260&&lot.x1>CP.dist+CP_TRUCK,py=top-34+(near&&!reduceMotion?Math.sin(t*9)*2:0);
      g.fillStyle='#ff6f61';cpRR(g,cx-62,py-14,124,28,14);g.fill();g.beginPath();g.moveTo(cx-7,py+13);g.lineTo(cx,py+22);g.lineTo(cx+7,py+13);g.closePath();g.fill();
      g.fillStyle='#2a0f0b';g.font='700 15px '+CP_FONT;g.fillText(lot.name+' · 要安靜',cx,py+1);
    }else{
      g.fillStyle='rgba(5,22,32,.7)';cpRR(g,cx-28,top-32,56,22,11);g.fill();g.fillStyle='#b9d3d9';g.font='600 14px '+CP_FONT;g.fillText(lot.name,cx,top-20);
    }
  }
  function cpTruck(g,x,t,live){
    var y=live&&!reduceMotion?Math.sin(t*20)*.9:0,i,muted=CP.hold&&live;
    if(live&&!CP.hold){for(i=0;i<3;i++){var r=14+((t*60+i*17)%51);g.globalAlpha=Math.max(0,.9-r/66);g.strokeStyle='#62e6d2';g.lineWidth=3;g.beginPath();g.arc(x-12,346+y,reduceMotion?18+i*14:r,Math.PI*1.12,Math.PI*1.88);g.stroke();}g.globalAlpha=1;}
    g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(x,430,70,6,0,0,7);g.fill();
    cpBox(g,x-60,322+y,3,36,'#cfe3e6');g.fillStyle='#62e6d2';g.beginPath();g.moveTo(x-57,322+y);g.lineTo(x-80,329+y+(reduceMotion?0:Math.sin(t*9)*2));g.lineTo(x-57,337+y);g.closePath();g.fill();
    g.fillStyle='#ffb638';cpRR(g,x-64,356+y,88,52,7);g.fill();g.fillStyle='#fff4d6';cpRR(g,x-56,366+y,72,24,5);g.fill();
    g.fillStyle='#8a4b00';g.font='700 14px '+CP_FONT;g.textAlign='center';g.textBaseline='middle';g.fillText('懇請支持',x-20,379+y);
    g.fillStyle='#d5912a';cpRR(g,x+22,368+y,42,40,7);g.fill();g.fillStyle='#bfe6ee';cpRR(g,x+35,374+y,23,15,3);g.fill();cpBox(g,x+58,400+y,9,5,'#e4f2f3');cpBox(g,x-66,402+y,134,6,'#b9781f');
    [[-34,354],[-2,354]].forEach(function(s){g.fillStyle=muted?'#6f8d95':'#e4f2f3';g.beginPath();g.moveTo(x+s[0]-7,s[1]+y+2);g.lineTo(x+s[0]-13,s[1]+y-13);g.lineTo(x+s[0]+13,s[1]+y-13);g.lineTo(x+s[0]+7,s[1]+y+2);g.closePath();g.fill();cpBox(g,x+s[0]-4,s[1]+y,8,4,'#8db0b9');});
    if(muted){g.strokeStyle='#ff6f61';g.lineWidth=4;g.lineCap='round';g.beginPath();g.moveTo(x-48,360+y);g.lineTo(x+12,334+y);g.stroke();g.lineCap='butt';}
    [[-36,418],[42,418]].forEach(function(wh){g.fillStyle='#051620';g.beginPath();g.arc(x+wh[0],wh[1],12,0,7);g.fill();g.fillStyle='#8db0b9';g.beginPath();g.arc(x+wh[0],wh[1],5,0,7);g.fill();g.strokeStyle='#8db0b9';g.lineWidth=2;g.beginPath();g.moveTo(x+wh[0]+Math.cos(CP.wheel)*10,wh[1]+Math.sin(CP.wheel)*10);g.lineTo(x+wh[0]-Math.cos(CP.wheel)*10,wh[1]-Math.sin(CP.wheel)*10);g.stroke();});
  }
  function cpDraw(){
    var g=campaignCtx,W=640,H=460,G=CP_GROUND,live=CP.phase==='run',t=CP.clock,cam=CP.dist,i,x;
    var sky=g.createLinearGradient(0,0,0,G);sky.addColorStop(0,'#071827');sky.addColorStop(1,'#155068');g.fillStyle=sky;g.fillRect(0,0,W,G);
    g.fillStyle='#f3e9c6';g.beginPath();g.arc(560,140,22,0,7);g.fill();g.fillStyle='#0e3247';g.beginPath();g.arc(550,133,20,0,7);g.fill();
    for(i=0;i<16;i++){g.globalAlpha=.35+.3*Math.sin(t*1.5+i*2.1);cpBox(g,(i*97+31)%W,104+(i*53)%110,2,2,'#e4f2f3');}g.globalAlpha=1;
    // far skyline drifts slowly
    var far=cam*.22,k0=Math.floor(far/74);
    for(i=-1;i<10;i++){var k=k0+i,fh=60+((k*37)%7+7)%7*16;cpBox(g,k*74-far,G-fh,66,fh,'#0d3145');cpBox(g,k*74-far+10,G-fh+12,6,8,'rgba(255,217,138,.25)');cpBox(g,k*74-far+40,G-fh+30,6,8,'rgba(255,217,138,.18)');}
    // street
    cpBox(g,0,G,W,18,'#2b5568');cpBox(g,0,G+16,W,3,'#1b4354');cpBox(g,0,G+18,W,86,'#0e2836');cpBox(g,0,G+104,W,H-G-104,'#081c27');
    for(x=-(cam%90);x<W;x+=90)cpBox(g,x,G+60,46,4,'rgba(228,242,243,.3)');
    // quiet stretches painted on the road
    CP.lots.forEach(function(lot){
      var sx=lot.x0-cam;if(!lot.quiet||sx>W||sx+lot.w<0)return;
      g.save();g.beginPath();g.rect(sx,G+18,lot.w,86);g.clip();cpBox(g,sx,G+18,lot.w,86,'rgba(255,111,97,.2)');
      g.strokeStyle='rgba(255,111,97,.38)';g.lineWidth=6;for(var hx=sx-90;hx<sx+lot.w;hx+=26){g.beginPath();g.moveTo(hx,G+104);g.lineTo(hx+86,G+18);g.stroke();}g.restore();
      cpBox(g,sx,G+18,3,86,'#ff6f61');cpBox(g,sx+lot.w-3,G+18,3,86,'#ff6f61');
    });
    CP.lots.forEach(function(lot){var sx=lot.x0-cam;if(sx<W+20&&sx+lot.w>-20)cpBuilding(g,lot,sx,t);});
    // polling station at the end of the route
    var fxs=CP.finishX-cam;
    if(fxs<W+80){cpBox(g,fxs-4,G-150,8,150,'#cfe3e6');cpBox(g,fxs+116,G-150,8,150,'#cfe3e6');g.fillStyle='#62e6d2';cpRR(g,fxs-10,G-176,144,36,8);g.fill();g.fillStyle='#00241f';g.font='700 18px '+CP_FONT;g.textAlign='center';g.textBaseline='middle';g.fillText('投票所',fxs+62,G-157);
      for(i=0;i<8;i++)cpBox(g,fxs+(i%2)*10,G+18+i*10.75,10,10.75,'#e4f2f3');}
    cpTruck(g,CP_TRUCK,t,live);
    // street lamps in front make the speed readable
    var near=cam*1.25;
    for(x=-(near%330)-20;x<W+40;x+=330){cpBox(g,x,G-118,5,222,'#061520');cpBox(g,x-16,G-122,38,6,'#061520');g.globalAlpha=.16;g.fillStyle='#ffd98a';g.beginPath();g.moveTo(x-8,G-116);g.lineTo(x+14,G-116);g.lineTo(x+60,G+104);g.lineTo(x-54,G+104);g.closePath();g.fill();g.globalAlpha=1;cpBox(g,x-8,G-117,22,4,'#ffd98a');}
    // floating results
    g.textAlign='center';g.textBaseline='middle';
    CP.floats.forEach(function(f){var age=t-f.t;if(age<0||age>1.1)return;g.globalAlpha=Math.min(1,(1.1-age)*2);g.font='700 17px '+CP_FONT;g.fillStyle=f.kind==='bad'?'#ff6f61':f.kind==='good'?'#62e6d2':f.kind==='gain'?'#ffb638':'#8db0b9';g.lineWidth=5;g.strokeStyle='#051620';var sx=Math.max(70,Math.min(W-70,f.x-cam)),sy=Math.max(118,f.y-age*24);g.strokeText(f.text,sx,sy);g.fillText(f.text,sx,sy);});
    g.globalAlpha=1;
    // HUD: votes, route progress and speed, strikes
    cpBox(g,0,0,W,96,'rgba(5,22,32,.86)');cpBox(g,0,96,W,1,'#214658');
    g.textAlign='left';g.fillStyle='#8db0b9';g.font='12px '+CP_FONT;g.fillText('目前選票',16,16);g.fillStyle='#e4f2f3';g.font='700 30px "Chakra Petch",'+CP_FONT;g.fillText(fmt(CP.votes),16,42);
    var prog=Math.max(0,Math.min(1,cam/(CP.finishX-CP_TRUCK)));
    g.textAlign='center';g.fillStyle='#8db0b9';g.font='12px '+CP_FONT;g.fillText('車速 '+(cpSpeed()/CP_V0).toFixed(1)+'× · 已過 '+Math.min(CP.idx,CP_COUNT)+' / '+CP_COUNT+' 棟',W/2,16);
    g.fillStyle='#113041';cpRR(g,200,32,240,10,5);g.fill();g.fillStyle='#ffb638';cpRR(g,200,32,Math.max(10,240*prog),10,5);g.fill();g.fillStyle='#62e6d2';cpBox(g,436,28,3,18,'#62e6d2');
    g.textAlign='right';g.fillStyle='#8db0b9';g.font='12px '+CP_FONT;g.fillText('吵到 '+CP.miss+' / '+CP_MAX_MISS+' 次',W-16,16);
    for(i=0;i<CP_MAX_MISS;i++){g.beginPath();g.arc(W-24-(CP_MAX_MISS-1-i)*24,40,8,0,7);if(i<CP.miss){g.fillStyle='#ff6f61';g.fill();}else{g.lineWidth=1.5;g.strokeStyle='#326475';g.stroke();}}
    // upcoming buildings
    g.textAlign='left';g.fillStyle='#8db0b9';g.font='12px '+CP_FONT;g.fillText('接下來',16,75);
    for(i=0;i<6;i++){var up=CP.lots[CP.idx+i],ux=66+i*95;if(!up){if(i===0||CP.lots[CP.idx+i-1]){g.fillStyle='rgba(98,230,210,.16)';cpRR(g,ux,62,84,26,13);g.fill();g.fillStyle='#62e6d2';g.font='600 13px '+CP_FONT;g.textAlign='center';g.fillText('投票所',ux+42,76);}break;}
      g.fillStyle=up.quiet?'rgba(255,111,97,.22)':'#113041';cpRR(g,ux,62,84,26,13);g.fill();g.lineWidth=i===0?2:1;g.strokeStyle=up.quiet?'#ff6f61':i===0?'#8db0b9':'#2b5568';g.stroke();
      g.fillStyle=up.quiet?'#ff9a8f':'#b9d3d9';g.font='600 13px '+CP_FONT;g.textAlign='center';g.fillText(up.quiet?up.name+' 靜':up.name,ux+42,76);
      if(i<5){g.fillStyle='#326475';g.fillText('›',ux+89.5,75);}}
    g.textAlign='center';g.fillStyle=live?(CP.hold?'#8db0b9':'#62e6d2'):'#8db0b9';g.font='600 14px '+CP_FONT;
    g.fillText(live?(CP.hold?'靜音中 · 放開才會廣播':'廣播拉票中 · 紅色路段要按住'):'放開＝廣播拉票　按住＝靜音',W/2,H-13);
    if(!live){
      g.fillStyle='rgba(5,22,32,.9)';cpRR(g,150,150,340,104,12);g.fill();g.lineWidth=1;g.strokeStyle='#214658';g.stroke();
      g.fillStyle=CP.phase==='lost'?'#ff6f61':'#62e6d2';g.font='700 24px '+CP_FONT;
      g.fillText(CP.phase==='ready'?'準備出發拉票？':CP.phase==='lost'?'被檢舉，落選了！':CP.pay>0?'領回 '+fmt(CP.pay)+' 點':'票數不夠，沒有點數',W/2,186);
      g.fillStyle='#e4f2f3';g.font='14px '+CP_FONT;
      g.fillText(CP.phase==='ready'?'紅色建築要按住靜音，其他放開廣播':CP.phase==='lost'?'吵到安靜區 '+CP_MAX_MISS+' 次，本局沒有點數':'最終得票 '+fmt(CP.votes)+' 票',W/2,222);
    }
    g.textBaseline='alphabetic';g.textAlign='left';
  }
  function cpPress(e){if(e.button!==undefined&&e.button!==0)return;if(CP.phase!=='run'||$('view-campaign').hidden||document.hidden)return;e.preventDefault();cpSync(performance.now());if(CP.phase!=='run')return;campaignCanvas.focus();campaignPointers.add(e.pointerId);CP.hold=true;try{e.currentTarget.setPointerCapture(e.pointerId);}catch(_){}cpUI();}
  function cpLift(e){cpSync(performance.now());campaignPointers.delete(e.pointerId);CP.hold=campaignPointers.size>0||campaignKeys.size>0;}
  [campaignCanvas,$('cp-hold')].forEach(function(el){el.addEventListener('pointerdown',cpPress);['pointerup','pointercancel','lostpointercapture'].forEach(function(type){el.addEventListener(type,cpLift);});el.addEventListener('contextmenu',function(e){e.preventDefault();});});
  $('cp-go').addEventListener('click',cpStart);
  addEventListener('keydown',function(e){if($('view-campaign').hidden||document.hidden||CP.phase!=='run'||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;if(['INPUT','BUTTON','A','SUMMARY'].indexOf(e.target.tagName)>=0)return;if(e.code==='Space'){e.preventDefault();cpSync(performance.now());if(CP.phase==='run'){campaignKeys.add(e.code);CP.hold=true;}}});
  addEventListener('keyup',function(e){if(e.code!=='Space')return;if(!$('view-campaign').hidden)e.preventDefault();cpSync(performance.now());campaignKeys.delete(e.code);CP.hold=campaignPointers.size>0||campaignKeys.size>0;});
  addEventListener('blur',function(){cpRelease();CP.last=performance.now();});
  document.addEventListener('visibilitychange',function(){cpRelease();CP.last=performance.now();});
  window.addEventListener('hashchange',function(){cpRelease();CP.last=performance.now();});
  function cpLoop(now){cpSync(now);if(!$('view-campaign').hidden&&!document.hidden){cpUI();cpDraw();}requestAnimationFrame(cpLoop);}
  cpCity();cpUI();cpDraw();requestAnimationFrame(cpLoop);


