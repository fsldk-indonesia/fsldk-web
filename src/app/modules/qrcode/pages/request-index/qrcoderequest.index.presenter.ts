import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { QrcodeRequestRepository } from '../../repositories/qrcoderequest.repository';
import { QRCodeRequest } from '../../entities/qrcode-request';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { QRCodeRequestIndexView } from './qrcoderequest.index.view';

@Injectable()
export class QRCodeRequestIndexPresenter extends BasePresenter<QRCodeRequestIndexView> {
  private qrcodeRequestRepo = inject(QrcodeRequestRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — status multi-select digabung
   *  comma-separated (backend parse lewat dto.ParseCSV, lihat
   *  qrcoderequest_handler_impl.go), search dipetakan ke satu target
   *  gabungan (requesterName/requesterEmail/destinationURL, lihat
   *  qrcoderequest_repository_impl.go List()). */
  list(params: CmsListParams): Observable<Pagination<QRCodeRequest>> {
    return this.qrcodeRequestRepo.cmsList({
      page: params.page, limit: params.limit, sort: params.sort,
      status: params.status.join(','),
      search: (params.filters['search'] ?? [])[0] ?? '',
      dateFrom: params.dateFrom, dateTo: params.dateTo,
    });
  }

  approve(id: number): void {
    this.qrcodeRequestRepo.approve(id).subscribe({
      next: () => { this.toast.success('Permintaan disetujui, QR Code berhasil dibuat'); this.view.onActionSettled(id); this.view.onApproveSuccess(); },
      error: () => this.view.onActionSettled(id),
    });
  }

  reject(id: number, reason: string): void {
    this.view.setRejectSaving(true);
    this.qrcodeRequestRepo.reject(id, reason).subscribe({
      next: () => { this.toast.success('Permintaan ditolak'); this.view.setRejectSaving(false); this.view.onRejectSuccess(); },
      error: () => this.view.setRejectSaving(false),
    });
  }
}
