'use strict';

/* ============================================================
   ОБРАБОТЧИКИ НОВЫХ РАЗДЕЛОВ
   Тренер, питание, фото, AI. app.js вызывает эти функции первыми
   и, если действие/поле не его, продолжает обычную обработку.
   ============================================================ */

function saveAISettings(){
  const provider = (document.getElementById('aiProvider') || {}).value || 'openai';
  const baseUrl = (document.getElementById('aiBaseUrl') || {}).value || '';
  const model = (document.getElementById('aiModel') || {}).value || '';
  const apiKey = (document.getElementById('aiKey') || {}).value || '';
  if (!baseUrl.trim() || !model.trim()){
    showToast('Укажите Base URL и модель', 'error');
    return false;
  }
  state.data.ai = normalizeAI({ provider, baseUrl, model, apiKey });
  saveData();
  return true;
}

async function doSaveAI(){
  if (!saveAISettings()) return;
  render();
  showToast('Настройки AI сохранены', 'success');
}

async function doTestAI(){
  if (!saveAISettings()) return;
  showToast('Проверяю подключение…');
  try {
    const answer = await aiTestConnection();
    render();
    showToast('AI отвечает: ' + (answer || 'ок').slice(0, 60), 'success');
  } catch (e) {
    render();
    showToast('Проверка не удалась: ' + e.message, 'error');
  }
}

async function doClearAI(){
  const ok = await confirmDialog('Удалить API-ключ?', 'Ключ будет удалён из этого браузера. Анализ фото перестанет работать.', 'Удалить', true);
  if (!ok) return;
  state.data.ai = normalizeAI({ provider: state.data.ai.provider, baseUrl: state.data.ai.baseUrl, model: state.data.ai.model, apiKey: '' });
  saveData(); render();
  showToast('Ключ удалён', 'success');
}

function saveInventoryFromDom(){
  const items = [];
  document.querySelectorAll('[data-field="inv-item"]').forEach(cb => {
    if (cb.checked) items.push(cb.value);
  });
  const maxInput = document.getElementById('invDumbbellMax');
  state.data.inventory = normalizeInventory({
    items,
    dumbbellMax: maxInput ? maxInput.value : ''
  });
  saveData(); render();
  showToast('Инвентарь сохранён', 'success');
}

function applyCatalogExercise(catId, dayIdx){
  const cat = exerciseCatalogById(catId);
  const editing = state.view === 'edit' && state.editDraft;
  const days = editing ? state.editDraft.days : state.data.program.days;
  const day = days[dayIdx];
  if (!cat || !day) return;
  day.exercises.push(catalogExerciseToProgram(cat));
  if (!editing){
    ensureIds(state.data.program);
    enrichProgramMetadata(state.data.program);
    saveData();
  }
  render();
  showToast('«' + cat.name + '» добавлено в «' + day.name + '»', 'success');
}

function shiftNutritionDate(delta){
  const parts = nutritionDateKey().split('-').map(Number);
  const d = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
  d.setDate(d.getDate() + delta);
  state.nutritionDate = toDateKey(d);
  render();
}

function addNutritionFromDraft(){
  const draft = ensureNutritionDraft();
  const food = foodAnyById(draft.foodId);
  if (!food){ showToast('Выберите продукт из списка', 'error'); return; }
  const grams = numOrEmpty(draft.grams);
  if (!grams || grams < 1 || grams > 3000){ showToast('Укажите порцию от 1 до 3000 г', 'error'); return; }
  addNutritionEntry({
    meal: draft.meal,
    name: food.name,
    grams,
    per: { kcal: food.kcal, p: food.p, f: food.f, c: food.c }
  });
  draft.foodId = '';
  draft.grams = '100';
  render();
  showToast('Добавлено: ' + food.name, 'success');
}

