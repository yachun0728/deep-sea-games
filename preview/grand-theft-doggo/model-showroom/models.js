/* Grand Theft Doggo: Vice Paw — THREE r128, +Z front, meters. */
(function () {
  'use strict';
  var T = THREE;
  var palette = {}, geometries = {}, edgeCache = new WeakMap();
  function mat(color, glow) {
    var key = color + ':' + !!glow;
    return palette[key] || (palette[key] = glow ? new T.MeshBasicMaterial({color:color}) : new T.MeshLambertMaterial({color:color, flatShading:true}));
  }
  var ink = new T.LineBasicMaterial({color:0x252033});
  function boxGeo() { return geometries.box || (geometries.box = new T.BoxGeometry(1,1,1)); }
  function cylGeo(n) { return geometries['c'+n] || (geometries['c'+n] = new T.CylinderGeometry(1,1,1,n,1)); }
  function sphereGeo() { return geometries.sphere || (geometries.sphere = new T.SphereGeometry(1,8,5)); }
  function mesh(g, geo, color, x,y,z, sx,sy,sz, glow) {
    var m = new T.Mesh(geo,mat(color,glow));
    m.position.set(x,y,z); m.scale.set(sx,sy,sz); g.add(m);
    var e = edgeCache.get(geo);
    if (!e) { e = new T.EdgesGeometry(geo,28); edgeCache.set(geo,e); }
    m.add(new T.LineSegments(e,ink));
    return m;
  }
  function box(g,c,x,y,z,w,h,d,glow) { return mesh(g,boxGeo(),c,x,y,z,w,h,d,glow); }
  function cyl(g,c,x,y,z,r,h,n) {return mesh(g,cylGeo(n||8),c,x,y,z,r,h,r);}
  function ball(g,c,x,y,z,r) {return mesh(g,sphereGeo(),c,x,y,z,r,r,r);}
  function poly(vertices, indices) {
    var geo = new T.BufferGeometry(); geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3)); geo.setIndex(indices); geo.computeVertexNormals(); return geo;
  }
  function label(g,text,bg,fg,x,y,z,w,h) {
    var canvas=document.createElement('canvas'); canvas.width=256;canvas.height=128;
    var ctx=canvas.getContext('2d'); ctx.fillStyle=bg;ctx.fillRect(0,0,256,128);
    ctx.strokeStyle='#252033';ctx.lineWidth=10;ctx.strokeRect(5,5,246,118);
    ctx.fillStyle=fg;ctx.font='bold '+(text.length>1?'76':'100')+'px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,128,68,238);
    var tex=new T.CanvasTexture(canvas);tex.minFilter=T.LinearFilter;tex.generateMipmaps=false;
    var m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex}));m.position.set(x,y,z);g.add(m);
    m.add(new T.LineSegments(new T.EdgesGeometry(m.geometry),ink));
  }
  function bank() {
    var g=new T.Group();g.name='Bank';
    var stone=0xf7ceb4, trim=0xffefd4, blue=0x1589df, gold=0xffc52c, glass=0xffd745;
    box(g,0x7c7194,0,.18,0,11.8,.36,7.8);
    box(g,trim,0,.43,.12,11.4,.22,7.4);
    box(g,stone,0,4.3,-.25,10.4,7.5,6.7);
    box(g,trim,0,1.0,-.25,10.65,.45,6.9);
    box(g,trim,0,7.95,-.25,11.1,.4,7.1);
    box(g,0xbc879b,0,8.28,-.25,10.7,.25,6.8);
    // Continuous upper roof edge, visible from every angle.
    box(g,trim,0,8.52,-.25,11.4,.25,7.25);
    // Triangular pediment: outward-facing indexed triangular prism.
    var roof=poly([-5.65,0,-3.62, 5.65,0,-3.62, 0,2,-3.62, -5.65,0,3.62,5.65,0,3.62,0,2,3.62], [0,2,1,3,4,5,0,1,4,0,4,3,1,2,5,1,5,4,2,0,3,2,3,5]);
    mesh(g,roof,trim,0,8.65,-.25,1,1,1);
    // Four complete columns, each with broad capital and foot.
    [-4.35,-2.65,2.65,4.35].forEach(function(x){
      cyl(g,trim,x,3.85,3.04,.4,5.6,8);
      box(g,0xddbbd6,x,1.12,3.04,1.05,.32,1.05);
      box(g,trim,x,6.65,3.04,1.1,.38,1.05);
    });
    box(g,trim,0,.2,3.25,6.2,.4,1.3);
    box(g,trim,0,.4,3.0,5.7,.4,1.3);
    box(g,0x252c54,0,2.55,3.14,2.65,3.65,.18);
    [-.64,.64].forEach(function(x){box(g,gold,x,2.55,3.25,1.21,3.4,.12);box(g,blue,x,2.7,3.33,.92,2.8,.08);box(g,gold,x>0?.19:-.19,2.45,3.4,.1,.48,.09);});
    box(g,trim,0,7.03,3.38,8.9,1.47,.38);
    label(g,'BANK','#0875e2','#ffffff',0,7.03,3.58,8.55,1.2);
    var coin=cyl(g,gold,0,9.63,3.45,.81,.16,12);coin.rotation.x=Math.PI/2;
    label(g,'$','#ffc52c','#594029',0,9.63,3.55,1.1,1.1);
    // Glowing recessed windows with thick frames on front, rear and both sides.
    function windowAt(x,y,z,side){
      var w=new T.Group();w.position.set(x,y,z);w.rotation.y=side;g.add(w);
      box(w,0x3b4b70,0,0,0,1.22,1.5,.16);box(w,glass,0,0,.1,.98,1.25,.08,true);
      box(w,blue,0,0,.16,.08,1.25,.06);box(w,blue,0,0,.16,.98,.08,.06);
    }
    [-4,-2,0,2,4].forEach(function(x){windowAt(x,3.3,-3.64,Math.PI);windowAt(x,5.8,-3.64,Math.PI);});
    [-4,4].forEach(function(x){windowAt(x,3.8,3.14,0);});
    [-1.95,.25,2.05].forEach(function(z){[3.3,5.8].forEach(function(y){windowAt(5.24,y,z,Math.PI/2);windowAt(-5.24,y,z,-Math.PI/2);});});
    return g;
  }
  function carConvertible() {
    var g=new T.Group();g.name='Pink convertible';
    var pink=0xff4c9b, lightPink=0xff88bb, chrome=0xcce5ed, cream=0xffedbf;
    box(g,0x363044,0,.47,0,1.7,.3,3.8);
    box(g,pink,0,.73,0,1.9,.55,4.05);
    box(g,lightPink,0,1.01,1.14,1.88,.28,1.7);
    box(g,pink,0,1.03,-1.64,1.88,.3,.75);
    // Open cabin: floor, narrow sills and two separate seats.
    box(g,0x603850,0,.99,-.43,1.55,.08,1.65);
    [-.88,.88].forEach(function(x){box(g,pink,x,1.07,-.47,.19,.35,1.88);box(g,chrome,x,1.26,-.47,.2,.07,1.88);});
    [-.43,.43].forEach(function(x){box(g,cream,x,1.09,-.65,.65,.18,.65);var seat=box(g,cream,x,1.31,-.97,.65,.53,.17);seat.rotation.x=-.12;});
    box(g,cream,0,1.12,-1.35,1.48,.15,.3);
    box(g,0x46354d,0,1.19,.35,1.55,.2,.23);
    // Windshield pane remains visibly blue from the back too.
    var wind=box(g,0x88e1ed,0,1.4,.39,1.62,.43,.055);wind.rotation.x=-.2;
    [-.84,.84].forEach(function(x){var post=box(g,chrome,x,1.4,.39,.07,.5,.07);post.rotation.x=-.2;});
    box(g,chrome,0,1.63,.35,1.77,.07,.08);
    // Wheels rotate about X; tire bottoms sit exactly on ground.
    [-1.27,1.27].forEach(function(z){[-.9,.9].forEach(function(x){
      var tire=cyl(g,0x292735,x,.39,z,.39,.25,10);tire.rotation.z=Math.PI/2;
      var hub=cyl(g,chrome,x<0?-1.035:1.035,.39,z,.215,.035,8);hub.rotation.z=Math.PI/2;
    });});
    [2.04,-2.04].forEach(function(z){box(g,chrome,0,.53,z,1.99,.16,.16);});
    box(g,0x343347,0,.81,2.05,.85,.29,.07);
    [-.29,0,.29].forEach(function(x){box(g,chrome,x,.81,2.1,.05,.24,.04);});
    [-.65,.65].forEach(function(x){
      var lamp=cyl(g,cream,x,.99,2.025,.22,.09,10);lamp.rotation.x=Math.PI/2;
      box(g,0xff313d,x,.96,-2.05,.36,.17,.07,true);
      var fin=box(g,lightPink,x,1.17,-1.65,.12,.3,.66);fin.rotation.x=-.12;
    });
    // Low polygon steering wheel, above the dashboard on the driver's side.
    var steering=mesh(g,new T.TorusGeometry(.17,.035,4,8),0x302a3e,-.43,1.29,.13,1,1,1);steering.rotation.x=-.6;
    return g;
  }
  function palmTall() {
    var g=new T.Group();g.name='Tall palm';
    var verts=[],idx=[],rings=9,sides=8;
    function cx(t){return .62*Math.sin(t*1.6);}
    for(var j=0;j<rings;j++){var t=j/(rings-1),r=.29-.13*t;for(var k=0;k<sides;k++){var a=k*Math.PI*2/sides;verts.push(cx(t)+Math.cos(a)*r,t*6.5,Math.sin(a)*r);}}
    for(j=0;j<rings-1;j++)for(k=0;k<sides;k++){var a0=j*sides+k,b=j*sides+(k+1)%sides,c=b+sides,d=a0+sides;idx.push(a0,d,b,b,d,c);}
    for(k=1;k<7;k++){idx.push(0,k,k+1);idx.push(64,64+k+1,64+k);}
    mesh(g,poly(verts,idx),0xc38a38,0,0,0,1,1,1);
    for(j=1;j<8;j++){var t=j/8;cyl(g,0xe7ac4d,cx(t),t*6.5,0,.3-.13*t,.085,8);}
    // Each frond is a closed, tapered diamond-section leaf, with a high
    // shoulder and a drooping tip. Its lower face is real geometry.
    var lv=[],li=[],centers=[[0,0,0],[.85,.65,.38],[1.85,.32,.42],[2.7,-.65,.02]];
    centers.forEach(function(p,i){var width=p[2];lv.push(p[0],p[1]+.055,0,p[0],p[1],width,p[0],p[1]-.055,0,p[0],p[1],-width);});
    for(j=0;j<3;j++)for(k=0;k<4;k++){var a=j*4+k,b=j*4+(k+1)%4;li.push(a,b,a+4,b,b+4,a+4);}
    li.push(0,2,1,0,3,2,12,13,14,12,14,15);
    var leafGeo=poly(lv,li);
    for(j=0;j<8;j++){var leaf=mesh(g,leafGeo,j%2?0x80d62c:0x44bd24,cx(1),6.65+(j%2)*.12,0,1,1,1);leaf.rotation.y=j*Math.PI/4;}
    for(j=0;j<3;j++)ball(g,0x80502b,cx(1)+Math.cos(j*2.1)*.3,6.42,Math.sin(j*2.1)*.3,.23);
    return g;
  }
  window.CityModels={bank:bank,carConvertible:carConvertible,palmTall:palmTall};
})();
