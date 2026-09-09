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
  addHours,
  addMinutes,
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

export interface ParsedDateTime {
  cleanTitle: string;
  dueDate: string | null;
  dueTime: string | null;
  detectedText?: string;
}

/**
 * Natural language parser for extracting date and time from task titles
 * e.g., "Call Sarah tomorrow at 3pm", "Meeting friday 10am", "Review PR at 16:30"
 */
export function parseNaturalDateTime(
  input: string,
  defaultDate?: Date | null
): ParsedDateTime {
  let text = input.trim();
  if (!text) {
    return { cleanTitle: '', dueDate: null, dueTime: null };
  }

  const now = defaultDate || new Date();
  let targetDate: Date | null = null;
  let targetTime: string | null = null;
  const matchedTokens: string[] = [];

  // 1. Match Time Patterns
  // Pattern A: "at 3pm", "by 5pm", "3:30pm", "10am", "12:00 pm"
  const timeRegex12h = /\b(?:(?:at|by|for|due)\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
  const match12h = text.match(timeRegex12h);
  if (match12h) {
    let hours = parseInt(match12h[1], 10);
    const minutes = match12h[2] ? parseInt(match12h[2], 10) : 0;
    const meridiem = match12h[3].toLowerCase();

    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;

    targetTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    matchedTokens.push(match12h[0]);
  } else {
    // Pattern B: "at 14:30", "by 16:00"
    const timeRegex24h = /\b(?:at|by|for|due)\s+(\d{1,2}):(\d{2})\b/i;
    const match24h = text.match(timeRegex24h);
    if (match24h) {
      const hours = parseInt(match24h[1], 10);
      const minutes = parseInt(match24h[2], 10);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        targetTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        matchedTokens.push(match24h[0]);
      }
    } else {
      // Pattern C: "at 5", "by 3" (without am/pm)
      const matchAtHour = text.match(/\b(?:at|by)\s+(\d{1,2})\b/i);
      if (matchAtHour) {
        let hours = parseInt(matchAtHour[1], 10);
        if (hours >= 1 && hours <= 12) {
          if (hours >= 1 && hours <= 7) hours += 12; // 1-7 assume afternoon
          targetTime = `${hours.toString().padStart(2, '0')}:00`;
          matchedTokens.push(matchAtHour[0]);
        }
      } else {
        // Pattern D: "in 2 hours", "in 30 mins"
        const matchInTime = text.match(/\bin\s+(\d+)\s*(mins?|minutes?|hrs?|hours?)\b/i);
        if (matchInTime) {
          const amount = parseInt(matchInTime[1], 10);
          const unit = matchInTime[2].toLowerCase();
          const futureDate = unit.startsWith('m') ? addMinutes(now, amount) : addHours(now, amount);
          targetTime = format(futureDate, 'HH:mm');
          if (!targetDate) targetDate = futureDate;
          matchedTokens.push(matchInTime[0]);
        } else if (/\btonight\b/i.test(text)) {
          // Pattern E: "tonight" (20:00), "noon" (12:00), "midnight" (00:00)
          targetTime = '20:00';
          matchedTokens.push(text.match(/\btonight\b/i)![0]);
          if (!targetDate) targetDate = now;
        } else if (/\b(?:at\s+)?noon\b/i.test(text)) {
          targetTime = '12:00';
          matchedTokens.push(text.match(/\b(?:at\s+)?noon\b/i)![0]);
        } else if (/\b(?:at\s+)?midnight\b/i.test(text)) {
          targetTime = '00:00';
          matchedTokens.push(text.match(/\b(?:at\s+)?midnight\b/i)![0]);
        }
      }
    }
  }

  // 2. Match Date Patterns
  const matchToday = text.match(/\b(?:(?:on|for|due)\s+)?today\b/i);
  const matchTmrw = text.match(/\b(?:(?:on|for|by|due)\s+)?(?:tomorrow|tmrw|tmr)\b/i);
  const matchYest = text.match(/\b(?:(?:on|for|by|due)\s+)?yesterday\b/i);
  const matchNextWeek = text.match(/\b(?:(?:on|for|by|due)\s+)?next\s+week\b/i);

  if (matchToday) {
    targetDate = now;
    matchedTokens.push(matchToday[0]);
  } else if (matchTmrw) {
    targetDate = addDays(now, 1);
    matchedTokens.push(matchTmrw[0]);
  } else if (matchYest) {
    targetDate = addDays(now, -1);
    matchedTokens.push(matchYest[0]);
  } else if (matchNextWeek) {
    targetDate = addWeeks(now, 1);
    matchedTokens.push(matchNextWeek[0]);
  } else {
    // Days of week: "monday", "next friday", "by sunday"
    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const shortDayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

    const dayRegex = /\b(?:(this|next|on|by|for|due)\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)\b/i;
    const matchDay = text.match(dayRegex);
    if (matchDay) {
      const modifier = matchDay[1]?.toLowerCase();
      const rawDay = matchDay[2].toLowerCase();
      let dayIndex = dayNames.indexOf(rawDay);
      if (dayIndex === -1) dayIndex = shortDayNames.indexOf(rawDay);

      if (dayIndex !== -1) {
        const currentDayIndex = now.getDay();
        let daysToAdd = (dayIndex - currentDayIndex + 7) % 7;
        if (daysToAdd === 0 || modifier === 'next') {
          daysToAdd += 7;
        }
        targetDate = addDays(now, daysToAdd);
        matchedTokens.push(matchDay[0]);
      }
    } else {
      // Month & Day: e.g. "Sep 15", "by October 3rd"
      const monthRegex = /\b(?:(?:on|by|for|due)\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\b/i;
      const matchMonth = text.match(monthRegex);
      if (matchMonth) {
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthIndex = monthNames.indexOf(matchMonth[1].toLowerCase().slice(0, 3));
        const dayNum = parseInt(matchMonth[2], 10);
        if (monthIndex !== -1 && dayNum >= 1 && dayNum <= 31) {
          const year = now.getFullYear();
          const candidate = new Date(year, monthIndex, dayNum);
          targetDate = candidate < startOfDay(now) ? new Date(year + 1, monthIndex, dayNum) : candidate;
          matchedTokens.push(matchMonth[0]);
        }
      }
    }
  }

  // Clean the title by removing matched tokens
  let cleanTitle = text;
  for (const token of matchedTokens) {
    cleanTitle = cleanTitle.replace(token, ' ');
  }
  // Remove dangling prepositions
  cleanTitle = cleanTitle
    .replace(/\b(at|on|by|for|due)\s*$/i, '')
    .replace(/^\s*(at|on|by|for|due)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanTitle) {
    cleanTitle = text;
  }

  return {
    cleanTitle,
    dueDate: targetDate ? format(targetDate, 'yyyy-MM-dd') : null,
    dueTime: targetTime,
    detectedText: matchedTokens.length > 0 ? matchedTokens.join(', ') : undefined,
  };
}

