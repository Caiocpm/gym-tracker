// src/db/migrations.ts
// Migração de dados do localStorage para IndexedDB

import { db } from './database';
import type { WorkoutState } from '../types';
import type { ProfileState } from '../types/profile';
import { exerciseDefinitions } from '../data/exerciseDefinitions';

/**
 * 🔄 MIGRAÇÃO: localStorage → IndexedDB
 *
 * Esta função detecta se existem dados no localStorage e os migra
 * para o IndexedDB. Após a migração bem-sucedida, os dados do
 * localStorage são mantidos como backup.
 */

export async function migrateFromLocalStorage(): Promise<{
  success: boolean;
  migratedItems: number;
  errors: string[];
}> {
  console.log('🔄 Iniciando migração localStorage → IndexedDB...');

  let migratedItems = 0;
  const errors: string[] = [];

  try {
    // ========================================================================
    //                          MIGRAR DADOS DE TREINO
    // ========================================================================

    const workoutData = localStorage.getItem('gym-tracker-workout-state');
    if (workoutData) {
      try {
        const parsed = JSON.parse(workoutData);
        const workoutState: WorkoutState = parsed.data || parsed;

        // Migrar dias de treino
        if (workoutState.workoutDays?.length > 0) {
          await db.workoutDays.bulkPut(workoutState.workoutDays);
          migratedItems += workoutState.workoutDays.length;
          console.log(`✅ ${workoutState.workoutDays.length} dias de treino migrados`);
        }

        // Migrar sessões de treino
        if (workoutState.workoutSessions?.length > 0) {
          await db.workoutSessions.bulkPut(workoutState.workoutSessions);
          migratedItems += workoutState.workoutSessions.length;
          console.log(`✅ ${workoutState.workoutSessions.length} sessões migradas`);
        }

        // Migrar exercícios logados
        if (workoutState.loggedExercises?.length > 0) {
          await db.loggedExercises.bulkPut(workoutState.loggedExercises);
          migratedItems += workoutState.loggedExercises.length;
          console.log(`✅ ${workoutState.loggedExercises.length} exercícios migrados`);
        }

        // Migrar definições de exercícios
        if (workoutState.exerciseDefinitions?.length > 0) {
          await db.exerciseDefinitions.bulkPut(workoutState.exerciseDefinitions);
          migratedItems += workoutState.exerciseDefinitions.length;
          console.log(`✅ ${workoutState.exerciseDefinitions.length} definições migradas`);
        }

        // Salvar dia ativo nas configurações
        if (workoutState.activeDayId) {
          await db.appSettings.put({
            key: 'activeDayId',
            value: workoutState.activeDayId,
          });
        }
      } catch (error) {
        errors.push(`Erro ao migrar dados de treino: ${error}`);
        console.error('❌ Erro na migração de treinos:', error);
      }
    }

    // ========================================================================
    //                          MIGRAR DADOS DE PERFIL
    // ========================================================================

    const profileData = localStorage.getItem('gym-tracker-profile');
    if (profileData) {
      try {
        const parsed: ProfileState = JSON.parse(profileData);

        // Migrar perfil
        if (parsed.profile) {
          await db.userProfile.put(parsed.profile);
          migratedItems += 1;
          console.log('✅ Perfil migrado');
        }

        // Migrar medições
        if (parsed.measurements?.length > 0) {
          await db.bodyMeasurements.bulkPut(parsed.measurements);
          migratedItems += parsed.measurements.length;
          console.log(`✅ ${parsed.measurements.length} medições migradas`);
        }
      } catch (error) {
        errors.push(`Erro ao migrar dados de perfil: ${error}`);
        console.error('❌ Erro na migração de perfil:', error);
      }
    }

    // ========================================================================
    //                          MIGRAR DADOS DE NUTRIÇÃO
    // ========================================================================

    const nutritionData = localStorage.getItem('nutrition-data');
    if (nutritionData) {
      try {
        const parsed = JSON.parse(nutritionData);

        // Migrar entradas de comida
        if (parsed.foodEntries?.length > 0) {
          await db.foodEntries.bulkPut(parsed.foodEntries);
          migratedItems += parsed.foodEntries.length;
          console.log(`✅ ${parsed.foodEntries.length} entradas de comida migradas`);
        }

        // Migrar entradas de água
        if (parsed.waterEntries?.length > 0) {
          await db.waterEntries.bulkPut(parsed.waterEntries);
          migratedItems += parsed.waterEntries.length;
          console.log(`✅ ${parsed.waterEntries.length} entradas de água migradas`);
        }

        // Migrar metas diárias
        if (parsed.dailyGoals) {
          await db.dailyGoals.put({
            id: 'current',
            goals: parsed.dailyGoals,
          });
          migratedItems += 1;
          console.log('✅ Metas diárias migradas');
        }

        // Salvar data selecionada nas configurações
        if (parsed.selectedDate) {
          await db.appSettings.put({
            key: 'selectedNutritionDate',
            value: parsed.selectedDate,
          });
        }
      } catch (error) {
        errors.push(`Erro ao migrar dados de nutrição: ${error}`);
        console.error('❌ Erro na migração de nutrição:', error);
      }
    }

    // ========================================================================
    //                          HISTÓRICO DE NUTRIÇÃO
    // ========================================================================

    const nutritionHistory = localStorage.getItem('nutrition-history');
    if (nutritionHistory) {
      try {
        const parsed = JSON.parse(nutritionHistory);

        // Salvar histórico completo nas configurações (é um objeto grande)
        await db.appSettings.put({
          key: 'nutritionHistory',
          value: parsed,
        });
        migratedItems += 1;
        console.log('✅ Histórico de nutrição migrado');
      } catch (error) {
        errors.push(`Erro ao migrar histórico de nutrição: ${error}`);
        console.error('❌ Erro na migração de histórico:', error);
      }
    }

    // ========================================================================
    //                          METAS DE NUTRIÇÃO
    // ========================================================================

    const nutritionGoals = localStorage.getItem('nutrition_goals');
    if (nutritionGoals) {
      try {
        const parsed = JSON.parse(nutritionGoals);

        await db.appSettings.put({
          key: 'nutritionGoals',
          value: parsed,
        });
        migratedItems += 1;
        console.log('✅ Metas de nutrição migradas');
      } catch (error) {
        errors.push(`Erro ao migrar metas de nutrição: ${error}`);
        console.error('❌ Erro na migração de metas:', error);
      }
    }

    // ========================================================================
    //                          MARCAR MIGRAÇÃO COMPLETA
    // ========================================================================

    if (migratedItems > 0) {
      await db.appSettings.put({
        key: 'migrationCompleted',
        value: {
          date: new Date().toISOString(),
          version: '3.0',
          migratedItems,
        },
      });

      console.log(
        `✅ Migração concluída! ${migratedItems} itens migrados para IndexedDB`
      );

      // NÃO deletar localStorage ainda - manter como backup
      // Você pode adicionar uma opção manual para limpar depois
    }

    return {
      success: errors.length === 0,
      migratedItems,
      errors,
    };
  } catch (error) {
    console.error('❌ Erro crítico na migração:', error);
    return {
      success: false,
      migratedItems,
      errors: [...errors, `Erro crítico: ${error}`],
    };
  }
}

