import { Router } from 'express';
import { exercisesController } from '../controllers/exercises.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', exercisesController.list);
router.get('/definitions', exercisesController.list);
router.post('/', exercisesController.create);
router.post('/definitions', exercisesController.create);
router.get('/definitions/:id', exercisesController.get);
router.patch('/definitions/:id', exercisesController.update);
router.delete('/definitions/:id', exercisesController.delete);

export default router;
