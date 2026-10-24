export type CommissionType = 'PER_PIECE' | 'PERCENT';

export interface Distributor {
  id: string;
  name: string;
  phone: string;
  address?: string;
  debtLimitYER: number; // سقف الدين بالريال
  commissionType: CommissionType; // 'PER_PIECE' أو 'PERCENT'
  commissionValue: number; // ريال لكل قطعة، أو نسبة مئوية (مثلاً 5 تعني 5%)
  openingDebtYER: number; // الرصيد الافتتاحي
  active: boolean;
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string; // قطعة، كيلو، صحن، باكت، كرتون
  factoryPriceYER: number; // سعر المعمل / التكلفة
  distributorPriceYER: number; // سعر البيع للموزع
  stockQty: number; // المخزون الحالي
  minimumQty: number; // حد التنبيه
  active: boolean;
  createdAt: number;
}

export interface DistributionItem {
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPriceYER: number;
  commissionTypeSnapshot: CommissionType;
  commissionValueSnapshot: number;
  commissionYER: number;
  totalYER: number;
}

export interface Distribution {
  id: string;
  displayNumber: string; // e.g. DST-1001
  distributorId: string;
  distributorName: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
  items: DistributionItem[];
  grossYER: number; // إجمالي قيمة البضاعة
  cashPaidYER: number; // المقبوض نقدًا
  creditYER: number; // المتبقي آجل على دين الموزع
  totalCommissionYER: number; // إجمالي عمولة الموزع المحسوبة لهذه الفاتورة
  note?: string;
}

export interface CollectionEntry {
  id: string;
  displayNumber: string; // e.g. REC-1001
  distributorId: string;
  distributorName: string;
  date: string;
  createdAt: number;
  amountYER: number;
  method: 'CASH' | 'TRANSFER' | 'CHEQUE';
  reference?: string; // رقم الحوالة / السند
  note?: string;
}

export interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceYER: number;
  totalYER: number;
  restock: boolean; // هل يعاد للمخزون الصالح؟
}

export interface ReturnEntry {
  id: string;
  displayNumber: string; // e.g. RET-1001
  distributorId: string;
  distributorName: string;
  date: string;
  createdAt: number;
  items: ReturnItem[];
  totalValueYER: number;
  settlementType: 'REDUCE_DEBT' | 'CASH_REFUND'; // تسوية على الدين أو رد نقدي
  reason: string; // تالف، انتهاء صلاحية، إلخ
  note?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address?: string;
  openingBalanceYER: number; // رصيد افتتاحي (مستحق له)
  active: boolean;
  createdAt: number;
}

export interface RawMaterial {
  id: string;
  name: string;
  unit: string; // كيلو، كيس، لتر، جرام
  stockQty: number; // رصيد المادة الخام الحالية (يدعم الكسور)
  minimumQty: number; // حد التنبيه
  averageCostPerUnitYER: number; // متوسط التكلفة المرجح
  active: boolean;
  createdAt: number;
}

export interface PurchaseItem {
  rawMaterialId: string;
  rawMaterialName: string;
  unit: string;
  quantity: number;
  unitCostYER: number;
  lineTotalYER: number;
}

export interface Purchase {
  id: string;
  displayNumber: string; // e.g. PUR-1001
  supplierId: string;
  supplierName: string;
  date: string;
  createdAt: number;
  items: PurchaseItem[];
  totalYER: number;
  cashPaidYER: number;
  creditYER: number;
  note?: string;
}

export interface SupplierPayment {
  id: string;
  displayNumber: string; // e.g. PAY-1001
  supplierId: string;
  supplierName: string;
  date: string;
  createdAt: number;
  amountYER: number;
  method: 'CASH' | 'TRANSFER';
  reference?: string;
  note?: string;
}

export interface RecipeItem {
  rawMaterialId: string;
  rawMaterialName: string;
  quantity: number; // الكمية المطلوبة بالوحدة
  unit: string;
}

export interface Recipe {
  id: string;
  productId: string;
  productName: string;
  name: string; // e.g. "خلطة البسبوسة الملكية - معيار 50 صحن"
  outputQty: number; // كمية المنتج الناتج
  items: RecipeItem[];
  active: boolean;
  notes?: string;
  createdAt: number;
}

export interface ProductionBatch {
  id: string;
  displayNumber: string; // e.g. BATCH-1001
  recipeId: string;
  recipeName: string;
  productId: string;
  productName: string;
  date: string;
  createdAt: number;
  plannedQty: number;
  producedQty: number; // الناتج الفعلي السليم
  damagedQty: number; // التالف أثناء الإنتاج
  totalMaterialCostYER: number;
  unitCostYER: number;
  note?: string;
}

