// src/db/hooks/useProfileDB.ts
// Hook para operações de perfil no IndexedDB

import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database';
import type { UserProfile, BodyMeasurements } from '../../types/profile';

export function useProfileDB() {
  // ============================================================================
  //                          QUERIES REATIVAS
  // ============================================================================

  const profile = useLiveQuery(async () => {
    const profiles = await db.userProfile.toArray();
    return profiles[0] || null;
  }, []);

  const measurements = useLiveQuery(async () => {
    return await db.bodyMeasurements
      .orderBy('date')
      .reverse()
      .toArray();
  }, []);

  // ============================================================================
  //                          OPERAÇÕES
  // ============================================================================

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    try {
      const profiles = await db.userProfile.toArray();

      if (profiles.length > 0) {
        await db.userProfile.update(profiles[0].id, {
          ...data,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const newProfile: UserProfile = {
          id: 'default',
          name: '',
          age: 0,
          height: 0,
          weight: 0,
          gender: 'other',
          activityLevel: 'sedentario',
          goal: 'manter_peso',
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.userProfile.add(newProfile);
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      return { success: false, error };
    }
  }, []);

  const addMeasurement = useCallback(
    async (data: Omit<BodyMeasurements, 'id' | 'userId'>) => {
      try {
        const newMeasurement: BodyMeasurements = {
          ...data,
          id: Date.now().toString(),
          userId: profile?.id || 'default',
        };

        await db.bodyMeasurements.add(newMeasurement);
        console.log('✅ Medição adicionada');
        return { success: true };
      } catch (error) {
        console.error('❌ Erro ao adicionar medição:', error);
        return { success: false, error };
      }
    },
    [profile?.id]
  );

  const updateMeasurement = useCallback(
    async (id: string, data: Partial<BodyMeasurements>) => {
      try {
        await db.bodyMeasurements.update(id, data);
        console.log('✅ Medição atualizada');
        return { success: true };
      } catch (error) {
        console.error('❌ Erro ao atualizar medição:', error);
        return { success: false, error };
      }
    },
    []
  );

  const deleteMeasurement = useCallback(async (id: string) => {
    try {
      await db.bodyMeasurements.delete(id);
      console.log('✅ Medição removida');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao remover medição:', error);
      return { success: false, error };
    }
  }, []);

  const getLatestMeasurement = useCallback((): BodyMeasurements | null => {
    return measurements?.[0] || null;
  }, [measurements]);

  // ============================================================================
  //                          RETORNO
  // ============================================================================

  return {
    profile,
    measurements,
    updateProfile,
    addMeasurement,
    updateMeasurement,
    deleteMeasurement,
    getLatestMeasurement,
    isLoading: profile === undefined || measurements === undefined,
  };
}
