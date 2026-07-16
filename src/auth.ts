import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { db, users, loginAttempts } from './db';
import { eq, and, gt, or } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut, handlers: { GET, POST } } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials, request) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) {
          return null;
        }

        // Get IP Address from request headers
        const ipAddress = (request.headers?.get('x-forwarded-for') || '127.0.0.1').split(',')[0].trim();

        // 1. Rate Limiting Check
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const attempts = await db
          .select()
          .from(loginAttempts)
          .where(
            and(
              or(
                eq(loginAttempts.email, email),
                eq(loginAttempts.ipAddress, ipAddress)
              ),
              gt(loginAttempts.attemptedAt, fifteenMinutesAgo)
            )
          );

        if (attempts.length >= 5) {
          throw new Error('Too many failed attempts. Try again in 15 minutes.');
        }

        // 2. Fetch User
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user) {
          // Record failed login attempt for rate-limiting
          await db.insert(loginAttempts).values({
            email,
            ipAddress,
          });
          return null;
        }

        // 3. Verify Password
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatch) {
          // Record failed login attempt
          await db.insert(loginAttempts).values({
            email,
            ipAddress,
          });
          return null;
        }

        // Return user details for JWT session
        return {
          id: user.id.toString(),
          name: user.nameEn,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
});
