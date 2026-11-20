// Run with Node.js, without npm packages.
import fs from 'node:fs';
import {readSource} from './expand_ids.mjs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),source=readSource('js/mobile-navigation.js',root);
const results=[];
function fixture({id='view-blaster',reduced=false,missing=false,button=true,iframe=false}={}){
  const events={},scrolls=[],queried=[],pads=[],canvas={scrollIntoView:o=>scrolls.push(['game',o])},controls={scrollIntoView:o=>scrolls.push(['controls',o])},panel={scrollIntoView:o=>scrolls.push(['panel',o])};
  const view={id,scrollIntoView:o=>scrolls.push(['view',o]),querySelector(selector){queried.push(selector);if(selector==='canvas,iframe,.mg'||selector==='.mines-stage')return canvas;if(selector==='.mines-actions')return controls;if(selector==='.side .go:not([hidden])')return button&&!iframe?controls:null;if(selector==='.side,.boba-platform-bar,.panel')return panel;throw Error('Unexpected query '+selector);}};
  const host={querySelector:()=>controls,insertBefore:(pad,before)=>{assert.equal(before,controls);pads.push(pad);}};
  const frameStage={closest:()=>null,parentNode:{insertBefore:pad=>pads.push(pad)},nextSibling:null};
  const buttons={};const document={createElement:()=>({setAttribute(k,v){this[k]=v;}}),querySelectorAll(selector){if(selector==='.view .console')return iframe?[]:[host];if(selector==='.view iframe')return iframe?[{parentElement:frameStage}]:[];throw Error('Unexpected selector '+selector);},getElementById(id){return buttons[id]??={addEventListener:(type,fn)=>{events[id+':'+type]=fn;}};},querySelector(selector){assert.equal(selector,'.view:not([hidden])');return missing?null:view;}};
  const context=vm.createContext({document,window:{matchMedia:()=>({matches:reduced})}});vm.runInContext(source,context);
  return {events,scrolls,queried,pads,canvas,controls,view,click:id=>events[id+':click']()};
}
function check(name,fn){fn();results.push(name);}
check('Controls jump stays inside the active view and targets the visible action button',()=>{const f=fixture();f.click('mobile-controls');assert.equal(f.scrolls[0][0],'controls');assert.equal(f.scrolls[0][1].block,'center');assert.equal(f.scrolls[0][1].behavior,'smooth');});
check('Game jump targets the game surface rather than the page header',()=>{const f=fixture();f.click('mobile-game');assert.equal(f.scrolls[0][0],'game');assert.equal(f.scrolls[0][1].block,'start');});
check('Minesweeper jumps to its compact board and controls',()=>{const f=fixture({id:'view-mines'});f.click('mobile-game');f.click('mobile-controls');assert.deepEqual(f.queried,['.mines-stage','.mines-actions']);assert.deepEqual(f.scrolls.map(entry=>entry[0]),['game','controls']);});
check('Iframe games fall back to their parent operation bar without touching the child',()=>{const f=fixture({iframe:true});f.click('mobile-controls');assert.equal(f.scrolls[0][0],'panel');});
check('Games without a visible main action fall back to the operation panel',()=>{const f=fixture({button:false});f.click('mobile-controls');assert.equal(f.scrolls[0][0],'panel');});
check('Lobby or missing views do not move the page',()=>{for(const options of [{id:'view-lobby'},{missing:true}]){const f=fixture(options);f.click('mobile-game');f.click('mobile-controls');assert.equal(f.scrolls.length,0);}});
check('Reduced motion preference disables smooth scrolling',()=>{const f=fixture({reduced:true});f.click('mobile-game');assert.equal(f.scrolls[0][1].behavior,'auto');});
check('Navigation registers only two click listeners, leaving game gestures untouched',()=>{const f=fixture();assert.deepEqual(Object.keys(f.events).sort(),['mobile-controls:click','mobile-game:click']);assert(!/preventDefault|pointerdown|touchmove|setPointerCapture/.test(source));});
check('Compact mobile layout uses natural panning without a sidebar or reserved screen gutter',()=>{const css=fs.readFileSync(new URL('css/mobile-navigation.css',root),'utf8');assert(css.includes('@media(max-width:880px)'));assert(css.includes('touch-action:pan-y pinch-zoom'));assert(!/touch-action:\s*none/.test(css));assert(!/body[^{}]*\{[^}]*overflow:\s*hidden/.test(css));assert(css.includes('.wrap:not(.is-lobby)'));assert(css.includes('position:sticky'));assert(css.includes('scroll-margin-top:'));assert(!css.includes('mobile-scroll-rail'));assert(!css.includes('margin-inline-end'));assert(css.includes('grid-template-columns:minmax(0,1fr) auto'));});
check('Native scroll pads are created outside the game surface without touch handlers',()=>{for(const iframe of [false,true]){const f=fixture({iframe});assert.equal(f.pads.length,1);assert.equal(f.pads[0].className,'mobile-scroll-pad');assert.equal(f.pads[0].role,'note');assert.match(f.pads[0].textContent,/上下滑動/);}});
check('Page navigation is merged into the existing game toolbar and the old side rail is absent',()=>{const html=fs.readFileSync(new URL('index.html',root),'utf8');assert(html.includes('</nav></details><nav class="mobile-page-tools"'));assert(!html.includes('class="mobile-scroll-rail"'));});
check('Generated HTML contains one navigation set and all executable scripts compile',()=>{const html=fs.readFileSync(new URL('index.html',root),'utf8');for(const id of ['mobile-controls','mobile-game'])assert.equal(html.split('id="'+id+'"').length-1,1);for(const [,attrs,body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){if(attrs.includes('application/json'))JSON.parse(body);else new vm.Script(body);}});
export {results};
console.log(`PASS: ${results.length} mobile navigation checks`);
