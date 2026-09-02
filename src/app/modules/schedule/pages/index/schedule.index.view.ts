import { Schedule } from '../../entities/schedule';

export interface ScheduleIndexView {
  setSchedules(items: Schedule[], count: number): void;
  onPublishToggleSuccess(): void;
  onRemoveSuccess(): void;
  onActionSettled(id: number): void;
}
