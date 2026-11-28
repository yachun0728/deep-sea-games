/* 追加圖庫：小朋友款 6 張（區塊較大）與大人款 6 張（區塊多而細）。圖形全部由本檔的幾何函式產生（原創向量，無外部素材）。
   只用絕對座標 M/L/C/Q/Z，engine.js 才能用外框範圍加速分區。後面的區塊會蓋住前面的區塊。 */
(function(root){
'use strict';
const P={ivory:'#f7f2df',butter:'#eac85c',apricot:'#e7a575',clay:'#c47a62',blush:'#d88f9f',berry:'#b5444d',sage:'#9aaf89',forest:'#4f7f75',sky:'#8cbcc6',indigo:'#547caa',lilac:'#aaa0c2',charcoal:'#625957',paper:'#fff4dd'};
const n=v=>Math.round(v*10)/10,xy=p=>n(p[0])+' '+n(p[1]);
const polar=(cx,cy,r,deg)=>[cx+r*Math.cos(deg*Math.PI/180),cy+r*Math.sin(deg*Math.PI/180)];
const poly=points=>'M'+points.map(xy).join(' L')+'Z';
const rect=(x,y,w,h)=>poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);
function oval(cx,cy,rx,ry=rx,turn=0){const k=.5523,c=Math.cos(turn*Math.PI/180),s=Math.sin(turn*Math.PI/180),at=(u,v)=>xy([cx+u*rx*c-v*ry*s,cy+u*rx*s+v*ry*c]);
 return 'M'+at(1,0)+' C'+[at(1,k),at(k,1),at(0,1)].join(' ')+' C'+[at(-k,1),at(-1,k),at(-1,0)].join(' ')+' C'+[at(-1,-k),at(-k,-1),at(0,-1)].join(' ')+' C'+[at(k,-1),at(1,-k),at(1,0)].join(' ')+'Z'}
// 尖葉形花瓣：從半徑 inner 長到 outer，half 是半寬（角度）。
function petal(cx,cy,inner,outer,deg,half){const mid=inner+(outer-inner)*.62;
 return 'M'+xy(polar(cx,cy,inner,deg))+' Q'+xy(polar(cx,cy,mid,deg-half))+' '+xy(polar(cx,cy,outer,deg))+' Q'+xy(polar(cx,cy,mid,deg+half))+' '+xy(polar(cx,cy,inner,deg))+'Z'}
const ring=(count,fn)=>Array.from({length:count},(_,i)=>fn(i*360/count,i));
const line=(...points)=>'M'+points.map(xy).join(' L');
const curve=(a,c,b)=>'M'+xy(a)+' Q'+xy(c)+' '+xy(b);

// 小朋友款線條 3.4，大人款線條較細（2.5）才放得下小區塊。
function add(id,zh,en,shapes,lines,level='easy'){
 const width=level==='detailed'?2.5:3.4;
 const base=[['background',rect(20,20,320,360),P.paper],...shapes];
 const details=lines.map((item,i)=>['detail-'+i,item[0],item[1]||width]);
 root.SandEngine.pictureCatalog.push({id,zh,en,level,baseCount:base.length,colors:base.map(s=>s[2]),
  paths:[...base.map(s=>[s[0],s[1]]),...base.slice(1).map((s,i)=>['outline-'+s[0],s[1],width,i+1]),...details]});
}

{ // 星花曼陀羅
 const cx=180,cy=200,s=[];
 ring(4,(a,i)=>s.push(['corner'+i,petal(cx,cy,150,208,a+45,13),i%2?P.forest:P.indigo]));
 ring(16,(a,i)=>s.push(['outer'+i,petal(cx,cy,100,158,a+11.25,12),i%2?P.sky:P.indigo]));
 s.push(['rim',oval(cx,cy,122),P.lilac]);
 ring(16,(a,i)=>s.push(['bead'+i,oval(...polar(cx,cy,109,a),8.5),i%2?P.butter:P.ivory]));
 s.push(['field',oval(cx,cy,96),P.ivory]);
 ring(8,(a,i)=>s.push(['big'+i,petal(cx,cy,28,95,a,27),i%2?P.berry:P.clay]));
 ring(8,(a,i)=>s.push(['inlay'+i,petal(cx,cy,48,82,a,12),P.apricot]));
 ring(8,(a,i)=>s.push(['leaf'+i,petal(cx,cy,34,76,a+22.5,15),i%2?P.sage:P.forest]));
 s.push(['hub',oval(cx,cy,39),P.butter]);
 ring(8,(a,i)=>s.push(['star'+i,petal(cx,cy,9,36,a+22.5,22),i%2?P.blush:P.lilac]));
 s.push(['core',oval(cx,cy,13),P.berry]);
 add('mandala','星花曼陀羅','Star mandala',s,[]);
}

{ // 彩窗蝴蝶（左右對稱）
 const s=[],mirror=d=>d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g,(_,x,y)=>n(360-x)+' '+y);
 const pair=(name,d,color)=>s.push([name+'L',d,color],[name+'R',mirror(d),color]);
 pair('wingTop','M174 164 C150 96 92 52 44 62 C24 68 28 118 44 150 C60 192 120 206 174 190Z',P.indigo);
 pair('wingLow','M174 200 C126 192 62 204 56 246 C50 290 84 340 124 334 C156 328 172 270 176 226Z',P.forest);
 pair('paneA','M166 164 C146 118 108 86 70 80 C74 112 108 148 166 164Z',P.sky);
 pair('paneB','M164 174 C128 158 86 132 52 94 C46 124 56 154 76 168 C102 184 134 180 164 174Z',P.lilac);
 pair('paneC','M164 186 C132 190 96 190 72 176 C88 196 126 204 164 186Z',P.blush);
 pair('paneD','M168 208 C136 208 96 214 74 238 C102 256 142 242 168 208Z',P.butter);
 pair('paneE','M169 222 C150 248 118 268 78 262 C80 292 96 314 116 320 C146 300 162 262 169 222Z',P.sage);
 pair('eyeRing',oval(66,114,13,17,-20),P.butter);
 pair('eyeDot',oval(66,114,6,8,-20),P.berry);
 pair('dropA',oval(104,292,10,15,28),P.apricot);
 pair('dropB',oval(121,103,8,13,-48),P.ivory);
 pair('dropC',oval(112,172,12,7,12),P.ivory);
 [[46,322,15],[314,322,15],[180,52,19]].forEach(([x,y,r],i)=>{ring(5,(a,j)=>s.push(['bloom'+i+'-'+j,petal(x,y,3,r+6,a-90,34),i===2?P.blush:P.apricot]));s.push(['bloomCore'+i,oval(x,y,6),P.butter])});
 s.push(['abdomen','M170 214 C166 262 172 306 180 322 C188 306 194 262 190 214Z',P.clay],['thorax',oval(180,190,14,32),P.charcoal],['head',oval(180,148,14,13),P.clay]);
 add('butterfly','彩窗蝴蝶','Stained-glass butterfly',s,[
  [curve([173,137],[165,100],[140,92])],[curve([187,137],[195,100],[220,92])],
  [line([170,238],[190,238])],[line([170,260],[190,260])],[line([171,282],[189,282])]]);
}

