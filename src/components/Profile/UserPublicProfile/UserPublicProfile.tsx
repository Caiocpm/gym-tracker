// src/components/Profile/UserPublicProfile/UserPublicProfile.tsx
import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db as firebaseDb } from "../../../config/firebase";
import { useUserBadges } from "../../../hooks/useUserBadges";
import { BadgeGallery } from "../BadgeGallery/BadgeGallery";
import { UserStatsDisplay } from "../UserStatsDisplay/UserStatsDisplay";
import type { User, UserChallengeBadge, UserStats, WorkoutPost } from "../../../types/social";
import styles from "./UserPublicProfile.module.css";

interface UserPublicProfileProps {
  userId: string;
  onClose: () => void;
}

type ProfileTab = "stats" | "badges";

export function UserPublicProfile({ userId, onClose }: UserPublicProfileProps) {
  const { getUserBadges } = useUserBadges();

  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<UserChallengeBadge[]>([]);
  const [userPosts, setUserPosts] = useState<WorkoutPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>("stats");

  useEffect(() => {
    const loadUserProfile = async () => {
      setLoading(true);
      try {
        console.log("📊 Carregando perfil público para userId:", userId);

        // 1. Buscar perfil do usuário do Firestore
        const profileDoc = await getDoc(doc(firebaseDb, "userProfiles", userId));

        if (profileDoc.exists()) {
          const profileData = profileDoc.data() as User;
          setUserProfile(profileData);
          console.log("✅ Perfil encontrado:", profileData);
        } else {
          console.log("⚠️ Perfil não encontrado no Firestore, usando dados básicos");
        }

        // 2. Buscar posts do usuário para calcular estatísticas
        const postsQuery = query(
          collection(firebaseDb, "posts"),
          where("userId", "==", userId)
        );
        const postsSnapshot = await getDocs(postsQuery);
        const userPosts = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as WorkoutPost[];

        console.log(`📝 ${userPosts.length} posts encontrados`);
        setUserPosts(userPosts);

        // 3. Calcular estatísticas dos posts
        let totalWorkouts = userPosts.length;
        let totalExercises = 0;
        let totalSets = 0;
        let totalReps = 0;
        let totalVolumeLifted = 0;
        let totalPersonalRecords = 0;

        userPosts.forEach(post => {
          totalExercises += post.exercises.length;
          post.exercises.forEach(exercise => {
            totalSets += exercise.sets.length;
            exercise.sets.forEach(set => {
              totalReps += set.reps;
              totalVolumeLifted += set.weight * set.reps;
            });
          });
          if (post.records) {
            totalPersonalRecords += post.records.length;
          }
        });

        // 4. Buscar dados sociais
        const [groupsSnapshot, allChallengesSnapshot, userBadges] = await Promise.all([
          getDocs(
            query(collection(firebaseDb, "groupMembers"), where("userId", "==", userId))
          ),
          getDocs(collection(firebaseDb, "groupChallenges")),
          getUserBadges(userId),
        ]);

        const totalGroups = groupsSnapshot.size;

        // Filtrar desafios onde o usuário participa
        let totalChallengesJoined = 0;
        let totalChallengesCompleted = 0;

        allChallengesSnapshot.forEach((doc) => {
          const challenge = doc.data();
          const participant = challenge.participants?.find(
            (p: { userId: string; completedAt?: string }) => p.userId === userId
          );

          if (participant) {
            totalChallengesJoined++;
            if (participant.completedAt) {
              totalChallengesCompleted++;
            }
          }
        });

        // 5. Montar objeto de estatísticas
        const userStats: UserStats = {
          totalWorkouts,
          totalExercises,
          totalSets,
          totalReps,
          totalVolumeLifted,
          totalWorkoutTime: 0,
          averageWorkoutDuration: 0,
          longestStreak: 0,
          currentStreak: 0,
          totalPersonalRecords,
          strongestLift: null,
          highestVolume: null,
          totalGroups,
          totalChallengesJoined,
          totalChallengesCompleted,
          totalBadges: userBadges.length,
          memberSince: profileDoc.exists()
            ? (profileDoc.data() as User).createdAt
            : new Date().toISOString(),
          lastWorkout: userPosts.length > 0
            ? userPosts[0].workoutDate
            : undefined,
        };

        console.log("✅ Estatísticas calculadas:", userStats);
        setStats(userStats);
        setBadges(userBadges);

      } catch (error) {
        console.error("❌ Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [userId, getUserBadges]);

  if (loading) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.loading}>Carregando perfil...</div>
        </div>
      </div>
    );
  }

  // Fallback: Se não tem perfil no Firestore, buscar info dos posts
  const displayName = userProfile?.displayName ||
    (userPosts.length > 0 ? userPosts[0].userName : null) ||
    "Usuário";
  const bio = userProfile?.bio;
  const photoURL = userProfile?.photoURL ||
    (userPosts.length > 0 ? userPosts[0].userPhotoURL : null);

  console.log("🔍 Debug UserPublicProfile:");
  console.log("  - userProfile:", userProfile);
  console.log("  - stats:", stats);
  console.log("  - userPosts:", userPosts);
  console.log("  - badges:", badges);
  console.log("  - displayName:", displayName);
  console.log("  - photoURL:", photoURL);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>

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
                    {stats?.totalWorkouts || 0}
                  </div>
                  <div className={styles.quickStatLabel}>Treinos</div>
                </div>
                <div className={styles.quickStat}>
                  <div className={styles.quickStatValue}>
                    {badges.length}
                  </div>
                  <div className={styles.quickStatLabel}>Badges</div>
                </div>
                <div className={styles.quickStat}>
                  <div className={styles.quickStatValue}>
                    {stats?.totalGroups || 0}
                  </div>
                  <div className={styles.quickStatLabel}>Grupos</div>
                </div>
                <div className={styles.quickStat}>
                  <div className={styles.quickStatValue}>
                    {stats?.totalChallengesCompleted || 0}
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
          </div>

          {/* Conteúdo das Tabs */}
          <div className={styles.tabContent}>
            {activeTab === "stats" && stats && (
              <div className={styles.statsSection}>
                <UserStatsDisplay stats={stats} isLoading={false} />
              </div>
            )}

            {activeTab === "badges" && (
              <div className={styles.badgesSection}>
                <BadgeGallery badges={badges} isLoading={false} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
