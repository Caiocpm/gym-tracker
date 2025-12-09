# Plano de Migração Completa - Firebase → API Própria

## 🎯 Objetivo

Migrar **TODOS** os recursos do Gym Tracker do Firebase para uma API REST própria, incluindo:

- ✅ Área Profissional (JÁ CONCLUÍDO)
- 🔲 Autenticação (Firebase Auth → JWT)
- 🔲 Social Features (Firestore → PostgreSQL)
- 🔲 Notificações (FCM → WebSocket)
- 🔲 Treinos/Nutrição (IndexedDB → API)
- 🔲 Badges (Sistema novo)

---

## 📅 Timeline Completa

**Duração Total Estimada:** 14-18 semanas (3.5-4.5 meses)

### Fase 0: Preparação (1 semana)
- Configurar ambiente de desenvolvimento
- Escolher stack do backend
- Configurar banco de dados
- Configurar CI/CD

### Fase 1: Autenticação (3 semanas)
- Implementar backend JWT
- Migrar AuthContext
- Testes de integração
- Deploy em staging

### Fase 2: Perfis de Usuário (2 semanas)
- API de perfis
- Migrar dados de usuários
- Sistema de follow/unfollow

### Fase 3: Social Features (4 semanas)
- API de grupos
- API de posts, likes, comentários
- Migrar dados existentes
- Testes de carga

### Fase 4: Notificações (2 semanas)
- WebSocket server
- Migrar notificationService
- Testes de tempo real

### Fase 5: Treinos e Nutrição (3 semanas)
- API de treinos
- API de nutrição
- Sincronização de dados
- Migração de IndexedDB

### Fase 6: Badges (1 semana)
- Sistema de conquistas
- Lógica de desbloqueio
- Interface de badges

### Fase 7: Testes e Deploy (1 semana)
- Testes end-to-end
- Performance testing
- Deploy em produção
- Monitoramento

---

## 🔧 Fase 1: Autenticação (3 semanas)

### Semana 1: Backend JWT

**Tarefas:**
1. Configurar NestJS/Express
2. Implementar endpoints de auth:
   - POST /auth/register
   - POST /auth/login
   - POST /auth/login/google
   - POST /auth/logout
   - POST /auth/refresh
   - GET /auth/me
3. Configurar JWT strategy
4. Implementar refresh tokens
5. Testes unitários

**Entregáveis:**
- Backend rodando localmente
- Endpoints testados no Postman
- Documentação da API

### Semana 2: Frontend - AuthContext

**Tarefas:**
1. Atualizar [AuthContext.tsx](src/contexts/AuthContext.tsx):
```typescript
// ANTES (Firebase)
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

// DEPOIS (API)
import { authApi } from '../services/authApi';

async function login(email: string, password: string) {
  const response = await authApi.login(email, password);
  setCurrentUser(response.user);
}
```

2. Atualizar componentes de auth:
   - [src/components/Auth/Login.tsx]
   - [src/components/Auth/Register.tsx]
   - [src/components/Auth/ResetPassword.tsx]

3. Configurar interceptor de token

**Entregáveis:**
- AuthContext migrado
- Fluxo de login funcionando
- Testes E2E de autenticação

### Semana 3: Testes e Deploy

**Tarefas:**
1. Testes de integração
2. Migrar usuários existentes (script)
3. Deploy em staging
4. Testes com usuários beta

**Entregáveis:**
- 100% dos testes passando
- Sistema rodando em staging
- Feedback de usuários beta

---

## 🔧 Fase 2: Perfis de Usuário (2 semanas)

### Semana 1: Backend

**Tarefas:**
1. Criar tabela `users` no PostgreSQL
2. Implementar endpoints:
   - GET /users/:userId
   - PATCH /users/:userId
   - POST /users/:userId/follow
   - DELETE /users/:userId/follow
   - GET /users/:userId/followers
   - GET /users/:userId/following
3. Testes unitários

**Entregáveis:**
- API de perfis funcionando
- Endpoints documentados

### Semana 2: Frontend

**Tarefas:**
1. Criar [usersApi.ts](src/services/usersApi.ts)
2. Atualizar componentes de perfil:
   - [src/components/Profile/Profile.tsx]
   - [src/components/Profile/UserPublicProfile/UserPublicProfile.tsx]
3. Migrar seguir/deixar de seguir

**Entregáveis:**
- Perfis funcionando com API
- Sistema de follow/unfollow OK

---

## 🔧 Fase 3: Social Features (4 semanas)

### Semana 1: Backend - Grupos

**Tarefas:**
1. Criar tabelas:
   - `groups`
   - `group_members`
2. Implementar endpoints de grupos
3. Testes unitários

**Entregáveis:**
- API de grupos funcionando

### Semana 2: Backend - Posts

