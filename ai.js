'use strict';

/* ============================================================
   AI-СЛОЙ (опционально)
   Приложение статическое: запросы идут напрямую из браузера
   к выбранному вами OpenAI-совместимому провайдеру с вашим ключом.
   Ключ хранится только в localStorage этого браузера.
   ============================================================ */

const AI_PRESETS = {
  google: { label: 'Google Gemini — бесплатный тариф', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/', model: 'gemini-3.8-flash' },
  groq: { label: 'Groq — бесплатный тариф', baseUrl: 'https://api.groq.com/openai/v1', model: 'qwen/qwen3.8-27b' },
  openrouter: { label: 'OpenRouter — есть бесплатные модели', baseUrl: 'https://openrouter.ai/api/v1', model: '' },
  ollama: { label: 'Ollama — локально, без лимитов', baseUrl: 'http://localhost:11434/v1', model: 'qwen3-vl:8b' },
  openai: { label: 'OpenAI (платно)', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  custom: { label: 'Другой OpenAI-совместимый', baseUrl: '', model: '' }
};

const AI_DEFAULTS = {
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  apiKey: ''
};

function normalizeAI(raw){
  const src = (raw && typeof raw === 'object') ? raw : {};
  const ai = Object.assign({}, AI_DEFAULTS, src);
  if (!AI_PRESETS[ai.provider]) ai.provider = 'openai';
  return {
    provider: ai.provider,
    baseUrl: String(ai.baseUrl || '').trim(),
    model: String(ai.model || '').trim(),
    apiKey: String(ai.apiKey || '')
  };
}

function aiConfigured(){
  const ai = (state && state.data && state.data.ai) || null;
  return !!(ai && ai.apiKey && ai.baseUrl && ai.model);
}

let aiConsentGiven = false;
async function ensureAIConsent(){
  if (aiConsentGiven) return true;
  const ok = await confirmDialog(
    'Отправить фото AI-провайдеру?',
    'Изображение будет передано на сервер выбранного вами провайдера вместе с запросом. Приложение не хранит его на сторонних серверах, но провайдер обрабатывает запрос по своим правилам. Не отправляйте чужие фото без согласия.',
    'Отправить'
  );
  if (ok) aiConsentGiven = true;
  return ok;
}

function aiMaskKey(key){
  const k = String(key || '');
  if (k.length <= 8) return k ? '••••' : '';
  return k.slice(0, 4) + '••••' + k.slice(-4);
}

function aiBaseUrl(){
  return String(state.data.ai.baseUrl || '').replace(/\/+$/, '');
}

function parseAIJson(text){
  let s = String(text || '').trim();
  if (!s) throw new Error('Пустой ответ модели');
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  try {
    return JSON.parse(s);
  } catch (e) {
    throw new Error('Модель вернула не JSON. Попробуйте другую модель или повторите запрос.');
  }
}

async function aiRequest(payload, options = {}){
  if (!aiConfigured()) throw new Error('AI не настроен: укажите Base URL, модель и API-ключ.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 90000);
  try {
    const res = await fetch(aiBaseUrl() + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.data.ai.apiKey
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!res.ok){
      let detail = '';
      try { detail = (await res.text()).slice(0, 300); } catch (_) {}
      if (res.status === 401 || res.status === 403) throw new Error('Ключ не принят (HTTP ' + res.status + '). Проверьте API-ключ.');
      if (res.status === 429) throw new Error('Лимит запросов или закончился баланс (HTTP 429).');
      throw new Error('Ошибка провайдера HTTP ' + res.status + (detail ? ': ' + detail : ''));
    }
    const data = await res.json();
    const content = data && data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : '';
    if (Array.isArray(content)) return content.map(part => part && part.text ? part.text : '').join('\n');
    return String(content || '');
  } catch (err) {
    if (err && err.name === 'AbortError') throw new Error('AI не ответил за 90 секунд. Попробуйте ещё раз.');
    if (err && err.message && /Failed to fetch|NetworkError|Load failed/i.test(err.message)){
      throw new Error('Не удалось связаться с провайдером. Проверьте интернет, Base URL и CORS (в браузере работают OpenAI и OpenRouter).');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function aiVisionJSON(prompt, imageDataUrl){
  const messages = [{
    role: 'user',
    content: [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: imageDataUrl } }
    ]
  }];
  const text = await aiRequest({ model: state.data.ai.model, temperature: 0.2, messages });
  return parseAIJson(text);
}

async function aiTestConnection(){
  const text = await aiRequest({
    model: state.data.ai.model,
    temperature: 0,
    messages: [{ role: 'user', content: 'Ответь одним словом: работает' }]
  });
  return String(text || '').trim();
}

const AI_BODY_PROMPT = [
  'Ты опытный фитнес-тренер, но не врач. По фотографии человека в полный рост опиши визуальные особенности телосложения',
  'и зоны, на которые имеет смысл обратить внимание в силовых тренировках.',
  'Правила: не ставь медицинских диагнозов, не называй точный процент жира или вес, не оценивай внешность оскорбительно,',
  'не обещай результат. Если на фото плохо видно (одежда, ракурс, темно) — честно укажи это в summary.',
  'Ответь строго одним JSON-объектом без пояснений и markdown:',
  '{"summary":"2–3 предложения о телосложении и качестве фото",',
  '"zones":[{"name":"ягодицы","priority":"высокий","note":"что видно и что с этим делать"}],',
  '"posture":["наблюдения по осанке"],',
  '"recommendations":["3–5 конкретных упражнений или действий"],',
  '"disclaimer":"короткая оговорка, что это не медицинская оценка"}',
  'Поля zones.name выбирай из: ягодицы, ноги, живот, спина, плечи, руки, грудь, осанка, общая форма.'
].join(' ');

const AI_DISH_PROMPT = [
  'На фотографии еда. Определи блюда и оцени порции по видимым размерам.',
  'Оценивай приблизительно, честно указывай неуверенность в note. Не придумывай невидимые компоненты.',
  'Ответь строго одним JSON-объектом без markdown:',
  '{"items":[{"name":"название блюда","grams":150,"kcal":250,"protein":10,"fat":8,"carbs":30}],',
  '"total":{"kcal":250,"protein":10,"fat":8,"carbs":30},',
  '"note":"насколько оценка точная и что стоит уточнить"}',
  'Все числа — для указанной порции в граммах, а не на 100 г.'
].join(' ');

const AI_SCALE_PROMPT = [
  'На фотографии дисплей умных весов или приложение с показателями состава тела.',
  'Прочитай все видимые числа и сопоставь их с подписями.',
  'Ответь строго одним JSON-объектом без markdown:',
  '{"weight":null,"bodyFat":null,"muscle":null,"water":null,"visceral":null,"bmr":null,',
  '"confidence":"высокая|средняя|низкая","note":""}',
  'Вес в кг, проценты — числами без знака %, вицеральный жир — уровень числом, BMR — ккал.',
  'Если показатель не виден, оставь null. Ничего не выдумывай.'
].join(' ');

async function aiAnalyzeBodyPhoto(dataUrl){ return aiVisionJSON(AI_BODY_PROMPT, dataUrl); }
async function aiAnalyzeDishPhoto(dataUrl){ return aiVisionJSON(AI_DISH_PROMPT, dataUrl); }
async function aiAnalyzeScalePhoto(dataUrl){ return aiVisionJSON(AI_SCALE_PROMPT, dataUrl); }

function blobToDataURL(blob){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(blob);
  });
}

/* ---------- Бесплатные vision-модели OpenRouter ---------- */

function filterFreeVisionModels(models){
  return (Array.isArray(models) ? models : [])
    .filter(m => m && typeof m.id === 'string' && m.id.endsWith(':free'))
    .filter(m => {
      const arch = m.architecture || {};
      const inputs = Array.isArray(arch.input_modalities)
        ? arch.input_modalities
        : (Array.isArray(m.input_modalities) ? m.input_modalities : []);
      if (inputs.length) return inputs.includes('image');
      return typeof arch.modality === 'string' && arch.modality.includes('image');
    })
    .map(m => ({ id: m.id, name: m.name || m.id }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

async function fetchOpenRouterFreeVisionModels(){
  const res = await fetch('https://openrouter.ai/api/v1/models', { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error('OpenRouter вернул HTTP ' + res.status);
  const data = await res.json();
  return filterFreeVisionModels(data && data.data);
}
