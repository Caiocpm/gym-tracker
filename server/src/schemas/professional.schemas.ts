import { z } from 'zod';

// ─── Profile ──────────────────────────────────────────────────────────────────

export const createProfileSchema = z.object({
  displayName: z.string().min(2),
  professionalTypes: z.array(
    z.enum(['personal_trainer', 'nutritionist', 'physiotherapist', 'coach', 'other'])
  ).min(1, 'Selecione ao menos um tipo').optional(),
  plan: z.enum(['fitness', 'nutrition', 'full']).default('fitness'),
  specialties: z.array(z.string()).optional().default([]),
  bio: z.string().optional(),
  phone: z.string().optional(),
  cref: z.string().optional(),
  crn: z.string().optional(),
  crefito: z.string().optional(),
  clinicName: z.string().optional(),
  // ── Marketplace ──────────────────────────────────────────────────────────────
  photoURL:        z.string().url().optional().or(z.literal('')),
  city:            z.string().optional(),
  state:           z.string().optional(),
  isPublic:        z.boolean().optional(),
  availableForHire: z.boolean().optional(),
  priceRange:      z.string().optional(),
  yearsExperience: z.number().int().min(0).max(60).optional(),
  instagramHandle: z.string().optional(),
  websiteUrl:      z.string().url().optional().or(z.literal('')),
});

export const updateProfileSchema = createProfileSchema.partial();

// ─── Tag ─────────────────────────────────────────────────────────────────────

export const createTagSchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
  description: z.string().optional(),
});

// ─── Invitation ───────────────────────────────────────────────────────────────

export const createInvitationSchema = z.object({
  studentEmail:   z.string().email().optional(),
  accessLevel:    z.enum(['read', 'write', 'full']).default('read'),
  message:        z.string().optional(),
  expiresInHours: z.number().int().min(1).max(720).optional(),
});

const professionalTypeEnum = z.enum(['personal_trainer', 'nutritionist', 'physiotherapist', 'coach', 'other']);

export const acceptInvitationSchema = z.object({
  // studentUserId is taken from req.user (JWT), not from the request body
  contractedTypes: z.array(professionalTypeEnum).min(1).optional(),
});

// ─── Student Link ─────────────────────────────────────────────────────────────

export const updateStudentLinkSchema = z.object({
  accessLevel: z.enum(['read', 'write', 'full']).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  notes: z.string().optional(),
});

// ─── Note ─────────────────────────────────────────────────────────────────────

export const createNoteSchema = z.object({
  studentLinkId: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.enum(['general', 'nutrition', 'workout', 'health', 'progress']).default('general'),
  tags: z.array(z.string()).optional().default([]),
});

export const updateNoteSchema = createNoteSchema.partial();

// ─── Goal ─────────────────────────────────────────────────────────────────────

export const createGoalSchema = z.object({
  studentLinkId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['weight', 'strength', 'endurance', 'nutrition', 'body_composition', 'other']).default('other'),
  currentValue: z.number(),
  targetValue: z.number(),
  unit: z.string().min(1),
  targetDate: z.string().min(1),
  startDate: z.string().optional(),
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  status: z.enum(['active', 'completed', 'cancelled']).optional(),
  progress: z.number().min(0).max(100).optional(),
});

// ─── Evaluation ───────────────────────────────────────────────────────────────

export const createEvaluationSchema = z.object({
  studentLinkId: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(['physical', 'nutritional', 'performance', 'general']).default('general'),
  scheduledDate: z.string().min(1),
  scheduledTime: z.string().min(1),
  duration: z.number().positive(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const updateEvaluationSchema = createEvaluationSchema.partial().extend({
  status: z.enum(['scheduled', 'completed', 'cancelled', 'rescheduled']).optional(),
});

// ─── Conversation ─────────────────────────────────────────────────────────────

export const createConversationSchema = z.object({
  studentLinkId: z.string().min(1),
  studentUserId: z.string().min(1),
  title: z.string().min(1),
  category: z.string().default('general'),
  initialMessage: z.string().min(1),
});

export const addMessageSchema = z.object({
  senderId: z.string().min(1),
  senderType: z.enum(['professional', 'student']),
  senderName: z.string().min(1),
  content: z.string().min(1),
});

export const markAsReadSchema = z.object({
  userId: z.string().min(1),
  userType: z.enum(['professional', 'student']),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type AddMessageInput = z.infer<typeof addMessageSchema>;
