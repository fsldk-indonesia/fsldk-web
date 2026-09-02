import { Schedule } from './entities/schedule';

/** Month names, index 0 = Januari. Use monthName(1..12) to read them. */
export const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** Weekday names, Monday first (index 0 = Senin) — matches mondayIndex(). */
export const DAYS_ID = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
export const DAYS_ID_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export interface ScheduleCategoryMeta {
  value: string;
  label: string;
  color: string;
}

/** Fixed category list — mirrors constants.ScheduleCategories on the backend. */
export const SCHEDULE_CATEGORIES: ScheduleCategoryMeta[] = [
  { value: 'kajian', label: 'Kajian', color: '#2563eb' },
  { value: 'rapat', label: 'Rapat', color: '#7c3aed' },
  { value: 'daurah', label: 'Daurah / Pelatihan', color: '#059669' },
  { value: 'aksi', label: 'Aksi Sosial', color: '#dc2626' },
  { value: 'kaderisasi', label: 'Kaderisasi', color: '#d97706' },
  { value: 'keputrian', label: 'Keputrian', color: '#db2777' },
  { value: 'lomba', label: 'Lomba / Event', color: '#0891b2' },
  { value: 'libur', label: 'Libur / Tanggal Merah', color: '#6b7280' },
  { value: 'lainnya', label: 'Lainnya', color: '#4b5563' },
];

const CATEGORY_FALLBACK = SCHEDULE_CATEGORIES[SCHEDULE_CATEGORIES.length - 1];

export function categoryMeta(value: string): ScheduleCategoryMeta {
  return SCHEDULE_CATEGORIES.find((c) => c.value === value) ?? CATEGORY_FALLBACK;
}

export function monthName(month: number): string {
  return MONTHS_ID[month - 1] ?? '';
}

// --- Date helpers (local wall-clock, no timezone conversion) ---

/** Parse "YYYY-MM-DD" into a local Date at midnight. */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Format a local Date as "YYYY-MM-DD". */
export function toISODate(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

export function sameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Weekday index with Monday = 0 ... Sunday = 6. */
export function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** 42-cell grid (6 weeks) starting on the Monday of the week containing the 1st. */
export function buildCalendarGrid(year: number, month1to12: number): Date[] {
  const first = new Date(year, month1to12 - 1, 1);
  const start = addDays(first, -mondayIndex(first));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** Schedules active on date `d` (inclusive range, time-of-day ignored). */
export function schedulesOnDate(list: Schedule[], d: Date): Schedule[] {
  const key = toISODate(d);
  return list.filter((s) => key >= s.startDate && key <= (s.endDate ?? s.startDate));
}

/** True when the schedule covers any day of the given month. */
export function touchesMonth(s: Schedule, year: number, month1to12: number): boolean {
  const monthStart = toISODate(new Date(year, month1to12 - 1, 1));
  const monthEnd = toISODate(new Date(year, month1to12, 0));
  return s.startDate <= monthEnd && (s.endDate ?? s.startDate) >= monthStart;
}

export function formatTimeRange(s: Schedule): string {
  if (s.isAllDay) return 'Sepanjang hari';
  if (!s.startTime) return '';
  return s.endTime ? `${s.startTime}–${s.endTime}` : `${s.startTime}–selesai`;
}

export function formatDateRange(s: Schedule): string {
  const start = parseISODate(s.startDate);
  const startStr = `${start.getDate()} ${monthName(start.getMonth() + 1)} ${start.getFullYear()}`;
  if (!s.endDate || s.endDate === s.startDate) return startStr;
  const end = parseISODate(s.endDate);
  return `${startStr} – ${end.getDate()} ${monthName(end.getMonth() + 1)} ${end.getFullYear()}`;
}

/** "Sabtu, 15 Agustus 2026" */
export function formatLongDate(d: Date): string {
  return `${DAYS_ID[mondayIndex(d)]}, ${d.getDate()} ${monthName(d.getMonth() + 1)} ${d.getFullYear()}`;
}
