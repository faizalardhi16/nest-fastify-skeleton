import {
  Body,
  Controller,
  Get,
  Post,
  Res,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { EnvConfig } from '../../config/env/env.config';
import {
  AuthUser,
  CurrentUser,
  Public,
} from './decorators/auth.decorators';
import { AuthUserDto, LoginDto } from './dto/auth.dto';
import { AuthService } from './auth.service';

/**
 * AuthController — HTTP endpoint untuk login/logout & profil.
 * SOLID: controller cuma routing; logic ada di AuthService.
 */
@ApiTags('Auth')
@ApiCookieAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: EnvConfig,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login, set JWT ke HttpOnly cookie' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ email: string }> {
    const { accessToken } = await this.authService.login(dto.email, dto.password);

    reply.setCookie(this.config.cookieName, accessToken, {
      httpOnly: this.config.cookieHttpOnly,
      secure: this.config.cookieSecure,
      sameSite: this.config.cookieSameSite,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    });

    return { email: dto.email };
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Logout, hapus cookie' })
  async logout(
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ success: boolean }> {
    reply.clearCookie(this.config.cookieName, { path: '/' });
    return { success: true };
  }

  @Get('me')
  @ApiOperation({ summary: 'Profil user yang login (dari cookie JWT)' })
  me(@CurrentUser() user: AuthUser): AuthUserDto {
    return { userId: user.userId, email: user.email };
  }
}
