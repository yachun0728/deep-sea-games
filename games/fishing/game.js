  /* ---------- Fishing: endless catch; milestone bonuses are credited to the shared wallet when reached ---------- */
  var FI={active:false,phase:'ready',landed:0,stake:0,earned:0,pops:[],number:1,distance:20,start:20,tension:45,slack:0,mode:'calm',timer:3,hold:false,last:0,clock:0,best:0};
  // Milestones count landed fish; calibrated with a controller-bot simulation (see GAME_RULES.md).
var FI_MILESTONES=[[10,3],[12,7],[14,15],[17,30]],FI_ENDLESS_FROM=17,FI_ENDLESS_STEP=3,FI_ENDLESS_BONUS=40;
function fiBonusAt(n){for(var i=0;i<FI_MILESTONES.length;i++)if(FI_MILESTONES[i][0]===n)return FI_MILESTONES[i][1];return n>FI_ENDLESS_FROM&&(n-FI_ENDLESS_FROM)%FI_ENDLESS_STEP===0?FI_ENDLESS_BONUS:0;}
function fiNextMilestone(n){for(var i=0;i<FI_MILESTONES.length;i++)if(FI_MILESTONES[i][0]>n)return FI_MILESTONES[i];return [FI_ENDLESS_FROM+(Math.floor((n-FI_ENDLESS_FROM)/FI_ENDLESS_STEP)+1)*FI_ENDLESS_STEP,FI_ENDLESS_BONUS];}
function fiFishName(n){return n<=10?FI_NAMES[n-1]:'深海魚王 · 第 '+(n-9)+' 代';}
  var FI_NAMES=['{{t:fishing.msg.001}}','{{t:fishing.msg.002}}','{{t:fishing.msg.003}}','{{t:fishing.msg.004}}','{{t:fishing.msg.005}}','{{t:fishing.msg.006}}','{{t:fishing.msg.007}}','{{t:fishing.msg.008}}','{{t:fishing.msg.009}}','{{t:fishing.msg.010}}'];
  var fishingCanvas=$('fi-canvas'),fishingCtx=fishingCanvas.getContext('2d'),fishingPointers=new Set(),fishingKeys=new Set();
  try{var fb=Number(localStorage.getItem('deep-sea-fishing-best'));if(Number.isFinite(fb))FI.best=Math.max(0,Math.floor(fb));}catch(e){}
  function fiText(id,value){var el=$(id);if(el.textContent!==value)el.textContent=value;}
  function fiSay(text,kind){fiText('fi-msg',text);$('fi-msg').className='msg'+(kind?' '+kind:'');}
  var fiRank=timedLeaderboard('fishing','fi',fishingRules.inputCount,fiUI);
  function fiHold(hold){var action=hold?0:1;if(fishingRules.input(FI,action))fiRank.record(action);}
  function fiRelease(){fishingPointers.clear();fishingKeys.clear();fiHold(false);}
  function fiRemember(){if(FI.landed>FI.best){FI.best=FI.landed;try{localStorage.setItem('deep-sea-fishing-best',String(FI.best));}catch(e){}}}
  function fiUI(){
    var nx=fiNextMilestone(FI.landed);
    fiText('fi-number','第 '+FI.number+' 條');fiText('fi-distance',Math.max(0,FI.distance).toFixed(1)+' m');fiText('fi-best',FI.best+' 條');fiText('fi-next','釣到 '+nx[0]+' 條 · +'+nx[1]);
    $('fi-amount').disabled=FI.active;
    $('fi-go').disabled=FI.phase==='fishing'||fiRank.busy();fiText('fi-go',FI.phase==='fishing'?'{{t:fishing.msg.011}}':'{{t:fishing.msg.012}}');
    $('fi-hold').disabled=FI.phase!=='fishing';fiText('fi-hold',FI.hold?'{{t:fishing.msg.013}}':'{{t:fishing.msg.014}}');
    var tension=Math.max(0,Math.min(100,FI.tension));$('fi-tension-fill').style.width=tension+'%';
    var danger=tension>=88||tension<=8,warn=tension>75||tension<20;
    $('fi-tension-fill').style.background=danger?'var(--crush)':warn?'var(--lamp)':'var(--glow)';
    $('fi-tension').setAttribute('aria-valuenow',String(Math.round(tension)));fiText('fi-tension-value',Math.round(tension)+' / 100');
    fiText('fi-slack',FI.phase==='fishing'&&tension<=8?'{{t:fishing.msg.015}}':FI.phase==='fishing'&&tension>=88?'{{t:fishing.msg.016}}':'{{t:fishing.msg.017}}');
    var text=FI.phase==='lost'?'{{t:fishing.msg.018}}':FI.phase==='ready'?'{{t:fishing.msg.019}}':FI.mode==='struggle'?'{{t:fishing.msg.020}}':FI.mode==='warn'?'{{t:fishing.msg.021}}':FI.mode==='tired'?'{{t:fishing.msg.022}}':'{{t:fishing.msg.023}}';
    fiText('fi-signal',text);$('fi-signal').dataset.state=FI.mode;
    fiText('fi-name',fiFishName(FI.number));
  }
  function fiRound(first){
    AN.resume(FI.analytics,{stage:FI.number});FI.phase='fishing';FI.last=performance.now();fiRelease();
    if(first)fiSay('第 '+FI.number+' 條 '+fiFishName(FI.number)+' 上鉤了！按住收線，掙扎時放開；線太鬆也可能脫鉤。沒有終點，魚會一條接一條。');fiUI();fishingCanvas.focus();
  }
  function fiStart(){
    if(FI.phase==='fishing'||fiRank.busy())return;
    var stake=ENTRY_FEE;
    if(stake>S.balance){fiSay(LOW_MSG,'lose');return;}
    fiRank.start(function(random){
      FI.analytics=AN.start('fishing',stake);FI.stake=stake;FI.landed=0;FI.earned=0;FI.pops=[];FI.active=true;
      save();renderAll();FV.catchAge=FV.lostAge=9;FV.drops=[];
      fishingRules.create(random||Math.random,function(event){
        if(event==='land')fiLand();
        else if(event==='next')fiRound(false);
        else fiLose(event==='break'?'{{t:fishing.msg.024}}':'{{t:fishing.msg.025}}');
      },FI);
      fiRound(true);
    },fiUI);
  }
  function fiLose(reason){if(FI.phase!=='fishing')return;AN.end(FI.analytics,FI.earned,FI.earned>0?'complete':'loss',{stage:FI.number,landed_fish:FI.landed});FV.lostAge=0;FV.catchAge=9;FI.active=false;FI.phase='lost';fiRelease();fiRank.finish(FI.landed);fiSay(reason+' 本局釣到 '+FI.landed+' 條，'+(FI.earned>0?'共入帳 '+fmt(FI.earned)+' 點。':'{{t:fishing.msg.026}}'),FI.earned>0?'win':'lose');fiUI();}
  function fiAward(n,b){FI.earned+=b;S.balance+=b;save();renderAll();AN.progress(FI.analytics,{stage:n,landed_fish:n,bonus_points:b});FI.pops.push({n:n,b:b,age:0});if(FI.pops.length>3)FI.pops.shift();fiSay('釣到第 '+n+' 條！獎勵 +'+b+' 點已入帳，本局累計 +'+FI.earned+' 點。','win');}
  function fiLand(){
    if(FI.phase!=='fishing')return;
    var name=fiFishName(FI.number);AN.progress(FI.analytics,{stage:FI.number,landed_fish:FI.landed},true);fiRemember();
    var b=fiBonusAt(FI.landed);if(b)fiAward(FI.landed,b);else fiSay('釣到 '+name+'{{t:fishing.msg.027}}','win');
    FV.catchAge=0;fiSplash(FV.fx,FV.fy,24,1);
  }
  function fiSync(now){var dt=Math.max(0,(now-FI.last)/1000);FI.last=now;if(FI.phase==='fishing'&&!$('view-fishing').hidden&&!document.hidden)fiRank.update(dt*1000,()=>FI.phase==='fishing',step=>fishingRules.advance(FI,step));}
  /* ---------- Fishing art (2026-11-28 大漁旗浮世繪)：純畫面，不寫入 FI 的玩法欄位 ---------- */
  // Frame cells from games/fishing/design/build_art.py: w/h cell, x/y anchor, p = rod tip or mouth per frame.
  var FI_SHEETS={"reel":{"w":342,"h":347,"x":234,"y":345,"p":[[88,-305],[96,-308],[104,-307],[101,-303],[93,-303],[94,-302],[95,-288],[89,-294]]},"release":{"w":384,"h":310,"x":209,"y":309,"p":[[163,-282],[171,-279],[173,-277],[170,-283],[169,-276],[166,-274],[165,-279],[160,-285]]},"fight":{"w":470,"h":339,"x":246,"y":338,"p":[[154,-303],[182,-291],[219,-265],[221,-247],[180,-252],[119,-286],[96,-305],[100,-306]]},"result":{"w":348,"h":353,"x":208,"y":351,"p":[[136,-293],[127,-326],[94,-340],[114,-337],[99,-342],[96,-113],[108,-91],[95,-77]]},"swim":{"w":318,"h":185,"x":146,"y":87,"p":[[-137,13],[-139,20],[-137,33],[-134,25],[-134,16],[-136,12],[-137,14],[-138,26]]},"thrash":{"w":316,"h":250,"x":146,"y":102,"p":[[-96,-64],[-120,-20],[-134,-4],[-139,9],[-130,24],[-114,-51],[-122,-31],[-132,-4]]},"moods":{"w":306,"h":243,"x":141,"y":113,"p":[[-135,6],[-134,23],[-133,43],[-127,63],[-125,-35],[-122,-25],[-119,-28],[-122,-20]]},"fish/clownfish-swim":{"w":286,"h":179,"x":139,"y":86,"p":[[-131,2],[-132,7],[-132,22],[-130,13],[-131,2],[-130,2],[-131,-1],[-132,1]]},"fish/clownfish-thrash":{"w":296,"h":234,"x":148,"y":111,"p":[[-109,-41],[-127,-16],[-142,-4],[-139,10],[-133,21],[-120,-49],[-133,-24],[-134,-4]]},"fish/clownfish-moods":{"w":291,"h":239,"x":144,"y":108,"p":[[-136,-4],[-138,8],[-135,28],[-129,3],[-137,-21],[-134,-1],[-134,2],[-136,-7]]},"fish/blue-damsel-swim":{"w":303,"h":166,"x":141,"y":76,"p":[[-130,13],[-134,15],[-131,30],[-128,21],[-128,13],[-131,12],[-130,14],[-133,19]]},"fish/blue-damsel-thrash":{"w":295,"h":240,"x":139,"y":99,"p":[[-88,-43],[-116,-15],[-131,-4],[-133,5],[-119,20],[-107,-52],[-115,-28],[-126,-5]]},"fish/blue-damsel-moods":{"w":285,"h":258,"x":138,"y":115,"p":[[-125,9],[-123,33],[-127,35],[-131,40],[-122,-27],[-129,-26],[-123,-24],[-127,-8]]},"fish/puffer-swim":{"w":289,"h":163,"x":142,"y":76,"p":[[-133,-3],[-131,3],[-126,30],[-126,20],[-131,2],[-135,-8],[-132,-3],[-134,-2]]},"fish/puffer-thrash":{"w":296,"h":229,"x":146,"y":104,"p":[[-87,-42],[-122,-9],[-138,-3],[-135,3],[-127,19],[-107,-60],[-126,-27],[-139,-9]]},"fish/puffer-moods":{"w":276,"h":225,"x":132,"y":110,"p":[[-126,-2],[-123,11],[-119,-7],[-118,13],[-119,-43],[-115,-26],[-122,-7],[-123,-1]]},"fish/rainbowfish-swim":{"w":304,"h":180,"x":145,"y":85,"p":[[-136,7],[-135,10],[-133,30],[-132,19],[-132,10],[-134,10],[-135,12],[-139,14]]},"fish/rainbowfish-thrash":{"w":306,"h":246,"x":147,"y":101,"p":[[-116,-48],[-130,-17],[-137,-6],[-140,8],[-130,20],[-121,-56],[-136,-48],[-138,0]]},"fish/rainbowfish-moods":{"w":298,"h":255,"x":144,"y":113,"p":[[-137,6],[-133,25],[-130,39],[-131,45],[-128,-39],[-127,-22],[-124,-23],[-128,-17]]},"fish/sea-bass-swim":{"w":302,"h":166,"x":143,"y":75,"p":[[-136,13],[-135,16],[-132,26],[-131,22],[-127,18],[-133,17],[-135,14],[-136,9]]},"fish/sea-bass-thrash":{"w":307,"h":244,"x":146,"y":103,"p":[[-113,-35],[-129,-16],[-139,-3],[-136,16],[-127,25],[-109,-13],[-129,-28],[-139,0]]},"fish/sea-bass-moods":{"w":288,"h":244,"x":144,"y":110,"p":[[-138,9],[-138,24],[-136,30],[-118,-32],[-130,-3],[-137,0],[-137,8],[-133,9]]},"fish/tuna-swim":{"w":310,"h":188,"x":133,"y":84,"p":[[-126,5],[-125,16],[-121,20],[-119,20],[-121,20],[-124,18],[-126,4],[-127,11]]},"fish/tuna-thrash":{"w":312,"h":256,"x":140,"y":108,"p":[[-108,-48],[-125,-53],[-128,4],[-133,7],[-132,21],[-117,-54],[-124,-57],[-130,2]]},"fish/tuna-moods":{"w":294,"h":237,"x":135,"y":101,"p":[[-126,4],[-126,22],[-124,30],[-88,-58],[-122,-9],[-122,3],[-120,19],[-127,5]]},"fish/mahi-swim":{"w":307,"h":184,"x":135,"y":88,"p":[[-120,15],[-127,22],[-128,25],[-124,25],[-125,16],[-124,16],[-123,14],[-126,17]]},"fish/mahi-thrash":{"w":306,"h":251,"x":134,"y":103,"p":[[-106,-29],[-117,1],[-127,8],[-128,19],[-121,21],[-112,1],[-122,-13],[-123,9]]},"fish/mahi-moods":{"w":311,"h":274,"x":139,"y":119,"p":[[-115,20],[-121,9],[-123,2],[-132,-31],[-121,7],[-115,-4],[-119,-5],[-124,5]]},"fish/sailfish-swim":{"w":319,"h":191,"x":158,"y":78,"p":[[-102,17],[-104,26],[-95,35],[-98,35],[-103,21],[-102,16],[-100,16],[-101,17]]},"fish/sailfish-thrash":{"w":340,"h":264,"x":183,"y":114,"p":[[-118,-42],[-127,-3],[-116,12],[-131,40],[-118,16],[-119,-18],[-118,9],[-130,21]]},"fish/sailfish-moods":{"w":320,"h":260,"x":172,"y":115,"p":[[-107,17],[-108,28],[-121,54],[-123,-37],[-113,-22],[-104,26],[-102,40],[-98,48]]},"fish/grouper-swim":{"w":301,"h":173,"x":148,"y":79,"p":[[-142,10],[-139,18],[-135,40],[-130,-3],[-132,19],[-138,15],[-140,11],[-141,8]]},"fish/grouper-thrash":{"w":293,"h":237,"x":146,"y":100,"p":[[-107,-38],[-124,-19],[-136,5],[-139,6],[-130,20],[-114,-13],[-129,-27],[-134,12]]},"fish/grouper-moods":{"w":293,"h":255,"x":151,"y":124,"p":[[-140,5],[-144,15],[-143,33],[-130,-32],[-129,-6],[-131,-27],[-140,-6],[-139,-3]]}};
  // One look per fish name (FI_NAMES order); '' is the red sea bream, used by 深海魚王 and every later generation.
  var FI_SPECIES=['clownfish','blue-damsel','puffer','rainbowfish','sea-bass','tuna','mahi','sailfish','grouper',''];
  var FI_SPECIES_SIZE=[.8,.78,.84,.9,1.02,1.1,1.1,1.16,1.14,1.12];
  function fiSpecies(n){return Math.max(1,Math.min(n,10))-1;}
  function fiFishSheet(n,kind){var id=FI_SPECIES[fiSpecies(n)];return id?'fish/'+id+'-'+kind:kind;}
  function fiFishSize(n){return (.62+Math.min(n,14)*.018)*FI_SPECIES_SIZE[fiSpecies(n)];}
  var FI_TIMES=['dawn','morning','noon','dusk','night'],FI_FISH_PER_TIME=3;
  var FI_SEA={dawn:['#5d6f9a','#f3d9d6'],morning:['#2b8f93','#f4f1dc'],noon:['#1478bd','#f2fbff'],dusk:['#1d5470','#f6e4bf'],night:['#10294a','#b9c6d6']};
  var fiImages={},FV={now:0,man:0,fish:0,pose:'',mode:'',catchAge:9,lostAge:9,jump:0,fx:420,fy:600,drops:[],bg:0,bgFrom:0,bgMix:1,H:640};
  function fiImg(name){var i=fiImages[name];if(!i){i=fiImages[name]=new Image();i.decoding='async';i.src='games/fishing/art/'+name+'.webp';}return i.complete&&i.naturalWidth?i:null;}
  // Only the angler, the boat and the current and next fish are downloaded; later species load as the round reaches them.
  function fiPreload(){['reel','release','fight','result','boat'].forEach(fiImg);[FI.number,FI.number+1].forEach(function(n){['swim','thrash','moods'].forEach(function(kind){fiImg(fiFishSheet(n,kind));});});}
  // Draws one frame with its anchor at (x,y); returns the rod tip / mouth position on the canvas.
  function fiSprite(name,frame,x,y,s,angle){
    var m=FI_SHEETS[name],img=fiImg(name),g=fishingCtx,p=m.p[frame];
    if(img){g.save();g.translate(x,y);if(angle)g.rotate(angle);g.drawImage(img,frame%4*m.w,Math.floor(frame/4)*m.h,m.w,m.h,-m.x*s,-m.y*s,m.w*s,m.h*s);g.restore();}
    var c=Math.cos(angle||0),n=Math.sin(angle||0);return [x+(p[0]*c-p[1]*n)*s,y+(p[0]*n+p[1]*c)*s];
  }
  function fiSplash(x,y,count,power){if(reduceMotion)count=Math.ceil(count/3);for(var i=0;i<count&&FV.drops.length<90;i++)FV.drops.push({x:x+(Math.random()-.5)*70,y:y,vx:(Math.random()-.5)*260*power,vy:-(90+Math.random()*330)*power,r:2+Math.random()*4,age:0});}
  function fiSeason(){return FI.phase==='ready'?0:Math.floor(FI.landed/FI_FISH_PER_TIME)%FI_TIMES.length;}
  function fiBackdrop(index,alpha,W,H,water){
    var img=fiImg('bg-'+FI_TIMES[index]);if(!img)return;
    // The painted horizon sits at 53.5% of the image; keep it just above the animated water line.
    var horizon=water-46,s=Math.max(W/780,horizon/(1690*.535),(H-horizon)/(1690*.465));
    fishingCtx.globalAlpha=alpha;fishingCtx.drawImage(img,(W-780*s)/2,horizon-1690*.535*s,780*s,1690*s);fishingCtx.globalAlpha=1;
  }
  function fiWave(y,amp,len,speed,fill,foam,alpha,depth){
    var g=fishingCtx,W=520,t=FV.now,x;function wy(v){return y+Math.sin(v/len+t*speed)*amp+Math.sin(v/(len*.45)-t*speed*1.4)*amp*.35;}
    var shade=g.createLinearGradient(0,y-amp,0,y+depth);shade.addColorStop(0,fill);shade.addColorStop(1,fill+'00');
    g.globalAlpha=alpha;g.fillStyle=shade;g.beginPath();g.moveTo(0,y+depth);for(x=0;x<=W+8;x+=8)g.lineTo(x,wy(x));g.lineTo(W,y+depth);g.closePath();g.fill();g.globalAlpha=1;
    g.strokeStyle=foam;g.lineWidth=3;g.beginPath();for(x=0;x<=W+8;x+=8){if(x===0)g.moveTo(x,wy(x));else g.lineTo(x,wy(x));}g.stroke();
    // woodblock crests: cream foam claws curling over an indigo hollow, drifting along the wave
    var gap=170,start=((-t*speed*34)%gap+gap)%gap,size=Math.min(1.25,amp/8);
    for(x=start-gap;x<W+gap;x+=gap){var cx=x+60,cy=wy(cx)+3;g.save();g.translate(cx,cy);g.scale(speed>0?-size:size,size);
      g.fillStyle=foam;g.strokeStyle='#143a63';g.lineWidth=1.6;g.beginPath();g.moveTo(-42,3);g.bezierCurveTo(-22,0,-18,-22,4,-23);g.bezierCurveTo(22,-24,31,-10,25,-3);
      g.quadraticCurveTo(23,-9,17,-8);g.quadraticCurveTo(21,-2,14,1);g.quadraticCurveTo(13,-6,7,-5);g.bezierCurveTo(1,-16,-9,-9,-5,-2);g.quadraticCurveTo(8,4,40,3);g.closePath();g.fill();g.stroke();
      [[30,-17,3],[36,-8,2],[22,-27,2.2]].forEach(function(d){g.beginPath();g.arc(d[0],d[1],d[2],0,Math.PI*2);g.fill();g.stroke();});g.restore();}
  }
  function fiLine(from,to,tension){
    var g=fishingCtx,danger=tension>=88,shake=tension>75&&!reduceMotion?Math.sin(FV.now*70)*(tension-75)*.16:0;
    var sag=tension<30?(30-tension)*3.2:0,mx=(from[0]+to[0])/2+shake,my=(from[1]+to[1])/2+sag+shake*.5;
    g.lineCap='round';
    [[danger?6:4,'rgba(8,20,40,.55)'],[danger?3:1.8,danger?'#ff3b24':tension<=8?'#a9b8c4':'#fff8df']].forEach(function(pass){g.lineWidth=pass[0];g.strokeStyle=pass[1];g.beginPath();g.moveTo(from[0],from[1]);g.quadraticCurveTo(mx,my,to[0],to[1]);g.stroke();});
    if(danger){g.strokeStyle='#ffd84a';g.lineWidth=2.5;for(var i=0;i<6;i++){var a=i*1.05+Math.floor(FV.now*14)*.7,r=9+(i%3)*7;g.beginPath();g.moveTo(mx+Math.cos(a)*r,my+Math.sin(a)*r);g.lineTo(mx+Math.cos(a)*(r+12),my+Math.sin(a)*(r+12));g.stroke();}}
    g.lineCap='butt';
  }
  function fiSpeedLines(x,y,H){
    var g=fishingCtx,seed=Math.floor(FV.now*14);g.fillStyle='rgba(255,244,214,.42)';
    for(var i=0;i<26;i++){var a=i/26*Math.PI*2+((seed*7+i*13)%11)*.02,r=235+((seed*5+i*29)%90),far=800,w=.006+((i+seed)%3)*.004;
      g.beginPath();g.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);g.lineTo(x+Math.cos(a-w)*far,y+Math.sin(a-w)*far);g.lineTo(x+Math.cos(a+w)*far,y+Math.sin(a+w)*far);g.closePath();g.fill();}
  }
  function fiAura(x,y){
    var g=fishingCtx,t=reduceMotion?0:FV.now;
    for(var i=0;i<9;i++){var bx=x-150+i*27,h=95+Math.sin(t*9+i*2.1)*38+(i>1&&i<7?70:0),sway=Math.sin(t*7+i)*15;
      var grad=g.createLinearGradient(0,y,0,y-h);grad.addColorStop(0,'rgba(255,205,60,.75)');grad.addColorStop(1,'rgba(255,60,20,0)');g.fillStyle=grad;
      g.beginPath();g.moveTo(bx-20,y);g.quadraticCurveTo(bx-24,y-h*.5,bx+sway,y-h);g.quadraticCurveTo(bx+26,y-h*.45,bx+20,y);g.closePath();g.fill();}
  }
  function fiMark(x,y){var g=fishingCtx,s=1+(reduceMotion?0:Math.abs(Math.sin(FV.now*9))*.18);g.save();g.translate(x,y);g.scale(s,s);g.fillStyle='#ffd84a';g.strokeStyle='#17223f';g.lineWidth=5;g.lineJoin='round';
    g.beginPath();g.moveTo(-11,-46);g.lineTo(11,-46);g.lineTo(5,-12);g.lineTo(-5,-12);g.closePath();g.stroke();g.fill();g.beginPath();g.arc(0,2,7,0,Math.PI*2);g.stroke();g.fill();g.restore();}
  function fiSpark(x,y,r){var g=fishingCtx;g.fillStyle='#ffe27a';g.beginPath();for(var i=0;i<8;i++){var a=i*Math.PI/4,d=i%2?r*.32:r;g.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d);}g.closePath();g.fill();}
  // Distance to shore as a little chart, deliberately unlike the tension meter: a boat, a dotted sea route and the hooked
  // fish swimming along it (0 m is at the boat).
  function fiBoatIcon(x,y){
    var g=fishingCtx;g.save();g.translate(x,y);g.lineJoin='round';g.lineWidth=2;g.strokeStyle='#e8b04b';
    g.fillStyle='#fff2d2';g.beginPath();g.moveTo(1,-20);g.lineTo(1,-2);g.lineTo(-17,-2);g.closePath();g.fill();
    g.fillStyle='#e8442c';g.beginPath();g.moveTo(5,-16);g.lineTo(18,-2);g.lineTo(5,-2);g.closePath();g.fill();
    g.fillStyle='#b96f33';g.beginPath();g.moveTo(-23,2);g.lineTo(25,2);g.lineTo(16,15);g.lineTo(-15,15);g.closePath();g.fill();g.stroke();g.restore();
  }
  function fiGauge(){
    var g=fishingCtx,from=96,to=466,d=Math.max(0,FI.distance),start=FI.start||1;
    var at=d<=start?d/start*.72:.72+Math.min(1,(d-start)/(start*.8))*.28,x=from+(to-from)*at,away=FI.mode==='struggle';
    g.fillStyle='rgba(18,28,56,.82)';g.beginPath();[[38,8],[482,8],[510,36],[482,64],[38,64],[10,36]].forEach(function(p){g.lineTo(p[0],p[1]);});g.closePath();g.fill();g.strokeStyle='#e8b04b';g.lineWidth=2;g.stroke();
    fiBoatIcon(54,35);
    // sea route: dots that drift toward the boat while reeling in, away from it while the fish runs
    var drift=reduceMotion?0:(FV.now*(away?10:-10))%18;
    g.fillStyle=away?'#ff8a6a':'#8fd4e8';for(var px=from+((drift+18)%18);px<to+8;px+=18){g.beginPath();g.arc(px,35+Math.sin(px/17)*4,px<x?3.2:2,0,Math.PI*2);g.globalAlpha=px<x?1:.3;g.fill();}g.globalAlpha=1;
    var name=fiFishSheet(FI.number,'swim'),m=FI_SHEETS[name];
    g.fillStyle='rgba(255,242,210,.95)';g.beginPath();g.ellipse(x+4,31,38,20,0,0,Math.PI*2);g.fill();g.strokeStyle=away?'#e8442c':'#e8b04b';g.lineWidth=3;g.stroke();
    fiSprite(name,reduceMotion?0:Math.floor(FV.now*(away?16:9))%8,x+4,31,62/m.w,0);
    var tag=d.toFixed(1)+' m',tx=Math.max(from+30,Math.min(to-22,x+4));
    g.fillStyle='#17223f';g.fillRect(tx-34,52,68,19);g.strokeStyle='#e8b04b';g.lineWidth=1.5;g.strokeRect(tx-34,52,68,19);
    g.font='800 13px system-ui';g.textAlign='center';g.fillStyle=away?'#ff9a80':'#fff2d2';g.fillText(tag,tx,66);
  }
  function fiResize(){
    var c=fishingCanvas,w=c.clientWidth,h=c.clientHeight;
    var H=w&&h?Math.round(Math.max(600,Math.min(1130,520*h/w))):640,k=Math.max(1,Math.min(2,(w||520)*(window.devicePixelRatio||1)/520));
    var bw=Math.round(520*k),bh=Math.round(H*k);if(c.width!==bw||c.height!==bh){c.width=bw;c.height=bh;}
    fishingCtx.setTransform(bw/520,0,0,bh/H,0,0);FV.H=H;
  }
  function fiDraw(dt){
    dt=Math.max(0,Math.min(.05,dt||0));FV.now+=dt;FV.catchAge+=dt;FV.lostAge+=dt;
    fiResize();fiPreload();
    var g=fishingCtx,W=520,H=FV.H,t=FV.now,water=Math.round(Math.max(372,H*(H<760?.6:.5)));
    var fishing=FI.phase==='fishing',mode=fishing?FI.mode:'calm',tension=Math.max(0,Math.min(100,FI.tension));
    if(fishing&&FI.hold&&FV.catchAge>.35)FV.catchAge=9;
    var catching=fishing&&FV.catchAge<1.4,struggle=mode==='struggle'&&!catching,clash=struggle&&FI.hold;

    var season=fiSeason();if(season!==FV.bg){FV.bgFrom=FV.bg;FV.bg=season;FV.bgMix=0;}FV.bgMix=Math.min(1,FV.bgMix+dt/2.5);
    fiImg('bg-'+FI_TIMES[(season+1)%FI_TIMES.length]);
    var sea=FI_SEA[FI_TIMES[FV.bg]];
    g.fillStyle=sea[0];g.fillRect(0,0,W,H);
    g.save();
    var quake=reduceMotion?0:clash?3.5:fishing&&tension>=88?2:0;if(quake)g.translate(Math.sin(t*61)*quake,Math.cos(t*47)*quake);
    if(FV.bgMix<1)fiBackdrop(FV.bgFrom,1,W,H,water);
    fiBackdrop(FV.bg,FV.bgMix,W,H,water);

    // ----- fish position -----
    // keep the fish above the tension bar and button on short phones (about 170 CSS px at the bottom)
    var covered=(window.innerHeight>740?224:184)*520/(fishingCanvas.clientWidth||390),depth=Math.max(74,Math.min(118,H-covered-water-52));
    var progress=Math.max(-.6,Math.min(1,1-FI.distance/FI.start)),size=fiFishSize(FI.number),swimSheet=FI_SHEETS[fiFishSheet(FI.number,'swim')],reach=(swimSheet.w-swimSheet.x)*size;
    var tx=Math.min(398,394-progress*70)+Math.sin(t*1.3)*(mode==='calm'?12:5),ty=water+depth-Math.max(0,progress)*Math.max(0,depth-84)+Math.sin(t*2.2)*7,angle=Math.sin(t*2.2+1)*.05,air=0;
    if(!fishing&&FI.phase!=='lost'){tx=320+Math.sin(t*.7)*70;ty=water+depth+Math.sin(t*1.4)*12;}
    tx=Math.min(tx,514-reach); // keep long tails and big fish on screen
    if(mode!==FV.mode){if(mode==='struggle')FV.jump=0;FV.mode=mode;}
    if(struggle){
      var before=FV.jump;FV.jump=(FV.jump+dt/1.05)%1;
      var u=FV.jump,lift=u<.68?Math.sin(u/.68*Math.PI):-Math.sin((u-.68)/.32*Math.PI)*.35;
      ty=water+34-lift*(lift>0?175:130);tx+=Math.sin(u*Math.PI*2)*14-8;angle=u<.68?(u/.68-.5)*.9:0;air=lift;
      if(dt&&(u<before||before<.68&&u>=.68))fiSplash(tx,water,26,1.1);
      if(dt&&Math.random()<dt*14)fiSplash(tx,water,2,.7);
    }else if(mode==='warn'){tx+=reduceMotion?0:Math.sin(t*38)*3;ty=water+82+Math.sin(t*9)*5;if(dt&&Math.random()<dt*12)fiSplash(tx,water,2,.5);}
    var ease=struggle?1:Math.min(1,dt*5);FV.fx+=(tx-FV.fx)*ease;FV.fy+=(ty-FV.fy)*ease;
    if(FI.phase==='lost'){FV.fx=Math.min(680,tx+FV.lostAge*150);FV.fy=ty+Math.min(80,FV.lostAge*35);}

    // ----- man pose and frame rate -----
    var feetX=214,feetY=water-52+Math.sin(t*1.8)*4,pose,frame;
    if(FI.phase==='lost'){pose='result';frame=4+Math.min(3,Math.floor(FV.lostAge/.22));}
    else if(catching){pose='result';frame=Math.min(3,Math.floor(FV.catchAge/.2));}
    else{
      pose=!fishing?'release':FI.hold?(struggle||tension>=85?'fight':'reel'):'release';
      var fps=pose==='fight'?11+tension*.07:pose==='reel'?(mode==='tired'?15:8+tension*.05):struggle?12:fishing?7:4.5;
      FV.man=(FV.man+dt*fps)%8;frame=Math.floor(FV.man);
    }
    if(clash)fiAura(feetX-30,feetY);
    var boat=fiImg('boat');if(boat)g.drawImage(boat,-188,feetY-52,474,474*boat.naturalHeight/boat.naturalWidth);
    var tip=fiSprite(pose,frame,feetX,feetY,.82,0);

    // ----- fish -----
    var sheet='swim',base=0,count=8,rate=mode==='calm'?9:10;
    if(struggle){sheet='thrash';rate=17;}else if(mode==='warn'){sheet='moods';count=4;rate=11;}else if(mode==='tired'){sheet='moods';base=4;count=4;rate=FI.hold?5.5:3.5;}else if(fishing&&FI.hold){rate=14;}
    FV.fish=(FV.fish+dt*rate)%8;var ff=base+Math.floor(FV.fish)%count;
    var foam=sea[1],mouth=null;
    function drawFish(){
      if(FI.phase==='lost'){g.save();g.translate(FV.fx,FV.fy);g.scale(-1,1);fiSprite(fiFishSheet(FI.number,'swim'),Math.floor(t*14)%8,0,0,size,0);g.restore();return;}
      mouth=fiSprite(fiFishSheet(FI.number,sheet),ff,FV.fx,FV.fy,size,angle);
    }
    var under=!struggle||air<=0;
    if(!catching&&under){g.globalAlpha=FI.phase==='lost'?Math.max(0,1-FV.lostAge/1.6):.9;drawFish();g.globalAlpha=1;}
    fiWave(water,9,46,1.7,sea[0],foam,.72,90);
    if(!catching&&!under)drawFish();
    fiWave(water+22+(struggle?Math.sin(t*8)*5:0),struggle?13:6,31,-2.3,sea[0],foam,.34,70);
    if(fishing&&!catching&&mouth)fiLine(tip,mouth,tension);

    // landed fish flies up onto the boat while the next one is already on the way
    if(catching){var c=Math.min(1,FV.catchAge/.75),top=Math.max(88,water-405),hx=FV.fx+(206-FV.fx)*c,hy=water+40+(top-water-40)*c-Math.sin(c*Math.PI)*90;
      var land=FV.catchAge>1.1?1-(FV.catchAge-1.1)/.3:1;g.globalAlpha=Math.max(0,land);
      if(c>=1)for(var s=0;s<7;s++){var sa=s*.9+t*2.4;fiSpark(hx+Math.cos(sa)*108,hy+Math.sin(sa)*74,11+(s%3)*4);}
      fiSprite(fiFishSheet(FI.number-1,'thrash'),Math.floor(t*14)%8,hx,hy,fiFishSize(FI.number-1)*.95,.55);g.globalAlpha=1;}

    FV.drops.forEach(function(d){d.age+=dt;d.vy+=720*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;g.globalAlpha=Math.max(0,1-d.age/.9);g.fillStyle=foam;g.strokeStyle='#17446a';g.lineWidth=1.4;g.beginPath();g.arc(d.x,d.y,d.r,0,Math.PI*2);g.fill();g.stroke();});g.globalAlpha=1;
    FV.drops=FV.drops.filter(function(d){return d.age<.9&&d.y<water+40;});

    if(fishing&&!catching){
      if(mode==='warn')fiMark(FV.fx-6,FV.fy-64*size);
      if(mode==='tired'){for(var z=0;z<3;z++){var za=t*3.4+z*2.09;fiSpark(FV.fx-62*size+Math.cos(za)*34,FV.fy-62*size+Math.sin(za)*11,9);}
        g.strokeStyle='rgba(255,216,74,'+(.55+Math.sin(t*5)*.2)+')';g.lineWidth=4;g.beginPath();g.ellipse(FV.fx,FV.fy,128*size+Math.sin(t*5)*5,70*size,0,0,Math.PI*2);g.stroke();}
    }
    if(FV.bg===4){g.fillStyle='rgba(20,36,86,.16)';g.fillRect(-8,0,W+16,H+8);}
    g.restore();
    if(clash&&!reduceMotion)fiSpeedLines(FV.fx-60,FV.fy-20,H);

    function banner(y,h){g.fillStyle='rgba(18,28,56,.9)';g.fillRect(42,y,436,h);g.strokeStyle='#e8b04b';g.lineWidth=4;g.strokeRect(42,y,436,h);g.lineWidth=1.5;g.strokeRect(50,y+8,420,h-16);}
    g.textAlign='center';
    FI.pops.forEach(function(p){g.globalAlpha=Math.max(0,1-p.age/2.2);var py=Math.max(146,water-390)-(reduceMotion?0:Math.min(1,p.age*3)*22);g.lineJoin='round';g.strokeStyle='#17223f';g.lineWidth=7;g.fillStyle='#ffd84a';g.font='800 46px system-ui';g.strokeText('+'+p.b+' 點',W/2,py);g.fillText('+'+p.b+' 點',W/2,py);g.fillStyle='#fff6de';g.font='700 20px system-ui';g.lineWidth=5;g.strokeText('釣到 '+p.n+' 條里程碑',W/2,py+32);g.fillText('釣到 '+p.n+' 條里程碑',W/2,py+32);g.globalAlpha=1;});
    if(fishing){fiGauge();if(FI.earned>0){g.fillStyle='rgba(18,28,56,.78)';g.fillRect(10,78,204,26);g.fillStyle='#fff2d2';g.font='700 14px system-ui';g.textAlign='left';g.fillText('第 '+FI.number+' 條 · 本局 +'+FI.earned+' 點',20,96);}}
    if(FI.phase==='lost'||FI.phase==='ready'){
      var by=10;banner(by,112);g.textAlign='center';g.fillStyle='#fff6de';g.font='800 14px system-ui';g.fillText('{{t:fishing.msg.028}}',W/2,by+25);g.fillStyle=FI.phase==='lost'?'#ff8a6a':'#ffd84a';g.font='800 25px system-ui';g.fillText(FI.phase==='ready'?'{{t:fishing.msg.030}}':'{{t:fishing.msg.031}}',W/2,by+55);g.fillStyle='#fff6de';g.font='15px system-ui';g.fillText(FI.phase==='ready'?'{{t:fishing.msg.032}}':'本局釣到 '+FI.landed+' 條'+(FI.earned>0?' · 入帳 +'+FI.earned+' 點':''),W/2,by+79);g.font='12px system-ui';g.fillStyle='#d8c9a4';g.fillText('{{t:fishing.msg.029}}',W/2,by+97);
    }
  }
  function fiPress(e){if(e.button!==undefined&&e.button!==0)return;if(FI.phase!=='fishing'||$('view-fishing').hidden||document.hidden)return;e.preventDefault();fiSync(performance.now());if(FI.phase!=='fishing')return;fishingCanvas.focus();fishingPointers.add(e.pointerId);fiHold(true);try{e.currentTarget.setPointerCapture(e.pointerId);}catch(_){}fiUI();}
  function fiLift(e){fiSync(performance.now());fishingPointers.delete(e.pointerId);fiHold(fishingPointers.size>0||fishingKeys.size>0);}
  [fishingCanvas,$('fi-hold')].forEach(function(el){el.addEventListener('pointerdown',fiPress);['pointerup','pointercancel','lostpointercapture'].forEach(function(type){el.addEventListener(type,fiLift);});});
  $('fi-go').addEventListener('click',fiStart);
  addEventListener('keydown',function(e){if($('view-fishing').hidden||document.hidden||FI.phase!=='fishing'||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;if(['INPUT','BUTTON','A','SUMMARY'].indexOf(e.target.tagName)>=0)return;if(e.code==='Space'){e.preventDefault();fiSync(performance.now());if(FI.phase==='fishing'){fishingKeys.add(e.code);fiHold(true);}}});
  addEventListener('keyup',function(e){if(e.code!=='Space')return;if(!$('view-fishing').hidden)e.preventDefault();fiSync(performance.now());fishingKeys.delete(e.code);fiHold(fishingPointers.size>0||fishingKeys.size>0);});
  addEventListener('blur',function(){fiRelease();FI.last=performance.now();});
  document.addEventListener('visibilitychange',function(){fiRelease();FI.last=performance.now();});
  window.addEventListener('hashchange',function(){fiRelease();FI.last=performance.now();});
  var fiShown=0;function fiLoop(now){var dt=fiShown?(now-fiShown)/1000:0;fiShown=now;fiSync(now);FI.pops.forEach(function(p){p.age+=.016;});FI.pops=FI.pops.filter(function(p){return p.age<2.2;});if(!$('view-fishing').hidden&&!document.hidden){fiUI();fiDraw(dt);}requestAnimationFrame(fiLoop);}
  fiUI();requestAnimationFrame(fiLoop);


