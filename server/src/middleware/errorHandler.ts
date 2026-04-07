import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../types/api.types';
import { env } from '../config/env';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Erros de validação Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Dados inválidos',
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  // Erros da aplicação com statusCode conhecido
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
      ...(err.code && { code: err.code }),
    });
    return;
  }

  // Prisma unique constraint violation (P2002)
  if (
    err instanceof Error &&
    'code' in err &&
    (err as NodeJS.ErrnoException).code === 'P2002'
  ) {
    res.status(409).json({ message: 'Registro duplicado' });
    return;
  }

  // Erro genérico — nunca vazar stack em produção
  console.error('Erro não tratado:', err);

  res.status(500).json({
    message: 'Erro interno do servidor',
    ...(env.NODE_ENV !== 'production' && err instanceof Error && { stack: err.stack }),
  });
}
