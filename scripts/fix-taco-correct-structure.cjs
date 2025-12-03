// fix-taco-correct-structure.cjs

const fs = require("fs");

console.log("🔧 Corrigindo TACO com estrutura correta...");

// Ler JSON
const tacoData = JSON.parse(fs.readFileSync("Taco.JSON", "utf8"));

console.log(`📊 Total de itens: ${tacoData.length}`);

// Função de limpeza
function cleanText(text) {
  if (!text) return "";

  return text
    .replace(/├ú/g, "ã")
    .replace(/├á/g, "á")
    .replace(/├®/g, "é")
    .replace(/├¡/g, "í")
    .replace(/├│/g, "ó")
    .replace(/├║/g, "ú")
    .replace(/├á/g, "à")
    .replace(/├¬/g, "ê")
    .replace(/├┤/g, "ô")
    .replace(/├ó/g, "â")
    .replace(/├º/g, "ç")
    .replace(/├Á/g, "Ç")
    .replace(/├ë/g, "õ")
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã /g, "à")
    .replace(/Ãª/g, "ê")
    .replace(/Ã´/g, "ô")
    .replace(/Ã¢/g, "â")
    .replace(/Ã§/g, "ç")
    .replace(/Ã£/g, "ã")
    .replace(/Ãµ/g, "õ")
    .trim();
}

// Mapear categorias para ícones
const categoryIconMap = {
  "Cereais e derivados": "🍚",
  "Verduras, hortaliças e derivados": "🥦",
  "Frutas e derivados": "��",
  "Gorduras e óleos": "🥑",
  "Pescados e frutos do mar": "🐟",
  "Carnes e derivados": "🥩",
  "Leite e derivados": "🥛",
  "Bebidas (alcoólicas e não alcoólicas)": "��",
  "Ovos e derivados": "🥚",
  "Produtos açucarados": "🍭",
  Miscelâneas: "🍽️",
  "Outros alimentos industrializados": "🥫",
  "Alimentos preparados": "🍲",
  "Leguminosas e derivados": "🫘",
  "Nozes e sementes": "��",
};

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

// Processar dados com estrutura correta
const foods = tacoData.map((item, index) => {
  const cleanName = cleanText(item.description || "Alimento sem nome");
  const category = item.category || "Miscelâneas";

  return {
    id: `taco_${index + 1}`,
    name: cleanName,
    category: categoryMap[category] || "snacks",
    calories: Math.round(parseFloat(item.energy_kcal || 0)),
    protein: Math.round(parseFloat(item.protein_g || 0) * 10) / 10,
    carbs: Math.round(parseFloat(item.carbohydrate_g || 0) * 10) / 10,
    fat: Math.round(parseFloat(item.lipid_g || 0) * 10) / 10,
    icon: categoryIconMap[category] || "🍽️",
  };
});

// Gerar arquivo TypeScript
const output = `// Gerado automaticamente da Tabela TACO - Tabela Brasileira de Composição de Alimentos
// Total de alimentos: ${foods.length}

// ✅ ALTERADO: Importa o tipo PredefinedFood e tipa explicitamente o array tacoFoods
import type { PredefinedFood } from '../types/nutrition'; 

export const tacoFoods: PredefinedFood[] = ${JSON.stringify(foods, null, 2)};

export default tacoFoods;
`;

fs.writeFileSync("src/data/tacoFoodDatabase.ts", output, "utf8");

console.log(`✅ Database corrigido com ${foods.length} alimentos!`);

// Testar exemplos
const testCases = ["camarão", "café", "arroz"];
console.log("\n🧪 Testando:");
testCases.forEach((term) => {
  const found = foods.filter((f) => f.name.toLowerCase().includes(term));
  if (found.length > 0) {
    console.log(`✅ "${term}": ${found[0].name} (${found[0].icon})`);
  } else {
    console.log(`❌ "${term}": não encontrado`);
  }
});
