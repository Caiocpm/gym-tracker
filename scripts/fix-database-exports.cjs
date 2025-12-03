const fs = require('fs');

// Corrigir foodDatabase
let foodContent = fs.readFileSync('src/data/foodDatabase.ts', 'utf8');
if (!foodContent.includes('export { foodDatabase }') && !foodContent.includes('export const foodDatabase')) {
  foodContent = foodContent.replace('export default', 'export const foodDatabase =');
  fs.writeFileSync('src/data/foodDatabase.ts', foodContent, 'utf8');
}

// Corrigir tacoFoodDatabase
let tacoContent = fs.readFileSync('src/data/tacoFoodDatabase.ts', 'utf8');
if (!tacoContent.includes('export { tacoFoodDatabase }') && !tacoContent.includes('export const tacoFoodDatabase')) {
  tacoContent = tacoContent.replace('export default', 'export const tacoFoodDatabase =');
  fs.writeFileSync('src/data/tacoFoodDatabase.ts', tacoContent, 'utf8');
}

console.log('✅ Exports dos bancos de dados corrigidos');
