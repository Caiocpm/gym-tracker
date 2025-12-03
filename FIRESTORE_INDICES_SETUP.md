# 🔧 Configuração de Índices no Firestore

## 📋 Índices Necessários

Para o sistema de Perfil Público e Badges funcionar corretamente, você precisa criar índices no Firestore Console.

---

## 🎯 Índice 1: userBadges - userId

### Por que é necessário?
Este índice permite buscar rapidamente todos os badges de um usuário específico.

### Query que usa este índice:
```typescript
// Em useUserBadges.ts
query(
  collection(db, "userBadges"),
  where("userId", "==", targetUserId)
)
```

---

## 🌐 Passo a Passo - Configuração Manual

### 1️⃣ **Acessar o Console do Firebase**

1. Abra seu navegador
2. Acesse: https://console.firebase.google.com/
3. Faça login com sua conta Google
4. Selecione seu projeto **gym-tracker**

### 2️⃣ **Ir para Firestore Database**

1. No menu lateral esquerdo, clique em **"Build"** ou **"Compilar"**
2. Clique em **"Firestore Database"**
3. Você verá a interface do banco de dados

### 3️⃣ **Acessar a Seção de Índices**

1. No topo da página do Firestore, clique na aba **"Indexes"** ou **"Índices"**
2. Você verá duas sub-abas:
   - **Composite** (Compostos)
   - **Single field** (Campo único)

### 4️⃣ **Criar Índice de Campo Único**

1. Clique na aba **"Single field"** (Campo único)
2. Clique no botão **"Create index"** ou **"Criar índice"** (botão azul no topo direito)

### 5️⃣ **Configurar o Índice userBadges**

Preencha o formulário com as seguintes informações:

```
┌──────────────────────────────────────────┐
│ Collection ID: userBadges                │
├──────────────────────────────────────────┤
│ Field path: userId                       │
├──────────────────────────────────────────┤
│ Query scope: Collection                  │
│   ○ Collection                          │
│   ○ Collection group                    │
├──────────────────────────────────────────┤
│ Order: Ascending                         │
│   ● Ascending                           │
│   ○ Descending                          │
└──────────────────────────────────────────┘
```

**Detalhes:**
- **Collection ID**: `userBadges`
- **Field path**: `userId`
- **Query scope**: Selecione **"Collection"** (padrão)
- **Order**: Selecione **"Ascending"** (crescente)

### 6️⃣ **Criar o Índice**

1. Revise as configurações
2. Clique no botão **"Create"** ou **"Criar"**
3. Aguarde alguns segundos (pode aparecer "Building..." ou "Criando...")
4. ✅ Quando ficar com status **"Enabled"** ou **"Ativado"**, está pronto!

---

## 🚀 Método Alternativo - Criar Via Erro do Console

### Quando Usar
Se você tentar usar a funcionalidade antes de criar o índice, o Firestore mostrará um erro com um link direto.

### Passo a Passo

1. **Execute a aplicação** e tente acessar o Perfil Público
2. **Abra o Console do navegador** (F12)
3. Você verá um erro vermelho parecido com:

```
FirebaseError: The query requires an index. You can create it here:
https://console.firebase.google.com/v1/r/project/[SEU-PROJETO]/firestore/indexes?create_composite=...
```

4. **Clique no link** que aparece no erro
5. O Firestore abrirá **automaticamente** a página de criação do índice com os campos já preenchidos
6. Clique em **"Create index"**
7. Aguarde a criação

---

## 📊 Índices Adicionais Recomendados

Embora não sejam obrigatórios imediatamente, estes índices melhorarão a performance:

### Índice 2: userBadges - userId + earnedAt (Composite)

**Para ordenar badges por data de conquista**

```
Collection: userBadges
Fields:
  - userId (Ascending)
  - earnedAt (Descending)
Query scope: Collection
```

**Como criar:**
1. Vá para a aba **"Composite"** (Compostos)
2. Clique em **"Create index"**
3. Preencha:
   - Collection: `userBadges`
   - Field 1: `userId` (Ascending)
   - Field 2: `earnedAt` (Descending)