/**
 * 🔍 Verifica se já foi feita a migração
 */
export async function isMigrationCompleted(): Promise<boolean> {
  try {
    const migration = await db.appSettings.get('migrationCompleted');
    return migration !== undefined;
  } catch (error) {
    console.error('Erro ao verificar migração:', error);
    return false;
  }
}

/**
 * 🗑️ Limpa dados do localStorage APÓS confirmar que a migração funcionou
 * CUIDADO: Esta ação é irreversível!
 */
export async function clearLocalStorageBackup(): Promise<void> {
  const confirmMessage = `⚠️ ATENÇÃO!

Você está prestes a DELETAR o backup no localStorage.

Antes de continuar, certifique-se de que:
✅ Seus dados estão no IndexedDB
✅ Você fez um backup exportado
✅ Tudo está funcionando corretamente

Esta ação é IRREVERSÍVEL!

Digite "CONFIRMAR" para prosseguir:`;

  const userInput = prompt(confirmMessage);

  if (userInput === 'CONFIRMAR') {
    localStorage.removeItem('gym-tracker-workout-state');
    localStorage.removeItem('gym-tracker-profile');
    localStorage.removeItem('nutrition-data');
    localStorage.removeItem('nutrition-history');
    localStorage.removeItem('nutrition_goals');
    localStorage.removeItem('gym-tracker-data'); // Formato antigo

    await db.appSettings.put({
      key: 'localStorageCleared',
      value: {
        date: new Date().toISOString(),
      },
    });

    console.log('✅ Backup do localStorage foi limpo');
    alert('✅ Backup do localStorage removido com sucesso!');
  } else {
    console.log('❌ Limpeza do localStorage cancelada');
    alert('❌ Operação cancelada');
  }
}

