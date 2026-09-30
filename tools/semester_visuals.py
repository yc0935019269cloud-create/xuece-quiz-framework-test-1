"""Self-contained teaching simulations and authored SVG structure diagrams."""
import json, html

STYLE = "body{margin:0;padding:10px;box-sizing:border-box;font:15px system-ui,'Microsoft JhengHei',sans-serif;background:#fbf7ec;color:#2e2116}*{box-sizing:border-box}h3{font-size:18px;margin:0 0 8px}.row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}label{display:block}.row label{flex:1 1 125px;min-width:0;max-width:180px}input{max-width:150px;width:100%}button{font:inherit;padding:6px 12px;background:#fff;border:1px solid #75644d;border-radius:6px}svg{width:100%;height:160px;background:#fff;border:1px solid #cabfa7}#result,.note{padding:6px;background:#fff1c9;margin-top:6px}small{font-size:14px;display:block;margin-top:6px}@media(max-width:400px){body{padding:8px}.row label{flex-basis:105px}svg{height:110px}h3{font-size:16px}}"

def numeric(kind):
    specs = {
      'thick': ('厚透鏡：厚度改變三種度數', [('a','前表面',-20,20,8,.5,'D'),('b','後表面',-20,20,-3,.5,'D'),('t','厚度',0,15,5,.5,'mm'),('n','折射率',1.3,1.9,1.6,.01,'')], "const F1=v('a'),F2=v('b'),d=v('t')/1000/v('n'); const Fe=F1+F2-d*F1*F2,Fv=F1/(1-d*F1)+F2,Fn=F2/(1-d*F2)+F1;result.textContent=`等效 Fe = ${fmt(Fe)} D；後頂點 Fv = ${fmt(Fv)} D；前頂點 Fn = ${fmt(Fn)} D。${v('t')===0?'厚度為零，三者相同。':'厚度效應取決於兩表面符號，不能一概說只會抵消。'}`;bars([Fe,Fv,Fn],['等效','後頂點','前頂點']);", 'Fe=F₁+F₂−(t/n)F₁F₂；Fv=F₁/[1−(t/n)F₁]+F₂；Fn=F₂/[1−(t/n)F₂]+F₁。光由左向右，表面度數帶正負號，t 用 m。', '把厚度從 0 mm 調到 5 mm，比較 Fe、Fv、Fn。'),
      'vertex': ('框架與隱形眼鏡的頂點換算', [('a','框架度數',-15,15,-8,.25,'D'),('d','頂點距離',0,20,12,1,'mm')], "const F=v('a'),d=v('d')/1000,C=F/(1-d*F);result.textContent=`角膜平面度數 = ${fmt(C)} D；${F<0?'負鏡移近角膜時，所需度數較不負。':F>0?'正鏡移近角膜時，所需度數較正。':'零度數換算仍為零。'}`;bars([F,C],['框架','角膜平面']);",'F角膜 = F框架/(1−dF框架)，d 為框架向角膜移動的正距離（m）；薄鏡、近軸近似，非配鏡建議。','先設定 −8.00 D、12 mm，再改成 +8.00 D，比較改變方向。'),
      'prism': ('偏心與稜鏡量：Prentice 法則', [('a','鏡片度數',-10,10,4,.25,'D'),('c','單眼偏心量',0,10,5,.5,'mm')],"const P=v('c')/10*Math.abs(v('a'));result.textContent=`單眼稜鏡量大小 = ${fmt(P)} Δ；方向另依光心位置與正負鏡判斷。${v('c')===0?'對準光心，偏心稜鏡量為零。':''}`;bars([P],['稜鏡量 Δ']);",'P（Δ）= c（cm）× |F（D）|。1 Δ 表示 1 m 處偏移 1 cm；此模擬計算大小，不推定底向。','設定 +4.00 D、偏心 5 mm，算出稜鏡量；再把偏心減半。'),
      'k': ('角膜半徑與 K 值', [('r','角膜半徑',6,10,7.8,.1,'mm')],"const K=337.5/v('r');result.textContent=`K = ${fmt(K)} D；半徑越小，曲率越大，K 值越高。這是角膜曲率計等效指數的估計值。`;bars([K],['角膜 K 值 D']);",'K = (1.3375−1)/r（m）=337.5/r（mm）。1.3375 是角膜曲率計等效折射率，不是真實角膜材料折射率。','把半徑由 7.8 mm 調到 6.8 mm，觀察 K 值變化。'),
      'accommodation': ('調節幅度與近點', [('r','近點距離',5,100,25,1,'cm')],"const A=100/v('r');result.textContent=`正視眼的近點需求 = ${fmt(A)} D；距離更近，所需調節更多。屈光不正者另須考慮遠點。`;bars([A],['調節需求 D']);",'正視眼、遠點在無限遠：A=1/近點距離（m）。一般 A=近點聚散度需求−遠點需求，勿把 NPA 與 NPC 混用。','把近點從 25 cm 改到 10 cm，算出所需調節。'),
      'co': ('每搏量與心輸出量', [('hr','心率',40,160,75,5,'次/min'),('edv','舒張末期容積',90,180,120,5,'mL'),('esv','收縮末期容積',20,80,50,5,'mL')],"const SV=v('edv')-v('esv'),CO=v('hr')*SV/1000,EF=100*SV/v('edv');result.textContent=`SV = ${fmt(SV)} mL；CO = ${fmt(CO)} L/min；EF = ${fmt(EF)}%。固定其他值比較單一變因；高心率時充盈改變不在此模型內。`;bars([v('edv'),v('esv'),SV],['EDV mL','ESV mL','SV mL']);",'SV=EDV−ESV；CO=HR×SV（mL/min，除以1000得 L/min）；EF=SV/EDV×100%。容積取獨立教學參數。','維持 EDV=120 mL、ESV=50 mL，把心率從 75 改到 100 次/min。'),
      'clearance': ('腎清除率：單位與排出量', [('u','尿中濃度 U',0,200,100,5,'mg/mL'),('p','血漿濃度 P',1,20,2,1,'mg/mL'),('flow','尿流量 V',0,5,1,.1,'mL/min')],"const E=v('u')*v('flow'),C=E/v('p');result.textContent=`排出速率 U×V = ${fmt(E)} mg/min；清除率 C = ${fmt(C)} mL/min。清除率不是尿量，也不是排出物質的質量。`;bars([C],['清除率 mL/min']);",'Cₓ=UₓV/Pₓ。U/P 濃度單位需一致，V 為 mL/min。以 inulin 清除率估 GFR 時，須滿足自由濾過且不再吸收、不分泌。','固定濃度，將尿流量從 1 改到 2 mL/min，比較清除率。'),
      'reflectance': ('正入射反射率與阿貝數', [('n','鏡片折射率',1.3,1.9,1.5,.01,''),('a','鏡片度數',0,15,6,.25,'D'),('abbe','阿貝數',20,60,30,1,'')],"const R=((v('n')-1)/(v('n')+1))**2*100,C=v('a')/v('abbe');result.textContent=`單一空氣／鏡片界面反射率 = ${fmt(R)}%；縱向色像差估計 = ${fmt(C)} D。反射率越低，該界面透射越多（忽略吸收）；阿貝數越大，色像差越小。`;bars([R],['单界面反射率 %']);",'正入射單界面 R=[(n₂−n₁)/(n₂+n₁)]²，n₁=1。縱向色像差≈Fd/V；V為阿貝數。未鍍膜、忽略吸收，勿直接當成整片雙面透射率。','固定 +6.00 D，把阿貝數由 30 調到 60；再比較 n=1.50 與 1.80 的反射率。'),
      'mirror': ('球面鏡：焦點內外的像', [('f','凹面鏡焦距',5,30,10,1,'cm'),('u','物距',2,60,20,1,'cm')],"const f=v('f'),u=v('u'),den=1/f-1/u; if(Math.abs(den)<1e-10){result.textContent='物體在焦點：反射光平行，像在無限遠，沒有有限放大率。';svg.innerHTML='';return;} const image=1/den,m=-image/u;result.textContent=`像距 v = ${fmt(image)} cm；放大率 m = ${fmt(m)}；${image>0?'鏡前倒立實像':'鏡後正立虛像'}。`;bars([u,image],['物距 cm','像距 cm']);",'此處採球面鏡實正慣例：凹面鏡 f>0，鏡前實物 u>0，鏡前實像 v>0，鏡後虛像 v<0。1/u+1/v=1/f，m=−v/u，近軸近似。','把物體從 2f 移到 f，再移到 f 內，觀察像的性質。'),
    }
    title, controls, code, formula, task = specs[kind]
    inputs=''.join(f'<label>{lab} <output id="{i}o"></output><input aria-label="{lab}" id="{i}" type="range" min="{lo}" max="{hi}" step="{step}" value="{value}" data-unit="{unit}" style="display:block"></label>' for i,lab,lo,hi,value,step,unit in controls)
    script="const inputs=[...document.querySelectorAll('input')],result=document.getElementById('result'),svg=document.getElementById('plot');const v=id=>Number(document.getElementById(id).value),fmt=x=>Number.isFinite(x)?x.toFixed(2):'超出模型';function bars(vals,names){const scale=130/Math.max(1,...vals.map(Math.abs));svg.innerHTML=vals.map((x,i)=>`<rect x='${50+i*180}' y='${x>=0?150-x*scale:150}' width='90' height='${Math.abs(x)*scale}' fill='${i%2?'#916a28':'#286b80'}'/><text x='${80+i*180}' y='200' font-size='44'>${i+1}</text>`).join('')+`<line x1='20' y1='150' x2='680' y2='150' stroke='#555'/>`;document.getElementById('legend').textContent=names.map((n,i)=>(i+1)+'．'+n).join('　');}function update(){inputs.forEach(x=>document.getElementById(x.id+'o').textContent=x.value+' '+x.dataset.unit);"+code+"}inputs.forEach(x=>x.addEventListener('input',update));document.getElementById('reset').onclick=()=>{inputs.forEach(x=>x.value=x.defaultValue);update()};update();"
    doc=f'<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>{STYLE}</style><h3>{title}</h3><div class="note">觀察重點：{task}</div><div class="row">{inputs}<button id="reset">重設</button></div><svg id="plot" viewBox="0 0 700 210" role="img" aria-label="即時比較圖"></svg><small id="legend"></small><div id="result" aria-live="polite"></div><small>{formula}</small><script>{script}</script></html>'
    refs={'thick':'F₁=+8 D、F₂=−3 D、t=5 mm、n=1.6 時，Fe=+5.075 D、Fv≈+5.205 D、Fn≈+5.028 D；t=0 時均為 +5 D。','vertex':'−8 D、12 mm 換至角膜平面約 −7.30 D；+8 D 約 +8.85 D。','prism':'5 mm=0.5 cm；P=0.5×4=2 Δ。偏心減半，稜鏡量減半。','k':'r=7.8 mm 時 K≈43.27 D；r=6.8 mm 時 K≈49.63 D。','accommodation':'25 cm 是 4 D；10 cm 是 10 D。這是正視眼且遠點在無限遠的結果。','co':'SV=120−50=70 mL；75 次/min 時 CO=5.25 L/min，100 次/min 時為 7.00 L/min。','clearance':'U=100 mg/mL、P=2 mg/mL、V=1 mL/min 時 C=50 mL/min；V=2 時 C=100 mL/min。','reflectance':'n=1.50 的單界面反射率為 4%；n=1.80 約 8.16%。+6 D、V=30 時色像差約 0.20 D；V=60 時約 0.10 D。','mirror':'f=10 cm 時，u=20 cm 得 v=20 cm、m=−1；u=f 像在無限遠；u=5 cm 得 v=−10 cm、m=+2。'}
    return {'type':'interactive','title':title,'task':task,'body':'每次只改一個參數，先預測，再觀察數值。','reference':refs[kind]+'\n'+formula,'height':540,'html':doc}

