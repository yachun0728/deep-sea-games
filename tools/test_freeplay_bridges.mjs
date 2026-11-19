import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);let checks=0;
const names={boba:['deepSeaBoba','boba-frame'],pancake:['deepSeaPancake','pancake-frame'],dive:['deepSeaDive','dv-frame'],mrt:['deepSeaMrt','mr-frame'],'rocket-chair':['deepSeaRocket','rocket-chair-frame'],'eat-smaller':['deepSeaEatSmaller','es-frame'],'mirror-twins':['deepSeaMirrorTwins','mt-frame'],'shadow-relay':['deepSeaShadowRelay','sr-frame'],'one-line-defense':['deepSeaOneLine','ol-frame'],tetris:['deepSeaTetris','tt-frame']};
for(const [name,[apiName,frameId]] of Object.entries(names)){
 const elements=new Map(),events=[],source=fs.readFileSync(new URL('games/'+name+'/game.js',root),'utf8');
 const el=id=>{if(!elements.has(id))elements.set(id,{textContent:'',hidden:false,disabled:false,className:'',style:{},dataset:{},contentWindow:{},addEventListener(){},setAttribute(){}});return elements.get(id);};
 const i={text:s=>s,getLanguage:()=> 'zh-Hant'},window={deepSeaI18n:i,addEventListener(){}};
 const c={$:el,window,document:{hidden:false,addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}},S:{balance:0},ENTRY_FEE:0,LOW_MSG:'low',fmt:n=>String(n),save(){},renderAll(){},AN:{interact(){},start:(...a)=>{events.push(['start',...a]);return 'round';},end:(...a)=>events.push(['end',...a]),progress(){},resume(){}}};
 vm.createContext(c);vm.runInContext(source,c);
 let api=window[apiName];if(!api)api=Object.entries(window).find(([key,value])=>key.startsWith('deepSea')&&value&&typeof value.start==='function')?.[1];
 assert.ok(api,name+' bridge available');checks++;
 const genuine=el(frameId).contentWindow;
 // Find the real frame if a newer game has a different prefixed DOM id.
 const actualId=source.match(/source===\$\('([^']+)'\)\.contentWindow/)?.[1];const target=actualId?el(actualId).contentWindow:genuine;
 assert.ok(!api.start({}),name+' rejects foreign window');checks++;
 assert.ok(api.start(target),name+' starts at zero points');checks++;
 assert.equal(c.S.balance,0);assert.equal(events.filter(e=>e[0]==='start').length,1);assert.equal(events.find(e=>e[0]==='start')[2],0);checks+=3;
 api.start(target);assert.equal(events.filter(e=>e[0]==='start').length,1,name+' duplicate start cannot add another round');checks++;
 if(typeof api.spend==='function'){assert.equal(api.spend(target,0),true,name+' free refill accepted');assert.equal(c.S.balance,0);checks+=2;}
}
console.log('PASS: '+checks+' free iframe bridge checks');
