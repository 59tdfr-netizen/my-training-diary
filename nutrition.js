'use strict';

/* ============================================================
   ПИТАНИЕ
   Дневник калорий и БЖУ: база продуктов, свои продукты, цели,
   график за две недели, экспорт CSV и AI-оценка блюда по фото.
   ============================================================ */

const NUT_TARGET_KEYS = ['kcal', 'protein', 'fat', 'carbs'];

function normalizeNutrition(raw){
  const src = (raw && typeof raw === 'object') ? raw : {};
  const targets = Object.assign({ kcal: '', protein: '', fat: '', carbs: '' }, src.targets || {});
  const entries = (Array.isArray(src.entries) ? src.entries : [])
    .filter(e => e && e.date)
    .map(e => {
      const per = (e.per && typeof e.per === 'object') ? e.per : {};
      return {
        id: e.id || uid(),
        date: String(e.date),
        meal: MEALS.some(m => m.id === e.meal) ? e.meal : 'snack',
        name: String(e.name || 'Приём пищи'),
        grams: numOrEmpty(e.grams),
        per: {
          kcal: numOrEmpty(per.kcal),
          p: numOrEmpty(per.p),
          f: numOrEmpty(per.f),
          c: numOrEmpty(per.c)
        },
        note: typeof e.note === 'string' ? e.note : ''
      };
    });
  const customFoods = (Array.isArray(src.customFoods) ? src.customFoods : [])
    .filter(f => f && f.name)
    .map(f => ({
      id: f.id || uid(),
      name: String(f.name),
      cat: 'Свои',
      kcal: numOrEmpty(f.kcal),
      p: numOrEmpty(f.p),
      f: numOrEmpty(f.f),
      c: numOrEmpty(f.c)
    }));
  return { targets, entries, customFoods };
}

function ensureNutritionDraft(){
  if (!state.nutritionDraft){
    state.nutritionDraft = { meal: 'breakfast', foodId: '', grams: '100' };
  }
  return state.nutritionDraft;
}

function nutritionDateKey(){
  return state.nutritionDate || toDateKey(new Date());
}

function fmtDateKey(key){
  const parts = String(key || '').split('-');
  return parts.length === 3 ? parts[2] + '.' + parts[1] + '.' + parts[0] : String(key || '');
}

function allFoods(){
  return FOODS.concat((state.data.nutrition && state.data.nutrition.customFoods) || []);
}

function foodAnyById(id){
  return allFoods().find(f => f.id === id) || null;
}

function nutritionTargets(){
  const manual = (state.data.nutrition && state.data.nutrition.targets) || {};
  const s = getBodySummary();
  const profile = state.data.body.profile;
  const weight = s.lastWeight ? s.lastWeight.value : null;
  const height = s.height;
  const auto = {};

  if (weight && height){
    const age = numOrEmpty(profile.age) || 30;
    const gender = profile.gender;
    const genderOffset = gender === 'male' ? 5 : (gender === 'female' ? -161 : -78);
    const bmr = 10 * weight + 6.25 * height - 5 * age + genderOffset;
    const factor = profile.activity === 'low' ? 1.3 : (profile.activity === 'high' ? 1.6 : 1.45);
    const maintenance = bmr * factor;
    const goal = numOrEmpty(profile.targetWeight);
    let adj = 0;
    if (goal && goal < weight - 0.5) adj = -0.15;
    else if (goal && goal > weight + 0.5) adj = 0.10;
    const kcalAuto = Math.max(1200, Math.round(maintenance * (1 + adj) / 10) * 10);
    const proteinWeight = goal && goal > 0 ? goal : weight;
    auto.kcal = kcalAuto;
    auto.protein = Math.round(1.6 * proteinWeight);
    auto.fat = Math.round(0.9 * proteinWeight);
    auto.carbs = Math.max(0, Math.round((kcalAuto - auto.protein * 4 - auto.fat * 9) / 4));
    auto.bmr = Math.round(bmr);
    auto.maintenance = Math.round(maintenance);
    auto.adj = adj;
    auto.weight = weight;
  }

  const manualNum = key => numOrEmpty(manual[key]);
  const pick = key => {
    const m = manualNum(key);
    return m !== '' ? m : (auto[key] != null ? auto[key] : '');
  };
  return {
    auto,
    kcal: pick('kcal'), protein: pick('protein'), fat: pick('fat'), carbs: pick('carbs')
  };
}

