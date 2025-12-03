// src/utils/devTools.ts
// Ferramentas de desenvolvimento para debug no console

import {
  updateExerciseDefinitions,
  forceResetExerciseDefinitions,
  seedExerciseDefinitions
} from '../db/migrations';
import { db } from '../db/database';

/**
 * 🛠️ FERRAMENTAS DE DESENVOLVIMENTO
 *
 * Estas funções são expostas globalmente no objeto window durante o desenvolvimento
 * para facilitar debug e manutenção do banco de dados.
 *
 * Para usar, abra o console do navegador e digite:
 * - window.devTools.updateExercises() - Adiciona exercícios novos
 * - window.devTools.resetExercises() - Reseta TODOS os exercícios
 * - window.devTools.countExercises() - Mostra quantos exercícios existem
 */

export const devTools = {
  /**
   * 🔄 Adiciona exercícios novos do arquivo estático ao banco
   * (Não remove exercícios existentes)
   */
  updateExercises: async () => {
    console.log('🚀 Iniciando atualização de exercícios...');
    const result = await updateExerciseDefinitions();

    if (result.success) {
      console.log(`✅ Atualização concluída!`);
      console.log(`   - Novos exercícios: ${result.addedCount}`);
      console.log(`   - Total no banco: ${result.totalCount}`);
      console.log(`\n⚠️ IMPORTANTE: Recarregue a página (F5) para ver as mudanças!`);
    } else {
      console.error('❌ Erro na atualização');
    }

    return result;
  },

  /**
   * 🔄 RESET COMPLETO: Remove TODOS os exercícios e reinsere do arquivo
   * ⚠️ USE COM CUIDADO!
   */
  resetExercises: async () => {
    const confirm = window.confirm(
      '⚠️ ATENÇÃO!\n\n' +
      'Isso vai DELETAR todos os exerciseDefinitions do banco e reinserir do arquivo estático.\n\n' +
      'Seus treinos e histórico NÃO serão afetados.\n\n' +
      'Deseja continuar?'
    );

    if (!confirm) {
      console.log('❌ Operação cancelada pelo usuário');
      return { success: false, removedCount: 0, addedCount: 0 };
    }

    console.log('🚀 Iniciando RESET COMPLETO de exercícios...');
    const result = await forceResetExerciseDefinitions();

    if (result.success) {
      console.log(`✅ RESET CONCLUÍDO!`);
      console.log(`   - Removidos: ${result.removedCount} exercícios`);
      console.log(`   - Adicionados: ${result.addedCount} exercícios`);
      console.log(`\n⚠️ IMPORTANTE: Recarregue a página (F5) para ver as mudanças!`);
    } else {
      console.error('❌ Erro no reset');
    }

    return result;
  },

  /**
   * 📊 Mostra quantos exercícios existem no banco
   */
  countExercises: async () => {
    const count = await db.exerciseDefinitions.count();
    console.log(`📊 Total de exercícios no banco: ${count}`);

    // Contar por grupo muscular
    const exercises = await db.exerciseDefinitions.toArray();
    const byMuscleGroup = exercises.reduce((acc, ex) => {
      acc[ex.primaryMuscleGroup] = (acc[ex.primaryMuscleGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📈 Exercícios por grupo muscular:');
    Object.entries(byMuscleGroup)
      .sort(([, a], [, b]) => b - a)
      .forEach(([group, count]) => {
        console.log(`   ${group}: ${count}`);
      });

    return { total: count, byMuscleGroup };
  },

  /**
   * 🌱 Força o seed inicial (mesmo que já exista)
   */
  forceSeed: async () => {
    console.log('🌱 Forçando seed de exercícios...');
    const result = await seedExerciseDefinitions();
    console.log(result);
    return result;
  },

  /**
   * 🔍 Lista todos os exercícios do banco
   */
  listExercises: async (filter?: string) => {
    const exercises = await db.exerciseDefinitions.toArray();

    let filtered = exercises;
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      filtered = exercises.filter(ex =>
        ex.name.toLowerCase().includes(lowerFilter) ||
        ex.primaryMuscleGroup.toLowerCase().includes(lowerFilter)
      );
    }

    console.log(`📋 ${filtered.length} exercícios encontrados:`);
    filtered.forEach(ex => {
      console.log(`   ${ex.name} (${ex.primaryMuscleGroup})`);
    });

    return filtered;
  },

  /**
   * 🔍 Busca exercícios por grupo muscular
   */
  findByMuscleGroup: async (muscleGroup: string) => {
    const exercises = await db.exerciseDefinitions
      .where('primaryMuscleGroup')
      .equals(muscleGroup)
      .toArray();

    console.log(`💪 ${exercises.length} exercícios de ${muscleGroup}:`);
    exercises.forEach(ex => {
      console.log(`   - ${ex.name}`);
    });

    return exercises;
  },

  /**
   * 📊 Estatísticas do banco
   */
  stats: async () => {
    const [
      exerciseCount,
      workoutDaysCount,
      loggedExercisesCount,
      sessionsCount
    ] = await Promise.all([
      db.exerciseDefinitions.count(),
      db.workoutDays.count(),
      db.loggedExercises.count(),
      db.workoutSessions.count()
    ]);

    const stats = {
      exerciseDefinitions: exerciseCount,
      workoutDays: workoutDaysCount,
      loggedExercises: loggedExercisesCount,
      workoutSessions: sessionsCount,
    };

    console.log('📊 Estatísticas do Banco de Dados:');
    console.table(stats);

    return stats;
  }
};

// Expor globalmente apenas em desenvolvimento
if (import.meta.env.DEV) {
  (window as any).devTools = devTools;
  console.log('🛠️ DevTools carregadas! Digite "devTools" no console para ver as funções disponíveis.');
  console.log('📚 Funções disponíveis:');
  console.log('   - devTools.updateExercises() - Adiciona exercícios novos');
  console.log('   - devTools.resetExercises() - Reseta TODOS os exercícios');
  console.log('   - devTools.countExercises() - Conta exercícios no banco');
  console.log('   - devTools.listExercises(filter?) - Lista exercícios');
  console.log('   - devTools.findByMuscleGroup(group) - Busca por grupo');
  console.log('   - devTools.stats() - Estatísticas do banco');
}
