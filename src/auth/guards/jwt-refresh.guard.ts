import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh'){
    canActivate(context: ExecutionContext){
        return super.canActivate(context);
    }

    handleRequest(err, user){
        if (err || !user) {
            throw err || new UnauthorizedException('Invalid or expired refresh token');
        }
        return user;
    }
}