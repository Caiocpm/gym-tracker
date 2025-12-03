// src/components/Groups/ChallengeCard/ChallengeCard.tsx
import { useMemo } from "react";
import type { GroupChallenge } from "../../../types/social";
import styles from "./ChallengeCard.module.css";

interface ChallengeCardProps {
  challenge: GroupChallenge;
  currentUserId?: string;
  onJoin?: () => void;
  onDelete?: () => void;
}

export function ChallengeCard({
  challenge,
  currentUserId,
  onJoin,
  onDelete,
}: ChallengeCardProps) {
  // ✅ Calcular dias restantes
  const daysRemaining = useMemo(() => {
    const end = new Date(challenge.endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [challenge.endDate]);

  // ✅ Verificar se usuário já está participando
  const isParticipating = useMemo(() => {
    return challenge.participants.some((p) => p.userId === currentUserId);
  }, [challenge.participants, currentUserId]);

  // ✅ Obter progresso do usuário atual
  const userProgress = useMemo(() => {
    return challenge.participants.find((p) => p.userId === currentUserId);
  }, [challenge.participants, currentUserId]);

  // ✅ Calcular percentual de progresso
  const progressPercentage = useMemo(() => {
    if (challenge.type === "collaborative") {
      return Math.min(
        100,
        ((challenge.collectiveProgress || 0) /
          (challenge.collectiveTarget || challenge.targetValue)) *
          100
      );
    }
    if (userProgress) {
      return Math.min(100, (userProgress.progress / challenge.targetValue) * 100);
    }
    return 0;
  }, [challenge, userProgress]);

  // ✅ Ícone baseado no tipo
  const getTypeIcon = () => {
    switch (challenge.type) {
      case "volume":
        return "🏋️";
      case "consistency":
        return "🔥";
      case "records":
        return "🏆";
      case "exercise":
        return "💪";
      case "collaborative":
        return "👥";
      default:
        return "🎯";
    }
  };

  // ✅ Cor baseada no tipo
  const getTypeColor = () => {
    switch (challenge.type) {
      case "volume":
        return "#667eea";
      case "consistency":
        return "#f56565";
      case "records":
        return "#ffd700";
      case "exercise":
        return "#48bb78";
      case "collaborative":
        return "#9f7aea";
      default:
        return "#718096";
    }
  };

  // ✅ Texto do tipo
  const getTypeLabel = () => {
    switch (challenge.type) {
      case "volume":
        return "Volume Total";
      case "consistency":
        return "Consistência";
      case "records":
        return "Recordes";
      case "exercise":
        return "Exercício";
      case "collaborative":
        return "Coletivo";
      default:
        return "";
    }
  };

  const isCreator = currentUserId === challenge.createdBy;

  return (
    <div className={styles.challengeCard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.typeInfo}>
          <span className={styles.typeIcon}>{getTypeIcon()}</span>
          <span
            className={styles.typeLabel}
            style={{ color: getTypeColor() }}
          >
            {getTypeLabel()}
          </span>
        </div>
        {isCreator && onDelete && (
          <button
            className={styles.deleteButton}
            onClick={onDelete}
            title="Deletar desafio"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Title & Description */}
      <h3 className={styles.title}>{challenge.title}</h3>
      <p className={styles.description}>{challenge.description}</p>

      {/* Exercício específico (se aplicável) */}
      {challenge.exerciseName && (
        <div className={styles.exerciseTag}>
          📝 {challenge.exerciseName}
        </div>
      )}

      {/* Progress Bar */}
      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>
            {challenge.type === "collaborative" ? "Progresso Coletivo" : "Seu Progresso"}
          </span>
          <span className={styles.progressValue}>
            {progressPercentage.toFixed(0)}%
          </span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${progressPercentage}%`,
              backgroundColor: getTypeColor(),
            }}
          />
        </div>
        <div className={styles.progressStats}>
          <span>
            {challenge.type === "collaborative"
              ? (challenge.collectiveProgress || 0).toFixed(0)
              : userProgress?.progress || 0}{" "}
            / {challenge.targetValue} {challenge.targetUnit}
          </span>
        </div>
      </div>

      {/* Leaderboard (se competitivo e participando) */}
      {challenge.isCompetitive && isParticipating && (
        <div className={styles.leaderboardPreview}>
          <div className={styles.leaderboardTitle}>🏅 Top 3</div>
          {challenge.participants
            .sort((a, b) => b.progress - a.progress)
            .slice(0, 3)
            .map((participant, index) => (
              <div
                key={participant.userId}
                className={`${styles.leaderboardItem} ${
                  participant.userId === currentUserId
                    ? styles.currentUser
                    : ""
                }`}
              >
                <span className={styles.rank}>#{index + 1}</span>
                <span className={styles.userName}>{participant.userName}</span>
                <span className={styles.userProgress}>
                  {participant.progress.toFixed(0)} {challenge.targetUnit}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>👥</span>
          <span className={styles.statText}>
            {challenge.totalParticipants} participantes
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>✅</span>
          <span className={styles.statText}>
            {challenge.completedCount} completaram
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>⏰</span>
          <span className={styles.statText}>
            {daysRemaining} dias restantes
          </span>
        </div>
      </div>

      {/* Reward (se houver) */}
      {challenge.reward && (
        <div className={styles.reward}>
          🎁 Recompensa: {challenge.reward}
        </div>
      )}

      {/* Action Button */}
      {!isParticipating && onJoin && challenge.status === "active" && (
        <button className={styles.joinButton} onClick={onJoin}>
          Participar do Desafio
        </button>
      )}

      {isParticipating && userProgress?.completedAt && (
        <div className={styles.completedBadge}>
          ✅ Desafio Completado!
        </div>
      )}
    </div>
  );
}
