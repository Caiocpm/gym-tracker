// src/types/window.d.ts
import type { UnifiedNotification } from "./UnifiedNotification";

/**
 * Interface para o objeto de debug de notificações exposto globalmente.
 * Contém métodos e propriedades para interagir com o estado das notificações em modo de desenvolvimento.
 */
interface NotificationDebug {
  /**
   * Adiciona uma lista de notificações de teste ao estado atual.
   * @param notifs Um array de notificações unificadas a serem adicionadas.
   */
  addTest: (notifs: UnifiedNotification[]) => void;

  /**
   * Limpa todas as notificações do estado e desativa o modo de teste.
   */
  clear: () => void;

  /**
   * Reseta o modo de teste, limpando as notificações e reativando os listeners do Firebase.
   */
  reset: () => void;

  /**
   * O array atual de notificações no estado.
   */
  current: UnifiedNotification[];

  /**
   * A contagem de notificações não lidas.
   */
  unread: number;

  /**
   * Indica se o sistema de notificações está atualmente em modo de teste.
   */
  isTestMode: boolean;
}

/**
 * Estende a interface global Window para incluir a propriedade `notificationDebug`.
 * Esta propriedade é opcional e só deve estar presente em ambientes de desenvolvimento/teste.
 */
declare global {
  interface Window {
    notificationDebug?: NotificationDebug;
  }
}

export {};