export interface Expense {
  id: string;
  displayNumber: string; // e.g. EXP-1001
  category: string; // إيجار، ديزل وغاز، كهرباء، رواتب، صيانة، مواد تعبئة، أخرى
  amountYER: number;
  date: string;
  beneficiary?: string; // المستفيد
  note?: string;
  createdAt: number;
}

// كشف حساب الموزع
export interface DistributorLedgerItem {
  id: string;
  date: string;
  type: 'OPENING' | 'DISTRIBUTION' | 'COLLECTION' | 'RETURN' | 'MANUAL';
  description: string;
  debitYER: number; // مبالغ عليه (تزيد الدين)
  creditYER: number; // مبالغ له/سداد (تنقص الدين)
  balanceYER: number; // الرصيد التراكمي
  commissionEarnedYER: number; // العمولة المستحقة له (منفصلة)
  refNumber: string;
}

// كشف الخميس الأسبوعي
export interface ThursdayReportRow {
  distributorId: string;
  distributorName: string;
  phone: string;
  openingDebtYER: number;
  weeklyDistributionsYER: number;
  weeklyCashPaidYER: number;
  weeklyCreditYER: number;
  weeklyCollectionsYER: number;
  weeklyReturnsYER: number;
  closingDebtYER: number;
  weeklyCommissionYER: number;
}


export interface CustomerArea {
  id: string;
  governorate: string;
  district: string;
  locality: string;
  active: boolean;
  createdAt: number;
}

export interface ShopCustomer {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  governorate: string;
  district: string;
  locality: string;
  address: string;
  assignedDistributorId: string;
  openingDebtYER: number;
  active: boolean;
  notes?: string;
  createdAt: number;
}

export interface CustomerSaleItem {
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPriceYER: number;
  totalYER: number;
}

export interface CustomerSale {
  id: string;
  displayNumber: string;
  customerId: string;
  customerName: string;
  distributorId: string;
  distributorName: string;
  governorate: string;
  district: string;
  locality: string;
  date: string;
  createdAt: number;
  items: CustomerSaleItem[];
  totalYER: number;
  paidYER: number;
  creditYER: number;
  dueDate?: string;
  note?: string;
  weekKey: string;
}

export interface CustomerPayment {
  id: string;
  displayNumber: string;
  customerId: string;
  customerName: string;
  distributorId: string;
  date: string;
  createdAt: number;
  amountYER: number;
  method: 'CASH' | 'TRANSFER';
  note?: string;
}

export type SupplyRequestStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'IN_PRODUCTION' | 'READY' | 'FULFILLED' | 'CANCELLED';

export interface SupplyRequestItem {
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
}

export interface SupplyRequest {
  id: string;
  displayNumber: string;
  distributorId: string;
  distributorName: string;
  customerId?: string;
  customerName?: string;
  governorate: string;
  district: string;
  locality: string;
  requestedDate: string;
  createdAt: number;
  items: SupplyRequestItem[];
  status: SupplyRequestStatus;
  note?: string;
  reviewedAt?: number;
  reviewedBy?: string;
}


export type CustomerReturnStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export interface CustomerReturnItem {
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPriceYER: number;
  totalYER: number;
  disposition: 'DAMAGED' | 'RETURNED' | 'EXCHANGE';
}
export interface CustomerReturn {
  id: string;
  displayNumber: string;
  customerId: string;
  customerName: string;
  distributorId: string;
  distributorName: string;
  saleId?: string;
  date: string;
  createdAt: number;
  items: CustomerReturnItem[];
  totalYER: number;
  /** Amount that actually reduces the customer's debt; exchanges normally have zero credit. */
  creditYER?: number;
  reason: string;
  status: CustomerReturnStatus;
  note?: string;
  reviewedAt?: number;
  reviewedBy?: string;
}
export interface CustomerWeeklyClose {
  id: string;
  weekKey: string;
  closedAt: number;
  closedBy: string;
  customerCount: number;
  totalSalesYER: number;
  totalCollectionsYER: number;
  totalApprovedReturnsYER: number;
  customerBalances: { customerId: string; customerName: string; openingYER: number; salesCreditYER: number; paymentsYER: number; returnsYER: number; closingYER: number }[];
}
export interface DatabaseSchema {
  distributors: Distributor[];
  products: Product[];
  distributions: Distribution[];
  collections: CollectionEntry[];
  returns: ReturnEntry[];
  suppliers: Supplier[];
  rawMaterials: RawMaterial[];
  purchases: Purchase[];
  supplierPayments: SupplierPayment[];
  recipes: Recipe[];
  productionBatches: ProductionBatch[];
  expenses: Expense[];
  areas: CustomerArea[];
  customers: ShopCustomer[];
  customerSales: CustomerSale[];
  customerPayments: CustomerPayment[];
  supplyRequests: SupplyRequest[];
  customerReturns: CustomerReturn[];
  customerWeeklyCloses: CustomerWeeklyClose[];
  version: number;
}
