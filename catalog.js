'use strict';

/* ============================================================
   СПРАВОЧНИКИ ПРИЛОЖЕНИЯ
   Инвентарь, группы мышц, каталог упражнений и база продуктов.
   Значения КБЖУ — ориентировочные, на 100 г продукта/блюда.
   ============================================================ */

const EQUIPMENT = [
  { id: 'bodyweight', label: 'Свой вес', always: true },
  { id: 'dumbbells', label: 'Гантели' },
  { id: 'barbell', label: 'Штанга' },
  { id: 'kettlebell', label: 'Гиря' },
  { id: 'bench', label: 'Скамья или скамейка' },
  { id: 'pullup', label: 'Турник / перекладина' },
  { id: 'band', label: 'Резинки' },
  { id: 'machine', label: 'Тренажёры' },
  { id: 'mat', label: 'Коврик' }
];

const MUSCLES = [
  { id: 'quads', label: 'Квадрицепсы' },
  { id: 'hamstrings', label: 'Бицепс бедра' },
  { id: 'glutes', label: 'Ягодицы' },
  { id: 'back', label: 'Спина' },
  { id: 'chest', label: 'Грудь' },
  { id: 'shoulders', label: 'Плечи' },
  { id: 'biceps', label: 'Бицепс' },
  { id: 'triceps', label: 'Трицепс' },
  { id: 'core', label: 'Пресс и кор' },
  { id: 'calves', label: 'Икры' }
];

/* Недельный объём в подходах на группу: [минимум, ориентир максимума] */
const MUSCLE_TARGETS = {
  quads: [10, 20], hamstrings: [8, 16], glutes: [8, 16], back: [10, 20],
  chest: [10, 20], shoulders: [6, 16], biceps: [6, 14], triceps: [6, 14],
  core: [6, 16], calves: [4, 12]
};

const MEALS = [
  { id: 'breakfast', label: 'Завтрак' },
  { id: 'lunch', label: 'Обед' },
  { id: 'dinner', label: 'Ужин' },
  { id: 'snack', label: 'Перекус' }
];

