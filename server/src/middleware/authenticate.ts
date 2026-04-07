import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// Não rejeita — apenas popula req.user se o token for válido
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(authHeader.slice(7), env.JWT_SECRET) as jwt.JwtPayload;
      req.user = { uid: payload.uid as string, email: (payload.email as string) ?? null };
    } catch { /* token inválido/expirado — ignora */ }
  }
  next();
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token de autenticação obrigatório' });
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    req.user = {
      uid: payload.uid as string,
      email: (payload.email as string) ?? null,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      // Código específico para o interceptor do frontend renovar o token
      res.status(401).json({ message: 'Token expirado', code: 'TOKEN_EXPIRED' });
      return;
    }
    res.status(401).json({ message: 'Token inválido' });
  }
}
