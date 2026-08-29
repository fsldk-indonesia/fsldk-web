import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Donation } from '../../entities/donation';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { KantongAmalAdminDonationMonitoringPresenter } from './kantong-amal.admin-donation-monitoring.presenter';
import { KantongAmalAdminDonationMonitoringView } from './kantong-amal.admin-donation-monitoring.view';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu', PAID: 'Lunas', EXPIRED: 'Kedaluwarsa', FAILED: 'Gagal',
  CANCELLED: 'Dibatalkan', REFUNDED: 'Dikembalikan', AMOUNT_MISMATCH: 'Perlu Verifikasi',
};

@Component({
  selector: 'app-kantong-amal-admin-donation-monitoring-page',
  standalone: true,
  templateUrl: './kantong-amal.admin-donation-monitoring.page.html',
  imports: [DatePipe, FormsModule, PaginationComponent],
  providers: [KantongAmalAdminDonationMonitoringPresenter],
  styles: [`
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .78rem; font-weight: 700; }
    .status-PAID { background: #dcfce7; color: #166534; }
    .status-PENDING { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .status-FAILED, .status-EXPIRED, .status-CANCELLED { background: #fee2e2; color: #991b1b; }
    .status-AMOUNT_MISMATCH { background: #fef3c7; color: #92400e; }
    .status-REFUNDED { background: #e0e7ff; color: #3730a3; }
  `],
})
export class KantongAmalAdminDonationMonitoringPage implements OnInit, KantongAmalAdminDonationMonitoringView {
  private presenter = inject(KantongAmalAdminDonationMonitoringPresenter);

  donations = signal<Donation[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  limit = 15;
  status = '';

  readonly formatRupiah = formatRupiah;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.load();
  }

  load(): void { this.presenter.load(this.page(), this.limit, this.status, null); }
  applyFilter(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }
  statusLabel(s: string): string { return STATUS_LABELS[s] ?? s; }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setDonations(donations: Donation[], count: number): void { this.donations.set(donations); this.count.set(count); }
}