/*
  Каталог упражнений.
  equipment — что нужно (bodyweight подразумевается всегда),
  muscles — первая группа считается основной,
  pattern — тип движения для подбора замены.
*/
const EXERCISE_CATALOG = [
  /* ---------- Ноги и ягодицы ---------- */
  { id: 'bw-squat', name: 'Приседания без веса', equipment: [], muscles: ['quads', 'glutes'], pattern: 'squat', unit: 'reps', sets: 3, reps: '15', note: '' },
  { id: 'bw-lunge', name: 'Выпады на месте', equipment: [], muscles: ['quads', 'glutes'], pattern: 'lunge', unit: 'reps', sets: 3, reps: '10', note: 'на каждую ногу' },
  { id: 'bw-glute-bridge', name: 'Ягодичный мост', equipment: [], muscles: ['glutes', 'hamstrings'], pattern: 'hinge', unit: 'reps', sets: 3, reps: '15', note: '' },
  { id: 'bw-single-bridge', name: 'Ягодичный мост на одной ноге', equipment: [], muscles: ['glutes', 'hamstrings'], pattern: 'hinge', unit: 'reps', sets: 3, reps: '10', note: 'на каждую ногу' },
  { id: 'bw-wall-sit', name: 'Присед у стены', equipment: [], muscles: ['quads'], pattern: 'squat', unit: 'sec', sets: 3, reps: '40', note: 'секунд' },
  { id: 'bw-stepup', name: 'Зашагивания на стул', equipment: [], muscles: ['quads', 'glutes'], pattern: 'lunge', unit: 'reps', sets: 3, reps: '10', note: 'на каждую ногу' },
  { id: 'bw-calf', name: 'Подъёмы на носки', equipment: [], muscles: ['calves'], pattern: 'squat', unit: 'reps', sets: 3, reps: '20', note: '' },
  { id: 'bw-abduction', name: 'Махи ногой в сторону', equipment: [], muscles: ['glutes'], pattern: 'glute_iso', unit: 'reps', sets: 2, reps: '15', note: 'на каждую ногу' },
  { id: 'bw-donkey', name: 'Махи ногой назад', equipment: [], muscles: ['glutes'], pattern: 'glute_iso', unit: 'reps', sets: 2, reps: '15', note: 'на четвереньках, на каждую ногу' },
  { id: 'band-abduction', name: 'Махи ногой с резинкой', equipment: ['band'], muscles: ['glutes'], pattern: 'glute_iso', unit: 'reps', sets: 2, reps: '15', note: 'лёгкая/средняя резинка' },
  { id: 'dum-goblet', name: 'Приседания с гантелью (goblet squat)', equipment: ['dumbbells'], muscles: ['quads', 'glutes'], pattern: 'squat', unit: 'kg', sets: 3, reps: '10', startWeight: '8–10', note: '' },
  { id: 'dum-rdl', name: 'Румынская тяга с гантелями', equipment: ['dumbbells'], muscles: ['hamstrings', 'glutes'], pattern: 'hinge', unit: 'kg', sets: 3, reps: '10', startWeight: '5–6', note: 'гантели по 5–6 кг' },
  { id: 'dum-lunge', name: 'Выпады с гантелями', equipment: ['dumbbells'], muscles: ['quads', 'glutes'], pattern: 'lunge', unit: 'kg', sets: 3, reps: '10', startWeight: '4–6', note: 'на каждую ногу' },
  { id: 'dum-bulgarian', name: 'Болгарский выпад с гантелями', equipment: ['dumbbells', 'bench'], muscles: ['quads', 'glutes'], pattern: 'lunge', unit: 'kg', sets: 3, reps: '8', startWeight: '4–6', note: 'на каждую ногу, задняя нога на скамье' },
  { id: 'dum-hip-thrust', name: 'Ягодичный мост с гантелью', equipment: ['dumbbells'], muscles: ['glutes', 'hamstrings'], pattern: 'hinge', unit: 'kg', sets: 3, reps: '12', startWeight: '8–12', note: 'гантель на тазу' },
  { id: 'dum-stepup', name: 'Зашагивания с гантелями', equipment: ['dumbbells'], muscles: ['quads', 'glutes'], pattern: 'lunge', unit: 'kg', sets: 3, reps: '10', startWeight: '6–10', note: 'на каждую ногу' },
  { id: 'kb-sumo', name: 'Приседания сумо с гирей', equipment: ['kettlebell'], muscles: ['quads', 'glutes'], pattern: 'squat', unit: 'kg', sets: 3, reps: '10', startWeight: '12', note: '' },
  { id: 'kb-swing', name: 'Махи гирей (swing)', equipment: ['kettlebell'], muscles: ['glutes', 'hamstrings'], pattern: 'hinge', unit: 'kg', sets: 3, reps: '15', startWeight: '12', note: 'движение от ягодиц' },
  { id: 'kb-deadlift', name: 'Становая тяга с гирей', equipment: ['kettlebell'], muscles: ['hamstrings', 'glutes', 'back'], pattern: 'hinge', unit: 'kg', sets: 3, reps: '10', startWeight: '12', note: '' },
  { id: 'bar-squat', name: 'Приседания со штангой', equipment: ['barbell'], muscles: ['quads', 'glutes'], pattern: 'squat', unit: 'kg', sets: 3, reps: '8', startWeight: '20', note: '' },
  { id: 'bar-deadlift', name: 'Становая тяга со штангой', equipment: ['barbell'], muscles: ['hamstrings', 'glutes', 'back'], pattern: 'hinge', unit: 'kg', sets: 3, reps: '6', startWeight: '30', note: '' },
  { id: 'mach-legpress', name: 'Жим ногами', equipment: ['machine'], muscles: ['quads', 'glutes'], pattern: 'squat', unit: 'kg', sets: 3, reps: '12', startWeight: '40', note: '' },

  /* ---------- Жимы ---------- */
  { id: 'bw-pushup', name: 'Отжимания от пола', equipment: [], muscles: ['chest', 'triceps', 'shoulders'], pattern: 'push_h', unit: 'reps', sets: 3, reps: '8–12', note: '' },
  { id: 'bw-pushup-knee', name: 'Отжимания с колен', equipment: [], muscles: ['chest', 'triceps'], pattern: 'push_h', unit: 'reps', sets: 3, reps: '10–12', note: '' },
  { id: 'bw-pushup-incline', name: 'Отжимания от опоры', equipment: [], muscles: ['chest', 'triceps'], pattern: 'push_h', unit: 'reps', sets: 3, reps: '10–12', note: 'руки на стуле или столе' },
  { id: 'bw-dips-chair', name: 'Обратные отжимания от стула', equipment: [], muscles: ['triceps', 'chest'], pattern: 'push_h', unit: 'reps', sets: 3, reps: '8–12', note: '' },
  { id: 'dum-bench-press', name: 'Жим гантелей лёжа', equipment: ['dumbbells', 'bench'], muscles: ['chest', 'triceps', 'shoulders'], pattern: 'push_h', unit: 'kg', sets: 3, reps: '10', startWeight: '5–6', note: '' },
  { id: 'dum-floor-press', name: 'Жим гантелей с пола', equipment: ['dumbbells'], muscles: ['chest', 'triceps'], pattern: 'push_h', unit: 'kg', sets: 3, reps: '10', startWeight: '5–6', note: 'если нет скамьи' },
  { id: 'dum-shoulder-press', name: 'Жим гантелей стоя', equipment: ['dumbbells'], muscles: ['shoulders', 'triceps'], pattern: 'push_v', unit: 'kg', sets: 3, reps: '8–10', startWeight: '4–5', note: '' },
  { id: 'dum-lateral', name: 'Разведения гантелей в стороны', equipment: ['dumbbells'], muscles: ['shoulders'], pattern: 'push_v', unit: 'kg', sets: 3, reps: '12', startWeight: '3–4', note: '' },
  { id: 'band-chest-press', name: 'Жим резинкой стоя', equipment: ['band'], muscles: ['chest', 'triceps'], pattern: 'push_h', unit: 'reps', sets: 3, reps: '12–15', note: '' },
  { id: 'band-lateral', name: 'Разведения резинкой в стороны', equipment: ['band'], muscles: ['shoulders'], pattern: 'push_v', unit: 'reps', sets: 3, reps: '12–15', note: '' },
  { id: 'bar-bench', name: 'Жим штанги лёжа', equipment: ['barbell', 'bench'], muscles: ['chest', 'triceps'], pattern: 'push_h', unit: 'kg', sets: 3, reps: '8', startWeight: '30', note: '' },
  { id: 'bar-ohp', name: 'Жим штанги стоя', equipment: ['barbell'], muscles: ['shoulders', 'triceps'], pattern: 'push_v', unit: 'kg', sets: 3, reps: '6–8', startWeight: '20', note: '' },
  { id: 'mach-chest', name: 'Жим в тренажёре от груди', equipment: ['machine'], muscles: ['chest', 'triceps'], pattern: 'push_h', unit: 'kg', sets: 3, reps: '10–12', startWeight: '20', note: '' },
  { id: 'mach-shoulder', name: 'Жим в тренажёре на плечи', equipment: ['machine'], muscles: ['shoulders'], pattern: 'push_v', unit: 'kg', sets: 3, reps: '10–12', startWeight: '15', note: '' },

  /* ---------- Тяги ---------- */
  { id: 'bw-superman', name: '«Супермен» на животе', equipment: [], muscles: ['back', 'glutes'], pattern: 'pull_h', unit: 'reps', sets: 3, reps: '12–15', note: '' },
  { id: 'bw-ytw', name: 'Разведения рук лёжа (Y-T-W)', equipment: [], muscles: ['back', 'shoulders'], pattern: 'pull_h', unit: 'reps', sets: 3, reps: '10', note: '' },
  { id: 'pullup', name: 'Подтягивания', equipment: ['pullup'], muscles: ['back', 'biceps'], pattern: 'pull_v', unit: 'reps', sets: 3, reps: '5–8', note: '' },
  { id: 'pullup-negative', name: 'Негативные подтягивания', equipment: ['pullup'], muscles: ['back', 'biceps'], pattern: 'pull_v', unit: 'reps', sets: 3, reps: '5', note: 'медленно опускаться' },
  { id: 'australian', name: 'Австралийские подтягивания', equipment: ['pullup'], muscles: ['back', 'biceps'], pattern: 'pull_h', unit: 'reps', sets: 3, reps: '8–12', note: 'низкая перекладина' },
  { id: 'band-row', name: 'Тяга резинкой к поясу', equipment: ['band'], muscles: ['back', 'biceps'], pattern: 'pull_h', unit: 'reps', sets: 3, reps: '12–15', note: '' },
  { id: 'band-reverse-fly', name: 'Разведения с резинкой (в наклоне)', equipment: ['band'], muscles: ['back', 'shoulders'], pattern: 'pull_h', unit: 'reps', sets: 3, reps: '12–15', note: '' },
  { id: 'band-facepull', name: 'Тяга резинки к лицу', equipment: ['band'], muscles: ['shoulders', 'back'], pattern: 'pull_h', unit: 'reps', sets: 3, reps: '15', note: '' },
  { id: 'band-pullapart', name: 'Разведения резинки перед собой', equipment: ['band'], muscles: ['back', 'shoulders'], pattern: 'pull_h', unit: 'reps', sets: 3, reps: '15', note: '' },
  { id: 'dum-row', name: 'Тяга гантели одной рукой', equipment: ['dumbbells'], muscles: ['back', 'biceps'], pattern: 'pull_h', unit: 'kg', sets: 3, reps: '10', startWeight: '6–8', note: 'на каждую руку' },
  { id: 'dum-row-bent', name: 'Тяга гантелей в наклоне', equipment: ['dumbbells'], muscles: ['back', 'biceps'], pattern: 'pull_h', unit: 'kg', sets: 3, reps: '10', startWeight: '6–8', note: '' },
  { id: 'dum-pullover', name: 'Пуловер с гантелью', equipment: ['dumbbells', 'bench'], muscles: ['back', 'chest'], pattern: 'pull_h', unit: 'kg', sets: 3, reps: '12', startWeight: '5–6', note: '' },
  { id: 'kb-row', name: 'Тяга гири к поясу', equipment: ['kettlebell'], muscles: ['back', 'biceps'], pattern: 'pull_h', unit: 'kg', sets: 3, reps: '10', startWeight: '12', note: '' },
  { id: 'bar-row', name: 'Тяга штанги в наклоне', equipment: ['barbell'], muscles: ['back', 'biceps'], pattern: 'pull_h', unit: 'kg', sets: 3, reps: '8', startWeight: '25', note: '' },
  { id: 'mach-pulldown', name: 'Тяга верхнего блока', equipment: ['machine'], muscles: ['back', 'biceps'], pattern: 'pull_v', unit: 'kg', sets: 3, reps: '10–12', startWeight: '25', note: '' },
  { id: 'mach-row', name: 'Тяга в тренажёре', equipment: ['machine'], muscles: ['back', 'biceps'], pattern: 'pull_h', unit: 'kg', sets: 3, reps: '10–12', startWeight: '25', note: '' },

  /* ---------- Руки ---------- */
  { id: 'dum-curl', name: 'Сгибание рук с гантелями', equipment: ['dumbbells'], muscles: ['biceps'], pattern: 'curl', unit: 'kg', sets: 2, reps: '12', startWeight: '4–5', note: '' },
  { id: 'dum-triceps', name: 'Разгибание рук с гантелью (трицепс)', equipment: ['dumbbells'], muscles: ['triceps'], pattern: 'curl', unit: 'kg', sets: 2, reps: '12', startWeight: '4–5', note: '' },
  { id: 'band-curl', name: 'Сгибание рук с резинкой', equipment: ['band'], muscles: ['biceps'], pattern: 'curl', unit: 'reps', sets: 2, reps: '12–15', note: '' },
  { id: 'band-triceps', name: 'Разгибание рук с резинкой (трицепс)', equipment: ['band'], muscles: ['triceps'], pattern: 'curl', unit: 'reps', sets: 2, reps: '15', note: '' },
  { id: 'bar-curl', name: 'Сгибание рук со штангой', equipment: ['barbell'], muscles: ['biceps'], pattern: 'curl', unit: 'kg', sets: 2, reps: '10', startWeight: '15', note: '' },

  /* ---------- Кор ---------- */
  { id: 'plank', name: 'Планка', equipment: [], muscles: ['core'], pattern: 'core', unit: 'sec', sets: 3, reps: '20–30', note: 'секунд' },
  { id: 'side-plank', name: 'Боковая планка', equipment: [], muscles: ['core'], pattern: 'core', unit: 'sec', sets: 3, reps: '20–30', note: 'на каждую сторону' },
  { id: 'crunch-bike', name: '«Велосипед»', equipment: [], muscles: ['core'], pattern: 'core', unit: 'reps', sets: 2, reps: '15–20', note: '' },
  { id: 'leg-raise', name: 'Подъём ног лёжа', equipment: [], muscles: ['core'], pattern: 'core', unit: 'reps', sets: 2, reps: '10–12', note: 'с согнутыми коленями — если тяжело' },
  { id: 'dead-bug', name: 'Dead bug', equipment: [], muscles: ['core'], pattern: 'core', unit: 'reps', sets: 3, reps: '10', note: 'на каждую сторону' },
  { id: 'bird-dog', name: 'Bird dog', equipment: [], muscles: ['core', 'back'], pattern: 'core', unit: 'reps', sets: 3, reps: '10', note: 'на каждую сторону' },
  { id: 'russian-twist', name: 'Русские скручивания', equipment: [], muscles: ['core'], pattern: 'core', unit: 'reps', sets: 3, reps: '15', note: '' },
  { id: 'hollow-hold', name: 'Уголок (hollow hold)', equipment: [], muscles: ['core'], pattern: 'core', unit: 'sec', sets: 3, reps: '20', note: 'секунд' }
];

