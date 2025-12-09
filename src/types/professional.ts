// src/types/professional.ts
/**
 * Tipos para o sistema de Área Profissional
 * Permite que profissionais de educação física gerenciem múltiplos alunos
 */

// ============================================
// TIPOS BÁSICOS
// ============================================

// Tipo de profissional
export type ProfessionalType = // ✅ Adicionado 'export'

    | "personal_trainer"
    | "nutricionista"
    | "fisioterapeuta"
    | "preparador_fisico"
    | "outro";

// Nível de acesso que o profissional tem aos dados do aluno
export type AccessLevel = // ✅ Adicionado 'export'
  "full" | "workout_only" | "nutrition_only" | "analytics_only";

// Status da vinculação entre profissional e aluno
export type LinkStatus = "pending" | "active" | "inactive" | "rejected"; // ✅ Adicionado 'export'

// ============================================
// PERFIL E VINCULAÇÃO
// ============================================

// Interface para o perfil do profissional
export interface ProfessionalProfile {
  // ✅ Adicionado 'export'
  id: string; // UID do Firebase
  userId: string; // UID do usuário comum (profissional também é usuário)
  email: string;
  displayName: string;
  professionalType: ProfessionalType;
  specialties: string[]; // Ex: ["hipertrofia", "emagrecimento", "reabilitação"]
  bio?: string;
  phone?: string;
  cref?: string; // Registro profissional (CREF para educadores físicos)
  crn?: string; // Registro para nutricionistas
  crefito?: string; // Registro para fisioterapeutas
  clinicName?: string;
  clinicAddress?: string;
  photoURL?: string;
  yearsOfExperience?: number;
  certification?: string[]; // Certificações adicionais
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  isActive: boolean; // Se a conta profissional está ativa
}

// Interface para vinculação entre profissional e aluno
export interface StudentLink {
  // ✅ Adicionado 'export'
  id: string; // ID único da vinculação
  professionalId: string; // ID do profissional
  studentUserId: string; // UID do aluno (usuário comum)
  studentEmail?: string; // Email do aluno
  studentName?: string; // Nome do aluno
  accessLevel: AccessLevel; // Nível de acesso
  status: LinkStatus; // Status da vinculação
  invitationCode?: string; // Código para convite (se aplicável)
  invitationSentAt?: string; // Quando o convite foi enviado
  linkedAt?: string; // Quando foi aceito
  expiresAt?: string; // Quando expira (para planos temporários)
  notes?: string; // Notas sobre o aluno
  goals?: string; // Objetivos do aluno
  tags?: string[]; // ✅ NOVO: Array de tag IDs
  createdAt: string;
  updatedAt: string;
}

// Interface para convite de aluno
export interface StudentInvitation {
  // ✅ Adicionado 'export'
  id: string;
  professionalId: string;
  professionalName: string;
  professionalEmail: string;
  studentEmail: string; // Email do aluno convidado
  invitationCode: string; // Código único para aceitar
  accessLevel: AccessLevel;
  status: "pending" | "accepted" | "rejected" | "expired";
  message?: string; // Mensagem personalizada do profissional
  sentAt: string;
  expiresAt: string;
  acceptedAt?: string;
}

// Interface para o contexto profissional ativo
export interface ActiveProfessionalSession {
  // ✅ Adicionado 'export'
  professionalId: string;
  professionalName: string;
  activeStudentId: string | null; // ID do aluno sendo visualizado atualmente
  activeStudentName?: string;
  mode: "professional" | "personal"; // Se está no modo profissional ou pessoal
}

// Estado do contexto profissional
export interface ProfessionalState {
  // ✅ Adicionado 'export'
  professionalProfile: ProfessionalProfile | null;
  studentLinks: StudentLink[];
  activeSession: ActiveProfessionalSession | null;
  pendingInvitations: StudentInvitation[];
  isLoading: boolean;
  error: string | null;
}

