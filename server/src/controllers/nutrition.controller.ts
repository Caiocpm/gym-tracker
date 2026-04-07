import { Request, Response, NextFunction } from 'express';
import { nutritionService } from '../services/nutrition.service';
import { voiceParseService } from '../services/voice-parse.service';
import { photoAnalyzeService } from '../services/photo-analyze.service';

export const nutritionController = {
  // ─── Food Entries ─────────────────────────────────────────────────────────

  async listFood(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entries = await nutritionService.listFoodEntries(req.params.userId, req.query as Record<string, string>);
      res.json({ data: entries });
    } catch (err) { next(err); }
  },

  async getFood(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entry = await nutritionService.getFoodEntry(req.params.userId, req.params.entryId);
      res.json({ data: entry });
    } catch (err) { next(err); }
  },

  async createFood(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entry = await nutritionService.createFoodEntry(req.params.userId, req.body);
      res.status(201).json({ data: entry });
    } catch (err) { next(err); }
  },

  async updateFood(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entry = await nutritionService.updateFoodEntry(req.params.userId, req.params.entryId, req.body);
      res.json({ data: entry });
    } catch (err) { next(err); }
  },

  async deleteFood(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await nutritionService.deleteFoodEntry(req.params.userId, req.params.entryId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async consumeFood(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entry = await nutritionService.consumeFoodEntry(req.params.userId, req.params.entryId);
      res.json({ data: entry });
    } catch (err) { next(err); }
  },

  async unconsumeFood(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entry = await nutritionService.unconsumeFoodEntry(req.params.userId, req.params.entryId);
      res.json({ data: entry });
    } catch (err) { next(err); }
  },

  // ─── Water Entries ────────────────────────────────────────────────────────

  async listWater(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entries = await nutritionService.listWaterEntries(req.params.userId, req.query as Record<string, string>);
      res.json({ data: entries });
    } catch (err) { next(err); }
  },

  async getWater(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entry = await nutritionService.getWaterEntry(req.params.userId, req.params.entryId);
      res.json({ data: entry });
    } catch (err) { next(err); }
  },

  async createWater(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entry = await nutritionService.createWaterEntry(req.params.userId, req.body);
      res.status(201).json({ data: entry });
    } catch (err) { next(err); }
  },

  async updateWater(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entry = await nutritionService.updateWaterEntry(req.params.userId, req.params.entryId, req.body);
      res.json({ data: entry });
    } catch (err) { next(err); }
  },

  async deleteWater(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await nutritionService.deleteWaterEntry(req.params.userId, req.params.entryId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async consumeWater(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entry = await nutritionService.consumeWaterEntry(req.params.userId, req.params.entryId);
      res.json({ data: entry });
    } catch (err) { next(err); }
  },

  async unconsumeWater(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entry = await nutritionService.unconsumeWaterEntry(req.params.userId, req.params.entryId);
      res.json({ data: entry });
    } catch (err) { next(err); }
  },

  // ─── Daily Goals ──────────────────────────────────────────────────────────

  async getGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const goals = await nutritionService.getDailyGoals(req.params.userId);
      res.json({ data: goals });
    } catch (err) { next(err); }
  },

  async updateGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const goals = await nutritionService.updateDailyGoals(req.params.userId, req.body);
      res.json({ data: goals });
    } catch (err) { next(err); }
  },

  // ─── Predefined Foods ─────────────────────────────────────────────────────

  async listFoods(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const foods = await nutritionService.listPredefinedFoods(
        req.query as Record<string, string>,
        req.user?.uid
      );
      res.json({ data: foods });
    } catch (err) { next(err); }
  },

  async getFood2(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const food = await nutritionService.getPredefinedFood(req.params.foodId);
      res.json({ data: food });
    } catch (err) { next(err); }
  },

  async createFood2(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const food = await nutritionService.createPredefinedFood(req.body, req.user!.uid);
      res.status(201).json({ data: food });
    } catch (err) { next(err); }
  },

  async updateFood2(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const food = await nutritionService.updatePredefinedFood(req.params.foodId, req.body, req.user!.uid);
      res.json({ data: food });
    } catch (err) { next(err); }
  },

  async deleteFood2(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await nutritionService.deletePredefinedFood(req.params.foodId, req.user!.uid);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  // ─── Diet Plan ────────────────────────────────────────────────────────────

  async listDietPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await nutritionService.listDietPlan(req.params.userId);
      res.json({ data: items });
    } catch (err) { next(err); }
  },

  async createDietPlanItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await nutritionService.createDietPlanItem(req.params.userId, req.body);
      res.status(201).json({ data: item });
    } catch (err) { next(err); }
  },

  async updateDietPlanItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await nutritionService.updateDietPlanItem(req.params.userId, req.params.itemId, req.body);
      res.json({ data: item });
    } catch (err) { next(err); }
  },

  async deleteDietPlanItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await nutritionService.deleteDietPlanItem(req.params.userId, req.params.itemId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async consumeDietPlanItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = req.body as { date: string };
      const entry = await nutritionService.consumeDietPlanItem(req.params.userId, req.params.itemId, date);
      res.json({ data: entry });
    } catch (err) { next(err); }
  },

  async unconsumeDietPlanItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = req.body as { date: string };
      await nutritionService.unconsumeDietPlanItem(req.params.userId, req.params.itemId, date);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  // ─── Stats ────────────────────────────────────────────────────────────────

  async getStatsSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query as { startDate: string; endDate: string };
      const stats = await nutritionService.getStatsSummary(req.params.userId, startDate, endDate);
      res.json({ data: stats });
    } catch (err) { next(err); }
  },

  async getDailyProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = req.query as { date: string };
      const progress = await nutritionService.getDailyProgress(req.params.userId, date);
      res.json({ data: progress });
    } catch (err) { next(err); }
  },

  async parseVoiceCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { text } = req.body as { text: string };
      if (!text?.trim()) { res.json({ data: { meal: 'snack', items: [] } }); return; }
      const result = await voiceParseService.parseVoiceCommand(text);
      res.json({ data: result });
    } catch (err: any) {
      if (err?.statusCode === 429) { res.status(429).json({ error: err.message }); return; }
      next(err);
    }
  },

  async analyzePhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { imageBase64, mimeType } = req.body as { imageBase64: string; mimeType?: string };
      if (!imageBase64?.trim()) {
        res.status(400).json({ error: 'imageBase64 obrigatório' });
        return;
      }
      const result = await photoAnalyzeService.analyzePhoto(imageBase64, mimeType);
      res.json({ data: result });
    } catch (err: any) {
      console.error('[analyzePhoto] erro:', err?.message ?? err);
      if (err?.statusCode === 429) {
        res.status(429).json({ error: err.message });
        return;
      }
      next(err);
    }
  },
};
