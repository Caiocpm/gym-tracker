// server/prisma/seed.js
// Popula a tabela PredefinedFood com os 597 alimentos da Tabela TACO
// Executar: node prisma/seed.js  (dentro de server/)

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

/** Converte valores TACO ("NA", "Tr", "", null) para número ou null */
function num(v) {
  if (v === null || v === undefined || v === 'NA' || v === '' || v === 'Tr') return null;
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}

async function main() {
  const tacoPath = path.resolve(__dirname, '../../TACO.json');

  if (!fs.existsSync(tacoPath)) {
    console.error(`❌ TACO.json não encontrado em: ${tacoPath}`);
    process.exit(1);
  }

  const tacoData = JSON.parse(fs.readFileSync(tacoPath, 'utf-8'));
  console.log(`📋 ${tacoData.length} alimentos encontrados no TACO.json`);

  // Remove entradas TACO anteriores (createdBy: null) para evitar duplicatas
  const deleted = await prisma.predefinedFood.deleteMany({
    where: { createdBy: null },
  });
  if (deleted.count > 0) {
    console.log(`🗑️  ${deleted.count} entradas TACO antigas removidas`);
  }

  const foods = tacoData.map((item) => ({
    name: item.description,
    category: item.category ?? null,
    calories: num(item.energy_kcal) ?? 0,
    protein: num(item.protein_g) ?? 0,
    carbs: num(item.carbohydrate_g) ?? 0,
    fat: num(item.lipid_g) ?? 0,
    servingSize: 100,
    servingUnit: 'g',
    micronutrients: {
      fiber_g: num(item.fiber_g),
      calcium_mg: num(item.calcium_mg),
      magnesium_mg: num(item.magnesium_mg),
      phosphorus_mg: num(item.phosphorus_mg),
      iron_mg: num(item.iron_mg),
      sodium_mg: num(item.sodium_mg),
      potassium_mg: num(item.potassium_mg),
      zinc_mg: num(item.zinc_mg),
      vitaminC_mg: num(item.vitaminC_mg),
      thiamine_mg: num(item.thiamine_mg),
      riboflavin_mg: num(item.riboflavin_mg),
      pyridoxine_mg: num(item.pyridoxine_mg),
      niacin_mg: num(item.niacin_mg),
      cholesterol_mg: num(item.cholesterol_mg),
      saturated_g: num(item.saturated_g),
      monounsaturated_g: num(item.monounsaturated_g),
      polyunsaturated_g: num(item.polyunsaturated_g),
    },
    createdBy: null, // null = alimento global TACO (não pertence a nenhum usuário)
  }));

  // Insere em lotes de 50 para não sobrecarregar o banco
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < foods.length; i += batchSize) {
    await prisma.predefinedFood.createMany({
      data: foods.slice(i, i + batchSize),
    });
    inserted += Math.min(batchSize, foods.length - i);
    process.stdout.write(`\r  Inserindo... ${inserted}/${foods.length}`);
  }

  console.log(`\n✅ Seed concluído! ${inserted} alimentos TACO inseridos.`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
