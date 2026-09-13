import { ContactDetail } from '../../entities/contact';

export interface ContactIndexView {
  setDetail(detail: ContactDetail): void;
  setSending(sending: boolean): void;
  onReplySuccess(): void;
  onRemoveSuccess(): void;
  onBulkDeleteSuccess(): void;
  onActionSettled(id: number): void;
}
