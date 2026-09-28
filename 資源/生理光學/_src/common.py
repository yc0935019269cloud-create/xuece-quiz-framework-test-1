import json, os, sys
sys.stdout.reconfigure(encoding='utf-8')
OUT = r"E:\NEWTEST\新刷題庫框架 - TEST 1\資源\生理光學"
SUBJ = "physopt"
PATH = ["生理光學"]
SRC = "生理光學 OP205A（劉立中、何恭誠老師）課堂簡報、講義與上課逐字稿；Keating, Geometric, Physical, and Visual Optics, 2nd ed."


def L(x):
    """字串或多行 → 字串陣列"""
    if isinstance(x, list):
        return x
    return x.strip('\n').split('\n')


def intro(title, body):
    return {"type": "intro", "title": title, "body": L(body)}


def card(title, body, keys=None, tip=None, flash=None, img=None, img_source=None):
    d = {"type": "card", "title": title, "body": L(body)}
    if keys: d["keys"] = keys
    if tip: d["tip"] = tip
    if img: d["img"] = img
    if img_source: d["img_source"] = img_source
    if flash: d["flash"] = {"front": flash[0], "back": flash[1]}
    return d


def chk(kind, q, answer, explain, choices=None, hint=None, items=None, step=True):
    d = {"kind": kind, "q": q}
    if step: d = {"type": "check", **d}
    if choices is not None: d["choices"] = choices
    if items is not None: d["items"] = items
    if answer is not None: d["answer"] = answer
    if hint: d["hint"] = hint
    d["explain"] = explain if isinstance(explain, str) else "\n".join(explain)
    return d


def single(q, choices, ans, explain, hint=None):
    return chk("single", q, ans, explain, choices=choices, hint=hint)


def multi(q, choices, ans, explain, hint=None):
    return chk("multi", q, ans, explain, choices=choices, hint=hint)


def tf(q, ans, explain, hint=None):
    return chk("tf", q, ans, explain, hint=hint)


def fill(q, ans, explain, hint=None):
    return chk("fill", q, ans, explain, hint=hint)


def order(q, items, explain, hint=None):
    return chk("order", q, None, explain, items=items, hint=hint)


def pc(kind, q, answer, explain, choices=None, hint=None):
    """practice 內的自編題（不寫 type）"""
    return chk(kind, q, answer, explain, choices=choices, hint=hint, step=False)


def example(title, problem, steps, answer):
    return {"type": "example", "title": title, "problem": problem, "steps": steps, "answer": answer}


def practice(title, match, checks, n=2):
    return {"type": "practice", "title": title, "qids": [], "pick": {"match": match, "subjects": [SUBJ], "n": n}, "checks": checks}


def recap(points, flash, nxt=None):
    d = {"type": "recap", "points": points, "flash": [{"front": a, "back": b} for a, b in flash]}
    if nxt: d["next"] = nxt
    return d


def interactive(title, body, task, html, height=520):
    return {"type": "interactive", "title": title, "body": body, "task": task, "height": height, "html": html}


def diagram(title, body, img, source, points, mode="both"):
    return {"type": "diagram", "title": title, "body": body, "img": img, "source": source, "mode": mode,
            "points": [{"name": n, "desc": d, "x": x, "y": y} for n, d, x, y in points]}


def lesson(lid, title, goals, steps):
    return {"id": lid, "title": title, "goals": goals, "steps": steps}


def pack(pid, unit, title, desc, level, minutes, order_, tags, lessons, source=SRC):
    return {"schema": "xd-learn/1", "id": pid, "subject": SUBJ, "unit": unit, "title": title,
            "desc": desc, "level": level, "minutes": minutes, "order": order_, "source": source, "tags": tags,
            "lessons": lessons}


def q(type_, stem, answer, explain, tags, level=2, choices=None, accept=None, img=None, group=None, marks=None):
    d = {"type": type_, "stem": L(stem) if "\n" in stem else stem}
    if group: d["group"] = group
    if img: d["img"] = img
    if marks: d["marks"] = marks
    if choices is not None: d["choices"] = choices
    d["answer"] = answer
    if accept is not None: d["accept"] = accept
    d["explain"] = L(explain)
    d["tags"] = tags
    d["level"] = level
    return d


def bank(sid, name, order_, questions, source=SRC, groups=None):
    for i, x in enumerate(questions, 1):
        x_ = {"n": i}; x_.update(x); questions[i - 1] = x_
    d = {"schema": "xd-bank/1", "set": {"id": sid, "subject": SUBJ, "name": name, "path": PATH, "order": order_, "source": source}}
    if groups: d["groups"] = groups
    d["questions"] = questions
    return d


def save(rel, obj):
    p = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
    print('寫入', rel)


def html(s):
    """互動 HTML：保留為單一字串"""
    return s.strip()
