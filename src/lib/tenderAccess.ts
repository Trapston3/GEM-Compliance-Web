import { auth } from '@/auth';
import { db, bidders, checklistItems, tenders, users } from '@/db';
import { and, count, eq } from 'drizzle-orm';

export type TenderSession = {
  user?: { id?: string | null; role?: string | null } | null;
} | null;

export function canAccessTender(tender: { ownerId: number }, session: TenderSession) {
  const user = session?.user;
  return Boolean(user?.role === 'superuser' || (user?.id && tender.ownerId === Number(user.id)));
}

export async function assertTenderAccess(tenderId: number, session?: TenderSession) {
  const currentSession = session === undefined ? await auth() : session;
  const user = currentSession?.user as { id?: string | null; role?: string | null } | undefined;
  if (!user) throw new Error('Unauthorized');

  const [tender] = await db.select().from(tenders).where(
    user.role === 'superuser'
      ? eq(tenders.id, tenderId)
      : and(eq(tenders.id, tenderId), eq(tenders.ownerId, Number(user.id)))
  ).limit(1);

  if (!tender) throw new Error('Tender not found');
  return tender;
}

export async function getVisibleTenders(session?: TenderSession) {
  const currentSession = session === undefined ? await auth() : session;
  const user = currentSession?.user as { id?: string | null; role?: string | null } | undefined;
  if (!user) throw new Error('Unauthorized');

  const visible = user.role === 'superuser'
    ? await db.select({ tender: tenders, ownerName: users.nameEn }).from(tenders).leftJoin(users, eq(tenders.ownerId, users.id)).orderBy(tenders.createdAt)
    : (await db.select({ tender: tenders }).from(tenders).where(eq(tenders.ownerId, Number(user.id))).orderBy(tenders.createdAt)).map(({ tender }) => ({ tender, ownerName: undefined }));

  return Promise.all(visible.map(async ({ tender, ownerName }) => {
    const [bidderCount] = await db.select({ value: count() }).from(bidders).where(eq(bidders.tenderId, tender.id));
    const [checklistCount] = await db.select({ value: count() }).from(checklistItems).where(eq(checklistItems.tenderId, tender.id));
    return {
      ...tender,
      ownerName,
      bidderCount: Number(bidderCount?.value ?? 0),
      checklistCount: Number(checklistCount?.value ?? 0),
    };
  }));
}
