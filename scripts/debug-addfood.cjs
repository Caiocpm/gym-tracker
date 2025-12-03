const fs = require('fs');

let content = fs.readFileSync('src/components/NutritionTracker/AddFoodModal.tsx', 'utf8');

// Adicionar log antes de chamar addFoodEntry
const debugLog = `
    // Ì¥ç DEBUG: Verificar micronutrientes antes de adicionar
    console.log('Ì∑™ Debug AddFoodModal:');
    console.log('ÌΩΩÔ∏è Alimento selecionado:', selectedFood.name);
    console.log('Ì∑¨ Micronutrientes do alimento:', selectedFood.micronutrients);
    console.log('Ì≥ä Quantidade:', quantity);
`;

content = content.replace(
  'addFoodEntry({',
  debugLog + '\n    addFoodEntry({'
);

fs.writeFileSync('src/components/NutritionTracker/AddFoodModal.tsx', content, 'utf8');

console.log('‚úÖ Debug adicionado ao AddFoodModal');
