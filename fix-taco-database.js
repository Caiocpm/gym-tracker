const fs = require("fs");

console.log("🔧 Corrigindo database TACO...");

// Ler o arquivo atual
let content = fs.readFileSync("src/data/tacoFoodDatabase.ts", "utf8");

// 1. Corrigir caracteres acentuados
content = content
  .replace(/AÃ§/g, "ç")
  .replace(/Ã¡/g, "á")
  .replace(/Ã©/g, "é")
  .replace(/Ã­/g, "í")
  .replace(/Ã³/g, "ó")
  .replace(/Ãº/g, "ú")
  .replace(/Ã /g, "à")
  .replace(/Ãª/g, "ê")
  .replace(/Ã´/g, "ô")
  .replace(/Ã¢/g, "â")
  .replace(/Ã¼/g, "ü")
  .replace(/Ã§/g, "ç")
  .replace(/Ã±/g, "ñ")
  .replace(/Ã�/g, "Á")
  .replace(/Ã‰/g, "É")
  .replace(/Ã‡/g, "Ç");

// 2. Remover ícones corrompidos e substituir por categoria
content = content.replace(/icon: "­ƒìÜ",/g, 'icon: "🍽️",');

// 3. Remover caracteres de controle e invisíveis
content = content
  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
  .replace(/\uFEFF/g, "")
  .replace(/[\u200B-\u200D\uFEFF]/g, "");

// 4. Salvar com UTF-8
fs.writeFileSync("src/data/tacoFoodDatabase.ts", content, "utf8");

console.log("✅ Database corrigido!");
console.log("📊 Verificando resultado...");

// Verificar se ainda há problemas
const lines = content.split("\n");
const problematicLines = lines.filter(
  (line) => line.includes("­ƒìÜ") || line.includes("AÃ§") || line.includes("Ã¡")
);

if (problematicLines.length > 0) {
  console.log("⚠️  Ainda há problemas em", problematicLines.length, "linhas");
  console.log("Primeiras 3 linhas problemáticas:");
  problematicLines.slice(0, 3).forEach((line) => console.log(line.trim()));
} else {
  console.log("🎉 Todos os problemas foram corrigidos!");
}
