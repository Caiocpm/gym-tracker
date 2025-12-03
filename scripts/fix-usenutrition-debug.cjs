const fs = require('fs');

let content = fs.readFileSync('src/hooks/useNutrition.ts', 'utf8');

// Procurar pela fun√ß√£o addFoodEntry e adicionar debug
const originalFunction = `const addFoodEntry = (entry: Omit<FoodEntry, "id">) => {
    dispatch({ type: "ADD_FOOD_ENTRY", payload: entry });
  };`;

const debuggedFunction = `const addFoodEntry = (entry: Omit<FoodEntry, "id">) => {
    // Ì¥ç DEBUG: Verificar entrada sendo adicionada
    console.log('Ì∑™ Debug useNutrition addFoodEntry:');
    console.log('Ì≥ù Entry recebida:', entry);
    console.log('Ì∑¨ Micronutrientes na entry:', entry.micronutrients);
    
    dispatch({ type: "ADD_FOOD_ENTRY", payload: entry });
  };`;

content = content.replace(originalFunction, debuggedFunction);

fs.writeFileSync('src/hooks/useNutrition.ts', content, 'utf8');

console.log('‚úÖ Debug adicionado ao useNutrition');
