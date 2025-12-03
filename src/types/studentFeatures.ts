// src/types/studentFeatures.ts

/**
 * Representa uma anotação feita por um profissional sobre um aluno.
 */
export interface StudentNote {
  id: string;
  professionalId: string;
  studentId: string;
  title?: string; // Título opcional da anotação
  content: string; // Conteúdo principal da anotação
  category: "progress" | "health" | "behavior" | "evaluation" | "other"; // Categoria da anotação
  createdAt: string; // Data de criação (ISO string)
  updatedAt: string; // Data da última atualização (ISO string)
}

/**
 * Representa uma meta definida para um aluno por um profissional.
 */
export interface StudentGoal {
  id: string;
  professionalId: string;
  studentId: string;
  title: string; // Título da meta (ex: "Perder 5kg")
  description?: string; // Descrição detalhada da meta
  category:
    | "weight"
    | "strength"
    | "endurance"
    | "flexibility"
    | "habit"
    | "body_composition"
    | "other"; // Categoria da meta
  startValue: number; // Valor inicial ao definir a meta
  targetValue: number; // Valor alvo a ser alcançado
  currentValue: number; // Valor atual do progresso
  unit: string; // Unidade de medida (ex: "kg", "cm", "min")
  targetDate: string; // Data alvo para alcançar a meta (YYYY-MM-DD)
  status: "pending" | "in_progress" | "completed" | "failed"; // Status da meta
  createdAt: string; // Data de criação (ISO string)
  updatedAt: string; // Data da última atualização (ISO string)
}

/**
 * Representa uma avaliação agendada ou realizada para um aluno.
 */
export interface StudentEvaluation {
  id: string;
  professionalId: string;
  studentId: string;
  title: string; // Título da avaliação (ex: "Avaliação Física Inicial")
  type: "fitness" | "nutrition" | "progress" | "other"; // Tipo de avaliação
  date: string; // Data da avaliação (YYYY-MM-DD)
  time: string; // Hora da avaliação (HH:MM)
  durationMinutes?: number; // Duração estimada em minutos
  location?: string; // Local da avaliação (ex: "Academia", "Online")
  notes?: string; // Anotações adicionais sobre a avaliação
  status: "scheduled" | "completed" | "cancelled"; // Status da avaliação
  createdAt: string; // Data de criação (ISO string)
  updatedAt: string; // Data da última atualização (ISO string)
}
