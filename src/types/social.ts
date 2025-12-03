// Types for Social Features (Groups, Feed, etc.)

// ============================================================================
//                                 USER
// ============================================================================

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLoginAt: string;

  // Profile info
  bio?: string;
  location?: string;
  website?: string;

  // Stats
  followersCount: number;
  followingCount: number;
  workoutsCount: number;
  groupsCount: number;

  // Privacy settings
  isPrivate: boolean;
  allowMessages: boolean;
}

// ============================================================================
//                                 GROUPS
// ============================================================================

export interface Group {
  id: string;
  name: string;
  description?: string;
  coverPhoto?: string;
  createdBy: string; // User UID
  createdAt: string;
  updatedAt: string;

  // Settings
  isPrivate: boolean; // Private groups require approval to join
  inviteCode?: string; // For easy sharing

  // Members
  membersCount: number;
  admins: string[]; // Array of user UIDs

  // Stats
  postsCount: number;
  weeklyActiveMembers: number;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  role: "admin" | "moderator" | "member";
  joinedAt: string;

  // Stats
  postsCount: number;
  lastActivityAt: string;
}

// ============================================================================
//                                 POSTS
// ============================================================================
export interface PostLike {
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
}

export interface ExerciseRecord {
  exerciseDefinitionId: string;
  exerciseName: string;
  type: "weight" | "volume";
  previousValue: number;
  newValue: number;
  improvement: number;
  improvementPercentage: number;
}

export interface WorkoutPost {
  id: string;
  userId: string;
  groupId: string;

  // User info (for displaying author)
  userName?: string;
  userPhotoURL?: string;

  // Workout data
  workoutName: string;
  workoutDate: string; // ISO string
  duration: number; // in minutes
  totalVolume: number; // in kg
  exercises: WorkoutPostExercise[];
  records?: ExerciseRecord[]; // ✅ NOVO: Recordes conquistados neste treino

  // Post content
  caption?: string;
  photos?: string[]; // URLs from Firebase Storage
  likes?: PostLike[];

  // Engagement
  likesCount: number;
  commentsCount: number;
  sharesCount: number;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutPostExercise {
  name: string;
  sets: Array<{
    reps: number;
    weight: number;
  }>;
  totalVolume?: number; // calculated
  isPR?: boolean; // Personal Record
}

export interface Like {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  userName?: string; // ✅ NOVO
  userAvatar?: string; // ✅ NOVO

  // Engagement
  likesCount: number;
  repliesCount: number;

  // For nested comments
  parentCommentId?: string;
}

// ============================================================================
//                                 LEADERBOARD
// ============================================================================

export interface LeaderboardEntry {
  userId: string;
  groupId: string;
  period: "week" | "month" | "all-time";

  // Metrics
  totalVolume: number;
  workoutsCount: number;
  totalDuration: number; // in minutes
  avgWorkoutDuration: number;

  // Ranking
  rank: number;
  previousRank?: number;

  // Timestamp
  lastUpdated: string;
}

// ============================================================================
//                                 CHAT
// ============================================================================

export interface ChatMessage {
  id: string;
  groupId: string;
  userId: string;
  text: string;
  createdAt: string;

  // Media
  imageUrl?: string;
  workoutReference?: string; // Reference to a workout post

  // Status
  isEdited: boolean;
  isDeleted: boolean;
  deletedAt?: string;
}

// ============================================================================
//                                 FOLLOW
// ============================================================================

export interface Follow {
  id: string;
  followerId: string; // User who follows
  followingId: string; // User being followed
  createdAt: string;
}

// ============================================================================
//                                 NOTIFICATIONS
// ============================================================================

export type NotificationType =
  | "like"
  | "comment"
  | "follow"
  | "group_invite"
  | "mention"
  | "new_post_in_group";

export interface Notification {
  id: string;
  userId: string; // Recipient
  type: NotificationType;

  // Related entities
  fromUserId?: string;
  postId?: string;
  commentId?: string;
  groupId?: string;

  // Content
  title: string;
  message: string;

  // Status
  isRead: boolean;
  createdAt: string;
}

// ============================================================================
//                                 INVITE
// ============================================================================

export interface GroupInvite {
  id: string;
  groupId: string;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;

  // Limits
  maxUses?: number;
  currentUses: number;

