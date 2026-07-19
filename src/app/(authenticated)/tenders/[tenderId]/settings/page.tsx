import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { assertTenderAccess } from '@/lib/tenderAccess';
import Header from '@/components/Header';
import TenderSettings from './TenderSettings';

export default async function TenderSettingsPage({ params }: { params: Promise<{ tenderId: string }> }) { const session = await auth(); if (!session?.user) redirect('/login'); const tender = await assertTenderAccess(Number((await params).tenderId), session); return <div className="flex-1 flex flex-col overflow-hidden"><Header title="Tender Settings" currentUser={{nameEn: session.user.name || '', role: (session.user as any).role || 'user'}} tender={tender}/><TenderSettings tender={tender} role={(session.user as any).role || 'user'}/></div>; }
