/**
 * Script para popular dados de teste da Área Profissional
 * Cria um perfil profissional com 5 alunos vinculados
 */

import { db as indexedDB } from "../db/database";
import type { ProfessionalProfile, StudentLink } from "../types/professional";

export async function seedProfessionalData(professionalUserId: string) {
  try {
    console.log("🌱 Iniciando seed de dados profissionais...");

    // 0. Limpar dados existentes primeiro para evitar duplicação
    console.log("🗑️ Limpando dados anteriores...");
    await indexedDB.professionalProfiles.clear();
    await indexedDB.studentLinks.clear();
    await indexedDB.studentInvitations.clear();
    await indexedDB.workoutSessions.clear();
    await indexedDB.workoutDays.clear();
    await indexedDB.bodyMeasurements.clear();
    console.log("✅ Dados anteriores limpos");

    // 1. Criar perfil profissional
    const professionalProfile: ProfessionalProfile = {
      id: professionalUserId,
      userId: professionalUserId,
      email: "profissional@gymtracker.com",
      displayName: "João Personal Trainer",
      professionalType: "personal_trainer",
      specialties: ["Hipertrofia", "Emagrecimento", "Condicionamento"],
      cref: "123456-G/SP",
      phone: "(11) 98765-4321",
      bio: "Personal Trainer especializado em hipertrofia e emagrecimento com 10 anos de experiência.",
      yearsOfExperience: 10,
      certification: ["CREF Ativo", "Certificação Internacional de Musculação"],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await indexedDB.professionalProfiles.put(professionalProfile);
    console.log("✅ Perfil profissional criado");

    // 2. Criar 10 alunos vinculados com perfis variados
    const students = [
      {
        name: "Maria Silva",
        email: "maria.silva@email.com",
        goal: "Perder peso e ganhar condicionamento",
        notes: "Iniciante, treina 3x por semana",
      },
      {
        name: "Pedro Santos",
        email: "pedro.santos@email.com",
        goal: "Hipertrofia muscular",
        notes: "Intermediário, foco em peito e costas",
      },
      {
        name: "Ana Costa",
        email: "ana.costa@email.com",
        goal: "Recomposição corporal",
        notes: "Avançada, dieta restrita em carboidratos",
      },
      {
        name: "Carlos Oliveira",
        email: "carlos.oliveira@email.com",
        goal: "Ganho de massa magra",
        notes: "Iniciante, dificuldade com agachamento",
      },
      {
        name: "Juliana Pereira",
        email: "juliana.pereira@email.com",
        goal: "Definição muscular",
        notes: "Intermediária, preparação para competição",
      },
      {
        name: "Roberto Almeida",
        email: "roberto.almeida@email.com",
        goal: "Força e potência",
        notes: "Avançado, treinos de powerlifting",
      },
      {
        name: "Fernanda Lima",
        email: "fernanda.lima@email.com",
        goal: "Emagrecimento saudável",
        notes: "Iniciante, foco em cardio e musculação",
      },
      {
        name: "Lucas Martins",
        email: "lucas.martins@email.com",
        goal: "Ganho de massa muscular",
        notes: "Intermediário, boa resposta a treino",
      },
      {
        name: "Camila Rodrigues",
        email: "camila.rodrigues@email.com",
        goal: "Condicionamento físico",
        notes: "Avançada, treinamento funcional",
      },
      {
        name: "Rafael Costa",
        email: "rafael.costa@email.com",
        goal: "Reabilitação e fortalecimento",
        notes: "Iniciante, pós-lesão no joelho",
      },
    ];

    const studentLinks: StudentLink[] = students.map((student, index) => ({
      id: `link-${Date.now()}-${index}`,
      professionalId: professionalUserId,
      studentUserId: `student-${Date.now()}-${index}`, // ID simulado
      studentEmail: student.email,
      studentName: student.name,
      accessLevel: "full" as const,
      status: "active" as const,
      linkedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Vinculado nos últimos 30 dias
      notes: student.notes,
      goals: student.goal,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    // Salvar todos os links
    for (const link of studentLinks) {
      await indexedDB.studentLinks.put(link);
    }

    console.log(`✅ ${studentLinks.length} alunos vinculados`);

    // 3. Criar alguns convites pendentes
    const pendingInvites = [
      {
        email: "joao.silva@email.com",
        name: "João Silva",
      },
      {
        email: "patricia.souza@email.com",
        name: "Patricia Souza",
      },
    ];

    for (let i = 0; i < pendingInvites.length; i++) {
      const invite = pendingInvites[i];
      await indexedDB.studentInvitations.put({
        id: `invitation-${Date.now()}-${i}`,
        professionalId: professionalUserId,
        professionalName: professionalProfile.displayName,
        professionalEmail: professionalProfile.email,
        studentEmail: invite.email,
        invitationCode: `INV-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        accessLevel: "full",
        status: "pending",
        message: `Olá ${invite.name}! Gostaria de acompanhar seu progresso no GymTracker.`,
        sentAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    console.log(`✅ ${pendingInvites.length} convites pendentes criados`);

    // 4. Criar sessões de treino para gerar ALERTAS diversos
    const now = new Date();

    // === ALUNO 0: Maria Silva - Ativa e Regular (SEM ALERTAS) ===
    for (let i = 0; i < 5; i++) {
      const sessionDate = new Date(now);
      sessionDate.setDate(sessionDate.getDate() - (i * 2));
      await indexedDB.workoutSessions.put({
        id: `session-maria-${i}`,
        date: sessionDate.toISOString(),
        dayId: 'treino-a',
        workoutDayId: 'treino-a',
        startTime: '08:00',
        exercises: [],
      });
    }

    // === ALUNO 1: Pedro Santos - INATIVO HÁ 8 DIAS (ALERTA ATENÇÃO) ===
    await indexedDB.workoutSessions.put({
      id: `session-pedro-last`,
      date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      dayId: 'treino-a',
      workoutDayId: 'treino-a',
      startTime: '08:00',
      exercises: [],
    });

    // === ALUNO 2: Ana Costa - TREINO ANTIGO 27 DIAS (ALERTA RENOVAÇÃO) ===
    await indexedDB.workoutDays.put({
      id: `workout-ana`,
      name: 'Treino ABC',
      exercises: [],
      createdAt: new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000).toISOString(),
    });
    for (let i = 0; i < 3; i++) {
      await indexedDB.workoutSessions.put({
        id: `session-ana-${i}`,
        date: new Date(now.getTime() - i * 3 * 24 * 60 * 60 * 1000).toISOString(),
        dayId: 'workout-ana',
        workoutDayId: 'workout-ana',
        startTime: '08:00',
        exercises: [],
      });
    }

    // === ALUNO 3: Carlos Oliveira - OVERTRAINING 11 DIAS CONSECUTIVOS (ALERTA) ===
    for (let i = 0; i < 11; i++) {
      await indexedDB.workoutSessions.put({
        id: `session-carlos-${i}`,
        date: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString(),
        dayId: 'treino-a',
        workoutDayId: 'treino-a',
        startTime: '08:00',
        exercises: [],
      });
    }

    // === ALUNO 4: Juliana Pereira - MEDIDAS ATRASADAS 33 DIAS (ALERTA INFO) ===
    await indexedDB.bodyMeasurements.put({
      id: `measurement-juliana`,
      date: new Date(now.getTime() - 33 * 24 * 60 * 60 * 1000).toISOString(),
      weight: 62,
      height: 165,
      userId: studentLinks[4].studentUserId,
    });
    for (let i = 0; i < 4; i++) {
      await indexedDB.workoutSessions.put({
        id: `session-juliana-${i}`,
        date: new Date(now.getTime() - i * 2 * 24 * 60 * 60 * 1000).toISOString(),
        dayId: 'treino-a',
        workoutDayId: 'treino-a',
        startTime: '08:00',
        exercises: [],
      });
    }

    // === ALUNO 5: Roberto Almeida - INATIVO HÁ 15 DIAS (ALERTA URGENTE) ===
    await indexedDB.workoutSessions.put({
      id: `session-roberto-last`,
      date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      dayId: 'treino-a',
      workoutDayId: 'treino-a',
      startTime: '08:00',
      exercises: [],
    });

    // === ALUNO 6: Fernanda Lima - Ativa, SEM ALERTAS ===
    for (let i = 0; i < 4; i++) {
      await indexedDB.workoutSessions.put({
        id: `session-fernanda-${i}`,
        date: new Date(now.getTime() - i * 3 * 24 * 60 * 60 * 1000).toISOString(),
        dayId: 'treino-a',
        workoutDayId: 'treino-a',
        startTime: '08:00',
        exercises: [],
      });
    }

    // === ALUNO 7: Lucas Martins - TREINO ANTIGO 30 DIAS + INATIVO 9 DIAS (MÚLTIPLOS ALERTAS) ===
    await indexedDB.workoutDays.put({
      id: `workout-lucas`,
      name: 'Treino Full Body',
      exercises: [],
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    await indexedDB.workoutSessions.put({
      id: `session-lucas-last`,
      date: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      dayId: 'workout-lucas',
      workoutDayId: 'workout-lucas',
      startTime: '08:00',
      exercises: [],
    });

    // === ALUNO 8: Camila Rodrigues - Ativa com bom ritmo, SEM ALERTAS ===
    for (let i = 0; i < 6; i++) {
      await indexedDB.workoutSessions.put({
        id: `session-camila-${i}`,
        date: new Date(now.getTime() - i * 2 * 24 * 60 * 60 * 1000).toISOString(),
        dayId: 'treino-a',
        workoutDayId: 'treino-a',
        startTime: '08:00',
        exercises: [],
      });
    }

    // === ALUNO 9: Rafael Costa - MEDIDAS ATRASADAS 40 DIAS (ALERTA INFO) ===
    await indexedDB.bodyMeasurements.put({
      id: `measurement-rafael`,
      date: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      weight: 78,
      height: 175,
      userId: studentLinks[9].studentUserId,
    });
    for (let i = 0; i < 3; i++) {
      await indexedDB.workoutSessions.put({
        id: `session-rafael-${i}`,
        date: new Date(now.getTime() - i * 4 * 24 * 60 * 60 * 1000).toISOString(),
        dayId: 'treino-a',
        workoutDayId: 'treino-a',
        startTime: '08:00',
        exercises: [],
      });
    }

    console.log("✅ Sessões de treino criadas para gerar alertas");

    console.log("🎉 Seed concluído com sucesso!");
    console.log("\n📊 Resumo:");
    console.log(`- 1 perfil profissional (${professionalProfile.displayName})`);
    console.log(`- ${studentLinks.length} alunos ativos`);
    console.log(`- ${pendingInvites.length} convites pendentes`);
    console.log(`- Dados de treino com alertas variados criados`);
    console.log("\n🔔 Alertas esperados:");
    console.log(`- Maria: SEM ALERTAS (ativa e regular)`);
    console.log(`- Pedro: Inativo há 8 dias (Atenção)`);
    console.log(`- Ana: Treino precisa renovar - 27 dias (Atenção)`);
    console.log(`- Carlos: Overtraining - 11 dias consecutivos (Atenção)`);
    console.log(`- Juliana: Medidas atrasadas - 33 dias (Info)`);
    console.log(`- Roberto: Inativo há 15 dias (Urgente)`);
    console.log(`- Fernanda: SEM ALERTAS (ativa)`);
    console.log(`- Lucas: Treino antigo 30 dias + Inativo 9 dias (Múltiplos)`);
    console.log(`- Camila: SEM ALERTAS (ativa com bom ritmo)`);
    console.log(`- Rafael: Medidas atrasadas - 40 dias (Info)`);

    return {
      professionalProfile,
      studentLinks,
      invitationsCount: pendingInvites.length,
    };
  } catch (error) {
    console.error("❌ Erro ao popular dados:", error);
    throw error;
  }
}

/**
 * Limpa todos os dados profissionais de teste
 */
export async function clearProfessionalData() {
  try {
    console.log("🗑️ Limpando dados profissionais...");

    await indexedDB.professionalProfiles.clear();
    await indexedDB.studentLinks.clear();
    await indexedDB.studentInvitations.clear();

    console.log("✅ Dados profissionais limpos");
  } catch (error) {
    console.error("❌ Erro ao limpar dados:", error);
    throw error;
  }
}
