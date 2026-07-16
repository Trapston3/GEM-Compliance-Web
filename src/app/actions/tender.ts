'use server';

import { db, tenders } from '@/db';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { logActivity } from '@/lib/auditLog';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const UpdateTenderSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Tender name is required"),
  subjectLine: z.string().nullable(),
});

export async function getTender() {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  // Fetch the first tender (seeded as Tender-01)
  const [tender] = await db.select().from(tenders).limit(1);
  return tender || null;
}

export async function updateTender(formData: { id: number; name: string; subjectLine: string | null }) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  // Validate inputs
  const validated = UpdateTenderSchema.parse(formData);

  const [oldTender] = await db.select().from(tenders).where(eq(tenders.id, validated.id)).limit(1);
  if (!oldTender) {
    throw new Error('Tender not found');
  }

  // Update
  await db.update(tenders)
    .set({
      name: validated.name,
      subjectLine: validated.subjectLine,
      updatedAt: new Date(),
    })
    .where(eq(tenders.id, validated.id));

  // Log activity
  await logActivity('tender.update', {
    tenderId: validated.id,
    oldName: oldTender.name,
    newName: validated.name,
    oldSubjectLine: oldTender.subjectLine,
    newSubjectLine: validated.subjectLine,
  }, validated.id);

  revalidatePath('/');
  return { success: true };
}
