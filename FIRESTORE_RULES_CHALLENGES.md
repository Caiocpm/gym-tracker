# Regras do Firestore para Desafios

Para que os desafios funcionem corretamente, você precisa adicionar as seguintes regras no Firebase Console:

## Acesse o Firebase Console

1. Vá para https://console.firebase.google.com
2. Selecione seu projeto
3. No menu lateral, clique em "Firestore Database"
4. Clique na aba "Rules"

## Adicione as Regras para Desafios

Adicione as seguintes regras na seção de `groupChallenges`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ... suas regras existentes ...

    // ✅ Regras para Desafios de Grupo
    match /groupChallenges/{challengeId} {
      // Permitir leitura para usuários autenticados
      allow read: if request.auth != null;

      // Permitir criar desafios apenas para membros do grupo
      allow create: if request.auth != null
        && request.auth.uid != null
        && request.resource.data.createdBy == request.auth.uid;

      // Permitir atualizar apenas para participantes ou criador
      allow update: if request.auth != null
        && (request.auth.uid == resource.data.createdBy
            || request.auth.uid in resource.data.participants[].userId);

      // Permitir deletar apenas para o criador
      allow delete: if request.auth != null
        && request.auth.uid == resource.data.createdBy;
    }
  }
}
```

## Regras Mais Permissivas (Para Testes)

Se você quiser testar rapidamente sem problemas de permissão, pode usar regras mais permissivas temporariamente:

```javascript
match /groupChallenges/{challengeId} {
  allow read, write: if request.auth != null;
}
```

⚠️ **AVISO**: Use regras permissivas apenas em desenvolvimento. Em produção, use as regras mais restritas acima.

## Criar Índice Composto (Opcional)

Se você receber um erro sobre índice faltando, o Firebase mostrará um link no console. Clique nele para criar automaticamente.

Ou crie manualmente:
- Coleção: `groupChallenges`
- Campos indexados:
  - `groupId` (Ascending)
  - `createdAt` (Descending)
- Query scope: `Collection`

## Verificar Regras

Depois de adicionar as regras:
1. Clique em "Publish" no Firebase Console
2. Espere alguns segundos
3. Tente criar um desafio novamente na aplicação
4. Verifique o console do navegador para ver os logs
