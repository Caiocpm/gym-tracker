# 👨‍⚕️ Área Profissional - GymTracker

## 📋 Visão Geral

A **Área Profissional** é uma funcionalidade completa que permite que profissionais de educação física, nutricionistas, fisioterapeutas e preparadores físicos gerenciem múltiplos alunos através do GymTracker.

## ✨ Funcionalidades Principais

### Para Profissionais:

1. **Cadastro Profissional**
   - Registro com dados profissionais (CREF, CRN, CREFITO)
   - Especialidades customizáveis
   - Perfil profissional completo

2. **Gerenciamento de Alunos**
   - Convidar alunos por email
   - Definir níveis de acesso (Total, Treinos, Nutrição, Analytics)
   - Vincular/desvincular alunos
   - Acompanhar múltiplos alunos

3. **Alternância de Contexto**
   - Modo Pessoal: Usar o app para si mesmo
   - Modo Profissional: Gerenciar alunos
   - Visualização individual de cada aluno

4. **Controle Total**
   - Montar treinos personalizados para alunos
   - Criar dietas customizadas
   - Acompanhar analytics e evolução
   - Gerenciar todas as funcionalidades do app

### Para Alunos:

1. **Vinculação Simples**
   - Receber convite por email
   - Aceitar via código de convite
   - Manter autonomia sobre seus dados

2. **Colaboração**
   - Permitir que o profissional acompanhe progresso
   - Receber treinos e dietas personalizadas
   - Manter controle sobre a vinculação

## 🚀 Como Usar

### Para Profissionais

#### 1. Criar Conta Profissional

1. Acesse `/professional-signup` ou clique em "Área Profissional" no canto superior direito
2. Preencha o formulário com:
   - Nome completo
   - Email
   - Telefone (opcional)
   - Senha
   - Tipo de profissional (Personal Trainer, Nutricionista, etc.)
   - Registro profissional (CREF, CRN, CREFITO)
   - Especialidades (mínimo 1)
3. Clique em "Criar Conta Profissional"

#### 2. Acessar Dashboard Profissional

1. Após o login, clique no botão "Área Profissional" no canto superior direito
2. Selecione "Dashboard Profissional"
3. Você verá:
   - Estatísticas (alunos ativos, convites pendentes)
   - Lista de alunos vinculados
   - Convites enviados

#### 3. Convidar Alunos

1. No Dashboard Profissional, clique em "+ Convidar Aluno"
2. Preencha:
   - Email do aluno
   - Nível de acesso:
     - **Acesso Total**: Treinos, Nutrição e Analytics
     - **Apenas Treinos**: Somente funcionalidades de treino
     - **Apenas Nutrição**: Somente funcionalidades de dieta
     - **Apenas Analytics**: Somente visualização de dados
   - Mensagem personalizada (opcional)
3. Clique em "Enviar Convite"
4. O aluno receberá um código de convite

#### 4. Alternar Entre Modos

**Modo Pessoal:**
- Clique em "Área Profissional" → "Meu Perfil Pessoal"
- Use o app normalmente para seus próprios treinos

**Modo Profissional (Dashboard):**
- Clique em "Área Profissional" → "Dashboard Profissional"
- Gerencie seus alunos

**Visualizar Aluno Específico:**
- Clique em "Área Profissional" → Selecione o aluno
- Todas as funcionalidades estarão disponíveis para esse aluno
- Você pode:
  - Montar treinos no WorkoutTracker
  - Criar dietas no NutritionTracker
  - Ver evolução no Analytics
  - Editar perfil e medidas

#### 5. Desvincular Aluno

1. No Dashboard Profissional, encontre o aluno
2. Clique em "Desvincular"
3. Confirme a ação

### Para Alunos

#### 1. Aceitar Convite do Profissional

1. Receba o código de convite do seu profissional
2. Faça login no GymTracker
3. Acesse a área de convites (funcionalidade a ser implementada na interface)
4. Insira o código de convite
5. Confirme a vinculação

> **Nota**: A interface para aceitar convites pode ser adicionada em Settings ou Profile posteriormente.

## 🗂️ Estrutura Técnica

### Arquivos Criados/Modificados

