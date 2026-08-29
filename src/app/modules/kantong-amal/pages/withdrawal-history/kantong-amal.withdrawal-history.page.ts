import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { Withdrawal } from '../../entities/withdrawal';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { AlertService } from '../../../../core/services/alert.service';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalWithdrawalHistoryPresenter } from './kantong-amal.withdrawal-history.presenter';
import { KantongAmalWithdrawalHistoryView } from './kantong-amal.withdrawal-history.view';

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Diajukan', SECURITY_CHECK: 'Verifikasi Keamanan', PENDING_APPROVAL: 'Menunggu Persetujuan',
  APPROVED: 'Disetujui', PROCESSING: 'Diproses', SUCCESS: 'Berhasil', FAILED: 'Gagal',
  REJECTED: 'Ditolak', CANCELLED: 'Dibatalkan', REVERSED: 'Dibatalkan Sistem',
};
const CANCELLABLE = ['REQUESTED', 'SECURITY_CHECK', 'PENDING_APPROVAL'];

@Component({
  selector: 'app-kantong-amal-withdrawal-history-page',
  standalone: true,
  templateUrl: './kantong-amal.withdrawal-history.page.html',
  imports: [RouterLink, DatePipe, UpperCasePipe],
  providers: [KantongAmalWithdrawalHistoryPresenter],
  styles: [`
    .page-head { max-width: 960px; margin: 0 auto 24px; }
    .card-wrap { max-width: 960px; margin: 0 auto; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .78rem; font-weight: 700; }
    .status-SUCCESS { background: #dcfce7; color: #166534; }
    .status-FAILED, .status-REJECTED, .status-REVERSED { background: #fee2e2; color: #991b1b; }
    .status-CANCELLED { background: #f3f4f6; color: #4b5563; }
    .status-REQUESTED, .status-SECURITY_CHECK, .status-PENDING_APPROVAL, .status-APPROVED, .status-PROCESSING { background: var(--color-primary-soft); color: var(--color-primary-dark); }
  `],
})
export class KantongAmalWithdrawalHistoryPage implements OnInit, KantongAmalWithdrawalHistoryView {
  private presenter = inject(KantongAmalWithdrawalHistoryPresenter);
  private route = inject(ActivatedRoute);
  private alert = inject(AlertService);

  withdrawals = signal<Withdrawal[]>([]);
  loading = signal(true);

  readonly kantongAmalPath = kantongAmalPath;
  readonly formatRupiah = formatRupiah;

  private campaignID = 0;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.campaignID = Number(this.route.snapshot.paramMap.get('id'));
    this.presenter.load(this.campaignID);
  }

  statusLabel(status: string): string { return STATUS_LABELS[status] ?? status; }
  canCancel(status: string): boolean { return CANCELLABLE.includes(status); }

  async cancel(w: Withdrawal, event: Event): Promise<void> {
    const ok = await this.alert.confirm(`Batalkan permintaan penarikan ${formatRupiah(w.amount)}?`, { variant: 'danger' }, event);
    if (ok) this.presenter.cancel(w.withdrawalID);
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setWithdrawals(withdrawals: Withdrawal[]): void { this.withdrawals.set(withdrawals); }
  onCancelSuccess(): void { this.presenter.load(this.campaignID); }
}
