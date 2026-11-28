#!/usr/bin/env python3
"""Optional isolated Chromium QA; serve this repository on localhost:8893 first."""
import base64
import json
from pathlib import Path
import tempfile
import time
from check_i18n_browser import Chrome

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'games/mermaid/design/retro-v1'
results=[]
with tempfile.TemporaryDirectory(prefix='mermaid-retro-') as profile:
    c=Chrome('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',Path(profile))
    ev=c.evaluate
    def shot(name):
        (OUT/name).write_bytes(base64.b64decode(c.call('Page.captureScreenshot',{'format':'png'},page=True)['data']))
    def click(selector):
        ev(f'document.querySelector({json.dumps(selector)}).click()')
        time.sleep(.35)
    def touch(x,y):
        c.call('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]},page=True)
        c.call('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]},page=True)
        time.sleep(.25)
    def check(label,condition):
        assert condition,label
        results.append('PASS '+label)
        print(results[-1],flush=True)
    try:
        version=c.call('Browser.getVersion')['product']
        for w,h in [(390,844),(320,568),(430,760),(768,1024),(1366,900),(844,390)]:
            c.call('Emulation.setDeviceMetricsOverride',{'width':w,'height':h,'deviceScaleFactor':1,'mobile':w<881},page=True)
            c.call('Page.navigate',{'url':f'http://127.0.0.1:8893/?lang=en&retroqa={w}#mermaid'},page=True)
            time.sleep(1)
            if w==390:shot('ready-390.png')
            check(f'{w}x{h} ready and no horizontal overflow',ev("!document.querySelector('#view-mermaid').hidden&&document.documentElement.scrollWidth<=innerWidth"))
            check(f'{w}x{h} labels and values share baseline',ev("[...document.querySelectorAll('#view-mermaid .stats>div')].every(e=>{const a=e.querySelector('dt').getBoundingClientRect(),b=e.querySelector('dd').getBoundingClientRect();return Math.abs((a.top+a.height/2)-(b.top+b.height/2))<2&&a.bottom<=e.getBoundingClientRect().bottom&&b.bottom<=e.getBoundingClientRect().bottom})"))
            check(f'{w}x{h} start visible',ev("(()=>{const r=document.querySelector('#mm-go').getBoundingClientRect();return r.width>0&&r.height>=44&&r.top>=0&&r.bottom<=innerHeight})()"))
            click('#mm-go');time.sleep(1.3)
            check(f'{w}x{h} 54 cards and ten face-up columns',ev("document.querySelectorAll('.mm-card:not([hidden])').length===54&&document.querySelectorAll('.mm-card.up').length===10"))
            click('#mm-deal');time.sleep(.6)
            check(f'{w}x{h} Deal proxy adds ten cards once',ev("document.querySelectorAll('.mm-card:not([hidden])').length===64&&document.querySelector('#mm-stock-count').textContent==='4'"))
            check(f'{w}x{h} cards stay above stock/pearls',ev("(()=>{const b=document.querySelector('#mm-slots').getBoundingClientRect();return [...document.querySelectorAll('.mm-card:not([hidden])')].every(e=>e.getBoundingClientRect().bottom<b.top-4)})()"))
            check(f'{w}x{h} bottom buttons in viewport',ev("['mm-undo','mm-hint','mm-deal'].every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&r.height>=44})"))
            click('#mm-undo');time.sleep(.3)
            check(f'{w}x{h} undo restores stock',ev("document.querySelector('#mm-stock-count').textContent==='5'"))
            if w==390:
                pair=ev("(()=>{const a=[...document.querySelectorAll('.mm-card.up')].map(e=>({id:e.dataset.id,n:({A:1,J:11,Q:12,K:13})[e.querySelector('.r').textContent]||Number(e.querySelector('.r').textContent),x:e.getBoundingClientRect().x+e.getBoundingClientRect().width/2,y:e.getBoundingClientRect().y+e.getBoundingClientRect().height/2}));for(const f of a)for(const t of a)if(t.n===f.n+1)return[f,t]})()")
                check('legal touch pair available',bool(pair))
                f,t=pair;touch(f['x'],f['y']);touch(t['x'],t['y'])
                check('actual touch moves selected card',ev(f"Math.abs(document.querySelector('.mm-card[data-id=\"{f['id']}\"]').getBoundingClientRect().x+document.querySelector('.mm-card[data-id=\"{f['id']}\"]').getBoundingClientRect().width/2-{t['x']})<2"))
                time.sleep(1)
                hint=ev("(()=>{document.querySelector('#mm-hint').click();return {marked:!!document.querySelector('.mm-card.hint,.mm-stock.hint'),message:document.querySelector('#mm-bubble').textContent}})()")
                check('hint provides feedback: '+hint['message'],hint['marked'] or any(t in hint['message'].lower() for t in ['no','沒有','发牌','發牌']))
                click('#mm-deal');time.sleep(.6)
                click('#mm-deal');time.sleep(.6)
                shot('playing-390.png')
                before=ev("document.querySelector('#mm-stock-count').textContent")
                for lang in ['zh-Hant','zh-Hans','en']:
                    ev(f'window.deepSeaI18n.setLanguage({json.dumps(lang)})');time.sleep(.3)
                    check(f'{lang} live language preserves round',ev("document.querySelector('#mm-cover').hidden&&document.querySelector('#mm-stock-count').textContent") == before)
                    shot(f'playing-{lang}-390.png')
                check('English visible controls translated',ev("[...document.querySelectorAll('#view-mermaid button,#view-mermaid dt')].filter(e=>e.getClientRects().length).every(e=>!/[\\u3400-\\u9fff]/.test(e.textContent))"))
                ev("location.hash='lobby'");time.sleep(.25)
                ev("location.hash='mermaid'");time.sleep(.25)
                check('route return preserves game',ev("document.querySelector('#mm-cover').hidden&&document.querySelector('#mm-stock-count').textContent") == before)
                click('.mm-menu summary');click('#mm-quit')
                check('first quit press keeps game',ev("document.querySelector('#mm-cover').hidden"))
                click('#mm-quit');time.sleep(.5);shot('over-390.png')
                check('second quit press ends game',ev("!document.querySelector('#mm-cover').hidden&&!document.querySelector('#mm-go').disabled"))
                click('#mm-go');time.sleep(1.2)
                check('replay resets deck',ev("document.querySelector('#mm-cover').hidden&&document.querySelector('#mm-stock-count').textContent==='5'"))
            shot(f'layout-{w}-{h}.png')
        (OUT/'browser-results.json').write_text(json.dumps({'browser':version,'results':results,'device':'headless Chromium, emulated viewports; not physical device'},indent=2))
    finally:c.close()
