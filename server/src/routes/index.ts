import { Router } from 'express';
import authRouter from './auth.routes';
import workoutsRouter from './workouts.routes';
import exercisesRouter from './exercises.routes';
import nutritionRouter from './nutrition.routes';
import professionalRouter from './professional.routes';
import socialRouter from './social.routes';
import notificationsRouter from './notifications.routes';
import wodsRouter from './wods.routes';
import weightRouter from './weight.routes';
import marketplaceRouter from './marketplace.routes';
import presetRouter from './preset.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/workouts', workoutsRouter);
router.use('/exercises', exercisesRouter);
router.use('/nutrition', nutritionRouter);
router.use('/professional', professionalRouter);
router.use('/social', socialRouter);
router.use('/notifications', notificationsRouter);
router.use('/wods', wodsRouter);
router.use('/weight', weightRouter);
router.use('/marketplace', marketplaceRouter);
router.use('/presets', presetRouter);

export default router;
