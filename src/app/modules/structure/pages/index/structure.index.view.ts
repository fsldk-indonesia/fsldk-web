export interface StructureIndexView {
  onRemoveSuccess(): void;
  onBulkDeleteSuccess(): void;
  onActionSettled(id: number): void;
}
