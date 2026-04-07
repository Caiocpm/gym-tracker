import rateLimit from 'express-rate-limit';

// Limiter global — 200 requisições por IP a cada 15 minutos
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Muitas requisições. Tente novamente mais tarde.' },
});

// Limiter específico para autenticação — 10 por 15 minutos (anti brute-force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Muitas tentativas de login. Aguarde 15 minutos.' },
});
