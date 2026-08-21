import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { ShortlinkRequestRepository } from '../../repositories/shortlinkrequest.repository';
import { ShortLinkRequestIndexView } from './shortlinkrequest.index.view';

@Injectable()
export class ShortLinkRequestIndexPresenter extends BasePresenter<ShortLinkRequestIndexView> {
  private shortlinkRequestRepo = inject(ShortlinkRequestRepository);
  private toast = inject(ToastService);

  load(page: number, limit: number, status: string): void {
    this.shortlinkRequestRepo.cmsList({ page, limit, status }).subscribe({
      next: (p) => this.view.setRequests(p.data, p.count),
      error: () => {},
    });
  }

  approve(id: number): void {
    this.shortlinkRequestRepo.approve(id).subscribe({
      next: () => { this.toast.success('Permintaan disetujui, shortlink berhasil dibuat'); this.view.onActionSettled(id); this.view.onApproveSuccess(); },
      error: () => this.view.onActionSettled(id),
    });
  }

  reject(id: number, reason: string): void {
    this.view.setRejectSaving(true);
    this.shortlinkRequestRepo.reject(id, reason).subscribe({
      next: () => { this.toast.success('Permintaan ditolak'); this.view.setRejectSaving(false); this.view.onRejectSuccess(); },
      error: () => this.view.setRejectSaving(false),
    });
  }
}
