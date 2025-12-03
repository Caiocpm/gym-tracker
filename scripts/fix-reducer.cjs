const fs = require('fs');

let content = fs.readFileSync('src/hooks/useNutrition.ts', 'utf8');

// Adicionar debug mais agressivo no in√≠cio do reducer
const reducerDebug = `function nutritionReducer(state: NutritionState, action: NutritionAction): NutritionState {
  // Ì¥ç DEBUG: Reducer chamado
  console.log('Ì∫® REDUCER CHAMADO!');
  console.log('Ì≥ù Action:', action);
  console.log('Ì≥ä State atual:', state);
  
  switch (action.type) {`;

content = content.replace(
  /function nutritionReducer\(state: NutritionState, action: NutritionAction\): NutritionState {\s*switch \(action\.type\) {/,
  reducerDebug
);

fs.writeFileSync('src/hooks/useNutrition.ts', content, 'utf8');

console.log('‚úÖ Debug agressivo adicionado ao reducer');
