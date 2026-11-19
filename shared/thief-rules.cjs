const thiefRules = (() => {
  function create(random=Math.random) {
    const G={}, W=400,H=560,reduceMotion=false;
    const rnd=(a,b)=>a+random()*(b-a),cl=(x,a,b)=>Math.max(a,Math.min(b,x));
    const T=()=>()=>'',die=reason=>{dead=reason};
    let dead=false,shake=0;
const LX=[105,200,295],CYT=430,fc=['#e63946','#ff9f1c','#7bd88f'];
let dist,v,L,fruits,gb,lane,cx,jt,stun,rows,slips,warn,nextRow,nextSlip,fx;
G.reset=()=>{dist=0;v=280;L=0;fruits=0;gb=130;lane=1;cx=200;jt=0;stun=0;rows=[];slips=[];warn=[];nextRow=120;nextSlip=2.5;fx=[]};
G.score=()=>Math.floor(dist/50)+fruits*5;
G.extra=()=>T('fr')(fruits);
G.down=p=>{if(p.x<133)lane=Math.max(0,lane-1);else if(p.x>267)lane=Math.min(2,lane+1);else if(jt<=0)jt=.55};
function hurt(n){gb-=n;stun=.8;shake=reduceMotion?0:.25;L=Math.max(0,L-2);fx.push({s:'-'+n,x:cx,y:CYT-40,t:0})}
function spawnRow(){
const free=(random()*3)|0;
for(let l=0;l<3;l++){
if(l===free){const r=random();if(r<.65)rows.push({t:'f',l,y:-30,c:(random()*3)|0});else if(L>=3||r<.75)rows.push({t:'x',l,y:-30})}
else if(random()<(dist>400?.75:.45))rows.push({t:'b',l,y:-30,c:(random()*3)|0})}}
G.update=dt=>{
v=Math.min(420,280+dist*.02)*(1-.07*L);dist+=v*dt;
gb=Math.min(170,gb-(4+L*5+dist*.002)*dt);
cx+=(LX[lane]-cx)*Math.min(1,dt*14);
if(jt>0)jt-=dt;if(stun>0)stun-=dt;
if(dist>=nextRow){nextRow=dist+rnd(190,250);spawnRow()}
nextSlip-=dt;if(nextSlip<=0){nextSlip=Math.max(1.8,rnd(3,5.5)-dist*.0005);warn.push({l:(random()*3)|0,t:.8})}
warn.forEach(w=>{w.t-=dt;if(w.t<=0){w.d=1;slips.push({l:w.l,y:H+30})}});warn=warn.filter(w=>!w.d);
slips.forEach(s=>{s.y-=760*dt;if(!s.h&&stun<=0&&Math.abs(s.y-CYT)<22&&Math.abs(LX[s.l]-cx)<28){s.h=1;hurt(80)}});slips=slips.filter(s=>s.y>-40);
const air=jt>0;
for(const r of rows){r.y+=v*dt;
const near=Math.abs(r.y-CYT)<26&&Math.abs(LX[r.l]-cx)<30;
if(r.t==='b'){if(!air&&stun<=0&&!r.h&&near){r.h=1;hurt(50)}}
else if(!r.g&&!air&&near){r.g=1;if(r.t==='f'){if(L<5){L++;fruits++}}else{L=0;gb+=30}}}
rows=rows.filter(r=>r.y<H+40&&!r.g);
fx.forEach(f=>f.t+=dt);fx=fx.filter(f=>f.t<.8);
if(gb<=0)die('caught')};

    G.reset();
    return {input(code){
      if(dead||!Number.isInteger(code)||code<0||code>4)return false;
      if(code===4){return true;}
      if(code===3){G.up?.({id:1});return true;}
      const points=[[40,300],[200,300],[340,505]];
      G.down({x:points[code][0],y:points[code][1],id:1});
      return true;
    },advance:dt=>G.update(dt),score:()=>G.score(),
      get dead(){return dead},snapshot:()=>({dist,v,L,fruits,gb,lane,cx,jt,stun,rows,slips,warn,nextRow,nextSlip,fx,shake})};
  }
  return {create,inputCount:5,input:(state,code)=>state.input(code),advance:(state,dt)=>state.advance(dt),score:state=>state.score()};
})();
if(typeof module!=='undefined')module.exports=thiefRules;
