# Guia de Migração: IndexedDB → API

## Visão Geral

Este guia explica como migrar dados de treinos e nutrição do **IndexedDB local** para a **API centralizada**.

## Por que migrar?

### Problema Atual (IndexedDB):
- ❌ Dados salvos localmente no navegador de cada usuário
- ❌ Profissional não consegue visualizar/editar dados do aluno
- ❌ Aluno perde dados ao trocar de dispositivo/navegador
- ❌ Sem backup na nuvem

### Solução (API):
- ✅ Dados centralizados no servidor
- ✅ Profissional pode editar treinos/dieta do aluno
- ✅ Acesso de qualquer dispositivo
- ✅ Backup automático
- ✅ Sincronização em tempo real

---

## Estratégia de Migração

Recomendamos uma migração **gradual** para minimizar interrupções:

### Opção 1: Modo Híbrido (Recomendado)

Usar IndexedDB como cache local + API como fonte de verdade.

**Fluxo:**
1. App tenta carregar dados da API
2. Se falhar (offline), usa IndexedDB
3. Quando voltar online, sincroniza com a API

**Vantagens:**
- ✅ App funciona offline
- ✅ Migração suave
- ✅ Dados sempre sincronizados

### Opção 2: Migração Completa

Migrar todos os dados de uma vez e desabilitar IndexedDB.

**Vantagens:**
- ✅ Arquitetura mais simples
- ✅ Sem duplicação de lógica

**Desvantagens:**
- ⚠️ Requer conexão constante
- ⚠️ Migração mais complexa

---

## Passo a Passo: Implementar Modo Híbrido

### 1. Criar Utilitário de Migração

Crie um arquivo `src/utils/dataMigration.ts`:

```typescript
// src/utils/dataMigration.ts
import { db as indexedDB } from '../db/database';
import { workoutsApi } from '../services/workoutsApi';
import { nutritionApi } from '../services/nutritionApi';

export async function migrateUserData(userId: string) {
  console.log('🚀 Iniciando migração de dados...');

  try {
    // 1. Migrar Workout Days
    await migrateWorkoutDays(userId);

    // 2. Migrar Workout Sessions
    await migrateWorkoutSessions(userId);

    // 3. Migrar Logged Exercises
    await migrateLoggedExercises(userId);

    // 4. Migrar Food Entries
    await migrateFoodEntries(userId);

    // 5. Migrar Water Entries
    await migrateWaterEntries(userId);

    // 6. Migrar Daily Goals
    await migrateDailyGoals(userId);

    console.log('✅ Migração concluída com sucesso!');
    return { success: true };
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    return { success: false, error };
  }
}

async function migrateWorkoutDays(userId: string) {
  console.log('📦 Migrando dias de treino...');
  const localDays = await indexedDB.workoutDays.toArray();

  for (const day of localDays) {
    try {
      await workoutsApi.days.create(userId, {
        name: day.name,
        exercises: day.exercises,
      });
      console.log(`✓ Dia "${day.name}" migrado`);
    } catch (error) {
      console.error(`✗ Erro ao migrar dia "${day.name}":`, error);
    }
  }
}

async function migrateWorkoutSessions(userId: string) {
  console.log('📦 Migrando sessões de treino...');
  const localSessions = await indexedDB.workoutSessions.toArray();

  for (const session of localSessions) {
    try {
      const { id, ...sessionData } = session;
      await workoutsApi.sessions.create(userId, sessionData);
      console.log(`✓ Sessão de ${session.date} migrada`);
    } catch (error) {
      console.error(`✗ Erro ao migrar sessão de ${session.date}:`, error);
    }
  }
}

async function migrateLoggedExercises(userId: string) {
  console.log('📦 Migrando exercícios executados...');
  const localExercises = await indexedDB.loggedExercises.toArray();

  for (const exercise of localExercises) {
    try {
      const { id, ...exerciseData } = exercise;
      await workoutsApi.logged.create(userId, exerciseData);
      console.log(`✓ Exercício "${exercise.exerciseName}" migrado`);
    } catch (error) {
      console.error(`✗ Erro ao migrar exercício "${exercise.exerciseName}":`, error);
    }
  }
}

async function migrateFoodEntries(userId: string) {
  console.log('📦 Migrando refeições...');
  const localFoods = await indexedDB.foodEntries.toArray();

  for (const food of localFoods) {
    try {
      const { id, ...foodData } = food;
      await nutritionApi.food.create(userId, foodData);
      console.log(`✓ Refeição "${food.name}" migrada`);
    } catch (error) {
      console.error(`✗ Erro ao migrar refeição "${food.name}":`, error);
    }
  }
}

async function migrateWaterEntries(userId: string) {
  console.log('📦 Migrando entradas de água...');
  const localWater = await indexedDB.waterEntries.toArray();

  for (const water of localWater) {
    try {
      const { id, ...waterData } = water;
      await nutritionApi.water.create(userId, waterData);
      console.log(`✓ Água de ${water.date} migrada`);
    } catch (error) {
      console.error(`✗ Erro ao migrar água de ${water.date}:`, error);
    }
  }
}

async function migrateDailyGoals(userId: string) {
  console.log('📦 Migrando metas diárias...');
  // Assumindo que você tem as metas salvas em algum lugar
  // Ajuste conforme sua implementação
  const goals = {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 60,
    water: 3000,
  };

  try {
    await nutritionApi.goals.update(userId, goals);
    console.log('✓ Metas diárias migradas');
  } catch (error) {
    console.error('✗ Erro ao migrar metas:', error);
  }
}
```

