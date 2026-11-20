const bossRules = (() => {
  const rulesVersion=2,chaseGaps=[150,95,42,0];
  function create(random=Math.random,version=rulesVersion) {
    const legacy=version===1;
    const G={}, W=400,H=560,reduceMotion=false;
    const rnd=(a,b)=>a+random()*(b-a),cl=(x,a,b)=>Math.max(a,Math.min(b,x));
    const T=()=>()=>'',die=reason=>{dead=reason};
    let dead=false,shake=0;
const GY=440,PXL=170;
let dist,v,gap,fat,py,vy,on,slide,sid,obs,nextAt,stun,fx,misses;
G.reset=()=>{dist=0;v=300;gap=150;fat=0;py=GY;vy=0;on=true;slide=false;obs=[];nextAt=500;stun=0;fx=[];misses=0};
G.score=()=>Math.floor(dist/60);
G.extra=()=>T('fat')(fat);
G.down=p=>{if(Math.hypot(p.x-340,p.y-505)<50){slide=true;sid=p.id}else if(on){vy=-640;on=false}};
G.up=p=>{if(p.id===sid)slide=false};
function spawn(){
const t=['t','b','h'][(random()*3)|0],x=W+40;
obs.push({t,x});
if(random()<.5)obs.push(t==='h'?{t:'k',x:x+40}:{t:'d',x:x+8});
nextAt=dist+rnd(330,470)-Math.min(120,dist*.01)}
G.update=dt=>{
v=Math.min(470,300+dist*.012);dist+=v*dt;
gap=Math.min(220,gap-(legacy?(5+fat*4+(v-300)*.03)*dt:0));
if(stun>0)stun-=dt;
if(dist>=nextAt)spawn();
vy+=2300*dt;py+=vy*dt;if(py>=GY){py=GY;vy=0;on=true}else on=false;
const ph=slide&&on?26:54,top=py-ph;
for(const o of obs){o.x-=v*dt;
if(o.t==='d'||o.t==='k'){const iy=o.t==='d'?GY-100:GY-18;
if(!o.g&&Math.hypot(o.x-PXL,iy-(py-ph/2))<28){o.g=1;if(o.t==='d'){fat++;gap+=45;fx.push({s:'+',x:PXL,y:py-80,t:0})}else gap+=80}}
else if(stun<=0){
const r=o.t==='t'?[o.x,GY-38,o.x+34,GY]:o.t==='b'?[o.x,GY-52,o.x+26,GY]:[o.x,GY-120,o.x+90,GY-40];
if(PXL+10>r[0]&&PXL-10<r[2]&&py>r[1]&&top<r[3]){if(legacy)gap-=60;else gap=chaseGaps[++misses];stun=.9;shake=reduceMotion?0:.25}}}
obs=obs.filter(o=>o.x>-120&&!o.g);
fx.forEach(f=>f.t+=dt);fx=fx.filter(f=>f.t<.8);
if(legacy?gap<=0:misses===3){gap=legacy?gap:0;die('caught')}};

    G.reset();
    return {input(code){
      if(dead||!Number.isInteger(code)||code<0||code>4)return false;
      if(code===4){slide=false;return true;}
      if(code===3){G.up?.({id:1});return true;}
      const points=[[40,300],[200,300],[340,505]];
      G.down({x:points[code][0],y:points[code][1],id:1});
      return true;
    },advance:dt=>G.update(dt),score:()=>G.score(),
      get dead(){return dead},snapshot:()=>({dist,v,gap,fat,py,vy,on,slide,sid,obs,nextAt,stun,fx,shake,misses})};
  }
  return {create,rulesVersion,inputCount:5,input:(state,code)=>state.input(code),advance:(state,dt)=>state.advance(dt),score:state=>state.score()};
})();
if(typeof module!=='undefined')module.exports=bossRules;
