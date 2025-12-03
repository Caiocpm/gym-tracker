// src/types/goals.ts
export interface UserGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  micronutrients: Record<string, number>;
  createdBy: "user" | "professional";
  professionalInfo?: {
    name: string;
    license: string;
    notes: string;
  };
  createdAt: string;
  validFrom: string;
  validUntil?: string;
}

export interface GoalsHistory {
  id: string;
  goals: UserGoals;
  isActive: boolean;
}

// ✅ MICRONUTRIENTES DISPONÍVEIS NO BANCO
export interface MicronutrientOption {
  id: string;
  name: string;
  unit: string;
  category: string;
  dailyValue: number;
  description?: string;
}

export const AVAILABLE_MICRONUTRIENTS: MicronutrientOption[] = [
  // Vitaminas
  {
    id: "vitamin_a",
    name: "Vitamina A",
    unit: "µg",
    category: "Vitaminas",
    dailyValue: 900,
    description: "Importante para visão e imunidade",
  },
  {
    id: "vitamin_b1",
    name: "Vitamina B1 (Tiamina)",
    unit: "mg",
    category: "Vitaminas",
    dailyValue: 1.2,
    description: "Metabolismo energético",
  },
  {
    id: "vitamin_b2",
    name: "Vitamina B2 (Riboflavina)",
    unit: "mg",
    category: "Vitaminas",
    dailyValue: 1.3,
    description: "Produção de energia celular",
  },
  {
    id: "vitamin_b3",
    name: "Vitamina B3 (Niacina)",
    unit: "mg",
    category: "Vitaminas",
    dailyValue: 16,
    description: "Função cerebral e pele",
  },
  {
    id: "vitamin_b6",
    name: "Vitamina B6 (Piridoxina)",
    unit: "mg",
    category: "Vitaminas",
    dailyValue: 1.3,
    description: "Metabolismo de proteínas",
  },
  {
    id: "vitamin_b9",
    name: "Vitamina B9 (Ácido Fólico)",
    unit: "µg",
    category: "Vitaminas",
    dailyValue: 400,
    description: "Formação de células sanguíneas",
  },
  {
    id: "vitamin_b12",
    name: "Vitamina B12 (Cobalamina)",
    unit: "µg",
    category: "Vitaminas",
    dailyValue: 2.4,
    description: "Sistema nervoso e sangue",
  },
  {
    id: "vitamin_c",
    name: "Vitamina C (Ácido Ascórbico)",
    unit: "mg",
    category: "Vitaminas",
    dailyValue: 90,
    description: "Antioxidante e imunidade",
  },
  {
    id: "vitamin_d",
    name: "Vitamina D",
    unit: "µg",
    category: "Vitaminas",
    dailyValue: 15,
    description: "Saúde óssea e imunidade",
  },
  {
    id: "vitamin_e",
    name: "Vitamina E",
    unit: "mg",
    category: "Vitaminas",
    dailyValue: 15,
    description: "Antioxidante celular",
  },
  {
    id: "vitamin_k",
    name: "Vitamina K",
    unit: "µg",
    category: "Vitaminas",
    dailyValue: 120,
    description: "Coagulação sanguínea",
  },

  // Minerais
  {
    id: "calcium",
    name: "Cálcio",
    unit: "mg",
    category: "Minerais",
    dailyValue: 1000,
    description: "Saúde óssea e muscular",
  },
  {
    id: "iron",
    name: "Ferro",
    unit: "mg",
    category: "Minerais",
    dailyValue: 18,
    description: "Transporte de oxigênio",
  },
  {
    id: "magnesium",
    name: "Magnésio",
    unit: "mg",
    category: "Minerais",
    dailyValue: 400,
    description: "Função muscular e nervosa",
  },
  {
    id: "phosphorus",
    name: "Fósforo",
    unit: "mg",
    category: "Minerais",
    dailyValue: 700,
    description: "Saúde óssea e energia",
  },
  {
    id: "potassium",
    name: "Potássio",
    unit: "mg",
    category: "Minerais",
    dailyValue: 3500,
    description: "Pressão arterial e músculos",
  },
  {
    id: "sodium",
    name: "Sódio",
    unit: "mg",
    category: "Minerais",
    dailyValue: 2300,
    description: "Equilíbrio hídrico",
  },
  {
    id: "zinc",
    name: "Zinco",
    unit: "mg",
    category: "Minerais",
    dailyValue: 11,
    description: "Imunidade e cicatrização",
  },
  {
    id: "copper",
    name: "Cobre",
    unit: "mg",
    category: "Minerais",
    dailyValue: 0.9,
    description: "Formação de colágeno",
  },
  {
    id: "selenium",
    name: "Selênio",
    unit: "µg",
    category: "Minerais",
    dailyValue: 55,
    description: "Antioxidante e tireoide",
  },
  {
    id: "iodine",
    name: "Iodo",
    unit: "µg",
    category: "Minerais",
    dailyValue: 150,
    description: "Função da tireoide",
  },

  // Outros compostos
  {
    id: "omega_3",
    name: "Ômega-3",
    unit: "g",
    category: "Ácidos Graxos",
    dailyValue: 1.6,
    description: "Saúde cardiovascular",
  },
  {
    id: "fiber",
    name: "Fibra Alimentar",
    unit: "g",
    category: "Outros",
    dailyValue: 25,
    description: "Saúde digestiva",
  },
  {
    id: "cholesterol",
    name: "Colesterol",
    unit: "mg",
    category: "Outros",
    dailyValue: 300,
    description: "Limite máximo recomendado",
  },
];

export const DEFAULT_GOALS: UserGoals = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 67,
  water: 2500,
  micronutrients: {},
  createdBy: "user",
  createdAt: new Date().toISOString(),
  validFrom: new Date().toISOString().split("T")[0],
};
