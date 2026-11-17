// Run with Node.js, without npm packages.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),source=fs.readFileSync(new URL('js/mobile-navigation.js',root),'utf8');
const results=[];
function fixture({id='view-blaster',reduced=false,missing=false,button=true,iframe=false}={}){
  const events={},scrolls=[],queried=[],canvas={scrollIntoView:o=>scrolls.push(['game',o])},controls={scrollIntoView:o=>scrolls.push(['controls',o])},panel={scrollIntoView:o=>scrolls.push(['panel',o])};
  const view={id,scrollIntoView:o=>scrolls.push(['view',o]),querySelector(selector){queried.push(selector);if(selector==='canvas,iframe,.mg')return canvas;if(selector==='.side .go:not([hidden])')return button&&!iframe?controls:null;if(selector==='.side,.boba-platform-bar,.panel')return panel;throw Error('Unexpected query '+selector);}};
  const buttons={};const document={getElementById(id){return buttons[id]??={addEventListener:(type,fn)=>{events[id+':'+type]=fn;}};},querySelector(selector){assert.equal(selector,'.view:not([hidden])');return missing?null:view;}};
  const context=vm.createContext({document,window:{matchMedia:()=>({matches:reduced})}});vm.runInContext(source,context);
  return {events,scrolls,queried,canvas,controls,view,click:id=>events[id+':click']()};
}
function check(name,fn){fn();results.push(name);}
check('Controls jump stays inside the active view and targets the visible action button',()=>{const f=fixture();f.click('mobile-controls');assert.equal(f.scrolls[0][0],'controls');assert.equal(f.scrolls[0][1].block,'center');assert.equal(f.scrolls[0][1].behavior,'smooth');});
check('Game jump targets the game surface rather than the page header',()=>{const f=fixture();f.click('mobile-game');assert.equal(f.scrolls[0][0],'game');assert.equal(f.scrolls[0][1].block,'start');});
check('Iframe games fall back to their parent operation bar without touching the child',()=>{const f=fixture({iframe:true});f.click('mobile-controls');assert.equal(f.scrolls[0][0],'panel');});
check('Games without a visible main action fall back to the operation panel',()=>{const f=fixture({button:false});f.click('mobile-controls');assert.equal(f.scrolls[0][0],'panel');});
check('Lobby or missing views do not move the page',()=>{for(const options of [{id:'view-lobby'},{missing:true}]){const f=fixture(options);f.click('mobile-game');f.click('mobile-controls');assert.equal(f.scrolls.length,0);}});
check('Reduced motion preference disables smooth scrolling',()=>{const f=fixture({reduced:true});f.click('mobile-game');assert.equal(f.scrolls[0][1].behavior,'auto');});
check('Navigation registers only two click listeners, leaving game gestures untouched',()=>{const f=fixture();assert.deepEqual(Object.keys(f.events).sort(),['mobile-controls:click','mobile-game:click']);assert(!/preventDefault|pointerdown|touchmove|setPointerCapture/.test(source));});
check('Scroll rail permits vertical browser panning and mobile controls match the single-column breakpoint',()=>{const css=fs.readFileSync(new URL('css/mobile-navigation.css',root),'utf8');assert(css.includes('@media(max-width:880px)'));assert(css.includes('touch-action:pan-y pinch-zoom'));assert(!/touch-action:\s*none|overflow:\s*hidden/.test(css));assert(css.includes('.wrap:not(.is-lobby)'));assert(css.includes('position:sticky'));assert(css.includes('scroll-margin-top:'));});
check('Generated HTML contains one navigation set and all executable scripts compile',()=>{const html=fs.readFileSync(new URL('index.html',root),'utf8');for(const id of ['mobile-controls','mobile-game'])assert.equal(html.split('id="'+id+'"').length-1,1);for(const [,attrs,body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){if(attrs.includes('application/json'))JSON.parse(body);else new vm.Script(body);}});
export {results};
console.log(`PASS: ${results.length} mobile navigation checks`);