4. Clique em **"Create"**

---

### Índice 3: groupChallenges - groupId + status

**Para filtrar desafios ativos de um grupo**

```
Collection: groupChallenges
Fields:
  - groupId (Ascending)
  - status (Ascending)
Query scope: Collection
```

**Como criar:**
1. Aba **"Composite"**
2. **"Create index"**
3. Preencha:
   - Collection: `groupChallenges`
   - Field 1: `groupId` (Ascending)
   - Field 2: `status` (Ascending)
4. **"Create"**

---

## ✅ Checklist de Verificação

Após criar os índices, verifique:

- [ ] Índice `userBadges.userId` com status **"Enabled"**
- [ ] Aplicação não mostra mais erros de índice no console
- [ ] Badges carregam corretamente no Perfil Público
- [ ] Estatísticas aparecem sem erros

---

## 🐛 Troubleshooting

### Problema: "Index is still building"
**Solução:** Aguarde alguns minutos. Índices grandes podem levar tempo para serem construídos.

### Problema: "Permission denied"
**Solução:** Verifique se as regras do Firestore foram atualizadas ([firestore.rules](firestore.rules)).

### Problema: "Index already exists"
**Solução:** O índice já foi criado! Não precisa fazer nada.

### Problema: Erro persiste após criar índice
**Soluções:**
1. Aguarde 1-2 minutos (índice pode estar finalizando)
2. Recarregue a página (F5)
3. Limpe o cache do navegador (Ctrl + Shift + Delete)
4. Verifique se o status do índice está "Enabled"

---

## 📸 Capturas de Tela de Referência

### Como deve ficar o índice criado:

```
┌───────────────────────────────────────────────────────────┐
│ Indexes                                       + Create    │
├─────────┬─────────────────────────────────────────────────┤
│ Single  │ Composite                                       │
├─────────┴─────────────────────────────────────────────────┤
│                                                            │
│ Collection ID    │ Field path    │ Order      │ Status   │
├──────────────────┼───────────────┼────────────┼──────────┤
│ userBadges       │ userId        │ Ascending  │ Enabled  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 🔄 Quando Criar Novos Índices

O Firebase é inteligente! Sempre que você fizer uma query que precise de índice:

1. Aparecerá um **erro no console do navegador**
2. O erro terá um **link direto** para criar o índice
3. Clique no link e crie o índice

**Exemplo de erro:**
```
FirebaseError: The query requires an index.
You can create it here: https://console.firebase.google.com/...
```

---

## 💡 Dicas Úteis

### ✅ Boas Práticas

1. **Crie índices sob demanda**: Não precisa criar todos de uma vez
2. **Use o link do erro**: É mais rápido e preciso
3. **Monitore o uso**: Firebase Console → Firestore → Usage (para ver performance)

### ⚠️ Limitações

- **Gratuito**: Até 200 índices compostos
- **Criação**: Pode levar alguns minutos para índices grandes
- **Remoção**: Índices não usados podem ser deletados para economizar quota

---

## 🎯 Resumo Rápido

**Para começar a usar o sistema de badges:**

1. ✅ Acesse: https://console.firebase.google.com/
2. ✅ Seu projeto → Firestore Database → Indexes → Single field
3. ✅ Create index:
   - Collection: `userBadges`
   - Field: `userId`
   - Order: `Ascending`
4. ✅ Aguarde status "Enabled"
5. ✅ Pronto! Teste no app

**OU simplesmente:**

1. Tente usar a funcionalidade
2. Veja o erro no console
3. Clique no link do erro
4. Clique em "Create index"

---

## 📞 Precisa de Ajuda?

Se encontrar problemas:
1. Verifique o console do navegador (F12) para erros
2. Confira as regras do Firestore
3. Verifique se está logado no Firebase Console com a conta correta
4. Certifique-se que está no projeto correto

---

**✨ Após criar o índice, tudo funcionará perfeitamente!**
