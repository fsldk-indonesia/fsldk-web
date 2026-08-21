import { ShortLinkRequest } from '../../entities/shortlink-request';

export interface ShortLinkRequestIndexView {
  setRequests(items: ShortLinkRequest[], count: number): void;
  onActionSettled(id: number): void;
  onApproveSuccess(): void;
  setRejectSaving(saving: boolean): void;
  onRejectSuccess(): void;
}
