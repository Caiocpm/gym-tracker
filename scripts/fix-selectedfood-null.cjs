const fs = require('fs');

console.log('í´§ Corrigindo selectedFood null...');

let content = fs.readFileSync('src/components/NutritionTracker/AddFoodModal.tsx', 'utf8');

// Adicionar verificaÃ§Ã£o de null para selectedFood.micronutrients
content = content.replace(
  /micronutrients: selectedFood\.micronutrients,/g,
  'micronutrients: selectedFood?.micronutrients,'
);

fs.writeFileSync('src/components/NutritionTracker/AddFoodModal.tsx', content, 'utf8');

console.log('âœ… selectedFood null corrigido!');
