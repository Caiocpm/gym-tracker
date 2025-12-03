// src/hooks/useProfessionalStats.ts
import { useState, useCallback } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";
import type { ProfessionalStats } from "../types/professional";

export function useProfessionalStats() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<ProfessionalStats | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Carregar estatísticas gerais
  const loadStats = useCallback(async (): Promise<ProfessionalStats | null> => {
    if (!currentUser) return null;

    try {
      setLoading(true);

      // Contar alunos
      const linksRef = collection(
        db,
        `professionals/${currentUser.uid}/studentLinks`
      );
      const allLinks = await getDocs(linksRef);
      const activeLinksSnap = await getDocs(
        query(linksRef, where("status", "==", "active"))
      );

      const totalStudents = allLinks.size;
      const activeStudents = activeLinksSnap.size;

      // Contar metas
      const goalsRef = collection(
        db,
        `professionals/${currentUser.uid}/studentGoals`
      );
      const allGoals = await getDocs(goalsRef);
      const completedGoalsSnap = await getDocs(
        query(goalsRef, where("status", "==", "completed"))
      );

      const totalGoals = allGoals.size;
      const completedGoals = completedGoalsSnap.size;

      // Calcular progresso médio
      let totalProgress = 0;
      allGoals.forEach((doc) => {
        totalProgress += doc.data().progress || 0;
      });
      const averageStudentProgress =
        totalGoals > 0 ? totalProgress / totalGoals : 0;

      // Contar avaliações próximas (próximos 30 dias)
      const now = new Date();
      const thirtyDaysFromNow = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );

      const evalsRef = collection(
        db,
        `professionals/${currentUser.uid}/evaluations`
      );
      const upcomingEvalsSnap = await getDocs(evalsRef);

      let upcomingEvaluations = 0;
      upcomingEvalsSnap.forEach((doc) => {
        const evalDate = new Date(doc.data().scheduledDate);
        if (
          evalDate > now &&
          evalDate < thirtyDaysFromNow &&
          doc.data().status === "scheduled"
        ) {
          upcomingEvaluations++;
        }
      });

      // Contar alunos com alertas
      const alertsRef = collection(
        db,
        `professionals/${currentUser.uid}/alerts`
      );
      const alertsSnap = await getDocs(
        query(alertsRef, where("read", "==", false))
      );

      const studentsWithAlerts = new Set(
        Array.from(alertsSnap.docs).map((doc) => doc.data().studentId)
      ).size;

      const newStats: ProfessionalStats = {
        totalStudents,
        activeStudents,
        completedGoals,
        totalGoals,
        upcomingEvaluations,
        averageStudentProgress: Math.round(averageStudentProgress),
        studentsWithAlerts,
        lastUpdated: new Date().toISOString(),
      };

      setStats(newStats);
      return newStats;
    } catch (err) {
      console.error("Erro ao carregar estatísticas:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  return {
    stats,
    loading,
    loadStats,
  };
}
