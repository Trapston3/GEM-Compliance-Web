import { auth } from '@/auth';
import { db, activityLog } from '@/db';

export async function logActivity(action: string, details: any = {}, tenderId?: number) {
  try {
    const session = await auth();
    const userId = session?.user ? parseInt((session.user as any).id, 10) : null;
    
    await db.insert(activityLog).values({
      userId,
      tenderId: tenderId || null,
      action,
      details,
    });
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
}
