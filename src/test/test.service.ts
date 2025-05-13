import { DatabaseService } from '@/database/database.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTestDto } from './dto/create-test.dto';

@Injectable()
export class TestService {
  constructor(private readonly db: DatabaseService) {}

  async createTest(dto: CreateTestDto, userId: number) {
    const createdTest = await this.db.test.create({
      data: {
        title: dto.title,
        authorId: userId,
        questions: {
          create: dto.questions.map((question) => ({
            text: question.question,
            answers: {
              create: question.options.map((option) => ({
                text: option,
                isCorrect: option === question.correctAnswer,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    return createdTest;
  }

  async deleteTest(testId: number) {
    const test = await this.db.test.findUnique({
      where: { id: testId },
    });

    if (!test) {
      throw new ForbiddenException('Access denied for deleting this test');
    }

    // Удаляем ответы, связанные с вопросами теста
    await this.db.answer.deleteMany({
      where: {
        question: {
          testId: testId,
        },
      },
    });

    // Удаляем вопросы, связанные с тестом
    await this.db.question.deleteMany({
      where: {
        testId: testId,
      },
    });

    await this.db.userTestResult.deleteMany({
      where: {
        testId: testId,
      },
    });

    // Удаляем сам тест
    return this.db.test.delete({
      where: { id: testId },
    });
  }

  async getUserTests(userId: number) {
    return this.db.test.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    });
  }

  async getTestById(testId: number, userId: number, userRole: string) {
    const test = await this.db.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Test is not found');
    }

    if (test.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Access denied for this test');
    }

    return test;
  }

  async getAllTests() {
    return this.db.test.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
