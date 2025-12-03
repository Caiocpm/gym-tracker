const fs = require('fs');

console.log('��� Corrigindo todas as chamadas addFoodEntry...');

const filePath = 'src/components/NutritionTracker/AddFoodModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Remover propriedades duplicadas de micronutrients se existirem
content = content.replace(/,\s*micronutrients: [^,}]+,\s*micronutrients: [^,}]+/g, ', micronutrients: selectedFood.micronutrients');

// Primeira correção - alimentos predefinidos
content = content.replace(
  /(addFoodEntry\({\s*name: selectedFood\.name,[\s\S]*?time: new Date\(\)\.toLocaleTimeString\("pt-BR", {[\s\S]*?}\),)\s*(}\);)/,
  `$1
      micronutrients: selectedFood.micronutrients, // ✅ Micronutrientes do alimento
    $2`
);

// Segunda correção - alimentos customizados
content = content.replace(
  /(addFoodEntry\({\s*name: newFood\.name,[\s\S]*?time: new Date\(\)\.toLocaleTimeString\("pt-BR", {[\s\S]*?}\),)\s*(}\);)/,
  `$1
      micronutrients: undefined, // ✅ Alimentos customizados não têm micronutrientes
    $2`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ AddFoodModal corrigido!');
