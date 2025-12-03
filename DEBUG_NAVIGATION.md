# 🐛 Debug - Navegação Profile/Analytics/Settings

## ✅ Logs de Debug Adicionados

Adicionei logs de console para rastrear exatamente o que está acontecendo com a navegação.

---

## 🧪 Como Testar

### Passo 1: Abrir o Aplicativo
1. Abra: **http://localhost:5174**
2. Pressione **F12** para abrir DevTools
3. Vá na aba **Console**
4. Mantenha o console aberto durante todo o teste

### Passo 2: Limpar o Console
1. No console, clique no botão **Clear console** (ícone de círculo com uma linha)
2. Isso facilita ver os novos logs

### Passo 3: Testar Cada Navegação

#### 🧪 Teste 1: Clicar em "Perfil" (👤)
1. Clique no botão **👤 Perfil** (no header desktop ou bottom nav mobile)
2. **No console, você DEVE ver:**
   ```
   🔍 ActiveView atual: profile
   👤 Renderizando Profile
   ```
3. **Na tela, você DEVE ver:**
   - Título: "Meu Perfil"
   - Subtítulo: "Gerencie seus dados pessoais e acompanhe sua evolução"
   - Abas: Dashboard, Dados Pessoais, Medidas, Histórico

**❓ O que aconteceu?**
- [ ] Vejo os logs no console
- [ ] Vejo o título "Meu Perfil" na tela
- [ ] Vejo as abas de navegação
- [ ] NÃO vejo nada (tela em branco)

#### 🧪 Teste 2: Clicar em "Analytics" (📈)
1. Clique no botão **📈 Analytics**
2. **No console, você DEVE ver:**
   ```
   🔍 ActiveView atual: analytics
   📈 Renderizando Analytics
   ```
3. **Na tela, você DEVE ver:**
   - Título: "📈 Analytics Avançados"
   - Subtítulo: "Análises profissionais do seu progresso"
   - Abas: 💪 Força, 🎯 Grupos Musculares, 🔮 Predições, 🍎 Nutrição, 📏 Medidas Corporais

**❓ O que aconteceu?**
- [ ] Vejo os logs no console
- [ ] Vejo o título "Analytics Avançados" na tela
- [ ] Vejo as abas de navegação
- [ ] NÃO vejo nada (tela em branco)

#### 🧪 Teste 3: Clicar em "Config" (⚙️)
1. Clique no botão **⚙️ Config**
2. **No console, você DEVE ver:**
   ```
   🔍 ActiveView atual: settings
   ⚙️ Renderizando Settings
   ```
3. **Na tela, você DEVE ver:**
   - Título: "⚙️ Configurações"
   - Subtítulo: "Personalize sua experiência e gerencie seus dados"
   - Abas: 💾 Backup & Dados, 🗄️ IndexedDB, 🎨 Aparência, ℹ️ Sobre

**❓ O que aconteceu?**
- [ ] Vejo os logs no console
- [ ] Vejo o título "Configurações" na tela
- [ ] Vejo as abas de navegação
- [ ] NÃO vejo nada (tela em branco)

---

## 🔍 Cenários Possíveis

### Cenário A: Logs aparecem mas tela fica em branco
**Causa:** CSS está escondendo o conteúdo.

**Como verificar:**
1. Abra DevTools (F12)
2. Vá na aba **Elements** (ou **Inspetor**)
3. Procure por `<main class="app-main">`
4. Dentro dele, procure por:
   - `<div class="profile-container">` (se clicar em Profile)
   - `<div class="advanced-analytics">` (se clicar em Analytics)
   - `<div class="settings-container">` (se clicar em Settings)
5. Clique com o botão direito no elemento → **Scroll into view**

**Se o elemento existir mas não aparecer:**
- Problema é CSS (display, visibility, opacity, height, overflow)
- Verifique se há `display: none` ou `visibility: hidden`

### Cenário B: Logs NÃO aparecem
**Causa:** A view não está mudando (problema no estado `activeView`).

**Como verificar:**
1. No console, procure pelo log:
   ```
   🔍 ActiveView atual: <valor>
   ```
2. Clique nos botões e veja se o `<valor>` muda

**Se não mudar:**
- Problema é no `setActiveView` do AppNavigationContext
- Verifique se os botões estão chamando `onClick={() => setActiveView(item.id)}`

### Cenário C: Nenhum log aparece (nem o "ActiveView atual")
**Causa:** App não está rodando ou console está filtrado.

