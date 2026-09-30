using System;
using System.IO;
using System.Net;
using System.Text;
using System.Diagnostics;
using System.Threading;
using System.Collections;
using System.Collections.Generic;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using System.Drawing;
using Microsoft.Win32;

// 本機啟動器：只在這台電腦的 127.0.0.1 提供服務。
// - 網頁（TEST 1 資料夾、localhost、或自己的 GitHub Page）呼叫 /api/* 套用題本、啟動 PeglinQuiz 裡的遊戲本體。
// - 靜態檔案從 peglin-link.json 的 webRoot（題庫框架資料夾）提供；作答紀錄與備份寫到 dataDir。
// - 只接受 allowOrigins 內的網頁跨來源呼叫；別台電腦沒有這個服務，所以彈珠模式在別人那裡無法使用。
class QuizBridge
{
    const string Version = "1.2.0";
    static string Root = AppDomain.CurrentDomain.BaseDirectory;
    const string BaseUrl = "http://127.0.0.1:18769/";
    static string WebRoot, DataDir;
    static List<string> Origins = new List<string>();
    static JavaScriptSerializer Json = new JavaScriptSerializer { MaxJsonLength = int.MaxValue };
    static HttpListener listener;
    static readonly object SessionLock = new object(), LaunchLock = new object(), FileLock = new object();
    static Process game;
    const string RunKey = @"Software\Microsoft\Windows\CurrentVersion\Run", RunName = "PeglinQuizCamp";

    [STAThread] static void Main(string[] args)
    {
        try
        {
            LoadLink();
            listener = new HttpListener(); listener.Prefixes.Add(BaseUrl);
            try { listener.Start(); } catch (HttpListenerException) { if (Array.IndexOf(args, "--no-browser") < 0) OpenBrowser(); return; }
            if (Array.IndexOf(args, "--no-browser") < 0) OpenBrowser();
            var worker = new Thread(delegate()
            {
                try { while (listener.IsListening) { var context = listener.GetContext(); ThreadPool.QueueUserWorkItem(delegate { Handle(context); }); } }
                catch (HttpListenerException) { }
                catch (ObjectDisposedException) { }
            });
            worker.IsBackground = true; worker.Start();
            using (var tray = new NotifyIcon { Icon = SystemIcons.Application, Text = "彈珠刷題營地（本機服務）", Visible = true })
            using (var menu = new ContextMenuStrip())
            {
                menu.Items.Add("開啟刷題營地", null, delegate { OpenBrowser(); });
                var auto = new ToolStripMenuItem("開機時自動啟動（背景）") { Checked = AutoStart() };
                auto.Click += delegate { SetAutoStart(!auto.Checked); auto.Checked = AutoStart(); };
                menu.Items.Add(auto);
                menu.Items.Add("開啟紀錄資料夾", null, delegate { Process.Start(new ProcessStartInfo(DataDir) { UseShellExecute = true }); });
                menu.Items.Add("結束營地服務", null, delegate { listener.Stop(); Application.ExitThread(); });
                tray.ContextMenuStrip = menu; tray.DoubleClick += delegate { OpenBrowser(); };
                Application.Run(); tray.Visible = false;
            }
        }
        catch (Exception e) { MessageBox.Show(e.Message, "彈珠刷題啟動失敗"); }
    }