/**
 * 📊 Verifica o status da migração e retorna estatísticas
 */
export async function getMigrationStatus() {
  const completed = await isMigrationCompleted();
  const migration = await db.appSettings.get('migrationCompleted');

  // Verificar se ainda existem dados no localStorage
  const hasLocalStorageData =
    !!localStorage.getItem('gym-tracker-workout-state') ||
    !!localStorage.getItem('gym-tracker-profile') ||
    !!localStorage.getItem('nutrition-data');

  const migrationValue = migration?.value as { date?: string; migratedItems?: number } | undefined;

  return {
    completed,
    migrationDate: migrationValue?.date || null,
    migratedItems: migrationValue?.migratedItems || 0,
    hasLocalStorageBackup: hasLocalStorageData,
  };
}

// ========================================================================
//                    SEEDING: EXERCISE DEFINITIONS
// ========================================================================

/**
 * 🌱 SEED: Popula a tabela exerciseDefinitions com os exercícios estáticos
 *
 * Esta função verifica se a tabela está vazia e, se estiver, popula com
 * todos os 348+ exercícios do arquivo exerciseDefinitions.ts
 */
export async function seedExerciseDefinitions(): Promise<{
  success: boolean;
  seededCount: number;
  alreadySeeded: boolean;
}> {
  try {
    console.log('🌱 Verificando se exerciseDefinitions precisa de seed...');

    // Verificar se já existem exercícios no banco
    const existingCount = await db.exerciseDefinitions.count();

    if (existingCount > 0) {
      console.log(`✅ Banco já possui ${existingCount} exercícios. Seed não necessário.`);
      return {
        success: true,
        seededCount: existingCount,
        alreadySeeded: true,
      };
    }

    // Banco está vazio, fazer seed
    console.log(`🌱 Banco vazio. Iniciando seed de ${exerciseDefinitions.length} exercícios...`);

    await db.exerciseDefinitions.bulkAdd(exerciseDefinitions);

    console.log(`✅ Seed concluído! ${exerciseDefinitions.length} exercícios adicionados ao banco.`);

    // Marcar que o seed foi feito
    await db.appSettings.put({
      key: 'exerciseDefinitionsSeeded',
      value: {
        date: new Date().toISOString(),
        count: exerciseDefinitions.length,
        version: '1.0',
      },
    });

    return {
      success: true,
      seededCount: exerciseDefinitions.length,
      alreadySeeded: false,
    };
  } catch (error) {
    console.error('❌ Erro ao fazer seed de exerciseDefinitions:', error);
    return {
      success: false,
      seededCount: 0,
      alreadySeeded: false,
    };
  }
}

/**
 * 🔄 ATUALIZAÇÃO: Sincroniza exerciseDefinitions com o arquivo estático
 *
 * Use esta função quando o arquivo exerciseDefinitions.ts for atualizado
 * com novos exercícios. Ela adiciona apenas os exercícios que não existem.
 */