function entryTotals(entry){
  const grams = numOrEmpty(entry.grams) || 0;
  const per = entry.per || {};
  const k = numOrEmpty(per.kcal) || 0;
  const p = numOrEmpty(per.p) || 0;
  const f = numOrEmpty(per.f) || 0;
  const c = numOrEmpty(per.c) || 0;
  return {
    kcal: k * grams / 100,
    protein: p * grams / 100,
    fat: f * grams / 100,
    carbs: c * grams / 100
  };
}

function nutritionEntriesFor(key){
  const order = MEALS.map(m => m.id);
  return (state.data.nutrition.entries || [])
    .filter(e => e.date === key)
    .sort((a, b) => order.indexOf(a.meal) - order.indexOf(b.meal) || a.name.localeCompare(b.name, 'ru'));
}

function dayTotals(key){
  const totals = { kcal: 0, protein: 0, fat: 0, carbs: 0 };
  nutritionEntriesFor(key).forEach(e => {
    const t = entryTotals(e);
    totals.kcal += t.kcal; totals.protein += t.protein; totals.fat += t.fat; totals.carbs += t.carbs;
  });
  return totals;
}

function progressBar(value, target, color){
  const pct = target ? Math.min(100, Math.round(value / target * 100)) : 0;
  const over = target && value > target;
  return `<div class="progress ${over ? 'progress-over' : ''}"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>`;
}

function macroChips(totals, targets){
  return `<div class="ring-row diet-rings">
    ${ringCard({ value: totals.kcal, max: targets.kcal, color: '#7C5CFF', color2: '#EC4899', display: f0(totals.kcal), unit: 'ккал', title: 'Калории', sub: targets.kcal ? 'из ' + f0(targets.kcal) : 'цель не задана', size: 78 })}
    ${ringCard({ value: totals.protein, max: targets.protein, color: '#0FA97A', color2: '#34D399', display: f0(totals.protein), unit: 'г', title: 'Белки', sub: targets.protein ? 'из ' + f0(targets.protein) : 'цель не задана', size: 78 })}
    ${ringCard({ value: totals.fat, max: targets.fat, color: '#C2740A', color2: '#FBBF24', display: f0(totals.fat), unit: 'г', title: 'Жиры', sub: targets.fat ? 'из ' + f0(targets.fat) : 'цель не задана', size: 78 })}
    ${ringCard({ value: totals.carbs, max: targets.carbs, color: '#EC4899', color2: '#A855F7', display: f0(totals.carbs), unit: 'г', title: 'Углеводы', sub: targets.carbs ? 'из ' + f0(targets.carbs) : 'цель не задана', size: 78 })}
  </div>`;
}

function foodOptionsHtml(selectedId){
  const groups = {};
  allFoods().forEach(f => {
    const cat = f.cat || 'Другое';
    (groups[cat] = groups[cat] || []).push(f);
  });
  return Object.keys(groups).map(cat =>
    `<optgroup label="${escapeHtml(cat)}">${groups[cat].map(f =>
      `<option value="${escapeHtml(f.id)}" ${selectedId === f.id ? 'selected' : ''}>${escapeHtml(f.name)} — ${f0(f.kcal)} ккал/100 г</option>`
    ).join('')}</optgroup>`
  ).join('');
}

function nutritionChartHtml(){
  const days = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--){
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    const totals = dayTotals(key);
    if (totals.kcal > 0) days.push({ date: dateKeyToNoonIso(key), value: Math.round(totals.kcal) });
  }
  const targets = nutritionTargets();
  if (!days.length) return '';
  return renderBodyChart({
    title: 'Калории по дням, ккал',
    series: [{ label: 'Съедено', color: '#7C5CFF', points: days }],
    hlines: targets.kcal ? [{ value: targets.kcal, label: 'цель ' + f0(targets.kcal) + ' ккал', color: '#C2740A' }] : []
  });
}

