# API da Área Profissional

## Visão Geral

Este documento descreve a API necessária para suportar a Área Profissional do Gym Tracker.

**O Firebase foi completamente removido da Área Profissional**. Agora todas as operações são realizadas através de uma API REST própria.

## Configuração

### Variável de Ambiente

Adicione ao seu arquivo `.env`:

```env
VITE_PROFESSIONAL_API_URL=https://api.seudominio.com/api/professional
```

Para desenvolvimento local:
```env
VITE_PROFESSIONAL_API_URL=http://localhost:3000/api/professional
```

### Autenticação

Todas as requisições incluem um header de autorização:
```
Authorization: Bearer <token>
```

O token é obtido do `localStorage.getItem('authToken')`. Adapte conforme seu sistema de autenticação.

---

## Endpoints da API

### 1. Perfil Profissional

#### GET `/profile/:userId`
Obter perfil profissional.

**Resposta de Sucesso (200):**
```json
{
  "id": "prof-123",
  "userId": "user-456",
  "email": "prof@example.com",
  "displayName": "João Silva",
  "professionalType": "personal_trainer",
  "specialties": ["hipertrofia", "emagrecimento"],
  "cref": "123456/SP/P",
  "phone": "+5511999999999",
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

#### POST `/profile`
Registrar novo profissional.

**Body:**
```json
{
  "email": "prof@example.com",
  "password": "senha123",
  "displayName": "João Silva",
  "professionalType": "personal_trainer",
  "specialties": ["hipertrofia", "emagrecimento"],
  "cref": "123456/SP/P",
  "phone": "+5511999999999"
}
```

**Resposta de Sucesso (201):** Retorna o perfil criado.

#### PATCH `/profile/:userId`
Atualizar perfil profissional.

**Body:**
```json
{
  "displayName": "João Silva Jr.",
  "phone": "+5511988888888"
}
```

**Resposta de Sucesso (200):** Retorna o perfil atualizado.

---

### 2. Alunos Vinculados (Student Links)

#### GET `/students?professionalId=<id>`
Listar todos os alunos vinculados.

**Query Params:**
- `professionalId` (obrigatório): ID do profissional

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "link-123",
    "professionalId": "prof-123",
    "studentUserId": "student-456",
    "studentEmail": "aluno@example.com",
    "studentName": "Maria Santos",
    "accessLevel": "full",
    "status": "active",
    "tags": ["hipertrofia", "iniciante"],
    "linkedAt": "2025-01-01T00:00:00.000Z",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

#### GET `/students/:linkId`
Obter um link específico.

**Resposta de Sucesso (200):** Retorna o link.

#### PATCH `/students/:linkId`
Atualizar link de aluno.

**Body:**
```json
{
  "accessLevel": "workout_only",
  "status": "inactive"
}
```

**Resposta de Sucesso (200):** Retorna o link atualizado.

#### DELETE `/students/:linkId`
Desvincular aluno.

**Resposta de Sucesso (204):** Sem conteúdo.

---

### 3. Convites (Invitations)

#### GET `/invitations?professionalId=<id>&status=pending`
Listar convites pendentes.

**Query Params:**
- `professionalId` (obrigatório): ID do profissional
- `status` (opcional): Filtrar por status (pending, accepted, rejected, expired)

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "inv-123",
    "professionalId": "prof-123",
    "professionalName": "João Silva",
    "professionalEmail": "prof@example.com",
    "studentEmail": "aluno@example.com",
    "invitationCode": "INV-1234567890-abc123",
    "accessLevel": "full",
    "status": "pending",
    "message": "Gostaria de acompanhar seu progresso!",
    "sentAt": "2025-01-01T00:00:00.000Z",
    "expiresAt": "2025-01-08T00:00:00.000Z"
  }
]
```

#### POST `/invitations`
Criar novo convite.

**Body:**
```json
{
  "professionalId": "prof-123",
  "studentEmail": "aluno@example.com",
  "accessLevel": "full",
  "message": "Gostaria de acompanhar seu progresso!"
}
```

**Resposta de Sucesso (201):** Retorna o convite criado.

#### POST `/invitations/:invitationCode/accept`
Aceitar convite (chamado pelo aluno).

**Body:**
```json
{
  "studentUserId": "student-456"
}
```

**Resposta de Sucesso (201):** Retorna o StudentLink criado.

#### POST `/invitations/:invitationId/reject`
Rejeitar convite.

**Resposta de Sucesso (200):** Convite marcado como rejeitado.

---

### 4. Tags

#### GET `/tags?professionalId=<id>`
Listar todas as tags.

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "tag-123",
    "professionalId": "prof-123",
    "name": "Hipertrofia",
    "color": "#45B7D1",
    "description": "Alunos focados em ganho de massa muscular",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

