import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { GameSession } from './domain/game';
import { PrismaService } from './prisma.service'; 

@Injectable()
export class GameService {

    constructor(private prisma: PrismaService) {}

    //Функция для загрузки игры(либо загружает старую, либо начинает новую если в базе данных ничего не сохранено)
    private async loadGame(roomId: string): Promise<GameSession> {
        const room = await this.prisma.gameRoom.findUnique({
            where: { id: roomId }
        });
        
        if (!room) throw new NotFoundException('Игра не найдена. Создайте комнату.');

        const game = new GameSession();
        game.importData(room.gameState); 
        return game;
    }

    //Превращаем классы в джинсон и сохраняем
    private async saveGame(roomId: string, game: GameSession) {
        const exported = game.exportData();
        await this.prisma.gameRoom.update({
            where: { id: roomId },
            data: {
                status: exported.status,
                gameState: exported as any 
            }
        });
    }

    
    public async createGame(roomId: string) {
        // Находим или создаем тестового пользователя
        const user = await this.prisma.user.upsert({
            where: { username: 'player1' },
            update: {},
            create: { username: 'player1', balance: 10000 }
        });

        // Проверяем, есть ли уже такая комната в СУБД
        const existingRoom = await this.prisma.gameRoom.findUnique({
            where: { id: roomId }
        });

        // Если игра существует - просто загружаем её и возвращаем фронтенду
        if (existingRoom) {
            const game = new GameSession();
            game.importData(existingRoom.gameState);
            return { 
                message: `🔄 Вы вернулись за стол ${roomId}`, 
                state: game.getState() 
            };
        }

        const game = new GameSession();
        const exported = game.exportData();

        await this.prisma.gameRoom.create({
            data: {
                id: roomId,
                status: exported.status,
                gameState: exported as any,
                userId: user.id
            }
        });

        return { message: ` Комната ${roomId} успешно создана`, state: game.getState() };
    }

    public async placeBid(roomId: string, amount: number) {
        const game = await this.loadGame(roomId); 
        try {
            game.bid(amount);                    
            await this.saveGame(roomId, game);    
            return { message: 'Ставка принята, игра началась!', state: game.getState() };
        } catch (err: any) {
            throw new BadRequestException(err.message);
        }
    }

    public async playerAction(roomId: string, action: string) {
        const game = await this.loadGame(roomId);
        try {
            switch (action) {
                case 'hit': game.hit(); break;
                case 'stand': game.stand(); break;
                case 'double': game.double(); break;
                case 'surrender': game.surrender(); break;
                case 'split': game.split(); break;
                default: throw new Error("Неизвестное действие!");
            }
            await this.saveGame(roomId, game);
            return { message: `Действие ${action.toUpperCase()} выполнено`, state: game.getState() };
        } catch (error: any) {
            throw new BadRequestException(error.message);
        }
    }
}