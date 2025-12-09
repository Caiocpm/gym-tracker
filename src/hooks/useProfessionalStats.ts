// src/hooks/useProfessionalStats.ts
import { useState, useCallback } from "react";
import { professionalApi } from "../services/professionalApi";
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
      const newStats = await professionalApi.stats.get(currentUser.uid);
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
