import { Router } from 'express';
import { nutritionController } from '../controllers/nutrition.controller';
import { authenticate } from '../middleware/authenticate';
import { authorizeUser } from '../middleware/authorizeUser';
import { validate } from '../middleware/validate';
import {
  createFoodEntrySchema,
  updateFoodEntrySchema,
  createWaterEntrySchema,
  updateWaterEntrySchema,
  updateDailyGoalsSchema,
  createPredefinedFoodSchema,
  updatePredefinedFoodSchema,
  createDietPlanItemSchema,
  updateDietPlanItemSchema,
} from '../schemas/nutrition.schemas';

const router = Router();

router.use(authenticate);

// ─── Voice parse (rota global, sem userId) ────────────────────────────────────
router.post('/voice-parse', nutritionController.parseVoiceCommand);
router.post('/analyze-photo', nutritionController.analyzePhoto);

// ─── Predefined Foods (rota global, sem userId) ───────────────────────────────
router.get('/foods', nutritionController.listFoods);
router.post('/foods', validate(createPredefinedFoodSchema), nutritionController.createFood2);
router.get('/foods/:foodId', nutritionController.getFood2);
router.patch('/foods/:foodId', validate(updatePredefinedFoodSchema), nutritionController.updateFood2);
router.delete('/foods/:foodId', nutritionController.deleteFood2);

// ─── Rotas com :userId (requerem authorizeUser) ───────────────────────────────

// Food Entries
router.get('/:userId/food', authorizeUser, nutritionController.listFood);
router.post('/:userId/food', authorizeUser, validate(createFoodEntrySchema), nutritionController.createFood);
router.get('/:userId/food/:entryId', authorizeUser, nutritionController.getFood);
router.patch('/:userId/food/:entryId', authorizeUser, validate(updateFoodEntrySchema), nutritionController.updateFood);
router.delete('/:userId/food/:entryId', authorizeUser, nutritionController.deleteFood);
router.post('/:userId/food/:entryId/consume', authorizeUser, nutritionController.consumeFood);
router.post('/:userId/food/:entryId/unconsume', authorizeUser, nutritionController.unconsumeFood);

// Water Entries
router.get('/:userId/water', authorizeUser, nutritionController.listWater);
router.post('/:userId/water', authorizeUser, validate(createWaterEntrySchema), nutritionController.createWater);
router.get('/:userId/water/:entryId', authorizeUser, nutritionController.getWater);
router.patch('/:userId/water/:entryId', authorizeUser, validate(updateWaterEntrySchema), nutritionController.updateWater);
router.delete('/:userId/water/:entryId', authorizeUser, nutritionController.deleteWater);
router.post('/:userId/water/:entryId/consume', authorizeUser, nutritionController.consumeWater);
router.post('/:userId/water/:entryId/unconsume', authorizeUser, nutritionController.unconsumeWater);

// Daily Goals
router.get('/:userId/goals', authorizeUser, nutritionController.getGoals);
router.patch('/:userId/goals', authorizeUser, validate(updateDailyGoalsSchema), nutritionController.updateGoals);

// Stats
router.get('/:userId/stats/summary', authorizeUser, nutritionController.getStatsSummary);
router.get('/:userId/stats/daily', authorizeUser, nutritionController.getDailyProgress);

// Diet Plan
router.get('/:userId/diet-plan', authorizeUser, nutritionController.listDietPlan);
router.post('/:userId/diet-plan', authorizeUser, validate(createDietPlanItemSchema), nutritionController.createDietPlanItem);
router.patch('/:userId/diet-plan/:itemId', authorizeUser, validate(updateDietPlanItemSchema), nutritionController.updateDietPlanItem);
router.delete('/:userId/diet-plan/:itemId', authorizeUser, nutritionController.deleteDietPlanItem);
router.post('/:userId/diet-plan/:itemId/consume', authorizeUser, nutritionController.consumeDietPlanItem);
router.post('/:userId/diet-plan/:itemId/unconsume', authorizeUser, nutritionController.unconsumeDietPlanItem);

export default router;
