import { storage } from './storage';

const SEQUENCE_KEY = 'madhaq_document_sequences_v1';
type SequenceMap = Record<string, number>;

type NumberedRecord = { displayNumber?: string };
type CreateResult = { success?: boolean } & Record<string, unknown>;

type Rule = {
  method: string;
  collection: keyof ReturnType<typeof storage.getDatabase>;
  resultKey: string;
  prefix: string;
};

const RULES: Rule[] = [
  { method: 'createDistribution', collection: 'distributions', resultKey: 'distribution', prefix: 'DST' },
  { method: 'createCollection', collection: 'collections', resultKey: 'collection', prefix: 'REC' },
  { method: 'createReturn', collection: 'returns', resultKey: 'returnEntry', prefix: 'RET' },
  { method: 'createCustomerSale', collection: 'customerSales', resultKey: 'sale', prefix: 'CS' },
  { method: 'createCustomerPayment', collection: 'customerPayments', resultKey: 'payment', prefix: 'CP' },
  { method: 'createSupplyRequest', collection: 'supplyRequests', resultKey: 'request', prefix: 'SR' },
  { method: 'createCustomerReturn', collection: 'customerReturns', resultKey: 'customerReturn', prefix: 'CR' },
  { method: 'createPurchase', collection: 'purchases', resultKey: 'purchase', prefix: 'PUR' },
  { method: 'createSupplierPayment', collection: 'supplierPayments', resultKey: 'payment', prefix: 'PAY' },
  { method: 'executeProductionBatch', collection: 'productionBatches', resultKey: 'batch', prefix: 'BATCH' },
  { method: 'createExpense', collection: 'expenses', resultKey: 'expense', prefix: 'EXP' },
];

let installed = false;

function readSequences(): SequenceMap {
  try {
    const raw = localStorage.getItem(SEQUENCE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeSequences(sequences: SequenceMap): void {
  try {
    localStorage.setItem(SEQUENCE_KEY, JSON.stringify(sequences));
  } catch (error) {
    console.warn('MADHAQ document sequence state could not be saved:', error);
  }
}

function getHighestExistingNumber(records: NumberedRecord[], prefix: string): number {
  return records.reduce((highest, record) => {
    const match = record.displayNumber?.match(new RegExp(`^${prefix}-(\\d+)$`));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 1000);
}

function persistDatabase(): void {
  try {
    localStorage.setItem('madhaq_factory_db_v1', JSON.stringify(storage.getDatabase()));
  } catch (error) {
    console.warn('MADHAQ document number repair could not be persisted:', error);
  }
}

function repairNumber(rule: Rule, record: NumberedRecord): void {
  const db = storage.getDatabase();
  const records = db[rule.collection] as unknown as NumberedRecord[];
  const sequences = readSequences();
  const initializedAt = sequences[rule.prefix];
  if (!Number.isFinite(initializedAt)) {
    sequences[rule.prefix] = getHighestExistingNumber(records, rule.prefix);
  }

  const currentNumber = Number(record.displayNumber?.match(/(\d+)$/)?.[1]);
  if (Number.isFinite(currentNumber)) {
    sequences[rule.prefix] = Math.max(sequences[rule.prefix], currentNumber);
  }

  sequences[rule.prefix] += 1;
  record.displayNumber = `${rule.prefix}-${sequences[rule.prefix]}`;
  writeSequences(sequences);
  persistDatabase();
}

/**
 * Makes human-facing document numbers monotonic even when older records are
 * deleted, imported, or reset. The existing storage methods remain the source
 * of truth for business validation; this layer only owns sequence allocation.
 */
export function installDocumentNumberIntegrity(): () => void {
  if (installed) return () => {};
  installed = true;

  const originals = new Map<string, Function>();
  for (const rule of RULES) {
    const target = storage as unknown as Record<string, unknown>;
    const original = target[rule.method];
    if (typeof original !== 'function') continue;
    originals.set(rule.method, original);
    target[rule.method] = function (this: unknown, ...args: unknown[]) {
      const result = original.apply(this, args) as CreateResult;
      if (result?.success === true && result[rule.resultKey]) {
        repairNumber(rule, result[rule.resultKey] as NumberedRecord);
      }
      return result;
    };
  }

  return () => {
    const target = storage as unknown as Record<string, unknown>;
    for (const [method, original] of originals) target[method] = original;
    installed = false;
  };
}
