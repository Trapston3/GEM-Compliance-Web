import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db, tenders, users, checklistItems, bidders, bidderStatuses } from '@/db';
import { eq } from 'drizzle-orm';
import Header from '@/components/Header';
import BulkEmails from './BulkEmails';

export default async function EmailsPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect('/login');
  }

  const userId = parseInt((session.user as any).id, 10);
  
  // Fetch user and tender in parallel
  const [[dbUser], [tender]] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).limit(1),
    db.select().from(tenders).limit(1)
  ]);

  if (!dbUser) {
    redirect('/login');
  }

  if (!tender) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-500 bg-slate-50 dark:bg-zinc-950">
        <h2 className="text-lg font-bold mb-2">No Active Tender Found</h2>
        <p className="text-xs">Please run the seed script to configure parameters.</p>
      </div>
    );
  }

  // Fetch checklist items, bidders, and status lists in parallel
  const [items, bidderList, statusList] = await Promise.all([
    db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.tenderId, tender.id))
      .orderBy(checklistItems.groupOrder, checklistItems.sortOrder),
    db
      .select()
      .from(bidders)
      .where(eq(bidders.tenderId, tender.id)),
    db.select().from(bidderStatuses)
  ]);

  // Map bidders with statuses
  const biddersWithStatuses = bidderList.map(b => {
    const statuses = statusList.filter(s => s.bidderId === b.id);
    return {
      ...b,
      statuses: statuses.map(s => ({
        id: s.id,
        bidderId: s.bidderId,
        checklistItemId: s.checklistItemId,
        status: s.status,
      })),
    };
  });

  const currentUser = {
    nameHi: dbUser.nameHi,
    nameEn: dbUser.nameEn,
    phone: dbUser.phone,
  };

  const headerUser = {
    nameEn: dbUser.nameEn,
    role: dbUser.role,
  };

  const serializedItems = items.map(item => ({
    id: item.id,
    label: item.label,
    category: item.category,
    groupOrder: item.groupOrder,
    sortOrder: item.sortOrder,
  }));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Bulk Compliance Emails" currentUser={headerUser} />
      <div className="flex-1 overflow-hidden p-6">
        <BulkEmails 
          tender={tender} 
          bidders={biddersWithStatuses} 
          checklistItems={serializedItems} 
          currentUser={currentUser} 
        />
      </div>
    </div>
  );
}