{ // 錦鯉蓮池
 const s=[['pond',rect(26,26,308,348),P.sky]];
 const pad=(x,y,r,turn,color,name)=>{const pts=[[x,y]];for(let i=0;i<=20;i++)pts.push(polar(x,y,r,turn+24+i*15.6));s.push([name,poly(pts),color])};
 pad(82,84,46,-30,P.forest,'padA');pad(128,52,24,120,P.sage,'padB');pad(284,316,50,150,P.forest,'padC');pad(236,348,26,-70,P.sage,'padD');pad(62,330,30,40,P.sage,'padE');
 ring(8,(a,i)=>s.push(['lotusOuter'+i,petal(82,84,8,40,a,26),P.blush]));
 ring(6,(a,i)=>s.push(['lotusInner'+i,petal(82,84,5,25,a+30,28),P.ivory]));
 s.push(['lotusCore',oval(82,84,8),P.butter]);
 // 上面的鯉魚（頭朝右下）
 s.push(['koiATail','M150 132 C124 118 112 88 124 70 C134 90 148 92 156 94 C162 82 176 70 192 74 C176 92 172 112 170 128Z',P.apricot],
  ['koiAFinR','M230 140 C240 114 262 102 282 108 C270 124 258 144 244 160Z',P.butter],
  ['koiABody','M146 124 C174 104 232 130 262 178 C284 214 284 242 266 248 C246 258 212 236 188 208 C162 178 134 142 146 124Z',P.ivory],
  ['koiASpot1','M156 128 C176 120 198 134 204 146 C192 164 174 166 168 156 C160 148 152 138 156 128Z',P.berry],
  ['koiASpot2','M206 166 C222 150 244 170 250 186 C238 190 232 208 216 204 C202 196 196 178 206 166Z',P.clay],
  ['koiAHead',oval(255,225,19,14,52),P.apricot],
  ['koiACrown',oval(250,215,8,6,52),P.berry]);
 // 下面的鯉魚（頭朝左上）
 s.push(['koiBTail','M200 276 C226 288 240 318 230 340 C218 320 204 316 196 316 C188 328 174 340 158 336 C174 318 180 300 178 282Z',P.clay],
  ['koiBFinL','M158 222 C182 214 200 194 198 174 C180 182 160 196 146 210Z',P.ivory],
  ['koiBFinR','M120 262 C110 288 88 300 68 294 C80 278 92 258 106 242Z',P.ivory],
  ['koiBBody','M204 282 C176 302 118 276 88 228 C66 192 66 164 84 158 C104 148 138 170 162 198 C188 228 216 264 204 282Z',P.apricot],
  ['koiBSpot1','M194 276 C174 284 154 272 148 260 C160 244 176 244 182 252 C190 260 198 268 194 276Z',P.charcoal],
  ['koiBSpot2','M144 240 C128 256 106 236 100 220 C112 216 118 198 134 202 C148 210 154 228 144 240Z',P.ivory],
  ['koiBHead',oval(95,181,19,14,52),P.ivory],
  ['koiBCrown',oval(101,191,8,6,52),P.berry]);
 [[292,64,11],[310,92,7],[272,86,6],[46,212,9],[302,214,10],[128,356,9]].forEach(([x,y,r],i)=>s.push(['bubble'+i,oval(x,y,r),P.ivory]));
 add('koi','錦鯉蓮池','Koi and lotus pond',s,[
  [oval(262,222,3.4),3.4],[oval(251,236,3.4),3.4],[oval(88,184,3.4),3.4],[oval(99,170,3.4),3.4],
  [curve([270,240],[292,246],[296,266])],[curve([278,230],[300,228],[312,242])],
  [curve([80,166],[58,160],[54,140])],[curve([72,176],[50,178],[38,164])],
  [curve([218,72],[250,56],[266,40])],[curve([300,150],[318,140],[330,150])],[curve([36,272],[52,262],[66,272])]]);
}

