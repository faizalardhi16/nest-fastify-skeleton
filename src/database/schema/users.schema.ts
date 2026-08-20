import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

/**
 * Contoh entity. SOLID: schema Drizzle = cuma definisi tabel, tanpa logic.
 * Buat tabel bisnis lo di sini (users, dsb).
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
