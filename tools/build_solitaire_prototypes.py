#!/usr/bin/env python3
"""Embed the rule source and approved assets into independent, unranked prototype pages."""
import base64
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
for gid,kind,zh,en in [('midnight-solitaire','classic','夜航經典接龍','Midnight Klondike'),('orbit-freecell','freecell','星軌新接龍','Orbit FreeCell')]:
    art=ROOT/'games'/gid/'art'
    data=lambda name:'data:image/webp;base64,'+base64.b64encode((art/name).read_bytes()).decode()
    values={'ID':gid,'KIND':kind,'ZH_TITLE':zh,'TITLE':en,'CLASS':'orbit' if kind=='freecell' else 'train','COLS':8 if kind=='freecell' else 7,'BG':data('background.webp'),'BACK':data('back.webp'),'COURT':data('courts.webp'),'RULES':(ROOT/'shared/solitaire-rules.cjs').read_text()}
    page=(ROOT/'tools/solitaire-prototype.html').read_text()
    for k,v in values.items():page=page.replace('__'+k+'__',str(v))
    (ROOT/'preview'/gid/'index.html').write_text(page)
    print('Built standalone preview/'+gid+'/index.html')