{ // 孔雀開屏
 const s=[],cx=180,cy=262;
 const fan=(count,start,end,len,inner,name,color,half)=>{for(let i=0;i<count;i++){const a=start+(end-start)*i/(count-1);s.push([name+i,petal(cx,cy,inner,len,a,half),color(i)])}};
 // skip：被頸子或頭擋住的羽眼不放，避免出現點不到的碎塊。
 const eye=(count,start,end,dist,name,skip)=>{for(let i=0;i<count;i++){if(skip.includes(i))continue;const a=start+(end-start)*i/(count-1),p=polar(cx,cy,dist,a);s.push([name+'Ring'+i,oval(...p,17,14,a),P.butter],[name+'Dot'+i,oval(...p,8,6.5,a),P.indigo])}};
 fan(9,174,366,170,34,'tailBack',i=>i%2?P.forest:P.sage,13);
 eye(9,174,366,139,'eyeA',[4]);
 fan(8,186,354,116,28,'tailMid',i=>i%2?P.sky:P.forest,15);
 eye(8,186,354,90,'eyeB',[3,4]);
 s.push(['ground','M44 352 C100 332 260 332 316 352 C262 378 98 378 44 352Z',P.clay],
  ['legL',rect(163,318,9,32),P.apricot],['legR',rect(189,318,9,32),P.apricot],
  ['body','M180 232 C146 244 138 292 150 312 C162 336 198 336 210 312 C222 292 214 244 180 232Z',P.indigo],
  ['wingL','M156 262 C136 280 142 314 168 322 C176 300 172 276 156 262Z',P.sky],
  ['wingR','M204 262 C224 280 218 314 192 322 C184 300 188 276 204 262Z',P.sky],
  ['neck','M169 246 C162 218 168 196 170 180 L190 180 C192 196 198 218 191 246Z',P.indigo],
  ['crestA',oval(160,140,6),P.sky],['crestB',oval(180,131,6),P.butter],['crestC',oval(200,140,6),P.sky],
  ['head',oval(180,171,19,21),P.indigo],
  ['beak','M171 177 L189 177 L180 195Z',P.butter]);
 add('peacock','孔雀開屏','Peacock fan',s,[
  [line([172,152],[161,144])],[line([180,150],[180,136])],[line([188,152],[199,144])],
  [curve([167,166],[172,160],[177,166]),3.6],[curve([183,166],[188,160],[193,166]),3.6]]);
}

{ // 浪花與富士
 const s=[['sun',oval(264,92,42),P.berry],
  ['cloudA','M36 96 C44 74 74 74 84 86 C98 66 134 74 134 96 C154 96 154 112 136 112 L44 112 C26 112 24 98 36 96Z',P.ivory],
  ['cloudB','M200 150 C206 136 228 136 236 146 C246 130 274 134 278 148 C298 146 304 164 284 166 L206 166 C190 166 188 152 200 150Z',P.blush],
  ['mountainFar','M232 262 L296 192 L340 240 L340 262Z',P.lilac],
  ['mountain','M90 268 C136 236 166 190 186 150 L224 150 C246 192 278 236 336 268Z',P.indigo],
  ['snow','M163 189 C172 175 180 162 186 150 L224 150 C231 163 240 177 252 192 L234 184 L224 202 L209 182 L194 204 L182 186Z',P.ivory],
  ['seaBack','M20 262 C80 246 130 268 190 256 C250 244 300 262 340 252 L340 380 L20 380Z',P.sky],
  ['waveBig','M20 300 C20 224 62 168 122 168 C164 170 180 204 166 226 C158 206 134 204 124 220 C110 246 138 282 190 290 C150 316 80 320 20 300Z',P.forest],
  ['waveCurlA','M34 282 C38 226 70 186 118 183 C142 183 156 194 158 204 C136 194 108 200 100 226 C92 252 108 276 130 290 C100 298 62 296 34 282Z',P.sky],
  ['waveCurlB','M54 276 C58 236 78 208 108 200 C90 220 82 244 92 268 C96 276 102 284 108 289 C88 290 68 286 54 276Z',P.indigo]];
 [[126,166,11],[148,173,9],[163,188,8],[171,206,7],[106,162,8],[184,166,5],[190,192,4.5],[88,168,6]].forEach(([x,y,r],i)=>s.push(['foam'+i,oval(x,y,r),P.ivory]));
 s.push(['waveMid','M150 312 C196 262 238 256 262 276 C280 294 268 312 254 312 C262 294 240 288 232 300 C226 318 270 326 340 296 L340 338 C270 352 196 344 150 312Z',P.indigo],
  ['crestMid','M170 301 C204 270 236 262 256 276 C236 274 214 282 206 300 C202 312 212 322 224 327 C202 325 182 315 170 301Z',P.ivory],
  ['seaMid','M20 310 C62 292 104 338 164 320 C224 302 274 346 340 322 L340 380 L20 380Z',P.forest],
  ['seaFront','M20 342 C70 322 120 366 180 346 C240 326 290 368 340 346 L340 380 L20 380Z',P.indigo],
  ['boat','M214 330 C242 346 288 344 316 322 C308 352 292 364 262 364 C234 364 220 350 214 330Z',P.clay],
  ['sail','M262 288 L296 328 L262 332Z',P.butter],['sailSmall','M255 300 L255 332 L232 332Z',P.ivory]);
 add('wave','浪花與富士','Great wave and mountain',s,[
  [line([259,282],[259,342])],
  [curve([50,60],[60,50],[70,60])],[curve([70,60],[80,50],[90,60])],[curve([112,40],[120,32],[128,40])],[curve([128,40],[136,32],[144,40])],
  [curve([42,364],[62,350],[82,364])],[curve([108,372],[128,358],[148,372])],[curve([172,366],[188,355],[204,366])]]);
}

