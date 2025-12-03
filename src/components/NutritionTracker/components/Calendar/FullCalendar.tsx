// src/components/NutritionTracker/FullCalendar.tsx
import React, { useState, useCallback, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  isSameMonth,
  isAfter,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNutritionHistory } from "../../../../hooks/useNutritionHistory";
import { createLocalDate, getTodayString } from "../../../../utils/dateHelpers";
import styles from "./FullCalendar.module.css"; // Importa os estilos como um objeto

interface FullCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: string) => void;
  initialMonth: Date;
  onClose?: () => void;
}

export const FullCalendar: React.FC<FullCalendarProps> = ({
  selectedDate,
  onDateSelect,
  initialMonth,
  onClose,
}) => {
  const { history } = useNutritionHistory();
  const [currentMonth, setCurrentMonth] = useState(initialMonth);

  useEffect(() => {
    if (!isSameMonth(currentMonth, initialMonth)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentMonth(initialMonth);
    }
  }, [initialMonth, currentMonth]);

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getDaysInMonth = useCallback(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    const firstDayOfWeek = getDay(start);
    const prevMonthDays = Array.from({ length: firstDayOfWeek }).map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (_) => subMonths(start, 1)
    );
    days.unshift(...prevMonthDays);

    const lastDayOfWeek = getDay(end);
    const nextMonthDays = Array.from({ length: 6 - lastDayOfWeek }).map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (_) => addMonths(end, 1)
    );
    days.push(...nextMonthDays);

    return days;
  }, [currentMonth]);

  const days = getDaysInMonth();

  const handleDateClick = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    onDateSelect(dateString);
    onClose?.();
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // ✅ Lógica ATUALIZADA para 'isDayWithNutritionData'
  const isDayWithNutritionData = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    const record = history.dailyRecords[dateString];
    if (!record) return false; // Se não há registro, não há dados.

    // Considera que há dados se o dia foi completado OU se há algum total > 0
    return (
      record.isCompleted || // Se o dia foi marcado como completo
      record.totals.calories > 0 ||
      record.totals.protein > 0 ||
      record.totals.carbs > 0 ||
      record.totals.fat > 0 ||
      record.totals.water > 0
    );
  };

  const todayLocal = createLocalDate(getTodayString());

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarHeader}>
        <h3 className={styles.calendarTitle}>Calendário Nutricional</h3>
        <div className={styles.calendarNav}>
          <button className={styles.calendarNavBtn} onClick={goToPreviousMonth}>
            ←
          </button>
          <span className={styles.calendarMonthYear}>
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </span>
          <button className={styles.calendarNavBtn} onClick={goToNextMonth}>
            →
          </button>
        </div>
      </div>

      <div className={styles.calendarGrid}>
        {daysOfWeek.map((day) => (
          <div key={day} className={styles.calendarWeekday}>
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          const dayString = format(day, "d");
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDay = isSameDay(day, todayLocal);
          const hasData = isDayWithNutritionData(day);
          const isFutureDay = isAfter(day, todayLocal);

          // Um dia é interativo/clicável se:
          // 1. Está no mês atual (para evitar cliques em dias de outros meses)
          // 2. Não é um dia futuro
          // 3. Tem dados (conforme a nova lógica) OU é o dia de hoje OU é o dia atualmente selecionado
          const isInteractive =
            isCurrentMonth &&
            !isFutureDay &&
            (hasData || isTodayDay || isSelected);

          // Construindo as classes dinamicamente
          let dayClasses = styles.calendarDay;

          if (!isCurrentMonth) {
            dayClasses += ` ${styles.otherMonth}`;
          }
          if (isSelected) {
            dayClasses += ` ${styles.selected}`;
          }
          if (isTodayDay && !isSelected) {
            dayClasses += ` ${styles.today}`;
          }
          if (hasData) {
            dayClasses += ` ${styles.hasData}`;
          }
          if (!isInteractive) {
            dayClasses += ` ${styles.disabled}`;
          }

          return (
            <div
              key={index}
              className={dayClasses}
              onClick={() => isInteractive && handleDateClick(day)}
            >
              {dayString}
            </div>
          );
        })}
      </div>

      <div className={styles.calendarFooter}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.today}`} /> Hoje
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.selected}`} />{" "}
          Selecionado
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.hasData}`} /> Com Dados
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.disabled}`} />{" "}
          Indisponível
        </div>
      </div>
    </div>
  );
};

export default FullCalendar;
