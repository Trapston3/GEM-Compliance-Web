import * as dotenv from 'dotenv';
import * as path from 'path';

// Resolve paths to the root .env files
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