def process(title, stages, note):
    # Ordered causal stages: a process, not an anatomically scaled drawing.
    data=json.dumps(stages,ensure_ascii=False)
    script=f'const stages={data};'+"let index=0,playing=false,last=0;const title=document.getElementById('stage'),body=document.getElementById('detail'),counter=document.getElementById('count'),play=document.getElementById('play');function draw(){title.textContent=(index+1)+'．'+stages[index][0];body.textContent=stages[index][1];counter.textContent=(index+1)+' / '+stages.length;document.getElementById('progress').value=index;}function pause(){playing=false;play.textContent='播放';}play.onclick=()=>{playing=!playing;play.textContent=playing?'暫停':'播放';last=performance.now()};document.getElementById('step').onclick=()=>{pause();index=(index+1)%stages.length;draw()};document.getElementById('reset').onclick=()=>{pause();index=0;draw()};document.getElementById('progress').oninput=e=>{pause();index=Number(e.target.value);draw()};function tick(t){if(playing&&t-last>1800){index=(index+1)%stages.length;last=t;draw()}requestAnimationFrame(tick)}draw();requestAnimationFrame(tick);"
    doc=f'<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>{STYLE}#stage{{font-size:20px}}#detail{{line-height:1.8;min-height:100px}}</style><h3>{title}</h3><div class="note">觀察重點：{note}</div><div class="row"><button id="play">播放</button><button id="step">逐步</button><button id="reset">重設</button><span id="count"></span></div><label>過程階段<input aria-label="過程階段" id="progress" type="range" min="0" max="{len(stages)-1}" value="0"></label><h4 id="stage"></h4><p id="detail"></p><small>此圖呈現事件順序與因果，時間間隔為教學節奏，不代表生理時間或實際解剖距離。</small><script>{script}</script></html>'
    return {'type':'interactive','title':title,'task':'用「逐步」走完一次，說明每一步如何造成下一步。','body':note,'reference':'\n'.join(n+'：'+d for n,d in stages),'height':420,'html':doc}

