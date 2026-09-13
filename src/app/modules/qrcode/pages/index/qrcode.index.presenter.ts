import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { QrcodeRepository } from '../../repositories/qrcode.repository';
import { QrcodeStyleBody } from '../../services/qrcode-api.service';
import { QRCode } from '../../entities/qrcode';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { QrcodeIndexView } from './qrcode.index.view';

@Injectable()
export class QrcodeIndexPresenter extends BasePresenter<QrcodeIndexView> {
  private qrcodeRepo = inject(QrcodeRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — qrcode_dto.ListFilter cuma punya satu
   *  kolom pencarian gabungan (label/destinationURL/captionText, lihat
   *  qrcode_repository_impl.go), jadi searchTargets di config cuma satu
   *  target "search" yang dipetakan langsung ke situ. Tidak ada konsep
   *  Status di modul ini (bukan approval queue). */
  list(params: CmsListParams): Observable<Pagination<QRCode>> {
    return this.qrcodeRepo.list({
      page: params.page, limit: params.limit, sort: params.sort,
      search: (params.filters['search'] ?? [])[0] ?? '',
      dateFrom: params.dateFrom, dateTo: params.dateTo,
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

  bulkDelete(ids: number[]): void {
    this.qrcodeRepo.bulkDelete(ids).subscribe({
      next: () => { this.toast.success(`${ids.length} QR Code terpilih dihapus`); this.view.onBulkDeleteSuccess(); },
      error: () => {},
    });
  }

  download(id: number, size: number): void {
    this.qrcodeRepo.downloadImage(id, size).subscribe({
      next: ({ blob }) => this.view.saveBlob(blob, `qr-${id}-${size}.png`),
      error: () => this.toast.error('Gagal mengunduh gambar QR'),
    });
  }
}
