// src/services/workoutsApi.ts
/**
 * Serviço de API para Treinos
 *
 * Este serviço gerencia todos os dados de treinos através da API,
 * substituindo o IndexedDB local para permitir compartilhamento
 * entre profissional e aluno.
 */

import type {
  WorkoutDay,
  PlannedExercise,
  WorkoutSession,
  LoggedExercise,
  ExerciseDefinition,
} from "../types";

// URL base da API
const API_BASE_URL = import.meta.env.VITE_PROFESSIONAL_API_URL?.replace('/professional', '') || 'http://localhost:3000/api';

/**
 * Helper para fazer requisições HTTP
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Adicionar token de autenticação se disponível
  const token = localStorage.getItem('authToken');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }

    // Para DELETE que retorna 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ============================================
// WORKOUT DAYS (Dias de Treino)
// ============================================

export const workoutDaysApi = {
  /**
   * Listar todos os dias de treino de um usuário
   */
  list: async (userId: string): Promise<WorkoutDay[]> => {
    return await apiRequest<WorkoutDay[]>(`/workouts/${userId}/days`);
  },

  /**
   * Obter um dia de treino específico
   */
  get: async (userId: string, dayId: string): Promise<WorkoutDay> => {
    return await apiRequest<WorkoutDay>(`/workouts/${userId}/days/${dayId}`);
  },

  /**
   * Criar novo dia de treino
   */
  create: async (userId: string, day: Omit<WorkoutDay, 'id' | 'createdAt'>): Promise<WorkoutDay> => {
    return await apiRequest<WorkoutDay>(`/workouts/${userId}/days`, {
      method: 'POST',
      body: JSON.stringify(day),
    });
  },

  /**
   * Atualizar dia de treino
   */
  update: async (userId: string, dayId: string, updates: Partial<WorkoutDay>): Promise<WorkoutDay> => {
    return await apiRequest<WorkoutDay>(`/workouts/${userId}/days/${dayId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Deletar dia de treino
   */
  delete: async (userId: string, dayId: string): Promise<void> => {
    await apiRequest(`/workouts/${userId}/days/${dayId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// PLANNED EXERCISES (Exercícios Planejados)
// ============================================

export const plannedExercisesApi = {
  /**
   * Adicionar exercício planejado a um dia de treino
   */
  create: async (
    userId: string,
    dayId: string,
    exercise: Omit<PlannedExercise, 'id' | 'createdAt'>
  ): Promise<PlannedExercise> => {
    return await apiRequest<PlannedExercise>(
      `/workouts/${userId}/days/${dayId}/exercises`,
      {
        method: 'POST',
        body: JSON.stringify(exercise),
      }
    );
  },

  /**
   * Atualizar exercício planejado
   */
  update: async (
    userId: string,
    dayId: string,
    exerciseId: string,
    updates: Partial<PlannedExercise>
  ): Promise<PlannedExercise> => {
    return await apiRequest<PlannedExercise>(
      `/workouts/${userId}/days/${dayId}/exercises/${exerciseId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
  },

  /**
   * Deletar exercício planejado
   */
  delete: async (userId: string, dayId: string, exerciseId: string): Promise<void> => {
    await apiRequest(`/workouts/${userId}/days/${dayId}/exercises/${exerciseId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// WORKOUT SESSIONS (Sessões de Treino)
// ============================================

export const workoutSessionsApi = {
  /**
   * Listar todas as sessões de treino de um usuário
   * Opcionalmente filtrar por período
   */
  list: async (params: {
    userId: string;
    startDate?: string;
    endDate?: string;
    dayId?: string;
  }): Promise<WorkoutSession[]> => {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.dayId) queryParams.append('dayId', params.dayId);

    const queryString = queryParams.toString();
    return await apiRequest<WorkoutSession[]>(
      `/workouts/${params.userId}/sessions${queryString ? '?' + queryString : ''}`
    );
  },

  /**
   * Obter uma sessão específica
   */
  get: async (userId: string, sessionId: string): Promise<WorkoutSession> => {
    return await apiRequest<WorkoutSession>(
      `/workouts/${userId}/sessions/${sessionId}`
    );
  },

  /**
   * Criar nova sessão de treino
   */
  create: async (
    userId: string,
    session: Omit<WorkoutSession, 'id'>
  ): Promise<WorkoutSession> => {
    return await apiRequest<WorkoutSession>(`/workouts/${userId}/sessions`, {
      method: 'POST',
      body: JSON.stringify(session),
    });
  },

  /**
   * Atualizar sessão de treino
   */
  update: async (
    userId: string,
    sessionId: string,
    updates: Partial<WorkoutSession>
  ): Promise<WorkoutSession> => {
    return await apiRequest<WorkoutSession>(
      `/workouts/${userId}/sessions/${sessionId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
  },

  /**
   * Deletar sessão de treino
   */
  delete: async (userId: string, sessionId: string): Promise<void> => {
    await apiRequest(`/workouts/${userId}/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// LOGGED EXERCISES (Exercícios Executados)
// ============================================

export const loggedExercisesApi = {
  /**
   * Listar todos os exercícios executados de um usuário
   * Opcionalmente filtrar por período ou exercício
   */
  list: async (params: {
    userId: string;
    startDate?: string;
    endDate?: string;
    exerciseDefinitionId?: string;
  }): Promise<LoggedExercise[]> => {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.exerciseDefinitionId)
      queryParams.append('exerciseDefinitionId', params.exerciseDefinitionId);

    const queryString = queryParams.toString();
    return await apiRequest<LoggedExercise[]>(
      `/workouts/${params.userId}/logged-exercises${queryString ? '?' + queryString : ''}`
    );
  },

  /**
   * Criar exercício executado
   */
  create: async (
    userId: string,
    exercise: Omit<LoggedExercise, 'id'>
  ): Promise<LoggedExercise> => {
    return await apiRequest<LoggedExercise>(
      `/workouts/${userId}/logged-exercises`,
      {
        method: 'POST',
        body: JSON.stringify(exercise),
      }
    );
  },

  /**
   * Atualizar exercício executado
   */
  update: async (
    userId: string,
    exerciseId: string,
    updates: Partial<LoggedExercise>
  ): Promise<LoggedExercise> => {
    return await apiRequest<LoggedExercise>(
      `/workouts/${userId}/logged-exercises/${exerciseId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
  },

  /**
   * Deletar exercício executado
   */
  delete: async (userId: string, exerciseId: string): Promise<void> => {
    await apiRequest(`/workouts/${userId}/logged-exercises/${exerciseId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// EXERCISE DEFINITIONS (Definições de Exercícios)
// ============================================

export const exerciseDefinitionsApi = {
  /**
   * Listar todas as definições de exercícios disponíveis
   */
  list: async (): Promise<ExerciseDefinition[]> => {
    return await apiRequest<ExerciseDefinition[]>('/exercises/definitions');
  },

  /**
   * Obter uma definição de exercício específica
   */
  get: async (exerciseId: string): Promise<ExerciseDefinition> => {
    return await apiRequest<ExerciseDefinition>(`/exercises/definitions/${exerciseId}`);
  },

  /**
   * Criar nova definição de exercício (custom)
   */
  create: async (
    exercise: Omit<ExerciseDefinition, 'id'>
  ): Promise<ExerciseDefinition> => {
    return await apiRequest<ExerciseDefinition>('/exercises/definitions', {
      method: 'POST',
      body: JSON.stringify(exercise),
    });
  },

  /**
   * Atualizar definição de exercício
   */
  update: async (
    exerciseId: string,
    updates: Partial<ExerciseDefinition>
  ): Promise<ExerciseDefinition> => {
    return await apiRequest<ExerciseDefinition>(
      `/exercises/definitions/${exerciseId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
  },

  /**
   * Deletar definição de exercício
   */
  delete: async (exerciseId: string): Promise<void> => {
    await apiRequest(`/exercises/definitions/${exerciseId}`, {
      method: 'DELETE',
    });
  },
};

// Exportar tudo como um objeto único
export const workoutsApi = {
  days: workoutDaysApi,
  exercises: plannedExercisesApi,
  sessions: workoutSessionsApi,
  logged: loggedExercisesApi,
  definitions: exerciseDefinitionsApi,
};
