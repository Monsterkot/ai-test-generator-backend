import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateTestDto } from './dto/create-test.dto';
import { TestService } from './test.service';
import { JwtAccessGuard } from '@/auth/guards/jwt-access.guard';

@Controller('tests')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @UseGuards(JwtAccessGuard)
  @Post()
  async createTest(@Body() dto: CreateTestDto, @Req() req) {//TODO delete maybe
    const userId = req.user.id;
    return this.testService.createTest(dto, userId);
  }

  @UseGuards(JwtAccessGuard)
  @Delete(':id')
  async deleteTest(@Param('id') id: string, @Req() req) {
    return this.testService.deleteTest(+id);
  }

  @UseGuards(JwtAccessGuard)
  @Get()
  async getUserTests(@Req() req) {
    const userId = req.user.id;
    return this.testService.getUserTests(userId);
  }

  @UseGuards(JwtAccessGuard)
  @Get('all')
  async getAllTests() {
    return this.testService.getAllTests();
  }

  @UseGuards(JwtAccessGuard)
  @Get(':id')
  async getTestWithQuestions(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.testService.getTestById(+id, userId, userRole);
  }

}
