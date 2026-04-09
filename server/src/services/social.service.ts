import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../types/api.types';
import { sseService } from './sse.service';

// ─── Challenge Difficulty Presets ────────────────────────────────────────────
// All values are normalized for 30 days. Actual targetValue = preset * (days/30).
type Difficulty = 'iniciante' | 'intermediario' | 'avancado' | 'elite';

const CHALLENGE_PRESETS: Record<string, Record<Difficulty, number>> = {
  muscle_group_volume: { iniciante: 20_000,  intermediario: 60_000,  avancado: 120_000, elite: 300_000 },
  volume:              { iniciante: 150_000, intermediario: 400_000, avancado: 800_000, elite: 2_000_000 },
  workouts:            { iniciante: 8,       intermediario: 18,      avancado: 30,      elite: 50 },
  streak:              { iniciante: 6,       intermediario: 14,      avancado: 21,      elite: 28 },
  cardio_distance:     { iniciante: 20,      intermediario: 80,      avancado: 300,     elite: 600 },
  workout_proof:       { iniciante: 8,       intermediario: 15,      avancado: 25,      elite: 40 },
};

const BADGE_TIERS = [
  { rarity: 'bronze',   icon: '🥉', label: 'Bronze'   },
  { rarity: 'silver',   icon: '🥈', label: 'Prata'    },
  { rarity: 'gold',     icon: '🥇', label: 'Ouro'     },
  { rarity: 'diamond',  icon: '💎', label: 'Diamante' },
] as const;

const DIFFICULTY_TIER_INDEX: Record<Difficulty, number> = {
  iniciante: 0, intermediario: 1, avancado: 2, elite: 3,
};

function computeTargetValue(type: string, difficulty: Difficulty, startDate: string, endDate: string): number {
  const presets = CHALLENGE_PRESETS[type];
  if (!presets) return 100;
  const days = Math.max(1, Math.round(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000
  ));
  return Math.round(presets[difficulty] * (days / 30));
}

function determineBadge(difficulty: Difficulty, pct: number): typeof BADGE_TIERS[number] | null {
  if (pct < 0.25) return null;
  const maxTier = DIFFICULTY_TIER_INDEX[difficulty];
  let tierIdx: number;
  if (pct >= 1.0)      tierIdx = maxTier;
  else if (pct >= 0.75) tierIdx = Math.max(0, maxTier - 1);
  else if (pct >= 0.50) tierIdx = Math.max(0, maxTier - 2);
  else                   tierIdx = 0; // 25–49% → always bronze
  return BADGE_TIERS[tierIdx];
}

