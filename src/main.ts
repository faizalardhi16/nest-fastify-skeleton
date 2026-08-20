import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { EnvConfig } from './config/env/env.config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const config = new EnvConfig(process.env);
  const logger = new Logger('Bootstrap');

  const adapter = new FastifyAdapter({
    logger: config.isProduction ? false : true,
    // Timeout handling: default request timeout di-fastify
    requestTimeout: 30_000,
    bodyLimit: 10 * 1024 * 1024, // 10MB
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    { bufferLogs: false },
  );

  // ---- Cookie ----
  await app.register(fastifyCookie);

  // ---- Helmet (security headers) ----
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: config.isProduction ? undefined : false,
  });

  // ---- Rate limit / DDoS protection (per IP) ----
  await app.register(fastifyRateLimit, {
    max: 100, // max 100 request
    timeWindow: '1 minute', // per menit
    // Biar health check/ngrok dsb gak ke-limit
    allowList: ['127.0.0.1', '::1'],
  });

  // ---- CORS ----
  app.enableCors({
    origin: config.isProduction ? process.env.CORS_ORIGIN?.split(',') ?? false : true,
    credentials: true, // wajib utk cookie
  });

  // ---- Global prefix ----
  app.setGlobalPrefix(config.prefix);

  // ---- Global validation pipe ----
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ---- Global error filter ----
  app.useGlobalFilters(new AllExceptionsFilter());

  // ---- Swagger ----
  const swaggerConfig = new DocumentBuilder()
    .setTitle('NestJS Fastify Skeleton API')
    .setDescription('NestJS + Fastify + SOLID + Clean Architecture skeleton')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addCookieAuth(config.cookieName)
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(config.port, '0.0.0.0');
  logger.log(`🚀 API jalan di http://0.0.0.0:${config.port}/${config.prefix}`);
  logger.log(`📚 Swagger: http://0.0.0.0:${config.port}/docs`);
}

void bootstrap();
