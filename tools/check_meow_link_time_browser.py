"""Real browser + in-memory Worker/SQLite, all difficulties to ten-stage completion."""
import base64,json,subprocess,tempfile,threading,time,sys
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from check_i18n_browser import Chrome
ROOT=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='meow-time-') as tmp:
 p=Path(tmp)
 fixture=p/'api.mjs'
 fixture.write_text('''import http from 'node:http';import {DatabaseSync} from 'node:sqlite';import {readdirSync,readFileSync} from 'node:fs';
import worker from '''+json.dumps((ROOT/'backend/src/index.mjs').as_uri())+''';
const db=new DatabaseSync(':memory:');const base='''+json.dumps(str(ROOT/'backend/migrations'))+''';for(const f of readdirSync(base).sort())db.exec(readFileSync(base+'/'+f,'utf8'));
const DB={prepare(q){const s=db.prepare(q);const bind=(...a)=>({first:async()=>s.get(...a)??null,run:async()=>s.run(...a),all:async()=>({results:s.all(...a)})});return {...bind(),bind}}};
const server=http.createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const body=Buffer.concat(chunks);const response=await worker.fetch(new Request('http://127.0.0.1'+req.url,{method:req.method,headers:req.headers,...(body.length?{body}: {})}),{DB,FRONTEND_ORIGIN:req.headers.origin||'http://127.0.0.1',SITE_ORIGIN:req.headers.origin||'http://127.0.0.1'});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(e){res.writeHead(500);res.end(JSON.stringify({error:String(e)}))}});server.listen(0,'127.0.0.1',()=>console.log(server.address().port));
''')
 api=subprocess.Popen(['node',str(fixture)],stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True)
 port=int(api.stdout.readline().strip())
 script=(ROOT/'tools/i18n_browser_meow_link_time.js').read_text()
 source=(ROOT/'index.html').read_text().replace('</body>','<script>'+script+'</script></body>')
 class Handler(SimpleHTTPRequestHandler):
  def do_GET(self):
   if self.path.split('?')[0]=='/test.html':content=source.encode();kind='text/html'
   elif self.path.split('?')[0]=='/frontend/services/api.mjs':content=(ROOT/'frontend/services/api.mjs').read_text().replace(':8787',':'+str(port)).encode();kind='text/javascript'
   else:return super().do_GET()
   self.send_response(200);self.send_header('Content-Type',kind);self.end_headers();self.wfile.write(content)
  def log_message(self,*args):pass
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)));server.daemon_threads=True
 threading.Thread(target=server.serve_forever,daemon=True).start()
 try:
  for w,h in ([(390,844)] if '--mobile-only' in sys.argv else [(390,844),(1366,900)]):
   chrome=Chrome('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',p/str(w))
   try:
    chrome.call('Emulation.setDeviceMetricsOverride',{'width':w,'height':h,'deviceScaleFactor':1,'mobile':w<880},page=True)
    chrome.call('Page.navigate',{'url':f'http://127.0.0.1:{server.server_port}/test.html?lang=zh-Hant#meow-link'},page=True)
    deadline=time.monotonic()+180;previous=''
    while time.monotonic()<deadline:
     state=chrome.evaluate("({status:document.body?.dataset.testStatus,checks:document.getElementById('test-results')?.textContent,last:window.__meowTimeChecks?.slice(-1)[0]})")
     if state.get('status') and state.get('checks'):
      checks=json.loads(state['checks']);assert state['status']=='PASS',checks[-1];print(f'PASS {w}x{h}: {len(checks)} browser/Worker checks',flush=True);break
     if state.get('last','').startswith('Starting') and state['last']!=previous:print(f'{w}: {state["last"]}',flush=True);previous=state['last']
     time.sleep(.1)
    else:raise TimeoutError(state)
    out=ROOT/'games/meow-link/design/qa-time';out.mkdir(exist_ok=True)
    (out/f'lobby-{w}.png').write_bytes(base64.b64decode(chrome.call('Page.captureScreenshot',{'format':'png'},page=True)['data']))
   finally:chrome.close()
 finally:server.shutdown();server.server_close();api.terminate();api.wait()
