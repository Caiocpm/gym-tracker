// src/data/exerciseDefinitions.ts
import type { ExerciseDefinition, MuscleGroup } from "../types";

// ✅ Mapeamento ATUALIZADO com grupos separados
const muscleGroupMap: Record<string, MuscleGroup> = {
  Peito: "Peito",
  Costas: "Costas",
  Ombros: "Ombros",
  Quadríceps: "Pernas",
  "Posterior Coxa": "Pernas",
  Glúteos: "Glúteos",
  Panturrilhas: "Pernas",
  Bíceps: "Bíceps", // ✅ SEPARADO
  Tríceps: "Tríceps", // ✅ SEPARADO
  Antebraço: "Antebraço", // ✅ SEPARADO
  "Abdômen/Core": "Abdômen",
  Funcionais: "Outro",
};

// ✅ Função para gerar ID único baseado no nome
const generateExerciseId = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

// ✅ Lista COMPLETA e ATUALIZADA de exercícios
export const exerciseDefinitions: ExerciseDefinition[] = [
  // ========================================
  // PEITO (40 exercícios) - ADICIONADOS 4 NOVOS
  // ========================================
  {
    id: generateExerciseId("Flexão de braço"),
    name: "Flexão de braço",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Flexão declinada"),
    name: "Flexão declinada",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Flexão inclinada"),
    name: "Flexão inclinada",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Flexão diamante"),
    name: "Flexão diamante",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Flexão arqueiro"),
    name: "Flexão arqueiro",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Flexão explosiva"),
    name: "Flexão explosiva",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Flexão com aplausos"),
    name: "Flexão com aplausos",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Flexão pike"),
    name: "Flexão pike",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Dips para peito"),
    name: "Dips para peito",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Supino reto barra"),
    name: "Supino reto barra",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Supino inclinado barra"),
    name: "Supino inclinado barra",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Supino declinado barra"),
    name: "Supino declinado barra",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Supino fechado barra"),
    name: "Supino fechado barra",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Supino guilhotina"),
    name: "Supino guilhotina",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Supino reto halteres"),
    name: "Supino reto halteres",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Supino inclinado halteres"),
    name: "Supino inclinado halteres",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Supino declinado halteres"),
    name: "Supino declinado halteres",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Supino fechado halteres"),
    name: "Supino fechado halteres",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Supino neutro halteres"),
    name: "Supino neutro halteres",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Crucifixo reto"),
    name: "Crucifixo reto",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Crucifixo inclinado"),
    name: "Crucifixo inclinado",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Crucifixo declinado"),
    name: "Crucifixo declinado",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Crucifixo no cabo"),
    name: "Crucifixo no cabo",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Peck deck"),
    name: "Peck deck",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Chest press máquina"),
    name: "Chest press máquina",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Cross over alto"),
    name: "Cross over alto",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Cross over médio"),
    name: "Cross over médio",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Cross over baixo"),
    name: "Cross over baixo",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Squeeze press"),
    name: "Squeeze press",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Pull-over para peito"),
    name: "Pull-over para peito",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Pull-over cabo"),
    name: "Pull-over cabo",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Supino smith"),
    name: "Supino smith",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Supino inclinado smith"),
    name: "Supino inclinado smith",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Landmine press peito"),
    name: "Landmine press peito",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Svend press"),
    name: "Svend press",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Floor press"),
    name: "Floor press",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Livre",
  },
  // ✅ NOVOS EXERCÍCIOS DE PEITO
  {
    id: generateExerciseId("Flexão hindu"),
    name: "Flexão hindu",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Flexão T"),
    name: "Flexão T",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Supino com pausa"),
    name: "Supino com pausa",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Chest fly máquina"),
    name: "Chest fly máquina",
    primaryMuscleGroup: muscleGroupMap["Peito"],
    equipment: "Máquina",
  },

  // ========================================
  // COSTAS (42 exercícios) - ADICIONADOS 4 NOVOS
  // ========================================
  {
    id: generateExerciseId("Barra fixa pronada"),
    name: "Barra fixa pronada",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Barra fixa supinada"),
    name: "Barra fixa supinada",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Barra fixa neutra"),
    name: "Barra fixa neutra",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Barra fixa pegada aberta"),
    name: "Barra fixa pegada aberta",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Remada australiana"),
    name: "Remada australiana",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Remada invertida"),
    name: "Remada invertida",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Remada curvada barra"),
    name: "Remada curvada barra",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Remada curvada halteres"),
    name: "Remada curvada halteres",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Remada unilateral halter"),
    name: "Remada unilateral halter",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Remada serrote"),
    name: "Remada serrote",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Remada cavalinho T-bar"),
    name: "Remada cavalinho T-bar",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Remada baixa no cabo"),
    name: "Remada baixa no cabo",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Remada alta no cabo"),
    name: "Remada alta no cabo",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Puxada frente"),
    name: "Puxada frente",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Puxada pegada aberta"),
    name: "Puxada pegada aberta",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Puxada pegada neutra"),
    name: "Puxada pegada neutra",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Puxada supinada"),
    name: "Puxada supinada",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Puxada unilateral"),
    name: "Puxada unilateral",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Remada pendlay"),
    name: "Remada pendlay",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Deadlift convencional"),
    name: "Deadlift convencional",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Deadlift sumô"),
    name: "Deadlift sumô",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Romanian deadlift"),
    name: "Romanian deadlift",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Stiff"),
    name: "Stiff",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Rack pull"),
    name: "Rack pull",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Deficit deadlift"),
    name: "Deficit deadlift",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Pulldown unilateral cabo"),
    name: "Pulldown unilateral cabo",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Remada máquina"),
    name: "Remada máquina",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Remada Hammer Strength"),
    name: "Remada Hammer Strength",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Pullover halter dorsal"),
    name: "Pullover halter dorsal",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Shrug barra"),
    name: "Shrug barra",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Shrug halteres"),
    name: "Shrug halteres",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Shrug smith"),
    name: "Shrug smith",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Good morning"),
    name: "Good morning",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Hiperextensão"),
    name: "Hiperextensão",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Hiperextensão 45 graus"),
    name: "Hiperextensão 45 graus",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Superman"),
    name: "Superman",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Y-raise"),
    name: "Y-raise",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Straight arm pulldown"),
    name: "Straight arm pulldown",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Cabo",
  },
  // ✅ NOVOS EXERCÍCIOS DE COSTAS
  {
    id: generateExerciseId("Barra fixa L-sit"),
    name: "Barra fixa L-sit",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Remada meadows"),
    name: "Remada meadows",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Trap bar deadlift"),
    name: "Trap bar deadlift",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Reverse fly cabo"),
    name: "Reverse fly cabo",
    primaryMuscleGroup: muscleGroupMap["Costas"],
    equipment: "Cabo",
  },

  // ========================================
  // OMBROS (32 exercícios) - ADICIONADOS 4 NOVOS
  // ========================================
  {
    id: generateExerciseId("Desenvolvimento militar barra"),
    name: "Desenvolvimento militar barra",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Desenvolvimento halteres"),
    name: "Desenvolvimento halteres",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Desenvolvimento Arnold"),
    name: "Desenvolvimento Arnold",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Desenvolvimento unilateral halter"),
    name: "Desenvolvimento unilateral halter",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Elevação lateral halteres"),
    name: "Elevação lateral halteres",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Elevação lateral unilateral"),
    name: "Elevação lateral unilateral",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Elevação lateral 6-way"),
    name: "Elevação lateral 6-way",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Elevação frontal"),
    name: "Elevação frontal",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Elevação frontal alternada"),
    name: "Elevação frontal alternada",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Elevação posterior"),
    name: "Elevação posterior",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Crucifixo invertido halteres"),
    name: "Crucifixo invertido halteres",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Pássaro voador"),
    name: "Pássaro voador",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Remada alta barra"),
    name: "Remada alta barra",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Remada alta halteres"),
    name: "Remada alta halteres",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Remada alta no cabo"),
    name: "Remada alta no cabo",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Face pull"),
    name: "Face pull",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Desenvolvimento máquina"),
    name: "Desenvolvimento máquina",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Elevação lateral máquina"),
    name: "Elevação lateral máquina",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Desenvolvimento no smith"),
    name: "Desenvolvimento no smith",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Landmine press"),
    name: "Landmine press",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Crucifixo invertido no cabo"),
    name: "Crucifixo invertido no cabo",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Elevação lateral no cabo"),
    name: "Elevação lateral no cabo",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Elevação W"),
    name: "Elevação W",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Rotação externa ombro"),
    name: "Rotação externa ombro",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Rotação interna ombro"),
    name: "Rotação interna ombro",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Bradford press"),
    name: "Bradford press",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Cuban press"),
    name: "Cuban press",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Bus driver"),
    name: "Bus driver",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Livre",
  },
  // ✅ NOVOS EXERCÍCIOS DE OMBROS
  {
    id: generateExerciseId("Pike push-up"),
    name: "Pike push-up",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Handstand push-up"),
    name: "Handstand push-up",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Lu raise"),
    name: "Lu raise",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Desenvolvimento Z-press"),
    name: "Desenvolvimento Z-press",
    primaryMuscleGroup: muscleGroupMap["Ombros"],
    equipment: "Barra",
  },

  // ========================================
  // QUADRÍCEPS/PERNAS (32 exercícios) - ADICIONADOS 4 NOVOS
  // ========================================
  {
    id: generateExerciseId("Agachamento livre"),
    name: "Agachamento livre",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Agachamento frontal"),
    name: "Agachamento frontal",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Agachamento com halteres"),
    name: "Agachamento com halteres",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Agachamento overhead"),
    name: "Agachamento overhead",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Agachamento sumô"),
    name: "Agachamento sumô",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Agachamento cossaco"),
    name: "Agachamento cossaco",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Goblet squat"),
    name: "Goblet squat",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Zercher squat"),
    name: "Zercher squat",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Pistol squat"),
    name: "Pistol squat",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Agachamento box"),
    name: "Agachamento box",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Afundo"),
    name: "Afundo",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Afundo búlgaro"),
    name: "Afundo búlgaro",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Afundo reverso"),
    name: "Afundo reverso",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Afundo lateral"),
    name: "Afundo lateral",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Passada"),
    name: "Passada",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Passada com halteres"),
    name: "Passada com halteres",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Step up"),
    name: "Step up",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Step up lateral"),
    name: "Step up lateral",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Agachamento no smith"),
    name: "Agachamento no smith",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Leg press"),
    name: "Leg press",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Leg press unilateral"),
    name: "Leg press unilateral",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Cadeira extensora"),
    name: "Cadeira extensora",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Cadeira extensora unilateral"),
    name: "Cadeira extensora unilateral",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Hack machine"),
    name: "Hack machine",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Belt squat"),
    name: "Belt squat",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Sissy squat"),
    name: "Sissy squat",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Agachamento sumô halter"),
    name: "Agachamento sumô halter",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Wall sit"),
    name: "Wall sit",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Livre",
  },
  // ✅ NOVOS EXERCÍCIOS DE PERNAS
  {
    id: generateExerciseId("Jump squat"),
    name: "Jump squat",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Agachamento pausa"),
    name: "Agachamento pausa",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Agachamento 1 e 1/4"),
    name: "Agachamento 1 e 1/4",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Leg press horizontal"),
    name: "Leg press horizontal",
    primaryMuscleGroup: muscleGroupMap["Quadríceps"],
    equipment: "Máquina",
  },

  // ========================================
  // POSTERIOR COXA (18 exercícios) - ADICIONADOS 4 NOVOS
  // ========================================
  {
    id: generateExerciseId("Peso morto stiff"),
    name: "Peso morto stiff",
    primaryMuscleGroup: muscleGroupMap["Posterior Coxa"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Peso morto romeno"),
    name: "Peso morto romeno",
    primaryMuscleGroup: muscleGroupMap["Posterior Coxa"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("RDL halteres"),
    name: "RDL halteres",
    primaryMuscleGroup: muscleGroupMap["Posterior Coxa"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("RDL unilateral"),
    name: "RDL unilateral",
    primaryMuscleGroup: muscleGroupMap["Posterior Coxa"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Nordic curl"),
    name: "Nordic curl",
    primaryMuscleGroup: muscleGroupMap["Posterior Coxa"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Mesa flexora"),
    name: "Mesa flexora",
    primaryMuscleGroup: muscleGroupMap["Posterior Coxa"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Flexora sentada"),
    name: "Flexora sentada",
    primaryMuscleGroup: muscleGroupMap["Posterior Coxa"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Flexora em pé"),
    name: "Flexora em pé",
    primaryMuscleGroup: muscleGroupMap["Posterior Coxa"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Flexora unilateral"),
    name: "Flexora unilateral",
    primaryMuscleGroup: muscleGroupMap["Posterior Coxa"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Stiff smith"),
    name: "Stiff smith",
    primaryMuscleGroup: muscleGroupMap["Posterior Coxa"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Glute ham raise"),
    name: "Glute ham raise",
    primaryMuscleGroup: muscleGroupMap["Posterior Coxa"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Good morning posterior"),
    name: "Good morning posterior",
    primaryMuscleGroup: muscleGroupMap["Posterior Coxa"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Kettlebell swing posterior"),
    name: "Kettlebell swing posterior",
    primaryMuscleGroup: muscleGroupMap["Posterior Coxa"],
    equipment: "Kettlebell",
  },
  {
    id: generateExerciseId("Sliding leg curl"),
    name: "Sliding leg curl",
    primaryMuscleGroup: muscleGroupMap["Posterior Coxa"],
    equipment: "Livre",
  },
  // ✅ NOVOS EXERCÍCIOS DE POSTERIOR
  {
    id: generateExerciseId("Flexora cabo"),
    name: "Flexora cabo",
    primaryMuscleGroup: muscleGroupMap["Posterior Coxa"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("RDL cabo"),
    name: "RDL cabo",
    primaryMuscleGroup: muscleGroupMap["Posterior Coxa"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Stiff com pausa"),
    name: "Stiff com pausa",
    primaryMuscleGroup: muscleGroupMap["Posterior Coxa"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Reverse hyperextension"),
    name: "Reverse hyperextension",
    primaryMuscleGroup: muscleGroupMap["Posterior Coxa"],
    equipment: "Livre",
  },

  // ========================================
  // GLÚTEOS (22 exercícios) - ADICIONADOS 4 NOVOS
  // ========================================
  {
    id: generateExerciseId("Hip thrust barra"),
    name: "Hip thrust barra",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Hip thrust halteres"),
    name: "Hip thrust halteres",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Hip thrust unilateral"),
    name: "Hip thrust unilateral",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Glute bridge"),
    name: "Glute bridge",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Glute bridge unilateral"),
    name: "Glute bridge unilateral",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Frog pump"),
    name: "Frog pump",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Abdução máquina"),
    name: "Abdução máquina",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Abdução cabo"),
    name: "Abdução cabo",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Abdução deitado"),
    name: "Abdução deitado",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Kickback cabo"),
    name: "Kickback cabo",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Kickback elástico"),
    name: "Kickback elástico",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Donkey kick"),
    name: "Donkey kick",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Fire hydrant"),
    name: "Fire hydrant",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Clamshell"),
    name: "Clamshell",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Máquina glúteo"),
    name: "Máquina glúteo",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Step-down para glúteo"),
    name: "Step-down para glúteo",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Hip thrust smith"),
    name: "Hip thrust smith",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Back extension glúteo"),
    name: "Back extension glúteo",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Livre",
  },
  // ✅ NOVOS EXERCÍCIOS DE GLÚTEOS
  {
    id: generateExerciseId("Hip thrust pausa"),
    name: "Hip thrust pausa",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Glute bridge marcha"),
    name: "Glute bridge marcha",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Curtsy lunge"),
    name: "Curtsy lunge",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Monster walk"),
    name: "Monster walk",
    primaryMuscleGroup: muscleGroupMap["Glúteos"],
    equipment: "Livre",
  },

  // ========================================
  // PANTURRILHAS (14 exercícios) - ADICIONADOS 4 NOVOS
  // ========================================
  {
    id: generateExerciseId("Panturrilha em pé"),
    name: "Panturrilha em pé",
    primaryMuscleGroup: muscleGroupMap["Panturrilhas"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Panturrilha sentado"),
    name: "Panturrilha sentado",
    primaryMuscleGroup: muscleGroupMap["Panturrilhas"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Panturrilha no leg press"),
    name: "Panturrilha no leg press",
    primaryMuscleGroup: muscleGroupMap["Panturrilhas"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Donkey calf raise"),
    name: "Donkey calf raise",
    primaryMuscleGroup: muscleGroupMap["Panturrilhas"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Panturrilha no hack"),
    name: "Panturrilha no hack",
    primaryMuscleGroup: muscleGroupMap["Panturrilhas"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Panturrilha unilateral"),
    name: "Panturrilha unilateral",
    primaryMuscleGroup: muscleGroupMap["Panturrilhas"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Panturrilha smith"),
    name: "Panturrilha smith",
    primaryMuscleGroup: muscleGroupMap["Panturrilhas"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Panturrilha com halteres"),
    name: "Panturrilha com halteres",
    primaryMuscleGroup: muscleGroupMap["Panturrilhas"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Jump rope"),
    name: "Jump rope",
    primaryMuscleGroup: muscleGroupMap["Panturrilhas"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Pogo jump"),
    name: "Pogo jump",
    primaryMuscleGroup: muscleGroupMap["Panturrilhas"],
    equipment: "Livre",
  },
  // ✅ NOVOS EXERCÍCIOS DE PANTURRILHAS
  {
    id: generateExerciseId("Panturrilha no degrau"),
    name: "Panturrilha no degrau",
    primaryMuscleGroup: muscleGroupMap["Panturrilhas"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Calf raise explosivo"),
    name: "Calf raise explosivo",
    primaryMuscleGroup: muscleGroupMap["Panturrilhas"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Panturrilha cabo"),
    name: "Panturrilha cabo",
    primaryMuscleGroup: muscleGroupMap["Panturrilhas"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Tibial anterior"),
    name: "Tibial anterior",
    primaryMuscleGroup: muscleGroupMap["Panturrilhas"],
    equipment: "Livre",
  },

  // ========================================
  // BÍCEPS (24 exercícios) - ADICIONADOS 4 NOVOS
  // ========================================
  {
    id: generateExerciseId("Rosca direta barra"),
    name: "Rosca direta barra",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Rosca direta halteres"),
    name: "Rosca direta halteres",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Rosca alternada"),
    name: "Rosca alternada",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Rosca simultânea"),
    name: "Rosca simultânea",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Rosca martelo"),
    name: "Rosca martelo",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Rosca concentrada"),
    name: "Rosca concentrada",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Rosca inclinada"),
    name: "Rosca inclinada",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Rosca Scott barra"),
    name: "Rosca Scott barra",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Rosca Scott halter"),
    name: "Rosca Scott halter",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Rosca no cabo"),
    name: "Rosca no cabo",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Rosca spider"),
    name: "Rosca spider",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Rosca Zottman"),
    name: "Rosca Zottman",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Drag curl"),
    name: "Drag curl",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Chin-up"),
    name: "Chin-up",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Rosca 21"),
    name: "Rosca 21",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Rosca inversa"),
    name: "Rosca inversa",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Rosca W"),
    name: "Rosca W",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Rosca cross cable"),
    name: "Rosca cross cable",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Rosca máquina"),
    name: "Rosca máquina",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Waiter curl"),
    name: "Waiter curl",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Halter",
  },
  // ✅ NOVOS EXERCÍCIOS DE BÍCEPS
  {
    id: generateExerciseId("Rosca cabo unilateral"),
    name: "Rosca cabo unilateral",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Rosca 7-7-7"),
    name: "Rosca 7-7-7",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Rosca isométrica"),
    name: "Rosca isométrica",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Rosca 1 e 1/4"),
    name: "Rosca 1 e 1/4",
    primaryMuscleGroup: muscleGroupMap["Bíceps"],
    equipment: "Halter",
  },

  // ========================================
  // TRÍCEPS (22 exercícios) - ADICIONADOS 4 NOVOS
  // ========================================
  {
    id: generateExerciseId("Tríceps testa barra"),
    name: "Tríceps testa barra",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Tríceps testa halteres"),
    name: "Tríceps testa halteres",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Tríceps francês"),
    name: "Tríceps francês",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Tríceps francês unilateral"),
    name: "Tríceps francês unilateral",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Tríceps corda"),
    name: "Tríceps corda",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Tríceps pulley"),
    name: "Tríceps pulley",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Tríceps barra V"),
    name: "Tríceps barra V",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Mergulho no banco"),
    name: "Mergulho no banco",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Dips paralelas"),
    name: "Dips paralelas",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Kickback"),
    name: "Kickback",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Coice no cabo"),
    name: "Coice no cabo",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("JM press"),
    name: "JM press",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Supino fechado tríceps"),
    name: "Supino fechado tríceps",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Extensão overhead barra"),
    name: "Extensão overhead barra",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Extensão overhead cabo"),
    name: "Extensão overhead cabo",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Tríceps unilateral cabo"),
    name: "Tríceps unilateral cabo",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Diamond push-up"),
    name: "Diamond push-up",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Tríceps máquina"),
    name: "Tríceps máquina",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Máquina",
  },
  // ✅ NOVOS EXERCÍCIOS DE TRÍCEPS
  {
    id: generateExerciseId("Tríceps banco neutro"),
    name: "Tríceps banco neutro",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("California press"),
    name: "California press",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Tríceps smith"),
    name: "Tríceps smith",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Overhead extension smith"),
    name: "Overhead extension smith",
    primaryMuscleGroup: muscleGroupMap["Tríceps"],
    equipment: "Máquina",
  },

  // ========================================
  // ANTEBRAÇO (16 exercícios) - ADICIONADOS 4 NOVOS
  // ========================================
  {
    id: generateExerciseId("Rosca punho"),
    name: "Rosca punho",
    primaryMuscleGroup: muscleGroupMap["Antebraço"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Rosca punho reversa"),
    name: "Rosca punho reversa",
    primaryMuscleGroup: muscleGroupMap["Antebraço"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Rosca punho halteres"),
    name: "Rosca punho halteres",
    primaryMuscleGroup: muscleGroupMap["Antebraço"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Farmer walk"),
    name: "Farmer walk",
    primaryMuscleGroup: muscleGroupMap["Antebraço"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Pronação halteres"),
    name: "Pronação halteres",
    primaryMuscleGroup: muscleGroupMap["Antebraço"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Supinação halteres"),
    name: "Supinação halteres",
    primaryMuscleGroup: muscleGroupMap["Antebraço"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Wrist roller"),
    name: "Wrist roller",
    primaryMuscleGroup: muscleGroupMap["Antebraço"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Pegada trap bar"),
    name: "Pegada trap bar",
    primaryMuscleGroup: muscleGroupMap["Antebraço"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Dead hang"),
    name: "Dead hang",
    primaryMuscleGroup: muscleGroupMap["Antebraço"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Pinch grip"),
    name: "Pinch grip",
    primaryMuscleGroup: muscleGroupMap["Antebraço"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Grip crush"),
    name: "Grip crush",
    primaryMuscleGroup: muscleGroupMap["Antebraço"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Plate pinch"),
    name: "Plate pinch",
    primaryMuscleGroup: muscleGroupMap["Antebraço"],
    equipment: "Livre",
  },
  // ✅ NOVOS EXERCÍCIOS DE ANTEBRAÇO
  {
    id: generateExerciseId("Rosca punho cabo"),
    name: "Rosca punho cabo",
    primaryMuscleGroup: muscleGroupMap["Antebraço"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Flexão radial"),
    name: "Flexão radial",
    primaryMuscleGroup: muscleGroupMap["Antebraço"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Flexão ulnar"),
    name: "Flexão ulnar",
    primaryMuscleGroup: muscleGroupMap["Antebraço"],
    equipment: "Halter",
  },
  {
    id: generateExerciseId("Hammer curl antebraço"),
    name: "Hammer curl antebraço",
    primaryMuscleGroup: muscleGroupMap["Antebraço"],
    equipment: "Halter",
  },

  // ========================================
  // ABDÔMEN/CORE (36 exercícios) - ADICIONADOS 4 NOVOS
  // ========================================
  {
    id: generateExerciseId("Abdominal crunch"),
    name: "Abdominal crunch",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Abdominal infra"),
    name: "Abdominal infra",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Abdominal supra"),
    name: "Abdominal supra",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Abdominal bicicleta"),
    name: "Abdominal bicicleta",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Bicycle crunch"),
    name: "Bicycle crunch",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Abdominal prancha"),
    name: "Abdominal prancha",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Prancha lateral"),
    name: "Prancha lateral",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Prancha com elevação perna"),
    name: "Prancha com elevação perna",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Plank to pike"),
    name: "Plank to pike",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Elevação de pernas"),
    name: "Elevação de pernas",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Elevação de pernas suspenso"),
    name: "Elevação de pernas suspenso",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Hanging knee raise"),
    name: "Hanging knee raise",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("V-up"),
    name: "V-up",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Ab wheel"),
    name: "Ab wheel",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Dragon flag"),
    name: "Dragon flag",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Hollow hold"),
    name: "Hollow hold",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Dead bug"),
    name: "Dead bug",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Bird dog"),
    name: "Bird dog",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Abdominal máquina"),
    name: "Abdominal máquina",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Máquina",
  },
  {
    id: generateExerciseId("Cable crunch"),
    name: "Cable crunch",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Toes to bar"),
    name: "Toes to bar",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Garhammer raise"),
    name: "Garhammer raise",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Russian twist"),
    name: "Russian twist",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Mountain climber"),
    name: "Mountain climber",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("L-sit"),
    name: "L-sit",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Windshield wiper"),
    name: "Windshield wiper",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Pallof press"),
    name: "Pallof press",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Wood chop"),
    name: "Wood chop",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Cabo",
  },
  {
    id: generateExerciseId("Sit-up"),
    name: "Sit-up",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Abdominal declinado"),
    name: "Abdominal declinado",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Jackknife"),
    name: "Jackknife",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Flutter kicks"),
    name: "Flutter kicks",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  // ✅ NOVOS EXERCÍCIOS DE ABDÔMEN
  {
    id: generateExerciseId("Plank up-down"),
    name: "Plank up-down",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Bear hold"),
    name: "Bear hold",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Reverse crunch"),
    name: "Reverse crunch",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Oblíquo cabo"),
    name: "Oblíquo cabo",
    primaryMuscleGroup: muscleGroupMap["Abdômen/Core"],
    equipment: "Cabo",
  },

  // ========================================
  // FUNCIONAIS (30 exercícios) - ADICIONADOS 4 NOVOS
  // ========================================
  {
    id: generateExerciseId("Kettlebell swing"),
    name: "Kettlebell swing",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Kettlebell",
  },
  {
    id: generateExerciseId("Kettlebell snatch"),
    name: "Kettlebell snatch",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Kettlebell",
  },
  {
    id: generateExerciseId("Turkish get-up"),
    name: "Turkish get-up",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Kettlebell",
  },
  {
    id: generateExerciseId("Battle rope"),
    name: "Battle rope",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Sled push"),
    name: "Sled push",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Sled pull"),
    name: "Sled pull",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Landmine row"),
    name: "Landmine row",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Medicine ball throw"),
    name: "Medicine ball throw",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Medicine ball slam"),
    name: "Medicine ball slam",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Wall ball"),
    name: "Wall ball",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Burpee"),
    name: "Burpee",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Box jump"),
    name: "Box jump",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Box step-up"),
    name: "Box step-up",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Rope climb"),
    name: "Rope climb",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Thruster"),
    name: "Thruster",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Clean"),
    name: "Clean",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Power clean"),
    name: "Power clean",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Hang clean"),
    name: "Hang clean",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Snatch"),
    name: "Snatch",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Power snatch"),
    name: "Power snatch",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Jerk"),
    name: "Jerk",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Clean and jerk"),
    name: "Clean and jerk",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Barra",
  },
  {
    id: generateExerciseId("Bear crawl"),
    name: "Bear crawl",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Crab walk"),
    name: "Crab walk",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Tire flip"),
    name: "Tire flip",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Sandbag carry"),
    name: "Sandbag carry",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Livre",
  },
  // ✅ NOVOS EXERCÍCIOS FUNCIONAIS
  {
    id: generateExerciseId("Kettlebell clean"),
    name: "Kettlebell clean",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Kettlebell",
  },
  {
    id: generateExerciseId("Atlas stone lift"),
    name: "Atlas stone lift",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Prowler push"),
    name: "Prowler push",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Livre",
  },
  {
    id: generateExerciseId("Renegade row"),
    name: "Renegade row",
    primaryMuscleGroup: muscleGroupMap["Funcionais"],
    equipment: "Halter",
  },
];

// ✅ Função helper para buscar exercício por ID
export const getExerciseById = (id: string): ExerciseDefinition | undefined => {
  return exerciseDefinitions.find((exercise) => exercise.id === id);
};

// ✅ Função helper para buscar exercícios por grupo muscular
export const getExercisesByMuscleGroup = (
  muscleGroup: MuscleGroup
): ExerciseDefinition[] => {
  return exerciseDefinitions.filter(
    (exercise) => exercise.primaryMuscleGroup === muscleGroup
  );
};

// ✅ Função helper para buscar exercícios por equipamento
export const getExercisesByEquipment = (
  equipment: string
): ExerciseDefinition[] => {
  return exerciseDefinitions.filter(
    (exercise) => exercise.equipment === equipment
  );
};

// ✅ Estatísticas da biblioteca ATUALIZADA
export const getExerciseStats = () => {
  const byMuscleGroup = exerciseDefinitions.reduce((acc, ex) => {
    acc[ex.primaryMuscleGroup] = (acc[ex.primaryMuscleGroup] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byEquipment = exerciseDefinitions.reduce((acc, ex) => {
    acc[ex.equipment] = (acc[ex.equipment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: exerciseDefinitions.length,
    byMuscleGroup,
    byEquipment,
  };
};
