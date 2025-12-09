# Changelog - Migração da Área Profissional para API Própria

## Resumo

O Firebase foi completamente removido da **Área Profissional** do Gym Tracker. Todas as operações agora são realizadas através de uma API REST própria.

## Data
2025-12-08

---

## Mudanças Implementadas

### ✅ 1. Serviço de API Criado

**Arquivo:** `src/services/professionalApi.ts`

- Centraliza todas as chamadas de API relacionadas à área profissional
- Organizado em módulos: `profile`, `students`, `invitations`, `tags`, `notes`, `goals`, `evaluations`, `stats`
- Inclui helper `apiRequest()` para gerenciar requisições HTTP
- Suporta autenticação via Bearer Token
- URL configurável via variável de ambiente `VITE_PROFESSIONAL_API_URL`

### ✅ 2. Context Atualizado

**Arquivo:** `src/contexts/ProfessionalContext.tsx`

**Removido:**
- Imports do Firebase Firestore
- Chamadas diretas ao `firestore` (setDoc, getDoc, getDocs, etc.)

**Substituído por:**
- Chamadas à API através do serviço `professionalApi`
- Mantém cache local no IndexedDB
- Estratégia: IndexedDB primeiro, depois API para sincronizar

**Funções atualizadas:**
- `loadProfessionalProfile()` - Busca perfil na API
- `registerAsProfessional()` - Registra via API
- `updateProfessionalProfile()` - Atualiza via API
- `inviteStudent()` - Cria convite via API
- `acceptInvitation()` - Aceita convite via API
- `rejectInvitation()` - Rejeita convite via API
- `unlinkStudent()` - Desvincula aluno via API
- `loadStudentLinks()` - Carrega alunos via API
- `loadPendingInvitations()` - Carrega convites via API

### ✅ 3. Hooks Atualizados

#### `src/hooks/useTags.ts`
- ❌ Removido: Firebase Firestore
- ✅ Adicionado: `professionalApi.tags`
- Funções: `loadTags()`, `createTag()`, `deleteTag()`, `addTagToStudent()`, `removeTagFromStudent()`

#### `src/hooks/useStudentNotes.ts`
- ❌ Removido: Firebase Firestore
- ✅ Adicionado: `professionalApi.notes`
- Funções: `loadStudentNotes()`, `createNote()`, `updateNote()`, `deleteNote()`

#### `src/hooks/useStudentGoals.ts`
- ❌ Removido: Firebase Firestore
- ✅ Adicionado: `professionalApi.goals`
- Funções: `loadStudentGoals()`, `createGoal()`, `updateGoal()`, `deleteGoal()`

#### `src/hooks/useEvaluationSchedule.ts`
- ❌ Removido: Firebase Firestore
- ✅ Adicionado: `professionalApi.evaluations`
- Funções: `loadEvaluations()`, `createEvaluation()`, `updateEvaluation()`, `deleteEvaluation()`

#### `src/hooks/useProfessionalStats.ts`
- ❌ Removido: Firebase Firestore
- ✅ Adicionado: `professionalApi.stats`
- Funções: `loadStats()`

### ✅ 4. Documentação

**Arquivo:** `PROFESSIONAL_API.md`

- Documentação completa da API
- Todos os endpoints necessários
- Exemplos de requisições e respostas
- Códigos de status HTTP
- Tipos de dados
- Recomendações para implementação backend

### ✅ 5. Configuração

**Arquivo:** `.env`

Adicionada variável de ambiente:
```env
VITE_PROFESSIONAL_API_URL=http://localhost:3000/api/professional
```

---

## Arquivos Modificados

```
✅ src/services/professionalApi.ts (NOVO)
✅ src/contexts/ProfessionalContext.tsx (MODIFICADO)
✅ src/hooks/useTags.ts (MODIFICADO)
✅ src/hooks/useStudentNotes.ts (MODIFICADO)
✅ src/hooks/useStudentGoals.ts (MODIFICADO)
✅ src/hooks/useEvaluationSchedule.ts (MODIFICADO)
✅ src/hooks/useProfessionalStats.ts (MODIFICADO)
✅ .env (MODIFICADO)
✅ PROFESSIONAL_API.md (NOVO)
✅ CHANGELOG_PROFESSIONAL_API.md (NOVO)
```

---

## Arquivos NÃO Modificados

A seguir, os arquivos que **NÃO foram alterados** pois não fazem parte da Área Profissional:

- `src/components/*` (exceto componentes específicos da área profissional)
- `src/contexts/AuthContext.tsx` (continua usando Firebase Auth)
- `src/contexts/WorkoutContext.tsx` (continua usando IndexedDB)
- `src/contexts/NutritionContext.tsx` (continua usando IndexedDB)
- Outras funcionalidades do app (treinos, nutrição, grupos, etc.)

---

## Firebase - O Que Permanece

O Firebase **ainda é usado** para:

1. **Autenticação (Firebase Auth)**
   - Login/Logout
   - Cadastro de usuários
   - Recuperação de senha

2. **Grupos e Social (Firebase Firestore)**
   - Posts em grupos
   - Comentários
   - Likes
   - Notificações de grupos

3. **Notificações Push (Firebase Cloud Messaging)**
   - Notificações em tempo real
   - Background notifications

---

## Próximos Passos

### Backend da API

Você precisa implementar a API REST. Recomendações:

1. **Stack Sugerida:**
   - Node.js + Express
   - Prisma ORM
   - PostgreSQL ou MySQL
   - JWT para autenticação

2. **Endpoints Necessários:**
   - ✅ Todos documentados em `PROFESSIONAL_API.md`

3. **Deploy:**
   - Vercel, Railway, Render, ou AWS
   - Configure a URL em `.env`: `VITE_PROFESSIONAL_API_URL`

### Testes

1. Teste localmente com a API rodando em `http://localhost:3000/api/professional`
2. Verifique se todas as operações funcionam:
   - Registro de profissional
   - Convite de alunos
   - Criação de tags, notas, metas, avaliações
   - Visualização de estatísticas

### Deploy

1. Implemente o backend
2. Configure a URL de produção em `.env`
3. Teste em produção

---

## Breaking Changes

⚠️ **Atenção:** Esta mudança é **incompatível** com a versão anterior que usava Firebase.

**Dados Existentes no Firebase:**
- Os dados da área profissional que estavam no Firebase **NÃO serão migrados automaticamente**
- Você precisará criar um script de migração se quiser manter dados antigos
- Considere começar com dados limpos na nova API

**IndexedDB:**
- Os dados locais no IndexedDB continuam funcionando como cache
- Eles serão sincronizados com a nova API

---

## Suporte

Se você tiver dúvidas sobre a implementação da API, consulte:

1. `PROFESSIONAL_API.md` - Documentação completa da API
2. `src/services/professionalApi.ts` - Código de referência do frontend
3. `src/types/professional.ts` - Tipos de dados TypeScript

---

## Contribuições

Implementado por: Claude (Anthropic)
Data: 2025-12-08
Versão: 1.0.0
