import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Carrega o .env do diretório server/
// Firebase removido — usando PostgreSQL + google-auth-library
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Banco de dados
  DATABASE_URL: z.string().min(1, 'DATABASE_URL obrigatório'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET deve ter pelo menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Google OAuth (sem Firebase)
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID obrigatório'),

  // FCM push notifications — service account JSON path (opcional; push desabilitado sem ele)
  FCM_SERVICE_ACCOUNT_PATH: z.string().optional(),
  FCM_PROJECT_ID: z.string().optional(),

  // Gemini AI
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY obrigatório'),

  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
