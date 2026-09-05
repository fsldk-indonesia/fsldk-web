import { Subscriber, BulkAddResult } from '../../entities/subscriber';

export interface SubscriptionIndexView {
  setSubscribers(subs: Subscriber[], count: number): void;
  onBulkAddResult(result: BulkAddResult): void;
  onUpdateSuccess(sub: Subscriber): void;
  onRemoveSuccess(id: number): void;
  onBulkRemoveSuccess(ids: number[]): void;
  onActionSettled(id: number): void;
  onAddSettled(): void;
  onEditSettled(): void;
}
