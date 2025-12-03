// src/db/database.ts
// Configuração central do IndexedDB usando Dexie

import Dexie, { type Table } from "dexie";
import type {
  WorkoutSession,
  LoggedExercise,
  WorkoutDay,
  ExerciseDefinition,
} from "../types";
import type { FoodEntry, WaterEntry, DailyGoals } from "../types/nutrition";
import type { UserProfile, BodyMeasurements } from "../types/profile";
import type { ProfessionalProfile, StudentLink, StudentInvitation } from "../types/professional";

/**
 * 🎯 EXPLICAÇÃO: IndexedDB vs localStorage
 *
 * IndexedDB é como um "mini banco de dados" no navegador:
 * - Armazena OBJETOS (não precisa JSON.stringify)
 * - Suporta ÍNDICES para buscas rápidas
 * - Operações ASSÍNCRONAS (não trava a UI)
 * - Limite muito maior (50MB - 1GB+)
 */

// ============================================================================
//                          INTERFACES
// ============================================================================

/**
 * 📸 Snapshot diário do treino
 * Armazena um "resumo fotográfico" do treino realizado em cada dia
 */
export interface DailyWorkoutSnapshot {
  id: string; // Ex: "2025-01-15"
  date: string; // ISO date (YYYY-MM-DD)
  workoutDayId: string; // Qual treino foi feito (workout-a, workout-b, etc)
  workoutDayName: string; // Nome do treino ("Treino A - Peito e Tríceps")
  exercises: {
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: number;
    weight: number;
    volume: number;
    rpe?: number;
    completedAt: string;
    loggedExerciseId: string; // Referência ao LoggedExercise original
  }[];
  totalVolume: number; // Volume total do treino (kg)
  totalExercises: number; // Número de exercícios realizados
  duration?: number; // Duração em minutos
  notes?: string; // Observações do dia
  createdAt: string; // Quando o snapshot foi criado
}

/**
 * Interface para dados de backup
 */
interface BackupData {
  version: string;
  exportDate: string;
  data: {
    workoutDays?: WorkoutDay[];
    workoutSessions?: WorkoutSession[];
    loggedExercises?: LoggedExercise[];
    exerciseDefinitions?: ExerciseDefinition[];
    foodEntries?: FoodEntry[];
    waterEntries?: WaterEntry[];
    dailyGoals?: { id: string; goals: DailyGoals }[];
    userProfile?: UserProfile[];
    bodyMeasurements?: BodyMeasurements[];
    dailySnapshots?: DailyWorkoutSnapshot[];
    appSettings?: { key: string; value: unknown }[];
  };
}

// ============================================================================
//                          DEFINIÇÃO DO BANCO DE DADOS
// ============================================================================

export class GymTrackerDB extends Dexie {
  // 📦 Object Stores (como "tabelas" em SQL)

  // TREINOS
  workoutDays!: Table<WorkoutDay, string>;
  workoutSessions!: Table<WorkoutSession, string>;
  loggedExercises!: Table<LoggedExercise, string>;
  exerciseDefinitions!: Table<ExerciseDefinition, string>;

  // NUTRIÇÃO
  foodEntries!: Table<FoodEntry, string>;
  waterEntries!: Table<WaterEntry, string>;
  dailyGoals!: Table<{ id: string; goals: DailyGoals }, string>;

  // PERFIL
  userProfile!: Table<UserProfile, string>;
  bodyMeasurements!: Table<BodyMeasurements, string>;

  // SNAPSHOTS
  dailySnapshots!: Table<DailyWorkoutSnapshot, string>;

  // CONFIGURAÇÕES GERAIS
  appSettings!: Table<{ key: string; value: unknown }, string>;

  // ÁREA PROFISSIONAL
  professionalProfiles!: Table<ProfessionalProfile, string>;
  studentLinks!: Table<StudentLink, string>;
  studentInvitations!: Table<StudentInvitation, string>;

