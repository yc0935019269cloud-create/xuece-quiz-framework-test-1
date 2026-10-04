using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Events;
using UnityEngine.EventSystems;
using TMPro;
using Battle;

// 遊戲內面板：用 TextMeshPro ＋ Peglin 自己的字型，排版比照營地的「學習模式」。
// 注意：C# 5 語法（見 QuizPlugin.cs 開頭）。
public partial class QuizPlugin
{
    GameObject quizCanvas, hudCanvas;
    TMP_Text hudText;
    RectTransform quizBody, continueRect, feedbackRect;
    TMP_InputField answerInput;
    string hudFlash = ""; float hudFlashUntil;
    TMP_FontAsset gameFont; bool fontProbed;
    string okMark = "○", noMark = "×";
    string PickGlyph(string candidates, string fallback)
    {
        if (gameFont == null) return fallback;
        foreach (char ch in candidates) if (gameFont.HasCharacter(ch, true, true)) return ch.ToString();
        return fallback;
    }

    // UnityEvent 會略過原生物件已被遊戲清理的 MonoBehaviour target；以普通 C# 物件轉送事件。
    sealed class ClickRelay { readonly UnityAction a; public ClickRelay(UnityAction a) { this.a = a; } public void Invoke() { a(); } }
    sealed class TextRelay { readonly Action<string> a; public TextRelay(Action<string> a) { this.a = a; } public void Invoke(string v) { a(v); } }

    // ---------- 配色（與營地 css/style.css 的 :root 一致） ----------
    static Color Hex(string h) { Color c; ColorUtility.TryParseHtmlString(h, out c); return c; }
    static readonly Color cBg = Hex("#17111f"), cBg2 = Hex("#221a2e"), cPanel = Hex("#2d2340"), cPanel2 = Hex("#3b2f52"), cLine = Hex("#0b0810"), cHi = Hex("#5a4a78"),
        ink = Hex("#f3e9d2"), dim = Hex("#a99bbd"), gold = Hex("#ffcf4a"), cRed = Hex("#ec5454"), good = Hex("#62d66e"), cBlue = Hex("#4fa8ff"), cPurple = Hex("#b98bff"), cOrange = Hex("#ff9a3d");
    static Color Alpha(Color c, float a) { c.a = a; return c; }
    // 半透明色疊在卡片底色上的結果（不透明），避免框內透出外框顏色
    static Color Opaque(Color c) { var o = Color.Lerp(cBg2, new Color(c.r, c.g, c.b, 1), c.a); o.a = 1; return o; }
    // 步驟類型的主色（對應 .t-intro/.t-card/... 的 --pc）
    static Color TypeColor(string badge)
    {
        switch (badge)
        {
            case "導入": return Hex("#9aa6b8");
            case "概念": return cBlue;
            case "範例": return cPurple;
            case "回顧": return gold;
            case "圖解": return good;
            case "互動": return cOrange;
            case "檢核": return cOrange;
            default: return cRed; // 題庫題目
        }
    }

    // ---------- 字型：借用 Peglin 顯示中文的 TMP 字型，缺字再退回微軟正黑體 ----------
    void ProbeFont()
    {
        if (fontProbed && gameFont != null) return;
        fontProbed = true;
        try
        {
            TMP_FontAsset best = null; int bestScore = -1;
            foreach (var t in Resources.FindObjectsOfTypeAll<TMP_Text>())
            {
                if (t == null || t.font == null || string.IsNullOrEmpty(t.text) || !t.gameObject.scene.IsValid()) continue;
                int cjk = 0; foreach (char ch in t.text) if (ch >= '一' && ch <= '鿿') cjk++;
                if (cjk == 0) continue;
                int score = cjk + (t.font.name.IndexOf("Number", StringComparison.OrdinalIgnoreCase) >= 0 ? -1000 : 0);
                if (score > bestScore) { bestScore = score; best = t.font; }
            }
            if (best == null && TMP_Settings.defaultFontAsset != null) best = TMP_Settings.defaultFontAsset;
            if (best == null) { fontProbed = false; return; }
            gameFont = best;
            // 題目裡的醫學名詞可能超出遊戲字型的字集：補一個系統字型當後備（只加在執行中的清單，不改遊戲檔）
            var os = Font.CreateDynamicFontFromOSFont(new[] { "Microsoft JhengHei", "Microsoft YaHei", "Segoe UI Symbol" }, 32);
            var fallback = TMP_FontAsset.CreateFontAsset(os);
            if (fallback != null)
            {
                if (gameFont.fallbackFontAssetTable == null) gameFont.fallbackFontAssetTable = new List<TMP_FontAsset>();
                if (!gameFont.fallbackFontAssetTable.Contains(fallback)) gameFont.fallbackFontAssetTable.Add(fallback);
            }
            var chain = new StringBuilder();
            if (gameFont.fallbackFontAssetTable != null) foreach (var f in gameFont.fallbackFontAssetTable) if (f != null) chain.Append(f.name).Append('[').Append(f.atlasPopulationMode).Append(f.sourceFontFile != null ? ",src" : "").Append("] ");
            string missing = ""; foreach (char ch in "頜腭顳篩蝶鞏膜睫狀虹彩鮑曼錐桿黃斑囊泡") if (!gameFont.HasCharacter(ch, true, true)) missing += ch;
            okMark = PickGlyph("✓✔○◯O", "O"); noMark = PickGlyph("✗✘×Ｘ", "X");
            Logger.LogInfo("QUIZ_FONT marks=" + okMark + noMark + " " + gameFont.name + " mode=" + gameFont.atlasPopulationMode + " src=" + (gameFont.sourceFontFile != null) + " osFallback=" + (fallback != null) + " chain=" + chain + " missing=" + missing);
        }
        catch (Exception e) { Logger.LogWarning("找不到遊戲字型，改用預設：" + e.Message); fontProbed = false; }
    }

