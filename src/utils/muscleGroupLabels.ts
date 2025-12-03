// src/utils/muscleGroupLabels.ts
import type { MuscleGroup } from "../types/shared";

// ✅ Labels ATUALIZADOS com grupos separados
export const muscleGroupLabels: Record<MuscleGroup, string> = {
  Peito: "Peito",
  Costas: "Costas",
  Ombros: "Ombros",
  Pernas: "Pernas",
  Glúteos: "Glúteos",
  Bíceps: "Bíceps", // ✅ NOVO: Separado de "Braços"
  Tríceps: "Tríceps", // ✅ NOVO: Separado de "Braços"
  Antebraço: "Antebraço", // ✅ NOVO: Separado de "Braços"
  Abdômen: "Abdômen",
  Outro: "Outro",
};

// ✅ Função helper para obter label do grupo muscular
export const getMuscleGroupLabel = (muscleGroup: MuscleGroup): string => {
  return muscleGroupLabels[muscleGroup] || muscleGroup;
};

// ✅ Função helper para obter todos os grupos musculares
export const getAllMuscleGroups = (): MuscleGroup[] => {
  return Object.keys(muscleGroupLabels) as MuscleGroup[];
};

// ✅ Função helper para verificar se é um grupo muscular válido
export const isValidMuscleGroup = (group: string): group is MuscleGroup => {
  return Object.keys(muscleGroupLabels).includes(group as MuscleGroup);
};

// ✅ Grupos organizados por categoria para UI
export const muscleGroupCategories = {
  "Membros Superiores": [
    "Peito",
    "Costas",
    "Ombros",
    "Bíceps",
    "Tríceps",
    "Antebraço",
  ] as MuscleGroup[],
  "Membros Inferiores": ["Pernas", "Glúteos"] as MuscleGroup[],
  Core: ["Abdômen"] as MuscleGroup[],
  Outros: ["Outro"] as MuscleGroup[],
};

// ✅ Cores para cada grupo muscular (para UI)
export const muscleGroupColors: Record<MuscleGroup, string> = {
  Peito: "#e74c3c", // Vermelho
  Costas: "#3498db", // Azul
  Ombros: "#f39c12", // Laranja
  Pernas: "#27ae60", // Verde
  Glúteos: "#9b59b6", // Roxo
  Bíceps: "#e67e22", // Laranja escuro
  Tríceps: "#34495e", // Azul escuro
  Antebraço: "#95a5a6", // Cinza
  Abdômen: "#f1c40f", // Amarelo
  Outro: "#7f8c8d", // Cinza claro
};

// ✅ Ícones para cada grupo muscular (emojis)
export const muscleGroupIcons: Record<MuscleGroup, string> = {
  Peito: "💪",
  Costas: "🏋️",
  Ombros: "🤸",
  Pernas: "🦵",
  Glúteos: "🍑",
  Bíceps: "💪",
  Tríceps: "🔥",
  Antebraço: "✊",
  Abdômen: "🏆",
  Outro: "⚡",
};
