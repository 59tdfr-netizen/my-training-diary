'use strict';

/* ============================================================
   ФОТО ПРОГРЕССА
   Метаданные — в localStorage, сами изображения — в IndexedDB
   (localStorage не подходит по объёму). Фото сжимаются в браузере.
   ============================================================ */

const PHOTO_POSES = [
  { id: 'front', label: 'Спереди' },
  { id: 'side', label: 'Сбоку' },
  { id: 'back', label: 'Сзади' },
  { id: 'other', label: 'Другое' }
];

const MEDIA_DB_NAME = 'training_diary_media';
const MEDIA_STORE = 'photos';

function photoPoseLabel(id){
  const p = PHOTO_POSES.find(x => x.id === id);
  return p ? p.label : 'Фото';
}

function normalizePhotos(raw){
  const list = Array.isArray(raw) ? raw : [];
  return list.filter(p => p && p.id).map(p => ({
    id: p.id,
    date: p.date || toDateKey(new Date()),
    pose: PHOTO_POSES.some(x => x.id === p.pose) ? p.pose : 'other',
    weight: numOrEmpty(p.weight),
    note: typeof p.note === 'string' ? p.note : '',
    ai: (p.ai && typeof p.ai === 'object') ? p.ai : null,
    createdAt: p.createdAt || new Date().toISOString()
  }));
}

function getPhotos(){
  if (!Array.isArray(state.data.photos)) state.data.photos = [];
  return [...state.data.photos].sort((a, b) => {
    const d = new Date(b.date) - new Date(a.date);
    return d !== 0 ? d : new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function photoById(id){
  return (state.data.photos || []).find(p => p.id === id) || null;
}

const photoUrlCache = new Map();

function mediaDbAvailable(){
  return typeof indexedDB !== 'undefined';
}

function mediaOpen(){
  return new Promise((resolve, reject) => {
    if (!mediaDbAvailable()){ reject(new Error('IndexedDB недоступен в этом браузере')); return; }
    const req = indexedDB.open(MEDIA_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(MEDIA_STORE)) db.createObjectStore(MEDIA_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Не удалось открыть хранилище фото'));
  });
}

function closeMediaDb(db){
  try { db.close(); } catch (_) {}
}

async function mediaPut(id, blob){
  const db = await mediaOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, 'readwrite');
    tx.objectStore(MEDIA_STORE).put(blob, id);
    tx.oncomplete = () => { closeMediaDb(db); resolve(true); };
    tx.onerror = () => { closeMediaDb(db); reject(tx.error || new Error('Не удалось сохранить фото')); };
    tx.onabort = () => { closeMediaDb(db); reject(tx.error || new Error('Сохранение фото отменено')); };
  });
}

async function mediaGet(id){
  const db = await mediaOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, 'readonly');
    const req = tx.objectStore(MEDIA_STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error || new Error('Не удалось прочитать фото'));
    tx.oncomplete = () => closeMediaDb(db);
    tx.onerror = () => closeMediaDb(db);
  });
}

async function mediaDelete(id){
  const db = await mediaOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, 'readwrite');
    tx.objectStore(MEDIA_STORE).delete(id);
    tx.oncomplete = () => { closeMediaDb(db); resolve(true); };
    tx.onerror = () => { closeMediaDb(db); reject(tx.error || new Error('Не удалось удалить фото')); };
  });
}

async function photoUrl(id){
  if (photoUrlCache.has(id)) return photoUrlCache.get(id);
  try {
    const blob = await mediaGet(id);
    if (!blob) return '';
    const url = URL.createObjectURL(blob);
    photoUrlCache.set(id, url);
    return url;
  } catch (e) {
    return '';
  }
}

function forgetPhotoUrl(id){
  const url = photoUrlCache.get(id);
  if (url){ URL.revokeObjectURL(url); photoUrlCache.delete(id); }
}

function compressImageFile(file, maxSide = 900, quality = 0.78){
  return new Promise((resolve, reject) => {
    let url = '';
    try { url = URL.createObjectURL(file); } catch (e) { reject(e); return; }
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob); else reject(new Error('Не удалось сжать изображение'));
        }, 'image/jpeg', quality);
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Файл не похож на изображение')); };
    img.src = url;
  });
}

async function addPhotoFromFile(file, meta){
  if (!file) return;
  showToast('Сжимаю и сохраняю фото…');
  try {
    const blob = await compressImageFile(file);
    const id = uid();
    await mediaPut(id, blob);
    const photo = {
      id,
      date: meta.date || toDateKey(new Date()),
      pose: meta.pose || 'front',
      weight: numOrEmpty(meta.weight),
      note: meta.note || '',
      ai: null,
      createdAt: new Date().toISOString()
    };
    if (!Array.isArray(state.data.photos)) state.data.photos = [];
    state.data.photos.push(photo);
    saveData();
    render();
    showToast('Фото добавлено', 'success');
  } catch (e) {
    showToast('Не удалось сохранить фото: ' + e.message, 'error');
  }
}

