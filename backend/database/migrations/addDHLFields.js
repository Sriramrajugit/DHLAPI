/**
 * Database Migration - Add DHL Express API Fields
 * 
 * This migration adds support for DHL Express API v3.3.1 parameters
 * to the shipments table, including shipper/receiver information,
 * product codes, and international shipment data.
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../dhl_shipment.db');

let db = null;

const openDb = async () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const closeDb = async () => {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const migrateDHLFields = async () => {
  try {
    console.log('Starting DHL API fields migration...\n');

    // Initialize database connection
    await openDb();

    // Get current shipments table schema
    const tableInfo = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(shipments)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const existingColumns = tableInfo.map(col => col.name);
    console.log('Current shipments columns:', existingColumns.join(', '));

    // Define new columns to add
    const newColumns = [
      { name: 'shipper_name', type: 'VARCHAR(255)', exists: existingColumns.includes('shipper_name') },
      { name: 'shipper_address', type: 'JSON', exists: existingColumns.includes('shipper_address') },
      { name: 'receiver_name', type: 'VARCHAR(255)', exists: existingColumns.includes('receiver_name') },
      { name: 'receiver_address', type: 'JSON', exists: existingColumns.includes('receiver_address') },
      { name: 'product_code', type: 'VARCHAR(10)', exists: existingColumns.includes('product_code') },
      { name: 'content_type', type: 'VARCHAR(50)', exists: existingColumns.includes('content_type') },
      { name: 'special_services', type: 'JSON', exists: existingColumns.includes('special_services') },
      { name: 'invoice_data', type: 'JSON', exists: existingColumns.includes('invoice_data') },
      { name: 'updated_date', type: 'DATETIME', exists: existingColumns.includes('updated_date') }
    ];

    // Add missing columns
    const columnsToAdd = newColumns.filter(col => !col.exists);
    
    if (columnsToAdd.length === 0) {
      console.log('\n✓ All DHL fields already exist. Migration skipped.');
      await closeDb();
      process.exit(0);
      return;
    }

    console.log(`\nAdding ${columnsToAdd.length} new column(s):`);

    for (const column of columnsToAdd) {
      console.log(`  - Adding ${column.name} (${column.type})`);
      await new Promise((resolve, reject) => {
        db.run(
          `ALTER TABLE shipments ADD COLUMN ${column.name} ${column.type}`,
          (err) => {
            if (err) {
              if (err.message.includes('duplicate column name')) {
                console.log(`    ⚠ Column already exists, skipping...`);
              } else {
                reject(err);
              }
            }
            resolve();
          }
        );
      });
    }

    console.log('\n✓ Migration completed successfully!');
    console.log('\nUpdated shipments table schema:');
    
    // Show updated schema
    const updatedInfo = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(shipments)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    updatedInfo.forEach(col => {
      console.log(`  - ${col.name}: ${col.type}`);
    });

    await closeDb();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await closeDb();
    process.exit(1);
  }
};

migrateDHLFields();