{ // 夜燈老街
 const s=[['sky',rect(26,26,308,300),P.indigo],
  ['moon','M276 46 C310 56 312 104 276 114 C294 94 294 66 276 46Z',P.butter]];
 [[60,56],[134,44],[214,66],[316,138],[44,122]].forEach(([x,y],i)=>s.push(['star'+i,poly(ring(8,(a,j)=>polar(x,y,j%2?4.5:11,a-90))),P.ivory]));
 const house=(name,x,w,top,wall,roof)=>{s.push([name+'Wall',rect(x,top,w,326-top),wall],[name+'Roof',poly([[x-7,top+2],[x+10,top-24],[x+w-10,top-24],[x+w+7,top+2]]),roof])};
 house('left',36,84,172,P.apricot,P.charcoal);house('mid',130,96,132,P.clay,P.forest);house('right',238,88,188,P.sage,P.berry);
 const win=(name,x,y,w,h,color)=>s.push([name,rect(x,y,w,h),color]);
 win('winL1',48,188,24,28,P.butter);win('winL2',84,188,24,28,P.ivory);
 win('winM1',142,146,20,28,P.ivory);win('winM2',168,146,20,28,P.butter);win('winM3',194,146,20,28,P.sky);
 win('winM4',142,188,20,28,P.butter);win('winM5',168,188,20,28,P.sky);win('winM6',194,188,20,28,P.butter);
 win('winR1',250,202,26,26,P.sky);win('winR2',288,202,26,26,P.butter);
 const awning=(name,x,w,y)=>{for(let i=0;i<5;i++){const a=x+i*w/5,b=x+(i+1)*w/5;s.push([name+i,'M'+xy([a,y])+' L'+xy([b,y])+' L'+xy([b,y+17])+' Q'+xy([(a+b)/2,y+30])+' '+xy([a,y+17])+'Z',i%2?P.ivory:P.berry])}};
 awning('awnL',36,84,230);awning('awnM',130,96,230);awning('awnR',238,88,240);
 win('doorL',48,272,26,54,P.forest);win('shopL',84,272,28,32,P.butter);
 win('shopM1',140,272,24,38,P.butter);win('doorM',168,266,24,60,P.charcoal);win('shopM2',196,272,22,38,P.butter);
 win('shopR',248,282,36,30,P.butter);win('doorR',292,280,24,46,P.clay);
 s.push(['street',rect(26,326,308,48),P.lilac],['walk',poly([[26,342],[334,342],[334,352],[26,352]]),P.charcoal],
  ['catBody','M100 372 C94 350 104 340 114 340 C126 340 136 352 130 372Z',P.apricot],['catHead','M103 342 L104 322 L112 330 L120 330 L128 322 L129 342 C124 352 108 352 103 342Z',P.apricot]);
 [[126,244],[232,250],[180,108]].forEach(([x,y],i)=>s.push(['lantern'+i,oval(x,y+18,i===2?11:9,i===2?13:15),P.berry]));
 add('town','夜燈老街','Lantern-lit old street',s,[
  [curve([28,96],[100,132],[180,104]),3.4],[curve([180,104],[258,138],[332,100]),3.4],
  [line([126,238],[126,247])],[line([232,244],[232,253])],
  [line([60,188],[60,216])],[line([96,188],[96,216])],[line([263,202],[263,228])],[line([301,202],[301,228])],
  [curve([130,368],[152,368],[146,348]),4]]);
}

/* ───── 大人款 ───── */
// 環形扇片：半徑 a 到 b、角度 from 到 to，用短直線近似圓弧。
function arc(cx,cy,a,b,from,to,steps=6){const side=(r,s,e)=>Array.from({length:steps+1},(_,i)=>polar(cx,cy,r,s+(e-s)*i/steps));return poly([...side(b,from,to),...side(a,to,from)])}
const pick=(list,i)=>list[i%list.length];
// 圓頭鱗片／羽毛：上緣平、下緣圓。
const scale=(x,y,w,h)=>'M'+xy([x-w/2,y])+' L'+xy([x+w/2,y])+' C'+xy([x+w/2,y+h*.75])+' '+xy([x+w/4,y+h])+' '+xy([x,y+h])+' C'+xy([x-w/4,y+h])+' '+xy([x-w/2,y+h*.75])+' '+xy([x-w/2,y])+'Z';

