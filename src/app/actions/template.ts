'use server';

import { db, checklistTemplates, checklistTemplateItems } from '@/db';
import { eq, desc, asc } from 'drizzle-orm';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireSuperuser } from './user';
import { logActivity } from '@/lib/auditLog';

const TemplateInputSchema = z.object({
  name: z.string().trim().min(1, "Template name is required").max(100),
  description: z.string().trim().max(300).nullable(),
});

export async function getChecklistTemplates() {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  
  return await db.select().from(checklistTemplates).orderBy(desc(checklistTemplates.isDefault), asc(checklistTemplates.name));
}

export async function getChecklistTemplate(id: number) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const [template] = await db.select().from(checklistTemplates).where(eq(checklistTemplates.id, id)).limit(1);
  if (!template) return null;

  const items = await db.select().from(checklistTemplateItems)
    .where(eq(checklistTemplateItems.templateId, id))
    .orderBy(checklistTemplateItems.groupOrder, checklistTemplateItems.sortOrder);

  return { ...template, items };
}

export async function createChecklistTemplate(data: { name: string; description: string | null; items: { label: string; category: string; groupOrder: number; sortOrder: number }[]; isDefault?: boolean }) {
  await requireSuperuser();
  
  const validated = TemplateInputSchema.parse({ name: data.name, description: data.description });

  // If new template is marked default, un-default existing default templates
  if (data.isDefault) {
    await db.update(checklistTemplates).set({ isDefault: false }).where(eq(checklistTemplates.isDefault, true));
  }

  const [template] = await db.insert(checklistTemplates).values({
    name: validated.name,
    description: validated.description,
    isDefault: data.isDefault ?? false,
  }).returning();

  if (data.items && data.items.length > 0) {
    for (const item of data.items) {
      await db.insert(checklistTemplateItems).values({
        templateId: template.id,
        label: item.label,
        category: item.category,
        groupOrder: item.groupOrder,
        sortOrder: item.sortOrder,
      });
    }
  }

  await logActivity('template.create', { name: template.name }, undefined);
  revalidatePath('/admin');
  return { success: true, templateId: template.id };
}

export async function updateChecklistTemplate(id: number, data: { name: string; description: string | null; items: { id?: number; label: string; category: string; groupOrder: number; sortOrder: number }[] }) {
  await requireSuperuser();
  
  const [existing] = await db.select().from(checklistTemplates).where(eq(checklistTemplates.id, id)).limit(1);
  if (!existing) throw new Error('Template not found');

  const validated = TemplateInputSchema.parse({ name: data.name, description: data.description });

  // VERSIONING SPEC: If editing the active default template, archive the prior version and create a new default template version
  if (existing.isDefault) {
    const timestamp = new Date().toISOString().split('T')[0];
    const archivedName = `${existing.name} (Archived ${timestamp})`;

    // Step 1: Archive current version
    await db.update(checklistTemplates).set({
      name: archivedName,
      isDefault: false,
      updatedAt: new Date(),
    }).where(eq(checklistTemplates.id, id));

    // Step 2: Insert new active default template version
    const [newVersion] = await db.insert(checklistTemplates).values({
      name: validated.name,
      description: validated.description,
      isDefault: true,
    }).returning();

    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        await db.insert(checklistTemplateItems).values({
          templateId: newVersion.id,
          label: item.label,
          category: item.category,
          groupOrder: item.groupOrder,
          sortOrder: item.sortOrder,
        });
      }
    }

    await logActivity('template.version_archived', { oldId: id, newId: newVersion.id, name: validated.name }, undefined);
  } else {
    // Non-default template: update in place
    await db.update(checklistTemplates).set({
      name: validated.name,
      description: validated.description,
      updatedAt: new Date(),
    }).where(eq(checklistTemplates.id, id));

    await db.delete(checklistTemplateItems).where(eq(checklistTemplateItems.templateId, id));

    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        await db.insert(checklistTemplateItems).values({
          templateId: id,
          label: item.label,
          category: item.category,
          groupOrder: item.groupOrder,
          sortOrder: item.sortOrder,
        });
      }
    }

    await logActivity('template.update', { name: validated.name }, undefined);
  }

  revalidatePath('/admin');
  return { success: true };
}

export async function deleteChecklistTemplate(id: number) {
  await requireSuperuser();

  const [template] = await db.select().from(checklistTemplates).where(eq(checklistTemplates.id, id)).limit(1);
  if (!template) throw new Error('Template not found');
  if (template.isDefault) throw new Error('Cannot delete the active default master template. Set another template as default first.');

  await db.delete(checklistTemplates).where(eq(checklistTemplates.id, id));

  await logActivity('template.delete', { name: template.name }, undefined);
  revalidatePath('/admin');
  return { success: true };
}
