// server/src/services/body-measurements.service.ts
import prisma from '../config/database';

// ─── Pollock 7-site body fat formula ──────────────────────────────────────────
// Jackson & Pollock (1978) — sum of 7 skinfolds (mm)
// Male:   BD = 1.112 – (0.00043499 × sum7) + (0.00000055 × sum7²) – (0.00028826 × age)
// Female: BD = 1.097 – (0.00046971 × sum7) + (0.00000056 × sum7²) – (0.00012828 × age)
// %fat = ((4.95 / BD) – 4.50) × 100  [Siri equation]

function pollock7BodyFat(
  sum7: number,
  age: number,
  sex: 'male' | 'female',
): number {
  const bd =
    sex === 'male'
      ? 1.112 - 0.00043499 * sum7 + 0.00000055 * sum7 ** 2 - 0.00028826 * age
      : 1.097 - 0.00046971 * sum7 + 0.00000056 * sum7 ** 2 - 0.00012828 * age;
  return (4.95 / bd - 4.5) * 100;
}

export type CreateBodyMeasurementInput = {
  date: string;
  weight?: number;
  height?: number;
  waist?: number;
  hip?: number;
  chest?: number;
  neck?: number;
  shoulder?: number;
  armRelaxedRight?: number;
  armRelaxedLeft?: number;
  armFlexRight?: number;
  armFlexLeft?: number;
  forearmRight?: number;
  forearmLeft?: number;
  thighRight?: number;
  thighLeft?: number;
  calfRight?: number;
  calfLeft?: number;
  skinfoldChest?: number;
  skinfoldAxillary?: number;
  skinfoldTricep?: number;
  skinfoldSubscapular?: number;
  skinfoldAbdominal?: number;
  skinfoldSuprailiac?: number;
  skinfoldThigh?: number;
  sex?: 'male' | 'female';
  age?: number;
  note?: string;
};

export const bodyMeasurementsService = {
  async list(userId: string) {
    return prisma.bodyMeasurement.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  },

  async get(userId: string, id: string) {
    return prisma.bodyMeasurement.findFirst({ where: { id, userId } });
  },

  async create(userId: string, data: CreateBodyMeasurementInput) {
    const { bodyFatPercent, leanMassKg, fatMassKg } = _computeComposition(data);
    return prisma.bodyMeasurement.create({
      data: {
        userId,
        ...data,
        bodyFatPercent,
        leanMassKg,
        fatMassKg,
      },
    });
  },

  async update(userId: string, id: string, data: Partial<CreateBodyMeasurementInput>) {
    const existing = await prisma.bodyMeasurement.findFirst({ where: { id, userId } });
    if (!existing) throw new Error('Medição não encontrada');
    const merged = { ...existing, ...data } as CreateBodyMeasurementInput;
    const { bodyFatPercent, leanMassKg, fatMassKg } = _computeComposition(merged);
    return prisma.bodyMeasurement.update({
      where: { id },
      data: { ...data, bodyFatPercent, leanMassKg, fatMassKg },
    });
  },

  async delete(userId: string, id: string) {
    await prisma.bodyMeasurement.deleteMany({ where: { id, userId } });
  },
};

function _computeComposition(data: Partial<CreateBodyMeasurementInput>) {
  const {
    skinfoldChest, skinfoldAxillary, skinfoldTricep,
    skinfoldSubscapular, skinfoldAbdominal, skinfoldSuprailiac,
    skinfoldThigh, sex, age, weight,
  } = data;

  const skinfolds = [
    skinfoldChest, skinfoldAxillary, skinfoldTricep,
    skinfoldSubscapular, skinfoldAbdominal, skinfoldSuprailiac,
    skinfoldThigh,
  ];
  const allPresent = skinfolds.every((s) => s != null && s > 0);

  if (!allPresent || !sex || !age || age <= 0) {
    return { bodyFatPercent: null, leanMassKg: null, fatMassKg: null };
  }

  const sum7 = skinfolds.reduce((s, v) => s! + v!, 0)!;
  const bodyFatPercent = Math.max(1, Math.min(50, pollock7BodyFat(sum7, age, sex)));

  if (!weight || weight <= 0) {
    return { bodyFatPercent, leanMassKg: null, fatMassKg: null };
  }

  const fatMassKg  = (bodyFatPercent / 100) * weight;
  const leanMassKg = weight - fatMassKg;
  return {
    bodyFatPercent: Math.round(bodyFatPercent * 10) / 10,
    leanMassKg:     Math.round(leanMassKg * 10) / 10,
    fatMassKg:      Math.round(fatMassKg * 10) / 10,
  };
}
