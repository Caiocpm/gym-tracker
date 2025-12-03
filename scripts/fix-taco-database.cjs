const fs = require('fs');

let content = fs.readFileSync('src/data/tacoFoodDatabase.ts', 'utf8');

// Corrigir imports para type-only se existir
content = content.replace(
  /import { PredefinedFood } from/,
  'import type { PredefinedFood } from'
);

// Garantir que há um export nomeado
if (!content.includes('export const tacoFoodDatabase') && !content.includes('export { tacoFoodDatabase }')) {
  // Se tem export default, converter para export const
  if (content.includes('export default')) {
    content = content.replace(/export default\s+/, 'export const tacoFoodDatabase = ');
  } else {
    // Se não tem export, adicionar no final
    content += '\n\nexport { tacoFoodDatabase };';
  }
}

fs.writeFileSync('src/data/tacoFoodDatabase.ts', content, 'utf8');

console.log('✅ tacoFoodDatabase.ts corrigido');