  constructor() {
    super("GymTrackerDB");

    /**
     * 🔧 EXPLICAÇÃO: Versionamento
     *
     * O número da versão deve aumentar quando você mudar a estrutura.
     * Cada versão define quais "tabelas" (stores) existem e seus índices.
     */

    // Versão 1: Estrutura inicial
    this.version(1).stores({
      workoutDays: "id, name",
      workoutSessions: "id, date, dayId",
      loggedExercises: "id, date, exerciseId, workoutDayId",
      exerciseDefinitions: "id, name, muscleGroup",
      foodEntries: "id, date, meal, status",
      waterEntries: "id, date, status",
      dailyGoals: "id",
      userProfile: "id",
      bodyMeasurements: "id, date, userId",
      appSettings: "key",
    });

    // Versão 2: Adicionar dailySnapshots
    this.version(2).stores({
      workoutDays: "id, name",
      workoutSessions: "id, date, dayId",
      loggedExercises: "id, date, exerciseId, workoutDayId",
      exerciseDefinitions: "id, name, muscleGroup",
      foodEntries: "id, date, meal, status",
      waterEntries: "id, date, status",
      dailyGoals: "id",
      userProfile: "id",
      bodyMeasurements: "id, date, userId",
      appSettings: "key",
      dailySnapshots: "id, date, workoutDayId",
    });

    // Versão 3: Adicionar área profissional
    this.version(3).stores({
      workoutDays: "id, name",
      workoutSessions: "id, date, dayId",
      loggedExercises: "id, date, exerciseId, workoutDayId",
      exerciseDefinitions: "id, name, muscleGroup",
      foodEntries: "id, date, meal, status",
      waterEntries: "id, date, status",
      dailyGoals: "id",
      userProfile: "id",
      bodyMeasurements: "id, date, userId",
      appSettings: "key",
      dailySnapshots: "id, date, workoutDayId",
      professionalProfiles: "id, userId, email, isActive",
      studentLinks: "id, professionalId, studentUserId, status",
      studentInvitations: "id, professionalId, studentEmail, invitationCode, status",
    });
  }
}

// ============================================================================
//                          INSTÂNCIA GLOBAL
// ============================================================================

/**
 * Instância única do banco de dados
 * Use esta em todos os lugares do app
 */
export const db = new GymTrackerDB();

// ============================================================================
//                          HELPERS ÚTEIS
// ============================================================================

/**
 * 🔍 Verifica se o IndexedDB está disponível no navegador
 */
