// src/components/StudentDashboard/StudentDashboard.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useFirebaseNotifications } from "../../hooks/useFirebaseNotifications";
import { useConversations } from "../../hooks/useConversations";
import { useStudentGoals } from "../../hooks/useStudentGoals";
import { useEvaluationSchedule } from "../../hooks/useEvaluationSchedule";
import { ChatConversation } from "../ChatConversation/ChatConversation";
import { ConversationCard } from "../ConversationCard/ConversationCard";
import type {
  Conversation,
  StudentGoal,
  EvaluationSchedule,
} from "../../types/professional";
import type { Notification } from "../../types/professional";
import type { Notification as SocialNotification } from "../../types/social";

// Tipo unificado que combina ambas as notificações
type UnifiedNotification = (Notification | SocialNotification) & {
  read?: boolean;
  isRead?: boolean;
};
import styles from "./StudentDashboard.module.css";

export function StudentDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "overview" | "conversations" | "goals" | "evaluations" | "groups"
  >("overview");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // ✅ Hooks para dados
  const { notifications } = useFirebaseNotifications(currentUser?.uid || null);
  const {
    conversations,
    loadConversations,
    addMessage,
    markAsRead,
  } = useConversations();
  const { goals, loadStudentGoals } = useStudentGoals();
  const { evaluations, loadEvaluations } = useEvaluationSchedule();

  // ✅ Carregar dados ao montar
  useEffect(() => {
    if (!currentUser?.uid) return;

    console.log("📥 [StudentDashboard] Carregando dados...");
    loadConversations();
    loadStudentGoals(currentUser.uid);
    loadEvaluations(currentUser.uid);

    // ✅ Auto-reload a cada 15 segundos
    const interval = setInterval(() => {
      console.log("🔄 [StudentDashboard] Recarregando dados...");
      loadConversations();
      loadStudentGoals(currentUser.uid);
      loadEvaluations(currentUser.uid);
    }, 15000);

    return () => clearInterval(interval);
  }, [currentUser?.uid, loadConversations, loadStudentGoals, loadEvaluations]);

  // ✅ Handlers para conversas
  const handleSendMessage = async (conversationId: string, content: string) => {
    if (!currentUser) return;
    try {
      const studentName = currentUser.displayName || currentUser.email || "Aluno";
      await addMessage(conversationId, currentUser.uid, "student", studentName, content);
    } catch (err) {
      console.error("❌ Erro ao enviar mensagem:", err);
    }
  };

  const handleMarkConversationAsRead = async (conversationId: string) => {
    if (!currentUser) return;
    await markAsRead(conversationId, currentUser.uid, "student");
  };

  // ✅ Calcular estatísticas
  const unreadConversations = conversations.filter(
    (conv) => conv.unreadCount.student > 0
  ).length;

  const stats = {
    totalConversations: conversations.length,
    unreadConversations,
    totalGoals: goals.length,
    completedGoals: goals.filter((g) => {
      const progress =
        ((g.currentValue - g.startValue) / (g.targetValue - g.startValue)) *
        100;
      return progress >= 100;
    }).length,
    upcomingEvaluations: evaluations.filter((e) => {
      return new Date(e.scheduledDate) > new Date();
    }).length,
  };

  // ✅ Renderizar badge (ponto vermelho)
  const renderTabBadge = (hasItems: boolean) => {
    if (!hasItems) return null;
    return <span className={styles.tabBadge} />;
  };

  return (
    <div className={styles.dashboard}>
      {/* ✅ Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Dashboard Profissional</h1>
          <p>Acompanhe suas notificações profissionais</p>
        </div>
      </div>

      {/* ✅ Abas de navegação */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsHeader}></div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "overview" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("overview")}
          >
            <span>📊</span>
            <span>Visão Geral</span>
          </button>

          <button
            className={`${styles.tab} ${
              activeTab === "conversations" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("conversations")}
          >
            <span>💬</span>
            <span>Conversas</span>
            {renderTabBadge(stats.unreadConversations > 0)}
          </button>

          <button
            className={`${styles.tab} ${
              activeTab === "goals" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("goals")}
          >
            <span>🎯</span>
            <span>Metas</span>
            {renderTabBadge(stats.totalGoals > 0)}
          </button>

          <button
            className={`${styles.tab} ${
              activeTab === "evaluations" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("evaluations")}
          >
            <span>📋</span>
            <span>Avaliações</span>
            {renderTabBadge(stats.upcomingEvaluations > 0)}
          </button>

          <button
            className={`${styles.tab} ${
              activeTab === "groups" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("groups")}
          >
            <span>👥</span>
            <span>Grupos</span>
          </button>
        </div>
      </div>

      {/* ✅ Conteúdo das abas */}
      <div className={styles.content}>
        {/* Visão Geral */}
        {activeTab === "overview" && (
          <OverviewTab stats={stats} notifications={notifications} />
        )}

        {/* Conversas */}
        {activeTab === "conversations" && (
          <ConversationsTab
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
            onSendMessage={handleSendMessage}
            onMarkAsRead={handleMarkConversationAsRead}
            currentUser={currentUser}
          />
        )}

        {/* Metas */}
        {activeTab === "goals" && <GoalsTab goals={goals} />}

        {/* Avaliações */}
        {activeTab === "evaluations" && (
          <EvaluationsTab evaluations={evaluations} />
        )}

        {/* Grupos */}
        {activeTab === "groups" && <GroupsTab />}
      </div>
    </div>
  );
}

