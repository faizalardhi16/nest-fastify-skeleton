import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { EnvConfig } from '../config/env/env.config';
import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE');

/**
 * DatabaseModule — koneksi PostgreSQL via Drizzle.
 * SOLID: module ini cuma expose satu provider (DRIZZLE) yang di-share global.
 */
@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [EnvConfig],
      useFactory: (config: EnvConfig): NodePgDatabase<typeof schema> => {
        const pool = new Pool({
          host: config.dbHost,
          port: config.dbPort,
          user: config.dbUser,
          password: config.dbPassword,
          database: config.dbName,
          ssl: config.dbSsl ? { rejectUnauthorized: false } : false,
          max: 10,
          idleTimeoutMillis: 30_000,
        });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule implements OnModuleDestroy {
  private readonly pools: Pool[] = [];

  onModuleDestroy(): void {
    for (const pool of this.pools) {
      void pool.end();
    }
  }
}
