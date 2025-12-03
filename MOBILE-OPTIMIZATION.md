# 📱 Guia de Otimização Mobile - Gym Tracker

## 🎯 Objetivo
Este documento descreve as otimizações implementadas para dispositivos mobile, especialmente iPhone 12/13 (390x844px).

## ✅ Otimizações Globais Implementadas

### 1. **Tipografia Responsiva**
- **Desktop**: `font-size: 16px` (base)
- **Mobile (≤480px)**: `font-size: 14px` (base)
- **Inputs**: Sempre ≥16px para prevenir zoom automático no iOS

### 2. **Áreas de Toque (Touch Targets)**
- Mínimo **44x44px** para todos os elementos interativos (Apple HIG)
- Botões e links aumentados automaticamente em dispositivos touch
- Espaçamento adequado entre elementos clicáveis

### 3. **Safe Areas (iPhone Notch)**
- Suporte para `env(safe-area-inset-*)`
- Padding automático para notch e home indicator
- Bottom navigation respeitando safe areas

### 4. **Performance**
- `-webkit-overflow-scrolling: touch` para scroll suave
- `transform: translate3d(0,0,0)` para otimização de GPU
- Redução de animações complexas em mobile
- Suporte a `prefers-reduced-motion`

### 5. **Prevenção de Zoom Indesejado**
- Inputs com `font-size: 16px` mínimo
- Meta viewport configurado corretamente
- Desabilitação de zoom duplo-toque onde apropriado

### 6. **Interações Touch**
- `-webkit-tap-highlight-color: transparent`
- Remoção de hover effects em touch devices
- User-select desabilitado em elementos de UI

## 📐 Breakpoints Padrão

```css
/* Mobile Small (iPhone SE) */
@media (max-width: 375px) { }

/* Mobile (iPhone 12/13) */
@media (max-width: 390px) { }
@media (max-width: 480px) { }

/* Tablet */
@media (max-width: 640px) { }
@media (max-width: 768px) { }

/* Desktop */
@media (min-width: 769px) { }
```

## 🎨 Componentes Otimizados

### Header Mobile
```css
/* Mobile */
- padding: 0.75rem 1rem
- font-size: 1.35rem (título)
- Layout: flex-direction column

/* Desktop */
- padding: 1.5rem 2rem
- font-size: 1.75rem (título)
- Layout: flex-direction row
```

### Bottom Navigation
```css
- height: ~70px + safe-area-inset-bottom
- Icons: 1.2rem
- Labels: 0.6rem (mobile) / 0.7rem (desktop)
- Active indicator: ponto 4x4px
```

### Inputs e Formulários
```css
/* Mobile */
- padding: 0.875rem (área de toque maior)
- font-size: 16px (previne zoom)
- border-radius: 8px

/* Desktop */
- padding: 0.75rem
- font-size: 0.9rem
```

### Botões
```css
/* Mobile */
- min-height: 44px
- padding: 0.875rem 1.25rem
- font-size: 0.95rem

/* Desktop */
- padding: 0.75rem 1.5rem
- font-size: 0.9rem
```

### Modais
```css
/* Mobile */
- max-width: 95vw
- max-height: 90vh
- margin: 5vh auto

/* Desktop */
- max-width: 600px
- margin: 10vh auto
```

## 🎯 Cards de Analytics (Níveis de Força)

### Grid Layout
```css
/* Mobile (≤768px) */
- grid-template-columns: repeat(2, 1fr)
- gap: 1rem

/* Desktop */
- grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))
- gap: 1.5rem
```

### Card Individual
```css
/* Mobile */
- padding: 1.25rem
- font-size: reduzido (0.85rem)
- Layout: flex-direction column

/* Desktop */
- padding: 1.75rem
- font-size: normal (0.95rem)
- Layout: flex-direction row
```

## 📱 Melhores Práticas

### 1. **Teste em Dispositivos Reais**
- iPhone 12/13 (390x844px)
- iPhone SE (375x667px)
- Android variados

### 2. **Use Ferramentas de Dev**
```javascript
// Chrome DevTools
- Device Toolbar (Cmd/Ctrl + Shift + M)
- Network Throttling
- Touch simulation
```

### 3. **Checklist de QA Mobile**
- [ ] Todos os botões têm ≥44px de área de toque
- [ ] Inputs não causam zoom no iOS
- [ ] Bottom navigation não sobrepõe conteúdo
- [ ] Safe areas respeitadas (notch/home indicator)
- [ ] Scroll funciona suavemente
- [ ] Modais não saem da tela
- [ ] Textos legíveis sem zoom
- [ ] Imagens otimizadas (tamanho/formato)

### 4. **Performance Mobile**
```css
/* Evite */
- box-shadow complexos
- blur() pesados
- Animações de múltiplas propriedades
- Gradientes complexos
- Muitos re-renders

/* Prefira */
- transform (GPU-accelerated)
- opacity
- will-change (com cuidado)
- CSS containment
```

### 5. **Acessibilidade Mobile**
- Contraste mínimo: 4.5:1 (texto normal)
- Font size mínimo: 14px
- Espaçamento entre elementos: ≥8px
- Estados de foco visíveis
- Labels em todos os inputs

## 🔧 Utilitários CSS Globais

### Safe Area
```css
padding-left: max(0px, env(safe-area-inset-left));
padding-right: max(0px, env(safe-area-inset-right));
padding-bottom: max(0px, env(safe-area-inset-bottom));
```

### Touch Optimized
```css
-webkit-tap-highlight-color: transparent;
-webkit-touch-callout: none;
-webkit-user-select: none;
user-select: none;
```

### Smooth Scroll
```css
-webkit-overflow-scrolling: touch;
overscroll-behavior-y: none;
scroll-behavior: smooth;
```

## 🐛 Problemas Comuns e Soluções

### Problema: Zoom indesejado em inputs
**Solução**: `font-size: 16px !important`

### Problema: Bounce scroll no iOS
**Solução**: `overscroll-behavior-y: none`

### Problema: Hover stuck em touch
**Solução**:
```css
@media (hover: none) {
  *:hover { transition-duration: 0s; }
}
```

### Problema: Bottom nav sobrepõe conteúdo
**Solução**:
```css
padding-bottom: calc(80px + env(safe-area-inset-bottom));
```

### Problema: Elementos muito pequenos
**Solução**: `min-height: 44px; min-width: 44px`

## 📊 Métricas de Performance

### Core Web Vitals (Mobile)
- **LCP**: <2.5s (Largest Contentful Paint)
- **FID**: <100ms (First Input Delay)
- **CLS**: <0.1 (Cumulative Layout Shift)

### Lighthouse Targets
- Performance: ≥90
- Accessibility: ≥95
- Best Practices: ≥90
- SEO: ≥90

## 🚀 Próximos Passos

1. [ ] Implementar lazy loading de imagens
2. [ ] Otimizar bundle size para mobile
3. [ ] Adicionar offline support (PWA)
4. [ ] Implementar gesture handlers avançados
5. [ ] Adicionar haptic feedback (iOS)
6. [ ] Otimizar re-renders com React.memo
7. [ ] Implementar virtual scrolling para listas longas

## 📚 Recursos Adicionais

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Touch Targets](https://material.io/design/usability/accessibility.html#layout-typography)
- [Web.dev Mobile Performance](https://web.dev/mobile/)
- [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)

---

**Última atualização**: 2025-12-03
**Versão**: 1.0.0
