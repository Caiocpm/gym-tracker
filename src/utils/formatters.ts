// src/utils/formatters.ts

/**
 * Formata uma string de data (ex: ISO string ou YYYY-MM-DD) para uma string de data localizada.
 * @param dateString A string de data a ser formatada.
 * @param locale A localidade a ser usada para formatação (ex: 'en-US', 'pt-BR').
 * @param options Opções de formatação Intl.DateTimeFormatOptions.
 * @returns String de data formatada.
 */
export function formatLocalDate(
  dateString: string,
  locale: string = "pt-BR",
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Data inválida";
    }
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return "Data inválida";
  }
}

/**
 * Formata uma string de hora (HH:MM) para uma string de hora localizada.
 * @param timeString A string de hora a ser formatada.
 * @param locale A localidade a ser usada para formatação.
 * @param options Opções de formatação Intl.DateTimeFormatOptions.
 * @returns String de hora formatada.
 */
export function formatLocalTime(
  timeString: string,
  locale: string = "pt-BR",
  options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
): string {
  try {
    // Cria uma data fictícia para que o Intl.DateTimeFormat possa processar a hora
    const [hours, minutes] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    if (isNaN(date.getTime())) {
      return "Hora inválida";
    }
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    console.error("Erro ao formatar hora:", error);
    return "Hora inválida";
  }
}

/**
 * Formata uma string de data e hora (ex: ISO string) para uma string de data e hora localizada.
 * @param dateTimeString A string de data e hora a ser formatada.
 * @param locale A localidade a ser usada para formatação.
 * @param options Opções de formatação Intl.DateTimeFormatOptions.
 * @returns String de data e hora formatada.
 */
export function formatLocalDateTime(
  dateTimeString: string,
  locale: string = "pt-BR",
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) {
      return "Data/Hora inválida";
    }
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    console.error("Erro ao formatar data/hora:", error);
    return "Data/Hora inválida";
  }
}