{ // 千瓣曼陀羅
 const cx=180,cy=200,s=[];
 const flower=(name,x,y,r,count,turn,colors,heart)=>{ring(count,(a,i)=>s.push([name+i,petal(x,y,3,r,a+turn,180/count*1.15),pick(colors,i)]));s.push([name+'Heart',oval(x,y,r*.26),heart])};
 [[50,52],[310,52],[50,348],[310,348]].forEach(([x,y],i)=>{flower('cornerA'+i,x,y,29,10,0,[P.indigo,P.sky],P.butter)});
 [[180,31],[180,369]].forEach(([x,y],i)=>s.push(['gemTop'+i,oval(x,y,17,8),P.berry],['gemTopL'+i,oval(x-30,y,9,6),P.sage],['gemTopR'+i,oval(x+30,y,9,6),P.sage]));
 ring(24,(a,i)=>s.push(['scallop'+i,oval(...polar(cx,cy,146,a+7.5),13),pick([P.forest,P.sage],i)]));
 ring(24,(a,i)=>s.push(['outer'+i,petal(cx,cy,108,156,a,10),pick([P.indigo,P.sky],i)]));
 ring(24,(a,i)=>s.push(['outerEye'+i,oval(...polar(cx,cy,139,a),8,4.6,a),pick([P.ivory,P.butter],i)]));
 s.push(['rim',oval(cx,cy,126),P.charcoal]);
 ring(40,(a,i)=>s.push(['bead'+i,oval(...polar(cx,cy,118.5,a),6.6),pick([P.butter,P.ivory],i)]));
 s.push(['fieldA',oval(cx,cy,110.5),P.lilac]);
 ring(16,(a,i)=>s.push(['spear'+i,petal(cx,cy,70,110,a+11.25,9),pick([P.forest,P.sage],i)]));
 ring(16,(a,i)=>s.push(['arch'+i,petal(cx,cy,56,106,a,14.5),pick([P.berry,P.clay],i)]));
 ring(16,(a,i)=>s.push(['archIn'+i,petal(cx,cy,68,96,a,8.5),pick([P.apricot,P.blush],i)]));
 ring(16,(a,i)=>s.push(['archDot'+i,oval(...polar(cx,cy,82,a),5.4,3.8,a),P.ivory]));
 s.push(['fieldB',oval(cx,cy,67),P.ivory]);
 ring(24,(a,i)=>s.push(['tile'+i,arc(cx,cy,55,67,a,a+15,3),pick([P.sky,P.indigo,P.forest],i)]));
 ring(12,(a,i)=>s.push(['mid'+i,petal(cx,cy,20,57,a,26),pick([P.blush,P.berry],i)]));
 ring(12,(a,i)=>s.push(['midIn'+i,oval(...polar(cx,cy,42,a),7.5,3.9,a),P.butter]));
 s.push(['hub',oval(cx,cy,28),P.butter]);
 ring(10,(a,i)=>s.push(['star'+i,petal(cx,cy,6,27,a+18,19),pick([P.clay,P.forest],i)]));
 s.push(['core',oval(cx,cy,10),P.berry]);
 add('lotus','千瓣曼陀羅','Thousand-petal mandala',s,[],'detailed');
}

{ // 玫瑰花窗
 const cx=180,cy=200,s=[['wall',rect(24,24,312,352),P.charcoal]];
 [[58,60,1,1],[302,60,-1,1],[58,340,1,-1],[302,340,-1,-1]].forEach(([x,y],k)=>{
  s.push(['quatreFrame'+k,oval(x,y,31),P.ivory]);
  ring(4,(a,i)=>s.push(['quatre'+k+'-'+i,petal(x,y,4,29,a+45,31),pick([P.berry,P.indigo],i+k)]));
  ring(4,(a,i)=>s.push(['quatreBud'+k+'-'+i,oval(...polar(x,y,22,a),6.2),P.sage]));
  s.push(['quatreCore'+k,oval(x,y,8.5),P.butter])});
 for(let i=0;i<7;i++){s.push(['brickTop'+i,rect(100+i*23,28,20,15),pick([P.clay,P.apricot],i)],['brickLow'+i,rect(100+i*23,357,20,15),pick([P.apricot,P.clay],i)])}
 s.push(['stone',oval(cx,cy,154),P.ivory]);
 ring(36,(a,i)=>s.push(['glassA'+i,arc(cx,cy,134,148,a+1,a+9,3),pick([P.indigo,P.berry,P.forest,P.butter],i)]));
 s.push(['leadA',oval(cx,cy,131),P.charcoal]);
 ring(12,(a,i)=>s.push(['lancetL'+i,arc(cx,cy,74,126,a+1,a+15,4),pick([P.indigo,P.sky,P.forest],i)],['lancetR'+i,arc(cx,cy,74,126,a+15,a+29,4),pick([P.sky,P.indigo,P.sage],i)]));
 ring(12,(a,i)=>s.push(['pointed'+i,petal(cx,cy,76,124,a+15,13),pick([P.berry,P.clay],i)]));
 ring(12,(a,i)=>s.push(['roundel'+i,oval(...polar(cx,cy,104,a+15),10.5),P.butter]));
 ring(12,(a,i)=>s.push(['roundelDot'+i,oval(...polar(cx,cy,104,a+15),4.8),P.berry]));
 ring(12,(a,i)=>s.push(['tip'+i,oval(...polar(cx,cy,119,a),7.4),pick([P.butter,P.apricot],i)]));
 s.push(['leadB',oval(cx,cy,74),P.charcoal]);
 ring(24,(a,i)=>s.push(['glassB'+i,arc(cx,cy,59,70,a+1.5,a+13.5,3),pick([P.lilac,P.blush],i)]));
 ring(8,(a,i)=>s.push(['roseOuter'+i,petal(cx,cy,12,57,a+22.5,27),pick([P.forest,P.sage],i)]));
 ring(8,(a,i)=>s.push(['rose'+i,petal(cx,cy,10,52,a,28),pick([P.berry,P.blush],i)]));
 ring(8,(a,i)=>s.push(['roseVein'+i,petal(cx,cy,24,44,a,10),P.apricot]));
 s.push(['roseHub',oval(cx,cy,25),P.butter]);
 ring(8,(a,i)=>s.push(['roseStar'+i,petal(cx,cy,4,25,a+22.5,24),pick([P.clay,P.indigo],i)]));
 s.push(['roseCore',oval(cx,cy,7),P.ivory]);
 add('rosewindow','玫瑰花窗','Rose window',s,[],'detailed');
}

