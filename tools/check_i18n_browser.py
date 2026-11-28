#!/usr/bin/env python3
"""Optional isolated Chrome checks: python3 tools/check_i18n_browser.py [--chrome PATH]."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import threading
from urllib.parse import urlsplit
import base64
import json
import os
from pathlib import Path
import select
import shutil
import subprocess
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]
MONITOR = r'''<script>
window.__untranslatedCanvas=[];window.__untranslatedCanvasById={};
['fillText','strokeText'].forEach(function(method){
  var proto=CanvasRenderingContext2D.prototype,native=proto[method];
  proto[method]=function(text){
    if(window.deepSeaI18n&&window.deepSeaI18n.getLanguage()==='en'&&/[\u3400-\u9fff]/.test(String(text))&&window.__untranslatedCanvas.length<30){window.__untranslatedCanvas.push(String(text));(window.__untranslatedCanvasById[this.canvas.id]||=([])).push(String(text));}
    return native.apply(this,arguments);
  };
});
if(new URLSearchParams(location.search).get('probe')==='blocked'){
  ['getItem','setItem'].forEach(function(method){var native=Storage.prototype[method];Storage.prototype[method]=function(key){if(key==='deep-sea-language-v1')throw new Error('Test: preference storage blocked');return native.apply(this,arguments)}});
}
</script>'''


class Chrome:
    """Use Chromium's private pipe in a temporary profile; never attach to the user's browser."""
    def __init__(self, executable, profile):
        browser_read, self.write_fd = os.pipe()
        self.read_fd, browser_write = os.pipe()

        def pipes():
            os.dup2(browser_read, 3)
            os.dup2(browser_write, 4)

        self.process = subprocess.Popen([
            executable, '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
            f'--user-data-dir={profile}', '--remote-debugging-pipe',
            '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1', 'about:blank'
        ], pass_fds=tuple(set((browser_read, browser_write, 3, 4))), preexec_fn=pipes,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        os.close(browser_read)
        os.close(browser_write)
        self.sequence, self.buffer = 0, b''
        target = self.call('Target.createTarget', {'url': 'about:blank'})['targetId']
        self.session = self.call('Target.attachToTarget', {'targetId': target, 'flatten': True})['sessionId']

    def call(self, method, params=None, page=False):
        self.sequence += 1
        request = {'id': self.sequence, 'method': method, 'params': params or {}}
        if page:
            request['sessionId'] = self.session
        os.write(self.write_fd, json.dumps(request).encode() + b'\0')
        deadline = time.monotonic() + 15
        while time.monotonic() < deadline:
            if b'\0' not in self.buffer:
                ready, _, _ = select.select([self.read_fd], [], [], max(0, deadline - time.monotonic()))
                if not ready:
                    break
                data = os.read(self.read_fd, 65536)
                if not data:
                    raise RuntimeError('Chrome closed its test pipe')
                self.buffer += data
            while b'\0' in self.buffer:
                message, self.buffer = self.buffer.split(b'\0', 1)
                response = json.loads(message)
                if response.get('id') == request['id']:
                    if 'error' in response:
                        raise RuntimeError(response['error'])
                    return response.get('result', {})
        raise TimeoutError(method)

    def evaluate(self, expression):
        result = self.call('Runtime.evaluate', {'expression': expression, 'returnByValue': True}, page=True)
        if 'exceptionDetails' in result:
            raise RuntimeError(result['exceptionDetails'])
        return result['result'].get('value')

    def check(self, page, query, label):
        url = str(page) + query
        self.call('Page.navigate', {'url': url}, page=True)
        deadline = time.monotonic() + 25
        while time.monotonic() < deadline:
            state = self.evaluate("({url:location.href,status:document.body&&document.body.dataset.testStatus,checks:document.getElementById('test-results')&&document.getElementById('test-results').textContent})")
            if state.get('status') and state.get('checks') and state.get('url', '').split('#')[0].split('?')[0] == url.split('#')[0].split('?')[0]:
                checks = json.loads(state['checks'] or '[]')
                if state['status'] != 'PASS':
                    raise RuntimeError(label + '\n' + '\n'.join(checks))
                print(f'PASS: {label}: {len(checks)} checks', flush=True)
                return len(checks)
            time.sleep(0.05)
        raise TimeoutError(label)

    def close(self):
        self.process.terminate()
        try:
            self.process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.process.kill()
            self.process.wait()
        os.close(self.write_fd)
        os.close(self.read_fd)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--chrome', default=shutil.which('google-chrome') or shutil.which('chromium') or '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    parser.add_argument('--suite', action='append', help='Run only the named suite(s), e.g. --suite academy')
    parser.add_argument('--screenshots', type=Path, help='Optional directory for English lobby and game screenshots')
    args = parser.parse_args()
    source = (ROOT / 'index.html').read_text(encoding='utf-8')
    total = 0
    pages = {}
    class Handler(SimpleHTTPRequestHandler):
        def do_GET(self):
            name = urlsplit(self.path).path
            if name in pages:
                content = pages[name].encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(content)))
                self.end_headers()
                self.wfile.write(content)
            else:
                super().do_GET()
        def log_message(self, *args):
            pass
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT)))
    server.daemon_threads = True
    threading.Thread(target=server.serve_forever, daemon=True).start()
    with tempfile.TemporaryDirectory(prefix='deep-sea-i18n-') as temp:
        folder = Path(temp)
        for suite, width, height in [('reaper',390,844), ('reaper',320,568), ('reaper',430,760), ('reaper',768,1024), ('reaper',1366,900), ('reaper',844,390), ('meow_link',390,844), ('meow_link',320,568), ('meow_link',430,760), ('meow_link',768,1024), ('meow_link',1366,900), ('meow_link',844,390), ('sand_art',390,844), ('sand_art',1366,900), ('sand_art',320,568), ('berry_trail',390,844), ('berry_trail',1366,900), ('berry_trail',844,390), ('outpost', 1366, 900), ('outpost', 390, 844), ('book_sort', 1366, 900), ('book_sort', 390, 844), ('book_sort', 844, 390), ('market_desk', 1366, 900), ('market_desk', 390, 844), ('market_desk', 844, 390), ('academy', 1366, 900), ('academy', 390, 844), ('core', 1366, 900), ('hans', 1366, 900), ('hans', 390, 844), ('games', 1366, 900), ('games', 390, 844),
                                     ('campaign', 1366, 900), ('campaign', 390, 844), ('campaign', 320, 550),
                                     ('merge', 1366, 900), ('merge', 390, 844), ('merge', 320, 480),
                                     ('ocean_link', 1366, 900), ('ocean_link', 844, 390), ('frontier', 1366, 900), ('frontier', 390, 844), ('frontier', 844, 390)]:
            if args.suite and suite not in args.suite:
                continue
            script = (ROOT / f'tools/i18n_browser_{suite}.js').read_text(encoding='utf-8')
            route = f'/{suite}-{width}.html'
            tested_source = source
            if suite == 'berry_trail':
                tested_source = tested_source.replace('function btValid(source)', 'berryRank.start = ready => ready(() => .4);\nfunction btValid(source)')
            if suite == 'campaign':
                anchor = "  campaignRules.create(Math.random, null, CP);CP.phase='ready';"
                hook = '''window.__campaignTest = {
                    phase: () => CP.phase, held: () => CP.hold, votes: () => CP.votes,
                    hospital: () => {
                        campaignRules.create(() => .4, null, CP);
                        CP.lots[0].name = '醫院'; CP.lots[0].quiet = true;
                        CP.dist = CP.lots[0].x0 - CP_TRUCK + 10;
                        CP.last = performance.now();
                    },
                    turnOffUpdates: () => { cpRank.update = () => {}; },
                    finish: () => cpLose('被檢舉落選'),
                    artReady: () => cpMobileTruck.naturalWidth > 0 && cpMobileHospital.naturalWidth > 0
                };
                cpRank.start = callback => callback(() => .4);'''
                assert anchor in tested_source
                tested_source = tested_source.replace(anchor, hook + anchor)
            if suite == 'merge':
                hook = 'window.__mergeTest = {state: G, localStart: () => beginMerge(null)};'
                tested_source = source.replace("  var swipe = null, elMgArea = elMg.closest('.mg-console');",
                                               hook + "  var swipe = null, elMgArea = elMg.closest('.mg-console');")
            if suite == 'frontier':
                hook = 'window.__frontierTest={world:function(){return world;},create:frontierWorld,step:frontierStep,plan:frontierPlan,goal:frontierGoal,upgrade:frontierUpgrade,leave:frontierLeave,finish:finishStage,persist:persist};'
                tested_source = source.replace('var preview=frontierWorld(1);', hook+'var preview=frontierWorld(1);')
            if suite == 'academy':
                tested_source = source.replace('const rules = academyRules;', 'const rules = academyRules; window.__academyTest = {rules, snapshot: () => ({phase, state, actions, bonusEarned})};')
            if suite == 'outpost':
                start = tested_source.index('  const outpostRoute =')
                end = tested_source.index('  var VIEWS =', start)
                game = tested_source[start:end].replace('requestAnimationFrame(', 'window.__outpostClock.request(')
                game = game.replace('cancelAnimationFrame(', 'window.__outpostClock.cancel(')
                tested_source = tested_source[:start] + game + tested_source[end:]
            pages[route] = tested_source.replace('<head>', '<head>' + MONITOR).replace('</body>', '<script>' + script + '</script></body>')
            page = f'http://127.0.0.1:{server.server_port}{route}'
            chrome = Chrome(args.chrome, folder / f'profile-{suite}-{width}')
            try:
                chrome.call('Emulation.setDeviceMetricsOverride', {'width': width, 'height': height, 'deviceScaleFactor': 1, 'mobile': width < 880}, page=True)
                if suite == 'core':
                    total += chrome.check(page, '?probe=default', 'Default Chinese')
                query = '?lang=en&keep=1' + ('&preview=frontier' if suite == 'frontier' else '') + ('#ocean-link' if suite == 'ocean_link' else '#frontier' if suite == 'frontier' else '')
                if suite == 'meow_link':
                    query += '#meow-link'
                if suite == 'campaign':
                    query += '#campaign'
                if suite == 'merge':
                    query += '#merge'
                if suite == 'outpost':
                    query += '#outpost'
                if suite == 'market_desk':
                    query += '#market-desk'
                if suite == 'academy':
                    query += '#academy'
                if suite == 'book_sort':
                    query += '#book-sort'
                total += chrome.check(page, query, f'{suite} {width}×{height}')
                if suite == 'outpost':
                    total += chrome.check(page, '?probe=saved#outpost', 'Outpost saved language')
                    total += chrome.check(page, '?probe=chinese&lang=zh-Hant#outpost', 'Outpost direct Chinese')
                if suite == 'book_sort':
                    if width == 1366:
                        total += chrome.check(page, '?probe=campaign-next&lang=en#book-sort', 'Stage 5 advances to stage 6')
                    chrome.evaluate("localStorage.setItem('deep-sea-book-sort-best', JSON.stringify({35:67}))")
                    total += chrome.check(page, '?probe=campaign-resume&lang=en#book-sort', f'Advanced progression {width}×{height}')
                if suite == 'market_desk':
                    total += chrome.check(page, '?probe=saved#market-desk', 'Market Desk saved language and score')
                    total += chrome.check(page, '?probe=chinese&lang=zh-Hant#market-desk', 'Market Desk direct Chinese')
                if suite == 'core':
                    for query, label in [('?probe=saved', 'Saved English after reload'), ('?probe=explicit&lang=zh-Hant', 'Explicit Chinese overrides saved English'), ('?probe=blocked&lang=en', 'Blocked preference storage')]:
                        total += chrome.check(page, query, label)
                if suite == 'campaign' and width == 390 and args.screenshots:
                    args.screenshots.mkdir(parents=True, exist_ok=True)
                    chrome.evaluate("deepSeaI18n.setLanguage('zh-Hant'); location.hash='campaign'")
                    time.sleep(.2)
                    chrome.evaluate("window.__campaignTest.hospital(); document.getElementById('cp-canvas').dispatchEvent(new PointerEvent('pointerdown',{pointerId:1,button:0}));")
                    time.sleep(.2)
                    capture = chrome.call('Page.captureScreenshot', {'format': 'png'}, page=True)
                    (args.screenshots / 'Campaign-Truck-Play-390.png').write_bytes(base64.b64decode(capture['data']))
                if suite == 'merge' and width == 390:
                    chrome.evaluate("location.hash='merge'")
                    for _ in range(50):
                        if chrome.evaluate("!document.getElementById('view-merge').hidden"):
                            break
                        time.sleep(.05)
                    chrome.evaluate("window.__mergeTest.localStart(); "
                                    "window.__mergeTest.state.grid = [1024, 1024, ...Array(14).fill(0)];")
                    for event, points in [('touchStart', [{'x': 260, 'y': 765}]),
                                          ('touchMove', [{'x': 150, 'y': 765}]), ('touchEnd', [])]:
                        chrome.call('Input.dispatchTouchEvent', {'type': event, 'touchPoints': points}, page=True)
                    if chrome.evaluate("document.getElementById('mg-max').textContent") != '2048':
                        raise RuntimeError('Swipe below the board did not merge the two 1024 pearls')
                    total += 1
                    print('PASS: Pearl Merge accepts a touch swipe below the board', flush=True)
                    if args.screenshots:
                        args.screenshots.mkdir(parents=True, exist_ok=True)
                        capture = chrome.call('Page.captureScreenshot', {'format': 'png'}, page=True)
                        (args.screenshots / 'merge-390.png').write_bytes(base64.b64decode(capture['data']))
                if suite == 'ocean_link' and width == 1366:
                    saved_balance = chrome.evaluate("localStorage.getItem('crush-depth-balance')")
                    chrome.call('Page.navigate', {'url': f'http://127.0.0.1:{server.server_port}/index.html#ocean-link'}, page=True)
                    for _ in range(80):
                        if chrome.evaluate("document.getElementById('ol-best')?.textContent === '10'"):
                            break
                        time.sleep(.05)
                    if not chrome.evaluate(f"""document.getElementById('ol-best').textContent === '10' &&
                       document.getElementById('ol-playfield').hidden &&
                       document.getElementById('balance').textContent === {json.dumps(saved_balance)}"""):
                        raise RuntimeError('Ocean Link reload failed to retain points and best stage')
                    total += 1
                    print('PASS: Ocean Link reload preserves points and records', flush=True)
                    chrome.evaluate("localStorage.setItem('crush-depth-balance', '0'); localStorage.setItem('deep-sea-regen-at', Date.now())")
                    total += chrome.check(page, '?probe=low&lang=zh-Hant#ocean-link', 'Ocean Link direct Chinese / zero balance')
                if suite == 'frontier' and not (width <= 600 and height > width):
                    total += chrome.check(page, '?probe=reload&preview=frontier#frontier', f'Frontier reload {width}')
                    chrome.evaluate("localStorage.removeItem('deep-sea-frontier-v1');localStorage.setItem('crush-depth-balance','0');localStorage.setItem('deep-sea-regen-at',Date.now())")
                    total += chrome.check(page, '?probe=low&lang=zh-Hant&preview=frontier#frontier', f'Frontier zero balance {width}')
                chrome.evaluate("var r=document.getElementById('test-results');if(r)r.remove();")  # the long result list itself can widen a mobile viewport
                actual = chrome.evaluate('innerWidth')
                if actual != width:
                    raise RuntimeError(f'Viewport is {actual}, expected {width}')
                if args.screenshots and suite == 'meow_link':
                    args.screenshots.mkdir(parents=True, exist_ok=True)
                    capture = chrome.call('Page.captureScreenshot', {'format':'png'}, page=True)
                    (args.screenshots / f'meow-link-{width}.png').write_bytes(base64.b64decode(capture['data']))
                    chrome.evaluate("deepSeaI18n.setLanguage('zh-Hant')")
                    time.sleep(.1)
                    capture = chrome.call('Page.captureScreenshot', {'format':'png'}, page=True)
                    (args.screenshots / f'meow-link-zh-{width}.png').write_bytes(base64.b64decode(capture['data']))
                    rect = chrome.evaluate("document.querySelector('#ml-board button').getBoundingClientRect().toJSON()")
                    point = {'x':rect['x']+rect['width']/2,'y':rect['y']+rect['height']/2}
                    chrome.call('Input.dispatchTouchEvent', {'type':'touchStart','touchPoints':[point]}, page=True)
                    chrome.call('Input.dispatchTouchEvent', {'type':'touchEnd','touchPoints':[]}, page=True)
                    if not chrome.evaluate("document.querySelector('#ml-board button').getAttribute('aria-pressed')==='true'"):
                        raise RuntimeError('Meow Link touch did not select tile')
                    total += 1
                    chrome.evaluate("location.hash='lobby'; window.scrollTo(0,0)")
                    time.sleep(.2)
                    capture = chrome.call('Page.captureScreenshot', {'format':'png'}, page=True)
                    (args.screenshots / f'meow-link-lobby-{width}.png').write_bytes(base64.b64decode(capture['data']))

                if args.screenshots and suite == 'games':
                    args.screenshots.mkdir(parents=True, exist_ok=True)
                    for view in ('lobby', 'dream'):
                        chrome.evaluate(f"document.getElementById('test-results').remove();location.hash='{view}';window.scrollTo(0,0)" if view == 'lobby' else f"location.hash='{view}';window.scrollTo(0,0)")
                        time.sleep(0.2)
                        capture = chrome.call('Page.captureScreenshot', {'format': 'png'}, page=True)
                        (args.screenshots / f'{view}-{width}.png').write_bytes(base64.b64decode(capture['data']))
            finally:
                chrome.close()
    server.shutdown()
    server.server_close()
    print(f'PASS: {total} isolated browser assertions')


if __name__ == '__main__':
    main()