    // ---------- 缺字替換：遊戲字型沒有的符號換成最接近、而且字型裡有的寫法 ----------
    // 例：−（數學減號）在像素字型裡是空白，改成全形／半形減號；候選依序嘗試，第一個整串都有字的就用。
    static readonly Dictionary<char, string[]> GlyphSubs = BuildGlyphSubs();
    static Dictionary<char, string[]> BuildGlyphSubs()
    {
        var d = new Dictionary<char, string[]>();
        Action<string, string[]> add = delegate(string keys, string[] c) { foreach (char k in keys) d[k] = c; };
        add("−‐‑‒–", new[] { "-", "－" }); add("－", new[] { "－", "-" });
        add("—―", new[] { "─", "－－", "--" });
        add("′’‘", new[] { "’", "'" });
        add("″“”", new[] { "\"" });
        add("≈", new[] { "≒", "~" });
        add("≠", new[] { "≠", "!=" });
        add("≤", new[] { "≦", "(≤)" });
        add("≥", new[] { "≧", "(≥)" });
        add("✓✔⭕✅", new[] { "○", "O" });
        add("─━", new[] { "─", "—", "-" });
        add("✗✘❌", new[] { "×", "X" });
        add("Δ∆", new[] { "Δ", "△", "delta " });
        add("√", new[] { "√", "sqrt" });
        add("⇒", new[] { "⇒", "→", "=>" });
        add("⇌⇄↔", new[] { "⇄", "←→", "<->" });
        add("∞", new[] { "∞", "無限" });
        add("⊥", new[] { "⊥", "垂直" });
        add("∥", new[] { "∥", "//" });
        add("∝", new[] { "∝", "正比於" });
        add("⋯…", new[] { "…", "..." });
        add("·", new[] { "·", "‧", "・", "." });
        add("µ", new[] { "μ", "u" });
        add("½", new[] { "1/2" }); add("¼", new[] { "1/4" });
        add("±", new[] { "±", "+/-" });
        add("÷", new[] { "÷", "/" });
        add("★", new[] { "★", "*" });
        add("△", new[] { "△", "Δ" });
        add("〈", new[] { "〈", "（" }); add("〉", new[] { "〉", "）" });
        add("ü", new[] { "ü", "u" }); add("ö", new[] { "ö", "o" }); add("Æ", new[] { "Æ", "AE" });
        string sub = "₀₁₂₃₄₅₆₇₈₉", sup = "⁰¹²³⁴⁵⁶⁷⁸⁹";
        for (int i = 0; i < 10; i++) { d[sub[i]] = new[] { sub[i].ToString(), i.ToString() }; d[sup[i]] = new[] { sup[i].ToString(), "^" + i }; }
        d['⁺'] = new[] { "⁺", "+" }; d['⁻'] = new[] { "⁻", "-" }; d['₊'] = new[] { "+" }; d['₋'] = new[] { "-" };
        d['ᵢ'] = new[] { "i" }; d['ₓ'] = new[] { "x" }; d['ₗ'] = new[] { "l" }; d['ₑ'] = new[] { "e" }; d['ₙ'] = new[] { "n" };
        string circled = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";
        for (int i = 0; i < circled.Length; i++) d[circled[i]] = new[] { circled[i].ToString(), "(" + (i + 1) + ")" };
        d['̄'] = new[] { "" }; // 組合用上橫線：像素字型畫不出來，直接略過
        return d;
    }
    readonly Dictionary<char, bool> hasGlyph = new Dictionary<char, bool>();
    readonly Dictionary<char, string> glyphFix = new Dictionary<char, string>();
    bool HasGlyph(char c)
    {
        if (gameFont == null || c < 32 || c == ' ') return true;
        bool ok; if (hasGlyph.TryGetValue(c, out ok)) return ok;
        // 只問「有沒有這個字」不夠：像素字型的 −（U+2212）有字但字形是空的，畫出來是空白。
        // 依 TMP 的順序（本身 → 後備字型）找第一個有這個字的字型，再確認字形真的有大小。
        ok = false;
        try
        {
            if (char.IsWhiteSpace(c)) ok = true;
            else
            {
                var chain = new List<TMP_FontAsset> { gameFont };
                if (gameFont.fallbackFontAssetTable != null) chain.AddRange(gameFont.fallbackFontAssetTable);
                if (TMP_Settings.fallbackFontAssets != null) chain.AddRange(TMP_Settings.fallbackFontAssets);
                foreach (var fa in chain)
                {
                    if (fa == null || !fa.HasCharacter(c, false, true)) continue;
                    TMP_Character tc;
                    ok = fa.characterLookupTable.TryGetValue(c, out tc) && tc != null && tc.glyph != null && tc.glyph.glyphRect.width > 0 && tc.glyph.metrics.width > 0.01f && tc.glyph.metrics.height > 0.01f;
                    break;
                }
            }
        }
        catch (Exception) { ok = true; }
        hasGlyph[c] = ok; return ok;
    }
    string FixChar(char c)
    {
        string r; if (glyphFix.TryGetValue(c, out r)) return r;
        r = null; string[] cands;
        if (GlyphSubs.TryGetValue(c, out cands))
            foreach (var cand in cands) { bool all = true; foreach (char x in cand) if (!HasGlyph(x)) { all = false; break; } if (all) { r = cand; break; } }
        if (r == null)
        {
            // 最後一招：Unicode 相容分解（全形→半形、合字拆開…），整串都有字才用
            string n = c.ToString().Normalize(NormalizationForm.FormKC);
            bool all = n != c.ToString() && n.Length > 0; foreach (char x in n) if (!HasGlyph(x)) all = false;
            r = all ? n : c.ToString();
        }
        glyphFix[c] = r; return r;
    }
    const string SupChars = "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ", SupPlain = "0123456789+-=()ni";
    const string SubChars = "₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₒₓₕₖₗₘₙₚₛₜᵢ", SubPlain = "0123456789+-=()aeoxhklmnpsti";
    // 上標／下標只要有一個字型沒有，就整串一起轉（10⁻⁶ → 10^-6、C₆H₁₂O₆ → C6H12O6），避免一半上標一半不是
    string ScriptSafe(string s, string chars, string plain, string prefix)
    {
        bool need = false; foreach (char c in s) if (chars.IndexOf(c) >= 0 && !HasGlyph(c)) { need = true; break; }
        if (!need) return s;
        var b = new StringBuilder(s.Length + 8); bool inRun = false;
        foreach (char c in s)
        {
            int i = chars.IndexOf(c);
            if (i >= 0) { if (!inRun) b.Append(prefix); b.Append(plain[i]); inRun = true; }
            else { b.Append(c); inRun = false; }
        }
        return b.ToString();
    }
    string FontSafe(string s)
    {
        if (string.IsNullOrEmpty(s) || gameFont == null) return s;
        s = ScriptSafe(ScriptSafe(s, SupChars, SupPlain, "^"), SubChars, SubPlain, "");
        StringBuilder b = null;
        for (int i = 0; i < s.Length; i++)
        {
            char c = s[i];
            if (c < 128 || char.IsSurrogate(c) || HasGlyph(c)) { if (b != null) b.Append(c); continue; }
            if (c >= '\uE000' && c <= '\uF8FF') { if (b == null) { b = new StringBuilder(s.Length); b.Append(s, 0, i); } continue; } // 私用區字元：略過
            if (b == null) { b = new StringBuilder(s.Length + 8); b.Append(s, 0, i); }
            b.Append(FixChar(c));
        }
        return b == null ? s : b.ToString();
    }
    // 每份題本檢查一次：記錄哪些字遊戲字型沒有、換成什麼（player.log 的 QUIZ_GLYPHS）
    string glyphCheckedFor = "";
    void CheckSessionGlyphs()
    {
        if (gameFont == null || session == null || S(session, "id") == glyphCheckedFor) return;
        glyphCheckedFor = S(session, "id");
        var seen = new HashSet<char>(); var sb = new StringBuilder();
        foreach (var q in questions) foreach (char c in q.ToString(Newtonsoft.Json.Formatting.None))
            if (c >= 128 && !char.IsSurrogate(c) && seen.Add(c) && !HasGlyph(c)) sb.Append(c).Append("→").Append(FixChar(c)).Append(' ');
        Logger.LogInfo("QUIZ_GLYPHS session=" + glyphCheckedFor + " missing: " + (sb.Length > 0 ? sb.ToString() : "（無）"));
    }

