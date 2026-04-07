import { Request, Response, NextFunction } from 'express';

/**
 * Verifica que o usuário autenticado só acessa os próprios dados.
 * Deve ser usado APÓS o middleware `authenticate`.
 * Compara req.params.userId com req.user.uid.
 */
export function authorizeUser(req: Request, res: Response, next: NextFunction): void {
  const { userId } = req.params;

  if (!req.user) {
    res.status(401).json({ message: 'Não autenticado' });
    return;
  }

  if (userId && userId !== req.user.uid) {
    res.status(403).json({ message: 'Acesso negado: você não pode acessar dados de outro usuário' });
    return;
  }

  next();
}
