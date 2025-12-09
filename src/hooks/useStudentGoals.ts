import { useState } from "react";
import type { StudentGoal } from "../types/professional";
import { professionalApi } from "../services/professionalApi";

export function useStudentGoals() {
  const [goals, setGoals] = useState<StudentGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar metas de um aluno
  const loadStudentGoals = async (studentLinkId?: string) => {
    try {
      setLoading(true);
      const goalsData = await professionalApi.goals.list({ studentLinkId });
      setGoals(goalsData);
      setError(null);
    } catch (err) {
      console.error("❌ Erro ao carregar metas:", err);
      setError("Erro ao carregar metas");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Criar nova meta - SIMPLIFICADO
  const createGoal = async (
    studentLinkId: string,
    title: string,
    description: string,
    category: StudentGoal["category"],
    currentValue: number,
    targetValue: number,
    unit: string,
    targetDate: Date,
    professionalId: string,
    startDate?: Date
  ): Promise<string> => {
    try {
      setLoading(true);

      const parsedCurrentValue =
        typeof currentValue === "number"
          ? currentValue
          : parseFloat(String(currentValue));
      const parsedTargetValue =
        typeof targetValue === "number"
          ? targetValue
          : parseFloat(String(targetValue));

      console.log("📝 Criando meta via API");

      const newGoal = await professionalApi.goals.create({
        studentLinkId,
        professionalId,
        title,
        description: description || "",
        category,
        currentValue: parsedCurrentValue,
        targetValue: parsedTargetValue,
        unit,
        targetDate: targetDate.toISOString(),
        startDate: (startDate || new Date()).toISOString(),
      });

      setGoals([...goals, newGoal]);
      setError(null);
      return newGoal.id;
    } catch (err) {
      console.error("❌ Erro ao criar meta:", err);
      setError("Erro ao criar meta");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar meta
  const updateGoal = async (goalId: string, updates: Partial<StudentGoal>) => {
    try {
      setLoading(true);
      const updatedGoal = await professionalApi.goals.update(goalId, updates);

      setGoals(
        goals.map((g) => (g.id === goalId ? updatedGoal : g))
      );

      setError(null);
    } catch (err) {
      console.error("Erro ao atualizar meta:", err);
      setError("Erro ao atualizar meta");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Deletar meta
  const deleteGoal = async (goalId: string) => {
    try {
      setLoading(true);
      await professionalApi.goals.delete(goalId);
      setGoals(goals.filter((g) => g.id !== goalId));
      setError(null);
    } catch (err) {
      console.error("Erro ao deletar meta:", err);
      setError("Erro ao deletar meta");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    goals,
    loading,
    error,
    loadStudentGoals,
    createGoal,
    updateGoal,
    deleteGoal,
  };
}