function renderNutrition(){
  const key = nutritionDateKey();
  const targets = nutritionTargets();
  const totals = dayTotals(key);
  const entries = nutritionEntriesFor(key);
  const draft = ensureNutritionDraft();
  const selectedFood = draft.foodId ? foodAnyById(draft.foodId) : null;
  const aiReady = aiConfigured();
  const profile = state.data.body.profile;
  const missingProfile = [];
  if (!profile.gender) missingProfile.push('пол');
  if (numOrEmpty(profile.age) === '') missingProfile.push('возраст');
  const genderHint = missingProfile.length
    ? ' Не указан(ы): ' + missingProfile.join(', ') + ' — используются средние значения, расчёт менее точный.'
    : '';
  const todayKey = toDateKey(new Date());
  const remaining = targets.kcal ? targets.kcal - totals.kcal : null;
  const byMeal = {};
  entries.forEach(e => { (byMeal[e.meal] = byMeal[e.meal] || []).push(e); });

  let html = `<section class="section">
    <div class="section-header-row">
      <h2 class="section-title">Питание</h2>
      <div class="filters" style="margin:0;padding:6px 8px">
        <button class="btn btn-ghost btn-sm" data-action="nut-prev">←</button>
        <input type="date" class="input input-sm" data-field="nut-date" value="${escapeHtml(key)}" style="max-width:160px">
        <button class="btn btn-ghost btn-sm" data-action="nut-next">→</button>
        <button class="btn btn-ghost btn-sm" data-action="nut-today">Сегодня</button>
        <button class="btn btn-ghost btn-sm" data-action="nut-export">CSV</button>
      </div>
    </div>`;

  if (!targets.kcal){
    html += `<div class="banner banner-warn"><div><strong>Не рассчитаны цели по калориям</strong>
      <div class="muted small">Добавьте вес в разделе «Тело» и рост в профиле — цели посчитаются автоматически. Или задайте их вручную ниже.</div></div>
      <div class="banner-actions"><button class="btn btn-primary" data-action="nav" data-view="body">К весу</button></div></div>`;
  }

  html += `<div class="rules-card">
    <div class="section-header-row" style="margin-bottom:8px">
      <h3 style="margin:0">Итого за ${fmtDateKey(key)}</h3>
      <span class="muted small">${remaining != null ? (remaining >= 0 ? 'осталось ' + f0(remaining) + ' ккал' : 'перебор ' + f0(-remaining) + ' ккал') : ''}</span>
    </div>
    ${macroChips(totals, targets)}
    ${targets.auto && targets.auto.bmr ? `<p class="muted small" style="margin:8px 0 0">Базовый обмен ≈ ${f0(targets.auto.bmr)} ккал, поддержка ≈ ${f0(targets.auto.maintenance)} ккал${targets.auto.adj < 0 ? ', дефицит 15%' : (targets.auto.adj > 0 ? ', профицит 10%' : '')}. Белок 1,6 г/кг, жиры 0,9 г/кг.${genderHint}</p>` : ''}
  </div>`;

  html += `<div class="rules-card" style="margin-top:12px">
    <h3 style="margin:0 0 8px">Добавить продукт</h3>
    <div class="form-grid">
      <label class="field"><span>Приём пищи</span><select class="input" data-field="nut-meal">
        ${MEALS.map(m => `<option value="${m.id}" ${draft.meal === m.id ? 'selected' : ''}>${m.label}</option>`).join('')}
      </select></label>
      <label class="field" style="grid-column:span 2"><span>Продукт</span><select class="input" data-field="nut-food">
        <option value="">— выберите продукт —</option>
        ${foodOptionsHtml(draft.foodId)}
      </select></label>
      <label class="field"><span>Порция, г</span><input type="number" min="1" max="3000" inputmode="numeric" class="input" data-field="nut-grams" value="${escapeHtml(draft.grams || '100')}"></label>
    </div>
    ${selectedFood ? `<p class="muted small" style="margin:8px 0 0">${escapeHtml(selectedFood.name)}: ${f0(selectedFood.kcal)} ккал • Б ${f1(selectedFood.p)} • Ж ${f1(selectedFood.f)} • У ${f1(selectedFood.c)} на 100 г</p>` : ''}
    <div class="section-actions">
      <button class="btn btn-primary" data-action="nut-add">Добавить</button>
    </div>
    <details style="margin-top:10px">
      <summary class="muted small" style="cursor:pointer">Своего продукта нет в базе? Добавить</summary>
      <div class="form-grid" style="margin-top:10px">
        <label class="field" style="grid-column:span 2"><span>Название</span><input type="text" class="input" id="customFoodName" placeholder="например, домашняя запеканка"></label>
        <label class="field"><span>Ккал / 100 г</span><input type="number" min="0" max="900" class="input" id="customFoodKcal" placeholder="—"></label>
        <label class="field"><span>Белки / 100 г</span><input type="number" min="0" max="100" step="0.1" class="input" id="customFoodP" placeholder="—"></label>
        <label class="field"><span>Жиры / 100 г</span><input type="number" min="0" max="100" step="0.1" class="input" id="customFoodF" placeholder="—"></label>
        <label class="field"><span>Углеводы / 100 г</span><input type="number" min="0" max="100" step="0.1" class="input" id="customFoodC" placeholder="—"></label>
      </div>
      <div class="section-actions"><button class="btn btn-ghost" data-action="nut-custom-add">Сохранить продукт</button></div>
    </details>
  </div>`;

  html += `<div class="rules-card" style="margin-top:12px">
    <h3 style="margin:0 0 4px">AI-оценка блюда по фото</h3>
    <p class="muted small" style="margin:0 0 10px">${aiReady ? 'Сфотографируйте тарелку — модель оценит состав и калории. Результат можно сразу добавить в дневник и потом поправить.' : 'Требуется подключить API-ключ в разделе «Тренер» → «AI-тренер». Без ключа пользуйтесь базой продуктов выше — это точнее.'}</p>
    <div class="section-actions" style="margin-top:0">
      <label class="btn btn-ghost ${aiReady ? '' : 'btn-disabled'}" style="cursor:pointer">
        Оценить фото блюда
        <input type="file" id="dishFile" accept="image/*" capture="environment" hidden ${aiReady ? '' : 'disabled'}>
      </label>
    </div>
    ${state.aiDish ? renderDishAI(state.aiDish) : ''}
  </div>`;

  html += `<div class="section" style="margin-top:16px">
    <h2 class="section-title">Что съедено</h2>`;

  if (!entries.length){
    html += `<div class="empty-state"><div class="empty-title">За эту дату записей нет</div><div class="empty-text">Добавьте продукт в форме выше — калории и БЖУ посчитаются автоматически.</div></div>`;
  } else {
    MEALS.forEach(meal => {
      const list = byMeal[meal.id];
      if (!list || !list.length) return;
      const mealTotals = list.reduce((acc, e) => {
        const t = entryTotals(e);
        acc.kcal += t.kcal; acc.protein += t.protein; acc.fat += t.fat; acc.carbs += t.carbs;
        return acc;
      }, { kcal: 0, protein: 0, fat: 0, carbs: 0 });
      html += `<div class="meal-block">
        <div class="meal-head"><strong>${meal.label}</strong><span class="muted small">${f0(mealTotals.kcal)} ккал • Б ${f1(mealTotals.protein)} • Ж ${f1(mealTotals.fat)} • У ${f1(mealTotals.carbs)}</span></div>
        ${list.map(e => {
          const t = entryTotals(e);
          return `<div class="food-row">
            <div class="food-main">
              <div class="food-name">${escapeHtml(e.name)}</div>
              <div class="muted small">${f0(t.kcal)} ккал • Б ${f1(t.protein)} • Ж ${f1(t.fat)} • У ${f1(t.carbs)}</div>
            </div>
            <div class="food-grams">
              <input type="number" min="1" max="3000" class="input input-sm" data-field="nut-entry-grams" data-id="${e.id}" value="${escapeHtml(e.grams)}">
              <span class="unit">г</span>
            </div>
            <button class="btn btn-danger btn-sm" data-action="nut-delete" data-id="${e.id}" title="Удалить">×</button>
          </div>`;
        }).join('')}
      </div>`;
    });
  }
  html += `</div>`;

  const threshold = Math.round(targets.kcal * 0.15);
  html += `<div class="rules-card" style="margin-top:12px">
    <h3 style="margin:0 0 8px">Цели КБЖУ</h3>
    <div class="form-grid">
      <label class="field"><span>Калории</span><input type="number" min="0" max="6000" class="input" id="nutTargetKcal" value="${targets.kcal || ''}" placeholder="авто"></label>
      <label class="field"><span>Белки, г</span><input type="number" min="0" max="400" class="input" id="nutTargetProtein" value="${targets.protein || ''}" placeholder="авто"></label>
      <label class="field"><span>Жиры, г</span><input type="number" min="0" max="300" class="input" id="nutTargetFat" value="${targets.fat || ''}" placeholder="авто"></label>
      <label class="field"><span>Углеводы, г</span><input type="number" min="0" max="700" class="input" id="nutTargetCarbs" value="${targets.carbs || ''}" placeholder="авто"></label>
    </div>
    <p class="muted small" style="margin:8px 0 0">Оставьте поля пустыми, чтобы считать автоматически. Значения КБЖУ в базе ориентировочные (±10–15%), это нормально для дневника.</p>
    <div class="section-actions"><button class="btn btn-ghost" data-action="nut-save-targets">Сохранить цели</button></div>
  </div>`;

  const chart = nutritionChartHtml();
  if (chart){
    html += `<div class="section" style="margin-top:16px"><h2 class="section-title">Динамика калорий</h2>${chart}</div>`;
  }

  html += `<p class="muted small">${threshold ? 'Ориентир: белок и овощи в каждый приём пищи. Резкий дефицит больше 25% замедляет прогресс и повышает риск срывов.' : ''}</p>`;
  html += `</section>`;
  return html;
}

