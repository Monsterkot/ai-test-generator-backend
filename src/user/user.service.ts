import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly db: DatabaseService) {}

  async createUser(dto: CreateUserDto) {
    const existingUser = await this.db.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.db.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      }
    });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async getAllUsers() {
    return await this.db.user.findMany();
  }

  async deleteUser(id: number) {
    const userExists = await this.userExistsById(id);
  
    if (!userExists) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const deletedUser = await this.db.user.delete({
      where: {
        id,
      },
    });

    const { password: _, ...safeUser } = deletedUser;
    return{
      message: 'User deleted successfully',
      user: safeUser,
    }
  }

  async findUserById(id: number) {
    const user = await this.db.user.findFirst({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findUserByEmail(email: string) {
    const user = await this.db.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    return await this.db.user.update({
      where: {
        id,
      },
      data: dto,
    });
  }

  async userExistsById(id: number): Promise<boolean> {
    const user = await this.db.user.findUnique({
      where: { id },
    });
    return !!user;
  }

  async userExistsByEmail(email: string): Promise<boolean> {
    const user = await this.db.user.findUnique({
      where: { email },
    });
    return !!user;
  }
}
