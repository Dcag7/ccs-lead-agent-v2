import 'dotenv/config';
import { Client } from 'pg';

async function checkTables() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully.\n');

    // Check if companies table exists
    const companiesCheck = await client.query(`
      SELECT to_regclass('public.companies') as exists;
    `);
    const companiesExists = companiesCheck.rows[0].exists !== null;
    
    // Check if contacts table exists
    const contactsCheck = await client.query(`
      SELECT to_regclass('public.contacts') as exists;
    `);
    const contactsExists = contactsCheck.rows[0].exists !== null;

    console.log('Table existence check:');
    console.log(`  companies: ${companiesExists ? '✓ EXISTS' : '✗ MISSING'}`);
    console.log(`  contacts:  ${contactsExists ? '✓ EXISTS' : '✗ MISSING'}\n`);

    // Also check _prisma_migrations to see migration status
    const migrationCheck = await client.query(`
      SELECT migration_name, finished_at, rolled_back_at 
      FROM _prisma_migrations 
      WHERE migration_name IN (
        '20251117000000_create_companies_and_contacts',
        '20251117141703_add_company_enrichment_fields',
        '20260111001726_add_discovery_metadata_fields'
      )
      ORDER BY migration_name;
    `);

    if (migrationCheck.rows.length > 0) {
      console.log('Migration status in _prisma_migrations:');
      migrationCheck.rows.forEach((row: { migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }) => {
        const status = row.rolled_back_at ? 'ROLLED BACK' : 
                      row.finished_at ? 'APPLIED' : 'PENDING';
        console.log(`  ${row.migration_name}: ${status}`);
      });
    }

    return { companiesExists, contactsExists };
    
  } catch (error) {
    console.error('ERROR:', error instanceof Error ? error.message : String(error));
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkTables().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
