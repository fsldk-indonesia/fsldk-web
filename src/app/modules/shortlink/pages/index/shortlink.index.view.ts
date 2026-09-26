export interface ShortlinkIndexView {
  setSaving(saving: boolean): void;
  onSaveSuccess(): void;
  onRemoveSuccess(): void;
  onBulkDeleteSuccess(): void;
  onActionSettled(id: number): void;
}