    // ---------- 小工具 ----------
    RectTransform RectUI(string name, Transform parent)
    {
        var go = new GameObject(name, typeof(RectTransform)); go.transform.SetParent(parent, false);
        return go.GetComponent<RectTransform>();
    }
    static void Stretch(RectTransform r, float left, float top, float right, float bottom)
    { r.anchorMin = Vector2.zero; r.anchorMax = Vector2.one; r.offsetMin = new Vector2(left, bottom); r.offsetMax = new Vector2(-right, -top); }
    Image Fill(RectTransform r, Color c) { var im = r.gameObject.AddComponent<Image>(); im.color = c; return im; }
    // 像素風外框：Outline 在四周多畫一圈
    static void Border(Graphic g, Color c, float w) { var o = g.gameObject.AddComponent<Outline>(); o.effectColor = c; o.effectDistance = new Vector2(w, -w); o.useGraphicAlpha = false; }
    TMP_Text Txt(Transform parent, string text, float size, Color color, bool rich)
    {
        var r = RectUI("Text", parent); var t = r.gameObject.AddComponent<TextMeshProUGUI>();
        if (gameFont != null) t.font = gameFont;
        t.fontSize = size; t.color = color; t.richText = rich; t.text = FontSafe(text ?? "");
        t.enableWordWrapping = true; t.overflowMode = TextOverflowModes.Overflow; t.lineSpacing = 18; t.raycastTarget = false;
        return t;
    }
    VerticalLayoutGroup VStack(RectTransform r, int l, int rt, int t, int b, float spacing)
    {
        var vg = r.gameObject.AddComponent<VerticalLayoutGroup>(); vg.padding = new RectOffset(l, rt, t, b); vg.spacing = spacing;
        vg.childControlWidth = vg.childControlHeight = true; vg.childForceExpandWidth = true; vg.childForceExpandHeight = false; return vg;
    }
    HorizontalLayoutGroup HStack(RectTransform r, int l, int rt, int t, int b, float spacing)
    {
        var hg = r.gameObject.AddComponent<HorizontalLayoutGroup>(); hg.padding = new RectOffset(l, rt, t, b); hg.spacing = spacing;
        hg.childControlWidth = hg.childControlHeight = true; hg.childForceExpandWidth = false; hg.childForceExpandHeight = false; hg.childAlignment = TextAnchor.UpperLeft; return hg;
    }
    static LayoutElement LE(Component c, float minW, float prefW, float minH, float flexW)
    { var le = c.gameObject.GetComponent<LayoutElement>() ?? c.gameObject.AddComponent<LayoutElement>(); if (minW >= 0) le.minWidth = minW; if (prefW >= 0) le.preferredWidth = prefW; if (minH >= 0) le.minHeight = minH; if (flexW >= 0) le.flexibleWidth = flexW; return le; }
    Button MakeButton(RectTransform r, UnityAction click, Graphic target)
    {
        var b = r.gameObject.AddComponent<Button>(); b.targetGraphic = target; b.onClick.AddListener(new ClickRelay(click).Invoke);
        var cs = b.colors; cs.normalColor = Color.white; cs.highlightedColor = new Color(1.18f, 1.18f, 1.18f); cs.pressedColor = new Color(0.8f, 0.8f, 0.8f); cs.selectedColor = Color.white; b.colors = cs;
        var nav = b.navigation; nav.mode = Navigation.Mode.None; b.navigation = nav;
        return b;
    }

