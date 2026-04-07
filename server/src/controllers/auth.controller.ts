import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
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
      const { displayName, photoURL, isPrivate } = req.body as { displayName?: string; photoURL?: string; isPrivate?: boolean };
      const user = await authService.updateUserProfile(req.user!.uid, { displayName, photoURL, isPrivate });
      res.json(user);
    } catch (err) {
      next(err);
    }
  },
};
