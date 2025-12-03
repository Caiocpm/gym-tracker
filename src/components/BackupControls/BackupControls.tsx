// src/components/BackupControls/BackupControls.tsx

import React from "react";
import { useWorkout } from "../../contexts/WorkoutContext";
import { useProfile } from "../../contexts/ProfileProviderIndexedDB";
import type {
  WorkoutState,
  WorkoutDay,
  LoggedExercise,
  WorkoutSession,
  ExerciseDefinition,
  WorkoutProgress,
  CompletedExerciseInfo,
} from "../../types";
import type { UserProfile, BodyMeasurements } from "../../types/profile";
import "./BackupControls.css";

interface ExportData {
  version: string;
  exportDate: string;
  appName: string;
  workout: WorkoutState;
  profile: {
    profile: UserProfile | null;
    measurements: BodyMeasurements[];
  };
}

interface ImportedData {
  version?: string;
  exportDate?: string;
  appName?: string;
  // Novo formato (v2.0)
  workout?: {
    workoutDays: WorkoutDay[];
    workoutSessions: WorkoutSession[];
    loggedExercises: LoggedExercise[];
    activeDayId: string | null;
    exerciseDefinitions: ExerciseDefinition[];
    // ✅ CORRIGIDO: Usar tipos corretos do index.ts
    exerciseProgress?: WorkoutProgress;
    completedExercises?: Record<string, CompletedExerciseInfo>;
  };
  profile?: {
    profile: UserProfile | null;
    measurements: BodyMeasurements[];
  };
  // Formato antigo (v1.0)
  data?: {
    workoutDays: WorkoutDay[];
    activeDay: string;
    exerciseHistory: LoggedExercise[];
  };
}

