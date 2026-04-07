import { Request, Response, NextFunction } from 'express';
import { marketplaceService } from '../services/marketplace.service';
import prisma from '../config/database';
import type { SearchProfessionalsInput } from '../schemas/marketplace.schemas';

export const marketplaceController = {
  async searchProfessionals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Se o aluno está autenticado, exclui profissionais cujos contractedTypes
      // já cobrem TODOS os tipos solicitados no filtro (ou todos os tipos do pro, se sem filtro).
      // Isso permite que um profissional multi-tipo apareça quando o aluno ainda
      // não tem contrato para aquele tipo específico.
      let excludeUserIds: string[] | undefined;
      if (req.user) {
        const filterType = (req.query as any).type as string | undefined;
        const activeLinks = await prisma.studentLink.findMany({
          where: { studentUserId: req.user.uid, status: 'active' },
          select: { professionalId: true, contractedTypes: true },
        });
        if (activeLinks.length > 0) {
          excludeUserIds = activeLinks
            .filter((l) =>
              filterType
                ? l.contractedTypes.includes(filterType)  // tem aquele tipo contratado
                : true,                                     // sem filtro: exclui todos os vinculados
            )
            .map((l) => l.professionalId);
        }
      }

      const result = await marketplaceService.searchProfessionals(
        req.query as unknown as SearchProfessionalsInput,
        excludeUserIds,
      );
      res.json(result);
    } catch (err) { next(err); }
  },

  async getPublicProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await marketplaceService.getPublicProfile(req.params.userId, req.user?.uid);
      res.json(profile);
    } catch (err) { next(err); }
  },

  async upsertRating(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { score } = req.body as { score: number };
      if (!Number.isInteger(score) || score < 1 || score > 5) {
        res.status(400).json({ message: 'score deve ser inteiro entre 1 e 5' });
        return;
      }
      const result = await marketplaceService.upsertRating(req.user!.uid, req.params.userId, score);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getMyRating(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await marketplaceService.getMyRating(req.user!.uid, req.params.userId);
      res.json(result);
    } catch (err) { next(err); }
  },

  async createContactRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user!.email) { res.status(400).json({ message: 'Conta sem e-mail' }); return; }
      const request = await marketplaceService.createContactRequest(
        req.user!.uid,
        req.user!.email,
        req.params.userId,
        req.body,
      );
      res.status(201).json(request);
    } catch (err) { next(err); }
  },

  async listContactRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const requests = await marketplaceService.listContactRequests(req.user!.uid, status);
      res.json(requests);
    } catch (err) { next(err); }
  },

  async deleteContactRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await marketplaceService.deleteContactRequest(req.user!.uid, req.params.requestId);
      res.status(204).end();
    } catch (err) { next(err); }
  },

  async clearResolvedRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await marketplaceService.clearResolvedRequests(req.user!.uid);
      res.json(result);
    } catch (err) { next(err); }
  },

  async respondToContactRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await marketplaceService.respondToContactRequest(
        req.user!.uid,
        req.params.requestId,
        req.body.action,
      );
      res.json(result);
    } catch (err) { next(err); }
  },
};
