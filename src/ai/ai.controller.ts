import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAccessGuard } from '@/auth/guards/jwt-access.guard';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @UseGuards(JwtAccessGuard)
  @Get('generate')
  async generatetest(
    @Query('topic') topic: string,
    @Query('difficulty') difficulty: string,
    @Query('questionCount') questionCount: number,
    @Req() req,
  ) {
    return await this.aiService.generateTest(
      topic,
      difficulty,
      questionCount,
      req.user.id,
    );
  }
}
