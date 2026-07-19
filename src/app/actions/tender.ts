'use server';

import { auth } from '@/auth';
import { db, checklistItems, tenders, users, checklistTemplateItems, bidders as biddersTable } from '@/db';
import { assertTenderAccess, getVisibleTenders } from '@/lib/tenderAccess';
import { logActivity } from '@/lib/auditLog';
import { and, eq, isNull, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const TenderInput = z.object({ name: z.string().trim().min(1).max(160), subjectLine: z.string().trim().max(500).nullable() });
const STANDARD_CHECKLIST = [
  ['DECLARATION ON BANNING or HOLIDAY LISTING', 'submission', 1, 1],
  ['NIL DEVIATION', 'submission', 1, 2], ['MSE-UDYAM', 'submission', 1, 3],
  ['ISO/NSIC', 'submission', 1, 4], ['INTEGRITY PACT', 'submission', 1, 5],
  ['UNDERTAKING WRT COMPLIANCE OF RESTRICTIONS FOR COUNTRIES WHICH SHARE LAND BORDER WITH INDIA', 'submission', 1, 6],
  ['SIGNED MRPL GPC & TD', 'submission', 1, 7], ['LOCAL CONTENT & PA', 'submission', 1, 8],
  ['EMD', 'submission', 2, 9], ['PRICE REDUCTION SCHEDULE (PRS) CLAUSE', 'acceptance', 3, 10],
  ['PERFORMANCE BANK GUARANTY (PBG) CUM SECURITY DEPOSIT (SD)', 'acceptance', 3, 11],
  ['PAYMENT TERMS AS PER GeM', 'acceptance', 3, 12], ['DELIVERY PERIOD AS PER TERMS AND CONDITIONS', 'acceptance', 3, 13],
  ['OFFER VALIDITY', 'acceptance', 3, 14], ['ANY OTHER DEVIATIONS', 'text_note', 3, 15],
] as const;

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  return session;
}

export async function getTenders() { return getVisibleTenders(); }

export async function getTender(tenderId?: number) {
  const session = await requireSession();
  if (!tenderId) {
    const visible = await getVisibleTenders(session);
    return visible.find(t => t.status === 'active') || visible[0] || null;
  }
  return assertTenderAccess(tenderId, session);
}

export async function createTender(data: { name: string; subjectLine?: string | null; sourceTenderId?: number | null; templateId?: number | null }) {
  const session = await requireSession();
  const input = TenderInput.parse({ name: data.name, subjectLine: data.subjectLine || null });
  const ownerId = Number((session.user as any).id);
  let sourceItems = null;
  if (data.sourceTenderId) {
    const source = await assertTenderAccess(data.sourceTenderId, session);
    sourceItems = await db.select().from(checklistItems).where(eq(checklistItems.tenderId, source.id)).orderBy(checklistItems.groupOrder, checklistItems.sortOrder);
  } else if (data.templateId) {
    const templateItems = await db.select({
      label: checklistTemplateItems.label,
      category: checklistTemplateItems.category,
      groupOrder: checklistTemplateItems.groupOrder,
      sortOrder: checklistTemplateItems.sortOrder,
    })
      .from(checklistTemplateItems)
      .where(eq(checklistTemplateItems.templateId, data.templateId))
      .orderBy(checklistTemplateItems.groupOrder, checklistTemplateItems.sortOrder);
    
    if (templateItems.length > 0) {
      sourceItems = templateItems;
    }
  }
  const [tender] = await db.insert(tenders).values({ name: input.name, subjectLine: input.subjectLine, ownerId, createdBy: ownerId }).returning();
  const items = sourceItems || STANDARD_CHECKLIST.map(([label, category, groupOrder, sortOrder]) => ({ label, category, groupOrder, sortOrder }));
  for (const item of items) await db.insert(checklistItems).values({ tenderId: tender.id, label: item.label, category: item.category, groupOrder: item.groupOrder, sortOrder: item.sortOrder });
  await logActivity('tender.create', { source: sourceItems ? (data.templateId ? 'template' : 'duplicate') : 'standard_template', sourceTenderId: data.sourceTenderId || null, templateId: data.templateId || null }, tender.id);
  revalidatePath('/tenders');
  return { success: true, tenderId: tender.id };
}

