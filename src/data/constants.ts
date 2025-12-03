// src/data/constants.ts

// ✅ CORREÇÃO: Adicionado 'type' à importação de MuscleGroup
import type { MuscleGroup } from "../types"; // Agora MuscleGroup é importado de ../types (que re-exporta de shared.ts)

// ✅ Padrões de força baseados em strengthlevel.com
// Fonte: https://strengthlevel.com/strength-standards
// Os valores representam multiplicadores do peso corporal
// Nota: Usamos 4 níveis (Iniciante, Intermediário, Avançado, Elite)
// StrengthLevel.com usa 5 (Beginner, Novice, Intermediate, Advanced, Elite)
// Mapeamento: Iniciante=Beginner, Intermediário=Intermediate, Avançado=Advanced, Elite=Elite
export const STRENGTH_STANDARDS: {
  [key: string]: {
    beginner: number;      // Iniciante
    intermediate: number;  // Intermediário
    advanced: number;      // Avançado
    elite: number;         // Elite
  };
} = {
  // Supino Reto (Bench Press)
  // https://strengthlevel.com/strength-standards/bench-press
  "Supino Reto com Barra": {
    beginner: 0.50,
    intermediate: 1.25,
    advanced: 1.75,
    elite: 2.00,
  },
  "Supino reto barra": {
    beginner: 0.50,
    intermediate: 1.25,
    advanced: 1.75,
    elite: 2.00,
  },

  // Agachamento (Squat)
  // https://strengthlevel.com/strength-standards/squat
  "Agachamento Livre": {
    beginner: 0.75,
    intermediate: 1.50,
    advanced: 2.25,
    elite: 2.75,
  },
  "Agachamento livre": {
    beginner: 0.75,
    intermediate: 1.50,
    advanced: 2.25,
    elite: 2.75,
  },

  // Levantamento Terra (Deadlift)
  // https://strengthlevel.com/strength-standards/deadlift
  "Levantamento Terra": {
    beginner: 1.00,
    intermediate: 2.00,
    advanced: 2.50,
    elite: 3.00,
  },
  "Deadlift convencional": {
    beginner: 1.00,
    intermediate: 2.00,
    advanced: 2.50,
    elite: 3.00,
  },
  "Deadlift Convencional": {
    beginner: 1.00,
    intermediate: 2.00,
    advanced: 2.50,
    elite: 3.00,
  },

  // Desenvolvimento de Ombros (Shoulder Press / Overhead Press)
  // https://strengthlevel.com/strength-standards/shoulder-press
  "Desenvolvimento de Ombros com Barra": {
    beginner: 0.35,
    intermediate: 0.80,
    advanced: 1.10,
    elite: 1.40,
  },
  "Desenvolvimento ombros barra": {
    beginner: 0.35,
    intermediate: 0.80,
    advanced: 1.10,
    elite: 1.40,
  },
  "Desenvolvimento militar": {
    beginner: 0.35,
    intermediate: 0.80,
    advanced: 1.10,
    elite: 1.40,
  },

  // Rosca Direta (Barbell Curl)
  // https://strengthlevel.com/strength-standards/barbell-curl
  "Rosca Direta com Barra": {
    beginner: 0.20,
    intermediate: 0.60,
    advanced: 0.85,
    elite: 1.15,
  },
  "Rosca direta barra": {
    beginner: 0.20,
    intermediate: 0.60,
    advanced: 0.85,
    elite: 1.15,
  },

  // Remada Curvada (Barbell Row / Bent Over Row)
  // https://strengthlevel.com/strength-standards/barbell-row
  "Remada Curvada com Barra": {
    beginner: 0.50,
    intermediate: 1.00,
    advanced: 1.50,
    elite: 1.75,
  },
  "Remada curvada barra": {
    beginner: 0.50,
    intermediate: 1.00,
    advanced: 1.50,
    elite: 1.75,
  },
  "Remada curvada pronada": {
    beginner: 0.50,
    intermediate: 1.00,
    advanced: 1.50,
    elite: 1.75,
  },
  "Remada curvada supinada": {
    beginner: 0.50,
    intermediate: 1.00,
    advanced: 1.50,
    elite: 1.75,
  },

  // Supino Inclinado (Incline Bench Press)
  // https://strengthlevel.com/strength-standards/incline-bench-press
  "Supino Inclinado com Barra": {
    beginner: 0.50,
    intermediate: 1.00,
    advanced: 1.50,
    elite: 1.75,
  },
  "Supino inclinado barra": {
    beginner: 0.50,
    intermediate: 1.00,
    advanced: 1.50,
    elite: 1.75,
  },

  // Supino com Halteres (Dumbbell Bench Press)
  // https://strengthlevel.com/strength-standards/dumbbell-bench-press
  // Nota: valores são por halter, não total
  "Supino Reto com Halteres": {
    beginner: 0.20,
    intermediate: 0.50,
    advanced: 0.75,
    elite: 1.00,
  },
  "Supino reto halteres": {
    beginner: 0.20,
    intermediate: 0.50,
    advanced: 0.75,
    elite: 1.00,
  },
  "Supino Inclinado com Halteres": {
    beginner: 0.20,
    intermediate: 0.50,
    advanced: 0.75,
    elite: 1.00,
  },
  "Supino inclinado halteres": {
    beginner: 0.20,
    intermediate: 0.50,
    advanced: 0.75,
    elite: 1.00,
  },

  // Agachamento Frontal (Front Squat)
  // https://strengthlevel.com/strength-standards/front-squat
  "Agachamento frontal": {
    beginner: 0.75,
    intermediate: 1.25,
    advanced: 1.75,
    elite: 2.25,
  },

  // Leg Press
  // https://strengthlevel.com/strength-standards/leg-press
  "Leg Press": {
    beginner: 1.00,
    intermediate: 2.75,
    advanced: 4.00,
    elite: 5.25,
  },
  "Leg press": {
    beginner: 1.00,
    intermediate: 2.75,
    advanced: 4.00,
    elite: 5.25,
  },
  "Leg press 45": {
    beginner: 1.00,
    intermediate: 2.75,
    advanced: 4.00,
    elite: 5.25,
  },

  // Extensão de Quadríceps (Leg Extension)
  // https://strengthlevel.com/strength-standards/leg-extension
  "Extensão de Quadríceps": {
    beginner: 0.50,
    intermediate: 1.25,
    advanced: 1.75,
    elite: 2.50,
  },
  "Extensão quadríceps": {
    beginner: 0.50,
    intermediate: 1.25,
    advanced: 1.75,
    elite: 2.50,
  },
  "Cadeira extensora": {
    beginner: 0.50,
    intermediate: 1.25,
    advanced: 1.75,
    elite: 2.50,
  },

  // Rosca com Halteres (Dumbbell Curl)
  // https://strengthlevel.com/strength-standards/dumbbell-curl
  // Nota: valores são por halter, não total
  "Rosca Direta com Halteres": {
    beginner: 0.10,
    intermediate: 0.30,
    advanced: 0.50,
    elite: 0.65,
  },
  "Rosca direta halteres": {
    beginner: 0.10,
    intermediate: 0.30,
    advanced: 0.50,
    elite: 0.65,
  },
  "Rosca Alternada": {
    beginner: 0.10,
    intermediate: 0.30,
    advanced: 0.50,
    elite: 0.65,
  },
  "Rosca alternada": {
    beginner: 0.10,
    intermediate: 0.30,
    advanced: 0.50,
    elite: 0.65,
  },

  // Desenvolvimento com Halteres (Dumbbell Shoulder Press)
  // https://strengthlevel.com/strength-standards/dumbbell-shoulder-press
  // Nota: valores são por halter, não total
  "Desenvolvimento de Ombros com Halteres": {
    beginner: 0.15,
    intermediate: 0.40,
    advanced: 0.60,
    elite: 0.75,
  },
  "Desenvolvimento ombros halteres": {
    beginner: 0.15,
    intermediate: 0.40,
    advanced: 0.60,
    elite: 0.75,
  },
};

