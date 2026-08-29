import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { BalanceReport, CampaignReportRow, DonationReportRow, ReconciliationSnapshot, WithdrawalReportRow, WithdrawalStatusFunnel } from '../entities/report';
import { FinanceAuditLogItem } from '../entities/audit-log';

interface WithdrawalReportEnvelope {
  items: Pagination<WithdrawalReportRow>;
  statusFunnel: WithdrawalStatusFunnel[];
}

/** Panggilan HTTP mentah laporan finance Kantong Amal (CMS) — §15/§16 techspec. */
@Injectable({ providedIn: 'root' })
export class ReportApiService {
  private api = inject(ApiService);

  balance(q: Record<string, unknown>): Observable<BalanceReport> { return this.api.get('/reports/kantong-amal/balance', q); }
  exportBalance(q: Record<string, unknown>): Observable<{ blob: Blob; filename: string }> { return this.api.getBlob('/reports/kantong-amal/balance/export', q); }

  campaigns(q: Record<string, unknown>): Observable<Pagination<CampaignReportRow>> { return this.api.get('/reports/kantong-amal/campaigns', q); }
  exportCampaigns(q: Record<string, unknown>): Observable<{ blob: Blob; filename: string }> { return this.api.getBlob('/reports/kantong-amal/campaigns/export', q); }

  donations(q: Record<string, unknown>): Observable<Pagination<DonationReportRow>> { return this.api.get('/reports/kantong-amal/donations', q); }
  exportDonations(q: Record<string, unknown>): Observable<{ blob: Blob; filename: string }> { return this.api.getBlob('/reports/kantong-amal/donations/export', q); }

  withdrawals(q: Record<string, unknown>): Observable<WithdrawalReportEnvelope> { return this.api.get('/reports/kantong-amal/withdrawals', q); }
  exportWithdrawals(q: Record<string, unknown>): Observable<{ blob: Blob; filename: string }> { return this.api.getBlob('/reports/kantong-amal/withdrawals/export', q); }

  reconciliationHistory(q: Record<string, unknown>): Observable<Pagination<ReconciliationSnapshot>> { return this.api.get('/reports/kantong-amal/reconciliation', q); }
  runReconciliation(): Observable<ReconciliationSnapshot> { return this.api.post('/reports/kantong-amal/reconciliation/run'); }

  auditLog(q: Record<string, unknown>): Observable<Pagination<FinanceAuditLogItem>> { return this.api.get('/reports/kantong-amal/audit-log', q); }
}
