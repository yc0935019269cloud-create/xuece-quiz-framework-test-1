"""blood-vessels 用的易讀版配圖。配色：內頸動脈系統＝橘、外頸動脈系統＝紫、頸內動脈本身＝紅、不是分支＝灰。
執行：python -X utf8 tools/learn-redo/vessels_figs.py"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from figlib import side_labels, OR, BL, GR, RD, PU

O = 'img/eye-anat-fig/'
# 1. 腦底：頸內動脈的分支（Servier）
side_labels('img/eye-anat-manual/servier_brain_art_inf.jpg', O + 'v2_ica_branches.jpg', [
    ('頸內動脈', (44.3, 35.6), RD, 'L'),
    ('前大腦動脈', (46.8, 29.0), OR, 'L'),
    ('中大腦動脈', (41.6, 37.7), OR, 'L'),
    ('前交通動脈：不是分支', (49.0, 31.4), GR, 'R'),
], crop=(22, 18, 78, 56), width=900, title='腦的底面（往上看）')
# 2. 側面：頸內動脈 → 眼動脈 → 各分支（Servier 眼血管圖）
side_labels('img/eye-anat-manual/oc_blood_m.jpg', O + 'v2_ophth_path.jpg', [
    ('頸內動脈', (25, 37), RD, 'L'),
    ('眼動脈', (30, 71), OR, 'L'),
    ('視網膜中央動脈', (46, 64), OR, 'L'),
    ('淚動脈', (50, 77), OR, 'L'),
    ('睫狀後動脈', (58, 56), OR, 'R'),
    ('眶上動脈', (76, 45.5), OR, 'R'),
    ('滑車上動脈', (79, 35.5), OR, 'R'),
    ('鼻背動脈', (74, 31), OR, 'R'),
], crop=(15, 20, 92, 98), width=1000, legend=[('橘＝眼動脈的分支（內頸動脈系統）', OR)])
# 3. 眼眶上面觀：眼動脈的分支（Gray 514）
side_labels('img/eye-anat-manual/gray514.jpg', O + 'v2_ophth_branches.jpg', [
    ('眼動脈', (51, 78), OR, 'R'), ('肌動脈', (44, 71), OR, 'L'), ('淚動脈', (56, 66), OR, 'R'),
    ('前篩動脈', (32, 40), OR, 'L'), ('後篩動脈', (32, 56), OR, 'L'),
    ('眶上動脈', (64, 12), OR, 'R'), ('滑車上動脈', (46, 12), OR, 'R'), ('鼻背動脈', (37, 15), OR, 'L'),
    ('頸內動脈', (39, 94), RD, 'L'),
], crop=(18, 5, 82, 100), width=800, title='眼眶（上面往下看）')
# 4. 臉：兩個例外（Gray 515）
side_labels('img/eye-anat-manual/gray515.jpg', O + 'v2_ext_exceptions.jpg', [
    ('眼角動脈（例外）', (82, 51), PU, 'R'), ('眶下動脈（例外）', (55, 91), PU, 'R'), ('顏面動脈', (68, 95), PU, 'R'),
    ('鼻背動脈', (76, 40), OR, 'R'), ('眶上動脈', (68, 32), OR, 'R'), ('淚動脈', (34, 40), OR, 'L'),
], width=800, legend=[('紫＝外頸動脈系統', PU), ('橘＝眼動脈（內頸動脈系統）', OR)])
print('ok')

# ════ l2：靜脈 ════（靜脈＝藍、海綿竇＝紫、竇腔內＝紅、外側壁神經＝綠）
from figlib import GN
side_labels('img/eye-anat-manual/gray572_m.jpg', O + 'v2_oph_veins.jpg', [
    ('上眼靜脈', (44.6, 39), BL, 'R'), ('下眼靜脈', (35, 56), BL, 'R'), ('海綿竇', (17, 58), PU, 'L'),
], width=900, title='眼眶側面：靜脈往後流進海綿竇')
side_labels('img/eye-anat-manual/gray874.jpg', O + 'v2_vortex.jpg', [
    ('渦靜脈', (49, 20.5), BL, 'R'), ('渦靜脈', (40, 79), BL, 'R'), ('視神經', (9, 46), GR, 'L'),
], width=800, title='眼球後面觀：脈絡膜的靜脈匯成漩渦')
side_labels('img/eye-anat-manual/cavsinus_m.jpg', O + 'v2_cavsinus.jpg', [
    ('動眼神經 III', (32.1, 36.6), GN, 'L'), ('滑車神經 IV', (32.5, 41.5), GN, 'L'), ('眼神經 V1', (30.8, 52.3), GN, 'L'), ('上頷神經 V2', (29.5, 57.2), GN, 'L'),
    ('頸內動脈', (36.6, 41.6), RD, 'R'), ('外旋神經 VI', (35.6, 46.8), RD, 'R'), ('海綿竇', (34, 60), PU, 'R'), ('腦下垂體', (49.5, 42), GR, 'R'),
], crop=(12, 18, 62, 78), width=760, fs=38, legend=[('綠＝外側壁（III、IV、V1、V2）', GN), ('紅＝竇腔裡（頸內動脈、VI）', RD)])
side_labels('img/eye-anat-manual/gray515.jpg', O + 'v2_danger_tri.jpg', [
    ('眼角靜脈', (84, 57), BL, 'R'), ('顏面靜脈', (62, 95), BL, 'R'),
], width=800, legend=[('沒有瓣膜：血可以倒流回眼靜脈 → 海綿竇', BL)])
print('l2 ok')

# ════ l3：眼瞼與眼外肌的血 ════
side_labels('img/eye-anat-manual/gray515.jpg', O + 'v2_lid_vessels.jpg', [
    ('淚動脈', (34, 40), OR, 'L'), ('上瞼動脈', (50, 58), OR, 'L'), ('下瞼動脈', (46, 67), OR, 'L'),
    ('眶上動脈', (68, 32), OR, 'R'), ('眼角動脈', (82, 51), PU, 'R'), ('顏面動脈', (68, 95), PU, 'R'),
], width=760, legend=[('橘＝眼動脈系統（內頸）　紫＝顏面動脈系統（外頸）', OR)])
side_labels('img/eye-anat-manual/orb_ant2.jpg', O + 'v2_rectus.jpg', [
    ('上直肌：2 條', (50, 26), OR, 'R'), ('內直肌：2 條', (68, 48), OR, 'R'), ('下直肌：2 條', (51, 66), OR, 'R'),
    ('外直肌：只有 1 條', (37, 47), RD, 'L'),
], crop=(20, 5, 85, 95), width=900, title='右眼眶前面觀：每條直肌帶幾條前睫狀動脈')
print('l3 ok')
