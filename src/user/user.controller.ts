import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CheckEmailDto, CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { get } from 'http';
import { JwtAccessGuard } from '@/auth/guards/jwt-access.guard';
import { Request } from 'express';
import { User } from '@prisma/client';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('add')
  async createUser(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @Delete('delete/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deleteUser(id);
  }

  @Get('all')
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get('find/id/:id')
  async findUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findUserById(id);
  }

  @Get('find/email/:email')
  async findUserByEmail(@Param('email') email: string) {
    return this.userService.findUserByEmail(email);
  }

  @Patch('update/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, dto);
  }

  @Get('exists/id/:id')
  async userExistsById(@Param('id', ParseIntPipe) id: number) {
    const exists = await this.userService.userExistsById(id);
    return { exists };
  }

  @Get('exists/email')
  async userExistsByEmail(@Query() query: CheckEmailDto) {
    const exists = await this.userService.userExistsByEmail(query.email);
    return { exists };
  }

  @UseGuards(JwtAccessGuard)
  @Get('profile')
  async getProfile(@Req() req: any) {
    return req.user;
  }
}