// Ações do reducer profissional
export type ProfessionalAction = // ✅ Adicionado 'export'

    | { type: "SET_PROFESSIONAL_PROFILE"; payload: ProfessionalProfile | null }
    | {
        type: "UPDATE_PROFESSIONAL_PROFILE";
        payload: Partial<ProfessionalProfile>;
      }
    | { type: "SET_STUDENT_LINKS"; payload: StudentLink[] }
    | { type: "ADD_STUDENT_LINK"; payload: StudentLink }
    | {
        type: "UPDATE_STUDENT_LINK";
        payload: { id: string; updates: Partial<StudentLink> };
      }
    | { type: "REMOVE_STUDENT_LINK"; payload: string }
    | {
        type: "SET_ACTIVE_STUDENT";
        payload: { studentId: string | null; studentName?: string };
      }
    | { type: "SET_MODE"; payload: "professional" | "personal" }
    | { type: "INIT_SESSION"; payload: ActiveProfessionalSession }
    | { type: "SET_PENDING_INVITATIONS"; payload: StudentInvitation[] }
    | { type: "ADD_INVITATION"; payload: StudentInvitation }
    | {
        type: "UPDATE_INVITATION";
        payload: { id: string; updates: Partial<StudentInvitation> };
      }
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_ERROR"; payload: string | null }
    | { type: "CLEAR_PROFESSIONAL_DATA" };

// Dados de registro de profissional
export interface ProfessionalRegistrationData {
  // ✅ Adicionado 'export'
  email: string;
  password: string;
  displayName: string;
  professionalType: ProfessionalType;
  specialties: string[];
  cref?: string;
  crn?: string;
  crefito?: string;
  phone?: string;
}

// ============================================
// ALERTAS E MÉTRICAS
// ============================================

// Tipos de alertas
export type AlertType = // ✅ Adicionado 'export'

    | "workout_expiring" // Treino próximo de expirar (30 dias)
    | "student_inactive" // Aluno sem treinar há X dias
    | "measurements_overdue" // Medidas atrasadas
    | "nutrition_inactive" // Sem registro de refeições
    | "performance_stagnation" // Estagnação na evolução
    | "performance_regression" // Regressão de performance
    | "excessive_volume" // Volume excessivo de treino
    | "goal_deadline" // Meta próxima do prazo
    | "evaluation_due"; // Avaliação física agendada

// Severidade do alerta
export type AlertSeverity = "info" | "warning" | "urgent"; // ✅ Adicionado 'export'

// Interface para alertas
export interface StudentAlert {
  // ✅ Adicionado 'export'
  id: string;
  studentId: string;
  studentName: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
  createdAt: string;
  metadata?: {
    daysSinceLastWorkout?: number;
    daysSinceWorkoutCreated?: number;
    exerciseName?: string;
    weeksStagnated?: number;
    goalName?: string;
    daysUntilDeadline?: number;
    [key: string]: string | number | boolean | null | undefined;
  };
}

// Métricas de adesão e performance do aluno
export interface StudentMetrics {
  // ✅ Adicionado 'export'
  studentId: string;
  studentName: string;

  // Métricas de adesão
  adherence: {
    weeklyRate: number; // % de treinos completados na semana
    monthlyRate: number; // % de treinos completados no mês
    currentStreak: number; // Dias consecutivos treinando
    longestStreak: number; // Maior sequência de dias
    lastWorkoutDate: string | null;
    daysSinceLastWorkout: number;
  };

  // Métricas de frequência
  frequency: {
    weekly: number; // Média de treinos por semana
    monthly: number; // Total de treinos no mês
    preferredDays: string[]; // Dias da semana que mais treina
  };

  // Métricas de progresso
  progress: {
    totalWorkoutsCompleted: number;
    averageWorkoutDuration: number; // Em minutos
    totalVolume: number; // Volume total levantado (kg)
    volumeTrend: "increasing" | "stable" | "decreasing";
  };

  // Métricas de composição corporal
  bodyComposition?: {
    currentWeight: number;
    weightChange30Days: number; // Variação em 30 dias
    weightChange90Days: number; // Variação em 90 dias
    currentBodyFat?: number;
    bodyFatChange30Days?: number;
    lastMeasurementDate: string | null;
    daysSinceLastMeasurement: number;
  };

  // Métricas nutricionais
  nutrition?: {
    averageDailyCalories: number;
    adherenceToMealPlan: number; // %
    lastNutritionLogDate: string | null;
    daysSinceLastLog: number;
  };

  // Status do treino atual
  currentWorkout: {
    createdAt: string | null;
    daysSinceCreation: number;
    needsRenewal: boolean; // Se está próximo de 30 dias
  };
}

// ============================================
// 1️⃣ SISTEMA DE TAGS/LABELS
// ============================================

