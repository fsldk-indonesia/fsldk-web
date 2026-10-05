export type EventStatus = 'upcoming' | 'ongoing' | 'past';

/** Label & ikon tampilan untuk EventStatus — dipakai bersama oleh index &
 *  detail (badge kartu, badge hero, dsb.) supaya tidak duplikat per halaman. */
export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  upcoming: 'Akan Datang',
  ongoing: 'Berlangsung',
  past: 'Telah Selesai',
};
export const EVENT_STATUS_ICON: Record<EventStatus, string> = {
  upcoming: 'calendar-days',
  ongoing: 'play-circle',
  past: 'check-circle',
};

/** Lightweight event shape used in list views. */
export interface EventListItem {
  eventID: number;
  eventTitle: string;
  eventSlug: string;
  eventDivision: string;
  eventImage: string | null;
  startDate: string | null;
  endDate: string | null;
  closeRegistDate: string | null;
  location: string | null;
  place: string | null;
  tag: string | null;
  isPublished: boolean;
  viewCount: number;
  status: EventStatus;
  registOpen: boolean;
}

/** Full event shape used in detail & CMS views. */
export interface Event extends EventListItem {
  eventContent: string;
  locationLink: string | null;
  registrationLink: string | null;
  documentLink: string | null;
  presentationLink: string | null;
  contactPerson1: string | null;
  nameCp1: string | null;
  contactPerson2: string | null;
  nameCp2: string | null;
  authorID: number;
}
