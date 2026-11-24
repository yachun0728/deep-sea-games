/* Vice Paw props — THREE r128 + shared Toon. Metres, +Z front, Y up.
   No downloaded assets. Cached geometry/materials; canvas decals are procedural. */
(function () {
'use strict';
var T=THREE, P={}, geo={}, templates={}, decals={};
var C={ink:0x29283c,glass:0x173e59,chrome:0xd0e4e4,cream:0xffe3b2,pink:0xff5297,green:0x70ce26,stone:0xc9bca8};
function geometry(k,make){return geo[k]||(geo[k]=make());}
function add(g,shape,c,x,y,z,rx,ry,rz,bright,outline){
 var key=shape.uuid+':'+c+':'+!!bright+':'+(outline!==false), m;
 if(!templates[key]) templates[key]=Toon.mesh(shape,c,{bright:!!bright,outline:outline!==false,t:.018});
 m=templates[key].clone(); Toon.put(g,m,x,y,z,rx,ry,rz);return m;
}
function box(g,c,x,y,z,w,h,d,bright,outline){return add(g,geometry('b'+[w,h,d],function(){return new T.BoxGeometry(w,h,d);}),c,x,y,z,0,0,0,bright,outline);}
function cyl(g,c,x,y,z,r,h,n,rx,rz){n=n||8;return add(g,geometry('c'+[r,h,n],function(){return new T.CylinderGeometry(r,r,h,n);}),c,x,y,z,rx||0,0,rz||0);}
function ball(g,c,x,y,z,rx,ry,rz){return add(g,geometry('s'+[rx,ry,rz],function(){var a=new T.SphereGeometry(1,8,4);a.scale(rx,ry,rz);return a;}),c,x,y,z);}
function rod(g,c,a,b,r,n){var d=new T.Vector3().subVectors(b,a),m=cyl(g,c,(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2,r,d.length(),n||6);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
function line(g,c,a,b,r,n){return rod(g,c,new T.Vector3(a[0],a[1],a[2]),new T.Vector3(b[0],b[1],b[2]),r,n);}
function poly(k,v,ix){return geometry(k,function(){var a=new T.BufferGeometry(),indices=ix.slice(),volume=0;for(var j=0;j<indices.length;j+=3){var p=indices[j]*3,q=indices[j+1]*3,r=indices[j+2]*3;volume+=v[p]*(v[q+1]*v[r+2]-v[q+2]*v[r+1])+v[p+1]*(v[q+2]*v[r]-v[q]*v[r+2])+v[p+2]*(v[q]*v[r+1]-v[q+1]*v[r]);}if(volume<0)for(j=0;j<indices.length;j+=3){var swap=indices[j+1];indices[j+1]=indices[j+2];indices[j+2]=swap;}a.setAttribute('position',new T.Float32BufferAttribute(v,3));a.setIndex(indices);a.computeVertexNormals();a.vicePawSolid=true;return a;});}
function label(g,kind,x,y,z,w,h,angle){
 var key=kind,mat=decals[key];
 if(!mat){var tex=Toon.canvasTexture(256,128,function(c,W,H){
  c.clearRect(0,0,W,H);c.textAlign='center';c.textBaseline='middle';c.font='bold 90px Arial';c.fillStyle='#fff6d5';
  if(kind==='brick'){c.fillStyle='#d95c3b';c.fillRect(0,0,W,H);c.strokeStyle='#8b443b';c.lineWidth=3;for(var row=0;row<7;row++){var yy=row*H/7;c.beginPath();c.moveTo(0,yy);c.lineTo(W,yy);c.stroke();for(var col=-1;col<5;col++){var xx=(col+(row%2)*.5)*W/4;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx,yy+H/7);c.stroke();}}}
  else if(kind==='paw'){c.fillStyle='#ff469c';c.beginPath();c.ellipse(128,82,39,29,0,0,7);c.fill();[[73,49],[107,27],[149,27],[184,49]].forEach(function(p){c.beginPath();c.ellipse(p[0],p[1],15,20,0,0,7);c.fill();});}
  else if(kind==='cross'){c.fillStyle='#f2384d';c.fillRect(103,10,50,108);c.fillRect(60,40,136,48);}
  else if(kind==='star'){c.fillStyle='#ffce32';c.beginPath();for(var i=0;i<10;i++){var a=-Math.PI/2+i*Math.PI/5,r=i%2?27:57;c.lineTo(128+Math.cos(a)*r,64+Math.sin(a)*r);}c.closePath();c.fill();}
  else if(kind==='arrow'){c.fillRect(30,48,130,32);c.beginPath();c.moveTo(145,14);c.lineTo(224,64);c.lineTo(145,114);c.fill();}
  else if(kind==='noentry'){c.fillStyle='#f33042';c.beginPath();c.arc(128,64,58,0,7);c.fill();c.fillStyle='white';c.fillRect(80,52,96,24);}
  else if(kind==='graffiti'){c.fillStyle='#ffce23';c.font='italic bold 61px Arial';c.fillText('WOOF!',128,67);}
  else {c.font='bold '+(kind.length>4?44:80)+'px Arial';c.fillText(kind,128,67,244);}
 });mat=decals[key]=new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:T.FrontSide});}
 var m=new T.Mesh(geometry('plane'+[w,h],function(){return new T.PlaneGeometry(w,h);}),mat);m.userData.decal=true;Toon.put(g,m,x,y,z,0,angle||0,0);return m;
}
function plate(g,z,angle){label(g,'VP 24',0,.53,z,.48,.16,angle);}
function wheel(g,x,z,r){var m=cyl(g,C.ink,x,r,z,r,.22,12,0,Math.PI/2);m.userData.wheel=true;cyl(g,C.chrome,x+(x<0?-.125:.125),r,z,r*.52,.035,8,0,Math.PI/2);return m;}
function car(type){
 var g=new T.Group(),open=type==='convertible',van=type==='ambulance',truck=type==='truck',large=van||truck;
 var color={convertible:C.pink,taxi:0xffcb27,police:0xf7f3e7,sedan:0x25b8ae,ambulance:0xfff7e8,truck:0x258fe6}[type];
 var len=large?5.3:4.3,w=large?2.02:1.85,r=large?.42:.34,front=len/2;
 box(g,C.ink,0,.45,0,w-.12,.3,len-.18);box(g,color,0,.78,0,w,.6,len-.14);
 [-1,1].forEach(function(s){[-1,1].forEach(function(f){wheel(g,s*(w/2-.015),f*(large?1.65:1.36),r);});box(g,C.chrome,0,.48,s*(front-.08),w+.08,.15,.12);});
 box(g,color,0,1.08,front-.66,w,.18,1.15);
 if(open){
  box(g,C.ink,0,1.085,-.43,1.5,.06,1.75);
  [-1,1].forEach(function(s){box(g,color,s*.84,1.19,-.48,.16,.25,1.9);box(g,C.cream,s*.4,1.19,-.61,.62,.16,.65);box(g,C.cream,s*.4,1.43,-.94,.62,.47,.15);});
  box(g,color,0,1.13,-1.66,w,.2,.75);box(g,C.glass,0,1.48,.47,1.62,.48,.07);
  [-.84,.84].forEach(function(x){box(g,C.chrome,x,1.48,.47,.06,.54,.09);});box(g,C.chrome,0,1.75,.47,1.77,.06,.1);
  box(g,C.ink,0,1.2,.28,1.5,.17,.26);cyl(g,C.ink,-.4,1.38,.12,.16,.045,8,Math.PI/2);
 }else if(large){
  box(g,color,0,1.45,1.14,w,1.05,1.7);box(g,C.glass,0,1.68,2.006,w-.25,.47,.035);
  [-1,1].forEach(function(s){box(g,C.glass,s*(w/2+.012),1.67,1.24,.025,.47,.98);box(g,C.chrome,s*(w/2+.08),1.42,1.74,.14,.23,.19);});
  box(g,truck?0x258fe6:color,0,1.68,-.84,w+.08,2.05,3.35);
  box(g,C.chrome,0,1.6,-2.53,w-.18,1.7,.035);box(g,C.ink,0,1.6,-2.555,.035,1.65,.025);
  [-.47,.47].forEach(function(x){box(g,van?C.glass:0x9ed6ee,x,2.05,-2.562,.64,.43,.025);box(g,C.chrome,x,1.34,-2.586,.11,.07,.045);});
  if(van){[-1,1].forEach(function(s){label(g,'cross',s*(w/2+.054),1.9,-.75,1.15,.9,s*Math.PI/2);label(g,'paw',s*(w/2+.055),1.09,-1.65,.55,.43,s*Math.PI/2);});label(g,'cross',0,2.72,-.7,.9,.75,0).rotation.x=-Math.PI/2;}
 }else{
  box(g,type==='police'?C.ink:color,0,1.4,-.27,1.61,.8,2.3);
  box(g,C.glass,0,1.48,.903,1.4,.51,.025);box(g,C.glass,0,1.48,-1.433,1.4,.45,.025);
  [-1,1].forEach(function(s){[-.81,.27].forEach(function(z){box(g,C.glass,s*.819,1.48,z,.025,.47,.91);});box(g,color,s*.84,1.1,-.25,.06,.1,2.1);box(g,C.chrome,s*.945,1.35,.75,.19,.12,.22);box(g,C.chrome,s*.943,1.06,-.27,.035,.05,.27);});
  box(g,color,0,1.84,-.27,1.7,.12,2.4);
 }
 [-1,1].forEach(function(s){box(g,0xfff0ac,s*(w*.34),.9,front-.057,.38,.22,.035,true).userData.facing='front';box(g,0xff304c,s*(w*.34),.83,-front+.057,.38,.2,.035,true).userData.facing='rear';});
 box(g,C.ink,0,.82,front-.048,.6,.22,.025);plate(g,front,0);plate(g,-front,Math.PI);
 if(type==='taxi'){
  box(g,C.ink,0,1.99,-.27,.9,.12,.42);box(g,0xffdc42,0,2.13,-.27,.85,.23,.36,true);label(g,'TAXI',0,2.13,-.079,.75,.2);label(g,'TAXI',0,2.13,-.461,.75,.2,Math.PI);
  [-1,1].forEach(function(s){for(var i=0;i<10;i++)box(g,i%2?C.ink:0xfff5cd,s*(w/2+.012),.89,-1.13+i*.25,.025,.14,.25,false,false);});
 }
 if(type==='police'||van){var y=van?2.78:1.99;box(g,C.ink,0,y,-.2,1.32,.1,.36);[-1,1].forEach(function(s){box(g,s<0?0xff3249:0x2485ff,s*.42,y+.13,-.2,.55,.19,.32,true);});if(!van)[-1,1].forEach(function(s){label(g,'star',s*(w/2+.052),.87,-.28,.63,.49,s*Math.PI/2);});}
 return g;
}
['Convertible','Taxi','Police','Sedan'].forEach(function(n){P['car'+n]=function(){return car(n.toLowerCase());};});P.vanAmbulance=function(){return car('ambulance');};P.truckBlue=function(){return car('truck');};
function bike(scooter){var g=new T.Group(),c=scooter?C.cream:0xf63745,r=.31;
 [-.68,.72].forEach(function(z){cyl(g,C.ink,0,r,z,r,.19,12,0,Math.PI/2).userData.wheel=true;[-1,1].forEach(function(s){cyl(g,C.chrome,s*.11,r,z,.16,.03,8,0,Math.PI/2);});});
 box(g,c,0,.56,-.22,.4,.38,.84);box(g,C.ink,0,.82,-.3,.43,.14,.79);box(g,C.chrome,0,.3,0,.24,.15,.9);
 [-.17,.17].forEach(function(x){line(g,C.chrome,[x,.32,.72],[x,1.02,.46],.045);line(g,C.ink,[x,.32,-.68],[x,.67,-.32],.04);});
 box(g,c,0,.77,.48,.44,scooter?.65:.3,.2);box(g,C.glass,0,1.3,.5,.32,.35,.035);label(g,'VP 24',0,.51,-.952,.23,.11,Math.PI);box(g,0xffeca5,0,1.03,.601,.25,.18,.04,true).userData.facing='front';box(g,0xff2444,0,.7,-.851,.25,.13,.035,true).userData.facing='rear';
 line(g,C.chrome,[-.43,1.12,.43],[.43,1.12,.43],.045);[-1,1].forEach(function(s){box(g,C.ink,s*.39,1.12,.43,.18,.08,.1);line(g,C.chrome,[s*.3,1.12,.43],[s*.4,1.36,.44],.025);box(g,C.glass,s*.4,1.37,.44,.16,.11,.07);});box(g,C.chrome,0,.5,-.89,.3,.08,.1);box(g,C.chrome,0,.41,1.005,.3,.08,.06);return g;}
P.motorcycleRed=function(){return bike(false);};P.scooterCream=function(){return bike(true);};
function palm(h){var g=new T.Group(),tr=h-.5-.08*h;
 cyl(g,0xc28a3e,0,.08,0,.24,.16,8);
 for(var i=0;i<7;i++){var y=i*tr/7+(i===0?.035:0);line(g,i%2?0xc28a3e:0xe0a44d,[.3*Math.sin(i/7),y,0],[.3*Math.sin((i+1)/7),(i+1)*tr/7,0],.24-i*.016,8);}
 var leaf=poly('frond',[0,0,0,.85,.6,0,1.6,.18,.37,2.5,-.65,0,1.6,.18,-.37,1.35,.05,0],[0,1,2,0,2,5,2,3,5,3,4,5,4,0,5,0,4,1,1,4,3,1,3,2]);
 for(i=0;i<8;i++){var m=add(g,leaf,i%2?0x8de332:0x43b628,.3*Math.sin(1),tr+.35+(i%2)*.15,0,0,i*Math.PI/4,0);m.scale.set(h/7.5,h/7.5,h/7.5);}
 for(i=0;i<3;i++)ball(g,0x8b5328,.25+Math.cos(i*2.1)*.23,tr+.12,Math.sin(i*2.1)*.23,.18,.22,.18);return g;
}
P.palmTall=function(){return palm(7.5);};P.palmMedium=function(){return palm(6);};P.palmShort=function(){return palm(4.5);};
P.treeRound=function(){var g=new T.Group();cyl(g,0xbd853a,0,1.8,0,.3,3.6,8);line(g,0xbd853a,[0,2.3,0],[.85,3.7,0],.16);ball(g,C.green,0,4.25,0,1.8,1.75,1.65);ball(g,0x91dc33,-.75,4.5,.2,1.05,1.2,1.2);ball(g,0x54b925,.8,4.2,-.2,1,1.2,1.15);return g;};
function flowers(g,y,r){for(var i=0;i<6;i++){var a=i*Math.PI/3,x=Math.cos(a)*r,z=Math.sin(a)*r;ball(g,0xff73b8,x,y+(i%2)*.13,z,.18,.11,.18);cyl(g,0xffdc4c,x,y+.12+(i%2)*.13,z,.07,.04,6);}}
P.shrubFlowers=function(){var g=new T.Group();ball(g,C.green,0,.65,0,.72,.65,.72);flowers(g,1.18,.42);return g;};
function hedge(w){var g=new T.Group();box(g,C.stone,0,.24,0,w,.48,1);box(g,C.cream,0,.48,0,w,.12,1);box(g,C.green,0,.87,0,w-.12,.66,.86);return g;}
P.hedgeLong=function(){return hedge(3);};P.hedgeShort=function(){return hedge(1.5);};
P.planterRound=function(){var g=new T.Group();cyl(g,C.stone,0,.3,0,.73,.6,10);cyl(g,C.cream,0,.61,0,.8,.14,10);ball(g,C.green,0,1.2,0,.77,.63,.77);flowers(g,1.78,.45);return g;};
function pole(g,h,c){cyl(g,C.ink,0,.09,0,.3,.18,8);cyl(g,c||C.chrome,0,h/2,0,.075,h,8);}
function sign(kind,color,oct){var g=new T.Group();pole(g,3.7);if(oct)cyl(g,color,0,3.3,0,.68,.12,8,Math.PI/2);else box(g,color,0,3.35,0,kind==='arrow'?1.5:1.1,1.12,.13);label(g,kind,0,3.35,.079,kind==='STOP'?1.05:.95,.76);label(g,kind,0,3.35,-.079,kind==='STOP'?1.05:.95,.76,Math.PI);return g;}
P.stopSign=function(){return sign('STOP',0xe92d37,true);};P.parkingSign=function(){return sign('P',0x167dea);};P.directionSign=function(){return sign('arrow',0x167dea);};
P.banner=function(){var g=new T.Group();pole(g,5);box(g,0xff479b,.48,3.78,0,.88,1.9,.07);line(g,C.chrome,[0,4.8,0],[1,4.8,0],.045);label(g,'paw',.48,3.8,.05,.74,.86);label(g,'paw',.48,3.8,-.05,.74,.86,Math.PI);return g;};
P.lampDouble=function(){var g=new T.Group();pole(g,4.65,C.ink);[-1,1].forEach(function(s){line(g,C.ink,[0,4.45,0],[s*.85,4.8,0],.07);cyl(g,C.ink,s*.85,4.72,0,.22,.1,6);var m=cyl(g,0xffdc70,s*.85,5.03,0,.2,.53,6);m.material=Toon.bright(0xffdc70);cyl(g,C.ink,s*.85,5.34,0,.27,.1,6);cyl(g,C.ink,s*.85,5.44,0,.07,.15,6);});return g;};
P.trafficLight=function(){var g=new T.Group();pole(g,4.5,C.ink);box(g,C.ink,0,3.55,0,.52,1.5,.42);[0xff3748,0xffca31,0x42dc77].forEach(function(c,i){var y=4.04-i*.48;var m=cyl(g,c,0,y,.244,.16,.07,10,Math.PI/2);m.material=Toon.bright(c);box(g,C.ink,0,y+.19,.29,.43,.06,.28);});box(g,C.chrome,0,3.55,-.23,.18,.8,.05);return g;};
P.bench=function(){var g=new T.Group();[-.85,.85].forEach(function(x){box(g,C.ink,x,.36,0,.14,.72,.67);box(g,C.ink,x,.95,-.31,.1,1.2,.1);});for(var i=0;i<3;i++){box(g,0xffc43c,0,.76,-.3+i*.26,2.3,.13,.21);box(g,0xffc43c,0,1.05+i*.2,-.36,2.3,.15,.12);}return g;};
P.mailboxBlue=function(){var g=new T.Group();[-.28,.28].forEach(function(x){box(g,C.ink,x,.16,0,.12,.32,.44);});box(g,0x1988e4,0,.78,0,.8,1.05,.67);box(g,0x1664bc,0,1.36,0,.85,.15,.72);box(g,C.ink,0,1.15,.351,.57,.12,.04);box(g,C.chrome,0,.62,.351,.13,.06,.04);label(g,'MAIL',0,.9,.365,.56,.19);return g;};
function vending(c){var g=new T.Group();box(g,C.ink,0,.08,0,1,.16,.78);box(g,c,0,1.03,0,1.04,1.9,.8);box(g,C.glass,-.17,1.22,.418,.58,1.18,.035);for(var i=0;i<3;i++){box(g,C.chrome,-.17,.81+i*.37,.45,.55,.035,.06);for(var j=0;j<2;j++)box(g,j?0xffce39:0xff79a5,-.32+j*.28,.95+i*.37,.45,.14,.22,.07,false,false);}box(g,C.ink,.33,1.3,.43,.16,.44,.04);box(g,0x74e3f1,.33,1.55,.452,.12,.14,.02,true);box(g,C.ink,0,.43,.43,.73,.19,.04);return g;}
P.vendingRed=function(){return vending(0xee3748);};P.vendingGreen=function(){return vending(0x43b95c);};
P.trashCan=function(){var g=new T.Group();cyl(g,0x9ba4ae,0,.52,0,.39,1.04,10);cyl(g,C.chrome,0,1.06,0,.44,.12,10);for(var i=0;i<8;i++){var a=i*Math.PI/4;box(g,C.chrome,Math.cos(a)*.375,.53,Math.sin(a)*.375,.035,.78,.035,false,false);}return g;};
P.hydrant=function(){var g=new T.Group();cyl(g,0xed3343,0,.08,0,.35,.16,8);cyl(g,0xed3343,0,.55,0,.22,.9,8);ball(g,0xff4c4b,0,1.03,0,.26,.2,.26);[-1,1].forEach(function(s){cyl(g,0xc9233b,s*.28,.68,0,.15,.26,8,0,Math.PI/2);});cyl(g,C.chrome,0,1.27,0,.07,.11,6);return g;};
P.coneOrange=function(){var g=new T.Group();box(g,0xff8b23,0,.065,0,.65,.13,.65);add(g,geometry('cone',function(){return new T.CylinderGeometry(.045,.27,.85,12);}),0xff841b,0,.555,0);add(g,geometry('conestripe',function(){return new T.CylinderGeometry(.12,.165,.16,12);}),0xfff3d3,0,.66,0,0,0,0,false,false);return g;};
function barrel(c){var g=new T.Group();cyl(g,c,0,.56,0,.44,1.12,10);[.14,.91].forEach(function(y){cyl(g,C.ink,0,y,0,.455,.075,10);});cyl(g,C.chrome,.2,1.135,0,.065,.03,8);return g;}
P.barrelBlue=function(){return barrel(0x258ce4);};P.barrelGray=function(){return barrel(0x969eae);};
P.acUnit=function(){var g=new T.Group();box(g,0xd6d5ce,0,.48,0,1.2,.88,.6);[-.43,.43].forEach(function(x){box(g,C.ink,x,.04,0,.15,.08,.48);});cyl(g,C.ink,-.2,.5,.317,.32,.035,12,Math.PI/2);for(var i=0;i<4;i++){var a=i*Math.PI/2;var m=box(g,C.chrome,-.2+Math.cos(a)*.13,.5+Math.sin(a)*.13,.344,.24,.07,.025,false,false);m.rotation.z=a+.5;}for(i=0;i<5;i++)box(g,C.ink,.39,.22+i*.13,.316,.18,.035,.025,false,false);return g;};
function hazard(g,y,w,z,colors){box(g,colors[0],0,y,z,w,.36,.18);for(var i=0;i<5;i++){var x=-w/2+.23+i*(w-.46)/4;var m=box(g,colors[1],x,y,z+.103,.17,.31,.025,false,false);m.rotation.z=-.38;var n=box(g,colors[1],x,y,z-.103,.17,.31,.025,false,false);n.rotation.z=.38;}}
P.barrierStriped=function(){var g=new T.Group();[-1,1].forEach(function(x){box(g,C.ink,x,.38,0,.14,.76,.16);box(g,C.ink,x,.08,0,.6,.16,.7);});hazard(g,.82,2.65,0,[0xfff0d8,0xf13c49]);return g;};
P.kiosk=function(){var g=new T.Group();box(g,0xffc873,0,1.16,0,2.8,2.32,1.75);box(g,C.glass,0,1.58,.89,2.25,.85,.035);box(g,C.cream,0,1.1,1.03,3,.16,.46);box(g,0x337f95,0,1.25,-.892,.75,1.9,.035);box(g,C.chrome,.25,1.25,-.922,.08,.08,.04);[-1,1].forEach(function(s){box(g,C.glass,s*1.417,1.65,0,.035,.8,.95);line(g,C.ink,[s*1.5,0,1.32],[s*1.5,3.35,1.32],.055);});
 box(g,0xffde99,0,3.35,0,3.2,.3,2);for(var i=0;i<8;i++){var m=box(g,i%2?0xfff1d8:0xf34062,-1.4+i*.4,3.17,.87,.4,.12,1.58);m.rotation.x=.22;box(g,i%2?0xfff1d8:0xf34062,-1.4+i*.4,2.98,1.66,.4,.28,.08);}box(g,0xf14467,0,3.73,0,2,.5,.22);label(g,'DOGGO',0,3.73,.13,1.82,.36);label(g,'DOGGO',0,3.73,-.13,1.82,.36,Math.PI);return g;};
function umbrella(c){var g=new T.Group();cyl(g,C.chrome,0,1.66,0,.055,3.32,8);cyl(g,C.ink,0,.06,0,.38,.12,8);cyl(g,0xffe2ae,0,1.02,0,.81,.13,12);
 for(var i=0;i<8;i++){var a=i*Math.PI/4,b=(i+1)*Math.PI/4;var v=[0,3.5,0,Math.cos(a)*1.48,2.91,Math.sin(a)*1.48,Math.cos(b)*1.48,2.91,Math.sin(b)*1.48,0,3.46,0,Math.cos(a)*1.48,2.87,Math.sin(a)*1.48,Math.cos(b)*1.48,2.87,Math.sin(b)*1.48];add(g,poly('umb'+i,v,[0,2,1,3,4,5,0,1,4,0,4,3,1,2,5,1,5,4,2,0,3,2,3,5]),i%2?0xfff4d6:c,0,0,0);}
 [-1,1].forEach(function(s){var chair=new T.Group();g.add(chair);chair.position.x=s*1.22;chair.rotation.y=-s*Math.PI/2;box(chair,c,0,.62,0,.62,.12,.62);box(chair,c,0,1,-.29,.62,.65,.09);[-.22,.22].forEach(function(x){[-.22,.22].forEach(function(z){box(chair,C.ink,x,.3,z,.055,.6,.055);});});});return g;}
P.umbrellaTableRed=function(){return umbrella(0xf4425c);};P.umbrellaTableYellow=function(){return umbrella(0xffcb32);};
function posts(g){[-2.28,2.28].forEach(function(x){box(g,C.stone,x,1.7,0,.44,3.4,.8);box(g,C.cream,x,3.5,0,.44,.2,.8);});}
function meshFence(g){
 // One shared low-poly wire lattice: closed rectangular strips, clipped to panel.
 var v=[],ix=[];function strip(x1,y1,x2,y2){var dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy),ox=-dy/l*.014,oy=dx/l*.014,k=v.length/3;[[-1,-.02],[1,-.02],[-1,.02],[1,.02]].forEach(function(p){v.push(x1+ox*p[0],y1+oy*p[0],p[1],x2+ox*p[0],y2+oy*p[0],p[1]);});[0,1,3,0,3,2,4,6,7,4,7,5,0,4,5,0,5,1,2,3,7,2,7,6,0,2,6,0,6,4,1,5,7,1,7,3].forEach(function(i){ix.push(k+i);});}
 [-1,1].forEach(function(s){for(var b=-5;b<6;b+=.68){var pts=[];[-2.04,2.04].forEach(function(x){var y=s*x+b;if(y>=.25&&y<=3.05)pts.push([x,y]);});[.25,3.05].forEach(function(y){var x=(y-b)/s;if(x> -2.04&&x<2.04)pts.push([x,y]);});if(pts.length===2)strip(pts[0][0],pts[0][1],pts[1][0],pts[1][1]);}});
 add(g,poly('lattice',v,ix),0x8c9ba8,0,0,0,0,0,0,false,false);
}
function wall(kind){var g=new T.Group();posts(g);
 if(kind==='paw'||kind==='graffiti'||kind==='brick'){
  box(g,kind==='brick'?0xd95c3b:0xf8dcae,0,1.65,0,4.12,3.3,.6);box(g,kind==='brick'?C.ink:C.cream,0,3.4,0,4.12,.2,.8);
  if(kind==='brick'){[-1,1].forEach(function(s){label(g,'brick',0,1.65,s*.317,4.1,3.28,s<0?Math.PI:0);});}else[-1,1].forEach(function(s){label(g,kind==='paw'?'paw':'graffiti',0,1.9,s*.317,2.55,1.5,s<0?Math.PI:0);});
 }else{
  [.18,3.14].forEach(function(y){box(g,C.ink,0,y,0,4.12,.09,.1);});
  if(kind==='hazard'){[1,2.1].forEach(function(y){hazard(g,y,4.1,0,[0xffcb30,C.ink]);});}
  else {meshFence(g);if(kind==='entry'){box(g,C.ink,0,1.8,.07,1.23,1.23,.12);label(g,'noentry',0,1.8,.145,1.18,1.18);label(g,'noentry',0,1.8,-.02,1.18,1.18,Math.PI);}else {[-2.28,2.28].forEach(function(x){line(g,C.ink,[x,3.3,0],[x,3.55,.28],.035);});[3.35,3.55].forEach(function(y){line(g,0x9eacb7,[-2.28,y,.28],[2.28,y,.28],.018,4);});[-1.1,1.1].forEach(function(x){add(g,poly('barb',[-.08,0,-.035,.08,0,-.035,0,0,.035,0,.07,0],[0,2,1,0,1,3,1,2,3,2,0,3]),C.ink,x,3.53,.28,0,0,0,false,false);});}}
 }
 return g;
}
P.wallPaw=function(){return wall('paw');};P.wallGraffiti=function(){return wall('graffiti');};P.wallBrick=function(){return wall('brick');};P.fenceChain=function(){return wall('chain');};P.gateHazard=function(){return wall('hazard');};P.gateNoEntry=function(){return wall('entry');};
// Clamp only outline vertices at ground contact. Mesh surfaces retain exact dimensions.
function finish(g,name){g.name=name;g.userData.front='+Z';g.updateMatrixWorld(true);var centerBounds=new T.Box3().makeEmpty(),one=new T.Box3();g.traverse(function(m){if(!m.isMesh||m.material===Toon.outlineMat)return;if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();one.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld);centerBounds.union(one);});var cx=(centerBounds.min.x+centerBounds.max.x)/2,cz=(centerBounds.min.z+centerBounds.max.z)/2;g.children.forEach(function(m){m.position.x-=cx;m.position.z-=cz;});g.updateMatrixWorld(true);g.traverse(function(m){if(!m.isMesh||m.material!==Toon.outlineMat)return;var a=m.geometry.attributes.position,clone=null,inv=new T.Matrix4().copy(m.matrixWorld).invert(),p=new T.Vector3();for(var i=0;i<a.count;i++){p.fromBufferAttribute(a,i).applyMatrix4(m.matrixWorld);if(p.y<0){if(!clone)clone=m.geometry.clone();p.y=0;p.applyMatrix4(inv);clone.attributes.position.setXYZ(i,p.x,p.y,p.z);}}if(clone){clone.attributes.position.needsUpdate=true;m.geometry=clone;}});return g;}
var sizes={};Object.keys(P).forEach(function(name){var build=P[name];P[name]=function(){return finish(build(),name);};});
P.size=sizes;
// Measurements use visible solid geometry (outline ink excluded). Decals count as detail.
Object.keys(P).forEach(function(name){if(name==='size')return;var g=P[name](),bounds=new T.Box3(),b=new T.Box3();bounds.makeEmpty();g.traverse(function(m){if(!m.isMesh||m.material===Toon.outlineMat)return;if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();b.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld);bounds.union(b);});var s=new T.Vector3();bounds.getSize(s);sizes[name]={w:+s.x.toFixed(3),d:+s.z.toFixed(3),h:+s.y.toFixed(3)};});
window.CityProps=P;
})();
