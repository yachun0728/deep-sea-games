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
 var games={'ocean-link':'ol-full',mines:'mines-go',breakout:'br-go',merge:'mg-go',dream:'dr-go',runner:'rn-go',elevator:'eq-go',sneak:'sk-go',fishing:'fi-go',campaign:'cp-go',cat:'ct-go',bird:'pb-go',reaper:'rp-go',blaster:'bl-go',skybuilder:'sb-go',carp:'carp-go',rider:'rider-go',boss:'boss-go',thief:'thief-go',baby:'baby-go',frog:'fg-go',nap:'np-go',mosquito:'mq-go','last-hair':'lh-go','pet-walk':'pw-go','office-shoot':'os-go',mermaid:'mm-go',banquet:'bq-go','on-pitch':'op-go'};
 for(var id of Object.keys(games)){
  location.hash=id;await wait();
  var button=document.getElementById(games[id]),view=document.getElementById('view-'+id),before=balance();
  if(id==='ocean-link'){
    document.getElementById('ol-stage').requestFullscreen=undefined;
    var area=document.getElementById('ol-game-area').getBoundingClientRect();
    var corners=[[area.left+5,area.top+5],[area.right-5,area.bottom-5]];
    assert(button.textContent==='Start game'&&corners.every(function(point){
      return document.elementFromPoint(point[0],point[1])===button;
    }),'Tapping either corner of the game area starts Ocean Link');
  }
  button.click();await wait();
  assert(balance()===before,id+': start has the correct entry fee');
  var charged=balance(),hash=location.hash;
  i.setLanguage('zh-Hant');await wait();i.setLanguage('en');await wait();
  assert(balance()===charged&&location.hash===hash,id+': language switch preserves balance and route');
  assert(!chinese(view).length,id+': live labels translated '+JSON.stringify(chinese(view)));
  if(id==='blaster'){
    var fleet=document.getElementById('bl-lives'),board=document.getElementById('bl-canvas');
    assert(fleet.textContent==='3 / 35','Reef Blaster starts with three submarines and keeps them across language switches');
    assert(fleet.getAttribute('aria-label')==='Submarines left'&&view.textContent.includes('Steer the fleet, shoot gates, and dodge enemies and ink.'),'Reef Blaster fleet HUD and instructions are translated');
    var bounds=board.getBoundingClientRect();
    assert(bounds.width>0&&bounds.right<=innerWidth,'Reef Blaster playfield fits the viewport');
    assert(!view.querySelector('.side,.game-view-controls,#bl-left')&&document.getElementById('bl-exit').parentElement===board.parentElement,'Reef Blaster controls stay on the playfield');
    if(innerWidth===390)assert(getComputedStyle(document.getElementById('bl-playfield')).position==='fixed','Reef Blaster occupies the mobile viewport');

    var steer={clientX:bounds.left+bounds.width*.3,clientY:bounds.top+bounds.height*.70,pointerId:1,bubbles:true};
    board.dispatchEvent(new PointerEvent('pointerdown',steer));
    board.dispatchEvent(new PointerEvent('pointerup',steer));
    for(var frame=0;frame<65&&parseInt(fleet.textContent,10)<=3;frame++)await wait(100);
    assert(parseInt(fleet.textContent,10)>3,'Steering through the first positive gate expands the fleet');
    assert(document.getElementById('bl-msg').textContent.includes('Reinforcements!'),'Live reinforcement message is translated');
  }
  if(id==='ocean-link'){
    var grid=document.getElementById('ol-board');
    assert(grid.querySelectorAll('.ol-tile').length===252,'Ocean Link standard board has 252 tiles');
    assert(!Array.from(grid.querySelectorAll('[aria-label]')).some(tile=>/[\u3400-\u9fff]/.test(tile.getAttribute('aria-label'))),'Ocean Link tile labels are localized');
    document.getElementById('ol-hint').click();await wait();
    assert(grid.querySelectorAll('.ol-hint').length===2,'Ocean Link shows exactly two hint tiles');
    assert(document.getElementById('ol-msg').textContent==='A linkable pair is highlighted.','Ocean Link hint feedback is localized');
    assert(grid.getBoundingClientRect().right<=innerWidth,'Ocean Link board fits the viewport');
    if(innerWidth===390){
      var stage=document.getElementById('ol-stage'), tile=grid.querySelector('.ol-tile');
      var pairs=document.getElementById('ol-left').textContent;
      var rect=grid.getBoundingClientRect(), clock=document.getElementById('ol-clock');
      assert(button.parentElement.id==='ol-toolbar-actions'&&stage.classList.contains('ol-board-focus')&&
        rect.right<=390&&rect.bottom<=innerHeight,'Portrait fallback fits and exit stays in the top controls');
      assert(grid.classList.contains('ol-transposed')&&getComputedStyle(grid).gridTemplateColumns.split(' ').length===16,
        'Ocean Link portrait reflows the short edge horizontally');
      var neighbor=tile.nextElementSibling;
      assert(neighbor.getBoundingClientRect().top>tile.getBoundingClientRect().top&&
        neighbor.getBoundingClientRect().left===tile.getBoundingClientRect().left,'Portrait layout transposes the actual tiles');
      assert(clock.getBoundingClientRect().bottom<=rect.top,'Ocean Link portrait clock stays above the focused board');
      var hinted=grid.querySelectorAll('.ol-hint'), svg=document.getElementById('ol-trace');
      var reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      hinted[0].click();hinted[1].click();
      if(!reduceMotion){
        var points=svg.querySelector('polyline').points;
        assert([points.getItem(0),points.getItem(points.numberOfItems-1)].every(function(point,index){
          var projected=new DOMPoint(point.x,point.y).matrixTransform(svg.getScreenCTM()), bounds=hinted[index].getBoundingClientRect();
          return Math.abs(projected.x-(bounds.left+bounds.width/2))<1&&Math.abs(projected.y-(bounds.top+bounds.height/2))<1;
        }),'Transposed link endpoints still meet the selected tiles');
      }
      await wait(130);
      assert(Number(document.getElementById('ol-left').textContent)===Number(pairs)-1,'Portrait focused mode accepts a real match');
    }
    button.click();await wait();
    assert(!grid.querySelector('.ol-tile')&&button.parentElement.id==='ol-board-actions',
      'One click exits fullscreen and immediately ends the expedition');
    assert(document.getElementById('ol-msg').textContent==='Expedition ended.','Ocean Link ending feedback is localized');
    if(innerWidth===390){
      document.getElementById('ol-mode').value='challenge';
      button.click();await wait();
      var style=getComputedStyle(grid), longBoard=grid.getBoundingClientRect();
      assert(style.gridTemplateColumns.split(' ').length===18&&style.gridTemplateRows.split(' ').length===28&&
        grid.querySelectorAll('.ol-tile').length===416&&longBoard.bottom<=innerHeight,
        'Ocean Link portrait challenge fits a 16-column by 26-row board');
      document.getElementById('ol-full').click();
    }
  }
  if(id==='mines'){
    var board=document.getElementById('board'),tile=board.querySelector('button'),settings=document.querySelector('.mines-settings');
    assert(document.getElementById('mines-mode').getAttribute('aria-pressed')==='false','Flag mode starts off');
    if(matchMedia('(max-width:880px)').matches) {
      assert(settings.getBoundingClientRect().bottom<=board.getBoundingClientRect().top,'Mobile difficulty settings are above the board');
      assert(board.getBoundingClientRect().bottom<=innerHeight,'Default Minesweeper board fits the first mobile screen');
    }
    assert(!view.querySelector('.rules').open,'Minesweeper instructions are collapsed by default');
    tile.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',pointerId:1,isPrimary:true,button:0,clientX:10,clientY:10}));
    await new Promise(function(resolve){setTimeout(resolve,550)});
    tile.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch',pointerId:1}));tile.click();await wait();
    assert(tile.classList.contains('flagged')&&tile.querySelector('svg'),'Long press flags without revealing');
    tile.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'mouse',button:2}));
    tile.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}));await wait();
    assert(!tile.classList.contains('flagged'),'Desktop right-click removes flag');
    assert(button.closest('.mines-actions')&&!button.querySelector('small'),'Minesweeper uses a single action without an entry hint');
  }
  if(matchMedia('(max-width:880px)').matches)assert(innerWidth===390&&document.documentElement.scrollWidth<=390,id+': English game fits a true 390px viewport');
  if(matchMedia('(max-width:880px)').matches&&id==='dream'){
    var sourceLabel=i.sourceText(button),mode=button.dataset.mode;
    document.getElementById('dr-go').textContent='挑戰下一關';document.getElementById('dr-go').dataset.mode='surface';await wait();
    assert(document.getElementById('dr-go').closest('.mobile-stage-action'), 'English next-stage action stays in the mobile stage');
    button.textContent=sourceLabel;button.dataset.mode=mode;await wait();
    assert(button.closest('.side')&&i.sourceText(button)===sourceLabel,'Live Stop action returns to its original panel after the label fixture');
  }
 }
 for(var game of [{id:'cat-match',frame:'cm-frame',button:'hint',inner:true},{id:'dive',frame:'dv-frame',button:'dv-go'},{id:'mrt',frame:'mr-frame',button:'mr-go'},{id:'pancake',frame:'pancake-frame',button:'btn-touch'},{id:'eat-smaller',frame:'es-frame',button:'es-go'},{id:'mirror-twins',frame:'mt-frame',button:'mt-go'},{id:'shadow-relay',frame:'sr-frame',button:'sr-go'},{id:'one-line-defense',frame:'od-frame',button:'od-go'},{id:'tetris',frame:'tt-frame',button:'tt-go'},{id:'quack-pond',frame:'qp-frame',button:'qp-go'},{id:'siege-architect',frame:'sa-frame',button:'goBtn',inner:true}]){
   location.hash=game.id;await wait(250);
   var frame=document.getElementById(game.frame),doc=frame.contentDocument;
   assert(doc&&doc.body,game.id+': same-origin iframe loads');
   assert(!chinese(doc.body).length,game.id+': iframe labels translated '+JSON.stringify(chinese(doc.body)));
   var before=balance();
   if(game.id==='pancake'||game.inner)doc.getElementById(game.button).click();else document.getElementById(game.button).click();
   await wait();
   assert(balance()===before,game.id+': iframe start is free and charges nothing');
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
