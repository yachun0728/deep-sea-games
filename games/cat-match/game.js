/* Cat Match platform bridge. Free play, no wallet reward; verified best single-level score. */
var CM={loaded:false,active:false,round:null,tickets:new Map(),generation:0};
function cmValid(source){return source===$('cm-frame').contentWindow;}
function cmFrame(){return $('cm-frame').contentWindow;}
function cmEnd(result,score){if(!CM.round)return;AN.end(CM.round,0,result,{score:Math.max(0,Number(score)||0)});CM.round=null;}
window.deepSeaCatMatch={
 getLanguage:function(source){return cmValid(source)?window.deepSeaI18n?.getLanguage()||'zh-Hant':'zh-Hant';},
 translate:function(source,text){return cmValid(source)?window.deepSeaI18n?.text(text)||text:text;},
 language:function(source){if(!cmValid(source))return;var i=window.deepSeaI18n;i?.setLanguage(i.getLanguage()==='en'?'zh-Hant':'en');},
 prepare:async function(source,level){
  if(!cmValid(source)||$('view-cat-match').hidden||!Number.isSafeInteger(level)||level<1||level>1000000)return null;
  cmEnd('abandoned');var generation=++CM.generation;CM.active=true;CM.round=AN.start('cat-match',0);
  var entry=null;try{var api=await import('./frontend/services/api.mjs');entry=await api.startBoardRound('cat-match',AbortSignal.timeout(5000),{stage:level});}catch(_){}
  if(generation!==CM.generation||!cmValid(source)||$('view-cat-match').hidden)return null;
  if(!entry)return{ranked:false,seed:crypto.getRandomValues(new Uint32Array(1))[0]};
  CM.tickets.set(entry.id,{...entry,ended:false});if(CM.tickets.size>12)CM.tickets.delete(CM.tickets.keys().next().value);
  return{id:entry.id,ranked:true,seed:entry.state.seed};
 },
 trackEnd:function(source,id,score,won){if(!cmValid(source))return;var ticket=CM.tickets.get(id);if(ticket)ticket.ended=true;cmEnd(won?'complete':'loss',score);CM.active=false;},
 finish:async function(source,id,actions,score){
  if(!cmValid(source))return false;var entry=CM.tickets.get(id);if(!entry||!entry.ended)return false;if(entry.done)return true;if(entry.sending)return false;entry.sending=true;
  try{var api=await import('./frontend/services/api.mjs');var result=await api.moveBoardRound(entry.token,{gameId:'cat-match',id:entry.id,revision:entry.revision,action:actions},AbortSignal.timeout(10000));entry.done=result.state.score===score;if(entry.done)window.dispatchEvent(new CustomEvent('deep-sea-score-saved',{detail:{gameId:'cat-match'}}));return entry.done;}catch(_){return false;}finally{entry.sending=false;}
 },
 leaders:async function(source){if(!cmValid(source))return null;var api=await import('./frontend/services/api.mjs');return api.createApiClient(api.arcadeApiOrigin()).leaderboard('cat-match',AbortSignal.timeout(5000));},
 pause:function(source){if(cmValid(source)&&CM.round)AN.progress(CM.round,{phase:'pause'},true);},
 resume:function(source){if(!cmValid(source)||$('view-cat-match').hidden)return;if(!CM.round){CM.active=true;CM.round=AN.start('cat-match',0);}else AN.resume(CM.round);},
 touch:function(source){if(cmValid(source)&&AN.interact)AN.interact();},
 exit:function(source){if(!cmValid(source))return;cmEnd('abandoned');CM.active=false;CM.generation++;location.hash='lobby';}
};
function cmRoute(active){var frame=$('cm-frame');if(active&&!CM.loaded){CM.loaded=true;frame.onload=function(){cmFrame()?.setCatMatchLanguage?.(window.deepSeaI18n?.getLanguage()||'zh-Hant');cmFrame()?.setCatMatchActive?.(!$('view-cat-match').hidden);};frame.src='games/cat-match/play.html';}if(!active){cmEnd('abandoned');CM.active=false;}cmFrame()?.setCatMatchActive?.(active);}
window.addEventListener('arcade-languagechange',function(){cmFrame()?.setCatMatchLanguage?.(window.deepSeaI18n?.getLanguage()||'zh-Hant');});
window.addEventListener('pagehide',function(e){if(!e.persisted)cmEnd('abandoned');},true);
