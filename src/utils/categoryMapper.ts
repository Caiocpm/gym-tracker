// src/utils/categoryMapper.ts (crie um novo arquivo para isso)

import type { FoodCategory } from "../types/nutrition"; // Assumindo que FoodCategory está aqui

export const categoryMapping: Record<string, FoodCategory> = {
  "Cereais e derivados": "cereals",
  "Verduras, hortaliças e derivados": "vegetables",
  "Frutas e derivados": "fruits",
  "Gorduras e óleos": "oils",
  "Pescados e frutos do mar": "protein", // Peixes e frutos do mar são ótimas fontes de proteína
  "Carnes e derivados": "meat", // Carnes são fontes de proteína
  "Leite e derivados": "dairy",
  "Bebidas (alcoólicas e não alcoólicas)": "beverages",
  "Produtos açucarados": "sweets",
  "Leguminosas e derivados": "legumes",
  "Nozes e sementes": "fats", // Nozes e sementes são ricas em gorduras
  "Alimentos preparados": "other", // Alimentos preparados podem ser muito variados
  "Outros alimentos industrializados": "other",
  Miscelâneas: "other",
  // Adicione mais mapeamentos conforme necessário se houver outras categorias no TacoCorreta.txt
};

// Função para obter a categoria mapeada
export function mapTacoCategoryToFoodCategory(
  tacoCategory: string
): FoodCategory {
  const mappedCategory = categoryMapping[tacoCategory];
  if (!mappedCategory) {
    return "other";
  }
  return mappedCategory;
}