{ // 繁花獅王
 const cx=180,cy=202,s=[];
 [[46,46],[314,46],[42,362],[318,362]].forEach(([x,y],k)=>{ring(8,(a,i)=>s.push(['wild'+k+'-'+i,petal(x,y,3,23,a+k*11,25),pick([P.blush,P.lilac],i+k)]));s.push(['wildCore'+k,oval(x,y,6.5),P.butter])});
 const mane=(name,count,inner,outer,half,turn,colors,vein,skip=[],noVein=[])=>{ring(count,(a,i)=>{if(!skip.includes(i))s.push([name+i,petal(cx,cy,inner,outer,a+turn,half),pick(colors,i)])});if(vein)ring(count,(a,i)=>{if(!skip.includes(i)&&!noVein.includes(i))s.push([name+'Vein'+i,petal(cx,cy,outer-34,outer-10,a+turn,half*.42),vein])})};
 mane('maneA',28,100,157,10.5,0,[P.clay,P.berry],P.apricot);
 mane('maneB',28,86,134,10.5,6.4,[P.apricot,P.butter],P.ivory);
 mane('maneC',22,70,111,13,0,[P.clay,P.apricot],P.butter,[],[14,19]);
 mane('maneD',22,54,90,13,8.2,[P.butter,P.ivory],null,[13,14,18,19]);
 s.push(['earL',oval(133,148,22),P.apricot],['earInL',oval(133,148,12.5),P.blush],['earR',oval(227,148,22),P.apricot],['earInR',oval(227,148,12.5),P.blush]);
 s.push(['face','M180 138 C224 138 246 168 242 206 C238 246 210 274 180 276 C150 274 122 246 118 206 C114 168 136 138 180 138Z',P.butter]);
 s.push(['crown',petal(180,196,16,54,270,17),P.berry],['crownGem',oval(180,157,5,9),P.sky]);
 [[-1,'L'],[1,'R']].forEach(([m,side])=>{const X=v=>180+m*v;
  s.push(['brow'+side,'M'+xy([X(8),178])+' C'+xy([X(18),156])+' '+xy([X(46),158])+' '+xy([X(56),178])+' C'+xy([X(40),170])+' '+xy([X(22),170])+' '+xy([X(8),178])+'Z',P.clay],
   ['eyeShade'+side,oval(X(28),192,21,13,m*-10),P.ivory],['iris'+side,oval(X(27),192,10.5),P.forest],['pupil'+side,oval(X(27),192,4.2,6.5),P.charcoal],
   ['cheekA'+side,petal(X(31),210,2,31,m>0?-4:184,22),P.apricot],['cheekB'+side,petal(X(38),228,2,27,m>0?36:144,24),P.clay]);});
 s.push(['bridge','M169 186 L191 186 L196 222 L164 222Z',P.apricot],
  ['muzzleL',oval(164,240,21,17),P.ivory],['muzzleR',oval(196,240,21,17),P.ivory],
  ['nose','M162 218 C170 212 190 212 198 218 C196 232 188 238 180 240 C172 238 164 232 162 218Z',P.berry],
  ['chin','M164 255 C170 252 190 252 196 255 C194 270 187 275 180 275 C173 275 166 270 164 255Z',P.ivory]);
 add('lion','繁花獅王','Blooming lion',s,[
  [line([180,239],[180,253]),3.6],[curve([180,252],[170,258],[162,250])],[curve([180,252],[190,258],[198,250])],
  [oval(157,238,1.6),3],[oval(166,244,1.6),3],[oval(194,244,1.6),3],[oval(203,238,1.6),3],
  [curve([146,242],[120,238],[102,246]),2.8],[curve([148,250],[124,254],[108,266]),2.8],[curve([214,242],[240,238],[258,246]),2.8],[curve([212,250],[236,254],[252,266]),2.8]],'detailed');
}

