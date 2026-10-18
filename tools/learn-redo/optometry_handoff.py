"""只在正式報告皆通過後，更新逐課完成狀態與可攜交接證據。"""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
out=ROOT/'output/playwright'
audit=json.loads((out/'optometry-readability-audit.json').read_text(encoding='utf-8'))
qa=json.loads((out/'optometry-readability-qa.json').read_text(encoding='utf-8'))
jcc=json.loads((out/'jcc-trial-qa.json').read_text(encoding='utf-8'))
assert len(audit['lessons'])==27 and not audit['issues'] and not qa['issues'] and not jcc['issues']
assert qa['rendered']==audit['totals']['steps']*2
assert qa['graded']==audit['totals']['checks']*2
assert len(qa['lessons'])==54
ledger_file=ROOT/'tools/learn-redo/optometry-progress.json'
ledger=json.loads(ledger_file.read_text(encoding='utf-8'))
for e in ledger['lessons']:
    a=next(l for l in audit['lessons'] if (l['unit'],l['lesson'])==(e['unit'],e['lesson']))
    e.update(status='完成並驗證',steps=a['steps'],checks=a['checks'],flashcards=a['flashcards'])
ledger['validation']=dict(build='python tools/build.py --strict: exit 0',rendered=qa['rendered'],graded=qa['graded'],issues=0,widths=qa['widths'],scope='file:// Edge；非實機iPad／真人理解測試')
ledger_file.write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
docs=ROOT/'docs/optometry-readability'
docs.mkdir(exist_ok=True)
for name in ('optometry-readability-audit.json','optometry-readability-qa.json','jcc-trial-qa.json'):
    (docs/name).write_bytes((out/name).read_bytes())
section='''

## 視光學二易讀版（2026-10-18，v117）

- 範圍限MSR／視野／雙眼平衡共27課，已依使用者認可的JCC第四版逐課改寫。先具體畫面→命名→原因／操作→數字；短表格、固定配色、一頁一個重點；概念可連續多頁，不強制每卡接題。勿用舊的每卡exam＋demo規則回退版型。
- 接手先讀 `SESSION_NOTE_OPTOMETRY.md`、`docs/視光學_易讀版改寫方法.md`、`tools/learn-redo/optometry-progress.json`；歷史試作在 `docs/視光學_易讀版試作.md`。本次27課均完成並驗證，不再等待試作核准。
- 正本仍為content的三個optom2-u2/u3/u4 JSON；逐課手寫腳本在tools/learn-redo的msr_l*（l4另用optom2_jcc_l4.py）、vf_l*、bb_l*，基準22cfdff。重跑指定課後需跑optometry_corrections.py，防止已修正的0 dB、微視野學習效應等舊文字回流，再build。
- 原課ID、97題檢核題幹、172張卡片正面與原範例／實戰／出處保留；必要的題解、卡背和1個多選選項更正有逐欄紀錄，答案仍ACD。MD／PD、±0.37取位、紅綠版本限制等區分見方法文件。原講義20/200散光<4.00的疑點保留待確認。
- 表格CSS僅套三單元；js/learn.js播放器外框用data-pack／data-lesson定位，快取v117。data由build產生，不手改。進行中的舊頁序可能變，建議回課頭重讀；未清除存檔。
- 正式QA：27課來源／出處／進度鍵核對；Edge file:// 1000／390px實際逐頁1260次、194判分、66例題展開、44圖、6抽題／6導航，0問題；JCC另有62渲染與互動狀態驗算。測試context備份還原localStorage，非實機iPad或醫學審稿。可攜JSON報告在docs/optometry-readability/。
- 舊sweep.cjs只改localStorage而未reload，不能用舊計數當逐頁證據；本次已加reload＋頁碼核對。新readability.cjs每課reload後實際按跳頁色條，驗證每頁類型、頁碼和判分。原optom2-qa/check.cjs的每卡exam＋demo約束已過時。
'''
for name in ('CLAUDE.md','AGENTS.md'):
    file=ROOT/name
    text=file.read_text(encoding='utf-8')
    if '## 視光學二易讀版（2026-10-18，v117）' not in text:
        file.write_text(text.rstrip()+section,encoding='utf-8')
note=ROOT/'SESSION_NOTE_OPTOMETRY.md'
text=note.read_text(encoding='utf-8')
text=text.replace('當前剩餘：將本任務檔案明確提交、推送並核對遠端；不要再重做教材。發布狀態以Git記錄與下方記錄為準。','教材、交接與驗證均完成，不要再重做教材。使用者授權完成後推Git；發布狀態以最新Git提交及origin/main對應為準，檔案不寫自我引用的提交雜湊。')
text=text.replace('27/27已改寫並驗證；準備提交／推送。詳細分課狀態見JSON。','27/27已改寫並驗證；沒有尚待補寫的課。詳細分課狀態見JSON；可攜驗證報告在docs/optometry-readability/。')
note.write_text(text,encoding='utf-8')
print('27 lesson statuses verified; handoff and portable QA reports updated')
