import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { requireSuperuser, getUsers, getActivityLogs } from '@/app/actions/user';
import Header from '@/components/Header';
import AdminDashboard from './AdminDashboard';

export default async function AdminPage() {
  // Re-verify role server-side
  let session;
  try {
    session = await requireSuperuser();
  } catch (error) {
    redirect('/');
  }

  // Fetch users and activity logs in parallel
  const [usersList, logsList] = await Promise.all([
    getUsers(),
    getActivityLogs()
  ]);

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
        currentUser={currentUser} 
      />
    </div>
  );
}
