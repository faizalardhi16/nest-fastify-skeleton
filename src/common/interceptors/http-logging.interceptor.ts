import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { Observable, tap } from 'rxjs';

/**
 * HttpLoggingInterceptor — log request & response (method, url, status, durasi).
 * SOLID: cross-cutting concern (logging) dipisah dari business logic.
 */
@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const start = Date.now();
    const method = req.method;
    const url = req.url;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          const res = context.switchToHttp().getResponse();
          // eslint-disable-next-line no-console
          console.log(`[REQ] ${method} ${url} -> ${res.statusCode} (${duration}ms)`);
        },
        error: (err: unknown) => {
          const duration = Date.now() - start;
          // eslint-disable-next-line no-console
          console.error(`[REQ] ${method} ${url} -> ERROR (${duration}ms)`, err);
        },
      }),
    );
  }
}
