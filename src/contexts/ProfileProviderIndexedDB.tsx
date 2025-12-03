/* eslint-disable react-refresh/only-export-components */
// src/contexts/ProfileProviderIndexedDB.tsx
// Provider de Perfil usando IndexedDB

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/database";
import type { UserProfile, BodyMeasurements } from "../types/profile";

interface ProfileContextType {
  state: {
    profile: UserProfile | null;
    measurements: BodyMeasurements[];
    isLoading: boolean;
    error: string | null;
  };
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  addMeasurement: (data: Omit<BodyMeasurements, "id" | "userId">) => Promise<void>;
  updateMeasurement: (id: string, data: Partial<BodyMeasurements>) => Promise<void>;
  deleteMeasurement: (id: string) => Promise<void>;
  getLatestMeasurement: () => BodyMeasurements | null;
  clearAllData: () => Promise<void>;
  importData: (profile: UserProfile | null, measurements: BodyMeasurements[]) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // ============================================================================
  //                          QUERIES REATIVAS
  // ============================================================================

  // Buscar perfil do IndexedDB (atualiza automaticamente!)
  const profileData = useLiveQuery(async () => {
    const profiles = await db.userProfile.toArray();
    return profiles[0] || null;
  }, []);

  // Buscar medições do IndexedDB (ordenadas por data, mais recente primeiro)
  const measurementsData = useLiveQuery(async () => {
    return await db.bodyMeasurements
      .orderBy("date")
      .reverse()
      .toArray();
  }, []);

  // ============================================================================
  //                          INICIALIZAÇÃO & MIGRAÇÃO
  // ============================================================================

  // Migrar dados do localStorage na primeira vez
  useEffect(() => {
    const migrateFromLocalStorage = async () => {
      try {
        // Verificar se já existe dados no IndexedDB
        const existingProfile = await db.userProfile.count();
        const existingMeasurements = await db.bodyMeasurements.count();

        if (existingProfile === 0 && existingMeasurements === 0) {
          // Tentar carregar do localStorage
          const savedData = localStorage.getItem("gym-tracker-profile");

          if (savedData) {
            console.log("📦 Migrando dados de perfil do localStorage...");

            const parsed = JSON.parse(savedData);

            // Migrar perfil
            if (parsed.profile) {
              await db.userProfile.add(parsed.profile);
              console.log("✅ Perfil migrado para IndexedDB");
            }

            // Migrar medições
            if (parsed.measurements?.length > 0) {
              await db.bodyMeasurements.bulkAdd(parsed.measurements);
              console.log(`✅ ${parsed.measurements.length} medições migradas`);
            }
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("❌ Erro na migração de perfil:", error);
        setError("Erro ao carregar dados do perfil");
        setIsInitialized(true);
      }
    };

    migrateFromLocalStorage();
  }, []);

  // ============================================================================
  //                          OPERAÇÕES
  // ============================================================================

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    try {
      const profiles = await db.userProfile.toArray();

      if (profiles.length > 0) {
        // Atualizar perfil existente
        await db.userProfile.update(profiles[0].id, {
          ...data,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Criar novo perfil
        const newProfile: UserProfile = {
          id: "default",
          name: "",
          age: 0,
          height: 0,
          weight: 0,
          gender: "other",
          activityLevel: "sedentario",
          goal: "manter_peso",
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.userProfile.add(newProfile);
      }

      console.log("✅ Perfil atualizado no IndexedDB");
    } catch (error) {
      console.error("❌ Erro ao atualizar perfil:", error);
      setError("Erro ao atualizar perfil");
      throw error;
    }
  }, []);

  const addMeasurement = useCallback(
    async (data: Omit<BodyMeasurements, "id" | "userId">) => {
      try {
        const newMeasurement: BodyMeasurements = {
          ...data,
          id: Date.now().toString(),
          userId: profileData?.id || "default",
        };

        await db.bodyMeasurements.add(newMeasurement);
        console.log("✅ Medição adicionada ao IndexedDB");
      } catch (error) {
        console.error("❌ Erro ao adicionar medição:", error);
        setError("Erro ao adicionar medição");
        throw error;
      }
    },
    [profileData?.id]
  );

  const updateMeasurement = useCallback(
    async (id: string, data: Partial<BodyMeasurements>) => {
      try {
        await db.bodyMeasurements.update(id, data);
        console.log("✅ Medição atualizada no IndexedDB");
      } catch (error) {
        console.error("❌ Erro ao atualizar medição:", error);
        setError("Erro ao atualizar medição");
        throw error;
      }
    },
    []
  );

  const deleteMeasurement = useCallback(async (id: string) => {
    try {
      await db.bodyMeasurements.delete(id);
      console.log("✅ Medição removida do IndexedDB");
    } catch (error) {
      console.error("❌ Erro ao remover medição:", error);
      setError("Erro ao remover medição");
      throw error;
    }
  }, []);

  const getLatestMeasurement = useCallback((): BodyMeasurements | null => {
    return measurementsData?.[0] || null;
  }, [measurementsData]);

  const clearAllData = useCallback(async () => {
    try {
      await db.userProfile.clear();
      await db.bodyMeasurements.clear();
      console.log("✅ Todos os dados de perfil foram limpos do IndexedDB");
    } catch (error) {
      console.error("❌ Erro ao limpar dados de perfil:", error);
      setError("Erro ao limpar dados de perfil");
      throw error;
    }
  }, []);

  const importData = useCallback(async (profile: UserProfile | null, measurements: BodyMeasurements[]) => {
    try {
      // Limpar dados existentes
      await db.userProfile.clear();
      await db.bodyMeasurements.clear();

      // Importar perfil
      if (profile) {
        await db.userProfile.add(profile);
      }

      // Importar medições
      if (measurements.length > 0) {
        await db.bodyMeasurements.bulkAdd(measurements);
      }

      console.log("✅ Dados de perfil importados com sucesso");
    } catch (error) {
      console.error("❌ Erro ao importar dados de perfil:", error);
      setError("Erro ao importar dados de perfil");
      throw error;
    }
  }, []);

  // ============================================================================
  //                          CONTEXTO
  // ============================================================================

  const value: ProfileContextType = {
    state: {
      profile: profileData || null,
      measurements: measurementsData || [],
      isLoading: !isInitialized || profileData === undefined || measurementsData === undefined,
      error,
    },
    updateProfile,
    addMeasurement,
    updateMeasurement,
    deleteMeasurement,
    getLatestMeasurement,
    clearAllData,
    importData,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile deve ser usado dentro de ProfileProvider");
  }
  return context;
}

