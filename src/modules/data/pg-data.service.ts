import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module';
import {
  datastoreRecords,
  DataStoreRecord,
  NewDataStoreRecord,
} from '../../database/schema/datastore-records.schema';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { CreateItemDto } from './dto/create-item.dto';

/**
 * PgDataService — CRUD item ke PostgreSQL via Drizzle.
 * SOLID: service ini cuma tau satu store (PG) via DRIZZLE provider global.
 */
@Injectable()
export class PgDataService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(dto: CreateItemDto): Promise<DataStoreRecord> {
    const row: NewDataStoreRecord = {
      itemKey: dto.key,
      value: dto.value,
      meta: dto.meta,
    };
    const [created] = await this.db
      .insert(datastoreRecords)
      .values(row)
      .onConflictDoNothing({ target: datastoreRecords.itemKey })
      .returning();
    if (!created) {
      throw new NotFoundException(`Item PostgreSQL "${dto.key}" sudah ada`);
    }
    return created;
  }

  async get(key: string): Promise<DataStoreRecord> {
    const [row] = await this.db
      .select()
      .from(datastoreRecords)
      .where(eq(datastoreRecords.itemKey, key))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Item PostgreSQL "${key}" tidak ditemukan`);
    }
    return row;
  }
}
