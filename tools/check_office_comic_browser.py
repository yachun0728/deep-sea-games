#!/usr/bin/env python3
"""Optional isolated Chromium art/input QA; set OFFICE_QA_URL to local preview URL."""
import base64,json,os,tempfile,time
from pathlib import Path
from check_i18n_browser import Chrome
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'games/office-shoot/design/qa-v2'
URL=os.environ.get('OFFICE_QA_URL','http://127.0.0.1:55682/')
OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def passed(name):checks.append(name);print('PASS '+name,flush=True)
with tempfile.TemporaryDirectory(prefix='office-comic-qa-') as profile:
 c=Chrome('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',Path(profile))
 def ev(code):return c.evaluate(code)
 def shot(name):(OUT/name).write_bytes(base64.b64decode(c.call('Page.captureScreenshot',{'format':'png'},page=True)['data']))
 def wait_for(code,seconds=10):
  deadline=time.monotonic()+seconds
  while time.monotonic()<deadline:
   if ev(code):return
   time.sleep(.05)
  raise AssertionError(code)
 try:
  version=c.call('Browser.getVersion')['product'];print(version,flush=True)
  c.call('Page.enable',page=True)
  c.call('Page.addScriptToEvaluateOnNewDocument',{'source':r'''
window.osErrors=[];window.osDraws=[];window.osHan=[];window.osFrames=[];
addEventListener('error',e=>{if(e.message)window.osErrors.push(e.message)});
const nativeDraw=CanvasRenderingContext2D.prototype.drawImage;
CanvasRenderingContext2D.prototype.drawImage=function(im,...a){
 if(this.canvas.id==='os-canvas'&&im.src){window.osDraws.push({name:im.src.split('/').pop(),args:a,x:this.getTransform().e});if(window.osDraws.length>2500)window.osDraws.splice(0,500);}
 return nativeDraw.call(this,im,...a);
};
const nativeText=CanvasRenderingContext2D.prototype.fillText;
CanvasRenderingContext2D.prototype.fillText=function(s,...a){
 if(this.canvas.id==='os-canvas'&&window.deepSeaI18n&&deepSeaI18n.getLanguage()==='en'&&/[\u3400-\u9fff]/.test(s))window.osHan.push(s);
 return nativeText.call(this,s,...a);
};
let prev=0;function sample(t){if(prev)window.osFrames.push(t-prev);prev=t;if(osFrames.length>500)osFrames.shift();requestAnimationFrame(sample)}requestAnimationFrame(sample);
'''},page=True)
  for w,h in [(390,844),(320,568),(430,760),(768,1024),(1366,900),(844,390)]:
   c.call('Emulation.setDeviceMetricsOverride',{'width':w,'height':h,'deviceScaleFactor':1,'mobile':w<881},page=True)
   c.call('Page.navigate',{'url':URL+'?lang=zh-Hant#office-shoot'},page=True)
   wait_for("document.getElementById('os-go')&&!document.getElementById('view-office-shoot').hidden&&document.getElementById('view-office-shoot').dataset.round==='menu'&&!document.getElementById('os-go').disabled&&osDraws.some(d=>d.name==='office.webp')")
   time.sleep(.15)
   r=ev("""(()=>{const rect=id=>document.getElementById(id).getBoundingClientRect().toJSON();return {visible:!document.getElementById('view-office-shoot').hidden,canvas:rect('os-canvas'),start:rect('os-go'),pause:rect('os-pause'),exit:document.querySelector('#view-office-shoot .fs-exit').getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth}})()""")
   assert r['visible'] and not r['overflow'],r
   for key in ['canvas','start','pause','exit']:
    b=r[key];assert b['left']>=-1 and b['right']<=w+1 and b['top']>=-1 and b['bottom']<=h+1,(key,r)
   assert r['canvas']['height']==h,r
   if not r['start']['width']:print(ev("(()=>{let n=document.getElementById('os-go'),a=[];while(n){a.push({tag:n.tagName,cls:n.className,hidden:n.hidden,display:getComputedStyle(n).display});n=n.parentElement;}return a;})()"),flush=True)
   for key in ['start','pause','exit']:assert r[key]['width']>=44 and r[key]['height']>=44,(key,r)
   shot(f'ready-{w}x{h}.png');passed(f'layout {w}x{h}, full-height scene and controls >=44px')
  c.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True},page=True)
  c.call('Emulation.setTouchEmulationEnabled',{'enabled':True},page=True)
  c.call('Page.navigate',{'url':URL+'?lang=zh-Hant#office-shoot'},page=True)
  wait_for("document.getElementById('os-go')&&!document.getElementById('view-office-shoot').hidden&&document.getElementById('view-office-shoot').dataset.round==='menu'&&!document.getElementById('os-go').disabled&&osDraws.some(d=>d.name==='office.webp')")
  shot('ready-390.png');ev("document.getElementById('os-go').click()")
  wait_for("document.getElementById('view-office-shoot').dataset.round==='play'")
  # Actual CDP touch drag, not a DOM event with invented coordinates.
  def touch(kind,x=None,y=None):
   c.call('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[] if x is None else [{'x':x,'y':y}]},page=True)
  touch('touchStart',300,600);touch('touchMove',45,600);time.sleep(.15);touch('touchEnd')
  time.sleep(3)
  c.call('Input.dispatchMouseEvent',{'type':'mouseMoved','x':195,'y':610},page=True);time.sleep(.25)
  shot('playing-390.png')
  assets=set(ev('osDraws.map(d=>d.name)'));assert {'office.webp','player.webp','crate.webp'}<=assets and assets.intersection({'folder.webp','meeting.webp','paper.webp'}),assets
  assert ev("document.querySelectorAll('#view-office-shoot .stats').length===2")
  assert ev("getComputedStyle(document.querySelector('#view-office-shoot .stats')).display==='none'")
  native=ev("osDraws.filter(d=>d.name==='frame.webp').map(d=>d.args.slice(0,4).join(','))");assert '935,5,592,130' in native,native
  assert ev("osDraws.some(d=>d.name==='footer.webp'&&d.args.slice(0,4).join(',')==='108,61,592,85')")
  assert ev("document.fonts.check('900 22px \"Office Comic TC\"')&&document.fonts.check('900 28px \"Office Comic Latin\"')")
  passed('real start, touch drag, full office art, approved native header/footer, local comic fonts, no duplicate HUD')
  # Exercise all movement cells through actual pointer movement.
  ev('window.osDraws=[]')
  for n in range(14):
   touch('touchStart',195,610);touch('touchMove',40 if n%2 else 350,610);time.sleep(.08);touch('touchEnd')
  frames=set(ev("osDraws.filter(d=>d.name==='walk.webp').map(d=>d.args[0])"));assert len(frames)>=4,frames
  shot('moving-390.png');passed(f'walking played {len(frames)} distinct sprite cells during touch movement')
  ev("document.getElementById('os-pause').click()")
  wait_for("document.getElementById('os-pause').textContent==='▶'")
  shot('paused-390.png');score=ev("document.getElementById('os-score').textContent")
  time.sleep(.5);assert ev("document.getElementById('os-score').textContent")==score
  ev("document.getElementById('os-sound').click()")
  wait_for("document.getElementById('os-sound').textContent==='♫ ×'")
  passed('pause and mute controls')
  ev("deepSeaI18n.setLanguage('en');window.osHan=[]")
  time.sleep(.2);shot('paused-en-390.png');assert ev('osHan.length')==0,ev('osHan')
  ev("document.getElementById('os-pause').click()")
  touch('touchStart',300,600);touch('touchMove',15,600);touch('touchEnd')
  # Leave the work lane undefended and observe the real loss transition.
  wait_for("document.getElementById('view-office-shoot').dataset.round==='over'",25)
  time.sleep(1.2);shot('over-en-390.png');assert ev('osHan.length')==0,ev('osHan')
  assert not ev("document.getElementById('os-go').disabled")
  passed('English running/paused/loss text, natural game-over and replay control')
  ev("document.getElementById('os-go').click()")
  wait_for("document.getElementById('view-office-shoot').dataset.round==='play'")
  ev("location.hash='lobby'");time.sleep(.2);ev("location.hash='office-shoot'");time.sleep(.2)
  assert ev("document.getElementById('os-pause').textContent")=='▶'
  passed('restart and route leave/return pauses the active round')
  errors=ev('osErrors');assert not errors,errors
  frame=ev("(()=>{const a=osFrames.slice(-300).sort((a,b)=>a-b);return {medianMs:a[Math.floor(a.length*.5)],p95Ms:a[Math.floor(a.length*.95)],samples:a.length}})()")
  passed('no JavaScript runtime errors')
  print(json.dumps(frame),flush=True)
  report={'browser':version,'environment':'macOS headless Chromium, CSS device emulation (not physical devices)','checks':checks,'frameIntervals':frame,'errors':errors}
  (OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 finally:c.close()
