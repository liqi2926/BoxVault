/**
 * BoxVault 本地真实文件夹同步引擎 (File System Access API)
 *
 * 物理目录结构编排：
 * <本地根目录>/
 * ├── <箱子名称>/
 * │   ├── <真实文件1.md>                  <-- 当前箱内最新真实文件（资源管理器可直接查看与打开）
 * │   ├── <真实文件2.xlsx>
 * │   ├── <子箱子名称>/                   <-- 嵌套子箱子对应真实子目录
 * │   └── _历史存档/                      <-- 箱子专属存档库与元数据目录
 * │       ├── box-meta.json              <-- 箱子外观配置及箱内文件自定义备注、手动排序序号
 * │       ├── v1_20261105_1630_初稿/      <-- 手动点击“存档”生成的版本快照真实文件夹
 * │       │   ├── snapshot-meta.json     <-- 该版本的备注说明、时间及当时各文件的自定义备注
 * │       │   ├── <真实文件1.md>          <-- 该版本下的真实历史文件副本
 * │       │   └── <真实文件2.xlsx>
 * │       └── v2_20261105_1700_定稿/
 */

const ARCHIVE_DIR_NAME = '_历史存档';
const BOX_META_FILE = 'box-meta.json';
const SNAP_META_FILE = 'snapshot-meta.json';
const LOCAL_APP_API = 'http://127.0.0.1:18666';

