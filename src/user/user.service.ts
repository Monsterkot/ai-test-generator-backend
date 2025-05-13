import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateResultDto, CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';
import { take } from 'rxjs';

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
      },
    });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async getAllUsers() {
    return await this.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }

  async deleteUser(id: number) {
    const userExists = await this.userExistsById(id);
  
    if (!userExists) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  
    // 1. Получаем все тесты пользователя
    const userTests = await this.db.test.findMany({
      where: {
        authorId: id,
      },
      select: {
        id: true,
      },
    });
  
    const testIds = userTests.map((test) => test.id);
  
    if (testIds.length > 0) {
      // 2. Удаляем результаты прохождения тестов пользователя
      await this.db.userTestResult.deleteMany({
        where: {
          testId: {
            in: testIds,
          },
        },
      });
  
      // 3. Получаем все вопросы этих тестов
      const questions = await this.db.question.findMany({
        where: {
          testId: {
            in: testIds,
          },
        },
        select: {
          id: true,
        },
      });
  
      const questionIds = questions.map((q) => q.id);
  
      if (questionIds.length > 0) {
        // 4. Удаляем ответы на эти вопросы
        await this.db.answer.deleteMany({
          where: {
            questionId: {
              in: questionIds,
            },
          },
        });
  
        // 5. Удаляем вопросы
        await this.db.question.deleteMany({
          where: {
            id: {
              in: questionIds,
            },
          },
        });
      }
  
      // 6. Удаляем тесты
      await this.db.test.deleteMany({
        where: {
          id: {
            in: testIds,
          },
        },
      });
    }
  
    // 7. Удаляем пользователя
    const deletedUser = await this.db.user.delete({
      where: {
        id,
      },
    });
  
    const { password: _, ...safeUser } = deletedUser;
  
    return {
      message: 'User deleted successfully',
      user: safeUser,
    };
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

  async saveResult(userId: number, dto: CreateResultDto) {
    // проверим, что тест существует
    const test = await this.db.test.findUnique({
      where: { id: dto.testId },
    });
    if (!test) {
      throw new NotFoundException(`Test with id=${dto.testId} not found`);
    }

    // пытаемся найти уже существующий результат
    const existing = await this.db.userTestResult.findFirst({
      where: { userId, testId: dto.testId },
    });

    if (existing) {
      // обновляем
      return this.db.userTestResult.update({
        where: { id: existing.id },
        data: {
          score: dto.score,
          takenAt: new Date(),
        },
      });
    } else {
      // создаём новую запись
      return this.db.userTestResult.create({
        data: {
          userId,
          testId: dto.testId,
          score: dto.score,
          takenAt: new Date(),
        },
      });
    }
  }
}
