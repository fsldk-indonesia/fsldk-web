import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { QrcodeRepository } from '../../repositories/qrcode.repository';
import { QrcodeStyleBody } from '../../services/qrcode-api.service';
import { QrcodeIndexView } from './qrcode.index.view';

@Injectable()
export class QrcodeIndexPresenter extends BasePresenter<QrcodeIndexView> {
  private qrcodeRepo = inject(QrcodeRepository);
  private toast = inject(ToastService);

  load(page: number, limit: number, search: string): void {
    this.qrcodeRepo.list({ page, limit, search }).subscribe({
      next: (p) => this.view.setQrcodes(p.data, p.count),
      error: () => {},
    });
  }

  save(editId: number | null, body: QrcodeStyleBody): void {
    this.view.setSaving(true);
    const clean: QrcodeStyleBody = {
      destinationURL: body.destinationURL,
      label: body.label || undefined,
      foregroundColor: body.foregroundColor || undefined,
      backgroundColor: body.backgroundColor || undefined,
      centerIconURL: body.centerIconURL || undefined,
      centerIconKey: body.centerIconKey || undefined,
      captionText: body.captionText || undefined,
    };
    const done = (message: string) => { this.toast.success(message); this.view.setSaving(false); this.view.onSaveSuccess(); };
    const req = editId ? this.qrcodeRepo.update(editId, clean) : this.qrcodeRepo.create(clean);
    req.subscribe({
      next: () => done(editId ? 'QR Code diperbarui' : 'QR Code dibuat'),
      error: () => this.view.setSaving(false),
    });
  }

  remove(id: number): void {
    this.qrcodeRepo.remove(id).subscribe({
      next: () => { this.toast.success('QR Code dihapus'); this.view.onRemoveSuccess(); this.view.onActionSettled(id); },
      error: () => this.view.onActionSettled(id),
    });
  }

  download(id: number): void {
    this.qrcodeRepo.downloadImage(id, 1024).subscribe({
      next: ({ blob }) => this.view.saveBlob(blob, `qr-${id}.png`),
      error: () => this.toast.error('Gagal mengunduh gambar QR'),
    });
  }
}
