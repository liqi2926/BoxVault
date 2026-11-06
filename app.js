/**
 * BoxVault 箱式文件管理系统
 * - 箱子级状态存档与 Git 风格回溯
 * - 极简箱子卡片与文件条目卡片
 */

const BOX_THEMES = [
  { id: 'indigo', accent: '#4f46e5', soft: '#eef2ff' },
  { id: 'amber',  accent: '#d97706', soft: '#fef3c7' },
  { id: 'emerald',accent: '#059669', soft: '#d1fae5' },
  { id: 'sky',    accent: '#0284c7', soft: '#e0f2fe' },
  { id: 'violet', accent: '#7c3aed', soft: '#ede9fe' },
  { id: 'rose',   accent: '#e11d48', soft: '#ffe4e6' }
];

const BOX_ICONS = ['📦', '🗃️', '🧰', '💼', '📁', '📚', '🎨', '🔬', '📑', '🏛️', '🚀', '🔐'];

const ALLOWED_EXTENSIONS = {
  // 1. 文档 (doc)
  md:       { category: 'doc', subType: 'md',     label: 'MD',    badgeClass: 'ext-md',    icon: 'MD',   spine: '#4f46e5' },
  markdown: { category: 'doc', subType: 'md',     label: 'MD',    badgeClass: 'ext-md',    icon: 'MD',   spine: '#4f46e5' },
  txt:      { category: 'doc', subType: 'text',   label: 'TXT',   badgeClass: 'ext-txt',   icon: 'TXT',  spine: '#475569' },
  pdf:      { category: 'doc', subType: 'pdf',    label: 'PDF',   badgeClass: 'ext-pdf',   icon: 'PDF',  spine: '#e11d48' },
  doc:      { category: 'doc', subType: 'office', label: 'Word',  badgeClass: 'ext-word',  icon: 'DOC',  spine: '#2563eb' },
  docx:     { category: 'doc', subType: 'office', label: 'Word',  badgeClass: 'ext-word',  icon: 'DOCX', spine: '#2563eb' },
  xls:      { category: 'doc', subType: 'office', label: 'Excel', badgeClass: 'ext-excel', icon: 'XLS',  spine: '#16a34a' },
  xlsx:     { category: 'doc', subType: 'office', label: 'Excel', badgeClass: 'ext-excel', icon: 'XLSX', spine: '#16a34a' },
  csv:      { category: 'doc', subType: 'text',   label: 'CSV',   badgeClass: 'ext-excel', icon: 'CSV',  spine: '#16a34a' },
  ppt:      { category: 'doc', subType: 'office', label: 'PPT',   badgeClass: 'ext-pptx',  icon: 'PPT',  spine: '#ea580c' },
  pptx:     { category: 'doc', subType: 'office', label: 'PPTX',  badgeClass: 'ext-pptx',  icon: 'PPTX', spine: '#ea580c' },
  rtf:      { category: 'doc', subType: 'office', label: 'RTF',   badgeClass: 'ext-word',  icon: 'RTF',  spine: '#2563eb' },
  epub:     { category: 'doc', subType: 'office', label: 'EPUB',  badgeClass: 'ext-md',    icon: 'EPUB', spine: '#4f46e5' },

  // 2. 图片 (img)
  svg:      { category: 'img', subType: 'img',    label: 'SVG',   badgeClass: 'ext-img',   icon: 'SVG',  spine: '#059669' },
  jpg:      { category: 'img', subType: 'img',    label: 'JPG',   badgeClass: 'ext-img',   icon: 'JPG',  spine: '#059669' },
  jpeg:     { category: 'img', subType: 'img',    label: 'JPEG',  badgeClass: 'ext-img',   icon: 'JPG',  spine: '#059669' },
  png:      { category: 'img', subType: 'img',    label: 'PNG',   badgeClass: 'ext-img',   icon: 'PNG',  spine: '#059669' },
  gif:      { category: 'img', subType: 'img',    label: 'GIF',   badgeClass: 'ext-img',   icon: 'GIF',  spine: '#059669' },
  webp:     { category: 'img', subType: 'img',    label: 'WEBP',  badgeClass: 'ext-img',   icon: 'WEBP', spine: '#059669' },
  bmp:      { category: 'img', subType: 'img',    label: 'BMP',   badgeClass: 'ext-img',   icon: 'BMP',  spine: '#059669' },
  ico:      { category: 'img', subType: 'img',    label: 'ICO',   badgeClass: 'ext-img',   icon: 'ICO',  spine: '#059669' },
  avif:     { category: 'img', subType: 'img',    label: 'AVIF',  badgeClass: 'ext-img',   icon: 'AVIF', spine: '#059669' },

  // 3. 音视频 (media)
  mp4:      { category: 'media', subType: 'video', label: 'MP4',  badgeClass: 'ext-media', icon: 'MP4',  spine: '#7c3aed' },
  webm:     { category: 'media', subType: 'video', label: 'WEBM', badgeClass: 'ext-media', icon: 'WEBM', spine: '#7c3aed' },
  mkv:      { category: 'media', subType: 'video', label: 'MKV',  badgeClass: 'ext-media', icon: 'MKV',  spine: '#7c3aed' },
  mov:      { category: 'media', subType: 'video', label: 'MOV',  badgeClass: 'ext-media', icon: 'MOV',  spine: '#7c3aed' },
  avi:      { category: 'media', subType: 'video', label: 'AVI',  badgeClass: 'ext-media', icon: 'AVI',  spine: '#7c3aed' },
  mp3:      { category: 'media', subType: 'audio', label: 'MP3',  badgeClass: 'ext-media', icon: 'MP3',  spine: '#9333ea' },
  wav:      { category: 'media', subType: 'audio', label: 'WAV',  badgeClass: 'ext-media', icon: 'WAV',  spine: '#9333ea' },
  ogg:      { category: 'media', subType: 'audio', label: 'OGG',  badgeClass: 'ext-media', icon: 'OGG',  spine: '#9333ea' },
  flac:     { category: 'media', subType: 'audio', label: 'FLAC', badgeClass: 'ext-media', icon: 'FLAC', spine: '#9333ea' },
  m4a:      { category: 'media', subType: 'audio', label: 'M4A',  badgeClass: 'ext-media', icon: 'M4A',  spine: '#9333ea' },
  aac:      { category: 'media', subType: 'audio', label: 'AAC',  badgeClass: 'ext-media', icon: 'AAC',  spine: '#9333ea' },

  // 4. 其他 - 压缩包 (other / archive)
  zip:      { category: 'other', subType: 'archive', label: 'ZIP', badgeClass: 'ext-zip',  icon: 'ZIP',  spine: '#d97706' },
  rar:      { category: 'other', subType: 'archive', label: 'RAR', badgeClass: 'ext-zip',  icon: 'RAR',  spine: '#d97706' },
  '7z':     { category: 'other', subType: 'archive', label: '7Z',  badgeClass: 'ext-zip',  icon: '7Z',   spine: '#d97706' },
  tar:      { category: 'other', subType: 'archive', label: 'TAR', badgeClass: 'ext-zip',  icon: 'TAR',  spine: '#d97706' },
  gz:       { category: 'other', subType: 'archive', label: 'GZ',  badgeClass: 'ext-zip',  icon: 'GZ',   spine: '#d97706' },
  tgz:      { category: 'other', subType: 'archive', label: 'TGZ', badgeClass: 'ext-zip',  icon: 'TGZ',  spine: '#d97706' }
};

const state = {
  currentBoxId: null,
  boxes: [],
  files: [],
  snapshots: [],
  searchQuery: '',
  searchTypeFilter: 'all',
  boxFileFilter: 'all',
  sortMode: 'manual',
  fileLayoutMode: localStorage.getItem('boxvault_file_layout') || 'book',
  mobileHistoryExpanded: false,
  editingNoteFileId: null,
  editingQuickBookId: null,
  draggedBoxId: null,
  draggedFileId: null,
  dragSource: null,
  expandedPinnedBoxes: new Set(),
  navHistory: [null],
  navHistoryIdx: 0,
  replacingFileId: null,
  activeObjectUrls: []
};

// ==================== 工具函数 ====================

