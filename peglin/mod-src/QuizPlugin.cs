using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using BepInEx;
using HarmonyLib;
using Newtonsoft.Json.Linq;
using UnityEngine;
using UnityEngine.EventSystems;
using Battle;
using Peglin.Achievements;

// 流程：瞄準前出題 → 作答與詳解 → 回到彈珠盤自己發射。
// 注意：本檔以 .NET Framework 內建 csc（C# 5）編譯，不可用字串插值、?.、out var 等新語法。
[BepInPlugin("local.peglin.quiz", "彈珠刷題", "1.2.0")]
[BepInProcess("Peglin.exe")]
public partial class QuizPlugin : BaseUnityPlugin
{
    public static QuizPlugin Instance;
    public static readonly string Root = Path.GetFullPath(Path.Combine(Paths.GameRootPath, ".."));
    static string SaveDir { get { return Path.Combine(Root, "saves"); } }
    // 作答紀錄位置：peglin-link.json 的 dataDir（連結到題庫框架資料夾），沒有設定就放 saves/
    static string answersFile;
    static string AnswersFile
    {
        get
        {
            if (answersFile != null) return answersFile;
            string dir = SaveDir;
            try
            {
                string f = Path.Combine(Root, "peglin-link.json");
                if (File.Exists(f)) { string d = S(JObject.Parse(File.ReadAllText(f, Encoding.UTF8)), "dataDir"); if (d.Length > 0) { Directory.CreateDirectory(d); dir = d; } }
            }
            catch (Exception) { }
            return answersFile = Path.Combine(dir, "answers.jsonl");
        }
    }
    JObject session, question;
    JArray questions;
    DateTime loadedAt;
    // order：這一輪還沒出的題目索引（答錯的題會插回前面幾題後再出一次）
    List<int> order = new List<int>();
    int qIndex = -1, lap = 1, answered, correct, streak, best, permitBall, currentBall, keyFrame;
    bool showing, graded, revealed, resultOk, keysBroken, hinted;
    // 彈珠學習：每課第一次作答的答對數（課末寫入「完成本課」紀錄）
    Dictionary<string, int[]> lessonStats = new Dictionary<string, int[]>();
    float previousScale = 1, nextCheck, gradedAt, resumeUntil;
    float shotMultiplier = 1;
    string typed = "", notice = "", pickedText = "", rewardText = "";
    HashSet<string> picked = new HashSet<string>();
    Font font;
    Dictionary<string, Texture2D> images = new Dictionary<string, Texture2D>();
    bool tickLogged;

    void Awake()
    {
        Instance = this; Directory.CreateDirectory(SaveDir);
        UnityEngine.Object.DontDestroyOnLoad(transform.root.gameObject);
        AchievementManager.AchievementsOn = false;
        SaveManager.SaveFileCorruptionDetector.Instance.CloudSavesDisabled = true;
        new Harmony("local.peglin.quiz").PatchAll(typeof(QuizPlugin).Assembly);
        font = Font.CreateDynamicFontFromOSFont(new[] { "Microsoft JhengHei", "Microsoft YaHei", "Segoe UI Symbol", "Arial" }, 22);
        ReloadSession();
        Logger.LogInfo("QUIZ_READY root=" + Root + " questions=" + (questions == null ? 0 : questions.Count));
        if (Array.IndexOf(Environment.GetCommandLineArgs(), "--quiz-selftest") >= 0) StartCoroutine(SelfTest());
    }

