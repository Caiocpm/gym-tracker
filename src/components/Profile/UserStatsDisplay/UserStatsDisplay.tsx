// src/components/Profile/UserStatsDisplay/UserStatsDisplay.tsx
import type { UserStats } from "../../../types/social";
import styles from "./UserStatsDisplay.module.css";

interface UserStatsDisplayProps {
  stats: UserStats;
  isLoading?: boolean;
}

export function UserStatsDisplay({ stats, isLoading }: UserStatsDisplayProps) {
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando estatísticas...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 🏋️ Seção de Treinos */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>🏋️ Treinos</h3>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💪</div>
            <div className={styles.statValue}>{stats.totalWorkouts}</div>
            <div className={styles.statLabel}>Treinos Completos</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📝</div>
            <div className={styles.statValue}>{stats.totalExercises}</div>
            <div className={styles.statLabel}>Exercícios</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎯</div>
            <div className={styles.statValue}>{stats.totalSets}</div>
            <div className={styles.statLabel}>Séries</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔢</div>
            <div className={styles.statValue}>{stats.totalReps.toLocaleString()}</div>
            <div className={styles.statLabel}>Repetições</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⚖️</div>
            <div className={styles.statValue}>
              {(stats.totalVolumeLifted / 1000).toFixed(1)}t
            </div>
            <div className={styles.statLabel}>Volume Total</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏱️</div>
            <div className={styles.statValue}>
              {Math.floor(stats.totalWorkoutTime / 60)}h
            </div>
            <div className={styles.statLabel}>Tempo Total</div>
          </div>
        </div>
      </div>

      {/* 🔥 Seção de Consistência */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>🔥 Consistência</h3>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔥</div>
            <div className={styles.statValue}>{stats.currentStreak}</div>
            <div className={styles.statLabel}>Sequência Atual</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏆</div>
            <div className={styles.statValue}>{stats.longestStreak}</div>
            <div className={styles.statLabel}>Maior Sequência</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statValue}>
              {stats.averageWorkoutDuration.toFixed(0)}min
            </div>
            <div className={styles.statLabel}>Duração Média</div>
          </div>
          {stats.lastWorkout && (
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📅</div>
              <div className={styles.statValue}>
                {new Date(stats.lastWorkout).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })}
              </div>
              <div className={styles.statLabel}>Último Treino</div>
            </div>
          )}
        </div>
      </div>

      {/* 🏅 Seção de Recordes */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>🏅 Recordes</h3>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⭐</div>
            <div className={styles.statValue}>{stats.totalPersonalRecords}</div>
            <div className={styles.statLabel}>Recordes Batidos</div>
          </div>
          {stats.strongestLift && (
            <div className={`${styles.statCard} ${styles.highlightCard}`}>
              <div className={styles.statIcon}>💪</div>
              <div className={styles.statValue}>{stats.strongestLift.weight}kg</div>
              <div className={styles.statLabel}>Maior Peso</div>
              <div className={styles.statDetail}>{stats.strongestLift.exerciseName}</div>
            </div>
          )}
          {stats.highestVolume && (
            <div className={`${styles.statCard} ${styles.highlightCard}`}>
              <div className={styles.statIcon}>📈</div>
              <div className={styles.statValue}>
                {(stats.highestVolume.volume / 1000).toFixed(1)}t
              </div>
              <div className={styles.statLabel}>Maior Volume</div>
              <div className={styles.statDetail}>{stats.highestVolume.workoutName}</div>
            </div>
          )}
        </div>
      </div>

      {/* 👥 Seção Social */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>👥 Social</h3>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statValue}>{stats.totalGroups}</div>
            <div className={styles.statLabel}>Grupos</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎯</div>
            <div className={styles.statValue}>{stats.totalChallengesJoined}</div>
            <div className={styles.statLabel}>Desafios Participados</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statValue}>{stats.totalChallengesCompleted}</div>
            <div className={styles.statLabel}>Desafios Completos</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏆</div>
            <div className={styles.statValue}>{stats.totalBadges}</div>
            <div className={styles.statLabel}>Badges</div>
          </div>
        </div>
      </div>

      {/* 📊 Seção de Composição Corporal */}
      {(stats.weightChange || stats.bodyFatChange || stats.muscleMassChange) && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>📊 Composição Corporal</h3>
          </div>
          <div className={styles.statsGrid}>
            {stats.weightChange && (
              <div className={styles.statCard}>
                <div className={styles.statIcon}>⚖️</div>
                <div
                  className={`${styles.statValue} ${
                    stats.weightChange.change > 0
                      ? styles.positive
                      : stats.weightChange.change < 0
                      ? styles.negative
                      : ""
                  }`}
                >
                  {stats.weightChange.change > 0 ? "+" : ""}
                  {stats.weightChange.change.toFixed(1)}
                  {stats.weightChange.unit}
                </div>
                <div className={styles.statLabel}>Mudança de Peso</div>
                <div className={styles.statDetail}>
                  {stats.weightChange.start.toFixed(1)} → {stats.weightChange.current.toFixed(1)}
                  {stats.weightChange.unit}
                </div>
              </div>
            )}
            {stats.bodyFatChange && (
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📉</div>
                <div
                  className={`${styles.statValue} ${
                    stats.bodyFatChange.change < 0 ? styles.positive : styles.negative
                  }`}
                >
                  {stats.bodyFatChange.change > 0 ? "+" : ""}
                  {stats.bodyFatChange.change.toFixed(1)}%
                </div>
                <div className={styles.statLabel}>Mudança de Gordura</div>
                <div className={styles.statDetail}>
                  {stats.bodyFatChange.start.toFixed(1)}% → {stats.bodyFatChange.current.toFixed(1)}%
                </div>
              </div>
            )}
            {stats.muscleMassChange && (
              <div className={styles.statCard}>
                <div className={styles.statIcon}>💪</div>
                <div
                  className={`${styles.statValue} ${
                    stats.muscleMassChange.change > 0 ? styles.positive : styles.negative
                  }`}
                >
                  {stats.muscleMassChange.change > 0 ? "+" : ""}
                  {stats.muscleMassChange.change.toFixed(1)}
                  {stats.muscleMassChange.unit}
                </div>
                <div className={styles.statLabel}>Mudança de Massa</div>
                <div className={styles.statDetail}>
                  {stats.muscleMassChange.start.toFixed(1)} →{" "}
                  {stats.muscleMassChange.current.toFixed(1)}
                  {stats.muscleMassChange.unit}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 👤 Informações de Membro */}
      <div className={styles.memberInfo}>
        <p>
          👤 Membro desde{" "}
          <strong>
            {new Date(stats.memberSince).toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
          </strong>
        </p>
      </div>
    </div>
  );
}
