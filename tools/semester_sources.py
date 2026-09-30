"""Download the six user-provided teaching sites for repeatable local conversion."""
from pathlib import Path
from urllib.request import urlopen
from concurrent.futures import ThreadPoolExecutor
import re, json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '資源' / '114 大一下' / '_來源'
HOSTS = ['glittering-pony-c07f88', 'lustrous-malasada-6d28a9', 'enchanting-mandazi-e371e7', 'gleeful-paletas-d56a9b', 'harmonious-rugelach-6d5134', 'frabjous-druid-ff547a']

def download(host):
    base = 'https://' + host + '.netlify.app/'
    dest = OUT / host
    dest.mkdir(parents=True, exist_ok=True)
    targets = ['index.html']
    result = []
    for name in targets:
        try:
            data = urlopen(base + name, timeout=30).read()
            p = dest / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(data)
            result.append({'file': name, 'url': base + name, 'bytes': len(data)})
            if name == 'index.html':
                text = data.decode('utf-8')
                targets.extend(x.lstrip('./') for x in re.findall(r'<script[^>]+src=["\']([^"\']+)', text) if not x.startswith(('http', '..')))
                if host == 'enchanting-mandazi-e371e7':
                    targets.append('chapters/10.html')
        except Exception as e:
            result.append({'file': name, 'error': str(e)})
    print(host, [(x['file'], x.get('bytes', x.get('error'))) for x in result])
    return {'host': host, 'files': result}

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=6) as pool:
        records = list(pool.map(download, HOSTS))
    (OUT / '_download_manifest.json').write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
