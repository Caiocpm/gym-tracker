import { Router } from 'express';
import { weightController } from '../controllers/weight.controller';
import { authenticate } from '../middleware/authenticate';
import { authorizeUser } from '../middleware/authorizeUser';

const router = Router();
router.use(authenticate);

router.get('/:userId/entries', authorizeUser, weightController.list);
router.post('/:userId/entries', authorizeUser, weightController.upsert);
router.delete('/:userId/entries/:entryId', authorizeUser, weightController.delete);
router.get('/:userId/nutrition-stats', authorizeUser, weightController.getNutritionStats);

export default router;
