import { Request, Response, NextFunction } from 'express';
import { workoutsService } from '../services/workouts.service';

export const workoutsController = {
  // ─── Workout Days ─────────────────────────────────────────────────────────

  async listDays(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = await workoutsService.listWorkoutDays(req.params.userId);
      res.json({ data: days });
    } catch (err) { next(err); }
  },

  async getDay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const day = await workoutsService.getWorkoutDay(req.params.userId, req.params.dayId);
      res.json({ data: day });
    } catch (err) { next(err); }
  },

  async createDay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const day = await workoutsService.createWorkoutDay(req.params.userId, req.body);
      res.status(201).json({ data: day });
    } catch (err) { next(err); }
  },

  async updateDay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const day = await workoutsService.updateWorkoutDay(req.params.userId, req.params.dayId, req.body);
      res.json({ data: day });
    } catch (err) { next(err); }
  },

  async deleteDay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await workoutsService.deleteWorkoutDay(req.params.userId, req.params.dayId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  // ─── Planned Exercises ────────────────────────────────────────────────────

  async addExercise(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exercise = await workoutsService.addPlannedExercise(req.params.userId, req.params.dayId, req.body);
      res.status(201).json({ data: exercise });
    } catch (err) { next(err); }
  },

  async updateExercise(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exercise = await workoutsService.updatePlannedExercise(
        req.params.userId, req.params.dayId, req.params.exerciseId, req.body
      );
      res.json({ data: exercise });
    } catch (err) { next(err); }
  },

  async deleteExercise(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await workoutsService.deletePlannedExercise(req.params.userId, req.params.dayId, req.params.exerciseId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  // ─── Workout Sessions ─────────────────────────────────────────────────────

  async listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await workoutsService.listWorkoutSessions(req.params.userId, req.query as Record<string, string>);
      res.json({ data: sessions });
    } catch (err) { next(err); }
  },

  async getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await workoutsService.getWorkoutSession(req.params.userId, req.params.sessionId);
      res.json({ data: session });
    } catch (err) { next(err); }
  },

  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await workoutsService.createWorkoutSession(req.params.userId, req.body);
      res.status(201).json({ data: session });
    } catch (err) { next(err); }
  },

  async updateSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await workoutsService.updateWorkoutSession(req.params.userId, req.params.sessionId, req.body);
      res.json({ data: session });
    } catch (err) { next(err); }
  },

  async deleteSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await workoutsService.deleteWorkoutSession(req.params.userId, req.params.sessionId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  // ─── Logged Exercises ─────────────────────────────────────────────────────

  async listLogged(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exercises = await workoutsService.listLoggedExercises(req.params.userId, req.query as Record<string, string>);
      res.json({ data: exercises });
    } catch (err) { next(err); }
  },

  async createLogged(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exercise = await workoutsService.createLoggedExercise(req.params.userId, req.body);
      res.status(201).json({ data: exercise });
    } catch (err) { next(err); }
  },

  async updateLogged(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exercise = await workoutsService.updateLoggedExercise(req.params.userId, req.params.exerciseId, req.body);
      res.json({ data: exercise });
    } catch (err) { next(err); }
  },

  async deleteLogged(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await workoutsService.deleteLoggedExercise(req.params.userId, req.params.exerciseId);
      res.status(204).send();
    } catch (err) { next(err); }
  },
};
