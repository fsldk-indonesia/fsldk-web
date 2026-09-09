import { QRCodeRequest } from '../../entities/qrcode-request';

export interface QRCodeRequestIndexView {
  setRequests(items: QRCodeRequest[], count: number): void;
  onActionSettled(id: number): void;
  onApproveSuccess(): void;
  setRejectSaving(saving: boolean): void;
  onRejectSuccess(): void;
}
