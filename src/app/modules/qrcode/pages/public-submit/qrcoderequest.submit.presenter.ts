import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { QrcodeRequestRepository } from '../../repositories/qrcoderequest.repository';
import { SubmitQRCodeRequestBody } from '../../services/qrcoderequest-api.service';
import { QRCodeRequestSubmitView } from './qrcoderequest.submit.view';

@Injectable()
export class QrcodeRequestSubmitPresenter extends BasePresenter<QRCodeRequestSubmitView> {
  private qrcodeRequestRepo = inject(QrcodeRequestRepository);

  submit(body: SubmitQRCodeRequestBody): void {
    this.view.setLoading(true);
    this.qrcodeRequestRepo.submit(body).subscribe({
      next: () => { this.view.setLoading(false); this.view.onSubmitSuccess(); },
      error: () => this.view.setLoading(false),
    });
  }

  /** Kartu "Konfirmasi via WhatsApp" bersifat dekoratif/opsional — kegagalan
   *  memuat PIC (belum dikonfigurasi atau error jaringan) tidak boleh
   *  mengganggu alur pengisian form, jadi tidak ada toast error di sini. */
  loadPIC(): void {
    this.qrcodeRequestRepo.pic().subscribe({
      next: (pic) => this.view.setPIC(pic),
      error: () => this.view.setPIC(null),
    });
  }
}
