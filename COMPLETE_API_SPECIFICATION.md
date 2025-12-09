# Especificação Completa da API - Gym Tracker

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação API](#1-autenticação-api)
3. [Social API (Grupos)](#2-social-api-grupos)
4. [Notificações API](#3-notificações-api)
5. [Treinos e Nutrição API](#4-treinos-e-nutrição-api)
6. [Badges API](#5-badges-api)
7. [Perfis de Usuário API](#6-perfis-de-usuário-api)
8. [Arquitetura e Implementação](#arquitetura-e-implementação)

---

## Visão Geral

Esta especificação define **TODAS** as APIs necessárias para substituir completamente o Firebase no Gym Tracker.

### URLs Base

```env
# Produção
VITE_API_BASE_URL=https://api.gymtracker.com

# Desenvolvimento
VITE_API_BASE_URL=http://localhost:3000/api
```

### Estrutura de Endpoints

```
/api
├── /auth               # Autenticação e registro
├── /users              # Perfis de usuário
├── /social             # Grupos, posts, likes, comentários
├── /notifications      # Sistema de notificações
├── /workouts           # Treinos e exercícios
├── /nutrition          # Nutrição e alimentação
├── /badges             # Sistema de conquistas
└── /professional       # Área profissional (JÁ IMPLEMENTADO)
```

---

## 1. Autenticação API

Substituir **Firebase Authentication** por JWT próprio.

### Configuração

```typescript
// src/services/authApi.ts
const AUTH_API_URL = `${import.meta.env.VITE_API_BASE_URL}/auth`;
```

### Endpoints

#### POST `/auth/register`
Registrar novo usuário.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "senha123",
  "displayName": "João Silva"
}
```

**Resposta (201):**
```json
{
  "user": {
    "uid": "user-123",
    "email": "user@example.com",
    "displayName": "João Silva",
    "photoURL": null,
    "createdAt": "2025-01-09T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh-token-here"
}
```

#### POST `/auth/login`
Login com email e senha.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "senha123"
}
```

**Resposta (200):**
```json
{
  "user": {
    "uid": "user-123",
    "email": "user@example.com",
    "displayName": "João Silva",
    "photoURL": "https://...",
    "lastLoginAt": "2025-01-09T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh-token-here"
}
```

#### POST `/auth/login/google`
Login com Google OAuth.

**Body:**
```json
{
  "idToken": "google-id-token-here"
}
```

**Resposta (200):** Igual ao login normal.

#### POST `/auth/logout`
Fazer logout (invalidar token).

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (204):** Sem conteúdo.

#### POST `/auth/refresh`
Renovar token expirado.

**Body:**
```json
{
  "refreshToken": "refresh-token-here"
}
```

**Resposta (200):**
```json
{
  "token": "new-jwt-token",
  "refreshToken": "new-refresh-token"
}
```

#### POST `/auth/reset-password`
Solicitar reset de senha.

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Resposta (200):**
```json
{
  "message": "Email de recuperação enviado"
}
```

#### POST `/auth/reset-password/confirm`
Confirmar nova senha.

**Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "novaSenha123"
}
```

**Resposta (200):**
```json
{
  "message": "Senha alterada com sucesso"
}
```

#### GET `/auth/me`
Obter usuário atual (valida token).

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (200):**
```json
{
  "uid": "user-123",
  "email": "user@example.com",
  "displayName": "João Silva",
  "photoURL": "https://...",
  "emailVerified": true
}
```

---

## 2. Social API (Grupos)

Substituir **Firestore Social Features**.

### Endpoints de Grupos

#### GET `/social/groups`
Listar grupos do usuário.

**Query Parameters:**
- `userId` (required): ID do usuário

**Resposta (200):**
```json
[
  {
    "id": "group-123",
    "name": "Treino Pesado",
    "description": "Grupo para quem gosta de treino intenso",
    "photoURL": "https://...",
    "createdBy": "user-456",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-09T12:00:00.000Z",
    "members": ["user-123", "user-456", "user-789"],
    "membersCount": 3,
    "postsCount": 15,
    "isPrivate": false,
    "category": "fitness"
  }
]
```

#### POST `/social/groups`
Criar novo grupo.

**Body:**
```json
{
  "name": "Treino Pesado",
  "description": "Grupo para quem gosta de treino intenso",
  "photoURL": "https://...",
  "isPrivate": false,
  "category": "fitness"
}
```

**Resposta (201):** Retorna o grupo criado.

#### PATCH `/social/groups/:groupId`
Atualizar grupo.

**Body:**
```json
{
  "name": "Novo Nome",
  "description": "Nova descrição"
}
```

**Resposta (200):** Retorna o grupo atualizado.

#### DELETE `/social/groups/:groupId`
Deletar grupo.

**Resposta (204):** Sem conteúdo.

#### POST `/social/groups/:groupId/join`
Entrar em um grupo.

**Resposta (200):**
```json
{
  "message": "Você entrou no grupo"
}
```

#### POST `/social/groups/:groupId/leave`
Sair de um grupo.

**Resposta (200):**
```json
{
  "message": "Você saiu do grupo"
}
```

### Endpoints de Posts

#### GET `/social/groups/:groupId/posts`
Listar posts de um grupo.

**Query Parameters:**
- `limit` (opcional): Número de posts (padrão: 20)
- `offset` (opcional): Paginação

**Resposta (200):**
```json
[
  {
    "id": "post-123",
    "groupId": "group-456",
    "userId": "user-789",
    "userName": "João Silva",
    "userPhotoURL": "https://...",
    "content": "Treino de hoje foi intenso!",
    "workoutData": {
      "duration": 3600,
      "exercises": ["Supino", "Agachamento"],
      "totalWeight": 5000
    },
    "likesCount": 15,
    "commentsCount": 3,
    "hasLiked": true,
    "createdAt": "2025-01-09T10:00:00.000Z",
    "updatedAt": "2025-01-09T10:00:00.000Z"
  }
]
```

#### POST `/social/groups/:groupId/posts`
Criar novo post.

**Body:**
```json
{
  "content": "Treino de hoje foi intenso!",
  "workoutData": {
    "duration": 3600,
    "exercises": ["Supino", "Agachamento"],
    "totalWeight": 5000
  }
}
```

**Resposta (201):** Retorna o post criado.

#### DELETE `/social/posts/:postId`
Deletar post.

**Resposta (204):** Sem conteúdo.

### Endpoints de Likes

#### POST `/social/posts/:postId/like`
Dar like em um post.

**Resposta (200):**
```json
{
  "likesCount": 16
}
```

#### DELETE `/social/posts/:postId/like`
Remover like de um post.

**Resposta (200):**
```json
{
  "likesCount": 15
}
```

#### GET `/social/posts/:postId/likes`
Listar quem deu like.

**Resposta (200):**
```json
[
  {
    "userId": "user-123",
    "userName": "João Silva",
    "userPhotoURL": "https://...",
    "likedAt": "2025-01-09T10:00:00.000Z"
  }
]
```

### Endpoints de Comentários

#### GET `/social/posts/:postId/comments`
Listar comentários de um post.

**Resposta (200):**
```json
[
  {
    "id": "comment-123",
    "postId": "post-456",
    "userId": "user-789",
    "userName": "Maria Santos",
    "userPhotoURL": "https://...",
    "content": "Parabéns pelo treino!",
    "createdAt": "2025-01-09T10:30:00.000Z"
  }
]
```

#### POST `/social/posts/:postId/comments`
Adicionar comentário.

**Body:**
```json
{
  "content": "Parabéns pelo treino!"
}
```

**Resposta (201):** Retorna o comentário criado.

#### DELETE `/social/comments/:commentId`
Deletar comentário.

**Resposta (204):** Sem conteúdo.

### Endpoints de Desafios

#### GET `/social/groups/:groupId/challenges`
Listar desafios do grupo.

**Resposta (200):**
```json
[
  {
    "id": "challenge-123",
    "groupId": "group-456",
    "createdBy": "user-789",
    "title": "Desafio 100 Flexões",
    "description": "Complete 100 flexões em 7 dias",
    "startDate": "2025-01-01",
    "endDate": "2025-01-07",
    "targetValue": 100,
    "unit": "repetições",
    "participants": ["user-123", "user-456"],
    "leaderboard": [
      {
        "userId": "user-123",
        "progress": 85,
        "rank": 1
      }
    ]
  }
]
```

#### POST `/social/groups/:groupId/challenges`
Criar desafio.

**Body:**
```json
{
  "title": "Desafio 100 Flexões",
  "description": "Complete 100 flexões em 7 dias",
  "startDate": "2025-01-01",
  "endDate": "2025-01-07",
  "targetValue": 100,
  "unit": "repetições"
}
```

**Resposta (201):** Retorna o desafio criado.

#### POST `/social/challenges/:challengeId/join`
Participar de um desafio.

**Resposta (200):**
```json
{
  "message": "Você entrou no desafio"
}
```

#### POST `/social/challenges/:challengeId/progress`
Atualizar progresso no desafio.

**Body:**
```json
{
  "progress": 85
}
```

**Resposta (200):** Retorna o progresso atualizado.

---

## 3. Notificações API

Substituir **Firebase Cloud Messaging**.

### Endpoints

#### GET `/notifications`
Listar notificações do usuário.

**Query Parameters:**
- `userId` (required): ID do usuário
- `unreadOnly` (opcional): true/false

**Resposta (200):**
```json
[
  {
    "id": "notif-123",
    "userId": "user-456",
    "type": "like",
    "title": "Nova curtida",
    "message": "João Silva curtiu seu post",
    "data": {
      "postId": "post-789",
      "fromUserId": "user-123"
    },
    "isRead": false,
    "createdAt": "2025-01-09T12:00:00.000Z"
  }
]
```

#### POST `/notifications`
Criar notificação (usado internamente pela API).

**Body:**
```json
{
  "userId": "user-456",
  "type": "like",
  "title": "Nova curtida",
  "message": "João Silva curtiu seu post",
  "data": {
    "postId": "post-789",
    "fromUserId": "user-123"
  }
}
```

**Resposta (201):** Retorna a notificação criada.

#### PATCH `/notifications/:notificationId/read`
Marcar notificação como lida.

**Resposta (200):**
```json
{
  "id": "notif-123",
  "isRead": true,
  "readAt": "2025-01-09T12:05:00.000Z"
}
```

#### POST `/notifications/read-all`
Marcar todas como lidas.

**Body:**
```json
{
  "userId": "user-456"
}
```

**Resposta (200):**
```json
{
  "message": "Todas as notificações foram marcadas como lidas"
}
```

#### DELETE `/notifications/:notificationId`
Deletar notificação.

**Resposta (204):** Sem conteúdo.

### WebSocket para Notificações em Tempo Real

```typescript
// Conectar ao WebSocket
const ws = new WebSocket('ws://localhost:3000/notifications?userId=user-456&token=jwt-token');

// Receber notificações
ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  console.log('Nova notificação:', notification);
};
```

---

## 4. Treinos e Nutrição API

Substituir **IndexedDB** por API centralizada.

### Endpoints de Treinos

#### GET `/workouts/days`
Listar dias de treino.

**Query Parameters:**
- `userId` (required): ID do usuário

**Resposta (200):**
```json
[
  {
    "id": "day-123",
    "userId": "user-456",
    "name": "Treino A - Peito e Tríceps",
    "exercises": [
      {
        "id": "ex-1",
        "name": "Supino Reto",
        "sets": 4,
        "reps": 12,
        "weight": 80,
        "restTime": 90
      }
    ],
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-09T12:00:00.000Z"
  }
]
```

#### POST `/workouts/days`
Criar dia de treino.

**Body:**
```json
{
  "userId": "user-456",
  "name": "Treino A - Peito e Tríceps",
  "exercises": [...]
}
```

**Resposta (201):** Retorna o dia criado.

#### PUT `/workouts/days/:dayId`
Atualizar dia de treino.

**Resposta (200):** Retorna o dia atualizado.

#### DELETE `/workouts/days/:dayId`
Deletar dia de treino.

**Resposta (204):** Sem conteúdo.

#### GET `/workouts/sessions`
Listar sessões de treino executadas.

**Query Parameters:**
- `userId` (required): ID do usuário
- `startDate` (opcional): Filtrar por data inicial
- `endDate` (opcional): Filtrar por data final

**Resposta (200):**
```json
[
  {
    "id": "session-123",
    "userId": "user-456",
    "workoutDayId": "day-789",
    "date": "2025-01-09",
    "duration": 3600,
    "exercises": [...],
    "completedAt": "2025-01-09T14:00:00.000Z"
  }
]
```

#### POST `/workouts/sessions`
Registrar sessão de treino.

**Resposta (201):** Retorna a sessão criada.

### Endpoints de Nutrição

#### GET `/nutrition/entries`
Listar entradas de alimentação.

**Query Parameters:**
- `userId` (required): ID do usuário
- `date` (opcional): Filtrar por data (YYYY-MM-DD)

**Resposta (200):**
```json
[
  {
    "id": "entry-123",
    "userId": "user-456",
    "date": "2025-01-09",
    "meal": "breakfast",
    "foodName": "Frango Grelhado",
    "calories": 250,
    "protein": 40,
    "carbs": 0,
    "fat": 8,
    "createdAt": "2025-01-09T08:00:00.000Z"
  }
]
```

#### POST `/nutrition/entries`
Adicionar entrada de alimentação.

**Resposta (201):** Retorna a entrada criada.

#### DELETE `/nutrition/entries/:entryId`
Deletar entrada.

**Resposta (204):** Sem conteúdo.

#### GET `/nutrition/goals`
Obter metas nutricionais.

**Query Parameters:**
- `userId` (required): ID do usuário

**Resposta (200):**
```json
{
  "userId": "user-456",
  "calories": 2500,
  "protein": 180,
  "carbs": 250,
  "fat": 70,
  "water": 3000
}
```

#### PUT `/nutrition/goals`
Atualizar metas nutricionais.

**Resposta (200):** Retorna as metas atualizadas.

---

## 5. Badges API

Sistema de conquistas e badges.

### Endpoints

#### GET `/badges`
Listar todas as badges disponíveis.

**Resposta (200):**
```json
[
  {
    "id": "badge-1",
    "name": "Primeira Sessão",
    "description": "Complete seu primeiro treino",
    "icon": "🏋️",
    "category": "workout",
    "requirement": {
      "type": "workout_count",
      "value": 1
    }
  }
]
```

#### GET `/badges/user/:userId`
Listar badges do usuário.

**Resposta (200):**
```json
[
  {
    "id": "user-badge-123",
    "userId": "user-456",
    "badgeId": "badge-1",
    "badge": {
      "name": "Primeira Sessão",
      "icon": "🏋️"
    },
    "earnedAt": "2025-01-09T12:00:00.000Z"
  }
]
```

#### GET `/badges/user/:userId/progress`
Ver progresso de badges não conquistadas.

**Resposta (200):**
```json
[
  {
    "badgeId": "badge-2",
    "badge": {
      "name": "10 Treinos",
      "requirement": { "type": "workout_count", "value": 10 }
    },
    "currentProgress": 7,
    "targetProgress": 10,
    "percentage": 70
  }
]
```

---

## 6. Perfis de Usuário API

Gerenciar perfis públicos e privados.

### Endpoints

#### GET `/users/:userId`
Obter perfil público de usuário.

**Resposta (200):**
```json
{
  "uid": "user-123",
  "displayName": "João Silva",
  "photoURL": "https://...",
  "bio": "Apaixonado por fitness",
  "isPrivate": false,
  "followersCount": 150,
  "followingCount": 200,
  "workoutsCount": 45,
  "groupsCount": 3,
  "badges": [
    {
      "id": "badge-1",
      "name": "Primeira Sessão",
      "icon": "🏋️"
    }
  ]
}
```

#### PATCH `/users/:userId`
Atualizar perfil.

**Body:**
```json
{
  "displayName": "João Silva Jr.",
  "bio": "Nova bio",
  "photoURL": "https://..."
}
```

**Resposta (200):** Retorna o perfil atualizado.

#### POST `/users/:userId/follow`
Seguir usuário.

**Resposta (200):**
```json
{
  "following": true
}
```

#### DELETE `/users/:userId/follow`
Deixar de seguir.

**Resposta (200):**
```json
{
  "following": false
}
```

#### GET `/users/:userId/followers`
Listar seguidores.

**Resposta (200):**
```json
[
  {
    "uid": "user-789",
    "displayName": "Maria Santos",
    "photoURL": "https://..."
  }
]
```

#### GET `/users/:userId/following`
Listar quem o usuário segue.

**Resposta (200):** Igual ao endpoint de seguidores.

---

## Arquitetura e Implementação

### Stack Recomendada

**Backend:**
- **Node.js + Express** ou **NestJS**
- **PostgreSQL** (dados relacionais)
- **Redis** (cache e sessões)
- **WebSocket** (Socket.io para notificações em tempo real)
- **JWT** (autenticação)

**Frontend (já existente):**
- React + TypeScript
- Axios para requisições HTTP
- Socket.io-client para WebSocket

### Estrutura do Backend

```
backend/
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   └── dto/
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── entities/user.entity.ts
│   ├── social/
│   │   ├── groups.controller.ts
│   │   ├── posts.controller.ts
│   │   ├── likes.controller.ts
│   │   └── comments.controller.ts
│   ├── notifications/
│   │   ├── notifications.controller.ts
│   │   ├── notifications.service.ts
│   │   └── notifications.gateway.ts (WebSocket)
│   ├── workouts/
│   │   ├── workouts.controller.ts
│   │   └── workouts.service.ts
│   ├── nutrition/
│   │   ├── nutrition.controller.ts
│   │   └── nutrition.service.ts
│   ├── badges/
│   │   ├── badges.controller.ts
│   │   └── badges.service.ts
│   └── professional/ (já implementado)
├── prisma/ (ou TypeORM)
│   └── schema.prisma
└── package.json
```

### Banco de Dados

```sql
-- Exemplo de schema PostgreSQL

-- Usuários
CREATE TABLE users (
  uid VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  photo_url TEXT,
  bio TEXT,
  is_private BOOLEAN DEFAULT false,
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  workouts_count INT DEFAULT 0,
  groups_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Grupos
CREATE TABLE groups (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  photo_url TEXT,
  created_by VARCHAR(36) REFERENCES users(uid),
  is_private BOOLEAN DEFAULT false,
  category VARCHAR(50),
  members_count INT DEFAULT 1,
  posts_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Posts
CREATE TABLE posts (
  id VARCHAR(36) PRIMARY KEY,
  group_id VARCHAR(36) REFERENCES groups(id),
  user_id VARCHAR(36) REFERENCES users(uid),
  content TEXT NOT NULL,
  workout_data JSONB,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ... (demais tabelas)
```

### Migração Gradual

1. **Fase 1: Autenticação** (2-3 semanas)
   - Implementar JWT auth
   - Migrar login/registro
   - Manter Firebase Auth em paralelo

2. **Fase 2: Perfis e Social** (3-4 semanas)
   - Migrar perfis de usuário
   - Migrar grupos e posts
   - Implementar likes e comentários

3. **Fase 3: Notificações** (1-2 semanas)
   - Implementar WebSocket
   - Migrar sistema de notificações

4. **Fase 4: Treinos e Nutrição** (2-3 semanas)
   - Migrar de IndexedDB para API
   - Implementar sincronização

5. **Fase 5: Badges** (1 semana)
   - Sistema de conquistas
   - Lógica de desbloqueio

6. **Fase 6: Desativar Firebase** (1 semana)
   - Testes finais
   - Remoção do Firebase SDK
   - Deploy final

**Total estimado: 10-16 semanas**

---

## Próximos Passos

1. **Revisar especificação** com a equipe
2. **Escolher stack** do backend
3. **Configurar ambiente** de desenvolvimento
4. **Implementar autenticação** primeiro
5. **Migrar módulo por módulo**
6. **Testar exaustivamente**
7. **Deploy gradual** em produção

---

**Data de Criação:** 09/12/2025
**Versão:** 1.0