    // Markdown → TMP 富文字：粗體、行內碼、清單縮排、引用、表格；原文的 < 不會被當成標籤
    static string Rich(string s)
    {
        s = Regex.Replace(s ?? "", @"!\[[^\]]*\]\([^)]*\)", "");
        s = Regex.Replace(s, @"\[([^\]]+)\]\([^)]*\)", "$1");
        s = s.Replace("<", "\u0001");
        var lines = s.Replace("\r", "").Split('\n'); var sb = new StringBuilder(); bool code = false;
        foreach (var raw in lines)
        {
            string line = raw;
            if (line.TrimStart().StartsWith("```")) { code = !code; continue; }
            if (code) { sb.Append("<color=#ffe39a>").Append(line).Append("</color>\n"); continue; }
            if (Regex.IsMatch(line, @"^\s*\|?\s*:?-{3,}")) continue;
            Match m;
            if ((m = Regex.Match(line, @"^(\s*)[-*+]\s+(.*)$")).Success) line = new string(' ', 0) + (m.Groups[1].Value.Length >= 2 ? "<indent=1.2em>◦ <indent=2.2em>" : "• <indent=1.1em>") + m.Groups[2].Value + "</indent>";
            else if ((m = Regex.Match(line, @"^\s*(\d+)[.)]\s+(.*)$")).Success) line = m.Groups[1].Value + ". <indent=1.6em>" + m.Groups[2].Value + "</indent>";
            else if ((m = Regex.Match(line, @"^\s*#{1,6}\s*(.*)$")).Success) line = "<b><color=#ffcf4a>" + m.Groups[1].Value + "</color></b>";
            else if ((m = Regex.Match(line, @"^\s*>\s?(.*)$")).Success) line = "<color=#a99bbd>｜" + m.Groups[1].Value + "</color>";
            else if (Regex.IsMatch(line, @"^\s*\|.*\|\s*$")) line = line.Trim().Trim('|').Replace("|", "　│　");
            sb.Append(line).Append('\n');
        }
        s = sb.ToString().TrimEnd('\n');
        s = Regex.Replace(s, @"\*\*(.+?)\*\*", "<b><color=#ffe08a>$1</color></b>");
        s = Regex.Replace(s, @"__(.+?)__", "<b>$1</b>");
        s = Regex.Replace(s, @"`([^`]+)`", "<color=#ffe39a>$1</color>");
        s = Regex.Replace(s, @"\n{3,}", "\n\n");
        return s.Replace("\u0001", "<noparse><</noparse>");
    }

