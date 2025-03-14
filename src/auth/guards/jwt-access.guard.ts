import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { stat } from 'fs';

@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt-access') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    console.log('Cookies:', req.cookies);
    console.log('Authorization Header:', req.headers.authorization);
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      console.log('User:', user);
      console.log('Info:', info);
      throw err || new UnauthorizedException('Invalid or expired access token');
    }
    return user;
  }
}
