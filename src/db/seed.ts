import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set in environment variables');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

// Generate a random temporary password
function generateTempPassword(length = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return password;
}

const usersToSeed = [
  {
    slug: "shailendra",
    nameHi: "शैलेंद्र कुमार तिवारी",
    nameEn: "Shailendra Kumar Tiwari",
    designationHi: "सहायक प्रबंधक ( सामग्री )",
    designationEn: "Assistant Manager (Materials)",
    phone: "0824-2882244",
    email: "shailendra.tiwari@mrpl.co.in",
    role: "user"
  },
  {
    slug: "nagaraj",
    nameHi: "नागराज",
    nameEn: "Nagaraj",
    designationHi: "जूनियर ऑफिसर",
    designationEn: "Junior Officer",
    phone: "0824-2882281 / 0824-4032281",
    email: "nagaraj@mrpl.co.in",
    role: "user"
  },
  {
    slug: "mahakuteshwar",
    nameHi: "महाकुटेश्वर मोषी",
    nameEn: "Mahakuteshwar Moshi",
    designationHi: "",
    designationEn: "",
    phone: "0824-2882293",
    email: "mahakuteshm@mrpl.co.in",
    role: "user"
  },
  {
    slug: "rashmi",
    nameHi: "रश्मि",
    nameEn: "Rashmi",
    designationHi: "",
    designationEn: "",
    phone: "0824-2883234",
    email: "rashmimohan@mrpl.co.in",
    role: "user"
  },
  {
    slug: "surekha",
    nameHi: "सुरेखा",
    nameEn: "Surekha",
    designationHi: "वरिष्ठ सहायक",
    designationEn: "Sr. Assistant",
    phone: "0824-2882285",
    email: "surekha@mrpl.co.in",
    role: "user"
  },
  {
    slug: "ajay",
    nameHi: "अजय शेल्के",
    nameEn: "Ajay Shelke",
    designationHi: "",
    designationEn: "Superuser",
    phone: "000000",
    email: "ajayshelke@mrpl.co.in",
    role: "superuser"
  },
  {
    slug: "guest1",
    nameHi: "अतिथि 1",
    nameEn: "Guest 1",
    designationHi: "अतिथि",
    designationEn: "Guest",
    phone: "",
    email: "guest1@mrpl.co.in",
    role: "guest"
  },
  {
    slug: "guest2",
    nameHi: "अतिथि 2",
    nameEn: "Guest 2",
    designationHi: "अतिथि",
    designationEn: "Guest",
    phone: "",
    email: "guest2@mrpl.co.in",
    role: "guest"
  },
  {
    slug: "guest3",
    nameHi: "अतिथि 3",
    nameEn: "Guest 3",
    designationHi: "अतिथि",
    designationEn: "Guest",
    phone: "",
    email: "guest3@mrpl.co.in",
    role: "guest"
  },
  {
    slug: "guest4",
    nameHi: "अतिथि 4",
    nameEn: "Guest 4",
    designationHi: "अतिथि",
    designationEn: "Guest",
    phone: "",
    email: "guest4@mrpl.co.in",
    role: "guest"
  }
];

