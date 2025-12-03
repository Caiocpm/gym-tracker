# 🏋️ WorkoutSettings - Guia Completo

## ✅ Implementação Completa!

O componente **WorkoutSettings** foi totalmente reescrito e agora oferece gerenciamento completo de treinos e exercícios!

---

## 🎯 Funcionalidades Implementadas

### 1. **Gerenciamento de Treinos (Workout Days)**

#### ➕ Adicionar Novo Treino
- Clique em "➕ Novo Treino"
- Digite o nome do treino (ex: "Treino A - Peito e Tríceps")
- Salve

**Características:**
- Limite de 7 treinos (A, B, C, D, E, F, G)
- Navegação automática é atualizada conforme você adiciona/remove treinos
- Labels geradas automaticamente (A, B, C...)

#### ✏️ Editar Treino Existente
- Clique em "✏️ Editar" no card do treino
- Modifique o nome
- Salve

#### 🗑️ Deletar Treino
- Clique em "🗑️" no card do treino
- Confirme a exclusão
- **Proteção**: Não permite deletar se só houver 1 treino

---

### 2. **Gerenciamento de Exercícios**

#### ➕ Adicionar Exercício a um Treino

**Passo 1: Selecionar Treino**
- Vá na aba "📊 Meus Treinos"
- Clique em "🏋️ Exercícios" no treino desejado
- Ou vá na aba "🏋️ Biblioteca de Exercícios" e selecione um treino

**Passo 2: Escolher Exercício da Biblioteca**
1. Clique em "➕ Adicionar Exercício"
2. Use os **filtros**:
   - 🔍 **Busca por nome**: Digite "supino", "rosca", etc.
   - 💪 **Grupo muscular**: Peito, Costas, Pernas, etc.
   - 🏋️ **Equipamento**: Livre, Barra, Halter, Máquina, etc.
3. Clique no exercício desejado

**Passo 3: Configurar Exercício**
Após selecionar, configure:
- **Séries Planejadas**: 1-10
- **Repetições Planejadas**: 1-100
- **Peso (kg)**: 0+
- **Tempo de Descanso**: 30-300 segundos
- **RPE Alvo**: 1-10 (intensidade percebida)
- **Notas**: Observações (ex: "Foco na técnica")
- **⏱️ Timer Automático**: Iniciar timer após completar série
- **📊 Métricas Avançadas**: Habilitar RPE, velocidade, etc.

**Passo 4: Salvar**
- Clique em "💾 Salvar Exercício"

#### ✏️ Editar Exercício
- Clique em "✏️" ao lado do exercício
- Modifique as configurações
- Salve

#### 🗑️ Deletar Exercício
- Clique em "🗑️" ao lado do exercício
- Confirme a exclusão

---

## 📚 Biblioteca de Exercícios

A biblioteca contém **centenas de exercícios** organizados por:

### Grupos Musculares
- 💪 Peito
- 🔙 Costas
- 🦾 Ombros
- 🦵 Pernas
- 🍑 Glúteos
- 💪 Braços
- 🧘 Abdômen
- ➕ Outro

### Equipamentos
- 🏃 **Livre**: Peso corporal, sem equipamento
- 🏋️ **Barra**: Supino, agachamento, etc.
- 🏋️ **Halter**: Exercícios com halteres
- 🔧 **Máquina**: Leg press, peck deck, etc.
- 🧰 **Cabo**: Cross over, pulldowns, etc.
- ⚙️ **Outro**: Smith machine, kettlebell, etc.

### Exemplos de Exercícios Disponíveis

**Peito:**
- Supino reto/inclinado/declinado (barra/halteres)
- Crucifixo (halter/máquina/cabo)
- Flexões (normal/diamante/inclinada/declinada)
- Dips para peito

**Costas:**
- Barra fixa (pronada/supinada/neutra)
- Remada (curvada/unilateral/cabo)
- Pulldown (frontal/pegada fechada)
- Deadlift (convencional/sumô)

