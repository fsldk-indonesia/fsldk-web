import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { QrcodeRepository } from '../../repositories/qrcode.repository';
import { QrcodeDetailView } from './qrcode.detail.view';

@Injectable()
export class QrcodeDetailPresenter extends BasePresenter<QrcodeDetailView> {
  private qrcodeRepo = inject(QrcodeRepository);
  private toast = inject(ToastService);

  load(id: number): void {
    this.qrcodeRepo.publicDetail(id).subscribe({
      next: (qr) => this.view.setQrcode(qr),
      error: () => this.view.setNotFound(),
    });
  }

  download(id: number, size: number): void {
    this.view.setDownloading(true);
    this.qrcodeRepo.downloadImage(id, size).subscribe({
      next: ({ blob }) => { this.view.saveBlob(blob, `qr-${id}-${size}px.png`); this.view.setDownloading(false); },
      error: () => { this.toast.error('Gagal mengunduh gambar QR'); this.view.setDownloading(false); },
    });
  }
}
