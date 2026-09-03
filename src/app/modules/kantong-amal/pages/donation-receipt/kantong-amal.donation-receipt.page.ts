import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Donation } from '../../entities/donation';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalDonationReceiptPresenter } from './kantong-amal.donation-receipt.presenter';
import { KantongAmalDonationReceiptView } from './kantong-amal.donation-receipt.view';

@Component({
  selector: 'app-kantong-amal-donation-receipt-page',
  standalone: true,
  templateUrl: './kantong-amal.donation-receipt.page.html',
  imports: [RouterLink, DatePipe],
  providers: [KantongAmalDonationReceiptPresenter],
  styles: [`
    .receipt-card { max-width: 520px; margin: 0 auto; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 32px; }
    .receipt-head { text-align: center; padding-bottom: 20px; border-bottom: 1px dashed var(--color-border); margin-bottom: 20px; }
    .receipt-head .amount { font-size: 1.7rem; font-weight: 800; color: var(--color-primary-dark); margin-top: 6px; }
    .receipt-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: .9rem; border-bottom: 1px solid var(--color-border); }
    .receipt-row:last-of-type { border-bottom: none; }
    .receipt-row span:first-child { color: var(--color-text-secondary); }
    .receipt-actions { display: flex; gap: 10px; margin-top: 24px; }
    @media print {
      app-site-header, app-site-footer, .receipt-actions, .no-print { display: none !important; }
      .receipt-card { border: none; box-shadow: none; }
    }
  `],
})
export class KantongAmalDonationReceiptPage implements OnInit, KantongAmalDonationReceiptView {
  private presenter = inject(KantongAmalDonationReceiptPresenter);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);

  donation = signal<Donation | null>(null);
  loading = signal(true);

  readonly kantongAmalPath = kantongAmalPath;
  readonly formatRupiah = formatRupiah;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load(this.route.snapshot.paramMap.get('publicRef')!);
  }

  print(): void {
    if (isPlatformBrowser(this.platformId)) window.print();
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setDonation(donation: Donation | null): void { this.donation.set(donation); }
}
