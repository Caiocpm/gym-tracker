// src/components/NutritionTracker/Calendar/CalendarTrigger.tsx
import React, { useState } from "react";
import CalendarModal from "../CalendarModal";
import { useNutritionContext } from "../../../../../hooks/useNutritionContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createLocalDate } from "../../../../../utils/dateHelpers";
import styles from "./CalendarTrigger.module.css"; // ✅ IMPORTA CSS MODULES

export const CalendarTrigger: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { state } = useNutritionContext();

  // ✅ Usa createLocalDate para formatar a data corretamente no fuso horário local
  const formattedDate = format(
    createLocalDate(state.selectedDate),
    "dd MMM yyyy",
    { locale: ptBR }
  );

  return (
    <>
      <button
        className={styles.calendarTriggerButton}
        onClick={() => setIsModalOpen(true)}
      >
        📅 {formattedDate}
      </button>
      <CalendarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default CalendarTrigger;
