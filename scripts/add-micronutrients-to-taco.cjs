const fs = require('fs');

console.log('í·¬ Adicionando micronutrientes ao banco TACO...');

// Ler JSON original
const tacoData = JSON.parse(fs.readFileSync('Taco.JSON', 'utf8'));

console.log(`í³Š Total de itens: ${tacoData.length}`);

// FunÃ§Ã£o para tratar valores nulos/indefinidos
function safeNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '' || value === 'NA' || value === 'Tr') {
    return defaultValue;
  }
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

// FunÃ§Ã£o de limpeza de texto
function cleanText(text) {
  if (!text) return '';
  
  return text
    .replace(/â”œÃº/g, 'Ã£')
    .replace(/â”œÃ¡/g, 'Ã¡') 
    .replace(/â”œÂ®/g, 'Ã©')
    .replace(/â”œÂ¡/g, 'Ã­')
    .replace(/â”œâ”‚/g, 'Ã³')
    .replace(/â”œâ•‘/g, 'Ãº')
    .replace(/â”œÃ¡/g, 'Ã ')
    .replace(/â”œÂ¬/g, 'Ãª')
    .replace(/â”œâ”¤/g, 'Ã´')
    .replace(/â”œÃ³/g, 'Ã¢')
    .replace(/â”œÂº/g, 'Ã§')
    .replace(/â”œÃ/g, 'Ã‡')
    .replace(/â”œÃ«/g, 'Ãµ')
    .replace(/ÃƒÂ¡/g, 'Ã¡')
    .replace(/ÃƒÂ©/g, 'Ã©')
    .replace(/ÃƒÂ­/g, 'Ã­')
    .replace(/ÃƒÂ³/g, 'Ã³')
    .replace(/ÃƒÂº/g, 'Ãº')
    .replace(/Ãƒ /g, 'Ã ')
    .replace(/ÃƒÂª/g, 'Ãª')
    .replace(/ÃƒÂ´/g, 'Ã´')
    .replace(/ÃƒÂ¢/g, 'Ã¢')
    .replace(/ÃƒÂ§/g, 'Ã§')
    .replace(/ÃƒÂ£/g, 'Ã£')
    .replace(/ÃƒÂµ/g, 'Ãµ')
    .trim();
}

// Mapear categorias
const categoryIconMap = {
  'Cereais e derivados': 'í½š',
  'Verduras, hortaliÃ§as e derivados': 'íµ¦', 
  'Frutas e derivados': 'í½Ž',
  'Gorduras e Ã³leos': 'íµ‘',
  'Pescados e frutos do mar': 'í°Ÿ',
  'Carnes e derivados': 'íµ©',
  'Leite e derivados': 'íµ›',
  'Bebidas (alcoÃ³licas e nÃ£o alcoÃ³licas)': 'ï¿½ï¿½',
  'Ovos e derivados': 'íµš',
  'Produtos aÃ§ucarados': 'í½­',
  'MiscelÃ¢neas': 'í½½ï¸',
  'Outros alimentos industrializados': 'íµ«',
  'Alimentos preparados': 'í½²',
  'Leguminosas e derivados': 'í»˜',
  'Nozes e sementes': 'íµœ'
};

const categoryMap = {
  'Cereais e derivados': 'carbs',
  'Verduras, hortaliÃ§as e derivados': 'vegetables', 
  'Frutas e derivados': 'fruits',
  'Gorduras e Ã³leos': 'fats',
  'Pescados e frutos do mar': 'protein',
  'Carnes e derivados': 'protein',
  'Leite e derivados': 'dairy',
  'Bebidas (alcoÃ³licas e nÃ£o alcoÃ³licas)': 'beverages',
  'Ovos e derivados': 'protein',
  'Produtos aÃ§ucarados': 'snacks',
  'MiscelÃ¢neas': 'snacks',
  'Outros alimentos industrializados': 'snacks',
  'Alimentos preparados': 'snacks',
  'Leguminosas e derivados': 'protein',
  'Nozes e sementes': 'fats'
};

