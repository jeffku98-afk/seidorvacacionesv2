// ============================================
// Utilidades de Fecha
// ============================================

import {
  format,
  differenceInCalendarDays,
  eachDayOfInterval,
  parseISO,
  startOfMonth,
  endOfMonth,
  getDay,
  getDaysInMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";

/**
 * Calcula el total de días calendario entre dos fechas
 * INCLUYE sábados y domingos según requerimiento
 */
export function calculateTotalDays(start: string, end: string): number {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  return differenceInCalendarDays(endDate, startDate) + 1;
}

/**
 * Formatea una fecha ISO a formato legible en español
 * Ejemplo: "2026-03-25" → "25 de marzo de 2026"
 */
export function formatDateLong(dateStr: string): string {
  return format(parseISO(dateStr), "d 'de' MMMM 'de' yyyy", { locale: es });
}

/**
 * Formatea una fecha ISO a formato corto
 * Ejemplo: "2026-03-25" → "25 mar 2026"
 */
export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), "dd MMM yyyy", { locale: es });
}

/**
 * Obtiene el nombre del mes y año
 * Ejemplo: (2, 2026) → "Marzo 2026"
 */
export function getMonthYearLabel(month: number, year: number): string {
  const date = new Date(year, month);
  return format(date, "MMMM yyyy", { locale: es });
}

/**
 * Datos del calendario para un mes dado
 */
export function getCalendarData(month: number, year: number) {
  const firstDayOfMonth = startOfMonth(new Date(year, month));
  const startDayOfWeek = getDay(firstDayOfMonth); // 0=Dom, 6=Sab
  const totalDays = getDaysInMonth(firstDayOfMonth);

  return { startDayOfWeek, totalDays };
}

/**
 * Verifica si una fecha cae dentro de un rango
 */
export function isDateInRange(
  dateStr: string,
  startStr: string,
  endStr: string
): boolean {
  return dateStr >= startStr && dateStr <= endStr;
}

/**
 * Genera la cadena ISO de una fecha
 * Ejemplo: (2026, 2, 25) → "2026-03-25"
 */
export function toISODateString(
  year: number,
  month: number,
  day: number
): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Obtiene la fecha de hoy en formato ISO
 */
export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export { addMonths, subMonths };
