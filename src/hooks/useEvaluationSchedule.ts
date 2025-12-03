import { useState } from "react";
import type { EvaluationSchedule } from "../types/professional";
import { db } from "../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

const EVALUATIONS_COLLECTION = "evaluations";

export function useEvaluationSchedule() {
  const [evaluations, setEvaluations] = useState<EvaluationSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar avaliações de um aluno
  const loadEvaluations = async (studentLinkId?: string) => {
    try {
      setLoading(true);
      const evaluationsRef = collection(db, EVALUATIONS_COLLECTION);
      let q;

      // ✅ Se não houver studentLinkId, carrega TODAS as avaliações
      if (studentLinkId) {
        q = query(evaluationsRef, where("studentLinkId", "==", studentLinkId));
      } else {
        q = query(evaluationsRef);
      }

      const snapshot = await getDocs(q);
      const evaluationsData = snapshot.docs.map((doc) => ({
        ...(doc.data() as Omit<EvaluationSchedule, "id">),
        id: doc.id,
      }));

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
      const evaluationsRef = collection(db, EVALUATIONS_COLLECTION);

      // ✅ Extrai data e hora do Date
      const scheduledDate = scheduledDateTime.toISOString().split("T")[0];
      const scheduledTime =
        scheduledDateTime.toISOString().split("T")[1]?.substring(0, 5) ||
        "00:00";
      const durationNum =
        typeof duration === "string" ? parseInt(duration, 10) : duration;

      const newEvaluation = {
        studentLinkId,
        professionalId,
        title,
        type,
        scheduledDate,
        scheduledTime,
        duration: durationNum,
        location: location || "",
        status: "scheduled" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("📝 Criando avaliação:", newEvaluation);

      const docRef = await addDoc(evaluationsRef, newEvaluation);
      setEvaluations([...evaluations, { ...newEvaluation, id: docRef.id }]);
      setError(null);
      return docRef.id;
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
      const evaluationRef = doc(db, EVALUATIONS_COLLECTION, evaluationId);

      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      if (updateData.duration && typeof updateData.duration === "string") {
        updateData.duration = parseInt(updateData.duration, 10);
      }

      await updateDoc(evaluationRef, updateData);

      setEvaluations(
        evaluations.map((e) =>
          e.id === evaluationId ? { ...e, ...updateData } : e
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
      const evaluationRef = doc(db, EVALUATIONS_COLLECTION, evaluationId);

      await deleteDoc(evaluationRef);

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
