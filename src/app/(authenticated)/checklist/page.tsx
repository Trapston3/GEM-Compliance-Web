import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getChecklistItems } from '@/app/actions/checklist';
import { getTender } from '@/app/actions/tender';
import Header from '@/components/Header';
import ChecklistSettings from './ChecklistSettings';

export default async function ChecklistPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect('/login');
  }

  const tender = await getTender();
  if (!tender) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-slate-500">
        No active tender found. Please run the seed script first.
      </div>
    );
  }

  const items = await getChecklistItems(tender.id);

  const headerUser = {
    nameEn: session.user?.name || '',
    role: (session.user as any).role || 'user',
  };

  const serializedItems = items.map(item => ({
    ...item,
    createdAt: item.createdAt,
  }));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Checklist Settings" currentUser={headerUser} />
      <div className="flex-1 overflow-y-auto p-3 sm:p-6">
        <ChecklistSettings 
          items={serializedItems} 
          tenderId={tender.id} 
          currentUserRole={headerUser.role} 
        />
      </div>
    </div>
  );
}
