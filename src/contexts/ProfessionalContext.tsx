import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { db as indexedDB } from "../db/database";
import { useAuth } from "./AuthContext";
import type {
  ProfessionalProfile,
  StudentLink,
  StudentInvitation,
  ProfessionalState,
  ProfessionalAction,
  ProfessionalRegistrationData,
  ActiveProfessionalSession,
} from "../types/professional";
import { professionalApi } from "../services/professionalApi";

// Estado inicial
const initialState: ProfessionalState = {
  professionalProfile: null,
  studentLinks: [],
  activeSession: null,
  pendingInvitations: [],
  isLoading: false,
  error: null,
};

// Reducer para gerenciar o estado profissional
function professionalReducer(
  state: ProfessionalState,
  action: ProfessionalAction
): ProfessionalState {
  switch (action.type) {
    case "SET_PROFESSIONAL_PROFILE":
      return {
        ...state,
        professionalProfile: action.payload,
        isLoading: false,
      };

    case "UPDATE_PROFESSIONAL_PROFILE":
      if (!state.professionalProfile) return state;
      return {
        ...state,
        professionalProfile: {
          ...state.professionalProfile,
          ...action.payload,
          updatedAt: new Date().toISOString(),
        },
      };

    case "SET_STUDENT_LINKS":
      return {
        ...state,
        studentLinks: action.payload,
      };

    case "ADD_STUDENT_LINK":
      return {
        ...state,
        studentLinks: [...state.studentLinks, action.payload],
      };

    case "UPDATE_STUDENT_LINK":
      return {
        ...state,
        studentLinks: state.studentLinks.map((link) =>
          link.id === action.payload.id
            ? { ...link, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : link
        ),
      };

    case "REMOVE_STUDENT_LINK":
      return {
        ...state,
        studentLinks: state.studentLinks.filter((link) => link.id !== action.payload),
      };

    case "SET_ACTIVE_STUDENT":
      return {
        ...state,
        activeSession: state.activeSession
          ? {
              ...state.activeSession,
              activeStudentId: action.payload.studentId,
              activeStudentName: action.payload.studentName,
            }
          : null,
      };

    case "SET_MODE":
      if (!state.activeSession) return state;
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          mode: action.payload,
          // Se voltar ao modo pessoal, limpar aluno ativo
          activeStudentId: action.payload === "personal" ? null : state.activeSession.activeStudentId,
        },
      };

    case "INIT_SESSION":
      return {
        ...state,
        activeSession: action.payload,
      };

    case "SET_PENDING_INVITATIONS":
      return {
        ...state,
        pendingInvitations: action.payload,
      };

    case "ADD_INVITATION":
      return {
        ...state,
        pendingInvitations: [...state.pendingInvitations, action.payload],
      };

    case "UPDATE_INVITATION":
      return {
        ...state,
        pendingInvitations: state.pendingInvitations.map((inv) =>
          inv.id === action.payload.id ? { ...inv, ...action.payload.updates } : inv
        ),
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case "CLEAR_PROFESSIONAL_DATA":
      return initialState;

    default:
      return state;
  }
}

// Interface do contexto
interface ProfessionalContextType extends ProfessionalState {
  dispatch: React.Dispatch<ProfessionalAction>;
  isProfessional: boolean;
  isInProfessionalMode: boolean;
  registerAsProfessional: (data: ProfessionalRegistrationData) => Promise<void>;
  updateProfessionalProfile: (updates: Partial<ProfessionalProfile>) => Promise<void>;
  inviteStudent: (studentEmail: string, accessLevel: StudentLink["accessLevel"], message?: string) => Promise<void>;
  acceptInvitation: (invitationCode: string) => Promise<void>;
  rejectInvitation: (invitationId: string) => Promise<void>;
  unlinkStudent: (linkId: string) => Promise<void>;
  switchToStudent: (studentId: string) => void;
  switchToPersonalMode: () => void;
  switchToProfessionalMode: () => void;
  loadStudentLinks: () => Promise<void>;
  loadPendingInvitations: () => Promise<void>;
}

// Criar o contexto
const ProfessionalContext = createContext<ProfessionalContextType | undefined>(undefined);

// Provider
interface ProfessionalProviderProps {
  children: ReactNode;
}

