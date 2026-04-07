// server/src/services/wods.service.ts
import { prisma } from '../config/database';

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function uniqueCode(): Promise<string> {
  let code = generateCode();
  while (await prisma.sharedWod.findUnique({ where: { code } })) {
    code = generateCode();
  }
  return code;
}

export const wodsService = {
  // ─── Criar WOD e gerar código ────────────────────────────────────────────
  async create(data: {
    format: string;
    timeCap?: number;
    rounds?: number;
    description?: string;
    movements?: object[];
    createdBy: string;
    groupId?: string;
  }) {
    const code = await uniqueCode();
    return prisma.sharedWod.create({
      data: { ...data, code },
      include: { creator: { select: { displayName: true, photoURL: true } } },
    });
  },

  // ─── Buscar por código (sem auth) ────────────────────────────────────────
  async findByCode(code: string) {
    return prisma.sharedWod.findUnique({
      where: { code: code.toUpperCase() },
      include: { creator: { select: { displayName: true, photoURL: true } } },
    });
  },

  // ─── Listar WODs de um grupo (mais recentes primeiro) ────────────────────
  async listByGroup(groupId: string, limit = 20, offset = 0) {
    return prisma.sharedWod.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: { creator: { select: { id: true, displayName: true, photoURL: true } } },
    });
  },

  // ─── WODs criados pelo usuário ────────────────────────────────────────────
  async listByUser(userId: string) {
    return prisma.sharedWod.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { group: { select: { id: true, name: true } } },
    });
  },

  // ─── Publicar WOD existente num grupo ────────────────────────────────────
  async publishToGroup(wodId: string, groupId: string, userId: string) {
    const wod = await prisma.sharedWod.findUnique({ where: { id: wodId } });
    if (!wod || wod.createdBy !== userId) return null;
    return prisma.sharedWod.update({
      where: { id: wodId },
      data: { groupId },
    });
  },
};
