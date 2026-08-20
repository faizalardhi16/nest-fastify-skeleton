import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { EnvConfig } from '../config/env/env.config';
import { RedisCacheService } from './redis-cache.service';
import { REDIS_CLIENT } from './redis.constants';

/**
 * RedisModule — setup koneksi Redis untuk cache.
 * SOLID: module cuma nyediain client + service cache. Business app gak tau detail ioredis.
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [EnvConfig],
      useFactory: (config: EnvConfig): Redis => {
        const client = new Redis({
          host: config.redisHost,
          port: config.redisPort,
          password: config.redisPassword || undefined,
          db: config.redisDb,
          lazyConnect: true,
          maxRetriesPerRequest: 2,
          retryStrategy: (times: number) => Math.min(times * 200, 2000),
        });
        // Jangan crash app kalau Redis down — log & reconnect otomatis
        client.on('error', (err) => {
          // eslint-disable-next-line no-console
          console.error(`[REDIS] error: ${err.message}`);
        });
        return client;
      },
    },
    RedisCacheService,
  ],
  exports: [REDIS_CLIENT, RedisCacheService],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
      // eslint-disable-next-line no-console
      console.log('[REDIS] connected');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[REDIS] tidak tersedia saat init: ${String(err)}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.client.disconnect();
  }
}
