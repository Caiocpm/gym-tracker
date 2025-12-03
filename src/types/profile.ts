// src/types/profile.ts

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: "masculino" | "feminino" | "other";
  height: number; // em cm
  weight: number; // em kg
  activityLevel:
    | "sedentario"
    | "leve"
    | "moderado"
    | "intenso"
    | "muito_intenso";
  goal: "perder_peso" | "manter_peso" | "ganhar_massa" | "ganhar_forca";
  createdAt: string;
  updatedAt: string;
}

export interface BodyMeasurements {
  id: string;
  userId: string;
  date: string;
  weight: number;
  height?: number; // Altura em cm
  bodyFat?: number; // Percentual de gordura corporal
  // Circunferências (em cm)
  chest?: number; // Peito (mantido para compatibilidade)
  waist?: number; // Cintura (já existe)
  hip?: number; // Quadril (já existe)
  neck?: number; // Pescoço (já existe)
  bicep?: number; // Bíceps (genérico, mantido para compatibilidade)
  forearm?: number; // Antebraço (genérico, mantido para compatibilidade)
  thigh?: number; // Coxa (genérico, mantido para compatibilidade)
  calf?: number; // Panturrilha (genérico, mantido para compatibilidade)

  // ✅ NOVAS CIRCUNFERÊNCIAS DETALHADAS
  thorax?: number; // Tórax
  bicep_right_contracted?: number; // Braço direito contraído
  bicep_left_contracted?: number; // Braço esquerdo contraído
  bicep_right_relaxed?: number; // Braço direito relaxado
  bicep_left_relaxed?: number; // Braço esquerdo relaxado
  abdomen_circumference?: number; // Abdômen (distinto da dobra cutânea abdominal)
  forearm_right?: number; // Antebraço direito
  forearm_left?: number; // Antebraço esquerdo
  thigh_right?: number; // Coxa direita
  thigh_left?: number; // Coxa esquerda
  scapular_circumference?: number; // Escapular (assumindo circunferência, distinto da dobra subescapular)
  calf_right?: number; // Panturrilha direita
  calf_left?: number; // Panturrilha esquerda

  // Pollock 7 Dobras (em mm)
  tricep?: number; // Tríceps
  subscapular?: number; // Subescapular
  chest_skinfold?: number; // Peitoral
  midaxillary?: number; // Axilar média
  suprailiac?: number; // Supra-ilíaca
  abdominal?: number; // Abdominal (dobra cutânea)
  thigh_skinfold?: number; // Coxa (dobra cutânea)
}

export interface BodyComposition {
  bmi: number;
  bodyFat: number; // % gordura corporal
  leanMass: number; // massa magra em kg
  fatMass: number; // massa gorda em kg
  classification: string;
}

export interface ProfileState {
  profile: UserProfile | null;
  measurements: BodyMeasurements[];
  isLoading: boolean;
  error: string | null;
}

export type ProfileAction =
  | { type: "SET_PROFILE"; payload: UserProfile }
  | { type: "UPDATE_PROFILE"; payload: Partial<UserProfile> }
  | { type: "ADD_MEASUREMENT"; payload: BodyMeasurements }
  | {
      type: "UPDATE_MEASUREMENT";
      payload: { id: string; data: Partial<BodyMeasurements> };
    }
  | { type: "DELETE_MEASUREMENT"; payload: string }
  | { type: "LOAD_PROFILE_DATA"; payload: ProfileState }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };
