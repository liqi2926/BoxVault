using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;

namespace BoxVaultApp
{
    static class Program
    {
        private const int PORT = 18666;
        private static string AppRoot = AppDomain.CurrentDomain.BaseDirectory;
        private static string ConfigPath = Path.Combine(AppRoot, "config.json");
        private static string DefaultVaultDir = Path.Combine(AppRoot, "本地文件库");
        private static HttpListener listener;
        private static NotifyIcon trayIcon;
        private static bool isRunning = true;
        private static JavaScriptSerializer json = new JavaScriptSerializer { MaxJsonLength = int.MaxValue };

        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);

                if (args.Length > 0 && (args[0] == "--stop" || args[0] == "/stop"))
                {
                    SendShutdownRequest();
                    return;
                }

                if (IsServiceAlreadyRunning())
                {
                    LaunchAppWindow("http://127.0.0.1:" + PORT);
                    return;
                }

                EnsureConfig();

                try
                {
                    ContextMenu trayMenu = new ContextMenu();
                    trayMenu.MenuItems.Add("打开 BoxVault 界面", (s, e) => LaunchAppWindow("http://127.0.0.1:" + PORT));
                    trayMenu.MenuItems.Add("打开本地文件库目录", (s, e) => OpenExplorer(GetVaultDir()));
                    trayMenu.MenuItems.Add("-");
                    trayMenu.MenuItems.Add("关闭 BoxVault 服务", (s, e) => ShutdownApplication());

                    trayIcon = new NotifyIcon();
                    trayIcon.Text = "BoxVault 本地文件管理服务 (127.0.0.1:18666)";
                    trayIcon.Icon = SystemIcons.Application;
                    trayIcon.ContextMenu = trayMenu;
                    trayIcon.Visible = true;
                    trayIcon.DoubleClick += (s, e) => LaunchAppWindow("http://127.0.0.1:" + PORT);
                }
                catch { }

                Thread serverThread = new Thread(StartHttpServer);
                serverThread.IsBackground = false;
                serverThread.Start();

                bool silent = false;
                foreach (string a in args)
                {
                    if (a == "--silent") silent = true;
                }
                if (!silent)
                {
                    LaunchAppWindow("http://127.0.0.1:" + PORT);
                }