function addCustomFoodFromDom(){
  const val = id => {
    const el = document.getElementById(id);
    return el ? el.value : '';
  };
  const name = val('customFoodName').trim();
  const kcal = numOrEmpty(val('customFoodKcal'));
  if (!name){ showToast('Укажите название продукта', 'error'); return; }
  if (kcal === ''){ showToast('Укажите калорийность на 100 г', 'error'); return; }
  const food = {
    id: uid(),
    name,
    cat: 'Свои',
    kcal,
    p: numOrEmpty(val('customFoodP')),
    f: numOrEmpty(val('customFoodF')),
    c: numOrEmpty(val('customFoodC'))
  };
  if (!Array.isArray(state.data.nutrition.customFoods)) state.data.nutrition.customFoods = [];
  state.data.nutrition.customFoods.push(food);
  ensureNutritionDraft().foodId = food.id;
  saveData(); render();
  showToast('Продукт добавлен в «Свои»', 'success');
}

function deleteNutritionEntry(id){
  state.data.nutrition.entries = (state.data.nutrition.entries || []).filter(e => e.id !== id);
  saveData(); render();
}

function saveNutritionTargetsFromDom(){
  const read = id => {
    const el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  };
  state.data.nutrition.targets = {
    kcal: read('nutTargetKcal'),
    protein: read('nutTargetProtein'),
    fat: read('nutTargetFat'),
    carbs: read('nutTargetCarbs')
  };
  saveData(); render();
  showToast('Цели сохранены. Пустые поля снова считаются автоматически', 'success');
}

function exportNutritionCSV(){
  const entries = [...(state.data.nutrition.entries || [])]
    .sort((a, b) => a.date.localeCompare(b.date) || MEALS.findIndex(m => m.id === a.meal) - MEALS.findIndex(m => m.id === b.meal));
  if (!entries.length){ showToast('Дневник питания пока пуст', 'error'); return; }
  const rows = [['Дата', 'Приём пищи', 'Продукт', 'Порция, г', 'Ккал', 'Белки, г', 'Жиры, г', 'Углеводы, г']];
  entries.forEach(e => {
    const t = entryTotals(e);
    rows.push([fmtDateKey(e.date), mealLabel(e.meal), e.name, f0(e.grams), f0(t.kcal), f1(t.protein), f1(t.fat), f1(t.carbs)]);
  });
  const csv = '\uFEFF' + rows.map(r => r.map(csvCell).join(';')).join('\r\n');
  downloadText('pitanie-' + toDateKey(new Date()) + '.csv', csv, 'text/csv;charset=utf-8');
  showToast('CSV с питанием скачан', 'success');
}

async function handleDishPhotoFile(file){
  if (!file) return;
  if (!aiConfigured()){ showToast('Сначала подключите AI-ключ в разделе «Тренер»', 'error'); return; }
  if (!(await ensureAIConsent())) return;
  showToast('AI оценивает блюдо…');
  try {
    const blob = await compressImageFile(file, 800, 0.8);
    const dataUrl = await blobToDataURL(blob);
    const result = await aiAnalyzeDishPhoto(dataUrl);
    state.aiDish = result;
    render();
    showToast('Оценка готова — проверьте и добавьте', 'success');
  } catch (e) {
    showToast('AI не смог оценить фото: ' + e.message, 'error');
  }
}

function applyDishAI(){
  const dish = state.aiDish;
  if (!dish || !Array.isArray(dish.items) || !dish.items.length) return;
  const meal = ensureNutritionDraft().meal || 'snack';
  let added = 0;
  dish.items.forEach(it => {
    const grams = numOrEmpty(it.grams) || 100;
    const kcal = numOrEmpty(it.kcal);
    const p = numOrEmpty(it.protein);
    const f = numOrEmpty(it.fat);
    const c = numOrEmpty(it.carbs);
    if (kcal === '') return;
    addNutritionEntry({
      meal,
      name: it.name || 'Блюдо',
      grams,
      per: {
        kcal: kcal / grams * 100,
        p: (p === '' ? 0 : p) / grams * 100,
        f: (f === '' ? 0 : f) / grams * 100,
        c: (c === '' ? 0 : c) / grams * 100
      },
      note: 'AI-оценка'
    });
    added += 1;
  });
  state.aiDish = null;
  closeModal(true);
  render();
  showToast(added ? 'Добавлено позиций: ' + added : 'Нечего добавлять', added ? 'success' : 'error');
}

