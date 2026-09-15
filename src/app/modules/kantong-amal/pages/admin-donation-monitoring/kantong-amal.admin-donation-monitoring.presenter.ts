import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { ToastService } from '../../../../core/services/toast.service';
import { Donation } from '../../entities/donation';
import { DonationRepository } from '../../repositories/donation.repository';
import { KantongAmalAdminDonationMonitoringView } from './kantong-amal.admin-donation-monitoring.view';

@Injectable()
export class KantongAmalAdminDonationMonitoringPresenter extends BasePresenter<KantongAmalAdminDonationMonitoringView> {
  private donationRepo = inject(DonationRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — Status & Metode (search target
   *  combobox) sama-sama genuinely multi-select bermakna (backend pakai
   *  klausa IN), Nominal exact-match, search mencari nama/email donatur &
   *  judul campaign sekaligus. */
  list(params: CmsListParams): Observable<Pagination<Donation>> {
    return this.donationRepo.cmsList({
      page: params.page, limit: params.limit, sort: params.sort,
      dateFrom: params.dateFrom, dateTo: params.dateTo,
      search: (params.filters['search'] ?? [])[0] ?? '',
      status: params.status.join(','),
      paymentMethod: (params.filters['paymentMethod'] ?? []).join(','),
      amount: (params.filters['amount'] ?? [])[0] ?? '',
    });
  }

  delete(id: number): void {
    this.view.setBusy(id, true);
    this.donationRepo.adminDelete(id).subscribe({
      next: () => { this.toast.success('Donasi manual dihapus'); this.view.onMutated(); this.view.onActionSettled(id); },
      error: () => this.view.onActionSettled(id),
    });
  }

  bulkDelete(ids: number[]): void {
    this.donationRepo.bulkDelete(ids).subscribe({
      next: (r) => {
        this.toast.success(`${r.deleted.length} donasi dihapus${r.skipped.length ? `, ${r.skipped.length} dilewati` : ''}`);
        this.view.onMutated();
      },
      error: () => {},
    });
  }
}