def layered_diagram(kind):
    data={
      'tear': [('空氣側 Air','泪膜最外側的介面。'),('脂質層 Lipid layer','位於外表面，主要由瞼板腺供脂質，減少蒸發。'),('水液黏蛋白相 Mucoaqueous phase','水與可溶黏蛋白呈漸變分布，提供潤滑與防禦；傳統教學分水液與黏液。'),('醣萼 Glycocalyx','上皮表面膜結合黏蛋白與其醣鏈，有助潤濕和屏障。'),('角膜上皮 Corneal epithelium','泪膜下方的細胞層，維持眼表屏障。')],
      'eyelid': [('皮膚 Skin','眼瞼最前方薄皮膚，位於眼輪匝肌淺面。'),('眼輪匝肌 Orbicularis oculi','位於皮下，CN VII 支配，負責閉眼。'),('提上瞼肌腱膜 Levator aponeurosis','位於眼輪匝肌深面，附著瞼板前面並有纖維連至皮膚；提上瞼肌由 CN III 支配。'),('瞼板與瞼板腺 Tarsus / Meibomian gland','瞼板提供支撐，腺體在板內，分泌泪膜脂質。'),('瞼結膜 Palpebral conjunctiva','覆蓋眼瞼後表面，面向眼球；有杯狀細胞。')],
      'visual-path': [('視神經 Optic nerve','每眼神經節細胞軸突匯集，包含該眼鼻、顳半視網膜資訊。'),('視交叉 Optic chiasm','鼻半視網膜纖維交叉，顳半視網膜纖維維持同側。'),('視束 Optic tract','同一側視束含對側視野資訊，來自兩眼。'),('外側膝狀體 LGN','視丘的主要視覺中繼核。'),('視放射 Optic radiation','由 LGN 投射至枕葉；顳葉 Meyer loop 傳遞上視野資訊。'),('初級視覺皮質 V1','位於枕葉距狀溝周圍，接收對側視野資訊。')]
    }
    names=data[kind];shapes=[];pts=[]
    for i,(n,d) in enumerate(names):
        y=35+i*(340/len(names));h=340/len(names)-8
        shapes.append(f'<rect x="140" y="{y}" width="520" height="{h}" rx="7" fill="{["#dbe8ef","#efd9ac","#c9dfd3"][i%3]}" stroke="#75644d"/>')
        if kind=='eyelid' and i==3: shapes.append(f'<ellipse cx="400" cy="{y+h/2}" rx="12" ry="{h/2-4}" fill="#bf956b"/>')
        pts.append({'name':n,'desc':d.replace('泪','淚'),'x':35+(i%3)*15,'y':100*(y+h/2)/450})
    direction={'tear':'上：空氣側；下：眼表側。漸變與厚度為教學示意。','eyelid':'上：眼瞼前方；下：後方。腱膜與瞼板相互連接，非等厚切面。','visual-path':'由上往下為主要傳遞順序；不是顱內實際空間位置。'}[kind]
    svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><rect width="800" height="450" fill="#fbf7ec"/>'+''.join(shapes)+f'<text x="20" y="420" font-family="Microsoft JhengHei,sans-serif" font-size="17">{direction}</text></svg>'
    return svg,pts

