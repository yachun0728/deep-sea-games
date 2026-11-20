const birdRules = (() => {
  const W=400,H=560,GY=440,BX=90;
  const CH=[40,88,150],CW=[26,34,44],WS=[.65,1.7];
  const cl=(x,a,b)=>Math.max(a,Math.min(b,x));
  function create(random=Math.random,event=()=>{}) {
    const rnd=(a,b)=>a+random()*(b-a);
    let by=GY,vy=0,on=true,buf=0,hold=false,jc=0,boost=0,lvl=0,obs=[],proj=[],dist=0,v=290,
      nextAt=450,cnt=0,lb=-1,boss=false,eggs=0,sq=0,pcd=0,warnT=0,dead=false;
    function input(action) {
      if(dead)return false;
      if(action===0){hold=true;jump();return true}
      if(action===1&&hold){hold=false;return true}
      if(action===2)return shoot();
      return false;
    }
    function jump(){
    if(on){vy=-600;on=false;jc=1;sq=-.25}
    else if(jc===1){vy=-560;jc=2;boost=.45;sq=-.2}
    else buf=.12}
    function shoot(){if(pcd>0)return false;pcd=.3;proj.push({x:BX+28,y:by-30});return true}
    function spawn(){
    const pool=['c0','w0'];if(cnt>=3)pool.push('c1');if(cnt>=6)pool.push('w1');if(cnt>=9)pool.push('c2');
    const t=pool[(random()*pool.length)|0],k=t[0],s=+t[1];
    if(k==='c')obs.push({k:'c',s,x:W+40,y:GY,h:CH[s]});
    else obs.push({k:'w',s,x:W+40,y:GY,sc:WS[s],dead:0,vy:0,a:0});
    cnt++;nextAt=dist+rnd(300,420)+(s>0?60:0)}
    function hitRect(x1,y1,x2,y2){const nx=cl(BX,x1,x2),ny=cl(by-22,y1,y2);return Math.hypot(BX-nx,by-22-ny)<16}
    function update(dt){
    sq*=.86;
    if(dead)return;
    if(warnT>0)warnT-=dt;if(pcd>0)pcd-=dt;
    lvl=Math.floor(dist/3000);v=Math.min(500,290+lvl*20);dist+=v*dt;
    const bossDue=cnt>0&&cnt%8===0&&lb!==cnt;
    if(!boss){
    if(bossDue){if(!obs.some(o=>!o.dead)){boss=true;lb=cnt;obs.push({k:'a',x:W+220,y:GY,sc:2,hp:3,dead:0,vy:0,a:0,hit:0});warnT=1.3;event('alpha')}}
    else if(dist>=nextAt)spawn()}
    if(buf>0)buf-=dt;
    const slow=hold&&jc===2&&boost>0&&vy<0;
    if(slow)boost-=dt;
    vy+=(slow?1300:2300)*dt;by+=vy*dt;
    if(by>=GY){by=GY;vy=0;jc=0;if(buf>0){buf=0;vy=-600;jc=1;sq=-.25;on=false}else{if(!on)sq=.25;on=true}}else on=false;
    for(const o of obs){
    if(o.dead){o.x+=140*dt;o.y+=o.vy*dt;o.vy+=1800*dt;o.a+=dt*8;continue}
    if(o.k==='c'){o.x-=v*dt;if(hitRect(o.x+3,GY-o.h+4,o.x+CW[o.s]-3,GY)){dead=true;return}}
    else if(o.k==='w'){o.x-=(v+110)*dt;if(hitRect(o.x-10*o.sc,o.y-54*o.sc,o.x+64*o.sc,o.y)){dead=true;return}}
    else{o.x-=(v+45)*dt;if(o.hit>0)o.hit-=dt;if(hitRect(o.x-20,o.y-400,o.x+128,o.y)){dead=true;return}}}
    for(const p of proj){p.x+=650*dt;
    for(const a of obs){if(a.k!=='a'||a.dead||p.dead)continue;
    if(p.x>=a.x-20&&p.x<=a.x+128&&p.y>a.y-120&&p.y<a.y){p.dead=1;a.hp--;a.x+=55;a.hit=.2;event('hit',a);
    if(a.hp<=0){a.dead=1;a.vy=-420;boss=false;nextAt=dist+380;eggs++;event('boss')}}}}
    proj=proj.filter(p=>!p.dead&&p.x<W+30);
    obs=obs.filter(o=>o.x>-220&&o.x<W+500&&o.y<H+200)}

    return {input,advance:update,get by(){return by},get on(){return on},
      get obs(){return obs},get proj(){return proj},get dist(){return dist},get level(){return lvl},get eggs(){return eggs},
      get sq(){return sq},get pcd(){return pcd},get warnT(){return warnT},get dead(){return dead}};
  }
  return {inputCount:3,create,input:(model,action)=>model.input(action),
    advance:(model,dt)=>model.advance(dt),score:model=>Math.floor(model.dist/60)};
})();
if (typeof module !== 'undefined') module.exports = birdRules;
