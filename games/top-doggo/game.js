/* TOP DOGGO: local 10-level campaign; analytics only, no leaderboard requests. */
var TD={loaded:false,round:null};
function tdValid(source){return source===$('td-frame').contentWindow;}
function tdFrame(){return $('td-frame').contentWindow;}
function tdLang(){return window.deepSeaI18n?.getLanguage()||'zh-Hant';}
function tdEnd(round,result,params){if(round)AN.end(round,0,result,params||{});}
window.deepSeaTopDoggo={
 getLanguage:function(source){return tdValid(source)?tdLang():'zh-Hant';},
 prepare:function(source,level,mode){
  if(!tdValid(source)||$('view-top-doggo').hidden)return false;
  tdEnd(TD.round,'abandoned');TD.round=AN.start('top-doggo',0,{level:level,mode:mode||'campaign'});return true;
 },
 finish:async function(source,data){
  if(!tdValid(source))return {saved:false};var round=TD.round;TD.round=null;
  tdEnd(round,data?.reason==='win'?'win':data?.reason==='dead'?'loss':'abandoned',{score:data?.level,step:data?.kills,level:data?.level,mode:data?.mode});return {saved:false};
 },
 touch:function(source){if(tdValid(source)&&AN.interact)AN.interact();},
 exit:function(source){if(!tdValid(source))return;location.hash='lobby';}
};
function tdRoute(active){
 var frame=$('td-frame');
 if(active&&!TD.loaded){TD.loaded=true;frame.onload=function(){tdFrame()?.setTopDoggoLanguage?.(tdLang());tdFrame()?.setTopDoggoActive?.(!$('view-top-doggo').hidden);};frame.src='games/top-doggo/play.html?v=20261125-campaign11';}
 else if(active){tdFrame()?.setTopDoggoLanguage?.(tdLang());tdFrame()?.setTopDoggoActive?.(true);}
 if(!active)tdFrame()?.setTopDoggoActive?.(false);
}
window.addEventListener('arcade-languagechange',function(){tdFrame()?.setTopDoggoLanguage?.(tdLang());});
window.addEventListener('pagehide',function(e){if(!e.persisted&&TD.round){tdEnd(TD.round,'abandoned');TD.round=null;}},true);
