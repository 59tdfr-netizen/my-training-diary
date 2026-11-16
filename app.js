'use strict';

/* ==================== УТИЛИТЫ ==================== */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const uid = () => 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
const deepClone = (o) => JSON.parse(JSON.stringify(o));
const pad2 = (n) => String(n).padStart(2, '0');

function escapeHtml(s){
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
/* Значение для CSV: экранирует кавычки и нейтрализует формулы Excel. */
function csvCell(value){
  let s = String(value == null ? '' : value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
function toDateKey(d){ return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate()); }
function fmtDate(iso){
  const d = new Date(iso); if (isNaN(d)) return '—';
  return pad2(d.getDate()) + '.' + pad2(d.getMonth()+1) + '.' + d.getFullYear();
}
function fmtDateTime(iso){
  const d = new Date(iso); if (isNaN(d)) return '—';
  return fmtDate(iso) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}
function getWeekStart(date){
  const d = new Date(date); d.setHours(0,0,0,0);
  const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff); return d;
}
function addDays(date, n){ const d = new Date(date); d.setDate(d.getDate()+n); return d; }

/* ==================== ПРОГРАММА ПО УМОЛЧАНИЮ ==================== */
const DEFAULT_PROGRAM = {
  name: "Программа тренировок Павла",
  subtitle: "1 этап • 3 недели • адаптация и техника",
  rules: [
    "Разминка 5–7 минут перед каждой тренировкой",
    "2–3 подхода на каждое упражнение (в 1-й неделе)",
    "Отдых между подходами 60–90 сек.",
    "Вес такой, чтобы оставалось 2–3 повтора в запасе. Без отказа.",
    "Техника важнее веса. Никаких подходов до отказа."
  ],
  notes: [
    "Если ты выполнил все подходы и повторения с запасом (мог бы сделать ещё 2–3 повтора), на следующей тренировке попробуй сделать на 1–2 повтора больше.",
    "Когда сможешь сделать верхний диапазон повторов во всех подходах — увеличь вес немного и возвращайся к нижней границе повторов."
  ],
  goals: ["Восстановить технику", "Вернуться к системности", "Почувствовать тело и нагрузку", "Не гнаться за весом"],
  extra: [
    { title: "Суббота — Кардио", text: "Степпер 40–50 минут или прогулка быстрым шагом 40–60 минут. Кардио выполняется отдельно от силовых тренировок." },
    { title: "Воскресенье — Отдых", text: "Лёгкая прогулка и растяжка по желанию." }
  ],
  days: [
    {
      id: 'day-mon', name: "Понедельник", focus: "Ноги + Ягодицы", color: "green",
      exercises: [
        { id:'ex-mon-1', name:"Ягодичный мост", sets:3, reps:"12", unit:"kg", startWeight:"8–10", note:"гантель на тазу" },
        { id:'ex-mon-2', name:"Румынская тяга", sets:3, reps:"10", unit:"kg", startWeight:"5–6", note:"гантели по 5–6 кг" },
        { id:'ex-mon-3', name:"Обычные выпады", sets:2, reps:"10", unit:"reps", startWeight:"", note:"на каждую ногу, без веса" },
        { id:'ex-mon-4', name:"Приседания с гантелью (goblet squat)", sets:3, reps:"10", unit:"kg", startWeight:"8–10", note:"" },
        { id:'ex-mon-5', name:"Махи ногой с резинкой", sets:2, reps:"15–20", unit:"reps", startWeight:"", note:"лёгкая/средняя резинка" }
      ]
    },
    {
      id: 'day-wed', name: "Среда", focus: "Верх тела", color: "blue",
      exercises: [
        { id:'ex-wed-1', name:"Тяга гантели одной рукой", sets:3, reps:"10", unit:"kg", startWeight:"6–8", note:"на каждую руку" },
        { id:'ex-wed-2', name:"Жим гантелей лёжа", sets:3, reps:"10", unit:"kg", startWeight:"5–6", note:"на полу или скамье", equipment:['dumbbells'] },
        { id:'ex-wed-3', name:"Разведения с резинкой (в наклоне)", sets:3, reps:"12", unit:"reps", startWeight:"", note:"лёгкая/средняя резинка" },
        { id:'ex-wed-4', name:"Жим гантелей стоя", sets:2, reps:"8–10", unit:"kg", startWeight:"4–5", note:"" },
        { id:'ex-wed-5', name:"Планка", sets:3, reps:"20–30", unit:"sec", startWeight:"", note:"секунд" },
        { id:'ex-wed-6', name:"«Велосипед»", sets:2, reps:"15–20", unit:"reps", startWeight:"", note:"" },
        { id:'ex-wed-7', name:"Подъём ног", sets:2, reps:"10–12", unit:"reps", startWeight:"", note:"с согнутыми коленями — если тяжело" }
      ]
    },
    {
      id: 'day-fri', name: "Пятница", focus: "Общая силовая", color: "purple",
      exercises: [
        { id:'ex-fri-1', name:"Приседания сумо", sets:3, reps:"10", unit:"kg", startWeight:"12", note:"гиря 12 кг" },
        { id:'ex-fri-2', name:"Ягодичный мост", sets:3, reps:"12", unit:"kg", startWeight:"10–12", note:"" },
        { id:'ex-fri-3', name:"Тяга гантелей в наклоне", sets:3, reps:"10", unit:"kg", startWeight:"6–8", note:"" },
        { id:'ex-fri-4', name:"Жим гантелей стоя", sets:3, reps:"8", unit:"kg", startWeight:"4–5", note:"" },
        { id:'ex-fri-5', name:"Сгибание рук с гантелями", sets:2, reps:"12", unit:"kg", startWeight:"4–5", note:"" },
        { id:'ex-fri-6', name:"Разгибание рук с резинкой (трицепс)", sets:2, reps:"15", unit:"reps", startWeight:"", note:"лёгкая/средняя резинка" }
      ]
    }
  ]
};

/* ==================== ХРАНИЛИЩЕ ==================== */
const STORAGE_KEY = 'training_diary_v1';
let activeTimer = { exIdx: null, timeLeft: 0, intervalId: null, totalTime: 90 };

const state = { view:'home', params:{}, data:null, editDraft:null, editMode:'current', uploadImage:null, historyDraft:null, measureDraft:null, profileOpen:false, nutritionDate:null, nutritionDraft:null, aiDish:null, scaleAI:null, photoCompare:{ a:'', b:'' } };

function ensureIds(program){
  program.days = program.days || [];
  program.days.forEach(day => {
    day.id = day.id || uid();
    day.exercises = day.exercises || [];
    day.exercises.forEach(ex => { ex.id = ex.id || uid(); });
  });
}
function loadRaw(){
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; }
  catch(e){ console.error(e); return null; }
}
function saveData(){
  try {
    state.data.meta = state.data.meta || {};
    state.data.meta.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  } catch(e){ showToast('Не удалось сохранить данные: ' + e.message, 'error'); }
}
let saveTimer = null;
function saveDebounced(){ clearTimeout(saveTimer); saveTimer = setTimeout(saveData, 300); }

function initData(){
  const raw = loadRaw();
  if (!raw){
    state.data = {
      version: 2, meta: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastBackupAt: new Date().toISOString() },
      program: deepClone(DEFAULT_PROGRAM), programArchive: [], history: [], activeWorkout: null,
      body: normalizeBody(null), nutrition: normalizeNutrition(null), inventory: normalizeInventory(null),
      ai: normalizeAI(null), photos: []
    };
    enrichProgramMetadata(state.data.program);
    ensureIds(state.data.program); saveData(); return;
  }
  raw.program = raw.program || deepClone(DEFAULT_PROGRAM);
  raw.programArchive = raw.programArchive || [];
  raw.history = raw.history || [];
  raw.activeWorkout = raw.activeWorkout || null;
  raw.body = normalizeBody(raw.body);
  raw.nutrition = normalizeNutrition(raw.nutrition);
  raw.inventory = normalizeInventory(raw.inventory);
  raw.ai = normalizeAI(raw.ai);
  raw.photos = normalizePhotos(raw.photos);
  enrichProgramMetadata(raw.program);
  raw.meta = raw.meta || {};
  if (!raw.meta.lastBackupAt) raw.meta.lastBackupAt = new Date().toISOString();
  ensureIds(raw.program);
  state.data = raw;
}

/* ==================== UI-ХЕЛПЕРЫ ==================== */
let toastTimer = null;
function showToast(msg, type = 'info'){
  const t = $('#toast');
  t.textContent = msg; t.className = 'toast toast-' + type; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 4000);
}

let modalResolve = null;
let modalMode = 'confirm';
function openModal(html, mode = 'confirm'){
  return new Promise(resolve => { modalMode = mode; modalResolve = resolve; $('#modalContent').innerHTML = html; $('#modal').hidden = false; });
}
function closeModal(value){
  $('#modal').hidden = true; $('#modalContent').innerHTML = '';
  const r = modalResolve; modalResolve = null; if (r) r(value);
}
function confirmDialog(title, text, okLabel = 'Подтвердить', danger = false){
  return openModal(
    `<h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p>
     <div class="modal-actions">
       <button class="btn btn-ghost" data-modal="cancel">Отмена</button>
       <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-modal="ok">${escapeHtml(okLabel)}</button>
     </div>`
  );
}

/* ==================== ЗВУК ==================== */
function playBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) { console.warn('Audio error', e); }
}

/* ==================== ТАЙМЕР ==================== */
function startTimer(exIdx) {
  if (activeTimer.intervalId) clearInterval(activeTimer.intervalId);
  activeTimer.exIdx = exIdx;
  activeTimer.timeLeft = activeTimer.totalTime;
  
  document.querySelectorAll('.btn-timer').forEach(btn => btn.classList.remove('running'));
  const btn = document.getElementById('timer-btn-' + exIdx);
  if (btn) btn.classList.add('running');

  updateTimerDisplay();
  
  activeTimer.intervalId = setInterval(() => {
    activeTimer.timeLeft--;
    if (activeTimer.timeLeft <= 0) {
      clearInterval(activeTimer.intervalId);
      activeTimer.intervalId = null;
      playBeep();
      showToast('Отдых окончен!', 'success');
      const btn = document.getElementById('timer-btn-' + activeTimer.exIdx);
      if (btn) { btn.classList.remove('running'); btn.innerHTML = `⏱ Отдых ${activeTimer.totalTime}с`; }
      const disp = document.getElementById('timer-disp-' + activeTimer.exIdx);
      if (disp) disp.textContent = 'Готово!';
      activeTimer.exIdx = null;
      return;
    }
    updateTimerDisplay();
  }, 1000);
}

function stopTimer(exIdx) {
  if (activeTimer.intervalId) clearInterval(activeTimer.intervalId);
  activeTimer.intervalId = null;
  activeTimer.exIdx = null;
  const btn = document.getElementById('timer-btn-' + exIdx);
  if (btn) { btn.classList.remove('running'); btn.innerHTML = `⏱ Отдых ${activeTimer.totalTime}с`; }
  const disp = document.getElementById('timer-disp-' + exIdx);
  if (disp) disp.textContent = '';
}

function updateTimerDisplay() {
  if (activeTimer.exIdx === null) return;
  const btn = document.getElementById('timer-btn-' + activeTimer.exIdx);
  if (btn) {
    const m = Math.floor(activeTimer.timeLeft / 60);
    const s = activeTimer.timeLeft % 60;
    btn.innerHTML = `⏹ Стоп ${m}:${pad2(s)}`;
  }
}

/* ==================== РЕНДЕР ==================== */
function render(){
  const app = $('#app');
  let html = '';
  switch(state.view){
    case 'home': html = renderHome(); break;
    case 'trainer': html = renderTrainer(); break;
    case 'nutrition': html = renderNutrition(); break;
    case 'body': html = renderBody(); break;
    case 'workout': html = renderWorkout(); break;
    case 'history': html = renderHistory(); break;
    case 'history-detail': html = renderHistoryDetail(state.params.id); break;
    case 'history-edit': html = renderHistoryEdit(state.params.id); break;
    case 'exercise-history': html = renderExerciseHistory(state.params.name, state.params.key); break;
    case 'edit': html = renderEdit(); break;
    case 'upload': html = renderUpload(); break;
    case 'backup': html = renderBackup(); break;
    default: html = renderHome();
  }
  app.innerHTML = html;
  if (typeof hydratePhotoImages === 'function'){
    Promise.resolve(hydratePhotoImages(app)).catch(() => {});
  }
  $('#brandSub').textContent = state.data.program.name + ' • ' + (state.data.program.subtitle || '');
  const navMap = { home:'home', trainer:'trainer', nutrition:'nutrition', body:'body', workout:'home', edit:'more', upload:'more', history:'history', 'history-detail':'history', 'history-edit':'history', 'exercise-history':'history', backup:'more' };
  $$('.nav-btn[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === navMap[state.view]));
  
  if (activeTimer.exIdx !== null && state.view !== 'workout') stopTimer(activeTimer.exIdx);
  if (activeTimer.exIdx !== null && state.view === 'workout') {
     const btn = document.getElementById('timer-btn-' + activeTimer.exIdx);
     if (btn) btn.classList.add('running');
     updateTimerDisplay();
  } else {
     window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }
}

/* ==================== ГЛАВНАЯ ==================== */
function getDayStatus(dayId){
  const active = state.data.activeWorkout;
  if (active && active.dayId === dayId) return 'in-progress';
  const weekStart = getWeekStart(new Date());
  const weekEnd = addDays(weekStart, 7);
  const done = state.data.history.some(w => { if (w.dayId !== dayId) return false; const d = new Date(w.date); return d >= weekStart && d < weekEnd; });
  return done ? 'done' : 'not-started';
}
function getLastWorkoutForDay(dayId){
  const sorted = [...state.data.history].sort((a, b) => new Date(b.date) - new Date(a.date));
  return sorted.find(w => w.dayId === dayId) || null;
}
function getHistoricalMaxWeight(exerciseName) {
  let max = 0;
  state.data.history.forEach(w => {
    w.exercises.forEach(ex => {
      if (ex.name === exerciseName) {
        ex.sets.forEach(s => {
          const wgt = parseFloat(s.weight);
          if (!isNaN(wgt) && wgt > max) max = wgt;
        });
      }
    });
  });
  return max;
}

function renderHeatmap() {
  const isMobile = window.innerWidth <= 768;
  const lookbackDays = isMobile ? 83 : 364; // 12 недель на телефоне, 1 год на ПК

  const today = new Date();
  today.setHours(0,0,0,0);
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - lookbackDays);
  
  const dayOfWeek = startDate.getDay() === 0 ? 6 : startDate.getDay() - 1;
  startDate.setDate(startDate.getDate() - dayOfWeek);

  const counts = {};
  state.data.history.forEach(w => {
    const d = new Date(w.date);
    const key = toDateKey(d);
    counts[key] = (counts[key] || 0) + 1;
  });

  let cellsHtml = '';
  let d = new Date(startDate);
  let totalWeeks = 0;

  while (d <= today) {
    const key = toDateKey(d);
    const c = counts[key] || 0;
    let level = 0;
    if (c === 1) level = 1;
    else if (c === 2) level = 2;
    else if (c >= 3) level = 3;

    const isFuture = d > today;
    if (d.getDay() === 1) totalWeeks++; 
    
    let title = fmtDate(d);
    if (c > 0) title += ` (тренировок: ${c})`;

    const isToday = key === toDateKey(today);
    cellsHtml += `<div class="heatmap-cell${isToday ? ' is-today' : ''}" data-level="${isFuture ? 0 : level}" title="${title}"></div>`;
    d.setDate(d.getDate() + 1);
  }

  const cellSize = isMobile ? 8 : 12;
  const gapSize = isMobile ? 2 : 3;

  return `<div class="heatmap-container">
    <div class="heatmap-grid" style="grid-template-columns: repeat(${totalWeeks}, ${cellSize}px); gap: ${gapSize}px;">
      ${cellsHtml}
    </div>
    <div class="heatmap-legend">
      <span>Меньше</span>
      <div class="heatmap-cell" data-level="0" style="width:${cellSize}px;height:${cellSize}px"></div>
      <div class="heatmap-cell" data-level="1" style="width:${cellSize}px;height:${cellSize}px"></div>
      <div class="heatmap-cell" data-level="2" style="width:${cellSize}px;height:${cellSize}px"></div>
      <div class="heatmap-cell" data-level="3" style="width:${cellSize}px;height:${cellSize}px"></div>
      <span>Больше</span>
    </div>
  </div>`;
}

const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WEEKDAYS_RU = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const WEEKDAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function greetingByHour(){
  const h = new Date().getHours();
  if (h < 5) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}
function fmtDateLong(d){
  return d.getDate() + ' ' + MONTHS_RU[d.getMonth()] + ', ' + WEEKDAYS_RU[d.getDay()];
}
function nextPlannedDay(){
  const days = state.data.program.days || [];
  if (!days.length) return null;
  return days.find(day => getDayStatus(day.id) !== 'done') || days[0];
}

