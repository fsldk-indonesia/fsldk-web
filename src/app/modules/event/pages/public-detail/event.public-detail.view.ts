import { Event } from '../../entities/event';

export interface EventPublicDetailView {
  setLoading(loading: boolean): void;
  setEvent(event: Event | null): void;
}