#### POST `/tags`
Criar nova tag.

**Body:**
```json
{
  "professionalId": "prof-123",
  "name": "Hipertrofia",
  "color": "#45B7D1",
  "description": "Alunos focados em ganho de massa muscular"
}
```

**Resposta de Sucesso (201):** Retorna a tag criada.

#### DELETE `/tags/:tagId`
Deletar tag.

**Resposta de Sucesso (204):** Sem conteúdo.

#### POST `/students/:studentLinkId/tags`
Adicionar tag a um aluno.

**Body:**
```json
{
  "tagId": "tag-123"
}
```

**Resposta de Sucesso (200):** Confirmação.

#### DELETE `/students/:studentLinkId/tags/:tagId`
Remover tag de um aluno.

**Resposta de Sucesso (204):** Sem conteúdo.

---

### 5. Anotações (Notes)

#### GET `/notes?studentLinkId=<id>&professionalId=<id>`
Listar notas.

**Query Params:**
- `studentLinkId` (opcional): Filtrar por aluno
- `professionalId` (opcional): Filtrar por profissional

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "note-123",
    "studentLinkId": "link-123",
    "professionalId": "prof-123",
    "title": "Primeira Avaliação",
    "content": "Aluno apresentou boa mobilidade...",
    "category": "evaluation",
    "tags": ["avaliacao-inicial"],
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

#### POST `/notes`
Criar nova nota.

**Body:**
```json
{
  "studentLinkId": "link-123",
  "professionalId": "prof-123",
  "title": "Primeira Avaliação",
  "content": "Aluno apresentou boa mobilidade...",
  "category": "evaluation",
  "tags": ["avaliacao-inicial"]
}
```

**Resposta de Sucesso (201):** Retorna a nota criada.

#### PATCH `/notes/:noteId`
Atualizar nota.

**Body:**
```json
{
  "title": "Avaliação Atualizada",
  "content": "Novo conteúdo..."
}
```

**Resposta de Sucesso (200):** Retorna a nota atualizada.

#### DELETE `/notes/:noteId`
Deletar nota.

**Resposta de Sucesso (204):** Sem conteúdo.

---

### 6. Metas (Goals)

#### GET `/goals?studentLinkId=<id>&professionalId=<id>`
Listar metas.

**Query Params:**
- `studentLinkId` (opcional): Filtrar por aluno
- `professionalId` (opcional): Filtrar por profissional

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "goal-123",
    "studentLinkId": "link-123",
    "professionalId": "prof-123",
    "title": "Ganhar 5kg de massa muscular",
    "description": "Meta de hipertrofia para 3 meses",
    "category": "weight",
    "targetValue": 75,
    "unit": "kg",
    "currentValue": 70,
    "startValue": 70,
    "startDate": "2025-01-01T00:00:00.000Z",
    "targetDate": "2025-04-01T00:00:00.000Z",
    "status": "active",
    "progress": 0,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

#### POST `/goals`
Criar nova meta.

**Body:**
```json
{
  "studentLinkId": "link-123",
  "professionalId": "prof-123",
  "title": "Ganhar 5kg de massa muscular",
  "description": "Meta de hipertrofia para 3 meses",
  "category": "weight",
  "currentValue": 70,
  "targetValue": 75,
  "unit": "kg",
  "targetDate": "2025-04-01T00:00:00.000Z",
  "startDate": "2025-01-01T00:00:00.000Z"
}
```

**Resposta de Sucesso (201):** Retorna a meta criada (com `progress` calculado).

#### PATCH `/goals/:goalId`
Atualizar meta.

**Body:**
```json
{
  "currentValue": 72,
  "status": "active"
}
```

**Resposta de Sucesso (200):** Retorna a meta atualizada (com `progress` recalculado).

#### DELETE `/goals/:goalId`
Deletar meta.

**Resposta de Sucesso (204):** Sem conteúdo.

---

### 7. Avaliações (Evaluations)

#### GET `/evaluations?studentLinkId=<id>&professionalId=<id>`
Listar avaliações.

**Query Params:**
- `studentLinkId` (opcional): Filtrar por aluno
- `professionalId` (opcional): Filtrar por profissional

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "eval-123",
    "studentLinkId": "link-123",
    "professionalId": "prof-123",
    "title": "Avaliação Física Inicial",
    "description": "Primeira avaliação do aluno",
    "type": "fitness",
    "scheduledDate": "2025-01-15",
    "scheduledTime": "14:00",
    "duration": 60,
    "location": "Academia XYZ",
    "status": "scheduled",
    "notes": "",
    "reminderSent": false,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

#### POST `/evaluations`
Criar nova avaliação.