PROCESSES = {
 'retinal-transmission': ('視網膜：光線與訊號反方向', [('光由玻璃體側進入','光先穿過內層神經組織，抵達外側感光細胞。'),('感光細胞光轉換','光使 cGMP 減少、陽離子通道關閉，細胞超極化，麩胺酸釋放減少。'),('雙極細胞分流','ON 與 OFF 路徑對麩胺酸的反應不同；水平細胞調整橫向對比。'),('神經節細胞輸出','雙極細胞與無軸突細胞調整神經節輸出；神經節細胞軸突形成視神經。')], '光由內往外，主要訊號由感光細胞往內傳。'),
 'cardiovascular': ('心動週期：看壓力決定瓣膜', [('等容積收縮','二尖瓣剛關（S1），主動脈瓣尚未開；心室壓上升，容積不變。'),('射血','心室壓超過主動脈壓，主動脈瓣打開，心室容積下降。'),('等容積舒張','主動脈瓣關（S2），二尖瓣尚未開；壓下降，容積不變。'),('心室充盈','心室壓低於左心房壓，二尖瓣打開，容積增加。')], '四節點：二尖瓣關 → 主動脈瓣開 → 主動脈瓣關 → 二尖瓣開。'),
 'urinary': ('RAAS：灌流下降到保鈉升壓', [('啟動腎素','腎灌流下降、緻密斑 NaCl 減少或 β₁ 刺激，可促進腎素釋放。'),('Ang I 到 Ang II','腎素作用於血管張力素原產生 Ang I；ACE 形成 Ang II。'),('血管與醛固酮','Ang II 使血管收縮，並促進腎上腺皮質釋放醛固酮。'),('留鈉與排鉀','醛固酮增加遠端腎元 Na⁺ 再吸收與 K⁺ 分泌，間接影響水與循環容積。')], '腎素是酵素；醛固酮與 ADH 的主要作用不同。'),
 'endocrine': ('下視丘—腦下垂體—甲狀腺負回饋', [('下視丘 TRH','下視丘釋放 TRH，刺激腦下垂體前葉。'),('前葉 TSH','前葉釋放 TSH，刺激甲狀腺。'),('甲狀腺 T₃/T₄','甲狀腺產生並釋放 T₃/T₄，作用於標的細胞。'),('負回饋','T₃/T₄ 增加會抑制上游 TRH 與 TSH，避免訊號持續過強。')], '觀察上游刺激與下游負回饋方向。'),
 'reproduction': ('月經週期與 LH 高峰', [('早期濾泡期','FSH 支持濾泡發育；雌二醇逐漸上升。'),('排卵前正回饋','持續高雌二醇由一般負回饋轉為正回饋，觸發 LH 高峰。'),('排卵與黃體期','LH 高峰促進排卵；黃體分泌黃體素及雌二醇，以負回饋抑制上游。'),('未懷孕時黃體退化','黃體素與雌二醇下降，子宮內膜脫落；FSH 得以重新上升。')], '排卵前的持續高雌二醇是正回饋的關鍵例外。'),
 'pupil-response': ('對光反射：雙側輸出', [('視網膜與 CN II','光刺激由視網膜經視神經、視交叉與視束傳入。'),('中腦頂蓋前區','反射路徑抵达頂蓋前區，不必先經視覺皮質。'),('雙側 EW 核','頂蓋前區投射到兩側 Edinger–Westphal 核，解釋直接與間接反射。'),('CN III 到睫狀神經節','節前副交感纖維經動眼神經，於睫狀神經節突觸。'),('短睫狀神經與括約肌','節後纖維經短睫狀神經使瞳孔括約肌收縮。')], '分清傳入 CN II 與傳出 CN III；雙側投射是兩眼縮瞳的原因。'),
}

