// src/hooks/useNotifications.ts
import { useCallback, useEffect } from "react";

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  sound?: boolean;
  vibration?: boolean;
}

export const useNotifications = () => {
  // Solicitar permissão para notificações
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Reproduzir som de notificação
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio("/notification-sound.mp3");
      audio.volume = 0.5;
      // ✅ CORRIGIDO: Adicionar play() para reproduzir o áudio
      audio.play().catch((playError) => {
        console.warn(
          "Não foi possível reproduzir o som de notificação:",
          playError
        );
      });
    } catch (audioError) {
      // ✅ CORRIGIDO: Usar a variável error e adicionar log
      console.warn("Erro ao carregar áudio de notificação:", audioError);
    }
  }, []);

  // Vibrar dispositivo (mobile)
  const vibrate = useCallback((pattern: number[] = [200, 100, 200]) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  // Enviar notificação completa
  const notify = useCallback(
    ({
      title,
      body,
      icon = "/gym-icon.png",
      sound = true,
      vibration = true,
    }: NotificationOptions) => {
      // Notificação browser
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(title, {
            body,
            icon,
            badge: icon,
            tag: "gym-timer",
            requireInteraction: false,
          });
        } catch (notificationError) {
          console.warn("Erro ao exibir notificação:", notificationError);
        }
      }

      // Som
      if (sound) {
        playNotificationSound();
      }

      // Vibração
      if (vibration) {
        vibrate();
      }
    },
    [playNotificationSound, vibrate]
  );

  // ✅ FUNÇÃO para verificar se notificações estão disponíveis
  const isNotificationSupported = useCallback(() => {
    return "Notification" in window;
  }, []);

  // ✅ FUNÇÃO para verificar permissão atual
  const getNotificationPermission = useCallback(() => {
    if (!isNotificationSupported()) {
      return "unsupported";
    }
    return Notification.permission;
  }, [isNotificationSupported]);

  // ✅ FUNÇÃO para solicitar permissão explicitamente
  const requestNotificationPermission = useCallback(async () => {
    if (!isNotificationSupported()) {
      return "unsupported";
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (permissionError) {
      console.warn(
        "Erro ao solicitar permissão para notificações:",
        permissionError
      );
      return "denied";
    }
  }, [isNotificationSupported]);

  // Notificações específicas do treino
  const notifyRestComplete = useCallback(() => {
    notify({
      title: "⏰ Descanso Concluído!",
      body: "Pronto para a próxima série!",
      sound: true,
      vibration: true,
    });
  }, [notify]);

  const notifyExerciseComplete = useCallback(
    (exerciseName: string) => {
      notify({
        title: "🎉 Exercício Concluído!",
        body: `${exerciseName} finalizado com sucesso!`,
        sound: true,
        vibration: true,
      });
    },
    [notify]
  );

  const notifyWorkoutComplete = useCallback(() => {
    notify({
      title: "💪 Treino Concluído!",
      body: "Parabéns! Você finalizou seu treino!",
      sound: true,
      vibration: true,
    });
  }, [notify]);

  // ✅ NOTIFICAÇÕES adicionais úteis
  const notifySetComplete = useCallback(
    (setNumber: number, totalSets: number, exerciseName: string) => {
      notify({
        title: `✅ Série ${setNumber}/${totalSets} Concluída!`,
        body: `${exerciseName} - Continue assim!`,
        sound: false, // Som mais suave para séries
        vibration: true,
      });
    },
    [notify]
  );

  const notifyRestStarted = useCallback(
    (restTime: number, exerciseName: string) => {
      const minutes = Math.floor(restTime / 60);
      const seconds = restTime % 60;
      const timeStr =
        minutes > 0
          ? `${minutes}:${seconds.toString().padStart(2, "0")}`
          : `${seconds}s`;

      notify({
        title: "⏱️ Descanso Iniciado",
        body: `${exerciseName} - ${timeStr} de descanso`,
        sound: false,
        vibration: false,
      });
    },
    [notify]
  );

  const notifyWorkoutStarted = useCallback(
    (workoutName: string) => {
      notify({
        title: "🚀 Treino Iniciado!",
        body: `${workoutName} - Vamos treinar!`,
        sound: true,
        vibration: true,
      });
    },
    [notify]
  );

  return {
    // ✅ Funções principais
    notify,
    playNotificationSound,
    vibrate,

    // ✅ Funções de controle
    isNotificationSupported,
    getNotificationPermission,
    requestNotificationPermission,

    // ✅ Notificações específicas do treino
    notifyRestComplete,
    notifyExerciseComplete,
    notifyWorkoutComplete,
    notifySetComplete,
    notifyRestStarted,
    notifyWorkoutStarted,
  };
};