let svgSeq = 0;
/* Мужская иллюстрация: широкие плечи, узкая талия, гантели. */
function maleAthleteSvg(extraClass){
  const id = 'mg' + (++svgSeq);
  return `<svg class="hero-figure ${extraClass || ''}" viewBox="0 0 320 380" role="img" aria-label="Мужчина с гантелями">
    <defs>
      <linearGradient id="${id}a" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#8B5CF6"/>
        <stop offset=".55" stop-color="#A855F7"/>
        <stop offset="1" stop-color="#EC4899"/>
      </linearGradient>
      <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#6D4AFF"/>
        <stop offset="1" stop-color="#3B2A7A"/>
      </linearGradient>
    </defs>
    <circle cx="162" cy="162" r="130" fill="url(#${id}a)" opacity=".11"/>
    <circle cx="262" cy="92" r="9" fill="#F472B6" opacity=".55"/>
    <circle cx="62" cy="248" r="6" fill="#A855F7" opacity=".45"/>
    <circle cx="248" cy="288" r="12" fill="#C4B5FD" opacity=".5"/>
    <path d="M56 128c-10 30-4 62 12 84" stroke="#C4B5FD" stroke-width="3" stroke-dasharray="5 9" stroke-linecap="round" fill="none"/>
    <path d="M272 152c8 24 6 44-4 62" stroke="#DDD6FE" stroke-width="3" stroke-dasharray="5 9" stroke-linecap="round" fill="none"/>
    <path d="M146 236 134 300 126 344" stroke="url(#${id}b)" stroke-width="24" stroke-linecap="round" fill="none"/>
    <path d="M180 236 196 300 206 344" stroke="url(#${id}b)" stroke-width="24" stroke-linecap="round" fill="none"/>
    <path d="M108 346h34M196 346h34" stroke="#2B1F5C" stroke-width="14" stroke-linecap="round"/>
    <path d="M112 112C128 100 198 100 214 112L188 196C180 201 146 201 138 196Z" fill="url(#${id}a)"/>
    <path d="M146 128c10 6 22 6 32 0" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".35" fill="none"/>
    <path d="M138 194C152 201 174 201 188 194L194 240C178 247 148 247 132 240Z" fill="#3B2A7A"/>
    <path d="M158 198v40" stroke="#2B1F5C" stroke-width="3" opacity=".5"/>
    <rect x="152" y="86" width="20" height="20" rx="9" fill="#6D4AFF"/>
    <circle cx="162" cy="64" r="27" fill="url(#${id}a)"/>
    <path d="M136 58c3-17 49-19 52 0-10-7-42-9-52 0z" fill="#3B2A7A"/>
    <path d="M120 122 96 166 90 202" stroke="url(#${id}a)" stroke-width="18" stroke-linecap="round" fill="none"/>
    <path d="M206 122 234 154 232 122" stroke="url(#${id}a)" stroke-width="18" stroke-linecap="round" fill="none"/>
    <circle cx="90" cy="205" r="9" fill="#6D4AFF"/>
    <circle cx="232" cy="120" r="9" fill="#6D4AFF"/>
    <g transform="translate(90 218) rotate(6)">
      <rect x="-24" y="-3" width="48" height="6" rx="3" fill="#3B2A7A"/>
      <rect x="-33" y="-11" width="10" height="22" rx="4" fill="url(#${id}a)"/>
      <rect x="23" y="-11" width="10" height="22" rx="4" fill="url(#${id}a)"/>
    </g>
    <g transform="translate(234 111) rotate(-24)">
      <rect x="-24" y="-3" width="48" height="6" rx="3" fill="#3B2A7A"/>
      <rect x="-33" y="-11" width="10" height="22" rx="4" fill="url(#${id}a)"/>
      <rect x="23" y="-11" width="10" height="22" rx="4" fill="url(#${id}a)"/>
    </g>
  </svg>`;
}

function ringSvg(value, max, color, size, strokeWidth, color2){
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const gid = 'rg' + (++svgSeq);
  return `<svg class="ring-svg" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${color2 || color}"/>
    </linearGradient></defs>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#EEEAF9" stroke-width="${strokeWidth}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="url(#${gid})" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - pct)).toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
  </svg>`;
}

function ringCard(opts){
  const size = opts.size || 88;
  const stroke = opts.stroke || Math.max(7, Math.round(size / 10));
  const max = Number(opts.max) || 0;
  const value = Number(opts.value) || 0;
  const sub = opts.sub != null ? opts.sub : (max ? 'из ' + f0(max) : 'цель не задана');
  return `<div class="ring-card">
    <div class="ring-wrap" style="width:${size}px;height:${size}px">
      ${ringSvg(value, max, opts.color || '#7C5CFF', size, stroke, opts.color2)}
      <div class="ring-center"><strong>${escapeHtml(opts.display != null ? String(opts.display) : f0(value))}</strong>${opts.unit ? `<span>${escapeHtml(opts.unit)}</span>` : ''}</div>
    </div>
    <div class="ring-info">
      <div class="ring-title">${escapeHtml(opts.title || '')}</div>
      <div class="muted small">${escapeHtml(sub)}</div>
    </div>
  </div>`;
}

