// src/db/index.ts
// Exports centralizados do IndexedDB

// Database principal
export { db, GymTrackerDB } from './database';

// Funções auxiliares
export {
  isIndexedDBSupported,
  clearAllData,
  getDatabaseStats,
  exportAllData,
  importAllData,
} from './database';

// Funções de migração
export {
  migrateFromLocalStorage,
  isMigrationCompleted,
  getMigrationStatus,
  clearLocalStorageBackup,
} from './migrations';

// Hooks
export { useWorkoutDB } from './hooks/useWorkoutDB';
export { useNutritionDB } from './hooks/useNutritionDB';
