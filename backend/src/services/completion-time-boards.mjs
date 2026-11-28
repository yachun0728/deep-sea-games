import M from '../../../shared/mermaid-rules.cjs';
import S from '../../../shared/solitaire-rules.cjs';
import T from '../../../shared/solitaire-time.cjs';
import replay from '../../../shared/timed-replay.cjs';

// Seed and clock are issued together. Background time and undo remain on the clock.
// A proof contains legal inputs, never a client-supplied score or elapsed time.
export const completionTimeBoards=Object.entries(T.IDS).map(([id,config])=>[id,{
 rulesVersion:1,
 create:()=>({seed:crypto.getRandomValues(new Uint32Array(1))[0],issuedAt:Date.now(),elapsedMs:null,score:null}),
 accepts:actions=>Array.isArray(actions)&&actions.length>0&&actions.length<=4096&&actions.every(a=>Number.isSafeInteger(a)&&a>=0&&a<(config.base==='mermaid'?M.inputCount:S.INPUT_COUNT)),
 apply:(state,actions)=>{
  if(state.score!==null)return false;
  const elapsed=Date.now()-state.issuedAt;
  if(elapsed<=0||elapsed>=T.LIMIT_MS)return false;
  const rng=replay.seeded(state.seed),g=config.base==='mermaid'?M.create(rng):S.create(config.kind,rng);
  for(const input of actions){
   if(config.base==='mermaid'){
    if(g.dead||!M.input(g,input)||g.mode!==1&&g.mode!==config.mode)return false;
   }else if(g.won||!S.input(g,input))return false;
  }
  if(config.base==='mermaid'?g.done!==8||g.mode!==config.mode:!g.won)return false;
  state.elapsedMs=elapsed;state.score=T.LIMIT_MS-elapsed;return true;
 },
 score:state=>state.score,
 visible:({seed,issuedAt,elapsedMs,score})=>({seed,issuedAt,elapsedMs,score}),
}]);
