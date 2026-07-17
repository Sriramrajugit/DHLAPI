const database = require('../../src/utils/database');

const initDatabase = async () => {
  try {
    console.log('Initializing database...');
    await database.initialize();
    console.log('✓ Database initialized successfully');
    console.log(`Database location: ${process.env.DATABASE_PATH || './database/dhl_shipment.db'}`);
    
    // List tables
    const tables = await database.all(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    
    console.log('\n✓ Tables created:');
    tables.forEach(t => console.log(`  - ${t.name}`));
    
    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

initDatabase();
