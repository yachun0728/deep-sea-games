"""List locales/en.json entries no visible source text uses (candidates for removal).

Read-only: python3 tools/i18n_audit.py [--price]   (--price also lists stale entries with fee/free wording)
"""
import json
import sys

sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from test_i18n import ROOT, source_texts  # noqa: E402
from test_i18n_policy import EN_BANNED, ZH_BANNED  # noqa: E402

import i18n_data  # noqa: E402
dictionary = i18n_data.dictionary(ROOT)
used = source_texts()
stale = sorted(k for k in dictionary if k not in used)
print(f'{len(dictionary)} entries, {len(used & dictionary.keys())} used by visible text, {len(stale)} not found in source')
if '--price' in sys.argv:
    stale = [k for k in stale if ZH_BANNED.search(k) or EN_BANNED.search(dictionary[k])]
    print(f'{len(stale)} of them mention free/fees')
for key in stale:
    print(' ', key[:80].replace('\n', ' '))