    // ---------- 畫布 ----------
    void EnsureCanvas()
    {
        ProbeFont(); CheckSessionGlyphs();
        if (quizCanvas != null) return;
        quizCanvas = new GameObject("PeglinQuizCanvas", typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
        var canvas = quizCanvas.GetComponent<Canvas>(); canvas.renderMode = RenderMode.ScreenSpaceOverlay; canvas.sortingOrder = 32760;
        var scaler = quizCanvas.GetComponent<CanvasScaler>(); scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize; scaler.referenceResolution = new Vector2(1280, 800); scaler.matchWidthOrHeight = 0.5f;
        quizCanvas.AddComponent<QuizDriver>();
        UnityEngine.Object.DontDestroyOnLoad(quizCanvas);
    }

    // 戰鬥中的小徽章：答對率、連對、下一次答對的倍率。跟著戰鬥場景一起被銷毀。
    void UpdateHud()
    {
        bool want = questions != null && BattleController.BattleActive && !showing;
        if (!want) { if (hudCanvas != null) hudCanvas.SetActive(false); return; }
        if (hudCanvas == null)
        {
            ProbeFont();
            hudCanvas = new GameObject("PeglinQuizHud", typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler));
            var canvas = hudCanvas.GetComponent<Canvas>(); canvas.renderMode = RenderMode.ScreenSpaceOverlay; canvas.sortingOrder = 32000;
            var scaler = hudCanvas.GetComponent<CanvasScaler>(); scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize; scaler.referenceResolution = new Vector2(1280, 800); scaler.matchWidthOrHeight = 0.5f;
            var pill = RectUI("Pill", hudCanvas.transform); pill.anchorMin = pill.anchorMax = pill.pivot = new Vector2(0.5f, 1); pill.anchoredPosition = new Vector2(0, -5); pill.sizeDelta = new Vector2(520, 30);
            var im = Fill(pill, cBg); im.raycastTarget = false; Border(im, cLine, 2);
            hudText = Txt(pill, "", 18, gold, true); hudText.alignment = TextAlignmentOptions.Center; hudText.enableWordWrapping = false; Stretch(hudText.rectTransform, 8, 0, 8, 0);
        }
        hudCanvas.SetActive(true);
        if (Time.unscaledTime < hudFlashUntil && hudFlash.Length > 0) { hudText.text = FontSafe(hudFlash); return; }
        if (Learn) { hudText.text = FontSafe("彈珠學習　" + S(session, "label") + "　·　" + (lap > 1 ? "複習第 " + (lap - 1) + " 輪　·　" : "") + correct + "/" + answered + " 答對"); return; }
        float next = Multiplier(streak + 1);
        hudText.text = FontSafe("彈珠刷題　" + correct + "/" + answered + " 答對　·　連對 " + streak + (next > 1f ? "　·　下一題答對 <color=#ffe08a>×" + next.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture) + "</color>" : ""));
    }

    // ---------- 主面板 ----------
    void RefreshCanvas()
    {
        EnsureCanvas(); quizCanvas.SetActive(true);
        foreach (Transform child in quizCanvas.transform) { child.gameObject.SetActive(false); UnityEngine.Object.Destroy(child.gameObject); }
        if (hudCanvas != null) hudCanvas.SetActive(false);
        continueRect = null; answerInput = null; feedbackRect = null;
        var back = RectUI("Backdrop", quizCanvas.transform); Stretch(back, 0, 0, 0, 0); Fill(back, Alpha(cBg, 0.97f));

        // 頁首：模式、課名／題本、進度點
        var head = RectUI("Header", back); head.anchorMin = new Vector2(0, 1); head.anchorMax = Vector2.one; head.pivot = new Vector2(0.5f, 1); head.offsetMin = new Vector2(60, -92); head.offsetMax = new Vector2(-60, -14);
        var mode = Txt(head, Learn ? "彈珠學習 × PEGLIN" : "彈珠刷題 × PEGLIN", 18, dim, false); mode.rectTransform.anchorMin = new Vector2(0, 1); mode.rectTransform.anchorMax = new Vector2(0.6f, 1); mode.rectTransform.pivot = new Vector2(0, 1); mode.rectTransform.sizeDelta = new Vector2(0, 22); mode.rectTransform.anchoredPosition = Vector2.zero;
        string titleText, counter;
        if (question == null) { titleText = notice; counter = ""; }
        else if (Learn) { titleText = S(question, "lessonTitle"); counter = lap > 1 ? "複習第 " + (lap - 1) + " 輪・剩 " + order.Count + " 題" : S(question, "step") + " / " + S(question, "steps"); }
        else { titleText = S(question, "examLabel"); counter = "第 " + lap + " 輪・剩 " + order.Count + " / " + questions.Count; }
        var title = Txt(head, titleText, 24, gold, false); title.enableWordWrapping = false; title.overflowMode = TextOverflowModes.Ellipsis;
        title.rectTransform.anchorMin = new Vector2(0, 1); title.rectTransform.anchorMax = new Vector2(1, 1); title.rectTransform.pivot = new Vector2(0, 1); title.rectTransform.offsetMin = new Vector2(0, -58); title.rectTransform.offsetMax = new Vector2(-260, -22);
        var cnt = Txt(head, counter + (answered > 0 ? "　" + correct + "/" + answered + " 答對" + (streak > 1 ? "・連對 " + streak : "") : ""), 18, dim, false); cnt.alignment = TextAlignmentOptions.BottomRight; cnt.enableWordWrapping = false;
        cnt.rectTransform.anchorMin = new Vector2(1, 1); cnt.rectTransform.anchorMax = new Vector2(1, 1); cnt.rectTransform.pivot = new Vector2(1, 1); cnt.rectTransform.sizeDelta = new Vector2(360, 30); cnt.rectTransform.anchoredPosition = new Vector2(0, -26);
        if (question != null && Learn && lap == 1) Pips(head, N(question, "step", 1), N(question, "steps", 1), TypeColor(BadgeOf(question)));

        // 內容：可捲動的卡片
        var view = RectUI("ScrollViewport", back); Stretch(view, 60, 104, 60, 96);
        view.gameObject.AddComponent<Image>().color = new Color(0, 0, 0, 0.001f);
        view.gameObject.AddComponent<RectMask2D>();
        var sr = view.gameObject.AddComponent<ScrollRect>(); sr.horizontal = false; sr.vertical = true; sr.movementType = ScrollRect.MovementType.Clamped; sr.scrollSensitivity = 40;
        var content = RectUI("Content", view); content.anchorMin = new Vector2(0, 1); content.anchorMax = Vector2.one; content.pivot = new Vector2(0.5f, 1); content.sizeDelta = Vector2.zero;
        VStack(content, 0, 14, 0, 12, 12); content.gameObject.AddComponent<ContentSizeFitter>().verticalFit = ContentSizeFitter.FitMode.PreferredSize;
        sr.content = content; sr.viewport = view;

        // 卡片本體：上緣色條＋類型標籤（.lp-body）
        string badge = question == null ? "" : BadgeOf(question);
        Color pc = question == null ? cHi : TypeColor(badge);
        var card = RectUI("Card", content); var cardIm = Fill(card, cBg2); Border(cardIm, cLine, 3);
        VStack(card, 0, 0, 0, 22, 0);
        var stripe = RectUI("Stripe", card); Fill(stripe, pc); LE(stripe, -1, -1, 6, -1).preferredHeight = 6;
        quizBody = RectUI("Body", card); VStack(quizBody, 26, 26, 16, 0, 14);

        TMP_InputField focus = null; string hint = "";
        if (question == null)
        {
            Para(notice, 22, ink);
            Btn(quizBody, "開啟刷題營地選題本", delegate { Application.OpenURL("http://127.0.0.1:18769/index.html#peglin"); }, cPanel2, ink);
            Btn(quizBody, "重新載入題本", delegate { ReloadSession(); if (questions != null) { qIndex = NextIndex(); question = (JObject)questions[qIndex]; } RefreshCanvas(); }, cPanel2, ink);
        }
        else if (IsRead) { RenderRead(pc, badge); hint = "讀完按 Enter／空白鍵"; }
        else focus = RenderQuestion(pc, badge, ref hint);

        // 頁尾：左邊快捷鍵提示，右邊金色主按鈕（.px-btn.gold）
        var footer = RectUI("Footer", back); footer.anchorMin = Vector2.zero; footer.anchorMax = new Vector2(1, 0); footer.pivot = new Vector2(0.5f, 0); footer.offsetMin = new Vector2(60, 20); footer.offsetMax = new Vector2(-60, 80);
        var ht = Txt(footer, hint, 18, dim, false); ht.alignment = TextAlignmentOptions.MidlineLeft; Stretch(ht.rectTransform, 0, 0, 380, 0);
        string main = null; UnityAction act = null;
        if (graded) { main = IsRead ? (B(question, "lessonEnd") ? "完成本課　Enter" : "繼續 ▶　Enter") : "回到彈珠盤 ▶　Enter"; act = delegate { Continue("button"); }; }
        else if (question != null && S(question, "type") == "multi") { main = "確認答案（已選 " + picked.Count + "）　Enter"; act = delegate { GradeSelected(); }; }
        else if (question != null && S(question, "type") == "fill" && question["accept"] is JArray) { main = "送出答案　Enter"; act = delegate { SubmitFill(); }; }
        if (main != null)
        {
            var br = RectUI("Primary", footer); br.anchorMin = new Vector2(1, 0); br.anchorMax = new Vector2(1, 1); br.pivot = new Vector2(1, 0.5f); br.sizeDelta = new Vector2(360, 0); br.anchoredPosition = Vector2.zero;
            var bim = Fill(br, gold); Border(bim, cLine, 3); MakeButton(br, act, bim);
            var bt = Txt(br, main, 24, cBg, false); bt.alignment = TextAlignmentOptions.Center; bt.fontStyle = FontStyles.Bold; Stretch(bt.rectTransform, 10, 0, 10, 0);
            if (graded) continueRect = br;
        }

        Canvas.ForceUpdateCanvases(); LayoutRebuilder.ForceRebuildLayoutImmediate(content); Canvas.ForceUpdateCanvases();
        sr.verticalNormalizedPosition = 1;
        // 批改後捲到回饋框，讓「答對／答錯」和詳解第一眼就看得到
        if (feedbackRect != null)
        {
            float viewH = view.rect.height, total = content.rect.height;
            if (total > viewH)
            {
                // content 的樞紐在頂端，區域座標往下為負：-y 就是回饋框頂端離內容頂端的距離
                Vector3 lp = content.InverseTransformPoint(feedbackRect.TransformPoint(new Vector3(0, feedbackRect.rect.yMax, 0)));
                float y = Mathf.Clamp(-lp.y - 16, 0, total - viewH);
                sr.verticalNormalizedPosition = 1 - y / (total - viewH);
            }
        }
        // 不讓任何按鈕保持「選取」：原版的確認鍵（Submit）才不會替我們按下按鈕
        try { if (EventSystem.current != null) EventSystem.current.SetSelectedGameObject(focus != null ? focus.gameObject : null); if (focus != null) focus.ActivateInputField(); } catch (Exception) { }
    }
    static void void_(object o) { }
    string BadgeOf(JObject q)
    {
        string b = S(q, "badge"); if (b.Length > 0) return b;
        return S(q, "checkId").Length > 0 ? "檢核" : Learn ? "實戰" : "題目";
    }
    void Pips(RectTransform head, int cur, int total, Color pc)
    {
        var row = RectUI("Pips", head); row.anchorMin = new Vector2(0, 0); row.anchorMax = new Vector2(1, 0); row.pivot = new Vector2(0, 0); row.sizeDelta = new Vector2(0, 10); row.anchoredPosition = new Vector2(0, -2);
        var hg = HStack(row, 0, 0, 0, 0, 4); hg.childForceExpandWidth = true; hg.childControlWidth = true;
        total = Math.Max(1, Math.Min(total, 60));
        for (int i = 1; i <= total; i++)
        {
            var p = RectUI("Pip", row); var im = Fill(p, i < cur ? Alpha(good, 0.85f) : i == cur ? pc : Alpha(cHi, 0.55f)); im.raycastTarget = false;
            LE(p, 4, -1, 10, 1).maxWidth(46);
        }
    }

    // ---------- 各區塊 ----------
    TMP_Text Para(string md, float size, Color color) { var t = Txt(quizBody, Rich(md), size, color, true); return t; }
    void Tag(Transform parent, string text, Color pc)
    {
        var row = RectUI("TagRow", parent); var hg = HStack(row, 0, 0, 0, 0, 0);
        var tag = RectUI("Tag", row); var im = Fill(tag, pc); HStack(tag, 10, 10, 3, 3, 0);
        var t = Txt(tag, text, 18, cBg, false); t.fontStyle = FontStyles.Bold; t.enableWordWrapping = false;
        void_(hg); void_(im);
    }
    // 有色邊的框（.lp-keys／.lp-goals／回饋框）：外層色、內層底色
    RectTransform Box(Color edge, Color bg, float border)
    {
        var outer = RectUI("Box", quizBody); Fill(outer, edge); var vg = VStack(outer, (int)border, (int)border, (int)border, (int)border, 0);
        var inner = RectUI("Inner", outer); Fill(inner, Opaque(bg)); VStack(inner, 16, 16, 12, 12, 8);
        void_(vg); return inner;
    }
    RectTransform LeftBar(Color bar, Color bg)
    {
        var row = RectUI("Bar", quizBody); Fill(row, Opaque(bg)); var hg = HStack(row, 0, 14, 0, 0, 12); hg.childForceExpandHeight = true; hg.childControlHeight = true;
        var b = RectUI("B", row); Fill(b, bar); LE(b, 5, 5, -1, 0);
        var body = RectUI("T", row); VStack(body, 0, 0, 10, 10, 6); LE(body, -1, -1, -1, 1);
        return body;
    }
    Button Btn(Transform parent, string text, UnityAction click, Color bg, Color fg)
    {
        var r = RectUI("Button", parent); var im = Fill(r, Opaque(bg)); Border(im, cLine, 3);
        HStack(r, 16, 16, 10, 10, 0);
        var t = Txt(r, text, 24, fg, true); LE(t, -1, -1, -1, 1);
        return MakeButton(r, click, im);
    }
    void RenderRead(Color pc, string badge)
    {
        Tag(quizBody, badge.Length > 0 ? badge : "閱讀", pc);
        var h = Txt(quizBody, Rich(S(question, "title")), 30, gold, true); h.fontStyle = FontStyles.Bold;
        string img = S(question, "img"); if (img.Length > 0) CanvasImage(img, null, 360);
        if (S(question, "body").Trim().Length > 0) { Para(S(question, "body"), 24, ink); CanvasMarkdownImages(S(question, "body")); }
        var ex = question["exSteps"] as JArray;
        if (ex != null && ex.Count > 0)
        {
            for (int i = 0; i < ex.Count; i++)
            {
                var row = RectUI("Step", quizBody); HStack(row, 0, 0, 0, 0, 12);
                var n = RectUI("No", row); Fill(n, cPurple); LE(n, 32, 32, 32, 0); var nt = Txt(n, (i + 1).ToString(), 18, cBg, false); nt.alignment = TextAlignmentOptions.Center; nt.fontStyle = FontStyles.Bold; Stretch(nt.rectTransform, 0, 0, 0, 0);
                var t = Txt(row, Rich((string)ex[i]), 24, ink, true); LE(t, -1, -1, -1, 1);
            }
            string ans = S(question, "exAnswer"); if (ans.Length > 0) { var box = Box(good, Alpha(good, 0.12f), 3); Txt(box, okMark + " " + Rich(ans), 24, ink, true); }
        }
        var goals = question["goals"] as JArray; if (goals != null && goals.Count > 0) ListBox("這課學完你會", goals, cBlue);
        var keys = question["keys"] as JArray; if (keys != null && keys.Count > 0) ListBox(badge == "回顧" ? "重點整理" : "重點", keys, cBlue);
        var flash = question["flash"] as JArray;
        if (flash != null && flash.Count > 0)
        {
            var box = Box(Alpha(gold, 0.8f), Alpha(gold, 0.08f), 3);
            var ft = Txt(box, "記憶卡", 18, gold, false); ft.fontStyle = FontStyles.Bold;
            foreach (var f in flash) Txt(box, "<b>" + Rich(S(f, "front")) + "</b>\n<color=#a99bbd>→</color> " + Rich(S(f, "back")), 24, ink, true);
        }
        string tip = S(question, "tip"); if (tip.Length > 0) { var tb = LeftBar(cPurple, Alpha(cPurple, 0.12f)); Txt(tb, Rich(tip), 24, ink, true); }
        string next = S(question, "next"); if (next.Length > 0) Txt(quizBody, "<color=#a99bbd>下一課：</color>" + Rich(next), 24, ink, true);
        if (B(question, "lessonEnd")) { var t = Txt(quizBody, "這是本課最後一步，讀完就完成本課。", 18, good, false); void_(t); }
    }
    void ListBox(string title, JArray items, Color edge)
    {
        var box = Box(Alpha(edge, 0.85f), Alpha(edge, 0.1f), 3);
        var t = Txt(box, title, 24, edge, false); t.fontStyle = FontStyles.Bold;
        var sb = new StringBuilder(); foreach (var k in items) { if (sb.Length > 0) sb.Append('\n'); sb.Append("• <indent=1.1em>").Append(Rich((string)k)).Append("</indent>"); }
        Txt(box, sb.ToString(), 24, ink, true);
    }
    TMP_InputField RenderQuestion(Color pc, string badge, ref string hint)
    {
        string type = S(question, "type"), key = S(question, "key");
        var chs = question["choices"] as JArray;
        bool tf = chs != null && chs.Count == 2 && ((string)chs[0] ?? "").Contains("對") && ((string)chs[1] ?? "").Contains("錯");
        string kind = type == "multi" ? "多選題" : type == "fill" ? "填答題" : type == "open" ? "自評題" : tf ? "是非題" : "單選題";
        var tagRow = RectUI("Meta", quizBody); HStack(tagRow, 0, 0, 0, 0, 10);
        Tag(tagRow, badge, pc);
        var kt = Txt(tagRow, kind + (Learn || S(question, "n").Length == 0 ? "" : (Regex.IsMatch(S(question, "n"), "^[0-9]+$") ? "・第 " + S(question, "n") + " 題" : "・題號 " + S(question, "n"))), 18, dim, false); kt.enableWordWrapping = false;
        var group = question["groupData"];
        if (group != null && group.Type == JTokenType.Object)
        {
            var gb = LeftBar(cHi, Alpha(cHi, 0.18f)); var t = Txt(gb, "題組", 18, dim, false); void_(t);
            Txt(gb, Rich(S(group, "text")), 24, ink, true); CanvasMarkdownImages(S(group, "text")); CanvasImages(group["imgs"], group["marks"]);
        }
        if (hinted && !graded) { var hb = Box(cOrange, Alpha(cOrange, 0.12f), 3); Txt(hb, "<b><color=#ff9a3d>提示</color></b>　" + Rich(S(question, "hint")) + "\n<color=#a99bbd>再想一次，這次答對一樣算數。</color>", 24, ink, true); }
        Txt(quizBody, Rich(S(question, "stem")), 24, ink, true);
        CanvasMarkdownImages(S(question, "stem")); CanvasImages(question["imgs"], question["marks"]);
        TMP_InputField focus = null;
        if (type == "single" || type == "multi")
        {
            int opts = N(question, "opts", 2); var choices = question["choices"] as JArray;
            var list = RectUI("Options", quizBody); VStack(list, 0, 0, 0, 0, 8);
            for (int i = 0; i < opts; i++)
            {
                string label = OptionLabel(i), text = choices != null && i < choices.Count ? (string)choices[i] : "";
                int captured = i; bool mine = picked.Contains(label), right = key.Contains(label);
                Color bg = !graded ? (mine ? Alpha(cBlue, 0.35f) : cPanel2) : right ? Alpha(good, 0.28f) : mine ? Alpha(cRed, 0.3f) : cPanel;
                Color edge = !graded ? (mine ? cBlue : cLine) : right ? good : mine ? cRed : cLine;
                var r = RectUI("Opt", list); var im = Fill(r, Opaque(bg)); Border(im, edge, 3);
                HStack(r, 10, 16, 9, 9, 12).childAlignment = TextAnchor.MiddleLeft;
                var sq = RectUI("Letter", r); Fill(sq, cLine); LE(sq, 32, 32, 32, 0);
                var lt = Txt(sq, graded ? (right ? okMark : mine ? noMark : label) : label, 24, graded && right ? good : graded && mine ? cRed : gold, false); lt.alignment = TextAlignmentOptions.Center; Stretch(lt.rectTransform, 0, 0, 0, 0);
                var ot = Txt(r, Rich(text), 24, graded && !right && !mine ? dim : ink, true); LE(ot, -1, -1, -1, 1);
                MakeButton(r, delegate { Pick(captured); }, im);
                if (choices != null && i < choices.Count) CanvasMarkdownImages(text);
            }
            if (!graded) hint = "按 1–" + Math.Min(9, opts) + " 或 A–" + (char)('A' + Math.Min(9, opts) - 1) + " 作答" + (type == "multi" ? "，可複選，Enter 確認" : "") + "　·　作答時戰鬥暫停";
        }
        else if (!graded)
        {
            bool auto = type == "fill" && question["accept"] is JArray;
            Txt(quizBody, auto ? "輸入答案後按 Enter；中英文雙名的題目請兩個都寫。" : "先寫下作答要點，再揭曉答案自評。", 18, dim, false);
            focus = AnswerBox(auto);
            if (!auto)
            {
                if (!revealed) Btn(quizBody, "揭曉參考答案", delegate { revealed = true; RefreshCanvas(); }, cPanel2, ink);
                else
                {
                    var rb = Box(gold, Alpha(gold, 0.08f), 3); Txt(rb, "<b><color=#ffcf4a>參考答案</color></b>　" + Rich(S(question, "ans")), 24, ink, true);
                    if (S(question, "ex").Trim().Length > 0) Txt(rb, Rich(S(question, "ex")), 24, ink, true);
                    var row = RectUI("Self", quizBody); var hg = HStack(row, 0, 0, 0, 0, 12); hg.childForceExpandWidth = true; hg.childControlWidth = true;
                    LE(Btn(row, okMark + " 我答對了", delegate { Grade(true, typed, true); }, Alpha(good, 0.3f), ink), -1, -1, -1, 1);
                    LE(Btn(row, noMark + " 我答錯了", delegate { Grade(false, typed, true); }, Alpha(cRed, 0.3f), ink), -1, -1, -1, 1);
                }
            }
            hint = auto ? "Enter 送出　·　作答時戰鬥暫停" : "作答時戰鬥暫停";
        }
        if (graded)
        {
            Color c = resultOk ? good : cRed;
            var fb = Box(c, Alpha(c, 0.12f), 3); feedbackRect = (RectTransform)fb.parent;
            var ft = Txt(fb, resultOk ? okMark + " 答對了！" : noMark + " 答錯了，看完詳解再出手。", 36, c, false); ft.fontStyle = FontStyles.Bold;
            if (rewardText.Length > 0) Txt(fb, rewardText.Replace("<", "＜"), 24, resultOk ? gold : ink, true);
            if (type != "single" && type != "multi") Txt(fb, "<color=#a99bbd>你的答案</color>　" + (pickedText.Trim().Length > 0 ? pickedText.Replace("<", "＜") : "（未填）"), 24, ink, true);
            Txt(fb, "<b><color=#ffcf4a>正確答案</color></b>　" + Rich(S(question, "ans")), 24, ink, true);
            if (S(question, "ex").Trim().Length > 0 && !(type == "open" && revealed)) { Txt(fb, Rich(S(question, "ex")), 24, ink, true); }
            CanvasMarkdownImages(S(question, "ex"));
            string tag = S(question, "tag"); if (tag.Length > 0) Txt(fb, "<color=#a99bbd>關鍵字　" + tag.Replace("<", "＜") + "</color>", 18, dim, true);
            hint = "Enter／空白鍵 回到彈珠盤";
        }
        return focus;
    }
    TMP_InputField AnswerBox(bool single)
    {
        var ir = RectUI("AnswerInput", quizBody); ir.gameObject.SetActive(false);
        var im = Fill(ir, Opaque(cBg)); Border(im, cHi, 3); LE(ir, -1, -1, single ? 58 : 120, -1).preferredHeight = single ? 58 : 120;
        var area = RectUI("TextArea", ir); Stretch(area, 16, 10, 16, 10); area.gameObject.AddComponent<RectMask2D>();
        var ph = Txt(area, single ? "在這裡輸入答案…" : "寫下你的作答要點…", 24, Alpha(dim, 0.7f), false); Stretch(ph.rectTransform, 0, 0, 0, 0); ph.enableWordWrapping = !single;
        var tx = Txt(area, "", 24, ink, false); Stretch(tx.rectTransform, 0, 0, 0, 0); tx.enableWordWrapping = !single;
        var inp = ir.gameObject.AddComponent<TMP_InputField>();
        inp.textViewport = area; inp.textComponent = tx; inp.placeholder = ph; inp.richText = false;
        if (gameFont != null) inp.fontAsset = gameFont;
        inp.pointSize = 21; inp.caretColor = gold; inp.customCaretColor = true; inp.caretWidth = 2; inp.selectionColor = Alpha(cBlue, 0.4f);
        inp.lineType = single ? TMP_InputField.LineType.SingleLine : TMP_InputField.LineType.MultiLineNewline;
        inp.targetGraphic = im;
        ir.gameObject.SetActive(true);
        inp.text = typed;
        inp.onValueChanged.AddListener(new TextRelay(delegate(string s) { typed = s; }).Invoke);
        answerInput = inp; return inp;
    }

    // ---------- 圖片 ----------
    void CanvasMarkdownImages(string text) { foreach (Match m in Regex.Matches(text ?? "", @"!\[[^\]]*\]\(([^)]+)\)")) CanvasImage(m.Groups[1].Value, null, 0); }
    void CanvasImages(JToken a, JToken marks) { var xs = a as JArray; if (xs != null) for (int i = 0; i < xs.Count; i++) CanvasImage((string)xs[i], i == 0 ? marks : null, 0); }
    void CanvasImage(string path, JToken marks, float maxH)
    {
        try
        {
            Texture2D tex;
            if (!images.TryGetValue(path, out tex))
            {
                byte[] bytes = null; var embedded = session["images"] as JObject;
                if (embedded != null && embedded[path] != null) { string data = (string)embedded[path]; bytes = Convert.FromBase64String(data.Substring(data.IndexOf(',') + 1)); }
                else { string full = Path.GetFullPath(Path.Combine(Root, path)); if (full.StartsWith(Root + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) && File.Exists(full)) bytes = File.ReadAllBytes(full); }
                if (bytes == null) { Txt(quizBody, "圖片未載入：請回營地重新套用。", 18, gold, false); return; }
                tex = new Texture2D(2, 2); if (!ImageConversion.LoadImage(tex, bytes)) { UnityEngine.Object.Destroy(tex); Txt(quizBody, "圖片需要重新套用：" + path, 18, gold, false); return; } images[path] = tex;
            }
            string qt = question == null ? "" : S(question, "type");
            if (maxH <= 0) maxH = !graded && (qt == "fill" || qt == "open") ? 280 : 400;
            var r = RectUI("QuizImage", quizBody); float width = Mathf.Min(1060, tex.width), height = width * tex.height / tex.width;
            if (height > maxH) { width *= maxH / height; height = maxH; }
            LE(r, -1, -1, height, -1).preferredHeight = height;
            var frame = RectUI("Frame", r); frame.anchorMin = frame.anchorMax = frame.pivot = new Vector2(0.5f, 0.5f); frame.sizeDelta = new Vector2(width + 8, height + 8); var fim = Fill(frame, cLine); fim.raycastTarget = false;
            var photo = RectUI("Photo", r); photo.anchorMin = photo.anchorMax = photo.pivot = new Vector2(0.5f, 0.5f); photo.sizeDelta = new Vector2(width, height);
            var raw = photo.gameObject.AddComponent<RawImage>(); raw.texture = tex; raw.raycastTarget = false;
            var ms = marks as JArray; if (ms != null) foreach (var mark in ms)
            {
                var dot = RectUI("Mark", photo); dot.anchorMin = dot.anchorMax = new Vector2((float)mark["x"] / 100, 1 - (float)mark["y"] / 100); dot.sizeDelta = new Vector2(32, 32);
                var dim_ = Fill(dot, Hex("#1c6b40")); Border(dim_, cLine, 2);
                var mt = Txt(dot, S(mark, "label"), 18, Color.white, false); mt.alignment = TextAlignmentOptions.Center; Stretch(mt.rectTransform, 0, 0, 0, 0);
            }
        }
        catch (Exception e) { Logger.LogError(e); Txt(quizBody, "圖片讀取失敗：" + path, 18, gold, false); }
    }
}

static class LayoutElementExt { public static LayoutElement maxWidth(this LayoutElement le, float w) { le.preferredWidth = w; return le; } }

// 題目面板自己的每幀更新：出題時原版會停掉彈珠的更新，鍵盤與點擊判斷不能掛在彈珠上
public class QuizDriver : MonoBehaviour
{
    void Update() { var q = QuizPlugin.Instance; if (!ReferenceEquals(q, null)) q.FrameUpdate(); }
}