const checklistItemsToSeed = [
  { label: "DECLARATION ON BANNING or HOLIDAY LISTING", category: "submission", groupOrder: 1, sortOrder: 1 },
  { label: "NIL DEVIATION", category: "submission", groupOrder: 1, sortOrder: 2 },
  { label: "MSE-UDYAM", category: "submission", groupOrder: 1, sortOrder: 3 },
  { label: "ISO/NSIC", category: "submission", groupOrder: 1, sortOrder: 4 },
  { label: "INTEGRITY PACT", category: "submission", groupOrder: 1, sortOrder: 5 },
  { label: "UNDERTAKING WRT COMPLIANCE OF RESTRICTIONS FOR COUNTRIES WHICH SHARE LAND BORDER WITH INDIA", category: "submission", groupOrder: 1, sortOrder: 6 },
  { label: "SIGNED MRPL GPC & TD", category: "submission", groupOrder: 1, sortOrder: 7 },
  { label: "LOCAL CONTENT & PA", category: "submission", groupOrder: 1, sortOrder: 8 },
  { label: "EMD", category: "submission", groupOrder: 2, sortOrder: 9 },
  { label: "PRICE REDUCTION SCHEDULE (PRS) CLAUSE", category: "acceptance", groupOrder: 3, sortOrder: 10 },
  { label: "PERFORMANCE BANK GUARANTY (PBG) CUM SECURITY DEPOSIT (SD)", category: "acceptance", groupOrder: 3, sortOrder: 11 },
  { label: "PAYMENT TERMS AS PER GeM", category: "acceptance", groupOrder: 3, sortOrder: 12 },
  { label: "DELIVERY PERIOD AS PER TERMS AND CONDITIONS", category: "acceptance", groupOrder: 3, sortOrder: 13 },
  { label: "OFFER VALIDITY", category: "acceptance", groupOrder: 3, sortOrder: 14 },
  { label: "ANY OTHER DEVIATIONS", category: "text_note", groupOrder: 3, sortOrder: 15 }
];

async function seed() {
  console.log('--- STARTING SEED SCRIPT ---');

  try {
    // 1. Seed Users
    console.log('Seeding users...');
    const userCredentials: { name: string; email: string; tempPass: string }[] = [];
    const seededUsers: any[] = [];

    for (const u of usersToSeed) {
      const tempPass = generateTempPassword();
      const passwordHash = await bcrypt.hash(tempPass, 10);
      
      const [insertedUser] = await db.insert(schema.users).values({
        slug: u.slug,
        nameHi: u.nameHi,
        nameEn: u.nameEn,
        designationHi: u.designationHi || null,
        designationEn: u.designationEn || null,
        phone: u.phone || "N/A",
        email: u.email,
        passwordHash,
        role: u.role,
        mustChangePassword: true,
      }).returning();

      seededUsers.push(insertedUser);
      userCredentials.push({ name: u.nameEn, email: u.email, tempPass });
    }

    console.log('\n=============================================================');
    console.log('TEMPORARY USER PASSWORDS (DISTRIBUTE OUT-OF-BAND):');
    console.log('=============================================================');
    userCredentials.forEach(cred => {
      console.log(`User: ${cred.name.padEnd(25)} | Email: ${cred.email.padEnd(30)} | Password: ${cred.tempPass}`);
    });
    console.log('=============================================================\n');

    // 2. Seed Default Tender
    console.log('Seeding default tender...');
    const superuser = seededUsers.find(u => u.role === 'superuser') || seededUsers[0];
    const [tender] = await db.insert(schema.tenders).values({
      name: "Tender-01",
      subjectLine: "Compliance verification against GeM Bid for Materials Procurement",
      createdBy: superuser.id,
      ownerId: superuser.id,
      status: 'active',
    }).returning();

    // 3. Seed Checklist Items
    console.log('Seeding checklist items...');
    for (const item of checklistItemsToSeed) {
      await db.insert(schema.checklistItems).values({
        tenderId: tender.id,
        label: item.label,
        category: item.category,
        groupOrder: item.groupOrder,
        sortOrder: item.sortOrder,
      });
    }

    // 4. Seed Checklist Templates
    console.log('Seeding checklist templates...');
    const [template] = await db.insert(schema.checklistTemplates).values({
      name: "Standard Master Checklist",
      description: "Standard compliance verification checklist for materials procurement",
    }).returning();

    for (const item of checklistItemsToSeed) {
      await db.insert(schema.checklistTemplateItems).values({
        templateId: template.id,
        label: item.label,
        category: item.category,
        groupOrder: item.groupOrder,
        sortOrder: item.sortOrder,
      });
    }

    console.log('Seeding complete successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
