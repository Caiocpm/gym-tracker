# 📊 Guia de Métricas e Alertas - Área Profissional

## 🎯 O que significam as métricas?

### 📈 Tendência de Volume

Compara o volume total de treino (peso × repetições) do último mês com o mês anterior.

**Valores possíveis:**

- **📈 Crescendo** (Verde)
  - Volume atual é **10%+ maior** que o mês anterior
  - **Exemplo:** Mês passado levantou 10.000kg, este mês 11.500kg (+15%)
  - **Significa:** Aluno está progredindo! Aumentando cargas ou repetições
  - **Ação:** Continue acompanhando e parabenize o aluno

- **➡️ Estável** (Cinza)
  - Volume está **praticamente igual** (variação menor que ±10%)
  - **Exemplo:** Mês passado 10.000kg, este mês 10.200kg (+2%)
  - **Significa:** Aluno mantém o mesmo nível de treino
  - **Ação:** Considere aumentar a intensidade gradualmente

- **📉 Decrescendo** (Vermelho)
  - Volume atual é **10%+ menor** que o mês anterior
  - **Exemplo:** Mês passado 10.000kg, este mês 8.500kg (-15%)
  - **Significa:** Pode estar treinando menos ou com cargas menores
  - **Ação:** Investigue o motivo - pode ser lesão, cansaço ou desmotivação

### ⚖️ Renovação do Treino

Indica há quantos dias o programa de treino atual foi criado e se precisa ser renovado.

**Valores possíveis:**

- **✅ OK** (Verde)
  - Treino foi criado **há menos de 25 dias**
  - **Significa:** Ainda está dentro do prazo ideal (4-6 semanas)
  - **Ação:** Continue acompanhando normalmente

- **⚠️ Necessária** (Laranja/Vermelho)
  - Treino foi criado **há 25+ dias**
  - **Significa:** Está próximo ou passou de 30 dias (1 mês)
  - **Por quê renovar?**
    - Evita **platô de progresso**
    - Previne **adaptação excessiva**
    - Mantém **motivação alta**
    - Permite ajustar **cargas e volumes**
  - **Ação:** Renove o programa de treino

---

## 🔔 Sistema de Alertas

### Como funcionam os alertas?

Os alertas são gerados **automaticamente** baseado nos dados dos alunos. Eles aparecem no topo do dashboard agrupados por prioridade.

### Tipos de Alertas

#### 1. 😴 Aluno Inativo
**Quando aparece:** Aluno não treina há **7+ dias**

**Severidade:**
- **Atenção** (Laranja): 7-13 dias sem treinar
- **Urgente** (Vermelho): 14+ dias sem treinar

**O que fazer:**
- Entrar em contato com o aluno
- Perguntar se está tudo bem
- Oferecer suporte e motivação
- Verificar se há algum impedimento

**Exemplo de alerta:**
```
Aluno inativo
Sem treinar há 10 dias. Entre em contato para motivar!
```

---

#### 2. 📅 Treino Próximo de Renovação
**Quando aparece:** Treino criado há **25+ dias**

**Severidade:** Atenção (Laranja)

**O que fazer:**
- Agendar renovação do treino
- Avaliar progressos
- Ajustar exercícios, cargas e volumes
- Criar novo programa de 4-6 semanas

**Exemplo de alerta:**
```
Treino próximo de renovação
Treino criado há 28 dias. Considere renovar o programa.
```

---

#### 3. 📏 Medidas Corporais Atrasadas
**Quando aparece:** Última medição há **30+ dias**

**Severidade:** Info (Azul)

**O que fazer:**
- Agendar avaliação física
- Registrar novas medidas:
  - Peso
  - Percentual de gordura
  - Circunferências
  - Fotos de progresso

**Exemplo de alerta:**
```
Medidas corporais atrasadas
Última medição há 35 dias. Agende uma avaliação.
```

---

#### 4. 🍎 Nutrição Inativa
**Quando aparece:** Sem registrar refeições há **7+ dias**

**Severidade:** Info (Azul)

**O que fazer:**
- Lembrar o aluno de registrar alimentação
- Verificar se está seguindo o plano nutricional
- Oferecer orientações sobre nutrição
- Ajustar plano se necessário

**Exemplo de alerta:**
```
Registro nutricional parado
Sem registrar refeições há 8 dias.
```

---

#### 5. 🏋️ Volume Excessivo (Overtraining)
**Quando aparece:** Treinou **10+ dias consecutivos** sem descanso

**Severidade:** Atenção (Laranja)

**O que fazer:**
- **ATENÇÃO!** Risco de overtraining
- Orientar sobre importância do descanso
- Verificar se está descansando adequadamente
- Sugerir dias de rest (repouso ativo)
- Monitorar sinais de fadiga

**Sinais de overtraining:**
- Fadiga constante
- Queda de performance
- Dores persistentes
- Desmotivação
- Sono ruim