async function deletePhoto(id){
  const ok = await confirmDialog('Удалить фото?', 'Изображение и результаты его AI-разбора будут удалены.', 'Удалить', true);
  if (!ok) return;
  try {
    await mediaDelete(id).catch(() => {});
    forgetPhotoUrl(id);
    state.data.photos = (state.data.photos || []).filter(p => p.id !== id);
    if (state.photoCompare && (state.photoCompare.a === id || state.photoCompare.b === id)){
      state.photoCompare = { a: '', b: '' };
    }
    saveData(); render();
    showToast('Фото удалено', 'success');
  } catch (e) {
    showToast('Не удалось удалить фото: ' + e.message, 'error');
  }
}

async function hydratePhotoImages(root){
  if (!root || typeof root.querySelectorAll !== 'function') return;
  if (!mediaDbAvailable()) return;
  const imgs = Array.from(root.querySelectorAll('img[data-photo-id]'));
  for (const img of imgs) {
    const id = img.getAttribute('data-photo-id');
    if (!id) continue;
    const url = await photoUrl(id);
    if (url && img.getAttribute('data-photo-id') === id) img.src = url;
  }
  const bigs = Array.from(root.querySelectorAll('img[data-photo-src]'));
  for (const big of bigs){
    const url = await photoUrl(big.getAttribute('data-photo-src'));
    if (url && big.getAttribute('data-photo-src')) big.src = url;
  }
}

function photoZoneChips(ai){
  if (!ai || !Array.isArray(ai.zones) || !ai.zones.length) return '';
  return `<div class="zone-chips">${ai.zones.slice(0, 5).map(z =>
    `<span class="zone-chip zone-${escapeHtml(String(z.priority || '').toLowerCase())}">${escapeHtml(z.name || '')}</span>`
  ).join('')}</div>`;
}