    // ---------- 連結設定 ----------
    static void LoadLink()
    {
        WebRoot = Root; DataDir = Path.Combine(Root, "saves");
        Origins = new List<string> { BaseUrl.TrimEnd('/'), "null", "http://localhost:*", "http://127.0.0.1:*" };
        string f = Path.Combine(Root, "peglin-link.json");
        if (File.Exists(f))
        {
            var o = Json.Deserialize<Dictionary<string, object>>(File.ReadAllText(f, Encoding.UTF8));
            object v;
            if (o.TryGetValue("webRoot", out v) && v is string && Directory.Exists((string)v)) WebRoot = (string)v;
            if (o.TryGetValue("dataDir", out v) && v is string && ((string)v).Length > 0) DataDir = (string)v;
            if (o.TryGetValue("allowOrigins", out v) && v is IList) foreach (var x in (IList)v) if (x is string) Origins.Add(((string)x).TrimEnd('/'));
        }
        WebRoot = Path.GetFullPath(WebRoot).TrimEnd('\\') + "\\";
        Directory.CreateDirectory(DataDir); Directory.CreateDirectory(Path.Combine(Root, "saves"));
        // 舊版把作答紀錄放在 saves/：第一次連結時搬過去（保留原檔）
        string oldAnswers = Path.Combine(Root, "saves", "answers.jsonl"), newAnswers = Path.Combine(DataDir, "answers.jsonl");
        if (!File.Exists(newAnswers) && File.Exists(oldAnswers) && !PathEq(oldAnswers, newAnswers)) File.Copy(oldAnswers, newAnswers);
    }
    static bool PathEq(string a, string b) { return string.Equals(Path.GetFullPath(a), Path.GetFullPath(b), StringComparison.OrdinalIgnoreCase); }
    static bool Allowed(string origin)
    {
        if (origin == null) return true; // 同源 GET、非瀏覽器
        foreach (var o in Origins)
        {
            if (o.EndsWith(":*")) { string head = o.Substring(0, o.Length - 2); if (origin == head || origin.StartsWith(head + ":")) return true; }
            else if (string.Equals(o, origin, StringComparison.OrdinalIgnoreCase)) return true;
        }
        return false;
    }
    static bool AutoStart() { using (var k = Registry.CurrentUser.OpenSubKey(RunKey)) return k != null && k.GetValue(RunName) != null; }
    static void SetAutoStart(bool on)
    {
        using (var k = Registry.CurrentUser.CreateSubKey(RunKey))
        {
            if (on) k.SetValue(RunName, "\"" + Application.ExecutablePath + "\" --no-browser");
            else if (k.GetValue(RunName) != null) k.DeleteValue(RunName);
        }
    }
    static void OpenBrowser() { Process.Start(new ProcessStartInfo(BaseUrl + "index.html#peglin") { UseShellExecute = true }); }

