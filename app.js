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
  goals: [
    "Восстановить технику",
    "Вернуться к системности",
    "Почувствовать тело и нагрузку",
    "Не гнаться за весом"
  ],
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
const state = { view:'home', params:{}, data:null, editDraft:null, editMode:'current', uploadImage:null, historyDraft:null };

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
  } catch(e){
    showToast('Не удалось сохранить данные: ' + e.message, 'error');
  }
}
let saveTimer = null;
function saveDebounced(){ clearTimeout(saveTimer); saveTimer = setTimeout(saveData, 300); }

function initData(){
  const raw = loadRaw();
  if (!raw){
    state.data = {
      version: 1,
      meta: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      program: deepClone(DEFAULT_PROGRAM),
      programArchive: [],
      history: [],
      activeWorkout: null
    };
    ensureIds(state.data.program);
    saveData();
    return;
  }
  raw.program = raw.program || deepClone(DEFAULT_PROGRAM);
  raw.programArchive = raw.programArchive || [];
  raw.history = raw.history || [];
  raw.activeWorkout = raw.activeWorkout || null;
  raw.meta = raw.meta || {};
  ensureIds(raw.program);
  state.data = raw;
}

/* ==================== UI-ХЕЛПЕРЫ ==================== */
let toastTimer = null;
function showToast(msg, type = 'info'){
  const t = $('#toast');
  t.textContent = msg; t.className = 'toast toast-' + type; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 3500);
}

