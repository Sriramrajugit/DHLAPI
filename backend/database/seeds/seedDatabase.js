const database = require('../../src/utils/database');
const { v4: uuidv4 } = require('uuid');

const seedDatabase = async () => {
  await database.initialize();
  await startSeeding();
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
        city: 'Petaling Jaya',
        postal_code: '40150',
        country_code: 'MY',
        contact_email: 'contact@abctech.com',
        contact_phone: '+6013911109'
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
        city: 'Chennai',
        postal_code: '600091',
        country_code: 'IN',
        contact_email: 'logistics@eurdist.eu',
        contact_phone: '+919840811178'
      },
      {
        deal_id: 'DEAL-004',
        contract_id: 'CONTRACT-004',
        customer_name: 'Tech Solutions France',
        address_line1: '321 Enterprise Blvd',
        city: 'Anson, Tanjong Pagar',
        postal_code: '75008',
        country_code: 'SG',
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
        const now = new Date().toISOString();

        const updateResult = await database.run(
          `UPDATE customers
           SET contract_id = ?,
               customer_name = ?,
               address_line1 = ?,
               address_line2 = ?,
               city = ?,
               postal_code = ?,
               country_code = ?,
               contact_email = ?,
               contact_phone = ?,
               updated_date = ?
           WHERE deal_id = ?`,
          [
            customer.contract_id,
            customer.customer_name,
            customer.address_line1,
            customer.address_line2 || null,
            customer.city,
            customer.postal_code,
            customer.country_code,
            customer.contact_email || null,
            customer.contact_phone || null,
            now,
            customer.deal_id
          ]
        );

        if (updateResult.changes > 0) {
          console.log(`↻ Updated customer: ${customer.customer_name}`);
        } else {
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
              now,
              now
            ]
          );
          console.log(`✓ Seeded customer: ${customer.customer_name}`);
        }
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
