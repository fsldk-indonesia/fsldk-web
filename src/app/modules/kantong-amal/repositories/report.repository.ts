import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ReportApiService } from '../services/report-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { BalanceReport, CampaignReportRow, DonationReportRow, ReconciliationSnapshot, WithdrawalReportRow, WithdrawalStatusFunnel } from '../entities/report';
import { FinanceAuditLogItem } from '../entities/audit-log';

@Injectable({ providedIn: 'root' })
export class ReportRepository {
  private api = inject(ReportApiService);

  balance(q: Record<string, unknown>): Observable<BalanceReport> { return this.api.balance(q); }
  exportBalance(q: Record<string, unknown>): Observable<{ blob: Blob; filename: string }> { return this.api.exportBalance(q).pipe(tap((r) => this.triggerDownload(r))); }

  campaigns(q: Record<string, unknown>): Observable<Pagination<CampaignReportRow>> { return this.api.campaigns(q); }
  exportCampaigns(q: Record<string, unknown>): Observable<{ blob: Blob; filename: string }> { return this.api.exportCampaigns(q).pipe(tap((r) => this.triggerDownload(r))); }

  donations(q: Record<string, unknown>): Observable<Pagination<DonationReportRow>> { return this.api.donations(q); }
  exportDonations(q: Record<string, unknown>): Observable<{ blob: Blob; filename: string }> { return this.api.exportDonations(q).pipe(tap((r) => this.triggerDownload(r))); }

  withdrawals(q: Record<string, unknown>): Observable<{ items: Pagination<WithdrawalReportRow>; statusFunnel: WithdrawalStatusFunnel[] }> { return this.api.withdrawals(q); }
  exportWithdrawals(q: Record<string, unknown>): Observable<{ blob: Blob; filename: string }> { return this.api.exportWithdrawals(q).pipe(tap((r) => this.triggerDownload(r))); }

  reconciliationHistory(q: Record<string, unknown>): Observable<Pagination<ReconciliationSnapshot>> { return this.api.reconciliationHistory(q); }
  runReconciliation(): Observable<ReconciliationSnapshot> { return this.api.runReconciliation(); }

  auditLog(q: Record<string, unknown>): Observable<Pagination<FinanceAuditLogItem>> { return this.api.auditLog(q); }

  private triggerDownload(result: { blob: Blob; filename: string }): void {
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
