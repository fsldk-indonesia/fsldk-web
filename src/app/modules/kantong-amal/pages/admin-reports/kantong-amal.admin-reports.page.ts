import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BalanceReport, CampaignReportRow, DonationReportRow, WithdrawalReportRow, WithdrawalStatusFunnel } from '../../entities/report';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { KantongAmalAdminReportsPresenter } from './kantong-amal.admin-reports.presenter';
import { KantongAmalAdminReportsView } from './kantong-amal.admin-reports.view';

type ReportTab = 'balance' | 'campaigns' | 'donations' | 'withdrawals';

function isoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-kantong-amal-admin-reports-page',
  standalone: true,
  templateUrl: './kantong-amal.admin-reports.page.html',
  imports: [DatePipe, FormsModule, PaginationComponent],
  providers: [KantongAmalAdminReportsPresenter],
  styles: [`
    .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--color-border); margin-bottom: 20px; }
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
  `],
})
export class KantongAmalAdminReportsPage implements OnInit, KantongAmalAdminReportsView {
  private presenter = inject(KantongAmalAdminReportsPresenter);

  tab = signal<ReportTab>('balance');
  loading = signal(true);
  exporting = signal(false);

  from = isoDateDaysAgo(30);
  to = isoDateDaysAgo(0);
  campaignID: number | null = null;
  statusFilter = '';

  balance = signal<BalanceReport | null>(null);
  campaignRows = signal<CampaignReportRow[]>([]);
  donationRows = signal<DonationReportRow[]>([]);
  withdrawalRows = signal<WithdrawalReportRow[]>([]);
  withdrawalFunnel = signal<WithdrawalStatusFunnel[]>([]);
  page = signal(1);
  count = signal(0);
  limit = 15;

  readonly formatRupiah = formatRupiah;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.loadBalance();
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
      case 'campaigns': this.presenter.loadCampaigns(this.page(), this.limit, this.statusFilter); break;
      case 'donations': this.presenter.loadDonations(this.page(), this.limit, this.statusFilter); break;
      case 'withdrawals': this.presenter.loadWithdrawals(this.page(), this.limit, this.statusFilter); break;
    }
  }

  loadBalance(): void { this.presenter.loadBalance(this.from, this.to, this.campaignID); }
  applyBalanceFilter(): void { this.loadBalance(); }
  applyStatusFilter(): void { this.page.set(1); this.load(); }
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

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setExporting(exporting: boolean): void { this.exporting.set(exporting); }
  setBalance(balance: BalanceReport | null): void { this.balance.set(balance); }
  setCampaignRows(rows: CampaignReportRow[], count: number): void { this.campaignRows.set(rows); this.count.set(count); }
  setDonationRows(rows: DonationReportRow[], count: number): void { this.donationRows.set(rows); this.count.set(count); }
  setWithdrawalRows(rows: WithdrawalReportRow[], count: number, funnel: WithdrawalStatusFunnel[]): void {
    this.withdrawalRows.set(rows); this.count.set(count); this.withdrawalFunnel.set(funnel);
  }
}
