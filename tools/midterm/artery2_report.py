"""Reproducible audit report and 400px marker evidence for inherited views."""
import json, importlib.util, math
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/midterm-views'
read=lambda p:json.loads((ROOT/p).read_text(encoding='utf8'))
before=read('tmp/artery2-before.json')['items']
pack=read('content/learn/eye_anat/midterm-review.json')
after=next(g['items'] for l in pack['lessons'] if l['id']=='manual' for s in l['steps'] if s['type']=='termlist' for g in s['groups'] if g['name']=='動脈')
audit=read('docs/midterm-views/artery2-old-audit.json');decisions=read('docs/midterm-views/artery2-decisions.json')
extra=read('tools/midterm/extra_views.json');blocks=read('tools/midterm/view_blocklist.json')
pairs={(b['img'],b['zh']) for b in blocks}
names={r['zh'] for r in before}
def figure(src):
 n=Path(src).name
 for s in ['514','877']:
  if 'gray'+s in n:return 'gray'+s
 return n
def clear(r):return [v for v in r['views'] if (v['img'],r['zh']) not in pairs]
def count(r):return len({figure(v['img']) for v in clear(r)})
reasons={
 '滑車下動脈':'需要更好的圖：Commons 搜尋沒有找到可明確標示此動脈的合法圖；514 未標此血管。兩舊圖封鎖，只保留514單一明示備援，不計清楚圖，也不出題。',
 '前脈絡叢動脈':'需要更好的圖：標本舊點在細小起始分支，450px不能分開辨識。單一明示備援不計清楚圖，也不出題。',
 '外瞼動脈':'Gray 515 外側接續淚動脈的上瞼支可辨認；僅此一個解剖圖。另一張無名線尾已封鎖，仍需要前側眼瞼解剖／標本圖。',
 '上瞼動脈弓':'Gray 515 可見連續上瞼弓；514 只見起始支，不能冒充完整動脈弓。需要另一眼瞼解剖圖。',
 '下瞼動脈弓':'Gray 515 可見下瞼弓；其他候選沒有清楚呈現連續弓，需另一眼瞼解剖圖。',
 '肌動脈':'Gray 514 Muscular 引線所指細支可見；舊圈偏到黃色神經，已封鎖。近景仍同一圖，需另一角度。',
 '眼角動脈':'Gray 508 鼻側上行末段可見；515 舊點貼近角靜脈已封鎖。需要另一清楚近景。',
 '前篩動脈':'Gray 514 前部內壁分支清楚；新增近景仍為同圖上面觀，不能算另一角度。',
 '後篩動脈':'Gray 514 後部內壁分支清楚；新增近景仍為同圖上面觀，不能算另一角度。',
 '虹膜大動脈環':'需要更好的圖：873舊點在睫狀肌，877舊點在睫狀突網絡，均已封鎖；只保留校訂877的圖例2切面交點（approx），仍缺完整動脈環圖。',
}

# Draw accepted metadata choices against the inherited sources, in isolation.
font=ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',13)
supp={
 'gray510_maxillary_artery.jpg':['中腦膜動脈'],
 'gray873.jpg':['睫狀動脈'],
 'gray877_horizontal_vessels.jpg':['睫狀後長動脈','睫狀後短動脈'],
 'gray515.jpg':['內瞼動脈','外瞼動脈'],
}
def marker(d,p,h):
 x,y=p['x']*4,32+p['y']*h/100
 if p['mark']=='ring':d.ellipse((x-5,y-5,x+5,y+5),outline='red',width=2)
 elif p['mark']=='dot':d.ellipse((x-2,y-2,x+2,y+2),fill='red')
 else:
  tx,ty=p['from']['x']*4,32+p['from']['y']*h/100;d.line((tx,ty,x,y),fill='red',width=2);a=math.atan2(y-ty,x-tx)
  d.polygon([(x,y),(x-6*math.cos(a-.5),y-6*math.sin(a-.5)),(x-6*math.cos(a+.5),y-6*math.sin(a+.5))],fill='red')
 return x,y
