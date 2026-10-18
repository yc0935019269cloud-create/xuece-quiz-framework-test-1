"""blood-ciliary 易讀版配圖。配色：前睫狀＝綠、後長＝橘、後短（與辛氏環）＝藍、虹膜大環＝紫、中央動脈＝紅。
執行：python -X utf8 tools/learn-redo/ciliary_figs.py"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from figlib import side_labels, OR, BL, GR, RD, PU, GN

O = 'img/eye-anat-fig/'
side_labels('img/eye-anat-manual/gray873.jpg', O + 'v2_ciliary.jpg', [
    ('視神經', (14, 44), GR, 'L'), ('後短睫狀動脈', (26, 52), BL, 'L'),
    ('前睫狀動脈', (68.5, 12), GN, 'R'), ('後長睫狀動脈', (58, 43.5), OR, 'R'), ('虹膜大動脈環', (77, 45), PU, 'R'),
], width=1000, title='眼球縱切（左＝後、右＝前）')
side_labels('img/eye-anat-manual/onh_diag_m.jpg', O + 'v2_zinn.jpg', [
    ('辛氏環（Zinn–Haller）', (27, 40.5), BL, 'L'), ('後短睫狀動脈', (17.5, 68), BL, 'L'),
    ('篩板', (51, 30.5), GR, 'R'), ('視網膜中央動脈', (48.5, 70), RD, 'R'),
], crop=(0, 10, 100, 90), width=900, title='視神經頭縱切')
side_labels('img/eye-anat-manual/onh_diag_m.jpg', O + 'v2_onh_layers.jpg', [
    ('篩板前區：沒有髓鞘', (55, 25), OR, 'R'), ('篩板', (51, 30.5), GR, 'R'), ('篩板後區：開始有髓鞘', (57, 48), BL, 'R'),
], crop=(0, 10, 100, 90), width=900, title='視神經頭縱切：穿過篩板後才有髓鞘')
side_labels('img/eye-anat-manual/fundus_od.jpg', O + 'v2_fundus_cilio.jpg', [
    ('睫狀視網膜動脈穿出處', (76.5, 55), BL, 'R'),
    ('黃斑', (44, 54), BL, 'L'),
], crop=(20, 25, 95, 85), width=900, fs=40, title='右眼眼底：視神經盤顳側緣（靠黃斑那一側）')
print('ok')
