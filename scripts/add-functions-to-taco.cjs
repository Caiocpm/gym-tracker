const fs = require('fs');

let content = fs.readFileSync('src/data/tacoFoodDatabase.ts', 'utf8');

// Verificar se já tem as funções
if (!content.includes('export function searchFoods')) {
  
  // Adicionar as funções e CATEGORY_NAMES no final do arquivo
  const functionsToAdd = `

// Nomes das categorias
export const CATEGORY_NAMES: Record<FoodCategory, string> = {
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

// Funções de busca e filtro
export function searchFoods(term: string): PredefinedFood[] {
  if (!term.trim()) {
    return tacoFoodDatabase;
  }
  
  const searchTerm = term.toLowerCase();
  return tacoFoodDatabase.filter(food =>
    food.name.toLowerCase().includes(searchTerm)
  );
}

export function getFoodsByCategory(category: FoodCategory): PredefinedFood[] {
  return tacoFoodDatabase.filter(food => food.category === category);
}

// Função para adicionar alimento customizado
export function addCustomFoodToDatabase(food: PredefinedFood): PredefinedFood {
  tacoFoodDatabase.push(food);
  return food;
}`;

  // Adicionar antes do export default
  if (content.includes('export default tacoFoodDatabase')) {
    content = content.replace('export default tacoFoodDatabase', functionsToAdd + '\n\nexport default tacoFoodDatabase');
  } else {
    // Se não tem export default, adicionar no final
    content += functionsToAdd + '\n\nexport default tacoFoodDatabase;';
  }

  fs.writeFileSync('src/data/tacoFoodDatabase.ts', content, 'utf8');
  
  console.log('✅ Funções adicionadas ao tacoFoodDatabase SEM perder os dados!');
  
  // Contar alimentos após a modificação
  const newContent = fs.readFileSync('src/data/tacoFoodDatabase.ts', 'utf8');
  const foodCount = (newContent.match(/id:/g) || []).length;
  console.log(`��� Total de alimentos mantidos: ${foodCount}`);
  
} else {
  console.log('✅ Funções já existem no arquivo!');
  
  // Contar alimentos
  const foodCount = (content.match(/id:/g) || []).length;
  console.log(`��� Total de alimentos: ${foodCount}`);
}
