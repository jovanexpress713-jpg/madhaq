import {
  DatabaseSchema,
  Distributor,
  Product,
  Distribution,
  CollectionEntry,
  ReturnEntry,
  Supplier,
  RawMaterial,
  Purchase,
  SupplierPayment,
  Recipe,
  ProductionBatch,
  Expense,
  DistributorLedgerItem,
  ThursdayReportRow,
  CustomerArea,
  ShopCustomer,
  CustomerSale,
  CustomerPayment,
  SupplyRequest,
  SupplyRequestStatus,
  CustomerReturn,
  CustomerReturnStatus,
  CustomerWeeklyClose
} from '../types';

const STORAGE_KEY = 'madhaq_factory_db_v1';

// عملة الريال اليمني وتنسيق الأرقام
export function formatYER(amount: number): string {
  if (isNaN(amount)) return '0 ر.ي';
  return new Intl.NumberFormat('ar-YE', {
    maximumFractionDigits: 0
  }).format(Math.round(amount)) + ' ر.ي';
}

export function formatNumber(val: number, decimals = 0): string {
  if (isNaN(val)) return '0';
  return new Intl.NumberFormat('ar-YE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(val);
}

// بيانات نموذجية واقعية للتشغيل الأولي لمعمل حلويات "مذاق"
const INITIAL_DATABASE: DatabaseSchema = {
  version: 2,
  areas: [],
  customers: [],
  customerSales: [],
  customerPayments: [],
  supplyRequests: [],
  customerReturns: [],
  customerWeeklyCloses: [],
  distributors: [
    {
      id: 'dist-1',
      name: 'موزع صنعاء - الأخ عصام الشرعبي',
      phone: '771234567',
      address: 'شارع الزبيري - حدة',
      debtLimitYER: 500000,
      commissionType: 'PER_PIECE',
      commissionValue: 50, // 50 ريال لكل قطعة
      openingDebtYER: 45000,
      active: true,
      createdAt: Date.now() - 86400000 * 10
    },
    {
      id: 'dist-2',
      name: 'موزع إب - الأخ سمير العودي',
      phone: '777891011',
      address: 'السوق المركزي - إب',
      debtLimitYER: 700000,
      commissionType: 'PERCENT',
      commissionValue: 5, // 5%
      openingDebtYER: 80000,
      active: true,
      createdAt: Date.now() - 86400000 * 12
    },
    {
      id: 'dist-3',
      name: 'موزع تعز - الأخ ماجد الحمادي',
      phone: '733456789',
      address: 'الحوبان - تعز',
      debtLimitYER: 400000,
      commissionType: 'PER_PIECE',
      commissionValue: 40,
      openingDebtYER: 0,
      active: true,
      createdAt: Date.now() - 86400000 * 5
    }
  ],
  products: [
    {
      id: 'prod-1',
      name: 'بسبوسة ملكية بالقشطة والمكسرات',
      category: 'حلويات شرقية',
      unit: 'صحن',
      factoryPriceYER: 1800,
      distributorPriceYER: 2500,
      stockQty: 85,
      minimumQty: 20,
      active: true,
      createdAt: Date.now() - 86400000 * 15
    },
    {
      id: 'prod-2',
      name: 'بقلاوة تركية فستق حلبي فاخر',
      category: 'حلويات شرقية',
      unit: 'كيلو',
      factoryPriceYER: 5500,
      distributorPriceYER: 7500,
      stockQty: 42,
      minimumQty: 15,
      active: true,
      createdAt: Date.now() - 86400000 * 15
    },
    {
      id: 'prod-3',
      name: 'معمول بالتمر والسمسم الفاخر',
      category: 'معمول ونواشف',
      unit: 'علبة',
      factoryPriceYER: 1200,
      distributorPriceYER: 1800,
      stockQty: 110,
      minimumQty: 30,
      active: true,
      createdAt: Date.now() - 86400000 * 15
    },
    {
      id: 'prod-4',
      name: 'كنافة نابلسية خشنة جبن وقشطة',
      category: 'حلويات شرقية',
      unit: 'صحن',
      factoryPriceYER: 2200,
      distributorPriceYER: 3000,
      stockQty: 60,
      minimumQty: 25,
      active: true,
      createdAt: Date.now() - 86400000 * 15
    },
    {
      id: 'prod-5',
      name: 'بيتيفور مشكل زبدة وشوكولاتة',
      category: 'حلويات غربية',
      unit: 'كيلو',
      factoryPriceYER: 2800,
      distributorPriceYER: 4000,
      stockQty: 35,
      minimumQty: 15,
      active: true,
      createdAt: Date.now() - 86400000 * 15
    }
  ],
  rawMaterials: [
    {
      id: 'raw-1',
      name: 'دقيق أبيض فاخر (كويتي)',
      unit: 'كيس (50كجم)',
      stockQty: 18,
      minimumQty: 5,
      averageCostPerUnitYER: 24000,
      active: true,
      createdAt: Date.now() - 86400000 * 20
    },
    {
      id: 'raw-2',
      name: 'سمن بلدي بقري ممتاز',
      unit: 'كيلو',
      stockQty: 45,
      minimumQty: 10,
      averageCostPerUnitYER: 8500,
      active: true,
      createdAt: Date.now() - 86400000 * 20
    },
    {
      id: 'raw-3',
      name: 'فستق حلبي أخضر نخب أول',
      unit: 'كيلو',
      stockQty: 22.5,
      minimumQty: 5,
      averageCostPerUnitYER: 16000,
      active: true,
      createdAt: Date.now() - 86400000 * 20
    },
    {
      id: 'raw-4',
      name: 'سكر ناعم صافي',
      unit: 'كيس (50كجم)',
      stockQty: 12,
      minimumQty: 4,
      averageCostPerUnitYER: 29000,
      active: true,
      createdAt: Date.now() - 86400000 * 20
    },
    {
      id: 'raw-5',
      name: 'سميد بسبوسة ناعم',
      unit: 'كيس (25كجم)',
      stockQty: 25,
      minimumQty: 6,
      averageCostPerUnitYER: 14500,
      active: true,
      createdAt: Date.now() - 86400000 * 20
    },
    {
      id: 'raw-6',
      name: 'قشطة طازجة للحلويات',
      unit: 'سطل (5كجم)',
      stockQty: 14,
      minimumQty: 5,
      averageCostPerUnitYER: 9500,
      active: true,
      createdAt: Date.now() - 86400000 * 20
    },
    {
      id: 'raw-7',
      name: 'عجينة كنافة شعر طازجة',
      unit: 'كيلو',
      stockQty: 30,
      minimumQty: 10,
      averageCostPerUnitYER: 1100,
      active: true,
      createdAt: Date.now() - 86400000 * 20
    },
    {
      id: 'raw-8',
      name: 'كرتون وتغليف مذاق مطبوع',
      unit: 'حبة',
      stockQty: 450,
      minimumQty: 100,
      averageCostPerUnitYER: 120,
      active: true,
      createdAt: Date.now() - 86400000 * 20
    }
  ],
  suppliers: [
    {
      id: 'supp-1',
      name: 'شركة البركة لتجارة الدقيق والمواد الغذائية',
      phone: '770112233',
      address: 'باب اليمن - صنعاء',
      openingBalanceYER: 120000,
      active: true,
      createdAt: Date.now() - 86400000 * 30
    },
    {
      id: 'supp-2',
      name: 'مؤسسة السمن والمكسرات الذهبية',
      phone: '772334455',
      address: 'شارع تعز - الأصبحي',
      openingBalanceYER: 85000,
      active: true,
      createdAt: Date.now() - 86400000 * 30
    },
    {
      id: 'supp-3',
      name: 'مطابع الأمانة لعلب وتغليف الحلويات',
      phone: '711998877',
      address: 'شارع بغداد',
      openingBalanceYER: 35000,
      active: true,
      createdAt: Date.now() - 86400000 * 30
    }
  ],
  recipes: [
    {
      id: 'rec-1',
      productId: 'prod-1',
      productName: 'بسبوسة ملكية بالقشطة والمكسرات',
      name: 'معيار طبخة بسبوسة (50 صحن)',
      outputQty: 50,
      items: [
        { rawMaterialId: 'raw-5', rawMaterialName: 'سميد بسبوسة ناعم', quantity: 0.5, unit: 'كيس (25كجم)' },
        { rawMaterialId: 'raw-2', rawMaterialName: 'سمن بلدي بقري ممتاز', quantity: 3.5, unit: 'كيلو' },
        { rawMaterialId: 'raw-4', rawMaterialName: 'سكر ناعم صافي', quantity: 0.15, unit: 'كيس (50كجم)' },
        { rawMaterialId: 'raw-6', rawMaterialName: 'قشطة طازجة للحلويات', quantity: 2, unit: 'سطل (5كجم)' },
        { rawMaterialId: 'raw-8', rawMaterialName: 'كرتون وتغليف مذاق مطبوع', quantity: 50, unit: 'حبة' }
      ],
      active: true,
      notes: 'تخبز على درجة حرارة 180 مئوية وتسقى بالشيرة الباردة فور خروجها.',
      createdAt: Date.now() - 86400000 * 14
    },
    {
      id: 'rec-2',
      productId: 'prod-2',
      productName: 'بقلاوة تركية فستق حلبي فاخر',
      name: 'معيار صينية بقلاوة فستق (20 كيلو)',
      outputQty: 20,
      items: [
        { rawMaterialId: 'raw-1', rawMaterialName: 'دقيق أبيض فاخر (كويتي)', quantity: 0.2, unit: 'كيس (50كجم)' },
        { rawMaterialId: 'raw-2', rawMaterialName: 'سمن بلدي بقري ممتاز', quantity: 4.5, unit: 'كيلو' },
        { rawMaterialId: 'raw-3', rawMaterialName: 'فستق حلبي أخضر نخب أول', quantity: 3.5, unit: 'كيلو' },
        { rawMaterialId: 'raw-4', rawMaterialName: 'سكر ناعم صافي', quantity: 0.1, unit: 'كيس (50كجم)' },
        { rawMaterialId: 'raw-8', rawMaterialName: 'كرتون وتغليف مذاق مطبوع', quantity: 20, unit: 'حبة' }
      ],
      active: true,
      notes: 'توريق بطبقات رقيقة وسمن فائر.',
      createdAt: Date.now() - 86400000 * 14
    }
  ],
  distributions: [
    {
      id: 'dst-1001',
      displayNumber: 'DST-1001',
      distributorId: 'dist-1',
      distributorName: 'موزع صنعاء - الأخ عصام الشرعبي',
      date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
      createdAt: Date.now() - 86400000 * 2,
      items: [
        {
          productId: 'prod-1',
          productName: 'بسبوسة ملكية بالقشطة والمكسرات',
          unit: 'صحن',
          quantity: 20,
          unitPriceYER: 2500,
          commissionTypeSnapshot: 'PER_PIECE',
          commissionValueSnapshot: 50,
          commissionYER: 1000,
          totalYER: 50000
        },
        {
          productId: 'prod-3',
          productName: 'معمول بالتمر والسمسم الفاخر',
          unit: 'علبة',
          quantity: 15,
          unitPriceYER: 1800,
          commissionTypeSnapshot: 'PER_PIECE',
          commissionValueSnapshot: 50,
          commissionYER: 750,
          totalYER: 27000
        }
      ],
      grossYER: 77000,
      cashPaidYER: 27000,
      creditYER: 50000,
      totalCommissionYER: 1750,
      note: 'تسليم جولة المصباحي والسبعين'
    },
    {
      id: 'dst-1002',
      displayNumber: 'DST-1002',
      distributorId: 'dist-2',
      distributorName: 'موزع إب - الأخ سمير العودي',
      date: new Date(Date.now() - 86400000 * 1).toISOString().slice(0, 10),
      createdAt: Date.now() - 86400000 * 1,
      items: [
        {
          productId: 'prod-2',
          productName: 'بقلاوة تركية فستق حلبي فاخر',
          unit: 'كيلو',
          quantity: 8,
          unitPriceYER: 7500,
          commissionTypeSnapshot: 'PERCENT',
          commissionValueSnapshot: 5,
          commissionYER: 3000,
          totalYER: 60000
        },
        {
          productId: 'prod-4',
          productName: 'كنافة نابلسية خشنة جبن وقشطة',
          unit: 'صحن',
          quantity: 10,
          unitPriceYER: 3000,
          commissionTypeSnapshot: 'PERCENT',
          commissionValueSnapshot: 5,
          commissionYER: 1500,
          totalYER: 30000
        }
      ],
      grossYER: 90000,
      cashPaidYER: 30000,
      creditYER: 60000,
      totalCommissionYER: 4500,
      note: 'إرسالية حافلة النقل السريع'
    }
  ],
  collections: [
    {
      id: 'rec-1001',
      displayNumber: 'REC-1001',
      distributorId: 'dist-1',
      distributorName: 'موزع صنعاء - الأخ عصام الشرعبي',
      date: new Date(Date.now() - 86400000 * 1).toISOString().slice(0, 10),
      createdAt: Date.now() - 86400000 * 1,
      amountYER: 35000,
      method: 'CASH',
      reference: 'سند قبض 412',
      note: 'سداد دفعة من الحساب نقداً'
    }
  ],
  returns: [
    {
      id: 'ret-1001',
      displayNumber: 'RET-1001',
      distributorId: 'dist-1',
      distributorName: 'موزع صنعاء - الأخ عصام الشرعبي',
      date: new Date(Date.now() - 86400000 * 1).toISOString().slice(0, 10),
      createdAt: Date.now() - 86400000 * 1,
      items: [
        {
          productId: 'prod-1',
          productName: 'بسبوسة ملكية بالقشطة والمكسرات',
          quantity: 1,
          unitPriceYER: 2500,
          totalYER: 2500,
          restock: false
        }
      ],
      totalValueYER: 2500,
      settlementType: 'REDUCE_DEBT',
      reason: 'كسر في العلبة أثناء التوزيع',
      note: 'تم الخصم من الدين وإتلاف العلبة'
    }
  ],
  purchases: [
    {
      id: 'pur-1001',
      displayNumber: 'PUR-1001',
      supplierId: 'supp-1',
      supplierName: 'شركة البركة لتجارة الدقيق والمواد الغذائية',
      date: new Date(Date.now() - 86400000 * 4).toISOString().slice(0, 10),
      createdAt: Date.now() - 86400000 * 4,
      items: [
        {
          rawMaterialId: 'raw-1',
          rawMaterialName: 'دقيق أبيض فاخر (كويتي)',
          unit: 'كيس (50كجم)',
          quantity: 10,
          unitCostYER: 24000,
          lineTotalYER: 240000
        },
        {
          rawMaterialId: 'raw-4',
          rawMaterialName: 'سكر ناعم صافي',
          unit: 'كيس (50كجم)',
          quantity: 5,
          unitCostYER: 29000,
          lineTotalYER: 145000
        }
      ],
      totalYER: 385000,
      cashPaidYER: 185000,
      creditYER: 200000,
      note: 'فاتورة توريد الدقيق والسكر للدفعة الأسبوعية'
    }
  ],
  supplierPayments: [
    {
      id: 'pay-1001',
      displayNumber: 'PAY-1001',
      supplierId: 'supp-1',
      supplierName: 'شركة البركة لتجارة الدقيق والمواد الغذائية',
      date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
      createdAt: Date.now() - 86400000 * 2,
      amountYER: 100000,
      method: 'TRANSFER',
      reference: 'حوالة النجم 981244',
      note: 'سداد دفعة من الحساب'
    }
  ],
  productionBatches: [
    {
      id: 'batch-1001',
      displayNumber: 'BATCH-1001',
      recipeId: 'rec-1',
      recipeName: 'معيار طبخة بسبوسة (50 صحن)',
      productId: 'prod-1',
      productName: 'بسبوسة ملكية بالقشطة والمكسرات',
      date: new Date(Date.now() - 86400000 * 3).toISOString().slice(0, 10),
      createdAt: Date.now() - 86400000 * 3,
      plannedQty: 50,
      producedQty: 48,
      damagedQty: 2,
      totalMaterialCostYER: 62000,
      unitCostYER: 1291,
      note: 'وردية الصباح - تم إدخال 48 صحن للمخزون'
    }
  ],
  expenses: [
    {
      id: 'exp-1001',
      displayNumber: 'EXP-1001',
      category: 'ديزل وغاز للأفران',
      amountYER: 32000,
      date: new Date(Date.now() - 86400000 * 3).toISOString().slice(0, 10),
      beneficiary: 'محطة الصباح للغاز',
      note: 'تعبئة أسطوانات غاز الفرن الرئيسي',
      createdAt: Date.now() - 86400000 * 3
    },
    {
      id: 'exp-1002',
      displayNumber: 'EXP-1002',
      category: 'أجور عمالة يومية',
      amountYER: 15000,
      date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
      beneficiary: 'عمال التعبئة والخبز',
      note: 'أجور إضافية وردية المساء',
      createdAt: Date.now() - 86400000 * 2
    }
  ]
};

class StorageService {
  private db: DatabaseSchema;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.db = this.load();
  }

  private load(): DatabaseSchema {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version) {
          return {
            ...parsed,
            areas: Array.isArray(parsed.areas) ? parsed.areas : [],
            customers: Array.isArray(parsed.customers) ? parsed.customers : [],
            customerSales: Array.isArray(parsed.customerSales) ? parsed.customerSales : [],
            customerPayments: Array.isArray(parsed.customerPayments) ? parsed.customerPayments : [],
            supplyRequests: Array.isArray(parsed.supplyRequests) ? parsed.supplyRequests : [],
            customerReturns: Array.isArray(parsed.customerReturns) ? parsed.customerReturns : [],
            customerWeeklyCloses: Array.isArray(parsed.customerWeeklyCloses) ? parsed.customerWeeklyCloses : [],
            version: 3
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load DB from localStorage, fallback to seed', e);
    }
    this.saveToStorage(INITIAL_DATABASE);
    return INITIAL_DATABASE;
  }

  private saveToStorage(data: DatabaseSchema): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save DB to localStorage', e);
    }
  }

  private commit(): void {
    this.saveToStorage(this.db);
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error(err);
      }
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getDatabase(): DatabaseSchema {
    return this.db;
  }

  // ===================== الموزعون (DISTRIBUTORS) =====================
  public getDistributors(): Distributor[] {
    return [...this.db.distributors];
  }

  public getDistributorById(id: string): Distributor | undefined {
    return this.db.distributors.find((d) => d.id === id);
  }

  public saveDistributor(distributor: Omit<Distributor, 'id' | 'createdAt'> & { id?: string }): Distributor {
    if (distributor.id) {
      const idx = this.db.distributors.findIndex((d) => d.id === distributor.id);
      if (idx !== -1) {
        this.db.distributors[idx] = {
          ...this.db.distributors[idx],
          ...distributor
        };
        this.commit();
        return this.db.distributors[idx];
      }
    }
    const newDist: Distributor = {
      ...distributor,
      id: 'dist-' + Date.now(),
      createdAt: Date.now()
    };
    this.db.distributors.unshift(newDist);
    this.commit();
    return newDist;
  }

  public deleteDistributor(id: string): boolean {
    // التحقق مما إذا كان مرتبطًا بحركات
    const hasDistributions = this.db.distributions.some((d) => d.distributorId === id);
    const hasCollections = this.db.collections.some((c) => c.distributorId === id);
    if (hasDistributions || hasCollections) {
      // فقط نقوم بتعطيله حفاظًا على الأمان المحاسبي
      const dist = this.db.distributors.find((d) => d.id === id);
      if (dist) {
        dist.active = false;
        this.commit();
        return true;
      }
      return false;
    }
    this.db.distributors = this.db.distributors.filter((d) => d.id !== id);
    this.commit();
    return true;
  }

  // حساب كشف ورصيد الموزع بدقة محاسبية (دين بضاعة + عمولة منفصلة)
  public getDistributorFinancials(distributorId: string) {
    const dist = this.getDistributorById(distributorId);
    if (!dist) {
      return {
        openingDebt: 0,
        currentDebt: 0,
        totalPurchasesGross: 0,
        totalCashPaid: 0,
        totalCreditTaken: 0,
        totalCollected: 0,
        totalReturnsReduced: 0,
        totalCommissionsEarned: 0,
        isOverLimit: false,
        debtLimit: 0
      };
    }

    const openingDebt = dist.openingDebtYER || 0;
    const distributions = this.db.distributions.filter((d) => d.distributorId === distributorId);
    const collections = this.db.collections.filter((c) => c.distributorId === distributorId);
    const returns = this.db.returns.filter((r) => r.distributorId === distributorId);

    const totalPurchasesGross = distributions.reduce((sum, d) => sum + d.grossYER, 0);
    const totalCashPaid = distributions.reduce((sum, d) => sum + d.cashPaidYER, 0);
    const totalCreditTaken = distributions.reduce((sum, d) => sum + d.creditYER, 0);
    const totalCollected = collections.reduce((sum, c) => sum + c.amountYER, 0);
    const totalReturnsReduced = returns
      .filter((r) => r.settlementType === 'REDUCE_DEBT')
      .reduce((sum, r) => sum + r.totalValueYER, 0);

    const totalCommissionsEarned = distributions.reduce((sum, d) => sum + (d.totalCommissionYER || 0), 0);

    // الدين = رصيد افتتاحي + إجمالي الآجل من التوزيعات - إجمالي التحصيلات - إجمالي المرتجعات المعتمدة على الدين
    const currentDebt = openingDebt + totalCreditTaken - totalCollected - totalReturnsReduced;
    const isOverLimit = dist.debtLimitYER > 0 && currentDebt > dist.debtLimitYER;

    return {
      openingDebt,
      currentDebt,
      totalPurchasesGross,
      totalCashPaid,
      totalCreditTaken,
      totalCollected,
      totalReturnsReduced,
      totalCommissionsEarned,
      isOverLimit,
      debtLimit: dist.debtLimitYER
    };
  }

  // كشف حساب الموزع التفصيلي مرتب زمنيًا
  public getDistributorLedger(distributorId: string): DistributorLedgerItem[] {
    const dist = this.getDistributorById(distributorId);
    if (!dist) return [];

    const items: DistributorLedgerItem[] = [];
    let runningBalance = dist.openingDebtYER || 0;

    // رصيد افتتاحي
    if (dist.openingDebtYER > 0) {
      items.push({
        id: 'op-' + dist.id,
        date: new Date(dist.createdAt).toISOString().slice(0, 10),
        type: 'OPENING',
        description: 'رصيد افتتاحي سابق',
        debitYER: dist.openingDebtYER,
        creditYER: 0,
        balanceYER: runningBalance,
        commissionEarnedYER: 0,
        refNumber: 'افتتاحي'
      });
    }

    // جمع الحركات
    const dists = this.db.distributions.filter((d) => d.distributorId === distributorId);
    const colls = this.db.collections.filter((c) => c.distributorId === distributorId);
    const rets = this.db.returns.filter((r) => r.distributorId === distributorId);

    const combined = [
      ...dists.map((d) => ({
        timestamp: d.createdAt,
        type: 'DISTRIBUTION' as const,
        data: d
      })),
      ...colls.map((c) => ({
        timestamp: c.createdAt,
        type: 'COLLECTION' as const,
        data: c
      })),
      ...rets.map((r) => ({
        timestamp: r.createdAt,
        type: 'RETURN' as const,
        data: r
      }))
    ].sort((a, b) => a.timestamp - b.timestamp);

    for (const item of combined) {
      if (item.type === 'DISTRIBUTION') {
        const d = item.data as Distribution;
        runningBalance += d.creditYER;
        items.push({
          id: d.id,
          date: d.date,
          type: 'DISTRIBUTION',
          description: `فاتورة توزيع بضاعة (${d.items.length} صنف) - مسدد نقدًا: ${formatYER(d.cashPaidYER)}`,
          debitYER: d.creditYER,
          creditYER: 0,
          balanceYER: runningBalance,
          commissionEarnedYER: d.totalCommissionYER,
          refNumber: d.displayNumber
        });
      } else if (item.type === 'COLLECTION') {
        const c = item.data as CollectionEntry;
        runningBalance -= c.amountYER;
        items.push({
          id: c.id,
          date: c.date,
          type: 'COLLECTION',
          description: `سند قبض تحصيل (${c.method === 'CASH' ? 'نقدًا' : c.method === 'TRANSFER' ? 'حوالة' : 'شيك'}) ${c.reference ? '- مرجع: ' + c.reference : ''}`,
          debitYER: 0,
          creditYER: c.amountYER,
          balanceYER: runningBalance,
          commissionEarnedYER: 0,
          refNumber: c.displayNumber
        });
      } else if (item.type === 'RETURN') {
        const r = item.data as ReturnEntry;
        if (r.settlementType === 'REDUCE_DEBT') {
          runningBalance -= r.totalValueYER;
          items.push({
            id: r.id,
            date: r.date,
            type: 'RETURN',
            description: `إشعار مرتجع بضاعة - ${r.reason || 'تالف أو مسترجع'}`,
            debitYER: 0,
            creditYER: r.totalValueYER,
            balanceYER: runningBalance,
            commissionEarnedYER: 0,
            refNumber: r.displayNumber
          });
        }
      }
    }

    return items;
  }

  // ===================== المنتجات (PRODUCTS) =====================
  public getProducts(): Product[] {
    return [...this.db.products];
  }

  public getProductById(id: string): Product | undefined {
    return this.db.products.find((p) => p.id === id);
  }

  public saveProduct(prod: Omit<Product, 'id' | 'createdAt'> & { id?: string }): Product {
    if (prod.id) {
      const idx = this.db.products.findIndex((p) => p.id === prod.id);
      if (idx !== -1) {
        this.db.products[idx] = {
          ...this.db.products[idx],
          ...prod
        };
        this.commit();
        return this.db.products[idx];
      }
    }
    const newProd: Product = {
      ...prod,
      id: 'prod-' + Date.now(),
      createdAt: Date.now()
    };
    this.db.products.unshift(newProd);
    this.commit();
    return newProd;
  }

  public updateProductStock(productId: string, delta: number): void {
    const p = this.db.products.find((item) => item.id === productId);
    if (p) {
      p.stockQty = Math.max(0, p.stockQty + delta);
      this.commit();
    }
  }

  public deleteProduct(id: string): boolean {
    const hasDistributions = this.db.distributions.some((d) => d.items.some((i) => i.productId === id));
    if (hasDistributions) {
      const prod = this.db.products.find((p) => p.id === id);
      if (prod) {
        prod.active = false;
        this.commit();
        return true;
      }
      return false;
    }
    this.db.products = this.db.products.filter((p) => p.id !== id);
    this.commit();
    return true;
  }

  // ===================== التوزيع (DISTRIBUTIONS) =====================
  public getDistributions(): Distribution[] {
    return [...this.db.distributions];
  }

  public createDistribution(data: {
    distributorId: string;
    date: string;
    items: {
      productId: string;
      quantity: number;
      unitPriceYER?: number;
    }[];
    cashPaidYER: number;
    note?: string;
  }): { success: boolean; error?: string; distribution?: Distribution } {
    const dist = this.getDistributorById(data.distributorId);
    if (!dist) return { success: false, error: 'الموزع غير موجود' };

    // فحص المخزون وتجهيز البنود مع لقطة العمولة المحفوظة
    const processedItems: Distribution['items'] = [];
    let grossYER = 0;
    let totalCommissionYER = 0;

    for (const item of data.items) {
      const prod = this.getProductById(item.productId);
      if (!prod) return { success: false, error: `المنتج رقم ${item.productId} غير موجود` };
      if (prod.stockQty < item.quantity) {
        return {
          success: false,
          error: `المخزون غير كافٍ للصنف (${prod.name}). المتاح: ${prod.stockQty} ${prod.unit}، والمطلوب: ${item.quantity}`
        };
      }

      const unitPriceYER = item.unitPriceYER ?? prod.distributorPriceYER;
      const lineTotal = item.quantity * unitPriceYER;
      grossYER += lineTotal;

      // حساب العمولة حسب إعدادات الموزع
      let commissionYER = 0;
      if (dist.commissionType === 'PER_PIECE') {
        commissionYER = item.quantity * dist.commissionValue;
      } else {
        commissionYER = (lineTotal * dist.commissionValue) / 100;
      }
      totalCommissionYER += commissionYER;

      processedItems.push({
        productId: prod.id,
        productName: prod.name,
        unit: prod.unit,
        quantity: item.quantity,
        unitPriceYER,
        commissionTypeSnapshot: dist.commissionType,
        commissionValueSnapshot: dist.commissionValue,
        commissionYER,
        totalYER: lineTotal
      });
    }

    const cashPaidYER = Math.min(grossYER, Math.max(0, data.cashPaidYER));
    const creditYER = grossYER - cashPaidYER;

    // فحص سقف الدين
    const fin = this.getDistributorFinancials(dist.id);
    if (dist.debtLimitYER > 0 && fin.currentDebt + creditYER > dist.debtLimitYER) {
      const allowed = Math.max(0, dist.debtLimitYER - fin.currentDebt);
      return {
        success: false,
        error: `تجاوز سقف الدين للموزع (${dist.name})! سقف الدين: ${formatYER(dist.debtLimitYER)}، الدين الحالي: ${formatYER(fin.currentDebt)}، الآجل المسموح به كحد أقصى: ${formatYER(allowed)}`
      };
    }

    // خصم المخزون
    for (const item of processedItems) {
      this.updateProductStock(item.productId, -item.quantity);
    }

    const nextSeq = this.db.distributions.length + 1001;
    const newDist: Distribution = {
      id: 'dst-' + Date.now(),
      displayNumber: `DST-${nextSeq}`,
      distributorId: dist.id,
      distributorName: dist.name,
      date: data.date,
      createdAt: Date.now(),
      items: processedItems,
      grossYER,
      cashPaidYER,
      creditYER,
      totalCommissionYER,
      note: data.note
    };

    this.db.distributions.unshift(newDist);
    this.commit();
    return { success: true, distribution: newDist };
  }

  // ===================== التحصيلات (COLLECTIONS) =====================
  public getCollections(): CollectionEntry[] {
    return [...this.db.collections];
  }

  public createCollection(data: {
    distributorId: string;
    amountYER: number;
    method: 'CASH' | 'TRANSFER' | 'CHEQUE';
    date: string;
    reference?: string;
    note?: string;
  }): { success: boolean; error?: string; collection?: CollectionEntry } {
    const dist = this.getDistributorById(data.distributorId);
    if (!dist) return { success: false, error: 'الموزع غير موجود' };
    if (data.amountYER <= 0) return { success: false, error: 'يرجى إدخال مبلغ تحصيل صحيح أكبر من صفر' };

    const nextSeq = this.db.collections.length + 1001;
    const newCol: CollectionEntry = {
      id: 'rec-' + Date.now(),
      displayNumber: `REC-${nextSeq}`,
      distributorId: dist.id,
      distributorName: dist.name,
      date: data.date,
      createdAt: Date.now(),
      amountYER: data.amountYER,
      method: data.method,
      reference: data.reference,
      note: data.note
    };

    this.db.collections.unshift(newCol);
    this.commit();
    return { success: true, collection: newCol };
  }

  // ===================== المرتجعات (RETURNS) =====================
  public getReturns(): ReturnEntry[] {
    return [...this.db.returns];
  }

  public createReturn(data: {
    distributorId: string;
    date: string;
    items: {
      productId: string;
      quantity: number;
      restock: boolean;
    }[];
    settlementType: 'REDUCE_DEBT' | 'CASH_REFUND';
    reason: string;
    note?: string;
  }): { success: boolean; error?: string; returnEntry?: ReturnEntry } {
    const dist = this.getDistributorById(data.distributorId);
    if (!dist) return { success: false, error: 'الموزع غير موجود' };

    let totalValueYER = 0;
    const returnItems: ReturnEntry['items'] = [];

    for (const it of data.items) {
      const prod = this.getProductById(it.productId);
      if (!prod) continue;
      const itemTotal = it.quantity * prod.distributorPriceYER;
      totalValueYER += itemTotal;

      if (it.restock) {
        this.updateProductStock(prod.id, it.quantity);
      }

      returnItems.push({
        productId: prod.id,
        productName: prod.name,
        quantity: it.quantity,
        unitPriceYER: prod.distributorPriceYER,
        totalYER: itemTotal,
        restock: it.restock
      });
    }

    const nextSeq = this.db.returns.length + 1001;
    const newRet: ReturnEntry = {
      id: 'ret-' + Date.now(),
      displayNumber: `RET-${nextSeq}`,
      distributorId: dist.id,
      distributorName: dist.name,
      date: data.date,
      createdAt: Date.now(),
      items: returnItems,
      totalValueYER,
      settlementType: data.settlementType,
      reason: data.reason,
      note: data.note
    };

    this.db.returns.unshift(newRet);
    this.commit();
    return { success: true, returnEntry: newRet };
  }


  // ===================== العملاء والبقالات وحساباتهم =====================
  public getAreas(): CustomerArea[] { return [...this.db.areas]; }

  public saveArea(data: Omit<CustomerArea, 'id' | 'createdAt'> & { id?: string }): CustomerArea {
    const duplicate = this.db.areas.find(a =>
      a.id !== data.id && a.governorate === data.governorate &&
      a.district.trim() === data.district.trim() && a.locality.trim() === data.locality.trim()
    );
    if (duplicate) return duplicate;
    if (data.id) {
      const existing = this.db.areas.find(a => a.id === data.id);
      if (existing) {
        Object.assign(existing, data);
        this.commit();
        return existing;
      }
    }
    const area: CustomerArea = { ...data, id: 'area-' + Date.now(), createdAt: Date.now() };
    this.db.areas.unshift(area);
    this.commit();
    return area;
  }

  public getCustomers(): ShopCustomer[] { return [...this.db.customers]; }
  public getCustomerById(id: string): ShopCustomer | undefined {
    return this.db.customers.find(c => c.id === id);
  }

  public saveCustomer(data: Omit<ShopCustomer, 'id' | 'createdAt'> & { id?: string }): { success: boolean; error?: string; customer?: ShopCustomer } {
    if (!data.name.trim()) return { success: false, error: 'اسم البقالة مطلوب' };
    if (!data.governorate.trim() || !data.district.trim() || !data.locality.trim()) {
      return { success: false, error: 'المحافظة والمديرية والمنطقة/القرية مطلوبة' };
    }
    if (!this.getDistributorById(data.assignedDistributorId)) return { success: false, error: 'اختر الموزع المسؤول عن البقالة' };
    const duplicate = this.db.customers.find(c => c.id !== data.id &&
      ((data.phone && c.phone === data.phone) ||
       (c.name.trim().toLowerCase() === data.name.trim().toLowerCase() &&
        c.district === data.district && c.locality === data.locality)));
    if (duplicate) return { success: false, error: 'توجد بقالة مشابهة بالاسم أو الهاتف؛ راجع السجل قبل إنشاء سجل جديد' };
    if (data.id) {
      const existing = this.getCustomerById(data.id);
      if (existing) {
        Object.assign(existing, data);
        this.commit();
        return { success: true, customer: existing };
      }
    }
    const customer: ShopCustomer = { ...data, id: 'shop-' + Date.now(), createdAt: Date.now() };
    this.db.customers.unshift(customer);
    this.commit();
    return { success: true, customer };
  }

  public getCustomerBalance(customerId: string): number {
    const customer = this.getCustomerById(customerId);
    if (!customer) return 0;
    const sales = this.db.customerSales.filter(s => s.customerId === customerId).reduce((sum, s) => sum + s.creditYER, 0);
    const payments = this.db.customerPayments.filter(p => p.customerId === customerId).reduce((sum, p) => sum + p.amountYER, 0);
    const approvedReturns = (this.db.customerReturns || []).filter(r => r.customerId === customerId && r.status === 'APPROVED').reduce((sum, r) => sum + (r.creditYER ?? r.totalYER), 0);
    return (customer.openingDebtYER || 0) + sales - payments - approvedReturns;
  }

  public getCustomerSales(customerId?: string): CustomerSale[] {
    return this.db.customerSales.filter(s => !customerId || s.customerId === customerId).slice().sort((a,b) => b.createdAt-a.createdAt);
  }

  public createCustomerSale(data: {
    customerId: string; distributorId: string; date: string;
    items: { productId: string; quantity: number; unitPriceYER?: number }[];
    paidYER: number; dueDate?: string; note?: string;
  }): { success: boolean; error?: string; sale?: CustomerSale } {
    const customer = this.getCustomerById(data.customerId);
    const distributor = this.getDistributorById(data.distributorId);
    if (!customer || !customer.active) return { success: false, error: 'البقالة غير موجودة أو غير مفعلة' };
    if (!distributor || !distributor.active) return { success: false, error: 'الموزع غير موجود أو غير مفعل' };
    if (customer.assignedDistributorId !== distributor.id) return { success: false, error: 'هذه البقالة مسندة إلى موزع آخر' };
    if (!data.items.length) return { success: false, error: 'أضف صنفاً واحداً على الأقل' };
    let totalYER = 0;
    const items: CustomerSale['items'] = [];
    for (const row of data.items) {
      const product = this.getProductById(row.productId);
      if (!product || !Number.isFinite(row.quantity) || row.quantity <= 0) return { success: false, error: 'تحقق من الصنف والكمية؛ يجب أن تكون الكمية أكبر من صفر' };
      const unitPriceYER = row.unitPriceYER ?? product.distributorPriceYER;
      if (!Number.isFinite(unitPriceYER) || unitPriceYER < 0) return { success: false, error: 'سعر البيع غير صحيح' };
      const line = row.quantity * unitPriceYER;
      totalYER += line;
      items.push({ productId: product.id, productName: product.name, unit: product.unit, quantity: row.quantity, unitPriceYER, totalYER: line });
    }
    if (!Number.isFinite(data.paidYER) || data.paidYER < 0 || data.paidYER > totalYER) return { success: false, error: 'المبلغ المدفوع يجب أن يكون بين صفر وإجمالي الفاتورة' };
    const creditYER = totalYER - data.paidYER;
    const currentDebt = this.getCustomerBalance(customer.id);
    const nextSeq = this.db.customerSales.length + 1001;
    const dateObj = new Date(data.date + 'T12:00:00');
    const monday = new Date(dateObj);
    const day = (monday.getDay() + 6) % 7;
    monday.setDate(monday.getDate() - day);
    const weekKey = monday.toISOString().slice(0,10);
    const sale: CustomerSale = {
      id: 'csale-' + Date.now(), displayNumber: 'CS-' + nextSeq,
      customerId: customer.id, customerName: customer.name,
      distributorId: distributor.id, distributorName: distributor.name,
      governorate: customer.governorate, district: customer.district, locality: customer.locality,
      date: data.date, createdAt: Date.now(), items, totalYER, paidYER: data.paidYER,
      creditYER, dueDate: data.dueDate, note: data.note, weekKey
    };
    this.db.customerSales.unshift(sale);
    this.commit();
    return { success: true, sale };
  }

  public getCustomerPayments(customerId?: string): CustomerPayment[] {
    return this.db.customerPayments.filter(p => !customerId || p.customerId === customerId).slice().sort((a,b) => b.createdAt-a.createdAt);
  }

  public createCustomerPayment(data: {
    customerId: string; distributorId: string; date: string;
    amountYER: number; method: 'CASH' | 'TRANSFER'; note?: string;
  }): { success: boolean; error?: string; payment?: CustomerPayment } {
    const customer = this.getCustomerById(data.customerId);
    if (!customer) return { success: false, error: 'البقالة غير موجودة' };
    if (customer.assignedDistributorId !== data.distributorId) return { success: false, error: 'لا يحق لهذا الموزع تسجيل تحصيل لهذه البقالة' };
    if (!Number.isFinite(data.amountYER) || data.amountYER <= 0) return { success: false, error: 'أدخل مبلغ تحصيل أكبر من صفر' };
    const balance = this.getCustomerBalance(customer.id);
    if (data.amountYER > balance) return { success: false, error: 'مبلغ التحصيل أكبر من رصيد البقالة الحالي' };
    let amountToAllocate = data.amountYER;
    const openingAlreadyPaid = this.db.customerPayments.filter(p => p.customerId === customer.id).reduce((sum,p) => sum + (p.openingDebtAppliedYER || 0), 0);
    const openingDebtRemaining = Math.max(0, (customer.openingDebtYER || 0) - openingAlreadyPaid);
    const openingDebtAppliedYER = Math.min(amountToAllocate, openingDebtRemaining);
    amountToAllocate -= openingDebtAppliedYER;
    const allocations: { saleId: string; amountYER: number }[] = [];
    const oldestSales = this.db.customerSales.filter(s => s.customerId === customer.id).slice().sort((a,b) => a.createdAt-b.createdAt);
    for (const sale of oldestSales) {
      if (amountToAllocate <= 0) break;
      const previouslyAllocated = this.db.customerPayments.reduce((sum,p) => sum + (p.allocations || []).filter(a=>a.saleId===sale.id).reduce((n,a)=>n+a.amountYER,0),0);
      const outstanding = Math.max(0, sale.creditYER - previouslyAllocated);
      if (outstanding <= 0) continue;
      const amount = Math.min(amountToAllocate, outstanding);
      allocations.push({saleId:sale.id,amountYER:amount});
      amountToAllocate -= amount;
    }
    const payment: CustomerPayment = {
      id: 'cpay-' + Date.now(), displayNumber: 'CP-' + (this.db.customerPayments.length + 1001),
      customerId: customer.id, customerName: customer.name, distributorId: data.distributorId,
      date: data.date, createdAt: Date.now(), amountYER: data.amountYER, method: data.method,
      allocations, openingDebtAppliedYER, note: data.note
    };
    this.db.customerPayments.unshift(payment);
    this.commit();
    return { success: true, payment };
  }

  public getSupplyRequests(distributorId?: string): SupplyRequest[] {
    return this.db.supplyRequests.filter(r => !distributorId || r.distributorId === distributorId).slice().sort((a,b) => b.createdAt-a.createdAt);
  }

  public createSupplyRequest(data: {
    distributorId: string; customerId?: string; governorate: string; district: string; locality: string;
    requestedDate: string; items: { productId: string; quantity: number }[]; note?: string;
  }): { success: boolean; error?: string; request?: SupplyRequest } {
    const distributor = this.getDistributorById(data.distributorId);
    if (!distributor) return { success: false, error: 'الموزع غير موجود' };
    if (!data.items.length) return { success: false, error: 'أضف صنفاً واحداً على الأقل للطلب' };
    const customer = data.customerId ? this.getCustomerById(data.customerId) : undefined;
    if (data.customerId && !customer) return { success: false, error: 'البقالة المحددة غير موجودة' };
    const items: SupplyRequest['items'] = [];
    for (const row of data.items) {
      const product = this.getProductById(row.productId);
      if (!product || !Number.isFinite(row.quantity) || row.quantity <= 0) return { success: false, error: 'تحقق من الأصناف والكميات المطلوبة' };
      items.push({ productId: product.id, productName: product.name, unit: product.unit, quantity: row.quantity });
    }
    const request: SupplyRequest = {
      id: 'sreq-' + Date.now(), displayNumber: 'SR-' + (this.db.supplyRequests.length + 1001),
      distributorId: distributor.id, distributorName: distributor.name, customerId: customer?.id, customerName: customer?.name,
      governorate: data.governorate, district: data.district, locality: data.locality,
      requestedDate: data.requestedDate, createdAt: Date.now(), items, status: 'SUBMITTED', note: data.note
    };
    this.db.supplyRequests.unshift(request);
    this.commit();
    return { success: true, request };
  }

  public updateSupplyRequestStatus(id: string, status: SupplyRequestStatus, reviewedBy = 'المدير'): { success: boolean; error?: string } {
    const request = this.db.supplyRequests.find(r => r.id === id);
    if (!request) return { success: false, error: 'الطلب غير موجود' };
    const allowed: Record<SupplyRequestStatus, SupplyRequestStatus[]> = {
      SUBMITTED: ['APPROVED','REJECTED','CANCELLED'],
      APPROVED: ['IN_PRODUCTION','READY','CANCELLED'],
      REJECTED: [], IN_PRODUCTION: ['READY','CANCELLED'], READY: ['FULFILLED','CANCELLED'],
      FULFILLED: [], CANCELLED: []
    };
    if (!allowed[request.status].includes(status)) return { success: false, error: 'انتقال حالة الطلب غير مسموح' };
    request.status = status;
    request.reviewedAt = Date.now();
    request.reviewedBy = reviewedBy;
    this.commit();
    return { success: true };
  }


  // ===================== مرتجعات وتالف العملاء =====================
  public getCustomerReturns(customerId?: string): CustomerReturn[] {
    return (this.db.customerReturns || []).filter(r => !customerId || r.customerId === customerId).slice().sort((a,b) => b.createdAt-a.createdAt);
  }

  public createCustomerReturn(data: {
    customerId: string; distributorId: string; date: string; saleId?: string;
    items: { productId: string; quantity: number; disposition: 'DAMAGED'|'RETURNED'|'EXCHANGE' }[];
    reason: string; note?: string;
  }): { success: boolean; error?: string; customerReturn?: CustomerReturn } {
    const customer = this.getCustomerById(data.customerId);
    const distributor = this.getDistributorById(data.distributorId);
    if (!customer || !distributor || customer.assignedDistributorId !== distributor.id) {
      return { success:false, error:'البقالة أو الموزع غير صحيح' };
    }
    if (!data.items.length || !data.reason.trim()) return { success:false, error:'أدخل الأصناف وسبب المرتجع أو التالف' };

    const sourceSale = data.saleId ? this.db.customerSales.find(x => x.id === data.saleId) : undefined;
    if (data.saleId && (!sourceSale || sourceSale.customerId !== customer.id)) {
      return { success:false, error:'الفاتورة الأصلية غير موجودة أو لا تخص هذه البقالة' };
    }
    const items: CustomerReturn['items'] = [];
    let totalYER = 0;
    let creditYER = 0;
    const requestedByProduct = new Map<string, number>();
    for (const row of data.items) {
      if (!['DAMAGED','RETURNED','EXCHANGE'].includes(row.disposition)) return { success:false, error:'نوع الحركة غير صحيح' };
      if (!Number.isFinite(row.quantity) || row.quantity <= 0) return { success:false, error:'تحقق من الصنف والكمية' };
      requestedByProduct.set(row.productId, (requestedByProduct.get(row.productId) || 0) + row.quantity);
    }

    for (const [productId, requestedQty] of requestedByProduct) {
      const product = this.getProductById(productId);
      if (!product) return { success:false, error:'يوجد صنف غير موجود في الحركة' };
      let soldQty = 0;
      if (sourceSale) {
        soldQty = sourceSale.items.filter(i => i.productId === productId).reduce((n,i)=>n+i.quantity,0);
      } else {
        soldQty = this.db.customerSales.filter(s => s.customerId === customer.id)
          .reduce((sum,s) => sum + s.items.filter(i => i.productId === productId).reduce((n,i)=>n+i.quantity,0),0);
      }
      const previouslyCreditedQty = this.db.customerReturns
        .filter(r => r.customerId === customer.id && r.status !== 'REJECTED' && (sourceSale ? r.saleId === sourceSale.id : true))
        .reduce((sum,r)=>sum+r.items.filter(i=>i.productId===productId).reduce((n,i)=>n+i.quantity,0),0);
      if (requestedQty + previouslyCreditedQty > soldQty) {
        return { success:false, error:`كمية المرتجع للصنف (${product.name}) تتجاوز الكمية المسجلة بيعاً للعميل` };
      }
    }

    for (const row of data.items) {
      const product = this.getProductById(row.productId)!;
      const sourceLines = sourceSale
        ? sourceSale.items.filter(i => i.productId === product.id)
        : this.db.customerSales.filter(s => s.customerId === customer.id)
            .flatMap(s => s.items.filter(i => i.productId === product.id));
      const sourceQty = sourceLines.reduce((n,i)=>n+i.quantity,0);
      const sourceValue = sourceLines.reduce((n,i)=>n+i.quantity*i.unitPriceYER,0);
      const unitPriceYER = sourceQty > 0 ? sourceValue / sourceQty : product.distributorPriceYER;
      const total = unitPriceYER * row.quantity;
      totalYER += total;
      // An exchange provides replacement goods, so it must not also reduce the customer's debt.
      if (row.disposition !== 'EXCHANGE') creditYER += total;
      items.push({
        productId:product.id, productName:product.name, unit:product.unit,
        quantity:row.quantity, unitPriceYER, totalYER:total, disposition:row.disposition
      });
    }
    const entry: CustomerReturn = {
      id:'cret-' + Date.now(), displayNumber:'CR-' + (this.db.customerReturns.length + 1001),
      customerId:customer.id, customerName:customer.name, distributorId:distributor.id, distributorName:distributor.name,
      saleId:data.saleId, date:data.date, createdAt:Date.now(), items, totalYER, creditYER,
      reason:data.reason.trim(), status:'PENDING', note:data.note
    };
    this.db.customerReturns.unshift(entry);
    this.commit();
    return { success:true, customerReturn:entry };
  }

  public reviewCustomerReturn(id: string, status: Extract<CustomerReturnStatus,'APPROVED'|'REJECTED'>, reviewedBy='المدير'): {success:boolean;error?:string} {
    const entry = this.db.customerReturns.find(r => r.id === id);
    if (!entry) return {success:false,error:'حركة المرتجع غير موجودة'};
    if (entry.status !== 'PENDING') return {success:false,error:'تمت مراجعة هذه الحركة مسبقاً'};
    // Returns from a shop go back to the distributor, not directly into the factory's finished stock.
    // Factory stock was already reduced when the distributor's load was issued.
    entry.status=status; entry.reviewedAt=Date.now(); entry.reviewedBy=reviewedBy;
    this.commit();
    return {success:true};
  }

  // ===================== الإقفال الأسبوعي للعملاء =====================
  public getCustomerWeeklyCloses(): CustomerWeeklyClose[] {
    return (this.db.customerWeeklyCloses || []).slice().sort((a,b)=>b.weekKey.localeCompare(a.weekKey));
  }

  public closeCustomerWeek(weekKey: string, closedBy='المدير'): {success:boolean;error?:string;close?:CustomerWeeklyClose} {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekKey)) return {success:false,error:'تاريخ بداية الأسبوع غير صحيح'};
    if (this.db.customerWeeklyCloses.some(c=>c.weekKey===weekKey)) return {success:false,error:'تم إقفال هذا الأسبوع سابقاً؛ لا يمكن تكرار الإقفال'};
    const start = new Date(weekKey + 'T00:00:00');
    const end = new Date(start); end.setDate(end.getDate()+6);
    const endKey = end.getFullYear()+'-'+String(end.getMonth()+1).padStart(2,'0')+'-'+String(end.getDate()).padStart(2,'0');
    const activeCustomers = this.db.customers.filter(c=>c.active);
    const customerBalances = activeCustomers.map(c=>{
      const sales = this.db.customerSales.filter(x=>x.customerId===c.id && x.date>=weekKey && x.date<=endKey);
      const payments = this.db.customerPayments.filter(x=>x.customerId===c.id && x.date>=weekKey && x.date<=endKey);
      const returns = this.db.customerReturns.filter(x=>x.customerId===c.id && x.status==='APPROVED' && x.date>=weekKey && x.date<=endKey);
      const priorSales = this.db.customerSales.filter(x=>x.customerId===c.id && x.date<weekKey).reduce((n,x)=>n+x.creditYER,0);
      const priorPayments = this.db.customerPayments.filter(x=>x.customerId===c.id && x.date<weekKey).reduce((n,x)=>n+x.amountYER,0);
      const priorReturns = this.db.customerReturns.filter(x=>x.customerId===c.id && x.status==='APPROVED' && x.date<weekKey).reduce((n,x)=>n+(x.creditYER ?? x.totalYER),0);
      const openingYER=(c.openingDebtYER||0)+priorSales-priorPayments-priorReturns;
      const salesCreditYER=sales.reduce((n,x)=>n+x.creditYER,0);
      const paymentsYER=payments.reduce((n,x)=>n+x.amountYER,0);
      const returnsYER=returns.reduce((n,x)=>n+x.totalYER,0);
      return {customerId:c.id,customerName:c.name,openingYER,salesCreditYER,paymentsYER,returnsYER,closingYER:openingYER+salesCreditYER-paymentsYER-returnsYER};
    });
    const sales=this.db.customerSales.filter(x=>x.date>=weekKey&&x.date<=endKey);
    const payments=this.db.customerPayments.filter(x=>x.date>=weekKey&&x.date<=endKey);
    const returns=this.db.customerReturns.filter(x=>x.status==='APPROVED'&&x.date>=weekKey&&x.date<=endKey);
    const close: CustomerWeeklyClose={
      id:'cweek-'+weekKey,weekKey,closedAt:Date.now(),closedBy,customerCount:activeCustomers.length,
      totalSalesYER:sales.reduce((n,x)=>n+x.totalYER,0),
      totalCollectionsYER:payments.reduce((n,x)=>n+x.amountYER,0),
      totalApprovedReturnsYER:returns.reduce((n,x)=>n+(x.creditYER ?? x.totalYER),0),
      customerBalances
    };
    this.db.customerWeeklyCloses.unshift(close);
    this.commit();
    return {success:true,close};
  }

  // ===================== الموردون (SUPPLIERS) =====================
  public getSuppliers(): Supplier[] {
    return [...this.db.suppliers];
  }

  public getSupplierById(id: string): Supplier | undefined {
    return this.db.suppliers.find((s) => s.id === id);
  }

  public saveSupplier(supp: Omit<Supplier, 'id' | 'createdAt'> & { id?: string }): Supplier {
    if (supp.id) {
      const idx = this.db.suppliers.findIndex((s) => s.id === supp.id);
      if (idx !== -1) {
        this.db.suppliers[idx] = { ...this.db.suppliers[idx], ...supp };
        this.commit();
        return this.db.suppliers[idx];
      }
    }
    const newSupp: Supplier = {
      ...supp,
      id: 'supp-' + Date.now(),
      createdAt: Date.now()
    };
    this.db.suppliers.unshift(newSupp);
    this.commit();
    return newSupp;
  }

  public getSupplierFinancials(supplierId: string) {
    const supp = this.getSupplierById(supplierId);
    if (!supp) return { openingBalance: 0, currentBalance: 0, totalPurchases: 0, totalPaid: 0 };

    const purchases = this.db.purchases.filter((p) => p.supplierId === supplierId);
    const payments = this.db.supplierPayments.filter((p) => p.supplierId === supplierId);

    const totalPurchases = purchases.reduce((sum, p) => sum + p.totalYER, 0);
    const totalCreditTaken = purchases.reduce((sum, p) => sum + p.creditYER, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amountYER, 0);

    const currentBalance = (supp.openingBalanceYER || 0) + totalCreditTaken - totalPaid;

    return {
      openingBalance: supp.openingBalanceYER || 0,
      currentBalance,
      totalPurchases,
      totalPaid
    };
  }

  // ===================== المواد الخام (RAW MATERIALS) =====================
  public getRawMaterials(): RawMaterial[] {
    return [...this.db.rawMaterials];
  }

  public getRawMaterialById(id: string): RawMaterial | undefined {
    return this.db.rawMaterials.find((r) => r.id === id);
  }

  public saveRawMaterial(raw: Omit<RawMaterial, 'id' | 'createdAt'> & { id?: string }): RawMaterial {
    if (raw.id) {
      const idx = this.db.rawMaterials.findIndex((r) => r.id === raw.id);
      if (idx !== -1) {
        this.db.rawMaterials[idx] = { ...this.db.rawMaterials[idx], ...raw };
        this.commit();
        return this.db.rawMaterials[idx];
      }
    }
    const newRaw: RawMaterial = {
      ...raw,
      id: 'raw-' + Date.now(),
      createdAt: Date.now()
    };
    this.db.rawMaterials.unshift(newRaw);
    this.commit();
    return newRaw;
  }

  public updateRawMaterialStock(rawMaterialId: string, deltaQty: number, unitCostYER?: number): void {
    const raw = this.db.rawMaterials.find((r) => r.id === rawMaterialId);
    if (raw) {
      if (deltaQty > 0 && unitCostYER && unitCostYER > 0) {
        // تحديث متوسط التكلفة المرجح
        const currentTotalCost = raw.stockQty * raw.averageCostPerUnitYER;
        const newBatchCost = deltaQty * unitCostYER;
        const totalNewQty = raw.stockQty + deltaQty;
        raw.averageCostPerUnitYER = Math.round((currentTotalCost + newBatchCost) / totalNewQty);
      }
      raw.stockQty = Math.max(0, +(raw.stockQty + deltaQty).toFixed(3));
      this.commit();
    }
  }

  // ===================== المشتريات (PURCHASES) =====================
  public getPurchases(): Purchase[] {
    return [...this.db.purchases];
  }

  public createPurchase(data: {
    supplierId: string;
    date: string;
    items: {
      rawMaterialId: string;
      quantity: number;
      unitCostYER: number;
    }[];
    cashPaidYER: number;
    note?: string;
  }): { success: boolean; error?: string; purchase?: Purchase } {
    const supp = this.getSupplierById(data.supplierId);
    if (!supp) return { success: false, error: 'المورد غير موجود' };
    if (!data.items.length) return { success: false, error: 'يرجى إضافة مادة خام واحدة على الأقل' };

    let totalYER = 0;
    const processedItems: Purchase['items'] = [];

    for (const it of data.items) {
      const raw = this.getRawMaterialById(it.rawMaterialId);
      if (!raw) continue;
      const lineTotal = it.quantity * it.unitCostYER;
      totalYER += lineTotal;

      processedItems.push({
        rawMaterialId: raw.id,
        rawMaterialName: raw.name,
        unit: raw.unit,
        quantity: it.quantity,
        unitCostYER: it.unitCostYER,
        lineTotalYER: lineTotal
      });

      // زيادة مخزون المادة وتحديث متوسط التكلفة
      this.updateRawMaterialStock(raw.id, it.quantity, it.unitCostYER);
    }

    const cashPaidYER = Math.min(totalYER, Math.max(0, data.cashPaidYER));
    const creditYER = totalYER - cashPaidYER;

    const nextSeq = this.db.purchases.length + 1001;
    const newPur: Purchase = {
      id: 'pur-' + Date.now(),
      displayNumber: `PUR-${nextSeq}`,
      supplierId: supp.id,
      supplierName: supp.name,
      date: data.date,
      createdAt: Date.now(),
      items: processedItems,
      totalYER,
      cashPaidYER,
      creditYER,
      note: data.note
    };

    this.db.purchases.unshift(newPur);
    this.commit();
    return { success: true, purchase: newPur };
  }

  // ===================== سداد الموردين (SUPPLIER PAYMENTS) =====================
  public getSupplierPayments(): SupplierPayment[] {
    return [...this.db.supplierPayments];
  }

  public createSupplierPayment(data: {
    supplierId: string;
    date: string;
    amountYER: number;
    method: 'CASH' | 'TRANSFER';
    reference?: string;
    note?: string;
  }): { success: boolean; error?: string; payment?: SupplierPayment } {
    const supp = this.getSupplierById(data.supplierId);
    if (!supp) return { success: false, error: 'المورد غير موجود' };
    if (data.amountYER <= 0) return { success: false, error: 'يرجى إدخال مبلغ سداد صحيح' };

    const nextSeq = this.db.supplierPayments.length + 1001;
    const newPay: SupplierPayment = {
      id: 'pay-' + Date.now(),
      displayNumber: `PAY-${nextSeq}`,
      supplierId: supp.id,
      supplierName: supp.name,
      date: data.date,
      createdAt: Date.now(),
      amountYER: data.amountYER,
      method: data.method,
      reference: data.reference,
      note: data.note
    };

    this.db.supplierPayments.unshift(newPay);
    this.commit();
    return { success: true, payment: newPay };
  }

  // ===================== الوصفات (RECIPES) =====================
  public getRecipes(): Recipe[] {
    return [...this.db.recipes];
  }

  public getRecipeById(id: string): Recipe | undefined {
    return this.db.recipes.find((r) => r.id === id);
  }

  public saveRecipe(recipe: Omit<Recipe, 'id' | 'createdAt'> & { id?: string }): Recipe {
    if (recipe.id) {
      const idx = this.db.recipes.findIndex((r) => r.id === recipe.id);
      if (idx !== -1) {
        this.db.recipes[idx] = { ...this.db.recipes[idx], ...recipe };
        this.commit();
        return this.db.recipes[idx];
      }
    }
    const newRec: Recipe = {
      ...recipe,
      id: 'rec-' + Date.now(),
      createdAt: Date.now()
    };
    this.db.recipes.unshift(newRec);
    this.commit();
    return newRec;
  }

  public calculateRecipeCost(recipe: Recipe): number {
    let total = 0;
    for (const it of recipe.items) {
      const raw = this.getRawMaterialById(it.rawMaterialId);
      if (raw) {
        total += it.quantity * raw.averageCostPerUnitYER;
      }
    }
    return Math.round(total);
  }

  // ===================== دفعات الإنتاج (PRODUCTION BATCHES) =====================
  public getProductionBatches(): ProductionBatch[] {
    return [...this.db.productionBatches];
  }

  public executeProductionBatch(data: {
    recipeId: string;
    date: string;
    multiplier: number; // مثلاً 1 تعني معيار واحد للطبخة، 2 تعني مضاعفة الطبخة
    producedQty: number; // الناتج الفعلي السليم
    damagedQty: number; // الهالك أو التالف
    note?: string;
  }): { success: boolean; error?: string; batch?: ProductionBatch } {
    const recipe = this.getRecipeById(data.recipeId);
    if (!recipe) return { success: false, error: 'الوصفة غير موجودة' };
    const prod = this.getProductById(recipe.productId);
    if (!prod) return { success: false, error: 'المنتج النهائي غير موجود' };

    const factor = Math.max(0.1, data.multiplier);

    // التحقق من كفاية المواد الخام
    for (const item of recipe.items) {
      const raw = this.getRawMaterialById(item.rawMaterialId);
      if (!raw) return { success: false, error: `المادة الخام (${item.rawMaterialName}) غير موجودة` };
      const needed = item.quantity * factor;
      if (raw.stockQty < needed) {
        return {
          success: false,
          error: `المخزون غير كافٍ للمادة الخام (${raw.name}). المتاح: ${raw.stockQty} ${raw.unit}، والمطلوب: ${needed} ${raw.unit}`
        };
      }
    }

    // خصم المواد الخام وحساب تكلفة الخامات المستهلكة
    let totalMaterialCostYER = 0;
    for (const item of recipe.items) {
      const raw = this.getRawMaterialById(item.rawMaterialId)!;
      const needed = item.quantity * factor;
      totalMaterialCostYER += needed * raw.averageCostPerUnitYER;
      this.updateRawMaterialStock(raw.id, -needed);
    }

    // إضافة المنتج النهائي الصالح للمخزون
    this.updateProductStock(prod.id, data.producedQty);

    const plannedQty = Math.round(recipe.outputQty * factor);
    const unitCostYER = data.producedQty > 0 ? Math.round(totalMaterialCostYER / data.producedQty) : 0;

    const nextSeq = this.db.productionBatches.length + 1001;
    const newBatch: ProductionBatch = {
      id: 'batch-' + Date.now(),
      displayNumber: `BATCH-${nextSeq}`,
      recipeId: recipe.id,
      recipeName: recipe.name,
      productId: prod.id,
      productName: prod.name,
      date: data.date,
      createdAt: Date.now(),
      plannedQty,
      producedQty: data.producedQty,
      damagedQty: data.damagedQty,
      totalMaterialCostYER: Math.round(totalMaterialCostYER),
      unitCostYER,
      note: data.note
    };

    this.db.productionBatches.unshift(newBatch);
    this.commit();
    return { success: true, batch: newBatch };
  }

  // ===================== المصروفات (EXPENSES) =====================
  public getExpenses(): Expense[] {
    return [...this.db.expenses];
  }

  public createExpense(data: {
    category: string;
    amountYER: number;
    date: string;
    beneficiary?: string;
    note?: string;
  }): { success: boolean; error?: string; expense?: Expense } {
    if (data.amountYER <= 0) return { success: false, error: 'يرجى إدخال مبلغ صحيح' };

    const nextSeq = this.db.expenses.length + 1001;
    const newExp: Expense = {
      id: 'exp-' + Date.now(),
      displayNumber: `EXP-${nextSeq}`,
      category: data.category,
      amountYER: data.amountYER,
      date: data.date,
      beneficiary: data.beneficiary,
      note: data.note,
      createdAt: Date.now()
    };

    this.db.expenses.unshift(newExp);
    this.commit();
    return { success: true, expense: newExp };
  }

  // ===================== الصندوق وحركة النقدية =====================
  public getCashboxSummary() {
    // التدفقات النقدية الداخلة:
    // 1. مبالغ المقبوض نقدًا من فواتير التوزيع
    const distCash = this.db.distributions.reduce((s, d) => s + (d.cashPaidYER || 0), 0);
    // 2. سندات التحصيل النقدية
    const colCash = this.db.collections
      .filter((c) => c.method === 'CASH')
      .reduce((s, c) => s + c.amountYER, 0);

    const totalCashIn = distCash + colCash;

    // التدفقات النقدية الخارجة:
    // 1. المشتريات المسددة نقدًا
    const purCash = this.db.purchases.reduce((s, p) => s + (p.cashPaidYER || 0), 0);
    // 2. سداد الموردين نقدًا
    const suppCash = this.db.supplierPayments
      .filter((p) => p.method === 'CASH')
      .reduce((s, p) => s + p.amountYER, 0);
    // 3. المصروفات التشغيلية
    const expCash = this.db.expenses.reduce((s, e) => s + e.amountYER, 0);

    const totalCashOut = purCash + suppCash + expCash;
    const netCashBalance = totalCashIn - totalCashOut;

    return {
      distCash,
      colCash,
      totalCashIn,
      purCash,
      suppCash,
      expCash,
      totalCashOut,
      netCashBalance
    };
  }

  // ===================== كشف الخميس الأسبوعي المعتمد =====================
  public getThursdayReport(startDate: string, endDate: string): ThursdayReportRow[] {
    return this.db.distributors
      .filter((d) => d.active)
      .map((dist) => {
        // حركات ما قبل الفترة للرصيد الافتتاحي لهذه الفترة
        const prevDists = this.db.distributions.filter(
          (d) => d.distributorId === dist.id && d.date < startDate
        );
        const prevColls = this.db.collections.filter(
          (c) => c.distributorId === dist.id && c.date < startDate
        );
        const prevRets = this.db.returns.filter(
          (r) => r.distributorId === dist.id && r.date < startDate && r.settlementType === 'REDUCE_DEBT'
        );

        const prevCredit = prevDists.reduce((s, d) => s + d.creditYER, 0);
        const prevCollected = prevColls.reduce((s, c) => s + c.amountYER, 0);
        const prevReturned = prevRets.reduce((s, r) => s + r.totalValueYER, 0);

        const openingDebtYER = (dist.openingDebtYER || 0) + prevCredit - prevCollected - prevReturned;

        // حركات الفترة الحالية
        const periodDists = this.db.distributions.filter(
          (d) => d.distributorId === dist.id && d.date >= startDate && d.date <= endDate
        );
        const periodColls = this.db.collections.filter(
          (c) => c.distributorId === dist.id && c.date >= startDate && c.date <= endDate
        );
        const periodRets = this.db.returns.filter(
          (r) => r.distributorId === dist.id && r.date >= startDate && r.date <= endDate && r.settlementType === 'REDUCE_DEBT'
        );

        const weeklyDistributionsYER = periodDists.reduce((s, d) => s + d.grossYER, 0);
        const weeklyCashPaidYER = periodDists.reduce((s, d) => s + d.cashPaidYER, 0);
        const weeklyCreditYER = periodDists.reduce((s, d) => s + d.creditYER, 0);
        const weeklyCollectionsYER = periodColls.reduce((s, c) => s + c.amountYER, 0);
        const weeklyReturnsYER = periodRets.reduce((s, r) => s + r.totalValueYER, 0);
        const weeklyCommissionYER = periodDists.reduce((s, d) => s + (d.totalCommissionYER || 0), 0);

        const closingDebtYER = openingDebtYER + weeklyCreditYER - weeklyCollectionsYER - weeklyReturnsYER;

        return {
          distributorId: dist.id,
          distributorName: dist.name,
          phone: dist.phone,
          openingDebtYER,
          weeklyDistributionsYER,
          weeklyCashPaidYER,
          weeklyCreditYER,
          weeklyCollectionsYER,
          weeklyReturnsYER,
          closingDebtYER,
          weeklyCommissionYER
        };
      });
  }

  // ===================== النسخ الاحتياطي والاستعادة =====================
  public exportBackupJSON(): string {
    return JSON.stringify(this.db, null, 2);
  }

  public importBackupJSON(jsonStr: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || !Array.isArray(parsed.distributors) || !Array.isArray(parsed.products)) {
        return { success: false, error: 'الملف غير صالح أو لا يحتوي على بنية بيانات نظام مذاق' };
      }
      this.db = {
        ...parsed,
        areas: Array.isArray(parsed.areas) ? parsed.areas : [],
        customers: Array.isArray(parsed.customers) ? parsed.customers : [],
        customerSales: Array.isArray(parsed.customerSales) ? parsed.customerSales : [],
        customerPayments: Array.isArray(parsed.customerPayments) ? parsed.customerPayments : [],
        supplyRequests: Array.isArray(parsed.supplyRequests) ? parsed.supplyRequests : [],
        customerReturns: Array.isArray(parsed.customerReturns) ? parsed.customerReturns : [],
        customerWeeklyCloses: Array.isArray(parsed.customerWeeklyCloses) ? parsed.customerWeeklyCloses : [],
        version: 3
      };
      this.commit();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: 'خطأ في معالجة ملف النسخ الاحتياطي: ' + e?.message };
    }
  }

  public resetToDefault(): void {
    this.db = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    this.commit();
  }
}

export const storage = new StorageService();
