/**
 * BoxVault IndexedDB 存储引擎 (v3: 支持保存本地真实目录句柄 FileSystemDirectoryHandle)
 */
const DB_NAME = 'BoxVaultFileManagerDB';
const DB_VERSION = 3;

class BoxVaultDB {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('boxes')) {
          const boxStore = db.createObjectStore('boxes', { keyPath: 'id' });
          boxStore.createIndex('parentId', 'parentId', { unique: false });
          boxStore.createIndex('order', 'order', { unique: false });
        }

        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id' });
          fileStore.createIndex('boxId', 'boxId', { unique: false });
          fileStore.createIndex('order', 'order', { unique: false });
        }

        if (!db.objectStoreNames.contains('snapshots')) {
          const snapStore = db.createObjectStore('snapshots', { keyPath: 'id' });
          snapStore.createIndex('boxId', 'boxId', { unique: false });
          snapStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB 打开失败:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async _tx(storeName, mode = 'readonly') {
    await this.init();
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  // ==================== 配置与目录句柄 (Settings) ====================

  async getSetting(key) {
    const store = await this._tx('settings', 'readonly');
    return new Promise((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => resolve(null);
    });
  }

  async setSetting(key, value) {
    const store = await this._tx('settings', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put({ key, value });
      req.onsuccess = () => resolve(value);
      req.onerror = () => reject(req.error);
    });
  }

  // ==================== 箱子 (Boxes) ====================

  async getAllBoxes() {
    const store = await this._tx('boxes', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result || [];
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveBox(box) {
    const store = await this._tx('boxes', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(box);
      req.onsuccess = () => resolve(box);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteBoxRecursive(boxId) {
    const allBoxes = await this.getAllBoxes();
    const allFiles = await this.getAllFiles();
    const allSnapshots = await this.getAllSnapshots();

    const targetBoxIds = new Set([boxId]);
    let added = true;
    while (added) {
      added = false;
      for (const b of allBoxes) {
        if (b.parentId && targetBoxIds.has(b.parentId) && !targetBoxIds.has(b.id)) {
          targetBoxIds.add(b.id);
          added = true;
        }
      }
    }

    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['boxes', 'files', 'snapshots'], 'readwrite');
      const boxStore = tx.objectStore('boxes');
      const fileStore = tx.objectStore('files');
      const snapStore = tx.objectStore('snapshots');

      for (const id of targetBoxIds) boxStore.delete(id);
      for (const f of allFiles) {
        if (targetBoxIds.has(f.boxId)) fileStore.delete(f.id);
      }
      for (const s of allSnapshots) {
        if (targetBoxIds.has(s.boxId)) snapStore.delete(s.id);
      }

      tx.oncomplete = () => resolve(Array.from(targetBoxIds));
      tx.onerror = () => reject(tx.error);
    });
  }

  // ==================== 文件 (Files) ====================

  async getAllFiles() {
    const store = await this._tx('files', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result || [];
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveFile(file) {
    const store = await this._tx('files', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(file);
      req.onsuccess = () => resolve(file);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteFile(fileId) {
    const store = await this._tx('files', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(fileId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async replaceBoxFiles(boxId, newFiles) {
    const allFiles = await this.getAllFiles();
    const oldBoxFiles = allFiles.filter((f) => f.boxId === boxId);
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      for (const oldF of oldBoxFiles) {
        store.delete(oldF.id);
      }
      for (const newF of newFiles) {
        store.put(newF);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ==================== 箱子存档快照 (Box Snapshots) ====================

  async getAllSnapshots() {
    const store = await this._tx('snapshots', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result || [];
        list.sort((a, b) => b.createdAt - a.createdAt);
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveSnapshot(snapshot) {
    const store = await this._tx('snapshots', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(snapshot);
      req.onsuccess = () => resolve(snapshot);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteSnapshot(id) {
    const store = await this._tx('snapshots', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async updateOrders(storeName, items) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      for (const item of items) {
        store.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async replaceAllData(boxes, files, snapshots) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['boxes', 'files', 'snapshots'], 'readwrite');
      const bStore = tx.objectStore('boxes');
      const fStore = tx.objectStore('files');
      const sStore = tx.objectStore('snapshots');
      bStore.clear();
      fStore.clear();
      sStore.clear();
      for (const b of boxes) bStore.put(b);
      for (const f of files) fStore.put(f);
      for (const s of snapshots) sStore.put(s);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

window.boxDB = new BoxVaultDB();
