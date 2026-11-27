/* Just Want Boba（行人地獄）iframe 橋接：免費遊玩；訪客排行榜比喝到幾杯。 */
var PH={loaded:false,active:false,round:null};
function phUI(){}
var pedRank=timedLeaderboard('pedestrian-hell','ph',pedestrianHellRules.inputCount,phUI);
function phValid(source){return source===$('ph-frame').contentWindow;}
function phEnd(result,score){if(!PH.round)return;AN.end(PH.round,0,result,{score:score||0});PH.round=null;PH.active=false;}
window.deepSeaPed={
 rules:pedestrianHellRules,
 leaders:async function(source){if(!phValid(source))return null;var api=await import('./frontend/services/api.mjs');return api.createApiClient(api.arcadeApiOrigin()).leaderboard('pedestrian-hell',AbortSignal.timeout(5000));},
 language:function(source){return phValid(source)?window.deepSeaI18n.getLanguage():'zh-Hant';},
 translate:function(source,text){return phValid(source)?window.deepSeaI18n.text(text):text;},
 prepare:function(source,ready){
  if(!phValid(source)||$('view-pedestrian-hell').hidden||pedRank.busy())return false;
  if(PH.active)phEnd('abandoned',source.pedScore?.());
  pedRank.start(function(rng){if($('view-pedestrian-hell').hidden)return;PH.active=true;if(AN.interact)AN.interact();PH.round=AN.start('pedestrian-hell',0);ready(rng||Math.random);},null,{rulesVersion:pedestrianHellRules.rulesVersion});return true;
 },
 advance:function(source,ms,active,step){if(phValid(source)&&PH.active)pedRank.update(ms,active,step);},
 record:function(source,code){if(phValid(source)&&PH.active)pedRank.record(code);},
 finish:function(source,score){if(!phValid(source)||!PH.active)return;phEnd('complete',score);pedRank.finish(score);},
 pause:function(source){if(phValid(source)&&PH.round)AN.progress(PH.round,{phase:'pause'},true);},
 resume:function(source){if(phValid(source)&&PH.round)AN.resume(PH.round);},
 touch:function(source){if(phValid(source)&&AN.interact)AN.interact();},
 exit:function(source){if(phValid(source))location.hash='lobby';}
};
function phRoute(active){
 var frame=$('ph-frame');
 if(active&&!PH.loaded){PH.loaded=true;frame.onload=function(){frame.contentWindow.setPedLanguage?.(window.deepSeaI18n.getLanguage());frame.contentWindow.setPedActive?.(!$('view-pedestrian-hell').hidden);};frame.src='games/pedestrian-hell/play.html';}
 if(!active&&PH.active)phEnd('abandoned',frame.contentWindow.pedScore?.());
 frame.contentWindow.setPedActive?.(active);
}
window.addEventListener('arcade-languagechange',function(){$('ph-frame').contentWindow.setPedLanguage?.(window.deepSeaI18n.getLanguage());});
window.addEventListener('pagehide',function(e){if(!e.persisted)phEnd('abandoned',$('ph-frame').contentWindow.pedScore?.());},true);
