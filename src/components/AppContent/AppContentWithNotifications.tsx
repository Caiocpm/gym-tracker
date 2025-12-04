// src/components/AppContent/AppContentWithNotifications.tsx
import { useAppNavigation } from "../../contexts/AppNavigationContext";
import { useProfessional } from "../../hooks/useProfessional";
import { useAuth } from "../../contexts/AuthContext";
import { useFirebaseNotifications } from "../../hooks/useFirebaseNotifications";
import { WorkoutTracker } from "../WorkoutTracker/WorkoutTracker";
import { AdvancedAnalytics } from "../AdvancedAnalytics/AdvancedAnalytics";
import { NutritionTracker } from "../NutritionTracker/NutritionTracker";
import { Profile } from "../Profile/Profile";
import { Settings } from "../Settings/Settings";
import { Groups } from "../Groups/Groups";
import { ProfessionalAccess } from "../ProfessionalAccess/ProfessionalAccess";
import { ProfessionalDashboard } from "../ProfessionalDashboard/ProfessionalDashboard";
import { StudentDashboard } from "../StudentDashboard/StudentDashboard";
import { NotificationCenter } from "../NotificationCenter/NotificationCenter";
import { GlobalTimerToast } from "../GlobalTimerToast/GlobalTimerToast";
import { DevTools } from "../DevTools/DevTools";
import { navigationItems } from "./appContentTypes";
import styles from "./AppContent.module.css";

export function AppContentWithNotifications() {
  const { activeView, setActiveView } = useAppNavigation();
  const { isInProfessionalMode, activeSession } = useProfessional();
  const { currentUser } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useFirebaseNotifications(currentUser?.uid || null);

  const showProfessionalDashboard =
    isInProfessionalMode && !activeSession?.activeStudentId;

  // ✅ Gerenciar navegação de notificações
  const handleNotificationClick = (notification: any) => {
    // Se tem postId ou groupId, navegar para a área de grupos
    if ("postId" in notification || "groupId" in notification) {
      setActiveView("groups");

      // Armazenar dados para navegação no localStorage temporariamente
      const navigationData = {
        groupId: notification.groupId,
        postId: notification.postId,
        timestamp: Date.now(),
      };
      localStorage.setItem("groupNavigationTarget", JSON.stringify(navigationData));
    }
  };

  return (
    <div className={styles.app}>
      <header className={styles.appHeader}>
        <div className={styles.headerTop}>
          <div className={styles.headerBranding}>
            <h1>🏋️ GymTracker</h1>
            <p>Seu companheiro de treino e nutrição</p>
          </div>
          <div className={styles.headerActions}>
            <ProfessionalAccess />
            <NotificationCenter
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onDelete={deleteNotification}
              onNotificationClick={handleNotificationClick}
            />
          </div>
        </div>

        {!showProfessionalDashboard && (
          <div className={styles.viewToggle}>
            {navigationItems.map((item) => (
              <button
                key={item.id}
                className={`${styles.toggleButton} ${
                  activeView === item.id ? styles.active : ""
                }`}
                onClick={() => setActiveView(item.id)}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      <main className={styles.appMain}>
        {showProfessionalDashboard ? (
          <ProfessionalDashboard />
        ) : (
          <>
            {activeView === "dashboard" && <StudentDashboard />}
            {activeView === "workout" && <WorkoutTracker />}
            {activeView === "nutrition" && <NutritionTracker />}
            {activeView === "analytics" && <AdvancedAnalytics />}
            {activeView === "profile" && <Profile />}
            {activeView === "groups" && <Groups />}
            {activeView === "settings" && <Settings />}
          </>
        )}
      </main>

      <nav className={styles.bottomNavigation}>
        <div className={styles.bottomNavContainer}>
          {navigationItems.map((item) => (
            <button
              key={`bottom-${item.id}`}
              className={`${styles.bottomNavItem} ${
                activeView === item.id ? styles.active : ""
              }`}
              onClick={() => setActiveView(item.id)}
            >
              <div className={styles.bottomNavIcon}>{item.icon}</div>
              <div className={styles.bottomNavLabel}>{item.label}</div>
            </button>
          ))}
        </div>
      </nav>

      <GlobalTimerToast />
      <DevTools />
    </div>
  );
}
