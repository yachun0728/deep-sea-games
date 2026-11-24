#!/usr/bin/env python3
"""Export 社畜要下班 (rocket-chair) as a CrazyGames build.

Output: output/rocket-chair-crazygames/ (index.html + assets) and output/rocket-chair-crazygames.zip

What changes compared with the site version (games/rocket-chair/original.html):
- English only (CrazyGames targets a global audience; the site page is Traditional Chinese).
- No points wallet, entry fee, coffee purchase or BONUS: everything is free to play.
- No analytics, no share / copy-URL buttons, no links back to our site (CrazyGames terms 10.2b, privacy §12).
- CrazyGames SDK v3: init, loadingStop, gameplayStart / gameplayStop, mute setting,
  and a real rewarded ad (instead of the site's fake "demo ad") for the once-per-round continue.
- The page still runs when the SDK is missing (local test): the ad continue button is then hidden.

The site version is never modified. Run: python3 tools/export_crazygames_rocket.py
"""
import os, re, shutil, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'games', 'rocket-chair', 'original.html')
RULES = os.path.join(ROOT, 'shared', 'rocket-chair-rules.js')
ASSETS = os.path.join(ROOT, 'games', 'rocket-chair', 'assets', 'comic')
OUT = os.path.join(ROOT, 'output', 'rocket-chair-crazygames')
ZIP = os.path.join(ROOT, 'output', 'rocket-chair-crazygames.zip')

