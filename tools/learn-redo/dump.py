"""印出改寫前的課（卡片全文、檢核題只印題目），給改寫時參考。python -X utf8 tools/learn-redo/dump.py eye_ans/ans-pathways.json l1 l2"""
import sys, os, json
sys.path.insert(0, os.path.dirname(__file__))
from common import Unit
U = Unit(sys.argv[1])
for lid in sys.argv[2:]:
    L = U.orig(lid); print('=====', lid, L['title'], '| teaches:', '、'.join(L.get('teaches') or []))
    for s in L['steps']:
        t = s['type']
        if t == 'check': print('[check]', s['q'])
        elif t == 'card':
            d = {k: v for k, v in s.items() if k not in ('type', 'img_source')}
            print('[card]', json.dumps(d, ensure_ascii=False))
        elif t in ('intro', 'recap'): print(f'[{t}]', json.dumps(s.get('body') or s.get('points'), ensure_ascii=False))
        elif t == 'example': print('[example]', s['title'])
        elif t == 'practice': print('[practice]', s['title'], s.get('qids'), [c['q'] for c in s.get('checks') or []])
        else: print(f'[{t}]', s.get('title'))
