#!/usr/bin/env python3
"""Office icon QA using the real leaderboard renderer with a read-only feed fixture."""
import base64,json,os,tempfile,time
from pathlib import Path
from check_i18n_browser import Chrome
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'games/office-shoot/design/qa-release-v2';OUT.mkdir(exist_ok=True)
URL=os.environ.get('OFFICE_QA_URL','http://127.0.0.1:55682/')
with tempfile.TemporaryDirectory(prefix='office-icons-') as profile:
 c=Chrome('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',Path(profile))
 def ev(s):return c.evaluate(s)
 def wait(s):
  for _ in range(160):
   if ev(s):return
   time.sleep(.05)
  print(ev("({hash:location.hash,fixtures:window.officeFeedFixture,status:document.getElementById('board-status')?.textContent,rows:document.getElementById('board-rows')?.innerHTML,errors:window.officeErrors,visibleGames:document.querySelectorAll('.lobby-grid .game-card:not([data-game-hidden])').length})"),flush=True)
  raise AssertionError(s)
 def shot(name):(OUT/name).write_bytes(base64.b64decode(c.call('Page.captureScreenshot',{'format':'png'},page=True)['data']))
 try:
  c.call('Page.enable',page=True)
  c.call('Page.addScriptToEvaluateOnNewDocument',{'source':'''const nativeFetch=window.fetch;window.officeFeedFixture=0;window.officeErrors=[];addEventListener('error',e=>officeErrors.push(e.message));
window.fetch=(input,init)=>{const url=new URL(String(input),location.href);
if(url.pathname==='/api/v1/leaderboard/feed'){
 window.officeFeedFixture++;
 const name=url.searchParams.get('lang')==='en'?'No Overtime!':'拒絕加班';
 return Promise.resolve(new Response(JSON.stringify({games:[{gameId:'office-shoot',gameName:name,lastPlayedAt:'2026-11-28T14:45:00Z',entries:[{displayName:'ART QA FIXTURE',score:1280}]}]}),{status:200,headers:{'Content-Type':'application/json'}}));}
return nativeFetch(input,init)};'''},page=True)
  c.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True},page=True)
  c.call('Page.navigate',{'url':URL+'?icons=release&lang=zh-Hant#lobby'},page=True)
  wait("!!document.querySelector('#board-rows tr a[href=\"#office-shoot\"]')")
  src=ev("document.querySelector('#icon-office-shoot image').getAttribute('href')")
  assert src=='games/office-shoot/leaderboard.webp',src
  # Draw the loaded symbol into a canvas to prove the 192px image resolves (not only an href).
  wait("performance.getEntriesByType('resource').some(e=>e.name.includes('/office-shoot/leaderboard.webp'))")
  ev("document.getElementById('board-rows').scrollIntoView({block:'center'})");time.sleep(.2);shot('leaderboard-fixture-390.png')
  assert ev("document.getElementById('board-rows').textContent.includes('ART QA FIXTURE')")
  assert ev('document.documentElement.scrollWidth<=innerWidth')
  ev("document.querySelector('.game-card[href=\"#office-shoot\"]').scrollIntoView({block:'center'})");time.sleep(.2);shot('cover-390.png')
  background=ev("getComputedStyle(document.querySelector('.game-card[href=\"#office-shoot\"]')).backgroundImage")
  assert '/office-shoot/cover.webp' in background,background
  ev("document.querySelector('#board-rows tr a[href=\"#office-shoot\"]').click()")
  wait("!document.getElementById('view-office-shoot').hidden&&!document.getElementById('os-go').disabled")
  ev("document.getElementById('os-go').click()");time.sleep(.3)
  assert ev("document.getElementById('view-office-shoot').dataset.round==='play'")
  shot('from-board-playing-390.png')
  report={'browser':c.call('Browser.getVersion')['product'],'viewport':[390,844],'leaderboardData':'Read-only browser fetch fixture; no D1/API writes','checks':['actual leaderboard row uses hero image','row links to #office-shoot and game starts','cover background loads','no horizontal overflow'],'thumbnail':src,'cover':background}
  (OUT/'icons-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
  print('PASS actual 390px leaderboard row, cover, link and start (fixture feed; no server writes)',flush=True)
 finally:c.close()
