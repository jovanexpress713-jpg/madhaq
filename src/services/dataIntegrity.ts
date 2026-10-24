import { DatabaseSchema } from '../types';

export interface IntegrityIssue {
  severity: 'ERROR' | 'WARNING';
  area: string;
  message: string;
}

export interface IntegrityReport {
  valid: boolean;
  errors: number;
  warnings: number;
  issues: IntegrityIssue[];
}

const hasDuplicateIds = (items: Array<{ id?: string }>) => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const item of items) {
    if (!item.id) continue;
    if (seen.has(item.id)) duplicates.add(item.id);
    seen.add(item.id);
  }
  return [...duplicates];
};

const nearlyEqual = (a: number, b: number, tolerance = 0.5) => Math.abs(a - b) <= tolerance;

export function validateDatabaseIntegrity(db: DatabaseSchema): IntegrityReport {
  const issues: IntegrityIssue[] = [];
  const error = (area: string, message: string) => issues.push({ severity: 'ERROR', area, message });
  const warning = (area: string, message: string) => issues.push({ severity: 'WARNING', area, message });

  if (!db || typeof db !== 'object') {
    return { valid: false, errors: 1, warnings: 0, issues: [{ severity: 'ERROR', area: 'قاعدة البيانات', message: 'البيانات ليست كائناً صالحاً.' }] };
  }

  const collections: Array<[string, Array<{ id?: string }> | undefined]> = [
    ['الموزعون', db.distributors],
    ['المنتجات', db.products],
    ['الموردون', db.suppliers],
    ['المواد الخام', db.rawMaterials],
    ['الوصفات', db.recipes],
    ['التوزيعات', db.distributions],
    ['التحصيلات', db.collections],
    ['المرتجعات', db.returns],
    ['المشتريات', db.purchases],
    ['سداد الموردين', db.supplierPayments],
    ['الإنتاج', db.productionBatches],
    ['المصروفات', db.expenses]
  ];

  for (const [area, items] of collections) {
    if (!Array.isArray(items)) {
      error(area, 'القائمة مفقودة أو ليست مصفوفة.');
      continue;
    }
    const duplicates = hasDuplicateIds(items);
    if (duplicates.length) error(area, `يوجد معرفات مكررة: ${duplicates.slice(0, 5).join(', ')}`);
  }

  for (const product of db.products || []) {
    if (product.stockQty < 0) error('المخزون', `المنتج ${product.name} لديه مخزون سالب.`);
    if (product.minimumQty < 0) error('المخزون', `الحد الأدنى للمنتج ${product.name} سالب.`);
    if (product.factoryPriceYER < 0 || product.distributorPriceYER < 0) {
      error('الأسعار', `السعر للمنتج ${product.name} لا يمكن أن يكون سالباً.`);
    }
  }

  for (const raw of db.rawMaterials || []) {
    if (raw.stockQty < 0) error('المواد الخام', `المادة ${raw.name} لديها مخزون سالب.`);
    if (raw.minimumQty < 0) error('المواد الخام', `الحد الأدنى للمادة ${raw.name} سالب.`);
    if (raw.averageCostPerUnitYER < 0) error('المواد الخام', `تكلفة ${raw.name} سالبة.`);
  }

  const distributorIds = new Set((db.distributors || []).map(d => d.id));
  const productIds = new Set((db.products || []).map(p => p.id));
  const supplierIds = new Set((db.suppliers || []).map(s => s.id));
  const rawIds = new Set((db.rawMaterials || []).map(r => r.id));
  const recipeIds = new Set((db.recipes || []).map(r => r.id));

  for (const recipe of db.recipes || []) {
    if (!productIds.has(recipe.productId)) error('الوصفات', `الوصفة ${recipe.name} تشير إلى منتج غير موجود.`);
    if (recipe.outputQty <= 0) error('الوصفات', `الوصفة ${recipe.name} لديها ناتج قياسي غير صالح.`);
    if (!recipe.items.length) error('الوصفات', `الوصفة ${recipe.name} لا تحتوي مواد خام.`);
    const seenRaw = new Set<string>();
    for (const item of recipe.items || []) {
      if (!rawIds.has(item.rawMaterialId)) error('الوصفات', `الوصفة ${recipe.name} تحتوي مادة خام غير موجودة.`);
      if (item.quantity <= 0) error('الوصفات', `الوصفة ${recipe.name} تحتوي كمية خامات غير صالحة.`);
      if (seenRaw.has(item.rawMaterialId)) warning('الوصفات', `الوصفة ${recipe.name} تكرر نفس المادة الخام أكثر من مرة.`);
      seenRaw.add(item.rawMaterialId);
    }
  }

  for (const d of db.distributions || []) {
    if (!distributorIds.has(d.distributorId)) error('التوزيعات', `الفاتورة ${d.displayNumber} تشير إلى موزع غير موجود.`);
    if (d.grossYER < 0 || d.cashPaidYER < 0 || d.creditYER < 0) error('التوزيعات', `الفاتورة ${d.displayNumber} تحتوي مبلغاً سالباً.`);
    if (!nearlyEqual(d.cashPaidYER + d.creditYER, d.grossYER)) error('التوزيعات', `الفاتورة ${d.displayNumber} لا تتطابق فيها النقدية والآجل مع الإجمالي.`);
    const itemTotal = (d.items || []).reduce((sum, item) => sum + item.totalYER, 0);
    const commissionTotal = (d.items || []).reduce((sum, item) => sum + (item.commissionYER || 0), 0);
    if (!nearlyEqual(itemTotal, d.grossYER)) error('التوزيعات', `الفاتورة ${d.displayNumber} لا يتطابق مجموع بنودها مع الإجمالي.`);
    if (!nearlyEqual(commissionTotal, d.totalCommissionYER || 0)) warning('التوزيعات', `عمولة الفاتورة ${d.displayNumber} لا تتطابق مع مجموع عمولات البنود.`);
    if (!d.items.length) error('التوزيعات', `الفاتورة ${d.displayNumber} لا تحتوي بنوداً.`);
    for (const item of d.items || []) {
      if (!productIds.has(item.productId)) error('التوزيعات', `الفاتورة ${d.displayNumber} تحتوي منتجاً غير موجود.`);
      if (item.quantity <= 0 || item.unitPriceYER < 0 || item.totalYER < 0) error('التوزيعات', `الفاتورة ${d.displayNumber} تحتوي كمية/سعر/إجمالي غير صالح.`);
      if (!nearlyEqual(item.quantity * item.unitPriceYER, item.totalYER)) error('التوزيعات', `بند في ${d.displayNumber} لا يتطابق فيه السعر مع الإجمالي.`);
    }
  }

  for (const c of db.collections || []) {
    if (!distributorIds.has(c.distributorId)) error('التحصيلات', `السند ${c.displayNumber} يشير إلى موزع غير موجود.`);
    if (c.amountYER <= 0) error('التحصيلات', `السند ${c.displayNumber} يحتوي مبلغاً غير صالح.`);
  }

  for (const r of db.returns || []) {
    if (!distributorIds.has(r.distributorId)) error('المرتجعات', `السند ${r.displayNumber} يشير إلى موزع غير موجود.`);
    if (r.totalValueYER < 0) error('المرتجعات', `السند ${r.displayNumber} يحتوي قيمة سالبة.`);
    if (r.settlementType === 'REDUCE_DEBT' && r.totalValueYER === 0) warning('المرتجعات', `السند ${r.displayNumber} يخفض الدين بقيمة صفر.`);
    const returnTotal = (r.items || []).reduce((sum, item) => sum + item.totalYER, 0);
    if (!nearlyEqual(returnTotal, r.totalValueYER)) error('المرتجعات', `السند ${r.displayNumber} لا يتطابق فيه مجموع البنود مع قيمة المرتجع.`);
    for (const item of r.items || []) {
      if (!productIds.has(item.productId)) error('المرتجعات', `السند ${r.displayNumber} يحتوي منتجاً غير موجود.`);
      if (item.quantity <= 0 || item.unitPriceYER < 0 || item.totalYER < 0) error('المرتجعات', `السند ${r.displayNumber} يحتوي كمية/سعر/إجمالي غير صالح.`);
      if (!nearlyEqual(item.quantity * item.unitPriceYER, item.totalYER)) error('المرتجعات', `بند في ${r.displayNumber} لا يتطابق فيه السعر مع الإجمالي.`);
    }
  }

  for (const p of db.purchases || []) {
    if (!supplierIds.has(p.supplierId)) error('المشتريات', `الفاتورة ${p.displayNumber} تشير إلى مورد غير موجود.`);
    if (p.totalYER < 0 || p.cashPaidYER < 0 || p.creditYER < 0) error('المشتريات', `الفاتورة ${p.displayNumber} تحتوي مبلغاً سالباً.`);
    if (!nearlyEqual(p.cashPaidYER + p.creditYER, p.totalYER)) error('المشتريات', `الفاتورة ${p.displayNumber} لا تتطابق فيها النقدية والآجل مع الإجمالي.`);
    const itemTotal = (p.items || []).reduce((sum, item) => sum + item.lineTotalYER, 0);
    if (!nearlyEqual(itemTotal, p.totalYER)) error('المشتريات', `الفاتورة ${p.displayNumber} لا يتطابق مجموع بنودها مع الإجمالي.`);
    for (const item of p.items || []) {
      if (!rawIds.has(item.rawMaterialId)) error('المشتريات', `الفاتورة ${p.displayNumber} تحتوي مادة خام غير موجودة.`);
      if (item.quantity <= 0 || item.unitCostYER < 0 || item.lineTotalYER < 0) error('المشتريات', `الفاتورة ${p.displayNumber} تحتوي كمية/تكلفة/إجمالي غير صالح.`);
      if (!nearlyEqual(item.quantity * item.unitCostYER, item.lineTotalYER)) error('المشتريات', `بند في ${p.displayNumber} لا يتطابق فيه السعر مع الإجمالي.`);
    }
  }

  for (const payment of db.supplierPayments || []) {
    if (!supplierIds.has(payment.supplierId)) error('سداد الموردين', `السند ${payment.displayNumber} يشير إلى مورد غير موجود.`);
    if (payment.amountYER <= 0) error('سداد الموردين', `السند ${payment.displayNumber} يحتوي مبلغ سداد غير صالح.`);
  }

  for (const b of db.productionBatches || []) {
    if (!productIds.has(b.productId)) error('الإنتاج', `دفعة ${b.displayNumber} تشير إلى منتج غير موجود.`);
    if (!recipeIds.has(b.recipeId)) error('الإنتاج', `دفعة ${b.displayNumber} تشير إلى وصفة غير موجودة.`);
    if (b.producedQty <= 0) error('الإنتاج', `دفعة ${b.displayNumber} لا تحتوي ناتجاً صالحاً.`);
    if (b.damagedQty < 0 || b.plannedQty <= 0) error('الإنتاج', `دفعة ${b.displayNumber} تحتوي كمية مخططة/تالف غير صالحة.`);
    if (b.producedQty + b.damagedQty > b.plannedQty) {
      warning('الإنتاج', `دفعة ${b.displayNumber} تتجاوز ناتجها المخطط (سليم + تالف أكبر من المخطط).`);
    }
    if (b.totalMaterialCostYER < 0 || b.unitCostYER < 0) error('الإنتاج', `دفعة ${b.displayNumber} تحتوي تكلفة سالبة.`);
    if (b.producedQty > 0 && !nearlyEqual(b.totalMaterialCostYER / b.producedQty, b.unitCostYER, 1)) {
      warning('الإنتاج', `تكلفة الوحدة في الدفعة ${b.displayNumber} لا تتطابق مع تكلفة الخامات والناتج.`);
    }
  }

  for (const e of db.expenses || []) {
    if (e.amountYER <= 0) error('المصروفات', `المصروف ${e.displayNumber} يحتوي مبلغاً غير صالح.`);
  }

  const errors = issues.filter(i => i.severity === 'ERROR').length;
  const warnings = issues.filter(i => i.severity === 'WARNING').length;
  return { valid: errors === 0, errors, warnings, issues };
}
