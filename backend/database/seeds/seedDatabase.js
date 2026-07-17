const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '../dhl_shipment.db');

let db = null;

const database = {
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

const seedDatabase = async () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, async (err) => {
      if (err) {
        reject(err);
      } else {
        try {
          await startSeeding();
          resolve();
        } catch (error) {
          reject(error);
        }
      }
    });
  });
};

const startSeeding = async () => {
  try {
    // Sample customer data
    const customers = [
      {
        deal_id: 'DEAL-001',
        contract_id: 'CONTRACT-001',
        customer_name: 'ABC Technologies Ltd',
        address_line1: '123 Tech Street',
        address_line2: 'Suite 100',
        city: 'Berlin',
        postal_code: '10115',
        country_code: 'DE',
        contact_email: 'contact@abctech.com',
        contact_phone: '+49-30-123-4567'
      },
      {
        deal_id: 'DEAL-002',
        contract_id: 'CONTRACT-002',
        customer_name: 'Global Supplies Inc',
        address_line1: '456 Industrial Ave',
        city: 'London',
        postal_code: 'SW1A 1AA',
        country_code: 'GB',
        contact_email: 'info@globalsupplies.com',
        contact_phone: '+44-20-7946-0958'
      },
      {
        deal_id: 'DEAL-003',
        contract_id: 'CONTRACT-003',
        customer_name: 'European Distributors',
        address_line1: '789 Commerce Road',
        city: 'Amsterdam',
        postal_code: '1012 NX',
        country_code: 'NL',
        contact_email: 'logistics@eurdist.eu',
        contact_phone: '+31-20-123-4567'
      },
      {
        deal_id: 'DEAL-004',
        contract_id: 'CONTRACT-004',
        customer_name: 'Tech Solutions France',
        address_line1: '321 Enterprise Blvd',
        city: 'Paris',
        postal_code: '75008',
        country_code: 'FR',
        contact_email: 'contact@techfr.com',
        contact_phone: '+33-1-42-68-53-00'
      },
      {
        deal_id: 'DEAL-005',
        contract_id: 'CONTRACT-005',
        customer_name: 'Iberian Trading Co',
        address_line1: '654 Commercial Plaza',
        city: 'Madrid',
        postal_code: '28001',
        country_code: 'ES',
        contact_email: 'sales@iberiantrading.es',
        contact_phone: '+34-91-123-4567'
      }
    ];

    console.log('Seeding customers...');
    for (const customer of customers) {
      try {
        await database.run(
          `INSERT INTO customers 
           (id, deal_id, contract_id, customer_name, address_line1, address_line2, 
            city, postal_code, country_code, contact_email, contact_phone, created_date, updated_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            customer.deal_id,
            customer.contract_id,
            customer.customer_name,
            customer.address_line1,
            customer.address_line2 || null,
            customer.city,
            customer.postal_code,
            customer.country_code,
            customer.contact_email || null,
            customer.contact_phone || null,
            new Date().toISOString(),
            new Date().toISOString()
          ]
        );
        console.log(`✓ Seeded customer: ${customer.customer_name}`);
      } catch (err) {
        if (err.message.includes('UNIQUE')) {
          console.log(`⊘ Customer ${customer.customer_name} already exists`);
        } else {
          console.error(`Error seeding ${customer.customer_name}:`, err.message);
        }
      }
    }

    console.log('✓ Database seeding completed');
    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Execute seeding
seedDatabase().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
