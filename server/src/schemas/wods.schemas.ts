// server/src/schemas/wods.schemas.ts
import { z } from 'zod';

const wodMovementSchema = z.object({
  name: z.string().min(1).max(100),
  targetReps: z.number().int().min(1).optional(),
  targetWeight: z.number().min(0).optional(),
});

export const createWodSchema = z.object({
  format: z.enum(['amrap', 'forTime', 'emom', 'tabata']),
  timeCap: z.number().int().min(1).max(120).optional(),
  rounds: z.number().int().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  movements: z.array(wodMovementSchema).max(30).optional(),
  groupId: z.string().uuid().optional(),
});

export const publishToGroupSchema = z.object({
  groupId: z.string().uuid(),
});
