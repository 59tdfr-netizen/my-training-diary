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
        { id:'ex-wed-2', name:"Жим гантелей лёжа", sets:3, reps:"10", unit:"kg", startWeight:"5–6", note:"" },
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

const state = { view:'home', params:{}, data:null, editDraft:null, editMode:'current', uploadImage:null, historyDraft:null, measureDraft:null, profileOpen:false };

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
      version: 1, meta: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastBackupAt: new Date().toISOString() },
      program: deepClone(DEFAULT_PROGRAM), programArchive: [], history: [], activeWorkout: null, body: normalizeBody(null)
    };
    ensureIds(state.data.program); saveData(); return;
  }
  raw.program = raw.program || deepClone(DEFAULT_PROGRAM);
  raw.programArchive = raw.programArchive || [];
  raw.history = raw.history || [];
  raw.activeWorkout = raw.activeWorkout || null;
  raw.body = normalizeBody(raw.body);
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
  $('#brandSub').textContent = state.data.program.name + ' • ' + (state.data.program.subtitle || '');
  const navMap = { home:'home', body:'body', workout:'home', edit:'edit', upload:'upload', history:'history', 'history-detail':'history', 'history-edit':'history', 'exercise-history':'history', backup:'backup' };
  $$('#topnav .nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === navMap[state.view]));
  
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

    cellsHtml += `<div class="heatmap-cell" data-level="${isFuture ? 0 : level}" title="${title}"></div>`;
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

function renderHome(){
  const prog = state.data.program;
  const stats = computeStats();
  const active = state.data.activeWorkout;
  let html = '';

  if (active){
    html += `<div class="banner banner-info">
      <div><strong>Незавершённая тренировка</strong><div class="muted small">${escapeHtml(active.dayName)} • начата ${fmtDateTime(active.startedAt)}</div></div>
      <div class="banner-actions">
        <button class="btn btn-primary" data-action="resume-workout">Продолжить</button>
        <button class="btn btn-ghost" data-action="discard-workout">Отменить</button>
      </div></div>`;
  }

  const lastBackup = new Date(state.data.meta.lastBackupAt || 0);
  const daysSinceBackup = Math.floor((new Date() - lastBackup) / (1000 * 60 * 60 * 24));
  if (daysSinceBackup > 14) {
    html += `<div class="banner banner-warn">
      <div><strong>Давно не сохраняли данные</strong><div class="muted small">Прошло ${daysSinceBackup} дней. Браузер может очистить память.</div></div>
      <div class="banner-actions">
        <button class="btn btn-primary" data-action="nav" data-view="backup">Сделать бэкап</button>
      </div></div>`;
  }

  html += `<section class="section">
    <h2 class="section-title">Сводка прогресса</h2>
    <div class="stats">
      <div class="stat"><div class="stat-value">${stats.weekDone} <span class="stat-sub">из ${stats.weekPlanned}</span></div><div class="stat-label">Тренировок на этой неделе</div></div>
      <div class="stat"><div class="stat-value">${stats.percent}%</div><div class="stat-label">Выполнение за 4 недели</div></div>
      <div class="stat"><div class="stat-value">${stats.lastDate ? fmtDate(stats.lastDate) : '—'}</div><div class="stat-label">Последняя тренировка</div></div>
      <div class="stat"><div class="stat-value">${stats.totalDone}</div><div class="stat-label">Всего завершено</div></div>
    </div>
  </section>`;

  html += renderBodyHomeCard();

  if (state.data.history.length > 0) {
    html += `<section class="section">
      <h2 class="section-title">Календарь активности</h2>
      ${renderHeatmap()}
    </section>`;
  }

  if (prog.rules && prog.rules.length){
    html += `<section class="section"><h2 class="section-title">Общие правила</h2><div class="rules-card"><ul class="rules-list">${prog.rules.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul></div></section>`;
  }

  html += `<section class="section"><h2 class="section-title">План тренировок</h2><div class="day-grid">`;
  prog.days.forEach(day => { html += renderDayCard(day); });
  html += `</div></section>`;

  if (prog.extra && prog.extra.length){
    html += `<section class="section"><h2 class="section-title">Дополнительно</h2><div class="extra-grid">`;
    prog.extra.forEach(it => { html += `<div class="extra-card"><div class="extra-title">${escapeHtml(it.title)}</div><div class="extra-text">${escapeHtml(it.text)}</div></div>`; });
    html += `</div></section>`;
  }

  if (prog.goals && prog.goals.length){
    html += `<section class="section"><h2 class="section-title">Цель на этап</h2><div class="rules-card"><ul class="goals-list">${prog.goals.map(g => `<li>${escapeHtml(g)}</li>`).join('')}</ul></div></section>`;
  }
  if (prog.notes && prog.notes.length){
    html += `<section class="section"><h2 class="section-title">Важные заметки</h2><div class="rules-card"><ul class="notes-list">${prog.notes.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul></div></section>`;
  }

  html += `<section class="section storage-note"><p class="muted small">Данные хранятся в этом браузере. Для переноса или защиты от очистки кэша используйте <a href="#" data-action="nav" data-view="backup">резервную копию</a>.</p></section>`;
  return html;
}

function renderDayCard(day){
  const status = getDayStatus(day.id);
  const active = state.data.activeWorkout;
  const isActive = active && active.dayId === day.id;
  const lastWorkout = status === 'done' ? getLastWorkoutForDay(day.id) : null;

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
  else if (lastWorkout){ actionsHtml = `<button class="btn btn-ghost" data-action="open-workout" data-id="${lastWorkout.id}">Открыть результат</button><button class="btn btn-primary" data-action="start-workout" data-day="${day.id}">Начать снова</button>`; }
  else { actionsHtml = `<button class="btn btn-primary btn-block" data-action="start-workout" data-day="${day.id}">Начать тренировку</button>`; }

  return `<div class="day-card day-card-${day.color || 'blue'}">
    <div class="day-card-header">
      <div class="day-card-heading"><div class="day-card-title">${escapeHtml(day.name)}</div><div class="day-card-focus">${escapeHtml(day.focus || '')}</div></div>
      ${statusHtml}
    </div>
    <ul class="ex-list">${exHtml}</ul>
    <div class="day-card-actions">${actionsHtml}</div>
  </div>`;
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
          <div class="muted small">${w.exercises.length} упражнений • ${totalSets} подходов</div>
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
  const dots = points.map((p, i) => `<circle cx="${xScale(i).toFixed(1)}" cy="${yScale(p.value).toFixed(1)}" r="3.5" fill="#2878C8"/>`).join('');
  const xLabels = points.map((p, i) => {
    const step = Math.ceil(points.length / 6);
    if (i % step !== 0 && i !== points.length - 1) return '';
    return `<text x="${xScale(i).toFixed(1)}" y="${H - 8}" font-size="10" text-anchor="middle" fill="#687586">${fmtDate(p.date).slice(0, 5)}</text>`;
  }).join('');
  return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(title)}">
    <line x1="${P}" y1="${H - P}" x2="${W - P}" y2="${H - P}" stroke="#E1E6EC"/>
    <line x1="${P}" y1="${P}" x2="${P}" y2="${H - P}" stroke="#E1E6EC"/>
    <path d="${path}" fill="none" stroke="#2878C8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}${xLabels}<text x="${P}" y="16" font-size="12" fill="#687586">${escapeHtml(title)}</text>
  </svg>`;
}

/* ==================== ТЕЛО, ВЕС И ИМТ ==================== */
const BODY_PROFILE_DEFAULTS = { height: '', gender: '', age: '', activity: 'medium', targetWeight: '', waistTarget: '' };
const BODY_RANGES = { weight: [25, 350], waist: [35, 220], hips: [40, 220], height: [100, 250], age: [10, 100] };
const PROFILE_FIELD_MAP = {
  'profile-height': 'height', 'profile-age': 'age', 'profile-target': 'targetWeight',
  'profile-waist-target': 'waistTarget', 'profile-gender': 'gender', 'profile-activity': 'activity'
};
const MEASURE_FIELD_MAP = { 'm-date': 'date', 'm-weight': 'weight', 'm-waist': 'waist', 'm-hips': 'hips', 'm-note': 'note' };
const BMI_CATEGORIES = [
  { max: 16, key: 'severe-under', label: 'Выраженный дефицит массы', color: '#c53030' },
  { max: 18.5, key: 'under', label: 'Недостаточная масса', color: '#b45309' },
  { max: 25, key: 'normal', label: 'Норма', color: '#27845A' },
  { max: 30, key: 'over', label: 'Избыточная масса', color: '#b45309' },
  { max: 35, key: 'ob1', label: 'Ожирение I степени', color: '#c53030' },
  { max: 40, key: 'ob2', label: 'Ожирение II степени', color: '#a82222' },
  { max: Infinity, key: 'ob3', label: 'Ожирение III степени', color: '#a82222' }
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
  const s = (Math.round(v * d) / d).toFixed(digits).replace('.', ',');
  return (v > 0 ? '+' : '') + s;
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
    { from: 15, to: 18.5, color: '#f2c94c' },
    { from: 18.5, to: 25, color: '#40c463' },
    { from: 25, to: 30, color: '#f2994a' },
    { from: 30, to: 35, color: '#eb5757' },
    { from: 35, to: 40, color: '#a82222' }
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
    .map(s => ({ label: s.label || '', color: s.color || '#2878C8', points: (s.points || []).filter(p => p && p.date && isFinite(p.value)) }))
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
    bandSvg = `<rect x="${PL}" y="${yTop.toFixed(1)}" width="${(W - PL - PR).toFixed(1)}" height="${Math.max(0, yBot - yTop).toFixed(1)}" fill="#e6f4ed"/>` +
      `<text x="${W - PR - 6}" y="${(yTop + 12).toFixed(1)}" font-size="10" text-anchor="end" fill="#27845A">норма ${f1(cfg.band[0])}–${f1(cfg.band[1])}</text>`;
  }

  let grid = '';
  for (let i = 0; i <= steps; i++){
    const v = minV + step * i;
    const y = Y(v);
    grid += `<line x1="${PL}" y1="${y.toFixed(1)}" x2="${W - PR}" y2="${y.toFixed(1)}" stroke="#E1E6EC" stroke-dasharray="3 3"/>`;
    grid += `<text x="${PL - 8}" y="${(y + 4).toFixed(1)}" font-size="10" text-anchor="end" fill="#687586">${axis(v)}</text>`;
  }

  let linesSvg = '';
  (cfg.hlines || []).forEach(l => {
    if (!isFinite(l.value)) return;
    const y = Y(l.value).toFixed(1);
    linesSvg += `<line x1="${PL}" y1="${y}" x2="${W - PR}" y2="${y}" stroke="${l.color || '#b45309'}" stroke-width="1.5" stroke-dasharray="5 4"/>`;
    linesSvg += `<text x="${W - PR - 4}" y="${(Y(l.value) - 5).toFixed(1)}" font-size="10" text-anchor="end" fill="${l.color || '#b45309'}">${escapeHtml(l.label || '')}</text>`;
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
    xLabels += `<text x="${X(t).toFixed(1)}" y="${H - 12}" font-size="10" text-anchor="${anchor}" fill="#687586">${escapeHtml(fmtDate(new Date(t)).slice(0, 5))}</text>`;
  });

  let legend = '';
  series.forEach(s => { legend += `<span><i style="background:${s.color}"></i>${escapeHtml(s.label)}</span>`; });
  (cfg.hlines || []).forEach(l => {
    if (isFinite(l.value)) legend += `<span><i class="dash" style="border-top-color:${l.color || '#b45309'}"></i>${escapeHtml(l.label || '')}</span>`;
  });
  if (cfg.band) legend += '<span><i style="background:#e6f4ed;border:1px solid #b7e0c9"></i>норма ИМТ</span>';

  return `<div class="chart-wrap">
    <svg class="chart-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(cfg.title || 'График')}">
      <text x="${PL}" y="15" font-size="12" fill="#687586">${escapeHtml(cfg.title || '')}</text>
      ${bandSvg}${grid}${linesSvg}${pathsSvg}${xLabels}
    </svg>
    ${legend ? `<div class="chart-legend">${legend}</div>` : ''}
  </div>`;
}

function deltaBadge(delta, unit){
  if (delta == null || !isFinite(delta) || Math.abs(delta) < 0.05) return '';
  const cls = delta < 0 ? 'delta-down' : 'delta-up';
  const arrow = delta < 0 ? '▼' : '▲';
  return `<span class="delta ${cls}">${arrow} ${fmtSigned(delta, 1).replace('+', '').replace('-', '')} ${unit}</span>`;
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
    if (s.whtr >= 0.5) waistItems.push('Талия больше половины роста — признак висцерального жира. Он уходит первым при дефиците калорий и силовых тренировках.');
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
  groups.push({ title: 'Привычки и замеры', items: [
    'Сон 7–9 часов. Недосып повышает аппетит и тянет к сладкому.',
    water ? `Вода: примерно ${water} л в день (30 мл на кг веса). Чай, кофе и суп тоже идут в счёт.` : 'Вода: примерно 30 мл на кг веса в день.',
    'Вес: утром, натощак, после туалета, в одной одежде, 2–4 раза в неделю. Смотрите на среднюю за неделю.',
    'Плато 2–3 недели — норма. Если талия уменьшается, а вес стоит, значит уходит жир и приходят мышцы.',
    'Раз в месяц делайте фото в одинаковых условиях: изменения видны раньше, чем на весах.'
  ]});

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
    state.measureDraft = { id: null, date: toDateKey(new Date()), weight: '', waist: '', hips: '', note: '' };
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
    <div class="section-actions">
      <button class="btn btn-primary" data-action="save-measurement">${editMode ? 'Обновить измерение' : 'Сохранить измерение'}</button>
      <button class="btn btn-ghost" data-action="reset-measure-form">${editMode ? 'Отменить редактирование' : 'Очистить'}</button>
    </div>
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
      series: [{ label: 'Вес', color: '#2878C8', points: weightPoints }],
      hlines: targetWeight ? [{ value: targetWeight, label: 'цель ' + f1(targetWeight) + ' кг', color: '#b45309' }] : []
    }));
  }
  if (waistPoints.length){
    const hlines = [];
    if (targetWaist) hlines.push({ value: targetWaist, label: 'цель ' + f1(targetWaist) + ' см', color: '#b45309' });
    else if (s.height) hlines.push({ value: s.height / 2, label: 'норма < ' + f1(s.height / 2) + ' см', color: '#b45309' });
    charts.push(renderBodyChart({ title: 'Обхват талии, см', series: [{ label: 'Талия', color: '#27845A', points: waistPoints }], hlines }));
  }
  if (bmiPoints.length){
    charts.push(renderBodyChart({ title: 'ИМТ', series: [{ label: 'ИМТ', color: '#6d5aa5', points: bmiPoints }], band: [18.5, 25] }));
  }
  if (charts.length){
    html += `<section class="section"><h2 class="section-title">Динамика</h2><div class="chart-stack">${charts.join('')}</div></section>`;
  } else {
    html += `<section class="section"><div class="rules-card"><p class="muted" style="margin:0">Добавьте первое измерение — здесь появятся графики веса, талии и ИМТ.</p></div></section>`;
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
    return `<section class="section">
      <div class="section-header-row"><h2 class="section-title">Тело и ИМТ</h2></div>
      <div class="rules-card" style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap">
        <div style="min-width:200px;flex:1"><div class="extra-title">Вес и обхват талии</div><div class="extra-text">Записывайте измерения — приложение посчитает ИМТ, покажет динамику и подскажет, как снижать вес без потери мышц.</div></div>
        <button class="btn btn-primary" data-action="open-body">Записать вес</button>
      </div>
    </section>`;
  }

  const last = s.entries[s.entries.length - 1];
  const daysAgo = Math.max(0, Math.round((new Date(toDateKey(new Date())) - new Date(toDateKey(new Date(last.date)))) / 86400000));
  const agoText = daysAgo === 0 ? 'Измерение сегодня' : 'Последнее измерение ' + daysAgo + ' ' + pluralRu(daysAgo, 'день', 'дня', 'дней') + ' назад';
  return `<section class="section">
    <div class="section-header-row">
      <h2 class="section-title">Тело и ИМТ</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <span class="muted small">${agoText}</span>
        <button class="btn btn-primary btn-sm" data-action="open-body">Записать</button>
      </div>
    </div>
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${s.bmi != null ? f1(s.bmi) : '—'}</div>
        <div class="stat-sub" style="color:${s.category ? s.category.color : 'var(--muted)'}">${escapeHtml(s.category ? s.category.label : 'нет роста')}</div>
        <div class="stat-label">ИМТ</div>
      </div>
      <div class="stat">
        <div class="stat-value">${s.lastWeight ? f1(s.lastWeight.value) + ' <span class="stat-sub">кг</span>' : '—'}</div>
        <div class="stat-label">Вес${s.weightDelta != null ? ' • ' + fmtSigned(s.weightDelta, 1) + ' кг' : ''}</div>
      </div>
      <div class="stat">
        <div class="stat-value">${s.lastWaist ? f1(s.lastWaist.value) + ' <span class="stat-sub">см</span>' : '—'}</div>
        <div class="stat-label">Талия${s.waistDelta != null ? ' • ' + fmtSigned(s.waistDelta, 1) + ' см' : ''}</div>
      </div>
      <div class="stat">
        <div class="stat-value">${s.whtr != null ? f2(s.whtr) : '—'}</div>
        <div class="stat-label">Талия / рост (норма &lt; 0,5)</div>
      </div>
    </div>
  </section>`;
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
        <input class="input edit-ex-note" data-field="ex-note" data-day="${di}" data-ex="${ei}" value="${escapeHtml(ex.note || '')}" placeholder="Примечание (необязательно)">
      </div>`;
    });
    html += `<button class="edit-add" data-action="add-ex" data-day="${di}">+ Добавить упражнение</button></div>`;
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
  else if (f === 'ex-name') d.days[di].exercises[ei].name = t.value;
  else if (f === 'ex-sets') d.days[di].exercises[ei].sets = Math.max(1, parseInt(t.value) || 1);
  else if (f === 'ex-reps') d.days[di].exercises[ei].reps = t.value;
  else if (f === 'ex-unit') d.days[di].exercises[ei].unit = t.value;
  else if (f === 'ex-start') d.days[di].exercises[ei].startWeight = t.value;
  else if (f === 'ex-note') d.days[di].exercises[ei].note = t.value;
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
  if (weight === null && waist === null && hips === null){
    showToast('Укажите вес или обхват талии', 'error'); return;
  }
  if ([weight, waist, hips].some(v => Number.isNaN(v))){
    showToast('Проверьте значения: вес 25–350 кг, талия 35–220 см, бёдра 40–220 см', 'error'); return;
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
  if (target){
    target.date = iso;
    target.weight = weight === null ? '' : weight;
    target.waist = waist === null ? '' : waist;
    target.hips = hips === null ? '' : hips;
    target.note = d.note || '';
  } else {
    body.entries.push({
      id: uid(), date: iso, createdAt: new Date().toISOString(),
      weight: weight === null ? '' : weight,
      waist: waist === null ? '' : waist,
      hips: hips === null ? '' : hips,
      note: d.note || ''
    });
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
    weight: e.weight, waist: e.waist, hips: e.hips, note: e.note || ''
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
  const rows = [['Дата', 'Вес, кг', 'Обхват талии, см', 'Обхват бёдер, см', 'ИМТ', 'Комментарий']];
  entries.forEach(e => {
    const bmi = (height && e.weight !== '') ? calcBMI(e.weight, height) : null;
    rows.push([
      fmtDate(e.date),
      e.weight !== '' ? f1(e.weight) : '',
      e.waist !== '' ? f1(e.waist) : '',
      e.hips !== '' ? f1(e.hips) : '',
      bmi != null ? f2(bmi) : '',
      e.note || ''
    ]);
  });
  const csv = '\uFEFF' + rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\r\n');
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
  saveData(); state.editDraft = null; state.uploadImage = null; state.editMode = 'current'; state.view = 'home'; render(); showToast('Программа сохранена', 'success');
}

function cancelEdit(){
  state.editDraft = null; state.uploadImage = null; state.editMode = 'current'; state.view = 'home'; render();
}

function exportBackup(){
  state.data.meta.lastBackupAt = new Date().toISOString();
  saveData();

  const data = { version: 1, exportedAt: new Date().toISOString(), app: 'training-diary', program: state.data.program, programArchive: state.data.programArchive, history: state.data.history, body: state.data.body, meta: state.data.meta };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'trenirovki-backup-' + toDateKey(new Date()) + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Резервная копия скачана', 'success');
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
  state.data.meta = data.meta || state.data.meta; ensureIds(state.data.program); state.data.activeWorkout = null;
  saveData(); state.view = 'home'; render(); showToast('Данные импортированы', 'success');
}

async function resetAll(){
  const ok = await confirmDialog('Сбросить все данные?', 'Будут удалены программа, история и архив. Рекомендуется сначала экспортировать резервную копию. Продолжить?', 'Удалить всё', true);
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY); location.reload();
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

  switch(action){
    case 'nav':
      state.view = t.dataset.view;
      if (state.view === 'history') state.params = {};
      if (state.view === 'backup') state.params = {};
      if (state.view === 'edit'){ openEditor('current'); return; }
      if (state.view === 'upload'){ state.uploadImage = null; }
      render(); return;
    case 'open-body': {
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

function handleChange(e){
  const t = e.target;
  const field = t.getAttribute && t.getAttribute('data-field');
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
  if (['body', 'history', 'backup', 'upload'].includes(hashView)) state.view = hashView;
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
