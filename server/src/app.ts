import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { globalLimiter } from './middleware/rateLimiter';
import apiRouter from './routes/index';

const app = express();

// Segurança
app.use(helmet());

// CORS — aceita lista de origens + qualquer localhost em dev
const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requests sem origin (ex: Postman, mobile)
      if (!origin) return callback(null, true);
      // Em desenvolvimento aceita qualquer localhost independente da porta
      if (env.NODE_ENV === 'development' && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS bloqueado para origem: ${origin}`));
    },
    credentials: true,
  })
);

// Parse JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limit global
app.use(globalLimiter);

// Arquivos estáticos — logos e uploads
// Cross-Origin-Resource-Policy: cross-origin permite que o app mobile e o dashboard
// carreguem imagens hospedadas aqui sem bloqueio pelo helmet.
app.use('/uploads', (_req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../../uploads')));

// Rotas
app.use('/api', apiRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handler de erros (deve ser o último middleware)
app.use(errorHandler);

export default app;