function renderDishAI(dish){
  const items = Array.isArray(dish.items) ? dish.items : [];
  const total = dish.total || {};
  if (!items.length) return '';
  return `<div class="ai-result" style="margin-top:12px">
    <div class="ai-result-head"><strong>Что увидел AI</strong><span class="muted small">проверьте перед добавлением</span></div>
    <div class="ai-table">
      ${items.map(it => `<div class="ai-table-row">
        <span>${escapeHtml(it.name || 'Блюдо')}${it.grams ? ', ' + f0(numOrEmpty(it.grams)) + ' г' : ''}</span>
        <span>${f0(numOrEmpty(it.kcal) || 0)} ккал</span>
      </div>`).join('')}
    </div>
    ${total.kcal ? `<div class="muted small" style="margin-top:6px">Итого ≈ ${f0(numOrEmpty(total.kcal) || 0)} ккал • Б ${f1(numOrEmpty(total.protein) || 0)} • Ж ${f1(numOrEmpty(total.fat) || 0)} • У ${f1(numOrEmpty(total.carbs) || 0)}</div>` : ''}
    ${dish.note ? `<div class="muted small" style="margin-top:4px">${escapeHtml(dish.note)}</div>` : ''}
    <div class="section-actions">
      <button class="btn btn-primary btn-sm" data-action="nut-apply-ai">Добавить всё в дневник</button>
      <button class="btn btn-ghost btn-sm" data-action="nut-clear-ai">Убрать</button>
    </div>
  </div>`;
}

