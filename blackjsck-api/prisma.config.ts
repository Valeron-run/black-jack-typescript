import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    // Вставляем ссылку напрямую, без функции env()
    url: "postgresql://postgres:root@localhost:5432/blackjack_db?schema=public",
  },
});