  // Status
  isActive: boolean;
}

// ============================================================================
//                                 CHALLENGES
// ============================================================================

export type ChallengeType =
  | "volume" // Volume total em kg
  | "consistency" // Dias de treino (flexível - cada um treina conforme conseguir)
  | "records" // Bater X recordes
  | "exercise" // Melhorar em exercício específico
  | "collaborative"; // Meta coletiva do grupo

export type ChallengeStatus = "upcoming" | "active" | "completed" | "cancelled";

export interface ChallengeParticipant {
  userId: string;
  userName: string;
  userAvatar?: string;
  progress: number; // Progresso atual (número baseado no tipo de desafio)
  completedAt?: string; // Data de conclusão (se completou)
  rank?: number; // Posição no ranking (para desafios competitivos)
  lastUpdate: string; // Última atualização de progresso
}

export interface GroupChallenge {
  id: string;
  groupId: string;
  createdBy: string;
  createdByName: string;

  // Configuração do Desafio
  title: string;
  description: string;
  type: ChallengeType;

  // Parâmetros
  targetValue: number;
  targetUnit: string; // "kg", "dias", "recordes", "minutos", "%"
  exerciseId?: string; // Para desafios de exercício específico
  exerciseName?: string;

  // Período
  startDate: string;
  endDate: string;

  // Gamificação
  isCompetitive: boolean; // true = ranking, false = apenas completar
  reward?: string; // Badge, título, descrição da recompensa

  // Participantes e Progresso
  participants: ChallengeParticipant[];
  totalParticipants: number;
  completedCount: number; // Quantos completaram

  // Progresso Coletivo (para desafios colaborativos)
  collectiveProgress?: number;
  collectiveTarget?: number;

  // Status
  status: ChallengeStatus;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeBadge {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji ou URL
  category: "volume" | "consistency" | "records" | "exercise" | "collaborative" | "special";
  rarity: "common" | "rare" | "epic" | "legendary";
  requirement: string; // Descrição do requisito
  earnedAt?: string; // Data que ganhou (se ganhou)
}

export interface UserChallengeBadge {
  id: string;
  userId: string;
  badgeId: string;
  badgeName: string;
  badgeIcon: string;
  badgeCategory: ChallengeBadge["category"];
  badgeRarity: ChallengeBadge["rarity"];
  challengeId?: string; // Desafio que desbloqueou (se aplicável)
  challengeTitle?: string;
  earnedAt: string;
}

// ============================================
// PERFIL PÚBLICO E ESTATÍSTICAS
// ============================================

export type PrivacyLevel = "public" | "friends" | "private";

export interface ProfilePrivacySettings {
  badges: PrivacyLevel;
  stats: PrivacyLevel;
  workoutHistory: PrivacyLevel;
  progressPhotos: PrivacyLevel;
  measurements: PrivacyLevel;
  groups: PrivacyLevel;
}

export interface UserStats {
  // Treinos
  totalWorkouts: number;
  totalExercises: number;
  totalSets: number;
  totalReps: number;
  totalVolumeLifted: number; // kg total levantado

  // Tempo
  totalWorkoutTime: number; // minutos
  averageWorkoutDuration: number; // minutos
  longestStreak: number; // dias consecutivos
  currentStreak: number; // dias consecutivos atuais

  // Recordes
  totalPersonalRecords: number;
  strongestLift: {
    exerciseName: string;
    weight: number;
    date: string;
  } | null;
  highestVolume: {
    workoutName: string;
    volume: number;
    date: string;
  } | null;

  // Social
  totalGroups: number;
  totalChallengesJoined: number;
  totalChallengesCompleted: number;
  totalBadges: number;

  // Composição Corporal (do ProfileContext)
  weightChange?: {
    start: number;
    current: number;
    change: number;
    unit: string;
  };
  bodyFatChange?: {
    start: number;
    current: number;
    change: number;
  };
  muscleMassChange?: {
    start: number;
    current: number;
    change: number;
    unit: string;
  };

  // Metadata
  memberSince: string;
  lastWorkout?: string;
}

export interface PublicProfile {
  userId: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  favoriteExercises?: string[];

  // Dados calculados
  stats: UserStats;
  badges: UserChallengeBadge[];

  // Privacidade
  privacySettings: ProfilePrivacySettings;

  // Metadata
  createdAt: string;
  updatedAt: string;
}
