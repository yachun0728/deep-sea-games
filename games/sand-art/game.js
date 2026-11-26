/* Sand & Chill: free creative sandbox. No score, leaderboard request, wallet write or per-art reward. */
var SART={loaded:false,active:false,round:null,paused:false,picture:'cat'};
function sArtValid(source){return source===$('sand-frame').contentWindow;}
function sArtFrame(){return $('sand-frame').contentWindow;}
function sArtLanguage(){return window.deepSeaI18n?.getLanguage()||'zh-Hant';}
function sArtPicture(picture){return ['cat','rabbit','whale','cake','flowers','cottage'].includes(picture);}
function sArtEnd(result,params){if(!SART.round)return;var round=SART.round;SART.round=null;SART.paused=false;AN.end(round,0,result,params||{});}
window.deepSeaSandArt={
 getLanguage:function(source){return sArtValid(source)?sArtLanguage():'zh-Hant';},
 translate:function(source,text){return sArtValid(source)?window.deepSeaI18n?.text(text)||text:text;},
 language:function(source){if(sArtValid(source))window.deepSeaI18n?.setLanguage(sArtLanguage()==='en'?'zh-Hant':'en');},
 prepare:function(source,picture){if(!sArtValid(source)||!SART.active||$('view-sand-art').hidden||!sArtPicture(picture))return false;sArtEnd('paper_changed');SART.picture=picture;SART.round=AN.start('sand-art',0,{picture:picture});SART.paused=false;return true;},
 pause:function(source){if(!sArtValid(source)||!SART.round||SART.paused)return;AN.progress(SART.round,{phase:'pause',picture:SART.picture},true);SART.paused=true;},
 resume:function(source,picture){if(!sArtValid(source)||!SART.active||$('view-sand-art').hidden||!sArtPicture(picture))return;if(!SART.round){SART.picture=picture;SART.round=AN.start('sand-art',0,{picture:picture});SART.paused=false;}else if(SART.paused){AN.resume(SART.round,{picture:SART.picture});SART.paused=false;}},
 finish:function(source,data){if(!sArtValid(source)||!SART.active)return;sArtEnd('admired',{picture:SART.picture,bound:Math.max(0,Math.min(260000,Math.floor(Number(data?.bound)||0)))});},
 touch:function(source){if(sArtValid(source)&&SART.active&&AN.interact)AN.interact();},
 exit:function(source){if(!sArtValid(source))return;sArtEnd('abandoned');location.hash='lobby';}
};
function sArtRoute(active){var frame=$('sand-frame');SART.active=!!active;if(active&&!SART.loaded){SART.loaded=true;frame.onload=function(){sArtFrame()?.setSandArtLanguage?.(sArtLanguage());sArtFrame()?.setSandArtActive?.(SART.active&&!$('view-sand-art').hidden);};frame.src='games/sand-art/play.html?v=release-1';}else if(active){sArtFrame()?.setSandArtLanguage?.(sArtLanguage());sArtFrame()?.setSandArtActive?.(true);}if(!active){sArtFrame()?.setSandArtActive?.(false);sArtEnd('abandoned');}}
window.addEventListener('arcade-languagechange',function(){sArtFrame()?.setSandArtLanguage?.(sArtLanguage());});
window.addEventListener('pagehide',function(e){if(!e.persisted)sArtEnd('abandoned');},true);