for i,fig in enumerate(audit,1):
 f=next(f for f in extra if f['img']==fig['img'])
 selected=[p for p in f['points'] if p['zh'] in {q['zh'] for q in fig['points']}|set(supp.get(Path(fig['img']).name,[]))]
 im=Image.open(ROOT/fig['img']).convert('RGB');im=im.resize((400,round(im.height*400/im.width)))
 c=Image.new('RGB',(710,max(im.height+32,len(selected)*25+32)),'white');c.paste(im,(0,32));d=ImageDraw.Draw(c);d.text((2,4),Path(fig['img']).name,font=font,fill='black')
 for n,p in enumerate(selected,1):
  x,y=marker(d,p,im.height);d.text((x+5,y-14),str(n),font=font,fill='red',stroke_width=1,stroke_fill='white')
  status='封鎖' if (fig['img'],p['zh']) in pairs else '保留'
  d.text((405,32+(n-1)*25),f"{n}. {p['zh']} [{status}]",font=font,fill='black')
 c.save(OUT/f'artery2-reviewed-{i:02}.png')

lines=['# 實驗手冊總複習：動脈可辨識度審計與補圖','',
 '日期：2026-11-03。範圍：`manual` 的動脈 41 列（視網膜中央動脈原本重複一列，照保留）。',
 f"- 原先 ≤1 張：{sum(len(r['views'])<=1 for r in before)} 列；現在 ≤1 張可辨識圖：{sum(len(clear(r))<=1 for r in after)} 列。",
 f"- 將 Gray 514／877 原圖與近景合併為同一來源後，≤1 個清楚來源的列有 {sum(count(r)<=1 for r in after)} 列；逐列理由見下表。近景及左右眼並非都代表新解剖角度。",
 f"- 全部 {len(audit)} 張既有底圖、{len(decisions)} 個不重複圖／點已在450px逐一核對；本輪封鎖 {sum(d['status']=='block' for d in decisions)} 對，另保留前次已封鎖的眼動脈側面圖／滑車下動脈。",
 '- 新增6張圖（左右眼實照、Gray 513、519、514近景、877切面）；既有510、515、873、877也補上明確可見的點。',
 '- `extra_views.json` 記錄每個既有審計點及新增點的 `mark`；細血管採箭頭、較粗血管採圈。箭頭尾端為 `from` 座標。本輪未改 JS/CSS，頁面仍使用現有圈形渲染；新樣式的400px證據是本資料夾的 `artery2-new-*` 與 `artery2-reviewed-*`，供下一位渲染工作者接手。',
 '- 原圖鑑、原題庫與原題圖未修改。`replace:true` 僅用於使用者指定的滑車上動脈位置校訂；其他不良舊點以圖／構造配對封鎖並排除對應 qids。',
 '- 每個 fallback 都明示「需要更好的圖；封鎖備援」，只留一張，qids不因保留圖片而恢復。','',
 '## 新圖與來源／授權','',
 '| 圖 | 來源、作者、授權 | 核對疊圖 |','|---|---|---|']
