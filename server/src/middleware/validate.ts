import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Factory para validação do body com Zod.
 * Substitui req.body pelo dado parseado/coercionado.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Dados inválidos',
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

/**
 * Factory para validação de query params com Zod.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      res.status(400).json({
        message: 'Parâmetros de query inválidos',
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    req.query = result.data as typeof req.query;
    next();
  };
}
