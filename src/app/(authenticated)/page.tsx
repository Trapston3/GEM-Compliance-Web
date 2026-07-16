import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db, tenders, users, checklistItems, bidders, bidderStatuses } from '@/db';
import { eq } from 'drizzle-orm';
import Header from '@/components/Header';
import Dashboard from './Dashboard';

export default async function Page() {
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

  // Force password reset if mustChangePassword flag is true
  if (dbUser.mustChangePassword) {
    redirect('/account?mustChange=true');
  }

  if (!tender) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-500 bg-slate-50 dark:bg-zinc-950">
        <h2 className="text-lg font-bold mb-2">No Active Tender Found</h2>
        <p className="text-xs mb-4">Please configure the database and run the seed script to load default parameters.</p>
        <code className="bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3 rounded-lg font-mono text-[11px] block select-all">
          npm run db:seed
        </code>
      </div>
    );
  }

  // Fetch items, bidders, and status list in parallel
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

  // Construct bidder list with matching statuses
  const biddersWithStatuses = bidderList.map(b => {
    const statuses = statusList.filter(s => s.bidderId === b.id);
    return {
      ...b,
      statuses,
    };
  });

  const currentUser = {
    id: dbUser.id.toString(),
    nameHi: dbUser.nameHi,
    nameEn: dbUser.nameEn,
    phone: dbUser.phone,
    email: dbUser.email,
    role: dbUser.role,
  };

  const headerUser = {
    nameEn: dbUser.nameEn,
    role: dbUser.role,
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Tender Compliance Dashboard" currentUser={headerUser} />
      <Dashboard 
        tender={tender} 
        bidders={biddersWithStatuses} 
        checklistItems={items} 
        currentUser={currentUser} 
      />
    </div>
  );
}