def retina_diagram():
    names=[('內界膜 ILM','玻璃體側的基底膜，鄰接 Müller 細胞內足。'),('神經纖維層 NFL','神經節細胞軸突向視神經盤匯集。'),('神經節細胞層 GCL','神經節細胞胞體所在。'),('內網狀層 IPL','雙極、神經節與無軸突細胞突觸區。'),('內核層 INL','雙極、水平、無軸突、Müller 細胞核。'),('外網狀層 OPL','感光、雙極與水平細胞突觸區。'),('外核層 ONL','桿與錐細胞核。'),('外界膜 ELM','Müller 與感光細胞的 adherens junction 帶。'),('感光細胞層','包含感光細胞內外節，外節鄰接 RPE。'),('色素上皮 RPE','靠近脈絡膜，提供代謝支持與外血視網膜障壁。')]
    heights=[12,25,32,35,48,32,45,12,58,22]; y=48; shapes=[];points=[]
    for i,((name,desc),h) in enumerate(zip(names,heights)):
        shapes.append(f'<rect x="180" y="{y}" width="440" height="{h}" fill="{["#d6b373","#bce2d7","#a8c8dd","#e8ccb8"][i%4]}" stroke="#fff"/>')
        if i in [2,4,6]:
            shapes.extend(f'<ellipse cx="{x}" cy="{y+h/2}" rx="8" ry="9" fill="#596183"/>' for x in range(210,610,35))
        if i==8: shapes.extend(f'<rect x="{x}" y="{y+8}" width="9" height="42" rx="4" fill="#67537c"/>' for x in range(205,605,25))
        points.append({'name':name,'desc':desc,'x':35+(i%3)*15,'y':round(100*(y+h/2)/450,3)})
        y+=h
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><rect width="800" height="450" fill="#fbf7ec"/><g font-family="Microsoft JhengHei, sans-serif" fill="#30281d" font-size="18"><text x="180" y="30">玻璃體側（內）</text>{"".join(shapes)}<text x="180" y="{y+28}">脈絡膜側（外）</text><text x="25" y="430">十層構造示意；層厚非實測比例。名稱由遊戲標記顯示。</text></g></svg>'
    return svg,points