```
src/
├── types/
│   └── professional.ts                          # Tipos TypeScript
├── contexts/
│   └── ProfessionalContext.tsx                  # Context e Provider
├── hooks/
│   └── useProfessional.ts                       # Hook customizado
├── components/
│   ├── ProfessionalAccess/
│   │   ├── ProfessionalAccess.tsx              # Componente do header
│   │   └── ProfessionalAccess.module.css
│   └── ProfessionalDashboard/
│       ├── ProfessionalDashboard.tsx           # Dashboard principal
│       └── ProfessionalDashboard.module.css
├── pages/
│   └── Auth/
│       └── ProfessionalSignup.tsx              # Página de cadastro
├── db/
│   └── database.ts                              # Tabelas IndexedDB
└── App.tsx                                      # Integração principal
```

### Banco de Dados

#### IndexedDB (Local)
- `professionalProfiles`: Perfis profissionais
- `studentLinks`: Vinculações ativas
- `studentInvitations`: Convites pendentes

#### Firestore (Cloud)
- Collection `professionals`: Dados profissionais públicos
- Collection `studentLinks`: Vinculações sincronizadas
- Collection `studentInvitations`: Convites compartilhados

### Tipos Principais

```typescript
// Tipo de profissional
type ProfessionalType =
  | 'personal_trainer'
  | 'nutricionista'
  | 'fisioterapeuta'
  | 'preparador_fisico'
  | 'outro';

// Nível de acesso
type AccessLevel =
  | 'full'
  | 'workout_only'
  | 'nutrition_only'
  | 'analytics_only';

// Status da vinculação
type LinkStatus = 'pending' | 'active' | 'inactive' | 'rejected';
```

## 🔒 Segurança e Privacidade

1. **Autenticação**: Mesma estrutura do Firebase Auth
2. **Controle de Acesso**: Níveis granulares por aluno
3. **Dados Locais**: IndexedDB sincronizado com Firestore
4. **Revogação**: Alunos podem desvincular a qualquer momento
5. **Transparência**: Alunos sabem quem tem acesso aos seus dados

## 🎯 Próximas Melhorias (Sugestões)

1. **Interface para Alunos Aceitarem Convites**
   - Adicionar seção em Settings ou Profile
   - Notificações de novos convites

2. **Histórico de Alterações**
   - Log de modificações feitas pelo profissional
   - Auditoria de acessos

3. **Comunicação Interna**
   - Chat entre profissional e aluno
   - Comentários em treinos/dietas

4. **Relatórios Profissionais**
   - Exportar PDFs com evolução
   - Relatórios customizáveis

5. **Planos e Pagamentos**
   - Integrar sistema de assinatura
   - Diferentes níveis de conta profissional

6. **Agendamento**
   - Calendário de consultas
   - Lembretes automáticos

## 🐛 Troubleshooting

### Profissional não consegue ver dados do aluno

**Possíveis causas:**
- Aluno não aceitou o convite
- Vinculação está inativa
- Nível de acesso não permite

**Solução:**
1. Verificar status da vinculação no Dashboard
2. Reenviar convite se necessário
3. Verificar nível de acesso configurado

### Dados não estão sincronizando

**Possíveis causas:**
- Problema de conexão
- Erro no Firestore
- IndexedDB corrompido

**Solução:**
1. Verificar conexão com internet
2. Fazer logout/login
3. Limpar cache do navegador (último recurso)

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar esta documentação
2. Consultar logs do navegador (F12 → Console)
3. Reportar issues no repositório

## 🎓 Casos de Uso

### Caso 1: Personal Trainer com 10 Alunos

João é personal trainer e tem 10 alunos. Ele:
1. Criou conta profissional com CREF
2. Convidou seus 10 alunos por email
3. Alterna entre alunos para montar treinos personalizados
4. Acompanha evolução de cada um no Analytics
5. Usa modo pessoal para seus próprios treinos

### Caso 2: Nutricionista Consultório

Maria é nutricionista com consultório. Ela:
1. Criou conta profissional com CRN
2. Convida novos pacientes após consulta
3. Define acesso apenas para "Nutrição"
4. Monta planos alimentares personalizados
5. Acompanha adesão dos pacientes

### Caso 3: Preparador Físico de Atletas

Carlos prepara atletas de alto rendimento. Ele:
1. Criou conta profissional
2. Convida apenas atletas autorizados
3. Define acesso total (treino + nutrição + analytics)
4. Ajusta treinos semanalmente
5. Monitora KPIs de performance

## 📊 Métricas e Analytics (Futuro)

Métricas que podem ser implementadas:
- Número total de alunos
- Taxa de adesão a treinos
- Evolução média dos alunos
- Engajamento por aluno
- Tempo médio de vinculação

---

**Versão**: 1.0
**Data**: 2025-01-27
**Autor**: GymTracker Development Team
