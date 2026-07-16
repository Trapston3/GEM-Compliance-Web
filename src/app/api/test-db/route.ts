import { NextResponse } from 'next/server';
import { db, users } from '@/db';

export async function GET() {
  try {
    const authSecret = process.env.AUTH_SECRET;
    const dbUrl = process.env.DATABASE_URL;

    const mask = (str: string | undefined) => {
      if (!str) return 'MISSING';
      if (str.length <= 8) return '***';
      return `${str.substring(0, 6)}...${str.substring(str.length - 6)}`;
    };

    // Run test query
    const result = await db.select().from(users).limit(1);

    return NextResponse.json({
      success: true,
      authSecretMasked: mask(authSecret),
      dbUrlMasked: mask(dbUrl),
      querySuccess: Array.isArray(result),
      firstUserEmailMasked: result[0] ? mask(result[0].email) : 'NO_USERS'
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || err.toString()
    }, { status: 500 });
  }
}
