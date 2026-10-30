# -*- coding: utf-8 -*-
"""Rewrite the Chinese name/desc of every scene and item in assets/decor/manifest.json.

Source of truth for player-facing text (the image worker's pipeline corrupted it once).
Run: python tools/decor_text.py && python tools/decor_data.py
"""
import json, pathlib

TEXT = {
    # scenes
    'scene_beach': ('海邊沙灘', '浪花一波波打上岸，連錯題都被沖淡了。'),
    'scene_autumn': ('秋楓山丘', '滿山紅葉，遠方瀑布的聲音很適合背書。'),
    'scene_sakura': ('櫻花庭院', '花瓣落在課本上，順手夾成書籤吧。'),
    'scene_snow': ('雪原小鎮', '屋頂冒著炊煙，雪地裡的腳印通往圖書館。'),
    'scene_library': ('魔法圖書館', '書架高得看不見頂，聽說有一本書記著所有考題。'),
    'scene_island': ('浮空島', '雲海上的小島，瀑布往下流進天空。'),
    'scene_crystal': ('水晶洞窟', '地底深處的水晶自己會發光，不必點燈。'),
    'scene_starobs': ('星空天文台', '今晚的星星排成了你最常錯的那個公式。'),
    # cabin
    'cabin_stool': ('木頭小板凳', '坐上去會嘎吱叫，但很穩。'),
    'cabin_barrel': ('橡木桶', '裝過蘋果汁，現在裝滿了草稿紙。'),
    'cabin_crate': ('補給木箱', '遠征前把藥水和筆記都塞進來。'),
    'cabin_lantern': ('立式提燈', '晚上讀書的好夥伴，蟲子也這麼覺得。'),
    'cabin_chair': ('搖搖椅', '搖著搖著就睡著了，記得先背完再坐。'),
    'cabin_table': ('圓木桌', '大家圍著它討論考古題。'),
    'cabin_petbed': ('寵物軟墊窩', '夥伴最愛的午睡地點，墊子還有太陽的味道。'),
    'cabin_shelf': ('小書架', '一層放課本，一層放零食。'),
    'cabin_stove': ('鑄鐵暖爐', '冬天的營地全靠它，順便烤地瓜。'),
    'cabin_hut': ('小木屋', '終於有屋頂了！下雨也能繼續刷題。'),
    # forest
    'forest_mush': ('紅點蘑菇', '很可愛，但千萬別吃。'),
    'forest_fern': ('蕨類叢', '葉子底下常躲著一隻青蛙。'),
    'forest_stump': ('樹墩', '數年輪可以練習計數，也可以當桌子。'),
    'forest_rock': ('青苔石', '長了青苔的石頭，摸起來軟軟涼涼的。'),
    'forest_flowers': ('野花叢', '白的、紫的，蝴蝶最喜歡停在這裡。'),
    'forest_birdhouse': ('鳥屋', '住了一隻每天早上準時叫你起床的鳥。'),
    'forest_logbench': ('原木長椅', '整根樹幹做的，夠坐三個人一起背單字。'),
    'forest_fairylamp': ('精靈燈籠柱', '燈裡的光點會自己飛來飛去。'),
    'forest_bigmush': ('蘑菇小屋', '門太小，只有寵物進得去。'),
    'forest_spirittree': ('精靈古樹', '很老很老的樹，樹根之間發出淡淡綠光。'),
    # academy
    'acad_books': ('書堆', '總有一天會全部讀完的……大概。'),
    'acad_ink': ('羽毛筆與墨水', '寫錯了不能擦，所以要想清楚再寫。'),
    'acad_scroll': ('卷軸架', '一卷一卷的筆記，攤開來比人還長。'),
    'acad_hourglass': ('沙漏', '考試時間只剩一半了！'),
    'acad_desk': ('讀書桌', '桌燈一開，專注力加一。'),
    'acad_globe': ('地球儀', '轉一圈，看看世界有多大。'),
    'acad_board': ('小黑板', '畫滿了三角形和圓，誰留下的？'),
    'acad_telescope': ('黃銅望遠鏡', '可以看到很遠的地方，例如下週的考試。'),
    'acad_trophy': ('金榜獎盃', '給每一個沒有放棄的考生。'),
    'acad_tower': ('白塔模型', '照著遠方那座塔做的模型，塔頂好像有一盞燈。'),
    # seaside
    'sea_shell': ('大海螺', '放在耳邊，聽得到海浪聲。'),
    'sea_star': ('海星', '五隻手臂，比你多三隻可以寫字。'),
    'sea_bucket': ('沙桶與小鏟', '堆沙堡的必備工具。'),
    'sea_ring': ('救生圈', '被考試淹沒時請抓緊它。'),
    'sea_umbrella': ('條紋陽傘', '在傘下讀書，不怕曬也不怕下雨。'),
    'sea_chair': ('海灘躺椅', '躺下來複習一下……不知不覺就天黑了。'),
    'sea_castle': ('沙堡', '漲潮前要好好欣賞它。'),
    'sea_petbed': ('貝殼寵物床', '睡在貝殼裡的夥伴，夢裡都是海。'),
    'sea_palm': ('椰子樹', '小心掉下來的椰子。'),
    'sea_lighthouse': ('小燈塔', '夜裡為迷路的船，也為熬夜的你點燈。'),
    # sakura
    'jp_cushion': ('坐墊', '跪坐久了腳會麻，所以要軟一點。'),
    'jp_teaset': ('茶具組', '泡一壺茶，慢慢想下一題。'),
    'jp_paperlamp': ('紙燈籠', '風一吹就輕輕轉動。'),
    'jp_bamboo': ('竹籬笆', '把營地圍出一個安靜的角落。'),
    'jp_bonsai': ('松樹盆栽', '修剪了好多年，才長成這個形狀。'),
    'jp_koibowl': ('錦鯉石缸', '兩條錦鯉繞著圈游，看著看著就靜下來了。'),
    'jp_chime': ('風鈴架', '叮鈴一聲，提醒你該休息了。'),
    'jp_stonelamp': ('石燈籠', '石頭雕的燈，點起來很有味道。'),
    'jp_torii': ('小鳥居', '穿過去的時候，記得在心裡許個願。'),
    'jp_sakura': ('櫻花樹', '一年四季都開著花的櫻花樹，有點奇怪，但很美。'),
    # arcane
    'arc_crystal': ('水晶簇', '紫色水晶會隨心情變亮變暗。'),
    'arc_rune': ('符文石', '刻著看不懂的符號，摸了會有點刺刺的。'),
    'arc_candle': ('浮空蠟燭', '三根蠟燭飄在空中，從來不會滴蠟。'),
    'arc_potion': ('藥水架', '紅的回血，藍的回魔，綠的……不要喝。'),
    'arc_cauldron': ('魔法大釜', '咕嘟咕嘟冒著泡，聞起來像薄荷。'),
    'arc_orb': ('占星水晶球', '問它明天考什麼，它只會發光。'),
    'arc_lectern': ('魔法書台', '書會自己翻到你需要的那一頁。'),
    'arc_moon': ('新月雕像', '月光照到的時候，雕像會輕輕發亮。'),
    'arc_cloudbed': ('雲朵寵物窩', '軟綿綿的雲，夥伴睡上去就不想起來。'),
    'arc_portal': ('星門', '門的另一邊是星空，走進去之前先把題目寫完。'),
    # junk
    'junk_boot': ('舊靴子', '……又是靴子？至少退你 2 顆魂晶。'),
    'junk_can': ('生鏽空罐', '裡面什麼都沒有，搖起來還會響。'),
    'junk_twig': ('枯樹枝', '可以拿來當指揮棒，或是生火。'),
    'junk_bucket': ('破水桶', '底部有個洞，裝什麼漏什麼。'),
    'junk_paper': ('揉爛的考卷', '大大的紅叉叉。下次一定會更好。'),
    'junk_rock': ('普通石頭', '真的很普通。'),
}

p = pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'decor' / 'manifest.json'
m = json.loads(p.read_text(encoding='utf-8'))
missing = []
for kind in ('scenes', 'items'):
    for e in m[kind]:
        t = TEXT.get(e['id'])
        if not t:
            missing.append(e['id']); continue
        e['name'], e['desc'] = t
p.write_text(json.dumps(m, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
bad = [e['id'] for k in ('series', 'scenes', 'items') for e in m[k] if '??' in e.get('name', '') + e.get('desc', '')]
print('missing', missing, 'still-bad', bad)
raise SystemExit(1 if missing or bad else 0)
