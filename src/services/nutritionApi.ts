// src/services/nutritionApi.ts
/**
 * Serviço de API para Nutrição
 *
 * Este serviço gerencia todos os dados de nutrição através da API,
 * substituindo o IndexedDB local para permitir compartilhamento
 * entre profissional e aluno.
 */

import type {
  FoodEntry,
  WaterEntry,
  DailyGoals,
  PredefinedFood,
} from "../types/nutrition";

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
// FOOD ENTRIES (Refeições)
// ============================================

export const foodEntriesApi = {
  /**
   * Listar todas as refeições de um usuário
   * Opcionalmente filtrar por data
   */
  list: async (params: {
    userId: string;
    startDate?: string;
    endDate?: string;
    date?: string;
  }): Promise<FoodEntry[]> => {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.date) queryParams.append('date', params.date);

    const queryString = queryParams.toString();
    return await apiRequest<FoodEntry[]>(
      `/nutrition/${params.userId}/food${queryString ? '?' + queryString : ''}`
    );
  },

  /**
   * Obter uma refeição específica
   */
  get: async (userId: string, entryId: string): Promise<FoodEntry> => {
    return await apiRequest<FoodEntry>(`/nutrition/${userId}/food/${entryId}`);
  },

  /**
   * Criar nova refeição
   */
  create: async (userId: string, entry: Omit<FoodEntry, 'id'>): Promise<FoodEntry> => {
    return await apiRequest<FoodEntry>(`/nutrition/${userId}/food`, {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },

  /**
   * Atualizar refeição
   */
  update: async (
    userId: string,
    entryId: string,
    updates: Partial<FoodEntry>
  ): Promise<FoodEntry> => {
    return await apiRequest<FoodEntry>(`/nutrition/${userId}/food/${entryId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Deletar refeição
   */
  delete: async (userId: string, entryId: string): Promise<void> => {
    await apiRequest(`/nutrition/${userId}/food/${entryId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Marcar refeição como consumida
   */
  markAsConsumed: async (userId: string, entryId: string): Promise<FoodEntry> => {
    return await apiRequest<FoodEntry>(
      `/nutrition/${userId}/food/${entryId}/consume`,
      {
        method: 'POST',
      }
    );
  },

  /**
   * Desmarcar refeição como consumida
   */
  unmarkAsConsumed: async (userId: string, entryId: string): Promise<FoodEntry> => {
    return await apiRequest<FoodEntry>(
      `/nutrition/${userId}/food/${entryId}/unconsume`,
      {
        method: 'POST',
      }
    );
  },
};

// ============================================
// WATER ENTRIES (Água)
// ============================================

export const waterEntriesApi = {
  /**
   * Listar todas as entradas de água de um usuário
   * Opcionalmente filtrar por data
   */
  list: async (params: {
    userId: string;
    startDate?: string;
    endDate?: string;
    date?: string;
  }): Promise<WaterEntry[]> => {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.date) queryParams.append('date', params.date);

    const queryString = queryParams.toString();
    return await apiRequest<WaterEntry[]>(
      `/nutrition/${params.userId}/water${queryString ? '?' + queryString : ''}`
    );
  },

  /**
   * Obter uma entrada de água específica
   */
  get: async (userId: string, entryId: string): Promise<WaterEntry> => {
    return await apiRequest<WaterEntry>(`/nutrition/${userId}/water/${entryId}`);
  },

  /**
   * Criar nova entrada de água
   */
  create: async (userId: string, entry: Omit<WaterEntry, 'id'>): Promise<WaterEntry> => {
    return await apiRequest<WaterEntry>(`/nutrition/${userId}/water`, {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },

  /**
   * Atualizar entrada de água
   */
  update: async (
    userId: string,
    entryId: string,
    updates: Partial<WaterEntry>
  ): Promise<WaterEntry> => {
    return await apiRequest<WaterEntry>(`/nutrition/${userId}/water/${entryId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Deletar entrada de água
   */
  delete: async (userId: string, entryId: string): Promise<void> => {
    await apiRequest(`/nutrition/${userId}/water/${entryId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Marcar água como consumida
   */
  markAsConsumed: async (userId: string, entryId: string): Promise<WaterEntry> => {
    return await apiRequest<WaterEntry>(
      `/nutrition/${userId}/water/${entryId}/consume`,
      {
        method: 'POST',
      }
    );
  },

  /**
   * Desmarcar água como consumida
   */
  unmarkAsConsumed: async (userId: string, entryId: string): Promise<WaterEntry> => {
    return await apiRequest<WaterEntry>(
      `/nutrition/${userId}/water/${entryId}/unconsume`,
      {
        method: 'POST',
      }
    );
  },
};

// ============================================
// DAILY GOALS (Metas Diárias)
// ============================================

export const dailyGoalsApi = {
  /**
   * Obter metas diárias do usuário
   */
  get: async (userId: string): Promise<DailyGoals> => {
    return await apiRequest<DailyGoals>(`/nutrition/${userId}/goals`);
  },

  /**
   * Atualizar metas diárias
   */
  update: async (userId: string, goals: Partial<DailyGoals>): Promise<DailyGoals> => {
    return await apiRequest<DailyGoals>(`/nutrition/${userId}/goals`, {
      method: 'PATCH',
      body: JSON.stringify(goals),
    });
  },
};

// ============================================
// PREDEFINED FOODS (Alimentos Pré-definidos)
// ============================================

export const predefinedFoodsApi = {
  /**
   * Listar todos os alimentos pré-definidos
   * Opcionalmente filtrar por categoria ou busca
   */
  list: async (params?: {
    category?: string;
    search?: string;
  }): Promise<PredefinedFood[]> => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    return await apiRequest<PredefinedFood[]>(
      `/nutrition/foods${queryString ? '?' + queryString : ''}`
    );
  },

  /**
   * Obter um alimento pré-definido específico
   */
  get: async (foodId: string): Promise<PredefinedFood> => {
    return await apiRequest<PredefinedFood>(`/nutrition/foods/${foodId}`);
  },

  /**
   * Criar novo alimento customizado
   */
  create: async (food: Omit<PredefinedFood, 'id'>): Promise<PredefinedFood> => {
    return await apiRequest<PredefinedFood>('/nutrition/foods', {
      method: 'POST',
      body: JSON.stringify(food),
    });
  },

  /**
   * Atualizar alimento
   */
  update: async (
    foodId: string,
    updates: Partial<PredefinedFood>
  ): Promise<PredefinedFood> => {
    return await apiRequest<PredefinedFood>(`/nutrition/foods/${foodId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Deletar alimento customizado
   */
  delete: async (foodId: string): Promise<void> => {
    await apiRequest(`/nutrition/foods/${foodId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// NUTRITION STATS (Estatísticas)
// ============================================

export const nutritionStatsApi = {
  /**
   * Obter resumo nutricional de um período
   */
  getSummary: async (params: {
    userId: string;
    startDate: string;
    endDate: string;
  }): Promise<{
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalWater: number;
    averageCaloriesPerDay: number;
    daysTracked: number;
    adherenceRate: number;
  }> => {
    const queryParams = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
    });

    return await apiRequest(
      `/nutrition/${params.userId}/stats/summary?${queryParams.toString()}`
    );
  },

  /**
   * Obter progresso diário
   */
  getDailyProgress: async (userId: string, date: string): Promise<{
    consumed: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      water: number;
    };
    goals: DailyGoals;
    progress: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      water: number;
    };
  }> => {
    return await apiRequest(
      `/nutrition/${userId}/stats/daily?date=${date}`
    );
  },
};

// Exportar tudo como um objeto único
export const nutritionApi = {
  food: foodEntriesApi,
  water: waterEntriesApi,
  goals: dailyGoalsApi,
  predefinedFoods: predefinedFoodsApi,
  stats: nutritionStatsApi,
};
