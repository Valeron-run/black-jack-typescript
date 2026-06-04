import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { PrismaService } from './prisma.service';

@Module({
    controllers: [GameController], //Принимает HTTP запросы
    providers: [GameService, PrismaService], //Выполнение логики программы
})
export class GameModule {}