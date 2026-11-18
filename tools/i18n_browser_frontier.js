(async function(){
 var results=[],errors=[],t=window.__frontierTest,I=window.deepSeaI18n;
 window.addEventListener('error',function(e){errors.push(e.message);});
 function assert(ok,msg){if(!ok)throw new Error(msg);results.push(msg);}
 function wait(ms){return new Promise(function(r){setTimeout(r,ms||75);});}
 function click(id){document.getElementById(id).click();}
 function balance(){return Number(document.getElementById('balance').textContent.replace(/,/g,''));}
 function untranslated(){var texts=[],v=document.getElementById('view-frontier'),walk=document.createTreeWalker(v,NodeFilter.SHOW_TEXT),n;while(n=walk.nextNode())if(/[\u3400-\u9fff]/.test(n.nodeValue))texts.push(n.nodeValue);return texts;}
 function tick(w,seconds,input){for(var n=0;n<Math.ceil(seconds/.05);n++)t.step(w,input||{x:0,y:0},.05);}
 function neutral(w){w.enemies.forEach(function(e){e.hp=0;});tick(w,.05);}
 function build(w,k){var b=w.buildings.find(function(b){return b.kind===k;});w.bank.wood=w.bank.stone=10000;w.p.x=b.x;w.p.y=b.y;tick(w,12);return b.built;}
 try{
  await wait();assert(!!t,'Test adapter only exists in the instrumented page');
  Array.from(document.scripts).forEach(function(s){if(s.src)return;if(s.type==='application/json')JSON.parse(s.textContent);else new Function(s.textContent);});assert(true,'All executable scripts parse and JSON scripts decode');
  assert(location.hash==='#frontier'&&!document.getElementById('view-frontier').hidden,'Direct hash opens Frontier');
  var probe=new URLSearchParams(location.search).get('probe');
  if(probe==='low'){
   var low=balance();click('ft-go');await wait();assert(low===0&&balance()===0&&!!t.world(),'Zero balance starts without charge');
  }else if(probe==='reload'){
   assert(t.world()&&t.world().level===2&&t.world().bank.wood===77,'Reload restores stage and materials');assert(I.getLanguage()==='zh-Hant','Saved Chinese preference survives reload');var saved=balance();click('ft-go');await wait();assert(balance()===saved,'Reload continuation is free');click('ft-pause');
  }else{
   var events=[],A=window.deepSeaAnalytics;['start','progress','resume','end'].forEach(function(k){var fn=A[k];A[k]=function(){events.push({k:k,args:Array.from(arguments)});return fn.apply(A,arguments);};});
   var before=balance();click('ft-go');click('ft-go');await wait();assert(balance()===before,'Double start charges exactly once');assert(events.filter(function(e){return e.k==='start';}).length===1,'One start event per attempt');
   click('ft-shop-toggle');await wait();assert(!document.getElementById('ft-shop').hidden,'Equipment and trading drawer opens inside game');click('ft-shop-close');await wait();assert(document.getElementById('ft-shop').hidden,'Drawer closes without restarting');
   if(innerWidth<=600&&innerHeight>innerWidth){
    assert(!document.getElementById('ft-rotate').hidden,'Portrait handheld shows rotation prompt');
    assert(document.getElementById('ft-title').textContent.length>0,'Portrait game remains safely paused');
    assert(getComputedStyle(document.querySelector('.game-toolbar')).display==='none','Immersive mode hides platform navigation');
    click('ft-rotate-exit');await wait();assert(document.getElementById('ft-rotate').hidden,'Rotation prompt can exit immersive mode');
    assert(document.documentElement.scrollWidth<=innerWidth,'Portrait layout fits CSS viewport');
    document.body.dataset.testStatus='PASS';var portraitOut=document.createElement('pre');portraitOut.id='test-results';portraitOut.setAttribute('data-i18n-ignore','');portraitOut.textContent=JSON.stringify(results,null,2);document.body.appendChild(portraitOut);return;
   }
   if(innerWidth>innerHeight&&innerWidth<=1100){click('ft-full');await wait();assert(!!document.fullscreenElement||document.getElementById('ft-main').classList.contains('ft-immersive'),'Landscape viewport enters fullscreen or fallback');}
   assert(document.getElementById('ft-map').children.length===50,'All 50 stage buttons exist');
   var w=t.world(),tm=w.time,x=w.p.x;document.getElementById('ft-canvas').focus();document.getElementById('ft-canvas').dispatchEvent(new KeyboardEvent('keydown',{key:'d',bubbles:true}));await wait(220);document.getElementById('ft-canvas').dispatchEvent(new KeyboardEvent('keyup',{key:'d',bubbles:true}));assert(w.p.x>x+10,'Keyboard movement updates player position');
   I.setLanguage('zh-Hant');await wait();I.setLanguage('en');await wait();assert(balance()===before&&t.world()===w,'Live language switch preserves world and points');assert(!untranslated().length,'English UI covers live and hidden labels: '+JSON.stringify(untranslated()));
   assert(!window.__untranslatedCanvas.length,'Canvas labels translated');assert(document.documentElement.scrollWidth<=innerWidth,'Layout fits actual CSS viewport');
   click('ft-pause');var stopped=w.time;await wait(160);assert(w.time===stopped,'Manual pause freezes simulation');click('ft-go');await wait();assert(w.time>stopped,'Resume continues same stage');
   location.hash='lobby';await wait();stopped=w.time;await wait(160);assert(w.time===stopped,'Lobby route pauses game');location.hash='frontier';await wait();assert(w.time===stopped,'Return route waits for manual resume');
   document.getElementById('ft-canvas').dispatchEvent(new KeyboardEvent('keydown',{key:'d',bubbles:true}));assert(w.time===stopped,'Paused input cannot restart game');click('ft-go');await wait();
   window.dispatchEvent(new Event('blur'));stopped=w.time;await wait(160);assert(w.time===stopped,'Blur pauses and releases held input');click('ft-go');await wait();
   // Simulate two independent touch pointers using the real pointer handlers.
   var pad=document.getElementById('ft-stick'),r=pad.getBoundingClientRect(),capture=pad.setPointerCapture;pad.setPointerCapture=function(){};
   pad.dispatchEvent(new PointerEvent('pointerdown',{pointerId:7,clientX:r.left+r.width/2+30,clientY:r.top+r.height/2,bubbles:true}));
   var dashButton=document.getElementById('ft-dash');dashButton.dispatchEvent(new PointerEvent('pointerdown',{pointerId:8,bubbles:true}));await wait(100);assert(w.p.dash>0,'Separate dash pointer works while joystick is held');
   pad.dispatchEvent(new PointerEvent('pointercancel',{pointerId:7,bubbles:true}));pad.setPointerCapture=capture;var px=w.p.x;await wait(150);assert(w.p.x===px,'Cancelled joystick stops movement');
   // Single settlement and free retry.
   w.tech.blade=2;w.p.hp=0;w.phase='dead';t.finish();t.finish();var ends=events.filter(function(e){return e.k==='end';});assert(ends.length===1&&ends[0].args[1]===0,'Repeated failure callback ends exactly once without payout');
   click('ft-go');await wait();assert(balance()===before&&t.world().tech.blade===2&&t.world().level===1,'Retry is free and retains technology');
   t.world().phase='clear';t.finish();t.finish();click('ft-go');await wait();assert(t.world().level===2&&balance()===before,'Next stage unlocks and starts free');
   click('ft-pause');t.world().bank.wood=77;t.persist();I.setLanguage('zh-Hant');await wait();
   // Pure simulation behavior, every stage's objective and beacon gates.
   for(var level=1;level<=50;level++){
    var q=t.create(level),cfg=q.cfg;
    assert(q.nodes.some(function(n){return n.x<530&&n.kind==='stone';})&&q.nodes.some(function(n){return n.x<530&&n.kind==='wood';}),'Stage '+level+' has accessible renewable supplies');
    q.p.x=q.buildings[5].x;q.p.y=q.buildings[5].y;q.bank.wood=q.bank.stone=10000;q.p.inv=1000;tick(q,2);assert(!q.buildings[5].built,'Stage '+level+' beacon rejects premature completion');
    q.raidAt=1e6;q.camps.forEach(function(c){c.hp=0;});neutral(q);['house','market','mill'].concat(cfg.chapter>0?['depot']:[]).forEach(function(k){build(q,k);});q.camps.forEach(function(c){c.hp=0;});assert(build(q,'bridge'),'Stage '+level+' bridge construction completes');
    if(cfg.mission==='rescue'){q.p.x=q.cages[0].x;q.p.y=q.cages[0].y;tick(q,.1);q.p.x=q.cages[1].x;q.p.y=q.cages[1].y;tick(q,.1);}
    if(cfg.mission==='defend'){build(q,'tower');for(var n=0;n<1900&&!t.goal(q);n++){neutral(q);tick(q,.05);}}
    assert(t.goal(q),'Stage '+level+' objective is completable');assert(build(q,'beacon')&&q.phase==='play'&&t.leave(q)&&q.phase==='clear','Stage '+level+' completes via construction');
   }
   var q=t.create(1);q.nodes=[{x:100,y:320,kind:'stone',left:6,cool:0,respawn:0}];q.p.x=100;q.p.y=320;tick(q,5);assert(q.bag.stone===6,'Harvesting transfers finite node yield');q.p.x=400;tick(q,16);assert(q.nodes[0].left===6,'Exhausted resources regenerate');q.bag.wood=18;q.p.x=100;q.p.y=320;tick(q,8);assert(q.bag.wood+q.bag.stone===24,'Pack capacity is enforced');q.p.x=180;q.p.y=450;tick(q,.1);assert(!q.bag.wood&&!q.bag.stone&&q.bank.wood===18,'Camp deposits carried resources');
   q.coins=25;q.bank.wood=20;q.bank.stone=13;assert(t.upgrade(q,'blade')&&q.tech.blade===1&&q.coins===0&&q.bank.wood===20&&q.bank.stone===13,'Upgrade deducts exact gold, keeping resources');assert(!t.upgrade(q,'blade'),'Unaffordable upgrade is rejected');q.p.hp=30;tick(q,8);assert(Math.abs(q.p.hp-65)<.01&&q.heal===0,'Camp healing is capped at 35 per stage');
   q=t.create(50);q.buildings[3].built=true;q.p.x=900;q.p.y=450;var hp=q.p.hp;tick(q,45);assert(q.phase==='dead'&&q.p.hp===0,'Standing still in late combat is lethal');
   q=t.create(1);q.enemies=[];q.time=10000;tick(q,.1);assert(q.phase==='play'&&q.threat===4,'Night pressure is capped without a timeout loss');
   q=t.create(10);q.enemies=[q.enemies.find(function(e){return e.type==='boss';})];q.buildings[3].built=true;q.p.x=1040;q.p.y=450;q.p.attack=100;var hp=q.p.hp;tick(q,.5);assert(q.p.hp===hp,'Boss warning deals no early damage');tick(q,3);assert(q.p.hp<hp,'Boss telegraphed strike deals damage');
   q=t.create(10);q.enemies=[q.enemies.find(function(e){return e.type==='boss';})];q.buildings[3].built=true;q.p.x=1040;q.p.y=450;q.p.attack=100;tick(q,.6);q.p.x=800;q.p.y=700;tick(q,1.5);assert(q.p.hp===100,'Leaving the marked attack area avoids damage');
   q=t.create(21);q.enemies=[];q.buildings[3].built=true;q.p.x=800;q.p.y=240;q.time=6;tick(q,1);assert(q.p.hp===100,'Ground hazard warning is harmless');tick(q,.4);assert(q.p.hp<100,'Ground hazard activates after its warning');
   assert(t.plan(50).damage>t.plan(1).damage&&t.plan(50).windup<t.plan(1).windup,'Late stages hit harder with shorter readable warnings');
   assert(!errors.length,'No browser runtime errors: '+JSON.stringify(errors));
  }
  document.body.dataset.testStatus='PASS';
 }catch(e){results.push('FAIL: '+e.stack);document.body.dataset.testStatus='FAIL';}
 var out=document.createElement('pre');out.id='test-results';out.setAttribute('data-i18n-ignore','');out.textContent=JSON.stringify(results,null,2);document.body.appendChild(out);
})();
