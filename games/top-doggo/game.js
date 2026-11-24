/* TOP DOGGO: Paw City platform bridge. Free play (no entry fee, no points reward).
   Three leaderboards by difficulty (top-doggo-easy / -normal / -hard); score = level reached.
   The Worker only checks plausibility (see shared/top-doggo-rules.cjs): the round start time is issued here, the end sends [level, kills, playMs]. */
var TD={loaded:false,round:null,board:null,starting:null};
var TD_DIFFS=['easy','normal','hard'];
function tdValid(source){return source===$('td-frame').contentWindow;}
function tdFrame(){return $('td-frame').contentWindow;}
function tdLang(){return window.deepSeaI18n?.getLanguage()||'zh-Hant';}
function tdEnd(round,result,params){if(round)AN.end(round,0,result,params||{});}
async function tdApi(){return import('./frontend/services/api.mjs');}
window.deepSeaTopDoggo={
 getLanguage:function(source){return tdValid(source)?tdLang():'zh-Hant';},
 // 開局：預先向 Worker 領取本局憑證（不阻塞遊戲開始；結束時會等它完成）。
 prepare:function(source,difficulty){
  if(!tdValid(source)||$('view-top-doggo').hidden||TD_DIFFS.indexOf(difficulty)<0)return false;
  tdEnd(TD.round,'abandoned');TD.round=AN.start('top-doggo',0,{difficulty:difficulty});TD.board=null;
  var mine={done:false};TD.starting=mine;
  (async function(){
   try{var api=await tdApi();var entry=await api.startBoardRound('top-doggo-'+difficulty,AbortSignal.timeout(4000));if(TD.starting===mine)TD.board={difficulty:difficulty,entry:entry};}
   catch(_){if(TD.starting===mine)TD.board=null;}
   mine.done=true;
  })();
  return true;
 },
 // 結束（死亡或離開）：送出 [關卡, 擊倒數, 遊玩毫秒]。回傳 {saved, offline}。
 finish:async function(source,data){
  if(!tdValid(source))return {saved:false};
  var round=TD.round;TD.round=null;
  var level=Math.max(1,Math.floor(Number(data&&data.level)||1)),kills=Math.max(0,Math.floor(Number(data&&data.kills)||0)),ms=Math.max(0,Math.floor(Number(data&&data.playMs)||0));
  tdEnd(round,data&&data.reason==='dead'?'loss':'abandoned',{score:level,step:kills,level:level,difficulty:data&&data.difficulty});
  var pending=TD.starting;
  for(var i=0;i<45&&pending&&!pending.done;i++)await new Promise(function(r){setTimeout(r,100);}); // 最多等 4.5 秒讓開局憑證到手
  var board=TD.board;if(!board||board.difficulty!==(data&&data.difficulty))return {saved:false,offline:true};
  TD.board=null;
  try{
   var api=await tdApi();var entry=board.entry;
   var result=await api.moveBoardRound(entry.token,{gameId:'top-doggo-'+board.difficulty,id:entry.id,revision:entry.revision,action:[level,kills,ms]},AbortSignal.timeout(10000));
   var saved=!!result&&result.state&&result.state.score===level;
   if(saved)window.dispatchEvent(new CustomEvent('deep-sea-score-saved',{detail:{gameId:'top-doggo-'+board.difficulty}}));
   return {saved:saved};
  }catch(_){return {saved:false,offline:true};}
 },
 leaders:async function(source,difficulty){
  if(!tdValid(source)||TD_DIFFS.indexOf(difficulty)<0)return null;
  var api=await tdApi();return api.createApiClient(api.arcadeApiOrigin()).leaderboard('top-doggo-'+difficulty,AbortSignal.timeout(5000));
 },
 touch:function(source){if(tdValid(source)&&AN.interact)AN.interact();},
 exit:function(source){if(!tdValid(source))return;location.hash='lobby';}
};
function tdRoute(active){
 var frame=$('td-frame');
 if(active&&!TD.loaded){TD.loaded=true;frame.onload=function(){tdFrame()?.setTopDoggoLanguage?.(tdLang());tdFrame()?.setTopDoggoActive?.(!$('view-top-doggo').hidden);};frame.src='games/top-doggo/play.html?v=20261124-waypoint3';}
 else if(active){tdFrame()?.setTopDoggoLanguage?.(tdLang());tdFrame()?.setTopDoggoActive?.(true);}
 if(!active)tdFrame()?.setTopDoggoActive?.(false);
}
window.addEventListener('arcade-languagechange',function(){tdFrame()?.setTopDoggoLanguage?.(tdLang());});
window.addEventListener('pagehide',function(e){if(!e.persisted&&TD.round){tdEnd(TD.round,'abandoned');TD.round=null;}},true);
