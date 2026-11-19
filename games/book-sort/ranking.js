const rankBoard=g('bs-ranking');
let rankTicket, submission, rankRequest=0;

function prepareRank(number){
 return import('./frontend/services/api.mjs')
  .then(api=>api.startBoardRound(GAME_ID,AbortSignal.timeout(4000),{stage:number}))
  .then(ticket=>({...ticket,receivedAt:performance.now()}))
  .catch(()=>null);
}

async function submitRank(number,actions,ticketPromise){
 const entry={number,actions,ticket:null};
 submission=entry;
 g('bs-rank-retry').hidden=true;
 entry.ticket=await ticketPromise;
 if(!entry.ticket){
  if(entry===submission)g('bs-rank-status').textContent='這一局可在本機遊玩。';
  return;
 }
 sendRank(entry);
}

async function sendRank(entry){
 if(!entry?.ticket||entry.sending||entry.done)return;
 entry.sending=true;
 const status=g('bs-rank-status'),retry=g('bs-rank-retry');
 if(entry===submission){status.textContent='正在驗證排行榜成績…';retry.hidden=true}
 let sent=false,canRetry=false;
 try{
  const api=await import('./frontend/services/api.mjs');
  const {id,revision,token,receivedAt}=entry.ticket;
  const wait=rankedBookMinimumMs(entry.actions)-(performance.now()-receivedAt);
  if(wait>0)await new Promise(resolve=>setTimeout(resolve,wait));
  const reply=await api.moveBoardRound(token,{id,revision,gameId:GAME_ID,action:entry.actions},AbortSignal.timeout(10000));
  sent=reply.state.score===entry.number;
 }catch(error){canRetry=error.retryable!==false}
 entry.sending=false;entry.done=!canRetry;
 if(entry!==submission)return;
 status.textContent=sent?'成績已送到排行榜。':'排行榜成績未能送出。';
 retry.hidden=!canRetry;
 if(sent&&rankBoard.open)loadRank();
}

async function loadRank(){
 const request=++rankRequest,status=g('bs-rank-board-status'),list=g('bs-rank-list');
 status.textContent='載入排行榜中…';
 list.replaceChildren();
 try{
  const api=await import('./frontend/services/api.mjs');
  const {entries}=await api.createApiClient(api.arcadeApiOrigin()).leaderboard(GAME_ID,AbortSignal.timeout(5000));
  if(request!==rankRequest)return;
  list.replaceChildren(...entries.map(entry=>{
   const row=document.createElement('li'),name=document.createElement('span');
   name.textContent=entry.displayName||'訪客';
   if(entry.displayName)name.setAttribute('data-i18n-ignore','');
   row.append(name,' · '+entry.score);
   return row;
  }));
  status.textContent=entries.length?'':'目前尚無排行榜紀錄。';
 }catch{
  if(request===rankRequest)status.textContent='目前無法載入排行榜。';
 }
}
rankBoard.addEventListener('toggle',()=>{if(rankBoard.open)loadRank()});
g('bs-rank-retry').addEventListener('click',()=>sendRank(submission));
