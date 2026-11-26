/* Berry Trail iframe bridge: free play; deterministic guest ranking. */
var BT={loaded:false,active:false,round:null};
function btUI(){}
var berryRank=timedLeaderboard('berry-trail','bt',berryTrailRules.inputCount,btUI);
function btValid(source){return source===$('bt-frame').contentWindow;}
function btEnd(result,score){if(!BT.round)return;AN.end(BT.round,0,result,{score:score||0});BT.round=null;BT.active=false;}
window.deepSeaBerry={
 rules:berryTrailRules,
 leaders:async function(source){if(!btValid(source))return null;var api=await import('./frontend/services/api.mjs');return api.createApiClient(api.arcadeApiOrigin()).leaderboard('berry-trail',AbortSignal.timeout(5000));},
 language:function(source){return btValid(source)?window.deepSeaI18n.getLanguage():'zh-Hant';},
 translate:function(source,text){return btValid(source)?window.deepSeaI18n.text(text):text;},
 prepare:function(source,ready){
  if(!btValid(source)||$('view-berry-trail').hidden||berryRank.busy())return false;
  if(BT.active)btEnd('abandoned',source.berryScore?.());
  berryRank.start(function(rng){if($('view-berry-trail').hidden)return;BT.active=true;if(AN.interact)AN.interact();BT.round=AN.start('berry-trail',0);ready(rng||Math.random);});return true;
 },
 advance:function(source,ms,active,step){if(btValid(source)&&BT.active)berryRank.update(ms,active,step);},
 record:function(source,code){if(btValid(source)&&BT.active)berryRank.record(code);},
 finish:function(source,score){if(!btValid(source)||!BT.active)return;btEnd('complete',score);berryRank.finish(score);},
 pause:function(source){if(btValid(source)&&BT.round)AN.progress(BT.round,{phase:'pause'},true);},
 resume:function(source){if(btValid(source)&&BT.round)AN.resume(BT.round);},
 touch:function(source){if(btValid(source)&&AN.interact)AN.interact();},
 exit:function(source){if(btValid(source))location.hash='lobby';}
};
function btRoute(active){
 var frame=$('bt-frame');
 if(active&&!BT.loaded){BT.loaded=true;frame.onload=function(){frame.contentWindow.setBerryLanguage?.(window.deepSeaI18n.getLanguage());frame.contentWindow.setBerryActive?.(!$('view-berry-trail').hidden);};frame.src='games/berry-trail/play.html';}
 if(!active&&BT.active)btEnd('abandoned',frame.contentWindow.berryScore?.());
 frame.contentWindow.setBerryActive?.(active);
}
window.addEventListener('arcade-languagechange',function(){$('bt-frame').contentWindow.setBerryLanguage?.(window.deepSeaI18n.getLanguage());});
window.addEventListener('pagehide',function(e){if(!e.persisted)btEnd('abandoned',$('bt-frame').contentWindow.berryScore?.());},true);
