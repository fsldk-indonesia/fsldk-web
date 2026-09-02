/** One schedule (activity) as returned by the API. Dates are "YYYY-MM-DD",
 *  times "HH:mm"; endDate is null for a single-day activity. */
export interface Schedule {
  scheduleID: number;
  title: string;
  category: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  isAllDay: boolean;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  organizer: string | null;
  contactPerson: string | null;
  url: string | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}
