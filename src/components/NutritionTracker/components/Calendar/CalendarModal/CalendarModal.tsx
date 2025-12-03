// src/components/NutritionTracker/Calendar/CalendarModal.tsx
import React from "react";
import ReactDOM from "react-dom";
import { FullCalendar } from "../FullCalendar";
import { useNutritionContext } from "../../../../../hooks/useNutritionContext";
import { startOfMonth } from "date-fns";
import { createLocalDate } from "../../../../../utils/dateHelpers";
import styles from "./CalendarModal.module.css"; // ✅ IMPORTA CSS MODULES

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
  const { state, setSelectedDate } = useNutritionContext();

  const handleDateSelect = (dateString: string) => {
    setSelectedDate(dateString);
    onClose();
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={styles.calendarModalOverlay} onClick={onClose}>
      <div
        className={styles.calendarModalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.calendarModalCloseBtn} onClick={onClose}>
          ✕
        </button>
        <FullCalendar
          selectedDate={createLocalDate(state.selectedDate)}
          onDateSelect={handleDateSelect}
          initialMonth={startOfMonth(createLocalDate(state.selectedDate))}
          onClose={onClose}
        />
      </div>
    </div>,
    document.body
  );
};

export default CalendarModal;