**Body:**
```json
{
  "studentLinkId": "link-123",
  "professionalId": "prof-123",
  "title": "Avaliação Física Inicial",
  "type": "fitness",
  "scheduledDate": "2025-01-15",
  "scheduledTime": "14:00",
  "duration": 60,
  "location": "Academia XYZ"
}
```

**Resposta de Sucesso (201):** Retorna a avaliação criada.

#### PATCH `/evaluations/:evaluationId`
Atualizar avaliação.

**Body:**
```json
{
  "scheduledDate": "2025-01-16",
  "status": "rescheduled"
}
```

**Resposta de Sucesso (200):** Retorna a avaliação atualizada.

#### DELETE `/evaluations/:evaluationId`
Deletar avaliação.

**Resposta de Sucesso (204):** Sem conteúdo.

---

### 8. Estatísticas (Stats)

#### GET `/stats?professionalId=<id>`
Obter estatísticas do profissional.

**Resposta de Sucesso (200):**
```json
{
  "totalStudents": 25,
  "activeStudents": 22,
  "completedGoals": 15,
  "totalGoals": 45,
  "upcomingEvaluations": 8,
  "averageStudentProgress": 68,
  "studentsWithAlerts": 5,
  "lastUpdated": "2025-01-01T00:00:00.000Z"
}
```

---

### 9. Conversas (Conversations)

Sistema de chat bidirectional entre profissional e aluno. Substitui o sistema unidirecional de anotações.

#### GET `/conversations`
Listar conversas.

