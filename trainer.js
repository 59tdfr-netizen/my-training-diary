'use strict';

/* ============================================================
   ТРЕНЕР
   Инвентарь → адаптация программы, прогрессия нагрузок,
   недельный объём по группам мышц и настройки AI.
   ============================================================ */

function normalizeInventory(raw){
  const src = (raw && typeof raw === 'object') ? raw : {};
  const allowed = EQUIPMENT.filter(e => !e.always).map(e => e.id);
  const items = Array.isArray(src.items)
    ? src.items.filter(id => allowed.includes(id))
    : ['dumbbells', 'kettlebell', 'band'];
  return {
    items: Array.from(new Set(items)),
    dumbbellMax: numOrEmpty(src.dumbbellMax)
  };
}

function inventoryItems(){
  return (state.data.inventory && state.data.inventory.items) || [];
}

function exEquipment(ex){
  if (Array.isArray(ex.equipment) && ex.equipment.length) return ex.equipment.slice();
  return inferExerciseMeta(ex.name).equipment;
}

function exMuscles(ex){
  if (Array.isArray(ex.muscles) && ex.muscles.length) return ex.muscles.slice();
  if (ex.muscle) return [ex.muscle];
  return inferExerciseMeta(ex.name).muscles;
}

function buildAdaptationPlan(){
  const available = inventoryItems();
  const plan = [];
  state.data.program.days.forEach(day => {
    const used = new Set(day.exercises.map(e => normalizeExerciseName(e.name)));
    day.exercises.forEach(ex => {
      const required = exEquipment(ex);
      const missing = required.filter(e => !available.includes(e));
      if (!missing.length) return;
      const replacement = findReplacementExercise(ex, available, used);
      if (replacement) used.add(normalizeExerciseName(replacement.name));
      plan.push({ dayId: day.id, dayName: day.name, ex, required, missing, replacement });
    });
  });
  return plan;
}

function findReplacementExercise(ex, available, used){
  const meta = { equipment: exEquipment(ex), muscles: exMuscles(ex), pattern: ex.pattern || inferExerciseMeta(ex.name).pattern || '' };
  const exName = normalizeExerciseName(ex.name);
  const candidates = EXERCISE_CATALOG.filter(c =>
    normalizeExerciseName(c.name) !== exName &&
    !used.has(normalizeExerciseName(c.name)) &&
    equipmentSatisfied(c.equipment, available)
  );
  let best = null;
  let bestScore = -1;
  candidates.forEach(c => {
    let score = 0;
    if (c.pattern && meta.pattern && c.pattern === meta.pattern) score += 4;
    const overlap = c.muscles.filter(m => meta.muscles.includes(m)).length;
    score += overlap * 2;
    if (c.unit === (ex.unit || 'kg')) score += 1;
    if (c.equipment.length === meta.equipment.length) score += 1;
    if (score > bestScore || (score === bestScore && best && c.name.length < best.name.length)){
      best = c; bestScore = score;
    }
  });
  return bestScore >= 4 ? best : null;
}

function catalogExerciseToProgram(cat, id){
  return {
    id: id || uid(),
    name: cat.name,
    sets: cat.sets || 3,
    reps: cat.reps || '10',
    unit: cat.unit || 'reps',
    startWeight: cat.startWeight || '',
    note: cat.note || '',
    equipment: (cat.equipment || []).slice(),
    muscles: (cat.muscles || []).slice(),
    muscle: (cat.muscles || [])[0] || '',
    pattern: cat.pattern || ''
  };
}

async function applyAdaptationPlan(plan){
  const replaceable = plan.filter(item => item.replacement);
  if (!replaceable.length){
    showToast('Нет упражнений, которые можно заменить автоматически', 'error');
    return;
  }
  const ok = await confirmDialog(
    'Адаптировать программу?',
    'Будет заменено упражнений: ' + replaceable.length + '. Текущая программа уйдёт в архив, история тренировок не изменится.',
    'Адаптировать'
  );
  if (!ok) return;
  const draft = deepClone(state.data.program);
  replaceable.forEach(item => {
    const day = draft.days.find(d => d.id === item.dayId);
    if (!day) return;
    const idx = day.exercises.findIndex(e => e.id === item.ex.id);
    if (idx === -1) return;
    day.exercises[idx] = catalogExerciseToProgram(item.replacement);
  });
  state.data.programArchive.push({ program: deepClone(state.data.program), archivedAt: new Date().toISOString() });
  state.data.program = draft;
  ensureIds(state.data.program);
  enrichProgramMetadata(state.data.program);
  saveData(); render();
  showToast('Программа адаптирована под ваш инвентарь', 'success');
}

