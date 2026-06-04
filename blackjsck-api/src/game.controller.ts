import { Controller, Post, Param, Body, Get } from '@nestjs/common';
import { GameService } from './game.service'; 

@Controller('api/rooms')
export class GameController {
    constructor(private readonly gameService: GameService) {}

    @Get('ping')
    ping() {
        return { status: "Блэкджек API работает!" };
    }

    @Post(':id/create')
    async createRoom(@Param('id') roomId: string) {
        return await this.gameService.createGame(roomId);
    }

    @Post(':id/bid') //Вытаскиваем айди стола 
    async placeBid(@Param('id') roomId: string, @Body() body: { amount: number }) {
        return await this.gameService.placeBid(roomId, body.amount);
    }

   @Post(':id/action') //Вытаскиваем джинсон из тела пост запроса для действий
    async playerAction(@Param('id') roomId: string, @Body() body: { action: string }) {
        return await this.gameService.playerAction(roomId, body.action);
    }
}