**Exemplo de alerta:**
```
Possível overtraining
Treinou 12 dias consecutivos. Verifique se está descansando adequadamente.
```

---

## 📊 Métricas Detalhadas dos Alunos

### Adesão
- **Taxa Semanal:** % de treinos completados na semana (ideal: 80%+)
- **Taxa Mensal:** % de treinos completados no mês (ideal: 80%+)
- **Sequência Atual:** Dias consecutivos treinando
- **Maior Sequência:** Record de dias consecutivos
- **Último Treino:** Há quantos dias treinou

**Cores:**
- 🟢 Verde (80-100%): Excelente adesão
- 🟠 Laranja (60-79%): Adesão moderada - precisa motivação
- 🔴 Vermelho (0-59%): Baixa adesão - requer intervenção

### Performance
- **Total de Treinos:** Treinos completados desde o início
- **Duração Média:** Tempo médio por sessão
- **Volume Total:** Soma de peso × reps de todos os treinos (kg)
- **Tendência:** Se o volume está crescendo, estável ou decrescendo

### Frequência
- **Treinos/Semana:** Média semanal
- **Treinos Este Mês:** Total no mês atual
- **Dias Preferidos:** Dias da semana que mais treina

### Composição Corporal
- **Peso Atual:** Última medição
- **Variação 30 dias:** Mudança nos últimos 30 dias
- **Variação 90 dias:** Mudança nos últimos 90 dias
- **Gordura Corporal:** % BF e variação (se disponível)

---

## 🧪 Dados de Teste

Ao clicar em **"🌱 Dados de Teste"**, são criados:

### 10 Alunos com Cenários Variados:

1. **Maria Silva** - Aluna ativa ✅
   - Treina regularmente (5 sessões nos últimos 10 dias)
   - **SEM alertas**

2. **Pedro Santos** - Inativo moderado 😴
   - Último treino há 8 dias
   - **ALERTA:** Inativo (Atenção - Laranja)

3. **Ana Costa** - Treino antigo 📅
   - Treino criado há 27 dias
   - **ALERTA:** Renovação necessária (Atenção - Laranja)

4. **Carlos Oliveira** - Overtraining 🏋️
   - Treinou 11 dias consecutivos
   - **ALERTA:** Volume excessivo (Atenção - Laranja)

5. **Juliana Pereira** - Medidas atrasadas 📏
   - Última medição há 33 dias
   - **ALERTA:** Avaliação necessária (Info - Azul)

6. **Roberto Almeida** - Inativo crítico ⚠️
   - Último treino há 15 dias
   - **ALERTA:** Inativo (Urgente - Vermelho)

7. **Fernanda Lima** - Aluna ativa ✅
   - Treina regularmente
   - **SEM alertas**

8. **Lucas Martins** - Múltiplos alertas ⚠️
   - Treino antigo (30 dias) + Inativo (9 dias)
   - **ALERTAS:** Renovação + Inatividade (Múltiplos)

9. **Camila Rodrigues** - Aluna ativa ✅
   - Treina com bom ritmo (6 sessões)
   - **SEM alertas**

10. **Rafael Costa** - Medidas muito atrasadas 📏
    - Última medição há 40 dias
    - **ALERTA:** Avaliação urgente (Info - Azul)

### 2 Convites Pendentes:
- João Silva
- Patricia Souza

---

## 💡 Dicas de Uso

### Para obter melhores insights:

1. **Acompanhe os alertas diariamente**
   - Eles aparecem automaticamente no dashboard
   - Alertas urgentes requerem ação imediata

2. **Expanda os cards regularmente**
   - Clique na seta (▼) para ver métricas detalhadas
   - Identifique padrões de comportamento

3. **Use as cores como guia**
   - Verde = Tudo certo, continue assim
   - Laranja = Precisa de atenção
   - Vermelho = Requer intervenção urgente

4. **Monitore a tendência de volume**
   - Crescendo = Progresso excelente
   - Estável = Pode precisar de ajustes
   - Decrescendo = Investigar causas

5. **Renove treinos regularmente**
   - A cada 4-6 semanas
   - Evita platô de resultados
   - Mantém motivação alta

6. **Acompanhe a composição corporal**
   - Medições mensais
   - Compare evolução de 30 e 90 dias
   - Ajuste estratégias conforme resultados

---

## 🎨 Legenda de Cores

### Alertas:
- 🔴 **Vermelho:** Urgente - Requer ação imediata
- 🟠 **Laranja:** Atenção - Precisa de acompanhamento
- 🔵 **Azul:** Info - Informativo

### Métricas:
- 🟢 **Verde (80-100%):** Excelente
- 🟠 **Laranja (60-79%):** Moderado
- 🔴 **Vermelho (0-59%):** Crítico

### Tendências:
- 📈 **Verde:** Crescendo (bom!)
- ➡️ **Cinza:** Estável (ok)
- 📉 **Vermelho:** Decrescendo (atenção!)

---

**Desenvolvido com ❤️ para profissionais de educação física**
