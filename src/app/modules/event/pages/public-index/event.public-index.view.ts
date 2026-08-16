import { Event } from '../../entities/event';

export interface EventPublicIndexView {
  setLoading(loading: boolean): void;
  setEvents(events: Event[], count: number): void;
}