### 2. Adicionar Botão de Migração na UI

Adicione um botão nas configurações do app:

```typescript
// src/components/Settings/Settings.tsx
import { migrateUserData } from '../../utils/dataMigration';
import { useAuth } from '../../contexts/AuthContext';

function Settings() {
  const { currentUser } = useAuth();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);

  const handleMigration = async () => {
    if (!currentUser) return;

    if (!confirm('Deseja migrar seus dados para a nuvem? Esta ação não pode ser desfeita.')) {
      return;
    }

    setIsMigrating(true);
    const result = await migrateUserData(currentUser.uid);
    setMigrationResult(result);
    setIsMigrating(false);
  };

  return (
    <div>
      <h2>Migração de Dados</h2>
      <p>Migre seus dados locais para a nuvem para acessá-los de qualquer dispositivo.</p>

      <button onClick={handleMigration} disabled={isMigrating}>
        {isMigrating ? 'Migrando...' : 'Migrar Dados para a Nuvem'}
      </button>

      {migrationResult && (
        <div>
          {migrationResult.success ? (
            <p>✅ Migração concluída com sucesso!</p>
          ) : (
            <p>❌ Erro na migração: {migrationResult.error?.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

### 3. Atualizar Contexts para Modo Híbrido

Exemplo: `WorkoutContext.tsx`

```typescript
// Antes (IndexedDB apenas):
const loadWorkoutDays = async () => {
  const days = await indexedDB.workoutDays.toArray();
  setWorkoutDays(days);
};

