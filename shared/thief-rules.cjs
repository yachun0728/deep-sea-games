const thiefRules = (() => {
  const rulesVersion=3;
  // Older versions are kept so leaderboard rounds started on an older client still replay identically.
  const TUNING={
    1:{v0:280,vMax:420,vRamp:.02,drain:4,drainFruit:5,drainDist:.002,drainCap:Infinity,basket:50,slipper:80,bEarly:.45,bMid:.75,bLate:.75,bMidAt:400,bLateAt:400,slipMin:1.8,slipA:3,slipB:5.5,slipRamp:.0005},
    2:{v0:260,vMax:430,vRamp:.006,drain:2,drainFruit:2,drainDist:.0002,drainCap:4,basket:30,slipper:45,bEarly:.3,bMid:.5,bLate:.65,bMidAt:2500,bLateAt:9000,slipMin:1.6,slipA:3.5,slipB:6,slipRamp:.0001}
  };
  // Version 3 = version 2 plus Zoomies (a fruit streak), golden fruit and the shopkeeper's fury volleys.
  TUNING[3]={...TUNING[2],v3:true,streak:10,zoomTime:5,zoomFruit:5,zoomPush:2,goldFirst:6000,goldGapA:16000,goldGapB:22000,goldScore:15,goldPush:10,rageFirst:9000,rageGapA:9000,rageGapB:13000,rageLead:1,rageGap:.75,rageWarn:.7,rageBonus:20};
  function create(random=Math.random,version=rulesVersion) {
    const K=TUNING[version]||TUNING[1];
    const G={}, W=400,H=560,reduceMotion=false;
    const rnd=(a,b)=>a+random()*(b-a),cl=(x,a,b)=>Math.max(a,Math.min(b,x));
    const T=()=>()=>'',die=reason=>{dead=reason};
    let dead=false,shake=0;
const LX=[105,200,295],CYT=430,fc=['#e63946','#ff9f1c','#7bd88f'];
let dist,v,L,fruits,gb,lane,cx,jt,stun,rows,slips,warn,nextRow,nextSlip,fx,stats,streak,zoom,extra,goldAt,rageAt,rage;
G.reset=()=>{dist=0;v=K.v0;L=0;fruits=0;gb=130;lane=1;cx=200;jt=0;stun=0;rows=[];slips=[];warn=[];nextRow=120;nextSlip=2.5;fx=[];streak=0;zoom=0;extra=0;goldAt=K.goldFirst||Infinity;rageAt=K.rageFirst||Infinity;rage=null;
// Mission counters only: nothing below reads them, so replays and scores are unchanged.
stats={apples:0,oranges:0,greens:0,fish:0,jumps:0,dodges:0,maxCarry:0,clean:0,bestClean:0,zooms:0,golds:0,rages:0}};
G.score=()=>Math.floor(dist/50)+fruits*5+extra;
G.extra=()=>T('fr')(fruits);
G.down=p=>{if(p.x<133)lane=Math.max(0,lane-1);else if(p.x>267)lane=Math.min(2,lane+1);else if(jt<=0)jt=.55};
function hurt(n){stats.clean=0;streak=0;if(rage)rage.hit=1;gb-=n;stun=.8;shake=reduceMotion?0:.25;L=Math.max(0,L-2);fx.push({s:'-'+n,x:cx,y:CYT-40,t:0})}
function spawnRow(){
const free=(random()*3)|0;
// The golden fruit replaces the free lane's item, so versions 1 and 2 draw exactly the same random numbers as before.
const gold=K.v3&&dist>=goldAt;if(gold)goldAt=dist+rnd(K.goldGapA,K.goldGapB);
for(let l=0;l<3;l++){
if(l===free&&gold)rows.push({t:'g',l,y:-30});
else if(l===free){const r=random();if(r<.65)rows.push({t:'f',l,y:-30,c:(random()*3)|0});else if(L>=3||r<.75)rows.push({t:'x',l,y:-30})}
else if(random()<(dist>K.bLateAt?K.bLate:dist>K.bMidAt?K.bMid:K.bEarly))rows.push({t:'b',l,y:-30,c:(random()*3)|0})}}
G.update=dt=>{
v=Math.min(K.vMax,K.v0+dist*K.vRamp)*(zoom>0?1.08:1-.07*L);dist+=v*dt;
// Zoomies: no weight, slightly faster, and the gap to the shopkeeper grows instead of shrinking.
if(zoom>0){zoom-=dt;gb=Math.min(170,gb+K.zoomPush*dt)}
else gb=Math.min(170,gb-(K.drain+L*K.drainFruit+Math.min(K.drainCap,dist*K.drainDist))*dt);
cx+=(LX[lane]-cx)*Math.min(1,dt*14);
if(jt>0)jt-=dt;if(stun>0)stun-=dt;
stats.clean+=dt;if(stats.clean>stats.bestClean)stats.bestClean=stats.clean;
if(dist>=nextRow){nextRow=dist+rnd(190,250);spawnRow()}
// Fury: three slippers aimed at wherever the cat is, 0.75 s apart. Getting through untouched is worth a bonus.
if(K.v3){
 if(!rage&&dist>=rageAt){rage={left:3,t:K.rageLead,hit:0};nextSlip=Math.max(nextSlip,K.rageLead+3*K.rageGap+1.5)}
 if(rage){rage.t-=dt;
  if(rage.left>0&&rage.t<=0){warn.push({l:lane,t:K.rageWarn,aim:true,rage:1});rage.left--;rage.t=K.rageGap}
  if(rage.left===0&&!warn.some(w=>w.rage)&&!slips.some(s=>s.rage&&s.y>CYT-22)){if(!rage.hit){extra+=K.rageBonus;stats.rages++}rage=null;rageAt=dist+rnd(K.rageGapA,K.rageGapB)}}}
nextSlip-=dt;if(nextSlip<=0){nextSlip=Math.max(K.slipMin,rnd(K.slipA,K.slipB)-dist*K.slipRamp);{const l=(random()*3)|0;warn.push({l,t:.8,aim:l===lane})}}
warn.forEach(w=>{w.t-=dt;if(w.t<=0){w.d=1;slips.push({l:w.l,y:H+30,aim:w.aim,rage:w.rage})}});warn=warn.filter(w=>!w.d);
slips.forEach(s=>{s.y-=760*dt;if(!s.h&&stun<=0&&Math.abs(s.y-CYT)<22&&Math.abs(LX[s.l]-cx)<28){s.h=1;hurt(K.slipper)}
if(!s.h&&!s.p&&s.y<CYT-22){s.p=1;if(s.aim&&Math.abs(LX[s.l]-cx)>=28)stats.dodges++}});slips=slips.filter(s=>s.y>-40);
const air=jt>0;
for(const r of rows){r.y+=v*dt;
const near=Math.abs(r.y-CYT)<26&&Math.abs(LX[r.l]-cx)<30;
if(r.t==='b'){if(!air&&stun<=0&&!r.h&&near){r.h=1;hurt(K.basket)}else if(air&&near&&!r.h&&!r.j){r.j=1;stats.jumps++}}
else if(!r.g&&!air&&near){r.g=1;
 if(r.t==='f'){if(L<5||zoom>0){if(L<5)L++;fruits++;stats[['apples','oranges','greens'][r.c%3]]++;if(L>stats.maxCarry)stats.maxCarry=L;
   if(K.v3){if(zoom>0)extra+=K.zoomFruit;else if(++streak>=K.streak){streak=0;zoom=K.zoomTime;stats.zooms++}}}}
 else if(r.t==='g'){extra+=K.goldScore;gb=Math.min(170,gb+K.goldPush);streak=0;zoom=K.zoomTime;stats.golds++}
 else{L=0;gb+=30;stats.fish++}}}
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
      get dead(){return dead},snapshot:()=>({dist,v,L,fruits,gb,lane,cx,jt,stun,rows,slips,warn,nextRow,nextSlip,fx,shake,stats:{...stats},streak,zoom,extra,rage:rage?{left:rage.left,hit:rage.hit}:null})};
  }
  return {create,rulesVersion,inputCount:5,input:(state,code)=>state.input(code),advance:(state,dt)=>state.advance(dt),score:state=>state.score()};
})();
if(typeof module!=='undefined')module.exports=thiefRules;
