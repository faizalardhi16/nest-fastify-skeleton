import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Tandai route sebagai public (skip auth guard). */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);

export interface AuthUser {
  userId: number;
  email: string;
}

/** Ambil user ter-autentikasi dari request. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthUser | undefined;
  },
);
