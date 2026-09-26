import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { CampaignRepository } from '../../repositories/campaign.repository';
import { ReportRepository } from '../../repositories/report.repository';
import { CampaignReportRow, DonationReportRow, GlobalLedgerRow, WithdrawalReportRow } from '../../entities/report';
import { KantongAmalAdminReportsView } from './kantong-amal.admin-reports.view';

@Injectable()
export class KantongAmalAdminReportsPresenter extends BasePresenter<KantongAmalAdminReportsView> {
  private campaignRepo = inject(CampaignRepository);
  private reportRepo = inject(ReportRepository);

  loadCampaigns(): void {
    this.campaignRepo.cmsLite().subscribe({ next: (c) => this.view.setCampaigns(c), error: () => this.view.setCampaigns([]) });
  }

  loadBalance(from: string, to: string, campaignID: number | null): void {
    this.view.setLoading(true);
    this.reportRepo.balance({ from, to, campaignID: campaignID || undefined }).subscribe({
      next: (b) => { this.view.setBalance(b); this.view.setLoading(false); },
      error: () => { this.view.setBalance(null); this.view.setLoading(false); },
    });
  }

  exportBalance(from: string, to: string, campaignID: number | null): void {
    this.view.setExporting(true);
    this.reportRepo.exportBalance({ from, to, campaignID: campaignID || undefined }).subscribe({
      next: () => this.view.setExporting(false),
      error: () => this.view.setExporting(false),
    });
  }

  /** dataSource untuk <app-cms-index> tab Campaign — Status genuinely
   *  multi-select bermakna, search mencocokkan judul campaign. */
  campaignsList(params: CmsListParams): Observable<Pagination<CampaignReportRow>> {
    return this.reportRepo.campaigns({
      page: params.page, limit: params.limit,
      search: (params.filters['search'] ?? [])[0] ?? '',
      status: params.status.join(','),
    });
  }

  exportCampaigns(status: string): void {
    this.view.setExporting(true);
    this.reportRepo.exportCampaigns({ status: status || undefined }).subscribe({
      next: () => this.view.setExporting(false),
      error: () => this.view.setExporting(false),
    });
  }

  /** dataSource untuk <app-cms-index> tab Donasi. */
  donationsList(params: CmsListParams): Observable<Pagination<DonationReportRow>> {
    return this.reportRepo.donations({
      page: params.page, limit: params.limit,
      search: (params.filters['search'] ?? [])[0] ?? '',
      status: params.status.join(','),
    });
  }

  exportDonations(status: string): void {
    this.view.setExporting(true);
    this.reportRepo.exportDonations({ status: status || undefined }).subscribe({
      next: () => this.view.setExporting(false),
      error: () => this.view.setExporting(false),
    });
  }

  /** dataSource untuk <app-cms-index> tab Withdrawal — funnel status di-load
   *  terpisah lewat loadWithdrawalFunnel() (lihat catatan report-api.service.ts). */
  withdrawalsList(params: CmsListParams): Observable<Pagination<WithdrawalReportRow>> {
    return this.reportRepo.withdrawals({
      page: params.page, limit: params.limit,
      search: (params.filters['search'] ?? [])[0] ?? '',
      status: params.status.join(','),
    }).pipe(map((r) => r.items));
  }

  loadWithdrawalFunnel(campaignID: number | null): void {
    this.reportRepo.withdrawalFunnel(campaignID || undefined).subscribe({
      next: (funnel) => this.view.setWithdrawalFunnel(funnel),
      error: () => {},
    });
  }

  exportWithdrawals(status: string): void {
    this.view.setExporting(true);
    this.reportRepo.exportWithdrawals({ status: status || undefined }).subscribe({
      next: () => this.view.setExporting(false),
      error: () => this.view.setExporting(false),
    });
  }

  /** dataSource untuk <app-cms-index> tab Debit Kredit Global — Arah genuinely
   *  multi-select bermakna (2 nilai, CREDIT/DEBIT), search mencocokkan judul
   *  campaign. campaignID tetap filter terpisah (dropdown di luar CmsIndexComponent). */
  ledgerGlobalList(params: CmsListParams, campaignID: number | null): Observable<Pagination<GlobalLedgerRow>> {
    return this.reportRepo.ledgerGlobal({
      page: params.page, limit: params.limit,
      search: (params.filters['search'] ?? [])[0] ?? '',
      direction: params.status.join(','),
      campaignID: campaignID || undefined,
    });
  }

  loadAnalytics(campaignID: number | null): void {
    this.view.setLoading(true);
    this.reportRepo.analytics(campaignID || undefined).subscribe({
      next: (data) => { this.view.setAnalytics(data); this.view.setLoading(false); },
      error: () => { this.view.setAnalytics(null); this.view.setLoading(false); },
    });
  }

  /** Balance Report — bandingkan saldo wallet Bisatopup (live, via gateway)
   *  terhadap ledger internal, khusus donasi QRIS/Bisatopup. Setara "Balance
   *  Report" ldksyahid-app; dihitung LIVE tiap dipanggil, tidak lagi
   *  dipersist sebagai histori snapshot. */
  loadReconciliation(): void {
    this.view.setLoading(true);
    this.reportRepo.reconciliation().subscribe({
      next: (r) => { this.view.setReconciliation(r); this.view.setLoading(false); },
      error: () => { this.view.setReconciliation(null); this.view.setLoading(false); },
    });
  }
}
