import { INestApplication, Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient {
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Connected to the database!');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('❌ Disconnected from the database');
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
      console.log('❌ Disconnected from the database');
    })
  }
}


