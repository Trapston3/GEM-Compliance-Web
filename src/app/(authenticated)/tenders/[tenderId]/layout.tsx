import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { assertTenderAccess } from '@/lib/tenderAccess';

export default async function TenderLayout({ children, params }: { children: React.ReactNode; params: Promise<{ tenderId: string }> }) {
  const session = await auth(); if (!session?.user) redirect('/login');
  const { tenderId } = await params; const id = Number(tenderId); if (!Number.isInteger(id)) notFound();
  try { await assertTenderAccess(id, session); } catch { notFound(); }
  return <>{children}</>;
}
