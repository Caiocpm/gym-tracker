// src/services/professionalApi.ts
/**
 * Serviço de API para a Área Profissional
 *
 * Este arquivo centraliza todas as chamadas de API relacionadas à área profissional.
 * Substitui as chamadas diretas ao Firebase Firestore.
 *
 * TODO: Configure a URL base da sua API no arquivo .env
 * Exemplo: VITE_PROFESSIONAL_API_URL=https://api.seudominio.com/professional
 */

import type {
  ProfessionalProfile,
  StudentLink,
  StudentInvitation,
  Tag,
  StudentNote,
  StudentGoal,
  EvaluationSchedule,
  ProfessionalStats,
  ProfessionalRegistrationData,
} from "../types/professional";

// URL base da API - Configure no .env
const API_BASE_URL = import.meta.env.VITE_PROFESSIONAL_API_URL || 'http://localhost:3000/api/professional';

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
  const token = localStorage.getItem('authToken'); // Adapte conforme seu sistema de auth
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

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ============================================
// PROFESSIONAL PROFILE
// ============================================

export const professionalProfileApi = {
  /**
   * Obter perfil profissional por userId
   */
  getProfile: async (userId: string): Promise<ProfessionalProfile | null> => {
    try {
      return await apiRequest<ProfessionalProfile>(`/profile/${userId}`);
    } catch (error) {
      console.error('Erro ao buscar perfil profissional:', error);
      return null;
    }
  },

  /**
   * Registrar novo profissional
   */
  register: async (data: ProfessionalRegistrationData): Promise<ProfessionalProfile> => {
    return await apiRequest<ProfessionalProfile>('/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Atualizar perfil profissional
   */
  updateProfile: async (
    userId: string,
    updates: Partial<ProfessionalProfile>
  ): Promise<ProfessionalProfile> => {
    return await apiRequest<ProfessionalProfile>(`/profile/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
};

// ============================================
// STUDENT LINKS
// ============================================

export const studentLinksApi = {
  /**
   * Listar todos os alunos vinculados a um profissional
   */
  list: async (professionalId: string): Promise<StudentLink[]> => {
    return await apiRequest<StudentLink[]>(`/students?professionalId=${professionalId}`);
  },

  /**
   * Obter um link específico
   */
  get: async (linkId: string): Promise<StudentLink> => {
    return await apiRequest<StudentLink>(`/students/${linkId}`);
  },

  /**
   * Atualizar link de aluno
   */
  update: async (linkId: string, updates: Partial<StudentLink>): Promise<StudentLink> => {
    return await apiRequest<StudentLink>(`/students/${linkId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Desvincular aluno
   */
  unlink: async (linkId: string): Promise<void> => {
    await apiRequest(`/students/${linkId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// INVITATIONS
// ============================================

export const invitationsApi = {
  /**
   * Listar convites pendentes
   */
  listPending: async (professionalId: string): Promise<StudentInvitation[]> => {
    return await apiRequest<StudentInvitation[]>(
      `/invitations?professionalId=${professionalId}&status=pending`
    );
  },

  /**
   * Criar novo convite
   */
  create: async (data: {
    professionalId: string;
    studentEmail: string;
    accessLevel: StudentLink['accessLevel'];
    message?: string;
  }): Promise<StudentInvitation> => {
    return await apiRequest<StudentInvitation>('/invitations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Aceitar convite (chamado pelo aluno)
   */
  accept: async (invitationCode: string, studentUserId: string): Promise<StudentLink> => {
    return await apiRequest<StudentLink>(`/invitations/${invitationCode}/accept`, {
      method: 'POST',
      body: JSON.stringify({ studentUserId }),
    });
  },

  /**
   * Rejeitar convite
   */
  reject: async (invitationId: string): Promise<void> => {
    await apiRequest(`/invitations/${invitationId}/reject`, {
      method: 'POST',
    });
  },
};

// ============================================
// TAGS
// ============================================

export const tagsApi = {
  /**
   * Listar todas as tags de um profissional
   */
  list: async (professionalId: string): Promise<Tag[]> => {
    return await apiRequest<Tag[]>(`/tags?professionalId=${professionalId}`);
  },

  /**
   * Criar nova tag
   */
  create: async (data: {
    professionalId: string;
    name: string;
    color: string;
    description?: string;
  }): Promise<Tag> => {
    return await apiRequest<Tag>('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Deletar tag
   */
  delete: async (tagId: string): Promise<void> => {
    await apiRequest(`/tags/${tagId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Adicionar tag a um aluno
   */
  addToStudent: async (studentLinkId: string, tagId: string): Promise<void> => {
    await apiRequest(`/students/${studentLinkId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tagId }),
    });
  },

  /**
   * Remover tag de um aluno
   */
  removeFromStudent: async (studentLinkId: string, tagId: string): Promise<void> => {
    await apiRequest(`/students/${studentLinkId}/tags/${tagId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// NOTES
// ============================================

export const notesApi = {
  /**
   * Listar notas (todas ou de um aluno específico)
   */
  list: async (params?: { studentLinkId?: string; professionalId?: string }): Promise<StudentNote[]> => {
    const queryParams = new URLSearchParams();
    if (params?.studentLinkId) queryParams.append('studentLinkId', params.studentLinkId);
    if (params?.professionalId) queryParams.append('professionalId', params.professionalId);

    const queryString = queryParams.toString();
    return await apiRequest<StudentNote[]>(`/notes${queryString ? '?' + queryString : ''}`);
  },

  /**
   * Criar nova nota
   */
  create: async (data: {
    studentLinkId: string;
    professionalId: string;
    title: string;
    content: string;
    category: StudentNote['category'];
    tags?: string[];
  }): Promise<StudentNote> => {
    return await apiRequest<StudentNote>('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Atualizar nota
   */
  update: async (noteId: string, updates: Partial<StudentNote>): Promise<StudentNote> => {
    return await apiRequest<StudentNote>(`/notes/${noteId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Deletar nota
   */
  delete: async (noteId: string): Promise<void> => {
    await apiRequest(`/notes/${noteId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// GOALS
// ============================================

export const goalsApi = {
  /**
   * Listar metas (todas ou de um aluno específico)
   */
  list: async (params?: { studentLinkId?: string; professionalId?: string }): Promise<StudentGoal[]> => {
    const queryParams = new URLSearchParams();
    if (params?.studentLinkId) queryParams.append('studentLinkId', params.studentLinkId);
    if (params?.professionalId) queryParams.append('professionalId', params.professionalId);

    const queryString = queryParams.toString();
    return await apiRequest<StudentGoal[]>(`/goals${queryString ? '?' + queryString : ''}`);
  },

  /**
   * Criar nova meta
   */
  create: async (data: {
    studentLinkId: string;
    professionalId: string;
    title: string;
    description: string;
    category: StudentGoal['category'];
    currentValue: number;
    targetValue: number;
    unit: string;
    targetDate: string;
    startDate?: string;
  }): Promise<StudentGoal> => {
    return await apiRequest<StudentGoal>('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Atualizar meta
   */
  update: async (goalId: string, updates: Partial<StudentGoal>): Promise<StudentGoal> => {
    return await apiRequest<StudentGoal>(`/goals/${goalId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Deletar meta
   */
  delete: async (goalId: string): Promise<void> => {
    await apiRequest(`/goals/${goalId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// EVALUATIONS
// ============================================

export const evaluationsApi = {
  /**
   * Listar avaliações (todas ou de um aluno específico)
   */
  list: async (params?: { studentLinkId?: string; professionalId?: string }): Promise<EvaluationSchedule[]> => {
    const queryParams = new URLSearchParams();
    if (params?.studentLinkId) queryParams.append('studentLinkId', params.studentLinkId);
    if (params?.professionalId) queryParams.append('professionalId', params.professionalId);

    const queryString = queryParams.toString();
    return await apiRequest<EvaluationSchedule[]>(`/evaluations${queryString ? '?' + queryString : ''}`);
  },

  /**
   * Criar nova avaliação
   */
  create: async (data: {
    studentLinkId: string;
    professionalId: string;
    title: string;
    type: EvaluationSchedule['type'];
    scheduledDate: string;
    scheduledTime: string;
    duration: number;
    location?: string;
  }): Promise<EvaluationSchedule> => {
    return await apiRequest<EvaluationSchedule>('/evaluations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Atualizar avaliação
   */
  update: async (evaluationId: string, updates: Partial<EvaluationSchedule>): Promise<EvaluationSchedule> => {
    return await apiRequest<EvaluationSchedule>(`/evaluations/${evaluationId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Deletar avaliação
   */
  delete: async (evaluationId: string): Promise<void> => {
    await apiRequest(`/evaluations/${evaluationId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// STATS
// ============================================

export const statsApi = {
  /**
   * Obter estatísticas do profissional
   */
  get: async (professionalId: string): Promise<ProfessionalStats> => {
    return await apiRequest<ProfessionalStats>(`/stats?professionalId=${professionalId}`);
  },
};

// ============================================
// CONVERSATIONS (Conversas/Chat)
// ============================================

export const conversationsApi = {
  /**
   * Listar conversas
   */
  list: async (params?: {
    studentLinkId?: string;
    professionalId?: string;
    includeArchived?: boolean;
  }): Promise<any[]> => {
    const queryParams = new URLSearchParams();
    if (params?.studentLinkId) queryParams.append('studentLinkId', params.studentLinkId);
    if (params?.professionalId) queryParams.append('professionalId', params.professionalId);
    if (params?.includeArchived !== undefined)
      queryParams.append('includeArchived', String(params.includeArchived));

    const queryString = queryParams.toString();
    return await apiRequest<any[]>(`/conversations${queryString ? '?' + queryString : ''}`);
  },

  /**
   * Obter uma conversa específica
   */
  get: async (conversationId: string): Promise<any> => {
    return await apiRequest<any>(`/conversations/${conversationId}`);
  },

  /**
   * Criar nova conversa
   */
  create: async (data: {
    studentLinkId: string;
    professionalId: string;
    studentUserId: string;
    title: string;
    category: string;
    initialMessage: string;
  }): Promise<any> => {
    return await apiRequest<any>('/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Adicionar mensagem à conversa
   */
  addMessage: async (
    conversationId: string,
    data: {
      senderId: string;
      senderType: 'professional' | 'student';
      senderName: string;
      content: string;
    }
  ): Promise<any> => {
    return await apiRequest<any>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Marcar mensagens como lidas
   */
  markAsRead: async (
    conversationId: string,
    userId: string,
    userType: 'professional' | 'student'
  ): Promise<void> => {
    await apiRequest(`/conversations/${conversationId}/read`, {
      method: 'POST',
      body: JSON.stringify({ userId, userType }),
    });
  },

  /**
   * Arquivar conversa
   */
  archive: async (conversationId: string): Promise<void> => {
    await apiRequest(`/conversations/${conversationId}/archive`, {
      method: 'POST',
    });
  },

  /**
   * Desarquivar conversa
   */
  unarchive: async (conversationId: string): Promise<void> => {
    await apiRequest(`/conversations/${conversationId}/unarchive`, {
      method: 'POST',
    });
  },

  /**
   * Deletar conversa
   */
  delete: async (conversationId: string): Promise<void> => {
    await apiRequest(`/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  },
};

// Exportar tudo como um objeto único também
export const professionalApi = {
  profile: professionalProfileApi,
  students: studentLinksApi,
  invitations: invitationsApi,
  tags: tagsApi,
  notes: notesApi,
  goals: goalsApi,
  evaluations: evaluationsApi,
  stats: statsApi,
  conversations: conversationsApi,
};
