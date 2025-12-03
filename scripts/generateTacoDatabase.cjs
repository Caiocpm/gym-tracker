// generateTacoDatabase.cjs (versão com recipes)

const fs = require("fs");
const path = require("path");

// Mapeamento de categorias (incluindo recipes)
const categoryMapping = {
  "Cereais e derivados": "cereals",
  "Verduras, hortaliças e derivados": "vegetables",
  "Frutas e derivados": "fruits",
  "Gorduras e óleos": "oils",
  "Pescados e frutos do mar": "protein",
  "Carnes e derivados": "meat",
  "Leite e derivados": "dairy",
  "Bebidas (alcoólicas e não alcoólicas)": "beverages",
  "Produtos açucarados": "sweets",
  "Leguminosas e derivados": "legumes",
  "Nozes e sementes": "fats",
  "Alimentos preparados": "recipes", // ✅ Mapeando para recipes
  "Outros alimentos industrializados": "snacks", // ✅ Mantendo snacks
  Miscelâneas: "other",
  "Ovos e derivados": "protein",
};

function mapTacoCategoryToFoodCategory(tacoCategory) {
  const mappedCategory = categoryMapping[tacoCategory];
  if (!mappedCategory) {
    console.warn(
      `Categoria TACO desconhecida: "${tacoCategory}". Mapeando para "other".`
    );
    return "other";
  }
  return mappedCategory;
}

const inputFilePath = path.join(__dirname, "TACO.Json");
const outputFilePath = path.join(
  __dirname,
  "src",
  "data",
  "tacoFoodDatabase.ts"
);

try {
  console.log("📂 Lendo arquivo:", inputFilePath);

  if (!fs.existsSync(inputFilePath)) {
    console.error(
      "❌ Erro: Arquivo TACO.Json não encontrado em:",
      inputFilePath
    );
    process.exit(1);
  }

  const rawData = fs.readFileSync(inputFilePath, "utf8");
  const foods = JSON.parse(rawData);

  console.log(`📊 Processando ${foods.length} alimentos...`);

  const processedFoods = foods.map((food) => {
    const mappedCategory = mapTacoCategoryToFoodCategory(food.category);

    const parseNumber = (value) => {
      if (
        typeof value === "string" &&
        (value.toLowerCase() === "tr" ||
          value.toLowerCase() === "na" ||
          value === "")
      ) {
        return 0;
      }
      return parseFloat(String(value)) || 0;
    };

    return {
      id: `taco_${food.id}`,
      name: food.description,
      category: mappedCategory,
      calories: parseNumber(food.energy_kcal),
      protein: parseNumber(food.protein_g),
      carbs: parseNumber(food.carbohydrate_g),
      fat: parseNumber(food.lipid_g),
      icon: "",
      micronutrients: {
        vitaminA: parseNumber(food.retinol_mcg),
        vitaminB1: parseNumber(food.thiamine_mg),
        vitaminB2: parseNumber(food.riboflavin_mg),
        vitaminB3: parseNumber(food.niacin_mg),
        vitaminB6: parseNumber(food.pyridoxine_mg),
        vitaminB12: 0,
        vitaminC: parseNumber(food.vitaminC_mg),
        vitaminE: 0,
        folate: 0,
        calcium: parseNumber(food.calcium_mg),
        iron: parseNumber(food.iron_mg),
        magnesium: parseNumber(food.magnesium_mg),
        phosphorus: parseNumber(food.phosphorus_mg),
        potassium: parseNumber(food.potassium_mg),
        sodium: parseNumber(food.sodium_mg),
        zinc: parseNumber(food.zinc_mg),
        copper: parseNumber(food.copper_mg),
        manganese: parseNumber(food.manganese_mg),
        selenium: 0,
        fiber: parseNumber(food.fiber_g),
        cholesterol: parseNumber(food.cholesterol_mg),
      },
    };
  });

  console.log("�� Gerando arquivo tacoFoodDatabase.ts...");

  const outputContent = `// src/data/tacoFoodDatabase.ts
// Este arquivo foi gerado automaticamente. NÃO EDITE MANUALMENTE.

import type { PredefinedFood, FoodCategory } from "../types/nutrition";

export const tacoFoods: PredefinedFood[] = ${JSON.stringify(
    processedFoods,
    null,
    2
  )};

export const tacoFoodDatabase = tacoFoods;

// Funções de busca e categorização
export const CATEGORY_NAMES: Record<FoodCategory, string> = {
  carbs: 'Carboidratos',
  protein: 'Proteínas',
  fruits: 'Frutas',
  vegetables: 'Vegetais',
  fats: 'Gorduras',
  dairy: 'Laticínios',
  beverages: 'Bebidas',
  cereals: 'Cereais',
  meat: 'Carnes',
  legumes: 'Leguminosas',
  oils: 'Óleos',
  sweets: 'Doces',
  snacks: 'Lanches',
  recipes: 'Receitas', // ✅ Nova categoria recipes
  other: 'Outros'
};

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

export function addCustomFoodToDatabase(food: PredefinedFood): PredefinedFood {
  tacoFoodDatabase.push(food);
  return food;
}

export default tacoFoodDatabase;
`;

  const outputDir = path.dirname(outputFilePath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFilePath, outputContent, "utf8");
  console.log("✅ tacoFoodDatabase.ts gerado e corrigido com sucesso!");
  console.log(`📁 Arquivo salvo em: ${outputFilePath}`);
  console.log(`�� Total de alimentos processados: ${processedFoods.length}`);
} catch (error) {
  console.error("❌ Erro ao processar TACO.Json:", error.message);
  process.exit(1);
}
