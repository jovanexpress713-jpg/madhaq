import { RECIPE_LIBRARY, RECIPE_PREPARATION_STEPS } from '../src/data/recipeLibrary';
import { RECIPE_OPERATION_META, DEFAULT_RECIPE_OPERATION_META } from '../src/data/recipeOperations';

const failures: string[] = [];
const warnings: string[] = [];
const ids = new Set<string>();
const photoUrls = new Set<string>();
const normalizeArabic = (value: string) => value.toLowerCase()
  .replace(/[أإآ]/g, 'ا')
  .replace(/ة/g, 'ه')
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const imageLabelStopWords = new Set([
  'اقتصادي', 'اقتصادية', 'اقتصاديا', 'للبقالات', 'للمنتجات', 'المنتج', 'منتجات',
  'يمنية', 'يمني', 'تقليدي', 'تقليدية', 'موثقة', 'المصدر', 'مرتبطة', 'بمصدر',
  'منشور', 'نصف', 'مصنع', 'جاهز', 'جاهزة', 'وصفة', 'وصفات'
]);

for (const recipe of RECIPE_LIBRARY) {
  if (!recipe.id?.trim()) failures.push('وصفة بلا معرّف');
  if (ids.has(recipe.id)) failures.push(`معرّف وصفة مكرر: ${recipe.id}`);
  ids.add(recipe.id);
  if (!recipe.name?.trim()) failures.push(`اسم الوصفة فارغ: ${recipe.id}`);
  if (!Number.isFinite(recipe.baseYieldGrams) || recipe.baseYieldGrams <= 0) failures.push(`إنتاج أساسي غير صالح: ${recipe.name}`);
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) failures.push(`لا توجد مقادير: ${recipe.name}`);
  const ingredientNames = new Set<string>();
  for (const ingredient of recipe.ingredients ?? []) {
    if (!ingredient.name?.trim()) failures.push(`مكوّن بلا اسم في: ${recipe.name}`);
    if (!Number.isFinite(ingredient.grams) || ingredient.grams <= 0) failures.push(`كمية غير صالحة لـ ${ingredient.name} في ${recipe.name}`);
    if (ingredientNames.has(ingredient.name)) warnings.push(`مكوّن مكرر ${ingredient.name} في ${recipe.name}`);
    ingredientNames.add(ingredient.name);
  }
  const explicitMeta = RECIPE_OPERATION_META[recipe.id];
  if (!explicitMeta) failures.push(`لا توجد صورة مرجعية مخصصة لهذه الوصفة: ${recipe.name}`);
  const meta = explicitMeta ?? DEFAULT_RECIPE_OPERATION_META;
  if (!meta.imageUrl || !/^https:\/\//.test(meta.imageUrl)) failures.push(`صورة مرجعية غير صالحة: ${recipe.name}`);
  if (!meta.imageAlt?.trim()) failures.push(`وصف الصورة فارغ: ${recipe.name}`);
  const normalizeToken = (token: string) => token.replace(/^(?:وال|بال|كال|لل|ال|ب|و)/, '');
  const nameTokens = normalizeArabic(recipe.name).split(' ').map(normalizeToken).filter(token => token.length > 2 && !imageLabelStopWords.has(token));
  const imageTokens = new Set(normalizeArabic(meta.imageAlt).split(' ').map(normalizeToken));
  if (!nameTokens.some(token => imageTokens.has(token))) failures.push(`وصف الصورة لا يطابق اسم الوصفة: ${recipe.name} — ${meta.imageAlt}`);
  if (meta.imageSourceUrl && !meta.imageSourceUrl.startsWith('https://')) failures.push(`رابط مصدر الصورة غير صالح: ${recipe.name}`);
  if (photoUrls.has(meta.imageUrl)) failures.push(`الصورة مستخدمة لوصفة أخرى وليست فريدة: ${recipe.name}`);
  photoUrls.add(meta.imageUrl);
  if (!Array.isArray(RECIPE_PREPARATION_STEPS[recipe.id]) || RECIPE_PREPARATION_STEPS[recipe.id].length < 4) failures.push(`طريقة التحضير غير مكتملة: ${recipe.name}`);
  if (!Number.isFinite(meta.shelfLifeDays) || meta.shelfLifeDays <= 0) failures.push(`مرجع صلاحية غير صالح: ${recipe.name}`);
  const inputTotal = recipe.ingredients.reduce((sum, item) => sum + item.grams, 0);
  if (Math.abs(inputTotal - recipe.baseYieldGrams) / recipe.baseYieldGrams > 0.15) {
    warnings.push(`راجع الفرق بين مجموع المقادير (${inputTotal} جم) وإنتاج الأساس (${recipe.baseYieldGrams} جم): ${recipe.name}`);
  }
}

if (!RECIPE_LIBRARY.some((r) => r.id === 'bint-al-sahn') ||
    !RECIPE_LIBRARY.some((r) => r.id === 'sabayah-yemeni') ||
    !RECIPE_LIBRARY.some((r) => r.id === 'rawani-yemeni') ||
    !RECIPE_LIBRARY.some((r) => r.id === 'arika-yemeni') ||
    !RECIPE_LIBRARY.some((r) => r.id === 'maasoub-yemeni') ||
    !RECIPE_LIBRARY.some((r) => r.id === 'halawa-lahji') ||
    !RECIPE_LIBRARY.some((r) => r.id === 'harissa-yemeni') ||
    !RECIPE_LIBRARY.some((r) => r.id === 'mafhoosa-yemeni') ||
    !RECIPE_LIBRARY.some((r) => r.id === 'zalabiya-yemeni') ||
    !RECIPE_LIBRARY.some((r) => r.id === 'kunafa-dough') ||
    !RECIPE_LIBRARY.some((r) => r.id === 'baklava-sheets') ||
    !RECIPE_LIBRARY.some((r) => r.id === 'cream-filling') ||
    !RECIPE_LIBRARY.some((r) => r.id === 'sugar-syrup')) {
  failures.push('الوصفات الأساسية للمنتجات نصف المصنعة غير مكتملة');
}

console.log(`تم فحص ${RECIPE_LIBRARY.length} وصفة، و${RECIPE_LIBRARY.reduce((n, r) => n + r.ingredients.length, 0)} بند مقادير.`);
if (warnings.length) {
  console.warn(`ملاحظات مراجعة المقادير: ${warnings.length}`);
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}
if (failures.length) {
  console.error(`فشل فحص الوصفات: ${failures.length} مشكلة`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('نجاح: أسماء الوصفات ومقاديرها والصور المرجعية والبيانات الأساسية صالحة بنيوياً.');
}