// Depois (API primeiro, IndexedDB como fallback):
const loadWorkoutDays = async () => {
  try {
    // Tentar carregar da API
    const days = await workoutsApi.days.list(currentUser.uid);

    // Salvar no IndexedDB como cache
    await Promise.all(days.map(day => indexedDB.workoutDays.put(day)));

    setWorkoutDays(days);
  } catch (error) {
    console.error('Erro ao carregar da API, usando cache local:', error);

    // Fallback: carregar do IndexedDB
    const localDays = await indexedDB.workoutDays.toArray();
    setWorkoutDays(localDays);
  }
};
```

### 4. Sincronização Automática

Adicione um hook para sincronizar quando o app ficar online:

```typescript
// src/hooks/useDataSync.ts
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useDataSync() {
  const { currentUser } = useAuth();

  useEffect(() => {
    const handleOnline = async () => {
      if (!currentUser) return;

      console.log('🌐 App voltou online, sincronizando dados...');

      // Sincronizar dados pendentes
      await syncPendingChanges(currentUser.uid);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [currentUser]);
}

async function syncPendingChanges(userId: string) {
  // Implementar lógica de sincronização
  // 1. Verificar se há mudanças locais não sincronizadas
  // 2. Enviar para a API
  // 3. Atualizar cache local
}
```

---

## Checklist de Migração

### Antes de Migrar:
- [ ] Backend da API implementado e funcionando
- [ ] Testes da API realizados
- [ ] Backup dos dados do IndexedDB criado

### Durante a Migração:
- [ ] Informar usuários sobre a migração
- [ ] Implementar barra de progresso
- [ ] Log de erros para debug

### Depois da Migração:
- [ ] Verificar se todos os dados foram migrados
- [ ] Testar funcionalidades principais
- [ ] Manter IndexedDB como cache por 30 dias
- [ ] Após 30 dias, pode limpar IndexedDB

---

## Tratamento de Erros

### Erros Comuns:

#### 1. Duplicação de Dados
```typescript
// Solução: Verificar se o dado já existe antes de criar
async function migrateWorkoutDay(userId: string, day: WorkoutDay) {
  try {
    // Tentar buscar primeiro
    const existing = await workoutsApi.days.get(userId, day.id);
    if (existing) {
      console.log('Dia já migrado, pulando...');
      return;
    }
  } catch {
    // Se não encontrou, criar
    await workoutsApi.days.create(userId, day);
  }
}
```

#### 2. Conexão Perdida Durante Migração
```typescript
// Solução: Salvar progresso e permitir retomar
let migrationProgress = {
  workoutDays: false,
  workoutSessions: false,
  loggedExercises: false,
  foodEntries: false,
  waterEntries: false,
  dailyGoals: false,
};

// Salvar no localStorage
localStorage.setItem('migrationProgress', JSON.stringify(migrationProgress));
```

#### 3. Dados Corrompidos
```typescript
// Solução: Validar dados antes de migrar
function validateWorkoutDay(day: WorkoutDay): boolean {
  if (!day.id || !day.name) {
    console.error('Dia de treino inválido:', day);
    return false;
  }
  return true;
}
```

---

## Monitoramento

### Adicionar Analytics:

```typescript
// src/utils/analytics.ts
export function trackMigration(event: string, data?: any) {
  console.log(`[Analytics] Migration: ${event}`, data);

  // Integrar com seu sistema de analytics
  // Ex: Google Analytics, Mixpanel, etc.
}

// Uso:
trackMigration('migration_started', { userId });
trackMigration('migration_completed', { userId, duration: '5min' });
trackMigration('migration_error', { userId, error: error.message });
```

---

## Rollback

Se algo der errado, você pode reverter:

```typescript
async function rollbackMigration(userId: string) {
  console.log('⏪ Revertendo migração...');

  // 1. Deletar dados da API
  // 2. Manter dados do IndexedDB
  // 3. Notificar usuário

  console.log('✅ Rollback concluído');
}
```

---

## FAQ

### 1. Os dados antigos serão perdidos?
Não. Durante a migração, mantenha os dados no IndexedDB como backup por pelo menos 30 dias.

### 2. Preciso estar online para migrar?
Sim, a migração requer conexão com internet pois envia os dados para a API.

### 3. Quanto tempo leva a migração?
Depende da quantidade de dados. Geralmente entre 1-5 minutos.

### 4. Posso usar o app durante a migração?
Recomendamos não usar o app durante a migração para evitar inconsistências.

### 5. E se eu usar múltiplos dispositivos?
Após migrar de um dispositivo, os outros sincronizarão automaticamente ao conectar na API.

---

## Suporte

Se encontrar problemas durante a migração:

1. Verifique os logs do console
2. Verifique se a API está acessível
3. Confira se o token de autenticação é válido
4. Consulte a documentação da API: [WORKOUTS_NUTRITION_API.md](WORKOUTS_NUTRITION_API.md)

---

## Próximos Passos

Após a migração:

1. ✅ Dados na nuvem
2. ✅ Acesso de qualquer dispositivo
3. ✅ Profissional pode editar dados do aluno
4. ✅ Backup automático
5. 🎉 Sistema totalmente funcional!
