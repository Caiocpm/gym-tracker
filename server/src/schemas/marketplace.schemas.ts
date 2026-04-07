import { z } from 'zod';

export const searchProfessionalsSchema = z.object({
  q:    z.string().optional(),
  type: z.enum(['personal_trainer', 'nutritionist', 'physiotherapist', 'coach', 'other']).optional(),
  city:  z.string().optional(),
  state: z.string().optional(),
  // Geolocation filter
  lat:      z.coerce.number().min(-90).max(90).optional(),
  lng:      z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(1).max(500).default(25).optional(),
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const createContactRequestSchema = z.object({
  message:        z.string().max(500).optional(),
  requestedTypes: z.array(
    z.enum(['personal_trainer', 'nutritionist', 'physiotherapist', 'coach', 'other'])
  ).min(1).optional(),
});

export const respondContactRequestSchema = z.object({
  action: z.enum(['accept', 'reject']),
});

export type SearchProfessionalsInput   = z.infer<typeof searchProfessionalsSchema>;
export type CreateContactRequestInput  = z.infer<typeof createContactRequestSchema>;
export type RespondContactRequestInput = z.infer<typeof respondContactRequestSchema>;
