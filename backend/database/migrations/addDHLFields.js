const database = require('../../src/utils/database');

const migrateDHLFields = async () => {
  try {
    console.log('Starting DHL API fields migration...\n');

    await database.initialize();
    await database.runMigrations();

    console.log('JSON storage is schema-less. Required DHL fields are already handled by the application layer.');
    console.log('\n✓ Migration completed successfully!');

    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await database.close();
    process.exit(1);
  }
};

migrateDHLFields();
