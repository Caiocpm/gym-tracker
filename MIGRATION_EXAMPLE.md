# 🔄 Exemplo: Migração de Provider para IndexedDB

## Comparação: Antes e Depois

### ❌ ANTES - Com localStorage

```tsx
// ProfileContext.tsx (versão antiga)
export function ProfileProvider({ children }: { children: ReactNode }) {
  // 1. Carregar do localStorage de forma SÍNCRONA
  const loadInitialState = (): ProfileState => {
    const savedData = localStorage.getItem("gym-tracker-profile");
    if (savedData) {
      return JSON.parse(savedData); // ⚠️ Bloqueia a UI!
    }
    return initialState;
  };

  const [state, dispatch] = useReducer(profileReducer, undefined, loadInitialState);

  // 2. Salvar no localStorage a CADA mudança (ineficiente!)
  useEffect(() => {
    localStorage.setItem("gym-tracker-profile", JSON.stringify(state)); // ⚠️ Bloqueia!
  }, [state]);

  const addMeasurement = (data: Omit<BodyMeasurements, "id" | "userId">) => {
    const newMeasurement: BodyMeasurements = {
      ...data,
      id: Date.now().toString(),
      userId: state.profile?.id || "default",
    };
    dispatch({ type: "ADD_MEASUREMENT", payload: newMeasurement });
  };

  // ... resto do código
}
```

---

### ✅ DEPOIS - Com IndexedDB

```tsx
// ProfileProviderIndexedDB.tsx (versão nova)
import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { UserProfile, BodyMeasurements } from '../types/profile';

export function ProfileProvider({ children }: { children: ReactNode }) {
  // 1. Dados REATIVOS - atualizam automaticamente!
  const profile = useLiveQuery(() => db.userProfile.toArray().then(arr => arr[0] || null));
  const measurements = useLiveQuery(() =>
    db.bodyMeasurements
      .orderBy('date')
      .reverse()
      .toArray()
  );

  // 2. Operações ASSÍNCRONAS (não bloqueiam!)
  const updateProfile = async (data: Partial<UserProfile>) => {
    const existingProfile = await db.userProfile.toArray();

    if (existingProfile.length > 0) {
      // Atualizar perfil existente
      await db.userProfile.update(existingProfile[0].id, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Criar novo perfil
      await db.userProfile.add({
        id: 'default',
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as UserProfile);
    }
  };

  const addMeasurement = async (data: Omit<BodyMeasurements, "id" | "userId">) => {
    const newMeasurement: BodyMeasurements = {
      ...data,
      id: Date.now().toString(),
      userId: profile?.id || "default",
    };

    // 3. Adicionar ao IndexedDB
    await db.bodyMeasurements.add(newMeasurement);
    // A UI atualiza AUTOMATICAMENTE via useLiveQuery! 🎉
  };

  const deleteMeasurement = async (id: string) => {
    await db.bodyMeasurements.delete(id);
    // Atualização automática novamente!
  };

  const getLatestMeasurement = (): BodyMeasurements | null => {
    return measurements?.[0] || null;
  };

  const value = {
    state: {
      profile,
      measurements: measurements || [],
      isLoading: profile === undefined || measurements === undefined,
      error: null,
    },
    updateProfile,
    addMeasurement,
    deleteMeasurement,
    getLatestMeasurement,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}
```

---

## 🎯 Principais Diferenças

### 1. **Carregamento de Dados**

**Antes (localStorage):**
```tsx
const loadInitialState = (): ProfileState => {
  const savedData = localStorage.getItem("key");
  return JSON.parse(savedData); // ⚠️ SÍNCRONO - trava a UI!
};
```

**Depois (IndexedDB):**
```tsx
const profile = useLiveQuery(() => db.userProfile.toArray().then(arr => arr[0]));
// ✅ ASSÍNCRONO - não trava a UI
// ✅ Atualiza automaticamente quando os dados mudam!
```

---

### 2. **Salvando Dados**

**Antes (localStorage):**
```tsx
useEffect(() => {
  // Salva a CADA mudança de state
  localStorage.setItem("key", JSON.stringify(state)); // ⚠️ Pode rodar 100x!
}, [state]);
```

**Depois (IndexedDB):**
```tsx
const addMeasurement = async (data) => {
  await db.bodyMeasurements.add(newMeasurement);
  // ✅ Salva apenas quando necessário
  // ✅ Não precisa useEffect para sincronizar!
};
```

---

### 3. **Queries e Filtros**

**Antes (localStorage):**
```tsx
// Precisa carregar TUDO e filtrar manualmente
const measurements = state.measurements.filter(m =>
  m.date > someDate
);
```

**Depois (IndexedDB):**
```tsx
// Busca direto no banco com índices
const recentMeasurements = useLiveQuery(() =>
  db.bodyMeasurements
    .where('date')
    .above('2025-01-01')
    .toArray()
);
// ✅ Muito mais rápido!
```

---

## 🔧 Passo a Passo da Migração

### Etapa 1: Migrar os dados existentes

```tsx
// No App.tsx ou em um componente de inicialização
import { migrateFromLocalStorage, isMigrationCompleted } from './db/migrations';

function App() {
  useEffect(() => {
    const init = async () => {
      const migrated = await isMigrationCompleted();

      if (!migrated) {
        console.log('🔄 Iniciando migração...');
        const result = await migrateFromLocalStorage();

        if (result.success) {
          console.log(`✅ ${result.migratedItems} itens migrados!`);
        }
      }
    };

    init();
  }, []);

  return <YourApp />;
}
```