export function BackupControls() {
  const { state: workoutState, dispatch: workoutDispatch } = useWorkout();
  const {
    state: profileState,
    clearAllData: clearProfileData,
    importData: importProfileData,
  } = useProfile();

  const exportData = () => {
    try {
      const dataToExport: ExportData = {
        version: "2.0",
        exportDate: new Date().toISOString(),
        appName: "GymTracker",
        workout: workoutState,
        profile: {
          profile: profileState.profile,
          measurements: profileState.measurements,
        },
      };

      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `gymtracker-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      alert("✅ Backup completo exportado com sucesso! (Treinos + Perfil)");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      alert("❌ Erro ao exportar backup");
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== "string") {
          alert("❌ Erro ao ler arquivo");
          return;
        }

        const importedData: ImportedData = JSON.parse(result);

        if (
          importedData.version === "2.0" &&
          importedData.workout &&
          importedData.profile
        ) {
          const processedLoggedExercises: LoggedExercise[] =
            importedData.workout.loggedExercises.map(
              (entry: LoggedExercise) => ({
                ...entry,
                date: new Date(entry.date).toISOString(),
              })
            );

          const processedWorkoutData: WorkoutState = {
            workoutDays: importedData.workout.workoutDays || [],
            workoutSessions: importedData.workout.workoutSessions || [],
            loggedExercises: processedLoggedExercises,
            activeDayId: importedData.workout.activeDayId || "workout-a",
            exerciseDefinitions: importedData.workout.exerciseDefinitions || [],
            activeExecution: undefined,
            timerState: undefined,
            activeExercise: null,
            // ✅ CORRIGIDO: Usar tipos corretos
            exerciseProgress: importedData.workout.exerciseProgress || {},
            completedExercises: importedData.workout.completedExercises || {},
            dismissedToasts: {},
          };

          workoutDispatch({
            type: "LOAD_DATA",
            payload: processedWorkoutData,
          });

          if (
            importedData.profile.profile ||
            importedData.profile.measurements?.length > 0
          ) {
            await importProfileData(
              importedData.profile.profile || null,
              importedData.profile.measurements || []
            );
          }

          alert("✅ Backup completo importado com sucesso! (Treinos + Perfil)");
        } else if (importedData.data && importedData.version === "1.0") {
          const processedHistory: LoggedExercise[] =
            importedData.data.exerciseHistory.map((entry: LoggedExercise) => ({
              ...entry,
              date: new Date(entry.date).toISOString(),
            }));

          const processedData: WorkoutState = {
            workoutDays: importedData.data.workoutDays,
            activeDayId: importedData.data.activeDay || "workout-a",
            loggedExercises: processedHistory,
            workoutSessions: [],
            exerciseDefinitions: [],
            activeExecution: undefined,
            timerState: undefined,
            activeExercise: null,
            exerciseProgress: {},
            completedExercises: {},
            dismissedToasts: {},
          };

          workoutDispatch({
            type: "LOAD_DATA",
            payload: processedData,
          });

          alert(
            "✅ Backup de treinos importado com sucesso!\n⚠️ Este backup não contém dados de perfil e foi adaptado para a nova estrutura."
          );
        } else {
          alert("❌ Arquivo de backup inválido ou formato não reconhecido");
        }
      } catch (error) {
        console.error("Erro ao importar:", error);
        alert(
          "❌ Erro ao importar backup. Verifique se o arquivo está correto."
        );
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  const clearAllData = async () => {
    const confirmMessage = `⚠️ ATENÇÃO: Esta ação irá apagar TODOS os dados:

• Todos os treinos e exercícios planejados
• Histórico de exercícios registrados
• Sessões de treino
• Definições de exercícios
• Dados pessoais do perfil
• Histórico de medidas corporais

Esta ação é IRREVERSÍVEL!

Digite "CONFIRMAR" para prosseguir:`;

    const userInput = prompt(confirmMessage);

    if (userInput === "CONFIRMAR") {
      const resetData: WorkoutState = {
        workoutDays: [
          { id: "workout-a", name: "Treino A", exercises: [] },
          { id: "workout-b", name: "Treino B", exercises: [] },
          { id: "workout-c", name: "Treino C", exercises: [] },
        ],
        activeDayId: "workout-a",
        loggedExercises: [],
        workoutSessions: [],
        exerciseDefinitions: [],
        activeExecution: undefined,
        timerState: undefined,
        activeExercise: null,
        exerciseProgress: {},
        completedExercises: {},
        dismissedToasts: {},
      };

      workoutDispatch({
        type: "LOAD_DATA",
        payload: resetData,
      });

      await clearProfileData();

      localStorage.removeItem("gym-tracker-workout-state");
      localStorage.removeItem("gym-tracker-data");
      localStorage.removeItem("gym-tracker-profile");

      alert("✅ Todos os dados foram apagados com sucesso!");
    } else {
      alert("❌ Operação cancelada. Nenhum dado foi alterado.");
    }
  };

  const totalPlannedExercises = workoutState.workoutDays.reduce(
    (total: number, day: WorkoutDay) => total + day.exercises.length,
    0
  );

  const totalProfileData =
    (profileState.profile ? 1 : 0) + profileState.measurements.length;

  const totalProgressData = Object.keys(
    workoutState.exerciseProgress || {}
  ).length;
  const totalCompletedData = Object.keys(
    workoutState.completedExercises || {}
  ).length;

  const totalData =
    totalPlannedExercises +
    workoutState.loggedExercises.length +
    workoutState.workoutSessions.length +
    workoutState.exerciseDefinitions.length +
    totalProfileData +
    totalProgressData +
    totalCompletedData;

  return (
    <div className="backup-controls">
      <h4>🔧 Controles de Backup</h4>

      <div className="backup-actions">
        <button
          onClick={exportData}
          className="backup-btn export"
          disabled={totalData === 0}
        >
          📤 Exportar Backup Completo
        </button>

        <label className="backup-btn import">
          📥 Importar Backup
          <input type="file" accept=".json" onChange={importData} />
        </label>

        <button
          onClick={clearAllData}
          className="backup-btn clear"
          disabled={totalData === 0}
        >
          🗑️ Limpar Todos os Dados
        </button>
      </div>

      <div className="backup-info">
        <p>
          📊 Total de dados: <strong>{totalData}</strong>
        </p>
        <p>
          🏋️ Treinos: <strong>{totalPlannedExercises}</strong> planejados,{" "}
          <strong>{workoutState.loggedExercises.length}</strong> registrados,{" "}
          <strong>{workoutState.workoutSessions.length}</strong> sessões,{" "}
          <strong>{workoutState.exerciseDefinitions.length}</strong> definições
        </p>
        <p>
          📈 Progresso: <strong>{totalProgressData}</strong> em andamento,{" "}
          <strong>{totalCompletedData}</strong> completos
        </p>
        <p>
          👤 Perfil:{" "}
          <strong>
            {profileState.profile ? "1 perfil" : "Não configurado"}
          </strong>
          , <strong>{profileState.measurements.length}</strong> medições
        </p>
      </div>

      {totalData === 0 && (
        <div className="backup-empty">
          <p>📝 Nenhum dado para fazer backup</p>
          <p>Adicione treinos ou configure seu perfil primeiro</p>
        </div>
      )}
    </div>
  );
}