export const socialService = {
  // ─── Groups ─────────────────────────────────────────────────────────────────

  async listGroups(userId: string, filter?: 'my' | 'discover') {
    if (filter === 'my') {
      return prisma.group.findMany({
        where: { members: { some: { userId } } },
        include: { _count: { select: { members: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    return prisma.group.findMany({
      where: {
        isPrivate: false,
        members: { none: { userId } },
      },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getGroup(groupId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: { user: { select: { id: true, displayName: true, photoURL: true } } },
        },
        _count: { select: { members: true, posts: true } },
      },
    });
    if (!group) throw new AppError(404, 'Grupo não encontrado');
    return group;
  },

  async createGroup(
    userId: string,
    data: { name: string; description?: string; isPrivate?: boolean; coverPhoto?: string }
  ) {
    const group = await prisma.group.create({
      data: {
        ...data,
        createdBy: userId,
        membersCount: 1,
        members: {
          create: { userId, role: 'admin' },
        },
      },
    });
    return group;
  },

  async updateGroup(groupId: string, userId: string, data: Record<string, unknown>) {
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member || member.role !== 'admin') {
      throw new AppError(403, 'Apenas admins podem editar o grupo');
    }
    return prisma.group.update({
      where: { id: groupId },
      data: data as Parameters<typeof prisma.group.update>[0]['data'],
    });
  },

  async deleteGroup(groupId: string, userId: string) {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new AppError(404, 'Grupo não encontrado');
    if (group.createdBy !== userId) throw new AppError(403, 'Apenas o criador pode deletar o grupo');
    await prisma.group.delete({ where: { id: groupId } });
  },

  async listGroupMembers(groupId: string) {
    return prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: { id: true, displayName: true, photoURL: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  },

  async joinGroup(groupId: string, userId: string) {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new AppError(404, 'Grupo não encontrado');

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (existing) throw new AppError(409, 'Você já é membro deste grupo');

    const [member] = await prisma.$transaction([
      prisma.groupMember.create({ data: { groupId, userId } }),
      prisma.group.update({
        where: { id: groupId },
        data: { membersCount: { increment: 1 } },
      }),
    ]);
    return member;
  },

  async joinGroupByCode(inviteCode: string, userId: string) {
    const group = await prisma.group.findFirst({ where: { inviteCode } });
    if (!group) throw new AppError(404, 'Código inválido ou grupo não encontrado');

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });
    if (existing) throw new AppError(409, 'Você já é membro deste grupo');

    await prisma.$transaction([
      prisma.groupMember.create({ data: { groupId: group.id, userId } }),
      prisma.group.update({
        where: { id: group.id },
        data: { membersCount: { increment: 1 } },
      }),
    ]);
    return group;
  },

  async leaveGroup(groupId: string, userId: string) {
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) throw new AppError(404, 'Você não é membro deste grupo');

    await prisma.$transaction([
      prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId } } }),
      prisma.group.update({
        where: { id: groupId },
        data: { membersCount: { decrement: 1 } },
      }),
    ]);
  },

  // ─── Posts ──────────────────────────────────────────────────────────────────

  async listPosts(groupId: string, userId: string) {
    await this._requireGroupMember(groupId, userId);
    return prisma.post.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, displayName: true, photoURL: true } },
        likes: { where: { userId }, select: { id: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createPost(
    groupId: string,
    userId: string,
    data: { content?: string; imageBase64?: string; imagesBase64?: string[]; exercises?: unknown[]; records?: unknown[] }
  ) {
    await this._requireGroupMember(groupId, userId);
    const [post] = await prisma.$transaction([
      prisma.post.create({
        data: {
          groupId,
          userId,
          content: data.content,
          imageBase64: data.imageBase64,
          imagesBase64: (data.imagesBase64 ?? []) as unknown as Prisma.InputJsonValue,
          exercises: (data.exercises ?? []) as unknown as Prisma.InputJsonValue,
          records: (data.records ?? []) as unknown as Prisma.InputJsonValue,
        },
        include: { user: { select: { id: true, displayName: true, photoURL: true } } },
      }),
      prisma.group.update({
        where: { id: groupId },
        data: { postsCount: { increment: 1 } },
      }),
    ]);

    // Auto-update challenge progress for workout posts
    const exercises = (data.exercises ?? []) as Array<Record<string, unknown>>;
    const isWorkoutPost = exercises.length > 0;
    if (isWorkoutPost) {
      await this._updateChallengesFromPost(groupId, userId, exercises);
    }

    return post;
  },

  async _updateChallengesFromPost(
    groupId: string,
    userId: string,
    exercises: Array<Record<string, unknown>>
  ) {
    const now = new Date().toISOString();
    const challenges = await prisma.groupChallenge.findMany({
      where: {
        groupId,
        status: 'active',
        type: { in: ['muscle_group_volume', 'cardio_distance', 'workout_proof'] },
        startDate: { lte: now },
        endDate: { gte: now },
        participants: { some: { userId } },
      },
      include: { participants: { where: { userId } } },
    });

    for (const challenge of challenges) {
      const participant = challenge.participants[0];
      if (!participant) continue;

      let contribution = 0;

      if (challenge.type === 'muscle_group_volume') {
        // Sum totalVolume of strength exercises matching the target muscle group
        const targetMuscle = (challenge.exerciseName ?? '').toLowerCase();
        for (const ex of exercises) {
          if (ex['exerciseType'] !== 'cardio') {
            const muscleGroup = ((ex['muscleGroup'] as string) ?? '').toLowerCase();
            if (muscleGroup && muscleGroup.includes(targetMuscle)) {
              contribution += (ex['totalVolume'] as number) ?? 0;
            }
          }
        }
      } else if (challenge.type === 'cardio_distance') {
        // Sum totalDistance (km) of cardio exercises matching subtype filter
        const targetSubtype = challenge.exerciseName ?? '';
        for (const ex of exercises) {
          if (ex['exerciseType'] === 'cardio') {
            const subtype = (ex['cardioSubtype'] as string) ?? '';
            if (!targetSubtype || subtype === targetSubtype) {
              contribution += (ex['totalDistance'] as number) ?? 0;
            }
          }
        }
      } else if (challenge.type === 'workout_proof') {
        contribution = 1;
      }

      if (contribution > 0) {
        const newProgress = participant.progress + contribution;
        const isCompleted = newProgress >= challenge.targetValue;
        await prisma.challengeParticipant.update({
          where: { challengeId_userId: { challengeId: challenge.id, userId } },
          data: {
            progress: newProgress,
            ...(isCompleted && !participant.completedAt ? { completedAt: new Date() } : {}),
          },
        });
        const all = await prisma.challengeParticipant.findMany({ where: { challengeId: challenge.id } });
        const total = all.reduce((s, p) => s + p.progress, 0);
        await prisma.groupChallenge.update({
          where: { id: challenge.id },
          data: { collectiveProgress: total },
        });
        // Award badge on 100% — only if challenge has at least 3 participants
        if (isCompleted && !participant.completedAt) {
          const totalParticipants = await prisma.challengeParticipant.count({
            where: { challengeId: challenge.id },
          });
          if (totalParticipants >= 3) {
            await this._awardChallengeBadge(userId, challenge, 1.0);
          }
        }
      }
    }
  },

  async deletePost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new AppError(404, 'Post não encontrado');
    if (post.userId !== userId) throw new AppError(403, 'Você não pode deletar este post');
    await prisma.post.delete({ where: { id: postId } });
  },

  async likePost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new AppError(404, 'Post não encontrado');

    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (existing) throw new AppError(409, 'Post já curtido');

    await prisma.$transaction([
      prisma.postLike.create({ data: { postId, userId } }),
      prisma.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      }),
    ]);

    // Notify post owner
    if (post.userId !== userId) {
      const notification = await prisma.notification.create({
        data: {
          userId: post.userId,
          type: 'post_like',
          title: 'Curtida no seu post',
          message: 'Alguém curtiu seu post',
          postId,
          fromUserId: userId,
          actionUrl: post.groupId ? `/social/groups/${post.groupId}` : '/social',
        },
      });
      sseService.send(post.userId, 'notification', notification);
    }
  },

  async unlikePost(postId: string, userId: string) {
    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (!existing) throw new AppError(404, 'Post não curtido');

    await prisma.$transaction([
      prisma.postLike.delete({ where: { postId_userId: { postId, userId } } }),
      prisma.post.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      }),
    ]);
  },

  async addComment(postId: string, userId: string, text: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new AppError(404, 'Post não encontrado');

    const [comment] = await prisma.$transaction([
      prisma.postComment.create({ data: { postId, userId, text } }),
      prisma.post.update({
        where: { id: postId },
        data: { commentsCount: { increment: 1 } },
      }),
    ]);

    if (post.userId !== userId) {
      const notification = await prisma.notification.create({
        data: {
          userId: post.userId,
          type: 'post_comment',
          title: 'Novo comentário',
          message: 'Alguém comentou no seu post',
          postId,
          fromUserId: userId,
          actionUrl: post.groupId ? `/social/groups/${post.groupId}` : '/social',
        },
      });
      sseService.send(post.userId, 'notification', notification);
    }

    return comment;
  },

  async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.postComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new AppError(404, 'Comentário não encontrado');
    if (comment.userId !== userId) throw new AppError(403, 'Você não pode deletar este comentário');

    await prisma.$transaction([
      prisma.postComment.delete({ where: { id: commentId } }),
      prisma.post.update({
        where: { id: comment.postId },
        data: { commentsCount: { decrement: 1 } },
      }),
    ]);
  },

  // ─── Challenges ─────────────────────────────────────────────────────────────

  _computePreset(type: string, difficulty: string, startDate: string, endDate: string): number {
    return computeTargetValue(type, (difficulty as Difficulty) ?? 'iniciante', startDate ?? '', endDate ?? '');
  },

  async listChallenges(groupId: string, userId: string) {
    await this._requireGroupMember(groupId, userId);
    // Lazily finalize any expired challenges and distribute badges
    await this._finalizeExpiredChallenges(groupId);
    const challenges = await prisma.groupChallenge.findMany({
      where: { groupId },
      include: {
        participants: {
          include: { user: { select: { id: true, displayName: true } } },
          orderBy: { progress: 'desc' },
        },
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return challenges.map(c => ({
      ...c,
      unit: c.targetUnit,
      isJoined: c.participants.some(p => p.userId === userId),
      participantsCount: c._count.participants,
    }));
  },

  async createChallenge(
    groupId: string,
    userId: string,
    data: {
      title: string;
      description?: string;
      type: string;
      difficulty: string;
      targetUnit: string;
      startDate: string;
      endDate: string;
      isCompetitive?: boolean;
      reward?: string;
      exerciseId?: string;
      exerciseName?: string;
      createdByName: string;
    }
  ) {
    await this._requireGroupMember(groupId, userId);
    const difficulty = (data.difficulty as Difficulty) ?? 'iniciante';
    const targetValue = computeTargetValue(data.type, difficulty, data.startDate, data.endDate);
    const challenge = await prisma.groupChallenge.create({
      data: { ...data, difficulty, targetValue, groupId, createdBy: userId },
    });
    return { ...challenge, unit: challenge.targetUnit, isJoined: false, participantsCount: 0, participants: [] };
  },

  async joinChallenge(challengeId: string, userId: string) {
    const existing = await prisma.challengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });
    if (existing) throw new AppError(409, 'Você já participa deste desafio');
    return prisma.challengeParticipant.create({ data: { challengeId, userId } });
  },

  async updateChallengeProgress(challengeId: string, userId: string, progress: number) {
    const [participant, challenge] = await Promise.all([
      prisma.challengeParticipant.findUnique({
        where: { challengeId_userId: { challengeId, userId } },
      }),
      prisma.groupChallenge.findUnique({ where: { id: challengeId } }),
    ]);
    if (!participant) throw new AppError(404, 'Você não participa deste desafio');

    const isCompleted = challenge ? progress >= challenge.targetValue : false;
    await prisma.challengeParticipant.update({
      where: { challengeId_userId: { challengeId, userId } },
      data: {
        progress,
        ...(isCompleted && !participant.completedAt ? { completedAt: new Date() } : {}),
      },
    });

    // Recalculate collective progress
    const all = await prisma.challengeParticipant.findMany({ where: { challengeId } });
    const total = all.reduce((s, p) => s + p.progress, 0);
    await prisma.groupChallenge.update({
      where: { id: challengeId },
      data: { collectiveProgress: total },
    });

    // Award badge immediately on 100% — only if challenge has at least 3 participants
    if (isCompleted && !participant.completedAt && challenge) {
      const totalParticipants = await prisma.challengeParticipant.count({
        where: { challengeId },
      });
      if (totalParticipants >= 3) {
        await this._awardChallengeBadge(userId, challenge, 1.0);
      }
    }
  },

  // ─── Challenge Badge Helpers ─────────────────────────────────────────────────

  async _awardChallengeBadge(
    userId: string,
    challenge: { id: string; title: string; difficulty: string; targetValue: number },
    pct: number
  ) {
    const difficulty = challenge.difficulty as Difficulty;
    const tier = determineBadge(difficulty, pct);
    if (!tier) return;

    // Avoid duplicate badge for same challenge
    const existing = await prisma.userBadge.findFirst({
      where: { userId, challengeId: challenge.id },
    });
    if (existing) {
      // Upgrade if earned tier is better
      const existingTierIdx = BADGE_TIERS.findIndex(t => t.rarity === existing.badgeRarity);
      const newTierIdx = BADGE_TIERS.findIndex(t => t.rarity === tier.rarity);
      if (newTierIdx <= existingTierIdx) return;
      await prisma.userBadge.update({
        where: { id: existing.id },
        data: { badgeRarity: tier.rarity, badgeIcon: tier.icon, badgeName: `${tier.icon} ${challenge.title}`, earnedAt: new Date() },
      });
      return;
    }

    await prisma.userBadge.create({
      data: {
        userId,
        badgeId: `challenge_${challenge.id}`,
        badgeName: `${tier.icon} ${challenge.title}`,
        badgeIcon: tier.icon,
        badgeCategory: 'challenge',
        badgeRarity: tier.rarity,
        challengeId: challenge.id,
        challengeTitle: challenge.title,
      },
    });
  },

  async _finalizeExpiredChallenges(groupId: string) {
    const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const expired = await prisma.groupChallenge.findMany({
      where: { groupId, status: 'active', endDate: { lt: now } },
      include: { participants: true },
    });

    const MIN_PARTICIPANTS = 3;

    for (const challenge of expired) {
      if (challenge.participants.length >= MIN_PARTICIPANTS) {
        for (const p of challenge.participants) {
          if (challenge.targetValue > 0) {
            const pct = p.progress / challenge.targetValue;
            await this._awardChallengeBadge(p.userId, challenge, pct);
          }
        }
      }
      await prisma.groupChallenge.update({
        where: { id: challenge.id },
        data: { status: 'finished' },
      });
    }
  },

  // ─── Badges ─────────────────────────────────────────────────────────────────

  async listBadges(userId: string) {
    return prisma.userBadge.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
    });
  },

  async awardBadge(
    userId: string,
    data: {
      badgeId: string;
      badgeName: string;
      badgeIcon?: string;
      badgeCategory?: string;
      badgeRarity?: string;
      challengeId?: string;
      challengeTitle?: string;
    }
  ) {
    return prisma.userBadge.create({ data: { ...data, userId } });
  },

  // ─── User Stats / Profile ────────────────────────────────────────────────────

  async getUserStats(userId: string) {
    const [user, sessions, groupsCount, badgesCount, challengesCount] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { createdAt: true },
        }),
        prisma.workoutSession.findMany({
          where: { userId },
          select: { date: true, duration: true, exercises: true },
          orderBy: { date: 'asc' },
        }),
        prisma.groupMember.count({ where: { userId } }),
        prisma.userBadge.count({ where: { userId } }),
        prisma.challengeParticipant.count({ where: { userId } }),
      ]);

    if (!user) throw new AppError(404, 'Usuário não encontrado');

    // Aggregate workout stats from WorkoutSession.exercises JSON
    // (same source as the Flutter analytics client — LoggedExercise table is not used)
    let totalSets = 0;
    let totalReps = 0;
    let totalVolumeLifted = 0;
    let strongestLift: { exerciseName: string; weight: number } | null = null;
    let maxWeight = 0;

    // Track best weight per exercise definition (matches analytics prByMuscleGroup logic)
    const bestWeightByExercise = new Map<string, number>();

    for (const session of sessions) {
      const exercises = (session.exercises as Array<Record<string, unknown>>) ?? [];
      for (const ex of exercises) {
        const isCardio = ex['exerciseType'] === 'cardio';
        if (isCardio) continue; // skip cardio exercises for strength stats

        const exId = String(ex['exerciseDefinitionId'] ?? ex['exerciseName'] ?? '');
        const sets = (ex['sets'] as Array<Record<string, unknown>>) ?? [];
        for (const set of sets) {
          const reps = Number(set['reps'] ?? 0);
          const weight = Number(set['weight'] ?? 0);
          totalSets++;
          totalReps += reps;
          totalVolumeLifted += reps * weight;
          if (weight > 0) {
            const prev = bestWeightByExercise.get(exId) ?? 0;
            if (weight > prev) bestWeightByExercise.set(exId, weight);
          }
          if (weight > maxWeight) {
            maxWeight = weight;
            strongestLift = { exerciseName: String(ex['exerciseName'] ?? ''), weight };
          }
        }
      }
    }

    // PRs = number of distinct exercises where the user has lifted weight > 0
    // (mirrors analytics: one entry per exercise in prByMuscleGroup)
    const totalPersonalRecords = bestWeightByExercise.size;

    // Streak calculation
    const totalWorkoutTime = sessions.reduce((s, ss) => s + (ss.duration ?? 0), 0);
    const uniqueDates = [...new Set(sessions.map((s) => s.date))].sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(uniqueDates[i - 1]);
        const curr = new Date(uniqueDates[i]);
        const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
        if (diff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Current streak: streak ending today or yesterday
    const lastDate = uniqueDates[uniqueDates.length - 1];
    if (lastDate === today || lastDate === yesterday) {
      currentStreak = 1;
      for (let i = uniqueDates.length - 2; i >= 0; i--) {
        const next = new Date(uniqueDates[i + 1]);
        const curr = new Date(uniqueDates[i]);
        const diff = Math.round((next.getTime() - curr.getTime()) / 86400000);
        if (diff === 1) currentStreak++;
        else break;
      }
    }

    return {
      totalWorkouts: sessions.length,
      totalSets,
      totalReps,
      totalVolumeLifted,
      totalWorkoutTime,
      currentStreak,
      longestStreak,
      totalPersonalRecords,
      totalGroups: groupsCount,
      totalChallengesCompleted: challengesCount,
      totalBadges: badgesCount,
      memberSince: user.createdAt.toISOString(),
      strongestLift,
    };
  },

  // ─── Follow ───────────────────────────────────────────────────────────────

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) throw new AppError(400, 'Você não pode seguir a si mesmo');

    const exists = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (exists) throw new AppError(409, 'Você já segue este usuário');

    await prisma.$transaction([
      prisma.follow.create({ data: { followerId, followingId } }),
      prisma.user.update({ where: { id: followerId },  data: { followingCount: { increment: 1 } } }),
      prisma.user.update({ where: { id: followingId }, data: { followersCount: { increment: 1 } } }),
    ]);

    const follower = await prisma.user.findUnique({
      where: { id: followerId },
      select: { displayName: true },
    });
    const notification = await prisma.notification.create({
      data: {
        userId: followingId,
        type: 'new_follower',
        title: 'Novo seguidor',
        message: `${follower?.displayName ?? 'Alguém'} começou a te seguir`,
        fromUserId: followerId,
      },
    });
    sseService.send(followingId, 'notification', notification);
  },

  async unfollowUser(followerId: string, followingId: string) {
    const exists = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (!exists) throw new AppError(404, 'Você não segue este usuário');

    await prisma.$transaction([
      prisma.follow.delete({ where: { followerId_followingId: { followerId, followingId } } }),
      prisma.user.update({ where: { id: followerId },  data: { followingCount: { decrement: 1 } } }),
      prisma.user.update({ where: { id: followingId }, data: { followersCount: { decrement: 1 } } }),
    ]);
  },

  async getFollowStatus(requesterId: string, targetId: string) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: requesterId, followingId: targetId } },
    });
    return { isFollowing: !!follow };
  },

  // ─── Feed ─────────────────────────────────────────────────────────────────

  async getFeed(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Collect IDs of users the requester follows
    const followRows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = followRows.map((f) => f.followingId);

    // Feed = feed posts (groupId null) from followed users + own posts
    const authorIds = [...followingIds, userId];

    const posts = await prisma.post.findMany({
      where: { groupId: null, userId: { in: authorIds } },
      include: {
        user: { select: { id: true, displayName: true, photoURL: true } },
        likes: { where: { userId }, select: { id: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return posts.map((p) => ({
      ...p,
      likedByMe: p.likes.length > 0,
      likes: undefined,
    }));
  },

  async createFeedPost(
    userId: string,
    data: { content?: string; imageBase64?: string; imagesBase64?: string[]; exercises?: unknown[]; records?: unknown[]; isPublic?: boolean }
  ) {
    return prisma.post.create({
      data: {
        userId,
        groupId: null,
        content: data.content,
        imageBase64: data.imageBase64,
        imagesBase64: (data.imagesBase64 ?? []) as unknown as Prisma.InputJsonValue,
        exercises: (data.exercises ?? []) as unknown as Prisma.InputJsonValue,
        records: (data.records ?? []) as unknown as Prisma.InputJsonValue,
        isPublic: data.isPublic ?? false,
      },
      include: { user: { select: { id: true, displayName: true, photoURL: true } } },
    });
  },

  async getDiscoverFeed(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Posts públicos de todos os usuários (incluindo o próprio)
    const posts = await prisma.post.findMany({
      where: {
        groupId: null,
        isPublic: true,
      },
      include: {
        user: { select: { id: true, displayName: true, photoURL: true } },
        likes: { where: { userId }, select: { id: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return posts.map((p) => ({
      ...p,
      likedByMe: p.likes.length > 0,
      likes: undefined,
    }));
  },

  async getUserPublicProfile(userId: string, requesterId?: string) {
    const [user, badges, groupMemberships] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, displayName: true, photoURL: true, isPrivate: true, createdAt: true, followersCount: true, followingCount: true },
      }),
      prisma.userBadge.findMany({ where: { userId }, orderBy: { earnedAt: 'desc' }, take: 10 }),
      prisma.groupMember.findMany({
        where: { userId },
        include: { group: { select: { id: true, name: true, coverPhoto: true } } },
        take: 5,
      }),
    ]);
    if (!user) throw new AppError(404, 'Usuário não encontrado');

    const isFollowing = requesterId && requesterId !== userId
      ? !!(await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: requesterId, followingId: userId } },
        }))
      : false;

    if (user.isPrivate) {
      return {
        id: user.id, displayName: user.displayName, photoURL: user.photoURL,
        isPrivate: true, isFollowing,
        followersCount: user.followersCount, followingCount: user.followingCount,
      };
    }

    const stats = await socialService.getUserStats(userId);
    return {
      id: user.id,
      displayName: user.displayName,
      photoURL: user.photoURL,
      isPrivate: false,
      isFollowing,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      badges,
      groupMemberships,
      ...stats,
    };
  },

  // ─── Notifications ────────────────────────────────────────────────────────────

  async listNotifications(userId: string, unreadOnly = false) {
    return prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },

  async markNotificationRead(notificationId: string, userId: string) {
    const n = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
    if (!n) throw new AppError(404, 'Notificação não encontrada');
    return prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
  },

  async markAllNotificationsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  async _requireGroupMember(groupId: string, userId: string) {
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) throw new AppError(403, 'Você não é membro deste grupo');
    return member;
  },
};
