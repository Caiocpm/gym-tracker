# Sistema de Desafios - Guia de Implementação Final

## 📋 Status Atual

### ✅ Componentes Criados
- `useGroupChallenges` hook
- `ChallengeCard` componente
- `CreateChallengeModal` modal
- Tipos completos em `social.ts`

### 🔨 Integração no GroupFeed

Adicione as seguintes funções após a função `cancelDelete` no arquivo `GroupFeed.tsx`:

```typescript
// ✅ Handlers para desafios
const handleCreateChallenge = async (challengeData: any) => {
  await createChallenge(
    group.id,
    challengeData.title,
    challengeData.description,
    challengeData.type,
    challengeData.targetValue,
    challengeData.targetUnit,
    challengeData.startDate,
    challengeData.endDate,
    challengeData.isCompetitive,
    challengeData.reward,
    challengeData.exerciseId,
    challengeData.exerciseName
  );
  setRefreshKey((prev) => prev + 1);
};

const handleJoinChallenge = async (challengeId: string) => {
  await joinChallenge(challengeId);
  setRefreshKey((prev) => prev + 1);
};

const handleDeleteChallengeClick = (challengeId: string) => {
  setChallengeToDelete(challengeId);
  setShowChallengeDeleteModal(true);
};

const confirmDeleteChallenge = async () => {
  if (!challengeToDelete) return;
  await deleteChallenge(challengeToDelete);
  setShowChallengeDeleteModal(false);
  setChallengeToDelete(null);
  setRefreshKey((prev) => prev + 1);
};
```

### 🎨 UI no GroupFeed

Após o header do grupo, adicione a seção de desafios:

```tsx
{/* Seção de Desafios */}
{isGroupAdmin && (
  <button
    className={styles.createChallengeButton}
    onClick={() => setShowCreateChallengeModal(true)}
  >
    🎯 Criar Desafio
  </button>
)}

{/* Desafios Ativos */}
{challenges.filter(c => c.status === 'active').length > 0 && (
  <div className={styles.challengesSection}>
    <h2 className={styles.sectionTitle}>🎯 Desafios Ativos</h2>
    <div className={styles.challengesGrid}>
      {challenges
        .filter(c => c.status === 'active')
        .map(challenge => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            currentUserId={userProfile?.uid}
            onJoin={() => handleJoinChallenge(challenge.id)}
            onDelete={
              isGroupAdmin
                ? () => handleDeleteChallengeClick(challenge.id)
                : undefined
            }
          />
        ))}
    </div>
  </div>
)}

{/* Modal de Criar Desafio */}
{showCreateChallengeModal && (
  <CreateChallengeModal
    groupId={group.id}
    onClose={() => setShowCreateChallengeModal(false)}
    onSubmit={handleCreateChallenge}
  />
)}
```

### 🎨 CSS Adicional

Adicione ao `GroupFeed.module.css`:

```css
/* Challenges Section */
.createChallengeButton {
  width: 100%;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 1.5rem;
  transition: all 0.3s;
}

.createChallengeButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
}

.challengesSection {
  margin-bottom: 2rem;
}

.sectionTitle {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 1rem;
}

.challengesGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .challengesGrid {
    grid-template-columns: 1fr;
  }
}
```

## 🔄 Auto-Tracking de Progresso

### Como Implementar

Crie um hook `useChallen geAutoTracking.ts`:

```typescript
import { useEffect } from 'react';
import { useGroupChallenges } from './useGroupChallenges';
import { useWorkout } from '../contexts/WorkoutContext';

export function useChallengeAutoTracking(groupId: string, userId: string) {
  const { getGroupChallenges, updateProgress } = useGroupChallenges();
  const { state } = useWorkout();

  useEffect(() => {
    const checkChallenges = async () => {
      const challenges = await getGroupChallenges(groupId);
      const activeChallenges = challenges.filter(c => c.status === 'active');

      activeChallenges.forEach(async (challenge) => {
        const participant = challenge.participants.find(p => p.userId === userId);
        if (!participant) return;

        let newProgress = 0;

        switch (challenge.type) {
          case 'volume':
            newProgress = state.loggedExercises.reduce((sum, ex) => sum + ex.volume, 0);
            break;

          case 'consistency':
            const uniqueDays = new Set(
              state.workoutSessions.map(s => s.date.split('T')[0])
            );
            newProgress = uniqueDays.size;
            break;

          case 'records':
            // Contar recordes batidos
            newProgress = state.loggedExercises.filter(ex => {
              // Lógica para verificar se é recorde
              return false; // Implementar
            }).length;
            break;
        }

        if (newProgress !== participant.progress) {
          await updateProgress(challenge.id, userId, newProgress);
        }
      });
    };

    checkChallenges();
  }, [state.loggedExercises, state.workoutSessions]);
}
```

## 🏅 Sistema de Badges

### Badges Pré-definidos

Crie `badgeDefinitions.ts`:

```typescript
export const badgeDefinitions = [
  {
    id: 'volume-bronze',
    name: 'Força Bronze',
    icon: '🥉',
    category: 'volume',
    requirement: 'Levante 10.000kg total',
  },
  {
    id: 'volume-silver',
    name: 'Força Prata',
    icon: '🥈',
    category: 'volume',
    requirement: 'Levante 50.000kg total',
  },
  {
    id: 'volume-gold',
    name: 'Força Ouro',
    icon: '🥇',
    category: 'volume',
    requirement: 'Levante 100.000kg total',
  },
  {
    id: 'consistency-7',
    name: 'Disciplina 7',
    icon: '🔥',
    category: 'consistency',
    requirement: 'Treine 7 dias seguidos',
  },
  {
    id: 'consistency-30',
    name: 'Mestre da Consistência',
    icon: '🔥',
    category: 'consistency',
    requirement: 'Treine 30 dias seguidos',
  },
];
```

## 🧪 Testes

### Comandos de Build

```bash
# Verificar erros de TypeScript
npm run build

# Ou apenas verificar tipos
npx tsc --noEmit
```

### Testar no Firebase

1. Criar um grupo de teste
2. Criar diferentes tipos de desafios
3. Participar e verificar progresso
4. Testar ranking para desafios competitivos

## 📝 Próximos Passos (Opcionais)

1. **Notificações**: Avisar quando alguém completa desafio
2. **Histórico**: Mostrar desafios completados
3. **Templates**: Mais templates pré-configurados
4. **Estatísticas**: Dashboard de desafios do grupo
5. **Compartilhamento**: Compartilhar conquistas nos posts

## 🐛 Troubleshooting

### Erro: "Cannot read property 'uid' of undefined"
- Verificar se userProfile está disponível antes de usar

### Erro: Firestore permission denied
- Configurar regras do Firebase para permitir leitura/escrita em `groupChallenges`

### Progress não atualiza
- Verificar se o userId está correto
- Confirmar que o usuário está participando do desafio

## ✅ Checklist Final

- [ ] Hook useGroupChallenges funcionando
- [ ] ChallengeCard renderizando corretamente
- [ ] CreateChallengeModal abrindo e criando desafios
- [ ] Integração completa no GroupFeed
- [ ] CSS aplicado e responsivo
- [ ] Auto-tracking implementado (opcional)
- [ ] Sistema de badges (opcional)
- [ ] Testes de build passando
- [ ] Firestore rules configuradas

---

**Implementação Base Completa!** 🎉

O sistema está pronto para uso básico. Expanda conforme necessário!
