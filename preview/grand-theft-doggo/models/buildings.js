/* Vice Paw buildings. THREE r128 + toon.js. Metres; entrance faces +Z. */
(function () {
  'use strict';
  var T = THREE, C = { cream:0xffe6cc, ink:0x30324e, blue:0x168bd8, glass:0xffda62, pink:0xff418d, gold:0xffbd28 }, cache = {}, signs = {};
  function geo(key, make) { return cache[key] || (cache[key] = make()); }
  function add(g, geometry, color, x,y,z, bright) { return Toon.put(g, Toon.mesh(geometry,color,{t:.045,bright:!!bright}),x,y,z); }
  function box(g,c,x,y,z,w,h,d,b) { return add(g,geo('b'+[w,h,d],function(){return new T.BoxGeometry(w,h,d);}),c,x,y,z,b); }
  function cyl(g,c,x,y,z,r,h,n) { n=n||8; return add(g,geo('c'+[r,h,n],function(){return new T.CylinderGeometry(r,r,h,n);}),c,x,y,z); }
  function ball(g,c,x,y,z,r) { return add(g,geo('s'+r,function(){return new T.IcosahedronGeometry(r,0);}),c,x,y,z); }
  function face(g,x,y,z,ry) { var f=new T.Group(); f.position.set(x,y,z); f.rotation.y=ry||0; g.add(f); return f; }
  function text(g,s,x,y,z,w,h,bg,fg) {
    box(g,C.cream,x,y,z,w+.18,h+.18,.18);
    var key=s+bg+fg, mat=signs[key];
    if(!mat) { var tex=Toon.canvasTexture(512,128,function(ctx,W,H){ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);ctx.fillStyle=fg||'#fff';ctx.font='900 88px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,W/2,H/2+5,W-24);}); mat=signs[key]=new T.MeshBasicMaterial({map:tex}); }
    var m=new T.Mesh(geo('p'+[w,h],function(){return new T.PlaneGeometry(w,h);}),mat); Toon.put(g,m,x,y,z+.115);
  }
  function windowAt(g,x,y,z,ry,w,h,simple) {
    var f=face(g,x,y,z,ry); w=w||1.2;h=h||1.5;
    box(f,C.ink,0,0,0,w+.16,h+.16,.12);
    box(f,C.glass,0,0,.095,w,h,.06,true);
    if(!simple)box(f,C.blue,0,0,.16,.07,h,.05);
  }
  function shrub(g,x,z) { box(g,C.cream,x,.36,z,1.05,.6,.9); box(g,0xe4a4a6,x,.67,z,1.13,.14,.98);ball(g,0x81d329,x,1.02,z,.6); }
  function entrance(g,w,d,orange) {
    var z=d/2;
    box(g,C.cream,0,.18,z+.38,3.6,.24,1.2);
    box(g,0xe2b5ba,0,.35,z+.12,3.1,.25,.9);
    box(g,C.ink,0,2,z+.08,2.7,3.2,.16);
    [-.64,.64].forEach(function(x){box(g,orange?0xff9a25:C.blue,x,2,z+.2,1.19,2.96,.12);box(g,C.glass,x,2.35,z+.29,.91,1.98,.06,true);box(g,C.gold,x<0?-.18:.18,1.8,z+.36,.09,.42,.09);});
    shrub(g,-w/2+.9,z+.25);shrub(g,w/2-.9,z+.25);
  }
  function roof(g,w,d,h) {
    box(g,C.cream,0,h-.2,0,w+.3,.35,d+.3);
    box(g,0x847d9c,0,h+.04,0,w-.25,.13,d-.25);
    // Low parapets on all four edges leave a legible rooftop recess.
    [-1,1].forEach(function(s){box(g,C.cream,s*(w/2-.04),h+.25,0,.18,.38,d);box(g,C.cream,0,h+.25,s*(d/2-.04),w,.38,.18);});
    box(g,0xb3a8c8,-w*.23,h+.48,-d*.18,1.6,.75,1.3);
    cyl(g,C.ink,-w*.23,h+.89,-d*.18,.43,.08,8);
    box(g,0xd7cce0,w*.25,h+.26,-d*.26,.8,.3,.8);
    for(var i=0;i<3;i++)box(g,C.ink,w*.25,h+.43,-d*.26+(i-1)*.2,.6,.04,.07);
  }
  function shell(name,c,w,d,h,levels) {
    var g=new T.Group();g.name=name;
    box(g,0xb3a0b9,0,.22,0,w+.4,.32,d+.4);
    box(g,c,0,(h+.45)/2,0,w,h-.45,d);
    box(g,C.cream,0,.75,0,w+.15,.3,d+.15);
    for(var row=0;row<levels;row++) {
      var y=levels===1?4.5:2.8+row*(h-4)/(levels-1);
      [-1,1].forEach(function(s){[-d*.27,d*.27].forEach(function(z){windowAt(g,s*(w/2+.04),y,z,s*Math.PI/2,1.25,1.6,levels===4);});});
      [-w*.3,0,w*.3].forEach(function(x){windowAt(g,x,y,-d/2-.04,Math.PI,1.3,1.6,levels===4);});
    }
    roof(g,w,d,h);entrance(g,w,d);return g;
  }
  function frontWindows(g,w,d,y) { [-1,1].forEach(function(s){windowAt(g,s*w*.33,y,d/2+.04,0,1.7,2);}); }
  function awning(g,w,d,h) {
    for(var i=0;i<10;i++){var x=-w/2+(i+.5)*w/10;var m=box(g,i%2?0xfff0d7:0xff4952,x,h,d/2+.48,w/10-.025,.16,1.1);m.rotation.x=.16;box(g,i%2?0xfff0d7:0xff4952,x,h-.24,d/2+1,w/10-.025,.42,.14);}
  }
  function disc(g,c,x,y,z,r) { var m=cyl(g,c,x,y,z,r,.2,12);m.rotation.x=Math.PI/2;return m; }
  function star(g,x,y,z,r,c) {
    var v=[],ix=[];for(var side=0;side<2;side++){v.push(0,0,side*.2);for(var i=0;i<10;i++){var a=Math.PI/2+i*Math.PI/5,rr=i%2?r*.46:r;v.push(Math.cos(a)*rr,Math.sin(a)*rr,side*.2);}}
    for(var j=0;j<10;j++){var a=1+j,b=1+(j+1)%10;ix.push(0,b,a,11,a+11,b+11,a,b,b+11,a,b+11,a+11);}
    var geom=geo('star'+r,function(){var q=new T.BufferGeometry();q.setAttribute('position',new T.Float32BufferAttribute(v,3));q.setIndex(ix);q.computeVertexNormals();return q;});return add(g,geom,c,x,y,z);
  }
  function shop(kind) {
    var colors={store24:0xffc7ac,cafe:0xff9856,police:0xc3d9f0,hospital:0xe6f0f3,gym:0x8d94b9,cinema:C.pink};
    var g=shell(kind,colors[kind],9.8,5.6,7.7,2),z=2.8;
    frontWindows(g,9.8,5.6,2.6);
    var label={store24:'24h',cafe:'CAFE',police:'POLICE',hospital:'HOSPITAL',gym:'GYM',cinema:'CINEMA'}[kind];
    text(g,label,0,6.25,z+.25,8.2,1.15,kind==='cinema'?'#f03a51':kind==='cafe'?'#ffbc29':'#126cce',kind==='cafe'?'#382b35':'#ffffff');
    if(kind==='store24'||kind==='cafe')awning(g,9.7,5.6,5.25);
    if(kind==='store24') {
      [0x10b58e,0xffce32,0xf04b3d].forEach(function(c,i){box(g,c,0,7.15+i*.19,0,10.05,.18,5.85);});text(g,'24h',0,8.7,2.3,3.1,1.7,'#fff5dc','#f52c32');
    }
    if(kind==='cafe') {
      cyl(g,C.cream,0,8.22,0,1.25,.18,12);cyl(g,0xffedd1,0,8.85,0,.8,1.15,12);cyl(g,0x683c36,0,9.46,0,.67,.08,12);
      var handle=add(g,geo('handle',function(){return new T.TorusGeometry(.45,.13,4,8);}),0xffe6cc,1,8.93,0);handle.rotation.y=Math.PI/2;
      [-3,3].forEach(function(x){cyl(g,0x674e6d,x,.75,3.9,.12,1.3);cyl(g,0xffc352,x,1.45,3.9,.66,.15,10);[-.8,.8].forEach(function(dx){box(g,0x16b8b0,x+dx,.57,3.9,.5,.14,.55);box(g,0x16b8b0,x+dx,.3,3.9,.12,.5,.15);});});
    }
    if(kind==='police') {
      box(g,0x187ae0,0,7.7,0,10.2,.25,5.9);star(g,0,8.65,2.1,1, C.gold);
      cyl(g,0xcfdbe9,3.7,8.8,-1.6,.065,2.1);box(g,0x244cca,4.17,9.3,-1.6,.85,.55,.07);box(g,0xffebcc,3.85,9.3,-1.55,.18,.55,.04);
    }
    if(kind==='hospital') {box(g,0xf43c48,0,8.85,1.8,.65,2.1,.45);box(g,0xf43c48,0,8.85,1.8,1.95,.65,.45);}
    if(kind==='gym') {
      box(g,0xff9b27,0,1.03,2.98,2.4,.5,.16);var bar=cyl(g,0xcceafa,0,8.65,1.5,.15,3.3);bar.rotation.z=Math.PI/2;
      [-1.25,1.25].forEach(function(x){var m=cyl(g,0x208cde,x,8.65,1.5,.67,.46,8);m.rotation.z=Math.PI/2;});
    }
    if(kind==='cinema') {
      box(g,0xffc255,0,5.25,3.22,10.25,.35,1.15);
      for(var i=0;i<12;i++)box(g,0xfff2a0,-4.6+i*.84,5.5,3.84,.18,.18,.09,true);
      disc(g,0xb7c7da,0,8.8,.8,1);for(var j=0;j<5;j++){var a=j*Math.PI*2/5;disc(g,C.ink,Math.cos(a)*.58,8.8+Math.sin(a)*.58,.94,.2);}
    }
    return g;
  }
  function bank() {
    var g=shell('bank',0xf0bfac,10.2,5.5,7.6,2);frontWindows(g,10.2,5.5,3.7);
    [-4,-2.65,2.65,4].forEach(function(x){cyl(g,C.cream,x,3.65,3.05,.3,5.5);box(g,C.cream,x,1,3.05,.85,.3,.85);box(g,C.cream,x,6.4,3.05,.85,.3,.85);});
    text(g,'BANK',0,7,3.15,8.6,1,'#0975d6');
    var geom=geo('pediment',function(){var q=new T.BufferGeometry();q.setAttribute('position',new T.Float32BufferAttribute([-5.2,0,-.45,5.2,0,-.45,0,2,-.45,-5.2,0,.45,5.2,0,.45,0,2,.45],3));q.setIndex([0,2,1,3,4,5,0,1,4,0,4,3,1,2,5,1,5,4,2,0,3,2,3,5]);q.computeVertexNormals();return q;});add(g,geom,C.cream,0,7.8,2.4);
    disc(g,C.gold,0,8.65,2.98,.65);text(g,'$',0,8.65,3.11,.65,.8,'#ffbd28','#795124');return g;
  }
  function apartment(pink) {
    var g=shell(pink?'aptPink':'aptYellow',pink?0xff53a0:0xffc630,9.5,5.5,11.7,4);
    for(var row=0;row<4;row++) {
      var y=2.6+row*2.45;
      [-2.8,2.8].forEach(function(x){windowAt(g,x,y,2.8,0,1.75,1.55);box(g,C.cream,x,y-.85,3.02,2.6,.18,.85);box(g,pink?0xf98ac2:0xffdf62,x,y-.25,3.43,2.6,.12,.12);[-1.1,0,1.1].forEach(function(dx){box(g,C.ink,x+dx,y-.51,3.43,.07,.55,.07);});if(pink){box(g,0xc1845c,x,y-.7,3.24,1.35,.27,.3);box(g,0x79d62d,x,y-.43,3.24,1.4,.3,.35);}});
    }
    return g;
  }
  function tower(pink) {
    var g=shell(pink?'towerPink':'officeBlue',pink?0xf9509e:0x4ba6d5,6.6,5.4,18.7,0);
    for(var row=0;row<6;row++) {
      var y=3.4+row*2.5;
      [0,Math.PI/2,Math.PI,-Math.PI/2].forEach(function(a,i){var f=face(g,i===1?3.34:i===3?-3.34:0,y,i===0?2.74:i===2?-2.74:0,a),w=i%2?4.8:6;
        box(f,0x124d8c,0,0,0,w,1.96,.1);box(f,0x24b9ef,0,0,.085,w-.18,1.76,.06,true);
        [-w/3,0,w/3].forEach(function(x){box(f,C.cream,x,0,.15,.08,1.8,.06);});box(f,pink?0xff87b8:C.cream,0,-1.1,.08,w+.25,.2,.23);
      });
    }
    box(g,pink?C.pink:C.cream,0,19.1,0,5.5,.7,4.5);box(g,pink?0xff8ac2:0xb9d5ed,0,19.6,0,4.2,.4,3.3);
    if(pink)star(g,0,20.65,.5,1,C.gold);else {disc(g,C.blue,0,20.35,1.1,.65);star(g,0,20.35,1.25,.42,0x92efff);}
    return g;
  }
  function parking() {
    var g=new T.Group();g.name='parking';
    for(var row=0;row<4;row++) {
      var y=.25+row*3;
      box(g,0xe8beae,0,y,0,10.5,.35,6.2);
      if(row<3){[-4.6,0,4.6].forEach(function(x){[-2.65,2.65].forEach(function(z){box(g,0xe9c7b6,x,y+1.5,z,.55,2.65,.55);});});
      [-1,1].forEach(function(s){box(g,0xb5929c,s*5.05,y+.75,0,.22,.8,5.4);box(g,0xb5929c,0,y+.75,-2.9,9.7,.8,.2);});}
    }
    roof(g,10.2,6,9.55);
    // Sloped lane and solid edge live inside the open garage envelope.
    var ramp=box(g,0x85839a,3.3,1.7,0,1.7,.16,5.5);ramp.rotation.x=-.49;
    var edge=box(g,C.gold,4.2,1.96,0,.15,.4,5.5);edge.rotation.x=-.49;
    text(g,'P',0,7.7,3.25,2,2,'#0872e4');
    [-3,3].forEach(function(x){box(g,0xffc72a,x,.48,2.9,2,.12,.7);for(var i=0;i<4;i++){var s=box(g,C.ink,x-.7+i*.47,.57,2.9,.18,.045,.69);s.rotation.y=-.4;}});
    box(g,C.cream,0,.19,3.25,2.2,.24,.9);shrub(g,-4.5,3.3);shrub(g,4.5,3.3);
    return g;
  }
  var api={store24:function(){return shop('store24');},cafe:function(){return shop('cafe');},police:function(){return shop('police');},hospital:function(){return shop('hospital');},gym:function(){return shop('gym');},cinema:function(){return shop('cinema');},bank:bank,aptYellow:function(){return apartment(false);},aptPink:function(){return apartment(true);},officeBlue:function(){return tower(false);},towerPink:function(){return tower(true);},parking:parking};
  // Measure real geometry (including hulls), then centre the complete footprint.
  // Lazy size getters also work before a factory has been called.
  api.size = {};
  Object.keys(api).forEach(function(name) {
    if(name==='size')return;
    var build=api[name];
    api[name]=function() {
      var g=build();g.updateMatrixWorld(true);
      var bounds=new T.Box3().setFromObject(g), mid=new T.Vector3();bounds.getCenter(mid);
      g.children.forEach(function(child){child.position.x-=mid.x;child.position.z-=mid.z;});
      Object.defineProperty(api.size,name,{value:{w:bounds.max.x-bounds.min.x,d:bounds.max.z-bounds.min.z,h:bounds.max.y},writable:true,enumerable:true,configurable:true});
      g.updateMatrixWorld(true);return g;
    };
    Object.defineProperty(api.size,name,{enumerable:true,configurable:true,get:function(){api[name]();return api.size[name];}});
  });
  window.CityBuildings=api;
})();