**Tarefas:**
1. Criar tabelas:
   - `posts`
   - `post_likes`
   - `comments`
2. Implementar endpoints
3. Testes de carga

**Entregáveis:**
- API de posts, likes, comentários OK

### Semana 3: Frontend - useGroups

**Tarefas:**
1. Atualizar [useGroups.ts](src/hooks/useGroups.ts):
```typescript
// ANTES (Firestore)
const groupsRef = collection(db, "groups");
const q = query(groupsRef, where("members", "array-contains", currentUser.uid));
const querySnapshot = await getDocs(q);

// DEPOIS (API)
const groups = await socialApi.groups.list(currentUser.uid);
```

2. Atualizar componentes:
   - [src/components/Groups/Groups.tsx]
   - [src/components/Groups/GroupFeed.tsx]
   - [src/components/Groups/CommentsSection/CommentsSection.tsx]

**Entregáveis:**
- Grupos funcionando com API
- Posts, likes e comentários OK

### Semana 4: Migração de Dados

**Tarefas:**
1. Script para migrar grupos do Firestore
2. Script para migrar posts
3. Script para migrar comentários
4. Validação de dados migrados

**Entregáveis:**
- Todos os dados migrados
- Validação 100% OK

---

## 🔧 Fase 4: Notificações (2 semanas)

### Semana 1: Backend WebSocket

**Tarefas:**
1. Configurar Socket.io
2. Implementar gateway de notificações
3. Endpoints REST:
   - GET /notifications
   - PATCH /notifications/:id/read
   - POST /notifications/read-all
   - DELETE /notifications/:id
4. Lógica de envio de notificações

**Entregáveis:**
- WebSocket server rodando
- API REST de notificações OK

### Semana 2: Frontend

**Tarefas:**
1. Criar [notificationsApi.ts](src/services/notificationsApi.ts)
2. Criar hook useWebSocket
3. Atualizar [notificationService.ts](src/services/notificationService.ts)
4. Atualizar [NotificationCenter](src/components/NotificationCenter/NotificationCenter.tsx)

**Entregáveis:**
- Notificações em tempo real funcionando
- Centro de notificações atualizado

---

## 🔧 Fase 5: Treinos e Nutrição (3 semanas)

### Semana 1: Backend - Treinos

**Tarefas:**
1. Criar tabelas:
   - `workout_days`
   - `planned_exercises`
   - `workout_sessions`
   - `logged_exercises`
2. Implementar endpoints
3. Testes de performance

**Entregáveis:**
- API de treinos completa

### Semana 2: Backend - Nutrição

**Tarefas:**
1. Criar tabelas:
   - `food_entries`
   - `water_entries`
   - `daily_goals`
   - `predefined_foods`
2. Implementar endpoints
3. Testes

**Entregáveis:**
- API de nutrição completa

### Semana 3: Frontend - Migração

**Tarefas:**
1. Atualizar [WorkoutProviderIndexedDB.tsx](src/contexts/WorkoutProviderIndexedDB.tsx)
2. Atualizar [NutritionProviderIndexedDB.tsx](src/contexts/NutritionProviderIndexedDB.tsx)
3. Implementar sincronização
4. Migrar dados de usuários

**Estratégia:**
```typescript
// Modo híbrido: API + IndexedDB cache
async function loadWorkoutDays() {
  try {
    // Tentar API primeiro
    const days = await workoutsApi.days.list(userId);

    // Salvar no IndexedDB como cache
    await indexedDB.workoutDays.bulkPut(days);

    return days;
  } catch (error) {
    // Fallback: IndexedDB offline
    return await indexedDB.workoutDays.toArray();
  }
}
```

**Entregáveis:**
- Treinos sincronizados com API
- Nutrição sincronizada com API
- App funciona offline (modo cache)

---

## 🔧 Fase 6: Badges (1 semana)

### Tarefas

**Backend:**
1. Criar tabelas:
   - `badges`
   - `user_badges`
2. Implementar endpoints
3. Lógica de desbloqueio automático

**Frontend:**
1. Criar [badgesApi.ts](src/services/badgesApi.ts)
2. Criar hook useBadges
3. Componente de exibição de badges
4. Notificações de conquistas

**Badges a Implementar:**
- 🏋️ Primeira Sessão (1 treino)
- 💪 Guerreiro (10 treinos)
- 🔥 Imparável (30 treinos)
- 👑 Lenda (100 treinos)
- 🥗 Alimentação Saudável (7 dias registrando)
- 💧 Hidratação Perfeita (7 dias meta de água)
- 📈 Progresso Constante (ganho de força)
- 👥 Social (primeiro post em grupo)
- 🏆 Desafio Completo (completar desafio)

**Entregáveis:**
- Sistema de badges funcionando
- Notificações de conquistas

---

## 🔧 Fase 7: Testes e Deploy (1 semana)

