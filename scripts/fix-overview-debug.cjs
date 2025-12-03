const fs = require('fs');

let content = fs.readFileSync('src/components/NutritionTracker/NutritionOverview.tsx', 'utf8');

// Adicionar debug no in√≠cio da fun√ß√£o
const debugStart = `
  // Ì¥ç DEBUG: NutritionOverview renderizado
  console.log('Ì∑™ NutritionOverview renderizado!');
  console.log('Ì≥ä State completo:', state);
  console.log('Ì≥Ö Data selecionada:', state.selectedDate);
`;

content = content.replace(
  'export default function NutritionOverview() {',
  `export default function NutritionOverview() {${debugStart}`
);

fs.writeFileSync('src/components/NutritionTracker/NutritionOverview.tsx', content, 'utf8');

console.log('‚úÖ Debug adicionado ao NutritionOverview');
