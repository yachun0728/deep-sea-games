  /* ---------- Campaign Truck: endless street, hold to mute past quiet zones; milestone vote bonuses are credited when reached ---------- */
  var CP={active:false,phase:'ready',stake:0,dist:0,votes:200,miss:0,hold:false,last:0,clock:0,best:0,lots:[],idx:0,floats:[],pops:[],earned:0,awarded:0,wheel:0,n:0,qrun:0,nx:0,cleared:0};
  var CP_START=200,CP_GAIN=200,CP_QUIET=100,CP_PENALTY=400,CP_MAX_MISS=5,CP_NOISE_LIMIT=.3,CP_NEGLECT=.3;
  // The truck starts fast and keeps accelerating up to a cap; quiet zones get more frequent as the street goes on.
  var CP_V0=300,CP_VK=.06,CP_VMAX=800,CP_TRUCK=150,CP_GAP=26,CP_LEAD=430,CP_GROUND=330,CP_PQ0=.35,CP_PQK=.004,CP_PQMAX=.6;
  // Milestones count votes and were calibrated with a mute-timing simulation (see GAME_RULES.md).
  var CP_MILESTONES=[[8000,3],[10000,7],[12000,15],[15000,30]],CP_ENDLESS_FROM=15000,CP_ENDLESS_STEP=3000,CP_ENDLESS_BONUS=40;
  function cpNextMilestone(v){for(var i=0;i<CP_MILESTONES.length;i++)if(CP_MILESTONES[i][0]>v)return CP_MILESTONES[i];return [CP_ENDLESS_FROM+(Math.floor((v-CP_ENDLESS_FROM)/CP_ENDLESS_STEP)+1)*CP_ENDLESS_STEP,CP_ENDLESS_BONUS];}
  var CP_KINDS={'{{t:campaign.msg.001}}':{w:220,h:150,quiet:true},'{{t:campaign.msg.002}}':{w:190,h:184,quiet:true},'{{t:campaign.msg.003}}':{w:210,h:150,quiet:true},'{{t:campaign.msg.004}}':{w:170,h:158},'{{t:campaign.msg.005}}':{w:160,h:178},'{{t:campaign.msg.006}}':{w:150,h:112},'{{t:campaign.msg.007}}':{w:200,h:104},'{{t:campaign.msg.008}}':{w:200,h:122},'{{t:campaign.msg.009}}':{w:190,h:112},'{{t:campaign.msg.010}}':{w:190,h:150}};
  var CP_FONT='"Noto Sans TC",system-ui,sans-serif';
  var campaignCanvas=$('cp-canvas'),campaignCtx=campaignCanvas.getContext('2d'),campaignPointers=new Set(),campaignKeys=new Set();
  try{var cpb=Number(localStorage.getItem('deep-sea-campaign-best'));if(Number.isFinite(cpb))CP.best=Math.max(0,cpb);}catch(e){}
  function cpText(id,value){var el=$(id);if(el.textContent!==value)el.textContent=value;}
  function cpSay(text,kind){cpText('cp-msg',text);$('cp-msg').className='msg'+(kind?' '+kind:'');}
  var cpRank=timedLeaderboard('campaign','cp',2,cpUI);
  function cpHold(held){var code=held?0:1;if(campaignRules.input(CP,code))cpRank.record(code);}
  function cpRelease(){campaignPointers.clear();campaignKeys.clear();cpHold(false);}
  function cpSpeed(){return Math.min(CP_VMAX,CP_V0+CP_VK*CP.dist);}
  function cpPassed(){return CP.cleared+CP.idx;}
  function cpFloat(lot,text,kind){CP.floats.push({x:(lot.x0+lot.x1)/2,y:CP_GROUND-lot.h-44,text:text,kind:kind,t:CP.clock});if(CP.floats.length>8)CP.floats.shift();}
  function cpRemember(){if(CP.votes>CP.best){CP.best=CP.votes;try{localStorage.setItem('deep-sea-campaign-best',String(CP.best));}catch(e){}}}
  function cpLose(reason){
    AN.end(CP.analytics,CP.earned,CP.earned>0?'complete':'loss',{step:cpPassed(),votes:CP.votes,misses:CP.miss});
    CP.active=false;CP.phase='lost';cpRelease();cpRemember();cpRank.finish(CP.votes);
    cpSay(reason+' 累計 '+CP_MAX_MISS+' 次失誤，被檢舉落選。最終 '+fmt(CP.votes)+' 票，'+(CP.earned>0?'本局共入帳 '+fmt(CP.earned)+' 點。':'{{t:campaign.msg.011}}'),CP.earned>0?'win':'lose');cpUI();
  }
  function cpMilestones(){
    var nx=cpNextMilestone(CP.awarded);
    while(CP.votes>=nx[0]&&CP.phase==='run'){
      var b=nx[1];CP.awarded=nx[0];CP.earned+=b;S.balance+=b;save();renderAll();
      AN.progress(CP.analytics,{step:cpPassed(),votes:CP.votes,misses:CP.miss,bonus_points:b});
      CP.pops.push({v:nx[0],b:b,age:0});if(CP.pops.length>3)CP.pops.shift();
      cpSay('得票達 '+fmt(nx[0])+'{{t:campaign.msg.012}}'+b+' 點已入帳，本局累計 +'+CP.earned+' 點。','win');
      nx=cpNextMilestone(CP.awarded);
    }
  }
  function cpSignal(){
    if(CP.phase!=='run')return[CP.phase==='lost'?'look':'safe',CP.phase==='lost'?'{{t:campaign.msg.013}}':'{{t:campaign.msg.014}}'];
    var wx=CP.dist+CP_TRUCK,look=cpSpeed()*.6,cur=CP.lots[CP.idx],inQuiet=!!cur&&cur.quiet&&wx>=cur.x0,soon=false;
    for(var i=CP.idx;i<Math.min(CP.lots.length,CP.idx+2);i++){var lot=CP.lots[i];if(lot.quiet&&lot.x0>wx&&lot.x0-wx<look)soon=true;}
    if(inQuiet)return CP.hold?['safe','{{t:campaign.msg.015}}']:['look','{{t:campaign.msg.016}}'];
    if(soon)return CP.hold?['safe','{{t:campaign.msg.017}}']:['warn','{{t:campaign.msg.018}}'];
    return CP.hold?['warn','{{t:campaign.msg.019}}']:['safe','{{t:campaign.msg.020}}'];
  }
  function cpUI(){
    var live=CP.phase==='run',sig=cpSignal(),nx=cpNextMilestone(CP.awarded);
    cpText('cp-votes',fmt(CP.votes));cpText('cp-miss',CP.miss+' / '+CP_MAX_MISS);cpText('cp-lap',cpPassed()+' 棟');cpText('cp-next',fmt(nx[0])+' 票 · +'+nx[1]);
    cpText('cp-best',fmt(CP.best));
    $('cp-miss').style.color=CP.miss>=3?'var(--crush)':'';
    cpText('cp-signal',sig[1]);$('cp-signal').dataset.state=sig[0];
    $('cp-amount').disabled=CP.active;$('cp-go').disabled=live||cpRank.busy();
    cpText('cp-go',live?'{{t:campaign.msg.021}}':CP.phase==='ready'?'{{t:campaign.msg.022}}':'{{t:campaign.msg.023}}');
    $('cp-hold').disabled=!live;cpText('cp-hold',CP.hold?'{{t:campaign.msg.024}}':'{{t:campaign.msg.025}}');
  }
  function cpStart(){
    if(CP.phase==='run'||cpRank.busy())return;
    var stake=ENTRY_FEE;
    if(stake>S.balance){cpSay(LOW_MSG,'lose');return;}
    cpRank.start(function(random){
    CP.analytics=AN.start('campaign',stake);CP.stake=stake;CP.active=true;save();renderAll();
    campaignRules.create(random||Math.random,function(event,data){
      if(event==='lost')cpLose(data);
      else if(event==='settled')cpMilestones();
      else if(event==='progress')AN.progress(CP.analytics,{step:cpPassed(),votes:CP.votes,misses:CP.miss});
      else if(event==='float')cpFloat(data.lot,data.text,data.kind);
    },CP);CP.floats=[];CP.pops=[];CP.earned=0;CP.awarded=0;CP.phase='run';CP.last=performance.now();cpRelease();
    cpSay('{{t:campaign.msg.026}}');cpUI();campaignCanvas.focus();
    },cpUI);
  }
  // Phones: canvas is always 640 logical px wide and as tall as the screen needs; the 460px scene sits in the middle, sky above, mute pad below.
  var cpFs=window.matchMedia('(max-width:880px), (pointer:coarse) and (max-width:1100px)'),cpDy=0,cpBoxKey='';
  function cpFit(){
    var st=$('cp-stage'),r=st.getBoundingClientRect(),hl=460;
    if(cpFs.matches&&r.width>40&&r.height>40)hl=Math.max(460,Math.min(1600,Math.round(640*r.height/r.width)));
    var key=cpFs.matches+':'+hl;if(key!==cpBoxKey){cpBoxKey=key;campaignCanvas.height=hl;}
    cpDy=cpFs.matches?Math.round((hl-460)*.61):0;
    var v=$('view-campaign');v.classList.toggle('cp-run',cpFs.matches&&CP.phase==='run');v.classList.toggle('cp-sheet',cpFs.matches&&CP.phase!=='run');
  }
  $('cp-exit').addEventListener('click',function(){cpRelease();window.location.hash='lobby';});
  function cpSync(now){var dt=Math.max(0,(now-CP.last)/1000);CP.last=now;if(CP.phase==='run'&&!$('view-campaign').hidden&&!document.hidden)cpRank.update(dt*1000,()=>CP.phase==='run',step=>campaignRules.advance(CP,step));}

  /* drawing helpers */
  function cpRR(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
  var CP_PAL={'#1d4a5c':'#7a4e5e','#163a48':'#5a3a4c','#0f3040':'#3a2640','#0c2a36':'#2e1d33','#1a4152':'#6e4a5c','#235566':'#8a5a5c','#1f4b5b':'#7d5258','#e4f2f3':'#fff1dc','#1f5a4c':'#3f5a45','#cfe3e6':'#e8d8c8','#2b5872':'#7b5a73','#1f4257':'#4f3650','#356c85':'#946a80','#12303f':'#2a1b30','#9fc0c6':'#dcc6b8','#86a9b0':'#c7ab9f','#6f949c':'#a98f8a','#3d6a74':'#6e5260','#bfe6ee':'#ffe8b8','#e9fbff':'#fff3dc','#5d8c95':'#8c6f75','#f4ffff':'#fff8ec','#d3b9c0':'#d3b9c0','#1f6b5a':'#3f6b4d','#2a8a70':'#5c8a58','#8fe0b0':'#8fe0b0'};
  function cpC(c){return CP_PAL[c]||c;}
  function cpBox(g,x,y,w,h,color){g.fillStyle=cpC(color);g.fillRect(x,y,w,h);}
  function cpWindows(g,x,y,cols,rows,cw,ch,gx,gy,seed,on,off){for(var r=0;r<rows;r++)for(var c=0;c<cols;c++){g.fillStyle=cpC(((seed*7+r*3+c*5)%4)?on:off);g.fillRect(x+c*(cw+gx),y+r*(ch+gy),cw,ch);}}
  function cpBuilding(g,lot,x,t){
    var G=CP_GROUND,w=lot.w,h=lot.h,top=G-h,cx=x+w/2,i,warm='#ffd98a',dark='#0f3040';
    switch(lot.name){
    case '{{t:campaign.msg.004}}':
      cpBox(g,x+8,top,w-16,h,'#1d4a5c');cpBox(g,x+2,top-8,w-4,10,'#163a48');
      cpWindows(g,x+26,top+18,3,3,28,26,17,14,lot.seed,warm,dark);cpBox(g,cx-11,G-34,22,34,'#0c2a36');cpBox(g,cx-11,G-34,22,3,'#ffb638');break;
    case '{{t:campaign.msg.005}}':
      cpBox(g,x+6,top,w-12,h,'#1a4152');cpBox(g,x+w-52,top-18,26,18,'#163a48');cpBox(g,x+2,top-5,w-4,7,'#163a48');
      cpWindows(g,x+25,top+16,3,4,26,22,16,14,lot.seed,warm,dark);
      for(i=0;i<4;i++)cpBox(g,x+20,top+40+i*36,w-40,3,'#0f3040');break;
    case '{{t:campaign.msg.006}}':
      cpBox(g,x+6,top,w-12,h,'#235566');cpBox(g,x+16,top+6,w-32,22,'#0c2a36');
      for(i=0;i<9;i++)cpBox(g,x+4+i*((w-8)/9),top+34,(w-8)/9+.5,18,i%2?'#e4f2f3':'#ffb638');
      g.globalAlpha=.9;cpBox(g,x+18,G-56,w-70,40,warm);g.globalAlpha=1;cpBox(g,x+w-42,G-58,24,58,'#0c2a36');
      cpBox(g,x+24,G-50,10,28,'#e8a64a');cpBox(g,x+40,G-44,12,22,'#c96a4b');break;
    case '{{t:campaign.msg.007}}':
      cpBox(g,x+6,G-44,w-12,44,'#1f4b5b');
      for(i=0;i<3;i++){var mx=x+8+i*((w-16)/3),mw=(w-16)/3;g.fillStyle=i%2?'#ffb638':'#8fe0b0';g.beginPath();g.moveTo(mx,top+44);g.lineTo(mx+mw/2,top);g.lineTo(mx+mw,top+44);g.closePath();g.fill();cpBox(g,mx+mw/2-2,top+44,4,18,'#8d7254');}
      for(i=0;i<8;i++){g.fillStyle=['#ff6f61','#ffb638','#9ad17a'][i%3];g.beginPath();g.arc(x+26+i*((w-52)/7),G-50,7,0,7);g.fill();}break;
    case '{{t:campaign.msg.008}}':
      cpBox(g,x+10,G-62,78,62,'#235566');cpBox(g,x+w-88,G-62,78,62,'#1f4b5b');
      for(i=0;i<6;i++){cpBox(g,x+6+i*14.3,G-80,14.5,18,i%2?'#e4f2f3':'#ff6f61');cpBox(g,x+w-92+i*14.3,G-80,14.5,18,i%2?'#e4f2f3':'#8fe0b0');}
      g.globalAlpha=.85;cpBox(g,x+20,G-52,58,22,warm);cpBox(g,x+w-78,G-52,58,22,warm);g.globalAlpha=1;
      g.strokeStyle='#d3b9c0';g.lineWidth=1.5;g.beginPath();g.moveTo(x+4,top);g.quadraticCurveTo(cx,top+26,x+w-4,top);g.stroke();
      for(i=1;i<8;i++){var u=i/8,lx=x+4+(w-8)*u,ly=top+26*4*u*(1-u)*.5+2;g.fillStyle=i%2?'#ffb638':'#ff6f61';g.beginPath();g.arc(lx,ly+7,6+(reduceMotion?0:Math.sin(t*3+i)*.6),0,7);g.fill();}break;
    case '{{t:campaign.msg.009}}':
      cpBox(g,x,G-8,w,8,'#1f5a4c');
      [[38,58,30],[98,82,36],[154,52,26]].forEach(function(tr){cpBox(g,x+tr[0]-4,G-tr[1],8,tr[1],'#6b5238');g.fillStyle='#1f6b5a';g.beginPath();g.arc(x+tr[0],G-tr[1],tr[2],0,7);g.fill();g.fillStyle='#2a8a70';g.beginPath();g.arc(x+tr[0]-tr[2]*.3,G-tr[1]-tr[2]*.3,tr[2]*.55,0,7);g.fill();});
      cpBox(g,x+56,G-22,34,4,'#8d7254');cpBox(g,x+58,G-18,3,10,'#8d7254');cpBox(g,x+85,G-18,3,10,'#8d7254');break;
    case '{{t:campaign.msg.010}}':
      cpBox(g,x+10,G-12,w-20,12,'#8f8a80');cpBox(g,x+22,G-92,w-44,80,'#7a2f2a');
      for(i=0;i<4;i++)cpBox(g,x+28+i*((w-68)/3),G-92,12,80,'#b5483c');cpBox(g,cx-15,G-62,30,50,'#2a1512');
      [[0,G-92,w+8,22],[26,G-128,w-44,18]].forEach(function(r){var rx=x-4+r[0],ry=r[1],rw=r[2],rh=r[3];g.fillStyle='#ffb638';g.beginPath();g.moveTo(rx-8,ry-4);g.quadraticCurveTo(rx+6,ry-rh*.2,rx+18,ry-rh);g.lineTo(rx+rw-18,ry-rh);g.quadraticCurveTo(rx+rw-6,ry-rh*.2,rx+rw+8,ry-4);g.lineTo(rx+rw,ry+3);g.lineTo(rx,ry+3);g.closePath();g.fill();cpBox(g,rx+16,ry-rh-3,rw-32,4,'#d5912a');});
      cpBox(g,x+48,G-114,w-96,22,'#7a2f2a');g.fillStyle='#ff6f61';g.beginPath();g.arc(x+44,G-74,8,0,7);g.arc(x+w-44,G-74,8,0,7);g.fill();break;
    case '{{t:campaign.msg.001}}':
      cpBox(g,x+6,G-118,w-12,118,'#2b5872');cpBox(g,x+2,G-124,w-4,8,'#1f4257');
      cpBox(g,cx-38,top+22,76,h-22,'#356c85');g.fillStyle='#1f4257';g.beginPath();g.moveTo(cx-46,top+24);g.lineTo(cx,top-4);g.lineTo(cx+46,top+24);g.closePath();g.fill();
      g.fillStyle='#e9fbff';g.beginPath();g.arc(cx,top+52,15,0,7);g.fill();g.strokeStyle='#1f4257';g.lineWidth=2.5;g.beginPath();g.moveTo(cx,top+52);g.lineTo(cx,top+42);g.moveTo(cx,top+52);g.lineTo(cx+8,top+56);g.stroke();
      cpWindows(g,x+18,G-104,2,2,22,24,10,14,lot.seed,'#bfe6ee',dark);cpWindows(g,x+w-72,G-104,2,2,22,24,10,14,lot.seed+1,'#bfe6ee',dark);cpBox(g,cx-14,G-40,28,40,'#12303f');
      cpBox(g,x+14,top-22,3,52,'#cfe3e6');g.fillStyle='#ffb638';g.beginPath();g.moveTo(x+17,top-22);g.lineTo(x+42,top-15+(reduceMotion?0:Math.sin(t*5)*2));g.lineTo(x+17,top-7);g.closePath();g.fill();break;
    case '{{t:campaign.msg.002}}':
      if (cpFs.matches && cpMobileHospital.naturalWidth) {
        g.drawImage(cpMobileHospital, x, G - 268, w, 268);
        cpBox(g, cx-39, G-220, 78, 28, '#553b58');
        g.font = '700 18px '+CP_FONT;g.fillStyle = '#fff0d8';g.textAlign = 'center';
        g.textBaseline = 'middle';g.fillText(lot.name, cx, G-205, 73);
        break;
      }
      cpBox(g,x+8,top,w-16,h,'#9fc0c6');cpBox(g,x+8,top,22,h,'#86a9b0');cpBox(g,x+2,top-6,w-4,8,'#6f949c');
      cpWindows(g,x+42,top+58,4,3,22,20,10,12,lot.seed,'#e9fbff','#5d8c95');
      g.fillStyle='#f4ffff';g.beginPath();g.arc(cx+10,top+32,22,0,7);g.fill();cpBox(g,cx+4,top+16,12,32,'#ff6f61');cpBox(g,cx-6,top+26,32,12,'#ff6f61');
      cpBox(g,cx-30,G-44,80,6,'#ff6f61');cpBox(g,cx-16,G-38,52,38,'#3d6a74');cpBox(g,cx+9,G-38,2,38,'#9fc0c6');break;
    case '{{t:campaign.msg.003}}':
      cpBox(g,x+26,G-104,w-52,104,'#3d3760');g.fillStyle='#2a2547';g.beginPath();g.moveTo(x+12,G-102);g.lineTo(cx,top-4);g.lineTo(x+w-12,G-102);g.closePath();g.fill();cpBox(g,x+w-66,top+6,16,34,'#2a2547');
      g.fillStyle=warm;g.beginPath();g.arc(cx,top+34,10,0,7);g.fill();
      for(i=0;i<4;i++)cpBox(g,x+40+i*((w-92)/3),G-98,12,98,'#cfc8ee');
      cpWindows(g,x+58,G-84,2,1,22,30,w-160,0,lot.seed,warm,warm);g.fillStyle='#1c1836';g.beginPath();g.arc(cx,G-44,15,Math.PI,0);g.fill();cpBox(g,cx-15,G-44,30,44,'#1c1836');
      g.strokeStyle='#a89fe0';g.lineWidth=2;for(i=0;i<=14;i++){var fx0=x+4+i*((w-8)/14);if(Math.abs(fx0-cx)<22)continue;g.beginPath();g.moveTo(fx0,G-28);g.lineTo(fx0,G);g.stroke();}
      g.beginPath();g.moveTo(x+4,G-22);g.lineTo(cx-22,G-22);g.moveTo(cx+22,G-22);g.lineTo(x+w-4,G-22);g.stroke();break;
    }
    var age=t-lot.flash;
    if(age>=0&&age<.55){g.globalAlpha=.4*(1-age/.55);cpBox(g,x,top-10,w,h+10,lot.good?'#8fe0b0':'#ff6f61');g.globalAlpha=1;}
    // Name plates identify the scrolling buildings and quiet zones.
    g.textAlign='center';g.textBaseline='middle';
    if(lot.quiet){
      if (cpFs.matches) {
        var signX = x + 10, signY = G - 43;
        g.fillStyle = '#24483f';g.strokeStyle = '#a6f2cc';g.lineWidth = 2;
        cpRR(g,signX,signY,97,32,8);g.fill();g.stroke();
        g.fillStyle = '#dcffe9';g.font = '700 16px '+CP_FONT;
        g.fillText('{{t:campaign.msg.044}}',signX+48.5,signY+16,88);
        return;
      }
      var near=CP.phase==='run'&&lot.x0-(CP.dist+CP_TRUCK)<260&&lot.x1>CP.dist+CP_TRUCK,py=top-34+(near&&!reduceMotion?Math.sin(t*9)*2:0);
      g.fillStyle='#ff6f61';cpRR(g,cx-62,py-14,124,28,14);g.fill();g.beginPath();g.moveTo(cx-7,py+13);g.lineTo(cx,py+22);g.lineTo(cx+7,py+13);g.closePath();g.fill();
      g.fillStyle='#2a0f0b';g.font='700 15px '+CP_FONT;g.fillText(lot.name+' · 要安靜',cx,py+1);
    }else{
      g.fillStyle='rgba(28,16,40,.72)';cpRR(g,cx-28,top-32,56,22,11);g.fill();g.fillStyle='#f0dcd6';g.font='600 14px '+CP_FONT;g.fillText(lot.name,cx,top-20);
    }
  }
  function cpTruck(g,x,t,live){
    var y=live&&!reduceMotion?Math.sin(t*20)*.9:0,i,muted=CP.hold&&live,gold='#ffc247',red='#d93c36',blue='#2c5aa8',cream='#fff4de';
    // sound rings spread from the roof horns while broadcasting
    if(live&&!CP.hold){for(i=0;i<3;i++){var r=16+((t*60+i*17)%58);g.globalAlpha=Math.max(0,.85-r/76);g.strokeStyle=gold;g.lineWidth=3;g.lineCap='round';g.beginPath();g.arc(x-6,326+y,reduceMotion?20+i*14:r,Math.PI*1.1,Math.PI*1.9);g.stroke();g.lineCap='butt';}g.globalAlpha=1;}
    // headlight cone on the road
    var hl=g.createLinearGradient(x+68,392,x+230,392);hl.addColorStop(0,'rgba(255,226,150,.5)');hl.addColorStop(1,'rgba(255,226,150,0)');g.fillStyle=hl;g.beginPath();g.moveTo(x+66,388+y);g.lineTo(x+230,372);g.lineTo(x+230,430);g.lineTo(x+66,404+y);g.closePath();g.fill();
    g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(x,431,76,7,0,0,7);g.fill();
    // flag pole + swaying flag at the back
    g.fillStyle='#e8d8c8';g.fillRect(x-70,306+y,3,60);var fl=reduceMotion?0:Math.sin(t*9)*3;g.fillStyle=red;g.beginPath();g.moveTo(x-67,308+y);g.quadraticCurveTo(x-84,310+y+fl,x-98,308+y+fl*1.4);g.lineTo(x-98,322+y+fl*1.4);g.quadraticCurveTo(x-84,324+y+fl,x-67,322+y);g.closePath();g.fill();g.fillStyle=blue;g.fillRect(x-98,308+y+fl*1.4,12,7);
    // cargo box: cream body with a red/blue skirt
    g.fillStyle=cream;cpRR(g,x-68,334+y,98,70,8);g.fill();g.fillStyle='rgba(120,70,90,.14)';g.fillRect(x-68,388+y,98,16);
    g.fillStyle=red;g.fillRect(x-68,392+y,98,6);g.fillStyle=blue;g.fillRect(x-68,398+y,98,6);
    // big banner board on the box side
    g.fillStyle=red;cpRR(g,x-60,342+y,82,40,5);g.fill();g.strokeStyle=gold;g.lineWidth=2;cpRR(g,x-57,345+y,76,34,4);g.stroke();
    g.fillStyle=gold;g.font='900 19px '+CP_FONT;g.textAlign='center';g.textBaseline='middle';g.fillText('{{t:campaign.msg.027}}',x-19,363+y);
    g.fillStyle='#fff4de';g.beginPath();for(i=0;i<5;i++){g.arc(x-50+i*8,350+y,1.6,0,7);g.closePath();}g.fill();
    // cab
    g.fillStyle=cream;g.beginPath();g.moveTo(x+30,350+y);g.lineTo(x+52,350+y);g.quadraticCurveTo(x+62,366+y,x+70,378+y);g.lineTo(x+70,404+y);g.lineTo(x+30,404+y);g.closePath();g.fill();
    g.fillStyle='#3a4c70';g.beginPath();g.moveTo(x+35,356+y);g.lineTo(x+50,356+y);g.quadraticCurveTo(x+57,368+y,x+62,376+y);g.lineTo(x+35,376+y);g.closePath();g.fill();g.fillStyle='rgba(255,255,255,.28)';g.beginPath();g.moveTo(x+38,358+y);g.lineTo(x+44,358+y);g.lineTo(x+40,376+y);g.lineTo(x+35,376+y);g.closePath();g.fill();
    g.fillStyle=red;g.fillRect(x+30,392+y,40,6);g.fillStyle=blue;g.fillRect(x+30,398+y,40,6);
    g.fillStyle='#ffe6a0';cpRR(g,x+63,384+y,8,8,2);g.fill();g.fillStyle='#8a6a80';g.fillRect(x+66,402+y,9,5);
    // roof rack with two horns
    g.fillStyle='#4a3650';g.fillRect(x-58,328+y,76,5);
    [-44,-8].forEach(function(hx){var hot=live&&!CP.hold;g.fillStyle=muted?'#8a7a88':'#d6d0cc';g.beginPath();g.moveTo(x+hx-6,328+y);g.lineTo(x+hx-12,312+y);g.lineTo(x+hx+14,308+y);g.lineTo(x+hx+8,328+y);g.closePath();g.fill();g.fillStyle=muted?'#5a4a5a':(hot?'#ffe08a':'#7a6a7a');g.beginPath();g.ellipse(x+hx+14,310+y,3.5,8.5,0,0,7);g.fill();g.fillStyle='#4a3650';g.fillRect(x+hx-3,326+y,6,4);});
    if(muted){g.strokeStyle='#ff6f61';g.lineWidth=4;g.lineCap='round';g.beginPath();g.moveTo(x-54,336+y);g.lineTo(x+10,304+y);g.stroke();g.lineCap='butt';}
    // wheels with arches
    [[-38,416],[42,416]].forEach(function(wh){g.fillStyle='#2a1b30';g.beginPath();g.arc(x+wh[0],wh[1]-4,17,Math.PI,0);g.fill();g.fillStyle='#1c1226';g.beginPath();g.arc(x+wh[0],wh[1],13,0,7);g.fill();g.fillStyle='#b9a4aa';g.beginPath();g.arc(x+wh[0],wh[1],6,0,7);g.fill();g.strokeStyle='#6a4a62';g.lineWidth=2;g.beginPath();g.moveTo(x+wh[0]+Math.cos(CP.wheel)*10,wh[1]+Math.sin(CP.wheel)*10);g.lineTo(x+wh[0]-Math.cos(CP.wheel)*10,wh[1]-Math.sin(CP.wheel)*10);g.moveTo(x+wh[0]+Math.sin(CP.wheel)*10,wh[1]-Math.cos(CP.wheel)*10);g.lineTo(x+wh[0]-Math.sin(CP.wheel)*10,wh[1]+Math.cos(CP.wheel)*10);g.stroke();});
  }
  var cpMobileTruck = new Image(), cpMobileHospital = new Image();
  cpMobileTruck.src = 'games/campaign/art/truck.svg';
  cpMobileHospital.src = 'games/campaign/art/hospital.svg';

  function cpMuteIcon(g, x, y, color) {
    g.save();
    g.translate(x, y);
    g.strokeStyle = color;
    g.lineWidth = 3;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(0, 8);g.lineTo(7, 8);g.lineTo(17, 1);g.lineTo(17, 25);
    g.lineTo(7, 18);g.lineTo(0, 18);g.closePath();
    g.moveTo(24, 8);g.lineTo(33, 17);g.moveTo(33, 8);g.lineTo(24, 17);
    g.stroke();
    g.restore();
  }

  function cpMobileVehicle(g, t, live) {
    if (!cpMobileTruck.naturalWidth) { cpTruck(g, CP_TRUCK, t, live); return; }
    var x = CP_TRUCK, y = CP_GROUND + 99, bounce = live && !reduceMotion ? Math.sin(t * 20) : 0;
    g.fillStyle = 'rgba(25,18,43,.62)';
    g.beginPath();g.ellipse(x, y, 129, 13, 0, 0, Math.PI * 2);g.fill();
    g.drawImage(cpMobileTruck, x - 135, y - 214 + bounce, 270, 220);
    if (!live) return;
    if (CP.hold) {
      g.fillStyle = '#244d43';g.strokeStyle = '#a6f2cf';g.lineWidth = 2;
      g.beginPath();g.arc(x + 56, y - 215, 27, 0, Math.PI * 2);g.fill();g.stroke();
      cpMuteIcon(g, x + 40, y - 228, '#dcffeb');
    } else {
      g.lineCap = 'round';g.lineWidth = 4;g.strokeStyle = '#ffe2a0';
      for (var r = 18; r <= 34; r += 16) {
        g.beginPath();g.arc(x + 38, y - 175, r, -.72, .72);g.stroke();
      }
      g.lineCap = 'butt';
    }
  }

  function cpMobileHud(g, height, live) {
    var current = CP.lots[CP.idx], inside = current && CP.dist + CP_TRUCK >= current.x0;
    var next = inside ? CP.lots[CP.idx + 1] : current;
    var signal = cpSignal(), caution = signal[0] !== 'safe';
    var ink = '#fff1d7', quiet = '#d6ffe8', warning = '#ffe0a4';
    var padTop = height - Math.min(190, Math.round(height * .18));
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.font = '600 20px ' + CP_FONT;g.fillStyle = '#e7d4e2';
    g.fillText('{{t:campaign.msg.028}}', 120, 32);
    g.font = '800 48px ' + CP_FONT;g.fillStyle = ink;
    g.fillText(fmt(CP.votes), 119, 72, 220);
    g.textAlign = 'right';
    g.font = '700 20px ' + CP_FONT;
    g.fillText(cpMobileText('{{t:campaign.msg.036}}', CP.miss, CP_MAX_MISS), 613, 32, 240);
    for (var i = 0; i < CP_MAX_MISS; i++) {
      g.beginPath();g.arc(487 + i * 29, 72, 9, 0, Math.PI * 2);
      if (i < CP.miss) { g.fillStyle = '#ff9b8e';g.fill(); }
      else { g.strokeStyle = '#b49ab5';g.lineWidth = 2;g.stroke(); }
    }
    cpBox(g, 26, 110, 588, 1, '#a988a8');
    g.font = '600 18px ' + CP_FONT;g.fillStyle = '#eedbea';
    g.textAlign = 'left';
    g.fillText(cpMobileText('{{t:campaign.msg.037}}', cpPassed(), (cpSpeed() / CP_V0).toFixed(1)), 27, 140, 315);
    if (next) {
      g.textAlign = 'right';
      g.fillText(cpMobileText('{{t:campaign.msg.038}}', next.name), 613, 140, 252);
    }
    if (!live) return;
    g.font = '700 19px ' + CP_FONT;g.textAlign = 'center';
    var label = signal[1];
    if (inside && current.quiet && CP.hold) {
      label = cpMobileText('{{t:campaign.msg.039}}', current.name);
    }
    var tagWidth = Math.max(200, Math.min(590, g.measureText(label).width + 54));
    g.fillStyle = caution ? '#59432e' : '#25483f';
    g.strokeStyle = caution ? '#ffc684' : '#a6f2cc';g.lineWidth = 2;
    cpRR(g, (640 - tagWidth) / 2, 180, tagWidth, 50, 25);g.fill();g.stroke();
    g.fillStyle = caution ? warning : quiet;
    g.fillText(label, 320, 206, tagWidth - 30);
    var pad = g.createLinearGradient(0, padTop, 0, height);
    pad.addColorStop(0, 'rgba(90,210,177,0)');
    pad.addColorStop(1, CP.hold ? 'rgba(90,210,177,.22)' : 'rgba(255,191,119,.15)');
    g.fillStyle = pad;g.fillRect(0, padTop, 640, height - padTop);
    g.strokeStyle = CP.hold ? '#a6e8ca' : '#f3c991';
    g.lineWidth = 2;
    var top = padTop + 18, bottom = height - 30;
    g.beginPath();
    g.moveTo(38, top+15);g.lineTo(38, top);g.lineTo(56, top);
    g.moveTo(584, top);g.lineTo(602, top);g.lineTo(602, top+15);
    g.moveTo(38, bottom-15);g.lineTo(38, bottom);g.lineTo(56, bottom);
    g.moveTo(584, bottom);g.lineTo(602, bottom);g.lineTo(602, bottom-15);
    g.stroke();
    g.fillStyle = CP.hold ? quiet : ink;g.font = '800 34px ' + CP_FONT;
    g.fillText(CP.hold ? '{{t:campaign.msg.040}}' : '{{t:campaign.msg.041}}', 320, (top+bottom)/2-15, 500);
    g.font = '600 19px ' + CP_FONT;
    g.fillText(CP.hold ? '{{t:campaign.msg.042}}' : '{{t:campaign.msg.043}}', 320, (top+bottom)/2+20, 500);
  }

  function cpMobileText(template, ...values) {
    var i18n = window.deepSeaI18n;
    return (i18n ? i18n.text(template) : template).replace(/\{(\d+)\}/g, (_, index) => {
      var value = String(values[index]);
      return i18n ? i18n.text(value) : value;
    });
  }

  function cpDraw(){
    cpFit();var g=campaignCtx,W=640,H=460,Hl=campaignCanvas.height,dy=cpDy,fs=cpFs.matches,G=CP_GROUND,live=CP.phase==='run',t=CP.clock,cam=CP.dist,i,x;
    g.clearRect(0,0,W,Hl);g.save();g.translate(0,dy);
    var sky=g.createLinearGradient(0,-dy,0,G);sky.addColorStop(0,'#241f52');sky.addColorStop(.5,'#7b4a7e');sky.addColorStop(.82,'#e4846f');sky.addColorStop(1,'#ffc86e');g.fillStyle=sky;g.fillRect(0,-dy,W,G+dy);
    for(i=0;i<14+Math.floor(dy/22);i++){var sty=((i*37)%(100+dy))-dy+8;g.globalAlpha=Math.max(0,.55-(sty+dy)/(330+dy)*.4)*(.7+.3*Math.sin(t*1.6+i*2.1));cpBox(g,(i*97+31)%W,sty,2,2,'#fff1dc');}g.globalAlpha=1;
    var sunY = G - (fs ? Math.min(400, Math.round((Hl - 250) * .36)) : 34);
    var sun = g.createRadialGradient(470,sunY,4,470,sunY,210);
    sun.addColorStop(0,'rgba(255,244,200,.95)');sun.addColorStop(.28,'rgba(255,214,140,.48)');sun.addColorStop(1,'rgba(255,170,110,0)');
    g.fillStyle=sun;g.fillRect(0,-dy,W,G+dy);
    g.fillStyle=fs?'#ffba79':'#fff0c8';g.beginPath();g.arc(470,sunY,fs?92:26,0,7);g.fill();
    // soft clouds drift by themselves and a little with the street
    [[90,128,92,13],[330,92,120,15],[560,160,80,11],[210,196,70,9]].forEach(function(c,ci){var cx=((c[0]-t*(5+ci*2)-cam*.04)%(W+240)+W+240)%(W+240)-120;g.fillStyle=ci%2?'rgba(255,196,170,.34)':'rgba(255,224,196,.28)';g.beginPath();g.ellipse(cx,c[1],c[2],c[3],0,0,7);g.ellipse(cx-c[2]*.38,c[1]+c[3]*.4,c[2]*.55,c[3]*.8,0,0,7);g.ellipse(cx+c[2]*.42,c[1]+c[3]*.35,c[2]*.5,c[3]*.75,0,0,7);g.fill();});
    // distant hills, then two skyline layers moving at different speeds (parallax)
    var hill=cam*.08;g.fillStyle='#6a4670';g.beginPath();g.moveTo(0,G);for(x=0;x<=W;x+=16)g.lineTo(x,G-70-Math.sin((x+hill)*.012)*26-Math.sin((x+hill)*.031)*10);g.lineTo(W,G);g.closePath();g.fill();
    var far=cam*.16,k0=Math.floor(far/74);
    for(i=-1;i<10;i++){var k=k0+i,fh=70+((k*37)%7+7)%7*14;cpBox(g,k*74-far,G-fh,66,fh,'#533a68');cpBox(g,k*74-far+8,G-fh+10,5,7,'rgba(255,214,140,.38)');cpBox(g,k*74-far+30,G-fh+28,5,7,'rgba(255,214,140,.26)');cpBox(g,k*74-far+48,G-fh+46,5,7,'rgba(255,214,140,.32)');}
    var mid=cam*.34,m0=Math.floor(mid/58);
    for(i=-1;i<12;i++){var m=m0+i,mh=44+((m*53)%6+6)%6*13,mx2=m*58-mid;cpBox(g,mx2,G-mh,52,mh,'#3d2a55');cpBox(g,mx2,G-mh,52,3,'#5a4272');for(var wy=G-mh+10;wy<G-8;wy+=16){if((m*7+wy)%3)cpBox(g,mx2+9,wy,6,8,'rgba(255,214,140,.55)');if((m*5+wy)%4>1)cpBox(g,mx2+32,wy,6,8,'rgba(255,214,140,.4)');}}
    // street: warm sidewalk, curb, asphalt, painted dashes
    cpBox(g,0,G,W,18,'#a98f90');cpBox(g,0,G+15,W,4,'#e2cbb6');cpBox(g,0,G+19,W,85,'#3b3345');var hs=Hl-dy,fgr=g.createLinearGradient(0,G+104,0,Math.max(hs,G+105));fgr.addColorStop(0,'#322a43');fgr.addColorStop(1,'#140e1d');g.fillStyle=fgr;g.fillRect(0,G+104,W,Math.max(0,hs-G-104));
    if(hs>G+170){var ly=G+104+(hs-G-104)*.3;for(x=-((cam*1.6)%240);x<W;x+=240)cpBox(g,x,ly,120,7,'rgba(255,230,180,.22)');}
    g.fillStyle='rgba(255,200,130,.12)';g.fillRect(0,G+19,W,12);
    for(x=-(cam%90);x<W;x+=90)cpBox(g,x,G+62,46,4,'rgba(255,230,180,.45)');
    // quiet stretches painted on the road
    CP.lots.forEach(function(lot){
      var sx=lot.x0-cam;if(!lot.quiet||sx>W||sx+lot.w<0)return;
      var depth=fs?124:86;
      g.save();g.beginPath();g.rect(sx,G+18,lot.w,depth);g.clip();cpBox(g,sx,G+18,lot.w,depth,fs?'rgba(48,119,102,.50)':'rgba(255,111,97,.2)');
      g.strokeStyle=fs?'rgba(172,249,213,.30)':'rgba(255,111,97,.38)';g.lineWidth=6;for(var hx=sx-depth;hx<sx+lot.w;hx+=26){g.beginPath();g.moveTo(hx,G+18+depth);g.lineTo(hx+depth,G+18);g.stroke();}g.restore();
      cpBox(g,sx,G+18,3,depth,fs?'#9af0cb':'#ff6f61');cpBox(g,sx+lot.w-3,G+18,3,depth,fs?'#9af0cb':'#ff6f61');
    });
    CP.lots.forEach(function(lot){var sx=lot.x0-cam;if(sx<W+20&&sx+lot.w>-20)cpBuilding(g,lot,sx,t);});
    if (fs) cpMobileVehicle(g,t,live);
    else cpTruck(g,CP_TRUCK,t,live);
    // power poles in front make the speed readable; campaign bunting is strung between them
    var near=cam*1.25,pole0=-(near%330)-20,flagC=['#d93c36','#fff1dc','#2c5aa8','#ffc247'];
    for(x=fs?W+400:pole0-330;x<W+400;x+=330){
      for(i=0;i<2;i++){var ax=x+3,bx=x+333,top0=G-112+i*14,sag=26;g.strokeStyle='rgba(28,18,38,.8)';g.lineWidth=1.4;g.beginPath();g.moveTo(ax,top0);g.quadraticCurveTo((ax+bx)/2,top0+sag*2,bx,top0);g.stroke();
        if(i===0)for(var f=1;f<14;f++){var u=f/14,fx=ax+(bx-ax)*u,fy=top0+sag*4*u*(1-u),sw=reduceMotion?0:Math.sin(t*4+f*.9+x*.01)*1.6;g.fillStyle=flagC[f%4];g.beginPath();g.moveTo(fx-5,fy);g.lineTo(fx+5,fy);g.lineTo(fx+sw,fy+13);g.closePath();g.fill();}}
      cpBox(g,x,G-122,6,226,'#1c1226');cpBox(g,x-18,G-114,42,5,'#1c1226');cpBox(g,x-12,G-104,30,4,'#1c1226');
      g.globalAlpha=.14;g.fillStyle='#ffd98a';g.beginPath();g.moveTo(x-10,G-118);g.lineTo(x+16,G-118);g.lineTo(x+64,G+104);g.lineTo(x-58,G+104);g.closePath();g.fill();g.globalAlpha=1;cpBox(g,x-12,G-119,28,4,'#ffd98a');
    }
    g.restore();
    // vignette + warm dusk wash
    var vg=g.createRadialGradient(W/2,Hl*.55,Hl*.3,W/2,Hl*.55,Hl*.95);vg.addColorStop(0,'rgba(20,8,32,0)');vg.addColorStop(1,'rgba(20,8,32,.5)');g.fillStyle=vg;g.fillRect(0,0,W,Hl);
    g.save();g.translate(0,dy);
    // floating results
    g.textAlign='center';g.textBaseline='middle';
    CP.floats.forEach(function(f){var age=t-f.t;if(age<0||age>1.1)return;g.globalAlpha=Math.min(1,(1.1-age)*2);g.font='700 17px '+CP_FONT;g.fillStyle=f.kind==='bad'?'#ff6f61':f.kind==='good'?'#8fe0b0':f.kind==='gain'?'#ffb638':'#d3b9c0';g.lineWidth=5;g.strokeStyle='#1c1226';var sx=Math.max(70,Math.min(W-70,f.x-cam)),sy=Math.max(118,f.y-age*24);g.strokeText(f.text,sx,sy);g.fillText(f.text,sx,sy);});
    g.globalAlpha=1;
    g.restore();
    if (fs) cpMobileHud(g,Hl,live);
    else {
    // HUD: votes, route progress and speed, strikes (screen space)
    cpBox(g,0,0,W,96,'rgba(28,16,40,.8)');cpBox(g,0,96,W,1,'#6a4a62');
    g.textAlign='left';g.fillStyle='#d3b9c0';g.font='12px '+CP_FONT;g.fillText('{{t:campaign.msg.028}}',16,16);g.fillStyle='#e4f2f3';g.font='700 30px "Chakra Petch",'+CP_FONT;g.fillText(fmt(CP.votes),16,42);
    var prog=Math.max(0,Math.min(1,(cpSpeed()-CP_V0)/(CP_VMAX-CP_V0)));
    g.textAlign='center';g.fillStyle='#d3b9c0';g.font='12px '+CP_FONT;g.fillText('車速 '+(cpSpeed()/CP_V0).toFixed(1)+'× · 已過 '+cpPassed()+' 棟 · 本局 +'+CP.earned+' 點',W/2,16);
    g.fillStyle='#3a2640';cpRR(g,200,32,240,10,5);g.fill();g.fillStyle='#ffc247';cpRR(g,200,32,Math.max(10,240*prog),10,5);g.fill();cpBox(g,436,28,3,18,'#ffc247');
    g.textAlign='right';g.fillStyle='#d3b9c0';g.font='12px '+CP_FONT;g.fillText('吵到 '+CP.miss+' / '+CP_MAX_MISS+' 次',W-16,16);
    for(i=0;i<CP_MAX_MISS;i++){g.beginPath();g.arc(W-24-(CP_MAX_MISS-1-i)*24,40,8,0,7);if(i<CP.miss){g.fillStyle='#ff6f61';g.fill();}else{g.lineWidth=1.5;g.strokeStyle='#8a6a80';g.stroke();}}
    // upcoming buildings
    g.textAlign='left';g.fillStyle='#d3b9c0';g.font='12px '+CP_FONT;g.fillText('{{t:campaign.msg.029}}',16,75);
    for(i=0;i<6;i++){var up=CP.lots[CP.idx+i],ux=66+i*95;if(!up)break;
      g.fillStyle=up.quiet?'rgba(255,111,97,.22)':'#3a2640';cpRR(g,ux,62,84,26,13);g.fill();g.lineWidth=i===0?2:1;g.strokeStyle=up.quiet?'#ff6f61':i===0?'#d3b9c0':'#6a4a62';g.stroke();
      g.fillStyle=up.quiet?'#ff9a8f':'#f0dcd6';g.font='600 13px '+CP_FONT;g.textAlign='center';g.fillText(up.quiet?up.name+' 靜':up.name,ux+42,76);
      if(i<5){g.fillStyle='#8a6a80';g.fillText('›',ux+89.5,75);}}
    g.textAlign='center';g.fillStyle=live?(CP.hold?'#d3b9c0':'#8fe0b0'):'#d3b9c0';
    g.font='600 14px '+CP_FONT;
    g.fillText(live?(CP.hold?'{{t:campaign.msg.030}}':'{{t:campaign.msg.031}}'):'{{t:campaign.msg.032}}',W/2,Hl-13);
    }
    g.save();g.translate(0,dy);
    CP.pops.forEach(function(p){g.globalAlpha=Math.max(0,1-p.age/2.2);var py=190-(reduceMotion?0:Math.min(1,p.age*3)*22);g.textAlign='center';g.fillStyle='#ffb638';g.font='700 38px '+CP_FONT;g.fillText('+'+p.b+' 點',W/2,py);g.fillStyle='#e4f2f3';g.font='600 17px '+CP_FONT;g.fillText('得票 '+fmt(p.v)+' 里程碑',W/2,py+28);g.globalAlpha=1;});
    if(!live){
      g.fillStyle='rgba(28,16,40,.92)';cpRR(g,150,150,340,104,12);g.fill();g.lineWidth=1;g.strokeStyle='#6a4a62';g.stroke();
      g.fillStyle=CP.phase==='lost'?'#ff6f61':'#8fe0b0';g.font='700 24px '+CP_FONT;
      g.fillText(CP.phase==='ready'?'{{t:campaign.msg.033}}':'{{t:campaign.msg.034}}',W/2,186);
      g.fillStyle='#e4f2f3';g.font='14px '+CP_FONT;
      g.fillText(CP.phase==='ready'?'{{t:campaign.msg.035}}':'最終 '+fmt(CP.votes)+' 票 · 過了 '+cpPassed()+' 棟'+(CP.earned>0?' · 入帳 +'+fmt(CP.earned)+' 點':''),W/2,222);
    }
    g.restore();g.textBaseline='alphabetic';g.textAlign='left';
  }
  function cpPress(e){if(e.button!==undefined&&e.button!==0)return;if(CP.phase!=='run'||$('view-campaign').hidden||document.hidden)return;e.preventDefault();cpSync(performance.now());if(CP.phase!=='run')return;campaignCanvas.focus();campaignPointers.add(e.pointerId);cpHold(true);try{e.currentTarget.setPointerCapture(e.pointerId);}catch(_){}cpUI();}
  function cpLift(e){cpSync(performance.now());campaignPointers.delete(e.pointerId);cpHold(campaignPointers.size>0||campaignKeys.size>0);}
  [campaignCanvas,$('cp-hold')].forEach(function(el){el.addEventListener('pointerdown',cpPress);['pointerup','pointercancel','lostpointercapture'].forEach(function(type){el.addEventListener(type,cpLift);});el.addEventListener('contextmenu',function(e){e.preventDefault();});});
  $('cp-go').addEventListener('click',cpStart);
  addEventListener('keydown',function(e){if($('view-campaign').hidden||document.hidden||CP.phase!=='run'||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;if(['INPUT','BUTTON','A','SUMMARY'].indexOf(e.target.tagName)>=0)return;if(e.code==='Space'){e.preventDefault();cpSync(performance.now());if(CP.phase==='run'){campaignKeys.add(e.code);cpHold(true);}}});
  addEventListener('keyup',function(e){if(e.code!=='Space')return;if(!$('view-campaign').hidden)e.preventDefault();cpSync(performance.now());campaignKeys.delete(e.code);cpHold(campaignPointers.size>0||campaignKeys.size>0);});
  addEventListener('blur',function(){cpRelease();CP.last=performance.now();});
  document.addEventListener('visibilitychange',function(){cpRelease();CP.last=performance.now();});
  window.addEventListener('hashchange',function(){cpRelease();CP.last=performance.now();});
  function cpLoop(now){cpSync(now);if(!$('view-campaign').hidden&&!document.hidden){cpUI();cpDraw();}requestAnimationFrame(cpLoop);}
  campaignRules.create(Math.random, null, CP);CP.phase='ready';cpUI();cpDraw();requestAnimationFrame(cpLoop);