### Testes

**Checklist:**
- [ ] Testes unitários: 80%+ cobertura
- [ ] Testes de integração: todas APIs
- [ ] Testes E2E: fluxos principais
- [ ] Testes de carga: 1000 usuários simultâneos
- [ ] Testes de segurança: OWASP Top 10
- [ ] Testes de acessibilidade: WCAG 2.1

### Deploy

**Infraestrutura:**
1. Backend: Heroku/Railway/Render
2. Database: PostgreSQL (Supabase/Neon)
3. Redis: Upstash
4. Frontend: Vercel/Netlify
5. Monitoramento: Sentry + LogRocket

**Rollout Gradual:**
1. 5% dos usuários → 1 dia
2. 25% dos usuários → 3 dias
3. 50% dos usuários → 5 dias
4. 100% dos usuários → 7 dias

### Rollback Plan

Se algo der errado:
1. Feature flag para voltar ao Firebase
2. Backup do banco de dados
3. Monitoramento de erros em tempo real

---

## 📊 Métricas de Sucesso

### Performance
- API response time < 200ms (p95)
- WebSocket latency < 50ms
- Uptime > 99.9%

### Funcionalidade
- 100% dos recursos Firebase replicados
- 0 bugs críticos em produção
- Feedback positivo de usuários > 90%

### Custos
- Redução de custos Firebase: ~70%
- Custos mensais estimados:
  - Backend: $20/mês
  - Database: $25/mês
  - Redis: $10/mês
  - **Total: ~$55/mês** (vs ~$200/mês Firebase)

---

## 🚀 Como Começar

### 1. Setup do Backend

```bash
# Clone o template
git clone https://github.com/nestjs/typescript-starter backend
cd backend

# Instalar dependências
npm install

# Adicionar pacotes necessários
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install @prisma/client
npm install bcrypt

# Configurar Prisma
npx prisma init
```

### 2. Configurar Variáveis de Ambiente

```env
# Backend .env
DATABASE_URL="postgresql://user:pass@localhost:5432/gymtracker"
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_REFRESH_SECRET="another-secret-key"
REDIS_URL="redis://localhost:6379"
PORT=3000
```

```env
# Frontend .env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 3. Iniciar Desenvolvimento

```bash
# Backend
cd backend
npm run start:dev

# Frontend (em outro terminal)
cd frontend
npm run dev
```

---

## 📚 Recursos e Documentação

### Especificações Criadas
- [COMPLETE_API_SPECIFICATION.md](COMPLETE_API_SPECIFICATION.md) - API completa
- [PROFESSIONAL_API.md](PROFESSIONAL_API.md) - API profissional
- [FIREBASE_TO_API_MIGRATION_COMPLETE.md](FIREBASE_TO_API_MIGRATION_COMPLETE.md) - Migração área profissional

### Código Frontend Criado
- [src/services/authApi.ts](src/services/authApi.ts) - Autenticação
- [src/services/socialApi.ts](src/services/socialApi.ts) - Social features
- [src/services/professionalApi.ts](src/services/professionalApi.ts) - Área profissional

### Stack Recomendada

**Backend:**
- NestJS (TypeScript, arquitetura modular)
- PostgreSQL (dados relacionais)
- Prisma ORM (type-safe)
- Redis (cache e sessions)
- Socket.io (WebSocket)
- JWT (autenticação)

**DevOps:**
- Docker (containers)
- GitHub Actions (CI/CD)
- Sentry (monitoramento de erros)
- Grafana (métricas)

---

## ⚠️ Riscos e Mitigações

### Risco 1: Perda de Dados
**Mitigação:**
- Backups automáticos diários
- Testes extensivos antes de migrar
- Manter Firebase em paralelo por 30 dias

### Risco 2: Downtime
**Mitigação:**
- Deploy gradual (5% → 100%)
- Feature flags para rollback rápido
- Monitoramento 24/7

### Risco 3: Performance
**Mitigação:**
- Testes de carga antes do deploy
- Cache com Redis
- CDN para assets estáticos

### Risco 4: Bugs em Produção
**Mitigação:**
- Code review obrigatório
- Testes automatizados
- Sentry para captura de erros

---

## ✅ Conclusão

Este plano de migração completo leva de **14 a 18 semanas** e resulta em:

1. **Controle Total** - API própria, sem dependências externas
2. **Redução de Custos** - ~70% mais barato que Firebase
3. **Escalabilidade** - Arquitetura moderna e escalável
4. **Performance** - Otimizado para o seu caso de uso
5. **Funcionalidades** - Todos os recursos do Firebase replicados

**Pronto para começar?** Siga o passo a passo e boa sorte! 🚀

---

**Data de Criação:** 09/12/2025
**Versão:** 1.0
**Última Atualização:** 09/12/2025
