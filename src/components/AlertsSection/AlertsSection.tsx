import { useState } from 'react';
import type { StudentAlert } from '../../types/professional';
import styles from './AlertsSection.module.css';

interface AlertsSectionProps {
  alerts: StudentAlert[];
  onAlertAction?: (alert: StudentAlert) => void;
  onDismiss?: (alertId: string) => void;
}

export function AlertsSection({ alerts, onAlertAction, onDismiss }: AlertsSectionProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);

  const handleDismiss = (alertId: string) => {
    setDismissed(new Set(dismissed).add(alertId));
    onDismiss?.(alertId);
  };

  const visibleAlerts = alerts.filter((alert) => !dismissed.has(alert.id));

  // Agrupar alertas por severidade
  const urgentAlerts = visibleAlerts.filter((a) => a.severity === 'urgent');
  const warningAlerts = visibleAlerts.filter((a) => a.severity === 'warning');
  const infoAlerts = visibleAlerts.filter((a) => a.severity === 'info');

  if (visibleAlerts.length === 0) {
    return null;
  }

  const getAlertIcon = (type: StudentAlert['type']): string => {
    switch (type) {
      case 'workout_expiring':
        return '📅';
      case 'student_inactive':
        return '😴';
      case 'measurements_overdue':
        return '📏';
      case 'nutrition_inactive':
        return '🍎';
      case 'performance_stagnation':
        return '📊';
      case 'performance_regression':
        return '⚠️';
      case 'excessive_volume':
        return '🏋️';
      case 'goal_deadline':
        return '🎯';
      case 'evaluation_due':
        return '📋';
      default:
        return '🔔';
    }
  };

  const renderAlertGroup = (groupAlerts: StudentAlert[], title: string, className: string) => {
    if (groupAlerts.length === 0) return null;

    // Limitar a 5 alertas por grupo, total de 10 no máximo
    const maxAlertsPerGroup = 5;
    const limitedAlerts = groupAlerts.slice(0, maxAlertsPerGroup);

    return (
      <div className={styles.alertGroup}>
        <h4 className={styles.groupTitle}>
          {title} ({groupAlerts.length})
        </h4>
        <div className={styles.alertsList}>
          {limitedAlerts.map((alert) => (
            <div key={alert.id} className={`${styles.alertCard} ${styles[className]}`}>
              <div className={styles.alertIcon}>{getAlertIcon(alert.type)}</div>
              <div className={styles.alertContent}>
                <div className={styles.alertHeader}>
                  <h5 className={styles.alertTitle}>{alert.title}</h5>
                  <span className={styles.studentName}>{alert.studentName}</span>
                </div>
                <p className={styles.alertDescription}>{alert.description}</p>
              </div>
              <div className={styles.alertActions}>
                {alert.actionLabel && onAlertAction && (
                  <button
                    className={styles.actionButton}
                    onClick={() => onAlertAction(alert)}
                  >
                    {alert.actionLabel}
                  </button>
                )}
                <button
                  className={styles.dismissButton}
                  onClick={() => handleDismiss(alert.id)}
                  title="Dispensar alerta"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          {groupAlerts.length > maxAlertsPerGroup && (
            <div className={styles.moreAlerts}>
              +{groupAlerts.length - maxAlertsPerGroup} alertas ocultos
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.alertsSection}>
      <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h3>🔔 Alertas e Notificações</h3>
          <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
        </div>
        <span className={styles.count}>
          {visibleAlerts.length} {visibleAlerts.length === 1 ? 'alerta' : 'alertas'}
        </span>
      </div>

      {isExpanded && (
        <div className={styles.alertsContent}>
          {renderAlertGroup(urgentAlerts, 'Urgente', 'urgent')}
          {renderAlertGroup(warningAlerts, 'Atenção', 'warning')}
          {renderAlertGroup(infoAlerts, 'Informação', 'info')}
        </div>
      )}
    </div>
  );
}
