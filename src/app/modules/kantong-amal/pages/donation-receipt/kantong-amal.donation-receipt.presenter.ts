import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { DonationRepository } from '../../repositories/donation.repository';
import { KantongAmalDonationReceiptView } from './kantong-amal.donation-receipt.view';

@Injectable()
export class KantongAmalDonationReceiptPresenter extends BasePresenter<KantongAmalDonationReceiptView> {
  private donationRepo = inject(DonationRepository);

  load(publicRef: string): void {
    this.view.setLoading(true);
    this.donationRepo.detail(publicRef).subscribe({
      next: (donation) => { this.view.setDonation(donation); this.view.setLoading(false); },
      error: () => { this.view.setDonation(null); this.view.setLoading(false); },
    });
  }
}
