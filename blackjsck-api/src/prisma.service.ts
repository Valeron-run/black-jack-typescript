import 'dotenv/config'; // 1. ПРИНУДИТЕЛЬНО читаем .env файл перед запуском кода
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pool: Pool; // Сохраняем ссылку на пул, чтобы иметь к нему доступ

  constructor() {
    const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:root@localhost:5432/blackjack_db?schema=public";
    

    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    
    super({ adapter });
    
    this.pool = pool; 
  }

  async onModuleInit() {
    await this.$connect();
    console.log('База данных подключена!');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end(); 
    console.log('База данных отключена');
  }
}