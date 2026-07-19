import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';
import { like, or, eq } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set in environment variables');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function main() {
  console.log('Searching for test bidders to delete...');
  const testBidders = await db.select()
    .from(schema.bidders)
    .where(
      or(
        like(schema.bidders.email, '%@example.com'),
        like(schema.bidders.email, '%test%'),
        like(schema.bidders.email, '%mock%')
      )
    );

  if (testBidders.length === 0) {
    console.log('No test bidders found to delete.');
    return;
  }

  console.log(`Deleting ${testBidders.length} test bidders...`);
  for (const b of testBidders) {
    console.log(`Deleting bidder ID: ${b.id} | Name: ${b.name} | Email: ${b.email}`);
    await db.delete(schema.bidders).where(eq(schema.bidders.id, b.id));
  }
  console.log('Deletion completed.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
