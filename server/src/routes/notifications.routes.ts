import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { authenticate } from '../middleware/authenticate';
import { socialService } from '../services/social.service';
import { sseService } from '../services/sse.service';
import prisma from '../config/database';

const router = Router();

// ─── SSE Stream — token via query param (EventSource doesn't support headers) ─
router.get('/stream', (req: Request, res: Response) => {
  const token = (req.query.token as string) ?? req.headers.authorization?.slice(7);
  if (!token) { res.status(401).end(); return; }

  let userId: string;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    userId = payload.uid as string;
  } catch {
    res.status(401).end();
    return;
  }
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30_000);
  sseService.addClient(userId, res);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseService.removeClient(userId);
  });
});

// ─── REST (require auth header) ────────────────────────────────────────────────
router.use(authenticate);
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const notifications = await socialService.listNotifications(req.user!.uid, unreadOnly);
    res.json({ data: notifications });
  } catch (err) { next(err); }
});

router.patch('/:notificationId/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const n = await socialService.markNotificationRead(req.params.notificationId, req.user!.uid);
    res.json({ data: n });
  } catch (err) { next(err); }
});

router.post('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await socialService.markAllNotificationsRead(req.user!.uid);
    res.json({ message: 'Todas as notificações marcadas como lidas' });
  } catch (err) { next(err); }
});

router.delete('/:notificationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.deleteMany({
      where: { id: req.params.notificationId, userId: req.user!.uid },
    });
    res.status(204).send();
  } catch (err) { next(err); }
});

router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const types = req.query.types ? (req.query.types as string).split(',') : undefined;
    await prisma.notification.deleteMany({
      where: { userId: req.user!.uid, ...(types ? { type: { in: types } } : {}) },
    });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