function uid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatShortTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatSize(bytes) {
  if (bytes == null || isNaN(bytes)) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getExt(filename) {
  const parts = String(filename || '').toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

function getExtMeta(ext) {
  const clean = String(ext || '').toLowerCase();
  return ALLOWED_EXTENSIONS[clean] || {
    category: 'other',
    subType: 'text',
    label: (clean || 'TXT').toUpperCase(),
    badgeClass: 'ext-other',
    icon: (clean || 'TXT').slice(0, 4).toUpperCase(),
    spine: '#64748b'
  };
}

function isTextEditableExt(ext) {
  const meta = getExtMeta(ext);
  return meta.subType === 'md' || meta.subType === 'text';
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderSimpleMarkdown(mdText) {
  let html = escapeHtml(mdText || '');
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.trim()}</code></pre>`);
  html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');
  html = html.replace(/^&gt; (.*)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/^- (.*)$/gm, '• $1<br>');
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  return `<p>${html}</p>`;
}

function showToast(msg, icon = '✓') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${icon}</span><span>${escapeHtml(msg)}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.2s';
    setTimeout(() => el.remove(), 200);
  }, 1800);
}

function clearObjectUrls() {
  for (const url of state.activeObjectUrls) {
    try { URL.revokeObjectURL(url); } catch (e) {}
  }
  state.activeObjectUrls = [];
}

function createManagedBlobUrl(blob) {
  const url = URL.createObjectURL(blob);
  state.activeObjectUrls.push(url);
  return url;
}

// ==================== 初始化 ====================

async function initApp() {
  await window.boxDB.init();
  if (window.localSync) {
    await window.localSync.initFromDB();
  }
  await cleanupLegacyInstantToolbox();
  await reloadAllData();
  if (window.localSync && window.localSync.nativeServerActive) {
    window.localSync.fullSyncDBToDisk().catch(() => {});
  }
  bindGlobalEvents();
  renderAll();
}

async function cleanupLegacyInstantToolbox() {
  const existingBoxes = await window.boxDB.getAllBoxes();
  const legacyBoxes = existingBoxes.filter(
    (b) => b.id === 'box_instant_toolbox' || (!b.parentId && b.name === '即时工具箱')
  );
  if (legacyBoxes.length === 0) return;

  const allFiles = await window.boxDB.getAllFiles();
  for (const lb of legacyBoxes) {
    const insideFiles = allFiles.filter((f) => f.boxId === lb.id);
    for (const f of insideFiles) {
      f.boxId = null;
      f.isQuickBook = true;
      await window.boxDB.saveFile(f);
    }
    if (window.localSync && window.localSync.isReady()) {
      await window.localSync.syncBoxDelete(lb, existingBoxes);
    }
    await window.boxDB.deleteBoxRecursive(lb.id);
  }
}

async function reloadAllData() {
  state.boxes = await window.boxDB.getAllBoxes();
  state.files = await window.boxDB.getAllFiles();
  state.snapshots = await window.boxDB.getAllSnapshots();
}

// ==================== 顶部导航与主控 ====================

function renderAll() {
  const dirScroll = document.querySelector('.dir-tree-scroll');
  const prevScrollTop = dirScroll ? dirScroll.scrollTop : null;

  renderHeader();
  renderMainContent();

  const restoreDirScroll = () => {
    const newDirScroll = document.querySelector('.dir-tree-scroll');
    if (newDirScroll) {
      if (prevScrollTop !== null) {
        newDirScroll.scrollTop = prevScrollTop;
      }
      const activeNode = newDirScroll.querySelector('.dir-tree-node.active');
      if (activeNode) {
        activeNode.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      }
    }
  };
  restoreDirScroll();
  requestAnimationFrame(restoreDirScroll);
}

function getBoxTheme(themeId) {
  return BOX_THEMES.find((t) => t.id === themeId) || BOX_THEMES[0];
}

function getBoxChain(boxId) {
  const chain = [];
  let curr = state.boxes.find((b) => b.id === boxId);
  const visited = new Set();
  while (curr && !visited.has(curr.id)) {
    visited.add(curr.id);
    chain.unshift(curr);
    curr = curr.parentId ? state.boxes.find((b) => b.id === curr.parentId) : null;
  }
  return chain;
}

function renderLocalFolderActionBtn() {
  if (!window.localSync) return '';
  if (window.localSync.rootHandle && window.localSync.permissionState === 'prompt') {
    const folderName = escapeHtml(window.localSync.rootHandle.name);
    return `
      <button class="btn btn-amber" onclick="handleRestoreLocalFolder()" title="点击恢复对该本地文件夹的读写授权">🔗 恢复目录: ${folderName}</button>
      <button class="btn" onclick="handleBindLocalFolder()" title="切换本地存储文件夹">切换目录</button>
    `;
  }
  if (window.localSync.isReady()) {
    const folderName = escapeHtml(window.localSync.getDisplayFolderName());
    const canRescan = Boolean(window.localSync.rootHandle && window.localSync.permissionState === 'granted');
    const canOpenExplorer = Boolean(window.localSync.nativeServerActive);
    return `
      ${canOpenExplorer ? `<button class="btn" onclick="handleOpenInExplorer()" title="在 Windows 资源管理器中打开当前目录 (${escapeHtml(window.localSync.nativeVaultDir)})">📂 ${folderName}</button>` : ''}
      ${canRescan ? `<button class="btn" onclick="handleRescanLocalFolder()" title="从本地文件夹重新扫描同步 (${folderName})">${canOpenExplorer ? '↻' : `📂 ${folderName} ↻`}</button>` : ''}
      <button class="btn" onclick="handleBindLocalFolder()" title="切换本地存储文件夹">切换目录</button>
      ${canOpenExplorer ? `<button class="btn btn-danger" onclick="handleShutdownServer()" title="关闭 BoxVault 本地后台服务">⏻ 关闭服务</button>` : ''}
    `;
  }
  return `
    <button class="btn" onclick="handleBindLocalFolder()" title="绑定本机真实文件夹，所有箱子、文件与历史存档将直接存为本地真实文件">📂 绑定本地文件夹</button>
  `;
}

async function handleShutdownServer() {
  if (!window.localSync || !window.localSync.nativeServerActive) return;
  if (!confirm('确定关闭 BoxVault 本地后台服务吗？')) return;
  await window.localSync.shutdownNativeServer();
  renderAll();
  showToast('本地后台服务已关闭', '⏻');
}

async function handleOpenInExplorer() {
  if (!window.localSync) return;
  await window.localSync.openInExplorer(state.currentBoxId, state.boxes);
}

async function handleBindLocalFolder() {
  if (!window.localSync) return;
  const ok = await window.localSync.pickAndBindFolder();
  if (ok) {
    await cleanupLegacyInstantToolbox();
    await reloadAllData();
    renderAll();
    showToast(`已绑定本地文件夹「${window.localSync.getDisplayFolderName()}」`, '📂');
  }
}

async function handleRestoreLocalFolder() {
  if (!window.localSync) return;
  const ok = await window.localSync.requestSavedPermission();
  if (ok) {
    await cleanupLegacyInstantToolbox();
    await reloadAllData();
    renderAll();
    showToast(`已连接本地文件夹「${window.localSync.rootHandle.name}」`, '📂');
  }
}

async function handleRescanLocalFolder() {
  if (!window.localSync || !window.localSync.isReady()) return;
  await window.localSync.syncFromDiskToDB(false);
  await cleanupLegacyInstantToolbox();
  await reloadAllData();
  renderAll();
  showToast('已同步本地文件夹最新内容', '↻');
}

function renderHeader() {
  const bc = document.getElementById('breadcrumbs');
  const actions = document.getElementById('headerActions');

  const chain = state.currentBoxId ? getBoxChain(state.currentBoxId) : [];
  let html = `<span class="crumb-item ${!state.currentBoxId ? 'active' : ''}" onclick="navigateToBox(null)">全部箱子</span>`;

  for (let i = 0; i < chain.length; i++) {
    const b = chain[i];
    const isLast = i === chain.length - 1;
    html += `<span class="crumb-sep">/</span>`;
    html += `<span class="crumb-item ${isLast ? 'active' : ''}" onclick="navigateToBox('${b.id}')">${escapeHtml(b.icon || '📦')} ${escapeHtml(b.name)}</span>`;
  }
  if (bc) bc.innerHTML = html;

  if (actions) {
    const folderBtnHtml = renderLocalFolderActionBtn();
    if (state.currentBoxId) {
      actions.innerHTML = `
        ${folderBtnHtml}
        <button class="btn" onclick="openBoxModal('${state.currentBoxId}')" title="箱子设置">⚙</button>
      `;
    } else {
      actions.innerHTML = `
        ${folderBtnHtml}
      `;
    }
  }

  const newBoxFab = document.getElementById('newBoxFab');
  const newBoxFabLabel = document.getElementById('newBoxFabLabel');
  if (newBoxFab && newBoxFabLabel) {
    if (state.currentBoxId) {
      newBoxFabLabel.textContent = '新建子箱';
      newBoxFab.title = '在当前箱子内新建子箱子';
    } else {
      newBoxFabLabel.textContent = '新建箱子';
      newBoxFab.title = '新建箱子';
    }
  }

  const createDocFab = document.getElementById('createDocFab');
  if (createDocFab) {
    createDocFab.style.display = state.currentBoxId ? 'flex' : 'none';
  }
}

// ==================== “我有idea！” (屏幕中央弹窗创建/编辑，展示在页面右侧「速记书籍」栏) ====================

function openQuickIdeaModal(fileId = null) {
  const modal = document.getElementById('quickIdeaModal');
  const titleEl = document.getElementById('quickIdeaModalTitle');
  const titleInput = document.getElementById('quickIdeaTitleInput');
  const contentInput = document.getElementById('quickIdeaContentInput');
  if (!modal || !titleInput || !contentInput) return;

  const existing = fileId ? state.files.find((f) => f.id === fileId) : null;
  state.editingQuickBookId = existing ? existing.id : null;

  if (existing) {
    const origExt = existing.ext || 'md';
    const suffix = `.${origExt}`;
    const baseTitle = existing.name.toLowerCase().endsWith(suffix.toLowerCase())
      ? existing.name.slice(0, -suffix.length)
      : existing.name;
    if (titleEl) titleEl.textContent = '💡 编辑速记书籍';
    titleInput.value = baseTitle;
    contentInput.value = existing.textContent || '';
  } else {
    if (titleEl) titleEl.textContent = '💡 我有idea！· 新建速记书籍';
    titleInput.value = '';
    contentInput.value = '';
  }

  modal.classList.add('open');
  setTimeout(() => {
    contentInput.focus();
    if (existing) {
      contentInput.selectionStart = contentInput.selectionEnd = contentInput.value.length;
    }
  }, 40);
}

function closeQuickIdeaModal() {
  const modal = document.getElementById('quickIdeaModal');
  if (modal) modal.classList.remove('open');
  state.editingQuickBookId = null;
}

async function saveQuickIdeaFromModal() {
  const titleInput = document.getElementById('quickIdeaTitleInput');
  const contentInput = document.getElementById('quickIdeaContentInput');
  const rawTitle = titleInput ? titleInput.value.trim() : '';
  const content = contentInput ? contentInput.value : '';

  if (!content.trim() && !rawTitle) {
    showToast('请填写速记内容或标题', '!');
    return;
  }

  const now = Date.now();
  const editingId = state.editingQuickBookId;
  const existing = editingId ? state.files.find((f) => f.id === editingId) : null;

  const origExt = existing ? (existing.ext || 'md') : 'md';
  const suffix = `.${origExt}`;

  let newBase = rawTitle;
  if (newBase && newBase.toLowerCase().endsWith(suffix.toLowerCase())) {
    newBase = newBase.slice(0, -suffix.length).trim();
  }

  if (!newBase) {
    const firstLine = content.trim().split('\n')[0].replace(/[\\/:*?"<>|#]/g, '').trim().slice(0, 18);
    newBase = firstLine || `速记_${formatShortTime(now).replace(':', '')}`;
  }

  const fileName = `${newBase}${suffix}`;
  const mime = origExt === 'md' ? 'text/markdown' : 'text/plain';
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });

  let savedFile = null;
  let oldName = null;

  if (existing) {
    oldName = existing.name;
    existing.name = fileName;
    existing.ext = origExt;
    existing.textContent = content;
    existing.contentBlob = blob;
    existing.size = blob.size;
    existing.updatedAt = now;
    await window.boxDB.saveFile(existing);
    savedFile = existing;
  } else {
    const rootFiles = state.files.filter((f) => !f.boxId);
    const maxOrder = rootFiles.reduce((m, f) => Math.max(m, f.order || 0), 0);
    savedFile = {
      id: uid('file'),
      boxId: null,
      isQuickBook: true,
      name: fileName,
      ext: origExt,
      mimeType: mime,
      size: blob.size,
      contentBlob: blob,
      textContent: content,
      note: '速记书籍',
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now
    };
    await window.boxDB.saveFile(savedFile);
  }

  closeQuickIdeaModal();

  // 保存后若不在主界面，自动切回主界面以展示右侧速记书籍
  state.currentBoxId = null;
  state.searchQuery = '';
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) searchInput.value = '';

  await reloadAllData();

  if (window.localSync && window.localSync.isReady() && savedFile) {
    if (oldName && oldName !== savedFile.name) {
      await window.localSync.syncFileDelete({ ...savedFile, name: oldName }, state.boxes, state.files);
    }
    await window.localSync.syncFileWrite(savedFile, state.boxes, state.files);
  }

  renderAll();
  showToast(existing ? '速记书籍已更新' : '已添加至右侧「速记书籍」，可拖入任意箱子', '💡');
}

function navigateToBox(boxId, fromHistory = false) {
  const targetId = boxId || null;
  if (!fromHistory) {
    if (!state.navHistory) {
      state.navHistory = [state.currentBoxId || null];
      state.navHistoryIdx = 0;
    }
    if (state.navHistory[state.navHistoryIdx] !== targetId) {
      state.navHistory = state.navHistory.slice(0, state.navHistoryIdx + 1);
      state.navHistory.push(targetId);
      state.navHistoryIdx = state.navHistory.length - 1;
      try {
        history.pushState({ boxId: targetId }, '', '');
      } catch (e) {}
    }
  }

  state.currentBoxId = targetId;
  state.editingNoteFileId = null;
  state.boxFileFilter = 'all';
  state.mobileHistoryExpanded = false;
  renderAll();
}

function navigateHistoryBack() {
  const openModal = document.querySelector('.modal-backdrop.open');
  if (openModal) {
    if (openModal.id === 'quickIdeaModal') closeQuickIdeaModal();
    else if (openModal.id === 'boxModal') closeBoxModal();
    else if (openModal.id === 'createDocModal') closeCreateDocModal();
    else if (openModal.id === 'manualArchiveModal') closeManualArchiveModal();
    else if (openModal.id === 'diffModal') closeDiffModal();
    else if (openModal.id === 'previewModal') closePreviewModal();
    else openModal.classList.remove('open');
    return true;
  }

  if (state.navHistory && state.navHistoryIdx > 0) {
    state.navHistoryIdx--;
    const targetBoxId = state.navHistory[state.navHistoryIdx];
    navigateToBox(targetBoxId, true);
    return true;
  }
  return false;
}

function navigateHistoryForward() {
  if (state.navHistory && state.navHistoryIdx < state.navHistory.length - 1) {
    state.navHistoryIdx++;
    const targetBoxId = state.navHistory[state.navHistoryIdx];
    navigateToBox(targetBoxId, true);
    return true;
  }
  return false;
}

function toggleMobileHistory() {
  state.mobileHistoryExpanded = !state.mobileHistoryExpanded;
  const section = document.getElementById('gitHistorySection');
  if (section) {
    section.classList.toggle('mobile-expanded', state.mobileHistoryExpanded);
  }
}

// ==================== 主视图渲染 ====================

function renderMainContent() {
  const container = document.getElementById('mainView');
  if (!container) return;

  if (state.searchQuery.trim() || state.searchTypeFilter !== 'all') {
    container.innerHTML = `<div class="root-boxes-view">${renderGlobalSearchResults()}</div>`;
    return;
  }

  if (!state.currentBoxId) {
    const rootBoxes = state.boxes
      .filter((b) => !b.parentId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    container.innerHTML = `
      <div class="root-workspace">
        ${renderPinnedSidebar()}
        <div class="root-boxes-view">${renderBoxesGrid(rootBoxes)}</div>
        ${renderQuickBooksSidebar()}
      </div>
    `;
    return;
  }

  const currentBox = state.boxes.find((b) => b.id === state.currentBoxId);
  if (!currentBox) {
    state.currentBoxId = null;
    renderAll();
    return;
  }

  container.innerHTML = `
    <div class="box-workspace">
      ${renderGitSidebar(currentBox.id)}
      ${renderBoxRightPane(currentBox.id)}
    </div>
  `;
  bindImportCardDropzone();
}

// ==================== 0. 全部箱子左侧「重点」快速定位栏 ====================

function togglePinnedBoxExpand(boxId) {
  if (!state.expandedPinnedBoxes) state.expandedPinnedBoxes = new Set();
  if (state.expandedPinnedBoxes.has(boxId)) {
    state.expandedPinnedBoxes.delete(boxId);
  } else {
    state.expandedPinnedBoxes.add(boxId);
  }
  const aside = document.querySelector('.pinned-sidebar');
  if (aside && aside.parentElement) {
    aside.outerHTML = renderPinnedSidebar();
  } else {
    renderAll();
  }
}

function onPinnedBoxDragStart(e, boxId) {
  state.draggedBoxId = boxId;
  state.dragSource = 'pinned';
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  // 重点栏箱子不支持拖拽删除，显式不触发垃圾桶
}

// 重点栏内的文件拖拽：保留拖出到外部程序 / 拖入其他箱子的能力，但不触发垃圾桶删除
function onPinnedFileDragStart(e, fileId) {
  e.stopPropagation();
  onFileDragStart(e, fileId);
  state.dragSource = 'pinned';
  hideDragTrashBin();
}

function renderPinnedFileRow(f, { pinned = false } = {}) {
  const ext = (f.ext || getExt(f.name) || '').toLowerCase();
  const meta = getExtMeta(ext);
  const parentBox = f.boxId ? state.boxes.find((b) => b.id === f.boxId) : null;
  return `
    <div class="pinned-file-row ${pinned ? 'is-pinned-file' : ''}"
         draggable="true"
         ondragstart="onPinnedFileDragStart(event, '${f.id}')"
         ondragend="onFileDragEnd(event)"
         onclick="event.stopPropagation(); openFileNatively('${f.id}')"
         title="点击用默认程序打开「${escapeHtml(f.name)}」${parentBox ? `&#10;所在箱子：${escapeHtml(parentBox.name)}` : ''}">
      <span class="pinned-file-tag ${meta.badgeClass}">${meta.icon}</span>
      <span class="pinned-file-name">${escapeHtml(f.name)}</span>
      ${pinned && parentBox ? `
        <span class="pinned-file-locate" title="跳转到所在箱子「${escapeHtml(parentBox.name)}」"
              onclick="event.stopPropagation(); navigateToBox('${parentBox.id}')">📂</span>
      ` : ''}
      <span class="pinned-file-ext-open" title="用系统默认程序打开">↗</span>
      ${pinned ? `
        <button class="icon-btn pinned-item-remove pinned-file-remove"
                onclick="event.stopPropagation(); unpinFile('${f.id}')"
                title="从重点中移出">✕</button>
      ` : ''}
    </div>
  `;
}

function renderPinnedSidebar() {
  const pinnedBoxes = state.boxes
    .filter((b) => b.isStarred)
    .sort((a, b) => (a.starredOrder ?? a.order ?? 0) - (b.starredOrder ?? b.order ?? 0));
  const pinnedFiles = state.files
    .filter((f) => f.isStarred)
    .sort((a, b) => (a.starredOrder ?? 0) - (b.starredOrder ?? 0));
  const totalPinned = pinnedBoxes.length + pinnedFiles.length;

  let contentHtml = '';
  if (totalPinned === 0) {
    contentHtml = `
      <div class="pinned-empty-placeholder">
        <div class="pinned-empty-icon">📌</div>
        <div class="pinned-empty-title">暂无重点内容</div>
        <div class="pinned-empty-sub">将箱子或文件拖拽到此处<br/>固定为「重点」快速定位</div>
      </div>
    `;
  } else {
    const itemsHtml = pinnedBoxes.map((box) => {
      const theme = getBoxTheme(box.theme);
      const boxFiles = state.files.filter((f) => f.boxId === box.id);
      const fileCount = boxFiles.length;
      const subBoxCount = state.boxes.filter((b) => b.parentId === box.id).length;
      const isExpanded = state.expandedPinnedBoxes && state.expandedPinnedBoxes.has(box.id);

      return `
        <div class="pinned-box-group ${isExpanded ? 'is-expanded' : ''}">
          <div class="pinned-box-item"
               draggable="true"
               style="--box-accent:${theme.accent}; --box-bg-soft:${theme.soft}"
               ondragstart="onPinnedBoxDragStart(event, '${box.id}')"
               ondragover="onPinnedItemDragOver(event)"
               ondragleave="onPinnedItemDragLeave(event)"
               ondrop="onPinnedItemDrop(event, '${box.id}')"
               ondragend="onBoxDragEnd(event)"
               onclick="navigateToBox('${box.id}')"
               title="点击进入「${escapeHtml(box.name)}」箱子">
            <div class="pinned-item-icon">${escapeHtml(box.icon || '📦')}</div>
            <div class="pinned-item-info">
              <div class="pinned-item-name" title="${escapeHtml(box.name)}">${escapeHtml(box.name)}</div>
              <div class="pinned-item-meta">${fileCount} 文件${subBoxCount > 0 ? ` · ${subBoxCount} 子箱` : ''}</div>
            </div>
            <div class="pinned-item-actions" onclick="event.stopPropagation()">
              ${fileCount > 0 ? `
                <button class="icon-btn pinned-item-toggle ${isExpanded ? 'expanded' : ''}"
                        onclick="togglePinnedBoxExpand('${box.id}')"
                        title="${isExpanded ? '收起文件' : '展开查看箱内文件'}">
                  ${isExpanded ? '▾' : '▸'}
                </button>
              ` : ''}
              <button class="icon-btn pinned-item-remove"
                      onclick="unpinBox('${box.id}')"
                      title="从重点中移出">✕</button>
            </div>
          </div>
          ${isExpanded ? `
            <div class="pinned-files-tray">
              ${boxFiles.length === 0 ? `
                <div class="pinned-file-empty">箱内暂无文件</div>
              ` : boxFiles.map((f) => renderPinnedFileRow(f)).join('')}
              <div class="pinned-tray-footer" onclick="event.stopPropagation(); navigateToBox('${box.id}')">
                进入箱子查看全部 (${fileCount}) →
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    const pinnedFilesHtml = pinnedFiles.length > 0 ? `
      <div class="pinned-files-group">
        <div class="pinned-group-label">📄 重点文件</div>
        ${pinnedFiles.map((f) => renderPinnedFileRow(f, { pinned: true })).join('')}
      </div>
    ` : '';

    contentHtml = `
      <div class="pinned-items-list">
        ${itemsHtml}
        ${pinnedFilesHtml}
        <div class="pinned-drop-more">+ 拖入箱子或文件添加至重点</div>
      </div>
    `;
  }

  return `
    <aside class="pinned-sidebar"
           ondragover="onPinnedZoneDragOver(event)"
           ondragleave="onPinnedZoneDragLeave(event)"
           ondrop="onPinnedZoneDrop(event)">
      <div class="pinned-sidebar-header">
        <div class="pinned-sidebar-title">
          <span>⭐</span>
          <span>重点</span>
          <span class="git-history-count">${totalPinned}</span>
        </div>
        <span class="pinned-sidebar-hint">快速直达</span>
      </div>
      <div class="pinned-sidebar-scroll">
        ${contentHtml}
      </div>
    </aside>
  `;
}

// ==================== 1. 拟物立体收纳箱网格 (中间主区域) ====================

function renderBoxesGrid(boxes) {
  const cardsHtml = boxes.map((box) => {
    const theme = getBoxTheme(box.theme);
    const boxFiles = state.files.filter((f) => f.boxId === box.id);
    const fileCount = boxFiles.length;
    const subBoxCount = state.boxes.filter((b) => b.parentId === box.id).length;

    // 箱底微缩书脊预览条 (最多展示前 6 个文件的书脊颜色)
    const miniSpinesHtml = boxFiles.slice(0, 6).map((f) => {
      const m = getExtMeta(f.ext);
      return `<span class="box-mini-spine" style="--spine-color:${m.spine || '#6366f1'}"></span>`;
    }).join('');

    return `
      <div class="box-card"
           draggable="true"
           data-box-id="${box.id}"
           style="--box-accent:${theme.accent}; --box-bg-soft:${theme.soft}"
           ondragstart="onBoxDragStart(event, '${box.id}')"
           ondragover="onBoxDragOver(event)"
           ondragleave="onBoxDragLeave(event)"
           ondrop="onBoxDrop(event, '${box.id}')"
           ondragend="onBoxDragEnd(event)"
           onclick="navigateToBox('${box.id}')">
        <div class="box-lid"></div>
        <div class="box-body">
          <div class="box-handle-row">
            ${box.isStarred ? `<span class="box-star-badge" title="已固定在左侧「重点」栏">⭐</span>` : ''}
            <div class="box-handle-hole"></div>
            <button class="icon-btn box-card-edit" onclick="event.stopPropagation(); openBoxModal('${box.id}')" title="设置">⚙</button>
          </div>

          <div class="box-label-plate">
            <div class="box-icon-wrap">${escapeHtml(box.icon || '📦')}</div>
            <div class="box-name" title="${escapeHtml(box.name)}">${escapeHtml(box.name)}</div>
          </div>

          <div class="box-card-meta">
            <div class="box-meta-left">
              ${miniSpinesHtml ? `<span class="box-mini-spines">${miniSpinesHtml}</span>` : ''}
              <span>${fileCount} 文件${subBoxCount > 0 ? ` · ${subBoxCount} 子箱` : ''}</span>
            </div>
            <span>${formatShortTime(box.updatedAt)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (!cardsHtml) {
    return `<div class="empty-state">暂无箱子，点击下方「📦 新建箱子」开始创建</div>`;
  }

  return `<div class="boxes-grid">${cardsHtml}</div>`;
}

// ==================== 1.5 主界面右侧「速记书籍」板块 ====================

function renderQuickBooksSidebar() {
  const quickBooks = state.files
    .filter((f) => !f.boxId)
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

  let contentHtml = '';
  if (quickBooks.length === 0) {
    contentHtml = `
      <div class="pinned-empty-placeholder" onclick="openQuickIdeaModal()" style="cursor:pointer">
        <div class="pinned-empty-icon">💡</div>
        <div class="pinned-empty-title">暂无速记书籍</div>
        <div class="pinned-empty-sub">点击下方「我有idea！」<br/>生成速记书籍并可拖入箱子</div>
      </div>
    `;
  } else {
    contentHtml = `
      <div class="quickbooks-list">
        ${quickBooks.map((qf) => renderQuickBookCard(qf)).join('')}
      </div>
    `;
  }

  return `
    <aside class="quickbooks-sidebar">
      <div class="pinned-sidebar-header">
        <div class="pinned-sidebar-title">
          <span>💡</span>
          <span>速记书籍</span>
          <span class="git-history-count">${quickBooks.length}</span>
        </div>
        <span class="pinned-sidebar-hint">可拖入箱子</span>
      </div>
      <div class="quickbooks-sidebar-scroll">
        ${contentHtml}
      </div>
    </aside>
  `;
}

function renderQuickBookCard(file) {
  const excerpt = (file.textContent || '').trim() || '（暂无正文内容，点击卡片编辑）';
  return `
    <div class="quick-book-card"
         draggable="true"
         data-file-id="${file.id}"
         ondragstart="onFileDragStart(event, '${file.id}')"
         ondragend="onFileDragEnd(event)"
         onclick="openQuickIdeaModal('${file.id}')"
         title="点击编辑速记内容，或按住直接拖拽到左侧/中间任意箱子归档">
      <div class="book-top-bar">
        <span class="quick-book-title" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
      </div>
      <div class="quick-book-body">
        <div class="quick-book-excerpt">${escapeHtml(excerpt)}</div>
      </div>
      <div class="book-footer" onclick="event.stopPropagation()">
        <span class="book-time">${formatShortTime(file.updatedAt)}</span>
        <div class="book-actions">
          <button class="btn btn-sm quick-book-open-btn" onclick="openFileNatively('${file.id}')" title="用本地默认程序打开">↗</button>
          <button class="btn btn-sm btn-danger" onclick="confirmDeleteFile('${file.id}')">删除</button>
        </div>
      </div>
    </div>
  `;
}

// ==================== 2. 左侧 Git 风格箱子状态历史树 ====================

function getBoxSignature(filesList) {
  const sorted = [...(filesList || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return JSON.stringify(
    sorted.map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      note: f.note || '',
      order: f.order,
      updatedAt: f.updatedAt
    }))
  );
}

function isBoxChangedSinceLatestSnapshot(boxId) {
  const currentFiles = state.files.filter((f) => f.boxId === boxId);
  const boxSnaps = state.snapshots
    .filter((s) => s.boxId === boxId)
    .sort((a, b) => b.versionNum - a.versionNum);

  const latest = boxSnaps[0];
  if (!latest) {
    return currentFiles.length > 0;
  }
  return getBoxSignature(currentFiles) !== getBoxSignature(latest.filesSnapshot || []);
}

function renderDirectoryNavSection(boxId) {
  const currentBox = state.boxes.find((b) => b.id === boxId);
  const chain = getBoxChain(boxId);
  const chainIds = new Set(chain.map((b) => b.id));
  const currentDepth = chain.length;
  const parentId = currentBox ? (currentBox.parentId || null) : null;

  const buildTreeHtml = (parentBoxId, depth) => {
    const children = state.boxes
      .filter((b) => (b.parentId || null) === (parentBoxId || null))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return children.map((node) => {
      const isCurrent = node.id === boxId;
      const isInPath = chainIds.has(node.id);
      const subChildren = state.boxes.filter((b) => b.parentId === node.id);
      const fileCount = state.files.filter((f) => f.boxId === node.id).length;
      const indentPx = 10 + (depth - 1) * 16;

      // 当前所在根箱子分支完整展开全部层级；其他顶层箱子若无嵌套或也在路径中同样展开
      const shouldRenderChildren = subChildren.length > 0 && (isInPath || depth === 1);
      const childrenHtml = shouldRenderChildren ? buildTreeHtml(node.id, depth + 1) : '';

      return `
        <div class="dir-tree-node ${isCurrent ? 'active' : (isInPath ? 'in-path' : '')}"
             style="padding-left:${indentPx}px"
             ondragover="onBoxDragOver(event)"
             ondragleave="onBoxDragLeave(event)"
             ondrop="onBoxDrop(event, '${node.id}')"
             onclick="navigateToBox('${node.id}')"
             title="点击跳转至「${escapeHtml(node.name)}」(第 ${depth} 级目录，含 ${fileCount} 个文件)">
          ${depth > 1 ? `<span class="dir-tree-branch">└</span>` : ''}
          <span class="dir-tree-icon">${escapeHtml(node.icon || '📦')}</span>
          <span class="dir-tree-name">${escapeHtml(node.name)}</span>
          <span class="dir-tree-level">L${depth}</span>
        </div>
        ${childrenHtml}
      `;
    }).join('');
  };

  const treeHtml = buildTreeHtml(null, 1);

  return `
    <div id="dirNavSection" class="sidebar-dir-nav">
      <div class="git-sidebar-header">
        <div class="git-sidebar-title">
          <span>🧭</span>
          <span>目录导航</span>
          <span class="git-history-count">L${currentDepth}</span>
        </div>
        <button class="btn btn-sm" onclick="navigateToBox(${parentId ? `'${parentId}'` : 'null'})" title="返回上一级目录">
          ↑ 上一级
        </button>
      </div>
      <div class="dir-tree-scroll">
        <div class="dir-tree-node dir-tree-root" onclick="navigateToBox(null)" title="返回全部箱子主界面">
          <span class="dir-tree-icon">🏠</span>
          <span class="dir-tree-name">全部箱子 (根目录)</span>
          <span class="dir-tree-level">L0</span>
        </div>
        ${treeHtml}
      </div>
    </div>
  `;
}

function renderGitSidebar(boxId) {
  const boxSnaps = state.snapshots
    .filter((s) => s.boxId === boxId)
    .sort((a, b) => b.versionNum - a.versionNum);

  const hasChanges = isBoxChangedSinceLatestSnapshot(boxId);

  let nodesHtml = '';

  if (hasChanges) {
    nodesHtml += `
      <div class="git-node working-tree" onclick="openBoxArchiveModal('${boxId}')">
        <div class="git-node-dot"></div>
        <div class="git-node-head">
          <span class="git-commit-msg" style="color:#92400e">当前箱子有未存档变更</span>
          <span class="git-tag" style="background:#fef3c7;color:#b45309">待存档</span>
        </div>
        <div class="git-node-meta">
          <span>点击记录当前箱子状态</span>
          <span style="color:#b45309;font-weight:600">存档 →</span>
        </div>
      </div>
    `;
  }

  if (boxSnaps.length === 0 && !hasChanges) {
    nodesHtml += `
      <div style="padding:32px 10px;text-align:center;color:var(--text-muted);font-size:12px">
        暂无存档
      </div>
    `;
  } else {
    nodesHtml += boxSnaps.map((snap) => {
      const fCount = (snap.filesSnapshot || []).length;
      return `
        <div class="git-node" onclick="openBoxSnapshotModal('${snap.id}')">
          <div class="git-node-dot"></div>
          <div class="git-node-head">
            <span class="git-commit-msg">${escapeHtml(snap.archiveNote || '箱子存档')}</span>
            <span class="git-tag">v${snap.versionNum}</span>
          </div>
          <div class="git-node-meta">
            <span>${fCount} 个文件</span>
            <span>${formatShortTime(snap.createdAt)}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  return `
    <aside class="git-sidebar">
      <!-- 左上角：「重点」快速直达栏（所有页面持续显示，可直接拖入箱子或文件） -->
      ${renderPinnedSidebar()}

      <!-- 左中：目录层级导航树（快速跳转到任意等级目录） -->
      ${renderDirectoryNavSection(boxId)}

      <!-- 左下角：版本历史（窄屏默认折叠，点击头部可展开） -->
      <div id="gitHistorySection" class="git-history-section ${state.mobileHistoryExpanded ? 'mobile-expanded' : ''}">
        <div class="git-sidebar-header" onclick="toggleMobileHistory()">
          <div class="git-sidebar-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><line x1="12" y1="3" x2="12" y2="9"></line><line x1="12" y1="15" x2="12" y2="21"></line></svg>
            <span>版本历史</span>
            <span class="git-history-count">${boxSnaps.length}</span>
            ${hasChanges ? `<span class="git-unsaved-dot" title="当前箱子有未存档变更"></span>` : ''}
            <span class="git-collapse-chevron">▾</span>
          </div>
          <button class="btn btn-sm btn-emerald" onclick="event.stopPropagation(); openBoxArchiveModal('${boxId}')">+ 存档</button>
        </div>
        <div class="git-graph-scroll">
          <div class="git-log-list">
            ${nodesHtml}
          </div>
        </div>
      </div>
    </aside>
  `;
}

// ==================== 3. 右侧箱内文件工作区 ====================

function renderBoxRightPane(boxId) {
  const childBoxes = state.boxes
    .filter((b) => b.parentId === boxId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  let boxFiles = state.files.filter((f) => f.boxId === boxId);

  if (state.boxFileFilter !== 'all') {
    boxFiles = boxFiles.filter((f) => getExtMeta(f.ext).category === state.boxFileFilter);
  }

  boxFiles = [...boxFiles];
  if (state.sortMode === 'manual') {
    boxFiles.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } else if (state.sortMode === 'updatedAt') {
    boxFiles.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  } else if (state.sortMode === 'name') {
    boxFiles.sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-CN'));
  } else if (state.sortMode === 'type') {
    boxFiles.sort((a, b) => String(a.ext).localeCompare(String(b.ext)));
  }

  const filterTabs = [
    { id: 'all',   label: '全部' },
    { id: 'doc',   label: '文档' },
    { id: 'img',   label: '图片' },
    { id: 'media', label: '音视频' },
    { id: 'other', label: '其他' }
  ];

  const tabsHtml = filterTabs.map((t) => `
    <button class="filter-tab ${state.boxFileFilter === t.id ? 'active' : ''}"
            onclick="setBoxFileFilter('${t.id}')">${t.label}</button>
  `).join('');

  let subBoxesHtml = '';
  if (childBoxes.length > 0) {
    subBoxesHtml = `
      <div class="subboxes-strip">
        ${childBoxes.map((sb) => {
          const theme = getBoxTheme(sb.theme);
          const count = state.files.filter((f) => f.boxId === sb.id).length;
          return `
            <div class="subbox-chip"
                 draggable="true"
                 style="--box-accent:${theme.accent}"
                 ondragstart="onBoxDragStart(event, '${sb.id}')"
                 ondragover="onBoxDragOver(event)"
                 ondragleave="onBoxDragLeave(event)"
                 ondrop="onBoxDrop(event, '${sb.id}')"
                 ondragend="onBoxDragEnd(event)"
                 onclick="navigateToBox('${sb.id}')">
              <span>${escapeHtml(sb.icon || '📦')}</span>
              <span>${escapeHtml(sb.name)}</span>
              <span class="subbox-chip-count">${count}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  const isBookMode = state.fileLayoutMode === 'book';
  const importCardHtml = isBookMode
    ? `
      <div id="fileImportCard" class="file-book-card file-import-book-card" onclick="triggerFileUpload()" title="点击选择本地文件导入，或直接将文件拖入此区域">
        <div class="import-book-inner">
          <span class="import-book-plus">＋</span>
          <span class="import-book-title">导入文件</span>
          <span class="import-book-sub">点击选择，或将本地文件<br/>直接拖入箱子任意位置</span>
        </div>
      </div>
    `
    : `
      <div id="fileImportCard" class="file-import-row-card" onclick="triggerFileUpload()" title="点击选择本地文件导入，或直接将文件拖入此区域">
        <span class="import-book-plus">＋</span>
        <span class="import-book-title">导入文件</span>
        <span class="import-book-sub">点击选择，或将本地文件直接拖入箱子任意位置</span>
      </div>
    `;
  const fileItemsHtml = boxFiles.map((file) => (isBookMode ? renderFileBookCard(file) : renderFileItemCard(file))).join('') + importCardHtml;

  return `
    <section class="box-main-pane">
      <div class="box-main-toolbar">
        <div class="filter-tabs">${tabsHtml}</div>
        <div class="toolbar-right-group">
          <div class="view-switcher">
            <button class="view-switch-btn ${!isBookMode ? 'active' : ''}" onclick="setFileLayoutMode('row')">
              ☰ 行排列
            </button>
            <button class="view-switch-btn ${isBookMode ? 'active' : ''}" onclick="setFileLayoutMode('book')">
              📖 书籍
            </button>
          </div>
          <select class="form-select" style="width:auto;padding:4px 8px;font-size:12px" onchange="setSortMode(this.value)">
            <option value="manual" ${state.sortMode === 'manual' ? 'selected' : ''}>手动排序</option>
            <option value="updatedAt" ${state.sortMode === 'updatedAt' ? 'selected' : ''}>按修改时间</option>
            <option value="name" ${state.sortMode === 'name' ? 'selected' : ''}>按名称</option>
            <option value="type" ${state.sortMode === 'type' ? 'selected' : ''}>按类型</option>
          </select>
        </div>
      </div>

      <div class="box-main-scroll" id="boxMainScroll">
        ${subBoxesHtml}

        <!-- 文件条目列表 (行排列 / 书籍卡片排列)，末尾为「导入文件」卡片 -->
        <div class="${isBookMode ? 'files-bookshelf-grid' : 'file-cards-list'}">
          ${fileItemsHtml}
        </div>
        <div class="box-drop-overlay"><div class="box-drop-overlay-text">📥 松开鼠标，导入到当前箱子</div></div>
      </div>
    </section>
  `;
}

function setFileLayoutMode(mode) {
  state.fileLayoutMode = mode;
  try { localStorage.setItem('boxvault_file_layout', mode); } catch (e) {}
  renderMainContent();
}

function renderFileBookCard(file) {
  const meta = getExtMeta(file.ext);
  const spineColor = meta.spine || '#4f46e5';

  let noteHtml = '';
  if (state.editingNoteFileId === file.id) {
    noteHtml = `
      <div class="note-edit-inline" style="width:100%" onclick="event.stopPropagation()">
        <input
          id="noteInput_${file.id}"
          type="text"
          value="${escapeHtml(file.note || '')}"
          placeholder="备注..."
          onkeydown="if(event.key==='Enter') saveFileNote('${file.id}'); if(event.key==='Escape') cancelEditNote();"
          onblur="saveFileNote('${file.id}')"
        />
      </div>
    `;
  } else {
    noteHtml = file.note
      ? `<div class="book-note-text" title="${escapeHtml(file.note)}">${escapeHtml(file.note)}</div>`
      : `<div class="book-note-placeholder">${meta.category === 'img' ? '添加图片备注...' : '添加备注...'}</div>`;
  }

  // 针对图片文件：在 book-note-wrap 上添加唯一样式的背景图片微缩预览
  let imgBgStyle = '';
  let imgBgClass = '';
  if (meta.category === 'img' && file.contentBlob) {
    const imgUrl = createManagedBlobUrl(file.contentBlob);
    imgBgStyle = `background-image: url('${imgUrl}');`;
    imgBgClass = 'has-img-bg';
  }

  return `
    <div class="file-book-card"
         style="--book-spine:${spineColor}"
         draggable="true"
         data-file-id="${file.id}"
         onmouseenter="onFileHoverEnter(event, '${file.id}')"
         onmouseleave="onFileHoverLeave()"
         ondragstart="hideHoverPreview(); onFileDragStart(event, '${file.id}')"
         ondragover="onFileDragOver(event)"
         ondragleave="onFileDragLeave(event)"
         ondrop="onFileDrop(event, '${file.id}')"
         ondragend="onFileDragEnd(event)"
         onclick="hideHoverPreview(); openFileNatively('${file.id}')">
      <div class="book-top-bar">
        <span class="book-ext-tag ${meta.badgeClass}">${meta.icon}</span>
        <span class="drag-handle" title="拖拽调整位置或拖至外部桌面程序">⠿</span>
      </div>

      <div class="book-cover-body">
        <div class="book-title" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
        <div class="book-note-wrap ${imgBgClass}" style="${imgBgStyle}" onclick="event.stopPropagation(); hideHoverPreview(); startEditNote('${file.id}')">
          ${noteHtml}
        </div>
      </div>

      <div class="book-footer">
        <span class="book-time">${formatShortTime(file.updatedAt)}</span>
        <div class="book-actions" onclick="event.stopPropagation(); hideHoverPreview();">
          <button class="btn btn-sm" onclick="renameFile('${file.id}')">重命名</button>
          <button class="btn btn-sm btn-danger" onclick="confirmDeleteFile('${file.id}')">删除</button>
        </div>
      </div>
    </div>
  `;
}

function renderFileItemCard(file) {
  const meta = getExtMeta(file.ext);

  let noteCellHtml = '';
  if (state.editingNoteFileId === file.id) {
    noteCellHtml = `
      <div class="note-edit-inline" onclick="event.stopPropagation()">
        <input
          id="noteInput_${file.id}"
          type="text"
          value="${escapeHtml(file.note || '')}"
          placeholder="备注..."
          onkeydown="if(event.key==='Enter') saveFileNote('${file.id}'); if(event.key==='Escape') cancelEditNote();"
          onblur="saveFileNote('${file.id}')"
        />
      </div>
    `;
  } else {
    noteCellHtml = `
      <div class="note-display" onclick="event.stopPropagation(); hideHoverPreview(); startEditNote('${file.id}')">
        ${
          file.note
            ? `<span class="note-text" title="${escapeHtml(file.note)}">${escapeHtml(file.note)}</span>`
            : `<span class="note-placeholder">添加备注...</span>`
        }
      </div>
    `;
  }

  return `
    <div class="file-item-card"
         draggable="true"
         data-file-id="${file.id}"
         onmouseenter="onFileHoverEnter(event, '${file.id}')"
         onmouseleave="onFileHoverLeave()"
         ondragstart="hideHoverPreview(); onFileDragStart(event, '${file.id}')"
         ondragover="onFileDragOver(event)"
         ondragleave="onFileDragLeave(event)"
         ondrop="onFileDrop(event, '${file.id}')"
         ondragend="onFileDragEnd(event)"
         onclick="hideHoverPreview(); openPreviewModal('${file.id}')">
      <div class="drag-handle" title="拖拽排序">⠿</div>
      <div class="file-name-wrap">
        <div class="file-ext-icon ${meta.badgeClass}">${meta.icon}</div>
        <div class="file-title-text" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
      </div>
      <div class="note-cell">
        ${noteCellHtml}
      </div>
      <div class="file-time-cell">
        ${formatTime(file.updatedAt)}
      </div>
      <div class="row-actions" onclick="event.stopPropagation(); hideHoverPreview();">
        <button class="btn btn-sm" onclick="renameFile('${file.id}')">重命名</button>
        <button class="btn btn-sm btn-danger" onclick="confirmDeleteFile('${file.id}')">删除</button>
      </div>
    </div>
  `;
}

// ==================== 悬停 0.8s 只读观察预览 (支持 txt / md / 各类图片) ====================

let hoverPreviewTimer = null;
let hoverPreviewUrl = null;
let currentHoverFileId = null;

function isHoverPreviewSupported(file) {
  if (!file) return false;
  const ext = String(file.ext || getExt(file.name) || '').toLowerCase();
  const meta = getExtMeta(ext);
  return ext === 'txt' || ext === 'md' || ext === 'markdown' || meta.category === 'img';
}

function hideHoverPreview() {
  if (hoverPreviewTimer) {
    clearTimeout(hoverPreviewTimer);
    hoverPreviewTimer = null;
  }
  currentHoverFileId = null;
  const floating = document.getElementById('hoverPreviewFloating');
  if (floating) {
    floating.classList.remove('open');
  }
  if (hoverPreviewUrl) {
    try { URL.revokeObjectURL(hoverPreviewUrl); } catch (e) {}
    hoverPreviewUrl = null;
  }
}

function onFileHoverEnter(e, fileId) {
  if (state.draggedFileId || state.draggedBoxId || state.editingNoteFileId) return;
  const file = state.files.find((f) => f.id === fileId);
  if (!isHoverPreviewSupported(file)) {
    hideHoverPreview();
    return;
  }

  if (hoverPreviewTimer) {
    clearTimeout(hoverPreviewTimer);
    hoverPreviewTimer = null;
  }

  const anchorEl = e.currentTarget;
  currentHoverFileId = fileId;

  // 鼠标停留满 0.3 秒 (300ms) 后触发只读观察预览窗口
  hoverPreviewTimer = setTimeout(() => {
    if (currentHoverFileId === fileId) {
      showHoverPreview(file, anchorEl);
    }
  }, 300);
}

function onFileHoverLeave() {
  hideHoverPreview();
}

async function showHoverPreview(file, anchorEl) {
  const floating = document.getElementById('hoverPreviewFloating');
  const headerEl = document.getElementById('hoverPreviewHeader');
  const bodyEl = document.getElementById('hoverPreviewBody');
  if (!floating || !headerEl || !bodyEl || !anchorEl || !document.body.contains(anchorEl)) return;

  const ext = String(file.ext || getExt(file.name) || '').toLowerCase();
  const meta = getExtMeta(ext);

  headerEl.innerHTML = `
    <div class="hover-preview-title-wrap">
      <span class="type-badge ${meta.badgeClass}">${meta.label}</span>
      <span class="hover-preview-filename">${escapeHtml(file.name)}</span>
    </div>
    <span class="hover-preview-readonly-badge">👁 只读观察</span>
  `;

  if (meta.category === 'img') {
    if (!file.contentBlob) return;
    if (hoverPreviewUrl) {
      try { URL.revokeObjectURL(hoverPreviewUrl); } catch (e) {}
    }
    const imgBlob = ext === 'svg'
      ? new Blob([file.contentBlob], { type: 'image/svg+xml' })
      : file.contentBlob;
    hoverPreviewUrl = URL.createObjectURL(imgBlob);
    bodyEl.innerHTML = `
      <div class="hover-preview-img-box">
        <img src="${hoverPreviewUrl}" class="hover-preview-img" alt="${escapeHtml(file.name)}" />
      </div>
    `;
  } else {
    let text = file.textContent;
    if (text == null && file.contentBlob) {
      try { text = await file.contentBlob.text(); } catch (e) { text = ''; }
    }
    text = text ?? '';

    if (currentHoverFileId !== file.id) return;

    if (ext === 'md' || ext === 'markdown') {
      bodyEl.innerHTML = `
        <div class="markdown-preview hover-preview-md">
          ${text.trim() ? renderSimpleMarkdown(text) : '<span style="color:var(--text-muted)">（空文档）</span>'}
        </div>
      `;
    } else {
      bodyEl.innerHTML = `
        <pre class="hover-preview-txt">${text.trim() ? escapeHtml(text) : '（空文本文件）'}</pre>
      `;
    }
  }

  floating.classList.add('open');

  // 计算浮窗最佳显示位置（优先置于卡片右侧或左侧，自动防越界）
  const rect = anchorEl.getBoundingClientRect();
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const floatW = Math.min(440, winW - 32);
  const floatH = floating.offsetHeight || 340;

  let left = rect.right + 14;
  if (left + floatW > winW - 16) {
    left = rect.left - floatW - 14;
  }
  if (left < 16) {
    left = Math.max(16, Math.min(winW - floatW - 16, rect.left + (rect.width - floatW) / 2));
  }

  let top = rect.top + (rect.height - floatH) / 2;
  top = Math.max(16, Math.min(winH - floatH - 16, top));

  floating.style.left = `${Math.round(left)}px`;
  floating.style.top = `${Math.round(top)}px`;
}

// ==================== 全局搜索 ====================

function renderGlobalSearchResults() {
  const q = state.searchQuery.trim().toLowerCase();
  const tf = state.searchTypeFilter;

  const matchedBoxes = state.boxes.filter((b) => {
    if (tf !== 'all') return false;
    return b.name.toLowerCase().includes(q);
  });

  const matchedFiles = state.files.filter((f) => {
    const ext = (f.ext || '').toLowerCase();
    const meta = getExtMeta(ext);
    if (tf !== 'all' && meta.category !== tf) return false;

    if (!q) return true;
    return (
      f.name.toLowerCase().includes(q) ||
      (f.note || '').toLowerCase().includes(q) ||
      (f.textContent || '').toLowerCase().includes(q)
    );
  });

  const fileCards = matchedFiles.map((file) => renderFileItemCard(file)).join('');

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <span style="font-size:13px;font-weight:600;color:var(--text-secondary)">匹配到 ${matchedBoxes.length} 个箱子，${matchedFiles.length} 个文件</span>
      <button class="btn btn-sm" onclick="clearSearch()">退出搜索</button>
    </div>
    ${matchedBoxes.length > 0 ? `<div style="margin-bottom:18px">${renderBoxesGrid(matchedBoxes, false)}</div>` : ''}
    <div class="file-cards-list">
      ${fileCards || `<div class="empty-state">无匹配结果</div>`}
    </div>
  `;
}

function clearSearch() {
  state.searchQuery = '';
  state.searchTypeFilter = 'all';
  const input = document.getElementById('globalSearchInput');
  const select = document.getElementById('globalTypeSelect');
  if (input) input.value = '';
  if (select) select.value = 'all';
  renderAll();
}

function clearSearchAndGoBox(boxId) {
  clearSearch();
  navigateToBox(boxId || null);
}

// ==================== 箱子管理与拖拽排序 ====================

let editingBoxState = { id: null, parentId: null, theme: 'indigo', icon: '📦' };

function openBoxModal(boxId = null, parentId = null) {
  const modal = document.getElementById('boxModal');
  const box = boxId ? state.boxes.find((b) => b.id === boxId) : null;

  editingBoxState = {
    id: box ? box.id : null,
    parentId: box ? box.parentId : (parentId || null),
    theme: box ? box.theme : 'indigo',
    icon: box ? box.icon : '📦'
  };

  document.getElementById('boxModalTitle').textContent = box ? '编辑箱子' : '新建箱子';
  document.getElementById('boxNameInput').value = box ? box.name : '';
  document.getElementById('boxDeleteBtn').style.display = box ? 'inline-flex' : 'none';

  renderBoxModalPickers();
  modal.classList.add('open');
  setTimeout(() => document.getElementById('boxNameInput').focus(), 40);
}

function renderBoxModalPickers() {
  document.getElementById('boxIconPicker').innerHTML = BOX_ICONS.map((ic) => `
    <div class="icon-choice ${editingBoxState.icon === ic ? 'selected' : ''}"
         onclick="selectBoxModalIcon('${ic}')">${ic}</div>
  `).join('');

  document.getElementById('boxColorPicker').innerHTML = BOX_THEMES.map((t) => `
    <div class="color-swatch ${editingBoxState.theme === t.id ? 'selected' : ''}"
         style="background:${t.accent}"
         onclick="selectBoxModalTheme('${t.id}')"></div>
  `).join('');
}

function selectBoxModalIcon(ic) {
  editingBoxState.icon = ic;
  renderBoxModalPickers();
}

function selectBoxModalTheme(themeId) {
  editingBoxState.theme = themeId;
  renderBoxModalPickers();
}

function closeBoxModal() {
  document.getElementById('boxModal').classList.remove('open');
}

async function saveBoxFromModal() {
  const name = document.getElementById('boxNameInput').value.trim();
  if (!name) {
    showToast('请输入名称', '!');
    return;
  }

  const now = Date.now();
  let savedBox = null;
  let oldName = null;
  if (editingBoxState.id) {
    const existing = state.boxes.find((b) => b.id === editingBoxState.id);
    if (existing) {
      oldName = existing.name;
      existing.name = name;
      existing.icon = editingBoxState.icon;
      existing.theme = editingBoxState.theme;
      existing.updatedAt = now;
      await window.boxDB.saveBox(existing);
      savedBox = existing;
    }
  } else {
    const siblings = state.boxes.filter((b) => (b.parentId || null) === (editingBoxState.parentId || null));
    const maxOrder = siblings.reduce((m, s) => Math.max(m, s.order || 0), 0);
    savedBox = {
      id: uid('box'),
      name,
      parentId: editingBoxState.parentId || null,
      icon: editingBoxState.icon,
      theme: editingBoxState.theme,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now
    };
    await window.boxDB.saveBox(savedBox);
  }

  closeBoxModal();
  await reloadAllData();
  if (window.localSync && window.localSync.isReady() && savedBox) {
    if (oldName && oldName !== name) {
      // 如果箱子改名，先删除旧目录再全量同步新目录
      await window.localSync.syncBoxDelete({ ...savedBox, name: oldName }, state.boxes);
      await window.localSync.fullSyncDBToDisk();
    } else {
      const boxFiles = state.files.filter((f) => f.boxId === savedBox.id);
      await window.localSync.syncBoxMeta(savedBox, state.boxes, boxFiles);
    }
  }
  renderAll();
}

async function deleteBoxFromModal() {
  if (!editingBoxState.id) return;
  const boxId = editingBoxState.id;
  const box = state.boxes.find((b) => b.id === boxId);
  if (!box) return;
  if (!confirm(`确定删除箱子「${box.name}」及其内部所有内容？`)) return;

  if (window.localSync && window.localSync.isReady()) {
    await window.localSync.syncBoxDelete(box, state.boxes);
  }

  const parentId = box.parentId || null;
  await window.boxDB.deleteBoxRecursive(boxId);
  closeBoxModal();
  if (state.currentBoxId === boxId) {
    state.currentBoxId = parentId;
  }
  await reloadAllData();
  renderAll();
  showToast('已删除');
}

function showDragTrashBin() {
  const bin = document.getElementById('dragTrashBin');
  if (bin) bin.classList.add('visible');
}

function hideDragTrashBin() {
  const bin = document.getElementById('dragTrashBin');
  if (bin) {
    bin.classList.remove('visible');
    bin.classList.remove('drag-over');
  }
}

function onTrashDragOver(e) {
  if (state.dragSource === 'pinned') return;
  if (!state.draggedBoxId && !state.draggedFileId) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const bin = document.getElementById('dragTrashBin');
  if (bin) bin.classList.add('drag-over');
}

function onTrashDragLeave(e) {
  const bin = document.getElementById('dragTrashBin');
  if (bin) bin.classList.remove('drag-over');
}

async function onTrashDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  const bin = document.getElementById('dragTrashBin');
  if (bin) bin.classList.remove('drag-over');

  // 来自左侧「重点」栏的箱子绝对不允许触发拖拽删除
  if (state.dragSource === 'pinned') {
    state.draggedBoxId = null;
    state.draggedFileId = null;
    state.dragSource = null;
    hideDragTrashBin();
    return;
  }

  const draggedBoxId = state.draggedBoxId;
  const draggedFileId = state.draggedFileId;
  state.draggedBoxId = null;
  state.draggedFileId = null;
  state.dragSource = null;
  hideDragTrashBin();

  // 1. 如果拖入的是箱子 (仅支持主页/主工作区上的箱子)
  if (draggedBoxId) {
    const box = state.boxes.find((b) => b.id === draggedBoxId);
    if (!box) return;
    if (!confirm(`确定删除箱子「${box.name}」及其内部所有内容？`)) return;

    if (window.localSync && window.localSync.isReady()) {
      await window.localSync.syncBoxDelete(box, state.boxes);
    }
    const parentId = box.parentId || null;
    await window.boxDB.deleteBoxRecursive(draggedBoxId);
    if (state.currentBoxId === draggedBoxId) {
      state.currentBoxId = parentId;
    }
    await reloadAllData();
    renderAll();
    showToast(`箱子「${box.name}」已删除`, '🗑️');
    return;
  }

  // 2. 如果拖入的是文件
  if (draggedFileId) {
    const file = state.files.find((f) => f.id === draggedFileId);
    if (!file) return;
    if (!confirm(`确定删除文件「${file.name}」？`)) return;

    if (window.localSync && window.localSync.isReady()) {
      await window.localSync.syncFileDelete(file, state.boxes, state.files);
    }
    await window.boxDB.deleteFile(draggedFileId);
    await reloadAllData();
    renderAll();
    showToast(`文件「${file.name}」已删除`, '🗑️');
  }
}

function onBoxDragStart(e, boxId) {
  state.draggedBoxId = boxId;
  state.dragSource = 'main';
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  showDragTrashBin();
}

function onBoxDragOver(e) {
  if (!state.draggedBoxId && !state.draggedFileId) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}

function onBoxDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function onBoxDragEnd(e) {
  state.draggedBoxId = null;
  state.dragSource = null;
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
  hideDragTrashBin();
}

async function moveFileIntoBox(fileId, targetBoxId) {
  const file = state.files.find((f) => f.id === fileId);
  const targetBox = state.boxes.find((b) => b.id === targetBoxId);
  if (!file || !targetBox || file.boxId === targetBoxId) return;

  const oldBoxId = file.boxId || null;
  if (window.localSync && window.localSync.isReady()) {
    await window.localSync.syncFileDelete({ ...file, boxId: oldBoxId }, state.boxes, state.files);
  }

  const targetFiles = state.files.filter((f) => f.boxId === targetBoxId);
  const maxOrder = targetFiles.reduce((m, f) => Math.max(m, f.order || 0), 0);

  file.boxId = targetBoxId;
  file.isQuickBook = false;
  if (file.note === '快速书籍 · 可拖入箱子') {
    file.note = '';
  }
  file.order = maxOrder + 1;
  file.updatedAt = Date.now();
  await window.boxDB.saveFile(file);

  targetBox.updatedAt = Date.now();
  await window.boxDB.saveBox(targetBox);

  await reloadAllData();
  if (window.localSync && window.localSync.isReady()) {
    await window.localSync.syncFileWrite(file, state.boxes, state.files);
  }

  renderAll();
  showToast(`已将「${file.name}」放入箱子「${targetBox.name}」`, '📦');
}

async function onBoxDrop(e, targetBoxId) {
  if (!state.draggedBoxId && !state.draggedFileId) return;
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.classList.remove('drag-over');

  // 若拖入的是快速书籍或文件，直接归入目标箱子
  if (state.draggedFileId) {
    const draggedFileId = state.draggedFileId;
    state.draggedFileId = null;
    hideDragTrashBin();
    await moveFileIntoBox(draggedFileId, targetBoxId);
    return;
  }

  const draggedId = state.draggedBoxId;
  state.draggedBoxId = null;
  if (draggedId === targetBoxId) return;

  const draggedBox = state.boxes.find((b) => b.id === draggedId);
  const targetBox = state.boxes.find((b) => b.id === targetBoxId);
  if (!draggedBox || !targetBox) return;

  const siblings = state.boxes
    .filter((b) => (b.parentId || null) === (targetBox.parentId || null))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const fromIdx = siblings.findIndex((b) => b.id === draggedId);
  const toIdx = siblings.findIndex((b) => b.id === targetBoxId);
  if (fromIdx === -1 || toIdx === -1) return;

  const [moved] = siblings.splice(fromIdx, 1);
  siblings.splice(toIdx, 0, moved);
  siblings.forEach((b, i) => { b.order = i + 1; });

  await window.boxDB.updateOrders('boxes', siblings);
  await reloadAllData();
  if (window.localSync && window.localSync.isReady()) {
    for (const b of siblings) {
      const bf = state.files.filter((f) => f.boxId === b.id);
      await window.localSync.syncBoxMeta(b, state.boxes, bf);
    }
  }
  renderAll();
}

function onPinnedZoneDragOver(e) {
  if (!state.draggedBoxId && !state.draggedFileId) return;
  if (state.dragSource === 'pinned') return;
  e.preventDefault();
  e.dataTransfer.dropEffect = state.draggedFileId ? 'copy' : 'move';
  e.currentTarget.classList.add('drag-over');
}

function onPinnedZoneDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    e.currentTarget.classList.remove('drag-over');
  }
}

async function onPinnedZoneDrop(e) {
  if (!state.draggedBoxId && !state.draggedFileId) return;
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.classList.remove('drag-over');
  hideDragTrashBin();

  if (state.dragSource === 'pinned') {
    state.draggedBoxId = null;
    state.draggedFileId = null;
    state.dragSource = null;
    return;
  }

  // 文件拖入「重点」栏：固定为重点文件（不移动文件位置）
  if (state.draggedFileId) {
    const fileId = state.draggedFileId;
    state.draggedFileId = null;
    state.dragSource = null;
    await pinFile(fileId);
    return;
  }

  const draggedId = state.draggedBoxId;
  state.draggedBoxId = null;
  state.dragSource = null;

  const box = state.boxes.find((b) => b.id === draggedId);
  if (!box) return;

  if (box.isStarred) {
    renderAll();
    showToast(`「${box.name}」已在重点列表中`, '⭐');
    return;
  }

  const maxStarOrder = state.boxes
    .filter((b) => b.isStarred)
    .reduce((m, b) => Math.max(m, b.starredOrder || 0), 0);

  box.isStarred = true;
  box.starredOrder = maxStarOrder + 1;
  await window.boxDB.saveBox(box);
  await reloadAllData();

  if (window.localSync && window.localSync.isReady()) {
    const bf = state.files.filter((f) => f.boxId === box.id);
    await window.localSync.syncBoxMeta(box, state.boxes, bf);
  }

  renderAll();
  showToast(`已将「${box.name}」加入重点`, '⭐');
}

function onPinnedItemDragOver(e) {
  if (!state.draggedBoxId && !state.draggedFileId) return;
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.classList.add('drag-over');
}

function onPinnedItemDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

async function onPinnedItemDrop(e, targetBoxId) {
  if (!state.draggedBoxId && !state.draggedFileId) return;
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.classList.remove('drag-over');
  document.querySelectorAll('.pinned-sidebar.drag-over').forEach((el) => el.classList.remove('drag-over'));

  if (state.draggedFileId) {
    const draggedFileId = state.draggedFileId;
    state.draggedFileId = null;
    hideDragTrashBin();
    await moveFileIntoBox(draggedFileId, targetBoxId);
    return;
  }

  const draggedId = state.draggedBoxId;
  state.draggedBoxId = null;
  hideDragTrashBin();

  const draggedBox = state.boxes.find((b) => b.id === draggedId);
  const targetBox = state.boxes.find((b) => b.id === targetBoxId);
  if (!draggedBox || !targetBox) return;

  const wasStarred = Boolean(draggedBox.isStarred);
  draggedBox.isStarred = true;

  const pinnedList = state.boxes
    .filter((b) => b.isStarred && b.id !== draggedId)
    .sort((a, b) => (a.starredOrder ?? a.order ?? 0) - (b.starredOrder ?? b.order ?? 0));

  const targetIdx = pinnedList.findIndex((b) => b.id === targetBoxId);
  if (targetIdx === -1) {
    pinnedList.push(draggedBox);
  } else {
    pinnedList.splice(targetIdx, 0, draggedBox);
  }

  for (let i = 0; i < pinnedList.length; i++) {
    pinnedList[i].starredOrder = i + 1;
    await window.boxDB.saveBox(pinnedList[i]);
  }

  await reloadAllData();
  if (window.localSync && window.localSync.isReady()) {
    for (const b of pinnedList) {
      const bf = state.files.filter((f) => f.boxId === b.id);
      await window.localSync.syncBoxMeta(b, state.boxes, bf);
    }
  }
  renderAll();
  if (!wasStarred) {
    showToast(`已将「${draggedBox.name}」加入重点`, '⭐');
  }
}

async function unpinBox(boxId) {
  const box = state.boxes.find((b) => b.id === boxId);
  if (!box || !box.isStarred) return;

  box.isStarred = false;
  await window.boxDB.saveBox(box);
  await reloadAllData();

  if (window.localSync && window.localSync.isReady()) {
    const bf = state.files.filter((f) => f.boxId === box.id);
    await window.localSync.syncBoxMeta(box, state.boxes, bf);
  }

  renderAll();
  showToast(`已从重点移出「${box.name}」`);
}

async function syncFileStarMeta(file) {
  if (!file || !file.boxId) return;
  if (window.localSync && window.localSync.isReady()) {
    const box = state.boxes.find((b) => b.id === file.boxId);
    if (box) {
      const bf = state.files.filter((f) => f.boxId === box.id);
      await window.localSync.syncBoxMeta(box, state.boxes, bf);
    }
  }
}

async function pinFile(fileId) {
  const file = state.files.find((f) => f.id === fileId);
  if (!file) return;
  if (file.isStarred) {
    renderAll();
    showToast(`「${file.name}」已在重点列表中`, '⭐');
    return;
  }
  const maxStarOrder = state.files
    .filter((f) => f.isStarred)
    .reduce((m, f) => Math.max(m, f.starredOrder || 0), 0);
  file.isStarred = true;
  file.starredOrder = maxStarOrder + 1;
  await window.boxDB.saveFile(file);
  await reloadAllData();
  await syncFileStarMeta(state.files.find((f) => f.id === fileId));
  renderAll();
  showToast(`已将文件「${file.name}」加入重点`, '⭐');
}

async function unpinFile(fileId) {
  const file = state.files.find((f) => f.id === fileId);
  if (!file || !file.isStarred) return;
  file.isStarred = false;
  file.starredOrder = 0;
  await window.boxDB.saveFile(file);
  await reloadAllData();
  await syncFileStarMeta(state.files.find((f) => f.id === fileId));
  renderAll();
  showToast(`已从重点移出「${file.name}」`);
}

// ==================== 文件导入、新建、备注与拖拽排序 ====================

function setBoxFileFilter(filterId) {
  state.boxFileFilter = filterId;
  renderMainContent();
}

function setSortMode(mode) {
  state.sortMode = mode;
  renderMainContent();
}

function triggerFileUpload() {
  state.replacingFileId = null;
  const input = document.getElementById('hiddenFileInput');
  input.value = '';
  input.multiple = true;
  input.click();
}

function triggerReplaceFile(fileId) {
  state.replacingFileId = fileId;
  const input = document.getElementById('hiddenFileInput');
  input.value = '';
  input.multiple = false;
  input.click();
}

async function handleFileInputChange(e) {
  const fileList = Array.from(e.target.files || []);
  if (fileList.length === 0) return;

  if (state.replacingFileId) {
    const targetId = state.replacingFileId;
    state.replacingFileId = null;
    await replaceExistingFileWithUpload(targetId, fileList[0]);
  } else {
    await addUploadedFilesToCurrentBox(fileList);
  }
}

function bindImportCardDropzone() {
  const zone = document.getElementById('boxMainScroll');
  if (!zone) return;

  const isExternalFileDrag = (e) =>
    !state.draggedFileId && !state.draggedBoxId &&
    e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');

  let dragDepth = 0;
  zone.addEventListener('dragenter', (e) => {
    if (!isExternalFileDrag(e)) return;
    e.preventDefault();
    dragDepth++;
    zone.classList.add('drag-active');
  });
  zone.addEventListener('dragover', (e) => {
    if (!isExternalFileDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    zone.classList.add('drag-active');
  });
  zone.addEventListener('dragleave', (e) => {
    if (!isExternalFileDrag(e)) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0 || !zone.contains(e.relatedTarget)) {
      dragDepth = 0;
      zone.classList.remove('drag-active');
    }
  });
  zone.addEventListener('drop', async (e) => {
    dragDepth = 0;
    zone.classList.remove('drag-active');
    if (!isExternalFileDrag(e)) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      await addUploadedFilesToCurrentBox(Array.from(e.dataTransfer.files));
    }
  });
}

async function readTextIfTextFile(fileObj, ext) {
  if (isTextEditableExt(ext)) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => resolve('');
      reader.readAsText(fileObj, 'utf-8');
    });
  }
  return null;
}

function setImportCardLoading(isLoading, titleText = '正在导入文件...', subText = '') {
  const card = document.getElementById('fileImportCard');
  if (!card) return;
  if (isLoading) {
    card.classList.add('is-loading');
    card.innerHTML = `
      <div class="file-import-loading">
        <div class="import-spinner"></div>
        <div class="import-loading-title">${escapeHtml(titleText)}</div>
        ${subText ? `<div class="import-loading-sub">${escapeHtml(subText)}</div>` : ''}
      </div>
    `;
  } else {
    card.classList.remove('is-loading');
  }
}

async function addUploadedFilesToCurrentBox(fileObjects) {
  if (!state.currentBoxId || !fileObjects || fileObjects.length === 0) return;

  const total = fileObjects.length;
  setImportCardLoading(true, `正在导入 (0/${total})...`, '准备读取文件...');
  await new Promise((r) => setTimeout(r, 20));

  try {
    const boxFiles = state.files.filter((f) => f.boxId === state.currentBoxId);
    let maxOrder = boxFiles.reduce((m, f) => Math.max(m, f.order || 0), 0);
    const newFiles = [];

    for (let i = 0; i < total; i++) {
      const rawFile = fileObjects[i];
      setImportCardLoading(true, `正在导入 (${i + 1}/${total})...`, rawFile.name);
      await new Promise((r) => setTimeout(r, 10));

      const ext = getExt(rawFile.name) || 'txt';
      const textContent = await readTextIfTextFile(rawFile, ext);
      const defaultMime = ext === 'svg' ? 'image/svg+xml' : 'application/octet-stream';
      const blob = new Blob([await rawFile.arrayBuffer()], {
        type: rawFile.type || defaultMime
      });

      maxOrder += 1;
      const now = Date.now();
      const fileRec = {
        id: uid('file'),
        boxId: state.currentBoxId,
        name: rawFile.name,
        ext,
        mimeType: rawFile.type || defaultMime,
        size: rawFile.size,
        contentBlob: blob,
        textContent,
        note: '',
        order: maxOrder,
        createdAt: now,
        updatedAt: rawFile.lastModified || now
      };
      await window.boxDB.saveFile(fileRec);
      newFiles.push(fileRec);
    }

    if (newFiles.length > 0) {
      const box = state.boxes.find((b) => b.id === state.currentBoxId);
      if (box) {
        box.updatedAt = Date.now();
        await window.boxDB.saveBox(box);
      }
      await reloadAllData();
      if (window.localSync && window.localSync.isReady()) {
        for (let i = 0; i < newFiles.length; i++) {
          const nf = newFiles[i];
          setImportCardLoading(true, `正在同步到本地 (${i + 1}/${total})...`, nf.name);
          await window.localSync.syncFileWrite(nf, state.boxes, state.files);
        }
      }
      renderAll();
      showToast(`已导入 ${newFiles.length} 个文件`);
    } else {
      renderMainContent();
    }
  } catch (err) {
    console.error('[Import Error]', err);
    renderMainContent();
    showToast('导入文件时发生错误', '⚠️');
  }
}

async function replaceExistingFileWithUpload(fileId, rawFile) {
  const existing = state.files.find((f) => f.id === fileId);
  if (!existing || !rawFile) return;

  setImportCardLoading(true, '正在替换文件...', rawFile.name);
  await new Promise((r) => setTimeout(r, 20));

  const oldName = existing.name;
  const ext = getExt(rawFile.name) || existing.ext || 'txt';
  const textContent = await readTextIfTextFile(rawFile, ext);
  const defaultMime = ext === 'svg' ? 'image/svg+xml' : 'application/octet-stream';
  const blob = new Blob([await rawFile.arrayBuffer()], {
    type: rawFile.type || defaultMime
  });

  existing.name = rawFile.name;
  existing.ext = ext;
  existing.mimeType = rawFile.type || existing.mimeType || defaultMime;
  existing.size = rawFile.size;
  existing.contentBlob = blob;
  existing.textContent = textContent;
  existing.updatedAt = Date.now();

  await window.boxDB.saveFile(existing);
  await reloadAllData();
  if (window.localSync && window.localSync.isReady()) {
    if (oldName !== existing.name) {
      await window.localSync.syncFileDelete({ ...existing, name: oldName }, state.boxes, state.files);
    }
    await window.localSync.syncFileWrite(existing, state.boxes, state.files);
  }
  renderAll();
  showToast('文件已更新');
}

function openCreateDocModal() {
  if (!state.currentBoxId) return;
  document.getElementById('newDocNameInput').value = '';
  document.getElementById('newDocExtSelect').value = 'md';
  document.getElementById('newDocNoteInput').value = '';
  document.getElementById('newDocContentInput').value = '';
  document.getElementById('createDocModal').classList.add('open');
  setTimeout(() => document.getElementById('newDocNameInput').focus(), 40);
}

function closeCreateDocModal() {
  document.getElementById('createDocModal').classList.remove('open');
}

async function saveNewDocFromModal() {
  let name = document.getElementById('newDocNameInput').value.trim();
  const selectedExt = document.getElementById('newDocExtSelect').value;
  const note = document.getElementById('newDocNoteInput').value.trim();
  const content = document.getElementById('newDocContentInput').value;

  if (!name) {
    showToast('请输入文件名', '!');
    return;
  }

  let ext = getExt(name);
  if (selectedExt !== 'custom') {
    if (!name.toLowerCase().endsWith(`.${selectedExt}`)) {
      name = `${name}.${selectedExt}`;
    }
    ext = selectedExt;
  } else if (!ext) {
    name = `${name}.txt`;
    ext = 'txt';
  }

  const mime = ext === 'md' || ext === 'markdown' ? 'text/markdown' : 'text/plain';
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const boxFiles = state.files.filter((f) => f.boxId === state.currentBoxId);
  const maxOrder = boxFiles.reduce((m, f) => Math.max(m, f.order || 0), 0);
  const now = Date.now();

  const newFile = {
    id: uid('file'),
    boxId: state.currentBoxId,
    name,
    ext,
    mimeType: mime,
    size: blob.size,
    contentBlob: blob,
    textContent: content,
    note,
    order: maxOrder + 1,
    createdAt: now,
    updatedAt: now
  };
  await window.boxDB.saveFile(newFile);

  closeCreateDocModal();
  await reloadAllData();
  if (window.localSync && window.localSync.isReady()) {
    await window.localSync.syncFileWrite(newFile, state.boxes, state.files);
  }
  renderAll();
  showToast('已创建');
}

function startEditNote(fileId) {
  state.editingNoteFileId = fileId;
  renderMainContent();
  setTimeout(() => {
    const input = document.getElementById(`noteInput_${fileId}`);
    if (input) {
      input.focus();
      input.select();
    }
  }, 20);
}

function cancelEditNote() {
  state.editingNoteFileId = null;
  renderMainContent();
}

async function saveFileNote(fileId) {
  if (state.editingNoteFileId !== fileId) return;
  const input = document.getElementById(`noteInput_${fileId}`);
  const file = state.files.find((f) => f.id === fileId);
  state.editingNoteFileId = null;

  if (file && input) {
    const val = input.value.trim();
    if (val !== (file.note || '')) {
      file.note = val;
      file.updatedAt = Date.now();
      await window.boxDB.saveFile(file);
      await reloadAllData();
      if (window.localSync && window.localSync.isReady()) {
        const box = state.boxes.find((b) => b.id === file.boxId);
        const boxFiles = state.files.filter((f) => f.boxId === file.boxId);
        await window.localSync.syncBoxMeta(box, state.boxes, boxFiles);
      }
    }
  }
  renderMainContent();
}

function localBlobToBase64(blob) {
  return new Promise((resolve) => {
    if (!blob) return resolve(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result;
      const base64 = typeof res === 'string' && res.includes(',') ? res.split(',')[1] : null;
      resolve(base64);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

function stageFileToBackend(file) {
  if (!file) return;
  try {
    const origin = window.location.origin || 'http://127.0.0.1:18666';
    (async () => {
      let base64Data = null;
      if (file.contentBlob) {
        base64Data = await localBlobToBase64(file.contentBlob);
      }
      fetch(`${origin}/api/stage-drag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          base64Data,
          textContent: file.textContent || undefined
        })
      }).catch(() => {});
    })();
  } catch (_) {}
}

function onFileDragStart(e, fileId) {
  state.draggedFileId = fileId;
  state.dragSource = 'file';
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'copyMove';
  showDragTrashBin();

  // 注入外部桌面应用（Word、桌面、微信）原生拖拽协议：DownloadURL 与 HTML 图片格式
  const file = state.files.find((f) => f.id === fileId);
  if (file && e.dataTransfer) {
    try {
      const ext = (file.ext || getExt(file.name) || '').toLowerCase();
      const meta = getExtMeta(ext);

      // 1. 规范化 MIME 类型，去除参数（严禁携带分号与冒号，避免破坏 Chromium 的 DownloadURL 冒号结构）
      let safeMime = (file.mimeType || '').split(';')[0].split(':')[0].trim();
      if (!safeMime) {
        if (meta.category === 'img') {
          safeMime = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : (ext || 'png')}`;
        } else if (ext === 'pdf') {
          safeMime = 'application/pdf';
        } else if (ext === 'docx') {
          safeMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (ext === 'xlsx') {
          safeMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (ext === 'md' || ext === 'txt') {
          safeMime = 'text/plain';
        } else {
          safeMime = 'application/octet-stream';
        }
      }

      // 2. 绝对路径 URL：严格与当前页面同源 (window.location.origin)，Chrome 严格阻断跨域 DownloadURL 拖拽
      const origin = window.location.origin || 'http://127.0.0.1:18666';
      const boxChain = file.boxId ? getBoxChain(file.boxId).map((b) => b.name) : [];
      const chainParam = encodeURIComponent(JSON.stringify(boxChain));
      const fileParam = encodeURIComponent(file.name);
      const rawDownloadUrl = `${origin}/api/raw-download?boxChain=${chainParam}&fileName=${fileParam}`;

      // 3. 注入 Chromium 原生拖拽下载协议 DownloadURL（桌面、文件夹、外部程序拖拽）
      const safeFileName = file.name.replace(/[:\\/]/g, '_');
      const downloadPayload = `${safeMime}:${safeFileName}:${rawDownloadUrl}`;
      e.dataTransfer.setData('DownloadURL', downloadPayload);
      try { e.dataTransfer.setData('downloadurl', downloadPayload); } catch (_) {}

      // 4. Word / 外部富文本编辑器拖拽：
      // 必须使用可独立发请求下载的真实 HTTP 地址（绝对不能用内部内存 blob: URL，否则 Word 无法访问会报错！）
      if (meta.category === 'img') {
        e.dataTransfer.setData('text/html', `<img src="${rawDownloadUrl}" alt="${escapeHtml(file.name)}" />`);
        e.dataTransfer.setData('text/uri-list', rawDownloadUrl);
        e.dataTransfer.setData('text/plain', rawDownloadUrl);
      } else {
        if (file.textContent) {
          e.dataTransfer.setData('text/plain', file.textContent);
          e.dataTransfer.setData('text/html', `<pre>${escapeHtml(file.textContent)}</pre>`);
        } else {
          e.dataTransfer.setData('text/plain', file.name);
        }
        e.dataTransfer.setData('text/uri-list', rawDownloadUrl);
      }

      // 5. 异步暂存后端，确保拖放到外部的一刹那本地缓存已有文件实体
      stageFileToBackend(file);
    } catch (err) {
      console.warn('注入外部拖拽数据失败:', err);
    }
  }
}

function onFileDragOver(e) {
  if (!state.draggedFileId || state.sortMode !== 'manual') return;
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}

function onFileDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function onFileDragEnd(e) {
  state.draggedFileId = null;
  state.dragSource = null;
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.file-item-card.drag-over, .file-book-card.drag-over').forEach((el) => el.classList.remove('drag-over'));
  hideDragTrashBin();
}

async function onFileDrop(e, targetFileId) {
  if (!state.draggedFileId || state.sortMode !== 'manual') return;
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.classList.remove('drag-over');

  const draggedId = state.draggedFileId;
  state.draggedFileId = null;
  if (draggedId === targetFileId) return;

  const draggedFile = state.files.find((f) => f.id === draggedId);
  const targetFile = state.files.find((f) => f.id === targetFileId);
  if (!draggedFile || !targetFile || draggedFile.boxId !== targetFile.boxId) return;

  const siblings = state.files
    .filter((f) => f.boxId === targetFile.boxId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const fromIdx = siblings.findIndex((f) => f.id === draggedId);
  const toIdx = siblings.findIndex((f) => f.id === targetFileId);
  if (fromIdx === -1 || toIdx === -1) return;

  const [moved] = siblings.splice(fromIdx, 1);
  siblings.splice(toIdx, 0, moved);
  siblings.forEach((f, i) => { f.order = i + 1; });

  await window.boxDB.updateOrders('files', siblings);
  await reloadAllData();
  if (window.localSync && window.localSync.isReady()) {
    const box = state.boxes.find((b) => b.id === targetFile.boxId);
    const boxFiles = state.files.filter((f) => f.boxId === targetFile.boxId);
    await window.localSync.syncBoxMeta(box, state.boxes, boxFiles);
  }
  renderMainContent();
}

async function renameFile(fileId) {
  const file = state.files.find((f) => f.id === fileId);
  if (!file) return;

  const origExt = file.ext || getExt(file.name) || '';
  const suffix = origExt ? `.${origExt}` : '';
  const origBaseName = (suffix && file.name.toLowerCase().endsWith(suffix.toLowerCase()))
    ? file.name.slice(0, -suffix.length)
    : file.name;

  const promptLabel = origExt
    ? `重命名文件（后缀 .${origExt} 保持不变）：`
    : '重命名文件：';
  const input = prompt(promptLabel, origBaseName);
  if (input === null) return;

  let newBase = input.trim();
  if (!newBase) return;

  // 若用户顺手输入了原后缀，自动去重，始终锁定原文件后缀不修改
  if (suffix && newBase.toLowerCase().endsWith(suffix.toLowerCase())) {
    newBase = newBase.slice(0, -suffix.length).trim();
  }
  if (!newBase) return;

  const newName = `${newBase}${suffix}`;
  if (newName === file.name) return;

  const oldName = file.name;
  file.name = newName;
  file.ext = origExt;
  file.updatedAt = Date.now();

  await window.boxDB.saveFile(file);
  await reloadAllData();

  if (window.localSync && window.localSync.isReady()) {
    await window.localSync.syncFileDelete({ ...file, name: oldName }, state.boxes, state.files);
    await window.localSync.syncFileWrite(file, state.boxes, state.files);
  }

  renderAll();
  showToast(`已重命名为「${file.name}」`);
}

async function downloadFile(fileId) {
  const file = state.files.find((f) => f.id === fileId);
  if (!file || !file.contentBlob) return;
  const url = URL.createObjectURL(file.contentBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function openFileNatively(fileId) {
  const file = state.files.find((f) => f.id === fileId);
  if (!file) return;

  if (!file.contentBlob && file.textContent != null) {
    const mime = file.ext === 'md' ? 'text/markdown' : 'text/plain';
    file.contentBlob = new Blob([file.textContent], { type: `${mime};charset=utf-8` });
  }

  // 1. 优先通过轻量化本地服务直接调用 Windows 系统默认关联程序打开本地真实文件 (0 下载弹窗)
  if (window.localSync) {
    try {
      const openedByOS = await window.localSync.openFileWithNativeApp(file, state.boxes);
      if (openedByOS) {
        showToast(`已用本机默认程序打开「${file.name}」`, '🚀');
        renderHeader();
        return;
      }
    } catch (e) {}
  }

  // 2. 若未启动本地服务，回退为浏览器新标签页原生查看/打开
  if (file.contentBlob) {
    let mimeType = file.mimeType || 'application/octet-stream';
    if (file.ext === 'pdf') mimeType = 'application/pdf';
    else if (file.ext === 'md' || file.ext === 'txt') mimeType = 'text/plain;charset=utf-8';
    else if (file.ext === 'html' || file.ext === 'htm') mimeType = 'text/html;charset=utf-8';

    const nativeBlob = new Blob([file.contentBlob], { type: mimeType });
    const url = URL.createObjectURL(nativeBlob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}

async function confirmDeleteFile(fileId) {
  const file = state.files.find((f) => f.id === fileId);
  if (!file) return;
  if (!confirm(`确定删除文件「${file.name}」？`)) return;

  clearObjectUrls();
  if (window.localSync && window.localSync.isReady()) {
    await window.localSync.syncFileDelete(file, state.boxes, state.files);
  }
  await window.boxDB.deleteFile(fileId);
  await reloadAllData();
  renderAll();
  showToast(`已删除「${file.name}」`, '🗑️');
}

// ==================== 箱子级状态存档 & 回溯 ====================

let archivingBoxId = null;

function openBoxArchiveModal(boxId) {
  const box = state.boxes.find((b) => b.id === boxId);
  if (!box) return;
  archivingBoxId = boxId;

  const boxSnaps = state.snapshots.filter((s) => s.boxId === boxId);
  const nextVer = (boxSnaps.reduce((m, s) => Math.max(m, s.versionNum || 0), 0)) + 1;
  const fileCount = state.files.filter((f) => f.boxId === boxId).length;

  document.getElementById('archiveModalBoxInfo').textContent = `${box.name}（共 ${fileCount} 个文件） → v${nextVer}`;
  document.getElementById('archiveNoteInput').value = '';
  document.getElementById('manualArchiveModal').classList.add('open');
  setTimeout(() => document.getElementById('archiveNoteInput').focus(), 40);
}

function closeManualArchiveModal() {
  document.getElementById('manualArchiveModal').classList.remove('open');
  archivingBoxId = null;
}

async function confirmBoxArchive() {
  if (!archivingBoxId) return;
  const box = state.boxes.find((b) => b.id === archivingBoxId);
  if (!box) return;

  const remark = document.getElementById('archiveNoteInput').value.trim() || '手动存档';
  const boxSnaps = state.snapshots.filter((s) => s.boxId === box.id);
  const nextVer = (boxSnaps.reduce((m, s) => Math.max(m, s.versionNum || 0), 0)) + 1;
  const currentFiles = state.files
    .filter((f) => f.boxId === box.id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const clonedFiles = [];
  for (const f of currentFiles) {
    const clonedBlob = f.contentBlob
      ? new Blob([await f.contentBlob.arrayBuffer()], { type: f.mimeType })
      : null;
    clonedFiles.push({
      id: f.id,
      boxId: f.boxId,
      name: f.name,
      ext: f.ext,
      mimeType: f.mimeType,
      size: f.size,
      contentBlob: clonedBlob,
      textContent: f.textContent ?? null,
      note: f.note || '',
      order: f.order,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt
    });
  }

  const now = Date.now();
  const newSnap = {
    id: uid('snap'),
    boxId: box.id,
    versionNum: nextVer,
    archiveNote: remark,
    createdAt: now,
    filesSnapshot: clonedFiles
  };
  await window.boxDB.saveSnapshot(newSnap);

  box.updatedAt = now;
  await window.boxDB.saveBox(box);

  closeManualArchiveModal();
  await reloadAllData();
  if (window.localSync && window.localSync.isReady()) {
    await window.localSync.syncSnapshotCreate(newSnap, state.boxes);
  }
  renderAll();
  showToast(`已生成箱子存档 v${nextVer}`);
}

function openBoxSnapshotModal(snapId) {
  const snap = state.snapshots.find((s) => s.id === snapId);
  if (!snap) return;

  const currentFiles = state.files.filter((f) => f.boxId === snap.boxId);
  const snapFiles = snap.filesSnapshot || [];

  document.getElementById('diffModalTitle').innerHTML = `
    <span class="git-tag">v${snap.versionNum}</span>
    <span>${escapeHtml(snap.archiveNote)}</span>
    <span style="font-size:12px;color:var(--text-muted);font-weight:400">${formatTime(snap.createdAt)}</span>
  `;

  let listHtml = '';
  if (snapFiles.length === 0) {
    listHtml = `<div class="empty-state">该版本下箱子为空</div>`;
  } else {
    listHtml = snapFiles.map((sf, idx) => {
      const meta = getExtMeta(sf.ext);
      const curr = currentFiles.find((cf) => cf.id === sf.id);
      let statusBadge = `<span class="diff-status-tag diff-status-same">一致</span>`;
      if (!curr) {
        statusBadge = `<span class="diff-status-tag diff-status-del">当前已删</span>`;
      } else if (curr.updatedAt !== sf.updatedAt || curr.size !== sf.size || (curr.note || '') !== (sf.note || '')) {
        statusBadge = `<span class="diff-status-tag diff-status-mod">有变更</span>`;
      }

      return `
        <div class="snap-file-row" style="cursor:pointer" onclick="previewFileFromBoxSnapshot('${snap.id}', ${idx})">
          <div style="display:flex;align-items:center;gap:10px;min-width:0">
            <div class="file-ext-icon ${meta.badgeClass}" style="width:28px;height:28px;font-size:9px">${meta.icon}</div>
            <div>
              <div style="font-weight:600;color:var(--text-main)">${escapeHtml(sf.name)}</div>
              <div style="font-size:11.5px;color:var(--text-muted)">${escapeHtml(sf.note || '无备注')} · ${formatSize(sf.size)}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            ${statusBadge}
            <span style="font-size:12px;color:var(--primary)">查看 →</span>
          </div>
        </div>
      `;
    }).join('');
  }

  document.getElementById('diffModalBody').innerHTML = `
    <div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px">
      存档时箱内包含 ${snapFiles.length} 个文件（点击条目可查看当时文件内容）：
    </div>
    ${listHtml}
  `;

  document.getElementById('diffRollbackBtn').onclick = () => rollbackBoxToSnapshot(snap.id);
  document.getElementById('diffDeleteBtn').onclick = async () => {
    if (!confirm('确定删除此版本存档？')) return;
    if (window.localSync && window.localSync.isReady()) {
      await window.localSync.syncSnapshotDelete(snap, state.boxes);
    }
    await window.boxDB.deleteSnapshot(snap.id);
    closeDiffModal();
    await reloadAllData();
    renderAll();
  };

  document.getElementById('diffModal').classList.add('open');
}

function closeDiffModal() {
  document.getElementById('diffModal').classList.remove('open');
}

async function rollbackBoxToSnapshot(snapId) {
  const snap = state.snapshots.find((s) => s.id === snapId);
  if (!snap) return;
  if (!confirm(`确定将整个箱子回滚至 v${snap.versionNum}（${snap.archiveNote}）的状态吗？`)) return;

  const restoredFiles = [];
  for (const sf of snap.filesSnapshot || []) {
    const clonedBlob = sf.contentBlob
      ? new Blob([await sf.contentBlob.arrayBuffer()], { type: sf.mimeType })
      : null;
    restoredFiles.push({
      ...sf,
      contentBlob: clonedBlob
    });
  }

  await window.boxDB.replaceBoxFiles(snap.boxId, restoredFiles);
  closeDiffModal();
  await reloadAllData();
  if (window.localSync && window.localSync.isReady()) {
    await window.localSync.syncBoxRollback(snap.boxId, restoredFiles, state.boxes);
  }
  renderAll();
  showToast(`箱子已回滚至 v${snap.versionNum}`);
}

function previewFileFromBoxSnapshot(snapId, fileIndex) {
  clearObjectUrls();
  const snap = state.snapshots.find((s) => s.id === snapId);
  if (!snap || !snap.filesSnapshot || !snap.filesSnapshot[fileIndex]) return;
  const sf = snap.filesSnapshot[fileIndex];

  previewingFileId = null;
  imgZoomLevel = 1;
  imgRotateDeg = 0;
  renderPreviewModalForRecord({
    ...sf,
    name: `${sf.name} [v${snap.versionNum}]`
  }, true);
  document.getElementById('previewModal').classList.add('open');
}

// ==================== 在线预览与编辑器 (点击文件卡片直接进入) ====================

let previewingFileId = null;
let imgZoomLevel = 1;
let imgRotateDeg = 0;

function openPreviewModal(fileId) {
  clearObjectUrls();
  const file = state.files.find((f) => f.id === fileId);
  if (!file) return;
  previewingFileId = fileId;
  imgZoomLevel = 1;
  imgRotateDeg = 0;
  renderPreviewModalForRecord(file, false);
  document.getElementById('previewModal').classList.add('open');
}

async function renderPreviewModalForRecord(record, isReadOnly) {
  const ext = (record.ext || '').toLowerCase();
  const meta = getExtMeta(ext);

  document.getElementById('previewModalTitle').innerHTML = `
    <span class="type-badge ${meta.badgeClass}">${meta.label}</span>
    <span>${escapeHtml(record.name)}</span>
  `;

  const bodyEl = document.getElementById('previewModalBody');
  const footerEl = document.getElementById('previewModalFooter');

  // 1. Markdown 文件：直接渲染出 Markdown，不展示原始源码 (底部保留可选的编辑切换)
  if (meta.subType === 'md') {
    let content = record.textContent;
    if (content == null && record.contentBlob) {
      try { content = await record.contentBlob.text(); } catch (e) { content = ''; }
    }
    content = content ?? '';

    bodyEl.innerHTML = `
      <div id="mdRenderedContainer" class="markdown-preview" style="max-width:820px;margin:0 auto;padding:8px 16px">
        ${renderSimpleMarkdown(content)}
      </div>
      <div id="mdEditContainer" class="editor-pane" style="display:none;height:100%;min-height:420px">
        <textarea id="onlineEditorTextarea" class="editor-textarea">${escapeHtml(content)}</textarea>
      </div>
    `;

    footerEl.innerHTML = isReadOnly
      ? `<button class="btn" onclick="closePreviewModal()">关闭</button>`
      : `
        <button id="mdToggleEditBtn" class="btn" onclick="toggleMarkdownEditMode()">编辑</button>
        <button id="mdSaveBtn" class="btn btn-primary" style="display:none" onclick="saveOnlineTextEdit()">保存</button>
        <button class="btn" onclick="closePreviewModal()">关闭</button>
      `;
    return;
  }

  // 2. 纯文本 (txt/csv) 与所有“其他”自定义后缀格式 (.自定义格式)：默认以文本格式打开并可编辑
  if (meta.subType === 'text') {
    let content = record.textContent;
    if (content == null && record.contentBlob) {
      try { content = await record.contentBlob.text(); } catch (e) { content = ''; }
    }
    content = content ?? '';

    bodyEl.innerHTML = `
      <div class="editor-pane" style="height:100%;min-height:420px">
        <textarea id="onlineEditorTextarea" class="editor-textarea" ${isReadOnly ? 'readonly' : ''}>${escapeHtml(content)}</textarea>
      </div>
    `;

    footerEl.innerHTML = isReadOnly
      ? `<button class="btn" onclick="closePreviewModal()">关闭</button>`
      : `
        <button class="btn" onclick="closePreviewModal()">取消</button>
        <button class="btn btn-primary" onclick="saveOnlineTextEdit()">保存</button>
      `;
    return;
  }

  // 3. 图片 (svg / jpg / jpeg / png / gif / webp 等)
  if (meta.category === 'img') {
    const imgBlob = ext === 'svg'
      ? new Blob([record.contentBlob], { type: 'image/svg+xml' })
      : record.contentBlob;
    const imgUrl = createManagedBlobUrl(imgBlob);
    bodyEl.innerHTML = `
      <div style="display:flex;justify-content:center;gap:6px;margin-bottom:10px">
        <button class="btn btn-sm" onclick="adjustPreviewImage(0.2, 0)">放大</button>
        <button class="btn btn-sm" onclick="adjustPreviewImage(-0.2, 0)">缩小</button>
        <button class="btn btn-sm" onclick="adjustPreviewImage(0, 90)">旋转</button>
        ${!isReadOnly ? `<button class="btn btn-sm" onclick="closePreviewModal(); triggerReplaceFile('${record.id}')">更换图片</button>` : ''}
      </div>
      <div class="img-preview-stage">
        <img id="previewStageImg" src="${imgUrl}" />
      </div>
    `;
    footerEl.innerHTML = `<button class="btn" onclick="closePreviewModal()">关闭</button>`;
    return;
  }

  // 4. 音视频 (mp4 / webm / mov / mp3 / wav / flac 等)
  if (meta.category === 'media') {
    const mediaUrl = createManagedBlobUrl(record.contentBlob);
    if (meta.subType === 'video') {
      bodyEl.innerHTML = `
        <div class="img-preview-stage" style="background:#09090b">
          <video src="${mediaUrl}" controls autoplay style="max-width:100%;max-height:66vh;border-radius:6px;outline:none"></video>
        </div>
      `;
    } else {
      bodyEl.innerHTML = `
        <div style="max-width:460px;margin:48px auto;text-align:center;padding:32px 24px;background:var(--bg-subtle);border-radius:12px">
          <div class="file-ext-icon ${meta.badgeClass}" style="width:56px;height:56px;font-size:15px;margin:0 auto 14px">${meta.icon}</div>
          <div style="font-weight:600;font-size:15px;margin-bottom:16px">${escapeHtml(record.name)}</div>
          <audio src="${mediaUrl}" controls autoplay style="width:100%;outline:none"></audio>
        </div>
      `;
    }
    footerEl.innerHTML = `
      ${!isReadOnly ? `<button class="btn" onclick="closePreviewModal(); triggerReplaceFile('${record.id}')">替换文件</button>` : ''}
      <button class="btn" onclick="closePreviewModal()">关闭</button>
    `;
    return;
  }

  // 5. PDF 在线阅读
  if (ext === 'pdf') {
    const pdfUrl = createManagedBlobUrl(new Blob([record.contentBlob], { type: 'application/pdf' }));
    bodyEl.innerHTML = `<iframe src="${pdfUrl}" style="width:100%;height:70vh;border:none;border-radius:6px"></iframe>`;
    footerEl.innerHTML = `
      ${!isReadOnly ? `<button class="btn" onclick="closePreviewModal(); triggerReplaceFile('${record.id}')">上传新版本替换</button>` : ''}
      <button class="btn" onclick="closePreviewModal()">关闭</button>
    `;
    return;
  }

  // 6. Office 文档 (Word / Excel / PPT) 与压缩包 (ZIP / RAR / 7Z 等)
  bodyEl.innerHTML = `
    <div style="max-width:420px;margin:40px auto;text-align:center">
      <div class="file-ext-icon ${meta.badgeClass}" style="width:52px;height:52px;font-size:15px;margin:0 auto 12px">${meta.icon}</div>
      <div style="font-weight:600;font-size:16px;margin-bottom:4px">${escapeHtml(record.name)}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:20px">${formatSize(record.size)} · ${formatTime(record.updatedAt)}</div>
      ${
        !isReadOnly
          ? `<div style="display:flex;justify-content:center;gap:8px">
               <button class="btn btn-primary" onclick="downloadFile('${record.id}')">下载文件</button>
               <button class="btn" onclick="closePreviewModal(); triggerReplaceFile('${record.id}')">上传新版本替换</button>
             </div>`
          : ''
      }
    </div>
  `;
  footerEl.innerHTML = `<button class="btn" onclick="closePreviewModal()">关闭</button>`;
}

function toggleMarkdownEditMode() {
  const rendered = document.getElementById('mdRenderedContainer');
  const editor = document.getElementById('mdEditContainer');
  const toggleBtn = document.getElementById('mdToggleEditBtn');
  const saveBtn = document.getElementById('mdSaveBtn');
  if (!rendered || !editor) return;

  const isEditing = editor.style.display !== 'none';
  if (isEditing) {
    const ta = document.getElementById('onlineEditorTextarea');
    if (ta) rendered.innerHTML = renderSimpleMarkdown(ta.value);
    editor.style.display = 'none';
    rendered.style.display = 'block';
    if (toggleBtn) toggleBtn.textContent = '编辑';
    if (saveBtn) saveBtn.style.display = 'none';
  } else {
    rendered.style.display = 'none';
    editor.style.display = 'flex';
    if (toggleBtn) toggleBtn.textContent = '预览';
    if (saveBtn) saveBtn.style.display = 'inline-flex';
  }
}

function updateLiveMarkdownPreview() {
  const ta = document.getElementById('onlineEditorTextarea');
  const prev = document.getElementById('liveMarkdownPreview');
  if (ta && prev) prev.innerHTML = renderSimpleMarkdown(ta.value);
}

function adjustPreviewImage(zoomDelta, rotateDelta) {
  imgZoomLevel = Math.max(0.25, Math.min(4, imgZoomLevel + zoomDelta));
  imgRotateDeg = (imgRotateDeg + rotateDelta) % 360;
  const img = document.getElementById('previewStageImg');
  if (img) img.style.transform = `scale(${imgZoomLevel}) rotate(${imgRotateDeg}deg)`;
}

async function saveOnlineTextEdit() {
  if (!previewingFileId) return;
  const file = state.files.find((f) => f.id === previewingFileId);
  const ta = document.getElementById('onlineEditorTextarea');
  if (!file || !ta) return;

  const newText = ta.value;
  const mime = file.ext === 'md' ? 'text/markdown' : 'text/plain';
  const newBlob = new Blob([newText], { type: `${mime};charset=utf-8` });

  file.textContent = newText;
  file.contentBlob = newBlob;
  file.size = newBlob.size;
  file.updatedAt = Date.now();
  await window.boxDB.saveFile(file);

  closePreviewModal();
  await reloadAllData();
  if (window.localSync && window.localSync.isReady()) {
    await window.localSync.syncFileWrite(file, state.boxes, state.files);
  }
  renderAll();
  showToast('已保存');
}

function closePreviewModal() {
  clearObjectUrls();
  document.getElementById('previewModal').classList.remove('open');
  previewingFileId = null;
}

function bindGlobalEvents() {
  const searchInput = document.getElementById('globalSearchInput');
  const typeSelect = document.getElementById('globalTypeSelect');
  const fileInput = document.getElementById('hiddenFileInput');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderMainContent();
    });
  }
  if (typeSelect) {
    typeSelect.addEventListener('change', (e) => {
      state.searchTypeFilter = e.target.value;
      renderMainContent();
    });
  }
  if (fileInput) {
    fileInput.addEventListener('change', handleFileInputChange);
  }

  // 防止将本地文件拖到非导入区域时浏览器直接打开该文件
  ['dragover', 'drop'].forEach((evtName) => {
    window.addEventListener(evtName, (e) => {
      if (e.defaultPrevented) return;
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files') && !state.draggedFileId) {
        e.preventDefault();
        if (evtName === 'dragover') e.dataTransfer.dropEffect = 'none';
      }
    });
  });

  // 鼠标侧键前进后退（Button 3: 后退, Button 4: 前进）与快捷键 Alt+Left / Alt+Right
  try {
    history.replaceState({ boxId: state.currentBoxId || null }, '', '');
  } catch (e) {}

  ['pointerdown', 'mousedown', 'auxclick'].forEach((evtName) => {
    window.addEventListener(evtName, (e) => {
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
      }
    });
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 3) {
      e.preventDefault();
      e.stopPropagation();
      navigateHistoryBack();
    } else if (e.button === 4) {
      e.preventDefault();
      e.stopPropagation();
      navigateHistoryForward();
    }
  });

  window.addEventListener('popstate', (e) => {
    const targetId = (e.state && ('boxId' in e.state)) ? e.state.boxId : null;
    const prevIdx = state.navHistory ? state.navHistory.lastIndexOf(targetId, state.navHistoryIdx - 1) : -1;
    if (prevIdx !== -1) {
      state.navHistoryIdx = prevIdx;
    }
    navigateToBox(targetId, true);
  });

  // 新建/编辑箱子弹窗：回车直接确认保存，Esc 直接取消关闭；速记弹窗：Esc 直接关闭；Alt+方向键前进后退
  document.addEventListener('keydown', (e) => {
    const boxModal = document.getElementById('boxModal');
    if (boxModal && boxModal.classList.contains('open')) {
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        saveBoxFromModal();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeBoxModal();
      }
      return;
    }

    const quickIdeaModal = document.getElementById('quickIdeaModal');
    if (quickIdeaModal && quickIdeaModal.classList.contains('open')) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeQuickIdeaModal();
        return;
      }
    }

    if (e.altKey && e.key === 'ArrowLeft') {
      e.preventDefault();
      navigateHistoryBack();
      return;
    } else if (e.altKey && e.key === 'ArrowRight') {
      e.preventDefault();
      navigateHistoryForward();
      return;
    }
  });
}

window.addEventListener('DOMContentLoaded', initApp);
