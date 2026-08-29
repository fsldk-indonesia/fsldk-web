import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Withdrawal } from '../../entities/withdrawal';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { ToastService } from '../../../../core/services/toast.service';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { KantongAmalAdminWithdrawalApprovalPresenter } from './kantong-amal.admin-withdrawal-approval.presenter';
import { KantongAmalAdminWithdrawalApprovalView } from './kantong-amal.admin-withdrawal-approval.view';

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Diajukan', SECURITY_CHECK: 'Verifikasi Keamanan', PENDING_APPROVAL: 'Menunggu Persetujuan',
  APPROVED: 'Disetujui', PROCESSING: 'Diproses', SUCCESS: 'Berhasil', FAILED: 'Gagal',
  REJECTED: 'Ditolak', CANCELLED: 'Dibatalkan', REVERSED: 'Dibatalkan Sistem',
};

@Component({
  selector: 'app-kantong-amal-admin-withdrawal-approval-page',
  standalone: true,
  templateUrl: './kantong-amal.admin-withdrawal-approval.page.html',
  imports: [DatePipe, UpperCasePipe, FormsModule, PaginationComponent],
  providers: [KantongAmalAdminWithdrawalApprovalPresenter],
  styles: [`
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .78rem; font-weight: 700; }
    .status-SUCCESS { background: #dcfce7; color: #166534; }
    .status-FAILED, .status-REJECTED, .status-REVERSED { background: #fee2e2; color: #991b1b; }
    .status-CANCELLED { background: #f3f4f6; color: #4b5563; }
    .status-REQUESTED, .status-SECURITY_CHECK, .status-PENDING_APPROVAL, .status-APPROVED, .status-PROCESSING { background: var(--color-primary-soft); color: var(--color-primary-dark); }
  `],
})
export class KantongAmalAdminWithdrawalApprovalPage implements OnInit, KantongAmalAdminWithdrawalApprovalView {
  private presenter = inject(KantongAmalAdminWithdrawalApprovalPresenter);
  private alert = inject(AlertService);
  private toast = inject(ToastService);

  withdrawals = signal<Withdrawal[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  limit = 15;
  status = 'PENDING_APPROVAL';
  busyIDs = signal<Set<number>>(new Set());

  showRejectModal = signal(false);
  rejectTarget: Withdrawal | null = null;
  rejectReason = '';

  readonly formatRupiah = formatRupiah;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.load();
  }

  load(): void { this.presenter.load(this.page(), this.limit, this.status); }
  applyFilter(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }
  statusLabel(s: string): string { return STATUS_LABELS[s] ?? s; }
  isBusy(id: number): boolean { return this.busyIDs().has(id); }

  async approve(w: Withdrawal, event: Event): Promise<void> {
    const ok = await this.alert.confirm(`Setujui penarikan ${this.formatRupiah(w.amount)} untuk "${w.campaignTitle}"?`, {}, event);
    if (ok) this.presenter.approve(w.withdrawalID);
  }

  async process(w: Withdrawal, event: Event): Promise<void> {
    const ok = await this.alert.confirm(`Proses pencairan ${this.formatRupiah(w.amount)}? Ini akan mengeksekusi transfer ke rekening tujuan.`, { variant: 'danger' }, event);
    if (ok) this.presenter.process(w.withdrawalID);
  }

  openReject(w: Withdrawal): void {
    this.rejectTarget = w;
    this.rejectReason = '';
    this.showRejectModal.set(true);
  }

  closeReject(): void { this.showRejectModal.set(false); this.rejectTarget = null; }

  submitReject(): void {
    if (!this.rejectTarget || !this.rejectReason.trim()) { this.toast.error('Alasan penolakan wajib diisi.'); return; }
    this.presenter.reject(this.rejectTarget.withdrawalID, this.rejectReason);
    this.closeReject();
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