**Soluções:**
1. Verifique se o app está rodando: **http://localhost:5174**
2. No console, verifique se há filtros ativos (botão **Filter** no topo)
3. Recarregue a página (F5)

---

## 📊 Comandos de Debug Úteis

### Verificar se os componentes estão importados
```javascript
// Execute no console:
console.log('Profile:', typeof Profile);
console.log('Settings:', typeof Settings);
console.log('AdvancedAnalytics:', typeof AdvancedAnalytics);
```

### Verificar o valor atual de activeView
```javascript
// No React DevTools (aba Components):
// 1. Procure por "AppNavigationProvider"
// 2. Expanda e veja o state "activeView"
```

### Forçar mudança de view via console
```javascript
// AVISO: Isso só funciona se você expor globalmente (não recomendado em produção)
// Mas pode testar manualmente clicando nos botões
```

### Verificar se CSS está escondendo
```javascript
// Execute no console após clicar em Profile:
const profile = document.querySelector('.profile-container');
if (profile) {
  console.log('Profile existe:', profile);
  console.log('Display:', window.getComputedStyle(profile).display);
  console.log('Visibility:', window.getComputedStyle(profile).visibility);
  console.log('Opacity:', window.getComputedStyle(profile).opacity);
  console.log('Height:', window.getComputedStyle(profile).height);
} else {
  console.log('Profile NÃO existe no DOM!');
}
```

### Verificar erros no console
```javascript
// Procure por mensagens em vermelho no console
// Podem indicar erros de:
// - Import não encontrado
// - Hook usado fora do Provider
// - Propriedade undefined
```

---

## 🚨 Erros Comuns e Soluções

### Erro: "useProfile must be used within a ProfileProvider"
**Causa:** Profile.tsx está tentando usar `useProfile()` mas o Provider não está envolvendo o componente.

**Solução:** Verificar em App.tsx se `<ProfileProvider>` envolve `<AppContent />`
- ✅ **CORRETO:** Já está envolvendo (linha 92-98)

### Erro: "Cannot read property 'state' of null"
**Causa:** Context está retornando `null` em vez do valor esperado.

**Solução:**
1. Verificar se `ProfileContext` está sendo criado corretamente
2. Verificar se `ProfileProvider` está definindo o valor do context

### Erro: Tela branca sem logs
**Causa:** Erro crítico que parou a renderização do React.

**Solução:**
1. Abra o console e procure por erros em vermelho
2. Recarregue a página (F5)
3. Se persistir, verifique o código TypeScript

---

## 🎯 Checklist de Verificação

Execute este checklist após fazer os testes:

- [ ] Console aberto (F12)
- [ ] Cliquei em "Perfil"
- [ ] Vi o log "🔍 ActiveView atual: profile"
- [ ] Vi o log "👤 Renderizando Profile"
- [ ] Vi o conteúdo de Profile na tela (ou não vi - marque qual caso)
- [ ] Cliquei em "Analytics"
- [ ] Vi o log "🔍 ActiveView atual: analytics"
- [ ] Vi o log "📈 Renderizando Analytics"
- [ ] Vi o conteúdo de Analytics na tela (ou não vi - marque qual caso)
- [ ] Cliquei em "Config"
- [ ] Vi o log "🔍 ActiveView atual: settings"
- [ ] Vi o log "⚙️ Renderizando Settings"
- [ ] Vi o conteúdo de Settings na tela (ou não vi - marque qual caso)
- [ ] Verifiquei se há erros em vermelho no console
- [ ] Copiei TODOS os logs do console (se houver problemas)

---

## 📞 Próximos Passos

Após fazer os testes, me informe:

### Se os logs aparecem mas a tela fica em branco:
- Copie e envie: "Logs aparecem mas tela em branco"
- Envie screenshot da aba **Elements** mostrando o HTML dos componentes

### Se os logs NÃO aparecem:
- Copie e envie: "Logs não aparecem"
- Copie TODO o conteúdo do console e envie

### Se aparecem erros em vermelho:
- Copie e envie: O texto completo dos erros

### Se tudo funcionar:
- Ótimo! Significa que o problema foi resolvido pelos logs de debug
- Podemos removê-los depois

---

**🚀 App rodando em: http://localhost:5174**

**💡 Dica:** Mantenha o console SEMPRE aberto e a aba **Console** visível para ver os logs em tempo real!