function renderPhotoAI(ai){
  if (!ai) return '';
  const list = arr => (Array.isArray(arr) ? arr.filter(Boolean) : []);
  return `<div class="ai-result">
    <div class="ai-result-head"><strong>AI-разбор</strong>${ai.createdAt ? `<span class="muted small">${fmtDate(ai.createdAt)}</span>` : ''}</div>
    ${ai.summary ? `<p class="ai-summary">${escapeHtml(ai.summary)}</p>` : ''}
    ${photoZoneChips(ai)}
    ${list(ai.posture).length ? `<div class="ai-sub"><span class="muted small">Осанка</span><ul class="rules-list">${list(ai.posture).map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>` : ''}
    ${list(ai.recommendations).length ? `<div class="ai-sub"><span class="muted small">Что делать</span><ul class="rules-list">${list(ai.recommendations).map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>` : ''}
    ${ai.disclaimer ? `<div class="muted small" style="margin-top:6px">${escapeHtml(ai.disclaimer)}</div>` : ''}
  </div>`;
}

function renderPhotosSection(){
  const photos = getPhotos();
  const cmp = state.photoCompare || { a: '', b: '' };
  const aiReady = aiConfigured();
  const weightNow = (function(){
    try { return getBodySummary().lastWeight ? f1(getBodySummary().lastWeight.value) : ''; } catch (e) { return ''; }
  })();

  let gallery;
  if (!photos.length){
    gallery = `<div class="empty-state" style="padding:24px 16px">
      <div class="empty-art">${maleAthleteSvg('empty-figure')}</div>
      <div class="empty-title">Пока нет фото</div>
      <div class="empty-text">Фото в одинаковых условиях (свет, поза, расстояние) показывают прогресс раньше, чем весы.</div>
    </div>`;
  } else {
    gallery = `<div class="photo-grid">${photos.map(p => {
      const weight = p.weight !== '' ? f1(p.weight) + ' кг' : '';
      return `<div class="photo-card">
        <div class="photo-thumb" data-action="open-photo" data-id="${p.id}">
          <img data-photo-id="${p.id}" alt="Фото прогресса ${escapeHtml(fmtDate(p.date))}" loading="lazy">
        </div>
        <div class="photo-meta">
          <div class="photo-date">${fmtDate(p.date)} <span class="muted small">${escapeHtml(photoPoseLabel(p.pose))}</span></div>
          ${weight ? `<div class="muted small">${weight}</div>` : ''}
          ${p.note ? `<div class="muted small">${escapeHtml(p.note)}</div>` : ''}
        </div>
        ${p.ai ? `<div class="photo-ai-badge">AI-разбор готов</div>` : ''}
        <div class="photo-actions">
          <button class="btn btn-ghost btn-sm" data-action="open-photo" data-id="${p.id}">Открыть</button>
          <button class="btn btn-ghost btn-sm" data-action="photo-ai" data-id="${p.id}">${aiReady ? 'AI-разбор' : 'AI?'}</button>
          <button class="btn btn-danger btn-sm" data-action="photo-delete" data-id="${p.id}">×</button>
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  const optionsFor = selected => photos.map(p =>
    `<option value="${p.id}" ${selected === p.id ? 'selected' : ''}>${escapeHtml(fmtDate(p.date))} • ${escapeHtml(photoPoseLabel(p.pose))}</option>`
  ).join('');
  const compareHtml = photos.length >= 2 ? `<div class="compare-block">
    <div class="compare-selects">
      <label class="field"><span>Было</span><select class="input" data-field="compare-a"><option value="">—</option>${optionsFor(cmp.a)}</select></label>
      <label class="field"><span>Стало</span><select class="input" data-field="compare-b"><option value="">—</option>${optionsFor(cmp.b)}</select></label>
    </div>
    ${(cmp.a || cmp.b) ? `<div class="compare-grid">
      <div class="compare-cell">${cmp.a ? `<img data-photo-src="${cmp.a}" alt="Фото «было»">` : '<div class="compare-empty">Выберите фото</div>'}</div>
      <div class="compare-cell">${cmp.b ? `<img data-photo-src="${cmp.b}" alt="Фото «стало»">` : '<div class="compare-empty">Выберите фото</div>'}</div>
    </div>` : '<p class="muted small">Выберите два фото, чтобы сравнить их рядом.</p>'}
  </div>` : '';

  return `<section class="section" id="photosSection">
    <div class="section-header-row">
      <h2 class="section-title">Фото прогресса</h2>
      <span class="muted small">${photos.length} ${pluralRu(photos.length, 'фото', 'фото', 'фото')} • хранятся только на устройстве</span>
    </div>
    <div class="rules-card">
      <div class="form-grid">
        <label class="field"><span>Дата</span><input type="date" class="input" id="photoDate" value="${toDateKey(new Date())}"></label>
        <label class="field"><span>Ракурс</span><select class="input" id="photoPose">${PHOTO_POSES.map(p => `<option value="${p.id}">${p.label}</option>`).join('')}</select></label>
        <label class="field"><span>Вес, кг <span class="muted">(необяз.)</span></span><input type="number" step="0.1" class="input" id="photoWeight" value="${weightNow ? weightNow.replace(',', '.') : ''}" placeholder="—"></label>
        <label class="field"><span>Заметка</span><input type="text" class="input" id="photoNote" placeholder="например, утро, без пампа"></label>
      </div>
      <div class="section-actions" style="margin-top:10px">
        <label class="btn btn-primary" style="cursor:pointer">
          Добавить фото
          <input type="file" id="photoFile" accept="image/*" capture="environment" hidden>
        </label>
        <span class="muted small" style="align-self:center">Фото сжимается до 900 px и не покидает устройство, пока вы сами не запустите AI-разбор.</span>
      </div>
    </div>
    ${photos.length ? `<div style="margin-top:12px">${gallery}</div>` : gallery}
    ${compareHtml}
    ${aiReady ? '' : '<p class="muted small" style="margin-top:8px">AI-разбор фото станет доступен после подключения ключа в разделе «Тренер» → «AI-тренер».</p>'}
  </section>`;
}

async function openPhotoModal(id){
  const p = photoById(id);
  if (!p) return;
  const html = `<h3>Фото от ${fmtDate(p.date)}</h3>
    <div class="modal-photo-wrap"><img id="modalPhoto" alt="Фото прогресса"></div>
    <div class="muted small" style="margin:8px 0">${escapeHtml(photoPoseLabel(p.pose))}${p.weight !== '' ? ' • ' + f1(p.weight) + ' кг' : ''}${p.note ? ' • ' + escapeHtml(p.note) : ''}</div>
    ${renderPhotoAI(p.ai)}
    <div class="modal-actions">
      <button class="btn btn-ghost" data-action="photo-ai" data-id="${p.id}">${aiConfigured() ? 'AI-разбор' : 'Подключить AI'}</button>
      <button class="btn btn-primary" data-modal="cancel">Закрыть</button>
    </div>`;
  openModal(html, 'info');
  const img = document.getElementById('modalPhoto');
  if (img){
    const url = await photoUrl(p.id);
    if (url) img.src = url;
  }
}

async function analyzePhotoAI(id){
  const p = photoById(id);
  if (!p) return;
  if (!aiConfigured()){
    showToast('Сначала подключите AI-ключ в разделе «Тренер»', 'error');
    return;
  }
  if (typeof ensureAIConsent === 'function' && !(await ensureAIConsent())) return;
  showToast('AI анализирует фото…');
  try {
    const blob = await mediaGet(id);
    if (!blob) throw new Error('Изображение не найдено в хранилище');
    const dataUrl = await blobToDataURL(blob);
    const result = await aiAnalyzeBodyPhoto(dataUrl);
    p.ai = Object.assign({}, result, { createdAt: new Date().toISOString() });
    saveData(); render();
    showToast('AI-разбор готов', 'success');
  } catch (e) {
    showToast('AI-разбор не удался: ' + e.message, 'error');
  }
}
