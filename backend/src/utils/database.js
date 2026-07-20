const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../database/dhl_shipment.json');

const DEFAULT_DATA = {
  customers: [],
  shipments: [],
  validation_results: [],
  tracking: [],
  audit_logs: [],
  validation_rules: []
};

let state = null;
let writeQueue = Promise.resolve();

const ensureStorageFile = async () => {
  const dbDir = path.dirname(DB_PATH);
  await fs.promises.mkdir(dbDir, { recursive: true });

  if (!fs.existsSync(DB_PATH)) {
    await fs.promises.writeFile(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
  }
};

const cloneDefaultData = () => JSON.parse(JSON.stringify(DEFAULT_DATA));

const persistState = async () => {
  writeQueue = writeQueue.then(() => fs.promises.writeFile(DB_PATH, JSON.stringify(state, null, 2)));
  return writeQueue;
};

const loadState = async () => {
  await ensureStorageFile();

  const raw = await fs.promises.readFile(DB_PATH, 'utf8');
  if (!raw.trim()) {
    state = cloneDefaultData();
    await persistState();
    return;
  }

  const parsed = JSON.parse(raw);
  state = {
    ...cloneDefaultData(),
    ...parsed
  };
};

const ensureInitialized = () => {
  if (!state) {
    throw new Error('Database not initialized. Call initialize() first.');
  }
};

const normalizeDealId = (value) => String(value || '').replace(/\s+/g, '').toUpperCase();

const sortByField = (items, field, direction) => {
  const multiplier = direction === 'DESC' ? -1 : 1;

  return [...items].sort((left, right) => {
    const a = left[field] ?? '';
    const b = right[field] ?? '';

    if (a === b) {
      return 0;
    }

    return a > b ? multiplier : -multiplier;
  });
};

const paginate = (items, limit, offset) => {
  const normalizedOffset = Number(offset) || 0;
  const normalizedLimit = Number(limit);

  if (!Number.isFinite(normalizedLimit)) {
    return items.slice(normalizedOffset);
  }

  return items.slice(normalizedOffset, normalizedOffset + normalizedLimit);
};

const extractTableName = (sql) => {
  const match = sql.match(/INSERT\s+INTO\s+(\w+)/i)
    || sql.match(/UPDATE\s+(\w+)\s+SET/i)
    || sql.match(/FROM\s+(\w+)/i);

  return match ? match[1] : null;
};

const upsertDefaultCollections = () => {
  for (const [key, defaultValue] of Object.entries(DEFAULT_DATA)) {
    if (!Array.isArray(state[key])) {
      state[key] = [...defaultValue];
    }
  }
};

const handleInsert = async (sql, params) => {
  const normalizedSql = sql.replace(/\s+/g, ' ').trim();
  const tableName = extractTableName(normalizedSql);
  const columnMatch = normalizedSql.match(/\(([^)]+)\)\s+VALUES/i);

  if (!tableName || !columnMatch) {
    throw new Error(`Unsupported INSERT statement: ${normalizedSql}`);
  }

  const columns = columnMatch[1].split(',').map((column) => column.trim());
  const record = {};

  columns.forEach((column, index) => {
    record[column] = params[index] ?? null;
  });

  state[tableName].push(record);
  await persistState();

  return { id: record.id ?? null, changes: 1 };
};

const handleCustomerUpdateById = async (sql, params) => {
  const match = sql.match(/UPDATE\s+customers\s+SET\s+(.+),\s*updated_date\s*=\s*\?\s+WHERE\s+id\s*=\s*\?/i);
  if (!match) {
    return null;
  }

  const assignments = match[1].split(',').map((assignment) => assignment.trim());
  const customerId = params[params.length - 1];
  const updatedDate = params[params.length - 2];
  const values = params.slice(0, params.length - 2);
  const customer = state.customers.find((entry) => entry.id === customerId);

  if (!customer) {
    return { id: null, changes: 0 };
  }

  assignments.forEach((assignment, index) => {
    const fieldMatch = assignment.match(/^(\w+)\s*=\s*\?$/);
    if (fieldMatch) {
      customer[fieldMatch[1]] = values[index];
    }
  });

  customer.updated_date = updatedDate;
  await persistState();
  return { id: customer.id, changes: 1 };
};