export function isIndexedDBSupported(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

/**
 * 🗑️ Limpa TODOS os dados do banco (útil para reset)
 */
export async function clearAllData(): Promise<void> {
  await db.workoutDays.clear();
  await db.workoutSessions.clear();
  await db.loggedExercises.clear();
  await db.exerciseDefinitions.clear();
  await db.foodEntries.clear();
  await db.waterEntries.clear();
  await db.dailyGoals.clear();
  await db.userProfile.clear();
  await db.bodyMeasurements.clear();
  await db.dailySnapshots.clear();
  await db.appSettings.clear();
  await db.professionalProfiles.clear();
  await db.studentLinks.clear();
  await db.studentInvitations.clear();

  console.log("✅ Todos os dados do IndexedDB foram limpos");
}

/**
 * 📊 Retorna estatísticas de uso do banco
 */
export async function getDatabaseStats() {
  const [
    workoutDaysCount,
    workoutSessionsCount,
    loggedExercisesCount,
    foodEntriesCount,
    waterEntriesCount,
    measurementsCount,
    snapshotsCount,
  ] = await Promise.all([
    db.workoutDays.count(),
    db.workoutSessions.count(),
    db.loggedExercises.count(),
    db.foodEntries.count(),
    db.waterEntries.count(),
    db.bodyMeasurements.count(),
    db.dailySnapshots.count(),
  ]);

  return {
    workoutDaysCount,
    workoutSessionsCount,
    loggedExercisesCount,
    foodEntriesCount,
    waterEntriesCount,
    measurementsCount,
    snapshotsCount,
    totalRecords:
      workoutDaysCount +
      workoutSessionsCount +
      loggedExercisesCount +
      foodEntriesCount +
      waterEntriesCount +
      measurementsCount +
      snapshotsCount,
  };
}

// ============================================================================
//                    FUNÇÕES - DAILY SNAPSHOTS
// ============================================================================

/**
 * 📸 Cria um snapshot do treino do dia
 * @param date - Data no formato ISO (YYYY-MM-DD)
 * @param workoutDayId - ID do dia de treino
 * @param workoutDayName - Nome do dia de treino
 */
export async function createDailySnapshot(
  date: string,
  workoutDayId: string,
  workoutDayName: string
): Promise<void> {
  try {
    const dateKey = new Date(date).toISOString().split("T")[0];

    const startOfDay = `${dateKey}T00:00:00.000Z`;
    const endOfDay = `${dateKey}T23:59:59.999Z`;

    const todaysExercises = await db.loggedExercises
      .where("date")
      .between(startOfDay, endOfDay, true, true)
      .toArray();

    if (todaysExercises.length === 0) {
      console.log("⚠️ Nenhum exercício para criar snapshot em", dateKey);
      return;
    }

    const totalVolume = todaysExercises.reduce(
      (sum, ex) => sum + (ex.volume || 0),
      0
    );

    const snapshot: DailyWorkoutSnapshot = {
      id: dateKey,
      date: dateKey,
      workoutDayId,
      workoutDayName,
      exercises: todaysExercises.map((ex) => ({
        exerciseId: ex.exerciseDefinitionId || ex.id,
        exerciseName: ex.exerciseName,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        volume: ex.volume,
        rpe: ex.rpe,
        completedAt: ex.date,
        loggedExerciseId: ex.id,
      })),
      totalVolume,
      totalExercises: todaysExercises.length,
      createdAt: new Date().toISOString(),
    };

    await db.dailySnapshots.put(snapshot);

    console.log("📸 Snapshot diário criado:", {
      date: dateKey,
      exercises: snapshot.totalExercises,
      volume: snapshot.totalVolume,
    });
  } catch (error) {
    console.error("❌ Erro ao criar snapshot diário:", error);
    throw error;
  }
}

/**
 * 📂 Busca snapshot de uma data específica
 * @param date - Data no formato ISO ou string
 * @returns Snapshot do dia ou undefined se não existir
 */
export async function getDailySnapshot(
  date: string
): Promise<DailyWorkoutSnapshot | undefined> {
  try {
    const dateKey = new Date(date).toISOString().split("T")[0];
    return await db.dailySnapshots.get(dateKey);
  } catch (error) {
    console.error("❌ Erro ao buscar snapshot:", error);
    return undefined;
  }
}

/**
 * 📊 Busca snapshots de um período
 * @param startDate - Data inicial
 * @param endDate - Data final
 * @returns Array de snapshots ordenados por data
 */
export async function getSnapshotsByDateRange(
  startDate: string,
  endDate: string
): Promise<DailyWorkoutSnapshot[]> {
  try {
    const start = new Date(startDate).toISOString().split("T")[0];
    const end = new Date(endDate).toISOString().split("T")[0];

    return await db.dailySnapshots
      .where("date")
      .between(start, end, true, true)
      .reverse()
      .toArray();
  } catch (error) {
    console.error("❌ Erro ao buscar snapshots por período:", error);
    return [];
  }
}

/**
 * 📈 Busca últimos N dias de treino
 * @param days - Número de dias (padrão: 7)
 * @returns Array de snapshots dos últimos N dias
 */
export async function getRecentSnapshots(
  days: number = 7
): Promise<DailyWorkoutSnapshot[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await getSnapshotsByDateRange(
      startDate.toISOString(),
      endDate.toISOString()
    );
  } catch (error) {
    console.error("❌ Erro ao buscar snapshots recentes:", error);
    return [];
  }
}

/**
 * 📊 Estatísticas do mês atual
 * @returns Objeto com estatísticas agregadas do mês
 */
