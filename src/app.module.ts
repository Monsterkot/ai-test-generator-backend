import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UserService } from './user/user.service';
import { AuthService } from './auth/auth.service';
import { QuestionService } from './question/question.service';
import { TestService } from './test/test.service';
import { AiService } from './ai/ai.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { QuestionModule } from './question/question.module';
import { TestModule } from './test/test.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [DatabaseModule, UserModule, AuthModule, QuestionModule, TestModule, AiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
