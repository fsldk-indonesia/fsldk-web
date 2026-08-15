export type EventStatus = 'upcoming' | 'ongoing' | 'past';

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