/* База продуктов: значения на 100 г (для напитков — на 100 мл). */
const FOODS = [
  /* Белок */
  { id: 'f-chicken-breast', name: 'Куриная грудка (варёная)', cat: 'Белок', kcal: 165, p: 31, f: 3.6, c: 0 },
  { id: 'f-chicken-thigh', name: 'Куриное бедро (варёное)', cat: 'Белок', kcal: 209, p: 26, f: 10.9, c: 0 },
  { id: 'f-turkey', name: 'Индейка, филе (варёное)', cat: 'Белок', kcal: 135, p: 30, f: 1, c: 0 },
  { id: 'f-beef', name: 'Говядина (тушёная)', cat: 'Белок', kcal: 250, p: 26, f: 16, c: 0 },
  { id: 'f-pork', name: 'Свинина (жареная)', cat: 'Белок', kcal: 297, p: 26, f: 21, c: 0 },
  { id: 'f-salmon', name: 'Лосось (запечённый)', cat: 'Белок', kcal: 208, p: 20, f: 13, c: 0 },
  { id: 'f-cod', name: 'Треска (варёная)', cat: 'Белок', kcal: 82, p: 18, f: 0.7, c: 0 },
  { id: 'f-tuna-can', name: 'Тунец в собственном соку', cat: 'Белок', kcal: 96, p: 22, f: 1, c: 0 },
  { id: 'f-mackerel', name: 'Скумбрия (запечённая)', cat: 'Белок', kcal: 262, p: 19, f: 18, c: 0 },
  { id: 'f-shrimp', name: 'Креветки (варёные)', cat: 'Белок', kcal: 99, p: 24, f: 0.3, c: 0.2 },
  { id: 'f-egg', name: 'Яйцо куриное', cat: 'Белок', kcal: 155, p: 13, f: 11, c: 1.1 },
  { id: 'f-egg-white', name: 'Яичный белок', cat: 'Белок', kcal: 52, p: 11, f: 0.2, c: 0.7 },
  { id: 'f-tofu', name: 'Тофу', cat: 'Белок', kcal: 76, p: 8, f: 4.8, c: 1.9 },
  { id: 'f-lentils', name: 'Чечевица (варёная)', cat: 'Белок', kcal: 116, p: 9, f: 0.4, c: 20 },
  { id: 'f-beans', name: 'Фасоль красная (варёная)', cat: 'Белок', kcal: 127, p: 8.7, f: 0.5, c: 22.8 },
  { id: 'f-chickpeas', name: 'Нут (варёный)', cat: 'Белок', kcal: 164, p: 8.9, f: 2.6, c: 27.4 },
  { id: 'f-protein-shake', name: 'Протеиновый коктейль (на воде)', cat: 'Белок', kcal: 110, p: 22, f: 1, c: 3 },

  /* Молочное */
  { id: 'f-cottage-5', name: 'Творог 5%', cat: 'Молочное', kcal: 121, p: 17, f: 5, c: 3 },
  { id: 'f-cottage-2', name: 'Творог 2%', cat: 'Молочное', kcal: 103, p: 18, f: 2, c: 3.3 },
  { id: 'f-greek-yogurt', name: 'Греческий йогурт 2%', cat: 'Молочное', kcal: 73, p: 10, f: 2, c: 3.9 },
  { id: 'f-yogurt', name: 'Йогурт натуральный 3,2%', cat: 'Молочное', kcal: 66, p: 5, f: 3.2, c: 4.3 },
  { id: 'f-kefir', name: 'Кефир 1%', cat: 'Молочное', kcal: 40, p: 3, f: 1, c: 4 },
  { id: 'f-milk', name: 'Молоко 2,5%', cat: 'Молочное', kcal: 52, p: 2.9, f: 2.5, c: 4.7 },
  { id: 'f-cheese', name: 'Сыр твёрдый', cat: 'Молочное', kcal: 364, p: 25, f: 29, c: 2 },
  { id: 'f-cream-cheese', name: 'Творожный сыр', cat: 'Молочное', kcal: 240, p: 6, f: 23, c: 4 },

  /* Крупы и гарниры */
  { id: 'f-rice-white', name: 'Рис белый (варёный)', cat: 'Гарнир', kcal: 130, p: 2.7, f: 0.3, c: 28 },
  { id: 'f-rice-brown', name: 'Рис бурый (варёный)', cat: 'Гарнир', kcal: 112, p: 2.3, f: 0.8, c: 23 },
  { id: 'f-buckwheat', name: 'Гречка (варёная)', cat: 'Гарнир', kcal: 110, p: 4.2, f: 1.1, c: 21.3 },
  { id: 'f-oat-water', name: 'Овсянка на воде', cat: 'Гарнир', kcal: 88, p: 3, f: 1.7, c: 15 },
  { id: 'f-oat-milk', name: 'Овсянка на молоке', cat: 'Гарнир', kcal: 105, p: 3.5, f: 2.5, c: 16 },
  { id: 'f-pasta', name: 'Макароны (варёные)', cat: 'Гарнир', kcal: 131, p: 5, f: 1.1, c: 25 },
  { id: 'f-potato', name: 'Картофель (варёный)', cat: 'Гарнир', kcal: 87, p: 2, f: 0.1, c: 20 },
  { id: 'f-potato-baked', name: 'Картофель (запечённый)', cat: 'Гарнир', kcal: 93, p: 2.5, f: 0.1, c: 21 },
  { id: 'f-sweet-potato', name: 'Батат (запечённый)', cat: 'Гарнир', kcal: 90, p: 2, f: 0.1, c: 21 },
  { id: 'f-couscous', name: 'Кускус (варёный)', cat: 'Гарнир', kcal: 112, p: 3.8, f: 0.2, c: 23 },
  { id: 'f-bulgur', name: 'Булгур (варёный)', cat: 'Гарнир', kcal: 83, p: 3, f: 0.2, c: 19 },
  { id: 'f-quinoa', name: 'Киноа (варёная)', cat: 'Гарнир', kcal: 120, p: 4.4, f: 1.9, c: 21.3 },
  { id: 'f-bread-ww', name: 'Хлеб цельнозерновой', cat: 'Хлеб', kcal: 247, p: 13, f: 3.4, c: 41 },
  { id: 'f-bread-white', name: 'Хлеб белый', cat: 'Хлеб', kcal: 265, p: 9, f: 3.2, c: 49 },
  { id: 'f-lavash', name: 'Лаваш тонкий', cat: 'Хлеб', kcal: 275, p: 9, f: 1, c: 57 },
  { id: 'f-granola', name: 'Гранола', cat: 'Хлеб', kcal: 471, p: 10, f: 20, c: 64 },

  /* Овощи */
  { id: 'f-cucumber', name: 'Огурец', cat: 'Овощи', kcal: 15, p: 0.7, f: 0.1, c: 3.6 },
  { id: 'f-tomato', name: 'Помидор', cat: 'Овощи', kcal: 18, p: 0.9, f: 0.2, c: 3.9 },
  { id: 'f-pepper', name: 'Перец болгарский', cat: 'Овощи', kcal: 26, p: 1, f: 0.3, c: 6 },
  { id: 'f-cabbage', name: 'Капуста белая', cat: 'Овощи', kcal: 25, p: 1.3, f: 0.1, c: 5.8 },
  { id: 'f-broccoli', name: 'Брокколи', cat: 'Овощи', kcal: 34, p: 2.8, f: 0.4, c: 6.6 },
  { id: 'f-cauliflower', name: 'Цветная капуста', cat: 'Овощи', kcal: 25, p: 1.9, f: 0.3, c: 5 },
  { id: 'f-carrot', name: 'Морковь', cat: 'Овощи', kcal: 41, p: 0.9, f: 0.2, c: 9.6 },
  { id: 'f-beet', name: 'Свёкла', cat: 'Овощи', kcal: 43, p: 1.6, f: 0.2, c: 9.6 },
  { id: 'f-zucchini', name: 'Кабачок', cat: 'Овощи', kcal: 17, p: 1.2, f: 0.3, c: 3.1 },
  { id: 'f-eggplant', name: 'Баклажан', cat: 'Овощи', kcal: 25, p: 1, f: 0.2, c: 6 },
  { id: 'f-spinach', name: 'Шпинат', cat: 'Овощи', kcal: 23, p: 2.9, f: 0.4, c: 3.6 },
  { id: 'f-lettuce', name: 'Салат листовой', cat: 'Овощи', kcal: 15, p: 1.4, f: 0.2, c: 2.9 },
  { id: 'f-onion', name: 'Лук', cat: 'Овощи', kcal: 40, p: 1.1, f: 0.1, c: 9.3 },
  { id: 'f-avocado', name: 'Авокадо', cat: 'Овощи', kcal: 160, p: 2, f: 15, c: 9 },
  { id: 'f-mushroom', name: 'Шампиньоны', cat: 'Овощи', kcal: 22, p: 3.1, f: 0.3, c: 3.3 },
  { id: 'f-corn', name: 'Кукуруза (варёная)', cat: 'Овощи', kcal: 96, p: 3.4, f: 1.5, c: 21 },
  { id: 'f-green-peas', name: 'Горошек зелёный', cat: 'Овощи', kcal: 81, p: 5.4, f: 0.4, c: 14 },

  /* Фрукты */
  { id: 'f-apple', name: 'Яблоко', cat: 'Фрукты', kcal: 52, p: 0.3, f: 0.2, c: 14 },
  { id: 'f-banana', name: 'Банан', cat: 'Фрукты', kcal: 89, p: 1.1, f: 0.3, c: 23 },
  { id: 'f-orange', name: 'Апельсин', cat: 'Фрукты', kcal: 47, p: 0.9, f: 0.1, c: 12 },
  { id: 'f-pear', name: 'Груша', cat: 'Фрукты', kcal: 57, p: 0.4, f: 0.1, c: 15 },
  { id: 'f-grapes', name: 'Виноград', cat: 'Фрукты', kcal: 69, p: 0.7, f: 0.2, c: 18 },
  { id: 'f-strawberry', name: 'Клубника', cat: 'Фрукты', kcal: 32, p: 0.7, f: 0.3, c: 7.7 },
  { id: 'f-blueberry', name: 'Черника', cat: 'Фрукты', kcal: 57, p: 0.7, f: 0.3, c: 14 },
  { id: 'f-mango', name: 'Манго', cat: 'Фрукты', kcal: 60, p: 0.8, f: 0.4, c: 15 },
  { id: 'f-kiwi', name: 'Киви', cat: 'Фрукты', kcal: 61, p: 1.1, f: 0.5, c: 15 },
  { id: 'f-watermelon', name: 'Арбуз', cat: 'Фрукты', kcal: 30, p: 0.6, f: 0.2, c: 8 },

  /* Жиры и орехи */
  { id: 'f-olive-oil', name: 'Масло оливковое', cat: 'Жиры', kcal: 884, p: 0, f: 100, c: 0 },
  { id: 'f-butter', name: 'Масло сливочное', cat: 'Жиры', kcal: 717, p: 0.9, f: 81, c: 0.1 },
  { id: 'f-almond', name: 'Миндаль', cat: 'Жиры', kcal: 579, p: 21, f: 50, c: 22 },
  { id: 'f-walnut', name: 'Грецкий орех', cat: 'Жиры', kcal: 654, p: 15, f: 65, c: 14 },
  { id: 'f-peanut-butter', name: 'Арахисовая паста', cat: 'Жиры', kcal: 588, p: 25, f: 50, c: 20 },
  { id: 'f-sunflower-seeds', name: 'Семечки подсолнечника', cat: 'Жиры', kcal: 584, p: 21, f: 51, c: 20 },

  /* Готовые блюда */
  { id: 'f-borscht', name: 'Борщ', cat: 'Блюда', kcal: 60, p: 2, f: 3, c: 5 },
  { id: 'f-chicken-soup', name: 'Куриный суп', cat: 'Блюда', kcal: 45, p: 3.5, f: 2, c: 2.5 },
  { id: 'f-veg-soup', name: 'Овощной суп', cat: 'Блюда', kcal: 30, p: 1, f: 1, c: 4 },
  { id: 'f-pizza', name: 'Пицца', cat: 'Блюда', kcal: 266, p: 11, f: 10, c: 33 },
  { id: 'f-sushi', name: 'Суши и роллы', cat: 'Блюда', kcal: 150, p: 6, f: 3, c: 25 },
  { id: 'f-burger', name: 'Бургер', cat: 'Блюда', kcal: 295, p: 15, f: 14, c: 27 },
  { id: 'f-fries', name: 'Картофель фри', cat: 'Блюда', kcal: 312, p: 3.4, f: 15, c: 41 },
  { id: 'f-shawarma', name: 'Шаурма', cat: 'Блюда', kcal: 215, p: 12, f: 10, c: 18 },
  { id: 'f-pancakes', name: 'Блины', cat: 'Блюда', kcal: 227, p: 6, f: 8, c: 32 },
  { id: 'f-pelmeni', name: 'Пельмени (варёные)', cat: 'Блюда', kcal: 275, p: 11, f: 12, c: 30 },

  /* Сладкое */
  { id: 'f-sugar', name: 'Сахар', cat: 'Сладкое', kcal: 400, p: 0, f: 0, c: 100 },
  { id: 'f-honey', name: 'Мёд', cat: 'Сладкое', kcal: 304, p: 0.3, f: 0, c: 82 },
  { id: 'f-dark-chocolate', name: 'Шоколад тёмный 70%', cat: 'Сладкое', kcal: 598, p: 7.8, f: 43, c: 46 },
  { id: 'f-icecream', name: 'Мороженое', cat: 'Сладкое', kcal: 207, p: 3.5, f: 11, c: 24 },
  { id: 'f-cookie', name: 'Печенье', cat: 'Сладкое', kcal: 480, p: 6, f: 20, c: 68 },
  { id: 'f-croissant', name: 'Круассан', cat: 'Сладкое', kcal: 406, p: 8, f: 21, c: 46 },

  /* Напитки */
  { id: 'f-orange-juice', name: 'Сок апельсиновый', cat: 'Напитки', kcal: 45, p: 0.7, f: 0.2, c: 10 },
  { id: 'f-cola', name: 'Кола', cat: 'Напитки', kcal: 42, p: 0, f: 0, c: 10.6 },
  { id: 'f-latte', name: 'Латте', cat: 'Напитки', kcal: 55, p: 2.7, f: 2.7, c: 5.2 },
  { id: 'f-tea', name: 'Чай без сахара', cat: 'Напитки', kcal: 1, p: 0, f: 0, c: 0 },
  { id: 'f-beer', name: 'Пиво светлое', cat: 'Напитки', kcal: 43, p: 0.5, f: 0, c: 3.6 },
  { id: 'f-wine', name: 'Вино сухое', cat: 'Напитки', kcal: 85, p: 0.1, f: 0, c: 2.6 }
];