def heart_diagram():
    regions=[(180,85,150,85,'右心房 RA','接收上、下腔靜脈與冠狀竇回流。'),(170,220,160,125,'右心室 RV','經肺動脈瓣射血至肺動脈。'),(470,85,150,85,'左心房 LA','接收肺靜脈回流。'),(470,220,175,125,'左心室 LV','經主動脈瓣射血至主動脈，壁比右心室厚。'),(200,183,110,20,'三尖瓣 Tricuspid valve','右心房與右心室間的房室瓣。'),(490,183,110,20,'二尖瓣 Mitral valve','左心房與左心室間的房室瓣。'),(80,30,55,235,'腔靜脈 Vena cava','體循環靜脈回流到右心房。'),(355,245,45,120,'肺動脈 Pulmonary artery','由右心室離心，載缺氧血至肺。'),(540,28,70,30,'肺靜脈 Pulmonary vein','含氧血由肺回到左心房。'),(675,170,45,190,'主動脈 Aorta','由左心室送含氧血到全身。')]
    shapes=[];pts=[]
    for i,(x,y,w,h,n,d) in enumerate(regions):
        shapes.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{10 if i<4 else 4}" fill="{["#acd5e2","#aed7cc","#edd0b2"][i%3]}" stroke="#554c40" stroke-width="{7 if i==3 else 2}"/>')
        pts.append({'name':n,'desc':d,'x':(x+w/2)/8,'y':(y+h/2)/4.5})
    shapes+=['<path d="M135 95H180 M135 255H170 M330 285H355 M575 58V85 M645 285H675" stroke="#554c40" stroke-width="8" fill="none"/>']
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><rect width="800" height="450" fill="#fbf7ec"/>'+''.join(shapes)+'<g font-family="Microsoft JhengHei,sans-serif" font-size="17"><text x="170" y="410">身體右側（圖左）</text><text x="470" y="410">身體左側（圖右）</text><text x="25" y="438">房室與主要血管連接示意；非切面或實測比例。</text></g></svg>',pts

def nephron_diagram():
    pts=[('腎絲球 Glomerulus',15,22,'位於腎皮質，血漿在此經濾過屏障形成濾液。'),('鮑氏囊 Bowman capsule',15,32,'包圍腎絲球，囊腔收集濾液並接近曲小管。'),('近曲小管 PCT',35,20,'大量再吸收水、Na⁺、葡萄糖與胺基酸。'),('降支 Descending limb',45,63,'薄降支水通透性較高，向髓質深部行進。'),('升支 Ascending limb',60,63,'回到皮質；厚升支再吸收 Na⁺-K⁺-2Cl⁻，水通透性低。'),('遠曲小管 DCT',73,22,'位於皮質，參與電解質調整；早段含緻密斑。'),('集尿管 Collecting duct',88,63,'跨皮質至髓質；ADH 調節水通透性。')]
    svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><rect width="800" height="180" fill="#fae4ce"/><rect y="180" width="800" height="270" fill="#d7e4ef"/><circle cx="120" cy="100" r="58" fill="#fff8ee" stroke="#67594c" stroke-width="3"/><circle cx="120" cy="95" r="34" fill="#b8655b"/><path d="M174 100 C210 35 230 155 280 90 S340 75 360 145 V320 Q420 410 480 320 V145 Q510 55 585 100 L704 100 V410" fill="none" stroke="#ddae52" stroke-width="25"/><g font-family="Microsoft JhengHei,sans-serif" font-size="18"><text x="20" y="30">腎皮質</text><text x="20" y="215">腎髓質</text><text x="25" y="438">腎元管路示意；省略微血管，非實測比例。</text></g></svg>'
    return svg,[{'name':n,'x':x,'y':y,'desc':d} for n,x,y,d in pts]