const handleCustomerUpdateByDealId = async (sql, params) => {
  const normalizedSql = sql.replace(/\s+/g, ' ').trim();
  if (!/UPDATE customers SET/i.test(normalizedSql) || !/WHERE deal_id = \?/i.test(normalizedSql)) {
    return null;
  }

  const customer = state.customers.find((entry) => entry.deal_id === params[params.length - 1]);
  if (!customer) {
    return { id: null, changes: 0 };
  }

  const fields = [
    'contract_id',
    'customer_name',
    'address_line1',
    'address_line2',
    'city',
    'postal_code',
    'country_code',
    'contact_email',
    'contact_phone',
    'updated_date'
  ];

  fields.forEach((field, index) => {
    customer[field] = params[index] ?? null;
  });

  await persistState();
  return { id: customer.id, changes: 1 };
};

const handleShipmentStatusUpdate = async (sql, params) => {
  const normalizedSql = sql.replace(/\s+/g, ' ').trim();
  if (!/^UPDATE shipments SET status = \?, updated_date = \? WHERE id = \?$/i.test(normalizedSql)) {
    return null;
  }

  const [status, updatedDate, shipmentId] = params;
  const shipment = state.shipments.find((entry) => entry.id === shipmentId);

  if (!shipment) {
    return { id: null, changes: 0 };
  }

  shipment.status = status;
  shipment.updated_date = updatedDate;
  await persistState();
  return { id: shipment.id, changes: 1 };
};

const handleUpdate = async (sql, params) => {
  return (await handleCustomerUpdateById(sql, params))
    || (await handleCustomerUpdateByDealId(sql, params))
    || (await handleShipmentStatusUpdate(sql, params));
};

const selectTables = () => Object.keys(DEFAULT_DATA)
  .sort()
  .map((name) => ({ name }));

const handleCustomerGet = (normalizedSql, params) => {
  if (/SELECT \* FROM customers WHERE UPPER\(REPLACE\(deal_id, ' ', ''\)\) = UPPER\(REPLACE\(\?, ' ', ''\)\)/i.test(normalizedSql)) {
    const normalizedDeal = normalizeDealId(params[0]);
    return state.customers.find((entry) => normalizeDealId(entry.deal_id) === normalizedDeal) || null;
  }

  if (/SELECT id FROM customers WHERE customer_name = \? AND city = \? AND postal_code = \?/i.test(normalizedSql)) {
    const [customerName, city, postalCode] = params;
    const customer = state.customers.find(
      (entry) => entry.customer_name === customerName && entry.city === city && entry.postal_code === postalCode
    );

    return customer ? { id: customer.id } : null;
  }

  return undefined;
};

const handleShipmentGet = (normalizedSql, params) => {
  if (/SELECT \* FROM shipments WHERE id = \?/i.test(normalizedSql)) {
    return state.shipments.find((entry) => entry.id === params[0]) || null;
  }

  if (/SELECT \* FROM shipments WHERE awb_number = \?/i.test(normalizedSql)) {
    return state.shipments.find((entry) => entry.awb_number === params[0]) || null;
  }

  return undefined;
};

const handleTrackingGet = (normalizedSql, params) => {
  if (/SELECT \* FROM tracking WHERE awb_number = \? ORDER BY timestamp DESC LIMIT 1/i.test(normalizedSql)) {
    const matches = sortByField(
      state.tracking.filter((entry) => entry.awb_number === params[0]),
      'timestamp',
      'DESC'
    );
    return matches[0] || null;
  }

  return undefined;
};

const handleGet = async (sql, params) => {
  const normalizedSql = sql.replace(/\s+/g, ' ').trim();
  const handlers = [handleCustomerGet, handleShipmentGet, handleTrackingGet];

  for (const handler of handlers) {
    const result = handler(normalizedSql, params);
    if (result !== undefined) {
      return result;
    }
  }

  throw new Error(`Unsupported SELECT statement: ${normalizedSql}`);
};

const handleCustomersAll = (normalizedSql, params) => {
  if (/SELECT \* FROM customers ORDER BY created_date DESC LIMIT \? OFFSET \?/i.test(normalizedSql)) {
    return paginate(sortByField(state.customers, 'created_date', 'DESC'), params[0], params[1]);
  }

  return undefined;
};

const handleShipmentsAll = (normalizedSql, params) => {
  if (/SELECT \* FROM shipments ORDER BY created_date DESC LIMIT \? OFFSET \?/i.test(normalizedSql)) {
    return paginate(sortByField(state.shipments, 'created_date', 'DESC'), params[0], params[1]);
  }

  if (/SELECT \* FROM shipments WHERE deal_id = \? ORDER BY created_date DESC LIMIT \? OFFSET \?/i.test(normalizedSql)) {
    const filtered = state.shipments.filter((entry) => entry.deal_id === params[0]);
    return paginate(sortByField(filtered, 'created_date', 'DESC'), params[1], params[2]);
  }

  if (/SELECT \* FROM shipments WHERE customer_id = \? ORDER BY created_date DESC LIMIT \? OFFSET \?/i.test(normalizedSql)) {
    const filtered = state.shipments.filter((entry) => entry.customer_id === params[0]);
    return paginate(sortByField(filtered, 'created_date', 'DESC'), params[1], params[2]);
  }

  return undefined;
};

const handleTrackingAll = (normalizedSql, params) => {
  if (/SELECT \* FROM tracking WHERE awb_number = \? ORDER BY timestamp ASC/i.test(normalizedSql)) {
    const filtered = state.tracking.filter((entry) => entry.awb_number === params[0]);
    return sortByField(filtered, 'timestamp', 'ASC');
  }

  return undefined;
};

const handleAuditLogsAll = (normalizedSql, params) => {
  if (/SELECT \* FROM audit_logs ORDER BY timestamp DESC LIMIT \? OFFSET \?/i.test(normalizedSql)) {
    return paginate(sortByField(state.audit_logs, 'timestamp', 'DESC'), params[0], params[1]);
  }

  if (/SELECT \* FROM audit_logs WHERE shipment_id = \? ORDER BY timestamp DESC LIMIT \? OFFSET \?/i.test(normalizedSql)) {
    const filtered = state.audit_logs.filter((entry) => entry.shipment_id === params[0]);
    return paginate(sortByField(filtered, 'timestamp', 'DESC'), params[1], params[2]);
  }

  return undefined;
};

const handleTablesAll = (normalizedSql) => {
  if (/SELECT name FROM sqlite_master WHERE type='table' ORDER BY name/i.test(normalizedSql)) {
    return selectTables();
  }

  return undefined;
};

const handleAll = async (sql, params) => {
  const normalizedSql = sql.replace(/\s+/g, ' ').trim();
  const handlers = [handleCustomersAll, handleShipmentsAll, handleTrackingAll, handleAuditLogsAll, handleTablesAll];

  for (const handler of handlers) {
    const result = handler(normalizedSql, params);
    if (result !== undefined) {
      return result;
    }
  }

  throw new Error(`Unsupported SELECT statement: ${normalizedSql}`);
};

const database = {
  initialize: async () => {
    await loadState();
    upsertDefaultCollections();
    await persistState();
    console.log(`Connected to JSON database at ${DB_PATH}`);
  },

  runMigrations: async () => {
    ensureInitialized();
    upsertDefaultCollections();
    await persistState();
  },

  run: async (sql, params = []) => {
    ensureInitialized();

    if (/^INSERT\s+INTO/i.test(sql)) {
      return handleInsert(sql, params);
    }

    if (/^UPDATE\s+/i.test(sql)) {
      const result = await handleUpdate(sql, params);
      if (result) {
        return result;
      }
    }

    throw new Error(`Unsupported write statement: ${sql.replace(/\s+/g, ' ').trim()}`);
  },

  get: async (sql, params = []) => {
    ensureInitialized();
    return handleGet(sql, params);
  },

  all: async (sql, params = []) => {
    ensureInitialized();
    return handleAll(sql, params);
  },

  close: async () => {
    if (state) {
      await persistState();
    }
  }
};

module.exports = database;
