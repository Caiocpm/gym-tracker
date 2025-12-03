const fs = require('fs');

let content = fs.readFileSync('src/components/NutritionTracker/NutritionOverview.tsx', 'utf8');

// Remover DailyNutrition não usado dos imports
content = content.replace(
  /import[^{]*{[^}]*DailyNutrition[^}]*}[^;]*;/,
  content.match(/import[^{]*{[^}]*DailyNutrition[^}]*}[^;]*;/)?.[0]?.replace(/,?\s*DailyNutrition\s*,?/, '') || ''
);

// Se o import ficou vazio, remover completamente
content = content.replace(/import[^{]*{\s*}[^;]*;/, '');

fs.writeFileSync('src/components/NutritionTracker/NutritionOverview.tsx', content, 'utf8');

console.log('✅ NutritionOverview imports corrigidos');
