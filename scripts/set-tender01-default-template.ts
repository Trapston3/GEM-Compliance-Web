import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';
import { eq, ilike, and } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is missing');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function run() {
  console.log('Finding Tender-01...');
  const [tender] = await db
    .select()
    .from(schema.tenders)
    .where(ilike(schema.tenders.name, '%Tender-01%'))
    .limit(1);

  if (!tender) {
    console.error('Tender-01 not found');
    process.exit(1);
  }

  console.log(`Found tender: ${tender.name} (ID: ${tender.id})`);

  // Fetch checklist items for Tender-01
  const items = await db
    .select()
    .from(schema.checklistItems)
    .where(eq(schema.checklistItems.tenderId, tender.id))
    .orderBy(schema.checklistItems.groupOrder, schema.checklistItems.sortOrder);

  console.log(`Retrieved ${items.length} checklist items from Tender-01.`);

  // Find existing active default template
  const [existingDefault] = await db
    .select()
    .from(schema.checklistTemplates)
    .where(eq(schema.checklistTemplates.isDefault, true))
    .limit(1);

  const timestamp = new Date().toISOString().split('T')[0];

  if (existingDefault) {
    const archivedName = `${existingDefault.name} (Archived ${timestamp})`;
    console.log(`Archiving prior default template ID ${existingDefault.id} as "${archivedName}"...`);
    await db
      .update(schema.checklistTemplates)
      .set({
        name: archivedName,
        isDefault: false,
        updatedAt: new Date(),
      })
      .where(eq(schema.checklistTemplates.id, existingDefault.id));

    // Audit log
    await db.insert(schema.activityLog).values({
      action: 'template.version_archived',
      details: { oldId: existingDefault.id, archivedName },
    });
  }

  // Insert new active default template for Tender-01
  console.log('Creating new Master Default Template from Tender-01...');
  const [newTemplate] = await db
    .insert(schema.checklistTemplates)
    .values({
      name: 'Tender-01 Master Template',
      description: 'Compliance verification against GeM Bid for Materials Procurement',
      isDefault: true,
    })
    .returning();

  for (const item of items) {
    await db.insert(schema.checklistTemplateItems).values({
      templateId: newTemplate.id,
      label: item.label,
      category: item.category,
      groupOrder: item.groupOrder,
      sortOrder: item.sortOrder,
    });
  }

  // Audit log for template creation
  await db.insert(schema.activityLog).values({
    action: 'template.create',
    details: { templateId: newTemplate.id, name: newTemplate.name, isDefault: true },
  });

  console.log(`Successfully created new default Master Template ID ${newTemplate.id} ("Tender-01 Master Template") and logged to activity_log!`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Error setting default template:', err);
  process.exit(1);
});
