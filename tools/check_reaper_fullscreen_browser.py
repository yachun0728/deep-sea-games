#!/usr/bin/env python3
"""Real Chrome fullscreen composition, preserved sprite geometry and lifecycle checks."""
import argparse,base64,json,tempfile,time,threading
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from check_i18n_browser import Chrome
ROOT=Path(__file__).resolve().parents[1]
MONITOR=r'''
window.__errors=[];window.__ghosts=[];window.__sprites=[];window.__starts=0;
addEventListener('error',e=>{if(e.message)__errors.push(e.message)});
const draw=CanvasRenderingContext2D.prototype.drawImage;
CanvasRenderingContext2D.prototype.drawImage=function(...a){
 if(this.canvas.id==='rp-canvas'){
  const src=a[0].src||'';
  if(src.includes('background-v1')&&a.length===9&&a[2]===0){__ghosts=[];__sprites=[];}
  if(src.includes('reaper_body')||src.includes('reaper_ghost')){
   const m=this.getTransform();__sprites.push({src,w:a[7],h:a[8],sx:Math.hypot(m.a,m.b),sy:Math.hypot(m.c,m.d)});
  }
  if(src.includes('reaper_ghost')&&a[7]===58&&a[6]+a[8]===307)__ghosts.push({x:a[5]+29,permit:false});
  if(src.includes('reaper_permit')&&a[7]===50&&__ghosts.length)__ghosts.at(-1).permit=true;
 }
 return draw.apply(this,a);
};
'''
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--url');parser.add_argument('--output',type=Path,default=ROOT/'output/reaper-c-qa/fullscreen');args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
 class Handler(SimpleHTTPRequestHandler):
  def log_message(self,*args):pass
 server=None
 if args.url:url=args.url
 else:
  server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/'
 results=[]
 with tempfile.TemporaryDirectory(prefix='reaper-fullscreen-') as folder:
  c=Chrome('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',Path(folder))
  def ev(s):return c.evaluate(s)
  def check(ok,label):
   results.append({'result':'PASS' if ok else 'FAIL','check':label});print(results[-1],flush=True)
   if not ok:raise AssertionError(label)
  def until(s,seconds=25):
   end=time.monotonic()+seconds
   while time.monotonic()<end:
    if ev(s):return True
    time.sleep(.04)
   return False
  def size(w,h):c.call('Emulation.setDeviceMetricsOverride',{'width':w,'height':h,'deviceScaleFactor':1,'mobile':w<600},page=True);time.sleep(.12)
  def shot(name):args.output.joinpath(name+'.png').write_bytes(base64.b64decode(c.call('Page.captureScreenshot',{'format':'png'},page=True)['data']))
  def tap(selector):
   r=ev(f"document.querySelector({json.dumps(selector)}).getBoundingClientRect().toJSON()")
   for kind in ['touchStart','touchEnd']:c.call('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[{'x':r['x']+r['width']/2,'y':r['y']+r['height']*.66}] if kind=='touchStart' else []},page=True)
  try:
   c.call('Page.enable',page=True);c.call('Page.addScriptToEvaluateOnNewDocument',{'source':MONITOR},page=True);size(390,844)
   c.call('Page.navigate',{'url':url+'?lang=zh-Hant&v=fullscreen#reaper'},page=True)
   check(until("document.getElementById('rp-go')?.getAttribute('aria-label')==='開始值班'&&!document.getElementById('view-reaper').hidden&&!document.getElementById('rp-go').disabled"),'Fullscreen artwork loads')
   for w,h in [(390,844),(320,568),(430,932),(768,1024),(1366,900),(844,390)]:
    size(w,h)
    until("Math.abs(document.querySelector('.reaper-stage').getBoundingClientRect().height-innerHeight)<1",3)
    check(ev("(()=>{let r=document.querySelector('.reaper-stage').getBoundingClientRect();return Math.abs(r.height-innerHeight)<1&&r.top>=0&&r.bottom<=innerHeight+1&&r.right<=innerWidth+1})()"),f'{w}x{h}: stage fills height and stays in viewport')
    check(ev("(()=>{let c=document.getElementById('rp-canvas').getBoundingClientRect(),a=document.getElementById('rp-go').getBoundingClientRect();return a.top>c.top+c.height*.6&&a.bottom<=c.bottom+1&&a.width>=44&&a.height>=44})()"),f'{w}x{h}: action stays inside lower screen')
    check(ev("__sprites.some(s=>s.src.includes('reaper_body')&&s.w===123&&s.h===176)&&__sprites.every(s=>Math.abs(s.sx/s.sy-1)<.004)"),f'{w}x{h}: approved character dimensions and uniform scale')
    check(ev("(()=>{let r=document.getElementById('rp-canvas').getBoundingClientRect();return Math.abs(r.width/r.height-400/523)<.002})()"),f'{w}x{h}: original composition remains whole')
    shot(f'ready-{w}x{h}')
   size(390,844)
   # Chrome on this host has no Emulation.setSafeAreaInsets; emulate layout padding explicitly.
   ev("document.querySelector('#view-reaper .console').style.padding='44px 0 34px';document.querySelector('.reaper-stage').style.setProperty('--rp-extra','max(0px,calc(100dvh - 78px - 130.75cqw))')")
   time.sleep(.15)
   check(ev("(()=>{let r=document.querySelector('.reaper-stage').getBoundingClientRect();return Math.abs(r.top-44)<1&&Math.abs(r.bottom-(innerHeight-34))<1})()"),'Simulated 44/34px layout padding protects HUD and controls (not iOS device validation)')
   shot('safe-area-layout-390x844')
   ev("document.querySelector('#view-reaper .console').style.padding='';document.querySelector('.reaper-stage').style.removeProperty('--rp-extra')");time.sleep(.15)
   tap('#rp-go')
   check(until("document.getElementById('rp-go').dataset.mode==='surface'"),'Touch starts one normal round')
   ev("window.__auto=setInterval(()=>{if(__ghosts.some(g=>!g.permit&&Math.abs(g.x-200)<7))document.getElementById('rp-go').click()},10)")
   check(until("parseInt(document.getElementById('rp-score').textContent)>=1"),'Original hit rule captures a conveyor ghost with intact scene');ev('clearInterval(__auto)');shot('playing-390x844')
   # Resizing and background visibility must retain the same round and score.
   score=ev("document.getElementById('rp-score').textContent")
   size(844,390);size(390,844)
   check(ev("document.getElementById('rp-go').dataset.mode==='surface'") and ev("document.getElementById('rp-score').textContent")==score,'Rotate and return preserve score and active round')
   check(until("document.getElementById('rp-go').dataset.mode==='bet'&&!document.getElementById('rp-go').disabled"),'Normal three-heart ending still works');shot('over-390x844')
   tap('#rp-go');check(until("document.getElementById('rp-go').dataset.mode==='surface'"),'Touch restarts after settlement')
   tap('#view-reaper .fs-exit');check(until("location.hash==='#lobby'&&!document.getElementById('view-lobby').hidden"),'Exit to lobby remains reachable')
   check(ev('__errors.length===0'),'No runtime errors during fullscreen/resize/replay checks')
  finally:
   args.output.joinpath('results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));c.close()
   if server:server.shutdown()
if __name__=='__main__':main()
