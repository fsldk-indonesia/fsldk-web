import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { IconComponent } from '../../../../shared/icon.component';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { Donation } from '../../entities/donation';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalAdminDonationMonitoringPresenter } from './kantong-amal.admin-donation-monitoring.presenter';
import { KantongAmalAdminDonationMonitoringView } from './kantong-amal.admin-donation-monitoring.view';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu', PAID: 'Lunas', EXPIRED: 'Kedaluwarsa', FAILED: 'Gagal',
  CANCELLED: 'Dibatalkan', REFUNDED: 'Dikembalikan', AMOUNT_MISMATCH: 'Perlu Verifikasi',
};

// Hanya donasi manual yang punya kolom paymentMethod terisi (donasi gateway
// Bisatopup selalu QRIS tapi TIDAK menyimpan nilai ini, murni asumsi tampilan
// di rowTemplate) — filter Metode di bawah karenanya hanya benar-benar
// mencocokkan donasi manual, konsisten dengan constraint yang sama di
// admin-donation-form.page.ts (PAYMENT_METHOD_OPTIONS).
const PAYMENT_METHOD_OPTIONS = [
  { id: 'CASH', label: 'Tunai' },
  { id: 'QRIS', label: 'QRIS (di luar Bisatopup)' },
  { id: 'EWALLET', label: 'E-Wallet' },
  { id: 'TRANSFER', label: 'Transfer' },
  { id: 'BANK_TRANSFER', label: 'Transfer Bank' },
  { id: 'OTHER', label: 'Lainnya' },
];

/** Config CmsIndexConfig<Donation> — backend hanya punya sort dinamis untuk
 *  createdDate/amount (lihat donation_service_impl.go sortColumns), jadi
 *  kolom lain diset sortable:false. Status genuinely multi-select bermakna. */
function buildDonationIndexConfig(): CmsIndexConfig<Donation> {
  return {
    entityLabel: 'donasi',
    guideCards: [
      { icon: 'plus', title: 'Donasi Manual', description: 'Klik <strong>"Tambah Donasi Manual"</strong> untuk mencatat donasi tunai/transfer di luar Bisatopup.' },
      { icon: 'search', title: 'Filter & Pencarian', description: 'Cari nama/email donatur atau judul campaign, pilih status, atau atur rentang tanggal.' },
      { icon: 'eye', title: 'Lihat Detail', description: 'Klik baris mana pun untuk melihat detail donasi — donasi Bisatopup hanya bisa dilihat, tidak diubah.' },
      { icon: 'trash', title: 'Hapus & Aksi Massal', description: 'Donasi manual bisa dihapus satu-satu atau massal — donasi Bisatopup otomatis dilewati.' },
    ],
    statusOptions: [
      { value: 'PENDING', label: 'Menunggu' },
      { value: 'PAID', label: 'Lunas' },
      { value: 'EXPIRED', label: 'Kedaluwarsa' },
      { value: 'FAILED', label: 'Gagal' },
      { value: 'CANCELLED', label: 'Dibatalkan' },
      { value: 'REFUNDED', label: 'Dikembalikan' },
      { value: 'AMOUNT_MISMATCH', label: 'Perlu Verifikasi' },
    ],
    searchTargets: [
      { value: 'search', label: 'Donatur / Campaign' },
      { value: 'paymentMethod', label: 'Metode', mode: 'combobox', loadOptions: () => of(PAYMENT_METHOD_OPTIONS) },
      { value: 'amount', label: 'Nominal' },
    ],
    showDateRange: true,
    columns: [
      { key: 'campaignTitle', label: 'Campaign', locked: true, sortable: false },
      { key: 'donorName', label: 'Donatur', sortable: false },
      { key: 'amount', label: 'Nominal' },
      { key: 'paymentMethod', label: 'Metode', sortable: false },
      { key: 'paymentStatus', label: 'Status', sortable: false },
      { key: 'createdDate', label: 'Tanggal' },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'donationID',
    limit: 15,
    emptyIcon: 'hand-coins',
    emptyTitle: 'Belum ada donasi',
    emptyDescription: 'Donasi yang masuk lintas campaign akan muncul di sini.',
    createRoute: kantongAmalPath.donationCreate,
    createLabel: 'Tambah Donasi Manual',
  };
}

@Component({
  selector: 'app-kantong-amal-admin-donation-monitoring-page',
  standalone: true,
  templateUrl: './kantong-amal.admin-donation-monitoring.page.html',
  imports: [DatePipe, RouterLink, IconComponent, CmsIndexComponent],
  providers: [KantongAmalAdminDonationMonitoringPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .78rem; font-weight: 700; }
    .status-PAID { background: #dcfce7; color: #166534; }
    .status-PENDING { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .status-FAILED, .status-EXPIRED, .status-CANCELLED { background: #fee2e2; color: #991b1b; }
    .status-AMOUNT_MISMATCH { background: #fef3c7; color: #92400e; }
    .status-REFUNDED { background: #e0e7ff; color: #3730a3; }
    .gateway-badge { font-size: .72rem; color: var(--color-text-secondary); margin-left: 4px; }
    .table-actions { justify-content: center; }
  `],
})
export class KantongAmalAdminDonationMonitoringPage implements OnInit, KantongAmalAdminDonationMonitoringView {
  private presenter = inject(KantongAmalAdminDonationMonitoringPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);
  private router = inject(Router);

  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<Donation>;

  readonly kantongAmalPath = kantongAmalPath;
  readonly formatRupiah = formatRupiah;
  busyIDs = signal<Set<number>>(new Set());

  canCreate = this.auth.hasPermission('kantong_amal.donation.create');
  canUpdate = this.auth.hasPermission('kantong_amal.donation.update');
  canDelete = this.auth.hasPermission('kantong_amal.donation.delete');

  readonly config = buildDonationIndexConfig();
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  ngOnInit(): void { this.presenter.attachView(this); }

  statusLabel(s: string): string { return STATUS_LABELS[s] ?? s; }
  isBusy(id: number): boolean { return this.busyIDs().has(id); }

  viewDonation(d: Donation): void {
    if (d.gateway === 'manual' && this.canUpdate) {
      this.router.navigate([this.kantongAmalPath.donationEdit(d.donationID)]);
    } else {
      this.router.navigate([this.kantongAmalPath.donationView(d.donationID)]);
    }
  }

  async delete(d: Donation, event: Event): Promise<void> {
    event.stopPropagation();
    const ok = await this.alert.confirm(`Hapus donasi manual dari "${d.donorName}" senilai ${this.formatRupiah(d.amount)}?`, { variant: 'danger' }, event);
    if (ok) this.presenter.delete(d.donationID);
  }

  onBulkDelete(ids: (string | number)[]): void { this.presenter.bulkDelete(ids as number[]); }

  setBusy(id: number, busy: boolean): void {
    const next = new Set(this.busyIDs());
    if (busy) next.add(id); else next.delete(id);
    this.busyIDs.set(next);
  }
  onActionSettled(id: number): void { this.setBusy(id, false); }
  onMutated(): void { this.table.refresh(); }
}
