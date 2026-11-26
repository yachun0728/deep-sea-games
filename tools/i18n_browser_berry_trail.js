(async function () {
 const results=[],wait=ms=>new Promise(r=>setTimeout(r,ms));
 function check(value,label){if(!value)throw new Error(label);results.push(label);}
 try{
  location.hash='berry-trail';
  const frame=document.getElementById('bt-frame');
  for(let i=0;i<100&&!frame.contentWindow.setBerryLanguage;i++)await wait(30);
  const child=frame.contentWindow,doc=child.document;
  check(!!child.setBerryLanguage,'Same-origin game loaded');
  const status=document.getElementById('bt-rank-status'),retry=document.getElementById('bt-rank-retry');
  for(const text of ['成績已送到排行榜。','排行榜連線失敗']){status.textContent=text;status.hidden=false;retry.hidden=false;check(getComputedStyle(status).display==='none'&&getComputedStyle(retry).display==='none','Ranking status never adds UI: '+text);}
  retry.hidden=true;
  const touch=innerWidth<=880||matchMedia('(pointer:coarse)').matches;
  check((child.getComputedStyle(doc.querySelector('.pad')).display==='none')===touch,'Swipe-only controls on handheld; desktop controls preserved');
  for(const language of ['zh-Hant','en','zh-Hans','zh-Hant']){
   deepSeaI18n.setLanguage(language);await wait(60);
   check(doc.documentElement.lang===language,'Language follows '+language);
   check(doc.getElementById('title').textContent===(language==='en'?'Berry Trail':'莓果小蛇'),'Localized title '+language);
   check(doc.documentElement.scrollWidth<=child.innerWidth,'No horizontal overflow '+language);
  }
  doc.getElementById('start').click();await wait(150);
  check(child.eval('state')==='running','Starts without wallet funds');
  doc.getElementById('pause').click();check(child.eval('state')==='paused','Pause button pauses');
  deepSeaI18n.setLanguage('en');await wait(60);
  check(doc.getElementById('start').textContent==='Resume','Paused action updates to English');
  doc.getElementById('start').click();check(child.eval('state')==='running','Resume action works');
  child.dispatchEvent(new child.KeyboardEvent('keydown',{code:'KeyW',bubbles:true,cancelable:true}));
  check(child.eval('model.next')===0,'Physical WASD key turns');
  child.dispatchEvent(new child.Event('blur'));check(child.eval('state')==='paused','Blur pauses');
  location.hash='lobby';await wait(60);check(child.eval('state')==='ready','Leaving abandons and resets round');
  location.hash='berry-trail';await wait(60);check(!document.getElementById('view-berry-trail').hidden,'Direct hash reopens game');
  document.body.dataset.testStatus='PASS';
 }catch(e){document.body.dataset.testStatus='FAIL';results.push(e.stack);}
 finally{const el=document.createElement('pre');el.id='test-results';el.setAttribute('data-i18n-ignore','');el.textContent=JSON.stringify(results);el.hidden=true;document.body.append(el);}
})();
