// src/components/Profile/BadgeGallery/BadgeGallery.tsx
import { useMemo } from "react";
import type { UserChallengeBadge } from "../../../types/social";
import styles from "./BadgeGallery.module.css";

interface BadgeGalleryProps {
  badges: UserChallengeBadge[];
  isLoading?: boolean;
}

export function BadgeGallery({ badges, isLoading }: BadgeGalleryProps) {
  // ✅ Agrupar badges por categoria
  const badgesByCategory = useMemo(() => {
    return {
      volume: badges.filter((b) => b.badgeCategory === "volume"),
      consistency: badges.filter((b) => b.badgeCategory === "consistency"),
      records: badges.filter((b) => b.badgeCategory === "records"),
      exercise: badges.filter((b) => b.badgeCategory === "exercise"),
      collaborative: badges.filter((b) => b.badgeCategory === "collaborative"),
      special: badges.filter((b) => b.badgeCategory === "special"),
    };
  }, [badges]);

  // ✅ Estatísticas
  const stats = useMemo(() => {
    const byRarity = {
      common: badges.filter((b) => b.badgeRarity === "common").length,
      rare: badges.filter((b) => b.badgeRarity === "rare").length,
      epic: badges.filter((b) => b.badgeRarity === "epic").length,
      legendary: badges.filter((b) => b.badgeRarity === "legendary").length,
    };

    return {
      total: badges.length,
      byRarity,
    };
  }, [badges]);

  // ✅ Obter cor da raridade
  const getRarityColor = (rarity: UserChallengeBadge["badgeRarity"]) => {
    switch (rarity) {
      case "common":
        return "#718096";
      case "rare":
        return "#3182ce";
      case "epic":
        return "#9f7aea";
      case "legendary":
        return "#ffd700";
      default:
        return "#718096";
    }
  };

  // ✅ Obter texto da raridade
  const getRarityLabel = (rarity: UserChallengeBadge["badgeRarity"]) => {
    switch (rarity) {
      case "common":
        return "Comum";
      case "rare":
        return "Raro";
      case "epic":
        return "Épico";
      case "legendary":
        return "Lendário";
      default:
        return "";
    }
  };

  // ✅ Obter nome da categoria
  const getCategoryName = (category: UserChallengeBadge["badgeCategory"]) => {
    switch (category) {
      case "volume":
        return "Volume";
      case "consistency":
        return "Consistência";
      case "records":
        return "Recordes";
      case "exercise":
        return "Exercício";
      case "collaborative":
        return "Coletivo";
      case "special":
        return "Especial";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className={styles.gallery}>
        <div className={styles.loading}>Carregando badges...</div>
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className={styles.gallery}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🏆</div>
          <h3>Nenhum Badge Conquistado</h3>
          <p>Complete desafios para ganhar badges incríveis!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gallery}>
      {/* Header com Estatísticas */}
      <div className={styles.statsHeader}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.byRarity.legendary}</div>
          <div className={styles.statLabel}>Lendários</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.byRarity.epic}</div>
          <div className={styles.statLabel}>Épicos</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.byRarity.rare}</div>
          <div className={styles.statLabel}>Raros</div>
        </div>
      </div>

      {/* Badges Agrupados por Categoria */}
      {Object.entries(badgesByCategory).map(([category, categoryBadges]) => {
        if (categoryBadges.length === 0) return null;

        return (
          <div key={category} className={styles.categorySection}>
            <div className={styles.categoryHeader}>
              <h3>{getCategoryName(category as UserChallengeBadge["badgeCategory"])}</h3>
              <span className={styles.categoryCount}>{categoryBadges.length}</span>
            </div>

            <div className={styles.badgesGrid}>
              {categoryBadges.map((badge) => (
                <div
                  key={badge.id}
                  className={styles.badgeCard}
                  style={{
                    borderColor: getRarityColor(badge.badgeRarity),
                  }}
                >
                  <div className={styles.badgeIconWrapper}>
                    <div className={styles.badgeIcon}>{badge.badgeIcon}</div>
                    <div
                      className={styles.rarityBadge}
                      style={{
                        backgroundColor: getRarityColor(badge.badgeRarity),
                      }}
                    >
                      {getRarityLabel(badge.badgeRarity)}
                    </div>
                  </div>

                  <div className={styles.badgeInfo}>
                    <h4 className={styles.badgeName}>{badge.badgeName}</h4>
                    {badge.challengeTitle && (
                      <p className={styles.challengeTitle}>
                        🎯 {badge.challengeTitle}
                      </p>
                    )}
                    <p className={styles.earnedDate}>
                      Conquistado em {new Date(badge.earnedAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
