# API de Treinos e Nutrição

## Visão Geral

Esta documentação descreve os endpoints da API para **Treinos** e **Nutrição**, que agora são gerenciados através de uma API própria ao invés do IndexedDB local.

## Motivação

Com a Área Profissional, é necessário que profissionais possam visualizar e editar os treinos e dietas dos seus alunos. Como o IndexedDB é local ao navegador, os dados não são compartilhados. A solução é centralizar tudo em uma API.

## Configuração

A mesma variável de ambiente da Área Profissional:

```env
VITE_PROFESSIONAL_API_URL=http://localhost:3000/api/professional
```

A API de treinos e nutrição usa a URL base sem `/professional`:
```
http://localhost:3000/api
```

---

# 🏋️ API de Treinos (Workouts)

## 1. Workout Days (Dias de Treino)

### GET `/workouts/:userId/days`
Listar todos os dias de treino.

**Resposta (200):**
```json
[
  {
    "id": "day-123",
    "name": "Treino A - Peito e Tríceps",
    "exercises": [
      {
        "id": "ex-456",
        "exerciseDefinitionId": "def-789",
        "name": "Supino Reto",
        "plannedSets": 4,
        "plannedReps": 10,
        "plannedWeight": 60,
        "notes": "",
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

### GET `/workouts/:userId/days/:dayId`
Obter um dia específico.

### POST `/workouts/:userId/days`
Criar novo dia de treino.

**Body:**
```json
{
  "name": "Treino B - Costas e Bíceps",
  "exercises": []
}
```

### PATCH `/workouts/:userId/days/:dayId`
Atualizar dia de treino.

**Body:**
```json
{
  "name": "Treino B - Costas e Bíceps (Atualizado)"
}
```

### DELETE `/workouts/:userId/days/:dayId`
Deletar dia de treino.

**Resposta (204):** Sem conteúdo.

---

## 2. Planned Exercises (Exercícios Planejados)

### POST `/workouts/:userId/days/:dayId/exercises`
Adicionar exercício a um dia de treino.

**Body:**
```json
{
  "exerciseDefinitionId": "def-789",
  "name": "Supino Reto",
  "plannedSets": 4,
  "plannedReps": 10,
  "plannedWeight": 60,
  "notes": "",
  "plannedRestTime": 90,
  "autoStartTimer": true,
  "isStrengthTraining": true,
  "useAdvancedMetrics": true,
  "rpe": 8
}
```

### PATCH `/workouts/:userId/days/:dayId/exercises/:exerciseId`
Atualizar exercício planejado.

**Body:**
```json
{
  "plannedWeight": 65,
  "plannedReps": 12
}
```

### DELETE `/workouts/:userId/days/:dayId/exercises/:exerciseId`
Deletar exercício planejado.

---

## 3. Workout Sessions (Sessões de Treino Executadas)

### GET `/workouts/:userId/sessions?startDate=2025-01-01&endDate=2025-01-31`
Listar sessões de treino.

**Query Params:**
- `startDate` (opcional): Data inicial (YYYY-MM-DD)
- `endDate` (opcional): Data final (YYYY-MM-DD)
- `dayId` (opcional): Filtrar por dia de treino

**Resposta (200):**
```json
[
  {
    "id": "session-123",
    "dayId": "day-456",
    "workoutDayId": "day-456",
    "date": "2025-01-15",
    "startTime": "2025-01-15T10:00:00.000Z",
    "endTime": "2025-01-15T11:30:00.000Z",
    "duration": 90,
    "exercises": [...],
    "notes": "Treino excelente!",
    "isStrengthTrainingSession": true
  }
]
```

### GET `/workouts/:userId/sessions/:sessionId`
Obter uma sessão específica.

### POST `/workouts/:userId/sessions`
Criar nova sessão de treino.

**Body:**
```json
{
  "dayId": "day-456",
  "workoutDayId": "day-456",
  "date": "2025-01-15",
  "startTime": "2025-01-15T10:00:00.000Z",
  "exercises": [],
  "notes": "",
  "isStrengthTrainingSession": true
}
```

### PATCH `/workouts/:userId/sessions/:sessionId`
Atualizar sessão de treino.

**Body:**
```json
{
  "endTime": "2025-01-15T11:30:00.000Z",
  "duration": 90,
  "notes": "Treino completo!"
}
```

### DELETE `/workouts/:userId/sessions/:sessionId`
Deletar sessão de treino.

---

## 4. Logged Exercises (Exercícios Executados)

### GET `/workouts/:userId/logged-exercises?startDate=2025-01-01&endDate=2025-01-31`
Listar exercícios executados.

**Query Params:**
- `startDate` (opcional)
- `endDate` (opcional)
- `exerciseDefinitionId` (opcional): Filtrar por exercício específico

**Resposta (200):**
```json
[
  {
    "id": "logged-123",
    "workoutSessionId": "session-456",
    "exerciseDefinitionId": "def-789",
    "exerciseName": "Supino Reto",
    "weight": 60,
    "sets": 4,
    "reps": 10,
    "volume": 2400,
    "date": "2025-01-15",
    "dayId": "day-456",
    "notes": "",
    "rpe": 8,
    "isPersonalRecord": true,
    "completedSets": [
      {
        "setNumber": 1,
        "reps": 10,
        "weight": 60,
        "rpe": 7,
        "notes": "",
        "completedAt": "2025-01-15T10:15:00.000Z",
        "isPersonalRecord": false
      }
    ]
  }
]
```

### POST `/workouts/:userId/logged-exercises`
Registrar exercício executado.

### PATCH `/workouts/:userId/logged-exercises/:exerciseId`
Atualizar exercício executado.

### DELETE `/workouts/:userId/logged-exercises/:exerciseId`
Deletar exercício executado.

---

## 5. Exercise Definitions (Catálogo de Exercícios)

### GET `/exercises/definitions`
Listar todos os exercícios disponíveis.

**Resposta (200):**
```json
[
  {
    "id": "def-123",
    "name": "Supino Reto",
    "primaryMuscleGroup": "chest",
    "secondaryMuscleGroups": ["triceps", "shoulders"],
    "equipment": "barbell",
    "instructions": ["Deite no banco...", "Desça a barra..."],
    "tips": ["Mantenha os pés no chão", "Contraia o peito"],
    "mechanics": "compound",
    "force": "push",
    "level": "beginner"
  }
]
```

### GET `/exercises/definitions/:exerciseId`
Obter um exercício específico.

### POST `/exercises/definitions`
Criar exercício customizado.

### PATCH `/exercises/definitions/:exerciseId`
Atualizar exercício.

### DELETE `/exercises/definitions/:exerciseId`
Deletar exercício customizado.

---

# 🍎 API de Nutrição

## 1. Food Entries (Refeições)

### GET `/nutrition/:userId/food?date=2025-01-15`
Listar refeições.

**Query Params:**
- `date` (opcional): Data específica (YYYY-MM-DD)
- `startDate` (opcional): Data inicial
- `endDate` (opcional): Data final

**Resposta (200):**
```json
[
  {
    "id": "food-123",
    "name": "Frango Grelhado",
    "calories": 165,
    "protein": 31,
    "carbs": 0,
    "fat": 3.6,
    "quantity": 100,
    "meal": "lunch",
    "date": "2025-01-15",
    "time": "12:30",
    "status": "consumed",
    "consumedAt": "2025-01-15T12:35:00.000Z",
    "plannedAt": "2025-01-15T08:00:00.000Z"
  }
]
```

### GET `/nutrition/:userId/food/:entryId`
Obter uma refeição específica.

### POST `/nutrition/:userId/food`
Criar nova refeição.

**Body:**
```json
{
  "name": "Frango Grelhado",
  "calories": 165,
  "protein": 31,
  "carbs": 0,
  "fat": 3.6,
  "quantity": 100,
  "meal": "lunch",
  "date": "2025-01-15",
  "time": "12:30",
  "status": "planned",
  "plannedAt": "2025-01-15T08:00:00.000Z"
}
```

### PATCH `/nutrition/:userId/food/:entryId`
Atualizar refeição.

### DELETE `/nutrition/:userId/food/:entryId`
Deletar refeição.

### POST `/nutrition/:userId/food/:entryId/consume`
Marcar refeição como consumida.

**Resposta (200):** Retorna a refeição atualizada com `status: "consumed"`.

### POST `/nutrition/:userId/food/:entryId/unconsume`
Desmarcar refeição como consumida.

---

## 2. Water Entries (Água)

### GET `/nutrition/:userId/water?date=2025-01-15`
Listar entradas de água.

**Resposta (200):**
```json
[
  {
    "id": "water-123",
    "amount": 500,
    "date": "2025-01-15",
    "time": "08:00",
    "status": "consumed",
    "consumedAt": "2025-01-15T08:05:00.000Z",
    "plannedAt": "2025-01-15T08:00:00.000Z"
  }
]
```

### POST `/nutrition/:userId/water`
Criar entrada de água.

### PATCH `/nutrition/:userId/water/:entryId`
Atualizar entrada de água.

### DELETE `/nutrition/:userId/water/:entryId`
Deletar entrada de água.

### POST `/nutrition/:userId/water/:entryId/consume`
Marcar água como consumida.

### POST `/nutrition/:userId/water/:entryId/unconsume`
Desmarcar água como consumida.

---

## 3. Daily Goals (Metas Diárias)

### GET `/nutrition/:userId/goals`
Obter metas diárias.

**Resposta (200):**
```json
{
  "calories": 2000,
  "protein": 150,
  "carbs": 200,
  "fat": 60,
  "water": 3000
}
```

### PATCH `/nutrition/:userId/goals`
Atualizar metas diárias.

**Body:**
```json
{
  "calories": 2200,
  "protein": 160
}
```

---

## 4. Predefined Foods (Alimentos Pré-definidos)

### GET `/nutrition/foods?category=protein&search=frango`
Listar alimentos pré-definidos.

**Query Params:**
- `category` (opcional): Filtrar por categoria
- `search` (opcional): Buscar por nome

**Resposta (200):**
```json
[
  {
    "id": "food-def-123",
    "name": "Peito de Frango Grelhado",
    "category": "protein",
    "calories": 165,
    "protein": 31,
    "carbs": 0,
    "fat": 3.6,
    "servingSize": 100,
    "unit": "g"
  }
]
```

### POST `/nutrition/foods`
Criar alimento customizado.

### PATCH `/nutrition/foods/:foodId`
Atualizar alimento.

### DELETE `/nutrition/foods/:foodId`
Deletar alimento customizado.

---

## 5. Nutrition Stats (Estatísticas)

### GET `/nutrition/:userId/stats/summary?startDate=2025-01-01&endDate=2025-01-31`
Obter resumo nutricional de um período.

**Resposta (200):**
```json
{
  "totalCalories": 60000,
  "totalProtein": 4500,
  "totalCarbs": 6000,
  "totalFat": 1800,
  "totalWater": 90000,
  "averageCaloriesPerDay": 2000,
  "daysTracked": 30,
  "adherenceRate": 85
}
```

### GET `/nutrition/:userId/stats/daily?date=2025-01-15`
Obter progresso diário.

**Resposta (200):**
```json
{
  "consumed": {
    "calories": 1850,
    "protein": 145,
    "carbs": 180,
    "fat": 55,
    "water": 2800
  },
  "goals": {
    "calories": 2000,
    "protein": 150,
    "carbs": 200,
    "fat": 60,
    "water": 3000
  },
  "progress": {
    "calories": 92.5,
    "protein": 96.7,
    "carbs": 90,
    "fat": 91.7,
    "water": 93.3
  }
}
```

---

## Permissões e Acesso

### Regras de Acesso:

1. **Aluno**: Pode acessar apenas seus próprios dados (`userId` = ID do aluno)
2. **Profissional**: Pode acessar dados dos alunos vinculados
3. **Profissional com acesso `full`**: Pode ler e editar
4. **Profissional com acesso `workout_only`**: Apenas treinos
5. **Profissional com acesso `nutrition_only`**: Apenas nutrição

### Exemplo de Verificação no Backend:

```typescript
// Verificar se o usuário autenticado pode acessar os dados
async function canAccessUserData(
  authenticatedUserId: string,
  targetUserId: string,
  resourceType: 'workout' | 'nutrition'
): Promise<boolean> {
  // Se está acessando seus próprios dados
  if (authenticatedUserId === targetUserId) {
    return true;
  }

  // Verificar se é um profissional com acesso ao aluno
  const link = await db.studentLinks.findFirst({
    where: {
      professionalId: authenticatedUserId,
      studentUserId: targetUserId,
      status: 'active',
    },
  });

  if (!link) {
    return false;
  }

  // Verificar nível de acesso
  if (link.accessLevel === 'full') {
    return true;
  }

  if (link.accessLevel === 'workout_only' && resourceType === 'workout') {
    return true;
  }

  if (link.accessLevel === 'nutrition_only' && resourceType === 'nutrition') {
    return true;
  }

  return false;
}
```

---

## Migração de Dados

Consulte o arquivo [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) para instruções sobre como migrar dados existentes do IndexedDB para a API.

---

## Próximos Passos

1. ✅ Serviços de API criados no frontend
2. ⏳ Implementar backend da API
3. ⏳ Migrar dados existentes do IndexedDB
4. ⏳ Atualizar Contexts (WorkoutContext, NutritionContext) para usar a API
5. ⏳ Testar integração completa
