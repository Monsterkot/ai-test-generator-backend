import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access'){
    constructor(){
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => request?.cookies?.access_token,
            ]),
            secretOrKey: process.env.JWT_ACCESS_SECRET,
            passReqToCallback: true,
        });
    }

    async validate(request: Request ,payload: {id: number, email: string, role: string}){
        const accessToken = request.cookies?.access_token;
        if(!accessToken){
            throw new UnauthorizedException('Access token not found');
        }

        const currentTime = Math.floor(Date.now() / 1000);
        if (accessToken.exp < currentTime) {
            throw new UnauthorizedException('Access token expired');
        }
        
        const user = { id: payload.id, email: payload.email, role: payload.role };
        return user;
    }
}