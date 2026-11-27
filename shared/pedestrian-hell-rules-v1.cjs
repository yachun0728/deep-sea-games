/* 行人地獄第 1 版規則（2026-11-27 首發版，凍結不改）。只給排行榜 Worker 驗證仍開著舊頁面的對局。 */
const pedestrianHellRulesV1 = (() => {
  const COLS=5,ARCADE=3,GOAL=50,HOP=.18,JOG_TAIL=.13,JOG_FPS=17;
  /* 操作代碼：0 往前、1 往後、2 往左、3 往右 */
  const DIRS=[[0,1],[0,-1],[-1,0],[1,0]];
  /* 第幾杯決定難度；第 6 杯以後維持同一難度。REST 是買到珍奶後的慶祝時間，CLOSE 是打烊時間（秒，需小於排行榜重播上限 600） */
  const REST=1.8,CLOSE=570;
  function levelOf(cup){const L=Math.min(cup-1,5);return {speed:1+.09*L,wait:1-.08*L,gap:4-.2*L,density:.68+.025*L,warn:1.3-.07*L,extra:Math.min(L,2),dogs:L>=2?1:0};}
  let level=levelOf(1);
  const catBag=['cat_lick','cat_loaf','cat_sit','cat_flop','cat_stretch'];
  /* ---------- 地圖 ---------- */
  var rng,rows,P,cars,laneWait,queued,cam,bump,roadSteps,reversers,dogs,garbageAt,pending,visitors,parked,t,S,bags;
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
    var map=[],path=1,r=0;
    function add(free,density){
      var cells=[];
      for(var c=0;c<COLS;c++)cells[c]=(c<ARCADE&&free.indexOf(c)<0&&rng()<density);
      map.push(cells);r++;
    }
    function shift(to,density){
      var free=[],c;
      for(c=Math.min(path,to);c<=Math.max(path,to);c++)free.push(c);
      path=to;add(free,density);
    }
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
  }
  function decorate(blocks){
    var map=blocks.map(function(){return [null,null,null,null,null];});
    function put(img,c,r,w,h){
      var it={img:img,c:c,r:r,w:w,h:h},x,y;
      for(y=0;y<h;y++)for(x=0;x<w;x++)map[r+y][c+x]=it;
    }
    for(var r=0;r<blocks.length;r++)for(var c=0;c<ARCADE;c++){
      if(!blocks[r][c]||map[r][c])continue;
      var right=c+1<ARCADE&&blocks[r][c+1]&&!map[r][c+1];
      var up=r+1<blocks.length&&blocks[r+1][c]&&!map[r+1][c];
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
  function placeReverser(lo,hi){
    for(var k=0;k<60;k++){
      var r=between(lo,hi),c=between(1,ARCADE-1),it=rows[r][c];
      if(rows[r][c-1]||(it&&(it.w>1||it.h>1||it.kind)))continue;
      if(!it&&!solvable(1,0,[[c,r]]))continue;
      if(!solvable(1,0,[[c-1,r]],[[c,r]]))continue;
      var s={img:sideScooter(c),c:c,r:r,w:1,h:1,kind:'rev',state:'idle',time:0,dx:0};
      rows[r][c]=s;reversers.push(s);return;
    }
  }
  function placeDog(lo,hi){
    for(var k=0;k<60;k++){
      var r=between(lo,hi),c=between(0,ARCADE-1);
      if(rows[r][c]||rows[r-1][c]&&rows[r+1][c]||!solvable(1,0,[[c,r]]))continue;
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
      if(r+len>GOAL-4)return;
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
    var k=kind||pick(KINDS[lane]),v=k.v*level.speed,y=cam+viewRows()+v*1.0,name=k.n;
    cars.forEach(function(o){          /* 同車道不超車、不重疊 */
      if(o.lane===lane){v=Math.min(v,o.v);y=Math.max(y,o.y+o.len+1.2);}
    });
    cars.push({lane:lane,y:y,len:k.len,v:v,n:name,img:k.img});
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
    for(r=P.r+2;r<=Math.min(P.r+7,GOAL-1);r++)for(c=0;c<ARCADE;c++)if(!rows[r][c])spots.push([c,r]);
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
  const KEYS=['rows','P','cars','laneWait','queued','cam','bump','roadSteps','reversers','dogs','garbageAt','pending','visitors','parked','t','bags'];
  function load(s,random){S=s;rng=random;({rows,P,cars,laneWait,queued,cam,bump,roadSteps,reversers,dogs,garbageAt,pending,visitors,parked,t,bags}=s);level=levelOf(s.cup);}
  function store(){Object.assign(S,{rows,P,cars,laneWait,queued,cam,bump,roadSteps,reversers,dogs,garbageAt,pending,visitors,parked,t,bags});}
  function buildCup(){
    level=levelOf(S.cup);queued=null;bump=0;cars=[];bags={};reversers=[];dogs=[];visitors=[];pending=[];parked=[];
    rows=decorate(buildBlocks());
    placeParked();
    placeReverser(6,13);placeReverser(20,30);placeReverser(35,45);
    if(level.extra>0)placeReverser(14,19);
    if(level.extra>1)placeReverser(31,34);
    placeDog(5,16);placeDog(26,44);
    if(level.dogs)placeDog(17,25);
    garbageAt=[between(11,18),between(32,40)];
    P={c:1,r:0,fc:1,fr:0,k:1,x:1,y:0,steps:0,dir:0,flip:false,stop:9,phase:0};
    laneWait={3:1.4,4:.5};cam=-2.6;S.maxRow=0;
  }
  function create(random){
    const s={dead:false,won:false,cause:'',by:'',events:[],maxRow:0,cup:1,cups:0,rest:0,clock:0,rng:random};
    S=s;rng=random;t=0;roadSteps=0;
    buildCup();store();return s;
  }
  function step(code){
    const [dc,dr]=DIRS[code],c=P.c+dc,r=P.r+dr;
    if(c<0||c>=COLS||r<0||r>=rows.length||rows[r][c]){bump=.18;return false;}
    if(P.stop>JOG_TAIL)P.phase=0;
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
      P.k=Math.min(1,P.k+dt/HOP);
      if(P.k>=1)emit('land',{c:P.c,r:P.r});
    }else P.stop+=dt;
    if(P.k<1||P.stop<JOG_TAIL)P.phase+=dt*JOG_FPS;
    P.x=P.fc+(P.c-P.fc)*P.k;P.y=P.fr+(P.r-P.fr)*P.k;
    const target=P.y-2.6;cam+=(target-cam)*Math.min(1,dt*10);
    [3,4].forEach(function(l){
      laneWait[l]-=dt;
      if(laneWait[l]>0)return;
      const blocked=parkedAhead();
      if(!(blocked&&l===ARCADE))spawnCar(l);
      laneWait[l]=(blocked&&l===ARCADE+1?level.gap:(l===3?2:2.2)*level.wait)+rng()*1.5;
    });
    cars.forEach(function(v){v.y-=v.v*dt;});
    cars=cars.filter(function(v){return v.y+v.len>cam-3;});
    for(let i=0;i<cars.length;i++){
      const v=cars[i];
      if(v.lane===Math.round(P.x)&&P.y+.75>v.y+.08&&P.y+.2<v.y+v.len-.08){finish(false,'car',v.n);return;}
    }
    updateReversers(dt);if(S.dead)return;
    updateDogs(dt);updateGarbage(dt);
    if(P.k>=1){
      if(P.r>=GOAL){
        S.cups+=1;S.maxRow=0;S.rest=REST;queued=null;cars=[];
        emit('cup',{cups:S.cups,time:t,road:roadSteps});return;
      }
      if(queued!==null){const q=queued;queued=null;step(q);}
    }
  }
  /* 排行榜只看買到幾杯珍奶 */
  function score(s){return s.cups;}
  return {create,input,advance,score,levelOf,inputCount:DIRS.length,REST,CLOSE,COLS,ARCADE,GOAL,JOG_TAIL,VIEW_ROWS,DIRS};
})();
if(typeof module!=='undefined')module.exports=pedestrianHellRulesV1;
