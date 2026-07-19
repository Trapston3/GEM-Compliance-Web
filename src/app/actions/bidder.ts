'use server';

import { db, bidders, bidderStatuses, checklistItems, users } from '@/db';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import { logActivity } from '@/lib/auditLog';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { assertTenderAccess } from '@/lib/tenderAccess';

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

const BulkImportSchema = z.object({
  tenderId: z.number(),
  biddersList: z.array(z.object({
    name: z.string().min(1, "Bidder name is required"),
    email: z.string().email("Invalid email address"),
    contactPerson: z.string().min(1, "Contact person is required"),
    phone: z.string().min(1, "Phone is required"),
  })).min(1, "At least one bidder required"),
});

export async function getBidders(tenderId: number) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  await assertTenderAccess(tenderId, session);
  const bidderList = await db.select().from(bidders).where(eq(bidders.tenderId, tenderId));
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
  await assertTenderAccess(validated.tenderId, session);

  const [newBidder] = await db.insert(bidders).values({
    tenderId: validated.tenderId,
    name: validated.name,
    email: validated.email,
    contactPerson: validated.contactPerson,
    phone: validated.phone,
  }).returning();

  const items = await db.select().from(checklistItems).where(eq(checklistItems.tenderId, validated.tenderId));
  const userId = parseInt((session.user as any).id, 10);

  for (const item of items) {
    const defaultStatus = item.category === 'acceptance' ? 'not_accepted' : 'not_submitted';
    await db.insert(bidderStatuses).values({
      bidderId: newBidder.id,
      checklistItemId: item.id,
      status: defaultStatus,
      updatedBy: userId,
    });
  }

  await logActivity('bidder.create', {
    bidderId: newBidder.id,
    bidderName: newBidder.name,
    email: newBidder.email,
  }, validated.tenderId);

  revalidatePath('/');
  return { success: true };
}

export async function importBidders(data: { tenderId: number; biddersList: { name: string; email: string; contactPerson: string; phone: string }[] }) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const validated = BulkImportSchema.parse(data);
  await assertTenderAccess(validated.tenderId, session);

  const items = await db.select().from(checklistItems).where(eq(checklistItems.tenderId, validated.tenderId));
  const userId = parseInt((session.user as any).id, 10);
  let importedCount = 0;

  for (const b of validated.biddersList) {
    const [inserted] = await db.insert(bidders).values({
      tenderId: validated.tenderId,
      name: b.name.trim(),
      email: b.email.trim(),
      contactPerson: b.contactPerson.trim(),
      phone: b.phone.trim(),
    }).returning();

    for (const item of items) {
      const defaultStatus = item.category === 'acceptance' ? 'not_accepted' : 'not_submitted';
      await db.insert(bidderStatuses).values({
        bidderId: inserted.id,
        checklistItemId: item.id,
        status: defaultStatus,
        updatedBy: userId,
      });
    }
    importedCount++;
  }

  // Single audit log entry summarizing the bulk import
  await logActivity('bidder.bulk_import', {
    count: importedCount,
  }, validated.tenderId);

  revalidatePath(`/tenders/${validated.tenderId}/bidders`);
  revalidatePath(`/tenders/${validated.tenderId}/matrix`);
  revalidatePath(`/tenders/${validated.tenderId}/overview`);
  revalidatePath('/');

  return { success: true, count: importedCount };
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
  await assertTenderAccess(oldBidder.tenderId, session);

  await db.update(bidders)
    .set({
      name: validated.name,
      email: validated.email,
      contactPerson: validated.contactPerson,
      phone: validated.phone,
    })
    .where(eq(bidders.id, validated.id));

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

  const role = (session.user as any).role;
  if (role === 'guest') {
    throw new Error('Guests are not permitted to delete bidders.');
  }

  const [bidder] = await db.select().from(bidders).where(eq(bidders.id, id)).limit(1);
  if (!bidder) {
    throw new Error('Bidder not found');
  }
  await assertTenderAccess(bidder.tenderId, session);

  await db.delete(bidders).where(eq(bidders.id, id));

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

  const [item] = await db.select().from(checklistItems).where(eq(checklistItems.id, validated.checklistItemId)).limit(1);
  if (!item) {
    throw new Error('Checklist item not found');
  }
  const [bidderForAccess] = await db.select().from(bidders).where(eq(bidders.id, validated.bidderId)).limit(1);
  if (!bidderForAccess || bidderForAccess.tenderId !== item.tenderId) throw new Error('Tender not found');
  await assertTenderAccess(item.tenderId, session);

  const isCustomTextItem = item.category === 'text_note';
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

  const [bidder] = await db.select().from(bidders).where(eq(bidders.id, validated.bidderId)).limit(1);

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

export async function markBidderAsDraftedSent(data: { bidderId: number; action: string }) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const userId = parseInt((session.user as any).id, 10);
  const [bidder] = await db.select().from(bidders).where(eq(bidders.id, data.bidderId)).limit(1);
  if (!bidder) {
    throw new Error('Bidder not found');
  }

  await assertTenderAccess(bidder.tenderId, session);

  await db.update(bidders)
    .set({
      lastDraftedSentAt: new Date(),
      lastDraftedSentBy: userId,
    })
    .where(eq(bidders.id, data.bidderId));

  await logActivity(data.action, {
    bidderId: bidder.id,
    bidderName: bidder.name,
  }, bidder.tenderId);

  revalidatePath(`/tenders/${bidder.tenderId}/emails`);
  revalidatePath(`/tenders/${bidder.tenderId}/bidders`);
  revalidatePath('/');
  return { success: true };
}
