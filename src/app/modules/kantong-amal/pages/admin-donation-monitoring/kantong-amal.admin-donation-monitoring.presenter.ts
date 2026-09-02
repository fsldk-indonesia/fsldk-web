import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { DonationRepository } from '../../repositories/donation.repository';
import { KantongAmalAdminDonationMonitoringView } from './kantong-amal.admin-donation-monitoring.view';

@Injectable()
export class KantongAmalAdminDonationMonitoringPresenter extends BasePresenter<KantongAmalAdminDonationMonitoringView> {
  private donationRepo = inject(DonationRepository);

  load(page: number, limit: number, status: string, campaignID: number | null): void {
    this.view.setLoading(true);
    this.donationRepo.cmsList({ page, limit, status: status || undefined, campaignID: campaignID || undefined }).subscribe({
      next: (p) => { this.view.setDonations(p.data, p.count); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }

  delete(id: number): void {
    this.view.setBusy(id, true);
    this.donationRepo.adminDelete(id).subscribe({
      next: () => { this.view.setBusy(id, false); this.view.onDeleteSuccess(); },
      error: () => this.view.setBusy(id, false),
    });
  }
}
