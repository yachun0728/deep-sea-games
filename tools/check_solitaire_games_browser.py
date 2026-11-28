#!/usr/bin/env python3
"""Three solitaire candidates: isolated browser QA, emulated sizes, real pointer events."""
import base64,json,os,tempfile,time
from pathlib import Path
from check_i18n_browser import Chrome
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('SOLITAIRE_QA_URL','http://127.0.0.1:8894')
OUT=ROOT/'games/mermaid/design/solitaire-time-v1';OUT.mkdir(exist_ok=True)
results=[]
with tempfile.TemporaryDirectory(prefix='solitaire-games-') as p:
 c=Chrome('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',Path(p));ev=c.evaluate
 def check(label,ok):
  assert ok,label
  results.append('PASS '+label);print(results[-1],flush=True)
 def shot(gid,name):
  path=ROOT/'games'/gid/'design'/name;path.write_bytes(base64.b64decode(c.call('Page.captureScreenshot',{'format':'png'},page=True)['data']))
 def click(selector):ev('document.querySelector('+json.dumps(selector)+').click()');time.sleep(.2)
 def touch(x,y,move=None):
  c.call('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]},page=True)
  if move:c.call('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':move[0],'y':move[1]}]},page=True)
  c.call('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]},page=True);time.sleep(.2)
 try:
  c.call('Page.enable',{},page=True);c.call('Page.addScriptToEvaluateOnNewDocument',{'source':"window.__solErrors=[];addEventListener('error',e=>__solErrors.push(e.message));"},page=True)
  for w,h in [(390,844),(320,568),(430,760),(768,1024),(1366,900),(844,390)]:
   c.call('Emulation.setDeviceMetricsOverride',{'width':w,'height':h,'deviceScaleFactor':1,'mobile':w<881},page=True)
   for gid,prefix,cards,up in [('mermaid','mm',54,10),('midnight-solitaire','ks',28,7),('orbit-freecell','fc',52,52)]:
    c.call('Page.navigate',{'url':BASE+'/?sol-qa='+str(w)+'-'+gid+'#'+gid},page=True);time.sleep(.7)
    ev("window.deepSeaI18n.setLanguage('zh-Hant')");time.sleep(.15)
    check(f'{gid} {w}x{h} visible',ev(f"!document.getElementById('view-{gid}').hidden"))
    check(f'{gid} {w}x{h} no horizontal overflow',ev('document.documentElement.scrollWidth<=innerWidth'))
    if w==390:shot(gid,'time-ready-390.png')
    click('#'+prefix+'-go');time.sleep(1.3)
    check(gid+' ranked API connected',ev(f"document.querySelector('#{prefix}-ranking').textContent.includes('時間榜記錄中')"))
    if prefix=='mm':
     check(f'{gid} {w}x{h} ten columns',ev("document.querySelectorAll('#mm-board .mm-card.up').length===10"))
     check(f'{gid} {w}x{h} title and i visible',ev("document.querySelector('.mm-titlebar h2').textContent.includes('人魚蜘蛛接龍')&&document.querySelector('.mm-menu summary').getBoundingClientRect().width>=44"))
     if w==390:click('#mm-deal');time.sleep(.8);click('.mm-menu summary');shot(gid,'time-help-390.png');click('.mm-menu summary')
    else:
     check(f'{gid} {w}x{h} correct tableau deal',ev(f"document.querySelectorAll('#{prefix}-table .sc-card').length==={cards}&&document.querySelectorAll('#{prefix}-table .sc-card:not(.down)').length==={up}"))
     check(f'{gid} {w}x{h} full visible name',ev(f"(()=>{{const e=document.querySelector('#{prefix}-window h2');return e.scrollWidth<=e.clientWidth+1&&e.textContent.length>=5}})()"))
     check(f'{gid} {w}x{h} controls in viewport',ev(f"['{prefix}-undo','{prefix}-hint','{prefix}-restart','{prefix}-info'].every(id=>{{const r=document.getElementById(id).getBoundingClientRect();return r.height>=44&&r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight}})"))
     check(f'{gid} {w}x{h} HUD/message do not overlap',ev(f"(()=>{{const m=document.getElementById('{prefix}-message');if(!m.getClientRects().length)return true;return m.getBoundingClientRect().top>=document.querySelector('#{prefix}-window .sc-hud').getBoundingClientRect().bottom}})()"))
     if w==390:
      if prefix=='ks':
       point=ev("(()=>{const r=document.querySelector('#ks-rack [data-from=\"17\"]').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()")
       touch(*point);check('Klondike draws one',ev("document.querySelector('#ks-rack [data-from=\"16\"]').classList.contains('sc-card')&&document.querySelector('#ks-moves').textContent==='1'"));click('#ks-undo');check('Klondike undo restores stock count',ev("document.querySelector('#ks-rack [data-from=\"17\"] small').textContent==='24'"))
      else:
       source=ev("(()=>{const a=[...document.querySelectorAll('#fc-table .sc-card[data-from=\"0\"]')];const e=a.at(-1),r=e.getBoundingClientRect();return {id:e.dataset.card,x:r.x+r.width/2,y:r.y+r.height/2}})()")
       dest=ev("(()=>{const r=document.querySelector('#fc-rack [data-from=\"8\"]').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()")
       touch(source['x'],source['y']);touch(*dest);check('FreeCell touch moves a card into cell',ev(f"document.querySelector('#fc-rack [data-from=\"8\"]').dataset.card==='{source['id']}'"));click('#fc-undo');
       touch(source['x'],source['y'],dest);check('FreeCell actual drag into cell',ev(f"document.querySelector('#fc-rack [data-from=\"8\"]').dataset.card==='{source['id']}'"));click('#fc-undo')
      before=ev(f"document.querySelector('#{prefix}-moves').textContent");click('#'+prefix+'-info');shot(gid,'time-help-390.png');check(gid+' help keeps round',ev(f"document.querySelector('#{prefix}-cover').hidden&&document.querySelector('#{prefix}-moves').textContent") == before);click('#'+prefix+'-help-close')
      for lang in ['en','zh-Hans','zh-Hant']:
       ev(f"window.deepSeaI18n.setLanguage('{lang}')");time.sleep(.15)
       check(gid+' '+lang+' preserves round',ev(f"document.querySelector('#{prefix}-cover').hidden&&document.querySelector('#{prefix}-moves').textContent") == before)
       if lang=='en':check(gid+' English visible controls',ev(f"[...document.querySelectorAll('#view-{gid} button,#view-{gid} h2,#view-{gid} .sc-type')].filter(e=>e.getClientRects().length&&e.offsetParent).every(e=>!/[\\u3400-\\u9fff]/.test(e.textContent))"))
      click('#'+prefix+'-restart');check(gid+' restart needs confirmation',ev(f"!document.querySelector('#{prefix}-confirm').hidden"));click('#'+prefix+'-confirm-yes');time.sleep(1.1);check(gid+' replay resets moves',ev(f"document.querySelector('#{prefix}-moves').textContent==='0'"))
    check(f'{gid} {w}x{h} no runtime exceptions',not ev('window.__solErrors'))
    if w==390:shot(gid,'time-playing-390.png')
    shot(gid,f'time-layout-{w}-{h}.png')
  c.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True},page=True)
  c.call('Page.navigate',{'url':BASE+'/?final-lobby#lobby'},page=True);time.sleep(.7)
  ev("document.querySelector('.game-card[href=\"#mermaid\"]').scrollIntoView({block:'center'})");time.sleep(.3)
  shot('mermaid','lobby-three-solitaire-390.png')
  check('three cover files connected',ev("['mermaid','midnight-solitaire','orbit-freecell'].every(id=>document.querySelector('.game-card[href=\"#'+id+'\"]').getAttribute('style').includes('cover.webp'))"))
  (OUT/'browser-results.json').write_text(json.dumps({'browser':c.call('Browser.getVersion')['product'],'results':results,'note':'Emulated viewports, not physical device testing'},indent=2))
 finally:c.close()
