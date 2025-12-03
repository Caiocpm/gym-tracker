const fs = require('fs');

let content = fs.readFileSync('src/components/NutritionTracker/Reports/MicronutrientReport.tsx', 'utf8');

// Remover vitaminD que não existe no tipo Micronutrients
content = content.replace(/vitaminD: 0,?\s*/g, '');

fs.writeFileSync('src/components/NutritionTracker/Reports/MicronutrientReport.tsx', content, 'utf8');

console.log('✅ vitaminD removido do MicronutrientReport');
