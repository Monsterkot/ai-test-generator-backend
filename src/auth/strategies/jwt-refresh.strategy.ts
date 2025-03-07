import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.refresh_token; // Достаём рефреш токен из куки
        },
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET, // Секретный ключ для верификации
      passReqToCallback: true, // Передаём `request` в `validate`
    });
  }

  async validate(request: Request, payload: { id: number; email: string }) {
    const refreshToken = request.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (refreshToken.exp < currentTime) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Проверяем валидность refresh-токена в БД
    const user = await this.authService.validateRefreshToken(payload.id, refreshToken);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return user;
  }
}
