#!/usr/bin/env python3
"""Generate preview/bird-art/index.html: a standalone, wallet-free trial page of the bird game
(games/bird/game.js + shared/bird-rules.cjs) so new art can be played before it ships.
Re-run after editing games/bird/game.js."""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
loc = json.loads((ROOT / 'locales/zh-Hant.json').read_text(encoding='utf-8'))
t = lambda m: loc[m.group(1)]
game = re.sub(r'\{\{t:([a-z0-9.]+)\}\}', t, (ROOT / 'games/bird/game.js').read_text(encoding='utf-8'))
game = game.replace('deep-sea-bird-best', 'proto-bird-art-best').replace("'./games/bird/art/'", "'../../games/bird/art/'")
rules = (ROOT / 'shared/bird-rules.cjs').read_text(encoding='utf-8').replace('if (typeof module', 'if (false && typeof module')
page = f'''<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow"><title>便便鳥大戰狼群 · 美術試玩</title>
<style>
html,body{{margin:0;height:100%;background:#12203a;color:#e8f2ff;font:14px system-ui,sans-serif;overscroll-behavior:none}}
#view-bird{{position:fixed;inset:0;display:flex;justify-content:center;align-items:stretch}}
.stage{{position:relative;height:100dvh;aspect-ratio:400/560;max-width:100vw;width:100%}}
@media(max-width:880px){{.stage{{aspect-ratio:auto}}}}
canvas{{display:block;width:100%;height:100%;touch-action:none;-webkit-user-select:none;user-select:none}}
.tag{{position:absolute;top:8px;right:8px;z-index:5;padding:2px 8px;border-radius:99px;background:#ffd23f;color:#1b1b2f;font:700 11px system-ui}}
.stats{{position:absolute;z-index:3;top:8px;left:8px;right:90px;display:flex;gap:5px;margin:0;pointer-events:none}}
.stats>div{{flex:1;padding:3px 6px;border-radius:8px;background:rgba(5,12,24,.72)}}
.stats dt{{font-size:10px;margin:0}}.stats dd{{font-size:13px;margin:0}}
.go{{position:absolute;z-index:4;left:50%;transform:translateX(-50%);bottom:max(16px,env(safe-area-inset-bottom));width:min(88%,360px);min-height:56px;border:0;border-radius:14px;background:#6c1fff;color:#fff;font:700 17px system-ui}}
.go:disabled{{display:none}}
.msg{{position:absolute;z-index:3;left:12px;right:12px;bottom:84px;margin:0;padding:3px 10px;border-radius:12px;background:rgba(5,12,24,.78);font-size:12px;text-align:center;pointer-events:none}}
.msg:empty{{display:none}}
[hidden]{{display:none!important}}
</style></head><body>
<section id="view-bird"><div class="stage">
<canvas id="pb-canvas" tabindex="0" width="400" height="560"></canvas><span class="tag">美術試玩 · 未上架</span>
<dl class="stats"><div><dt>本局距離</dt><dd id="pb-score">0 m</dd></div><div><dt>擊退狼王</dt><dd id="pb-boss">0 隻</dd></div><div><dt>最佳紀錄</dt><dd id="pb-best">0 m</dd></div></dl>
<input id="pb-amount" type="hidden" value="0"><button class="go" id="pb-go" type="button">開始奔跑</button>
<p class="msg" id="pb-msg"></p></div></section>
<script>
{rules}
</script>
<script>
(function(){{
const $=id=>document.getElementById(id);
const S={{balance:0}},ENTRY_FEE=0,LOW_MSG='',AN={{start(){{return{{}}}},end(){{}},progress(){{}}}};
const renderAll=()=>{{}},save=()=>{{}},fmt=n=>String(n),reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const timedLeaderboard=()=>({{start(cb){{cb(Math.random)}},record(){{}},finish(){{}},busy:()=>false,update(ms,active,step){{step(ms/1000)}}}});
var birdBusy=false,birdStake=0,birdSay=function(){{}};
{game}
}})();
</script></body></html>
'''
out = ROOT / 'preview/bird-art/index.html'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(page, encoding='utf-8')
print('Wrote', out.relative_to(ROOT))
