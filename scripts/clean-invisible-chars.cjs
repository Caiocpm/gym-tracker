const fs = require('fs');

console.log('��� Limpando caracteres invisíveis...');

// Ler arquivo
let content = fs.readFileSync('src/data/tacoFoodDatabase.ts', 'utf8');

console.log(`��� Tamanho original: ${content.length} caracteres`);

// Função para limpar caracteres invisíveis e de controle
function deepClean(text) {
  return text
    // Remover caracteres de controle (exceto \n, \r, \t)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    
    // Remover Zero Width characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    
    // Remover caracteres de direção de texto
    .replace(/[\u202A-\u202E]/g, '')
    
    // Remover marcadores de byte order
    .replace(/\uFEFF/g, '')
    
    // Remover espaços não-quebráveis problemáticos
    .replace(/\u00A0/g, ' ')
    
    // Remover caracteres de substituição
    .replace(/\uFFFD/g, '')
    
    // Normalizar quebras de linha
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    
    // Remover espaços extras no final das linhas
    .replace(/[ \t]+$/gm, '')
    
    // Normalizar espaços múltiplos
    .replace(/[ \t]+/g, ' ');
}

// Limpar conteúdo
const cleanContent = deepClean(content);

console.log(`��� Tamanho após limpeza: ${cleanContent.length} caracteres`);
console.log(`���️ Removidos: ${content.length - cleanContent.length} caracteres`);

// Salvar arquivo limpo
fs.writeFileSync('src/data/tacoFoodDatabase.ts', cleanContent, 'utf8');

console.log('✅ Arquivo limpo salvo!');

// Verificar se ainda há caracteres problemáticos
const problematicChars = cleanContent.match(/[^\x20-\x7E\n\t\u00A1-\uFFFF]/g);
if (problematicChars) {
  console.log('⚠️ Ainda há caracteres suspeitos:', [...new Set(problematicChars)]);
} else {
  console.log('✅ Nenhum caractere problemático encontrado!');
}
