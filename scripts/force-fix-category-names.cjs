const fs = require('fs');

let content = fs.readFileSync('src/components/NutritionTracker/AddFoodModal.tsx', 'utf8');

// Remover qualquer CATEGORY_NAMES existente
content = content.replace(/const CATEGORY_NAMES[^;]+;/s, '');

// Adicionar o CATEGORY_NAMES completo no início do componente
const completeCategories = `
const CATEGORY_NAMES: Record<FoodCategory, string> = {
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
};
`;

// Encontrar onde inserir (após os imports)
const insertPoint = content.indexOf('interface AddFoodModalProps');
if (insertPoint !== -1) {
  content = content.slice(0, insertPoint) + completeCategories + '\n' + content.slice(insertPoint);
}

fs.writeFileSync('src/components/NutritionTracker/AddFoodModal.tsx', content, 'utf8');

console.log('✅ CATEGORY_NAMES forçadamente corrigido');
