// src/components/WorkoutTracker/RecordBadge/RecordBadge.tsx
import { useEffect, useState } from 'react';
import styles from './RecordBadge.module.css';

interface RecordBadgeProps {
  type: 'weight' | 'volume';
  currentValue: number;
  previousRecord: number;
  isVisible: boolean;
}

export function RecordBadge({
  type,
  currentValue,
  previousRecord,
  isVisible,
}: RecordBadgeProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true);
      // Resetar animação após 3 segundos
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const improvement = currentValue - previousRecord;
  const improvementPercentage = ((improvement / previousRecord) * 100).toFixed(1);

  return (
    <div className={`${styles.recordBadge} ${showAnimation ? styles.animate : ''}`}>
      <div className={styles.badgeContent}>
        <div className={styles.badgeIcon}>
          {type === 'weight' ? '🏆' : '💪'}
        </div>
        <div className={styles.badgeText}>
          <div className={styles.badgeTitle}>
            {type === 'weight' ? 'NOVO RECORDE DE PESO!' : 'NOVO RECORDE DE VOLUME!'}
          </div>
          <div className={styles.badgeDetails}>
            <span className={styles.previousValue}>
              {previousRecord.toFixed(1)}
              {type === 'weight' ? 'kg' : ' vol'}
            </span>
            <span className={styles.arrow}>→</span>
            <span className={styles.currentValue}>
              {currentValue.toFixed(1)}
              {type === 'weight' ? 'kg' : ' vol'}
            </span>
            <span className={styles.improvement}>
              (+{improvement.toFixed(1)} / +{improvementPercentage}%)
            </span>
          </div>
        </div>
      </div>
      <div className={styles.confetti}>
        {[...Array(20)].map((_, i) => (
          <div key={i} className={styles.confettiPiece} />
        ))}
      </div>
    </div>
  );
}
