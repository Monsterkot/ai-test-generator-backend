import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from 'express';
import { jwtDecode } from "jwt-decode";
import { ExtractJwt, Strategy } from 'passport-jwt';
import { combineLatest } from "rxjs";

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access'){
    constructor(){
        console.log('JwtAccessStrategy registered');
        super({
            jwtFromRequest: (request: Request) => {
                console.log('Extracting token from cookies:', request.cookies);
                return request.cookies?.accessToken || null;
              },
            ignoreExpiration: true,//TODO токен не проходит валидацию по времени истечения срока действия
            secretOrKey: process.env.JWT_ACCESS_SECRET,
            passReqToCallback: true,
        });
    }

    async validate(request: Request, payload: { id: number; name: string; email: string; role: string }) {
        const accessToken = request.cookies?.accessToken;
        if(!accessToken){
            throw new UnauthorizedException('Access token not found');
        }

        try{
            const decoded: {exp: number} = jwtDecode(accessToken);
            const currentTime = Math.floor(Date.now() / 1000);
            if (decoded.exp < currentTime) {
                console.log(`Token expired at ${decoded.exp}, current time: ${currentTime}`);
                throw new UnauthorizedException('Access token expired');
            }

            const user = { id: payload.id, name: payload.name, email: payload.email, role: payload.role };
            console.log(user);
            return user;
        }catch(e){
            throw new UnauthorizedException('Invalid access token');
        }
    }
}