const fs = require('fs');

let content = fs.readFileSync('src/components/NutritionTracker/NutritionOverview.tsx', 'utf8');

// Remover a variável não usada dailyNutritionForReport
content = content.replace(/const dailyNutritionForReport[^;]+;/g, '');

// Corrigir a referência no MicronutrientReport
content = content.replace(
  /entries={dailyNutrition\.entries}/,
  'entries={todayEntries}'
);

fs.writeFileSync('src/components/NutritionTracker/NutritionOverview.tsx', content, 'utf8');

console.log('✅ NutritionOverview corrigido');
