import prisma from '../config/database';
import { AppError } from '../types/api.types';

export const exercisesService = {
  async listDefinitions(userId?: string) {
    return prisma.exerciseDefinition.findMany({
      where: {
        OR: [
          { createdBy: null },
          ...(userId ? [{ createdBy: userId }] : []),
        ],
      },
      orderBy: { name: 'asc' },
    });
  },

  async getDefinition(exerciseId: string) {
    const exercise = await prisma.exerciseDefinition.findUnique({ where: { id: exerciseId } });
    if (!exercise) throw new AppError(404, 'Exercício não encontrado');
    return exercise;
  },

  async createDefinition(data: Record<string, unknown>, userId: string) {
    return prisma.exerciseDefinition.create({
      data: { ...(data as Parameters<typeof prisma.exerciseDefinition.create>[0]['data']), createdBy: userId },
    });
  },

  async updateDefinition(exerciseId: string, data: Record<string, unknown>, userId: string) {
    const existing = await prisma.exerciseDefinition.findUnique({ where: { id: exerciseId } });
    if (!existing) throw new AppError(404, 'Exercício não encontrado');

    if (existing.createdBy && existing.createdBy !== userId) {
      throw new AppError(403, 'Você não tem permissão para editar este exercício');
    }

    return prisma.exerciseDefinition.update({
      where: { id: exerciseId },
      data: data as Parameters<typeof prisma.exerciseDefinition.update>[0]['data'],
    });
  },

  async deleteDefinition(exerciseId: string, userId: string) {
    const existing = await prisma.exerciseDefinition.findUnique({ where: { id: exerciseId } });
    if (!existing) throw new AppError(404, 'Exercício não encontrado');

    if (!existing.createdBy || existing.createdBy !== userId) {
      throw new AppError(403, 'Você só pode deletar exercícios criados por você');
    }

    await prisma.exerciseDefinition.delete({ where: { id: exerciseId } });
  },
};
