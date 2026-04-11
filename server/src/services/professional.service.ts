import prisma from '../config/database';
import { AppError } from '../types/api.types';
import { sseService } from './sse.service';
import { pushService } from './push.service';
import type {
  CreateProfileInput,
  CreateTagInput,
  CreateInvitationInput,
  CreateNoteInput,
  CreateGoalInput,
  CreateEvaluationInput,
  CreateConversationInput,
  AddMessageInput,
} from '../schemas/professional.schemas';

// ─── Geocoding helper (Nominatim) ────────────────────────────────────────────

async function geocodeCityState(city?: string | null, state?: string | null): Promise<{ latitude: number; longitude: number } | null> {
  const q = [city, state, 'Brasil'].filter(Boolean).join(', ');
  if (!q.trim()) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'Kinify/1.0 (contact@kinify.app)' } },
    );
    const data = (await res.json()) as { lat: string; lon: string }[];
    if (data.length > 0) {
      return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
    }
  } catch {}
  return null;
}

// ─── Notification helper ──────────────────────────────────────────────────────

async function sendNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  actionUrl?: string,
  extras?: { fromUserId?: string; fromUserName?: string }
) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, message, actionUrl: actionUrl ?? null, ...extras },
  });
  sseService.send(userId, 'notification', notification);
  // Push para usuários com app fechado (best-effort)
  pushService.sendToUser(userId, { title, body: message, data: { type, notificationId: notification.id, ...(actionUrl ? { url: actionUrl } : {}) } }).catch(() => {});
}

// ─── Shared consistency helper ────────────────────────────────────────────────

const DEFAULT_NUTRITION_GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65 };

async function computeStudentConsistency(s: {
  id: string;
  studentUserId: string;
  studentEmail: string;
  planRenewedAt: Date | null;
  linkedAt: Date;
}) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const rangeStart = new Date(today);
  rangeStart.setDate(today.getDate() - 29);
  const rangeStartStr = rangeStart.toISOString().slice(0, 10);

  const [workoutRows, foodRows, nutritionGoals] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { userId: s.studentUserId, date: { gte: rangeStartStr, lte: todayStr } },
      select: {
        date: true,
        exercises: true,
        workoutDayId: true,
        workoutDay: { select: { exercises: true } },
      },
    }),
    prisma.foodEntry.groupBy({
      by: ['date'],
      _sum: { calories: true, protein: true, carbs: true, fat: true },
      where: { userId: s.studentUserId, date: { gte: rangeStartStr, lte: todayStr }, status: 'consumed' },
    }),
    prisma.nutritionGoals.findUnique({ where: { userId: s.studentUserId } }),
  ]);

  // ── Workout: count days where ALL planned exercises were completed ──────────
  const completedDates = new Set<string>();
  for (const session of workoutRows) {
    const planned = session.workoutDayId
      ? ((session.workoutDay?.exercises as unknown[]) ?? []).length
      : 0;
    const done = ((session.exercises as unknown[]) ?? []).length;
    if (!session.workoutDayId || done >= planned) {
      completedDates.add(session.date);
    }
  }
  const workoutDays = completedDates.size;

  // ── Nutrition: adherence to calorie/macro goals ────────────────────────────
  const g = nutritionGoals ?? DEFAULT_NUTRITION_GOALS;
  let totalCalAdherence = 0;
  let totalMacroAdherence = 0;
  let onTargetDays = 0;

  for (const day of foodRows) {
    const cal  = day._sum.calories ?? 0;
    const prot = day._sum.protein  ?? 0;
    const carb = day._sum.carbs    ?? 0;
    const fat  = day._sum.fat      ?? 0;

    const calPct  = Math.min(100, (cal  / g.calories) * 100);
    const protPct = Math.min(100, (prot / g.protein)  * 100);
    const carbPct = Math.min(100, (carb / g.carbs)    * 100);
    const fatPct  = Math.min(100, (fat  / g.fat)      * 100);

    totalCalAdherence   += calPct;
    totalMacroAdherence += (protPct + carbPct + fatPct) / 3;
    if (calPct >= 80) onTargetDays++;
  }

  const nutritionDays     = foodRows.length;
  const avgCalAdherence   = nutritionDays > 0 ? Math.round(totalCalAdherence   / nutritionDays) : 0;
  const avgMacroAdherence = nutritionDays > 0 ? Math.round(totalMacroAdherence / nutritionDays) : 0;
  const nutritionPct      = Math.round((onTargetDays / 30) * 100);

  // ── Plan expiry ────────────────────────────────────────────────────────────
  const planStart = s.planRenewedAt ?? s.linkedAt;
  const daysSinceRenewal = Math.floor(
    (today.getTime() - planStart.getTime()) / 86_400_000
  );

  return {
    linkId:               s.id,
    studentEmail:         s.studentEmail,
    workoutDays,
    workoutPct:           Math.round((workoutDays / 30) * 100),
    nutritionDays,
    nutritionOnTargetDays: onTargetDays,
    nutritionPct,
    avgCalAdherence,
    avgMacroAdherence,
    planRenewedAt:        planStart.toISOString(),
    daysSinceRenewal,
    planExpired:          daysSinceRenewal >= 30,
    planExpiringSoon:     daysSinceRenewal >= 25 && daysSinceRenewal < 30,
  };
}

