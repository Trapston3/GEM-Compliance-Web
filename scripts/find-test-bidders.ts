import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';
import { like, or } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set in environment variables');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function main() {
  console.log('Searching for test bidders...');
  const testBidders = await db.select()
    .from(schema.bidders)
    .where(
      or(
        like(schema.bidders.email, '%@example.com'),
        like(schema.bidders.email, '%test%'),
        like(schema.bidders.email, '%mock%')
      )
    );

  console.log(`Found ${testBidders.length} test bidders:`);
  for (const b of testBidders) {
    console.log(`- ID: ${b.id} | Name: ${b.name} | Email: ${b.email} | TenderID: ${b.tenderId}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
