// src/hooks/useUserBadges.ts
import { useState, useCallback } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";
import type { UserChallengeBadge, ChallengeBadge } from "../types/social";

/**
 * Hook para gerenciar badges conquistados pelos usuários
 */
export function useUserBadges() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  /**
   * ✅ Buscar todos os badges de um usuário
   */
  const getUserBadges = useCallback(
    async (userId?: string): Promise<UserChallengeBadge[]> => {
      const targetUserId = userId || currentUser?.uid;
      if (!targetUserId) {
        console.error("❌ Usuário não autenticado");
        return [];
      }

      try {
        setLoading(true);
        const q = query(
          collection(db, "userBadges"),
          where("userId", "==", targetUserId)
        );

        const querySnapshot = await getDocs(q);
        const badges: UserChallengeBadge[] = [];

        querySnapshot.forEach((doc) => {
          badges.push({
            id: doc.id,
            ...doc.data(),
          } as UserChallengeBadge);
        });

        // Ordenar por data de conquista (mais recente primeiro)
        badges.sort((a, b) => {
          const dateA = new Date(a.earnedAt).getTime();
          const dateB = new Date(b.earnedAt).getTime();
          return dateB - dateA;
        });

        console.log(`✅ ${badges.length} badges encontrados para usuário ${targetUserId}`);
        return badges;
      } catch (error) {
        console.error("❌ Erro ao buscar badges:", error);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [currentUser]
  );

  /**
   * ✅ Conceder um badge ao usuário
   * Chamado quando completa um desafio
   */
  const awardBadge = useCallback(
    async (
      badgeName: string,
      badgeIcon: string,
      badgeCategory: ChallengeBadge["category"],
      badgeRarity: ChallengeBadge["rarity"],
      challengeId?: string,
      challengeTitle?: string
    ): Promise<UserChallengeBadge | null> => {
      if (!currentUser) {
        console.error("❌ Usuário não autenticado");
        return null;
      }

      try {
        // Verificar se já tem esse badge deste desafio
        if (challengeId) {
          const existing = await checkBadgeExists(challengeId);
          if (existing) {
            console.log("⚠️ Badge já conquistado para este desafio");
            return existing;
          }
        }

        const badgeData: Record<string, unknown> = {
          userId: currentUser.uid,
          badgeId: `badge_${Date.now()}`,
          badgeName,
          badgeIcon,
          badgeCategory,
          badgeRarity,
          earnedAt: new Date().toISOString(),
        };

        // Adicionar campos opcionais
        if (challengeId) {
          badgeData.challengeId = challengeId;
        }
        if (challengeTitle) {
          badgeData.challengeTitle = challengeTitle;
        }

        const docRef = await addDoc(collection(db, "userBadges"), badgeData);

        console.log(`✅ Badge "${badgeName}" concedido!`);

        return {
          id: docRef.id,
          ...badgeData,
        } as UserChallengeBadge;
      } catch (error) {
        console.error("❌ Erro ao conceder badge:", error);
        return null;
      }
    },
    [currentUser]
  );

  /**
   * ✅ Verificar se usuário já tem badge de um desafio específico
   */
  const checkBadgeExists = useCallback(
    async (challengeId: string): Promise<UserChallengeBadge | null> => {
      if (!currentUser) return null;

      try {
        const q = query(
          collection(db, "userBadges"),
          where("userId", "==", currentUser.uid),
          where("challengeId", "==", challengeId)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          return {
            id: doc.id,
            ...doc.data(),
          } as UserChallengeBadge;
        }

        return null;
      } catch (error) {
        console.error("❌ Erro ao verificar badge:", error);
        return null;
      }
    },
    [currentUser]
  );

  /**
   * ✅ Buscar badge por ID
   */
  const getBadgeById = useCallback(
    async (badgeId: string): Promise<UserChallengeBadge | null> => {
      try {
        const docRef = doc(db, "userBadges", badgeId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          return {
            id: docSnap.id,
            ...docSnap.data(),
          } as UserChallengeBadge;
        }

        return null;
      } catch (error) {
        console.error("❌ Erro ao buscar badge:", error);
        return null;
      }
    },
    []
  );

  /**
   * ✅ Buscar estatísticas de badges do usuário
   */
  const getBadgeStats = useCallback(
    async (userId?: string) => {
      const badges = await getUserBadges(userId);

      const stats = {
        total: badges.length,
        byCategory: {
          volume: badges.filter((b) => b.badgeCategory === "volume").length,
          consistency: badges.filter((b) => b.badgeCategory === "consistency").length,
          records: badges.filter((b) => b.badgeCategory === "records").length,
          exercise: badges.filter((b) => b.badgeCategory === "exercise").length,
          collaborative: badges.filter((b) => b.badgeCategory === "collaborative").length,
          special: badges.filter((b) => b.badgeCategory === "special").length,
        },
        byRarity: {
          common: badges.filter((b) => b.badgeRarity === "common").length,
          rare: badges.filter((b) => b.badgeRarity === "rare").length,
          epic: badges.filter((b) => b.badgeRarity === "epic").length,
          legendary: badges.filter((b) => b.badgeRarity === "legendary").length,
        },
        mostRecent: badges[0] || null,
      };

      return stats;
    },
    [getUserBadges]
  );

  return {
    loading,
    getUserBadges,
    awardBadge,
    checkBadgeExists,
    getBadgeById,
    getBadgeStats,
  };
}
