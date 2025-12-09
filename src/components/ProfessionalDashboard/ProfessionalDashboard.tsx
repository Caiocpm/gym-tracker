// src/components/ProfessionalDashboard/ProfessionalDashboard.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useProfessional } from "../../hooks/useProfessional";
import { useAuth } from "../../contexts/AuthContext";
import { useTags } from "../../hooks/useTags";
import { useConversations } from "../../hooks/useConversations";
import { useStudentGoals } from "../../hooks/useStudentGoals";
import { useEvaluationSchedule } from "../../hooks/useEvaluationSchedule";
import { useProfessionalStats } from "../../hooks/useProfessionalStats";
import { seedProfessionalData } from "../../utils/seedProfessionalData";
import {
  calculateStudentMetrics,
  generateStudentAlerts,
} from "../../hooks/useStudentMetrics";
import { AlertsSection } from "../AlertsSection/AlertsSection";
import { StudentCardExpanded } from "../StudentCardExpanded/StudentCardExpanded";
import type {
  StudentAlert,
  StudentMetrics,
  StudentNote,
  StudentGoal,
  EvaluationSchedule,
} from "../../types/professional";
import styles from "./ProfessionalDashboard.module.css";

// Importar os novos componentes
import { ConversationCard } from "../ConversationCard/ConversationCard";
import { ChatConversation } from "../ChatConversation/ChatConversation";
import { GoalCard } from "../GoalCard/GoalCard";
import { EvaluationCard } from "../EvaluationCard/EvaluationCard";
import type { Conversation } from "../../types/professional";

