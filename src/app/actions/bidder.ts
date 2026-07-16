'use server';

import { db, bidders, bidderStatuses, checklistItems, users } from '@/db';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import { logActivity } from '@/lib/auditLog';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const AddBidderSchema = z.object({
  tenderId: z.number(),
  name: z.string().min(1, "Bidder name is required"),
  email: z.string().email("Invalid email address"),
  contactPerson: z.string().min(1, "Contact person is required"),
  phone: z.string().min(1, "Phone is required"),
});

const UpdateBidderSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Bidder name is required"),
  email: z.string().email("Invalid email address"),
  contactPerson: z.string().min(1, "Contact person is required"),
  phone: z.string().min(1, "Phone is required"),
});

const UpdateStatusSchema = z.object({
  bidderId: z.number(),
  checklistItemId: z.number(),
  status: z.string(),
});

export async function getBidders(tenderId: number) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  // Fetch bidders
  const bidderList = await db.select().from(bidders).where(eq(bidders.tenderId, tenderId));
  
  // Fetch statuses for these bidders
  const statusList = await db.select().from(bidderStatuses);

  return bidderList.map(b => {
    const statuses = statusList.filter(s => s.bidderId === b.id);
    return {
      ...b,
      statuses,
    };
  });
}

export async function addBidder(data: { tenderId: number; name: string; email: string; contactPerson: string; phone: string }) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const validated = AddBidderSchema.parse(data);

  // 1. Insert Bidder
  const [newBidder] = await db.insert(bidders).values({
    tenderId: validated.tenderId,
    name: validated.name,
    email: validated.email,
    contactPerson: validated.contactPerson,
    phone: validated.phone,
  }).returning();

  // 2. Fetch all checklist items for this tender to seed defaults
  const items = await db.select().from(checklistItems).where(eq(checklistItems.tenderId, validated.tenderId));

  const userId = parseInt((session.user as any).id, 10);

  // Seed default statuses
  for (const item of items) {
    const defaultStatus = item.category === 'acceptance' ? 'not_accepted' : 'not_submitted';
    await db.insert(bidderStatuses).values({
      bidderId: newBidder.id,
      checklistItemId: item.id,
      status: defaultStatus,
      updatedBy: userId,
    });
  }

  // Log activity
  await logActivity('bidder.create', {
    bidderId: newBidder.id,
    bidderName: newBidder.name,
    email: newBidder.email,
  }, validated.tenderId);

  revalidatePath('/');
  return { success: true };
}

export async function updateBidder(data: { id: number; name: string; email: string; contactPerson: string; phone: string }) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const validated = UpdateBidderSchema.parse(data);

  const [oldBidder] = await db.select().from(bidders).where(eq(bidders.id, validated.id)).limit(1);
  if (!oldBidder) {
    throw new Error('Bidder not found');
  }

  // Update
  await db.update(bidders)
    .set({
      name: validated.name,
      email: validated.email,
      contactPerson: validated.contactPerson,
      phone: validated.phone,
    })
    .where(eq(bidders.id, validated.id));

  // Log activity
  await logActivity('bidder.update', {
    bidderId: validated.id,
    oldName: oldBidder.name,
    newName: validated.name,
    oldEmail: oldBidder.email,
    newEmail: validated.email,
  }, oldBidder.tenderId);

  revalidatePath('/');
  return { success: true };
}

export async function deleteBidder(id: number) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  // GUEST protection
  const role = (session.user as any).role;
  if (role === 'guest') {
    throw new Error('Guests are not permitted to delete bidders.');
  }

  const [bidder] = await db.select().from(bidders).where(eq(bidders.id, id)).limit(1);
  if (!bidder) {
    throw new Error('Bidder not found');
  }

  // Delete
  await db.delete(bidders).where(eq(bidders.id, id));

  // Log activity
  await logActivity('bidder.delete', {
    bidderId: id,
    bidderName: bidder.name,
  }, bidder.tenderId);

  revalidatePath('/');
  return { success: true };
}

export async function updateBidderStatus(data: { bidderId: number; checklistItemId: number; status: string }) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const validated = UpdateStatusSchema.parse(data);
  const userId = parseInt((session.user as any).id, 10);

  // 1. Fetch the checklist item to check its category
  const [item] = await db.select().from(checklistItems).where(eq(checklistItems.id, validated.checklistItemId)).limit(1);
  if (!item) {
    throw new Error('Checklist item not found');
  }

  // 2. Validate status value against category server-side
  const isCustomTextItem = item.label.toLowerCase() === 'any other deviations';
  if (isCustomTextItem) {
    if (validated.status.length > 1000) {
      throw new Error('Deviation details must be under 1000 characters');
    }
  } else {
    if (item.category === 'submission') {
      const allowed = ['submitted', 'not_submitted', 'not_applicable'];
      if (!allowed.includes(validated.status)) {
        throw new Error(`Invalid status for submission item: ${validated.status}`);
      }
    } else if (item.category === 'acceptance') {
      const allowed = ['accepted', 'not_accepted', 'not_applicable'];
      if (!allowed.includes(validated.status)) {
        throw new Error(`Invalid status for acceptance item: ${validated.status}`);
      }
    }
  }

  // 3. Upsert status
  const [existing] = await db
    .select()
    .from(bidderStatuses)
    .where(
      and(
        eq(bidderStatuses.bidderId, validated.bidderId),
        eq(bidderStatuses.checklistItemId, validated.checklistItemId)
      )
    )
    .limit(1);

  if (existing) {
    await db.update(bidderStatuses)
      .set({
        status: validated.status,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(bidderStatuses.id, existing.id));
  } else {
    await db.insert(bidderStatuses).values({
      bidderId: validated.bidderId,
      checklistItemId: validated.checklistItemId,
      status: validated.status,
      updatedBy: userId,
    });
  }

  // Fetch bidder details for logging
  const [bidder] = await db.select().from(bidders).where(eq(bidders.id, validated.bidderId)).limit(1);

  // Log activity
  await logActivity('status.update', {
    bidderId: validated.bidderId,
    bidderName: bidder?.name || 'Unknown',
    checklistItemId: validated.checklistItemId,
    checklistItemLabel: item.label,
    oldValue: existing?.status || 'unset',
    newValue: validated.status,
  }, bidder?.tenderId);

  revalidatePath('/');
  return { success: true };
}
