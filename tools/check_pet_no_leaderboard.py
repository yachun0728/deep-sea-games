#!/usr/bin/env python3
"""Render a synthetic mixed leaderboard feed to verify Pet Walkies stays excluded."""
import json,os,tempfile,time
from pathlib import Path
from check_i18n_browser import Chrome
ROOT=Path(__file__).resolve().parents[1]
URL=os.environ.get('PET_QA_URL','http://127.0.0.1:55791/')
with tempfile.TemporaryDirectory(prefix='pet-no-board-') as p:
 c=Chrome('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',Path(p))
 try:
  c.call('Page.enable',page=True)
  c.call('Page.addScriptToEvaluateOnNewDocument',{'source':r'''
window.petRequests=[];const originalFetch=fetch;
window.fetch=function(input,...args){const url=String(input.url||input);if(url.includes('/api/')&&url.includes('pet-walk'))petRequests.push(url);
 if(url.includes('/api/v1/leaderboard/feed'))return Promise.resolve(new Response(JSON.stringify({games:[
 {gameId:'pet-walk',lastPlayedAt:'2026-11-29T00:00:00Z',entries:[{playerId:'pet',displayName:'EXCLUDED PET',score:999}]},
 {gameId:'frog',lastPlayedAt:'2026-11-29T00:00:00Z',entries:[{playerId:'frog',displayName:'KEPT FROG',score:12}]}]}),{status:200,headers:{'Content-Type':'application/json'}}));
 return originalFetch.call(this,input,...args);};
'''},page=True)
  c.call('Page.navigate',{'url':URL+'?lang=en&qa=pet-no-board#lobby'},page=True)
  for _ in range(150):
   if c.evaluate("!!document.querySelector('#board-rows a[href=\"#frog\"]')"):break
   time.sleep(.05)
  assert c.evaluate("!!document.querySelector('#board-rows a[href=\"#frog\"]')"),'control game not rendered'
  assert not c.evaluate("!!document.querySelector('#board-rows a[href=\"#pet-walk\"]')"),'Pet Walkies leaked into leaderboard'
  c.evaluate("location.hash='pet-walk'")
  for _ in range(150):
   if c.evaluate("!document.getElementById('pw-go').disabled"):break
   time.sleep(.05)
  assert not c.evaluate("!!document.querySelector('#view-pet-walk .game-leaderboard')")
  c.evaluate("document.getElementById('pw-go').click()")
  time.sleep(.5)
  assert not c.evaluate('petRequests'),c.evaluate('petRequests')
  result={'status':'PASS','synthetic_feed':'Pet Walkies excluded; Frog retained','game_panel':'no leaderboard','start_requests':'no Pet Walkies API score requests','production_D1':'NOT TESTED; no writes'}
  out=ROOT/'games/pet-walk/design/qa-v1/no-leaderboard-report.json';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,indent=2)+'\n')
  print('PASS mixed-feed exclusion, retained Frog row, no Pet Walkies panel or score API request',flush=True)
 finally:c.close()