/* ---------- Хелперы-справочники ---------- */

function equipmentLabel(id){
  const e = EQUIPMENT.find(x => x.id === id);
  return e ? e.label : id;
}
function muscleLabel(id){
  const m = MUSCLES.find(x => x.id === id);
  return m ? m.label : id;
}
function mealLabel(id){
  const m = MEALS.find(x => x.id === id);
  return m ? m.label : id;
}
function foodById(id){
  return FOODS.find(f => f.id === id) || null;
}
function exerciseCatalogById(id){
  return EXERCISE_CATALOG.find(x => x.id === id) || null;
}
function normalizeExerciseName(name){
  return String(name || '').toLowerCase().replace(/ё/g, 'е').replace(/[«»"'`]/g, '').replace(/\s+/g, ' ').trim();
}
function catalogByName(name){
  const n = normalizeExerciseName(name);
  if (!n) return null;
  const exact = EXERCISE_CATALOG.find(x => normalizeExerciseName(x.name) === n);
  if (exact) return exact;
  const partial = EXERCISE_CATALOG.find(x => {
    const cn = normalizeExerciseName(x.name);
    return cn.includes(n) || n.includes(cn);
  });
  return partial || null;
}

/* Метаданные упражнения: из каталога по названию либо по ключевым словам. */
function inferExerciseMeta(name){
  const cat = catalogByName(name);
  if (cat) return { equipment: cat.equipment.slice(), muscles: cat.muscles.slice(), pattern: cat.pattern };
  const n = normalizeExerciseName(name);
  const equipment = [];
  if (n.includes('гантел')) equipment.push('dumbbells');
  if (n.includes('штанг')) equipment.push('barbell');
  if (n.includes('гир')) equipment.push('kettlebell');
  if (n.includes('резинк')) equipment.push('band');
  if (n.includes('скамь') || n.includes('скамей')) equipment.push('bench');
  if (n.includes('турник') || n.includes('подтягив')) equipment.push('pullup');
  if (n.includes('тренажер') || n.includes('тренажёр') || n.includes('блок')) equipment.push('machine');
  const muscles = [];
  if (n.includes('ягодич')) muscles.push('glutes');
  if (n.includes('присед') || n.includes('выпад') || n.includes('квадриц')) muscles.push('quads');
  if (n.includes('румынск') || n.includes('бицепс бедра') || n.includes('сгибан') && n.includes('ног')) muscles.push('hamstrings');
  if (n.includes('тяга') || n.includes('спин') || n.includes('подтягив')) muscles.push('back');
  if (n.includes('жим') || n.includes('груд') || n.includes('отжиман')) muscles.push('chest');
  if (n.includes('плеч') || n.includes('жим стоя') || n.includes('разведен')) muscles.push('shoulders');
  if (n.includes('бицепс') || n.includes('сгибан') && n.includes('рук')) muscles.push('biceps');
  if (n.includes('трицепс') || n.includes('разгибан')) muscles.push('triceps');
  if (n.includes('планк') || n.includes('пресс') || n.includes('скруч') || n.includes('кор')) muscles.push('core');
  if (n.includes('икр') || n.includes('носк')) muscles.push('calves');
  if (!muscles.length) muscles.push('core');
  let pattern = '';
  if (n.includes('присед')) pattern = 'squat';
  else if (n.includes('румынск') || n.includes('станов') || n.includes('мост')) pattern = 'hinge';
  else if (n.includes('выпад') || n.includes('зашагив')) pattern = 'lunge';
  else if (n.includes('жим лёжа') || n.includes('жим лежа') || n.includes('отжиман')) pattern = 'push_h';
  else if (n.includes('жим')) pattern = 'push_v';
  else if (n.includes('тяга') || n.includes('подтягив')) pattern = 'pull_h';
  else if (n.includes('планк') || n.includes('скруч') || n.includes('пресс')) pattern = 'core';
  return { equipment, muscles, pattern };
}

function equipmentSatisfied(required, available){
  return (required || []).filter(e => e !== 'bodyweight').every(e => available.includes(e));
}

/* Дополняет программу метаданными, не затирая то, что задано вручную. */
function enrichProgramMetadata(program){
  if (!program || !Array.isArray(program.days)) return program;
  program.days.forEach(day => {
    (day.exercises || []).forEach(ex => {
      const meta = inferExerciseMeta(ex.name);
      if (!Array.isArray(ex.equipment) || !ex.equipment.length) ex.equipment = meta.equipment.slice();
      if (!Array.isArray(ex.muscles) || !ex.muscles.length) {
        ex.muscles = ex.muscle ? [ex.muscle].concat(meta.muscles.filter(m => m !== ex.muscle)) : meta.muscles.slice();
      }
      if (!ex.muscle) ex.muscle = ex.muscles[0] || 'core';
      if (!ex.pattern) ex.pattern = meta.pattern || '';
    });
  });
  return program;
}

function foodCategories(){
  return Array.from(new Set(FOODS.map(f => f.cat)));
}
