#!/usr/bin/env python3
"""Optional Queue Cutter art/input QA. Start localhost:8876 from the repository first."""
import base64
import json
from pathlib import Path
import tempfile
import time
from check_i18n_browser import Chrome

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'games/elevator/design/qa-v1'
OUT.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='queue-cutter-qa-') as profile:
    chrome = Chrome('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', Path(profile))
    def evaluate(code):
        return chrome.evaluate(code)
    def screenshot(name):
        data = chrome.call('Page.captureScreenshot', {'format': 'png'}, page=True)['data']
        (OUT / name).write_bytes(base64.b64decode(data))
    try:
        print(chrome.call('Browser.getVersion')['product'], flush=True)
        for width, height in [(470,618),(565,742),(390,844),(320,568),(430,760),(768,1024),(1366,900),(844,390)]:
            chrome.call('Emulation.setDeviceMetricsOverride', {'width':width,'height':height,'deviceScaleFactor':1,'mobile':width<881}, page=True)
            chrome.call('Page.navigate', {'url':'http://127.0.0.1:8876/?lang=zh-Hant#elevator'}, page=True)
            time.sleep(1)
            result = evaluate("""(() => {
                const view=document.getElementById('view-elevator');
                const rect=id=>document.getElementById(id).getBoundingClientRect().toJSON();
                return {visible:!view.hidden,canvas:rect('eq-canvas'),button:rect('eq-go'),watch:rect('eq-watch'),overflow:document.documentElement.scrollWidth>innerWidth};
            })()""")
            assert result['visible'] and not result['overflow'], result
            for name in ['button','watch']:
                r=result[name]
                assert r['left']>=0 and r['right']<=width+1 and r['top']>=0 and r['bottom']<=height+1, result
            assert result['button']['height']>=44, result
            aspect=evaluate("document.getElementById('eq-canvas').width/document.getElementById('eq-canvas').height")
            assert abs(aspect-result['canvas']['width']/result['canvas']['height'])<.02, 'Canvas content is letterboxed'
            assert abs(result['canvas']['width']-width)<=1 and abs(result['canvas']['height']-height)<=1, 'Scene must cover the entire viewport'
            assert abs(result['canvas']['left'])<=1 and abs(result['canvas']['top'])<=1, result
            screenshot(f'ready-{width}.png')
            print(f'PASS layout {width}x{height}', flush=True)
        chrome.call('Emulation.setDeviceMetricsOverride', {'width':390,'height':844,'deviceScaleFactor':1,'mobile':True}, page=True)
        evaluate("""(()=>{const p=CanvasRenderingContext2D.prototype,d=p.drawImage,cl=p.clearRect;
            p.clearRect=function(){if(this.canvas.id==='eq-canvas')window.eqDrawCalls=[];return cl.apply(this,arguments)};
            p.drawImage=function(img){if(this.canvas.id==='eq-canvas'&&img.src)window.eqDrawCalls.push(img.src.split('/').pop());return d.apply(this,arguments)};
        })()""")
        evaluate("document.getElementById('eq-go').click()")
        deadline=time.monotonic()+5
        while time.monotonic()<deadline and not evaluate("document.getElementById('eq-go').dataset.mode==='surface'"):
            time.sleep(.03)
        assert evaluate("document.getElementById('eq-go').dataset.mode==='surface'")
        evaluate("document.getElementById('eq-go').click()")
        time.sleep(.12)
        screenshot('moving-390.png')
        time.sleep(.5)
        assert evaluate("document.getElementById('eq-total').textContent.startsWith('1')")
        screenshot('playing-390.png')
        print('PASS start and step', flush=True)
        deadline=time.monotonic()+12
        while time.monotonic()<deadline and not evaluate("document.getElementById('eq-watch').dataset.state==='look'"):
            time.sleep(.02)
        assert evaluate("document.getElementById('eq-watch').dataset.state==='look'")
        poses=evaluate("window.eqDrawCalls.filter(n=>/-(safe|warn|look)\\.webp$/.test(n))")
        actors=[name.rsplit('-',1)[0] for name in poses]
        assert actors and len(actors)==len(set(actors)), 'Old and new passenger poses were layered together'
        print('PASS no old head pose layered under current passenger', flush=True)
        evaluate("document.getElementById('eq-go').click()")
        time.sleep(.2)
        screenshot('caught-390.png')
        assert evaluate("document.getElementById('eq-go').dataset.mode==='bet'")
        time.sleep(.5)
        evaluate("document.getElementById('eq-go').click()")
        time.sleep(.3)
        assert evaluate("document.getElementById('eq-total').textContent.startsWith('0')")
        print('PASS actual look, caught and replay', flush=True)
        evaluate("location.hash='lobby'")
        time.sleep(.2)
        assert evaluate("document.getElementById('view-elevator').hidden")
        evaluate("location.hash='elevator'")
        time.sleep(.2)
        assert evaluate("!document.getElementById('view-elevator').hidden")
        # Canvas input and keyboard use the same existing action handler.
        evaluate("document.getElementById('eq-canvas').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))")
        time.sleep(.6)
        assert evaluate("document.getElementById('eq-total').textContent.startsWith('1')")
        print('PASS canvas pointer input and route return', flush=True)
        for lang in ['en','zh-Hans','zh-Hant']:
            evaluate(f"window.deepSeaI18n.setLanguage({json.dumps(lang)})")
            time.sleep(.15)
            assert evaluate('document.documentElement.lang') == lang
            if lang == 'en':
                assert evaluate("Array.from(document.querySelectorAll('#view-elevator dt,#view-elevator dd,#view-elevator button,#eq-msg,#eq-watch')).filter(e=>e.getClientRects().length&&e.getBoundingClientRect().width>0).every(e=>!/[\\u3400-\\u9fff]/.test(e.textContent))")
            screenshot(f'{lang}-390.png')
        print('PASS live language switching', flush=True)
        evaluate("location.hash='lobby'")
        time.sleep(.2)
        evaluate("document.querySelector('.game-card[href=\"#elevator\"]').scrollIntoView({block:'center'})")
        time.sleep(.2)
        screenshot('lobby-390.png')
        assert evaluate("document.querySelector('.game-card[href=\"#elevator\"]').getAttribute('style').includes('cover.webp')")
        print('PASS cover wired in mobile lobby', flush=True)
    finally:
        chrome.close()
