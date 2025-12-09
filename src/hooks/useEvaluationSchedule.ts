import { useState } from "react";
import type { EvaluationSchedule } from "../types/professional";
import { professionalApi } from "../services/professionalApi";

export function useEvaluationSchedule() {
  const [evaluations, setEvaluations] = useState<EvaluationSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar avaliações de um aluno
  const loadEvaluations = async (studentLinkId?: string) => {
    try {
      setLoading(true);
      const evaluationsData = await professionalApi.evaluations.list({ studentLinkId });
      setEvaluations(evaluationsData);
      setError(null);
    } catch (err) {
      console.error("❌ Erro ao carregar avaliações:", err);
      setError("Erro ao carregar avaliações");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Criar nova avaliação - SIMPLIFICADO
  const createEvaluation = async (
    studentLinkId: string,
    title: string,
    type: EvaluationSchedule["type"],
    scheduledDateTime: Date,
    duration: number | string,
    location: string,
    professionalId: string
  ): Promise<string> => {
    try {
      setLoading(true);

      // ✅ Extrai data e hora do Date
      const scheduledDate = scheduledDateTime.toISOString().split("T")[0];
      const scheduledTime =
        scheduledDateTime.toISOString().split("T")[1]?.substring(0, 5) ||
        "00:00";
      const durationNum =
        typeof duration === "string" ? parseInt(duration, 10) : duration;

      console.log("📝 Criando avaliação via API");

      const newEvaluation = await professionalApi.evaluations.create({
        studentLinkId,
        professionalId,
        title,
        type,
        scheduledDate,
        scheduledTime,
        duration: durationNum,
        location: location || "",
      });

      setEvaluations([...evaluations, newEvaluation]);
      setError(null);
      return newEvaluation.id;
    } catch (err) {
      console.error("❌ Erro ao agendar avaliação:", err);
      setError("Erro ao agendar avaliação");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar avaliação
  const updateEvaluation = async (
    evaluationId: string,
    updates: Partial<EvaluationSchedule>
  ) => {
    try {
      setLoading(true);

      // Converter duration para number se necessário
      if (updates.duration && typeof updates.duration === "string") {
        updates.duration = parseInt(updates.duration, 10);
      }

      const updatedEvaluation = await professionalApi.evaluations.update(
        evaluationId,
        updates
      );

      setEvaluations(
        evaluations.map((e) =>
          e.id === evaluationId ? updatedEvaluation : e
        )
      );

      setError(null);
    } catch (err) {
      console.error("Erro ao atualizar avaliação:", err);
      setError("Erro ao atualizar avaliação");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Deletar avaliação
  const deleteEvaluation = async (evaluationId: string) => {
    try {
      setLoading(true);
      await professionalApi.evaluations.delete(evaluationId);
      setEvaluations(evaluations.filter((e) => e.id !== evaluationId));
      setError(null);
    } catch (err) {
      console.error("Erro ao deletar avaliação:", err);
      setError("Erro ao deletar avaliação");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    evaluations,
    loading,
    error,
    loadEvaluations,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
  };
}