async function handleScalePhotoFile(file){
  if (!file) return;
  if (!aiConfigured()){ showToast('Сначала подключите AI-ключ в разделе «Тренер»', 'error'); return; }
  if (!(await ensureAIConsent())) return;
  showToast('AI читает показания весов…');
  try {
    const blob = await compressImageFile(file, 900, 0.85);
    const dataUrl = await blobToDataURL(blob);
    const result = await aiAnalyzeScalePhoto(dataUrl);
    state.scaleAI = result;
    const rows = [
      ['Вес', result.weight, 'кг'],
      ['Жир', result.bodyFat, '%'],
      ['Мышцы', result.muscle, '%'],
      ['Вода', result.water, '%'],
      ['Висцеральный жир', result.visceral, ''],
      ['BMR', result.bmr, 'ккал']
    ].filter(r => r[1] != null && r[1] !== '')
      .map(r => `<div class="ai-table-row"><span>${r[0]}</span><span>${escapeHtml(String(r[1]))} ${r[2]}</span></div>`).join('');
    const html = `<h3>AI прочитал весы</h3>
      <p>Проверьте числа перед заполнением — OCR и vision иногда путают цифры.</p>
      <div class="ai-table">${rows || '<div class="muted">Не удалось разобрать показания. Заполните вручную.</div>'}</div>
      ${result.note ? `<p class="muted small">${escapeHtml(result.note)}</p>` : ''}
      <p class="muted small">Уверенность: ${escapeHtml(result.confidence || '—')}</p>
      <div class="modal-actions">
        <button class="btn btn-ghost" data-modal="cancel">Отмена</button>
        <button class="btn btn-primary" data-action="fill-scale-ai" ${rows ? '' : 'disabled'}>Заполнить измерение</button>
      </div>`;
    openModal(html, 'info');
  } catch (e) {
    showToast('AI не смог прочитать весы: ' + e.message, 'error');
  }
}

function fillScaleAI(){
  const r = state.scaleAI || {};
  const d = ensureMeasureDraft();
  if (numOrEmpty(r.weight) !== '') d.weight = numOrEmpty(r.weight);
  if (numOrEmpty(r.bodyFat) !== '') d.bodyFat = numOrEmpty(r.bodyFat);
  if (numOrEmpty(r.muscle) !== '') d.muscle = numOrEmpty(r.muscle);
  if (numOrEmpty(r.water) !== '') d.water = numOrEmpty(r.water);
  if (numOrEmpty(r.visceral) !== '') d.visceral = numOrEmpty(r.visceral);
  state.scaleAI = null;
  closeModal(true);
  state.view = 'body';
  render();
  const el = document.querySelector('[data-field="m-weight"]');
  if (el) el.focus();
  showToast('Форма заполнена — проверьте и сохраните', 'success');
}