// Processar dados com micronutrientes
const foods = tacoData.map((item, index) => {
  const cleanName = cleanText(item.description || 'Alimento sem nome');
  const category = item.category || 'MiscelÃ¢neas';
  
  // âœ… EXTRAIR MICRONUTRIENTES DO TACO
  const micronutrients = {
    // Vitaminas (convertendo para mg quando necessÃ¡rio)
    vitaminA: Math.round(safeNumber(item.retinol_mcg, 0) / 1000 * 100) / 100, // mcg -> mg
    vitaminB1: Math.round(safeNumber(item.thiamine_mg, 0) * 100) / 100,
    vitaminB2: Math.round(safeNumber(item.riboflavin_mg, 0) * 100) / 100,
    vitaminB3: Math.round(safeNumber(item.niacin_mg, 0) * 100) / 100,
    vitaminB6: Math.round(safeNumber(item.pyridoxine_mg, 0) * 100) / 100,
    vitaminB12: Math.round(safeNumber(item.cobalamin_mcg, 0) / 1000 * 100) / 100, // mcg -> mg
    vitaminC: Math.round(safeNumber(item.vitamin_c_mg, 0) * 100) / 100,
    vitaminE: Math.round(safeNumber(item.vitamin_e_mg, 0) * 100) / 100,
    folate: Math.round(safeNumber(item.folate_mcg, 0) / 1000 * 100) / 100, // mcg -> mg
    
    // Minerais
    calcium: Math.round(safeNumber(item.calcium_mg, 0) * 100) / 100,
    iron: Math.round(safeNumber(item.iron_mg, 0) * 100) / 100,
    magnesium: Math.round(safeNumber(item.magnesium_mg, 0) * 100) / 100,
    phosphorus: Math.round(safeNumber(item.phosphorus_mg, 0) * 100) / 100,
    potassium: Math.round(safeNumber(item.potassium_mg, 0) * 100) / 100,
    sodium: Math.round(safeNumber(item.sodium_mg, 0) * 100) / 100,
    zinc: Math.round(safeNumber(item.zinc_mg, 0) * 100) / 100,
    copper: Math.round(safeNumber(item.copper_mg, 0) * 100) / 100,
    manganese: Math.round(safeNumber(item.manganese_mg, 0) * 100) / 100,
    selenium: Math.round(safeNumber(item.selenium_mcg, 0) / 1000 * 100) / 100, // mcg -> mg
    
    // Outros
    fiber: Math.round(safeNumber(item.fiber_g, 0) * 10) / 10,
    cholesterol: Math.round(safeNumber(item.cholesterol_mg, 0) * 100) / 100
  };
  
  return {
    id: `taco_${index + 1}`,
    name: cleanName,
    category: categoryMap[category] || 'snacks',
    calories: Math.round(safeNumber(item.energy_kcal, 0)),
    protein: Math.round(safeNumber(item.protein_g, 0) * 10) / 10,
    carbs: Math.round(safeNumber(item.carbohydrate_g, 0) * 10) / 10,
    fat: Math.round(safeNumber(item.lipid_g, 0) * 10) / 10,
    icon: categoryIconMap[category] || 'í½½ï¸',
    micronutrients: micronutrients  // âœ… ADICIONADO
  };
});

// Filtrar alimentos vÃ¡lidos
const validFoods = foods.filter(food => 
  food.calories > 0 || food.protein > 0 || food.carbs > 0 || food.fat > 0
);

console.log(`âœ… Alimentos vÃ¡lidos: ${validFoods.length} de ${foods.length}`);

// Gerar arquivo TypeScript
const output = `// Gerado automaticamente da Tabela TACO - Tabela Brasileira de ComposiÃ§Ã£o de Alimentos
// Total de alimentos: ${validFoods.length}
// âœ… INCLUI MICRONUTRIENTES

import type { PredefinedFood } from '../types/nutrition'; 

export const tacoFoods: PredefinedFood[] = ${JSON.stringify(validFoods, null, 2)};

export default tacoFoods;
`;

fs.writeFileSync('src/data/tacoFoodDatabase.ts', output, 'utf8');

console.log(`âœ… Database atualizado com micronutrientes!`);

// Testar micronutrientes
const testFood = validFoods.find(f => f.name.toLowerCase().includes('laranja'));
if (testFood && testFood.micronutrients) {
  console.log('\ní·ª Exemplo - Laranja:');
  console.log(`Vitamina C: ${testFood.micronutrients.vitaminC}mg`);
  console.log(`CÃ¡lcio: ${testFood.micronutrients.calcium}mg`);
  console.log(`Fibra: ${testFood.micronutrients.fiber}g`);
}
