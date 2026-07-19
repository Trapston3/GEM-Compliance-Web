import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || !session.user) {
    redirect('/login');
  }

  const userId = parseInt((session.user as any).id, 10);
  
  // Fetch user details from database for live profile info
  const [dbUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!dbUser) {
    redirect('/login');
  }

  const currentUser = {
    nameEn: dbUser.nameEn,
    email: dbUser.email,
    role: dbUser.role,
    mustChangePassword: dbUser.mustChangePassword,
  };

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-[var(--mrpl-paper-50)] text-[var(--mrpl-ink-950)] transition-colors duration-200">
      <Sidebar tender={null} currentUser={currentUser} />
      <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