new=[f for f in extra if Path(f['img']).name.startswith('artery2-')]
for i,f in enumerate(new,1):lines.append(f"| [{f['title']}](../../{f['img']}) | {f['source']} | [400px疊圖](artery2-new-{i:02}.png)，另有逐點版本 |")
lines+=['','## 圖號與候選排除','',
 '- Gray 778 實為上頷／下頷神經分布，不能當眼動脈圖；正確眼動脈上面觀為514。已檢視原圖再取用。',
 '- Gray 508 已在專案，臉部／頭皮動脈；509 是唇動脈，不額外引入。513 是頸內與椎動脈，真正上頷動脈圖為已在專案的510；511是抽象分支樹，未當新增解剖圖。',
 '- Gray 516 已有；517／518是大腦供血區而非血管實物。519保留作循環拓樸輔助，圖說明示「示意，非新增標本角度」。',
 '- Gray 875 是眼球前半部內面，沒有清楚可圈的睫狀動脈；873血管圖與877切面更適合。876展示脈絡膜／睫狀突／虹膜血管網，沒有足夠依據把其中一線指定為完整虹膜大動脈環，因此不加推測點。',
 '- 滑車下動脈的 Commons 精確名稱搜尋無合適點位。內瞼動脈以514的 Medial palpebral 引線與515內側瞼支交叉核對；外瞼動脈以515淚動脈與上瞼弓的外側接續支辨識，只收可見上支，不假稱上下兩支皆完整。',
 '- 眼底點取較細／較淺的動脈，避開深色粗靜脈與交叉處；中央動脈僅指盤內可見的動脈出現處，不能從眼底照看到其神經內走行，故標 `approx:true`。',
 '- 877的長／短後睫狀動脈依圖例1與I對照；虹膜大動脈環只見圖例2的切面交點，不能當完整環，標 `approx:true`。',
 '- 候選圖與完整 Commons API metadata 保存於 `tmp/artery2-*`；未採用的候選不進正式 img。','',
 '## 逐列前後（清楚圖與不同來源分開計數）','',
 '| 列 | 原圖數 | 現在清楚圖數 | 清楚來源數 | 剩餘限制 |','|---|---:|---:|---:|---|']
for b,a in zip(before,after):lines.append(f"| {a['zh']} | {len(b['views'])} | {len(clear(a))} | {count(a)} | {reasons.get(a['zh'],'—') if count(a)<=1 else '—'} |")
lines+=['','## 每個封鎖配對及理由','','| 原圖 | 構造 | 理由 |','|---|---|---|']
for b in blocks:
 if b['zh'] in names:lines.append(f"| {b['img']} | {b['zh']} | {b['reason']} |")
lines+=['','## 完整審計索引','','`artery2-decisions.json` 列出每個原有點的決定；`artery2-old-audit.json` 對應450px審計圖。下列400px覆核圖包含選定樣式與新增舊圖點，圖／點仍封鎖者會在圖例標出。','']
for i,f in enumerate(audit,1):lines.append(f"- [{Path(f['img']).name}](artery2-reviewed-{i:02}.png)：{len(f['points'])} 個原有點；對照 [450px原圈](artery2-old-{i:02}.png)。")
lines+=['','## 驗證與交接','',
 '- 自動檢查摘要：`artery2-verification.json`；建置與瀏覽器結果完成後記錄於該檔。',
 '- `tools/midterm/check.cjs` 使用一次性 Edge context，測試前備份、測後還原該 context 的 localStorage。未使用使用者瀏覽器存檔。',
 f"- 未做醫學專業審稿或實機 iPad 測試；兩個封鎖備援及至多一個清楚來源的{sum(count(r)<=1 for r in after)}列仍是明確缺口。",
 '- 未修改 index.html／js／css，未執行 commit、push、reset、stash。AI-Brain 位於本輪允許寫入範圍外，本輪狀態與決策完整留於本報告，未寫入該 vault。','']
verification=ROOT/'docs/midterm-views/artery2-verification.json'
if verification.exists():
 v=json.loads(verification.read_text(encoding='utf8'))
 lines.append(f"- 動脈資料／題池檢查：{v['checks']}項，{len(v['failures'])}失敗；手冊題池排除{len(v['manualRemovedQids'])}題；原題庫仍完整。")
 if 'strictBuild' in v:lines.append(f"- `python tools/build.py --strict`：exit {v['strictBuild']['exitCode']}；使用已安裝的 Python 3.14 實體路徑（Windows 的 python 別名無法執行），記錄 `tmp/artery2-build.log`。")
 if 'midtermCheck' in v:lines.append(f"- `tools/midterm/check.cjs`：{v['midtermCheck']['checks']}項，{len(v['midtermCheck']['failures'])}失敗；只執行一次；記錄 `tmp/artery2-check.log`。")
(OUT/'artery.md').write_text('\n'.join(lines),encoding='utf8')
print('raw <=1:',sum(len(clear(r))<=1 for r in after),'distinct source <=1:',sum(count(r)<=1 for r in after))
