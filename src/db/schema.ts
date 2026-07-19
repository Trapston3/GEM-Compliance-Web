import { pgTable, serial, text, boolean, timestamp, integer, uniqueIndex, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define Role Enum
export const roleEnum = pgEnum('role', ['user', 'superuser', 'guest']);

// Define Checklist Category Enum
export const categoryEnum = pgEnum('category', ['submission', 'acceptance', 'text_note']);
export const tenderStatusEnum = pgEnum('tender_status', ['active', 'archived']);

// Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  slug: text('slug').unique().notNull(),
  nameHi: text('name_hi').notNull(),
  nameEn: text('name_en').notNull(),
  designationHi: text('designation_hi'),
  designationEn: text('designation_en'),
  departmentHi: text('department_hi').notNull().default('निविदा अनुपालन विभाग'),
  departmentEn: text('department_en').notNull().default('Tender Compliance Department'),
  phone: text('phone').notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('user'), // store role as string 'user' | 'superuser' | 'guest'
  mustChangePassword: boolean('must_change_password').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Tenders Table
export const tenders = pgTable('tenders', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  subjectLine: text('subject_line'),
  createdBy: integer('created_by').references(() => users.id),
  ownerId: integer('owner_id').references(() => users.id).notNull(),
  status: tenderStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Checklist Items Table
export const checklistItems = pgTable('checklist_items', {
  id: serial('id').primaryKey(),
  tenderId: integer('tender_id').references(() => tenders.id, { onDelete: 'cascade' }).notNull(),
  label: text('label').notNull(),
  category: text('category').notNull().default('submission'), // 'submission' | 'acceptance'
  groupOrder: integer('group_order').notNull(),
  sortOrder: integer('sort_order').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Bidders Table
export const bidders = pgTable('bidders', {
  id: serial('id').primaryKey(),
  tenderId: integer('tender_id').references(() => tenders.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  contactPerson: text('contact_person').notNull(),
  phone: text('phone').notNull(),
  lastDraftedSentAt: timestamp('last_drafted_sent_at'),
  lastDraftedSentBy: integer('last_drafted_sent_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Bidder Statuses Table
export const bidderStatuses = pgTable('bidder_statuses', {
  id: serial('id').primaryKey(),
  bidderId: integer('bidder_id').references(() => bidders.id, { onDelete: 'cascade' }).notNull(),
  checklistItemId: integer('checklist_item_id').references(() => checklistItems.id, { onDelete: 'cascade' }).notNull(),
  status: text('status').notNull(), // 'submitted' | 'not_submitted' | 'not_applicable' | 'accepted' | 'not_accepted'
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: integer('updated_by').references(() => users.id),
}, (table) => {
  return {
    bidderItemIdx: uniqueIndex('bidder_item_idx').on(table.bidderId, table.checklistItemId),
  };
});

// Activity Log Table
export const activityLog = pgTable('activity_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  tenderId: integer('tender_id').references(() => tenders.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  details: jsonb('details').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Login Attempts Table (for rate limiting)
export const loginAttempts = pgTable('login_attempts', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  ipAddress: text('ip_address').notNull(),
  attemptedAt: timestamp('attempted_at').notNull().defaultNow(),
});

// Define Relationships
export const usersRelations = relations(users, ({ many }) => ({
  tenders: many(tenders),
  activityLogs: many(activityLog),
  bidderStatuses: many(bidderStatuses),
}));

export const tendersRelations = relations(tenders, ({ one, many }) => ({
  creator: one(users, {
    fields: [tenders.createdBy],
    references: [users.id],
  }),
  owner: one(users, {
    fields: [tenders.ownerId],
    references: [users.id],
  }),
  checklistItems: many(checklistItems),
  bidders: many(bidders),
  activityLogs: many(activityLog),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one, many }) => ({
  tender: one(tenders, {
    fields: [checklistItems.tenderId],
    references: [tenders.id],
  }),
  statuses: many(bidderStatuses),
}));

export const biddersRelations = relations(bidders, ({ one, many }) => ({
  tender: one(tenders, {
    fields: [bidders.tenderId],
    references: [tenders.id],
  }),
  statuses: many(bidderStatuses),
  lastDraftedSentUser: one(users, {
    fields: [bidders.lastDraftedSentBy],
    references: [users.id],
  }),
}));

export const bidderStatusesRelations = relations(bidderStatuses, ({ one }) => ({
  bidder: one(bidders, {
    fields: [bidderStatuses.bidderId],
    references: [bidders.id],
  }),
  checklistItem: one(checklistItems, {
    fields: [bidderStatuses.checklistItemId],
    references: [checklistItems.id],
  }),
  updater: one(users, {
    fields: [bidderStatuses.updatedBy],
    references: [users.id],
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.id],
  }),
  tender: one(tenders, {
    fields: [activityLog.tenderId],
    references: [tenders.id],
  }),
}));

// Checklist Templates Table
export const checklistTemplates = pgTable('checklist_templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Checklist Template Items Table
export const checklistTemplateItems = pgTable('checklist_template_items', {
  id: serial('id').primaryKey(),
  templateId: integer('template_id').references(() => checklistTemplates.id, { onDelete: 'cascade' }).notNull(),
  label: text('label').notNull(),
  category: text('category').notNull().default('submission'),
  groupOrder: integer('group_order').notNull(),
  sortOrder: integer('sort_order').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const checklistTemplatesRelations = relations(checklistTemplates, ({ many }) => ({
  items: many(checklistTemplateItems),
}));

export const checklistTemplateItemsRelations = relations(checklistTemplateItems, ({ one }) => ({
  template: one(checklistTemplates, {
    fields: [checklistTemplateItems.templateId],
    references: [checklistTemplates.id],
  }),
}));

