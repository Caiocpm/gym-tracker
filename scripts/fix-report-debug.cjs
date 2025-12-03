const fs = require('fs');

let content = fs.readFileSync('src/components/NutritionTracker/Reports/MicronutrientReport.tsx', 'utf8');

// Adicionar debug no in√≠cio
const debugStart = `
  // Ì¥ç DEBUG: MicronutrientReport renderizado
  console.log('Ì∑™ MicronutrientReport props:', { dailyNutrition });
  console.log('Ì≥ä Entradas recebidas:', dailyNutrition.entries.length);
  console.log('ÌΩΩÔ∏è Entradas detalhadas:', dailyNutrition.entries);
`;

content = content.replace(
  'export default function MicronutrientReport({ dailyNutrition }: MicronutrientReportProps) {',
  `export default function MicronutrientReport({ dailyNutrition }: MicronutrientReportProps) {${debugStart}`
);

fs.writeFileSync('src/components/NutritionTracker/Reports/MicronutrientReport.tsx', content, 'utf8');

console.log('‚úÖ Debug adicionado ao MicronutrientReport');