---

### Etapa 2: Criar novos Providers com IndexedDB

Você pode criar **novos** providers (sem mexer nos antigos ainda):

```tsx
// ProfileProviderIndexedDB.tsx
export function ProfileProviderIndexedDB({ children }) {
  // Código com IndexedDB (mostrado acima)
}
```

---

### Etapa 3: Testar em paralelo

```tsx
// App.tsx - Teste gradual
function App() {
  // Use uma flag para alternar entre os providers
  const useIndexedDB = true; // Mude para true para testar

  return (
    <div>
      {useIndexedDB ? (
        <ProfileProviderIndexedDB>
          {/* Seu app */}
        </ProfileProviderIndexedDB>
      ) : (
        <ProfileProvider>
          {/* Versão antiga */}
        </ProfileProvider>
      )}
    </div>
  );
}
```

---

### Etapa 4: Substituir gradualmente

Quando tudo estiver funcionando:

1. Substitua o provider antigo pelo novo
2. Remova o código do localStorage
3. Limpe o localStorage (opcional)

```tsx
// App.tsx - Versão final
function App() {
  return (
    <ProfileProviderIndexedDB>
      <WorkoutProviderIndexedDB>
        <NutritionProviderIndexedDB>
          {/* Seu app */}
        </NutritionProviderIndexedDB>
      </WorkoutProviderIndexedDB>
    </ProfileProviderIndexedDB>
  );
}
```

---

## 💡 Dicas Importantes

### 1. **Não precisa reescrever tudo de uma vez!**

Você pode migrar um provider por vez:
- Semana 1: Migrar ProfileProvider
- Semana 2: Migrar WorkoutProvider
- Semana 3: Migrar NutritionProvider

### 2. **Use os hooks prontos**

Em vez de usar `db.userProfile.add()` diretamente, use os hooks:

```tsx
// ❌ Não faça assim em componentes
await db.userProfile.add(data);

// ✅ Faça assim
const { updateProfile } = useProfileDB(); // Hook customizado
await updateProfile(data);
```

### 3. **Mantenha compatibilidade temporária**

Durante a transição, você pode ler de ambos:

```tsx
const data = useLiveQuery(() => db.userProfile.toArray());

// Fallback para localStorage se IndexedDB estiver vazio
useEffect(() => {
  if (data?.length === 0) {
    const localData = localStorage.getItem('gym-tracker-profile');
    if (localData) {
      // Migrar para IndexedDB
    }
  }
}, [data]);
```

### 4. **Teste com dados reais**

Antes de lançar em produção:
1. Exporte seus dados atuais (backup!)
2. Migre para IndexedDB
3. Teste todas as funcionalidades
4. Compare os dados exportados

---

## 🐛 Problemas Comuns

### Problema 1: "useLiveQuery retorna undefined"

**Solução**: Adicione um loading state

```tsx
const data = useLiveQuery(() => db.workoutDays.toArray());

if (data === undefined) {
  return <div>Carregando...</div>;
}
```

### Problema 2: "Dados não aparecem após adicionar"

**Solução**: Verifique se está usando `add()` ou `put()`

```tsx
// add() - Falha se o ID já existe
await db.workoutDays.add(newDay);

// put() - Sobrescreve se o ID já existe
await db.workoutDays.put(newDay);
```

### Problema 3: "Como fazer um UPDATE parcial?"

**Solução**: Use `update()`

```tsx
// ❌ Não faça assim (sobrescreve tudo)
await db.userProfile.put({ id: 'default', name: 'João' });

// ✅ Faça assim (atualiza apenas o nome)
await db.userProfile.update('default', { name: 'João' });
```

---

## 📊 Comparação de Performance

### Teste: Carregar 1000 exercícios

**localStorage:**
```
Tempo de parse: ~150ms
Bloqueia a UI: Sim ❌
```

**IndexedDB:**
```
Tempo de query: ~5ms
Bloqueia a UI: Não ✅
```

### Teste: Filtrar exercícios por data

**localStorage:**
```javascript
// Precisa carregar TUDO na memória
const all = JSON.parse(localStorage.getItem('exercises')); // 150ms
const filtered = all.filter(e => e.date === '2025-01-15'); // 10ms
// Total: 160ms
```

**IndexedDB:**
```javascript
// Busca diretamente com índice
const filtered = await db.loggedExercises
  .where('date')
  .equals('2025-01-15')
  .toArray();
// Total: 2ms ⚡
```

---

## ✅ Checklist de Migração

- [ ] Instalar Dexie e dexie-react-hooks
- [ ] Criar estrutura do banco (`database.ts`)
- [ ] Criar hooks customizados (`useWorkoutDB`, etc)
- [ ] Executar migração de dados
- [ ] Testar em paralelo com localStorage
- [ ] Criar novos providers com IndexedDB
- [ ] Testar todas as funcionalidades
- [ ] Fazer backup dos dados
- [ ] Substituir providers antigos
- [ ] Remover código do localStorage
- [ ] Limpar localStorage (opcional)

---

**Pronto!** Agora você sabe como migrar do localStorage para IndexedDB! 🚀