# Exact source text -> English. Longest keys are applied first.
EN = {
  '社畜要下班 吼破天花板': 'Roar Through the Ceiling!',
  '已複製網址，貼到 Safari / Chrome 開啟': 'Link copied. Paste it into Safari or Chrome',
  '複製失敗，請手動複製網址列': 'Copy failed. Please copy the address bar manually',
  '已複製成績，貼給同事吧': 'Score copied!',
  '複製失敗，請手動截圖': 'Copy failed. Please take a screenshot',
  '複製失敗': 'Copy failed',
  '事件 JSON 已複製': 'Events copied',
  '咖啡補給不限次數': '',
  '特濃咖啡，喝！': 'Espresso!',
  '領取一杯特濃咖啡': 'Espresso',
  '會議再拖 ${CONFIG.coffeeExtendSeconds} 秒，接下來 ${CONFIG.coffeeBoostSeconds} 秒推力加倍': 'Meeting +${CONFIG.coffeeExtendSeconds}s, double thrust for ${CONFIG.coffeeBoostSeconds}s',
  '會議再拖 ${CONFIG.coffeeExtendSeconds} 秒，${CONFIG.coffeeBoostSeconds} 秒內推力加倍': 'Meeting +${CONFIG.coffeeExtendSeconds}s, double thrust for ${CONFIG.coffeeBoostSeconds}s',
  '點數不夠（需要 ${CONFIG.coffeeCost} 點），可以先看廣告': 'Not enough points',
  '我對著手機大吼，坐著火箭椅提早了 ${g.cleared ? g.early : 0} 分鐘下班\\n稱號：「${rankOf(g)}」\\n你們部門誰最會落跑？ ${cleanUrl()}': 'I yelled at my phone and rocketed out of the office ${g.cleared ? g.early : 0} min early!\\nTitle: ${rankOf(g)}',
  '對著手機大吼，衝破 5 層樓': 'Yell at your phone. Smash through 5 floors.',
  '準備落跑': 'Escape the Office',
  '音效開關': 'Sound on / off',
  '對著手機大吼，點火！': 'Yell to ignite!',
  '正常模式・點火': 'Normal mode · Ignite',
  '大吼一聲就能衝': 'One big yell and you blast off',
  '小聲模式・點火': 'Quiet mode · Ignite',
  '在捷運上也能玩，哼歌就能飛': 'Play anywhere: humming is enough to fly',
  '不方便出聲？用按的玩': 'Can’t make noise? Play with touch',
  '回首頁': 'Home',
  '請安靜 2 秒': 'Stay quiet for 2 seconds',
  '正在聽聽辦公室有多吵': 'Listening to how noisy your office is',
  '跳過校準（用上次的設定）': 'Skip calibration (use last settings)',
  '這裡讀不到麥克風': 'Can’t access the microphone here',
  '請用 Safari / Chrome 開啟': 'Open the game in Safari or Chrome',
  '複製網址': 'Copy link',
  '用按的玩': 'Play with touch',
  '先躲一下': 'Hiding for a moment',
  '主管還在開會，趕快回來': 'The boss is still in the meeting. Come back quickly!',
  '繼續落跑': 'Keep escaping',
  '主管要開完會了！': 'The meeting is almost over!',
  '看 5 秒示範廣告': 'Watch an ad',
  '主管的會議延長 20 秒（每局 1 次）': 'The meeting runs 20 seconds longer (once per round)',
  '放棄，乖乖留下': 'Give up and stay at work',
  '示範廣告': 'Ad',
  '這不是真的廣告': '',
  '點數不夠': 'Not enough points',
  '每局需要': 'Each round needs',
  '之後 30 分鐘狂煎': '',
  '再吼一次': 'Yell again',
  '分享成績': 'Share score',
  '請把手機轉回直的': 'Please rotate your phone back to portrait',
  '遊戲先暫停': 'The game is paused',
  '直接過關': 'Clear',
  '直接失敗': 'Fail',
  '匯出事件': 'Export events',
  '1F 業務部': '1F Sales',
  '2F 財務部': '2F Finance',
  '3F 會議室': '3F Meeting Room',
  '4F 茶水間': '4F Break Room',
  '5F 頂樓前': '5F Below the Roof',
  '大吼一聲試試看！': 'Give your loudest yell!',
  '輕輕哼一聲試試看！': 'Hum softly!',
  '小聲模式：之後輕輕哼歌就能飛': 'Quiet mode: a soft hum is enough to fly',
  '用你最大的聲音，等一下就是這麼大聲才衝得快': 'Your loudest voice: this is how loud you need to be to go fast',
  '好像沒聽到，再一次！': 'Didn’t catch that. Try again!',
  '對著手機大聲一點': 'Yell louder at your phone',
  '校準完成！': 'Calibration done!',
  '準備點火……': 'Getting ready to ignite...',
  '沒有拿到麥克風權限': 'No microphone permission',
  '可以到瀏覽器設定允許麥克風，或先用按的玩': 'Allow the microphone in your browser settings, or play with touch',
  '把手機轉回直的再繼續': 'Rotate your phone back to portrait to continue',
  '欸你有空嗎？': 'Got a minute?',
  '報帳單請在今天交齊': 'Expense reports due TODAY',
  '開會中': 'In a meeting',
  '灑水中': 'Sprinklers on',
  '往頂樓': 'To roof',
  '會議剩': 'Meeting',
  '加班之王': 'Overtime King',
  '下班火箭': 'Quitting-Time Rocket',
  '落跑專家': 'Escape Artist',
  '落跑新手': 'Rookie Runaway',
  '準時下班族': 'Right-on-Time Worker',
  '剛好 18:00，準時下班！': 'Exactly 6:00 PM. Right on time!',
  '今天也準時……<br>不，加班了。': 'Right on time...<br>no, overtime again.',
  '`你提早了 <b>${g.early} 分鐘</b>下班！`': '`You left <b>${g.early} min</b> early!`',
  '`稱號<br><b>${rankOf(g)}</b>`': '`Title<br><b>${rankOf(g)}</b>`',
  '`你衝到了 ${FLOOR_INFO[G.floor].name}，還差 ${FLOORS - G.floor} 層天花板`': '`You reached ${FLOOR_INFO[G.floor].name}. ${FLOORS - G.floor} more ceilings to go`',
  '`主管的會議延長 ${CONFIG.adExtendSeconds} 秒（每局 1 次）`': '`The meeting runs ${CONFIG.adExtendSeconds} seconds longer (once per round)`',
  '這局已經看過了': 'Already used this round',
  '`會議延長 ${CONFIG.adExtendSeconds} 秒！`': '`Meeting extended by ${CONFIG.adExtendSeconds} seconds!`',
  '主管又開始講了，趕快繼續衝': 'The boss started talking again. Keep going!',
  '看完了，繼續衝！': 'Done. Keep going!',
  '`特濃咖啡 ${Math.ceil(G.coffeeLeft)} 秒`': '`Espresso ${Math.ceil(G.coffeeLeft)}s`',
  '快速點兩下衝刺，就能撞破天花板！': 'Double-tap to dash and smash the ceiling!',
  '突然大吼一聲，就能撞破天花板！': 'A sudden loud yell smashes the ceiling!',
  '按住螢幕往上飛，快速點兩下衝刺': 'Hold the screen to fly up, double-tap to dash',
  '哼歌往上飛，突然大聲一下衝刺': 'Hum to fly up, get suddenly loud to dash',
  '對著手機大吼往上飛，短吼一聲衝刺': 'Yell at your phone to fly up, a short yell to dash',
  '好想下班……': 'I wanna go home...',
  '會議剩 5 分鐘': 'Meeting: 5 min left',
  '（降噪耳機開到最大）': '(noise-canceling at max)',
  '水桶': 'Water jug',
  '立可白': 'Thrusters',
  '點一下跳過': 'Tap to skip',
  '自由了——！': 'FREEDOM!',
  '原來大家都想提早下班。': 'Turns out everyone wants to leave early.',
  '你要去哪？': 'Where do you think you’re going?',
  '今天也沒辦法提早下班。': 'No leaving early today either.',
  '衝刺': 'DASH',
  "'掉'": "'DOWN'", "'停'": "'HOLD'", "'飛'": "'FLY'", "'衝'": "'BOOST'",
  "'叮'": "'DING'",
  '下班！': 'Clock out!',
  '排行榜仍在處理上一局，請稍後再試。': 'Please wait a moment and try again.',
}

