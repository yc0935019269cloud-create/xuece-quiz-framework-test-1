"""只把已認可表格樣式延伸到九堂總複習；其餘正課樣式不變。"""
from s114_review_common import ROOT
import re
p=ROOT/'css/style.css';s=p.read_text(encoding='utf-8')
old='.lp:is([data-pack="optom2-u2-msr"], [data-pack="optom2-u3-vf"], [data-pack="optom2-u4-bb"])'
new='.lp:is([data-pack="optom2-u2-msr"], [data-pack="optom2-u3-vf"], [data-pack="optom2-u4-bb"], [data-pack^="s114-optometry-"][data-lesson="exam-review"], [data-pack="s114-optometry-va-sph"][data-lesson="l8"], [data-pack="s114-optometry-astigmatism-rx"][data-lesson="l7"], [data-pack="s114-optometry-retinoscopy-intro"][data-lesson="l5"])'
if old in s:
    s=s.replace(old,new).replace('/* 視光學二第2～4單元易讀版：','/* 視光學二第2～4單元＋114大一下九堂總複習易讀版：')
    p.write_text(s,encoding='utf-8')
    p=ROOT/'index.html';s=p.read_text(encoding='utf-8')
    version=max(map(int,re.findall(r'\?v=(\d+)',s)))+1
    s=re.sub(r'\?v=\d+',f'?v={version}',s)
    p.write_text(s,encoding='utf-8')
    print('Applied review-only table styles; cache',version)
else:print('Review-only styles already present')
