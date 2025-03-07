import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt-access'){
    canActivate(context: ExecutionContext){
        return super.canActivate(context);
    }

    handleRequest(err, user){
        if (err || !user) {
            throw err || new UnauthorizedException('Invalid or expired access token');
        }
        return user;
    }
}