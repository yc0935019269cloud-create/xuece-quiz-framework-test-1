"""逐組核對後的公式選題規則；只更新第一～五單元的 relatedQuestions。"""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
# 每列：老師講義題號、單元練習題號、同單元國考標籤、選用題幹條件。
RULES = {
 1: [
  ([], [18], ['光速','折射率'], '頻率|波長'),
  ([], [18], [], None),
  ([], [17], ['折射率','光速'], None),
  ([], [16,19], ['折射率'], '波長|頻率'),
  ([2,4,5], [6,7,8,9,20,21,22,23,25,29], ['聚散度'], None),
  ([3,5], [10,11,27,29], ['聚散度','實物','虛物','實像','虛像'], None),
 ],
 2: [
  ([1], [6,7,29], ['反射','平面鏡'], '角'),
  ([1,2], [10,12,17], ['司乃耳定律'], None),
  ([3], [13,14,15], ['全反射','臨界角'], None),
  ([], [16,17], ['司乃耳定律'], '近軸|小角'),
  ([5], [23,24,27], ['表面屈光力'], None),
  ([6], [18,19,22,26], ['球面折射'], None),
  ([4], [11,20,21,30], ['視深','平面折射'], None),
  ([], [25], ['焦距','焦點'], None),
  ([], [28], ['弧高'], None),
  ([], [31,32,34,35], [], None),
  ([], [33], [], None),
 ],
 3: [
  ([1,9,10,11,12,13,14,15,16,17,18,19,24], [6,11,12,13,14,15,16,17,18,19,20,21,30,31,33], ['薄透鏡成像'], None),
  ([3,9,19,23,24], [20,21,34], ['薄透鏡成像'], None),
  ([5,6,7,23], [8,9,10,28,29], ['焦距','焦點'], None),
  ([9,11,12,13,14,16,19,21,25,26,27], [11,13,14,15,16,22,30,31], ['橫向放大率'], None),
  ([1,4,10,11,15,20], [6,12,17,24,26,27,35,36], ['薄透鏡成像'], '實像|虛像|無限|焦點|平行'),
  ([22,25], [23], ['對稱點'], None),
  ([2,23,27], [7,29,32], ['薄透鏡成像'], '物體(應|必須)|物距(應|為何|為多少)|屈光力(為|應|是多少)|鏡片的度數(為何|為多少)'),
 ],
 4: [
  ([1], [], ['表面屈光力'], None),
  ([2,3,4,21], [2,3,4,32], ['約化厚度'], None),
  ([5,6,20], [5,9,10,11,12], ['等效屈光力','厚透鏡'], None),
  ([4,7,8,20,21], [6,7,8,10,13,34,35], ['後頂點屈光力','前頂點屈光力','中和屈光力'], None),
  ([9,10], [14,15,33], [], None),
  ([11,12,22], [16,17,18,19], [], None),
  ([14,15,16,18,23], [21,22,27,28,29], [], None),
  ([23], [29], [], None),
  ([17], [23,24,25], ['節點','像高'], None),
  ([24], [30,31], ['Newton方程式'], None),
  ([], [36,38,39,40], ['頂點距離'], None),
  ([], [37], ['頂點距離'], '散光|柱鏡|×|子午|DS.*DC'),
 ],
 5: [
  ([], [1,2,3], [], None),
  ([], [5], [], None),
  ([], [6,9], [], None),
  ([], [4,7,8,37], [], None),
  ([2,3,4], [11,12,13,14,15,37], ['等效屈光力','後頂點屈光力'], None),
  ([1], [10,16,17], ['透鏡組'], '成像|影像|物體'),
  ([5,6], [18,19,20,21], ['入射瞳'], None),
  ([], [23,24,25], [], None),
  ([7,8], [26,27,28,29], ['管長','伽利略望遠鏡','克卜勒望遠鏡','望遠鏡'], None),
  ([8], [26,27,28], ['角放大率','伽利略望遠鏡','克卜勒望遠鏡','望遠鏡'], None),
  ([9], [30,31,32], ['稜鏡度','偏折角'], None),
  ([], [35], ['合成稜鏡'], '稜鏡處方|兩個稜鏡量'),
  ([], [33], ['合成稜鏡'], '厚|直徑'),
  ([], [34], ['稜鏡效益'], None),
 ],
}

def read(path):
 return json.loads(path.read_text(encoding='utf-8'))

def run():
 for unit, rules in RULES.items():
  path = next((ROOT/'content/learn/physopt').glob(f'physopt-u{unit}-*.json'))
  pack = read(path)
  note = next(n for n in pack['notes'] if n['kind']=='formula-summary')
  assert len(note['formulas']) == len(rules)
  teacher = read(ROOT/f'content/bank/physopt/teacher/physopt-teacher-u{unit}.json')
  practice = read(ROOT/f'content/bank/physopt/physopt-u{unit}-q.json')
  exams = [read(p) for p in sorted((ROOT/'content/bank/physopt/exam').glob(f'physopt-exam-u{unit}-*.json'))]
  for formula, (teacher_numbers, practice_numbers, tags, pattern) in zip(note['formulas'],rules):
   ids = []
   for bank, numbers in [(teacher,teacher_numbers),(practice,practice_numbers)]:
    available={q['n'] for q in bank['questions']}
    assert set(numbers)<=available,(unit,formula['id'],set(numbers)-available)
    ids.extend(bank['set']['id']+'-'+str(n) for n in numbers)
   # 老師講義優先；國考在後；同單元練習最後。
   teacher_count=len(teacher_numbers)
   exam_ids=[bank['set']['id']+'-'+str(q['n']) for bank in exams for q in bank['questions'] if set(tags)&set(q.get('tags',[])) and (not pattern or re.search(pattern,q['stem']))]
   formula['relatedQuestions']=list(dict.fromkeys(ids[:teacher_count]+exam_ids+ids[teacher_count:]))
   if unit==1 and formula['id']=='f02':
    formula['relatedHint']='延伸練習：這題先求頻率，再用 T = 1/f 換成週期；題目本身沒有直接問週期。'
   print(f"u{unit}/{formula['id']}: teacher {teacher_count}, exam {len(exam_ids)}, practice {len(practice_numbers)}")
  path.write_text(json.dumps(pack,ensure_ascii=False,indent=1)+'\n',encoding='utf-8',newline='\r\n')

if __name__=='__main__':run()
