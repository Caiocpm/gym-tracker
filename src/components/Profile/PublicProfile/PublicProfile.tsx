// src/components/Profile/PublicProfile/PublicProfile.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useProfile } from "../../../contexts/ProfileProviderIndexedDB";
import { useUserStats } from "../../../hooks/useUserStats";
import { useUserBadges } from "../../../hooks/useUserBadges";
import { BadgeGallery } from "../BadgeGallery/BadgeGallery";
import { UserStatsDisplay } from "../UserStatsDisplay/UserStatsDisplay";
import { PrivacySettings } from "../PrivacySettings/PrivacySettings";
import { db } from "../../../db/database";
import type { ProfilePrivacySettings, UserChallengeBadge } from "../../../types/social";
import styles from "./PublicProfile.module.css";

type ProfileTab = "stats" | "badges" | "privacy";

export function PublicProfile() {
  const { currentUser } = useAuth();
  const { state } = useProfile();
  const { stats, loading: statsLoading, refreshStats } = useUserStats();
  const { getUserBadges } = useUserBadges();

  const [activeTab, setActiveTab] = useState<ProfileTab>("stats");
  const [badges, setBadges] = useState<UserChallengeBadge[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);

  // Default privacy settings
  const [privacySettings] = useState<ProfilePrivacySettings>({
    badges: "public",
    stats: "public",
    workoutHistory: "friends",
    progressPhotos: "friends",
    measurements: "private",
    groups: "public",
  });

  // ✅ Carregar badges ao montar o componente
  useEffect(() => {
    const loadBadges = async () => {
      if (!currentUser) return;
      setBadgesLoading(true);
      const userBadges = await getUserBadges();
      setBadges(userBadges);
      setBadgesLoading(false);
    };

    loadBadges();
  }, [currentUser, getUserBadges]);

  // 🧹 Função de debug para limpar dados de treino
  const handleClearWorkoutData = async () => {
    if (!window.confirm("⚠️ Isso vai limpar TODOS os dados de treino do IndexedDB. Tem certeza?")) {
      return;
    }

    try {
      await db.loggedExercises.clear();
      await db.workoutSessions.clear();
      await db.dailySnapshots.clear();
      await db.workoutDays.clear(); // ✅ Limpar também os workoutDays

      console.log("✅ Dados de treino limpos do IndexedDB");
      alert("✅ Dados limpos! Recarregue a página para atualizar as estatísticas.");

      // Recarregar estatísticas
      refreshStats();
    } catch (error) {
      console.error("❌ Erro ao limpar dados:", error);
      alert("❌ Erro ao limpar dados. Veja o console.");
    }
  };

  if (!currentUser) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p>Você precisa estar logado para ver seu perfil público.</p>
        </div>
      </div>
    );
  }

  // Usar dados do Firebase Auth como fallback
  const displayName = state.profile?.name || currentUser.displayName || "Usuário";
  const bio = undefined; // Bio não está disponível em UserProfile
  const photoURL = currentUser.photoURL;

  return (
    <div className={styles.container}>
      {/* Header do Perfil */}
      <div className={styles.profileHeader}>
        <div className={styles.profileBanner}>
          <div className={styles.profileAvatarWrapper}>
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName}
                className={styles.profileAvatar}
              />
            ) : (
              <div className={styles.profileAvatarPlaceholder}>
                {displayName[0]?.toUpperCase() || "U"}
              </div>
            )}
          </div>
        </div>

        <div className={styles.profileInfo}>
          <h1 className={styles.profileName}>{displayName}</h1>
          {bio && <p className={styles.profileBio}>{bio}</p>}

          {/* Quick Stats */}
          <div className={styles.quickStats}>
            <div className={styles.quickStat}>
              <div className={styles.quickStatValue}>
                {statsLoading ? "..." : stats?.totalWorkouts || 0}
              </div>
              <div className={styles.quickStatLabel}>Treinos</div>
            </div>
            <div className={styles.quickStat}>
              <div className={styles.quickStatValue}>
                {badgesLoading ? "..." : badges.length}
              </div>
              <div className={styles.quickStatLabel}>Badges</div>
            </div>
            <div className={styles.quickStat}>
              <div className={styles.quickStatValue}>
                {statsLoading ? "..." : stats?.totalGroups || 0}
              </div>
              <div className={styles.quickStatLabel}>Grupos</div>
            </div>
            <div className={styles.quickStat}>
              <div className={styles.quickStatValue}>
                {statsLoading ? "..." : stats?.totalChallengesCompleted || 0}
              </div>
              <div className={styles.quickStatLabel}>Desafios</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de Navegação */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === "stats" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          📊 Estatísticas
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "badges" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("badges")}
        >
          🏆 Badges ({badges.length})
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "privacy" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("privacy")}
        >
          🔒 Privacidade
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      <div className={styles.tabContent}>
        {activeTab === "stats" && stats && (
          <div className={styles.statsSection}>
            <UserStatsDisplay stats={stats} isLoading={statsLoading} />
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button className={styles.refreshButton} onClick={() => refreshStats()}>
                🔄 Atualizar Estatísticas
              </button>
              <button
                className={styles.refreshButton}
                onClick={handleClearWorkoutData}
                style={{ backgroundColor: "#dc3545" }}
              >
                🧹 Limpar Dados de Treino (DEBUG)
              </button>
            </div>
          </div>
        )}

        {activeTab === "badges" && (
          <div className={styles.badgesSection}>
            <BadgeGallery badges={badges} isLoading={badgesLoading} />
          </div>
        )}

        {activeTab === "privacy" && (
          <div className={styles.privacySection}>
            <PrivacySettings settings={privacySettings} />
          </div>
        )}
      </div>
    </div>
  );
}
