import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { GetUser } from './decorators/get-user.decorator';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CreateUserDto } from '@/user/dto/user.dto';
import { Request, Response } from 'express';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtAccessGuard } from './guards/jwt-access.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() response: Response) {
    const { user, tokens } = await this.authService.login(loginDto);

    response.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return response.send({ message: 'User logged in successfully', user, tokens });
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto, @Res() response: Response) {
    const { user, tokens } = await this.authService.register(createUserDto);

    response.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return response.send({ message: 'User registered successfully', user, tokens });
  }

  @UseGuards(JwtRefreshGuard)
  @Post('logout')
  async logout(@Res() response: Response, @GetUser('id') userId: number) {
    response.clearCookie('accessToken');
    response.clearCookie('refreshToken');
    const user = await this.authService.logout(userId);
    console.log(user);
    return response.send({
      message: 'User logged out successfully',
      user,
    });
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(
    @GetUser('id') userId: number,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const refreshToken = request.cookies.refreshToken;

    const tokens = await this.authService.refreshAccessToken(
      userId,
      refreshToken,
    );

    response.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return response.send({
      message: 'Access and refresh tokens refreshed successfully',
      tokens,
    });
  }
}
