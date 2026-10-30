"""Turn the decor manifest into a file://-compatible JavaScript data file."""
import json
from pathlib import Path
from decor_scene_assets import validate_scene

ROOT = Path(__file__).resolve().parent.parent

def main():
    manifest = json.loads((ROOT / 'assets/decor/manifest.json').read_text(encoding='utf-8'))
    for entry in manifest['items'] + manifest['scenes']:
        path = (ROOT / entry['file']).resolve()
        if not path.is_relative_to(ROOT) or not path.is_file():
            raise FileNotFoundError(entry['file'])
    for entry in manifest['scenes']:
        errors, _ = validate_scene(ROOT, entry)
        if errors:
            raise ValueError(f"{entry['id']}: {'; '.join(errors)}")
    output = '// 自動產生，請勿手改；來源：assets/decor/manifest.json\nwindow.DECOR_DATA = ' + json.dumps(manifest, ensure_ascii=False, indent=2) + ';\n'
    (ROOT / 'js/decor-data.js').write_text(output, encoding='utf-8', newline='\n')
    print(f"已產生：{len(manifest['items'])} 件物件、{len(manifest['scenes'])} 個場景")

if __name__ == '__main__':
    main()
