const fs = require('fs');

console.log('Ì¥ß Corrigindo TACO com tratamento de valores nulos...');

// Ler JSON
const tacoData = JSON.parse(fs.readFileSync('Taco.JSON', 'utf8'));

console.log(`Ì≥ä Total de itens: ${tacoData.length}`);

// Fun√ß√£o para tratar valores nulos/indefinidos
function safeNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '' || value === 'NA' || value === 'Tr') {
    return defaultValue;
  }
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

// Fun√ß√£o de limpeza de texto
function cleanText(text) {
  if (!text) return '';
  
  return text
    .replace(/‚îú√∫/g, '√£')
    .replace(/‚îú√°/g, '√°') 
    .replace(/‚îú¬Æ/g, '√©')
    .replace(/‚îú¬°/g, '√≠')
    .replace(/‚îú‚îÇ/g, '√≥')
    .replace(/‚îú‚ïë/g, '√∫')
    .replace(/‚îú√°/g, '√†')
    .replace(/‚îú¬¨/g, '√™')
    .replace(/‚îú‚î§/g, '√¥')
    .replace(/‚îú√≥/g, '√¢')
    .replace(/‚îú¬∫/g, '√ß')
    .replace(/‚îú√Å/g, '√á')
    .replace(/‚îú√´/g, '√µ')
    .replace(/√É¬°/g, '√°')
    .replace(/√É¬©/g, '√©')
    .replace(/√É¬≠/g, '√≠')
    .replace(/√É¬≥/g, '√≥')
    .replace(/√É¬∫/g, '√∫')
    .replace(/√É /g, '√†')
    .replace(/√É¬™/g, '√™')
    .replace(/√É¬¥/g, '√¥')
    .replace(/√É¬¢/g, '√¢')
    .replace(/√É¬ß/g, '√ß')
    .replace(/√É¬£/g, '√£')
    .replace(/√É¬µ/g, '√µ')
    .trim();
}

// Mapear categorias para √≠cones
const categoryIconMap = {
  'Cereais e derivados': 'ÌΩö',
  'Verduras, hortali√ßas e derivados': 'Ìµ¶', 
  'Frutas e derivados': 'ÌΩé',
  'Gorduras e √≥leos': 'Ìµë',
  'Pescados e frutos do mar': 'Ì∞ü',
  'Carnes e derivados': 'Ìµ©',
  'Leite e derivados': 'Ìµõ',
  'Bebidas (alco√≥licas e n√£o alco√≥licas)': 'Ìµ§',
  'Ovos e derivados': 'Ìµö',
  'Produtos a√ßucarados': 'ÌΩ≠',
  'Miscel√¢neas': 'ÌΩΩÔ∏è',
  'Outros alimentos industrializados': 'Ìµ´',
  'Alimentos preparados': 'ÌΩ≤',
  'Leguminosas e derivados': 'Ìªò',
  'Nozes e sementes': 'Ìµú'
};

const categoryMap = {
  'Cereais e derivados': 'carbs',
  'Verduras, hortali√ßas e derivados': 'vegetables', 
  'Frutas e derivados': 'fruits',
  'Gorduras e √≥leos': 'fats',
  'Pescados e frutos do mar': 'protein',
  'Carnes e derivados': 'protein',
  'Leite e derivados': 'dairy',
  'Bebidas (alco√≥licas e n√£o alco√≥licas)': 'beverages',
  'Ovos e derivados': 'protein',
  'Produtos a√ßucarados': 'snacks',
  'Miscel√¢neas': 'snacks',
  'Outros alimentos industrializados': 'snacks',
  'Alimentos preparados': 'snacks',
  'Leguminosas e derivados': 'protein',
  'Nozes e sementes': 'fats'
};

// Processar dados com tratamento seguro de valores nulos
const foods = tacoData.map((item, index) => {
  const cleanName = cleanText(item.description || 'Alimento sem nome');
  const category = item.category || 'Miscel√¢neas';
  
  return {
    id: `taco_${index + 1}`,
    name: cleanName,
    category: categoryMap[category] || 'snacks',
    calories: Math.round(safeNumber(item.energy_kcal, 0)),
    protein: Math.round(safeNumber(item.protein_g, 0) * 10) / 10,
    carbs: Math.round(safeNumber(item.carbohydrate_g, 0) * 10) / 10,
    fat: Math.round(safeNumber(item.lipid_g, 0) * 10) / 10,
    icon: categoryIconMap[category] || 'ÌΩΩÔ∏è'
  };
});

// Filtrar alimentos com dados v√°lidos (pelo menos calorias > 0 ou algum macronutriente > 0)
const validFoods = foods.filter(food => 
  food.calories > 0 || food.protein > 0 || food.carbs > 0 || food.fat > 0
);

console.log(`‚úÖ Alimentos v√°lidos: ${validFoods.length} de ${foods.length}`);

// Gerar arquivo TypeScript
const output = `// Gerado automaticamente da Tabela TACO - Tabela Brasileira de Composi√ß√£o de Alimentos
// Total de alimentos: ${validFoods.length}

import type { PredefinedFood } from '../types/nutrition'; 

export const tacoFoods: PredefinedFood[] = ${JSON.stringify(validFoods, null, 2)};

export default tacoFoods;
`;

fs.writeFileSync('src/data/tacoFoodDatabase.ts', output, 'utf8');

console.log(`‚úÖ Database corrigido com ${validFoods.length} alimentos v√°lidos!`);

// Testar exemplos
const testCases = ['camar√£o', 'caf√©', 'arroz', 'macarr√£o'];
console.log('\nÌ∑™ Testando:');
testCases.forEach(term => {
  const found = validFoods.filter(f => f.name.toLowerCase().includes(term));
  if (found.length > 0) {
    console.log(`‚úÖ "${term}": ${found[0].name} (${found[0].icon}) - ${found[0].calories}kcal`);
  } else {
    console.log(`‚ùå "${term}": n√£o encontrado`);
  }
});