function sparklineSvg(points, color){
  if (!points || points.length < 2) return '';
  const w = 140, h = 44, p = 4;
  const vals = points.map(pt => pt.value);
  let min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
  if (max - min < 0.5){ max += 0.5; min -= 0.5; }
  const X = i => p + (i / (points.length - 1)) * (w - 2 * p);
  const Y = v => h - p - ((v - min) / (max - min)) * (h - 2 * p);
  const d = points.map((pt, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(pt.value).toFixed(1)).join(' ');
  const last = points.length - 1;
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    <path d="${d}" fill="none" stroke="${color || '#7C5CFF'}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${X(last).toFixed(1)}" cy="${Y(points[last].value).toFixed(1)}" r="3" fill="${color || '#7C5CFF'}"/>
  </svg>`;
}

function renderHero(stats, totals, targets){
  const active = state.data.activeWorkout;
  const kcalPill = targets.kcal
    ? f0(totals.kcal) + ' из ' + f0(targets.kcal) + ' ккал'
    : 'Калории: добавьте вес';
  return `<section class="hero">
    <div class="hero-copy">
      <div class="hero-eyebrow">${escapeHtml(fmtDateLong(new Date()))}</div>
      <h2>${greetingByHour()},<br><span class="grad-text">держим форму</span></h2>
      <p>${escapeHtml(state.data.program.subtitle || 'План, питание и прогресс — в одном лёгком дневнике.')}</p>
      <div class="hero-actions">
        <button class="btn btn-primary" data-action="quick-start">${active ? 'Продолжить тренировку' : 'Начать тренировку'}</button>
        <button class="btn btn-soft" data-action="open-quick">Добавить запись</button>
      </div>
      <div class="hero-pills">
        <span class="pill">${stats.weekDone} из ${stats.weekPlanned} ${pluralRu(stats.weekPlanned, 'тренировки', 'тренировок', 'тренировок')}</span>
        <span class="pill">${stats.percent}% плана за 4 недели</span>
        <span class="pill">${kcalPill}</span>
      </div>
    </div>
    <div class="hero-art">${maleAthleteSvg()}</div>
  </section>`;
}

function renderNextWorkoutCard(day, active){
  if (active){
    return `<article class="dash-card next-workout">
      <div class="card-top"><span class="eyebrow">Сейчас в работе</span><span class="status-badge status-in-progress">В процессе</span></div>
      <h3>${escapeHtml(active.dayName)}</h3>
      <p class="muted" style="margin:0 0 4px">Начата ${fmtDateTime(active.startedAt)}</p>
      <div class="chip-row">${active.exercises.slice(0, 3).map(e => `<span class="chip">${escapeHtml(e.name)}</span>`).join('')}</div>
      <div class="card-actions"><button class="btn btn-primary btn-block" data-action="resume-workout">Продолжить</button></div>
    </article>`;
  }
  if (!day) return '';
  const totalSets = day.exercises.reduce((sum, e) => sum + (Number(e.sets) || 0), 0);
  const doneThisWeek = state.data.program.days.filter(d => getDayStatus(d.id) === 'done').length;
  const allDone = doneThisWeek >= state.data.program.days.length;
  const chips = day.exercises.slice(0, 3).map(e => `<span class="chip">${escapeHtml(e.name)}</span>`).join('') +
    (day.exercises.length > 3 ? `<span class="chip chip-more">+${day.exercises.length - 3}</span>` : '');
  return `<article class="dash-card next-workout">
    <div class="card-top"><span class="eyebrow">${allDone ? 'Неделя закрыта' : 'Следующая тренировка'}</span><span class="badge badge-soft">${day.exercises.length} ${pluralRu(day.exercises.length, 'упражнение', 'упражнения', 'упражнений')}</span></div>
    <h3>${escapeHtml(day.name)}</h3>
    <p class="muted" style="margin:0 0 4px">${escapeHtml(day.focus || '')}${totalSets ? ' · ' + totalSets + ' ' + pluralRu(totalSets, 'подход', 'подхода', 'подходов') : ''}</p>
    <div class="chip-row">${chips}</div>
    <div class="card-actions"><button class="btn btn-primary btn-block" data-action="start-workout" data-day="${day.id}">${allDone ? 'Повторить тренировку' : 'Начать'}</button></div>
  </article>`;
}

function renderWeekActivityCard(){
  const today = new Date();
  const days = [];
  let totalSets = 0, totalWorkouts = 0;
  for (let i = 6; i >= 0; i--){
    const d = addDays(today, -i);
    const key = toDateKey(d);
    let sets = 0, workouts = 0;
    state.data.history.forEach(w => {
      if (toDateKey(new Date(w.date)) !== key) return;
      workouts += 1;
      (w.exercises || []).forEach(e => { sets += (e.sets || []).length; });
    });
    totalSets += sets; totalWorkouts += workouts;
    days.push({ label: WEEKDAYS_SHORT[d.getDay()], sets, workouts, isToday: i === 0 });
  }
  const maxSets = Math.max(1, ...days.map(d => d.sets));
  const bars = days.map(d => {
    const height = d.sets ? Math.max(10, Math.round(d.sets / maxSets * 96)) : 4;
    return `<div class="bar-col ${d.isToday ? 'is-today' : ''}">
      <span class="bar-value">${d.sets || ''}</span>
      <div class="bar-fill" style="height:${height}px"></div>
      <span class="bar-label">${d.label}</span>
    </div>`;
  }).join('');
  return `<article class="dash-card">
    <div class="card-top"><span class="eyebrow">Активность за неделю</span><span class="muted small">${totalSets} ${pluralRu(totalSets, 'подход', 'подхода', 'подходов')}</span></div>
    <h3>${totalWorkouts ? totalWorkouts + ' ' + pluralRu(totalWorkouts, 'тренировка', 'тренировки', 'тренировок') : 'Пока тихо'}</h3>
    <div class="activity-bars">${bars}</div>
    <div class="card-foot muted small">${totalSets ? 'Столбики — выполненные подходы по дням.' : 'Начните тренировку — активность появится здесь.'}</div>
  </article>`;
}

function renderHome(){
  const prog = state.data.program;
  const stats = computeStats();
  const active = state.data.activeWorkout;
  const targets = nutritionTargets();
  const totals = dayTotals(toDateKey(new Date()));
  const nextDay = active ? null : nextPlannedDay();

  let html = renderHero(stats, totals, targets);

  if (active){
    html += `<div class="banner banner-info">
      <div><strong>Незавершённая тренировка</strong><div class="muted small">${escapeHtml(active.dayName)} • начата ${fmtDateTime(active.startedAt)}</div></div>
      <div class="banner-actions">
        <button class="btn btn-primary btn-sm" data-action="resume-workout">Продолжить</button>
        <button class="btn btn-ghost btn-sm" data-action="discard-workout">Отменить</button>
      </div></div>`;
  }

  const lastBackup = new Date(state.data.meta.lastBackupAt || 0);
  const daysSinceBackup = Math.floor((new Date() - lastBackup) / (1000 * 60 * 60 * 24));
  if (daysSinceBackup > 14){
    html += `<div class="banner banner-warn">
      <div><strong>Давно не сохраняли данные</strong><div class="muted small">Прошло ${daysSinceBackup} дней. Браузер может очистить память.</div></div>
      <div class="banner-actions"><button class="btn btn-primary btn-sm" data-action="nav" data-view="backup">Сделать бэкап</button></div></div>`;
  }

  html += `<section class="section">
    <div class="section-head"><h2 class="section-title">Сегодня</h2><button class="link-btn" data-action="nav" data-view="nutrition">Дневник питания →</button></div>
    <div class="ring-row">
      ${ringCard({ value: totals.kcal, max: targets.kcal, color: '#7C5CFF', color2: '#EC4899', display: targets.kcal ? f0(totals.kcal) : '—', unit: 'ккал', title: 'Калории', sub: targets.kcal ? 'из ' + f0(targets.kcal) + ' ккал' : 'добавьте вес в профиль' })}
      ${ringCard({ value: totals.protein, max: targets.protein, color: '#0FA97A', color2: '#34D399', display: targets.protein ? f0(totals.protein) : '—', unit: 'г', title: 'Белки', sub: targets.protein ? 'из ' + f0(targets.protein) + ' г' : 'цель не задана' })}
      ${ringCard({ value: stats.weekDone, max: stats.weekPlanned, color: '#EC4899', color2: '#A855F7', display: String(stats.weekDone), unit: 'из ' + stats.weekPlanned, title: 'Тренировки', sub: 'на этой неделе' })}
    </div>
  </section>`;

  html += `<div class="dash-grid">
    ${renderNextWorkoutCard(nextDay, active)}
    ${renderBodyHomeCard()}
    ${renderWeekActivityCard()}
    ${renderTrainerHomeCard()}
  </div>`;

  html += `<section class="section">
    <div class="section-head"><h2 class="section-title">План тренировок</h2><button class="link-btn" data-action="nav" data-view="edit">Изменить программу</button></div>
    <div class="day-grid">${prog.days.map(renderDayCard).join('')}</div>
  </section>`;

  html += renderHeatmapCard();
  html += renderAboutProgram(prog);
  html += `<p class="storage-note">Данные хранятся в этом браузере. <button class="link-btn" data-action="nav" data-view="backup">Сделать резервную копию</button></p>`;
  return html;
}

function renderHeatmapCard(){
  if (!state.data.history.length) return '';
  return `<section class="section">
    <div class="section-head"><h2 class="section-title">Активность</h2><span class="muted small">календарь тренировок</span></div>
    ${renderHeatmap()}
  </section>`;
}

function renderAboutProgram(prog){
  const block = (title, items, cls) => (items && items.length)
    ? `<div class="about-block"><h4>${title}</h4><ul class="${cls}">${items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul></div>`
    : '';
  const extra = (prog.extra || []).length
    ? `<div class="about-block"><h4>Дополнительно</h4><div class="extra-grid">${prog.extra.map(it => `<div class="extra-card"><div class="extra-title">${escapeHtml(it.title)}</div><div class="extra-text">${escapeHtml(it.text)}</div></div>`).join('')}</div></div>`
    : '';
  const content = block('Правила', prog.rules, 'rules-list') + block('Цель этапа', prog.goals, 'goals-list') + block('Заметки', prog.notes, 'notes-list') + extra;
  if (!content) return '';
  return `<details class="about-card">
    <summary>О программе: правила, цели и заметки</summary>
    <div class="about-grid">${content}</div>
  </details>`;
}

function moreMenuHtml(){
  return `<h3>Ещё</h3>
    <p>Дополнительные разделы дневника.</p>
    <div class="more-grid">
      <button class="more-link" data-action="nav" data-view="edit"><span class="more-dot"></span><span><strong>Программа</strong><em>Дни, упражнения и инвентарь</em></span></button>
      <button class="more-link" data-action="nav" data-view="upload"><span class="more-dot"></span><span><strong>Загрузка</strong><em>Новая программа по фото</em></span></button>
      <button class="more-link" data-action="nav" data-view="backup"><span class="more-dot"></span><span><strong>Резервная копия</strong><em>Экспорт, импорт и сброс</em></span></button>
    </div>
    <div class="modal-actions"><button class="btn btn-ghost" data-modal="cancel">Закрыть</button></div>`;
}

function quickActionsHtml(){
  const active = state.data.activeWorkout;
  return `<h3>Быстрое действие</h3>
    <p>Что запишем?</p>
    <div class="quick-grid">
      <button class="quick-action" data-action="open-body"><span class="quick-dot"></span><strong>Вес и талия</strong><em>Измерение тела</em></button>
      <button class="quick-action" data-action="nav" data-view="nutrition"><span class="quick-dot"></span><strong>Еда</strong><em>Дневник калорий</em></button>
      <button class="quick-action" data-action="open-photos"><span class="quick-dot"></span><strong>Фото</strong><em>Прогресс тела</em></button>
      <button class="quick-action" data-action="quick-start"><span class="quick-dot"></span><strong>${active ? 'Продолжить' : 'Тренировка'}</strong><em>${active ? 'Вернуться к занятию' : 'Начать следующую'}</em></button>
    </div>
    <div class="modal-actions"><button class="btn btn-ghost" data-modal="cancel">Закрыть</button></div>`;
}

function renderDayCard(day){
  const status = getDayStatus(day.id);
  const active = state.data.activeWorkout;
  const isActive = active && active.dayId === day.id;
  const lastWorkout = status === 'done' ? getLastWorkoutForDay(day.id) : null;
  const totalSets = day.exercises.reduce((sum, e) => sum + (Number(e.sets) || 0), 0);

  let exHtml = '';
  day.exercises.forEach(ex => {
    exHtml += `<li class="ex-item">
      <div class="ex-name">${escapeHtml(ex.name)}</div>
      <div class="ex-meta">
        <span class="badge">${ex.sets} × ${escapeHtml(ex.reps)}${ex.unit === 'sec' ? ' сек' : ''}</span>
        ${ex.startWeight ? `<span>Старт: ${escapeHtml(ex.startWeight)}${ex.unit === 'kg' ? ' кг' : ''}</span>` : ''}
        <button class="ex-link" data-action="open-exercise-history" data-name="${escapeHtml(ex.name)}">Прогресс</button>
      </div>
      ${ex.note ? `<div class="ex-note">${escapeHtml(ex.note)}</div>` : ''}
    </li>`;
  });

  let statusHtml = '';
  if (status === 'in-progress') statusHtml = '<span class="status-badge status-in-progress">В процессе</span>';
  else if (status === 'done') statusHtml = '<span class="status-badge status-done">Выполнена</span>';
  else statusHtml = '<span class="status-badge status-not-started">Не начата</span>';

  let actionsHtml;
  if (isActive){ actionsHtml = `<button class="btn btn-primary btn-block" data-action="resume-workout">Продолжить тренировку</button>`; }
  else if (active){ actionsHtml = `<button class="btn btn-ghost btn-block" disabled>Есть незавершённая тренировка</button>`; }
  else if (lastWorkout){ actionsHtml = `<button class="btn btn-ghost" data-action="open-workout" data-id="${lastWorkout.id}">Результат</button><button class="btn btn-primary" data-action="start-workout" data-day="${day.id}">Ещё раз</button>`; }
  else { actionsHtml = `<button class="btn btn-primary btn-block" data-action="start-workout" data-day="${day.id}">Начать тренировку</button>`; }

  return `<article class="day-card day-card-${day.color || 'blue'}">
    <div class="day-card-header">
      <div class="day-card-heading"><div class="day-card-title">${escapeHtml(day.name)}</div><div class="day-card-focus">${escapeHtml(day.focus || '')}</div></div>
      ${statusHtml}
    </div>
    <div class="day-meta">${day.exercises.length} ${pluralRu(day.exercises.length, 'упражнение', 'упражнения', 'упражнений')} · ${totalSets} ${pluralRu(totalSets, 'подход', 'подхода', 'подходов')}</div>
    <details class="day-details">
      <summary>Упражнения</summary>
      <ul class="ex-list">${exHtml}</ul>
    </details>
    <div class="day-card-actions">${actionsHtml}</div>
  </article>`;
}

function computeStats(){
  const history = state.data.history;
  const planned = state.data.program.days.length || 3;
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = addDays(weekStart, 7);
  const weekDone = history.filter(w => { const d = new Date(w.date); return d >= weekStart && d < weekEnd; }).length;
  const fourWeeksAgo = addDays(weekStart, -21);
  const recent = history.filter(w => { const d = new Date(w.date); return d >= fourWeeksAgo && d < weekEnd; });
  const percent = Math.min(100, Math.round((recent.length / (planned * 4)) * 100)) || 0;
  const last = history.length ? history.map(w => w.date).sort().slice(-1)[0] : null;
  return { weekDone, weekPlanned: planned, percent, lastDate: last, totalDone: history.length };
}

/* ==================== ТРЕНИРОВКА ==================== */
function renderWorkout(){
  const w = state.data.activeWorkout;
  if (!w) return emptyState('Нет активной тренировки', 'Вернитесь на главный экран и начните тренировку.', 'home');
  let html = `<section class="section">
    <div class="workout-header">
      <div><h2 class="section-title">${escapeHtml(w.dayName)} — ${escapeHtml(w.focus || '')}</h2><div class="muted small">Начата: ${fmtDateTime(w.startedAt)}</div></div>
      <div class="workout-header-actions">
        <button class="btn btn-ghost" data-action="cancel-workout">Отменить тренировку</button>
        <button class="btn btn-primary" data-action="finish-workout">Завершить тренировку</button>
      </div>
    </div>
    <div class="exercise-list">`;
  w.exercises.forEach((ex, i) => { html += renderWorkoutExercise(ex, i); });
  html += `</div></section>`;
  return html;
}

function renderWorkoutExercise(ex, idx){
  const unitLabel = ex.unit === 'sec' ? 'сек' : 'повт.';
  const isKg = ex.unit === 'kg';
  const showSingleWeight = isKg && !ex.noWeight && !ex.perSetWeight;

  const pr = getHistoricalMaxWeight(ex.name);
  let prHtml = '';
  let currentWeight = parseFloat(ex.weight);
  if (!isNaN(currentWeight) && currentWeight > pr && pr > 0) {
      prHtml = `<span class="pr-badge">🏆 Рекорд: ${currentWeight} кг</span>`;
  }

  let setsHtml = '';
  ex.sets.forEach((s, i) => {
    let weightInput = '';
    if (isKg && !ex.noWeight && ex.perSetWeight){
      weightInput = `<label class="set-input-group"><input type="number" min="0" step="0.5" class="input input-sm" data-field="weight" data-ex="${idx}" data-set="${i}" value="${escapeHtml(s.weight || '')}" inputmode="decimal" placeholder="—"><span class="unit">кг</span></label>`;
    }
    setsHtml += `<div class="set-row">
      <div class="set-label">Подход ${i + 1}</div>
      <div class="set-inputs">
        ${weightInput}
        <label class="set-input-group"><input type="number" min="0" step="1" class="input input-sm" data-field="reps" data-ex="${idx}" data-set="${i}" value="${escapeHtml(s.reps || '')}" inputmode="numeric" placeholder="—"><span class="unit">${unitLabel}</span></label>
      </div>
    </div>`;
  });

  return `<div class="exercise-card">
    <div class="exercise-header">
      <div class="exercise-title-wrap">
        <div class="exercise-name">${escapeHtml(ex.name)} ${prHtml}</div>
        <div class="exercise-plan">План: ${ex.plannedSets} × ${escapeHtml(ex.plannedReps)}${ex.unit === 'sec' ? ' сек' : ''}</div>
        ${ex.note ? `<div class="exercise-note">${escapeHtml(ex.note)}</div>` : ''}
      </div>
      <div style="text-align:right">
        <button class="btn btn-timer btn-sm" id="timer-btn-${idx}" data-action="toggle-timer" data-ex="${idx}">⏱ Отдых ${activeTimer.totalTime}с</button>
        <div class="muted small" id="timer-disp-${idx}" style="margin-top:4px; font-weight:600"></div>
      </div>
    </div>
    ${isKg ? `<div class="exercise-controls">
      <label class="check"><input type="checkbox" data-action="toggle-no-weight" data-ex="${idx}" ${ex.noWeight ? 'checked' : ''}> Без веса</label>
      <label class="check"><input type="checkbox" data-action="toggle-per-set-weight" data-ex="${idx}" ${ex.perSetWeight ? 'checked' : ''} ${ex.noWeight ? 'disabled' : ''}> Разные веса по подходам</label>
    </div>` : ''}
    ${showSingleWeight ? `<div class="exercise-weight">
      <span class="weight-label">Рабочий вес:</span>
      <label class="weight-input-wrap">
        <input type="number" min="0" step="0.5" class="input" data-field="weight" data-ex="${idx}" value="${escapeHtml(ex.weight || '')}" inputmode="decimal" placeholder="—" style="max-width:110px">
        <span class="unit">кг</span>
      </label>
    </div>` : ''}
    <div class="sets">${setsHtml}</div>
    <div class="exercise-comment">
      <label class="field-inline"><span class="weight-label">Комментарий:</span>
        <input type="text" class="input" data-field="comment" data-ex="${idx}" value="${escapeHtml(ex.comment || '')}" placeholder="необязательно"></label>
    </div>
  </div>`;
}

/* ==================== ИСТОРИЯ ==================== */
function renderHistory(){
  const history = [...state.data.history].sort((a, b) => new Date(b.date) - new Date(a.date));
  const f = state.params.historyFilter || { q:'', from:'', to:'' };
  let filtered = history;
  if (f.q){ const q = f.q.toLowerCase(); filtered = filtered.filter(w => w.exercises.some(ex => ex.name.toLowerCase().includes(q))); }
  if (f.from) filtered = filtered.filter(w => toDateKey(new Date(w.date)) >= f.from);
  if (f.to) filtered = filtered.filter(w => toDateKey(new Date(w.date)) <= f.to);

  let listHtml;
  if (!filtered.length){
    listHtml = `<div class="empty-state">
      <div class="empty-title">${history.length ? 'Ничего не найдено' : 'Пока нет завершённых тренировок'}</div>
      <div class="empty-text">${history.length ? 'Измените параметры поиска.' : 'Начните первую тренировку на главном экране — после завершения она появится здесь.'}</div>
      ${!history.length ? '<button class="btn btn-primary" data-action="nav" data-view="home">На главный экран</button>' : ''}
    </div>`;
  } else {
    listHtml = filtered.map(w => {
      const totalSets = w.exercises.reduce((s, ex) => s + ex.sets.length, 0);
      return `<div class="history-item">
        <div class="history-item-main" data-action="open-workout" data-id="${w.id}">
          <div class="history-date">${fmtDate(w.date)} <span class="muted small">${pad2(new Date(w.date).getHours())}:${pad2(new Date(w.date).getMinutes())}</span></div>
          <div class="history-day">${escapeHtml(w.dayName)} — ${escapeHtml(w.focus || '')}</div>
          <div class="muted small">${w.exercises.length} ${pluralRu(w.exercises.length, 'упражнение', 'упражнения', 'упражнений')} • ${totalSets} ${pluralRu(totalSets, 'подход', 'подхода', 'подходов')}</div>
        </div>
        <div class="history-item-actions">
          <button class="btn btn-ghost btn-sm" data-action="open-workout" data-id="${w.id}">Открыть</button>
          <button class="btn btn-danger btn-sm" data-action="delete-workout" data-id="${w.id}">Удалить</button>
        </div></div>`;
    }).join('');
  }

  return `<section class="section">
    <div class="section-header-row"><h2 class="section-title">История тренировок</h2><button class="btn btn-ghost" data-action="nav" data-view="home">На главный экран</button></div>
    <div class="filters">
      <input type="search" class="input" placeholder="Поиск по упражнению" data-field="history-q" value="${escapeHtml(f.q)}">
      <label class="field-inline"><span class="muted small">С</span><input type="date" class="input" data-field="history-from" value="${f.from}"></label>
      <label class="field-inline"><span class="muted small">По</span><input type="date" class="input" data-field="history-to" value="${f.to}"></label>
      <button class="btn btn-ghost" data-action="clear-history-filter">Сбросить</button>
    </div>
    <div class="history-list">${listHtml}</div>
  </section>`;
}

function renderHistoryDetail(id){
  const w = state.data.history.find(x => x.id === id);
  if (!w) return emptyState('Тренировка не найдена', '', 'history');
  let exHtml = '';
  w.exercises.forEach(ex => {
    exHtml += `<div class="history-ex">
      <div class="history-ex-name">${escapeHtml(ex.name)}<button class="ex-link" data-action="open-exercise-history" data-name="${escapeHtml(ex.name)}">Прогресс</button></div>
      <div class="sets-table">
        ${ex.sets.map((s, i) => `<div class="set-line">
          <span class="muted small">Подход ${i + 1}</span>
          <span>${ex.unit === 'kg' && !ex.noWeight ? (s.weight ? escapeHtml(s.weight) + ' кг' : '—') : (ex.noWeight || ex.unit !== 'kg' ? 'Без веса' : '—')} × ${escapeHtml(s.reps || '—')}${ex.unit === 'sec' ? ' сек' : ' повт.'}</span>
        </div>`).join('')}
      </div>
      ${ex.comment ? `<div class="muted small">Комментарий: ${escapeHtml(ex.comment)}</div>` : ''}
    </div>`;
  });
  return `<section class="section">
    <div class="section-header-row">
      <h2 class="section-title">${fmtDate(w.date)} — ${escapeHtml(w.dayName)}</h2>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap">
        <button class="btn btn-ghost" data-action="nav" data-view="history">К истории</button>
        <button class="btn btn-primary" data-action="edit-history" data-id="${w.id}">Редактировать</button>
      </div>
    </div>
    <div class="muted small">${escapeHtml(w.focus || '')} • завершена ${fmtDateTime(w.date)}</div>
    <div class="history-detail">${exHtml}</div>
    <div class="section-actions"><button class="btn btn-danger" data-action="delete-workout" data-id="${w.id}">Удалить тренировку</button></div>
  </section>`;
}

function renderHistoryEdit(id){
  const d = state.historyDraft;
  if (!d) return emptyState('Нет данных для редактирования', '', 'history');
  let exHtml = '';
  d.exercises.forEach((ex, i) => {
    const unitLabel = ex.unit === 'sec' ? 'сек' : 'повт.';
    exHtml += `<div class="exercise-card">
      <div class="exercise-name">${escapeHtml(ex.name)}</div>
      <div class="sets">
        ${ex.sets.map((s, si) => `<div class="set-row">
          <div class="set-label">Подход ${si + 1}</div>
          <div class="set-inputs">
            ${ex.unit === 'kg' && !ex.noWeight ? `<label class="set-input-group"><input type="number" class="input input-sm" data-field="he-weight" data-ex="${i}" data-set="${si}" value="${escapeHtml(s.weight || '')}"><span class="unit">кг</span></label>` : ''}
            <label class="set-input-group"><input type="number" class="input input-sm" data-field="he-reps" data-ex="${i}" data-set="${si}" value="${escapeHtml(s.reps || '')}"><span class="unit">${unitLabel}</span></label>
          </div></div>`).join('')}
      </div>
      <div class="exercise-comment">
        <label class="field-inline"><span class="weight-label">Комментарий:</span><input type="text" class="input" data-field="he-comment" data-ex="${i}" value="${escapeHtml(ex.comment || '')}"></label>
      </div></div>`;
  });
  return `<section class="section">
    <div class="section-header-row">
      <h2 class="section-title">Редактирование записи от ${fmtDate(d.date)}</h2>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap">
        <button class="btn btn-ghost" data-action="cancel-edit-history">Отмена</button>
        <button class="btn btn-primary" data-action="save-edit-history">Сохранить</button>
      </div>
    </div>
    <div class="exercise-list">${exHtml}</div>
  </section>`;
}

/* ==================== ИСТОРИЯ УПРАЖНЕНИЯ ==================== */
function renderExerciseHistory(name){
  const records = [];
  [...state.data.history].sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(w => {
    w.exercises.forEach(ex => {
      if (ex.name !== name) return;
      const weights = ex.sets.map(s => parseFloat(s.weight)).filter(n => !isNaN(n));
      const reps = ex.sets.map(s => parseInt(s.reps)).filter(n => !isNaN(n));
      records.push({
        date: w.date, workoutId: w.id,
        maxWeight: weights.length ? Math.max(...weights) : null,
        totalReps: reps.reduce((a, b) => a + b, 0),
        sets: ex.sets.length, unit: ex.unit, noWeight: ex.noWeight,
        volume: weights.length ? ex.sets.reduce((acc, s) => acc + ((parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0)), 0) : null
      });
    });
  });

  const weightPoints = records.filter(r => r.maxWeight != null).map(r => ({ date: r.date, value: r.maxWeight }));
  const repsPoints = records.filter(r => r.totalReps != null).map(r => ({ date: r.date, value: r.totalReps }));

  let chart = '';
  if (weightPoints.length >= 2) chart += `<div class="chart-wrap">${renderChart(weightPoints, 'Максимальный вес, кг')}</div>`;
  else if (repsPoints.length >= 2) chart += `<div class="chart-wrap">${renderChart(repsPoints, 'Сумма повторений за тренировку')}</div>`;
  else chart = `<p class="muted">Недостаточно данных для графика — нужно минимум 2 записи.</p>`;

  const list = records.length
    ? records.map(r => `<div class="history-ex">
        <div class="history-ex-name">${fmtDate(r.date)}</div>
        <div class="set-line"><span>Подходов: ${r.sets}</span>
        <span>${r.maxWeight != null ? 'Макс. вес: ' + r.maxWeight + ' кг' : 'Без веса'} • Повторений: ${r.totalReps}${r.volume ? ' • Тоннаж: ' + Math.round(r.volume) + ' кг' : ''}</span></div>
        <button class="ex-link" data-action="open-workout" data-id="${r.workoutId}">открыть тренировку</button>
      </div>`).join('')
    : `<div class="empty-state"><div class="empty-title">Пока нет данных</div><div class="empty-text">Выполните это упражнение хотя бы один раз.</div></div>`;

  return `<section class="section">
    <div class="section-header-row"><h2 class="section-title">Прогресс: ${escapeHtml(name)}</h2><button class="btn btn-ghost" data-action="nav" data-view="history">К истории</button></div>
    ${chart}
    <div class="history-list" style="margin-top:1rem">${list}</div>
  </section>`;
}

function renderChart(points, title){
  const W = 600, H = 220, P = 34;
  const ys = points.map(p => p.value);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const yRange = (maxY - minY) || 1;
  const xScale = i => P + (i / (points.length - 1)) * (W - 2 * P);
  const yScale = v => H - P - ((v - minY) / yRange) * (H - 2 * P);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(p.value).toFixed(1)}`).join(' ');
  const dots = points.map((p, i) => `<circle cx="${xScale(i).toFixed(1)}" cy="${yScale(p.value).toFixed(1)}" r="3.5" fill="#7C5CFF"/>`).join('');
  const xLabels = points.map((p, i) => {
    const step = Math.ceil(points.length / 6);
    if (i % step !== 0 && i !== points.length - 1) return '';
    return `<text x="${xScale(i).toFixed(1)}" y="${H - 8}" font-size="10" text-anchor="middle" fill="#7A7492">${fmtDate(p.date).slice(0, 5)}</text>`;
  }).join('');
  return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(title)}">
    <line x1="${P}" y1="${H - P}" x2="${W - P}" y2="${H - P}" stroke="#EAE6F5"/>
    <line x1="${P}" y1="${P}" x2="${P}" y2="${H - P}" stroke="#EAE6F5"/>
    <path d="${path}" fill="none" stroke="#7C5CFF" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}${xLabels}<text x="${P}" y="16" font-size="12" fill="#7A7492">${escapeHtml(title)}</text>
  </svg>`;
}

/* ==================== ТЕЛО, ВЕС И ИМТ ==================== */
const BODY_PROFILE_DEFAULTS = { height: '', gender: '', age: '', activity: 'medium', targetWeight: '', waistTarget: '' };
const BODY_RANGES = { weight: [25, 350], waist: [35, 220], hips: [40, 220], height: [100, 250], age: [10, 100], bodyFat: [2, 70], muscle: [5, 70], water: [20, 75], visceral: [1, 30] };
const PROFILE_FIELD_MAP = {
  'profile-height': 'height', 'profile-age': 'age', 'profile-target': 'targetWeight',
  'profile-waist-target': 'waistTarget', 'profile-gender': 'gender', 'profile-activity': 'activity'
};
const MEASURE_FIELD_MAP = {
  'm-date': 'date', 'm-weight': 'weight', 'm-waist': 'waist', 'm-hips': 'hips', 'm-note': 'note',
  'm-fat': 'bodyFat', 'm-muscle': 'muscle', 'm-water': 'water', 'm-visceral': 'visceral'
};
const BMI_CATEGORIES = [
  { max: 16, key: 'severe-under', label: 'Выраженный дефицит массы', color: '#E11D48' },
  { max: 18.5, key: 'under', label: 'Недостаточная масса', color: '#C2740A' },
  { max: 25, key: 'normal', label: 'Норма', color: '#0FA97A' },
  { max: 30, key: 'over', label: 'Избыточная масса', color: '#C2740A' },
  { max: 35, key: 'ob1', label: 'Ожирение I степени', color: '#E11D48' },
  { max: 40, key: 'ob2', label: 'Ожирение II степени', color: '#BE123C' },
  { max: Infinity, key: 'ob3', label: 'Ожирение III степени', color: '#9F1239' }
];

function numOrEmpty(v){
  const n = parseFloat(String(v == null ? '' : v).replace(',', '.'));
  return isFinite(n) ? n : '';
}
function f1(n){ return (Math.round(n * 10) / 10).toFixed(1).replace('.', ','); }
function f2(n){ return (Math.round(n * 100) / 100).toFixed(2).replace('.', ','); }
function f0(n){ return String(Math.round(n)); }
function pluralRu(n, one, few, many){
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}
function fmtSigned(v, digits){
  if (v == null || !isFinite(v)) return '';
  const d = Math.pow(10, digits);
  const abs = (Math.round(Math.abs(v) * d) / d).toFixed(digits).replace('.', ',');
  return (v > 0 ? '+' : (v < 0 ? '−' : '')) + abs;
}
function niceStep(raw){
  if (!isFinite(raw) || raw <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  let m;
  if (n <= 1) m = 1;
  else if (n <= 2) m = 2;
  else if (n <= 2.5) m = 2.5;
  else if (n <= 5) m = 5;
  else m = 10;
  return m * pow;
}

function normalizeBody(raw){
  const b = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
  b.profile = Object.assign({}, BODY_PROFILE_DEFAULTS, (b.profile && typeof b.profile === 'object') ? b.profile : {});
  const list = Array.isArray(b.entries) ? b.entries : [];
  b.entries = list.filter(e => e && (e.date || e.createdAt)).map(e => ({
    id: e.id || uid(),
    date: e.date || e.createdAt,
    createdAt: e.createdAt || e.date,
    weight: numOrEmpty(e.weight),
    waist: numOrEmpty(e.waist),
    hips: numOrEmpty(e.hips),
    bodyFat: numOrEmpty(e.bodyFat),
    muscle: numOrEmpty(e.muscle),
    water: numOrEmpty(e.water),
    visceral: numOrEmpty(e.visceral),
    note: typeof e.note === 'string' ? e.note : ''
  }));
  return b;
}
function ensureBody(){
  if (!state.data.body) state.data.body = normalizeBody(null);
  return state.data.body;
}
function getBodyEntries(){
  const entries = (state.data.body && state.data.body.entries) || [];
  return [...entries].sort((a, b) => {
    const d = new Date(a.date) - new Date(b.date);
    if (d !== 0) return d;
    return new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date);
  });
}
function findLastNumeric(entries, key){
  for (let i = entries.length - 1; i >= 0; i--){
    const v = entries[i][key];
    if (v !== '' && v != null && isFinite(v)) return { value: +v, index: i, entry: entries[i] };
  }
  return null;
}
function findPrevNumeric(entries, key, beforeIdx){
  for (let i = beforeIdx - 1; i >= 0; i--){
    const v = entries[i][key];
    if (v !== '' && v != null && isFinite(v)) return { value: +v, index: i, entry: entries[i] };
  }
  return null;
}
function calcBMI(weightKg, heightCm){
  const w = parseFloat(weightKg), h = parseFloat(heightCm);
  if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return null;
  const m = h / 100;
  return w / (m * m);
}
function bmiCategory(bmi){
  if (bmi == null || !isFinite(bmi)) return null;
  return BMI_CATEGORIES.find(c => bmi < c.max) || BMI_CATEGORIES[BMI_CATEGORIES.length - 1];
}
function healthyWeightRange(heightCm){
  const h = parseFloat(heightCm);
  if (!isFinite(h) || h <= 0) return null;
  const m = h / 100;
  return { min: Math.round(18.5 * m * m * 10) / 10, max: Math.round(24.9 * m * m * 10) / 10 };
}
function waistRisk(waist, gender){
  if (waist == null || !isFinite(waist)) return '';
  if (gender === 'female'){
    if (waist >= 88) return 'Талия ≥ 88 см у женщин — высокий риск для сердца и обмена веществ. Это повод обсудить план снижения веса с врачом.';
    if (waist >= 80) return 'Талия ≥ 80 см у женщин — повышенный риск. Ориентир — вернуться ниже 80 см.';
  } else if (gender === 'male'){
    if (waist >= 102) return 'Талия ≥ 102 см у мужчин — высокий риск для сердца и обмена веществ. Это повод обсудить план с врачом.';
    if (waist >= 94) return 'Талия ≥ 94 см у мужчин — повышенный риск. Ориентир — ниже 94 см.';
  }
  return '';
}

function getBodySummary(){
  const body = ensureBody();
  const entries = getBodyEntries();
  const height = numOrEmpty(body.profile.height);
  const lastWeight = findLastNumeric(entries, 'weight');
  const lastWaist = findLastNumeric(entries, 'waist');
  const lastHips = findLastNumeric(entries, 'hips');
  const prevWeight = lastWeight ? findPrevNumeric(entries, 'weight', lastWeight.index) : null;
  const prevWaist = lastWaist ? findPrevNumeric(entries, 'waist', lastWaist.index) : null;
  const bmi = (lastWeight && height) ? calcBMI(lastWeight.value, height) : null;
  return {
    height, entries, lastWeight, lastWaist, lastHips, prevWeight, prevWaist,
    bmi, category: bmiCategory(bmi),
    weightDelta: (lastWeight && prevWeight) ? lastWeight.value - prevWeight.value : null,
    waistDelta: (lastWaist && prevWaist) ? lastWaist.value - prevWaist.value : null,
    whtr: (lastWaist && height) ? lastWaist.value / height : null,
    whr: (lastWaist && lastHips && lastHips.value) ? lastWaist.value / lastHips.value : null,
    healthy: healthyWeightRange(height)
  };
}

function bmiScaleHtml(bmi){
  const ranges = [
    { from: 15, to: 18.5, color: '#FCD34D' },
    { from: 18.5, to: 25, color: '#34D399' },
    { from: 25, to: 30, color: '#FBBF24' },
    { from: 30, to: 35, color: '#FB7185' },
    { from: 35, to: 40, color: '#E11D48' }
  ];
  const min = 15, max = 40;
  const pos = v => ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * 100;
  let bar = '';
  ranges.forEach(r => { bar += `<span style="width:${(pos(r.to) - pos(r.from)).toFixed(2)}%;background:${r.color}"></span>`; });
  let marker = '';
  if (bmi != null && isFinite(bmi)) marker = `<div class="bmi-marker" style="left:${pos(bmi).toFixed(2)}%"></div>`;
  return `<div class="bmi-scale"><div class="bmi-bar">${bar}</div>${marker}</div>
    <div class="bmi-axis">
      <span style="left:0%">15</span><span style="left:14%">18,5</span><span style="left:40%">25</span>
      <span style="left:60%">30</span><span style="left:80%">35</span><span style="left:100%">40</span>
    </div>`;
}

function renderBodyChart(cfg){
  const W = 640, H = 240, PL = 48, PR = 18, PT = 24, PB = 36;
  const series = (cfg.series || [])
    .map(s => ({ label: s.label || '', color: s.color || '#7C5CFF', points: (s.points || []).filter(p => p && p.date && isFinite(p.value)) }))
    .filter(s => s.points.length);
  const all = series.reduce((acc, s) => acc.concat(s.points), []);
  if (!all.length) return '';

  const values = all.map(p => p.value);
  let minV = Math.min(...values), maxV = Math.max(...values);
  if (cfg.band){ minV = Math.min(minV, cfg.band[0]); maxV = Math.max(maxV, cfg.band[1]); }
  (cfg.hlines || []).forEach(l => { if (isFinite(l.value)) { minV = Math.min(minV, l.value); maxV = Math.max(maxV, l.value); } });
  if (maxV - minV < 0.01){ maxV += 1; minV -= 1; }
  const padV = (maxV - minV) * 0.12;
  minV -= padV; maxV += padV;
  const step = niceStep((maxV - minV) / 4);
  minV = Math.floor(minV / step) * step;
  maxV = Math.ceil(maxV / step) * step;
  const axisDecimals = step < 1 ? 1 : 0;
  const steps = Math.max(2, Math.round((maxV - minV) / step));

  const times = all.map(p => new Date(p.date).getTime());
  let t0 = Math.min(...times), t1 = Math.max(...times);
  if (t0 === t1){ t0 -= 86400000; t1 += 86400000; }
  const X = t => PL + ((t - t0) / (t1 - t0)) * (W - PL - PR);
  const Y = v => H - PB - ((v - minV) / (maxV - minV)) * (H - PT - PB);
  const axis = v => (axisDecimals ? f1(v) : String(Math.round(v)));

  let bandSvg = '';
  if (cfg.band){
    const yTop = Y(cfg.band[1]), yBot = Y(cfg.band[0]);
    bandSvg = `<rect x="${PL}" y="${yTop.toFixed(1)}" width="${(W - PL - PR).toFixed(1)}" height="${Math.max(0, yBot - yTop).toFixed(1)}" fill="#E9F8F2"/>` +
      `<text x="${W - PR - 6}" y="${(yTop + 12).toFixed(1)}" font-size="10" text-anchor="end" fill="#0FA97A">норма ${f1(cfg.band[0])}–${f1(cfg.band[1])}</text>`;
  }

  let grid = '';
  for (let i = 0; i <= steps; i++){
    const v = minV + step * i;
    const y = Y(v);
    grid += `<line x1="${PL}" y1="${y.toFixed(1)}" x2="${W - PR}" y2="${y.toFixed(1)}" stroke="#EAE6F5" stroke-dasharray="3 3"/>`;
    grid += `<text x="${PL - 8}" y="${(y + 4).toFixed(1)}" font-size="10" text-anchor="end" fill="#7A7492">${axis(v)}</text>`;
  }

  let linesSvg = '';
  (cfg.hlines || []).forEach(l => {
    if (!isFinite(l.value)) return;
    const y = Y(l.value).toFixed(1);
    linesSvg += `<line x1="${PL}" y1="${y}" x2="${W - PR}" y2="${y}" stroke="${l.color || '#C2740A'}" stroke-width="1.5" stroke-dasharray="5 4"/>`;
    linesSvg += `<text x="${W - PR - 4}" y="${(Y(l.value) - 5).toFixed(1)}" font-size="10" text-anchor="end" fill="${l.color || '#C2740A'}">${escapeHtml(l.label || '')}</text>`;
  });

  let pathsSvg = '';
  series.forEach(s => {
    const pts = s.points.map(p => ({ x: X(new Date(p.date).getTime()), y: Y(p.value), p }));
    if (pts.length > 1){
      pathsSvg += `<path d="${pts.map((q, i) => (i === 0 ? 'M' : 'L') + q.x.toFixed(1) + ',' + q.y.toFixed(1)).join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    }
    pts.forEach(q => {
      pathsSvg += `<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="3.5" fill="${s.color}"><title>${escapeHtml(fmtDate(q.p.date) + ' — ' + f1(q.p.value))}</title></circle>`;
    });
  });

  const uniqDays = Array.from(new Set(times.map(t => new Date(t).toDateString()))).sort((a, b) => new Date(a) - new Date(b));
  const picks = uniqDays.length <= 3 ? uniqDays : [uniqDays[0], uniqDays[Math.floor(uniqDays.length / 2)], uniqDays[uniqDays.length - 1]];
  let xLabels = '';
  picks.forEach((day, i) => {
    const t = new Date(day).getTime();
    const anchor = i === 0 ? 'start' : (i === picks.length - 1 ? 'end' : 'middle');
    xLabels += `<text x="${X(t).toFixed(1)}" y="${H - 12}" font-size="10" text-anchor="${anchor}" fill="#7A7492">${escapeHtml(fmtDate(new Date(t)).slice(0, 5))}</text>`;
  });

  let legend = '';
  series.forEach(s => { legend += `<span><i style="background:${s.color}"></i>${escapeHtml(s.label)}</span>`; });
  (cfg.hlines || []).forEach(l => {
    if (isFinite(l.value)) legend += `<span><i class="dash" style="border-top-color:${l.color || '#C2740A'}"></i>${escapeHtml(l.label || '')}</span>`;
  });
  if (cfg.band) legend += '<span><i style="background:#E9F8F2;border:1px solid #B7E6D5"></i>норма ИМТ</span>';

  return `<div class="chart-wrap">
    <svg class="chart-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(cfg.title || 'График')}">
      <text x="${PL}" y="15" font-size="12" fill="#7A7492">${escapeHtml(cfg.title || '')}</text>
      ${bandSvg}${grid}${linesSvg}${pathsSvg}${xLabels}
    </svg>
    ${legend ? `<div class="chart-legend">${legend}</div>` : ''}
  </div>`;
}

