/**
 * Hook para calcular métricas e alertas de alunos
 * Analisa dados de treino, nutrição e medidas para gerar insights
 */

import { useMemo } from 'react';
import type { StudentLink, StudentAlert, StudentMetrics } from '../types/professional';
import { db as indexedDB } from '../db/database';

/**
 * Calcula a diferença em dias entre duas datas
 */
function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Gera alertas para um aluno baseado em suas métricas
 */
export function generateStudentAlerts(
  studentLink: StudentLink,
  metrics: StudentMetrics
): StudentAlert[] {
  const alerts: StudentAlert[] = [];
  const now = new Date();

  // 1. Alerta de treino próximo de expirar (30 dias)
  if (metrics.currentWorkout.needsRenewal) {
    alerts.push({
      id: `${studentLink.id}-workout-expiring`,
      studentId: studentLink.studentUserId,
      studentName: studentLink.studentName || studentLink.studentEmail || 'Aluno',
      type: 'workout_expiring',
      severity: 'warning',
      title: 'Treino próximo de renovação',
      description: `Treino criado há ${metrics.currentWorkout.daysSinceCreation} dias. Considere renovar o programa.`,
      actionLabel: 'Renovar Treino',
      createdAt: now.toISOString(),
      metadata: {
        daysSinceWorkoutCreated: metrics.currentWorkout.daysSinceCreation,
      },
    });
  }

  // 2. Alerta de aluno inativo (7+ dias sem treinar)
  if (metrics.adherence.daysSinceLastWorkout >= 7) {
    const severity = metrics.adherence.daysSinceLastWorkout >= 14 ? 'urgent' : 'warning';
    alerts.push({
      id: `${studentLink.id}-inactive`,
      studentId: studentLink.studentUserId,
      studentName: studentLink.studentName || studentLink.studentEmail || 'Aluno',
      type: 'student_inactive',
      severity,
      title: 'Aluno inativo',
      description: `Sem treinar há ${metrics.adherence.daysSinceLastWorkout} dias. Entre em contato para motivar!`,
      actionLabel: 'Enviar Mensagem',
      createdAt: now.toISOString(),
      metadata: {
        daysSinceLastWorkout: metrics.adherence.daysSinceLastWorkout,
      },
    });
  }

  // 3. Alerta de medidas atrasadas (30+ dias)
  if (metrics.bodyComposition && metrics.bodyComposition.daysSinceLastMeasurement >= 30) {
    alerts.push({
      id: `${studentLink.id}-measurements`,
      studentId: studentLink.studentUserId,
      studentName: studentLink.studentName || studentLink.studentEmail || 'Aluno',
      type: 'measurements_overdue',
      severity: 'info',
      title: 'Medidas corporais atrasadas',
      description: `Última medição há ${metrics.bodyComposition.daysSinceLastMeasurement} dias. Agende uma avaliação.`,
      actionLabel: 'Agendar Avaliação',
      createdAt: now.toISOString(),
      metadata: {
        daysSinceMeasurement: metrics.bodyComposition.daysSinceLastMeasurement,
      },
    });
  }

  // 4. Alerta de nutrição inativa
  if (metrics.nutrition && metrics.nutrition.daysSinceLastLog >= 7) {
    alerts.push({
      id: `${studentLink.id}-nutrition`,
      studentId: studentLink.studentUserId,
      studentName: studentLink.studentName || studentLink.studentEmail || 'Aluno',
      type: 'nutrition_inactive',
      severity: 'info',
      title: 'Registro nutricional parado',
      description: `Sem registrar refeições há ${metrics.nutrition.daysSinceLastLog} dias.`,
      actionLabel: 'Ver Nutrição',
      createdAt: now.toISOString(),
      metadata: {
        daysSinceLastLog: metrics.nutrition.daysSinceLastLog,
      },
    });
  }

  // 5. Alerta de volume excessivo (treina todos os dias sem descanso)
  // Verifica se treinou 10+ dias consecutivos
  if (metrics.adherence.currentStreak >= 10) {
    alerts.push({
      id: `${studentLink.id}-excessive-volume`,
      studentId: studentLink.studentUserId,
      studentName: studentLink.studentName || studentLink.studentEmail || 'Aluno',
      type: 'excessive_volume',
      severity: 'warning',
      title: 'Possível overtraining',
      description: `Treinou ${metrics.adherence.currentStreak} dias consecutivos. Verifique se está descansando adequadamente.`,
      actionLabel: 'Ver Histórico',
      createdAt: now.toISOString(),
      metadata: {
        consecutiveDays: metrics.adherence.currentStreak,
      },
    });
  }

  return alerts;
}

