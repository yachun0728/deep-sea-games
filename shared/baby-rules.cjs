const babyRules = (() => {
  function create(random=Math.random) {
    const G={}, W=400,H=560,reduceMotion=false;
    const rnd=(a,b)=>a+random()*(b-a),cl=(x,a,b)=>Math.max(a,Math.min(b,x));
    const T=()=>()=>'',die=reason=>{dead=reason};
    let dead=false,shake=0;
const GY=440,PXL=170;
let dist,v,gap,py,vy,on,crawl,cid,obs,nextAt,stun,fx,charge,mstun,bots,rings;
G.reset=()=>{dist=0;v=260;gap=150;py=GY;vy=0;on=true;crawl=false;obs=[];nextAt=450;stun=0;fx=[];charge=0;mstun=0;bots=0;rings=[]};
G.score=()=>Math.floor(dist/60);
G.extra=()=>T('bt')(bots);
function wail(){if(charge<=0||mstun>0)return;charge--;mstun=2.2;gap=Math.min(220,gap+50);shake=reduceMotion?0:.3;rings.push({t:0})}
G.down=p=>{if(Math.hypot(p.x-340,p.y-505)<50)wail();else if(p.x<200){if(on){vy=-600;on=false}}else{crawl=true;cid=p.id}};
G.up=p=>{if(p.id===cid)crawl=false};
function spawn(){
const t=['l','c','s'][(random()*3)|0];
obs.push({t,x:W+40});
if(random()<.45)obs.push({t:'b',x:W+40+(t==='s'?40:6),hi:t!=='s'});
nextAt=dist+rnd(320,460)-Math.min(110,dist*.01)}
G.update=dt=>{
v=Math.min(430,260+dist*.01);dist+=v*dt;
if(mstun>0){mstun-=dt;gap=Math.min(220,gap+v*.5*dt)}else gap-=(6+dist*.003)*dt;
if(stun>0)stun-=dt;
rings.forEach(r=>r.t+=dt);rings=rings.filter(r=>r.t<.7);
if(dist>=nextAt)spawn();
vy+=2300*dt;py+=vy*dt;if(py>=GY){py=GY;vy=0;on=true}else on=false;
const cr=crawl&&on,top=py-(cr?24:46);
for(const o of obs){
o.x-=(o.t==='c'?v+120:v)*dt;
if(o.t==='b'){const iy=o.hi?GY-70:GY-16;if(!o.g&&Math.hypot(o.x-PXL,iy-(py-(cr?12:23)))<28){o.g=1;bots++;charge=Math.min(3,charge+1);fx.push({s:'+',x:PXL,y:py-80,t:0})}}
else if(stun<=0){
const r=o.t==='l'?[o.x,GY-30,o.x+30,GY]:o.t==='c'?[o.x,GY-28,o.x+42,GY]:[o.x,GY-100,o.x+80,GY-34];
if(PXL+10>r[0]&&PXL-10<r[2]&&py>r[1]&&top<r[3]){gap-=60;stun=.9;shake=reduceMotion?0:.25}}}
obs=obs.filter(o=>o.x>-120&&!o.g);
fx.forEach(f=>f.t+=dt);fx=fx.filter(f=>f.t<.8);
if(gap<=0)die('caught')};

    G.reset();
    return {input(code){
      if(dead||!Number.isInteger(code)||code<0||code>4)return false;
      if(code===4){crawl=false;return true;}
      if(code===3){G.up?.({id:1});return true;}
      const points=[[40,300],[240,300],[340,505]];
      G.down({x:points[code][0],y:points[code][1],id:1});
      return true;
    },advance:dt=>G.update(dt),score:()=>G.score(),
      get dead(){return dead},snapshot:()=>({dist,v,gap,py,vy,on,crawl,cid,obs,nextAt,stun,fx,charge,mstun,bots,rings,shake})};
  }
  return {create,inputCount:5,input:(state,code)=>state.input(code),advance:(state,dt)=>state.advance(dt),score:state=>state.score()};
})();
if(typeof module!=='undefined')module.exports=babyRules;