**Pernas:**
- Agachamento (livre/frontal/búlgaro)
- Leg press
- Cadeira extensora/flexora
- Stiff
- Panturrilha (em pé/sentado)

**E muito mais!**

---

## 🎨 Interface do Usuário

### Aba "📊 Meus Treinos"

```
┌─────────────────────────────────────┐
│  Seus Treinos (3)    [➕ Novo Treino] │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────┐  ┌───────────┐     │
│  │    A      │  │    B      │     │
│  │ Treino A  │  │ Treino B  │     │
│  │ 5 exerc.  │  │ 4 exerc.  │     │
│  │           │  │           │     │
│  │ 1. Supino │  │ 1. Barra  │     │
│  │ 2. Crucif │  │ 2. Remada │     │
│  │ 3. Dips   │  │ 3. Rosca  │     │
│  │ +2 mais   │  │ 4. Marti  │     │
│  │           │  │           │     │
│  │ ✏️ Editar │  │ ✏️ Editar │     │
│  │ 🏋️ Exerc  │  │ 🏋️ Exerc  │     │
│  │     🗑️    │  │     🗑️    │     │
│  └───────────┘  └───────────┘     │
│                                     │
│  ┌─────────────────────────────┐  │
│  │  ➕ Adicionar Novo Treino   │  │
│  │ Você pode criar até 4 mais  │  │
│  └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Aba "🏋️ Biblioteca de Exercícios"

**Quando um treino está selecionado:**

```
┌─────────────────────────────────────────┐
│ Exercícios - Treino A                   │
│ ← Voltar          [➕ Adicionar Exerc]  │
├─────────────────────────────────────────┤
│                                         │
│ 1  Supino reto barra                    │
│    4 séries × 10 reps @ 80kg           │
│    Descanso: 2:00                       │
│    Foco na técnica          ✏️  🗑️      │
│                                         │
│ 2  Crucifixo halteres                   │
│    3 séries × 12 reps @ 20kg           │
│    Descanso: 1:30              ✏️  🗑️   │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Uso Típico

### Cenário 1: Criar um Novo Treino do Zero

1. Abra **💪 Treinos**
2. Clique no ícone **⚙️ Configurações** (canto superior direito)
3. Clique em "➕ Novo Treino"
4. Digite: "Treino D - Ombros e Trapézio"
5. Salve
6. Clique em "🏋️ Exercícios" no novo card
7. Clique em "➕ Adicionar Exercício"
8. **Filtrar**: Grupo muscular → "Ombros"
9. Selecione: "Desenvolvimento com barra"
10. Configure: 4 séries × 8 reps @ 40kg
11. Salve
12. Repita para adicionar mais exercícios
13. Feche

**Resultado:** Treino D aparece na navegação!

### Cenário 2: Modificar Exercício Existente

1. Abra **WorkoutSettings**
2. Vá em "Meus Treinos"
3. Clique em "🏋️ Exercícios" no treino desejado
4. Clique em "✏️" ao lado do exercício
5. Modifique peso, séries, reps, etc.
6. Salve
7. Feche

**Resultado:** Exercício atualizado no treino!

### Cenário 3: Reorganizar Treino

1. Abra **WorkoutSettings**
2. Delete exercícios indesejados (🗑️)
3. Adicione novos exercícios (➕)
4. Edite exercícios existentes (✏️)
5. Renomeie o treino se necessário (✏️ Editar no card)
6. Feche

---

## 💾 Persistência de Dados

Todos os dados são salvos **automaticamente** no **IndexedDB**:

- ✅ Criação de treinos
- ✅ Edição de treinos
- ✅ Exclusão de treinos
- ✅ Adição de exercícios
- ✅ Edição de exercícios
- ✅ Exclusão de exercícios

**Auto-save:** 1 segundo após qualquer modificação

**Verificar salvamento:**
1. Pressione **F12** (DevTools)
2. Vá em **Application** → **IndexedDB** → **GymTrackerDB**
3. Clique em **workoutDays**
4. Veja seus treinos salvos!

---

## 🎯 Recursos Avançados

