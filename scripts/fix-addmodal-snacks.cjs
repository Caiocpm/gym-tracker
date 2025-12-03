const fs = require('fs');

let content = fs.readFileSync('src/components/NutritionTracker/AddFoodModal.tsx', 'utf8');

// Substituir CATEGORY_NAMES com snacks incluído
const validCategoryNames = `const CATEGORY_NAMES: Record<FoodCategory, string> = {
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

// Substituir qualquer CATEGORY_NAMES existente
content = content.replace(/const CATEGORY_NAMES[^}]+}/s, validCategoryNames);

fs.writeFileSync('src/components/NutritionTracker/AddFoodModal.tsx', content, 'utf8');

console.log('✅ snacks adicionado ao CATEGORY_NAMES');
