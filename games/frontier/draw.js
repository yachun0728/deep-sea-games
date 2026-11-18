function point(x,y,r,fill,stroke){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function text(label,x,y,size,color){ctx.font='600 '+(size||13)+'px system-ui';ctx.textAlign='center';ctx.fillStyle=color||'#f6efd3';ctx.fillText(label,x,y,155);}
function paint(){
 var w=world||preview,rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
 var dpr=Math.min(2,window.devicePixelRatio||1),cw=Math.round(rect.width*dpr),ch=Math.round(rect.height*dpr);if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,rect.width,rect.height);
 var scale=Math.min(rect.width/(rect.width<600?540:850),rect.height/650),vw=rect.width/scale,vh=rect.height/scale;
 var cx=Math.max(vw/2,Math.min(1200-vw/2,w.p.x)),cy=Math.max(vh/2,Math.min(900-vh/2,w.p.y));if(vw>1200)cx=600;if(vh>900)cy=450;
 ctx.scale(scale,scale);ctx.translate(vw/2-cx,vh/2-cy);
 var palette=[['#244e4b','#8cae70','#426e4e'],['#264c60','#a3aa78','#6d8655'],['#273e42','#718658','#3b5b49'],['#344e65','#b1c4c2','#668b88'],['#382f3c','#8f7965','#534a50']][w.cfg.chapter];
 ctx.fillStyle=palette[0];ctx.fillRect(cx-vw/2,cy-vh/2,vw,vh);
 ctx.fillStyle='#c7b991';ctx.beginPath();ctx.roundRect(26,31,1148,844,75);ctx.fill();ctx.fillStyle=palette[1];ctx.beginPath();ctx.roundRect(42,47,1116,812,60);ctx.fill();ctx.fillStyle=palette[0];ctx.fillRect(552,40,126,820);
 for(var t=0;t<24;t++){ctx.strokeStyle='#ffffff12';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(567,65+t*34);ctx.lineTo(656,72+t*34);ctx.stroke();}
 if(frontierBuilt(w,'bridge')){ctx.fillStyle='#6b523b';ctx.fillRect(537,385,156,130);for(t=0;t<11;t++){ctx.fillStyle=t%2?'#b99762':'#cbaa75';ctx.fillRect(539+t*14,390,11,120);}}
 for(t=0;t<65;t++){var gx=75+(t*137)%1050,gy=90+(t*233)%720;if(gx>530&&gx<700)continue;ctx.fillStyle='#ffffff15';ctx.fillRect(gx,gy,3,6);}
 if(w.cfg.chapter>=2&&w.time%9>6){var hx=800+Math.floor(w.time/9)%3*120,hy=240+Math.floor(w.time/9)%2*360;point(hx,hy,70,w.time%9>7.2?'#ee573f99':'#edb45255','#ffd183');text('危險區',hx,hy-77,12);}
 w.enemies.forEach(function(e){if(e.hp<=0||e.state==='walk')return;
  if(e.type==='charger'||e.type==='ranged'){ctx.strokeStyle=e.state==='warn'?'#f8b16d':'#ff5748';ctx.lineWidth=e.type==='charger'?34:3;ctx.globalAlpha=.5;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.tx,e.ty);ctx.stroke();ctx.globalAlpha=1;}
  else point(e.tx,e.ty,e.type==='boss'?90:48,e.state==='warn'?'#e84b493b':'#fa694e99','#ffb398');
 });
 var objects=[];
 w.nodes.forEach(function(n){objects.push({y:n.y,draw:function(){
  if(!n.left){point(n.x,n.y,9,'#785c42');return;}
  ctx.fillStyle='#163d3033';ctx.beginPath();ctx.ellipse(n.x+7,n.y+6,22,10,0,0,7);ctx.fill();
  if(n.kind==='wood'){ctx.fillStyle='#806043';ctx.fillRect(n.x-5,n.y-32,10,36);point(n.x,n.y-42,25,palette[2]);point(n.x-12,n.y-34,19,palette[2]);point(n.x+9,n.y-52,16,w.cfg.chapter===3?'#d8e1cd':'#8db079');}
  else{ctx.fillStyle='#667f7b';ctx.beginPath();ctx.moveTo(n.x-22,n.y);ctx.lineTo(n.x-16,n.y-21);ctx.lineTo(n.x+5,n.y-32);ctx.lineTo(n.x+23,n.y-9);ctx.lineTo(n.x+18,n.y+5);ctx.closePath();ctx.fill();ctx.fillStyle='#bbc8b0';ctx.fillRect(n.x-5,n.y-22,10,5);}
 }});});
 w.buildings.forEach(function(b){objects.push({y:b.y+12,draw:function(){
  if(b.kind==='bridge'&&b.built)return;
  point(b.x,b.y,52,b.built?'#21493633':'#2a444466',b.built?'#c5d99b':'#e4d3a3');
  if(b.built){ctx.fillStyle=b.kind==='beacon'?'#f3dfaa':'#d4bd88';ctx.fillRect(b.x-22,b.y-36,44,36);ctx.fillStyle=b.kind==='camp'?'#c28055':b.kind==='beacon'?'#f1c567':'#4a6c61';ctx.beginPath();ctx.moveTo(b.x-30,b.y-35);ctx.lineTo(b.x,b.y-65);ctx.lineTo(b.x+30,b.y-35);ctx.closePath();ctx.fill();ctx.fillStyle='#33554b';ctx.fillRect(b.x-7,b.y-23,14,23);
   if(b.kind==='mill'){ctx.strokeStyle='#ecd6a1';ctx.lineWidth=5;ctx.save();ctx.translate(b.x,b.y-47);ctx.rotate(w.time*.6);ctx.beginPath();ctx.moveTo(-28,0);ctx.lineTo(28,0);ctx.moveTo(0,-28);ctx.lineTo(0,28);ctx.stroke();ctx.restore();}
   if(b.kind==='tower'){ctx.fillStyle='#4b6251';ctx.fillRect(b.x-19,b.y-60,38,16);}
  }else{text('🪵 '+b.wood+' ◆ '+b.stone,b.x,b.y+3,12);if(b.kind==='beacon'&&!frontierGoal(w))text('先完成任務',b.x,b.y+22,10);}
  text(labels[b.kind],b.x,b.y+(b.built?24:-63),12);
 }});});
 if(w.cfg.mission==='rescue')w.cages.forEach(function(c){objects.push({y:c.y,draw:function(){point(c.x,c.y,20,c.open?'#b9d59b':'#6e7460','#f1d89d');text(c.open?'✓':'!',c.x,c.y+5,20);if(!c.open){ctx.strokeStyle='#dfd3a7';for(var j=-12;j<=12;j+=8){ctx.beginPath();ctx.moveTo(c.x+j,c.y-20);ctx.lineTo(c.x+j,c.y+20);ctx.stroke();}}}});});
 w.enemies.forEach(function(e){if(e.hp<=0)return;objects.push({y:e.y,draw:function(){
  point(e.x+4,e.y+6,e.radius,'#173a3433');point(e.x,e.y-9,e.radius,e.type==='boss'?'#995a62':e.type==='ranged'?'#9279a1':e.type==='charger'?'#b07a55':'#687a65','#d6ba91');point(e.x-6,e.y-13,3,'#fff4d6');point(e.x+6,e.y-13,3,'#fff4d6');ctx.fillStyle='#313d34';ctx.fillRect(e.x-4,e.y-9,8,3);ctx.fillStyle='#473e38';ctx.fillRect(e.x-23,e.y-e.radius-23,46,5);ctx.fillStyle='#ef9e80';ctx.fillRect(e.x-23,e.y-e.radius-23,46*Math.max(0,e.hp/e.max),5);if(e.state==='warn')text('!',e.x,e.y-e.radius-30,23,'#ffe2a0');
 }});});
 objects.push({y:w.p.y,draw:function(){var p=w.p;point(p.x+3,p.y+6,17,'#244e3d55');ctx.save();if(p.inv>0)ctx.globalAlpha=.65;ctx.fillStyle='#345756';ctx.fillRect(p.x-12,p.y-24,24,27);point(p.x,p.y-31,12,'#edc69d');point(p.x,p.y-37,14,'#e7d497');ctx.fillStyle='#284743';ctx.fillRect(p.x-15,p.y-38,30,5);ctx.fillStyle='#e0c08a';ctx.fillRect(p.x-7,p.y+2,5,9);ctx.fillRect(p.x+3,p.y+2,5,9);
  for(var j=0;j<Math.min(8,Math.ceil((w.bag.wood+w.bag.stone)/4));j++){ctx.fillStyle=j%2?'#b18554':'#cba06e';ctx.fillRect(p.x-21,p.y-12-j*7,13,5);}ctx.strokeStyle='#e9dec0';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(p.x+13,p.y-16);ctx.lineTo(p.x+29,p.y-33);ctx.stroke();ctx.restore();
 }});objects.sort(function(a,b){return a.y-b.y;}).forEach(function(o){o.draw();});
 w.shots.forEach(function(s){point(s.x,s.y,6,'#ffcc8b','#a86051');});w.effects.forEach(function(e){point(e.x,e.y,12+(1-e.t)*15,'#ffffff00',e.kind==='hit'?'#ffedbc':'#f7e6ac88');});
 ctx.setTransform(dpr,0,0,dpr,0,0);var mx=rect.width-130,my=15;ctx.fillStyle='#102e2dcc';ctx.fillRect(mx,my,115,87);w.buildings.forEach(function(b){point(mx+b.x/1200*115,my+b.y/900*87,3,b.built?'#b7dca5':'#a5b4a1');});w.enemies.forEach(function(e){if(e.hp>0)point(mx+e.x/1200*115,my+e.y/900*87,2,'#e6a08e');});point(mx+w.p.x/1200*115,my+w.p.y/900*87,4,'#ffe2a3');
 ctx.textAlign='left';ctx.font='12px system-ui';ctx.fillStyle='#fff1cb';ctx.fillText(w.threat>0?'夜幕：敵人加速':'營地：存放材料與升級',14,24,Math.max(100,rect.width-155));if(w.bag.wood+w.bag.stone>=24+w.tech.pack*9)ctx.fillText('背包已滿：回營地或投入建築',14,44,rect.width-30);
}
