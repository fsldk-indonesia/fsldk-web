import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { CampaignLite } from '../../entities/campaign';
import { AnalyticsResponse, BalanceReport, CampaignReportRow, DonationReportRow, GlobalLedgerRow, Reconciliation, WithdrawalReportRow, WithdrawalStatusFunnel } from '../../entities/report';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { DateTimePickerComponent } from '../../../../shared/datetime-picker.component';
import { IconComponent } from '../../../../shared/icon.component';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { KantongAmalAdminReportsPresenter } from './kantong-amal.admin-reports.presenter';
import { KantongAmalAdminReportsView } from './kantong-amal.admin-reports.view';

Chart.register(...registerables);

type ReportTab = 'balance' | 'campaigns' | 'donations' | 'withdrawals' | 'ledger-global' | 'analytics' | 'balance-report';

function isoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const CAMPAIGN_STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Semua Status' },
  { value: 'PUBLISHED', label: 'Tayang' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'PAUSED', label: 'Dijeda' },
  { value: 'ARCHIVED', label: 'Diarsipkan' },
];

const DONATION_STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Semua Status' },
  { value: 'PAID', label: 'Lunas' },
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'EXPIRED', label: 'Kedaluwarsa' },
  { value: 'FAILED', label: 'Gagal' },
];

const WITHDRAWAL_STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Semua Status' },
  { value: 'SUCCESS', label: 'Berhasil' },
  { value: 'APPROVED', label: 'Siap Diproses' },
  { value: 'REJECTED', label: 'Ditolak' },
  { value: 'FAILED', label: 'Gagal' },
];

const LEDGER_DIRECTION_OPTIONS: SelectOption[] = [
  { value: '', label: 'Semua Arah' },
  { value: 'CREDIT', label: 'Kredit (Masuk)' },
  { value: 'DEBIT', label: 'Debit (Keluar)' },
];

@Component({
  selector: 'app-kantong-amal-admin-reports-page',
  standalone: true,
  templateUrl: './kantong-amal.admin-reports.page.html',
  imports: [DatePipe, FormsModule, PaginationComponent, SelectComponent, DateTimePickerComponent, IconComponent],
  providers: [KantongAmalAdminReportsPresenter],
  styles: [`
    .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--color-border); margin-bottom: 20px; flex-wrap: wrap; }
    .tabs button { padding: 10px 16px; border: none; background: none; cursor: pointer; font-weight: 600; color: var(--color-text-secondary); border-bottom: 2px solid transparent; }
    .tabs button.active { color: var(--color-primary-dark); border-bottom-color: var(--color-primary); }
    .filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; margin-bottom: 16px; }
    .filters > div { display: flex; flex-direction: column; gap: 4px; }
    .balance-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
    .balance-card { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 16px; }
    .balance-card .label { font-size: .78rem; color: var(--color-text-secondary); }
    .balance-card .value { font-size: 1.2rem; font-weight: 800; margin-top: 4px; }
    .balanced-ok { color: #166534; } .balanced-bad { color: #991b1b; }
    .funnel-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
    .funnel-chip { background: var(--color-bg-alt); border-radius: 999px; padding: 6px 14px; font-size: .82rem; }
    .direction-badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: .76rem; font-weight: 700; }
    .direction-CREDIT { background: #dcfce7; color: #166534; }
    .direction-DEBIT { background: #fee2e2; color: #991b1b; }
    .analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .analytics-card { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 18px; }
    .analytics-card h4 { margin: 0 0 12px; font-size: .92rem; }
    .analytics-card canvas { max-height: 260px; }
    .anomaly-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .78rem; font-weight: 700; }
    .anomaly-yes { background: #fee2e2; color: #991b1b; }
    .anomaly-no { background: #dcfce7; color: #166534; }

    .settlement-banner { display: flex; align-items: flex-start; gap: 12px; padding: 14px 18px; margin-bottom: 20px; background: var(--color-primary-tint); border: 1px solid var(--color-primary-soft); border-radius: var(--radius-md); }
    .settlement-banner app-icon { color: var(--color-primary-dark); flex-shrink: 0; margin-top: 2px; }
    .settlement-banner-title { font-weight: 700; color: var(--color-text); font-size: .92rem; }
    .settlement-banner-amount { margin-left: 8px; color: var(--color-primary-dark); font-weight: 800; }
    .settlement-banner-desc { margin: 4px 0 0; font-size: .82rem; color: var(--color-text-secondary); line-height: 1.5; }
  `],
})
export class KantongAmalAdminReportsPage implements OnInit, KantongAmalAdminReportsView {
  private presenter = inject(KantongAmalAdminReportsPresenter);
  private amountChart: Chart | null = null;
  private ageChart: Chart | null = null;

  tab = signal<ReportTab>('balance-report');
  loading = signal(true);
  exporting = signal(false);

  from = isoDateDaysAgo(30);
  to = isoDateDaysAgo(0);
  campaignID: number | null = null;
  statusFilter = '';
  ledgerDirection = '';

  campaigns = signal<CampaignLite[]>([]);
  balance = signal<BalanceReport | null>(null);
  campaignRows = signal<CampaignReportRow[]>([]);
  donationRows = signal<DonationReportRow[]>([]);
  withdrawalRows = signal<WithdrawalReportRow[]>([]);
  withdrawalFunnel = signal<WithdrawalStatusFunnel[]>([]);
  ledgerGlobalRows = signal<GlobalLedgerRow[]>([]);
  analytics = signal<AnalyticsResponse | null>(null);
  reconciliation = signal<Reconciliation | null>(null);
  page = signal(1);
  count = signal(0);
  limit = 15;

