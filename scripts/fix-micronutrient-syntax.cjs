const fs = require('fs');

let content = fs.readFileSync('src/components/NutritionTracker/Reports/MicronutrientReport.tsx', 'utf8');

// Remover linhas com sintaxe inválida como ".015: 0"
content = content.replace(/\s*\.015:\s*0,?\s*/g, '');
content = content.replace(/\s*vitaminD:\s*0,?\s*/g, '');

// Garantir que não há propriedades inválidas
content = content.replace(/\s*[^a-zA-Z_][^:]*:\s*[^,}]+,?\s*/g, '');

fs.writeFileSync('src/components/NutritionTracker/Reports/MicronutrientReport.tsx', content, 'utf8');

console.log('✅ Sintaxe inválida removida do MicronutrientReport');
