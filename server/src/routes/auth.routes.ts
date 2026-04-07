import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  refreshTokenSchema,
  resetPasswordSchema,
} from '../schemas/auth.schemas';

const router = Router();

// Rate limit estrito apenas para endpoints de autenticação (anti brute-force)
router.post('/register',      authLimiter, validate(registerSchema),    authController.register);
router.post('/login',         authLimiter, validate(loginSchema),       authController.login);
router.post('/login/google',  authLimiter, validate(googleLoginSchema), authController.loginWithGoogle);
router.post('/reset-password',authLimiter, validate(resetPasswordSchema),authController.resetPassword);
router.post('/refresh',       authLimiter, validate(refreshTokenSchema), authController.refresh);

// Rotas autenticadas sem rate limit estrito (usa o global de 200/15min)
router.post('/logout',   authenticate, authController.logout);
router.get('/me',        authenticate, authController.getMe);
router.put('/profile',   authenticate, authController.updateProfile);

export default router;