function handleFeatureAction(action, t){
  switch (action){
    case 'save-inventory': saveInventoryFromDom(); return true;
    case 'apply-adaptation':
      applyAdaptationPlan(buildAdaptationPlan()).catch(e => showToast('Не удалось адаптировать: ' + e.message, 'error'));
      return true;
    case 'open-catalog': {
      const dayIdx = parseInt(t.dataset.day, 10);
      if (!isNaN(dayIdx)) openModal(renderCatalogModal(dayIdx), 'info');
      return true;
    }
    case 'add-catalog': {
      const catId = t.dataset.cat;
      const dayIdx = parseInt(t.dataset.day, 10);
      closeModal(true);
      if (catId && !isNaN(dayIdx)) applyCatalogExercise(catId, dayIdx);
      return true;
    }
    case 'save-ai': doSaveAI().catch(e => showToast('Ошибка: ' + e.message, 'error')); return true;
    case 'test-ai': doTestAI().catch(e => showToast('Ошибка: ' + e.message, 'error')); return true;
    case 'clear-ai': doClearAI().catch(e => showToast('Ошибка: ' + e.message, 'error')); return true;

    case 'nut-prev': shiftNutritionDate(-1); return true;
    case 'nut-next': shiftNutritionDate(1); return true;
    case 'nut-today': state.nutritionDate = toDateKey(new Date()); render(); return true;
    case 'nut-add': addNutritionFromDraft(); return true;
    case 'nut-custom-add': addCustomFoodFromDom(); return true;
    case 'nut-delete': deleteNutritionEntry(t.dataset.id); return true;
    case 'nut-save-targets': saveNutritionTargetsFromDom(); return true;
    case 'nut-export': exportNutritionCSV(); return true;
    case 'nut-apply-ai': applyDishAI(); return true;
    case 'nut-clear-ai': state.aiDish = null; render(); return true;
    case 'fill-scale-ai': fillScaleAI(); return true;

    case 'open-photo': openPhotoModal(t.dataset.id).catch(e => showToast('Не удалось открыть фото: ' + e.message, 'error')); return true;
    case 'photo-delete': deletePhoto(t.dataset.id).catch(e => showToast('Ошибка: ' + e.message, 'error')); return true;
    case 'photo-ai': analyzePhotoAI(t.dataset.id).catch(e => showToast('Ошибка AI: ' + e.message, 'error')); return true;
  }
  return false;
}

function handleFeatureInput(field, t){
  if (t && t.id === 'catalogSearch'){ filterCatalogDom(); return true; }
  if (field === 'nut-grams'){ ensureNutritionDraft().grams = t.value; return true; }
  if (field === 'nut-entry-grams'){
    const entry = (state.data.nutrition.entries || []).find(e => e.id === t.dataset.id);
    if (entry){
      entry.grams = t.value;
      saveDebounced();
    }
    return true;
  }
  if (field === 'compare-a' || field === 'compare-b'){
    return true;
  }
  return false;
}

async function handleFeatureChange(field, t){
  if (t && t.id === 'catalogAvailable'){ filterCatalogDom(); return true; }
  if (t && t.id === 'photoFile'){
    const file = t.files && t.files[0];
    t.value = '';
    if (file){
      await addPhotoFromFile(file, {
        date: (document.getElementById('photoDate') || {}).value,
        pose: (document.getElementById('photoPose') || {}).value,
        weight: (document.getElementById('photoWeight') || {}).value,
        note: (document.getElementById('photoNote') || {}).value
      });
    }
    return true;
  }
  if (t && t.id === 'dishFile'){
    const file = t.files && t.files[0];
    t.value = '';
    if (file) handleDishPhotoFile(file);
    return true;
  }
  if (t && t.id === 'scaleFile'){
    const file = t.files && t.files[0];
    t.value = '';
    if (file) handleScalePhotoFile(file);
    return true;
  }
  if (t && t.id === 'aiProvider'){
    const preset = AI_PRESETS[t.value];
    if (preset){
      const base = document.getElementById('aiBaseUrl');
      const model = document.getElementById('aiModel');
      if (base && preset.baseUrl) base.value = preset.baseUrl;
      if (model && preset.model) model.value = preset.model;
    }
    return true;
  }
  if (field === 'nut-date'){
    state.nutritionDate = t.value || toDateKey(new Date());
    render();
    return true;
  }
  if (field === 'nut-food'){
    ensureNutritionDraft().foodId = t.value;
    render();
    return true;
  }
  if (field === 'nut-meal'){
    ensureNutritionDraft().meal = t.value;
    return true;
  }
  if (field === 'nut-entry-grams'){
    const entry = (state.data.nutrition.entries || []).find(e => e.id === t.dataset.id);
    if (entry){ entry.grams = t.value; saveData(); render(); }
    return true;
  }
  if (field === 'compare-a' || field === 'compare-b'){
    state.photoCompare = state.photoCompare || { a: '', b: '' };
    state.photoCompare[field === 'compare-a' ? 'a' : 'b'] = t.value;
    render();
    return true;
  }
  return false;
}
