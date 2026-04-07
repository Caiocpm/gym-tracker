// server/src/controllers/wods.controller.ts
import { Request, Response, NextFunction } from 'express';
import { wodsService } from '../services/wods.service';

export const wodsController = {
  // POST /api/wods
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { format, timeCap, rounds, description, movements, groupId } = req.body;
      const wod = await wodsService.create({
        format,
        timeCap,
        rounds,
        description,
        movements,
        createdBy: req.user!.uid,
        groupId,
      });
      res.status(201).json({ wod });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/wods/:code  (sem auth — qualquer um pode importar pelo código)
  async findByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const wod = await wodsService.findByCode(req.params.code);
      if (!wod) return res.status(404).json({ message: 'Código inválido ou WOD não encontrado' });
      res.json({ wod });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/social/groups/:groupId/wods
  async listByGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Math.min(Number(req.query.limit) || 20, 50);
      const offset = Number(req.query.offset) || 0;
      const wods = await wodsService.listByGroup(req.params.groupId, limit, offset);
      res.json({ wods });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/wods/mine
  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const wods = await wodsService.listByUser(req.user!.uid);
      res.json({ wods });
    } catch (err) {
      next(err);
    }
  },

  // PATCH /api/wods/:wodId/publish
  async publishToGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const wod = await wodsService.publishToGroup(
        req.params.wodId,
        req.body.groupId,
        req.user!.uid,
      );
      if (!wod) return res.status(403).json({ message: 'WOD não encontrado ou sem permissão' });
      res.json({ wod });
    } catch (err) {
      next(err);
    }
  },
};
