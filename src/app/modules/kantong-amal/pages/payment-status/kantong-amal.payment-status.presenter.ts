import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { DonationRepository } from '../../repositories/donation.repository';
import { DonationStatus } from '../../entities/donation';
import { KantongAmalPaymentStatusView } from './kantong-amal.payment-status.view';

@Injectable()
export class KantongAmalPaymentStatusPresenter extends BasePresenter<KantongAmalPaymentStatusView> {
  private donationRepo = inject(DonationRepository);

  loadDetail(publicRef: string): void {
    this.view.setLoading(true);
    this.donationRepo.detail(publicRef).subscribe({
      next: (donation) => { this.view.setDonation(donation); this.view.setLoading(false); },
      error: () => { this.view.setDonation(null); this.view.setLoading(false); },
    });
  }

  /** Dipanggil tiap tick polling oleh page — hanya update status, bukan
   *  seluruh detail donasi (QR/kode pembayaran tidak pernah berubah). */
  checkStatus(publicRef: string, onStatus: (status: DonationStatus) => void): void {
    this.donationRepo.status(publicRef).subscribe({
      next: (res) => onStatus(res.paymentStatus),
      error: () => {},
    });
  }
}