                Application.Run();
                while (isRunning)
                {
                    Thread.Sleep(500);
                }
            }
            catch { }
        }

        private static bool IsServiceAlreadyRunning()
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:" + PORT + "/api/status");
                req.Proxy = null;
                req.Timeout = 400;
                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                {
                    return resp.StatusCode == HttpStatusCode.OK;
                }
            }
            catch
            {
                return false;
            }
        }

        private static void SendShutdownRequest()
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:" + PORT + "/api/shutdown");
                req.Proxy = null;
                req.Method = "POST";
                req.ContentLength = 0;
                req.Timeout = 1000;
                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse()) { }
            }
            catch { }
        }

        private static void ShutdownApplication()
        {
            isRunning = false;
            try { if ( trayIcon != null ) { trayIcon.Visible = false; trayIcon.Dispose(); } } catch { }
            try { if ( listener != null ) listener.Close(); } catch { }
            Application.Exit();
            Environment.Exit(0);
        }

        private static void EnsureConfig()
        {
            string dir = GetVaultDir();
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
        }

        private static string GetVaultDir()
        {
            try
            {
                if (File.Exists(ConfigPath))
                {
                    var dict = json.Deserialize<Dictionary<string, object>>(File.ReadAllText(ConfigPath, Encoding.UTF8));
                    if (dict != null && dict.ContainsKey("vaultDir") && dict["vaultDir"] != null)
                    {
                        string vd = dict["vaultDir"].ToString();
                        if (!Directory.Exists(vd)) Directory.CreateDirectory(vd);
                        return vd;
                    }
                }
            }
            catch { }
            if (!Directory.Exists(DefaultVaultDir)) Directory.CreateDirectory(DefaultVaultDir);
            SaveVaultDir(DefaultVaultDir);
            return DefaultVaultDir;
        }

        private static void SaveVaultDir(string dir)
        {
            try
            {
                var dict = new Dictionary<string, object> { { "vaultDir", dir } };
                File.WriteAllText(ConfigPath, json.Serialize(dict), Encoding.UTF8);
            }
            catch { }
        }

        private static string SanitizeSegment(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "未命名";
            foreach (char c in Path.GetInvalidFileNameChars())
            {
                name = name.Replace(c, '_');
            }
            return name.Trim();
        }

        private static void LaunchAppWindow(string url)
        {
            string[] candidates = new string[]
            {
                @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\Google\Chrome\Application\chrome.exe"
            };
            foreach (string exe in candidates)
            {
                if (File.Exists(exe))
                {
                    try
                    {
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = exe,
                            Arguments = "--app=" + url + " --window-size=1280,820",
                            UseShellExecute = false
                        });
                        return;
                    }
                    catch { }
                }
            }
            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch { }
        }

        private static void OpenExplorer(string folderPath)
        {
            try
            {
                if (!Directory.Exists(folderPath)) Directory.CreateDirectory(folderPath);
                Process.Start(new ProcessStartInfo("explorer.exe", "\"" + folderPath + "\"") { UseShellExecute = true });
            }
            catch { }
        }

        private static void OpenFileWithDefaultProgram(string filePath)
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = "/c start \"\" \"" + filePath + "\"",
                CreateNoWindow = true,
                WindowStyle = ProcessWindowStyle.Hidden,
                UseShellExecute = false
            });
        }

        private static string LocateDirectoryByMarker(string folderName, string markerFile, string token)
        {
            string home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            List<string> roots = new List<string>
            {
                AppRoot,
                Directory.GetParent(AppRoot.TrimEnd('\\')) != null ? Directory.GetParent(AppRoot.TrimEnd('\\')).FullName : AppRoot,
                Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),
                Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                Path.Combine(home, "Downloads"),
                home,
                @"C:\", @"D:\", @"E:\", @"F:\"
            };

            Func<string, string> checkDir = (candidate) =>
            {
                try
                {
                    string mPath = Path.Combine(candidate, markerFile);
                    if (File.Exists(mPath) && File.ReadAllText(mPath, Encoding.UTF8).Trim() == token)
                        return candidate;
                }
                catch { }
                return null;
            };

            foreach (string r in roots)
            {
                if (string.IsNullOrEmpty(r) || !Directory.Exists(r)) continue;
                string direct = checkDir(r);
                if (direct != null) return direct;

                string sub = checkDir(Path.Combine(r, folderName));
                if (sub != null) return sub;

                try
                {
                    foreach (string dir in Directory.GetDirectories(r))
                    {
                        string dName = Path.GetFileName(dir);
                        if (dName.StartsWith("$") || dName == "Windows" || dName == "node_modules") continue;
                        if (dName == folderName)
                        {
                            string hit = checkDir(dir);
                            if (hit != null) return hit;
                        }
                        string hit2 = checkDir(Path.Combine(dir, folderName));
                        if (hit2 != null) return hit2;
                    }
                }
                catch { }
            }
            return null;
        }

        private static void StartHttpServer()
        {
            try
            {
                listener = new HttpListener();
                listener.Prefixes.Add("http://127.0.0.1:" + PORT + "/");
                listener.Start();

                while (isRunning)
                {
                    HttpListenerContext ctx = listener.GetContext();
                    ThreadPool.QueueUserWorkItem((state) => HandleRequest((HttpListenerContext)state), ctx);
                }
            }
            catch { }
        }

        private static void AddCorsHeaders(HttpListenerResponse res)
        {
            res.Headers["Access-Control-Allow-Origin"] = "*";
            res.Headers["Access-Control-Allow-Private-Network"] = "true";
            res.Headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
            res.Headers["Access-Control-Allow-Headers"] = "Content-Type";
        }

        private static void SendJson(HttpListenerResponse res, int status, object data)
        {
            AddCorsHeaders(res);
            res.StatusCode = status;
            res.ContentType = "application/json; charset=utf-8";
            byte[] buf = Encoding.UTF8.GetBytes(json.Serialize(data));
            res.ContentLength64 = buf.Length;
            res.OutputStream.Write(buf, 0, buf.Length);
            res.OutputStream.Close();
        }

        private static Dictionary<string, object> ReadBody(HttpListenerRequest req)
        {
            using (StreamReader sr = new StreamReader(req.InputStream, Encoding.UTF8))
            {
                string raw = sr.ReadToEnd();
                if (string.IsNullOrWhiteSpace(raw)) return new Dictionary<string, object>();
                return json.Deserialize<Dictionary<string, object>>(raw);
            }
        }

        private static string BuildBoxDir(string vaultDir, Dictionary<string, object> body)
        {
            string dir = vaultDir;
            if (body.ContainsKey("boxChain") && body["boxChain"] is System.Collections.IEnumerable)
            {
                foreach (object seg in (System.Collections.IEnumerable)body["boxChain"])
                {
                    if (seg != null) dir = Path.Combine(dir, SanitizeSegment(seg.ToString()));
                }
            }
            return dir;
        }

        private static void HandleRequest(HttpListenerContext ctx)
        {
            HttpListenerRequest req = ctx.Request;
            HttpListenerResponse res = ctx.Response;

            try
            {
                if (req.HttpMethod == "OPTIONS")
                {
                    AddCorsHeaders(res);
                    res.StatusCode = 204;
                    res.OutputStream.Close();
                    return;
                }

                string path = req.Url.AbsolutePath;

                if (path == "/api/status" && req.HttpMethod == "GET")
                {
                    string vd = GetVaultDir();
                    SendJson(res, 200, new Dictionary<string, object>
                    {
                        { "ok", true },
                        { "mode", "native-local-app" },
                        { "vaultDir", vd },
                        { "vaultName", Path.GetFileName(vd.TrimEnd('\\')) }
                    });
                    return;
                }

                if (path == "/api/shutdown" && req.HttpMethod == "POST")
                {
                    SendJson(res, 200, new Dictionary<string, object> { { "ok", true } });
                    ThreadPool.QueueUserWorkItem((s) =>
                    {
                        Thread.Sleep(150);
                        ShutdownApplication();
                    });
                    return;
                }

                if (path == "/api/locate-vault" && req.HttpMethod == "POST")
                {
                    var body = ReadBody(req);
                    string folderName = body.ContainsKey("folderName") && body["folderName"] != null ? body["folderName"].ToString() : "";
                    string markerFile = body.ContainsKey("markerFile") && body["markerFile"] != null ? body["markerFile"].ToString() : ".boxvault-locate.tmp";
                    string token = body.ContainsKey("token") && body["token"] != null ? body["token"].ToString() : "";
                    string located = LocateDirectoryByMarker(folderName, markerFile, token);
                    if (located != null)
                    {
                        SaveVaultDir(located);
                        SendJson(res, 200, new Dictionary<string, object>
                        {
                            { "ok", true },
                            { "vaultDir", located },
                            { "vaultName", Path.GetFileName(located.TrimEnd('\\')) }
                        });
                        return;
                    }
                    SendJson(res, 200, new Dictionary<string, object> { { "ok", false } });
                    return;
                }

                // 暂存外部拖拽可能需要的未落盘文件
                if (path == "/api/stage-drag" && req.HttpMethod == "POST")
                {
                    AddCorsHeaders(res);
                    var body = ReadBody(req);
                    string fn = body.ContainsKey("fileName") && body["fileName"] != null ? body["fileName"].ToString() : "";
                    if (!string.IsNullOrEmpty(fn))
                    {
                        string cacheDir = Path.Combine(GetVaultDir(), ".drag-cache");
                        if (!Directory.Exists(cacheDir)) Directory.CreateDirectory(cacheDir);
                        string cachePath = Path.Combine(cacheDir, SanitizeSegment(fn));
                        if (body.ContainsKey("base64Data") && body["base64Data"] is string)
                        {
                            File.WriteAllBytes(cachePath, Convert.FromBase64String((string)body["base64Data"]));
                        }
                        else if (body.ContainsKey("textContent") && body["textContent"] is string)
                        {
                            File.WriteAllText(cachePath, (string)body["textContent"], Encoding.UTF8);
                        }
                    }
                    SendJson(res, 200, new Dictionary<string, object> { { "ok", true } });
                    return;
                }

                // 下载/读取原生真实文件（专供浏览器向外部桌面程序拖拽：DownloadURL 原生文件流协议）
                if (path == "/api/raw-download" && req.HttpMethod == "GET")
                {
                    AddCorsHeaders(res);
                    string fileName = req.QueryString["fileName"] ?? "";
                    string boxChainStr = req.QueryString["boxChain"] ?? "";
                    if (string.IsNullOrEmpty(fileName))
                    {
                        res.StatusCode = 400;
                        res.OutputStream.Close();
                        return;
                    }

                    string targetDir = GetVaultDir();
                    if (!string.IsNullOrEmpty(boxChainStr))
                    {
                        try
                        {
                            var chain = json.Deserialize<List<object>>(boxChainStr);
                            if (chain != null)
                            {
                                foreach (var seg in chain)
                                {
                                    if (seg != null && !string.IsNullOrWhiteSpace(seg.ToString()))
                                        targetDir = Path.Combine(targetDir, SanitizeSegment(seg.ToString()));
                                }
                            }
                        }
                        catch { }
                    }

                    string cleanFileName = SanitizeSegment(fileName);
                    string filePath = Path.Combine(targetDir, cleanFileName);

                    // 1. 如果在指定 box 路径下未找到，先尝试 .drag-cache 暂存区
                    if (!File.Exists(filePath))
                    {
                        string cacheFile = Path.Combine(GetVaultDir(), ".drag-cache", cleanFileName);
                        if (File.Exists(cacheFile))
                        {
                            filePath = cacheFile;
                        }
                    }

                    // 2. 如果仍未找到，自动在整个库中递归搜索同名文件（超级容错）
                    if (!File.Exists(filePath))
                    {
                        try
                        {
                            string vd = GetVaultDir();
                            if (Directory.Exists(vd))
                            {
                                string[] matches = Directory.GetFiles(vd, cleanFileName, SearchOption.AllDirectories);
                                if (matches != null && matches.Length > 0)
                                {
                                    filePath = matches[0];
                                }
                            }
                        }
                        catch { }
                    }

                    if (!File.Exists(filePath))
                    {
                        SendJson(res, 404, new Dictionary<string, object>
                        {
                            { "error", "file_not_found" },
                            { "targetDir", targetDir },
                            { "filePath", filePath },
                            { "boxChainStr", boxChainStr },
                            { "fileName", fileName }
                        });
                        return;
                    }

                    string fileExt = Path.GetExtension(filePath).ToLowerInvariant();
                    string mime = "application/octet-stream";
                    if (fileExt == ".png") mime = "image/png";
                    else if (fileExt == ".jpg" || fileExt == ".jpeg") mime = "image/jpeg";
                    else if (fileExt == ".gif") mime = "image/gif";
                    else if (fileExt == ".svg") mime = "image/svg+xml";
                    else if (fileExt == ".webp") mime = "image/webp";
                    else if (fileExt == ".bmp") mime = "image/bmp";
                    else if (fileExt == ".md" || fileExt == ".txt") mime = "text/plain; charset=utf-8";
                    else if (fileExt == ".pdf") mime = "application/pdf";
                    else if (fileExt == ".docx") mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                    else if (fileExt == ".xlsx") mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

                    res.ContentType = mime;
                    StringBuilder sb = new StringBuilder();
                    foreach (char c in fileName)
                    {
                        if (c > 31 && c < 127 && c != '"' && c != '\\') sb.Append(c);
                    }
                    string safeAscii = sb.Length > 0 ? sb.ToString() : "download";
                    string utf8Encoded = Uri.EscapeDataString(fileName);
                    res.AddHeader("Content-Disposition", "attachment; filename=\"" + safeAscii + "\"; filename*=UTF-8''" + utf8Encoded);
                    
                    byte[] bytes = File.ReadAllBytes(filePath);
                    res.ContentLength64 = bytes.Length;
                    res.OutputStream.Write(bytes, 0, bytes.Length);
                    res.OutputStream.Close();
                    return;
                }

                if (path == "/api/open-explorer" && req.HttpMethod == "POST")
                {
                    var body = ReadBody(req);
                    string targetDir = BuildBoxDir(GetVaultDir(), body);
                    OpenExplorer(targetDir);
                    SendJson(res, 200, new Dictionary<string, object> { { "ok", true }, { "targetDir", targetDir } });
                    return;
                }

                if (path == "/api/open-file" && req.HttpMethod == "POST")
                {
                    var body = ReadBody(req);
                    string boxDir = BuildBoxDir(GetVaultDir(), body);
                    if (!Directory.Exists(boxDir)) Directory.CreateDirectory(boxDir);
                    string fileName = body.ContainsKey("fileName") && body["fileName"] != null ? SanitizeSegment(body["fileName"].ToString()) : "未命名.txt";
                    string filePath = Path.Combine(boxDir, fileName);

                    if (!File.Exists(filePath))
                    {
                        if (body.ContainsKey("base64Data") && body["base64Data"] is string)
                        {
                            File.WriteAllBytes(filePath, Convert.FromBase64String((string)body["base64Data"]));
                        }
                        else if (body.ContainsKey("textContent") && body["textContent"] is string)
                        {
                            File.WriteAllText(filePath, (string)body["textContent"], Encoding.UTF8);
                        }
                    }

                    if (File.Exists(filePath))
                    {
                        OpenFileWithDefaultProgram(filePath);
                        SendJson(res, 200, new Dictionary<string, object> { { "ok", true }, { "filePath", filePath } });
                    }
                    else
                    {
                        SendJson(res, 404, new Dictionary<string, object> { { "ok", false }, { "error", "本地文件不存在" } });
                    }
                    return;
                }

                if (path == "/api/fs-op" && req.HttpMethod == "POST")
                {
                    var body = ReadBody(req);
                    string op = body.ContainsKey("op") && body["op"] != null ? body["op"].ToString() : "";
                    string vaultDir = GetVaultDir();
                    string boxDir = BuildBoxDir(vaultDir, body);

                    if (op == "write-file")
                    {
                        if (!Directory.Exists(boxDir)) Directory.CreateDirectory(boxDir);
                        string fn = body.ContainsKey("fileName") && body["fileName"] != null ? SanitizeSegment(body["fileName"].ToString()) : "未命名";
                        string fp = Path.Combine(boxDir, fn);
                        if (body.ContainsKey("base64Data") && body["base64Data"] is string)
                            File.WriteAllBytes(fp, Convert.FromBase64String((string)body["base64Data"]));
                        else if (body.ContainsKey("textContent") && body["textContent"] is string)
                            File.WriteAllText(fp, (string)body["textContent"], Encoding.UTF8);
                    }
                    else if (op == "write-meta")
                    {
                        if (body.ContainsKey("boxMeta") && body["boxMeta"] != null)
                        {
                            string archDir = Path.Combine(boxDir, "_历史存档");
                            if (!Directory.Exists(archDir)) Directory.CreateDirectory(archDir);
                            File.WriteAllText(Path.Combine(archDir, "box-meta.json"), json.Serialize(body["boxMeta"]), Encoding.UTF8);
                        }
                    }
                    else if (op == "delete-file")
                    {
                        string fn = body.ContainsKey("fileName") && body["fileName"] != null ? SanitizeSegment(body["fileName"].ToString()) : "";
                        string fp = Path.Combine(boxDir, fn);
                        if (File.Exists(fp)) { try { File.Delete(fp); } catch { } }
                    }
                    else if (op == "delete-box")
                    {
                        if (Directory.Exists(boxDir) && boxDir != vaultDir)
                        {
                            try { Directory.Delete(boxDir, true); } catch { }
                        }
                    }
                    SendJson(res, 200, new Dictionary<string, object> { { "ok", true } });
                    return;
                }

                // 静态资源
                string rel = path == "/" ? "index.html" : path.TrimStart('/');
                string fullStatic = Path.GetFullPath(Path.Combine(AppRoot, Uri.UnescapeDataString(rel)));
                if (!fullStatic.StartsWith(AppRoot, StringComparison.OrdinalIgnoreCase) || !File.Exists(fullStatic))
                {
                    res.StatusCode = 404;
                    res.OutputStream.Close();
                    return;
                }

                string ext = Path.GetExtension(fullStatic).ToLowerInvariant();
                if (ext == ".html") res.ContentType = "text/html; charset=utf-8";
                else if (ext == ".css") res.ContentType = "text/css; charset=utf-8";
                else if (ext == ".js") res.ContentType = "application/javascript; charset=utf-8";
                else if (ext == ".json") res.ContentType = "application/json; charset=utf-8";
                else if (ext == ".svg") res.ContentType = "image/svg+xml";
                else res.ContentType = "application/octet-stream";

                byte[] fileBytes = File.ReadAllBytes(fullStatic);
                res.ContentLength64 = fileBytes.Length;
                res.OutputStream.Write(fileBytes, 0, fileBytes.Length);
                res.OutputStream.Close();
            }
            catch (Exception ex)
            {
                try { SendJson(res, 500, new Dictionary<string, object> { { "ok", false }, { "error", ex.Message } }); } catch { }
            }
        }
    }
}
