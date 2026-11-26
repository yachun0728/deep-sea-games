/* Granular spheres with a height axis, viewed from above. Fixed 120 Hz, spatial hashing, contact friction,
   finite glue sites; grains only bind after surface contact and residence.
   No region fill, color blending, timed deletion, or automatic loose-sand clearing. */
(function(root){
'use strict';
const W=360,H=400,R=1.08,CELL=R*2.5,MAX=260000,MAX_LOOSE=5000;
const paths=[
 ['background','M 20 20 H 340 V 380 H 20 Z'],
 ['tail','M 242 263 C 312 224 336 288 298 318 C 277 335 239 324 235 305 C 244 298 253 307 273 303 C 295 297 288 276 267 282 Z'],
 ['body','M 132 232 C 108 248 99 304 116 330 Q 176 356 241 329 C 256 299 246 249 226 231 Z'],
 ['bib','M 130 242 Q 179 263 231 241 L 226 261 L 198 266 L 182 291 L 161 265 L 132 260 Z'],
 ['head','M 102 158 L 100 91 Q 100 76 114 84 L 151 110 Q 180 102 209 110 L 245 84 Q 259 77 258 93 L 256 158 C 278 215 236 257 180 258 C 124 258 82 215 102 158 Z'],
 ['earLeft','M 112 100 L 118 144 L 145 120 Z'],
 ['earRight','M 246 100 L 239 145 L 215 120 Z'],
 ['muzzle','M 143 209 C 143 191 163 189 180 200 C 197 188 217 193 217 209 C 216 235 144 236 143 209 Z'],
 ['pawLeft','M 117 316 Q 124 301 142 306 Q 162 311 162 333 Q 143 349 119 340 Q 110 336 117 316 Z'],
 ['pawRight','M 204 319 Q 212 301 231 306 Q 249 310 248 336 Q 226 350 203 338 Z'],
 ['star','M 70 251 L 77 267 L 94 270 L 81 282 L 83 299 L 68 290 L 53 299 L 56 281 L 43 270 L 61 267 Z'],
 ['moon','M 286 134 C 314 156 304 195 277 197 C 293 184 296 158 286 134 Z']
];
const outlines=paths.slice(1).map(([name,d],i)=>['outline-'+name,d,4.8,i+1]);
paths.push(...outlines,
 ['eyeLeft','M129 179 Q140 191 151 178',5.4],
 ['eyeRight','M209 178 Q220 191 232 179',5.4],
 ['nose','M175 202 L185 202 L180 208 Z'],
 ['mouth','M180 208 Q175 219 169 212 M180 208 Q186 219 192 212',4.8],
 ['whiskerLeftTop','M112 199 L90 194',4.8],
 ['whiskerLeftBottom','M113 207 L90 210',4.8],
 ['whiskerRightTop','M247 199 L270 194',4.8],
 ['whiskerRightBottom','M247 207 L270 210',4.8]);

function makePicturePaths(base,details){return [...base,...base.slice(1).map(([name,d],i)=>['outline-'+name,d,4.8,i+1]),...details]}
const pictureCatalog=[{id:'cat',zh:'晚安小貓',en:'Sleepy kitten',baseCount:12,paths:paths.map(p=>[...p]),colors:['#fff4dd','#e7a575','#e7a575','#4f7f75','#e7a575','#d88f9f','#d88f9f','#f7f2df','#f7f2df','#f7f2df','#eac85c','#8cbcc6']},
{"id": "rabbit", "zh": "小兔花園", "en": "Bunny garden", "colors": ["#fff4dd", "#f7f2df", "#f7f2df", "#f7f2df", "#f7f2df", "#d88f9f", "#d88f9f", "#e7a575", "#f7f2df", "#f7f2df", "#e7a575", "#9aaf89", "#d88f9f", "#eac85c"], "baseCount": 14, "base": [["background", "M20 20H340V380H20Z"], ["body", "M128 225C97 254 102 316 127 336Q180 354 223 334C248 311 248 252 222 226Z"], ["earLeft", "M119 159C102 133 94 67 115 62C141 59 156 115 151 157Z"], ["earRight", "M187 154C182 109 199 57 218 64C240 73 220 134 220 159Z"], ["head", "M103 170C98 127 246 122 250 171C269 214 235 250 177 252C121 252 86 214 103 170Z"], ["innerEarLeft", "M120 135C111 115 108 83 116 81C127 80 140 119 137 141Z"], ["innerEarRight", "M200 141C198 120 204 86 214 82C223 89 212 123 210 141Z"], ["belly", "M142 273C146 252 210 251 218 277L220 320Q178 342 138 318Z"], ["pawLeft", "M112 321C111 300 150 300 158 324Q162 344 132 346Q107 347 112 321Z"], ["pawRight", "M202 325C206 300 245 303 247 323Q252 347 222 346Q197 345 202 325Z"], ["carrot", "M268 260Q281 249 294 264Q291 306 269 333Q258 302 260 275Z"], ["carrotLeaves", "M276 260C253 250 251 229 260 228Q274 232 278 250Q277 221 288 221Q300 236 284 256Q304 240 311 251Q307 265 283 267Z"], ["flower", "M57 245C39 235 48 219 61 224C57 202 80 203 80 220C98 205 110 226 93 237C113 248 97 266 84 251C81 274 58 267 66 252Z"], ["flowerCenter", "M65 237a10 10 0 1 0 20 0a10 10 0 1 0 -20 0Z"]], "details": [["eyeLeft", "M128 186Q140 196 151 185", 5.4], ["eyeRight", "M207 185Q219 196 231 186", 5.4], ["nose", "M171 205Q177 199 183 205L177 212Z"], ["mouth", "M177 212Q169 223 163 216M177 212Q185 223 191 216", 4.8]]},
{"id": "whale", "zh": "月光鯨魚", "en": "Moonlit whale", "colors": ["#fff4dd", "#8cbcc6", "#547caa", "#f7f2df", "#8cbcc6", "#eac85c", "#eac85c", "#aaa0c2", "#8cbcc6", "#8cbcc6"], "baseCount": 10, "base": [["background", "M20 20H340V380H20Z"], ["sea", "M20 299Q64 274 108 298T196 299T284 299Q313 286 340 299V380H20Z"], ["whale", "M73 210C85 156 185 159 226 202Q249 210 265 189Q266 226 297 221Q281 249 245 245C225 293 125 299 84 257Q67 239 73 210Z"], ["belly", "M80 240Q154 279 241 239Q230 282 166 284Q103 282 80 252Z"], ["fin", "M171 235Q203 242 205 267Q181 278 163 248Z"], ["moon", "M278 65C322 92 305 142 266 144C291 127 299 91 278 65Z"], ["star", "M84 73L89 86L102 87L92 96L94 109L84 101L74 109L76 96L66 87L79 86Z"], ["bubbleLarge", "M94 143a10 10 0 1 0 20 0a10 10 0 1 0 -20 0Z"], ["bubbleSmall", "M122 118a6 6 0 1 0 12 0a6 6 0 1 0 -12 0Z"], ["spout", "M146 168Q129 143 147 136Q156 140 155 153Q164 127 177 138Q183 151 160 170Z"]], "details": [["eye", "M109 221Q122 231 134 220", 5.4], ["smile", "M143 241Q152 248 160 239", 4.8]]},
{"id": "cake", "zh": "草莓蛋糕", "en": "Strawberry cake", "colors": ["#fff4dd", "#aaa0c2", "#e7a575", "#d88f9f", "#f7f2df", "#b5444d", "#9aaf89", "#b5444d", "#9aaf89", "#8cbcc6", "#eac85c", "#eac85c", "#eac85c"], "baseCount": 13, "base": [["background", "M20 20H340V380H20Z"], ["plate", "M70 326C66 302 290 302 291 326C291 351 71 351 70 326Z"], ["cake", "M101 208H260V318Q180 345 101 318Z"], ["filling", "M101 259Q180 278 260 259V279Q181 300 101 279Z"], ["icing", "M95 205Q180 178 266 205L263 238Q250 251 239 233Q224 260 211 238Q194 264 179 238Q163 263 149 238Q132 257 121 235Q107 252 97 237Z"], ["strawberryLeft", "M126 165Q123 144 144 149Q166 145 165 166Q159 191 145 201Q129 186 126 165Z"], ["leafLeft", "M144 154L132 143L145 147L151 136L153 149L167 145L159 157Z"], ["strawberryRight", "M211 166Q206 147 228 151Q249 146 248 168Q241 192 228 201Q215 184 211 166Z"], ["leafRight", "M226 157L214 145L228 150L234 138L236 150L249 148L240 159Z"], ["candle", "M178 137H190V194H178Z"], ["flame", "M184 106C202 126 196 138 184 138C170 137 169 123 184 106Z"], ["sparkleLeft", "M67 180L72 191L83 192L75 201L77 212L67 206L57 212L59 201L51 192L62 191Z"], ["sparkleRight", "M292 131L297 140L306 141L300 150L302 159L292 155L282 159L284 150L278 141L287 140Z"]], "details": [["eyeLeft", "M140 302Q150 312 160 301", 4.8], ["eyeRight", "M204 301Q214 312 224 302", 4.8], ["smile", "M174 313Q182 321 190 313", 4.8], ["seedLeft1", "M139 164L138 168", 3], ["seedLeft2", "M153 170L152 174", 3], ["seedRight1", "M222 165L221 169", 3], ["seedRight2", "M235 175L234 179", 3]]},
{"id": "flowers", "zh": "花朵盆栽", "en": "Little flower pot", "colors": ["#fff4dd", "#4f7f75", "#c47a62", "#e7a575", "#9aaf89", "#4f7f75", "#d88f9f", "#eac85c", "#aaa0c2", "#f7f2df", "#eac85c", "#eac85c"], "baseCount": 12, "base": [["background", "M20 20H340V380H20Z"], ["stems", "M164 274L137 163L146 160L175 251L224 130L232 134L186 274Z"], ["pot", "M111 270H249L235 341Q181 356 125 340Z"], ["rim", "M103 257H257L254 279Q181 290 106 279Z"], ["leafLeft", "M162 246C122 248 100 225 102 205C137 201 165 219 162 246Z"], ["leafRight", "M196 237C201 207 230 190 260 198C258 223 228 244 196 237Z"], ["flowerPink", "M126 121C102 101 122 79 140 96C150 72 179 90 166 109C194 106 197 136 173 140C193 158 172 182 154 167C150 194 122 186 125 165C104 177 87 151 108 139C81 129 99 105 118 116Z"], ["centerPink", "M121 139a21 21 0 1 0 42 0a21 21 0 1 0 -42 0Z"], ["flowerBlue", "M222 91C209 71 232 58 244 76C263 63 280 88 260 101C285 111 269 135 250 126C247 151 219 146 221 124C195 131 190 104 214 99Z"], ["centerBlue", "M221 105a17 17 0 1 0 34 0a17 17 0 1 0 -34 0Z"], ["sun", "M270 189a22 22 0 1 0 44 0a22 22 0 1 0 -44 0Z"], ["sparkle", "M62 255L67 265L77 266L70 275L72 285L62 280L52 285L54 275L47 266L57 265Z"]], "details": [["potEyeLeft", "M148 309Q157 317 166 308", 4.8], ["potEyeRight", "M196 308Q205 317 214 309", 4.8], ["potSmile", "M176 323Q182 328 188 323", 4.2]]},
{"id": "cottage", "zh": "山間小屋", "en": "Mountain cottage", "colors": ["#fff4dd", "#8cbcc6", "#aaa0c2", "#f7f2df", "#9aaf89", "#c47a62", "#4f7f75", "#e7a575", "#c47a62", "#b5444d", "#c47a62", "#eac85c", "#eac85c", "#eac85c"], "baseCount": 14, "base": [["background", "M20 20H340V380H20Z"], ["mountainLeft", "M29 283L116 103L222 283Z"], ["mountainRight", "M151 283L259 134L336 283Z"], ["snow", "M116 103L87 163L109 156L122 172L136 155L154 167Z"], ["hill", "M20 301Q88 266 170 294Q255 263 340 293V380H20Z"], ["trunk", "M64 284H77V332H64Z"], ["tree", "M70 197L45 241H57L35 279H51L31 306H110L89 279H103L82 241H95Z"], ["house", "M113 214H249V325H113Z"], ["chimney", "M218 166H237V205H218Z"], ["roof", "M95 224L179 151L267 224Z"], ["door", "M163 324V279Q181 258 199 279V324Z"], ["windowLeft", "M126 244H151V270H126Z"], ["windowRight", "M211 244H236V270H211Z"], ["sun", "M269 87a23 23 0 1 0 46 0a23 23 0 1 0 -46 0Z"]], "details": [["windowFrameLeft", "M138 244V270M126 257H151", 3.6], ["windowFrameRight", "M223 244V270M211 257H236", 3.6], ["doorKnob", "M188.5 296a2.5 2.5 0 1 0 5.0 0a2.5 2.5 0 1 0 -5.0 0Z"]]}];
for(const picture of pictureCatalog)if(picture.base){picture.paths=makePicturePaths(picture.base,picture.details);delete picture.base;delete picture.details}
function activatePicture(id){const picture=pictureCatalog.find(p=>p.id===id);if(!picture)throw new Error('Unknown picture');paths.splice(0,paths.length,...picture.paths.map(p=>[...p]));return picture}
// Region IDs are geometry, never antialiased RGB values: edge blending can
// otherwise invent the ID of an unrelated peeled region (ghost glue lines).
function rasterizeRegions(ctx,shapes,width,height,strokes=[],occluders=[]){
 ctx.lineCap='round';ctx.lineJoin='round';
 const ids=new Int8Array(width*height);ids.fill(-1);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)for(let i=shapes.length-1;i>=0;i--){
  const stroke=strokes[i]||0;ctx.lineWidth=stroke||1;
  if(stroke?ctx.isPointInStroke(shapes[i],x+.5,y+.5):ctx.isPointInPath(shapes[i],x+.5,y+.5)){if((occluders[i]||[]).some(p=>ctx.isPointInPath(p,x+.5,y+.5)))continue;ids[y*width+x]=i;break}
 }
 return ids;
}
function projectTilt(gamma,beta,baseGamma,baseBeta,angle=0){
// Project the gravity vector onto the calibrated board plane. Euler angles can
// jump by 180 degrees near an upright phone; subtracting them creates false force.
const r=Math.PI/180,g=gamma*r,b=beta*r,g0=baseGamma*r,b0=baseBeta*r;
const dead=v=>Math.sign(v)*Math.max(0,Math.abs(v)-Math.sin(1.5*r));
const x=dead(Math.cos(b)*Math.sin(g-g0)),y=dead(Math.sin(b)*Math.cos(b0)-Math.cos(b)*Math.cos(g-g0)*Math.sin(b0)),a=angle*r;
return{x:x*Math.cos(a)+y*Math.sin(a),y:y*Math.cos(a)-x*Math.sin(a)}}
class SandWorld{
 constructor(regionAt,random=Math.random){this.regionAt=regionAt;this.random=random;this.reset()}
 reset(){this.revision=(this.revision||0)+1;this.grains=[];this.moving=[];this.boundQueue=[];this.fixedByRegion={};this.peeled=new Set();this.sites=new Map();this.gx=0;this.gy=0;this.emitted=0;this.exited=0;this.full=false;this.time=0;this.head=new Int32Array(192*224);this.next=new Int32Array(MAX_LOOSE)}
 peel(id){if(id>=0&&id<paths.length){const changed=!this.peeled.has(id);this.peeled.add(id);return changed}return false}
 emit(x,y,color,count=1,spread=9){let made=0;for(let i=0;i<count;i++){if(this.moving.length>=MAX_LOOSE||this.grains.length>=MAX){this.full=true;break}const a=this.random()*Math.PI*2,d=Math.sqrt(this.random())*spread;const px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;if(px<20||px>340||py<20||py>380)continue;let surface=0;for(const p of this.moving)if((p.supported||p.z<.35)&&Math.abs(p.x-px)<p.r+R&&Math.abs(p.y-py)<p.r+R)surface=Math.max(surface,p.z+p.r+R);const grain={index:this.grains.length,x:px,y:py,vx:(this.random()-.5)*4,vy:(this.random()-.5)*4,z:surface+6+this.random()*3,vz:0,color,bound:false,contact:0,shade:this.random(),r:R*(.82+this.random()*.32)};this.grains.push(grain);this.moving.push(grain);made++;this.emitted++}return made}
 impulse(x,y,radius,vx,vy,kind='scraper',weight=1){const cap=kind==='brush'?26:kind==='pick'?20:55,speed=Math.hypot(vx,vy),limit=cap/Math.max(cap,speed);vx*=limit;vy*=limit;
 for(const p of this.moving){const d=Math.hypot(p.x-x,p.y-y);if(d<radius){const f=(1-d/radius)*(1-Math.exp(-.65*weight));p.vx+=(vx-p.vx)*f;p.vy+=(vy-p.vy)*f;p.contact=0}}
 }

 sweep(x0,y0,x1,y1,kind='scraper',elapsed=1/60){const dx=x1-x0,dy=y1-y0,d=Math.hypot(dx,dy);if(d<.05)return;const ux=dx/d,uy=dy/d,half=kind==='scraper'?26:kind==='brush'?18:3,follow=Math.min(kind==='scraper'?10:kind==='brush'?6:4,d/Math.max(elapsed,1/120)*.08);
  for(const p of this.moving){const along=(p.x-x0)*ux+(p.y-y0)*uy,side=(p.x-x0)*(-uy)+(p.y-y0)*ux;if(along < -p.r*2||along>d+p.r||Math.abs(side)>half+p.r)continue;
   const taper=kind==='brush'?Math.max(.15,1-Math.abs(side)/(half+p.r)):1,amount=Math.max(0,Math.min(d+p.r*2,d+p.r+1-along))*(kind==='brush'?.55*(.85+p.shade*.3):kind==='pick'?.7:1/(1+Math.min(8,p.z)*.07))*taper;
   p.x+=ux*amount;p.y+=uy*amount;const blend=(kind==='brush'?.65:.8)*taper;const carry=follow*(.85+p.shade*.3);p.vx+=(ux*carry-p.vx)*blend;p.vy+=(uy*carry-p.vy)*blend;p.toolUntil=this.time+.12;
  }
 }

 shake(strength=90){for(let pi=0;pi<this.moving.length;pi++){const p=this.moving[pi];if(!p.bound){p.vx+=(this.random()-.5)*strength;p.vy+=(this.random()-.5)*strength;p.vz+=15+this.random()*strength*.2;p.contact*=.3}}}
 tap(){for(const p of this.moving){if(!p.bound){const n=Math.hypot(this.gx,this.gy),x=n>.1?this.gx/n:0,y=n>.1?this.gy/n:1;p.vx+=x*(35+this.random()*25)+(this.random()-.5)*12;p.vz+=20+this.random()*12;p.vy+=y*(35+this.random()*25)}}}
 step(dt){this.time+=dt;if(!this.moving.length){this.full=false;return}const bins=this.head,next=this.next;bins.fill(-1);const key=(x,y)=>(Math.floor(x/CELL)+32)+(Math.floor(y/CELL)+32)*192;
 for(let pi=0;pi<this.moving.length;pi++){const p=this.moving[pi];if(!p.bound){p.vx+=this.gx*125*dt;p.vy+=this.gy*125*dt;const speed=Math.hypot(p.vx,p.vy);p.supported=false;p.vz-=300*dt;p.z+=p.vz*dt;if(p.z<0){p.z=0;p.vz=0;p.supported=true}const tacky=p.z<.35&&this.peeled.has(this.regionAt(p.x,p.y))&&!this.sites.has(Math.floor(p.x/.7)+Math.floor(p.y/.7)*1024);const grainFriction=.82+p.shade*.36;const friction= Math.max(0,1-grainFriction*(p.z<.35?(1.8+speed*1.6+speed*speed*.012+(tacky?2+speed*1.4:0)):speed*1.15)*dt/(speed||1));p.vx*=friction;p.vy*=friction;const limit=230/Math.max(230,Math.hypot(p.vx,p.vy));p.vx*=limit;p.vy*=limit;p.x+=p.vx*dt;p.y+=p.vy*dt}const k=key(p.x,p.y);next[pi]=bins[k];bins[k]=pi}
 // Only loose grains collide and heap. Fixed grains are embedded in adhesive,
 // so the coating cannot become a wall that traps the moving upper layer.
 for(let pass=0;pass<2;pass++)for(let pi=0;pi<this.moving.length;pi++){const p=this.moving[pi];const bx=Math.floor(p.x/CELL),by=Math.floor(p.y/CELL);for(let iy=-1;iy<=1;iy++)for(let ix=-1;ix<=1;ix++){let qi=bins[(bx+ix+32)+(by+iy+32)*192];for(;qi>=0;qi=next[qi]){if(qi<=pi)continue;const q=this.moving[qi];let dx=p.x-q.x,dy=p.y-q.y,dz=p.z-q.z;const min=(p.r+q.r)*.94,d2=dx*dx+dy*dy+dz*dz;if(d2>=min*min)continue;let d=Math.sqrt(d2);if(d<.001){dx=.01;dy=0;d=.01}/* Resting lower layers support weight; higher layers yield and slide. */if(Math.max(p.z,q.z)<8&&Math.abs(dz)/d>.45&&Math.hypot(p.vx-q.vx,p.vy-q.vy)<12){const top=dz>0?p:q,bottom=dz>0?q:p;top.z=bottom.z+Math.sqrt(Math.max(0,min*min-dx*dx-dy*dy));top.vz=Math.max(0,bottom.vz);top.supported=true;continue}const nx=dx/d,ny=dy/d,nz=dz/d,share=q.bound?1:.5,overlap=Math.min(min-d,.8)*share;p.x+=nx*overlap;p.y+=ny*overlap;p.z=Math.max(0,p.z+nz*overlap);if(!q.bound){q.x-=nx*overlap;q.y-=ny*overlap;q.z=Math.max(0,q.z-nz*overlap)}const rel=(p.vx-q.vx)*nx+(p.vy-q.vy)*ny+(p.vz-q.vz)*nz;if(rel<0){const j=-rel*.52;p.vx+=nx*j;p.vy+=ny*j;p.vz+=nz*j;if(!q.bound){q.vx-=nx*j;q.vy-=ny*j;q.vz-=nz*j}const rx=p.vx-q.vx,ry=p.vy-q.vy,rz=p.vz-q.vz,vn=rx*nx+ry*ny+rz*nz,tx=rx-vn*nx,ty=ry-vn*ny,tz=rz-vn*nz,slip=Math.hypot(tx,ty,tz),drag=Math.min(.5,j*.6/(slip||1));p.vx-=tx*drag;p.vy-=ty*drag;p.vz-=tz*drag;q.vx+=tx*drag;q.vy+=ty*drag;q.vz+=tz*drag}}}}
 for(let i=this.moving.length-1;i>=0;i--){const p=this.moving[i];
 // A grain remains visible on the catch apron until it crosses the outer view.
 if(p.x < -28||p.x>W+28||p.y < -28||p.y>H+28){const last=this.grains.pop();if(last!==p){this.grains[p.index]=last;last.index=p.index}this.moving[i]=this.moving[this.moving.length-1];this.moving.pop();this.exited++;continue}
 const id=this.regionAt(p.x,p.y);const s=Math.floor(p.x/.7)+Math.floor(p.y/.7)*1024;const occupied=this.sites.get(s)||0;
 const edge=p.r*.75;const glue=this.peeled.has(id)&&this.peeled.has(this.regionAt(p.x+edge,p.y))&&this.peeled.has(this.regionAt(p.x-edge,p.y))&&this.peeled.has(this.regionAt(p.x,p.y+edge))&&this.peeled.has(this.regionAt(p.x,p.y-edge));
 if(p.z<.35&&glue&&occupied<1&&Math.hypot(p.vx,p.vy)<105){p.contact+=dt;if(p.contact>(this.time<(p.toolUntil||0)?.025:.025)&&this.random()<1-Math.exp(-(this.time<(p.toolUntil||0)?25:40)*dt)){p.bound=true;p.vx=0;p.vy=0;p.z=0;p.vz=0;// Occupy the actual pigment footprint, rather than only its center point.
const cover=p.r*.8;for(let cy=Math.floor((p.y-cover)/.7);cy<=Math.floor((p.y+cover)/.7);cy++)for(let cx=Math.floor((p.x-cover)/.7);cx<=Math.floor((p.x+cover)/.7);cx++)if(Math.hypot((cx+.5)*.7-p.x,(cy+.5)*.7-p.y)<=cover)this.sites.set(cx+cy*1024,1);this.sites.set(s,1);this.fixedByRegion[id]=(this.fixedByRegion[id]||0)+1;this.boundQueue.push(p);this.moving[i]=this.moving[this.moving.length-1];this.moving.pop()}}else p.contact=0;
 }
 this.full=this.moving.length>=MAX_LOOSE||this.grains.length>=MAX;
 }
 stats(){return {loose:this.moving.length,bound:this.grains.length-this.moving.length,boundByRegion:{...this.fixedByRegion},emitted:this.emitted,exited:this.exited,regions:this.peeled.size,full:this.full}}

}
root.SandEngine={SandWorld,paths,W,H,MAX,MAX_LOOSE,rasterizeRegions,projectTilt,pictureCatalog,activatePicture};
})(typeof window==='undefined'?globalThis:window);
