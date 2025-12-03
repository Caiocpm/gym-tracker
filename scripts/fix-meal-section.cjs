const fs = require('fs');

let content = fs.readFileSync('src/components/NutritionTracker/MealSection.tsx', 'utf8');

// Corrigir o import do AddFoodModal
content = content.replace(
  /import { AddFoodModal } from ['"]\.\/AddFoodModal['"];?/,
  "import AddFoodModal from './AddFoodModal';"
);

fs.writeFileSync('src/components/NutritionTracker/MealSection.tsx', content, 'utf8');

console.log('✅ MealSection import corrigido');
