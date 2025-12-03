import { useState } from 'react';
import type { StudentLink, StudentMetrics } from '../../types/professional';
import styles from './StudentCardExpanded.module.css';

interface StudentCardExpandedProps {
  link: StudentLink;
  metrics: StudentMetrics | null;
  onViewStudent: (studentId: string) => void;
  onUnlink: (linkId: string, studentName: string) => void;
}

export function StudentCardExpanded({
  link,
  metrics,
  onViewStudent,
  onUnlink,
}: StudentCardExpandedProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getAdherenceColor = (rate: number): string => {
    if (rate >= 80) return '#48bb78'; // Verde
    if (rate >= 60) return '#ed8936'; // Laranja
    return '#e53e3e'; // Vermelho
  };

  const getTrendIcon = (trend: 'increasing' | 'stable' | 'decreasing'): string => {
    if (trend === 'increasing') return '📈';
    if (trend === 'decreasing') return '📉';
    return '➡️';
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  };

  return (
    <div className={styles.studentCard}>
      {/* Header do card */}
      <div className={styles.studentHeader}>
        <div className={styles.studentAvatar}>
          {(link.studentName || link.studentEmail || 'A').charAt(0).toUpperCase()}
        </div>
        <div className={styles.studentInfo}>
          <h3>{link.studentName || 'Aluno'}</h3>
          <p>{link.studentEmail}</p>
        </div>
        <button
          className={styles.expandButton}
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Recolher' : 'Ver mais detalhes'}
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Métricas rápidas sempre visíveis */}
      {metrics && (
        <div className={styles.quickMetrics}>
          <div className={styles.metricBadge}>
            <span className={styles.metricIcon}>🎯</span>
            <div className={styles.metricContent}>
              <span className={styles.metricLabel}>Adesão Semanal</span>
              <span
                className={styles.metricValue}
                style={{ color: getAdherenceColor(metrics.adherence.weeklyRate) }}
              >
                {Math.round(metrics.adherence.weeklyRate)}%
              </span>
            </div>
          </div>

          <div className={styles.metricBadge}>
            <span className={styles.metricIcon}>💪</span>
            <div className={styles.metricContent}>
              <span className={styles.metricLabel}>Treinos/Semana</span>
              <span className={styles.metricValue}>{metrics.frequency.weekly}</span>
            </div>
          </div>

          <div className={styles.metricBadge}>
            <span className={styles.metricIcon}>🔥</span>
            <div className={styles.metricContent}>
              <span className={styles.metricLabel}>Sequência</span>
              <span className={styles.metricValue}>{metrics.adherence.currentStreak} dias</span>
            </div>
          </div>

          {metrics.adherence.daysSinceLastWorkout > 0 && (
            <div className={styles.metricBadge}>
              <span className={styles.metricIcon}>⏰</span>
              <div className={styles.metricContent}>
                <span className={styles.metricLabel}>Último treino</span>
                <span className={styles.metricValue}>
                  há {metrics.adherence.daysSinceLastWorkout}d
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detalhes expandidos */}
      {isExpanded && metrics && (
        <div className={styles.expandedContent}>
          {/* Estatísticas de Performance */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>📊 Performance</h4>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total de Treinos</span>
                <span className={styles.statValue}>
                  {metrics.progress.totalWorkoutsCompleted}
                </span>
              </div>

              <div className={styles.statItem}>
                <span className={styles.statLabel}>Duração Média</span>
                <span className={styles.statValue}>
                  {formatDuration(metrics.progress.averageWorkoutDuration)}
                </span>
              </div>

              <div className={styles.statItem}>
                <span className={styles.statLabel}>Volume Total</span>
                <span className={styles.statValue}>
                  {(metrics.progress.totalVolume / 1000).toFixed(1)}t
                </span>
              </div>

              <div className={styles.statItem}>
                <span className={styles.statLabel}>Tendência</span>
                <span className={styles.statValue}>
                  {getTrendIcon(metrics.progress.volumeTrend)}{' '}
                  {metrics.progress.volumeTrend === 'increasing'
                    ? 'Crescendo'
                    : metrics.progress.volumeTrend === 'decreasing'
                    ? 'Decrescendo'
                    : 'Estável'}
                </span>
              </div>
            </div>
          </div>

          {/* Frequência e Adesão */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>📅 Frequência</h4>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Adesão Mensal</span>
                <span
                  className={styles.statValue}
                  style={{ color: getAdherenceColor(metrics.adherence.monthlyRate) }}
                >
                  {Math.round(metrics.adherence.monthlyRate)}%
                </span>
              </div>

              <div className={styles.statItem}>
                <span className={styles.statLabel}>Treinos Este Mês</span>
                <span className={styles.statValue}>{metrics.frequency.monthly}</span>
              </div>

              <div className={styles.statItem}>
                <span className={styles.statLabel}>Maior Sequência</span>
                <span className={styles.statValue}>
                  {metrics.adherence.longestStreak} dias
                </span>
              </div>

              {metrics.frequency.preferredDays.length > 0 && (
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Dias Preferidos</span>
                  <span className={styles.statValue} style={{ fontSize: '0.75rem' }}>
                    {metrics.frequency.preferredDays.slice(0, 2).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Composição Corporal */}
          {metrics.bodyComposition && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>⚖️ Composição Corporal</h4>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Peso Atual</span>
                  <span className={styles.statValue}>
                    {metrics.bodyComposition.currentWeight.toFixed(1)} kg
                  </span>
                </div>

                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Variação 30d</span>
                  <span
                    className={styles.statValue}
                    style={{
                      color:
                        metrics.bodyComposition.weightChange30Days > 0
                          ? '#48bb78'
                          : metrics.bodyComposition.weightChange30Days < 0
                          ? '#e53e3e'
                          : '#718096',
                    }}
                  >
                    {metrics.bodyComposition.weightChange30Days > 0 ? '+' : ''}
                    {metrics.bodyComposition.weightChange30Days.toFixed(1)} kg
                  </span>
                </div>

                {metrics.bodyComposition.currentBodyFat && (
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Gordura Corporal</span>
                    <span className={styles.statValue}>
                      {metrics.bodyComposition.currentBodyFat.toFixed(1)}%
                    </span>
                  </div>
                )}

                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Última Medição</span>
                  <span className={styles.statValue}>
                    há {metrics.bodyComposition.daysSinceLastMeasurement}d
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Status do Treino */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>🏋️ Status do Treino</h4>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Criado há</span>
                <span className={styles.statValue}>
                  {metrics.currentWorkout.daysSinceCreation} dias
                </span>
              </div>

              <div className={styles.statItem}>
                <span className={styles.statLabel}>Renovação</span>
                <span
                  className={styles.statValue}
                  style={{
                    color: metrics.currentWorkout.needsRenewal ? '#ed8936' : '#48bb78',
                  }}
                >
                  {metrics.currentWorkout.needsRenewal ? '⚠️ Necessária' : '✅ OK'}
                </span>
              </div>
            </div>
          </div>

          {/* Notas e Objetivos */}
          {(link.goals || link.notes) && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>📝 Anotações</h4>
              {link.goals && (
                <div className={styles.noteItem}>
                  <strong>Objetivos:</strong> {link.goals}
                </div>
              )}
              {link.notes && (
                <div className={styles.noteItem}>
                  <strong>Notas:</strong> {link.notes}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Ações */}
      <div className={styles.studentActions}>
        <button
          className={styles.viewButton}
          onClick={() => onViewStudent(link.studentUserId)}
        >
          Ver Dados Completos
        </button>
        <button
          className={styles.unlinkButton}
          onClick={() => onUnlink(link.id, link.studentName || link.studentEmail || 'aluno')}
        >
          Desvincular
        </button>
      </div>
    </div>
  );
}
