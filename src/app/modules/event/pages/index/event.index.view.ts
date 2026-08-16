import { Event as AppEvent } from '../../entities/event';

export interface EventIndexView {
  setEvents(events: AppEvent[], count: number): void;
  onRemoveSuccess(): void;
  onActionSettled(id: number): void;
}
