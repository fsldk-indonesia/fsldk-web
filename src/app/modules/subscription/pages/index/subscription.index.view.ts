import { BulkAddResult } from '../../entities/subscriber';

export interface SubscriptionIndexView {
  setAdding(adding: boolean): void;
  setSaving(saving: boolean): void;
  onBulkAddResult(result: BulkAddResult): void;
  onUpdateSuccess(): void;
  onRemoveSuccess(): void;
  onBulkDeleteSuccess(): void;
  onActionSettled(id: number): void;
}