    // ---------- HTTP ----------
    static void Send(HttpListenerContext c, int status, string type, byte[] bytes)
    {
        c.Response.StatusCode = status; c.Response.ContentType = type;
        c.Response.Headers["Cache-Control"] = "no-store";
        c.Response.Headers["X-Content-Type-Options"] = "nosniff";
        c.Response.ContentLength64 = bytes.Length;
        try { c.Response.OutputStream.Write(bytes, 0, bytes.Length); } finally { c.Response.Close(); }
    }
    static void Reply(HttpListenerContext c, object data) { Send(c, 200, "application/json; charset=utf-8", Encoding.UTF8.GetBytes(Json.Serialize(data))); }
    static string Body(HttpListenerContext c) { using (var r = new StreamReader(c.Request.InputStream, Encoding.UTF8)) return r.ReadToEnd(); }
    static void WriteAtomic(string f, string text)
    {
        File.WriteAllText(f + ".tmp", text, new UTF8Encoding(false));
        if (File.Exists(f)) File.Replace(f + ".tmp", f, null); else File.Move(f + ".tmp", f);
    }
    static string SafeName(string s) { var b = new StringBuilder(); foreach (char ch in s ?? "") b.Append(char.IsLetterOrDigit(ch) || ch == '-' || ch == '_' ? ch : '_'); return b.Length == 0 ? "project" : b.ToString(); }
    static string WebFile(string rel)
    {
        string full = Path.GetFullPath(Path.Combine(WebRoot, rel.Replace('/', Path.DirectorySeparatorChar)));
        return full.StartsWith(WebRoot, StringComparison.OrdinalIgnoreCase) ? full : null;
    }
    static void Handle(HttpListenerContext c)
    {
        try
        {
            string path = Uri.UnescapeDataString(c.Request.Url.AbsolutePath);
            string origin = c.Request.Headers["Origin"];
            if (path.StartsWith("/api/"))
            {
                if (!Allowed(origin)) { Send(c, 403, "application/json; charset=utf-8", Encoding.UTF8.GetBytes(Json.Serialize(new { error = "這個網頁沒有權限使用本機彈珠刷題服務" }))); return; }
                if (origin != null)
                {
                    c.Response.Headers["Access-Control-Allow-Origin"] = origin;
                    c.Response.Headers["Vary"] = "Origin";
                    c.Response.Headers["Access-Control-Allow-Private-Network"] = "true";
                }
                if (c.Request.HttpMethod == "OPTIONS")
                {
                    c.Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
                    c.Response.Headers["Access-Control-Allow-Headers"] = "Content-Type";
                    c.Response.Headers["Access-Control-Max-Age"] = "600";
                    Send(c, 204, "text/plain", new byte[0]); return;
                }
                Api(c, path); return;
            }
            if (c.Request.HttpMethod != "GET") { Send(c, 405, "text/plain", new byte[0]); return; }
            if (path == "/") path = "/index.html";
            string rel = path.TrimStart('/');
            // 只提供前端與教材檔案；不公開紀錄、存檔、外掛原始碼
            string ext = Path.GetExtension(rel).ToLowerInvariant();
            var mime = new Dictionary<string, string> { {".html","text/html; charset=utf-8"},{".js","application/javascript; charset=utf-8"},{".css","text/css; charset=utf-8"},{".json","application/json; charset=utf-8"},{".png","image/png"},{".jpg","image/jpeg"},{".jpeg","image/jpeg"},{".svg","image/svg+xml"},{".webp","image/webp"},{".gif","image/gif"},{".woff2","font/woff2"},{".ttf","font/ttf"},{".mp3","audio/mpeg"},{".wav","audio/wav"},{".ogg","audio/ogg"},{".pdf","application/pdf"} };
            string full = WebFile(rel), first = rel.Split('/')[0];
            var publicDirs = new HashSet<string>(new[] { "assets", "content", "css", "data", "docs", "img", "js", "資源" }, StringComparer.OrdinalIgnoreCase);
            bool publicPath = path.Equals("/index.html", StringComparison.OrdinalIgnoreCase) || publicDirs.Contains(first);
            if (full == null || !publicPath || !mime.ContainsKey(ext) || !File.Exists(full))
            { Send(c, 404, "text/plain", Encoding.UTF8.GetBytes("找不到檔案")); return; }
            Send(c, 200, mime[ext], File.ReadAllBytes(full));
        }
        catch (Exception e) { try { Send(c, 400, "application/json; charset=utf-8", Encoding.UTF8.GetBytes(Json.Serialize(new { error = e.Message }))); } catch {} }
    }
    static void Api(HttpListenerContext c, string path)
    {
        string answers = Path.Combine(DataDir, "answers.jsonl");
        if (path == "/api/status") { Reply(c, new { ok = true, version = Version, title = "彈珠刷題", root = Root, webRoot = WebRoot, dataDir = DataDir, running = GameRunning(), session = File.Exists(Path.Combine(Root, "saves", "session.json")), game = File.Exists(Path.Combine(Root, "Peglin", "Peglin.exe")) }); return; }
        if (path == "/api/results")
        {
            var rows = new List<object>();
            if (File.Exists(answers)) using (var fs = new FileStream(answers, FileMode.Open, FileAccess.Read, FileShare.ReadWrite)) using (var r = new StreamReader(fs, Encoding.UTF8))
            { string line; while ((line = r.ReadLine()) != null) { try { rows.Add(Json.DeserializeObject(line)); } catch {} } }
            Reply(c, rows); return;
        }
        if (path == "/api/backup" && c.Request.HttpMethod == "GET")
        {
            string f = Path.Combine(DataDir, "learning-backup-" + SafeName(c.Request.QueryString["project"]) + ".json");
            if (!File.Exists(f)) { Reply(c, new { ok = false }); return; }
            Send(c, 200, "application/json; charset=utf-8", File.ReadAllBytes(f)); return;
        }
        if (c.Request.HttpMethod != "POST") throw new InvalidOperationException("此操作需要 POST");
        if (path == "/api/backup")
        {
            string text = Body(c);
            var obj = Json.Deserialize<Dictionary<string, object>>(text);
            if (!obj.ContainsKey("profile") || !obj.ContainsKey("project") || !(obj["project"] is string)) throw new InvalidOperationException("學習存檔格式不符");
            string f = Path.Combine(DataDir, "learning-backup-" + SafeName((string)obj["project"]) + ".json");
            lock (FileLock) WriteAtomic(f, text);
            Reply(c, new { ok = true, path = f }); return;
        }
        if (path == "/api/wrongbook")
        {
            // 人看得懂的錯題本（Markdown），由營地整理後送來
            var obj = Json.Deserialize<Dictionary<string, object>>(Body(c));
            object md, proj; obj.TryGetValue("markdown", out md); obj.TryGetValue("project", out proj);
            if (!(md is string)) throw new InvalidOperationException("缺少錯題本內容");
            string f = Path.Combine(DataDir, "錯題本-" + SafeName(proj as string) + ".md");
            lock (FileLock) WriteAtomic(f, (string)md);
            Reply(c, new { ok = true, path = f }); return;
        }
        if (path == "/api/session")
        {
            if (c.Request.ContentLength64 > 256L * 1024 * 1024) throw new InvalidOperationException("題目圖片過大，請縮小題數");
            string text = Body(c);
            var obj = Json.Deserialize<Dictionary<string, object>>(text);
            if (!obj.ContainsKey("questions")) throw new InvalidOperationException("缺少題目");
            var qs = obj["questions"] as IList;
            if (qs == null || qs.Count == 0 || qs.Count > 3000) throw new InvalidOperationException("題數需介於 1 到 3000");
            // 從 file:// 開啟的網頁無法把圖片轉成資料，改由這裡從題庫資料夾讀取
            object missing; int filled = 0;
            if (obj.TryGetValue("missingImages", out missing) && missing is IList && ((IList)missing).Count > 0)
            {
                var images = obj.ContainsKey("images") && obj["images"] is Dictionary<string, object> ? (Dictionary<string, object>)obj["images"] : new Dictionary<string, object>();
                foreach (var x in (IList)missing)
                {
                    string p = x as string; if (p == null || images.ContainsKey(p)) continue;
                    string full = WebFile(p); if (full == null || !File.Exists(full)) continue;
                    string ext = Path.GetExtension(full).ToLowerInvariant(), type = ext == ".jpg" || ext == ".jpeg" ? "image/jpeg" : ext == ".webp" ? "image/webp" : ext == ".gif" ? "image/gif" : ext == ".svg" ? "image/svg+xml" : "image/png";
                    images[p] = "data:" + type + ";base64," + Convert.ToBase64String(File.ReadAllBytes(full)); filled++;
                }
                obj["images"] = images; obj.Remove("missingImages"); text = Json.Serialize(obj);
            }
            lock (SessionLock) WriteAtomic(Path.Combine(Root, "saves", "session.json"), text);
            Reply(c, new { ok = true, count = qs.Count, imagesFromDisk = filled }); return;
        }
        if (path == "/api/launch")
        {
            lock (LaunchLock)
            {
                if (!File.Exists(Path.Combine(Root, "saves", "session.json"))) throw new InvalidOperationException("請先套用題本");
                string exe = Path.Combine(Root, "Peglin", "Peglin.exe");
                if (!File.Exists(exe)) throw new InvalidOperationException("找不到遊戲本體：" + exe);
                if (!GameRunning())
                {
                    var info = new ProcessStartInfo(exe, "-screen-fullscreen 0 -screen-width 1280 -screen-height 800 -logFile \"" + Path.Combine(Root, "saves", "player.log") + "\"");
                    info.WorkingDirectory = Path.Combine(Root, "Peglin");
                    game = Process.Start(info);
                }
            }
            Reply(c, new { ok = true, running = true }); return;
        }
        throw new InvalidOperationException("未知操作");
    }
    static bool GameRunning()
    {
        if (game != null && !game.HasExited) return true;
        string expected = Path.Combine(Root, "Peglin") + "\\";
        foreach (var p in Process.GetProcessesByName("Peglin"))
        { try { if (p.MainModule.FileName.StartsWith(expected, StringComparison.OrdinalIgnoreCase)) { game = p; return true; } } catch {} }
        return false;
    }
}