function deltaBadge(delta, unit){
  if (delta == null || !isFinite(delta) || Math.abs(delta) < 0.05) return '';
  const cls = delta < 0 ? 'delta-down' : 'delta-up';
  const arrow = delta < 0 ? '▼' : '▲';
  return `<span class="delta ${cls}">${arrow} ${fmtSigned(delta, 1).replace('+', '').replace('-', '').replace('−', '')} ${unit}</span>`;
}

function buildBodyAdvice(){
  const s = getBodySummary();
  const p = ensureBody().profile;
  const groups = [];
  const height = s.height;
  const bmi = s.bmi;
  const cat = s.category;
  const healthy = s.healthy;
  const lastW = s.lastWeight ? s.lastWeight.value : null;
  const lastWaist = s.lastWaist ? s.lastWaist.value : null;

  if (!height){
    groups.push({ title: 'С чего начать', items: [
      'Укажите <strong>рост</strong> в карточке профиля — без него ИМТ не рассчитать.',
      'Записывайте вес утром, натощак, после туалета, в одной и той же одежде.',
      'Обхват талии меряйте на уровне пупка, на обычном выдохе, не втягивая живот.',
      'Достаточно 1–2 измерений в неделю: важна динамика, а не точность до грамма.'
    ]});
    return groups;
  }

  if (bmi == null){
    groups.push({ title: 'С чего начать', items: [
      'Добавьте первое измерение веса — и здесь появятся персональные рекомендации по ИМТ.',
      `Рост уже указан: ${f0(height)} см. Норма веса для этого роста — <strong>${f1(healthy.min)}–${f1(healthy.max)} кг</strong>.`,
      'Обхват талии дополнит картину: он показывает висцеральный жир точнее, чем вес.'
    ]});
  } else if (bmi >= 25){
    const over = lastW != null ? lastW - healthy.max : null;
    const items = [];
    items.push(`Сейчас ИМТ <strong>${f1(bmi)}</strong> — «${escapeHtml(cat.label)}». Норма для роста ${f0(height)} см: <strong>${f1(healthy.min)}–${f1(healthy.max)} кг</strong>.`);
    if (over != null && over > 0){
      const wMin = Math.max(1, Math.ceil(over / 0.75));
      const wMax = Math.max(wMin + 1, Math.ceil(over / 0.4));
      items.push(`До верхней границы нормы — <strong>−${f1(over)} кг</strong>. В безопасном темпе 0,4–0,75 кг в неделю это ${wMin}–${wMax} ${pluralRu(wMax, 'неделя', 'недели', 'недель')}.`);
    }
    items.push('Не ставьте цель «минус 10 кг за месяц»: 0,5–1% массы тела в неделю — предел, за которым начинается потеря мышц и воды, а не жира.');
    const goal = numOrEmpty(p.targetWeight);
    if (goal){
      if (goal < healthy.min) items.push(`Целевой вес ${f1(goal)} кг ниже нормы для вашего роста. Разумнее ориентироваться на ${f1(healthy.min)}–${f1(healthy.max)} кг.`);
      else if (lastW != null && goal < lastW) items.push(`До цели ${f1(goal)} кг осталось <strong>${f1(lastW - goal)} кг</strong>. Прогресс смотрите по недельной средней, а не по одному взвешиванию.`);
      else if (lastW != null && goal >= lastW) items.push(`Цель ${f1(goal)} кг уже достигнута — переходите к удержанию: то же питание без дефицита и те же силовые.`);
    }
    groups.push({ title: 'Цель по весу', items });
  } else if (bmi < 18.5){
    groups.push({ title: 'Вес ниже нормы', items: [
      `ИМТ <strong>${f1(bmi)}</strong> — «${escapeHtml(cat.label)}». Снижать вес в этом состоянии не нужно и опасно.`,
      `Норма для роста ${f0(height)} см — ${f1(healthy.min)}–${f1(healthy.max)} кг. Ориентир — плавный набор 0,25–0,5 кг в неделю.`,
      'Добавляйте калорийность за счёт белка и сложных углеводов (5–6 приёмов пищи), а не сладкого.',
      'Силовые 2–3 раза в неделю — чтобы набирать мышцы, а не только жир.',
      'Если вес не растёт или есть постоянная усталость — обсудите это с врачом.'
    ]});
  } else {
    const normalItems = [
      `ИМТ <strong>${f1(bmi)}</strong> — «${escapeHtml(cat.label)}». Снижать вес не требуется, задача — удержание.`,
      `Коридор удержания: ${f1(healthy.min)}–${f1(healthy.max)} кг.`,
      'Продолжайте силовые 2–3 раза в неделю — это главный фактор сохранения мышц с возрастом.',
      'Следите за талией: она информативнее веса и реагирует на висцеральный жир.',
      'Взвешивайтесь 1–2 раза в неделю, чтобы заметить дрейф вверх на 2–3 кг до того, как он станет проблемой.'
    ];
    const goal = numOrEmpty(p.targetWeight);
    if (goal && lastW != null && goal < lastW - 0.2){
      normalItems.push(`Цель ${f1(goal)} кг ниже текущего веса — это допустимо, но без спешки: 0,25–0,5 кг в неделю и силовые в приоритете, чтобы уходил жир, а не мышцы.`);
    }
    groups.push({ title: 'Вес в норме', items: normalItems });
  }

  const waistItems = [];
  const halfHeight = height / 2;
  if (lastWaist != null){
    const whtrTxt = s.whtr != null ? f2(s.whtr) : '—';
    waistItems.push(`Талия <strong>${f1(lastWaist)} см</strong>, отношение талия/рост — ${whtrTxt}. Здоровый ориентир: меньше ${f1(halfHeight)} см (меньше 0,5 роста).`);
    if (s.whtr >= 0.5) waistItems.push('Талия на уровне половины роста или больше — зона внимания: это признак висцерального жира. Он уходит первым при дефиците калорий и силовых тренировках.');
    else waistItems.push('Талия в безопасном диапазоне — хороший маркер того, что жир не копится в области живота.');
    if (s.waistDelta != null && Math.abs(s.waistDelta) >= 0.5) waistItems.push(`С прошлого измерения талия ${s.waistDelta < 0 ? 'уменьшилась' : 'увеличилась'} на ${f1(Math.abs(s.waistDelta))} см.`);
    const risk = waistRisk(lastWaist, p.gender);
    if (risk) waistItems.push(risk);
    else if (!p.gender) waistItems.push('Пороговые значения: 80/88 см у женщин, 94/102 см у мужчин. Укажите пол в профиле — покажем ваш персональный порог.');
  } else {
    waistItems.push('Добавьте обхват талии — он показывает висцеральный жир точнее, чем вес.');
  }
  waistItems.push('Меряйте на уровне пупка: лента прилегает без натяжения, живот не втягивать, замер на обычном выдохе.');
  waistItems.push('Для динамики достаточно одного замера в неделю в одинаковых условиях.');
  groups.push({ title: 'Обхват талии', items: waistItems });

  if (bmi >= 25 || (s.whtr != null && s.whtr >= 0.5)){
    const targetW = numOrEmpty(p.targetWeight) || healthy.max;
    const protMin = Math.round(targetW * 1.2), protMax = Math.round(targetW * 1.6);
    groups.push({ title: 'Питание', items: [
      'Дефицит 300–500 ккал в день — это примерно минус 0,3–0,5 кг в неделю без голода. Резкое урезание калорий даёт срывы и потерю мышц.',
      'Начните с трёх изменений: сладкие напитки → вода, чай, кофе без сахара; гарнир минус треть порции; в каждый приём пищи — белок и овощи.',
      `Белок: 1,2–1,6 г на кг желаемого веса ≈ <strong>${protMin}–${protMax} г в день</strong>. Источники: яйца, рыба, курица, творог, бобовые.`,
      'Овощи и фрукты 400–500 г в день плюс клетчатка (крупы, бобовые) — сытость без подсчёта калорий.',
      'Алкоголь и «жидкие калории» (соки, латте, газировка) — самый простой способ перекрыть дефицит.',
      'Правило 80/20: 80% рациона — база (белок, овощи, крупы), 20% — любимая еда. Запреты работают хуже.',
      'Раз в 1–2 недели сверяйте порции: глазомер быстро «съезжает».'
    ]});
  }

  const activityLead = p.activity === 'low'
    ? 'Сейчас активность низкая: цель на месяц — 7 000 шагов в день и 2 силовые тренировки в неделю. Кардио добавляйте постепенно.'
    : (p.activity === 'high'
      ? 'Активность высокая: следите за восстановлением. Минимум один полный день отдыха в неделю и сон 8 часов важнее лишней тренировки.'
      : 'Активность средняя: оставьте 2–3 силовые и добавьте 1–2 кардио-сессии, чтобы был недельный объём движения.');
  groups.push({ title: 'Активность и тренировки', items: [
    activityLead,
    'Силовые 2–3 раза в неделю — у вас уже есть программа. В дефиците они сохраняют мышцы и не дают замедлиться обмену.',
    'Кардио 150 минут в неделю в среднем темпе (или 75 минут интенсивного) — рекомендация ВОЗ. Субботний степпер или прогулка уже в плане.',
    'Шаги: цель 7 000–10 000 в день. Если сейчас меньше — добавьте +1 500 и держите две недели.',
    'Бытовая активность: лестница вместо лифта, 10 минут ходьбы после еды — это ещё 100–150 ккал в день.'
  ]});

  const water = lastW != null ? f1(lastW * 0.03) : null;
  const habitItems = [
    'Сон 7–9 часов. Недосып повышает аппетит и тянет к сладкому.',
    water ? `Вода: примерно ${water} л в день (30 мл на кг веса). Чай, кофе и суп тоже идут в счёт.` : 'Вода: примерно 30 мл на кг веса в день.',
    'Вес: утром, натощак, после туалета, в одной одежде, 2–4 раза в неделю. Смотрите на среднюю за неделю.',
    'Плато 2–3 недели — норма. Если талия уменьшается, а вес стоит, значит уходит жир и приходят мышцы.',
    'Раз в месяц делайте фото в одинаковых условиях: изменения видны раньше, чем на весах.'
  ];
  if (s.entries.some(e => e.bodyFat !== '' || e.muscle !== '')){
    habitItems.push('Процент жира и мышц сравнивайте только между замерами на одних и тех же весах: у разных моделей разные алгоритмы и абсолютные значения.');
  }
  groups.push({ title: 'Привычки и замеры', items: habitItems });

  const med = [
    'ИМТ — грубый показатель: он не отличает мышцы от жира. У людей с развитой мускулатурой ИМТ может быть высоким без лишнего жира.',
    'Дополняйте ИМТ обхватом талии и самочувствием: давление, сон, выносливость, качество кожи и волос.'
  ];
  if (bmi >= 30) med.push('ИМТ ≥ 30 — медицинская категория ожирения. Разумно обсудить план снижения веса с врачом (терапевт, эндокринолог), особенно если есть повышенное давление, высокий сахар или боли в суставах.');
  if (bmi >= 35) med.push('При ИМТ ≥ 35 самостоятельное снижение веса часто идёт эффективнее с сопровождением специалиста.');
  const age = numOrEmpty(p.age);
  if (age && age < 18) med.push('Для подростков ИМТ оценивают по возрастным перцентилям, а не по взрослой шкале. Покажите данные врачу.');
  else if (age && age >= 45) med.push('После 45 лет мышцы теряются быстрее. Белок и силовые тренировки важнее, чем скорость снижения веса.');
  med.push('Если вес резко меняется без изменения питания, есть отёки, постоянная жажда или усталость — обратитесь к врачу.');
  med.push('При беременности, диабете, болезнях почек и сердца любые ограничения в питании — только после консультации врача.');
  groups.push({ title: 'Важно знать', items: med });

  return groups;
}

