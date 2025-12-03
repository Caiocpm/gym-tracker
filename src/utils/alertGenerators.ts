// src/utils/alertGenerators.ts
import type { StudentLink, StudentMetrics } from "../types/professional";

export function generateStudentAlerts(
  link: StudentLink,
  metrics: StudentMetrics
): StudentAlert[] {
  const alerts: StudentAlert[] = [];

  // Alerta: Aluno inativo
  if (metrics.adherence.daysSinceLastWorkout > 7) {
    alerts.push({
      id: `alert-${link.studentUserId}-inactive`,
      studentId: link.studentUserId,
      studentName: link.studentName || "Aluno",
      type: "student_inactive",
      severity:
        metrics.adherence.daysSinceLastWorkout > 14 ? "urgent" : "warning",
      title: "Aluno Inativo",
      description: `${link.studentName || "Aluno"} não treina há ${
        metrics.adherence.daysSinceLastWorkout
      } dias`,
      metadata: {
        daysSinceLastWorkout: metrics.adherence.daysSinceLastWorkout,
      },
      createdAt: new Date().toISOString(),
    });
  }

  // Alerta: Estagnação de performance
  if (
    metrics.progress.volumeTrend === "stable" &&
    metrics.progress.totalWorkoutsCompleted > 10
  ) {
    alerts.push({
      id: `alert-${link.studentUserId}-stagnation`,
      studentId: link.studentUserId,
      studentName: link.studentName || "Aluno",
      type: "performance_stagnation",
      severity: "warning",
      title: "Estagnação de Performance",
      description:
        "O aluno está com progresso estagnado. Considere revisar o treino.",
      createdAt: new Date().toISOString(),
    });
  }

  // Alerta: Adesão baixa
  if (metrics.adherence.monthlyRate < 50) {
    alerts.push({
      id: `alert-${link.studentUserId}-low-adherence`,
      studentId: link.studentUserId,
      studentName: link.studentName || "Aluno",
      type: "student_inactive",
      severity: "urgent",
      title: "Adesão Crítica",
      description: `Adesão do mês: ${metrics.adherence.monthlyRate.toFixed(
        1
      )}%. Muito baixa!`,
      metadata: {
        adherenceRate: metrics.adherence.monthlyRate,
      },
      createdAt: new Date().toISOString(),
    });
  }

  return alerts;
}

export interface StudentAlert {
  id: string;
  studentId: string;
  studentName: string;
  type: string;
  severity: "info" | "warning" | "urgent";
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
