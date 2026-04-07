import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { startScheduler } from './services/scheduler.service';

app.listen(env.PORT, async () => {
  // Verifica conexão com o banco no startup
  await prisma.$connect();
  console.log(`🚀 Servidor rodando em http://localhost:${env.PORT}`);
  console.log(`🗄️  Banco de dados: PostgreSQL (Prisma)`);
  console.log(`📁 Ambiente: ${env.NODE_ENV}`);

  startScheduler();
});
