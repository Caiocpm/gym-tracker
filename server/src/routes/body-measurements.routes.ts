// server/src/routes/body-measurements.routes.ts
import fs from 'fs';
import path from 'path';
import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/authenticate';
import { authorizeUser } from '../middleware/authorizeUser';
import { bodyMeasurementsService } from '../services/body-measurements.service';
import prisma from '../config/database';

const photoUpload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '../../../uploads/measurements'),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
  },
});

const router = Router();
router.use(authenticate);

router.get('/:userId/measurements', authorizeUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await bodyMeasurementsService.list(req.params.userId);
    res.json({ data });
  } catch (err) { next(err); }
});

router.post('/:userId/measurements', authorizeUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await bodyMeasurementsService.create(req.params.userId, req.body);
    res.status(201).json({ data });
  } catch (err) { next(err); }
});

router.patch('/:userId/measurements/:id', authorizeUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await bodyMeasurementsService.update(req.params.userId, req.params.id, req.body);
    res.json({ data });
  } catch (err) { next(err); }
});

router.delete('/:userId/measurements/:id', authorizeUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Remove fotos do disco antes de deletar o registro
    const m = await prisma.bodyMeasurement.findFirst({ where: { id: req.params.id, userId: req.params.userId } });
    if (m) {
      for (const url of m.photos) {
        if (url.startsWith('/uploads/measurements/')) {
          const filePath = path.join(__dirname, '../../../uploads', url.replace('/uploads/', ''));
          try { fs.unlinkSync(filePath); } catch (_) {}
        }
      }
    }
    await bodyMeasurementsService.delete(req.params.userId, req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

// ─── Upload de foto de progresso ──────────────────────────────────────────────
router.post('/:userId/measurements/:id/photos', authorizeUser, photoUpload.single('photo'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) { res.status(400).json({ error: 'Nenhum arquivo enviado' }); return; }
    const url = `/uploads/measurements/${req.file.filename}`;
    const m = await prisma.bodyMeasurement.update({
      where: { id: req.params.id },
      data: { photos: { push: url } },
    });
    res.json({ data: m });
  } catch (err) { next(err); }
});

router.delete('/:userId/measurements/:id/photos', authorizeUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = req.body as { url: string };
    if (!url) { res.status(400).json({ error: 'url obrigatória' }); return; }
    const m = await prisma.bodyMeasurement.findFirst({ where: { id: req.params.id, userId: req.params.userId } });
    if (!m) { res.status(404).json({ error: 'Medição não encontrada' }); return; }
    // Remove do disco
    if (url.startsWith('/uploads/measurements/')) {
      const filePath = path.join(__dirname, '../../../uploads', url.replace('/uploads/', ''));
      try { fs.unlinkSync(filePath); } catch (_) {}
    }
    const updated = await prisma.bodyMeasurement.update({
      where: { id: req.params.id },
      data: { photos: m.photos.filter((p) => p !== url) },
    });
    res.json({ data: updated });
  } catch (err) { next(err); }
});

export default router;
