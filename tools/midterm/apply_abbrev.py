"""Apply the approved abbreviations without reformatting unrelated JSON text."""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ABBR = json.loads(Path(__file__).with_name('abbrev.json').read_text(encoding='utf-8'))

def walk(obj):
    if isinstance(obj, dict):
        yield obj
        for v in obj.values(): yield from walk(v)
    elif isinstance(obj, list):
        for v in obj: yield from walk(v)

def apply(path, bank):
    raw = path.read_bytes()
    text = raw.decode('utf-8')
    data = json.loads(text)
    updates = {}
    count = 0
    for obj in walk(data):
        if bank:
            if obj.get('type') != 'fill' or not isinstance(obj.get('accept'), list): continue
            old = obj['accept']
            variants = list(dict.fromkeys(x.split('/')[0].strip() for x in old if isinstance(x, str) and '/' in x))
            matched = [v for z in variants for v in ABBR.get(z, [])]
            if not matched: continue
            new = list(old)
            for z in variants:
                for a in matched:
                    val = f'{z} / {a}'
                    if val not in new: new.append(val)
            field = 'accept'
        else:
            if obj.get('type') != 'check' or obj.get('kind') != 'name': continue
            old = obj.get('en')
            if not isinstance(old, list): continue
            new = list(old)
            for z in obj.get('zh', []):
                for a in ABBR.get(z, []):
                    if a not in new: new.append(a)
            field = 'en'
        if new != old:
            key = (field, tuple(old))
            if key in updates and updates[key] != new: raise ValueError(f'ambiguous array {path}: {key}')
            updates[key] = new
            count += 1
    if not updates: return 0
    pattern = re.compile(r'"(accept|en)"\s*:\s*(\[(?:[^"\]]|"(?:\\.|[^"\\])*")*\])', re.S)
    seen = set()
    def replace(m):
        arr = m.group(2); key = (m.group(1), tuple(json.loads(arr)))
        if key not in updates: return m.group(0)
        seen.add(key)
        added = updates[key][len(key[1]):]
        multiline = '\n' in arr
        if multiline:
            indent = re.search(r'\n([ \t]*)\S', arr).group(1)
            tail = re.search(r'\s*\]$', arr).group(0)
            replacement = arr[:-len(tail)] + ''.join(',\n' + indent + json.dumps(v, ensure_ascii=False) for v in added) + tail
        else:
            replacement = arr[:-1].rstrip() + (', ' if key[1] else '') + ', '.join(json.dumps(v, ensure_ascii=False) for v in added) + ']'
        return m.group(0)[:m.start(2)-m.start()] + replacement
    result = pattern.sub(replace, text)
    if seen != set(updates): raise ValueError(f'arrays not found in {path}')
    json.loads(result)
    path.write_bytes(result.encode('utf-8'))
    return count

if __name__ == '__main__':
    banks = sum(apply(p, True) for p in sorted((ROOT / 'content/bank/eye_anat/lab').rglob('*.json')))
    checks = sum(apply(p, False) for p in sorted((ROOT / 'content/learn/eye_anat').glob('lab-*.json')))
    checks += apply(ROOT / 'content/learn/eye_anat/midterm-review.json', False)
    print(f'updated bank questions: {banks}; name checks: {checks}')
