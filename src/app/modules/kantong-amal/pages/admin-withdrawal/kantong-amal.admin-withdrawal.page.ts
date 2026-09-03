import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Withdrawal } from '../../entities/withdrawal';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { IconComponent } from '../../../../shared/icon.component';
import { AlertService } from '../../../../core/services/alert.service';
import { ToastService } from '../../../../core/services/toast.service';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalAdminWithdrawalPresenter } from './kantong-amal.admin-withdrawal.presenter';
import { KantongAmalAdminWithdrawalView } from './kantong-amal.admin-withdrawal.view';

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Diajukan', SECURITY_CHECK: 'Verifikasi Keamanan', APPROVED: 'Siap Diproses',
  PROCESSING: 'Diproses', SUCCESS: 'Berhasil', FAILED: 'Gagal',
  REJECTED: 'Ditolak', CANCELLED: 'Dibatalkan', REVERSED: 'Dibatalkan Sistem',
};

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Semua Status' },
  { value: 'REQUESTED', label: 'Diajukan' },
  { value: 'SECURITY_CHECK', label: 'Verifikasi Keamanan' },
  { value: 'APPROVED', label: 'Siap Diproses' },
  { value: 'PROCESSING', label: 'Diproses' },
  { value: 'SUCCESS', label: 'Berhasil' },
  { value: 'FAILED', label: 'Gagal' },
  { value: 'REJECTED', label: 'Ditolak' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
  { value: 'REVERSED', label: 'Dibatalkan Sistem' },
];

@Component({
  selector: 'app-kantong-amal-admin-withdrawal-page',
  standalone: true,
  templateUrl: './kantong-amal.admin-withdrawal.page.html',
  imports: [DatePipe, UpperCasePipe, FormsModule, RouterLink, PaginationComponent, SelectComponent, IconComponent],
  providers: [KantongAmalAdminWithdrawalPresenter],
  styles: [`
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .78rem; font-weight: 700; }
    .status-SUCCESS { background: #dcfce7; color: #166534; }
    .status-FAILED, .status-REJECTED, .status-REVERSED { background: #fee2e2; color: #991b1b; }
    .status-CANCELLED { background: #f3f4f6; color: #4b5563; }
    .status-REQUESTED, .status-SECURITY_CHECK, .status-APPROVED, .status-PROCESSING { background: var(--color-primary-soft); color: var(--color-primary-dark); }
  `],
})
export class KantongAmalAdminWithdrawalPage implements OnInit, KantongAmalAdminWithdrawalView {
  private presenter = inject(KantongAmalAdminWithdrawalPresenter);
  private alert = inject(AlertService);
  private toast = inject(ToastService);

  withdrawals = signal<Withdrawal[]>([]);
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

  load(): void { this.presenter.load(this.page(), this.limit, this.status); }
  applyFilter(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }
  statusLabel(s: string): string { return STATUS_LABELS[s] ?? s; }
  isBusy(id: number): boolean { return this.busyIDs().has(id); }

  async process(w: Withdrawal, event: Event): Promise<void> {
    const ok = await this.alert.confirm(`Proses pencairan ${this.formatRupiah(w.amount)}? Ini akan mengeksekusi transfer ke rekening tujuan.`, { variant: 'danger' }, event);
    if (ok) this.presenter.process(w.withdrawalID);
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setWithdrawals(withdrawals: Withdrawal[], count: number): void { this.withdrawals.set(withdrawals); this.count.set(count); }
  setBusy(id: number, busy: boolean): void {
    const next = new Set(this.busyIDs());
    if (busy) next.add(id); else next.delete(id);
    this.busyIDs.set(next);
  }
  onActionSuccess(): void { this.toast.success('Aksi berhasil disimpan.'); this.load(); }
}