export const professionalService = {
  // ─── Profile ────────────────────────────────────────────────────────────────

  async getProfile(userId: string) {
    return prisma.professionalProfile.findUnique({ where: { userId } });
  },

  async createProfile(userId: string, data: CreateProfileInput & { email: string }) {
    return prisma.professionalProfile.create({ data: { ...data, userId } });
  },

  async updateProfile(userId: string, data: Partial<CreateProfileInput>) {
    const existing = await prisma.professionalProfile.findUnique({ where: { userId } });
    if (!existing) throw new AppError(404, 'Perfil profissional não encontrado');

    // Re-geocode whenever city or state changes
    const cityChanged  = data.city  !== undefined && data.city  !== existing.city;
    const stateChanged = data.state !== undefined && data.state !== existing.state;
    let geoUpdate: { latitude?: number | null; longitude?: number | null } = {};
    if (cityChanged || stateChanged) {
      const newCity  = data.city  ?? existing.city;
      const newState = data.state ?? existing.state;
      const coords = await geocodeCityState(newCity, newState);
      geoUpdate = coords ?? { latitude: null, longitude: null };
    }

    return prisma.professionalProfile.update({ where: { userId }, data: { ...data, ...geoUpdate } });
  },

  // ─── Tags ────────────────────────────────────────────────────────────────────

  async listTags(professionalId: string) {
    return prisma.professionalTag.findMany({ where: { professionalId } });
  },

  async createTag(professionalId: string, data: CreateTagInput) {
    return prisma.professionalTag.create({ data: { ...data, professionalId } });
  },

  async deleteTag(professionalId: string, tagId: string) {
    const existing = await prisma.professionalTag.findFirst({
      where: { id: tagId, professionalId },
    });
    if (!existing) throw new AppError(404, 'Tag não encontrada');
    await prisma.professionalTag.delete({ where: { id: tagId } });
  },

  // ─── Student-side: links do aluno com seus profissionais ────────────────────

  async listMyLinks(studentUserId: string) {
    const links = await prisma.studentLink.findMany({
      where: { studentUserId, status: { not: 'deleted' } },
      orderBy: { linkedAt: 'desc' },
    });
    return Promise.all(links.map(async (link) => {
      const [proUser, proProfile] = await Promise.all([
        prisma.user.findUnique({
          where: { id: link.professionalId },
          select: { displayName: true, photoURL: true, email: true },
        }),
        prisma.professionalProfile.findUnique({
          where: { userId: link.professionalId },
          select: { professionalTypes: true, photoURL: true, brandColor: true, brandHighlightColor: true, brandSurfaceColor: true, brandOnSurfaceColor: true, brandLogoUrl: true, brandName: true, brandAppBarColor: true, brandNavBarColor: true, brandCardColor: true },
        }),
      ]);
      const allTypes = proProfile?.professionalTypes ?? ['other'];
      // If contractedTypes is empty (legacy link), fall back to all the pro's types
      const contractedTypes = link.contractedTypes.length > 0 ? link.contractedTypes : allTypes;
      return {
        ...link,
        professionalDisplayName: proUser?.displayName ?? proUser?.email ?? '—',
        professionalPhotoURL:    proProfile?.photoURL ?? proUser?.photoURL ?? null,
        professionalTypes:       allTypes,
        contractedTypes,
        brand: (proProfile?.brandColor || proProfile?.brandHighlightColor || proProfile?.brandSurfaceColor || proProfile?.brandOnSurfaceColor || proProfile?.brandName || proProfile?.brandLogoUrl || proProfile?.brandAppBarColor || proProfile?.brandNavBarColor || proProfile?.brandCardColor) ? {
          color:           proProfile.brandColor ?? null,
          highlightColor:  proProfile.brandHighlightColor ?? null,
          surfaceColor:    proProfile.brandSurfaceColor ?? null,
          onSurfaceColor:  proProfile.brandOnSurfaceColor ?? null,
          logoUrl:         proProfile.brandLogoUrl ?? null,
          name:            proProfile.brandName ?? proUser?.displayName ?? null,
          appBarColor:     proProfile.brandAppBarColor ?? null,
          navBarColor:     proProfile.brandNavBarColor ?? null,
          cardColor:       proProfile.brandCardColor   ?? null,
        } : null,
      };
    }));
  },

  async getInvitationPreview(invitationCode: string) {
    const invitation = await prisma.invitation.findFirst({
      where: { invitationCode, status: 'pending' },
    });
    if (!invitation) throw new AppError(404, 'Convite não encontrado ou já utilizado');
    if (new Date(invitation.expiresAt) < new Date()) throw new AppError(410, 'Convite expirado');

    const [proUser, proProfile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: invitation.professionalId },
        select: { displayName: true, photoURL: true },
      }),
      prisma.professionalProfile.findUnique({
        where: { userId: invitation.professionalId },
        select: { professionalTypes: true, photoURL: true },
      }),
    ]);
    return {
      professionalDisplayName: proUser?.displayName ?? invitation.professionalName,
      professionalPhotoURL:    proProfile?.photoURL ?? proUser?.photoURL ?? null,
      professionalTypes:       proProfile?.professionalTypes ?? ['other'],
    };
  },

  async unlinkSelf(linkId: string, studentUserId: string) {
    const link = await prisma.studentLink.findFirst({
      where: { id: linkId, studentUserId },
    });
    if (!link) throw new AppError(404, 'Vínculo não encontrado');
    await prisma.studentLink.update({
      where: { id: linkId },
      data: { status: 'deleted' },
    });
  },

  // ─── Student-side data access ─────────────────────────────────────────────

  async listGoalsForStudent(studentUserId: string, linkId: string) {
    const link = await prisma.studentLink.findFirst({
      where: { id: linkId, studentUserId, status: { not: 'deleted' } },
    });
    if (!link) throw new AppError(404, 'Vínculo não encontrado');
    return prisma.studentGoal.findMany({
      where: { studentLinkId: linkId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async listEvaluationsForStudent(studentUserId: string, linkId: string) {
    const link = await prisma.studentLink.findFirst({
      where: { id: linkId, studentUserId, status: { not: 'deleted' } },
    });
    if (!link) throw new AppError(404, 'Vínculo não encontrado');
    return prisma.evaluation.findMany({
      where: { studentLinkId: linkId },
      orderBy: { scheduledDate: 'asc' },
    });
  },

  async listConversationsForStudent(studentUserId: string, linkId: string) {
    const link = await prisma.studentLink.findFirst({
      where: { id: linkId, studentUserId, status: { not: 'deleted' } },
    });
    if (!link) throw new AppError(404, 'Vínculo não encontrado');
    return prisma.conversation.findMany({
      where: { studentLinkId: linkId, isArchived: false },
      orderBy: { lastMessageAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
  },

  async getConversationForStudent(studentUserId: string, conversationId: string) {
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, studentUserId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) throw new AppError(404, 'Conversa não encontrada');
    return conv;
  },

  async addMessageForStudent(
    studentUserId: string,
    conversationId: string,
    content: string,
    senderName: string,
  ) {
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, studentUserId },
    });
    if (!conv) throw new AppError(404, 'Conversa não encontrada');
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: { conversationId, senderId: studentUserId, senderType: 'student', senderName, content },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date(), unreadPro: { increment: 1 } },
      }),
    ]);

    await sendNotification(
      conv.professionalId,
      'new_message',
      'Nova mensagem',
      `${senderName} enviou uma mensagem`,
      `/dashboard/clients/${conv.studentLinkId}?tab=messages&conv=${conversationId}`,
      { fromUserId: studentUserId, fromUserName: senderName },
    );

    return message;
  },

  async markConversationReadForStudent(studentUserId: string, conversationId: string) {
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, studentUserId },
    });
    if (!conv) throw new AppError(404, 'Conversa não encontrada');
    return prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadStudent: 0 },
    });
  },

  // ─── Student Links ──────────────────────────────────────────────────────────

  async listStudents(professionalId: string) {
    const links = await prisma.studentLink.findMany({
      where: { professionalId, status: { not: 'deleted' } },
      orderBy: { linkedAt: 'desc' },
    });
    return Promise.all(links.map(async (link) => {
      const user = await prisma.user.findUnique({
        where: { id: link.studentUserId },
        select: { displayName: true, photoURL: true },
      });
      return {
        ...link,
        studentDisplayName: user?.displayName ?? null,
        studentPhotoURL: user?.photoURL ?? null,
      };
    }));
  },

  async getStudentLink(professionalId: string, linkId: string) {
    const link = await prisma.studentLink.findFirst({
      where: { id: linkId, professionalId },
    });
    if (!link) throw new AppError(404, 'Vínculo não encontrado');
    const user = await prisma.user.findUnique({
      where: { id: link.studentUserId },
      select: { displayName: true, photoURL: true },
    });
    return { ...link, studentDisplayName: user?.displayName ?? null, studentPhotoURL: user?.photoURL ?? null };
  },

  async updateStudentLink(professionalId: string, linkId: string, data: Record<string, unknown>) {
    const existing = await prisma.studentLink.findFirst({
      where: { id: linkId, professionalId },
    });
    if (!existing) throw new AppError(404, 'Vínculo não encontrado');
    return prisma.studentLink.update({
      where: { id: linkId },
      data: data as Parameters<typeof prisma.studentLink.update>[0]['data'],
    });
  },

  async unlinkStudent(professionalId: string, linkId: string) {
    const existing = await prisma.studentLink.findFirst({
      where: { id: linkId, professionalId },
    });
    if (!existing) throw new AppError(404, 'Vínculo não encontrado');
    await prisma.studentLink.update({ where: { id: linkId }, data: { status: 'inactive' } });
  },

  async deleteStudent(professionalId: string, linkId: string) {
    const link = await prisma.studentLink.findFirst({
      where: { id: linkId, professionalId },
    });
    if (!link) throw new AppError(404, 'Vínculo não encontrado');

    await prisma.$transaction([
      // Delete workout days created by this professional for the student
      prisma.workoutDay.deleteMany({
        where: { userId: link.studentUserId, createdByProfessionalId: professionalId },
      }),
      // Delete diet plan items (all are professional-created — students don't create DietPlanItems)
      prisma.dietPlanItem.deleteMany({
        where: { userId: link.studentUserId },
      }),
      // Delete professional content linked to this relationship
      prisma.studentNote.deleteMany({ where: { studentLinkId: linkId } }),
      prisma.studentGoal.deleteMany({ where: { studentLinkId: linkId } }),
      prisma.evaluation.deleteMany({ where: { studentLinkId: linkId } }),
      // Delete the link itself
      prisma.studentLink.delete({ where: { id: linkId } }),
    ]);
  },

  async addTagToStudent(professionalId: string, linkId: string, tagId: string) {
    const link = await prisma.studentLink.findFirst({ where: { id: linkId, professionalId } });
    if (!link) throw new AppError(404, 'Vínculo não encontrado');

    const tags = (link.tags as string[]) ?? [];
    if (!tags.includes(tagId)) {
      await prisma.studentLink.update({
        where: { id: linkId },
        data: { tags: [...tags, tagId] },
      });
    }
  },

  async removeTagFromStudent(professionalId: string, linkId: string, tagId: string) {
    const link = await prisma.studentLink.findFirst({ where: { id: linkId, professionalId } });
    if (!link) throw new AppError(404, 'Vínculo não encontrado');

    const tags = ((link.tags as string[]) ?? []).filter((t) => t !== tagId);
    await prisma.studentLink.update({ where: { id: linkId }, data: { tags } });
  },

  // ─── Invitations ────────────────────────────────────────────────────────────

  async listPendingInvitations(professionalId: string) {
    return prisma.invitation.findMany({
      where: { professionalId, status: 'pending' },
    });
  },

  async createInvitation(
    professionalId: string,
    profName: string,
    profEmail: string,
    data: CreateInvitationInput
  ) {
    const code = crypto.randomUUID().replace(/-/g, '').substring(0, 10).toUpperCase();
    const hours = data.expiresInHours ?? 168; // default 7 days
    const expiresAt = new Date(Date.now() + hours * 3600 * 1000);

    const invitation = await prisma.invitation.create({
      data: {
        professionalId,
        professionalName:  profName,
        professionalEmail: profEmail,
        studentEmail:      data.studentEmail ?? null,
        invitationCode:    code,
        accessLevel:       data.accessLevel,
        message:           data.message ?? null,
        expiresAt,
      },
    });

    // Return with `code` alias so clients don't need to know the DB field name
    return { ...invitation, code: invitation.invitationCode };
  },

  async acceptInvitation(invitationCode: string, studentUserId: string, contractedTypes?: string[]) {
    const invitation = await prisma.invitation.findFirst({
      where: { invitationCode, status: 'pending' },
    });

    if (!invitation) throw new AppError(404, 'Convite não encontrado ou já utilizado');
    if (new Date(invitation.expiresAt) < new Date()) throw new AppError(410, 'Convite expirado');

    // If contractedTypes not provided, fall back to professional's full type list
    let resolvedTypes = contractedTypes ?? [];
    if (resolvedTypes.length === 0) {
      const proProfile = await prisma.professionalProfile.findUnique({
        where: { userId: invitation.professionalId },
        select: { professionalTypes: true },
      });
      resolvedTypes = proProfile?.professionalTypes ?? ['other'];
    }

    // Resolve student email: prefer invitation target, fall back to authenticated user
    const studentEmail = invitation.studentEmail
      ?? (await prisma.user.findUnique({ where: { id: studentUserId }, select: { email: true } }))?.email
      ?? '';

    const [link] = await prisma.$transaction([
      prisma.studentLink.create({
        data: {
          professionalId: invitation.professionalId,
          studentUserId,
          studentEmail,
          accessLevel:    invitation.accessLevel,
          invitationCode,
          contractedTypes: resolvedTypes,
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted', acceptedAt: new Date() },
      }),
    ]);

    return link;
  },

  async rejectInvitation(invitationId: string) {
    const existing = await prisma.invitation.findUnique({ where: { id: invitationId } });
    if (!existing) throw new AppError(404, 'Convite não encontrado');
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'rejected' },
    });
  },

  // ─── Notes ──────────────────────────────────────────────────────────────────

  async listNotes(professionalId: string, studentLinkId?: string) {
    return prisma.studentNote.findMany({
      where: { professionalId, ...(studentLinkId ? { studentLinkId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createNote(professionalId: string, data: CreateNoteInput) {
    return prisma.studentNote.create({ data: { ...data, professionalId } });
  },

  async updateNote(professionalId: string, noteId: string, data: Partial<CreateNoteInput>) {
    const existing = await prisma.studentNote.findFirst({ where: { id: noteId, professionalId } });
    if (!existing) throw new AppError(404, 'Nota não encontrada');
    return prisma.studentNote.update({ where: { id: noteId }, data });
  },

  async deleteNote(professionalId: string, noteId: string) {
    const existing = await prisma.studentNote.findFirst({ where: { id: noteId, professionalId } });
    if (!existing) throw new AppError(404, 'Nota não encontrada');
    await prisma.studentNote.delete({ where: { id: noteId } });
  },

  // ─── Goals ──────────────────────────────────────────────────────────────────

  async listGoals(professionalId: string, studentLinkId?: string) {
    return prisma.studentGoal.findMany({
      where: { professionalId, ...(studentLinkId ? { studentLinkId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createGoal(professionalId: string, data: CreateGoalInput) {
    const goal = await prisma.studentGoal.create({
      data: { ...data, professionalId, status: 'active', progress: 0 },
    });

    const [link, proUser] = await Promise.all([
      prisma.studentLink.findUnique({ where: { id: data.studentLinkId }, select: { studentUserId: true } }),
      prisma.user.findUnique({ where: { id: professionalId }, select: { displayName: true } }),
    ]);
    if (link) {
      const proName = proUser?.displayName ?? 'Seu profissional';
      await sendNotification(
        link.studentUserId,
        'new_goal',
        'Nova meta criada',
        `${proName} criou uma nova meta para você: ${data.title}`,
        `/equipe/${data.studentLinkId}?tab=0`,
        { fromUserId: professionalId, fromUserName: proName },
      );
    }

    return goal;
  },

  async updateGoal(professionalId: string, goalId: string, data: Record<string, unknown>) {
    const existing = await prisma.studentGoal.findFirst({ where: { id: goalId, professionalId } });
    if (!existing) throw new AppError(404, 'Meta não encontrada');
    return prisma.studentGoal.update({
      where: { id: goalId },
      data: data as Parameters<typeof prisma.studentGoal.update>[0]['data'],
    });
  },

  async deleteGoal(professionalId: string, goalId: string) {
    const existing = await prisma.studentGoal.findFirst({ where: { id: goalId, professionalId } });
    if (!existing) throw new AppError(404, 'Meta não encontrada');
    await prisma.studentGoal.delete({ where: { id: goalId } });
  },

  // ─── Evaluations ────────────────────────────────────────────────────────────

  async listEvaluations(professionalId: string, studentLinkId?: string) {
    return prisma.evaluation.findMany({
      where: { professionalId, ...(studentLinkId ? { studentLinkId } : {}) },
      orderBy: { scheduledDate: 'desc' },
    });
  },

  async createEvaluation(professionalId: string, data: CreateEvaluationInput) {
    const evaluation = await prisma.evaluation.create({ data: { ...data, professionalId, status: 'scheduled' } });

    const [link, proUser] = await Promise.all([
      prisma.studentLink.findUnique({ where: { id: data.studentLinkId }, select: { studentUserId: true } }),
      prisma.user.findUnique({ where: { id: professionalId }, select: { displayName: true } }),
    ]);
    if (link) {
      const proName = proUser?.displayName ?? 'Seu profissional';
      await sendNotification(
        link.studentUserId,
        'new_evaluation',
        'Avaliação agendada',
        `${proName} agendou uma avaliação: ${data.title} em ${data.scheduledDate}`,
        `/equipe/${data.studentLinkId}?tab=1`,
        { fromUserId: professionalId, fromUserName: proName },
      );
    }

    return evaluation;
  },

  async updateEvaluation(
    professionalId: string,
    evaluationId: string,
    data: Record<string, unknown>
  ) {
    const existing = await prisma.evaluation.findFirst({
      where: { id: evaluationId, professionalId },
    });
    if (!existing) throw new AppError(404, 'Avaliação não encontrada');
    return prisma.evaluation.update({
      where: { id: evaluationId },
      data: data as Parameters<typeof prisma.evaluation.update>[0]['data'],
    });
  },

  async deleteEvaluation(professionalId: string, evaluationId: string) {
    const existing = await prisma.evaluation.findFirst({
      where: { id: evaluationId, professionalId },
    });
    if (!existing) throw new AppError(404, 'Avaliação não encontrada');
    await prisma.evaluation.delete({ where: { id: evaluationId } });
  },

  // ─── Stats ──────────────────────────────────────────────────────────────────

  async getStudentConsistency(_professionalId: string, linkId: string) {
    // Access already verified by resolveStudentAccess in the controller
    const link = await prisma.studentLink.findUnique({ where: { id: linkId } });
    if (!link) throw new AppError(404, 'Vínculo não encontrado');
    return computeStudentConsistency(link);
  },

  async getStats(professionalId: string) {
    const [students, goals, pendingEvaluations] = await Promise.all([
      prisma.studentLink.findMany({ where: { professionalId, status: 'active' } }),
      prisma.studentGoal.findMany({ where: { professionalId } }),
      prisma.evaluation.count({ where: { professionalId, status: 'scheduled' } }),
    ]);

    // ── Consistency per student ───────────────────────────────────────────────
    const consistency = await Promise.all(students.map(computeStudentConsistency));

    const avgWorkoutPct   = consistency.length
      ? Math.round(consistency.reduce((s, c) => s + c.workoutPct,   0) / consistency.length)
      : 0;
    const avgNutritionPct = consistency.length
      ? Math.round(consistency.reduce((s, c) => s + c.nutritionPct, 0) / consistency.length)
      : 0;

    const expiringPlans = consistency.filter((c) => c.planExpiringSoon || c.planExpired);

    return {
      totalStudents:    students.length,
      activeGoals:      goals.filter((g) => g.status === 'active').length,
      completedGoals:   goals.filter((g) => g.status === 'completed').length,
      pendingEvaluations,
      consistency,
      avgWorkoutPct,
      avgNutritionPct,
      expiringPlans,
    };
  },

  // ─── Conversations ──────────────────────────────────────────────────────────

  async listConversations(
    professionalId: string,
    studentLinkId?: string,
    includeArchived = false
  ) {
    return prisma.conversation.findMany({
      where: {
        professionalId,
        ...(studentLinkId ? { studentLinkId } : {}),
        ...(!includeArchived ? { isArchived: false } : {}),
      },
      orderBy: { lastMessageAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
  },

  async getConversation(conversationId: string) {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) throw new AppError(404, 'Conversa não encontrada');
    return conv;
  },

  async createConversation(professionalId: string, data: CreateConversationInput) {
    const conversation = await prisma.conversation.create({
      data: {
        professionalId,
        studentLinkId: data.studentLinkId,
        studentUserId: data.studentUserId,
        title: data.title,
        category: data.category,
      },
    });

    if (data.initialMessage) {
      await this.addMessage(conversation.id, {
        senderId: professionalId,
        senderType: 'professional',
        senderName: 'Profissional',
        content: data.initialMessage,
      });
    }

    return conversation;
  },

  async addMessage(conversationId: string, data: AddMessageInput) {
    const [message, conv] = await prisma.$transaction([
      prisma.message.create({
        data: { ...data, conversationId },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          ...(data.senderType === 'professional'
            ? { unreadStudent: { increment: 1 } }
            : { unreadPro: { increment: 1 } }),
        },
      }),
    ]);

    if (data.senderType === 'professional') {
      await sendNotification(
        conv.studentUserId,
        'new_message',
        'Nova mensagem',
        `${data.senderName} enviou uma mensagem`,
        `/equipe/${conv.studentLinkId}?tab=2&conv=${conversationId}`,
        { fromUserId: data.senderId, fromUserName: data.senderName },
      );
    }

    return message;
  },

  async markConversationAsRead(
    conversationId: string,
    _userId: string,
    userType: 'professional' | 'student'
  ) {
    const existing = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!existing) throw new AppError(404, 'Conversa não encontrada');

    await prisma.conversation.update({
      where: { id: conversationId },
      data: userType === 'professional' ? { unreadPro: 0 } : { unreadStudent: 0 },
    });
  },

  async archiveConversation(conversationId: string) {
    const existing = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!existing) throw new AppError(404, 'Conversa não encontrada');
    await prisma.conversation.update({ where: { id: conversationId }, data: { isArchived: true } });
  },

  async unarchiveConversation(conversationId: string) {
    const existing = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!existing) throw new AppError(404, 'Conversa não encontrada');
    await prisma.conversation.update({ where: { id: conversationId }, data: { isArchived: false } });
  },

  async deleteConversation(conversationId: string) {
    const existing = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!existing) throw new AppError(404, 'Conversa não encontrada');
    await prisma.conversation.delete({ where: { id: conversationId } });
  },

  // ─── Collaborations ─────────────────────────────────────────────────────────

  /**
   * Returns all students for a professional, including students they collaborate on.
   * Each entry has `role: "owner" | "collaborator"` and `scopes` for collaborators.
   */
  async listStudentsWithCollaborations(professionalId: string) {
    // Own links
    const ownLinks = await prisma.studentLink.findMany({
      where: { professionalId, status: { not: 'deleted' } },
      orderBy: { linkedAt: 'desc' },
    });

    // Collaborative links (active collaborations where this professional is the collaborator)
    const activeCollabs = await prisma.professionalCollaboration.findMany({
      where: { collaboratorId: professionalId, status: 'active' },
      include: {
        studentLink: true,
        invitedBy: { select: { displayName: true, email: true, photoURL: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const userIds = [
      ...ownLinks.map((l) => l.studentUserId),
      ...activeCollabs.map((c) => c.studentLink.studentUserId),
    ];
    const uniqueIds = [...new Set(userIds)];
    const users = await prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, displayName: true, photoURL: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const ownEntries = ownLinks.map((link) => ({
      ...link,
      studentDisplayName: userMap[link.studentUserId]?.displayName ?? null,
      studentPhotoURL: userMap[link.studentUserId]?.photoURL ?? null,
      role: 'owner' as const,
      scopes: ['workouts', 'nutrition'],
    }));

    const collabEntries = activeCollabs.map((c) => ({
      ...c.studentLink,
      studentDisplayName: userMap[c.studentLink.studentUserId]?.displayName ?? null,
      studentPhotoURL: userMap[c.studentLink.studentUserId]?.photoURL ?? null,
      role: 'collaborator' as const,
      scopes: c.scopes,
      collaborationId: c.id,
      ownerName: c.invitedBy.displayName,
      ownerEmail: c.invitedBy.email,
      ownerPhotoURL: c.invitedBy.photoURL,
    }));

    return [...ownEntries, ...collabEntries];
  },

  /**
   * Resolve a student link that this professional can access (either as owner or active collaborator).
   * Returns the link + the access scopes available to the caller.
   */
  async resolveStudentAccess(professionalId: string, linkId: string): Promise<{
    link: { id: string; studentUserId: string; studentEmail: string; professionalId: string; status: string; [key: string]: unknown };
    scopes: string[];
    role: 'owner' | 'collaborator';
  }> {
    // Check owner
    const ownLink = await prisma.studentLink.findFirst({
      where: { id: linkId, professionalId },
    });
    if (ownLink) return { link: ownLink as any, scopes: ['workouts', 'nutrition'], role: 'owner' };

    // Check collaboration
    const collab = await prisma.professionalCollaboration.findFirst({
      where: { studentLinkId: linkId, collaboratorId: professionalId, status: 'active' },
      include: { studentLink: true },
    });
    if (collab) return { link: collab.studentLink as any, scopes: collab.scopes, role: 'collaborator' };

    throw new AppError(404, 'Vínculo não encontrado ou sem acesso');
  },

  /** List collaborators on a specific student link (only the owner can see this). */
  async listCollaborators(professionalId: string, linkId: string) {
    const link = await prisma.studentLink.findFirst({ where: { id: linkId, professionalId } });
    if (!link) throw new AppError(404, 'Vínculo não encontrado');

    const collabs = await prisma.professionalCollaboration.findMany({
      where: { studentLinkId: linkId },
      include: {
        collaborator: { select: { id: true, displayName: true, email: true, photoURL: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return collabs.map((c) => ({
      id: c.id,
      status: c.status,
      scopes: c.scopes,
      message: c.message,
      createdAt: c.createdAt,
      collaborator: c.collaborator,
    }));
  },

  /** Invite a professional (by email) to collaborate on a student. */
  async inviteCollaborator(
    professionalId: string,
    linkId: string,
    collaboratorEmail: string,
    scopes: string[],
    message?: string
  ) {
    const link = await prisma.studentLink.findFirst({ where: { id: linkId, professionalId } });
    if (!link) throw new AppError(404, 'Vínculo não encontrado');

    const collaborator = await prisma.user.findUnique({ where: { email: collaboratorEmail } });
    if (!collaborator) throw new AppError(404, 'Profissional com este e-mail não encontrado');
    if (collaborator.id === professionalId) throw new AppError(400, 'Não é possível convidar a si mesmo');

    // Check if collaborator has a professional profile
    const collabProfile = await prisma.professionalProfile.findUnique({ where: { userId: collaborator.id } });
    if (!collabProfile) throw new AppError(400, 'O usuário convidado não possui perfil profissional');

    // Fetch the inviting professional's name for the notification
    const inviterUser = await prisma.user.findUnique({ where: { id: professionalId }, select: { displayName: true } });
    const inviterName = inviterUser?.displayName ?? 'Um profissional';
    const studentName = (await prisma.user.findUnique({ where: { id: link.studentUserId }, select: { displayName: true } }))?.displayName ?? link.studentEmail;
    const scopeLabel = scopes.map((s) => s === 'workouts' ? 'Treinos' : 'Nutrição').join(' e ');

    // Check for existing invitation
    const existing = await prisma.professionalCollaboration.findUnique({
      where: { studentLinkId_collaboratorId: { studentLinkId: linkId, collaboratorId: collaborator.id } },
    });
    if (existing) {
      if (existing.status === 'active') throw new AppError(409, 'Este profissional já colabora neste aluno');
      if (existing.status === 'pending') throw new AppError(409, 'Convite já enviado e aguardando resposta');
      // Rejected — resend
      const updated = await prisma.professionalCollaboration.update({
        where: { id: existing.id },
        data: { scopes, message: message ?? null, status: 'pending', updatedAt: new Date() },
      });
      await sendNotification(
        collaborator.id,
        'collaboration_invite',
        'Novo convite de colaboração',
        `${inviterName} convidou você para colaborar no atendimento de ${studentName} (${scopeLabel}).`,
        '/dashboard/collaborations',
        { fromUserId: professionalId, fromUserName: inviterName }
      );
      return updated;
    }

    const collab = await prisma.professionalCollaboration.create({
      data: { studentLinkId: linkId, collaboratorId: collaborator.id, invitedById: professionalId, scopes, message: message ?? null },
    });

    await sendNotification(
      collaborator.id,
      'collaboration_invite',
      'Novo convite de colaboração',
      `${inviterName} convidou você para colaborar no atendimento de ${studentName} (${scopeLabel}).`,
      '/dashboard/collaborations',
      { fromUserId: professionalId, fromUserName: inviterName }
    );

    return collab;
  },

  /** Remove a collaborator from a student link (owner only). */
  async removeCollaborator(professionalId: string, linkId: string, collabId: string) {
    const link = await prisma.studentLink.findFirst({ where: { id: linkId, professionalId } });
    if (!link) throw new AppError(404, 'Vínculo não encontrado');

    const collab = await prisma.professionalCollaboration.findFirst({
      where: { id: collabId, studentLinkId: linkId },
    });
    if (!collab) throw new AppError(404, 'Colaboração não encontrada');
    await prisma.professionalCollaboration.delete({ where: { id: collabId } });
  },

  /** List collaboration invitations received by this professional. */
  async listReceivedCollaborations(collaboratorId: string) {
    const collabs = await prisma.professionalCollaboration.findMany({
      where: { collaboratorId },
      include: {
        invitedBy: { select: { displayName: true, email: true, photoURL: true } },
        studentLink: { select: { studentEmail: true, studentUserId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with student display name
    const studentIds = collabs.map((c) => c.studentLink.studentUserId);
    const students = await prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, displayName: true },
    });
    const studentMap = Object.fromEntries(students.map((s) => [s.id, s.displayName]));

    return collabs.map((c) => ({
      id: c.id,
      status: c.status,
      scopes: c.scopes,
      message: c.message,
      createdAt: c.createdAt,
      studentLinkId: c.studentLinkId,
      studentEmail: c.studentLink.studentEmail,
      studentDisplayName: studentMap[c.studentLink.studentUserId] ?? null,
      owner: c.invitedBy,
    }));
  },

  /** Accept or reject a collaboration invitation. */
  async respondToCollaboration(collaboratorId: string, collabId: string, action: 'accept' | 'reject') {
    const collab = await prisma.professionalCollaboration.findFirst({
      where: { id: collabId, collaboratorId, status: 'pending' },
      include: { studentLink: true },
    });
    if (!collab) throw new AppError(404, 'Convite não encontrado ou já respondido');

    await prisma.professionalCollaboration.update({
      where: { id: collabId },
      data: { status: action === 'accept' ? 'active' : 'rejected' },
    });

    // Notify the professional who sent the invite
    const collabUser = await prisma.user.findUnique({ where: { id: collaboratorId }, select: { displayName: true } });
    const collabName = collabUser?.displayName ?? 'O profissional';
    const studentName = (await prisma.user.findUnique({ where: { id: collab.studentLink.studentUserId }, select: { displayName: true } }))?.displayName ?? collab.studentLink.studentEmail;

    if (action === 'accept') {
      await sendNotification(
        collab.invitedById,
        'collaboration_accepted',
        'Convite aceito',
        `${collabName} aceitou colaborar no atendimento de ${studentName}.`,
        `/dashboard/clients/${collab.studentLinkId}`,
        { fromUserId: collaboratorId, fromUserName: collabName }
      );
    } else {
      await sendNotification(
        collab.invitedById,
        'collaboration_rejected',
        'Convite recusado',
        `${collabName} recusou o convite para colaborar no atendimento de ${studentName}.`,
        '/dashboard/clients',
        { fromUserId: collaboratorId, fromUserName: collabName }
      );
    }
  },

  // ─── Brand ──────────────────────────────────────────────────────────────────

  async getBrand(userId: string) {
    const profile = await prisma.professionalProfile.findUnique({
      where: { userId },
      select: { brandColor: true, brandHighlightColor: true, brandSurfaceColor: true, brandOnSurfaceColor: true, brandLogoUrl: true, brandName: true, brandAppBarColor: true, brandNavBarColor: true, brandCardColor: true },
    });
    if (!profile) throw new AppError(404, 'Perfil profissional não encontrado');
    return profile;
  },

  async updateBrand(userId: string, data: {
    brandColor?: string | null;
    brandHighlightColor?: string | null;
    brandSurfaceColor?: string | null;
    brandOnSurfaceColor?: string | null;
    brandLogoUrl?: string | null;
    brandName?: string | null;
    brandAppBarColor?: string | null;
    brandNavBarColor?: string | null;
    brandCardColor?: string | null;
  }) {
    const profile = await prisma.professionalProfile.findUnique({ where: { userId } });
    if (!profile) throw new AppError(404, 'Perfil profissional não encontrado');
    const hexRe = /^#[0-9A-Fa-f]{6}$/;
    const colorFields: Array<[string | null | undefined, string]> = [
      [data.brandColor, 'Cor primária'],
      [data.brandHighlightColor, 'Cor de destaque'],
      [data.brandSurfaceColor, 'Cor de fundo'],
      [data.brandOnSurfaceColor, 'Cor das fontes'],
      [data.brandAppBarColor, 'Cor da AppBar'],
      [data.brandNavBarColor, 'Cor da NavBar'],
      [data.brandCardColor,   'Cor dos cards'],
    ];
    for (const [val, label] of colorFields) {
      if (val && !hexRe.test(val))
        throw new AppError(400, `${label} inválida. Use o formato hexadecimal, ex: #3B82F6`);
    }
    return prisma.professionalProfile.update({
      where: { userId },
      data: {
        ...(data.brandColor !== undefined && { brandColor: data.brandColor }),
        ...(data.brandHighlightColor !== undefined && { brandHighlightColor: data.brandHighlightColor }),
        ...(data.brandSurfaceColor !== undefined && { brandSurfaceColor: data.brandSurfaceColor }),
        ...(data.brandOnSurfaceColor !== undefined && { brandOnSurfaceColor: data.brandOnSurfaceColor }),
        ...(data.brandLogoUrl !== undefined && { brandLogoUrl: data.brandLogoUrl }),
        ...(data.brandName !== undefined && { brandName: data.brandName }),
        ...(data.brandAppBarColor !== undefined && { brandAppBarColor: data.brandAppBarColor }),
        ...(data.brandNavBarColor !== undefined && { brandNavBarColor: data.brandNavBarColor }),
        ...(data.brandCardColor   !== undefined && { brandCardColor:   data.brandCardColor   }),
      },
      select: { brandColor: true, brandHighlightColor: true, brandSurfaceColor: true, brandOnSurfaceColor: true, brandLogoUrl: true, brandName: true, brandAppBarColor: true, brandNavBarColor: true, brandCardColor: true },
    });
  },

  // ─── Professional updates ─────────────────────────────────────────────────────

  async listMyUpdates(userId: string) {
    return prisma.professionalUpdate.findMany({
      where: { professionalId: userId },
      orderBy: { publishedAt: 'desc' },
      select: { id: true, emoji: true, title: true, items: true, publishedAt: true },
    });
  },

  async createUpdate(userId: string, data: { emoji?: string; title: string; items: string[] }) {
    return prisma.professionalUpdate.create({
      data: {
        professionalId: userId,
        emoji: data.emoji ?? '📣',
        title: data.title,
        items: data.items,
      },
      select: { id: true, emoji: true, title: true, items: true, publishedAt: true },
    });
  },

  async deleteUpdate(userId: string, updateId: string) {
    const upd = await prisma.professionalUpdate.findUnique({ where: { id: updateId } });
    if (!upd || upd.professionalId !== userId) throw new AppError(404, 'Atualização não encontrada');
    await prisma.professionalUpdate.delete({ where: { id: updateId } });
  },

  async getStudentProfessionalUpdates(studentUserId: string) {
    // Find the student's first active link and return that professional's updates
    const link = await prisma.studentLink.findFirst({
      where: { studentUserId, status: 'active' },
      orderBy: { linkedAt: 'desc' },
    });
    if (!link) return [];
    return prisma.professionalUpdate.findMany({
      where: { professionalId: link.professionalId },
      orderBy: { publishedAt: 'desc' },
      select: { id: true, emoji: true, title: true, items: true, publishedAt: true },
    });
  },
};
