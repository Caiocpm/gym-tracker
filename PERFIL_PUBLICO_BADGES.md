# 🏆 Sistema de Perfil Público e Badges - Documentação Completa

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Tipos de Dados](#tipos-de-dados)
4. [Sistema de Badges](#sistema-de-badges)
5. [Estatísticas do Usuário](#estatísticas-do-usuário)
6. [Sistema de Privacidade](#sistema-de-privacidade)
7. [Como Usar](#como-usar)
8. [Firestore Collections](#firestore-collections)

---

## 🎯 Visão Geral

O sistema de Perfil Público e Badges transforma o gym-tracker em uma **rede social fitness completa**, onde usuários podem:

- ✅ Ver estatísticas detalhadas de seus treinos
- 🏆 Ganhar badges ao completar desafios
- 📊 Acompanhar progresso de composição corporal
- 🔒 Controlar quem vê suas informações
- 👥 Compartilhar conquistas com outros membros

---

## 🏗️ Arquitetura do Sistema

### Componentes Principais

```
src/
├── types/social.ts                      # Tipos TypeScript
├── hooks/
│   ├── useUserBadges.ts                # Gerenciamento de badges
│   ├── useUserStats.ts                 # Cálculo de estatísticas
│   └── useGroupChallenges.ts           # Desafios (atualizado)
├── components/Profile/
│   ├── PublicProfile/                  # Página principal do perfil
│   ├── BadgeGallery/                   # Galeria de badges
│   ├── UserStatsDisplay/               # Display de estatísticas
│   └── PrivacySettings/                # Configurações de privacidade
```

---

## 📦 Tipos de Dados

### UserChallengeBadge
Badge conquistado por um usuário ao completar um desafio.

```typescript
interface UserChallengeBadge {
  id: string;
  userId: string;
  badgeId: string;
  badgeName: string;              // "Badge de Força 💪"
  badgeIcon: string;              // "🏋️"
  badgeCategory: ChallengeType;   // "volume" | "consistency" | ...
  badgeRarity: "common" | "rare" | "epic" | "legendary";
  challengeId?: string;           // ID do desafio que desbloqueou
  challengeTitle?: string;        // "Desafio de Volume 30 Dias"
  earnedAt: string;               // ISO timestamp
}
```

### UserStats
Estatísticas completas do usuário calculadas a partir de todos os dados.

```typescript
interface UserStats {
  // Treinos
  totalWorkouts: number;
  totalExercises: number;
  totalSets: number;
  totalReps: number;
  totalVolumeLifted: number;      // kg total

  // Tempo
  totalWorkoutTime: number;       // minutos
  averageWorkoutDuration: number;
  longestStreak: number;          // dias consecutivos
  currentStreak: number;

  // Recordes
  totalPersonalRecords: number;
  strongestLift: {
    exerciseName: string;
    weight: number;
    date: string;
  } | null;
  highestVolume: {
    workoutName: string;
    volume: number;
    date: string;
  } | null;

  // Social
  totalGroups: number;
  totalChallengesJoined: number;
  totalChallengesCompleted: number;
  totalBadges: number;

  // Composição Corporal
  weightChange?: {
    start: number;
    current: number;
    change: number;
    unit: string;
  };
  bodyFatChange?: { ... };
  muscleMassChange?: { ... };

  // Metadata
  memberSince: string;
  lastWorkout?: string;
}
```

### ProfilePrivacySettings
Controles de privacidade para cada seção do perfil.

```typescript
type PrivacyLevel = "public" | "friends" | "private";

interface ProfilePrivacySettings {
  badges: PrivacyLevel;
  stats: PrivacyLevel;
  workoutHistory: PrivacyLevel;
  progressPhotos: PrivacyLevel;
  measurements: PrivacyLevel;
  groups: PrivacyLevel;
}
```

---

## 🏆 Sistema de Badges

### Como Funciona

#### 1. **Criação de Desafio**
Quando um administrador cria um desafio, pode definir uma `reward` (recompensa):

```typescript
// Exemplo: Criar desafio de volume
createChallenge({
  title: "Desafio de Volume",
  type: "volume",
  targetValue: 50000,
  reward: "Badge de Força 💪",  // ← Isso vira um badge
  // ...
});
```

#### 2. **Conquista Automática**
Quando um usuário completa o desafio (progress >= targetValue), o sistema **automaticamente**:

```typescript
// Hook: useGroupChallenges.ts - updateProgress()
if (justCompleted && challengeData.reward) {
  // 1. Determina raridade baseada na dificuldade
  const rarity = determineBadgeRarity(
    challengeData.type,        // "volume"
    challengeData.targetValue, // 50000
    challengeData.isCompetitive // true
  );

  // 2. Concede o badge
  await awardBadge(
    challengeData.reward,      // "Badge de Força 💪"
    "🏋️",                     // ícone baseado no tipo
    "volume",                  // categoria
    "rare",                    // raridade calculada
    challengeId,
    challengeData.title
  );
}
```

#### 3. **Cálculo de Raridade**

| Tipo de Desafio | Valor Alvo | Raridade |
|-----------------|-----------|----------|
| **Volume** | ≥ 100.000 kg | 🔶 Legendary |
| **Volume** | ≥ 50.000 kg | 🟣 Epic |
| **Volume** | < 50.000 kg | 🔵 Rare |
| **Consistência** | ≥ 25 dias | 🔶 Legendary |
| **Consistência** | ≥ 20 dias | 🟣 Epic |
| **Recordes** | ≥ 10 recordes | 🔶 Legendary |
| **Recordes** | ≥ 7 recordes | 🟣 Epic |
| **Colaborativo** | ≥ 500.000 kg | 🔶 Legendary |
| **Colaborativo** | ≥ 250.000 kg | 🟣 Epic |
| **Não-Competitivo** | qualquer | ⚪ Common |

#### 4. **Visualização**
Badges aparecem na galeria do perfil com:
- Ícone animado (float effect)
- Cor da borda baseada na raridade
- Informações do desafio
- Data de conquista

---

## 📊 Estatísticas do Usuário

### Como São Calculadas

O hook `useUserStats` automaticamente:

1. **Busca todos os treinos** do Firestore (`completedWorkouts`)
2. **Calcula métricas** em tempo real:
   - Volume total = soma de `weight × reps` de todos os sets
   - Recordes = conta sets com `isPersonalRecord: true`
   - Streaks = analisa dias únicos de treino consecutivos
3. **Busca dados sociais**:
   - Grupos que participa
   - Desafios participados/completados
   - Badges conquistados
4. **Extrai dados do perfil**:
   - Mudanças de peso/gordura/massa muscular
   - Compara primeira vs última medição

### Exemplo de Uso

```typescript
import { useUserStats } from '../hooks/useUserStats';

function MyComponent() {
  const { stats, loading, refreshStats } = useUserStats();

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <h2>Você já fez {stats.totalWorkouts} treinos!</h2>
      <p>Volume total: {stats.totalVolumeLifted / 1000}t</p>
      <p>Sequência atual: {stats.currentStreak} dias 🔥</p>
      <button onClick={refreshStats}>Atualizar</button>
    </div>
  );
}
```

---

## 🔒 Sistema de Privacidade

### Níveis de Privacidade

#### 🌍 Público
- Qualquer usuário autenticado pode ver
- Ideal para: badges, estatísticas gerais

#### 👥 Amigos
- Apenas membros dos mesmos grupos
- Ideal para: histórico de treinos, grupos

#### 🔒 Privado
- Apenas você pode ver
- Ideal para: medidas corporais, fotos de progresso

### Configuração

```typescript
import { PrivacySettings } from '../components/Profile/PrivacySettings';

<PrivacySettings
  settings={privacySettings}
  onSave={async (newSettings) => {
    // Salvar no Firestore
    await updateDoc(doc(db, 'privacySettings', userId), newSettings);
  }}
/>
```

---

## 🚀 Como Usar

### 1. Adicionar Perfil Público ao App

```typescript
// Em App.tsx ou Routes
import { PublicProfile } from './components/Profile/PublicProfile/PublicProfile';

<Route path="/profile" element={<PublicProfile />} />
```

### 2. Link para o Perfil

```typescript
// Em qualquer componente
<Link to="/profile">
  Ver Meu Perfil 👤
</Link>
```

### 3. Testar Sistema de Badges

```typescript
// 1. Criar um desafio no grupo
createChallenge({
  title: "Teste de Badge",
  type: "volume",
  targetValue: 100,  // Meta baixa para teste
  reward: "Badge de Teste 🎯",
  // ...
});

// 2. Participar do desafio
joinChallenge(challengeId);

// 3. Atualizar progresso para completar
updateProgress(challengeId, userId, 100);

// 4. Badge será automaticamente concedido! 🎉
```

### 4. Ver Badges Conquistados

```typescript
import { useUserBadges } from '../hooks/useUserBadges';

const { getUserBadges } = useUserBadges();
const badges = await getUserBadges();
// badges = [{ badgeName: "Badge de Teste 🎯", ... }]
```

---

## 🗄️ Firestore Collections

### `userBadges`
Armazena todos os badges conquistados.

```json
{
  "userId": "user123",
  "badgeId": "badge_1701234567890",
  "badgeName": "Badge de Força 💪",
  "badgeIcon": "🏋️",
  "badgeCategory": "volume",
  "badgeRarity": "epic",
  "challengeId": "challenge123",
  "challengeTitle": "Desafio de Volume 30 Dias",
  "earnedAt": "2024-12-02T10:30:00.000Z"
}
```

**Índices necessários:**
- `userId` (usado em queries)
- `userId + challengeId` (evitar badges duplicados)

### `privacySettings`
Configurações de privacidade de cada usuário.

```json
{
  "badges": "public",
  "stats": "public",
  "workoutHistory": "friends",
  "progressPhotos": "friends",
  "measurements": "private",
  "groups": "public"
}
```

### `publicProfiles` (Opcional - Futuro)
Cache de perfis públicos para performance.

---

## 🎨 Personalização de Badges

### Adicionar Novos Ícones por Tipo

Em `useGroupChallenges.ts`:

```typescript
function getBadgeIconForType(type: ChallengeType): string {
  switch (type) {
    case "volume":
      return "🏋️";
    case "consistency":
      return "🔥";
    case "my_new_type":  // ← Adicionar aqui
      return "🚀";
    default:
      return "🎯";
  }
}
```

### Customizar Cores de Raridade

Em `BadgeGallery.module.css`:

```css
.rarityBadge[data-rarity="legendary"] {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
}

.rarityBadge[data-rarity="mythic"] {  /* Nova raridade */
  background: linear-gradient(135deg, #FF00FF 0%, #8B00FF 100%);
}
```

---

## ✅ Checklist de Implementação

- ✅ Tipos criados em `social.ts`
- ✅ Hook `useUserBadges` implementado
- ✅ Hook `useUserStats` implementado
- ✅ Componente `BadgeGallery` criado
- ✅ Componente `UserStatsDisplay` criado
- ✅ Componente `PublicProfile` criado
- ✅ Componente `PrivacySettings` criado
- ✅ Sistema de conquista automática integrado
- ✅ Regras Firestore atualizadas
- ✅ TypeScript compilando sem erros

---

## 🚧 Próximos Passos (Opcional)

1. **Sistema de Amizades**: Implementar relações de amizade para usar no controle de privacidade "friends"
2. **Notificações**: Notificar usuário quando ganha um badge
3. **Ranking Global**: Leaderboard com os usuários com mais badges/melhores stats
4. **Badges Especiais**: Criar badges independentes de desafios (ex: "1 ano de membro", "100 treinos")
5. **Compartilhamento**: Compartilhar badges nas redes sociais
6. **Perfis de Outros Usuários**: Ver perfil público de outros membros

---

## 🎯 Resumo

✅ **Sistema Completo de Badges**
- Conquista automática ao completar desafios
- 4 níveis de raridade baseados na dificuldade
- Galeria visual com animações

✅ **Estatísticas Detalhadas**
- Métricas de treinos, consistência e recordes
- Integração com dados de composição corporal
- Cálculo automático de streaks

✅ **Controle de Privacidade**
- 3 níveis: público, amigos, privado
- Granularidade por seção do perfil
- Interface visual intuitiva

✅ **Perfil Público Completo**
- Header com avatar e quick stats
- Tabs para estatísticas, badges e privacidade
- Design responsivo e moderno

🎉 **O sistema está pronto para uso!**
