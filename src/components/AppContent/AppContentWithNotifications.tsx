// src/components/AppContent/AppContentWithNotifications.tsx
// (Versão corrigida - removendo variável não usada)

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
import type { UnifiedNotification } from "../../types/UnifiedNotification";
import styles from "./AppContent.module.css";
import { useEffect } from "react"; // ✅ Removido useState (não usado)

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
    addTestNotifications,
    clearAll,
    resetTestMode,
    isTestMode,
  } = useFirebaseNotifications(currentUser?.uid || null);

  // ✅ Removido: const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  // O pai não precisa rastrear o estado do modal - o filho gerencia sozinho

  // ✅ Expor para testes no console
  useEffect(() => {
    window.notificationDebug = {
      addTest: addTestNotifications,
      clear: clearAll,
      reset: resetTestMode,
      current: notifications,
      unread: unreadCount,
      isTestMode: isTestMode,
    };

    console.log(
      "%c🔔 Debug de Notificações Ativado!",
      "color: #4ECDC4; font-size: 14px; font-weight: bold;"
    );
    console.log("Use: window.notificationDebug");
  }, [
    notifications,
    unreadCount,
    addTestNotifications,
    clearAll,
    resetTestMode,
    isTestMode,
  ]);

  const showProfessionalDashboard =
    isInProfessionalMode && !activeSession?.activeStudentId;

  // ✅ Gerenciar navegação de notificações com scroll para comentário
  const handleNotificationClick = (notification: UnifiedNotification) => {
    console.log("📌 Notificação clicada:", notification.type);

    // ✅ 1. COMENTÁRIO - Navegar e rolar até comentário
    if (
      notification.type === "comment" ||
      notification.type === "comment_added"
    ) {
      if (
        "postId" in notification &&
        notification.postId &&
        "groupId" in notification &&
        notification.groupId
      ) {
        setActiveView("groups");

        const navigationData = {
          groupId: notification.groupId,
          postId: notification.postId,
          commentId:
            "commentId" in notification ? notification.commentId : undefined,
          timestamp: Date.now(),
          scrollToComment: true,
        };

        localStorage.setItem(
          "groupNavigationTarget",
          JSON.stringify(navigationData)
        );

        console.log("💬 Navegando para comentário:", navigationData);
        markAsRead(notification.id);
        return; // ✅ Removido setIsNotificationModalOpen - filho gerencia
      }
    }

    // ✅ 2. LIKE - Navegar para o post
    if (notification.type === "like" || notification.type === "post_liked") {
      if (
        "postId" in notification &&
        notification.postId &&
        "groupId" in notification &&
        notification.groupId
      ) {
        setActiveView("groups");

        const navigationData = {
          groupId: notification.groupId,
          postId: notification.postId,
          timestamp: Date.now(),
        };

        localStorage.setItem(
          "groupNavigationTarget",
          JSON.stringify(navigationData)
        );

        console.log("❤️ Navegando para post curtido:", navigationData);
        markAsRead(notification.id);
        return; // ✅ Removido setIsNotificationModalOpen
      }
    }

    // ✅ 3. NOVO POST EM GRUPO - Navegar para o grupo
    if (notification.type === "new_post_in_group") {
      if ("groupId" in notification && notification.groupId) {
        setActiveView("groups");

        const navigationData = {
          groupId: notification.groupId,
          postId: "postId" in notification ? notification.postId : undefined,
          timestamp: Date.now(),
        };

        localStorage.setItem(
          "groupNavigationTarget",
          JSON.stringify(navigationData)
        );

        console.log("📸 Navegando para novo post:", navigationData);
        markAsRead(notification.id);
        return; // ✅ Removido setIsNotificationModalOpen
      }
    }

    // ✅ 4. FALLBACK
    if (
      ("postId" in notification && notification.postId) ||
      ("groupId" in notification && notification.groupId)
    ) {
      setActiveView("groups");

      const navigationData = {
        groupId: "groupId" in notification ? notification.groupId : undefined,
        postId: "postId" in notification ? notification.postId : undefined,
        timestamp: Date.now(),
      };

      localStorage.setItem(
        "groupNavigationTarget",
        JSON.stringify(navigationData)
      );

      console.log("🔗 Navegando para notificação:", navigationData);
      markAsRead(notification.id);
      return; // ✅ Removido setIsNotificationModalOpen
    }
  };

  // ✅ Função vazia para onClose (filho chama, mas pai não precisa fazer nada)
  const handleModalClose = () => {
    console.log("🔒 Modal de notificações fechado (pai informado)");
    // Aqui você pode adicionar lógica se precisar (ex: analytics, etc.)
    // Por enquanto, só log para debug
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
              notifications={notifications as UnifiedNotification[]}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onDelete={deleteNotification}
              onNotificationClick={handleNotificationClick}
              onClose={handleModalClose} // ✅ Callback simples para filho
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
