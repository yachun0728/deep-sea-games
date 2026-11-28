#!/usr/bin/env python3
"""Optional actual DOM drag animation QA. Serve repository on localhost:8893."""
import sys,tempfile,time,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from check_i18n_browser import Chrome
label=sys.argv[1] if len(sys.argv)>1 else 'after'
with tempfile.TemporaryDirectory(prefix='mm-drag-') as p:
 c=Chrome('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',Path(p))
 try:
  c.call('Page.enable',{},page=True)
  c.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True},page=True)
  c.call('Page.navigate',{'url':'http://127.0.0.1:8893/?dragqa='+label+'#mermaid'},page=True);time.sleep(1)
  c.evaluate("document.querySelector('#mm-go').click()");time.sleep(2)
  for attempt in range(10):
   if c.evaluate("(()=>{const a=[...document.querySelectorAll('.mm-card.up')].map(e=>({n:({A:1,J:11,Q:12,K:13})[e.querySelector('.r').textContent]||Number(e.querySelector('.r').textContent),x:e.getBoundingClientRect().left}));return a.some(f=>a.some(t=>t.n===f.n+1&&t.x-f.x>50))})()"):break
   c.evaluate("document.querySelector('#mm-quit').click();document.querySelector('#mm-quit').click();document.querySelector('#mm-go').click()");time.sleep(2)
  result=c.call('Runtime.evaluate',{'awaitPromise':True,'returnByValue':True,'expression':'''(async()=>{
 const cards=[...document.querySelectorAll('.mm-card.up')].map(e=>({e,n:({A:1,J:11,Q:12,K:13})[e.querySelector('.r').textContent]||Number(e.querySelector('.r').textContent),r:e.getBoundingClientRect()}));
 let pair;for(const f of cards)for(const t of cards)if(t.n===f.n+1&&t.r.left-f.r.left>50){pair=[f,t];break}
 if(!pair)throw Error('No rightward pair');const [f,t]=pair,x=f.r.left+f.r.width/2,y=f.r.top+f.r.height/2,tx=t.r.left+t.r.width/2,ty=t.r.top+t.r.height/2;
 const event=(type,x,y)=>f.e.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:27,pointerType:'mouse',button:0,clientX:x,clientY:y}));
 event('pointerdown',x,y);event('pointermove',tx,ty);
 const released=f.e.getBoundingClientRect().left;event('pointerup',tx,ty);
 const samples=[];const began=performance.now();await new Promise(resolve=>{function tick(){samples.push({ms:performance.now()-began,x:f.e.getBoundingClientRect().left});if(performance.now()-began<650)requestAnimationFrame(tick);else resolve()}requestAnimationFrame(tick)});
 return {start:f.r.left,target:t.r.left,released,min:Math.min(...samples.map(s=>s.x)),max:Math.max(...samples.map(s=>s.x)),samples};
})()'''},page=True)
  if 'exceptionDetails' in result:raise Exception(result['exceptionDetails'])
  data=result['result']['value'];Path('games/mermaid/design/retro-v1/drag-'+label+'.json').write_text(json.dumps(data,indent=2));print({k:v for k,v in data.items() if k!='samples'})
  if label!='before':
   assert data['max']<=max(data['released'],data['target'])+.75,data
   assert data['min']>=min(data['released'],data['target'])-.75,data
   assert abs(data['samples'][-1]['x']-data['target'])<.75,data
   print('PASS release animation stays within drop and destination bounds')
 finally:c.close()
