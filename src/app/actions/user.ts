'use server';

import { db, users, activityLog } from '@/db';
import { eq, and, ne, desc } from 'drizzle-orm';
import { auth } from '@/auth';
import { logActivity } from '@/lib/auditLog';
import { revalidatePath } from 'next/cache';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { z } from 'zod';

const UpdateAccountSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
});

const AdminUpdateUserSchema = z.object({
  id: z.number(),
  nameHi: z.string().min(1, "Hindi name is required"),
  nameEn: z.string().min(1, "English name is required"),
  designationHi: z.string().nullable(),
  designationEn: z.string().nullable(),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(['user', 'superuser', 'guest']),
});

// Helper to enforce superuser permission on the server-side
export async function requireSuperuser() {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const role = (session.user as any).role;
  if (role !== 'superuser') {
    throw new Error('Forbidden: Superuser role required.');
  }

  return session;
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session) {
    return null;
  }

  const userId = parseInt((session.user as any).id, 10);
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user || null;
}

export async function updateOwnAccount(data: {
  email: string;
  phone: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const validated = UpdateAccountSchema.parse(data);
  const userId = parseInt((session.user as any).id, 10);

  // 1. Fetch current user from DB
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    throw new Error('User not found');
  }

  // 2. Validate email uniqueness if email changed
  if (validated.email !== user.email) {
    const [existing] = await db.select().from(users).where(eq(users.email, validated.email)).limit(1);
    if (existing) {
      throw new Error('Email is already in use by another account');
    }
  }

  // 3. Verify password for email or password change
  const isChangingPassword = !!validated.newPassword;
  const isChangingEmail = validated.email !== user.email;

  if (isChangingPassword || isChangingEmail) {
    if (!validated.currentPassword) {
      throw new Error('Current password is required to change email or password');
    }
    const isPasswordCorrect = await bcrypt.compare(validated.currentPassword, user.passwordHash);
    if (!isPasswordCorrect) {
      throw new Error('Incorrect current password');
    }
  }

  // 4. Update fields
  const updateData: any = {
    email: validated.email,
    phone: validated.phone,
    updatedAt: new Date(),
  };

  if (isChangingPassword && validated.newPassword) {
    updateData.passwordHash = await bcrypt.hash(validated.newPassword, 10);
    // User successfully set their own password, clear force-change flag
    updateData.mustChangePassword = false;
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));

  // 5. Log actions
  if (isChangingEmail) {
    await logActivity('account.update_email', { oldEmail: user.email, newEmail: validated.email });
  }
  if (isChangingPassword) {
    await logActivity('account.update_password', {});
  }
  if (validated.phone !== user.phone) {
    await logActivity('account.update_phone', { oldPhone: user.phone, newPhone: validated.phone });
  }

  revalidatePath('/');
  return { success: true, mustChangePassword: updateData.mustChangePassword ?? user.mustChangePassword };
}

// ==========================================
// ADMIN DASHBOARD SERVER ACTIONS (Superuser)
// ==========================================

export async function getUsers() {
  await requireSuperuser();
  return await db.select().from(users).orderBy(users.id);
}

export async function updateUser(data: {
  id: number;
  nameHi: string;
  nameEn: string;
  designationHi: string | null;
  designationEn: string | null;
  phone: string;
  email: string;
  role: 'user' | 'superuser' | 'guest';
}) {
  const session = await requireSuperuser();
  const currentUserId = parseInt((session.user as any).id, 10);

  const validated = AdminUpdateUserSchema.parse(data);

  // Fetch current details
  const [oldUser] = await db.select().from(users).where(eq(users.id, validated.id)).limit(1);
  if (!oldUser) {
    throw new Error('User not found');
  }

  // Validate email uniqueness if changing email
  if (validated.email !== oldUser.email) {
    const [existing] = await db.select().from(users).where(eq(users.email, validated.email)).limit(1);
    if (existing) {
      throw new Error('Email is already in use by another account');
    }
  }

  // Prevent superuser lockout (cannot downgrade own role)
  if (validated.id === currentUserId && validated.role !== 'superuser') {
    throw new Error('You cannot downgrade your own superuser role. Lockout protection active.');
  }

  // Update
  await db.update(users)
    .set({
      nameHi: validated.nameHi,
      nameEn: validated.nameEn,
      designationHi: validated.designationHi,
      designationEn: validated.designationEn,
      phone: validated.phone,
      email: validated.email,
      role: validated.role,
      updatedAt: new Date(),
    })
    .where(eq(users.id, validated.id));

  // Log activity
  await logActivity('admin.update_user', {
    targetUserId: validated.id,
    targetEmail: validated.email,
    changes: {
      nameHi: oldUser.nameHi !== validated.nameHi ? { old: oldUser.nameHi, new: validated.nameHi } : undefined,
      nameEn: oldUser.nameEn !== validated.nameEn ? { old: oldUser.nameEn, new: validated.nameEn } : undefined,
      designationHi: oldUser.designationHi !== validated.designationHi ? { old: oldUser.designationHi, new: validated.designationHi } : undefined,
      designationEn: oldUser.designationEn !== validated.designationEn ? { old: oldUser.designationEn, new: validated.designationEn } : undefined,
      phone: oldUser.phone !== validated.phone ? { old: oldUser.phone, new: validated.phone } : undefined,
      email: oldUser.email !== validated.email ? { old: oldUser.email, new: validated.email } : undefined,
      role: oldUser.role !== validated.role ? { old: oldUser.role, new: validated.role } : undefined,
    }
  });

  revalidatePath('/admin');
  return { success: true };
}

// Generate random password
function generateTempPassword(length = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return password;
}

export async function resetUserPassword(targetUserId: number) {
  await requireSuperuser();

  const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
  if (!targetUser) {
    throw new Error('User not found');
  }

  // Generate random temporary password
  const tempPass = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPass, 10);

  // Set must_change_password to true on reset
  await db.update(users)
    .set({
      passwordHash,
      mustChangePassword: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, targetUserId));

  // Log reset (never record password in audit logs)
  await logActivity('admin.reset_user_password', {
    targetUserId,
    targetEmail: targetUser.email,
  });

  revalidatePath('/admin');
  return { success: true, tempPassword: tempPass };
}

export async function getActivityLogs() {
  await requireSuperuser();

  // Fetch all logs joined with user names
  const logs = await db
    .select({
      id: activityLog.id,
      userId: activityLog.userId,
      tenderId: activityLog.tenderId,
      action: activityLog.action,
      details: activityLog.details,
      createdAt: activityLog.createdAt,
      userEmail: users.email,
      userName: users.nameEn,
    })
    .from(activityLog)
    .leftJoin(users, eq(activityLog.userId, users.id))
    .orderBy(desc(activityLog.createdAt));

  return logs;
}
