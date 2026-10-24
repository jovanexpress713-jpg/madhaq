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
    if (raw.averageCostPerUnitYER < 0) error('المواد الخام', `تكلفة ${raw.name} سالبة.`);
  }

  const distributorIds = new Set((db.distributors || []).map(d => d.id));
  const productIds = new Set((db.products || []).map(p => p.id));
  const supplierIds = new Set((db.suppliers || []).map(s => s.id));
  const rawIds = new Set((db.rawMaterials || []).map(r => r.id));

  for (const d of db.distributions || []) {
    if (!distributorIds.has(d.distributorId)) error('التوزيعات', `الفاتورة ${d.displayNumber} تشير إلى موزع غير موجود.`);
    if (d.grossYER < 0 || d.cashPaidYER < 0 || d.creditYER < 0) error('التوزيعات', `الفاتورة ${d.displayNumber} تحتوي مبلغاً سالباً.`);
    if (Math.abs((d.cashPaidYER + d.creditYER) - d.grossYER) > 0.5) warning('التوزيعات', `الفاتورة ${d.displayNumber} لا تتطابق فيها النقدية والآجل مع الإجمالي.`);
    for (const item of d.items || []) {
      if (!productIds.has(item.productId)) error('التوزيعات', `الفاتورة ${d.displayNumber} تحتوي منتجاً غير موجود.`);
      if (item.quantity <= 0 || item.unitPriceYER < 0) error('التوزيعات', `الفاتورة ${d.displayNumber} تحتوي كمية/سعر غير صالح.`);
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
    for (const item of r.items || []) {
      if (!productIds.has(item.productId)) error('المرتجعات', `السند ${r.displayNumber} يحتوي منتجاً غير موجود.`);
      if (item.quantity <= 0 || item.unitPriceYER < 0) error('المرتجعات', `السند ${r.displayNumber} يحتوي كمية/سعر غير صالح.`);
    }
  }

  for (const p of db.purchases || []) {
    if (!supplierIds.has(p.supplierId)) error('المشتريات', `الفاتورة ${p.displayNumber} تشير إلى مورد غير موجود.`);
    if (p.totalYER < 0 || p.cashPaidYER < 0 || p.creditYER < 0) error('المشتريات', `الفاتورة ${p.displayNumber} تحتوي مبلغاً سالباً.`);
    for (const item of p.items || []) {
      if (!rawIds.has(item.rawMaterialId)) error('المشتريات', `الفاتورة ${p.displayNumber} تحتوي مادة خام غير موجودة.`);
      if (item.quantity <= 0 || item.unitCostYER < 0) error('المشتريات', `الفاتورة ${p.displayNumber} تحتوي كمية/تكلفة غير صالحة.`);
    }
  }

  for (const b of db.productionBatches || []) {
    if (!productIds.has(b.productId)) error('الإنتاج', `دفعة ${b.displayNumber} تشير إلى منتج غير موجود.`);
    if (b.producedQty < 0 || b.damagedQty < 0 || b.plannedQty < 0) error('الإنتاج', `دفعة ${b.displayNumber} تحتوي كمية سالبة.`);
    if (b.totalMaterialCostYER < 0 || b.unitCostYER < 0) error('الإنتاج', `دفعة ${b.displayNumber} تحتوي تكلفة سالبة.`);
  }

  const errors = issues.filter(i => i.severity === 'ERROR').length;
  const warnings = issues.filter(i => i.severity === 'WARNING').length;
  return { valid: errors === 0, errors, warnings, issues };
}
