import { QRCodePIC } from '../../entities/qrcode-pic';

export interface QRCodeRequestSubmitView {
  setLoading(loading: boolean): void;
  onSubmitSuccess(): void;
  setPIC(pic: QRCodePIC | null): void;
}
