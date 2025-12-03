# Sistema de Logging Condicional

Este sistema fornece uma forma centralizada e controlável de fazer logging na aplicação.

## Características

- ✅ Automaticamente desabilitado em produção
- ✅ Suporta níveis de log (debug, info, warn, error)
- ✅ Prefixos personalizados por componente
- ✅ Timestamps automáticos
- ✅ API familiar (similar ao console.log)

## Uso Básico

### Logger Padrão

```typescript
import { logger } from '../utils/logger';

// Logs de debug (mais verboso)
logger.debug('Estado atualizado:', state);

// Logs informativos
logger.info('Usuário autenticado');

// Avisos
logger.warn('Valor fora do esperado:', value);

// Erros
logger.error('Falha ao carregar dados:', error);
```

### Logger com Prefixo (Recomendado para Componentes)

```typescript
import { createLogger } from '../utils/logger';

// Criar logger específico do componente
const log = createLogger('NutritionContext');

function NutritionProvider() {
  log.debug('Provider inicializado');
  log.info('Alimento adicionado:', foodEntry);
}
```

### Agrupamento de Logs

```typescript
logger.group('Processando dados');
logger.debug('Passo 1:', data1);
logger.debug('Passo 2:', data2);
logger.groupEnd();
```

### Tabelas

```typescript
logger.table(foodEntries);
```

## Configuração

### Desabilitar Completamente

```typescript
import { createLogger } from '../utils/logger';

const log = createLogger('MyComponent', { enabled: false });
```

### Mudar Nível de Log

```typescript
// Apenas avisos e erros
const log = createLogger('MyComponent', { level: 'warn' });
```

## Níveis de Log

1. **debug**: Informações detalhadas para debugging (padrão em dev)
2. **info**: Informações gerais sobre o fluxo da aplicação
3. **warn**: Avisos sobre situações inesperadas mas não críticas
4. **error**: Erros que precisam de atenção

## Comportamento em Produção

Por padrão, **todos os logs são desabilitados em produção** (`import.meta.env.DEV === false`).

## Migração de console.log

### Antes
```typescript
console.log('Dados:', data);
console.warn('Atenção:', warning);
console.error('Erro:', error);
```

### Depois
```typescript
import { createLogger } from '../utils/logger';
const log = createLogger('ComponentName');

log.debug('Dados:', data);
log.warn('Atenção:', warning);
log.error('Erro:', error);
```

## Exemplos de Uso

### Context
```typescript
// src/contexts/NutritionProvider.tsx
import { createLogger } from '../utils/logger';

const log = createLogger('NutritionProvider');

export function NutritionProvider({ children }: NutritionProviderProps) {
  log.debug('Inicializando provider');

  const addFoodEntry = (entry: FoodEntry) => {
    log.info('Adicionando alimento:', entry.name);
    dispatch({ type: 'ADD_FOOD_ENTRY', payload: entry });
  };
}
```

### Hook
```typescript
// src/hooks/useNutritionContext.ts
import { createLogger } from '../utils/logger';

const log = createLogger('useNutritionContext');

export function useNutritionContext() {
  const context = useContext(NutritionContext);

  if (!context) {
    log.error('Hook usado fora do provider');
    throw new Error('useNutritionContext must be used within a NutritionProvider');
  }

  return context;
}
```

### Componente
```typescript
// src/components/AddFoodModal/AddFoodModal.tsx
import { createLogger } from '../../utils/logger';

const log = createLogger('AddFoodModal');

export default function AddFoodModal({ isOpen, meal, onClose }: AddFoodModalProps) {
  const handleConfirmAdd = () => {
    log.debug('Confirmando adição de alimento:', selectedFood?.name);
    addFoodEntry(newEntry);
    log.info('Alimento adicionado com sucesso');
  };
}
```
