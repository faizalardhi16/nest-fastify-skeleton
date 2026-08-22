import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Schema RBAC (Role-Based Access Control) dengan prefix UAR_.
 * Semua nama tabel & kolom UPPERCASE (di-quote otomatis oleh Drizzle).
 * SOLID: schema Drizzle = cuma definisi tabel, tanpa logic.
 */

/** UAR_USERS — akun pengguna untuk autentikasi. */
export const uarUsers = pgTable(
  'UAR_USERS',
  {
    ID: serial('ID').primaryKey(),
    EMAIL: varchar('EMAIL', { length: 255 }).notNull().unique(),
    NAME: varchar('NAME', { length: 255 }),
    PASSWORD_HASH: varchar('PASSWORD_HASH', { length: 255 }).notNull(),
    IS_ACTIVE: boolean('IS_ACTIVE').notNull().default(true),
    CREATED_AT: timestamp('CREATED_AT', { withTimezone: true }).notNull().defaultNow(),
    UPDATED_AT: timestamp('UPDATED_AT', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('IDX_UAR_USERS_EMAIL').on(table.EMAIL),
  ],
);

/** UAR_ROLES — master role (ADMIN, USER, dsb). */
export const uarRoles = pgTable('UAR_ROLES', {
  ID: serial('ID').primaryKey(),
  CODE: varchar('CODE', { length: 50 }).notNull().unique(),
  NAME: varchar('NAME', { length: 100 }).notNull(),
  DESCRIPTION: text('DESCRIPTION'),
});

/** UAR_PERMISSIONS — master permission granular (mis. user:create). */
export const uarPermissions = pgTable('UAR_PERMISSIONS', {
  ID: serial('ID').primaryKey(),
  CODE: varchar('CODE', { length: 100 }).notNull().unique(),
  NAME: varchar('NAME', { length: 100 }).notNull(),
  DESCRIPTION: text('DESCRIPTION'),
});

/** UAR_USER_ROLE_MAP — relasi many-to-many user <-> role. */
export const uarUserRoleMap = pgTable(
  'UAR_USER_ROLE_MAP',
  {
    ID: serial('ID').primaryKey(),
    USER_ID: integer('USER_ID')
      .notNull()
      .references(() => uarUsers.ID, { onDelete: 'cascade' }),
    ROLE_ID: integer('ROLE_ID')
      .notNull()
      .references(() => uarRoles.ID, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('UQ_UAR_USER_ROLE_MAP').on(table.USER_ID, table.ROLE_ID),
    index('IDX_UAR_USER_ROLE_MAP_ROLE_ID').on(table.ROLE_ID),
  ],
);

/** UAR_ROLE_PERMISSION_MAP — relasi many-to-many role <-> permission. */
export const uarRolePermissionMap = pgTable(
  'UAR_ROLE_PERMISSION_MAP',
  {
    ID: serial('ID').primaryKey(),
    ROLE_ID: integer('ROLE_ID')
      .notNull()
      .references(() => uarRoles.ID, { onDelete: 'cascade' }),
    PERMISSION_ID: integer('PERMISSION_ID')
      .notNull()
      .references(() => uarPermissions.ID, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('UQ_UAR_ROLE_PERMISSION_MAP').on(table.ROLE_ID, table.PERMISSION_ID),
    index('IDX_UAR_ROLE_PERMISSION_MAP_PERMISSION_ID').on(table.PERMISSION_ID),
  ],
);

// ===== Infer types =====
export type UarUser = typeof uarUsers.$inferSelect;
export type NewUarUser = typeof uarUsers.$inferInsert;

export type UarRole = typeof uarRoles.$inferSelect;
export type NewUarRole = typeof uarRoles.$inferInsert;

export type UarPermission = typeof uarPermissions.$inferSelect;
export type NewUarPermission = typeof uarPermissions.$inferInsert;

export type UarUserRoleMap = typeof uarUserRoleMap.$inferSelect;
export type NewUarUserRoleMap = typeof uarUserRoleMap.$inferInsert;

export type UarRolePermissionMap = typeof uarRolePermissionMap.$inferSelect;
export type NewUarRolePermissionMap = typeof uarRolePermissionMap.$inferInsert;
