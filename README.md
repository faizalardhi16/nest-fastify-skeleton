# NestJS Fastify Skeleton

Backend starter **NestJS + Fastify** dengan **SOLID principle + Clean Architecture**.
Sudah dibundel setup lengkap untuk langsung dipakai produksi.

## Fitur (sesuai spec)

1. ✅ **NestJS + Fastify adapter** — `@nestjs/platform-fastify` (lebih cepat dari Express)
2. ✅ **Swagger** — auto docs di `/docs`
3. ✅ **Auth cookie** — JWT disimpan di HttpOnly cookie (bukan localStorage)
4. ✅ **Logging proper** — HttpLoggingInterceptor + global error filter
5. ✅ **Drizzle ORM** — PostgreSQL (schema di `src/database/schema/`)
6. ✅ **`.env` + ConfigService** — `EnvConfig` singleton (SOLID SRP)
7. ✅ **Dockerfile** — multistage, non-root, production-ready
8. ✅ **MongoDB logging** — pencatatan log ke MongoDB (collection terpisah)
9. ✅ **Redis cache** — koneksi + service cache abstraction
10. ✅ **S3 AWS + Alibaba** — StorageProvider interface, pilih via env
11. ✅ **SWC compiler** — build 10-20x lebih cepat
12. ✅ **Timeout + retry + DDoS + throttle** — rate-limit per IP, request timeout

## Teknologi

- **Runtime**: Node 22, TypeScript, SWC (Rust compiler)
- **Framework**: NestJS 10 + Fastify 4
- **ORM**: Drizzle (PostgreSQL via `pg`)
- **Cache**: Redis (ioredis)
- **Logging**: MongoDB (mongoose)
- **Storage**: AWS S3 SDK + Alibaba OSS (S3-compatible)
- **Auth**: JWT + cookie (passport-jwt + @fastify/cookie)
- **Security**: @fastify/helmet + @fastify/rate-limit (DDoS protection)

## Setup

```bash
# 1. Install
npm install

# 2. Konfigurasi
cp .env.example .env   # isi kredensial (DB, Mongo, Redis, S3)

# 3. Jalankan (SWC — cepat)
npm run start:dev       # development (watch)
npm run build           # production build (SWC)
npm run start:prod      # jalanin hasil build

# 4. Type check (SWC gak type-check, jalankan terpisah)
npm run typecheck

# 5. Lint
npm run lint
```

## Struktur (Clean Architecture + SOLID)

```
src/
├── main.ts                      # Bootstrap (Fastify, Swagger, helmet, rate-limit, cookie)
├── app.module.ts                # Composition root (wiring semua module)
├── config/                      # Config layer (EnvConfig singleton)
│   ├── config.module.ts
│   └── env/env.config.ts        # Single source of truth config
├── common/                      # Cross-cutting concerns
│   ├── filters/                 # Global error filter
│   └── interceptors/            # Transform (envelope) + Logging
├── database/                    # Drizzle + PostgreSQL
│   ├── database.module.ts
│   └── schema/                  # Table definitions
├── logging/                     # MongoDB log service
│   ├── logging.module.ts
│   └── mongo-log.service.ts
├── redis/                       # Redis cache
│   ├── redis.module.ts
│   └── redis-cache.service.ts
├── storage/                     # S3 abstraction (DIP)
│   ├── storage-provider.interface.ts
│   ├── aws-s3.storage.ts
│   ├── alibaba-s3.storage.ts
│   └── storage.module.ts
├── types/                       # Type augmentation (fastify cookie)
└── modules/                     # Feature modules
    ├── auth/                    # JWT + cookie auth
    │   ├── controller / service / module
    │   ├── strategies/          # JwtStrategy
    │   ├── guards/              # JwtAuthGuard
    │   └── decorators/          # @Public, @CurrentUser
    └── health/                  # /health endpoint
```

## API

| Endpoint | Auth | Fungsi |
|----------|------|--------|
| `GET /api/health` | Public | Health check semua dependensi |
| `POST /api/auth/login` | Public | Login, set cookie |
| `POST /api/auth/logout` | Public | Hapus cookie |
| `GET /api/auth/me` | JWT | Profil user dari cookie |

Swagger UI: **`/docs`**

## Konfigurasi env penting

```bash
PORT=3000
APP_PREFIX=api
JWT_SECRET=...            # ganti di produksi!
COOKIE_SECURE=true        # wajib true di HTTPS/produksi
STORAGE_PROVIDER=aws      # 'aws' | 'alibaba'
```

## Docker

```bash
docker build -t nest-fastify-skeleton .
docker run -p 3100:3100 --env-file .env nest-fastify-skeleton
```

## Catatan SWC

SWC **tidak melakukan type-check** (biar cepat). Type error tidak memblokir build.
Selalu jalankan `npm run typecheck` (tsc --noEmit) sebagai gate terpisah di CI/deploy.

## Drizzle (migrasi)

```bash
npx drizzle-kit generate   # generate SQL migrasi dari schema
npx drizzle-kit migrate    # apply migrasi ke DB
```
