import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { professionalService } from '../services/professional.service';
import { authService } from '../services/auth.service';
import { workoutsService } from '../services/workouts.service';
import { nutritionService } from '../services/nutrition.service';
import prisma from '../config/database';
import { AppError } from '../types/api.types';

export const professionalController = {
  // ─── Profile ───────────────────────────────────────────────────────────────

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await professionalService.getProfile(req.params.userId);
      if (!profile) { res.status(404).json({ message: 'Perfil não encontrado' }); return; }
      res.json(profile);
    } catch (err) { next(err); }
  },

  async createProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getCurrentUser(req.user!.uid);
      const profile = await professionalService.createProfile(req.user!.uid, {
        ...req.body,
        email: user.email ?? '',
      });
      res.status(201).json(profile);
    } catch (err) { next(err); }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await professionalService.updateProfile(req.params.userId, req.body);
      res.json(profile);
    } catch (err) { next(err); }
  },

  // ─── Tags ──────────────────────────────────────────────────────────────────

  async listTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tags = await professionalService.listTags(req.query.professionalId as string || req.user!.uid);
      res.json(tags);
    } catch (err) { next(err); }
  },

  async createTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tag = await professionalService.createTag(req.user!.uid, req.body);
      res.status(201).json(tag);
    } catch (err) { next(err); }
  },

  async deleteTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await professionalService.deleteTag(req.user!.uid, req.params.tagId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  // ─── Student-side ──────────────────────────────────────────────────────────

  async listMyLinks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const links = await professionalService.listMyLinks(req.user!.uid);
      res.json({ data: links });
    } catch (err) { next(err); }
  },

  async unlinkSelf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await professionalService.unlinkSelf(req.params.linkId, req.user!.uid);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ─── Student-side data access ─────────────────────────────────────────────

  async listStudentGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const goals = await professionalService.listGoalsForStudent(req.user!.uid, req.params.linkId);
      res.json({ data: goals });
    } catch (err) { next(err); }
  },

  async listStudentEvaluations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const evals = await professionalService.listEvaluationsForStudent(req.user!.uid, req.params.linkId);
      res.json({ data: evals });
    } catch (err) { next(err); }
  },

  async listStudentConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const convs = await professionalService.listConversationsForStudent(req.user!.uid, req.params.linkId);
      res.json({ data: convs });
    } catch (err) { next(err); }
  },

  async getStudentConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conv = await professionalService.getConversationForStudent(req.user!.uid, req.params.conversationId);
      res.json({ data: conv });
    } catch (err) { next(err); }
  },

  async addStudentMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const senderName = (user as any).displayName ?? user.email ?? 'Aluno';
      const message = await professionalService.addMessageForStudent(
        user.uid,
        req.params.conversationId,
        req.body.content as string,
        senderName,
      );
      res.status(201).json({ data: message });
    } catch (err) { next(err); }
  },

  async markStudentConversationRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await professionalService.markConversationReadForStudent(req.user!.uid, req.params.conversationId);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ─── Students ──────────────────────────────────────────────────────────────

  async listStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const students = await professionalService.listStudentsWithCollaborations(
        req.query.professionalId as string || req.user!.uid
      );
      res.json(students);
    } catch (err) { next(err); }
  },

  async getStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { link, scopes, role } = await professionalService.resolveStudentAccess(req.user!.uid, req.params.linkId);
      const user = await prisma.user.findUnique({
        where: { id: link.studentUserId as string },
        select: { displayName: true, photoURL: true },
      });
      res.json({ ...link, studentDisplayName: user?.displayName ?? null, studentPhotoURL: user?.photoURL ?? null, role, scopes });
    } catch (err) { next(err); }
  },

  async renewStudentPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await professionalService.updateStudentLink(
        req.user!.uid, req.params.linkId, { planRenewedAt: new Date() }
      );
      res.json(student);
    } catch (err) { next(err); }
  },

  async getStudentConsistency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Allow both owners and active collaborators to view consistency
      await professionalService.resolveStudentAccess(req.user!.uid, req.params.linkId);
      const data = await professionalService.getStudentConsistency(req.user!.uid, req.params.linkId);
      res.json(data);
    } catch (err) { next(err); }
  },

  async updateStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await professionalService.updateStudentLink(req.user!.uid, req.params.linkId, req.body);
      res.json(student);
    } catch (err) { next(err); }
  },

  async unlinkStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await professionalService.unlinkStudent(req.user!.uid, req.params.linkId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async deleteStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await professionalService.deleteStudent(req.user!.uid, req.params.linkId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async addTagToStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await professionalService.addTagToStudent(req.user!.uid, req.params.linkId, req.body.tagId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async removeTagFromStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await professionalService.removeTagFromStudent(req.user!.uid, req.params.linkId, req.params.tagId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  // ─── Invitations ───────────────────────────────────────────────────────────

  async listInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invitations = await professionalService.listPendingInvitations(
        req.query.professionalId as string || req.user!.uid
      );
      res.json(invitations);
    } catch (err) { next(err); }
  },

  async createInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getCurrentUser(req.user!.uid);
      const invitation = await professionalService.createInvitation(
        req.user!.uid,
        user.displayName ?? 'Profissional',
        user.email ?? '',
        req.body
      );
      res.status(201).json(invitation);
    } catch (err) { next(err); }
  },

  async getInvitationPreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const preview = await professionalService.getInvitationPreview(req.params.code);
      res.json({ data: preview });
    } catch (err) { next(err); }
  },

  async acceptInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const link = await professionalService.acceptInvitation(
        req.params.code,
        req.user!.uid,
        req.body.contractedTypes,
      );
      res.json(link);
    } catch (err) { next(err); }
  },

  async rejectInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await professionalService.rejectInvitation(req.params.invitationId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  // ─── Notes ─────────────────────────────────────────────────────────────────

  async listNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const professionalId = req.query.professionalId as string || req.user!.uid;
      const notes = await professionalService.listNotes(professionalId, req.query.studentLinkId as string);
      res.json(notes);
    } catch (err) { next(err); }
  },

  async createNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const note = await professionalService.createNote(req.user!.uid, req.body);
      res.status(201).json(note);
    } catch (err) { next(err); }
  },

  async updateNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const note = await professionalService.updateNote(req.user!.uid, req.params.noteId, req.body);
      res.json(note);
    } catch (err) { next(err); }
  },

  async deleteNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await professionalService.deleteNote(req.user!.uid, req.params.noteId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  // ─── Goals ─────────────────────────────────────────────────────────────────

  async listGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const professionalId = req.query.professionalId as string || req.user!.uid;
      const goals = await professionalService.listGoals(professionalId, req.query.studentLinkId as string);
      res.json(goals);
    } catch (err) { next(err); }
  },

  async createGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const goal = await professionalService.createGoal(req.user!.uid, req.body);
      res.status(201).json(goal);
    } catch (err) { next(err); }
  },

  async updateGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const goal = await professionalService.updateGoal(req.user!.uid, req.params.goalId, req.body);
      res.json(goal);
    } catch (err) { next(err); }
  },

  async deleteGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await professionalService.deleteGoal(req.user!.uid, req.params.goalId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  // ─── Evaluations ───────────────────────────────────────────────────────────

  async listEvaluations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const professionalId = req.query.professionalId as string || req.user!.uid;
      const evals = await professionalService.listEvaluations(professionalId, req.query.studentLinkId as string);
      res.json(evals);
    } catch (err) { next(err); }
  },

  async createEvaluation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const evaluation = await professionalService.createEvaluation(req.user!.uid, req.body);
      res.status(201).json(evaluation);
    } catch (err) { next(err); }
  },

  async updateEvaluation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const evaluation = await professionalService.updateEvaluation(req.user!.uid, req.params.evaluationId, req.body);
      res.json(evaluation);
    } catch (err) { next(err); }
  },

  async deleteEvaluation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await professionalService.deleteEvaluation(req.user!.uid, req.params.evaluationId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  // ─── Student data (plan-gated) ─────────────────────────────────────────────

  // Retorna todas as sessões enriquecidas para analytics (sem limite)
  async getStudentWorkoutAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { link } = await professionalService.resolveStudentAccess(req.user!.uid, req.params.linkId);
      const uid = link.studentUserId;

      const [rawSessions, allDefs] = await Promise.all([
        prisma.workoutSession.findMany({
          where: { userId: uid },
          orderBy: { date: 'asc' },
        }),
        prisma.exerciseDefinition.findMany({
          select: { id: true, name: true, primaryMuscleGroup: true, exerciseType: true, cardioSubtype: true },
        }),
      ]);

      const idMap = new Map(allDefs.map((d) => [d.id, d]));
      const nameMap = new Map(allDefs.map((d) => [d.name, d]));

      function stripEmoji(s: string) {
        return s.replace(/^[\p{Emoji}\p{Symbol}\s]+/u, '').trim();
      }
      function findDef(exId?: string, exName?: string) {
        if (exId) { const d = idMap.get(exId); if (d) return d; }
        if (!exName) return null;
        const d = nameMap.get(exName); if (d) return d;
        const stripped = stripEmoji(exName);
        const byStripped = nameMap.get(stripped); if (byStripped) return byStripped;
        for (const [defName, def] of nameMap) {
          if (defName.startsWith(exName) || exName.startsWith(defName)) return def;
        }
        return null;
      }

      const sessions = rawSessions.map((s) => ({
        ...s,
        exercises: ((s.exercises as Array<Record<string, unknown>>) ?? []).map((ex) => {
          const def = findDef(ex['exerciseDefinitionId'] as string, ex['exerciseName'] as string);
          if (!def) return ex;
          return {
            ...ex,
            muscleGroup: ex['muscleGroup'] ?? def.primaryMuscleGroup ?? null,
            exerciseType: def.exerciseType ?? ex['exerciseType'] ?? 'forca',
            cardioSubtype: def.cardioSubtype ?? ex['cardioSubtype'] ?? null,
          };
        }),
      }));

      res.json({ sessions });
    } catch (err) { next(err); }
  },

  async getStudentWorkouts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { link } = await professionalService.resolveStudentAccess(req.user!.uid, req.params.linkId);
      const uid = link.studentUserId;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

      const [workoutDays, recentSessions, totalSessions, last30Sessions] = await Promise.all([
        // Plano de treino com exercícios
        prisma.workoutDay.findMany({
          where: { userId: uid },
          orderBy: [{ dayOfWeek: 'asc' }, { createdAt: 'asc' }],
        }),
        // Últimas 15 sessões
        prisma.workoutSession.findMany({
          where: { userId: uid },
          orderBy: { createdAt: 'desc' },
          take: 15,
        }),
        // Total de sessões
        prisma.workoutSession.count({ where: { userId: uid } }),
        // Sessões nos últimos 30 dias
        prisma.workoutSession.findMany({
          where: { userId: uid, date: { gte: thirtyDaysAgoStr } },
          select: { duration: true },
        }),
      ]);

      const avgDuration = last30Sessions.length > 0
        ? Math.round(
            last30Sessions.reduce((sum, s) => sum + (s.duration ?? 0), 0) / last30Sessions.length
          )
        : 0;

      // Agrupa grupos musculares mais treinados do plano
      const muscleCount: Record<string, number> = {};
      for (const day of workoutDays) {
        const exercises = (day.exercises as Array<{ muscleGroup?: string }>) ?? [];
        for (const ex of exercises) {
          if (ex.muscleGroup) {
            muscleCount[ex.muscleGroup] = (muscleCount[ex.muscleGroup] ?? 0) + 1;
          }
        }
      }
      const topMuscleGroups = Object.entries(muscleCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name);

      res.json({
        workoutDays,
        recentSessions,
        stats: {
          totalSessions,
          last30Days: last30Sessions.length,
          avgDurationMinutes: avgDuration,
          topMuscleGroups,
        },
      });
    } catch (err) { next(err); }
  },

  async getStudentNutrition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { link } = await professionalService.resolveStudentAccess(req.user!.uid, req.params.linkId);
      const uid = link.studentUserId;

      const today = new Date().toISOString().slice(0, 10);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

      const [goals, todayEntries, recentEntries, waterEntries, weightEntries] = await Promise.all([
        prisma.nutritionGoals.findUnique({ where: { userId: uid } }),
        // Entradas de hoje
        prisma.foodEntry.findMany({
          where: { userId: uid, date: today, status: 'consumed' },
          orderBy: { meal: 'asc' },
        }),
        // Últimos 7 dias
        prisma.foodEntry.findMany({
          where: { userId: uid, date: { gte: sevenDaysAgoStr }, status: 'consumed' },
          orderBy: [{ date: 'desc' }, { meal: 'asc' }],
        }),
        // Água hoje
        prisma.waterEntry.findMany({
          where: { userId: uid, date: today, status: 'consumed' },
        }),
        // Peso últimos 30 dias
        prisma.weightEntry.findMany({
          where: { userId: uid },
          orderBy: { date: 'asc' },
          take: 30,
        }),
      ]);

      // Progresso de hoje
      const todayProgress = todayEntries.reduce(
        (acc, e) => ({
          calories: acc.calories + (e.calories ?? 0),
          protein:  acc.protein  + (e.protein  ?? 0),
          carbs:    acc.carbs    + (e.carbs     ?? 0),
          fat:      acc.fat      + (e.fat       ?? 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      const todayWater = waterEntries.reduce((sum, w) => sum + (w.amount ?? 0), 0);

      // Agrupa por data para os últimos 7 dias
      const byDate: Record<string, { date: string; calories: number; protein: number; carbs: number; fat: number; entries: typeof recentEntries }> = {};
      for (const entry of recentEntries) {
        if (!byDate[entry.date]) {
          byDate[entry.date] = { date: entry.date, calories: 0, protein: 0, carbs: 0, fat: 0, entries: [] };
        }
        byDate[entry.date].calories += entry.calories ?? 0;
        byDate[entry.date].protein  += entry.protein  ?? 0;
        byDate[entry.date].carbs    += entry.carbs     ?? 0;
        byDate[entry.date].fat      += entry.fat       ?? 0;
        byDate[entry.date].entries.push(entry);
      }
      const recentDays = Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));

      res.json({
        goals: goals ?? { calories: 2000, protein: 150, carbs: 250, fat: 65, water: 2500 },
        todayProgress: { ...todayProgress, water: todayWater },
        todayEntries,
        recentDays,
        weightEntries,
      });
    } catch (err) { next(err); }
  },

  async getStudentGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { link } = await professionalService.resolveStudentAccess(req.user!.uid, req.params.linkId);
      const goals = await professionalService.listGoals(req.user!.uid, link.id);
      res.json(goals);
    } catch (err) { next(err); }
  },

  // ─── Workout builder (professional creates plan for student) ───────────────

  async createStudentWorkoutDay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { link } = await professionalService.resolveStudentAccess(req.user!.uid, req.params.linkId);
      // Normalize exercises: rename `name` → `exerciseName` and assign a UUID `id`
      // so the shape matches what `addPlannedExercise` stores (mobile app reads `exerciseName`)
      const exercises = (req.body.exercises ?? []).map((ex: Record<string, unknown>) => {
        const { name, exerciseName, ...rest } = ex as { name?: string; exerciseName?: string; [k: string]: unknown };
        return {
          ...rest,
          id: crypto.randomUUID(),
          exerciseName: exerciseName ?? name ?? '',
        };
      });
      const day = await workoutsService.createWorkoutDay(
        link.studentUserId as string,
        {
          name: req.body.name,
          dayType: req.body.dayType ?? 'musculacao',
          dayOfWeek: req.body.dayOfWeek ?? null,
          notes: req.body.notes ?? null,
          exercises,
        },
        req.user!.uid,  // createdByProfessionalId
      );
      res.status(201).json(day);
    } catch (err) { next(err); }
  },

  async updateStudentWorkoutDay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { link } = await professionalService.resolveStudentAccess(req.user!.uid, req.params.linkId);
      const day = await workoutsService.updateWorkoutDay(link.studentUserId as string, req.params.dayId, req.body);
      res.json(day);
    } catch (err) { next(err); }
  },

  async deleteStudentWorkoutDay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { link } = await professionalService.resolveStudentAccess(req.user!.uid, req.params.linkId);
      await workoutsService.deleteWorkoutDay(link.studentUserId as string, req.params.dayId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async addStudentWorkoutExercise(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { link } = await professionalService.resolveStudentAccess(req.user!.uid, req.params.linkId);
      const day = await workoutsService.addPlannedExercise(link.studentUserId as string, req.params.dayId, req.body);
      res.status(201).json(day);
    } catch (err) { next(err); }
  },

  async deleteStudentWorkoutExercise(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { link } = await professionalService.resolveStudentAccess(req.user!.uid, req.params.linkId);
      await workoutsService.deletePlannedExercise(link.studentUserId as string, req.params.dayId, req.params.exId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  // ─── Diet builder (professional creates plan for student) ──────────────────

  async getStudentDietPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { link } = await professionalService.resolveStudentAccess(req.user!.uid, req.params.linkId);
      const items = await nutritionService.listDietPlan(link.studentUserId as string);
      res.json(items);
    } catch (err) { next(err); }
  },

  async createStudentDietPlanItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { link } = await professionalService.resolveStudentAccess(req.user!.uid, req.params.linkId);
      const item = await nutritionService.createDietPlanItem(link.studentUserId as string, req.body);
      res.status(201).json(item);
    } catch (err) { next(err); }
  },

  async deleteStudentDietPlanItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { link } = await professionalService.resolveStudentAccess(req.user!.uid, req.params.linkId);
      await nutritionService.deleteDietPlanItem(link.studentUserId as string, req.params.itemId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async updateStudentNutritionGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { link } = await professionalService.resolveStudentAccess(req.user!.uid, req.params.linkId);
      const goals = await nutritionService.updateDailyGoals(link.studentUserId as string, req.body);
      res.json(goals);
    } catch (err) { next(err); }
  },

  // ─── Resource search (exercise + food pickers) ──────────────────────────────

  async searchExercises(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const limit  = parseInt(req.query.limit as string ?? '20', 10);
      const exercises = await prisma.exerciseDefinition.findMany({
        where: search
          ? { name: { contains: search, mode: 'insensitive' } }
          : undefined,
        orderBy: { name: 'asc' },
        take: Math.min(limit, 50),
      });
      res.json(exercises);
    } catch (err) { next(err); }
  },

  async searchFoods(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, search } = req.query as { category?: string; search?: string };
      const foods = await nutritionService.listPredefinedFoods({ category, search });
      res.json(foods);
    } catch (err) { next(err); }
  },

  // ─── Stats ─────────────────────────────────────────────────────────────────

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const professionalId = req.query.professionalId as string || req.user!.uid;
      const stats = await professionalService.getStats(professionalId);
      res.json(stats);
    } catch (err) { next(err); }
  },

  // ─── Conversations ─────────────────────────────────────────────────────────

  async listConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const professionalId = req.query.professionalId as string || req.user!.uid;
      const includeArchived = req.query.includeArchived === 'true';
      const convs = await professionalService.listConversations(
        professionalId,
        req.query.studentLinkId as string,
        includeArchived
      );
      res.json(convs);
    } catch (err) { next(err); }
  },

  async getConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conv = await professionalService.getConversation(req.params.conversationId);
      res.json(conv);
    } catch (err) { next(err); }
  },

  async createConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conv = await professionalService.createConversation(req.user!.uid, req.body);
      res.status(201).json(conv);
    } catch (err) { next(err); }
  },

  async addMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const msg = await professionalService.addMessage(req.params.conversationId, req.body);
      res.status(201).json(msg);
    } catch (err) { next(err); }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await professionalService.markConversationAsRead(
        req.params.conversationId,
        req.body.userId,
        req.body.userType
      );
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async archiveConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await professionalService.archiveConversation(req.params.conversationId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async unarchiveConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await professionalService.unarchiveConversation(req.params.conversationId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async deleteConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await professionalService.deleteConversation(req.params.conversationId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  // ─── Collaborations ────────────────────────────────────────────────────────

  async listCollaborators(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await professionalService.listCollaborators(req.user!.uid, req.params.linkId);
      res.json(data);
    } catch (err) { next(err); }
  },

  async inviteCollaborator(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, scopes, message } = req.body;
      const data = await professionalService.inviteCollaborator(
        req.user!.uid, req.params.linkId, email, scopes, message
      );
      res.status(201).json(data);
    } catch (err) { next(err); }
  },

  async removeCollaborator(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await professionalService.removeCollaborator(req.user!.uid, req.params.linkId, req.params.collabId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async listReceivedCollaborations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await professionalService.listReceivedCollaborations(req.user!.uid);
      res.json(data);
    } catch (err) { next(err); }
  },

  async respondToCollaboration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { action } = req.body; // "accept" | "reject"
      await professionalService.respondToCollaboration(req.user!.uid, req.params.collabId, action);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async getBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await professionalService.getBrand(req.user!.uid);
      res.json({ data });
    } catch (err) { next(err); }
  },

  async updateBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { brandColor, brandHighlightColor, brandSurfaceColor, brandOnSurfaceColor, brandAppBarColor, brandNavBarColor, brandCardColor, brandLogoUrl, brandName } = req.body;
      const data = await professionalService.updateBrand(req.user!.uid, { brandColor, brandHighlightColor, brandSurfaceColor, brandOnSurfaceColor, brandAppBarColor, brandNavBarColor, brandCardColor, brandLogoUrl, brandName });
      res.json({ data });
    } catch (err) { next(err); }
  },

  async uploadLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) throw new AppError(400, 'Nenhum arquivo enviado');

      const logoUrl = `/uploads/logos/${req.file.filename}`;

      // Delete old logo if it was a locally hosted upload
      const profile = await prisma.professionalProfile.findUnique({
        where: { userId: req.user!.uid },
        select: { brandLogoUrl: true },
      });
      if (profile?.brandLogoUrl?.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '../../../uploads', profile.brandLogoUrl.replace('/uploads/', ''));
        fs.unlink(oldPath, () => { /* ignore errors — file may not exist */ });
      }

      await prisma.professionalProfile.update({
        where: { userId: req.user!.uid },
        data: { brandLogoUrl: logoUrl },
      });

      res.json({ data: { logoUrl } });
    } catch (err) { next(err); }
  },

  async listMyUpdates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await professionalService.listMyUpdates(req.user!.uid);
      res.json({ data });
    } catch (err) { next(err); }
  },

  async createUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { emoji, title, items } = req.body;
      if (!title || !Array.isArray(items) || items.length === 0)
        throw new AppError(400, 'title e items são obrigatórios');
      const data = await professionalService.createUpdate(req.user!.uid, { emoji, title, items });
      res.status(201).json({ data });
    } catch (err) { next(err); }
  },

  async deleteUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await professionalService.deleteUpdate(req.user!.uid, req.params.updateId);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async getStudentProfessionalUpdates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await professionalService.getStudentProfessionalUpdates(req.user!.uid);
      res.json({ data });
    } catch (err) { next(err); }
  },
};
