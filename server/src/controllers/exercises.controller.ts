import { Request, Response, NextFunction } from 'express';
import { exercisesService } from '../services/exercises.service';

export const exercisesController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const defs = await exercisesService.listDefinitions(req.user?.uid);
      res.json({ data: defs });
    } catch (err) { next(err); }
  },

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const def = await exercisesService.getDefinition(req.params.id);
      res.json({ data: def });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const def = await exercisesService.createDefinition(req.body, req.user!.uid);
      res.status(201).json({ data: def });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const def = await exercisesService.updateDefinition(req.params.id, req.body, req.user!.uid);
      res.json({ data: def });
    } catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await exercisesService.deleteDefinition(req.params.id, req.user!.uid);
      res.status(204).send();
    } catch (err) { next(err); }
  },
};
