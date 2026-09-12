export interface ScheduleIndexView {
  onPublishToggleSuccess(wasActive: boolean): void;
  onRemoveSuccess(): void;
  onBulkDeleteSuccess(): void;
  onActionSettled(id: number): void;
}
