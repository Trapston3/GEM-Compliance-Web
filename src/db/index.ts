import dns from 'dns';
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL || 'postgres://placeholder:placeholder@placeholder/placeholder';
const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('placeholder') ? false : { rejectUnauthorized: false }
});
export const db = drizzle(pool, { schema });
export type DbType = typeof db;
export * from './schema';