async function blobToBase64(blob) {
  if (!blob) return null;
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

class LocalFolderSync {
  constructor() {
    this.rootHandle = null;
    this.permissionState = 'none'; // 'none' | 'prompt' | 'granted'
    this.nativeServerActive = false;
    this.nativeVaultDir = '';
    this.nativeVaultName = '';
  }

  sanitizeName(name) {
    return String(name || '未命名')
      .replace(/[\\/:*?"<>|]/g, '_')
      .trim() || '未命名';
  }

  getBoxNameChain(boxId, boxesList) {
    const chain = [];
    let curr = (boxesList || []).find((b) => b.id === boxId);
    const visited = new Set();
    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      chain.unshift(this.sanitizeName(curr.name));
      curr = curr.parentId ? (boxesList || []).find((b) => b.id === curr.parentId) : null;
    }
    return chain;
  }

  formatFolderTime(ts) {
    const d = new Date(ts || Date.now());
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  }

  getSnapshotFolderName(snap) {
    const safeRemark = this.sanitizeName(snap.archiveNote || '存档').slice(0, 24);
    return `v${snap.versionNum}_${this.formatFolderTime(snap.createdAt)}_${safeRemark}`;
  }

  // 检测轻量本地服务是否在线
  async checkNativeServer() {
    try {
      const res = await fetch(`${LOCAL_APP_API}/api/status`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.ok) {
          this.nativeServerActive = true;
          this.nativeVaultDir = data.vaultDir || '';
          this.nativeVaultName = data.vaultName || '本地文件库';
          return true;
        }
      }
    } catch (e) {
      this.nativeServerActive = false;
    }
    return false;
  }

  // 初始化检查本地服务及已保存的目录句柄
  async initFromDB() {
    await this.checkNativeServer();
    try {
      const savedHandle = await window.boxDB.getSetting('rootDirHandle');
      if (savedHandle) {
        this.rootHandle = savedHandle;
        const perm = await savedHandle.queryPermission({ mode: 'readwrite' });
        this.permissionState = perm;
        if (perm === 'granted') {
          await this.notifyServerVaultHandle(savedHandle);
          await this.syncFromDiskToDB();
        }
      }
    } catch (err) {
      console.warn('读取保存的目录句柄失败:', err);
    }
  }

  // 让本地服务自动定位浏览器所绑定的真实文件夹物理路径
  async notifyServerVaultHandle(dirHandle) {
    if (!this.nativeServerActive || !dirHandle) return;
    const markerFile = '.boxvault-locate.tmp';
    const token = `bv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      const fh = await dirHandle.getFileHandle(markerFile, { create: true });
      const writable = await fh.createWritable();
      await writable.write(token);
      await writable.close();

      const res = await fetch(`${LOCAL_APP_API}/api/locate-vault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderName: dirHandle.name,
          markerFile,
          token
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.ok && data.vaultDir) {
          this.nativeVaultDir = data.vaultDir;
          this.nativeVaultName = data.vaultName || dirHandle.name;
        }
      }
    } catch (e) {
      // 忽略定位异常
    } finally {
      try {
        await dirHandle.removeEntry(markerFile);
      } catch (e) {}
    }
  }

  // 用户点击绑定/切换本地目录 (始终优先使用浏览器内置瞬时文件夹选择器，不卡顿不遮挡)
  async pickAndBindFolder() {
    if (window.showDirectoryPicker) {
      try {
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        this.rootHandle = handle;
        this.permissionState = 'granted';
        await window.boxDB.setSetting('rootDirHandle', handle);

        if (this.nativeServerActive) {
          await this.notifyServerVaultHandle(handle);
        }

        // 先将磁盘上已有的文件夹/文件扫描合并进来，再把当前所有数据完整写入磁盘
        await this.syncFromDiskToDB(true);
        await this.fullSyncDBToDisk();
        return true;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('绑定本地目录失败:', err);
        }
        return false;
      }
    }

    if (this.nativeServerActive) {
      try {
        const res = await fetch(`${LOCAL_APP_API}/api/pick-folder`, { method: 'POST' });
        const data = await res.json();
        if (data && data.ok) {
          this.nativeVaultDir = data.vaultDir;
          this.nativeVaultName = data.vaultName;
          await this.fullSyncDBToDisk();
          return true;
        }
      } catch (e) {}
    }
    return false;
  }

  // 在 Windows 资源管理器中打开指定箱子目录
  async openInExplorer(boxId, allBoxes) {
    if (!this.nativeServerActive) return false;
    try {
      const boxChain = boxId ? this.getBoxNameChain(boxId, allBoxes) : [];
      await fetch(`${LOCAL_APP_API}/api/open-explorer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxChain })
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  // 一键关闭本地后台服务
  async shutdownNativeServer() {
    if (!this.nativeServerActive) return false;
    try {
      await fetch(`${LOCAL_APP_API}/api/shutdown`, { method: 'POST' });
    } catch (e) {}
    this.nativeServerActive = false;
    return true;
  }

  // 直接调用 Windows 原生关联软件打开文件 (0 下载弹窗)
  async openFileWithNativeApp(file, allBoxes) {
    const isAlive = this.nativeServerActive || (await this.checkNativeServer());
    if (!isAlive) return false;

    const boxChain = this.getBoxNameChain(file.boxId, allBoxes);
    const base64Data = file.contentBlob ? await blobToBase64(file.contentBlob) : undefined;
    const res = await fetch(`${LOCAL_APP_API}/api/open-file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boxChain,
        fileName: file.name,
        base64Data,
        textContent: file.textContent ?? undefined
      })
    });
    const data = await res.json();
    return Boolean(data && data.ok);
  }

  // 恢复已有句柄的读写授权 (浏览器重启后一键恢复)
  async requestSavedPermission() {
    if (!this.rootHandle) return false;
    try {
      const perm = await this.rootHandle.requestPermission({ mode: 'readwrite' });
      this.permissionState = perm;
      if (perm === 'granted') {
        await this.syncFromDiskToDB();
        await this.fullSyncDBToDisk();
        return true;
      }
    } catch (err) {
      console.error('请求目录权限失败:', err);
    }
    return false;
  }

  isReady() {
    return Boolean(this.nativeServerActive || (this.rootHandle && this.permissionState === 'granted'));
  }

  getDisplayFolderName() {
    if (this.rootHandle) return this.rootHandle.name;
    if (this.nativeServerActive) return this.nativeVaultName || '本地文件库';
    return '';
  }

  // 获取某个箱子在本地磁盘上的真实目录句柄 (按父子层级递归创建或获取；若 boxId 为空则返回根目录)
  async getBoxDirHandle(boxId, boxesList, create = true) {
    if (!this.rootHandle || this.permissionState !== 'granted') return null;
    if (!boxId) return this.rootHandle;
    const chain = [];
    let curr = boxesList.find((b) => b.id === boxId);
    const visited = new Set();
    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      chain.unshift(curr);
      curr = curr.parentId ? boxesList.find((b) => b.id === curr.parentId) : null;
    }
    if (chain.length === 0) return null;

    try {
      let dir = this.rootHandle;
      for (const b of chain) {
        const folderName = this.sanitizeName(b.name);
        dir = await dir.getDirectoryHandle(folderName, { create });
      }
      return dir;
    } catch (err) {
      if (!create && (err.name === 'NotFoundError' || err.code === 8)) {
        return null;
      }
      throw err;
    }
  }

  async writeJsonFile(dirHandle, filename, dataObj) {
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(dataObj, null, 2));
    await writable.close();
  }

  async readJsonFile(dirHandle, filename) {
    try {
      const fileHandle = await dirHandle.getFileHandle(filename, { create: false });
      const file = await fileHandle.getFile();
      const text = await file.text();
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }

  async writeRawFile(dirHandle, filename, contentBlob, textContent) {
    const safeName = this.sanitizeName(filename);
    const fileHandle = await dirHandle.getFileHandle(safeName, { create: true });
    const writable = await fileHandle.createWritable();
    if (textContent != null && (!contentBlob || contentBlob.size === 0)) {
      await writable.write(textContent);
    } else if (contentBlob) {
      await writable.write(contentBlob);
    } else if (textContent != null) {
      await writable.write(textContent);
    }
    await writable.close();
  }

  // 同步单个箱子的元数据 (_历史存档/box-meta.json)
  async syncBoxMeta(box, allBoxes, boxFiles) {
    if (!this.isReady() || !box) return;
    const meta = {
      id: box.id,
      name: box.name,
      icon: box.icon || '📦',
      theme: box.theme || 'indigo',
      order: box.order || 1,
      isStarred: Boolean(box.isStarred),
      starredOrder: box.starredOrder || 0,
      createdAt: box.createdAt,
      updatedAt: box.updatedAt,
      filesMeta: (boxFiles || []).map((f) => ({
        id: f.id,
        name: f.name,
        note: f.note || '',
        order: f.order || 1,
        isStarred: Boolean(f.isStarred),
        starredOrder: f.starredOrder || 0,
        updatedAt: f.updatedAt
      }))
    };

    if (this.nativeServerActive) {
      try {
        const boxChain = this.getBoxNameChain(box.id, allBoxes);
        await fetch(`${LOCAL_APP_API}/api/fs-op`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'write-meta', boxChain, boxMeta: meta })
        });
      } catch (e) {}
    }

    if (!this.rootHandle || this.permissionState !== 'granted') return;
    try {
      const boxDir = await this.getBoxDirHandle(box.id, allBoxes, true);
      if (!boxDir) return;
      const archiveDir = await boxDir.getDirectoryHandle(ARCHIVE_DIR_NAME, { create: true });
      await this.writeJsonFile(archiveDir, BOX_META_FILE, meta);
    } catch (err) {
      console.warn('同步箱子元数据失败:', err);
    }
  }

  // 同步写入单个真实文件到箱子目录
  async syncFileWrite(file, allBoxes, allFiles) {
    if (!this.isReady() || !file) return;
    const box = allBoxes.find((b) => b.id === file.boxId);
    const boxFiles = allFiles.filter((f) => f.boxId === file.boxId);

    if (this.nativeServerActive) {
      try {
        const boxChain = this.getBoxNameChain(file.boxId, allBoxes);
        const base64Data = file.contentBlob ? await blobToBase64(file.contentBlob) : undefined;
        await fetch(`${LOCAL_APP_API}/api/fs-op`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            op: 'write-file',
            boxChain,
            fileName: file.name,
            base64Data,
            textContent: file.textContent ?? undefined
          })
        });
      } catch (e) {}
    }

    await this.syncBoxMeta(box, allBoxes, boxFiles);

    if (!this.rootHandle || this.permissionState !== 'granted') return;
    try {
      const boxDir = await this.getBoxDirHandle(file.boxId, allBoxes, true);
      if (!boxDir) return;
      await this.writeRawFile(boxDir, file.name, file.contentBlob, file.textContent);
    } catch (err) {
      console.warn('同步写入本地文件失败:', err);
    }
  }

  // 从箱子目录删除单个真实文件
  async syncFileDelete(file, allBoxes, allFiles) {
    if (!this.isReady() || !file) return;
    const box = allBoxes.find((b) => b.id === file.boxId);
    const boxFiles = allFiles.filter((f) => f.boxId === file.boxId && f.id !== file.id);

    if (this.nativeServerActive) {
      try {
        const boxChain = this.getBoxNameChain(file.boxId, allBoxes);
        await fetch(`${LOCAL_APP_API}/api/fs-op`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            op: 'delete-file',
            boxChain,
            fileName: file.name
          })
        });
      } catch (e) {}
    }

    await this.syncBoxMeta(box, allBoxes, boxFiles);

    if (!this.rootHandle || this.permissionState !== 'granted') return;
    try {
      const boxDir = await this.getBoxDirHandle(file.boxId, allBoxes, false);
      if (!boxDir) return;
      
      const fileName = this.sanitizeName(file.name);
      try {
        await boxDir.removeEntry(fileName);
      } catch (err) {
        if (err.name !== 'NotFoundError' && err.code !== 8) {
          console.warn('删除本地文件时发生异常:', err);
        }
      }
    } catch (err) {
      console.warn('删除本地文件失败:', err);
    }
  }

  // 删除整个箱子对应的真实目录
  async syncBoxDelete(box, allBoxes) {
    if (!this.isReady() || !box) return;
    if (this.nativeServerActive) {
      try {
        const boxChain = this.getBoxNameChain(box.id, allBoxes);
        await fetch(`${LOCAL_APP_API}/api/fs-op`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'delete-box', boxChain })
        });
      } catch (e) {}
    }

    if (!this.rootHandle || this.permissionState !== 'granted') return;
    try {
      let parentDir = this.rootHandle;
      if (box.parentId) {
        parentDir = await this.getBoxDirHandle(box.parentId, allBoxes, false);
      }
      if (parentDir) {
        const folderName = this.sanitizeName(box.name);
        try {
          await parentDir.removeEntry(folderName, { recursive: true });
        } catch (err) {
          if (err.name !== 'NotFoundError' && err.code !== 8) {
            console.warn('删除本地箱子目录异常:', err);
          }
        }
      }
    } catch (err) {
      console.warn('删除本地箱子文件夹失败:', err);
    }
  }

  // 同步箱子级手动存档：在 <箱子目录>/_历史存档/ 下创建 vN_时间_备注 文件夹并写入所有真实历史文件
  async syncSnapshotCreate(snapshot, allBoxes) {
    if (!this.isReady() || !snapshot) return;
    const snapFolderName = this.getSnapshotFolderName(snapshot);
    const snapMeta = {
      id: snapshot.id,
      boxId: snapshot.boxId,
      versionNum: snapshot.versionNum,
      archiveNote: snapshot.archiveNote,
      createdAt: snapshot.createdAt,
      folderName: snapFolderName,
      filesMeta: (snapshot.filesSnapshot || []).map((sf) => ({
        id: sf.id,
        name: sf.name,
        ext: sf.ext,
        mimeType: sf.mimeType,
        size: sf.size,
        note: sf.note || '',
        order: sf.order || 1,
        createdAt: sf.createdAt,
        updatedAt: sf.updatedAt
      }))
    };

    if (this.nativeServerActive) {
      try {
        const boxChain = this.getBoxNameChain(snapshot.boxId, allBoxes);
        const serializedFiles = [];
        for (const sf of snapshot.filesSnapshot || []) {
          serializedFiles.push({
            name: sf.name,
            base64Data: sf.contentBlob ? await blobToBase64(sf.contentBlob) : undefined,
            textContent: sf.textContent ?? undefined
          });
        }
        await fetch(`${LOCAL_APP_API}/api/fs-op`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            op: 'create-snapshot',
            boxChain,
            snapshot: {
              versionNum: snapshot.versionNum,
              archiveNote: snapshot.archiveNote,
              createdAt: snapshot.createdAt,
              meta: snapMeta,
              files: serializedFiles
            }
          })
        });
      } catch (e) {}
    }

    if (!this.rootHandle || this.permissionState !== 'granted') return;
    try {
      const boxDir = await this.getBoxDirHandle(snapshot.boxId, allBoxes, true);
      if (!boxDir) return;
      const archiveDir = await boxDir.getDirectoryHandle(ARCHIVE_DIR_NAME, { create: true });
      const snapDir = await archiveDir.getDirectoryHandle(snapFolderName, { create: true });

      // 1. 写入该版本下所有真实历史文件副本
      for (const sf of snapshot.filesSnapshot || []) {
        await this.writeRawFile(snapDir, sf.name, sf.contentBlob, sf.textContent);
      }

      // 2. 写入 snapshot-meta.json 保存该版本的元信息与各文件当时的备注/排序
      await this.writeJsonFile(snapDir, SNAP_META_FILE, snapMeta);
    } catch (err) {
      console.warn('写入本地历史存档文件夹失败:', err);
    }
  }

  // 删除某个箱子历史存档对应的本地文件夹
  async syncSnapshotDelete(snapshot, allBoxes) {
    if (!this.isReady() || !snapshot) return;
    try {
      const boxDir = await this.getBoxDirHandle(snapshot.boxId, allBoxes, false);
      if (!boxDir) return;
      const archiveDir = await boxDir.getDirectoryHandle(ARCHIVE_DIR_NAME, { create: false });
      const expectedName = this.getSnapshotFolderName(snapshot);

      for await (const [entryName, entryHandle] of archiveDir.entries()) {
        if (entryHandle.kind === 'directory') {
          if (entryName === expectedName || entryName.startsWith(`v${snapshot.versionNum}_`)) {
            await archiveDir.removeEntry(entryName, { recursive: true });
          }
        }
      }
    } catch (err) {
      console.warn('删除本地历史存档文件夹失败:', err);
    }
  }

  // 回滚箱子版本时：清空箱子当前目录下的旧文件（保留子箱子和 _历史存档），写入回滚版本的真实文件
  async syncBoxRollback(boxId, restoredFiles, allBoxes) {
    if (!this.isReady()) return;
    try {
      const boxDir = await this.getBoxDirHandle(boxId, allBoxes, true);
      if (!boxDir) return;

      // 删除当前箱子目录下的普通文件（不动子目录）
      const toRemove = [];
      for await (const [entryName, entryHandle] of boxDir.entries()) {
        if (entryHandle.kind === 'file') {
          toRemove.push(entryName);
        }
      }
      for (const fname of toRemove) {
        await boxDir.removeEntry(fname);
      }

      // 写入回滚后的全部文件
      for (const rf of restoredFiles) {
        await this.writeRawFile(boxDir, rf.name, rf.contentBlob, rf.textContent);
      }

      const box = allBoxes.find((b) => b.id === boxId);
      await this.syncBoxMeta(box, allBoxes, restoredFiles);
    } catch (err) {
      console.warn('回滚本地箱子目录文件失败:', err);
    }
  }

  // 将 IndexedDB 中的所有箱子、文件、历史存档全量同步写出到本地文件夹
  async fullSyncDBToDisk() {
    if (!this.isReady()) return;
    const allBoxes = await window.boxDB.getAllBoxes();
    const allFiles = await window.boxDB.getAllFiles();
    const allSnapshots = await window.boxDB.getAllSnapshots();

    for (const box of allBoxes) {
      const boxFiles = allFiles.filter((f) => f.boxId === box.id);
      await this.syncBoxMeta(box, allBoxes, boxFiles);
      for (const f of boxFiles) {
        await this.syncFileWrite(f, allBoxes, allFiles);
      }
    }

    // 同步未归入箱子的顶层“快速书籍”
    const rootFiles = allFiles.filter((f) => !f.boxId);
    for (const rf of rootFiles) {
      await this.syncFileWrite(rf, allBoxes, allFiles);
    }

    for (const snap of allSnapshots) {
      await this.syncSnapshotCreate(snap, allBoxes);
    }
  }

  // 从本地文件夹反向扫描读取箱子、真实文件和 _历史存档
  async syncFromDiskToDB(mergeWithExisting = false) {
    if (!this.rootHandle || this.permissionState !== 'granted') return;

    const diskBoxes = [];
    const diskFiles = [];
    const diskSnapshots = [];

    const scanBoxDir = async (dirHandle, boxName, parentBoxId, orderIndex) => {
      let archiveDir = null;
      try {
        archiveDir = await dirHandle.getDirectoryHandle(ARCHIVE_DIR_NAME, { create: false });
      } catch (e) {}

      const boxMeta = archiveDir ? await this.readJsonFile(archiveDir, BOX_META_FILE) : null;
      const boxId = (boxMeta && boxMeta.id) || `box_disk_${parentBoxId || 'root'}_${boxName}`;
      const now = Date.now();

      const boxObj = {
        id: boxId,
        name: boxName,
        parentId: parentBoxId || null,
        icon: (boxMeta && boxMeta.icon) || '📦',
        theme: (boxMeta && boxMeta.theme) || 'indigo',
        order: (boxMeta && boxMeta.order) || orderIndex,
        isStarred: Boolean(boxMeta && boxMeta.isStarred),
        starredOrder: (boxMeta && boxMeta.starredOrder) || 0,
        createdAt: (boxMeta && boxMeta.createdAt) || now,
        updatedAt: (boxMeta && boxMeta.updatedAt) || now
      };
      diskBoxes.push(boxObj);

      const filesMetaMap = new Map();
      if (boxMeta && Array.isArray(boxMeta.filesMeta)) {
        for (const fm of boxMeta.filesMeta) {
          filesMetaMap.set(fm.name, fm);
        }
      }

      let fileOrder = 1;
      let subBoxOrder = 1;

      for await (const [entryName, entryHandle] of dirHandle.entries()) {
        if (entryName === ARCHIVE_DIR_NAME || entryName.startsWith('.')) continue;

        if (entryHandle.kind === 'directory') {
          await scanBoxDir(entryHandle, entryName, boxId, subBoxOrder++);
        } else if (entryHandle.kind === 'file') {
          const rawFile = await entryHandle.getFile();
          const ext = getExt(rawFile.name) || 'txt';
          const textContent = await readTextIfTextFile(rawFile, ext);
          const defaultMime = ext === 'svg' ? 'image/svg+xml' : 'application/octet-stream';
          const blob = new Blob([await rawFile.arrayBuffer()], {
            type: rawFile.type || defaultMime
          });

          const savedMeta = filesMetaMap.get(rawFile.name);
          diskFiles.push({
            id: (savedMeta && savedMeta.id) || `file_disk_${boxId}_${rawFile.name}`,
            boxId,
            name: rawFile.name,
            ext,
            mimeType: rawFile.type || defaultMime,
            size: rawFile.size,
            contentBlob: blob,
            textContent,
            note: (savedMeta && savedMeta.note) || '',
            order: (savedMeta && savedMeta.order) || fileOrder++,
            isStarred: Boolean(savedMeta && savedMeta.isStarred),
            starredOrder: (savedMeta && savedMeta.starredOrder) || 0,
            createdAt: rawFile.lastModified || now,
            updatedAt: rawFile.lastModified || now
          });
        }
      }

      // 读取 _历史存档 下的各版本快照目录
      if (archiveDir) {
        for await (const [snapEntryName, snapEntryHandle] of archiveDir.entries()) {
          if (snapEntryHandle.kind !== 'directory') continue;
          const snapMeta = await this.readJsonFile(snapEntryHandle, SNAP_META_FILE);
          if (!snapMeta) continue;

          const snapFilesMetaMap = new Map();
          if (Array.isArray(snapMeta.filesMeta)) {
            for (const sfm of snapMeta.filesMeta) {
              snapFilesMetaMap.set(sfm.name, sfm);
            }
          }

          const filesSnapshot = [];
          for await (const [fName, fHandle] of snapEntryHandle.entries()) {
            if (fName === SNAP_META_FILE || fHandle.kind !== 'file') continue;
            const rawSnapFile = await fHandle.getFile();
            const ext = getExt(rawSnapFile.name) || 'txt';
            const textContent = await readTextIfTextFile(rawSnapFile, ext);
            const defaultMime = ext === 'svg' ? 'image/svg+xml' : 'application/octet-stream';
            const blob = new Blob([await rawSnapFile.arrayBuffer()], {
              type: rawSnapFile.type || defaultMime
            });
            const sfm = snapFilesMetaMap.get(rawSnapFile.name);

            filesSnapshot.push({
              id: (sfm && sfm.id) || `file_disk_${boxId}_${rawSnapFile.name}`,
              boxId,
              name: rawSnapFile.name,
              ext,
              mimeType: rawSnapFile.type || defaultMime,
              size: rawSnapFile.size,
              contentBlob: blob,
              textContent,
              note: (sfm && sfm.note) || '',
              order: (sfm && sfm.order) || 1,
              createdAt: (sfm && sfm.createdAt) || snapMeta.createdAt,
              updatedAt: (sfm && sfm.updatedAt) || rawSnapFile.lastModified
            });
          }

          filesSnapshot.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          diskSnapshots.push({
            id: snapMeta.id || `snap_disk_${boxId}_v${snapMeta.versionNum}`,
            boxId,
            versionNum: snapMeta.versionNum || 1,
            archiveNote: snapMeta.archiveNote || snapEntryName,
            createdAt: snapMeta.createdAt || now,
            filesSnapshot
          });
        }
      }
    };

    let rootOrder = 1;
    let rootFileOrder = 1;
    for await (const [entryName, entryHandle] of this.rootHandle.entries()) {
      if (entryName.startsWith('.') || entryName === ARCHIVE_DIR_NAME) continue;
      if (entryHandle.kind === 'directory') {
        await scanBoxDir(entryHandle, entryName, null, rootOrder++);
      } else if (entryHandle.kind === 'file') {
        const rawFile = await entryHandle.getFile();
        const ext = getExt(rawFile.name) || 'md';
        const textContent = await readTextIfTextFile(rawFile, ext);
        const defaultMime = ext === 'svg' ? 'image/svg+xml' : 'application/octet-stream';
        const blob = new Blob([await rawFile.arrayBuffer()], {
          type: rawFile.type || defaultMime
        });
        const now = Date.now();
        diskFiles.push({
          id: `file_disk_root_${rawFile.name}`,
          boxId: null,
          isQuickBook: true,
          name: rawFile.name,
          ext,
          mimeType: rawFile.type || defaultMime,
          size: rawFile.size,
          contentBlob: blob,
          textContent,
          note: '快速书籍',
          order: rootFileOrder++,
          createdAt: rawFile.lastModified || now,
          updatedAt: rawFile.lastModified || now
        });
      }
    }

    if (diskBoxes.length > 0 || diskFiles.length > 0 || !mergeWithExisting) {
      if (mergeWithExisting && diskBoxes.length === 0 && diskFiles.length === 0) {
        // 如果绑定的是一个全新的空文件夹，保留当前 IndexedDB 里的数据，稍后由 fullSyncDBToDisk 写入该空文件夹
        return;
      }
      await window.boxDB.replaceAllData(diskBoxes, diskFiles, diskSnapshots);
    }
  }
}

window.localSync = new LocalFolderSync();
