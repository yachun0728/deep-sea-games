  // Uses the existing guest API. Only a legal complete proof can create a public time record.
  function completionTimeLeaderboard(boardId, ownerId, prefix, refresh) {
    let round=null,pending=null,starting=false,sending=false,running=false,startMs=0,finalMs=0,inputs=[];
    const id=()=>typeof boardId==='function'?boardId():boardId;
    const clock=$(prefix+'-time'),indicator=$(prefix+'-ranking');
    function markRanked(value){if(indicator)indicator.textContent=value?'{{t:solitaire.time.ranked}}':'{{t:solitaire.time.practice}}';}
    function elapsed(){return running?Math.max(0,Date.now()-startMs):finalMs;}
    function status(text,retry=false){$(prefix+'-rank-status').textContent=text;$(prefix+'-rank-status').hidden=!text;$(prefix+'-rank-retry').hidden=!retry;const result=$(prefix+'-result-rank');if(result){result.textContent=text;result.hidden=!text;}}
    function paint(){if(round&&elapsed()>=solitaireTime.LIMIT_MS){round=null;markRanked(false);status('{{t:timed-leaderboard.msg.003}}');}if(clock){const text=solitaireTime.format(elapsed());if(clock.textContent!==text)clock.textContent=text;}}
    async function start(callback,cancel){
      if(starting||sending)return;
      starting=true;pending=null;inputs=[];round=null;status('{{t:timed-leaderboard.msg.001}}');refresh();
      const requestedId=id();
      try{const api=await import('./frontend/services/api.mjs');round=await api.startBoardRound(requestedId,AbortSignal.timeout(4000),{rulesVersion:1});}catch{}
      starting=false;
      if($('view-'+ownerId).hidden){round=null;status('');refresh();cancel?.();return;}
      startMs=Date.now();finalMs=0;running=true;
      status(round?'{{t:timed-leaderboard.msg.002}}':'{{t:timed-leaderboard.msg.003}}');
      if(round)round.boardId=requestedId;markRanked(!!round);
      callback(round?timedReplay.seeded(round.state.seed):null);paint();
    }
    function record(input){if(!running)return;inputs.push(input);if(inputs.length>4096){round=null;markRanked(false);status('{{t:timed-leaderboard.msg.003}}');}}
    async function send(){
      if(!pending||sending)return;sending=true;status('{{t:timed-leaderboard.msg.004}}');refresh();
      try{
        const api=await import('./frontend/services/api.mjs');
        const next=await api.moveBoardRound(pending.token,pending.command,AbortSignal.timeout(10000));
        if(next.revision!==pending.command.revision+1||!Number.isSafeInteger(next.state.elapsedMs)){const error=Error('not verified');error.retryable=false;throw error;}
        finalMs=next.state.elapsedMs;paint();status('{{t:timed-leaderboard.msg.005}}');
        window.dispatchEvent(new CustomEvent('deep-sea-score-saved',{detail:{gameId:ownerId,boardId:pending.command.gameId}}));
        pending=null;
      }catch(error){if(error.retryable===false)pending=null;markRanked(false);status('{{t:timed-leaderboard.msg.006}}',!!pending);}
      finally{sending=false;refresh();}
    }
    function finish(){
      if(!running)return;finalMs=elapsed();running=false;paint();
      if(!round){status('{{t:timed-leaderboard.msg.003}}');return;}
      pending={token:round.token,command:{gameId:round.boardId,id:round.id,revision:round.revision,action:inputs.slice()}};round=null;send();
    }
    function abandon(){if(running){finalMs=elapsed();running=false;paint();}round=null;inputs=[];}
    $(prefix+'-rank-retry').addEventListener('click',send);
    return {start,record,finish,abandon,busy:()=>starting||sending,update:()=>paint(),elapsed,formatted:()=>solitaireTime.format(elapsed())};
  }