function addNutritionEntry({ meal, name, grams, per, note }){
  const entry = {
    id: uid(),
    date: nutritionDateKey(),
    meal: MEALS.some(m => m.id === meal) ? meal : 'snack',
    name: String(name || 'Приём пищи'),
    grams: numOrEmpty(grams) || 100,
    per: {
      kcal: numOrEmpty(per.kcal) || 0,
      p: numOrEmpty(per.p) || 0,
      f: numOrEmpty(per.f) || 0,
      c: numOrEmpty(per.c) || 0
    },
    note: note || ''
  };
  state.data.nutrition.entries.push(entry);
  saveData();
  return entry;
}

function renderNutritionHomeCard(){
  const key = toDateKey(new Date());
  const targets = nutritionTargets();
  const totals = dayTotals(key);
  if (!targets.kcal){
    return `<section class="section">
      <div class="section-header-row"><h2 class="section-title">Питание</h2><button class="btn btn-ghost btn-sm" data-action="nav" data-view="nutrition">Открыть</button></div>
      <div class="rules-card"><div class="extra-title">Считайте калории без таблиц в Excel</div>
        <div class="extra-text">Добавьте вес и рост — приложение рассчитает норму калорий и БЖУ, а дневник посчитает съеденное.</div>
        <div class="section-actions"><button class="btn btn-primary btn-sm" data-action="nav" data-view="nutrition">Открыть дневник</button></div>
      </div>
    </section>`;
  }
  const left = targets.kcal - totals.kcal;
  return `<section class="section">
    <div class="section-header-row">
      <h2 class="section-title">Питание сегодня</h2>
      <button class="btn btn-ghost btn-sm" data-action="nav" data-view="nutrition">Открыть</button>
    </div>
    <div class="stats">
      <div class="stat"><div class="stat-value">${f0(totals.kcal)} <span class="stat-sub">из ${f0(targets.kcal)}</span></div><div class="stat-label">Калории, ккал</div></div>
      <div class="stat"><div class="stat-value">${f0(totals.protein)} <span class="stat-sub">из ${f0(targets.protein)}</span></div><div class="stat-label">Белки, г</div></div>
      <div class="stat"><div class="stat-value">${left >= 0 ? f0(left) : '−' + f0(-left)}</div><div class="stat-label">${left >= 0 ? 'Осталось ккал' : 'Перебор ккал'}</div></div>
      <div class="stat"><div class="stat-value">${targets.protein ? Math.round(totals.protein / targets.protein * 100) : 0}%</div><div class="stat-label">Выполнение по белку</div></div>
    </div>
  </section>`;
}
