"""Run decor checks once in dependency order, stopping on failure.

Use --failed to explicitly resume failed checks after a correction. Passing
checks are retained, never repeated automatically. All output is saved as UTF-8.
"""
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/playwright'
REPORT = OUT / 'decor-tod-final-checks.json'
CHECKS = [
    ('assets', [sys.executable, 'tools/check_decor_assets.py']),
    ('text', [sys.executable, 'tools/decor_text.py']),
    ('data', [sys.executable, 'tools/decor_data.py']),
    ('browser', ['node', 'tools/decor-qa/check.cjs']),
    ('build', [sys.executable, 'tools/build.py', '--check', '--strict']),
]

os.chdir(ROOT)
os.environ['PYTHONUTF8'] = '1'
os.environ.setdefault('NODE_PATH', r'E:\NEWTEST\skull-atlas-3d\node_modules')
OUT.mkdir(parents=True, exist_ok=True)
resume = '--failed' in sys.argv
history = json.loads(REPORT.read_text(encoding='utf-8')) if resume and REPORT.exists() else []
latest = {r['check']: r['exitCode'] for r in history}
for name, args in CHECKS:
    if resume and latest.get(name) == 0:
        continue
    result = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                            text=True, encoding='utf-8', errors='replace')
    suffix = '-corrected' if resume else ''
    log = OUT / f'decor-tod-{name}{suffix}.log'
    log.write_text(result.stdout, encoding='utf-8')
    history.append({'check': name, 'exitCode': result.returncode, 'log': str(log.relative_to(ROOT)),
                    'afterFloorSeamCorrection': resume})
    REPORT.write_text(json.dumps(history, indent=2) + '\n', encoding='utf-8')
    print(f'{name}: exit {result.returncode}', flush=True)
    if result.returncode:
        sys.exit(result.returncode)