/* ---------- Прогрессия ---------- */

function parseRepRange(reps){
  const nums = (String(reps || '').match(/\d+(?:[.,]\d+)?/g) || []).map(n => parseFloat(String(n).replace(',', '.')));
  if (!nums.length) return null;
  return { min: Math.min.apply(null, nums), max: Math.max.apply(null, nums) };
}

function exerciseRecords(ex){
  const targetName = normalizeExerciseName(ex.name);
  const records = [];
  state.data.history.forEach(w => {
    (w.exercises || []).forEach(h => {
      const sameId = ex.id && h.exerciseId === ex.id;
      const sameName = normalizeExerciseName(h.name) === targetName;
      if (!sameId && !sameName) return;
      const reps = (h.sets || []).map(s => parseFloat(String(s.reps).replace(',', '.'))).filter(n => isFinite(n));
      const weights = (h.sets || []).map(s => parseFloat(String(s.weight).replace(',', '.'))).filter(n => isFinite(n));
      records.push({
        date: w.date,
        sets: (h.sets || []).length,
        maxWeight: weights.length ? Math.max.apply(null, weights) : null,
        maxReps: reps.length ? Math.max.apply(null, reps) : null,
        minReps: reps.length ? Math.min.apply(null, reps) : null
      });
    });
  });
  return records.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function nextWeight(weight){
  const w = parseFloat(weight);
  if (!isFinite(w)) return null;
  const inc = w < 10 ? 1 : (w < 20 ? 2 : 2.5);
  return Math.round((w + inc) * 2) / 2;
}

function progressionFor(ex){
  const records = exerciseRecords(ex);
  const range = parseRepRange(ex.reps);
  if (!records.length){
    const unit = ex.unit || 'kg';
    if (unit === 'kg'){
      return {
        tone: 'start',
        suggest: ex.startWeight ? 'старт: ' + ex.startWeight + ' кг' : 'подберите рабочий вес',
        why: 'Нет истории — первая тренировка покажет рабочий вес.'
      };
    }
    if (unit === 'sec'){
      return { tone: 'start', suggest: 'цель: ' + ex.reps + ' сек', why: 'Нет истории — начните с комфортного времени и держите технику.' };
    }
    return { tone: 'start', suggest: 'цель: ' + ex.reps + ' повторов', why: 'Нет истории — начните с комфортного числа повторов.' };
  }
  const last = records[records.length - 1];
  const prev = records.length > 1 ? records[records.length - 2] : null;
  const lastTxt = (last.maxWeight != null ? last.maxWeight + ' кг' : 'свой вес') + (last.maxReps != null ? ' × ' + last.maxReps : '');
  const unit = ex.unit || 'kg';

  if (records.length >= 3){
    const trio = records.slice(-3);
    const sameWeight = trio.every(r => r.maxWeight === trio[0].maxWeight);
    const belowTop = range && trio.every(r => r.maxReps != null && r.maxReps < range.max);
    if (sameWeight && belowTop){
      const deload = last.maxWeight != null ? Math.max(0.5, Math.round(last.maxWeight * 0.9 * 2) / 2) : null;
      return {
        tone: 'deload',
        suggest: deload != null ? 'разгрузка до ' + deload + ' кг' : 'разгрузка на −10%',
        why: 'Три тренировки без прогресса: вес ' + (last.maxWeight != null ? last.maxWeight + ' кг' : 'тот же') + ', повторы не растут. Лучше снизить вес и отработать технику, чем застрять.'
      };
    }
  }

  if (unit === 'sec'){
    if (last.maxReps != null && range && last.maxReps >= range.max){
      return { tone: 'up', suggest: 'цель: ' + (last.maxReps + 5) + ' сек', why: 'Верх диапазона взят — добавьте 5 секунд.' };
    }
    return { tone: 'hold', suggest: 'цель: ' + (range ? range.min + '–' + range.max : 'как в плане') + ' сек', why: 'Держите форму, дыхание ровное.' };
  }

  if (unit === 'reps'){
    if (range && last.maxReps != null && last.maxReps >= range.max){
      return { tone: 'up', suggest: 'добавьте 1–2 повтора', why: 'Верх диапазона взят — усложняйте движение (медленнее, амплитуднее, сложнее вариант).' };
    }
    return { tone: 'hold', suggest: 'цель: ' + (range ? range.min + '–' + range.max : 'как в плане') + ' повторов', why: 'Стабильно дойдите до верхней границы во всех подходах.' };
  }

  const rangeDone = range && last.maxReps != null && last.maxReps >= range.max;
  if (rangeDone){
    const nw = nextWeight(last.maxWeight);
    if (nw != null){
      if (prev && prev.maxWeight === last.maxWeight){
        return { tone: 'up', suggest: 'рабочий вес ' + nw + ' кг', why: 'Вес ' + last.maxWeight + ' кг уже взят на верх повторов дважды — пора прибавлять.' };
      }
      return { tone: 'up', suggest: 'вес ' + nw + ' кг в следующий раз', why: 'Все подходы на верхней границе повторений — по правилу двойной прогрессии добавляем вес.' };
    }
  }
  if (last.minReps != null && range && last.minReps < range.min){
    return { tone: 'hold', suggest: 'вес ' + (last.maxWeight != null ? last.maxWeight + ' кг' : 'как сейчас') + ', доберите повторы', why: 'Не все подходы дотянули до нижней границы. Вес не повышаем, пока не выполним план.' };
  }
  return { tone: 'hold', suggest: 'вес ' + (last.maxWeight != null ? last.maxWeight + ' кг' : 'как сейчас') + ', +1 повтор', why: 'Повторы ещё есть в запасе — добавляйте по одному.' };
}

function renderProgressionRow(ex){
  const p = progressionFor(ex);
  return `<div class="prog-row">
    <div class="prog-main">
      <div class="prog-name">${escapeHtml(ex.name)}</div>
      <div class="muted small">план ${ex.sets} × ${escapeHtml(ex.reps)}${ex.unit === 'sec' ? ' сек' : ''}</div>
    </div>
    <div class="prog-side">
      <div class="prog-suggest tone-${p.tone}">${escapeHtml(p.suggest)}</div>
      <div class="muted small prog-why">${escapeHtml(p.why)}</div>
    </div>
  </div>`;
}

/* ---------- Объём ---------- */

function exerciseMetaById(exerciseId, name){
  for (const day of state.data.program.days){
    const found = (day.exercises || []).find(e => e.id === exerciseId);
    if (found) return { muscles: exMuscles(found), name: found.name };
  }
  const byName = state.data.program.days.reduce((acc, day) => {
    if (acc) return acc;
    return (day.exercises || []).find(e => normalizeExerciseName(e.name) === normalizeExerciseName(name)) || null;
  }, null);
  if (byName) return { muscles: exMuscles(byName), name: byName.name };
  return { muscles: inferExerciseMeta(name).muscles, name: name };
}

function weeklyVolume(){
  const since = addDays(new Date(), -7);
  const counts = {};
  state.data.history.forEach(w => {
    if (new Date(w.date) < since) return;
    (w.exercises || []).forEach(h => {
      const sets = (h.sets || []).length;
      if (!sets) return;
      const meta = exerciseMetaById(h.exerciseId, h.name);
      const muscle = meta.muscles[0] || 'core';
      counts[muscle] = (counts[muscle] || 0) + sets;
    });
  });
  return counts;
}

function volumeStatus(count, target){
  if (!target) return 'none';
  if (count < target[0]) return 'low';
  if (count > target[1]) return 'high';
  return 'ok';
}

function renderVolumeCard(){
  const counts = weeklyVolume();
  const totalSets = Object.keys(counts).reduce((sum, key) => sum + counts[key], 0);
  if (!totalSets){
    return `<div class="rules-card">
      <div class="section-header-row" style="margin-bottom:8px"><h3 style="margin:0">Объём за 7 дней</h3><span class="muted small">пока нет данных</span></div>
      <p class="muted" style="margin:0">Завершите тренировку — и здесь появится распределение подходов по группам мышц с подсказкой, где недобор.</p>
    </div>`;
  }
  const rows = MUSCLES.map(m => {
    const target = MUSCLE_TARGETS[m.id] || [0, 0];
    const count = counts[m.id] || 0;
    const status = volumeStatus(count, target);
    const width = Math.min(100, Math.round(count / Math.max(1, target[1] * 1.3) * 100));
    return `<div class="volume-row">
      <span class="volume-name">${m.label}</span>
      <div class="volume-bar"><i class="volume-${status}" style="width:${width}%"></i></div>
      <span class="volume-count muted small">${count} / ${target[0]}–${target[1]}</span>
    </div>`;
  }).join('');
  const lowGroups = MUSCLES.filter(m => volumeStatus(counts[m.id] || 0, MUSCLE_TARGETS[m.id] || [0, 0]) === 'low').length;
  return `<div class="rules-card">
    <div class="section-header-row" style="margin-bottom:8px">
      <h3 style="margin:0">Объём за 7 дней</h3>
      <span class="muted small">${lowGroups ? 'недобор в ' + lowGroups + ' группах' : 'все группы в норме или выше'}</span>
    </div>
    ${rows}
    <p class="muted small" style="margin:8px 0 0">Считаются выполненные подходы. Ориентиры — 10–20 подходов в неделю на крупные группы мышц. Если группа ниже нормы, добавьте 1–2 подхода или упражнение.</p>
  </div>`;
}

/* ---------- Инвентарь и адаптация ---------- */

function renderInventoryCard(){
  const inv = state.data.inventory;
  const checkboxes = EQUIPMENT.filter(e => !e.always).map(e => {
    const checked = inv.items.includes(e.id);
    return `<label class="equip-check"><input type="checkbox" data-field="inv-item" value="${e.id}" ${checked ? 'checked' : ''}> ${e.label}</label>`;
  }).join('');
  return `<div class="rules-card">
    <div class="section-header-row" style="margin-bottom:8px">
      <h3 style="margin:0">Мой инвентарь</h3>
      <span class="muted small">по нему подбираются упражнения</span>
    </div>
    <div class="equip-grid">${checkboxes}</div>
    <label class="field" style="max-width:240px;margin-top:10px"><span>Максимальный вес гантелей, кг</span>
      <input type="number" min="1" max="100" step="0.5" class="input" id="invDumbbellMax" value="${inv.dumbbellMax !== '' ? inv.dumbbellMax : ''}" placeholder="например, 12">
    </label>
    <div class="section-actions"><button class="btn btn-primary" data-action="save-inventory">Сохранить инвентарь</button></div>
  </div>`;
}

function renderAdaptationCard(){
  const plan = buildAdaptationPlan();
  if (!plan.length){
    return `<div class="rules-card">
      <div class="section-header-row" style="margin-bottom:8px"><h3 style="margin:0">Программа и инвентарь</h3><span class="status-badge status-done">Совпадают</span></div>
      <p class="muted" style="margin:0">Все упражнения программы можно выполнить с тем, что у вас есть. Если купили что-то новое — отметьте в инвентаре.</p>
    </div>`;
  }
  const rows = plan.map(item => {
    const need = item.missing.map(equipmentLabel).join(', ');
    return `<div class="adapt-row">
      <div class="adapt-main">
        <div class="adapt-name">${escapeHtml(item.ex.name)}</div>
        <div class="muted small">${escapeHtml(item.dayName)} • нужно: ${escapeHtml(need)}</div>
      </div>
      <div class="adapt-to">${item.replacement ? '→ ' + escapeHtml(item.replacement.name) : '<span class="muted">нет замены</span>'}</div>
    </div>`;
  }).join('');
  const replaceable = plan.filter(i => i.replacement).length;
  return `<div class="rules-card">
    <div class="section-header-row" style="margin-bottom:8px">
      <h3 style="margin:0">Программа и инвентарь</h3>
      <span class="status-badge status-in-progress">${plan.length} ${pluralRu(plan.length, 'упражнение', 'упражнения', 'упражнений')}</span>
    </div>
    <p class="muted small" style="margin:0 0 10px">Эти упражнения требуют оборудования, которого нет в инвентаре. Можно заменить их на похожие по движению и мышцам.</p>
    ${rows}
    <div class="section-actions">
      <button class="btn btn-primary" data-action="apply-adaptation" ${replaceable ? '' : 'disabled'}>Адаптировать программу</button>
      <button class="btn btn-ghost" data-action="nav" data-view="edit">Поправить вручную</button>
    </div>
  </div>`;
}

/* ---------- AI ---------- */

function renderAISettingsCard(){
  const ai = state.data.ai;
  const configured = aiConfigured();
  return `<div class="rules-card" id="aiCard">
    <div class="section-header-row" style="margin-bottom:8px">
      <h3 style="margin:0">AI-тренер</h3>
      <span class="status-badge ${configured ? 'status-done' : 'status-not-started'}">${configured ? 'подключён' : 'не подключён'}</span>
    </div>
    <p class="muted small" style="margin:0 0 10px">Анализ фото тела, блюд и умных весов работает через вашего провайдера. Приложение статическое, поэтому запросы идут из браузера напрямую. Ключ хранится только в localStorage этого браузера — не используйте общий компьютер.</p>
    <div class="form-grid">
      <label class="field"><span>Провайдер</span><select class="input" id="aiProvider">
        ${Object.keys(AI_PRESETS).map(id => `<option value="${id}" ${ai.provider === id ? 'selected' : ''}>${AI_PRESETS[id].label}</option>`).join('')}
      </select></label>
      <label class="field"><span>Base URL</span><input type="text" class="input" id="aiBaseUrl" value="${escapeHtml(ai.baseUrl)}" placeholder="https://api.openai.com/v1"></label>
      <label class="field"><span>Модель</span><input type="text" class="input" id="aiModel" value="${escapeHtml(ai.model)}" placeholder="gpt-4o-mini"></label>
      <label class="field"><span>API-ключ</span><input type="password" class="input" id="aiKey" value="${escapeHtml(ai.apiKey)}" placeholder="sk-…" autocomplete="off"></label>
    </div>
    <p class="muted small" style="margin:8px 0 0">Нужна модель с поддержкой изображений. Бесплатные варианты: Gemini Flash, Groq, бесплатные модели OpenRouter или Ollama на вашем компьютере.</p>
    <div class="free-models-row">
      <button class="btn btn-ghost btn-sm" data-action="find-free-models">Найти бесплатные vision-модели OpenRouter</button>
      <select class="input" id="aiModelPick">
        <option value="">— список появится после поиска —</option>
      </select>
    </div>
    <div class="section-actions">
      <button class="btn btn-primary" data-action="save-ai">Сохранить</button>
      <button class="btn btn-ghost" data-action="test-ai">Проверить подключение</button>
      ${ai.apiKey ? '<button class="btn btn-danger" data-action="clear-ai">Удалить ключ</button>' : ''}
    </div>
    ${configured ? `<p class="muted small" style="margin:8px 0 0">Ключ: ${escapeHtml(aiMaskKey(ai.apiKey))} • модель: ${escapeHtml(ai.model)}</p>` : ''}
    <details class="free-ai-help" style="margin-top:10px">
      <summary class="muted small" style="cursor:pointer">Бесплатные варианты: где взять ключ и что ввести</summary>
      <ul class="rules-list" style="margin-top:8px">
        <li><strong>Ollama — локально, без лимитов.</strong> Установите с <a href="https://ollama.com/download" target="_blank" rel="noopener">ollama.com</a>, выполните в терминале <code>ollama pull qwen3-vl:8b</code> и выберите провайдера «Ollama». Ключ не нужен — впишите любое слово, например <code>ollama</code>.</li>
        <li><strong>Google Gemini — бесплатный тариф.</strong> Ключ в <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">AI Studio</a>. Выберите «Google Gemini», модель <code>gemini-3.8-flash</code> или актуальную Flash из AI Studio. Лимиты видны в AI Studio; на бесплатном тарифе Google может использовать запросы для улучшения продуктов.</li>
        <li><strong>Groq — бесплатный тариф.</strong> Ключ в <a href="https://console.groq.com/keys" target="_blank" rel="noopener">консоли Groq</a>. Модель <code>qwen/qwen3.8-27b</code> понимает фото. Бесплатный план: 30 запросов/мин и 1000/день.</li>
        <li><strong>OpenRouter — бесплатные модели.</strong> Ключ на <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">openrouter.ai/keys</a>. Нажмите «Найти бесплатные vision-модели» — список загрузится из OpenRouter. Лимит бесплатных моделей: 20 запросов/мин и 50/день, после пополнения на $10 — 1000/день.</li>
      </ul>
      <p class="muted small" style="margin:8px 0 0">У OpenAI, Cerebras и Cloudflare Workers AI браузерные запросы блокируются CORS, GitHub Models закрыт. Если провайдер пишет «Failed to fetch» — обычно это CORS или неверный ключ.</p>
    </details>
    <p class="muted small" style="margin:8px 0 0">AI здесь — помощник: он не ставит диагнозов и не заменяет врача. Оценки по фото всегда приблизительные.</p>
  </div>`;
}

function renderTrainer(){
  const plan = buildAdaptationPlan();
  const hasHistory = state.data.history.length > 0;
  let html = `<section class="section">
    <div class="section-header-row">
      <h2 class="section-title">Тренер</h2>
      <button class="btn btn-ghost btn-sm" data-action="nav" data-view="home">На главную</button>
    </div>`;

  if (!hasHistory){
    html += `<div class="banner banner-info"><div><strong>Тренер включится после первой тренировки</strong><div class="muted small">Здесь появятся рекомендации по весам, анализ объёма и адаптация программы под инвентарь.</div></div>
      <div class="banner-actions"><button class="btn btn-primary" data-action="nav" data-view="home">Начать тренировку</button></div></div>`;
  }

  html += `<div class="rules-card">
    <div class="section-header-row" style="margin-bottom:8px"><h3 style="margin:0">Что делать на следующей тренировке</h3><span class="muted small">двойная прогрессия</span></div>`;

  if (!hasHistory){
    html += `<p class="muted" style="margin:0">Завершите тренировку — и здесь появится план по каждому упражнению: держать вес, добавить повтор или прибавить вес.</p>`;
  } else {
    state.data.program.days.forEach(day => {
      html += `<div class="trainer-day"><div class="trainer-day-title">${escapeHtml(day.name)} <span class="muted small">${escapeHtml(day.focus || '')}</span></div>`;
      day.exercises.forEach(ex => { html += renderProgressionRow(ex); });
      html += `</div>`;
    });
  }
  html += `</div>`;

  html += `<div style="margin-top:12px">${renderVolumeCard()}</div>`;
  html += `<div style="margin-top:12px">${renderInventoryCard()}</div>`;
  html += `<div style="margin-top:12px">${renderAdaptationCard()}</div>`;
  html += `<div style="margin-top:12px">${renderAISettingsCard()}</div>`;

  html += `<div class="rules-card" style="margin-top:12px">
    <h3 style="margin:0 0 8px">Где AI пригодится</h3>
    <ul class="rules-list">
      <li><strong>Фото тела</strong> — визуальные зоны внимания и упражнения. Раздел «Тело» → «Фото прогресса», кнопка «AI-разбор».</li>
      <li><strong>Фото блюда</strong> — оценка калорий. Раздел «Питание» → «AI-оценка блюда по фото».</li>
      <li><strong>Фото умных весов</strong> — распознавание веса и состава тела. Раздел «Тело» → форма измерения, «Разобрать фото весов».</li>
    </ul>
  </div>`;

  html += `</section>`;
  return html;
}

function renderTrainerHomeCard(){
  const hasHistory = state.data.history.length > 0;
  const next = typeof nextPlannedDay === 'function' ? nextPlannedDay() : null;
  const plan = buildAdaptationPlan();
  const tip = (hasHistory && next && next.exercises.length) ? progressionFor(next.exercises[0]) : null;
  const counts = weeklyVolume();
  const low = MUSCLES.filter(m => volumeStatus(counts[m.id] || 0, MUSCLE_TARGETS[m.id] || [0, 0]) === 'low');
  return `<article class="dash-card coach-card">
    <div class="card-top"><span class="eyebrow">Тренер</span><button class="link-btn" data-action="nav" data-view="trainer">Открыть</button></div>
    <h3>${hasHistory ? 'Совет на тренировку' : 'Первый шаг'}</h3>
    ${tip
      ? `<p class="coach-tip">${escapeHtml(tip.suggest)}</p><p class="muted small" style="margin:0">${escapeHtml(tip.why)}</p>`
      : '<p class="muted small" style="margin:0 0 4px">Завершите тренировку — появятся рекомендации по весам, объёму и заменам под инвентарь.</p>'}
    <div class="chip-row">
      ${plan.length ? `<span class="chip chip-warn">${plan.length} ${pluralRu(plan.length, 'упражнение', 'упражнения', 'упражнений')} под инвентарь</span>` : ''}
      ${hasHistory && low.length ? `<span class="chip">недобор: ${low.slice(0, 2).map(m => m.label.toLowerCase()).join(', ')}</span>` : ''}
    </div>
    <div class="card-actions"><button class="btn btn-soft btn-block" data-action="nav" data-view="trainer">${hasHistory ? 'План и объём' : 'Настроить инвентарь'}</button></div>
  </article>`;
}

/* ---------- Каталог упражнений ---------- */

function renderCatalogModal(dayIdx){
  const days = (state.view === 'edit' && state.editDraft) ? state.editDraft.days : state.data.program.days;
  const day = days[dayIdx];
  const available = inventoryItems();
  const rows = EXERCISE_CATALOG.map(cat => {
    const ok = equipmentSatisfied(cat.equipment, available);
    const need = cat.equipment.map(equipmentLabel).join(', ');
    return `<div class="catalog-row" data-name="${escapeHtml(cat.name.toLowerCase())}" data-available="${ok ? '1' : '0'}">
      <div class="catalog-main">
        <div class="catalog-name">${escapeHtml(cat.name)}</div>
        <div class="muted small">${cat.muscles.map(muscleLabel).join(' • ')}${need ? ' • нужно: ' + escapeHtml(need) : ' • без инвентаря'}</div>
      </div>
      <button class="btn btn-ghost btn-sm" data-action="add-catalog" data-cat="${cat.id}" data-day="${dayIdx}">Добавить</button>
    </div>`;
  }).join('');
  return `<h3>Добавить упражнение в «${escapeHtml(day ? day.name : 'день')}»</h3>
    <div class="filters" style="margin:8px 0;padding:8px">
      <input type="search" class="input" id="catalogSearch" placeholder="Поиск по названию">
      <label class="check"><input type="checkbox" id="catalogAvailable" checked> только доступные</label>
    </div>
    <div class="catalog-list" id="catalogList">${rows}</div>
    <div class="modal-actions"><button class="btn btn-ghost" data-modal="cancel">Закрыть</button></div>`;
}

function filterCatalogDom(){
  const search = document.getElementById('catalogSearch');
  const onlyAvail = document.getElementById('catalogAvailable');
  const list = document.getElementById('catalogList');
  if (!list) return;
  const q = search ? search.value.trim().toLowerCase() : '';
  Array.from(list.children).forEach(row => {
    const name = row.getAttribute('data-name') || '';
    const avail = row.getAttribute('data-available') === '1';
    const show = (!q || name.includes(q)) && (!onlyAvail || !onlyAvail.checked || avail);
    row.style.display = show ? '' : 'none';
  });
}
