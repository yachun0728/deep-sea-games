const riderRules = (() => {
  function create(random=Math.random) {
    const G={}, W=400,H=560,reduceMotion=false;
    const rnd=(a,b)=>a+random()*(b-a),cl=(x,a,b)=>Math.max(a,Math.min(b,x));
    const T=()=>()=>'',die=reason=>{dead=reason};
    let dead=false,shake=0;
const GY=440,PXL=130;
let dist,v,hot,py,vy,on,gas,hold,hid,hcool,obs,nextAt,nextHouse,stun,fx,deliv,boosting;
G.reset=()=>{dist=0;v=290;hot=100;py=GY;vy=0;on=true;gas=100;hold=false;hcool=0;obs=[];nextAt=450;nextHouse=800;stun=0;fx=[];deliv=0;boosting=false};
G.score=()=>Math.floor(dist/50)+deliv*20;
G.extra=()=>T('dl')(deliv);
function honk(){if(hcool>0)return;hcool=1;fx.push({s:T('bip'),x:PXL+40,y:py-110,t:0});obs.forEach(o=>{if(o.t==='dog'&&o.x>PXL&&o.x<PXL+280)o.fl=1})}
G.down=p=>{if(Math.hypot(p.x-340,p.y-505)<50)honk();else if(p.x<200){if(on){vy=-620;on=false}}else{hold=true;hid=p.id}};
G.up=p=>{if(p.id===hid)hold=false};
function hurt(n){hot-=n;stun=.8;shake=reduceMotion?0:.25;fx.push({s:'-'+n,x:PXL,y:py-100,t:0})}
G.update=dt=>{
v=Math.min(430,290+dist*.01);boosting=hold&&gas>4;gas=cl(gas+(boosting?-38:14)*dt,0,100);
const sp=v*(boosting?1.45:1);dist+=sp*dt;hot-=(3.2+dist*.0003)*dt;
if(hcool>0)hcool-=dt;if(stun>0)stun-=dt;
if(dist>=nextAt){obs.push(random()<.5?{t:'p',x:W+40}:{t:'dog',x:W+40,fl:0});nextAt=dist+rnd(320,460)}
if(dist>=nextHouse){obs.push({t:'h',x:W+120,tm:0,dn:0});nextHouse=dist+rnd(900,1200)}
vy+=2300*dt;py+=vy*dt;if(py>=GY){py=GY;vy=0;on=true}else on=false;
for(const o of obs){
if(o.t==='h'){o.x-=sp*dt;
if(Math.abs(PXL-o.x)<100&&!boosting&&!o.dn){o.tm+=dt;if(o.tm>=.45){o.dn=1;hot=Math.min(100,hot+35);deliv++;fx.push({s:'+20',x:PXL,y:py-110,t:0})}}
if(o.x<PXL-110&&!o.dn&&!o.ms){o.ms=1;hot-=15;fx.push({s:T('bom'),x:PXL,y:py-110,t:0})}}
else if(o.t==='dog'){if(o.fl)o.x+=200*dt;else o.x-=(sp+110)*dt;
if(stun<=0&&!o.h&&!o.fl&&Math.abs(o.x-PXL)<30&&py>GY-34){o.h=1;hurt(20)}}
else{o.x-=sp*dt;if(stun<=0&&!o.h&&py>=GY-4&&Math.abs(o.x+28-PXL)<30){o.h=1;hurt(15)}}}
obs=obs.filter(o=>o.x>-160&&o.x<W+520);
fx.forEach(f=>f.t+=dt);fx=fx.filter(f=>f.t<.8);
if(hot<=0)die('cold')};

    G.reset();
    return {input(code){
      if(dead||!Number.isInteger(code)||code<0||code>4)return false;
      if(code===4){hold=false;return true;}
      if(code===3){G.up?.({id:1});return true;}
      const points=[[40,300],[240,300],[340,505]];
      G.down({x:points[code][0],y:points[code][1],id:1});
      return true;
    },advance:dt=>G.update(dt),score:()=>G.score(),
      get dead(){return dead},snapshot:()=>({dist,v,hot,py,vy,on,gas,hold,hid,hcool,obs,nextAt,nextHouse,stun,fx,deliv,boosting,shake})};
  }
  return {create,inputCount:5,input:(state,code)=>state.input(code),advance:(state,dt)=>state.advance(dt),score:state=>state.score()};
})();
if(typeof module!=='undefined')module.exports=riderRules;