function ensureMeasureDraft(){
  if (!state.measureDraft){
    state.measureDraft = { id: null, date: toDateKey(new Date()), weight: '', waist: '', hips: '', bodyFat: '', muscle: '', water: '', visceral: '', note: '' };
  }
  return state.measureDraft;
}

function renderBody(){
  const body = ensureBody();
  const p = body.profile;
  const s = getBodySummary();
  const draft = ensureMeasureDraft();
  const weightPoints = s.entries.filter(e => e.weight !== '').map(e => ({ date: e.date, value: +e.weight }));
  const waistPoints = s.entries.filter(e => e.waist !== '').map(e => ({ date: e.date, value: +e.waist }));
  const bmiPoints = s.height
    ? s.entries.filter(e => e.weight !== '').map(e => ({ date: e.date, value: calcBMI(e.weight, s.height) })).filter(x => x.value != null)
    : [];
  const fatPoints = s.entries.filter(e => e.bodyFat !== '').map(e => ({ date: e.date, value: +e.bodyFat }));
  const musclePoints = s.entries.filter(e => e.muscle !== '').map(e => ({ date: e.date, value: +e.muscle }));
  const targetWeight = numOrEmpty(p.targetWeight);
  const targetWaist = numOrEmpty(p.waistTarget);
  const cat = s.category;
  const editMode = !!draft.id;
  if (!s.height) state.profileOpen = true;

  let html = `<section class="section">
    <div class="section-header-row">
      <h2 class="section-title">Тело и ИМТ</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" data-action="export-measurements">Экспорт CSV</button>
        <button class="btn btn-ghost btn-sm" data-action="nav" data-view="home">На главную</button>
      </div>
    </div>
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${s.bmi != null ? f1(s.bmi) : '—'}</div>
        <div class="stat-sub" style="color:${cat ? cat.color : 'var(--muted)'}">${escapeHtml(cat ? cat.label : 'нет данных')}</div>
        <div class="stat-label">ИМТ • норма 18,5–24,9</div>
      </div>
      <div class="stat">
        <div class="stat-value">${s.lastWeight ? f1(s.lastWeight.value) + ' <span class="stat-sub">кг</span>' : '—'}</div>
        <div class="stat-label">${s.lastWeight ? 'Вес • ' + fmtDate(s.lastWeight.entry.date) : 'Вес не записан'}${s.weightDelta != null ? ' • ' + fmtSigned(s.weightDelta, 1) + ' кг' : ''}</div>
      </div>
      <div class="stat">
        <div class="stat-value">${s.lastWaist ? f1(s.lastWaist.value) + ' <span class="stat-sub">см</span>' : '—'}</div>
        <div class="stat-label">${s.lastWaist ? 'Талия • ' + fmtDate(s.lastWaist.entry.date) : 'Талия не записана'}${s.waistDelta != null ? ' • ' + fmtSigned(s.waistDelta, 1) + ' см' : ''}</div>
      </div>
      <div class="stat">
        <div class="stat-value">${targetWeight ? f1(targetWeight) + ' <span class="stat-sub">кг</span>' : (s.healthy ? f1(s.healthy.max) + ' <span class="stat-sub">кг</span>' : '—')}</div>
        <div class="stat-label">${targetWeight ? 'Целевой вес' : 'Верхняя граница нормы'}${(targetWeight && s.lastWeight) ? (targetWeight <= s.lastWeight.value ? ' • осталось ' + f1(s.lastWeight.value - targetWeight) + ' кг' : ' • нужно набрать ' + f1(targetWeight - s.lastWeight.value) + ' кг') : ''}</div>
      </div>
    </div>
  </section>`;

  html += `<section class="section"><div class="rules-card">
    <div class="bmi-scale-head"><strong>Шкала ИМТ</strong>
      <span class="muted small">${s.height ? 'Рост ' + f0(s.height) + ' см' : 'Рост не указан'}${s.healthy ? ' • норма веса ' + f1(s.healthy.min) + '–' + f1(s.healthy.max) + ' кг' : ''}</span>
    </div>
    ${bmiScaleHtml(s.bmi)}
  </div></section>`;

  if (!s.height){
    html += `<div class="banner banner-warn"><div><strong>Укажите рост</strong><div class="muted small">Без роста ИМТ не рассчитать. Поле «Рост» — в карточке профиля ниже.</div></div></div>`;
  }

  html += `<section class="section"><div class="rules-card">
    <h3 style="margin-bottom:4px">${editMode ? 'Изменить измерение' : 'Записать измерение'}</h3>
    <p class="muted small" style="margin:0 0 12px">${editMode ? 'Правки сохранятся в записи от ' + fmtDate(draft.date) : 'Вес и обхват талии можно заполнить по отдельности — сохранится то, что указано.'}</p>
    <div class="form-grid">
      <label class="field"><span>Дата</span><input type="date" class="input" data-field="m-date" value="${escapeHtml(draft.date || toDateKey(new Date()))}"></label>
      <label class="field"><span>Вес, кг</span><input type="number" step="0.1" min="25" max="350" inputmode="decimal" class="input" data-field="m-weight" value="${draft.weight !== '' ? escapeHtml(draft.weight) : ''}" placeholder="${s.lastWeight ? f1(s.lastWeight.value) : '—'}"></label>
      <label class="field"><span>Обхват талии, см</span><input type="number" step="0.5" min="35" max="220" inputmode="decimal" class="input" data-field="m-waist" value="${draft.waist !== '' ? escapeHtml(draft.waist) : ''}" placeholder="${s.lastWaist ? f1(s.lastWaist.value) : '—'}"></label>
      <label class="field"><span>Обхват бёдер, см <span class="muted">(необяз.)</span></span><input type="number" step="0.5" min="40" max="220" inputmode="decimal" class="input" data-field="m-hips" value="${draft.hips !== '' ? escapeHtml(draft.hips) : ''}" placeholder="—"></label>
    </div>
    <label class="field" style="margin-top:10px"><span>Комментарий</span><input type="text" class="input" data-field="m-note" value="${escapeHtml(draft.note || '')}" placeholder="например, после отпуска"></label>
    <details class="compose-fields" ${(draft.bodyFat !== '' || draft.muscle !== '' || draft.water !== '' || draft.visceral !== '') ? 'open' : ''}>
      <summary>Состав тела с умных весов <span class="muted small">(необязательно)</span></summary>
      <div class="form-grid" style="margin-top:10px">
        <label class="field"><span>Жир, %</span><input type="number" step="0.1" min="2" max="70" inputmode="decimal" class="input" data-field="m-fat" value="${draft.bodyFat !== '' ? escapeHtml(draft.bodyFat) : ''}" placeholder="—"></label>
        <label class="field"><span>Мышцы, %</span><input type="number" step="0.1" min="5" max="70" inputmode="decimal" class="input" data-field="m-muscle" value="${draft.muscle !== '' ? escapeHtml(draft.muscle) : ''}" placeholder="—"></label>
        <label class="field"><span>Вода, %</span><input type="number" step="0.1" min="20" max="75" inputmode="decimal" class="input" data-field="m-water" value="${draft.water !== '' ? escapeHtml(draft.water) : ''}" placeholder="—"></label>
        <label class="field"><span>Висцеральный жир</span><input type="number" step="1" min="1" max="30" inputmode="numeric" class="input" data-field="m-visceral" value="${draft.visceral !== '' ? escapeHtml(draft.visceral) : ''}" placeholder="—"></label>
      </div>
      <p class="muted small" style="margin:8px 0 0">Эти поля есть не у всех весов. Если у вас есть приложение весов — перепишите показатели, либо нажмите «Разобрать фото весов» и проверьте числа.</p>
    </details>
    <div class="section-actions">
      <button class="btn btn-primary" data-action="save-measurement">${editMode ? 'Обновить измерение' : 'Сохранить измерение'}</button>
      <button class="btn btn-ghost" data-action="reset-measure-form">${editMode ? 'Отменить редактирование' : 'Очистить'}</button>
      <label class="btn btn-ghost ${aiConfigured() ? '' : 'btn-disabled'}" style="cursor:pointer">Разобрать фото весов
        <input type="file" id="scaleFile" accept="image/*" capture="environment" hidden ${aiConfigured() ? '' : 'disabled'}>
      </label>
    </div>
    ${aiConfigured() ? '' : '<p class="muted small" style="margin:6px 0 0">Распознавание фото весов работает после подключения AI-ключа в разделе «Тренер».</p>'}
  </div></section>`;

  html += `<section class="section"><details class="profile-card" id="profileDetails" ${state.profileOpen ? 'open' : ''}>
    <summary>Профиль: рост, пол, цель</summary>
    <div class="form-grid" style="margin-top:12px">
      <label class="field"><span>Рост, см</span><input type="number" min="100" max="250" inputmode="numeric" class="input" data-field="profile-height" value="${p.height !== '' ? escapeHtml(p.height) : ''}" placeholder="например, 170"></label>
      <label class="field"><span>Пол</span><select class="input" data-field="profile-gender">
        <option value="" ${!p.gender ? 'selected' : ''}>Не указывать</option>
        <option value="female" ${p.gender === 'female' ? 'selected' : ''}>Женский</option>
        <option value="male" ${p.gender === 'male' ? 'selected' : ''}>Мужской</option>
      </select></label>
      <label class="field"><span>Возраст</span><input type="number" min="10" max="100" inputmode="numeric" class="input" data-field="profile-age" value="${p.age !== '' ? escapeHtml(p.age) : ''}" placeholder="—"></label>
      <label class="field"><span>Активность</span><select class="input" data-field="profile-activity">
        <option value="low" ${p.activity === 'low' ? 'selected' : ''}>Низкая (сидячая работа)</option>
        <option value="medium" ${p.activity === 'medium' || !p.activity ? 'selected' : ''}>Средняя (1–3 тренировки)</option>
        <option value="high" ${p.activity === 'high' ? 'selected' : ''}>Высокая (4+ тренировок)</option>
      </select></label>
      <label class="field"><span>Целевой вес, кг</span><input type="number" step="0.1" min="25" max="350" inputmode="decimal" class="input" data-field="profile-target" value="${p.targetWeight !== '' ? escapeHtml(p.targetWeight) : ''}" placeholder="${s.healthy ? f1(s.healthy.max) : '—'}"></label>
      <label class="field"><span>Целевая талия, см</span><input type="number" step="0.5" min="35" max="220" inputmode="decimal" class="input" data-field="profile-waist-target" value="${p.waistTarget !== '' ? escapeHtml(p.waistTarget) : ''}" placeholder="${s.height ? f1(s.height / 2) : '—'}"></label>
    </div>
    <p class="muted small" style="margin:10px 0 0">Рост нужен для ИМТ и отношения талия/рост. Целевой вес — ориентир, а не обязательство. Данные хранятся только в этом браузере.</p>
  </details></section>`;

  const charts = [];
  if (weightPoints.length){
    charts.push(renderBodyChart({
      title: 'Вес, кг',
      series: [{ label: 'Вес', color: '#7C5CFF', points: weightPoints }],
      hlines: targetWeight ? [{ value: targetWeight, label: 'цель ' + f1(targetWeight) + ' кг', color: '#C2740A' }] : []
    }));
  }
  if (waistPoints.length){
    const hlines = [];
    if (targetWaist) hlines.push({ value: targetWaist, label: 'цель ' + f1(targetWaist) + ' см', color: '#C2740A' });
    else if (s.height) hlines.push({ value: s.height / 2, label: 'норма < ' + f1(s.height / 2) + ' см', color: '#C2740A' });
    charts.push(renderBodyChart({ title: 'Обхват талии, см', series: [{ label: 'Талия', color: '#0FA97A', points: waistPoints }], hlines }));
  }
  if (bmiPoints.length){
    charts.push(renderBodyChart({ title: 'ИМТ', series: [{ label: 'ИМТ', color: '#A855F7', points: bmiPoints }], band: [18.5, 25] }));
  }
  if (fatPoints.length || musclePoints.length){
    const series = [];
    if (fatPoints.length) series.push({ label: 'Жир, %', color: '#E11D48', points: fatPoints });
    if (musclePoints.length) series.push({ label: 'Мышцы, %', color: '#0FA97A', points: musclePoints });
    charts.push(renderBodyChart({ title: 'Состав тела, %', series }));
  }
  if (charts.length){
    html += `<section class="section"><h2 class="section-title">Динамика</h2><div class="chart-stack">${charts.join('')}</div></section>`;
  } else {
    html += `<section class="section"><div class="rules-card"><p class="muted" style="margin:0">Добавьте первое измерение — здесь появятся графики веса, талии, ИМТ и состава тела.</p></div></section>`;
  }

  let listHtml;
  if (!s.entries.length){
    listHtml = `<div class="empty-state"><div class="empty-title">Пока нет измерений</div><div class="empty-text">Внесите первое измерение: вес и обхват талии.</div></div>`;
  } else {
    let prevW = null, prevWa = null;
    const enriched = s.entries.map(e => {
      const w = e.weight !== '' ? +e.weight : null;
      const wa = e.waist !== '' ? +e.waist : null;
      const dW = (w != null && prevW != null) ? w - prevW : null;
      const dWa = (wa != null && prevWa != null) ? wa - prevWa : null;
      if (w != null) prevW = w;
      if (wa != null) prevWa = wa;
      return { e, w, wa, dW, dWa };
    }).reverse();
    listHtml = '<div class="measure-list">' + enriched.map(item => {
      const e = item.e;
      const bmi = (s.height && item.w != null) ? calcBMI(item.w, s.height) : null;
      const hips = e.hips !== '' ? +e.hips : null;
      return `<div class="measure-item">
        <div class="measure-main">
          <div class="measure-date">${fmtDate(e.date)}</div>
          <div class="measure-values">
            ${item.w != null ? `<span>Вес <b>${f1(item.w)} кг</b> ${deltaBadge(item.dW, 'кг')}</span>` : ''}
            ${item.wa != null ? `<span>Талия <b>${f1(item.wa)} см</b> ${deltaBadge(item.dWa, 'см')}</span>` : ''}
            ${hips != null ? `<span>Бёдра <b>${f1(hips)} см</b></span>` : ''}
            ${e.bodyFat !== '' ? `<span>Жир <b>${f1(+e.bodyFat)}%</b></span>` : ''}
            ${e.muscle !== '' ? `<span>Мышцы <b>${f1(+e.muscle)}%</b></span>` : ''}
            ${e.water !== '' ? `<span>Вода <b>${f1(+e.water)}%</b></span>` : ''}
            ${e.visceral !== '' ? `<span>Висцеральный <b>${f0(+e.visceral)}</b></span>` : ''}
            ${bmi != null ? `<span class="muted">ИМТ ${f1(bmi)}</span>` : ''}
          </div>
          ${e.note ? `<div class="muted small" style="margin-top:2px">${escapeHtml(e.note)}</div>` : ''}
        </div>
        <div class="measure-actions">
          <button class="btn btn-ghost btn-sm" data-action="edit-measurement" data-id="${e.id}">Изменить</button>
          <button class="btn btn-danger btn-sm" data-action="delete-measurement" data-id="${e.id}">Удалить</button>
        </div>
      </div>`;
    }).join('') + '</div>';
  }
  html += `<section class="section"><h2 class="section-title">Все измерения</h2>${listHtml}</section>`;

  html += renderPhotosSection();

  const advice = buildBodyAdvice();
  html += `<section class="section"><h2 class="section-title">Рекомендации</h2>
    ${advice.map(g => `<div class="rec-card"><h3>${escapeHtml(g.title)}</h3><ul class="rules-list">${g.items.map(i => `<li>${i}</li>`).join('')}</ul></div>`).join('')}
    <p class="muted small" style="margin-top:4px">Рекомендации носят общий характер и не заменяют консультацию врача.</p>
  </section>`;

  return html;
}

