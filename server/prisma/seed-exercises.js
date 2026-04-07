// server/prisma/seed-exercises.js
// Popula ExerciseDefinition com exercícios globais
// Executar: node prisma/seed-exercises.js  (dentro de server/)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const exercises = [
  // ─── PEITO ────────────────────────────────────────────────────────────────
  { name: 'Supino Reto com Barra',          primaryMuscleGroup: 'Peito',              equipment: 'Barra' },
  { name: 'Supino Inclinado com Barra',     primaryMuscleGroup: 'Peito',              equipment: 'Barra' },
  { name: 'Supino Declinado com Barra',     primaryMuscleGroup: 'Peito',              equipment: 'Barra' },
  { name: 'Supino Reto com Halteres',       primaryMuscleGroup: 'Peito',              equipment: 'Halteres' },
  { name: 'Supino Inclinado com Halteres',  primaryMuscleGroup: 'Peito',              equipment: 'Halteres' },
  { name: 'Supino Declinado com Halteres',  primaryMuscleGroup: 'Peito',              equipment: 'Halteres' },
  { name: 'Crucifixo com Halteres',         primaryMuscleGroup: 'Peito',              equipment: 'Halteres' },
  { name: 'Crucifixo Inclinado',            primaryMuscleGroup: 'Peito',              equipment: 'Halteres' },
  { name: 'Crossover no Cabo',              primaryMuscleGroup: 'Peito',              equipment: 'Cabo' },
  { name: 'Pec Deck (Voador)',              primaryMuscleGroup: 'Peito',              equipment: 'Máquina' },
  { name: 'Supino no Smith',                primaryMuscleGroup: 'Peito',              equipment: 'Máquina' },
  { name: 'Flexão de Braço',                primaryMuscleGroup: 'Peito',              equipment: 'Peso Corporal' },
  { name: 'Flexão de Braço Inclinada',      primaryMuscleGroup: 'Peito',              equipment: 'Peso Corporal' },
  { name: 'Mergulho (Paralelas)',           primaryMuscleGroup: 'Peito',              equipment: 'Peso Corporal' },

  // ─── COSTAS ───────────────────────────────────────────────────────────────
  { name: 'Puxada Frontal',                 primaryMuscleGroup: 'Costas',             equipment: 'Cabo' },
  { name: 'Puxada pela Nuca',               primaryMuscleGroup: 'Costas',             equipment: 'Cabo' },
  { name: 'Puxada Triângulo',               primaryMuscleGroup: 'Costas',             equipment: 'Cabo' },
  { name: 'Remada Curvada com Barra',       primaryMuscleGroup: 'Costas',             equipment: 'Barra' },
  { name: 'Remada Curvada com Halteres',    primaryMuscleGroup: 'Costas',             equipment: 'Halteres' },
  { name: 'Remada Unilateral',              primaryMuscleGroup: 'Costas',             equipment: 'Halteres' },
  { name: 'Remada Cavalinho',               primaryMuscleGroup: 'Costas',             equipment: 'Máquina' },
  { name: 'Remada Sentado no Cabo',         primaryMuscleGroup: 'Costas',             equipment: 'Cabo' },
  { name: 'Levantamento Terra',             primaryMuscleGroup: 'Costas',             equipment: 'Barra' },
  { name: 'Levantamento Terra Romeno',      primaryMuscleGroup: 'Costas',             equipment: 'Barra' },
  { name: 'Barra Fixa',                     primaryMuscleGroup: 'Costas',             equipment: 'Peso Corporal' },
  { name: 'Barra Fixa Supinada',            primaryMuscleGroup: 'Costas',             equipment: 'Peso Corporal' },
  { name: 'Pullover com Halter',            primaryMuscleGroup: 'Costas',             equipment: 'Halteres' },
  { name: 'Pullover no Cabo',               primaryMuscleGroup: 'Costas',             equipment: 'Cabo' },
  { name: 'Hiperextensão Lombar',           primaryMuscleGroup: 'Lombar',             equipment: 'Máquina' },
  { name: 'Good Morning',                   primaryMuscleGroup: 'Lombar',             equipment: 'Barra' },

  // ─── OMBROS ───────────────────────────────────────────────────────────────
  { name: 'Desenvolvimento com Barra',      primaryMuscleGroup: 'Ombros',             equipment: 'Barra' },
  { name: 'Desenvolvimento com Halteres',   primaryMuscleGroup: 'Ombros',             equipment: 'Halteres' },
  { name: 'Desenvolvimento no Smith',       primaryMuscleGroup: 'Ombros',             equipment: 'Máquina' },
  { name: 'Desenvolvimento na Máquina',     primaryMuscleGroup: 'Ombros',             equipment: 'Máquina' },
  { name: 'Elevação Lateral com Halteres',  primaryMuscleGroup: 'Ombros',             equipment: 'Halteres' },
  { name: 'Elevação Lateral no Cabo',       primaryMuscleGroup: 'Ombros',             equipment: 'Cabo' },
  { name: 'Elevação Frontal com Halteres',  primaryMuscleGroup: 'Ombros',             equipment: 'Halteres' },
  { name: 'Elevação Frontal com Barra',     primaryMuscleGroup: 'Ombros',             equipment: 'Barra' },
  { name: 'Crucifixo Invertido',            primaryMuscleGroup: 'Ombros',             equipment: 'Halteres' },
  { name: 'Remada Alta com Barra',          primaryMuscleGroup: 'Ombros',             equipment: 'Barra' },
  { name: 'Remada Alta com Cabo',           primaryMuscleGroup: 'Ombros',             equipment: 'Cabo' },
  { name: 'Arnold Press',                   primaryMuscleGroup: 'Ombros',             equipment: 'Halteres' },

  // ─── TRAPÉZIO ─────────────────────────────────────────────────────────────
  { name: 'Encolhimento com Barra',         primaryMuscleGroup: 'Trapézio',           equipment: 'Barra' },
  { name: 'Encolhimento com Halteres',      primaryMuscleGroup: 'Trapézio',           equipment: 'Halteres' },
  { name: 'Encolhimento no Cabo',           primaryMuscleGroup: 'Trapézio',           equipment: 'Cabo' },
  { name: 'Encolhimento na Máquina',        primaryMuscleGroup: 'Trapézio',           equipment: 'Máquina' },

  // ─── BÍCEPS ───────────────────────────────────────────────────────────────
  { name: 'Rosca Direta com Barra',         primaryMuscleGroup: 'Bíceps',             equipment: 'Barra' },
  { name: 'Rosca Direta com Halteres',      primaryMuscleGroup: 'Bíceps',             equipment: 'Halteres' },
  { name: 'Rosca Alternada',                primaryMuscleGroup: 'Bíceps',             equipment: 'Halteres' },
  { name: 'Rosca Martelo',                  primaryMuscleGroup: 'Bíceps',             equipment: 'Halteres' },
  { name: 'Rosca Concentrada',              primaryMuscleGroup: 'Bíceps',             equipment: 'Halteres' },
  { name: 'Rosca no Cabo',                  primaryMuscleGroup: 'Bíceps',             equipment: 'Cabo' },
  { name: 'Rosca Scott',                    primaryMuscleGroup: 'Bíceps',             equipment: 'Barra' },
  { name: 'Rosca Inversa',                  primaryMuscleGroup: 'Bíceps',             equipment: 'Barra' },
  { name: 'Rosca 21',                       primaryMuscleGroup: 'Bíceps',             equipment: 'Barra' },

  // ─── TRÍCEPS ──────────────────────────────────────────────────────────────
  { name: 'Tríceps Testa com Barra',        primaryMuscleGroup: 'Tríceps',            equipment: 'Barra' },
  { name: 'Tríceps Testa com Halteres',     primaryMuscleGroup: 'Tríceps',            equipment: 'Halteres' },
  { name: 'Tríceps Corda no Cabo',          primaryMuscleGroup: 'Tríceps',            equipment: 'Cabo' },
  { name: 'Tríceps Francês',                primaryMuscleGroup: 'Tríceps',            equipment: 'Halteres' },
  { name: 'Tríceps Coice',                  primaryMuscleGroup: 'Tríceps',            equipment: 'Halteres' },
  { name: 'Extensão de Tríceps no Cabo',    primaryMuscleGroup: 'Tríceps',            equipment: 'Cabo' },
  { name: 'Mergulho no Banco',              primaryMuscleGroup: 'Tríceps',            equipment: 'Peso Corporal' },
  { name: 'Tríceps na Máquina',             primaryMuscleGroup: 'Tríceps',            equipment: 'Máquina' },
  { name: 'Supino Fechado',                 primaryMuscleGroup: 'Tríceps',            equipment: 'Barra' },

  // ─── ANTEBRAÇO ────────────────────────────────────────────────────────────
  { name: 'Rosca de Punho',                 primaryMuscleGroup: 'Antebraço',          equipment: 'Barra' },
  { name: 'Rosca de Punho Inversa',         primaryMuscleGroup: 'Antebraço',          equipment: 'Barra' },
  { name: 'Farmer Walk',                    primaryMuscleGroup: 'Antebraço',          equipment: 'Halteres' },

  // ─── QUADRÍCEPS ───────────────────────────────────────────────────────────
  { name: 'Agachamento Livre',              primaryMuscleGroup: 'Quadríceps',         equipment: 'Barra' },
  { name: 'Agachamento no Smith',           primaryMuscleGroup: 'Quadríceps',         equipment: 'Máquina' },
  { name: 'Agachamento Goblet',             primaryMuscleGroup: 'Quadríceps',         equipment: 'Halteres' },
  { name: 'Agachamento Búlgaro',            primaryMuscleGroup: 'Quadríceps',         equipment: 'Halteres' },
  { name: 'Leg Press 45°',                  primaryMuscleGroup: 'Quadríceps',         equipment: 'Máquina' },
  { name: 'Leg Press Horizontal',           primaryMuscleGroup: 'Quadríceps',         equipment: 'Máquina' },
  { name: 'Extensão de Pernas',             primaryMuscleGroup: 'Quadríceps',         equipment: 'Máquina' },
  { name: 'Avanço com Barra',               primaryMuscleGroup: 'Quadríceps',         equipment: 'Barra' },
  { name: 'Avanço com Halteres',            primaryMuscleGroup: 'Quadríceps',         equipment: 'Halteres' },
  { name: 'Hack Squat',                     primaryMuscleGroup: 'Quadríceps',         equipment: 'Máquina' },

  // ─── POSTERIOR DE COXA ────────────────────────────────────────────────────
  { name: 'Flexão de Pernas',               primaryMuscleGroup: 'Posterior de Coxa',  equipment: 'Máquina' },
  { name: 'Mesa Flexora',                   primaryMuscleGroup: 'Posterior de Coxa',  equipment: 'Máquina' },
  { name: 'Stiff com Barra',                primaryMuscleGroup: 'Posterior de Coxa',  equipment: 'Barra' },
  { name: 'Stiff com Halteres',             primaryMuscleGroup: 'Posterior de Coxa',  equipment: 'Halteres' },
  { name: 'Levantamento Terra Sumô',        primaryMuscleGroup: 'Posterior de Coxa',  equipment: 'Barra' },
  { name: 'Cadeira Flexora',                primaryMuscleGroup: 'Posterior de Coxa',  equipment: 'Máquina' },
  { name: 'Nordic Curl',                    primaryMuscleGroup: 'Posterior de Coxa',  equipment: 'Peso Corporal' },

  // ─── GLÚTEOS ──────────────────────────────────────────────────────────────
  { name: 'Hip Thrust com Barra',           primaryMuscleGroup: 'Glúteos',            equipment: 'Barra' },
  { name: 'Hip Thrust na Máquina',          primaryMuscleGroup: 'Glúteos',            equipment: 'Máquina' },
  { name: 'Glúteo no Cabo',                 primaryMuscleGroup: 'Glúteos',            equipment: 'Cabo' },
  { name: 'Cadeira Abdutora',               primaryMuscleGroup: 'Glúteos',            equipment: 'Máquina' },
  { name: 'Cadeira Adutora',                primaryMuscleGroup: 'Glúteos',            equipment: 'Máquina' },
  { name: 'Elevação Pélvica',               primaryMuscleGroup: 'Glúteos',            equipment: 'Peso Corporal' },
  { name: 'Agachamento Sumô',               primaryMuscleGroup: 'Glúteos',            equipment: 'Halteres' },

  // ─── PANTURRILHA ──────────────────────────────────────────────────────────
  { name: 'Panturrilha em Pé na Máquina',   primaryMuscleGroup: 'Panturrilha',        equipment: 'Máquina' },
  { name: 'Panturrilha Sentado',            primaryMuscleGroup: 'Panturrilha',        equipment: 'Máquina' },
  { name: 'Panturrilha no Leg Press',       primaryMuscleGroup: 'Panturrilha',        equipment: 'Máquina' },
  { name: 'Panturrilha com Halteres',       primaryMuscleGroup: 'Panturrilha',        equipment: 'Halteres' },
  { name: 'Panturrilha Unilateral',         primaryMuscleGroup: 'Panturrilha',        equipment: 'Peso Corporal' },

  // ─── ABDÔMEN ──────────────────────────────────────────────────────────────
  { name: 'Abdominal Supra',                primaryMuscleGroup: 'Abdômen',            equipment: 'Peso Corporal' },
  { name: 'Abdominal Infra',                primaryMuscleGroup: 'Abdômen',            equipment: 'Peso Corporal' },
  { name: 'Abdominal Oblíquo',              primaryMuscleGroup: 'Abdômen',            equipment: 'Peso Corporal' },
  { name: 'Crunch na Polia',                primaryMuscleGroup: 'Abdômen',            equipment: 'Cabo' },
  { name: 'Prancha',                        primaryMuscleGroup: 'Abdômen',            equipment: 'Peso Corporal' },
  { name: 'Prancha Lateral',                primaryMuscleGroup: 'Abdômen',            equipment: 'Peso Corporal' },
  { name: 'Elevação de Pernas',             primaryMuscleGroup: 'Abdômen',            equipment: 'Peso Corporal' },
  { name: 'Russian Twist',                  primaryMuscleGroup: 'Abdômen',            equipment: 'Peso Corporal' },
  { name: 'Dead Bug',                       primaryMuscleGroup: 'Abdômen',            equipment: 'Peso Corporal' },
  { name: 'Rollout com Roda',               primaryMuscleGroup: 'Abdômen',            equipment: 'Máquina' },
  { name: 'Mountain Climber',               primaryMuscleGroup: 'Abdômen',            equipment: 'Peso Corporal' },

  // ─── CARDIO — CORRIDA ─────────────────────────────────────────────────────
  { name: 'Corrida',                        primaryMuscleGroup: 'Cardio',  equipment: 'Peso Corporal', exerciseType: 'cardio', cardioSubtype: 'corrida' },
  { name: 'Corrida na Esteira',             primaryMuscleGroup: 'Cardio',  equipment: 'Máquina',       exerciseType: 'cardio', cardioSubtype: 'corrida' },
  { name: 'Corrida de Trilha',              primaryMuscleGroup: 'Cardio',  equipment: 'Peso Corporal', exerciseType: 'cardio', cardioSubtype: 'corrida' },
  { name: 'Corrida Intervalada (HIIT)',     primaryMuscleGroup: 'Cardio',  equipment: 'Peso Corporal', exerciseType: 'cardio', cardioSubtype: 'corrida' },

  // ─── CARDIO — CAMINHADA ───────────────────────────────────────────────────
  { name: 'Caminhada',                      primaryMuscleGroup: 'Cardio',  equipment: 'Peso Corporal', exerciseType: 'cardio', cardioSubtype: 'caminhada' },

  // ─── CARDIO — CICLISMO OUTDOOR ────────────────────────────────────────────
  { name: 'Ciclismo ao Ar Livre',           primaryMuscleGroup: 'Cardio',  equipment: 'Peso Corporal', exerciseType: 'cardio', cardioSubtype: 'ciclismo' },

  // ─── CARDIO — BICICLETA ERGOMÉTRICA / SPINNING ────────────────────────────
  { name: 'Bicicleta Ergométrica',          primaryMuscleGroup: 'Cardio',  equipment: 'Máquina',       exerciseType: 'cardio', cardioSubtype: 'bicicleta_ergometrica' },
  { name: 'Spinning',                       primaryMuscleGroup: 'Cardio',  equipment: 'Máquina',       exerciseType: 'cardio', cardioSubtype: 'bicicleta_ergometrica' },

  // ─── CARDIO — NATAÇÃO ─────────────────────────────────────────────────────
  { name: 'Natação Livre (Crawl)',          primaryMuscleGroup: 'Cardio',  equipment: 'Peso Corporal', exerciseType: 'cardio', cardioSubtype: 'natacao' },
  { name: 'Natação Costas',                 primaryMuscleGroup: 'Cardio',  equipment: 'Peso Corporal', exerciseType: 'cardio', cardioSubtype: 'natacao' },
  { name: 'Natação Peito',                  primaryMuscleGroup: 'Cardio',  equipment: 'Peso Corporal', exerciseType: 'cardio', cardioSubtype: 'natacao' },
  { name: 'Natação Borboleta',              primaryMuscleGroup: 'Cardio',  equipment: 'Peso Corporal', exerciseType: 'cardio', cardioSubtype: 'natacao' },

  // ─── CARDIO — REMO ────────────────────────────────────────────────────────
  { name: 'Remo Ergométrico',               primaryMuscleGroup: 'Cardio',  equipment: 'Máquina',       exerciseType: 'cardio', cardioSubtype: 'remo' },

  // ─── CARDIO — ESCADA ──────────────────────────────────────────────────────
  { name: 'Escada Rolante (StairMaster)',   primaryMuscleGroup: 'Cardio',  equipment: 'Máquina',       exerciseType: 'cardio', cardioSubtype: 'escada' },

  // ─── CARDIO — FUNCIONAL ───────────────────────────────────────────────────
  { name: 'Pular Corda',                    primaryMuscleGroup: 'Cardio',  equipment: 'Peso Corporal', exerciseType: 'cardio', cardioSubtype: 'funcional' },
  { name: 'Jump (Cama Elástica)',           primaryMuscleGroup: 'Cardio',  equipment: 'Máquina',       exerciseType: 'cardio', cardioSubtype: 'funcional' },
  { name: 'Burpee',                         primaryMuscleGroup: 'Cardio',  equipment: 'Peso Corporal', exerciseType: 'cardio', cardioSubtype: 'funcional' },
  { name: 'Polichinelo',                    primaryMuscleGroup: 'Cardio',  equipment: 'Peso Corporal', exerciseType: 'cardio', cardioSubtype: 'funcional' },

  // ─── CARDIO — GENÉRICO ────────────────────────────────────────────────────
  { name: 'Elíptico',                       primaryMuscleGroup: 'Cardio',  equipment: 'Máquina',       exerciseType: 'cardio', cardioSubtype: null },

  // ─── CROSSFIT ─────────────────────────────────────────────────────────────
  { name: 'CrossFit WOD',                   primaryMuscleGroup: 'Cardio',  equipment: 'Peso Corporal', exerciseType: 'cardio', cardioSubtype: 'crossfit' },
];

async function main() {
  let created = 0;
  let updated = 0;

  for (const e of exercises) {
    const existing = await prisma.exerciseDefinition.findFirst({
      where: { name: e.name, createdBy: null },
      select: { id: true },
    });

    if (existing) {
      await prisma.exerciseDefinition.update({
        where: { id: existing.id },
        data: {
          primaryMuscleGroup: e.primaryMuscleGroup ?? null,
          equipment: e.equipment ?? null,
          exerciseType: e.exerciseType ?? 'forca',
          cardioSubtype: e.cardioSubtype ?? null,
        },
      });
      updated++;
    } else {
      await prisma.exerciseDefinition.create({
        data: {
          name: e.name,
          primaryMuscleGroup: e.primaryMuscleGroup ?? null,
          secondaryMuscleGroups: [],
          equipment: e.equipment ?? null,
          exerciseType: e.exerciseType ?? 'forca',
          cardioSubtype: e.cardioSubtype ?? null,
          createdBy: null,
        },
      });
      created++;
    }
  }

  const total = exercises.length;
  const cardio = exercises.filter((e) => e.exerciseType === 'cardio').length;
  console.log(`✅ ${total} exercícios (${created} criados, ${updated} atualizados, ${cardio} cardio)`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
