const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../database/dhl_shipment.db');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;

const database = {
  initialize: async () => {
    return new Promise((resolve, reject) => {
      db = new sqlite3.Database(DB_PATH, async (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Connected to SQLite database at ${DB_PATH}`);
          try {
            await database.runMigrations();
            resolve();
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  },

  runMigrations: async () => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Customers table
        db.run(`
          CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            deal_id TEXT UNIQUE NOT NULL,
            contract_id TEXT,
            customer_name TEXT NOT NULL,
            address_line1 TEXT NOT NULL,
            address_line2 TEXT,
            city TEXT NOT NULL,
            postal_code TEXT NOT NULL,
            country_code TEXT NOT NULL,
            contact_email TEXT,
            contact_phone TEXT,
            created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_date DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) reject(err);
        });

        // Shipments table
        db.run(`
          CREATE TABLE IF NOT EXISTS shipments (
            id TEXT PRIMARY KEY,
            awb_number TEXT UNIQUE NOT NULL,
            deal_id TEXT NOT NULL,
            customer_id TEXT NOT NULL,
            shipment_reference TEXT,
            weight REAL,
            dimensions TEXT,
            piece_count INTEGER,
            status TEXT DEFAULT 'CREATED',
            confidence_score REAL,
            created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            shipped_date DATETIME,
            FOREIGN KEY(customer_id) REFERENCES customers(id)
          )
        `, (err) => {
          if (err) reject(err);
        });

        // Validation results table
        db.run(`
          CREATE TABLE IF NOT EXISTS validation_results (
            id TEXT PRIMARY KEY,
            shipment_id TEXT NOT NULL,
            validation_type TEXT NOT NULL,
            validation_score REAL,
            validation_result TEXT,
            details TEXT,
            created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(shipment_id) REFERENCES shipments(id)
          )
        `, (err) => {
          if (err) reject(err);
        });

        // Tracking table
        db.run(`
          CREATE TABLE IF NOT EXISTS tracking (
            id TEXT PRIMARY KEY,
            awb_number TEXT NOT NULL,
            status TEXT NOT NULL,
            location TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            details TEXT,
            FOREIGN KEY(awb_number) REFERENCES shipments(awb_number)
          )
        `, (err) => {
          if (err) reject(err);
        });

        // Audit logs table
        db.run(`
          CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            shipment_id TEXT,
            action TEXT NOT NULL,
            user_id TEXT,
            details TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(shipment_id) REFERENCES shipments(id)
          )
        `, (err) => {
          if (err) reject(err);
        });

        // Rules table (for validation rules)
        db.run(`
          CREATE TABLE IF NOT EXISTS validation_rules (
            id TEXT PRIMARY KEY,
            rule_name TEXT UNIQUE NOT NULL,
            rule_type TEXT NOT NULL,
            rule_config TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_date DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) reject(err);
          resolve();
        });
      });
    });
  },

  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  },

  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  close: () => {
    return new Promise((resolve, reject) => {
      if (db) {
        db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
};

module.exports = database;
