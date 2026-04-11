import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import prisma from '../config/database';
import type {
  RegisterInput,
  LoginInput,
  GoogleLoginInput,
  RefreshTokenInput,
  ResetPasswordInput,
} from '../schemas/auth.schemas';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, displayName } = req.body as RegisterInput;
      const result = await authService.register(email, password, displayName);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as LoginInput;
      const result = await authService.loginWithEmailPassword(email, password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async loginWithGoogle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idToken } = req.body as GoogleLoginInput;
      const result = await authService.loginWithGoogle(idToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logout(req.user!.uid);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as RefreshTokenInput;
      const result = await authService.refreshToken(refreshToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body as ResetPasswordInput;
      await authService.resetPassword(email);
      res.json({ message: 'Email de recuperação enviado (se o email estiver cadastrado)' });
    } catch (err) {
      next(err);
    }
  },

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getCurrentUser(req.user!.uid);
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { displayName, photoURL, isPrivate, birthDate, sex, height, objective, activityLevel, bio } = req.body as {
        displayName?: string;
        photoURL?: string;
        isPrivate?: boolean;
        birthDate?: string | null;
        sex?: string | null;
        height?: number | null;
        objective?: string | null;
        activityLevel?: string | null;
        bio?: string | null;
      };
      const user = await authService.updateUserProfile(req.user!.uid, {
        displayName, photoURL, isPrivate, birthDate, sex, height, objective, activityLevel, bio,
      });
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  async listPhotos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const photos = await prisma.userPhoto.findMany({
        where: { userId: req.user!.uid },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      });
      res.json(photos);
    } catch (err) {
      next(err);
    }
  },

  async uploadPhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) { res.status(400).json({ error: 'Nenhum arquivo enviado' }); return; }
      const { caption } = req.body as { caption?: string };
      const url = `/uploads/profile-photos/${req.file.filename}`;
      const count = await prisma.userPhoto.count({ where: { userId: req.user!.uid } });
      const photo = await prisma.userPhoto.create({
        data: { userId: req.user!.uid, url, caption: caption ?? null, sortOrder: count },
      });
      res.status(201).json(photo);
    } catch (err) {
      next(err);
    }
  },

  async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) { res.status(400).json({ error: 'Nenhum arquivo enviado' }); return; }
      const url = `/uploads/avatars/${req.file.filename}`;
      // Remove avatar antigo do disco se for local
      const current = await prisma.user.findUnique({ where: { id: req.user!.uid }, select: { photoURL: true } });
      if (current?.photoURL?.startsWith('/uploads/avatars/')) {
        const oldPath = path.join(__dirname, '../../../uploads', current.photoURL.replace('/uploads/', ''));
        try { fs.unlinkSync(oldPath); } catch (_) { /* já removido */ }
      }
      const user = await authService.updateUserProfile(req.user!.uid, { photoURL: url });
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  async updateFcmToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body as { token: string | null };
      await prisma.user.update({
        where: { id: req.user!.uid },
        data: { fcmToken: token ?? null },
      });
      res.json({ message: 'FCM token atualizado' });
    } catch (err) {
      next(err);
    }
  },

  async deletePhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const photo = await prisma.userPhoto.findFirst({ where: { id, userId: req.user!.uid } });
      if (!photo) { res.status(404).json({ error: 'Foto não encontrada' }); return; }
      if (photo.url.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '../../../uploads', photo.url.replace('/uploads/', ''));
        try { fs.unlinkSync(filePath); } catch (_) { /* arquivo já removido */ }
      }
      await prisma.userPhoto.delete({ where: { id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
