const fs = require('fs');

console.log('��� Corrigindo chamadas addFoodEntry...');

let content = fs.readFileSync('src/components/NutritionTracker/AddFoodModal.tsx', 'utf8');

// Primeira correção - alimentos predefinidos
const beforeFirst = content;
content = content.replace(
  /(addFoodEntry\({[\s\S]*?time: new Date\(\)\.toLocaleTimeString\("pt-BR", {[\s\S]*?}\),)\s*(}\);)/,
  '$1\n      micronutrients: selectedFood.micronutrients, // ✅ Micronutrientes do alimento\n    $2'
);

if (content !== beforeFirst) {
  console.log('✅ Primeira correção aplicada (alimentos predefinidos)');
} else {
  console.log('⚠️ Primeira correção não aplicada');
}

// Segunda correção - alimentos customizados
const beforeSecond = content;
content = content.replace(
  /(addFoodEntry\({[\s\S]*?name: newFood\.name,[\s\S]*?time: new Date\(\)\.toLocaleTimeString\("pt-BR", {[\s\S]*?}\),)\s*(}\);)/,
  '$1\n      micronutrients: undefined, // ✅ Alimentos customizados não têm micronutrientes\n    $2'
);

if (content !== beforeSecond) {
  console.log('✅ Segunda correção aplicada (alimentos customizados)');
} else {
  console.log('⚠️ Segunda correção não aplicada');
}

fs.writeFileSync('src/components/NutritionTracker/AddFoodModal.tsx', content, 'utf8');
console.log('��� Correções concluídas!');