### 1. **Filtros Inteligentes**

Ao adicionar exercícios, você pode combinar filtros:

**Exemplo:**
- Busca: "remada"
- Grupo: "Costas"
- Equipamento: "Barra"

**Resultado:** Apenas "Remada curvada barra" aparece!

### 2. **Preview de Treinos**

Cada card de treino mostra:
- Nome do treino
- Quantidade de exercícios
- Preview dos primeiros 3 exercícios
- Indicação de quantos mais há (+2 mais)

### 3. **Validações**

- ⚠️ Não pode deletar o último treino
- ⚠️ Não pode salvar exercício sem selecionar da biblioteca
- ⚠️ Limite de 7 treinos
- ⚠️ Confirmação antes de deletar

### 4. **Navegação Dinâmica**

A navegação entre treinos (A, B, C...) é atualizada automaticamente:

- **3 treinos** → Navegação mostra: A, B, C
- **Adiciona 1** → Navegação mostra: A, B, C, D
- **Deleta C** → Navegação mostra: A, B, D (renomeado para C)

---

## 📱 Responsividade

O componente é **totalmente responsivo**:

### Desktop (> 768px)
- Grid de 2-3 colunas
- Modais grandes (800px)
- Filtros horizontais

### Mobile (< 768px)
- Grid de 1 coluna
- Modais em tela cheia
- Filtros verticais
- Botões adaptados

---

## 🛠️ Tecnologias Utilizadas

- **React** + **TypeScript**
- **CSS Modules** (isolamento de estilos)
- **IndexedDB** via Dexie (persistência)
- **React Hooks** (useState, useCallback)
- **Context API** (WorkoutContext)

---

## 🔧 Manutenção e Extensibilidade

### Adicionar Novo Grupo Muscular

1. Vá em `src/data/exerciseDefinitions.ts`
2. Adicione ao `muscleGroupMap`
3. Adicione exercícios com o novo grupo

### Adicionar Novo Equipamento

1. Vá em `src/data/exerciseDefinitions.ts`
2. Adicione exercícios com o novo equipment
3. O filtro detectará automaticamente!

### Customizar Validações

Edite as funções em `WorkoutSettings.tsx`:
- `handleSaveWorkout()` - Validações de treino
- `handleSaveExercise()` - Validações de exercício

---

## 🐛 Debug

### Verificar State

```javascript
// No console (F12)
db.workoutDays.toArray().then(days => {
  console.log('Treinos:', days);
  days.forEach(day => {
    console.log(`${day.name}: ${day.exercises.length} exercícios`);
  });
});
```

### Verificar Exercícios de um Treino

```javascript
db.workoutDays
  .where('id')
  .equals('workout-a')
  .first()
  .then(day => console.table(day.exercises));
```

---

## ✅ Checklist de Teste

- [ ] Criar novo treino
- [ ] Renomear treino existente
- [ ] Deletar treino (com confirmação)
- [ ] Adicionar exercício usando busca
- [ ] Adicionar exercício usando filtro de grupo
- [ ] Adicionar exercício usando filtro de equipamento
- [ ] Editar exercício existente
- [ ] Deletar exercício (com confirmação)
- [ ] Verificar preview de treino no card
- [ ] Verificar navegação atualizada
- [ ] Recarregar página e confirmar persistência
- [ ] Testar no mobile (< 768px)

---

## 🎉 Resumo

O **WorkoutSettings** é agora um componente completo e profissional para gerenciamento de treinos!

### Você pode:
✅ Criar até 7 treinos personalizados
✅ Nomear treinos como quiser
✅ Adicionar quantos exercícios quiser
✅ Escolher de uma biblioteca com centenas de exercícios
✅ Filtrar exercícios por nome, grupo muscular e equipamento
✅ Configurar séries, reps, peso, descanso, RPE
✅ Editar e deletar treinos/exercícios
✅ Tudo salvo automaticamente no IndexedDB
✅ Interface responsiva e moderna

**🚀 Pronto para uso em produção!**