export async function updateTender(data: { id: number; name: string; subjectLine: string | null }) {
  const session = await requireSession();
  const validated = TenderInput.extend({ id: z.number() }).parse(data);
  const oldTender = await assertTenderAccess(validated.id, session);
  await db.update(tenders).set({ name: validated.name, subjectLine: validated.subjectLine, updatedAt: new Date() }).where(eq(tenders.id, validated.id));
  await logActivity('tender.update', { oldName: oldTender.name, newName: validated.name, oldSubjectLine: oldTender.subjectLine, newSubjectLine: validated.subjectLine }, validated.id);
  revalidatePath('/tenders'); revalidatePath(`/tenders/${validated.id}/settings`);
  return { success: true };
}

export async function setTenderStatus(tenderId: number, status: 'active' | 'archived') {
  const session = await requireSession();
  await assertTenderAccess(tenderId, session);
  await db.update(tenders).set({ status, updatedAt: new Date() }).where(eq(tenders.id, tenderId));
  await logActivity(`tender.${status}`, {}, tenderId);
  revalidatePath('/tenders'); revalidatePath(`/tenders/${tenderId}`);
  return { success: true };
}

export async function duplicateTender(tenderId: number, name: string) {
  const source = await assertTenderAccess(tenderId);
  return createTender({ name, subjectLine: source.subjectLine, sourceTenderId: tenderId });
}

export async function deleteTender(tenderId: number, confirmation: string) {
  const session = await requireSession();
  if ((session.user as any).role === 'guest') throw new Error('Guests cannot permanently delete tenders.');
  const tender = await assertTenderAccess(tenderId, session);
  if (confirmation !== tender.name) throw new Error('Type the exact tender name to confirm deletion.');
  await db.delete(tenders).where(eq(tenders.id, tenderId));
  await logActivity('tender.delete', { tenderName: tender.name }, undefined);
  revalidatePath('/tenders');
  return { success: true };
}

export async function reassignTenderOwner(tenderId: number, newOwnerId: number) {
  const session = await requireSession();
  if ((session.user as any).role !== 'superuser') throw new Error('Superuser access required');
  const tender = await assertTenderAccess(tenderId, session);
  const [newOwner] = await db.select({ id: users.id, nameEn: users.nameEn }).from(users).where(eq(users.id, newOwnerId)).limit(1);
  if (!newOwner) throw new Error('Owner not found');
  await db.update(tenders).set({ ownerId: newOwnerId, updatedAt: new Date() }).where(eq(tenders.id, tenderId));
  await logActivity('admin.reassign_tender_owner', { oldOwnerId: tender.ownerId, newOwnerId, newOwnerName: newOwner.nameEn }, tenderId);
  revalidatePath('/admin'); revalidatePath('/tenders');
  return { success: true };
}

export async function searchGlobalIndex(query: string) {
  const session = await requireSession();
  const visibleTenders = await getVisibleTenders(session);
  const visibleTenderIds = visibleTenders.map(t => t.id);

  if (!query.trim()) return { tenders: [], bidders: [] };
  const q = query.toLowerCase().trim();

  // 1. Filter Tenders
  const matchingTenders = visibleTenders.filter(t => 
    t.name.toLowerCase().includes(q) || (t.subjectLine && t.subjectLine.toLowerCase().includes(q))
  ).map(t => ({
    id: t.id,
    name: t.name,
    subjectLine: t.subjectLine,
  }));

  // 2. Filter Bidders
  if (visibleTenderIds.length === 0) return { tenders: matchingTenders.slice(0, 8), bidders: [] };

  const allBidders = await db.select({
    id: biddersTable.id,
    name: biddersTable.name,
    contactPerson: biddersTable.contactPerson,
    email: biddersTable.email,
    tenderId: biddersTable.tenderId,
  }).from(biddersTable).where(inArray(biddersTable.tenderId, visibleTenderIds));

  const tenderMap = new Map(visibleTenders.map(t => [t.id, t.name]));

  const matchingBidders = allBidders.filter(b => 
    b.name.toLowerCase().includes(q) ||
    b.contactPerson.toLowerCase().includes(q) ||
    b.email.toLowerCase().includes(q)
  ).map(b => ({
    id: b.id,
    name: b.name,
    contactPerson: b.contactPerson,
    email: b.email,
    tenderId: b.tenderId,
    tenderName: tenderMap.get(b.tenderId) || `Tender #${b.tenderId}`,
  }));

  return { tenders: matchingTenders.slice(0, 8), bidders: matchingBidders.slice(0, 10) };
}