# Text the shared rules file draws on the canvas (floating words, gossip bubbles).
# Only the exported copy is translated; the site and the Worker keep the original file.
RULES_EN = {
  '1F 業務部': '1F Sales', '2F 財務部': '2F Finance', '3F 會議室': '3F Meeting Room',
  '4F 茶水間': '4F Break Room', '5F 頂樓前': '5F Below the Roof',
  "' 分鐘'": "' min'",
  '欸你有空嗎？': 'Got a minute?',
  '啪！': 'SPLAT!',
  '被拉進會議……': 'Pulled into a meeting...',
  '欸你知道嗎……': 'Did you hear...',
  '咚！': 'BONK!',
  "'欸你知道嗎'": "'Did you hear'",
  "'聽說……'": "'Rumor is...'",
  "'他們兩個……'": "'Those two...'",
  "'我跟你講喔'": "'Listen up'",
  "'不要說是我說的'": "'Don’t quote me'",
  '推力減半！': 'Half thrust!',
}


def chinese_left(code):
    """Chinese still in code (comments ignored)."""
    code = re.sub(r'/\*.*?\*/|//[^\n]*|<!--.*?-->', '', code, flags=re.S)
    return sorted(set(re.findall(r'[一-鿿][^\'"`<>\n]{0,30}', code)))


