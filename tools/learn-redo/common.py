"""眼解剖生理學（115 大二上）易讀版重寫：共用工具。
每一課一支腳本（例：blood_retina_l1.py），用法：
    from common import *
    U = Unit('eye_ans/blood/blood-retina.json')
    old = U.orig('l2')            # 改寫前的課（從 git 7a517e7 取，腳本可重跑）
    U.put('l2', steps=[...], goals=[...])
    U.save()
規格與寫法原則：docs/眼解剖生理學_易讀版改寫方法.md
"""
import json, subprocess
ROOT = 'E:/NEWTEST/新刷題庫框架 - TEST 1/'
BASE_COMMIT = '7a517e7'   # 改寫前的版本（舊課的檢核題、記憶卡、範例、實戰從這裡取）


class Unit:
    def __init__(self, rel):
        self.rel = 'content/learn/' + rel
        self.file = ROOT + self.rel
        self.d = json.load(open(self.file, encoding='utf-8'))
        raw = subprocess.run(['git', '-C', ROOT, 'show', f'{BASE_COMMIT}:{self.rel}'], capture_output=True).stdout
        self.o = json.loads(raw.decode('utf-8'))

    def orig(self, lid):
        return next(l for l in self.o['lessons'] if l['id'] == lid)

    def put(self, lid, steps, goals=None, title=None, pace='free'):
        old = self.orig(lid)
        new = dict(old)
        new['steps'] = steps
        if goals: new['goals'] = goals
        if title: new['title'] = title
        if pace: new['pace'] = pace
        self.d['lessons'] = [new if l['id'] == lid else l for l in self.d['lessons']]
        n = sum(s['type'] == 'card' for s in steps)
        print(f'{self.d["id"]}/{lid}：{len(steps)} 步、概念頁 {n}')

    def save(self):
        open(self.file, 'w', encoding='utf-8').write(json.dumps(self.d, ensure_ascii=False, indent=2) + '\n')


def pick(lesson, kind, q=None, title=None):
    """從舊課取出一步（檢核題用題目文字找；example/practice/recap 用類型找）。"""
    for s in lesson['steps']:
        if s['type'] != kind: continue
        if q and s.get('q') != q: continue
        if title and s.get('title') != title: continue
        return s
    raise KeyError((kind, q, title))


def checks(lesson):
    return [s for s in lesson['steps'] if s['type'] == 'check']


def card(title, body, exam, img=None, src=None, demo=None, keys=None, flash=None, tip=None):
    s = {'type': 'card', 'title': title, 'body': body, 'exam': exam}
    if img: s['img'] = img; s['img_source'] = src
    if demo: s['demo'] = demo
    if keys: s['keys'] = keys
    if flash: s['flash'] = flash
    if tip: s['tip'] = tip
    return s
