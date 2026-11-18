// Cropped production art, separate from the concept board. Geometric fallback keeps slow/offline loads playable.
var ftAtlas=typeof Image==='function'?new Image():null;
if(ftAtlas)ftAtlas.src='games/frontier/art/sprites.png';
function ftSprite(index,x,y,size){if(!ftAtlas||!ftAtlas.complete||!ftAtlas.naturalWidth)return false;var cell=ftAtlas.naturalWidth/4;ctx.drawImage(ftAtlas,index%4*cell,Math.floor(index/4)*cell,cell,cell,x-size/2,y-size*.89,size,size);return true;}
var ftEnemyAtlas=typeof Image==='function'?new Image():null;
if(ftEnemyAtlas)ftEnemyAtlas.src='games/frontier/art/enemies.png';
function ftEnemySprite(e){if(!ftEnemyAtlas||!ftEnemyAtlas.complete||!ftEnemyAtlas.naturalWidth)return false;var cellW=ftEnemyAtlas.naturalWidth/2,cellH=ftEnemyAtlas.naturalHeight/2,index=e.type==='boss'?3:e.type==='charger'?2:e.type==='ranged'?1:0,size=e.type==='boss'?120:82;ctx.drawImage(ftEnemyAtlas,index%2*cellW,Math.floor(index/2)*cellH,cellW,cellH,e.x-size*cellW/cellH/2,e.y-size*.89,size*cellW/cellH,size);return true;}
function point(x,y,r,fill,stroke){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function text(label,x,y,size,color){ctx.font='600 '+(size||13)+'px system-ui';ctx.textAlign='center';ctx.fillStyle=color||'#f6efd3';ctx.fillText(label,x,y,155);}
// Visual feedback is derived from existing effects: no new save fields or gameplay timers.
function ftEllipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function ftPoly(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(function(p,i){if(i)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);});ctx.closePath();ctx.fill();}
function ftResource(n,w,palette){
 var hit=w.effects.find(function(e){return e.kind===n.kind&&e.x===n.x&&e.y===n.y;}),a=hit?Math.max(0,hit.t/.3):0;
 ctx.save();if(n.kind==='wood'&&w.p.y<n.y+10&&w.p.y>n.y-110&&Math.abs(w.p.x-n.x)<55)ctx.globalAlpha=.38;ctx.translate(n.x,n.y);ctx.rotate(Math.sin(a*18)*a*.075);
 if(ftAtlas&&ftAtlas.complete&&ftAtlas.naturalWidth){
  if(n.kind==='wood'){if(n.left)ftSprite(2,0,0,118);else{ftSprite(3,0,0,48);if(hit&&hit.empty){ctx.save();ctx.globalAlpha*=a;ctx.rotate((1-a)*1.1);ftSprite(2,0,0,118);ctx.restore();}}}
  else{if(!n.left)ctx.globalAlpha*=.6;ftSprite(4,0,0,n.left?78:28);}
  ctx.restore();return;
 }
 ftEllipse(5,7,n.kind==='wood'?29:27,11,'#183c3840');
 if(n.kind==='wood'){
  ctx.fillStyle='#795135';ctx.fillRect(-9,-42,18,43);ftEllipse(0,0,10,5,'#c99a60');ftEllipse(0,-1,5,2,'#815939');
  if(n.left||hit&&hit.empty){
   if(hit&&hit.empty){ctx.translate(0,4);ctx.rotate((1-a)*1.1);ctx.globalAlpha=a;}
   ftPoly([[-8,-10],[-20,-23],[-17,-28],[-4,-17]],'#63452e');ctx.fillStyle='#b7844d';ctx.fillRect(-7,-43,5,36);
   var green=w.cfg.chapter===3?'#b4d4bd':palette[2];
   [[-20,-43,22,'#285647'],[16,-46,24,'#316b4d'],[0,-69,29,green],[-18,-62,21,'#579459'],[17,-71,20,'#73aa64'],[-6,-83,15,'#94bc75']].forEach(function(c){point(c[0],c[1],c[2],c[3]);});
   ftEllipse(-11,-82,10,4,'#d9e9a33d');ftEllipse(22,-59,6,3,'#d9e9a34a');
  }
 }else if(n.left||hit&&hit.empty){
  if(hit&&hit.empty)ctx.globalAlpha=a;
  ftPoly([[-28,0],[-24,-24],[-8,-42],[15,-37],[30,-13],[22,5]],'#526b73');
  ftPoly([[-24,-24],[-8,-42],[15,-37],[3,-18]],'#b4c7c5');
  ftPoly([[3,-18],[15,-37],[30,-13],[22,5],[2,0]],'#7f9d9e');
  ftPoly([[-28,0],[-24,-24],[3,-18],[2,0]],'#728b8f');
  ctx.strokeStyle='#d9e7dc80';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-7,-36);ctx.lineTo(-13,-24);ctx.lineTo(-5,-15);ctx.stroke();
  if(n.left<4){ctx.strokeStyle='#304c58';ctx.beginPath();ctx.moveTo(2,-26);ctx.lineTo(7,-17);ctx.lineTo(0,-10);ctx.lineTo(5,0);ctx.stroke();}
 }else{ftEllipse(-7,0,8,4,'#708782');ftEllipse(9,2,5,3,'#9bb0a4');}
 ctx.restore();
}
function ftExplorer(w){
 var p=w.p,action=w.effects.filter(function(e){return (e.kind==='wood'||e.kind==='stone'||e.kind==='hit')&&Math.hypot(e.x-p.x,e.y-p.y)<90;}).slice(-1)[0];
 var moving=typeof keys!=='undefined'&&(Object.values(keys).some(Boolean)||Math.hypot(stick.x,stick.y)>.1),bob=moving?Math.sin(w.time*16)*2:Math.sin(w.time*2)*.7;
 if(ftAtlas&&ftAtlas.complete&&ftAtlas.naturalWidth){ctx.save();ctx.translate(p.x,p.y+bob);ctx.scale(action&&action.x<p.x||!action&&p.dx<0?-1:1,1);if(p.inv>0)ctx.globalAlpha=.65;ftSprite(action?1:0,0,0,91);var cargo=Math.min(4,Math.ceil((w.bag.wood+w.bag.stone)/7));for(var si=0;si<cargo;si++)ftSprite(5,-22,-5-si*8,28);ctx.restore();return;}
 ftEllipse(p.x+3,p.y+7,19,8,'#173d4560');ctx.save();ctx.translate(p.x,p.y+bob);if(p.inv>0)ctx.globalAlpha=.65;
 var face=action?(action.x<p.x?-1:1):(p.dx<0?-1:1);ctx.scale(face,1);
 var walk=moving?Math.sin(w.time*16)*4:0;
 ctx.fillStyle='#263c50';ctx.fillRect(-10,-3+walk,8,12);ctx.fillRect(3,-3-walk,8,12);ftEllipse(-6,9+walk,7,4,'#423b34');ftEllipse(7,9-walk,7,4,'#423b34');
 ctx.fillStyle='#956a44';ctx.beginPath();ctx.roundRect(-21,-28,17,27,5);ctx.fill();ctx.fillStyle='#dab47c';ctx.fillRect(-18,-22,10,3);
 ctx.fillStyle='#367d83';ctx.beginPath();ctx.roundRect(-12,-30,25,28,7);ctx.fill();ctx.fillStyle='#6fb1a4';ctx.fillRect(-9,-28,5,22);ctx.fillStyle='#493f35';ctx.fillRect(-12,-8,25,5);ctx.fillStyle='#efc571';ctx.fillRect(-1,-8,5,5);
 point(1,-39,13,'#eebf94');ftEllipse(7,-37,2,3,'#2b3841');ftEllipse(11,-32,3,2,'#d98d78');
 ftEllipse(0,-48,16,10,'#d5ac63');ftEllipse(1,-44,23,5,'#f3d38f');ctx.fillStyle='#446b63';ctx.fillRect(-14,-49,28,4);ftPoly([[9,-51],[12,-65],[17,-58],[13,-48]],'#9fcec0');
 ctx.save();ctx.translate(12,-23);var progress=action?1-Math.min(1,action.t/(action.kind==='hit'?.22:.3)):0;ctx.rotate(action?-1.8+Math.sin(progress*Math.PI)*2.8:-.5);
 point(1,0,5,'#edbe94');ctx.strokeStyle='#b78752';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,4);ctx.lineTo(0,-28);ctx.stroke();
 ftPoly([[0,-29],[15,-34],[20,-25],[14,-17],[0,-20]],'#d7e9e4');ftPoly([[14,-33],[20,-25],[14,-17],[11,-20]],'#ffffff');ctx.restore();
 if(action){ctx.strokeStyle='#fff0bb99';ctx.lineWidth=4;ctx.beginPath();ctx.arc(12,-23,36,-1.7,1.1);ctx.stroke();}
 for(var j=0;j<Math.min(5,Math.ceil((w.bag.wood+w.bag.stone)/5));j++){ctx.fillStyle=j%2?'#a66d40':'#c9965b';ctx.fillRect(-25,-13-j*6,17,5);point(-25,-11-j*6,3,'#edc789');}ctx.restore();
}
function ftParticles(e){
 if(e.kind==='pickup'||e.kind==='delivery'){var lift=(1-e.t/1.2)*25;ctx.save();ctx.globalAlpha=Math.min(1,e.t*2);text((e.kind==='pickup'?'拾取':'入庫')+' 🪵 +'+e.wood+' ◆ +'+e.stone,e.x,e.y-35-lift,13,e.kind==='pickup'?'#ffe6a4':'#baf1cc');ctx.restore();return;}
 var harvest=e.kind==='wood'||e.kind==='stone',duration=harvest?.3:e.kind==='hit'?.22:1,age=1-Math.min(1,e.t/duration);
 if(harvest){
  for(var i=0;i<9;i++){var angle=i*2.399+e.x,dist=10+age*(22+i*3),x=e.x+Math.cos(angle)*dist,y=e.y-25+Math.sin(angle)*dist*.6-age*20+age*age*35;ctx.save();ctx.globalAlpha=1-age;ctx.translate(x,y);ctx.rotate(angle+age*7);ctx.fillStyle=e.kind==='wood'?['#edc78c','#98663f','#a9ca70'][i%3]:['#e0ede6','#90adb0','#5c7d88'][i%3];ctx.fillRect(-3,-2,e.kind==='wood'?8:5,4);ctx.restore();}
  ctx.save();ctx.globalAlpha=1-age;ctx.strokeStyle='#fff2cb';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(e.x-12,e.y-34);ctx.lineTo(e.x+12,e.y-15);ctx.moveTo(e.x+10,e.y-37);ctx.lineTo(e.x-8,e.y-13);ctx.stroke();text('+'+(e.gain||1),e.x,e.y-48-age*30,18,'#fff0b6');ctx.restore();
 }else{ctx.save();ctx.globalAlpha=Math.min(1,e.t*4);point(e.x,e.y,12+age*25,'#ffffff00',e.kind==='hit'?'#ffedbc':'#f7e6ac88');ctx.restore();}
}
function paint(){
 var w=world||preview,rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
 var dpr=Math.min(2,window.devicePixelRatio||1),cw=Math.round(rect.width*dpr),ch=Math.round(rect.height*dpr);if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,rect.width,rect.height);
 var scale=Math.max(rect.width/(rect.width<600?480:1000),Math.min(1.1,rect.height/520)),vw=rect.width/scale,vh=rect.height/scale;
 var cx=Math.max(vw/2,Math.min(w.cfg.width-vw/2,w.p.x)),cy=Math.max(vh/2,Math.min(w.cfg.height-vh/2,w.p.y));if(vw>w.cfg.width)cx=w.cfg.width/2;if(vh>w.cfg.height)cy=w.cfg.height/2;viewCamera={left:cx-vw/2,top:cy-vh/2,scale:scale};
 ctx.scale(scale,scale);ctx.translate(vw/2-cx,vh/2-cy);
 var palette=[['#244e4b','#8cae70','#426e4e'],['#264c60','#a3aa78','#6d8655'],['#273e42','#718658','#3b5b49'],['#344e65','#b1c4c2','#668b88'],['#382f3c','#8f7965','#534a50']][w.cfg.chapter];
 var sea=ctx.createLinearGradient(0,0,0,w.cfg.height);if(sea&&sea.addColorStop){sea.addColorStop(0,'#267c85');sea.addColorStop(1,'#164e66');}ctx.fillStyle=sea||palette[0];ctx.fillRect(cx-vw/2,cy-vh/2,vw,vh);
 ctx.strokeStyle='#83cfbe33';ctx.lineWidth=12;ctx.beginPath();ctx.roundRect(17,22,w.cfg.width-34,w.cfg.height-38,84);ctx.stroke();ctx.fillStyle='#c7b991';ctx.beginPath();ctx.roundRect(26,31,w.cfg.width-52,w.cfg.height-56,75);ctx.fill();ctx.fillStyle=palette[1];ctx.beginPath();ctx.roundRect(42,47,w.cfg.width-84,w.cfg.height-88,60);ctx.fill();for(var patch=0;patch<90;patch++){var ax=80+(patch*137)%(w.cfg.width-160),ay=85+(patch*223)%(w.cfg.height-170);if(ax>515&&ax<710)continue;ftEllipse(ax,ay,24+patch%5*8,12+patch%4*6,patch%2?'#b7d77924':'#3b793424');}ctx.strokeStyle='#d3bc8580';ctx.lineWidth=22;ctx.lineCap='round';w.buildings.forEach(function(b){if(b.x>530||b.kind==='camp')return;ctx.beginPath();ctx.moveTo(180,450);ctx.quadraticCurveTo((180+b.x)/2,450,b.x,b.y);ctx.stroke();});ctx.fillStyle=palette[0];ctx.fillRect(552,40,126,w.cfg.height-80);
 for(var t=0;t<Math.ceil(w.cfg.height/34);t++){ctx.strokeStyle='#ffffff12';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(567,65+t*34);ctx.lineTo(656,72+t*34);ctx.stroke();}
 if(frontierBuilt(w,'bridge')){ctx.fillStyle='#6b523b';ctx.fillRect(537,385,156,130);for(t=0;t<11;t++){ctx.fillStyle=t%2?'#b99762':'#cbaa75';ctx.fillRect(539+t*14,390,11,120);}}
 for(t=0;t<w.cfg.trees;t++){var gx=75+(t*137)%(w.cfg.width-150),gy=90+(t*233)%(w.cfg.height-180);if(gx>530&&gx<700)continue;ctx.strokeStyle=t%3?'#325d4333':'#f0e7a04d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(gx-3,gy+3);ctx.lineTo(gx,gy-3);ctx.lineTo(gx+3,gy+3);ctx.stroke();if(t%11===0){point(gx+5,gy,2,'#ead399');}}
 if(w.cfg.chapter>=2&&w.time%9>6){var hx=800+Math.floor(w.time/9)%3*120,hy=240+Math.floor(w.time/9)%2*360;point(hx,hy,70,w.time%9>7.2?'#ee573f99':'#edb45255','#ffd183');text('危險區',hx,hy-77,12);}
 w.enemies.forEach(function(e){if(e.hp<=0||e.state==='walk')return;
  if(e.type==='charger'||e.type==='ranged'){ctx.strokeStyle=e.state==='warn'?'#f8b16d':'#ff5748';ctx.lineWidth=e.type==='charger'?34:3;ctx.globalAlpha=.5;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.tx,e.ty);ctx.stroke();ctx.globalAlpha=1;}
  else point(e.tx,e.ty,e.type==='boss'?90:48,e.state==='warn'?'#e84b493b':'#fa694e99','#ffb398');
 });
 var objects=[];
 w.nodes.forEach(function(n){if(Math.abs(n.x-cx)>vw/2+80||Math.abs(n.y-cy)>vh/2+110)return;objects.push({y:n.y,draw:function(){ftResource(n,w,palette);}});});
 w.buildings.forEach(function(b){objects.push({y:b.y+12,draw:function(){
  if(b.kind==='bridge'&&b.built)return;
  if(!b.built){ctx.save();ctx.globalAlpha=.27;ftBuilding(b,w);ctx.restore();}
  if(b.built){ctx.save();if(Math.abs(w.p.x-b.x)<48&&w.p.y>b.y-88&&w.p.y<b.y+12)ctx.globalAlpha=.38;ftBuilding(b,w);ctx.restore();}else{
   ctx.fillStyle='#b29b6d66';ctx.fillRect(b.x-31,b.y-14,62,30);ctx.fillStyle='#98734f';for(var stake=0;stake<4;stake++)ctx.fillRect(b.x+(stake%2?28:-31),b.y+(stake>1?11:-17),4,13);ctx.fillStyle='#123b31e6';ctx.beginPath();ctx.roundRect(b.x-52,b.y+12,104,23,7);ctx.fill();
   text('🪵 '+b.wood+' ◆ '+b.stone,b.x,b.y+28,11);if(b.kind==='beacon'&&!frontierReady(w))text('先完成任務',b.x,b.y+22,10);
  }
  text(labels[b.kind],b.x,b.y+(b.built?24:-119),12);if(b.built&&b.hp>0&&['mill','quarry','forge'].includes(b.kind))text(b.kind==='mill'?'伐木 +1 · 工具上限 8':b.kind==='quarry'?'採石 +1 · 背包 +12':'攻擊 +9 · 武器上限 8',b.x,b.y+40,10,'#ffe4a4');
 }});});
 if(w.cfg.mission==='rescue')w.cages.forEach(function(c){objects.push({y:c.y,draw:function(){point(c.x,c.y,20,c.open?'#b9d59b':'#6e7460','#f1d89d');text(c.open?'✓':'!',c.x,c.y+5,20);if(!c.open){ctx.strokeStyle='#dfd3a7';for(var j=-12;j<=12;j+=8){ctx.beginPath();ctx.moveTo(c.x+j,c.y-20);ctx.lineTo(c.x+j,c.y+20);ctx.stroke();}}}});});
 w.enemies.forEach(function(e){if(e.hp<=0)return;objects.push({y:e.y,draw:function(){
  if(ftEnemySprite(e)){ctx.fillStyle='#473e38';ctx.fillRect(e.x-25,e.y-(e.type==='boss'?122:83),50,5);ctx.fillStyle='#ef9e80';ctx.fillRect(e.x-25,e.y-(e.type==='boss'?122:83),50*Math.max(0,e.hp/e.max),5);if(e.state==='warn')text('!',e.x,e.y-(e.type==='boss'?130:92),23,'#ffe2a0');return;}
  point(e.x+4,e.y+6,e.radius,'#173a3433');point(e.x,e.y-9,e.radius,e.type==='boss'?'#995a62':e.type==='ranged'?'#9279a1':e.type==='charger'?'#b07a55':'#687a65','#d6ba91');point(e.x-6,e.y-13,3,'#fff4d6');point(e.x+6,e.y-13,3,'#fff4d6');ctx.fillStyle='#313d34';ctx.fillRect(e.x-4,e.y-9,8,3);ctx.fillStyle='#473e38';ctx.fillRect(e.x-23,e.y-e.radius-23,46,5);ctx.fillStyle='#ef9e80';ctx.fillRect(e.x-23,e.y-e.radius-23,46*Math.max(0,e.hp/e.max),5);if(e.state==='warn')text('!',e.x,e.y-e.radius-30,23,'#ffe2a0');
 }});});
 w.supplies.forEach(function(d){objects.push({y:d.y,draw:function(){ftEllipse(d.x,d.y+3,15,6,'#173d3c44');if(ftSprite(d.kind==='wood'?5:4,d.x,d.y,38)){text(String(d.amount),d.x,d.y-25,11,'#fff3bf');return;}if(d.kind==='wood'){for(var j=0;j<3;j++){ctx.fillStyle=j%2?'#c18b52':'#aa7044';ctx.fillRect(d.x-11+j*3,d.y-6-j*4,18,5);point(d.x-11+j*3,d.y-4-j*4,3,'#edc78e');}}else{ftPoly([[d.x-12,d.y],[d.x-8,d.y-13],[d.x+3,d.y-18],[d.x+13,d.y-6],[d.x+9,d.y+3]],'#a6c2c5');ftPoly([[d.x-8,d.y-13],[d.x+3,d.y-18],[d.x+6,d.y-7]],'#e1e9df');}text(String(d.amount),d.x,d.y-25,11,'#fff3bf');}});});
 w.workers.forEach(function(a,i){objects.push({y:a.y,draw:function(){if(ftSprite(a.t>.5?1:0,a.x,a.y+Math.sin(w.time*12+i)*1.1,65)){if(a.wood+a.stone)ftSprite(a.wood?5:4,a.x-14,a.y-5,27);return;}ftEllipse(a.x,a.y+5,12,5,'#143f3c44');ctx.fillStyle=i%3===2?'#7c8fa3':'#b07b51';ctx.fillRect(a.x-8,a.y-19,16,21);point(a.x,a.y-27,9,'#efc59b');ftEllipse(a.x,a.y-33,13,4,'#d6c387');ctx.fillStyle='#423f36';ctx.fillRect(a.x-7,a.y+2,5,6);ctx.fillRect(a.x+2,a.y+2,5,6);if(a.wood+a.stone){ctx.fillStyle=a.wood?'#c69764':'#a8c3c6';ctx.fillRect(a.x-15,a.y-18,10,17);}else if(a.t>.25){ctx.strokeStyle='#e5dac3';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(a.x+8,a.y-12);ctx.lineTo(a.x+20,a.y-28);ctx.stroke();}}});});
 w.camps.forEach(function(c){objects.push({y:c.y,draw:function(){ftPoly([[c.x-35,c.y],[c.x,c.y-60],[c.x+35,c.y]],c.hp>0?'#86504a':'#4e5350');if(c.hp>0){text('敵營',c.x,c.y+20,12,'#ffbe9f');ctx.fillStyle='#472f34';ctx.fillRect(c.x-30,c.y-70,60,5);ctx.fillStyle='#e9a086';ctx.fillRect(c.x-30,c.y-70,60*c.hp/c.maxHp,5);}}});});
 w.drops.forEach(function(d){ftEllipse(d.x,d.y+5,10,4,'#163f3a33');point(d.x,d.y-5+Math.sin(w.time*4)*3,8,'#ecc56b','#fff0af');text(String(d.amount),d.x,d.y-20,11);});
 objects.push({y:w.p.y,draw:function(){ftExplorer(w);}});objects.sort(function(a,b){return a.y-b.y;}).forEach(function(o){o.draw();});
 w.shots.forEach(function(s){point(s.x,s.y,6,'#ffcc8b','#a86051');});w.effects.forEach(ftParticles);
 ctx.setTransform(dpr,0,0,dpr,0,0);var mx=rect.width-98,my=64;ctx.fillStyle='#102e2dcc';ctx.fillRect(mx,my,84,64);w.buildings.forEach(function(b){point(mx+b.x/w.cfg.width*84,my+b.y/w.cfg.height*64,3,b.built?'#b7dca5':'#a5b4a1');});w.enemies.forEach(function(e){if(e.hp>0)point(mx+e.x/w.cfg.width*84,my+e.y/w.cfg.height*64,2,'#e6a08e');});point(mx+w.p.x/w.cfg.width*84,my+w.p.y/w.cfg.height*64,4,'#ffe2a3');
 if(w.bag.wood+w.bag.stone>=frontierCapacity(w)){ctx.textAlign='center';ctx.font='600 12px system-ui';ctx.fillStyle='#ffe4a4';ctx.fillText('背包已滿：回營地或投入建築',rect.width/2,rect.height-92,rect.width-30);}
}

