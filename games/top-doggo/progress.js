/* Versioned, local-only campaign progress. No account or wallet data. */
(function(root){
 const KEY='top-doggo-progress-v1',COUNT=(typeof module==='object'?require('./levels.js'):root.TopDoggoLevels).levels.length;
 function clean(raw){
  const v=raw&&raw.version===1?raw:{};
  const completed=[...new Set((Array.isArray(v.completed)?v.completed:[]).filter(n=>Number.isInteger(n)&&n>=1&&n<=COUNT))].sort((a,b)=>a-b);
  let unlocked=1;while(completed.includes(unlocked)&&unlocked<COUNT)unlocked++;
  const c=v.current||{},level=Number.isInteger(c.level)&&c.level>=1&&c.level<=unlocked?c.level:unlocked;
  return {version:1,completed,unlocked,current:{level,mission:Number.isInteger(c.mission)?Math.max(0,Math.min(4,c.mission)):0,progress:Number.isFinite(c.progress)?Math.max(0,Math.min(1000,Math.floor(c.progress))):0}};
 }
 function load(storage){try{return clean(JSON.parse(storage.getItem(KEY)));}catch(_){return clean(null);}}
 function save(storage,value){try{storage.setItem(KEY,JSON.stringify(clean(value)));return true;}catch(_){return false;}}
 const api={KEY,COUNT,clean,load,save};if(typeof module==='object')module.exports=api;else root.TopDoggoProgress=api;
})(typeof window==='object'?window:this);
