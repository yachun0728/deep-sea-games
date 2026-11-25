/* Berry Trail: deterministic 20x20 Snake. Used by browser and ranking Worker. */
const berryTrailRules = (() => {
  const N=20, inputCount=4, directions=[[0,-1],[1,0],[0,1],[-1,0]];
  function place(s,rng) {
    const free=[];
    for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(!s.snake.some(p=>p.x===x&&p.y===y))free.push({x,y});
    s.food=free.length?free[Math.floor(rng()*free.length)]:null;
  }
  function create(rng) {
    const s={snake:[{x:10,y:10},{x:9,y:10},{x:8,y:10}],food:null,dir:1,next:1,queued:false,score:0,dead:false,won:false,elapsed:0};
    place(s,rng);return s;
  }
  function input(s,code) {
    if(s.dead||!Number.isInteger(code)||code<0||code>=4||s.queued||code===s.dir||code===(s.dir+2)%4)return false;
    s.next=code;s.queued=true;return true;
  }
  function advance(s,dt,rng) {
    if(s.dead)return;
    s.elapsed+=dt*1000;
    if(s.elapsed+1e-7<Math.max(75,155-s.score*.32))return;
    s.elapsed=0;s.dir=s.next;s.queued=false;
    const d=directions[s.dir],head={x:s.snake[0].x+d[0],y:s.snake[0].y+d[1]},eat=s.food&&head.x===s.food.x&&head.y===s.food.y;
    if(head.x<0||head.y<0||head.x>=N||head.y>=N||s.snake.slice(0,eat?s.snake.length:-1).some(p=>p.x===head.x&&p.y===head.y)){s.dead=true;return;}
    s.snake.unshift(head);
    if(eat){s.score+=10;place(s,rng);if(!s.food){s.dead=true;s.won=true;}}
    else s.snake.pop();
  }
  return {create,input,advance,score:s=>s.score,inputCount,directions};
})();
if(typeof module!=='undefined')module.exports=berryTrailRules;
