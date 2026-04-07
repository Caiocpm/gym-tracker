// server/src/routes/wods.routes.ts
import { Router } from 'express';
import { wodsController } from '../controllers/wods.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createWodSchema, publishToGroupSchema } from '../schemas/wods.schemas';

const router = Router();

// Buscar por código não requer auth (para importação via código compartilhado)
router.get('/code/:code', wodsController.findByCode);

// Rotas autenticadas
router.use(authenticate);
router.get('/mine', wodsController.listMine);
router.post('/', validate(createWodSchema), wodsController.create);
router.patch('/:wodId/publish', validate(publishToGroupSchema), wodsController.publishToGroup);

export default router;