function renderBodyHomeCard(){
  const s = getBodySummary();
  if (!s.entries.length){
    return `<article class="dash-card body-snap">
      <div class="card-top"><span class="eyebrow">Тело</span><button class="link-btn" data-action="nav" data-view="body">Открыть</button></div>
      <h3>Вес и талия</h3>
      <p class="muted small" style="margin:0 0 14px">Добавьте первое измерение — посчитаем ИМТ и покажем динамику.</p>
      <div class="card-actions"><button class="btn btn-soft btn-block" data-action="open-body">Записать вес</button></div>
    </article>`;
  }
  const weightPoints = s.entries.filter(e => e.weight !== '').slice(-8).map(e => ({ value: +e.weight }));
  const delta = s.weightDelta;
  const cat = s.category;
  return `<article class="dash-card body-snap">
    <div class="card-top"><span class="eyebrow">Тело</span><button class="link-btn" data-action="nav" data-view="body">Подробнее</button></div>
    <div class="body-snap-row">
      <div class="snap-item"><span>Вес</span><strong>${s.lastWeight ? f1(s.lastWeight.value) + ' кг' : '—'}</strong>${delta != null ? `<em class="delta ${delta < 0 ? 'delta-down' : 'delta-up'}">${fmtSigned(delta, 1)} кг</em>` : ''}</div>
      <div class="snap-item"><span>Талия</span><strong>${s.lastWaist ? f1(s.lastWaist.value) + ' см' : '—'}</strong></div>
      <div class="snap-item"><span>ИМТ</span><strong>${s.bmi != null ? f1(s.bmi) : '—'}</strong>${cat ? `<em class="chip chip-cat" style="color:${cat.color}">${escapeHtml(cat.label)}</em>` : ''}</div>
    </div>
    ${weightPoints.length > 1 ? sparklineSvg(weightPoints) : ''}
  </article>`;
}

/* ==================== РЕДАКТОР ПРОГРАММЫ ==================== */
function renderEdit(){
  const d = state.editDraft;
  if (!d) return emptyState('Редактор не загружен', 'Вернитесь на главную и откройте редактор заново.', 'home');
  let html = '';
  if (state.editMode === 'new'){ html += `<div class="edit-banner">Режим: <strong>новая программа</strong>. Текущая программа будет сохранена в архив, история тренировок не изменится.</div>`; }
  if (state.uploadImage){ html += `<details class="image-ref" open><summary>Фото новой программы (для сверки)</summary><img src="${state.uploadImage}" alt="Загруженное фото программы"></details>`; }

  html += `<section class="section">
    <div class="section-header-row">
      <h2 class="section-title">Редактирование программы</h2>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap">
        <button class="btn btn-ghost" data-action="cancel-edit">Отменить</button>
        <button class="btn btn-primary" data-action="save-program">Сохранить</button>
      </div>
    </div>
    <div class="edit-program">
      <div class="edit-day">
        <label class="field"><span>Название программы</span><input class="input" data-field="program-name" value="${escapeHtml(d.name || '')}"></label>
        <label class="field"><span>Подзаголовок</span><input class="input" data-field="program-subtitle" value="${escapeHtml(d.subtitle || '')}"></label>
      </div>`;

  d.days.forEach((day, di) => {
    html += `<div class="edit-day">
      <div class="edit-day-header">
        <input class="input" data-field="day-name" data-day="${di}" value="${escapeHtml(day.name)}" placeholder="Название дня">
        <input class="input" data-field="day-focus" data-day="${di}" value="${escapeHtml(day.focus || '')}" placeholder="Фокус (например, Ноги + Ягодицы)">
        <select class="input" data-field="day-color" data-day="${di}">
          <option value="green" ${day.color === 'green' ? 'selected' : ''}>Зелёный</option>
          <option value="blue" ${day.color === 'blue' ? 'selected' : ''}>Синий</option>
          <option value="purple" ${day.color === 'purple' ? 'selected' : ''}>Фиолетовый</option>
        </select>
        <button class="btn btn-danger btn-sm" data-action="remove-day" data-day="${di}">Удалить день</button>
      </div>
      <div class="edit-section-title">Упражнения</div>`;
    day.exercises.forEach((ex, ei) => {
      html += `<div class="edit-ex">
        <input class="input" data-field="ex-name" data-day="${di}" data-ex="${ei}" value="${escapeHtml(ex.name)}" placeholder="Название">
        <input class="input" type="number" min="1" data-field="ex-sets" data-day="${di}" data-ex="${ei}" value="${ex.sets}" placeholder="Подходы">
        <input class="input" data-field="ex-reps" data-day="${di}" data-ex="${ei}" value="${escapeHtml(ex.reps)}" placeholder="Повторы">
        <select class="input" data-field="ex-unit" data-day="${di}" data-ex="${ei}">
          <option value="kg" ${ex.unit === 'kg' ? 'selected' : ''}>кг</option>
          <option value="reps" ${ex.unit === 'reps' ? 'selected' : ''}>повторы</option>
          <option value="sec" ${ex.unit === 'sec' ? 'selected' : ''}>секунды</option>
        </select>
        <input class="input" data-field="ex-start" data-day="${di}" data-ex="${ei}" value="${escapeHtml(ex.startWeight || '')}" placeholder="Старт">
        <div class="edit-ex-actions">
          <button class="btn btn-ghost btn-sm" data-action="ex-up" data-day="${di}" data-ex="${ei}" title="Выше">↑</button>
          <button class="btn btn-ghost btn-sm" data-action="ex-down" data-day="${di}" data-ex="${ei}" title="Ниже">↓</button>
          <button class="btn btn-danger btn-sm" data-action="remove-ex" data-day="${di}" data-ex="${ei}" title="Удалить">×</button>
        </div>
        <div class="edit-ex-extra">
          <input class="input" data-field="ex-note" data-day="${di}" data-ex="${ei}" value="${escapeHtml(ex.note || '')}" placeholder="Примечание (необязательно)">
          <select class="input" data-field="ex-muscle" data-day="${di}" data-ex="${ei}" title="Основная группа мышц">
            <option value="">Группа мышц…</option>
            ${MUSCLES.map(m => `<option value="${m.id}" ${(ex.muscle || (ex.muscles && ex.muscles[0])) === m.id ? 'selected' : ''}>${m.label}</option>`).join('')}
          </select>
        </div>
      </div>`;
    });
    html += `<button class="edit-add" data-action="add-ex" data-day="${di}">+ Добавить упражнение</button>
      <button class="edit-add" data-action="open-catalog" data-day="${di}" style="margin-left:8px">+ Из каталога под инвентарь</button></div>`;
  });
  html += `<button class="btn btn-ghost" data-action="add-day">+ Добавить тренировочный день</button></div></section>`;
  return html;
}