# CrazyGames SDK glue, injected after the game script.
SHIM = r"""
<script>
/* ===== CrazyGames build: free to play, no analytics, SDK v3 ===== */
(function(){
  track = function(){};                                   // no analytics on CrazyGames
  Wallet.isFree = () => true; Wallet.canStart = () => true; Wallet.spend = () => true; Wallet.tick = () => false; Wallet.bal = 1e9;
  ['btn-coffee','coffee-note','btn-share','btn-copy','btn-low-ad','debug'].forEach(id => { const e = $(id); if (e) e.classList.add('hidden'); });
  if (!IS_MOBILE) { $('btn-touch').textContent = 'No mic? Play with SPACE or mouse'; $('btn-mf-touch').textContent = 'Play with SPACE or mouse'; }
  const adBtn = $('btn-ad'); adBtn.classList.add('hidden');
  let sdk = null, playing = false;
  const start = () => { if (sdk && !playing) { playing = true; try { sdk.game.gameplayStart(); } catch (e) {} } };
  const stop = () => { if (sdk && playing) { playing = false; try { sdk.game.gameplayStop(); } catch (e) {} } };
  // gameplay start / stop around the real play state
  const _startGame = startGame; startGame = function(){ const r = _startGame.apply(this, arguments); start(); return r; };
  const _resumePlay = resumePlay; resumePlay = function(){ const r = _resumePlay.apply(this, arguments); start(); return r; };
  const _pauseGame = pauseGame; pauseGame = function(){ stop(); return _pauseGame.apply(this, arguments); };
  const _timeUp = timeUp; timeUp = function(){ stop(); return _timeUp.apply(this, arguments); };
  const _levelClear = levelClear; levelClear = function(){ stop(); return _levelClear.apply(this, arguments); };
  const _showResult = showResult; showResult = function(){ stop(); return _showResult.apply(this, arguments); };
  // rewarded ad replaces the site's demo ad: once per round, the meeting runs longer
  const _renderRevive = renderRevive; renderRevive = function(){ _renderRevive.apply(this, arguments); adBtn.classList.toggle('hidden', !sdk || G.adUsed >= CONFIG.adContinuePerGame); };
  adBtn.onclick = () => {
    if (!sdk || !G || G.adUsed >= CONFIG.adContinuePerGame) return;
    const was = muted; let done = false;
    sdk.ad.requestAd('rewarded', {
      adStarted: () => { muted = true; },
      adFinished: () => { muted = was; if (done) return; done = true;
        rocketControl(124); reviveContinue();
        $('pause-title').textContent = `Meeting extended by ${CONFIG.adExtendSeconds} seconds!`;
        $('pause-desc').textContent = 'The boss started talking again. Keep going!'; },
      adError: () => { muted = was; toast('No ad available right now'); adBtn.classList.add('hidden'); },
    });
  };
  // mute setting from the CrazyGames page
  const applyMute = (s) => { if (s && typeof s.muteAudio === 'boolean') { muted = s.muteAudio; $('mute').classList.toggle('muted', muted); } };
  const s = document.createElement('script'); s.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
  s.onload = () => { const C = window.CrazyGames && window.CrazyGames.SDK; if (!C) return;
    Promise.resolve(C.init()).then(() => { sdk = C;
      try { sdk.game.loadingStop(); } catch (e) {}
      try { applyMute(sdk.game.settings); sdk.game.addSettingsChangeListener(applyMute); } catch (e) {}
      if (appState === 'play') start();
    }).catch(() => {}); };
  document.head.appendChild(s);
})();
</script>
"""


def cut(html, old, new):
    """Replace a source block that must exist exactly once, so a site change cannot silently skip it."""
    assert html.count(old) == 1, f'expected exactly one match for: {old[:60]}'
    return html.replace(old, new)


