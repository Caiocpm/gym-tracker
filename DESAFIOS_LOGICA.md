# Lógica dos Desafios - Explicação Detalhada

## 🎯 Tipos de Desafios Disponíveis

### 1. **🏋️ Volume Total**
- **Meta**: Levantar X kg de volume total no período
- **Exemplo**: "Levante 50.000kg em 30 dias"
- **Como funciona**:
  - Soma de todos os pesos levantados (reps × peso) em todos os treinos
  - Progresso individual de cada participante
  - Ideal para competições de força

### 2. **🔥 Consistência** ⭐
- **Meta**: Treinar X dias no período
- **Exemplo**: "Treine 15 dias em 30 dias"
- **Como funciona**:
  - **FLEXÍVEL**: Cada pessoa treina no seu ritmo!
  - Conta **dias únicos** que você treinou, não importa quantos treinos fez no dia
  - Se você treinar 3x/semana, sua meta pode ser 12 dias em 30 dias
  - Se você treinar 6x/semana, sua meta pode ser 24 dias em 30 dias
  - **Não é competitivo por padrão** - cada um tem sua rotina

**Exemplo prático:**
```
Período: 01/12 a 31/12 (30 dias)
Meta: 15 dias de treino

Usuário A (treina 3x/semana):
- Semana 1: Seg, Qua, Sex (3 dias)
- Semana 2: Seg, Qua, Sex (3 dias)
- Semana 3: Seg, Qua, Sex (3 dias)
- Semana 4: Seg, Qua, Sex (3 dias)
Total: 12 dias ❌ (não atingiu a meta)

Usuário B (treina 6x/semana):
- Semana 1: Seg, Ter, Qua, Qui, Sex, Sáb (6 dias)
- Semana 2: Seg, Ter, Qua, Qui, Sex, Sáb (6 dias)
- Semana 3: apenas 3 dias (viagem)
Total: 15 dias ✅ (atingiu a meta!)
```

### 3. **🏆 Recordes**
- **Meta**: Bater X recordes pessoais no período
- **Exemplo**: "Bata 5 recordes pessoais"
- **Como funciona**:
  - Sistema automático detecta quando você supera seu recorde anterior
  - Pode ser recorde de peso OU volume em qualquer exercício
  - Cada recorde conta +1 para o desafio

### 4. **💪 Exercício Específico**
- **Meta**: Melhorar X kg em um exercício específico
- **Exemplo**: "Melhore 10kg no Supino Reto"
- **Como funciona**:
  - Compara seu peso máximo atual vs peso máximo no início do desafio
  - Acompanha apenas UM exercício escolhido
  - Ideal para focar em evoluir um movimento específico

### 5. **👥 Coletivo**
- **Meta**: Grupo todo junto atingir X kg de volume
- **Exemplo**: "Juntos levantemos 500.000kg"
- **Como funciona**:
  - **Soma de todos os participantes**
  - Todo mundo contribui para a mesma meta
  - Não é competitivo - é colaborativo!
  - Incentiva trabalho em equipe

---

## ⚙️ Como o Progresso é Atualizado

### Atualização Automática (Futuro)
O sistema pode ser configurado para atualizar automaticamente quando:
1. Usuário completa um treino
2. Sistema calcula:
   - Volume total (para desafios de Volume e Coletivo)
   - Dias únicos treinados (para Consistência)
   - Recordes batidos (para Recordes)
   - Máximo no exercício (para Exercício)
3. Atualiza o progresso do participante no desafio

### Atualização Manual (Atual)
Por enquanto, use a função `updateProgress()` do hook:
```typescript
await updateProgress(challengeId, userId, newProgressValue);
```

---

## 📊 Ranking e Competitividade

### Desafios Competitivos
- Volume Total ✅
- Recordes ✅
- Exercício ✅

**Mostram ranking** dos participantes ordenados por progresso.

### Desafios Colaborativos
- Consistência ❌ (cada um no seu ritmo)
- Coletivo ❌ (todos juntos pela mesma meta)

**Não mostram ranking** - foco é completar a meta pessoal ou coletiva.

---

## 💡 Dicas de Uso

### Para Consistência:
- Defina metas realistas baseadas na rotina do grupo
- Para iniciantes: 12-15 dias em 30 dias
- Para avançados: 20-25 dias em 30 dias
- Lembre que é sobre **constância**, não frequência absoluta

### Para Volume:
- Meta baixa (iniciantes): 20.000-30.000kg/mês
- Meta média (intermediários): 50.000-80.000kg/mês
- Meta alta (avançados): 100.000+kg/mês

### Para Recordes:
- Meta conservadora: 3-5 recordes/mês
- Meta desafiadora: 8-10 recordes/mês

### Para Exercício:
- Meta realista: +5-10kg em exercícios principais
- Considere o nível do grupo ao definir

### Para Coletivo:
- Multiplique a meta individual pelo número de membros ativos
- Exemplo: 10 membros × 50.000kg = 500.000kg coletivo
