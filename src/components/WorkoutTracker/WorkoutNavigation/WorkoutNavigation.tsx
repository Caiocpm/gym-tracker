// src/components/WorkoutTracker/WorkoutNavigation/WorkoutNavigation.tsx
import { useWorkout } from "../../../contexts/WorkoutContext";
import type { WorkoutDay } from "../../../types";
import styles from "./WorkoutNavigation.module.css";

// ✅ Letras para identificar os treinos
const workoutLabels = ["A", "B", "C", "D", "E", "F", "G"];

export function WorkoutNavigation() {
  const { state, setActiveDay } = useWorkout();
  // ✅ CORREÇÃO: Removido isMobile e useEffect já que não estamos mais usando

  return (
    <div className={styles.workoutNavigationCard}>
      <header className={styles.workoutNavHeader}>
        <h2>Navegação de Treinos</h2>
        <p>
          Selecione o treino que deseja visualizar ou registrar. Cada letra
          representa um treino diferente.
        </p>
      </header>

      <nav className={styles.workoutNavOptions}>
        {state.workoutDays.map((day: WorkoutDay, index) => (
          <button
            key={day.id}
            className={`${styles.workoutNavOption} ${
              state.activeDayId === day.id ? styles.active : ""
            }`}
            onClick={() => setActiveDay(day.id)}
            title={day.name}
          >
            <span className={styles.navOptionLabel}>
              {/* ✅ Sempre mostra a letra, sem lógica de mobile */}
              {workoutLabels[index] || `T${index + 1}`}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
