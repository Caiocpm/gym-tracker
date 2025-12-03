import { useState } from "react";
import type { StudentGoal } from "../types/professional";
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

const GOALS_COLLECTION = "goals";

export function useStudentGoals() {
  const [goals, setGoals] = useState<StudentGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar metas de um aluno
  const loadStudentGoals = async (studentLinkId?: string) => {
    try {
      setLoading(true);
      const goalsRef = collection(db, GOALS_COLLECTION);
      let q;

      // ✅ Se não houver studentLinkId, carrega TODAS as metas
      if (studentLinkId) {
        q = query(goalsRef, where("studentLinkId", "==", studentLinkId));
      } else {
        q = query(goalsRef);
      }

      const snapshot = await getDocs(q);
      const goalsData = snapshot.docs.map((doc) => ({
        ...(doc.data() as Omit<StudentGoal, "id">),
        id: doc.id,
      }));

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
      const goalsRef = collection(db, GOALS_COLLECTION);

      const parsedCurrentValue =
        typeof currentValue === "number"
          ? currentValue
          : parseFloat(String(currentValue));
      const parsedTargetValue =
        typeof targetValue === "number"
          ? targetValue
          : parseFloat(String(targetValue));
      const startVal = parsedCurrentValue;

      const newGoal = {
        studentLinkId,
        professionalId,
        title,
        description: description || "",
        category,
        currentValue: parsedCurrentValue,
        targetValue: parsedTargetValue,
        startValue: startVal,
        startDate: (startDate || new Date()).toISOString(),
        unit,
        targetDate: targetDate.toISOString(),
        progress:
          ((parsedCurrentValue - startVal) / (parsedTargetValue - startVal)) *
          100,
        status: "active" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("📝 Criando meta:", newGoal);

      const docRef = await addDoc(goalsRef, newGoal);
      setGoals([...goals, { ...newGoal, id: docRef.id }]);
      setError(null);
      return docRef.id;
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
      const goalRef = doc(db, GOALS_COLLECTION, goalId);

      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(goalRef, updateData);

      setGoals(
        goals.map((g) => (g.id === goalId ? { ...g, ...updateData } : g))
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
      const goalRef = doc(db, GOALS_COLLECTION, goalId);

      await deleteDoc(goalRef);

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
