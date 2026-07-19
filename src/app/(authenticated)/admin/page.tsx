import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { requireSuperuser, getUsers, getActivityLogs } from '@/app/actions/user';
import { getChecklistTemplates } from '@/app/actions/template';
import Header from '@/components/Header';
import AdminDashboard from './AdminDashboard';
import { db, tenders, bidders, users } from '@/db';
import { eq } from 'drizzle-orm';

export default async function AdminPage() {
  // Re-verify role server-side
  let session;
  try {
    session = await requireSuperuser();
  } catch (error) {
    redirect('/');
  }

  // Fetch users, activity logs, and templates in parallel
  const [usersList, logsList, tenderRows, templatesList] = await Promise.all([
    getUsers(),
    getActivityLogs(),
    db.select({ tender: tenders, ownerName: users.nameEn }).from(tenders).leftJoin(users, eq(tenders.ownerId, users.id)),
    getChecklistTemplates(),
  ]);
  const tenderCounts = await Promise.all(tenderRows.map(async ({ tender, ownerName }) => ({ ...tender, ownerName: ownerName || 'Unknown', bidderCount: (await db.select({ id: bidders.id }).from(bidders).where(eq(bidders.tenderId, tender.id))).length })));

  const currentUser = {
    id: (session.user as any).id,
    email: session.user?.email || '',
    role: (session.user as any).role || 'user',
  };

  const headerUser = {
    nameEn: session.user?.name || '',
    role: currentUser.role,
  };

  // Map Date objects to plain Date strings/objects if Next.js complains about non-plain objects, or serialize
  const serializedUsers = usersList.map(u => ({
    ...u,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));

  const serializedLogs = logsList.map(l => ({
    ...l,
    createdAt: l.createdAt,
  }));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Admin Dashboard" currentUser={headerUser} />
      <AdminDashboard 
        initialUsers={serializedUsers} 
        initialLogs={serializedLogs} 
        initialTenders={tenderCounts}
        initialTemplates={templatesList}
        currentUser={currentUser} 
      />
    </div>
  );
}
