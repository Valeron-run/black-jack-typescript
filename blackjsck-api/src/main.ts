import { NestFactory } from '@nestjs/core';
import { GameModule } from './game.module';

//Точка входа

async function bootstrap() {
  const app = await NestFactory.create(GameModule); //создает экземпляр приложения

  app.enableCors(); //Включаем корс(бэк на одном порту, фронт на другом - нужно чтобы они мэтчились)
  
  await app.listen(process.env.PORT ?? 3000);
  console.log("Сервер запущен на http://localhost:3000");
}
bootstrap();