// Interface para Tag/Label
export interface Tag {
  // ✅ Adicionado 'export'
  id: string;
  professionalId: string;
  name: string;
  color: string; // Hex color
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Cores pré-definidas para tags
export const TAG_COLORS = [
  // ✅ Adicionado 'export'
  "#FF6B6B", // Vermelho
  "#4ECDC4", // Teal
  "#45B7D1", // Azul
  "#FFA07A", // Laranja
  "#98D8C8", // Verde
  "#F7DC6F", // Amarelo
  "#BB8FCE", // Roxo
  "#85C1E2", // Azul Claro
];

// Tags padrão sugeridas
export const DEFAULT_TAGS = [
  // ✅ Adicionado 'export'
  { name: "Iniciante", color: "#45B7D1" },
  { name: "Intermediário", color: "#FFA07A" },
  { name: "Avançado", color: "#FF6B6B" },
  { name: "Reabilitação", color: "#98D8C8" },
  { name: "Hipertrofia", color: "#F7DC6F" },
  { name: "Emagrecimento", color: "#BB8FCE" },
  { name: "Força", color: "#4ECDC4" },
  { name: "Resistência", color: "#85C1E2" },
  { name: "Alto Desempenho", color: "#FF6B6B" },
  { name: "Lesão/Reabilitação", color: "#FFA07A" },
];

// ============================================
// 2️⃣ SISTEMA DE ANOTAÇÕES E CONVERSAS
// ============================================

// Categorias de anotações
export type NoteCategory = // ✅ Adicionado 'export'
  "progress" | "health" | "behavior" | "evaluation" | "other";

// Interface para Anotação do Profissional (DEPRECATED - usar Conversation)
export interface StudentNote {
  // ✅ Adicionado 'export'
  id: string;
  studentLinkId: string; // Referência à vinculação
  professionalId: string;
  title: string;
  content: string;
  category: NoteCategory;
  attachments?: string[]; // URLs de arquivos anexados
  tags?: string[]; // Tags personalizadas
  createdAt: string;
  updatedAt: string;
}

// ✅ NOVO: Sistema de Conversas (Chat)
export interface Conversation {
  id: string;
  studentLinkId: string;
  professionalId: string;
  studentUserId: string;
  title: string;
  category: NoteCategory;
  messages: ConversationMessage[];
  isArchived: boolean;
  lastMessageAt: string;
  unreadCount: {
    professional: number; // Mensagens não lidas pelo profissional
    student: number; // Mensagens não lidas pelo aluno
  };
  createdAt: string;
  updatedAt: string;
}

// ✅ NOVO: Mensagem dentro de uma conversa
export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderId: string; // ID do usuário que enviou (profissional ou aluno)
  senderType: "professional" | "student"; // Tipo de quem enviou
  senderName: string; // Nome de quem enviou
  content: string;
  attachments?: string[]; // URLs de arquivos anexados
  isRead: boolean; // Se a mensagem foi lida pelo destinatário
  readAt?: string; // Quando foi lida
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// 3️⃣ SISTEMA DE METAS E OBJETIVOS
// ============================================

// Categorias de metas
export type GoalCategory = // ✅ Adicionado 'export'

    | "weight"
    | "strength"
    | "endurance"
    | "flexibility"
    | "habit"
    | "body_composition"
    | "other";

// Status da meta
export type GoalStatus = "active" | "completed" | "paused" | "failed"; // ✅ Adicionado 'export'

// Interface para Meta/Objetivo
export interface StudentGoal {
  // ✅ Adicionado 'export'
  id: string;
  studentLinkId: string; // Referência à vinculação
  professionalId: string;
  title: string;
  description: string;
  category: GoalCategory;
  targetValue: number;
  unit: string; // kg, %, min, reps, etc
  currentValue: number;
  startValue: number; // ✅ NOVO: Valor inicial da meta para cálculo de progresso
  startDate: string;
  targetDate: string;
  status: GoalStatus;
  progress: number; // % de progresso (0-100)
  createdAt: string;
  updatedAt: string;
}

// ============================================
// 4️⃣ AGENDAMENTO DE AVALIAÇÕES
// ============================================

// Tipos de avaliação
export type EvaluationType = "fitness" | "nutrition" | "progress" | "other"; // ✅ Adicionado 'export'

// Status da avaliação
export type EvaluationStatus = // ✅ Adicionado 'export'
  "scheduled" | "completed" | "cancelled" | "rescheduled";

// Interface para Agendamento de Avaliação
export interface EvaluationSchedule {
  // ✅ Adicionado 'export'
  id: string;
  studentLinkId: string; // Referência à vinculação
  professionalId: string;
  title: string;
  description?: string;
  type: EvaluationType;
  scheduledDate: string; // ISO date
  scheduledTime: string; // HH:mm formato
  duration: number; // em minutos
  location?: string;
  status: EvaluationStatus;
  notes?: string;
  reminderSent?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// 5️⃣ ESTATÍSTICAS GERAIS DO PROFISSIONAL
// ============================================

// Interface para Estatísticas do Profissional
export interface ProfessionalStats {
  // ✅ Adicionado 'export'
  totalStudents: number;
  activeStudents: number;
  completedGoals: number;
  totalGoals: number;
  upcomingEvaluations: number;
  averageStudentProgress: number; // % médio de progresso em metas
  studentsWithAlerts: number;
  lastUpdated: string;

