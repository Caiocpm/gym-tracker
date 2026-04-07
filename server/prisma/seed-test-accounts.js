/**
 * Seed: conta profissional de teste + aluno test@test.com vinculado
 *
 * Profissional : pro@gymtracker.com  /  Test@1234
 * Aluno        : test@test.com       /  Test@1234
 *
 * Uso: node prisma/seed-test-accounts.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
require('dotenv').config();

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Criando contas de teste...\n');

  // ── 1. Usuário profissional ──────────────────────────────────────────────────
  const proEmail = 'pro@gymtracker.com';
  const proPassword = 'Test@1234';
  const proHash = await bcrypt.hash(proPassword, SALT_ROUNDS);

  const proUser = await prisma.user.upsert({
    where: { email: proEmail },
    update: {},
    create: {
      email: proEmail,
      passwordHash: proHash,
      displayName: 'Profissional Teste',
      emailVerified: true,
    },
  });

  console.log(`✅ Usuário profissional: ${proUser.email} (id: ${proUser.id})`);

  // ── 2. Perfil profissional ───────────────────────────────────────────────────
  const profile = await prisma.professionalProfile.upsert({
    where: { userId: proUser.id },
    update: {},
    create: {
      userId: proUser.id,
      email: proEmail,
      displayName: 'Profissional Teste',
      professionalTypes: ['personal_trainer'],
      plan: 'full',
      bio: 'Conta de teste para desenvolvimento',
      isActive: true,
    },
  });

  console.log(`✅ Perfil profissional criado (id: ${profile.id})\n`);

  // ── 3. Usuário aluno ─────────────────────────────────────────────────────────
  const studentEmail = 'test@test.com';
  const studentPassword = 'Test@1234';
  const studentHash = await bcrypt.hash(studentPassword, SALT_ROUNDS);

  const studentUser = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {},
    create: {
      email: studentEmail,
      passwordHash: studentHash,
      displayName: 'Aluno Teste',
      emailVerified: true,
    },
  });

  console.log(`✅ Usuário aluno: ${studentUser.email} (id: ${studentUser.id})`);

  // ── 4. Vínculo profissional ↔ aluno ─────────────────────────────────────────
  const existing = await prisma.studentLink.findFirst({
    where: { professionalId: proUser.id, studentUserId: studentUser.id },
  });

  let link;
  if (existing) {
    console.log(`ℹ️  Vínculo já existe (id: ${existing.id}), mantendo.`);
    link = existing;
  } else {
    link = await prisma.studentLink.create({
      data: {
        professionalId: proUser.id,
        studentUserId: studentUser.id,
        studentEmail: studentEmail,
        accessLevel: 'full',
        status: 'active',
      },
    });
    console.log(`✅ Vínculo criado (id: ${link.id})`);
  }

  console.log('\n─────────────────────────────────────────────');
  console.log('🎉 Seed concluído!\n');
  console.log('  Portal web  → http://localhost:3001/login');
  console.log(`  E-mail      : ${proEmail}`);
  console.log(`  Senha       : ${proPassword}`);
  console.log('\n  App mobile (aluno):');
  console.log(`  E-mail      : ${studentEmail}`);
  console.log(`  Senha       : ${studentPassword}`);
  console.log('─────────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
