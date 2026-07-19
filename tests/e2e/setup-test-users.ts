import './env'; // Ensure env vars are loaded before loading database modules!
import { db, users, tenders, checklistItems, bidders, bidderStatuses, loginAttempts, activityLog } from '../../src/db';
import { eq, or, inArray } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

const STANDARD_CHECKLIST = [
  { label: 'DECLARATION ON BANNING or HOLIDAY LISTING', category: 'submission', groupOrder: 1, sortOrder: 1 },
  { label: 'NIL DEVIATION', category: 'submission', groupOrder: 1, sortOrder: 2 },
  { label: 'MSE-UDYAM', category: 'submission', groupOrder: 1, sortOrder: 3 },
  { label: 'ISO/NSIC', category: 'submission', groupOrder: 1, sortOrder: 4 },
  { label: 'INTEGRITY PACT', category: 'submission', groupOrder: 1, sortOrder: 5 },
  { label: 'UNDERTAKING WRT COMPLIANCE OF RESTRICTIONS FOR COUNTRIES WHICH SHARE LAND BORDER WITH INDIA', category: 'submission', groupOrder: 1, sortOrder: 6 },
  { label: 'SIGNED MRPL GPC & TD', category: 'submission', groupOrder: 1, sortOrder: 7 },
  { label: 'LOCAL CONTENT & PA', category: 'submission', groupOrder: 1, sortOrder: 8 },
  { label: 'EMD', category: 'submission', groupOrder: 2, sortOrder: 9 },
  { label: 'PRICE REDUCTION SCHEDULE (PRS) CLAUSE', category: 'acceptance', groupOrder: 3, sortOrder: 10 },
  { label: 'PERFORMANCE BANK GUARANTY (PBG) CUM SECURITY DEPOSIT (SD)', category: 'acceptance', groupOrder: 3, sortOrder: 11 },
  { label: 'PAYMENT TERMS AS PER GeM', category: 'acceptance', groupOrder: 3, sortOrder: 12 },
  { label: 'DELIVERY PERIOD AS PER TERMS AND CONDITIONS', category: 'acceptance', groupOrder: 3, sortOrder: 13 },
  { label: 'OFFER VALIDITY', category: 'acceptance', groupOrder: 3, sortOrder: 14 },
  { label: 'ANY OTHER DEVIATIONS', category: 'text_note', groupOrder: 3, sortOrder: 15 },
];

async function setup() {
  const hash = await bcrypt.hash('TestPassword123!', 10);
  
  // 1. Fetch any existing test users to clean up their tenders
  const existingUsers = await db.select().from(users).where(
    or(
      eq(users.email, 'test_superuser@example.com'),
      eq(users.email, 'test_user@example.com'),
      eq(users.email, 'test_guest@example.com')
    )
  );

  const existingUserIds = existingUsers.map(u => u.id);

  if (existingUserIds.length > 0) {
    // Delete activity logs referencing these users
    await db.delete(activityLog).where(inArray(activityLog.userId, existingUserIds));
  }

  for (const u of existingUsers) {
    // Delete tenders owned/created by these test users. Cascade deletes will wipe checklists/bidders
    await db.delete(tenders).where(eq(tenders.createdBy, u.id));
  }

  // Delete the test users
  if (existingUserIds.length > 0) {
    await db.delete(users).where(inArray(users.id, existingUserIds));
  }

  // 2. Insert test users
  const [testSuperuser, testUser, testGuest] = await db.insert(users).values([
    {
      slug: 'test_superuser',
      nameHi: 'टेस्ट सुपरयूज़र',
      nameEn: 'Test Superuser',
      phone: '000000',
      email: 'test_superuser@example.com',
      passwordHash: hash,
      role: 'superuser',
      mustChangePassword: false,
    },
    {
      slug: 'test_user',
      nameHi: 'टेस्ट यूज़र',
      nameEn: 'Test User',
      phone: '000000',
      email: 'test_user@example.com',
      passwordHash: hash,
      role: 'user',
      mustChangePassword: false,
    },
    {
      slug: 'test_guest',
      nameHi: 'टेस्ट गेस्ट',
      nameEn: 'Test Guest',
      phone: '000000',
      email: 'test_guest@example.com',
      passwordHash: hash,
      role: 'guest',
      mustChangePassword: false,
    }
  ]).returning();

  // 3. Create test tenders for the users
  const testTendersToInsert = [
    {
      name: 'Superuser E2E Tender',
      subjectLine: 'E2E compliance verification for Superuser',
      createdBy: testSuperuser.id,
      ownerId: testSuperuser.id,
      status: 'active' as const,
    },
    {
      name: 'Standard User E2E Tender',
      subjectLine: 'E2E compliance verification for Standard User',
      createdBy: testUser.id,
      ownerId: testUser.id,
      status: 'active' as const,
    },
    {
      name: 'Guest E2E Tender',
      subjectLine: 'E2E compliance verification for Guest',
      createdBy: testGuest.id,
      ownerId: testGuest.id,
      status: 'active' as const,
    }
  ];

  for (const t of testTendersToInsert) {
    const [insertedTender] = await db.insert(tenders).values(t).returning();

    // Seed checklist items for each tender
    for (const item of STANDARD_CHECKLIST) {
      await db.insert(checklistItems).values({
        tenderId: insertedTender.id,
        label: item.label,
        category: item.category,
        groupOrder: item.groupOrder,
        sortOrder: item.sortOrder,
      });
    }

    // Seed a bidder for each tender
    const [insertedBidder] = await db.insert(bidders).values({
      tenderId: insertedTender.id,
      name: 'E2E Bidder Corp',
      email: 'e2ebidder@example.com',
      contactPerson: 'E2E Tester',
      phone: '9999999999',
    }).returning();

    // Seed default bidder statuses
    const dbChecklistItems = await db.select().from(checklistItems).where(eq(checklistItems.tenderId, insertedTender.id));
    for (const item of dbChecklistItems) {
      await db.insert(bidderStatuses).values({
        bidderId: insertedBidder.id,
        checklistItemId: item.id,
        status: item.category === 'submission' ? 'not_submitted' : (item.category === 'acceptance' ? 'not_accepted' : 'pending'),
      });
    }
  }

  // 4. Reset the login attempts to clear out rate-limiting locks
  await db.delete(loginAttempts);

  console.log('Test users, tenders, checklists, and bidders seeded successfully!');
  process.exit(0);
}

setup().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
