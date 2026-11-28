(async()=>{
 const checks=[], $=id=>document.getElementById(id),wait=()=>new Promise(r=>setTimeout(r,40));
 const assert=(v,s)=>{if(!v)throw Error(s);checks.push(s)};
 const media=window.matchMedia.bind(window);window.matchMedia=q=>q==='(prefers-reduced-motion: reduce)'?{matches:true}:media(q);
 const events=[];for(const name of ['start','progress','resume','end']){const original=deepSeaAnalytics[name];deepSeaAnalytics[name]=(...args)=>{events.push({name,args});return original(...args)}}
 function clear(){let guard=0;while($('ml-board').querySelector('button')){if(++guard>250)throw Error('pair loop');$('ml-hint').click();const pair=$('ml-board').querySelectorAll('.ml-hint');assert(pair.length===2,'Hint gives a pair');pair[0].click();pair[1].click();}}
 try{
 await wait();assert(getComputedStyle(document.querySelector('.wallet-box')).display==='none','Wallet is hidden');assert([...document.querySelectorAll('.game-card-bonus')].every(n=>getComputedStyle(n).display==='none'),'All lobby BONUS badges hidden');assert([...document.querySelectorAll('.game-card')].every(n=>!/BONUS/i.test(n.getAttribute('aria-label'))),'Accessible card labels hide BONUS too');assert(getComputedStyle($('gold-float')).display==='none','Points-only daily supply shortcut hidden');
 const storedBefore=localStorage.getItem('crush-depth-balance');const probe=document.createElement('p');probe.textContent='Score 120. BONUS +5 points. Continue matching.';document.body.appendChild(probe);await wait();assert(probe.textContent==='Score 120. Continue matching.','Point reward clauses hidden while gameplay and score remain');assert(localStorage.getItem('crush-depth-balance')===storedBefore,'Visibility layer does not mutate wallet');probe.remove();
 assert(!$('view-meow-link').hidden,'Direct hash opens Meow Link');assert(document.querySelectorAll('.lobby-grid .game-card:not([data-game-hidden])')[3].hash==='#meow-link','Meow Link occupies fourth lobby card');
 const oldBest=localStorage.getItem('deep-sea-ocean-link-best-v1');
 $('ml-mode').value='easy';$('ml-full').click();for(let i=0;i<120&&$('ml-playfield').hidden;i++)await wait();
 assert(!$('ml-playfield').hidden,'Easy starts free');assert($('ml-board').querySelectorAll('button').length===48,'Easy board contains 48 tiles');
 assert(new Set([...$('ml-board').querySelectorAll('img')].map(n=>n.src)).size===12,'Easy pool contains 12 types');
 const before=[...$('ml-board').querySelectorAll('button')].map(n=>n.dataset.cell+':'+n.querySelector('img').src).join();
 deepSeaI18n.setLanguage('zh-Hant');await wait();deepSeaI18n.setLanguage('en');await wait();
 assert([...$('ml-board').querySelectorAll('button')].map(n=>n.dataset.cell+':'+n.querySelector('img').src).join()===before,'Live language switching preserves board');
 assert(!/[\u3400-\u9fff]/.test($('ml-hint').textContent),'Hint translated');
 assert([...$('ml-board').querySelectorAll('button')].every(n=>!/[\u3400-\u9fff]/.test(n.getAttribute('aria-label'))),'All tile accessible names translated');
 for(let level=1;level<=10;level++){clear();await wait();if([3,6,10].includes(level))assert(!/BONUS|earned.*points/i.test(document.body.innerText),'Visible result contains no point reward');assert(!$('ml-result').hidden,'Stage '+level+' result');if(level<10){$('ml-go').click();$('ml-go').click();assert($('ml-level').textContent===String(level+1),'Next level only advances once');}}
 assert($('ml-best').textContent==='10','Easy best persisted');assert($('ml-bonus').textContent==='15','Milestones award total 15');
 const progress=events.filter(e=>e.name==='progress');assert(progress.length===10,'Exactly 10 progress events');assert(progress.filter(e=>e.args[1].bonus_points===5).length===3,'Exactly three 5-point milestone awards');assert(events.filter(e=>e.name==='end').length===1,'One settlement for completed expedition');assert(events.find(e=>e.name==='end').args[1]===15,'Analytics payout is 15');
 assert(localStorage.getItem('deep-sea-ocean-link-best-v1')===oldBest,'Ocean Link save untouched');
 $('ml-full').click();
 for(const [mode,count,pool] of [['standard',252,24],['challenge',416,36]]){ $('ml-mode').value=mode;$('ml-full').click();await wait();for(let i=0;i<150&&[...$('ml-board').querySelectorAll('img')].some(n=>!n.complete);i++)await wait();assert([...$('ml-board').querySelectorAll('img')].every(n=>n.complete&&n.naturalWidth>0),mode+' all asset images loaded');assert($('ml-board').querySelectorAll('button').length===count,mode+' dimensions');assert(new Set([...$('ml-board').querySelectorAll('img')].map(n=>n.src)).size===pool,mode+' symbol pool');$('ml-full').click();}
 $('ml-mode').value='easy';$('ml-full').click();for(let i=0;i<120&&$('ml-playfield').hidden;i++)await wait();
 for(let i=0;i<100&&[...$('ml-board').querySelectorAll('img')].some(n=>!n.complete);i++)await wait();
 assert([...$('ml-board').querySelectorAll('img')].every(n=>n.complete&&n.naturalWidth>0),'All visible images loaded');
 assert($('ml-rank-status').textContent.includes('locally'),'Network-unavailable ranked start falls back to local play');
 assert(document.documentElement.scrollWidth<=innerWidth,'No horizontal page overflow');
 const b=$('ml-board').getBoundingClientRect();assert(b.left>=-1&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1,'Board fits viewport');
 assert($('ml-hint').getBoundingClientRect().height>=44,'Main buttons meet 44px target');
 }catch(e){checks.push('FAIL: '+e.message);document.body.dataset.testStatus='FAIL'}
 if(!document.body.dataset.testStatus)document.body.dataset.testStatus='PASS';const result=document.createElement('pre');result.id='test-results';result.hidden=true;result.textContent=JSON.stringify(checks);document.body.appendChild(result);
})();
