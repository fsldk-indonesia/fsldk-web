import { CalendarCell, Schedule } from '../../entities/schedule';

export type { CalendarCell };

export interface SchedulePublicIndexView {
  setLoading(loading: boolean): void;
  setPeriod(year: number, month: number): void;
  setCalendar(weeks: CalendarCell[][]): void;
  setAgenda(items: Schedule[]): void;
  setError(message: string | null): void;
}