// ✅ Aba: Visão Geral
interface OverviewTabProps {
  stats: {
    totalConversations: number;
    unreadConversations: number;
    totalGoals: number;
    completedGoals: number;
    upcomingEvaluations: number;
  };
  notifications: UnifiedNotification[];
}

function OverviewTab({ stats, notifications }: OverviewTabProps) {
  return (
    <div className={styles.section}>
      <h2>Visão Geral do Progresso</h2>

      {/* Cards de estatísticas */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💬</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {stats.unreadConversations > 0
                ? `${stats.unreadConversations} não lidas`
                : stats.totalConversations}
            </div>
            <div className={styles.statLabel}>Conversas</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {stats.completedGoals}/{stats.totalGoals}
            </div>
            <div className={styles.statLabel}>Metas Completadas</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📋</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.upcomingEvaluations}</div>
            <div className={styles.statLabel}>Avaliações Próximas</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🔔</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {notifications.filter((n) => !n.read).length}
            </div>
            <div className={styles.statLabel}>Não Lidas</div>
          </div>
        </div>
      </div>

      {/* Notificações recentes */}
      <div className={styles.recentNotifications}>
        <h3>Notificações Recentes</h3>
        {notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Nenhuma notificação no momento</p>
          </div>
        ) : (
          <div className={styles.notificationsList}>
            {notifications.slice(0, 5).map((notif) => (
              <div key={notif.id} className={styles.notificationItem}>
                <div className={styles.notificationDot} />
                <div>
                  <div className={styles.notificationTitle}>{notif.title}</div>
                  <div className={styles.notificationPreview}>
                    {notif.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ✅ Aba: Conversas
interface ConversationsTabProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation | null) => void;
  onSendMessage: (conversationId: string, content: string) => Promise<void>;
  onMarkAsRead: (conversationId: string) => Promise<void>;
  currentUser: any;
}

function ConversationsTab({
  conversations,
  selectedConversation,
  onSelectConversation,
  onSendMessage,
  onMarkAsRead,
  currentUser,
}: ConversationsTabProps) {
  if (selectedConversation) {
    return (
      <ChatConversation
        conversation={selectedConversation}
        student={{ studentName: "Você" } as any}
        currentUserId={currentUser?.uid || ""}
        currentUserType="student"
        currentUserName={currentUser?.displayName || currentUser?.email || "Aluno"}
        onSendMessage={onSendMessage}
        onMarkAsRead={onMarkAsRead}
        onArchive={async () => {}}
        onUnarchive={async () => {}}
        onDelete={async () => {}}
        onClose={() => onSelectConversation(null)}
      />
    );
  }

  return (
    <div className={styles.section}>
      <h2>Minhas Conversas</h2>

      {conversations.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💬</div>
          <p>Nenhuma conversa ainda</p>
          <p className={styles.emptySubtext}>
            Seu profissional iniciará conversas para acompanhar seu progresso
          </p>
        </div>
      ) : (
        <div className={styles.conversationsList}>
          {conversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              studentName="Com seu profissional"
              onClick={() => onSelectConversation(conversation)}
              currentUserType="student"
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ✅ Aba: Metas
interface GoalsTabProps {
  goals: StudentGoal[];
}

function GoalsTab({ goals }: GoalsTabProps) {
  return (
    <div className={styles.section}>
      <h2>Minhas Metas</h2>

      {goals.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎯</div>
          <p>Nenhuma meta ainda</p>
          <p className={styles.emptySubtext}>
            Seu profissional criará metas para você acompanhar
          </p>
        </div>
      ) : (
        <div className={styles.goalsList}>
          {goals.map((goal) => {
            const progress = Math.min(
              100,
              Math.max(
                0,
                ((goal.currentValue - goal.startValue) /
                  (goal.targetValue - goal.startValue)) *
                  100
              )
            );
            const isCompleted = progress >= 100;

            return (
              <div
                key={goal.id}
                className={`${styles.goalCard} ${
                  isCompleted ? styles.completed : ""
                }`}
              >
                <div className={styles.goalHeader}>
                  <h3 className={styles.goalTitle}>{goal.title}</h3>
                  {isCompleted && (
                    <span className={styles.completedBadge}>✓ Concluída</span>
                  )}
                </div>

                {goal.description && (
                  <p className={styles.goalDescription}>{goal.description}</p>
                )}

                {/* Barra de progresso */}
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className={styles.progressText}>
                    {progress.toFixed(0)}%
                  </div>
                </div>

                {/* Valores */}
                <div className={styles.goalValues}>
                  <div>
                    <span className={styles.label}>Atual:</span>
                    <span className={styles.value}>
                      {goal.currentValue} {goal.unit}
                    </span>
                  </div>
                  <div>
                    <span className={styles.label}>Alvo:</span>
                    <span className={styles.value}>
                      {goal.targetValue} {goal.unit}
                    </span>
                  </div>
                  <div>
                    <span className={styles.label}>Até:</span>
                    <span className={styles.value}>
                      {new Date(goal.targetDate).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ✅ Aba: Avaliações
interface EvaluationsTabProps {
  evaluations: EvaluationSchedule[];
}

function EvaluationsTab({ evaluations }: EvaluationsTabProps) {
  const upcoming = evaluations.filter(
    (e) => new Date(e.scheduledDate) > new Date()
  );
  const past = evaluations.filter(
    (e) => new Date(e.scheduledDate) <= new Date()
  );

  return (
    <div className={styles.section}>
      <h2>Minhas Avaliações</h2>

      {evaluations.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <p>Nenhuma avaliação agendada</p>
          <p className={styles.emptySubtext}>
            Seu profissional agendará avaliações para acompanhar seu progresso
          </p>
        </div>
      ) : (
        <>
          {/* Avaliações futuras */}
          {upcoming.length > 0 && (
            <div className={styles.evaluationsSection}>
              <h3 className={styles.sectionTitle}>📅 Próximas Avaliações</h3>
              <div className={styles.evaluationsList}>
                {upcoming.map((evaluation) => (
                  <div key={evaluation.id} className={styles.evaluationCard}>
                    <div className={styles.evalHeader}>
                      <h4 className={styles.evalTitle}>{evaluation.title}</h4>
                      <span className={styles.evalType}>{evaluation.type}</span>
                    </div>
                    <div className={styles.evalMeta}>
                      <span className={styles.evalDateTime}>
                        📅{" "}
                        {new Date(evaluation.scheduledDate).toLocaleDateString(
                          "pt-BR"
                        )}{" "}
                        às {evaluation.scheduledTime}
                      </span>
                      {evaluation.location && (
                        <span className={styles.evalLocation}>
                          📍 {evaluation.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avaliações passadas */}
          {past.length > 0 && (
            <div className={styles.evaluationsSection}>
              <h3 className={styles.sectionTitle}>✓ Avaliações Realizadas</h3>
              <div className={styles.evaluationsList}>
                {past.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className={`${styles.evaluationCard} ${styles.past}`}
                  >
                    <div className={styles.evalHeader}>
                      <h4 className={styles.evalTitle}>{evaluation.title}</h4>
                      <span className={styles.evalType}>{evaluation.type}</span>
                    </div>
                    <div className={styles.evalMeta}>
                      <span className={styles.evalDateTime}>
                        📅{" "}
                        {new Date(evaluation.scheduledDate).toLocaleDateString(
                          "pt-BR"
                        )}{" "}
                        às {evaluation.scheduledTime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ✅ Aba: Grupos (placeholder para futura implementação)
function GroupsTab() {
  return (
    <div className={styles.section}>
      <h2>Meus Grupos</h2>
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>👥</div>
        <p>Seção de Grupos</p>
        <p className={styles.emptySubtext}>
          Esta seção será implementada em breve para você compartilhar
          experiências com outros alunos
        </p>
      </div>
    </div>
  );
}
