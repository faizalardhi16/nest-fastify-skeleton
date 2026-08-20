import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { EnvConfig } from '../config/env/env.config';
import { MongoLogService } from './mongo-log.service';

/**
 * LoggingModule — koneksi MongoDB khusus pencatatan log.
 * SOLID: cuma satu job — persist log ke MongoDB. Business log dipisah.
 * NOTE: setup siap-pakai, kredensial di .env. Koneksi lazy (onModuleInit).
 */
@Global()
@Module({
  providers: [MongoLogService],
  exports: [MongoLogService],
})
export class LoggingModule implements OnModuleDestroy {
  constructor(private readonly config: EnvConfig) {}

  async onModuleInit(): Promise<void> {
    if (!this.config.mongoUrl) return;
    try {
      await mongoose.connect(this.config.mongoUrl, {
        dbName: this.config.mongoDb,
        serverSelectionTimeoutMS: 5000,
      });
      // eslint-disable-next-line no-console
      console.log(`[LOG] MongoDB connected: ${this.config.mongoUrl}`);
    } catch (err) {
      // JANGAN crash app kalau Mongo offline — log warning, app tetap jalan.
      // Log baru akan lolos begitu Mongo tersedia (retry on-demand di service).
      // eslint-disable-next-line no-console
      console.warn(`[LOG] MongoDB tidak tersedia saat init: ${String(err)}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await mongoose.disconnect();
  }
}
