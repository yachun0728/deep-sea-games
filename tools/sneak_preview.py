#!/usr/bin/env python3
"""Build the isolated Sneak Out patrol preview from the game's current sources."""
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "preview/sneak-patrol/index.html"
locale = json.loads((ROOT / "locales/zh-Hant.json").read_text(encoding="utf-8"))


def translate(source):
    return re.sub(r"\{\{t:([a-z0-9.]+)\}\}", lambda match: locale[match[1]], source)


game = ROOT / "games/sneak"
view = translate((game / "view.html").read_text(encoding="utf-8"))
view = view.replace('id="view-sneak" hidden', 'id="view-sneak"')
stage_menu = """
        <label class="preview-stage">試玩起點
          <select id="preview-level">
            <option value="1">第 1 關 · 一般開局</option>
            <option value="2">第 2 關 · 入口走廊</option>
            <option value="3">第 3 關 · 老闆走回座位</option>
            <option value="5">第 5 關 · 遮蔽物</option>
            <option value="8">第 8 關 · 保全巡邏</option>
            <option value="12">第 12 關 · 長空走廊</option>
            <option value="13">第 13 關 · 同事密集</option>
            <option value="14">第 14 關 · 快速折返</option>
          </select>
        </label>
"""
view = view.replace('<div class="sneak-actions">', '<div class="sneak-actions">'+stage_menu)
logic = translate((game / "game.js").read_text(encoding="utf-8"))
logic = logic.replace("'games/sneak/art/'", "'../../games/sneak/art/'").replace("localStorage", "practiceStorage")
logic = logic.replace("if(bonus)award(sneaking.score,bonus);\n else ", "")
rules = (ROOT / "shared/sneak-rules.cjs").read_text(encoding="utf-8")
css = (game / "style.css").read_text(encoding="utf-8")
page = f"""<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>偷偷下班 · 巡邏試玩</title>
<style>
*{{box-sizing:border-box}}
body{{margin:0;background:#091725;color:#ffedc5;font:16px system-ui,sans-serif}}
canvas{{display:block;touch-action:none}}
dl,dd,p{{margin:0}}
button,select{{font:inherit}}
[hidden]{{display:none!important}}
.rules{{display:none}}
{css}
#view-sneak .sneak-console{{height:100dvh}}
#view-sneak .preview-stage{{display:flex;align-items:center;gap:8px;margin-bottom:5px;font-size:14px}}
#view-sneak .preview-stage select{{pointer-events:auto;color:inherit;background:#1b2e40;border:1px solid #a68c63;border-radius:4px;min-height:44px;padding:4px 8px}}
#view-sneak [data-phase="run"] .preview-stage{{display:none}}
</style>
</head>
<body>
{view}
<script>
{rules}
</script>
<script>
(engine=>{{
  const $=id=>document.getElementById(id);
  const menu=$('preview-level');
  const query=new URLSearchParams(location.search);
  let stage=Number(query.get('stage'))||1;
  if(!Array.from(menu.options).some(option=>Number(option.value)===stage)) stage=1;
  menu.value=String(stage);
  menu.addEventListener('change',()=>{{
    query.set('stage',menu.value);
    location.search=query.toString();
  }});
  document.querySelector('.fs-exit').addEventListener('click',()=>location.reload());
  const instructions={{
    2:'前段走廊可以一路走。進辦公區後，再留意老闆和路過的同事。',
    3:'老闆走回座位時可以前進。看到回頭警示就準備停下。',
    5:'走到檔案櫃後可避開老闆的視線。路過的同事仍可能發現你。',
    8:'留意保全照地的方向。光束掃過時放開裝忙。',
    12:'遮蔽物少，趁老闆與保全都沒在看時走過空走廊。',
    13:'這關有四次同事巡經，記得在驚嘆號轉紅前放開。',
    14:'保全折返得更快，注意光束轉向。'
  }};
  if(instructions[stage])$('sk-msg').textContent=instructions[stage];
  const sneakRules={{...engine,create:(rng,version)=>engine.create(rng,version,stage)}};
  const practiceStorage={{getItem:()=>null,setItem(){{}}}};
  const S={{balance:0}},ENTRY_FEE=0,LOW_MSG='',AN={{start:()=>({{}}),end(){{}},progress(){{}},resume(){{}}}};
  const save=()=>{{}},renderAll=()=>{{}},fmt=n=>String(n);
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timedLeaderboard=()=>{{
    let carry=0;
    return {{
      start(callback){{carry=0;callback(Math.random)}},record(){{}},finish(){{}},busy:()=>false,
      update(ms,active,step){{
        if(!active())return;
        carry+=Math.min(ms,100);
        while(carry>=10&&active()){{carry-=10;step(.01)}}
      }}
    }};
  }};
  {logic}
}})(sneakRules);
</script>
</body>
</html>
"""
DEST.parent.mkdir(parents=True, exist_ok=True)
DEST.write_text(page, encoding="utf-8")
print(f"Wrote {DEST.relative_to(ROOT)}")
