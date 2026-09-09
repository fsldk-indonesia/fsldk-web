import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { QrcodeRequestRepository } from '../../repositories/qrcoderequest.repository';
import { QRCodeRequestIndexView } from './qrcoderequest.index.view';

@Injectable()
export class QRCodeRequestIndexPresenter extends BasePresenter<QRCodeRequestIndexView> {
  private qrcodeRequestRepo = inject(QrcodeRequestRepository);
  private toast = inject(ToastService);

  load(page: number, limit: number, status: string): void {
    this.qrcodeRequestRepo.cmsList({ page, limit, status }).subscribe({
      next: (p) => this.view.setRequests(p.data, p.count),
      error: () => {},
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
