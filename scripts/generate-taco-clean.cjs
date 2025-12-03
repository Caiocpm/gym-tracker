const fs = require("fs");

console.log("🔄 Regenerando database TACO com encoding correto...");

// Ler JSON original
const tacoData = JSON.parse(fs.readFileSync("Taco.JSON", "utf8"));

// Mapear categorias
const categoryMap = {
  "Cereais e derivados": "carbs",
  "Verduras, hortaliças e derivados": "vegetables",
  "Frutas e derivados": "fruits",
  "Gorduras e óleos": "fats",
  "Pescados e frutos do mar": "protein",
  "Carnes e derivados": "protein",
  "Leite e derivados": "dairy",
  "Bebidas (alcoólicas e não alcoólicas)": "beverages",
  "Ovos e derivados": "protein",
  "Produtos açucarados": "snacks",
  Miscelâneas: "snacks",
  "Outros alimentos industrializados": "snacks",
  "Alimentos preparados": "snacks",
  "Leguminosas e derivados": "protein",
  "Nozes e sementes": "fats",
};

// Processar dados
const foods = tacoData.map((item, index) => {
  const food = {
    id: `taco_${index + 1}`,
    name: item.description || "Alimento sem nome",
    category: categoryMap[item.category] || "snacks",
    calories: Math.round(parseFloat(item.attributes?.energy_kcal || 0)),
    protein: Math.round(parseFloat(item.attributes?.protein || 0) * 10) / 10,
    carbs: Math.round(parseFloat(item.attributes?.carbohydrate || 0) * 10) / 10,
    fat: Math.round(parseFloat(item.attributes?.lipid || 0) * 10) / 10,
    icon: "🍽️",
  };

  return food;
});

// Gerar arquivo TypeScript
const output = `// Gerado automaticamente da Tabela TACO - Tabela Brasileira de Composição de Alimentos
// Total de alimentos: ${foods.length}

export const tacoFoods = ${JSON.stringify(foods, null, 2)};
`;

// Salvar com encoding UTF-8 explícito
fs.writeFileSync("src/data/tacoFoodDatabase.ts", output, { encoding: "utf8" });

console.log(`✅ Database regenerado com ${foods.length} alimentos!`);
console.log("🔤 Encoding: UTF-8");
console.log("📊 Valores arredondados corretamente");
