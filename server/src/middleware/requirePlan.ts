import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export type PlanModule = 'workouts' | 'nutrition';

const PLAN_MODULES: Record<string, PlanModule[]> = {
  fitness:   ['workouts'],
  nutrition: ['nutrition'],
  full:      ['workouts', 'nutrition'],
};

/**
 * Professional types that grant access to each module.
 * Empty contractedTypes = legacy link → all modules allowed.
 * personal_trainer / coach / physiotherapist / other → workouts
 * nutritionist → nutrition
 */
const MODULE_TYPES: Record<PlanModule, string[]> = {
  workouts:  ['personal_trainer', 'coach', 'physiotherapist', 'other'],
  nutrition: ['nutritionist'],
};

/**
 * Middleware de fábrica que garante que o profissional autenticado:
 *  1. possui o módulo exigido no seu plano, E
 *  2. foi contratado pelo aluno para a especialidade que cobre esse módulo.
 *
 * @example router.get('/students/:id/workouts', requirePlan('workouts'), controller.fn)
 */
export function requirePlan(module: PlanModule) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const linkId = req.params.linkId;

      // ── Collaborator bypass ─────────────────────────────────────────────────
      // Active collaborators with the required scope bypass plan + contractedTypes.
      if (linkId) {
        const collab = await prisma.professionalCollaboration.findFirst({
          where: {
            studentLinkId: linkId,
            collaboratorId: req.user!.uid,
            status: 'active',
            scopes: { has: module },
          },
        });
        if (collab) { next(); return; }
      }

      // ── Plan check ──────────────────────────────────────────────────────────
      const profile = await prisma.professionalProfile.findUnique({
        where: { userId: req.user!.uid },
        select: { plan: true },
      });

      // Sem perfil → trata como plano 'full' (legado / desenvolvimento)
      const planKey = profile?.plan ?? 'full';
      const allowed = PLAN_MODULES[planKey] ?? [];
      if (!allowed.includes(module)) {
        res.status(403).json({
          message: 'Seu plano não inclui este módulo',
          code: 'PLAN_REQUIRED',
          requiredModule: module,
          currentPlan: profile?.plan ?? 'full',
        });
        return;
      }

      // ── contractedTypes check ───────────────────────────────────────────────
      // Only applies when a specific student link is in scope.
      if (linkId) {
        const link = await prisma.studentLink.findFirst({
          where: { id: linkId, professionalId: req.user!.uid },
          select: { contractedTypes: true },
        });

        // link must exist (authorizeUser already checked this, but be safe)
        if (link) {
          const contracted = link.contractedTypes as string[];
          // Empty = legacy link created before contractedTypes existed → allow all
          if (contracted.length > 0) {
            const allowedTypes = MODULE_TYPES[module];
            const hasType = contracted.some((t) => allowedTypes.includes(t));
            if (!hasType) {
              res.status(403).json({
                message: 'Você não foi contratado para este serviço pelo aluno',
                code: 'TYPE_NOT_CONTRACTED',
                requiredModule: module,
                contractedTypes: contracted,
              });
              return;
            }
          }
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