function commitEditDraftFromInput(t){
  const d = state.editDraft; if (!d) return;
  const f = t.getAttribute('data-field');
  const di = t.dataset.day != null ? +t.dataset.day : null;
  const ei = t.dataset.ex != null ? +t.dataset.ex : null;
  if (f === 'program-name') d.name = t.value;
  else if (f === 'program-subtitle') d.subtitle = t.value;
  else if (f === 'day-name') d.days[di].name = t.value;
  else if (f === 'day-focus') d.days[di].focus = t.value;
  else if (f === 'day-color') d.days[di].color = t.value;
  else if (f === 'ex-name'){
    const ex = d.days[di].exercises[ei];
    ex.name = t.value;
    const meta = inferExerciseMeta(t.value);
    ex.equipment = meta.equipment;
    if (!ex.muscle){ ex.muscles = meta.muscles; ex.pattern = meta.pattern; }
  }
  else if (f === 'ex-sets') d.days[di].exercises[ei].sets = Math.max(1, parseInt(t.value) || 1);
  else if (f === 'ex-reps') d.days[di].exercises[ei].reps = t.value;
  else if (f === 'ex-unit') d.days[di].exercises[ei].unit = t.value;
  else if (f === 'ex-start') d.days[di].exercises[ei].startWeight = t.value;
  else if (f === 'ex-note') d.days[di].exercises[ei].note = t.value;
  else if (f === 'ex-muscle'){
    const ex = d.days[di].exercises[ei];
    ex.muscle = t.value;
    if (t.value) ex.muscles = [t.value].concat((ex.muscles || []).filter(m => m !== t.value));
  }
}

/* ==================== ЗАГРУЗКА ПРОГРАММЫ ==================== */
function renderUpload(){
  let html = `<section class="section">
    <div class="section-header-row"><h2 class="section-title">Загрузить новую программу</h2><button class="btn btn-ghost" data-action="nav" data-view="home">На главный экран</button></div>
    <div class="upload-box">
      <p>Выберите фотографию или изображение программы со своего устройства.</p>
      <input type="file" accept="image/*" id="programImage" class="input" style="max-width:360px;margin:0 auto">
      <p class="muted small" style="margin-top:.8rem">Автоматическое распознавание фото без внешнего платного API невозможно, поэтому после загрузки вы заполните структуру вручную.</p>
    </div>`;
  if (state.uploadImage){
    html += `<div class="upload-preview"><img src="${state.uploadImage}" alt="Предпросмотр"></div>`;
    html += `<div class="section-actions"><button class="btn btn-primary" data-action="start-new-program">Заполнить программу по фото</button><button class="btn btn-ghost" data-action="clear-upload-image">Убрать фото</button></div>`;
  }
  html += `<p class="muted small" style="margin-top:1rem">Старая программа будет сохранена в архиве. История выполненных тренировок не пострадает.</p>
  </section>`;
  return html;
}

/* ==================== РЕЗЕРВНАЯ КОПИЯ ==================== */
function renderBackup(){
  return `<section class="section">
    <div class="section-header-row"><h2 class="section-title">Резервная копия</h2><button class="btn btn-ghost" data-action="nav" data-view="home">На главный экран</button></div>
    <div class="banner banner-warn"><div>Данные хранятся в этом браузере. Очистка кэша или смена устройства приведут к потере. Регулярно делайте резервную копию.</div></div>
    <div class="backup-grid">
      <div class="backup-card">
        <h3>Экспорт</h3><p class="muted">Скачать программу, историю и настройки в JSON-файл.</p>
        <button class="btn btn-primary" data-action="export">Скачать резервную копию</button>
      </div>
      <div class="backup-card">
        <h3>Импорт</h3><p class="muted">Загрузить ранее сохранённый JSON. Перед заменой данных будет предпросмотр.</p>
        <input type="file" accept="application/json,.json" id="importFile" class="input">
        <div id="importPreview"></div>
      </div>
    </div>
    <div class="backup-card" style="margin-top:1rem">
      <h3>Опасная зона</h3><p class="muted">Полностью удалить все данные приложения из этого браузера.</p>
      <button class="btn btn-danger" data-action="reset-all">Сбросить все данные</button>
    </div>
  </section>`;
}

function emptyState(title, text, backView){
  return `<div class="empty-state" style="margin-top:2rem">
    <div class="empty-art">${maleAthleteSvg('empty-figure')}</div>
    <div class="empty-title">${escapeHtml(title)}</div>
    <div class="empty-text">${escapeHtml(text)}</div>
    ${backView ? `<button class="btn btn-primary" data-action="nav" data-view="${backView}">Вернуться</button>` : ''}
  </div>`;
}

/* ==================== ДЕЙСТВИЯ С ИЗМЕРЕНИЯМИ ТЕЛА ==================== */
function parseRange(value, range){
  if (value === '' || value == null) return null;
  const n = parseFloat(String(value).replace(',', '.'));
  if (!isFinite(n)) return NaN;
  if (n < range[0] || n > range[1]) return NaN;
  return n;
}
function dateKeyToNoonIso(key){
  const parts = String(key || '').split('-').map(Number);
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
  const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
function downloadText(filename, text, mime){
  const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function saveMeasurement(){
  const d = ensureMeasureDraft();
  const weight = parseRange(d.weight, BODY_RANGES.weight);
  const waist = parseRange(d.waist, BODY_RANGES.waist);
  const hips = parseRange(d.hips, BODY_RANGES.hips);
  const bodyFat = parseRange(d.bodyFat, BODY_RANGES.bodyFat);
  const muscle = parseRange(d.muscle, BODY_RANGES.muscle);
  const water = parseRange(d.water, BODY_RANGES.water);
  const visceral = parseRange(d.visceral, BODY_RANGES.visceral);
  const values = [weight, waist, hips, bodyFat, muscle, water, visceral];
  if (values.every(v => v === null)){
    showToast('Укажите вес, обхват талии или показатели состава тела', 'error'); return;
  }
  if (values.some(v => Number.isNaN(v))){
    showToast('Проверьте значения: вес 25–350, талия 35–220, бёдра 40–220, жир 2–70%, мышцы 5–70%, вода 20–75%, висцеральный 1–30', 'error'); return;
  }
  const iso = dateKeyToNoonIso(d.date) || new Date().toISOString();
  const body = ensureBody();
  const wasEdit = !!d.id;
  let target = wasEdit ? body.entries.find(e => e.id === d.id) : null;
  if (!wasEdit){
    const sameDay = body.entries.find(e => toDateKey(new Date(e.date)) === toDateKey(new Date(iso)));
    if (sameDay){
      const ok = await confirmDialog('Измерение за эту дату уже есть', 'Заменить запись за ' + fmtDate(iso) + '?', 'Заменить');
      if (!ok) return;
      target = sameDay;
    }
  }
  const fields = {
    weight: weight === null ? '' : weight,
    waist: waist === null ? '' : waist,
    hips: hips === null ? '' : hips,
    bodyFat: bodyFat === null ? '' : bodyFat,
    muscle: muscle === null ? '' : muscle,
    water: water === null ? '' : water,
    visceral: visceral === null ? '' : visceral
  };
  if (target){
    Object.assign(target, fields, { date: iso, note: d.note || '' });
  } else {
    body.entries.push(Object.assign({
      id: uid(), date: iso, createdAt: new Date().toISOString(), note: d.note || ''
    }, fields));
  }
  state.measureDraft = null;
  saveData(); render();
  showToast(wasEdit ? 'Измерение обновлено' : 'Измерение сохранено', 'success');
}
function editMeasurement(id){
  const e = ensureBody().entries.find(x => x.id === id);
  if (!e) return;
  state.measureDraft = {
    id: e.id, date: toDateKey(new Date(e.date)),
    weight: e.weight, waist: e.waist, hips: e.hips,
    bodyFat: e.bodyFat, muscle: e.muscle, water: e.water, visceral: e.visceral,
    note: e.note || ''
  };
  render();
  const el = document.querySelector('[data-field="m-weight"]');
  if (el) el.focus();
  window.scrollTo({ top: 0, behavior: 'auto' });
}
async function deleteMeasurement(id){
  const e = ensureBody().entries.find(x => x.id === id);
  if (!e) return;
  const ok = await confirmDialog('Удалить измерение?', 'Запись от ' + fmtDate(e.date) + ' будет удалена.', 'Удалить', true);
  if (!ok) return;
  const body = ensureBody();
  body.entries = body.entries.filter(x => x.id !== id);
  if (state.measureDraft && state.measureDraft.id === id) state.measureDraft = null;
  saveData(); render(); showToast('Измерение удалено', 'success');
}
function exportMeasurementsCSV(){
  const entries = getBodyEntries();
  if (!entries.length){ showToast('Пока нет измерений для экспорта', 'error'); return; }
  const height = numOrEmpty(ensureBody().profile.height);
  const rows = [['Дата', 'Вес, кг', 'Обхват талии, см', 'Обхват бёдер, см', 'Жир, %', 'Мышцы, %', 'Вода, %', 'Висцеральный жир', 'ИМТ', 'Комментарий']];
  entries.forEach(e => {
    const bmi = (height && e.weight !== '') ? calcBMI(e.weight, height) : null;
    rows.push([
      fmtDate(e.date),
      e.weight !== '' ? f1(e.weight) : '',
      e.waist !== '' ? f1(e.waist) : '',
      e.hips !== '' ? f1(e.hips) : '',
      e.bodyFat !== '' ? f1(e.bodyFat) : '',
      e.muscle !== '' ? f1(e.muscle) : '',
      e.water !== '' ? f1(e.water) : '',
      e.visceral !== '' ? f0(e.visceral) : '',
      bmi != null ? f2(bmi) : '',
      e.note || ''
    ]);
  });
  const csv = '\uFEFF' + rows.map(r => r.map(csvCell).join(';')).join('\r\n');
  downloadText('izmereniya-' + toDateKey(new Date()) + '.csv', csv, 'text/csv;charset=utf-8');
  showToast('CSV с измерениями скачан', 'success');
}
let profileRenderTimer = null;
function commitProfileField(field, rawValue){
  const key = PROFILE_FIELD_MAP[field];
  if (!key) return false;
  const p = ensureBody().profile;
  if (key === 'gender' || key === 'activity') p[key] = rawValue;
  else p[key] = numOrEmpty(rawValue);
  saveData();
  // Небольшая задержка: change срабатывает на blur, и мгновенная перерисовка
  // успела бы заменить кнопку под курсором до клика.
  clearTimeout(profileRenderTimer);
  profileRenderTimer = setTimeout(() => { profileRenderTimer = null; render(); }, 150);
  return true;
}

/* ==================== ДЕЙСТВИЯ ==================== */
function findLastExerciseRecord(exerciseId, name){
  const history = [...state.data.history].sort((a, b) => new Date(b.date) - new Date(a.date));
  for (const w of history){
    for (const ex of w.exercises){
      if (ex.exerciseId === exerciseId){
        const ws = ex.sets.map(s => parseFloat(s.weight)).filter(n => !isNaN(n));
        return ws.length ? ws[ws.length - 1] : '';
      }
    }
  }
  for (const w of history){
    for (const ex of w.exercises){
      if (ex.name === name){
        const ws = ex.sets.map(s => parseFloat(s.weight)).filter(n => !isNaN(n));
        return ws.length ? ws[ws.length - 1] : '';
      }
    }
  }
  return '';
}

function startWorkout(dayId){
  const day = state.data.program.days.find(d => d.id === dayId);
  if (!day){ showToast('Тренировочный день не найден', 'error'); return; }
  if (state.data.activeWorkout){ showToast('Уже есть незавершённая тренировка. Завершите или отмените её.', 'error'); return; }
  const exercises = day.exercises.map(ex => {
    const lastW = findLastExerciseRecord(ex.id, ex.name);
    const sets = [];
    for (let i = 0; i < ex.sets; i++) sets.push({ weight: lastW ? String(lastW) : '', reps: '' });
    return {
      exerciseId: ex.id, name: ex.name, unit: ex.unit,
      plannedSets: ex.sets, plannedReps: ex.reps, note: ex.note || '',
      noWeight: ex.unit !== 'kg', perSetWeight: false,
      weight: lastW ? String(lastW) : '',
      comment: '', sets
    };
  });
  state.data.activeWorkout = { id: uid(), dayId: day.id, dayName: day.name, focus: day.focus, startedAt: new Date().toISOString(), exercises };
  saveData(); state.view = 'workout'; render(); showToast('Тренировка начата', 'success');
}

async function finishWorkout(){
  const w = state.data.activeWorkout; if (!w) return;
  const skipped = w.exercises.filter(ex => !ex.sets.some(s => s.reps !== '' && s.reps != null));
  const partial = w.exercises.filter(ex => { const filled = ex.sets.filter(s => s.reps !== '' && s.reps != null).length; return filled > 0 && filled < ex.sets.length; });
  let newPRs = [];

  w.exercises.forEach(ex => {
      const pr = getHistoricalMaxWeight(ex.name);
      ex.sets.forEach(s => {
          const wgt = parseFloat(ex.perSetWeight ? s.weight : ex.weight);
          if (ex.unit === 'kg' && !ex.noWeight && !isNaN(wgt) && wgt > pr && pr > 0) {
              if(!newPRs.includes(ex.name)) newPRs.push(`${ex.name} (${wgt} кг)`);
          }
      });
  });

  let html = `<h3>Завершить тренировку?</h3><div class="summary">`;
  w.exercises.forEach(ex => {
    const filled = ex.sets.filter(s => s.reps !== '' && s.reps != null).length;
    html += `<div class="summary-ex ${filled === 0 ? 'skipped' : ''}">
      <div class="summary-name">${escapeHtml(ex.name)}${filled === 0 ? '<span class="tag">пропущено</span>' : ''}</div>
      <div>${ex.sets.map(s => { const wgt = ex.unit === 'kg' && !ex.noWeight ? ((s.weight || ex.weight || '—') + ' кг × ') : ''; return `<span class="summary-set">${wgt}${s.reps || '—'}${ex.unit === 'sec' ? ' сек' : ''}</span>`; }).join('')}</div></div>`;
  });
  html += `</div>`;
  if (skipped.length) html += `<p class="warn">Пропущено упражнений: ${skipped.length}. Они не попадут в историю как выполненные.</p>`;
  if (partial.length) html += `<p class="warn">Не полностью заполнено упражнений: ${partial.length}.</p>`;
  
  if (newPRs.length > 0) {
      html += `<div class="banner banner-info" style="margin-top:10px; margin-bottom:0">
        <div><strong>🏆 Новые рекорды!</strong><div class="muted small">${newPRs.join(', ')}</div></div>
      </div>`;
  }

  html += `<div class="modal-actions"><button class="btn btn-ghost" data-modal="cancel">Вернуться</button><button class="btn btn-primary" data-modal="ok">Завершить и сохранить</button></div>`;

  const ok = await openModal(html);
  if (!ok) return;

  const exercises = w.exercises.filter(ex => ex.sets.some(s => s.reps !== '' && s.reps != null)).map(ex => ({
      exerciseId: ex.exerciseId, name: ex.name, unit: ex.unit, noWeight: ex.noWeight, comment: ex.comment || '',
      sets: ex.sets.map(s => ({ weight: (ex.unit === 'kg' && !ex.noWeight) ? (ex.perSetWeight ? (s.weight || '') : (ex.weight || '')) : '', reps: s.reps })).filter(s => s.reps !== '' && s.reps != null)
  }));

  if (!exercises.length){ showToast('Нельзя завершить тренировку без единого выполненного упражнения', 'error'); return; }

  const record = { id: w.id, date: new Date().toISOString(), dayId: w.dayId, dayName: w.dayName, focus: w.focus, exercises, comment: '' };
  state.data.history.push(record);
  state.data.activeWorkout = null;
  if (activeTimer.intervalId) clearInterval(activeTimer.intervalId);
  saveData(); state.view = 'history-detail'; state.params = { id: record.id }; render();
  
  if (newPRs.length > 0) showToast('🏆 Поздравляем с новыми рекордами!', 'success');
  else showToast('Тренировка сохранена в историю', 'success');
}

async function discardWorkout(){
  const ok = await confirmDialog('Отменить тренировку?', 'Введённые результаты будут потеряны.', 'Отменить тренировку', true);
  if (!ok) return;
  state.data.activeWorkout = null; 
  if (activeTimer.intervalId) clearInterval(activeTimer.intervalId);
  saveData(); state.view = 'home'; render();
}

async function deleteWorkout(id){
  const ok = await confirmDialog('Удалить тренировку?', 'Запись будет удалена из истории. Действие необратимо.', 'Удалить', true);
  if (!ok) return;
  state.data.history = state.data.history.filter(w => w.id !== id);
  saveData();
  if (state.view === 'history-detail'){ state.view = 'history'; state.params = {}; }
  render(); showToast('Запись удалена', 'success');
}

function openEditor(mode){
  state.editDraft = deepClone(state.data.program);
  ensureIds(state.editDraft);
  state.editMode = mode || 'current';
  state.view = 'edit'; render();
}

async function saveProgram(){
  const d = state.editDraft; if (!d) return;
  if (!d.name || !d.name.trim()){ showToast('Укажите название программы', 'error'); return; }
  if (!d.days.length){ showToast('Добавьте хотя бы один тренировочный день', 'error'); return; }
  for (const day of d.days){
    if (!day.name || !day.name.trim()){ showToast('У каждого дня должно быть название', 'error'); return; }
    if (!day.exercises.length){ showToast('В дне «' + day.name + '» нет упражнений', 'error'); return; }
    const emptyEx = day.exercises.find(ex => !ex.name || !ex.name.trim());
    if (emptyEx){ showToast('В дне «' + day.name + '» есть упражнение без названия', 'error'); return; }
  }
  if (state.editMode === 'new'){
    const ok = await confirmDialog('Заменить текущую программу?', 'Текущая программа будет сохранена в архив. История тренировок останется без изменений.', 'Заменить программу');
    if (!ok) return;
    state.data.programArchive.push({ program: deepClone(state.data.program), archivedAt: new Date().toISOString() });
    state.data.program = deepClone(d);
  } else { state.data.program = deepClone(d); }
  ensureIds(state.data.program);
  enrichProgramMetadata(state.data.program);
  saveData(); state.editDraft = null; state.uploadImage = null; state.editMode = 'current'; state.view = 'home'; render(); showToast('Программа сохранена', 'success');
}

function cancelEdit(){
  state.editDraft = null; state.uploadImage = null; state.editMode = 'current'; state.view = 'home'; render();
}

async function exportBackup(){
  state.data.meta.lastBackupAt = new Date().toISOString();
  saveData();

  const photosData = [];
  if (typeof mediaGet === 'function' && typeof blobToDataURL === 'function'){
    for (const p of (state.data.photos || [])){
      try {
        const blob = await mediaGet(p.id);
        if (blob) photosData.push({ id: p.id, dataUrl: await blobToDataURL(blob) });
      } catch (_) {}
    }
  }

  const aiForBackup = Object.assign({}, state.data.ai, { apiKey: '' });
  const data = {
    version: 2, exportedAt: new Date().toISOString(), app: 'training-diary',
    program: state.data.program, programArchive: state.data.programArchive, history: state.data.history,
    body: state.data.body, nutrition: state.data.nutrition, inventory: state.data.inventory,
    photos: state.data.photos, photosData, ai: aiForBackup, meta: state.data.meta
  };
  downloadText('trenirovki-backup-' + toDateKey(new Date()) + '.json', JSON.stringify(data), 'application/json');
  showToast('Резервная копия скачана' + (photosData.length ? ' (включая ' + photosData.length + ' фото)' : ''), 'success');
  render();
}

function validateBackup(data){
  if (!data || typeof data !== 'object') return 'Файл не является объектом JSON.';
  if (!data.program || !Array.isArray(data.program.days)) return 'В файле нет программы тренировок.';
  if (!Array.isArray(data.history)) return 'В файле нет истории тренировок.';
  for (const day of data.program.days){
    if (!day.name || !Array.isArray(day.exercises)) return 'Повреждена структура тренировочного дня.';
    for (const ex of day.exercises){ if (!ex.name || typeof ex.sets !== 'number') return 'Повреждена структура упражнения.'; }
  }
  if (data.body && typeof data.body === 'object' && data.body.entries && !Array.isArray(data.body.entries)) return 'Повреждён раздел измерений тела.';
  if (data.nutrition && typeof data.nutrition === 'object' && data.nutrition.entries && !Array.isArray(data.nutrition.entries)) return 'Повреждён дневник питания.';
  return null;
}

function handleImportFile(file){
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const err = validateBackup(data);
      if (err){ showToast('Ошибка импорта: ' + err, 'error'); return; }
      const preview = `<div class="import-preview">
          <div><strong>Файл:</strong> ${escapeHtml(file.name)}</div>
          <div><strong>Программа:</strong> ${escapeHtml(data.program.name || '—')} (${data.program.days.length} дней)</div>
          <div><strong>Записей истории:</strong> ${data.history.length}</div>
          <div><strong>Измерений тела:</strong> ${data.body && Array.isArray(data.body.entries) ? data.body.entries.length : 'нет в файле — останутся текущие'}</div>
          <div><strong>Записей питания:</strong> ${data.nutrition && Array.isArray(data.nutrition.entries) ? data.nutrition.entries.length : 'нет в файле — останутся текущие'}</div>
          <div><strong>Фото:</strong> ${Array.isArray(data.photos) ? data.photos.length : 0} ${Array.isArray(data.photosData) && data.photosData.length ? '(с изображениями)' : '(без изображений)'}</div>
          <div><strong>Экспортирован:</strong> ${data.exportedAt ? fmtDateTime(data.exportedAt) : '—'}</div>
        </div>`;
      $('#importPreview').innerHTML = preview;
      askImportConfirmation(data);
    } catch(e){ showToast('Не удалось прочитать файл: ' + e.message, 'error'); }
  };
  reader.readAsText(file);
}

