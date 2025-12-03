const fs = require('fs');

let content = fs.readFileSync('src/data/foodDatabase.ts', 'utf8');

// Corrigir imports para type-only
content = content.replace(
  /import { PredefinedFood, FoodCategory } from/,
  'import type { PredefinedFood, FoodCategory } from'
);

// Remover import do tacoFoodDatabase se existir
content = content.replace(/import.*tacoFoodDatabase.*\n?/g, '');

// Garantir que há um export nomeado
if (!content.includes('export const foodDatabase') && !content.includes('export { foodDatabase }')) {
  // Se tem export default, converter para export const
  if (content.includes('export default')) {
    content = content.replace(/export default\s+/, 'export const foodDatabase = ');
  } else {
    // Se não tem export, adicionar no final
    content += '\n\nexport { foodDatabase };';
  }
}

fs.writeFileSync('src/data/foodDatabase.ts', content, 'utf8');

console.log('✅ foodDatabase.ts corrigido');
