import {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isSameDay,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  differenceInMinutes,
  differenceInDays,
  parseISO,
  isValid,
} from 'date-fns';

export {
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isSameDay,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  differenceInMinutes,
  differenceInDays,
  parseISO,
  isValid,
};

/**
 * Format a date string for display
 */
export function formatDate(dateStr: string | null, fallback = ''): string {
  if (!dateStr) return fallback;
  const date = parseISO(dateStr);
  if (!isValid(date)) return fallback;

  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';

  const now = new Date();
  const diffDays = differenceInDays(date, startOfDay(now));

  // Within this week
  if (diffDays > 0 && diffDays < 7) {
    return format(date, 'EEEE'); // e.g., "Wednesday"
  }

  // Same year
  if (date.getFullYear() === now.getFullYear()) {
    return format(date, 'MMM d'); // e.g., "Sep 15"
  }

  return format(date, 'MMM d, yyyy'); // e.g., "Sep 15, 2027"
}

/**
 * Format a time string for display
 */
export function formatTime(timeStr: string | null, use24h = false): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return '';

  if (use24h) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number | null): string {
  if (!minutes || minutes <= 0) return '';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours}h`;
  return `${hours}h ${remaining}m`;
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function getTodayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Get tomorrow's date as YYYY-MM-DD
 */
export function getTomorrowStr(): string {
  return format(addDays(new Date(), 1), 'yyyy-MM-dd');
}

/**
 * Check if a date string is overdue (before today)
 */
export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = parseISO(dateStr);
  if (!isValid(date)) return false;
  return isPast(endOfDay(date)) && !isToday(date);
}

/**
 * Check if a date string is due today
 */
export function isDueToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = parseISO(dateStr);
  return isValid(date) && isToday(date);
}

/**
 * Check if a date string is due this week
 */
export function isDueThisWeek(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = parseISO(dateStr);
  if (!isValid(date)) return false;
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  return date >= weekStart && date <= weekEnd;
}

/**
 * Get current ISO timestamp
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Get a date as YYYY-MM-DD
 */
export function toDateStr(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get days in a month for calendar rendering
 */
export function getCalendarDays(year: number, month: number, weekStartsOn: 0 | 1 = 1): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = endOfMonth(firstDay);
  const start = startOfWeek(firstDay, { weekStartsOn });
  const end = endOfWeek(lastDay, { weekStartsOn });

  const days: Date[] = [];
  let current = start;
  while (current <= end) {
    days.push(new Date(current));
    current = addDays(current, 1);
  }
  return days;
}

/**
 * Get the 7 days of the week containing the specified date
 */
export function getWeekDays(date: Date, weekStartsOn: 0 | 1 = 1): Date[] {
  const start = startOfWeek(date, { weekStartsOn });
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(start, i));
  }
  return days;
}

