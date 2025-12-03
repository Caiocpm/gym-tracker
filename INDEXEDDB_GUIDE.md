# 🗄️ Guia Completo: IndexedDB no GymTracker

## 📋 Índice

1. [O que é IndexedDB?](#o-que-é-indexeddb)
2. [Por que migrar?](#por-que-migrar)
3. [Estrutura do Banco](#estrutura-do-banco)
4. [Como usar os Hooks](#como-usar-os-hooks)
5. [Migração do localStorage](#migração-do-localstorage)
6. [Exemplos Práticos](#exemplos-práticos)
7. [Perguntas Frequentes](#perguntas-frequentes)

---

## 🎯 O que é IndexedDB?

IndexedDB é um **banco de dados NoSQL** que roda no navegador. Pense nele como um "mini MongoDB" local.

### Comparação: localStorage vs IndexedDB

| Característica | localStorage | IndexedDB |
|----------------|--------------|-----------|
| **Limite de armazenamento** | 5-10 MB | 50 MB - 1 GB+ |
| **Tipo de dados** | Apenas strings | Objetos JavaScript |
| **Operações** | Síncronas (bloqueia UI) | Assíncronas |
| **Busca/Filtros** | ❌ Não suporta | ✅ Índices e queries |
| **Performance** | Trava com dados grandes | Sempre rápido |
| **Transações** | ❌ Não | ✅ Sim (ACID) |

---

## 🚀 Por que migrar?

### Problemas do localStorage atual:

1. **Limite de 5-10MB**: Seu app pode ficar sem espaço rapidamente
2. **Bloqueio da UI**: `JSON.parse()` de dados grandes trava o app
3. **Sem queries**: Precisa carregar TUDO para filtrar dados
4. **Perda fácil de dados**: Um erro no JSON = dados perdidos

### Benefícios do IndexedDB:

1. **Muito mais espaço**: 50MB - 1GB+
2. **Operações assíncronas**: Nunca trava a UI
3. **Busca eficiente**: Índices permitem queries rápidas
4. **Dados reativos**: `useLiveQuery` atualiza automaticamente
5. **Transações ACID**: Garante integridade dos dados

---

## 🏗️ Estrutura do Banco

O banco foi organizado em "Object Stores" (como tabelas em SQL):

```typescript
GymTrackerDB
├── workoutDays           // Dias de treino (A, B, C...)
├── workoutSessions       // Sessões completas de treino
├── loggedExercises       // Exercícios individuais logados
├── exerciseDefinitions   // Definições de exercícios
├── foodEntries          // Entradas de comida
├── waterEntries         // Entradas de água
├── dailyGoals           // Metas diárias
├── userProfile          // Perfil do usuário
├── bodyMeasurements     // Medições corporais
└── appSettings          // Configurações gerais
```

### Índices criados (para busca rápida):

```typescript
// Treinos
loggedExercises: 'id, date, exerciseId, workoutDayId'
//               ↑    ↑     ↑           ↑
//               |    |     |           └─ Buscar por dia de treino
//               |    |     └─ Buscar por tipo de exercício
//               |    └─ Buscar por data
//               └─ ID único (chave primária)

// Nutrição
foodEntries: 'id, date, meal, status'
//            ↑    ↑     ↑     ↑
//            |    |     |     └─ Buscar por status (planejado/consumido)
//            |    |     └─ Buscar por refeição (café, almoço...)
//            |    └─ Buscar por data
//            └─ ID único
```

---

## 🎣 Como usar os Hooks

### 1️⃣ Hook de Treinos (`useWorkoutDB`)

```tsx
import { useWorkoutDB } from '../../db/hooks/useWorkoutDB';

function MeuComponente() {
  const {
    // 📊 Dados reativos (atualizam automaticamente!)
    workoutDays,
    recentExercises,

    // ➕ Operações de escrita
    addWorkoutDay,
    logExercise,

    // 🔍 Queries customizadas
    getExercisesByDate,
    getExerciseHistory,

    // ⏳ Estado de carregamento
    isLoading,
  } = useWorkoutDB();

  // Exemplo: Adicionar um exercício
  const handleLogExercise = async () => {
    const result = await logExercise({
      id: 'ex_123',
      date: '2025-01-15',
      exerciseName: 'Supino',
      sets: 4,
      reps: 10,
      weight: 60,
      // ... outros campos
    });

    if (result.success) {
      alert('Exercício logado!');
    }
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      {/* Os dados atualizam automaticamente quando mudam! */}
      {workoutDays?.map(day => (
        <div key={day.id}>{day.name}</div>
      ))}
    </div>
  );
}
```

### 2️⃣ Hook de Nutrição (`useNutritionDB`)

```tsx
import { useNutritionDB } from '../../db/hooks/useNutritionDB';

function NutritionComponent() {
  const {
    // 📊 Dados reativos
    recentFoodEntries,
    recentWaterEntries,
    currentGoals,

    // ➕ Operações
    addFoodEntry,
    addWaterEntry,
    updateDailyGoals,

    // 🔍 Queries
    getFoodEntriesByDate,
    getDailyTotals,

    isLoading,
  } = useNutritionDB();

  // Exemplo: Adicionar refeição
  const handleAddMeal = async () => {
    await addFoodEntry({
      id: 'food_123',
      date: '2025-01-15',
      meal: 'breakfast',
      name: 'Ovos mexidos',
      calories: 200,
      protein: 15,
      carbs: 2,
      fat: 14,
      status: 'consumed',
      // ... outros campos
    });
  };

  // Exemplo: Ver totais do dia
  const handleViewTotals = async () => {
    const totals = await getDailyTotals('2025-01-15');
    console.log('Totais:', totals);
    // { calories: 1800, protein: 120, carbs: 200, fat: 60, water: 2000 }
  };

  return (
    <div>
      <h3>Refeições recentes: {recentFoodEntries?.length}</h3>
      {/* ... */}
    </div>
  );
}
```

---

## 🔄 Migração do localStorage

### Passo 1: Executar a migração

A migração é **automática** e **segura**. Ela:
- ✅ Copia todos os dados do localStorage para IndexedDB
- ✅ Mantém o localStorage como backup
- ✅ Não perde nenhum dado

```tsx
import { migrateFromLocalStorage } from '../../db/migrations';

// Em um componente ou no App.tsx
useEffect(() => {
  const migrate = async () => {
    const result = await migrateFromLocalStorage();

    if (result.success) {
      console.log(`✅ ${result.migratedItems} itens migrados!`);
    } else {
      console.error('Erros:', result.errors);
    }
  };

  migrate();
}, []);
```

### Passo 2: Verificar status da migração

```tsx
import { getMigrationStatus } from '../../db/migrations';

const status = await getMigrationStatus();

console.log(status);
// {
//   completed: true,
//   migrationDate: "2025-01-15T10:30:00Z",
//   migratedItems: 1234,
//   hasLocalStorageBackup: true
// }
```

### Passo 3: Limpar localStorage (opcional)

**⚠️ IMPORTANTE**: Só faça isso após confirmar que tudo está funcionando!

```tsx
import { clearLocalStorageBackup } from '../../db/migrations';

// Isso pede confirmação do usuário
await clearLocalStorageBackup();
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Buscar exercícios da semana

```tsx
const { getExercisesByDateRange } = useWorkoutDB();

const getWeekExercises = async () => {
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const exercises = await getExercisesByDateRange(
    weekAgo.toISOString().split('T')[0],
    today.toISOString().split('T')[0]
  );

  console.log(`Exercícios da semana: ${exercises.length}`);
};
```

### Exemplo 2: Histórico de progresso de um exercício

```tsx
const { getExerciseHistory } = useWorkoutDB();

const showProgress = async (exerciseId: string) => {
  const history = await getExerciseHistory(exerciseId);

  // Ordenado do mais recente para o mais antigo
  history.forEach(entry => {
    console.log(`${entry.date}: ${entry.weight}kg x ${entry.reps} reps`);
  });
};
```

### Exemplo 3: Calcular macros do mês

```tsx
const { getExercisesByDateRange } = useNutritionDB();

const getMonthlyMacros = async () => {
  const firstDay = new Date(2025, 0, 1); // Janeiro
  const lastDay = new Date(2025, 0, 31);

  const entries = await db.foodEntries
    .where('date')
    .between(
      firstDay.toISOString().split('T')[0],
      lastDay.toISOString().split('T')[0]
    )
    .and(entry => entry.status === 'consumed')
    .toArray();

  const totals = entries.reduce((acc, entry) => ({
    calories: acc.calories + entry.calories,
    protein: acc.protein + entry.protein,
    carbs: acc.carbs + entry.carbs,
    fat: acc.fat + entry.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  console.log('Totais do mês:', totals);
};
```

### Exemplo 4: Adicionar múltiplos exercícios de uma vez

```tsx
const { bulkLogExercises } = useWorkoutDB();

const logWorkoutSession = async () => {
  const exercises = [
    { id: '1', exerciseName: 'Supino', sets: 4, reps: 10, weight: 60, ... },
    { id: '2', exerciseName: 'Agachamento', sets: 4, reps: 12, weight: 80, ... },
    { id: '3', exerciseName: 'Remada', sets: 4, reps: 10, weight: 50, ... },
  ];

  // Muito mais rápido que adicionar um por um!
  await bulkLogExercises(exercises);
};
```

### Exemplo 5: Live Query - Atualização automática

```tsx
function ExerciseList() {
  // Este hook re-renderiza automaticamente quando os dados mudam!
  const { recentExercises } = useWorkoutDB();

  return (
    <div>
      <h3>Últimos exercícios</h3>
      {recentExercises?.map(exercise => (
        <div key={exercise.id}>
          {exercise.exerciseName} - {exercise.weight}kg
        </div>
      ))}

      {/*
        Quando você adicionar um novo exercício em QUALQUER lugar do app,
        esta lista atualiza AUTOMATICAMENTE! 🎉
      */}
    </div>
  );
}
```

---

## ❓ Perguntas Frequentes

### 1. **Vou perder meus dados ao migrar?**

**Não!** A migração:
- Copia os dados para IndexedDB
- Mantém o localStorage intacto como backup
- Só remove o localStorage se você pedir explicitamente

### 2. **Posso voltar para localStorage?**

Sim! O localStorage fica como backup. Se quiser voltar:
1. Remova o código do IndexedDB
2. Os providers antigos voltam a funcionar normalmente

### 3. **IndexedDB funciona offline?**

**Sim!** IndexedDB é 100% local, assim como localStorage.

### 4. **E se o usuário limpar o cache do navegador?**

Os dados do IndexedDB são perdidos (assim como localStorage).
**Solução**: Implemente backup em nuvem (Firebase, Supabase).

### 5. **IndexedDB é mais lento que localStorage?**

**Não!** Na verdade é mais rápido para dados grandes:
- localStorage: `JSON.parse()` trava a UI
- IndexedDB: Operações assíncronas, nunca trava

### 6. **Como faço backup dos dados?**

```tsx
import { exportAllData } from '../../db/database';

const handleBackup = async () => {
  const data = await exportAllData();

  // Salvar como JSON
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'backup.json';
  a.click();
};
```

### 7. **Como restaurar um backup?**

```tsx
import { importAllData } from '../../db/database';

const handleRestore = async (file: File) => {
  const text = await file.text();
  const data = JSON.parse(text);

  await importAllData(data);
  alert('Backup restaurado!');
};
```

### 8. **Posso usar com React Query / SWR?**

Sim! Mas `useLiveQuery` já faz isso automaticamente.

### 9. **Como limpar dados antigos automaticamente?**

```tsx
const { cleanOldFoodEntries } = useNutritionDB();

// Executar uma vez por semana
useEffect(() => {
  const interval = setInterval(() => {
    cleanOldFoodEntries(90); // Manter apenas 90 dias
  }, 7 * 24 * 60 * 60 * 1000); // 1 semana

  return () => clearInterval(interval);
}, []);
```

### 10. **Como debugar o IndexedDB?**

No Chrome DevTools:
1. Abra DevTools (F12)
2. Vá em **Application** → **Storage** → **IndexedDB**
3. Expanda **GymTrackerDB**
4. Veja todas as tabelas e dados!

---

## 🎓 Próximos Passos

1. **Teste a migração** em um ambiente de desenvolvimento
2. **Verifique os dados** no DevTools
3. **Adapte seus Providers** para usar os hooks
4. **Remova o código do localStorage** gradualmente
5. **Implemente backup em nuvem** (opcional)

---

## 📚 Recursos

- [Documentação do Dexie.js](https://dexie.org/)
- [IndexedDB API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [useLiveQuery Hook](https://dexie.org/docs/dexie-react-hooks/useLiveQuery())

---

**Dúvidas?** Abra uma issue ou consulte a documentação do Dexie!
