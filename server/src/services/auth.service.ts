import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../config/database';
import { env } from '../config/env';
import { AppError } from '../types/api.types';

const SALT_ROUNDS = 12;
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isPrivate: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  birthDate?: string | null;
  sex?: string | null;
  height?: number | null;
  objective?: string | null;
  activityLevel?: string | null;
  bio?: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function issueTokenPair(uid: string, email: string | null): { token: string; refreshToken: string } {
  const token = jwt.sign(
    { uid, email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { uid },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
  );

  return { token, refreshToken };
}

function mapUser(user: {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  emailVerified: boolean;
  isPrivate: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  birthDate?: string | null;
  sex?: string | null;
  height?: number | null;
  objective?: string | null;
  activityLevel?: string | null;
  bio?: string | null;
}): AuthUser {
  return {
    uid: user.id,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    isPrivate: user.isPrivate,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt.toISOString(),
    birthDate: user.birthDate,
    sex: user.sex,
    height: user.height,
    objective: user.objective,
    activityLevel: user.activityLevel,
    bio: user.bio,
  };
}

// ─── Auth Operations ──────────────────────────────────────────────────────────

export const authService = {
  async register(email: string, password: string, displayName: string): Promise<AuthResponse> {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(409, 'Email já cadastrado');

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName },
    });

    const { token, refreshToken } = issueTokenPair(user.id, user.email);
    return { user: mapUser(user), token, refreshToken };
  },

  async loginWithEmailPassword(email: string, password: string): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) throw new AppError(401, 'Email ou senha inválidos');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError(401, 'Email ou senha inválidos');

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { token, refreshToken } = issueTokenPair(user.id, user.email);
    return { user: mapUser(updated), token, refreshToken };
  },

  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new AppError(401, 'Token Google inválido');

    const { sub: googleId, email, name, picture } = payload;
    if (!email) throw new AppError(401, 'Email não fornecido pelo Google');

    const user = await prisma.user.upsert({
      where: { googleId },
      update: {
        email,
        displayName: name ?? email,
        photoURL: picture ?? null,
        lastLoginAt: new Date(),
      },
      create: {
        googleId,
        email,
        displayName: name ?? email,
        photoURL: picture ?? null,
        emailVerified: true,
      },
    });

    const { token, refreshToken } = issueTokenPair(user.id, user.email);
    return { user: mapUser(user), token, refreshToken };
  },

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
    } catch {
      throw new AppError(401, 'Refresh token inválido ou expirado');
    }

    const uid = payload.uid as string;
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) throw new AppError(401, 'Usuário não encontrado');

    return issueTokenPair(user.id, user.email);
  },

  async logout(_uid: string): Promise<void> {
    // JWT tokens expire naturally; optionally increment tokenVersion to invalidate all tokens
  },

  async resetPassword(_email: string): Promise<void> {
    // Placeholder: integrate with an email service (e.g. Nodemailer + SMTP)
    // For now, silently succeed so as not to leak whether the email exists
  },

  async getCurrentUser(uid: string): Promise<AuthUser> {
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) throw new AppError(404, 'Usuário não encontrado');
    return mapUser(user);
  },

  async updateUserProfile(uid: string, data: {
    displayName?: string;
    photoURL?: string;
    isPrivate?: boolean;
    birthDate?: string | null;
    sex?: string | null;
    height?: number | null;
    objective?: string | null;
    activityLevel?: string | null;
    bio?: string | null;
  }): Promise<AuthUser> {
    const user = await prisma.user.update({
      where: { id: uid },
      data,
    });
    return mapUser(user);
  },
};
