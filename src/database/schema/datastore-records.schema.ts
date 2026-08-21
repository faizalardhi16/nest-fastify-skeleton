import { pgTable, serial, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';

/**
 * Tabel demo CRUD untuk PostgreSQL (via Drizzle).
 * SOLID: schema = definisi tabel murni tanpa logic.
 */
export const datastoreRecords = pgTable('datastore_records', {
  id: serial('id').primaryKey(),
  itemKey: varchar('item_key', { length: 120 }).notNull().unique(),
  value: varchar('value', { length: 5000 }).notNull(),
  meta: jsonb('meta').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type DataStoreRecord = typeof datastoreRecords.$inferSelect;
export type NewDataStoreRecord = typeof datastoreRecords.$inferInsert;