export function ProfessionalDashboard() {
  const {
    studentLinks,
    pendingInvitations,
    inviteStudent,
    unlinkStudent,
    loadPendingInvitations,
    loadStudentLinks,
    switchToStudent,
  } = useProfessional();
  const { currentUser } = useAuth();

  // ✅ Hooks dos 5 sistemas
  const { tags, loadTags, createTag, addTagToStudent, removeTagFromStudent } = useTags();
  const {
    conversations,
    loadConversations,
    createConversation,
    addMessage,
    markAsRead,
    archiveConversation,
    unarchiveConversation,
    deleteConversation,
  } = useConversations();
  const { goals, loadStudentGoals, createGoal, updateGoal, deleteGoal } =
    useStudentGoals();
  const {
    evaluations,
    loadEvaluations,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
  } = useEvaluationSchedule();
  const { stats, loadStats } = useProfessionalStats();

  // Estados do formulário de convite
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteAccessLevel, setInviteAccessLevel] = useState<
    "full" | "workout_only" | "nutrition_only" | "analytics_only"
  >("full");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para métricas e alertas
  const [studentsMetrics, setStudentsMetrics] = useState<
    Map<string, StudentMetrics>
  >(new Map());
  const [allAlerts, setAllAlerts] = useState<StudentAlert[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  // Estado para abas
  const [activeTab, setActiveTab] = useState<
    "students" | "tags" | "conversations" | "goals" | "evaluations" | "stats"
  >("students");

  // ✅ Estados para formulários dos 5 sistemas
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#45B7D1");
  const [newTagDescription, setNewTagDescription] = useState("");

  const [showNewConversationForm, setShowNewConversationForm] = useState(false);
  const [selectedStudentForConversation, setSelectedStudentForConversation] = useState<
    string | null
  >(null);
  const [conversationTitle, setConversationTitle] = useState("");
  const [conversationInitialMessage, setConversationInitialMessage] = useState("");
  const [conversationCategory, setConversationCategory] = useState<
    "general" | "training" | "nutrition" | "evaluation" | "other"
  >("general");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [selectedStudentForGoal, setSelectedStudentForGoal] = useState<
    string | null
  >(null);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalCategory, setGoalCategory] = useState<
    | "weight"
    | "strength"
    | "endurance"
    | "flexibility"
    | "habit"
    | "body_composition"
    | "other"
  >("weight");
  const [goalTargetValue, setGoalTargetValue] = useState("");
  const [goalUnit, setGoalUnit] = useState("kg");
  const [goalCurrentValue, setGoalCurrentValue] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");

  const [showNewEvaluationForm, setShowNewEvaluationForm] = useState(false);
  const [selectedStudentForEval, setSelectedStudentForEval] = useState<
    string | null
  >(null);
  const [evalTitle, setEvalTitle] = useState("");
  const [evalType, setEvalType] = useState<
    "fitness" | "nutrition" | "progress" | "other"
  >("fitness");
  const [evalDate, setEvalDate] = useState("");
  const [evalTime, setEvalTime] = useState("");
  const [evalDuration, setEvalDuration] = useState("60");
  const [evalLocation, setEvalLocation] = useState("");

  // ✅ useRef para garantir que carrega apenas UMA VEZ
  const hasLoadedInitialData = useRef(false);

  // Helper para encontrar o aluno por ID
  const getStudentById = useCallback(
    (studentId: string) => {
      const student = studentLinks.find(
        (link) => link.studentUserId === studentId
      );
      return student;
    },
    [studentLinks]
  );

  // ✅ Carregar todos os dados ao montar o componente - UMA VEZ APENAS
  useEffect(() => {
    // ✅ Executar apenas uma vez
    if (hasLoadedInitialData.current) return;
    hasLoadedInitialData.current = true;

    console.log("📥 [ProfessionalDashboard] Carregando dados iniciais...");
    loadTags();
    loadEvaluations();
    loadStats();
    loadConversations();
    loadStudentGoals();

    // ✅ Auto-reload a cada 60 segundos
    const interval = setInterval(() => {
      console.log(
        "🔄 [ProfessionalDashboard] Recarregando dados (intervalo)..."
      );
      loadTags();
      loadEvaluations();
      loadStats();
      loadConversations();
      loadStudentGoals();
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [loadTags, loadEvaluations, loadStats, loadConversations, loadStudentGoals]);

  // ✅ Carregar métricas dos alunos
  useEffect(() => {
    const loadMetrics = async () => {
      if (studentLinks.length === 0) return;

      setIsLoadingMetrics(true);
      const metricsMap = new Map<string, StudentMetrics>();
      const alerts: StudentAlert[] = [];

      for (const link of studentLinks) {
        try {
          const metrics = await calculateStudentMetrics(link.studentUserId);
          if (metrics) {
            metrics.studentName =
              link.studentName || link.studentEmail || "Aluno";
            metricsMap.set(link.studentUserId, metrics);

            const studentAlerts = generateStudentAlerts(link, metrics);
            alerts.push(...studentAlerts);
          }
        } catch (error) {
          console.error(
            `❌ Erro ao calcular métricas para ${link.studentName}:`,
            error
          );
        }
      }

      setStudentsMetrics(metricsMap);
      setAllAlerts(alerts);
      setIsLoadingMetrics(false);
    };

    loadMetrics();
  }, [studentLinks]);

  // ✅ Criar tag
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName) {
      setError("Nome da tag é obrigatório");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setSuccess("");

      await createTag(newTagName, newTagColor, newTagDescription);
      await loadTags();

      setSuccess("✅ Tag criada com sucesso!");
      setNewTagName("");
      setNewTagDescription("");
      setNewTagColor("#45B7D1");
      setShowNewTagForm(false);
    } catch (err) {
      console.error("❌ Erro ao criar tag:", err);
      const message = err instanceof Error ? err.message : "Erro ao criar tag";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };


  // ✅ Criar conversa
  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForConversation || !conversationTitle || !conversationInitialMessage) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setSuccess("");

      const professionalId = currentUser?.uid;
      if (!professionalId) {
        throw new Error("Usuário não identificado");
      }

      const studentLink = studentLinks.find(
        (link) => link.studentUserId === selectedStudentForConversation
      );

      if (!studentLink) {
        throw new Error("Aluno não encontrado");
      }

      await createConversation(
        studentLink.id,
        professionalId,
        selectedStudentForConversation,
        conversationTitle,
        conversationCategory,
        conversationInitialMessage
      );

      await loadConversations();

      setSuccess("✅ Conversa criada com sucesso!");
      setConversationTitle("");
      setConversationInitialMessage("");
      setConversationCategory("general");
      setSelectedStudentForConversation(null);
      setShowNewConversationForm(false);
    } catch (err) {
      console.error("❌ Erro ao criar conversa:", err);
      const message = err instanceof Error ? err.message : "Erro ao criar conversa";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers para conversas
  const handleSendMessage = async (conversationId: string, content: string) => {
    if (!currentUser) return;

    try {
      const professionalName = currentUser.displayName || currentUser.email || "Profissional";
      await addMessage(conversationId, currentUser.uid, "professional", professionalName, content);
    } catch (err) {
      console.error("❌ Erro ao enviar mensagem:", err);
      setError("Erro ao enviar mensagem");
    }
  };

  const handleMarkConversationAsRead = async (conversationId: string) => {
    if (!currentUser) return;
    await markAsRead(conversationId, currentUser.uid, "professional");
  };

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      await archiveConversation(conversationId);
      setSuccess("✅ Conversa arquivada com sucesso!");
      setSelectedConversation(null);
    } catch (err) {
      console.error("❌ Erro ao arquivar conversa:", err);
      setError("Erro ao arquivar conversa");
    }
  };

  const handleUnarchiveConversation = async (conversationId: string) => {
    try {
      await unarchiveConversation(conversationId);
      setSuccess("✅ Conversa desarquivada com sucesso!");
    } catch (err) {
      console.error("❌ Erro ao desarquivar conversa:", err);
      setError("Erro ao desarquivar conversa");
    }
  };

  const handleDeleteConversation = async (conversationId: string, conversationTitle: string) => {
    if (!confirm(`Tem certeza que deseja deletar a conversa '${conversationTitle}'?`)) {
      return;
    }

    try {
      await deleteConversation(conversationId);
      setSuccess(`✅ Conversa '${conversationTitle}' deletada com sucesso!`);
      setSelectedConversation(null);
    } catch (err) {
      console.error("❌ Erro ao deletar conversa:", err);
      setError("Erro ao deletar conversa");
    }
  };

  // ✅ Criar meta
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedStudentForGoal ||
      !goalTitle ||
      !goalTargetValue ||
      !goalCurrentValue ||
      !goalTargetDate
    ) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setSuccess("");

      const studentId = selectedStudentForGoal;

      await createGoal(
        studentId,
        goalTitle,
        goalDescription,
        goalCategory,
        parseFloat(goalCurrentValue),
        parseFloat(goalTargetValue),
        goalUnit,
        new Date(goalTargetDate),
        currentUser?.uid || "",
        new Date() // startDate é a data atual
      );

      await loadStudentGoals();
      await loadStats();

      setSuccess("✅ Meta criada com sucesso!");
      setGoalTitle("");
      setGoalDescription("");
      setGoalTargetValue("");
      setGoalCurrentValue("");
      setGoalTargetDate("");
      setGoalCategory("weight");
      setGoalUnit("kg");
      setSelectedStudentForGoal(null);
      setShowNewGoalForm(false);
    } catch (err) {
      console.error("❌ Erro ao criar meta:", err);
      const message = err instanceof Error ? err.message : "Erro ao criar meta";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers para editar/deletar Metas
  const handleEditGoal = useCallback(
    async (goal: StudentGoal) => {
      const newTitle = prompt("Título da meta:", goal.title);
      if (newTitle === null) return;

      const newTargetValue = prompt(
        `Valor alvo (${goal.unit}):`,
        goal.targetValue.toString()
      );
      if (newTargetValue === null) return;

      try {
        setIsSubmitting(true);
        setError("");
        setSuccess("");

        await updateGoal(goal.id, {
          title: newTitle,
          targetValue: parseFloat(newTargetValue),
        });

        await loadStudentGoals();
        setSuccess(`✅ Meta '${newTitle}' atualizada com sucesso!`);
      } catch (err) {
        console.error("❌ Erro ao editar meta:", err);
        const message = err instanceof Error ? err.message : "Erro ao editar meta";
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [updateGoal, loadStudentGoals, setError, setSuccess, setIsSubmitting]
  );

  const handleDeleteGoal = useCallback(
    async (goalId: string, goalTitle: string) => {
      if (!confirm(`Tem certeza que deseja deletar a meta '${goalTitle}'?`)) {
        return;
      }
      try {
        setIsSubmitting(true);
        setError("");
        setSuccess("");
        await deleteGoal(goalId);
        await loadStudentGoals();
        setSuccess(`✅ Meta '${goalTitle}' deletada com sucesso!`);
      } catch (err) {
        console.error("❌ Erro ao deletar meta:", err);
        const message =
          err instanceof Error ? err.message : "Erro ao deletar meta";
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [deleteGoal, loadStudentGoals, setError, setSuccess, setIsSubmitting]
  );

  // ✅ Agendar avaliação
  const handleScheduleEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedStudentForEval ||
      !evalTitle ||
      !evalType ||
      !evalDate ||
      !evalTime
    ) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setSuccess("");

      const studentId = selectedStudentForEval;

      await createEvaluation(
        studentId,
        evalTitle,
        evalType,
        new Date(`${evalDate}T${evalTime}`),
        parseInt(evalDuration),
        evalLocation,
        currentUser?.uid || ""
      );

      await loadEvaluations();
      await loadStats();

      setSuccess("✅ Avaliação agendada com sucesso!");
      setEvalTitle("");
      setEvalType("fitness");
      setEvalDate("");
      setEvalTime("");
      setEvalDuration("60");
      setEvalLocation("");
      setSelectedStudentForEval(null);
      setShowNewEvaluationForm(false);
    } catch (err) {
      console.error("❌ Erro ao agendar avaliação:", err);
      const message =
        err instanceof Error ? err.message : "Erro ao agendar avaliação";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers para editar/deletar Avaliações
  const handleEditEvaluation = useCallback(
    async (evaluation: EvaluationSchedule) => {
      const newTitle = prompt("Título da avaliação:", evaluation.title);
      if (newTitle === null) return;

      const newDate = prompt(
        "Data (AAAA-MM-DD):",
        evaluation.scheduledDate
      );
      if (newDate === null) return;

      const newTime = prompt(
        "Hora (HH:MM):",
        evaluation.scheduledTime || ""
      );
      if (newTime === null) return;

      try {
        setIsSubmitting(true);
        setError("");
        setSuccess("");

        await updateEvaluation(evaluation.id, {
          title: newTitle,
          scheduledDate: newDate,
          scheduledTime: newTime,
        });

        await loadEvaluations();
        setSuccess(`✅ Avaliação '${newTitle}' atualizada com sucesso!`);
      } catch (err) {
        console.error("❌ Erro ao editar avaliação:", err);
        const message =
          err instanceof Error ? err.message : "Erro ao editar avaliação";
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [updateEvaluation, loadEvaluations, setError, setSuccess, setIsSubmitting]
  );

  const handleDeleteEvaluation = useCallback(
    async (evaluationId: string, evaluationTitle: string) => {
      if (
        !confirm(
          `Tem certeza que deseja deletar a avaliação '${evaluationTitle}'?`
        )
      ) {
        return;
      }
      try {
        setIsSubmitting(true);
        setError("");
        setSuccess("");
        await deleteEvaluation(evaluationId);
        await loadEvaluations();
        setSuccess(`✅ Avaliação '${evaluationTitle}' deletada com sucesso!`);
      } catch (err) {
        console.error("❌ Erro ao deletar avaliação:", err);
        const message =
          err instanceof Error ? err.message : "Erro ao deletar avaliação";
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [deleteEvaluation, loadEvaluations, setError, setSuccess, setIsSubmitting]
  );

  const handleInviteStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!inviteEmail) {
      setError("Por favor, insira um email");
      return;
    }

    try {
      setIsSubmitting(true);
      await inviteStudent(inviteEmail, inviteAccessLevel, inviteMessage);
      setSuccess(`✅ Convite enviado para ${inviteEmail}!`);
      setInviteEmail("");
      setInviteMessage("");
      setShowInviteForm(false);
      await loadPendingInvitations();
    } catch (err) {
      console.error("❌ Erro ao convidar aluno:", err);
      setError("Erro ao enviar convite. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlinkStudent = async (linkId: string, studentName: string) => {
    if (!confirm(`Tem certeza que deseja desvincular ${studentName}?`)) {
      return;
    }

    try {
      await unlinkStudent(linkId);
      setSuccess(`✅ ${studentName} foi desvinculado com sucesso.`);
    } catch (err) {
      console.error("❌ Erro ao desvincular aluno:", err);
      setError("Erro ao desvincular aluno. Tente novamente.");
    }
  };

  const handleCreateTestData = async () => {
    if (!currentUser) {
      setError("Você precisa estar logado!");
      return;
    }

    if (!confirm("Criar 10 alunos de teste com alertas variados?")) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setSuccess("");

      await seedProfessionalData(currentUser.uid);

      await loadStudentLinks();
      await loadPendingInvitations();

      setSuccess(
        "✅ Dados de teste criados! 10 alunos e 2 convites adicionados."
      );

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error("❌ Erro ao criar dados de teste:", err);
      setError("Erro ao criar dados de teste. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAlertAction = (alert: StudentAlert) => {
    switchToStudent(alert.studentId);
  };

  const activeStudents = studentLinks.filter(
    (link) => link.status === "active"
  );

  const filteredStudents = activeStudents.filter((link) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      link.studentName?.toLowerCase().includes(searchLower) ||
      link.studentEmail?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Dashboard Profissional</h1>
          <p>Gerencie seus alunos e acompanhe o progresso deles</p>
        </div>
        <button
          className={styles.inviteButton}
          onClick={() => setShowInviteForm(!showInviteForm)}
        >
          {showInviteForm ? "Cancelar" : "+ Convidar Aluno"}
        </button>
      </div>

      {/* Mensagens de feedback */}
      {error && (
        <div className={styles.errorMessage}>
          {error}
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {success && (
        <div className={styles.successMessage}>
          {success}
          <button onClick={() => setSuccess("")}>×</button>
        </div>
      )}

      {/* Formulário de convite */}
      {showInviteForm && (
        <div className={styles.inviteForm}>
          <h2>Convidar Novo Aluno</h2>
          <form onSubmit={handleInviteStudent}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email do Aluno *</label>
              <input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="aluno@email.com"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="accessLevel">Nível de Acesso *</label>
              <select
                id="accessLevel"
                value={inviteAccessLevel}
                onChange={(e) =>
                  setInviteAccessLevel(
                    e.target.value as
                      | "full"
                      | "workout_only"
                      | "nutrition_only"
                      | "analytics_only"
                  )
                }
                disabled={isSubmitting}
              >
                <option value="full">Acesso Total</option>
                <option value="workout_only">Apenas Treinos</option>
                <option value="nutrition_only">Apenas Nutrição</option>
                <option value="analytics_only">Apenas Analytics</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message">Mensagem Personalizada (opcional)</label>
              <textarea
                id="message"
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Ex: Olá! Gostaria de acompanhar seu progresso..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar Convite"}
            </button>
          </form>
        </div>
      )}

      {/* ✅ Abas de navegação */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "students" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("students")}
          >
            👥 Alunos
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "tags" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("tags")}
          >
            🏷️ Tags
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "conversations" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("conversations")}
          >
            💬 Conversas
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "goals" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("goals")}
          >
            🎯 Metas
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "evaluations" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("evaluations")}
          >
            📋 Avaliações
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "stats" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("stats")}
          >
            📊 Estatísticas
          </button>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      {activeTab === "stats" && stats && (
        <div className={styles.statsSection}>
          <h2>Estatísticas Gerais</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>👥</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{stats.totalStudents}</div>
                <div className={styles.statLabel}>Total de Alunos</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>✅</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{stats.activeStudents}</div>
                <div className={styles.statLabel}>Alunos Ativos</div>
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
                <div className={styles.statValue}>
                  {stats.upcomingEvaluations}
                </div>
                <div className={styles.statLabel}>Avaliações Próximas</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>📈</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>
                  {stats.averageStudentProgress}%
                </div>
                <div className={styles.statLabel}>Progresso Médio</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>🔔</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>
                  {stats.studentsWithAlerts}
                </div>
                <div className={styles.statLabel}>Alunos com Alertas</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Seção de Tags */}
      {activeTab === "tags" && (
        <div className={styles.tagsSection}>
          <div className={styles.sectionHeader}>
            <h2>Tags/Labels ({tags.length})</h2>
            <button
              className={styles.addButton}
              onClick={() => setShowNewTagForm(!showNewTagForm)}
            >
              {showNewTagForm ? "Cancelar" : "+ Nova Tag"}
            </button>
          </div>

          {showNewTagForm && (
            <form onSubmit={handleCreateTag} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="tagName">Nome da Tag *</label>
                <input
                  id="tagName"
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Ex: Hipertrofia"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="tagColor">Cor *</label>
                <input
                  id="tagColor"
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="tagDescription">Descrição (opcional)</label>
                <textarea
                  id="tagDescription"
                  value={newTagDescription}
                  onChange={(e) => setNewTagDescription(e.target.value)}
                  placeholder="Descrição da tag..."
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Criando..." : "Criar Tag"}
              </button>
            </form>
          )}

          {tags.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhuma tag criada ainda</p>
            </div>
          ) : (
            <div className={styles.tagsList}>
              {tags.map((tag) => {
                // Encontrar alunos que possuem esta tag
                const studentsWithTag = activeStudents.filter((link) =>
                  link.tags?.includes(tag.id)
                );
                const studentsWithoutTag = activeStudents.filter(
                  (link) => !link.tags?.includes(tag.id)
                );

                return (
                  <div
                    key={tag.id}
                    className={styles.tagItem}
                    style={{ borderLeftColor: tag.color }}
                  >
                    <div className={styles.tagHeader}>
                      <div
                        className={styles.tagColor}
                        style={{ backgroundColor: tag.color }}
                      />
                      <div className={styles.tagInfo}>
                        <div className={styles.tagNameRow}>
                          <div className={styles.tagName}>{tag.name}</div>
                          <div className={styles.tagCount}>
                            {studentsWithTag.length} {studentsWithTag.length === 1 ? 'aluno' : 'alunos'}
                          </div>
                        </div>
                        {tag.description && (
                          <div className={styles.tagDescription}>
                            {tag.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lista de alunos com esta tag */}
                    <div className={styles.tagContent}>
                      {studentsWithTag.length > 0 ? (
                        <div className={styles.tagStudents}>
                          <div className={styles.tagStudentsList}>
                            {studentsWithTag.map((link) => (
                              <div key={link.id} className={styles.tagStudentBadge}>
                                <span className={styles.studentBadgeIcon}>👤</span>
                                <span className={styles.studentBadgeName}>
                                  {link.studentName || link.studentEmail}
                                </span>
                                <button
                                  className={styles.removeTagButton}
                                  onClick={async () => {
                                    const success = await removeTagFromStudent(link.id, tag.id);
                                    if (success) {
                                      setSuccess(`Tag "${tag.name}" removida de ${link.studentName || link.studentEmail}`);
                                      await loadStudentLinks();
                                    } else {
                                      setError("Erro ao remover tag");
                                    }
                                  }}
                                  title="Remover tag deste aluno"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className={styles.noStudentsMessage}>
                          Nenhum aluno com esta tag ainda
                        </div>
                      )}

                      {/* Dropdown para adicionar alunos */}
                      {studentsWithoutTag.length > 0 && (
                        <div className={styles.addStudentToTag}>
                          <select
                            className={styles.selectStudent}
                            onChange={async (e) => {
                              const studentLinkId = e.target.value;
                              if (studentLinkId) {
                                const success = await addTagToStudent(studentLinkId, tag.id);
                                if (success) {
                                  const student = activeStudents.find(s => s.id === studentLinkId);
                                  setSuccess(`Tag "${tag.name}" atribuída a ${student?.studentName || student?.studentEmail}`);
                                  await loadStudentLinks();
                                  e.target.value = "";
                                } else {
                                  setError("Erro ao atribuir tag");
                                }
                              }
                            }}
                            disabled={isSubmitting}
                          >
                            <option value="">+ Adicionar aluno a esta tag</option>
                            {studentsWithoutTag.map((link) => (
                              <option key={link.id} value={link.id}>
                                {link.studentName || link.studentEmail}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {studentsWithoutTag.length === 0 && studentsWithTag.length > 0 && (
                        <div className={styles.allStudentsTagged}>
                          Todos os alunos têm esta tag
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ✅ Seção de Conversas */}
      {activeTab === "conversations" && (
        <div className={styles.conversationsSection}>
          {selectedConversation ? (
            <ChatConversation
              conversation={selectedConversation}
              student={studentLinks.find(
                (link) => link.id === selectedConversation.studentLinkId
              )!}
              currentUserId={currentUser?.uid || ""}
              currentUserType="professional"
              currentUserName={currentUser?.displayName || currentUser?.email || "Profissional"}
              onSendMessage={handleSendMessage}
              onMarkAsRead={handleMarkConversationAsRead}
              onArchive={handleArchiveConversation}
              onUnarchive={handleUnarchiveConversation}
              onDelete={handleDeleteConversation}
              onClose={() => setSelectedConversation(null)}
            />
          ) : (
            <>
              <div className={styles.sectionHeader}>
                <h2>Conversas ({conversations.length})</h2>
                <button
                  className={styles.addButton}
                  onClick={() => setShowNewConversationForm(!showNewConversationForm)}
                >
                  {showNewConversationForm ? "Cancelar" : "+ Nova Conversa"}
                </button>
              </div>

              {showNewConversationForm && (
                <form onSubmit={handleCreateConversation} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label htmlFor="studentConversation">Aluno *</label>
                    <select
                      id="studentConversation"
                      value={selectedStudentForConversation || ""}
                      onChange={(e) => setSelectedStudentForConversation(e.target.value)}
                      required
                      disabled={isSubmitting}
                    >
                      <option value="">Selecione um aluno</option>
                      {activeStudents.map((link) => (
                        <option key={link.id} value={link.studentUserId}>
                          {link.studentName || link.studentEmail}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="conversationTitle">Título *</label>
                    <input
                      id="conversationTitle"
                      type="text"
                      value={conversationTitle}
                      onChange={(e) => setConversationTitle(e.target.value)}
                      placeholder="Assunto da conversa..."
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="conversationCategory">Categoria *</label>
                    <select
                      id="conversationCategory"
                      value={conversationCategory}
                      onChange={(e) =>
                        setConversationCategory(
                          e.target.value as
                            | "general"
                            | "training"
                            | "nutrition"
                            | "evaluation"
                            | "other"
                        )
                      }
                      disabled={isSubmitting}
                    >
                      <option value="general">Geral</option>
                      <option value="training">Treino</option>
                      <option value="nutrition">Nutrição</option>
                      <option value="evaluation">Avaliação</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="conversationInitialMessage">Mensagem Inicial *</label>
                    <textarea
                      id="conversationInitialMessage"
                      value={conversationInitialMessage}
                      onChange={(e) => setConversationInitialMessage(e.target.value)}
                      placeholder="Digite a primeira mensagem..."
                      rows={4}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Criando..." : "Iniciar Conversa"}
                  </button>
                </form>
              )}

              {conversations.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Nenhuma conversa iniciada ainda</p>
                </div>
              ) : (
                <div className={styles.conversationsList}>
                  {conversations.map((conversation) => {
                    const student = studentLinks.find(
                      (link) => link.id === conversation.studentLinkId
                    );
                    if (!student) return null;
                    return (
                      <ConversationCard
                        key={conversation.id}
                        conversation={conversation}
                        studentName={student.studentName || student.studentEmail || "Aluno"}
                        onClick={() => setSelectedConversation(conversation)}
                        currentUserType="professional"
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ✅ Seção de Metas */}
      {activeTab === "goals" && (
        <div className={styles.goalsSection}>
          <div className={styles.sectionHeader}>
            <h2>Metas dos Alunos ({goals.length})</h2>
            <button
              className={styles.addButton}
              onClick={() => setShowNewGoalForm(!showNewGoalForm)}
            >
              {showNewGoalForm ? "Cancelar" : "+ Nova Meta"}
            </button>
          </div>

          {showNewGoalForm && (
            <form onSubmit={handleCreateGoal} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="studentGoal">Aluno *</label>
                <select
                  id="studentGoal"
                  value={selectedStudentForGoal || ""}
                  onChange={(e) => setSelectedStudentForGoal(e.target.value)}
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Selecione um aluno</option>
                  {activeStudents.map((link) => (
                    <option key={link.id} value={link.studentUserId}>
                      {link.studentName || link.studentEmail}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="goalTitle">Título da Meta *</label>
                <input
                  id="goalTitle"
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Ex: Ganhar 5kg de massa muscular"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="goalDescription">Descrição (opcional)</label>
                <textarea
                  id="goalDescription"
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder="Descrição detalhada da meta..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="goalCategory">Categoria *</label>
                <select
                  id="goalCategory"
                  value={goalCategory}
                  onChange={(e) =>
                    setGoalCategory(
                      e.target.value as
                        | "weight"
                        | "strength"
                        | "endurance"
                        | "flexibility"
                        | "habit"
                        | "body_composition"
                        | "other"
                    )
                  }
                  disabled={isSubmitting}
                >
                  <option value="weight">Peso</option>
                  <option value="strength">Força</option>
                  <option value="endurance">Resistência</option>
                  <option value="flexibility">Flexibilidade</option>
                  <option value="habit">Hábito</option>
                  <option value="body_composition">Composição Corporal</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="goalCurrentValue">Valor Atual *</label>
                  <input
                    id="goalCurrentValue"
                    type="number"
                    value={goalCurrentValue}
                    onChange={(e) => setGoalCurrentValue(e.target.value)}
                    placeholder="Ex: 70"
                    required
                    disabled={isSubmitting}
                    step="0.1"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="goalTargetValue">Valor Alvo *</label>
                  <input
                    id="goalTargetValue"
                    type="number"
                    value={goalTargetValue}
                    onChange={(e) => setGoalTargetValue(e.target.value)}
                    placeholder="Ex: 75"
                    required
                    disabled={isSubmitting}
                    step="0.1"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="goalUnit">Unidade *</label>
                  <input
                    id="goalUnit"
                    type="text"
                    value={goalUnit}
                    onChange={(e) => setGoalUnit(e.target.value)}
                    placeholder="Ex: kg, km, horas"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="goalTargetDate">Data Alvo *</label>
                <input
                  id="goalTargetDate"
                  type="date"
                  value={goalTargetDate}
                  onChange={(e) => setGoalTargetDate(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Criando..." : "Criar Meta"}
              </button>
            </form>
          )}

          {goals.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhuma meta criada ainda</p>
            </div>
          ) : (
            <div className={styles.goalsList}>
              {goals.map((goal) => {
                const student = getStudentById(goal.studentLinkId);
                if (!student) return null;
                return (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    student={student}
                    onEdit={handleEditGoal}
                    onDelete={(goalId) =>
                      handleDeleteGoal(goalId, goal.title || "Meta")
                    }
                    onMarkComplete={(goalId) => {
                      console.log("Mark complete:", goalId);
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ✅ Seção de Avaliações */}
      {activeTab === "evaluations" && (
        <div className={styles.evaluationsSection}>
          <div className={styles.sectionHeader}>
            <h2>Avaliações ({evaluations.length})</h2>
            <button
              className={styles.addButton}
              onClick={() => setShowNewEvaluationForm(!showNewEvaluationForm)}
            >
              {showNewEvaluationForm ? "Cancelar" : "+ Nova Avaliação"}
            </button>
          </div>

          {showNewEvaluationForm && (
            <form onSubmit={handleScheduleEvaluation} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="studentEval">Aluno *</label>
                <select
                  id="studentEval"
                  value={selectedStudentForEval || ""}
                  onChange={(e) => setSelectedStudentForEval(e.target.value)}
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Selecione um aluno</option>
                  {activeStudents.map((link) => (
                    <option key={link.id} value={link.studentUserId}>
                      {link.studentName || link.studentEmail}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="evalTitle">Título da Avaliação *</label>
                <input
                  id="evalTitle"
                  type="text"
                  value={evalTitle}
                  onChange={(e) => setEvalTitle(e.target.value)}
                  placeholder="Ex: Avaliação Física Inicial"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="evalType">Tipo *</label>
                <select
                  id="evalType"
                  value={evalType}
                  onChange={(e) =>
                    setEvalType(
                      e.target.value as
                        | "fitness"
                        | "nutrition"
                        | "progress"
                        | "other"
                    )
                  }
                  disabled={isSubmitting}
                >
                  <option value="fitness">Fitness</option>
                  <option value="nutrition">Nutrição</option>
                  <option value="progress">Progresso</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="evalDate">Data *</label>
                  <input
                    id="evalDate"
                    type="date"
                    value={evalDate}
                    onChange={(e) => setEvalDate(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="evalTime">Hora *</label>
                  <input
                    id="evalTime"
                    type="time"
                    value={evalTime}
                    onChange={(e) => setEvalTime(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="evalDuration">Duração (min)</label>
                  <input
                    id="evalDuration"
                    type="number"
                    value={evalDuration}
                    onChange={(e) => setEvalDuration(e.target.value)}
                    placeholder="60"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="evalLocation">Local</label>
                <input
                  id="evalLocation"
                  type="text"
                  value={evalLocation}
                  onChange={(e) => setEvalLocation(e.target.value)}
                  placeholder="Ex: Academia, Online"
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Agendando..." : "Agendar Avaliação"}
              </button>
            </form>
          )}

          {evaluations.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhuma avaliação agendada</p>
            </div>
          ) : (
            <div className={styles.evaluationsList}>
              {evaluations.map((evaluation) => {
                const student = getStudentById(evaluation.studentLinkId);
                if (!student) return null;
                return (
                  <EvaluationCard
                    key={evaluation.id}
                    evaluation={evaluation}
                    student={student}
                    onEdit={handleEditEvaluation}
                    onDelete={(evaluationId) =>
                      handleDeleteEvaluation(
                        evaluationId,
                        evaluation.title || "Avaliação"
                      )
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Alertas e Notificações */}
      {activeTab === "students" && allAlerts.length > 0 && (
        <AlertsSection alerts={allAlerts} onAlertAction={handleAlertAction} />
      )}

      {/* Lista de alunos */}
      {activeTab === "students" && (
        <div className={styles.studentsSection}>
          <div className={styles.studentsSectionHeader}>
            <h2>Meus Alunos ({activeStudents.length})</h2>
            {activeStudents.length > 0 && (
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                {searchTerm && (
                  <button
                    className={styles.clearSearch}
                    onClick={() => setSearchTerm("")}
                    title="Limpar busca"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>

          {activeStudents.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>👥</div>
              <h3>Nenhum aluno cadastrado</h3>
              <p>
                Comece convidando seus alunos para acompanhar o progresso deles
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className={styles.emptyStateButton}
                  onClick={() => setShowInviteForm(true)}
                >
                  Convidar Primeiro Aluno
                </button>
                <button
                  className={styles.testDataButton}
                  onClick={handleCreateTestData}
                  disabled={isSubmitting}
                  title="Criar 10 alunos de teste com alertas variados"
                >
                  {isSubmitting ? "Criando..." : "🌱 Dados de Teste"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {filteredStudents.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🔍</div>
                  <h3>Nenhum aluno encontrado</h3>
                  <p>Nenhum aluno corresponde à sua busca "{searchTerm}"</p>
                  <button
                    className={styles.emptyStateButton}
                    onClick={() => setSearchTerm("")}
                  >
                    Limpar Busca
                  </button>
                </div>
              ) : (
                <div className={styles.studentsList}>
                  {isLoadingMetrics ? (
                    <div className={styles.loadingState}>
                      <p>Carregando métricas dos alunos...</p>
                    </div>
                  ) : (
                    filteredStudents.map((link) => (
                      <StudentCardExpanded
                        key={link.id}
                        link={link}
                        metrics={
                          studentsMetrics.get(link.studentUserId) || null
                        }
                        onViewStudent={switchToStudent}
                        onUnlink={handleUnlinkStudent}
                      />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Convites pendentes */}
      {activeTab === "students" && pendingInvitations.length > 0 && (
        <div className={styles.invitationsSection}>
          <h2>Convites Pendentes ({pendingInvitations.length})</h2>
          <div className={styles.invitationsList}>
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className={styles.invitationCard}>
                <div className={styles.invitationInfo}>
                  <div className={styles.invitationEmail}>
                    {invitation.studentEmail}
                  </div>
                  <div className={styles.invitationDate}>
                    Enviado em:{" "}
                    {new Date(invitation.sentAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className={styles.invitationCode}>
                  Código: <strong>{invitation.invitationCode}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}