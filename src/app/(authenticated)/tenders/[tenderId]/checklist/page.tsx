import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getChecklistItems } from '@/app/actions/checklist';
import { assertTenderAccess } from '@/lib/tenderAccess';
import Header from '@/components/Header';
import ChecklistSettings from '../../../checklist/ChecklistSettings';

export default async function TenderChecklistPage({ params }: { params: Promise<{ tenderId: string }> }) {
  const session = await auth(); if (!session?.user) redirect('/login'); const tender = await assertTenderAccess(Number((await params).tenderId), session); const items = await getChecklistItems(tender.id);
  return <div className="flex-1 flex flex-col overflow-hidden"><Header title="Checklist Setup" currentUser={{nameEn: session.user.name || '', role: (session.user as any).role || 'user'}} tender={tender}/><div className="flex-1 overflow-y-auto p-3 sm:p-6"><ChecklistSettings items={items} tenderId={tender.id} currentUserRole={(session.user as any).role || 'user'}/></div></div>;
}
