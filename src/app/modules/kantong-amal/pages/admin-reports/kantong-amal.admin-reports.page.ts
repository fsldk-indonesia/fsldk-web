import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { CampaignLite } from '../../entities/campaign';
import { AnalyticsResponse, BalanceReport, CampaignReportRow, DonationReportRow, GlobalLedgerRow, Reconciliation, WithdrawalReportRow, WithdrawalStatusFunnel } from '../../entities/report';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { DateRange, DateRangePickerComponent } from '../../../../shared/date-range-picker.component';
import { IconComponent } from '../../../../shared/icon.component';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
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

/** Config CmsIndexConfig<CampaignReportRow> — laporan murni baca (tanpa
 *  createRoute/bulkDelete/showActionsColumn), backend belum punya sort
 *  dinamis untuk query laporan (selalu createdDate DESC), jadi semua kolom
 *  sortable:false. */
function buildCampaignsReportConfig(): CmsIndexConfig<CampaignReportRow> {
  return {
    entityLabel: 'campaign',
    statusOptions: [
      { value: 'PUBLISHED', label: 'Tayang' },
      { value: 'COMPLETED', label: 'Selesai' },
      { value: 'PAUSED', label: 'Dijeda' },
      { value: 'ARCHIVED', label: 'Diarsipkan' },
    ],
    searchTargets: [{ value: 'search', label: 'Judul Campaign' }],
    columns: [
      { key: 'title', label: 'Campaign', locked: true, sortable: false },
      { key: 'status', label: 'Status', sortable: false },
      { key: 'targetAmount', label: 'Target', sortable: false },
      { key: 'collectedAmount', label: 'Terkumpul', sortable: false },
      { key: 'donorCount', label: 'Donor', sortable: false },
      { key: 'transactionCount', label: 'Transaksi', sortable: false },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'campaignID',
    limit: 15,
    emptyIcon: 'hand-heart',
    emptyTitle: 'Tidak ada data',
    emptyDescription: 'Laporan campaign akan muncul di sini.',
  };
}

function buildDonationsReportConfig(): CmsIndexConfig<DonationReportRow> {
  return {
    entityLabel: 'donasi',
    statusOptions: [
      { value: 'PAID', label: 'Lunas' },
      { value: 'PENDING', label: 'Menunggu' },
      { value: 'EXPIRED', label: 'Kedaluwarsa' },
      { value: 'FAILED', label: 'Gagal' },
    ],
    searchTargets: [{ value: 'search', label: 'Donatur / Campaign' }],
    columns: [
      { key: 'campaignTitle', label: 'Campaign', locked: true, sortable: false },
      { key: 'donorName', label: 'Donatur', sortable: false },
      { key: 'amount', label: 'Nominal', sortable: false },
      { key: 'adminFee', label: 'Fee', sortable: false },
      { key: 'paymentStatus', label: 'Status', sortable: false },
      { key: 'createdDate', label: 'Tanggal', sortable: false },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'donationID',
    limit: 15,
    emptyIcon: 'hand-coins',
    emptyTitle: 'Tidak ada data',
    emptyDescription: 'Laporan donasi akan muncul di sini.',
  };
}

function buildWithdrawalsReportConfig(): CmsIndexConfig<WithdrawalReportRow> {
  return {
    entityLabel: 'withdrawal',
    statusOptions: [
      { value: 'SUCCESS', label: 'Berhasil' },
      { value: 'APPROVED', label: 'Siap Diproses' },
      { value: 'REJECTED', label: 'Ditolak' },
      { value: 'FAILED', label: 'Gagal' },
    ],
    searchTargets: [{ value: 'search', label: 'Ref / Campaign' }],
    columns: [
      { key: 'withdrawalRef', label: 'Ref', locked: true, sortable: false },
      { key: 'campaignTitle', label: 'Campaign', sortable: false },
      { key: 'amount', label: 'Nominal', sortable: false },
      { key: 'netAmount', label: 'Net', sortable: false },
      { key: 'status', label: 'Status', sortable: false },
      { key: 'requestedDate', label: 'Diajukan', sortable: false },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'withdrawalID',
    limit: 15,
    emptyIcon: 'hand-coins',
    emptyTitle: 'Tidak ada data',
    emptyDescription: 'Laporan withdrawal akan muncul di sini.',
  };
}

/** Arah (Kredit/Debit) genuinely multi-select bermakna lewat statusOptions
 *  (2 nilai, klausa IN di backend) — campaignID tetap dropdown terpisah di
 *  luar CmsIndexComponent karena juga dipakai tab Saldo/Analitik. */
function buildLedgerGlobalReportConfig(): CmsIndexConfig<GlobalLedgerRow> {
  return {
    entityLabel: 'mutasi',
    statusOptions: [
      { value: 'CREDIT', label: 'Kredit (Masuk)' },
      { value: 'DEBIT', label: 'Debit (Keluar)' },
    ],
    searchTargets: [{ value: 'search', label: 'Campaign' }],
    columns: [
      { key: 'createdDate', label: 'Tanggal', locked: true, sortable: false },
      { key: 'campaignTitle', label: 'Campaign', sortable: false },
      { key: 'entryType', label: 'Tipe', sortable: false },
      { key: 'direction', label: 'Arah', sortable: false },
      { key: 'amount', label: 'Nominal', sortable: false },
      { key: 'balanceAfter', label: 'Saldo Setelah', sortable: false },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'ledgerID',
    limit: 15,
    emptyIcon: 'chart-bar',
    emptyTitle: 'Tidak ada data',
    emptyDescription: 'Khusus dana dari Amdigipay-Bisatopup — donasi manual tidak pernah masuk ledger ini.',
  };
}

@Component({
  selector: 'app-kantong-amal-admin-reports-page',
  standalone: true,
  templateUrl: './kantong-amal.admin-reports.page.html',
  imports: [DatePipe, FormsModule, SelectComponent, DateRangePickerComponent, IconComponent, CmsIndexComponent],
  providers: [KantongAmalAdminReportsPresenter],
  styles: [`
    .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--color-border); margin-bottom: 20px; flex-wrap: wrap; }
    .tabs button { padding: 10px 16px; border: none; background: none; cursor: pointer; font-weight: 600; color: var(--color-text-secondary); border-bottom: 2px solid transparent; transition: color var(--motion-fast) ease, border-color var(--motion-fast) ease; }
    .tabs button:hover { color: var(--color-primary-dark); }
    .tabs button.active { color: var(--color-primary-dark); border-bottom-color: var(--color-primary); }
    .filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; margin-bottom: 16px; }
    .filters > div { display: flex; flex-direction: column; gap: 4px; }

    /* Setiap tab dibungkus .tab-panel — @if membuat ulang node ini tiap kali
       tab berganti, jadi animasi CSS di bawah otomatis replay setiap switch
       tanpa perlu Angular animations module. */
    .tab-panel { animation: tab-fade-in .28s ease; }
    @keyframes tab-fade-in {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 16px;
      font-family: var(--font-heading); font-weight: 700; font-size: .78rem;
      letter-spacing: .08em; text-transform: uppercase; color: var(--color-primary-dark);
    }

    /* Kartu statistik ber-icon-badge — pola sama seperti Analitik Formulir
       Dinamis, dipakai di semua grid saldo/reconciliation di halaman ini. */
    .stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
    .stat-row-3 { grid-template-columns: repeat(3, 1fr); }
    .stat-row-6 { grid-template-columns: repeat(6, 1fr); margin-bottom: 16px; }
    @media (max-width: 900px) { .stat-row, .stat-row-3 { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 900px) { .stat-row-6 { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 640px) { .stat-row-6 { grid-template-columns: repeat(2, 1fr); } }
    /* Di layar ponsel, 2 kolom (apalagi 3 utk stat-row-6) sudah terlalu
       sempit untuk value bold 1.2rem + label — overflow-wrap:anywhere di
       .stat-card-value jadi kepakai beneran (bukan cuma jaring pengaman utk
       string panjang tak terputus), memutus kata biasa di tengah ("Gateway"
       -> "Gatew"/"ay", "Seimbang" -> "Seim"/"bang", bahkan angka "Rp 600.000"
       -> "600."/"000") — dilaporkan "dempet dan kelihatan jelek". Breakpoint
       dinaikkan dari 560 ke 640px (masih tetap "mepet" di beberapa ponsel di
       560px). 1 kolom penuh + value dipaksa SATU BARIS (white-space:nowrap,
       overflow-wrap dikembalikan ke normal) — nilai di halaman ini SELALU
       pendek (format Rupiah atau status singkat), jadi 1 kartu selebar penuh
       lebih dari cukup untuk menampungnya tanpa wrap sama sekali; font value
       juga diperkecil supaya makin lega/enak dilihat sesuai permintaan. */
    @media (max-width: 640px) {
      .stat-row, .stat-row-3 { grid-template-columns: 1fr; }
      .stat-card-value { font-size: .98rem; white-space: nowrap; overflow-wrap: normal; }
      .stat-card { padding: 14px 16px; gap: 12px; min-height: 0; }
    }
    @media (max-width: 460px) { .stat-row-6 { grid-template-columns: 1fr; } }
    .stat-card {
      display: flex; align-items: center; gap: 14px; padding: 16px 18px; min-height: 84px;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm); transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease;
    }
    .stat-card:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
    .stat-card-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .stat-card-value { font-family: var(--font-heading); font-weight: 800; font-size: 1.2rem; line-height: 1.25; color: var(--color-text); overflow-wrap: anywhere; }
    .stat-card-label { font-size: .76rem; color: var(--color-text-secondary); font-weight: 600; line-height: 1.35; }
    .stat-card-hint { font-size: .72rem; color: var(--color-muted); margin-top: 2px; }
    .balanced-ok { color: #166534; } .balanced-bad { color: #991b1b; }

    .direction-badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: .76rem; font-weight: 700; }
    .direction-CREDIT { background: #dcfce7; color: #166534; }
    .direction-DEBIT { background: #fee2e2; color: #991b1b; }
    .analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    @media (max-width: 900px) { .analytics-grid { grid-template-columns: 1fr; } }
    .analytics-card canvas { max-height: 260px; }

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

  /** Satu-satunya <app-cms-index> yang bisa aktif dalam satu waktu (tiap tab
   *  membungkus instance-nya sendiri dalam @if) — dipakai untuk refresh()
   *  manual saat filter campaignID tab Debit Kredit Global berubah (filter
   *  itu dropdown terpisah, di luar kontrak CmsListParams). */
  @ViewChild(CmsIndexComponent) private activeTable?: CmsIndexComponent<unknown>;

  tab = signal<ReportTab>('balance-report');
  loading = signal(true);
  exporting = signal(false);

  from = isoDateDaysAgo(30);
  to = isoDateDaysAgo(0);
  campaignID: number | null = null;

  campaigns = signal<CampaignLite[]>([]);
  balance = signal<BalanceReport | null>(null);
  withdrawalFunnel = signal<WithdrawalStatusFunnel[]>([]);
  analytics = signal<AnalyticsResponse | null>(null);
  reconciliation = signal<Reconciliation | null>(null);

  readonly formatRupiah = formatRupiah;

  readonly campaignsConfig = buildCampaignsReportConfig();
  readonly donationsConfig = buildDonationsReportConfig();
  readonly withdrawalsConfig = buildWithdrawalsReportConfig();
  readonly ledgerGlobalConfig = buildLedgerGlobalReportConfig();

  campaignsDataSource = (params: CmsListParams) => this.presenter.campaignsList(params);
  donationsDataSource = (params: CmsListParams) => this.presenter.donationsList(params);
  withdrawalsDataSource = (params: CmsListParams) => this.presenter.withdrawalsList(params);
  ledgerGlobalDataSource = (params: CmsListParams) => this.presenter.ledgerGlobalList(params, this.campaignID);

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
    this.load();
  }

  /** Tab campaigns/donations/withdrawals/ledger-global sudah membawa
   *  <app-cms-index> sendiri (self-loading lewat ngOnInit saat @if
   *  me-remount-nya) — cuma tab non-list yang masih butuh imperative load. */
  load(): void {
    switch (this.tab()) {
      case 'balance': this.loadBalance(); break;
      case 'withdrawals': this.presenter.loadWithdrawalFunnel(null); break;
      case 'analytics': this.presenter.loadAnalytics(this.campaignID); break;
      case 'balance-report': this.presenter.loadReconciliation(); break;
    }
  }

  loadBalance(): void { this.presenter.loadBalance(this.from, this.to, this.campaignID); }
  applyBalanceFilter(): void { this.loadBalance(); }
  onBalanceRangeChange(r: DateRange): void { this.from = r.from; this.to = r.to; this.applyBalanceFilter(); }
  applyAnalyticsFilter(): void { this.load(); }
  /** Tab Debit Kredit Global — campaignID adalah dropdown terpisah di luar
   *  CmsListParams, jadi perubahan filternya harus memicu refresh manual. */
  applyLedgerCampaignFilter(): void { this.activeTable?.refresh(); }

  exportCurrent(): void {
    switch (this.tab()) {
      case 'balance': this.presenter.exportBalance(this.from, this.to, this.campaignID); break;
      case 'campaigns': this.presenter.exportCampaigns(''); break;
      case 'donations': this.presenter.exportDonations(''); break;
      case 'withdrawals': this.presenter.exportWithdrawals(''); break;
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
  setWithdrawalFunnel(funnel: WithdrawalStatusFunnel[]): void { this.withdrawalFunnel.set(funnel); }
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
