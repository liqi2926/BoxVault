/**
 * BoxVault 轻量化本地桌面端服务 (零第三方依赖，基于 Node.js 原生模块)
 * 功能：
 * 1. 提供独立桌面应用窗口 (--app 模式) 与本地 API 服务 (127.0.0.1:18666)
 * 2. 点击“书籍”或文件时，直接调用 Windows 系统默认关联软件打开真实文件 (0 浏览器下载弹窗)
 * 3. 自动将所有箱子、嵌套子箱子、真实文件及 _历史存档 同步至本地真实目录
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execFile } = require('child_process');

const PORT = 18666;
const APP_ROOT = __dirname;
const CONFIG_PATH = path.join(APP_ROOT, 'config.json');
const DEFAULT_VAULT_DIR = path.join(APP_ROOT, '本地文件库');
const ARCHIVE_DIR_NAME = '_历史存档';
const BOX_META_FILE = 'box-meta.json';
const SNAP_META_FILE = 'snapshot-meta.json';

function sanitizeSegment(name) {
  return String(name || '未命名')
    .replace(/[\\/:*?"<>|]/g, '_')
    .trim() || '未命名';
}

function formatFolderTime(ts) {
  const d = new Date(ts || Date.now());
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function getSnapshotFolderName(snap) {
  const safeRemark = sanitizeSegment(snap.archiveNote || '存档').slice(0, 24);
  return `v${snap.versionNum}_${formatFolderTime(snap.createdAt)}_${safeRemark}`;
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      if (cfg.vaultDir) {
        if (!fs.existsSync(cfg.vaultDir)) {
          fs.mkdirSync(cfg.vaultDir, { recursive: true });
        }
        return cfg;
      }
    }
  } catch (e) {}
  if (!fs.existsSync(DEFAULT_VAULT_DIR)) {
    fs.mkdirSync(DEFAULT_VAULT_DIR, { recursive: true });
  }
  const initialCfg = { vaultDir: DEFAULT_VAULT_DIR };
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(initialCfg, null, 2), 'utf-8');
  } catch (e) {}
  return initialCfg;
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
}

// 使用 Windows 原生默认关联程序直接打开本地文件
function openWithWindowsDefault(targetPath) {
  return new Promise((resolve, reject) => {
    const child = spawn('cmd.exe', ['/c', 'start', '""', targetPath], {
      windowsHide: true,
      detached: true,
      stdio: 'ignore'
    });
    child.on('error', reject);
    child.unref();
    resolve();
  });
}

// 在 Windows 资源管理器中打开目录或选中文件
function revealInExplorer(targetPath, isFile = false) {
  return new Promise((resolve) => {
    const args = isFile ? [`/select,${targetPath}`] : [targetPath];
    const child = spawn('explorer.exe', args, {
      windowsHide: false,
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    resolve();
  });
}

// 根据浏览器写入的临时标记文件自动定位用户选择的真实文件夹完整路径
function locateDirectoryByMarker(folderName, markerFile, token) {
  const os = require('os');
  const home = os.homedir();
  const searchRoots = [
    APP_ROOT,
    path.dirname(APP_ROOT),
    path.join(home, 'Desktop'),
    path.join(home, 'Documents'),
    path.join(home, 'Downloads'),
    home,
    'C:\\',
    'D:\\',
    'E:\\',
    'F:\\'
  ];

  const checkDir = (candidateDir) => {
    try {
      const mPath = path.join(candidateDir, markerFile);
      if (fs.existsSync(mPath)) {
        const content = fs.readFileSync(mPath, 'utf-8').trim();
        if (content === token) return candidateDir;
      }
    } catch (e) {}
    return null;
  };

  for (const root of searchRoots) {
    if (!fs.existsSync(root)) continue;
    const direct = checkDir(root);
    if (direct) return direct;

    const sub = checkDir(path.join(root, folderName));
    if (sub) return sub;

    // 扫描一级子目录
    try {
      const entries = fs.readdirSync(root, { withFileTypes: true });
      for (const ent of entries) {
        if (!ent.isDirectory() || ent.name.startsWith('$') || ent.name === 'Windows' || ent.name === 'node_modules') continue;
        const level1 = path.join(root, ent.name);
        if (ent.name === folderName) {
          const hit = checkDir(level1);
          if (hit) return hit;
        }
        const level2 = checkDir(path.join(level1, folderName));
        if (level2) return level2;
      }
    } catch (e) {}
  }
  return null;
}

// 调用 Windows 原生文件夹选择对话框
function pickFolderNativeDialog(initialDir) {
  return new Promise((resolve) => {
    const safeInit = String(initialDir || '').replace(/'/g, "''");
    const psScript = `
      [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
      Add-Type -AssemblyName System.Windows.Forms
      $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
      $dlg.Description = '选择 BoxVault 本地真实存储文件夹'
      $dlg.ShowNewFolderButton = $true
      if ('${safeInit}' -ne '') {
        $dlg.SelectedPath = '${safeInit}'
      }
      $form = New-Object System.Windows.Forms.Form
      $form.TopMost = $true
      $form.StartPosition = 'CenterScreen'
      $res = $dlg.ShowDialog($form)
      if ($res -eq [System.Windows.Forms.DialogResult]::OK) {
        Write-Output $dlg.SelectedPath
      }
    `;
    execFile(
      'powershell.exe',
      ['-NoProfile', '-STA', '-Command', psScript],
      { encoding: 'utf-8', windowsHide: false },
      (err, stdout) => {
        if (err) return resolve(null);
        const picked = String(stdout || '').trim();
        resolve(picked || null);
      }
    );
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Private-Network': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(obj));
}

const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Private-Network': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const urlObj = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const pathname = urlObj.pathname;

  try {
    // 1. 状态查询
    if (pathname === '/api/status' && req.method === 'GET') {
      const cfg = loadConfig();
      return sendJson(res, 200, {
        ok: true,
        mode: 'native-local-app',
        vaultDir: cfg.vaultDir,
        vaultName: path.basename(cfg.vaultDir)
      });
    }

    // 1a. 关闭本地服务
    if (pathname === '/api/shutdown' && req.method === 'POST') {
      sendJson(res, 200, { ok: true });
      setTimeout(() => process.exit(0), 150);
      return;
    }

    // 1b. 自动定位浏览器 showDirectoryPicker 选中的真实目录路径
    if (pathname === '/api/locate-vault' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const located = locateDirectoryByMarker(body.folderName || '', body.markerFile || '.boxvault-locate.tmp', body.token || '');
      if (located) {
        saveConfig({ vaultDir: located });
        return sendJson(res, 200, {
          ok: true,
          vaultDir: located,
          vaultName: path.basename(located)
        });
      }
      return sendJson(res, 200, { ok: false });
    }

    // 1b2. 暂存外部拖拽可能需要的未落盘文件
    if (pathname === '/api/stage-drag' && req.method === 'POST') {
      const cfg = loadConfig();
      const vaultDir = cfg.vaultDir || DEFAULT_VAULT_DIR;
      const body = await readJsonBody(req);
      const fn = body.fileName ? sanitizeSegment(body.fileName) : '';
      if (fn) {
        const cacheDir = path.join(vaultDir, '.drag-cache');
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        const cachePath = path.join(cacheDir, fn);
        if (body.base64Data) {
          fs.writeFileSync(cachePath, Buffer.from(body.base64Data, 'base64'));
        } else if (body.textContent != null) {
          fs.writeFileSync(cachePath, body.textContent, 'utf8');
        }
      }
      return sendJson(res, 200, { ok: true });
    }

    // 1c. 下载/读取原生真实文件（专供浏览器向外部桌面程序拖拽：DownloadURL 原生文件流协议）
    if (pathname === '/api/raw-download' && req.method === 'GET') {
      const cfg = loadConfig();
      const vaultDir = cfg.vaultDir || DEFAULT_VAULT_DIR;
      const boxChainStr = urlObj.searchParams.get('boxChain') || '';
      const fileName = urlObj.searchParams.get('fileName') || '';
      if (!fileName) {
        res.writeHead(400);
        return res.end('fileName required');
      }

      let targetDir = vaultDir;
      if (boxChainStr) {
        try {
          const chain = JSON.parse(boxChainStr);
          if (Array.isArray(chain)) {
            for (const seg of chain) {
              targetDir = path.join(targetDir, sanitizeSegment(seg));
            }
          }
        } catch (e) {}
      }

      const cleanFileName = sanitizeSegment(fileName);
      let filePath = path.join(targetDir, cleanFileName);

      // 1. 尝试 .drag-cache 暂存区
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        const cacheFile = path.join(vaultDir, '.drag-cache', cleanFileName);
        if (fs.existsSync(cacheFile) && !fs.statSync(cacheFile).isDirectory()) {
          filePath = cacheFile;
        }
      }

      // 2. 递归全库搜索同名文件作为兜底
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        const findInDir = (dir) => {
          try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              const full = path.join(dir, entry.name);
              if (entry.isFile() && entry.name.toLowerCase() === cleanFileName.toLowerCase()) {
                return full;
              }
              if (entry.isDirectory() && entry.name !== '_历史归档' && entry.name !== '.drag-cache') {
                const sub = findInDir(full);
                if (sub) return sub;
              }
            }
          } catch (_) {}
          return null;
        };
        const found = findInDir(vaultDir);
        if (found) filePath = found;
      }

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'file_not_found', targetDir, filePath, fileName }));
      }

      const fileExt = path.extname(filePath).toLowerCase();
      const mime = MIME_MAP[fileExt] || 'application/octet-stream';
      const encodedName = encodeURIComponent(fileName);
      const safeAscii = fileName.replace(/[^\x20-\x7E]|["\\]/g, '') || 'download';

      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Disposition': `attachment; filename="${safeAscii}"; filename*=UTF-8''${encodedName}`,
        'Content-Length': fs.statSync(filePath).size,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Private-Network': 'true'
      });
      return fs.createReadStream(filePath).pipe(res);
    }

    // 2. 弹出 Windows 原生文件夹选择器切换本地根目录
    if (pathname === '/api/pick-folder' && req.method === 'POST') {
      const cfg = loadConfig();
      const picked = await pickFolderNativeDialog(cfg.vaultDir);
      if (!picked) {
        return sendJson(res, 200, { ok: false, cancelled: true });
      }
      if (!fs.existsSync(picked)) {
        fs.mkdirSync(picked, { recursive: true });
      }
      saveConfig({ vaultDir: picked });
      return sendJson(res, 200, {
        ok: true,
        vaultDir: picked,
        vaultName: path.basename(picked)
      });
    }

    // 3. 用本机默认应用直接打开文件 (0 浏览器下载弹窗)
    if (pathname === '/api/open-file' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const cfg = loadConfig();
      const chain = Array.isArray(body.boxChain) ? body.boxChain.map(sanitizeSegment) : [];
      const safeFileName = sanitizeSegment(body.fileName || '未命名.txt');

      const boxDir = path.join(cfg.vaultDir, ...chain);
      if (!fs.existsSync(boxDir)) {
        fs.mkdirSync(boxDir, { recursive: true });
      }

      const filePath = path.join(boxDir, safeFileName);

      // 若磁盘上尚无此文件或需要同步最新内容，先落盘再调用系统程序打开
      if (!fs.existsSync(filePath) || body.forceSync) {
        if (typeof body.base64Data === 'string') {
          fs.writeFileSync(filePath, Buffer.from(body.base64Data, 'base64'));
        } else if (typeof body.textContent === 'string') {
          fs.writeFileSync(filePath, body.textContent, 'utf-8');
        }
      }

      if (!fs.existsSync(filePath)) {
        return sendJson(res, 404, { ok: false, error: '本地文件不存在' });
      }

      await openWithWindowsDefault(filePath);
      return sendJson(res, 200, { ok: true, filePath });
    }

    // 4. 在 Windows 资源管理器中打开当前箱子或根目录
    if (pathname === '/api/open-explorer' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const cfg = loadConfig();
      const chain = Array.isArray(body.boxChain) ? body.boxChain.map(sanitizeSegment) : [];
      const targetDir = path.join(cfg.vaultDir, ...chain);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      await revealInExplorer(targetDir, false);
      return sendJson(res, 200, { ok: true, targetDir });
    }

    // 5. 本地磁盘同步操作 (写入文件 / 删除文件 / 删除箱子 / 写入存档 / 回滚)
    if (pathname === '/api/fs-op' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const cfg = loadConfig();
      const op = body.op;
      const chain = Array.isArray(body.boxChain) ? body.boxChain.map(sanitizeSegment) : [];
      const boxDir = path.join(cfg.vaultDir, ...chain);

      if (op === 'write-file') {
        fs.mkdirSync(boxDir, { recursive: true });
        const filePath = path.join(boxDir, sanitizeSegment(body.fileName));
        if (typeof body.base64Data === 'string') {
          fs.writeFileSync(filePath, Buffer.from(body.base64Data, 'base64'));
        } else if (typeof body.textContent === 'string') {
          fs.writeFileSync(filePath, body.textContent, 'utf-8');
        }
        if (body.boxMeta) {
          const archiveDir = path.join(boxDir, ARCHIVE_DIR_NAME);
          fs.mkdirSync(archiveDir, { recursive: true });
          fs.writeFileSync(path.join(archiveDir, BOX_META_FILE), JSON.stringify(body.boxMeta, null, 2), 'utf-8');
        }
        return sendJson(res, 200, { ok: true, filePath });
      }

      if (op === 'write-meta') {
        fs.mkdirSync(boxDir, { recursive: true });
        const archiveDir = path.join(boxDir, ARCHIVE_DIR_NAME);
        fs.mkdirSync(archiveDir, { recursive: true });
        fs.writeFileSync(path.join(archiveDir, BOX_META_FILE), JSON.stringify(body.boxMeta || {}, null, 2), 'utf-8');
        return sendJson(res, 200, { ok: true });
      }

      if (op === 'delete-file') {
        const filePath = path.join(boxDir, sanitizeSegment(body.fileName));
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) {}
        }
        if (body.boxMeta && fs.existsSync(boxDir)) {
          const archiveDir = path.join(boxDir, ARCHIVE_DIR_NAME);
          fs.mkdirSync(archiveDir, { recursive: true });
          fs.writeFileSync(path.join(archiveDir, BOX_META_FILE), JSON.stringify(body.boxMeta, null, 2), 'utf-8');
        }
        return sendJson(res, 200, { ok: true });
      }

      if (op === 'delete-box') {
        if (fs.existsSync(boxDir) && boxDir !== cfg.vaultDir) {
          try { fs.rmSync(boxDir, { recursive: true, force: true }); } catch (e) {}
        }
        return sendJson(res, 200, { ok: true });
      }

      if (op === 'create-snapshot') {
        const snap = body.snapshot;
        if (snap) {
          const archiveDir = path.join(boxDir, ARCHIVE_DIR_NAME);
          const snapFolderName = getSnapshotFolderName(snap);
          const snapDir = path.join(archiveDir, snapFolderName);
          fs.mkdirSync(snapDir, { recursive: true });

          for (const sf of snap.files || []) {
            const sfPath = path.join(snapDir, sanitizeSegment(sf.name));
            if (typeof sf.base64Data === 'string') {
              fs.writeFileSync(sfPath, Buffer.from(sf.base64Data, 'base64'));
            } else if (typeof sf.textContent === 'string') {
              fs.writeFileSync(sfPath, sf.textContent, 'utf-8');
            }
          }
          fs.writeFileSync(path.join(snapDir, SNAP_META_FILE), JSON.stringify(snap.meta || {}, null, 2), 'utf-8');
        }
        return sendJson(res, 200, { ok: true });
      }

      return sendJson(res, 200, { ok: true });
    }

    // 6. 静态资源服务
    let fileRoute = pathname === '/' ? '/index.html' : pathname;
    const safeStaticPath = path.normalize(path.join(APP_ROOT, decodeURIComponent(fileRoute)));
    if (!safeStaticPath.startsWith(APP_ROOT) || !fs.existsSync(safeStaticPath) || fs.statSync(safeStaticPath).isDirectory()) {
      res.writeHead(404);
      return res.end('Not Found');
    }

    const ext = path.extname(safeStaticPath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_MAP[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(safeStaticPath).pipe(res);
  } catch (err) {
    console.error('Server error:', err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    // 如果服务已经在后台运行，直接打开窗口即可
    if (process.argv.includes('--open-window')) {
      launchAppWindow(`http://127.0.0.1:${PORT}`);
    }
    process.exit(0);
  }
});

function launchAppWindow(url) {
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  ];
  const browserExe = candidates.find((p) => fs.existsSync(p));
  if (browserExe) {
    spawn(browserExe, [`--app=${url}`, '--window-size=1280,820'], {
      detached: true,
      stdio: 'ignore'
    }).unref();
  } else {
    openWithWindowsDefault(url);
  }
}

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${PORT}`;
  console.log(`BoxVault 本地应用已启动: ${url}`);
  if (process.argv.includes('--open-window')) {
    launchAppWindow(url);
  }
});
