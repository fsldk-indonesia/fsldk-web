import { Component, OnInit, OnDestroy, PLATFORM_ID, inject, signal } from '@angular/core';
import { DatePipe, UpperCasePipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Withdrawal, WithdrawalStatus } from '../../entities/withdrawal';
import { IconComponent } from '../../../../shared/icon.component';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalWithdrawalDetailPresenter } from './kantong-amal.withdrawal-detail.presenter';
import { KantongAmalWithdrawalDetailView } from './kantong-amal.withdrawal-detail.view';

const POLL_INTERVAL_MS = 5000;
const ONGOING_STATUSES: WithdrawalStatus[] = ['REQUESTED', 'SECURITY_CHECK', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING'];

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Diajukan', SECURITY_CHECK: 'Verifikasi Keamanan', APPROVED: 'Siap Diproses',
  PROCESSING: 'Diproses', SUCCESS: 'Berhasil', FAILED: 'Gagal',
  REJECTED: 'Ditolak', CANCELLED: 'Dibatalkan', REVERSED: 'Dibatalkan Sistem',
};

@Component({
  selector: 'app-kantong-amal-withdrawal-detail-page',
  standalone: true,
  templateUrl: './kantong-amal.withdrawal-detail.page.html',
  imports: [RouterLink, DatePipe, UpperCasePipe, IconComponent],
  providers: [KantongAmalWithdrawalDetailPresenter],
  styles: [`
    .wd-hero { border-radius: var(--radius-lg); padding: 24px 28px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; color: #fff; }
    .wd-hero-pending   { background: linear-gradient(135deg, #d97706, #b45309); }
    .wd-hero-success   { background: linear-gradient(135deg, #059669, #047857); }
    .wd-hero-failed    { background: linear-gradient(135deg, #dc2626, #b91c1c); }
    .wd-hero-draft     { background: linear-gradient(135deg, #6b7280, #4b5563); }
    .wd-hero-label { font-size: .78rem; font-weight: 700; opacity: .85; text-transform: uppercase; letter-spacing: .06em; }
    .wd-hero-amount { font-size: 1.9rem; font-weight: 800; line-height: 1.15; margin-top: 4px; }
    .wd-hero-ref { font-size: .74rem; opacity: .8; margin-top: 6px; font-family: monospace; }
    .wd-hero-right { text-align: center; }
    .wd-hero-status { font-size: .95rem; font-weight: 800; letter-spacing: .04em; margin-top: 6px; }
    .wd-polling-badge { display: inline-flex; align-items: center; gap: 8px; margin-top: 10px; padding: 5px 14px; border-radius: var(--radius-full); background: rgba(255,255,255,.18); font-size: .75rem; font-weight: 600; }
    .wd-polling-dot { width: 7px; height: 7px; border-radius: 50%; background: #fff; flex-shrink: 0; animation: node-pulse 1.4s ease-in-out infinite; }

    .wd-info-row { display: flex; align-items: baseline; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--color-border); font-size: .88rem; }
    .wd-info-row:last-child { border-bottom: none; }
    .wd-info-label { color: var(--color-text-secondary); min-width: 130px; flex-shrink: 0; }
    .wd-info-val { color: var(--color-text); font-weight: 600; }

    .wd-breakdown { margin-top: 16px; padding: 14px 16px; border-radius: var(--radius-md); background: var(--color-bg-alt); }
    .wd-breakdown-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: .88rem; }
    .wd-breakdown-row.total { border-top: 1px dashed var(--color-border); margin-top: 6px; padding-top: 10px; font-weight: 800; }

    .wd-timeline { list-style: none; padding: 0; margin: 0; position: relative; }
    .wd-timeline::before { content: ''; position: absolute; left: 17px; top: 4px; bottom: 4px; width: 2px; background: var(--color-border); }
    .wd-tl-item { display: flex; gap: 12px; align-items: flex-start; padding-bottom: 22px; position: relative; }
    .wd-tl-item:last-child { padding-bottom: 0; }
    .wd-tl-dot { flex-shrink: 0; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1; }
    .wd-tl-dot.done    { background: #dcfce7; color: #166534; }
    .wd-tl-dot.active  { background: #fef3c7; color: #92400e; }
    .wd-tl-dot.failed  { background: #fee2e2; color: #991b1b; }
    .wd-tl-dot.pending { background: var(--color-bg-alt); color: var(--color-muted); }
    .wd-tl-title { font-weight: 700; font-size: .9rem; color: var(--color-text); }
    .wd-tl-time { font-size: .78rem; color: var(--color-text-secondary); margin-top: 2px; }
  `],
})
export class KantongAmalWithdrawalDetailPage implements OnInit, OnDestroy, KantongAmalWithdrawalDetailView {
  private presenter = inject(KantongAmalWithdrawalDetailPresenter);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);

  withdrawal = signal<Withdrawal | null>(null);
  loading = signal(true);

  readonly kantongAmalPath = kantongAmalPath;
  readonly formatRupiah = formatRupiah;

  private withdrawalId = 0;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.withdrawalId = Number(this.route.snapshot.paramMap.get('id'));
    this.presenter.loadDetail(this.withdrawalId);
  }

  ngOnDestroy(): void { this.stopPolling(); }

  private startPolling(): void {
    if (!isPlatformBrowser(this.platformId) || this.pollTimer) return;
    this.pollTimer = setInterval(() => this.presenter.refresh(this.withdrawalId), POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }

  setWithdrawal(withdrawal: Withdrawal | null): void {
    this.withdrawal.set(withdrawal);
    if (withdrawal && ONGOING_STATUSES.includes(withdrawal.status)) {
      this.startPolling();
    } else {
      this.stopPolling();
    }
  }

  statusLabel(s: string): string { return STATUS_LABELS[s] ?? s; }

  isOngoing(): boolean {
    const s = this.withdrawal()?.status;
    return !!s && ONGOING_STATUSES.includes(s);
  }

  heroClass(): string {
    const s = this.withdrawal()?.status;
    if (s === 'SUCCESS') return 'wd-hero-success';
    if (s === 'FAILED' || s === 'REJECTED' || s === 'REVERSED') return 'wd-hero-failed';
    if (s === 'CANCELLED') return 'wd-hero-draft';
    return 'wd-hero-pending';
  }

  statusIcon(): string {
    const s = this.withdrawal()?.status;
    if (s === 'SUCCESS') return 'check-circle';
    if (s === 'FAILED' || s === 'REJECTED' || s === 'REVERSED' || s === 'CANCELLED') return 'x-circle';
    return 'clock';
  }

  // ── Timeline ─────────────────────────────────────────────
  securityDotClass(): string { return this.withdrawal()?.approvedDate ? 'done' : 'pending'; }
  executedDotClass(): string { return this.withdrawal()?.executedDate ? 'done' : 'pending'; }

  finalDotClass(): string {
    const s = this.withdrawal()?.status;
    if (s === 'SUCCESS') return 'done';
    if (s === 'FAILED' || s === 'REJECTED' || s === 'REVERSED') return 'failed';
    if (s === 'CANCELLED') return 'pending';
    return 'active';
  }

  finalIcon(): string {
    const s = this.withdrawal()?.status;
    if (s === 'SUCCESS') return 'check-circle';
    if (s === 'FAILED' || s === 'REJECTED' || s === 'REVERSED' || s === 'CANCELLED') return 'x-circle';
    return 'clock';
  }

  finalTitle(): string {
    const s = this.withdrawal()?.status;
    if (s === 'SUCCESS') return 'Transfer Selesai';
    if (s === 'FAILED') return 'Transfer Gagal';
    if (s === 'REJECTED') return 'Ditolak';
    if (s === 'REVERSED') return 'Dibatalkan Sistem';
    if (s === 'CANCELLED') return 'Dibatalkan';
    return 'Menunggu Konfirmasi Bisabiller';
  }
}
