import { CampaignLite } from '../../entities/campaign';
import { AnalyticsResponse, BalanceReport, CampaignReportRow, DonationReportRow, GlobalLedgerRow, Reconciliation, WithdrawalReportRow, WithdrawalStatusFunnel } from '../../entities/report';

export interface KantongAmalAdminReportsView {
  setLoading(loading: boolean): void;
  setExporting(exporting: boolean): void;
  setCampaigns(campaigns: CampaignLite[]): void;
  setBalance(balance: BalanceReport | null): void;
  setCampaignRows(rows: CampaignReportRow[], count: number): void;
  setDonationRows(rows: DonationReportRow[], count: number): void;
  setWithdrawalRows(rows: WithdrawalReportRow[], count: number, funnel: WithdrawalStatusFunnel[]): void;
  setLedgerGlobalRows(rows: GlobalLedgerRow[], count: number): void;
  setAnalytics(data: AnalyticsResponse | null): void;
  setReconciliation(r: Reconciliation | null): void;
}