    // ---------- 題本與進度 ----------
    void ReloadSession()
    {
        string f = Path.Combine(SaveDir, "session.json"); if (!File.Exists(f)) { notice = "請先在刷題營地選擇題本並套用"; return; }
        try
        {
            DateTime t = File.GetLastWriteTimeUtc(f); if (session != null && t == loadedAt) return;
            var s = JObject.Parse(File.ReadAllText(f, Encoding.UTF8)); var qs = s["questions"] as JArray;
            if (qs == null || qs.Count == 0) throw new Exception("題本內沒有題目");
            session = s; questions = qs; loadedAt = t; qIndex = -1;
            foreach (var im in images.Values) UnityEngine.Object.Destroy(im); images.Clear();
            if (!LoadProgress()) { order.Clear(); lap = 1; answered = correct = streak = best = 0; lessonStats.Clear(); }
            notice = "題本已套用：" + S(s, "label") + "（" + qs.Count + " 題）";
            Logger.LogInfo("QUIZ_SESSION " + S(s, "id") + " count=" + qs.Count + " answered=" + answered);
        }
        catch (Exception e) { Logger.LogError(e); notice = "題本載入失敗：" + e.Message; }
    }
    bool LoadProgress()
    {
        try
        {
            string f = Path.Combine(SaveDir, "progress.json"); if (!File.Exists(f)) return false;
            var p = JObject.Parse(File.ReadAllText(f, Encoding.UTF8));
            if (S(p, "session") != S(session, "id")) return false;
            order.Clear();
            var o = p["order"] as JArray; if (o != null) foreach (var x in o) { int i = (int)x; if (i >= 0 && i < questions.Count) order.Add(i); }
            lap = N(p, "lap", 1); answered = N(p, "answered", 0); correct = N(p, "correct", 0); streak = N(p, "streak", 0); best = N(p, "best", 0);
            lessonStats.Clear(); var ls = p["lessons"] as JObject; if (ls != null) foreach (var kv in ls) lessonStats[kv.Key] = new[] { N(kv.Value, "n", 0), N(kv.Value, "ok", 0), N(kv.Value, "done", 0) };
            return true;
        }
        catch (Exception e) { Logger.LogWarning("進度檔無法讀取，從頭開始：" + e.Message); return false; }
    }
    void SaveProgress()
    {
        try
        {
            var p = new JObject { {"session", S(session, "id")}, {"order", new JArray(order.ToArray())}, {"lap", lap}, {"answered", answered}, {"correct", correct}, {"streak", streak}, {"best", best}, {"at", DateTime.UtcNow.ToString("o")} };
            var ls = new JObject(); foreach (var kv in lessonStats) ls[kv.Key] = new JObject { {"n", kv.Value[0]}, {"ok", kv.Value[1]}, {"done", kv.Value[2]} };
            p["lessons"] = ls;
            string f = Path.Combine(SaveDir, "progress.json");
            File.WriteAllText(f + ".tmp", p.ToString(Newtonsoft.Json.Formatting.None), new UTF8Encoding(false));
            if (File.Exists(f)) File.Delete(f); File.Move(f + ".tmp", f);
        }
        catch (Exception e) { Logger.LogWarning("進度檔寫入失敗：" + e.Message); }
    }
    int NextIndex()
    {
        if (order.Count == 0)
        {
            if (answered > 0) lap++;
            // 彈珠學習：第一輪照課程順序讀完；之後只複習題目（跳過閱讀卡）
            bool reviewOnly = Learn && lap > 1 && HasQuestionItems();
            for (int i = 0; i < questions.Count; i++) if (!reviewOnly || S(questions[i], "type") != "read") order.Add(i);
            // 第二輪起打散順序（題組保持相鄰），避免背答案位置
            if (lap > 1 && !B(session, "ordered")) ShuffleKeepingGroups();
        }
        return order[0];
    }
    bool HasQuestionItems() { foreach (var q in questions) if (S(q, "type") != "read") return true; return false; }
    bool Learn { get { return S(session, "mode") == "learn"; } }
    bool IsRead { get { return question != null && S(question, "type") == "read"; } }
    void AppendRow(JObject row)
    {
        try { lock (typeof(QuizPlugin)) File.AppendAllText(AnswersFile, row.ToString(Newtonsoft.Json.Formatting.None) + "\n", new UTF8Encoding(false)); }
        catch (Exception e) { Logger.LogError(e); notice = "作答紀錄寫入失敗，請查看 player.log"; }
    }
    // 課程最後一步結束時寫一筆「完成本課」，營地同步後標記課程完成、給星等
    void FinishLessonIfEnd()
    {
        if (question == null || !B(question, "lessonEnd")) return;
        string key = S(question, "pack") + "/" + S(question, "lesson"); int[] st;
        if (!lessonStats.TryGetValue(key, out st)) st = lessonStats[key] = new int[3];
        if (st[2] > 0) return; st[2] = 1;
        AppendRow(new JObject { {"eventId", Guid.NewGuid().ToString("N")}, {"session", S(session, "id")}, {"kind", "lesson"}, {"pack", S(question, "pack")}, {"lesson", S(question, "lesson")}, {"n", st[0]}, {"ok", st[1]}, {"test", B(session, "test")}, {"at", DateTime.UtcNow.ToString("o")} });
        string done = "本課完成！第一次就答對 " + st[1] + " / " + st[0] + " 題";
        rewardText = rewardText.Length > 0 ? rewardText + "\n" + done : done;
        hudFlash = "彈珠學習　" + done + "　·　回營地可選下一課"; hudFlashUntil = Time.unscaledTime + 10; Logger.LogInfo("QUIZ_LESSON_DONE " + key + " " + st[1] + "/" + st[0]);
    }
    void ShuffleKeepingGroups()
    {
        var units = new List<List<int>>(); var byGroup = new Dictionary<string, List<int>>();
        foreach (int i in order)
        {
            string g = S(questions[i], "group");
            if (g.Length == 0) { units.Add(new List<int> { i }); continue; }
            List<int> u; if (!byGroup.TryGetValue(g, out u)) { u = new List<int>(); byGroup[g] = u; units.Add(u); }
            u.Add(i);
        }
        var rnd = new System.Random();
        for (int i = units.Count - 1; i > 0; i--) { int j = rnd.Next(i + 1); var t = units[i]; units[i] = units[j]; units[j] = t; }
        order.Clear(); foreach (var u in units) order.AddRange(u);
    }

