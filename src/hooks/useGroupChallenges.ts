// src/hooks/useGroupChallenges.ts
import { useState, useCallback } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";
import { useUserBadges } from "./useUserBadges";
import type {
  GroupChallenge,
  ChallengeType,
  ChallengeParticipant,
  ChallengeBadge,
} from "../types/social";

export function useGroupChallenges() {
  const { currentUser, userProfile } = useAuth();
  const { awardBadge } = useUserBadges();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Criar novo desafio
  const createChallenge = useCallback(
    async (
      groupId: string,
      title: string,
      description: string,
      type: ChallengeType,
      targetValue: number,
      targetUnit: string,
      startDate: Date,
      endDate: Date,
      isCompetitive: boolean,
      reward?: string,
      exerciseId?: string,
      exerciseName?: string
    ): Promise<GroupChallenge | null> => {
      if (!currentUser || !userProfile) {
        setError("Usuário não autenticado");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // ✅ Criar objeto base sem campos undefined
        const challengeData: Record<string, unknown> = {
          groupId,
          createdBy: currentUser.uid,
          createdByName: userProfile.displayName || "Anônimo",
          title,
          description,
          type,
          targetValue,
          targetUnit,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          isCompetitive,
          participants: [],
          totalParticipants: 0,
          completedCount: 0,
          status:
            new Date() < startDate
              ? "upcoming"
              : new Date() > endDate
              ? "completed"
              : "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // ✅ Adicionar campos opcionais apenas se tiverem valor
        if (reward) {
          challengeData.reward = reward;
        }

        if (exerciseId) {
          challengeData.exerciseId = exerciseId;
        }

        if (exerciseName) {
          challengeData.exerciseName = exerciseName;
        }

        // Para desafios colaborativos, adicionar progresso coletivo
        if (type === "collaborative") {
          challengeData.collectiveProgress = 0;
          challengeData.collectiveTarget = targetValue;
        }

        const docRef = await addDoc(
          collection(db, "groupChallenges"),
          challengeData
        );

        console.log("✅ Desafio criado:", docRef.id);

        return {
          ...challengeData,
          id: docRef.id,
        } as GroupChallenge;
      } catch (err) {
        console.error("❌ Erro ao criar desafio:", err);
        setError("Erro ao criar desafio");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [currentUser, userProfile]
  );

  // ✅ Buscar desafios de um grupo
  const getGroupChallenges = useCallback(
    async (groupId: string): Promise<GroupChallenge[]> => {
      console.log("🔍 Buscando desafios do grupo:", groupId);
      setLoading(true);
      setError(null);

      try {
        // Tentar primeiro sem orderBy para verificar se o problema é com índice
        const q = query(
          collection(db, "groupChallenges"),
          where("groupId", "==", groupId)
        );

        const querySnapshot = await getDocs(q);
        const challenges: GroupChallenge[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log("📄 Desafio encontrado:", doc.id, data);
          challenges.push({
            id: doc.id,
            ...data,
          } as GroupChallenge);
        });

        // Ordenar manualmente por createdAt em ordem decrescente
        challenges.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        console.log(`✅ ${challenges.length} desafios carregados para grupo ${groupId}`);
        return challenges;
      } catch (err) {
        console.error("❌ Erro ao buscar desafios:", err);
        setError("Erro ao carregar desafios");
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ✅ Participar de um desafio
  const joinChallenge = useCallback(
    async (challengeId: string): Promise<boolean> => {
      if (!currentUser || !userProfile) {
        setError("Usuário não autenticado");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const challengeRef = doc(db, "groupChallenges", challengeId);

        const participant: ChallengeParticipant = {
          userId: currentUser.uid,
          userName: userProfile.displayName || "Anônimo",
          userAvatar: userProfile.photoURL || undefined,
          progress: 0,
          lastUpdate: new Date().toISOString(),
        };

        await updateDoc(challengeRef, {
          participants: arrayUnion(participant),
          totalParticipants: (await getDocs(query(collection(db, "groupChallenges"), where("__name__", "==", challengeId)))).docs[0].data().totalParticipants + 1,
          updatedAt: new Date().toISOString(),
        });

        console.log("✅ Participou do desafio");
        return true;
      } catch (err) {
        console.error("❌ Erro ao participar do desafio:", err);
        setError("Erro ao participar do desafio");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentUser, userProfile]
  );

  // ✅ Atualizar progresso de um participante
  const updateProgress = useCallback(
    async (
      challengeId: string,
      userId: string,
      newProgress: number
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const challengeRef = doc(db, "groupChallenges", challengeId);
        const challengeDoc = await getDocs(
          query(
            collection(db, "groupChallenges"),
            where("__name__", "==", challengeId)
          )
        );

        if (challengeDoc.empty) {
          setError("Desafio não encontrado");
          return false;
        }

        const challengeData = challengeDoc.docs[0].data() as GroupChallenge;

        // ✅ Verificar se completou nesta atualização
        const previousParticipant = challengeData.participants.find(
          (p) => p.userId === userId
        );
        const justCompleted =
          !previousParticipant?.completedAt &&
          newProgress >= challengeData.targetValue;

        const participants = challengeData.participants.map((p) => {
          if (p.userId === userId) {
            return {
              ...p,
              progress: newProgress,
              lastUpdate: new Date().toISOString(),
              completedAt:
                newProgress >= challengeData.targetValue &&
                !p.completedAt
                  ? new Date().toISOString()
                  : p.completedAt,
            };
          }
          return p;
        });

        // Contar quantos completaram
        const completedCount = participants.filter(
          (p) => p.completedAt
        ).length;

        // Atualizar ranks para desafios competitivos
        if (challengeData.isCompetitive) {
          const sorted = [...participants].sort(
            (a, b) => b.progress - a.progress
          );
          sorted.forEach((p, index) => {
            p.rank = index + 1;
          });
        }

        // Atualizar progresso coletivo para desafios colaborativos
        let updateData: Record<string, unknown> = {
          participants,
          completedCount,
          updatedAt: new Date().toISOString(),
        };

        if (challengeData.type === "collaborative") {
          const collectiveProgress = participants.reduce(
            (sum, p) => sum + p.progress,
            0
          );
          updateData.collectiveProgress = collectiveProgress;
        }

        await updateDoc(challengeRef, updateData);

        // ✅ Conceder badge se completou pela primeira vez
        if (justCompleted && challengeData.reward) {
          console.log(`🏆 Concedendo badge ao usuário ${userId}...`);

          // Determinar raridade baseada no tipo de desafio
          const rarity = determineBadgeRarity(
            challengeData.type,
            challengeData.targetValue,
            challengeData.isCompetitive
          );

          await awardBadge(
            challengeData.reward,
            getBadgeIconForType(challengeData.type),
            challengeData.type,
            rarity,
            challengeId,
            challengeData.title
          );

          console.log(`✅ Badge "${challengeData.reward}" concedido!`);
        }

        console.log("✅ Progresso atualizado");
        return true;
      } catch (err) {
        console.error("❌ Erro ao atualizar progresso:", err);
        setError("Erro ao atualizar progresso");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [awardBadge]
  );

  // ✅ Deletar desafio (apenas criador/admin)
  const deleteChallenge = useCallback(
    async (challengeId: string): Promise<boolean> => {
      if (!currentUser) {
        setError("Usuário não autenticado");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        await deleteDoc(doc(db, "groupChallenges", challengeId));
        console.log("✅ Desafio deletado");
        return true;
      } catch (err) {
        console.error("❌ Erro ao deletar desafio:", err);
        setError("Erro ao deletar desafio");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentUser]
  );

  return {
    loading,
    error,
    createChallenge,
    getGroupChallenges,
    joinChallenge,
    updateProgress,
    deleteChallenge,
  };
}

// ============================================
// FUNÇÕES AUXILIARES PARA BADGES
// ============================================

/**
 * ✅ Determinar raridade do badge baseado no desafio
 */
function determineBadgeRarity(
  type: ChallengeType,
  targetValue: number,
  isCompetitive: boolean
): ChallengeBadge["rarity"] {
  // Badges de desafios competitivos são mais raros
  if (isCompetitive) {
    // Desafios muito difíceis = legendary
    if (
      (type === "volume" && targetValue >= 100000) ||
      (type === "consistency" && targetValue >= 25) ||
      (type === "records" && targetValue >= 10) ||
      (type === "exercise" && targetValue >= 20)
    ) {
      return "legendary";
    }

    // Desafios difíceis = epic
    if (
      (type === "volume" && targetValue >= 50000) ||
      (type === "consistency" && targetValue >= 20) ||
      (type === "records" && targetValue >= 7) ||
      (type === "exercise" && targetValue >= 15)
    ) {
      return "epic";
    }

    // Desafios moderados = rare
    return "rare";
  }

  // Badges colaborativos
  if (type === "collaborative") {
    // Metas coletivas muito altas = legendary
    if (targetValue >= 500000) {
      return "legendary";
    }
    // Metas altas = epic
    if (targetValue >= 250000) {
      return "epic";
    }
    return "rare";
  }

  // Desafios não-competitivos = common
  return "common";
}

/**
 * ✅ Obter ícone do badge baseado no tipo
 */
function getBadgeIconForType(type: ChallengeType): string {
  switch (type) {
    case "volume":
      return "🏋️";
    case "consistency":
      return "🔥";
    case "records":
      return "🏆";
    case "exercise":
      return "💪";
    case "collaborative":
      return "👥";
    default:
      return "🎯";
  }
}