async function askImportConfirmation(data){
  const ok = await confirmDialog('Импортировать резервную копию?', 'Текущая программа и вся история будут заменены данными из файла. Это действие необратимо. Продолжить?', 'Импортировать');
  if (!ok) return;
  state.data.program = data.program; state.data.programArchive = data.programArchive || []; state.data.history = data.history;
  if (data.body) state.data.body = normalizeBody(data.body); else ensureBody();
  if (data.nutrition) state.data.nutrition = normalizeNutrition(data.nutrition);
  if (data.inventory) state.data.inventory = normalizeInventory(data.inventory);
  if (data.ai){
    const currentKey = state.data.ai ? state.data.ai.apiKey : '';
    state.data.ai = normalizeAI(Object.assign({}, data.ai, { apiKey: currentKey }));
  }
  if (Array.isArray(data.photos)){
    const restored = new Set();
    if (Array.isArray(data.photosData) && typeof mediaPut === 'function' && typeof fetch === 'function'){
      for (const item of data.photosData){
        if (!item || !item.id || !item.dataUrl) continue;
        try {
          const res = await fetch(item.dataUrl);
          const blob = await res.blob();
          await mediaPut(item.id, blob);
          restored.add(item.id);
          if (typeof forgetPhotoUrl === 'function') forgetPhotoUrl(item.id);
        } catch (_) {}
      }
    }
    // Импортируем только те фото, для которых реально восстановились изображения.
    state.data.photos = normalizePhotos(data.photos).filter(p => restored.has(p.id));
  }
  state.data.meta = data.meta || state.data.meta;
  enrichProgramMetadata(state.data.program);
  ensureIds(state.data.program); state.data.activeWorkout = null;
  saveData(); state.view = 'home'; render(); showToast('Данные импортированы', 'success');
}

async function resetAll(){
  const ok = await confirmDialog('Сбросить все данные?', 'Будут удалены программа, история, питание, измерения и фото. Рекомендуется сначала экспортировать резервную копию. Продолжить?', 'Удалить всё', true);
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  if (typeof indexedDB !== 'undefined'){
    try { indexedDB.deleteDatabase(MEDIA_DB_NAME); } catch (_) {}
  }
  location.reload();
}

/* ==================== ОБРАБОТЧИКИ ==================== */
async function handleClick(e){
  const modalBtn = e.target.closest('[data-modal]');
  if (modalBtn){
    const v = modalBtn.dataset.modal;
    if (v === 'ok'){ closeModal(true); } else closeModal(false);
    return;
  }
  const t = e.target.closest('[data-action]');
  if (!t) return;
  const action = t.dataset.action;

  if (typeof handleFeatureAction === 'function' && handleFeatureAction(action, t)) return;

  switch(action){
    case 'nav':
      state.view = t.dataset.view;
      if (state.view === 'history') state.params = {};
      if (state.view === 'backup') state.params = {};
      if ($('#modal') && !$('#modal').hidden) closeModal(false);
      if (state.view === 'edit'){ openEditor('current'); return; }
      if (state.view === 'upload'){ state.uploadImage = null; }
      render(); return;
    case 'open-more': openModal(moreMenuHtml(), 'info'); return;
    case 'open-quick': openModal(quickActionsHtml(), 'info'); return;
    case 'quick-start': {
      if (state.data.activeWorkout){
        closeModal(false);
        state.view = 'workout';
        render();
        return;
      }
      const day = nextPlannedDay();
      closeModal(false);
      if (day) startWorkout(day.id);
      else showToast('Сначала добавьте тренировочный день', 'error');
      return;
    }
    case 'open-photos': {
      closeModal(false);
      state.view = 'body';
      render();
      setTimeout(() => {
        const el = document.getElementById('photosSection');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
      return;
    }
    case 'open-body': {
      if ($('#modal') && !$('#modal').hidden) closeModal(false);
      state.view = 'body';
      state.measureDraft = null;
      render();
      const weightInput = document.querySelector('[data-field="m-weight"]');
      if (weightInput) weightInput.focus();
      return;
    }
    case 'save-measurement': saveMeasurement(); return;
    case 'reset-measure-form': state.measureDraft = null; render(); return;
    case 'edit-measurement': editMeasurement(t.dataset.id); return;
    case 'delete-measurement': deleteMeasurement(t.dataset.id); return;
    case 'export-measurements': exportMeasurementsCSV(); return;
    case 'toggle-timer': {
      const exIdx = +t.dataset.ex;
      if (activeTimer.exIdx === exIdx) { stopTimer(exIdx); } else { startTimer(exIdx); }
      return;
    }
    case 'start-workout': startWorkout(t.dataset.day); return;
    case 'resume-workout': state.view = 'workout'; render(); return;
    case 'discard-workout': discardWorkout(); return;
    case 'cancel-workout': discardWorkout(); return;
    case 'finish-workout': finishWorkout(); return;
    case 'open-workout': state.view = 'history-detail'; state.params = { id: t.dataset.id }; render(); return;
    case 'delete-workout': deleteWorkout(t.dataset.id); return;
    case 'open-exercise-history': state.view = 'exercise-history'; state.params = { name: t.dataset.name }; render(); return;
    case 'clear-history-filter': state.params.historyFilter = { q:'', from:'', to:'' }; render(); return;
    case 'add-day': state.editDraft.days.push({ id: uid(), name: 'Новый день', focus: '', color: 'blue', exercises: [] }); render(); return;
    case 'remove-day': {
      const di = +t.dataset.day; const day = state.editDraft.days[di];
      const ok = await confirmDialog('Удалить день?', 'День «' + day.name + '» и все его упражнения будут удалены из черновика.', 'Удалить', true);
      if (!ok) return;
      state.editDraft.days.splice(di, 1); render(); return;
    }
    case 'add-ex': {
      const di = +t.dataset.day;
      state.editDraft.days[di].exercises.push({ id: uid(), name: 'Новое упражнение', sets: 3, reps: '10', unit: 'kg', startWeight: '', note: '' });
      render(); return;
    }
    case 'remove-ex': {
      const di = +t.dataset.day, ei = +t.dataset.ex; const ex = state.editDraft.days[di].exercises[ei];
      const ok = await confirmDialog('Удалить упражнение?', '«' + ex.name + '» будет удалено из черновика программы.', 'Удалить', true);
      if (!ok) return;
      state.editDraft.days[di].exercises.splice(ei, 1); render(); return;
    }
    case 'ex-up': {
      const di = +t.dataset.day, ei = +t.dataset.ex; if (ei === 0) return;
      const arr = state.editDraft.days[di].exercises; [arr[ei-1], arr[ei]] = [arr[ei], arr[ei-1]]; render(); return;
    }
    case 'ex-down': {
      const di = +t.dataset.day, ei = +t.dataset.ex; const arr = state.editDraft.days[di].exercises;
      if (ei >= arr.length - 1) return;
      [arr[ei+1], arr[ei]] = [arr[ei], arr[ei+1]]; render(); return;
    }
    case 'save-program': saveProgram(); return;
    case 'cancel-edit': cancelEdit(); return;
    case 'start-new-program': openEditor('new'); return;
    case 'clear-upload-image': state.uploadImage = null; render(); return;
    case 'export': exportBackup(); return;
    case 'reset-all': resetAll(); return;
    case 'edit-history': {
      const w = state.data.history.find(x => x.id === t.dataset.id); if (!w) return;
      state.historyDraft = deepClone(w); state.view = 'history-edit'; state.params = { id: w.id }; render(); return;
    }
    case 'cancel-edit-history': state.historyDraft = null; state.view = 'history-detail'; render(); return;
    case 'save-edit-history': saveHistoryEdit(); return;
  }
}

function saveHistoryEdit(){
  const d = state.historyDraft; if (!d) return;
  const idx = state.data.history.findIndex(x => x.id === d.id);
  if (idx === -1){ showToast('Запись не найдена', 'error'); return; }
  state.data.history[idx] = d; saveData();
  state.historyDraft = null; state.view = 'history-detail'; state.params = { id: d.id }; render(); showToast('Запись обновлена', 'success');
}

function handleInput(e){
  const t = e.target;
  const f = t.getAttribute && t.getAttribute('data-field');
  if (typeof handleFeatureInput === 'function' && handleFeatureInput(f, t)) return;
  if (!f) return;

  if (f.startsWith('profile-')) return; // профиль сохраняется на change (после ввода)
  if (MEASURE_FIELD_MAP[f]){ ensureMeasureDraft()[MEASURE_FIELD_MAP[f]] = t.value; return; }

  if (f === 'weight' && t.dataset.ex != null){
    const w = state.data.activeWorkout; if (!w) return;
    const ex = w.exercises[+t.dataset.ex];
    if (t.dataset.set != null){ ex.sets[+t.dataset.set].weight = t.value; } else { ex.weight = t.value; if (!ex.perSetWeight) ex.sets.forEach(s => { s.weight = t.value; }); }
    saveDebounced(); return;
  }
  if (f === 'reps' && t.dataset.ex != null){
    const w = state.data.activeWorkout; if (!w) return;
    w.exercises[+t.dataset.ex].sets[+t.dataset.set].reps = t.value; saveDebounced(); return;
  }
  if (f === 'comment' && t.dataset.ex != null){
    const w = state.data.activeWorkout; if (!w) return;
    w.exercises[+t.dataset.ex].comment = t.value; saveDebounced(); return;
  }
  if (f === 'program-name' || f === 'program-subtitle' || f.startsWith('day-') || f.startsWith('ex-')){
    if (state.editDraft){ commitEditDraftFromInput(t); return; }
  }
  if (f === 'history-q' || f === 'history-from' || f === 'history-to'){
    state.params.historyFilter = state.params.historyFilter || { q:'', from:'', to:'' };
    state.params.historyFilter[f.replace('history-', '')] = t.value; renderPreserveFocus(); return;
  }
  if (state.historyDraft){
    const di = t.dataset.ex != null ? +t.dataset.ex : null; if (di == null) return;
    const ex = state.historyDraft.exercises[di];
    if (f === 'he-weight') ex.sets[+t.dataset.set].weight = t.value;
    else if (f === 'he-reps') ex.sets[+t.dataset.set].reps = t.value;
    else if (f === 'he-comment') ex.comment = t.value;
  }
}

async function handleChange(e){
  const t = e.target;
  const field = t.getAttribute && t.getAttribute('data-field');
  if (typeof handleFeatureChange === 'function' && await handleFeatureChange(field, t)) return;
  if (field && PROFILE_FIELD_MAP[field]){ commitProfileField(field, t.value); return; }
  if (field === 'm-date'){ ensureMeasureDraft().date = t.value; return; }
  const action = t.getAttribute && t.getAttribute('data-action');
  if (!action) {
    if (t.id === 'importFile'){ const f = t.files[0]; t.value = ''; if (f) handleImportFile(f); }
    else if (t.id === 'programImage'){ const f = t.files[0]; t.value = ''; if (f){ const r = new FileReader(); r.onload = () => { state.uploadImage = r.result; render(); }; r.readAsDataURL(f); } }
    return;
  }
  if (action === 'toggle-no-weight'){
    const w = state.data.activeWorkout; if (!w) return;
    const ex = w.exercises[+t.dataset.ex]; ex.noWeight = t.checked;
    if (t.checked) ex.perSetWeight = false; saveData(); render(); return;
  }
  if (action === 'toggle-per-set-weight'){
    const w = state.data.activeWorkout; if (!w) return;
    const ex = w.exercises[+t.dataset.ex]; ex.perSetWeight = t.checked;
    if (t.checked){ const v = ex.weight || ex.sets[0]?.weight || ''; ex.sets.forEach(s => { if (!s.weight) s.weight = v; }); }
    saveData(); render(); return;
  }
}

function renderPreserveFocus(){
  const active = document.activeElement;
  const field = active && active.getAttribute && active.getAttribute('data-field');
  const s = active && active.selectionStart, e = active && active.selectionEnd;
  render();
  if (field){
    const el = document.querySelector(`[data-field="${field}"]`);
    if (el){ el.focus(); if (s != null && el.setSelectionRange){ try{ el.setSelectionRange(s, e); }catch(_){} } }
  }
}

function init(){
  initData();
  const hashView = String((window.location && window.location.hash) || '').replace(/^#/, '');
  if (['home', 'trainer', 'nutrition', 'body', 'history', 'backup', 'upload'].includes(hashView)) state.view = hashView;
  document.addEventListener('click', handleClick);
  document.addEventListener('input', handleInput);
  document.addEventListener('change', handleChange);
  document.addEventListener('toggle', (ev) => {
    if (ev.target && ev.target.id === 'profileDetails') state.profileOpen = !!ev.target.open;
  }, true);
  render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')){
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }
}
init();