export async function getCurrentMonthStats() {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const snapshots = await getSnapshotsByDateRange(
      firstDay.toISOString(),
      lastDay.toISOString()
    );

    return {
      totalWorkouts: snapshots.length,
      totalExercises: snapshots.reduce((sum, s) => sum + s.totalExercises, 0),
      totalVolume: snapshots.reduce((sum, s) => sum + s.totalVolume, 0),
      averageVolume:
        snapshots.length > 0
          ? snapshots.reduce((sum, s) => sum + s.totalVolume, 0) /
            snapshots.length
          : 0,
      workoutsByDay: snapshots.reduce((acc, s) => {
        acc[s.workoutDayName] = (acc[s.workoutDayName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      snapshots,
    };
  } catch (error) {
    console.error("❌ Erro ao calcular estatísticas mensais:", error);
    return {
      totalWorkouts: 0,
      totalExercises: 0,
      totalVolume: 0,
      averageVolume: 0,
      workoutsByDay: {},
      snapshots: [],
    };
  }
}

/**
 * 📅 Busca todos os snapshots de um treino específico
 * @param workoutDayId - ID do dia de treino
 * @returns Array de snapshots desse treino
 */
export async function getSnapshotsByWorkoutDay(
  workoutDayId: string
): Promise<DailyWorkoutSnapshot[]> {
  try {
    return await db.dailySnapshots
      .where("workoutDayId")
      .equals(workoutDayId)
      .reverse()
      .toArray();
  } catch (error) {
    console.error("❌ Erro ao buscar snapshots por treino:", error);
    return [];
  }
}

/**
 * 🗑️ Remove snapshot de uma data específica
 * @param date - Data do snapshot a remover
 */
export async function deleteDailySnapshot(date: string): Promise<void> {
  try {
    const dateKey = new Date(date).toISOString().split("T")[0];
    await db.dailySnapshots.delete(dateKey);
    console.log("✅ Snapshot removido:", dateKey);
  } catch (error) {
    console.error("❌ Erro ao remover snapshot:", error);
    throw error;
  }
}

// ============================================================================
//                          EXPORTAR/IMPORTAR DADOS
// ============================================================================

/**
 * 📤 Exporta TODOS os dados do IndexedDB para JSON
 * (útil para backup)
 */
export async function exportAllData() {
  const [
    workoutDays,
    workoutSessions,
    loggedExercises,
    exerciseDefinitions,
    foodEntries,
    waterEntries,
    dailyGoals,
    userProfile,
    bodyMeasurements,
    dailySnapshots,
    appSettings,
  ] = await Promise.all([
    db.workoutDays.toArray(),
    db.workoutSessions.toArray(),
    db.loggedExercises.toArray(),
    db.exerciseDefinitions.toArray(),
    db.foodEntries.toArray(),
    db.waterEntries.toArray(),
    db.dailyGoals.toArray(),
    db.userProfile.toArray(),
    db.bodyMeasurements.toArray(),
    db.dailySnapshots.toArray(),
    db.appSettings.toArray(),
  ]);

  return {
    version: "3.0-indexeddb",
    exportDate: new Date().toISOString(),
    data: {
      workoutDays,
      workoutSessions,
      loggedExercises,
      exerciseDefinitions,
      foodEntries,
      waterEntries,
      dailyGoals,
      userProfile,
      bodyMeasurements,
      dailySnapshots,
      appSettings,
    },
  };
}

/**
 * 📥 Importa dados de um backup JSON para o IndexedDB
 */
export async function importAllData(backupData: BackupData): Promise<void> {
  const { data } = backupData;

  await db.transaction(
    "rw",
    [
      db.workoutDays,
      db.workoutSessions,
      db.loggedExercises,
      db.exerciseDefinitions,
      db.foodEntries,
      db.waterEntries,
      db.dailyGoals,
      db.userProfile,
      db.bodyMeasurements,
      db.dailySnapshots,
      db.appSettings,
    ],
    async () => {
      await clearAllData();

      if (data.workoutDays) await db.workoutDays.bulkAdd(data.workoutDays);
      if (data.workoutSessions)
        await db.workoutSessions.bulkAdd(data.workoutSessions);
      if (data.loggedExercises)
        await db.loggedExercises.bulkAdd(data.loggedExercises);
      if (data.exerciseDefinitions)
        await db.exerciseDefinitions.bulkAdd(data.exerciseDefinitions);
      if (data.foodEntries) await db.foodEntries.bulkAdd(data.foodEntries);
      if (data.waterEntries) await db.waterEntries.bulkAdd(data.waterEntries);
      if (data.dailyGoals) await db.dailyGoals.bulkAdd(data.dailyGoals);
      if (data.userProfile) await db.userProfile.bulkAdd(data.userProfile);
      if (data.bodyMeasurements)
        await db.bodyMeasurements.bulkAdd(data.bodyMeasurements);
      if (data.dailySnapshots)
        await db.dailySnapshots.bulkAdd(data.dailySnapshots);
      if (data.appSettings) await db.appSettings.bulkAdd(data.appSettings);
    }
  );

  console.log("✅ Dados importados com sucesso para IndexedDB");
}
