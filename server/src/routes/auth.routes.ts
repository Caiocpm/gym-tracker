import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
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

const photoUpload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '../../../uploads/profile-photos'),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '../../../uploads/avatars'),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router = Router();

// Rate limit estrito apenas para endpoints de autenticação (anti brute-force)
router.post('/register',      authLimiter, validate(registerSchema),    authController.register);
router.post('/login',         authLimiter, validate(loginSchema),       authController.login);
router.post('/login/google',  authLimiter, validate(googleLoginSchema), authController.loginWithGoogle);
router.post('/reset-password',authLimiter, validate(resetPasswordSchema),authController.resetPassword);
router.post('/refresh',       authLimiter, validate(refreshTokenSchema), authController.refresh);

// Rotas autenticadas sem rate limit estrito (usa o global de 200/15min)
router.post('/logout',    authenticate, authController.logout);
router.get('/me',         authenticate, authController.getMe);
router.put('/profile',    authenticate, authController.updateProfile);
router.get('/photos',     authenticate, authController.listPhotos);
router.post('/photos',    authenticate, photoUpload.single('photo'), authController.uploadPhoto);
router.delete('/photos/:id', authenticate, authController.deletePhoto);
router.post('/avatar',    authenticate, avatarUpload.single('avatar'), authController.uploadAvatar);
router.post('/fcm-token', authenticate, authController.updateFcmToken);

export default router;
