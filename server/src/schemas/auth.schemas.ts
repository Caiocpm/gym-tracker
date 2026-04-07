import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  displayName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, 'ID Token obrigatório'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token obrigatório'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const confirmResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token obrigatório'),
  newPassword: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ConfirmResetPasswordInput = z.infer<typeof confirmResetPasswordSchema>;
