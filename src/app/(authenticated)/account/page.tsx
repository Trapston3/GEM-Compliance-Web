import React from 'react';
import { auth } from '@/auth';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import AccountForm from './AccountForm';

export default async function AccountPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect('/login');
  }

  const userId = parseInt((session.user as any).id, 10);
  const [dbUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!dbUser) {
    redirect('/login');
  }

  const userProp = {
    email: dbUser.email,
    phone: dbUser.phone,
    nameEn: dbUser.nameEn,
    nameHi: dbUser.nameHi,
    designationEn: dbUser.designationEn,
    designationHi: dbUser.designationHi,
    departmentEn: dbUser.departmentEn,
    departmentHi: dbUser.departmentHi,
    mustChangePassword: dbUser.mustChangePassword,
  };

  const headerUser = {
    nameEn: dbUser.nameEn,
    role: dbUser.role,
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="My Account" currentUser={headerUser} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          <AccountForm user={userProp} />
        </div>
      </div>
    </div>
  );
}
