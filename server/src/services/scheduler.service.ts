import cron from 'node-cron';
import prisma from '../config/database';
import { sseService } from './sse.service';

// ─── Constants ────────────────────────────────────────────────────────────────

const INACTIVITY_DAYS = 5;           // alert after this many days without a workout
const PLAN_ALERT_START = 25;         // start alerting when plan is this many days old
const PLAN_EXPIRE_DAYS = 30;         // plan expires after this many days
const DEDUP_HOURS = 20;              // don't repeat the same notification within this window

const NUTRITION_NO_LOG_DAYS = 3;     // alert after this many days without any food entry
const CALORIES_STREAK_DAYS = 3;      // consecutive days to trigger low/high calorie alert
const CALORIES_LOW_PCT = 0.70;       // below this fraction of goal = low
const CALORIES_HIGH_PCT = 1.15;      // above this fraction of goal = high
const PROTEIN_WINDOW_DAYS = 7;       // rolling window for protein check
const PROTEIN_MIN_LOGGED_DAYS = 3;   // need at least this many logged days in window
const PROTEIN_LOW_PCT = 0.70;        // below this fraction of protein goal = low

// ─── Deduplication helper ─────────────────────────────────────────────────────

async function alreadySentRecently(
  userId: string,
  type: string,
  studentId: string
): Promise<boolean> {
  const since = new Date(Date.now() - DEDUP_HOURS * 3600 * 1000);
  const existing = await prisma.notification.findFirst({
    where: { userId, type, studentId, createdAt: { gte: since } },
  });
  return !!existing;
}

// ─── Notification sender ──────────────────────────────────────────────────────

async function pushNotification(
  userId: string,
  studentId: string,
  type: string,
  title: string,
  message: string,
  actionUrl: string
) {
  if (await alreadySentRecently(userId, type, studentId)) return;

  const notification = await prisma.notification.create({
    data: { userId, type, title, message, actionUrl, studentId },
  });

  sseService.send(userId, 'notification', notification);
}

// ─── Nutrition checks ─────────────────────────────────────────────────────────

function dateStrOffset(base: Date, offsetDays: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}

async function checkNutrition(
  professionalId: string,
  studentId: string,
  studentName: string,
  actionUrl: string,
  today: Date
): Promise<number> {
  let count = 0;

  // Fetch nutrition goals (needed for calorie/protein checks)
  const goals = await prisma.nutritionGoals.findUnique({ where: { userId: studentId } });

  // ── 3. No food log for N days ──────────────────────────────────────────────
  const noLogThreshold = dateStrOffset(today, NUTRITION_NO_LOG_DAYS);
  const lastEntry = await prisma.foodEntry.findFirst({
    where: { userId: studentId, status: 'consumed' },
    orderBy: { date: 'desc' },
    select: { date: true },
  });

  const daysSinceLog = lastEntry
    ? Math.floor((today.getTime() - new Date(lastEntry.date).getTime()) / 86_400_000)
    : null;

  if (!lastEntry || lastEntry.date <= noLogThreshold) {
    await pushNotification(
      professionalId, studentId, 'nutrition_no_log',
      `${studentName} não registra refeições`,
      daysSinceLog !== null
        ? `${studentName} não registra nenhuma refeição há ${daysSinceLog} dia${daysSinceLog !== 1 ? 's' : ''}.`
        : `${studentName} nunca registrou refeições.`,
      actionUrl
    );
    count++;
  }

  // Remaining checks require goals to be set
  if (!goals) return count;

  // ── 4 & 5. Consecutive days with calories below/above target ──────────────
  const streakDates = Array.from({ length: CALORIES_STREAK_DAYS }, (_, i) =>
    dateStrOffset(today, i + 1)   // yesterday, 2 days ago, 3 days ago
  );

  // Aggregate calories per day for the streak window
  const caloriesByDay = await prisma.foodEntry.groupBy({
    by: ['date'],
    where: {
      userId: studentId,
      status: 'consumed',
      date: { in: streakDates },
    },
    _sum: { calories: true },
  });

  // Only act if student actually logged ALL days in the streak (no gaps)
  if (caloriesByDay.length === CALORIES_STREAK_DAYS) {
    const allLow = caloriesByDay.every(
      (d) => (d._sum.calories ?? 0) < goals.calories * CALORIES_LOW_PCT
    );
    const allHigh = caloriesByDay.every(
      (d) => (d._sum.calories ?? 0) > goals.calories * CALORIES_HIGH_PCT
    );

    if (allLow) {
      await pushNotification(
        professionalId, studentId, 'nutrition_calories_low',
        `${studentName} abaixo da meta calórica`,
        `${studentName} ficou abaixo de ${Math.round(CALORIES_LOW_PCT * 100)}% da meta calórica por ${CALORIES_STREAK_DAYS} dias seguidos.`,
        actionUrl
      );
      count++;
    }

    if (allHigh) {
      await pushNotification(
        professionalId, studentId, 'nutrition_calories_high',
        `${studentName} acima da meta calórica`,
        `${studentName} ficou acima de ${Math.round(CALORIES_HIGH_PCT * 100)}% da meta calórica por ${CALORIES_STREAK_DAYS} dias seguidos.`,
        actionUrl
      );
      count++;
    }
  }

  // ── 6. Low protein — rolling 7-day average ────────────────────────────────
  if (goals.protein && goals.protein > 0) {
    const proteinDates = Array.from({ length: PROTEIN_WINDOW_DAYS }, (_, i) =>
      dateStrOffset(today, i + 1)
    );

    const proteinByDay = await prisma.foodEntry.groupBy({
      by: ['date'],
      where: {
        userId: studentId,
        status: 'consumed',
        date: { in: proteinDates },
      },
      _sum: { protein: true },
    });

    if (proteinByDay.length >= PROTEIN_MIN_LOGGED_DAYS) {
      const avgProtein =
        proteinByDay.reduce((sum, d) => sum + (d._sum.protein ?? 0), 0) /
        proteinByDay.length;

      if (avgProtein < goals.protein * PROTEIN_LOW_PCT) {
        const avgRounded = Math.round(avgProtein);
        await pushNotification(
          professionalId, studentId, 'nutrition_protein_low',
          `${studentName} com proteína baixa`,
          `Média de ${avgRounded}g de proteína nos últimos ${proteinByDay.length} dias registrados (meta: ${goals.protein}g).`,
          actionUrl
        );
        count++;
      }
    }
  }

  return count;
}

