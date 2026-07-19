import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db, bidders, bidderStatuses, checklistItems, users } from '@/db';
import { eq, inArray } from 'drizzle-orm';
import { assertTenderAccess } from '@/lib/tenderAccess';
import Header from '@/components/Header';
import BulkEmails from '../../../emails/BulkEmails';

export default async function TenderEmailsPage({ params }: { params: Promise<{ tenderId: string }> }) {
  const session = await auth(); if (!session?.user) redirect('/login'); const tender = await assertTenderAccess(Number((await params).tenderId), session); const userId = Number((session.user as any).id); const [dbUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1); if (!dbUser) redirect('/login');
  const [items, bidderRows] = await Promise.all([db.select().from(checklistItems).where(eq(checklistItems.tenderId, tender.id)).orderBy(checklistItems.groupOrder, checklistItems.sortOrder), db.select({ id: bidders.id, tenderId: bidders.tenderId, name: bidders.name, email: bidders.email, contactPerson: bidders.contactPerson, phone: bidders.phone, lastDraftedSentAt: bidders.lastDraftedSentAt, lastDraftedSentBy: bidders.lastDraftedSentBy, createdAt: bidders.createdAt, lastDraftedSentByName: users.nameEn }).from(bidders).leftJoin(users, eq(bidders.lastDraftedSentBy, users.id)).where(eq(bidders.tenderId, tender.id))]); const statuses = bidderRows.length ? await db.select().from(bidderStatuses).where(inArray(bidderStatuses.bidderId, bidderRows.map(b=>b.id))) : []; const withStatuses = bidderRows.map(b=>({...b, statuses: statuses.filter(s=>s.bidderId===b.id)}));
  return <div className="flex-1 flex flex-col overflow-hidden"><Header title="Bulk Compliance Emails" currentUser={{nameEn: dbUser.nameEn, role: dbUser.role}} tender={tender}/><div className="flex-1 flex flex-col min-h-0 p-3 sm:p-6"><BulkEmails tender={tender} bidders={withStatuses} checklistItems={items} currentUser={{nameHi: dbUser.nameHi, nameEn: dbUser.nameEn, phone: dbUser.phone}}/></div></div>;
}