def build():
    html = open(SRC, encoding='utf-8').read()
    # Points screen is unreachable (everything is free); drop its fee line so no stray "點" is left.
    html = cut(html, '<p>每局需要 <span id="low-fee"></span> 點</p>', '<span id="low-fee" class="hidden"></span>')
    # No player id at all: analytics is off, so nothing random is stored on the player's device.
    html = cut(html, """const playerId = (() => {
  let id = lsGet('mini_player_id');
  if (!id) { id = 'p_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); lsSet('mini_player_id', id); }
  return id;
})();""", "const playerId = '';")
    # English floor names are longer than the Chinese ones: size the floor sign to its text.
    html = cut(html, """  hudBox(c, x + 4, y, 112, 34, '#ffd23f');
  comicText(c, text, x + 60, y + 17, 17);""", """  c.font = `italic 900 17px ${FONT}`; const sw = Math.max(112, Math.ceil(c.measureText(text).width) + 26);
  hudBox(c, x + 4, y, sw, 34, '#ffd23f');
  comicText(c, text, x + 4 + sw / 2, y + 17, 17);""")
    # Thrust meter labels sit 46px apart at the low end: an arrow instead of "DOWN" so it doesn't run into "HOLD".
    html = cut(html, "['掉', 0.075]", "['↓', 0.075]")
    # Desktop players have no touch screen: name the Space key and the mouse in the hints.
    html = cut(html, "'快速點兩下衝刺，就能撞破天花板！'",
               "(IS_MOBILE ? 'Double-tap to dash and smash the ceiling!' : 'Double-tap SPACE to dash and smash the ceiling!')")
    html = cut(html, "'按住螢幕往上飛，快速點兩下衝刺'",
               "(IS_MOBILE ? 'Hold the screen to fly up, double-tap to dash' : 'Hold SPACE or the mouse to fly up, double-tap to dash')")
    html = cut(html, "'對著手機大吼往上飛，短吼一聲衝刺'", "'Yell to fly up, a short yell to dash'")
    html = cut(html, '<div id="t-sub">對著手機大吼，衝破 5 層樓</div>', '<div id="t-sub">Yell to fly. Smash through 5 floors.</div>')
    html = cut(html, "'對著手機大聲一點'", "'Yell a bit louder'")
    for zh in sorted(EN, key=len, reverse=True):
        html = html.replace(zh, EN[zh].replace("'", '’') if not EN[zh].startswith(("'", '`')) else EN[zh])
    html = html.replace('<html lang="zh-Hant">', '<html lang="en">')
    html = html.replace('src="../../shared/rocket-chair-rules.js"', 'src="rocket-chair-rules.js"')
    html = html.replace('assets/comic/', 'assets/')
    html = re.sub(r'\.\./\.\./', '', html)
    # loading start as early as possible is handled by the SDK itself; inject glue before </body>
    html = html.replace('</body>', SHIM + '</body>', 1)
    rules = open(RULES, encoding='utf-8').read()
    for zh in sorted(RULES_EN, key=len, reverse=True):
        rules = rules.replace(zh, RULES_EN[zh])
    left = chinese_left(html) + chinese_left(rules)
    if os.path.isdir(OUT): shutil.rmtree(OUT)
    os.makedirs(os.path.join(OUT, 'assets'))
    open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
    open(os.path.join(OUT, 'rocket-chair-rules.js'), 'w', encoding='utf-8').write(rules)
    for f in os.listdir(ASSETS):
        if f.endswith('.webp'): shutil.copy(os.path.join(ASSETS, f), os.path.join(OUT, 'assets', f))
    if os.path.exists(ZIP): os.remove(ZIP)
    with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED) as z:
        for base, _, files in os.walk(OUT):
            for f in files:
                p = os.path.join(base, f); z.write(p, os.path.relpath(p, OUT))
    size = sum(os.path.getsize(os.path.join(b, f)) for b, _, fs in os.walk(OUT) for f in fs)
    count = sum(len(fs) for _, _, fs in os.walk(OUT))
    print(f'Built {OUT} ({count} files, {size/1e6:.2f} MB) and {ZIP} ({os.path.getsize(ZIP)/1e6:.2f} MB)')
    if left: print('Untranslated Chinese left in code (check):', left)


if __name__ == '__main__':
    build()
