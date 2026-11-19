const frontierRules=(()=>{
const model=typeof module!=='undefined'?require('../games/frontier/world.js'):{frontierWorld,frontierStep,frontierChoose,frontierUpgrade,frontierSell,frontierLeave,frontierUpgradeHut,frontierRecruit};
const {frontierWorld:createWorld,frontierStep:step,frontierChoose:choose,frontierUpgrade:upgrade,frontierSell:sell,frontierLeave:leave,frontierUpgradeHut:upgradeHut,frontierRecruit:recruit}=model;
const INPUTS=1100,STEP=.05,MAX_TICKS=400;
function create(seed){
 const world=createWorld(1);world.rankSeed=seed;
 return {world,completed:0,elapsed:0,x:0,y:0,dash:false,dead:false};
}
function input(s,code){
 if(!Number.isInteger(code)||code<0||code>=INPUTS||s.dead)return false;
 const w=s.world;
 if(code<882){const dir=Math.floor(code/2);s.x=(Math.floor(dir/21)-10)/10;s.y=(dir%21-10)/10;s.dash=!!(code%2);return true;}
 if(code<=884)return choose(w,code-882);
 if(code===885)return recruit(w);
 if(code===886){
  if(w.phase!=='clear'&&!leave(w))return false;
  s.completed=Math.max(s.completed,w.level);
  if(w.level===50){s.dead=true;return true;}
  const next=createWorld(w.level+1,w.tech,w.coins);next.rankSeed=w.rankSeed;s.world=next;
  s.x=s.y=0;s.dash=false;return true;
 }
 if(code<=889)return upgrade(w,['tool','blade','pack'][code-887]);
 if(code<=892)return upgradeHut(w,['house','guardhouse','barracks'][code-890]);
 const sale=code-893;if(sale>=200)return false;
 return !!sell(w,sale<100?'wood':'stone',sale%100+1);
}
function advance(s){
 step(s.world,{x:s.x,y:s.y,dash:s.dash},STEP);s.dash=false;s.elapsed++;
 if(s.world.phase==='dead')s.dead=true;
}
function accepts(action){
 if(!Array.isArray(action)||!Number.isInteger(action[0])||action[0]<0||action[0]>MAX_TICKS||action.length>1601)return false;
 let last=-1;
 return action.slice(1).every(code=>{
  const tick=Math.floor(code/INPUTS);
  const ok=Number.isSafeInteger(code)&&code>=0&&tick>=last&&tick<=action[0];last=tick;return ok;
 });
}
function apply(state,[ticks,...actions]){
 let cursor=0;
 for(let tick=0;tick<=ticks;tick++){
  while(Math.floor(actions[cursor]/INPUTS)===tick)if(!input(state,actions[cursor++]%INPUTS))return false;
  if(tick<ticks){if(state.dead)return false;advance(state);}
 }
 return cursor===actions.length;
}
return {create,input,advance,accepts,apply,INPUTS,STEP};
})();
if(typeof module!=='undefined')module.exports=frontierRules;