export function ProfessionalProvider({ children }: ProfessionalProviderProps) {
  const [state, dispatch] = useReducer(professionalReducer, initialState);
  const { currentUser } = useAuth();

  // Verificar se o usuário é profissional
  const isProfessional = state.professionalProfile !== null && state.professionalProfile.isActive;

  // Verificar se está em modo profissional
  const isInProfessionalMode = state.activeSession?.mode === "professional";

  // Carregar perfil profissional do usuário
  useEffect(() => {
    if (!currentUser) {
      dispatch({ type: "CLEAR_PROFESSIONAL_DATA" });
      return;
    }

    const loadProfessionalProfile = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });

        // Buscar no IndexedDB primeiro
        const localProfile = await indexedDB.professionalProfiles.get(currentUser.uid);

        if (localProfile) {
          dispatch({ type: "SET_PROFESSIONAL_PROFILE", payload: localProfile });

          // Criar sessão profissional se for profissional ativo
          if (localProfile.isActive) {
            const session: ActiveProfessionalSession = {
              professionalId: localProfile.id,
              professionalName: localProfile.displayName,
              activeStudentId: null,
              mode: "personal", // Iniciar em modo pessoal
            };

            // Inicializar a sessão
            dispatch({ type: "INIT_SESSION", payload: session });

            // Carregar lista de alunos
            await loadStudentLinks();
          }
        } else {
          // Buscar na API
          const apiProfile = await professionalApi.profile.getProfile(currentUser.uid);

          if (apiProfile) {
            // Salvar no IndexedDB
            await indexedDB.professionalProfiles.put(apiProfile);
            dispatch({ type: "SET_PROFESSIONAL_PROFILE", payload: apiProfile });

            if (apiProfile.isActive) {
              const session: ActiveProfessionalSession = {
                professionalId: apiProfile.id,
                professionalName: apiProfile.displayName,
                activeStudentId: null,
                mode: "personal",
              };

              dispatch({ type: "INIT_SESSION", payload: session });
              await loadStudentLinks();
            }
          } else {
            dispatch({ type: "SET_PROFESSIONAL_PROFILE", payload: null });
          }
        }

        dispatch({ type: "SET_LOADING", payload: false });
      } catch (error) {
        console.error("Erro ao carregar perfil profissional:", error);
        dispatch({ type: "SET_ERROR", payload: "Erro ao carregar perfil profissional" });
      }
    };

    loadProfessionalProfile();
  }, [currentUser]);

  // Registrar como profissional
  const registerAsProfessional = useCallback(
    async (data: ProfessionalRegistrationData) => {
      if (!currentUser) {
        throw new Error("Usuário não autenticado");
      }

      try {
        dispatch({ type: "SET_LOADING", payload: true });

        // Registrar via API
        const professionalProfile = await professionalApi.profile.register(data);

        // Salvar no IndexedDB
        await indexedDB.professionalProfiles.put(professionalProfile);

        dispatch({ type: "SET_PROFESSIONAL_PROFILE", payload: professionalProfile });
        dispatch({ type: "SET_LOADING", payload: false });
      } catch (error) {
        console.error("Erro ao registrar profissional:", error);
        dispatch({ type: "SET_ERROR", payload: "Erro ao registrar como profissional" });
        throw error;
      }
    },
    [currentUser]
  );

  // Atualizar perfil profissional
  const updateProfessionalProfile = useCallback(
    async (updates: Partial<ProfessionalProfile>) => {
      if (!currentUser || !state.professionalProfile) {
        throw new Error("Perfil profissional não encontrado");
      }

      try {
        // Atualizar via API
        const updatedProfile = await professionalApi.profile.updateProfile(
          currentUser.uid,
          updates
        );

        // Atualizar no IndexedDB
        await indexedDB.professionalProfiles.put(updatedProfile);

        dispatch({ type: "UPDATE_PROFESSIONAL_PROFILE", payload: updates });
      } catch (error) {
        console.error("Erro ao atualizar perfil profissional:", error);
        dispatch({ type: "SET_ERROR", payload: "Erro ao atualizar perfil" });
        throw error;
      }
    },
    [currentUser, state.professionalProfile]
  );

  // Convidar aluno
  const inviteStudent = useCallback(
    async (studentEmail: string, accessLevel: StudentLink["accessLevel"], message?: string) => {
      if (!currentUser || !state.professionalProfile) {
        throw new Error("Perfil profissional não encontrado");
      }

      try {
        // Criar convite via API
        const invitation = await professionalApi.invitations.create({
          professionalId: currentUser.uid,
          studentEmail,
          accessLevel,
          message,
        });

        // Salvar no IndexedDB
        await indexedDB.studentInvitations.put(invitation);

        dispatch({ type: "ADD_INVITATION", payload: invitation });
      } catch (error) {
        console.error("Erro ao convidar aluno:", error);
        dispatch({ type: "SET_ERROR", payload: "Erro ao enviar convite" });
        throw error;
      }
    },
    [currentUser, state.professionalProfile]
  );

  // Aceitar convite (chamado pelo aluno)
  const acceptInvitation = useCallback(
    async (invitationCode: string) => {
      if (!currentUser) {
        throw new Error("Usuário não autenticado");
      }

      try {
        // Aceitar convite via API
        const link = await professionalApi.invitations.accept(
          invitationCode,
          currentUser.uid
        );

        // Salvar no IndexedDB
        await indexedDB.studentLinks.put(link);
      } catch (error) {
        console.error("Erro ao aceitar convite:", error);
        throw error;
      }
    },
    [currentUser]
  );

  // Rejeitar convite
  const rejectInvitation = useCallback(async (invitationId: string) => {
    try {
      await professionalApi.invitations.reject(invitationId);

      dispatch({
        type: "UPDATE_INVITATION",
        payload: { id: invitationId, updates: { status: "rejected" } },
      });
    } catch (error) {
      console.error("Erro ao rejeitar convite:", error);
      throw error;
    }
  }, []);

  // Desvincular aluno
  const unlinkStudent = useCallback(async (linkId: string) => {
    try {
      await professionalApi.students.unlink(linkId);

      dispatch({ type: "REMOVE_STUDENT_LINK", payload: linkId });
    } catch (error) {
      console.error("Erro ao desvincular aluno:", error);
      throw error;
    }
  }, []);

  // Alternar para visualizar aluno específico
  const switchToStudent = useCallback((studentId: string) => {
    const student = state.studentLinks.find((link) => link.studentUserId === studentId);
    if (student) {
      dispatch({
        type: "SET_ACTIVE_STUDENT",
        payload: { studentId, studentName: student.studentName },
      });
      dispatch({ type: "SET_MODE", payload: "professional" });
    }
  }, [state.studentLinks]);

  // Voltar ao modo pessoal
  const switchToPersonalMode = useCallback(() => {
    dispatch({ type: "SET_MODE", payload: "personal" });
    dispatch({ type: "SET_ACTIVE_STUDENT", payload: { studentId: null } });
  }, []);

  // Alternar para modo profissional
  const switchToProfessionalMode = useCallback(() => {
    dispatch({ type: "SET_MODE", payload: "professional" });
  }, []);

  // Carregar links de alunos
  const loadStudentLinks = useCallback(async () => {
    if (!currentUser) return;

    try {
      // Primeiro, buscar no IndexedDB
      const localLinks = await indexedDB.studentLinks
        .where("professionalId")
        .equals(currentUser.uid)
        .and((link) => link.status === "active")
        .toArray();

      if (localLinks.length > 0) {
        dispatch({ type: "SET_STUDENT_LINKS", payload: localLinks });
      }

      // Depois, buscar via API e sincronizar
      const apiLinks = await professionalApi.students.list(currentUser.uid);

      if (apiLinks.length > 0) {
        // Salvar no IndexedDB
        await Promise.all(apiLinks.map((link) => indexedDB.studentLinks.put(link)));
        dispatch({ type: "SET_STUDENT_LINKS", payload: apiLinks });
      }
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
    }
  }, [currentUser]);

  // Carregar convites pendentes
  const loadPendingInvitations = useCallback(async () => {
    if (!currentUser) return;

    try {
      // Primeiro, buscar no IndexedDB
      const localInvitations = await indexedDB.studentInvitations
        .where("professionalId")
        .equals(currentUser.uid)
        .and((inv) => inv.status === "pending")
        .toArray();

      if (localInvitations.length > 0) {
        dispatch({ type: "SET_PENDING_INVITATIONS", payload: localInvitations });
      }

      // Depois, buscar via API e sincronizar
      const apiInvitations = await professionalApi.invitations.listPending(currentUser.uid);

      if (apiInvitations.length > 0) {
        // Salvar no IndexedDB
        await Promise.all(apiInvitations.map((inv) => indexedDB.studentInvitations.put(inv)));
        dispatch({ type: "SET_PENDING_INVITATIONS", payload: apiInvitations });
      }
    } catch (error) {
      console.error("Erro ao carregar convites:", error);
    }
  }, [currentUser]);

  const value: ProfessionalContextType = {
    ...state,
    dispatch,
    isProfessional,
    isInProfessionalMode,
    registerAsProfessional,
    updateProfessionalProfile,
    inviteStudent,
    acceptInvitation,
    rejectInvitation,
    unlinkStudent,
    switchToStudent,
    switchToPersonalMode,
    switchToProfessionalMode,
    loadStudentLinks,
    loadPendingInvitations,
  };

  return (
    <ProfessionalContext.Provider value={value}>
      {children}
    </ProfessionalContext.Provider>
  );
}

// Hook customizado
export function useProfessional() {
  const context = useContext(ProfessionalContext);
  if (context === undefined) {
    throw new Error("useProfessional must be used within a ProfessionalProvider");
  }
  return context;
}
