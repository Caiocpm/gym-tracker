import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { presetService } from '../services/preset.service';

const router = Router();
router.use(authenticate);

// ─── CRUD ─────────────────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.query.type as string | undefined;
    const presets = await presetService.list(req.user!.uid, type);
    res.json({ data: presets });
  } catch (err) { next(err); }
});

router.get('/:presetId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const preset = await presetService.get(req.params.presetId, req.user!.uid);
    res.json({ data: preset });
  } catch (err) { next(err); }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, name, description, content } = req.body;
    if (!type || !name || !content) {
      res.status(400).json({ message: 'type, name e content são obrigatórios' });
      return;
    }
    if (type !== 'workout' && type !== 'nutrition') {
      res.status(400).json({ message: 'type deve ser "workout" ou "nutrition"' });
      return;
    }
    const preset = await presetService.create(req.user!.uid, { type, name, description, content });
    res.status(201).json({ data: preset });
  } catch (err) { next(err); }
});

router.patch('/:presetId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, content } = req.body;
    const preset = await presetService.update(req.params.presetId, req.user!.uid, { name, description, content });
    res.json({ data: preset });
  } catch (err) { next(err); }
});

router.delete('/:presetId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await presetService.delete(req.params.presetId, req.user!.uid);
    res.status(204).send();
  } catch (err) { next(err); }
});

// ─── Apply to student ─────────────────────────────────────────────────────────

router.post('/:presetId/apply/:linkId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { replaceExisting, applyGoals } = req.body;
    const result = await presetService.applyToStudent(
      req.params.presetId,
      req.user!.uid,
      req.params.linkId,
      { replaceExisting: !!replaceExisting, applyGoals: !!applyGoals }
    );
    res.json({ data: result, message: 'Preset aplicado com sucesso' });
  } catch (err) { next(err); }
});

export default router;
