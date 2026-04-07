import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

/**
 * Permite acesso se:
 *   1. O usuário autenticado é o próprio dono dos dados (req.user.uid === userId), OU
 *   2. Existe um StudentLink ativo onde o profissional é req.user.uid e o aluno é userId.
 *
 * Usar nas rotas de leitura de workouts/nutrition que o profissional precisa consultar
 * em nome do aluno (ex: Dashboard > Clientes > Histórico).
 */
export async function authorizeUserOrProfessional(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { userId } = req.params;

  if (!req.user) {
    res.status(401).json({ message: 'Não autenticado' });
    return;
  }

  // Próprio usuário
  if (!userId || userId === req.user.uid) {
    next();
    return;
  }

  // Verifica vínculo profissional ativo
  try {
    const link = await prisma.studentLink.findFirst({
      where: {
        professionalId: req.user.uid,
        studentUserId: userId,
        status: 'active',
      },
      select: { id: true },
    });

    if (link) {
      next();
      return;
    }
  } catch {
    // Se a consulta falhar, nega o acesso por segurança
  }

  res.status(403).json({ message: 'Acesso negado' });
}
