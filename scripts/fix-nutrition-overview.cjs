const fs = require('fs');

let content = fs.readFileSync('src/components/NutritionTracker/NutritionOverview.tsx', 'utf8');

// Corrigir a propriedade do MicronutrientReport
content = content.replace(
  /dailyNutrition={[^}]+}/,
  'entries={dailyNutrition.entries}'
);

fs.writeFileSync('src/components/NutritionTracker/NutritionOverview.tsx', content, 'utf8');

console.log('✅ Propriedade do MicronutrientReport corrigida');
