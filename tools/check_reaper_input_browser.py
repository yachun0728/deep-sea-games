#!/usr/bin/env python3
"""Optional real Chrome regression checks for Reaper's rapid input and native gestures."""
import argparse,json,tempfile,time,threading
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from check_i18n_browser import Chrome
ROOT=Path(__file__).resolve().parents[1]
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--url');args=parser.parse_args()
 server=None
 if args.url:url=args.url
 else:
  class Handler(SimpleHTTPRequestHandler):
   def log_message(self,*args):pass
  server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)))
  threading.Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/'
 results=[]
 def assert_ok(ok,label):
  results.append({'result':'PASS' if ok else 'FAIL','check':label});print(results[-1],flush=True)
  if not ok:raise AssertionError(label)
 with tempfile.TemporaryDirectory(prefix='reaper-input-') as folder:
  c=Chrome('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',Path(folder))
  def ev(code):return c.evaluate(code)
  def until(code):
   for _ in range(200):
    if ev(code):return True
    time.sleep(.04)
   return False
  def click(x,y,count=1,button='left'):
   for kind in ['mousePressed','mouseReleased']:c.call('Input.dispatchMouseEvent',{'type':kind,'x':x,'y':y,'button':button,'clickCount':count},page=True)
  try:
   c.call('Page.enable',page=True);c.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True},page=True)
   c.call('Emulation.setTouchEmulationEnabled',{'enabled':True,'maxTouchPoints':5},page=True)
   c.call('Page.addScriptToEvaluateOnNewDocument',{'source':"window.__errors=[];addEventListener('error',e=>{if(e.message)__errors.push(e.message)})"},page=True)
   c.call('Page.navigate',{'url':url+'?lang=zh-Hant&v=input-guard#reaper'},page=True)
   assert_ok(until("document.getElementById('rp-go')?.getAttribute('aria-label')==='開始值班'&&!document.getElementById('rp-go').disabled&&!document.getElementById('view-reaper').hidden"),'Artwork ready for real input tests')
   ev("window.__starts=0;const originalStart=deepSeaAnalytics.start;deepSeaAnalytics.start=function(...a){__starts++;return originalStart.apply(this,a)};window.__contextCanceled=false;window.__wheelCanceled=false;document.querySelector('#view-reaper .console').addEventListener('contextmenu',e=>__contextCanceled=e.defaultPrevented);document.querySelector('#view-reaper .console').addEventListener('wheel',e=>__wheelCanceled=e.defaultPrevented,{passive:false})")
   r=ev("document.getElementById('rp-go').getBoundingClientRect().toJSON()")
   x=r['x']+r['width']/2;y=r['y']+r['height']*.66
   click(x,y);click(x,y,2)
   assert_ok(until("document.getElementById('rp-go').dataset.mode==='surface'"),'Double click starts a playable round')
   assert_ok(ev('__starts===1'),'Double click starts exactly one round')
   for n in range(25):click(x,y,1+n%3)
   assert_ok(ev('getSelection().toString()===""'),'Rapid double/triple clicks do not select action text')
   assert_ok(ev('__starts===1'),'Rapid clicks do not restart or duplicate the round')
   assert_ok(ev("getComputedStyle(document.getElementById('rp-canvas')).touchAction==='none'&&getComputedStyle(document.getElementById('rp-action-label')).userSelect==='none'"),'Canvas gestures and action text selection are disabled')
   assert_ok(ev("getComputedStyle(document.getElementById('rp-go')).webkitTapHighlightColor==='rgba(0, 0, 0, 0)'"),'Native blue tap highlight is disabled on the action button')
   before=ev('visualViewport.scale')
   c.call('Input.synthesizePinchGesture',{'x':180,'y':350,'scaleFactor':1.6,'relativeSpeed':800,'gestureSourceType':'touch'},page=True)
   assert_ok(abs(ev('visualViewport.scale')-before)<.01,'Native two-finger pinch does not magnify the game')
   c.call('Input.dispatchMouseEvent',{'type':'mouseWheel','x':180,'y':350,'deltaX':0,'deltaY':-150,'modifiers':2},page=True)
   assert_ok(until('__wheelCanceled'),'Trackpad-style Ctrl-wheel zoom is canceled inside the game')
   click(180,350,1,'right');assert_ok(ev('__contextCanceled'),'Long-press/context menu is canceled inside the game')
   for n in range(10):c.call('Input.dispatchKeyEvent',{'type':'keyDown','code':'Space','key':' ','autoRepeat':n>0},page=True)
   c.call('Input.dispatchKeyEvent',{'type':'keyUp','code':'Space','key':' '},page=True)
   assert_ok(ev('__starts===1&&getSelection().toString()===""'),'Repeated Space keeps one playable round and no selection')
   r=ev("document.querySelector('#view-reaper .fs-exit').getBoundingClientRect().toJSON()")
   click(r['x']+r['width']/2,r['y']+r['height']/2)
   assert_ok(until("location.hash==='#lobby'&&!document.getElementById('view-lobby').hidden"),'Exit remains clickable after rapid input and pinch')
   assert_ok(ev('__errors.length===0'),'No JavaScript errors during input stress test')
   print('PASS:',len(results),'real browser input assertions')
  finally:
   c.close()
   if server:server.shutdown()
if __name__=='__main__':main()
