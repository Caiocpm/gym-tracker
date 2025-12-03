// src/utils/dateHelpers.ts

import { format } from "date-fns";

/**
 * Cria um objeto Date representando o início do dia na timezone local
 * a partir de uma string YYYY-MM-DD.
 * Isso evita problemas de fuso horário onde new Date("YYYY-MM-DD")
 * pode ser interpretado como o dia anterior em fusos horários negativos.
 * @param dateString A data no formato "YYYY-MM-DD".
 * @returns Um objeto Date no fuso horário local.
 */
export const createLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number);
  // Cria a data no fuso horário local, evitando a interpretação UTC de "YYYY-MM-DD"
  return new Date(year, month - 1, day);
};

/**
 * Retorna a string da data atual no formato YYYY-MM-DD,
 * garantindo que seja a data local.
 * @returns A data atual no formato "YYYY-MM-DD".
 */
export const getTodayString = (): string => {
  return format(new Date(), "yyyy-MM-dd");
};
