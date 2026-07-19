import './env'; // Ensure env vars are loaded before loading database modules!
import { db, users, tenders } from '../../src/db';
import { eq, or } from 'drizzle-orm';

async function teardown() {
  // 1. Fetch the user IDs of the test users
  const testUsersList = await db.select().from(users).where(
    or(
      eq(users.email, 'test_superuser@example.com'),
      eq(users.email, 'test_user@example.com'),
      eq(users.email, 'test_guest@example.com')
    )
  );

  // 2. Delete tenders owned/created by these users (Cascade delete will wipe checklistItems/bidders/statuses)
  for (const u of testUsersList) {
    await db.delete(tenders).where(eq(tenders.createdBy, u.id));
  }

  // 3. Delete the test users
  await db.delete(users).where(
    or(
      eq(users.email, 'test_superuser@example.com'),
      eq(users.email, 'test_user@example.com'),
      eq(users.email, 'test_guest@example.com')
    )
  );
  
  console.log('Test users and their E2E tenders cleaned up successfully!');
  process.exit(0);
}

teardown().catch((err) => {
  console.error('Teardown failed:', err);
  process.exit(1);
});
