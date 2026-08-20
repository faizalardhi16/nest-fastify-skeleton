import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EnvConfig } from '../../config/env/env.config';
import { JwtPayload } from './strategies/jwt.strategy';

export interface LoginResponse {
  accessToken: string;
}

/**
 * AuthService — urus login/logout & token lifecycle. SOLID: cuma business logic auth.
 * NOTE: validasi user asli (cek DB/kredensial) plug di sini sesuai kebutuhan bisnis.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: EnvConfig,
  ) {}

  /**
   * Login contoh: buat JWT untuk user. TODO: ganti validasi kredensial dengan
   * repo user asli (misal Drizzle users table).
   */
  async login(email: string, _password: string): Promise<LoginResponse> {
    // TODO: validasi kredensial ke database (Drizzle) — ini demo, langsung generate.
    const payload: JwtPayload = { sub: 1, email };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }

  /** Generate access token dari payload (dipakai setelah login valid). */
  createToken(userId: number, email: string): Promise<string> {
    return this.jwtService.signAsync({ sub: userId, email });
  }

  /** Verify token (dipakai saat butuh paksa re-validasi). */
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token invalid atau sudah kadaluarsa');
    }
  }
}