// ─── Main check ───────────────────────────────────────────────────────────────

async function runConsistencyChecks() {
  console.log('[Scheduler] Iniciando verificação de consistência dos alunos...');

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Date threshold for inactivity (5 days ago)
  const inactivityThreshold = new Date(today);
  inactivityThreshold.setDate(today.getDate() - INACTIVITY_DAYS);
  const inactivityStr = inactivityThreshold.toISOString().slice(0, 10);

  // Fetch all active student links with the professional's userId
  const links = await prisma.studentLink.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      professionalId: true,
      studentUserId: true,
      studentEmail: true,
      linkedAt: true,
      planRenewedAt: true,
    },
  });

  // Enrich with student display names in one query
  const studentIds = links.map((l) => l.studentUserId);
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, displayName: true },
  });
  const studentMap = Object.fromEntries(students.map((s) => [s.id, s.displayName]));

  let inactiveAlerts = 0;
  let planAlerts = 0;
  let nutritionAlerts = 0;

  for (const link of links) {
    const studentName = studentMap[link.studentUserId] ?? link.studentEmail.split('@')[0];
    const actionUrl = `/dashboard/clients/${link.id}`;

    // ── 1. Inactivity check ──────────────────────────────────────────────────
    const lastSession = await prisma.workoutSession.findFirst({
      where: { userId: link.studentUserId },
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    const hasNoRecentWorkout = !lastSession || lastSession.date <= inactivityStr;

    if (hasNoRecentWorkout) {
      const daysSinceLast = lastSession
        ? Math.floor((today.getTime() - new Date(lastSession.date).getTime()) / 86_400_000)
        : null;
      await pushNotification(
        link.professionalId, link.studentUserId, 'student_inactive',
        `${studentName} está inativo`,
        `${studentName} não treina há ${daysSinceLast ?? 'vários'} dia${daysSinceLast !== 1 ? 's' : ''}. Último treino há ${daysSinceLast ?? 'vários'} dia${daysSinceLast !== 1 ? 's' : ''}.`,
        actionUrl
      );
      inactiveAlerts++;
    }

    // ── 2. Plan expiry check ─────────────────────────────────────────────────
    const planStart = link.planRenewedAt ?? link.linkedAt;
    const daysSinceRenewal = Math.floor(
      (today.getTime() - new Date(planStart).getTime()) / 86_400_000
    );
    const daysLeft = PLAN_EXPIRE_DAYS - daysSinceRenewal;

    if (daysSinceRenewal >= PLAN_ALERT_START && daysSinceRenewal < PLAN_EXPIRE_DAYS) {
      await pushNotification(
        link.professionalId, link.studentUserId, 'plan_expiring',
        `Plano de ${studentName} expira em breve`,
        `O plano de ${studentName} vence em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}. Renove para manter o acesso.`,
        actionUrl
      );
      planAlerts++;
    }

    // ── 3–6. Nutrition checks ────────────────────────────────────────────────
    nutritionAlerts += await checkNutrition(link.professionalId, link.studentUserId, studentName, actionUrl, today);
  }

  console.log(
    `[Scheduler] Concluído — ${inactiveAlerts} inatividade, ${planAlerts} planos, ${nutritionAlerts} nutrição.`
  );
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export function startScheduler() {
  // Run every day at 08:00
  cron.schedule('0 8 * * *', runConsistencyChecks, { timezone: 'America/Sao_Paulo' });

  // Also run once on startup (after a 5-second delay to let DB connect)
  setTimeout(runConsistencyChecks, 5_000);

  console.log('[Scheduler] Agendador iniciado — verificação diária às 08:00 (America/Sao_Paulo)');
}
