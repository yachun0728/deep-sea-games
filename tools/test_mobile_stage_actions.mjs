import fs from 'node:fs';
import {readSource} from './expand_ids.mjs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),source=readSource('js/mobile-stage-actions.js',root);
const results=[];
class Node{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.parentNode=null;this.hidden=false;this.disabled=false;this.dataset={};this.textContent='';this.events={};this.classList={add(){}};}
  get nextSibling(){if(!this.parentNode)return null;return this.parentNode.children[this.parentNode.children.indexOf(this)+1]||null;}
  get firstElementChild(){return this.children.find(c=>c.tagName!=='#COMMENT')||null;}
  appendChild(child){return this.insertBefore(child,null);}
  insertBefore(child,before){if(child===before)return child;if(child.parentNode){const list=child.parentNode.children;list.splice(list.indexOf(child),1);}const index=before?this.children.indexOf(before):this.children.length;assert(index>=0);this.children.splice(index,0,child);child.parentNode=this;return child;}
  setAttribute(name,value){this[name]=value;}
  addEventListener(type,fn){(this.events[type]??=[]).push(fn);}
  click(){if(!this.disabled)for(const fn of this.events.click||[])fn({target:this});}
}
function fixture(mobile=true,mode='bet',retry=false){
  const console=new Node(),stage=new Node(),side=new Node(),button=new Node('button'),retryButton=new Node('button'),observers=[];console.appendChild(stage);console.appendChild(side);side.appendChild(button);button.id='go';button.dataset.mode=mode;button.textContent='扣點開始遊戲';retryButton.id='retry';retryButton.textContent='重玩第 7 關（扣 4 點）';retryButton.hidden=true;if(retry)side.appendChild(retryButton);
  console.querySelector=selector=>selector==='.side'?side:null;side.querySelectorAll=()=>retry?[button,retryButton]:[button];
  const media={matches:mobile,addEventListener(type,fn){this.changed=fn;}};
  let balance=1000,starts=0,retries=0;
  button.addEventListener('click',()=>{starts++;balance-=10;button.disabled=true;button.dataset.mode='surface';});
  retryButton.addEventListener('click',()=>{retries++;balance-=4;retryButton.hidden=true;button.hidden=false;button.disabled=true;});
  const document={querySelectorAll:()=>[console],createElement:tag=>new Node(tag),createComment:()=>new Node('#comment')};
  class Observer{constructor(fn){this.fn=fn;observers.push(this);}observe(){}}
  vm.runInNewContext(source,{window:{matchMedia:()=>media,MutationObserver:Observer},document,ENTRY_FEE:10});
  return {stage,side,button,retryButton,media,flush:()=>observers.forEach(o=>o.fn()),state:()=>({balance,starts,retries}),resize(value){media.matches=value;media.changed();}};
}
function check(name,fn){fn();results.push(name);}
check('Mobile moves the exact original button into the stage without starting or charging',()=>{const f=fixture();assert.equal(f.button.parentNode.className,'mobile-stage-action');assert.equal(f.button.parentNode.parentNode.parentNode,f.stage);assert.deepEqual(f.state(),{balance:1000,starts:0,retries:0});});
check('Desktop leaves the original button in its panel',()=>{const f=fixture(false);assert.equal(f.button.parentNode,f.side);});
check('Original start handler charges once and active controls return to the panel',()=>{const f=fixture();f.button.click();f.flush();f.button.click();assert.equal(f.button.parentNode,f.side);assert.deepEqual(f.state(),{balance:990,starts:1,retries:0});});
check('Surface actions and paid restart buttons stay in the panel while playing',()=>{for(const mode of ['surface','cancel']){const f=fixture(true,mode);assert.equal(f.button.parentNode,f.side);}});
check('Checkpoint continuation can appear on the stage without replacing its original handler',()=>{const f=fixture(true,'surface');f.button.textContent='挑戰下一關';f.flush();assert.equal(f.button.parentNode.className,'mobile-stage-action');});
check('Stage retry keeps the original retry button and its four-point charge exactly once',()=>{const f=fixture(true,'bet',true);f.button.hidden=true;f.retryButton.hidden=false;f.flush();assert.equal(f.retryButton.parentNode.className,'mobile-stage-action');f.retryButton.click();f.flush();assert.deepEqual(f.state(),{balance:996,starts:0,retries:1});assert.equal(f.retryButton.parentNode,f.side);});
check('Disabled retry remains visible but cannot charge',()=>{const f=fixture(true,'bet',true);f.button.hidden=true;f.retryButton.hidden=false;f.retryButton.disabled=true;f.flush();assert.equal(f.retryButton.parentNode.className,'mobile-stage-action');f.retryButton.click();assert.equal(f.state().balance,1000);});
check('Changing viewport restores the original button order and supports mobile again',()=>{const f=fixture(true,'bet',true);f.resize(false);assert.equal(f.button.parentNode,f.side);assert.equal(f.retryButton.parentNode,f.side);assert.deepEqual(f.side.children.filter(n=>n.tagName!=='#COMMENT'),[f.button,f.retryButton]);f.resize(true);assert.equal(f.button.parentNode.className,'mobile-stage-action');});
check('The overlay cannot receive touches outside the actual buttons',()=>{const css=fs.readFileSync(new URL('css/mobile-navigation.css',root),'utf8');assert(css.includes('.mobile-stage-actions'));assert(css.includes('pointer-events:none'));assert(css.includes('pointer-events:auto'));assert(!/setInterval|requestAnimationFrame|\.click\(/.test(source));});
check('Generated JavaScript compiles with the new helper',()=>{const html=fs.readFileSync(new URL('index.html',root),'utf8');for(const [,attrs,body]of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){if(attrs.includes('application/json'))JSON.parse(body);else new vm.Script(body);}});
export {results};
console.log(`PASS: ${results.length} in-game mobile button checks`);
