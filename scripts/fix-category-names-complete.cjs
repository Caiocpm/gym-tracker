const fs = require('fs');

let content = fs.readFileSync('src/components/NutritionTracker/AddFoodModal.tsx', 'utf8');

// Encontrar e substituir o CATEGORY_NAMES incompleto
const completeCategories = `const CATEGORY_NAMES: Record<FoodCategory, string> = {
  carbs: 'Carboidratos',
  protein: 'Proteínas',
  fruits: 'Frutas',
  vegetables: 'Vegetais',
  fats: 'Gorduras',
  dairy: 'Laticínios',
  beverages: 'Bebidas',
  snacks: 'Lanches',
  cereals: 'Cereais',
  meat: 'Carnes',
  legumes: 'Leguminosas',
  oils: 'Óleos',
  sweets: 'Doces',
  other: 'Outros'
};`;

// Substituir o CATEGORY_NAMES existente (incompleto)
content = content.replace(/const CATEGORY_NAMES[^}]+}/s, completeCategories);

fs.writeFileSync('src/components/NutritionTracker/AddFoodModal.tsx', content, 'utf8');

console.log('✅ CATEGORY_NAMES completo aplicado');
