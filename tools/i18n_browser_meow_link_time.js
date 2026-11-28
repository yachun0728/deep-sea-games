(async()=>{
 const $=id=>document.getElementById(id),checks=[];window.__meowTimeChecks=checks;
 const assert=(v,s)=>{if(!v)throw Error(s);checks.push(s)};
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function until(fn){for(let i=0;i<500;i++){if(fn())return;await wait(10)}throw Error('Timed out waiting for UI')}
 const media=matchMedia;window.matchMedia=q=>q==='(prefers-reduced-motion: reduce)'?{matches:true}:media(q);
 try{
 await until(()=>!$('view-meow-link').hidden && $('ml-leaderboard').querySelector('details')); 
 for(const [mode,pool] of [['easy',12],['standard',24],['challenge',36]]){
  checks.push('Starting '+mode);$('ml-mode').value=mode;$('ml-mode').dispatchEvent(new Event('change'));$('ml-leaderboard').querySelector('details').open=true;$('ml-full').click();
  await until(()=>!$('ml-playfield').hidden&&!$('ml-hint').disabled);
  assert($('ml-rank-status').textContent.includes('排行'),'Ranked start '+mode);
  assert(new Set([...$('ml-board').querySelectorAll('img')].map(n=>n.src)).size===pool,'Exact symbols '+mode);
  for(let level=1;level<=10;level++){
   let count=0;while($('ml-board').querySelector('button')){if(++count>210)throw Error('No solution');$('ml-hint').click();const p=$('ml-board').querySelectorAll('.ml-hint');assert(p.length===2,'Pair '+mode+' '+level);p[0].click();p[1].click();}
   await until(()=>!$('ml-go').disabled);
   assert(!$('ml-result').hidden,'Stage result '+mode+' '+level);
   if(level<10){assert($('ml-rank-status').textContent.includes('全破'),'No premature ranked result');const stopped=$('ml-result-time').textContent;await wait(30);assert($('ml-result-time').textContent===stopped,'Results clock stopped');$('ml-go').click();await until(()=>!$('ml-playfield').hidden&&!$('ml-hint').disabled);}
  }
  assert($('ml-rank-status').textContent.includes('已送到'),'Ten-stage time accepted '+mode);
  assert(/^\d+:\d{2}\.\d{3}$/.test($('ml-best').textContent),'Best is formatted duration '+mode);
  const d=$('ml-leaderboard').querySelector('details');d.open=true;await until(()=>$('ml-leaderboard').querySelector('li'));
  await until(()=>[...$('ml-leaderboard').querySelectorAll('li')].some(n=>n.textContent.includes($('ml-best').textContent)));assert([...$('ml-leaderboard').querySelectorAll('li')].some(n=>n.textContent.includes($('ml-best').textContent)),'Leaderboard matches verified duration '+mode);
  deepSeaI18n.setLanguage('en');await wait(60);assert(!/[\u3400-\u9fff]/.test($('ml-result-title').textContent),'English result');deepSeaI18n.setLanguage('zh-Hant');await wait(60);
  d.open=false;$('ml-full').click();
 }
 location.hash='lobby';await wait(150);
 assert([...$('board-rows').querySelectorAll('tr')].filter(n=>n.textContent.includes('貓咪連連看')).every(n=>/\d+:\d{2}\.\d{3}/.test(n.textContent)&&!n.textContent.includes('Lv ')),'Lobby shows difficulty-specific durations');
 }catch(e){checks.push('FAIL '+e.stack);document.body.dataset.testStatus='FAIL'}
 if(!document.body.dataset.testStatus)document.body.dataset.testStatus='PASS';const result=document.createElement('pre');result.id='test-results';result.hidden=true;result.textContent=JSON.stringify(checks);document.body.appendChild(result);
})();
