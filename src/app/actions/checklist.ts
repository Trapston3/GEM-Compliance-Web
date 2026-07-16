'use server';

import { db, checklistItems, bidderStatuses, bidders, users } from '@/db';
import { eq, and, max } from 'drizzle-orm';
import { auth } from '@/auth';
import { logActivity } from '@/lib/auditLog';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const AddChecklistItemSchema = z.object({
  tenderId: z.number(),
  label: z.string().min(1, "Label is required"),
  category: z.enum(['submission', 'acceptance']),
});

const UpdateChecklistItemSchema = z.object({
  id: z.number(),
  label: z.string().min(1, "Label is required"),
  category: z.enum(['submission', 'acceptance']),
});

export async function getChecklistItems(tenderId: number) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  return await db
    .select()
    .from(checklistItems)
    .where(eq(checklistItems.tenderId, tenderId))
    .orderBy(checklistItems.groupOrder, checklistItems.sortOrder);
}

export async function addChecklistItem(data: { tenderId: number; label: string; category: 'submission' | 'acceptance' }) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const validated = AddChecklistItemSchema.parse(data);

  // Group order: Submission -> 1, Acceptance -> 3. (EMD is 2, but new user-added items default to group 1 for submission and 3 for acceptance).
  const groupOrder = validated.category === 'acceptance' ? 3 : 1;

  // Determine sort order (append to the end of the group)
  const existingGroupItems = await db
    .select()
    .from(checklistItems)
    .where(
      and(
        eq(checklistItems.tenderId, validated.tenderId),
        eq(checklistItems.groupOrder, groupOrder)
      )
    );

  const maxSort = existingGroupItems.reduce((maxVal, item) => Math.max(maxVal, item.sortOrder), 0);
  const sortOrder = maxSort + 1;

  // Insert Checklist Item
  const [newItem] = await db.insert(checklistItems).values({
    tenderId: validated.tenderId,
    label: validated.label,
    category: validated.category,
    groupOrder,
    sortOrder,
  }).returning();

  // Create default status for all existing bidders
  const bidderList = await db.select().from(bidders).where(eq(bidders.tenderId, validated.tenderId));
  const defaultStatus = validated.category === 'acceptance' ? 'not_accepted' : 'not_submitted';
  const userId = parseInt((session.user as any).id, 10);

  for (const bidder of bidderList) {
    await db.insert(bidderStatuses).values({
      bidderId: bidder.id,
      checklistItemId: newItem.id,
      status: defaultStatus,
      updatedBy: userId,
    });
  }

  // Log activity
  await logActivity('checklist_item.create', {
    itemId: newItem.id,
    label: newItem.label,
    category: newItem.category,
  }, validated.tenderId);

  revalidatePath('/');
  return { success: true };
}

export async function updateChecklistItem(data: { id: number; label: string; category: 'submission' | 'acceptance' }) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const validated = UpdateChecklistItemSchema.parse(data);

  const [oldItem] = await db.select().from(checklistItems).where(eq(checklistItems.id, validated.id)).limit(1);
  if (!oldItem) {
    throw new Error('Checklist item not found');
  }

  const userId = parseInt((session.user as any).id, 10);
  const isCategoryChanged = oldItem.category !== validated.category;

  // Determine group order
  const groupOrder = validated.category === 'acceptance' ? 3 : 1;

  // Update
  await db.update(checklistItems)
    .set({
      label: validated.label,
      category: validated.category,
      groupOrder: isCategoryChanged ? groupOrder : oldItem.groupOrder,
    })
    .where(eq(checklistItems.id, validated.id));

  // Handle category change: reset all bidder statuses for this item to the new category's default
  if (isCategoryChanged) {
    const defaultStatus = validated.category === 'acceptance' ? 'not_accepted' : 'not_submitted';
    
    await db.update(bidderStatuses)
      .set({
        status: defaultStatus,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(bidderStatuses.checklistItemId, validated.id));

    // Log category change activity
    await logActivity('checklist_item.category_change', {
      itemId: validated.id,
      label: validated.label,
      oldCategory: oldItem.category,
      newCategory: validated.category,
      statusResetTo: defaultStatus,
    }, oldItem.tenderId);
  } else {
    // Log standard rename
    await logActivity('checklist_item.rename', {
      itemId: validated.id,
      oldLabel: oldItem.label,
      newLabel: validated.label,
    }, oldItem.tenderId);
  }

  revalidatePath('/');
  return { success: true };
}

export async function deleteChecklistItem(id: number) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  // GUEST protection
  const role = (session.user as any).role;
  if (role === 'guest') {
    throw new Error('Guests are not permitted to delete checklist items.');
  }

  const [item] = await db.select().from(checklistItems).where(eq(checklistItems.id, id)).limit(1);
  if (!item) {
    throw new Error('Checklist item not found');
  }

  // Delete checklist item (cascades to statuses)
  await db.delete(checklistItems).where(eq(checklistItems.id, id));

  // Log activity
  await logActivity('checklist_item.delete', {
    itemId: id,
    label: item.label,
  }, item.tenderId);

  revalidatePath('/');
  return { success: true };
}
