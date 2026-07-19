import { redirect } from 'next/navigation';

export default async function TenderIdRootPage({ params }: { params: Promise<{ tenderId: string }> }) {
  const { tenderId } = await params;
  redirect(`/tenders/${tenderId}/overview`);
}
