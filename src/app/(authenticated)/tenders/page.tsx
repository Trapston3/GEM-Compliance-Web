import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getTenders } from '@/app/actions/tender';
import { getChecklistTemplates } from '@/app/actions/template';
import Header from '@/components/Header';
import TenderPicker from './TenderPicker';

export default async function TendersPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenders = await getTenders();
  const templates = await getChecklistTemplates();
  return <div className="flex-1 flex flex-col overflow-hidden"><Header title="My Tenders" currentUser={{ nameEn: session.user.name || '', role: (session.user as any).role || 'user' }} /><TenderPicker initialTenders={tenders} templates={templates} currentUserRole={(session.user as any).role || 'user'} currentUserId={Number((session.user as any).id)} /></div>;
}