// Mapeamento explícito de exercícios para grupos musculares primários
// Isso é mais robusto do que usar `includes()`
export const EXERCISE_TO_MUSCLE_GROUP_MAP: { [key: string]: MuscleGroup } = {
  // ✅ PEITO - Exercícios completos
  "Supino Reto com Barra": "Peito",
  "Supino reto barra": "Peito",
  "Supino Inclinado com Barra": "Peito",
  "Supino inclinado barra": "Peito",
  "Supino inclinado halteres": "Peito",
  "Supino Declinado com Barra": "Peito",
  "Supino declinado barra": "Peito",
  "Supino Reto com Halteres": "Peito",
  "Supino reto halteres": "Peito",
  "Supino Inclinado com Halteres": "Peito",
  "Supino declinado halteres": "Peito",
  "Supino fechado barra": "Peito",
  "Supino smith": "Peito",
  "Supino inclinado smith": "Peito",
  "Supino declinado smith": "Peito",
  "Crucifixo Reto": "Peito",
  "Crucifixo reto": "Peito",
  "Crucifixo Inclinado": "Peito",
  "Crucifixo inclinado": "Peito",
  "Crucifixo declinado": "Peito",
  "Crucifixo cabo": "Peito",
  "Crucifixo máquina": "Peito",
  "Flexão de Braço": "Peito",
  "Flexão de braço": "Peito",
  "Flexão declinada": "Peito",
  "Flexão inclinada": "Peito",
  "Flexão diamante": "Peito",
  "Flexão arqueiro": "Peito",
  "Flexão explosiva": "Peito",
  "Flexão com aplausos": "Peito",
  "Flexão pike": "Peito",
  "Dips para peito": "Peito",
  "Peck Deck": "Peito",
  "Peck deck": "Peito",
  "Cross Over": "Peito",
  "Cross over": "Peito",
  "Cross over alto": "Peito",
  "Cross over médio": "Peito",
  "Cross over baixo": "Peito",
  "Pullover halter": "Peito",
  "Pullover barra": "Peito",
  "Pullover cabo": "Peito",
  "Guillotine press": "Peito",
  "Floor press": "Peito",

  // ✅ COSTAS - Exercícios completos
  "Puxada pela Frente": "Costas",
  "Puxada pela frente": "Costas",
  "Puxada frontal": "Costas",
  "Puxada por Trás": "Costas",
  "Puxada por trás": "Costas",
  "Puxada supinada": "Costas",
  "Puxada neutra": "Costas",
  "Puxada unilateral": "Costas",
  "Remada Curvada com Barra": "Costas",
  "Remada curvada barra": "Costas",
  "Remada curvada pronada": "Costas",
  "Remada curvada supinada": "Costas",
  "Remada Curvada com Halteres": "Costas",
  "Remada curvada halteres": "Costas",
  "Remada Unilateral": "Costas",
  "Remada unilateral": "Costas",
  "Remada unilateral halter": "Costas",
  "Remada Sentado": "Costas",
  "Remada sentado": "Costas",
  "Remada sentado cabo": "Costas",
  "Remada baixa": "Costas",
  "Remada cavalinho": "Costas",
  "Remada T-bar": "Costas",
  "Remada máquina": "Costas",
  "Remada Hammer Strength": "Costas",
  "Barra Fixa": "Costas",
  "Barra fixa pronada": "Costas",
  "Barra Fixa Pronada": "Costas",
  "Barra fixa supinada": "Costas",
  "Barra fixa neutra": "Costas",
  "Muscle-up": "Costas",
  Pulldown: "Costas",
  "Pulldown unilateral cabo": "Costas",
  "Levantamento Terra": "Costas",
  "Deadlift convencional": "Costas",
  "Deadlift Convencional": "Costas",
  "Deadlift sumô": "Costas",
  "Romanian deadlift": "Costas",
  Stiff: "Costas",
  "Rack pull": "Costas",
  "Deficit deadlift": "Costas",
  "Encolhimento de Ombros": "Costas",
  "Shrug barra": "Costas",
  "Shrug halteres": "Costas",
  "Shrug smith": "Costas",
  "Good morning": "Costas",
  "Hiperextensão": "Costas",
  "Hiperextensão 45 graus": "Costas",
  Superman: "Costas",
  "Pullover halter dorsal": "Costas",

  // ✅ PERNAS - Exercícios completos
  "Agachamento Livre": "Pernas",
  "Agachamento livre": "Pernas",
  "Agachamento no Smith": "Pernas",
  "Agachamento smith": "Pernas",
  "Agachamento frontal": "Pernas",
  "Agachamento sumô": "Pernas",
  "Agachamento Búlgaro": "Pernas",
  "Agachamento búlgaro": "Pernas",
  "Agachamento pistol": "Pernas",
  "Agachamento zercher": "Pernas",
  "Agachamento hack": "Pernas",
  "Leg Press": "Pernas",
  "Leg press": "Pernas",
  "Leg press 45": "Pernas",
  "Leg press horizontal": "Pernas",
  "Extensão de Quadríceps": "Pernas",
  "Extensão quadríceps": "Pernas",
  "Cadeira extensora": "Pernas",
  "Flexão de Posterior": "Pernas",
  "Flexão posterior": "Pernas",
  "Mesa flexora": "Pernas",
  "Cadeira flexora": "Pernas",
  Afundo: "Pernas",
  "Afundo caminhando": "Pernas",
  "Afundo reverso": "Pernas",
  "Afundo lateral": "Pernas",
  Passada: "Pernas",
  "Elevação de Panturrilha em Pé": "Pernas",
  "Elevação panturrilha em pé": "Pernas",
  "Elevação de Panturrilha Sentado": "Pernas",
  "Elevação panturrilha sentado": "Pernas",
  "Panturrilha leg press": "Pernas",
  "Panturrilha smith": "Pernas",
  "Box jump": "Pernas",
  "Jump squat": "Pernas",
  "Wall sit": "Pernas",
  "Sissy squat": "Pernas",

  // ✅ GLÚTEOS - Exercícios completos
  "Hip Thrust": "Glúteos",
  "Hip thrust": "Glúteos",
  "Hip thrust barra": "Glúteos",
  "Hip thrust smith": "Glúteos",
  "Glute bridge": "Glúteos",
  "Ponte glúteo": "Glúteos",
  "Elevação pélvica": "Glúteos",
  "Coice glúteo cabo": "Glúteos",
  "Kickback glúteo cabo": "Glúteos",
  "Abdução máquina": "Glúteos",
  "Abdução cabo": "Glúteos",

  // ✅ OMBROS - Exercícios completos
  "Desenvolvimento de Ombros com Barra": "Ombros",
  "Desenvolvimento ombros barra": "Ombros",
  "Desenvolvimento militar": "Ombros",
  "Desenvolvimento de Ombros com Halteres": "Ombros",
  "Desenvolvimento ombros halteres": "Ombros",
  "Desenvolvimento smith": "Ombros",
  "Desenvolvimento máquina": "Ombros",
  "Arnold Press": "Ombros",
  "Arnold press": "Ombros",
  "Elevação Lateral": "Ombros",
  "Elevação lateral": "Ombros",
  "Elevação lateral halteres": "Ombros",
  "Elevação lateral cabo": "Ombros",
  "Elevação lateral máquina": "Ombros",
  "Elevação Frontal": "Ombros",
  "Elevação frontal": "Ombros",
  "Elevação frontal barra": "Ombros",
  "Elevação frontal halteres": "Ombros",
  "Elevação frontal disco": "Ombros",
  "Crucifixo Invertido": "Ombros",
  "Crucifixo invertido": "Ombros",
  "Crucifixo invertido halteres": "Ombros",
  "Crucifixo invertido máquina": "Ombros",
  "Remada Alta": "Ombros",
  "Remada alta": "Ombros",
  "Remada alta barra": "Ombros",
  "Remada alta cabo": "Ombros",
  "Face pull": "Ombros",
  "Desenvolvimento unilateral": "Ombros",
  "Elevação Y": "Ombros",
  "Elevação W": "Ombros",
  "Pike push-up": "Ombros",
  "Handstand push-up": "Ombros",

  // ✅ BÍCEPS - Exercícios completos
  "Rosca Direta com Barra": "Bíceps",
  "Rosca direta barra": "Bíceps",
  "Rosca Direta com Halteres": "Bíceps",
  "Rosca direta halteres": "Bíceps",
  "Rosca Alternada": "Bíceps",
  "Rosca alternada": "Bíceps",
  "Rosca Simultânea": "Bíceps",
  "Rosca simultânea": "Bíceps",
  "Rosca Martelo": "Bíceps",
  "Rosca martelo": "Bíceps",
  "Rosca Concentrada": "Bíceps",
  "Rosca concentrada": "Bíceps",
  "Rosca Inclinada": "Bíceps",
  "Rosca inclinada": "Bíceps",
  "Rosca Scott": "Bíceps",
  "Rosca Scott barra": "Bíceps",
  "Rosca Scott halter": "Bíceps",
  "Rosca no cabo": "Bíceps",
  "Rosca spider": "Bíceps",
  "Rosca Zottman": "Bíceps",
  "Drag curl": "Bíceps",
  "Chin-up": "Bíceps",
  "Rosca 21": "Bíceps",
  "Rosca inversa": "Bíceps",
  "Rosca W": "Bíceps",
  "Rosca cross cable": "Bíceps",
  "Rosca máquina": "Bíceps",
  "Waiter curl": "Bíceps",
  "Rosca cabo unilateral": "Bíceps",
  "Rosca 7-7-7": "Bíceps",
  "Rosca isométrica": "Bíceps",
  "Rosca 1 e 1/4": "Bíceps",

  // ✅ TRÍCEPS - Exercícios completos
  "Tríceps Testa": "Tríceps",
  "Tríceps testa barra": "Tríceps",
  "Tríceps testa halteres": "Tríceps",
  "Tríceps na Corda": "Tríceps",
  "Tríceps corda": "Tríceps",
  "Tríceps Francês": "Tríceps",
  "Tríceps francês": "Tríceps",
  "Tríceps francês unilateral": "Tríceps",
  "Tríceps pulley": "Tríceps",
  "Tríceps barra V": "Tríceps",
  "Mergulho para Tríceps": "Tríceps",
  "Mergulho no banco": "Tríceps",
  "Dips paralelas": "Tríceps",
  "Dips Paralelas": "Tríceps",
  Kickback: "Tríceps",
  "Coice no cabo": "Tríceps",
  "JM press": "Tríceps",
  "Supino fechado tríceps": "Tríceps",
  "Extensão overhead barra": "Tríceps",
  "Extensão overhead cabo": "Tríceps",
  "Tríceps unilateral cabo": "Tríceps",
  "Diamond push-up": "Tríceps",
  "Tríceps máquina": "Tríceps",
  "Tríceps banco neutro": "Tríceps",
  "California press": "Tríceps",
  "Tríceps smith": "Tríceps",
  "Overhead extension smith": "Tríceps",

  // ✅ ANTEBRAÇO - Exercícios completos
  "Rosca de Punho": "Antebraço",
  "Rosca punho": "Antebraço",
  "Rosca punho reversa": "Antebraço",
  "Rosca punho halteres": "Antebraço",
  "Farmer walk": "Antebraço",
  "Pronação halteres": "Antebraço",
  "Supinação halteres": "Antebraço",
  "Wrist roller": "Antebraço",
  "Pegada trap bar": "Antebraço",
  "Dead hang": "Antebraço",
  "Pinch grip": "Antebraço",
  "Grip crush": "Antebraço",
  "Plate pinch": "Antebraço",
  "Rosca punho cabo": "Antebraço",
  "Flexão radial": "Antebraço",
  "Flexão ulnar": "Antebraço",
  "Hammer curl antebraço": "Antebraço",

  // ✅ ABDÔMEN - Exercícios completos
  "Abdominal Tradicional": "Abdômen",
  "Abdominal tradicional": "Abdômen",
  Abdominal: "Abdômen",
  "Abdominal Infra": "Abdômen",
  "Abdominal infra": "Abdômen",
  "Abdominal supra": "Abdômen",
  "Abdominal Oblíquo": "Abdômen",
  "Abdominal oblíquo": "Abdômen",
  "Abdominal remador": "Abdômen",
  "Abdominal bicicleta": "Abdômen",
  Prancha: "Abdômen",
  "Prancha lateral": "Abdômen",
  "Prancha alta": "Abdômen",
  "Prancha baixa": "Abdômen",
  "Prancha dinâmica": "Abdômen",
  "Elevação de Pernas": "Abdômen",
  "Elevação pernas": "Abdômen",
  "Elevação pernas barra": "Abdômen",
  "Elevação pernas solo": "Abdômen",
  "Russian Twist": "Abdômen",
  "Russian twist": "Abdômen",
  "Mountain Climber": "Abdômen",
  "Mountain climber": "Abdômen",
  "V-up": "Abdômen",
  "Sit-up": "Abdômen",
  Crunch: "Abdômen",
  "Crunch máquina": "Abdômen",
  "Crunch cabo": "Abdômen",
  "Dead bug": "Abdômen",
  "Hollow hold": "Abdômen",
  "Ab wheel": "Abdômen",
  "Roda abdominal": "Abdômen",
  "Dragon flag": "Abdômen",
  "L-sit": "Abdômen",
  "Knee raise": "Abdômen",
  "Leg raise": "Abdômen",
  "Toes to bar": "Abdômen",
  "Hanging knee raise": "Abdômen",
  "Cable crunch": "Abdômen",
  "Woodchop": "Abdômen",
  "Pallof press": "Abdômen",
};

// Dias da semana para uso em analytics
export const DAY_NAMES = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
