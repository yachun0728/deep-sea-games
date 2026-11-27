/* 行人地獄（Just Want Boba）：固定步進的遊戲規則。瀏覽器與排行榜 Worker 共用，只能用傳入的 rng 取亂數。 */
const pedestrianHellRules = (() => {
  const COLS=5,ARCADE=3,GOAL=50,HOP=.18,JOG_TAIL=.13,JOG_FPS=17;
  /* 操作代碼：0 往前、1 往後、2 往左、3 往右 */
  const DIRS=[[0,1],[0,-1],[-1,0],[1,0]];
  /* 第幾杯決定難度；第 6 杯以後維持同一難度。REST 是插吸管喝珍奶的過關動畫時間，CLOSE 是打烊時間（秒，需小於排行榜重播上限 600） */
  const REST=3.4,CLOSE=570;
  /* 第 1～4 杯慢慢變難；第 5 杯起是超級地獄（使用者指定）：車快、車密、警告和綠燈都短。
     直行車仍固定在畫面外約 1 秒就跳警告，再快也看得到 */
  function levelOf(cup){
    if(cup>=5){const h=Math.min(cup-5,4);return {hell:true,speed:1.76+.05*h,wait:.45-.015*h,gap:2.55-.07*h,density:.86,warn:.8-.025*h,extra:2,dogs:1,green:2.7-.08*h};}
    const L=cup-1;return {hell:false,speed:1+.09*L,wait:1-.08*L,gap:4-.2*L,density:.68+.025*L,warn:1.3-.07*L,extra:Math.min(L,2),dogs:L>=2?1:0,green:Math.max(3.4,5.2-.3*L)};
  }
  /* 每一關是「去買一杯飲料的一段路」，只放一兩樣重點，不全部堆在一起（使用者指定）。
     第 1 關是基本街道；第 9 杯起輪流重走第 5～8 關的路，只有速度照難度加快 */
  function themeOf(cup){return cup<=8?cup:5+(cup-9)%4;}
  const STORIES={
    2:{plan:['closed','junk'],steps:true},          /* 老街的騎樓高高低低 */
    3:{plan:['cross','zebra']},                     /* 飲料店在馬路對面 */
    4:{plan:['green','junk']},                      /* 走專用道也有機車 */
    5:{plan:['junk','junk'],pulls:2},               /* 下班時間，大家都臨停 */
    6:{plan:['zebra','green']},                     /* 放學路上 */
    7:{plan:['closed','cross'],steps:true,pulls:1}, /* 市場旁邊的老路 */
    8:{plan:['cross','green'],pulls:1}              /* 最遠的那一家 */
  };
  const SEGLEN={closed:6,junk:6,cross:6,zebra:6};
  /* 突然靠邊臨停：停幾秒就開走 */
  const PULL_STAY=3.8,PULL_OUT=.8,PULL_CARS=['car_white','car_suv','carred','cargrey'];
  /* 紅綠燈：行人紅燈時橫向車流通過；紅燈最後一段不再出車，把路口清空 */
  const CROSS_ROWS=4,RED=4.4,CLEAR=2.1,RED_GRACE=.7,FLASH=1.7;
  /* 騎樓高低差：跨上去、踩下來要多花的時間（秒／每一階） */
  const STEP_UP=.17,STEP_DOWN=.08;
  let level=levelOf(1);
  const catBag=['cat_lick','cat_loaf','cat_sit','cat_flop','cat_stretch'];
  /* ---------- 地圖 ---------- */
  var rng,walkways,pulls,pullAt,info,crossings,xcars,rows,P,cars,laneWait,queued,cam,bump,roadSteps,reversers,dogs,garbageAt,pending,visitors,parked,t,S,bags;
  function pick(a){return a[Math.floor(rng()*a.length)];}
  function between(a,b){return a+Math.floor(rng()*(b-a+1));}
  /* 不用「隨機比較函式」排序：各瀏覽器排序方式不同，排行榜重播會對不起來 */
  function shuffle(list){for(var i=list.length-1;i>0;i--){var j=Math.floor(rng()*(i+1)),x=list[i];list[i]=list[j];list[j]=x;}return list;}
  function draw1(key,list){                       /* 抽完一輪才重複，畫面比較多樣 */
    if(!bags[key]||!bags[key].length)bags[key]=shuffle(list.slice());
    return bags[key].pop();
  }
  var SINGLE=['pots','moneytree','bougain','gas','tyre','bluepot','blocker','stools','nopark','scooter1','cat1','cat1'];
  /* 路緣那一欄放台灣常見的街道設施；曬東西只放在靠店家的最左欄 */
  var STREET=['hydrant','box_green','mailbox','box_grey','telecom','tree','box_paint','noparksign'];
  var SIDESCOOTER=['scooterside','scooterside_blue','scooterside_grey'];
  /* 停車方向：原圖車頭朝左，名稱結尾的 ~ 代表左右翻轉成朝右。
     靠店面那一欄車頭朝店面（左），騎樓其他位置朝馬路（右），馬路上的車頭朝人行道（左） */
  function facing(name,c){return c===0?name:name+'~';}
  function sideScooter(c){return facing(draw1('sc',SIDESCOOTER),c);}
  var WIDE=['scooterside','bathtub','uncle','quilt','recycler','diners','scooterside','carside_red','carside_grey','carside_van','stall_wide'];  /* 汽車一律橫停 */
  var TALL=['scooterstack','scooterstack','dinersv'];

  /* 先走出一條保證可通的路徑，再把其他騎樓格塞滿東西。
     「全擋」路段會把路徑推到馬路上，一定得下去走。 */
  function buildBlocks(){
    var map=[],path=1,r=0,zone='arcade';
    info=[];
    function add(free,density){
      var cells=[];
      for(var c=0;c<COLS;c++)cells[c]=(c<ARCADE&&free.indexOf(c)<0&&rng()<density);
      map.push(cells);info.push({z:zone,h:0});r++;
    }
    function shift(to,density){
      var free=[],c;
      for(c=Math.min(path,to);c<=Math.max(path,to);c++)free.push(c);
      path=to;add(free,density);
    }
    if(themeOf(S.cup)>1)return buildThemed();
    for(;r<3;)add([0,1,2],0);
    while(r<GOAL-2){
      var n=between(2,4),i;
      for(i=0;i<n&&r<GOAL-2;i++){
        if(rng()<.55)shift(between(0,ARCADE-1),level.density);else add([path],level.density);
      }
      if(r<GOAL-6){
        shift(2,.5);shift(3,1);
        var len=between(2,4);
        for(i=0;i<len;i++)add([],1);
        shift(2,.4);
      }
    }
    for(;r<=GOAL+16;)add([0,1,2],0);
    return map;

    /* 第 2 關以後：主題路段之間插一般騎樓 */
    function buildThemed(){
      var story=STORIES[themeOf(S.cup)],i;
      /* 超級地獄：走專用道的路線再多一段下去走馬路（專用道本身離車流遠，太輕鬆） */
      var plan=shuffle(story.plan.concat(level.hell&&story.plan.indexOf('green')>=0?['junk']:[]));
      var spare=GOAL-5-plan.reduce(function(n,k){return n+SEGLEN[k];},0),gap=Math.max(1,Math.floor(spare/(plan.length+1)));
      function arcade(n){
        for(var j=0;j<n&&r<GOAL-2;j++){if(rng()<.55)shift(between(0,ARCADE-1),level.density);else add([path],level.density);}
      }
      for(;r<3;)add([0,1,2],0);
      plan.forEach(function(kind){
        arcade(gap);
        var j,len=kind==='green'?between(13,15):0;
        if(r+(kind==='green'?len+5:SEGLEN[kind])>GOAL-2)return;
        if(kind==='cross'||kind==='zebra'){
          /* 沒燈的路口：車一陣一陣來，兩陣之間一定留一段過得去的空檔 */
          var lit=kind==='cross',red=lit?RED+(level.hell?.5:0):3.3+rng()*.6,green=lit?level.green:(level.hell?1.9:2.7)+rng()*(level.hell?.4:.7);
          zone='curb';add([0,1,2],0);
          crossings.push({base:r,lit:lit,red:red,green:green,offset:rng()*(red+green),phase:'red',wait:[0,0,0,0],turned:false,turn:null,told:false});
          zone='cross';for(j=0;j<CROSS_ROWS;j++)add([0,1,2],0);
          zone='curb';add([0,1,2],0);
        }else if(kind==='green'){
          /* 行人專用道占兩格：一格是機車會鑽進來的那格（永遠淨空），另一格偶爾有東西、不會連兩列 */
          shift(2,.4);
          var ride=between(1,2),other=3-ride,from,side=false;
          zone='green';shift(ride,.9);from=r;
          for(j=0;j<len;j++){
            side=!side&&j>0&&rng()<(level.hell?.65:.4);
            var cells=[true,false,false,false,false];cells[other]=side;
            map.push(cells);info.push({z:zone,h:0});r++;
          }
          walkways.push({from:from-1,to:r,col:ride,wait:.6,warn:0});
          zone='greenend';shift(3,1);
          zone='gone';add([],1);if(rng()<.5)add([],1);
          zone='arcade';shift(2,.35);
        }else{
          shift(2,.5);shift(3,1);
          zone=kind==='closed'?'closed':'arcade';len=between(2,3);for(j=0;j<len;j++)add([],1);
          zone='arcade';shift(2,.4);
        }
        zone='arcade';
      });
      for(;r<GOAL-2;)arcade(1);
      for(;r<=GOAL+16;)add([0,1,2],0);
      /* 每家店的騎樓地板高度不一樣：2～4 列換一次高度 */
      var h=0,left=0;
      for(i=3;story.steps&&i<GOAL-1;i++){
        if(info[i].z!=='arcade'){h=0;left=0;continue;}
        if(left<=0){h=[0,1,2].filter(function(v){return v!==h;})[between(0,1)];left=between(2,4);}
        info[i].h=h;left--;
      }
      return map;
    }
  }
  function decorate(blocks){
    var map=blocks.map(function(){return [null,null,null,null,null];});
    function put(img,c,r,w,h){
      var it={img:img,c:c,r:r,w:w,h:h},x,y;
      for(y=0;y<h;y++)for(x=0;x<w;x++)map[r+y][c+x]=it;
    }
    for(var r=0;r<blocks.length;r++)for(var c=0;c<ARCADE;c++){
      if(!blocks[r][c]||map[r][c])continue;
      if(info[r].z==='closed'){put(r%2?'enclosure~':'enclosure',0,r,ARCADE,1);continue;}   /* 騎樓外推：整排封起來 */
      var right=c+1<ARCADE&&blocks[r][c+1]&&!map[r][c+1];
      var up=r+1<blocks.length&&blocks[r+1][c]&&!map[r+1][c]&&info[r+1].z!=='closed';
      var img;
      if(right&&rng()<.65){
        img=c===0?draw1('w0',WIDE):draw1('w1',WIDE.filter(function(n){return n!=='quilt';}));
        put(img==='scooterside'?sideScooter(c):img,c,r,2,1);
      }else if(up&&rng()<.3){
        img=draw1('t',TALL);put(img==='scooterstack'?facing(img,c):img,c,r,1,2);
      }else if(c===ARCADE-1&&rng()<.6)put(draw1('k',STREET),c,r,1,1);
      else{
        img=c===0?draw1('s0',SINGLE.concat(['radish','radish'])):draw1('s',SINGLE);
        put(img==='scooter1'?sideScooter(c):img==='cat1'?draw1('cat',catBag):img,c,r,1,1);
      }
    }
    return map;
  }
  /* 從 (c,r) 能否走到終點。block / free 是假設要新增或清掉的格子 */
  function solvable(c,r,block,free){
    function key(x,y){return x+','+y;}
    var b={},f={},seen={},q=[[c,r]];
    (block||[]).forEach(function(p){b[key(p[0],p[1])]=1;});
    (free||[]).forEach(function(p){f[key(p[0],p[1])]=1;});
    seen[key(c,r)]=1;
    while(q.length){
      var n=q.shift();if(n[1]>=GOAL)return true;
      [[0,1],[1,0],[-1,0],[0,-1]].forEach(function(d){
        var x=n[0]+d[0],y=n[1]+d[1],k=key(x,y);
        if(x<0||x>=COLS||y<0||y>=rows.length||seen[k]||b[k]||(rows[y][x]&&!f[k]))return;
        seen[k]=1;q.push([x,y]);
      });
    }
    return false;
  }
  /* 路口和行人專用道上不放狗、鄰居和臨停車 */
  function nearCross(r){var z=info[r]&&info[r].z;return z==='cross'||z==='curb'||z==='green'||z==='greenend';}
  function placeReverser(lo,hi){
    for(var k=0;k<60;k++){
      var r=between(lo,hi),c=between(1,ARCADE-1),it=rows[r][c];
      if(nearCross(r)||info[r].z!=='arcade'||rows[r][c-1]||(it&&(it.w>1||it.h>1||it.kind)))continue;
      if(!it&&!solvable(1,0,[[c,r]]))continue;
      if(!solvable(1,0,[[c-1,r]],[[c,r]]))continue;
      var s={img:sideScooter(c),c:c,r:r,w:1,h:1,kind:'rev',state:'idle',time:0,dx:0};
      rows[r][c]=s;reversers.push(s);return;
    }
  }
  function placeDog(lo,hi){
    for(var k=0;k<60;k++){
      var r=between(lo,hi),c=between(0,ARCADE-1);
      if(nearCross(r)||rows[r][c]||rows[r-1][c]&&rows[r+1][c]||!solvable(1,0,[[c,r]]))continue;
      var d={img:'dog',c:c,r:r,w:1,h:1,kind:'dog',state:'sleep',time:0,ox:0,oy:0,slide:0};
      rows[r][c]=d;dogs.push(d);return;
    }
  }

  /* 路邊停車：沿著紅線停在內側車道，行人只能繞到外側。照台灣常見樣子成排停放：
     汽車一台接一台（有的壓著紅線跨上路緣）、帆布貨車旁擺三角錐、機車停在白線格裡 */
  var CARS=['car_white','car_suv','carred','car_white','cargrey','car_suv'];
  var GROUPS=[['car','car'],['scooters'],['truck'],['car','car','car'],['stall'],['scooters','car']];
  var UNIT={car:2,scooters:2,truck:3,stall:3};               /* 各占幾列；貨車含下方一列三角錐 */
  function placeParked(){
    var plan=shuffle(GROUPS.slice()),r=between(7,9);
    plan.forEach(function(group){
      var len=group.reduce(function(n,k){return n+UNIT[k];},0),cells=[],i;
      for(var tries=0;tries<12&&crossings.some(function(x){return r+len>x.base-2&&r<x.base+CROSS_ROWS+2;});tries++)r++;
      if(r+len>GOAL-4||crossings.some(function(x){return r+len>x.base-2&&r<x.base+CROSS_ROWS+2;}))return;
      for(i=0;i<len;i++)cells.push([ARCADE,r+i]);
      if(!solvable(1,0,cells)){r+=3;return;}
      var row=r;
      function item(img,h,off){
        var it={img:img,c:ARCADE,r:row,w:1,h:h,kind:'parked',off:off||0},y;
        for(y=0;y<h;y++)rows[row+y][ARCADE]=it;
        row+=h;
      }
      group.forEach(function(k){
        if(k==='car')item(draw1('cr',CARS),2,rng()<.35?-.08:0);   /* off<0：往人行道壓過去 */
        else if(k==='truck'){item('cones',1);item('truck_parked',2);}
        else if(k==='stall')item('stall_road',3);
        else if(rng()<.5)item('scooterstack',2);
        else{item(draw1('rs',SIDESCOOTER),1);item(draw1('rs',SIDESCOOTER),1);}
      });
      parked.push({r:r,len:len,type:group.indexOf('scooters')>=0?'scooters':group[0],group:group});
      r+=len+between(4,6);
    });
  }

  /* 出車位置不能跟手機螢幕高度有關，否則每台裝置玩到的車流不同 */
  var VIEW_ROWS=15.5;
  function viewRows(){return VIEW_ROWS;}
  function emit(type,data){S.events.push(Object.assign({type:type},data));}
  function say(text,c,r,dur){emit('say',{text:text,c:c,r:r,dur:dur});}
  function finish(win,cause,name){if(S.dead)return;S.dead=true;S.won=!!win;S.cause=cause||'';S.by=name||'';emit('end',{});}
  function playerAt(c,r){return (P.c===c&&P.r===r)||(P.k<1&&P.fc===c&&P.fr===r);}

  /* ---------- 車流 ---------- */
  /* 前面有路邊停車時，行人只能沿外側車道前進後退，又是迎著車走：
     內側車道不再出車，外側車道拉長間隔，才有走得過去的空檔 */
  function parkedAhead(){return parked.some(function(q){return q.r+q.len>cam-1&&q.r<cam+viewRows()+8;});}
  var GAP=4;
  var KINDS={
    3:[{img:'v_delivery',len:.95,v:6.2,n:'外送'},{img:'v_auntie',len:.95,v:6.6,n:'機車'}],
    4:[{img:'v_taxi',len:1.75,v:5.4,n:'小黃'},{img:'v_truck',len:2,v:5,n:'貨車'},{img:'v_bus',len:3.5,v:4.2,n:'公車'}]
  };
  function spawnCar(lane,kind){
    if(!kind&&cars.some(function(o){return o.lane===lane&&o.y>cam+viewRows()+9;}))return;   /* 停等中的車排太長就先不出車 */
    var k=kind||pick(KINDS[lane]),v=k.v*level.speed,y=cam+viewRows()+v*1.0,name=k.n;
    cars.forEach(function(o){          /* 同車道不超車、不重疊 */
      if(o.lane===lane){v=Math.min(v,o.v);y=Math.max(y,o.y+o.len+1.2);}
    });
    cars.push({lane:lane,y:y,len:k.len,v:v,n:name,img:k.img});
  }

  /* ---------- 過馬路 ---------- */
  /* 橫向位置用「走道格寬」當單位；車道比走道寬，所以主角的位置要換算 */
  const ROADW=1.32,XMIN=-4.5,XMAX=10;
  function across(x){return x<=ARCADE?x:ARCADE+(x-ARCADE)*ROADW;}
  const XKINDS=[{img:'x_scooter',len:1.15,v:5.6,n:'機車'},{img:'x_scooter',len:1.15,v:5.6,n:'機車'},{img:'x_taxi',len:2.2,v:4.8,n:'小黃'},{img:'x_truck',len:2.2,v:4.4,n:'貨車'},{img:'x_bus',len:4.2,v:3.9,n:'公車'}];
  function signalOf(x){
    var at=(t+x.offset)%(x.red+x.green);
    if(at<x.red)return {walk:false,left:x.red-at,into:at};
    return {walk:true,left:x.red+x.green-at,into:at-x.red};
  }
  function spawnAcross(x,k,kind,turn){
    var dir=turn?-1:(k<2?1:-1);          /* 靠右行駛：近端兩線往右、遠端兩線往左 */
    var v=kind.v*(turn?.72:level.speed),pos=dir>0?XMIN-kind.len:XMAX;
    xcars.forEach(function(o){
      if(o.row!==x.base+k||o.dir!==dir)return;
      v=Math.min(v,o.v);pos=dir>0?Math.min(pos,o.x-kind.len-1.4):Math.max(pos,o.x+o.len+1.4);
    });
    xcars.push({row:x.base+k,x:pos,len:kind.len,v:v,dir:dir,img:kind.img,n:turn?'轉彎車':kind.n});
  }
  function updateCrossings(dt){
    crossings.forEach(function(x){
      var near=x.base+CROSS_ROWS>cam-2&&x.base<cam+viewRows()+6;
      var sig=signalOf(x),phase=sig.walk?(sig.left<=FLASH?'flash':'green'):(sig.left<=CLEAR?'clear':'red');
      if(phase!==x.phase){
        if(phase==='green'){x.turned=false;if(near&&x.lit)emit('walk',{});}
        if(phase==='red'){x.wait=[RED_GRACE+rng()*.5,RED_GRACE+.25+rng()*.5,RED_GRACE+rng()*.6,RED_GRACE+.3+rng()*.6];}
        x.phase=phase;
      }
      x.left=sig.left;
      if(!near)return;
      if(!x.told&&P.r>=x.base-3){x.told=true;say(x.lit?'小綠人亮了才能走':'沒有紅綠燈，看清楚再過',1,x.base-1,2.4);}
      if(phase==='red')for(var k=0;k<CROSS_ROWS;k++){
        x.wait[k]-=dt;if(x.wait[k]>0)continue;
        spawnAcross(x,k,pick(XKINDS));x.wait[k]=level.hell?.75+rng()*.65:1.15+rng()*1.1;
      }
      /* 轉彎車不禮讓行人：綠燈亮起一陣子後硬切進斑馬線，先在那一排閃警告 */
      if(x.lit&&phase==='green'&&!x.turned&&sig.into>.35&&P.r>=x.base-2&&P.r<x.base+CROSS_ROWS){
        x.turned=true;
        if(rng()<(level.hell?1:.75)){var row=between(0,CROSS_ROWS-1);x.turn={k:row,time:level.warn};emit('turn',{});say('轉彎車不減速！',2,x.base+row,1.4);}
      }
      if(x.turn){x.turn.time-=dt;if(x.turn.time<=0){spawnAcross(x,x.turn.k,{img:'x_taxi',len:2.2,v:5.2},true);x.turn=null;}}
    });
    var row=Math.round(P.y),mid=across(P.x)+.5;
    for(var i=0;i<xcars.length;i++){
      var v=xcars[i];v.x+=v.dir*v.v*dt;
      if(v.row===row&&mid>v.x+.14&&mid<v.x+v.len-.14){finish(false,'car',v.n);return;}
    }
    xcars=xcars.filter(function(v){return v.dir>0?v.x<XMAX:v.x+v.len>XMIN;});
  }
  /* 直行車：橫向車流通行時停在停止線前，後車排隊 */
  function moveLaneCars(dt){
    var last={};
    cars.forEach(function(v){
      if(v.ramp<1)v.ramp=Math.min(1,v.ramp+dt*.8);
      var was=v.stopped,y=v.y-v.v*dt*(v.ramp===undefined?1:v.ramp);v.stopped=false;
      crossings.forEach(function(x){
        var line=x.base+CROSS_ROWS+.15;
        if((x.phase==='red'||x.phase==='clear')&&v.y>=line&&y<line){y=line;v.stopped=true;}
      });
      if(v.lane===ARCADE)pulls.forEach(function(q){
        var line=q.r+2.2;
        if((q.state==='warn'||q.state==='stay')&&v.y>=line&&y<line){y=line;v.stopped=true;}
      });
      var front=last[v.lane];
      if(front&&y<front.y+front.len+.45){y=Math.min(v.y,front.y+front.len+.45);v.stopped=front.stopped||v.stopped;}
      if(was&&!v.stopped)v.ramp=.15;
      v.y=y;last[v.lane]=v;
    });
  }

  /* ---------- 行人專用道上的機車 ---------- */
  function updateWalkways(dt){
    walkways.forEach(function(w){
      if(P.r<w.from-1||P.r>=w.to-1)return;
      if(w.warn>0){
        w.warn-=dt;
        if(w.warn<=0){var kind=pick(KINDS[3]);cars.push({lane:w.col,y:cam+viewRows()+1.4,len:.95,v:4*level.speed,n:'機車',img:kind.img,walk:w.from});w.wait=level.hell?.7+rng()*.8:(2.4+rng()*1.6)*level.wait;}
        return;
      }
      w.wait-=dt;
      if(w.wait<=0){w.warn=level.warn*.7;emit('scooter',{});if(!S.told.walk){S.told.walk=true;say('借過！機車騎上來了',w.col,P.r+4,2);}}
    });
    /* 騎到專用道盡頭就離開 */
    cars=cars.filter(function(v){return v.walk===undefined||v.y>v.walk-.3;});
  }
  /* ---------- 突然靠邊臨停 ---------- */
  function tryPull(){
    for(var r=P.r+3;r<=P.r+7&&r<GOAL-3;r++){
      if(rows[r][ARCADE]||rows[r+1][ARCADE]||nearCross(r)||nearCross(r+1))continue;
      /* 旁邊的騎樓一定還有路：不會停在整段封死的地方，逼人只能走快車道 */
      if([r,r+1].some(function(y){return rows[y].slice(0,ARCADE).every(Boolean);}))continue;
      if(parked.some(function(q){return r+2>q.r-2&&r<q.r+q.len+2;}))continue;
      if(!solvable(P.c,P.r,[[ARCADE,r],[ARCADE,r+1]]))continue;
      pulls.push({r:r,state:'warn',time:level.warn,img:pick(PULL_CARS),off:rng()<.4?-.3:0,slide:1,age:0});
      emit('pull',{});say('臨停一下就好！',ARCADE,r+1,1.6);return true;
    }
    return false;
  }
  function updatePulls(dt){
    if(pullAt.length&&P.r>=pullAt[0]){if(tryPull()||P.r>pullAt[0]+6)pullAt.shift();}
    pulls=pulls.filter(function(q){
      q.age+=dt;q.time-=dt;
      if(q.state==='warn'){
        if(q.time>0)return true;
        var cells=[[ARCADE,q.r],[ARCADE,q.r+1]];
        if(playerAt(ARCADE,q.r)||playerAt(ARCADE,q.r+1)){finish(false,'car','臨停車');return true;}
        if(rows[q.r][ARCADE]||rows[q.r+1][ARCADE]||!solvable(P.c,P.r,cells))return false;
        var it={img:q.img,c:ARCADE,r:q.r,w:1,h:2,kind:'pull',off:q.off,pull:q};
        rows[q.r][ARCADE]=rows[q.r+1][ARCADE]=it;q.state='stay';q.time=PULL_STAY;return true;
      }
      if(q.state==='stay'){
        q.slide=Math.max(0,q.slide-dt*2.6);
        if(q.time>0)return true;
        rows[q.r][ARCADE]=rows[q.r+1][ARCADE]=null;q.state='out';q.time=PULL_OUT;return true;
      }
      return q.time>0;
    });
  }

  /* ---------- 三種會動的路障 ---------- */
  function updateReversers(dt){
    reversers.forEach(function(s){
      if(s.state==='idle'&&P.r<s.r&&P.r>=s.r-3){s.state='warn';s.time=level.warn;emit('reverse',{});say('嗶嗶～倒車',s.c,s.r,1.2);}
      else if(s.state==='warn'){
        s.time-=dt;if(s.time>0)return;
        var tc=s.c-1;
        if(playerAt(tc,s.r)){s.dx=1;moveItem(s,tc,s.r);s.state='moved';finish(false,'reverse');return;}
        if(rows[s.r][tc]||!solvable(P.c,P.r,[[tc,s.r]],[[s.c,s.r]])){s.state='moved';return;}
        s.dx=1;moveItem(s,tc,s.r);s.state='moved';
      }
      if(s.dx>0)s.dx=Math.max(0,s.dx-dt*2.2);
    });
  }
  function moveItem(it,c,r){rows[it.r][it.c]=null;it.c=c;it.r=r;rows[r][c]=it;}
  function updateDogs(dt){
    dogs.forEach(function(d){
      if(d.state==='sleep'&&Math.abs(P.c-d.c)<=1&&Math.abs(P.r-d.r)<=1){
        d.state='wake';d.time=.8;d.img='dogup';emit('bark',{});say('汪！這是牠的騎樓',d.c,d.r,1.8);
      }else if(d.state==='wake'){
        d.time-=dt;if(d.time>0)return;
        var spots=[];
        [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]].forEach(function(o){
          var c=d.c+o[0],r=d.r+o[1];
          if(c<0||c>=ARCADE||r<1||rows[r][c]||playerAt(c,r))return;
          if(solvable(P.c,P.r,[[c,r]],[[d.c,d.r]]))spots.push([c,r]);
        });
        if(spots.length){var s=pick(spots);d.ox=d.c-s[0];d.oy=d.r-s[1];d.slide=1;d.left=s[0]<d.c;moveItem(d,s[0],s[1]);d.img='dog';d.state='done';}
        else d.state='done';
      }
      if(d.slide>0)d.slide=Math.max(0,d.slide-dt*1.7);
    });
  }
  function callGarbage(){
    emit('garbage',{});
    spawnCar(4,{img:'v_garbage',len:2.8,v:3.4,n:'垃圾車'});laneWait[4]=3.6;
    var spots=[],r,c;
    for(r=P.r+2;r<=Math.min(P.r+7,GOAL-1);r++)for(c=0;c<ARCADE;c++)if(!rows[r][c]&&!nearCross(r))spots.push([c,r]);
    shuffle(spots);
    var chosen=[];
    spots.forEach(function(s){
      if(chosen.length<3&&solvable(P.c,P.r,chosen.concat([s])))chosen.push(s);
    });
    chosen.forEach(function(s,i){pending.push({c:s[0],r:s[1],time:1.5,img:i%2?'nb_uncle':'nb_auntie'});});
  }
  function updateGarbage(dt){
    if(garbageAt.length&&P.r>=garbageAt[0]){garbageAt.shift();callGarbage();}
    pending=pending.filter(function(p){
      p.time-=dt;if(p.time>0)return true;
      if(!rows[p.r][p.c]&&!playerAt(p.c,p.r)&&solvable(P.c,P.r,[[p.c,p.r]])){
        var v={img:p.img,c:p.c,r:p.r,w:1,h:1,kind:'neighbor',time:4.2,age:0};
        rows[p.r][p.c]=v;visitors.push(v);
        if(visitors.length%3===1)say('什麼都能等，垃圾車不能！',p.c,p.r,2);
      }
      return false;
    });
    visitors=visitors.filter(function(v){
      v.age+=dt;v.time-=dt;if(v.time>0)return true;
      rows[v.r][v.c]=null;return false;
    });
  }

  /* 狀態存在 S 裡；執行前把它接到上面函式用的區域變數，執行完寫回 */
  const KEYS=['walkways','pulls','pullAt','info','crossings','xcars','rows','P','cars','laneWait','queued','cam','bump','roadSteps','reversers','dogs','garbageAt','pending','visitors','parked','t','bags'];
  function load(s,random){S=s;rng=random;({walkways,pulls,pullAt,info,crossings,xcars,rows,P,cars,laneWait,queued,cam,bump,roadSteps,reversers,dogs,garbageAt,pending,visitors,parked,t,bags}=s);level=levelOf(s.cup);}
  function store(){Object.assign(S,{walkways,pulls,pullAt,info,crossings,xcars,rows,P,cars,laneWait,queued,cam,bump,roadSteps,reversers,dogs,garbageAt,pending,visitors,parked,t,bags});}
  function buildCup(){
    level=levelOf(S.cup);queued=null;bump=0;cars=[];xcars=[];crossings=[];walkways=[];pulls=[];S.told={};
    var pulling=(S.cup>1&&STORIES[themeOf(S.cup)].pulls||0)+(level.hell?1:0);
    pullAt=pulling>2?[between(7,13),between(21,28),between(35,41)]:pulling>1?[between(7,18),between(28,40)]:pulling?[between(10,30)]:[];bags={};reversers=[];dogs=[];visitors=[];pending=[];parked=[];
    rows=decorate(buildBlocks());
    placeParked();
    if(S.cup===1){
      placeReverser(6,13);placeReverser(20,30);placeReverser(35,45);
      if(level.extra>0)placeReverser(14,19);
      if(level.extra>1)placeReverser(31,34);
      placeDog(5,16);placeDog(26,44);
      if(level.dogs)placeDog(17,25);
      garbageAt=[between(11,18),between(32,40)];
    }else{                                   /* 劇情關：倒車機車兩台、黑狗一隻，垃圾車只在老街和下班時間出現 */
      placeReverser(8,22);placeReverser(28,44);
      placeDog(12,40);
      var theme=themeOf(S.cup);
      garbageAt=theme===2||theme===5||theme===7?[between(18,32)]:[];
      if(level.hell){
        placeReverser(16,24);placeReverser(32,40);placeDog(24,34);
        garbageAt=[between(11,18),between(30,40)];
      }
    }
    P={c:1,r:0,fc:1,fr:0,k:1,hop:HOP,lift:0,x:1,y:0,steps:0,dir:0,flip:false,stop:9,phase:0};
    laneWait={3:1.4,4:.5};cam=-2.6;S.maxRow=0;
  }
  function create(random){
    const s={dead:false,won:false,cause:'',by:'',events:[],maxRow:0,cup:1,cups:0,rest:0,clock:0,rng:random};
    S=s;rng=random;t=0;roadSteps=0;
    buildCup();store();return s;
  }
  function heightAt(c,r){return c<ARCADE&&info[r]?info[r].h:0;}
  function step(code){
    const [dc,dr]=DIRS[code],c=P.c+dc,r=P.r+dr;
    if(c<0||c>=COLS||r<0||r>=rows.length||rows[r][c]){bump=.18;return false;}
    if(P.stop>JOG_TAIL)P.phase=0;
    var rise=heightAt(c,r)-heightAt(P.c,P.r);
    P.hop=HOP+(rise>0?rise*STEP_UP:-rise*STEP_DOWN);
    if(rise&&!S.told.step){S.told.step=true;say('騎樓高低不平，上下會變慢',c,r,2.2);}
    if(rise)emit('stair',{up:rise>0});
    P.fc=P.c;P.fr=P.r;P.c=c;P.r=r;P.k=0;P.steps++;P.stop=0;
    P.dir=dc?1:(dr>0?0:2);P.flip=dc<0;
    if(c>=ARCADE&&dr>0)roadSteps++;
    if(r>S.maxRow)S.maxRow=Math.min(r,GOAL);
    return true;
  }
  /* 回傳 true 代表這個操作有效（需要記錄給排行榜重播） */
  function input(s,code){
    if(s.dead||s.rest>0||!Number.isInteger(code)||code<0||code>=DIRS.length)return false;
    load(s,s.rng);
    let ok;
    if(P.k<1){ok=queued!==code;queued=code;}else ok=step(code);
    store();return ok;
  }
  function advance(s,dt,random){
    if(s.dead)return;
    load(s,random);tick(dt);store();
  }
  function tick(dt){
    S.clock+=dt;
    if(S.clock>=CLOSE){finish(false,'closed');return;}
    if(S.rest>0){                       /* 慶祝完，換下一杯的路 */
      S.rest-=dt;P.stop+=dt;
      if(S.rest<=0){S.rest=0;S.cup+=1;t=0;roadSteps=0;buildCup();emit('cupStart',{cup:S.cup});}
      return;
    }
    t+=dt;if(bump>0)bump-=dt;
    if(P.k<1){
      P.k=Math.min(1,P.k+dt/P.hop);
      if(P.k>=1)emit('land',{c:P.c,r:P.r});
    }else P.stop+=dt;
    if(P.k<1||P.stop<JOG_TAIL)P.phase+=dt*JOG_FPS;
    P.x=P.fc+(P.c-P.fc)*P.k;P.y=P.fr+(P.r-P.fr)*P.k;
    P.lift=heightAt(P.fc,P.fr)+(heightAt(P.c,P.r)-heightAt(P.fc,P.fr))*P.k;
    const target=P.y-2.6;cam+=(target-cam)*Math.min(1,dt*10);
    [3,4].forEach(function(l){
      laneWait[l]-=dt;
      if(laneWait[l]>0)return;
      const blocked=parkedAhead();
      const pulling=l===ARCADE&&pulls.some(function(q){return q.state!=='out';});
      if(!(blocked&&l===ARCADE)&&!pulling)spawnCar(l);
      laneWait[l]=(blocked&&l===ARCADE+1?level.gap:(l===3?2:2.2)*level.wait)+rng()*1.5;
    });
    updateCrossings(dt);if(S.dead)return;
    updateWalkways(dt);updatePulls(dt);if(S.dead)return;
    moveLaneCars(dt);
    cars=cars.filter(function(v){return v.y+v.len>cam-3;});
    for(let i=0;i<cars.length;i++){
      const v=cars[i];
      if(v.lane===Math.round(P.x)&&P.y+.75>v.y+.08&&P.y+.2<v.y+v.len-.08){finish(false,'car',v.n);return;}
    }
    ['closed','greenend'].forEach(function(z){
      var ahead=info[P.r+(z==='closed'?2:0)];
      if(ahead&&ahead.z===z&&!S.told[z]){S.told[z]=true;say(z==='closed'?'騎樓外推，沒路了！':'人行道到此為止',1,P.r+(z==='closed'?2:1),2.2);}
    });
    updateReversers(dt);if(S.dead)return;
    updateDogs(dt);updateGarbage(dt);
    if(P.k>=1){
      if(P.r>=GOAL){
        S.cups+=1;S.maxRow=0;S.rest=REST;queued=null;cars=[];xcars=[];pulls=[];
        emit('cup',{cups:S.cups,time:t,road:roadSteps});return;
      }
      if(queued!==null){const q=queued;queued=null;step(q);}
    }
  }
  /* 排行榜只看買到幾杯珍奶 */
  function score(s){return s.cups;}
  /* 第 2 版：劇情關卡、路口、長行人專用道、臨停車與超級地獄。改玩法時要加版本號並保留舊版回放 */
  const rulesVersion=2;
  return {rulesVersion,create,input,advance,score,levelOf,themeOf,across,CROSS_ROWS,inputCount:DIRS.length,REST,CLOSE,COLS,ARCADE,GOAL,JOG_TAIL,VIEW_ROWS,DIRS};
})();
if(typeof module!=='undefined')module.exports=pedestrianHellRules;
