// src/db/hooks/useNutritionDB.ts
// Hook para operações de nutrição no IndexedDB

import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database';
import type { FoodEntry, WaterEntry, DailyGoals } from '../../types/nutrition';

/**
 * 🍎 HOOK PARA DADOS DE NUTRIÇÃO
 */
export function useNutritionDB() {
  // ============================================================================
  //                          QUERIES REATIVAS
  // ============================================================================

  /**
   * 🔍 Busca todas as entradas de comida dos últimos 30 dias
   * (automaticamente atualiza quando os dados mudam)
   */
  const recentFoodEntries = useLiveQuery(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return db.foodEntries
      .where('date')
      .above(thirtyDaysAgo.toISOString().split('T')[0])
      .toArray();
  }, []);

  /**
   * 🔍 Busca todas as entradas de água dos últimos 30 dias
   */
  const recentWaterEntries = useLiveQuery(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return db.waterEntries
      .where('date')
      .above(thirtyDaysAgo.toISOString().split('T')[0])
      .toArray();
  }, []);

  /**
   * 🎯 Busca as metas diárias atuais
   */
  const currentGoals = useLiveQuery(() => {
    return db.dailyGoals.get('current');
  }, []);

  // ============================================================================
  //                          OPERAÇÕES DE ESCRITA
  // ============================================================================

  /**
   * ➕ Adiciona uma entrada de comida
   */
  const addFoodEntry = useCallback(async (entry: FoodEntry) => {
    try {
      await db.foodEntries.add(entry);
      console.log('✅ Entrada de comida adicionada:', entry.name);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao adicionar comida:', error);
      return { success: false, error };
    }
  }, []);

  /**
   * ✏️ Atualiza uma entrada de comida
   */
  const updateFoodEntry = useCallback(
    async (id: string, updates: Partial<FoodEntry>) => {
      try {
        await db.foodEntries.update(id, updates);
        console.log('✅ Entrada de comida atualizada:', id);
        return { success: true };
      } catch (error) {
        console.error('❌ Erro ao atualizar comida:', error);
        return { success: false, error };
      }
    },
    []
  );

  /**
   * 🗑️ Remove uma entrada de comida
   */
  const deleteFoodEntry = useCallback(async (id: string) => {
    try {
      await db.foodEntries.delete(id);
      console.log('✅ Entrada de comida removida:', id);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao remover comida:', error);
      return { success: false, error };
    }
  }, []);

  /**
   * ➕ Adiciona uma entrada de água
   */
  const addWaterEntry = useCallback(async (entry: WaterEntry) => {
    try {
      await db.waterEntries.add(entry);
      console.log('✅ Entrada de água adicionada:', entry.amount, 'ml');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao adicionar água:', error);
      return { success: false, error };
    }
  }, []);

  /**
   * 🗑️ Remove uma entrada de água
   */
  const deleteWaterEntry = useCallback(async (id: string) => {
    try {
      await db.waterEntries.delete(id);
      console.log('✅ Entrada de água removida:', id);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao remover água:', error);
      return { success: false, error };
    }
  }, []);

  /**
   * 🎯 Atualiza as metas diárias
   */
  const updateDailyGoals = useCallback(async (goals: DailyGoals) => {
    try {
      await db.dailyGoals.put({ id: 'current', goals });
      console.log('✅ Metas diárias atualizadas');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar metas:', error);
      return { success: false, error };
    }
  }, []);

  // ============================================================================
  //                          QUERIES CUSTOMIZADAS
  // ============================================================================

  /**
   * 🔍 Busca todas as refeições de uma data específica
   */
  const getFoodEntriesByDate = useCallback(async (date: string) => {
    return await db.foodEntries.where('date').equals(date).toArray();
  }, []);

  /**
   * 🔍 Busca água consumida em uma data específica
   */
  const getWaterEntriesByDate = useCallback(async (date: string) => {
    return await db.waterEntries.where('date').equals(date).toArray();
  }, []);

  /**
   * 🔍 Busca refeições por tipo (café, almoço, jantar, etc)
   */
  const getFoodEntriesByMeal = useCallback(
    async (date: string, meal: string) => {
      return await db.foodEntries
        .where(['date', 'meal'])
        .equals([date, meal])
        .toArray();
    },
    []
  );

  /**
   * 🔍 Busca apenas itens planejados de uma data
   */
  const getPlannedFoodEntries = useCallback(async (date: string) => {
    return await db.foodEntries
      .where(['date', 'status'])
      .equals([date, 'planned'])
      .toArray();
  }, []);

  /**
   * 🔍 Busca apenas itens consumidos de uma data
   */
  const getConsumedFoodEntries = useCallback(async (date: string) => {
    return await db.foodEntries
      .where(['date', 'status'])
      .equals([date, 'consumed'])
      .toArray();
  }, []);

  /**
   * 📊 Calcula totais de macros para uma data
   */
  const getDailyTotals = useCallback(async (date: string) => {
    const entries = await db.foodEntries
      .where(['date', 'status'])
      .equals([date, 'consumed'])
      .toArray();

    const water = await db.waterEntries
      .where(['date', 'status'])
      .equals([date, 'consumed'])
      .toArray();

    const totals = entries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        protein: acc.protein + entry.protein,
        carbs: acc.carbs + entry.carbs,
        fat: acc.fat + entry.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const totalWater = water.reduce((sum, entry) => sum + entry.amount, 0);

    return {
      ...totals,
      water: totalWater,
    };
  }, []);

  /**
   * ✅ Marca uma comida como consumida
   */
  const markFoodAsConsumed = useCallback(async (id: string) => {
    return await updateFoodEntry(id, {
      status: 'consumed',
      consumedAt: new Date().toISOString(),
    });
  }, [updateFoodEntry]);

  /**
   * 📝 Marca uma comida como planejada
   */
  const markFoodAsPlanned = useCallback(async (id: string) => {
    return await updateFoodEntry(id, {
      status: 'planned',
    });
  }, [updateFoodEntry]);

  /**
   * ⚡ Adiciona múltiplas entradas de comida em lote
   */
  const bulkAddFoodEntries = useCallback(async (entries: FoodEntry[]) => {
    try {
      await db.foodEntries.bulkAdd(entries);
      console.log(`✅ ${entries.length} entradas de comida adicionadas em lote`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao adicionar comidas em lote:', error);
      return { success: false, error };
    }
  }, []);

  // ============================================================================
  //                          LIMPEZA DE DADOS ANTIGOS
  // ============================================================================

  /**
   * 🧹 Remove entradas de comida mais antigas que X dias
   */
  const cleanOldFoodEntries = useCallback(async (daysToKeep: number = 90) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deleted = await db.foodEntries
        .where('date')
        .below(cutoffDate.toISOString().split('T')[0])
        .delete();

      console.log(`✅ ${deleted} entradas antigas de comida removidas`);
      return { success: true, deleted };
    } catch (error) {
      console.error('❌ Erro ao limpar entradas antigas:', error);
      return { success: false, error };
    }
  }, []);

  /**
   * 🧹 Remove entradas de água mais antigas que X dias
   */
  const cleanOldWaterEntries = useCallback(async (daysToKeep: number = 90) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deleted = await db.waterEntries
        .where('date')
        .below(cutoffDate.toISOString().split('T')[0])
        .delete();

      console.log(`✅ ${deleted} entradas antigas de água removidas`);
      return { success: true, deleted };
    } catch (error) {
      console.error('❌ Erro ao limpar entradas antigas:', error);
      return { success: false, error };
    }
  }, []);

  // ============================================================================
  //                          RETORNO DO HOOK
  // ============================================================================

  return {
    // Dados reativos
    recentFoodEntries,
    recentWaterEntries,
    currentGoals,

    // Operações de comida
    addFoodEntry,
    updateFoodEntry,
    deleteFoodEntry,
    bulkAddFoodEntries,
    markFoodAsConsumed,
    markFoodAsPlanned,

    // Operações de água
    addWaterEntry,
    deleteWaterEntry,

    // Operações de metas
    updateDailyGoals,

    // Queries customizadas
    getFoodEntriesByDate,
    getWaterEntriesByDate,
    getFoodEntriesByMeal,
    getPlannedFoodEntries,
    getConsumedFoodEntries,
    getDailyTotals,

    // Limpeza
    cleanOldFoodEntries,
    cleanOldWaterEntries,

    // Estado
    isLoading:
      recentFoodEntries === undefined ||
      recentWaterEntries === undefined ||
      currentGoals === undefined,
  };
}
