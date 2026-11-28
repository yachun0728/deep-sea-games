#!/usr/bin/env python3
"""Regression for diary text inside the real book page. Hooks exist only in this private QA response."""
import base64,json,tempfile,time,threading
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from check_i18n_browser import Chrome
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'games/pet-walk/design/qa-v1';OUT.mkdir(parents=True,exist_ok=True)
source=(ROOT/'index.html').read_text();anchor="G.mode='TITLE';ui();render();requestAnimationFrame(frame);"
assert source.count(anchor)==1
source=source.replace(anchor,"window.__petVisual={G,render,diaryPageLayout,diaryLines,wrap,EVT,EVENT_IDS,begin,force(id,rare){G.force=id;G.forceRare=rare;triggerEvent();G.ev.t=1;}};"+anchor)
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  if self.path.startswith('/__pet-visual.html'):
   b=source.encode();self.send_response(200);self.send_header('Content-Type','text/html;charset=utf-8');self.send_header('Content-Length',str(len(b)));self.end_headers();self.wfile.write(b)
  else:super().do_GET()
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start();results=[]
with tempfile.TemporaryDirectory(prefix='pet-diary-qa-') as p:
 c=Chrome('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',Path(p))
 try:
  c.call('Page.navigate',{'url':f'http://127.0.0.1:{server.server_port}/__pet-visual.html?lang=zh-Hant#pet-walk'},page=True)
  until=time.monotonic()+20
  while time.monotonic()<until:
   if c.evaluate("!!window.__petVisual&&document.getElementById('pw-go')&&!document.getElementById('pw-go').disabled"):break
   time.sleep(.1)
  for lang in ['zh-Hant','en','zh-Hans']:
   c.evaluate(f"deepSeaI18n.setLanguage('{lang}')");time.sleep(.15)
   checked=c.evaluate("""(()=>{const q=__petVisual,bad=[];let count=0,minSize=99;for(let a=0;a<3;a++)for(const id of q.EVENT_IDS)for(let b=0;b<3;b++){
    const d={s1:a,ev:id,s3:b,loot:27,k:16,total:107,newBest:true};const p=q.diaryPageLayout(d),text=q.diaryLines(d);
    const used=p.rows.reduce((n,r)=>n+r.length*p.leading,0)+(p.rows.length-1)*p.gap;
    if(used>p.height||p.x<54||p.x+p.width>346||p.y-p.size<455||p.y+used-p.leading+4>559||p.size<12||p.rows.some((r,i)=>r.join('').replace(/\\s/g,'')!==text[i].replace(/\\s/g,'')))bad.push({d,p,used});
    minSize=Math.min(minSize,p.size);count++;
   }q.G.diary={s1:2,ev:'E10',s3:2,loot:27,k:16,total:107,newBest:true};q.G.save.best=107;q.G.mode='DIARY';q.G.diaryLock=0;return{count,minSize,bad};})()""")
   assert not checked['bad'],checked
   c.evaluate("deepSeaRoundEnd('pet-walk','complete',{score:107})")
   deadline=time.monotonic()+5
   while time.monotonic()<deadline:
    if c.evaluate("!!document.querySelector('#view-pet-walk .share-result:not([hidden])')"):break
    time.sleep(.05)
   for w,h in [(390,844),(320,568),(430,760),(1366,900)]:
    c.call('Emulation.setDeviceMetricsOverride',{'width':w,'height':h,'deviceScaleFactor':1,'mobile':w<881},page=True);time.sleep(.12)
    frame=c.evaluate("""(()=>{const v=document.getElementById('view-pet-walk'),r=v.getBoundingClientRect(),points=[[2,2],[innerWidth-2,2],[2,innerHeight-2],[innerWidth-2,innerHeight-2]];return{x:r.x,y:r.y,w:r.width,h:r.height,vw:innerWidth,vh:innerHeight,covered:points.every(([x,y])=>v.contains(document.elementFromPoint(x,y)))}})()""")
    controls=c.evaluate("""(()=>{const s=document.querySelector('#view-pet-walk .share-result:not([hidden])'),e=document.querySelector('#view-pet-walk .fs-exit');if(!s)return null;const a=s.getBoundingClientRect(),b=e.getBoundingClientRect();return{overlap:a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top,frame:getComputedStyle(s).backgroundImage,ink:getComputedStyle(s).color,icon:getComputedStyle(s.querySelector('i')).color}})()""")
    assert controls and not controls['overlap'] and 'cream.webp' in controls['frame'] and controls['ink']==controls['icon'],controls
    assert frame['x']==0 and frame['y']==0 and frame['w']==frame['vw'] and frame['h']==frame['vh'] and frame['covered'],frame
    (OUT/f'diary-regression-{lang}-{w}.png').write_bytes(base64.b64decode(c.call('Page.captureScreenshot',{'format':'png'},page=True)['data']))
   results.append({'lang':lang,**checked});print('PASS '+lang+': '+str(checked['count'])+' diary variants, full text within padded body below scrapbook, min font '+str(checked['minSize']),flush=True)
  c.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True},page=True)
  c.evaluate('__petVisual.begin()')
  for lang in ['zh-Hant','en']:
   c.evaluate(f"deepSeaI18n.setLanguage('{lang}')");time.sleep(.1)
   for n in range(1,13):
    c.evaluate(f"__petVisual.force('E{n:02}',false)");time.sleep(.06)
    (OUT/f'event-{lang}-{n:02}.png').write_bytes(base64.b64decode(c.call('Page.captureScreenshot',{'format':'png'},page=True)['data']))
   print('PASS '+lang+': captured all 12 event layouts for visual review',flush=True)
  (OUT/'diary-layout-report.json').write_text(json.dumps({'status':'PASS','test_kind':'private injected render regression; no gameplay proof','results':results},ensure_ascii=False,indent=2)+'\n')
 finally:c.close();server.shutdown();server.server_close()