    // ---------- JSON 小工具 ----------
    static string S(JToken o, string key) { return o == null || o.Type != JTokenType.Object || o[key] == null || o[key].Type == JTokenType.Null ? "" : (string)o[key]; }
    static int N(JToken o, string key, int fallback) { try { return o == null || o[key] == null || o[key].Type == JTokenType.Null ? fallback : (int)o[key]; } catch { return fallback; } }
    static bool B(JToken o, string key) { return o != null && o[key] != null && o[key].Type == JTokenType.Boolean && (bool)o[key]; }
    string Reward { get { string r = S(session, "reward"); return r == "off" || r == "strong" ? r : "normal"; } }
    int Penalty { get { return Math.Max(0, Math.Min(10, N(session, "wrongPenalty", 5))); } }
    bool RetryWrong { get { return session == null || session["retryWrong"] == null || B(session, "retryWrong"); } }
    // 連對越多，下一球傷害倍率越高（封頂 5 連對）
    float Multiplier(int s)
    {
        if (s <= 0 || Reward == "off") return 1f;
        int k = Math.Min(s, 5) - 1;
        return Reward == "strong" ? 1.3f + 0.1f * k : 1.2f + 0.05f * k;
    }
    int HealFor(int s) { return s > 0 && s % 5 == 0 && Reward != "off" ? (Reward == "strong" ? 10 : 5) : 0; }

