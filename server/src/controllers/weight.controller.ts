import { Request, Response, NextFunction } from 'express';
import { weightService } from '../services/weight.service';

export const weightController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entries = await weightService.list(req.params.userId);
      res.json({ data: entries });
    } catch (err) { next(err); }
  },

  async upsert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { weight, date, note } = req.body as { weight: number; date: string; note?: string };
      const entry = await weightService.upsert(req.params.userId, { weight, date, note });
      res.json({ data: entry });
    } catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await weightService.delete(req.params.userId, req.params.entryId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async getNutritionStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await weightService.getNutritionStats(req.params.userId);
      res.json({ data: stats });
    } catch (err) { next(err); }
  },
};
