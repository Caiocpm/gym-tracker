import { useEffect } from "react";
import { useToast } from "./useToast";

export const useDateChangeNotification = () => {
  const { addToast } = useToast();

  useEffect(() => {
    const handleDateChange = (event: CustomEvent) => {
      const { newDate } = event.detail;

      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + "T00:00:00");
        return date.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
      };

      const message = `Data atualizada para ${formatDate(newDate)}`;
      addToast(message, "info", 5000);
    };

    window.addEventListener("dateChanged", handleDateChange as EventListener);

    return () => {
      window.removeEventListener(
        "dateChanged",
        handleDateChange as EventListener
      );
    };
  }, [addToast]);
};
