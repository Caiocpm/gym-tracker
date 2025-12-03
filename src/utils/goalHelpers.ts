// src/utils/goalHelpers.ts
import type { StudentGoal } from "../types/professional"; // ✅ Caminho corrigido e usado 'import type'

/**
 * Calcula o progresso de uma meta em porcentagem.
 * @param startValue O valor inicial da meta.
 * @param targetValue O valor alvo da meta.
 * @param currentValue O valor atual da meta.
 * @returns O progresso em porcentagem (0-100).
 */
export function calculateGoalProgress(
  startValue: number,
  targetValue: number,
  currentValue: number
): number {
  if (startValue === targetValue) {
    return currentValue >= targetValue ? 100 : 0;
  }

  const totalRange = targetValue - startValue;
  const progressAchieved = currentValue - startValue;

  if (totalRange === 0) {
    return 0; // Evita divisão por zero se o range for 0
  }

  const progress = (progressAchieved / totalRange) * 100;

  return Math.max(0, Math.min(100, progress)); // Garante que o progresso esteja entre 0 e 100
}

/**
 * Determina o status de uma meta com base no progresso e data.
 * @param goal A meta do aluno.
 * @returns O status da meta ('active', 'completed', 'paused', 'failed').
 */
export function determineGoalStatus(goal: StudentGoal): StudentGoal["status"] {
  const progress = calculateGoalProgress(
    goal.startValue,
    goal.targetValue,
    goal.currentValue
  );
  const now = new Date();
  const targetDate = new Date(goal.targetDate);

  if (progress >= 100) {
    return "completed";
  }

  if (now > targetDate) {
    return "failed"; // Se a data alvo passou e não foi completada
  }

  // Outras lógicas para 'paused' podem ser adicionadas aqui,
  // mas geralmente 'paused' é definido manualmente.
  // Por padrão, se não estiver completa ou falha, e a data não passou, é 'active'.
  return "active";
}
