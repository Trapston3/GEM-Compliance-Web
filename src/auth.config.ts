import type { NextAuthConfig } from 'next-auth';

/**
 * NextAuth v5 Configuration Ground Rules:
 * 1. `trustHost: true` MUST BE PRESERVED AT ALL TIMES.
 *    This allows NextAuth to automatically infer request origin (host + port) dynamically.
 * 2. NEVER hardcode `AUTH_URL` or `NEXTAUTH_URL` in `.env.local` or `.env`.
 *    Hardcoded URLs break dynamic dev port assignment (e.g., localhost:3001) and Vercel Preview URLs.
 * 3. Edge Route Protection MUST be re-exported in `src/middleware.ts` (Next.js Edge Middleware entry point).
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized() {
      // Centralized session authorization is enforced in src/proxy.ts / src/middleware.ts
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.mustChangePassword = (user as any).mustChangePassword;
        token.email = user.email;
        token.name = user.name;
      }
      
      // Handle session updates (e.g. after password change)
      if (trigger === 'update' && session) {
        if (session.mustChangePassword !== undefined) {
          token.mustChangePassword = session.mustChangePassword;
        }
        if (session.email !== undefined) {
          token.email = session.email;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).mustChangePassword = token.mustChangePassword;
      }
      return session;
    },
  },
  providers: [], // populated in auth.ts
} satisfies NextAuthConfig;
