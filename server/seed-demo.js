const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PRO_ID = '336d9ab2-4286-4a3b-9a4c-b31a44771a1e';
const HASH = '$2b$10$dZB7Vx70Hluv37LEMF64yexNbWh.MtictFF1fACJSveQ5Dy9uzIM2';

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function dateStr(n) {
  return daysAgo(n).toISOString().slice(0, 10);
}

async function main() {

  // ─── 1. Lucas Ferreira — treina bem, consistente ──────────────────────────
  const lucas = await prisma.user.upsert({
    where: { email: 'lucas@kinify.demo' },
    update: {},
    create: { email: 'lucas@kinify.demo', passwordHash: HASH, displayName: 'Lucas Ferreira', emailVerified: true },
  });
  const lucasLink = await prisma.studentLink.create({
    data: {
      professionalId: PRO_ID,
      studentUserId: lucas.id,
      studentEmail: lucas.email,
      status: 'active',
      linkedAt: daysAgo(45),
      planRenewedAt: daysAgo(10),
    },
  });
  for (const d of [1, 3, 5, 8, 10, 12, 15, 17, 19, 22]) {
    await prisma.workoutSession.create({
      data: {
        userId: lucas.id,
        date: dateStr(d),
        duration: 65,
        exercises: JSON.stringify([
          { exerciseName: 'Supino Reto', sets: 4, reps: 10, weight: 80 },
          { exerciseName: 'Agachamento Livre', sets: 4, reps: 8, weight: 100 },
          { exerciseName: 'Puxada Frontal', sets: 3, reps: 12, weight: 60 },
          { exerciseName: 'Desenvolvimento', sets: 3, reps: 10, weight: 50 },
        ]),
        isStrengthTrainingSession: true,
      },
    });
  }
  for (const d of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    await prisma.foodEntry.createMany({
      data: [
        { userId: lucas.id, name: 'Aveia com banana', calories: 380, protein: 14, carbs: 65, fat: 7, meal: 'breakfast', date: dateStr(d), status: 'consumed' },
        { userId: lucas.id, name: 'Frango grelhado com arroz', calories: 680, protein: 52, carbs: 78, fat: 10, meal: 'lunch', date: dateStr(d), status: 'consumed' },
        { userId: lucas.id, name: 'Shake proteico', calories: 260, protein: 35, carbs: 20, fat: 5, meal: 'snack', date: dateStr(d), status: 'consumed' },
        { userId: lucas.id, name: 'Omelete com batata doce', calories: 480, protein: 38, carbs: 45, fat: 14, meal: 'dinner', date: dateStr(d), status: 'consumed' },
      ],
    });
  }
  await prisma.studentGoal.createMany({
    data: [
      {
        professionalId: PRO_ID, studentLinkId: lucasLink.id,
        title: 'Ganhar 3kg de massa muscular', category: 'strength',
        currentValue: 78.5, targetValue: 81, unit: 'kg',
        startValue: 76, startDate: dateStr(45), targetDate: dateStr(-60),
        progress: 67, status: 'active',
      },
      {
        professionalId: PRO_ID, studentLinkId: lucasLink.id,
        title: 'Supino acima de 90kg', category: 'strength',
        currentValue: 80, targetValue: 90, unit: 'kg',
        startValue: 70, startDate: dateStr(45), targetDate: dateStr(-30),
        progress: 50, status: 'active',
      },
    ],
  });
  await prisma.studentNote.createMany({
    data: [
      {
        professionalId: PRO_ID, studentLinkId: lucasLink.id,
        title: 'Avaliação semana 6',
        content: 'Lucas está evoluindo muito bem. Aumento de carga no supino de 70 para 80kg nas últimas 3 semanas. Manter o volume atual e adicionar série no agachamento.',
        category: 'progress',
      },
      {
        professionalId: PRO_ID, studentLinkId: lucasLink.id,
        title: 'Ajuste de dieta',
        content: 'Aumentar ingestão de carboidratos nos dias de treino pesado. Sugeri adicionar arroz no jantar pós-treino.',
        category: 'nutrition',
      },
    ],
  });
  console.log('Lucas criado');

  // ─── 2. Mariana Costa — inativa há 8 dias ────────────────────────────────
  const mariana = await prisma.user.upsert({
    where: { email: 'mariana@kinify.demo' },
    update: {},
    create: { email: 'mariana@kinify.demo', passwordHash: HASH, displayName: 'Mariana Costa', emailVerified: true },
  });
  const marianaLink = await prisma.studentLink.create({
    data: {
      professionalId: PRO_ID,
      studentUserId: mariana.id,
      studentEmail: mariana.email,
      status: 'active',
      linkedAt: daysAgo(30),
      planRenewedAt: daysAgo(8),
    },
  });
  // Treinos antes da inatividade
  for (const d of [8, 11, 14, 18, 21, 25]) {
    await prisma.workoutSession.create({
      data: {
        userId: mariana.id,
        date: dateStr(d),
        duration: 45,
        exercises: JSON.stringify([
          { exerciseName: 'Esteira', sets: 1, reps: 1 },
          { exerciseName: 'Abdominal', sets: 3, reps: 20 },
          { exerciseName: 'Glúteo no cabo', sets: 3, reps: 15, weight: 15 },
        ]),
        isStrengthTrainingSession: false,
      },
    });
  }
  await prisma.studentGoal.create({
    data: {
      professionalId: PRO_ID, studentLinkId: marianaLink.id,
      title: 'Perder 5kg', category: 'weight',
      currentValue: 72, targetValue: 67, unit: 'kg',
      startValue: 75, startDate: dateStr(30), targetDate: dateStr(-30),
      progress: 60, status: 'active',
    },
  });
  await prisma.studentNote.create({
    data: {
      professionalId: PRO_ID, studentLinkId: marianaLink.id,
      title: 'Atenção — dor no joelho',
      content: 'Mariana relatou dor no joelho direito na última sessão. Evitar agachamento e leg press por enquanto. Substituir por exercícios de cadeia fechada sem impacto.',
      category: 'health',
    },
  });
  console.log('Mariana criada (inativa 8 dias)');

  // ─── 3. Rafael Oliveira — plano vencendo em 4 dias ───────────────────────
  const rafael = await prisma.user.upsert({
    where: { email: 'rafael@kinify.demo' },
    update: {},
    create: { email: 'rafael@kinify.demo', passwordHash: HASH, displayName: 'Rafael Oliveira', emailVerified: true },
  });
  const rafaelLink = await prisma.studentLink.create({
    data: {
      professionalId: PRO_ID,
      studentUserId: rafael.id,
      studentEmail: rafael.email,
      status: 'active',
      linkedAt: daysAgo(60),
      planRenewedAt: daysAgo(26),
    },
  });
  for (const d of [1, 3, 6, 8, 11, 13, 16, 18]) {
    await prisma.workoutSession.create({
      data: {
        userId: rafael.id,
        date: dateStr(d),
        duration: 75,
        exercises: JSON.stringify([
          { exerciseName: 'Levantamento Terra', sets: 5, reps: 5, weight: 120 },
          { exerciseName: 'Remada Curvada', sets: 4, reps: 8, weight: 70 },
          { exerciseName: 'Rosca Direta', sets: 3, reps: 12, weight: 30 },
          { exerciseName: 'Tríceps Testa', sets: 3, reps: 12, weight: 25 },
        ]),
        isStrengthTrainingSession: true,
      },
    });
  }
  await prisma.studentGoal.createMany({
    data: [
      {
        professionalId: PRO_ID, studentLinkId: rafaelLink.id,
        title: 'Levantar 140kg no terra', category: 'strength',
        currentValue: 120, targetValue: 140, unit: 'kg',
        startValue: 100, startDate: dateStr(60), targetDate: dateStr(-30),
        progress: 50, status: 'active',
      },
      {
        professionalId: PRO_ID, studentLinkId: rafaelLink.id,
        title: 'Reduzir % de gordura para 15%', category: 'body_composition',
        currentValue: 18, targetValue: 15, unit: '%',
        startValue: 22, startDate: dateStr(60), targetDate: dateStr(-30),
        progress: 57, status: 'active',
      },
    ],
  });
  await prisma.studentNote.create({
    data: {
      professionalId: PRO_ID, studentLinkId: rafaelLink.id,
      title: 'Evolução no levantamento terra',
      content: 'Rafael atingiu 120kg no terra com boa execução. Progressão semanal de 2.5kg. Verificar mobilidade de quadril antes de escalar mais.',
      category: 'progress',
    },
  });
  console.log('Rafael criado (plano vence em 4 dias)');

  // ─── 4. Camila Santos — inativa 7 dias + plano vence em 2 dias ───────────
  const camila = await prisma.user.upsert({
    where: { email: 'camila@kinify.demo' },
    update: {},
    create: { email: 'camila@kinify.demo', passwordHash: HASH, displayName: 'Camila Santos', emailVerified: true },
  });
  const camilaLink = await prisma.studentLink.create({
    data: {
      professionalId: PRO_ID,
      studentUserId: camila.id,
      studentEmail: camila.email,
      status: 'active',
      linkedAt: daysAgo(60),
      planRenewedAt: daysAgo(28),
    },
  });
  await prisma.workoutSession.create({
    data: {
      userId: camila.id,
      date: dateStr(7),
      duration: 50,
      exercises: JSON.stringify([
        { exerciseName: 'Pilates', sets: 1, reps: 1 },
        { exerciseName: 'Alongamento', sets: 1, reps: 1 },
      ]),
      isStrengthTrainingSession: false,
    },
  });
  await prisma.studentGoal.create({
    data: {
      professionalId: PRO_ID, studentLinkId: camilaLink.id,
      title: 'Melhorar postura e flexibilidade', category: 'other',
      currentValue: 6, targetValue: 10, unit: 'pontos',
      startValue: 3, startDate: dateStr(60), targetDate: dateStr(-30),
      progress: 43, status: 'active',
    },
  });
  await prisma.studentNote.create({
    data: {
      professionalId: PRO_ID, studentLinkId: camilaLink.id,
      title: 'Sem contato desde semana passada',
      content: 'Camila não apareceu nos 2 últimos treinos e não responde mensagens. Ligar para verificar situação e agendar retorno.',
      category: 'general',
    },
  });
  console.log('Camila criada (inativa 7d + plano vence em 2d)');

  // ─── 5. Pedro Alves — consistência nutricional excelente ─────────────────
  const pedro = await prisma.user.upsert({
    where: { email: 'pedro@kinify.demo' },
    update: {},
    create: { email: 'pedro@kinify.demo', passwordHash: HASH, displayName: 'Pedro Alves', emailVerified: true },
  });
  const pedroLink = await prisma.studentLink.create({
    data: {
      professionalId: PRO_ID,
      studentUserId: pedro.id,
      studentEmail: pedro.email,
      status: 'active',
      linkedAt: daysAgo(20),
      planRenewedAt: daysAgo(3),
    },
  });
  for (const d of [0, 2, 4, 7, 9, 12, 14, 16]) {
    await prisma.workoutSession.create({
      data: {
        userId: pedro.id,
        date: dateStr(d),
        duration: 60,
        exercises: JSON.stringify([
          { exerciseName: 'Leg Press 45°', sets: 4, reps: 12, weight: 180 },
          { exerciseName: 'Cadeira Extensora', sets: 3, reps: 15, weight: 45 },
          { exerciseName: 'Stiff', sets: 3, reps: 10, weight: 60 },
          { exerciseName: 'Panturrilha em pé', sets: 4, reps: 20, weight: 80 },
        ]),
        isStrengthTrainingSession: true,
      },
    });
  }
  for (const d of [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]) {
    await prisma.foodEntry.createMany({
      data: [
        { userId: pedro.id, name: 'Vitamina de banana com aveia', calories: 420, protein: 32, carbs: 58, fat: 8, meal: 'breakfast', date: dateStr(d), status: 'consumed' },
        { userId: pedro.id, name: 'Arroz integral, frango e legumes', calories: 720, protein: 55, carbs: 82, fat: 12, meal: 'lunch', date: dateStr(d), status: 'consumed' },
        { userId: pedro.id, name: 'Iogurte grego com granola', calories: 220, protein: 18, carbs: 28, fat: 4, meal: 'snack', date: dateStr(d), status: 'consumed' },
        { userId: pedro.id, name: 'Salmão grelhado com batata doce', calories: 540, protein: 45, carbs: 55, fat: 16, meal: 'dinner', date: dateStr(d), status: 'consumed' },
      ],
    });
  }
  await prisma.nutritionGoals.upsert({
    where: { userId: pedro.id },
    update: {},
    create: { userId: pedro.id, calories: 1900, protein: 150, carbs: 223, fat: 40, water: 3000 },
  });
  await prisma.studentGoal.create({
    data: {
      professionalId: PRO_ID, studentLinkId: pedroLink.id,
      title: 'Atingir 10% de gordura corporal', category: 'body_composition',
      currentValue: 14, targetValue: 10, unit: '%',
      startValue: 18, startDate: dateStr(20), targetDate: dateStr(-40),
      progress: 50, status: 'active',
    },
  });
  await prisma.studentNote.create({
    data: {
      professionalId: PRO_ID, studentLinkId: pedroLink.id,
      title: 'Adesão à dieta impecável',
      content: 'Pedro está seguindo o plano alimentar com 95% de adesão. Excelente disciplina. Próximo passo: adicionar aeróbico em jejum 2x por semana.',
      category: 'nutrition',
    },
  });
  console.log('Pedro criado (excelente consistência)');

  const total = await prisma.studentLink.count({ where: { professionalId: PRO_ID } });
  console.log('Total de vínculos agora:', total);
}

main()
  .then(() => { console.log('Seed concluído!'); process.exit(0); })
  .catch((e) => { console.error(e); process.exit(1); });
