# 🔧 Solução de Problemas - IndexedDB

## ⚠️ Problemas Conhecidos e Soluções

### Problema 1: "Treinos não salvam após IndexedDB"

**Sintoma:** Você adiciona um exercício mas ao recarregar a página ele desaparece.

**Causa:** O WorkoutProvider pode não estar inicializado corretamente.

**Solução:**

1. Abra o Console do navegador (F12)
2. Procure por estas mensagens:
   ```
   ✅ WorkoutProvider inicializado com IndexedDB
   💾 Estado salvo no IndexedDB
   ```

3. Se NÃO aparecerem, execute no console:
   ```javascript
   // Ver se há dados
   db.workoutDays.count().then(c => console.log('Dias de treino:', c));
   db.loggedExercises.count().then(c => console.log('Exercícios:', c));
   ```

4. **Se count = 0**, execute a migração manual:
   - Vá em **⚙️ Config** → **🗄️ IndexedDB**
   - Clique em **🔄 Iniciar Migração**
   - Aguarde a confirmação

5. **Recarregue a página** (F5)

---

### Problema 2: "Configurações não aparecem"

**Sintoma:** Ao clicar em Config, a tela fica em branco.

**Causa:** Erro na inicialização dos Providers.

**Solução:**

1. Abra o Console (F12)
2. Veja se há erros em vermelho
3. Se aparecer erro relacionado a `useProfile` ou `useWorkout`:

   **Execute no console:**
   ```javascript
   // Limpar cache do navegador
   localStorage.clear();
   indexedDB.deleteDatabase('GymTrackerDB');

   // Recarregar
   location.reload();
   ```

4. Após recarregar, vá em:
   - **⚙️ Config** → **🗄️ IndexedDB** → **🔄 Iniciar Migração**

---

### Problema 3: "Dados duplicados"

**Sintoma:** Exercícios/refeições aparecem duplicados.

**Causa:** Migração executada múltiplas vezes.

**Solução:**

1. **Faça backup primeiro:**
   - **⚙️ Config** → **🗄️ IndexedDB** → **📤 Exportar Backup**

2. **Limpe o IndexedDB:**
   ```javascript
   // No console (F12)
   await db.loggedExercises.clear();
   await db.foodEntries.clear();
   await db.waterEntries.clear();
   ```

3. **Reimporte o backup:**
   - **⚙️ Config** → **💾 Backup & Dados** → **📥 Importar Backup**

---

### Problema 4: "QuotaExceededError"

**Sintoma:** Erro no console: `QuotaExceededError: The quota has been exceeded`

**Causa:** IndexedDB está cheio (raro, mas pode acontecer).

**Solução:**

1. **Ver tamanho dos dados:**
   ```javascript
   // No console
   const stats = await getDatabaseStats();
   console.log(stats);
   ```

2. **Limpar dados antigos manualmente:**
   ```javascript
   // Manter apenas últimos 60 dias
   const sixtyDaysAgo = new Date();
   sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
   const cutoff = sixtyDaysAgo.toISOString().split('T')[0];

   await db.loggedExercises.where('date').below(cutoff).delete();
   await db.foodEntries.where('date').below(cutoff).delete();
   await db.waterEntries.where('date').below(cutoff).delete();

   console.log('✅ Dados antigos removidos');
   ```

3. **Fazer backup periódico** (recomendado semanalmente)

---

### Problema 5: "App muito lento"

**Sintoma:** UI trava ao carregar dados.

**Causa:** Muitos dados acumulados.

**Solução:**

1. **Ver quantos registros tem:**
   ```javascript
   const stats = await getDatabaseStats();
   console.log('Total de registros:', stats.totalRecords);
   ```

2. **Se > 10.000 registros**, limpe dados antigos:
   ```javascript
   // Usar hook de limpeza
   const { cleanOldFoodEntries, cleanOldWaterEntries } = useNutritionDB();

   await cleanOldFoodEntries(90); // Manter 90 dias
   await cleanOldWaterEntries(90);
   ```

---

## 🔍 Comandos de Debug

### Ver todos os dados

```javascript
// No console do navegador (F12)

// Ver treinos
db.workoutDays.toArray().then(d => console.table(d));

// Ver exercícios recentes
db.loggedExercises
  .orderBy('date')
  .reverse()
  .limit(10)
  .toArray()
  .then(e => console.table(e));

// Ver refeições recentes
db.foodEntries
  .orderBy('date')
  .reverse()
  .limit(10)
  .toArray()
  .then(f => console.table(f));

// Ver perfil
db.userProfile.toArray().then(p => console.log('Perfil:', p[0]));

// Ver medições
db.bodyMeasurements
  .orderBy('date')
  .reverse()
  .toArray()
  .then(m => console.table(m));
```