function ftBuilding(b,w){
 var x=b.x,y=b.y,colors={camp:'#d8b778',house:'#a5c8b5',market:'#dcb269',quarry:'#a6bac1',mill:'#79b6aa',forge:'#b78165',depot:'#95b8a0',tower:'#7d9c9e',beacon:'#e4ce8a'};
 var sprite={camp:6,house:6,market:7,quarry:6,mill:8,forge:9,depot:6,tower:10,beacon:11}[b.kind];
 if(sprite!==undefined&&ftSprite(sprite,x,y,b.kind==='tower'||b.kind==='beacon'?145:142)){
  if(b.kind==='quarry')ftSprite(4,x+35,y+5,50);if(b.kind==='depot')ftSprite(5,x+32,y+4,48);
  if(b.hp<b.maxHp){ctx.fillStyle='#563e33';ctx.fillRect(x-30,y-123,60,5);ctx.fillStyle=b.hp>0?'#e4b26b':'#ee806d';ctx.fillRect(x-30,y-123,60*b.hp/b.maxHp,5);if(b.hp===0)text('需修復',x,y-130,12,'#ffc59a');}return;
 }
 ftEllipse(x+3,y+6,40,15,'#143c3944');
 if(b.kind==='bridge')return;
 ctx.fillStyle=colors[b.kind]||'#c6b080';ctx.beginPath();ctx.roundRect(x-26,y-43,52,44,3);ctx.fill();
 ctx.fillStyle='#725139';ctx.fillRect(x-28,y-42,5,46);ctx.fillRect(x+23,y-42,5,46);
 for(var k=0;k<3;k++){ctx.strokeStyle='#71553d33';ctx.beginPath();ctx.moveTo(x-22,y-31+k*11);ctx.lineTo(x+22,y-31+k*11);ctx.stroke();}
 ftPoly([[x-36,y-43],[x,y-74],[x+36,y-43]],b.kind==='forge'?'#a95a44':'#286c69');
 ftPoly([[x-36,y-43],[x,y-74],[x-3,y-43]],'#478c7c');ctx.strokeStyle='#e5d09b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-37,y-43);ctx.lineTo(x,y-75);ctx.lineTo(x+37,y-43);ctx.stroke();
 ctx.fillStyle='#244344';ctx.fillRect(x-7,y-24,14,26);ctx.fillStyle='#ffe3a4';ctx.fillRect(x-19,y-32,8,9);ctx.fillRect(x+11,y-32,8,9);
 if(b.kind==='mill'){ctx.strokeStyle='#eddbac';ctx.lineWidth=5;ctx.save();ctx.translate(x,y-51);ctx.rotate(w.time*.6);for(var i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.strokeRect(0,-3,29,9);}ctx.restore();point(x,y-51,5,'#6b533e');}
 if(b.kind==='market'){ctx.fillStyle='#e9c47d';ctx.fillRect(x-34,y-31,68,8);for(k=0;k<5;k++){ctx.fillStyle=k%2?'#bc6c53':'#f3d89c';ctx.fillRect(x-34+k*14,y-42,14,14);}point(x+20,y-7,6,'#d6a34e');}
 if(b.kind==='tower'||b.kind==='beacon'){ctx.fillStyle='#768c82';ctx.fillRect(x-18,y-65,36,40);ctx.fillStyle='#b3bf9c';ctx.fillRect(x-23,y-67,46,10);if(b.kind==='beacon'){point(x,y-83,13,'#ffd886');point(x,y-86+Math.sin(w.time*5)*3,7,'#fff5c0');}else{ctx.strokeStyle='#e6c998';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-18,y-76);ctx.lineTo(x+18,y-76);ctx.moveTo(x,y-88);ctx.lineTo(x,y-64);ctx.stroke();}}
 if(b.kind==='quarry'){ftPoly([[x+24,y],[x+30,y-24],[x+48,y-15],[x+45,y]],'#a6bfc0');}
 if(b.hp<b.maxHp){ctx.fillStyle='#563e33';ctx.fillRect(x-28,y-88,56,5);ctx.fillStyle=b.hp>0?'#e4b26b':'#ee806d';ctx.fillRect(x-28,y-88,56*b.hp/b.maxHp,5);if(b.hp===0)text('需修復',x,y-95,12,'#ffc59a');}
}
