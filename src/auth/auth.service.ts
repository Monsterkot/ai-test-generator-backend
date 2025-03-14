import { UserService } from '@/user/user.service';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '@/user/dto/user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async generateTokens(userId: number, name: string, email: string, role: string) {
    const payload = { id: userId, name: name, email: email, role: role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '1d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '14d',
    });

    return { accessToken, refreshToken };
  }

  async saveRefreshToken(userId: number, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userService.updateUser(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  async deleteRefreshToken(userId: number) {
    const user = await this.userService.updateUser(userId, {
      refreshToken: undefined,
    });
    const { password: _, refreshToken: __, ...safeUser } = user;
    return safeUser;
  }

  async refreshAccessToken(userId: number, refreshToken: string) {
    const user = await this.userService.findUserById(userId);

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken!);
    if (!isMatch) {
      throw new ForbiddenException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user.id, user.name, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email');
    }

    const isPasswordvalid = await bcrypt.compare(password, user.password);
    if (!isPasswordvalid) {
      throw new UnauthorizedException('Invalid password');
    }

    const { password: _, refreshToken: __, ...result } = user;
    return result;
  }

  async validateRefreshToken(userId: number, refreshToken: string) {
    const user = await this.userService.findUserById(userId);
    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken!);
    if (!isMatch) {
      throw new ForbiddenException('Invalid refresh token');
    }
    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const tokens = await this.generateTokens(user.id, user.name, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return {
      user,
      tokens,
    };
  }

  async logout(userId: number) {
    const user = await this.deleteRefreshToken(userId);
    return { 
      user, 
    };
  }

  async register(createUserDto: CreateUserDto) {
    const user = await this.userService.createUser(createUserDto);
    return await this.login({
      email: createUserDto.email,
      password: createUserDto.password,
    });
  }
}
