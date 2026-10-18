"""逐課手寫易讀教材；原檢核、範例、實戰與記憶卡取自固定基準。"""
import copy
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = '22cfdff'

def lines(text):
    return text.strip().splitlines()

def page(title, text, **kw):
    return dict(type='card', title=title, body=lines(text), **kw)

class Rewrite:
    def __init__(self, unit, lid):
        self.unit, self.lid = unit, lid
        self.rel = f'content/learn/optometry/optom2/{unit}.json'
        self.path = ROOT / self.rel
        self.pack = json.loads(self.path.read_text(encoding='utf-8'))
        self.base = json.loads(subprocess.check_output(['git','show',f'{BASE}:{self.rel}'], cwd=ROOT))
        self.old = next(l for l in self.base['lessons'] if l['id'] == lid)
        self.cards = [s for s in self.old['steps'] if s['type'] == 'card']
        self.replacements = {}
        self.before = []

    def set(self, index, title, text, *, image=False, extra=()):
        assert index not in self.replacements
        old = self.cards[index]
        p = page(title, text)
        if old.get('flash'): p['flash'] = copy.deepcopy(old['flash'])
        if image and old.get('img'):
            p.update({k: old[k] for k in ('img','img_source') if k in old})
        out = [p, *extra]
        # 考點與例題移到接續頁，避免概念頁下方再堆兩大段。
        for i in range(0, len(old.get('exam', [])), 2):
            out.append(page('考題怎麼用：' + title, '> [!big] 用剛才的觀念，辨認題目在問哪一步。', exam=copy.deepcopy(old['exam'][i:i+2])))
        if old.get('demo'):
            out.append(page('帶著做：' + title, '> [!big] 先認條件，再決定動哪個設定。', demo=copy.deepcopy(old['demo'])))
        self.replacements[index] = out

    def save(self):
        assert set(self.replacements) == set(range(len(self.cards))), (self.lid, '尚有原概念未逐一改寫')
        new = copy.deepcopy(self.old)
        new['pace'] = 'free'
        out = []
        ci = 0
        for step in self.old['steps']:
            if step['type'] == 'card':
                if ci == 0: out.extend(self.before)
                out.extend(self.replacements[ci]); ci += 1
            else: out.append(copy.deepcopy(step))
        new['steps'] = out
        # 程式保證原題與複習卡不因重新排版失去對應。
        select = lambda l: [s for s in l['steps'] if s['type'] in ('check','example','practice')]
        flashes = lambda l: [f for s in l['steps'] for f in (s.get('flash',[]) if isinstance(s.get('flash',[]),list) else [s['flash']])]
        assert select(new) == select(self.old)
        assert flashes(new) == flashes(self.old)
        for i,l in enumerate(self.pack['lessons']):
            if l['id'] == self.lid: self.pack['lessons'][i] = new
        self.path.write_text(json.dumps(self.pack, ensure_ascii=False, indent=1)+'\n', encoding='utf-8')
        ledger_path = ROOT/'tools/learn-redo/optometry-progress.json'
        ledger = json.loads(ledger_path.read_text(encoding='utf-8'))
        for entry in ledger['lessons']:
            if (entry['unit'],entry['lesson']) == (self.unit,self.lid):
                entry.update(status='已改寫；原題與記憶卡完整性通過；待整體建置／畫面驗證', steps=len(out))
        ledger_path.write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        done = sum(e['status'] != '待改寫' for e in ledger['lessons'])
        note = ROOT/'SESSION_NOTE_OPTOMETRY.md'
        text = note.read_text(encoding='utf-8')
        marker = '\n## 逐課最新進度（自動更新）\n'
        text = text.split(marker)[0]
        text += marker + f'\n已改寫 {done}/27；最新完成 `{self.unit}/{self.lid}`，{len(out)} 步。原題與記憶卡逐項一致，整體建置與瀏覽器檢查另記。詳見逐課 JSON。\n'
        note.write_text(text,encoding='utf-8')
        print(f'{self.unit}/{self.lid}: {len(out)} steps; rewritten {done}/27')
