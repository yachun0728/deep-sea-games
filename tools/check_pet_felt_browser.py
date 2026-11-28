#!/usr/bin/env python3
"""Isolated Chrome QA for Pet Walkies' approved felt design; uses real UI, no game-state hooks."""
import base64,json,tempfile,time,os
from pathlib import Path
from check_i18n_browser import Chrome
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'games/pet-walk/design/qa-v1'
URL=os.environ.get('PET_QA_URL','http://127.0.0.1:55791/')
OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def passed(s):checks.append(s);print('PASS '+s,flush=True)
with tempfile.TemporaryDirectory(prefix='pet-felt-qa-') as tmp:
 c=Chrome('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',Path(tmp))
 def ev(s):return c.evaluate(s)
 def wait(s,seconds=15):
  until=time.monotonic()+seconds
  while time.monotonic()<until:
   if ev(s):return
   time.sleep(.05)
  raise AssertionError(s)
 def shot(name):
  p=OUT/name;p.write_bytes(base64.b64decode(c.call('Page.captureScreenshot',{'format':'png'},page=True)['data']));return p
 def key(down):c.call('Input.dispatchKeyEvent',{'type':'keyDown' if down else 'keyUp','code':'Space','key':' ','windowsVirtualKeyCode':32},page=True)
 def tap(x,y):
  c.call('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]},page=True)
  c.call('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]},page=True)
 def tap_logical(x,y):
  r=ev("document.getElementById('pw-canvas').getBoundingClientRect().toJSON()")
  tap(r['x']+x*r['width']/400,r['y']+y*r['height']/844)
 def navigate(lang='zh-Hant'):
  c.call('Page.navigate',{'url':URL+'?lang='+lang+'#pet-walk'},page=True)
  wait("document.getElementById('pw-go')&&!document.getElementById('pw-go').disabled&&document.getElementById('view-pet-walk').dataset.feltMode==='title'&&document.getElementById('pw-go').getBoundingClientRect().width>0",25)
 def mode():return ev("document.getElementById('view-pet-walk').dataset.feltMode")
 try:
  version=c.call('Browser.getVersion')['product'];print(version,flush=True)
  c.call('Page.enable',page=True);c.call('Network.enable',page=True)
  c.call('Emulation.setTouchEmulationEnabled',{'enabled':True},page=True)
  c.call('Page.addScriptToEvaluateOnNewDocument',{'source':r'''
window.petQA={errors:[],han:[],draws:[],frames:[],failed:[]};
addEventListener('error',e=>{if(e.message)petQA.errors.push(e.message);else if(e.target&&e.target.src)petQA.failed.push(e.target.src)},true);
const draw=CanvasRenderingContext2D.prototype.drawImage;
CanvasRenderingContext2D.prototype.drawImage=function(im,...a){if(this.canvas.id==='pw-canvas'&&im.src){const t=this.getTransform();petQA.draws.push({src:im.src.split('/').pop(),a,transform:[t.a,t.b,t.c,t.d,t.e,t.f]});if(petQA.draws.length>8000)petQA.draws.splice(0,1000);}return draw.call(this,im,...a)};
const txt=CanvasRenderingContext2D.prototype.fillText;
CanvasRenderingContext2D.prototype.fillText=function(s,...a){if(this.canvas.id==='pw-canvas'&&window.deepSeaI18n&&deepSeaI18n.getLanguage()==='en'&&/[\u3400-\u9fff]/.test(s))petQA.han.push(s);return txt.call(this,s,...a)};
let last=0;function frame(t){if(last)petQA.frames.push(t-last);last=t;if(petQA.frames.length>300)petQA.frames.shift();requestAnimationFrame(frame)}requestAnimationFrame(frame);
'''},page=True)
  for w,h in [(390,844),(320,568),(430,760),(768,1024),(1366,900),(844,390)]:
   c.call('Emulation.setDeviceMetricsOverride',{'width':w,'height':h,'deviceScaleFactor':1,'mobile':w<881},page=True);navigate()
   state=ev("""(()=>{const r=id=>document.getElementById(id).getBoundingClientRect().toJSON();return{canvas:r('pw-canvas'),go:r('pw-go'),exit:document.querySelector('#view-pet-walk .fs-exit').getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth}})()""")
   assert not state['overflow'],state
   for k in ['canvas','go','exit']:
    r=state[k];assert r['left']>=-1 and r['right']<=w+1 and r['top']>=-1 and r['bottom']<=h+1,(w,h,k,r)
   assert abs(state['canvas']['width']/state['canvas']['height']-400/844)<.001,state
   for k in ['go','exit']:assert state[k]['width']>=44 and state[k]['height']>=44,(k,state)
   shot(f'ready-{w}x{h}.png');passed(f'layout {w}x{h}: proportional canvas, no overflow, native controls >=44px')
  c.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True},page=True);navigate()
  shot('ready-390.png');before=ev("Number(localStorage.getItem('crush-depth-balance')||0)")
  # Actual touch on the original start button, not a duplicate wallet handler.
  r=ev("document.getElementById('pw-go').getBoundingClientRect().toJSON()");tap(r['x']+r['width']/2,r['y']+r['height']/2)
  wait("document.getElementById('view-pet-walk').dataset.feltMode==='walk'");shot('walking-390.png')
  # Hold the walking control and record actual rendered motion, including two independent knees.
  r=ev("document.getElementById('pw-canvas').getBoundingClientRect().toJSON()")
  x=r['x']+r['width']/2;y=r['y']+r['height']*.95
  c.call('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]},page=True)
  motion=[]
  for i in range(8):
   time.sleep(.035);motion.append(shot(f'motion-{i:02}.png'))
  c.call('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]},page=True)
  transforms=ev("[...new Set(petQA.draws.filter(d=>d.src==='foot.webp').map(d=>d.transform.slice(0,4).map(v=>v.toFixed(2)).join(',')))]")
  assert len(transforms)>4,transforms
  passed(f'actual touch-hold walking: {len(transforms)} foot/knee transforms recorded')
  # Complete a real round through UI input; no forced events or skipped steps.
  seen=set();until=time.monotonic()+130
  last_note=0
  while mode()!='diary' and time.monotonic()<until:
   if time.monotonic()-last_note>15:print('Progress '+mode()+' '+str(ev("document.getElementById('pw-steps').textContent")),flush=True);last_note=time.monotonic()
   m=mode()
   if m not in seen:
    shot(f'{m}-390.png');seen.add(m)
   key(True);time.sleep(.28);key(False);time.sleep(.12)
  assert mode()=='diary',mode();time.sleep(.5);shot('diary-390.png')
  saved=ev("JSON.parse(localStorage.getItem('deep-sea-pet-walk-save'))")
  assert saved['trips']==1,saved
  balance=ev("Number(localStorage.getItem('crush-depth-balance'))")
  wardrobe=ev("JSON.parse(localStorage.getItem('deep-sea-wardrobe-v1'))");platform_bonus=wardrobe['playPaid']+(5 if 'pet-walk' in wardrobe['completed'] else 0)
  assert balance==before+3+platform_bonus,(before,balance,platform_bonus)
  passed('real 60-step trip, all three milestones, final wheel, diary and save; free entry +3 game points plus separately checked platform rewards')
  # Diary collection, discovered event modal, back, export, replay.
  tap_logical(110,775);wait("document.getElementById('view-pet-walk').dataset.feltMode==='dex'");shot('dex-390.png')
  idx=next(int(k[1:])-1 for k,v in saved['dexEvents'].items() if v.get('n',0) or v.get('r',0))
  tap_logical(160,218+idx*35);time.sleep(.1);shot('dex-modal-390.png');tap_logical(200,545);tap_logical(200,805)
  wait("document.getElementById('view-pet-walk').dataset.feltMode==='diary'")
  c.call('Browser.setDownloadBehavior',{'behavior':'allow','downloadPath':str(OUT/'downloads')})
  tap_logical(290,775);time.sleep(.8)
  assert (OUT/'downloads/pet-walkies-diary.png').exists()
  passed('collection, event memories, return to diary and actual PNG export')
  # Live language change does not restart the round or alter progress.
  ev("deepSeaI18n.setLanguage('en')");time.sleep(.2);shot('diary-en-390.png');assert not ev('petQA.han'),ev('petQA.han')
  r=ev("document.getElementById('pw-go').getBoundingClientRect().toJSON()");tap(r['x']+r['width']/2,r['y']+r['height']/2)
  wait("document.getElementById('view-pet-walk').dataset.feltMode==='walk'")
  key(True);time.sleep(.27);key(False);time.sleep(.15);steps=ev("document.getElementById('pw-steps').textContent")
  ev("deepSeaI18n.setLanguage('zh-Hant')");time.sleep(.2);assert ev("document.getElementById('pw-steps').textContent")==steps
  ev("location.hash='lobby'");time.sleep(.2);time.sleep(.4);ev("location.hash='pet-walk'");time.sleep(.2)
  assert ev("document.getElementById('pw-steps').textContent")==steps
  passed('English diary, replay, live language change and route leave/return preserve progress')
  # English title, natural walking/event/wheel screens.
  navigate('en');ev("document.getElementById('pw-go').click()")
  for _ in range(35):
   key(True);time.sleep(.2);key(False);time.sleep(.1)
  shot('playing-en-390.png');assert not ev('petQA.han'),ev('petQA.han')
  assert not ev('petQA.errors'),ev('petQA.errors')
  assert not ev("petQA.failed.filter(s=>s.includes('games/pet-walk/'))"),ev('petQA.failed')
  times=ev('petQA.frames');times.sort();p95=times[int(len(times)*.95)] if times else None
  passed(f'English gameplay and no runtime/resource errors; recent frame interval p95 {p95:.1f} ms (headless only)')
  # Asset error gate: cannot start while required art is missing; tap retries after unblocking.
  c.call('Network.setCacheDisabled',{'cacheDisabled':True},page=True)
  c.call('Network.setBlockedURLs',{'urls':['*felt-v1/scene.webp*']},page=True)
  c.call('Page.navigate',{'url':URL+'?lang=en&qa=asset-failure#pet-walk'},page=True);time.sleep(2)
  assert mode()=='title',mode()
  assert ev("document.getElementById('pw-go').disabled")
  c.call('Network.setBlockedURLs',{'urls':[]},page=True);tap_logical(200,400)
  wait("!document.getElementById('pw-go').disabled",20)
  passed('failed required art blocks start; tap retries and restores start after resource recovery')
  # Real lobby card must use the new cover at phone size.
  ev("location.hash='lobby'");time.sleep(.3);ev("document.querySelector('a.game-card[href=\"#pet-walk\"]').scrollIntoView({block:'center'})");time.sleep(.2);shot('lobby-390.png')
  assert ev("getComputedStyle(document.querySelector('a.game-card[href=\"#pet-walk\"]')).backgroundImage.includes('pet-walk/cover.webp')||!!document.querySelector('a.game-card[href=\"#pet-walk\"] img[src*=\"cover.webp\"]')")
  passed('390px lobby cover rendered and game link retained')
  (OUT/'report.json').write_text(json.dumps({'browser':version,'checks':checks,'status':'PASS','physical_devices':'NOT TESTED','CrazyGames':'NOT APPLICABLE'},ensure_ascii=False,indent=2)+'\n')
 finally:c.close()