{ // 羽紋貓頭鷹
 const s=[['moon',oval(284,72,40),P.butter],['moonHole',oval(300,60,30),P.paper]];
 [[56,58,12],[104,34,8],[40,126,8],[318,150,10],[252,32,11]].forEach(([x,y,r],i)=>s.push(['star'+i,poly(ring(8,(a,j)=>polar(x,y,j%2?r*.42:r,a-90))),P.indigo]));
 s.push(['branch','M24 326 C100 312 196 338 336 306 L336 330 C230 362 110 340 24 352Z',P.clay]);
 [[52,314,-35],[78,366,40],[294,296,-55],[318,346,28],[258,356,62],[110,370,18]].forEach(([x,y,t],i)=>s.push(['leaf'+i,oval(x,y,22,11,t),P.forest],['leafVein'+i,oval(x,y,13,4.4,t),P.sage]));
 s.push(['tail','M140 292 L220 292 L232 376 L180 362 L128 376Z',P.charcoal]);
 for(let i=0;i<5;i++)s.push(['tailFeather'+i,petal(180,288,36,82,66+i*12,6),pick([P.clay,P.apricot],i)]);
 s.push(['tuftL','M112 128 L96 58 L164 98Z',P.clay],['tuftInL','M118 112 L108 76 L144 98Z',P.apricot],['tuftR','M248 128 L264 58 L196 98Z',P.clay],['tuftInR','M242 112 L252 76 L216 98Z',P.apricot]);
 s.push(['body','M180 84 C246 84 272 138 266 196 C284 250 252 316 180 320 C108 316 76 250 94 196 C88 138 114 84 180 84Z',P.apricot]);
 // 肚子的鱗羽：一排壓一排，越下面越後畫。
 [[4,206],[5,222],[6,238],[5,254],[6,270],[5,286],[4,300]].forEach(([count,y],row)=>{for(let i=0;i<count;i++)s.push(['belly'+row+'-'+i,scale(180+(i-(count-1)/2)*19,y,18.5,19),pick([P.ivory,P.butter,P.apricot],i+row)])});
 [[-1,'L'],[1,'R']].forEach(([m,side])=>{const X=v=>180+m*v;
  s.push(['wing'+side,'M'+xy([X(66),170])+' C'+xy([X(112),196])+' '+xy([X(118),272])+' '+xy([X(84),330])+' C'+xy([X(52),300])+' '+xy([X(46),224])+' '+xy([X(66),170])+'Z',P.charcoal]);
  [[3,198,P.clay],[3,220,P.indigo],[3,243,P.sky],[2,267,P.clay],[2,290,P.indigo]].forEach(([count,y,color],row)=>{for(let i=0;i<count;i++)s.push(['wing'+side+row+'-'+i,scale(X(79+(i-(count-1)/2)*16.5),y,15.5,25),i%2?P.lilac:color])});});
 [[-1,'L'],[1,'R']].forEach(([m,side])=>{const x=180+m*40,y=148;
  s.push(['disc'+side,oval(x,y,45),P.clay]);
  ring(12,(a,i)=>s.push(['lash'+side+i,petal(x,y,18,45,a,17),pick([P.ivory,P.butter],i)]));
  s.push(['eyeRing'+side,oval(x,y,23),P.charcoal],['eyeGold'+side,oval(x,y,18),P.butter],['eyeDark'+side,oval(x,y,10.5),P.indigo],['glint'+side,oval(x+4,y-5,4.2),P.ivory])});
 s.push(['forehead',petal(180,134,2,44,270,17),P.berry],['beak','M168 166 C172 160 188 160 192 166 L180 200Z',P.butter]);
 for(let k=0;k<2;k++)for(let i=0;i<3;i++)s.push(['toe'+k+'-'+i,oval(145+k*52+i*9.5,322,4.8,12),P.butter]);
 add('owl','羽紋貓頭鷹','Feathered owl',s,[],'detailed');
}

{ // 花紋海龜
 const s=[['sea',rect(24,24,312,352),P.sky]];
 // 海草與珊瑚
 [[44,0],[316,1]].forEach(([x,k])=>{for(let i=0;i<8;i++){const y=356-i*22,d=(i%2?1:-1);s.push(['weed'+k+'-'+i,oval(x+d*8,y,7,15,d*34),i%2?P.forest:P.sage])}});
 s.push(['sand','M24 358 C90 346 150 370 210 358 C260 348 300 366 336 356 L336 376 L24 376Z',P.butter]);
 [[100,375,P.berry],[180,375,P.clay],[260,375,P.berry]].forEach(([x,y,color],k)=>{for(let i=0;i<5;i++)s.push(['shellFan'+k+'-'+i,petal(x,y,3,30,206+i*32,17),i%2?color:P.blush])});
 [[66,68,12],[92,44,7],[292,92,14],[270,60,8],[306,42,6],[54,102,6],[312,300,9],[52,296,8]].forEach(([x,y,r],i)=>s.push(['bubble'+i,oval(x,y,r),P.ivory]));
 // 四片鰭
 const flipper=(name,d,spots)=>{s.push([name,d,P.sage]);spots.forEach(([x,y,rx,ry,t],i)=>s.push([name+'Spot'+i,oval(x,y,rx,ry,t),pick([P.forest,P.ivory],i)]))};
 flipper('finFL','M128 150 C92 112 52 108 34 134 C56 136 66 150 74 164 C90 188 112 196 134 194Z',[[56,130,10,6,12],[80,136,10,8,30],[84,160,9,7,40],[106,154,11,9,35],[108,180,10,8,20]]);
 flipper('finFR','M232 150 C268 112 308 108 326 134 C304 136 294 150 286 164 C270 188 248 196 226 194Z',[[304,130,10,6,-12],[280,136,10,8,-30],[276,160,9,7,-40],[254,154,11,9,-35],[252,180,10,8,-20]]);
 flipper('finBL','M132 280 C104 288 82 314 78 344 C104 344 128 330 150 306Z',[[96,330,7,9,40],[110,311,9,10,40],[130,303,8,8,40]]);
 flipper('finBR','M228 280 C256 288 278 314 282 344 C256 344 232 330 210 306Z',[[264,330,7,9,-40],[250,311,9,10,-40],[230,303,8,8,-40]]);
 s.push(['headT','M180 52 C206 52 216 80 212 100 C208 124 196 132 180 132 C164 132 152 124 148 100 C144 80 154 52 180 52Z',P.sage],
  ['headMark',poly([[180,58],[192,76],[180,96],[168,76]]),P.forest],['headDot',oval(180,76,4.6),P.butter],['headLow',oval(180,112,10,9),P.forest],
  ['eyeL',oval(160,92,8),P.ivory],['eyeR',oval(200,92,8),P.ivory],['stern','M168 306 L192 306 L180 332Z',P.sage]);
 const cx=180,cy=222;
 const on=(rx,ry,a)=>[cx+rx*Math.cos(a*Math.PI/180),cy+ry*Math.sin(a*Math.PI/180)];
 for(let i=0;i<26;i++){const a=i*360/26,b=a+360/26,m=(a+b)/2;s.push(['margin'+i,poly([on(83,97,a),on(83,97,m),on(83,97,b),on(68,82,b),on(68,82,m),on(68,82,a)]),pick([P.butter,P.apricot],i)])}
 s.push(['shell',oval(cx,cy,68,82),P.forest]);
 const hex=(x,y,rx,ry)=>poly(ring(6,a=>[x+rx*Math.cos(a*Math.PI/180),y+ry*Math.sin(a*Math.PI/180)]));
 const plate=(name,x,y,rx,ry,outer,mid,petals)=>{s.push([name,hex(x,y,rx,ry),outer],[name+'In',hex(x,y,rx*.7,ry*.7),mid]);if(petals){ring(6,(a,i)=>s.push([name+'P'+i,petal(x,y,2,Math.min(rx,ry)*.66,a+30,26),petals]));s.push([name+'C',oval(x,y,4.6),P.ivory])}else s.push([name+'C',oval(x,y,Math.min(rx,ry)*.27),P.ivory])};
 [-1,1].forEach((m,k)=>{[[180,40],[222,48],[264,40]].forEach(([y,dx],i)=>plate('side'+k+i,cx+m*dx,y,18,20,pick([P.indigo,P.sage],i),pick([P.sky,P.butter],i),false))});
 [[163,P.berry],[203,P.clay],[243,P.berry],[281,P.clay]].forEach(([y,color],i)=>plate('spine'+i,cx,y,i===3?19:23,i===3?17:20,color,i%2?P.butter:P.apricot,false));
 add('turtle','花紋海龜','Patterned sea turtle',s,[
  [oval(160,92,2.4),4],[oval(200,92,2.4),4],[curve([170,122],[180,128],[190,122]),2.8],
  [curve([44,176],[62,164],[80,176]),2.8],[curve([282,236],[300,224],[318,236]),2.8],[curve([46,238],[64,226],[82,238]),2.8],[curve([226,60],[242,48],[258,60]),2.8],[curve([104,94],[118,84],[132,94]),2.8]],'detailed');
}