export async function updateExerciseDefinitions(): Promise<{
  success: boolean;
  addedCount: number;
  totalCount: number;
}> {
  try {
    console.log('🔄 Sincronizando exerciseDefinitions com arquivo estático...');

    const existingExercises = await db.exerciseDefinitions.toArray();
    const existingIds = new Set(existingExercises.map((ex) => ex.id));

    // Filtrar apenas exercícios novos
    const newExercises = exerciseDefinitions.filter(
      (ex) => !existingIds.has(ex.id)
    );

    if (newExercises.length === 0) {
      console.log('✅ Nenhum exercício novo para adicionar.');
      return {
        success: true,
        addedCount: 0,
        totalCount: existingExercises.length,
      };
    }

    await db.exerciseDefinitions.bulkAdd(newExercises);

    console.log(`✅ ${newExercises.length} novos exercícios adicionados!`);
    console.log(`📊 Total de exercícios no banco: ${existingExercises.length + newExercises.length}`);

    return {
      success: true,
      addedCount: newExercises.length,
      totalCount: existingExercises.length + newExercises.length,
    };
  } catch (error) {
    console.error('❌ Erro ao atualizar exerciseDefinitions:', error);
    return {
      success: false,
      addedCount: 0,
      totalCount: 0,
    };
  }
}

/**
 * 🔄 RESET COMPLETO: Remove todos os exercícios e reinsere do zero
 *
 * ⚠️ USE COM CUIDADO! Esta função deleta TODOS os exerciseDefinitions
 * e os reinsere do arquivo estático. Útil para atualizar exercícios
 * existentes que mudaram de grupo muscular.
 */
export async function forceResetExerciseDefinitions(): Promise<{
  success: boolean;
  removedCount: number;
  addedCount: number;
  errors?: string[];
}> {
  try {
    console.log('🔄 RESET COMPLETO: Removendo todos os exerciseDefinitions...');

    // Contar quantos exercícios existem antes
    const existingCount = await db.exerciseDefinitions.count();
    console.log(`📊 Exercícios no banco antes do reset: ${existingCount}`);

    // Deletar TODOS os exercícios
    await db.exerciseDefinitions.clear();
    console.log('🗑️ Todos os exerciseDefinitions foram removidos');

    // Aguardar um momento para garantir que o clear foi processado
    await new Promise(resolve => setTimeout(resolve, 100));

    // Reinserir do arquivo estático usando bulkPut (sobrescreve em caso de conflito)
    console.log(`📥 Inserindo ${exerciseDefinitions.length} exercícios do arquivo estático...`);

    let addedCount = 0;
    const errors: string[] = [];

    try {
      // Usar bulkPut ao invés de bulkAdd para evitar erros de constraint
      await db.exerciseDefinitions.bulkPut(exerciseDefinitions);
      addedCount = exerciseDefinitions.length;
      console.log(`✅ Todos os ${exerciseDefinitions.length} exercícios foram inseridos com sucesso!`);
    } catch (bulkError: any) {
      console.warn('⚠️ Erro no bulkPut, tentando inserção individual...', bulkError);

      // Fallback: inserir um por um
      for (const exercise of exerciseDefinitions) {
        try {
          await db.exerciseDefinitions.put(exercise);
          addedCount++;
        } catch (individualError: any) {
          const errorMsg = `Erro ao inserir "${exercise.name}": ${individualError.message}`;
          errors.push(errorMsg);
          console.error('❌', errorMsg);
        }
      }
    }

    console.log(`✅ RESET CONCLUÍDO!`);
    console.log(`   - Removidos: ${existingCount} exercícios`);
    console.log(`   - Adicionados: ${addedCount} exercícios`);
    console.log(`   - Erros: ${errors.length}`);

    if (errors.length > 0) {
      console.log(`⚠️ Exercícios com erro:`);
      errors.forEach(err => console.log(`   - ${err}`));
    }

    // Verificar contagem final
    const finalCount = await db.exerciseDefinitions.count();
    console.log(`   - Total final no banco: ${finalCount} exercícios`);

    // Atualizar configuração de seed
    await db.appSettings.put({
      key: 'exerciseDefinitionsSeeded',
      value: {
        date: new Date().toISOString(),
        count: finalCount,
        version: '2.0-force-reset',
        errors: errors.length,
      },
    });

    return {
      success: errors.length === 0,
      removedCount: existingCount,
      addedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error('❌ Erro crítico ao fazer reset de exerciseDefinitions:', error);
    return {
      success: false,
      removedCount: 0,
      addedCount: 0,
      errors: [String(error)],
    };
  }
}