let modalResolve = null;
let modalMode = 'confirm';
function openModal(html, mode = 'confirm'){
  return new Promise(resolve => {
    modalMode = mode; modalResolve = resolve;
    $('#modalContent').innerHTML = html;
    $('#modal').hidden = false;
  });
}
function closeModal(value){
  $('#modal').hidden = true;
  $('#modalContent').innerHTML = '';
  const r = modalResolve; modalResolve = null;
  if (r) r(value);
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
function promptDialog(title, defaultValue = '', label = 'Значение'){
  return openModal(
    `<h3>${escapeHtml(title)}</h3>
     <label class="field"><span>${escapeHtml(label)}</span>
       <input class="input" id="modalPromptInput" value="${escapeHtml(defaultValue)}"></label>
     <div class="modal-actions">
       <button class="btn btn-ghost" data-modal="cancel">Отмена</button>
       <button class="btn btn-primary" data-modal="ok">OK</button>
     </div>`, 'prompt'
  ).then(v => {
    setTimeout(() => { const i = $('#modalPromptInput'); if (i){ i.focus(); i.select(); } }, 30);
    return v;
  });
}

/* ==================== РЕНДЕР ==================== */
function render(){
  const app = $('#app');
  let html = '';
  switch(state.view){
    case 'home': html = renderHome(); break;
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
  const navMap = { home:'home', workout:'home', edit:'edit', upload:'upload',
    history:'history', 'history-detail':'history', 'history-edit':'history',
    'exercise-history':'history', backup:'backup' };
  $$('#topnav .nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === navMap[state.view]));
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function renderPreserveFocus(){
  const active = document.activeElement;
  const field = active && active.getAttribute && active.getAttribute('data-field');
  const s = active && active.selectionStart, e = active && active.selectionEnd;
  render();
  if (field){
    const el = document.querySelector(`[data-field="${field}"]`);
    if (el){
      el.focus();
      if (s != null && el.setSelectionRange){ try{ el.setSelectionRange(s, e); }catch(_){} }
    }
  }
}

/* ==================== ГЛАВНАЯ ==================== */
function getDayStatus(dayId){
  const active = state.data.activeWorkout;
  if (active && active.dayId === dayId) return 'in-progress';
  const weekStart = getWeekStart(new Date());
  const weekEnd = addDays(weekStart, 7);
  const done = state.data.history.some(w => {
    if (w.dayId !== dayId) return false;
    const d = new Date(w.date);
    return d >= weekStart && d < weekEnd;
  });
  return done ? 'done' : 'not-started';
}

function getLastWorkoutForDay(dayId){
  const sorted = [...state.data.history].sort((a, b) => new Date(b.date) - new Date(a.date));
  return sorted.find(w => w.dayId === dayId) || null;
}

function renderHome(){
  const prog = state.data.program;
  const stats = computeStats();
  const active = state.data.activeWorkout;
  let html = '';

  if (active){
    html += `<div class="banner banner-info">
      <div>
        <strong>Незавершённая тренировка</strong>
        <div class="muted small">${escapeHtml(active.dayName)} • начата ${fmtDateTime(active.startedAt)}</div>
      </div>
      <div class="banner-actions">
        <button class="btn btn-primary" data-action="resume-workout">Продолжить</button>
        <button class="btn btn-ghost" data-action="discard-workout">Отменить</button>
      </div>
    </div>`;
  }

  html += `<section class="section">
    <h2 class="section-title">Сводка прогресса</h2>
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${stats.weekDone} <span class="stat-sub">из ${stats.weekPlanned}</span></div>
        <div class="stat-label">Тренировок на этой неделе</div>
      </div>
      <div class="stat">
        <div class="stat-value">${stats.percent}%</div>
        <div class="stat-label">Выполнение за 4 недели</div>
      </div>
      <div class="stat">
        <div class="stat-value">${stats.lastDate ? fmtDate(stats.lastDate) : '—'}</div>
        <div class="stat-label">Последняя тренировка</div>
      </div>
      <div class="stat">
        <div class="stat-value">${stats.totalDone}</div>
        <div class="stat-label">Всего завершено</div>
      </div>
    </div>
  </section>`;

  if (prog.rules && prog.rules.length){
    html += `<section class="section">
      <h2 class="section-title">Общие правила</h2>
      <div class="rules-card">
        <ul class="rules-list">${prog.rules.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
      </div>
    </section>`;
  }

  html += `<section class="section">
    <h2 class="section-title">План тренировок</h2>
    <div class="day-grid">`;
  prog.days.forEach(day => { html += renderDayCard(day); });
  html += `</div></section>`;

  if (prog.extra && prog.extra.length){
    html += `<section class="section">
      <h2 class="section-title">Дополнительно</h2>
      <div class="extra-grid">`;
    prog.extra.forEach(it => {
      html += `<div class="extra-card">
        <div class="extra-title">${escapeHtml(it.title)}</div>
        <div class="extra-text">${escapeHtml(it.text)}</div>
      </div>`;
    });
    html += `</div></section>`;
  }

  if (prog.goals && prog.goals.length){
    html += `<section class="section">
      <h2 class="section-title">Цель на этап</h2>
      <div class="rules-card">
        <ul class="goals-list">${prog.goals.map(g => `<li>${escapeHtml(g)}</li>`).join('')}</ul>
      </div>
    </section>`;
  }

  if (prog.notes && prog.notes.length){
    html += `<section class="section">
      <h2 class="section-title">Важные заметки</h2>
      <div class="rules-card">
        <ul class="notes-list">${prog.notes.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul>
      </div>
    </section>`;
  }

  html += `<section class="section storage-note">
    <p class="muted small">Данные хранятся в этом браузере. Для переноса на другое устройство или защиты от очистки кэша используйте
    <a href="#" data-action="nav" data-view="backup">резервную копию</a>.</p></section>`;
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
  if (isActive){
    actionsHtml = `<button class="btn btn-primary btn-block" data-action="resume-workout">Продолжить тренировку</button>`;
  } else if (active){
    actionsHtml = `<button class="btn btn-ghost btn-block" disabled>Есть незавершённая тренировка</button>`;
  } else if (lastWorkout){
    actionsHtml = `<button class="btn btn-ghost" data-action="open-workout" data-id="${lastWorkout.id}">Открыть результат</button>
      <button class="btn btn-primary" data-action="start-workout" data-day="${day.id}">Начать снова</button>`;
  } else {
    actionsHtml = `<button class="btn btn-primary btn-block" data-action="start-workout" data-day="${day.id}">Начать тренировку</button>`;
  }

  return `<div class="day-card day-card-${day.color || 'blue'}">
    <div class="day-card-header">
      <div class="day-card-heading">
        <div class="day-card-title">${escapeHtml(day.name)}</div>
        <div class="day-card-focus">${escapeHtml(day.focus || '')}</div>
      </div>
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
      <div>
        <h2 class="section-title">${escapeHtml(w.dayName)} — ${escapeHtml(w.focus || '')}</h2>
        <div class="muted small">Начата: ${fmtDateTime(w.startedAt)}</div>
      </div>
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

  let setsHtml = '';
  ex.sets.forEach((s, i) => {
    let weightInput = '';
    if (isKg && !ex.noWeight && ex.perSetWeight){
      weightInput = `<label class="set-input-group">
        <input type="number" min="0" step="0.5" class="input input-sm"
          data-field="weight" data-ex="${idx}" data-set="${i}" value="${escapeHtml(s.weight || '')}"
          inputmode="decimal" placeholder="—">
        <span class="unit">кг</span>
      </label>`;
    }
    setsHtml += `<div class="set-row">
      <div class="set-label">Подход ${i + 1}</div>
      <div class="set-inputs">
        ${weightInput}
        <label class="set-input-group">
          <input type="number" min="0" step="1" class="input input-sm"
            data-field="reps" data-ex="${idx}" data-set="${i}" value="${escapeHtml(s.reps || '')}"
            inputmode="numeric" placeholder="—">
          <span class="unit">${unitLabel}</span>
        </label>
      </div>
    </div>`;
  });

  return `<div class="exercise-card">
    <div class="exercise-header">
      <div class="exercise-name">${escapeHtml(ex.name)}</div>
      <div class="exercise-plan">План: ${ex.plannedSets} × ${escapeHtml(ex.plannedReps)}${ex.unit === 'sec' ? ' сек' : ''}</div>
      ${ex.note ? `<div class="exercise-note">${escapeHtml(ex.note)}</div>` : ''}
    </div>
    ${isKg ? `<div class="exercise-controls">
      <label class="check"><input type="checkbox" data-action="toggle-no-weight" data-ex="${idx}" ${ex.noWeight ? 'checked' : ''}> Без веса</label>
      <label class="check"><input type="checkbox" data-action="toggle-per-set-weight" data-ex="${idx}" ${ex.perSetWeight ? 'checked' : ''} ${ex.noWeight ? 'disabled' : ''}> Разные веса по подходам</label>
    </div>` : ''}
    ${showSingleWeight ? `<div class="exercise-weight">
      <span class="weight-label">Рабочий вес:</span>
      <label class="weight-input-wrap">
        <input type="number" min="0" step="0.5" class="input" data-field="weight" data-ex="${idx}"
          value="${escapeHtml(ex.weight || '')}" inputmode="decimal" placeholder="—" style="max-width:110px">
        <span class="unit">кг</span>
      </label>
    </div>` : ''}
    <div class="sets">${setsHtml}</div>
    <div class="exercise-comment">
      <label class="field-inline"><span class="weight-label">Комментарий:</span>
        <input type="text" class="input" data-field="comment" data-ex="${idx}"
          value="${escapeHtml(ex.comment || '')}" placeholder="необязательно"></label>
    </div>
  </div>`;
}

/* ==================== ИСТОРИЯ ==================== */
function renderHistory(){
  const history = [...state.data.history].sort((a, b) => new Date(b.date) - new Date(a.date));
  const f = state.params.historyFilter || { q:'', from:'', to:'' };
  let filtered = history;
  if (f.q){
    const q = f.q.toLowerCase();
    filtered = filtered.filter(w => w.exercises.some(ex => ex.name.toLowerCase().includes(q)));
  }
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
    <div class="section-header-row">
      <h2 class="section-title">История тренировок</h2>
      <button class="btn btn-ghost" data-action="nav" data-view="home">На главный экран</button>
    </div>
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
      <div class="history-ex-name">
        ${escapeHtml(ex.name)}
        <button class="ex-link" data-action="open-exercise-history" data-name="${escapeHtml(ex.name)}">Прогресс</button>
      </div>
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
    <div class="section-actions">
      <button class="btn btn-danger" data-action="delete-workout" data-id="${w.id}">Удалить тренировку</button>
    </div>
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
        <label class="field-inline"><span class="weight-label">Комментарий:</span>
          <input type="text" class="input" data-field="he-comment" data-ex="${i}" value="${escapeHtml(ex.comment || '')}"></label>
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
    <div class="section-header-row">
      <h2 class="section-title">Прогресс: ${escapeHtml(name)}</h2>
      <button class="btn btn-ghost" data-action="nav" data-view="history">К истории</button>
    </div>
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
    ${dots}${xLabels}
    <text x="${P}" y="16" font-size="12" fill="#687586">${escapeHtml(title)}</text>
  </svg>`;
}

/* ==================== РЕДАКТОР ПРОГРАММЫ ==================== */
function renderEdit(){
  const d = state.editDraft;
  if (!d) return emptyState('Редактор не загружен', 'Вернитесь на главную и откройте редактор заново.', 'home');

  let html = '';
  if (state.editMode === 'new'){
    html += `<div class="edit-banner">Режим: <strong>новая программа</strong>. Текущая программа будет сохранена в архив, история тренировок не изменится.</div>`;
  }
  if (state.uploadImage){
    html += `<details class="image-ref" open><summary>Фото новой программы (для сверки)</summary>
      <img src="${state.uploadImage}" alt="Загруженное фото программы"></details>`;
  }

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
        <label class="field"><span>Название программы</span>
          <input class="input" data-field="program-name" value="${escapeHtml(d.name || '')}"></label>
        <label class="field"><span>Подзаголовок</span>
          <input class="input" data-field="program-subtitle" value="${escapeHtml(d.subtitle || '')}"></label>
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

  html += `<button class="btn btn-ghost" data-action="add-day">+ Добавить тренировочный день</button>
    </div></section>`;
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
    <div class="section-header-row">
      <h2 class="section-title">Загрузить новую программу</h2>
      <button class="btn btn-ghost" data-action="nav" data-view="home">На главный экран</button>
    </div>
    <div class="upload-box">
      <p>Выберите фотографию или изображение программы со своего устройства.</p>
      <input type="file" accept="image/*" id="programImage" class="input" style="max-width:360px;margin:0 auto">
      <p class="muted small" style="margin-top:.8rem">
        Автоматическое распознавание фото без внешнего платного API невозможно, поэтому после загрузки
        вы заполните структуру вручную — форма откроется с текущей программой как основой.
        Это честно и безопасно: ничего не заменится без вашего подтверждения.
      </p>
    </div>`;
  if (state.uploadImage){
    html += `<div class="upload-preview"><img src="${state.uploadImage}" alt="Предпросмотр"></div>`;
    html += `<div class="section-actions">
      <button class="btn btn-primary" data-action="start-new-program">Заполнить программу по фото</button>
      <button class="btn btn-ghost" data-action="clear-upload-image">Убрать фото</button>
    </div>`;
  }
  html += `<p class="muted small" style="margin-top:1rem">Старая программа будет сохранена в архиве. История выполненных тренировок не пострадает.</p>
  </section>`;
  return html;
}

/* ==================== РЕЗЕРВНАЯ КОПИЯ ==================== */
function renderBackup(){
  return `<section class="section">
    <div class="section-header-row">
      <h2 class="section-title">Резервная копия</h2>
      <button class="btn btn-ghost" data-action="nav" data-view="home">На главный экран</button>
    </div>
    <div class="banner banner-warn">
      <div>Данные хранятся в этом браузере. Очистка кэша или смена устройства приведут к потере. Регулярно делайте резервную копию.</div>
    </div>
    <div class="backup-grid">
      <div class="backup-card">
        <h3>Экспорт</h3>
        <p class="muted">Скачать программу, историю и настройки в JSON-файл.</p>
        <button class="btn btn-primary" data-action="export">Скачать резервную копию</button>
      </div>
      <div class="backup-card">
        <h3>Импорт</h3>
        <p class="muted">Загрузить ранее сохранённый JSON. Перед заменой данных будет предпросмотр.</p>
        <input type="file" accept="application/json,.json" id="importFile" class="input">
        <div id="importPreview"></div>
      </div>
    </div>
    <div class="backup-card" style="margin-top:1rem">
      <h3>Опасная зона</h3>
      <p class="muted">Полностью удалить все данные приложения из этого браузера.</p>
      <button class="btn btn-danger" data-action="reset-all">Сбросить все данные</button>
    </div>
  </section>`;
}

/* ==================== ПУСТОЕ СОСТОЯНИЕ ==================== */
function emptyState(title, text, backView){
  return `<div class="empty-state" style="margin-top:2rem">
    <div class="empty-title">${escapeHtml(title)}</div>
    <div class="empty-text">${escapeHtml(text)}</div>
    ${backView ? `<button class="btn btn-primary" data-action="nav" data-view="${backView}">Вернуться</button>` : ''}
  </div>`;
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
  if (state.data.activeWorkout){
    showToast('Уже есть незавершённая тренировка. Завершите или отмените её.', 'error'); return;
  }
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
  state.data.activeWorkout = {
    id: uid(), dayId: day.id, dayName: day.name, focus: day.focus,
    startedAt: new Date().toISOString(), exercises
  };
  saveData(); state.view = 'workout'; render();
  showToast('Тренировка начата', 'success');
}

async function finishWorkout(){
  const w = state.data.activeWorkout; if (!w) return;
  const skipped = w.exercises.filter(ex => !ex.sets.some(s => s.reps !== '' && s.reps != null));
  const partial = w.exercises.filter(ex => {
    const filled = ex.sets.filter(s => s.reps !== '' && s.reps != null).length;
    return filled > 0 && filled < ex.sets.length;
  });
  let html = `<h3>Завершить тренировку?</h3><div class="summary">`;
  w.exercises.forEach(ex => {
    const filled = ex.sets.filter(s => s.reps !== '' && s.reps != null).length;
    html += `<div class="summary-ex ${filled === 0 ? 'skipped' : ''}">
      <div class="summary-name">${escapeHtml(ex.name)}${filled === 0 ? '<span class="tag">пропущено</span>' : ''}</div>
      <div>${ex.sets.map(s => {
        const wgt = ex.unit === 'kg' && !ex.noWeight ? ((s.weight || ex.weight || '—') + ' кг × ') : '';
        return `<span class="summary-set">${wgt}${s.reps || '—'}${ex.unit === 'sec' ? ' сек' : ''}</span>`;
      }).join('')}</div></div>`;
  });
  html += `</div>`;
  if (skipped.length) html += `<p class="warn">Пропущено упражнений: ${skipped.length}. Они не попадут в историю как выполненные.</p>`;
  if (partial.length) html += `<p class="warn">Не полностью заполнено упражнений: ${partial.length}.</p>`;
  html += `<div class="modal-actions">
    <button class="btn btn-ghost" data-modal="cancel">Вернуться</button>
    <button class="btn btn-primary" data-modal="ok">Завершить и сохранить</button></div>`;

  const ok = await openModal(html);
  if (!ok) return;

  const exercises = w.exercises
    .filter(ex => ex.sets.some(s => s.reps !== '' && s.reps != null))
    .map(ex => ({
      exerciseId: ex.exerciseId, name: ex.name, unit: ex.unit, noWeight: ex.noWeight,
      comment: ex.comment || '',
      sets: ex.sets.map(s => ({
        weight: (ex.unit === 'kg' && !ex.noWeight) ? (ex.perSetWeight ? (s.weight || '') : (ex.weight || '')) : '',
        reps: s.reps
      })).filter(s => s.reps !== '' && s.reps != null)
    }));

  if (!exercises.length){ showToast('Нельзя завершить тренировку без единого выполненного упражнения', 'error'); return; }

  const record = {
    id: w.id, date: new Date().toISOString(), dayId: w.dayId,
    dayName: w.dayName, focus: w.focus, exercises, comment: ''
  };
  state.data.history.push(record);
  state.data.activeWorkout = null;
  saveData();
  state.view = 'history-detail'; state.params = { id: record.id }; render();
  showToast('Тренировка сохранена в историю', 'success');
}

async function discardWorkout(){
  const ok = await confirmDialog('Отменить тренировку?', 'Введённые результаты будут потеряны.', 'Отменить тренировку', true);
  if (!ok) return;
  state.data.activeWorkout = null; saveData(); state.view = 'home'; render();
}

async function deleteWorkout(id){
  const ok = await confirmDialog('Удалить тренировку?', 'Запись будет удалена из истории. Действие необратимо.', 'Удалить', true);
  if (!ok) return;
  state.data.history = state.data.history.filter(w => w.id !== id);
  saveData();
  if (state.view === 'history-detail'){ state.view = 'history'; state.params = {}; }
  render();
  showToast('Запись удалена', 'success');
}

/* ==================== РЕДАКТОР: ДЕЙСТВИЯ ==================== */
function openEditor(mode){
  state.editDraft = deepClone(state.data.program);
  ensureIds(state.editDraft);
  state.editMode = mode || 'current';
  state.view = 'edit'; render();
}

async function saveProgram(){
  const d = state.editDraft;
  if (!d) return;
  if (!d.name || !d.name.trim()){ showToast('Укажите название программы', 'error'); return; }
  if (!d.days.length){ showToast('Добавьте хотя бы один тренировочный день', 'error'); return; }
  for (const day of d.days){
    if (!day.name || !day.name.trim()){ showToast('У каждого дня должно быть название', 'error'); return; }
    if (!day.exercises.length){ showToast('В дне «' + day.name + '» нет упражнений', 'error'); return; }
  }

  if (state.editMode === 'new'){
    const ok = await confirmDialog('Заменить текущую программу?',
      'Текущая программа будет сохранена в архив. История тренировок останется без изменений.',
      'Заменить программу');
    if (!ok) return;
    state.data.programArchive.push({ program: deepClone(state.data.program), archivedAt: new Date().toISOString() });
    state.data.program = deepClone(d);
  } else {
    state.data.program = deepClone(d);
  }
  ensureIds(state.data.program);
  saveData();
  state.editDraft = null; state.uploadImage = null; state.editMode = 'current';
  state.view = 'home'; render();
  showToast('Программа сохранена', 'success');
}

function cancelEdit(){
  state.editDraft = null; state.uploadImage = null; state.editMode = 'current';
  state.view = 'home'; render();
}

/* ==================== ЭКСПОРТ/ИМПОРТ ==================== */
function exportBackup(){
  const data = {
    version: 1, exportedAt: new Date().toISOString(),
    app: 'training-diary',
    program: state.data.program,
    programArchive: state.data.programArchive,
    history: state.data.history,
    meta: state.data.meta
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'trenirovki-backup-' + toDateKey(new Date()) + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Резервная копия скачана', 'success');
}

function validateBackup(data){
  if (!data || typeof data !== 'object') return 'Файл не является объектом JSON.';
  if (!data.program || !Array.isArray(data.program.days)) return 'В файле нет программы тренировок.';
  if (!Array.isArray(data.history)) return 'В файле нет истории тренировок.';
  for (const day of data.program.days){
    if (!day.name || !Array.isArray(day.exercises)) return 'Повреждена структура тренировочного дня.';
    for (const ex of day.exercises){
      if (!ex.name || typeof ex.sets !== 'number') return 'Повреждена структура упражнения.';
    }
  }
  return null;
}

function handleImportFile(file){
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const err = validateBackup(data);
      if (err){ showToast('Ошибка импорта: ' + err, 'error'); return; }
      const preview = `
        <div class="import-preview">
          <div><strong>Файл:</strong> ${escapeHtml(file.name)}</div>
          <div><strong>Программа:</strong> ${escapeHtml(data.program.name || '—')} (${data.program.days.length} дней)</div>
          <div><strong>Записей истории:</strong> ${data.history.length}</div>
          <div><strong>Экспортирован:</strong> ${data.exportedAt ? fmtDateTime(data.exportedAt) : '—'}</div>
        </div>`;
      $('#importPreview').innerHTML = preview;
      askImportConfirmation(data);
    } catch(e){
      showToast('Не удалось прочитать файл: ' + e.message, 'error');
    }
  };
  reader.readAsText(file);
}

async function askImportConfirmation(data){
  const ok = await confirmDialog('Импортировать резервную копию?',
    'Текущая программа и вся история будут заменены данными из файла. Это действие необратимо. Продолжить?',
    'Импортировать');
  if (!ok) return;
  state.data.program = data.program;
  state.data.programArchive = data.programArchive || [];
  state.data.history = data.history;
  state.data.meta = data.meta || state.data.meta;
  ensureIds(state.data.program);
  state.data.activeWorkout = null;
  saveData();
  state.view = 'home'; render();
  showToast('Данные импортированы', 'success');
}

async function resetAll(){
  const ok = await confirmDialog('Сбросить все данные?',
    'Будут удалены программа, история и архив. Рекомендуется сначала экспортировать резервную копию. Продолжить?',
    'Удалить всё', true);
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

/* ==================== ОБРАБОТЧИКИ ==================== */
async function handleClick(e){
  const modalBtn = e.target.closest('[data-modal]');
  if (modalBtn){
    const v = modalBtn.dataset.modal;
    if (v === 'ok'){
      if (modalMode === 'prompt'){ const inp = $('#modalPromptInput'); closeModal(inp ? inp.value : null); }
      else closeModal(true);
    } else closeModal(modalMode === 'prompt' ? null : false);
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
    case 'start-workout': startWorkout(t.dataset.day); return;
    case 'resume-workout': state.view = 'workout'; render(); return;
    case 'discard-workout': discardWorkout(); return;
    case 'cancel-workout': discardWorkout(); return;
    case 'finish-workout': finishWorkout(); return;
    case 'open-workout': state.view = 'history-detail'; state.params = { id: t.dataset.id }; render(); return;
    case 'delete-workout': deleteWorkout(t.dataset.id); return;
    case 'open-exercise-history': state.view = 'exercise-history'; state.params = { name: t.dataset.name }; render(); return;
    case 'clear-history-filter': state.params.historyFilter = { q:'', from:'', to:'' }; render(); return;

    case 'add-day': {
      state.editDraft.days.push({ id: uid(), name: 'Новый день', focus: '', color: 'blue', exercises: [] });
      render(); return;
    }
    case 'remove-day': {
      const di = +t.dataset.day;
      const day = state.editDraft.days[di];
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
      const di = +t.dataset.day, ei = +t.dataset.ex;
      const ex = state.editDraft.days[di].exercises[ei];
      const ok = await confirmDialog('Удалить упражнение?', '«' + ex.name + '» будет удалено из черновика программы.', 'Удалить', true);
      if (!ok) return;
      state.editDraft.days[di].exercises.splice(ei, 1); render(); return;
    }
    case 'ex-up': {
      const di = +t.dataset.day, ei = +t.dataset.ex;
      if (ei === 0) return;
      const arr = state.editDraft.days[di].exercises;
      [arr[ei-1], arr[ei]] = [arr[ei], arr[ei-1]]; render(); return;
    }
    case 'ex-down': {
      const di = +t.dataset.day, ei = +t.dataset.ex;
      const arr = state.editDraft.days[di].exercises;
      if (ei >= arr.length - 1) return;
      [arr[ei+1], arr[ei]] = [arr[ei], arr[ei+1]]; render(); return;
    }
    case 'save-program': saveProgram(); return;
    case 'cancel-edit': cancelEdit(); return;

    case 'start-new-program': {
      openEditor('new');
      return;
    }
    case 'clear-upload-image': state.uploadImage = null; render(); return;

    case 'export': exportBackup(); return;
    case 'reset-all': resetAll(); return;

    case 'edit-history': {
      const w = state.data.history.find(x => x.id === t.dataset.id);
      if (!w) return;
      state.historyDraft = deepClone(w);
      state.view = 'history-edit'; state.params = { id: w.id }; render(); return;
    }
    case 'cancel-edit-history': state.historyDraft = null; state.view = 'history-detail'; render(); return;
    case 'save-edit-history': saveHistoryEdit(); return;
  }
}

function saveHistoryEdit(){
  const d = state.historyDraft; if (!d) return;
  const idx = state.data.history.findIndex(x => x.id === d.id);
  if (idx === -1){ showToast('Запись не найдена', 'error'); return; }
  state.data.history[idx] = d;
  saveData();
  state.historyDraft = null;
  state.view = 'history-detail'; state.params = { id: d.id }; render();
  showToast('Запись обновлена', 'success');
}

function handleInput(e){
  const t = e.target;
  const f = t.getAttribute && t.getAttribute('data-field');
  if (!f) return;

  /* Тренировка */
  if (f === 'weight' && t.dataset.ex != null){
    const w = state.data.activeWorkout; if (!w) return;
    const ex = w.exercises[+t.dataset.ex];
    if (t.dataset.set != null){
      ex.sets[+t.dataset.set].weight = t.value;
    } else {
      ex.weight = t.value;
      if (!ex.perSetWeight) ex.sets.forEach(s => { s.weight = t.value; });
    }
    saveDebounced(); return;
  }
  if (f === 'reps' && t.dataset.ex != null){
    const w = state.data.activeWorkout; if (!w) return;
    w.exercises[+t.dataset.ex].sets[+t.dataset.set].reps = t.value;
    saveDebounced(); return;
  }
  if (f === 'comment' && t.dataset.ex != null){
    const w = state.data.activeWorkout; if (!w) return;
    w.exercises[+t.dataset.ex].comment = t.value;
    saveDebounced(); return;
  }

  /* Редактор */
  if (f === 'program-name' || f === 'program-subtitle' || f.startsWith('day-') || f.startsWith('ex-')){
    if (state.editDraft){ commitEditDraftFromInput(t); return; }
  }

  /* Фильтр истории */
  if (f === 'history-q' || f === 'history-from' || f === 'history-to'){
    state.params.historyFilter = state.params.historyFilter || { q:'', from:'', to:'' };
    state.params.historyFilter[f.replace('history-', '')] = t.value;
    renderPreserveFocus(); return;
  }

  /* Редактирование истории */
  if (state.historyDraft){
    const di = t.dataset.ex != null ? +t.dataset.ex : null;
    if (di == null) return;
    const ex = state.historyDraft.exercises[di];
    if (f === 'he-weight') ex.sets[+t.dataset.set].weight = t.value;
    else if (f === 'he-reps') ex.sets[+t.dataset.set].reps = t.value;
    else if (f === 'he-comment') ex.comment = t.value;
  }
}

function handleChange(e){
  const t = e.target;
  const action = t.getAttribute && t.getAttribute('data-action');
  if (!action) {
    if (t.id === 'importFile'){ const f = t.files[0]; if (f) handleImportFile(f); }
    else if (t.id === 'programImage'){
      const f = t.files[0];
      if (f){
        const r = new FileReader();
        r.onload = () => { state.uploadImage = r.result; render(); };
        r.readAsDataURL(f);
      }
    }
    return;
  }
  if (action === 'toggle-no-weight'){
    const w = state.data.activeWorkout; if (!w) return;
    const ex = w.exercises[+t.dataset.ex];
    ex.noWeight = t.checked;
    if (t.checked) ex.perSetWeight = false;
    saveData(); render(); return;
  }
  if (action === 'toggle-per-set-weight'){
    const w = state.data.activeWorkout; if (!w) return;
    const ex = w.exercises[+t.dataset.ex];
    ex.perSetWeight = t.checked;
    if (t.checked){
      const v = ex.weight || ex.sets[0]?.weight || '';
      ex.sets.forEach(s => { if (!s.weight) s.weight = v; });
    }
    saveData(); render(); return;
  }
}

/* ==================== СТАРТ ==================== */
function init(){
  initData();
  document.addEventListener('click', handleClick);
  document.addEventListener('input', handleInput);
  document.addEventListener('change', handleChange);
  render();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')){
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
}

init();