{ // 花磚拼盤：3×3 花磚，三種花樣交錯，上下加三角邊條。
 const s=[];
 for(let i=0;i<20;i++){const x=30+i*15;s.push(['toothTop'+i,poly([[x,26],[x+15,26],[x+7.5,46]]),pick([P.berry,P.indigo,P.forest],i)],['toothLow'+i,poly([[x,374],[x+15,374],[x+7.5,354]]),pick([P.forest,P.indigo,P.berry],i)])}
 for(let row=0;row<3;row++)for(let col=0;col<3;col++){
  const x=30+col*100,y=50+row*100,mx=x+50,my=y+50,k='t'+row+col,kind=(row+col*2)%3;
  s.push([k,rect(x+1,y+1,98,98),pick([P.ivory,P.sky,P.apricot],kind)]);
  if(kind===0){ // 八瓣花
   [[x+4,y+4,1,1],[x+96,y+4,-1,1],[x+4,y+96,1,-1],[x+96,y+96,-1,-1]].forEach(([a,b,u,v],i)=>s.push([k+'q'+i,'M'+xy([a,b])+' L'+xy([a+u*28,b])+' Q'+xy([a+u*26,b+v*26])+' '+xy([a,b+v*28])+'Z',P.indigo],[k+'qd'+i,oval(a+u*9.5,b+v*9.5,6),P.butter]));
   ring(8,(a,i)=>s.push([k+'p'+i,petal(mx,my,6,47,a,28),pick([P.berry,P.clay],i)]));
   ring(8,(a,i)=>s.push([k+'v'+i,oval(...polar(mx,my,28,a),7.4,4.4,a),P.blush]));
   s.push([k+'h',oval(mx,my,14),P.butter],[k+'c',oval(mx,my,6),P.forest]);
  }else if(kind===1){ // 菱形星
   s.push([k+'dia',poly([[mx,y+4],[x+96,my],[mx,y+96],[x+4,my]]),P.forest],[k+'diaIn',poly([[mx,y+14],[x+86,my],[mx,y+86],[x+14,my]]),P.ivory]);
   [[x+17,y+17],[x+83,y+17],[x+17,y+83],[x+83,y+83]].forEach(([a,b],i)=>s.push([k+'o'+i,oval(a,b,11),P.clay],[k+'od'+i,oval(a,b,5),P.butter]));
   ring(4,(a,i)=>s.push([k+'big'+i,petal(mx,my,4,35,a,28),P.indigo]));
   ring(4,(a,i)=>s.push([k+'small'+i,petal(mx,my,6,29,a+45,23),P.apricot]));
   s.push([k+'h',oval(mx,my,10.5),P.berry],[k+'c',oval(mx,my,4.4),P.butter]);
  }else{ // 圓環輪
   ring(4,(a,i)=>s.push([k+'ear'+i,petal(mx,my,38,64,a+45,16),P.forest]));
   ring(12,(a,i)=>s.push([k+'w'+i,arc(mx,my,28,46,a,a+30,4),pick([P.sage,P.butter,P.lilac],i)]));
   s.push([k+'disc',oval(mx,my,29),P.ivory]);
   ring(6,(a,i)=>s.push([k+'f'+i,oval(...polar(mx,my,17,a),10,7.4,a),pick([P.blush,P.sky],i)]));
   s.push([k+'h',oval(mx,my,10),P.clay],[k+'c',oval(mx,my,4.4),P.ivory]);
  }
 }
 add('tiles','花磚拼盤','Patchwork tiles',s,[],'detailed');
}
})(typeof window==='undefined'?globalThis:window);
