import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import type { UarUser } from '../../database/schema';

export interface AuthenticatedUser {
  user: UarUser;
  roles: string[];
}

/**
 * UsersService — semua akses DB ke tabel UAR_* untuk auth & RBAC.
 * SOLID: satu concern — persistensi/query user-role-permission.
 */
@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /** Registrasi user baru: hash password + assign role default USER. */
  async registerUser(input: {
    email: string;
    password: string;
    name?: string;
  }): Promise<UarUser> {
    const existing = await this.db
      .select({ ID: schema.uarUsers.ID })
      .from(schema.uarUsers)
      .where(eq(schema.uarUsers.EMAIL, input.email))
      .limit(1);
    if (existing.length > 0) {
      throw new ConflictException('Email sudah terdaftar');
    }

    const hash = await bcrypt.hash(input.password, 10);
    const [user] = await this.db
      .insert(schema.uarUsers)
      .values({
        EMAIL: input.email,
        NAME: input.name ?? null,
        PASSWORD_HASH: hash,
      })
      .returning();

    await this.assignRole(user.ID, 'USER');
    return user;
  }

  /** Assign role ke user berdasarkan kode role (idempotent). */
  async assignRole(userId: number, roleCode: string): Promise<void> {
    const [role] = await this.db
      .select({ ID: schema.uarRoles.ID })
      .from(schema.uarRoles)
      .where(eq(schema.uarRoles.CODE, roleCode))
      .limit(1);
    if (!role) {
      throw new NotFoundException(`Role '${roleCode}' tidak ditemukan`);
    }

    await this.db
      .insert(schema.uarUserRoleMap)
      .values({ USER_ID: userId, ROLE_ID: role.ID })
      .onConflictDoNothing();
  }

  /** Validasi kredensial: cari user aktif lalu cocokkan bcrypt hash. */
  async validateCredentials(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const [user] = await this.db
      .select()
      .from(schema.uarUsers)
      .where(and(eq(schema.uarUsers.EMAIL, email), eq(schema.uarUsers.IS_ACTIVE, true)))
      .limit(1);
    if (!user) return null;

    const match = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!match) return null;

    return { user, roles: await this.getRoleCodes(user.ID) };
  }

  /** Kode-kode role milik user. */
  async getRoleCodes(userId: number): Promise<string[]> {
    const rows = await this.db
      .select({ CODE: schema.uarRoles.CODE })
      .from(schema.uarUserRoleMap)
      .innerJoin(schema.uarRoles, eq(schema.uarUserRoleMap.ROLE_ID, schema.uarRoles.ID))
      .where(eq(schema.uarUserRoleMap.USER_ID, userId));
    return rows.map((row) => row.CODE);
  }

  /** Kode-kode permission efektif user (gabungan dari semua role-nya). */
  async getPermissionCodes(userId: number): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ CODE: schema.uarPermissions.CODE })
      .from(schema.uarUserRoleMap)
      .innerJoin(
        schema.uarRolePermissionMap,
        eq(schema.uarUserRoleMap.ROLE_ID, schema.uarRolePermissionMap.ROLE_ID),
      )
      .innerJoin(
        schema.uarPermissions,
        eq(schema.uarRolePermissionMap.PERMISSION_ID, schema.uarPermissions.ID),
      )
      .where(eq(schema.uarUserRoleMap.USER_ID, userId));
    return rows.map((row) => row.CODE);
  }

  /** Daftar user (demo endpoint RBAC). */
  async listUsers(): Promise<
    Array<{ ID: number; EMAIL: string; NAME: string | null; IS_ACTIVE: boolean }>
  > {
    return this.db
      .select({
        ID: schema.uarUsers.ID,
        EMAIL: schema.uarUsers.EMAIL,
        NAME: schema.uarUsers.NAME,
        IS_ACTIVE: schema.uarUsers.IS_ACTIVE,
      })
      .from(schema.uarUsers)
      .orderBy(schema.uarUsers.ID);
  }
}
