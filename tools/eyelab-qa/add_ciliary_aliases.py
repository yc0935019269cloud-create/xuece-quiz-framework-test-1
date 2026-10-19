"""Add explicit equivalent Chinese names; preserve English requirements and all question IDs."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ALIASES = {
    '睫狀後短動脈': ['後短睫狀動脈', '短後睫狀動脈'],
    '睫狀後長動脈': ['後長睫狀動脈', '長後睫狀動脈'],
}


def update(obj):
    if isinstance(obj, list):
        for item in obj:
            update(item)
    elif isinstance(obj, dict):
        for canonical, aliases in ALIASES.items():
            if isinstance(obj.get('zh'), list) and canonical in obj['zh']:
                obj['zh'] += [a for a in aliases if a not in obj['zh']]
            if isinstance(obj.get('match'), list) and canonical in obj['match']:
                obj['match'] += [a for a in aliases if a not in obj['match']]
            if isinstance(obj.get('accept'), list):
                originals = [v for v in obj['accept'] if canonical in v]
                for v in originals:
                    for alias in aliases:
                        answer = v.replace(canonical, alias)
                        if answer not in obj['accept']:
                            obj['accept'].append(answer)
            if isinstance(obj.get('explain'), list):
                obj['explain'] = [line + '、' + aliases[-1] if line.startswith('也可以寫：') and aliases[0] in line and aliases[-1] not in line else line for line in obj['explain']]
        for v in obj.values():
            update(v)


if __name__ == '__main__':
    changed = []
    sources = [*ROOT.joinpath('content/learn/eye_anat').rglob('*.json'), *ROOT.joinpath('content/bank/eye_anat').rglob('*.json'), ROOT / 'content/glossary/eye-lab.json']
    for path in sources:
        raw = path.read_text(encoding='utf-8-sig')
        data = json.loads(raw)
        before = json.dumps(data, ensure_ascii=False)
        update(data)
        if before == json.dumps(data, ensure_ascii=False):
            continue
        indent = len(re.search(r'\n( +)"', raw).group(1))
        path.write_text(json.dumps(data, ensure_ascii=False, indent=indent) + '\n', encoding='utf-8')
        changed.append(str(path.relative_to(ROOT)))
    print(json.dumps({'changed': changed}, ensure_ascii=False))
