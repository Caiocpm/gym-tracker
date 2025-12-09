// src/services/socialApi.ts
/**
 * API Social - Grupos, Posts, Likes, Comentários
 * Substitui Firebase Firestore Social Features
 */

import type { Group, WorkoutPost, Comment, PostLike, GroupChallenge } from '../types/social';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const SOCIAL_API_URL = `${API_BASE_URL}/social`;

/**
 * Helper para fazer requisições HTTP
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${SOCIAL_API_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

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

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ============================================
// GRUPOS API
// ============================================

export const groupsApi = {
  /**
   * Listar grupos do usuário
   */
  list: async (userId: string): Promise<Group[]> => {
    return await apiRequest<Group[]>(`/groups?userId=${userId}`);
  },

  /**
   * Obter grupo específico
   */
  get: async (groupId: string): Promise<Group> => {
    return await apiRequest<Group>(`/groups/${groupId}`);
  },

  /**
   * Criar novo grupo
   */
  create: async (data: {
    name: string;
    description: string;
    photoURL?: string;
    isPrivate: boolean;
    category: string;
  }): Promise<Group> => {
    return await apiRequest<Group>('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Atualizar grupo
   */
  update: async (
    groupId: string,
    updates: Partial<Group>
  ): Promise<Group> => {
    return await apiRequest<Group>(`/groups/${groupId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Deletar grupo
   */
  delete: async (groupId: string): Promise<void> => {
    await apiRequest(`/groups/${groupId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Entrar em grupo
   */
  join: async (groupId: string): Promise<void> => {
    await apiRequest(`/groups/${groupId}/join`, {
      method: 'POST',
    });
  },

  /**
   * Sair de grupo
   */
  leave: async (groupId: string): Promise<void> => {
    await apiRequest(`/groups/${groupId}/leave`, {
      method: 'POST',
    });
  },
};

// ============================================
// POSTS API
// ============================================

export const postsApi = {
  /**
   * Listar posts de um grupo
   */
  list: async (
    groupId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<WorkoutPost[]> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.offset) queryParams.append('offset', String(params.offset));

    const queryString = queryParams.toString();
    return await apiRequest<WorkoutPost[]>(
      `/groups/${groupId}/posts${queryString ? '?' + queryString : ''}`
    );
  },

  /**
   * Criar novo post
   */
  create: async (
    groupId: string,
    data: {
      content: string;
      workoutData?: any;
    }
  ): Promise<WorkoutPost> => {
    return await apiRequest<WorkoutPost>(`/groups/${groupId}/posts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Deletar post
   */
  delete: async (postId: string): Promise<void> => {
    await apiRequest(`/posts/${postId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// LIKES API
// ============================================

export const likesApi = {
  /**
   * Dar like em post
   */
  like: async (postId: string): Promise<{ likesCount: number }> => {
    return await apiRequest<{ likesCount: number }>(`/posts/${postId}/like`, {
      method: 'POST',
    });
  },

  /**
   * Remover like de post
   */
  unlike: async (postId: string): Promise<{ likesCount: number }> => {
    return await apiRequest<{ likesCount: number }>(`/posts/${postId}/like`, {
      method: 'DELETE',
    });
  },

  /**
   * Listar quem deu like
   */
  list: async (
    postId: string
  ): Promise<
    Array<{
      userId: string;
      userName: string;
      userPhotoURL: string | null;
      likedAt: string;
    }>
  > => {
    return await apiRequest(`/posts/${postId}/likes`);
  },
};

// ============================================
// COMENTÁRIOS API
// ============================================

export const commentsApi = {
  /**
   * Listar comentários de um post
   */
  list: async (postId: string): Promise<Comment[]> => {
    return await apiRequest<Comment[]>(`/posts/${postId}/comments`);
  },

  /**
   * Adicionar comentário
   */
  create: async (
    postId: string,
    content: string
  ): Promise<Comment> => {
    return await apiRequest<Comment>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  /**
   * Deletar comentário
   */
  delete: async (commentId: string): Promise<void> => {
    await apiRequest(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// DESAFIOS API
// ============================================

export const challengesApi = {
  /**
   * Listar desafios de um grupo
   */
  list: async (groupId: string): Promise<GroupChallenge[]> => {
    return await apiRequest<GroupChallenge[]>(`/groups/${groupId}/challenges`);
  },

  /**
   * Criar desafio
   */
  create: async (
    groupId: string,
    data: {
      title: string;
      description: string;
      startDate: string;
      endDate: string;
      targetValue: number;
      unit: string;
    }
  ): Promise<GroupChallenge> => {
    return await apiRequest<GroupChallenge>(`/groups/${groupId}/challenges`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Participar de desafio
   */
  join: async (challengeId: string): Promise<void> => {
    await apiRequest(`/challenges/${challengeId}/join`, {
      method: 'POST',
    });
  },

  /**
   * Atualizar progresso
   */
  updateProgress: async (
    challengeId: string,
    progress: number
  ): Promise<void> => {
    await apiRequest(`/challenges/${challengeId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ progress }),
    });
  },
};

// Exportar tudo como um objeto único
export const socialApi = {
  groups: groupsApi,
  posts: postsApi,
  likes: likesApi,
  comments: commentsApi,
  challenges: challengesApi,
};
