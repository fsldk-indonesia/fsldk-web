import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Donation } from '../../entities/donation';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { AlertService } from '../../../../core/services/alert.service';
import { ToastService } from '../../../../core/services/toast.service';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalAdminDonationMonitoringPresenter } from './kantong-amal.admin-donation-monitoring.presenter';
import { KantongAmalAdminDonationMonitoringView } from './kantong-amal.admin-donation-monitoring.view';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu', PAID: 'Lunas', EXPIRED: 'Kedaluwarsa', FAILED: 'Gagal',
  CANCELLED: 'Dibatalkan', REFUNDED: 'Dikembalikan', AMOUNT_MISMATCH: 'Perlu Verifikasi',
};

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Semua Status' },
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'PAID', label: 'Lunas' },
  { value: 'EXPIRED', label: 'Kedaluwarsa' },
  { value: 'FAILED', label: 'Gagal' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
  { value: 'REFUNDED', label: 'Dikembalikan' },
  { value: 'AMOUNT_MISMATCH', label: 'Perlu Verifikasi' },
];

@Component({
  selector: 'app-kantong-amal-admin-donation-monitoring-page',
  standalone: true,
  templateUrl: './kantong-amal.admin-donation-monitoring.page.html',
  imports: [DatePipe, FormsModule, RouterLink, IconComponent, PaginationComponent, SelectComponent],
  providers: [KantongAmalAdminDonationMonitoringPresenter],
  styles: [`
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .78rem; font-weight: 700; }
    .status-PAID { background: #dcfce7; color: #166534; }
    .status-PENDING { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .status-FAILED, .status-EXPIRED, .status-CANCELLED { background: #fee2e2; color: #991b1b; }
    .status-AMOUNT_MISMATCH { background: #fef3c7; color: #92400e; }
    .status-REFUNDED { background: #e0e7ff; color: #3730a3; }
    .gateway-badge { font-size: .72rem; color: var(--color-text-secondary); margin-left: 4px; }
    .table-actions { gap: 10px; justify-content: flex-end; }
    .table td:last-child { padding-right: 20px; }
  `],
})
export class KantongAmalAdminDonationMonitoringPage implements OnInit, KantongAmalAdminDonationMonitoringView {
  private presenter = inject(KantongAmalAdminDonationMonitoringPresenter);
  private alert = inject(AlertService);
  private toast = inject(ToastService);

  donations = signal<Donation[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  limit = 15;
  status = '';
  busyIDs = signal<Set<number>>(new Set());

  readonly formatRupiah = formatRupiah;
  readonly statusOptions = STATUS_OPTIONS;
  readonly kantongAmalPath = kantongAmalPath;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.load();
  }

  load(): void { this.presenter.load(this.page(), this.limit, this.status, null); }
  applyFilter(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }
  statusLabel(s: string): string { return STATUS_LABELS[s] ?? s; }
  isBusy(id: number): boolean { return this.busyIDs().has(id); }

  async delete(d: Donation, event: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus donasi manual dari "${d.donorName}" senilai ${this.formatRupiah(d.amount)}?`, { variant: 'danger' }, event);
    if (ok) this.presenter.delete(d.donationID);
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setDonations(donations: Donation[], count: number): void { this.donations.set(donations); this.count.set(count); }
  setBusy(id: number, busy: boolean): void {
    const next = new Set(this.busyIDs());
    if (busy) next.add(id); else next.delete(id);
    this.busyIDs.set(next);
  }
  onDeleteSuccess(): void { this.toast.success('Donasi manual berhasil dihapus.'); this.load(); }
}
