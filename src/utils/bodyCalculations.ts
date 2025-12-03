// src/utils/bodyCalculations.ts

import type {
  UserProfile,
  BodyMeasurements,
  BodyComposition,
} from "../types/profile";

// ===== CÁLCULO DE IMC =====
export function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
}

export function getBMIClassification(bmi: number): string {
  if (bmi < 18.5) return "Abaixo do peso";
  if (bmi < 25) return "Peso normal";
  if (bmi < 30) return "Sobrepeso";
  if (bmi < 35) return "Obesidade grau I";
  if (bmi < 40) return "Obesidade grau II";
  return "Obesidade grau III";
}

// ===== CÁLCULO DE GORDURA CORPORAL (POLLOCK 7 DOBRAS) =====
export function calculateBodyFatPollock7(
  measurements: BodyMeasurements,
  profile: UserProfile
): number {
  const {
    tricep,
    subscapular,
    chest_skinfold,
    midaxillary,
    suprailiac,
    abdominal,
    thigh_skinfold,
  } = measurements;

  // Verificar se todas as dobras estão presentes
  if (
    !tricep ||
    !subscapular ||
    !chest_skinfold ||
    !midaxillary ||
    !suprailiac ||
    !abdominal ||
    !thigh_skinfold
  ) {
    return 0;
  }

  const sumOfSkinfolds =
    tricep +
    subscapular +
    chest_skinfold +
    midaxillary +
    suprailiac +
    abdominal +
    thigh_skinfold;
  const age = profile.age;

  let bodyDensity: number;

  if (profile.gender === "masculino") {
    // Fórmula para homens (Jackson & Pollock, 1978)
    bodyDensity =
      1.112 -
      0.00043499 * sumOfSkinfolds +
      0.00000055 * sumOfSkinfolds * sumOfSkinfolds -
      0.00028826 * age;
  } else {
    // Fórmula para mulheres (Jackson, Pollock & Ward, 1980)
    bodyDensity =
      1.097 -
      0.00046971 * sumOfSkinfolds +
      0.00000056 * sumOfSkinfolds * sumOfSkinfolds -
      0.00012828 * age;
  }

  // Converter densidade corporal em % de gordura (Siri, 1961)
  const bodyFatPercentage = (4.95 / bodyDensity - 4.5) * 100;

  return Number(Math.max(0, bodyFatPercentage).toFixed(1));
}

// ===== CLASSIFICAÇÃO DE GORDURA CORPORAL =====
export function getBodyFatClassification(
  bodyFat: number,
  gender: string
): string {
  // ✅ Removido parâmetro age
  const ranges =
    gender === "masculino"
      ? {
          essential: [2, 5],
          athlete: [6, 13],
          fitness: [14, 17],
          average: [18, 24],
          obese: [25, 100],
        }
      : {
          essential: [10, 13],
          athlete: [14, 20],
          fitness: [21, 24],
          average: [25, 31],
          obese: [32, 100],
        };

  if (bodyFat >= ranges.essential[0] && bodyFat <= ranges.essential[1])
    return "Essencial";
  if (bodyFat >= ranges.athlete[0] && bodyFat <= ranges.athlete[1])
    return "Atleta";
  if (bodyFat >= ranges.fitness[0] && bodyFat <= ranges.fitness[1])
    return "Fitness";
  if (bodyFat >= ranges.average[0] && bodyFat <= ranges.average[1])
    return "Média";
  if (bodyFat >= ranges.obese[0]) return "Obesidade";

  return "Abaixo do essencial";
}

// ===== COMPOSIÇÃO CORPORAL COMPLETA =====
export function calculateBodyComposition(
  measurements: BodyMeasurements,
  profile: UserProfile
): BodyComposition {
  const bmi = calculateBMI(measurements.weight, profile.height);
  const bodyFat = calculateBodyFatPollock7(measurements, profile);
  const fatMass = (measurements.weight * bodyFat) / 100;
  const leanMass = measurements.weight - fatMass;
  const classification = getBodyFatClassification(bodyFat, profile.gender); // ✅ Removido age

  return {
    bmi: Number(bmi.toFixed(1)),
    bodyFat: Number(bodyFat.toFixed(1)),
    leanMass: Number(leanMass.toFixed(1)),
    fatMass: Number(fatMass.toFixed(1)),
    classification,
  };
}

// ===== CÁLCULO DE TMB (Taxa Metabólica Basal) =====
export function calculateBMR(
  profile: UserProfile,
  currentWeight: number
): number {
  const { age, height, gender } = profile;

  if (gender === "masculino") {
    // Fórmula de Mifflin-St Jeor para homens
    return 10 * currentWeight + 6.25 * height - 5 * age + 5;
  } else {
    // Fórmula de Mifflin-St Jeor para mulheres
    return 10 * currentWeight + 6.25 * height - 5 * age - 161;
  }
}

// ===== GASTO ENERGÉTICO TOTAL =====
export function calculateTDEE(bmr: number, activityLevel: string): number {
  const multipliers = {
    sedentario: 1.2,
    leve: 1.375,
    moderado: 1.55,
    intenso: 1.725,
    muito_intenso: 1.9,
  };

  return bmr * (multipliers[activityLevel as keyof typeof multipliers] || 1.2);
}

// ===== FORÇA RELATIVA =====
export function calculateRelativeStrength(
  weight: number,
  bodyWeight: number
): number {
  return Number((weight / bodyWeight).toFixed(2));
}

export function getStrengthLevel(
  relativeStrength: number,
  exercise: string,
  gender: string
): string {
  // Tabelas baseadas em dados de powerlifting
  const strengthStandards: Record<string, Record<string, number[]>> = {
    "Supino Reto": {
      masculino: [0.75, 1.0, 1.25, 1.5], // [iniciante, intermediário, avançado, elite]
      feminino: [0.5, 0.75, 1.0, 1.25],
    },
    Agachamento: {
      masculino: [1.0, 1.5, 2.0, 2.5],
      feminino: [0.75, 1.25, 1.75, 2.25],
    },
    "Levantamento Terra": {
      masculino: [1.25, 1.75, 2.25, 2.75],
      feminino: [1.0, 1.5, 2.0, 2.5],
    },
  };

  const standards = strengthStandards[exercise]?.[gender];
  if (!standards) return "Não classificado";

  if (relativeStrength < standards[0]) return "Iniciante";
  if (relativeStrength < standards[1]) return "Intermediário";
  if (relativeStrength < standards[2]) return "Avançado";
  if (relativeStrength < standards[3]) return "Elite";
  return "Elite+";
}
