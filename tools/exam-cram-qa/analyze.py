"""建立考前必看的可追溯選題依據；不改題庫／答案。"""
import json, pathlib, re, collections
import fitz

ROOT = pathlib.Path(__file__).resolve().parents[2]
ARCHIVE = pathlib.Path('E:/學習/驗光師國考題')
questions = []
for p in sorted((ROOT / 'content/bank/physopt/exam').glob('*.json')):
    d = json.loads(p.read_text(encoding='utf-8'))
    for q in d['questions']:
        questions.append(dict(id=d['set']['id']+'-'+str(q['n']), unit=int(p.stem.split('-')[2][1:]), year=d['set']['year'], tags=q.get('tags', []), stem=q['stem']))

families = {
    1: [('index',['折射率','光速']),('vergence',['聚散度'])],
    2: [('surface',['表面屈光力','球面折射']),('snell',['司乃耳定律']),('critical',['全反射','臨界角']),('sag',['弧高']),('depth',['視深'])],
    3: [('maker',['表面屈光力']),('imaging',['薄透鏡成像']),('focus',['焦距','焦點']),('magnification',['橫向放大率']),('twice-focus',['對稱點'])],
    4: [('vertex-distance',['頂點距離']),('equivalent',['厚透鏡','等效屈光力']),('vertex-power',['後頂點屈光力','前頂點屈光力','中和屈光力'])],
    5: [('prentice',['Prentice 規則']),('prism',['稜鏡度','偏折角']),('lens-pair',['透鏡組']),('telescope',['伽利略望遠鏡','克卜勒望遠鏡','望遠鏡','角放大率','管長']),('components',['合成稜鏡'])]
}
report = dict(scope='第一～五單元：106～114 年已收錄的期中範圍國考選題；第六單元：同年份兩科完整原卷', curatedQuestionCount=len(questions), families={}, archiveQuestionCount=0, archivePapers=[], waveFamilies={})
for unit, rows in families.items():
    for key, tags in rows:
        hits = [q for q in questions if q['unit']==unit and set(q['tags']) & set(tags)]
        if key == 'components': hits = [q for q in hits if re.search(r'稜鏡處方|兩個稜鏡量',q['stem'])]
        report['families'][f'u{unit}:{key}'] = dict(count=len(hits), questionIds=[q['id'] for q in hits], years=sorted({q['year'] for q in hits}), matchTags=tags)
    print('u'+str(unit),[(key,report['families'][f'u{unit}:{key}']['count']) for key,_ in rows])

archive = []
for subject, course in [('驗光師','視覺光學'),('驗光生','眼鏡光學概要')]:
    for p in sorted((ARCHIVE / subject / course).glob('*.pdf')):
        year = int(re.match(r'\d+',p.stem).group())
        if not 106 <= year <= 114: continue
        with fitz.open(p) as doc:
            text = '\n'.join(page.get_text(sort=True) for page in doc if '測驗式試題標準答案' not in page.get_text()[:250])
        # 僅依序擷取原卷 1～50 題，避免把選項中的數字或頁碼當題號。
        expected, marks = 1, []
        for m in re.finditer(r'^\s*(\d{1,2})(?:[.．、]\s*|\s+)(?=[^\d\s])', text, re.M):
            if int(m.group(1)) == expected:
                marks.append((expected,m.start(),m.end())); expected += 1
                if expected == 51: break
        if len(marks)!=50: raise ValueError(f'{p.name}: expected 50 sequential questions, got {len(marks)}')
        paper = f'{subject}/{course}/{p.name}'
        report['archivePapers'].append(dict(file=paper,year=year,count=50))
        for i,(num,start,end) in enumerate(marks):
            body = text[end:marks[i+1][1] if i+1<len(marks) else len(text)]
            stem = re.split('[]',body,maxsplit=1)[0]
            archive.append(dict(id=paper+'#'+str(num),year=year,text=body,stem=stem))
report['archiveQuestionCount'] = len(archive)
patterns = {
    'reflection': r'反射率|reflectance',
    'film': r'抗反射|減反射|不反射膜|防反射|反射鍍|(?<!角)膜厚|(?<!角)膜.*四分之|薄膜|anti.reflect|quarter.wave',
    'slit': r'狹縫|狹缝|雙縫|雙狹|單狹|single.slit|double.slit',
    'phase': r'相位差|振幅|建設性干涉|破壞性干涉|波數|角頻率',
}
for key, pattern in patterns.items():
    hits = [q for q in archive if re.search(pattern,q['stem'],re.I)]
    report['waveFamilies'][key] = dict(count=len(hits), questionIds=[q['id'] for q in hits], years=sorted({q['year'] for q in hits}), pattern=pattern)
    print('u6',key,len(hits), 'years',report['waveFamilies'][key]['years'])
    for q in (hits if key=='film' else hits[:3]): print(q['id'],re.sub(r'\s+',' ',q['stem'])[:120])
out = ROOT / 'output/playwright/exam-cram-evidence.json'
out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Archive:',len(report['archivePapers']),'papers,',len(archive),'questions')