**Query Parameters:**
- `studentLinkId` (opcional): Filtrar por aluno
- `professionalId` (opcional): Filtrar por profissional
- `includeArchived` (opcional): Incluir conversas arquivadas (padrão: false)

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "conv-123",
    "studentLinkId": "link-456",
    "professionalId": "prof-789",
    "studentUserId": "user-101",
    "title": "Dúvida sobre treino de peito",
    "category": "training",
    "messages": [
      {
        "id": "msg-001",
        "conversationId": "conv-123",
        "senderId": "user-101",
        "senderType": "student",
        "senderName": "João Aluno",
        "content": "Posso substituir supino por flexão?",
        "isRead": true,
        "readAt": "2025-01-02T10:30:00.000Z",
        "createdAt": "2025-01-02T10:00:00.000Z"
      },
      {
        "id": "msg-002",
        "conversationId": "conv-123",
        "senderId": "prof-789",
        "senderType": "professional",
        "senderName": "Prof. Silva",
        "content": "Pode sim, mas ajuste a quantidade de séries.",
        "isRead": false,
        "createdAt": "2025-01-02T11:00:00.000Z"
      }
    ],
    "isArchived": false,
    "lastMessageAt": "2025-01-02T11:00:00.000Z",
    "unreadCount": {
      "professional": 0,
      "student": 1
    },
    "createdAt": "2025-01-02T10:00:00.000Z",
    "updatedAt": "2025-01-02T11:00:00.000Z"
  }
]
```

#### GET `/conversations/:conversationId`
Obter conversa específica com todas as mensagens.

**Resposta de Sucesso (200):**
```json
{
  "id": "conv-123",
  "studentLinkId": "link-456",
  "professionalId": "prof-789",
  "studentUserId": "user-101",
  "title": "Dúvida sobre treino de peito",
  "category": "training",
  "messages": [...],
  "isArchived": false,
  "lastMessageAt": "2025-01-02T11:00:00.000Z",
  "unreadCount": {
    "professional": 0,
    "student": 1
  },
  "createdAt": "2025-01-02T10:00:00.000Z",
  "updatedAt": "2025-01-02T11:00:00.000Z"
}
```

#### POST `/conversations`
Criar nova conversa.

**Body:**
```json
{
  "studentLinkId": "link-456",
  "professionalId": "prof-789",
  "studentUserId": "user-101",
  "title": "Dúvida sobre treino",
  "category": "training",
  "initialMessage": "Olá! Tenho uma dúvida sobre o treino..."
}
```

**Categorias disponíveis:**
- `general` - Assuntos gerais
- `training` - Dúvidas sobre treino
- `nutrition` - Dúvidas sobre nutrição
- `evaluation` - Sobre avaliações
- `other` - Outros assuntos

**Resposta de Sucesso (201):**
```json
{
  "id": "conv-123",
  "studentLinkId": "link-456",
  "professionalId": "prof-789",
  "studentUserId": "user-101",
  "title": "Dúvida sobre treino",
  "category": "training",
  "messages": [
    {
      "id": "msg-001",
      "conversationId": "conv-123",
      "senderId": "prof-789",
      "senderType": "professional",
      "senderName": "Prof. Silva",
      "content": "Olá! Tenho uma dúvida sobre o treino...",
      "isRead": false,
      "createdAt": "2025-01-02T10:00:00.000Z"
    }
  ],
  "isArchived": false,
  "lastMessageAt": "2025-01-02T10:00:00.000Z",
  "unreadCount": {
    "professional": 0,
    "student": 1
  },
  "createdAt": "2025-01-02T10:00:00.000Z",
  "updatedAt": "2025-01-02T10:00:00.000Z"
}
```

#### POST `/conversations/:conversationId/messages`
Adicionar mensagem à conversa.

**Body:**
```json
{
  "senderId": "prof-789",
  "senderType": "professional",
  "senderName": "Prof. Silva",
  "content": "Pode sim, mas ajuste a quantidade de séries."
}
```

**Resposta de Sucesso (201):**
```json
{
  "id": "msg-002",
  "conversationId": "conv-123",
  "senderId": "prof-789",
  "senderType": "professional",
  "senderName": "Prof. Silva",
  "content": "Pode sim, mas ajuste a quantidade de séries.",
  "isRead": false,
  "createdAt": "2025-01-02T11:00:00.000Z"
}
```

#### POST `/conversations/:conversationId/read`
Marcar mensagens como lidas.

**Body:**
```json
{
  "userId": "prof-789",
  "userType": "professional"
}
```

**Resposta de Sucesso (204):**
Sem corpo de resposta.

**Comportamento:**
- Marca todas as mensagens não lidas da conversa como lidas para o usuário especificado
- Atualiza `isRead` para `true` e define `readAt` com timestamp atual
- Zera o contador `unreadCount` para o tipo de usuário

#### POST `/conversations/:conversationId/archive`
Arquivar conversa.

**Resposta de Sucesso (204):**
Sem corpo de resposta.

#### POST `/conversations/:conversationId/unarchive`
Desarquivar conversa.

**Resposta de Sucesso (204):**
Sem corpo de resposta.

#### DELETE `/conversations/:conversationId`
Deletar conversa.

**Resposta de Sucesso (204):**
Sem corpo de resposta.

**Nota:** Esta operação deleta permanentemente a conversa e todas as suas mensagens.

---

## Códigos de Status HTTP

- `200 OK` - Requisição bem-sucedida
- `201 Created` - Recurso criado com sucesso
- `204 No Content` - Requisição bem-sucedida sem corpo de resposta
- `400 Bad Request` - Dados inválidos
- `401 Unauthorized` - Não autenticado
- `403 Forbidden` - Sem permissão
- `404 Not Found` - Recurso não encontrado
- `500 Internal Server Error` - Erro no servidor

---

## Formato de Erro

Todas as respostas de erro seguem este formato:

```json
{
  "message": "Descrição do erro"
}
```

---

## Tipos de Dados

### AccessLevel
```
"full" | "workout_only" | "nutrition_only" | "analytics_only"
```

### ProfessionalType
```
"personal_trainer" | "nutricionista" | "fisioterapeuta" | "preparador_fisico" | "outro"
```

### LinkStatus
```
"pending" | "active" | "inactive" | "rejected"
```

### NoteCategory
```
"progress" | "health" | "behavior" | "evaluation" | "other"
```

### GoalCategory
```
"weight" | "strength" | "endurance" | "flexibility" | "habit" | "body_composition" | "other"
```

### GoalStatus
```
"active" | "completed" | "paused" | "failed"
```

### EvaluationType
```
"fitness" | "nutrition" | "progress" | "other"
```

### EvaluationStatus
```
"scheduled" | "completed" | "cancelled" | "rescheduled"
```

---

## Implementação Backend

Recomendações para implementar a API:

1. **Node.js + Express**: Framework popular e fácil de usar
2. **Prisma ORM**: Para gerenciar o banco de dados
3. **PostgreSQL/MySQL**: Banco de dados relacional
4. **JWT**: Para autenticação
5. **Zod**: Para validação de dados

### Exemplo de Estrutura (Node.js + Express)

```
api/
├── src/
│   ├── controllers/
│   │   ├── professionalController.ts
│   │   ├── studentsController.ts
│   │   ├── tagsController.ts
│   │   ├── notesController.ts
│   │   ├── goalsController.ts
│   │   ├── evaluationsController.ts
│   │   └── statsController.ts
│   ├── routes/
│   │   └── professional.routes.ts
│   ├── middleware/
│   │   └── auth.middleware.ts
│   ├── models/
│   └── index.ts
├── prisma/
│   └── schema.prisma
└── package.json
```

---

## Próximos Passos

1. ✅ Remover Firebase da Área Profissional
2. ✅ Criar serviço de API no frontend
3. ✅ Atualizar todos os hooks para usar a API
4. ⏳ Implementar backend da API
5. ⏳ Configurar banco de dados
6. ⏳ Implementar autenticação
7. ⏳ Testar integração
