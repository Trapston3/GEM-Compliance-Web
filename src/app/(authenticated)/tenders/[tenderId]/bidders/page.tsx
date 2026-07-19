import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { db, bidders, bidderStatuses, checklistItems, users } from '@/db';
import { eq, inArray } from 'drizzle-orm';
import { assertTenderAccess } from '@/lib/tenderAccess';
import Header from '@/components/Header';
import Dashboard from '@/app/(authenticated)/Dashboard';

export default async function TenderBiddersPage({ params }: { params: Promise<{ tenderId: string }> }) {
  const session = await auth(); if (!session?.user) redirect('/login');
  const id = Number((await params).tenderId);
  const tender = await assertTenderAccess(id, session); if (!tender) notFound();
  
  const userId = Number((session.user as any).id);
  const [dbUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!dbUser) redirect('/login');
  if (dbUser.mustChangePassword) redirect('/account?mustChange=true');

  const [items, bidderRows] = await Promise.all([
    db.select().from(checklistItems).where(eq(checklistItems.tenderId, id)).orderBy(checklistItems.groupOrder, checklistItems.sortOrder),
    db.select({
      id: bidders.id,
      tenderId: bidders.tenderId,
      name: bidders.name,
      email: bidders.email,
      contactPerson: bidders.contactPerson,
      phone: bidders.phone,
      lastDraftedSentAt: bidders.lastDraftedSentAt,
      lastDraftedSentBy: bidders.lastDraftedSentBy,
      createdAt: bidders.createdAt,
      lastDraftedSentByName: users.nameEn,
    })
      .from(bidders)
      .leftJoin(users, eq(bidders.lastDraftedSentBy, users.id))
      .where(eq(bidders.tenderId, id))
  ]);
  const statuses = bidderRows.length ? await db.select().from(bidderStatuses).where(inArray(bidderStatuses.bidderId, bidderRows.map(b => b.id))) : [];
  const withStatuses = bidderRows.map(b => ({ ...b, statuses: statuses.filter(s => s.bidderId === b.id) }));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Bidders" currentUser={{ nameEn: dbUser.nameEn, role: dbUser.role }} tender={{ id: tender.id, name: tender.name }} />
      <Dashboard view="bidders" tender={tender} bidders={withStatuses} checklistItems={items} currentUser={{ id: String(dbUser.id), nameHi: dbUser.nameHi, nameEn: dbUser.nameEn, phone: dbUser.phone, email: dbUser.email, role: dbUser.role }} />
    </div>
  );
}
