(async function(){
var results=[],errors=[],i=window.deepSeaI18n;
window.addEventListener('error',function(e){errors.push(e.message)});
function assert(ok,msg){if(!ok)throw new Error(msg);results.push(msg)}
function wait(ms){return new Promise(function(r){setTimeout(r,ms||60)})}
function balance(){return Number(document.getElementById('balance').textContent.replace(/,/g,''))}
function chinese(view){var texts=[];var walker=(view.ownerDocument||document).createTreeWalker(view,NodeFilter.SHOW_TEXT),node;while(node=walker.nextNode())if(!node.parentElement.closest('script,style')&&/[\u3400-\u9fff]/.test(node.nodeValue))texts.push(node.nodeValue);return texts}
try {
 await wait();
 if(matchMedia('(max-width:880px)').matches)assert(innerWidth===390&&document.documentElement.scrollWidth<=390,'English lobby fits a true 390px viewport');
 var games={mines:'mines-go',merge:'mg-go',dream:'dr-go',runner:'rn-go',elevator:'eq-go',sneak:'sk-go',fishing:'fi-go',campaign:'cp-go',cat:'ct-go',bird:'pb-go',reaper:'rp-go',blaster:'bl-go',skybuilder:'sb-go',carp:'carp-go',rider:'rider-go',boss:'boss-go',thief:'thief-go',baby:'baby-go',frog:'fg-go',nap:'np-go'};
 for(var id of Object.keys(games)){
  location.hash=id;await wait();
  var button=document.getElementById(games[id]),view=document.getElementById('view-'+id),before=balance();
  button.click();await wait();
  assert(balance()===before-(id==='mines'?0:10),id+': start charged once');
  var charged=balance(),hash=location.hash;
  i.setLanguage('zh-Hant');await wait();i.setLanguage('en');await wait();
  assert(balance()===charged&&location.hash===hash,id+': language switch preserves balance and route');
  assert(!chinese(view).length,id+': live labels translated '+JSON.stringify(chinese(view)));
  if(matchMedia('(max-width:880px)').matches)assert(innerWidth===390&&document.documentElement.scrollWidth<=390,id+': English game fits a true 390px viewport');
  if(matchMedia('(max-width:880px)').matches&&id==='dream'){
    var sourceLabel=i.sourceText(button),mode=button.dataset.mode;
    document.getElementById('dr-go').textContent='挑戰下一關';document.getElementById('dr-go').dataset.mode='surface';await wait();
    assert(document.getElementById('dr-go').closest('.mobile-stage-action'), 'English next-stage action stays in the mobile stage');
    button.textContent=sourceLabel;button.dataset.mode=mode;await wait();
    assert(button.closest('.side')&&i.sourceText(button)===sourceLabel,'Live Stop action returns to its original panel after the label fixture');
  }
 }
 for(var game of [{id:'dive',frame:'dv-frame',button:'dv-go'},{id:'mrt',frame:'mr-frame',button:'mr-go'},{id:'pancake',frame:'pancake-frame',button:'btn-touch'}]){
   location.hash=game.id;await wait(250);
   var frame=document.getElementById(game.frame),doc=frame.contentDocument;
   assert(doc&&doc.body,game.id+': same-origin iframe loads');
   assert(!chinese(doc.body).length,game.id+': iframe labels translated '+JSON.stringify(chinese(doc.body)));
   var before=balance();
   if(game.id==='pancake')doc.getElementById(game.button).click();else document.getElementById(game.button).click();
   await wait();
   assert(balance()===before-10,game.id+': iframe start charges exactly ten points');
   var paid=balance();i.setLanguage('zh-Hant');await wait();i.setLanguage('en');await wait();
   assert(balance()===paid,game.id+': iframe switching preserves balance');
   assert(!chinese(doc.body).length,game.id+': live iframe labels translated '+JSON.stringify(chinese(doc.body)));
   if(matchMedia('(max-width:880px)').matches)assert(innerWidth===390&&document.documentElement.scrollWidth<=390,game.id+': parent fits 390px viewport');
 }
 assert(!window.__untranslatedCanvas.length,'Canvas draws contain no untranslated Chinese: '+JSON.stringify(window.__untranslatedCanvas));
 assert(!errors.length,'No runtime errors: '+JSON.stringify(errors));
 if(matchMedia('(max-width:880px)').matches){
   assert(innerWidth===390,'Mobile CSS viewport is exactly 390px');
   var wide=[].slice.call(document.querySelectorAll('body *')).filter(function(e){var r=e.getBoundingClientRect();return r.width>0&&(r.right>document.documentElement.clientWidth+1||r.left<0)}).slice(0,20).map(function(e){return [e.tagName,e.id,e.className,Math.round(e.getBoundingClientRect().width)]});
   assert(document.documentElement.scrollWidth<=document.documentElement.clientWidth,'Mobile document stays within viewport: '+JSON.stringify({inner:innerWidth,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,wide:wide}));
   var a=document.querySelector('.language-switch').getBoundingClientRect(),b=document.querySelector('.wallet').getBoundingClientRect();
   assert(a.right<=b.left+1,'Language switch does not overlap wallet');
 }
 document.body.dataset.testStatus='PASS';
}catch(e){document.body.dataset.testStatus='FAIL';results.push(e.stack)}
var el=document.createElement('pre');el.id='test-results';el.setAttribute('data-i18n-ignore','');el.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%';el.textContent=JSON.stringify(results,null,2);document.body.appendChild(el);
})();