### Estatísticas Gerais

```javascript
const stats = await getDatabaseStats();
console.log(`
📊 Estatísticas do Banco:
- Dias de treino: ${stats.workoutDaysCount}
- Sessões: ${stats.workoutSessionsCount}
- Exercícios logados: ${stats.loggedExercisesCount}
- Refeições: ${stats.foodEntriesCount}
- Água: ${stats.waterEntriesCount}
- Medições: ${stats.measurementsCount}
- TOTAL: ${stats.totalRecords}
`);
```

### Forçar Salvamento

```javascript
// Se os dados não estão salvando
// Execute no console para forçar:

// Para treinos
const { state } = useWorkout();
// Dados serão salvos automaticamente após 1 segundo

// Para nutrição
const { state: nutritionState } = useNutritionContext();
// Dados serão salvos automaticamente após 1 segundo
```

---

## 🚨 Reset Completo (Último Recurso)

Se nada funcionar, você pode fazer um reset completo:

### Opção 1: Via Interface

1. **Faça backup primeiro!**
   - **⚙️ Config** → **🗄️ IndexedDB** → **📤 Exportar Backup**

2. **Limpe tudo:**
   - **⚙️ Config** → **💾 Backup & Dados** → **🗑️ Limpar Todos os Dados**
   - Digite "CONFIRMAR"

3. **Reimporte o backup:**
   - **⚙️ Config** → **💾 Backup & Dados** → **📥 Importar Backup**

### Opção 2: Via Console

```javascript
// ⚠️ CUIDADO: Isso apaga TUDO!

// 1. Exportar backup primeiro
const backup = await exportAllData();
console.log('Backup:', JSON.stringify(backup, null, 2));
// COPIE e SALVE em um arquivo .json

// 2. Limpar tudo
await clearAllData();
localStorage.clear();

// 3. Recarregar
location.reload();

// 4. Depois de recarregar, importar backup:
// Config → Backup & Dados → Importar Backup
```

---

## ✅ Verificar se está funcionando

Execute estes testes para confirmar que está tudo OK:

### Teste 1: Adicionar e Verificar

```javascript
// 1. Adicione um exercício pela UI
// 2. Execute no console:
db.loggedExercises.count().then(c => {
  console.log(`Total de exercícios: ${c}`);
  if (c > 0) {
    console.log('✅ Salvamento funcionando!');
  } else {
    console.log('❌ Não está salvando!');
  }
});
```

### Teste 2: Recarregar Página

1. Adicione dados pela UI
2. Pressione **F5** (recarregar)
3. Verifique se os dados continuam lá
4. Se sim: **✅ Persistência funcionando!**
5. Se não: **❌ Ver soluções acima**

### Teste 3: Fechar e Reabrir

1. Adicione dados
2. **Feche o navegador completamente**
3. Abra novamente
4. Vá para a mesma tela
5. Se os dados estiverem lá: **✅ Tudo OK!**

---

## 📞 Suporte

Se nenhuma solução acima funcionar:

1. Abra o console (F12)
2. Tire um **print** dos erros
3. Execute e copie o resultado:
   ```javascript
   console.log('Versão:', navigator.userAgent);
   console.log('IndexedDB disponível?', 'indexedDB' in window);

   const stats = await getDatabaseStats();
   console.log('Stats:', stats);
   ```

4. Verifique os arquivos:
   - `IMPLEMENTACAO_COMPLETA.md` - Documentação completa
   - `INDEXEDDB_GUIDE.md` - Guia detalhado
   - `TESTE_INDEXEDDB.md` - Guia de testes

---

## 🎯 Prevenção de Problemas

Para evitar problemas futuros:

### 1. Backups Regulares

Configure um lembrete semanal:
- **⚙️ Config** → **🗄️ IndexedDB** → **📤 Exportar Backup**
- Salve em Drive/Dropbox/etc

### 2. Monitorar Tamanho

Uma vez por mês, execute:
```javascript
const stats = await getDatabaseStats();
if (stats.totalRecords > 10000) {
  console.warn('⚠️ Muitos dados! Considere limpar dados antigos.');
}
```

### 3. Limpar Dados Antigos

A cada 3 meses, limpe dados > 90 dias:
```javascript
const { cleanOldFoodEntries } = useNutritionDB();
await cleanOldFoodEntries(90);
```

---

**💡 Dica:** Mantenha sempre este arquivo à mão para consultas rápidas!