  // Detalhes adicionais
  thisWeekWorkouts?: number;
  thisMonthWorkouts?: number;
  averageAdherence?: number; // % média de adesão dos alunos
  studentsNeedingAttention?: number;

  // Top performers
  topPerformers?: Array<{
    studentId: string;
    studentName: string;
    adherenceRate: number;
  }>;

  // Alunos em risco
  studentsAtRisk?: Array<{
    studentId: string;
    studentName: string;
    reason: string;
    daysSinceLastWorkout: number;
  }>;
}

// ============================================
// TIPOS AUXILIARES E CONSTANTES
// ============================================

// Mapeamento de tipos de profissional para labels
export const PROFESSIONAL_TYPE_LABELS: Record<ProfessionalType, string> = {
  // ✅ Adicionado 'export'
  personal_trainer: "Personal Trainer",
  nutricionista: "Nutricionista",
  fisioterapeuta: "Fisioterapeuta",
  preparador_fisico: "Preparador Físico",
  outro: "Outro",
};

// Mapeamento de tipos de aviso
export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  // ✅ Adicionado 'export'
  workout_expiring: "Treino Próximo de Expirar",
  student_inactive: "Aluno Inativo",
  measurements_overdue: "Medidas Atrasadas",
  nutrition_inactive: "Sem Registro de Nutrição",
  performance_stagnation: "Estagnação de Performance",
  performance_regression: "Regressão de Performance",
  excessive_volume: "Volume Excessivo",
  goal_deadline: "Meta Próxima do Prazo",
  evaluation_due: "Avaliação Agendada",
};

// Mapeamento de severidade
export const ALERT_SEVERITY_COLORS: Record<AlertSeverity, string> = {
  // ✅ Adicionado 'export'
  info: "#0066FF",
  warning: "#FFA500",
  urgent: "#FF0000",
};

// Mapeamento de categoria de nota
export const NOTE_CATEGORY_LABELS: Record<NoteCategory, string> = {
  // ✅ Adicionado 'export'
  progress: "Progresso",
  health: "Saúde",
  behavior: "Comportamento",
  evaluation: "Avaliação",
  other: "Outro",
};

// Mapeamento de categoria de meta
export const GOAL_CATEGORY_LABELS: Record<GoalCategory, string> = {
  // ✅ Adicionado 'export'
  weight: "Peso",
  strength: "Força",
  endurance: "Resistência",
  flexibility: "Flexibilidade",
  habit: "Hábito",
  body_composition: "Composição Corporal",
  other: "Outro",
};

// Mapeamento de tipo de avaliação
export const EVALUATION_TYPE_LABELS: Record<EvaluationType, string> = {
  // ✅ Adicionado 'export'
  fitness: "Avaliação Física",
  nutrition: "Avaliação Nutricional",
  progress: "Avaliação de Progresso",
  other: "Outra",
};

// Mapeamento de status de avaliação
export const EVALUATION_STATUS_LABELS: Record<EvaluationStatus, string> = {
  // ✅ Adicionado 'export'
  scheduled: "Agendada",
  completed: "Concluída",
  cancelled: "Cancelada",
  rescheduled: "Reagendada",
};

// Mapeamento de status de meta
export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  // ✅ Adicionado 'export'
  active: "Ativa",
  completed: "Concluída",
  paused: "Pausada",
  failed: "Falhou",
};

// ✅ Sistema de Notificações
// ✅ Sistema de Notificações do Firebase
export type NotificationType =
  | "note_created"
  | "goal_created"
  | "evaluation_scheduled"
  | "post_created"
  | "comment_added"
  | "post_liked";

export interface Notification {
  id: string;
  studentId: string;
  professionalId?: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// TIPOS DE VALIDAÇÃO
// ============================================

// Validação de email
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // ✅ Adicionado 'export'

// Validação de CREF (formato brasileiro)
export const CREF_REGEX = /^\d{6}\/[A-Z]{2}\/[A-Z]+$/; // ✅ Adicionado 'export'

// Validação de CRN (formato brasileiro)
export const CRN_REGEX = /^\d{5}$/; // ✅ Adicionado 'export'
