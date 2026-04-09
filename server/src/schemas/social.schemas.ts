import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().default(false),
  coverPhoto: z.string().url().optional(),
});

export const updateGroupSchema = createGroupSchema.partial();

export const createPostSchema = z.object({
  content: z.string().max(2000).optional(),
  imageBase64: z.string().max(8_000_000).optional(),
  imagesBase64: z.array(z.string().max(8_000_000)).max(3).optional(),
  exercises: z.array(z.record(z.unknown())).default([]),
  // accepts both the old array format and the new workout-meta object format
  records: z.union([
    z.array(z.record(z.unknown())),
    z.record(z.unknown()),
  ]).default([]),
  isPublic: z.boolean().default(false),
});

export const addCommentSchema = z.object({
  text: z.string().min(1).max(1000),
});

export const createChallengeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.string(),
  difficulty: z.enum(['iniciante', 'intermediario', 'avancado', 'elite']),
  targetUnit: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  isCompetitive: z.boolean().default(false),
  reward: z.string().optional(),
  exerciseId: z.string().optional(),
  exerciseName: z.string().optional(),
  createdByName: z.string(),
});

export const updateProgressSchema = z.object({
  progress: z.number().min(0),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
