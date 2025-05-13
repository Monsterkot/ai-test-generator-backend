import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { jwtDecode } from 'jwt-decode';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: (request: Request) => {
        return request.cookies?.refreshToken || null;
      },
      ignoreExpiration: true,
      secretOrKey: process.env.JWT_REFRESH_SECRET, // Секретный ключ для верификации
      passReqToCallback: true, // Передаём `request` в `validate`
    });
  }

  async validate(request: Request, payload: { id: number; email: string }) {
    console.log('JwtRefreshStrategy validate');
    const refreshToken = request.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (refreshToken.exp < currentTime) {
      throw new UnauthorizedException('Refresh token expired');
    }

    try {
      const decoded: { exp: number } = jwtDecode(refreshToken);
      const currentTime = Math.floor(Date.now() / 1000);

      if (decoded.exp < currentTime) {
        console.log(
          `Token expired at ${decoded.exp}, current time: ${currentTime}`,
        );
        throw new UnauthorizedException('Refresh token expired');
      }

      const user = await this.authService.validateRefreshToken(
        payload.id,
        refreshToken,
      );
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      console.log(user);
      return user;
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