    // ---------- 戰鬥掛勾 ----------
    public static bool NeedsQuiz(PachinkoBall ball, bool notifyFire)
    {
        return !ReferenceEquals(Instance, null) && notifyFire && !ball.IsDummy && BattleController.BattleActive && BattleController.CurrentBattleState == BattleController.BattleState.AWAITING_SHOT;
    }
    public void Tick()
    {
        if (!tickLogged) { tickLogged = true; Logger.LogInfo("QUIZ_TICK_ACTIVE"); }
        AchievementManager.AchievementsOn = false;
        if (Time.unscaledTime < nextCheck) return; nextCheck = Time.unscaledTime + 0.3f;
        if (showing && !BattleController.BattleActive) { CloseQuiz(); Logger.LogInfo("QUIZ_ABORT battle ended"); }
        if (!showing) ReloadSession();
        UpdateHud();
        if (!showing && questions != null && BattleController.BattleActive && BattleController.CurrentBattleState == BattleController.BattleState.AWAITING_SHOT && !PauseMenu.Paused)
        {
            foreach (var ball in UnityEngine.Object.FindObjectsOfType<PachinkoBall>())
                if (!ball.IsDummy && ball.IsAiming() && ball.GetInstanceID() != permitBall) { OpenQuiz(ball); break; }
        }
    }
    void OpenQuiz(PachinkoBall ball)
    {
        if (showing) return;
        currentBall = ball.GetInstanceID(); showing = true; openedAt = Time.unscaledTime; graded = revealed = false; resultOk = false; rewardText = "";
        shotMultiplier = 1;
        if (questions != null) { qIndex = NextIndex(); question = (JObject)questions[qIndex]; } else question = null;
        typed = pickedText = ""; picked.Clear(); hinted = false;
        // 閱讀卡不用作答：直接可以「讀完了，回到彈珠盤」
        if (IsRead) { graded = true; resultOk = true; gradedAt = Time.unscaledTime; }
        previousScale = Time.timeScale > 0 ? Time.timeScale : 1; Time.timeScale = 0;
        Logger.LogInfo("QUIZ_OPEN ball=" + currentBall + " q=" + S(question, "id"));
        RefreshCanvas();
    }
    void CloseQuiz()
    {
        showing = false; Time.timeScale = previousScale;
        if (quizCanvas != null) quizCanvas.SetActive(false);
        resumeUntil = Time.unscaledTime + 0.3f;
        foreach (var ball in UnityEngine.Object.FindObjectsOfType<PachinkoBall>()) ClearBallInput(ball);
    }
    static void ClearBallInput(PachinkoBall ball)
    {
        // 清掉面板開著時原版暫存的點擊／確認，避免一關面板就直接射出
        Traverse.Create(ball).Field("_mouseDownOnPlayfield").SetValue(false);
        Traverse.Create(ball).Field("_fireButtonPressed").SetValue(false);
    }
    float openedAt;
    void Continue(string via)
    {
        if (!graded) return;
        // 面板剛出現或剛批改的一瞬間不接受「繼續」：避免上一個畫面殘留的點擊／確認直接把新卡片關掉
        if (Time.unscaledTime - Math.Max(gradedAt, openedAt) < 0.4f) { Logger.LogInfo("QUIZ_CONTINUE_IGNORED via=" + via); return; }
        Logger.LogInfo("QUIZ_CONTINUE via=" + via);
        permitBall = currentBall; CloseQuiz();
        if (IsRead)
        {
            if (order.Count > 0 && order[0] == qIndex) order.RemoveAt(0);
            FinishLessonIfEnd(); SaveProgress();
            question = null; Logger.LogInfo("QUIZ_READ_DONE ball=" + permitBall); UpdateHud(); return;
        }
        try
        {
            var hp = UnityEngine.Object.FindObjectOfType<PlayerHealthController>();
            if (resultOk)
            {
                // 倍率等到這一球真的發射才套用；丟棄彈珠不會把獎勵疊到下一球。
                shotMultiplier = Multiplier(streak);
                int heal = HealFor(streak); if (hp != null && heal > 0) hp.Heal(heal);
            }
            else if (hp != null && Penalty > 0)
            {
                // 答錯扣血但不致死：刷題是練習，不該因一題直接結束整局
                float dmg = Math.Min(Penalty, hp.CurrentHealth - 1);
                if (dmg > 0) hp.DealUnblockableDamage(dmg);
            }
        }
        catch (Exception e) { Logger.LogError(e); }
        question = null; Logger.LogInfo("QUIZ_PERMIT ball=" + permitBall + " streak=" + streak);
        UpdateHud();
    }
    void Grade(bool ok, string mine, bool self)
    {
        if (graded || question == null) return;
        // 學習檢核題：第一次答錯先給提示、再試一次
        if (!ok && !self && !hinted && S(question, "hint").Length > 0)
        {
            hinted = true; picked.Clear(); notice = "";
            Logger.LogInfo("QUIZ_HINT q=" + S(question, "id")); RefreshCanvas(); return;
        }
        graded = true; gradedAt = Time.unscaledTime; resultOk = ok; pickedText = mine; answered++;
        if (order.Count > 0 && order[0] == qIndex) order.RemoveAt(0);
        if (ok) { correct++; streak++; if (streak > best) best = streak; }
        else
        {
            streak = 0;
            if (RetryWrong && questions.Count > 1) { int at = Math.Min(3, order.Count); order.Remove(qIndex); order.Insert(at, qIndex); }
        }
        if (ok)
        {
            float m = Multiplier(streak); int heal = HealFor(streak);
            rewardText = "連對 " + streak + (m > 1f ? "　→　這一球傷害 ×" + m.ToString("0.00", CultureInfo.InvariantCulture) : "") + (heal > 0 ? "　＋回復 " + heal + " HP" : "");
        }
        else rewardText = (Penalty > 0 ? "回到彈珠盤時扣 " + Penalty + " HP（不會致死）" : "練習模式：不扣血") + (RetryWrong && questions.Count > 1 ? "　·　這題稍後會再出一次" : "");
        var row = new JObject { {"eventId", Guid.NewGuid().ToString("N")}, {"session", S(session, "id")}, {"qid", S(question, "id")}, {"ok", ok}, {"picked", mine}, {"self", self}, {"streak", streak}, {"test", B(session, "test")}, {"at", DateTime.UtcNow.ToString("o")} };
        if (Learn)
        {
            row["mode"] = "learn"; row["pack"] = S(question, "pack"); row["lesson"] = S(question, "lesson"); row["first"] = ok && !hinted;
            if (S(question, "checkId").Length > 0) { row["kind"] = "check"; row["checkId"] = S(question, "checkId"); }
            if (lap == 1)
            {
                string key = S(question, "pack") + "/" + S(question, "lesson"); int[] st;
                if (!lessonStats.TryGetValue(key, out st)) st = lessonStats[key] = new int[3];
                st[0]++; if (ok && !hinted) st[1]++;
            }
        }
        AppendRow(row);
        if (Learn && lap == 1) FinishLessonIfEnd();
        SaveProgress();
        Logger.LogInfo("QUIZ_GRADE q=" + S(question, "id") + " ok=" + ok + " streak=" + streak);
        RefreshCanvas();
    }
    string OptionLabel(int i) { return S(question, "labels") == "num" ? (i + 1).ToString() : ((char)('A' + i)).ToString(); }
    void Pick(int i)
    {
        if (graded || question == null) return;
        string type = S(question, "type"), label = OptionLabel(i);
        if (type == "single") { picked.Clear(); picked.Add(label); GradeSelected(); }
        else if (type == "multi") { if (!picked.Add(label)) picked.Remove(label); RefreshCanvas(); }
    }
    void GradeSelected()
    {
        if (picked.Count == 0) { notice = "請先選擇答案"; return; }
        var list = new List<string>(picked); list.Sort(); string answer = string.Concat(list.ToArray());
        Grade(answer == S(question, "key"), answer, false);
    }
    void SubmitFill()
    {
        if (answerInput != null) typed = answerInput.text;
        if (graded) return;
        if (typed.Trim().Length == 0) { notice = "請先輸入答案"; return; }
        bool ok = false; foreach (var a in (JArray)question["accept"]) if (SameAnswer(typed, (string)a)) ok = true;
        Grade(ok, typed, false);
    }
    bool driverLogged;
    public void FrameUpdate()
    {
        if (!driverLogged) { driverLogged = true; Logger.LogInfo("QUIZ_DRIVER_ACTIVE controllerAlive=" + (this != null)); }
        if (showing)
        {
            // 在快捷鍵批改前直接讀輸入框，避免依賴跨場景 UnityEvent 的呼叫順序。
            if (answerInput != null && !graded) typed = answerInput.text;
            Keys();
        }
    }
    // 鍵盤：1–9／A–I 選答案，Enter 送出多選／填答或「回到彈珠盤」
    void Keys()
    {
        if (keysBroken || keyFrame == Time.frameCount) return; keyFrame = Time.frameCount;
        try
        {
            bool enter = (Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.KeypadEnter)) && Input.compositionString.Length == 0;
            // 保險：直接判斷滑鼠是否點在「回到彈珠盤」按鈕上（不依賴原版的 EventSystem 輸入模組）
            bool clickContinue = false;
            if (Input.GetMouseButtonUp(0))
            {
                clickContinue = continueRect != null && RectTransformUtility.RectangleContainsScreenPoint(continueRect, Input.mousePosition, null);
            }
            if (graded) { if (enter || clickContinue || Input.GetKeyDown(KeyCode.Space)) Continue(enter ? "enter" : clickContinue ? "click" : "space"); return; }
            if (question == null) return;
            string type = S(question, "type");
            if (type == "single" || type == "multi")
            {
                int opts = Math.Min(9, N(question, "opts", 2));
                for (int i = 0; i < opts; i++)
                    if (Input.GetKeyDown((KeyCode)((int)KeyCode.Alpha1 + i)) || Input.GetKeyDown((KeyCode)((int)KeyCode.Keypad1 + i)) || Input.GetKeyDown((KeyCode)((int)KeyCode.A + i))) { Pick(i); return; }
                if (type == "multi" && enter) GradeSelected();
            }
            else if (type == "fill" && question["accept"] is JArray && enter) SubmitFill();
        }
        catch (Exception e) { keysBroken = true; Logger.LogWarning("鍵盤快捷鍵停用：" + e.Message); }
    }

    int pointerLogs;
    void LogPointerHits()
    {
        if (pointerLogs >= 3 || EventSystem.current == null) return; pointerLogs++;
        var data = new PointerEventData(EventSystem.current) { position = Input.mousePosition };
        var hits = new List<RaycastResult>(); EventSystem.current.RaycastAll(data, hits);
        var names = new List<string>(); for (int i = 0; i < hits.Count && i < 4; i++) names.Add(hits[i].gameObject.name + "@" + hits[i].sortingOrder);
        Logger.LogInfo("QUIZ_POINTER " + Input.mousePosition + " module=" + (EventSystem.current.currentInputModule == null ? "none" : EventSystem.current.currentInputModule.GetType().Name) + " hits=" + string.Join(",", names.ToArray()));
    }
    // ---------- 填答比對 ----------
    public static string Normalize(string text)
    {
        var b = new StringBuilder(); string sup = "⁰¹²³⁴⁵⁶⁷⁸⁹", sub = "₀₁₂₃₄₅₆₇₈₉";
        foreach (char raw in text ?? "")
        {
            char ch = raw; if (ch >= '！' && ch <= '～') ch = (char)(ch - 0xfee0);
            int i = sup.IndexOf(ch); if (i < 0) i = sub.IndexOf(ch); if (i >= 0) ch = (char)('0' + i);
            if (!char.IsWhiteSpace(ch)) b.Append(char.ToLowerInvariant(ch));
        }
        return Regex.Replace(b.ToString(), "[，,。．.]$", "");
    }
    static string Loose(string s) { return Regex.Replace(Normalize(s), "[/／,、;:()\\[\\]{}\\-_|·・'’‘\"“”`]", "").Replace("頷", "頜").Replace("顎", "腭"); }
    static double? Number(string s)
    {
        var m = Regex.Match(s, @"^(-?\d+(?:\.\d+)?)(?:/(-?\d+(?:\.\d+)?))?$"); if (!m.Success) return null;
        double x, y; if (!double.TryParse(m.Groups[1].Value, NumberStyles.Float, CultureInfo.InvariantCulture, out x)) return null;
        if (!m.Groups[2].Success) return x;
        if (!double.TryParse(m.Groups[2].Value, NumberStyles.Float, CultureInfo.InvariantCulture, out y) || y == 0) return null;
        return x / y;
    }
    public static bool SameAnswer(string a, string b)
    {
        string na = Normalize(a), nb = Normalize(b); if (na == nb) return true;
        double? x = Number(na), y = Number(nb); if (x.HasValue && y.HasValue && Math.Abs(x.Value - y.Value) < 1e-9) return true;
        if (Regex.IsMatch(b ?? "", "[㐀-鿿]") && Regex.IsMatch(b ?? "", "[a-zA-Z]"))
        {
            if (Loose(a) == Loose(b)) return true;
            var parts = Regex.Split(b, @"\s*[/／]\s*"); if (parts.Length == 2 && Loose(a) == Loose(parts[1]) + Loose(parts[0])) return true;
        }
        return false;
    }
    // Markdown → 純文字（uGUI Text 不支援 Markdown）
    static string Plain(string s)
    {
        s = Regex.Replace(s ?? "", @"!\[[^\]]*\]\([^)]*\)", "");
        s = Regex.Replace(s, @"\[([^\]]+)\]\([^)]*\)", "$1");
        s = Regex.Replace(s, @"^\s*[-*+]\s+", "• ", RegexOptions.Multiline);
        s = Regex.Replace(s, @"^\s*>\s?", "｜", RegexOptions.Multiline);
        s = Regex.Replace(s, @"^\s*\|?\s*:?-{3,}.*$\n?", "", RegexOptions.Multiline);
        s = Regex.Replace(s, @"^\|(.*)\|\s*$", m => m.Groups[1].Value.Replace("|", "　│　"), RegexOptions.Multiline);
        s = Regex.Replace(s, @"\*\*|__|`|^#{1,6}\s*", "", RegexOptions.Multiline);
        return Regex.Replace(s, @"\n{3,}", "\n\n").Trim();
    }

    IEnumerator SelfTest()
    {
        yield return new WaitForSecondsRealtime(12);
        var report = new JObject { {"ready", true}, {"questions", questions == null ? 0 : questions.Count}, {"numeric", SameAnswer("０．５", "1/2")}, {"bilingual", SameAnswer("frontal bone / 額骨", "額骨 / frontal bone")}, {"multiplier5", Multiplier(5)}, {"plain", Plain("- **甲**\n> 乙\n|a|b|\n|---|---|\n|1|2|")}, {"saveRoot", ToolBox.Serialization.DataSerializer.GetFilePath(0, ToolBox.Serialization.DataSerializer.SaveType.BASE)} };
        File.WriteAllText(Path.Combine(Root, "測試紀錄", "native-selftest.json"), report.ToString());
        Logger.LogInfo("QUIZ_SELFTEST " + report.ToString(Newtonsoft.Json.Formatting.None));
    }

    [HarmonyPatch(typeof(PachinkoBall), "Fire")]
    class FireGate
    {
        static bool Prefix(PachinkoBall __instance, bool notifyFire)
        {
            if (!NeedsQuiz(__instance, notifyFire) || Instance.questions == null) return true;
            if (Instance.showing) return false;
            if (__instance.GetInstanceID() == Instance.permitBall) return true;
            Instance.OpenQuiz(__instance); return false;
        }
        static void Postfix(PachinkoBall __instance)
        {
            if (!ReferenceEquals(Instance, null) && __instance.IsFiring() && __instance.GetInstanceID() == Instance.permitBall)
            {
                var bc = UnityEngine.Object.FindObjectOfType<BattleController>();
                if (bc != null && Instance.shotMultiplier > 1f) bc.AddDamageMultiplier(Instance.shotMultiplier);
                Instance.Logger.LogInfo("QUIZ_SHOT_CONSUMED multiplier=" + Instance.shotMultiplier.ToString("0.00", CultureInfo.InvariantCulture));
                Instance.shotMultiplier = 1; Instance.permitBall = 0;
            }
        }
    }
    [HarmonyPatch(typeof(PachinkoBall), "DoLateUpdate")]
    class InputGate
    {
        static bool Prefix(PachinkoBall __instance)
        {
            var q = Instance; if (ReferenceEquals(q, null)) return true;
            q.Tick();
            if (q.showing) { q.Keys(); return false; }
            // 關閉面板後的短暫緩衝：吃掉「回到彈珠盤」那一下點擊／Enter
            if (Time.unscaledTime < q.resumeUntil) { ClearBallInput(__instance); return false; }
            return true;
        }
    }
    // 出題時讓原版以為有視窗開著：背包（I）、地圖（M）、暫停（Esc）等快捷鍵與點擊都不會穿透到遊戲
    [HarmonyPatch(typeof(PeglinUI.GameBlockingWindow), "windowOpen", MethodType.Getter)]
    class BlockWindow { static void Postfix(ref bool __result) { if (!ReferenceEquals(Instance, null) && Instance.showing) __result = true; } }
    [HarmonyPatch(typeof(PeglinUI.GameBlockingWindow), "wasOpenThisFrame", MethodType.Getter)]
    class BlockWindowFrame { static void Postfix(ref bool __result) { if (!ReferenceEquals(Instance, null) && (Instance.showing || Time.unscaledTime < Instance.resumeUntil)) __result = true; } }
    [HarmonyPatch(typeof(PeglinUI.LoadoutManager.LoadoutManager), "SetupDataForNewGame")]
    class NoAchievements { static void Postfix() { AchievementManager.AchievementsOn = false; } }
}
