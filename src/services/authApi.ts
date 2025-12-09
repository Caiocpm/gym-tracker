// src/services/authApi.ts
/**
 * API de Autenticação
 * Substitui Firebase Authentication por JWT próprio
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const AUTH_API_URL = `${API_BASE_URL}/auth`;

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

/**
 * Helper para fazer requisições HTTP
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${AUTH_API_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Adicionar token se disponível
  const token = localStorage.getItem('authToken');
  if (token && !endpoint.includes('/login') && !endpoint.includes('/register')) {
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

    // Se for 204 No Content, retornar objeto vazio
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * Salvar tokens no localStorage
 */
function saveTokens(token: string, refreshToken: string) {
  localStorage.setItem('authToken', token);
  localStorage.setItem('refreshToken', refreshToken);
}

/**
 * Limpar tokens do localStorage
 */
function clearTokens() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
}

// ============================================
// AUTH API
// ============================================

export const authApi = {
  /**
   * Registrar novo usuário
   */
  register: async (
    email: string,
    password: string,
    displayName: string
  ): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });

    saveTokens(response.token, response.refreshToken);
    return response;
  },

  /**
   * Login com email e senha
   */
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    saveTokens(response.token, response.refreshToken);
    return response;
  },

  /**
   * Login com Google OAuth
   */
  loginWithGoogle: async (idToken: string): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/login/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });

    saveTokens(response.token, response.refreshToken);
    return response;
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    try {
      await apiRequest('/logout', {
        method: 'POST',
      });
    } finally {
      clearTokens();
    }
  },

  /**
   * Renovar token expirado
   */
  refreshToken: async (): Promise<string> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiRequest<{ token: string; refreshToken: string }>(
      '/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }
    );

    saveTokens(response.token, response.refreshToken);
    return response.token;
  },

  /**
   * Solicitar reset de senha
   */
  resetPassword: async (email: string): Promise<void> => {
    await apiRequest('/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Confirmar nova senha
   */
  confirmResetPassword: async (
    token: string,
    newPassword: string
  ): Promise<void> => {
    await apiRequest('/reset-password/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  /**
   * Obter usuário atual
   */
  getCurrentUser: async (): Promise<AuthUser> => {
    return await apiRequest<AuthUser>('/me');
  },

  /**
   * Verificar se tem token válido
   */
  hasValidToken: (): boolean => {
    return !!localStorage.getItem('authToken');
  },

  /**
   * Obter token atual
   */
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },
};

// ============================================
// INTERCEPTOR DE TOKEN EXPIRADO
// ============================================

/**
 * Configurar interceptor global para renovar token automaticamente
 */
export function setupAuthInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    let [url, options] = args;

    try {
      let response = await originalFetch(url, options);

      // Se receber 401 Unauthorized, tentar renovar token
      if (response.status === 401) {
        try {
          const newToken = await authApi.refreshToken();

          // Retentar requisição com novo token
          if (options && typeof options === 'object') {
            options.headers = {
              ...options.headers,
              Authorization: `Bearer ${newToken}`,
            };
          }

          response = await originalFetch(url, options);
        } catch (refreshError) {
          // Se falhar ao renovar, fazer logout
          clearTokens();
          window.location.href = '/login';
          throw refreshError;
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  };
}
