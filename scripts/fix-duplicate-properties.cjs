const fs = require('fs');

console.log('��� Removendo propriedades duplicadas...');

let content = fs.readFileSync('src/components/NutritionTracker/AddFoodModal.tsx', 'utf8');

// Remover todas as linhas de micronutrients duplicadas
const lines = content.split('\n');
const newLines = [];
let lastPropertyName = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Detectar propriedades dentro de objetos
  const propertyMatch = line.match(/^\s*(\w+):\s*/);
  
  if (propertyMatch) {
    const currentProperty = propertyMatch[1];
    
    // Se é a mesma propriedade que a anterior, pular
    if (currentProperty === lastPropertyName && 
        (currentProperty === 'micronutrients' || 
         currentProperty === 'date' || 
         currentProperty === 'time')) {
      console.log(`⚠️ Removendo duplicata: ${line.trim()}`);
      continue;
    }
    
    lastPropertyName = currentProperty;
  } else {
    // Reset se não é uma propriedade
    lastPropertyName = '';
  }
  
  newLines.push(line);
}

const newContent = newLines.join('\n');
fs.writeFileSync('src/components/NutritionTracker/AddFoodModal.tsx', newContent, 'utf8');

console.log('✅ Propriedades duplicadas removidas!');
