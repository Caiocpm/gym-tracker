# 🎯 Como Acessar o Perfil Público

## 📍 Localização

O **Perfil Público** foi adicionado como uma nova aba dentro da seção **"Perfil"** do aplicativo.

### Caminho de Navegação:

```
Menu Principal → 👤 Perfil → 🏆 Perfil Público
```

## 🖱️ Passo a Passo

### 1. **Abrir o Aplicativo**
- Acesse: `http://localhost:5174/`
- Faça login com sua conta

### 2. **Ir para Perfil**
- Na **barra de navegação superior** (desktop), clique em **"👤 Perfil"**
- OU na **barra de navegação inferior** (mobile), toque em **"👤 Perfil"**

### 3. **Selecionar "Perfil Público"**
Você verá 5 abas:
- 📊 Dashboard
- 👤 Dados Pessoais
- 📏 Medidas
- 📈 Histórico
- **🏆 Perfil Público** ← **NOVA ABA!**

Clique/toque em **"🏆 Perfil Público"**

## 🎨 O Que Você Verá

### Header do Perfil
```
┌─────────────────────────────────────┐
│        [Avatar/Foto do Usuário]     │
│                                     │
│         João Silva                  │
│    "Transformando treino em arte"  │
│                                     │
│  💪 50    🏆 12    👥 3    ✅ 8    │
│  Treinos  Badges  Grupos  Desafios │
└─────────────────────────────────────┘
```

### Tabs do Perfil Público
```
┌──────────────────────────────────────┐
│ 📊 Estatísticas | 🏆 Badges | 🔒 Privacidade │
└──────────────────────────────────────┘
```

#### **📊 Estatísticas**
Mostra:
- 🏋️ Treinos (total, séries, reps, volume)
- 🔥 Consistência (sequência atual/maior)
- 🏅 Recordes (peso mais alto, maior volume)
- 👥 Social (grupos, desafios)
- 📊 Composição Corporal (mudanças de peso/gordura/massa)

#### **🏆 Badges (Galeria)**
Mostra todos os badges conquistados:
- Agrupados por categoria (Volume, Consistência, Recordes, etc.)
- Com raridade colorida (Common, Rare, Epic, Legendary)
- Informações do desafio que desbloqueou
- Data de conquista

#### **🔒 Privacidade**
Controle de visibilidade:
- 🌍 Público (todos veem)
- 👥 Amigos (só membros dos grupos)
- 🔒 Privado (só você)

Para cada seção:
- Badges
- Estatísticas
- Histórico de Treinos
- Fotos de Progresso
- Medidas
- Grupos

## 🏆 Como Ganhar Badges

### 1. **Participe de Desafios**
```
Menu → 👥 Grupos → Selecionar Grupo → Aba "🎯 Desafios"
```

### 2. **Complete o Desafio**
- Quando seu progresso atingir 100% da meta
- O badge é **automaticamente concedido**!

### 3. **Veja na Galeria**
```
Perfil → 🏆 Perfil Público → Aba "🏆 Badges"
```

## 📊 Como as Estatísticas São Calculadas

As estatísticas são calculadas **automaticamente** baseadas em:

### Dados de Treinos
- Busca todos os treinos completos
- Soma volume (peso × reps)
- Conta recordes batidos
- Calcula streaks (dias consecutivos)

### Dados de Composição Corporal
- Compara primeira vs última medição do perfil
- Calcula mudanças de peso, gordura e massa

### Dados Sociais
- Conta grupos que você participa
- Conta desafios participados/completados
- Conta badges conquistados

### Atualização
- Clique em **"🔄 Atualizar Estatísticas"** para recalcular
- Automaticamente atualizado ao abrir a página

## 🎨 Recursos Visuais

### Animações
- ✨ Badges com efeito flutuante (float)
- 🌈 Cores baseadas em raridade
- ⚡ Transições suaves entre tabs
- 🎯 Hover effects em cards

### Responsividade
- 💻 Design desktop completo
- 📱 Otimizado para mobile
- 🔄 Adapta-se a diferentes tamanhos de tela

## 🔧 Troubleshooting

### "Não vejo a aba Perfil Público"
- ✅ Certifique-se que está na seção **"Perfil"** (ícone 👤)
- ✅ A aba **"🏆 Perfil Público"** deve ser a última (5ª aba)
- ✅ Role horizontalmente se estiver em tela pequena

### "Não tenho badges"
- ℹ️ Você precisa completar desafios primeiro
- ➡️ Vá para **Grupos → Aba Desafios**
- ➡️ Participe e complete um desafio
- 🎉 Badge será concedido automaticamente!

### "Estatísticas aparecem zeradas"
- ℹ️ As estatísticas dependem de treinos completos
- ➡️ Complete alguns treinos primeiro
- ➡️ Clique em "🔄 Atualizar Estatísticas"

### "Erro ao carregar"
- ✅ Verifique se está conectado à internet
- ✅ Verifique se o Firestore está configurado
- ✅ Veja o console do navegador (F12) para erros

## 📋 Checklist Rápido

Antes de usar o Perfil Público:

- [ ] Aplicativo rodando (`npm run dev`)
- [ ] Login feito com sucesso
- [ ] Regras do Firestore atualizadas
- [ ] Pelo menos 1 treino completo (para estatísticas)
- [ ] Participando de pelo menos 1 grupo (para desafios)

## 🎯 Próximos Passos Sugeridos

1. **Complete seu primeiro desafio**
   - Participe de um desafio de grupo
   - Complete a meta
   - Ganhe seu primeiro badge! 🏆

2. **Configure sua privacidade**
   - Acesse a aba "🔒 Privacidade"
   - Defina quem pode ver suas informações
   - Salve as configurações

3. **Acompanhe seu progresso**
   - Veja suas estatísticas crescendo
   - Compare sua evolução ao longo do tempo
   - Celebre suas conquistas! 🎉

---

**🎊 Aproveite seu novo Perfil Público!**

Se tiver dúvidas, consulte a documentação completa em [PERFIL_PUBLICO_BADGES.md](PERFIL_PUBLICO_BADGES.md)