  readonly formatRupiah = formatRupiah;
  readonly campaignStatusOptions = CAMPAIGN_STATUS_OPTIONS;
  readonly donationStatusOptions = DONATION_STATUS_OPTIONS;
  readonly withdrawalStatusOptions = WITHDRAWAL_STATUS_OPTIONS;
  readonly ledgerDirectionOptions = LEDGER_DIRECTION_OPTIONS;

  get campaignOptions(): SelectOption[] {
    return [{ value: null, label: 'Semua Campaign' }, ...this.campaigns().map((c) => ({ value: c.campaignID, label: c.title }))];
  }

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadCampaigns();
    // Landing tab = Balance Report (bukan Saldo) — ini yang paling sering
    // dicek admin saat pertama buka Laporan Kantong Amal.
    this.load();
  }

  switchTab(t: ReportTab): void {
    this.tab.set(t);
    this.page.set(1);
    this.statusFilter = '';
    this.load();
  }

  load(): void {
    switch (this.tab()) {
      case 'balance': this.loadBalance(); break;
      case 'campaigns': this.presenter.loadCampaignRows(this.page(), this.limit, this.statusFilter); break;
      case 'donations': this.presenter.loadDonations(this.page(), this.limit, this.statusFilter); break;
      case 'withdrawals': this.presenter.loadWithdrawals(this.page(), this.limit, this.statusFilter); break;
      case 'ledger-global': this.presenter.loadLedgerGlobal(this.page(), this.limit, this.campaignID, this.ledgerDirection); break;
      case 'analytics': this.presenter.loadAnalytics(this.campaignID); break;
      case 'balance-report': this.presenter.loadReconciliation(); break;
    }
  }

  loadBalance(): void { this.presenter.loadBalance(this.from, this.to, this.campaignID); }
  applyBalanceFilter(): void { this.loadBalance(); }
  applyStatusFilter(): void { this.page.set(1); this.load(); }
  applyLedgerFilter(): void { this.page.set(1); this.load(); }
  applyAnalyticsFilter(): void { this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }

  exportCurrent(): void {
    switch (this.tab()) {
      case 'balance': this.presenter.exportBalance(this.from, this.to, this.campaignID); break;
      case 'campaigns': this.presenter.exportCampaigns(this.statusFilter); break;
      case 'donations': this.presenter.exportDonations(this.statusFilter); break;
      case 'withdrawals': this.presenter.exportWithdrawals(this.statusFilter); break;
    }
  }

  funnelCount(status: string): number { return this.withdrawalFunnel().find((f) => f.status === status)?.count ?? 0; }

  campaignProgressPercent(r: CampaignReportRow): number {
    return r.targetAmount > 0 ? Math.min(100, Math.round((r.collectedAmount / r.targetAmount) * 100)) : 0;
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setExporting(exporting: boolean): void { this.exporting.set(exporting); }
  setCampaigns(campaigns: CampaignLite[]): void { this.campaigns.set(campaigns); }
  setBalance(balance: BalanceReport | null): void { this.balance.set(balance); }
  setCampaignRows(rows: CampaignReportRow[], count: number): void { this.campaignRows.set(rows); this.count.set(count); }
  setDonationRows(rows: DonationReportRow[], count: number): void { this.donationRows.set(rows); this.count.set(count); }
  setWithdrawalRows(rows: WithdrawalReportRow[], count: number, funnel: WithdrawalStatusFunnel[]): void {
    this.withdrawalRows.set(rows); this.count.set(count); this.withdrawalFunnel.set(funnel);
  }
  setLedgerGlobalRows(rows: GlobalLedgerRow[], count: number): void { this.ledgerGlobalRows.set(rows); this.count.set(count); }
  setReconciliation(r: Reconciliation | null): void { this.reconciliation.set(r); }

  setAnalytics(data: AnalyticsResponse | null): void {
    this.analytics.set(data);
    // Kanvas hanya ada di DOM setelah tab 'analitik' aktif & data ini di-set
    // (bersarang dalam @if) — tunda satu tick supaya ViewChild-less query
    // querySelector di bawah pasti menemukan elemennya.
    setTimeout(() => this.renderCharts(data), 0);
  }

  private renderCharts(data: AnalyticsResponse | null): void {
    this.amountChart?.destroy();
    this.ageChart?.destroy();
    this.amountChart = null;
    this.ageChart = null;
    if (!data) return;

    const amountCanvas = document.getElementById('donationAmountChart') as HTMLCanvasElement | null;
    if (amountCanvas) {
      this.amountChart = new Chart(amountCanvas, {
        type: 'bar',
        data: {
          labels: data.donationAmountBands.map((b) => b.bandLabel.replace(/^\d\.\s*/, '')),
          datasets: [{ label: 'Jumlah Donasi', data: data.donationAmountBands.map((b) => b.count), backgroundColor: '#00933b' }],
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
      });
    }

    const ageCanvas = document.getElementById('donorAgeChart') as HTMLCanvasElement | null;
    if (ageCanvas) {
      this.ageChart = new Chart(ageCanvas, {
        type: 'doughnut',
        data: {
          labels: data.donorAgeBands.map((b) => b.bandLabel.replace(/^\d\.\s*/, '')),
          datasets: [{ data: data.donorAgeBands.map((b) => b.count), backgroundColor: ['#00933b', '#00b34d', '#5cd685', '#a7ecc0', '#d7f3e2'] }],
        },
        options: { responsive: true },
      });
    }
  }
}
