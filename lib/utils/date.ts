import { format, formatDistanceToNowStrict, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDateTime(value: string) {
  return format(parseISO(value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatTime(value: string) {
  return format(parseISO(value), "HH:mm", { locale: ptBR });
}

export function formatShortDate(value: string) {
  return format(parseISO(value), "dd/MM", { locale: ptBR });
}

export function formatLongDate(value: string) {
  return format(parseISO(value), "EEEE, dd 'de' MMMM", { locale: ptBR });
}

export function formatRelativeDate(value: string | null | undefined) {
  if (!value) return "Sem histórico";
  return `${formatDistanceToNowStrict(parseISO(value), {
    addSuffix: true,
    locale: ptBR
  })}`.replace("aproximadamente ", "");
}

export function formatDayLabel(value: string) {
  const date = parseISO(value);
  if (isToday(date)) return "Hoje";
  return format(date, "EEE, dd/MM", { locale: ptBR });
}
