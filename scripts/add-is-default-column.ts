import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { Pool } from 'pg';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  console.log('Connecting to database...');
  const client = await pool.connect();
  try {
    console.log('Adding is_default column to checklist_templates table if not exists...');
    await client.query(`
      ALTER TABLE "checklist_templates" 
      ADD COLUMN IF NOT EXISTS "is_default" boolean NOT NULL DEFAULT false;
    `);
    
    // Set default on existing templates if any (mark standard template as default if name matches or first template)
    console.log('Marking standard template as default if present...');
    await client.query(`
      UPDATE "checklist_templates"
      SET "is_default" = true
      WHERE "name" LIKE '%Standard%' OR "name" LIKE '%MRPL%' OR "id" = (
        SELECT "id" FROM "checklist_templates" ORDER BY "id" ASC LIMIT 1
      );
    `);

    console.log('Migration completed successfully!');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
