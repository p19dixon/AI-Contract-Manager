const { db } = require('./dist/db/index.js');
const fs = require('fs');

async function runMigration() {
  try {
    console.log('Running company field migration...');
    
    const migration = fs.readFileSync('./src/db/migrations/0005_add_company_field.sql', 'utf8');
    await db.execute(migration);
    
    console.log('✅ Company field migration completed');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('column "company" of relation "customers" already exists')) {
      console.log('✅ Company field already exists');
      process.exit(0);
    } else {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }
}

runMigration();