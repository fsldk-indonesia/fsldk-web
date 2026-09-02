import { Schedule } from '../../entities/schedule';

/** One day cell in the 6×7 calendar grid. */
export interface CalendarCell {
  date: Date;
  iso: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  items: Schedule[];
}

export interface SchedulePublicIndexView {
  setLoading(loading: boolean): void;
  setPeriod(year: number, month: number): void;
  setCalendar(weeks: CalendarCell[][]): void;
  setAgenda(items: Schedule[]): void;
  setError(message: string | null): void;
}
