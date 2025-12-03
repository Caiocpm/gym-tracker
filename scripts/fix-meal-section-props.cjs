const fs = require('fs');

let content = fs.readFileSync('src/components/NutritionTracker/MealSection.tsx', 'utf8');

// Encontrar e corrigir o uso do AddFoodModal
content = content.replace(
  /<AddFoodModal\s+meal={[^}]+}\s+onClose={[^}]+}\s*\/>/g,
  (match) => {
    return match.replace('/>', ' isOpen={isModalOpen} />');
  }
);

fs.writeFileSync('src/components/NutritionTracker/MealSection.tsx', content, 'utf8');

console.log('✅ MealSection propriedades corrigidas');
