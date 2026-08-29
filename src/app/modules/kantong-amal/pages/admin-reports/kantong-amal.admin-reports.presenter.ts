import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ReportRepository } from '../../repositories/report.repository';
import { KantongAmalAdminReportsView } from './kantong-amal.admin-reports.view';

@Injectable()
export class KantongAmalAdminReportsPresenter extends BasePresenter<KantongAmalAdminReportsView> {
  private reportRepo = inject(ReportRepository);

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

  loadCampaigns(page: number, limit: number, status: string): void {
    this.view.setLoading(true);
    this.reportRepo.campaigns({ page, limit, status: status || undefined }).subscribe({
      next: (p) => { this.view.setCampaignRows(p.data, p.count); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }

  exportCampaigns(status: string): void {
    this.view.setExporting(true);
    this.reportRepo.exportCampaigns({ status: status || undefined }).subscribe({
      next: () => this.view.setExporting(false),
      error: () => this.view.setExporting(false),
    });
  }

  loadDonations(page: number, limit: number, status: string): void {
    this.view.setLoading(true);
    this.reportRepo.donations({ page, limit, status: status || undefined }).subscribe({
      next: (p) => { this.view.setDonationRows(p.data, p.count); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }

  exportDonations(status: string): void {
    this.view.setExporting(true);
    this.reportRepo.exportDonations({ status: status || undefined }).subscribe({
      next: () => this.view.setExporting(false),
      error: () => this.view.setExporting(false),
    });
  }

  loadWithdrawals(page: number, limit: number, status: string): void {
    this.view.setLoading(true);
    this.reportRepo.withdrawals({ page, limit, status: status || undefined }).subscribe({
      next: (r) => { this.view.setWithdrawalRows(r.items.data, r.items.count, r.statusFunnel); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }

  exportWithdrawals(status: string): void {
    this.view.setExporting(true);
    this.reportRepo.exportWithdrawals({ status: status || undefined }).subscribe({
      next: () => this.view.setExporting(false),
      error: () => this.view.setExporting(false),
    });
  }
}