/**
 * Hook para obter métricas e alertas de um aluno específico
 */
export async function calculateStudentMetrics(studentUserId: string): Promise<StudentMetrics | null> {
  try {
    // Buscar dados do aluno do IndexedDB
    // Nota: workoutDays não tem userId, então pegamos todos (para desenvolvimento)
    const workoutDays = await indexedDB.workoutDays.toArray();

    // workoutSessions também não tem userId no schema atual
    const workoutSessions = await indexedDB.workoutSessions.toArray();

    // bodyMeasurements tem userId
    const measurements = await indexedDB.bodyMeasurements
      .where('userId')
      .equals(studentUserId)
      .sortBy('date');

    // foodEntries não tem userId no schema atual
    const nutritionLogs = await indexedDB.foodEntries.toArray();

    const now = new Date();

    // Calcular métricas de adesão
    const sortedSessions = workoutSessions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const lastWorkoutDate = sortedSessions[0]?.date || null;
    const daysSinceLastWorkout = lastWorkoutDate
      ? daysBetween(new Date(lastWorkoutDate), now)
      : 999;

    // Calcular streak (dias consecutivos)
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const sessionDates = sortedSessions
      .map((s) => new Date(s.date).toISOString().split('T')[0])
      .reverse();

    const uniqueDates = [...new Set(sessionDates)];

    for (let i = 0; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);
      const prevDate = i > 0 ? new Date(uniqueDates[i - 1]) : null;

      if (!prevDate || daysBetween(prevDate, currentDate) === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }

      // Se é hoje ou ontem, conta como streak atual
      if (daysBetween(currentDate, now) <= 1) {
        currentStreak = tempStreak;
      }
    }

    // Calcular taxa de adesão semanal e mensal
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const sessionsThisWeek = workoutSessions.filter(
      (s) => new Date(s.date) >= oneWeekAgo
    ).length;

    const sessionsThisMonth = workoutSessions.filter(
      (s) => new Date(s.date) >= oneMonthAgo
    ).length;

    // Assumindo 3-5 treinos por semana como ideal
    const weeklyRate = Math.min((sessionsThisWeek / 4) * 100, 100);
    const monthlyRate = Math.min((sessionsThisMonth / 16) * 100, 100);

    // Calcular frequência
    const weeklyFrequency = sessionsThisWeek;
    const monthlyFrequency = sessionsThisMonth;

    // Dias preferidos (dia da semana que mais treina)
    const dayCount: { [key: string]: number } = {};
    workoutSessions.forEach((session) => {
      const dayName = new Date(session.date).toLocaleDateString('pt-BR', {
        weekday: 'long',
      });
      dayCount[dayName] = (dayCount[dayName] || 0) + 1;
    });

    const preferredDays = Object.entries(dayCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([day]) => day);

    // Buscar snapshots para calcular volume
    const snapshots = await indexedDB.dailySnapshots.toArray();

    // Calcular volume total
    const totalVolume = snapshots.reduce((sum, snap) => sum + (snap.totalVolume || 0), 0);

    // Comparar volume do último mês com o mês anterior
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const lastMonthVolume = snapshots
      .filter((s) => new Date(s.date) >= oneMonthAgo)
      .reduce((sum, snap) => sum + (snap.totalVolume || 0), 0);

    const previousMonthVolume = snapshots
      .filter((s) => new Date(s.date) >= twoMonthsAgo && new Date(s.date) < oneMonthAgo)
      .reduce((sum, snap) => sum + (snap.totalVolume || 0), 0);

    let volumeTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (lastMonthVolume > previousMonthVolume * 1.1) {
      volumeTrend = 'increasing';
    } else if (lastMonthVolume < previousMonthVolume * 0.9) {
      volumeTrend = 'decreasing';
    }

    // Calcular duração média de treino
    const totalDuration = workoutSessions.reduce(
      (sum, s) => sum + (s.duration || 0),
      0
    );
    const averageWorkoutDuration = workoutSessions.length > 0
      ? totalDuration / workoutSessions.length
      : 0;

    // Métricas de composição corporal
    let bodyComposition: StudentMetrics['bodyComposition'] | undefined;
    if (measurements.length > 0) {
      const latestMeasurement = measurements[measurements.length - 1];
      const lastMeasurementDate = latestMeasurement.date;
      const daysSinceLastMeasurement = daysBetween(
        new Date(lastMeasurementDate),
        now
      );

      // Medição de 30 dias atrás
      const measurement30DaysAgo = measurements.find((m) => {
        const diff = daysBetween(new Date(m.date), new Date(lastMeasurementDate));
        return diff >= 28 && diff <= 32;
      });

      // Medição de 90 dias atrás
      const measurement90DaysAgo = measurements.find((m) => {
        const diff = daysBetween(new Date(m.date), new Date(lastMeasurementDate));
        return diff >= 85 && diff <= 95;
      });

      bodyComposition = {
        currentWeight: latestMeasurement.weight,
        weightChange30Days: measurement30DaysAgo
          ? latestMeasurement.weight - measurement30DaysAgo.weight
          : 0,
        weightChange90Days: measurement90DaysAgo
          ? latestMeasurement.weight - measurement90DaysAgo.weight
          : 0,
        currentBodyFat: latestMeasurement.bodyFat,
        bodyFatChange30Days:
          measurement30DaysAgo && latestMeasurement.bodyFat && measurement30DaysAgo.bodyFat
            ? latestMeasurement.bodyFat - measurement30DaysAgo.bodyFat
            : undefined,
        lastMeasurementDate,
        daysSinceLastMeasurement,
      };
    }

    // Métricas nutricionais
    let nutrition: StudentMetrics['nutrition'] | undefined;
    if (nutritionLogs.length > 0) {
      const recentLogs = nutritionLogs.filter(
        (log) => new Date(log.date) >= oneWeekAgo
      );

      const totalCalories = recentLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
      const averageDailyCalories = recentLogs.length > 0
        ? totalCalories / recentLogs.length
        : 0;

      const sortedLogs = nutritionLogs.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const lastNutritionLogDate = sortedLogs[0]?.date || null;
      const daysSinceLastLog = lastNutritionLogDate
        ? daysBetween(new Date(lastNutritionLogDate), now)
        : 999;

      nutrition = {
        averageDailyCalories,
        adherenceToMealPlan: 0, // TODO: calcular com base em plano definido
        lastNutritionLogDate,
        daysSinceLastLog,
      };
    }

    // Status do treino atual
    const currentWorkout = workoutDays.length > 0 ? workoutDays[workoutDays.length - 1] : null;
    const workoutCreatedAt = currentWorkout?.createdAt || null;
    const daysSinceCreation = workoutCreatedAt
      ? daysBetween(new Date(workoutCreatedAt), now)
      : 0;
    const needsRenewal = daysSinceCreation >= 25; // Alerta a partir de 25 dias

    return {
      studentId: studentUserId,
      studentName: '', // Será preenchido pelo componente

      adherence: {
        weeklyRate,
        monthlyRate,
        currentStreak,
        longestStreak,
        lastWorkoutDate,
        daysSinceLastWorkout,
      },

      frequency: {
        weekly: weeklyFrequency,
        monthly: monthlyFrequency,
        preferredDays,
      },

      progress: {
        totalWorkoutsCompleted: workoutSessions.length,
        averageWorkoutDuration,
        totalVolume,
        volumeTrend,
      },

      bodyComposition,
      nutrition,

      currentWorkout: {
        createdAt: workoutCreatedAt,
        daysSinceCreation,
        needsRenewal,
      },
    };
  } catch (error) {
    console.error('Erro ao calcular métricas do aluno:', error);
    return null;
  }
}

/**
 * Hook React para usar métricas de múltiplos alunos
 */
export function useStudentMetrics(studentLinks: StudentLink[]) {
  return useMemo(() => {
    const metricsPromises = studentLinks.map(async (link) => {
      const metrics = await calculateStudentMetrics(link.studentUserId);
      if (!metrics) return null;

      // Preencher nome do aluno
      metrics.studentName = link.studentName || link.studentEmail || 'Aluno';

      // Gerar alertas
      const alerts = generateStudentAlerts(link, metrics);

      return { link, metrics, alerts };
    });

    return Promise.all(metricsPromises);
  }, [studentLinks]);
}
